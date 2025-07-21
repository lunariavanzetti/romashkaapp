/**
 * Shopify Integration Service
 * Handles OAuth authentication, API calls, and data synchronization for Shopify
 */

import { supabase } from '../supabaseClient';

export interface ShopifyConfig {
  clientId: string;
  clientSecret: string;
  scopes: string[];
  redirectUri: string;
}

export interface ShopifyTokenResponse {
  access_token: string;
  scope: string;
  expires_in?: number;
}

export interface ShopifyShop {
  id: number;
  name: string;
  email: string;
  domain: string;
  currency: string;
  timezone: string;
  country_code: string;
  country_name: string;
}

export interface ShopifyCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  created_at: string;
  updated_at: string;
  total_spent: string;
  orders_count: number;
  tags: string;
}

export interface ShopifyOrder {
  id: number;
  order_number: string;
  email: string;
  total_price: string;
  currency: string;
  financial_status: string;
  fulfillment_status: string;
  created_at: string;
  updated_at: string;
  line_items: ShopifyLineItem[];
}

export interface ShopifyLineItem {
  id: number;
  product_id: number;
  variant_id: number;
  quantity: number;
  price: string;
  name: string;
  sku: string;
}

export interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  variants: ShopifyVariant[];
}

export interface ShopifyVariant {
  id: number;
  product_id: number;
  title: string;
  price: string;
  sku: string;
  inventory_quantity: number;
  inventory_management: string;
}

export class ShopifyIntegrationService {
  private config: ShopifyConfig;

  constructor(config: ShopifyConfig) {
    this.config = config;
  }

