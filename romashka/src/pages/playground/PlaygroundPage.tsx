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
  Sliders
} from 'lucide-react';
import { botConfigurationService } from '../../services/botConfigurationService';
import { playgroundAIService } from '../../services/playgroundAIService';
import playgroundService from '../../services/playgroundService';
import type { 
  BotConfiguration, 
  TestScenario, 
  ABTestConfiguration, 
  PlaygroundTestResponse 
} from '../../types/botConfiguration';

// Bot Personality Configuration (legacy interface for compatibility)
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

const avatarOptions = ['🤖', '👨‍💼', '👩‍💼', '🧑‍💻', '👨‍🔬', '👩‍🔬', '🎯', '⚡', '🌟', '💎'];

export default function PlaygroundPage() {
  const [activeTab, setActiveTab] = useState<'personality' | 'testing' | 'abtest'>('personality');
  const [botConfig, setBotConfig] = useState<BotConfiguration | null>(null);
  const [testMessage, setTestMessage] = useState('');
  const [testResponse, setTestResponse] = useState<PlaygroundTestResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testHistory, setTestHistory] = useState<{message: string, response: string, timestamp: Date, confidence?: number}[]>([]);
  const [abTests, setAbTests] = useState<ABTestConfiguration[]>([]);
  const [testScenarios, setTestScenarios] = useState<TestScenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<TestScenario | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize component
  useEffect(() => {
    const initializePlayground = async () => {
      try {
        // Load bot configuration
        let config = await botConfigurationService.loadBotConfig();
        if (!config) {
          config = await botConfigurationService.createDefaultConfiguration();
        }
        setBotConfig(config);

        // Load test scenarios
        const scenarios = await botConfigurationService.getTestScenarios();
        setTestScenarios(scenarios);

        // Load A/B tests
        const abTestConfigs = await botConfigurationService.getABTestConfigs();
        setAbTests(abTestConfigs);

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize playground:', error);
      }
    };

    initializePlayground();
  }, []);

  // Bot configuration handlers
  const updateBotConfig = (updates: Partial<BotConfiguration>) => {
    if (!botConfig) return;
    setBotConfig(prev => ({ ...prev, ...updates } as BotConfiguration));
  };

  const updatePersonalityTraits = (field: keyof BotConfiguration['personality_traits'], value: number) => {
    if (!botConfig) return;
    setBotConfig(prev => ({
      ...prev,
      personality_traits: {
        ...prev.personality_traits,
        [field]: value
      }
    } as BotConfiguration));
  };

  const saveBotConfiguration = async () => {
    if (!botConfig) return;
    
    try {
      setIsLoading(true);
      const savedConfig = await botConfigurationService.saveBotConfig(botConfig);
      setBotConfig(savedConfig);
      // Update playground service with new config
      await playgroundService.updateBotConfig(savedConfig);
      
      // Show success notification
      alert('✅ Configuration saved successfully!');
    } catch (error) {
      console.error('Failed to save bot configuration:', error);
      alert('❌ Failed to save configuration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const exportConfiguration = () => {
    if (!botConfig) return;
    
    const dataStr = JSON.stringify(botConfig, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bot-config-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importConfiguration = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target?.result as string);
          setBotConfig(config);
          alert('✅ Configuration imported successfully!');
        } catch (error) {
          alert('❌ Invalid configuration file. Please check the format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Test message handler with real AI
  const testBotResponse = async () => {
    if (!testMessage.trim() || !botConfig) return;
    
    setIsLoading(true);
    try {
      // Generate real AI response
      const knowledgeContext = playgroundAIService.getDefaultKnowledgeContext();
      const response = await playgroundAIService.generateTestResponse(
        testMessage,
        botConfig,
        knowledgeContext
      );
      
      setTestResponse(response);
      setTestHistory(prev => [...prev, {
        message: testMessage,
        response: response.response,
        timestamp: new Date(),
        confidence: response.confidence / 100
      }]);

      // Clear test message
      setTestMessage('');
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // A/B Test management
  const createABTest = async () => {
    if (!botConfig) return;

    const newTest: ABTestConfiguration = {
      test_name: 'New A/B Test',
      description: 'Test different personality configurations',
      variants: [
        {
          id: 'variant-a',
          name: 'Variant A',
          personality_traits: { formality: 80, enthusiasm: 40 },
          weight: 50
        },
        {
          id: 'variant-b',
          name: 'Variant B',
          personality_traits: { formality: 40, enthusiasm: 80 },
          weight: 50
        }
      ],
      metrics: {
        response_time: 0,
        satisfaction: 0,
        conversions: 0
      },
      is_running: false
    };
    
    try {
      const savedTest = await botConfigurationService.saveABTestConfig(newTest);
      setAbTests(prev => [...prev, savedTest]);
    } catch (error) {
      console.error('Failed to create A/B test:', error);
    }
  };

  const runScenarioTest = async (scenario: TestScenario) => {
    if (!botConfig || !scenario.user_messages) return;

    setSelectedScenario(scenario);
    setIsLoading(true);
    
    try {
      const results = await playgroundService.runScenarioTest(scenario.user_messages);
      
      // Add results to test history
      results.forEach((result, index) => {
        setTestHistory(prev => [...prev, {
          message: scenario.user_messages[index],
          response: result.message,
          timestamp: new Date(),
          confidence: result.confidence
        }]);
      });
    } catch (error) {
      console.error('Failed to run scenario test:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isInitialized || !botConfig) {
    return (
      <div className="min-h-screen bg-bg-secondary dark:bg-bg-darker flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 bg-gradient-button rounded-lg flex items-center justify-center mx-auto mb-4">
            <Bot className="w-5 h-5 text-white animate-pulse" />
          </div>
          <p className="text-gray-600 dark:text-gray-300">Loading playground...</p>
        </div>
      </div>
    );
  }

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
                      value={botConfig.bot_name}
                      onChange={(e) => updateBotConfig({ bot_name: e.target.value })}
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
                          onClick={() => updateBotConfig({ avatar_emoji: avatar })}
                          className={`
                            w-12 h-12 rounded-lg flex items-center justify-center text-xl transition-all
                            ${botConfig.avatar_emoji === avatar 
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
                    { key: 'technical_depth', label: 'Technical Depth', icon: <Brain className="w-4 h-4" />, description: 'How technical and detailed should explanations be?' },
                    { key: 'empathy', label: 'Empathy', icon: <Heart className="w-4 h-4" />, description: 'How understanding and supportive should the bot be?' }
                  ].map(trait => (
                    <div key={trait.key} className="space-y-2">
                      <div className="flex items-center gap-2">
                        {trait.icon}
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {trait.label}
                        </label>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({botConfig.personality_traits[trait.key as keyof BotConfiguration['personality_traits']]}%)
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={botConfig.personality_traits[trait.key as keyof BotConfiguration['personality_traits']]}
                        onChange={(e) => updatePersonalityTraits(trait.key as keyof BotConfiguration['personality_traits'], parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        style={{
                          background: `linear-gradient(to right, #38b2ac 0%, #38b2ac ${botConfig.personality_traits[trait.key as keyof BotConfiguration['personality_traits']]}%, #e2e8f0 ${botConfig.personality_traits[trait.key as keyof BotConfiguration['personality_traits']]}%, #e2e8f0 100%)`
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
                      onClick={() => updateBotConfig({ response_style: style.value as 'concise' | 'detailed' | 'conversational' })}
                      className={`
                        p-4 rounded-lg border-2 transition-all text-left
                        ${botConfig.response_style === style.value
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

              {/* Custom Instructions */}
              <div className="glass-card p-6 rounded-xl">
                <h2 className="text-xl font-heading font-semibold text-primary-deep-blue dark:text-white mb-4">
                  Custom Instructions
                </h2>
                <textarea
                  value={botConfig.custom_instructions || ''}
                  onChange={(e) => updateBotConfig({ custom_instructions: e.target.value })}
                  className="input-primary h-32 resize-none"
                  placeholder="Add custom instructions for your bot's behavior..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <Button 
                  variant="primary" 
                  icon={<Save className="w-4 h-4" />}
                  onClick={saveBotConfiguration}
                  loading={isLoading}
                >
                  Save Configuration
                </Button>
                <Button 
                  variant="outline" 
                  icon={<Download className="w-4 h-4" />}
                  onClick={exportConfiguration}
                >
                  Export Config
                </Button>
                <Button 
                  variant="outline" 
                  icon={<Upload className="w-4 h-4" />}
                  onClick={importConfiguration}
                >
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
                  <h3 className="text-lg font-heading font-semibold text-primary-deep-blue dark:text-white mb-4">
                    Bot Response
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                    <p className="text-gray-700 dark:text-gray-300">{testResponse.response}</p>
                  </div>
                  
                  {/* Response Analytics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {testResponse.confidence}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Confidence</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {testResponse.response_time}ms
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Response Time</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {testResponse.personality_score.overall_alignment}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Personality Match</div>
                    </div>
                  </div>

                  {/* Knowledge Sources */}
                  {testResponse.knowledge_sources.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Knowledge Sources Used:</h4>
                      <div className="flex flex-wrap gap-2">
                        {testResponse.knowledge_sources.map((source, index) => (
                          <span key={index} className="px-2 py-1 bg-primary-teal/10 text-primary-teal rounded-full text-xs">
                            {source}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Personality Analysis */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Personality Analysis:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {testResponse.personality_score.formality_score}%
                        </div>
                        <div className="text-xs text-gray-500">Formality</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {testResponse.personality_score.enthusiasm_score}%
                        </div>
                        <div className="text-xs text-gray-500">Enthusiasm</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {testResponse.personality_score.technical_depth_score}%
                        </div>
                        <div className="text-xs text-gray-500">Technical Depth</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {testResponse.personality_score.empathy_score}%
                        </div>
                        <div className="text-xs text-gray-500">Empathy</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Test Scenarios */}
              <div className="glass-card p-6 rounded-xl">
                <h2 className="text-xl font-heading font-semibold text-primary-deep-blue dark:text-white mb-4">
                  Pre-built Test Scenarios
                </h2>
                
                <div className="space-y-4">
                  {testScenarios.map(scenario => (
                    <div key={scenario.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {scenario.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {scenario.description}
                          </p>
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {scenario.user_messages.length} test messages
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => runScenarioTest(scenario)}
                          disabled={isLoading}
                          icon={<Play className="w-3 h-3" />}
                        >
                          Run Test
                        </Button>
                      </div>
                    </div>
                  ))}
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
                            {test.test_name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {test.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant={test.is_running ? "danger" : "primary"}
                            size="sm"
                            icon={test.is_running ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                          >
                            {test.is_running ? 'Stop' : 'Start'}
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
                              Formality: {variant.personality_traits.formality || 50}%, 
                              Enthusiasm: {variant.personality_traits.enthusiasm || 50}%
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