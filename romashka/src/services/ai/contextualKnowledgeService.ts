/**
 * Contextual Knowledge Injection Service
 * Intelligently retrieves and injects relevant integration knowledge
 * Agent 93 - ROMASHKA Knowledge Intelligence System
 */

import { supabase } from '../supabaseClient';
import { IntegrationKnowledgeItem } from './knowledgeExtractor';

export interface ConversationContext {
  conversationId: string;
  userId: string;
  customerId?: string;
  customerEmail?: string;
  previousMessages: string[];
  currentIntent?: string;
  detectedEntities: DetectedEntity[];
  businessContext?: BusinessContext;
  integrationData?: IntegrationContext;
}

export interface DetectedEntity {
  type: 'person' | 'company' | 'product' | 'deal' | 'order' | 'email' | 'phone' | 'amount';
  value: string;
  confidence: number;
  source: 'message' | 'profile' | 'integration';
}

export interface BusinessContext {
  industry?: string;
  companySize?: string;
  primaryProducts?: string[];
  customerSegment?: string;
  salesStage?: string;
}

export interface IntegrationContext {
  connectedIntegrations: string[];
  customerData?: {
    hubspotContactId?: string;
    salesforceLeadId?: string;
    shopifyCustomerId?: string;
  };
  recentActivity?: {
    lastOrderDate?: Date;
    lastDealUpdate?: Date;
    lastContactInteraction?: Date;
  };
}

export interface KnowledgeInjectionResult {
  relevantKnowledge: IntegrationKnowledgeItem[];
  contextualInsights: ContextualInsight[];
  recommendedActions: RecommendedAction[];
  confidenceScore: number;
  injectionStrategy: 'direct' | 'contextual' | 'proactive';
}

export interface ContextualInsight {
  type: 'customer_status' | 'product_availability' | 'deal_progress' | 'order_history' | 'relationship_mapping';
  title: string;
  content: string;
  relevanceScore: number;
  sourceIntegration: string;
  actionable: boolean;
}

export interface RecommendedAction {
  type: 'follow_up' | 'upsell' | 'support' | 'information' | 'escalation';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  suggestedResponse?: string;
}

export interface KnowledgeRetrievalOptions {
  maxResults: number;
  minRelevanceScore: number;
  includeIntegrations: string[];
  knowledgeTypes: string[];
  prioritizeRecent: boolean;
  includeRelatedEntities: boolean;
}

export class ContextualKnowledgeService {
  private entityExtractors: Map<string, RegExp> = new Map();
  private intentPatterns: Map<string, RegExp[]> = new Map();

  constructor() {
    this.initializeEntityExtractors();
    this.initializeIntentPatterns();
  }

  /**
   * Main method to inject contextual knowledge into conversation
   */
  async injectKnowledge(
    context: ConversationContext,
    currentMessage: string,
    options: Partial<KnowledgeRetrievalOptions> = {}
  ): Promise<KnowledgeInjectionResult> {
    const opts = this.getDefaultOptions(options);

    // 1. Analyze current message and extract entities
    const detectedEntities = await this.extractEntities(currentMessage, context);
    const currentIntent = await this.detectIntent(currentMessage);

    // 2. Update conversation context with new information
    const updatedContext = {
      ...context,
      detectedEntities: [...context.detectedEntities, ...detectedEntities],
      currentIntent: currentIntent || context.currentIntent
    };

    // 3. Retrieve relevant knowledge based on context
    const relevantKnowledge = await this.retrieveRelevantKnowledge(updatedContext, opts);

    // 4. Generate contextual insights
    const contextualInsights = await this.generateContextualInsights(updatedContext, relevantKnowledge);

    // 5. Generate recommended actions
    const recommendedActions = await this.generateRecommendedActions(updatedContext, contextualInsights);

    // 6. Calculate overall confidence score
    const confidenceScore = this.calculateConfidenceScore(relevantKnowledge, contextualInsights);

    // 7. Determine injection strategy
    const injectionStrategy = this.determineInjectionStrategy(updatedContext, relevantKnowledge);

    return {
      relevantKnowledge,
      contextualInsights,
      recommendedActions,
      confidenceScore,
      injectionStrategy
    };
  }

  /**
   * Extract entities from message
   */
  private async extractEntities(message: string, context: ConversationContext): Promise<DetectedEntity[]> {
    const entities: DetectedEntity[] = [];
    const messageLower = message.toLowerCase();

    // Extract email addresses
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = message.match(emailRegex) || [];
    emails.forEach(email => {
      entities.push({
        type: 'email',
        value: email,
        confidence: 0.95,
        source: 'message'
      });
    });

    // Extract phone numbers
    const phoneRegex = /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g;
    const phones = message.match(phoneRegex) || [];
    phones.forEach(phone => {
      entities.push({
        type: 'phone',
        value: phone,
        confidence: 0.9,
        source: 'message'
      });
    });

    // Extract monetary amounts
    const amountRegex = /\$[\d,]+(?:\.\d{2})?/g;
    const amounts = message.match(amountRegex) || [];
    amounts.forEach(amount => {
      entities.push({
        type: 'amount',
        value: amount,
        confidence: 0.85,
        source: 'message'
      });
    });

    // Extract company names (basic pattern matching)
    const companyPatterns = [
      /\b([A-Z][a-z]+ (?:Inc|Corp|LLC|Ltd|Co)\.?)\b/g,
      /\b([A-Z][a-z]+ [A-Z][a-z]+)\s+(?:company|corporation|business)/gi
    ];

    companyPatterns.forEach(pattern => {
      const matches = message.match(pattern) || [];
      matches.forEach(match => {
        entities.push({
          type: 'company',
          value: match,
          confidence: 0.7,
          source: 'message'
        });
      });
    });

    // Extract person names (simple pattern - two capitalized words)
    const nameRegex = /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g;
    const names = message.match(nameRegex) || [];
    names.forEach(name => {
      // Skip if it's already detected as a company
      if (!entities.some(e => e.value === name && e.type === 'company')) {
        entities.push({
          type: 'person',
          value: name,
          confidence: 0.6,
          source: 'message'
        });
      }
    });

    // Cross-reference with existing integration data
    await this.enrichEntitiesWithIntegrationData(entities, context);

    return entities;
  }

  /**
   * Enrich entities with integration data
   */
  private async enrichEntitiesWithIntegrationData(
    entities: DetectedEntity[],
    context: ConversationContext
  ): Promise<void> {
    for (const entity of entities) {
      switch (entity.type) {
        case 'email':
          await this.enrichEmailEntity(entity, context);
          break;
        case 'person':
          await this.enrichPersonEntity(entity, context);
          break;
        case 'company':
          await this.enrichCompanyEntity(entity, context);
          break;
      }
    }
  }

  /**
   * Enrich email entity with contact data
   */
  private async enrichEmailEntity(entity: DetectedEntity, context: ConversationContext): Promise<void> {
    const { data: contacts } = await supabase
      .from('synced_contacts')
      .select('*')
      .eq('user_id', context.userId)
      .eq('email', entity.value)
      .limit(1);

    if (contacts && contacts.length > 0) {
      entity.confidence = Math.min(entity.confidence + 0.2, 1.0);
      entity.source = 'integration';
    }
  }

  /**
   * Enrich person entity with contact data
   */
  private async enrichPersonEntity(entity: DetectedEntity, context: ConversationContext): Promise<void> {
    const [firstName, lastName] = entity.value.split(' ');
    
    const { data: contacts } = await supabase
      .from('synced_contacts')
      .select('*')
      .eq('user_id', context.userId)
      .or(`first_name.ilike.%${firstName}%,last_name.ilike.%${lastName}%`)
      .limit(1);

    if (contacts && contacts.length > 0) {
      entity.confidence = Math.min(entity.confidence + 0.3, 1.0);
      entity.source = 'integration';
    }
  }

