import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuthStore } from '../stores/authStore';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'ai' | 'agent';
  content: string;
  created_at: string;
  metadata?: {
    typing?: boolean;
    read?: boolean;
    delivered?: boolean;
    attachments?: any[];
    confidence?: number;
  };
}

export interface TypingIndicator {
  user_id: string;
  user_name: string;
  is_typing: boolean;
  timestamp: string;
}

export interface OnlineStatus {
  user_id: string;
  user_name: string;
  is_online: boolean;
  last_seen: string;
}

export interface UseRealTimeChatOptions {
  conversationId: string;
  autoScroll?: boolean;
  enableTypingIndicator?: boolean;
  enableOnlineStatus?: boolean;
  messageLimit?: number;
  onMessageReceived?: (message: ChatMessage) => void;
  onTypingChange?: (typing: TypingIndicator) => void;
  onOnlineStatusChange?: (status: OnlineStatus) => void;
  onError?: (error: Error) => void;
}

export interface UseRealTimeChatReturn {
  messages: ChatMessage[];
  typingUsers: TypingIndicator[];
  onlineUsers: OnlineStatus[];
  isLoading: boolean;
  error: Error | null;
  sendMessage: (content: string, metadata?: any) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  setTyping: (isTyping: boolean) => Promise<void>;
  refreshMessages: () => Promise<void>;
  clearMessages: () => void;
}

