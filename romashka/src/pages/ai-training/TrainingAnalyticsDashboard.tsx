import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Brain,
  TrendingUp,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  MessageSquare,
  Settings,
  Download,
  Filter,
  RefreshCw,
  Lightbulb,
  BookOpen,
  Cpu,
  Eye,
  Zap,
  GitBranch,
  PieChart,
  LineChart,
  Activity,
  Award,
  Star,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';

// Import types and services
import { aiTrainingService, TrainingMetrics, LearningInsight, KnowledgeGap } from '../../services/ai/training/aiTrainingService';
import { continuousLearningEngine, LearningUpdate } from '../../services/ai/training/continuousLearningEngine';
import { abTestingEngine, ABTest } from '../../services/ai/training/abTestingEngine';
import { performanceOptimizer, PerformanceAnalytics, ImprovementRecommendation } from '../../services/ai/training/performanceOptimizer';

interface DashboardState {
  trainingMetrics: TrainingMetrics | null;
  learningInsights: LearningInsight[];
  knowledgeGaps: KnowledgeGap[];
  performanceAnalytics: PerformanceAnalytics | null;
  activeTests: ABTest[];
  recommendations: ImprovementRecommendation[];
  learningUpdates: LearningUpdate[];
  isLoading: boolean;
  lastUpdated: Date;
  selectedTimeframe: string;
  selectedMetric: string;
}

const TrainingAnalyticsDashboard: React.FC = () => {
  const [state, setState] = useState<DashboardState>({
    trainingMetrics: null,
    learningInsights: [],
    knowledgeGaps: [],
    performanceAnalytics: null,
    activeTests: [],
    recommendations: [],
    learningUpdates: [],
    isLoading: true,
    lastUpdated: new Date(),
    selectedTimeframe: '30d',
    selectedMetric: 'accuracy',
  });

  useEffect(() => {
    loadDashboardData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [state.selectedTimeframe]);

  const loadDashboardData = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const days = parseInt(state.selectedTimeframe.replace('d', ''));
      
      // Load all analytics data in parallel
      const [
        trainingMetrics,
        learningInsights,
        knowledgeGaps,
        performanceAnalytics,
        activeTests,
        recommendations,
      ] = await Promise.all([
        aiTrainingService.getTrainingMetrics(days),
        aiTrainingService.extractLearningInsights(),
        aiTrainingService.identifyKnowledgeGaps(),
        performanceOptimizer.getPerformanceAnalytics(state.selectedTimeframe),
        abTestingEngine.getActiveTests(),
        performanceOptimizer.generateRecommendations('weekly'),
      ]);

      // Get continuous learning status
      const learningStatus = await continuousLearningEngine.getStatus();
      
      setState(prev => ({
        ...prev,
        trainingMetrics,
        learningInsights,
        knowledgeGaps,
        performanceAnalytics,
        activeTests,
        recommendations,
        learningUpdates: [], // Would get from continuous learning engine
        isLoading: false,
        lastUpdated: new Date(),
      }));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleTimeframeChange = (timeframe: string) => {
    setState(prev => ({ ...prev, selectedTimeframe: timeframe }));
  };

  const handleMetricChange = (metric: string) => {
    setState(prev => ({ ...prev, selectedMetric: metric }));
  };

  const renderOverviewCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">AI Accuracy</p>
            <p className="text-2xl font-bold text-gray-900">
              {state.trainingMetrics ? `${(state.trainingMetrics.avgConfidence * 100).toFixed(1)}%` : '--'}
            </p>
          </div>
          <div className="flex items-center">
            <Target className="h-8 w-8 text-blue-500" />
            {state.trainingMetrics && (
              <div className="ml-2 flex items-center">
                {state.trainingMetrics.improvementTrends.find(t => t.metric === 'AI Confidence')?.trend > 0 ? (
                  <ArrowUp className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-red-500" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Success Rate</p>
            <p className="text-2xl font-bold text-gray-900">
              {state.trainingMetrics ? `${(state.trainingMetrics.successRate * 100).toFixed(1)}%` : '--'}
            </p>
          </div>
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
            {state.trainingMetrics && (
              <div className="ml-2 flex items-center">
                {state.trainingMetrics.successRate > 0.7 ? (
                  <ArrowUp className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-red-500" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Satisfaction</p>
            <p className="text-2xl font-bold text-gray-900">
              {state.trainingMetrics ? `${state.trainingMetrics.avgSatisfaction.toFixed(1)}/5` : '--'}
            </p>
          </div>
          <div className="flex items-center">
            <Star className="h-8 w-8 text-yellow-500" />
            {state.trainingMetrics && (
              <div className="ml-2 flex items-center">
                {state.trainingMetrics.avgSatisfaction > 4 ? (
                  <ArrowUp className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-red-500" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Handoff Rate</p>
            <p className="text-2xl font-bold text-gray-900">
              {state.trainingMetrics ? `${(state.trainingMetrics.handoffRate * 100).toFixed(1)}%` : '--'}
            </p>
          </div>
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-500" />
            {state.trainingMetrics && (
              <div className="ml-2 flex items-center">
                {state.trainingMetrics.handoffRate < 0.3 ? (
                  <ArrowDown className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowUp className="h-4 w-4 text-red-500" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderLearningProgress = () => (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <Brain className="h-6 w-6 mr-2" />
          AI Learning Progress
        </h2>
        <div className="flex items-center space-x-2">
          <select
            value={state.selectedTimeframe}
            onChange={(e) => handleTimeframeChange(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={loadDashboardData}
            disabled={state.isLoading}
            className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${state.isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {state.trainingMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Improvement Trends */}
          <div>
            <h3 className="text-lg font-medium mb-3">Improvement Trends</h3>
            <div className="space-y-3">
              {state.trainingMetrics.improvementTrends.map((trend, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 text-blue-500 mr-2" />
                    <span className="text-sm font-medium">{trend.metric}</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`text-sm font-medium ${trend.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {trend.trend > 0 ? '+' : ''}{trend.trend.toFixed(1)}%
                    </span>
                    {trend.trend > 0 ? (
                      <ArrowUp className="h-4 w-4 text-green-500 ml-1" />
                    ) : trend.trend < 0 ? (
                      <ArrowDown className="h-4 w-4 text-red-500 ml-1" />
                    ) : (
                      <Minus className="h-4 w-4 text-gray-500 ml-1" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Knowledge Usage */}
          <div>
            <h3 className="text-lg font-medium mb-3">Knowledge Usage</h3>
            <div className="space-y-2">
              {Object.entries(state.trainingMetrics.knowledgeUsage)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([knowledge, count]) => (
                  <div key={knowledge} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700 truncate">{knowledge}</span>
                    <span className="text-sm font-medium text-blue-600">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderKnowledgeGaps = () => (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <BookOpen className="h-6 w-6 mr-2" />
        Knowledge Gaps
      </h2>
      
      <div className="space-y-4">
        {state.knowledgeGaps.slice(0, 5).map((gap) => (
          <div key={gap.id} className="border rounded-lg p-4 hover:bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">{gap.topic}</h3>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  gap.priority === 'high' ? 'bg-red-100 text-red-800' :
                  gap.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {gap.priority} priority
                </span>
                <span className="text-sm text-gray-500">
                  {gap.frequency} occurrences
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-2">{gap.suggestedContent}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Impact: {(gap.impact * 100).toFixed(0)}%
              </span>
              <button className="text-sm text-blue-600 hover:text-blue-800">
                Create Content
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLearningInsights = () => (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <Lightbulb className="h-6 w-6 mr-2" />
        Learning Insights
      </h2>
      
      <div className="space-y-4">
        {state.learningInsights.slice(0, 5).map((insight) => (
          <div key={insight.id} className="border rounded-lg p-4 hover:bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">{insight.title}</h3>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  insight.type === 'success_pattern' ? 'bg-green-100 text-green-800' :
                  insight.type === 'failure_pattern' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {insight.type.replace('_', ' ')}
                </span>
                <span className="text-sm text-gray-500">
                  {(insight.confidence * 100).toFixed(0)}% confidence
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Impact: {(insight.impact * 100).toFixed(0)}%
              </span>
              {insight.actionable && (
                <button className="text-sm text-blue-600 hover:text-blue-800">
                  Take Action
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderActiveTests = () => (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <GitBranch className="h-6 w-6 mr-2" />
        Active A/B Tests
      </h2>
      
      <div className="space-y-4">
        {state.activeTests.map((test) => (
          <div key={test.id} className="border rounded-lg p-4 hover:bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">{test.name}</h3>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  test.status === 'active' ? 'bg-green-100 text-green-800' :
                  test.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {test.status}
                </span>
                <span className="text-sm text-gray-500">
                  {test.currentSampleSize}/{test.targetSampleSize}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-2">{test.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {test.variants.length} variants
              </span>
              <button className="text-sm text-blue-600 hover:text-blue-800">
                View Results
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRecommendations = () => (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <Zap className="h-6 w-6 mr-2" />
        Improvement Recommendations
      </h2>
      
      <div className="space-y-4">
        {state.recommendations.slice(0, 5).map((rec) => (
          <div key={rec.id} className="border rounded-lg p-4 hover:bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">{rec.title}</h3>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  rec.priority === 'critical' ? 'bg-red-100 text-red-800' :
                  rec.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                  rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {rec.priority}
                </span>
                <span className="text-sm text-gray-500">
                  {rec.timeframe}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-xs text-gray-500">
                  Impact: {(rec.impact * 100).toFixed(0)}%
                </span>
                <span className="text-xs text-gray-500">
                  Effort: {(rec.effort * 100).toFixed(0)}%
                </span>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-800">
                Implement
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPerformanceAnalytics = () => (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <Activity className="h-6 w-6 mr-2" />
        Performance Analytics
      </h2>
      
      {state.performanceAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Metrics */}
          <div>
            <h3 className="text-lg font-medium mb-3">Key Metrics</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Average Accuracy</span>
                <span className="text-sm text-blue-600">
                  {(state.performanceAnalytics.metrics.averageAccuracy * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Response Quality</span>
                <span className="text-sm text-blue-600">
                  {(state.performanceAnalytics.metrics.responseQuality * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Improvement Rate</span>
                <span className="text-sm text-blue-600">
                  {(state.performanceAnalytics.metrics.improvementRate * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Top Issues */}
          <div>
            <h3 className="text-lg font-medium mb-3">Top Issues</h3>
            <div className="space-y-2">
              {state.performanceAnalytics.topIssues.slice(0, 5).map((issue, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-700">{issue.issue.replace('_', ' ')}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">{issue.frequency}</span>
                    <span className="text-xs text-red-600">
                      {(issue.impact * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (state.isLoading && !state.trainingMetrics) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading training analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Brain className="h-8 w-8 mr-3 text-blue-500" />
              AI Training Analytics
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Last updated: {state.lastUpdated.toLocaleTimeString()}
              </span>
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderOverviewCards()}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            {renderLearningProgress()}
            {renderKnowledgeGaps()}
            {renderActiveTests()}
          </div>
          
          <div className="space-y-8">
            {renderLearningInsights()}
            {renderRecommendations()}
            {renderPerformanceAnalytics()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingAnalyticsDashboard;