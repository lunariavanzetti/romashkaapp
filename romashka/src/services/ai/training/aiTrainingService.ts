import { supabase } from '../../../lib/supabase';
import OpenAI from 'openai';
import { ConversationContext, AIResponse, Message } from '../../openaiService';

export interface TrainingData {
  conversationId: string;
  messages: Message[];
  success: boolean;
  customerRating?: number;
  agentRating?: number;
  resolutionTime: number;
  handoffOccurred: boolean;
  knowledgeUsed: string[];
  topics: string[];
  sentiment: string;
  confidence: number;
  learningPoints: string[];
}

export interface KnowledgeGap {
  id: string;
  topic: string;
  frequency: number;
  impact: number;
  suggestedContent: string;
  priority: 'low' | 'medium' | 'high';
  detectedAt: Date;
  contexts: string[];
}

export interface LearningInsight {
  id: string;
  type: 'success_pattern' | 'failure_pattern' | 'improvement_opportunity';
  title: string;
  description: string;
  confidence: number;
  impact: number;
  actionable: boolean;
  data: Record<string, any>;
  createdAt: Date;
}

export interface TrainingMetrics {
  totalConversations: number;
  successRate: number;
  avgConfidence: number;
  avgSatisfaction: number;
  handoffRate: number;
  knowledgeUsage: Record<string, number>;
  improvementTrends: Array<{
    metric: string;
    trend: number;
    timeframe: string;
  }>;
}

export class AITrainingService {
  private static instance: AITrainingService;
  private openai: OpenAI;
  private trainingQueue: TrainingData[] = [];
  private knowledgeGaps: Map<string, KnowledgeGap> = new Map();
  private learningInsights: LearningInsight[] = [];

