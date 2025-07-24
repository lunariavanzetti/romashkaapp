/**
 * Smart Knowledge Base Generator - Knowledge Extraction Engine
 * Transforms integration data (HubSpot, Shopify, Salesforce) into AI training material
 * Agent 93 - ROMASHKA Knowledge Intelligence System
 */

import { supabase } from '../supabaseClient';
import type { KnowledgeItem } from '../../types/knowledge';

// Enhanced knowledge types for integration data
export interface IntegrationKnowledgeItem extends KnowledgeItem {
  source_integration: string;
  external_id: string;
  integration_metadata: Record<string, any>;
  knowledge_type: 'contact' | 'product' | 'deal' | 'order' | 'company';
  auto_generated: boolean;
  template_used: string;
  last_synced_at: Date;
}

export interface KnowledgeTemplate {
  id: string;
  name: string;
  integration_type: string;
  entity_type: string;
  question_patterns: string[];
  answer_template: string;
  required_fields: string[];
  optional_fields: string[];
  confidence_score: number;
}

export interface KnowledgeGenerationOptions {
  batchSize: number;
  includeInactive: boolean;
  regenerateExisting: boolean;
  minConfidenceScore: number;
  languageCode: string;
}

export interface KnowledgeGenerationResult {
  success: boolean;
  totalRecords: number;
  processedCount: number;
  generatedCount: number;
  updatedCount: number;
  skippedCount: number;
  errors: string[];
  duration: number;
  generatedKnowledge: IntegrationKnowledgeItem[];
}

export class KnowledgeExtractor {
  private templates: Map<string, KnowledgeTemplate[]> = new Map();
  private initialized = false;

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Initialize knowledge templates for different integration types
   */
  private async initializeTemplates(): Promise<void> {
    if (this.initialized) return;

    // HubSpot Contact Templates
    this.templates.set('hubspot_contact', [
      {
        id: 'hubspot_contact_basic',
        name: 'HubSpot Contact Information',
        integration_type: 'hubspot',
        entity_type: 'contact',
        question_patterns: [
          'Who is {first_name} {last_name}?',
          'Tell me about {first_name} {last_name}',
          'What do you know about {email}?',
          'Contact information for {first_name}',
          'Who works at {company}?'
        ],
        answer_template: '{first_name} {last_name} is {title} at {company}. You can reach them at {email}{phone_info}. {deal_info}{lead_source_info}',
        required_fields: ['first_name', 'last_name', 'email'],
        optional_fields: ['company', 'title', 'phone', 'lead_source'],
        confidence_score: 0.9
      },
      {
        id: 'hubspot_contact_company',
        name: 'Company Contact List',
        integration_type: 'hubspot',
        entity_type: 'contact',
        question_patterns: [
          'Who works at {company}?',
          'Contacts from {company}',
          'Team at {company}',
          '{company} employees'
        ],
        answer_template: 'At {company}, we have the following contacts: {contact_list}. {additional_info}',
        required_fields: ['company'],
        optional_fields: ['contact_count', 'primary_contact'],
        confidence_score: 0.85
      }
    ]);

    // Shopify Product Templates
    this.templates.set('shopify_product', [
      {
        id: 'shopify_product_basic',
        name: 'Shopify Product Information',
        integration_type: 'shopify',
        entity_type: 'product',
        question_patterns: [
          'Tell me about {name}',
          'What is {name}?',
          'How much does {name} cost?',
          'Is {name} in stock?',
          'Product details for {name}'
        ],
        answer_template: '{name} costs {price} and we currently have {inventory_quantity} units in stock. {description}{shipping_info}{warranty_info}',
        required_fields: ['name', 'price'],
        optional_fields: ['inventory_quantity', 'description', 'sku', 'status'],
        confidence_score: 0.95
      },
      {
        id: 'shopify_product_category',
        name: 'Product Category Information',
        integration_type: 'shopify',
        entity_type: 'product',
        question_patterns: [
          'What products do we sell?',
          'Show me our product catalog',
          'Available products',
          'Product inventory'
        ],
        answer_template: 'We offer {product_count} products including: {product_list}. {bestseller_info}{stock_status}',
        required_fields: ['product_count'],
        optional_fields: ['bestsellers', 'low_stock_items'],
        confidence_score: 0.8
      }
    ]);

    // Salesforce Deal Templates
    this.templates.set('salesforce_deal', [
      {
        id: 'salesforce_deal_basic',
        name: 'Salesforce Deal Information',
        integration_type: 'salesforce',
        entity_type: 'deal',
        question_patterns: [
          'What is the status of {name}?',
          'Tell me about {name} deal',
          'Deal information for {name}',
          'How much is {name} worth?'
        ],
        answer_template: '{name} is worth {amount} and is currently in the {stage} stage{probability_info}{close_date_info}. {contact_info}',
        required_fields: ['name', 'amount', 'stage'],
        optional_fields: ['probability', 'close_date', 'contact_id'],
        confidence_score: 0.9
      }
    ]);

    this.initialized = true;
  }

