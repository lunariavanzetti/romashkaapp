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

export class RealtimeMessagingService {
  private subscriptions: Map<string, ConversationSubscription> = new Map();
  private performanceMetrics: MessagePerformanceMetrics[] = [];
  private aiResponseTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private responseQueue: Map<string, Promise<AIResponse>> = new Map();

  constructor() {
    this.setupPerformanceCleanup();
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
      // Remove existing subscription if exists
      this.unsubscribeFromConversation(conversationId);

      // Create new subscription for messages
      const messageSubscription = supabase
        .channel(`messages:${conversationId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        }, (payload) => {
          const message = payload.new as IncomingMessage;
          onMessage(message);
        })
        .subscribe();

      // Also subscribe to message updates (for delivery status)
      const messageUpdateSubscription = supabase
        .channel(`message_updates:${conversationId}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        }, (payload) => {
          const message = payload.new as IncomingMessage;
          onMessage(message);
        })
        .subscribe();

      const conversationSub: ConversationSubscription = {
        id: conversationId,
        unsubscribe: () => {
          messageSubscription.unsubscribe();
          messageUpdateSubscription.unsubscribe();
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
   * Unsubscribe from conversation updates
   */
  public unsubscribeFromConversation(conversationId: string): void {
    const subscription = this.subscriptions.get(conversationId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(conversationId);
    }
  }

  /**
   * Send message and get AI response within 6 seconds
   */
  public async sendMessage(
    message: string,
    conversationId: string,
    senderType: 'user' | 'agent' = 'user'
  ): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      // Insert user message first
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

      // Update conversation metadata
      await supabase
        .from('conversations')
        .update({
          last_message: message,
          last_message_at: new Date().toISOString(),
          message_count: supabase.raw('message_count + 1'),
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      // Generate AI response only for user messages
      if (senderType === 'user') {
        // Check if we already have a response in queue to avoid duplicates
        const existingResponse = this.responseQueue.get(conversationId);
        if (existingResponse) {
          return existingResponse;
        }

        // Create AI response promise
        const aiResponsePromise = this.generateAIResponseWithTimeout(message, conversationId);
        this.responseQueue.set(conversationId, aiResponsePromise);

        try {
          const aiResponse = await aiResponsePromise;
          
          // Insert AI response if confidence is high enough
          if (aiResponse.confidence >= 0.6 && !aiResponse.requiresHuman) {
            await this.insertAIResponse(conversationId, aiResponse);
          } else {
            // Mark conversation as requiring human intervention
            await supabase
              .from('conversations')
              .update({
                requires_human: true,
                ai_confidence: aiResponse.confidence,
                escalation_reason: aiResponse.requiresHuman ? 'low_confidence' : 'human_requested'
              })
              .eq('id', conversationId);
          }

          const responseTime = Date.now() - startTime;
          
          // Track performance metrics
          this.trackPerformanceMetrics({
            messageId: messageData.id,
            conversationId,
            responseTime,
            aiConfidence: aiResponse.confidence,
            requiresHuman: aiResponse.requiresHuman,
            channelType: 'website' as ChannelType,
            timestamp: new Date().toISOString()
          });

          return {
            ...aiResponse,
            responseTime
          };
        } finally {
          // Remove from queue when done
          this.responseQueue.delete(conversationId);
        }
      }

      // For agent messages, just return a basic response
      return {
        response: message,
        confidence: 1.0,
        requiresHuman: false,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      // Remove from queue on error
      this.responseQueue.delete(conversationId);
      const err = error instanceof Error ? error : new Error('Failed to send message');
      throw err;
    }
  }

  /**
   * Generate AI response with guaranteed 6-second timeout
   */
  private async generateAIResponseWithTimeout(
    message: string,
    conversationId: string
  ): Promise<AIResponse> {
    const startTime = Date.now();
    const MAX_RESPONSE_TIME = 5500; // 5.5 seconds to ensure under 6 seconds total

    try {
      // Get conversation context
      const context = await this.getConversationContext(conversationId);
      
      // Create timeout promise
      const timeoutPromise = new Promise<AIResponse>((_, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('AI response timeout - exceeds 6 seconds'));
        }, MAX_RESPONSE_TIME);
        
        this.aiResponseTimeouts.set(conversationId, timeout);
      });

      // Generate AI response
      const aiPromise = this.generateAIResponseInternal(message, context);

      // Race against timeout
      const result = await Promise.race([aiPromise, timeoutPromise]);
      
      // Clear timeout
      const timeout = this.aiResponseTimeouts.get(conversationId);
      if (timeout) {
        clearTimeout(timeout);
        this.aiResponseTimeouts.delete(conversationId);
      }

      const responseTime = Date.now() - startTime;
      
      return {
        ...result,
        responseTime
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Clear timeout on error
      const timeout = this.aiResponseTimeouts.get(conversationId);
      if (timeout) {
        clearTimeout(timeout);
        this.aiResponseTimeouts.delete(conversationId);
      }

      // Fallback response for timeout or errors
      return {
        response: "I'm experiencing some technical difficulties. Let me connect you with a human agent who can help you better.",
        confidence: 0.1,
        requiresHuman: true,
        responseTime,
        intent: 'escalation',
        sentiment: 'neutral'
      };
    }
  }

  /**
   * Internal AI response generation with knowledge base integration
   */
  private async generateAIResponseInternal(
    message: string,
    context: ConversationContext
  ): Promise<AIResponse> {
    try {
      // Get conversation history (limit to last 10 messages for performance)
      const messages = context.previous_messages.slice(-10);
      
      // Generate response using AI service with timeout
      const aiResponse = await Promise.race([
        aiService.generateResponse({
          message,
          conversationHistory: messages,
          context: {
            channel: context.channel_type,
            language: context.language,
            customerProfile: context.customer_profile,
            intent: context.intent,
            sentiment: context.sentiment
          }
        }),
        new Promise<any>((_, reject) => 
          setTimeout(() => reject(new Error('AI service timeout')), 4000)
        )
      ]);

      // Analyze confidence and determine if human handoff needed
      const confidence = aiResponse.confidence || 0.8;
      const requiresHuman = confidence < 0.6 || 
                           aiResponse.intent === 'escalation' ||
                           aiResponse.intent === 'complaint' ||
                           message.toLowerCase().includes('human') ||
                           message.toLowerCase().includes('agent') ||
                           message.toLowerCase().includes('speak to someone');

      return {
        response: aiResponse.response,
        confidence,
        requiresHuman,
        responseTime: 0, // Will be set by caller
        intent: aiResponse.intent,
        sentiment: aiResponse.sentiment,
        knowledgeUsed: aiResponse.knowledgeUsed
      };
    } catch (error) {
      console.error('AI response generation error:', error);
      
      // Return fallback response
      return {
        response: "I understand you're looking for help. Let me connect you with one of our team members who can assist you better.",
        confidence: 0.3,
        requiresHuman: true,
        responseTime: 0,
        intent: 'escalation',
        sentiment: 'neutral'
      };
    }
  }

  /**
   * Insert AI response into database
   */
  private async insertAIResponse(conversationId: string, aiResponse: AIResponse): Promise<void> {
    try {
      const { data: insertedMessage, error: insertError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_type: 'ai',
          content: aiResponse.response,
          channel_type: 'website',
          message_type: 'text',
          delivery_status: 'sent',
          metadata: {
            confidence: aiResponse.confidence,
            intent: aiResponse.intent,
            sentiment: aiResponse.sentiment,
            knowledge_used: aiResponse.knowledgeUsed,
            response_time: aiResponse.responseTime,
            generated_at: new Date().toISOString()
          },
          confidence_score: aiResponse.confidence,
          processing_time_ms: aiResponse.responseTime,
          intent_detected: aiResponse.intent,
          knowledge_sources: aiResponse.knowledgeUsed ? { sources: aiResponse.knowledgeUsed } : {},
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Update conversation with AI response
      await supabase
        .from('conversations')
        .update({
          last_message: aiResponse.response,
          last_message_at: new Date().toISOString(),
          message_count: supabase.raw('message_count + 1'),
          updated_at: new Date().toISOString(),
          ai_confidence: aiResponse.confidence,
          intent: aiResponse.intent,
          sentiment: aiResponse.sentiment,
          requires_human: aiResponse.requiresHuman
        })
        .eq('id', conversationId);

    } catch (error) {
      console.error('Error inserting AI response:', error);
      throw error;
    }
  }

  /**
   * Handle incoming messages from all channels
   */
  public async handleIncomingMessage(message: IncomingMessage): Promise<void> {
    try {
      // Store message in database with correct schema
      await supabase
        .from('messages')
        .insert({
          id: message.id,
          conversation_id: message.conversation_id,
          sender_type: message.sender_type,
          content: message.content,
          channel_type: message.channel_type || 'website',
          external_message_id: message.external_message_id,
          message_type: 'text',
          delivery_status: 'delivered',
          metadata: message.metadata || {},
          created_at: message.created_at
        });

      // Update conversation last message and metadata
      await supabase
        .from('conversations')
        .update({
          last_message: message.content,
          last_message_at: message.created_at,
          message_count: supabase.raw('message_count + 1'),
          updated_at: new Date().toISOString()
        })
        .eq('id', message.conversation_id);

      // Auto-generate AI response for user messages
      if (message.sender_type === 'user') {
        // Use setTimeout to ensure message is stored first
        setTimeout(async () => {
          try {
            await this.sendMessage(message.content, message.conversation_id, 'user');
          } catch (error) {
            console.error('Error generating AI response:', error);
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error handling incoming message:', error);
      throw error;
    }
  }

  /**
   * Get conversation context for AI response generation
   */
  private async getConversationContext(conversationId: string): Promise<ConversationContext> {
    try {
      // Get conversation details with customer profile
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select(`
          *,
          customer_profiles (*)
        `)
        .eq('id', conversationId)
        .single();

      if (convError) throw convError;

      // Get recent messages for context (limit to 20 for performance)
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (msgError) throw msgError;

      return {
        conversation_id: conversationId,
        customer_id: conversation.customer_id,
        channel_type: conversation.channel_type as ChannelType,
        language: conversation.language || 'en',
        previous_messages: messages.reverse().map(msg => ({
          id: msg.id,
          conversation_id: msg.conversation_id,
          sender_type: msg.sender_type,
          content: msg.content,
          channel_type: msg.channel_type || 'website',
          external_message_id: msg.external_message_id,
          metadata: msg.metadata,
          created_at: msg.created_at
        })),
        customer_profile: conversation.customer_profiles || {
          id: conversation.customer_id,
          name: conversation.customer_name,
          email: conversation.user_email,
          phone: conversation.customer_phone
        },
        intent: conversation.intent,
        sentiment: conversation.sentiment
      };
    } catch (error) {
      console.error('Error getting conversation context:', error);
      throw error;
    }
  }

  /**
   * Track performance metrics
   */
  private trackPerformanceMetrics(metrics: MessagePerformanceMetrics): void {
    this.performanceMetrics.push(metrics);
    
    // Store metrics in database for analytics
    this.storePerformanceMetrics(metrics).catch(console.error);
  }

  /**
   * Store performance metrics in database
   */
  private async storePerformanceMetrics(metrics: MessagePerformanceMetrics): Promise<void> {
    try {
      await supabase
        .from('realtime_metrics')
        .insert({
          metric_name: 'message_response_time',
          metric_value: metrics.responseTime,
          dimensions: {
            conversation_id: metrics.conversationId,
            channel_type: metrics.channelType,
            ai_confidence: metrics.aiConfidence,
            requires_human: metrics.requiresHuman
          },
          timestamp: metrics.timestamp
        });
    } catch (error) {
      console.error('Error storing performance metrics:', error);
    }
  }

  /**
   * Get performance metrics for dashboard
   */
  public getPerformanceMetrics(): {
    averageResponseTime: number;
    aiResolutionRate: number;
    totalMessages: number;
    channelBreakdown: Record<string, number>;
  } {
    const metrics = this.performanceMetrics.filter(
      m => new Date(m.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000 // Last 24 hours
    );

    if (metrics.length === 0) {
      return {
        averageResponseTime: 0,
        aiResolutionRate: 0,
        totalMessages: 0,
        channelBreakdown: {}
      };
    }

    const averageResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
    const aiResolutionRate = metrics.filter(m => !m.requiresHuman).length / metrics.length;
    const channelBreakdown = metrics.reduce((acc, m) => {
      acc[m.channelType] = (acc[m.channelType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      averageResponseTime,
      aiResolutionRate,
      totalMessages: metrics.length,
      channelBreakdown
    };
  }

  /**
   * Clean up old performance metrics
   */
  private setupPerformanceCleanup(): void {
    setInterval(() => {
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days ago
      this.performanceMetrics = this.performanceMetrics.filter(
        m => new Date(m.timestamp).getTime() > cutoff
      );
    }, 60 * 60 * 1000); // Every hour
  }

  /**
   * Create or get conversation for customer
   */
  public async createOrGetConversation(
    customerIdentifier: string,
    channelType: ChannelType,
    initialMessage?: string
  ): Promise<UnifiedConversation> {
    try {
      // First try to find existing customer
      let customer = await this.findOrCreateCustomer(customerIdentifier, channelType);

      // Check for existing active conversation
      const { data: existingConversation, error: findError } = await supabase
        .from('conversations')
        .select('*')
        .eq('customer_id', customer.id)
        .eq('channel_type', channelType)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (findError && findError.code !== 'PGRST116') throw findError;

      if (existingConversation) {
        // Return existing conversation
        return {
          id: existingConversation.id,
          customerIdentity: {
            id: customer.id,
            name: existingConversation.customer_name || customer.name || 'Unknown Customer',
            email: existingConversation.user_email || customer.email,
            phone: existingConversation.customer_phone || customer.phone,
            channels: [channelType]
          },
          channels: [{
            type: channelType,
            conversationId: existingConversation.id,
            lastMessage: new Date(existingConversation.last_message_at),
            unreadCount: 0
          }],
          assignedAgentId: existingConversation.assigned_agent_id,
          priority: existingConversation.priority as any,
          tags: existingConversation.tags || [],
          lastActivity: new Date(existingConversation.last_message_at),
          totalMessages: existingConversation.message_count || 0
        };
      }

      // Create new conversation
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          customer_id: customer.id,
          customer_name: customer.name || customerIdentifier,
          user_name: customer.name || customerIdentifier,
          user_email: customer.email,
          customer_phone: customer.phone,
          status: 'active',
          priority: 'normal',
          channel_type: channelType,
          language: 'en',
          department: 'general',
          created_at: new Date().toISOString(),
          last_message_at: new Date().toISOString(),
          last_message: initialMessage || '',
          message_count: 0,
          requires_human: false
        })
        .select()
        .single();

      if (createError) throw createError;

      // Insert initial message if provided
      if (initialMessage) {
        await this.handleIncomingMessage({
          id: crypto.randomUUID(),
          conversation_id: newConversation.id,
          sender_type: 'user',
          content: initialMessage,
          channel_type: channelType,
          created_at: new Date().toISOString()
        });
      }

      return {
        id: newConversation.id,
        customerIdentity: {
          id: customer.id,
          name: customer.name || customerIdentifier,
          email: customer.email,
          phone: customer.phone,
          channels: [channelType]
        },
        channels: [{
          type: channelType,
          conversationId: newConversation.id,
          lastMessage: new Date(),
          unreadCount: 0
        }],
        assignedAgentId: null,
        priority: 'normal',
        tags: [],
        lastActivity: new Date(),
        totalMessages: initialMessage ? 1 : 0
      };
    } catch (error) {
      console.error('Error creating/getting conversation:', error);
      throw error;
    }
  }

  /**
   * Find or create customer profile
   */
  private async findOrCreateCustomer(
    identifier: string,
    channelType: ChannelType
  ): Promise<any> {
    try {
      // Determine search field based on channel type
      let searchField: string;
      let searchValue: string;

      if (identifier.includes('@')) {
        searchField = 'email';
        searchValue = identifier;
      } else if (identifier.startsWith('+') || /^\d+$/.test(identifier)) {
        searchField = 'phone';
        searchValue = identifier;
      } else {
        // Default to email for unknown format
        searchField = 'email';
        searchValue = identifier;
      }
      
      // Try to find existing customer
      const { data: existingCustomer, error: findError } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq(searchField, searchValue)
        .single();

      if (findError && findError.code !== 'PGRST116') throw findError;

      if (existingCustomer) {
        return existingCustomer;
      }

      // Create new customer
      const customerData = {
        [searchField]: searchValue,
        name: identifier.includes('@') ? identifier.split('@')[0] : identifier,
        status: 'active',
        total_conversations: 0,
        first_interaction: new Date().toISOString(),
        last_interaction: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      const { data: newCustomer, error: createError } = await supabase
        .from('customer_profiles')
        .insert(customerData)
        .select()
        .single();

      if (createError) throw createError;

      return newCustomer;
    } catch (error) {
      console.error('Error finding/creating customer:', error);
      throw error;
    }
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    // Unsubscribe from all conversations
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions.clear();

    // Clear all timeouts
    this.aiResponseTimeouts.forEach(timeout => clearTimeout(timeout));
    this.aiResponseTimeouts.clear();

    // Clear response queue
    this.responseQueue.clear();

    // Clear performance metrics
    this.performanceMetrics = [];
  }
}

// Export singleton instance
export const realtimeMessagingService = new RealtimeMessagingService();