import { supabase } from '../supabaseClient';
import { format, subDays, addDays, startOfDay, endOfDay, differenceInDays } from 'date-fns';
import type { TimeRange } from '../../types/analytics';

export interface ForecastPoint {
  date: Date;
  predicted: number;
  confidence: number;
  upper: number;
  lower: number;
}

export interface AnomalyDetection {
  id: string;
  timestamp: Date;
  metric: string;
  value: number;
  expectedValue: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  description: string;
  impact: string;
  recommendation: string;
}

export interface SeasonalPattern {
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  pattern: number[];
  strength: number;
  confidence: number;
}

export interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable';
  strength: number;
  confidence: number;
  changeRate: number;
  significance: boolean;
}

export interface StaffingRecommendation {
  timeSlot: Date;
  recommendedAgents: number;
  currentAgents: number;
  expectedVolume: number;
  utilizationRate: number;
  costImpact: number;
  confidenceLevel: number;
}

export interface OptimizationInsight {
  id: string;
  category: 'staffing' | 'routing' | 'training' | 'process' | 'technology';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  roi: number;
  implementation: string;
  timeline: string;
  metrics: string[];
  confidence: number;
}

export interface CustomerSatisfactionPrediction {
  conversationId: string;
  predictedSatisfaction: number;
  confidence: number;
  factors: {
    responseTime: number;
    agentExperience: number;
    channelPreference: number;
    issueComplexity: number;
    timeOfDay: number;
  };
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface VolumeForecasting {
  date: Date;
  channel: string;
  predicted: number;
  confidence: number;
  factors: {
    historical: number;
    seasonal: number;
    trend: number;
    external: number;
  };
}

export class PredictiveAnalytics {
  private static instance: PredictiveAnalytics;

  private constructor() {}

  static getInstance(): PredictiveAnalytics {
    if (!PredictiveAnalytics.instance) {
      PredictiveAnalytics.instance = new PredictiveAnalytics();
    }
    return PredictiveAnalytics.instance;
  }

  // Conversation Volume Forecasting
  async forecastConversationVolume(
    timeRange: TimeRange,
    channel?: string,
    granularity: 'hour' | 'day' | 'week' = 'day'
  ): Promise<ForecastPoint[]> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      // Get historical data
      const { data: historicalData, error } = await supabase
        .from('daily_metrics')
        .select('date, total_conversations, channel_type')
        .gte('date', subDays(timeRange.start, 90).toISOString().split('T')[0])
        .lte('date', timeRange.end.toISOString().split('T')[0])
        .eq(channel ? 'channel_type' : 'channel_type', channel || 'all')
        .order('date', { ascending: true });

      if (error) throw error;

      // Implement time series forecasting
      const forecast = this.generateTimeSeriesForecast(historicalData || [], granularity);
      
      return forecast;
    } catch (error) {
      console.error('Error forecasting conversation volume:', error);
      throw error;
    }
  }

  // Staffing Needs Prediction
  async predictStaffingNeeds(
    timeRange: TimeRange,
    targetResponseTime: number = 60,
    targetUtilization: number = 0.8
  ): Promise<StaffingRecommendation[]> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      // Get historical conversation and agent data
      const { data: conversationData, error: convError } = await supabase
        .from('conversations')
        .select('created_at, assigned_agent_id, status')
        .gte('created_at', subDays(timeRange.start, 30).toISOString())
        .lte('created_at', timeRange.end.toISOString());

      if (convError) throw convError;

      const { data: agentData, error: agentError } = await supabase
        .from('agent_availability')
        .select('agent_id, working_hours, max_concurrent_chats')
        .eq('is_online', true);

      if (agentError) throw agentError;

      // Analyze patterns and generate recommendations
      const recommendations = this.generateStaffingRecommendations(
        conversationData || [],
        agentData || [],
        targetResponseTime,
        targetUtilization
      );

      return recommendations;
    } catch (error) {
      console.error('Error predicting staffing needs:', error);
      throw error;
    }
  }

  // Anomaly Detection
  async detectAnomalies(
    metric: string,
    timeRange: TimeRange,
    sensitivity: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<AnomalyDetection[]> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      // Get historical data for the metric
      const { data: historicalData, error } = await supabase
        .from('daily_metrics')
        .select(`date, ${metric}`)
        .gte('date', subDays(timeRange.start, 30).toISOString().split('T')[0])
        .lte('date', timeRange.end.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;

      // Implement anomaly detection algorithm
      const anomalies = this.detectStatisticalAnomalies(
        historicalData || [],
        metric,
        sensitivity
      );

      return anomalies;
    } catch (error) {
      console.error('Error detecting anomalies:', error);
      throw error;
    }
  }

  // Customer Satisfaction Prediction
  async predictCustomerSatisfaction(
    conversationId: string
  ): Promise<CustomerSatisfactionPrediction> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      // Get conversation details
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select(`
          id,
          created_at,
          channel_type,
          assigned_agent_id,
          status,
          customer_id,
          profiles!conversations_assigned_agent_id_fkey(full_name, role)
        `)
        .eq('id', conversationId)
        .single();

      if (convError) throw convError;

      // Get message history
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('created_at, sender_type, processing_time_ms')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (msgError) throw msgError;

      // Calculate prediction factors
      const factors = this.calculateSatisfactionFactors(
        conversation,
        messages || []
      );

      // Generate prediction
      const prediction = this.generateSatisfactionPrediction(factors);

      return {
        conversationId,
        predictedSatisfaction: prediction.score,
        confidence: prediction.confidence,
        factors: factors,
        riskLevel: prediction.riskLevel,
        recommendations: prediction.recommendations
      };
    } catch (error) {
      console.error('Error predicting customer satisfaction:', error);
      throw error;
    }
  }

  // Seasonal Pattern Analysis
  async analyzeSeasonalPatterns(
    metric: string,
    timeRange: TimeRange
  ): Promise<SeasonalPattern[]> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      // Get historical data
      const { data: historicalData, error } = await supabase
        .from('daily_metrics')
        .select(`date, ${metric}`)
        .gte('date', subDays(timeRange.start, 365).toISOString().split('T')[0])
        .lte('date', timeRange.end.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;

      // Analyze patterns
      const patterns = this.extractSeasonalPatterns(historicalData || [], metric);
      
      return patterns;
    } catch (error) {
      console.error('Error analyzing seasonal patterns:', error);
      throw error;
    }
  }

  // Optimization Recommendations
  async generateOptimizationRecommendations(
    category?: string
  ): Promise<OptimizationInsight[]> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      // Get recent performance data
      const { data: metricsData, error } = await supabase
        .from('daily_metrics')
        .select('*')
        .gte('date', subDays(new Date(), 30).toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;

      // Get conversation analytics
      const { data: conversationData, error: convError } = await supabase
        .from('conversation_analytics')
        .select('*')
        .gte('created_at', subDays(new Date(), 30).toISOString())
        .order('created_at', { ascending: true });

      if (convError) throw convError;

      // Generate insights
      const insights = this.analyzeOptimizationOpportunities(
        metricsData || [],
        conversationData || [],
        category
      );

      return insights;
    } catch (error) {
      console.error('Error generating optimization recommendations:', error);
      throw error;
    }
  }

  // Private helper methods
  private generateTimeSeriesForecast(
    data: any[],
    granularity: 'hour' | 'day' | 'week'
  ): ForecastPoint[] {
    if (data.length < 7) {
      throw new Error('Insufficient historical data for forecasting');
    }

    const forecast: ForecastPoint[] = [];
    const values = data.map(d => d.total_conversations || 0);
    
    // Simple moving average with trend
    const windowSize = Math.min(7, data.length);
    const recentValues = values.slice(-windowSize);
    const average = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
    
    // Calculate trend
    const trend = this.calculateTrend(values);
    
    // Generate forecast points
    for (let i = 1; i <= 14; i++) {
      const baseDate = new Date(data[data.length - 1].date);
      const forecastDate = addDays(baseDate, i);
      
      // Apply seasonal patterns (simplified)
      const seasonalFactor = this.getSeasonalFactor(forecastDate, granularity);
      const predicted = Math.max(0, average + (trend * i) * seasonalFactor);
      
      // Calculate confidence interval
      const confidence = Math.max(0.5, 1 - (i * 0.05));
      const variance = this.calculateVariance(values);
      const margin = Math.sqrt(variance) * (2 - confidence);
      
      forecast.push({
        date: forecastDate,
        predicted,
        confidence,
        upper: predicted + margin,
        lower: Math.max(0, predicted - margin)
      });
    }
    
    return forecast;
  }

  private generateStaffingRecommendations(
    conversationData: any[],
    agentData: any[],
    targetResponseTime: number,
    targetUtilization: number
  ): StaffingRecommendation[] {
    const recommendations: StaffingRecommendation[] = [];
    
    // Group conversations by hour
    const hourlyVolume = new Map<string, number>();
    conversationData.forEach(conv => {
      const hour = format(new Date(conv.created_at), 'yyyy-MM-dd HH:00');
      hourlyVolume.set(hour, (hourlyVolume.get(hour) || 0) + 1);
    });
    
    // Calculate average handling time
    const avgHandlingTime = 900; // 15 minutes (placeholder)
    const avgConcurrentChats = agentData.reduce((sum, agent) => 
      sum + (agent.max_concurrent_chats || 5), 0) / agentData.length;
    
    // Generate recommendations for next 24 hours
    for (let i = 0; i < 24; i++) {
      const timeSlot = addDays(new Date(), 1);
      timeSlot.setHours(i, 0, 0, 0);
      
      const hourKey = format(timeSlot, 'yyyy-MM-dd HH:00');
      const expectedVolume = hourlyVolume.get(hourKey) || 0;
      
      // Calculate required agents
      const requiredCapacity = expectedVolume * avgHandlingTime;
      const agentCapacity = avgConcurrentChats * 3600; // 1 hour in seconds
      const recommendedAgents = Math.ceil(requiredCapacity / (agentCapacity * targetUtilization));
      
      recommendations.push({
        timeSlot,
        recommendedAgents,
        currentAgents: agentData.length,
        expectedVolume,
        utilizationRate: targetUtilization,
        costImpact: (recommendedAgents - agentData.length) * 50, // $50/hour per agent
        confidenceLevel: 0.8
      });
    }
    
    return recommendations;
  }

  private detectStatisticalAnomalies(
    data: any[],
    metric: string,
    sensitivity: 'low' | 'medium' | 'high'
  ): AnomalyDetection[] {
    if (data.length < 7) return [];
    
    const anomalies: AnomalyDetection[] = [];
    const values = data.map(d => d[metric] || 0);
    
    // Calculate statistical thresholds
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = this.calculateVariance(values);
    const stdDev = Math.sqrt(variance);
    
    // Sensitivity multipliers
    const multipliers = {
      low: 3,
      medium: 2.5,
      high: 2
    };
    
    const threshold = multipliers[sensitivity] * stdDev;
    
    // Detect anomalies
    data.forEach((point, index) => {
      const value = point[metric] || 0;
      const deviation = Math.abs(value - mean);
      
      if (deviation > threshold) {
        const severity = deviation > threshold * 1.5 ? 'high' : 
                        deviation > threshold * 1.2 ? 'medium' : 'low';
        
        anomalies.push({
          id: `anomaly_${index}`,
          timestamp: new Date(point.date),
          metric,
          value,
          expectedValue: mean,
          deviation,
          severity,
          confidence: Math.min(0.95, deviation / (threshold * 2)),
          description: `${metric} value of ${value} is ${deviation.toFixed(2)} standard deviations from normal`,
          impact: this.getAnomalyImpact(metric, severity),
          recommendation: this.getAnomalyRecommendation(metric, severity)
        });
      }
    });
    
    return anomalies;
  }

  private calculateSatisfactionFactors(
    conversation: any,
    messages: any[]
  ): CustomerSatisfactionPrediction['factors'] {
    // Calculate response time factor
    const responseTimeScore = messages.length > 0 ? 
      Math.max(0, 1 - (messages[0].processing_time_ms || 0) / 60000) : 0.5;
    
    // Agent experience factor (placeholder)
    const agentExperienceScore = 0.8;
    
    // Channel preference factor
    const channelPreferenceScore = conversation.channel_type === 'whatsapp' ? 0.9 : 0.7;
    
    // Issue complexity factor (based on message count)
    const complexityScore = Math.max(0, 1 - (messages.length - 5) / 20);
    
    // Time of day factor
    const hour = new Date(conversation.created_at).getHours();
    const timeOfDayScore = hour >= 9 && hour <= 17 ? 0.9 : 0.6;
    
    return {
      responseTime: responseTimeScore,
      agentExperience: agentExperienceScore,
      channelPreference: channelPreferenceScore,
      issueComplexity: complexityScore,
      timeOfDay: timeOfDayScore
    };
  }

  private generateSatisfactionPrediction(factors: CustomerSatisfactionPrediction['factors']) {
    // Weighted average of factors
    const weights = {
      responseTime: 0.3,
      agentExperience: 0.25,
      channelPreference: 0.2,
      issueComplexity: 0.15,
      timeOfDay: 0.1
    };
    
    const score = Object.entries(factors).reduce((sum, [key, value]) => {
      return sum + (value * weights[key as keyof typeof weights]);
    }, 0) * 5; // Scale to 1-5
    
    const confidence = Math.min(0.95, Math.max(0.6, score / 5));
    
    const riskLevel = score < 3 ? 'high' : score < 4 ? 'medium' : 'low';
    
    const recommendations = this.generateSatisfactionRecommendations(factors, riskLevel);
    
    return { score, confidence, riskLevel, recommendations };
  }

  private generateSatisfactionRecommendations(
    factors: CustomerSatisfactionPrediction['factors'],
    riskLevel: string
  ): string[] {
    const recommendations: string[] = [];
    
    if (factors.responseTime < 0.7) {
      recommendations.push('Prioritize faster response times');
    }
    
    if (factors.agentExperience < 0.7) {
      recommendations.push('Assign to more experienced agent');
    }
    
    if (factors.channelPreference < 0.7) {
      recommendations.push('Offer preferred communication channel');
    }
    
    if (factors.issueComplexity < 0.5) {
      recommendations.push('Prepare for complex issue resolution');
    }
    
    if (riskLevel === 'high') {
      recommendations.push('Implement proactive satisfaction measures');
    }
    
    return recommendations;
  }

  private extractSeasonalPatterns(data: any[], metric: string): SeasonalPattern[] {
    const patterns: SeasonalPattern[] = [];
    
    if (data.length < 30) return patterns;
    
    // Weekly pattern
    const weeklyPattern = new Array(7).fill(0);
    const weeklyCounts = new Array(7).fill(0);
    
    data.forEach(point => {
      const date = new Date(point.date);
      const dayOfWeek = date.getDay();
      const value = point[metric] || 0;
      
      weeklyPattern[dayOfWeek] += value;
      weeklyCounts[dayOfWeek]++;
    });
    
    // Calculate averages
    const weeklyAverage = weeklyPattern.map((sum, i) => 
      weeklyCounts[i] > 0 ? sum / weeklyCounts[i] : 0
    );
    
    // Calculate pattern strength
    const overallAverage = weeklyAverage.reduce((sum, val) => sum + val, 0) / 7;
    const variance = weeklyAverage.reduce((sum, val) => sum + Math.pow(val - overallAverage, 2), 0) / 7;
    const strength = Math.sqrt(variance) / overallAverage;
    
    patterns.push({
      period: 'weekly',
      pattern: weeklyAverage,
      strength,
      confidence: Math.min(0.95, data.length / 30)
    });
    
    return patterns;
  }

  private analyzeOptimizationOpportunities(
    metricsData: any[],
    conversationData: any[],
    category?: string
  ): OptimizationInsight[] {
    const insights: OptimizationInsight[] = [];
    
    // Response time optimization
    const avgResponseTime = metricsData.reduce((sum, d) => 
      sum + (d.avg_first_response_time_seconds || 0), 0) / metricsData.length;
    
    if (avgResponseTime > 60) {
      insights.push({
        id: 'response_time_optimization',
        category: 'process',
        title: 'Optimize Response Times',
        description: `Average response time is ${avgResponseTime.toFixed(1)}s. Consider implementing automated responses.`,
        impact: 'high',
        effort: 'medium',
        roi: 150,
        implementation: 'Deploy chatbot for common queries',
        timeline: '2-4 weeks',
        metrics: ['avg_first_response_time_seconds'],
        confidence: 0.85
      });
    }
    
    // AI resolution optimization
    const avgAIResolution = metricsData.reduce((sum, d) => 
      sum + (d.ai_resolved_conversations || 0), 0) / metricsData.reduce((sum, d) => 
      sum + (d.total_conversations || 0), 0);
    
    if (avgAIResolution < 0.6) {
      insights.push({
        id: 'ai_resolution_optimization',
        category: 'technology',
        title: 'Improve AI Resolution Rate',
        description: `AI resolves only ${(avgAIResolution * 100).toFixed(1)}% of conversations. Enhance knowledge base.`,
        impact: 'high',
        effort: 'high',
        roi: 200,
        implementation: 'Expand knowledge base and improve AI training',
        timeline: '4-8 weeks',
        metrics: ['ai_resolved_conversations', 'handoff_rate'],
        confidence: 0.9
      });
    }
    
    // Filter by category if specified
    return category ? insights.filter(insight => insight.category === category) : insights;
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + (val * i), 0);
    const sumXX = values.reduce((sum, _, i) => sum + (i * i), 0);
    
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  private getSeasonalFactor(date: Date, granularity: 'hour' | 'day' | 'week'): number {
    // Simple seasonal factors (can be enhanced with real data)
    const dayOfWeek = date.getDay();
    const hour = date.getHours();
    
    if (granularity === 'hour') {
      // Higher activity during business hours
      return hour >= 9 && hour <= 17 ? 1.2 : 0.8;
    } else if (granularity === 'day') {
      // Higher activity on weekdays
      return dayOfWeek >= 1 && dayOfWeek <= 5 ? 1.1 : 0.9;
    }
    
    return 1.0;
  }

  private getAnomalyImpact(metric: string, severity: string): string {
    const impacts = {
      total_conversations: 'May indicate unusual traffic patterns or system issues',
      avg_first_response_time_seconds: 'Could affect customer satisfaction and service quality',
      avg_satisfaction_score: 'Direct impact on customer experience and retention',
      ai_resolved_conversations: 'May indicate AI performance issues or knowledge gaps'
    };
    
    return impacts[metric as keyof typeof impacts] || 'Requires investigation';
  }

  private getAnomalyRecommendation(metric: string, severity: string): string {
    const recommendations = {
      total_conversations: 'Monitor system capacity and investigate traffic sources',
      avg_first_response_time_seconds: 'Review agent availability and routing rules',
      avg_satisfaction_score: 'Analyze customer feedback and agent performance',
      ai_resolved_conversations: 'Review AI training data and knowledge base coverage'
    };
    
    return recommendations[metric as keyof typeof recommendations] || 'Investigate root cause';
  }
}