  /**
   * Generate knowledge from HubSpot contacts
   */
  async generateHubSpotContactKnowledge(
    userId: string,
    options: Partial<KnowledgeGenerationOptions> = {}
  ): Promise<KnowledgeGenerationResult> {
    const startTime = Date.now();
    const opts = this.getDefaultOptions(options);
    const result: KnowledgeGenerationResult = {
      success: false,
      totalRecords: 0,
      processedCount: 0,
      generatedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      errors: [],
      duration: 0,
      generatedKnowledge: []
    };

    try {
      // Fetch HubSpot contacts
      const { data: contacts, error } = await supabase
        .from('synced_contacts')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', 'hubspot')
        .limit(opts.batchSize);

      if (error) throw error;

      result.totalRecords = contacts?.length || 0;

      if (!contacts || contacts.length === 0) {
        result.success = true;
        result.duration = Date.now() - startTime;
        return result;
      }

      // Get associated deals for context
      const { data: deals } = await supabase
        .from('synced_deals')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', 'hubspot');

      const dealsMap = new Map(deals?.map(deal => [deal.contact_id, deal]) || []);

      // Process each contact
      for (const contact of contacts) {
        try {
          const associatedDeal = dealsMap.get(contact.external_id);
          const knowledgeItems = await this.generateContactKnowledge(contact, associatedDeal, 'hubspot');
          
          for (const item of knowledgeItems) {
            const saved = await this.saveKnowledgeItem(item, userId, opts.regenerateExisting);
            if (saved.created) {
              result.generatedCount++;
              result.generatedKnowledge.push(saved.item);
            } else if (saved.updated) {
              result.updatedCount++;
            } else {
              result.skippedCount++;
            }
          }

          result.processedCount++;
        } catch (error) {
          result.errors.push(`Contact ${contact.external_id}: ${error.message}`);
        }
      }

      result.success = result.errors.length === 0;
      result.duration = Date.now() - startTime;
      return result;

    } catch (error) {
      result.errors.push(`General error: ${error.message}`);
      result.duration = Date.now() - startTime;
      return result;
    }
  }

