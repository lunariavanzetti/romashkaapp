import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Target, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { knowledgeRetrieval } from '../../services/knowledgeRetrieval';
import { supabase } from '../../services/supabaseClient';

interface AnalyticsData {
  totalItems: number;
  totalUsage: number;
  averageEffectiveness: number;
  topItems: any[];
  categoryPerformance: any[];
  effectivenessTrend: any[];
  gapAnalysis: any[];
  suggestions: any[];
}

export default function KnowledgeAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Fetch knowledge items with analytics
      const { data: items, error: itemsError } = await supabase
        .from('knowledge_items')
        .select(`
          *,
          knowledge_categories(name)
        `)
        .order('usage_count', { ascending: false });

      if (itemsError) throw itemsError;

      // Fetch analytics data
      const { data: analytics, error: analyticsError } = await supabase
        .from('knowledge_analytics')
        .select(`
          *,
          knowledge_items(title, category_id),
          conversations(id)
        `)
        .gte('created_at', new Date(Date.now() - getTimeRangeDays() * 24 * 60 * 60 * 1000).toISOString());

      if (analyticsError) throw analyticsError;

      // Process data
      const processedData = processAnalyticsData(items, analytics);
      setData(processedData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeRangeDays = () => {
    switch (timeRange) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      default: return 30;
    }
  };

  const processAnalyticsData = (items: any[], analytics: any[]): AnalyticsData => {
    const totalItems = items.length;
    const totalUsage = items.reduce((sum, item) => sum + (item.usage_count || 0), 0);
    const averageEffectiveness = items.length > 0 
      ? items.reduce((sum, item) => sum + (item.effectiveness_score || 0), 0) / items.length 
      : 0;

    // Top performing items
    const topItems = items
      .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
      .slice(0, 10)
      .map(item => ({
        title: item.title,
        usage: item.usage_count || 0,
        effectiveness: item.effectiveness_score || 0,
        category: item.knowledge_categories?.name || 'Uncategorized'
      }));

    // Category performance
    const categoryStats: { [key: string]: { usage: number; effectiveness: number; count: number } } = {};
    items.forEach(item => {
      const category = item.knowledge_categories?.name || 'Uncategorized';
      if (!categoryStats[category]) {
        categoryStats[category] = { usage: 0, effectiveness: 0, count: 0 };
      }
      categoryStats[category].usage += item.usage_count || 0;
      categoryStats[category].effectiveness += item.effectiveness_score || 0;
      categoryStats[category].count += 1;
    });

    const categoryPerformance = Object.entries(categoryStats).map(([category, stats]) => ({
      category,
      usage: stats.usage,
      effectiveness: stats.count > 0 ? stats.effectiveness / stats.count : 0,
      count: stats.count
    }));

    // Effectiveness trend (simplified)
    const effectivenessTrend = [
      { date: 'Week 1', effectiveness: 0.75 },
      { date: 'Week 2', effectiveness: 0.78 },
      { date: 'Week 3', effectiveness: 0.82 },
      { date: 'Week 4', effectiveness: 0.85 }
    ];

    // Gap analysis
    const gapAnalysis = items
      .filter(item => (item.effectiveness_score || 0) < 0.5 && (item.usage_count || 0) > 0)
      .slice(0, 5)
      .map(item => ({
        title: item.title,
        effectiveness: item.effectiveness_score || 0,
        usage: item.usage_count || 0,
        suggestion: generateGapSuggestion(item)
      }));

    // Get improvement suggestions
    const suggestions = items
      .filter(item => (item.effectiveness_score || 0) < 0.7)
      .slice(0, 5)
      .map(item => ({
        title: item.title,
        currentScore: item.effectiveness_score || 0,
        suggestion: generateImprovementSuggestion(item)
      }));

    return {
      totalItems,
      totalUsage,
      averageEffectiveness,
      topItems,
      categoryPerformance,
      effectivenessTrend,
      gapAnalysis,
      suggestions
    };
  };

  const generateGapSuggestion = (item: any): string => {
    if (item.effectiveness_score < 0.3) {
      return 'Consider rewriting content to be more helpful';
    } else if (item.effectiveness_score < 0.5) {
      return 'Add more specific examples and details';
    } else {
      return 'Content needs improvement';
    }
  };

  const generateImprovementSuggestion = (item: any): string => {
    if (item.usage_count < 10) {
      return 'Content is underutilized - consider promoting it';
    } else if (item.effectiveness_score < 0.5) {
      return 'Content needs significant improvement';
    } else {
      return 'Minor improvements needed';
    }
  };

  const COLORS = ['#FF6B9D', '#4ECDC4', '#A8E6CF', '#FFD93D', '#6C5CE7'];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-pink"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-gray-500">
        No analytics data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="text-primary-pink" size={24} />
          <h2 className="text-2xl font-bold">Knowledge Analytics</h2>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-primary-pink text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="text-primary-pink" size={20} />
            <span className="text-sm text-gray-600">Total Items</span>
          </div>
          <div className="text-2xl font-bold text-primary-pink">{data.totalItems}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-primary-green" size={20} />
            <span className="text-sm text-gray-600">Total Usage</span>
          </div>
          <div className="text-2xl font-bold text-primary-green">{data.totalUsage}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-2">
            <Target className="text-primary-purple" size={20} />
            <span className="text-sm text-gray-600">Avg Effectiveness</span>
          </div>
          <div className="text-2xl font-bold text-primary-purple">
            {Math.round(data.averageEffectiveness * 100)}%
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="text-primary-green" size={20} />
            <span className="text-sm text-gray-600">High Performing</span>
          </div>
          <div className="text-2xl font-bold text-primary-green">
            {data.topItems.filter(item => item.effectiveness > 0.8).length}
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Effectiveness Trend */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Effectiveness Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.effectivenessTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 1]} />
              <Tooltip />
              <Line type="monotone" dataKey="effectiveness" stroke="#FF6B9D" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Performance */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Category Performance</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.categoryPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="usage" fill="#4ECDC4" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Performing Items */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Top Performing Items</h3>
        <div className="space-y-3">
          {data.topItems.slice(0, 5).map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-1">
                <div className="font-medium">{item.title}</div>
                <div className="text-sm text-gray-600">{item.category}</div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-primary-pink">{item.usage} uses</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  item.effectiveness > 0.8 ? 'bg-green-100 text-green-800' :
                  item.effectiveness > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {Math.round(item.effectiveness * 100)}% effective
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Gap Analysis */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="text-orange-500" size={20} />
          <h3 className="text-lg font-semibold">Gap Analysis</h3>
        </div>
        <div className="space-y-3">
          {data.gapAnalysis.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
            >
              <div className="flex-1">
                <div className="font-medium">{item.title}</div>
                <div className="text-sm text-orange-600">{item.suggestion}</div>
              </div>
              <div className="text-sm text-orange-600">
                {Math.round(item.effectiveness * 100)}% effective
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Improvement Suggestions */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Improvement Suggestions</h3>
        <div className="space-y-3">
          {data.suggestions.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
            >
              <div className="flex-1">
                <div className="font-medium">{item.title}</div>
                <div className="text-sm text-blue-600">{item.suggestion}</div>
              </div>
              <div className="text-sm text-blue-600">
                Current: {Math.round(item.currentScore * 100)}%
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
} 