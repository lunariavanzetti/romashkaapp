/**
 * AI Prompt Enhancement Service
 * Enhances AI prompts with integration context and formats data for optimal AI consumption
 */

import type { AIIntegrationContext, QueryIntent } from '../../types/ai-integration';

export interface EnhancedPromptRequest {
  userMessage: string;
  originalKnowledgeBase: string;
  integrationContext: AIIntegrationContext;
  agentTone?: string;
  businessType?: string;
  userId: string;
}

export interface EnhancedPromptResponse {
  enhancedSystemPrompt: string;
  enhancedUserPrompt: string;
  contextSummary: string;
  hasIntegrationData: boolean;
}

class PromptEnhancementService {
  
  /**
   * Main method to enhance AI prompts with integration context
   */
  enhancePromptWithIntegrations(request: EnhancedPromptRequest): EnhancedPromptResponse {
    const { userMessage, originalKnowledgeBase, integrationContext, agentTone, businessType } = request;

    // If no integrations or relevant data, return original prompts
    if (!integrationContext.hasIntegrations || !integrationContext.relevantData) {
      return {
        enhancedSystemPrompt: this.buildBaseSystemPrompt(agentTone, businessType),
        enhancedUserPrompt: this.buildBaseUserPrompt(userMessage, originalKnowledgeBase),
        contextSummary: 'No integration data available',
        hasIntegrationData: false
      };
    }

    // Build enhanced prompts with integration context
    const enhancedSystemPrompt = this.buildEnhancedSystemPrompt(
      integrationContext, 
      agentTone, 
      businessType
    );

    const enhancedUserPrompt = this.buildEnhancedUserPrompt(
      userMessage, 
      originalKnowledgeBase, 
      integrationContext
    );

    return {
      enhancedSystemPrompt,
      enhancedUserPrompt,
      contextSummary: integrationContext.summary || 'Integration data loaded',
      hasIntegrationData: true
    };
  }

  /**
   * Build enhanced system prompt with integration awareness
   */
  private buildEnhancedSystemPrompt(
    context: AIIntegrationContext, 
    agentTone?: string, 
    businessType?: string
  ): string {
    const tone = agentTone || 'helpful and professional';
    const business = businessType || 'general business';
    const providers = context.availableProviders.join(', ');

    let integrationCapabilities = '';
    if (context.availableProviders.includes('shopify')) {
      integrationCapabilities += '- Access to Shopify order history, product catalog, and customer information\n';
    }
    if (context.availableProviders.includes('hubspot')) {
      integrationCapabilities += '- Access to HubSpot contacts, deals, and CRM data\n';
    }
    if (context.availableProviders.includes('salesforce')) {
      integrationCapabilities += '- Access to Salesforce leads, opportunities, and account information\n';
    }

    return `You are a ${tone} customer service assistant for a ${business} business. You have access to real-time business data from connected integrations (${providers}).

INTEGRATION CAPABILITIES:
${integrationCapabilities}

CRITICAL INSTRUCTIONS:
1. You have REAL-TIME ACCESS to customer data - use it to provide specific, accurate answers
2. When you have relevant integration data, reference it naturally without saying "I found this" or "according to our system"
3. Speak as if you personally know the customer's information and history
4. For order inquiries, provide specific order numbers, statuses, and tracking information when available
5. For product questions, give current pricing, availability, and inventory levels
6. For account questions, reference the customer's actual purchase history and contact details
7. Be conversational and personal - you're not a search engine, you're a knowledgeable team member
8. If integration data contradicts knowledge base info, prioritize the real-time integration data
9. Use a ${tone} tone and be conversational
10. NEVER make up information not provided in either the knowledge base or integration data

INTEGRATION DATA PRIORITY:
- For order status, shipping, and purchase history: Use integration data as primary source
- For product pricing and availability: Use integration data as primary source  
- For customer account details: Use integration data as primary source
- For general policies and procedures: Use knowledge base as primary source

Remember: You have access to live business data, so provide specific, actionable information when possible.`;
  }

