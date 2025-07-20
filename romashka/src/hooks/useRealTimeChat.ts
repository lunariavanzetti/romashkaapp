import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { ConversationMonitoringService } from '../services/conversationMonitoringService';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender: 'user' | 'ai' | 'agent';
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  metadata?: Record<string, any>;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface TypingIndicator {
  user_id: string;
  conversation_id: string;
  is_typing: boolean;
  last_activity: string;
}

export interface ChatParticipant {
  id: string;
  name: string;
  email?: string;
  role: 'customer' | 'ai' | 'agent';
  is_online: boolean;
  last_seen: string;
}

interface UseRealTimeChatOptions {
  conversationId: string;
  userId?: string;
  onMessageReceived?: (message: ChatMessage) => void;
  onTypingChange?: (typing: TypingIndicator[]) => void;
  onParticipantChange?: (participants: ChatParticipant[]) => void;
  onError?: (error: Error) => void;
  autoMarkAsRead?: boolean;
}

interface ChatState {
  messages: ChatMessage[];
  participants: ChatParticipant[];
  typingIndicators: TypingIndicator[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useRealTimeChat(options: UseRealTimeChatOptions) {
  const {
    conversationId,
    userId,
    onMessageReceived,
    onTypingChange,
    onParticipantChange,
    onError,
    autoMarkAsRead = true
  } = options;

  const [state, setState] = useState<ChatState>({
    messages: [],
    participants: [],
    typingIndicators: [],
    isConnected: false,
    isLoading: true,
    error: null
  });

  const subscriptionRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<string>(new Date().toISOString());

  // Load initial messages and setup real-time subscription
  useEffect(() => {
    if (!conversationId || !supabase) return;

    let mounted = true;

    const initializeChat = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        // Load initial messages
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select(`
            id,
            conversation_id,
            sender,
            content,
            message_type,
            metadata,
            status,
            created_at,
            updated_at
          `)
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;

        // Load participants
        const { data: participants, error: participantsError } = await supabase
          .from('conversation_participants')
          .select(`
            id,
            name,
            email,
            role,
            is_online,
            last_seen
          `)
          .eq('conversation_id', conversationId);

        if (participantsError) throw participantsError;

        if (mounted) {
          setState(prev => ({
            ...prev,
            messages: messages || [],
            participants: participants || [],
            isLoading: false,
            isConnected: true
          }));

          // Record conversation start for monitoring
          await ConversationMonitoringService.recordConversationStart(conversationId);
        }

        // Setup real-time subscriptions
        setupRealTimeSubscriptions();

      } catch (error) {
        console.error('Error initializing chat:', error);
        if (mounted) {
          setState(prev => ({
            ...prev,
            error: error instanceof Error ? error.message : 'Failed to load chat',
            isLoading: false,
            isConnected: false
          }));
          onError?.(error instanceof Error ? error : new Error('Failed to load chat'));
        }
      }
    };

    const setupRealTimeSubscriptions = () => {
      if (!supabase) return;

      // Subscribe to new messages
      subscriptionRef.current = supabase
        .channel(`chat-${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          (payload) => {
            const newMessage = payload.new as ChatMessage;
            
            setState(prev => ({
              ...prev,
              messages: [...prev.messages, newMessage]
            }));

            onMessageReceived?.(newMessage);

            // Auto-mark as read if enabled and message is not from current user
            if (autoMarkAsRead && newMessage.sender !== 'user' && userId) {
              markMessageAsRead(newMessage.id);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          (payload) => {
            const updatedMessage = payload.new as ChatMessage;
            
            setState(prev => ({
              ...prev,
              messages: prev.messages.map(msg =>
                msg.id === updatedMessage.id ? updatedMessage : msg
              )
            }));
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'typing_indicators',
            filter: `conversation_id=eq.${conversationId}`
          },
          (payload) => {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const typingData = payload.new as TypingIndicator;
              
              setState(prev => {
                const newTypingIndicators = prev.typingIndicators.filter(
                  t => t.user_id !== typingData.user_id
                );
                
                if (typingData.is_typing) {
                  newTypingIndicators.push(typingData);
                }
                
                return {
                  ...prev,
                  typingIndicators: newTypingIndicators
                };
              });

              onTypingChange?.(state.typingIndicators);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversation_participants',
            filter: `conversation_id=eq.${conversationId}`
          },
          (payload) => {
            if (payload.eventType === 'UPDATE') {
              const updatedParticipant = payload.new as ChatParticipant;
              
              setState(prev => ({
                ...prev,
                participants: prev.participants.map(p =>
                  p.id === updatedParticipant.id ? updatedParticipant : p
                )
              }));

              onParticipantChange?.(state.participants);
            }
          }
        )
        .subscribe((status) => {
          if (mounted) {
            setState(prev => ({
              ...prev,
              isConnected: status === 'SUBSCRIBED'
            }));
          }
        });
    };

    initializeChat();

    return () => {
      mounted = false;
      if (subscriptionRef.current) {
        supabase?.removeChannel(subscriptionRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId, userId]);

  // Send message function
  const sendMessage = useCallback(async (
    content: string,
    messageType: ChatMessage['message_type'] = 'text',
    metadata?: Record<string, any>
  ): Promise<ChatMessage | null> => {
    if (!supabase || !conversationId) return null;

    const tempId = `temp-${Date.now()}`;
    const tempMessage: ChatMessage = {
      id: tempId,
      conversation_id: conversationId,
      sender: 'user',
      content,
      message_type: messageType,
      metadata,
      status: 'sending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Add temporary message to state
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, tempMessage]
    }));

    try {
      const startTime = Date.now();

      // Insert message to database
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          conversation_id: conversationId,
          sender: 'user',
          content,
          message_type: messageType,
          metadata,
          status: 'sent'
        }])
        .select()
        .single();

      if (error) throw error;

      // Remove temporary message and add real message
      setState(prev => ({
        ...prev,
        messages: prev.messages
          .filter(msg => msg.id !== tempId)
          .concat(data as ChatMessage)
      }));

      // Record response time for monitoring
      const responseTime = Date.now() - startTime;
      await ConversationMonitoringService.recordAIResponse(
        conversationId,
        responseTime,
        true
      );

      return data as ChatMessage;

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Update temporary message status to failed
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === tempId
            ? { ...msg, status: 'failed' as const }
            : msg
        )
      }));

      onError?.(error instanceof Error ? error : new Error('Failed to send message'));
      return null;
    }
  }, [conversationId, onError]);

  // Mark message as read
  const markMessageAsRead = useCallback(async (messageId: string): Promise<void> => {
    if (!supabase) return;

    try {
      await supabase
        .from('messages')
        .update({ status: 'read' })
        .eq('id', messageId);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }, []);

  // Send typing indicator
  const setTyping = useCallback(async (isTyping: boolean): Promise<void> => {
    if (!supabase || !userId) return;

    try {
      const now = new Date().toISOString();
      lastActivityRef.current = now;

      if (isTyping) {
        // Insert or update typing indicator
        await supabase
          .from('typing_indicators')
          .upsert([{
            user_id: userId,
            conversation_id: conversationId,
            is_typing: true,
            last_activity: now
          }]);

        // Clear typing after 3 seconds of inactivity
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(async () => {
          // Only clear if no new activity
          if (lastActivityRef.current === now) {
            await supabase
              .from('typing_indicators')
              .update({ is_typing: false })
              .eq('user_id', userId)
              .eq('conversation_id', conversationId);
          }
        }, 3000);
      } else {
        // Clear typing indicator immediately
        await supabase
          .from('typing_indicators')
          .update({ is_typing: false })
          .eq('user_id', userId)
          .eq('conversation_id', conversationId);

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
      }
    } catch (error) {
      console.error('Error updating typing indicator:', error);
    }
  }, [conversationId, userId]);

  // Retry failed message
  const retryMessage = useCallback(async (messageId: string): Promise<void> => {
    const message = state.messages.find(msg => msg.id === messageId);
    if (!message || message.status !== 'failed') return;

    await sendMessage(message.content, message.message_type, message.metadata);
  }, [state.messages, sendMessage]);

  // End conversation
  const endConversation = useCallback(async (): Promise<void> => {
    if (!conversationId) return;

    try {
      await ConversationMonitoringService.endConversationSession(conversationId, 'resolved');
    } catch (error) {
      console.error('Error ending conversation:', error);
    }
  }, [conversationId]);

  return {
    // State
    messages: state.messages,
    participants: state.participants,
    typingIndicators: state.typingIndicators,
    isConnected: state.isConnected,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    sendMessage,
    markMessageAsRead,
    setTyping,
    retryMessage,
    endConversation,

    // Computed values
    unreadCount: state.messages.filter(msg => 
      msg.sender !== 'user' && msg.status !== 'read'
    ).length,
    isAnyoneTyping: state.typingIndicators.length > 0,
    onlineParticipants: state.participants.filter(p => p.is_online)
  };
} 