import { supabase } from '../../lib/supabase';
import { aiService } from '../aiService';
import { channelManager } from '../channels/channelManager';
import type { UnifiedConversation, MessageContent, ChannelType } from '../channels/types';

export interface IncomingMessage {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'ai' | 'agent';
  content: string;
  channel_type: ChannelType;
  external_message_id?: string;
  metadata?: any;
  created_at: string;
}

export interface ConversationContext {
  conversation_id: string;
  customer_id?: string;
  channel_type: ChannelType;
  language: string;
  previous_messages: IncomingMessage[];
  customer_profile?: any;
  intent?: string;
  sentiment?: string;
}

export interface AIResponse {
  response: string;
  confidence: number;
  requiresHuman: boolean;
  responseTime: number;
  intent?: string;
  sentiment?: string;
  knowledgeUsed?: string[];
}

export interface ConversationSubscription {
  id: string;
  unsubscribe: () => void;
}

export interface MessagePerformanceMetrics {
  messageId: string;
  conversationId: string;
  responseTime: number;
  aiConfidence: number;
  requiresHuman: boolean;
  channelType: ChannelType;
  timestamp: string;
}

/**
 * Enhanced Real-Time Messaging Service using Database Functions
 * Now connects to the database functions we created in migration 012
 */
export class EnhancedRealtimeMessagingService {
  private subscriptions: Map<string, ConversationSubscription> = new Map();
  private responseQueue: Map<string, Promise<AIResponse>> = new Map();
  private performanceMetrics: MessagePerformanceMetrics[] = [];
  private aiResponseTimeout: number = 5500; // 5.5 seconds to guarantee <6 second response

