import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Users,
  MessageSquare,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Heart,
  Brain,
  Zap,
  Target,
  BarChart3,
  PieChart,
  LineChart,
  RefreshCw,
  Download,
  Filter,
  Eye,
  AlertCircle,
  Star,
  Calendar,
  Settings
} from 'lucide-react';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale
} from 'chart.js';
import { RealtimeAnalytics } from '../../services/analytics/realtimeAnalytics';
import { AnalyticsEngine } from '../../services/analytics/analyticsEngine';
import { format, subMinutes, subHours } from 'date-fns';
import { Button } from '../../components/ui';
import type { LiveMetrics, ConversationSummary, AgentMetrics, ChannelActivity } from '../../types/analytics';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale
);

interface RealTimeMetrics {
  timestamp: Date;
  activeConversations: number;
  responseTime: number;
  satisfaction: number;
  aiResolution: number;
  queueLength: number;
  agentUtilization: number;
}

interface LiveAlert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
  actionRequired: boolean;
}

interface PredictiveInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'forecast' | 'optimization';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  timeline: string;
  recommendation: string;
  data: any;
}

export default function RealTimeAnalytics() {
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics | null>(null);
  const [historicalData, setHistoricalData] = useState<RealTimeMetrics[]>([]);
  const [activeConversations, setActiveConversations] = useState<ConversationSummary[]>([]);
  const [agentMetrics, setAgentMetrics] = useState<AgentMetrics[]>([]);
  const [channelActivity, setChannelActivity] = useState<ChannelActivity[]>([]);
  const [liveAlerts, setLiveAlerts] = useState<LiveAlert[]>([]);
  const [insights, setInsights] = useState<PredictiveInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds
  const [autoRefresh, setAutoRefresh] = useState(true);

  const realtimeAnalytics = RealtimeAnalytics.getInstance();
  const analyticsEngine = AnalyticsEngine.getInstance();

  // Fetch live metrics
  const fetchLiveMetrics = useCallback(async () => {
    try {
      const metrics = await realtimeAnalytics.getLiveMetrics();
      setLiveMetrics(metrics);
      
      // Update historical data
      const now = new Date();
      const historicalPoint: RealTimeMetrics = {
        timestamp: now,
        activeConversations: metrics.activeConversations,
        responseTime: metrics.avgResponseTime,
        satisfaction: metrics.satisfactionScore,
        aiResolution: metrics.aiResolutionRate,
        queueLength: metrics.activeConversations, // Placeholder
        agentUtilization: metrics.agentProductivity
      };
      
      setHistoricalData(prev => {
        const updated = [...prev, historicalPoint];
        // Keep only last 30 minutes of data
        const cutoff = subMinutes(now, 30);
        return updated.filter(point => point.timestamp > cutoff);
      });
    } catch (err) {
      console.error('Error fetching live metrics:', err);
      setError('Failed to fetch live metrics');
    }
  }, []);

  // Fetch active conversations
  const fetchActiveConversations = useCallback(async () => {
    try {
      const conversations = await realtimeAnalytics.getActiveConversations();
      setActiveConversations(conversations);
    } catch (err) {
      console.error('Error fetching active conversations:', err);
    }
  }, []);

  // Fetch agent performance
  const fetchAgentMetrics = useCallback(async () => {
    try {
      const agents = await realtimeAnalytics.getAgentPerformance();
      setAgentMetrics(agents);
    } catch (err) {
      console.error('Error fetching agent metrics:', err);
    }
  }, []);

  // Fetch channel activity
  const fetchChannelActivity = useCallback(async () => {
    try {
      const activity = await realtimeAnalytics.getChannelActivity();
      setChannelActivity(activity);
    } catch (err) {
      console.error('Error fetching channel activity:', err);
    }
  }, []);

  // Generate live alerts
  const generateLiveAlerts = useCallback((metrics: LiveMetrics) => {
    const alerts: LiveAlert[] = [];
    
    // Response time alert
    if (metrics.avgResponseTime > 60) {
      alerts.push({
        id: 'response-time',
        type: 'warning',
        title: 'High Response Time',
        message: `Average response time is ${metrics.avgResponseTime.toFixed(1)}s`,
        timestamp: new Date(),
        severity: metrics.avgResponseTime > 120 ? 'high' : 'medium',
        actionRequired: true
      });
    }
    
    // Queue length alert
    if (metrics.activeConversations > 20) {
      alerts.push({
        id: 'queue-length',
        type: 'error',
        title: 'High Queue Length',
        message: `${metrics.activeConversations} active conversations`,
        timestamp: new Date(),
        severity: 'high',
        actionRequired: true
      });
    }
    
    // Satisfaction alert
    if (metrics.satisfactionScore < 3.0) {
      alerts.push({
        id: 'satisfaction',
        type: 'warning',
        title: 'Low Satisfaction Score',
        message: `Average satisfaction is ${metrics.satisfactionScore.toFixed(1)}/5`,
        timestamp: new Date(),
        severity: 'medium',
        actionRequired: true
      });
    }
    
    // AI resolution alert
    if (metrics.aiResolutionRate < 0.6) {
      alerts.push({
        id: 'ai-resolution',
        type: 'info',
        title: 'Low AI Resolution Rate',
        message: `AI resolving ${(metrics.aiResolutionRate * 100).toFixed(1)}% of conversations`,
        timestamp: new Date(),
        severity: 'low',
        actionRequired: false
      });
    }
    
    setLiveAlerts(alerts);
  }, []);

  // Generate predictive insights
  const generatePredictiveInsights = useCallback(async () => {
    try {
      const insights = await analyticsEngine.generateInsights({
        timeRange: {
          start: subHours(new Date(), 24),
          end: new Date()
        }
      });
      
      const predictiveInsights: PredictiveInsight[] = insights.map(insight => ({
        id: insight.id,
        type: insight.type as any,
        title: insight.title,
        description: insight.description,
        confidence: insight.confidence,
        impact: insight.impact,
        timeline: 'Next 24 hours',
        recommendation: insight.description,
        data: insight.data
      }));
      
      setInsights(predictiveInsights);
    } catch (err) {
      console.error('Error generating insights:', err);
    }
  }, []);

  // Main data fetching function
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchLiveMetrics(),
        fetchActiveConversations(),
        fetchAgentMetrics(),
        fetchChannelActivity(),
        generatePredictiveInsights()
      ]);
    } catch (err) {
      setError('Failed to fetch real-time data');
    } finally {
      setLoading(false);
    }
  }, [fetchLiveMetrics, fetchActiveConversations, fetchAgentMetrics, fetchChannelActivity, generatePredictiveInsights]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, autoRefresh, refreshInterval]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Generate alerts when metrics change
  useEffect(() => {
    if (liveMetrics) {
      generateLiveAlerts(liveMetrics);
    }
  }, [liveMetrics, generateLiveAlerts]);

  // Chart configurations
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Real-Time Metrics Trends'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
      },
      x: {
        type: 'time' as const,
        time: {
          unit: 'minute' as const,
        },
      }
    },
    animation: {
      duration: 0 // Disable animation for real-time updates
    }
  };

  const metricsChartData = {
    labels: historicalData.map(d => format(d.timestamp, 'HH:mm')),
    datasets: [
      {
        label: 'Active Conversations',
        data: historicalData.map(d => d.activeConversations),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: true,
        tension: 0.1
      },
      {
        label: 'Response Time (s)',
        data: historicalData.map(d => d.responseTime),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: true,
        tension: 0.1
      },
      {
        label: 'Satisfaction Score',
        data: historicalData.map(d => d.satisfaction),
        borderColor: 'rgb(255, 205, 86)',
        backgroundColor: 'rgba(255, 205, 86, 0.2)',
        fill: true,
        tension: 0.1
      }
    ]
  };

  const channelDistributionData = {
    labels: channelActivity.map(c => c.channel),
    datasets: [
      {
        data: channelActivity.map(c => c.activeConversations),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40'
        ],
        borderWidth: 2
      }
    ]
  };

  const agentPerformanceData = {
    labels: agentMetrics.map(a => a.name),
    datasets: [
      {
        label: 'Active Conversations',
        data: agentMetrics.map(a => a.activeConversations),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2
      },
      {
        label: 'Response Time (s)',
        data: agentMetrics.map(a => a.avgResponseTime),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2
      }
    ]
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'conversations': return <MessageSquare className="w-6 h-6" />;
      case 'response-time': return <Clock className="w-6 h-6" />;
      case 'satisfaction': return <Heart className="w-6 h-6" />;
      case 'ai-resolution': return <Brain className="w-6 h-6" />;
      case 'agents': return <Users className="w-6 h-6" />;
      default: return <Activity className="w-6 h-6" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info': return <Eye className="w-5 h-5 text-blue-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend': return <TrendingUp className="w-5 h-5" />;
      case 'anomaly': return <AlertTriangle className="w-5 h-5" />;
      case 'forecast': return <Target className="w-5 h-5" />;
      case 'optimization': return <Zap className="w-5 h-5" />;
      default: return <BarChart3 className="w-5 h-5" />;
    }
  };

  if (loading && !liveMetrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Loading real-time analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchData} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Real-Time Analytics</h1>
          <p className="text-gray-600">Live monitoring and insights</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Auto-refresh</label>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoRefresh ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoRefresh ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value={1000}>1s</option>
            <option value={5000}>5s</option>
            <option value={10000}>10s</option>
            <option value={30000}>30s</option>
          </select>
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Live Alerts */}
      {liveAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200"
        >
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Live Alerts</h3>
          </div>
          <div className="p-4 space-y-3">
            {liveAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-center space-x-3 p-3 rounded-lg border ${
                  alert.severity === 'high' ? 'bg-red-50 border-red-200' :
                  alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200'
                }`}
              >
                {getAlertIcon(alert.type)}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">{alert.title}</h4>
                    <span className="text-xs text-gray-500">
                      {format(alert.timestamp, 'HH:mm:ss')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{alert.message}</p>
                </div>
                {alert.actionRequired && (
                  <Button size="sm" variant="outline">
                    Action Required
                  </Button>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Key Metrics */}
      {liveMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Conversations</p>
                <p className="text-2xl font-bold text-gray-900">{liveMetrics.activeConversations}</p>
              </div>
              <div className="text-primary-600">
                {getMetricIcon('conversations')}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-gray-900">{liveMetrics.avgResponseTime.toFixed(1)}s</p>
              </div>
              <div className="text-primary-600">
                {getMetricIcon('response-time')}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Satisfaction Score</p>
                <p className="text-2xl font-bold text-gray-900">{liveMetrics.satisfactionScore.toFixed(1)}/5</p>
              </div>
              <div className="text-primary-600">
                {getMetricIcon('satisfaction')}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">AI Resolution Rate</p>
                <p className="text-2xl font-bold text-gray-900">{(liveMetrics.aiResolutionRate * 100).toFixed(1)}%</p>
              </div>
              <div className="text-primary-600">
                {getMetricIcon('ai-resolution')}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Agent Productivity</p>
                <p className="text-2xl font-bold text-gray-900">{liveMetrics.agentProductivity.toFixed(1)}</p>
              </div>
              <div className="text-primary-600">
                {getMetricIcon('agents')}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="text-sm font-medium text-gray-900">
                  {format(liveMetrics.lastUpdated, 'HH:mm:ss')}
                </p>
              </div>
              <div className="text-primary-600">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-Time Trends */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Real-Time Trends</h3>
          </div>
          <div className="p-4">
            <div className="h-64">
              <Line data={metricsChartData} options={lineChartOptions} />
            </div>
          </div>
        </div>

        {/* Channel Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Channel Distribution</h3>
          </div>
          <div className="p-4">
            <div className="h-64">
              <Doughnut 
                data={channelDistributionData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Agent Performance and Channel Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Performance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Agent Performance</h3>
          </div>
          <div className="p-4">
            <div className="h-64">
              <Bar 
                data={agentPerformanceData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top'
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Active Conversations */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Active Conversations</h3>
          </div>
          <div className="p-4">
            <div className="h-64 overflow-y-auto">
              {activeConversations.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No active conversations</p>
              ) : (
                <div className="space-y-3">
                  {activeConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-gray-900">{conversation.customerName}</p>
                          <p className="text-sm text-gray-500">{conversation.channel}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-900">{Math.floor(conversation.duration / 60)}m</p>
                        {conversation.satisfaction && (
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-xs text-gray-500">{conversation.satisfaction}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Predictive Insights */}
      {insights.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Predictive Insights</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  className="p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getInsightIcon(insight.type)}
                      <h4 className="font-medium text-gray-900">{insight.title}</h4>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      insight.impact === 'high' ? 'bg-red-100 text-red-700' :
                      insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {insight.impact} impact
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Confidence: {insight.confidence}%
                    </span>
                    <span className="text-xs text-gray-500">{insight.timeline}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}