  /**
   * Generate OAuth authorization URL
   */
  generateAuthUrl(shopDomain: string, state?: string): string {
    const baseUrl = `https://${shopDomain}.myshopify.com/admin/oauth/authorize`;
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      scope: this.config.scopes.join(','),
      redirect_uri: this.config.redirectUri,
      state: state || '',
    });

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    shopDomain: string,
    code: string
  ): Promise<ShopifyTokenResponse> {
    try {
      const tokenUrl = `https://${shopDomain}.myshopify.com/admin/oauth/access_token`;
      
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.statusText}`);
      }

      const tokenData = await response.json() as ShopifyTokenResponse;
      
      // Log successful OAuth
      await this.logIntegrationAction('oauth_connect', 'success', 'OAuth connection established', {
        shop_domain: shopDomain,
        scopes: tokenData.scope
      });

      return tokenData;
    } catch (error) {
      await this.logIntegrationAction('oauth_connect', 'error', `OAuth failed: ${error}`, {
        shop_domain: shopDomain
      });
      throw error;
    }
  }

  /**
   * Store OAuth token in database
   */
  async storeOAuthToken(
    userId: string,
    shopDomain: string,
    tokenData: ShopifyTokenResponse
  ): Promise<string> {
    try {
      // Store OAuth token
      const { data: tokenRow, error: tokenError } = await supabase!
        .from('oauth_tokens')
        .insert({
          user_id: userId,
          provider: 'shopify',
          access_token: tokenData.access_token,
          scope: tokenData.scope,
          store_identifier: shopDomain,
          expires_at: tokenData.expires_in ? 
            new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : 
            null
        })
        .select()
        .single();

      if (tokenError) throw tokenError;

      // Get shop details
      const shopDetails = await this.getShopDetails(shopDomain, tokenData.access_token);

      // Store Shopify-specific data
      const { data: shopRow, error: shopError } = await supabase!
        .from('shopify_stores')
        .insert({
          user_id: userId,
          oauth_token_id: tokenRow.id,
          shop_domain: shopDomain,
          shop_name: shopDetails.name,
          email: shopDetails.email,
          currency: shopDetails.currency,
          timezone: shopDetails.timezone,
          country_code: shopDetails.country_code,
        })
        .select()
        .single();

      if (shopError) throw shopError;

      await this.logIntegrationAction('store_setup', 'success', 'Shopify store connected', {
        shop_domain: shopDomain,
        shop_name: shopDetails.name
      });

      return tokenRow.id;
    } catch (error) {
      await this.logIntegrationAction('store_setup', 'error', `Store setup failed: ${error}`, {
        shop_domain: shopDomain
      });
      throw error;
    }
  }

  /**
   * Get shop details
   */
  private async getShopDetails(shopDomain: string, accessToken: string): Promise<ShopifyShop> {
    const response = await this.makeShopifyRequest(
      shopDomain,
      accessToken,
      'shop.json'
    );
    return response.shop;
  }

  /**
   * Test API connection
   */
  async testConnection(shopDomain: string, accessToken: string): Promise<boolean> {
    try {
      await this.getShopDetails(shopDomain, accessToken);
      return true;
    } catch (error) {
      console.error('Shopify connection test failed:', error);
      return false;
    }
  }

  /**
   * Sync customers from Shopify
   */
  async syncCustomers(userId: string, shopDomain: string, accessToken: string): Promise<number> {
    try {
      const customers = await this.getAllCustomers(shopDomain, accessToken);
      let syncedCount = 0;

      for (const customer of customers) {
        try {
          await supabase!
            .from('synced_contacts')
            .upsert({
              user_id: userId,
              provider: 'shopify',
              external_id: customer.id.toString(),
              email: customer.email,
              first_name: customer.first_name,
              last_name: customer.last_name,
              phone: customer.phone,
              data: customer
            });
          syncedCount++;
        } catch (error) {
          console.error('Error syncing customer:', customer.id, error);
        }
      }

      await this.logIntegrationAction('sync_customers', 'success', `Synced ${syncedCount} customers`, {
        synced_count: syncedCount,
        total_count: customers.length
      });

      return syncedCount;
    } catch (error) {
      await this.logIntegrationAction('sync_customers', 'error', `Customer sync failed: ${error}`);
      throw error;
    }
  }

  /**
   * Sync orders from Shopify
   */
  async syncOrders(userId: string, shopDomain: string, accessToken: string): Promise<number> {
    try {
      const orders = await this.getAllOrders(shopDomain, accessToken);
      let syncedCount = 0;

      for (const order of orders) {
        try {
          await supabase!
            .from('synced_orders')
            .upsert({
              user_id: userId,
              provider: 'shopify',
              external_id: order.id.toString(),
              order_number: order.order_number,
              customer_email: order.email,
              total_amount: parseFloat(order.total_price),
              currency: order.currency,
              status: order.financial_status,
              items: order.line_items,
              data: order
            });
          syncedCount++;
        } catch (error) {
          console.error('Error syncing order:', order.id, error);
        }
      }

      await this.logIntegrationAction('sync_orders', 'success', `Synced ${syncedCount} orders`, {
        synced_count: syncedCount,
        total_count: orders.length
      });

      return syncedCount;
    } catch (error) {
      await this.logIntegrationAction('sync_orders', 'error', `Order sync failed: ${error}`);
      throw error;
    }
  }

  /**
   * Sync products from Shopify
   */
  async syncProducts(userId: string, shopDomain: string, accessToken: string): Promise<number> {
    try {
      const products = await this.getAllProducts(shopDomain, accessToken);
      let syncedCount = 0;

      for (const product of products) {
        try {
          // Use the first variant for price and SKU
          const firstVariant = product.variants[0];
          
          await supabase!
            .from('synced_products')
            .upsert({
              user_id: userId,
              provider: 'shopify',
              external_id: product.id.toString(),
              name: product.title,
              description: product.body_html,
              price: firstVariant ? parseFloat(firstVariant.price) : null,
              currency: 'USD', // Shopify doesn't provide currency in product API
              sku: firstVariant?.sku,
              inventory_quantity: firstVariant?.inventory_quantity,
              status: product.status,
              data: product
            });
          syncedCount++;
        } catch (error) {
          console.error('Error syncing product:', product.id, error);
        }
      }

      await this.logIntegrationAction('sync_products', 'success', `Synced ${syncedCount} products`, {
        synced_count: syncedCount,
        total_count: products.length
      });

      return syncedCount;
    } catch (error) {
      await this.logIntegrationAction('sync_products', 'error', `Product sync failed: ${error}`);
      throw error;
    }
  }

  /**
   * Get all customers with pagination
   */
  private async getAllCustomers(shopDomain: string, accessToken: string): Promise<ShopifyCustomer[]> {
    const allCustomers: ShopifyCustomer[] = [];
    let nextPageInfo: string | null = null;

    do {
      const url = nextPageInfo ? 
        `customers.json?page_info=${nextPageInfo}&limit=250` : 
        'customers.json?limit=250';
      
      const response = await this.makeShopifyRequest(shopDomain, accessToken, url);
      allCustomers.push(...response.customers);

      // Get next page info from Link header
      nextPageInfo = this.extractNextPageInfo(response._headers?.get?.('Link'));
    } while (nextPageInfo);

    return allCustomers;
  }

  /**
   * Get all orders with pagination
   */
  private async getAllOrders(shopDomain: string, accessToken: string): Promise<ShopifyOrder[]> {
    const allOrders: ShopifyOrder[] = [];
    let nextPageInfo: string | null = null;

    do {
      const url = nextPageInfo ? 
        `orders.json?page_info=${nextPageInfo}&limit=250&status=any` : 
        'orders.json?limit=250&status=any';
      
      const response = await this.makeShopifyRequest(shopDomain, accessToken, url);
      allOrders.push(...response.orders);

      nextPageInfo = this.extractNextPageInfo(response._headers?.get?.('Link'));
    } while (nextPageInfo);

    return allOrders;
  }

  /**
   * Get all products with pagination
   */
  private async getAllProducts(shopDomain: string, accessToken: string): Promise<ShopifyProduct[]> {
    const allProducts: ShopifyProduct[] = [];
    let nextPageInfo: string | null = null;

    do {
      const url = nextPageInfo ? 
        `products.json?page_info=${nextPageInfo}&limit=250` : 
        'products.json?limit=250';
      
      const response = await this.makeShopifyRequest(shopDomain, accessToken, url);
      allProducts.push(...response.products);

      nextPageInfo = this.extractNextPageInfo(response._headers?.get?.('Link'));
    } while (nextPageInfo);

    return allProducts;
  }

  /**
   * Make authenticated request to Shopify API
   */
  private async makeShopifyRequest(
    shopDomain: string,
    accessToken: string,
    endpoint: string
  ): Promise<any> {
    const url = `https://${shopDomain}.myshopify.com/admin/api/2023-07/${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    // Add headers for pagination
    (data as any)._headers = response.headers;
    return data;
  }

  /**
   * Extract next page info from Link header
   */
  private extractNextPageInfo(linkHeader: string | null): string | null {
    if (!linkHeader) return null;

    const nextMatch = linkHeader.match(/<[^>]*[?&]page_info=([^&>]+)[^>]*>;\s*rel="next"/);
    return nextMatch ? nextMatch[1] : null;
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
          provider: 'shopify',
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
  async getOAuthToken(userId: string, shopDomain: string): Promise<string | null> {
    try {
      const { data, error } = await supabase!
        .from('oauth_tokens')
        .select('access_token, expires_at')
        .eq('user_id', userId)
        .eq('provider', 'shopify')
        .eq('store_identifier', shopDomain)
        .single();

      if (error || !data) return null;

      // Check if token is expired
      if (data.expires_at && new Date(data.expires_at) <= new Date()) {
        return null;
      }

      return data.access_token;
    } catch (error) {
      console.error('Error getting OAuth token:', error);
      return null;
    }
  }

  /**
   * Remove OAuth connection
   */
  async disconnect(userId: string, shopDomain: string): Promise<void> {
    try {
      // Delete OAuth token
      await supabase!
        .from('oauth_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('provider', 'shopify')
        .eq('store_identifier', shopDomain);

      await this.logIntegrationAction('disconnect', 'success', 'Shopify store disconnected', {
        shop_domain: shopDomain
      });
    } catch (error) {
      await this.logIntegrationAction('disconnect', 'error', `Disconnect failed: ${error}`, {
        shop_domain: shopDomain
      });
      throw error;
    }
  }
}

// Shopify configuration (will be moved to environment variables)
const shopifyConfig: ShopifyConfig = {
  clientId: process.env.SHOPIFY_CLIENT_ID || '',
  clientSecret: process.env.SHOPIFY_CLIENT_SECRET || '',
  scopes: ['read_customers', 'read_orders', 'read_products'],
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'https://romashkaai.vercel.app'}/api/integrations/shopify/callback`,
};

export const shopifyService = new ShopifyIntegrationService(shopifyConfig);