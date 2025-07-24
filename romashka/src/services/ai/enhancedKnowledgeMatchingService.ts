/**
 * Enhanced Knowledge Matching Service with Integration Intelligence
 * Combines traditional knowledge matching with contextual integration data
 * Agent 93 - ROMASHKA Knowledge Intelligence System
 */

import { knowledgeMatchingService } from './knowledgeMatchingService';
import { contextualKnowledgeService, ConversationContext, KnowledgeInjectionResult } from './contextualKnowledgeService';
import { supabase } from '../supabaseClient';

interface EnhancedKnowledgeMatchRequest {
  question: string;
  conversationId: string;
  userId: string;
  customerEmail?: string;
  previousMessages?: string[];
  agentTone?: string;
  businessType?: string;
  includeIntegrationData?: boolean;
  maxResults?: number;
}

interface EnhancedKnowledgeMatchResponse {
  answer: string | null;
  confidence: number;
  sources: string[];
  integrationInsights?: IntegrationInsight[];
  recommendedActions?: RecommendedAction[];
  contextualData?: ContextualData;
  injectionStrategy: 'direct' | 'contextual' | 'proactive';
  knowledgeUsed: KnowledgeUsageInfo[];
}

interface IntegrationInsight {
  type: 'customer_info' | 'product_data' | 'deal_status' | 'order_history' | 'relationship_context';
  title: string;
  content: string;
  integration: string;
  confidence: number;
  actionable: boolean;
}

interface RecommendedAction {
  type: 'follow_up' | 'upsell' | 'support' | 'information' | 'escalation';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  suggestedResponse?: string;
}

interface ContextualData {
  customerProfile?: any;
  recentActivity?: any;
  relatedEntities?: any[];
  businessContext?: any;
}

interface KnowledgeUsageInfo {
  knowledgeItemId: string;
  title: string;
  source: string;
  relevanceScore: number;
  usageType: 'direct_match' | 'contextual_injection' | 'background_info';
}

export class EnhancedKnowledgeMatchingService {
  private readonly baseService = knowledgeMatchingService;
  private readonly contextualService = contextualKnowledgeService;

  /**
   * Enhanced knowledge matching with integration intelligence
   */
  async findEnhancedAnswer(request: EnhancedKnowledgeMatchRequest): Promise<EnhancedKnowledgeMatchResponse> {
    try {
      console.log('🧠 Enhanced Knowledge Matching:', request.question);

      // 1. Build conversation context
      const conversationContext = await this.buildConversationContext(request);

      // 2. Get contextual knowledge injection
      let injectionResult: KnowledgeInjectionResult | null = null;
      if (request.includeIntegrationData !== false) {
        injectionResult = await this.contextualService.injectKnowledge(
          conversationContext,
          request.question,
          {
            maxResults: request.maxResults || 10,
            minRelevanceScore: 0.6,
            prioritizeRecent: true
          }
        );
      }

      // 3. Build enhanced knowledge base
      const enhancedKnowledgeBase = await this.buildEnhancedKnowledgeBase(
        request,
        injectionResult
      );

      // 4. Get base AI response
      const baseResponse = await this.baseService.findAnswer({
        question: request.question,
        knowledgeBase: enhancedKnowledgeBase,
        agentTone: request.agentTone,
        businessType: request.businessType
      });

      // 5. Enhance response with integration insights
      const enhancedResponse = await this.enhanceResponse(
        baseResponse,
        injectionResult,
        conversationContext,
        request
      );

      // 6. Track knowledge usage
      await this.trackKnowledgeUsage(enhancedResponse, request);

      return enhancedResponse;

    } catch (error) {
      console.error('❌ Enhanced knowledge matching error:', error);
      
      // Fallback to base service
      const fallbackResponse = await this.baseService.findAnswer({
        question: request.question,
        knowledgeBase: '',
        agentTone: request.agentTone,
        businessType: request.businessType
      });

      return {
        answer: fallbackResponse.answer,
        confidence: fallbackResponse.confidence * 0.5, // Reduce confidence for fallback
        sources: fallbackResponse.sources || [],
        injectionStrategy: 'direct',
        knowledgeUsed: []
      };
    }
  }

