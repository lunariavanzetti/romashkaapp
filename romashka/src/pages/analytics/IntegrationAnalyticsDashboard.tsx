import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  BarChart3, 
  PieChart, 
  Users, 
  DollarSign,
  Zap,
  Target,
  Brain,
  Settings,
  Download,
  RefreshCw,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { LineChart } from '../../components/analytics/widgets/LineChart';
import { BarChart } from '../../components/analytics/widgets/BarChart';
import { PieChart as PieChartWidget } from '../../components/analytics/widgets/PieChart';
import { KPICard } from '../../components/analytics/widgets/KPICard';
import { GaugeChart } from '../../components/analytics/widgets/GaugeChart';
import { TableWidget } from '../../components/analytics/widgets/TableWidget';
import { integrationAnalyticsService, IntegrationDashboardData } from '../../services/analytics/integrationAnalytics';

interface IntegrationAnalyticsDashboardProps {}

export default function IntegrationAnalyticsDashboard({}: IntegrationAnalyticsDashboardProps) {
  const [dashboardData, setDashboardData] = useState<IntegrationDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [selectedTimeRange]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, selectedTimeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // TODO: Get actual user ID from auth context
      const userId = 'current-user-id';
      const data = await integrationAnalyticsService.getDashboardData(userId, selectedTimeRange);
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'error': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-secondary dark:bg-bg-darker flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-teal" />
          <p className="text-gray-600 dark:text-gray-300">Loading integration analytics...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-bg-secondary dark:bg-bg-darker flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-yellow-500" />
          <p className="text-gray-600 dark:text-gray-300">Failed to load dashboard data</p>
          <Button onClick={loadDashboardData} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-secondary dark:bg-bg-darker">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-heading font-bold text-primary-deep-blue dark:text-white mb-2">
                Integration Analytics Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Monitor AI-integration performance, business impact, and optimization opportunities
              </p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <Button
                variant="outline"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? 'bg-primary-teal text-white' : ''}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Auto Refresh
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Real-time Status Bar */}
          <div className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-4 border border-white/20">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Active Integrations</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {dashboardData.realTimeMetrics.active_integrations}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">API Calls/min</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {dashboardData.realTimeMetrics.api_calls_per_minute}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Success Rate</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {((1 - dashboardData.realTimeMetrics.error_rate_last_hour) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Sync Jobs</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {dashboardData.realTimeMetrics.current_sync_jobs}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Alerts</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {dashboardData.realTimeMetrics.data_freshness_alert_count}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl mb-6 border border-white/20">
          <div className="flex overflow-x-auto">
            {[
              { id: 'overview', label: 'Executive Overview', icon: BarChart3 },
              { id: 'health', label: 'Integration Health', icon: Activity },
              { id: 'performance', label: 'AI Performance', icon: Brain },
              { id: 'business', label: 'Business Impact', icon: DollarSign },
              { id: 'intelligence', label: 'Conversation Intelligence', icon: Users },
              { id: 'predictive', label: 'Predictive Analytics', icon: Zap }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'text-primary-teal border-b-2 border-primary-teal bg-primary-teal/10'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <ExecutiveOverview dashboardData={dashboardData} />
        )}
        {activeTab === 'health' && (
          <IntegrationHealth dashboardData={dashboardData} />
        )}
        {activeTab === 'performance' && (
          <AIPerformance dashboardData={dashboardData} />
        )}
        {activeTab === 'business' && (
          <BusinessImpact dashboardData={dashboardData} />
        )}
        {activeTab === 'intelligence' && (
          <ConversationIntelligence dashboardData={dashboardData} />
        )}
        {activeTab === 'predictive' && (
          <PredictiveAnalytics dashboardData={dashboardData} />
        )}
      </div>
    </div>
  );
}

