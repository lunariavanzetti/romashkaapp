import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ScatterChart, Scatter, PieChart, Pie, Cell
} from 'recharts';
import { 
  Activity, TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle, 
  Clock, ThumbsUp, MessageSquare, Brain, Zap, Eye, RefreshCw, Settings,
  BarChart3, Users, BookOpen, Cpu, Calendar, Filter
} from 'lucide-react';

import { performanceOptimizer } from '../../services/ai/training/performanceOptimizer';
import { aiTrainingService } from '../../services/ai/training/aiTrainingService';

interface PerformanceMonitorProps {
  onRecommendationClick?: (recommendation: any) => void;
  refreshInterval?: number;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  onRecommendationClick,
  refreshInterval = 30000
}) => {
  const [dashboardData, setDashboardData] = useState<any>({
    metrics: [],
    recommendations: [],
    assessments: [],
    trends: {},
    summary: {}
  });
  const [loading, setLoading] = useState(true);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('accuracy');
  const [selectedPeriod, setSelectedPeriod] = useState('24h');

  useEffect(() => {
    loadPerformanceData();
    
    const interval = setInterval(loadPerformanceData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, selectedPeriod]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      const data = await performanceOptimizer.getPerformanceDashboard();
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startOptimization = async () => {
    try {
      setIsOptimizing(true);
      await performanceOptimizer.startOptimization();
    } catch (error) {
      console.error('Error starting optimization:', error);
    }
  };

  const stopOptimization = async () => {
    try {
      performanceOptimizer.stopOptimization();
      setIsOptimizing(false);
    } catch (error) {
      console.error('Error stopping optimization:', error);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'fair': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const formatNumber = (value: number, decimals = 1) => {
    return value ? value.toFixed(decimals) : '0';
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Monitor</h2>
          <p className="text-gray-600">Real-time AI performance tracking and optimization</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={isOptimizing ? stopOptimization : startOptimization}
            variant={isOptimizing ? "destructive" : "default"}
            className="flex items-center space-x-2"
          >
            <Zap className="w-4 h-4" />
            <span>{isOptimizing ? 'Stop Optimization' : 'Start Optimization'}</span>
          </Button>
          <Button variant="outline" onClick={loadPerformanceData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Optimization Status */}
      {isOptimizing && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="animate-pulse w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-blue-800 font-medium">Continuous optimization active</span>
              </div>
              <div className="text-sm text-blue-600">
                Next cycle: {new Date(Date.now() + 30 * 60 * 1000).toLocaleTimeString()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold capitalize">
                {dashboardData.summary?.overallHealth || 'Unknown'}
              </div>
              <Badge 
                variant="outline" 
                className={getHealthColor(dashboardData.summary?.overallHealth)}
              >
                {dashboardData.summary?.overallHealth || 'Unknown'}
              </Badge>
            </div>
            <Progress 
              value={dashboardData.summary?.keyMetrics?.accuracy || 0} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(dashboardData.summary?.keyMetrics?.accuracy)}%
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {getTrendIcon(dashboardData.trends?.accuracy?.trend)}
              <span>
                {formatNumber(dashboardData.trends?.accuracy?.changePercent)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(dashboardData.summary?.keyMetrics?.satisfaction)}
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {getTrendIcon(dashboardData.trends?.satisfaction?.trend)}
              <span>
                {formatNumber(dashboardData.trends?.satisfaction?.changePercent)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(dashboardData.summary?.keyMetrics?.resolution)}%
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {getTrendIcon(dashboardData.trends?.resolution?.trend)}
              <span>
                {formatNumber(dashboardData.trends?.resolution?.changePercent)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {dashboardData.summary?.alerts?.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-800">
              <AlertTriangle className="w-5 h-5" />
              <span>Performance Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dashboardData.summary.alerts.map((alert: string, index: number) => (
                <div key={index} className="flex items-center space-x-2 text-sm text-orange-700">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{alert}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dashboardData.metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="accuracy" 
                      stroke="#8884d8" 
                      name="Accuracy"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="customer_satisfaction" 
                      stroke="#82ca9d" 
                      name="Satisfaction"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="resolution_rate" 
                      stroke="#ffc658" 
                      name="Resolution Rate"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Time Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboardData.metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="response_time" fill="#8884d8" name="Response Time (ms)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Knowledge Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Utilization Rate</span>
                    <span className="text-2xl font-bold">
                      {formatNumber(dashboardData.metrics?.[0]?.knowledge_utilization || 0)}%
                    </span>
                  </div>
                  <Progress value={dashboardData.metrics?.[0]?.knowledge_utilization || 0} />
                  <div className="text-xs text-gray-600">
                    Knowledge base articles used in conversations
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Template Effectiveness</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Effectiveness</span>
                    <span className="text-2xl font-bold">
                      {formatNumber(dashboardData.metrics?.[0]?.template_effectiveness || 0)}%
                    </span>
                  </div>
                  <Progress value={dashboardData.metrics?.[0]?.template_effectiveness || 0} />
                  <div className="text-xs text-gray-600">
                    Templates leading to successful resolutions
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Confidence Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">AI Confidence</span>
                    <span className="text-2xl font-bold">
                      {formatNumber(dashboardData.metrics?.[0]?.confidence_score || 0)}%
                    </span>
                  </div>
                  <Progress value={dashboardData.metrics?.[0]?.confidence_score || 0} />
                  <div className="text-xs text-gray-600">
                    Average confidence in AI responses
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Quality Tab */}
        <TabsContent value="quality" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quality Assessments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.assessments?.slice(0, 5).map((assessment: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          Conversation {assessment.conversation_id?.slice(-8)}
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                          <span>Accuracy: {assessment.accuracy_score}%</span>
                          <span>Satisfaction: {assessment.satisfaction_score}%</span>
                          <span>Efficiency: {assessment.efficiency_score}%</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">{assessment.overall_score}%</div>
                        <div className="text-xs text-gray-500">overall</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quality Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Excellent', value: 25, color: '#10b981' },
                        { name: 'Good', value: 45, color: '#3b82f6' },
                        { name: 'Fair', value: 20, color: '#f59e0b' },
                        { name: 'Poor', value: 10, color: '#ef4444' }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Excellent', value: 25, color: '#10b981' },
                        { name: 'Good', value: 45, color: '#3b82f6' },
                        { name: 'Fair', value: 20, color: '#f59e0b' },
                        { name: 'Poor', value: 10, color: '#ef4444' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quality Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.assessments?.flatMap((a: any) => a.issues || [])
                  .slice(0, 8)
                  .map((issue: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{issue.type}</div>
                        <div className="text-xs text-gray-600 mt-1">{issue.description}</div>
                        <div className="text-xs text-blue-600 mt-1">
                          Suggestion: {issue.suggestion}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${issue.severity === 'high' ? 'border-red-500 text-red-700' : 
                            issue.severity === 'medium' ? 'border-yellow-500 text-yellow-700' : 
                            'border-green-500 text-green-700'}`}
                        >
                          {issue.severity}
                        </Badge>
                        <div className="text-sm font-medium">{issue.impact}/10</div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dashboardData.recommendations?.map((rec: any, index: number) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => onRecommendationClick?.(rec)}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{rec.title}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{rec.type}</Badge>
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(rec.priority)}`}></div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{rec.description}</p>
                  
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{rec.impact}/10</div>
                      <div className="text-xs text-gray-500">Impact</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{rec.effort}/10</div>
                      <div className="text-xs text-gray-500">Effort</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{rec.expectedImprovement}%</div>
                      <div className="text-xs text-gray-500">ROI</div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm font-medium">Action Items:</div>
                    {rec.actionItems?.slice(0, 3).map((item: string, itemIndex: number) => (
                      <div key={itemIndex} className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        <span className="text-xs text-gray-600">{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="w-5 h-5" />
                  <span>AI Learning</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Learning Velocity</span>
                    <span className="font-bold">2.3 patterns/hour</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Knowledge Updates</span>
                    <span className="font-bold">47 this week</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Improvement Rate</span>
                    <span className="font-bold">+12.5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>User Interaction</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Conversations</span>
                    <span className="font-bold">1,234</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Avg. Response Time</span>
                    <span className="font-bold">2.3s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Customer Satisfaction</span>
                    <span className="font-bold">4.2/5</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5" />
                  <span>Knowledge Base</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Articles Used</span>
                    <span className="font-bold">89%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Coverage Gaps</span>
                    <span className="font-bold">3 topics</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Effectiveness</span>
                    <span className="font-bold">94.2%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Correlations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium">Strong Correlations</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <span className="text-sm">Response Time ↔ Satisfaction</span>
                      <span className="font-bold text-green-600">-0.78</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                      <span className="text-sm">Accuracy ↔ Resolution Rate</span>
                      <span className="font-bold text-blue-600">+0.84</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium">Optimization Opportunities</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                      <span className="text-sm">Reduce response time</span>
                      <span className="font-bold text-yellow-600">+15% satisfaction</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                      <span className="text-sm">Improve accuracy</span>
                      <span className="font-bold text-purple-600">+8% resolution</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceMonitor;