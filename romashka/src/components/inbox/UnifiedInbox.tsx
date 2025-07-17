import React, { useState, useEffect, useCallback } from 'react';
import { 
  ChatBubbleLeftRightIcon, 
  EnvelopeIcon, 
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  CheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { useRealtimeMessages } from '../../hooks/useRealtimeMessages';
import type { UnifiedConversation, ChannelType, MessageContent } from '../../services/channels/types';

interface UnifiedInboxProps {
  onConversationSelect?: (conversation: UnifiedConversation) => void;
  onSendMessage?: (conversationId: string, content: MessageContent) => void;
}

interface ConversationFilter {
  channels: ChannelType[];
  status: 'all' | 'active' | 'pending' | 'resolved';
  priority: 'all' | 'low' | 'normal' | 'high' | 'urgent';
  assignee: 'all' | 'me' | 'unassigned';
  searchQuery: string;
}

const UnifiedInbox: React.FC<UnifiedInboxProps> = ({ 
  onConversationSelect,
  onSendMessage 
}) => {
  const [filter, setFilter] = useState<ConversationFilter>({
    channels: [],
    status: 'all',
    priority: 'all',
    assignee: 'all',
    searchQuery: ''
  });
  const [newMessage, setNewMessage] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateConversation, setShowCreateConversation] = useState(false);
  const [newConversationData, setNewConversationData] = useState({
    customerIdentifier: '',
    channelType: 'website' as ChannelType,
    initialMessage: ''
  });

  // Use the new real-time messaging hook
  const {
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
  } = useRealtimeMessages({
    autoLoadConversations: true,
    onNewMessage: (message) => {
      console.log('New message received:', message);
    },
    onConversationUpdate: (conversation) => {
      console.log('Conversation updated:', conversation);
    },
    onError: (error) => {
      console.error('Real-time messaging error:', error);
    }
  });

  // Channel icons mapping
  const channelIcons = {
    whatsapp: DevicePhoneMobileIcon,
    instagram: ChatBubbleLeftRightIcon,
    email: EnvelopeIcon,
    website: GlobeAltIcon,
    sms: DevicePhoneMobileIcon,
    messenger: ChatBubbleLeftRightIcon
  };

  // Channel colors mapping
  const channelColors = {
    whatsapp: 'bg-green-500',
    instagram: 'bg-pink-500',
    email: 'bg-blue-500',
    website: 'bg-purple-500',
    sms: 'bg-yellow-500',
    messenger: 'bg-indigo-500'
  };

  // Priority colors
  const priorityColors = {
    low: 'text-gray-500',
    normal: 'text-blue-500',
    high: 'text-orange-500',
    urgent: 'text-red-500'
  };

  // Handle conversation selection
  const handleConversationClick = useCallback(async (conversation: UnifiedConversation) => {
    try {
      await selectConversation(conversation);
      onConversationSelect?.(conversation);
    } catch (error) {
      console.error('Error selecting conversation:', error);
    }
  }, [selectConversation, onConversationSelect]);

  // Handle sending messages
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      await sendMessage(newMessage);
      setNewMessage('');
      
      // Call the prop callback if provided
      onSendMessage?.(selectedConversation.id, { text: newMessage });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [newMessage, selectedConversation, sendMessage, onSendMessage]);

  // Handle creating new conversation
  const handleCreateConversation = useCallback(async () => {
    if (!newConversationData.customerIdentifier.trim()) return;

    try {
      const conversation = await createConversation(
        newConversationData.customerIdentifier,
        newConversationData.channelType,
        newConversationData.initialMessage || undefined
      );
      
      setShowCreateConversation(false);
      setNewConversationData({
        customerIdentifier: '',
        channelType: 'website',
        initialMessage: ''
      });
      
      // Auto-select the new conversation
      await selectConversation(conversation);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  }, [newConversationData, createConversation, selectConversation]);

  // Handle marking messages as read
  const handleMarkAsRead = useCallback(async (messageId: string) => {
    try {
      await markMessageAsRead(messageId);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }, [markMessageAsRead]);

  // Get filtered conversations
  const filteredConversations = conversations.filter(conversation => {
    // Filter by search query
    if (filter.searchQuery) {
      const searchLower = filter.searchQuery.toLowerCase();
      if (!conversation.customerIdentity.name?.toLowerCase().includes(searchLower) &&
          !conversation.customerIdentity.email?.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // Filter by channel type
    if (filter.channels.length > 0) {
      const hasMatchingChannel = conversation.channels.some(channel => 
        filter.channels.includes(channel.type)
      );
      if (!hasMatchingChannel) return false;
    }

    // Filter by priority
    if (filter.priority !== 'all' && conversation.priority !== filter.priority) {
      return false;
    }

    // Filter by assignee
    if (filter.assignee === 'unassigned' && conversation.assignedAgentId) {
      return false;
    }

    return true;
  });

  // Handle key press for message input
  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const renderConversationItem = (conversation: UnifiedConversation) => {
    const totalUnread = conversation.channels.reduce((sum, ch) => sum + ch.unreadCount, 0);
    const primaryChannel = conversation.channels[0];
    const ChannelIcon = channelIcons[primaryChannel.type];
    
    return (
      <div
        key={conversation.id}
        onClick={() => handleConversationClick(conversation)}
        className={`p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${
          selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <div className="flex-shrink-0">
              <div className={`w-10 h-10 rounded-full ${channelColors[primaryChannel.type]} flex items-center justify-center`}>
                <ChannelIcon className="w-5 h-5 text-white" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {conversation.customerIdentity.name || 'Unknown Customer'}
                </p>
                <div className="flex space-x-1">
                  {conversation.channels.map(ch => {
                    const Icon = channelIcons[ch.type];
                    return (
                      <div
                        key={ch.type}
                        className={`w-4 h-4 rounded-full ${channelColors[ch.type]} flex items-center justify-center`}
                      >
                        <Icon className="w-2 h-2 text-white" />
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <p className="text-xs text-gray-500 truncate">
                {conversation.customerIdentity.email}
              </p>
              
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex space-x-1">
                  {conversation.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-1">
            <span className="text-xs text-gray-500">
              {format(conversation.lastActivity, 'HH:mm')}
            </span>
            
            <div className="flex items-center space-x-2">
              <span className={`text-xs font-medium ${priorityColors[conversation.priority]}`}>
                {conversation.priority}
              </span>
              
              {totalUnread > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                  {totalUnread}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMessage = (message: any) => {
    const isFromCustomer = message.isFromCustomer;
    const ChannelIcon = channelIcons[message.channelType];
    
    return (
      <div
        key={message.id}
        className={`flex items-start space-x-3 ${isFromCustomer ? 'justify-start' : 'justify-end'}`}
        onClick={() => handleMarkAsRead(message.id)}
      >
        {isFromCustomer && (
          <div className={`w-8 h-8 rounded-full ${channelColors[message.channelType]} flex items-center justify-center flex-shrink-0`}>
            <ChannelIcon className="w-4 h-4 text-white" />
          </div>
        )}
        
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isFromCustomer 
            ? 'bg-gray-200 text-gray-900' 
            : message.sender_type === 'ai' 
              ? 'bg-green-500 text-white'
              : 'bg-blue-500 text-white'
        }`}>
          <p className="text-sm">{message.content}</p>
          
          <div className="flex items-center justify-between mt-2">
            <span className={`text-xs ${isFromCustomer ? 'text-gray-500' : 'text-blue-100'}`}>
              {format(message.timestamp, 'HH:mm')}
            </span>
            
            {!isFromCustomer && (
              <div className="flex items-center space-x-1">
                {message.sender_type === 'ai' && (
                  <span className="text-xs text-white opacity-75">AI</span>
                )}
                {message.deliveryStatus === 'sent' && <ClockIcon className="w-3 h-3" />}
                {message.deliveryStatus === 'delivered' && <CheckIcon className="w-3 h-3" />}
                {message.deliveryStatus === 'read' && <CheckIcon className="w-3 h-3" />}
                {message.deliveryStatus === 'failed' && <ExclamationTriangleIcon className="w-3 h-3" />}
              </div>
            )}
          </div>
        </div>
        
        {!isFromCustomer && (
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-gray-600">
              {message.sender_type === 'ai' ? 'AI' : 'A'}
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderFilters = () => (
    <div className="p-4 border-b border-gray-200 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Channels</label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(channelIcons).map(([channel, Icon]) => (
            <button
              key={channel}
              onClick={() => {
                setFilter(prev => ({
                  ...prev,
                  channels: prev.channels.includes(channel as ChannelType)
                    ? prev.channels.filter(c => c !== channel)
                    : [...prev.channels, channel as ChannelType]
                }));
              }}
              className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                filter.channels.includes(channel as ChannelType)
                  ? `${channelColors[channel as ChannelType]} text-white`
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{channel}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
          <select
            value={filter.priority}
            onChange={(e) => setFilter(prev => ({ ...prev, priority: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Assignee</label>
          <select
            value={filter.assignee}
            onChange={(e) => setFilter(prev => ({ ...prev, assignee: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Assignees</option>
            <option value="me">Assigned to Me</option>
            <option value="unassigned">Unassigned</option>
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Conversations List */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">Inbox</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowCreateConversation(true)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                title="Create new conversation"
              >
                <PlusIcon className="w-5 h-5" />
              </button>
              <button
                onClick={loadConversations}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                title="Refresh conversations"
              >
                <ArrowPathIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                title="Filter conversations"
              >
                <FunnelIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={filter.searchQuery}
              onChange={(e) => setFilter(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Filters */}
        {showFilters && renderFilters()}

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            filteredConversations.map(renderConversationItem)
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {selectedConversation.customerIdentity.name?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">
                      {selectedConversation.customerIdentity.name || 'Unknown Customer'}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {selectedConversation.customerIdentity.email}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {selectedConversation.channels.map(ch => {
                    const Icon = channelIcons[ch.type];
                    return (
                      <div
                        key={ch.type}
                        className={`w-8 h-8 rounded-full ${channelColors[ch.type]} flex items-center justify-center`}
                      >
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(renderMessage)}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={handleKeyPress}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isLoading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-medium text-gray-900">Select a conversation</h2>
              <p className="text-gray-500">Choose a conversation from the list to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Conversation Modal */}
      {showCreateConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Conversation</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer (Email or Phone)
                </label>
                <input
                  type="text"
                  value={newConversationData.customerIdentifier}
                  onChange={(e) => setNewConversationData(prev => ({ ...prev, customerIdentifier: e.target.value }))}
                  placeholder="customer@example.com or +1234567890"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Channel
                </label>
                <select
                  value={newConversationData.channelType}
                  onChange={(e) => setNewConversationData(prev => ({ ...prev, channelType: e.target.value as ChannelType }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="website">Website</option>
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="instagram">Instagram</option>
                  <option value="sms">SMS</option>
                  <option value="messenger">Messenger</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Initial Message (Optional)
                </label>
                <textarea
                  value={newConversationData.initialMessage}
                  onChange={(e) => setNewConversationData(prev => ({ ...prev, initialMessage: e.target.value }))}
                  placeholder="Hi, I need help with..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateConversation(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateConversation}
                disabled={!newConversationData.customerIdentifier.trim() || isLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating...' : 'Create Conversation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="w-5 h-5" />
            <span>{error.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedInbox; 