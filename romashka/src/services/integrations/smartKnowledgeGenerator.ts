import { supabase } from '../supabase';
import type { User } from '@supabase/supabase-js';
import type { IntegrationData } from './aiIntegrationBridge';
import AIIntegrationBridge from './aiIntegrationBridge';

export interface GeneratedKnowledge {
  title: string;
  content: string;
  category: string;
  tags: string[];
  source: 'integration_auto_generated';
  confidence_score: number;
}

export class SmartKnowledgeGenerator {
  private user: User;
  private bridge: AIIntegrationBridge;

  constructor(user: User) {
    this.user = user;
    this.bridge = new AIIntegrationBridge(user);
  }

  /**
   * Generates knowledge base entries from integration data
   */
  async generateKnowledgeFromIntegrations(): Promise<GeneratedKnowledge[]> {
    try {
      console.log('[Knowledge Generator] Starting knowledge generation for user:', this.user.id);
      
      const integrationData = await this.bridge.getIntegrationContext();
      const knowledgeEntries: GeneratedKnowledge[] = [];

      // Generate contact/customer knowledge
      if (integrationData.contacts.length > 0) {
        knowledgeEntries.push(...this.generateContactKnowledge(integrationData.contacts));
      }

      // Generate deal pipeline knowledge
      if (integrationData.deals.length > 0) {
        knowledgeEntries.push(...this.generateDealKnowledge(integrationData.deals));
      }

      // Generate product catalog knowledge
      if (integrationData.products.length > 0) {
        knowledgeEntries.push(...this.generateProductKnowledge(integrationData.products));
      }

      // Generate order/sales knowledge
      if (integrationData.orders.length > 0) {
        knowledgeEntries.push(...this.generateOrderKnowledge(integrationData.orders));
      }

      // Generate summary knowledge
      knowledgeEntries.push(this.generateSummaryKnowledge(integrationData));

      console.log('[Knowledge Generator] Generated', knowledgeEntries.length, 'knowledge entries');
      return knowledgeEntries;
    } catch (error) {
      console.error('[Knowledge Generator] Error generating knowledge:', error);
      return [];
    }
  }

  /**
   * Saves generated knowledge to the database
   */
  async saveKnowledgeToDatabase(knowledgeEntries: GeneratedKnowledge[]): Promise<boolean> {
    try {
      console.log('[Knowledge Generator] Saving', knowledgeEntries.length, 'knowledge entries to database');

      // First, delete existing auto-generated entries to avoid duplicates
      await supabase
        .from('knowledge_base')
        .delete()
        .eq('user_id', this.user.id)
        .eq('source', 'integration_auto_generated');

      // Insert new knowledge entries
      const dbEntries = knowledgeEntries.map(entry => ({
        user_id: this.user.id,
        title: entry.title,
        content: entry.content,
        category: entry.category,
        tags: entry.tags,
        source: entry.source,
        confidence_score: entry.confidence_score,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('knowledge_base')
        .insert(dbEntries);

      if (error) {
        console.error('[Knowledge Generator] Database save error:', error);
        return false;
      }

      console.log('[Knowledge Generator] Successfully saved knowledge entries');
      return true;
    } catch (error) {
      console.error('[Knowledge Generator] Error saving to database:', error);
      return false;
    }
  }

  private generateContactKnowledge(contacts: any[]): GeneratedKnowledge[] {
    const entries: GeneratedKnowledge[] = [];

    // Customer overview
    const totalContacts = contacts.length;
    const companies = [...new Set(contacts.filter(c => c.company).map(c => c.company))];
    
    entries.push({
      title: 'Customer Database Overview',
      content: `We have ${totalContacts} contacts in our system. Key companies include: ${companies.slice(0, 10).join(', ')}. Our customer base spans across various industries and represents our growing network of business relationships.`,
      category: 'customers',
      tags: ['contacts', 'customers', 'overview'],
      source: 'integration_auto_generated',
      confidence_score: 0.9
    });

    // Top customers by company
    if (companies.length > 0) {
      entries.push({
        title: 'Key Business Partners',
        content: `Our primary business partners and customers include companies such as ${companies.slice(0, 15).join(', ')}. These organizations represent our core customer relationships and ongoing business opportunities.`,
        category: 'customers',
        tags: ['companies', 'partners', 'business'],
        source: 'integration_auto_generated',
        confidence_score: 0.8
      });
    }

    return entries;
  }

  private generateDealKnowledge(deals: any[]): GeneratedKnowledge[] {
    const entries: GeneratedKnowledge[] = [];

    const totalDeals = deals.length;
    const totalValue = deals.reduce((sum, deal) => sum + (Number(deal.amount) || 0), 0);
    const stages = [...new Set(deals.filter(d => d.stage).map(d => d.stage))];
    
    entries.push({
      title: 'Sales Pipeline Overview',
      content: `We currently have ${totalDeals} active deals in our pipeline with a total value of $${totalValue.toLocaleString()}. Deal stages include: ${stages.join(', ')}. Our sales team is actively working on closing these opportunities.`,
      category: 'sales',
      tags: ['deals', 'pipeline', 'sales'],
      source: 'integration_auto_generated',
      confidence_score: 0.9
    });

    // High-value deals
    const highValueDeals = deals
      .filter(deal => Number(deal.amount) > 1000)
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 5);

    if (highValueDeals.length > 0) {
      const dealList = highValueDeals.map(deal => 
        `${deal.deal_name || 'Unnamed Deal'} ($${Number(deal.amount).toLocaleString()})`
      ).join(', ');
      
      entries.push({
        title: 'High-Value Opportunities',
        content: `Our top sales opportunities include: ${dealList}. These represent significant revenue potential and require focused attention from our sales team.`,
        category: 'sales',
        tags: ['high-value', 'opportunities', 'revenue'],
        source: 'integration_auto_generated',
        confidence_score: 0.8
      });
    }

    return entries;
  }

  private generateProductKnowledge(products: any[]): GeneratedKnowledge[] {
    const entries: GeneratedKnowledge[] = [];

    const totalProducts = products.length;
    const availableProducts = products.filter(p => (p.inventory_quantity || 0) > 0);
    
    entries.push({
      title: 'Product Catalog Overview',
      content: `Our product catalog contains ${totalProducts} items, with ${availableProducts.length} currently in stock. We offer a diverse range of products to meet various customer needs and requirements.`,
      category: 'products',
      tags: ['catalog', 'inventory', 'products'],
      source: 'integration_auto_generated',
      confidence_score: 0.9
    });

    // Featured products (by price or availability)
    const featuredProducts = products
      .filter(p => p.price && p.title)
      .sort((a, b) => Number(b.price) - Number(a.price))
      .slice(0, 10);

    if (featuredProducts.length > 0) {
      const productList = featuredProducts.map(product => 
        `${product.title} ($${Number(product.price).toFixed(2)})`
      ).join(', ');
      
      entries.push({
        title: 'Featured Products',
        content: `Our featured products include: ${productList}. These represent some of our premium offerings and best-selling items.`,
        category: 'products',
        tags: ['featured', 'premium', 'bestsellers'],
        source: 'integration_auto_generated',
        confidence_score: 0.8
      });
    }

    return entries;
  }

  private generateOrderKnowledge(orders: any[]): GeneratedKnowledge[] {
    const entries: GeneratedKnowledge[] = [];

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
    const recentOrders = orders.slice(0, 10);
    
    entries.push({
      title: 'Order History Overview',
      content: `We have processed ${totalOrders} orders with a total revenue of $${totalRevenue.toLocaleString()}. Our order fulfillment system ensures timely processing and delivery of customer orders.`,
      category: 'orders',
      tags: ['orders', 'revenue', 'fulfillment'],
      source: 'integration_auto_generated',
      confidence_score: 0.9
    });

    return entries;
  }

  private generateSummaryKnowledge(data: IntegrationData): GeneratedKnowledge {
    const contactCount = data.contacts.length;
    const dealCount = data.deals.length;
    const productCount = data.products.length;
    const orderCount = data.orders.length;

    return {
      title: 'Business Overview Summary',
      content: `Our business currently manages ${contactCount} customer contacts, ${dealCount} active deals, ${productCount} products, and ${orderCount} processed orders. This integrated view provides a comprehensive understanding of our business operations, customer relationships, and sales performance. Our team can assist with information about any of these areas.`,
      category: 'overview',
      tags: ['summary', 'business', 'overview', 'integrated'],
      source: 'integration_auto_generated',
      confidence_score: 0.95
    };
  }

  /**
   * Auto-generates and saves knowledge base entries
   */
  async autoGenerateKnowledge(): Promise<boolean> {
    try {
      const knowledgeEntries = await this.generateKnowledgeFromIntegrations();
      
      if (knowledgeEntries.length === 0) {
        console.log('[Knowledge Generator] No integration data available for knowledge generation');
        return false;
      }

      const success = await this.saveKnowledgeToDatabase(knowledgeEntries);
      
      if (success) {
        console.log('[Knowledge Generator] Auto-generation completed successfully');
      }

      return success;
    } catch (error) {
      console.error('[Knowledge Generator] Auto-generation failed:', error);
      return false;
    }
  }
}

export default SmartKnowledgeGenerator;