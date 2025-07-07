import { supabase } from '../supabaseClient';
import type { MetricEvent } from '../../types/analytics';

export class MetricsCollector {
  private static instance: MetricsCollector;
  private eventQueue: MetricEvent[] = [];
  private batchSize = 50;
  private flushInterval = 5000; // 5 seconds

  private constructor() {
    this.startPeriodicFlush();
  }

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  async recordEvent(event: MetricEvent): Promise<void> {
    try {
      // Add to queue for batch processing
      this.eventQueue.push(event);

      // Flush if queue is full
      if (this.eventQueue.length >= this.batchSize) {
        await this.flushQueue();
      }
    } catch (error) {
      console.error('Error recording metric event:', error);
    }
  }

  async recordConversationStart(conversationId: string, channel: string): Promise<void> {
    await this.recordEvent({
      type: 'conversation_started',
      value: 1,
      dimensions: { conversationId, channel },
      timestamp: new Date(),
      conversationId
    });
  }

  async recordFirstResponse(conversationId: string, responseType: 'ai' | 'human', responseTimeSeconds: number): Promise<void> {
    await this.recordEvent({
      type: 'first_response',
      value: responseTimeSeconds,
      dimensions: { conversationId, responseType },
      timestamp: new Date(),
      conversationId
    });
  }

  async recordConversationEnd(conversationId: string, resolution: string, durationSeconds: number): Promise<void> {
    await this.recordEvent({
      type: 'conversation_ended',
      value: durationSeconds,
      dimensions: { conversationId, resolution },
      timestamp: new Date(),
      conversationId
    });
  }

  async recordSatisfactionRating(conversationId: string, rating: number): Promise<void> {
    await this.recordEvent({
      type: 'satisfaction_rating',
      value: rating,
      dimensions: { conversationId },
      timestamp: new Date(),
      conversationId
    });
  }

  async recordHandoff(conversationId: string, reason: string): Promise<void> {
    await this.recordEvent({
      type: 'handoff',
      value: 1,
      dimensions: { conversationId, reason },
      timestamp: new Date(),
      conversationId
    });
  }

  async recordRevenueAttribution(conversationId: string, amount: number): Promise<void> {
    await this.recordEvent({
      type: 'revenue_attribution',
      value: amount,
      dimensions: { conversationId },
      timestamp: new Date(),
      conversationId
    });
  }

  async recordAIPerformance(conversationId: string, confidence: number, accuracy: number): Promise<void> {
    await this.recordEvent({
      type: 'ai_performance',
      value: confidence,
      dimensions: { conversationId, accuracy },
      timestamp: new Date(),
      conversationId
    });
  }

  async recordAgentActivity(agentId: string, activity: string, value: number = 1): Promise<void> {
    await this.recordEvent({
      type: 'agent_activity',
      value,
      dimensions: { agentId, activity },
      timestamp: new Date(),
      userId: agentId
    });
  }

  async recordChannelActivity(channel: string, activity: string, value: number = 1): Promise<void> {
    await this.recordEvent({
      type: 'channel_activity',
      value,
      dimensions: { channel, activity },
      timestamp: new Date()
    });
  }

  async recordBusinessMetric(metric: string, value: number, dimensions: Record<string, any> = {}): Promise<void> {
    await this.recordEvent({
      type: 'business_metric',
      value,
      dimensions: { metric, ...dimensions },
      timestamp: new Date()
    });
  }

