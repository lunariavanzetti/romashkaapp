import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  User, 
  Clock, 
  Star, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  Settings,
  Bell,
  TrendingUp,
  Users,
  Activity,
  FileText
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import { Button, Skeleton } from '../../components/ui';
import { agentService, type AgentStatus } from '../../services/agentService';
import { realtimeService } from '../../services/realtimeService';
import { supabase } from '../../services/supabaseClient';
import { useAuthStore } from '../../stores/authStore';
import { AdvancedChatInterface } from '../../components/chat/AdvancedChatInterface';
import { FileShareManager } from '../../components/chat/FileShareManager';

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
  customer_satisfaction?: number;
  resolution_time_seconds?: number;
}

interface AgentPerformance {
  totalConversations: number;
  resolvedConversations: number;
  resolutionRate: number;
  avgSatisfaction: number;
  avgResolutionTime: number;
  conversationsPerDay: number;
}

export default function AgentDashboard() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [performance, setPerformance] = useState<AgentPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeConversations, setActiveConversations] = useState<Conversation[]>([]);
  const [showChatInterface, setShowChatInterface] = useState(false);
  const [showFileManager, setShowFileManager] = useState(false);
  const [currentView, setCurrentView] = useState<'overview' | 'chat' | 'files'>('overview');

  useEffect(() => {
    if (user?.id) {
      loadAgentData();
      setupRealtimeSubscriptions();
    }
  }, [user]);

  const loadAgentData = async () => {
    try {
      setLoading(true);
      
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }
      
      // Load agent status
      const { data: statusData } = await supabase
        .from('agent_availability')
        .select('*')
        .eq('agent_id', user?.id)
        .single();

      if (statusData) {
        setAgentStatus({
          id: statusData.agent_id,
          isOnline: statusData.is_online,
          status: statusData.status,
          currentChatCount: statusData.current_chat_count,
          maxConcurrentChats: statusData.max_concurrent_chats,
          lastActivity: new Date(statusData.last_activity),
          departments: statusData.departments || [],
          skills: statusData.skills || []
        });
      }

      // Load assigned conversations
      const { data: convData } = await supabase
        .from('conversations')
        .select('*')
        .eq('assigned_agent_id', user?.id)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true });

      setConversations(convData || []);
              setActiveConversations(convData?.filter((c: any) => c.status === 'active') || []);

      // Load performance data
      if (user?.id) {
        const perfData = await agentService.getAgentPerformance(user.id, '7d');
        setPerformance(perfData);
      }
    } catch (error) {
      console.error('Error loading agent data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    if (!user?.id) return;

    // Subscribe to agent notifications
    realtimeService.subscribeToAgentNotifications(user.id, (payload) => {
      setNotifications(prev => [payload, ...prev.slice(0, 9)]);
    });

    // Subscribe to conversation updates
    realtimeService.subscribeToAgentStatus((payload) => {
      if (payload.agentId === user.id) {
        loadAgentData();
      }
    });
  };

  const updateAgentStatus = async (status: 'available' | 'busy' | 'away' | 'offline') => {
    try {
      if (!user?.id) return;

      await agentService.updateAgentStatus(user.id, { status });
      await realtimeService.broadcastAgentStatus(user.id, { status });
      loadAgentData();
    } catch (error) {
      console.error('Error updating agent status:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'normal': return 'bg-blue-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'resolved': return 'bg-blue-500';
      case 'escalated': return 'bg-orange-500';
      case 'queued': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleConversationClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setCurrentView('chat');
  };

  const handleConversationSelect = (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setSelectedConversation(conversation);
    }
  };

  const handleConversationClose = (conversationId: string) => {
    setActiveConversations(prev => prev.filter(c => c.id !== conversationId));
    if (selectedConversation?.id === conversationId) {
      setSelectedConversation(null);
      setCurrentView('overview');
    }
  };

  const handleResolveConversation = async (conversationId: string) => {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }
      
      await supabase
        .from('conversations')
        .update({ status: 'resolved' })
        .eq('id', conversationId);

      loadAgentData();
    } catch (error) {
      console.error('Error resolving conversation:', error);
    }
  };

  const handleTransferConversation = async (conversationId: string) => {
    // This would open a transfer dialog
    console.log('Transfer conversation:', conversationId);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} height={200} className="rounded-xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Agent Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Welcome back, {user?.email}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative"
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </Button>
              
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border z-50"
                  >
                    <div className="p-4">
                      <h3 className="font-semibold mb-3">Notifications</h3>
                      {notifications.length === 0 ? (
                        <p className="text-gray-500 text-sm">No new notifications</p>
                      ) : (
                        <div className="space-y-2">
                          {notifications.map((notification, index) => (
                            <div key={index} className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                              <p className="text-sm font-medium">{notification.payload?.message || 'New notification'}</p>
                              <p className="text-xs text-gray-500">
                                {formatTimeAgo(notification.payload?.timestamp || new Date().toISOString())}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Status Controls */}
            <div className="flex gap-2">
              <Button
                variant={agentStatus?.status === 'available' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => updateAgentStatus('available')}
              >
                Available
              </Button>
              <Button
                variant={agentStatus?.status === 'busy' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => updateAgentStatus('busy')}
              >
                Busy
              </Button>
              <Button
                variant={agentStatus?.status === 'away' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => updateAgentStatus('away')}
              >
                Away
              </Button>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        {performance && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Conversations</p>
                  <p className="text-2xl font-bold text-primary-pink">{performance.totalConversations}</p>
                </div>
                <MessageCircle className="text-primary-pink" size={24} />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Resolution Rate</p>
                  <p className="text-2xl font-bold text-primary-green">
                    {Math.round(performance.resolutionRate * 100)}%
                  </p>
                </div>
                <CheckCircle className="text-primary-green" size={24} />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Satisfaction</p>
                  <p className="text-2xl font-bold text-primary-purple">
                    {performance.avgSatisfaction.toFixed(1)}/5
                  </p>
                </div>
                <Star className="text-primary-purple" size={24} />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Resolution Time</p>
                  <p className="text-2xl font-bold text-primary-orange">
                    {Math.round(performance.avgResolutionTime / 60)}m
                  </p>
                </div>
                <Clock className="text-primary-orange" size={24} />
              </div>
            </motion.div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setCurrentView('overview')}
              className={`px-6 py-3 font-medium ${
                currentView === 'overview'
                  ? 'text-primary-pink border-b-2 border-primary-pink'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setCurrentView('chat')}
              className={`px-6 py-3 font-medium ${
                currentView === 'chat'
                  ? 'text-primary-pink border-b-2 border-primary-pink'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Chat Interface
            </button>
            <button
              onClick={() => setCurrentView('files')}
              className={`px-6 py-3 font-medium ${
                currentView === 'files'
                  ? 'text-primary-pink border-b-2 border-primary-pink'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              File Manager
            </button>
          </div>
        </div>

        {/* Content based on current view */}
        {currentView === 'overview' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold">Active Conversations</h2>
              <p className="text-gray-600 dark:text-gray-400">
                {conversations.length} conversation{conversations.length !== 1 ? 's' : ''} assigned
              </p>
            </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {conversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500 dark:text-gray-400">No active conversations</p>
              </div>
            ) : (
              conversations.map((conversation, index) => (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  onClick={() => handleConversationClick(conversation)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${getStatusColor(conversation.status)}`} />
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(conversation.priority)} text-white`}>
                          {conversation.priority}
                        </span>
                      </div>
                      
                      <div>
                        <h3 className="font-medium">{conversation.user_name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {conversation.last_message || 'No messages yet'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatTimeAgo(conversation.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {conversation.customer_satisfaction && (
                        <div className="flex items-center gap-1">
                          <Star size={14} className="text-yellow-500" />
                          <span className="text-sm">{conversation.customer_satisfaction}</span>
                        </div>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResolveConversation(conversation.id);
                        }}
                      >
                        <CheckCircle size={16} />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTransferConversation(conversation.id);
                        }}
                      >
                        <Users size={16} />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
        )}

        {/* Chat Interface View */}
        {currentView === 'chat' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg h-[80vh]">
            <AdvancedChatInterface
              conversations={activeConversations}
              onConversationSelect={handleConversationSelect}
              onConversationClose={handleConversationClose}
            />
          </div>
        )}

        {/* File Manager View */}
        {currentView === 'files' && (
          <div className="space-y-6">
            {selectedConversation ? (
              <FileShareManager
                conversationId={selectedConversation.id}
                onFileUploaded={(file) => {
                  console.log('File uploaded:', file);
                  // Optionally refresh conversation data
                }}
              />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
                <FileText size={48} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Conversation Selected
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Select a conversation to manage files
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 