  /**
   * Enrich company entity with integration data
   */
  private async enrichCompanyEntity(entity: DetectedEntity, context: ConversationContext): Promise<void> {
    const { data: contacts } = await supabase
      .from('synced_contacts')
      .select('*')
      .eq('user_id', context.userId)
      .ilike('company', `%${entity.value}%`)
      .limit(1);

    if (contacts && contacts.length > 0) {
      entity.confidence = Math.min(entity.confidence + 0.25, 1.0);
      entity.source = 'integration';
    }
  }

  /**
   * Detect intent from message
   */
  private async detectIntent(message: string): Promise<string | null> {
    const messageLower = message.toLowerCase();

    for (const [intent, patterns] of this.intentPatterns) {
      for (const pattern of patterns) {
        if (pattern.test(messageLower)) {
          return intent;
        }
      }
    }

    return null;
  }

  /**
   * Retrieve relevant knowledge based on context
   */
  private async retrieveRelevantKnowledge(
    context: ConversationContext,
    options: KnowledgeRetrievalOptions
  ): Promise<IntegrationKnowledgeItem[]> {
    const knowledgeItems: IntegrationKnowledgeItem[] = [];

    // Build search criteria based on detected entities
    const searchCriteria = this.buildSearchCriteria(context, options);

    // Search for relevant knowledge items
    for (const criteria of searchCriteria) {
      const items = await this.searchKnowledgeItems(criteria, context.userId, options);
      knowledgeItems.push(...items);
    }

    // Remove duplicates and sort by relevance
    const uniqueItems = this.deduplicateKnowledge(knowledgeItems);
    const scoredItems = await this.scoreKnowledgeRelevance(uniqueItems, context);

    return scoredItems
      .filter(item => item.relevanceScore >= options.minRelevanceScore)
      .slice(0, options.maxResults);
  }

  /**
   * Build search criteria from context
   */
  private buildSearchCriteria(
    context: ConversationContext,
    options: KnowledgeRetrievalOptions
  ): SearchCriteria[] {
    const criteria: SearchCriteria[] = [];

    // Search by detected entities
    context.detectedEntities.forEach(entity => {
      if (entity.confidence >= 0.6) {
        criteria.push({
          type: 'entity_match',
          entityType: entity.type,
          entityValue: entity.value,
          weight: entity.confidence
        });
      }
    });

    // Search by intent
    if (context.currentIntent) {
      criteria.push({
        type: 'intent_match',
        intent: context.currentIntent,
        weight: 0.8
      });
    }

    // Search by customer context
    if (context.customerEmail) {
      criteria.push({
        type: 'customer_match',
        customerEmail: context.customerEmail,
        weight: 0.9
      });
    }

    return criteria;
  }

  /**
   * Search knowledge items based on criteria
   */
  private async searchKnowledgeItems(
    criteria: SearchCriteria,
    userId: string,
    options: KnowledgeRetrievalOptions
  ): Promise<IntegrationKnowledgeItem[]> {
    let query = supabase
      .from('knowledge_items')
      .select('*')
      .eq('created_by', userId)
      .eq('status', 'active')
      .eq('auto_generated', true);

    // Apply integration filters
    if (options.includeIntegrations.length > 0) {
      query = query.in('source_integration', options.includeIntegrations);
    }

    // Apply knowledge type filters
    if (options.knowledgeTypes.length > 0) {
      query = query.in('knowledge_type', options.knowledgeTypes);
    }

    // Apply search based on criteria type
    switch (criteria.type) {
      case 'entity_match':
        if (criteria.entityType === 'email') {
          query = query.or(`content.ilike.%${criteria.entityValue}%,title.ilike.%${criteria.entityValue}%`);
        } else if (criteria.entityType === 'person') {
          const [firstName, lastName] = criteria.entityValue.split(' ');
          query = query.or(`content.ilike.%${firstName}%,content.ilike.%${lastName}%`);
        } else {
          query = query.or(`content.ilike.%${criteria.entityValue}%,title.ilike.%${criteria.entityValue}%`);
        }
        break;
      case 'intent_match':
        // Map intents to knowledge types
        const knowledgeTypeMapping = {
          'product_inquiry': ['product'],
          'contact_info': ['contact'],
          'deal_status': ['deal'],
          'order_history': ['order']
        };
        const mappedTypes = knowledgeTypeMapping[criteria.intent] || [];
        if (mappedTypes.length > 0) {
          query = query.in('knowledge_type', mappedTypes);
        }
        break;
      case 'customer_match':
        query = query.or(`content.ilike.%${criteria.customerEmail}%,integration_metadata->>email.ilike.%${criteria.customerEmail}%`);
        break;
    }

    // Order by relevance and recency
    if (options.prioritizeRecent) {
      query = query.order('last_synced_at', { ascending: false });
    } else {
      query = query.order('confidence_score', { ascending: false });
    }

    const { data, error } = await query.limit(20);

    if (error) {
      console.error('Error searching knowledge items:', error);
      return [];
    }

    return (data || []).map(item => ({
      ...item,
      relevanceScore: criteria.weight
    }));
  }

