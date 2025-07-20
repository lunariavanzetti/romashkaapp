import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChatBubbleLeftRightIcon, 
  XMarkIcon, 
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  MinusIcon,
  ArrowsPointingOutIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useRealTimeChat, type ChatMessage } from '../../hooks/useRealTimeChat';
import { ConversationMonitoringService } from '../../services/conversationMonitoringService';

interface ChatWidgetProps {
  agentName?: string;
  agentTone?: 'friendly' | 'professional' | 'casual';
  businessType?: string;
  position?: 'bottom-right' | 'bottom-left';
  theme?: 'light' | 'dark' | 'auto';
  primaryColor?: string;
  welcomeMessage?: string;
  knowledgeBase?: string;
  enableFileUpload?: boolean;
  enableEmojis?: boolean;
  maxFileSize?: number; // in MB
  allowedFileTypes?: string[];
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  agentName = 'ROMASHKA',
  agentTone = 'friendly',
  businessType = 'general',
  position = 'bottom-right',
  theme = 'auto',
  primaryColor = '#ec4899',
  welcomeMessage,
  knowledgeBase = '',
  enableFileUpload = true,
  enableEmojis = true,
  maxFileSize = 10,
  allowedFileTypes = ['image/*', '.pdf', '.doc', '.docx', '.txt']
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [conversationId] = useState(`conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [userId] = useState(`user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [showWelcome, setShowWelcome] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use the enhanced real-time chat hook
  const {
    messages,
    participants,
    typingIndicators,
    isConnected,
    isLoading,
    error,
    sendMessage,
    setTyping,
    retryMessage,
    unreadCount,
    isAnyoneTyping,
    onlineParticipants
  } = useRealTimeChat({
    conversationId,
    userId,
    onMessageReceived: (message) => {
      // Play notification sound or show notification
      if (message.sender !== 'user' && !isOpen) {
        // Show notification badge or play sound
        console.log('New message received:', message);
      }
    },
    onError: (error) => {
      console.error('Chat error:', error);
    },
    autoMarkAsRead: true
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send welcome message when chat opens for the first time
  useEffect(() => {
    if (isOpen && showWelcome && messages.length === 0) {
      const welcome = welcomeMessage || generateWelcomeMessage();
      setTimeout(() => {
        sendMessage(welcome, 'text', { isWelcome: true, agentName, businessType });
        setShowWelcome(false);
      }, 500);
    }
  }, [isOpen, showWelcome, messages.length, welcomeMessage, agentName, businessType, sendMessage]);

  // Generate contextual welcome message
  const generateWelcomeMessage = useCallback(() => {
    const greetings = {
      friendly: `Hi there! 👋 I'm ${agentName}, your friendly AI assistant. I'm here to help you with any questions you might have!`,
      professional: `Good day. I'm ${agentName}, your AI customer service representative. How may I assist you today?`,
      casual: `Hey! 😊 ${agentName} here. What's up? How can I help you out?`
    };
    
    const businessContext = {
      ecommerce: ' Whether it\'s about products, orders, shipping, or returns, I\'m here to help!',
      service: ' I can help you with our services, pricing, or connect you with our team.',
      saas: ' Need help with features, billing, or technical questions? I\'ve got you covered!',
      education: ' Questions about courses, enrollment, or learning resources? I\'m here to help!',
      healthcare: ' I can assist with appointments, services, or general inquiries.',
      other: ' I\'m here to answer your questions and provide assistance.'
    };
    
    return greetings[agentTone] + (businessContext[businessType as keyof typeof businessContext] || businessContext.other);
  }, [agentName, agentTone, businessType]);

  // Handle sending messages
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() && attachments.length === 0) return;

    const messageContent = inputValue.trim();
    const messageAttachments = [...attachments];

    // Clear input and attachments immediately for better UX
    setInputValue('');
    setAttachments([]);

    try {
      // Send message with attachments if any
      await sendMessage(
        messageContent || '📎 File attachment',
        attachments.length > 0 ? 'file' : 'text',
        { 
          attachments: messageAttachments.map(file => ({
            name: file.name,
            size: file.size,
            type: file.type
          }))
        }
      );

      // Record user activity for analytics
      await ConversationMonitoringService.recordAIResponse(
        conversationId,
        Date.now(),
        true
      );

    } catch (error) {
      console.error('Error sending message:', error);
      // Re-add the message content if sending failed
      setInputValue(messageContent);
      setAttachments(messageAttachments);
    }
  }, [inputValue, attachments, sendMessage, conversationId]);

