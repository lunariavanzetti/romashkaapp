import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  MessageCircle, 
  Clock, 
  TrendingUp, 
  Search,
  Filter,
  Eye,
  Brain,
  CheckCircle,
  AlertCircle,
  Star,
  ArrowRight,
  Calendar,
  Tag,
  Activity
} from 'lucide-react';

import { Button } from '../../../components/ui';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../lib/supabase';

interface Conversation {
  id: string;
  customerName: string;
  customerEmail: string;
  status: 'active' | 'resolved' | 'escalated';
  messageCount: number;
  satisfactionScore?: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  intent: string;
  aiConfidence: number;
  channel: string;
  language: string;
  createdAt: string;
  lastMessageAt: string;
  tags: string[];
  resolutionTime?: number;
}

interface ConversationManagerProps {
  onAnalyze: (conversationIds: string[]) => void;
}

const ConversationManager: React.FC<ConversationManagerProps> = ({ onAnalyze }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversations, setSelectedConversations] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    status: 'all',
    sentiment: 'all',
    channel: 'all',
    dateRange: 'all'
  });
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'satisfaction' | 'messages' | 'confidence'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadConversations();
  }, [filters, sortBy, sortOrder]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('conversations')
        .select(`
          id,
          customer_id,
          user_name,
          user_email,
          status,
          sentiment,
          intent,
          ai_confidence,
          channel_type,
          language,
          satisfaction_score,
          resolution_time_seconds,
          tags,
          created_at,
          last_message_at,
          message_count,
          customer_profiles (
            name,
            email
          )
        `)
        .order(sortBy === 'date' ? 'created_at' : 
               sortBy === 'satisfaction' ? 'satisfaction_score' :
               sortBy === 'messages' ? 'message_count' :
               'ai_confidence', { ascending: sortOrder === 'asc' });

      // Apply filters
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.sentiment !== 'all') {
        query = query.eq('sentiment', filters.sentiment);
      }
      if (filters.channel !== 'all') {
        query = query.eq('channel_type', filters.channel);
      }

      const { data, error } = await query.limit(100);
      
      if (error) throw error;

      const formattedConversations: Conversation[] = data.map(conv => ({
        id: conv.id,
        customerName: conv.customer_profiles?.name || conv.user_name || 'Unknown',
        customerEmail: conv.customer_profiles?.email || conv.user_email || '',
        status: conv.status,
        messageCount: conv.message_count || 0,
        satisfactionScore: conv.satisfaction_score,
        sentiment: conv.sentiment || 'neutral',
        intent: conv.intent || 'general',
        aiConfidence: conv.ai_confidence || 0,
        channel: conv.channel_type || 'website',
        language: conv.language || 'en',
        createdAt: conv.created_at,
        lastMessageAt: conv.last_message_at,
        tags: conv.tags || [],
        resolutionTime: conv.resolution_time_seconds
      }));

      setConversations(formattedConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return conv.customerName.toLowerCase().includes(searchLower) ||
             conv.customerEmail.toLowerCase().includes(searchLower) ||
             conv.intent.toLowerCase().includes(searchLower) ||
             conv.tags.some(tag => tag.toLowerCase().includes(searchLower));
    }
    return true;
  });

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversations(prev => 
      prev.includes(conversationId) 
        ? prev.filter(id => id !== conversationId)
        : [...prev, conversationId]
    );
  };

  const handleSelectAll = () => {
    setSelectedConversations(
      selectedConversations.length === filteredConversations.length 
        ? [] 
        : filteredConversations.map(conv => conv.id)
    );
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-100';
      case 'negative': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'escalated': return 'text-red-600 bg-red-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Conversation Analysis</h2>
            <p className="text-gray-600">
              Analyze conversations to improve AI performance and identify training opportunities
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => onAnalyze(selectedConversations)}
              disabled={selectedConversations.length === 0}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Brain className="w-4 h-4 mr-2" />
              Analyze Selected ({selectedConversations.length})
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600">Total Conversations</p>
                <p className="text-xl font-bold text-blue-900">{conversations.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-green-600">Resolved</p>
                <p className="text-xl font-bold text-green-900">
                  {conversations.filter(c => c.status === 'resolved').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm text-yellow-600">Avg Satisfaction</p>
                <p className="text-xl font-bold text-yellow-900">
                  {(conversations.filter(c => c.satisfactionScore)
                    .reduce((sum, c) => sum + (c.satisfactionScore || 0), 0) / 
                    conversations.filter(c => c.satisfactionScore).length || 0).toFixed(1)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-purple-600">Avg AI Confidence</p>
                <p className="text-xl font-bold text-purple-900">
                  {(conversations.reduce((sum, c) => sum + c.aiConfidence, 0) / 
                    conversations.length || 0).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <Button
              onClick={handleSelectAll}
              variant="outline"
              className="text-gray-600 hover:text-gray-900"
            >
              {selectedConversations.length === filteredConversations.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
              <option value="escalated">Escalated</option>
            </select>
            <select
              value={filters.sentiment}
              onChange={(e) => setFilters(prev => ({ ...prev, sentiment: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Sentiment</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Sort by Date</option>
              <option value="satisfaction">Sort by Satisfaction</option>
              <option value="messages">Sort by Messages</option>
              <option value="confidence">Sort by Confidence</option>
            </select>
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="bg-white rounded-lg shadow-md">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Activity className="w-6 h-6 animate-spin text-blue-500 mr-3" />
            <span className="text-gray-600">Loading conversations...</span>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations found</h3>
            <p className="text-gray-600">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedConversations.length === filteredConversations.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Messages
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sentiment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AI Confidence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Satisfaction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredConversations.map((conversation) => (
                  <motion.tr
                    key={conversation.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedConversations.includes(conversation.id)}
                        onChange={() => handleSelectConversation(conversation.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <Users className="w-5 h-5 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {conversation.customerName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {conversation.customerEmail}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(conversation.status)}`}>
                        {conversation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <MessageCircle className="w-4 h-4 mr-2 text-gray-400" />
                        {conversation.messageCount}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSentimentColor(conversation.sentiment)}`}>
                        {conversation.sentiment}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-medium ${getConfidenceColor(conversation.aiConfidence)}`}>
                        {(conversation.aiConfidence * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {conversation.satisfactionScore ? (
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 mr-1" />
                          {conversation.satisfactionScore.toFixed(1)}
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDuration(conversation.resolutionTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        onClick={() => setShowDetails(conversation.id)}
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Conversation Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Conversation Details</h3>
              <Button
                onClick={() => setShowDetails(null)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </Button>
            </div>
            
            {/* Conversation details would be loaded here */}
            <div className="space-y-4">
              <div className="text-center py-8">
                <MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600">
                  Conversation details will be loaded here
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationManager;