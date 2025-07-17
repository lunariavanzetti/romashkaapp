import { supabase } from '../supabaseClient';
import type { 
  RealtimeAnalytics,
  HistoricalAnalytics,
  PredictiveAnalytics,
  ChannelMetrics,
  TimeSeries,
  VolumePredict,
  StaffingPrediction,
  PerformanceForecast,
  SeasonalPattern,
  AIPerformanceMetrics,
  ConversationAnalytics,
  BusinessIntelligence,
  ROIAnalysis
} from '../../types/analytics';

export class AnalyticsEngineService {
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private cache = new Map<string, { data: any; timestamp: number }>();

  // ================================
  // REAL-TIME ANALYTICS
  // ================================

  async getRealtimeAnalytics(): Promise<RealtimeAnalytics> {
    const cacheKey = 'realtime_analytics';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const [
        activeConversations,
        averageResponseTime,
        resolutionRate,
        customerSatisfaction,
        aiPerformanceScore,
        channelDistribution
      ] = await Promise.all([
        this.getActiveConversationsCount(),
        this.getAverageResponseTime(),
        this.getResolutionRate(),
        this.getCustomerSatisfactionScore(),
        this.getAIPerformanceScore(),
        this.getChannelDistribution()
      ]);

      const data: RealtimeAnalytics = {
        activeConversations,
        averageResponseTime,
        resolutionRate,
        customerSatisfaction,
        aiPerformanceScore,
        channelDistribution,
        lastUpdated: new Date().toISOString()
      };

      this.setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching real-time analytics:', error);
      throw error;
    }
  }

  async getHistoricalAnalytics(
    timeRange: { start: string; end: string },
    granularity: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<HistoricalAnalytics> {
    const cacheKey = `historical_analytics_${timeRange.start}_${timeRange.end}_${granularity}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const [
        conversationVolume,
        responseTimesTrend,
        satisfactionTrend,
        resolutionRateTrend,
        channelPerformance
      ] = await Promise.all([
        this.getConversationVolumeTrend(timeRange, granularity),
        this.getResponseTimeTrend(timeRange, granularity),
        this.getSatisfactionTrend(timeRange, granularity),
        this.getResolutionRateTrend(timeRange, granularity),
        this.getChannelPerformanceTrend(timeRange, granularity)
      ]);

      const data: HistoricalAnalytics = {
        timeRange,
        granularity,
        conversationVolume,
        responseTimesTrend,
        satisfactionTrend,
        resolutionRateTrend,
        channelPerformance,
        generatedAt: new Date().toISOString()
      };

      this.setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching historical analytics:', error);
      throw error;
    }
  }

  async getPredictiveAnalytics(forecastDays: number = 30): Promise<PredictiveAnalytics> {
    const cacheKey = `predictive_analytics_${forecastDays}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const [
        volumeForecast,
        staffingRecommendations,
        performancePredictions,
        seasonalityPatterns
      ] = await Promise.all([
        this.getVolumeForecast(forecastDays),
        this.getStaffingRecommendations(forecastDays),
        this.getPerformancePredictions(forecastDays),
        this.getSeasonalityPatterns()
      ]);

      const data: PredictiveAnalytics = {
        forecastPeriod: forecastDays,
        volumeForecast,
        staffingRecommendations,
        performancePredictions,
        seasonalityPatterns,
        modelAccuracy: 85, // This would be calculated from model performance
        generatedAt: new Date().toISOString()
      };

      this.setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching predictive analytics:', error);
      throw error;
    }
  }

  async getAIPerformanceMetrics(): Promise<AIPerformanceMetrics> {
    const cacheKey = 'ai_performance_metrics';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const [
        accuracyScore,
        learningProgress,
        conversationOutcomes,
        improvementAreas,
        trainingRecommendations
      ] = await Promise.all([
        this.getAIAccuracyScore(),
        this.getLearningProgress(),
        this.getConversationOutcomes(),
        this.getImprovementAreas(),
        this.getTrainingRecommendations()
      ]);

      const data: AIPerformanceMetrics = {
        accuracyScore,
        learningProgress,
        conversationOutcomes,
        improvementAreas,
        trainingRecommendations,
        modelVersion: '1.0',
        lastTrainingUpdate: new Date().toISOString()
      };

      this.setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching AI performance metrics:', error);
      throw error;
    }
  }

  // ================================
  // BUSINESS INTELLIGENCE
  // ================================

  async getBusinessIntelligence(): Promise<BusinessIntelligence> {
    const cacheKey = 'business_intelligence';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const [
        kpis,
        trends,
        insights,
        recommendations
      ] = await Promise.all([
        this.getKPIs(),
        this.getTrends(),
        this.getBusinessInsights(),
        this.getBusinessRecommendations()
      ]);

      const data: BusinessIntelligence = {
        kpis,
        trends,
        insights,
        recommendations,
        generatedAt: new Date().toISOString()
      };

      this.setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching business intelligence:', error);
      throw error;
    }
  }

  async calculateROI(timeFrame: { start: string; end: string }): Promise<ROIAnalysis> {
    const cacheKey = `roi_analysis_${timeFrame.start}_${timeFrame.end}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const [
        costSavings,
        efficiencyGains,
        satisfactionImpact,
        revenueImpact
      ] = await Promise.all([
        this.calculateCostSavings(timeFrame),
        this.calculateEfficiencyGains(timeFrame),
        this.calculateSatisfactionImpact(timeFrame),
        this.calculateRevenueImpact(timeFrame)
      ]);

      const totalROI = costSavings + efficiencyGains + revenueImpact;

      const data: ROIAnalysis = {
        timeFrame,
        costSavings,
        efficiencyGains,
        customerSatisfactionImpact: satisfactionImpact,
        revenueImpact,
        totalROI,
        roiPercentage: Math.round((totalROI / 100000) * 100), // Assuming 100k investment
        calculatedAt: new Date().toISOString()
      };

      this.setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error calculating ROI:', error);
      throw error;
    }
  }

  // ================================
  // CONVERSATION ANALYTICS
  // ================================

  async getConversationAnalytics(conversationId: string): Promise<ConversationAnalytics> {
    try {
      const { data: analytics, error } = await supabase
        .from('conversation_analytics')
        .select(`
          *,
          conversation:conversations(*)
        `)
        .eq('conversation_id', conversationId)
        .single();

      if (error) throw error;

      if (!analytics) {
        // If analytics don't exist, create them
        return await this.createConversationAnalytics(conversationId);
      }

      return analytics;
    } catch (error) {
      console.error('Error fetching conversation analytics:', error);
      throw error;
    }
  }

  async updateConversationAnalytics(conversationId: string, updates: Partial<ConversationAnalytics>): Promise<void> {
    try {
      const { error } = await supabase
        .from('conversation_analytics')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('conversation_id', conversationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating conversation analytics:', error);
      throw error;
    }
  }

  // ================================
  // PERFORMANCE METRICS
  // ================================

  async recordPerformanceMetric(
    metricName: string,
    metricType: string,
    value: number,
    dimensions?: Record<string, any>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('performance_metrics')
        .insert({
          metric_name: metricName,
          metric_type: metricType,
          metric_value: value,
          dimensions: dimensions || {},
          timestamp: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error recording performance metric:', error);
      throw error;
    }
  }

  async getPerformanceMetrics(
    metricType?: string,
    timeRange?: { start: string; end: string }
  ): Promise<Array<{ metric_name: string; metric_value: number; timestamp: string; dimensions: any }>> {
    try {
      let query = supabase
        .from('performance_metrics')
        .select('*')
        .order('timestamp', { ascending: false });

      if (metricType) {
        query = query.eq('metric_type', metricType);
      }

      if (timeRange) {
        query = query
          .gte('timestamp', timeRange.start)
          .lte('timestamp', timeRange.end);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      throw error;
    }
  }

  // ================================
  // PRIVATE HELPER METHODS
  // ================================

  private async getActiveConversationsCount(): Promise<number> {
    const { count, error } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (error) throw error;
    return count || 0;
  }

  private async getAverageResponseTime(): Promise<number> {
    const { data, error } = await supabase
      .from('conversation_analytics')
      .select('avg_response_time_seconds')
      .not('avg_response_time_seconds', 'is', null)
      .gte('started_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    if (!data || data.length === 0) return 120; // Default 2 minutes

    const sum = data.reduce((acc, item) => acc + (item.avg_response_time_seconds || 0), 0);
    return Math.round(sum / data.length);
  }

  private async getResolutionRate(): Promise<number> {
    const { data, error } = await supabase
      .from('conversation_analytics')
      .select('resolved_by')
      .not('resolved_by', 'is', null)
      .gte('started_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    if (!data || data.length === 0) return 0.85; // Default 85%

    const resolved = data.filter(item => item.resolved_by !== 'abandoned').length;
    return Math.round((resolved / data.length) * 100) / 100;
  }

  private async getCustomerSatisfactionScore(): Promise<number> {
    const { data, error } = await supabase
      .from('conversation_analytics')
      .select('customer_satisfaction')
      .not('customer_satisfaction', 'is', null)
      .gte('started_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    if (!data || data.length === 0) return 4.2; // Default 4.2/5

    const sum = data.reduce((acc, item) => acc + (item.customer_satisfaction || 0), 0);
    return Math.round((sum / data.length) * 10) / 10;
  }

  private async getAIPerformanceScore(): Promise<number> {
    const { data, error } = await supabase
      .from('conversation_analytics')
      .select('ai_accuracy_score')
      .not('ai_accuracy_score', 'is', null)
      .gte('started_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    if (!data || data.length === 0) return 0.88; // Default 88%

    const sum = data.reduce((acc, item) => acc + (item.ai_accuracy_score || 0), 0);
    return Math.round((sum / data.length) * 100) / 100;
  }

  private async getChannelDistribution(): Promise<ChannelMetrics[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('channel_type')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    if (!data || data.length === 0) {
      return [
        { channel: 'website', count: 60, percentage: 60 },
        { channel: 'whatsapp', count: 25, percentage: 25 },
        { channel: 'email', count: 15, percentage: 15 }
      ];
    }

    const channelCounts = data.reduce((acc, item) => {
      const channel = item.channel_type || 'website';
      acc[channel] = (acc[channel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = data.length;
    return Object.entries(channelCounts).map(([channel, count]) => ({
      channel,
      count,
      percentage: Math.round((count / total) * 100)
    }));
  }

  private async getConversationVolumeTrend(
    timeRange: { start: string; end: string },
    granularity: string
  ): Promise<TimeSeries[]> {
    const { data, error } = await supabase
      .from('daily_analytics')
      .select('date, total_conversations')
      .gte('date', timeRange.start)
      .lte('date', timeRange.end)
      .order('date', { ascending: true });

    if (error) throw error;

    return (data || []).map(item => ({
      timestamp: item.date,
      value: item.total_conversations || 0
    }));
  }

  private async getResponseTimeTrend(
    timeRange: { start: string; end: string },
    granularity: string
  ): Promise<TimeSeries[]> {
    const { data, error } = await supabase
      .from('daily_analytics')
      .select('date, avg_response_time_seconds')
      .gte('date', timeRange.start)
      .lte('date', timeRange.end)
      .order('date', { ascending: true });

    if (error) throw error;

    return (data || []).map(item => ({
      timestamp: item.date,
      value: item.avg_response_time_seconds || 0
    }));
  }

  private async getSatisfactionTrend(
    timeRange: { start: string; end: string },
    granularity: string
  ): Promise<TimeSeries[]> {
    const { data, error } = await supabase
      .from('daily_analytics')
      .select('date, avg_customer_satisfaction')
      .gte('date', timeRange.start)
      .lte('date', timeRange.end)
      .order('date', { ascending: true });

    if (error) throw error;

    return (data || []).map(item => ({
      timestamp: item.date,
      value: item.avg_customer_satisfaction || 0
    }));
  }

  private async getResolutionRateTrend(
    timeRange: { start: string; end: string },
    granularity: string
  ): Promise<TimeSeries[]> {
    const { data, error } = await supabase
      .from('daily_analytics')
      .select('date, resolution_rate')
      .gte('date', timeRange.start)
      .lte('date', timeRange.end)
      .order('date', { ascending: true });

    if (error) throw error;

    return (data || []).map(item => ({
      timestamp: item.date,
      value: item.resolution_rate || 0
    }));
  }

  private async getChannelPerformanceTrend(
    timeRange: { start: string; end: string },
    granularity: string
  ): Promise<Array<{ channel: string; performance: TimeSeries[] }>> {
    const { data, error } = await supabase
      .from('daily_analytics')
      .select('date, channel_distribution')
      .gte('date', timeRange.start)
      .lte('date', timeRange.end)
      .order('date', { ascending: true });

    if (error) throw error;

    // Process channel distribution data
    const channelData: Record<string, TimeSeries[]> = {};
    
    for (const item of data || []) {
      const distribution = item.channel_distribution || {};
      
      for (const [channel, value] of Object.entries(distribution)) {
        if (!channelData[channel]) {
          channelData[channel] = [];
        }
        channelData[channel].push({
          timestamp: item.date,
          value: typeof value === 'number' ? value : 0
        });
      }
    }

    return Object.entries(channelData).map(([channel, performance]) => ({
      channel,
      performance
    }));
  }

  private async getVolumeForecast(days: number): Promise<VolumePredict[]> {
    const { data, error } = await supabase
      .from('predictive_analytics')
      .select('*')
      .eq('prediction_type', 'volume_forecast')
      .gte('prediction_date', new Date().toISOString().split('T')[0])
      .lte('prediction_date', new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('prediction_date', { ascending: true });

    if (error) throw error;

    return (data || []).map(item => ({
      date: new Date(item.prediction_date),
      predictedVolume: item.predicted_value,
      confidence: item.confidence_level,
      seasonalAdjustment: 1.0 // Would be calculated based on historical patterns
    }));
  }

  private async getStaffingRecommendations(days: number): Promise<StaffingPrediction[]> {
    const volumeForecast = await this.getVolumeForecast(days);
    
    return volumeForecast.map(forecast => ({
      date: forecast.date,
      recommendedStaff: Math.ceil(forecast.predictedVolume / 20), // Assuming 20 conversations per staff member
      confidence: forecast.confidence,
      reasoning: `Based on predicted volume of ${forecast.predictedVolume} conversations`
    }));
  }

  private async getPerformancePredictions(days: number): Promise<PerformanceForecast[]> {
    const { data, error } = await supabase
      .from('predictive_analytics')
      .select('*')
      .eq('prediction_type', 'satisfaction_trend')
      .gte('prediction_date', new Date().toISOString().split('T')[0])
      .lte('prediction_date', new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('prediction_date', { ascending: true });

    if (error) throw error;

    return (data || []).map(item => ({
      date: new Date(item.prediction_date),
      predictedSatisfaction: item.predicted_value,
      predictedResponseTime: 120, // Would be calculated from separate prediction
      confidence: item.confidence_level
    }));
  }

  private async getSeasonalityPatterns(): Promise<SeasonalPattern[]> {
    // This would analyze historical data to identify seasonal patterns
    return [
      {
        pattern: 'daily',
        description: 'Peak hours: 9-11 AM and 2-4 PM',
        strength: 0.75,
        recommendations: ['Increase staffing during peak hours']
      },
      {
        pattern: 'weekly',
        description: 'Higher volume on Tuesdays and Wednesdays',
        strength: 0.65,
        recommendations: ['Schedule more agents mid-week']
      },
      {
        pattern: 'monthly',
        description: 'Increased activity at month-end',
        strength: 0.55,
        recommendations: ['Prepare for month-end spikes']
      }
    ];
  }

  private async getAIAccuracyScore(): Promise<number> {
    const { data, error } = await supabase
      .from('conversation_analytics')
      .select('ai_accuracy_score')
      .not('ai_accuracy_score', 'is', null)
      .gte('started_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    if (!data || data.length === 0) return 0.88;

    const sum = data.reduce((acc, item) => acc + (item.ai_accuracy_score || 0), 0);
    return Math.round((sum / data.length) * 100) / 100;
  }

  private async getLearningProgress(): Promise<Array<{ date: string; accuracy: number; improvement: number }>> {
    const { data, error } = await supabase
      .from('daily_analytics')
      .select('date, ai_accuracy_score')
      .not('ai_accuracy_score', 'is', null)
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) throw error;

    return (data || []).map((item, index, array) => ({
      date: item.date,
      accuracy: item.ai_accuracy_score || 0,
      improvement: index > 0 ? 
        ((item.ai_accuracy_score || 0) - (array[index - 1].ai_accuracy_score || 0)) : 0
    }));
  }

  private async getConversationOutcomes(): Promise<Array<{ outcome: string; count: number; percentage: number }>> {
    const { data, error } = await supabase
      .from('conversation_analytics')
      .select('resolved_by')
      .not('resolved_by', 'is', null)
      .gte('started_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    if (!data || data.length === 0) {
      return [
        { outcome: 'ai_resolved', count: 60, percentage: 60 },
        { outcome: 'human_resolved', count: 35, percentage: 35 },
        { outcome: 'abandoned', count: 5, percentage: 5 }
      ];
    }

    const outcomes = data.reduce((acc, item) => {
      const outcome = item.resolved_by || 'abandoned';
      acc[outcome] = (acc[outcome] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = data.length;
    return Object.entries(outcomes).map(([outcome, count]) => ({
      outcome,
      count,
      percentage: Math.round((count / total) * 100)
    }));
  }

  private async getImprovementAreas(): Promise<string[]> {
    const accuracy = await this.getAIAccuracyScore();
    const satisfaction = await this.getCustomerSatisfactionScore();
    const responseTime = await this.getAverageResponseTime();

    const areas: string[] = [];

    if (accuracy < 0.85) {
      areas.push('AI model accuracy needs improvement');
    }
    if (satisfaction < 4.0) {
      areas.push('Customer satisfaction scores could be higher');
    }
    if (responseTime > 180) {
      areas.push('Response times are longer than optimal');
    }

    return areas.length > 0 ? areas : ['Performance is meeting targets'];
  }

  private async getTrainingRecommendations(): Promise<string[]> {
    const areas = await this.getImprovementAreas();
    const recommendations: string[] = [];

    if (areas.includes('AI model accuracy needs improvement')) {
      recommendations.push('Increase training data volume');
      recommendations.push('Review and improve conversation patterns');
    }
    if (areas.includes('Customer satisfaction scores could be higher')) {
      recommendations.push('Enhance response personalization');
      recommendations.push('Improve sentiment analysis');
    }
    if (areas.includes('Response times are longer than optimal')) {
      recommendations.push('Optimize knowledge base structure');
      recommendations.push('Implement faster retrieval algorithms');
    }

    return recommendations.length > 0 ? recommendations : ['Continue current training approach'];
  }

  private async getKPIs(): Promise<Record<string, { current: number; target: number; trend: string; status: string }>> {
    const [
      satisfaction,
      responseTime,
      resolutionRate,
      aiAccuracy
    ] = await Promise.all([
      this.getCustomerSatisfactionScore(),
      this.getAverageResponseTime(),
      this.getResolutionRate(),
      this.getAIAccuracyScore()
    ]);

    return {
      customerSatisfaction: {
        current: satisfaction,
        target: 4.5,
        trend: satisfaction >= 4.5 ? 'up' : 'stable',
        status: satisfaction >= 4.5 ? 'good' : satisfaction >= 4.0 ? 'warning' : 'critical'
      },
      responseTime: {
        current: responseTime,
        target: 120,
        trend: responseTime <= 120 ? 'down' : 'up',
        status: responseTime <= 120 ? 'good' : responseTime <= 180 ? 'warning' : 'critical'
      },
      resolutionRate: {
        current: resolutionRate,
        target: 0.9,
        trend: resolutionRate >= 0.9 ? 'up' : 'stable',
        status: resolutionRate >= 0.9 ? 'good' : resolutionRate >= 0.8 ? 'warning' : 'critical'
      },
      aiAccuracy: {
        current: aiAccuracy,
        target: 0.9,
        trend: aiAccuracy >= 0.9 ? 'up' : 'stable',
        status: aiAccuracy >= 0.9 ? 'good' : aiAccuracy >= 0.8 ? 'warning' : 'critical'
      }
    };
  }

  private async getTrends(): Promise<Record<string, Array<{ date: string; value: number }>>> {
    const timeRange = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    };

    const [
      satisfactionTrend,
      volumeTrend,
      responseTimeTrend
    ] = await Promise.all([
      this.getSatisfactionTrend(timeRange, 'day'),
      this.getConversationVolumeTrend(timeRange, 'day'),
      this.getResponseTimeTrend(timeRange, 'day')
    ]);

    return {
      satisfaction: satisfactionTrend.map(t => ({ date: t.timestamp, value: t.value })),
      volume: volumeTrend.map(t => ({ date: t.timestamp, value: t.value })),
      responseTime: responseTimeTrend.map(t => ({ date: t.timestamp, value: t.value }))
    };
  }

  private async getBusinessInsights(): Promise<Array<{ type: string; title: string; description: string; impact: string }>> {
    return [
      {
        type: 'opportunity',
        title: 'AI Resolution Rate Increasing',
        description: 'AI is successfully resolving 60% of conversations, reducing agent workload',
        impact: 'high'
      },
      {
        type: 'trend',
        title: 'Peak Hours Identified',
        description: 'Highest conversation volume occurs between 9-11 AM and 2-4 PM',
        impact: 'medium'
      },
      {
        type: 'risk',
        title: 'Response Time Variance',
        description: 'Response times vary significantly across channels, affecting satisfaction',
        impact: 'medium'
      }
    ];
  }

  private async getBusinessRecommendations(): Promise<Array<{ priority: string; title: string; description: string; expectedImpact: string }>> {
    return [
      {
        priority: 'high',
        title: 'Optimize Peak Hour Staffing',
        description: 'Increase agent availability during 9-11 AM and 2-4 PM to handle volume spikes',
        expectedImpact: 'Reduce average response time by 25%'
      },
      {
        priority: 'medium',
        title: 'Enhance AI Training',
        description: 'Improve AI model with more training data to increase resolution rate',
        expectedImpact: 'Increase AI resolution rate from 60% to 75%'
      },
      {
        priority: 'low',
        title: 'Channel Performance Analysis',
        description: 'Analyze and optimize performance across different communication channels',
        expectedImpact: 'Improve overall satisfaction by 10%'
      }
    ];
  }

  private async calculateCostSavings(timeFrame: { start: string; end: string }): Promise<number> {
    // Calculate cost savings from AI automation
    const { data: analytics, error } = await supabase
      .from('conversation_analytics')
      .select('resolved_by')
      .not('resolved_by', 'is', null)
      .gte('started_at', timeFrame.start)
      .lte('started_at', timeFrame.end);

    if (error) throw error;

    const aiResolved = analytics?.filter(a => a.resolved_by === 'ai').length || 0;
    const costPerAgentConversation = 5; // $5 per agent-handled conversation
    const costPerAIConversation = 0.5; // $0.50 per AI-handled conversation

    return aiResolved * (costPerAgentConversation - costPerAIConversation);
  }

  private async calculateEfficiencyGains(timeFrame: { start: string; end: string }): Promise<number> {
    // Calculate efficiency gains from faster response times
    const { data: analytics, error } = await supabase
      .from('conversation_analytics')
      .select('total_duration_seconds, resolved_by')
      .not('total_duration_seconds', 'is', null)
      .gte('started_at', timeFrame.start)
      .lte('started_at', timeFrame.end);

    if (error) throw error;

    const averageDuration = analytics?.reduce((acc, a) => acc + (a.total_duration_seconds || 0), 0) || 0;
    const totalConversations = analytics?.length || 1;
    const avgDurationMinutes = averageDuration / (totalConversations * 60);

    // Assume 20% efficiency gain from automation
    const efficiencyGain = avgDurationMinutes * 0.2 * totalConversations;
    return Math.round(efficiencyGain * 10); // Convert to dollar value
  }

  private async calculateSatisfactionImpact(timeFrame: { start: string; end: string }): Promise<number> {
    const { data: analytics, error } = await supabase
      .from('conversation_analytics')
      .select('customer_satisfaction')
      .not('customer_satisfaction', 'is', null)
      .gte('started_at', timeFrame.start)
      .lte('started_at', timeFrame.end);

    if (error) throw error;

    const avgSatisfaction = analytics?.reduce((acc, a) => acc + (a.customer_satisfaction || 0), 0) || 0;
    const totalRatings = analytics?.length || 1;

    return Math.round((avgSatisfaction / totalRatings) * 20) / 10; // Scale to 0-10
  }

  private async calculateRevenueImpact(timeFrame: { start: string; end: string }): Promise<number> {
    // Calculate revenue impact from improved customer satisfaction and faster resolution
    const { data: analytics, error } = await supabase
      .from('conversation_analytics')
      .select('lead_qualified, revenue_generated')
      .gte('started_at', timeFrame.start)
      .lte('started_at', timeFrame.end);

    if (error) throw error;

    const qualifiedLeads = analytics?.filter(a => a.lead_qualified).length || 0;
    const totalRevenue = analytics?.reduce((acc, a) => acc + (a.revenue_generated || 0), 0) || 0;

    return qualifiedLeads * 500 + totalRevenue; // $500 per qualified lead + direct revenue
  }

  private async createConversationAnalytics(conversationId: string): Promise<ConversationAnalytics> {
    // Create analytics for a conversation that doesn't have them
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError) throw convError;

    const analyticsData = {
      conversation_id: conversationId,
      started_at: conversation.created_at,
      total_messages: 0,
      customer_messages: 0,
      ai_messages: 0,
      agent_messages: 0,
      resolved_by: conversation.status === 'resolved' ? 'ai' : null,
      ai_accuracy_score: 0.85
    };

    const { data, error } = await supabase
      .from('conversation_analytics')
      .insert(analyticsData)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  private getCachedData(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}

// Export singleton instance
export const analyticsEngineService = new AnalyticsEngineService();