import { supabase } from '../supabaseClient';
import type { 
  LiveMetrics, 
  ConversationSummary, 
  AgentMetrics, 
  ChannelActivity, 
  SLAStatus 
} from '../../types/analytics';

export class RealtimeAnalytics {
  private static instance: RealtimeAnalytics;
  private subscribers: Map<string, (metrics: LiveMetrics) => void> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startPeriodicUpdates();
  }

  static getInstance(): RealtimeAnalytics {
    if (!RealtimeAnalytics.instance) {
      RealtimeAnalytics.instance = new RealtimeAnalytics();
    }
    return RealtimeAnalytics.instance;
  }

  async getLiveMetrics(): Promise<LiveMetrics> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      // Get real-time metrics from cache
      const { data: realtimeData, error: realtimeError } = await supabase
        .from('realtime_metrics')
        .select('*')
        .gt('expires_at', new Date().toISOString());

      if (realtimeError) {
        console.error('Error fetching real-time metrics:', realtimeError);
      }

      // Get active conversations
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id, customer_name, channel_type, status, created_at, satisfaction_rating')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (convError) {
        console.error('Error fetching active conversations:', convError);
      }

      // Calculate live metrics
      const activeConversations = conversations?.length || 0;
      
      // Calculate average response time from recent messages
      const { data: recentMessages } = await supabase
        .from('messages')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      const avgResponseTime = this.calculateAverageResponseTime(recentMessages || []);

      // Calculate satisfaction score
      const satisfactionScores = conversations
        ?.filter(conv => conv.satisfaction_rating)
        .map(conv => conv.satisfaction_rating) || [];
      
      const satisfactionScore = satisfactionScores.length > 0 
        ? satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length 
        : 0;

      // Calculate AI resolution rate
      const { data: recentConversations } = await supabase
        .from('conversations')
        .select('resolved_by')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const aiResolutionRate = this.calculateAIResolutionRate(recentConversations || []);

      // Calculate agent productivity
      const agentProductivity = this.calculateAgentProductivity();

      // Get channel activity
      const channelActivity = await this.getChannelActivity();

      const liveMetrics: LiveMetrics = {
        activeConversations,
        avgResponseTime,
        satisfactionScore,
        aiResolutionRate,
        agentProductivity,
        channelActivity,
        lastUpdated: new Date()
      };

      // Notify subscribers
      this.notifySubscribers(liveMetrics);

      return liveMetrics;
    } catch (error) {
      console.error('Error getting live metrics:', error);
      throw error;
    }
  }

  async getActiveConversations(): Promise<ConversationSummary[]> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          id,
          customer_name,
          channel_type,
          status,
          created_at,
          satisfaction_rating,
          profiles!conversations_agent_id(name)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Error fetching active conversations: ${error.message}`);
      }

      return (conversations || []).map(conv => ({
        id: conv.id,
        customerName: conv.customer_name || 'Anonymous',
        channel: conv.channel_type || 'website',
        status: conv.status,
        duration: Math.floor((Date.now() - new Date(conv.created_at).getTime()) / 1000),
        satisfaction: conv.satisfaction_rating,
        agentName: (conv.profiles as any)?.name
      }));
    } catch (error) {
      console.error('Error getting active conversations:', error);
      throw error;
    }
  }

  async getAgentPerformance(): Promise<AgentMetrics[]> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      // Get agent metrics from daily_metrics
      const { data: agentMetrics, error } = await supabase
        .from('daily_metrics')
        .select(`
          agent_id,
          total_conversations,
          avg_first_response_time_seconds,
          avg_satisfaction_score,
          profiles!daily_metrics_agent_id(name)
        `)
        .not('agent_id', 'is', null)
        .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      if (error) {
        throw new Error(`Error fetching agent performance: ${error.message}`);
      }

      // Aggregate metrics by agent
      const agentMap = new Map<string, AgentMetrics>();

      agentMetrics?.forEach(metric => {
        if (!metric.agent_id) return;

        if (!agentMap.has(metric.agent_id)) {
          agentMap.set(metric.agent_id, {
            id: metric.agent_id,
            name: (metric.profiles as any)?.name || 'Unknown Agent',
            activeConversations: 0,
            avgResponseTime: 0,
            satisfactionScore: 0,
            resolutionRate: 0,
            productivity: 0
          });
        }

        const agent = agentMap.get(metric.agent_id)!;
        agent.activeConversations += metric.total_conversations || 0;
        agent.avgResponseTime = (agent.avgResponseTime + (metric.avg_first_response_time_seconds || 0)) / 2;
        agent.satisfactionScore = (agent.satisfactionScore + (metric.avg_satisfaction_score || 0)) / 2;
      });

      // Get active conversations for each agent
      const { data: activeConversations } = await supabase
        .from('conversations')
        .select('agent_id')
        .eq('status', 'active');

      activeConversations?.forEach(conv => {
        if (conv.agent_id && agentMap.has(conv.agent_id)) {
          agentMap.get(conv.agent_id)!.activeConversations++;
        }
      });

      return Array.from(agentMap.values());
    } catch (error) {
      console.error('Error getting agent performance:', error);
      throw error;
    }
  }

  async getChannelActivity(): Promise<ChannelActivity[]> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('channel_type, status, created_at, satisfaction_rating')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) {
        throw new Error(`Error fetching channel activity: ${error.message}`);
      }

      // Group by channel
      const channelMap = new Map<string, ChannelActivity>();

      conversations?.forEach(conv => {
        const channel = conv.channel_type || 'website';
        
        if (!channelMap.has(channel)) {
          channelMap.set(channel, {
            channel,
            activeConversations: 0,
            avgResponseTime: 0,
            satisfactionScore: 0,
            volume: 0
          });
        }

        const channelActivity = channelMap.get(channel)!;
        channelActivity.volume++;
        
        if (conv.status === 'active') {
          channelActivity.activeConversations++;
        }

        if (conv.satisfaction_rating) {
          channelActivity.satisfactionScore = (channelActivity.satisfactionScore + conv.satisfaction_rating) / 2;
        }
      });

      return Array.from(channelMap.values());
    } catch (error) {
      console.error('Error getting channel activity:', error);
      throw error;
    }
  }

  async subscribeToMetrics(callback: (metrics: LiveMetrics) => void): Promise<string> {
    const subscriptionId = `metrics-${Date.now()}-${Math.random()}`;
    this.subscribers.set(subscriptionId, callback);
    
    // Send initial metrics
    const initialMetrics = await this.getLiveMetrics();
    callback(initialMetrics);
    
    return subscriptionId;
  }

  unsubscribeFromMetrics(subscriptionId: string): void {
    this.subscribers.delete(subscriptionId);
  }

  async calculateSLA(conversationId: string): Promise<SLAStatus> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      const { data: conversation, error } = await supabase
        .from('conversations')
        .select('created_at, first_response_at, status')
        .eq('id', conversationId)
        .single();

      if (error || !conversation) {
        throw new Error('Conversation not found');
      }

      const startTime = new Date(conversation.created_at).getTime();
      const firstResponseTime = conversation.first_response_at 
        ? new Date(conversation.first_response_at).getTime() 
        : null;
      
      const currentTime = Date.now();
      const elapsedTime = (currentTime - startTime) / 1000; // seconds
      
      // Define SLA thresholds (in seconds)
      const firstResponseSLA = 300; // 5 minutes
      const resolutionSLA = 3600; // 1 hour
      
      let slaType = 'first_response';
      let targetTime = firstResponseSLA;
      let actualTime = firstResponseTime ? (firstResponseTime - startTime) / 1000 : elapsedTime;
      
      if (conversation.status === 'resolved') {
        slaType = 'resolution';
        targetTime = resolutionSLA;
        actualTime = elapsedTime;
      }

      let status: 'on_track' | 'at_risk' | 'breached';
      const remainingTime = targetTime - actualTime;
      
      if (remainingTime > 0) {
        status = remainingTime > targetTime * 0.5 ? 'on_track' : 'at_risk';
      } else {
        status = 'breached';
      }

      return {
        conversationId,
        slaType,
        targetTime,
        actualTime,
        status,
        remainingTime: Math.max(0, remainingTime)
      };
    } catch (error) {
      console.error('Error calculating SLA:', error);
      throw error;
    }
  }

  private startPeriodicUpdates(): void {
    this.updateInterval = setInterval(async () => {
      try {
        await this.getLiveMetrics();
      } catch (error) {
        console.error('Error in periodic metrics update:', error);
      }
    }, 30000); // Update every 30 seconds
  }

  private notifySubscribers(metrics: LiveMetrics): void {
    this.subscribers.forEach(callback => {
      try {
        callback(metrics);
      } catch (error) {
        console.error('Error notifying metrics subscriber:', error);
      }
    });
  }

  private calculateAverageResponseTime(messages: any[]): number {
    if (messages.length < 2) return 0;

    let totalResponseTime = 0;
    let responseCount = 0;

    for (let i = 1; i < messages.length; i++) {
      const currentMessage = messages[i];
      const previousMessage = messages[i - 1];
      
      // Calculate time between messages
      const responseTime = (new Date(currentMessage.created_at).getTime() - new Date(previousMessage.created_at).getTime()) / 1000;
      
      if (responseTime > 0 && responseTime < 3600) { // Filter out unreasonable response times
        totalResponseTime += responseTime;
        responseCount++;
      }
    }

    return responseCount > 0 ? totalResponseTime / responseCount : 0;
  }

  private calculateAIResolutionRate(conversations: any[]): number {
    if (conversations.length === 0) return 0;

    const aiResolved = conversations.filter(conv => conv.resolved_by === 'ai').length;
    const totalResolved = conversations.filter(conv => conv.resolved_by).length;

    return totalResolved > 0 ? aiResolved / totalResolved : 0;
  }

  private calculateAgentProductivity(): number {
    // Simple productivity calculation based on active conversations and response times
    // In a real implementation, this would be more sophisticated
    return 0.85; // Placeholder value
  }

  destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.subscribers.clear();
  }
}

export const realtimeAnalytics = RealtimeAnalytics.getInstance(); 