  /**
   * Generate knowledge from Shopify products
   */
  async generateShopifyProductKnowledge(
    userId: string,
    options: Partial<KnowledgeGenerationOptions> = {}
  ): Promise<KnowledgeGenerationResult> {
    const startTime = Date.now();
    const opts = this.getDefaultOptions(options);
    const result: KnowledgeGenerationResult = {
      success: false,
      totalRecords: 0,
      processedCount: 0,
      generatedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      errors: [],
      duration: 0,
      generatedKnowledge: []
    };

    try {
      // Fetch Shopify products
      const { data: products, error } = await supabase
        .from('synced_products')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', 'shopify')
        .limit(opts.batchSize);

      if (error) throw error;

      result.totalRecords = products?.length || 0;

      if (!products || products.length === 0) {
        result.success = true;
        result.duration = Date.now() - startTime;
        return result;
      }

      // Process each product
      for (const product of products) {
        try {
          const knowledgeItems = await this.generateProductKnowledge(product, 'shopify');
          
          for (const item of knowledgeItems) {
            const saved = await this.saveKnowledgeItem(item, userId, opts.regenerateExisting);
            if (saved.created) {
              result.generatedCount++;
              result.generatedKnowledge.push(saved.item);
            } else if (saved.updated) {
              result.updatedCount++;
            } else {
              result.skippedCount++;
            }
          }

          result.processedCount++;
        } catch (error) {
          result.errors.push(`Product ${product.external_id}: ${error.message}`);
        }
      }

      // Generate category-level knowledge
      try {
        const categoryKnowledge = await this.generateProductCategoryKnowledge(products, 'shopify');
        for (const item of categoryKnowledge) {
          const saved = await this.saveKnowledgeItem(item, userId, opts.regenerateExisting);
          if (saved.created) {
            result.generatedCount++;
            result.generatedKnowledge.push(saved.item);
          }
        }
      } catch (error) {
        result.errors.push(`Category knowledge: ${error.message}`);
      }

      result.success = result.errors.length === 0;
      result.duration = Date.now() - startTime;
      return result;

    } catch (error) {
      result.errors.push(`General error: ${error.message}`);
      result.duration = Date.now() - startTime;
      return result;
    }
  }

  /**
   * Generate knowledge from Salesforce deals
   */
  async generateSalesforceDealKnowledge(
    userId: string,
    options: Partial<KnowledgeGenerationOptions> = {}
  ): Promise<KnowledgeGenerationResult> {
    const startTime = Date.now();
    const opts = this.getDefaultOptions(options);
    const result: KnowledgeGenerationResult = {
      success: false,
      totalRecords: 0,
      processedCount: 0,
      generatedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      errors: [],
      duration: 0,
      generatedKnowledge: []
    };

    try {
      // Fetch Salesforce deals
      const { data: deals, error } = await supabase
        .from('synced_deals')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', 'salesforce')
        .limit(opts.batchSize);

      if (error) throw error;

      result.totalRecords = deals?.length || 0;

      if (!deals || deals.length === 0) {
        result.success = true;
        result.duration = Date.now() - startTime;
        return result;
      }

      // Process each deal
      for (const deal of deals) {
        try {
          const knowledgeItems = await this.generateDealKnowledge(deal, 'salesforce');
          
          for (const item of knowledgeItems) {
            const saved = await this.saveKnowledgeItem(item, userId, opts.regenerateExisting);
            if (saved.created) {
              result.generatedCount++;
              result.generatedKnowledge.push(saved.item);
            } else if (saved.updated) {
              result.updatedCount++;
            } else {
              result.skippedCount++;
            }
          }

          result.processedCount++;
        } catch (error) {
          result.errors.push(`Deal ${deal.external_id}: ${error.message}`);
        }
      }

      result.success = result.errors.length === 0;
      result.duration = Date.now() - startTime;
      return result;

    } catch (error) {
      result.errors.push(`General error: ${error.message}`);
      result.duration = Date.now() - startTime;
      return result;
    }
  }

  /**
   * Generate comprehensive knowledge from all integrations
   */
  async generateAllIntegrationKnowledge(
    userId: string,
    options: Partial<KnowledgeGenerationOptions> = {}
  ): Promise<KnowledgeGenerationResult> {
    const results = await Promise.all([
      this.generateHubSpotContactKnowledge(userId, options),
      this.generateShopifyProductKnowledge(userId, options),
      this.generateSalesforceDealKnowledge(userId, options)
    ]);

    // Combine results
    const combinedResult: KnowledgeGenerationResult = {
      success: results.every(r => r.success),
      totalRecords: results.reduce((sum, r) => sum + r.totalRecords, 0),
      processedCount: results.reduce((sum, r) => sum + r.processedCount, 0),
      generatedCount: results.reduce((sum, r) => sum + r.generatedCount, 0),
      updatedCount: results.reduce((sum, r) => sum + r.updatedCount, 0),
      skippedCount: results.reduce((sum, r) => sum + r.skippedCount, 0),
      errors: results.flatMap(r => r.errors),
      duration: Math.max(...results.map(r => r.duration)),
      generatedKnowledge: results.flatMap(r => r.generatedKnowledge)
    };

    return combinedResult;
  }

