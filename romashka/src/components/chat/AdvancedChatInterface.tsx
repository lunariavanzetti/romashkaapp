import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical, 
  User, 
  MessageCircle, 
  Hash, 
  Phone,
  Video,
  Star,
  Clock,
  Check,
  CheckCheck,
  Users,
  Settings,
  X,
  Plus
} from 'lucide-react';
import { Button } from '../ui/Button';
import { supabase } from '../../services/supabaseClient';
import { useAuthStore } from '../../stores/authStore';
import { realtimeService } from '../../services/realtimeService';
import { CannedResponses } from './CannedResponses';
import { CustomerProfile } from './CustomerProfile';

interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'ai' | 'agent';
  content: string;
  created_at: string;
  read_by?: string;
  read_at?: string;
  metadata?: {
    typing?: boolean;
    confidence?: number;
    attachments?: FileAttachment[];
  };
}

interface FileAttachment {
  id: string;
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
}

interface Conversation {
  id: string;
  user_name: string;
  user_email: string;
  status: string;
  priority: string;
  department?: string;
  assigned_agent_id?: string;
  tags?: string[];
  created_at: string;
  last_message?: string;
  unread_count?: number;
}

interface TypingUser {
  userId: string;
  userName: string;
  timestamp: Date;
}

interface AdvancedChatInterfaceProps {
  conversations: Conversation[];
  onConversationSelect: (conversationId: string) => void;
  onConversationClose: (conversationId: string) => void;
}

