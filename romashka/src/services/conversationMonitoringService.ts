import { supabase } from './supabaseClient';

export interface ConversationMetrics {
  id: string;
  conversation_id: string;
  ai_handled: boolean;
  escalated_to_human: boolean;
  customer_satisfaction?: number;
  response_time_ms: number;
  message_count: number;
  resolution_status: 'resolved' | 'pending' | 'escalated' | 'abandoned';
  session_start: string;
  session_end?: string;
  created_at: string;
  updated_at: string;
}

export interface AIPerformanceMetrics {
  total_conversations: number;
  ai_handled_conversations: number;
  escalated_conversations: number;
  abandoned_conversations: number;
  ai_success_rate: number;
  average_response_time: number;
  average_satisfaction_score: number;
  top_escalation_reasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
  hourly_distribution: Array<{
    hour: number;
    conversation_count: number;
    ai_success_rate: number;
  }>;
  daily_trends: Array<{
    date: string;
    conversations: number;
    ai_handled: number;
    escalated: number;
    satisfaction: number;
  }>;
}

export class ConversationMonitoringService {
  // Record a new conversation session
  static async recordConversationStart(conversationId: string): Promise<ConversationMetrics | null> {
    try {
      const { data, error } = await supabase
        .from('conversation_metrics')
        .insert([{
          conversation_id: conversationId,
          ai_handled: false,
          escalated_to_human: false,
          response_time_ms: 0,
          message_count: 0,
          resolution_status: 'pending',
          session_start: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error recording conversation start:', error);
      return null;
    }
  }

  // Update conversation metrics
  static async updateConversationMetrics(
    conversationId: string, 
    updates: Partial<ConversationMetrics>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('conversation_metrics')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('conversation_id', conversationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating conversation metrics:', error);
      return false;
    }
  }

  // Record AI response
  static async recordAIResponse(
    conversationId: string, 
    responseTime: number,
    isSuccessful: boolean
  ): Promise<boolean> {
    try {
      // Get current metrics
      const { data: current } = await supabase
        .from('conversation_metrics')
        .select('message_count, response_time_ms')
        .eq('conversation_id', conversationId)
        .single();

      if (current) {
        const newMessageCount = current.message_count + 1;
        const averageResponseTime = ((current.response_time_ms * (newMessageCount - 1)) + responseTime) / newMessageCount;

        await this.updateConversationMetrics(conversationId, {
          ai_handled: true,
          message_count: newMessageCount,
          response_time_ms: Math.round(averageResponseTime),
          resolution_status: isSuccessful ? 'resolved' : 'pending'
        });
      }

      return true;
    } catch (error) {
      console.error('Error recording AI response:', error);
      return false;
    }
  }

  // Record human escalation
  static async recordHumanEscalation(
    conversationId: string, 
    escalationReason: string
  ): Promise<boolean> {
    try {
      await this.updateConversationMetrics(conversationId, {
        escalated_to_human: true,
        resolution_status: 'escalated'
      });

      // Also record the escalation reason
      await supabase
        .from('escalation_reasons')
        .insert([{
          conversation_id: conversationId,
          reason: escalationReason,
          created_at: new Date().toISOString()
        }]);

      return true;
    } catch (error) {
      console.error('Error recording human escalation:', error);
      return false;
    }
  }

  // Record customer satisfaction
  static async recordCustomerSatisfaction(
    conversationId: string, 
    satisfaction: number
  ): Promise<boolean> {
    try {
      return await this.updateConversationMetrics(conversationId, {
        customer_satisfaction: satisfaction
      });
    } catch (error) {
      console.error('Error recording customer satisfaction:', error);
      return false;
    }
  }

  // End conversation session
  static async endConversationSession(
    conversationId: string, 
    finalStatus: ConversationMetrics['resolution_status']
  ): Promise<boolean> {
    try {
      return await this.updateConversationMetrics(conversationId, {
        session_end: new Date().toISOString(),
        resolution_status: finalStatus
      });
    } catch (error) {
      console.error('Error ending conversation session:', error);
      return false;
    }
  }

  // Get AI performance metrics
  static async getAIPerformanceMetrics(
    startDate?: string,
    endDate?: string
  ): Promise<AIPerformanceMetrics> {
    try {
      let query = supabase
        .from('conversation_metrics')
        .select('*');

      if (startDate) {
        query = query.gte('session_start', startDate);
      }
      if (endDate) {
        query = query.lte('session_start', endDate);
      }

      const { data: conversations, error } = await query;

      if (error) throw error;

      const total = conversations?.length || 0;
      if (total === 0) {
        return this.getEmptyMetrics();
      }

      // Calculate basic metrics
      const aiHandled = conversations?.filter(c => c.ai_handled && !c.escalated_to_human).length || 0;
      const escalated = conversations?.filter(c => c.escalated_to_human).length || 0;
      const abandoned = conversations?.filter(c => c.resolution_status === 'abandoned').length || 0;

      const aiSuccessRate = total > 0 ? (aiHandled / total) * 100 : 0;

      // Calculate average response time (only for AI handled conversations)
      const aiConversations = conversations?.filter(c => c.ai_handled && c.response_time_ms > 0) || [];
      const averageResponseTime = aiConversations.length > 0 
        ? aiConversations.reduce((sum, c) => sum + c.response_time_ms, 0) / aiConversations.length
        : 0;

      // Calculate average satisfaction
      const satisfactionConversations = conversations?.filter(c => c.customer_satisfaction !== null) || [];
      const averageSatisfactionScore = satisfactionConversations.length > 0
        ? satisfactionConversations.reduce((sum, c) => sum + (c.customer_satisfaction || 0), 0) / satisfactionConversations.length
        : 0;

      // Get escalation reasons
      const { data: escalationReasons } = await supabase
        .from('escalation_reasons')
        .select('reason')
        .in('conversation_id', conversations?.map(c => c.conversation_id) || []);

      const reasonCounts = escalationReasons?.reduce((acc, er) => {
        acc[er.reason] = (acc[er.reason] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const topEscalationReasons = Object.entries(reasonCounts)
        .map(([reason, count]) => ({
          reason,
          count,
          percentage: (count / escalated) * 100
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate hourly distribution
      const hourlyData = Array.from({ length: 24 }, (_, hour) => {
        const hourConversations = conversations?.filter(c => {
          const sessionHour = new Date(c.session_start).getHours();
          return sessionHour === hour;
        }) || [];

        const hourAiHandled = hourConversations.filter(c => c.ai_handled && !c.escalated_to_human).length;

        return {
          hour,
          conversation_count: hourConversations.length,
          ai_success_rate: hourConversations.length > 0 ? (hourAiHandled / hourConversations.length) * 100 : 0
        };
      });

      // Calculate daily trends (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const dailyTrends = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(thirtyDaysAgo);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        const dayConversations = conversations?.filter(c => {
          const sessionDate = c.session_start.split('T')[0];
          return sessionDate === dateStr;
        }) || [];

        const dayAiHandled = dayConversations.filter(c => c.ai_handled && !c.escalated_to_human).length;
        const dayEscalated = dayConversations.filter(c => c.escalated_to_human).length;
        const daySatisfaction = dayConversations
          .filter(c => c.customer_satisfaction !== null)
          .reduce((sum, c) => sum + (c.customer_satisfaction || 0), 0) / Math.max(dayConversations.filter(c => c.customer_satisfaction !== null).length, 1);

        return {
          date: dateStr,
          conversations: dayConversations.length,
          ai_handled: dayAiHandled,
          escalated: dayEscalated,
          satisfaction: isNaN(daySatisfaction) ? 0 : daySatisfaction
        };
      });

      return {
        total_conversations: total,
        ai_handled_conversations: aiHandled,
        escalated_conversations: escalated,
        abandoned_conversations: abandoned,
        ai_success_rate: aiSuccessRate,
        average_response_time: Math.round(averageResponseTime),
        average_satisfaction_score: Math.round(averageSatisfactionScore * 10) / 10,
        top_escalation_reasons: topEscalationReasons,
        hourly_distribution: hourlyData,
        daily_trends: dailyTrends
      };

    } catch (error) {
      console.error('Error fetching AI performance metrics:', error);
      return this.getEmptyMetrics();
    }
  }

  // Get conversation details
  static async getConversationDetails(conversationId: string): Promise<ConversationMetrics | null> {
    try {
      const { data, error } = await supabase
        .from('conversation_metrics')
        .select('*')
        .eq('conversation_id', conversationId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching conversation details:', error);
      return null;
    }
  }

  // Get recent conversations
  static async getRecentConversations(limit: number = 50): Promise<ConversationMetrics[]> {
    try {
      const { data, error } = await supabase
        .from('conversation_metrics')
        .select('*')
        .order('session_start', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recent conversations:', error);
      return [];
    }
  }

  // Helper method for empty metrics
  private static getEmptyMetrics(): AIPerformanceMetrics {
    return {
      total_conversations: 0,
      ai_handled_conversations: 0,
      escalated_conversations: 0,
      abandoned_conversations: 0,
      ai_success_rate: 0,
      average_response_time: 0,
      average_satisfaction_score: 0,
      top_escalation_reasons: [],
      hourly_distribution: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        conversation_count: 0,
        ai_success_rate: 0
      })),
      daily_trends: Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - 29 + i);
        return {
          date: date.toISOString().split('T')[0],
          conversations: 0,
          ai_handled: 0,
          escalated: 0,
          satisfaction: 0
        };
      })
    };
  }

  // Real-time conversation tracking
  static subscribeToConversationUpdates(callback: (payload: any) => void) {
    return supabase
      .channel('conversation-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_metrics'
        },
        callback
      )
      .subscribe();
  }

  // Unsubscribe from real-time updates
  static unsubscribeFromConversationUpdates(subscription: any) {
    return supabase.removeChannel(subscription);
  }
}

export default ConversationMonitoringService;