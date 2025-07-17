import { supabase } from '../supabaseClient';
import { analyticsEngineService } from './analyticsEngineService';
import { predictiveAnalyticsService } from './predictiveAnalyticsService';
import type { 
  BusinessIntelligence,
  ROIAnalysis,
  KPIMetric,
  TrendData,
  BusinessInsight,
  ExecutiveRecommendation,
  RealTimeMetrics,
  TeamMetrics,
  ChannelMetrics,
  Alert,
  WorkloadMetrics,
  TimeRange
} from '../../types/analytics';

export interface ExecutiveDashboard {
  kpis: {
    customerSatisfaction: KPIMetric;
    responseTime: KPIMetric;
    resolutionRate: KPIMetric;
    aiEfficiency: KPIMetric;
    costSavings: KPIMetric;
  };
  trends: {
    satisfactionTrend: TrendData[];
    volumeTrend: TrendData[];
    efficiencyTrend: TrendData[];
  };
  insights: BusinessInsight[];
  recommendations: ExecutiveRecommendation[];
}

export interface OperationalDashboard {
  realTimeMetrics: RealTimeMetrics;
  teamPerformance: TeamMetrics[];
  channelPerformance: ChannelMetrics[];
  alertsAndNotifications: Alert[];
  workloadDistribution: WorkloadMetrics;
}

export class BusinessIntelligenceService {
  private cacheTimeout = 15 * 60 * 1000; // 15 minutes
  private cache = new Map<string, { data: any; timestamp: number }>();

  // ================================
  // EXECUTIVE DASHBOARD
  // ================================

