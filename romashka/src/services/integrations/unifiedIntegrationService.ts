/**
 * Unified Integration Service
 * Manages all integration providers (Shopify, Salesforce, HubSpot) through a single interface
 */

import { supabase } from '../supabaseClient';
import { shopifyService } from './shopifyService';
import { salesforceService } from './salesforceService';
import { hubspotService } from './hubspotService';

export interface ConnectedIntegration {
  id: string;
  provider: 'shopify' | 'salesforce' | 'hubspot';
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  last_sync_at?: string;
  store_identifier: string;
  created_at: string;
}

export interface SyncStats {
  provider: string;
  contacts: number;
  orders: number;
  products: number;
  deals: number;
  total_synced: number;
  last_sync_at: string;
}

export interface IntegrationLog {
  id: string;
  provider: string;
  action: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  details: any;
  created_at: string;
}

export class UnifiedIntegrationService {
  
  /**
   * Get all connected integrations for the current user
   */
  async getConnectedIntegrations(): Promise<ConnectedIntegration[]> {
    try {
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: tokens, error } = await supabase!
        .from('oauth_tokens')
        .select('*')
        .eq('user_id', user.id)
        .in('provider', ['shopify', 'salesforce', 'hubspot']);

      if (error) throw error;

      return tokens.map(token => ({
        id: token.id,
        provider: token.provider as 'shopify' | 'salesforce' | 'hubspot',
        name: this.getProviderDisplayName(token.provider, token.store_identifier),
        status: 'connected' as const,
        store_identifier: token.store_identifier,
        created_at: token.created_at
      }));
    } catch (error) {
      console.error('Error getting connected integrations:', error);
      return [];
    }
  }

  /**
   * Start OAuth connection for a provider
   */
  async startOAuthConnection(provider: 'shopify' | 'salesforce' | 'hubspot', shopDomain?: string): Promise<string> {
    const state = this.generateState();

    switch (provider) {
      case 'shopify':
        if (!shopDomain) throw new Error('Shop domain required for Shopify');
        return shopifyService.generateAuthUrl(shopDomain, state);
      
      case 'salesforce':
        return salesforceService.generateAuthUrl(state);
      
      case 'hubspot':
        return hubspotService.generateAuthUrl(state);
      
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Complete OAuth connection
   */
  async completeOAuthConnection(
    provider: 'shopify' | 'salesforce' | 'hubspot',
    code: string,
    shopDomain?: string
  ): Promise<string> {
    const { data: { user } } = await supabase!.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    switch (provider) {
      case 'shopify':
        if (!shopDomain) throw new Error('Shop domain required for Shopify');
        const shopifyToken = await shopifyService.exchangeCodeForToken(shopDomain, code);
        return await shopifyService.storeOAuthToken(user.id, shopDomain, shopifyToken);
      
      case 'salesforce':
        const salesforceToken = await salesforceService.exchangeCodeForToken(code);
        return await salesforceService.storeOAuthToken(user.id, salesforceToken);
      
      case 'hubspot':
        const hubspotToken = await hubspotService.exchangeCodeForToken(code);
        return await hubspotService.storeOAuthToken(user.id, hubspotToken);
      
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Test connection for a specific integration
   */
  async testConnection(integrationId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: token, error } = await supabase!
        .from('oauth_tokens')
        .select('*')
        .eq('id', integrationId)
        .eq('user_id', user.id)
        .single();

      if (error || !token) throw new Error('Integration not found');

      switch (token.provider) {
        case 'shopify':
          return await shopifyService.testConnection(token.store_identifier, token.access_token);
        
        case 'salesforce':
          return await salesforceService.testConnection(token.store_identifier, token.access_token);
        
        case 'hubspot':
          // Get valid token (will refresh if expired)
          const tokenData = await hubspotService.getOAuthToken(user.id, token.store_identifier);
          if (!tokenData) return false;
          return await hubspotService.testConnection(tokenData.accessToken);
        
        default:
          throw new Error(`Unsupported provider: ${token.provider}`);
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      return false;
    }
  }

  /**
   * Sync data from all connected integrations
   */
  async syncAllIntegrations(): Promise<SyncStats[]> {
    const integrations = await this.getConnectedIntegrations();
    const results: SyncStats[] = [];

    for (const integration of integrations) {
      try {
        const stats = await this.syncIntegration(integration.id);
        results.push(stats);
      } catch (error) {
        console.error(`Error syncing ${integration.provider}:`, error);
        results.push({
          provider: integration.provider,
          contacts: 0,
          orders: 0,
          products: 0,
          deals: 0,
          total_synced: 0,
          last_sync_at: new Date().toISOString()
        });
      }
    }

    return results;
  }

  /**
   * Sync data from a specific integration
   */
  async syncIntegration(integrationId: string): Promise<SyncStats> {
    try {
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: token, error } = await supabase!
        .from('oauth_tokens')
        .select('*')
        .eq('id', integrationId)
        .eq('user_id', user.id)
        .single();

      if (error || !token) throw new Error('Integration not found');

      let contacts = 0, orders = 0, products = 0, deals = 0;
      const startTime = new Date().toISOString();

      switch (token.provider) {
        case 'shopify':
          contacts = await shopifyService.syncCustomers(user.id, token.store_identifier, token.access_token);
          orders = await shopifyService.syncOrders(user.id, token.store_identifier, token.access_token);
          products = await shopifyService.syncProducts(user.id, token.store_identifier, token.access_token);
          break;
        
        case 'salesforce':
          contacts += await salesforceService.syncContacts(user.id, token.store_identifier, token.access_token);
          contacts += await salesforceService.syncLeads(user.id, token.store_identifier, token.access_token);
          deals = await salesforceService.syncOpportunities(user.id, token.store_identifier, token.access_token);
          break;
        
        case 'hubspot':
          try {
            console.log('[DEBUG] Starting HubSpot server-side sync');
            // Use server-side sync to avoid CORS issues
            const syncResponse = await fetch('/api/integrations/sync-hubspot', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                integrationId: token.id,
                userId: user.id
              })
            });

            if (!syncResponse.ok) {
              const errorText = await syncResponse.text();
              console.error('[DEBUG] Server-side sync failed:', errorText);
              throw new Error(`HubSpot sync failed: ${errorText}`);
            }

            const syncResult = await syncResponse.json();
            console.log('[DEBUG] HubSpot sync completed:', syncResult);
            
            contacts = syncResult.contacts || 0;
            deals = syncResult.deals || 0;
          } catch (hubspotError) {
            console.error('[DEBUG] HubSpot sync error:', hubspotError);
            throw new Error(`HubSpot sync failed: ${hubspotError instanceof Error ? hubspotError.message : 'Unknown error'}`);
          }
          break;
        
        default:
          throw new Error(`Unsupported provider: ${token.provider}`);
      }

      // Update last sync time
      await supabase!
        .from('oauth_tokens')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', integrationId);

      // Update provider-specific tables
      await this.updateProviderSyncTime(token.provider, user.id, token.store_identifier);

      return {
        provider: token.provider,
        contacts,
        orders,
        products,
        deals,
        total_synced: contacts + orders + products + deals,
        last_sync_at: startTime
      };
    } catch (error) {
      console.error('Error syncing integration:', error);
      throw error;
    }
  }

  /**
   * Disconnect an integration
   */
  async disconnectIntegration(integrationId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: token, error } = await supabase!
        .from('oauth_tokens')
        .select('*')
        .eq('id', integrationId)
        .eq('user_id', user.id)
        .single();

      if (error || !token) throw new Error('Integration not found');

      switch (token.provider) {
        case 'shopify':
          await shopifyService.disconnect(user.id, token.store_identifier);
          break;
        
        case 'salesforce':
          await salesforceService.disconnect(user.id, token.store_identifier);
          break;
        
        case 'hubspot':
          await hubspotService.disconnect(user.id, token.store_identifier);
          break;
        
        default:
          throw new Error(`Unsupported provider: ${token.provider}`);
      }
    } catch (error) {
      console.error('Error disconnecting integration:', error);
      throw error;
    }
  }

  /**
   * Get integration logs
   */
  async getIntegrationLogs(provider?: string, limit = 50): Promise<IntegrationLog[]> {
    try {
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let query = supabase!
        .from('integration_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (provider) {
        query = query.eq('provider', provider);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting integration logs:', error);
      return [];
    }
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<{ [provider: string]: SyncStats }> {
    try {
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const stats: { [provider: string]: SyncStats } = {};

      // Get counts for each provider
      for (const provider of ['shopify', 'salesforce', 'hubspot']) {
        const [contacts, orders, products, deals] = await Promise.all([
          this.getRecordCount('synced_contacts', user.id, provider),
          this.getRecordCount('synced_orders', user.id, provider),
          this.getRecordCount('synced_products', user.id, provider),
          this.getRecordCount('synced_deals', user.id, provider),
        ]);

        // Get last sync time
        const { data: lastSync } = await supabase!
          .from('oauth_tokens')
          .select('updated_at')
          .eq('user_id', user.id)
          .eq('provider', provider)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        stats[provider] = {
          provider,
          contacts,
          orders,
          products,
          deals,
          total_synced: contacts + orders + products + deals,
          last_sync_at: lastSync?.updated_at || new Date().toISOString()
        };
      }

      return stats;
    } catch (error) {
      console.error('Error getting sync stats:', error);
      return {};
    }
  }

  // Private helper methods

  private async getRecordCount(table: string, userId: string, provider: string): Promise<number> {
    const { count, error } = await supabase!
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('provider', provider);

    return error ? 0 : (count || 0);
  }

  private async updateProviderSyncTime(provider: string, userId: string, storeIdentifier: string): Promise<void> {
    const now = new Date().toISOString();

    switch (provider) {
      case 'shopify':
        await supabase!
          .from('shopify_stores')
          .update({ last_sync_at: now })
          .eq('user_id', userId)
          .eq('shop_domain', storeIdentifier);
        break;
      
      case 'salesforce':
        await supabase!
          .from('salesforce_orgs')
          .update({ last_sync_at: now })
          .eq('user_id', userId)
          .eq('instance_url', storeIdentifier);
        break;
      
      case 'hubspot':
        await supabase!
          .from('hubspot_portals')
          .update({ last_sync_at: now })
          .eq('user_id', userId)
          .eq('portal_id', storeIdentifier);
        break;
    }
  }

  private getProviderDisplayName(provider: string, storeIdentifier: string): string {
    switch (provider) {
      case 'shopify':
        return `Shopify (${storeIdentifier})`;
      case 'salesforce':
        return `Salesforce (${storeIdentifier})`;
      case 'hubspot':
        return `HubSpot Portal ${storeIdentifier}`;
      default:
        return provider;
    }
  }

  private generateState(): string {
    return Math.random().toString(36).substr(2, 15) + Math.random().toString(36).substr(2, 15);
  }
}

export const unifiedIntegrationService = new UnifiedIntegrationService();