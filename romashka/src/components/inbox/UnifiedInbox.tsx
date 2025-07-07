import React, { useState, useEffect } from 'react';
import { ChannelManager } from '../../services/channels/channelManager';
import type { UnifiedConversation, ChannelType } from '../../services/channels/types';
import { Badge, Button, Skeleton } from '../ui';
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  Smartphone, 
  Instagram, 
  Facebook,
  Globe,
  Clock,
  User,
  Tag,
  Filter,
  Search
} from 'lucide-react';

interface UnifiedInboxProps {
  onConversationSelect?: (conversation: UnifiedConversation) => void;
  selectedConversationId?: string;
}

const channelIcons: Record<ChannelType, React.ComponentType<any>> = {
  whatsapp: Phone,
  messenger: Facebook,
  instagram: Instagram,
  email: Mail,
  sms: Smartphone,
  website: Globe
};

const channelColors: Record<ChannelType, string> = {
  whatsapp: 'bg-green-500',
  messenger: 'bg-blue-500',
  instagram: 'bg-pink-500',
  email: 'bg-gray-500',
  sms: 'bg-orange-500',
  website: 'bg-purple-500'
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800',
  normal: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

export const UnifiedInbox: React.FC<UnifiedInboxProps> = ({
  onConversationSelect,
  selectedConversationId
}) => {
  const [conversations, setConversations] = useState<UnifiedConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<ChannelType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [channelManager] = useState(() => new ChannelManager());

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const unifiedConversations = await channelManager.getUnifiedConversations();
      setConversations(unifiedConversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conversation => {
    const matchesChannel = selectedChannel === 'all' || 
      conversation.channels.some(ch => ch.type === selectedChannel);
    
    const matchesSearch = searchTerm === '' || 
      conversation.customerIdentity.phone?.includes(searchTerm) ||
      conversation.customerIdentity.socialId?.includes(searchTerm) ||
      conversation.customerIdentity.name?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesChannel && matchesSearch;
  });

  const getChannelStats = () => {
    const stats: Record<ChannelType, { count: number; unread: number }> = {
      whatsapp: { count: 0, unread: 0 },
      messenger: { count: 0, unread: 0 },
      instagram: { count: 0, unread: 0 },
      email: { count: 0, unread: 0 },
      sms: { count: 0, unread: 0 },
      website: { count: 0, unread: 0 }
    };

    conversations.forEach(conversation => {
      conversation.channels.forEach(channel => {
        stats[channel.type].count++;
        stats[channel.type].unread += channel.unreadCount;
      });
    });

    return stats;
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getCustomerDisplayName = (conversation: UnifiedConversation) => {
    return conversation.customerIdentity.name || 
           conversation.customerIdentity.phone || 
           conversation.customerIdentity.socialId || 
           'Unknown Customer';
  };

  const channelStats = getChannelStats();

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b">
          <Skeleton className="h-8 w-full mb-4" />
          <div className="flex gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-16" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full mb-4" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Unified Inbox</h2>
          <Button 
            variant="outline" 
            onClick={loadConversations}
          >
            Refresh
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Channel Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedChannel('all')}
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
              selectedChannel === 'all'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Globe className="h-4 w-4" />
            All ({conversations.length})
          </button>
          
          {Object.entries(channelStats).map(([channel, stats]) => {
            const Icon = channelIcons[channel as ChannelType];
            return (
              <button
                key={channel}
                onClick={() => setSelectedChannel(channel as ChannelType)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                  selectedChannel === channel
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {channel.charAt(0).toUpperCase() + channel.slice(1)} ({stats.count})
                {stats.unread > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {stats.unread}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageCircle className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">No conversations found</p>
            <p className="text-sm">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => onConversationSelect?.(conversation)}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConversationId === conversation.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {getCustomerDisplayName(conversation)}
                      </h3>
                      {conversation.assignedAgentId && (
                        <Badge variant="secondary" className="text-xs">
                          <User className="h-3 w-3 mr-1" />
                          Assigned
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex gap-1">
                        {conversation.channels.map((channel) => {
                          const Icon = channelIcons[channel.type];
                          return (
                            <div
                              key={channel.type}
                              className={`p-1 rounded-full ${channelColors[channel.type]}`}
                              title={`${channel.type}: ${channel.unreadCount} unread`}
                            >
                              <Icon className="h-3 w-3 text-white" />
                            </div>
                          );
                        })}
                      </div>

                      {conversation.priority !== 'normal' && (
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${priorityColors[conversation.priority]}`}
                        >
                          {conversation.priority}
                        </Badge>
                      )}

                      <span className="text-xs text-gray-500">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {formatTime(conversation.lastActivity)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{conversation.totalMessages} messages</span>
                      {conversation.tags.length > 0 && (
                        <div className="flex gap-1">
                          {conversation.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                          {conversation.tags.length > 2 && (
                            <span className="text-gray-400">
                              +{conversation.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {conversation.channels.some(ch => ch.unreadCount > 0) && (
                      <Badge variant="destructive" className="text-xs">
                        {conversation.channels.reduce((sum, ch) => sum + ch.unreadCount, 0)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 