  async getExecutiveDashboard(): Promise<ExecutiveDashboard> {
    const cacheKey = 'executive_dashboard';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const [
        kpis,
        trends,
        insights,
        recommendations
      ] = await Promise.all([
        this.getExecutiveKPIs(),
        this.getExecutiveTrends(),
        this.getBusinessInsights(),
        this.getExecutiveRecommendations()
      ]);

      const dashboard: ExecutiveDashboard = {
        kpis,
        trends,
        insights,
        recommendations
      };

      this.setCachedData(cacheKey, dashboard);
      return dashboard;
    } catch (error) {
      console.error('Error getting executive dashboard:', error);
      throw error;
    }
  }

  async getOperationalDashboard(): Promise<OperationalDashboard> {
    const cacheKey = 'operational_dashboard';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const [
        realTimeMetrics,
        teamPerformance,
        channelPerformance,
        alertsAndNotifications,
        workloadDistribution
      ] = await Promise.all([
        this.getRealTimeMetrics(),
        this.getTeamPerformance(),
        this.getChannelPerformance(),
        this.getAlertsAndNotifications(),
        this.getWorkloadDistribution()
      ]);

      const dashboard: OperationalDashboard = {
        realTimeMetrics,
        teamPerformance,
        channelPerformance,
        alertsAndNotifications,
        workloadDistribution
      };

      this.setCachedData(cacheKey, dashboard);
      return dashboard;
    } catch (error) {
      console.error('Error getting operational dashboard:', error);
      throw error;
    }
  }

  // ================================
  // ROI ANALYSIS
  // ================================

  async calculateROI(timeFrame: TimeRange): Promise<ROIAnalysis> {
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
      const investmentAmount = await this.calculateInvestmentAmount(timeFrame);
      const roiPercentage = investmentAmount > 0 ? Math.round((totalROI / investmentAmount) * 100) : 0;

      const analysis: ROIAnalysis = {
        timeFrame,
        costSavings,
        efficiencyGains,
        customerSatisfactionImpact: satisfactionImpact,
        revenueImpact,
        totalROI,
        roiPercentage,
        investmentAmount,
        paybackPeriod: this.calculatePaybackPeriod(totalROI, investmentAmount),
        breakdown: {
          aiAutomation: costSavings * 0.6,
          agentProductivity: efficiencyGains * 0.7,
          customerRetention: revenueImpact * 0.4,
          operationalEfficiency: (costSavings + efficiencyGains) * 0.3
        },
        calculatedAt: new Date().toISOString()
      };

      this.setCachedData(cacheKey, analysis);
      return analysis;
    } catch (error) {
      console.error('Error calculating ROI:', error);
      throw error;
    }
  }

  // ================================
  // BUSINESS INTELLIGENCE INSIGHTS
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

      const intelligence: BusinessIntelligence = {
        kpis,
        trends,
        insights,
        recommendations,
        generatedAt: new Date().toISOString()
      };

      this.setCachedData(cacheKey, intelligence);
      return intelligence;
    } catch (error) {
      console.error('Error getting business intelligence:', error);
      throw error;
    }
  }

  // ================================
  // PERFORMANCE ANALYTICS
  // ================================

  async getPerformanceAnalytics(timeFrame: TimeRange): Promise<{
    overallPerformance: number;
    performanceBreakdown: Record<string, number>;
    improvementAreas: string[];
    benchmarkComparison: Record<string, { current: number; benchmark: number; status: 'above' | 'below' | 'meeting' }>;
  }> {
    try {
      const [
        currentMetrics,
        benchmarks,
        historicalData
      ] = await Promise.all([
        this.getCurrentMetrics(timeFrame),
        this.getBenchmarks(),
        this.getHistoricalPerformance(timeFrame)
      ]);

      const performanceBreakdown = {
        customerSatisfaction: this.calculatePerformanceScore(currentMetrics.satisfaction, benchmarks.satisfaction),
        responseTime: this.calculatePerformanceScore(benchmarks.responseTime, currentMetrics.responseTime, true), // Inverse for time
        resolutionRate: this.calculatePerformanceScore(currentMetrics.resolutionRate, benchmarks.resolutionRate),
        aiAccuracy: this.calculatePerformanceScore(currentMetrics.aiAccuracy, benchmarks.aiAccuracy),
        costEfficiency: this.calculateCostEfficiency(currentMetrics, benchmarks)
      };

      const overallPerformance = Object.values(performanceBreakdown).reduce((sum, score) => sum + score, 0) / Object.keys(performanceBreakdown).length;

      const improvementAreas = this.identifyImprovementAreas(performanceBreakdown);

      const benchmarkComparison = this.createBenchmarkComparison(currentMetrics, benchmarks);

      return {
        overallPerformance,
        performanceBreakdown,
        improvementAreas,
        benchmarkComparison
      };
    } catch (error) {
      console.error('Error getting performance analytics:', error);
      throw error;
    }
  }

  // ================================
  // PRIVATE HELPER METHODS
  // ================================

  private async getExecutiveKPIs(): Promise<ExecutiveDashboard['kpis']> {
    const [
      satisfactionData,
      responseTimeData,
      resolutionData,
      aiEfficiencyData,
      costSavingsData
    ] = await Promise.all([
      this.getKPIData('customer_satisfaction'),
      this.getKPIData('response_time'),
      this.getKPIData('resolution_rate'),
      this.getKPIData('ai_efficiency'),
      this.getKPIData('cost_savings')
    ]);

    return {
      customerSatisfaction: {
        current: satisfactionData.current,
        target: satisfactionData.target,
        trend: satisfactionData.trend,
        status: this.getKPIStatus(satisfactionData.current, satisfactionData.target),
        change: satisfactionData.change,
        changePercent: satisfactionData.changePercent
      },
      responseTime: {
        current: responseTimeData.current,
        target: responseTimeData.target,
        trend: responseTimeData.trend,
        status: this.getKPIStatus(responseTimeData.target, responseTimeData.current), // Inverse for time
        change: responseTimeData.change,
        changePercent: responseTimeData.changePercent
      },
      resolutionRate: {
        current: resolutionData.current,
        target: resolutionData.target,
        trend: resolutionData.trend,
        status: this.getKPIStatus(resolutionData.current, resolutionData.target),
        change: resolutionData.change,
        changePercent: resolutionData.changePercent
      },
      aiEfficiency: {
        current: aiEfficiencyData.current,
        target: aiEfficiencyData.target,
        trend: aiEfficiencyData.trend,
        status: this.getKPIStatus(aiEfficiencyData.current, aiEfficiencyData.target),
        change: aiEfficiencyData.change,
        changePercent: aiEfficiencyData.changePercent
      },
      costSavings: {
        current: costSavingsData.current,
        target: costSavingsData.target,
        trend: costSavingsData.trend,
        status: this.getKPIStatus(costSavingsData.current, costSavingsData.target),
        change: costSavingsData.change,
        changePercent: costSavingsData.changePercent
      }
    };
  }

  private async getExecutiveTrends(): Promise<ExecutiveDashboard['trends']> {
    const timeRange = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString()
    };

    const [
      satisfactionTrend,
      volumeTrend,
      efficiencyTrend
    ] = await Promise.all([
      this.getTrendData('satisfaction', timeRange),
      this.getTrendData('volume', timeRange),
      this.getTrendData('efficiency', timeRange)
    ]);

    return {
      satisfactionTrend,
      volumeTrend,
      efficiencyTrend
    };
  }

  private async getBusinessInsights(): Promise<BusinessInsight[]> {
    const insights: BusinessInsight[] = [];

    // AI Performance Insight
    const aiAccuracy = await this.getCurrentAIAccuracy();
    if (aiAccuracy > 0.85) {
      insights.push({
        type: 'opportunity',
        title: 'High AI Performance Detected',
        description: `AI accuracy is at ${Math.round(aiAccuracy * 100)}%, enabling increased automation`,
        impact: 'high',
        category: 'automation',
        confidence: 0.9,
        recommendedActions: [
          'Increase AI confidence threshold',
          'Expand automated response scenarios',
          'Reduce human intervention for routine queries'
        ],
        estimatedValue: 25000,
        timeframe: '2-4 weeks'
      });
    }

    // Volume Pattern Insight
    const volumePattern = await this.analyzeVolumePatterns();
    if (volumePattern.hasPattern) {
      insights.push({
        type: 'trend',
        title: 'Conversation Volume Pattern Identified',
        description: `Peak activity occurs ${volumePattern.description}`,
        impact: 'medium',
        category: 'operations',
        confidence: 0.8,
        recommendedActions: [
          'Adjust staffing schedules',
          'Implement proactive messaging',
          'Optimize resource allocation'
        ],
        estimatedValue: 15000,
        timeframe: '1-2 weeks'
      });
    }

    // Customer Satisfaction Insight
    const satisfactionTrend = await this.getSatisfactionTrend();
    if (satisfactionTrend.isDecreasing) {
      insights.push({
        type: 'risk',
        title: 'Customer Satisfaction Declining',
        description: `Satisfaction scores have decreased by ${satisfactionTrend.changePercent}% in the last week`,
        impact: 'high',
        category: 'customer_experience',
        confidence: 0.85,
        recommendedActions: [
          'Review recent conversation quality',
          'Implement additional agent training',
          'Analyze customer feedback patterns'
        ],
        estimatedValue: -50000,
        timeframe: 'immediate'
      });
    }

    // Cost Optimization Insight
    const costOptimization = await this.identifyCostOptimizations();
    if (costOptimization.potential > 10000) {
      insights.push({
        type: 'opportunity',
        title: 'Cost Optimization Opportunity',
        description: `Potential monthly savings of $${costOptimization.potential.toLocaleString()} identified`,
        impact: 'high',
        category: 'cost_optimization',
        confidence: 0.75,
        recommendedActions: costOptimization.actions,
        estimatedValue: costOptimization.potential,
        timeframe: '4-8 weeks'
      });
    }

    return insights;
  }

  private async getExecutiveRecommendations(): Promise<ExecutiveRecommendation[]> {
    const recommendations: ExecutiveRecommendation[] = [];

    // Strategic recommendations based on performance data
    const performanceData = await this.getPerformanceData();

    if (performanceData.aiAccuracy > 0.8 && performanceData.costPerConversation > 5) {
      recommendations.push({
        priority: 'high',
        category: 'automation',
        title: 'Accelerate AI Automation Initiative',
        description: 'High AI accuracy enables significant cost reduction through increased automation',
        expectedImpact: 'Reduce cost per conversation by 40-60%',
        timeframe: '2-3 months',
        investmentRequired: 50000,
        expectedROI: 300,
        keyActions: [
          'Increase AI confidence threshold from 80% to 90%',
          'Expand automated response scenarios by 50%',
          'Implement smart routing for complex queries',
          'Train AI on recent high-quality conversations'
        ],
        riskFactors: [
          'Potential decrease in customer satisfaction if not properly managed',
          'Need for robust fallback mechanisms'
        ],
        successMetrics: [
          'AI resolution rate increase to 75%',
          'Cost per conversation reduction of $3-5',
          'Maintain customer satisfaction above 4.2'
        ]
      });
    }

    if (performanceData.satisfactionTrend < 0) {
      recommendations.push({
        priority: 'high',
        category: 'customer_experience',
        title: 'Implement Customer Experience Enhancement Program',
        description: 'Declining satisfaction scores require immediate attention to prevent customer churn',
        expectedImpact: 'Improve satisfaction by 0.5-0.8 points',
        timeframe: '1-2 months',
        investmentRequired: 30000,
        expectedROI: 200,
        keyActions: [
          'Conduct customer feedback analysis',
          'Implement personalized response templates',
          'Enhance agent training on empathy and communication',
          'Deploy real-time sentiment monitoring'
        ],
        riskFactors: [
          'Customer churn if not addressed quickly',
          'Potential negative reviews and word-of-mouth'
        ],
        successMetrics: [
          'Customer satisfaction increase to 4.5+',
          'Reduce complaint volume by 25%',
          'Improve Net Promoter Score by 15 points'
        ]
      });
    }

    return recommendations;
  }

  private async getRealTimeMetrics(): Promise<RealTimeMetrics> {
    const [
      activeConversations,
      avgResponseTime,
      queueLength,
      agentUtilization,
      satisfactionScore
    ] = await Promise.all([
      this.getActiveConversationsCount(),
      this.getAverageResponseTime(),
      this.getQueueLength(),
      this.getAgentUtilization(),
      this.getCurrentSatisfactionScore()
    ]);

    return {
      activeConversations,
      avgResponseTime,
      queueLength,
      agentUtilization,
      satisfactionScore,
      timestamp: new Date().toISOString()
    };
  }

  private async getTeamPerformance(): Promise<TeamMetrics[]> {
    const { data, error } = await supabase
      .from('agent_performance_metrics')
      .select('*')
      .order('success_rate', { ascending: false });

    if (error) throw error;

    return (data || []).map(agent => ({
      agentId: agent.agent_id,
      agentName: agent.agent_name,
      conversationsHandled: agent.total_tasks || 0,
      avgResponseTime: agent.avg_execution_time_ms || 0,
      satisfactionScore: 4.2, // Would be calculated from actual data
      resolutionRate: agent.success_rate || 0,
      status: agent.last_activity ? 'active' : 'inactive',
      lastActivity: agent.last_activity
    }));
  }

  private async getChannelPerformance(): Promise<ChannelMetrics[]> {
    const { data, error } = await supabase
      .from('daily_analytics')
      .select('channel_distribution')
      .order('date', { ascending: false })
      .limit(7);

    if (error) throw error;

    const channelData: Record<string, { count: number; satisfaction: number; responseTime: number }> = {};

    data?.forEach(day => {
      const distribution = day.channel_distribution || {};
      Object.entries(distribution).forEach(([channel, count]) => {
        if (!channelData[channel]) {
          channelData[channel] = { count: 0, satisfaction: 4.2, responseTime: 120 };
        }
        channelData[channel].count += typeof count === 'number' ? count : 0;
      });
    });

    return Object.entries(channelData).map(([channel, metrics]) => ({
      channel,
      count: metrics.count,
      percentage: 0, // Would be calculated based on total
      avgResponseTime: metrics.responseTime,
      satisfactionScore: metrics.satisfaction,
      resolutionRate: 0.85,
      trend: 'stable'
    }));
  }

  private async getAlertsAndNotifications(): Promise<Alert[]> {
    const alerts: Alert[] = [];

    // Check for high response times
    const avgResponseTime = await this.getAverageResponseTime();
    if (avgResponseTime > 180) {
      alerts.push({
        id: 'high_response_time',
        type: 'warning',
        title: 'High Response Time Alert',
        message: `Average response time is ${avgResponseTime}s, exceeding target of 120s`,
        severity: 'medium',
        timestamp: new Date().toISOString(),
        acknowledged: false
      });
    }

    // Check for low satisfaction
    const satisfaction = await this.getCurrentSatisfactionScore();
    if (satisfaction < 4.0) {
      alerts.push({
        id: 'low_satisfaction',
        type: 'critical',
        title: 'Customer Satisfaction Alert',
        message: `Customer satisfaction dropped to ${satisfaction.toFixed(1)}, below target of 4.0`,
        severity: 'high',
        timestamp: new Date().toISOString(),
        acknowledged: false
      });
    }

    // Check for queue buildup
    const queueLength = await this.getQueueLength();
    if (queueLength > 20) {
      alerts.push({
        id: 'high_queue',
        type: 'warning',
        title: 'Queue Buildup Alert',
        message: `${queueLength} conversations in queue, consider increasing capacity`,
        severity: 'medium',
        timestamp: new Date().toISOString(),
        acknowledged: false
      });
    }

    return alerts;
  }

  private async getWorkloadDistribution(): Promise<WorkloadMetrics> {
    const [
      totalConversations,
      aiHandled,
      humanHandled,
      averageComplexity
    ] = await Promise.all([
      this.getTotalConversations(),
      this.getAIHandledConversations(),
      this.getHumanHandledConversations(),
      this.getAverageComplexity()
    ]);

    return {
      totalConversations,
      aiHandled,
      humanHandled,
      aiHandledPercentage: (aiHandled / totalConversations) * 100,
      humanHandledPercentage: (humanHandled / totalConversations) * 100,
      averageComplexity,
      peakHours: ['09:00', '11:00', '14:00', '16:00'],
      distributionByHour: {} // Would be populated with actual hourly data
    };
  }

  private async calculateCostSavings(timeFrame: TimeRange): Promise<number> {
    const { data, error } = await supabase
      .from('conversation_analytics')
      .select('resolved_by')
      .not('resolved_by', 'is', null)
      .gte('created_at', timeFrame.start)
      .lte('created_at', timeFrame.end);

    if (error) throw error;

    const aiResolved = data?.filter(a => a.resolved_by === 'ai').length || 0;
    const costPerAgentConversation = 8; // $8 per agent-handled conversation
    const costPerAIConversation = 1; // $1 per AI-handled conversation

    return aiResolved * (costPerAgentConversation - costPerAIConversation);
  }

  private async calculateEfficiencyGains(timeFrame: TimeRange): Promise<number> {
    const { data, error } = await supabase
      .from('conversation_analytics')
      .select('avg_response_time_seconds, resolved_by')
      .not('avg_response_time_seconds', 'is', null)
      .gte('created_at', timeFrame.start)
      .lte('created_at', timeFrame.end);

    if (error) throw error;

    const aiConversations = data?.filter(a => a.resolved_by === 'ai') || [];
    const humanConversations = data?.filter(a => a.resolved_by !== 'ai') || [];

    const avgAITime = aiConversations.reduce((sum, conv) => sum + (conv.avg_response_time_seconds || 0), 0) / aiConversations.length || 0;
    const avgHumanTime = humanConversations.reduce((sum, conv) => sum + (conv.avg_response_time_seconds || 0), 0) / humanConversations.length || 0;

    const timeSaved = (avgHumanTime - avgAITime) * aiConversations.length;
    const hourlyRate = 25; // $25 per hour for agent time
    
    return Math.round((timeSaved / 3600) * hourlyRate);
  }

  private async calculateSatisfactionImpact(timeFrame: TimeRange): Promise<number> {
    const { data, error } = await supabase
      .from('conversation_analytics')
      .select('customer_satisfaction')
      .not('customer_satisfaction', 'is', null)
      .gte('created_at', timeFrame.start)
      .lte('created_at', timeFrame.end);

    if (error) throw error;

    const avgSatisfaction = data?.reduce((sum, a) => sum + (a.customer_satisfaction || 0), 0) || 0;
    const totalRatings = data?.length || 1;

    return Math.round((avgSatisfaction / totalRatings) * 10); // Scale to 0-50
  }

  private async calculateRevenueImpact(timeFrame: TimeRange): Promise<number> {
    // Simplified revenue impact calculation
    const satisfactionImpact = await this.calculateSatisfactionImpact(timeFrame);
    const customerRetentionRate = 0.95 + (satisfactionImpact * 0.01); // Higher satisfaction = better retention
    const avgCustomerValue = 1200; // Average customer lifetime value
    const totalCustomers = 500; // Estimated customer base

    return Math.round(totalCustomers * avgCustomerValue * (customerRetentionRate - 0.95));
  }

  private async calculateInvestmentAmount(timeFrame: TimeRange): Promise<number> {
    // Simplified investment calculation
    const days = Math.ceil((new Date(timeFrame.end).getTime() - new Date(timeFrame.start).getTime()) / (1000 * 60 * 60 * 24));
    const dailyOperatingCost = 500; // $500 per day for platform operation
    const aiTrainingCost = 5000; // One-time AI training cost
    
    return (days * dailyOperatingCost) + aiTrainingCost;
  }

  private calculatePaybackPeriod(totalROI: number, investment: number): number {
    if (totalROI <= 0) return -1;
    return Math.ceil(investment / (totalROI / 30)); // Days to payback
  }

  private async getKPIData(kpiType: string): Promise<{
    current: number;
    target: number;
    trend: 'up' | 'down' | 'stable';
    change: number;
    changePercent: number;
  }> {
    const { data, error } = await supabase
      .from('business_intelligence')
      .select('*')
      .eq('metric_category', 'kpi')
      .eq('metric_name', kpiType)
      .order('calculated_at', { ascending: false })
      .limit(2);

    if (error) throw error;

    const current = data?.[0]?.metric_value || 0;
    const previous = data?.[1]?.metric_value || current;
    const change = current - previous;
    const changePercent = previous > 0 ? (change / previous) * 100 : 0;

    return {
      current,
      target: this.getTargetValue(kpiType),
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      change,
      changePercent
    };
  }

  private getTargetValue(kpiType: string): number {
    const targets: Record<string, number> = {
      'customer_satisfaction': 4.5,
      'response_time': 120,
      'resolution_rate': 0.9,
      'ai_efficiency': 0.85,
      'cost_savings': 20000
    };
    return targets[kpiType] || 0;
  }

  private getKPIStatus(current: number, target: number): 'good' | 'warning' | 'critical' {
    const ratio = current / target;
    if (ratio >= 0.95) return 'good';
    if (ratio >= 0.8) return 'warning';
    return 'critical';
  }

  private async getTrendData(metric: string, timeRange: TimeRange): Promise<TrendData[]> {
    const { data, error } = await supabase
      .from('daily_analytics')
      .select('date, total_conversations, avg_customer_satisfaction, resolution_rate')
      .gte('date', timeRange.start.split('T')[0])
      .lte('date', timeRange.end.split('T')[0])
      .order('date', { ascending: true });

    if (error) throw error;

    return (data || []).map(item => ({
      date: item.date,
      value: this.getMetricValue(metric, item)
    }));
  }

  private getMetricValue(metric: string, data: any): number {
    switch (metric) {
      case 'satisfaction':
        return data.avg_customer_satisfaction || 0;
      case 'volume':
        return data.total_conversations || 0;
      case 'efficiency':
        return data.resolution_rate || 0;
      default:
        return 0;
    }
  }

  private async getCurrentAIAccuracy(): Promise<number> {
    const { data, error } = await supabase
      .from('conversation_analytics')
      .select('ai_accuracy_score')
      .not('ai_accuracy_score', 'is', null)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    if (!data || data.length === 0) return 0.88;

    const sum = data.reduce((acc, item) => acc + (item.ai_accuracy_score || 0), 0);
    return sum / data.length;
  }

  private async analyzeVolumePatterns(): Promise<{ hasPattern: boolean; description: string }> {
    const { data, error } = await supabase
      .from('daily_analytics')
      .select('date, total_conversations')
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) throw error;

    // Simple pattern detection - in a real implementation, this would be more sophisticated
    const volumes = data?.map(d => d.total_conversations || 0) || [];
    const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
    const peakDays = volumes.filter(vol => vol > avgVolume * 1.2).length;

    return {
      hasPattern: peakDays > 5,
      description: peakDays > 5 ? 'during business hours and mid-week' : 'no clear pattern detected'
    };
  }

  private async getSatisfactionTrend(): Promise<{ isDecreasing: boolean; changePercent: number }> {
    const { data, error } = await supabase
      .from('daily_analytics')
      .select('date, avg_customer_satisfaction')
      .not('avg_customer_satisfaction', 'is', null)
      .gte('date', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) throw error;

    if (!data || data.length < 2) return { isDecreasing: false, changePercent: 0 };

    const recent = data.slice(-7);
    const previous = data.slice(-14, -7);

    const recentAvg = recent.reduce((sum, d) => sum + (d.avg_customer_satisfaction || 0), 0) / recent.length;
    const previousAvg = previous.reduce((sum, d) => sum + (d.avg_customer_satisfaction || 0), 0) / previous.length;

    const changePercent = ((recentAvg - previousAvg) / previousAvg) * 100;

    return {
      isDecreasing: changePercent < -5,
      changePercent: Math.abs(changePercent)
    };
  }

  private async identifyCostOptimizations(): Promise<{ potential: number; actions: string[] }> {
    const aiAccuracy = await this.getCurrentAIAccuracy();
    const currentAutomationRate = 0.6; // 60% automated
    const targetAutomationRate = Math.min(0.8, aiAccuracy);

    const potentialSavings = (targetAutomationRate - currentAutomationRate) * 50000; // $50k per 10% automation increase

    const actions = [
      'Increase AI confidence threshold',
      'Expand automated response scenarios',
      'Implement smart routing',
      'Optimize agent workflows'
    ];

    return {
      potential: Math.round(potentialSavings),
      actions
    };
  }

  private async getPerformanceData(): Promise<{
    aiAccuracy: number;
    costPerConversation: number;
    satisfactionTrend: number;
  }> {
    const [aiAccuracy, costPerConversation, satisfactionTrend] = await Promise.all([
      this.getCurrentAIAccuracy(),
      this.getCostPerConversation(),
      this.getSatisfactionTrend()
    ]);

    return {
      aiAccuracy,
      costPerConversation,
      satisfactionTrend: satisfactionTrend.isDecreasing ? -1 : 1
    };
  }

  private async getCostPerConversation(): Promise<number> {
    const { data, error } = await supabase
      .from('conversation_analytics')
      .select('resolved_by')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    const totalConversations = data?.length || 1;
    const aiConversations = data?.filter(c => c.resolved_by === 'ai').length || 0;
    const humanConversations = totalConversations - aiConversations;

    const aiCost = aiConversations * 1; // $1 per AI conversation
    const humanCost = humanConversations * 8; // $8 per human conversation

    return (aiCost + humanCost) / totalConversations;
  }

  // Additional helper methods for operational dashboard
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
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    if (!data || data.length === 0) return 120;

    const sum = data.reduce((acc, item) => acc + (item.avg_response_time_seconds || 0), 0);
    return Math.round(sum / data.length);
  }

  private async getQueueLength(): Promise<number> {
    const { count, error } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'queued');

    if (error) throw error;
    return count || 0;
  }

  private async getAgentUtilization(): Promise<number> {
    const { data, error } = await supabase
      .from('agent_availability')
      .select('current_chat_count, max_concurrent_chats')
      .eq('is_online', true);

    if (error) throw error;

    if (!data || data.length === 0) return 0;

    const totalCapacity = data.reduce((sum, agent) => sum + (agent.max_concurrent_chats || 0), 0);
    const currentLoad = data.reduce((sum, agent) => sum + (agent.current_chat_count || 0), 0);

    return totalCapacity > 0 ? Math.round((currentLoad / totalCapacity) * 100) : 0;
  }

  private async getCurrentSatisfactionScore(): Promise<number> {
    const { data, error } = await supabase
      .from('conversation_analytics')
      .select('customer_satisfaction')
      .not('customer_satisfaction', 'is', null)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    if (!data || data.length === 0) return 4.2;

    const sum = data.reduce((acc, item) => acc + (item.customer_satisfaction || 0), 0);
    return Math.round((sum / data.length) * 10) / 10;
  }

  private async getTotalConversations(): Promise<number> {
    const { count, error } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;
    return count || 0;
  }

  private async getAIHandledConversations(): Promise<number> {
    const { count, error } = await supabase
      .from('conversation_analytics')
      .select('*', { count: 'exact', head: true })
      .eq('resolved_by', 'ai')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;
    return count || 0;
  }

  private async getHumanHandledConversations(): Promise<number> {
    const { count, error } = await supabase
      .from('conversation_analytics')
      .select('*', { count: 'exact', head: true })
      .neq('resolved_by', 'ai')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;
    return count || 0;
  }

  private async getAverageComplexity(): Promise<number> {
    // Simplified complexity calculation
    return 3.2; // Out of 5
  }

  private async getCurrentMetrics(timeFrame: TimeRange): Promise<any> {
    // Implementation for getting current metrics
    return {
      satisfaction: 4.2,
      responseTime: 125,
      resolutionRate: 0.87,
      aiAccuracy: 0.85
    };
  }

  private async getBenchmarks(): Promise<any> {
    // Industry benchmarks
    return {
      satisfaction: 4.5,
      responseTime: 120,
      resolutionRate: 0.9,
      aiAccuracy: 0.88
    };
  }

  private async getHistoricalPerformance(timeFrame: TimeRange): Promise<any> {
    // Implementation for historical performance data
    return {};
  }

  private calculatePerformanceScore(current: number, target: number, inverse: boolean = false): number {
    if (inverse) {
      return Math.min(100, Math.max(0, (target / current) * 100));
    }
    return Math.min(100, Math.max(0, (current / target) * 100));
  }

  private calculateCostEfficiency(current: any, benchmarks: any): number {
    // Simplified cost efficiency calculation
    return 85;
  }

  private identifyImprovementAreas(performanceBreakdown: Record<string, number>): string[] {
    const areas = [];
    
    if (performanceBreakdown.customerSatisfaction < 80) {
      areas.push('Customer Satisfaction');
    }
    if (performanceBreakdown.responseTime < 80) {
      areas.push('Response Time');
    }
    if (performanceBreakdown.resolutionRate < 80) {
      areas.push('Resolution Rate');
    }
    if (performanceBreakdown.aiAccuracy < 80) {
      areas.push('AI Accuracy');
    }
    
    return areas;
  }

  private createBenchmarkComparison(current: any, benchmarks: any): Record<string, any> {
    return {
      satisfaction: {
        current: current.satisfaction,
        benchmark: benchmarks.satisfaction,
        status: current.satisfaction >= benchmarks.satisfaction ? 'meeting' : 'below'
      },
      responseTime: {
        current: current.responseTime,
        benchmark: benchmarks.responseTime,
        status: current.responseTime <= benchmarks.responseTime ? 'meeting' : 'below'
      },
      resolutionRate: {
        current: current.resolutionRate,
        benchmark: benchmarks.resolutionRate,
        status: current.resolutionRate >= benchmarks.resolutionRate ? 'meeting' : 'below'
      }
    };
  }

  private async getKPIs(): Promise<Record<string, any>> {
    // Implementation for getting KPIs
    return {};
  }

  private async getTrends(): Promise<Record<string, any>> {
    // Implementation for getting trends
    return {};
  }

  private async getBusinessRecommendations(): Promise<any[]> {
    // Implementation for getting business recommendations
    return [];
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
export const businessIntelligenceService = new BusinessIntelligenceService();