  /**
   * Generate knowledge items for a contact
   */
  private async generateContactKnowledge(
    contact: any,
    associatedDeal?: any,
    provider: string = 'hubspot'
  ): Promise<IntegrationKnowledgeItem[]> {
    const templates = this.templates.get(`${provider}_contact`) || [];
    const knowledgeItems: IntegrationKnowledgeItem[] = [];

    for (const template of templates) {
      try {
        const item = await this.applyContactTemplate(template, contact, associatedDeal, provider);
        if (item) {
          knowledgeItems.push(item);
        }
      } catch (error) {
        console.error(`Error applying template ${template.id}:`, error);
      }
    }

    return knowledgeItems;
  }

  /**
   * Generate knowledge items for a product
   */
  private async generateProductKnowledge(
    product: any,
    provider: string = 'shopify'
  ): Promise<IntegrationKnowledgeItem[]> {
    const templates = this.templates.get(`${provider}_product`) || [];
    const knowledgeItems: IntegrationKnowledgeItem[] = [];

    for (const template of templates) {
      if (template.id === `${provider}_product_basic`) {
        try {
          const item = await this.applyProductTemplate(template, product, provider);
          if (item) {
            knowledgeItems.push(item);
          }
        } catch (error) {
          console.error(`Error applying template ${template.id}:`, error);
        }
      }
    }

    return knowledgeItems;
  }

  /**
   * Generate knowledge items for a deal
   */
  private async generateDealKnowledge(
    deal: any,
    provider: string = 'salesforce'
  ): Promise<IntegrationKnowledgeItem[]> {
    const templates = this.templates.get(`${provider}_deal`) || [];
    const knowledgeItems: IntegrationKnowledgeItem[] = [];

    for (const template of templates) {
      try {
        const item = await this.applyDealTemplate(template, deal, provider);
        if (item) {
          knowledgeItems.push(item);
        }
      } catch (error) {
        console.error(`Error applying template ${template.id}:`, error);
      }
    }

    return knowledgeItems;
  }

  /**
   * Apply contact template to generate knowledge
   */
  private async applyContactTemplate(
    template: KnowledgeTemplate,
    contact: any,
    deal?: any,
    provider: string = 'hubspot'
  ): Promise<IntegrationKnowledgeItem | null> {
    // Check if required fields are present
    const hasRequiredFields = template.required_fields.every(field => 
      contact[field] || contact.data?.[field]
    );

    if (!hasRequiredFields) {
      return null;
    }

    // Extract field values
    const fields = this.extractFieldValues(contact, template.required_fields.concat(template.optional_fields));
    
    // Add deal information if available
    if (deal) {
      fields.deal_info = ` They're currently involved in a $${deal.amount || 'TBD'} deal (${deal.name}) which is in the ${deal.stage} stage.`;
    } else {
      fields.deal_info = '';
    }

    // Add phone info
    fields.phone_info = fields.phone ? ` or ${fields.phone}` : '';
    
    // Add lead source info
    fields.lead_source_info = fields.lead_source ? ` They came to us through ${fields.lead_source}.` : '';

    // Generate questions and answers
    const questions = template.question_patterns.map(pattern => 
      this.fillTemplate(pattern, fields)
    );

    const answer = this.fillTemplate(template.answer_template, fields);

    // Create knowledge item
    const knowledgeItem: IntegrationKnowledgeItem = {
      id: `${provider}_contact_${contact.external_id}_${template.id}`,
      title: `${fields.first_name} ${fields.last_name} - Contact Information`,
      content: `Q: ${questions[0]}\nA: ${answer}`,
      category: 'contacts',
      tags: [provider, 'contact', fields.company || 'unknown_company'].filter(Boolean),
      source_type: 'integration' as any,
      confidence_score: template.confidence_score,
      usage_count: 0,
      last_updated: new Date(),
      source_integration: provider,
      external_id: contact.external_id,
      integration_metadata: {
        contact_data: contact,
        deal_data: deal,
        questions: questions,
        template_id: template.id
      },
      knowledge_type: 'contact',
      auto_generated: true,
      template_used: template.id,
      last_synced_at: new Date()
    };

    return knowledgeItem;
  }

  /**
   * Apply product template to generate knowledge
   */
  private async applyProductTemplate(
    template: KnowledgeTemplate,
    product: any,
    provider: string = 'shopify'
  ): Promise<IntegrationKnowledgeItem | null> {
    // Check if required fields are present
    const hasRequiredFields = template.required_fields.every(field => 
      product[field] || product.data?.[field]
    );

    if (!hasRequiredFields) {
      return null;
    }

    // Extract field values
    const fields = this.extractFieldValues(product, template.required_fields.concat(template.optional_fields));
    
    // Format price
    fields.price = fields.price ? `$${fields.price}` : 'Price available on request';
    
    // Add inventory info
    const inventory = fields.inventory_quantity;
    if (inventory !== undefined) {
      if (inventory > 50) {
        fields.inventory_info = ` We have plenty in stock.`;
      } else if (inventory > 0) {
        fields.inventory_info = ` We have limited stock remaining.`;
      } else {
        fields.inventory_info = ` This item is currently out of stock.`;
      }
    } else {
      fields.inventory_info = '';
    }

    // Add description
    fields.description = fields.description ? ` ${fields.description}` : '';
    
    // Add shipping info
    fields.shipping_info = ' Standard shipping takes 3-5 business days.';
    
    // Add warranty info
    fields.warranty_info = ' All our products come with our satisfaction guarantee.';

    // Generate questions and answers
    const questions = template.question_patterns.map(pattern => 
      this.fillTemplate(pattern, fields)
    );

    const answer = this.fillTemplate(template.answer_template, fields) + fields.inventory_info;

    // Create knowledge item
    const knowledgeItem: IntegrationKnowledgeItem = {
      id: `${provider}_product_${product.external_id}_${template.id}`,
      title: `${fields.name} - Product Information`,
      content: `Q: ${questions[0]}\nA: ${answer}`,
      category: 'products',
      tags: [provider, 'product', fields.sku || 'no_sku'].filter(Boolean),
      source_type: 'integration' as any,
      confidence_score: template.confidence_score,
      usage_count: 0,
      last_updated: new Date(),
      source_integration: provider,
      external_id: product.external_id,
      integration_metadata: {
        product_data: product,
        questions: questions,
        template_id: template.id
      },
      knowledge_type: 'product',
      auto_generated: true,
      template_used: template.id,
      last_synced_at: new Date()
    };

    return knowledgeItem;
  }

  /**
   * Apply deal template to generate knowledge
   */
  private async applyDealTemplate(
    template: KnowledgeTemplate,
    deal: any,
    provider: string = 'salesforce'
  ): Promise<IntegrationKnowledgeItem | null> {
    // Check if required fields are present
    const hasRequiredFields = template.required_fields.every(field => 
      deal[field] || deal.data?.[field]
    );

    if (!hasRequiredFields) {
      return null;
    }

    // Extract field values
    const fields = this.extractFieldValues(deal, template.required_fields.concat(template.optional_fields));
    
    // Format amount
    fields.amount = fields.amount ? `$${fields.amount}` : 'Amount TBD';
    
    // Add probability info
    fields.probability_info = fields.probability ? ` with a ${fields.probability}% probability of closing` : '';
    
    // Add close date info
    fields.close_date_info = fields.close_date ? ` expected to close on ${fields.close_date}` : '';
    
    // Add contact info
    fields.contact_info = fields.contact_id ? `The primary contact for this deal is ${fields.contact_id}.` : '';

    // Generate questions and answers
    const questions = template.question_patterns.map(pattern => 
      this.fillTemplate(pattern, fields)
    );

    const answer = this.fillTemplate(template.answer_template, fields);

    // Create knowledge item
    const knowledgeItem: IntegrationKnowledgeItem = {
      id: `${provider}_deal_${deal.external_id}_${template.id}`,
      title: `${fields.name} - Deal Information`,
      content: `Q: ${questions[0]}\nA: ${answer}`,
      category: 'deals',
      tags: [provider, 'deal', fields.stage || 'unknown_stage'].filter(Boolean),
      source_type: 'integration' as any,
      confidence_score: template.confidence_score,
      usage_count: 0,
      last_updated: new Date(),
      source_integration: provider,
      external_id: deal.external_id,
      integration_metadata: {
        deal_data: deal,
        questions: questions,
        template_id: template.id
      },
      knowledge_type: 'deal',
      auto_generated: true,
      template_used: template.id,
      last_synced_at: new Date()
    };

    return knowledgeItem;
  }

