import { oauthManager } from '../oauthManager';
import type { OAuthConfig } from '../oauthManager';
import type { 
  Order, 
  OrderItem, 
  Product, 
  Address, 
  ShopifyConfig,
  User,
  Integration 
} from '../../../types/integrations';

export interface ShopifyCustomer {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  accepts_marketing: boolean;
  state: 'disabled' | 'invited' | 'enabled' | 'declined';
  verified_email: boolean;
  addresses: ShopifyAddress[];
  orders_count: number;
  total_spent: string;
  tags: string;
  note?: string;
}

export interface ShopifyOrder {
  id: number;
  order_number: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
  closed_at?: string;
  processed_at?: string;
  customer: ShopifyCustomer;
  line_items: ShopifyLineItem[];
  shipping_address?: ShopifyAddress;
  billing_address?: ShopifyAddress;
  financial_status: 'pending' | 'authorized' | 'partially_paid' | 'paid' | 'partially_refunded' | 'refunded' | 'voided';
  fulfillment_status?: 'fulfilled' | 'null' | 'partial' | 'restocked';
  total_price: string;
  subtotal_price: string;
  total_tax: string;
  currency: string;
  tags: string;
  note?: string;
  gateway: string;
  test: boolean;
  total_weight: number;
  taxes_included: boolean;
  confirmed: boolean;
}

export interface ShopifyLineItem {
  id: number;
  product_id: number;
  variant_id: number;
  title: string;
  quantity: number;
  price: string;
  sku?: string;
  variant_title?: string;
  vendor?: string;
  fulfillment_service: string;
  fulfillment_status?: string;
  requires_shipping: boolean;
  taxable: boolean;
  gift_card: boolean;
  name: string;
  variant_inventory_management?: string;
  properties: any[];
  product_exists: boolean;
  fulfillable_quantity: number;
  total_discount: string;
  tax_lines: any[];
}

export interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  template_suffix?: string;
  status: 'active' | 'archived' | 'draft';
  published_scope: string;
  tags: string;
  admin_graphql_api_id: string;
  variants: ShopifyVariant[];
  options: ShopifyOption[];
  images: ShopifyImage[];
  image?: ShopifyImage;
  handle: string;
}

export interface ShopifyVariant {
  id: number;
  product_id: number;
  title: string;
  price: string;
  sku: string;
  position: number;
  inventory_policy: 'deny' | 'continue';
  compare_at_price?: string;
  fulfillment_service: string;
  inventory_management?: string;
  option1?: string;
  option2?: string;
  option3?: string;
  created_at: string;
  updated_at: string;
  taxable: boolean;
  barcode?: string;
  grams: number;
  image_id?: number;
  weight: number;
  weight_unit: string;
  inventory_item_id: number;
  inventory_quantity: number;
  old_inventory_quantity: number;
  requires_shipping: boolean;
  admin_graphql_api_id: string;
}

export interface ShopifyOption {
  id: number;
  product_id: number;
  name: string;
  position: number;
  values: string[];
}

export interface ShopifyImage {
  id: number;
  product_id: number;
  position: number;
  created_at: string;
  updated_at: string;
  alt?: string;
  width: number;
  height: number;
  src: string;
  variant_ids: number[];
  admin_graphql_api_id: string;
}

export interface ShopifyAddress {
  id?: number;
  customer_id?: number;
  first_name?: string;
  last_name?: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  country: string;
  zip: string;
  phone?: string;
  name?: string;
  province_code?: string;
  country_code?: string;
  country_name?: string;
  default?: boolean;
}

export interface ShopifyWebhook {
  id: number;
  topic: string;
  address: string;
  created_at: string;
  updated_at: string;
  format: 'json' | 'xml';
  api_version: string;
  private_metafield_namespaces?: string[];
  metafield_namespaces?: string[];
  fields?: string[];
}

export interface ShopifyResponse<T> {
  data?: T;
  errors?: any[];
  extensions?: any;
}

