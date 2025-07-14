import { supabase } from '../../supabaseClient';
import { openaiService } from '../../openaiService';
import type { ConversationContext } from '../../openaiService';

export interface TrainingData {
  conversationId: string;
  customerId: string;
  agentId?: string;
  channel: string;
  messages: TrainingMessage[];
  outcome: 'success' | 'failure' | 'escalated' | 'abandoned';
  customerRating?: number;
  agentRating?: number;
  resolutionTime: number;
  knowledgeGaps: string[];
  templateUsed?: string;
  feedbackNotes?: string;
  createdAt: Date;
}

export interface TrainingMessage {
  id: string;
  content: string;
  type: 'user' | 'assistant' | 'system';
  timestamp: Date;
  intent?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  confidence?: number;
  knowledgeUsed?: string[];
  templateId?: string;
}

export interface ConversationAnalysis {
  conversationId: string;
  successFactors: string[];
  failurePoints: string[];
  knowledgeGaps: string[];
  improvementSuggestions: string[];
  confidenceScore: number;
  responseAccuracy: number;
  customerSatisfaction: number;
  patternMatches: string[];
}

export interface FeedbackData {
  conversationId: string;
  source: 'customer' | 'agent' | 'system';
  rating: number;
  feedback: string;
  categories: string[];
  actionItems: string[];
  timestamp: Date;
}

export interface KnowledgeGap {
  id: string;
  topic: string;
  frequency: number;
  conversations: string[];
  confidence: number;
  suggestedContent: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
}

export class AITrainingService {
  private static instance: AITrainingService;

  private constructor() {}

  static getInstance(): AITrainingService {
    if (!AITrainingService.instance) {
      AITrainingService.instance = new AITrainingService();
    }
    return AITrainingService.instance;
  }

  /**
   * Analyze conversation for training purposes
   */
  async analyzeConversation(conversationId: string): Promise<ConversationAnalysis> {
    try {
      // Get conversation data
      const { data: conversation, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages (*),
          customer_ratings (*),
          agent_ratings (*)
        `)
        .eq('id', conversationId)
        .single();

      if (error) throw error;

      // Analyze with OpenAI
      const analysisPrompt = `
        Analyze this conversation for AI training purposes:
        
        Messages: ${JSON.stringify(conversation.messages)}
        Customer Rating: ${conversation.customer_ratings?.[0]?.rating || 'N/A'}
        Agent Rating: ${conversation.agent_ratings?.[0]?.rating || 'N/A'}
        
        Provide analysis in JSON format with:
        - successFactors: Array of what worked well
        - failurePoints: Array of what didn't work
        - knowledgeGaps: Array of missing knowledge areas
        - improvementSuggestions: Array of specific improvements
        - confidenceScore: Overall AI confidence (0-100)
        - responseAccuracy: Response accuracy score (0-100)
        - customerSatisfaction: Customer satisfaction score (0-100)
        - patternMatches: Array of identified patterns
      `;

      const analysis = await openaiService.generateResponse({
        messages: [{ role: 'user', content: analysisPrompt }],
        temperature: 0.1,
        maxTokens: 1000
      });

      let analysisData: ConversationAnalysis;
      try {
        analysisData = JSON.parse(analysis.content);
      } catch {
        // Fallback analysis if JSON parsing fails
        analysisData = {
          conversationId,
          successFactors: ['Conversation completed'],
          failurePoints: ['Analysis parsing failed'],
          knowledgeGaps: ['Unknown'],
          improvementSuggestions: ['Improve analysis reliability'],
          confidenceScore: 50,
          responseAccuracy: 50,
          customerSatisfaction: conversation.customer_ratings?.[0]?.rating * 20 || 50,
          patternMatches: []
        };
      }

      // Store analysis
      await supabase
        .from('conversation_analyses')
        .insert({
          conversation_id: conversationId,
          analysis: analysisData,
          created_at: new Date().toISOString()
        });

      return analysisData;
    } catch (error) {
      console.error('Error analyzing conversation:', error);
      throw error;
    }
  }

  /**
   * Process feedback for training
   */
  async processFeedback(feedbackData: FeedbackData): Promise<void> {
    try {
      // Store feedback
      await supabase
        .from('training_feedback')
        .insert({
          conversation_id: feedbackData.conversationId,
          source: feedbackData.source,
          rating: feedbackData.rating,
          feedback: feedbackData.feedback,
          categories: feedbackData.categories,
          action_items: feedbackData.actionItems,
          timestamp: feedbackData.timestamp.toISOString()
        });

      // Analyze feedback for insights
      const insightPrompt = `
        Analyze this feedback for training insights:
        
        Rating: ${feedbackData.rating}/5
        Feedback: ${feedbackData.feedback}
        Categories: ${feedbackData.categories.join(', ')}
        
        Extract:
        - Key improvement areas
        - Specific action items
        - Pattern indicators
        - Knowledge gaps
        
        Return JSON with insights.
      `;

      const insights = await openaiService.generateResponse({
        messages: [{ role: 'user', content: insightPrompt }],
        temperature: 0.1,
        maxTokens: 500
      });

      // Store insights
      await supabase
        .from('training_insights')
        .insert({
          conversation_id: feedbackData.conversationId,
          insights: insights.content,
          source: 'feedback_analysis',
          created_at: new Date().toISOString()
        });

    } catch (error) {
      console.error('Error processing feedback:', error);
      throw error;
    }
  }

  /**
   * Identify knowledge gaps from failed conversations
   */
  async identifyKnowledgeGaps(): Promise<KnowledgeGap[]> {
    try {
      // Get recent failed conversations
      const { data: failures, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages (*),
          conversation_analyses (*)
        `)
        .eq('status', 'failed')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Analyze patterns in failures
      const failureAnalysis = await openaiService.generateResponse({
        messages: [{
          role: 'user',
          content: `
            Analyze these failed conversations to identify knowledge gaps:
            
            ${failures?.map(f => `
              Conversation: ${f.id}
              Messages: ${f.messages?.slice(-5).map((m: any) => m.content).join(' | ')}
              Analysis: ${f.conversation_analyses?.[0]?.analysis || 'No analysis'}
            `).join('\n')}
            
            Return JSON array of knowledge gaps with:
            - topic: The knowledge area
            - frequency: How often it appears
            - confidence: Confidence in identification (0-100)
            - suggestedContent: What content would help
            - priority: low/medium/high
          `
        }],
        temperature: 0.1,
        maxTokens: 1500
      });

      let gaps: KnowledgeGap[];
      try {
        gaps = JSON.parse(failureAnalysis.content);
      } catch {
        gaps = [];
      }

      // Store identified gaps
      for (const gap of gaps) {
        await supabase
          .from('knowledge_gaps')
          .insert({
            topic: gap.topic,
            frequency: gap.frequency,
            confidence: gap.confidence,
            suggested_content: gap.suggestedContent,
            priority: gap.priority,
            created_at: new Date().toISOString()
          });
      }

      return gaps;
    } catch (error) {
      console.error('Error identifying knowledge gaps:', error);
      throw error;
    }
  }

