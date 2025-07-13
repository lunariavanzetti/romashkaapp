import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  Clock,
  Target,
  Heart,
  Brain,
  Activity,
  Zap,
  AlertCircle,
  CheckCircle,
  XCircle,
  Star,
  Calendar,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { Button } from '../../components/ui';
import OverviewTab from './OverviewTab';
import ConversationsTab from './ConversationsTab';
import AIPerformanceTab from './AIPerformanceTab';

// Enhanced Analytics Types
interface SentimentMetrics {
  positive: number;
  negative: number;
  neutral: number;
  trend: 'up' | 'down' | 'stable';
  averageScore: number;
}

interface PredictiveInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'opportunity' | 'risk';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  timeline: string;
  recommendation: string;
}

interface CustomerJourney {
  stage: string;
  visitors: number;
  conversions: number;
  dropoffRate: number;
  avgTimeSpent: number;
  topIssues: string[];
  sentimentScore: number;
}

interface PerformanceMetrics {
  responseTime: {
    average: number;
    p95: number;
    trend: 'up' | 'down' | 'stable';
  };
  resolutionRate: {
    current: number;
    target: number;
    trend: 'up' | 'down' | 'stable';
  };
  satisfaction: {
    score: number;
    reviews: number;
    trend: 'up' | 'down' | 'stable';
  };
  automation: {
    rate: number;
    saved_hours: number;
    cost_savings: number;
  };
}

const mockSentimentData: SentimentMetrics = {
  positive: 68,
  negative: 12,
  neutral: 20,
  trend: 'up',
  averageScore: 4.2
};

const mockInsights: PredictiveInsight[] = [
  {
    id: '1',
    type: 'opportunity',
    title: 'Response Time Optimization',
    description: 'Average response time decreased by 23% this week. Consider promoting this improvement.',
    confidence: 89,
    impact: 'high',
    timeline: 'This week',
    recommendation: 'Highlight faster response times in marketing materials'
  },
  {
    id: '2',
    type: 'risk',
    title: 'Sentiment Decline in Billing',
    description: 'Negative sentiment in billing-related conversations increased by 15%.',
    confidence: 76,
    impact: 'medium',
    timeline: 'Last 3 days',
    recommendation: 'Review and update billing FAQ and responses'
  },
  {
    id: '3',
    type: 'trend',
    title: 'Evening Peak Usage',
    description: 'Conversation volume peaks at 7-9 PM consistently. Consider staffing adjustments.',
    confidence: 94,
    impact: 'medium',
    timeline: 'Daily pattern',
    recommendation: 'Increase automation rules during peak hours'
  }
];

const mockJourneyData: CustomerJourney[] = [
  {
    stage: 'Discovery',
    visitors: 1250,
    conversions: 890,
    dropoffRate: 28.8,
    avgTimeSpent: 45,
    topIssues: ['Product information', 'Pricing questions'],
    sentimentScore: 4.1
  },
  {
    stage: 'Consideration',
    visitors: 890,
    conversions: 634,
    dropoffRate: 28.7,
    avgTimeSpent: 180,
    topIssues: ['Feature comparisons', 'Integration questions'],
    sentimentScore: 4.0
  },
  {
    stage: 'Decision',
    visitors: 634,
    conversions: 487,
    dropoffRate: 23.2,
    avgTimeSpent: 320,
    topIssues: ['Pricing concerns', 'Trial requests'],
    sentimentScore: 3.9
  },
  {
    stage: 'Onboarding',
    visitors: 487,
    conversions: 423,
    dropoffRate: 13.1,
    avgTimeSpent: 540,
    topIssues: ['Setup help', 'Training questions'],
    sentimentScore: 4.3
  }
];

const mockPerformanceData: PerformanceMetrics = {
  responseTime: {
    average: 2.3,
    p95: 8.1,
    trend: 'down'
  },
  resolutionRate: {
    current: 94,
    target: 95,
    trend: 'up'
  },
  satisfaction: {
    score: 4.6,
    reviews: 1247,
    trend: 'up'
  },
  automation: {
    rate: 76,
    saved_hours: 892,
    cost_savings: 28400
  }
};

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'conversations' | 'ai-performance' | 'sentiment' | 'predictive' | 'journey'>('overview');
  const [timeRange, setTimeRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(false);
  const [sentimentData, setSentimentData] = useState<SentimentMetrics>(mockSentimentData);
  const [insights, setInsights] = useState<PredictiveInsight[]>(mockInsights);
  const [journeyData, setJourneyData] = useState<CustomerJourney[]>(mockJourneyData);
  const [performanceData, setPerformanceData] = useState<PerformanceMetrics>(mockPerformanceData);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Update data here
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <Target className="w-5 h-5 text-green-500" />;
      case 'risk':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'trend':
        return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case 'anomaly':
        return <Zap className="w-5 h-5 text-yellow-500" />;
      default:
        return <Brain className="w-5 h-5 text-gray-500" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-bg-secondary dark:bg-bg-darker">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-button rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-heading font-bold text-primary-deep-blue dark:text-white">
                  Advanced Analytics
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Deep insights, sentiment analysis, and predictive intelligence
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="input-primary"
              >
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              
              <Button
                variant="outline"
                onClick={refreshData}
                loading={isLoading}
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Refresh
              </Button>
              
              <Button
                variant="secondary"
                icon={<Download className="w-4 h-4" />}
              >
                Export
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'conversations', label: 'Conversations', icon: <MessageSquare className="w-4 h-4" /> },
            { id: 'ai-performance', label: 'AI Performance', icon: <Brain className="w-4 h-4" /> },
            { id: 'sentiment', label: 'Sentiment Tracking', icon: <Heart className="w-4 h-4" /> },
            { id: 'predictive', label: 'Predictive Insights', icon: <Target className="w-4 h-4" /> },
            { id: 'journey', label: 'Customer Journey', icon: <Users className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium whitespace-nowrap
                ${activeTab === tab.id 
                  ? 'bg-gradient-button text-white shadow-elevation-1' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <OverviewTab />
            </motion.div>
          )}

          {activeTab === 'conversations' && (
            <motion.div
              key="conversations"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <ConversationsTab />
            </motion.div>
          )}

          {activeTab === 'ai-performance' && (
            <motion.div
              key="ai-performance"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <AIPerformanceTab />
            </motion.div>
          )}

          {activeTab === 'sentiment' && (
            <motion.div
              key="sentiment"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Sentiment Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass-card p-6 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Heart className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Positive</p>
                      <p className="text-2xl font-bold text-green-600">{sentimentData.positive}%</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${sentimentData.positive}%` }}
                    />
                  </div>
                </div>

                <div className="glass-card p-6 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Activity className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Neutral</p>
                      <p className="text-2xl font-bold text-gray-600">{sentimentData.neutral}%</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gray-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${sentimentData.neutral}%` }}
                    />
                  </div>
                </div>

                <div className="glass-card p-6 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <XCircle className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Negative</p>
                      <p className="text-2xl font-bold text-red-600">{sentimentData.negative}%</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${sentimentData.negative}%` }}
                    />
                  </div>
                </div>

                <div className="glass-card p-6 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Star className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Avg Score</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-blue-600">{sentimentData.averageScore}</p>
                        {getTrendIcon(sentimentData.trend)}
                      </div>
                    </div>
                  </div>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= sentimentData.averageScore
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Detailed Sentiment Analysis */}
              <div className="glass-card p-6 rounded-xl">
                <h3 className="text-lg font-heading font-semibold text-primary-deep-blue dark:text-white mb-4">
                  Sentiment Analysis Over Time
                </h3>
                <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">Sentiment trend chart would be rendered here</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'predictive' && (
            <motion.div
              key="predictive"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Predictive Insights */}
              <div className="space-y-4">
                {insights.map(insight => (
                  <div key={insight.id} className="glass-card p-6 rounded-xl">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {getInsightIcon(insight.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {insight.title}
                          </h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            insight.impact === 'high' ? 'bg-red-100 text-red-800' :
                            insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {insight.impact} impact
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-3">
                          {insight.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>
                            Confidence: <span className={getConfidenceColor(insight.confidence)}>
                              {insight.confidence}%
                            </span>
                          </span>
                          <span>Timeline: {insight.timeline}</span>
                        </div>
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>Recommendation:</strong> {insight.recommendation}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'journey' && (
            <motion.div
              key="journey"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Customer Journey Map */}
              <div className="glass-card p-6 rounded-xl">
                <h3 className="text-lg font-heading font-semibold text-primary-deep-blue dark:text-white mb-6">
                  Customer Journey Analysis
                </h3>
                
                <div className="space-y-4">
                  {journeyData.map((stage, index) => (
                    <div key={stage.stage} className="relative">
                      <div className="flex items-center gap-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-gradient-button rounded-full flex items-center justify-center text-white font-bold">
                            {index + 1}
                          </div>
                        </div>
                        
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {stage.stage}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {stage.visitors} visitors
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Conversions</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {stage.conversions}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Drop-off Rate</p>
                            <p className="font-medium text-red-600">
                              {stage.dropoffRate}%
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Avg Time</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {stage.avgTimeSpent}s
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Sentiment</p>
                            <div className="flex items-center gap-1">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {stage.sentimentScore}
                              </p>
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {index < journeyData.length - 1 && (
                        <div className="flex justify-center py-2">
                          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 