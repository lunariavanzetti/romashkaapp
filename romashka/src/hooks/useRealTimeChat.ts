import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { ConversationMonitoringService } from '../services/conversationMonitoringService';
import { knowledgeMatchingService } from '../services/ai/knowledgeMatchingService';
import { integrationQueryService } from '../services/ai/integrationQueryService';
import { promptEnhancementService } from '../services/ai/promptEnhancementService';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'ai' | 'agent';
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
  conversationId?: string;
  userId?: string;
  agentConfig?: {
    name: string;
    tone: string;
    businessType: string;
    knowledgeBase: string;
    advancedSettings?: {
      avoidPricing: boolean;
      requireContactInfo: boolean;
      escalateComplexQueries: boolean;
      limitResponseLength: boolean;
    };
  };
  onMessageReceived?: (message: ChatMessage) => void;
  onTypingChange?: (typing: TypingIndicator[]) => void;
  onParticipantChange?: (participants: ChatParticipant[]) => void;
  onError?: (error: Error) => void;
  autoMarkAsRead?: boolean;
  enableFileUpload?: boolean;
  enableAnalytics?: boolean;
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
    conversationId: initialConversationId,
    userId,
    agentConfig,
    onMessageReceived,
    onTypingChange,
    onParticipantChange,
    onError,
    autoMarkAsRead = true,
    enableFileUpload = false,
    enableAnalytics = false
  } = options;

  const [conversationId, setConversationId] = useState<string | null>(initialConversationId || null);

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
            sender_type,
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
          if (enableAnalytics) {
            await ConversationMonitoringService.recordConversationStart(conversationId);
          }
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
            if (autoMarkAsRead && newMessage.sender_type !== 'user' && userId) {
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
                
                // Call the callback with the new indicators
                onTypingChange?.(newTypingIndicators);
                
                return {
                  ...prev,
                  typingIndicators: newTypingIndicators
                };
              });
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
              
              setState(prev => {
                const newParticipants = prev.participants.map(p =>
                  p.id === updatedParticipant.id ? updatedParticipant : p
                );
                
                // Call the callback with the new participants
                onParticipantChange?.(newParticipants);
                
                return {
                  ...prev,
                  participants: newParticipants
                };
              });
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
      sender_type: 'user',
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
          sender_type: 'user',
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

      // Generate AI response if agent config is provided
      if (agentConfig && messageType === 'text') {
        generateAIResponse(content, conversationId);
      }

      // Record response time for monitoring
      const responseTime = Date.now() - startTime;
      if (enableAnalytics) {
        await ConversationMonitoringService.recordAIResponse(conversationId, responseTime, true);
      }

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

  // Generate AI response using knowledge matching service with integration context
  const generateAIResponse = useCallback(async (userMessage: string, convId: string) => {
    if (!agentConfig || !convId) return;

    try {
      // Show typing indicator for AI
      setState(prev => ({
        ...prev,
        typingIndicators: [...prev.typingIndicators.filter(t => t.user_id !== 'ai_agent'), {
          user_id: 'ai_agent',
          conversation_id: convId,
          is_typing: true,
          last_activity: new Date().toISOString()
        }]
      }));

      // Get current user ID for integration context
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Analyze message for integration context
      const integrationContext = await integrationQueryService.analyzeAndFetchContext(
        userMessage, 
        user.id, 
        convId
      );

      console.log('🔗 Integration context loaded:', {
        hasIntegrations: integrationContext.hasIntegrations,
        providers: integrationContext.availableProviders,
        summary: integrationContext.summary
      });

      let response;
      let aiResponseContent;
      let responseMetadata: any = {
        agent_id: 'ai_agent',
        has_integration_data: integrationContext.hasIntegrations
      };

      // If we have integration context, use enhanced prompts
      if (integrationContext.hasIntegrations && integrationContext.relevantData) {
        console.log('🚀 Using enhanced AI prompts with integration data');
        
        // Enhance prompts with integration context
        const enhancedPrompts = promptEnhancementService.enhancePromptWithIntegrations({
          userMessage,
          originalKnowledgeBase: agentConfig.knowledgeBase,
          integrationContext,
          agentTone: agentConfig.tone,
          businessType: agentConfig.businessType,
          userId: user.id
        });

        // Use enhanced prompts for AI response
        response = await knowledgeMatchingService.findAnswerWithCustomPrompts({
          systemPrompt: enhancedPrompts.enhancedSystemPrompt,
          userPrompt: enhancedPrompts.enhancedUserPrompt
        });

        responseMetadata = {
          ...responseMetadata,
          confidence: response.confidence,
          sources: response.sources,
          integration_context: integrationContext.summary,
          query_intent: integrationContext.queryIntent?.type,
          providers_used: integrationContext.availableProviders
        };

        aiResponseContent = response.answer || "I don't have that information available. Would you like me to connect you with a human agent?";
        
      } else {
        console.log('📚 Using standard knowledge base response');
        
        // Use standard knowledge matching service
        response = await knowledgeMatchingService.findAnswer({
          question: userMessage,
          knowledgeBase: agentConfig.knowledgeBase,
          agentTone: agentConfig.tone,
          businessType: agentConfig.businessType
        });

        responseMetadata = {
          ...responseMetadata,
          confidence: response.confidence,
          sources: response.sources
        };

        aiResponseContent = response.answer || "I don't have that information available. Would you like me to connect you with a human agent?";
      }
      
      // Apply advanced settings
      if (agentConfig.advancedSettings?.limitResponseLength && aiResponseContent.length > 500) {
        aiResponseContent = aiResponseContent.substring(0, 497) + '...';
      }

      // Insert AI response with enhanced metadata
      const { data: aiMessage, error } = await supabase
        .from('messages')
        .insert([{
          conversation_id: convId,
          sender_type: 'ai',
          content: aiResponseContent,
          message_type: 'text',
          metadata: responseMetadata,
          status: 'sent'
        }])
        .select()
        .single();

      if (error) throw error;

      // Track AI response with integration context
      if (enableAnalytics) {
        await ConversationMonitoringService.recordAIResponse(convId, Date.now(), true);
      }

    } catch (err) {
      console.error('Failed to generate AI response:', err);
      
      // Fallback response on error
      try {
        await supabase
          .from('messages')
          .insert([{
            conversation_id: convId,
            sender_type: 'ai',
            content: "I'm having trouble accessing information right now. Let me connect you with a human agent who can help.",
            message_type: 'text',
            metadata: {
              agent_id: 'ai_agent',
              error: true,
              fallback_response: true
            },
            status: 'sent'
          }]);
      } catch (fallbackError) {
        console.error('Failed to send fallback response:', fallbackError);
      }
    } finally {
      // Hide typing indicator
      setState(prev => ({
        ...prev,
        typingIndicators: prev.typingIndicators.filter(t => t.user_id !== 'ai_agent')
      }));
    }
  }, [agentConfig, enableAnalytics]);

  // Start new conversation
  const startConversation = useCallback(async (): Promise<string> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert([
          {
            status: 'active',
            metadata: {
              agent_config: agentConfig,
              started_at: new Date().toISOString(),
              platform: 'widget'
            }
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setConversationId(conversation.id);
      
      // Track conversation start
      if (enableAnalytics) {
        await ConversationMonitoringService.recordConversationStart(conversation.id);
      }

      return conversation.id;
    } catch (err) {
      console.error('Failed to start conversation:', err);
      setState(prev => ({ ...prev, error: 'Failed to start conversation' }));
      throw err;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [agentConfig, enableAnalytics]);

  // File upload function
  const uploadFile = useCallback(async (file: File): Promise<string> => {
    if (!enableFileUpload) {
      throw new Error('File upload is not enabled');
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `chat-attachments/${fileName}`;

      const { data, error } = await supabase.storage
        .from('chat-files')
        .upload(filePath, file);

      if (error) throw error;

      const { data: publicData } = supabase.storage
        .from('chat-files')
        .getPublicUrl(filePath);

      return publicData.publicUrl;
    } catch (err) {
      console.error('Failed to upload file:', err);
      throw new Error('Failed to upload file');
    }
  }, [enableFileUpload]);

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
      await supabase
        .from('conversations')
        .update({ 
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      // Track conversation end
      if (enableAnalytics) {
        await ConversationMonitoringService.endConversationSession(conversationId, 'resolved');
      }

      setConversationId(null);
      setState(prev => ({ ...prev, isConnected: false }));
    } catch (error) {
      console.error('Error ending conversation:', error);
    }
  }, [conversationId, enableAnalytics]);

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
    startConversation,
    uploadFile,

    // Computed values
    unreadCount: state.messages.filter(msg => 
      msg.sender_type !== 'user' && msg.status !== 'read'
    ).length,
    isAnyoneTyping: state.typingIndicators.length > 0,
    onlineParticipants: state.participants.filter(p => p.is_online)
  };
} 