  /**
   * Generate product category knowledge
   */
  private async generateProductCategoryKnowledge(
    products: any[],
    provider: string = 'shopify'
  ): Promise<IntegrationKnowledgeItem[]> {
    const template = this.templates.get(`${provider}_product`)?.find(t => t.id === `${provider}_product_category`);
    if (!template) return [];

    const productCount = products.length;
    const productList = products.slice(0, 5).map(p => `${p.name} ($${p.price || 'TBD'})`).join(', ');
    const bestsellers = products.filter(p => p.data?.sales > 100).slice(0, 3);
    const lowStock = products.filter(p => (p.inventory_quantity || 0) < 10);

    const fields = {
      product_count: productCount.toString(),
      product_list: productList + (products.length > 5 ? ` and ${products.length - 5} more` : ''),
      bestseller_info: bestsellers.length > 0 ? ` Our bestsellers include ${bestsellers.map(p => p.name).join(', ')}.` : '',
      stock_status: lowStock.length > 0 ? ` Please note that ${lowStock.map(p => p.name).join(', ')} ${lowStock.length === 1 ? 'is' : 'are'} running low on stock.` : ''
    };

    const questions = template.question_patterns.map(pattern => 
      this.fillTemplate(pattern, fields)
    );

    const answer = this.fillTemplate(template.answer_template, fields);

    const knowledgeItem: IntegrationKnowledgeItem = {
      id: `${provider}_product_category_overview`,
      title: 'Product Catalog Overview',
      content: `Q: ${questions[0]}\nA: ${answer}`,
      category: 'products',
      tags: [provider, 'product', 'catalog', 'overview'],
      source_type: 'integration' as any,
      confidence_score: template.confidence_score,
      usage_count: 0,
      last_updated: new Date(),
      source_integration: provider,
      external_id: 'category_overview',
      integration_metadata: {
        product_count: productCount,
        bestsellers: bestsellers,
        low_stock: lowStock,
        questions: questions,
        template_id: template.id
      },
      knowledge_type: 'product',
      auto_generated: true,
      template_used: template.id,
      last_synced_at: new Date()
    };

    return [knowledgeItem];
  }

  /**
   * Extract field values from data object
   */
  private extractFieldValues(dataObject: any, fields: string[]): Record<string, string> {
    const values: Record<string, string> = {};
    
    for (const field of fields) {
      values[field] = dataObject[field] || dataObject.data?.[field] || '';
    }
    
    return values;
  }

  /**
   * Fill template with field values
   */
  private fillTemplate(template: string, fields: Record<string, string>): string {
    let result = template;
    
    for (const [key, value] of Object.entries(fields)) {
      const placeholder = `{${key}}`;
      result = result.replace(new RegExp(placeholder, 'g'), value || '');
    }
    
    // Clean up any remaining empty placeholders
    result = result.replace(/\{[^}]+\}/g, '').replace(/\s+/g, ' ').trim();
    
