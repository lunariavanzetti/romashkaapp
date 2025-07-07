import React, { useState, useEffect } from 'react';
import { Bot, User, Globe, AlertCircle, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../services/supabaseClient';

interface ActivityItem {
  id: string;
  type: 'conversation' | 'ai' | 'system' | 'visitor';
  text: string;
  icon: React.ReactNode;
  location?: string;
  time: string;
  created_at: string;
}

export default function LiveActivity() {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentActivity();
    setupRealtimeSubscription();
  }, []);

  const loadRecentActivity = async () => {
    try {
      setLoading(true);
      // In a real app, you'd fetch from an activity/events table
      // For now, we'll show empty state
      setActivity([]);
    } catch (error) {
      console.error('Error loading activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    // Subscribe to real-time updates for conversations and messages
    const subscription = supabase
      .channel('live-activity')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations',
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newActivity: ActivityItem = {
            id: `activity-${Date.now()}`,
            type: 'conversation',
            text: 'New conversation started',
            icon: <User size={20} />,
            location: 'Unknown',
            time: 'just now',
            created_at: new Date().toISOString(),
          };
          setActivity(prev => [newActivity, ...prev.slice(0, 4)]);
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const message = payload.new as any;
          const newActivity: ActivityItem = {
            id: `activity-${Date.now()}`,
            type: message.sender_type === 'ai' ? 'ai' : 'conversation',
            text: message.sender_type === 'ai' ? 'AI responded to visitor' : 'New message received',
            icon: message.sender_type === 'ai' ? <Bot size={20} /> : <User size={20} />,
            location: 'Unknown',
            time: 'just now',
            created_at: new Date().toISOString(),
          };
          setActivity(prev => [newActivity, ...prev.slice(0, 4)]);
        }
      })
      .subscribe();

    return () => subscription.unsubscribe();
  };

  return (
    <section className="mb-8">
      <h2 className="font-heading text-2xl mb-4">Live Activity</h2>
      <div className="glass-card p-6 rounded-2xl shadow-lg min-h-[180px]">
        <AnimatePresence>
          {loading ? (
            <motion.div 
              key="loading" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="flex flex-col items-center justify-center h-32"
            >
              <Activity size={40} className="text-primary-pink mb-2 animate-pulse" />
              <div className="text-gray-400">Loading activity...</div>
            </motion.div>
          ) : activity.length === 0 ? (
            <motion.div 
              key="empty" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="flex flex-col items-center justify-center h-32"
            >
              <Globe size={40} className="text-primary-pink mb-2" />
              <div className="text-gray-400">No activity yet</div>
              <div className="text-xs text-gray-500 mt-2">Activity will appear here when conversations start</div>
            </motion.div>
          ) : (
            <ul className="space-y-4">
              {activity.map((item) => (
                <motion.li 
                  key={item.id} 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -20 }} 
                  className="flex items-center gap-4"
                >
                  <span className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-pink/20 text-primary-pink">
                    {item.icon}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium">{item.text}</div>
                    <div className="text-xs text-gray-500">
                      {item.location && `${item.location} `}{item.time}
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
} 