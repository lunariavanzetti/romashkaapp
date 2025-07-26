/**
 * HubSpot Integration Service
 * Handles OAuth authentication, API calls, and data synchronization for HubSpot
 */

import { supabase } from '../supabaseClient';

export interface HubSpotConfig {
  clientId: string;
  clientSecret: string;
  scopes: string[];
  redirectUri: string;
}

export interface HubSpotTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface HubSpotTokenInfo {
  token: string;
  user: string;
  hub_domain: string;
  scopes: string[];
  scope_to_scope_group_pks: number[];
  trial_scopes: string[];
  trial_scope_to_scope_group_pks: number[];
  hub_id: number;
  app_id: number;
  expires_at: number;
  user_id: number;
  token_type: string;
}

export interface HubSpotContact {
  id: string;
  properties: {
    createdate: string;
    email: string;
    firstname: string;
    lastmodifieddate: string;
    lastname: string;
    phone: string;
    company: string;
    jobtitle: string;
    lifecyclestage: string;
    hs_lead_source: string;
  };
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

export interface HubSpotDeal {
  id: string;
  properties: {
    amount: string;
    closedate: string;
    createdate: string;
    dealname: string;
    dealstage: string;
    hs_lastmodifieddate: string;
    hs_deal_stage_probability: string;
    pipeline: string;
    dealtype: string;
    hs_deal_source_id: string;
  };
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

export interface HubSpotCompany {
  id: string;
  properties: {
    createdate: string;
    domain: string;
    hs_lastmodifieddate: string;
    name: string;
    phone: string;
    city: string;
    state: string;
    country: string;
    industry: string;
  };
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

export class HubSpotIntegrationService {
  private config: HubSpotConfig;

  constructor(config: HubSpotConfig) {
    this.config = config;
  }

  /**
   * Generate OAuth authorization URL
   */
  generateAuthUrl(state?: string): string {
    const baseUrl = 'https://app.hubspot.com/oauth/authorize';
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      scope: this.config.scopes.join(' '),
      redirect_uri: this.config.redirectUri,
      state: state || '',
    });

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<HubSpotTokenResponse> {
    try {
      const tokenUrl = 'https://api.hubapi.com/oauth/v1/token';
      
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
        code,
      });

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token exchange failed: ${response.statusText} - ${errorText}`);
      }

      const tokenData = await response.json() as HubSpotTokenResponse;
      
      // Log successful OAuth
      await this.logIntegrationAction('oauth_connect', 'success', 'OAuth connection established', {
        expires_in: tokenData.expires_in
      });

      return tokenData;
    } catch (error) {
      await this.logIntegrationAction('oauth_connect', 'error', `OAuth failed: ${error}`);
      throw error;
    }
  }

  /**
   * Store OAuth token in database
   */
  async storeOAuthToken(
    userId: string,
    tokenData: HubSpotTokenResponse
  ): Promise<string> {
    try {
      // Get token info to extract portal details
      const tokenInfo = await this.getTokenInfo(tokenData.access_token);

      // Store OAuth token
      const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
      
      const { data: tokenRow, error: tokenError } = await supabase!
        .from('oauth_tokens')
        .insert({
          user_id: userId,
          provider: 'hubspot',
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_type: tokenData.token_type,
          expires_at: expiresAt.toISOString(),
          store_identifier: tokenInfo.hub_id.toString(),
        })
        .select()
        .single();

      if (tokenError) throw tokenError;

      // Store HubSpot-specific data
      const { data: portalRow, error: portalError } = await supabase!
        .from('hubspot_portals')
        .insert({
          user_id: userId,
          oauth_token_id: tokenRow.id,
          portal_id: tokenInfo.hub_id.toString(),
          hub_domain: tokenInfo.hub_domain,
          hub_id: tokenInfo.hub_id.toString(),
        })
        .select()
        .single();

      if (portalError) throw portalError;

      await this.logIntegrationAction('portal_setup', 'success', 'HubSpot portal connected', {
        portal_id: tokenInfo.hub_id,
        hub_domain: tokenInfo.hub_domain
      });

      return tokenRow.id;
    } catch (error) {
      await this.logIntegrationAction('portal_setup', 'error', `Portal setup failed: ${error}`);
      throw error;
    }
  }

  /**
   * Get token information
   */
  private async getTokenInfo(accessToken: string): Promise<HubSpotTokenInfo> {
    const response = await this.makeHubSpotRequest(
      accessToken,
      'https://api.hubapi.com/oauth/v1/access-tokens/' + accessToken
    );
    return response;
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<HubSpotTokenResponse> {
    try {
      const tokenUrl = 'https://api.hubapi.com/oauth/v1/token';
      
      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: refreshToken,
      });

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      await this.logIntegrationAction('token_refresh', 'error', `Token refresh failed: ${error}`);
      throw error;
    }
  }

  /**
   * Test API connection
   */
  async testConnection(accessToken: string): Promise<boolean> {
    try {
      await this.getTokenInfo(accessToken);
      return true;
    } catch (error) {
      console.error('HubSpot connection test failed:', error);
      return false;
    }
  }

  /**
   * Sync contacts from HubSpot
   */
  async syncContacts(userId: string, accessToken: string): Promise<number> {
    try {
      const contacts = await this.getAllContacts(accessToken);
      let syncedCount = 0;

      for (const contact of contacts) {
        try {
          const props = contact.properties;
          await supabase!
            .from('synced_contacts')
            .upsert({
              user_id: userId,
              provider: 'hubspot',
              external_id: contact.id,
              email: props.email,
              first_name: props.firstname,
              last_name: props.lastname,
              phone: props.phone,
              company: props.company,
              title: props.jobtitle,
              lead_source: props.hs_lead_source,
              data: contact
            });
          syncedCount++;
        } catch (error) {
          console.error('Error syncing contact:', contact.id, error);
        }
      }

      await this.logIntegrationAction('sync_contacts', 'success', `Synced ${syncedCount} contacts`, {
        synced_count: syncedCount,
        total_count: contacts.length
      });

      return syncedCount;
    } catch (error) {
      await this.logIntegrationAction('sync_contacts', 'error', `Contact sync failed: ${error}`);
      throw error;
    }
  }

  /**
   * Sync deals from HubSpot
   */
  async syncDeals(userId: string, accessToken: string): Promise<number> {
    try {
      const deals = await this.getAllDeals(accessToken);
      let syncedCount = 0;

      for (const deal of deals) {
        try {
          const props = deal.properties;
          await supabase!
            .from('synced_deals')
            .upsert({
              user_id: userId,
              provider: 'hubspot',
              external_id: deal.id,
              name: props.dealname,
              amount: props.amount ? parseFloat(props.amount) : null,
              stage: props.dealstage,
              close_date: props.closedate ? new Date(props.closedate).toISOString().split('T')[0] : null,
              probability: props.hs_deal_stage_probability ? parseInt(props.hs_deal_stage_probability) : null,
              data: deal
            });
          syncedCount++;
        } catch (error) {
          console.error('Error syncing deal:', deal.id, error);
        }
      }

      await this.logIntegrationAction('sync_deals', 'success', `Synced ${syncedCount} deals`, {
        synced_count: syncedCount,
        total_count: deals.length
      });

      return syncedCount;
    } catch (error) {
      await this.logIntegrationAction('sync_deals', 'error', `Deal sync failed: ${error}`);
      throw error;
    }
  }

  /**
   * Sync companies from HubSpot
   */
  async syncCompanies(userId: string, accessToken: string): Promise<number> {
    try {
      const companies = await this.getAllCompanies(accessToken);
      let syncedCount = 0;

      for (const company of companies) {
        try {
          const props = company.properties;
          await supabase!
            .from('synced_contacts')
            .upsert({
              user_id: userId,
              provider: 'hubspot',
              external_id: company.id,
              email: null,
              first_name: null,
              last_name: null,
              phone: props.phone,
              company: props.name,
              title: null,
              data: company
            });
          syncedCount++;
        } catch (error) {
          console.error('Error syncing company:', company.id, error);
        }
      }

      await this.logIntegrationAction('sync_companies', 'success', `Synced ${syncedCount} companies`, {
        synced_count: syncedCount,
        total_count: companies.length
      });

      return syncedCount;
    } catch (error) {
      await this.logIntegrationAction('sync_companies', 'error', `Company sync failed: ${error}`);
      throw error;
    }
  }

  /**
   * Get all contacts with pagination
   */
  private async getAllContacts(accessToken: string): Promise<HubSpotContact[]> {
    const allContacts: HubSpotContact[] = [];
    let after: string | undefined;
    
    const properties = [
      'email', 'firstname', 'lastname', 'phone', 'company', 'jobtitle',
      'lifecyclestage', 'hs_lead_source', 'createdate', 'lastmodifieddate'
    ];

    do {
      const url = new URL('https://api.hubapi.com/crm/v3/objects/contacts');
      url.searchParams.set('properties', properties.join(','));
      url.searchParams.set('limit', '100');
      if (after) url.searchParams.set('after', after);

      const response = await this.makeHubSpotRequest(accessToken, url.toString());
      allContacts.push(...response.results);

      after = response.paging?.next?.after;
    } while (after);

    return allContacts;
  }

  /**
   * Get all deals with pagination
   */
  private async getAllDeals(accessToken: string): Promise<HubSpotDeal[]> {
    const allDeals: HubSpotDeal[] = [];
    let after: string | undefined;
    
    const properties = [
      'dealname', 'amount', 'dealstage', 'closedate', 'pipeline',
      'dealtype', 'hs_deal_stage_probability', 'hs_deal_source_id',
      'createdate', 'hs_lastmodifieddate'
    ];

    do {
      const url = new URL('https://api.hubapi.com/crm/v3/objects/deals');
      url.searchParams.set('properties', properties.join(','));
      url.searchParams.set('limit', '100');
      if (after) url.searchParams.set('after', after);

      const response = await this.makeHubSpotRequest(accessToken, url.toString());
      allDeals.push(...response.results);

      after = response.paging?.next?.after;
    } while (after);

    return allDeals;
  }

  /**
   * Get all companies with pagination
   */
  private async getAllCompanies(accessToken: string): Promise<HubSpotCompany[]> {
    const allCompanies: HubSpotCompany[] = [];
    let after: string | undefined;
    
    const properties = [
      'name', 'domain', 'phone', 'city', 'state', 'country', 'industry',
      'createdate', 'hs_lastmodifieddate'
    ];

    do {
      const url = new URL('https://api.hubapi.com/crm/v3/objects/companies');
      url.searchParams.set('properties', properties.join(','));
      url.searchParams.set('limit', '100');
      if (after) url.searchParams.set('after', after);

      const response = await this.makeHubSpotRequest(accessToken, url.toString());
      allCompanies.push(...response.results);

      after = response.paging?.next?.after;
    } while (after);

    return allCompanies;
  }

  /**
   * Make authenticated request to HubSpot API
   */
  private async makeHubSpotRequest(accessToken: string, url: string): Promise<any> {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - token may be expired');
      }
      throw new Error(`HubSpot API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Log integration actions
   */
  private async logIntegrationAction(
    action: string,
    status: 'success' | 'error' | 'pending',
    message: string,
    details?: any
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) return;

