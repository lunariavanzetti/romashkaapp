import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Brain,
  Zap,
  Calendar,
  Clock,
  Users,
  BarChart3,
  LineChart,
  Activity,
  Star,
  Settings,
  Download,
  RefreshCw,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { Line, Bar, Scatter, Doughnut } from 'react-chartjs-2';
import { PredictiveAnalytics } from '../../services/analytics/predictiveAnalytics';
import { subDays, addDays, format } from 'date-fns';
import { Button } from '../../components/ui';
import type { 
  ForecastPoint, 
  AnomalyDetection, 
  StaffingRecommendation, 
  OptimizationInsight,
  CustomerSatisfactionPrediction,
  SeasonalPattern
} from '../../services/analytics/predictiveAnalytics';
import type { TimeRange } from '../../types/analytics';

interface PredictiveAnalyticsData {
  conversationForecast: ForecastPoint[];
  anomalies: AnomalyDetection[];
  staffingRecommendations: StaffingRecommendation[];
  optimizationInsights: OptimizationInsight[];
  satisfactionPredictions: CustomerSatisfactionPrediction[];
  seasonalPatterns: SeasonalPattern[];
}

export default function PredictiveAnalyticsTab() {
  const [data, setData] = useState<PredictiveAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>({
    start: subDays(new Date(), 30),
    end: new Date(),
    label: 'Last 30 days'
  });
  const [selectedMetric, setSelectedMetric] = useState('total_conversations');
  const [forecastPeriod, setForecastPeriod] = useState(14); // days

  const predictiveAnalytics = PredictiveAnalytics.getInstance();

  useEffect(() => {
    fetchPredictiveData();
  }, [timeRange, selectedMetric]);

  const fetchPredictiveData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        conversationForecast,
        anomalies,
        staffingRecommendations,
        optimizationInsights,
        seasonalPatterns
      ] = await Promise.all([
        predictiveAnalytics.forecastConversationVolume(timeRange),
        predictiveAnalytics.detectAnomalies(selectedMetric, timeRange),
        predictiveAnalytics.predictStaffingNeeds(timeRange),
        predictiveAnalytics.generateOptimizationRecommendations(),
        predictiveAnalytics.analyzeSeasonalPatterns(selectedMetric, timeRange)
      ]);

      setData({
        conversationForecast,
        anomalies,
        staffingRecommendations,
        optimizationInsights,
        satisfactionPredictions: [], // Will be populated with active conversations
        seasonalPatterns
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch predictive analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Chart configurations
  const forecastChartData = {
    labels: data?.conversationForecast.map(point => format(point.date, 'MMM d')) || [],
    datasets: [
      {
        label: 'Predicted Volume',
        data: data?.conversationForecast.map(point => point.predicted) || [],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Upper Bound',
        data: data?.conversationForecast.map(point => point.upper) || [],
        borderColor: 'rgba(99, 102, 241, 0.3)',
        backgroundColor: 'rgba(99, 102, 241, 0.05)',
        fill: '+1',
        tension: 0.4,
        pointRadius: 0
      },
      {
        label: 'Lower Bound',
        data: data?.conversationForecast.map(point => point.lower) || [],
        borderColor: 'rgba(99, 102, 241, 0.3)',
        backgroundColor: 'rgba(99, 102, 241, 0.05)',
        fill: false,
        tension: 0.4,
        pointRadius: 0
      }
    ]
  };

  const forecastChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Conversation Volume Forecast'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Conversations'
        }
      }
    }
  };

  const staffingChartData = {
    labels: data?.staffingRecommendations.slice(0, 24).map(rec => 
      format(rec.timeSlot, 'HH:mm')
    ) || [],
    datasets: [
      {
        label: 'Recommended Agents',
        data: data?.staffingRecommendations.slice(0, 24).map(rec => rec.recommendedAgents) || [],
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2
      },
      {
        label: 'Current Agents',
        data: data?.staffingRecommendations.slice(0, 24).map(rec => rec.currentAgents) || [],
        backgroundColor: 'rgba(239, 68, 68, 0.6)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 2
      }
    ]
  };

  const seasonalPatternData = data?.seasonalPatterns.find(p => p.period === 'weekly');
  const weeklyPatternChartData = {
    labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    datasets: [
      {
        label: 'Average Volume',
        data: seasonalPatternData?.pattern || [],
        backgroundColor: 'rgba(168, 85, 247, 0.6)',
        borderColor: 'rgba(168, 85, 247, 1)',
        borderWidth: 2
      }
    ]
  };

  const optimizationCategoryData = {
    labels: ['Staffing', 'Process', 'Technology', 'Training', 'Routing'],
    datasets: [
      {
        data: [
          data?.optimizationInsights.filter(i => i.category === 'staffing').length || 0,
          data?.optimizationInsights.filter(i => i.category === 'process').length || 0,
          data?.optimizationInsights.filter(i => i.category === 'technology').length || 0,
          data?.optimizationInsights.filter(i => i.category === 'training').length || 0,
          data?.optimizationInsights.filter(i => i.category === 'routing').length || 0,
        ],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF'
        ],
        borderWidth: 2
      }
    ]
  };

  const getAnomalySeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getOptimizationIcon = (category: string) => {
    switch (category) {
      case 'staffing': return <Users className="w-5 h-5" />;
      case 'process': return <Activity className="w-5 h-5" />;
      case 'technology': return <Brain className="w-5 h-5" />;
      case 'training': return <Star className="w-5 h-5" />;
      case 'routing': return <Target className="w-5 h-5" />;
      default: return <Zap className="w-5 h-5" />;
    }
  };

  const getImpactBadge = (impact: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[impact as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getEffortBadge = (effort: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[effort as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Loading predictive analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchPredictiveData}>
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
          <h2 className="text-xl font-semibold text-gray-900">Predictive Analytics</h2>
          <p className="text-gray-600">Forecasting and optimization insights</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="total_conversations">Total Conversations</option>
            <option value="avg_first_response_time_seconds">Response Time</option>
            <option value="avg_satisfaction_score">Satisfaction Score</option>
            <option value="ai_resolved_conversations">AI Resolution</option>
          </select>
          <Button onClick={fetchPredictiveData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Forecast Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Forecast Accuracy</p>
              <p className="text-2xl font-bold text-gray-900">
                {data?.conversationForecast.length > 0 ? 
                  `${Math.round((data.conversationForecast.reduce((sum, p) => sum + p.confidence, 0) / data.conversationForecast.length) * 100)}%` : 
                  'N/A'
                }
              </p>
            </div>
            <Target className="w-8 h-8 text-blue-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Anomalies Detected</p>
              <p className="text-2xl font-bold text-gray-900">{data?.anomalies.length || 0}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Optimization Insights</p>
              <p className="text-2xl font-bold text-gray-900">{data?.optimizationInsights.length || 0}</p>
            </div>
            <Zap className="w-8 h-8 text-green-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Staffing Efficiency</p>
              <p className="text-2xl font-bold text-gray-900">
                {data?.staffingRecommendations.length > 0 ? 
                  `${Math.round((data.staffingRecommendations.reduce((sum, s) => sum + s.utilizationRate, 0) / data.staffingRecommendations.length) * 100)}%` : 
                  'N/A'
                }
              </p>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
          </div>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversation Volume Forecast */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Conversation Volume Forecast</h3>
            <p className="text-sm text-gray-600">Next {forecastPeriod} days prediction</p>
          </div>
          <div className="p-4">
            <div className="h-64">
              <Line data={forecastChartData} options={forecastChartOptions} />
            </div>
          </div>
        </div>

        {/* Staffing Recommendations */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Staffing Recommendations</h3>
            <p className="text-sm text-gray-600">Next 24 hours</p>
          </div>
          <div className="p-4">
            <div className="h-64">
              <Bar 
                data={staffingChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top'
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Number of Agents'
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Seasonal Patterns and Optimization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Patterns */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Weekly Patterns</h3>
            <p className="text-sm text-gray-600">Average volume by day of week</p>
          </div>
          <div className="p-4">
            <div className="h-64">
              <Bar 
                data={weeklyPatternChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Optimization Categories */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Optimization Categories</h3>
            <p className="text-sm text-gray-600">Distribution of improvement opportunities</p>
          </div>
          <div className="p-4">
            <div className="h-64">
              <Doughnut 
                data={optimizationCategoryData} 
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

      {/* Anomalies */}
      {data?.anomalies && data.anomalies.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Detected Anomalies</h3>
            <p className="text-sm text-gray-600">Unusual patterns requiring attention</p>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {data.anomalies.map((anomaly) => (
                <div
                  key={anomaly.id}
                  className={`p-4 rounded-lg border ${getAnomalySeverityColor(anomaly.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="w-5 h-5" />
                        <h4 className="font-medium">{anomaly.metric}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${getAnomalySeverityColor(anomaly.severity)}`}>
                          {anomaly.severity}
                        </span>
                      </div>
                      <p className="text-sm mb-2">{anomaly.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Value: {anomaly.value}</span>
                        <span>Expected: {anomaly.expectedValue.toFixed(2)}</span>
                        <span>Confidence: {Math.round(anomaly.confidence * 100)}%</span>
                        <span>{format(anomaly.timestamp, 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-sm font-medium text-gray-900">Impact</p>
                      <p className="text-xs text-gray-600">{anomaly.impact}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-700">
                      <strong>Recommendation:</strong> {anomaly.recommendation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Optimization Insights */}
      {data?.optimizationInsights && data.optimizationInsights.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Optimization Insights</h3>
            <p className="text-sm text-gray-600">Actionable recommendations for improvement</p>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.optimizationInsights.map((insight) => (
                <div
                  key={insight.id}
                  className="p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getOptimizationIcon(insight.category)}
                      <h4 className="font-medium text-gray-900">{insight.title}</h4>
                    </div>
                    <span className="text-sm text-gray-500">{insight.category}</span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                  
                  <div className="flex items-center space-x-2 mb-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${getImpactBadge(insight.impact)}`}>
                      {insight.impact} impact
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getEffortBadge(insight.effort)}`}>
                      {insight.effort} effort
                    </span>
                    <span className="text-xs text-gray-500">
                      ROI: {insight.roi}%
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-700">
                    <div className="mb-2">
                      <strong>Implementation:</strong> {insight.implementation}
                    </div>
                    <div className="mb-2">
                      <strong>Timeline:</strong> {insight.timeline}
                    </div>
                    <div className="flex items-center space-x-4">
                      <span>Confidence: {Math.round(insight.confidence * 100)}%</span>
                      <span>Metrics: {insight.metrics.join(', ')}</span>
                    </div>
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