// Executive Overview Tab Component
function ExecutiveOverview({ dashboardData }: { dashboardData: IntegrationDashboardData }) {
  return (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Integration Health Score"
          value={`${(dashboardData.integrationHealth.overall_health_score * 100).toFixed(1)}%`}
          change={+5.2}
          icon={<Activity className="w-6 h-6" />}
          color="green"
        />
        <KPICard
          title="AI Query Success Rate"
          value={`${(dashboardData.aiPerformance.query_success_rate * 100).toFixed(1)}%`}
          change={+2.8}
          icon={<Brain className="w-6 h-6" />}
          color="blue"
        />
        <KPICard
          title="Total ROI"
          value={`${dashboardData.businessImpact.total_roi.toFixed(1)}%`}
          change={+12.5}
          icon={<DollarSign className="w-6 h-6" />}
          color="green"
        />
        <KPICard
          title="Data Utilization"
          value={`${(dashboardData.conversationIntelligence.data_utilization_rate * 100).toFixed(1)}%`}
          change={+8.3}
          icon={<Target className="w-6 h-6" />}
          color="purple"
        />
      </div>

      {/* Integration Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Integration Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dashboardData.integrationHealth.integrations.map((integration) => (
              <div
                key={integration.provider}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold capitalize">{integration.provider}</h3>
                  <Badge className={getStatusColor(integration.status)}>
                    {getStatusIcon(integration.status)}
                    {integration.status}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Success Rate:</span>
                    <span className="font-medium">{(integration.sync_success_rate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Data Freshness:</span>
                    <span className="font-medium">{integration.data_freshness_hours}h ago</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Errors:</span>
                    <span className="font-medium">{integration.error_count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Recent Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.predictiveInsights.slice(0, 3).map((insight, index) => (
              <div key={insight.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary-teal rounded-full mt-2"></div>
                  <div className="flex-1">
                    <h4 className="font-medium mb-1 capitalize">{insight.insight_type.replace('_', ' ')}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      Confidence: {(insight.confidence_score * 100).toFixed(1)}%
                    </p>
                    <div className="text-sm">
                      <strong>Recommended Actions:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        {insight.recommended_actions.map((action, i) => (
                          <li key={i} className="text-gray-600 dark:text-gray-300">{action}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Integration Health Tab Component
function IntegrationHealth({ dashboardData }: { dashboardData: IntegrationDashboardData }) {
  return (
    <div className="space-y-6">
      {/* Health Score Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Overall Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <GaugeChart
              value={dashboardData.integrationHealth.overall_health_score * 100}
              max={100}
              label="Health Score"
              color="green"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integration Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChartWidget
              data={[
                { name: 'Healthy', value: dashboardData.integrationHealth.integrations.filter(i => i.status === 'healthy').length },
                { name: 'Warning', value: dashboardData.integrationHealth.integrations.filter(i => i.status === 'warning').length },
                { name: 'Error', value: dashboardData.integrationHealth.integrations.filter(i => i.status === 'error').length }
              ]}
              colors={['#10B981', '#F59E0B', '#EF4444']}
            />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Integration Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Integration Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <TableWidget
            columns={[
              { key: 'provider', label: 'Provider' },
              { key: 'status', label: 'Status' },
              { key: 'sync_success_rate', label: 'Success Rate' },
              { key: 'last_sync_at', label: 'Last Sync' },
              { key: 'data_freshness_hours', label: 'Data Freshness' },
              { key: 'error_count', label: 'Errors' }
            ]}
            data={dashboardData.integrationHealth.integrations.map(integration => ({
              ...integration,
              provider: integration.provider.charAt(0).toUpperCase() + integration.provider.slice(1),
              sync_success_rate: `${(integration.sync_success_rate * 100).toFixed(1)}%`,
              last_sync_at: new Date(integration.last_sync_at).toLocaleString(),
              data_freshness_hours: `${integration.data_freshness_hours}h ago`
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// AI Performance Tab Component
function AIPerformance({ dashboardData }: { dashboardData: IntegrationDashboardData }) {
  return (
    <div className="space-y-6">
      {/* Performance KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Query Success Rate"
          value={`${(dashboardData.aiPerformance.query_success_rate * 100).toFixed(1)}%`}
          change={+3.2}
          icon={<CheckCircle className="w-6 h-6" />}
          color="green"
        />
        <KPICard
          title="Avg Response Time"
          value={`${dashboardData.aiPerformance.avg_response_time_ms}ms`}
          change={-15.8}
          icon={<Clock className="w-6 h-6" />}
          color="blue"
        />
        <KPICard
          title="Confidence Improvement"
          value={`+${dashboardData.aiPerformance.confidence_improvement.toFixed(1)}%`}
          change={+7.4}
          icon={<TrendingUp className="w-6 h-6" />}
          color="purple"
        />
      </div>

      {/* Most Valuable Data Types */}
      <Card>
        <CardHeader>
          <CardTitle>Most Valuable Data Types</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            data={dashboardData.aiPerformance.most_valuable_data_types.map(type => ({
              name: type.type.replace('_', ' ').toUpperCase(),
              value: type.avg_confidence_boost * 100,
              usage: type.usage_count
            }))}
            xKey="name"
            yKey="value"
            color="#06B6D4"
          />
        </CardContent>
      </Card>

      {/* Data Type Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Type Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <TableWidget
            columns={[
              { key: 'type', label: 'Data Type' },
              { key: 'usage_count', label: 'Usage Count' },
              { key: 'success_rate', label: 'Success Rate' },
              { key: 'avg_confidence_boost', label: 'Avg Confidence Boost' }
            ]}
            data={dashboardData.aiPerformance.most_valuable_data_types.map(type => ({
              type: type.type.replace('_', ' ').toUpperCase(),
              usage_count: type.usage_count,
              success_rate: `${(type.success_rate * 100).toFixed(1)}%`,
              avg_confidence_boost: `+${(type.avg_confidence_boost * 100).toFixed(1)}%`
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// Business Impact Tab Component
function BusinessImpact({ dashboardData }: { dashboardData: IntegrationDashboardData }) {
  return (
    <div className="space-y-6">
      {/* ROI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Total ROI"
          value={`${dashboardData.businessImpact.total_roi.toFixed(1)}%`}
          change={+12.5}
          icon={<DollarSign className="w-6 h-6" />}
          color="green"
        />
        <KPICard
          title="Cost Savings"
          value={`$${dashboardData.businessImpact.cost_savings.toLocaleString()}`}
          change={+28.3}
          icon={<TrendingUp className="w-6 h-6" />}
          color="blue"
        />
        <KPICard
          title="Revenue Attribution"
          value={`$${dashboardData.businessImpact.revenue_attribution.toLocaleString()}`}
          change={+15.7}
          icon={<Target className="w-6 h-6" />}
          color="purple"
        />
      </div>

      {/* Efficiency Gains */}
      <Card>
        <CardHeader>
          <CardTitle>Efficiency Gains by Metric</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            data={dashboardData.businessImpact.efficiency_gains.map(gain => ({
              name: gain.metric.replace('_', ' ').toUpperCase(),
              value: gain.improvement_percentage,
              current_value: gain.value
            }))}
            xKey="name"
            yKey="value"
            color="#10B981"
          />
        </CardContent>
      </Card>

      {/* Conversion Impact */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Impact Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Baseline Rate</h3>
              <p className="text-3xl font-bold text-gray-600">
                {(dashboardData.businessImpact.conversion_impact.baseline_rate * 100).toFixed(1)}%
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Current Rate</h3>
              <p className="text-3xl font-bold text-primary-teal">
                {(dashboardData.businessImpact.conversion_impact.current_rate * 100).toFixed(1)}%
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Improvement</h3>
              <p className="text-3xl font-bold text-green-600">
                +{(dashboardData.businessImpact.conversion_impact.improvement * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Conversation Intelligence Tab Component
function ConversationIntelligence({ dashboardData }: { dashboardData: IntegrationDashboardData }) {
  return (
    <div className="space-y-6">
      {/* Intelligence KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Data Utilization Rate"
          value={`${(dashboardData.conversationIntelligence.data_utilization_rate * 100).toFixed(1)}%`}
          change={+5.8}
          icon={<Users className="w-6 h-6" />}
          color="blue"
        />
        <KPICard
          title="Knowledge Gap Frequency"
          value={dashboardData.conversationIntelligence.knowledge_gap_frequency.toFixed(1)}
          change={-12.3}
          icon={<Brain className="w-6 h-6" />}
          color="orange"
        />
        <KPICard
          title="Satisfaction Improvement"
          value={`+${(dashboardData.conversationIntelligence.satisfaction_correlation.improvement * 100).toFixed(1)}%`}
          change={+8.9}
          icon={<TrendingUp className="w-6 h-6" />}
          color="green"
        />
      </div>

      {/* Satisfaction Correlation */}
      <Card>
        <CardHeader>
          <CardTitle>AI Confidence: With vs Without Integration Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-blue-800 dark:text-blue-300">With Integration Data</h3>
              <p className="text-4xl font-bold text-blue-600">
                {(dashboardData.conversationIntelligence.satisfaction_correlation.with_data * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-blue-600 mt-2">Average Confidence Score</p>
            </div>
            <div className="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-300">Without Integration Data</h3>
              <p className="text-4xl font-bold text-gray-600">
                {(dashboardData.conversationIntelligence.satisfaction_correlation.without_data * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600 mt-2">Average Confidence Score</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Journey Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Journey Insights</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardData.conversationIntelligence.customer_journey_insights.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Customer journey data will appear here as conversations are analyzed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dashboardData.conversationIntelligence.customer_journey_insights.map((insight, index) => (
                <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">{insight.stage}</h4>
                    <Badge>{(insight.conversion_rate * 100).toFixed(1)}% conversion</Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    Average data points used: {insight.avg_data_points_used}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Predictive Analytics Tab Component
function PredictiveAnalytics({ dashboardData }: { dashboardData: IntegrationDashboardData }) {
  return (
    <div className="space-y-6">
      {/* Predictive Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            AI-Generated Insights & Predictions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardData.predictiveInsights.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Predictive insights will appear here as the system learns from your data</p>
            </div>
          ) : (
            <div className="space-y-6">
              {dashboardData.predictiveInsights.map((insight) => (
                <div key={insight.id} className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold capitalize mb-2">
                        {insight.insight_type.replace('_', ' ')}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {(insight.confidence_score * 100).toFixed(1)}% confidence
                        </Badge>
                        <Badge variant="outline">
                          Value: {insight.predicted_value.toFixed(2)}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {new Date(insight.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Contributing Factors:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
                        {insight.contributing_factors.map((factor, index) => (
                          <li key={index}>{factor}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Recommended Actions:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
                        {insight.recommended_actions.map((action, index) => (
                          <li key={index}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insight Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { type: 'churn_risk', label: 'Churn Risk', icon: AlertTriangle, color: 'red' },
          { type: 'upsell_opportunity', label: 'Upsell Opportunities', icon: TrendingUp, color: 'green' },
          { type: 'integration_need', label: 'Integration Needs', icon: Settings, color: 'blue' },
          { type: 'performance_anomaly', label: 'Performance Anomalies', icon: Activity, color: 'orange' }
        ].map((category) => {
          const Icon = category.icon;
          const count = dashboardData.predictiveInsights.filter(i => i.insight_type === category.type).length;
          
          return (
            <Card key={category.type}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${category.color}-100 text-${category.color}-600`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{category.label}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}