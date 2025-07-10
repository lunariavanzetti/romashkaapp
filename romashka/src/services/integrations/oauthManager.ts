import { supabase } from '../supabaseClient';

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope?: string;
  authUrl: string;
  tokenUrl: string;
  provider: string;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  tokenType: string;
  scope?: string;
}

export interface OAuthState {
  provider: string;
  userId: string;
  integrationId?: string;
  returnUrl?: string;
  nonce: string;
}

export class OAuthManager {
  private static instance: OAuthManager;
  private readonly ENCRYPTION_KEY = 'default-key-change-in-production';
  
  static getInstance(): OAuthManager {
    if (!OAuthManager.instance) {
      OAuthManager.instance = new OAuthManager();
    }
    return OAuthManager.instance;
  }

  // Generate OAuth authorization URL
  async generateAuthUrl(config: OAuthConfig, state: OAuthState): Promise<string> {
    const stateString = this.encryptState(state);
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scope || '',
      state: stateString,
      access_type: 'offline', // For refresh tokens
      approval_prompt: 'force' // Force consent screen
    });

    return `${config.authUrl}?${params.toString()}`;
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(config: OAuthConfig, code: string, state: string): Promise<OAuthTokens> {
    try {
      const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: config.redirectUri,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_in ? Date.now() + (data.expires_in * 1000) : undefined,
        tokenType: data.token_type || 'Bearer',
        scope: data.scope,
      };
    } catch (error) {
      console.error('OAuth token exchange failed:', error);
      throw error;
    }
  }

  // Refresh access token using refresh token
  async refreshToken(config: OAuthConfig, refreshToken: string): Promise<OAuthTokens> {
    try {
      const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken, // Keep old refresh token if new one not provided
        expiresAt: data.expires_in ? Date.now() + (data.expires_in * 1000) : undefined,
        tokenType: data.token_type || 'Bearer',
        scope: data.scope,
      };
    } catch (error) {
      console.error('OAuth token refresh failed:', error);
      throw error;
    }
  }

  // Store encrypted tokens in database
  async storeTokens(integrationId: string, tokens: OAuthTokens): Promise<void> {
    try {
      const encryptedTokens = this.encryptTokens(tokens);
      
      const { error } = await supabase
        .from('integrations')
        .update({
          credentials: encryptedTokens,
          updated_at: new Date().toISOString()
        })
        .eq('id', integrationId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to store tokens:', error);
      throw error;
    }
  }

  // Retrieve and decrypt tokens from database
  async getTokens(integrationId: string): Promise<OAuthTokens | null> {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('credentials')
        .eq('id', integrationId)
        .single();

      if (error) throw error;
      if (!data?.credentials) return null;

      return this.decryptTokens(data.credentials);
    } catch (error) {
      console.error('Failed to retrieve tokens:', error);
      return null;
    }
  }

  // Get valid access token (refresh if needed)
  async getValidAccessToken(integrationId: string, config: OAuthConfig): Promise<string> {
    const tokens = await this.getTokens(integrationId);
    if (!tokens) throw new Error('No tokens found for integration');

    // Check if token is still valid
    if (tokens.expiresAt && Date.now() >= tokens.expiresAt) {
      if (!tokens.refreshToken) {
        throw new Error('Token expired and no refresh token available');
      }

      // Refresh the token
      const newTokens = await this.refreshToken(config, tokens.refreshToken);
      await this.storeTokens(integrationId, newTokens);
      return newTokens.accessToken;
    }

    return tokens.accessToken;
  }

  // Test OAuth connection
  async testConnection(integrationId: string, config: OAuthConfig, testEndpoint: string): Promise<boolean> {
    try {
      const accessToken = await this.getValidAccessToken(integrationId, config);
      
      const response = await fetch(testEndpoint, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('OAuth connection test failed:', error);
      return false;
    }
  }

  // Revoke tokens
  async revokeTokens(integrationId: string, config: OAuthConfig): Promise<void> {
    try {
      const tokens = await this.getTokens(integrationId);
      if (!tokens) return;

      // Try to revoke tokens at the provider
      if (config.provider === 'google') {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${tokens.accessToken}`, {
          method: 'POST',
        });
      }

      // Clear tokens from database
      await supabase
        .from('integrations')
        .update({
          credentials: {},
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('id', integrationId);
    } catch (error) {
      console.error('Failed to revoke tokens:', error);
      throw error;
    }
  }

  // Decrypt state parameter
  decryptState(encryptedState: string): OAuthState {
    try {
      // Simple base64 decoding for now - in production use proper encryption
      const decoded = atob(encryptedState);
      return JSON.parse(decoded);
    } catch (error) {
      throw new Error('Invalid state parameter');
    }
  }

  // Private helper methods
  private encryptState(state: OAuthState): string {
    // Simple base64 encoding for now - in production use proper encryption
    return btoa(JSON.stringify(state));
  }

  private encryptTokens(tokens: OAuthTokens): any {
    // In production, use proper encryption like AES-256
    // For now, we'll use base64 encoding
    return {
      encrypted_data: btoa(JSON.stringify(tokens)),
      encryption_method: 'base64', // Change to AES-256 in production
      encrypted_at: new Date().toISOString()
    };
  }

  private decryptTokens(encryptedData: any): OAuthTokens {
    // In production, use proper decryption
    try {
      const decoded = atob(encryptedData.encrypted_data);
      return JSON.parse(decoded);
    } catch (error) {
      throw new Error('Failed to decrypt tokens');
    }
  }

  // Provider-specific OAuth configurations
  static getProviderConfig(provider: string, baseUrl: string): Partial<OAuthConfig> {
    const configs: Record<string, Partial<OAuthConfig>> = {
      salesforce: {
        authUrl: 'https://login.salesforce.com/services/oauth2/authorize',
        tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
        scope: 'api refresh_token offline_access',
        redirectUri: `${baseUrl}/integrations/oauth/callback/salesforce`,
      },
      hubspot: {
        authUrl: 'https://app.hubspot.com/oauth/authorize',
        tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
        scope: 'contacts crm.objects.deals.read crm.objects.companies.read crm.objects.contacts.read crm.objects.deals.write crm.objects.companies.write crm.objects.contacts.write',
        redirectUri: `${baseUrl}/integrations/oauth/callback/hubspot`,
      },
      zendesk: {
        authUrl: 'https://{subdomain}.zendesk.com/oauth/authorizations/new',
        tokenUrl: 'https://{subdomain}.zendesk.com/oauth/tokens',
        scope: 'read write',
        redirectUri: `${baseUrl}/integrations/oauth/callback/zendesk`,
      },
      shopify: {
        authUrl: 'https://{shop}.myshopify.com/admin/oauth/authorize',
        tokenUrl: 'https://{shop}.myshopify.com/admin/oauth/access_token',
        scope: 'read_customers,read_orders,read_products,write_customers',
        redirectUri: `${baseUrl}/integrations/oauth/callback/shopify`,
      },
      google: {
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email',
        redirectUri: `${baseUrl}/integrations/oauth/callback/google`,
      },
      microsoft: {
        authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        scope: 'https://graph.microsoft.com/calendars.readwrite https://graph.microsoft.com/user.read',
        redirectUri: `${baseUrl}/integrations/oauth/callback/microsoft`,
      },
      intercom: {
        authUrl: 'https://app.intercom.com/oauth',
        tokenUrl: 'https://api.intercom.io/auth/eagle/token',
        scope: 'read_users write_users read_conversations write_conversations',
        redirectUri: `${baseUrl}/integrations/oauth/callback/intercom`,
      },
      freshdesk: {
        authUrl: 'https://{domain}.freshdesk.com/oauth/authorize',
        tokenUrl: 'https://{domain}.freshdesk.com/oauth/token',
        scope: 'tickets:read tickets:write contacts:read contacts:write',
        redirectUri: `${baseUrl}/integrations/oauth/callback/freshdesk`,
      },
    };

    return configs[provider] || {};
  }
}

export const oauthManager = OAuthManager.getInstance();