import { supabase } from '../supabase';
import type { User } from '@supabase/supabase-js';

export interface IntegrationData {
  contacts: any[];
  deals: any[];
  orders: any[];
  products: any[];
}

export interface ContactData {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  phone?: string;
  job_title?: string;
  provider: string;
  created_at: string;
}

export interface DealData {
  id: string;
  deal_name?: string;
  amount?: number;
  stage?: string;
  close_date?: string;
  contact_email?: string;
  provider: string;
  created_at: string;
}

export class AIIntegrationBridge {
  private user: User;

  constructor(user: User) {
    this.user = user;
  }

  /**
   * Fetches all integration data for the user to provide context to AI
   */
  async getIntegrationContext(): Promise<IntegrationData> {
    try {
      console.log('[AI Bridge] Fetching integration data for user:', this.user.id);

      const [contactsResult, dealsResult, ordersResult, productsResult] = await Promise.all([
        supabase
          .from('synced_contacts')
          .select('*')
          .eq('user_id', this.user.id)
          .order('created_at', { ascending: false })
          .limit(50),
        
        supabase
          .from('synced_deals')
          .select('*')
          .eq('user_id', this.user.id)
          .order('created_at', { ascending: false })
          .limit(50),
        
        supabase
          .from('synced_orders')
          .select('*')
          .eq('user_id', this.user.id)
          .order('created_at', { ascending: false })
          .limit(50),
        
        supabase
          .from('synced_products')
          .select('*')
          .eq('user_id', this.user.id)
          .order('created_at', { ascending: false })
          .limit(50)
      ]);

      if (contactsResult.error) {
        console.warn('[AI Bridge] Contacts fetch error:', contactsResult.error);
      }
      if (dealsResult.error) {
        console.warn('[AI Bridge] Deals fetch error:', dealsResult.error);
      }
      if (ordersResult.error) {
        console.warn('[AI Bridge] Orders fetch error:', ordersResult.error);
      }
      if (productsResult.error) {
        console.warn('[AI Bridge] Products fetch error:', productsResult.error);
      }

      const integrationData = {
        contacts: contactsResult.data || [],
        deals: dealsResult.data || [],
        orders: ordersResult.data || [],
        products: productsResult.data || []
      };

      console.log('[AI Bridge] Integration data fetched:', {
        contacts: integrationData.contacts.length,
        deals: integrationData.deals.length,
        orders: integrationData.orders.length,
        products: integrationData.products.length
      });

      return integrationData;
    } catch (error) {
      console.error('[AI Bridge] Error fetching integration data:', error);
      return { contacts: [], deals: [], orders: [], products: [] };
    }
  }

  /**
   * Searches for specific contact by email or name
   */
  async findContact(searchTerm: string): Promise<ContactData[]> {
    try {
      const { data, error } = await supabase
        .from('synced_contacts')
        .select('*')
        .eq('user_id', this.user.id)
        .or(`email.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) {
        console.error('[AI Bridge] Contact search error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[AI Bridge] Error searching contacts:', error);
      return [];
    }
  }

  /**
   * Searches for deals by name, amount, or stage
   */
  async findDeals(searchTerm: string): Promise<DealData[]> {
    try {
      const { data, error } = await supabase
        .from('synced_deals')
        .select('*')
        .eq('user_id', this.user.id)
        .or(`deal_name.ilike.%${searchTerm}%,stage.ilike.%${searchTerm}%,contact_email.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) {
        console.error('[AI Bridge] Deal search error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[AI Bridge] Error searching deals:', error);
      return [];
    }
  }

  /**
   * Formats integration data for AI context
   */
  formatForAI(data: IntegrationData): string {
    let context = '';

    if (data.contacts.length > 0) {
      context += '\n\n=== CUSTOMER CONTACTS ===\n';
      data.contacts.slice(0, 10).forEach(contact => {
        context += `• ${contact.first_name || ''} ${contact.last_name || ''} (${contact.email || 'No email'})`;
        if (contact.company) context += ` - ${contact.company}`;
        if (contact.phone) context += ` - ${contact.phone}`;
        context += '\n';
      });
    }

    if (data.deals.length > 0) {
      context += '\n=== ACTIVE DEALS ===\n';
      data.deals.slice(0, 10).forEach(deal => {
        context += `• ${deal.deal_name || 'Unnamed Deal'}`;
        if (deal.amount) context += ` - $${deal.amount}`;
        if (deal.stage) context += ` (${deal.stage})`;
        if (deal.contact_email) context += ` - Contact: ${deal.contact_email}`;
        context += '\n';
      });
    }

    if (data.orders.length > 0) {
      context += '\n=== RECENT ORDERS ===\n';
      data.orders.slice(0, 5).forEach(order => {
        context += `• Order #${order.order_number || order.id}`;
        if (order.total_amount) context += ` - $${order.total_amount}`;
        if (order.status) context += ` (${order.status})`;
        context += '\n';
      });
    }

    if (data.products.length > 0) {
      context += '\n=== AVAILABLE PRODUCTS ===\n';
      data.products.slice(0, 10).forEach(product => {
        context += `• ${product.title || product.name || 'Unnamed Product'}`;
        if (product.price) context += ` - $${product.price}`;
        if (product.inventory_quantity !== undefined) context += ` (Stock: ${product.inventory_quantity})`;
        context += '\n';
      });
    }

    return context;
  }

  /**
   * Determines if a user message is asking about integration data
   */
  isIntegrationQuery(message: string): boolean {
    const integrationKeywords = [
      'contact', 'customer', 'deal', 'sale', 'order', 'product', 'inventory',
      'crm', 'hubspot', 'salesforce', 'shopify', 'pipeline', 'lead'
    ];

    const lowerMessage = message.toLowerCase();
    return integrationKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  /**
   * Gets relevant integration data based on the user's message
   */
  async getRelevantData(message: string): Promise<string> {
    try {
      const lowerMessage = message.toLowerCase();
      
      // If asking about specific contact/customer
      if (lowerMessage.includes('contact') || lowerMessage.includes('customer')) {
        // Try to extract name/email from message
        const emailRegex = /[\w.-]+@[\w.-]+\.\w+/;
        const emailMatch = message.match(emailRegex);
        
        if (emailMatch) {
          const contacts = await this.findContact(emailMatch[0]);
          if (contacts.length > 0) {
            return `Found contact: ${contacts[0].first_name} ${contacts[0].last_name} (${contacts[0].email}) - ${contacts[0].company || 'No company'}`;
          }
        }
      }

      // If asking about deals or sales
      if (lowerMessage.includes('deal') || lowerMessage.includes('sale') || lowerMessage.includes('pipeline')) {
        const allData = await this.getIntegrationContext();
        if (allData.deals.length > 0) {
          const recentDeals = allData.deals.slice(0, 5);
          let dealsInfo = 'Recent deals:\n';
          recentDeals.forEach(deal => {
            dealsInfo += `• ${deal.deal_name || 'Unnamed'} - $${deal.amount || 0} (${deal.stage || 'Unknown stage'})\n`;
          });
          return dealsInfo;
        }
      }

      // For general queries, return formatted context
      const allData = await this.getIntegrationContext();
      return this.formatForAI(allData);
    } catch (error) {
      console.error('[AI Bridge] Error getting relevant data:', error);
      return '';
    }
  }
}

export default AIIntegrationBridge;