  /**
   * Build conversation context from request
   */
  private async buildConversationContext(request: EnhancedKnowledgeMatchRequest): Promise<ConversationContext> {
    // Get existing conversation context if available
    const { data: existingContext } = await supabase
      .from('conversation_context')
      .select('*')
      .eq('conversation_id', request.conversationId)
      .single();

    // Get integration data for the user
    const integrationData = await this.getIntegrationData(request.userId);

    return {
      conversationId: request.conversationId,
      userId: request.userId,
      customerEmail: request.customerEmail,
      previousMessages: request.previousMessages || [],
      detectedEntities: existingContext?.key_entities || [],
      businessContext: existingContext?.business_context,
      integrationData
    };
  }

  /**
   * Get integration data for user
   */
  private async getIntegrationData(userId: string): Promise<any> {
    try {
      // Get connected integrations
      const { data: tokens } = await supabase
        .from('oauth_tokens')
        .select('provider')
        .eq('user_id', userId);

      const connectedIntegrations = tokens?.map(t => t.provider) || [];

      // Get recent activity summary
      const recentActivity = await this.getRecentActivity(userId);

      return {
        connectedIntegrations,
        recentActivity
      };
    } catch (error) {
      console.error('Error getting integration data:', error);
      return { connectedIntegrations: [], recentActivity: {} };
    }
  }

