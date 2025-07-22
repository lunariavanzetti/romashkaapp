/**
 * Salesforce Integration Service
 * Handles OAuth authentication, API calls, and data synchronization for Salesforce
 */

import { supabase } from '../supabaseClient';

export interface SalesforceConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface SalesforceTokenResponse {
  access_token: string;
  refresh_token: string;
  signature: string;
  scope: string;
  instance_url: string;
  id: string;
  token_type: string;
  issued_at: string;
}

export interface SalesforceUserInfo {
  id: string;
  asserted_user: boolean;
  user_id: string;
  organization_id: string;
  username: string;
  nick_name: string;
  display_name: string;
  email: string;
  email_verified: boolean;
  first_name: string;
  last_name: string;
  timezone: string;
  language: string;
  locale: string;
  organization: {
    id: string;
    name: string;
    country: string;
    org_type: string;
  };
}

export interface SalesforceRecord {
  Id: string;
  attributes: {
    type: string;
    url: string;
  };
  [key: string]: any;
}

export interface SalesforceLead extends SalesforceRecord {
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string;
  Company: string;
  Status: string;
  LeadSource: string;
  CreatedDate: string;
  LastModifiedDate: string;
}

export interface SalesforceContact extends SalesforceRecord {
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string;
  Title: string;
  Account: {
    Name: string;
  };
  CreatedDate: string;
  LastModifiedDate: string;
}

export interface SalesforceOpportunity extends SalesforceRecord {
  Name: string;
  Amount: number;
  StageName: string;
  CloseDate: string;
  Probability: number;
  LeadSource: string;
  CreatedDate: string;
  LastModifiedDate: string;
  Account: {
    Name: string;
  };
  Contact: {
    Name: string;
    Email: string;
  };
}

export class SalesforceIntegrationService {
  private config: SalesforceConfig;

  constructor(config: SalesforceConfig) {
    this.config = config;
  }

  /**
   * Generate OAuth authorization URL
   */
  generateAuthUrl(state?: string): string {
    const baseUrl = 'https://login.salesforce.com/services/oauth2/authorize';
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: 'api refresh_token',
      state: state || '',
    });

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<SalesforceTokenResponse> {
    try {
      const tokenUrl = 'https://login.salesforce.com/services/oauth2/token';
      
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

      const tokenData = await response.json() as SalesforceTokenResponse;
      
      // Log successful OAuth
      await this.logIntegrationAction('oauth_connect', 'success', 'OAuth connection established', {
        instance_url: tokenData.instance_url,
        scopes: tokenData.scope
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
    tokenData: SalesforceTokenResponse
  ): Promise<string> {
    try {
      // Get user info
      const userInfo = await this.getUserInfo(tokenData.instance_url, tokenData.access_token);

      // Store OAuth token
      const { data: tokenRow, error: tokenError } = await supabase!
        .from('oauth_tokens')
        .insert({
          user_id: userId,
          provider: 'salesforce',
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_type: tokenData.token_type,
          scope: tokenData.scope,
          store_identifier: tokenData.instance_url,
        })
        .select()
        .single();

      if (tokenError) throw tokenError;

      // Store Salesforce-specific data
      const { data: orgRow, error: orgError } = await supabase!
        .from('salesforce_orgs')
        .insert({
          user_id: userId,
          oauth_token_id: tokenRow.id,
          instance_url: tokenData.instance_url,
          org_id: userInfo.organization_id,
          org_name: userInfo.organization.name,
          org_type: userInfo.organization.org_type,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      await this.logIntegrationAction('org_setup', 'success', 'Salesforce org connected', {
        instance_url: tokenData.instance_url,
        org_name: userInfo.organization.name
      });

      return tokenRow.id;
    } catch (error) {
      await this.logIntegrationAction('org_setup', 'error', `Org setup failed: ${error}`, {
        instance_url: tokenData.instance_url
      });
      throw error;
    }
  }

  /**
   * Get user information
   */
  private async getUserInfo(instanceUrl: string, accessToken: string): Promise<SalesforceUserInfo> {
    const response = await this.makeSalesforceRequest(
      instanceUrl,
      accessToken,
      '/services/oauth2/userinfo'
    );
    return response;
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string, instanceUrl: string): Promise<SalesforceTokenResponse> {
    try {
      const tokenUrl = `${instanceUrl}/services/oauth2/token`;
      
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
  async testConnection(instanceUrl: string, accessToken: string): Promise<boolean> {
    try {
      await this.getUserInfo(instanceUrl, accessToken);
      return true;
    } catch (error) {
      console.error('Salesforce connection test failed:', error);
      return false;
    }
  }

  /**
   * Sync leads from Salesforce
   */
  async syncLeads(userId: string, instanceUrl: string, accessToken: string): Promise<number> {
    try {
      const query = `
        SELECT Id, FirstName, LastName, Email, Phone, Company, Status, LeadSource, 
               CreatedDate, LastModifiedDate 
        FROM Lead 
        ORDER BY LastModifiedDate DESC 
        LIMIT 1000
      `;

      const leads = await this.querySalesforce<SalesforceLead>(instanceUrl, accessToken, query);
      let syncedCount = 0;

      for (const lead of leads) {
        try {
          await supabase!
            .from('synced_contacts')
            .upsert({
              user_id: userId,
              provider: 'salesforce',
              external_id: lead.Id,
              email: lead.Email,
              first_name: lead.FirstName,
              last_name: lead.LastName,
              phone: lead.Phone,
              company: lead.Company,
              lead_source: lead.LeadSource,
              data: lead
            });
          syncedCount++;
        } catch (error) {
          console.error('Error syncing lead:', lead.Id, error);
        }
      }

      await this.logIntegrationAction('sync_leads', 'success', `Synced ${syncedCount} leads`, {
        synced_count: syncedCount,
        total_count: leads.length
      });

      return syncedCount;
    } catch (error) {
      await this.logIntegrationAction('sync_leads', 'error', `Lead sync failed: ${error}`);
      throw error;
    }
  }

  /**
   * Sync contacts from Salesforce
   */
  async syncContacts(userId: string, instanceUrl: string, accessToken: string): Promise<number> {
    try {
      const query = `
        SELECT Id, FirstName, LastName, Email, Phone, Title, Account.Name, 
               CreatedDate, LastModifiedDate 
        FROM Contact 
        ORDER BY LastModifiedDate DESC 
        LIMIT 1000
      `;

      const contacts = await this.querySalesforce<SalesforceContact>(instanceUrl, accessToken, query);
      let syncedCount = 0;

      for (const contact of contacts) {
        try {
          await supabase!
            .from('synced_contacts')
            .upsert({
              user_id: userId,
              provider: 'salesforce',
              external_id: contact.Id,
              email: contact.Email,
              first_name: contact.FirstName,
              last_name: contact.LastName,
              phone: contact.Phone,
              company: contact.Account?.Name,
              title: contact.Title,
              data: contact
            });
          syncedCount++;
        } catch (error) {
          console.error('Error syncing contact:', contact.Id, error);
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
   * Sync opportunities from Salesforce
   */
  async syncOpportunities(userId: string, instanceUrl: string, accessToken: string): Promise<number> {
    try {
      const query = `
        SELECT Id, Name, Amount, StageName, CloseDate, Probability, LeadSource,
               CreatedDate, LastModifiedDate, Account.Name, 
               (SELECT Name, Email FROM ContactRoles LIMIT 1)
        FROM Opportunity 
        ORDER BY LastModifiedDate DESC 
        LIMIT 1000
      `;

      const opportunities = await this.querySalesforce<SalesforceOpportunity>(instanceUrl, accessToken, query);
      let syncedCount = 0;

      for (const opportunity of opportunities) {
        try {
          await supabase!
            .from('synced_deals')
            .upsert({
              user_id: userId,
              provider: 'salesforce',
              external_id: opportunity.Id,
              name: opportunity.Name,
              amount: opportunity.Amount,
              stage: opportunity.StageName,
              close_date: opportunity.CloseDate ? new Date(opportunity.CloseDate).toISOString().split('T')[0] : null,
              probability: opportunity.Probability,
              data: opportunity
            });
          syncedCount++;
        } catch (error) {
          console.error('Error syncing opportunity:', opportunity.Id, error);
        }
      }

      await this.logIntegrationAction('sync_opportunities', 'success', `Synced ${syncedCount} opportunities`, {
        synced_count: syncedCount,
        total_count: opportunities.length
      });

      return syncedCount;
    } catch (error) {
      await this.logIntegrationAction('sync_opportunities', 'error', `Opportunity sync failed: ${error}`);
      throw error;
    }
  }

  /**
   * Query Salesforce using SOQL
   */
  private async querySalesforce<T extends SalesforceRecord>(
    instanceUrl: string,
    accessToken: string,
    query: string
  ): Promise<T[]> {
    const endpoint = `/services/data/v59.0/query/?q=${encodeURIComponent(query)}`;
    const response = await this.makeSalesforceRequest(instanceUrl, accessToken, endpoint);
    
    let allRecords = response.records || [];
    
    // Handle pagination
    let nextRecordsUrl = response.nextRecordsUrl;
    while (nextRecordsUrl) {
      const nextResponse = await this.makeSalesforceRequest(instanceUrl, accessToken, nextRecordsUrl);
      allRecords.push(...nextResponse.records);
      nextRecordsUrl = nextResponse.nextRecordsUrl;
    }

    return allRecords;
  }

  /**
   * Make authenticated request to Salesforce API
   */
  private async makeSalesforceRequest(
    instanceUrl: string,
    accessToken: string,
    endpoint: string
  ): Promise<any> {
    const url = endpoint.startsWith('/') ? `${instanceUrl}${endpoint}` : endpoint;
    
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
      throw new Error(`Salesforce API error: ${response.status} ${response.statusText}`);
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
          provider: 'salesforce',
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
   * Get OAuth token for user
   */
  async getOAuthToken(userId: string, instanceUrl: string): Promise<{ accessToken: string; refreshToken: string } | null> {
    try {
      const { data, error } = await supabase!
        .from('oauth_tokens')
        .select('access_token, refresh_token')
        .eq('user_id', userId)
        .eq('provider', 'salesforce')
        .eq('store_identifier', instanceUrl)
        .single();

      if (error || !data) return null;

      return {
        accessToken: data.access_token,
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
  async disconnect(userId: string, instanceUrl: string): Promise<void> {
    try {
      // Delete OAuth token
      await supabase!
        .from('oauth_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('provider', 'salesforce')
        .eq('store_identifier', instanceUrl);

      await this.logIntegrationAction('disconnect', 'success', 'Salesforce org disconnected', {
        instance_url: instanceUrl
      });
    } catch (error) {
      await this.logIntegrationAction('disconnect', 'error', `Disconnect failed: ${error}`, {
        instance_url: instanceUrl
      });
      throw error;
    }
  }
}

// Salesforce configuration (will be moved to environment variables)
const salesforceConfig: SalesforceConfig = {
  clientId: import.meta.env.VITE_SALESFORCE_CLIENT_ID || '',
  clientSecret: import.meta.env.VITE_SALESFORCE_CLIENT_SECRET || '',
  redirectUri: `${import.meta.env.VITE_APP_URL || 'https://romashkaai.vercel.app'}/api/integrations/salesforce/callback`,
};

export const salesforceService = new SalesforceIntegrationService(salesforceConfig);