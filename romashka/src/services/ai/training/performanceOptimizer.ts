import { supabase } from '../../supabaseClient';
import { openaiService } from '../../openaiService';
import { aiTrainingService } from './aiTrainingService';
import { analyticsEngine } from '../../analytics/analyticsEngine';

export interface PerformanceMetrics {
  accuracy: number;
  confidenceScore: number;
  responseTime: number;
  customerSatisfaction: number;
  resolutionRate: number;
  escalationRate: number;
  knowledgeUtilization: number;
  templateEffectiveness: number;
  timestamp: Date;
}

export interface OptimizationRecommendation {
  id: string;
  type: 'accuracy' | 'satisfaction' | 'efficiency' | 'knowledge' | 'template';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: number;
  effort: number;
  expectedImprovement: number;
  actionItems: string[];
  data: any;
  createdAt: Date;
  status: 'pending' | 'implemented' | 'rejected';
}

export interface QualityAssessment {
  conversationId: string;
  overallScore: number;
  accuracyScore: number;
  satisfactionScore: number;
  efficiencyScore: number;
  issues: QualityIssue[];
  recommendations: string[];
  timestamp: Date;
}

export interface QualityIssue {
  type: 'accuracy' | 'tone' | 'completeness' | 'relevance' | 'escalation';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestion: string;
  impact: number;
}

export interface PredictiveInsight {
  id: string;
  type: 'outcome' | 'satisfaction' | 'escalation' | 'conversion';
  prediction: any;
  confidence: number;
  factors: string[];
  recommendation: string;
  timestamp: Date;
}