  /**
   * Generate contextual insights
   */
  private async generateContextualInsights(
    context: ConversationContext,
    knowledge: IntegrationKnowledgeItem[]
  ): Promise<ContextualInsight[]> {
    const insights: ContextualInsight[] = [];

    // Group knowledge by integration and type
    const knowledgeGroups = this.groupKnowledgeByType(knowledge);

    // Generate insights for each group
    for (const [type, items] of knowledgeGroups) {
      switch (type) {
        case 'contact':
          insights.push(...await this.generateContactInsights(items, context));
          break;
        case 'product':
          insights.push(...await this.generateProductInsights(items, context));
          break;
        case 'deal':
          insights.push(...await this.generateDealInsights(items, context));
          break;
        case 'order':
          insights.push(...await this.generateOrderInsights(items, context));
          break;
      }
    }

    return insights.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Generate contact insights
   */
  private async generateContactInsights(
    contacts: IntegrationKnowledgeItem[],
    context: ConversationContext
  ): Promise<ContextualInsight[]> {
    const insights: ContextualInsight[] = [];

    if (contacts.length > 0) {
      const contact = contacts[0];
      const metadata = contact.integration_metadata;

      insights.push({
        type: 'customer_status',
        title: 'Customer Information Available',
        content: `I have information about ${metadata?.contact_data?.first_name} ${metadata?.contact_data?.last_name} from ${contact.source_integration}.`,
        relevanceScore: 0.9,
        sourceIntegration: contact.source_integration,
        actionable: true
      });

      // Check for multiple contacts from same company
      const company = metadata?.contact_data?.company;
      if (company) {
        const companyContacts = contacts.filter(c => 
          c.integration_metadata?.contact_data?.company === company
        );

        if (companyContacts.length > 1) {
          insights.push({
            type: 'relationship_mapping',
            title: 'Multiple Contacts at Company',
            content: `We have ${companyContacts.length} contacts at ${company}. This could be a key account.`,
            relevanceScore: 0.8,
            sourceIntegration: contact.source_integration,
            actionable: true
          });
        }
      }
    }

    return insights;
  }

  /**
   * Generate product insights
   */
  private async generateProductInsights(
    products: IntegrationKnowledgeItem[],
    context: ConversationContext
  ): Promise<ContextualInsight[]> {
    const insights: ContextualInsight[] = [];

    if (products.length > 0) {
      // Check inventory status
      const lowStockProducts = products.filter(p => {
        const inventory = p.integration_metadata?.product_data?.inventory_quantity;
        return inventory !== undefined && inventory < 10;
      });

      if (lowStockProducts.length > 0) {
        insights.push({
          type: 'product_availability',
          title: 'Low Stock Alert',
          content: `${lowStockProducts.length} product(s) mentioned are running low on stock.`,
          relevanceScore: 0.85,
          sourceIntegration: products[0].source_integration,
          actionable: true
        });
      }

      // Check for high-value products
      const highValueProducts = products.filter(p => {
        const price = parseFloat(p.integration_metadata?.product_data?.price || '0');
        return price > 500;
      });

      if (highValueProducts.length > 0) {
        insights.push({
          type: 'product_availability',
          title: 'Premium Product Interest',
          content: `Customer is asking about premium products. Consider offering personalized consultation.`,
          relevanceScore: 0.75,
          sourceIntegration: products[0].source_integration,
          actionable: true
        });
      }
    }

    return insights;
  }

  /**
   * Generate deal insights
   */
  private async generateDealInsights(
    deals: IntegrationKnowledgeItem[],
    context: ConversationContext
  ): Promise<ContextualInsight[]> {
    const insights: ContextualInsight[] = [];

    if (deals.length > 0) {
      const deal = deals[0];
      const metadata = deal.integration_metadata;
      const stage = metadata?.deal_data?.stage;

      insights.push({
        type: 'deal_progress',
        title: 'Active Deal in Progress',
        content: `There's an active deal "${metadata?.deal_data?.name}" in ${stage} stage.`,
        relevanceScore: 0.95,
        sourceIntegration: deal.source_integration,
        actionable: true
      });

      // Check deal value
      const amount = parseFloat(metadata?.deal_data?.amount || '0');
      if (amount > 10000) {
        insights.push({
          type: 'deal_progress',
          title: 'High-Value Opportunity',
          content: `This is a high-value deal worth $${amount.toLocaleString()}. Handle with priority.`,
          relevanceScore: 0.9,
          sourceIntegration: deal.source_integration,
          actionable: true
        });
      }
    }

    return insights;
  }

  /**
   * Generate order insights
   */
  private async generateOrderInsights(
    orders: IntegrationKnowledgeItem[],
    context: ConversationContext
  ): Promise<ContextualInsight[]> {
    const insights: ContextualInsight[] = [];

    if (orders.length > 0) {
      const recentOrders = orders.filter(o => {
        const orderDate = new Date(o.integration_metadata?.order_data?.created_at);
        const daysSince = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 30;
      });

      if (recentOrders.length > 0) {
        insights.push({
          type: 'order_history',
          title: 'Recent Purchase Activity',
          content: `Customer has ${recentOrders.length} recent order(s) in the last 30 days.`,
          relevanceScore: 0.8,
          sourceIntegration: orders[0].source_integration,
          actionable: true
        });
      }
    }

    return insights;
  }

  /**
   * Generate recommended actions
   */
  private async generateRecommendedActions(
    context: ConversationContext,
    insights: ContextualInsight[]
  ): Promise<RecommendedAction[]> {
    const actions: RecommendedAction[] = [];

    insights.forEach(insight => {
      switch (insight.type) {
        case 'customer_status':
          actions.push({
            type: 'information',
            priority: 'medium',
            title: 'Personalize Response',
            description: 'Use customer information to provide personalized assistance',
            suggestedResponse: `I see you're ${insight.content}. How can I help you today?`
          });
          break;
        case 'deal_progress':
          actions.push({
            type: 'follow_up',
            priority: 'high',
            title: 'Follow Up on Deal',
            description: 'Address any concerns about the ongoing deal',
            suggestedResponse: 'I see you have an active deal with us. Is there anything specific you need help with regarding this opportunity?'
          });
          break;
        case 'product_availability':
          if (insight.content.includes('low stock')) {
            actions.push({
              type: 'urgency',
              priority: 'high',
              title: 'Stock Alert',
              description: 'Inform customer about limited availability',
              suggestedResponse: 'I should let you know that some of the products you\'re interested in have limited stock available.'
            });
          }
          break;
        case 'order_history':
          actions.push({
            type: 'upsell',
            priority: 'medium',
            title: 'Suggest Related Products',
            description: 'Recommend complementary products based on purchase history'
          });
          break;
      }
    });

    return actions.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidenceScore(
    knowledge: IntegrationKnowledgeItem[],
    insights: ContextualInsight[]
  ): number {
    if (knowledge.length === 0) return 0;

    const avgKnowledgeScore = knowledge.reduce((sum, item) => sum + (item.confidence_score || 0.5), 0) / knowledge.length;
    const avgInsightScore = insights.length > 0 
      ? insights.reduce((sum, insight) => sum + insight.relevanceScore, 0) / insights.length
      : 0.5;

    return (avgKnowledgeScore * 0.6) + (avgInsightScore * 0.4);
  }

  /**
   * Determine injection strategy
   */
  private determineInjectionStrategy(
    context: ConversationContext,
    knowledge: IntegrationKnowledgeItem[]
  ): 'direct' | 'contextual' | 'proactive' {
    if (knowledge.length === 0) return 'direct';

    const hasHighConfidenceKnowledge = knowledge.some(k => k.confidence_score > 0.8);
    const hasDirectEntityMatch = context.detectedEntities.some(e => e.confidence > 0.8);

    if (hasDirectEntityMatch && hasHighConfidenceKnowledge) {
      return 'direct';
    } else if (hasHighConfidenceKnowledge) {
      return 'contextual';
    } else {
      return 'proactive';
    }
  }

  /**
   * Helper methods
   */
  private getDefaultOptions(options: Partial<KnowledgeRetrievalOptions>): KnowledgeRetrievalOptions {
    return {
      maxResults: options.maxResults || 10,
      minRelevanceScore: options.minRelevanceScore || 0.6,
      includeIntegrations: options.includeIntegrations || ['hubspot', 'shopify', 'salesforce'],
      knowledgeTypes: options.knowledgeTypes || ['contact', 'product', 'deal', 'order'],
      prioritizeRecent: options.prioritizeRecent ?? true,
      includeRelatedEntities: options.includeRelatedEntities ?? true
    };
  }

  private deduplicateKnowledge(items: IntegrationKnowledgeItem[]): IntegrationKnowledgeItem[] {
    const seen = new Set();
    return items.filter(item => {
      const key = `${item.source_integration}_${item.external_id}_${item.template_used}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private async scoreKnowledgeRelevance(
    items: IntegrationKnowledgeItem[],
    context: ConversationContext
  ): Promise<IntegrationKnowledgeItem[]> {
    return items.map(item => {
      let relevanceScore = item.confidence_score || 0.5;

      // Boost score for recent updates
      const daysSinceUpdate = (Date.now() - new Date(item.last_synced_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate <= 7) relevanceScore += 0.1;

      // Boost score for entity matches
      context.detectedEntities.forEach(entity => {
        if (item.content.toLowerCase().includes(entity.value.toLowerCase())) {
          relevanceScore += entity.confidence * 0.2;
        }
      });

      return { ...item, relevanceScore: Math.min(relevanceScore, 1.0) };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private groupKnowledgeByType(knowledge: IntegrationKnowledgeItem[]): Map<string, IntegrationKnowledgeItem[]> {
    const groups = new Map();
    knowledge.forEach(item => {
      const type = item.knowledge_type;
      if (!groups.has(type)) {
        groups.set(type, []);
      }
      groups.get(type).push(item);
    });
    return groups;
  }

  private initializeEntityExtractors(): void {
    this.entityExtractors.set('email', /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g);
    this.entityExtractors.set('phone', /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g);
    this.entityExtractors.set('amount', /\$[\d,]+(?:\.\d{2})?/g);
  }

  private initializeIntentPatterns(): void {
    this.intentPatterns.set('product_inquiry', [
      /what.*product/i,
      /tell me about.*product/i,
      /product.*information/i,
      /how much.*cost/i,
      /price.*product/i
    ]);

    this.intentPatterns.set('contact_info', [
      /who is/i,
      /contact.*information/i,
      /tell me about.*person/i,
      /reach.*contact/i
    ]);

    this.intentPatterns.set('deal_status', [
      /deal.*status/i,
      /what.*progress/i,
      /deal.*update/i,
      /opportunity.*status/i
    ]);

    this.intentPatterns.set('order_history', [
      /order.*history/i,
      /previous.*order/i,
      /past.*purchase/i,
      /order.*status/i
    ]);
  }
}

interface SearchCriteria {
  type: 'entity_match' | 'intent_match' | 'customer_match';
  entityType?: string;
  entityValue?: string;
  intent?: string;
  customerEmail?: string;
  weight: number;
}

export const contextualKnowledgeService = new ContextualKnowledgeService();
export default contextualKnowledgeService;