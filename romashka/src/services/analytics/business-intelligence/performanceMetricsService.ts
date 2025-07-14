import { supabase } from '../../supabaseClient';
import { MetricsCollector } from '../metricsCollector';

// Performance Metrics Types
export interface PerformanceMetrics {
  date: string;
  hour?: number;
  agentId?: string;
  channelType?: string;
  department?: string;
  responseTime: {
    average: number;
    p50: number;
    p95: number;
    slaMetPercentage: number;
    target: number;
  };
  resolutionRate: {
    total: number;
    aiResolved: number;
    humanResolved: number;
    escalated: number;
    abandoned: number;
    successRate: number;
    target: number;
  };
  agentProductivity: {
    conversationsHandled: number;
    activeTimeMinutes: number;
    conversationsPerHour: number;
    concurrentConversationsAvg: number;
  };
  costMetrics: {
    agentCostPerConversation: number;
    aiCostPerConversation: number;
    totalOperationalCost: number;
    costSavingsPercent: number;
  };
  qualityMetrics: {
    avgSatisfactionScore: number;
    satisfactionResponses: number;
    complaintRate: number;
    npsScore?: number;
  };
}

export interface SLAStatus {
  metric: string;
  current: number;
  target: number;
  status: 'meeting' | 'at_risk' | 'breached';
  trend: 'improving' | 'stable' | 'declining';
  breachRisk: number;
}

export interface AgentPerformanceRanking {
  agentId: string;
  agentName: string;
  rank: number;
  score: number;
  metrics: {
    responseTime: number;
    resolutionRate: number;
    satisfactionScore: number;
    productivity: number;
  };
  change: number;
}

export class PerformanceMetricsService {
  private static instance: PerformanceMetricsService;
  private metricsCollector: MetricsCollector;

  // SLA Targets
  private readonly SLA_TARGETS = {
    RESPONSE_TIME_SECONDS: 30,
    RESOLUTION_RATE_PERCENT: 80,
    SATISFACTION_SCORE: 4.0,
    CONVERSATIONS_PER_HOUR: 8
  };

  private constructor() {
    this.metricsCollector = MetricsCollector.getInstance();
  }

  static getInstance(): PerformanceMetricsService {
    if (!PerformanceMetricsService.instance) {
      PerformanceMetricsService.instance = new PerformanceMetricsService();
    }
    return PerformanceMetricsService.instance;
  }

  async calculateHourlyMetrics(date: string, hour: number): Promise<PerformanceMetrics[]> {
    try {
      const { data: metricsData, error } = await supabase
        .from('performance_metrics')
        .select('*')
        .eq('date', date)
        .eq('hour', hour)
        .order('agent_id');

      if (error) throw error;

      return metricsData.map(data => this.formatPerformanceMetrics(data));
    } catch (error) {
      console.error('Error calculating hourly metrics:', error);
      throw error;
    }
  }

  async calculateDailyMetrics(date: string): Promise<PerformanceMetrics[]> {
    try {
      const { data: metricsData, error } = await supabase
        .from('performance_metrics')
        .select('*')
        .eq('date', date)
        .is('hour', null)
        .order('agent_id');

      if (error) throw error;

      return metricsData.map(data => this.formatPerformanceMetrics(data));
    } catch (error) {
      console.error('Error calculating daily metrics:', error);
      throw error;
    }
  }

