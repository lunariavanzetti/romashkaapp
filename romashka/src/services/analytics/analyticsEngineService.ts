import { supabase } from '../supabaseClient';
import { securityMonitoringService } from '../security/securityMonitoringService';
import type { 
  LiveMetrics,
  ConversationAnalytics,
  PerformanceMetrics,
  TimeRange,
  TimeSeries,
  ChannelMetrics,
  ChannelActivity,
  VolumePredict,
  VolumeForcast,
  StaffingPrediction,
  PerformanceForecast,
  SeasonalPattern,
  OptimizationSuggestion,
  BusinessInsight,
  RealTimeMetrics,
  ConversationSummary,
  AgentMetrics,
  LiveAlert,
  PredictiveInsight
} from '../../types/analytics';

export class AnalyticsEngineService {
  private static instance: AnalyticsEngineService;
  private updateInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  public static getInstance(): AnalyticsEngineService {
    if (!AnalyticsEngineService.instance) {
      AnalyticsEngineService.instance = new AnalyticsEngineService();
    }
    return AnalyticsEngineService.instance;
  }

  constructor() {
    this.startRealTimeUpdates();
  }

  // ================================
  // REAL-TIME ANALYTICS
  // ================================

  async getRealtimeAnalytics(): Promise<{
    activeConversations: number;
    averageResponseTime: number;
    resolutionRate: number;
    customerSatisfaction: number;
    aiPerformanceScore: number;
    channelDistribution: ChannelMetrics[];
  }> {
    try {
      const [
        activeConversations,
        avgResponseTime,
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

      return {
        activeConversations,
        averageResponseTime: avgResponseTime,
        resolutionRate,
        customerSatisfaction,
        aiPerformanceScore,
        channelDistribution
      };

    } catch (error) {
      console.error('Error getting realtime analytics:', error);
      throw error;
    }
  }

  async getLiveMetrics(): Promise<LiveMetrics> {
    try {
      const [
        activeConversations,
        avgResponseTime,
        satisfactionScore,
        aiResolutionRate,
        agentProductivity,
        queueLength
      ] = await Promise.all([
        this.getActiveConversationsCount(),
        this.getAverageResponseTime(),
        this.getCustomerSatisfactionScore(),
        this.getAIResolutionRate(),
        this.getAgentProductivity(),
        this.getQueueLength()
      ]);

      return {
        activeConversations,
        avgResponseTime,
        satisfactionScore,
        aiResolutionRate,
        agentProductivity,
        queueLength,
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error getting live metrics:', error);
      throw error;
    }
  }

  // ================================
  // HISTORICAL ANALYTICS
  // ================================

  async getHistoricalAnalytics(
    timeRange: TimeRange,
    granularity: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<{
    conversationVolume: TimeSeries[];
    responseTimesTrend: TimeSeries[];
    satisfactionTrend: TimeSeries[];
    resolutionRateTrend: TimeSeries[];
    channelPerformance: ChannelActivity[];
  }> {
    try {
      const [
        conversationVolume,
        responseTimesTrend,
        satisfactionTrend,
        resolutionRateTrend,
        channelPerformance
      ] = await Promise.all([
        this.getConversationVolumeTrend(timeRange, granularity),
        this.getResponseTimesTrend(timeRange, granularity),
        this.getSatisfactionTrend(timeRange, granularity),
        this.getResolutionRateTrend(timeRange, granularity),
        this.getChannelPerformanceTrend(timeRange)
      ]);

      return {
        conversationVolume,
        responseTimesTrend,
        satisfactionTrend,
        resolutionRateTrend,
        channelPerformance
      };

    } catch (error) {
      console.error('Error getting historical analytics:', error);
      throw error;
    }
  }

  // ================================
  // PREDICTIVE ANALYTICS
  // ================================

  async getPredictiveAnalytics(): Promise<{
    volumeForecast: VolumePredict[];
    staffingRecommendations: StaffingPrediction[];
    performancePredictions: PerformanceForecast[];
    seasonalityPatterns: SeasonalPattern[];
  }> {
    try {
      const [
        volumeForecast,
        staffingRecommendations,
        performancePredictions,
        seasonalityPatterns
      ] = await Promise.all([
        this.forecastConversationVolume(),
        this.calculateStaffingNeeds(),
        this.predictPerformanceMetrics(),
        this.detectSeasonalPatterns()
      ]);

      return {
        volumeForecast,
        staffingRecommendations,
        performancePredictions,
        seasonalityPatterns
      };

    } catch (error) {
      console.error('Error getting predictive analytics:', error);
      throw error;
    }
  }

  // ================================
  // AI PERFORMANCE ANALYTICS
  // ================================

  async getAIPerformanceMetrics(): Promise<{
    accuracyScore: number;
    learningProgress: any[];
    conversationOutcomes: any[];
    improvementAreas: string[];
    trainingRecommendations: string[];
  }> {
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

      return {
        accuracyScore,
        learningProgress,
        conversationOutcomes,
        improvementAreas,
        trainingRecommendations
      };

    } catch (error) {
      console.error('Error getting AI performance metrics:', error);
      throw error;
    }
  }

  // ================================
  // CONVERSATION TRACKING
  // ================================

  async trackConversationAnalytics(analytics: ConversationAnalytics): Promise<void> {
    try {
      const { error } = await supabase
        .from('conversation_analytics')
        .insert([{
          conversation_id: analytics.conversationId,
          channel_type: analytics.channelType,
          start_time: analytics.startTime.toISOString(),
          end_time: analytics.endTime?.toISOString(),
          message_count: analytics.messageCount,
          avg_response_time_seconds: Math.round(analytics.responseTime.reduce((a, b) => a + b, 0) / analytics.responseTime.length),
          resolution_status: analytics.resolutionStatus,
          customer_satisfaction: analytics.customerSatisfaction,
          ai_accuracy_score: analytics.aiAccuracy,
          topics: analytics.topics,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      // Update real-time metrics
      await this.updateRealTimeMetrics();

    } catch (error) {
      console.error('Error tracking conversation analytics:', error);
      throw error;
    }
  }

  // ================================
  // BUSINESS INTELLIGENCE
  // ================================

  async getBusinessInsights(): Promise<BusinessInsight[]> {
    try {
      const insights: BusinessInsight[] = [];

      // Check for performance trends
      const recentMetrics = await this.getRecentPerformanceMetrics();
      if (recentMetrics.length > 0) {
        const avgSatisfaction = recentMetrics.reduce((sum, m) => sum + m.satisfaction, 0) / recentMetrics.length;
        
        if (avgSatisfaction > 4.0) {
          insights.push({
            type: 'opportunity',
            title: 'High Customer Satisfaction',
            description: `Customer satisfaction is at ${avgSatisfaction.toFixed(1)}/5.0, indicating excellent service quality`,
            impact: 'high',
            actionRequired: false
          });
        }

        if (avgSatisfaction < 3.0) {
          insights.push({
            type: 'risk',
            title: 'Low Customer Satisfaction',
            description: `Customer satisfaction has dropped to ${avgSatisfaction.toFixed(1)}/5.0, requiring immediate attention`,
            impact: 'high',
            actionRequired: true
          });
        }
      }

      // Check for volume trends
      const volumeTrend = await this.getConversationVolumeTrend({ 
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 
        end: new Date() 
      }, 'day');

      if (volumeTrend.length >= 2) {
        const recentVolume = volumeTrend[volumeTrend.length - 1].value;
        const previousVolume = volumeTrend[volumeTrend.length - 2].value;
        const growthRate = ((recentVolume - previousVolume) / previousVolume) * 100;

        if (growthRate > 20) {
          insights.push({
            type: 'trend',
            title: 'Conversation Volume Surge',
            description: `Conversation volume has increased by ${growthRate.toFixed(1)}% in the last day`,
            impact: 'medium',
            actionRequired: true
          });
        }
      }

      return insights;

    } catch (error) {
      console.error('Error getting business insights:', error);
      return [];
    }
  }

  async getOptimizationSuggestions(): Promise<OptimizationSuggestion[]> {
    try {
      const suggestions: OptimizationSuggestion[] = [];

      // Analyze response time optimization
      const avgResponseTime = await this.getAverageResponseTime();
      if (avgResponseTime > 300) { // 5 minutes
        suggestions.push({
          area: 'response_time',
          currentPerformance: avgResponseTime,
          potentialImprovement: 180, // 3 minutes
          actionItems: [
            'Implement canned responses for common questions',
            'Optimize AI model for faster processing',
            'Add more agents during peak hours'
          ],
          implementationEffort: 'medium',
          expectedROI: 25
        });
      }

      // Analyze AI accuracy optimization
      const aiAccuracy = await this.getAIAccuracyScore();
      if (aiAccuracy < 0.8) {
        suggestions.push({
          area: 'ai_accuracy',
          currentPerformance: aiAccuracy,
          potentialImprovement: 0.9,
          actionItems: [
            'Retrain AI model with recent conversation data',
            'Expand knowledge base content',
            'Implement feedback loop for AI responses'
          ],
          implementationEffort: 'high',
          expectedROI: 35
        });
      }

      return suggestions;

    } catch (error) {
      console.error('Error getting optimization suggestions:', error);
      return [];
    }
  }

  // ================================
  // PRIVATE METHODS
  // ================================

  private async startRealTimeUpdates(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.updateInterval = setInterval(async () => {
      try {
        await this.updateRealTimeMetrics();
      } catch (error) {
        console.error('Error updating real-time metrics:', error);
      }
    }, 30000); // Update every 30 seconds
  }

  private async updateRealTimeMetrics(): Promise<void> {
    try {
      const metrics = await this.getLiveMetrics();
      
      // Store in realtime_metrics table
      await supabase
        .from('realtime_metrics')
        .insert([{
          timestamp: new Date().toISOString(),
          active_conversations: metrics.activeConversations,
          response_time: metrics.avgResponseTime,
          satisfaction: metrics.satisfactionScore,
          ai_resolution: metrics.aiResolutionRate,
          queue_length: metrics.queueLength,
          agent_utilization: metrics.agentProductivity
        }]);

      // Store in performance_metrics table
      await supabase
        .from('performance_metrics')
        .insert([
          { metric_type: 'active_conversations', metric_value: metrics.activeConversations },
          { metric_type: 'avg_response_time', metric_value: metrics.avgResponseTime },
          { metric_type: 'customer_satisfaction', metric_value: metrics.satisfactionScore },
          { metric_type: 'ai_resolution_rate', metric_value: metrics.aiResolutionRate },
          { metric_type: 'agent_productivity', metric_value: metrics.agentProductivity }
        ]);

    } catch (error) {
      console.error('Error updating real-time metrics:', error);
    }
  }

  private async getActiveConversationsCount(): Promise<number> {
    const { count } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');
    
    return count || 0;
  }

  private async getAverageResponseTime(): Promise<number> {
    const { data } = await supabase
      .from('conversation_analytics')
      .select('avg_response_time_seconds')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (!data || data.length === 0) return 120; // Default 2 minutes

    const avgTime = data.reduce((sum, item) => sum + (item.avg_response_time_seconds || 0), 0) / data.length;
    return Math.round(avgTime);
  }

  private async getResolutionRate(): Promise<number> {
    const { data } = await supabase
      .from('conversation_analytics')
      .select('resolution_status')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (!data || data.length === 0) return 0.85; // Default 85%

    const resolvedCount = data.filter(item => item.resolution_status === 'resolved').length;
    return resolvedCount / data.length;
  }

  private async getCustomerSatisfactionScore(): Promise<number> {
    const { data } = await supabase
      .from('conversation_analytics')
      .select('customer_satisfaction')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .not('customer_satisfaction', 'is', null);

    if (!data || data.length === 0) return 4.2; // Default 4.2/5

    const avgSatisfaction = data.reduce((sum, item) => sum + (item.customer_satisfaction || 0), 0) / data.length;
    return Math.round(avgSatisfaction * 10) / 10;
  }

  private async getAIPerformanceScore(): Promise<number> {
    const { data } = await supabase
      .from('conversation_analytics')
      .select('ai_accuracy_score')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .not('ai_accuracy_score', 'is', null);

    if (!data || data.length === 0) return 0.85; // Default 85%

    const avgAccuracy = data.reduce((sum, item) => sum + (item.ai_accuracy_score || 0), 0) / data.length;
    return Math.round(avgAccuracy * 100) / 100;
  }

  private async getChannelDistribution(): Promise<ChannelMetrics[]> {
    const { data } = await supabase
      .from('conversation_analytics')
      .select('channel_type')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (!data || data.length === 0) {
      return [
        { channel: 'whatsapp', count: 15, percentage: 45 },
        { channel: 'email', count: 12, percentage: 36 },
        { channel: 'widget', count: 6, percentage: 19 }
      ];
    }

    const channelCounts = data.reduce((acc, item) => {
      const channel = item.channel_type || 'unknown';
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

  private async getAIResolutionRate(): Promise<number> {
    const { data } = await supabase
      .from('conversation_analytics')
      .select('resolution_status')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (!data || data.length === 0) return 0.78; // Default 78%

    const aiResolvedCount = data.filter(item => 
      item.resolution_status === 'resolved' || item.resolution_status === 'ai_resolved'
    ).length;
    
    return aiResolvedCount / data.length;
  }

  private async getAgentProductivity(): Promise<number> {
    // This would calculate based on active agents and their conversation load
    return 0.82; // Default 82% productivity
  }

  private async getQueueLength(): Promise<number> {
    const { count } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    
    return count || 0;
  }

  private async getConversationVolumeTrend(timeRange: TimeRange, granularity: string): Promise<TimeSeries[]> {
    const { data } = await supabase
      .from('daily_analytics')
      .select('date, total_conversations')
      .gte('date', timeRange.start.toISOString().split('T')[0])
      .lte('date', timeRange.end.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (!data || data.length === 0) {
      // Return sample data if no data exists
      return this.generateSampleTimeSeries(timeRange, granularity);
    }

    return data.map(item => ({
      timestamp: new Date(item.date).toISOString(),
      value: item.total_conversations
    }));
  }

  private async getResponseTimesTrend(timeRange: TimeRange, granularity: string): Promise<TimeSeries[]> {
    const { data } = await supabase
      .from('daily_analytics')
      .select('date, avg_response_time_seconds')
      .gte('date', timeRange.start.toISOString().split('T')[0])
      .lte('date', timeRange.end.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (!data || data.length === 0) {
      return this.generateSampleTimeSeries(timeRange, granularity, 120);
    }

    return data.map(item => ({
      timestamp: new Date(item.date).toISOString(),
      value: item.avg_response_time_seconds
    }));
  }

  private async getSatisfactionTrend(timeRange: TimeRange, granularity: string): Promise<TimeSeries[]> {
    const { data } = await supabase
      .from('daily_analytics')
      .select('date, avg_customer_satisfaction')
      .gte('date', timeRange.start.toISOString().split('T')[0])
      .lte('date', timeRange.end.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (!data || data.length === 0) {
      return this.generateSampleTimeSeries(timeRange, granularity, 4.2);
    }

    return data.map(item => ({
      timestamp: new Date(item.date).toISOString(),
      value: item.avg_customer_satisfaction
    }));
  }

  private async getResolutionRateTrend(timeRange: TimeRange, granularity: string): Promise<TimeSeries[]> {
    const { data } = await supabase
      .from('daily_analytics')
      .select('date, resolution_rate')
      .gte('date', timeRange.start.toISOString().split('T')[0])
      .lte('date', timeRange.end.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (!data || data.length === 0) {
      return this.generateSampleTimeSeries(timeRange, granularity, 0.85);
    }

    return data.map(item => ({
      timestamp: new Date(item.date).toISOString(),
      value: item.resolution_rate
    }));
  }

  private async getChannelPerformanceTrend(timeRange: TimeRange): Promise<ChannelActivity[]> {
    const { data } = await supabase
      .from('daily_analytics')
      .select('date, channel_distribution')
      .gte('date', timeRange.start.toISOString().split('T')[0])
      .lte('date', timeRange.end.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (!data || data.length === 0) {
      return [
        { channel: 'whatsapp', activity: 75, trend: 'up' },
        { channel: 'email', activity: 60, trend: 'stable' },
        { channel: 'widget', activity: 45, trend: 'down' }
      ];
    }

    // Process channel distribution data
    const channelData = data.reduce((acc, item) => {
      const distribution = item.channel_distribution || {};
      Object.entries(distribution).forEach(([channel, count]) => {
        if (!acc[channel]) acc[channel] = [];
        acc[channel].push(count as number);
      });
      return acc;
    }, {} as Record<string, number[]>);

    return Object.entries(channelData).map(([channel, counts]) => ({
      channel,
      activity: counts.reduce((sum, count) => sum + count, 0),
      trend: counts.length > 1 && counts[counts.length - 1] > counts[counts.length - 2] ? 'up' : 
             counts.length > 1 && counts[counts.length - 1] < counts[counts.length - 2] ? 'down' : 'stable'
    }));
  }

  private generateSampleTimeSeries(timeRange: TimeRange, granularity: string, baseValue: number = 50): TimeSeries[] {
    const timeSeries: TimeSeries[] = [];
    const start = new Date(timeRange.start);
    const end = new Date(timeRange.end);
    const duration = end.getTime() - start.getTime();
    const points = Math.min(30, Math.max(7, Math.floor(duration / (24 * 60 * 60 * 1000))));

    for (let i = 0; i < points; i++) {
      const timestamp = new Date(start.getTime() + (i * duration) / points);
      const variation = (Math.random() - 0.5) * 0.2; // ±10% variation
      const value = baseValue * (1 + variation);
      
      timeSeries.push({
        timestamp: timestamp.toISOString(),
        value: Math.round(value * 100) / 100
      });
    }

    return timeSeries;
  }

  // Additional private methods for predictive analytics
  private async forecastConversationVolume(): Promise<VolumePredict[]> {
    const historicalData = await this.getConversationVolumeTrend({
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date()
    }, 'day');

    // Simple linear regression for forecasting
    const forecast: VolumePredict[] = [];
    const avgGrowth = historicalData.length > 1 ? 
      (historicalData[historicalData.length - 1].value - historicalData[0].value) / historicalData.length : 0;

    for (let i = 1; i <= 14; i++) {
      const forecastDate = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
      const predictedValue = historicalData[historicalData.length - 1]?.value || 50;
      
      forecast.push({
        date: forecastDate,
        predictedVolume: Math.max(0, Math.round(predictedValue + avgGrowth * i)),
        confidence: Math.max(0.5, 0.9 - (i * 0.05)),
        seasonalAdjustment: 1.0
      });
    }

    return forecast;
  }

  private async calculateStaffingNeeds(): Promise<StaffingPrediction[]> {
    return [{
      date: new Date(Date.now() + 24 * 60 * 60 * 1000),
      requiredAgents: 3,
      currentAgents: 2,
      confidenceLevel: 0.85,
      peakHours: ['09:00', '14:00', '18:00']
    }];
  }

  private async predictPerformanceMetrics(): Promise<PerformanceForecast[]> {
    return [{
      metric: 'customer_satisfaction',
      currentValue: 4.2,
      predictedValue: 4.3,
      confidence: 0.8,
      timeframe: '7_days'
    }];
  }

  private async detectSeasonalPatterns(): Promise<SeasonalPattern[]> {
    return [{
      pattern: 'weekly',
      description: 'Higher conversation volume on Mondays and Fridays',
      confidence: 0.85,
      impact: 'medium'
    }];
  }

  private async getAIAccuracyScore(): Promise<number> {
    return 0.85; // Default 85% accuracy
  }

  private async getLearningProgress(): Promise<any[]> {
    return [];
  }

  private async getConversationOutcomes(): Promise<any[]> {
    return [];
  }

  private async getImprovementAreas(): Promise<string[]> {
    return ['Response time optimization', 'Knowledge base expansion'];
  }

  private async getTrainingRecommendations(): Promise<string[]> {
    return ['Update FAQ responses', 'Add seasonal content'];
  }

  private async getRecentPerformanceMetrics(): Promise<any[]> {
    const { data } = await supabase
      .from('realtime_metrics')
      .select('*')
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false })
      .limit(50);

    return data || [];
  }

  // ================================
  // CLEANUP
  // ================================

  public stopUpdates(): void {
    this.isRunning = false;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}

export const analyticsEngine = AnalyticsEngineService.getInstance();