      await supabase!
        .from('integration_logs')
        .insert({
          user_id: user.id,
          provider: 'hubspot',
          action,
          status,
          message,
          details: details || {}
        });
    } catch (error) {
      console.error('Error logging integration action:', error);
    }
  }

  /**
   * Get OAuth token for user (with server-side refresh to avoid CORS)
   */
  async getOAuthToken(userId: string, portalId: string): Promise<{ accessToken: string; refreshToken: string } | null> {
    try {
      const { data, error } = await supabase!
        .from('oauth_tokens')
        .select('id, access_token, refresh_token, expires_at')
        .eq('user_id', userId)
        .eq('provider', 'hubspot')
        .eq('store_identifier', portalId)
        .single();

      if (error || !data) return null;

      // Use server-side token refresh endpoint to avoid CORS issues
      const refreshResponse = await fetch('/api/integrations/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          integrationId: data.id,
          userId: userId
        })
      });

      if (!refreshResponse.ok) {
        console.error('Token refresh failed:', await refreshResponse.text());
        return null;
      }

      const refreshData = await refreshResponse.json();
      
      return {
        accessToken: refreshData.accessToken,
        refreshToken: data.refresh_token
      };
    } catch (error) {
      console.error('Error getting OAuth token:', error);
      return null;
    }
  }

  /**
   * Remove OAuth connection
   */
  async disconnect(userId: string, portalId: string): Promise<void> {
    try {
      // Delete OAuth token
      await supabase!
        .from('oauth_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('provider', 'hubspot')
        .eq('store_identifier', portalId);

      await this.logIntegrationAction('disconnect', 'success', 'HubSpot portal disconnected', {
        portal_id: portalId
      });
    } catch (error) {
      await this.logIntegrationAction('disconnect', 'error', `Disconnect failed: ${error}`, {
        portal_id: portalId
      });
      throw error;
    }
  }
}

// HubSpot configuration (will be moved to environment variables)
const hubspotConfig: HubSpotConfig = {
  clientId: import.meta.env.VITE_HUBSPOT_CLIENT_ID || '',
  clientSecret: import.meta.env.VITE_HUBSPOT_CLIENT_SECRET || '',
  scopes: ['crm.objects.contacts.read', 'crm.objects.contacts.write', 'crm.objects.companies.read', 'crm.objects.deals.read'],
  redirectUri: 'https://romashkaai.vercel.app/api/integrations/hubspot/callback',
};

export const hubspotService = new HubSpotIntegrationService(hubspotConfig);