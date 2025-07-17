import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { enhancedRealtimeMessagingService as realtimeMessagingService, type IncomingMessage, type AIResponse } from '../services/messaging/realTimeMessaging';
import type { UnifiedConversation, MessageContent } from '../services/channels/types';

export interface RealtimeMessage {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'ai' | 'agent';
  content: string;
  timestamp: Date;
  isFromCustomer: boolean;
  deliveryStatus: 'sent' | 'delivered' | 'read' | 'failed';
  channelType: string;
  metadata?: any;
}

export interface UseRealtimeMessagesOptions {
  autoLoadConversations?: boolean;
  messageLimit?: number;
  onNewMessage?: (message: RealtimeMessage) => void;
  onConversationUpdate?: (conversation: UnifiedConversation) => void;
  onError?: (error: Error) => void;
}

export interface UseRealtimeMessagesReturn {
  conversations: UnifiedConversation[];
  messages: RealtimeMessage[];
  selectedConversation: UnifiedConversation | null;
  isLoading: boolean;
  error: Error | null;
  loadConversations: () => Promise<void>;
  selectConversation: (conversation: UnifiedConversation) => Promise<void>;
  sendMessage: (content: string, conversationId?: string) => Promise<void>;
  createConversation: (customerIdentifier: string, channelType: any, initialMessage?: string) => Promise<UnifiedConversation>;
  refreshMessages: () => Promise<void>;
  markMessageAsRead: (messageId: string) => Promise<void>;
  getPerformanceMetrics: () => any;
}

