import React, { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { 
  ChatBubbleLeftRightIcon, 
  EnvelopeIcon, 
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { useRealtimeMessages } from '../../hooks/useRealtimeMessages';
import type { UnifiedConversation, ChannelType } from '../../services/channels/types';

interface ConversationListProps {
  onConversationSelect: (conversation: UnifiedConversation) => void;
  selectedConversationId?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  maxHeight?: string;
}

interface ConversationFilter {
  channels: ChannelType[];
  status: 'all' | 'active' | 'resolved' | 'escalated';
  priority: 'all' | 'low' | 'normal' | 'high' | 'urgent';
  assignee: 'all' | 'me' | 'unassigned';
  searchQuery: string;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  onConversationSelect,
  selectedConversationId,
  showSearch = true,
  showFilters = true,
  maxHeight = '600px'
}) => {
  const [filter, setFilter] = useState<ConversationFilter>({
    channels: [],
    status: 'all',
    priority: 'all',
    assignee: 'all',
    searchQuery: ''
  });
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  const {
    conversations,
    isLoading,
    error,
    loadConversations,
    getPerformanceMetrics
  } = useRealtimeMessages({
    autoLoadConversations: true,
    onNewMessage: (message) => {
      console.log('New message in conversation list:', message);
    },
    onError: (error) => {
      console.error('Conversation list error:', error);
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

  // Status colors
  const statusColors = {
    active: 'text-green-600',
    resolved: 'text-blue-600',
    escalated: 'text-red-600',
    closed: 'text-gray-600'
  };

  // Filter conversations based on current filters
  const filteredConversations = conversations.filter(conversation => {
    // Filter by search query
    if (filter.searchQuery) {
      const searchLower = filter.searchQuery.toLowerCase();
      const matchesName = conversation.customerIdentity.name?.toLowerCase().includes(searchLower);
      const matchesEmail = conversation.customerIdentity.email?.toLowerCase().includes(searchLower);
      const matchesTags = conversation.tags.some(tag => tag.toLowerCase().includes(searchLower));
      
      if (!matchesName && !matchesEmail && !matchesTags) {
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

  // Handle conversation click
  const handleConversationClick = useCallback((conversation: UnifiedConversation) => {
    onConversationSelect(conversation);
  }, [onConversationSelect]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    loadConversations();
  }, [loadConversations]);

  // Render conversation item
  const renderConversationItem = useCallback((conversation: UnifiedConversation) => {
    const totalUnread = conversation.channels.reduce((sum, ch) => sum + ch.unreadCount, 0);
    const primaryChannel = conversation.channels[0];
    const ChannelIcon = channelIcons[primaryChannel.type];
    const isSelected = selectedConversationId === conversation.id;
    
    return (
      <div
        key={conversation.id}
        onClick={() => handleConversationClick(conversation)}
        className={`
          p-4 border-b border-gray-200 cursor-pointer transition-colors duration-200
          ${isSelected 
            ? 'bg-blue-50 border-blue-200 border-l-4 border-l-blue-500' 
            : 'hover:bg-gray-50'
          }
        `}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            {/* Channel Avatar */}
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
              ${channelColors[primaryChannel.type]}
            `}>
              <ChannelIcon className="w-5 h-5 text-white" />
            </div>
            
            {/* Conversation Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {conversation.customerIdentity.name || 'Unknown Customer'}
                </h3>
                
                {/* Multiple channel indicators */}
                {conversation.channels.length > 1 && (
                  <div className="flex space-x-1">
                    {conversation.channels.slice(1).map(ch => {
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
                )}
              </div>
              
              {/* Customer Email */}
              <p className="text-xs text-gray-500 truncate mt-1">
                {conversation.customerIdentity.email || conversation.customerIdentity.phone}
              </p>
              
              {/* Tags */}
              {conversation.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {conversation.tags.slice(0, 3).map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {tag}
                    </span>
                  ))}
                  {conversation.tags.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{conversation.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}
              
              {/* Last Message Preview */}
              <p className="text-sm text-gray-600 truncate mt-1">
                {/* This would show the last message content */}
                Last message preview...
              </p>
            </div>
          </div>
          
          {/* Right Side Info */}
          <div className="flex flex-col items-end space-y-1 flex-shrink-0">
            {/* Timestamp */}
            <span className="text-xs text-gray-500">
              {format(conversation.lastActivity, 'HH:mm')}
            </span>
            
            {/* Status & Priority */}
            <div className="flex items-center space-x-2">
              <span className={`text-xs font-medium ${priorityColors[conversation.priority]}`}>
                {conversation.priority}
              </span>
              
              {/* Agent Assignment */}
              {conversation.assignedAgentId ? (
                <UserIcon className="w-4 h-4 text-green-500" />
              ) : (
                <UserIcon className="w-4 h-4 text-gray-400" />
              )}
            </div>
            
            {/* Unread Count */}
            {totalUnread > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                {totalUnread}
              </span>
            )}
            
            {/* Message Count */}
            <span className="text-xs text-gray-400">
              {conversation.totalMessages} msgs
            </span>
          </div>
        </div>
      </div>
    );
  }, [selectedConversationId, handleConversationClick, channelIcons, channelColors, priorityColors]);

  // Render filters panel
  const renderFiltersPanel = () => (
    <div className="p-4 border-b border-gray-200 bg-gray-50 space-y-4">
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
              className={`
                flex items-center space-x-2 px-3 py-1 rounded-full text-sm transition-colors
                ${filter.channels.includes(channel as ChannelType)
                  ? `${channelColors[channel as ChannelType]} text-white`
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="capitalize">{channel}</span>
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Conversations ({filteredConversations.length})
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              title="Refresh conversations"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            {showFilters && (
              <button
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                title="Filter conversations"
              >
                <FunnelIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        {showSearch && (
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
        )}
      </div>

      {/* Filters Panel */}
      {showFiltersPanel && renderFiltersPanel()}

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto" style={{ maxHeight }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <ExclamationCircleIcon className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Error loading conversations</p>
              <button
                onClick={handleRefresh}
                className="mt-2 px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <ChatBubbleLeftRightIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No conversations found</p>
              <p className="text-xs text-gray-500 mt-1">
                {filter.searchQuery || filter.channels.length > 0 
                  ? 'Try adjusting your filters'
                  : 'Conversations will appear here when customers message you'
                }
              </p>
            </div>
          </div>
        ) : (
          filteredConversations.map(renderConversationItem)
        )}
      </div>
    </div>
  );
};

export default ConversationList;