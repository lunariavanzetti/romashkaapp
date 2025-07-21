/**
 * Universal Sync API Endpoint
 * Handles manual sync triggers for all integration providers
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Import integration services
import { ShopifyIntegrationService } from '../../src/services/integrations/shopifyService';
import { SalesforceIntegrationService } from '../../src/services/integrations/salesforceService';
import { HubSpotIntegrationService } from '../../src/services/integrations/hubspotService';

// Initialize services
const shopifyService = new ShopifyIntegrationService({
  clientId: process.env.SHOPIFY_CLIENT_ID!,
  clientSecret: process.env.SHOPIFY_CLIENT_SECRET!,
  scopes: ['read_customers', 'read_orders', 'read_products'],
  redirectUri: `${process.env.VERCEL_URL || process.env.FRONTEND_URL}/api/integrations/shopify/callback`,
});

const salesforceService = new SalesforceIntegrationService({
  clientId: process.env.SALESFORCE_CLIENT_ID!,
  clientSecret: process.env.SALESFORCE_CLIENT_SECRET!,
  redirectUri: `${process.env.VERCEL_URL || process.env.FRONTEND_URL}/api/integrations/salesforce/callback`,
});

const hubspotService = new HubSpotIntegrationService({
  clientId: process.env.HUBSPOT_CLIENT_ID!,
  clientSecret: process.env.HUBSPOT_CLIENT_SECRET!,
  scopes: ['contacts', 'crm.objects.deals.read', 'crm.objects.companies.read'],
  redirectUri: `${process.env.VERCEL_URL || process.env.FRONTEND_URL}/api/integrations/hubspot/callback`,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { provider } = req.query;
    const { user_id, integration_id } = req.body;

    if (!provider || !user_id || !integration_id) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        required: ['provider', 'user_id', 'integration_id']
      });
    }

    // Get integration details
    const { data: token, error: tokenError } = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('id', integration_id)
      .eq('user_id', user_id)
      .eq('provider', provider)
      .single();

    if (tokenError || !token) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    let syncResults: any = {};

    // Perform sync based on provider
    switch (provider) {
      case 'shopify':
        const shopifyResults = await syncShopifyData(user_id, token);
        syncResults = shopifyResults;
        break;
      
      case 'salesforce':
        const salesforceResults = await syncSalesforceData(user_id, token);
        syncResults = salesforceResults;
        break;
      
      case 'hubspot':
        const hubspotResults = await syncHubSpotData(user_id, token);
        syncResults = hubspotResults;
        break;
      
      default:
        return res.status(400).json({ error: `Unsupported provider: ${provider}` });
    }

    // Update last sync time
    await supabase
      .from('oauth_tokens')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', integration_id);

    // Log sync completion
    await supabase
      .from('integration_logs')
      .insert({
        user_id: user_id,
        provider: provider as string,
        action: 'manual_sync',
        status: 'success',
        message: `Manual sync completed: ${syncResults.total_synced} records`,
        details: syncResults
      });

    return res.status(200).json({
      success: true,
      provider: provider,
      ...syncResults
    });

  } catch (error) {
    console.error('Sync API error:', error);
    
    // Log sync error
    if (req.body.user_id && req.query.provider) {
      await supabase
        .from('integration_logs')
        .insert({
          user_id: req.body.user_id,
          provider: req.query.provider as string,
          action: 'manual_sync',
          status: 'error',
          message: `Sync failed: ${error}`,
          details: { error: error instanceof Error ? error.message : String(error) }
        });
    }

    return res.status(500).json({ 
      error: 'Sync failed', 
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

// Shopify sync function
async function syncShopifyData(userId: string, token: any) {
  const contacts = await shopifyService.syncCustomers(userId, token.store_identifier, token.access_token);
  const orders = await shopifyService.syncOrders(userId, token.store_identifier, token.access_token);
  const products = await shopifyService.syncProducts(userId, token.store_identifier, token.access_token);

  return {
    contacts,
    orders,
    products,
    deals: 0,
    total_synced: contacts + orders + products,
    last_sync_at: new Date().toISOString()
  };
}

// Salesforce sync function
async function syncSalesforceData(userId: string, token: any) {
  const contacts = await salesforceService.syncContacts(userId, token.store_identifier, token.access_token);
  const leads = await salesforceService.syncLeads(userId, token.store_identifier, token.access_token);
  const deals = await salesforceService.syncOpportunities(userId, token.store_identifier, token.access_token);

  return {
    contacts: contacts + leads,
    orders: 0,
    products: 0,
    deals,
    total_synced: contacts + leads + deals,
    last_sync_at: new Date().toISOString()
  };
}

// HubSpot sync function
async function syncHubSpotData(userId: string, token: any) {
  const contacts = await hubspotService.syncContacts(userId, token.access_token);
  const companies = await hubspotService.syncCompanies(userId, token.access_token);
  const deals = await hubspotService.syncDeals(userId, token.access_token);

  return {
    contacts: contacts + companies,
    orders: 0,
    products: 0,
    deals,
    total_synced: contacts + companies + deals,
    last_sync_at: new Date().toISOString()
  };
}