  private constructor() {
    this.openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY!,
      dangerouslyAllowBrowser: true,
    });
  }

  /**
   * Get training statistics
   */
  async getTrainingStats(): Promise<any> {
    try {
      // In a real implementation, this would fetch from database
      // For now, return mock data
      return {
        totalConversations: 2450,
        processedConversations: 1890,
        accuracyScore: 91.2,
        knowledgeGaps: 23,
        optimizationOpportunities: 8,
        averageResponseTime: 1.8,
        customerSatisfaction: 4.6,
        successRate: 87.3
      };
    } catch (error) {
      console.error('Error fetching training stats:', error);
      throw error;
    }
  }

  static getInstance(): AITrainingService {
    if (!AITrainingService.instance) {
      AITrainingService.instance = new AITrainingService();
    }
    return AITrainingService.instance;
  }

  /**
   * Analyze conversation for training data
   */
  async analyzeConversation(conversationId: string): Promise<TrainingData> {
    try {
      // Get conversation data
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (convError) throw convError;

      // Get all messages
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (msgError) throw msgError;

      // Analyze success factors
      const success = await this.determineConversationSuccess(conversation, messages);
      
      // Extract learning points
      const learningPoints = await this.extractLearningPoints(messages, success);
      
      // Identify knowledge used
      const knowledgeUsed = await this.identifyKnowledgeUsed(messages);
      
      // Extract topics and sentiment
      const topics = await this.extractTopics(messages);
      
      const trainingData: TrainingData = {
        conversationId,
        messages,
        success,
        customerRating: conversation.satisfaction_score,
        resolutionTime: this.calculateResolutionTime(messages),
        handoffOccurred: messages.some(m => m.sender_type === 'agent'),
        knowledgeUsed,
        topics,
        sentiment: conversation.sentiment || 'neutral',
        confidence: conversation.ai_confidence || 0,
        learningPoints,
      };

      // Add to training queue
      this.trainingQueue.push(trainingData);

      // Store training data in database
      await this.storeTrainingData(trainingData);

      return trainingData;
    } catch (error) {
      console.error('Error analyzing conversation:', error);
      throw error;
    }
  }

  /**
   * Identify knowledge gaps from failed conversations
   */
  async identifyKnowledgeGaps(): Promise<KnowledgeGap[]> {
    try {
      // Get failed conversations from the last 30 days
      const { data: failedConversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages (*)
        `)
        .eq('status', 'closed')
        .lt('satisfaction_score', 3)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const gaps: Map<string, KnowledgeGap> = new Map();

      for (const conversation of failedConversations) {
        const topics = await this.extractTopics(conversation.messages);
        
        for (const topic of topics) {
          const key = topic.toLowerCase();
          if (gaps.has(key)) {
            const gap = gaps.get(key)!;
            gap.frequency++;
            gap.contexts.push(conversation.id);
          } else {
            gaps.set(key, {
              id: crypto.randomUUID(),
              topic,
              frequency: 1,
              impact: await this.calculateTopicImpact(topic),
              suggestedContent: await this.generateContentSuggestion(topic),
              priority: 'medium',
              detectedAt: new Date(),
              contexts: [conversation.id],
            });
          }
        }
      }

      // Calculate priority based on frequency and impact
      for (const gap of gaps.values()) {
        gap.priority = this.calculateGapPriority(gap.frequency, gap.impact);
      }

      this.knowledgeGaps = gaps;
      
      // Store gaps in database
      await this.storeKnowledgeGaps(Array.from(gaps.values()));

      return Array.from(gaps.values());
    } catch (error) {
      console.error('Error identifying knowledge gaps:', error);
      throw error;
    }
  }

  /**
   * Extract learning insights from successful patterns
   */
  async extractLearningInsights(): Promise<LearningInsight[]> {
    try {
      // Get successful conversations
      const { data: successfulConversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages (*)
        `)
        .gte('satisfaction_score', 4)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const insights: LearningInsight[] = [];

      // Analyze success patterns
      const successPatterns = await this.analyzeSuccessPatterns(successfulConversations);
      
      for (const pattern of successPatterns) {
        insights.push({
          id: crypto.randomUUID(),
          type: 'success_pattern',
          title: pattern.title,
          description: pattern.description,
          confidence: pattern.confidence,
          impact: pattern.impact,
          actionable: true,
          data: pattern.data,
          createdAt: new Date(),
        });
      }

      // Analyze improvement opportunities
      const improvements = await this.analyzeImprovementOpportunities();
      
      for (const improvement of improvements) {
        insights.push({
          id: crypto.randomUUID(),
          type: 'improvement_opportunity',
          title: improvement.title,
          description: improvement.description,
          confidence: improvement.confidence,
          impact: improvement.impact,
          actionable: improvement.actionable,
          data: improvement.data,
          createdAt: new Date(),
        });
      }

      this.learningInsights = insights;
      
      // Store insights in database
      await this.storeLearningInsights(insights);

      return insights;
    } catch (error) {
      console.error('Error extracting learning insights:', error);
      throw error;
    }
  }

  /**
   * Get training metrics and performance data
   */
  async getTrainingMetrics(days: number = 30): Promise<TrainingMetrics> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Get conversation metrics
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const totalConversations = conversations.length;
      const successfulConversations = conversations.filter(c => c.satisfaction_score >= 4);
      const successRate = totalConversations > 0 ? successfulConversations.length / totalConversations : 0;
      
      const avgConfidence = conversations.reduce((sum, c) => sum + (c.ai_confidence || 0), 0) / totalConversations;
      const avgSatisfaction = conversations.reduce((sum, c) => sum + (c.satisfaction_score || 0), 0) / totalConversations;
      
      const handoffConversations = conversations.filter(c => c.agent_id);
      const handoffRate = totalConversations > 0 ? handoffConversations.length / totalConversations : 0;

      // Get knowledge usage statistics
      const knowledgeUsage = await this.getKnowledgeUsageStats(startDate);

      // Get improvement trends
      const improvementTrends = await this.getImprovementTrends(days);

      return {
        totalConversations,
        successRate,
        avgConfidence,
        avgSatisfaction,
        handoffRate,
        knowledgeUsage,
        improvementTrends,
      };
    } catch (error) {
      console.error('Error getting training metrics:', error);
      throw error;
    }
  }

  /**
   * Process feedback for continuous learning
   */
  async processFeedback(conversationId: string, feedback: {
    rating: number;
    comments?: string;
    type: 'customer' | 'agent';
  }): Promise<void> {
    try {
      // Update conversation rating
      await supabase
        .from('conversations')
        .update({
          satisfaction_score: feedback.rating,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      // Store detailed feedback
      await supabase
        .from('conversation_feedback')
        .insert({
          conversation_id: conversationId,
          rating: feedback.rating,
          comments: feedback.comments,
          feedback_type: feedback.type,
          created_at: new Date().toISOString(),
        });

      // Trigger learning update if rating is below threshold
      if (feedback.rating < 3) {
        await this.triggerLearningUpdate(conversationId);
      }
    } catch (error) {
      console.error('Error processing feedback:', error);
      throw error;
    }
  }

  // Private helper methods
  private async determineConversationSuccess(conversation: any, messages: Message[]): Promise<boolean> {
    // Consider successful if:
    // 1. Customer rating >= 4
    // 2. No handoff occurred
    // 3. Resolution time < average
    // 4. No repeated questions
    
    const customerRating = conversation.satisfaction_score;
    const handoffOccurred = messages.some(m => m.sender_type === 'agent');
    const resolutionTime = this.calculateResolutionTime(messages);
    const avgResolutionTime = 600; // 10 minutes average
    
    return customerRating >= 4 && !handoffOccurred && resolutionTime < avgResolutionTime;
  }

  private async extractLearningPoints(messages: Message[], success: boolean): Promise<string[]> {
    const conversation = messages.map(m => `${m.sender_type}: ${m.content}`).join('\n');
    
    const prompt = `
Analyze this conversation and extract key learning points for AI training:
${conversation}

Success: ${success}

Extract specific learning points about:
1. Effective response patterns
2. Knowledge usage patterns
3. Customer interaction patterns
4. Areas for improvement

Return as a JSON array of strings.
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content || '[]');
    } catch (error) {
      console.error('Error extracting learning points:', error);
      return [];
    }
  }

  private async identifyKnowledgeUsed(messages: Message[]): Promise<string[]> {
    const aiMessages = messages.filter(m => m.sender_type === 'ai');
    const knowledgeUsed: string[] = [];

    for (const message of aiMessages) {
      if (message.metadata?.knowledge_sources) {
        knowledgeUsed.push(...message.metadata.knowledge_sources);
      }
    }

    return [...new Set(knowledgeUsed)];
  }

  private async extractTopics(messages: Message[]): Promise<string[]> {
    const conversation = messages.map(m => m.content).join(' ');
    
    const prompt = `
Extract the main topics from this conversation:
${conversation}

Return as a JSON array of topics (max 5).
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content || '[]');
    } catch (error) {
      console.error('Error extracting topics:', error);
      return [];
    }
  }

  private calculateResolutionTime(messages: Message[]): number {
    if (messages.length < 2) return 0;
    
    const firstMessage = new Date(messages[0].created_at);
    const lastMessage = new Date(messages[messages.length - 1].created_at);
    
    return Math.round((lastMessage.getTime() - firstMessage.getTime()) / 1000);
  }

  private async calculateTopicImpact(topic: string): Promise<number> {
    // Calculate impact based on frequency and customer satisfaction correlation
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('satisfaction_score')
      .ilike('business_context', `%${topic}%`);

    if (error || !conversations) return 0.5;

    const avgSatisfaction = conversations.reduce((sum, c) => sum + (c.satisfaction_score || 0), 0) / conversations.length;
    
    // Lower satisfaction = higher impact of knowledge gap
    return Math.max(0, 1 - (avgSatisfaction / 5));
  }

  private async generateContentSuggestion(topic: string): Promise<string> {
    const prompt = `
Generate a content suggestion for the topic: ${topic}

Provide a brief description of what knowledge content should be created to address this topic effectively.
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      return response.choices[0].message.content || `Create comprehensive content about ${topic}`;
    } catch (error) {
      console.error('Error generating content suggestion:', error);
      return `Create comprehensive content about ${topic}`;
    }
  }

  private calculateGapPriority(frequency: number, impact: number): 'low' | 'medium' | 'high' {
    const score = frequency * impact;
    if (score > 5) return 'high';
    if (score > 2) return 'medium';
    return 'low';
  }

  private async storeTrainingData(trainingData: TrainingData): Promise<void> {
    await supabase
      .from('ai_training_data')
      .insert({
        conversation_id: trainingData.conversationId,
        success: trainingData.success,
        customer_rating: trainingData.customerRating,
        agent_rating: trainingData.agentRating,
        resolution_time: trainingData.resolutionTime,
        handoff_occurred: trainingData.handoffOccurred,
        knowledge_used: trainingData.knowledgeUsed,
        topics: trainingData.topics,
        sentiment: trainingData.sentiment,
        confidence: trainingData.confidence,
        learning_points: trainingData.learningPoints,
        created_at: new Date().toISOString(),
      });
  }

  private async storeKnowledgeGaps(gaps: KnowledgeGap[]): Promise<void> {
    for (const gap of gaps) {
      await supabase
        .from('knowledge_gaps')
        .upsert({
          id: gap.id,
          topic: gap.topic,
          frequency: gap.frequency,
          impact: gap.impact,
          suggested_content: gap.suggestedContent,
          priority: gap.priority,
          detected_at: gap.detectedAt.toISOString(),
          contexts: gap.contexts,
          updated_at: new Date().toISOString(),
        });
    }
  }

  private async storeLearningInsights(insights: LearningInsight[]): Promise<void> {
    for (const insight of insights) {
      await supabase
        .from('learning_insights')
        .insert({
          id: insight.id,
          type: insight.type,
          title: insight.title,
          description: insight.description,
          confidence: insight.confidence,
          impact: insight.impact,
          actionable: insight.actionable,
          data: insight.data,
          created_at: insight.createdAt.toISOString(),
        });
    }
  }

  private async analyzeSuccessPatterns(conversations: any[]): Promise<any[]> {
    // Analyze patterns in successful conversations
    const patterns = [];
    
    // Pattern 1: Quick resolution with high confidence
    const quickResolutions = conversations.filter(c => 
      c.messages.length <= 4 && c.ai_confidence > 0.8
    );
    
    if (quickResolutions.length > 0) {
      patterns.push({
        title: 'Quick High-Confidence Resolutions',
        description: `${quickResolutions.length} conversations resolved quickly with high AI confidence`,
        confidence: 0.9,
        impact: 0.8,
        data: { count: quickResolutions.length, avgConfidence: 0.8 },
      });
    }

    // Pattern 2: Effective knowledge usage
    const knowledgeEffective = conversations.filter(c =>
      c.messages.some(m => m.metadata?.knowledge_sources?.length > 0)
    );
    
    if (knowledgeEffective.length > 0) {
      patterns.push({
        title: 'Effective Knowledge Base Usage',
        description: `${knowledgeEffective.length} conversations successfully used knowledge base`,
        confidence: 0.85,
        impact: 0.7,
        data: { count: knowledgeEffective.length },
      });
    }

    return patterns;
  }

  private async analyzeImprovementOpportunities(): Promise<any[]> {
    // Analyze areas for improvement
    const opportunities = [];
    
    // Check for low confidence responses
    const { data: lowConfidenceConversations, error } = await supabase
      .from('conversations')
      .select('*')
      .lt('ai_confidence', 0.6)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (!error && lowConfidenceConversations.length > 0) {
      opportunities.push({
        title: 'Low Confidence Responses',
        description: `${lowConfidenceConversations.length} conversations had low AI confidence scores`,
        confidence: 0.9,
        impact: 0.7,
        actionable: true,
        data: { count: lowConfidenceConversations.length },
      });
    }

    return opportunities;
  }

  private async getKnowledgeUsageStats(startDate: Date): Promise<Record<string, number>> {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('metadata')
      .eq('sender_type', 'ai')
      .gte('created_at', startDate.toISOString());

    if (error) return {};

    const usageStats: Record<string, number> = {};
    
    for (const message of messages) {
      if (message.metadata?.knowledge_sources) {
        for (const source of message.metadata.knowledge_sources) {
          usageStats[source] = (usageStats[source] || 0) + 1;
        }
      }
    }

    return usageStats;
  }

  private async getImprovementTrends(days: number): Promise<Array<{
    metric: string;
    trend: number;
    timeframe: string;
  }>> {
    // Calculate improvement trends for key metrics
    const trends = [];
    
    // Satisfaction trend
    const satisfactionTrend = await this.calculateMetricTrend('satisfaction_score', days);
    trends.push({
      metric: 'Customer Satisfaction',
      trend: satisfactionTrend,
      timeframe: `${days} days`,
    });

    // Confidence trend
    const confidenceTrend = await this.calculateMetricTrend('ai_confidence', days);
    trends.push({
      metric: 'AI Confidence',
      trend: confidenceTrend,
      timeframe: `${days} days`,
    });

    return trends;
  }

  private async calculateMetricTrend(metric: string, days: number): Promise<number> {
    const halfPeriod = Math.floor(days / 2);
    const midDate = new Date(Date.now() - halfPeriod * 24 * 60 * 60 * 1000);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get first half average
    const { data: firstHalf, error: error1 } = await supabase
      .from('conversations')
      .select(metric)
      .gte('created_at', startDate.toISOString())
      .lt('created_at', midDate.toISOString());

    // Get second half average
    const { data: secondHalf, error: error2 } = await supabase
      .from('conversations')
      .select(metric)
      .gte('created_at', midDate.toISOString());

    if (error1 || error2 || !firstHalf || !secondHalf) return 0;

    const firstAvg = firstHalf.reduce((sum, c) => sum + (c[metric] || 0), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, c) => sum + (c[metric] || 0), 0) / secondHalf.length;

    return firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
  }

  private async triggerLearningUpdate(conversationId: string): Promise<void> {
    // Trigger immediate learning update for poor performance
    const trainingData = await this.analyzeConversation(conversationId);
    
    // Add to priority learning queue
    this.trainingQueue.unshift(trainingData);
    
    // Trigger knowledge gap analysis
    await this.identifyKnowledgeGaps();
  }
}

export const aiTrainingService = AITrainingService.getInstance();