export class ShopifyService {
  private readonly baseUrl: string;
  private rateLimitRemaining: number = 40;
  private rateLimitReset: number = 0;

  constructor(private shopDomain: string, private apiVersion: string = '2023-10') {
    this.baseUrl = `https://${shopDomain}/admin/api/${apiVersion}`;
  }

  // Authentication methods
  async authenticate(integrationId: string): Promise<string> {
    const config = this.getOAuthConfig();
    return await oauthManager.getValidAccessToken(integrationId, config);
  }

  async testConnection(integrationId: string): Promise<boolean> {
    try {
      const accessToken = await this.authenticate(integrationId);
      
      const response = await fetch(`${this.baseUrl}/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Shopify connection test failed:', error);
      return false;
    }
  }

  // Customer operations
  async createCustomer(integrationId: string, customerData: Partial<User>): Promise<string> {
    const accessToken = await this.authenticate(integrationId);
    
    const shopifyCustomer = this.mapToShopifyCustomer(customerData);
    
    const response = await this.makeRequest('POST', '/customers.json', { customer: shopifyCustomer }, accessToken);
    
    return response.customer.id.toString();
  }

  async updateCustomer(integrationId: string, customerId: string, updates: Partial<User>): Promise<void> {
    const accessToken = await this.authenticate(integrationId);
    
    const shopifyUpdates = this.mapToShopifyCustomer(updates);
    
    await this.makeRequest('PUT', `/customers/${customerId}.json`, { customer: shopifyUpdates }, accessToken);
  }

  async getCustomer(integrationId: string, customerId: string): Promise<User | null> {
    const accessToken = await this.authenticate(integrationId);
    
    const response = await this.makeRequest('GET', `/customers/${customerId}.json`, null, accessToken);
    
    if (!response?.customer) return null;
    
    return this.mapFromShopifyCustomer(response.customer);
  }

  async getCustomerByEmail(integrationId: string, email: string): Promise<User | null> {
    const accessToken = await this.authenticate(integrationId);
    
    const response = await this.makeRequest('GET', `/customers/search.json?query=email:${encodeURIComponent(email)}`, null, accessToken);
    
    if (!response?.customers || response.customers.length === 0) return null;
    
    return this.mapFromShopifyCustomer(response.customers[0]);
  }

  async listCustomers(integrationId: string, limit: number = 50): Promise<User[]> {
    const accessToken = await this.authenticate(integrationId);
    
    const response = await this.makeRequest('GET', `/customers.json?limit=${limit}`, null, accessToken);
    
    if (!response?.customers) return [];
    
    return response.customers.map((customer: ShopifyCustomer) => this.mapFromShopifyCustomer(customer));
  }

  async searchCustomers(integrationId: string, query: string, limit: number = 50): Promise<User[]> {
    const accessToken = await this.authenticate(integrationId);
    
    const response = await this.makeRequest('GET', `/customers/search.json?query=${encodeURIComponent(query)}&limit=${limit}`, null, accessToken);
    
    if (!response?.customers) return [];
    
    return response.customers.map((customer: ShopifyCustomer) => this.mapFromShopifyCustomer(customer));
  }

  // Order operations
  async getOrder(integrationId: string, orderId: string): Promise<Order | null> {
    const accessToken = await this.authenticate(integrationId);
    
    const response = await this.makeRequest('GET', `/orders/${orderId}.json`, null, accessToken);
    
    if (!response?.order) return null;
    
    return this.mapFromShopifyOrder(response.order);
  }

  async listOrders(integrationId: string, status?: string, limit: number = 50): Promise<Order[]> {
    const accessToken = await this.authenticate(integrationId);
    
    let endpoint = `/orders.json?limit=${limit}`;
    if (status) {
      endpoint += `&status=${status}`;
    }
    
    const response = await this.makeRequest('GET', endpoint, null, accessToken);
    
    if (!response?.orders) return [];
    
    return response.orders.map((order: ShopifyOrder) => this.mapFromShopifyOrder(order));
  }

  async getCustomerOrders(integrationId: string, customerId: string, limit: number = 50): Promise<Order[]> {
    const accessToken = await this.authenticate(integrationId);
    
    const response = await this.makeRequest('GET', `/customers/${customerId}/orders.json?limit=${limit}`, null, accessToken);
    
    if (!response?.orders) return [];
    
    return response.orders.map((order: ShopifyOrder) => this.mapFromShopifyOrder(order));
  }

  async updateOrder(integrationId: string, orderId: string, updates: any): Promise<void> {
    const accessToken = await this.authenticate(integrationId);
    
    await this.makeRequest('PUT', `/orders/${orderId}.json`, { order: updates }, accessToken);
  }

  async cancelOrder(integrationId: string, orderId: string, reason?: string): Promise<void> {
    const accessToken = await this.authenticate(integrationId);
    
    const cancelData = {
      reason: reason || 'other',
      email: true,
      refund: false
    };
    
    await this.makeRequest('POST', `/orders/${orderId}/cancel.json`, cancelData, accessToken);
  }

  // Product operations
  async getProduct(integrationId: string, productId: string): Promise<Product | null> {
    const accessToken = await this.authenticate(integrationId);
    
    const response = await this.makeRequest('GET', `/products/${productId}.json`, null, accessToken);
    
    if (!response?.product) return null;
    
    return this.mapFromShopifyProduct(response.product);
  }

  async listProducts(integrationId: string, limit: number = 50): Promise<Product[]> {
    const accessToken = await this.authenticate(integrationId);
    
    const response = await this.makeRequest('GET', `/products.json?limit=${limit}`, null, accessToken);
    
    if (!response?.products) return [];
    
    return response.products.map((product: ShopifyProduct) => this.mapFromShopifyProduct(product));
  }

  async createProduct(integrationId: string, productData: Partial<Product>): Promise<string> {
    const accessToken = await this.authenticate(integrationId);
    
    const shopifyProduct = this.mapToShopifyProduct(productData);
    
    const response = await this.makeRequest('POST', '/products.json', { product: shopifyProduct }, accessToken);
    
    return response.product.id.toString();
  }

  async updateProduct(integrationId: string, productId: string, updates: Partial<Product>): Promise<void> {
    const accessToken = await this.authenticate(integrationId);
    
    const shopifyUpdates = this.mapToShopifyProduct(updates);
    
    await this.makeRequest('PUT', `/products/${productId}.json`, { product: shopifyUpdates }, accessToken);
  }

  async deleteProduct(integrationId: string, productId: string): Promise<void> {
    const accessToken = await this.authenticate(integrationId);
    
    await this.makeRequest('DELETE', `/products/${productId}.json`, null, accessToken);
  }

  // Inventory operations
  async getInventoryLevel(integrationId: string, inventoryItemId: string, locationId: string): Promise<number> {
    const accessToken = await this.authenticate(integrationId);
    
    const response = await this.makeRequest(
      'GET',
      `/inventory_levels.json?inventory_item_ids=${inventoryItemId}&location_ids=${locationId}`,
      null,
      accessToken
    );
    
    if (!response?.inventory_levels || response.inventory_levels.length === 0) return 0;
    
    return response.inventory_levels[0].available || 0;
  }

  async updateInventoryLevel(integrationId: string, inventoryItemId: string, locationId: string, quantity: number): Promise<void> {
    const accessToken = await this.authenticate(integrationId);
    
    const adjustmentData = {
      location_id: locationId,
      inventory_item_id: inventoryItemId,
      available_adjustment: quantity
    };
    
    await this.makeRequest('POST', '/inventory_levels/adjust.json', adjustmentData, accessToken);
  }

  // Webhook operations
  async createWebhook(integrationId: string, topic: string, address: string): Promise<string> {
    const accessToken = await this.authenticate(integrationId);
    
    const webhookData = {
      webhook: {
        topic,
        address,
        format: 'json'
      }
    };
    
    const response = await this.makeRequest('POST', '/webhooks.json', webhookData, accessToken);
    
    return response.webhook.id.toString();
  }

  async listWebhooks(integrationId: string): Promise<ShopifyWebhook[]> {
    const accessToken = await this.authenticate(integrationId);
    
    const response = await this.makeRequest('GET', '/webhooks.json', null, accessToken);
    
    return response?.webhooks || [];
  }

  async deleteWebhook(integrationId: string, webhookId: string): Promise<void> {
    const accessToken = await this.authenticate(integrationId);
    
    await this.makeRequest('DELETE', `/webhooks/${webhookId}.json`, null, accessToken);
  }

  // Data fetching for sync
  async fetchData(integrationId: string, entities: string[]): Promise<any[]> {
    const results: any[] = [];
    
    for (const entity of entities) {
      try {
        let data: any[] = [];
        
        switch (entity) {
          case 'customers':
            data = await this.listCustomers(integrationId, 250);
            break;
          case 'orders':
            data = await this.listOrders(integrationId, undefined, 250);
            break;
          case 'products':
            data = await this.listProducts(integrationId, 250);
            break;
        }
        
        results.push(...data);
      } catch (error) {
        console.error(`Failed to fetch ${entity}:`, error);
      }
    }
    
    return results;
  }

  // Webhook handling
  async handleWebhook(integrationId: string, payload: any): Promise<void> {
    try {
      const topic = payload.topic || 'unknown';
      
      switch (topic) {
        case 'customers/create':
          await this.handleCustomerCreated(integrationId, payload);
          break;
        case 'customers/update':
          await this.handleCustomerUpdated(integrationId, payload);
          break;
        case 'customers/delete':
          await this.handleCustomerDeleted(integrationId, payload);
          break;
        case 'orders/create':
          await this.handleOrderCreated(integrationId, payload);
          break;
        case 'orders/updated':
          await this.handleOrderUpdated(integrationId, payload);
          break;
        case 'orders/paid':
          await this.handleOrderPaid(integrationId, payload);
          break;
        case 'orders/cancelled':
          await this.handleOrderCancelled(integrationId, payload);
          break;
        case 'orders/fulfilled':
          await this.handleOrderFulfilled(integrationId, payload);
          break;
        case 'products/create':
          await this.handleProductCreated(integrationId, payload);
          break;
        case 'products/update':
          await this.handleProductUpdated(integrationId, payload);
          break;
        case 'products/delete':
          await this.handleProductDeleted(integrationId, payload);
          break;
      }
    } catch (error) {
      console.error('Shopify webhook handling failed:', error);
    }
  }

  // Helper methods
  private async makeRequest(method: string, endpoint: string, data: any, accessToken: string): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const options: RequestInit = {
      method,
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, options);
    
    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '1');
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return this.makeRequest(method, endpoint, data, accessToken);
    }
    
    if (!response.ok) {
      let errorMessage = `Shopify API error: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage += ` - ${errorData.errors || JSON.stringify(errorData)}`;
      } catch (e) {
        // Ignore JSON parsing errors
      }
      
      throw new Error(errorMessage);
    }
    
    // Update rate limit info
    const callLimit = response.headers.get('X-Shopify-Shop-Api-Call-Limit');
    if (callLimit) {
      const [used, limit] = callLimit.split('/').map(Number);
      this.rateLimitRemaining = limit - used;
    }
    
    return response.status === 204 ? null : await response.json();
  }

