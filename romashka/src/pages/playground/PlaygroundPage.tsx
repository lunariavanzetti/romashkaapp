import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui';
import { 
  Bot, 
  MessageSquare, 
  Settings, 
  TestTube, 
  Palette, 
  Zap,
  Play,
  Pause,
  RotateCcw,
  Save,
  Download,
  Upload,
  Eye,
  BarChart3,
  Users,
  Brain,
  Heart,
  Volume2,
  Sliders,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { 
  BotConfiguration, 
  PersonalityTraits, 
  ResponseStyle,
  TestScenario,
  BotConfigFormData,
  PlaygroundAIResponse,
  BotPerformanceMetrics,
  PlaygroundABTest,
  TestScenarioResult,
  PlaygroundConversation
} from '../../types/playground';
import { botConfigurationService } from '../../services/botConfigurationService';
import { playgroundAIService } from '../../services/playgroundAIService';
import { testScenarioService } from '../../services/testScenarioService';
import { abTestingService } from '../../services/abTestingService';

// Legacy interface for backward compatibility
interface BotPersonality {
  name: string;
  avatar: string;
  tone: 'professional' | 'friendly' | 'casual' | 'enthusiastic' | 'formal';
  formality: number; // 0-100
  enthusiasm: number; // 0-100
  technicality: number; // 0-100
  empathy: number; // 0-100
  responseStyle: 'concise' | 'detailed' | 'conversational';
  language: string;
  specialties: string[];
  brandAlignment: {
    useCompanyVoice: boolean;
    brandKeywords: string[];
    avoidPhrases: string[];
  };
}

interface TestScenario {
  id: string;
  name: string;
  description: string;
  userMessages: string[];
  expectedOutcomes: string[];
  isActive: boolean;
}

interface ABTestConfig {
  id: string;
  name: string;
  description: string;
  variants: {
    id: string;
    name: string;
    personality: Partial<BotPersonality>;
    weight: number;
  }[];
  metrics: {
    responseTime: number;
    satisfaction: number;
    conversions: number;
  };
  isRunning: boolean;
}

const defaultPersonality: BotPersonality = {
  name: 'ROMASHKA Assistant',
  avatar: '🤖',
  tone: 'professional',
  formality: 70,
  enthusiasm: 60,
  technicality: 50,
  empathy: 80,
  responseStyle: 'conversational',
  language: 'en',
  specialties: ['Customer Support', 'Product Information', 'Technical Help'],
  brandAlignment: {
    useCompanyVoice: true,
    brandKeywords: ['innovative', 'reliable', 'customer-focused'],
    avoidPhrases: ['I don\'t know', 'That\'s not my job']
  }
};

const avatarOptions = ['🤖', '👨‍💼', '👩‍💼', '🧑‍💻', '👨‍🔬', '👩‍🔬', '🎯', '⚡', '🌟', '💎'];

const testScenarios: TestScenario[] = [
  {
    id: '1',
    name: 'Product Inquiry',
    description: 'Customer asking about product features and pricing',
    userMessages: ['What are your main features?', 'How much does it cost?', 'Do you have a free trial?'],
    expectedOutcomes: ['Clear feature explanation', 'Pricing information', 'Free trial details'],
    isActive: true
  },
  {
    id: '2',
    name: 'Technical Support',
    description: 'Customer experiencing technical issues',
    userMessages: ['I can\'t log in', 'The app is crashing', 'How do I integrate with my system?'],
    expectedOutcomes: ['Login troubleshooting', 'Crash investigation', 'Integration guidance'],
    isActive: true
  },
  {
    id: '3',
    name: 'Billing Questions',
    description: 'Customer asking about billing and payments',
    userMessages: ['How do I cancel my subscription?', 'I was charged twice', 'Can I get a refund?'],
    expectedOutcomes: ['Cancellation process', 'Billing investigation', 'Refund policy'],
    isActive: true
  }
];

export default function PlaygroundPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'personality' | 'testing' | 'abtest'>('personality');
  
  // Real bot configuration state
  const [botConfig, setBotConfig] = useState<BotConfiguration | null>(null);
  const [formData, setFormData] = useState<BotConfigFormData>({
    bot_name: 'ROMASHKA Assistant',
    avatar_emoji: '🤖',
    personality_traits: {
      formality: 50,
      enthusiasm: 50,
      technical_depth: 50,
      empathy: 50
    },
    response_style: 'conversational',
    custom_instructions: ''
  });
  
  // Testing state
  const [testMessage, setTestMessage] = useState('');
  const [testResponse, setTestResponse] = useState<PlaygroundAIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testHistory, setTestHistory] = useState<PlaygroundConversation[]>([]);
  
  // Test scenarios state
  const [availableScenarios, setAvailableScenarios] = useState<TestScenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<TestScenario | null>(null);
  const [scenarioResults, setScenarioResults] = useState<TestScenarioResult[]>([]);
  
  // A/B testing state
  const [abTests, setAbTests] = useState<PlaygroundABTest[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<BotPerformanceMetrics[]>([]);
  
  // UI state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Legacy personality state for backward compatibility
  const [personality, setPersonality] = useState<BotPersonality>(defaultPersonality);

  // Load initial data
  useEffect(() => {
    if (user) {
      loadPlaygroundData();
    }
  }, [user]);

  const loadPlaygroundData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load bot configuration
      const config = await botConfigurationService.loadBotConfig();
      if (config) {
        setBotConfig(config);
        setFormData({
          bot_name: config.bot_name,
          avatar_emoji: config.avatar_emoji,
          personality_traits: config.personality_traits,
          response_style: config.response_style,
          custom_instructions: config.custom_instructions || ''
        });
      }

      // Load test scenarios
      const scenarios = testScenarioService.getAllScenarios();
      setAvailableScenarios(scenarios);

      // Load A/B tests
      const tests = await abTestingService.getABTests();
      setAbTests(tests);

      // Load performance metrics if config exists
      if (config) {
        const metrics = await botConfigurationService.getPerformanceMetrics(config.id);
        // Convert metrics to array format for display
        setPerformanceMetrics([]);
      }

    } catch (err) {
      console.error('Error loading playground data:', err);
      setError('Failed to load playground data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Configuration handlers
  const updatePersonality = (field: keyof BotPersonality, value: any) => {
    setPersonality(prev => ({ ...prev, [field]: value }));
    // Also update real form data
    if (field === 'formality' || field === 'enthusiasm' || field === 'technicality' || field === 'empathy') {
      setFormData(prev => ({
        ...prev,
        personality_traits: {
          ...prev.personality_traits,
          [field === 'technicality' ? 'technical_depth' : field]: value
        }
      }));
    }
  };

  const updateSliderValue = (field: keyof BotPersonality, value: number) => {
    updatePersonality(field, value);
  };

  const updateFormData = (field: keyof BotConfigFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Save bot configuration
  const handleSaveConfiguration = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      setSaveStatus('saving');
      setError(null);

      const savedConfig = await botConfigurationService.saveBotConfig(formData);
      setBotConfig(savedConfig);
      setSaveStatus('success');

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Error saving bot configuration:', err);
      setError('Failed to save bot configuration. Please try again.');
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  // Test message handler with real AI
  const testBotResponse = async () => {
    if (!testMessage.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Ensure we have a saved configuration first
      let currentConfig = botConfig;
      if (!currentConfig) {
        currentConfig = await botConfigurationService.saveBotConfig(formData);
        setBotConfig(currentConfig);
      }

      // Generate real AI response
      const response = await playgroundAIService.generateTestResponse(
        testMessage,
        currentConfig
      );
      
      setTestResponse(response);
      
      // Add to test history
      const historyEntry: PlaygroundConversation = {
        id: `test_${Date.now()}`,
        message: testMessage,
        response: response.response,
        timestamp: new Date(),
        confidence: response.confidence,
        processingTime: response.response_time
      };
      
      setTestHistory(prev => [...prev, historyEntry]);
      
      // Clear test message
      setTestMessage('');
      
    } catch (error) {
      console.error('Test failed:', error);
      setError('Failed to generate AI response. Please check your OpenAI API key and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // A/B Test management
  const createABTest = () => {
    const newTest: ABTestConfig = {
      id: Date.now().toString(),
      name: 'New A/B Test',
      description: 'Test different personality configurations',
      variants: [
        {
          id: 'variant-a',
          name: 'Variant A',
          personality: { tone: 'professional', formality: 80 },
          weight: 50
        },
        {
          id: 'variant-b',
          name: 'Variant B',
          personality: { tone: 'friendly', formality: 40 },
          weight: 50
        }
      ],
      metrics: {
        responseTime: 0,
        satisfaction: 0,
        conversions: 0
      },
      isRunning: false
    };
    
    setAbTests(prev => [...prev, newTest]);
  };

  // Run test scenario with real AI
  const runScenarioTest = async (scenario: TestScenario) => {
    if (!botConfig) {
      setError('Please save your bot configuration first before running test scenarios.');
      return;
    }

    try {
      setSelectedScenario(scenario);
      setIsLoading(true);
      setError(null);

      const result = await testScenarioService.runTestScenario(scenario.id, botConfig);
      
      // Add to scenario results
      setScenarioResults(prev => {
        const filtered = prev.filter(r => r.scenario_id !== scenario.id);
        return [...filtered, result];
      });

      setSelectedScenario(null);
    } catch (error) {
      console.error('Error running scenario test:', error);
      setError(`Failed to run test scenario: ${scenario.name}. Please try again.`);
      setSelectedScenario(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Run all test scenarios
  const runAllScenarios = async () => {
    if (!botConfig) {
      setError('Please save your bot configuration first before running all test scenarios.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { results, summary } = await testScenarioService.runAllScenarios(botConfig);
      setScenarioResults(results);
      
      // Show insights
      const insights = testScenarioService.getPerformanceInsights(results);
      console.log('Performance insights:', insights);
      
    } catch (error) {
      console.error('Error running all scenarios:', error);
      setError('Failed to run all test scenarios. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-button rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-heading font-bold text-primary-deep-blue dark:text-white">
              Advanced Playground
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Customize your AI bot's personality, test responses, and optimize performance with A/B testing.
          </p>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8">
          {[
            { id: 'personality', label: 'Personality', icon: <Palette className="w-4 h-4" /> },
            { id: 'testing', label: 'Response Testing', icon: <TestTube className="w-4 h-4" /> },
            { id: 'abtest', label: 'A/B Testing', icon: <BarChart3 className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium
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
          {activeTab === 'personality' && (
            <motion.div
              key="personality"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Basic Configuration */}
              <div className="glass-card p-6 rounded-xl">
                <h2 className="text-xl font-heading font-semibold text-primary-deep-blue dark:text-white mb-4">
                  Basic Configuration
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Bot Name
                    </label>
                    <input
                      type="text"
                      value={personality.name}
                      onChange={(e) => updatePersonality('name', e.target.value)}
                      className="input-primary"
                      placeholder="Enter bot name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Avatar
                    </label>
                    <div className="flex gap-2">
                      {avatarOptions.map(avatar => (
                        <button
                          key={avatar}
                          onClick={() => updatePersonality('avatar', avatar)}
                          className={`
                            w-12 h-12 rounded-lg flex items-center justify-center text-xl transition-all
                            ${personality.avatar === avatar 
                              ? 'bg-gradient-button text-white shadow-elevation-1' 
                              : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }
                          `}
                        >
                          {avatar}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Personality Sliders */}
              <div className="glass-card p-6 rounded-xl">
                <h2 className="text-xl font-heading font-semibold text-primary-deep-blue dark:text-white mb-4">
                  Personality Traits
                </h2>
                
                <div className="space-y-6">
                  {[
                    { key: 'formality', label: 'Formality', icon: <Settings className="w-4 h-4" />, description: 'How formal should the bot be?' },
                    { key: 'enthusiasm', label: 'Enthusiasm', icon: <Zap className="w-4 h-4" />, description: 'How energetic and excited should responses be?' },
                    { key: 'technicality', label: 'Technical Depth', icon: <Brain className="w-4 h-4" />, description: 'How technical and detailed should explanations be?' },
                    { key: 'empathy', label: 'Empathy', icon: <Heart className="w-4 h-4" />, description: 'How understanding and supportive should the bot be?' }
                  ].map(trait => (
                    <div key={trait.key} className="space-y-2">
                      <div className="flex items-center gap-2">
                        {trait.icon}
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {trait.label}
                        </label>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({(personality[trait.key as keyof BotPersonality] as number)}%)
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={personality[trait.key as keyof BotPersonality] as number}
                        onChange={(e) => updateSliderValue(trait.key as keyof BotPersonality, parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        style={{
                          background: `linear-gradient(to right, #38b2ac 0%, #38b2ac ${personality[trait.key as keyof BotPersonality] as number}%, #e2e8f0 ${personality[trait.key as keyof BotPersonality] as number}%, #e2e8f0 100%)`
                        }}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {trait.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Response Style */}
              <div className="glass-card p-6 rounded-xl">
                <h2 className="text-xl font-heading font-semibold text-primary-deep-blue dark:text-white mb-4">
                  Response Style
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { value: 'concise', label: 'Concise', description: 'Short, to-the-point responses' },
                    { value: 'detailed', label: 'Detailed', description: 'Comprehensive, thorough explanations' },
                    { value: 'conversational', label: 'Conversational', description: 'Natural, flowing dialogue' }
                  ].map(style => (
                    <button
                      key={style.value}
                      onClick={() => updatePersonality('responseStyle', style.value)}
                      className={`
                        p-4 rounded-lg border-2 transition-all text-left
                        ${personality.responseStyle === style.value
                          ? 'border-primary-teal bg-primary-teal/10 text-primary-teal'
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary-teal/50'
                        }
                      `}
                    >
                      <div className="font-medium">{style.label}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {style.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <p className="text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4">
                <Button 
                  variant="primary" 
                  icon={saveStatus === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  onClick={handleSaveConfiguration}
                  loading={isSaving}
                  disabled={!user}
                >
                  {saveStatus === 'saving' ? 'Saving...' : 'Save Configuration'}
                </Button>
                
                {saveStatus === 'success' && (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Configuration saved!</span>
                  </div>
                )}
                
                <Button variant="outline" icon={<Download className="w-4 h-4" />}>
                  Export Config
                </Button>
                <Button variant="outline" icon={<Upload className="w-4 h-4" />}>
                  Import Config
                </Button>
              </div>
            </motion.div>
          )}

          {activeTab === 'testing' && (
            <motion.div
              key="testing"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Test Input */}
              <div className="glass-card p-6 rounded-xl">
                <h2 className="text-xl font-heading font-semibold text-primary-deep-blue dark:text-white mb-4">
                  Test Bot Response
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Test Message
                    </label>
                    <textarea
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      className="input-primary h-24 resize-none"
                      placeholder="Enter a message to test how your bot would respond..."
                    />
                  </div>
                  
                  <Button 
                    variant="primary" 
                    onClick={testBotResponse}
                    loading={isLoading}
                    disabled={!testMessage.trim()}
                    icon={<Play className="w-4 h-4" />}
                  >
                    Test Response
                  </Button>
                </div>
              </div>

              {/* Test Response */}
              {testResponse && (
                <div className="glass-card p-6 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-heading font-semibold text-primary-deep-blue dark:text-white">
                      Bot Response
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Confidence: {Math.round(testResponse.confidence * 100)}%</span>
                      <span>Response Time: {testResponse.response_time}ms</span>
                      <span>Tokens: {testResponse.tokens_used}</span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                    <p className="text-gray-700 dark:text-gray-300">{testResponse.response}</p>
                  </div>

                  {/* Personality Analysis */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">Personality Analysis</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Formality:</span>
                          <span>{testResponse.personality_score.detected_formality}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Enthusiasm:</span>
                          <span>{testResponse.personality_score.detected_enthusiasm}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Technical Depth:</span>
                          <span>{testResponse.personality_score.detected_technical_depth}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Empathy:</span>
                          <span>{testResponse.personality_score.detected_empathy}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">Performance Metrics</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Consistency:</span>
                          <span>{Math.round(testResponse.personality_score.consistency_score * 100)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Config Alignment:</span>
                          <span>{Math.round(testResponse.personality_score.alignment_with_config * 100)}%</span>
                        </div>
                        {testResponse.intent_detected && (
                          <div className="flex justify-between">
                            <span>Intent:</span>
                            <span className="capitalize">{testResponse.intent_detected}</span>
                          </div>
                        )}
                        {testResponse.sentiment && (
                          <div className="flex justify-between">
                            <span>Sentiment:</span>
                            <span className="capitalize">{testResponse.sentiment}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Test Scenarios */}
              <div className="glass-card p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-heading font-semibold text-primary-deep-blue dark:text-white">
                    Pre-built Test Scenarios
                  </h2>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={runAllScenarios}
                    disabled={!botConfig || isLoading}
                    loading={isLoading}
                    icon={<Play className="w-3 h-3" />}
                  >
                    Run All Scenarios
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {availableScenarios.map(scenario => {
                    const result = scenarioResults.find(r => r.scenario_id === scenario.id);
                    const isRunning = selectedScenario?.id === scenario.id && isLoading;
                    
                    return (
                      <div key={scenario.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-gray-900 dark:text-white">
                                {scenario.name}
                              </h3>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                scenario.difficulty_level === 'easy' ? 'bg-green-100 text-green-800' :
                                scenario.difficulty_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {scenario.difficulty_level}
                              </span>
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full capitalize">
                                {scenario.category.replace('-', ' ')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {scenario.description} ({scenario.test_messages.length} test messages)
                            </p>
                            {result && (
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                                <span>Quality: {Math.round(result.average_quality_score)}%</span>
                                <span>Response Time: {Math.round(result.average_response_time)}ms</span>
                                <span>Confidence: {Math.round(result.average_confidence * 100)}%</span>
                              </div>
                            )}
                          </div>
                          <Button
                            variant={result ? "outline" : "primary"}
                            size="sm"
                            onClick={() => runScenarioTest(scenario)}
                            disabled={!botConfig || isRunning}
                            loading={isRunning}
                            icon={isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                          >
                            {isRunning ? 'Running...' : result ? 'Re-run' : 'Run Test'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'abtest' && (
            <motion.div
              key="abtest"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* A/B Test Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-heading font-semibold text-primary-deep-blue dark:text-white">
                    A/B Testing
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    Test different personality configurations to optimize performance
                  </p>
                </div>
                <Button
                  variant="primary"
                  onClick={createABTest}
                  icon={<TestTube className="w-4 h-4" />}
                >
                  Create A/B Test
                </Button>
              </div>

              {/* A/B Tests List */}
              <div className="space-y-4">
                {abTests.length === 0 ? (
                  <div className="glass-card p-8 rounded-xl text-center">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No A/B Tests Yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Create your first A/B test to optimize your bot's personality
                    </p>
                    <Button
                      variant="primary"
                      onClick={createABTest}
                      icon={<TestTube className="w-4 h-4" />}
                    >
                      Create Your First Test
                    </Button>
                  </div>
                ) : (
                  abTests.map(test => (
                    <div key={test.id} className="glass-card p-6 rounded-xl">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {test.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {test.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant={test.isRunning ? "danger" : "primary"}
                            size="sm"
                            icon={test.isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                          >
                            {test.isRunning ? 'Stop' : 'Start'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Eye className="w-3 h-3" />}
                          >
                            View Results
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {test.variants.map(variant => (
                          <div key={variant.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">{variant.name}</span>
                              <span className="text-xs text-gray-500">{variant.weight}%</span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Tone: {variant.personality.tone}, Formality: {variant.personality.formality}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 