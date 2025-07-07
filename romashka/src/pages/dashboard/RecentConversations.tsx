import React, { useState, useEffect } from 'react';
import { MessageCircle, User } from 'lucide-react';
import { Button, Skeleton } from '../../components/ui';
import { motion } from 'framer-motion';
import { supabase } from '../../services/supabaseClient';

interface Conversation {
  id: string;
  user_name: string;
  user_email: string;
  status: 'active' | 'resolved' | 'pending';
  created_at: string;
  updated_at: string;
  last_message: string;
  message_count: number;
  priority: 'low' | 'medium' | 'high';
}

export default function RecentConversations() {
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    loadRecentConversations();
  }, []);

  const loadRecentConversations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error loading recent conversations:', error);
        setConversations([]);
        return;
      }

      setConversations(data || []);
    } catch (error) {
      console.error('Error loading recent conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'resolved': return 'bg-pink-500';
      case 'pending': return 'bg-purple-500';
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

  return (
    <section className="mb-8">
      <h2 className="font-heading text-2xl mb-4">Recent Conversations</h2>
      <div className="glass-card p-6 rounded-2xl shadow-lg min-h-[180px]">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} height={48} className="rounded-xl" />)}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32">
            <MessageCircle size={40} className="text-primary-pink mb-2" />
            <div className="text-gray-400">No recent conversations</div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {conversations.map((c, i) => (
              <motion.li 
                key={c.id} 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ delay: 0.1 * i }} 
                className="flex items-center gap-4 py-3"
              >
                <span className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-pink/20 text-primary-pink">
                  <User size={22} />
                </span>
                <div className="flex-1">
                  <div className="font-medium">{c.user_name}</div>
                  <div className="text-xs text-gray-500">{c.last_message}</div>
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${getStatusColor(c.status)}`} />
                    <span className="text-xs text-gray-400">{formatTimeAgo(c.updated_at)}</span>
                    <Button variant="ghost" className="px-2 py-1 text-xs">View</Button>
                    {c.status === 'pending' && <Button variant="primary" className="px-2 py-1 text-xs">Resolve</Button>}
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
} 