  /**
   * Create a new conversation using our database function
   */
  public async createConversation(
    customerIdentifier: string,
    channelType: ChannelType,
    initialMessage?: string
  ): Promise<UnifiedConversation> {
    try {
      // Use our database function to create conversation
      const { data: conversationId, error } = await supabase
        .rpc('create_conversation', {
          customer_identifier: customerIdentifier,
          channel_type: channelType,
          initial_message: initialMessage || ''
        });

      if (error) throw error;

      // Get the full conversation data
      const { data: conversation, error: fetchError } = await supabase
        .from('conversations')
        .select(`
          *,
          customer_profiles (
            id,
            name,
            email,
            phone,
            preferences,
            satisfaction_rating
          )
        `)
        .eq('id', conversationId)
        .single();

      if (fetchError) throw fetchError;

      // Transform to UnifiedConversation format
      return this.transformToUnifiedConversation(conversation);
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  /**
   * Get conversations with real-time data
   */
  public async getConversations(): Promise<UnifiedConversation[]> {
    try {
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          customer_profiles (
            id,
            name,
            email,
            phone,
            preferences,
            satisfaction_rating
          )
        `)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      return conversations.map(conv => this.transformToUnifiedConversation(conv));
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  /**
   * Get conversation with messages using our database function
   */
  public async getConversationWithMessages(
    conversationId: string,
    messageLimit: number = 50
  ): Promise<{ conversation: UnifiedConversation; messages: IncomingMessage[] }> {
    try {
      const { data, error } = await supabase
        .rpc('get_conversation_with_messages', {
          conversation_id: conversationId,
          message_limit: messageLimit
        });

      if (error) throw error;

      const { conversation_data, messages_data } = data[0];

      return {
        conversation: this.transformToUnifiedConversation(conversation_data),
        messages: messages_data.map((msg: any) => this.transformToIncomingMessage(msg))
      };
    } catch (error) {
      console.error('Error fetching conversation with messages:', error);
      throw error;
    }
  }

  /**
   * Send message - now uses our database trigger system
   */
  public async sendMessage(
    message: string,
    conversationId: string,
    senderType: 'user' | 'agent' = 'user'
  ): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      // Insert message - this will trigger our handle_new_message() function
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_type: senderType,
          content: message,
          delivery_status: 'sent',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // For user messages, wait for AI response from our queue system
      if (senderType === 'user') {
        return await this.waitForAIResponse(conversationId, startTime);
      }

      return {
        response: message,
        confidence: 1.0,
        requiresHuman: false,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Wait for AI response from our queue system
   */
  private async waitForAIResponse(conversationId: string, startTime: number): Promise<AIResponse> {
    const pollInterval = 100; // Check every 100ms
    const maxWaitTime = this.aiResponseTimeout;
    let elapsedTime = 0;

    while (elapsedTime < maxWaitTime) {
      try {
        // Check if AI response is ready in queue
        const { data: aiJob, error } = await supabase
          .from('ai_response_queue')
          .select('*')
          .eq('conversation_id', conversationId)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) throw error;

        if (aiJob && aiJob.length > 0) {
          const job = aiJob[0];
          
          // Insert AI response as message
          await supabase
            .from('messages')
            .insert({
              conversation_id: conversationId,
              sender_type: 'ai',
              content: job.ai_response,
              delivery_status: 'delivered',
              confidence_score: job.confidence_score,
              processing_time_ms: job.processing_time_ms,
              created_at: new Date().toISOString()
            });

          return {
            response: job.ai_response,
            confidence: job.confidence_score || 0.8,
            requiresHuman: job.requires_human || false,
            responseTime: Date.now() - startTime
          };
        }

        // Wait and try again
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        elapsedTime += pollInterval;
      } catch (error) {
        console.error('Error waiting for AI response:', error);
        break;
      }
    }

    // Timeout fallback
    return {
      response: "I'm processing your request. Please give me a moment to provide you with the best possible answer.",
      confidence: 0.5,
      requiresHuman: true,
      responseTime: Date.now() - startTime
    };
  }

  /**
   * Get performance metrics using our database function
   */
  public async getPerformanceMetrics(timeWindowMinutes: number = 60): Promise<any> {
    try {
      const { data, error } = await supabase
        .rpc('get_realtime_messaging_metrics', {
          time_window_minutes: timeWindowMinutes
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time conversation updates
   */
  public subscribeToConversation(
    conversationId: string,
    onMessage: (message: IncomingMessage) => void,
    onError?: (error: Error) => void
  ): ConversationSubscription {
    try {
      // Subscribe to new messages
      const messageSubscription = supabase
        .channel(`conversation:${conversationId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        }, (payload) => {
          const message = this.transformToIncomingMessage(payload.new);
          onMessage(message);
        })
        .subscribe();

      const conversationSub: ConversationSubscription = {
        id: conversationId,
        unsubscribe: () => {
          messageSubscription.unsubscribe();
          this.subscriptions.delete(conversationId);
        }
      };

      this.subscriptions.set(conversationId, conversationSub);
      return conversationSub;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to subscribe to conversation');
      onError?.(err);
      throw err;
    }
  }

  /**
   * Subscribe to all conversations for inbox updates
   */
  public subscribeToAllConversations(
    onConversationUpdate: (conversation: UnifiedConversation) => void,
    onError?: (error: Error) => void
  ): ConversationSubscription {
    try {
      const conversationSubscription = supabase
        .channel('all-conversations')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'conversations'
        }, (payload) => {
          const conversation = this.transformToUnifiedConversation(payload.new);
          onConversationUpdate(conversation);
        })
        .subscribe();

      const sub: ConversationSubscription = {
        id: 'all-conversations',
        unsubscribe: () => {
          conversationSubscription.unsubscribe();
          this.subscriptions.delete('all-conversations');
        }
      };

      this.subscriptions.set('all-conversations', sub);
      return sub;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to subscribe to conversations');
      onError?.(err);
      throw err;
    }
  }

  /**
   * Transform database conversation to UnifiedConversation
   */
  private transformToUnifiedConversation(dbConversation: any): UnifiedConversation {
    return {
      id: dbConversation.id,
      customerId: dbConversation.customer_id,
      customerName: dbConversation.customer_name || dbConversation.user_name,
      customerEmail: dbConversation.user_email,
      customerPhone: dbConversation.customer_phone,
      channel: dbConversation.channel_type,
      status: dbConversation.status,
      priority: dbConversation.priority,
      lastMessage: dbConversation.last_message,
      lastMessageAt: new Date(dbConversation.last_message_at),
      messageCount: dbConversation.message_count || 0,
      requiresHuman: dbConversation.requires_human || false,
      aiConfidence: dbConversation.ai_confidence,
      assignedAgent: dbConversation.assigned_agent_id,
      tags: dbConversation.tags || [],
      department: dbConversation.department,
      language: dbConversation.language,
      sentiment: dbConversation.sentiment,
      createdAt: new Date(dbConversation.created_at),
      updatedAt: new Date(dbConversation.updated_at),
      customerProfile: dbConversation.customer_profiles ? {
        id: dbConversation.customer_profiles.id,
        name: dbConversation.customer_profiles.name,
        email: dbConversation.customer_profiles.email,
        phone: dbConversation.customer_profiles.phone,
        preferences: dbConversation.customer_profiles.preferences,
        satisfactionRating: dbConversation.customer_profiles.satisfaction_rating
      } : undefined
    };
  }

  /**
   * Transform database message to IncomingMessage
   */
  private transformToIncomingMessage(dbMessage: any): IncomingMessage {
    return {
      id: dbMessage.id,
      conversation_id: dbMessage.conversation_id,
      sender_type: dbMessage.sender_type,
      content: dbMessage.content,
      channel_type: dbMessage.channel_type,
      external_message_id: dbMessage.external_message_id,
      metadata: dbMessage.metadata,
      created_at: dbMessage.created_at
    };
  }

  /**
   * Cleanup all subscriptions
   */
  public cleanup(): void {
    for (const subscription of this.subscriptions.values()) {
      subscription.unsubscribe();
    }
    this.subscriptions.clear();
    this.responseQueue.clear();
  }
}

// Export singleton instance
export const enhancedRealtimeMessagingService = new EnhancedRealtimeMessagingService();