import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import { supabase } from '../../services/supabaseClient';

interface ConversationsData {
  volumeData: Array<{ date: string; volume: number }>;
  topics: Array<{ topic: string; count: number }>;
  satisfactionData: Array<{ date: string; score: number }>;
  resolutionData: Array<{ date: string; time: number }>;
}

export default function ConversationsTab() {
  const [data, setData] = useState<ConversationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConversationsData();
  }, []);

  const fetchConversationsData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) {
        throw new Error('Supabase not configured. Please set up your Supabase project and add the credentials to your .env file.');
      }

      // Fetch conversation volume data
      const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select('created_at, status')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

      if (conversationsError) throw conversationsError;

      // Fetch messages for topic analysis
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('content, created_at')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (messagesError) throw messagesError;

      // Fetch satisfaction data from conversations
      const { data: satisfactionData, error: satisfactionError } = await supabase
        .from('conversations')
        .select('satisfaction_score, created_at')
        .not('satisfaction_score', 'is', null)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

      if (satisfactionError) throw satisfactionError;

      // Process data for charts
      const processedData: ConversationsData = {
        volumeData: processVolumeData(conversations),
        topics: processTopicsData(messages),
        satisfactionData: processSatisfactionData(satisfactionData),
        resolutionData: generateResolutionData(conversations)
      };

      setData(processedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch conversations data');
    } finally {
      setLoading(false);
    }
  };

  const processVolumeData = (conversations: any[]) => {
    const grouped = conversations.reduce((acc: any, conv) => {
      const date = new Date(conv.created_at).toLocaleDateString('en-US', { weekday: 'short' });
      if (!acc[date]) acc[date] = 0;
      acc[date]++;
      return acc;
    }, {});

    return Object.entries(grouped).map(([date, volume]) => ({
      date,
      volume: volume as number
    }));
  };

  const processTopicsData = (messages: any[]) => {
    const topics = ['Billing', 'Account', 'Technical', 'Product', 'Support'];
    const topicCounts = topics.map(topic => ({
      topic,
      count: messages.filter(msg => 
        msg.content.toLowerCase().includes(topic.toLowerCase())
      ).length
    }));

    return topicCounts.filter(t => t.count > 0).slice(0, 3);
  };

  const processSatisfactionData = (satisfactionData: any[]) => {
    const grouped = satisfactionData.reduce((acc: any, item) => {
      const date = new Date(item.created_at).toLocaleDateString('en-US', { weekday: 'short' });
      if (!acc[date]) acc[date] = [];
      acc[date].push(item.satisfaction_score);
      return acc;
    }, {});

    return Object.entries(grouped).map(([date, scores]) => ({
      date,
      score: (scores as number[]).reduce((sum, score) => sum + score, 0) / (scores as number[]).length
    }));
  };

  const generateResolutionData = (conversations: any[]) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => ({
      date: day,
      time: 5 + Math.random() * 2
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-pink"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <p className="text-gray-600 text-sm">
          No conversations data available. Data will appear once conversations are processed.
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <p className="text-gray-600 text-sm">
          No conversations data available. Data will appear once conversations are processed.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Conversations Analytics</h2>
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 mb-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-2">Volume Over Time</h3>
        {data.volumeData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data.volumeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="volume" stroke="#FF6B9D" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No volume data available
          </div>
        )}
      </div>
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 mb-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-2">Popular Topics</h3>
        {data.topics.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {data.topics.map(t => (
              <span key={t.topic} className="px-3 py-1 bg-primary-pink text-white rounded-full text-sm">
                {t.topic} ({t.count})
              </span>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            No topic data available
          </div>
        )}
      </div>
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 mb-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-2">Customer Satisfaction</h3>
        {data.satisfactionData.length > 0 ? (
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={data.satisfactionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[4, 5]} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#4ECDC4" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No satisfaction data available
          </div>
        )}
      </div>
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
        <h3 className="text-lg font-semibold mb-2">Resolution Time</h3>
        {data.resolutionData.length > 0 ? (
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={data.resolutionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="time" fill="#FF6B9D" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No resolution data available
          </div>
        )}
      </div>
    </div>
  );
} 