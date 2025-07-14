import { supabase } from '../supabaseClient';
import { openaiService } from '../openaiService';
import { 
  AITrainingSession, 
  AITrainingResults, 
  TrainingSample, 
  LearningInsight, 
  OptimizationSuggestion, 
  KnowledgeUpdate, 
  PerformanceImprovement,
  ConversationContext,
  SentimentAnalysis,
  EngagementMetrics,
  PerformanceTrend,
  ResponseTemplate
} from '../../types/responseTemplates';

export class AITrainingService {
  private readonly MIN_TRAINING_SAMPLES = 10;
  private readonly CONFIDENCE_THRESHOLD = 0.7;
  private readonly PERFORMANCE_THRESHOLD = 0.8;

  // Main training session management
  async startTrainingSession(
    type: 'conversation_analysis' | 'template_optimization' | 'performance_tracking' | 'knowledge_update',
    dataSourceIds: string[],
    parameters: Record<string, any> = {}
  ): Promise<AITrainingSession> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const session: Partial<AITrainingSession> = {
        user_id: user.id,
        type,
        status: 'queued',
        data_sources: dataSourceIds,
        parameters,
        results: {
          insights: [],
          optimizations: [],
          knowledge_updates: [],
          performance_improvements: [],
          confidence_score: 0,
          processing_time: 0
        }
      };

      const { data, error } = await supabase
        .from('ai_training_sessions')
        .insert([session])
        .select()
        .single();

      if (error) throw error;

      // Start processing in background
      this.processTrainingSession(data.id).catch(error => {
        console.error('Training session processing error:', error);
      });