  // Handle typing indicator
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    
    // Send typing indicator
    if (e.target.value.trim()) {
      setTyping(true);
    } else {
      setTyping(false);
    }
  }, [setTyping]);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is ${maxFileSize}MB.`);
        return false;
      }
      return true;
    });

    setAttachments(prev => [...prev, ...validFiles]);
    
    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [maxFileSize]);

  // Remove attachment
  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Add emoji
  const addEmoji = useCallback((emoji: string) => {
    setInputValue(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  }, []);

  // Get message status icon
  const getMessageStatusIcon = (message: ChatMessage) => {
    switch (message.status) {
      case 'sending':
        return <ClockIcon className="w-3 h-3 text-gray-400 animate-pulse" />;
      case 'sent':
        return <CheckIcon className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckIcon className="w-3 h-3 text-blue-500" />;
      case 'read':
        return <CheckIcon className="w-3 h-3 text-green-500" />;
      case 'failed':
        return (
          <button 
            onClick={() => retryMessage(message.id)}
            className="text-red-500 hover:text-red-700"
            title="Click to retry"
          >
            <ExclamationTriangleIcon className="w-3 h-3" />
          </button>
        );
      default:
        return null;
    }
  };

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
  };

  const commonEmojis = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '💯', '✨', '😎', '🤔', '😢', '😡', '🤗', '👋', '💪', '🎯'];

  return (
    <>
      {/* Chat Toggle Button */}
      <motion.button
        className={`fixed ${positionClasses[position]} w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50 flex items-center justify-center`}
        style={{ backgroundColor: primaryColor }}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {/* Unread message badge */}
        {unreadCount > 0 && !isOpen && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
        
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <XMarkIcon className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`fixed ${positionClasses[position]} ${
              isMinimized ? 'w-80 h-14' : 'w-96 h-[500px]'
            } bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl z-40 flex flex-col overflow-hidden`}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700" style={{ backgroundColor: primaryColor }}>
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} ${isConnected ? 'animate-pulse' : ''}`}></div>
                <div className="text-white">
                  <h3 className="font-semibold text-sm">{agentName} AI</h3>
                  <p className="text-xs opacity-90">
                    {isConnected ? 'Online' : 'Connecting...'} • {onlineParticipants.length} agent{onlineParticipants.length !== 1 ? 's' : ''} available
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 rounded hover:bg-white/20 transition-colors"
                  aria-label={isMinimized ? 'Maximize' : 'Minimize'}
                >
                  {isMinimized ? (
                    <ArrowsPointingOutIcon className="w-4 h-4 text-white" />
                  ) : (
                    <MinusIcon className="w-4 h-4 text-white" />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded hover:bg-white/20 transition-colors"
                  aria-label="Close chat"
                >
                  <XMarkIcon className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                      <div className="flex items-center space-x-2">
                        <ExclamationTriangleIcon className="w-4 h-4" />
                        <span>Connection error: {error}</span>
                      </div>
                    </div>
                  )}

                  {isLoading && messages.length === 0 && (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: primaryColor }}></div>
                    </div>
                  )}

                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[280px] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            message.sender === 'user'
                              ? 'text-white rounded-br-sm'
                              : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-bl-sm'
                          }`}
                          style={message.sender === 'user' ? { backgroundColor: primaryColor } : {}}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                          
                          {/* Attachments */}
                          {message.metadata?.attachments && message.metadata.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {message.metadata.attachments.map((attachment: any, index: number) => (
                                <div key={index} className="flex items-center space-x-1 text-xs opacity-75">
                                  <PaperClipIcon className="w-3 h-3" />
                                  <span>{attachment.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Message status and timestamp */}
                        <div className={`flex items-center space-x-1 mt-1 text-xs text-gray-500 ${
                          message.sender === 'user' ? 'justify-end' : 'justify-start'
                        }`}>
                          <span>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {message.sender === 'user' && getMessageStatusIcon(message)}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Typing Indicators */}
                  <AnimatePresence>
                    {isAnyoneTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex justify-start"
                      >
                        <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl rounded-bl-sm px-4 py-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                  {/* Attachments Preview */}
                  {attachments.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1 text-sm"
                        >
                          <PaperClipIcon className="w-4 h-4 text-gray-500" />
                          <span className="truncate max-w-[100px]">{file.name}</span>
                          <button
                            onClick={() => removeAttachment(index)}
                            className="text-red-500 hover:text-red-700 ml-1"
                          >
                            <XMarkIcon className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-end space-x-2">
                    {/* File Upload Button */}
                    {enableFileUpload && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                        aria-label="Attach file"
                      >
                        <PaperClipIcon className="w-5 h-5" />
                      </button>
                    )}

                    {/* Message Input */}
                    <div className="flex-1 relative">
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-opacity-50 resize-none"
                        style={{ focusRingColor: primaryColor }}
                        disabled={!isConnected}
                      />

                      {/* Emoji Button */}
                      {enableEmojis && (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                          <button
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                            aria-label="Add emoji"
                          >
                            <FaceSmileIcon className="w-4 h-4" />
                          </button>

                          {/* Emoji Picker */}
                          <AnimatePresence>
                            {showEmojiPicker && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg z-10"
                              >
                                <div className="grid grid-cols-8 gap-1">
                                  {commonEmojis.map((emoji) => (
                                    <button
                                      key={emoji}
                                      onClick={() => addEmoji(emoji)}
                                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-lg"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>

                    {/* Send Button */}
                    <button
                      onClick={handleSendMessage}
                      disabled={(!inputValue.trim() && attachments.length === 0) || !isConnected}
                      className="p-2 rounded-full text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
                      style={{ backgroundColor: primaryColor }}
                      aria-label="Send message"
                    >
                      <PaperAirplaneIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileUpload}
        className="hidden"
        accept={allowedFileTypes.join(',')}
      />
    </>
  );
}; 