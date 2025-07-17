import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  ClockIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  UserIcon,
  EllipsisVerticalIcon,
  ArrowPathIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { useRealtimeMessages } from '../../hooks/useRealtimeMessages';
import { realtimeMessagingService } from '../../services/messaging/realTimeMessaging';
import type { UnifiedConversation, ChannelType } from '../../services/channels/types';

interface ConversationListProps {
  onConversationSelect: (conversation: UnifiedConversation) => void;
  selectedConversationId?: string;
  onNewConversation?: () => void;
  onError?: (error: Error) => void;
}

interface ConversationFilter {
  channels: ChannelType[];
  status: 'all' | 'active' | 'pending' | 'resolved';
  priority: 'all' | 'low' | 'normal' | 'high' | 'urgent';
  assignee: 'all' | 'me' | 'unassigned';
  requiresHuman: 'all' | 'yes' | 'no';
  searchQuery: string;
}

const ConversationList: React.FC<ConversationListProps> = ({
  onConversationSelect,
  selectedConversationId,
  onNewConversation,
  onError
}) => {
  const [filter, setFilter] = useState<ConversationFilter>({
    channels: [],
    status: 'all',
    priority: 'all',
    assignee: 'all',
    requiresHuman: 'all',
    searchQuery: ''
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [conversationMenuId, setConversationMenuId] = useState<string | null>(null);

  // Use real-time messages hook
  const {
    conversations,
    isLoading,
    error,
    loadConversations,
    selectConversation,
    getPerformanceMetrics
  } = useRealtimeMessages({
    autoLoadConversations: true,
    onError: (error) => {
      console.error('Real-time messaging error:', error);
      onError?.(error);
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
    active: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-gray-100 text-gray-800',
    escalated: 'bg-red-100 text-red-800'
  };

  // Filter conversations based on current filter settings
  const filteredConversations = useMemo(() => {
    return conversations.filter(conversation => {
      // Search query filter
      if (filter.searchQuery) {
        const searchLower = filter.searchQuery.toLowerCase();
        const customerName = conversation.customerIdentity.name?.toLowerCase() || '';
        const customerEmail = conversation.customerIdentity.email?.toLowerCase() || '';
        const customerPhone = conversation.customerIdentity.phone?.toLowerCase() || '';
        
        if (!customerName.includes(searchLower) && 
            !customerEmail.includes(searchLower) && 
            !customerPhone.includes(searchLower)) {
          return false;
        }
      }

      // Channel filter
      if (filter.channels.length > 0) {
        const hasMatchingChannel = conversation.channels.some(channel => 
          filter.channels.includes(channel.type)
        );
        if (!hasMatchingChannel) return false;
      }

      // Priority filter
      if (filter.priority !== 'all' && conversation.priority !== filter.priority) {
        return false;
      }

      // Assignee filter
      if (filter.assignee === 'unassigned' && conversation.assignedAgentId) {
        return false;
      }

      // Status filter (if available in conversation data)
      // Note: You might need to add status field to UnifiedConversation type
      
      return true;
    });
  }, [conversations, filter]);

  // Handle conversation selection
  const handleConversationClick = useCallback(async (conversation: UnifiedConversation) => {
    try {
      await selectConversation(conversation);
      onConversationSelect(conversation);
    } catch (error) {
      console.error('Error selecting conversation:', error);
      onError?.(error instanceof Error ? error : new Error('Failed to select conversation'));
    }
  }, [selectConversation, onConversationSelect, onError]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadConversations();
    } catch (error) {
      console.error('Error refreshing conversations:', error);
      onError?.(error instanceof Error ? error : new Error('Failed to refresh conversations'));
    } finally {
      setIsRefreshing(false);
    }
  }, [loadConversations, onError]);

  // Handle new conversation
  const handleNewConversation = useCallback(() => {
    setConversationMenuId(null);
    onNewConversation?.();
  }, [onNewConversation]);

  // Handle conversation menu actions
  const handleConversationAction = useCallback((action: string, conversationId: string) => {
    setConversationMenuId(null);
    
    switch (action) {
      case 'mark_resolved':
        // TODO: Implement mark as resolved
        console.log('Mark as resolved:', conversationId);
        break;
      case 'assign_agent':
        // TODO: Implement assign agent
        console.log('Assign agent:', conversationId);
        break;
      case 'escalate':
        // TODO: Implement escalate
        console.log('Escalate:', conversationId);
        break;
      case 'add_note':
        // TODO: Implement add note
        console.log('Add note:', conversationId);
        break;
      default:
        break;
    }
  }, []);

  // Get conversation status
  const getConversationStatus = useCallback((conversation: UnifiedConversation) => {
    // This would typically come from the conversation data
    // For now, we'll derive it from available information
    
    if (conversation.totalMessages === 0) {
      return 'pending';
    }
    
    // Check if requires human intervention
    // This would need to be added to the conversation data
    
    return 'active';
  }, []);

  // Get time display
  const getTimeDisplay = useCallback((date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  }, []);

  // Render conversation item
  const renderConversationItem = useCallback((conversation: UnifiedConversation) => {
    const isSelected = selectedConversationId === conversation.id;
    const primaryChannel = conversation.channels[0];
    const ChannelIcon = channelIcons[primaryChannel.type];
    const status = getConversationStatus(conversation);
    const totalUnread = conversation.channels.reduce((sum, ch) => sum + ch.unreadCount, 0);
    
    return (
      <div
        key={conversation.id}
        onClick={() => handleConversationClick(conversation)}
        className={`relative p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors ${
          isSelected ? 'bg-blue-50 border-blue-200' : ''
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {/* Channel Icon */}
            <div className="flex-shrink-0 relative">
              <div className={`w-10 h-10 rounded-full ${channelColors[primaryChannel.type]} flex items-center justify-center`}>
                <ChannelIcon className="w-5 h-5 text-white" />
              </div>
              
              {/* Status indicator */}
              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                status === 'active' ? 'bg-green-500' :
                status === 'pending' ? 'bg-yellow-500' :
                status === 'resolved' ? 'bg-gray-500' :
                'bg-red-500'
              }`} />
            </div>
            
            <div className="flex-1 min-w-0">
              {/* Customer Name and Channel Icons */}
              <div className="flex items-center space-x-2 mb-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {conversation.customerIdentity.name || 'Unknown Customer'}
                </p>
                
                {/* Additional channel icons */}
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
              
              {/* Customer Contact Info */}
              <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
                {conversation.customerIdentity.email && (
                  <span className="truncate">{conversation.customerIdentity.email}</span>
                )}
                {conversation.customerIdentity.phone && (
                  <span className="truncate">{conversation.customerIdentity.phone}</span>
                )}
              </div>
              
              {/* Tags */}
              {conversation.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1">
                  {conversation.tags.slice(0, 2).map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {tag}
                    </span>
                  ))}
                  {conversation.tags.length > 2 && (
                    <span className="text-xs text-gray-400">
                      +{conversation.tags.length - 2} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Right side info */}
          <div className="flex flex-col items-end space-y-1 ml-2">
            {/* Time */}
            <span className="text-xs text-gray-500">
              {getTimeDisplay(conversation.lastActivity)}
            </span>
            
            {/* Priority and Status */}
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
            
            {/* Message count */}
            <div className="flex items-center space-x-1 text-xs text-gray-400">
              <ChatBubbleLeftRightIcon className="w-3 h-3" />
              <span>{conversation.totalMessages}</span>
            </div>
            
            {/* Menu button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConversationMenuId(
                  conversationMenuId === conversation.id ? null : conversation.id
                );
              }}
              className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
            >
              <EllipsisVerticalIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Conversation Menu */}
        {conversationMenuId === conversation.id && (
          <div className="absolute right-4 top-16 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10">
            <button
              onClick={() => handleConversationAction('mark_resolved', conversation.id)}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Mark as Resolved
            </button>
            <button
              onClick={() => handleConversationAction('assign_agent', conversation.id)}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Assign Agent
            </button>
            <button
              onClick={() => handleConversationAction('escalate', conversation.id)}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Escalate
            </button>
            <button
              onClick={() => handleConversationAction('add_note', conversation.id)}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Add Note
            </button>
          </div>
        )}
      </div>
    );
  }, [
    selectedConversationId,
    channelIcons,
    channelColors,
    getConversationStatus,
    getTimeDisplay,
    handleConversationClick,
    conversationMenuId,
    handleConversationAction
  ]);

  // Render filters
  const renderFilters = () => (
    <div className="p-4 border-b border-gray-200 space-y-4 bg-gray-50">
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
              className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm transition-colors ${
                filter.channels.includes(channel as ChannelType)
                  ? `${channelColors[channel as ChannelType]} text-white`
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            value={filter.status}
            onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>
    </div>
  );

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (conversationMenuId) {
        setConversationMenuId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [conversationMenuId]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Conversations</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleNewConversation}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="New conversation"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <ArrowPathIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Filters"
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

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-500">Loading conversations...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-2" />
              <p className="text-gray-500">Failed to load conversations</p>
              <button
                onClick={handleRefresh}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No conversations found</p>
              {filter.searchQuery && (
                <p className="text-sm text-gray-400 mt-1">
                  Try adjusting your search or filters
                </p>
              )}
            </div>
          </div>
        ) : (
          <div>
            {filteredConversations.map(renderConversationItem)}
          </div>
        )}
      </div>

      {/* Footer with stats */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            {filteredConversations.length} of {conversations.length} conversations
          </span>
          <span className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Real-time updates</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default ConversationList;