  private async flushQueue(): Promise<void> {
    if (this.eventQueue.length === 0 || !supabase) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Store events in realtime_metrics table
      const { error } = await supabase
        .from('realtime_metrics')
        .insert(events.map(event => ({
          metric_name: event.type,
          metric_value: event.value,
          dimensions: event.dimensions,
          timestamp: event.timestamp.toISOString()
        })));

      if (error) {
        console.error('Error flushing metrics queue:', error);
        // Re-add events to queue for retry
        this.eventQueue.unshift(...events);
      }
    } catch (error) {
      console.error('Error flushing metrics queue:', error);
      // Re-add events to queue for retry
      this.eventQueue.unshift(...events);
    }
  }

  private startPeriodicFlush(): void {
    setInterval(() => {
      this.flushQueue();
    }, this.flushInterval);
  }

  // Update daily metrics aggregation
  async updateDailyMetrics(date: Date = new Date()): Promise<void> {
    if (!supabase) return;
    
    try {
      const dateStr = date.toISOString().split('T')[0];

      // Aggregate conversation metrics
      const { data: conversationMetrics, error: convError } = await supabase
        .from('conversations')
        .select('channel_type, resolved_by, created_at, resolved_at')
        .gte('created_at', `${dateStr}T00:00:00`)
        .lt('created_at', `${dateStr}T23:59:59`);

      if (convError) {
        console.error('Error fetching conversation metrics:', convError);
        return;
      }

      // Calculate metrics by channel and department
      const metricsByChannel: Record<string, any> = {};

      conversationMetrics?.forEach(conv => {
        const channel = conv.channel_type || 'website';
        if (!metricsByChannel[channel]) {
          metricsByChannel[channel] = {
            total_conversations: 0,
            ai_resolved_conversations: 0,
            human_resolved_conversations: 0,
            abandoned_conversations: 0
          };
        }

        metricsByChannel[channel].total_conversations++;
        
        if (conv.resolved_by === 'ai') {
          metricsByChannel[channel].ai_resolved_conversations++;
        } else if (conv.resolved_by === 'agent') {
          metricsByChannel[channel].human_resolved_conversations++;
        } else {
          metricsByChannel[channel].abandoned_conversations++;
        }
      });

      // Update daily_metrics table
      for (const [channel, metrics] of Object.entries(metricsByChannel)) {
        const { error } = await supabase
          .from('daily_metrics')
          .upsert({
            date: dateStr,
            channel_type: channel,
            ...metrics
          }, {
            onConflict: 'date,channel_type'
          });

        if (error) {
          console.error(`Error updating daily metrics for ${channel}:`, error);
        }
      }
    } catch (error) {
      console.error('Error updating daily metrics:', error);
    }
  }

  // Update conversation analytics
  async updateConversationAnalytics(conversationId: string): Promise<void> {
    if (!supabase) return;
    
    try {
      // Get conversation data
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (convError || !conversation) {
        console.error('Error fetching conversation:', convError);
        return;
      }

      // Get messages for this conversation
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (msgError) {
        console.error('Error fetching messages:', msgError);
        return;
      }

      // Calculate analytics
      const analytics = {
        conversation_id: conversationId,
        started_at: conversation.created_at,
        first_response_at: messages?.[0]?.created_at,
        resolved_at: conversation.resolved_at,
        total_duration_seconds: conversation.resolved_at 
          ? Math.floor((new Date(conversation.resolved_at).getTime() - new Date(conversation.created_at).getTime()) / 1000)
          : null,
        total_messages: messages?.length || 0,
        customer_messages: messages?.filter(m => m.sender_type === 'customer').length || 0,
        ai_messages: messages?.filter(m => m.sender_type === 'ai').length || 0,
        agent_messages: messages?.filter(m => m.sender_type === 'agent').length || 0,
        resolved_by: conversation.resolved_by,
        resolution_type: conversation.status,
        handoff_count: messages?.filter(m => m.content?.includes('handoff')).length || 0,
        agent_switches: 0, // TODO: Calculate based on agent changes
        customer_satisfaction: conversation.satisfaction_rating,
        ai_accuracy_score: null, // TODO: Calculate based on AI performance
        knowledge_items_used: 0, // TODO: Calculate based on knowledge base usage
        lead_qualified: conversation.lead_qualified || false,
        revenue_generated: conversation.revenue_generated || 0,
        follow_up_required: conversation.follow_up_required || false
      };

      // Update conversation_analytics table
      const { error } = await supabase
        .from('conversation_analytics')
        .upsert(analytics, {
          onConflict: 'conversation_id'
        });

      if (error) {
        console.error('Error updating conversation analytics:', error);
      }
    } catch (error) {
      console.error('Error updating conversation analytics:', error);
    }
  }
}

export const metricsCollector = MetricsCollector.getInstance(); 