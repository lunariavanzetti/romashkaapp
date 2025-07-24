/**
 * AI-Integration Bridge Service
 * Provides intelligent query routing and real-time data access for AI chat system
 * Allows AI to access HubSpot, Shopify, and Salesforce data during conversations
 */

import { supabase } from '../supabaseClient';
import { unifiedIntegrationService } from '../integrations/unifiedIntegrationService';
import type { 
  AIIntegrationContact, 
  AIIntegrationOrder, 
  AIIntegrationProduct, 
  AIIntegrationDeal,
  QueryIntent,
  AIIntegrationContext
} from '../../types/ai-integration';

// Re-export types from the main types file for backward compatibility
export type {
  AIIntegrationContact as IntegrationContact,
  AIIntegrationOrder as IntegrationOrder,
  AIIntegrationProduct as IntegrationProduct,
  AIIntegrationDeal as IntegrationDeal,
  QueryIntent,
  AIIntegrationContext as IntegrationContext
} from '../../types/ai-integration';

// Cache interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class IntegrationQueryService {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes default TTL
  private readonly QUERY_TIMEOUT = 500; // 500ms query timeout

  /**
   * Main entry point: Analyze user message and fetch relevant integration data
   */
  async analyzeAndFetchContext(
    userMessage: string, 
    userId: string, 
    conversationId?: string
  ): Promise<AIIntegrationContext> {
    try {
      console.log('🔍 Analyzing message for integration context:', userMessage);

      // Check if user has any integrations
      const connectedIntegrations = await this.getCachedIntegrations(userId);
      
      if (!connectedIntegrations || connectedIntegrations.length === 0) {
        return {
          hasIntegrations: false,
          availableProviders: []
        };
      }

      // Detect query intent
      const intent = this.detectQueryIntent(userMessage);
      console.log('🎯 Detected intent:', intent);

      // Fetch relevant data based on intent
      const relevantData = await this.fetchRelevantData(intent, userId, userMessage);

      // Generate summary for AI context
      const summary = this.generateDataSummary(relevantData, intent);

      return {
        hasIntegrations: true,
        availableProviders: connectedIntegrations.map(i => i.provider),
        relevantData,
        queryIntent: intent,
        summary
      };

    } catch (error) {
      console.error('❌ Error analyzing integration context:', error);
      return {
        hasIntegrations: false,
        availableProviders: []
      };
    }
  }

  /**
   * Detect user intent from message using keyword analysis and patterns
   */
  private detectQueryIntent(message: string): QueryIntent {
    const lowerMessage = message.toLowerCase();
    
    // Order status patterns
    const orderPatterns = [
      /order.*status/i,
      /where.*my.*order/i,
      /track.*order/i,
      /shipping.*status/i,
      /delivery.*status/i,
      /order.*#?\d+/i,
      /recent.*order/i,
      /last.*order/i
    ];

    // Product info patterns
    const productPatterns = [
      /product.*info/i,
      /tell.*about.*product/i,
      /price.*of/i,
      /available.*stock/i,
      /inventory/i,
      /product.*details/i
    ];

    // Contact/Account info patterns
    const contactPatterns = [
      /my.*account/i,
      /account.*manager/i,
      /contact.*info/i,
      /who.*is.*my/i,
      /assigned.*to.*me/i,
      /my.*rep/i
    ];

    // Deal info patterns
    const dealPatterns = [
      /deal.*status/i,
      /opportunity/i,
      /proposal/i,
      /quote/i,
      /contract/i,
      /negotiation/i
    ];

    // Check patterns and extract entities
    let intent: QueryIntent = {
      type: 'general',
      confidence: 0.3,
      keywords: []
    };

    // Order status detection
    if (orderPatterns.some(pattern => pattern.test(message))) {
      intent = {
        type: 'order_status',
        confidence: 0.9,
        keywords: ['order', 'status', 'shipping', 'delivery'],
        entities: this.extractOrderEntities(message)
      };
    }
    // Product info detection
    else if (productPatterns.some(pattern => pattern.test(message))) {
      intent = {
        type: 'product_info',
        confidence: 0.8,
        keywords: ['product', 'price', 'inventory', 'stock'],
        entities: this.extractProductEntities(message)
      };
    }
    // Contact info detection
    else if (contactPatterns.some(pattern => pattern.test(message))) {
      intent = {
        type: 'contact_info',
        confidence: 0.8,
        keywords: ['account', 'manager', 'contact', 'rep'],
        entities: this.extractContactEntities(message)
      };
    }
    // Deal info detection
    else if (dealPatterns.some(pattern => pattern.test(message))) {
      intent = {
        type: 'deal_info',
        confidence: 0.8,
        keywords: ['deal', 'opportunity', 'proposal', 'quote'],
        entities: this.extractDealEntities(message)
      };
    }

    return intent;
  }

  /**
   * Extract order-related entities from message
   */
  private extractOrderEntities(message: string): any {
    const entities: any = {};
    
    // Extract order number
    const orderNumberMatch = message.match(/#?(\d{4,})/);
    if (orderNumberMatch) {
      entities.order_number = orderNumberMatch[1];
    }

    // Extract email
    const emailMatch = message.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      entities.email = emailMatch[1];
    }

    return entities;
  }

  /**
   * Extract product-related entities from message
   */
  private extractProductEntities(message: string): any {
    const entities: any = {};
    
    // Extract potential product names (quoted strings or capitalized words)
    const quotedMatch = message.match(/"([^"]+)"/);
    if (quotedMatch) {
      entities.product_name = quotedMatch[1];
    }

    return entities;
  }

  /**
   * Extract contact-related entities from message
   */
  private extractContactEntities(message: string): any {
    const entities: any = {};
    
    // Extract email
    const emailMatch = message.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      entities.email = emailMatch[1];
    }

    return entities;
  }

  /**
   * Extract deal-related entities from message
   */
  private extractDealEntities(message: string): any {
    const entities: any = {};
    
    // Extract potential deal names (quoted strings)
    const quotedMatch = message.match(/"([^"]+)"/);
    if (quotedMatch) {
      entities.deal_name = quotedMatch[1];
    }

    return entities;
  }

  /**
   * Fetch relevant data based on detected intent
   */
  private async fetchRelevantData(
    intent: QueryIntent, 
    userId: string, 
    message: string
  ): Promise<any> {
    const promises = [];

    switch (intent.type) {
      case 'order_status':
        promises.push(this.fetchRecentOrders(userId, intent.entities?.order_number, intent.entities?.email));
        if (intent.entities?.email) {
          promises.push(this.fetchContactByEmail(userId, intent.entities.email));
        }
        break;

      case 'product_info':
        promises.push(this.fetchProducts(userId, intent.entities?.product_name));
        break;

      case 'contact_info':
      case 'account_info':
        if (intent.entities?.email) {
          promises.push(this.fetchContactByEmail(userId, intent.entities.email));
        } else {
          promises.push(this.fetchRecentContacts(userId));
        }
        promises.push(this.fetchRecentDeals(userId));
        break;

      case 'deal_info':
        promises.push(this.fetchRecentDeals(userId, intent.entities?.deal_name));
        break;

      default:
        // For general queries, fetch a mix of recent data
        promises.push(this.fetchRecentOrders(userId, undefined, undefined, 3));
        promises.push(this.fetchRecentContacts(userId, 3));
        promises.push(this.fetchRecentDeals(userId, undefined, 3));
        break;
    }

    try {
      const results = await Promise.allSettled(promises);
      const relevantData: any = {};

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          // Map results based on promise order and intent type
          if (intent.type === 'order_status' || intent.type === 'general') {
            if (index === 0) relevantData.orders = result.value;
            if (index === 1) relevantData.contacts = result.value;
          } else if (intent.type === 'product_info') {
            if (index === 0) relevantData.products = result.value;
          } else if (intent.type === 'contact_info' || intent.type === 'account_info') {
            if (index === 0) relevantData.contacts = result.value;
            if (index === 1) relevantData.deals = result.value;
          } else if (intent.type === 'deal_info') {
            if (index === 0) relevantData.deals = result.value;
          } else if (intent.type === 'general') {
            if (index === 0) relevantData.orders = result.value;
            if (index === 1) relevantData.contacts = result.value;
            if (index === 2) relevantData.deals = result.value;
          }
        }
      });

      return relevantData;
    } catch (error) {
      console.error('❌ Error fetching relevant data:', error);
      return {};
    }
  }

  /**
   * Fetch recent orders for the user
   */
  private async fetchRecentOrders(
    userId: string, 
    orderNumber?: string, 
    email?: string, 
    limit: number = 10
  ): Promise<AIIntegrationOrder[]> {
    const cacheKey = `orders:${userId}:${orderNumber || 'recent'}:${email || 'all'}:${limit}`;
    const cached = this.getFromCache<AIIntegrationOrder[]>(cacheKey);
    if (cached) return cached;

    try {
      let query = supabase!
        .from('synced_orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (orderNumber) {
        query = query.ilike('order_number', `%${orderNumber}%`);
      }

      if (email) {
        query = query.eq('customer_email', email);
      }

      const { data, error } = await query;

      if (error) throw error;

      const orders = data || [];
      this.setCache(cacheKey, orders, this.CACHE_TTL);
      return orders;
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      return [];
    }
  }

  /**
   * Fetch products for the user
   */
  private async fetchProducts(
    userId: string, 
    productName?: string, 
    limit: number = 10
  ): Promise<AIIntegrationProduct[]> {
    const cacheKey = `products:${userId}:${productName || 'all'}:${limit}`;
    const cached = this.getFromCache<AIIntegrationProduct[]>(cacheKey);
    if (cached) return cached;

    try {
      let query = supabase!
        .from('synced_products')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (productName) {
        query = query.ilike('name', `%${productName}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      const products = data || [];
      this.setCache(cacheKey, products, this.CACHE_TTL);
      return products;
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      return [];
    }
  }

  /**
   * Fetch contacts for the user
   */
  private async fetchRecentContacts(
    userId: string, 
    limit: number = 10
  ): Promise<AIIntegrationContact[]> {
    const cacheKey = `contacts:${userId}:recent:${limit}`;
    const cached = this.getFromCache<AIIntegrationContact[]>(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase!
        .from('synced_contacts')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const contacts = data || [];
      this.setCache(cacheKey, contacts, this.CACHE_TTL);
      return contacts;
    } catch (error) {
      console.error('❌ Error fetching contacts:', error);
      return [];
    }
  }

  /**
   * Fetch contact by email
   */
  private async fetchContactByEmail(
    userId: string, 
    email: string
  ): Promise<AIIntegrationContact[]> {
    const cacheKey = `contacts:${userId}:email:${email}`;
    const cached = this.getFromCache<AIIntegrationContact[]>(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase!
        .from('synced_contacts')
        .select('*')
        .eq('user_id', userId)
        .eq('email', email);

      if (error) throw error;

      const contacts = data || [];
      this.setCache(cacheKey, contacts, this.CACHE_TTL);
      return contacts;
    } catch (error) {
      console.error('❌ Error fetching contact by email:', error);
      return [];
    }
  }

  /**
   * Fetch deals for the user
   */
  private async fetchRecentDeals(
    userId: string, 
    dealName?: string, 
    limit: number = 10
  ): Promise<AIIntegrationDeal[]> {
    const cacheKey = `deals:${userId}:${dealName || 'recent'}:${limit}`;
    const cached = this.getFromCache<AIIntegrationDeal[]>(cacheKey);
    if (cached) return cached;

    try {
      let query = supabase!
        .from('synced_deals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (dealName) {
        query = query.ilike('name', `%${dealName}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      const deals = data || [];
      this.setCache(cacheKey, deals, this.CACHE_TTL);
      return deals;
    } catch (error) {
      console.error('❌ Error fetching deals:', error);
      return [];
    }
  }

  /**
   * Get cached connected integrations
   */
  private async getCachedIntegrations(userId: string) {
    const cacheKey = `integrations:${userId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user || user.id !== userId) return [];

      const integrations = await unifiedIntegrationService.getConnectedIntegrations();
      this.setCache(cacheKey, integrations, this.CACHE_TTL);
      return integrations;
    } catch (error) {
      console.error('❌ Error fetching integrations:', error);
      return [];
    }
  }

  /**
   * Generate a summary of the fetched data for AI context
   */
  private generateDataSummary(relevantData: any, intent: QueryIntent): string {
    const summaryParts: string[] = [];

    if (relevantData.orders && relevantData.orders.length > 0) {
      const orders = relevantData.orders;
      const orderSummary = orders.map((order: IntegrationOrder) => 
        `Order ${order.order_number || order.external_id}: ${order.status || 'Unknown status'}, ${order.total_amount ? `$${order.total_amount} ${order.currency || ''}` : 'Amount unknown'}`
      ).join('; ');
      summaryParts.push(`Recent Orders: ${orderSummary}`);
    }

    if (relevantData.products && relevantData.products.length > 0) {
      const products = relevantData.products;
      const productSummary = products.map((product: IntegrationProduct) => 
        `${product.name}: ${product.price ? `$${product.price} ${product.currency || ''}` : 'Price not available'}, ${product.inventory_quantity !== undefined ? `Stock: ${product.inventory_quantity}` : 'Stock unknown'}`
      ).join('; ');
      summaryParts.push(`Products: ${productSummary}`);
    }

    if (relevantData.contacts && relevantData.contacts.length > 0) {
      const contacts = relevantData.contacts;
      const contactSummary = contacts.map((contact: IntegrationContact) => 
        `${contact.first_name || ''} ${contact.last_name || ''} (${contact.email || 'No email'})${contact.company ? ` at ${contact.company}` : ''}`
      ).join('; ');
      summaryParts.push(`Contacts: ${contactSummary}`);
    }

    if (relevantData.deals && relevantData.deals.length > 0) {
      const deals = relevantData.deals;
      const dealSummary = deals.map((deal: IntegrationDeal) => 
        `${deal.name}: ${deal.stage || 'Unknown stage'}, ${deal.amount ? `$${deal.amount}` : 'Amount unknown'}`
      ).join('; ');
      summaryParts.push(`Deals: ${dealSummary}`);
    }

    return summaryParts.length > 0 
      ? `Integration Data Available: ${summaryParts.join(' | ')}`
      : 'No relevant integration data found for this query.';
  }

  /**
   * Cache management
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCache<T>(key: string, data: T, ttl: number = this.CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    // Clean up old cache entries periodically
    if (this.cache.size > 100) {
      this.cleanupCache();
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cached data (useful for testing or user logout)
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const integrationQueryService = new IntegrationQueryService();
export default integrationQueryService;