/**
 * Integration Analytics Service
 * Tracks and analyzes AI-integration performance, business impact, and conversation intelligence
 */

import { supabase } from '../supabaseClient';

// Integration Analytics Types
export interface IntegrationQueryMetric {
  id: string;
  user_id: string;
  conversation_id: string;
  integration_provider: 'hubspot' | 'shopify' | 'salesforce';
  query_type: 'contact_lookup' | 'deal_lookup' | 'order_lookup' | 'product_lookup' | 'company_lookup';
  query_success: boolean;
  response_time_ms: number;
  data_freshness_hours: number;
  ai_confidence_score: number;
  customer_satisfaction_impact: number;
  created_at: string;
}

export interface ConversationOutcome {
  id: string;
  conversation_id: string;
  user_id: string;
  integration_data_used: boolean;
  integration_types_used: string[];
  outcome_type: 'resolved' | 'escalated' | 'abandoned' | 'converted';
  resolution_time_minutes: number;
  customer_satisfaction_score: number;
  business_value_generated: number;
  created_at: string;
}

export interface BusinessImpactMetric {
  id: string;
  user_id: string;
  metric_type: 'sales_conversion' | 'support_efficiency' | 'customer_retention' | 'upsell_opportunity';
  integration_provider: string;
  baseline_value: number;
  current_value: number;
  improvement_percentage: number;
  period_start: string;
  period_end: string;
  created_at: string;
}

export interface IntegrationHealthMetric {
  id: string;
  user_id: string;
  integration_provider: string;
  sync_status: 'healthy' | 'warning' | 'error';
  last_sync_at: string;
  sync_success_rate: number;
  error_rate: number;
  data_freshness_score: number;
  api_rate_limit_usage: number;
  created_at: string;
}

export interface ConversationIntelligence {
  id: string;
  conversation_id: string;
  user_id: string;
  data_types_accessed: string[];
  knowledge_gaps_identified: string[];
  ai_confidence_with_data: number;
  ai_confidence_without_data: number;
  customer_journey_stage: string;
  conversion_probability: number;
  created_at: string;
}

export interface PredictiveInsight {
  id: string;
  user_id: string;
  insight_type: 'churn_risk' | 'upsell_opportunity' | 'integration_need' | 'performance_anomaly';
  confidence_score: number;
  predicted_value: number;
  contributing_factors: string[];
  recommended_actions: string[];
  created_at: string;
}

// Analytics Dashboard Data Types
export interface IntegrationDashboardData {
  integrationHealth: IntegrationHealthSummary;
  aiPerformance: AIIntegrationPerformance;
  businessImpact: BusinessImpactSummary;
  conversationIntelligence: ConversationIntelligenceSummary;
  predictiveInsights: PredictiveInsight[];
  realTimeMetrics: RealTimeMetrics;
}

export interface IntegrationHealthSummary {
  overall_health_score: number;
  integrations: {
    provider: string;
    status: 'healthy' | 'warning' | 'error';
    sync_success_rate: number;
    last_sync_at: string;
    data_freshness_hours: number;
    error_count: number;
  }[];
  sync_trends: {
    date: string;
    success_rate: number;
    data_volume: number;
  }[];
}

export interface AIIntegrationPerformance {
  query_success_rate: number;
  avg_response_time_ms: number;
  confidence_improvement: number;
  most_valuable_data_types: {
    type: string;
    usage_count: number;
    success_rate: number;
    avg_confidence_boost: number;
  }[];
  performance_trends: {
    date: string;
    success_rate: number;
    avg_confidence: number;
    response_time: number;
  }[];
}

export interface BusinessImpactSummary {
  total_roi: number;
  cost_savings: number;
  revenue_attribution: number;
  efficiency_gains: {
    metric: string;
    improvement_percentage: number;
    value: number;
  }[];
  conversion_impact: {
    baseline_rate: number;
    current_rate: number;
    improvement: number;
  };
}

export interface ConversationIntelligenceSummary {
  data_utilization_rate: number;
  knowledge_gap_frequency: number;
  customer_journey_insights: {
    stage: string;
    conversion_rate: number;
    avg_data_points_used: number;
  }[];
  satisfaction_correlation: {
    with_data: number;
    without_data: number;
    improvement: number;
  };
}

export interface RealTimeMetrics {
  active_integrations: number;
  current_sync_jobs: number;
  api_calls_per_minute: number;
  error_rate_last_hour: number;
  data_freshness_alert_count: number;
}