export const AdvancedChatInterface: React.FC<AdvancedChatInterfaceProps> = ({
  conversations,
  onConversationSelect,
  onConversationClose
}) => {
  const { user } = useAuthStore();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [inputValue, setInputValue] = useState('');
  const [typingUsers, setTypingUsers] = useState<Record<string, TypingUser[]>>({});
  const [isTyping, setIsTyping] = useState(false);
  const [showCannedResponses, setShowCannedResponses] = useState(false);
  const [showCustomerProfile, setShowCustomerProfile] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  useEffect(() => {
    if (conversations.length > 0 && !activeConversationId) {
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations, activeConversationId]);

  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
      setupRealtimeSubscription(activeConversationId);
    }
  }, [activeConversationId, loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeConversationId]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      setLoading(prev => ({ ...prev, [conversationId]: true }));

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          file_attachments:file_attachments(*)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(prev => ({
        ...prev,
        [conversationId]: data?.map((msg: any) => ({
          ...msg,
          metadata: {
            ...msg.metadata,
            attachments: msg.file_attachments || []
          }
        })) || []
      }));
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(prev => ({ ...prev, [conversationId]: false }));
    }
  }, []);

  const setupRealtimeSubscription = (conversationId: string) => {
    realtimeService.subscribeToConversation(conversationId, (payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        setMessages(prev => ({
          ...prev,
          [conversationId]: [...(prev[conversationId] || []), payload.new]
        }));
      } else if (payload.event === 'typing_indicator') {
        handleTypingIndicator(payload.payload);
      } else if (payload.event === 'message_read') {
        handleMessageRead(payload.payload);
      }
    });
  };

  const handleTypingIndicator = (payload: any) => {
    const { conversationId, userId, userName, isTyping: userIsTyping } = payload;
    
    setTypingUsers(prev => {
      const currentTyping = prev[conversationId] || [];
      
      if (userIsTyping) {
        // Add or update typing user
        const existingIndex = currentTyping.findIndex(u => u.userId === userId);
        if (existingIndex >= 0) {
          currentTyping[existingIndex] = { userId, userName, timestamp: new Date() };
        } else {
          currentTyping.push({ userId, userName, timestamp: new Date() });
        }
      } else {
        // Remove typing user
        return {
          ...prev,
          [conversationId]: currentTyping.filter(u => u.userId !== userId)
        };
      }
      
      return { ...prev, [conversationId]: currentTyping };
    });
  };

  const handleMessageRead = (payload: any) => {
    const { messageId, readBy, readAt } = payload;
    
    setMessages(prev => {
      const updatedMessages = { ...prev };
      Object.keys(updatedMessages).forEach(convId => {
        updatedMessages[convId] = updatedMessages[convId].map(msg =>
          msg.id === messageId ? { ...msg, read_by: readBy, read_at: readAt } : msg
        );
      });
      return updatedMessages;
    });
  };

  const sendMessage = async () => {
    if (!inputValue.trim() && attachments.length === 0) return;
    if (!activeConversationId || !user?.id) return;

    try {
      const messageData: any = {
        conversation_id: activeConversationId,
        sender_type: 'agent',
        content: inputValue.trim(),
        created_at: new Date().toISOString()
      };

      // Handle file attachments
      if (attachments.length > 0) {
        const uploadedAttachments = await uploadAttachments(attachments, activeConversationId);
        messageData.metadata = { attachments: uploadedAttachments };
      }

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;

      // Clear input and attachments
      setInputValue('');
      setAttachments([]);
      setIsTyping(false);

      // Stop typing indicator
      await realtimeService.sendTypingIndicator(activeConversationId, false);

      // Mark message as delivered
      if (data) {
        await realtimeService.markMessageAsRead(data.id, user.id);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const uploadAttachments = async (files: File[], conversationId: string): Promise<FileAttachment[]> => {
    const uploadedFiles: FileAttachment[] = [];

    for (const file of files) {
      try {
        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `attachments/${conversationId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('chat-attachments')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Save file record
        const { data: fileRecord, error: dbError } = await supabase
          .from('file_attachments')
          .insert({
            conversation_id: conversationId,
            filename: file.name,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type,
            uploaded_by: user?.id
          })
          .select()
          .single();

        if (dbError) throw dbError;

        uploadedFiles.push(fileRecord);
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }

    return uploadedFiles;
  };

  const handleTyping = async (value: string) => {
    setInputValue(value);

    if (!activeConversationId) return;

    // Send typing indicator
    if (value.length > 0 && !isTyping) {
      setIsTyping(true);
      await realtimeService.sendTypingIndicator(activeConversationId, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(async () => {
      setIsTyping(false);
      if (activeConversationId) {
        await realtimeService.sendTypingIndicator(activeConversationId, false);
      }
    }, 1000);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageStatus = (message: Message) => {
    if (message.read_at) {
      return <CheckCheck size={12} className="text-blue-500" />;
    }
    return <Check size={12} className="text-gray-400" />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'normal': return 'border-blue-500 bg-blue-50';
      case 'low': return 'border-gray-500 bg-gray-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const activeMessages = activeConversationId ? messages[activeConversationId] || [] : [];
  const activeTypingUsers = activeConversationId ? typingUsers[activeConversationId] || [] : [];

  return (
    <div className="flex h-full bg-white dark:bg-gray-900">
      {/* Conversation Tabs */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Active Conversations</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400">No active conversations</p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-4 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  activeConversationId === conversation.id ? 'bg-primary-pink bg-opacity-10 border-l-4 border-l-primary-pink' : ''
                } ${getPriorityColor(conversation.priority)}`}
                onClick={() => {
                  setActiveConversationId(conversation.id);
                  onConversationSelect(conversation.id);
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {conversation.user_name}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      conversation.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      conversation.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      conversation.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {conversation.priority}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onConversationClose(conversation.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {conversation.last_message || 'No messages yet'}
                </p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">
                    {conversation.user_email}
                  </span>
                  {conversation.unread_count && conversation.unread_count > 0 && (
                    <span className="bg-primary-pink text-white text-xs rounded-full px-2 py-1">
                      {conversation.unread_count}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-pink flex items-center justify-center text-white font-semibold">
                    {activeConversation.user_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {activeConversation.user_name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {activeConversation.user_email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setShowCustomerProfile(true)}
                  >
                    <User size={16} />
                  </Button>
                  <Button variant="ghost">
                    <Phone size={16} />
                  </Button>
                  <Button variant="ghost">
                    <Video size={16} />
                  </Button>
                  <Button variant="ghost">
                    <MoreVertical size={16} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                             {activeConversationId && loading[activeConversationId] ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-pink"></div>
                </div>
              ) : activeMessages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500 dark:text-gray-400">Start the conversation</p>
                </div>
              ) : (
                activeMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_type === 'agent' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender_type === 'agent'
                          ? 'bg-primary-pink text-white'
                          : message.sender_type === 'ai'
                          ? 'bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      
                      {/* Attachments */}
                      {message.metadata?.attachments && message.metadata.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {message.metadata.attachments.map((attachment: FileAttachment, index: number) => (
                            <div key={index} className="flex items-center gap-2 text-xs bg-white bg-opacity-20 rounded p-2">
                              <Paperclip size={12} />
                              <span>{attachment.filename}</span>
                              <span className="opacity-75">({formatFileSize(attachment.file_size)})</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs opacity-75">
                          {formatTime(message.created_at)}
                        </span>
                        {message.sender_type === 'agent' && (
                          <div className="ml-2">
                            {getMessageStatus(message)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Typing Indicators */}
              {activeTypingUsers.length > 0 && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {activeTypingUsers.map(u => u.userName).join(', ')} typing...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Composer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              {/* Attachments Preview */}
              {attachments.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
                      <Paperclip size={14} />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                      <button
                        onClick={() => removeAttachment(index)}
                        className="hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full p-1"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-end gap-2">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowCannedResponses(true)}
                  >
                    <Hash size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                  >
                    <Smile size={16} />
                  </Button>
                </div>

                <div className="flex-1 relative">
                  <textarea
                    value={inputValue}
                    onChange={(e) => handleTyping(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type your message..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-pink focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={1}
                    style={{ minHeight: '40px', maxHeight: '120px' }}
                  />
                </div>

                <Button
                  variant="primary"
                  onClick={sendMessage}
                  disabled={!inputValue.trim() && attachments.length === 0}
                >
                  <Send size={16} />
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle size={64} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No conversation selected
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose a conversation from the sidebar to start chatting
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Canned Responses Modal */}
      <CannedResponses
        isVisible={showCannedResponses}
        onClose={() => setShowCannedResponses(false)}
        onSelectResponse={(content) => {
          setInputValue(prev => prev + (prev ? '\n' : '') + content);
          setShowCannedResponses(false);
        }}
        customerName={activeConversation?.user_name}
        customerEmail={activeConversation?.user_email}
      />

      {/* Customer Profile Modal */}
      {activeConversationId && (
        <CustomerProfile
          customerId={activeConversation?.user_email || ''}
          conversationId={activeConversationId}
          isVisible={showCustomerProfile}
          onClose={() => setShowCustomerProfile(false)}
        />
      )}
    </div>
  );
};