  private getOAuthConfig(): OAuthConfig {
    const baseUrl = window.location.origin;
    return {
      clientId: '', // Should be configured
      clientSecret: '', // Should be configured
      redirectUri: `${baseUrl}/integrations/oauth/callback/shopify`,
      authUrl: `https://${this.shopDomain}/admin/oauth/authorize`,
      tokenUrl: `https://${this.shopDomain}/admin/oauth/access_token`,
      scope: 'read_customers,read_orders,read_products,write_customers',
      provider: 'shopify'
    };
  }

  // Mapping methods
  private mapToShopifyCustomer(customer: Partial<User>): any {
    return {
      first_name: customer.name?.split(' ')[0],
      last_name: customer.name?.split(' ').slice(1).join(' '),
      email: customer.email,
      verified_email: true,
      accepts_marketing: false,
      state: 'enabled'
    };
  }

  private mapFromShopifyCustomer(shopifyCustomer: ShopifyCustomer): User {
    return {
      id: shopifyCustomer.id.toString(),
      email: shopifyCustomer.email,
      name: [shopifyCustomer.first_name, shopifyCustomer.last_name].filter(Boolean).join(' '),
      role: 'end-user',
      active: shopifyCustomer.state === 'enabled',
      created_at: shopifyCustomer.created_at,
      updated_at: shopifyCustomer.updated_at
    };
  }