export class IntegrationAnalyticsService {
  /**
   * Track AI-integration query performance
   */
  async trackIntegrationQuery(
    userId: string,
    conversationId: string,
    provider: string,
    queryType: string,
    success: boolean,
    responseTime: number,
    dataFreshness: number,
    aiConfidence: number,
    satisfactionImpact: number = 0
  ): Promise<void> {
    try {
      await supabase!
        .from('integration_query_metrics')
        .insert({
          user_id: userId,
          conversation_id: conversationId,
          integration_provider: provider,
          query_type: queryType,
          query_success: success,
          response_time_ms: responseTime,
          data_freshness_hours: dataFreshness,
          ai_confidence_score: aiConfidence,
          customer_satisfaction_impact: satisfactionImpact
        });
    } catch (error) {
      console.error('Error tracking integration query:', error);
    }
  }

  /**
   * Record conversation outcome with integration context
   */
  async recordConversationOutcome(
    conversationId: string,
    userId: string,
    integrationDataUsed: boolean,
    integrationTypes: string[],
    outcome: string,
    resolutionTime: number,
    satisfactionScore: number,
    businessValue: number = 0
  ): Promise<void> {
    try {
      await supabase!
        .from('conversation_outcomes')
        .insert({
          conversation_id: conversationId,
          user_id: userId,
          integration_data_used: integrationDataUsed,
          integration_types_used: integrationTypes,
          outcome_type: outcome,
          resolution_time_minutes: resolutionTime,
          customer_satisfaction_score: satisfactionScore,
          business_value_generated: businessValue
        });
    } catch (error) {
      console.error('Error recording conversation outcome:', error);
    }
  }

  /**
   * Update integration health metrics
   */
  async updateIntegrationHealth(
    userId: string,
    provider: string,
    syncStatus: string,
    lastSyncAt: string,
    successRate: number,
    errorRate: number,
    dataFreshness: number,
    rateLimitUsage: number
  ): Promise<void> {
    try {
      await supabase!
        .from('integration_health_metrics')
        .upsert({
          user_id: userId,
          integration_provider: provider,
          sync_status: syncStatus,
          last_sync_at: lastSyncAt,
          sync_success_rate: successRate,
          error_rate: errorRate,
          data_freshness_score: dataFreshness,
          api_rate_limit_usage: rateLimitUsage
        });
    } catch (error) {
      console.error('Error updating integration health:', error);
    }
  }

  /**
   * Track business impact metrics
   */
  async trackBusinessImpact(
    userId: string,
    metricType: string,
    provider: string,
    baselineValue: number,
    currentValue: number,
    periodStart: string,
    periodEnd: string
  ): Promise<void> {
    try {
      const improvement = ((currentValue - baselineValue) / baselineValue) * 100;
      
      await supabase!
        .from('business_impact_metrics')
        .insert({
          user_id: userId,
          metric_type: metricType,
          integration_provider: provider,
          baseline_value: baselineValue,
          current_value: currentValue,
          improvement_percentage: improvement,
          period_start: periodStart,
          period_end: periodEnd
        });
    } catch (error) {
      console.error('Error tracking business impact:', error);
    }
  }

  /**
   * Record conversation intelligence data
   */
  async recordConversationIntelligence(
    conversationId: string,
    userId: string,
    dataTypesAccessed: string[],
    knowledgeGaps: string[],
    confidenceWithData: number,
    confidenceWithoutData: number,
    journeyStage: string,
    conversionProbability: number
  ): Promise<void> {
    try {
      await supabase!
        .from('conversation_intelligence')
        .insert({
          conversation_id: conversationId,
          user_id: userId,
          data_types_accessed: dataTypesAccessed,
          knowledge_gaps_identified: knowledgeGaps,
          ai_confidence_with_data: confidenceWithData,
          ai_confidence_without_data: confidenceWithoutData,
          customer_journey_stage: journeyStage,
          conversion_probability: conversionProbability
        });
    } catch (error) {
      console.error('Error recording conversation intelligence:', error);
    }
  }

  /**
   * Generate predictive insights
   */
  async generatePredictiveInsight(
    userId: string,
    insightType: string,
    confidence: number,
    predictedValue: number,
    factors: string[],
    actions: string[]
  ): Promise<void> {
    try {
      await supabase!
        .from('predictive_insights')
        .insert({
          user_id: userId,
          insight_type: insightType,
          confidence_score: confidence,
          predicted_value: predictedValue,
          contributing_factors: factors,
          recommended_actions: actions
        });
    } catch (error) {
      console.error('Error generating predictive insight:', error);
    }
  }

  /**
   * Get comprehensive dashboard data
   */
  async getDashboardData(userId: string, timeRange: string = '30d'): Promise<IntegrationDashboardData> {
    try {
      const [
        integrationHealth,
        aiPerformance,
        businessImpact,
        conversationIntelligence,
        predictiveInsights,
        realTimeMetrics
      ] = await Promise.all([
        this.getIntegrationHealthSummary(userId, timeRange),
        this.getAIIntegrationPerformance(userId, timeRange),
        this.getBusinessImpactSummary(userId, timeRange),
        this.getConversationIntelligenceSummary(userId, timeRange),
        this.getPredictiveInsights(userId),
        this.getRealTimeMetrics(userId)
      ]);

      return {
        integrationHealth,
        aiPerformance,
        businessImpact,
        conversationIntelligence,
        predictiveInsights,
        realTimeMetrics
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get integration health summary
   */
  private async getIntegrationHealthSummary(userId: string, timeRange: string): Promise<IntegrationHealthSummary> {
    const { data: healthData } = await supabase!
      .from('integration_health_metrics')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', this.getTimeRangeStart(timeRange))
      .order('created_at', { ascending: false });

    const integrations = healthData?.reduce((acc: any[], metric) => {
      const existing = acc.find(i => i.provider === metric.integration_provider);
      if (!existing) {
        acc.push({
          provider: metric.integration_provider,
          status: metric.sync_status,
          sync_success_rate: metric.sync_success_rate,
          last_sync_at: metric.last_sync_at,
          data_freshness_hours: metric.data_freshness_score,
          error_count: Math.round(metric.error_rate * 100)
        });
      }
      return acc;
    }, []) || [];

    const overall_health_score = integrations.reduce((sum, i) => sum + i.sync_success_rate, 0) / (integrations.length || 1);

    return {
      overall_health_score: Math.round(overall_health_score * 100) / 100,
      integrations,
      sync_trends: [] // TODO: Implement trend calculation
    };
  }

  /**
   * Get AI integration performance data
   */
  private async getAIIntegrationPerformance(userId: string, timeRange: string): Promise<AIIntegrationPerformance> {
    const { data: queryData } = await supabase!
      .from('integration_query_metrics')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', this.getTimeRangeStart(timeRange));

    if (!queryData || queryData.length === 0) {
      return {
        query_success_rate: 0,
        avg_response_time_ms: 0,
        confidence_improvement: 0,
        most_valuable_data_types: [],
        performance_trends: []
      };
    }

    const successRate = queryData.filter(q => q.query_success).length / queryData.length;
    const avgResponseTime = queryData.reduce((sum, q) => sum + q.response_time_ms, 0) / queryData.length;
    const avgConfidence = queryData.reduce((sum, q) => sum + q.ai_confidence_score, 0) / queryData.length;

    // Group by query type for most valuable data types
    const dataTypeStats = queryData.reduce((acc: any, query) => {
      const type = query.query_type;
      if (!acc[type]) {
        acc[type] = {
          type,
          usage_count: 0,
          success_count: 0,
          confidence_sum: 0
        };
      }
      acc[type].usage_count++;
      if (query.query_success) acc[type].success_count++;
      acc[type].confidence_sum += query.ai_confidence_score;
      return acc;
    }, {});

    const most_valuable_data_types = Object.values(dataTypeStats).map((stat: any) => ({
      type: stat.type,
      usage_count: stat.usage_count,
      success_rate: stat.success_count / stat.usage_count,
      avg_confidence_boost: stat.confidence_sum / stat.usage_count
    }));

    return {
      query_success_rate: successRate,
      avg_response_time_ms: Math.round(avgResponseTime),
      confidence_improvement: avgConfidence * 100,
      most_valuable_data_types,
      performance_trends: [] // TODO: Implement trend calculation
    };
  }

  /**
   * Get business impact summary
   */
  private async getBusinessImpactSummary(userId: string, timeRange: string): Promise<BusinessImpactSummary> {
    const { data: impactData } = await supabase!
      .from('business_impact_metrics')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', this.getTimeRangeStart(timeRange));

    if (!impactData || impactData.length === 0) {
      return {
        total_roi: 0,
        cost_savings: 0,
        revenue_attribution: 0,
        efficiency_gains: [],
        conversion_impact: {
          baseline_rate: 0,
          current_rate: 0,
          improvement: 0
        }
      };
    }

    const totalROI = impactData.reduce((sum, metric) => sum + metric.improvement_percentage, 0);
    const costSavings = impactData
      .filter(m => m.metric_type === 'support_efficiency')
      .reduce((sum, m) => sum + (m.current_value - m.baseline_value), 0);

    const efficiency_gains = impactData.map(metric => ({
      metric: metric.metric_type,
      improvement_percentage: metric.improvement_percentage,
      value: metric.current_value
    }));

    return {
      total_roi: totalROI,
      cost_savings: costSavings,
      revenue_attribution: 0, // TODO: Calculate from conversion data
      efficiency_gains,
      conversion_impact: {
        baseline_rate: 0,
        current_rate: 0,
        improvement: 0
      }
    };
  }

  /**
   * Get conversation intelligence summary
   */
  private async getConversationIntelligenceSummary(userId: string, timeRange: string): Promise<ConversationIntelligenceSummary> {
    const { data: intelligenceData } = await supabase!
      .from('conversation_intelligence')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', this.getTimeRangeStart(timeRange));

    if (!intelligenceData || intelligenceData.length === 0) {
      return {
        data_utilization_rate: 0,
        knowledge_gap_frequency: 0,
        customer_journey_insights: [],
        satisfaction_correlation: {
          with_data: 0,
          without_data: 0,
          improvement: 0
        }
      };
    }

    const dataUtilizationRate = intelligenceData.filter(d => d.data_types_accessed.length > 0).length / intelligenceData.length;
    const knowledgeGapFrequency = intelligenceData.reduce((sum, d) => sum + d.knowledge_gaps_identified.length, 0) / intelligenceData.length;

    const avgConfidenceWithData = intelligenceData.reduce((sum, d) => sum + d.ai_confidence_with_data, 0) / intelligenceData.length;
    const avgConfidenceWithoutData = intelligenceData.reduce((sum, d) => sum + d.ai_confidence_without_data, 0) / intelligenceData.length;

    return {
      data_utilization_rate: dataUtilizationRate,
      knowledge_gap_frequency: knowledgeGapFrequency,
      customer_journey_insights: [], // TODO: Implement journey analysis
      satisfaction_correlation: {
        with_data: avgConfidenceWithData,
        without_data: avgConfidenceWithoutData,
        improvement: avgConfidenceWithData - avgConfidenceWithoutData
      }
    };
  }

  /**
   * Get predictive insights
   */
  private async getPredictiveInsights(userId: string): Promise<PredictiveInsight[]> {
    const { data: insights } = await supabase!
      .from('predictive_insights')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    return insights || [];
  }

  /**
   * Get real-time metrics
   */
  private async getRealTimeMetrics(userId: string): Promise<RealTimeMetrics> {
    // TODO: Implement real-time metrics calculation
    return {
      active_integrations: 3,
      current_sync_jobs: 0,
      api_calls_per_minute: 15,
      error_rate_last_hour: 0.02,
      data_freshness_alert_count: 0
    };
  }

  /**
   * Helper method to get time range start date
   */
  private getTimeRangeStart(timeRange: string): string {
    const now = new Date();
    const days = parseInt(timeRange.replace('d', ''));
    const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    return startDate.toISOString();
  }

  /**
   * Generate automated insights and alerts
   */
  async generateAutomatedInsights(userId: string): Promise<void> {
    try {
      // Check for integration health issues
      await this.checkIntegrationHealth(userId);
      
      // Analyze performance anomalies
      await this.detectPerformanceAnomalies(userId);
      
      // Identify optimization opportunities
      await this.identifyOptimizationOpportunities(userId);
      
      // Predict customer behavior
      await this.predictCustomerBehavior(userId);
    } catch (error) {
      console.error('Error generating automated insights:', error);
    }
  }

  private async checkIntegrationHealth(userId: string): Promise<void> {
    // TODO: Implement health checks and alert generation
  }

  private async detectPerformanceAnomalies(userId: string): Promise<void> {
    // TODO: Implement anomaly detection
  }

  private async identifyOptimizationOpportunities(userId: string): Promise<void> {
    // TODO: Implement optimization analysis
  }

  private async predictCustomerBehavior(userId: string): Promise<void> {
    // TODO: Implement customer behavior prediction
  }
}

export const integrationAnalyticsService = new IntegrationAnalyticsService();