export interface CorrelationAnalysis {
  variable1: string;
  variable2: string;
  correlation: number;
  significance: number;
  insights: string[];
  recommendations: string[];
}

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private optimizationInterval: NodeJS.Timer | null = null;

  private constructor() {}

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  /**
   * Start continuous performance optimization
   */
  async startOptimization(): Promise<void> {
    if (this.optimizationInterval) return;

    console.log('Starting performance optimization...');

    // Run initial optimization
    await this.runOptimizationCycle();

    // Set up periodic optimization
    this.optimizationInterval = setInterval(async () => {
      await this.runOptimizationCycle();
    }, 30 * 60 * 1000); // Run every 30 minutes
  }

  /**
   * Stop continuous optimization
   */
  stopOptimization(): void {
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
      this.optimizationInterval = null;
    }
    console.log('Stopped performance optimization');
  }

  /**
   * Run optimization cycle
   */
  private async runOptimizationCycle(): Promise<void> {
    try {
      console.log('Running optimization cycle...');

      // 1. Track response accuracy
      await this.trackResponseAccuracy();

      // 2. Analyze satisfaction correlation
      await this.analyzeSatisfactionCorrelation();

      // 3. Generate recommendations
      await this.generateOptimizationRecommendations();

      // 4. Predict conversation outcomes
      await this.predictConversationOutcomes();

      // 5. Run quality assurance
      await this.runQualityAssurance();

      console.log('Optimization cycle completed');
    } catch (error) {
      console.error('Error in optimization cycle:', error);
    }
  }

  /**
   * Track response accuracy with confidence scoring
   */
  async trackResponseAccuracy(): Promise<PerformanceMetrics> {
    try {
      // Get recent conversations
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages (*),
          conversation_analyses (*),
          customer_ratings (*)
        `)
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate accuracy metrics
      const metrics = await this.calculateAccuracyMetrics(conversations || []);

      // Store metrics
      await supabase
        .from('performance_metrics')
        .insert({
          accuracy: metrics.accuracy,
          confidence_score: metrics.confidenceScore,
          response_time: metrics.responseTime,
          customer_satisfaction: metrics.customerSatisfaction,
          resolution_rate: metrics.resolutionRate,
          escalation_rate: metrics.escalationRate,
          knowledge_utilization: metrics.knowledgeUtilization,
          template_effectiveness: metrics.templateEffectiveness,
          timestamp: metrics.timestamp.toISOString()
        });

      return metrics;
    } catch (error) {
      console.error('Error tracking response accuracy:', error);
      throw error;
    }
  }

  /**
   * Calculate accuracy metrics
   */
  private async calculateAccuracyMetrics(conversations: any[]): Promise<PerformanceMetrics> {
    if (conversations.length === 0) {
      return {
        accuracy: 0,
        confidenceScore: 0,
        responseTime: 0,
        customerSatisfaction: 0,
        resolutionRate: 0,
        escalationRate: 0,
        knowledgeUtilization: 0,
        templateEffectiveness: 0,
        timestamp: new Date()
      };
    }

    // Calculate metrics
    const totalConversations = conversations.length;
    const resolvedConversations = conversations.filter(c => c.status === 'resolved').length;
    const escalatedConversations = conversations.filter(c => c.status === 'escalated').length;
    
    const avgConfidence = conversations.reduce((sum, c) => {
      const analysis = c.conversation_analyses?.[0]?.analysis;
      return sum + (analysis?.confidenceScore || 0);
    }, 0) / totalConversations;

    const avgSatisfaction = conversations.reduce((sum, c) => {
      const rating = c.customer_ratings?.[0]?.rating;
      return sum + (rating || 0);
    }, 0) / totalConversations;

    const avgResponseTime = conversations.reduce((sum, c) => {
      const messages = c.messages || [];
      if (messages.length < 2) return sum;
      
      const firstUser = messages.find((m: any) => m.type === 'user');
      const firstBot = messages.find((m: any) => m.type === 'assistant');
      
      if (firstUser && firstBot) {
        const responseTime = new Date(firstBot.created_at).getTime() - new Date(firstUser.created_at).getTime();
        return sum + responseTime;
      }
      return sum;
    }, 0) / totalConversations;

    // Calculate accuracy based on multiple factors
    const accuracy = (
      (resolvedConversations / totalConversations) * 0.4 +
      (avgConfidence / 100) * 0.3 +
      (avgSatisfaction / 5) * 0.3
    ) * 100;

    return {
      accuracy,
      confidenceScore: avgConfidence,
      responseTime: avgResponseTime,
      customerSatisfaction: avgSatisfaction,
      resolutionRate: (resolvedConversations / totalConversations) * 100,
      escalationRate: (escalatedConversations / totalConversations) * 100,
      knowledgeUtilization: await this.calculateKnowledgeUtilization(conversations),
      templateEffectiveness: await this.calculateTemplateEffectiveness(conversations),
      timestamp: new Date()
    };
  }

  /**
   * Analyze satisfaction correlation
   */
  async analyzeSatisfactionCorrelation(): Promise<CorrelationAnalysis[]> {
    try {
      // Get data for correlation analysis
      const { data: metrics, error } = await supabase
        .from('performance_metrics')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: false });

      if (error) throw error;

      if (!metrics || metrics.length < 10) {
        return [];
      }

      // Calculate correlations
      const correlations: CorrelationAnalysis[] = [];

      // Satisfaction vs Accuracy
      const satisfactionAccuracy = this.calculateCorrelation(
        metrics.map(m => m.customer_satisfaction),
        metrics.map(m => m.accuracy)
      );

      correlations.push({
        variable1: 'customer_satisfaction',
        variable2: 'accuracy',
        correlation: satisfactionAccuracy.correlation,
        significance: satisfactionAccuracy.significance,
        insights: await this.generateCorrelationInsights('satisfaction', 'accuracy', satisfactionAccuracy.correlation),
        recommendations: await this.generateCorrelationRecommendations('satisfaction', 'accuracy', satisfactionAccuracy.correlation)
      });

      // Satisfaction vs Response Time
      const satisfactionResponseTime = this.calculateCorrelation(
        metrics.map(m => m.customer_satisfaction),
        metrics.map(m => m.response_time)
      );

      correlations.push({
        variable1: 'customer_satisfaction',
        variable2: 'response_time',
        correlation: satisfactionResponseTime.correlation,
        significance: satisfactionResponseTime.significance,
        insights: await this.generateCorrelationInsights('satisfaction', 'response_time', satisfactionResponseTime.correlation),
        recommendations: await this.generateCorrelationRecommendations('satisfaction', 'response_time', satisfactionResponseTime.correlation)
      });

      // Store correlations
      for (const correlation of correlations) {
        await supabase
          .from('correlation_analyses')
          .insert({
            variable1: correlation.variable1,
            variable2: correlation.variable2,
            correlation: correlation.correlation,
            significance: correlation.significance,
            insights: correlation.insights,
            recommendations: correlation.recommendations,
            created_at: new Date().toISOString()
          });
      }

      return correlations;
    } catch (error) {
      console.error('Error analyzing satisfaction correlation:', error);
      return [];
    }
  }

  /**
   * Generate optimization recommendations
   */
  async generateOptimizationRecommendations(): Promise<OptimizationRecommendation[]> {
    try {
      // Get recent performance data
      const performance = await aiTrainingService.monitorPerformance();
      const metrics = await this.trackResponseAccuracy();

      // Generate recommendations using AI
      const recommendationPrompt = `
        Based on this performance data, generate optimization recommendations:
        
        Performance Trends: ${JSON.stringify(performance)}
        Current Metrics: ${JSON.stringify(metrics)}
        
        Generate recommendations for:
        - Improving response accuracy
        - Enhancing customer satisfaction
        - Increasing efficiency
        - Better knowledge utilization
        - Template optimization
        
        For each recommendation, provide:
        - Type (accuracy/satisfaction/efficiency/knowledge/template)
        - Priority (low/medium/high/critical)
        - Title and description
        - Impact score (1-10)
        - Effort score (1-10)
        - Expected improvement percentage
        - Specific action items
        
        Return JSON array of recommendations.
      `;

      const recommendationsResponse = await openaiService.generateResponse({
        messages: [{ role: 'user', content: recommendationPrompt }],
        temperature: 0.1,
        maxTokens: 2000
      });

      let recommendations: OptimizationRecommendation[];
      try {
        recommendations = JSON.parse(recommendationsResponse.content);
      } catch {
        recommendations = [];
      }

      // Store recommendations
      for (const rec of recommendations) {
        await supabase
          .from('optimization_recommendations')
          .insert({
            type: rec.type,
            priority: rec.priority,
            title: rec.title,
            description: rec.description,
            impact: rec.impact,
            effort: rec.effort,
            expected_improvement: rec.expectedImprovement,
            action_items: rec.actionItems,
            data: rec.data,
            status: 'pending',
            created_at: new Date().toISOString()
          });
      }

      return recommendations;
    } catch (error) {
      console.error('Error generating optimization recommendations:', error);
      return [];
    }
  }

  /**
   * Predict conversation outcomes
   */
  async predictConversationOutcomes(): Promise<PredictiveInsight[]> {
    try {
      // Get active conversations
      const { data: activeConversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages (*),
          conversation_analyses (*)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const insights: PredictiveInsight[] = [];

      for (const conversation of activeConversations || []) {
        const prediction = await this.predictConversationOutcome(conversation);
        if (prediction) {
          insights.push(prediction);
        }
      }

      return insights;
    } catch (error) {
      console.error('Error predicting conversation outcomes:', error);
      return [];
    }
  }

  /**
   * Predict single conversation outcome
   */
  private async predictConversationOutcome(conversation: any): Promise<PredictiveInsight | null> {
    try {
      const predictionPrompt = `
        Predict the outcome of this conversation:
        
        Conversation ID: ${conversation.id}
        Messages: ${conversation.messages?.map((m: any) => `${m.type}: ${m.content}`).join('\n')}
        Duration: ${Date.now() - new Date(conversation.created_at).getTime()}ms
        Channel: ${conversation.channel}
        
        Predict:
        - Outcome (resolved/escalated/abandoned)
        - Customer satisfaction (1-5)
        - Resolution probability (0-100%)
        - Escalation probability (0-100%)
        
        Also identify:
        - Key factors affecting outcome
        - Recommendations for improvement
        
        Return JSON with prediction details.
      `;

      const predictionResponse = await openaiService.generateResponse({
        messages: [{ role: 'user', content: predictionPrompt }],
        temperature: 0.1,
        maxTokens: 1000
      });

      const prediction = JSON.parse(predictionResponse.content);

      const insight: PredictiveInsight = {
        id: crypto.randomUUID(),
        type: 'outcome',
        prediction,
        confidence: prediction.confidence || 0,
        factors: prediction.factors || [],
        recommendation: prediction.recommendation || '',
        timestamp: new Date()
      };

      // Store insight
      await supabase
        .from('predictive_insights')
        .insert({
          conversation_id: conversation.id,
          type: insight.type,
          prediction: insight.prediction,
          confidence: insight.confidence,
          factors: insight.factors,
          recommendation: insight.recommendation,
          timestamp: insight.timestamp.toISOString()
        });

      return insight;
    } catch (error) {
      console.error('Error predicting conversation outcome:', error);
      return null;
    }
  }

  /**
   * Run quality assurance automation
   */
  async runQualityAssurance(): Promise<QualityAssessment[]> {
    try {
      // Get recent conversations for QA
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages (*),
          conversation_analyses (*),
          customer_ratings (*)
        `)
        .gte('created_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const assessments: QualityAssessment[] = [];

      for (const conversation of conversations || []) {
        const assessment = await this.assessConversationQuality(conversation);
        if (assessment) {
          assessments.push(assessment);
        }
      }

      return assessments;
    } catch (error) {
      console.error('Error running quality assurance:', error);
      return [];
    }
  }

  /**
   * Assess conversation quality
   */
  private async assessConversationQuality(conversation: any): Promise<QualityAssessment | null> {
    try {
      const qaPrompt = `
        Assess the quality of this conversation:
        
        Conversation: ${conversation.id}
        Messages: ${conversation.messages?.map((m: any) => `${m.type}: ${m.content}`).join('\n')}
        Status: ${conversation.status}
        Customer Rating: ${conversation.customer_ratings?.[0]?.rating || 'N/A'}
        
        Assess:
        - Overall quality score (0-100)
        - Accuracy score (0-100)
        - Satisfaction score (0-100)
        - Efficiency score (0-100)
        
        Identify issues:
        - Type (accuracy/tone/completeness/relevance/escalation)
        - Severity (low/medium/high)
        - Description
        - Suggestion for improvement
        - Impact score (1-10)
        
        Provide specific recommendations for improvement.
        
        Return JSON with assessment details.
      `;

      const qaResponse = await openaiService.generateResponse({
        messages: [{ role: 'user', content: qaPrompt }],
        temperature: 0.1,
        maxTokens: 1500
      });

      const qaData = JSON.parse(qaResponse.content);

      const assessment: QualityAssessment = {
        conversationId: conversation.id,
        overallScore: qaData.overallScore,
        accuracyScore: qaData.accuracyScore,
        satisfactionScore: qaData.satisfactionScore,
        efficiencyScore: qaData.efficiencyScore,
        issues: qaData.issues || [],
        recommendations: qaData.recommendations || [],
        timestamp: new Date()
      };

      // Store assessment
      await supabase
        .from('quality_assessments')
        .insert({
          conversation_id: conversation.id,
          overall_score: assessment.overallScore,
          accuracy_score: assessment.accuracyScore,
          satisfaction_score: assessment.satisfactionScore,
          efficiency_score: assessment.efficiencyScore,
          issues: assessment.issues,
          recommendations: assessment.recommendations,
          timestamp: assessment.timestamp.toISOString()
        });

      return assessment;
    } catch (error) {
      console.error('Error assessing conversation quality:', error);
      return null;
    }
  }

  /**
   * Get performance dashboard data
   */
  async getPerformanceDashboard(): Promise<any> {
    try {
      // Get recent metrics
      const { data: metrics, error } = await supabase
        .from('performance_metrics')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: false });

      if (error) throw error;

      // Get recent recommendations
      const { data: recommendations, error: recError } = await supabase
        .from('optimization_recommendations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (recError) throw recError;

      // Get quality assessments
      const { data: assessments, error: qaError } = await supabase
        .from('quality_assessments')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: false });

      if (qaError) throw qaError;

      return {
        metrics: metrics || [],
        recommendations: recommendations || [],
        assessments: assessments || [],
        trends: this.calculateTrends(metrics || []),
        summary: this.calculateSummary(metrics || [], assessments || [])
      };
    } catch (error) {
      console.error('Error getting performance dashboard:', error);
      throw error;
    }
  }

  // Helper methods
  private calculateCorrelation(x: number[], y: number[]): { correlation: number; significance: number } {
    if (x.length !== y.length || x.length < 2) {
      return { correlation: 0, significance: 0 };
    }

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    const correlation = denominator === 0 ? 0 : numerator / denominator;
    const significance = Math.abs(correlation) * Math.sqrt(n - 2) / Math.sqrt(1 - correlation * correlation);

    return { correlation, significance };
  }

  private async calculateKnowledgeUtilization(conversations: any[]): Promise<number> {
    // Calculate how effectively knowledge base is being used
    const totalConversations = conversations.length;
    if (totalConversations === 0) return 0;

    const conversationsWithKnowledge = conversations.filter(c => {
      const analysis = c.conversation_analyses?.[0]?.analysis;
      return analysis && analysis.knowledgeUsed && analysis.knowledgeUsed.length > 0;
    }).length;

    return (conversationsWithKnowledge / totalConversations) * 100;
  }

  private async calculateTemplateEffectiveness(conversations: any[]): Promise<number> {
    // Calculate template effectiveness based on outcomes
    const conversationsWithTemplates = conversations.filter(c => {
      const messages = c.messages || [];
      return messages.some((m: any) => m.template_id);
    });

    if (conversationsWithTemplates.length === 0) return 0;

    const successfulTemplateConversations = conversationsWithTemplates.filter(c => 
      c.status === 'resolved' && (c.customer_ratings?.[0]?.rating || 0) >= 4
    ).length;

    return (successfulTemplateConversations / conversationsWithTemplates.length) * 100;
  }

  private async generateCorrelationInsights(var1: string, var2: string, correlation: number): Promise<string[]> {
    const insights: string[] = [];
    
    if (Math.abs(correlation) > 0.7) {
      insights.push(`Strong correlation between ${var1} and ${var2} (${correlation.toFixed(3)})`);
    } else if (Math.abs(correlation) > 0.3) {
      insights.push(`Moderate correlation between ${var1} and ${var2} (${correlation.toFixed(3)})`);
    } else {
      insights.push(`Weak correlation between ${var1} and ${var2} (${correlation.toFixed(3)})`);
    }

    return insights;
  }

  private async generateCorrelationRecommendations(var1: string, var2: string, correlation: number): Promise<string[]> {
    const recommendations: string[] = [];
    
    if (var1 === 'satisfaction' && var2 === 'accuracy' && correlation > 0.5) {
      recommendations.push('Focus on improving response accuracy to increase customer satisfaction');
    }
    
    if (var1 === 'satisfaction' && var2 === 'response_time' && correlation < -0.5) {
      recommendations.push('Reduce response time to improve customer satisfaction');
    }

    return recommendations;
  }

  private calculateTrends(metrics: any[]): any {
    if (metrics.length < 2) return {};

    const latest = metrics[0];
    const previous = metrics[1];

    return {
      accuracy: this.calculateTrend(latest.accuracy, previous.accuracy),
      satisfaction: this.calculateTrend(latest.customer_satisfaction, previous.customer_satisfaction),
      efficiency: this.calculateTrend(latest.response_time, previous.response_time, true), // inverse for time
      resolution: this.calculateTrend(latest.resolution_rate, previous.resolution_rate)
    };
  }

  private calculateTrend(current: number, previous: number, inverse = false): any {
    const change = current - previous;
    const changePercent = previous === 0 ? 0 : (change / previous) * 100;
    
    let trend = 'stable';
    if (Math.abs(changePercent) > 5) {
      trend = inverse ? 
        (change > 0 ? 'down' : 'up') : 
        (change > 0 ? 'up' : 'down');
    }

    return {
      current,
      previous,
      change,
      changePercent,
      trend
    };
  }

  private calculateSummary(metrics: any[], assessments: any[]): any {
    if (metrics.length === 0) return {};

    const latestMetrics = metrics[0];
    const avgQualityScore = assessments.length > 0 ? 
      assessments.reduce((sum, a) => sum + a.overall_score, 0) / assessments.length : 0;

    return {
      overallHealth: this.calculateOverallHealth(latestMetrics, avgQualityScore),
      keyMetrics: {
        accuracy: latestMetrics.accuracy,
        satisfaction: latestMetrics.customer_satisfaction,
        resolution: latestMetrics.resolution_rate,
        qualityScore: avgQualityScore
      },
      alerts: this.generateAlerts(latestMetrics, assessments)
    };
  }

  private calculateOverallHealth(metrics: any, qualityScore: number): string {
    const healthScore = (
      metrics.accuracy * 0.3 +
      metrics.customer_satisfaction * 20 * 0.3 +
      metrics.resolution_rate * 0.2 +
      qualityScore * 0.2
    );

    if (healthScore >= 80) return 'excellent';
    if (healthScore >= 60) return 'good';
    if (healthScore >= 40) return 'fair';
    return 'poor';
  }

  private generateAlerts(metrics: any, assessments: any[]): string[] {
    const alerts: string[] = [];

    if (metrics.accuracy < 70) {
      alerts.push('Low accuracy detected - needs immediate attention');
    }

    if (metrics.customer_satisfaction < 3) {
      alerts.push('Customer satisfaction below threshold');
    }

    if (metrics.escalation_rate > 20) {
      alerts.push('High escalation rate detected');
    }

    const criticalIssues = assessments.filter(a => 
      a.issues?.some((i: any) => i.severity === 'high')
    ).length;

    if (criticalIssues > 0) {
      alerts.push(`${criticalIssues} conversations with critical quality issues`);
    }

    return alerts;
  }
}

export const performanceOptimizer = PerformanceOptimizer.getInstance();