import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { supabase } from '../../services/supabaseClient';

const ranges = ['24h', '7d', '30d', '90d'];

interface Metrics {
  conversations: number;
  responseTime: number;
  successRate: number;
  satisfaction: number;
}

interface ChartData {
  name: string;
  conversations: number;
  success: number;
}

export default function PerformanceMetrics() {
  const [range, setRange] = useState('7d');
  const [metrics, setMetrics] = useState<Metrics>({
    conversations: 0,
    responseTime: 0,
    successRate: 0,
    satisfaction: 0
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [range]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on selected range
      const now = new Date();
      let startDate = new Date();
      
      switch (range) {
        case '24h':
          startDate.setHours(now.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
      }

      // Load conversations for the selected period
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', now.toISOString());

      if (convError) {
        console.error('Error loading conversations:', convError);
        setMetrics({
          conversations: 0,
          responseTime: 0,
          successRate: 0,
          satisfaction: 0
        });
        setChartData([]);
        return;
      }

      const conversationsData = conversations || [];
      
      // Calculate metrics
      const totalConversations = conversationsData.length;
      const resolvedConversations = conversationsData.filter(c => c.status === 'resolved').length;
      const successRate = totalConversations > 0 ? (resolvedConversations / totalConversations) * 100 : 0;
      
      // Calculate average satisfaction (if available)
      const satisfactionScores = conversationsData
        .filter(c => c.satisfaction_score !== null)
        .map(c => c.satisfaction_score as number);
      const avgSatisfaction = satisfactionScores.length > 0 
        ? satisfactionScores.reduce((a, b) => a + b, 0) / satisfactionScores.length 
        : 0;

      // Mock response time (in a real app, this would be calculated from message timestamps)
      const avgResponseTime = 2.5; // seconds

      setMetrics({
        conversations: totalConversations,
        responseTime: avgResponseTime,
        successRate: Math.round(successRate),
        satisfaction: Math.round(avgSatisfaction * 10) / 10
      });

      // Generate chart data (simplified - in a real app, this would be aggregated by day)
      const chartDataPoints: ChartData[] = [];
      const days = range === '24h' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : 90;
      
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        
        const dayConversations = conversationsData.filter(c => {
          const convDate = new Date(c.created_at);
          return convDate.toDateString() === date.toDateString();
        });
        
        chartDataPoints.push({
          name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          conversations: dayConversations.length,
          success: dayConversations.filter(c => c.status === 'resolved').length
        });
      }
      
      setChartData(chartDataPoints);

    } catch (error) {
      console.error('Error loading metrics:', error);
      setMetrics({
        conversations: 0,
        responseTime: 0,
        successRate: 0,
        satisfaction: 0
      });
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  const metricsConfig = [
    { label: 'Conversations', value: metrics.conversations, color: 'text-primary-pink' },
    { label: 'Response Time', value: metrics.responseTime, color: 'text-primary-green', suffix: 's' },
    { label: 'Success Rate', value: metrics.successRate, color: 'text-primary-purple', suffix: '%' },
    { label: 'Satisfaction', value: metrics.satisfaction, color: 'text-primary-pink', suffix: '/5' },
  ];

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-2xl">Performance Metrics</h2>
        <div className="flex gap-2">
          {ranges.map(r => (
            <button 
              key={r} 
              onClick={() => setRange(r)} 
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                range === r 
                  ? 'bg-primary-pink text-white' 
                  : 'bg-white/40 dark:bg-dark/40 text-gray-700 dark:text-gray-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {metricsConfig.map((m, i) => (
          <motion.div 
            key={m.label} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 * i }} 
            className="glass-card p-6 rounded-2xl flex flex-col items-center shadow-md"
          >
            <div className={`text-3xl font-bold mb-1 ${m.color}`}>
              {m.value}{m.suffix}
            </div>
            <div className="text-sm text-gray-500 mb-1">{m.label}</div>
          </motion.div>
        ))}
      </div>
      
      <div className="glass-card p-6 rounded-2xl shadow-lg">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-gray-500">Loading metrics...</div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-gray-500">No data available for the selected period</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="conversations" stroke="#FF6B9D" strokeWidth={3} />
              <Line type="monotone" dataKey="success" stroke="#4ECDC4" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
} 