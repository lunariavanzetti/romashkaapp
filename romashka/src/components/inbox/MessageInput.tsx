import React, { useState, useRef, useCallback } from 'react';
import { 
  PaperAirplaneIcon, 
  PaperClipIcon, 
  FaceSmileIcon,
  MicrophoneIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { useRealtimeMessages } from '../../hooks/useRealtimeMessages';

interface MessageInputProps {
  conversationId: string;
  onSendMessage: (message: string) => Promise<void>;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  showAttachments?: boolean;
  showEmoji?: boolean;
  showVoice?: boolean;
  maxLength?: number;
  onTyping?: (isTyping: boolean) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  conversationId,
  onSendMessage,
  isLoading = false,
  placeholder = "Type a message...",
  disabled = false,
  showAttachments = true,
  showEmoji = false,
  showVoice = false,
  maxLength = 2000,
  onTyping
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle typing indicator
  const handleTypingStart = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      onTyping?.(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTyping?.(false);
    }, 3000); // Stop typing after 3 seconds of inactivity
  }, [isTyping, onTyping]);

  const handleTypingStop = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsTyping(false);
    onTyping?.(false);
  }, [onTyping]);

  // Handle message change
  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    // Check max length
    if (value.length > maxLength) {
      return;
    }

    setMessage(value);
    
    // Trigger typing indicator
    if (value.length > 0) {
      handleTypingStart();
    } else {
      handleTypingStop();
    }

    // Auto-resize textarea
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [maxLength, handleTypingStart, handleTypingStop]);

  // Handle send message
  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || isSending || disabled) return;

    const messageToSend = message.trim();
    setMessage('');
    setIsSending(true);
    handleTypingStop();

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    try {
      await onSendMessage(messageToSend);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore message on error
      setMessage(messageToSend);
    } finally {
      setIsSending(false);
    }
  }, [message, isSending, disabled, onSendMessage, handleTypingStop]);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Handle attachment click
  const handleAttachmentClick = useCallback(() => {
    // TODO: Implement file attachment
    console.log('Attachment clicked');
  }, []);

  // Handle emoji click
  const handleEmojiClick = useCallback(() => {
    // TODO: Implement emoji picker
    console.log('Emoji clicked');
  }, []);

  // Handle voice click
  const handleVoiceClick = useCallback(() => {
    // TODO: Implement voice recording
    console.log('Voice clicked');
  }, []);

  // Focus input
  const focusInput = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const canSend = message.trim().length > 0 && !isSending && !disabled;

  return (
    <div className="bg-white border-t border-gray-200 px-4 py-3">
      <div className="flex items-end space-x-3">
        {/* Attachment Button */}
        {showAttachments && (
          <button
            onClick={handleAttachmentClick}
            className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            title="Attach file"
          >
            <PaperClipIcon className="w-5 h-5" />
          </button>
        )}

        {/* Message Input Area */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleMessageChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            rows={1}
            className={`
              w-full px-3 py-2 border border-gray-300 rounded-lg 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              resize-none transition-colors duration-200
              ${disabled || isLoading ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
              ${message.length > maxLength * 0.9 ? 'border-yellow-400' : ''}
            `}
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          
          {/* Character count */}
          {message.length > maxLength * 0.8 && (
            <div className="absolute -top-6 right-0 text-xs text-gray-500">
              {message.length}/{maxLength}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1">
          {/* Emoji Button */}
          {showEmoji && (
            <button
              onClick={handleEmojiClick}
              className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              title="Add emoji"
            >
              <FaceSmileIcon className="w-5 h-5" />
            </button>
          )}

          {/* Voice Button */}
          {showVoice && (
            <button
              onClick={handleVoiceClick}
              className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              title="Voice message"
            >
              <MicrophoneIcon className="w-5 h-5" />
            </button>
          )}

          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={!canSend}
            className={`
              flex-shrink-0 p-2 rounded-lg transition-colors duration-200
              ${canSend 
                ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
            title={isSending ? 'Sending...' : 'Send message'}
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <PaperAirplaneIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Typing Indicator */}
      {isTyping && (
        <div className="mt-2 text-xs text-gray-500">
          Typing...
        </div>
      )}

      {/* Status Messages */}
      {isLoading && (
        <div className="mt-2 text-xs text-blue-500">
          Loading conversation...
        </div>
      )}
    </div>
  );
};

export default MessageInput;