  private mapFromShopifyOrder(shopifyOrder: ShopifyOrder): Order {
    return {
      id: shopifyOrder.id.toString(),
      order_number: shopifyOrder.order_number.toString(),
      customer_id: shopifyOrder.customer.id.toString(),
      total_amount: parseFloat(shopifyOrder.total_price),
      currency: shopifyOrder.currency,
      status: shopifyOrder.financial_status,
      items: shopifyOrder.line_items.map(item => this.mapFromShopifyLineItem(item)),
      shipping_address: shopifyOrder.shipping_address ? this.mapFromShopifyAddress(shopifyOrder.shipping_address) : undefined,
      billing_address: shopifyOrder.billing_address ? this.mapFromShopifyAddress(shopifyOrder.billing_address) : undefined,
      created_at: shopifyOrder.created_at,
      updated_at: shopifyOrder.updated_at
    };
  }

  private mapFromShopifyLineItem(shopifyItem: ShopifyLineItem): OrderItem {
    return {
      id: shopifyItem.id.toString(),
      product_id: shopifyItem.product_id.toString(),
      product_name: shopifyItem.title,
      quantity: shopifyItem.quantity,
      unit_price: parseFloat(shopifyItem.price),
      total_price: parseFloat(shopifyItem.price) * shopifyItem.quantity,
      sku: shopifyItem.sku
    };
  }

