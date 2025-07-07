import { supabase } from './supabaseClient';

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  isTyping: boolean;
  timestamp: Date;
}

export interface ReadReceipt {
  messageId: string;
  readBy: string;
  readAt: Date;
}

export interface AgentNotification {
  type: 'conversation_assigned' | 'conversation_transferred' | 'escalation' | 'sla_breach';
  agentId: string;
  conversationId: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export class RealtimeService {
  private static instance: RealtimeService;
  private channels: Map<string, any> = new Map();

  static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  async sendTypingIndicator(conversationId: string, isTyping: boolean): Promise<void> {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }

      const channel = this.getOrCreateChannel(`typing:${conversationId}`);
      
      await channel.send({
        type: 'broadcast',
        event: 'typing_indicator',
        payload: {
          conversationId,
          isTyping,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  }

  async markMessageAsRead(messageId: string, readBy: string): Promise<void> {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }

      // Update message read status in database
      const { error } = await supabase
        .from('messages')
        .update({
          read_by: readBy,
          read_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) throw error;

      // Broadcast read receipt
      const { data: message } = await supabase
        .from('messages')
        .select('conversation_id')
        .eq('id', messageId)
        .single();

      if (message) {
        const channel = this.getOrCreateChannel(`read_receipts:${message.conversation_id}`);
        
        await channel.send({
          type: 'broadcast',
          event: 'message_read',
          payload: {
            messageId,
            readBy,
            readAt: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  async notifyAgentAssignment(agentId: string, conversationId: string): Promise<void> {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }

      // Get conversation details
      const { data: conversation } = await supabase
        .from('conversations')
        .select('user_name, user_email, priority, department')
        .eq('id', conversationId)
        .single();

      if (conversation) {
        const channel = this.getOrCreateChannel(`agent_notifications:${agentId}`);
        
        await channel.send({
          type: 'broadcast',
          event: 'conversation_assigned',
          payload: {
            conversationId,
            agentId,
            conversation,
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error('Error notifying agent assignment:', error);
    }
  }

  async broadcastAgentStatus(agentId: string, status: any): Promise<void> {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }

      const channel = this.getOrCreateChannel('agent_status');
      
      await channel.send({
        type: 'broadcast',
        event: 'agent_status_changed',
        payload: {
          agentId,
          status,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error broadcasting agent status:', error);
    }
  }

  async subscribeToConversation(conversationId: string, callback: (payload: any) => void): Promise<void> {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }

      const channel = supabase.channel(`conversation:${conversationId}`)
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
          callback
        )
        .on('broadcast', { event: 'typing_indicator' }, callback)
        .on('broadcast', { event: 'message_read' }, callback)
        .subscribe();

      this.channels.set(`conversation:${conversationId}`, channel);
    } catch (error) {
      console.error('Error subscribing to conversation:', error);
    }
  }

  async subscribeToAgentNotifications(agentId: string, callback: (payload: any) => void): Promise<void> {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }

      const channel = supabase.channel(`agent_notifications:${agentId}`)
        .on('broadcast', { event: 'conversation_assigned' }, callback)
        .on('broadcast', { event: 'conversation_transferred' }, callback)
        .on('broadcast', { event: 'escalation' }, callback)
        .on('broadcast', { event: 'sla_breach' }, callback)
        .subscribe();

      this.channels.set(`agent_notifications:${agentId}`, channel);
    } catch (error) {
      console.error('Error subscribing to agent notifications:', error);
    }
  }

  async subscribeToAgentStatus(callback: (payload: any) => void): Promise<void> {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }

      const channel = supabase.channel('agent_status')
        .on('broadcast', { event: 'agent_status_changed' }, callback)
        .subscribe();

      this.channels.set('agent_status', channel);
    } catch (error) {
      console.error('Error subscribing to agent status:', error);
    }
  }

  async sendEscalationNotification(agentId: string, conversationId: string, escalationType: string): Promise<void> {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }

      const channel = this.getOrCreateChannel(`agent_notifications:${agentId}`);
      
      await channel.send({
        type: 'broadcast',
        event: 'escalation',
        payload: {
          conversationId,
          agentId,
          escalationType,
          timestamp: new Date().toISOString(),
          priority: 'high'
        }
      });
    } catch (error) {
      console.error('Error sending escalation notification:', error);
    }
  }

  async sendSLABreachNotification(agentId: string, conversationId: string, slaType: string): Promise<void> {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }

      const channel = this.getOrCreateChannel(`agent_notifications:${agentId}`);
      
      await channel.send({
        type: 'broadcast',
        event: 'sla_breach',
        payload: {
          conversationId,
          agentId,
          slaType,
          timestamp: new Date().toISOString(),
          priority: 'urgent'
        }
      });
    } catch (error) {
      console.error('Error sending SLA breach notification:', error);
    }
  }

  async sendTransferNotification(fromAgentId: string, toAgentId: string, conversationId: string): Promise<void> {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }

      // Notify both agents
      const fromChannel = this.getOrCreateChannel(`agent_notifications:${fromAgentId}`);
      const toChannel = this.getOrCreateChannel(`agent_notifications:${toAgentId}`);
      
      const transferPayload = {
        conversationId,
        fromAgentId,
        toAgentId,
        timestamp: new Date().toISOString(),
        priority: 'normal'
      };

      await fromChannel.send({
        type: 'broadcast',
        event: 'conversation_transferred',
        payload: { ...transferPayload, type: 'transferred_from' }
      });

      await toChannel.send({
        type: 'broadcast',
        event: 'conversation_transferred',
        payload: { ...transferPayload, type: 'transferred_to' }
      });
    } catch (error) {
      console.error('Error sending transfer notification:', error);
    }
  }

  private getOrCreateChannel(channelName: string): any {
    if (!this.channels.has(channelName)) {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      const channel = supabase.channel(channelName);
      this.channels.set(channelName, channel);
    }
    
    return this.channels.get(channelName);
  }

  unsubscribeFromChannel(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(channelName);
    }
  }

  unsubscribeFromAllChannels(): void {
    for (const [channelName, channel] of this.channels) {
      channel.unsubscribe();
    }
    this.channels.clear();
  }

  // Utility method to check if a channel is subscribed
  isSubscribed(channelName: string): boolean {
    return this.channels.has(channelName);
  }

  // Get all active channel names
  getActiveChannels(): string[] {
    return Array.from(this.channels.keys());
  }
}

export const realtimeService = RealtimeService.getInstance(); 