  /**
   * Build enhanced user prompt with formatted integration data
   */
  private buildEnhancedUserPrompt(
    userMessage: string, 
    originalKnowledgeBase: string, 
    context: AIIntegrationContext
  ): string {
    let prompt = `CUSTOMER QUESTION:
${userMessage}

KNOWLEDGE BASE:
${originalKnowledgeBase}`;

    // Add integration data section
    if (context.relevantData) {
      prompt += '\n\nREAL-TIME INTEGRATION DATA:';
      
      // Add orders data
      if (context.relevantData.orders && context.relevantData.orders.length > 0) {
        prompt += '\n\nORDER INFORMATION:';
        context.relevantData.orders.forEach(order => {
          prompt += `\n- Order ${order.order_number || order.external_id} (${order.provider.toUpperCase()})`;
          prompt += `\n  Status: ${order.status || 'Unknown'}`;
          prompt += `\n  Total: ${order.total_amount ? `$${order.total_amount} ${order.currency || ''}` : 'Not specified'}`;
          prompt += `\n  Customer: ${order.customer_email || 'Not specified'}`;
          prompt += `\n  Date: ${new Date(order.created_at).toLocaleDateString()}`;
          
          // Add order items if available
          if (order.items && Array.isArray(order.items)) {
            prompt += '\n  Items:';
            order.items.slice(0, 3).forEach((item: any) => {
              prompt += `\n    - ${item.name || item.title || 'Unknown item'} (Qty: ${item.quantity || 1})`;
            });
            if (order.items.length > 3) {
              prompt += `\n    - ... and ${order.items.length - 3} more items`;
            }
          }
          
          // Add additional data from provider-specific fields
          if (order.data) {
            if (order.data.financial_status) {
              prompt += `\n  Payment Status: ${order.data.financial_status}`;
            }
            if (order.data.fulfillment_status) {
              prompt += `\n  Fulfillment Status: ${order.data.fulfillment_status}`;
            }
            if (order.data.tracking_number) {
              prompt += `\n  Tracking: ${order.data.tracking_number}`;
            }
          }
          prompt += '\n';
        });
      }

      // Add products data
      if (context.relevantData.products && context.relevantData.products.length > 0) {
        prompt += '\n\nPRODUCT INFORMATION:';
        context.relevantData.products.forEach(product => {
          prompt += `\n- ${product.name} (${product.provider.toUpperCase()})`;
          prompt += `\n  Price: ${product.price ? `$${product.price} ${product.currency || ''}` : 'Not specified'}`;
          prompt += `\n  SKU: ${product.sku || 'Not specified'}`;
          prompt += `\n  Stock: ${product.inventory_quantity !== undefined ? product.inventory_quantity : 'Unknown'}`;
          prompt += `\n  Status: ${product.status || 'Unknown'}`;
          if (product.description) {
            prompt += `\n  Description: ${product.description.substring(0, 150)}${product.description.length > 150 ? '...' : ''}`;
          }
          prompt += '\n';
        });
      }

      // Add contacts data
      if (context.relevantData.contacts && context.relevantData.contacts.length > 0) {
        prompt += '\n\nCONTACT INFORMATION:';
        context.relevantData.contacts.forEach(contact => {
          prompt += `\n- ${contact.first_name || ''} ${contact.last_name || ''} (${contact.provider.toUpperCase()})`;
          prompt += `\n  Email: ${contact.email || 'Not specified'}`;
          prompt += `\n  Phone: ${contact.phone || 'Not specified'}`;
          prompt += `\n  Company: ${contact.company || 'Not specified'}`;
          prompt += `\n  Title: ${contact.title || 'Not specified'}`;
          prompt += `\n  Lead Source: ${contact.lead_source || 'Not specified'}`;
          
          // Add additional contact data
          if (contact.data) {
            if (contact.data.lifecycle_stage) {
              prompt += `\n  Stage: ${contact.data.lifecycle_stage}`;
            }
            if (contact.data.total_spent) {
              prompt += `\n  Total Spent: $${contact.data.total_spent}`;
            }
            if (contact.data.orders_count) {
              prompt += `\n  Orders: ${contact.data.orders_count}`;
            }
          }
          prompt += '\n';
        });
      }

      // Add deals data
      if (context.relevantData.deals && context.relevantData.deals.length > 0) {
        prompt += '\n\nDEAL INFORMATION:';
        context.relevantData.deals.forEach(deal => {
          prompt += `\n- ${deal.name} (${deal.provider.toUpperCase()})`;
          prompt += `\n  Stage: ${deal.stage || 'Unknown'}`;
          prompt += `\n  Amount: ${deal.amount ? `$${deal.amount}` : 'Not specified'}`;
          prompt += `\n  Close Date: ${deal.close_date ? new Date(deal.close_date).toLocaleDateString() : 'Not specified'}`;
          prompt += `\n  Probability: ${deal.probability ? `${deal.probability}%` : 'Not specified'}`;
          
          // Add additional deal data
          if (deal.data) {
            if (deal.data.deal_type) {
              prompt += `\n  Type: ${deal.data.deal_type}`;
            }
            if (deal.data.pipeline) {
              prompt += `\n  Pipeline: ${deal.data.pipeline}`;
            }
          }
          prompt += '\n';
        });
      }

      // Add query intent context
      if (context.queryIntent && context.queryIntent.confidence > 0.7) {
        prompt += `\n\nQUERY CONTEXT:`;
        prompt += `\n- Detected Intent: ${context.queryIntent.type}`;
        prompt += `\n- Confidence: ${Math.round(context.queryIntent.confidence * 100)}%`;
        if (context.queryIntent.entities) {
          prompt += `\n- Extracted Entities: ${JSON.stringify(context.queryIntent.entities)}`;
        }
      }
    }

    prompt += '\n\nPlease provide a helpful, specific answer using the real-time integration data above when relevant. Prioritize integration data for current information like order status, pricing, and customer details.';

    return prompt;
  }

