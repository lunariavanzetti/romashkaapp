import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Activity, 
  Target,
  Brain,
  Users,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Zap,
  ArrowUp,
  ArrowDown,
  Calendar,
  Filter
} from 'lucide-react';

import { Button } from '../../../components/ui';
import { LineChart, BarChart, GaugeChart, PieChart as Chart } from '../../../components/analytics/widgets';

interface PerformanceAnalyticsProps {
  stats: {
    totalConversations: number;
    processedConversations: number;
    accuracyScore: number;
    knowledgeGaps: number;
    optimizationOpportunities: number;
    averageResponseTime: number;
    customerSatisfaction: number;
    successRate: number;
  };
  sessions: any[];
}

interface MetricCard {
  title: string;
  value: string;
  change: number;
  icon: React.ElementType;
  color: string;
  trend: 'up' | 'down' | 'stable';
}

const PerformanceAnalytics: React.FC<PerformanceAnalyticsProps> = ({ stats, sessions }) => {
  const [timeRange, setTimeRange] = useState<'1d' | '7d' | '30d' | '90d'>('30d');
  const [activeMetric, setActiveMetric] = useState<'accuracy' | 'satisfaction' | 'response_time' | 'success_rate'>('accuracy');

  // Mock data for charts
  const accuracyTrend = [
    { date: '2024-01-01', value: 85.2 },
    { date: '2024-01-02', value: 86.1 },
    { date: '2024-01-03', value: 85.8 },
    { date: '2024-01-04', value: 87.3 },
    { date: '2024-01-05', value: 88.5 },
    { date: '2024-01-06', value: 89.2 },
    { date: '2024-01-07', value: 90.1 }
  ];

  const satisfactionTrend = [
    { date: '2024-01-01', value: 4.2 },
    { date: '2024-01-02', value: 4.3 },
    { date: '2024-01-03', value: 4.1 },
    { date: '2024-01-04', value: 4.4 },
    { date: '2024-01-05', value: 4.5 },
    { date: '2024-01-06', value: 4.6 },
    { date: '2024-01-07', value: 4.7 }
  ];

  const channelPerformance = [
    { name: 'WhatsApp', accuracy: 92, satisfaction: 4.8, conversations: 1250 },
    { name: 'Website', accuracy: 88, satisfaction: 4.3, conversations: 890 },
    { name: 'Email', accuracy: 85, satisfaction: 4.1, conversations: 456 },
    { name: 'Instagram', accuracy: 79, satisfaction: 3.9, conversations: 234 }
  ];

  const knowledgeGapAnalysis = [
    { category: 'Product Information', gaps: 12, severity: 'high' },
    { category: 'Billing & Payments', gaps: 8, severity: 'medium' },
    { category: 'Technical Support', gaps: 15, severity: 'high' },
    { category: 'Account Management', gaps: 5, severity: 'low' },
    { category: 'General Inquiries', gaps: 3, severity: 'low' }
  ];

  const trainingImpact = [
    { session: 'Conversation Analysis #1', before: 85.2, after: 88.7, improvement: 3.5 },
    { session: 'Template Optimization #2', before: 88.7, after: 90.1, improvement: 1.4 },
    { session: 'Knowledge Update #3', before: 90.1, after: 91.8, improvement: 1.7 },
    { session: 'Performance Tracking #4', before: 91.8, after: 93.2, improvement: 1.4 }
  ];

  const metricCards: MetricCard[] = [
    {
      title: 'AI Accuracy',
      value: `${stats.accuracyScore.toFixed(1)}%`,
      change: 5.2,
      icon: Brain,
      color: 'blue',
      trend: 'up'
    },
    {
      title: 'Customer Satisfaction',
      value: `${stats.customerSatisfaction.toFixed(1)}`,
      change: 0.3,
      icon: Star,
      color: 'yellow',
      trend: 'up'
    },
    {
      title: 'Response Time',
      value: `${stats.averageResponseTime.toFixed(1)}s`,
      change: -12.5,
      icon: Clock,
      color: 'green',
      trend: 'down'
    },
    {
      title: 'Success Rate',
      value: `${stats.successRate.toFixed(1)}%`,
      change: 2.8,
      icon: CheckCircle,
      color: 'purple',
      trend: 'up'
    }
  ];

  const getColorClass = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-500';
      case 'yellow': return 'bg-yellow-500';
      case 'green': return 'bg-green-500';
      case 'purple': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Analytics</h2>
          <p className="text-gray-600">
            Track AI training progress and performance improvements
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <Button variant="outline" className="text-gray-600 hover:text-gray-900">
            <Calendar className="w-4 h-4 mr-2" />
            Custom Range
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-lg ${getColorClass(metric.color)} flex items-center justify-center`}>
                  <metric.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                </div>
              </div>
              <div className={`flex items-center space-x-1 ${
                metric.trend === 'up' ? 'text-green-600' : 
                metric.trend === 'down' ? 'text-red-600' : 
                'text-gray-600'
              }`}>
                {metric.trend === 'up' ? <ArrowUp className="w-4 h-4" /> : 
                 metric.trend === 'down' ? <ArrowDown className="w-4 h-4" /> : 
                 <Activity className="w-4 h-4" />}
                <span className="text-sm font-medium">
                  {Math.abs(metric.change).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {metric.trend === 'up' ? 'Improvement' : 
               metric.trend === 'down' ? 'Reduction' : 
               'No change'} from last period
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accuracy Trend Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">AI Accuracy Trend</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveMetric('accuracy')}
                className={`px-3 py-1 rounded-full text-sm ${
                  activeMetric === 'accuracy' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Accuracy
              </button>
              <button
                onClick={() => setActiveMetric('satisfaction')}
                className={`px-3 py-1 rounded-full text-sm ${
                  activeMetric === 'satisfaction' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Satisfaction
              </button>
            </div>
          </div>
          <div className="h-64">
            <LineChart 
              data={activeMetric === 'accuracy' ? accuracyTrend : satisfactionTrend}
              xKey="date"
              yKey="value"
              color="#3B82F6"
            />
          </div>
        </div>

        {/* Channel Performance */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Channel Performance</h3>
          <div className="space-y-4">
            {channelPerformance.map((channel, index) => (
              <div key={channel.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{channel.name}</p>
                    <p className="text-sm text-gray-600">{channel.conversations} conversations</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">{channel.accuracy}%</p>
                      <p className="text-xs text-gray-500">Accuracy</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">{channel.satisfaction}</p>
                      <p className="text-xs text-gray-500">Satisfaction</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Knowledge Gap Analysis */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Knowledge Gap Analysis</h3>
          <Button variant="outline" className="text-gray-600 hover:text-gray-900">
            <Target className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {knowledgeGapAnalysis.map((gap, index) => (
            <motion.div
              key={gap.category}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="border rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{gap.category}</h4>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(gap.severity)}`}>
                  {gap.severity}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-gray-600">{gap.gaps} gaps identified</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Training Impact */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Training Impact</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Training Session</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Before</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">After</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Improvement</th>
              </tr>
            </thead>
            <tbody>
              {trainingImpact.map((session, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <Brain className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-900">{session.session}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-900">{session.before}%</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-900">{session.after}%</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-green-600">
                        +{session.improvement}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Training Sessions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Training Sessions</h3>
        <div className="space-y-3">
          {sessions.slice(0, 5).map((session, index) => (
            <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  session.status === 'completed' ? 'bg-green-100 text-green-600' :
                  session.status === 'running' ? 'bg-blue-100 text-blue-600' :
                  session.status === 'failed' ? 'bg-red-100 text-red-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {session.status === 'completed' ? <CheckCircle className="w-4 h-4" /> :
                   session.status === 'running' ? <Activity className="w-4 h-4 animate-spin" /> :
                   session.status === 'failed' ? <AlertCircle className="w-4 h-4" /> :
                   <Clock className="w-4 h-4" />}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {session.type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Training Session'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(session.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{session.status}</p>
                {session.results && (
                  <p className="text-xs text-gray-600">
                    {session.results.processedConversations} conversations
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PerformanceAnalytics;