  async getResponseTimeMetrics(startDate: string, endDate: string, agentId?: string): Promise<any> {
    try {
      let query = supabase
        .from('performance_metrics')
        .select('date, avg_response_time_seconds, p50_response_time_seconds, p95_response_time_seconds, response_time_sla_met, response_time_sla_total')
        .gte('date', startDate)
        .lte('date', endDate);

      if (agentId) {
        query = query.eq('agent_id', agentId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Calculate aggregated metrics
      const totalSlaChecks = data.reduce((sum, row) => sum + (row.response_time_sla_total || 0), 0);
      const totalSlaMet = data.reduce((sum, row) => sum + (row.response_time_sla_met || 0), 0);
      const avgResponseTime = data.reduce((sum, row) => sum + (row.avg_response_time_seconds || 0), 0) / data.length;

      return {
        averageResponseTime: avgResponseTime,
        slaComplianceRate: totalSlaChecks > 0 ? (totalSlaMet / totalSlaChecks) * 100 : 0,
        target: this.SLA_TARGETS.RESPONSE_TIME_SECONDS,
        trend: this.calculateTrend(data, 'avg_response_time_seconds'),
        dailyBreakdown: data.map(row => ({
          date: row.date,
          average: row.avg_response_time_seconds,
          p50: row.p50_response_time_seconds,
          p95: row.p95_response_time_seconds,
          slaCompliance: row.response_time_sla_total > 0 ? (row.response_time_sla_met / row.response_time_sla_total) * 100 : 0
        }))
      };
    } catch (error) {
      console.error('Error getting response time metrics:', error);
      throw error;
    }
  }

  async getResolutionRateMetrics(startDate: string, endDate: string, channelType?: string): Promise<any> {
    try {
      let query = supabase
        .from('performance_metrics')
        .select('date, total_conversations, ai_resolved_conversations, human_resolved_conversations, escalated_conversations, abandoned_conversations')
        .gte('date', startDate)
        .lte('date', endDate);

      if (channelType) {
        query = query.eq('channel_type', channelType);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Calculate aggregated metrics
      const totalConversations = data.reduce((sum, row) => sum + (row.total_conversations || 0), 0);
      const aiResolved = data.reduce((sum, row) => sum + (row.ai_resolved_conversations || 0), 0);
      const humanResolved = data.reduce((sum, row) => sum + (row.human_resolved_conversations || 0), 0);
      const escalated = data.reduce((sum, row) => sum + (row.escalated_conversations || 0), 0);
      const abandoned = data.reduce((sum, row) => sum + (row.abandoned_conversations || 0), 0);

      const totalResolved = aiResolved + humanResolved;
      const resolutionRate = totalConversations > 0 ? (totalResolved / totalConversations) * 100 : 0;
      const aiResolutionRate = totalConversations > 0 ? (aiResolved / totalConversations) * 100 : 0;

      return {
        totalConversations,
        totalResolved,
        resolutionRate,
        aiResolutionRate,
        humanResolutionRate: totalConversations > 0 ? (humanResolved / totalConversations) * 100 : 0,
        escalationRate: totalConversations > 0 ? (escalated / totalConversations) * 100 : 0,
        abandonmentRate: totalConversations > 0 ? (abandoned / totalConversations) * 100 : 0,
        target: this.SLA_TARGETS.RESOLUTION_RATE_PERCENT,
        trend: this.calculateTrend(data, 'total_conversations'),
        dailyBreakdown: data.map(row => ({
          date: row.date,
          total: row.total_conversations,
          aiResolved: row.ai_resolved_conversations,
          humanResolved: row.human_resolved_conversations,
          escalated: row.escalated_conversations,
          abandoned: row.abandoned_conversations,
          resolutionRate: row.total_conversations > 0 ? 
            ((row.ai_resolved_conversations + row.human_resolved_conversations) / row.total_conversations) * 100 : 0
        }))
      };
    } catch (error) {
      console.error('Error getting resolution rate metrics:', error);
      throw error;
    }
  }

  async getAgentProductivityMetrics(startDate: string, endDate: string): Promise<AgentPerformanceRanking[]> {
    try {
      const { data: metricsData, error } = await supabase
        .from('performance_metrics')
        .select(`
          agent_id,
          conversations_handled,
          active_time_minutes,
          conversations_per_hour,
          concurrent_conversations_avg,
          avg_response_time_seconds,
          avg_satisfaction_score,
          ai_resolved_conversations,
          human_resolved_conversations,
          total_conversations
        `)
        .gte('date', startDate)
        .lte('date', endDate)
        .not('agent_id', 'is', null);

      if (error) throw error;

      // Get agent profiles
      const agentIds = [...new Set(metricsData.map(m => m.agent_id))];
      const { data: agentProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', agentIds);

      if (profileError) throw profileError;

      // Aggregate metrics by agent
      const agentMetrics = new Map();
      
      metricsData.forEach(metric => {
        const agentId = metric.agent_id;
        if (!agentMetrics.has(agentId)) {
          agentMetrics.set(agentId, {
            conversationsHandled: 0,
            activeTimeMinutes: 0,
            responseTimeSum: 0,
            satisfactionSum: 0,
            totalConversations: 0,
            aiResolved: 0,
            humanResolved: 0,
            dataPoints: 0
          });
        }

        const agent = agentMetrics.get(agentId);
        agent.conversationsHandled += metric.conversations_handled || 0;
        agent.activeTimeMinutes += metric.active_time_minutes || 0;
        agent.responseTimeSum += metric.avg_response_time_seconds || 0;
        agent.satisfactionSum += metric.avg_satisfaction_score || 0;
        agent.totalConversations += metric.total_conversations || 0;
        agent.aiResolved += metric.ai_resolved_conversations || 0;
        agent.humanResolved += metric.human_resolved_conversations || 0;
        agent.dataPoints += 1;
      });

      // Calculate rankings
      const rankings: AgentPerformanceRanking[] = [];
      
      agentMetrics.forEach((metrics, agentId) => {
        const profile = agentProfiles.find(p => p.id === agentId);
        const avgResponseTime = metrics.responseTimeSum / metrics.dataPoints;
        const avgSatisfaction = metrics.satisfactionSum / metrics.dataPoints;
        const resolutionRate = metrics.totalConversations > 0 ? 
          ((metrics.aiResolved + metrics.humanResolved) / metrics.totalConversations) * 100 : 0;
        const productivity = metrics.activeTimeMinutes > 0 ? 
          (metrics.conversationsHandled / (metrics.activeTimeMinutes / 60)) : 0;

        // Calculate composite score (0-100)
        const responseTimeScore = Math.max(0, 100 - (avgResponseTime / this.SLA_TARGETS.RESPONSE_TIME_SECONDS) * 100);
        const resolutionScore = Math.min(100, (resolutionRate / this.SLA_TARGETS.RESOLUTION_RATE_PERCENT) * 100);
        const satisfactionScore = Math.min(100, (avgSatisfaction / this.SLA_TARGETS.SATISFACTION_SCORE) * 100);
        const productivityScore = Math.min(100, (productivity / this.SLA_TARGETS.CONVERSATIONS_PER_HOUR) * 100);

        const compositeScore = (responseTimeScore + resolutionScore + satisfactionScore + productivityScore) / 4;

        rankings.push({
          agentId,
          agentName: profile?.full_name || 'Unknown Agent',
          rank: 0, // Will be set after sorting
          score: compositeScore,
          metrics: {
            responseTime: avgResponseTime,
            resolutionRate,
            satisfactionScore: avgSatisfaction,
            productivity
          },
          change: 0 // TODO: Calculate change from previous period
        });
      });

      // Sort by score and assign ranks
      rankings.sort((a, b) => b.score - a.score);
      rankings.forEach((ranking, index) => {
        ranking.rank = index + 1;
      });

      return rankings;
    } catch (error) {
      console.error('Error getting agent productivity metrics:', error);
      throw error;
    }
  }

  async getCostPerConversationMetrics(startDate: string, endDate: string): Promise<any> {
    try {
      const { data: metricsData, error } = await supabase
        .from('performance_metrics')
        .select('date, agent_cost_per_conversation, ai_cost_per_conversation, total_operational_cost, total_conversations')
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;

      const totalOperationalCost = metricsData.reduce((sum, row) => sum + (row.total_operational_cost || 0), 0);
      const totalConversations = metricsData.reduce((sum, row) => sum + (row.total_conversations || 0), 0);
      const avgAgentCost = metricsData.reduce((sum, row) => sum + (row.agent_cost_per_conversation || 0), 0) / metricsData.length;
      const avgAICost = metricsData.reduce((sum, row) => sum + (row.ai_cost_per_conversation || 0), 0) / metricsData.length;

      return {
        totalOperationalCost,
        totalConversations,
        avgCostPerConversation: totalConversations > 0 ? totalOperationalCost / totalConversations : 0,
        avgAgentCostPerConversation: avgAgentCost,
        avgAICostPerConversation: avgAICost,
        costSavingsPercent: avgAgentCost > 0 ? ((avgAgentCost - avgAICost) / avgAgentCost) * 100 : 0,
        trend: this.calculateTrend(metricsData, 'total_operational_cost'),
        dailyBreakdown: metricsData.map(row => ({
          date: row.date,
          totalCost: row.total_operational_cost,
          agentCost: row.agent_cost_per_conversation,
          aiCost: row.ai_cost_per_conversation,
          conversations: row.total_conversations,
          costPerConversation: row.total_conversations > 0 ? 
            row.total_operational_cost / row.total_conversations : 0
        }))
      };
    } catch (error) {
      console.error('Error getting cost per conversation metrics:', error);
      throw error;
    }
  }

  async getCurrentSLAStatus(): Promise<SLAStatus[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: todayMetrics, error } = await supabase
        .from('performance_metrics')
        .select('*')
        .eq('date', today)
        .is('hour', null);

      if (error) throw error;

      const slaStatuses: SLAStatus[] = [];

      // Calculate current averages
      const avgResponseTime = todayMetrics.reduce((sum, row) => sum + (row.avg_response_time_seconds || 0), 0) / todayMetrics.length;
      const totalConversations = todayMetrics.reduce((sum, row) => sum + (row.total_conversations || 0), 0);
      const totalResolved = todayMetrics.reduce((sum, row) => sum + (row.ai_resolved_conversations || 0) + (row.human_resolved_conversations || 0), 0);
      const resolutionRate = totalConversations > 0 ? (totalResolved / totalConversations) * 100 : 0;
      const avgSatisfaction = todayMetrics.reduce((sum, row) => sum + (row.avg_satisfaction_score || 0), 0) / todayMetrics.length;

      // Response Time SLA
      slaStatuses.push({
        metric: 'Response Time',
        current: avgResponseTime,
        target: this.SLA_TARGETS.RESPONSE_TIME_SECONDS,
        status: avgResponseTime <= this.SLA_TARGETS.RESPONSE_TIME_SECONDS ? 'meeting' : 
                avgResponseTime <= this.SLA_TARGETS.RESPONSE_TIME_SECONDS * 1.2 ? 'at_risk' : 'breached',
        trend: this.calculateTrend(todayMetrics, 'avg_response_time_seconds'),
        breachRisk: Math.max(0, (avgResponseTime - this.SLA_TARGETS.RESPONSE_TIME_SECONDS) / this.SLA_TARGETS.RESPONSE_TIME_SECONDS)
      });

      // Resolution Rate SLA
      slaStatuses.push({
        metric: 'Resolution Rate',
        current: resolutionRate,
        target: this.SLA_TARGETS.RESOLUTION_RATE_PERCENT,
        status: resolutionRate >= this.SLA_TARGETS.RESOLUTION_RATE_PERCENT ? 'meeting' : 
                resolutionRate >= this.SLA_TARGETS.RESOLUTION_RATE_PERCENT * 0.9 ? 'at_risk' : 'breached',
        trend: this.calculateTrend(todayMetrics, 'total_conversations'),
        breachRisk: Math.max(0, (this.SLA_TARGETS.RESOLUTION_RATE_PERCENT - resolutionRate) / this.SLA_TARGETS.RESOLUTION_RATE_PERCENT)
      });

      // Customer Satisfaction SLA
      slaStatuses.push({
        metric: 'Customer Satisfaction',
        current: avgSatisfaction,
        target: this.SLA_TARGETS.SATISFACTION_SCORE,
        status: avgSatisfaction >= this.SLA_TARGETS.SATISFACTION_SCORE ? 'meeting' : 
                avgSatisfaction >= this.SLA_TARGETS.SATISFACTION_SCORE * 0.9 ? 'at_risk' : 'breached',
        trend: this.calculateTrend(todayMetrics, 'avg_satisfaction_score'),
        breachRisk: Math.max(0, (this.SLA_TARGETS.SATISFACTION_SCORE - avgSatisfaction) / this.SLA_TARGETS.SATISFACTION_SCORE)
      });

      return slaStatuses;
    } catch (error) {
      console.error('Error getting current SLA status:', error);
      throw error;
    }
  }

  async aggregateHourlyMetrics(date: string, hour: number): Promise<void> {
    try {
      // Get conversations for the hour
      const hourStart = new Date(`${date}T${hour.toString().padStart(2, '0')}:00:00Z`);
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);

      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .gte('created_at', hourStart.toISOString())
        .lt('created_at', hourEnd.toISOString());

      if (convError) throw convError;

      // Group by agent, channel, department
      const groupedMetrics = new Map();

      conversations.forEach(conv => {
        const key = `${conv.assigned_agent_id || 'unassigned'}-${conv.channel_type || 'unknown'}-${conv.department || 'general'}`;
        
        if (!groupedMetrics.has(key)) {
          groupedMetrics.set(key, {
            agentId: conv.assigned_agent_id,
            channelType: conv.channel_type,
            department: conv.department,
            conversations: [],
            metrics: {
              totalConversations: 0,
              aiResolved: 0,
              humanResolved: 0,
              escalated: 0,
              abandoned: 0,
              responseTimeSum: 0,
              satisfactionSum: 0,
              satisfactionCount: 0
            }
          });
        }

        const group = groupedMetrics.get(key);
        group.conversations.push(conv);
        group.metrics.totalConversations++;

        // Update resolution tracking
        if (conv.resolved_by === 'ai') group.metrics.aiResolved++;
        else if (conv.resolved_by === 'human') group.metrics.humanResolved++;
        else if (conv.status === 'escalated') group.metrics.escalated++;
        else if (conv.status === 'abandoned') group.metrics.abandoned++;

        // Add satisfaction if available
        if (conv.satisfaction_rating) {
          group.metrics.satisfactionSum += conv.satisfaction_rating;
          group.metrics.satisfactionCount++;
        }
      });

      // Calculate and insert metrics for each group
      for (const [key, group] of groupedMetrics) {
        const metrics = group.metrics;
        const avgSatisfaction = metrics.satisfactionCount > 0 ? 
          metrics.satisfactionSum / metrics.satisfactionCount : 0;

        // Calculate costs (simplified)
        const agentCost = group.agentId ? 25.0 : 0; // $25/hour average
        const aiCost = 0.5; // $0.50 per conversation
        const totalCost = (metrics.humanResolved * agentCost) + (metrics.aiResolved * aiCost);

        await supabase
          .from('performance_metrics')
          .upsert({
            date,
            hour,
            agent_id: group.agentId,
            channel_type: group.channelType,
            department: group.department,
            total_conversations: metrics.totalConversations,
            ai_resolved_conversations: metrics.aiResolved,
            human_resolved_conversations: metrics.humanResolved,
            escalated_conversations: metrics.escalated,
            abandoned_conversations: metrics.abandoned,
            conversations_handled: metrics.totalConversations,
            avg_satisfaction_score: avgSatisfaction,
            satisfaction_responses: metrics.satisfactionCount,
            agent_cost_per_conversation: metrics.humanResolved > 0 ? agentCost : 0,
            ai_cost_per_conversation: aiCost,
            total_operational_cost: totalCost
          });
      }
    } catch (error) {
      console.error('Error aggregating hourly metrics:', error);
      throw error;
    }
  }

  private formatPerformanceMetrics(data: any): PerformanceMetrics {
    return {
      date: data.date,
      hour: data.hour,
      agentId: data.agent_id,
      channelType: data.channel_type,
      department: data.department,
      responseTime: {
        average: data.avg_response_time_seconds || 0,
        p50: data.p50_response_time_seconds || 0,
        p95: data.p95_response_time_seconds || 0,
        slaMetPercentage: data.response_time_sla_total > 0 ? 
          (data.response_time_sla_met / data.response_time_sla_total) * 100 : 0,
        target: this.SLA_TARGETS.RESPONSE_TIME_SECONDS
      },
      resolutionRate: {
        total: data.total_conversations || 0,
        aiResolved: data.ai_resolved_conversations || 0,
        humanResolved: data.human_resolved_conversations || 0,
        escalated: data.escalated_conversations || 0,
        abandoned: data.abandoned_conversations || 0,
        successRate: data.total_conversations > 0 ? 
          ((data.ai_resolved_conversations + data.human_resolved_conversations) / data.total_conversations) * 100 : 0,
        target: this.SLA_TARGETS.RESOLUTION_RATE_PERCENT
      },
      agentProductivity: {
        conversationsHandled: data.conversations_handled || 0,
        activeTimeMinutes: data.active_time_minutes || 0,
        conversationsPerHour: data.conversations_per_hour || 0,
        concurrentConversationsAvg: data.concurrent_conversations_avg || 0
      },
      costMetrics: {
        agentCostPerConversation: data.agent_cost_per_conversation || 0,
        aiCostPerConversation: data.ai_cost_per_conversation || 0,
        totalOperationalCost: data.total_operational_cost || 0,
        costSavingsPercent: data.agent_cost_per_conversation > 0 ? 
          ((data.agent_cost_per_conversation - data.ai_cost_per_conversation) / data.agent_cost_per_conversation) * 100 : 0
      },
      qualityMetrics: {
        avgSatisfactionScore: data.avg_satisfaction_score || 0,
        satisfactionResponses: data.satisfaction_responses || 0,
        complaintRate: data.complaint_rate || 0
      }
    };
  }

  private calculateTrend(data: any[], field: string): 'improving' | 'stable' | 'declining' {
    if (data.length < 2) return 'stable';
    
    const recent = data.slice(-3);
    const older = data.slice(0, 3);
    
    const recentAvg = recent.reduce((sum, row) => sum + (row[field] || 0), 0) / recent.length;
    const olderAvg = older.reduce((sum, row) => sum + (row[field] || 0), 0) / older.length;
    
    const change = recentAvg - olderAvg;
    const threshold = olderAvg * 0.05; // 5% threshold
    
    if (Math.abs(change) < threshold) return 'stable';
    return change > 0 ? 'declining' : 'improving';
  }
}

export const performanceMetricsService = PerformanceMetricsService.getInstance();