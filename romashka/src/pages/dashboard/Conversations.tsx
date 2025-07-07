import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, AnimatedSpinner } from '../../components/ui';
import { DashboardLayout } from '../../components/layout';
import { 
  MessageCircle, 
  User, 
  Clock, 
  Search, 
  Phone,
  Mail,
  MapPin,
  Star,
  XCircle
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useAuthStore } from '../../stores/authStore';

interface Conversation {
  id: string;
  user_name: string;
  user_email: string;
  status: 'active' | 'resolved' | 'pending';
  created_at: string;
  updated_at: string;
  last_message: string;
  message_count: number;
  agent_id?: string;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  satisfaction_score?: number | null;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'ai' | 'agent';
  content: string;
  created_at: string;
  metadata?: any;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  join_date: string;
  total_conversations: number;
  satisfaction_avg: number;
  tags: string[];
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved' | 'pending'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [isTyping, setIsTyping] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [showCustomerPanel, setShowCustomerPanel] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    loadConversations();
    setupRealtimeSubscription();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      loadCustomerInfo(selectedConversation.user_email);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        setConversations([]);
        return;
      }
      
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('conversations')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'conversations' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setConversations(prev => [payload.new as Conversation, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setConversations(prev => 
              prev.map(conv => 
                conv.id === payload.new.id ? payload.new as Conversation : conv
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setConversations(prev => prev.filter(conv => conv.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        setMessages([]);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  const loadCustomerInfo = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        console.error('Error loading customer info:', error);
        setCustomerInfo(null);
        return;
      }

      if (data) {
        setCustomerInfo({
          name: data.full_name || 'Unknown',
          email: data.email,
          phone: data.phone,
          location: data.location,
          join_date: data.created_at,
          total_conversations: 1, // This would need to be calculated
          satisfaction_avg: 4.5, // This would need to be calculated
          tags: ['customer']
        });
      }
    } catch (error) {
      console.error('Error loading customer info:', error);
      setCustomerInfo(null);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const message = {
        conversation_id: selectedConversation.id,
        sender_type: 'agent' as const,
        content: newMessage.trim(),
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('messages')
        .insert([message])
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      setMessages(prev => [...prev, data]);
      setNewMessage('');

      // Update conversation's last_message and updated_at
      await supabase
        .from('conversations')
        .update({
          last_message: newMessage.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedConversation.id);

    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const updateConversationStatus = async (conversationId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ status })
        .eq('id', conversationId);

      if (error) {
        console.error('Error updating conversation status:', error);
        return;
      }

      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId ? { ...conv, status: status as any } : conv
        )
      );

      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(prev => prev ? { ...prev, status: status as any } : null);
      }
    } catch (error) {
      console.error('Error updating conversation status:', error);
    }
  };

  const assignToAgent = async (conversationId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('conversations')
        .update({ agent_id: user.id })
        .eq('id', conversationId);

      if (error) {
        console.error('Error assigning conversation:', error);
        return;
      }

      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId ? { ...conv, agent_id: user.id } : conv
        )
      );

      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(prev => prev ? { ...prev, agent_id: user.id } : null);
      }
    } catch (error) {
      console.error('Error assigning conversation:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'resolved': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.last_message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || conv.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <DashboardLayout>
      <div className="h-full flex bg-white dark:bg-gray-900 rounded-2xl shadow-xl relative">
        {/* Left Panel - Conversation List */}
        <div className="flex-1 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Conversations
            </h2>
            
            {/* Search and Filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant={statusFilter === 'all' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('all')}
                  className="flex-1"
                >
                  All Status
                </Button>
                <Button
                  variant={statusFilter === 'active' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('active')}
                  className="flex-1"
                >
                  Active
                </Button>
                <Button
                  variant={statusFilter === 'resolved' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('resolved')}
                  className="flex-1"
                >
                  Resolved
                </Button>
                <Button
                  variant={statusFilter === 'pending' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('pending')}
                  className="flex-1"
                >
                  Pending
                </Button>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant={priorityFilter === 'all' ? 'primary' : 'outline'}
                  onClick={() => setPriorityFilter('all')}
                  className="flex-1"
                >
                  All Priority
                </Button>
                <Button
                  variant={priorityFilter === 'high' ? 'primary' : 'outline'}
                  onClick={() => setPriorityFilter('high')}
                  className="flex-1"
                >
                  High
                </Button>
                <Button
                  variant={priorityFilter === 'medium' ? 'primary' : 'outline'}
                  onClick={() => setPriorityFilter('medium')}
                  className="flex-1"
                >
                  Medium
                </Button>
                <Button
                  variant={priorityFilter === 'low' ? 'primary' : 'outline'}
                  onClick={() => setPriorityFilter('low')}
                  className="flex-1"
                >
                  Low
                </Button>
              </div>
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <AnimatedSpinner size="lg" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                <p>No conversations found</p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredConversations.map((conversation) => (
                  <motion.div
                    key={conversation.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      selectedConversation?.id === conversation.id
                        ? 'bg-pink-100 dark:bg-pink-900 border-pink-300 dark:border-pink-700'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    } border`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {conversation.user_name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {conversation.user_email}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(conversation.status)}`}>
                          {conversation.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(conversation.priority)}`}>
                          {conversation.priority}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
                      {conversation.last_message}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(conversation.updated_at).toLocaleTimeString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle size={12} />
                        {conversation.message_count}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Chat Widget */}
        <AnimatePresence>
          {selectedConversation && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '60px', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col"
            >
              {/* Chat Header */}
              <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                    {selectedConversation.user_name.charAt(0).toUpperCase()}
                  </div>
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
                <div className="mt-2 text-center">
                  <h3 className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                    {selectedConversation.user_name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {selectedConversation.user_email}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.sender_type === 'user' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[45px] px-2 py-1 rounded-lg text-xs ${
                        message.sender_type === 'user'
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                          : message.sender_type === 'agent'
                          ? 'bg-pink-500 text-white'
                          : 'bg-blue-500 text-white'
                      }`}
                    >
                      <p className="text-xs break-words">{message.content}</p>
                    </div>
                  </motion.div>
                ))}
                
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-2 py-1">
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex space-x-1">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type..."
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={!newMessage.trim()}
                    className="px-2 py-1 text-xs"
                  >
                    Send
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Customer Info Panel - Overlay */}
        <AnimatePresence>
          {showCustomerPanel && customerInfo && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute top-4 right-4 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-10"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Customer Info
                  </h3>
                  <button
                    onClick={() => setShowCustomerPanel(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <XCircle size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {customerInfo.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {customerInfo.name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Customer since {new Date(customerInfo.join_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail size={16} className="text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">{customerInfo.email}</span>
                    </div>
                    
                    {customerInfo.phone && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Phone size={16} className="text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">{customerInfo.phone}</span>
                      </div>
                    )}
                    
                    {customerInfo.location && (
                      <div className="flex items-center space-x-2 text-sm">
                        <MapPin size={16} className="text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">{customerInfo.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-3">Statistics</h5>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Total Conversations</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {customerInfo.total_conversations}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Satisfaction</p>
                        <div className="flex items-center space-x-1">
                          <Star size={16} className="text-yellow-400 fill-current" />
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {customerInfo.satisfaction_avg}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-3">Tags</h5>
                    <div className="flex flex-wrap gap-2">
                      {customerInfo.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
} 