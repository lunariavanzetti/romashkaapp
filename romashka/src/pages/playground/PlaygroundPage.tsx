import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { 
  MessageSquare, 
  Settings, 
  BarChart3, 
  RotateCcw, 
  Download, 
  Send,
  Bot,
  User,
  Clock,
  Brain,
  Target,
  Activity,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Lightbulb
} from 'lucide-react';
import type { 
  PlaygroundConfig, 
  PlaygroundConversation, 
  PlaygroundSession, 
  LivePlaygroundMetrics,
  PerformanceAnalysis,
  TestResponse
} from '../../types/playground';
import playgroundService from '../../services/playgroundService';

const PlaygroundPage: React.FC = () => {
  const [session, setSession] = useState<PlaygroundSession | null>(null);
  const [config, setConfig] = useState<PlaygroundConfig>({
    botPersonality: 'helpful',
    welcomeMessage: 'Hi! How can I help you today?',
    language: 'en',
    knowledgeBaseIds: [],
    workflows: [],
    responseStyle: 'professional',
    tone: 'formal',
    fallbackBehavior: 'escalate',
    customPrompts: {},
    integrationSettings: {
      enableAnalytics: true,
      enableSentiment: true,
      enableIntentDetection: true,
      enableKnowledgeTracking: true
    },
    advancedSettings: {
      maxResponseTime: 5000,
      confidenceThreshold: 0.7,
      enableContextMemory: true,
      maxContextTurns: 5,
      enablePersonalization: false
    }
  });
  const [conversations, setConversations] = useState<PlaygroundConversation[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState<LivePlaygroundMetrics | null>(null);
  const [performance, setPerformance] = useState<PerformanceAnalysis | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // Initialize session
  useEffect(() => {
    const initSession = async () => {
      try {
        const sessionId = await playgroundService.createSession(config, 'New Session');
        const newSession: PlaygroundSession = {
          id: sessionId,
          sessionName: 'New Session',
          config,
          conversations: [],
          scenarios: [],
          performance: {
            avgResponseTime: 0,
            avgConfidence: 0,
            knowledgeCoverage: 0,
            totalMessages: 0,
            successfulResponses: 0,
            escalationRate: 0,
            avgSatisfactionRating: 0,
            sentimentDistribution: { positive: 0, negative: 0, neutral: 0 },
            intentAccuracy: 0,
            popularIntents: [],
            knowledgeGaps: []
          },
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastActivityAt: new Date().toISOString()
        };
        setSession(newSession);
        setIsSessionActive(true);
      } catch (error) {
        console.error('Error initializing session:', error);
      }
    };

    initSession();
  }, []);

  // Update live metrics
  useEffect(() => {
    if (!session) return;

    const updateMetrics = async () => {
      try {
        const metrics = await playgroundService.getLiveMetrics(session.id);
        setLiveMetrics(metrics);
        
        const perf = await playgroundService.analyzePerformance(session.id);
        setPerformance(perf);
      } catch (error) {
        console.error('Error updating metrics:', error);
      }
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);
    return () => clearInterval(interval);
  }, [session]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !session || isLoading) return;

    setIsLoading(true);
    setIsTyping(true);
    
    try {
      const response: TestResponse = await playgroundService.sendTestMessage(session.id, currentMessage);
      
      const newConversation: PlaygroundConversation = {
        id: crypto.randomUUID(),
        user: currentMessage,
        bot: response.message,
        timestamp: new Date().toISOString(),
        confidence: response.confidence,
        knowledgeSources: response.knowledgeSources,
        responseTimeMs: response.responseTimeMs,
        sentiment: response.sentiment,
        intent: response.intent,
        intentConfidence: response.intentConfidence,
        contextUsed: response.contextUsed,
        escalated: !!response.escalationReason,
        metadata: response.metadata
      };

      setConversations(prev => [...prev, newConversation]);
      setCurrentMessage('');
      
      const updatedHistory = await playgroundService.getSessionHistory(session.id);
      setConversations(updatedHistory);
      
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleResetSession = async () => {
    if (!session) return;

    try {
      await playgroundService.resetSession(session.id);
      setConversations([]);
    } catch (error) {
      console.error('Error resetting session:', error);
    }
  };

  const handleExportSession = async () => {
    if (!session) return;

    try {
      const exportData = await playgroundService.exportSession(session.id);
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `playground-session-${session.id}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting session:', error);
    }
  };

  const handleUpdateConfig = async (newConfig: Partial<PlaygroundConfig>) => {
    if (!session) return;

    try {
      await playgroundService.updateBotConfiguration(session.id, newConfig);
      setConfig(prev => ({ ...prev, ...newConfig }));
    } catch (error) {
      console.error('Error updating config:', error);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <ThumbsUp className="h-4 w-4 text-green-500" />;
      case 'negative':
        return <ThumbsDown className="h-4 w-4 text-red-500" />;
      default:
        return <MessageCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Bot className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Playground</h1>
                <p className="text-sm text-gray-500">
                  {session ? `Session: ${session.sessionName}` : 'Loading...'}
                </p>
              </div>
            </div>
            <Badge variant={isSessionActive ? "default" : "secondary"}>
              {isSessionActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleResetSession}
              variant="outline"
              disabled={!session}
              className="flex items-center space-x-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset</span>
            </Button>
            <Button
              onClick={handleExportSession}
              variant="outline"
              disabled={!session}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Panel - Bot Configuration */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Settings className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold">Bot Configuration</h2>
            </div>

            {/* Simple Tab Navigation */}
            <div className="mb-6">
              <div className="flex space-x-1 border-b border-gray-200">
                {['basic', 'advanced', 'integrations'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-2 text-sm font-medium capitalize rounded-t-lg ${
                      activeTab === tab
                        ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-4">
              {activeTab === 'basic' && (
                <>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Bot Personality
                    </label>
                    <input
                      type="text"
                      value={config.botPersonality}
                      onChange={(e) => handleUpdateConfig({ botPersonality: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., helpful, friendly, professional"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Welcome Message
                    </label>
                    <textarea
                      value={config.welcomeMessage}
                      onChange={(e) => handleUpdateConfig({ welcomeMessage: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter welcome message..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Response Style
                    </label>
                    <select
                      value={config.responseStyle}
                      onChange={(e) => handleUpdateConfig({ responseStyle: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="professional">Professional</option>
                      <option value="casual">Casual</option>
                      <option value="friendly">Friendly</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Tone
                    </label>
                    <select
                      value={config.tone}
                      onChange={(e) => handleUpdateConfig({ tone: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="formal">Formal</option>
                      <option value="informal">Informal</option>
                      <option value="empathetic">Empathetic</option>
                      <option value="authoritative">Authoritative</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Language
                    </label>
                    <select
                      value={config.language}
                      onChange={(e) => handleUpdateConfig({ language: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                </>
              )}

              {activeTab === 'advanced' && (
                <>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Confidence Threshold
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={config.advancedSettings.confidenceThreshold}
                      onChange={(e) => handleUpdateConfig({
                        advancedSettings: {
                          ...config.advancedSettings,
                          confidenceThreshold: parseFloat(e.target.value)
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Max Response Time (ms)
                    </label>
                    <input
                      type="number"
                      min="1000"
                      max="10000"
                      step="500"
                      value={config.advancedSettings.maxResponseTime}
                      onChange={(e) => handleUpdateConfig({
                        advancedSettings: {
                          ...config.advancedSettings,
                          maxResponseTime: parseInt(e.target.value)
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Max Context Turns
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={config.advancedSettings.maxContextTurns}
                      onChange={(e) => handleUpdateConfig({
                        advancedSettings: {
                          ...config.advancedSettings,
                          maxContextTurns: parseInt(e.target.value)
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="enableContextMemory"
                      checked={config.advancedSettings.enableContextMemory}
                      onChange={(e) => handleUpdateConfig({
                        advancedSettings: {
                          ...config.advancedSettings,
                          enableContextMemory: e.target.checked
                        }
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="enableContextMemory" className="text-sm text-gray-700">
                      Enable Context Memory
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="enablePersonalization"
                      checked={config.advancedSettings.enablePersonalization}
                      onChange={(e) => handleUpdateConfig({
                        advancedSettings: {
                          ...config.advancedSettings,
                          enablePersonalization: e.target.checked
                        }
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="enablePersonalization" className="text-sm text-gray-700">
                      Enable Personalization
                    </label>
                  </div>
                </>
              )}

              {activeTab === 'integrations' && (
                <>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="enableAnalytics"
                      checked={config.integrationSettings.enableAnalytics}
                      onChange={(e) => handleUpdateConfig({
                        integrationSettings: {
                          ...config.integrationSettings,
                          enableAnalytics: e.target.checked
                        }
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="enableAnalytics" className="text-sm text-gray-700">
                      Enable Analytics
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="enableSentiment"
                      checked={config.integrationSettings.enableSentiment}
                      onChange={(e) => handleUpdateConfig({
                        integrationSettings: {
                          ...config.integrationSettings,
                          enableSentiment: e.target.checked
                        }
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="enableSentiment" className="text-sm text-gray-700">
                      Enable Sentiment Analysis
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="enableIntentDetection"
                      checked={config.integrationSettings.enableIntentDetection}
                      onChange={(e) => handleUpdateConfig({
                        integrationSettings: {
                          ...config.integrationSettings,
                          enableIntentDetection: e.target.checked
                        }
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="enableIntentDetection" className="text-sm text-gray-700">
                      Enable Intent Detection
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="enableKnowledgeTracking"
                      checked={config.integrationSettings.enableKnowledgeTracking}
                      onChange={(e) => handleUpdateConfig({
                        integrationSettings: {
                          ...config.integrationSettings,
                          enableKnowledgeTracking: e.target.checked
                        }
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="enableKnowledgeTracking" className="text-sm text-gray-700">
                      Enable Knowledge Tracking
                    </label>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Center Panel - Chat Interface */}
        <div className="flex-1 flex flex-col bg-white">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {conversations.length === 0 ? (
                <div className="text-center py-12">
                  <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Start Testing</h3>
                  <p className="text-gray-500">Send a message to test your AI bot configuration</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <div key={conv.id} className="space-y-4">
                    {/* User Message */}
                    <div className="flex justify-end">
                      <div className="bg-blue-500 text-white rounded-lg px-4 py-2 max-w-xs lg:max-w-md">
                        <div className="flex items-center space-x-2 mb-1">
                          <User className="h-4 w-4" />
                          <span className="text-xs opacity-75">You</span>
                        </div>
                        <p>{conv.user}</p>
                      </div>
                    </div>

                    {/* Bot Response */}
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-xs lg:max-w-md">
                        <div className="flex items-center space-x-2 mb-1">
                          <Bot className="h-4 w-4" />
                          <span className="text-xs text-gray-500">AI Assistant</span>
                          <div className="flex items-center space-x-1">
                            <span className={`text-xs ${getConfidenceColor(conv.confidence || 0)}`}>
                              {Math.round((conv.confidence || 0) * 100)}%
                            </span>
                            {getSentimentIcon(conv.sentiment || 'neutral')}
                          </div>
                        </div>
                        <p>{conv.bot}</p>
                        
                        {/* Response Metadata */}
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatTime(conv.responseTimeMs || 0)}</span>
                            </div>
                            {conv.intent && (
                              <div className="flex items-center space-x-1">
                                <Target className="h-3 w-3" />
                                <span>{conv.intent}</span>
                              </div>
                            )}
                            {conv.contextUsed && (
                              <div className="flex items-center space-x-1">
                                <Brain className="h-3 w-3" />
                                <span>Context</span>
                              </div>
                            )}
                          </div>
                          {conv.knowledgeSources && conv.knowledgeSources.length > 0 && (
                            <div className="mt-1">
                              <div className="text-xs text-gray-500 mb-1">Knowledge Sources:</div>
                              <div className="flex flex-wrap gap-1">
                                {conv.knowledgeSources.map((source, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {source}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <Bot className="h-4 w-4" />
                      <span className="text-xs text-gray-500">AI Assistant is typing</span>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Message Input */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="Type your message..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isLoading}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!currentMessage.trim() || isLoading}
                className="flex items-center space-x-2"
              >
                {isLoading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Panel - Analytics */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-6">
              <BarChart3 className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold">Real-time Analytics</h2>
            </div>

            <div className="space-y-6">
              {/* Live Metrics */}
              {liveMetrics && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium mb-3">Live Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Active Conversations</span>
                      </div>
                      <span className="text-sm font-medium">{liveMetrics.activeConversations}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">Avg Response Time</span>
                      </div>
                      <span className="text-sm font-medium">{formatTime(liveMetrics.avgResponseTime)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Brain className="h-4 w-4 text-purple-500" />
                        <span className="text-sm">Current Confidence</span>
                      </div>
                      <span className={`text-sm font-medium ${getConfidenceColor(liveMetrics.currentConfidence)}`}>
                        {Math.round(liveMetrics.currentConfidence * 100)}%
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MessageCircle className="h-4 w-4 text-orange-500" />
                        <span className="text-sm">Messages/Min</span>
                      </div>
                      <span className="text-sm font-medium">{liveMetrics.messagesPerMinute.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Summary */}
              {performance && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium mb-3">Performance Summary</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Messages</span>
                      <span className="text-sm font-medium">{performance.totalMessages}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Success Rate</span>
                      <span className="text-sm font-medium text-green-600">
                        {performance.totalMessages > 0 
                          ? Math.round((performance.successfulResponses / performance.totalMessages) * 100)
                          : 0}%
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Knowledge Coverage</span>
                      <span className="text-sm font-medium">{Math.round(performance.knowledgeCoverage)}%</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Escalation Rate</span>
                      <span className="text-sm font-medium text-red-600">
                        {Math.round(performance.escalationRate)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Sentiment Distribution */}
              {performance && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium mb-3">Sentiment Distribution</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <ThumbsUp className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Positive</span>
                      </div>
                      <span className="text-sm font-medium">{performance.sentimentDistribution.positive}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MessageCircle className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">Neutral</span>
                      </div>
                      <span className="text-sm font-medium">{performance.sentimentDistribution.neutral}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <ThumbsDown className="h-4 w-4 text-red-500" />
                        <span className="text-sm">Negative</span>
                      </div>
                      <span className="text-sm font-medium">{performance.sentimentDistribution.negative}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Popular Intents */}
              {performance && performance.popularIntents.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium mb-3">Popular Intents</h3>
                  <div className="space-y-2">
                    {performance.popularIntents.slice(0, 5).map((intent, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{intent.intent}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">{intent.count}</span>
                          <span className={`text-xs ${getConfidenceColor(intent.confidence)}`}>
                            {Math.round(intent.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Knowledge Gaps */}
              {performance && performance.knowledgeGaps.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium mb-3">Knowledge Gaps</h3>
                  <div className="space-y-2">
                    {performance.knowledgeGaps.slice(0, 3).map((gap, index) => (
                      <div key={index} className="p-2 bg-yellow-50 rounded">
                        <div className="flex items-center space-x-2">
                          <Lightbulb className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium">{gap.count}x</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{gap.query}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaygroundPage; 