  /**
   * Build base system prompt (fallback when no integrations)
   */
  private buildBaseSystemPrompt(agentTone?: string, businessType?: string): string {
    const tone = agentTone || 'helpful and professional';
    const business = businessType || 'general business';

    return `You are a ${tone} customer service assistant for a ${business} business. Your job is to provide natural, conversational answers based ONLY on the provided knowledge base.

CRITICAL INSTRUCTIONS:
1. SPEAK AS IF YOU KNOW THE INFORMATION PERSONALLY - Don't say "I found this" or "according to our information"
2. Answer NATURALLY as if you work for this company and know these policies by heart
3. Use a ${tone} tone and be conversational
4. Give CONCISE, direct answers - don't repeat information
5. If no relevant information exists, say "I don't have that information available"
6. NEVER make up information not in the knowledge base
7. Sound human and personal, not like a search engine

IMPORTANT: Sound natural and personal, like you're speaking directly to the customer as a knowledgeable team member.`;
  }

  /**
   * Build base user prompt (fallback when no integrations)
   */
  private buildBaseUserPrompt(userMessage: string, knowledgeBase: string): string {
    return `CUSTOMER QUESTION:
${userMessage}

KNOWLEDGE BASE:
${knowledgeBase}

Please provide a helpful answer based on the knowledge base above. If the information isn't available, let me know that you don't have that information.`;
  }

  /**
   * Format integration data for specific query types
   */
  formatDataForQueryType(
    data: any, 
    queryType: QueryIntent['type']
  ): string {
    switch (queryType) {
      case 'order_status':
        return this.formatOrderStatusData(data);
      case 'product_info':
        return this.formatProductData(data);
      case 'contact_info':
      case 'account_info':
        return this.formatContactData(data);
      case 'deal_info':
        return this.formatDealData(data);
      default:
        return this.formatGeneralData(data);
    }
  }

  /**
   * Format order status specific data
   */
  private formatOrderStatusData(data: any): string {
    if (!data.orders || data.orders.length === 0) {
      return 'No recent orders found.';
    }

    const orders = data.orders.slice(0, 3); // Limit to 3 most recent
    return orders.map((order: any) => {
      let orderInfo = `Order ${order.order_number || order.external_id}: ${order.status || 'Status unknown'}`;
      
      if (order.total_amount) {
        orderInfo += `, Total: $${order.total_amount}`;
      }
      
      if (order.data?.tracking_number) {
        orderInfo += `, Tracking: ${order.data.tracking_number}`;
      }
      
      return orderInfo;
    }).join('\n');
  }