export const useRealTimeChat = (options: UseRealTimeChatOptions): UseRealTimeChatReturn => {
  const {
    conversationId,
    autoScroll = true,
    enableTypingIndicator = true,
    enableOnlineStatus = true,
    messageLimit = 50,
    onMessageReceived,
    onTypingChange,
    onOnlineStatusChange,
    onError
  } = options;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const { user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionRef = useRef<any>(null);

  // Load initial messages
  const loadMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(messageLimit);

      if (fetchError) throw fetchError;

      setMessages(data || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load messages');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, messageLimit, onError]);

  // Send message
  const sendMessage = useCallback(async (content: string, metadata?: any) => {
    if (!user || !content.trim()) return;

    try {
      const message: Omit<ChatMessage, 'id'> = {
        conversation_id: conversationId,
        sender_type: 'agent',
        content: content.trim(),
        created_at: new Date().toISOString(),
        metadata: {
          ...metadata,
          delivered: true,
          read: false,
        },
      };

      const { data, error: insertError } = await supabase
        .from('messages')
        .insert(message)
        .select()
        .single();

      if (insertError) throw insertError;

      // Update conversation last message
      await supabase
        .from('conversations')
        .update({
          last_message: content.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      // Stop typing indicator
      await setTyping(false);

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to send message');
      setError(error);
      onError?.(error);
    }
  }, [conversationId, user, onError]);

  // Mark message as read
  const markAsRead = useCallback(async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({
          metadata: {
            read: true,
            read_at: new Date().toISOString(),
          },
        })
        .eq('id', messageId);
    } catch (err) {
      console.error('Failed to mark message as read:', err);
    }
  }, []);

  // Set typing indicator
  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!user || !enableTypingIndicator) return;

    try {
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      setIsTyping(isTyping);

      if (isTyping) {
        // Set typing indicator
        await supabase
          .from('typing_indicators')
          .upsert({
            conversation_id: conversationId,
            user_id: user.id,
            user_name: user.user_metadata?.full_name || user.email,
            is_typing: true,
            timestamp: new Date().toISOString(),
          });

        // Auto-clear typing indicator after 5 seconds
        typingTimeoutRef.current = setTimeout(() => {
          setTyping(false);
        }, 5000);
      } else {
        // Remove typing indicator
        await supabase
          .from('typing_indicators')
          .delete()
          .eq('conversation_id', conversationId)
          .eq('user_id', user.id);
      }
    } catch (err) {
      console.error('Failed to set typing indicator:', err);
    }
  }, [conversationId, user, enableTypingIndicator]);

  // Refresh messages
  const refreshMessages = useCallback(async () => {
    await loadMessages();
  }, [loadMessages]);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [autoScroll]);

  // Setup real-time subscriptions
  useEffect(() => {
    if (!conversationId) return;

    // Load initial messages
    loadMessages();

    // Setup message subscription
    const messageSubscription = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        const newMessage = payload.new as ChatMessage;
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(msg => msg.id === newMessage.id)) {
            return prev;
          }
          return [...prev, newMessage];
        });
        onMessageReceived?.(newMessage);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        const updatedMessage = payload.new as ChatMessage;
        setMessages(prev => 
          prev.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg)
        );
      })
      .subscribe();

    // Setup typing indicator subscription
    let typingSubscription: any = null;
    if (enableTypingIndicator) {
      typingSubscription = supabase
        .channel(`typing:${conversationId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `conversation_id=eq.${conversationId}`,
        }, (payload) => {
          if (payload.eventType === 'INSERT') {
            const typingIndicator = payload.new as TypingIndicator;
            setTypingUsers(prev => {
              const filtered = prev.filter(t => t.user_id !== typingIndicator.user_id);
              return [...filtered, typingIndicator];
            });
            onTypingChange?.(typingIndicator);
          } else if (payload.eventType === 'DELETE') {
            const deletedIndicator = payload.old as TypingIndicator;
            setTypingUsers(prev => 
              prev.filter(t => t.user_id !== deletedIndicator.user_id)
            );
          }
        })
        .subscribe();
    }

    // Setup online status subscription
    let onlineSubscription: any = null;
    if (enableOnlineStatus) {
      onlineSubscription = supabase
        .channel('online_status')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'online_status',
        }, (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const onlineStatus = payload.new as OnlineStatus;
            setOnlineUsers(prev => {
              const filtered = prev.filter(u => u.user_id !== onlineStatus.user_id);
              return [...filtered, onlineStatus];
            });
            onOnlineStatusChange?.(onlineStatus);
          } else if (payload.eventType === 'DELETE') {
            const deletedStatus = payload.old as OnlineStatus;
            setOnlineUsers(prev => 
              prev.filter(u => u.user_id !== deletedStatus.user_id)
            );
          }
        })
        .subscribe();
    }

    // Store subscription references
    subscriptionRef.current = {
      messages: messageSubscription,
      typing: typingSubscription,
      online: onlineSubscription,
    };

    // Cleanup function
    return () => {
      messageSubscription?.unsubscribe();
      typingSubscription?.unsubscribe();
      onlineSubscription?.unsubscribe();
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId, enableTypingIndicator, enableOnlineStatus, onMessageReceived, onTypingChange, onOnlineStatusChange, loadMessages]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Cleanup typing indicators on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping) {
        setTyping(false);
      }
    };
  }, [isTyping, setTyping]);

  // Update online status
  useEffect(() => {
    if (!user || !enableOnlineStatus) return;

    const updateOnlineStatus = async () => {
      try {
        await supabase
          .from('online_status')
          .upsert({
            user_id: user.id,
            user_name: user.user_metadata?.full_name || user.email,
            is_online: true,
            last_seen: new Date().toISOString(),
          });
      } catch (err) {
        console.error('Failed to update online status:', err);
      }
    };

    // Update status on mount
    updateOnlineStatus();

    // Update status periodically
    const interval = setInterval(updateOnlineStatus, 30000); // Every 30 seconds

    // Update status on page visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateOnlineStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Set offline status on unmount
      (async () => {
        try {
          await supabase
            .from('online_status')
            .upsert({
              user_id: user.id,
              user_name: user.user_metadata?.full_name || user.email,
              is_online: false,
              last_seen: new Date().toISOString(),
            });
        } catch (error) {
          console.error('Failed to update offline status:', error);
        }
      })();
    };
  }, [user, enableOnlineStatus]);

  return {
    messages,
    typingUsers,
    onlineUsers,
    isLoading,
    error,
    sendMessage,
    markAsRead,
    setTyping,
    refreshMessages,
    clearMessages,
  };
};

// Utility hook for typing indicator with debouncing
export const useTypingIndicator = (conversationId: string, enabled = true) => {
  const { setTyping } = useRealTimeChat({
    conversationId,
    enableTypingIndicator: enabled,
    onError: (error: Error) => console.error(error),
  });

  const [isTyping, setIsTyping] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startTyping = useCallback(() => {
    if (!enabled) return;
    
    setIsTyping(true);
    setTyping(true);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    timeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [enabled, setTyping]);

  const stopTyping = useCallback(() => {
    setIsTyping(false);
    setTyping(false);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [setTyping]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (isTyping) {
        stopTyping();
      }
    };
  }, [isTyping, stopTyping]);

  return {
    isTyping,
    startTyping,
    stopTyping,
  };
}; 