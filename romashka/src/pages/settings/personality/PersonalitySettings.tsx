import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain,
  MessageSquare,
  User,
  Settings,
  Save,
  RefreshCw,
  TestTube,
  Sparkles,
  Heart,
  Smile,
  Zap,
  Shield,
  BookOpen,
  Globe,
  Volume2,
  PlayCircle,
  Sliders,
  Palette,
  Target
} from 'lucide-react';
import { Button } from '../../../components/ui';
import { supabase } from '../../../services/supabaseClient';
import { useAuth } from '../../../hooks/useAuth';

interface PersonalityConfig {
  id: string;
  name: string;
  description: string;
  traits: {
    friendliness: number;
    professionalism: number;
    empathy: number;
    enthusiasm: number;
    helpfulness: number;
  };
  tone: 'formal' | 'casual' | 'friendly' | 'professional' | 'warm';
  style: 'concise' | 'detailed' | 'conversational' | 'direct';
  language: string;
  responseLength: 'short' | 'medium' | 'long';
  personality: string;
  customInstructions: string;
  greeting: string;
  fallback: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PersonalitySettings() {
  const { user } = useAuth();
  const [config, setConfig] = useState<PersonalityConfig>({
    id: '1',
    name: 'Helpful Assistant',
    description: 'A friendly and professional AI assistant',
    traits: {
      friendliness: 80,
      professionalism: 90,
      empathy: 85,
      enthusiasm: 70,
      helpfulness: 95
    },
    tone: 'friendly',
    style: 'conversational',
    language: 'en',
    responseLength: 'medium',
    personality: 'You are a helpful, friendly AI assistant. Always be polite, professional, and aim to provide accurate and useful information.',
    customInstructions: '',
    greeting: 'Hello! I\'m here to help you with any questions or concerns you might have. How can I assist you today?',
    fallback: 'I apologize, but I don\'t have enough information to provide a specific answer to your question. Could you please provide more details or rephrase your question?',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState('');
  const [activeTab, setActiveTab] = useState<'traits' | 'content' | 'advanced'>('traits');

  const toneOptions = [
    { value: 'formal', label: 'Formal', icon: Shield, description: 'Professional and structured' },
    { value: 'casual', label: 'Casual', icon: Smile, description: 'Relaxed and informal' },
    { value: 'friendly', label: 'Friendly', icon: Heart, description: 'Warm and approachable' },
    { value: 'professional', label: 'Professional', icon: Target, description: 'Business-focused' },
    { value: 'warm', label: 'Warm', icon: Sparkles, description: 'Caring and empathetic' }
  ];

  const styleOptions = [
    { value: 'concise', label: 'Concise', description: 'Brief and to the point' },
    { value: 'detailed', label: 'Detailed', description: 'Comprehensive explanations' },
    { value: 'conversational', label: 'Conversational', description: 'Natural dialogue style' },
    { value: 'direct', label: 'Direct', description: 'Straightforward responses' }
  ];

  const responseLengthOptions = [
    { value: 'short', label: 'Short', description: '1-2 sentences' },
    { value: 'medium', label: 'Medium', description: '2-4 sentences' },
    { value: 'long', label: 'Long', description: '4+ sentences with details' }
  ];

  // Load personality config from database
  useEffect(() => {
    if (user) {
      loadPersonalityConfig();
    }
  }, [user]);

  const loadPersonalityConfig = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('personality_configs')
        .select('*')
        .eq('user_id', user.id.toString())
        .single();

      if (data) {
        setConfig({
          id: data.id,
          name: data.name,
          description: data.description || '',
          traits: data.traits || config.traits,
          tone: data.tone || 'friendly',
          style: data.style || 'conversational',
          language: data.language || 'en',
          responseLength: data.response_length || 'medium',
          personality: data.personality || config.personality,
          customInstructions: data.custom_instructions || '',
          greeting: data.greeting || config.greeting,
          fallback: data.fallback || config.fallback,
          isActive: data.is_active !== false,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        });
      }
    } catch (error) {
      console.error('Error loading personality config:', error);
    }
  };

  const handleSave = async () => {
    if (!user) {
      alert('❌ Please sign in to save configuration.');
      return;
    }

    setIsSaving(true);
    try {
      const configData = {
        user_id: user.id.toString(),
        name: config.name,
        description: config.description,
        traits: config.traits,
        tone: config.tone,
        style: config.style,
        language: config.language,
        response_length: config.responseLength,
        personality: config.personality,
        custom_instructions: config.customInstructions,
        greeting: config.greeting,
        fallback: config.fallback,
        is_active: config.isActive
      };

      // First try to update existing record
      const { data: existingData } = await supabase
        .from('personality_configs')
        .select('id')
        .eq('user_id', user.id.toString())
        .single();

      let error;
      
      if (existingData) {
        // Update existing record
        const result = await supabase
          .from('personality_configs')
          .update(configData)
          .eq('user_id', user.id.toString());
        error = result.error;
      } else {
        // Insert new record
        const result = await supabase
          .from('personality_configs')
          .insert([configData]);
        error = result.error;
      }

      if (error) {
        console.error('Error saving configuration:', error);
        alert('❌ Failed to save configuration. Please try again.');
        return;
      }
      
      setConfig(prev => ({
        ...prev,
        updatedAt: new Date().toISOString()
      }));
      
      alert('✅ Personality configuration saved successfully!');
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert('❌ Failed to save configuration. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      // Simulate AI test response
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const testMessage = `${config.greeting}\n\nBased on your current settings:\n- Tone: ${config.tone}\n- Style: ${config.style}\n- Friendliness: ${config.traits.friendliness}%\n- Professionalism: ${config.traits.professionalism}%\n\nThis is how I would respond with your current personality configuration.`;
      
      setTestResult(testMessage);
      alert('✅ Test completed! Check the preview below.');
    } catch (error) {
      console.error('Error testing configuration:', error);
      alert('❌ Test failed. Please try again.');
    } finally {
      setIsTesting(false);
    }
  };

  const updateTrait = (trait: keyof typeof config.traits, value: number) => {
    setConfig(prev => ({
      ...prev,
      traits: {
        ...prev.traits,
        [trait]: value
      }
    }));
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
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold text-primary-deep-blue dark:text-white">
                AI Personality Configuration
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Fine-tune your AI assistant's personality, tone, and communication style
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleTest}
              loading={isTesting}
              variant="outline"
              icon={<TestTube className="w-4 h-4" />}
            >
              Test Configuration
            </Button>
            <Button
              onClick={handleSave}
              loading={isSaving}
              icon={<Save className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 overflow-x-auto">
          {[
            { id: 'traits', label: 'Personality Traits', icon: <Heart className="w-4 h-4" /> },
            { id: 'content', label: 'Content & Style', icon: <MessageSquare className="w-4 h-4" /> },
            { id: 'advanced', label: 'Advanced Settings', icon: <Settings className="w-4 h-4" /> }
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'traits' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Personality Traits */}
                <div className="glass-card p-6 rounded-xl">
                  <h3 className="text-lg font-heading font-semibold text-primary-deep-blue dark:text-white mb-6">
                    Personality Traits
                  </h3>
                  
                  <div className="space-y-6">
                    {Object.entries(config.traits).map(([trait, value]) => (
                      <div key={trait}>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                            {trait}
                          </label>
                          <span className="text-sm text-primary-teal font-medium">
                            {value}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={value}
                          onChange={(e) => updateTrait(trait as keyof typeof config.traits, parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Low</span>
                          <span>High</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tone Selection */}
                <div className="glass-card p-6 rounded-xl">
                  <h3 className="text-lg font-heading font-semibold text-primary-deep-blue dark:text-white mb-6">
                    Communication Tone
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {toneOptions.map(option => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          onClick={() => setConfig(prev => ({ ...prev, tone: option.value as any }))}
                          className={`
                            p-4 rounded-lg border-2 transition-all text-left
                            ${config.tone === option.value
                              ? 'border-primary-teal bg-primary-teal/10'
                              : 'border-gray-200 dark:border-gray-600 hover:border-primary-teal/50'
                            }
                          `}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <Icon className={`w-5 h-5 ${config.tone === option.value ? 'text-primary-teal' : 'text-gray-500'}`} />
                            <span className={`font-medium ${config.tone === option.value ? 'text-primary-teal' : 'text-gray-900 dark:text-white'}`}>
                              {option.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {option.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'content' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Response Style */}
                <div className="glass-card p-6 rounded-xl">
                  <h3 className="text-lg font-heading font-semibold text-primary-deep-blue dark:text-white mb-6">
                    Response Style
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {styleOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => setConfig(prev => ({ ...prev, style: option.value as any }))}
                        className={`
                          p-4 rounded-lg border-2 transition-all text-left
                          ${config.style === option.value
                            ? 'border-primary-teal bg-primary-teal/10'
                            : 'border-gray-200 dark:border-gray-600 hover:border-primary-teal/50'
                          }
                        `}
                      >
                        <span className={`font-medium block mb-1 ${config.style === option.value ? 'text-primary-teal' : 'text-gray-900 dark:text-white'}`}>
                          {option.label}
                        </span>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {option.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Response Length */}
                <div className="glass-card p-6 rounded-xl">
                  <h3 className="text-lg font-heading font-semibold text-primary-deep-blue dark:text-white mb-6">
                    Response Length
                  </h3>
                  
                  <div className="space-y-3">
                    {responseLengthOptions.map(option => (
                      <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="responseLength"
                          value={option.value}
                          checked={config.responseLength === option.value}
                          onChange={(e) => setConfig(prev => ({ ...prev, responseLength: e.target.value as any }))}
                          className="w-4 h-4 text-primary-teal"
                        />
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {option.label}
                          </span>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {option.description}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Custom Messages */}
                <div className="glass-card p-6 rounded-xl">
                  <h3 className="text-lg font-heading font-semibold text-primary-deep-blue dark:text-white mb-6">
                    Custom Messages
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Greeting Message
                      </label>
                      <textarea
                        value={config.greeting}
                        onChange={(e) => setConfig(prev => ({ ...prev, greeting: e.target.value }))}
                        rows={3}
                        className="input-primary w-full"
                        placeholder="Enter the greeting message for new conversations..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Fallback Message
                      </label>
                      <textarea
                        value={config.fallback}
                        onChange={(e) => setConfig(prev => ({ ...prev, fallback: e.target.value }))}
                        rows={3}
                        className="input-primary w-full"
                        placeholder="Enter the message when AI doesn't understand..."
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'advanced' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Personality Description */}
                <div className="glass-card p-6 rounded-xl">
                  <h3 className="text-lg font-heading font-semibold text-primary-deep-blue dark:text-white mb-6">
                    Core Personality
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Personality Description
                      </label>
                      <textarea
                        value={config.personality}
                        onChange={(e) => setConfig(prev => ({ ...prev, personality: e.target.value }))}
                        rows={4}
                        className="input-primary w-full"
                        placeholder="Describe the AI's core personality and behavior..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Custom Instructions
                      </label>
                      <textarea
                        value={config.customInstructions}
                        onChange={(e) => setConfig(prev => ({ ...prev, customInstructions: e.target.value }))}
                        rows={4}
                        className="input-primary w-full"
                        placeholder="Additional specific instructions for the AI..."
                      />
                    </div>
                  </div>
                </div>

                {/* Language Settings */}
                <div className="glass-card p-6 rounded-xl">
                  <h3 className="text-lg font-heading font-semibold text-primary-deep-blue dark:text-white mb-6">
                    Language Settings
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Primary Language
                      </label>
                      <select
                        value={config.language}
                        onChange={(e) => setConfig(prev => ({ ...prev, language: e.target.value }))}
                        className="input-primary w-full"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="it">Italian</option>
                        <option value="pt">Portuguese</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Configuration Name
                      </label>
                      <input
                        type="text"
                        value={config.name}
                        onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                        className="input-primary w-full"
                        placeholder="Configuration name"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="glass-card p-6 rounded-xl">
              <h3 className="text-lg font-heading font-semibold text-primary-deep-blue dark:text-white mb-4">
                Configuration Summary
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Tone:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {config.tone}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Style:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {config.style}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Language:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white uppercase">
                    {config.language}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Updated:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(config.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Test Preview */}
            {testResult && (
              <div className="glass-card p-6 rounded-xl">
                <h3 className="text-lg font-heading font-semibold text-primary-deep-blue dark:text-white mb-4">
                  Test Preview
                </h3>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary-teal rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line">
                        {testResult}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Guidance */}
            <div className="glass-card p-6 rounded-xl">
              <h3 className="text-lg font-heading font-semibold text-primary-deep-blue dark:text-white mb-4">
                Configuration Tips
              </h3>
              
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-primary-teal mt-0.5 flex-shrink-0" />
                  <span>Higher friendliness creates warmer responses</span>
                </div>
                <div className="flex items-start gap-2">
                  <Target className="w-4 h-4 text-primary-teal mt-0.5 flex-shrink-0" />
                  <span>Professional tone works best for business contexts</span>
                </div>
                <div className="flex items-start gap-2">
                  <Heart className="w-4 h-4 text-primary-teal mt-0.5 flex-shrink-0" />
                  <span>High empathy helps with customer support</span>
                </div>
                <div className="flex items-start gap-2">
                  <TestTube className="w-4 h-4 text-primary-teal mt-0.5 flex-shrink-0" />
                  <span>Test changes before saving to production</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}