  /**
   * Format product specific data
   */
  private formatProductData(data: any): string {
    if (!data.products || data.products.length === 0) {
      return 'No products found.';
    }

    const products = data.products.slice(0, 5); // Limit to 5 products
    return products.map((product: any) => {
      let productInfo = `${product.name}`;
      
      if (product.price) {
        productInfo += `: $${product.price}`;
      }
      
      if (product.inventory_quantity !== undefined) {
        productInfo += `, Stock: ${product.inventory_quantity}`;
      }
      
      return productInfo;
    }).join('\n');
  }

  /**
   * Format contact specific data
   */
  private formatContactData(data: any): string {
    if (!data.contacts || data.contacts.length === 0) {
      return 'No contact information found.';
    }

    const contacts = data.contacts.slice(0, 3); // Limit to 3 contacts
    return contacts.map((contact: any) => {
      let contactInfo = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
      
      if (contact.email) {
        contactInfo += ` (${contact.email})`;
      }
      
      if (contact.company) {
        contactInfo += ` at ${contact.company}`;
      }
      
      return contactInfo;
    }).join('\n');
  }

  /**
   * Format deal specific data
   */
  private formatDealData(data: any): string {
    if (!data.deals || data.deals.length === 0) {
      return 'No deals found.';
    }

    const deals = data.deals.slice(0, 3); // Limit to 3 deals
    return deals.map((deal: any) => {
      let dealInfo = `${deal.name}: ${deal.stage || 'Unknown stage'}`;
      
      if (deal.amount) {
        dealInfo += `, Value: $${deal.amount}`;
      }
      
      if (deal.close_date) {
        dealInfo += `, Close Date: ${new Date(deal.close_date).toLocaleDateString()}`;
      }
      
      return dealInfo;
    }).join('\n');
  }

  /**
   * Format general data overview
   */
  private formatGeneralData(data: any): string {
    const sections = [];

    if (data.orders && data.orders.length > 0) {
      sections.push(`Recent Orders: ${data.orders.length} found`);
    }

    if (data.products && data.products.length > 0) {
      sections.push(`Products: ${data.products.length} found`);
    }

    if (data.contacts && data.contacts.length > 0) {
      sections.push(`Contacts: ${data.contacts.length} found`);
    }

    if (data.deals && data.deals.length > 0) {
      sections.push(`Deals: ${data.deals.length} found`);
    }

    return sections.length > 0 
      ? sections.join(', ')
      : 'No relevant data found.';
  }

  /**
   * Privacy-aware data filtering
   * Removes sensitive information based on user permissions and context
   */
  filterSensitiveData(data: any, userId: string): any {
    // Create a deep copy to avoid modifying original data
    const filteredData = JSON.parse(JSON.stringify(data));

    // Remove sensitive fields that shouldn't be exposed to AI
    const sensitiveFields = [
      'access_token',
      'refresh_token',
      'password',
      'ssn',
      'credit_card',
      'bank_account'
    ];

    const removeSensitiveFields = (obj: any) => {
      if (typeof obj !== 'object' || obj === null) return;

      for (const key in obj) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          delete obj[key];
        } else if (typeof obj[key] === 'object') {
          removeSensitiveFields(obj[key]);
        }
      }
    };

    removeSensitiveFields(filteredData);
    return filteredData;
  }

  /**
   * Generate context-aware response templates
   */
  generateResponseTemplate(queryType: QueryIntent['type'], hasData: boolean): string {
    if (!hasData) {
      return "I don't have that specific information available in our system right now.";
    }

    switch (queryType) {
      case 'order_status':
        return "Here's the current status of your order(s):";
      case 'product_info':
        return "Here's the information about our products:";
      case 'contact_info':
        return "Here's your account information:";
      case 'deal_info':
        return "Here's the status of your deals/opportunities:";
      default:
        return "Based on your account information:";
    }
  }
}

export const promptEnhancementService = new PromptEnhancementService();
export default promptEnhancementService;