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

// Bot Personality Configuration
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
  const [activeTab, setActiveTab] = useState<'personality' | 'testing' | 'abtest'>('personality');
  const [personality, setPersonality] = useState<BotPersonality>(defaultPersonality);
  const [testMessage, setTestMessage] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testHistory, setTestHistory] = useState<{message: string, response: string, timestamp: Date}[]>([]);
  const [abTests, setAbTests] = useState<ABTestConfig[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<TestScenario | null>(null);

  // Personality customization handlers
  const updatePersonality = (field: keyof BotPersonality, value: any) => {
    setPersonality(prev => ({ ...prev, [field]: value }));
  };

  const updateSliderValue = (field: keyof BotPersonality, value: number) => {
    setPersonality(prev => ({ ...prev, [field]: value }));
  };

  // Test message handler
  const testBotResponse = async () => {
    if (!testMessage.trim()) return;
    
    setIsLoading(true);
    try {
      // Simulate API call to test bot response
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockResponse = `Based on your personality settings (${personality.tone}, ${personality.formality}% formal, ${personality.enthusiasm}% enthusiastic), here's how I would respond: "${testMessage}" - This is a simulated response that considers your bot's personality configuration.`;
      
      setTestResponse(mockResponse);
      setTestHistory(prev => [...prev, {
        message: testMessage,
        response: mockResponse,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Test failed:', error);
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

  const runScenarioTest = (scenario: TestScenario) => {
    setSelectedScenario(scenario);
    // Simulate running the scenario
    console.log('Running scenario:', scenario.name);
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

              {/* Actions */}
              <div className="flex gap-4">
                <Button variant="primary" icon={<Save className="w-4 h-4" />}>
                  Save Personality
                </Button>
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
                  <h3 className="text-lg font-heading font-semibold text-primary-deep-blue dark:text-white mb-4">
                    Bot Response
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-gray-700 dark:text-gray-300">{testResponse}</p>
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
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => runScenarioTest(scenario)}
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