    return result;
  }

  /**
   * Save knowledge item to database
   */
  private async saveKnowledgeItem(
    item: IntegrationKnowledgeItem,
    userId: string,
    regenerateExisting: boolean = false
  ): Promise<{ created: boolean; updated: boolean; item: IntegrationKnowledgeItem }> {
    try {
      // Check if item already exists
      const { data: existing } = await supabase
        .from('knowledge_items')
        .select('id, updated_at')
        .eq('title', item.title)
        .eq('source_integration', item.source_integration)
        .eq('external_id', item.external_id)
        .single();

      if (existing && !regenerateExisting) {
        return { created: false, updated: false, item };
      }

      const knowledgeData = {
        title: item.title,
        content: item.content,
        category_id: await this.getCategoryId(item.category),
        source_type: 'integration',
        confidence_score: item.confidence_score,
        usage_count: item.usage_count,
        effectiveness_score: 0.5,
        language: 'en',
        tags: item.tags,
        status: 'active',
        version: 1,
        created_by: userId,
        updated_by: userId,
        // Integration-specific fields
        source_integration: item.source_integration,
        external_id: item.external_id,
        integration_metadata: item.integration_metadata,
        knowledge_type: item.knowledge_type,
        auto_generated: item.auto_generated,
        template_used: item.template_used,
        last_synced_at: item.last_synced_at
      };

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('knowledge_items')
          .update(knowledgeData)
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return { created: false, updated: true, item: { ...item, id: data.id } };
      } else {
        // Create new
        const { data, error } = await supabase
          .from('knowledge_items')
          .insert(knowledgeData)
          .select()
          .single();

        if (error) throw error;
        return { created: true, updated: false, item: { ...item, id: data.id } };
      }
    } catch (error) {
      console.error('Error saving knowledge item:', error);
      throw error;
    }
  }

  /**
   * Get or create category ID
   */
  private async getCategoryId(categoryName: string): Promise<string> {
    const { data: category } = await supabase
      .from('knowledge_categories')
      .select('id')
      .eq('name', categoryName)
      .single();

    if (category) {
      return category.id;
    }

    // Create new category
    const { data: newCategory, error } = await supabase
      .from('knowledge_categories')
      .insert({ 
        name: categoryName,
        description: `Auto-generated category for ${categoryName}`,
        order_index: 99
      })
      .select('id')
      .single();

    if (error) throw error;
    return newCategory.id;
  }

  /**
   * Get default options
   */
  private getDefaultOptions(options: Partial<KnowledgeGenerationOptions>): KnowledgeGenerationOptions {
    return {
      batchSize: options.batchSize || 100,
      includeInactive: options.includeInactive || false,
      regenerateExisting: options.regenerateExisting || false,
      minConfidenceScore: options.minConfidenceScore || 0.7,
      languageCode: options.languageCode || 'en'
    };
  }

  /**
   * Clean up old auto-generated knowledge
   */
  async cleanupOldKnowledge(userId: string, olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const { data, error } = await supabase
      .from('knowledge_items')
      .delete()
      .eq('auto_generated', true)
      .eq('created_by', userId)
      .lt('last_synced_at', cutoffDate.toISOString())
      .select('id');

    if (error) throw error;
    return data?.length || 0;
  }

  /**
   * Get knowledge generation statistics
   */
  async getKnowledgeStats(userId: string): Promise<{
    totalKnowledge: number;
    autoGenerated: number;
    byIntegration: Record<string, number>;
    byType: Record<string, number>;
  }> {
    const { data: stats, error } = await supabase
      .from('knowledge_items')
      .select('source_integration, knowledge_type, auto_generated')
      .eq('created_by', userId);

    if (error) throw error;

    const totalKnowledge = stats?.length || 0;
    const autoGenerated = stats?.filter(s => s.auto_generated).length || 0;
    
    const byIntegration: Record<string, number> = {};
    const byType: Record<string, number> = {};

    stats?.forEach(stat => {
      if (stat.source_integration) {
        byIntegration[stat.source_integration] = (byIntegration[stat.source_integration] || 0) + 1;
      }
      if (stat.knowledge_type) {
        byType[stat.knowledge_type] = (byType[stat.knowledge_type] || 0) + 1;
      }
    });

    return {
      totalKnowledge,
      autoGenerated,
      byIntegration,
      byType
    };
  }
}

export const knowledgeExtractor = new KnowledgeExtractor();
export default knowledgeExtractor;