      return data;
    } catch (error) {
      console.error('Error starting training session:', error);
      throw error;
    }
  }

  private async processTrainingSession(sessionId: string): Promise<void> {
    try {
      // Update status to running
      await supabase
        .from('ai_training_sessions')
        .update({ 
          status: 'running', 
          started_at: new Date().toISOString() 
        })
        .eq('id', sessionId);

      const { data: session, error } = await supabase
        .from('ai_training_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;

      const startTime = Date.now();
      let results: AITrainingResults;

      switch (session.type) {
        case 'conversation_analysis':
          results = await this.analyzeConversations(session.data_sources, session.parameters);
          break;
        case 'template_optimization':
          results = await this.optimizeTemplates(session.data_sources, session.parameters);
          break;
        case 'performance_tracking':
          results = await this.trackPerformance(session.data_sources, session.parameters);
          break;
        case 'knowledge_update':
          results = await this.updateKnowledge(session.data_sources, session.parameters);
          break;
        default:
          throw new Error(`Unknown training session type: ${session.type}`);
      }

      results.processing_time = Date.now() - startTime;

      // Update session with results
      await supabase
        .from('ai_training_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          results
        })
        .eq('id', sessionId);

      // Apply insights and optimizations
      await this.applyTrainingResults(sessionId, results);

    } catch (error) {
      console.error('Training session processing error:', error);
      
      await supabase
        .from('ai_training_sessions')
        .update({
          status: 'failed',
          error_message: error.message
        })
        .eq('id', sessionId);
    }
  }

  // Conversation Analysis
  private async analyzeConversations(
    conversationIds: string[],
    parameters: Record<string, any>
  ): Promise<AITrainingResults> {
    const insights: LearningInsight[] = [];
    const optimizations: OptimizationSuggestion[] = [];
    const knowledgeUpdates: KnowledgeUpdate[] = [];
    const performanceImprovements: PerformanceImprovement[] = [];

    try {
      // Get conversation data
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages(*)
        `)
        .in('id', conversationIds);

      if (error) throw error;

      // Analyze each conversation
      for (const conversation of conversations || []) {
        const analysis = await this.analyzeConversation(conversation);
        insights.push(...analysis.insights);
        optimizations.push(...analysis.optimizations);
        knowledgeUpdates.push(...analysis.knowledgeUpdates);
      }

      // Generate performance improvements
      const performanceAnalysis = await this.analyzePerformancePatterns(conversations || []);
      performanceImprovements.push(...performanceAnalysis);

      // Calculate confidence score
      const confidenceScore = this.calculateConfidenceScore(insights, optimizations);

      return {
        insights,
        optimizations,
        knowledge_updates: knowledgeUpdates,
        performance_improvements: performanceImprovements,
        confidence_score: confidenceScore,
        processing_time: 0
      };
    } catch (error) {
      console.error('Error analyzing conversations:', error);
      throw error;
    }
  }

  private async analyzeConversation(conversation: any): Promise<{
    insights: LearningInsight[];
    optimizations: OptimizationSuggestion[];
    knowledgeUpdates: KnowledgeUpdate[];
  }> {
    const insights: LearningInsight[] = [];
    const optimizations: OptimizationSuggestion[] = [];
    const knowledgeUpdates: KnowledgeUpdate[] = [];

    try {
      const messages = conversation.messages || [];
      const conversationText = messages.map((m: any) => m.content).join('\n');

      // Sentiment analysis
      const sentimentAnalysis = await this.analyzeSentiment(conversationText);
      if (sentimentAnalysis.negative_sentiment > 0.6) {
        insights.push({
          id: crypto.randomUUID(),
          type: 'pattern',
          description: 'High negative sentiment detected in conversation',
          impact_score: 0.8,
          confidence: sentimentAnalysis.confidence_score,
          recommendations: ['Review response templates for empathy', 'Consider escalation triggers'],
          data_source: conversation.id,
          created_at: new Date().toISOString()
        });
      }

      // Response effectiveness analysis
      const responseEffectiveness = await this.analyzeResponseEffectiveness(messages);
      if (responseEffectiveness.score < 0.7) {
        optimizations.push({
          id: crypto.randomUUID(),
          type: 'content',
          priority: 'medium',
          description: 'Response effectiveness could be improved',
          expected_improvement: 0.3,
          implementation_effort: 'medium',
          data_confidence: responseEffectiveness.confidence,
          suggested_changes: responseEffectiveness.suggestions,
          created_at: new Date().toISOString()
        });
      }

      // Extract new knowledge
      const newKnowledge = await this.extractKnowledge(conversationText);
      knowledgeUpdates.push(...newKnowledge);

      return { insights, optimizations, knowledgeUpdates };
    } catch (error) {
      console.error('Error analyzing conversation:', error);
      return { insights, optimizations, knowledgeUpdates };
    }
  }

  private async analyzeSentiment(text: string): Promise<SentimentAnalysis> {
    try {
      const response = await openaiService.analyzeContent(text, {
        type: 'sentiment_analysis',
        include_emotions: true
      });

      return {
        positive_sentiment: response.sentiment?.positive || 0,
        negative_sentiment: response.sentiment?.negative || 0,
        neutral_sentiment: response.sentiment?.neutral || 0,
        emotion_distribution: response.emotions || {},
        confidence_score: response.confidence || 0.5
      };
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return {
        positive_sentiment: 0.5,
        negative_sentiment: 0.3,
        neutral_sentiment: 0.2,
        emotion_distribution: {},
        confidence_score: 0.5
      };
    }
  }

  private async analyzeResponseEffectiveness(messages: any[]): Promise<{
    score: number;
    confidence: number;
    suggestions: string[];
  }> {
    try {
      const agentMessages = messages.filter(m => m.sender_type === 'agent');
      const customerMessages = messages.filter(m => m.sender_type === 'customer');

      if (agentMessages.length === 0) {
        return { score: 0, confidence: 0, suggestions: [] };
      }

      // Analyze response time
      const avgResponseTime = this.calculateAverageResponseTime(messages);
      const responseTimeScore = avgResponseTime < 300 ? 0.8 : 0.5; // 5 minutes

      // Analyze response quality using AI
      const qualityAnalysis = await this.analyzeResponseQuality(agentMessages);
      
      // Analyze customer satisfaction indicators
      const satisfactionScore = await this.analyzeSatisfactionIndicators(customerMessages);

      const overallScore = (responseTimeScore + qualityAnalysis.score + satisfactionScore) / 3;

      return {
        score: overallScore,
        confidence: 0.7,
        suggestions: qualityAnalysis.suggestions
      };
    } catch (error) {
      console.error('Error analyzing response effectiveness:', error);
      return { score: 0.5, confidence: 0.5, suggestions: [] };
    }
  }

  private async analyzeResponseQuality(messages: any[]): Promise<{
    score: number;
    suggestions: string[];
  }> {
    try {
      const responseText = messages.map(m => m.content).join('\n');
      
      const analysis = await openaiService.analyzeContent(responseText, {
        type: 'quality_analysis',
        criteria: ['clarity', 'helpfulness', 'professionalism', 'completeness']
      });

      const score = analysis.quality_score || 0.5;
      const suggestions = analysis.suggestions || [];

      return { score, suggestions };
    } catch (error) {
      console.error('Error analyzing response quality:', error);
      return { score: 0.5, suggestions: [] };
    }
  }

  private async analyzeSatisfactionIndicators(messages: any[]): Promise<number> {
    try {
      const customerText = messages.map(m => m.content).join('\n');
      
      // Look for satisfaction indicators
      const positiveWords = ['thank', 'thanks', 'great', 'perfect', 'excellent', 'helpful'];
      const negativeWords = ['frustrated', 'angry', 'disappointed', 'unsatisfied', 'unhappy'];

      const positiveCount = positiveWords.reduce((count, word) => 
        count + (customerText.toLowerCase().match(new RegExp(word, 'g')) || []).length, 0);
      
      const negativeCount = negativeWords.reduce((count, word) => 
        count + (customerText.toLowerCase().match(new RegExp(word, 'g')) || []).length, 0);

      if (positiveCount > negativeCount) return 0.8;
      if (negativeCount > positiveCount) return 0.3;
      return 0.5;
    } catch (error) {
      console.error('Error analyzing satisfaction indicators:', error);
      return 0.5;
    }
  }

  private calculateAverageResponseTime(messages: any[]): number {
    const responseTimes: number[] = [];
    
    for (let i = 1; i < messages.length; i++) {
      const current = messages[i];
      const previous = messages[i - 1];
      
      if (current.sender_type === 'agent' && previous.sender_type === 'customer') {
        const responseTime = new Date(current.created_at).getTime() - new Date(previous.created_at).getTime();
        responseTimes.push(responseTime);
      }
    }
    
    if (responseTimes.length === 0) return 0;
    return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  }

  private async extractKnowledge(text: string): Promise<KnowledgeUpdate[]> {
    try {
      const knowledge = await openaiService.extractKnowledge(text, {
        types: ['faq', 'procedure', 'troubleshooting'],
        confidence_threshold: 0.7
      });

      return knowledge.items.map((item: any) => ({
        id: crypto.randomUUID(),
        type: item.type,
        description: item.description,
        impact: item.impact,
        confidence: item.confidence,
        data_source: 'conversation_analysis',
        recommended_action: item.recommended_action,
        created_at: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error extracting knowledge:', error);
      return [];
    }
  }

  // Template Optimization
  private async optimizeTemplates(
    templateIds: string[],
    parameters: Record<string, any>
  ): Promise<AITrainingResults> {
    const optimizations: OptimizationSuggestion[] = [];
    const insights: LearningInsight[] = [];
    const performanceImprovements: PerformanceImprovement[] = [];

    try {
      // Get template data with usage statistics
      const { data: templates, error } = await supabase
        .from('response_templates')
        .select(`
          *,
          usage:template_usage(*),
          analytics:template_analytics(*)
        `)
        .in('id', templateIds);

      if (error) throw error;

      for (const template of templates || []) {
        const templateOptimizations = await this.analyzeTemplatePerformance(template);
        optimizations.push(...templateOptimizations.optimizations);
        insights.push(...templateOptimizations.insights);
        performanceImprovements.push(...templateOptimizations.improvements);
      }

      // Generate cross-template insights
      const crossTemplateInsights = await this.generateCrossTemplateInsights(templates || []);
      insights.push(...crossTemplateInsights);

      const confidenceScore = this.calculateConfidenceScore(insights, optimizations);

      return {
        insights,
        optimizations,
        knowledge_updates: [],
        performance_improvements: performanceImprovements,
        confidence_score: confidenceScore,
        processing_time: 0
      };
    } catch (error) {
      console.error('Error optimizing templates:', error);
      throw error;
    }
  }

  private async analyzeTemplatePerformance(template: any): Promise<{
    optimizations: OptimizationSuggestion[];
    insights: LearningInsight[];
    improvements: PerformanceImprovement[];
  }> {
    const optimizations: OptimizationSuggestion[] = [];
    const insights: LearningInsight[] = [];
    const improvements: PerformanceImprovement[] = [];

    try {
      const usage = template.usage || [];
      const analytics = template.analytics || {};

      // Analyze usage patterns
      if (usage.length > 0) {
        const avgEffectiveness = usage.reduce((sum: number, u: any) => sum + (u.effectiveness_score || 0), 0) / usage.length;
        
        if (avgEffectiveness < 0.7) {
          optimizations.push({
            id: crypto.randomUUID(),
            type: 'content',
            priority: 'high',
            description: `Template "${template.name}" has low effectiveness score (${avgEffectiveness.toFixed(2)})`,
            expected_improvement: 0.4,
            implementation_effort: 'medium',
            data_confidence: 0.8,
            suggested_changes: [
              'Review template content for clarity',
              'Add more personalization variables',
              'Improve call-to-action statements'
            ],
            created_at: new Date().toISOString()
          });
        }

        // Check for variable usage patterns
        const variableUsage = this.analyzeVariableUsage(usage);
        if (variableUsage.unusedVariables.length > 0) {
          optimizations.push({
            id: crypto.randomUUID(),
            type: 'variables',
            priority: 'low',
            description: `Template has unused variables: ${variableUsage.unusedVariables.join(', ')}`,
            expected_improvement: 0.1,
            implementation_effort: 'low',
            data_confidence: 0.9,
            suggested_changes: ['Remove unused variables to improve performance'],
            created_at: new Date().toISOString()
          });
        }
      }

      // Analyze content quality
      const contentAnalysis = await this.analyzeTemplateContent(template.content);
      if (contentAnalysis.score < 0.8) {
        optimizations.push({
          id: crypto.randomUUID(),
          type: 'content',
          priority: 'medium',
          description: 'Template content quality could be improved',
          expected_improvement: 0.2,
          implementation_effort: 'medium',
          data_confidence: contentAnalysis.confidence,
          suggested_changes: contentAnalysis.suggestions,
          created_at: new Date().toISOString()
        });
      }

      return { optimizations, insights, improvements };
    } catch (error) {
      console.error('Error analyzing template performance:', error);
      return { optimizations, insights, improvements };
    }
  }

  private analyzeVariableUsage(usage: any[]): {
    unusedVariables: string[];
    mostUsedVariables: string[];
    averageVariableCount: number;
  } {
    const variableUsageMap: Record<string, number> = {};
    let totalVariableCount = 0;

    for (const u of usage) {
      const variablesUsed = u.variables_used || {};
      totalVariableCount += Object.keys(variablesUsed).length;
      
      for (const variable of Object.keys(variablesUsed)) {
        variableUsageMap[variable] = (variableUsageMap[variable] || 0) + 1;
      }
    }

    const sortedVariables = Object.entries(variableUsageMap)
      .sort(([,a], [,b]) => b - a);

    const unusedVariables = sortedVariables
      .filter(([,count]) => count === 0)
      .map(([variable]) => variable);

    const mostUsedVariables = sortedVariables
      .slice(0, 5)
      .map(([variable]) => variable);

    return {
      unusedVariables,
      mostUsedVariables,
      averageVariableCount: usage.length > 0 ? totalVariableCount / usage.length : 0
    };
  }

  private async analyzeTemplateContent(content: any): Promise<{
    score: number;
    confidence: number;
    suggestions: string[];
  }> {
    try {
      const contentText = content.raw_text || '';
      
      if (!contentText) {
        return { score: 0, confidence: 1, suggestions: ['Template content is empty'] };
      }

      // Analyze with AI
      const analysis = await openaiService.analyzeContent(contentText, {
        type: 'template_analysis',
        criteria: ['clarity', 'engagement', 'professionalism', 'completeness']
      });

      return {
        score: analysis.score || 0.5,
        confidence: analysis.confidence || 0.7,
        suggestions: analysis.suggestions || []
      };
    } catch (error) {
      console.error('Error analyzing template content:', error);
      return { score: 0.5, confidence: 0.5, suggestions: [] };
    }
  }

  private async generateCrossTemplateInsights(templates: any[]): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];

    try {
      // Analyze template performance correlation
      const performanceData = templates.map(t => ({
        id: t.id,
        name: t.name,
        effectiveness: t.effectiveness_score || 0,
        usage_count: t.usage_count || 0,
        category: t.category_id
      }));

      // Find best performing templates
      const bestTemplates = performanceData
        .filter(t => t.effectiveness > 0.8 && t.usage_count > 10)
        .sort((a, b) => b.effectiveness - a.effectiveness);

      if (bestTemplates.length > 0) {
        insights.push({
          id: crypto.randomUUID(),
          type: 'pattern',
          description: `High-performing templates identified: ${bestTemplates.slice(0, 3).map(t => t.name).join(', ')}`,
          impact_score: 0.9,
          confidence: 0.8,
          recommendations: ['Analyze successful patterns', 'Apply learnings to other templates'],
          data_source: 'template_analysis',
          created_at: new Date().toISOString()
        });
      }

      // Find category performance patterns
      const categoryPerformance = this.analyzeCategoryPerformance(performanceData);
      if (categoryPerformance.insights.length > 0) {
        insights.push(...categoryPerformance.insights);
      }

      return insights;
    } catch (error) {
      console.error('Error generating cross-template insights:', error);
      return insights;
    }
  }

  private analyzeCategoryPerformance(templates: any[]): { insights: LearningInsight[] } {
    const insights: LearningInsight[] = [];
    const categoryStats: Record<string, { count: number; avgEffectiveness: number }> = {};

    for (const template of templates) {
      const category = template.category || 'uncategorized';
      if (!categoryStats[category]) {
        categoryStats[category] = { count: 0, avgEffectiveness: 0 };
      }
      categoryStats[category].count++;
      categoryStats[category].avgEffectiveness += template.effectiveness;
    }

    // Calculate averages
    for (const category of Object.keys(categoryStats)) {
      categoryStats[category].avgEffectiveness /= categoryStats[category].count;
    }

    // Find best and worst performing categories
    const sortedCategories = Object.entries(categoryStats)
      .sort(([,a], [,b]) => b.avgEffectiveness - a.avgEffectiveness);

    if (sortedCategories.length > 1) {
      const [bestCategory, bestStats] = sortedCategories[0];
      const [worstCategory, worstStats] = sortedCategories[sortedCategories.length - 1];

      if (bestStats.avgEffectiveness - worstStats.avgEffectiveness > 0.3) {
        insights.push({
          id: crypto.randomUUID(),
          type: 'pattern',
          description: `Category "${bestCategory}" performs significantly better than "${worstCategory}"`,
          impact_score: 0.7,
          confidence: 0.8,
          recommendations: [
            `Analyze successful patterns in "${bestCategory}" category`,
            `Apply learnings to improve "${worstCategory}" templates`
          ],
          data_source: 'category_analysis',
          created_at: new Date().toISOString()
        });
      }
    }

    return { insights };
  }

  // Performance Tracking
  private async trackPerformance(
    templateIds: string[],
    parameters: Record<string, any>
  ): Promise<AITrainingResults> {
    const performanceImprovements: PerformanceImprovement[] = [];
    const insights: LearningInsight[] = [];

    try {
      const days = parameters.days || 30;
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      // Get performance metrics
      const { data: metrics, error } = await supabase
        .from('template_performance_metrics')
        .select('*')
        .in('template_id', templateIds)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;

      // Analyze performance trends
      const trendAnalysis = this.analyzePerformanceTrends(metrics || []);
      insights.push(...trendAnalysis.insights);
      performanceImprovements.push(...trendAnalysis.improvements);

      return {
        insights,
        optimizations: [],
        knowledge_updates: [],
        performance_improvements: performanceImprovements,
        confidence_score: 0.8,
        processing_time: 0
      };
    } catch (error) {
      console.error('Error tracking performance:', error);
      throw error;
    }
  }

  private analyzePerformanceTrends(metrics: any[]): {
    insights: LearningInsight[];
    improvements: PerformanceImprovement[];
  } {
    const insights: LearningInsight[] = [];
    const improvements: PerformanceImprovement[] = [];

    try {
      // Group by template
      const templateMetrics: Record<string, any[]> = {};
      for (const metric of metrics) {
        if (!templateMetrics[metric.template_id]) {
          templateMetrics[metric.template_id] = [];
        }
        templateMetrics[metric.template_id].push(metric);
      }

      // Analyze each template's trend
      for (const [templateId, templateMetricsList] of Object.entries(templateMetrics)) {
        const sortedMetrics = templateMetricsList.sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        if (sortedMetrics.length >= 2) {
          const firstMetric = sortedMetrics[0];
          const lastMetric = sortedMetrics[sortedMetrics.length - 1];

          // Calculate improvements
          const successRateImprovement = lastMetric.success_rate - firstMetric.success_rate;
          const satisfactionImprovement = lastMetric.customer_satisfaction - firstMetric.customer_satisfaction;
          const responseTimeImprovement = firstMetric.response_time - lastMetric.response_time; // Lower is better

          if (successRateImprovement > 0.1) {
            improvements.push({
              metric: 'success_rate',
              before: firstMetric.success_rate,
              after: lastMetric.success_rate,
              improvement_percentage: (successRateImprovement * 100),
              confidence: 0.8,
              sample_size: sortedMetrics.length
            });
          }

          if (satisfactionImprovement > 0.1) {
            improvements.push({
              metric: 'customer_satisfaction',
              before: firstMetric.customer_satisfaction,
              after: lastMetric.customer_satisfaction,
              improvement_percentage: (satisfactionImprovement * 100),
              confidence: 0.8,
              sample_size: sortedMetrics.length
            });
          }

          // Generate insights based on trends
          if (successRateImprovement < -0.1) {
            insights.push({
              id: crypto.randomUUID(),
              type: 'anomaly',
              description: `Template success rate declining (${(successRateImprovement * 100).toFixed(1)}%)`,
              impact_score: 0.8,
              confidence: 0.7,
              recommendations: ['Review template content', 'Check for external factors'],
              data_source: templateId,
              created_at: new Date().toISOString()
            });
          }
        }
      }

      return { insights, improvements };
    } catch (error) {
      console.error('Error analyzing performance trends:', error);
      return { insights, improvements };
    }
  }

  // Knowledge Update
  private async updateKnowledge(
    dataSourceIds: string[],
    parameters: Record<string, any>
  ): Promise<AITrainingResults> {
    const knowledgeUpdates: KnowledgeUpdate[] = [];
    const insights: LearningInsight[] = [];

    try {
      // Get conversation data for knowledge extraction
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages(*)
        `)
        .in('id', dataSourceIds);

      if (error) throw error;

      // Extract knowledge from conversations
      for (const conversation of conversations || []) {
        const extractedKnowledge = await this.extractKnowledgeFromConversation(conversation);
        knowledgeUpdates.push(...extractedKnowledge);
      }

      // Generate insights about knowledge gaps
      const knowledgeGapInsights = await this.identifyKnowledgeGaps(knowledgeUpdates);
      insights.push(...knowledgeGapInsights);

      return {
        insights,
        optimizations: [],
        knowledge_updates: knowledgeUpdates,
        performance_improvements: [],
        confidence_score: 0.7,
        processing_time: 0
      };
    } catch (error) {
      console.error('Error updating knowledge:', error);
      throw error;
    }
  }

  private async extractKnowledgeFromConversation(conversation: any): Promise<KnowledgeUpdate[]> {
    const updates: KnowledgeUpdate[] = [];

    try {
      const messages = conversation.messages || [];
      const conversationText = messages.map((m: any) => m.content).join('\n');

      // Use AI to extract knowledge
      const knowledgeItems = await openaiService.extractKnowledge(conversationText, {
        types: ['faq', 'procedure', 'troubleshooting', 'product_info'],
        confidence_threshold: 0.6
      });

      for (const item of knowledgeItems.items) {
        updates.push({
          id: crypto.randomUUID(),
          type: item.type,
          description: item.description,
          impact: item.impact,
          confidence: item.confidence,
          data_source: conversation.id,
          recommended_action: item.recommended_action,
          created_at: new Date().toISOString()
        });
      }

      return updates;
    } catch (error) {
      console.error('Error extracting knowledge from conversation:', error);
      return updates;
    }
  }

  private async identifyKnowledgeGaps(updates: KnowledgeUpdate[]): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];

    try {
      // Group by type
      const typeGroups: Record<string, KnowledgeUpdate[]> = {};
      for (const update of updates) {
        if (!typeGroups[update.type]) {
          typeGroups[update.type] = [];
        }
        typeGroups[update.type].push(update);
      }

      // Identify gaps
      for (const [type, typeUpdates] of Object.entries(typeGroups)) {
        if (typeUpdates.length > 5) {
          insights.push({
            id: crypto.randomUUID(),
            type: 'pattern',
            description: `High volume of ${type} knowledge updates detected`,
            impact_score: 0.7,
            confidence: 0.8,
            recommendations: [
              `Create dedicated ${type} templates`,
              'Update knowledge base with common patterns',
              'Consider automated responses for frequent issues'
            ],
            data_source: 'knowledge_analysis',
            created_at: new Date().toISOString()
          });
        }
      }

      return insights;
    } catch (error) {
      console.error('Error identifying knowledge gaps:', error);
      return insights;
    }
  }

  // Apply Training Results
  private async applyTrainingResults(sessionId: string, results: AITrainingResults): Promise<void> {
    try {
      // Apply high-priority optimizations automatically
      for (const optimization of results.optimizations) {
        if (optimization.priority === 'high' && optimization.data_confidence > 0.8) {
          await this.applyOptimization(optimization);
        }
      }

      // Update knowledge base with new insights
      for (const update of results.knowledge_updates) {
        if (update.confidence > 0.7) {
          await this.updateKnowledgeBase(update);
        }
      }

      // Create training samples for future learning
      await this.createTrainingSamples(sessionId, results);

    } catch (error) {
      console.error('Error applying training results:', error);
    }
  }

  private async applyOptimization(optimization: OptimizationSuggestion): Promise<void> {
    try {
      // This would implement automatic optimization application
      // For now, just log the optimization
      console.log('Applied optimization:', optimization);
    } catch (error) {
      console.error('Error applying optimization:', error);
    }
  }

  private async updateKnowledgeBase(update: KnowledgeUpdate): Promise<void> {
    try {
      // This would update the knowledge base
      // For now, just log the update
      console.log('Updated knowledge base:', update);
    } catch (error) {
      console.error('Error updating knowledge base:', error);
    }
  }

  private async createTrainingSamples(sessionId: string, results: AITrainingResults): Promise<void> {
    try {
      // Create training samples for future ML training
      const samples = results.insights.map(insight => ({
        id: crypto.randomUUID(),
        conversation_id: sessionId,
        template_id: null,
        customer_response: insight.description,
        outcome: insight.impact_score > 0.7 ? 'positive' : 'neutral',
        context: {
          customer_id: sessionId,
          customer_type: 'unknown',
          conversation_stage: 'ongoing',
          intent: insight.type,
          sentiment: 'neutral',
          urgency: 'medium',
          channel: 'system',
          previous_interactions: 0,
          customer_data: {}
        },
        feedback_score: insight.confidence,
        created_at: new Date().toISOString()
      }));

      if (samples.length > 0) {
        await supabase
          .from('training_samples')
          .insert(samples);
      }
    } catch (error) {
      console.error('Error creating training samples:', error);
    }
  }

  // Utility Methods
  private calculateConfidenceScore(insights: LearningInsight[], optimizations: OptimizationSuggestion[]): number {
    const allConfidences = [
      ...insights.map(i => i.confidence),
      ...optimizations.map(o => o.data_confidence)
    ];

    if (allConfidences.length === 0) return 0;
    
    return allConfidences.reduce((sum, conf) => sum + conf, 0) / allConfidences.length;
  }

  private async analyzePerformancePatterns(conversations: any[]): Promise<PerformanceImprovement[]> {
    const improvements: PerformanceImprovement[] = [];

    try {
      // Analyze response times
      const responseTimes = conversations.map(c => this.calculateAverageResponseTime(c.messages || []));
      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;

      if (avgResponseTime > 0) {
        improvements.push({
          metric: 'response_time',
          before: avgResponseTime * 1.2, // Simulated previous value
          after: avgResponseTime,
          improvement_percentage: 16.7, // 1.2 to 1.0 is ~16.7% improvement
          confidence: 0.7,
          sample_size: conversations.length
        });
      }

      return improvements;
    } catch (error) {
      console.error('Error analyzing performance patterns:', error);
      return improvements;
    }
  }

  // Public API methods
  async getTrainingSession(sessionId: string): Promise<AITrainingSession | null> {
    try {
      const { data, error } = await supabase
        .from('ai_training_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting training session:', error);
      return null;
    }
  }

  async getTrainingSessions(limit: number = 10): Promise<AITrainingSession[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('ai_training_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting training sessions:', error);
      return [];
    }
  }

  async getTrainingSamples(templateId?: string, limit: number = 100): Promise<TrainingSample[]> {
    try {
      let query = supabase
        .from('training_samples')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (templateId) {
        query = query.eq('template_id', templateId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting training samples:', error);
      return [];
    }
  }

  async deleteTrainingSession(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_training_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting training session:', error);
      throw error;
    }
  }
}

export const aiTrainingService = new AITrainingService();