  /**
   * Get recent activity from integrations
   */
  private async getRecentActivity(userId: string): Promise<any> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    try {
      // Get recent contacts
      const { data: recentContacts } = await supabase
        .from('synced_contacts')
        .select('*')
        .eq('user_id', userId)
        .gte('updated_at', thirtyDaysAgo.toISOString())
        .limit(5);

      // Get recent orders
      const { data: recentOrders } = await supabase
        .from('synced_orders')
        .select('*')
        .eq('user_id', userId)
        .gte('updated_at', thirtyDaysAgo.toISOString())
        .limit(5);

      // Get recent deals
      const { data: recentDeals } = await supabase
        .from('synced_deals')
        .select('*')
        .eq('user_id', userId)
        .gte('updated_at', thirtyDaysAgo.toISOString())
        .limit(5);

      return {
        lastContactUpdate: recentContacts?.[0]?.updated_at,
        lastOrderDate: recentOrders?.[0]?.created_at,
        lastDealUpdate: recentDeals?.[0]?.updated_at,
        recentContactsCount: recentContacts?.length || 0,
        recentOrdersCount: recentOrders?.length || 0,
        recentDealsCount: recentDeals?.length || 0
      };
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return {};
    }
  }

  /**
   * Build enhanced knowledge base combining traditional and integration knowledge
   */
  private async buildEnhancedKnowledgeBase(
    request: EnhancedKnowledgeMatchRequest,
    injectionResult: KnowledgeInjectionResult | null
  ): Promise<string> {
    const knowledgeParts: string[] = [];

    // 1. Get traditional knowledge base
    const { data: traditionalKnowledge } = await supabase
      .from('knowledge_items')
      .select('title, content')
      .eq('created_by', request.userId)
      .eq('status', 'active')
      .eq('auto_generated', false)
      .or(`title.ilike.%${request.question}%,content.ilike.%${request.question}%`)
      .limit(5);

    if (traditionalKnowledge && traditionalKnowledge.length > 0) {
      knowledgeParts.push('=== GENERAL KNOWLEDGE ===');
      traditionalKnowledge.forEach(item => {
        knowledgeParts.push(`Title: ${item.title}`);
        knowledgeParts.push(`Content: ${item.content}`);
        knowledgeParts.push('---');
      });
    }

    // 2. Add integration knowledge if available
    if (injectionResult && injectionResult.relevantKnowledge.length > 0) {
      knowledgeParts.push('=== INTEGRATION DATA ===');
      
      injectionResult.relevantKnowledge.forEach(item => {
        knowledgeParts.push(`Source: ${item.source_integration.toUpperCase()}`);
        knowledgeParts.push(`Type: ${item.knowledge_type}`);
        knowledgeParts.push(`Title: ${item.title}`);
        knowledgeParts.push(`Content: ${item.content}`);
        knowledgeParts.push(`Confidence: ${item.confidence_score}`);
        knowledgeParts.push('---');
      });
    }

    // 3. Add contextual insights
    if (injectionResult && injectionResult.contextualInsights.length > 0) {
      knowledgeParts.push('=== CONTEXTUAL INSIGHTS ===');
      
      injectionResult.contextualInsights.forEach(insight => {
        knowledgeParts.push(`Insight: ${insight.title}`);
        knowledgeParts.push(`Content: ${insight.content}`);
        knowledgeParts.push(`Source: ${insight.sourceIntegration}`);
        knowledgeParts.push('---');
      });
    }

    return knowledgeParts.join('\n');
  }

  /**
   * Enhance base response with integration insights
   */
  private async enhanceResponse(
    baseResponse: any,
    injectionResult: KnowledgeInjectionResult | null,
    context: ConversationContext,
    request: EnhancedKnowledgeMatchRequest
  ): Promise<EnhancedKnowledgeMatchResponse> {
    
    // Convert contextual insights to integration insights
    const integrationInsights: IntegrationInsight[] = injectionResult?.contextualInsights.map(insight => ({
      type: insight.type as any,
      title: insight.title,
      content: insight.content,
      integration: insight.sourceIntegration,
      confidence: insight.relevanceScore,
      actionable: insight.actionable
    })) || [];

    // Convert recommended actions
    const recommendedActions: RecommendedAction[] = injectionResult?.recommendedActions || [];

    // Build contextual data
    const contextualData: ContextualData = {
      businessContext: context.businessContext,
      recentActivity: context.integrationData?.recentActivity
    };

    // Track knowledge usage
    const knowledgeUsed: KnowledgeUsageInfo[] = [];
    
    if (injectionResult?.relevantKnowledge) {
      injectionResult.relevantKnowledge.forEach(item => {
        knowledgeUsed.push({
          knowledgeItemId: item.id,
          title: item.title,
          source: item.source_integration,
          relevanceScore: item.relevanceScore || item.confidence_score,
          usageType: 'contextual_injection'
        });
      });
    }

    // Enhance answer with integration context
    let enhancedAnswer = baseResponse.answer;
    if (enhancedAnswer && integrationInsights.length > 0) {
      // Add relevant insights to the answer
      const highConfidenceInsights = integrationInsights.filter(i => i.confidence > 0.8);
      if (highConfidenceInsights.length > 0) {
        const insightText = highConfidenceInsights
          .slice(0, 2) // Limit to top 2 insights
          .map(i => i.content)
          .join(' ');
        
        enhancedAnswer = `${enhancedAnswer}\n\nAdditional context: ${insightText}`;
      }
    }

    // Calculate enhanced confidence
    let enhancedConfidence = baseResponse.confidence;
    if (injectionResult) {
      enhancedConfidence = Math.min(
        (baseResponse.confidence * 0.7) + (injectionResult.confidenceScore * 0.3),
        1.0
      );
    }

    return {
      answer: enhancedAnswer,
      confidence: enhancedConfidence,
      sources: [
        ...(baseResponse.sources || []),
        ...integrationInsights.map(i => `${i.integration} ${i.type}`)
      ],
      integrationInsights,
      recommendedActions,
      contextualData,
      injectionStrategy: injectionResult?.injectionStrategy || 'direct',
      knowledgeUsed
    };
  }

  /**
   * Track knowledge usage for analytics
   */
  private async trackKnowledgeUsage(
    response: EnhancedKnowledgeMatchResponse,
    request: EnhancedKnowledgeMatchRequest
  ): Promise<void> {
    try {
      // Track each knowledge item used
      for (const knowledge of response.knowledgeUsed) {
        await supabase.rpc('track_knowledge_usage', {
          p_knowledge_item_id: knowledge.knowledgeItemId,
          p_conversation_id: request.conversationId,
          p_user_id: request.userId,
          p_usage_type: knowledge.usageType,
          p_context_data: {
            question: request.question,
            confidence: response.confidence,
            injection_strategy: response.injectionStrategy
          },
          p_relevance_score: knowledge.relevanceScore
        });
      }

      // Store contextual insights
      if (response.integrationInsights) {
        for (const insight of response.integrationInsights) {
          await supabase
            .from('contextual_insights')
            .insert({
              conversation_id: request.conversationId,
              user_id: request.userId,
              insight_type: insight.type,
              title: insight.title,
              content: insight.content,
              relevance_score: insight.confidence,
              source_integration: insight.integration,
              actionable: insight.actionable
            });
        }
      }

      // Store recommended actions
      if (response.recommendedActions) {
        for (const action of response.recommendedActions) {
          await supabase
            .from('recommended_actions')
            .insert({
              conversation_id: request.conversationId,
              user_id: request.userId,
              action_type: action.type,
              priority: action.priority,
              title: action.title,
              description: action.description,
              suggested_response: action.suggestedResponse
            });
        }
      }

    } catch (error) {
      console.error('Error tracking knowledge usage:', error);
    }
  }

  /**
   * Get conversation insights for agent dashboard
   */
  async getConversationInsights(conversationId: string): Promise<{
    insights: IntegrationInsight[];
    actions: RecommendedAction[];
    knowledgeUsage: KnowledgeUsageInfo[];
  }> {
    try {
      // Get insights
      const { data: insights } = await supabase
        .from('contextual_insights')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false });

      // Get actions
      const { data: actions } = await supabase
        .from('recommended_actions')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('priority', { ascending: false });

      // Get knowledge usage
      const { data: usage } = await supabase
        .from('knowledge_usage_tracking')
        .select(`
          *,
          knowledge_items(title)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false });

      const formattedInsights: IntegrationInsight[] = insights?.map(i => ({
        type: i.insight_type,
        title: i.title,
        content: i.content,
        integration: i.source_integration,
        confidence: i.relevance_score,
        actionable: i.actionable
      })) || [];

      const formattedActions: RecommendedAction[] = actions?.map(a => ({
        type: a.action_type,
        priority: a.priority,
        title: a.title,
        description: a.description,
        suggestedResponse: a.suggested_response
      })) || [];

      const formattedUsage: KnowledgeUsageInfo[] = usage?.map(u => ({
        knowledgeItemId: u.knowledge_item_id,
        title: u.knowledge_items?.title || 'Unknown',
        source: u.context_data?.integration || 'unknown',
        relevanceScore: u.relevance_score || 0,
        usageType: u.usage_type
      })) || [];

      return {
        insights: formattedInsights,
        actions: formattedActions,
        knowledgeUsage: formattedUsage
      };

    } catch (error) {
      console.error('Error getting conversation insights:', error);
      return { insights: [], actions: [], knowledgeUsage: [] };
    }
  }

  /**
   * Provide feedback on knowledge effectiveness
   */
  async provideFeedback(
    conversationId: string,
    knowledgeItemId: string,
    helpful: boolean,
    feedbackText?: string
  ): Promise<void> {
    try {
      // Update knowledge usage tracking
      await supabase
        .from('knowledge_usage_tracking')
        .update({ helpful })
        .eq('conversation_id', conversationId)
        .eq('knowledge_item_id', knowledgeItemId);

      // Record detailed feedback if provided
      if (feedbackText) {
        await supabase
          .from('knowledge_analytics')
          .insert({
            knowledge_item_id: knowledgeItemId,
            conversation_id: conversationId,
            was_helpful: helpful,
            feedback_text: feedbackText
          });
      }

    } catch (error) {
      console.error('Error providing feedback:', error);
    }
  }
}

export const enhancedKnowledgeMatchingService = new EnhancedKnowledgeMatchingService();
export default enhancedKnowledgeMatchingService;