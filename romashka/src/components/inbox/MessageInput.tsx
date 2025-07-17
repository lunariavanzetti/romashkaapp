import React, { useState, useRef, useCallback } from 'react';
import { 
  PaperAirplaneIcon, 
  PhotoIcon, 
  PaperClipIcon, 
  EmojiHappyIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { realtimeMessagingService } from '../../services/messaging/realTimeMessaging';
import type { MessageContent, ChannelType } from '../../services/channels/types';

interface MessageInputProps {
  conversationId: string;
  channelType: ChannelType;
  onMessageSent?: (message: string) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  allowAttachments?: boolean;
  allowEmojis?: boolean;
}

interface MessageStatus {
  type: 'idle' | 'sending' | 'sent' | 'error' | 'ai_responding';
  message?: string;
  timestamp?: Date;
}

const MessageInput: React.FC<MessageInputProps> = ({
  conversationId,
  channelType,
  onMessageSent,
  onError,
  disabled = false,
  placeholder = "Type a message...",
  maxLength = 2000,
  allowAttachments = true,
  allowEmojis = true
}) => {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<MessageStatus>({ type: 'idle' });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Common emojis for quick access
  const commonEmojis = ['😊', '😢', '😂', '👍', '👎', '❤️', '🙏', '😎', '🤔', '😮'];

  /**
   * Handle message sending
   */
  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || status.type === 'sending' || disabled) {
      return;
    }

    const messageContent = message.trim();
    
    try {
      setStatus({ type: 'sending', message: 'Sending message...' });
      
      // Send message through real-time service
      const aiResponse = await realtimeMessagingService.sendMessage(
        messageContent,
        conversationId,
        'agent'
      );
      
      // Clear input
      setMessage('');
      setAttachments([]);
      
      // Update status
      setStatus({ 
        type: 'sent', 
        message: 'Message sent',
        timestamp: new Date()
      });
      
      // Show AI responding status if AI will respond
      if (aiResponse.confidence >= 0.6 && !aiResponse.requiresHuman) {
        setStatus({ 
          type: 'ai_responding', 
          message: 'AI is responding...',
          timestamp: new Date()
        });
        
        // Clear status after response time
        setTimeout(() => {
          setStatus({ type: 'idle' });
        }, aiResponse.responseTime + 1000);
      } else {
        // Clear status after 2 seconds
        setTimeout(() => {
          setStatus({ type: 'idle' });
        }, 2000);
      }
      
      // Notify parent
      onMessageSent?.(messageContent);
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      setStatus({ 
        type: 'error', 
        message: 'Failed to send message',
        timestamp: new Date()
      });
      
      // Clear error status after 3 seconds
      setTimeout(() => {
        setStatus({ type: 'idle' });
      }, 3000);
      
      // Notify parent of error
      onError?.(error instanceof Error ? error : new Error('Failed to send message'));
    }
  }, [message, conversationId, status.type, disabled, onMessageSent, onError]);

  /**
   * Handle key press events
   */
  const handleKeyPress = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  /**
   * Handle message text changes
   */
  const handleMessageChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = event.target.value;
    
    if (newMessage.length <= maxLength) {
      setMessage(newMessage);
      
      // Handle typing indicator
      if (!isTyping && newMessage.length > 0) {
        setIsTyping(true);
        // Send typing indicator to other participants
        // This would be implemented with WebSocket or similar
      }
      
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 1000);
    }
  }, [maxLength, isTyping]);

  /**
   * Handle file attachments
   */
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    
    const newAttachments: File[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        onError?.(new Error(`File "${file.name}" is too large. Maximum size is 10MB.`));
        continue;
      }
      
      // Check file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        onError?.(new Error(`File type "${file.type}" is not supported.`));
        continue;
      }
      
      newAttachments.push(file);
    }
    
    setAttachments(prev => [...prev, ...newAttachments]);
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onError]);

  /**
   * Remove attachment
   */
  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * Insert emoji
   */
  const insertEmoji = useCallback((emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const cursorPosition = textarea.selectionStart;
    const newMessage = message.slice(0, cursorPosition) + emoji + message.slice(cursorPosition);
    
    if (newMessage.length <= maxLength) {
      setMessage(newMessage);
      
      // Reset cursor position
      setTimeout(() => {
        textarea.setSelectionRange(cursorPosition + emoji.length, cursorPosition + emoji.length);
      }, 0);
    }
    
    setShowEmojiPicker(false);
  }, [message, maxLength]);

  /**
   * Auto-resize textarea
   */
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, []);

  React.useEffect(() => {
    adjustTextareaHeight();
  }, [message, adjustTextareaHeight]);

  /**
   * Get status icon
   */
  const getStatusIcon = () => {
    switch (status.type) {
      case 'sending':
        return <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />;
      case 'sent':
        return <CheckIcon className="w-4 h-4 text-green-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />;
      case 'ai_responding':
        return <div className="animate-pulse w-4 h-4 bg-blue-500 rounded-full" />;
      default:
        return null;
    }
  };

  /**
   * Get status color
   */
  const getStatusColor = () => {
    switch (status.type) {
      case 'sending':
        return 'text-blue-500';
      case 'sent':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'ai_responding':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <div key={index} className="flex items-center bg-gray-100 rounded-lg px-3 py-2">
              <PaperClipIcon className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-sm text-gray-700 truncate max-w-32">{file.name}</span>
              <button
                onClick={() => removeAttachment(index)}
                className="ml-2 text-gray-400 hover:text-red-500"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg border">
          <div className="flex flex-wrap gap-2">
            {commonEmojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => insertEmoji(emoji)}
                className="text-xl hover:bg-gray-200 rounded p-1 transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end space-x-3">
        {/* Attachment Button */}
        {allowAttachments && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Attach file"
          >
            <PaperClipIcon className="w-5 h-5" />
          </button>
        )}

        {/* Photo Button */}
        {allowAttachments && (
          <button
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.accept = 'image/*';
                fileInputRef.current.click();
              }
            }}
            disabled={disabled}
            className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Add photo"
          >
            <PhotoIcon className="w-5 h-5" />
          </button>
        )}

        {/* Message Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleMessageChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            rows={1}
            maxLength={maxLength}
          />
          
          {/* Character Count */}
          {message.length > maxLength * 0.8 && (
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {message.length}/{maxLength}
            </div>
          )}
        </div>

        {/* Emoji Button */}
        {allowEmojis && (
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={disabled}
            className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Add emoji"
          >
            <EmojiHappyIcon className="w-5 h-5" />
          </button>
        )}

        {/* Send Button */}
        <button
          onClick={handleSendMessage}
          disabled={!message.trim() || status.type === 'sending' || disabled}
          className="flex-shrink-0 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Send message"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Status Bar */}
      {status.type !== 'idle' && (
        <div className="mt-2 flex items-center space-x-2">
          {getStatusIcon()}
          <span className={`text-sm ${getStatusColor()}`}>
            {status.message}
          </span>
          {status.timestamp && (
            <span className="text-xs text-gray-400">
              {status.timestamp.toLocaleTimeString()}
            </span>
          )}
        </div>
      )}

      {/* Typing Indicator */}
      {isTyping && (
        <div className="mt-2 text-xs text-gray-400">
          Typing...
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      />
    </div>
  );
};

export default MessageInput;