  private mapFromShopifyAddress(shopifyAddress: ShopifyAddress): Address {
    return {
      first_name: shopifyAddress.first_name,
      last_name: shopifyAddress.last_name,
      company: shopifyAddress.company,
      address1: shopifyAddress.address1,
      address2: shopifyAddress.address2,
      city: shopifyAddress.city,
      state: shopifyAddress.province,
      postal_code: shopifyAddress.zip,
      country: shopifyAddress.country,
      phone: shopifyAddress.phone
    };
  }

  private mapFromShopifyProduct(shopifyProduct: ShopifyProduct): Product {
    const mainVariant = shopifyProduct.variants[0];
    
    return {
      id: shopifyProduct.id.toString(),
      name: shopifyProduct.title,
      description: shopifyProduct.body_html,
      price: mainVariant ? parseFloat(mainVariant.price) : 0,
      currency: 'USD', // Default, should be fetched from shop settings
      sku: mainVariant?.sku,
      inventory_quantity: mainVariant?.inventory_quantity,
      status: shopifyProduct.status as any,
      created_at: shopifyProduct.created_at,
      updated_at: shopifyProduct.updated_at
    };
  }

  private mapToShopifyProduct(product: Partial<Product>): any {
    return {
      title: product.name,
      body_html: product.description,
      status: product.status || 'active',
      variants: [{
        price: product.price?.toString() || '0',
        sku: product.sku,
        inventory_quantity: product.inventory_quantity || 0
      }]
    };
  }

  // Webhook handlers
  private async handleCustomerCreated(integrationId: string, customer: any): Promise<void> {
    console.log('Shopify customer created:', customer.id);
    // Implementation depends on specific requirements
  }

