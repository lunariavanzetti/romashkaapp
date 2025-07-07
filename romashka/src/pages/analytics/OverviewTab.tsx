import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, FunnelChart, Funnel, LabelList } from 'recharts';
import { supabase } from '../../services/supabaseClient';

interface OverviewData {
  kpis: Array<{ label: string; value: string | number; color: string }>;
  trendData: Array<{ date: string; conversations: number; success: number }>;
  funnelData: Array<{ value: number; name: string }>;
}

export default function OverviewTab() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) {
        throw new Error('Supabase not configured. Please set up your Supabase project and add the credentials to your .env file.');
      }

      // Fetch conversations data
      const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select('created_at, status, satisfaction_score')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (conversationsError) throw conversationsError;

      // Fetch messages for response time calculation
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('created_at, processing_time_ms')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (messagesError) throw messagesError;

      // Process data for charts
      const processedData: OverviewData = {
        kpis: calculateKPIs(conversations, messages),
        trendData: processTrendData(conversations),
        funnelData: processFunnelData(conversations)
      };

      setData(processedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch overview data');
    } finally {
      setLoading(false);
    }
  };

  const calculateKPIs = (conversations: any[], messages: any[]) => {
    const totalConversations = conversations.length;
    const successfulConversations = conversations.filter(c => c.status === 'resolved').length;
    const successRate = totalConversations > 0 ? Math.round((successfulConversations / totalConversations) * 100) : 0;
    
    const avgResponseTime = messages.length > 0 
      ? (messages.reduce((sum, msg) => sum + (msg.processing_time_ms || 0), 0) / messages.length / 1000).toFixed(1)
      : '0.0';

    const activeVisitors = conversations.filter(c => 
      new Date(c.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length;

    return [
      { label: 'Conversations', value: totalConversations, color: 'text-primary-pink' },
      { label: 'Success Rate', value: `${successRate}%`, color: 'text-primary-green' },
      { label: 'Avg. Response Time', value: `${avgResponseTime}s`, color: 'text-primary-purple' },
      { label: 'Active Visitors', value: activeVisitors, color: 'text-primary-orange' },
    ];
  };

  const processTrendData = (conversations: any[]) => {
    const grouped = conversations.reduce((acc: any, conv) => {
      const date = new Date(conv.created_at).toLocaleDateString('en-US', { weekday: 'short' });
      if (!acc[date]) acc[date] = { conversations: 0, success: 0 };
      acc[date].conversations++;
      if (conv.status === 'resolved') acc[date].success++;
      return acc;
    }, {});

    return Object.entries(grouped).map(([date, data]: [string, any]) => ({
      date,
      conversations: data.conversations,
      success: data.success
    }));
  };

  const processFunnelData = (conversations: any[]) => {
    const totalVisitors = conversations.length * 2; // Estimate
    const totalConversations = conversations.length;
    const aiHandled = conversations.filter(c => c.status !== 'human_handled').length;
    const humanHandled = conversations.filter(c => c.status === 'human_handled').length;
    const resolved = conversations.filter(c => c.status === 'resolved').length;

    return [
      { value: totalVisitors, name: 'Visitors' },
      { value: totalConversations, name: 'Conversations' },
      { value: aiHandled, name: 'AI Handled' },
      { value: humanHandled, name: 'Human Handled' },
      { value: resolved, name: 'Resolved' },
    ];
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
          No overview data available. Data will appear once conversations are processed.
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <p className="text-gray-600 text-sm">
          No overview data available. Data will appear once conversations are processed.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Key Performance Indicators</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {data.kpis.map(kpi => (
          <div key={kpi.label} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center shadow-lg">
            <div className={`text-2xl font-bold mb-1 ${kpi.color}`}>{kpi.value}</div>
            <div className="text-sm text-gray-600">{kpi.label}</div>
          </div>
        ))}
      </div>
      <h3 className="text-lg font-semibold mb-2">Trend Analysis</h3>
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 mb-6 shadow-lg">
        {data.trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="conversations" stroke="#FF6B9D" strokeWidth={3} />
              <Line type="monotone" dataKey="success" stroke="#4ECDC4" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No trend data available
          </div>
        )}
      </div>
      <h3 className="text-lg font-semibold mb-2">Conversion Funnel</h3>
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
        {data.funnelData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <FunnelChart>
              <Tooltip />
              <Funnel dataKey="value" data={data.funnelData} isAnimationActive>
                <LabelList dataKey="name" position="right" />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No funnel data available
          </div>
        )}
      </div>
    </div>
  );
} 