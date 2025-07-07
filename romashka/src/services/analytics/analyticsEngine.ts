import { supabase } from '../supabaseClient';
import type { 
  AnalyticsQuery, 
  AnalyticsResult, 
  TrendPoint, 
  RankingResult, 
  ComparisonResult, 
  Anomaly, 
  Insight,
  TimeRange,
  Granularity
} from '../../types/analytics';

export class AnalyticsEngine {
  private static instance: AnalyticsEngine;

  private constructor() {}

  static getInstance(): AnalyticsEngine {
    if (!AnalyticsEngine.instance) {
      AnalyticsEngine.instance = new AnalyticsEngine();
    }
    return AnalyticsEngine.instance;
  }

  async calculateMetrics(query: AnalyticsQuery): Promise<AnalyticsResult> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const startTime = Date.now();
    
    try {
      let sqlQuery = supabase
        .from('daily_metrics')
        .select('*');

      // Apply filters
      if (query.filters.channel_type) {
        sqlQuery = sqlQuery.eq('channel_type', query.filters.channel_type);
      }
      if (query.filters.department) {
        sqlQuery = sqlQuery.eq('department', query.filters.department);
      }
      if (query.filters.agent_id) {
        sqlQuery = sqlQuery.eq('agent_id', query.filters.agent_id);
      }

      // Apply time range
      const startDate = query.timeRange.start.toISOString().split('T')[0];
      const endDate = query.timeRange.end.toISOString().split('T')[0];
      sqlQuery = sqlQuery
        .gte('date', startDate)
        .lte('date', endDate);

      const { data, error } = await sqlQuery;

      if (error) {
        throw new Error(`Analytics query failed: ${error.message}`);
      }

      // Process data based on metrics and dimensions
      const processedData = this.processQueryData(data || [], query);
      
      // Calculate trends
      const trends = await this.calculateTrends(query.metrics[0], query.timeRange, query.granularity);

      return {
        data: processedData,
        summary: this.calculateSummary(processedData, query.metrics),
        trends,
        metadata: {
          totalRecords: data?.length || 0,
          queryTime: Date.now() - startTime,
          cached: false
        }
      };
    } catch (error) {
      console.error('Error calculating metrics:', error);
      throw error;
    }
  }

  async getTrendData(metric: string, timeRange: TimeRange, granularity: Granularity): Promise<TrendPoint[]> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      const { data, error } = await supabase
        .from('daily_metrics')
        .select('date, total_conversations, ai_resolved_conversations, human_resolved_conversations, avg_satisfaction_score, ai_confidence_avg, ai_accuracy_rate')
        .gte('date', timeRange.start.toISOString().split('T')[0])
        .lte('date', timeRange.end.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) {
        throw new Error(`Trend query failed: ${error.message}`);
      }

      return this.processTrendData(data || [], metric, granularity);
    } catch (error) {
      console.error('Error getting trend data:', error);
      throw error;
    }
  }

  async getTopPerformers(metric: string, dimension: string, limit: number = 10): Promise<RankingResult[]> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      let query = supabase.from('daily_metrics').select('*');
      
      // Group by the specified dimension
      if (dimension === 'channel_type') {
        query = query.select('channel_type, total_conversations, ai_resolved_conversations, avg_satisfaction_score');
      } else if (dimension === 'department') {
        query = query.select('department, total_conversations, ai_resolved_conversations, avg_satisfaction_score');
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Top performers query failed: ${error.message}`);
      }

      return this.processRankingData(data || [], metric, dimension, limit);
    } catch (error) {
      console.error('Error getting top performers:', error);
      throw error;
    }
  }

  async getComparativeAnalysis(baseFilters: any, compareFilters: any): Promise<ComparisonResult> {
    try {
      const baseQuery: AnalyticsQuery = {
        metrics: ['total_conversations', 'avg_satisfaction_score'],
        dimensions: ['channel_type'],
        filters: baseFilters,
        timeRange: { 
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 
          end: new Date(),
          label: 'Last 7 days'
        },
        granularity: 'day'
      };

      const compareQuery: AnalyticsQuery = {
        ...baseQuery,
        filters: compareFilters,
        timeRange: { 
          start: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), 
          end: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          label: 'Previous 7 days'
        }
      };

      const base = await this.calculateMetrics(baseQuery);
      const comparison = await this.calculateMetrics(compareQuery);

      const difference = this.calculateDifference(base.summary, comparison.summary);
      const significance = this.calculateSignificance(difference);

      return {
        base,
        comparison,
        difference,
        significance
      };
    } catch (error) {
      console.error('Error getting comparative analysis:', error);
      throw error;
    }
  }

  async detectAnomalies(metric: string, timeRange: TimeRange): Promise<Anomaly[]> {
    try {
      const trendData = await this.getTrendData(metric, timeRange, 'day');
      
      // Simple anomaly detection using statistical methods
      const values = trendData.map(point => point.value);
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      const threshold = 2 * stdDev; // 2 standard deviations

      const anomalies: Anomaly[] = [];

      trendData.forEach(point => {
        const deviation = Math.abs(point.value - mean);
        if (deviation > threshold) {
          anomalies.push({
            metric,
            timestamp: point.timestamp,
            expectedValue: mean,
            actualValue: point.value,
            severity: deviation > 3 * stdDev ? 'high' : deviation > 2 * stdDev ? 'medium' : 'low',
            description: `Anomaly detected: ${point.value} vs expected ${mean.toFixed(2)}`
          });
        }
      });

      return anomalies;
    } catch (error) {
      console.error('Error detecting anomalies:', error);
      throw error;
    }
  }

  async generateInsights(filters: any): Promise<Insight[]> {
    try {
      const insights: Insight[] = [];
      
      // Get recent data for analysis
      const timeRange: TimeRange = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
        label: 'Last 30 days'
      };

      const { data, error } = await supabase
        .from('daily_metrics')
        .select('*')
        .gte('date', timeRange.start.toISOString().split('T')[0])
        .lte('date', timeRange.end.toISOString().split('T')[0]);

      if (error || !data) {
        throw new Error('Failed to fetch data for insights');
      }

      // Generate insights based on patterns
      insights.push(...this.generatePerformanceInsights(data));
      insights.push(...this.generateSatisfactionInsights(data));
      insights.push(...this.generateAIInsights(data));

      return insights;
    } catch (error) {
      console.error('Error generating insights:', error);
      throw error;
    }
  }

  private processQueryData(data: any[], query: AnalyticsQuery): any[] {
    // Group data by dimensions
    const grouped = new Map<string, any>();

    data.forEach(row => {
      const key = query.dimensions.map(dim => row[dim]).join('|');
      if (!grouped.has(key)) {
        grouped.set(key, { ...row });
      } else {
        // Aggregate metrics
        const existing = grouped.get(key);
        query.metrics.forEach(metric => {
          if (typeof existing[metric] === 'number' && typeof row[metric] === 'number') {
            existing[metric] += row[metric];
          }
        });
      }
    });

    return Array.from(grouped.values());
  }

  private calculateSummary(data: any[], metrics: string[]): Record<string, number> {
    const summary: Record<string, number> = {};

    metrics.forEach(metric => {
      const values = data.map(row => row[metric]).filter(val => typeof val === 'number');
      if (values.length > 0) {
        summary[metric] = values.reduce((sum, val) => sum + val, 0);
      }
    });

    return summary;
  }

  private async calculateTrends(metric: string, timeRange: TimeRange, granularity: Granularity): Promise<TrendPoint[]> {
    const trendData = await this.getTrendData(metric, timeRange, granularity);
    
    return trendData.map((point, index) => {
      const change = index > 0 ? point.value - trendData[index - 1].value : 0;
      const changePercent = index > 0 && trendData[index - 1].value !== 0 
        ? (change / trendData[index - 1].value) * 100 
        : 0;

      return {
        ...point,
        change,
        changePercent
      };
    });
  }

  private processTrendData(data: any[], metric: string, granularity: Granularity): TrendPoint[] {
    // Group data by time period based on granularity
    const grouped = new Map<string, number[]>();

    data.forEach(row => {
      const date = new Date(row.date);
      let key: string;

      switch (granularity) {
        case 'hour':
          key = date.toISOString().slice(0, 13); // YYYY-MM-DDTHH
          break;
        case 'day':
          key = date.toISOString().split('T')[0]; // YYYY-MM-DD
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(row[metric] || 0);
    });

    // Calculate averages and create trend points
    return Array.from(grouped.entries())
      .map(([key, values]) => ({
        timestamp: new Date(key),
        value: values.reduce((sum, val) => sum + val, 0) / values.length,
        change: 0,
        changePercent: 0
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private processRankingData(data: any[], metric: string, dimension: string, limit: number): RankingResult[] {
    // Group and aggregate data
    const grouped = new Map<string, { value: number; count: number }>();

    data.forEach(row => {
      const key = row[dimension];
      const value = row[metric] || 0;
      
      if (!grouped.has(key)) {
        grouped.set(key, { value: 0, count: 0 });
      }
      
      const existing = grouped.get(key)!;
      existing.value += value;
      existing.count++;
    });

    // Convert to ranking results
    return Array.from(grouped.entries())
      .map(([name, { value, count }]) => ({
        rank: 0, // Will be set below
        name,
        value: value / count, // Average
        change: 0, // TODO: Calculate change
        metadata: { count }
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, limit)
      .map((result, index) => ({
        ...result,
        rank: index + 1
      }));
  }

  private calculateDifference(base: Record<string, number>, comparison: Record<string, number>): Record<string, number> {
    const difference: Record<string, number> = {};

    Object.keys(base).forEach(key => {
      const baseValue = base[key] || 0;
      const compareValue = comparison[key] || 0;
      difference[key] = baseValue - compareValue;
    });

    return difference;
  }

  private calculateSignificance(difference: Record<string, number>): Record<string, boolean> {
    const significance: Record<string, boolean> = {};

    Object.keys(difference).forEach(key => {
      // Simple significance test: if difference is more than 10% of the base value
      const diff = Math.abs(difference[key]);
      const baseValue = Math.abs(difference[key]);
      significance[key] = diff > baseValue * 0.1;
    });

    return significance;
  }

  private generatePerformanceInsights(data: any[]): Insight[] {
    const insights: Insight[] = [];

    // Calculate average satisfaction
    const avgSatisfaction = data.reduce((sum, row) => sum + (row.avg_satisfaction_score || 0), 0) / data.length;

    if (avgSatisfaction < 4.0) {
      insights.push({
        id: `insight-${Date.now()}-1`,
        type: 'alert',
        title: 'Low Customer Satisfaction',
        description: `Average satisfaction score is ${avgSatisfaction.toFixed(1)}/5. Consider reviewing response quality and training.`,
        confidence: 0.85,
        impact: 'high',
        actionable: true,
        data: { avgSatisfaction },
        createdAt: new Date()
      });
    }

    return insights;
  }

  private generateSatisfactionInsights(data: any[]): Insight[] {
    const insights: Insight[] = [];

    // Find channels with highest satisfaction
    const channelSatisfaction = new Map<string, number[]>();
    
    data.forEach(row => {
      if (row.channel_type && row.avg_satisfaction_score) {
        if (!channelSatisfaction.has(row.channel_type)) {
          channelSatisfaction.set(row.channel_type, []);
        }
        channelSatisfaction.get(row.channel_type)!.push(row.avg_satisfaction_score);
      }
    });

    const avgByChannel = Array.from(channelSatisfaction.entries())
      .map(([channel, scores]) => ({
        channel,
        avg: scores.reduce((sum, score) => sum + score, 0) / scores.length
      }))
      .sort((a, b) => b.avg - a.avg);

    if (avgByChannel.length > 1) {
      const bestChannel = avgByChannel[0];
      const worstChannel = avgByChannel[avgByChannel.length - 1];

      if (bestChannel.avg - worstChannel.avg > 0.5) {
        insights.push({
          id: `insight-${Date.now()}-2`,
          type: 'opportunity',
          title: 'Channel Performance Gap',
          description: `${bestChannel.channel} has ${(bestChannel.avg - worstChannel.avg).toFixed(1)} higher satisfaction than ${worstChannel.channel}. Consider improving ${worstChannel.channel} performance.`,
          confidence: 0.75,
          impact: 'medium',
          actionable: true,
          data: { bestChannel, worstChannel },
          createdAt: new Date()
        });
      }
    }

    return insights;
  }

  private generateAIInsights(data: any[]): Insight[] {
    const insights: Insight[] = [];

    // Calculate AI resolution rate
    const totalConversations = data.reduce((sum, row) => sum + (row.total_conversations || 0), 0);
    const aiResolved = data.reduce((sum, row) => sum + (row.ai_resolved_conversations || 0), 0);
    const aiResolutionRate = totalConversations > 0 ? aiResolved / totalConversations : 0;

    if (aiResolutionRate > 0.8) {
      insights.push({
        id: `insight-${Date.now()}-3`,
        type: 'trend',
        title: 'High AI Resolution Rate',
        description: `AI is resolving ${(aiResolutionRate * 100).toFixed(1)}% of conversations. This indicates strong AI performance.`,
        confidence: 0.9,
        impact: 'medium',
        actionable: false,
        data: { aiResolutionRate },
        createdAt: new Date()
      });
    }

    return insights;
  }
}

export const analyticsEngine = AnalyticsEngine.getInstance(); 