  /**
   * Monitor performance across channels
   */
  async monitorPerformance(): Promise<any> {
    try {
      const { data: metrics, error } = await supabase
        .from('daily_metrics')
        .select('*')
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;

      // Calculate performance trends
      const performanceData = {
        aiResolutionRate: this.calculateTrend(metrics, 'ai_resolution_rate'),
        customerSatisfaction: this.calculateTrend(metrics, 'avg_satisfaction_score'),
        responseAccuracy: this.calculateTrend(metrics, 'response_accuracy'),
        knowledgeUtilization: this.calculateTrend(metrics, 'knowledge_utilization'),
        escalationRate: this.calculateTrend(metrics, 'escalation_rate')
      };

      return performanceData;
    } catch (error) {
      console.error('Error monitoring performance:', error);
      throw error;
    }
  }

  /**
   * Generate training recommendations
   */
  async generateTrainingRecommendations(): Promise<any> {
    try {
      // Get recent performance data
      const performance = await this.monitorPerformance();
      const knowledgeGaps = await this.identifyKnowledgeGaps();

      // Generate recommendations
      const recommendationPrompt = `
        Based on this performance data and knowledge gaps, generate training recommendations:
        
        Performance: ${JSON.stringify(performance)}
        Knowledge Gaps: ${JSON.stringify(knowledgeGaps)}
        
        Provide specific, actionable recommendations for:
        - Content to create or update
        - Training priorities
        - Process improvements
        - Knowledge base enhancements
        
        Return JSON with prioritized recommendations.
      `;

      const recommendations = await openaiService.generateResponse({
        messages: [{ role: 'user', content: recommendationPrompt }],
        temperature: 0.2,
        maxTokens: 1000
      });

      return JSON.parse(recommendations.content);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw error;
    }
  }

  private calculateTrend(metrics: any[], field: string): any {
    if (!metrics || metrics.length === 0) return { current: 0, trend: 'stable', change: 0 };

    const values = metrics.map(m => m[field] || 0);
    const current = values[0] || 0;
    const previous = values[1] || 0;
    const change = current - previous;
    const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';

    return { current, trend, change };
  }
}

export const aiTrainingService = AITrainingService.getInstance();