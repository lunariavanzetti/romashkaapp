import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { 
  Brain, TrendingUp, Target, Users, BookOpen, Zap, AlertTriangle, 
  CheckCircle, Clock, ThumbsUp, MessageSquare, BarChart3, Settings
} from 'lucide-react';

import { aiTrainingService } from '../../services/ai/training/aiTrainingService';
import { continuousLearningEngine } from '../../services/ai/training/continuousLearningEngine';
import { performanceOptimizer } from '../../services/ai/training/performanceOptimizer';
import { abTestingEngine } from '../../services/ai/training/abTestingEngine';

interface TrainingDashboardData {
  learningMetrics: any;
  performanceData: any;
  recommendations: any[];
  knowledgeGaps: any[];
  patterns: any[];
  activeTests: any[];
}

const AITrainingDashboard: React.FC = () => {
  const [data, setData] = useState<TrainingDashboardData>({
    learningMetrics: null,
    performanceData: null,
    recommendations: [],
    knowledgeGaps: [],
    patterns: [],
    activeTests: []
  });
  const [loading, setLoading] = useState(true);
  const [isLearningActive, setIsLearningActive] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [
        learningMetrics,
        performanceData,
        recommendations,
        knowledgeGaps,
        patterns,
        activeTests
      ] = await Promise.all([
        continuousLearningEngine.getLearningMetrics(),
        performanceOptimizer.getPerformanceDashboard(),
        aiTrainingService.generateTrainingRecommendations(),
        aiTrainingService.identifyKnowledgeGaps(),
        continuousLearningEngine.identifyPatterns(),
        abTestingEngine.getActiveTests()
      ]);

      setData({
        learningMetrics,
        performanceData,
        recommendations,
        knowledgeGaps,
        patterns,
        activeTests
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startLearning = async () => {
    try {
      await continuousLearningEngine.startLearning();
      await performanceOptimizer.startOptimization();
      setIsLearningActive(true);
    } catch (error) {
      console.error('Error starting learning:', error);
    }
  };

  const stopLearning = async () => {
    try {
      continuousLearningEngine.stopLearning();
      performanceOptimizer.stopOptimization();
      setIsLearningActive(false);
    } catch (error) {
      console.error('Error stopping learning:', error);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingUp className="w-4 h-4 text-red-500 transform rotate-180" />;
      default: return <TrendingUp className="w-4 h-4 text-gray-500 transform rotate-90" />;
    }
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
          <h1 className="text-3xl font-bold text-gray-900">AI Training & Learning</h1>
          <p className="text-gray-600">Monitor and optimize AI performance across all channels</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={isLearningActive ? stopLearning : startLearning}
            variant={isLearningActive ? "destructive" : "default"}
            className="flex items-center space-x-2"
          >
            <Brain className="w-4 h-4" />
            <span>{isLearningActive ? 'Stop Learning' : 'Start Learning'}</span>
          </Button>
          <Button variant="outline" onClick={loadDashboardData}>
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Learning Status */}
      {isLearningActive && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="animate-pulse w-2 h-2 bg-blue-600 rounded-full"></div>
              <span className="text-blue-800 font-medium">Continuous learning active</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Velocity</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.learningMetrics?.learningVelocity?.toFixed(2) || 0}
            </div>
            <p className="text-xs text-muted-foreground">patterns/hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Model Accuracy</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.performanceData?.summary?.keyMetrics?.accuracy?.toFixed(1) || 0}%
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {getTrendIcon(data.performanceData?.trends?.accuracy?.trend)}
              <span>{data.performanceData?.trends?.accuracy?.changePercent?.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction Score</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.performanceData?.summary?.keyMetrics?.satisfaction?.toFixed(1) || 0}
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {getTrendIcon(data.performanceData?.trends?.satisfaction?.trend)}
              <span>{data.performanceData?.trends?.satisfaction?.changePercent?.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Knowledge Gaps</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.knowledgeGaps?.length || 0}</div>
            <p className="text-xs text-muted-foreground">identified gaps</p>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5" />
            <span>System Health Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Health</span>
                <Badge 
                  variant={data.performanceData?.summary?.overallHealth === 'excellent' ? 'default' : 'secondary'}
                  className={getHealthColor(data.performanceData?.summary?.overallHealth)}
                >
                  {data.performanceData?.summary?.overallHealth || 'Unknown'}
                </Badge>
              </div>
              <Progress value={data.performanceData?.summary?.keyMetrics?.accuracy || 0} className="w-full" />
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Active Tests</h4>
              <div className="text-2xl font-bold">{data.activeTests?.length || 0}</div>
              <p className="text-xs text-muted-foreground">A/B tests running</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Learning Updates</h4>
              <div className="text-2xl font-bold">{data.learningMetrics?.knowledgeUpdates || 0}</div>
              <p className="text-xs text-muted-foreground">this week</p>
            </div>
          </div>

          {/* Alerts */}
          {data.performanceData?.summary?.alerts?.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
              <h4 className="flex items-center space-x-2 text-sm font-medium text-yellow-800 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Active Alerts</span>
              </h4>
              <div className="space-y-1">
                {data.performanceData.summary.alerts.map((alert: string, index: number) => (
                  <p key={index} className="text-sm text-yellow-700">{alert}</p>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="learning">Learning</TabsTrigger>
          <TabsTrigger value="testing">A/B Testing</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.performanceData?.metrics || []}>
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
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resolution Rates</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.performanceData?.metrics || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="resolution_rate" fill="#8884d8" name="Resolution Rate" />
                    <Bar dataKey="escalation_rate" fill="#ff8042" name="Escalation Rate" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Learning Tab */}
        <TabsContent value="learning" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Learning Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.patterns?.slice(0, 5).map((pattern: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{pattern.pattern}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {pattern.category}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            Frequency: {pattern.frequency}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{pattern.confidence}%</div>
                        <div className="text-xs text-gray-500">confidence</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Knowledge Gaps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.knowledgeGaps?.slice(0, 5).map((gap: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{gap.topic}</p>
                        <p className="text-xs text-gray-600 mt-1">{gap.suggestedContent}</p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={gap.priority === 'high' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {gap.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* A/B Testing Tab */}
        <TabsContent value="testing" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Tests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.activeTests?.map((test: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{test.name}</h4>
                        <Badge variant="outline">{test.type}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{test.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Variants: {test.variants?.length || 0}</span>
                        <span>Traffic: {test.trafficAllocation * 100}%</span>
                        <span>Started: {new Date(test.startDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                  {data.activeTests?.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No active A/B tests</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Test Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.activeTests?.map((test: any, index: number) => (
                    <div key={index} className="space-y-2">
                      <h4 className="font-medium text-sm">{test.name}</h4>
                      {test.variants?.map((variant: any, vIndex: number) => (
                        <div key={vIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{variant.name}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                              {variant.metrics?.conversionRate?.toFixed(1) || 0}%
                            </span>
                            <Progress 
                              value={variant.metrics?.conversionRate || 0} 
                              className="w-20 h-2"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Optimization Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.recommendations?.slice(0, 5).map((rec: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{rec.title}</h4>
                        <Badge 
                          variant={rec.priority === 'high' ? 'destructive' : 'secondary'}
                        >
                          {rec.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Impact: {rec.impact}/10</span>
                        <span>Effort: {rec.effort}/10</span>
                        <span>ROI: {rec.expectedImprovement}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quality Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.performanceData?.assessments?.slice(0, 5).map((assessment: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium">Conversation Quality</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500">
                            Accuracy: {assessment.accuracy_score}%
                          </span>
                          <span className="text-xs text-gray-500">
                            Satisfaction: {assessment.satisfaction_score}%
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{assessment.overall_score}%</div>
                        <div className="text-xs text-gray-500">overall</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Learning Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Learning Velocity</h4>
                  <p className="text-sm text-blue-700">
                    AI is learning at {data.learningMetrics?.learningVelocity?.toFixed(2) || 0} patterns per hour
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Improvement Rate</h4>
                  <p className="text-sm text-green-700">
                    {data.learningMetrics?.improvementRate?.toFixed(1) || 0}% improvement from recent updates
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-2">Confidence Level</h4>
                  <p className="text-sm text-purple-700">
                    Average confidence: {data.learningMetrics?.averageConfidence?.toFixed(1) || 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AITrainingDashboard;