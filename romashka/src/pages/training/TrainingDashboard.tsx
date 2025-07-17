import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  Target, 
  Zap, 
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  FileText,
  Upload,
  Play,
  Pause,
  Download,
  Settings,
  Eye,
  RefreshCw,
  Sparkles
} from 'lucide-react';

import { Button } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { AITrainingService } from '../../services/templates/aiTrainingService';
import { aiTrainingService } from '../../services/ai/training/aiTrainingService';
import ConversationManager from './components/ConversationManager';
import FileUploader from './components/FileUploader';
import PerformanceAnalytics from './components/PerformanceAnalytics';

interface TrainingSession {
  id: string;
  type: 'conversation_analysis' | 'template_optimization' | 'performance_tracking' | 'knowledge_update';
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  results?: {
    accuracyImprovement: number;
    knowledgeGapsFound: number;
    optimizationSuggestions: number;
    processedConversations: number;
  };
  createdAt: string;
  completedAt?: string;
  error?: string;
}

interface TrainingStats {
  totalConversations: number;
  processedConversations: number;
  accuracyScore: number;
  knowledgeGaps: number;
  optimizationOpportunities: number;
  averageResponseTime: number;
  customerSatisfaction: number;
  successRate: number;
}

const TrainingDashboard: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [stats, setStats] = useState<TrainingStats>({
    totalConversations: 0,
    processedConversations: 0,
    accuracyScore: 0,
    knowledgeGaps: 0,
    optimizationOpportunities: 0,
    averageResponseTime: 0,
    customerSatisfaction: 0,
    successRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'conversations' | 'files' | 'analytics'>('overview');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);

  // Training service instance
  const trainingService = new AITrainingService();

  useEffect(() => {
    if (user) {
      loadTrainingData();
      // Set up real-time updates
      const interval = setInterval(loadTrainingData, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadTrainingData = async () => {
    try {
      setLoading(true);
      
      // Load training sessions
      const sessionsData = await trainingService.getTrainingSessions(user!.id, 10);
      setSessions(sessionsData);

      // Load training statistics
      const statsData = await aiTrainingService.getTrainingStats();
      setStats(statsData);

    } catch (error) {
      console.error('Error loading training data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startTrainingSession = async (type: TrainingSession['type'], dataSourceIds: string[]) => {
    try {
      const session = await trainingService.startTrainingSession(type, dataSourceIds);
      setSessions(prev => [session, ...prev]);
      
      // Start polling for updates
      pollSessionStatus(session.id);
    } catch (error) {
      console.error('Error starting training session:', error);
    }
  };

  const pollSessionStatus = (sessionId: string) => {
    const interval = setInterval(async () => {
      try {
        const session = await trainingService.getTrainingProgress(sessionId);
        setSessions(prev => prev.map(s => s.id === sessionId ? session : s));
        
        if (session.status === 'completed' || session.status === 'failed') {
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Error polling session status:', error);
        clearInterval(interval);
      }
    }, 2000);
  };

  const handleDatasetUpload = async (files: File[], dataType: 'conversations' | 'faq' | 'knowledge') => {
    try {
      const dataset = await trainingService.uploadTrainingData(files, dataType);
      setSelectedDataset(dataset.id);
      setShowUploadModal(false);
      
      // Automatically start analysis
      await startTrainingSession('conversation_analysis', [dataset.id]);
    } catch (error) {
      console.error('Error uploading dataset:', error);
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Training Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">AI Accuracy</p>
                <p className="text-2xl font-bold text-gray-900">{stats.accuracyScore.toFixed(1)}%</p>
              </div>
            </div>
            <div className="text-sm text-green-600">
              ↑ +{Math.max(0, stats.accuracyScore - 85).toFixed(1)}%
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${stats.accuracyScore}%` }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.successRate.toFixed(1)}%</p>
              </div>
            </div>
            <div className="text-sm text-green-600">
              ↑ +{Math.max(0, stats.successRate - 80).toFixed(1)}%
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${stats.successRate}%` }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Conversations</p>
                <p className="text-2xl font-bold text-gray-900">{stats.processedConversations.toLocaleString()}</p>
              </div>
            </div>
            <div className="text-sm text-purple-600">
              {stats.totalConversations.toLocaleString()} total
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(stats.processedConversations / stats.totalConversations) * 100}%` }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Knowledge Gaps</p>
                <p className="text-2xl font-bold text-gray-900">{stats.knowledgeGaps}</p>
              </div>
            </div>
            <div className="text-sm text-orange-600">
              {stats.optimizationOpportunities} opportunities
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Areas needing improvement
          </div>
        </motion.div>
      </div>

      {/* Active Training Sessions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Active Training Sessions</h3>
          <Button 
            onClick={() => setShowUploadModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Data
          </Button>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-8">
            <Brain className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Training Sessions</h4>
            <p className="text-gray-600 mb-4">
              Start by uploading conversation data or analyzing existing conversations
            </p>
            <Button 
              onClick={() => setShowUploadModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Training Data
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      session.status === 'completed' ? 'bg-green-100 text-green-600' :
                      session.status === 'running' ? 'bg-blue-100 text-blue-600' :
                      session.status === 'failed' ? 'bg-red-100 text-red-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {session.status === 'completed' ? <CheckCircle className="w-4 h-4" /> :
                       session.status === 'running' ? <RefreshCw className="w-4 h-4 animate-spin" /> :
                       session.status === 'failed' ? <AlertCircle className="w-4 h-4" /> :
                       <Clock className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {session.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Started {new Date(session.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {session.status === 'running' ? `${session.progress}%` : session.status}
                    </div>
                    {session.results && (
                      <div className="text-xs text-gray-600">
                        {session.results.processedConversations} conversations processed
                      </div>
                    )}
                  </div>
                </div>
                
                {session.status === 'running' && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${session.progress}%` }}
                    />
                  </div>
                )}

                {session.results && (
                  <div className="grid grid-cols-4 gap-4 mt-3 pt-3 border-t">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">
                        +{session.results.accuracyImprovement.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-600">Accuracy</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-orange-600">
                        {session.results.knowledgeGapsFound}
                      </div>
                      <div className="text-xs text-gray-600">Knowledge Gaps</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-purple-600">
                        {session.results.optimizationSuggestions}
                      </div>
                      <div className="text-xs text-gray-600">Suggestions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">
                        {session.results.processedConversations}
                      </div>
                      <div className="text-xs text-gray-600">Conversations</div>
                    </div>
                  </div>
                )}

                {session.error && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-800">{session.error}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            onClick={() => startTrainingSession('conversation_analysis', [])}
            className="flex items-center justify-center p-4 bg-blue-50 text-blue-700 hover:bg-blue-100"
            variant="outline"
          >
            <Brain className="w-5 h-5 mr-2" />
            Analyze Conversations
          </Button>
          <Button
            onClick={() => startTrainingSession('template_optimization', [])}
            className="flex items-center justify-center p-4 bg-green-50 text-green-700 hover:bg-green-100"
            variant="outline"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Optimize Templates
          </Button>
          <Button
            onClick={() => startTrainingSession('performance_tracking', [])}
            className="flex items-center justify-center p-4 bg-purple-50 text-purple-700 hover:bg-purple-100"
            variant="outline"
          >
            <BarChart3 className="w-5 h-5 mr-2" />
            Track Performance
          </Button>
          <Button
            onClick={() => startTrainingSession('knowledge_update', [])}
            className="flex items-center justify-center p-4 bg-orange-50 text-orange-700 hover:bg-orange-100"
            variant="outline"
          >
            <FileText className="w-5 h-5 mr-2" />
            Update Knowledge
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">AI Training System</h1>
                  <p className="text-sm text-gray-600">
                    Train and optimize your AI assistant with conversation data
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={loadTrainingData}
                variant="outline"
                className="text-gray-600 hover:text-gray-900"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={() => setShowUploadModal(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Data
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'conversations', label: 'Conversations', icon: Users },
              { id: 'files', label: 'Files', icon: FileText },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mr-3" />
            <span className="text-gray-600">Loading training data...</span>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'conversations' && (
              <ConversationManager 
                onAnalyze={(conversationIds) => startTrainingSession('conversation_analysis', conversationIds)}
              />
            )}
            {activeTab === 'files' && (
              <FileUploader 
                onUpload={handleDatasetUpload}
                supportedTypes={['conversations', 'faq', 'knowledge']}
              />
            )}
            {activeTab === 'analytics' && (
              <PerformanceAnalytics 
                stats={stats}
                sessions={sessions}
              />
            )}
          </>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Training Data</h3>
            <FileUploader 
              onUpload={handleDatasetUpload}
              supportedTypes={['conversations', 'faq', 'knowledge']}
              onClose={() => setShowUploadModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingDashboard;