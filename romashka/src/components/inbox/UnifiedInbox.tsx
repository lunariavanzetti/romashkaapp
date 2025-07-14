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
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
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

interface Message {
  id: string;
  content: MessageContent;
  timestamp: Date;
  isFromCustomer: boolean;
  deliveryStatus: 'sent' | 'delivered' | 'read' | 'failed';
  channelType: ChannelType;
}

const UnifiedInbox: React.FC<UnifiedInboxProps> = ({ 
  onConversationSelect,
  onSendMessage 
}) => {
  const [conversations, setConversations] = useState<UnifiedConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<UnifiedConversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [filter, setFilter] = useState<ConversationFilter>({
    channels: [],
    status: 'all',
    priority: 'all',
    assignee: 'all',
    searchQuery: ''
  });
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

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

  // Load conversations
  useEffect(() => {
    loadConversations();
  }, [filter]);

  // Load messages for selected conversation
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      // This would call your API to load conversations
      // For now, using mock data
      const mockConversations: UnifiedConversation[] = [
        {
          id: 'conv-1',
          customerIdentity: {
            id: 'cust-1',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+1234567890',
            channels: ['whatsapp', 'email']
          },
          channels: [
            { type: 'whatsapp', conversationId: 'wa-1', lastMessage: new Date(), unreadCount: 2 },
            { type: 'email', conversationId: 'em-1', lastMessage: new Date(), unreadCount: 0 }
          ],
          assignedAgentId: 'agent-1',
          priority: 'normal',
          tags: ['support', 'billing'],
          lastActivity: new Date(),
          totalMessages: 15
        },
        {
          id: 'conv-2',
          customerIdentity: {
            id: 'cust-2',
            name: 'Jane Smith',
            email: 'jane@example.com',
            channels: ['instagram', 'website']
          },
          channels: [
            { type: 'instagram', conversationId: 'ig-1', lastMessage: new Date(), unreadCount: 1 },
            { type: 'website', conversationId: 'web-1', lastMessage: new Date(), unreadCount: 3 }
          ],
          priority: 'high',
          tags: ['sales', 'demo'],
          lastActivity: new Date(),
          totalMessages: 8
        }
      ];
      
      setConversations(mockConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  const loadMessages = async (conversationId: string) => {
    try {
      // This would call your API to load messages
      // For now, using mock data
      const mockMessages: Message[] = [
        {
          id: 'msg-1',
          content: { text: 'Hello, I need help with my order' },
          timestamp: new Date(Date.now() - 3600000),
          isFromCustomer: true,
          deliveryStatus: 'read',
          channelType: 'whatsapp'
        },
        {
          id: 'msg-2',
          content: { text: 'Hi! I\'d be happy to help you with your order. Can you provide your order number?' },
          timestamp: new Date(Date.now() - 3300000),
          isFromCustomer: false,
          deliveryStatus: 'read',
          channelType: 'whatsapp'
        },
        {
          id: 'msg-3',
          content: { text: 'My order number is #12345' },
          timestamp: new Date(Date.now() - 3000000),
          isFromCustomer: true,
          deliveryStatus: 'read',
          channelType: 'whatsapp'
        }
      ];
      
      setMessages(mockMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleConversationClick = (conversation: UnifiedConversation) => {
    setSelectedConversation(conversation);
    onConversationSelect?.(conversation);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const messageContent: MessageContent = { text: newMessage };
    
    try {
      await onSendMessage?.(selectedConversation.id, messageContent);
      
      // Add message to local state
      const newMsg: Message = {
        id: `msg-${Date.now()}`,
        content: messageContent,
        timestamp: new Date(),
        isFromCustomer: false,
        deliveryStatus: 'sent',
        channelType: selectedConversation.channels[0].type
      };
      
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    // Filter by channels
    if (filter.channels.length > 0) {
      const hasMatchingChannel = conv.channels.some(ch => filter.channels.includes(ch.type));
      if (!hasMatchingChannel) return false;
    }

    // Filter by priority
    if (filter.priority !== 'all' && conv.priority !== filter.priority) {
      return false;
    }

    // Filter by search query
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      const customerName = conv.customerIdentity.name?.toLowerCase() || '';
      const customerEmail = conv.customerIdentity.email?.toLowerCase() || '';
      const tags = conv.tags.join(' ').toLowerCase();
      
      if (!customerName.includes(query) && !customerEmail.includes(query) && !tags.includes(query)) {
        return false;
      }
    }

    return true;
  });

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

  const renderMessage = (message: Message) => {
    const isFromCustomer = message.isFromCustomer;
    const ChannelIcon = channelIcons[message.channelType];
    
    return (
      <div
        key={message.id}
        className={`flex items-start space-x-3 ${isFromCustomer ? 'justify-start' : 'justify-end'}`}
      >
        {isFromCustomer && (
          <div className={`w-8 h-8 rounded-full ${channelColors[message.channelType]} flex items-center justify-center flex-shrink-0`}>
            <ChannelIcon className="w-4 h-4 text-white" />
          </div>
        )}
        
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isFromCustomer 
            ? 'bg-gray-200 text-gray-900' 
            : 'bg-blue-500 text-white'
        }`}>
          <p className="text-sm">{message.content.text}</p>
          
          <div className="flex items-center justify-between mt-2">
            <span className={`text-xs ${isFromCustomer ? 'text-gray-500' : 'text-blue-100'}`}>
              {format(message.timestamp, 'HH:mm')}
            </span>
            
            {!isFromCustomer && (
              <div className="flex items-center space-x-1">
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
            <span className="text-xs font-medium text-gray-600">A</span>
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
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <FunnelIcon className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <EllipsisVerticalIcon className="w-5 h-5" />
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
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
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
    </div>
  );
};

export default UnifiedInbox; 