export const useRealtimeMessages = (options: UseRealtimeMessagesOptions = {}): UseRealtimeMessagesReturn => {
  const {
    autoLoadConversations = true,
    messageLimit = 50,
    onNewMessage,
    onConversationUpdate,
    onError
  } = options;

  const [conversations, setConversations] = useState<UnifiedConversation[]>([]);
  const [messages, setMessages] = useState<RealtimeMessage[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<UnifiedConversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const subscriptionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations from database
  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          *,
          customer_profiles (
            id,
            name,
            email,
            phone
          )
        `)
        .order('last_message_at', { ascending: false })
        .limit(20);

      if (conversationsError) throw conversationsError;

      const formattedConversations: UnifiedConversation[] = conversationsData.map(conv => ({
        id: conv.id,
        customerIdentity: {
          id: conv.customer_profiles?.id || conv.customer_id,
          name: conv.customer_profiles?.name || conv.customer_name || conv.user_name || 'Unknown',
          email: conv.customer_profiles?.email || conv.user_email,
          phone: conv.customer_profiles?.phone || conv.customer_phone,
          channels: [conv.channel_type]
        },
        channels: [{
          type: conv.channel_type,
          conversationId: conv.id,
          lastMessage: new Date(conv.last_message_at),
          unreadCount: 0 // TODO: Calculate unread count
        }],
        assignedAgentId: conv.assigned_agent_id,
        priority: conv.priority,
        tags: conv.tags || [],
        lastActivity: new Date(conv.last_message_at),
        totalMessages: conv.message_count || 0
      }));

      setConversations(formattedConversations);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load conversations');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  // Load messages for selected conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(messageLimit);

      if (messagesError) throw messagesError;

      const formattedMessages: RealtimeMessage[] = messagesData.map(msg => ({
        id: msg.id,
        conversation_id: msg.conversation_id,
        sender_type: msg.sender_type,
        content: msg.content,
        timestamp: new Date(msg.created_at),
        isFromCustomer: msg.sender_type === 'user',
        deliveryStatus: msg.delivery_status || 'sent',
        channelType: msg.channel_type || 'website',
        metadata: msg.metadata || {}
      }));

      setMessages(formattedMessages);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load messages');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [messageLimit, onError]);

  // Select conversation and load its messages
  const selectConversation = useCallback(async (conversation: UnifiedConversation) => {
    try {
      setSelectedConversation(conversation);
      await loadMessages(conversation.id);

      // Unsubscribe from previous conversation
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }

      // Subscribe to new conversation
      subscriptionRef.current = realtimeMessagingService.subscribeToConversation(
        conversation.id,
        (message: IncomingMessage) => {
          const formattedMessage: RealtimeMessage = {
            id: message.id,
            conversation_id: message.conversation_id,
            sender_type: message.sender_type,
            content: message.content,
            timestamp: new Date(message.created_at),
            isFromCustomer: message.sender_type === 'user',
            deliveryStatus: 'sent',
            channelType: message.channel_type,
            metadata: message.metadata
          };

          setMessages(prev => [...prev, formattedMessage]);
          onNewMessage?.(formattedMessage);

          // Update conversation in list
          setConversations(prev => prev.map(conv => 
            conv.id === conversation.id 
              ? {
                  ...conv,
                  lastActivity: new Date(message.created_at),
                  totalMessages: conv.totalMessages + 1
                }
              : conv
          ));
        },
        (error) => {
          setError(error);
          onError?.(error);
        }
      );
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to select conversation');
      setError(error);
      onError?.(error);
    }
  }, [loadMessages, onNewMessage, onError]);

  // Send message
  const sendMessage = useCallback(async (content: string, conversationId?: string) => {
    if (!content.trim()) return;

    const targetConversationId = conversationId || selectedConversation?.id;
    if (!targetConversationId) {
      throw new Error('No conversation selected');
    }

    try {
      setError(null);
      
      // Send message through real-time service
      const aiResponse: AIResponse = await realtimeMessagingService.sendMessage(
        content,
        targetConversationId,
        'agent'
      );

      // Update conversation list with latest activity
      setConversations(prev => prev.map(conv => 
        conv.id === targetConversationId 
          ? {
              ...conv,
              lastActivity: new Date(),
              totalMessages: conv.totalMessages + 1
            }
          : conv
      ));

      // Note: Messages will be added to the UI through the real-time subscription
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to send message');
      setError(error);
      onError?.(error);
      throw error;
    }
  }, [selectedConversation, onError]);

  // Create new conversation
  const createConversation = useCallback(async (
    customerIdentifier: string,
    channelType: any,
    initialMessage?: string
  ): Promise<UnifiedConversation> => {
    try {
      setError(null);
      
      const conversation = await realtimeMessagingService.createOrGetConversation(
        customerIdentifier,
        channelType,
        initialMessage
      );

      // Add to conversations list
      setConversations(prev => [conversation, ...prev]);
      
      // Auto-select the new conversation
      await selectConversation(conversation);
      
      onConversationUpdate?.(conversation);
      
      return conversation;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create conversation');
      setError(error);
      onError?.(error);
      throw error;
    }
  }, [selectConversation, onConversationUpdate, onError]);

  // Refresh messages for current conversation
  const refreshMessages = useCallback(async () => {
    if (selectedConversation) {
      await loadMessages(selectedConversation.id);
    }
  }, [selectedConversation, loadMessages]);

  // Mark message as read
  const markMessageAsRead = useCallback(async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({
          delivery_status: 'read',
          metadata: supabase.raw('COALESCE(metadata, \'{}\'::jsonb) || \'{"read_at": "' + new Date().toISOString() + '"}\'::jsonb'),
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) throw error;

      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, deliveryStatus: 'read' }
          : msg
      ));
    } catch (err) {
      console.error('Failed to mark message as read:', err);
    }
  }, []);

  // Get performance metrics
  const getPerformanceMetrics = useCallback(() => {
    return realtimeMessagingService.getPerformanceMetrics();
  }, []);

  // Auto-load conversations on mount
  useEffect(() => {
    if (autoLoadConversations) {
      loadConversations();
    }
  }, [autoLoadConversations, loadConversations]);

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return {
    conversations,
    messages,
    selectedConversation,
    isLoading,
    error,
    loadConversations,
    selectConversation,
    sendMessage,
    createConversation,
    refreshMessages,
    markMessageAsRead,
    getPerformanceMetrics
  };
};