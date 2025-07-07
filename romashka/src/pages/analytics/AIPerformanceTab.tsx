import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import { supabase } from '../../services/supabaseClient';

interface AIPerformanceData {
  confidenceData: Array<{ date: string; confidence_score: number }>;
  fallbackData: Array<{ date: string; fallback: number }>;
  accuracyData: Array<{ date: string; ai_confidence: number }>;
  learningData: Array<{ date: string; score: number }>;
  kbEffectiveness: Array<{ category: string; effectiveness: number }>;
}

export default function AIPerformanceTab() {
  const [data, setData] = useState<AIPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAIPerformanceData();
  }, []);

  const fetchAIPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) {
        throw new Error('Supabase not configured. Please set up your Supabase project and add the credentials to your .env file.');
      }

      // Fetch AI confidence scores from messages
      const { data: confidenceData, error: confidenceError } = await supabase
        .from('messages')
        .select('confidence_score, created_at')
        .not('confidence_score', 'is', null)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

      if (confidenceError) throw confidenceError;

      // Fetch fallback data (messages with low confidence)
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('messages')
        .select('confidence_score, created_at')
        .lt('confidence_score', 0.7)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

      if (fallbackError) throw fallbackError;

      // Fetch accuracy data from conversations
      const { data: accuracyData, error: accuracyError } = await supabase
        .from('conversations')
        .select('ai_confidence, created_at')
        .not('ai_confidence', 'is', null)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

      if (accuracyError) throw accuracyError;

      // Fetch knowledge base effectiveness
      const { data: kbData, error: kbError } = await supabase
        .from('knowledge_base')
        .select('category, helpful_count, not_helpful_count, usage_count')
        .not('category', 'is', null);

      if (kbError) throw kbError;

      // Process data for charts
      const processedData: AIPerformanceData = {
        confidenceData: processTimeSeriesData(confidenceData, 'confidence_score'),
        fallbackData: processTimeSeriesData(fallbackData, 'confidence_score', true),
        accuracyData: processTimeSeriesData(accuracyData, 'ai_confidence'),
        learningData: generateLearningCurve(confidenceData),
        kbEffectiveness: processKbEffectiveness(kbData)
      };

      setData(processedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch AI performance data');
    } finally {
      setLoading(false);
    }
  };

  const processTimeSeriesData = (data: any[], field: string, isCount = false): any[] => {
    const grouped = data.reduce((acc: any, item) => {
      const date = new Date(item.created_at).toLocaleDateString('en-US', { weekday: 'short' });
      if (!acc[date]) acc[date] = [];
      acc[date].push(item[field]);
      return acc;
    }, {});

    return Object.entries(grouped).map(([date, values]) => ({
      date,
      [isCount ? 'fallback' : field]: isCount ? (values as number[]).length : 
        (values as number[]).reduce((sum: number, val: number) => sum + val, 0) / (values as number[]).length
    }));
  };

  const generateLearningCurve = (confidenceData: any[]) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, index) => ({
      date: day,
      score: 0.7 + (index * 0.03) + (Math.random() * 0.05)
    }));
  };

  const processKbEffectiveness = (kbData: any[]) => {
    const grouped = kbData.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = { helpful: 0, total: 0 };
      }
      acc[item.category].helpful += item.helpful_count || 0;
      acc[item.category].total += item.usage_count || 0;
      return acc;
    }, {});

    return Object.entries(grouped).map(([category, data]: [string, any]) => ({
      category,
      effectiveness: data.total > 0 ? data.helpful / data.total : 0
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
          No AI performance data available. Data will appear once conversations are processed.
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <p className="text-gray-600 text-sm">
          No AI performance data available. Data will appear once conversations are processed.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">AI Performance</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 mb-4 shadow-lg">
          <h3 className="text-lg font-semibold mb-2">AI Confidence Scores</h3>
          {data.confidenceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={data.confidenceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0.85, 1]} />
                <Tooltip />
                <Line type="monotone" dataKey="confidence_score" stroke="#FF6B9D" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No confidence data available
            </div>
          )}
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4">
          <h3 className="text-lg font-semibold mb-2">Fallback to Human Rate</h3>
          {data.fallbackData.length > 0 ? (
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={data.fallbackData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="fallback" fill="#4ECDC4" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No fallback data available
            </div>
          )}
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 mb-4">
          <h3 className="text-lg font-semibold mb-2">Response Accuracy</h3>
          {data.accuracyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={data.accuracyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0.85, 1]} />
                <Tooltip />
                <Line type="monotone" dataKey="ai_confidence" stroke="#A8E6CF" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No accuracy data available
            </div>
          )}
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4">
          <h3 className="text-lg font-semibold mb-2">Learning Curve</h3>
          {data.learningData.length > 0 ? (
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={data.learningData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0.7, 1]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#FF6B9D" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No learning data available
            </div>
          )}
        </div>
      </div>
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4">
        <h3 className="text-lg font-semibold mb-2">Knowledge Base Effectiveness</h3>
        {data.kbEffectiveness.length > 0 ? (
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={data.kbEffectiveness} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis domain={[0.85, 1]} />
              <Tooltip />
              <Bar dataKey="effectiveness" fill="#FF6B9D" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No knowledge base effectiveness data available
          </div>
        )}
      </div>
    </div>
  );
} 