  private async handleCustomerUpdated(integrationId: string, customer: any): Promise<void> {
    console.log('Shopify customer updated:', customer.id);
    // Implementation depends on specific requirements
  }

  private async handleCustomerDeleted(integrationId: string, customer: any): Promise<void> {
    console.log('Shopify customer deleted:', customer.id);
    // Implementation depends on specific requirements
  }

  private async handleOrderCreated(integrationId: string, order: any): Promise<void> {
    console.log('Shopify order created:', order.id);
    // Implementation depends on specific requirements
  }

  private async handleOrderUpdated(integrationId: string, order: any): Promise<void> {
    console.log('Shopify order updated:', order.id);
    // Implementation depends on specific requirements
  }

  private async handleOrderPaid(integrationId: string, order: any): Promise<void> {
    console.log('Shopify order paid:', order.id);
    // Implementation depends on specific requirements
  }

  private async handleOrderCancelled(integrationId: string, order: any): Promise<void> {
    console.log('Shopify order cancelled:', order.id);
    // Implementation depends on specific requirements
  }

  private async handleOrderFulfilled(integrationId: string, order: any): Promise<void> {
    console.log('Shopify order fulfilled:', order.id);
    // Implementation depends on specific requirements
  }

  private async handleProductCreated(integrationId: string, product: any): Promise<void> {
    console.log('Shopify product created:', product.id);
    // Implementation depends on specific requirements
  }

  private async handleProductUpdated(integrationId: string, product: any): Promise<void> {
    console.log('Shopify product updated:', product.id);
    // Implementation depends on specific requirements
  }

  private async handleProductDeleted(integrationId: string, product: any): Promise<void> {
    console.log('Shopify product deleted:', product.id);
    // Implementation depends on specific requirements
  }

  // Find record for sync
  async findRecord(integrationId: string, record: any): Promise<any> {
    if (record.email) {
      return await this.getCustomerByEmail(integrationId, record.email);
    }
    return null;
  }

  // Create record for sync
  async createRecord(integrationId: string, record: any): Promise<string> {
    if (record.email) {
      return await this.createCustomer(integrationId, record);
    }
    throw new Error('Unsupported record type');
  }

  // Update record for sync
  async updateRecord(integrationId: string, recordId: string, record: any): Promise<void> {
    await this.updateCustomer(integrationId, recordId, record);
  }

  // Shop information
  async getShopInfo(integrationId: string): Promise<any> {
    const accessToken = await this.authenticate(integrationId);
    
    const response = await this.makeRequest('GET', '/shop.json', null, accessToken);
    
    return response?.shop || null;
  }

  // Location operations
  async getLocations(integrationId: string): Promise<any[]> {
    const accessToken = await this.authenticate(integrationId);
    
    const response = await this.makeRequest('GET', '/locations.json', null, accessToken);
    
    return response?.locations || [];
  }

  // Fulfillment operations
  async createFulfillment(integrationId: string, orderId: string, lineItems: any[]): Promise<string> {
    const accessToken = await this.authenticate(integrationId);
    
    const fulfillmentData = {
      fulfillment: {
        location_id: 1, // Default location
        tracking_number: null,
        notify_customer: true,
        line_items: lineItems.map(item => ({
          id: item.id,
          quantity: item.quantity
        }))
      }
    };
    
    const response = await this.makeRequest('POST', `/orders/${orderId}/fulfillments.json`, fulfillmentData, accessToken);
    
    return response.fulfillment.id.toString();
  }

  // Refund operations
  async createRefund(integrationId: string, orderId: string, refundLineItems: any[], amount?: number): Promise<string> {
    const accessToken = await this.authenticate(integrationId);
    
    const refundData = {
      refund: {
        currency: 'USD',
        notify: true,
        refund_line_items: refundLineItems,
        ...(amount && { amount })
      }
    };
    
    const response = await this.makeRequest('POST', `/orders/${orderId}/refunds.json`, refundData, accessToken);
    
    return response.refund.id.toString();
  }
}