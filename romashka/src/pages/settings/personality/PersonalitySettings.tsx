import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bot, 
  Save, 
  RotateCcw, 
  Eye, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Sparkles,
  User
} from 'lucide-react';
import { Button } from '../../../components/ui';
import { useAuth } from '../../../hooks/useAuth';
import { personalityService } from '../../../services/personalityService';
import { 
  PersonalityConfig, 
  PersonalityFormData, 
  PersonalityPreset,
  DEFAULT_PERSONALITY_CONFIG
} from '../../../types/personality';

import PersonalityBasicSettings from './components/PersonalityBasicSettings';
import PersonalitySliders from './components/PersonalitySliders';
import PersonalityLanguageSettings from './components/PersonalityLanguageSettings';
import PersonalityTonePresets from './components/PersonalityTonePresets';
import PersonalityIndustrySettings from './components/PersonalityIndustrySettings';
import PersonalityBrandVoice from './components/PersonalityBrandVoice';
import PersonalityPreview from './components/PersonalityPreview';

export default function PersonalitySettings() {
  const { user } = useAuth();
  const [config, setConfig] = useState<PersonalityConfig | null>(null);
  const [formData, setFormData] = useState<PersonalityFormData>({
    bot_name: DEFAULT_PERSONALITY_CONFIG.bot_name,
    avatar_url: DEFAULT_PERSONALITY_CONFIG.avatar_url,
    personality_scores: DEFAULT_PERSONALITY_CONFIG.personality_scores,
    primary_language: DEFAULT_PERSONALITY_CONFIG.primary_language,
    tone_preset: DEFAULT_PERSONALITY_CONFIG.tone_preset,
    industry_setting: DEFAULT_PERSONALITY_CONFIG.industry_setting,
    brand_voice_config: DEFAULT_PERSONALITY_CONFIG.brand_voice_config
  });
  const [presets, setPresets] = useState<PersonalityPreset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Load initial data
  useEffect(() => {
    if (user) {
      loadPersonalityData();
    }
  }, [user]);

  const loadPersonalityData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load personality config and presets in parallel
      const [personalityConfig, personalityPresets] = await Promise.all([
        personalityService.getActivePersonalityConfig(user!.id),
        personalityService.getPersonalityPresets()
      ]);

      if (personalityConfig) {
        setConfig(personalityConfig);
        setFormData({
          bot_name: personalityConfig.bot_name,
          avatar_url: personalityConfig.avatar_url,
          personality_scores: personalityConfig.personality_scores,
          primary_language: personalityConfig.primary_language,
          tone_preset: personalityConfig.tone_preset,
          industry_setting: personalityConfig.industry_setting,
          brand_voice_config: personalityConfig.brand_voice_config
        });
      }

      setPresets(personalityPresets);
    } catch (err) {
      console.error('Error loading personality data:', err);
      setError('Failed to load personality settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      setSaveStatus('idle');
      setError(null);

      const updatedConfig = await personalityService.updatePersonalityConfig(user.id, formData);
      setConfig(updatedConfig);
      setSaveStatus('success');
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Error saving personality config:', err);
      setError(err instanceof Error ? err.message : 'Failed to save personality settings');
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (config) {
      setFormData({
        bot_name: config.bot_name,
        avatar_url: config.avatar_url,
        personality_scores: config.personality_scores,
        primary_language: config.primary_language,
        tone_preset: config.tone_preset,
        industry_setting: config.industry_setting,
        brand_voice_config: config.brand_voice_config
      });
    }
    setSaveStatus('idle');
    setError(null);
  };

  const handlePresetApply = async (presetId: string) => {
    if (!user) return;

    try {
      setIsSaving(true);
      const updatedConfig = await personalityService.applyPersonalityPreset(user.id, presetId);
      setConfig(updatedConfig);
      setFormData({
        bot_name: updatedConfig.bot_name,
        avatar_url: updatedConfig.avatar_url,
        personality_scores: updatedConfig.personality_scores,
        primary_language: updatedConfig.primary_language,
        tone_preset: updatedConfig.tone_preset,
        industry_setting: updatedConfig.industry_setting,
        brand_voice_config: updatedConfig.brand_voice_config
      });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Error applying preset:', err);
      setError('Failed to apply preset. Please try again.');
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const updateFormData = (updates: Partial<PersonalityFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const hasChanges = config && JSON.stringify(formData) !== JSON.stringify({
    bot_name: config.bot_name,
    avatar_url: config.avatar_url,
    personality_scores: config.personality_scores,
    primary_language: config.primary_language,
    tone_preset: config.tone_preset,
    industry_setting: config.industry_setting,
    brand_voice_config: config.brand_voice_config
  });

  if (isLoading) {
    return (
      <div className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-8 border border-white/20 backdrop-blur-glass">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary-teal mr-3" />
          <span className="text-gray-600 dark:text-gray-300">Loading personality settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/20 backdrop-blur-glass"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
                AI Personality Configuration
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Customize your AI assistant's personality and brand voice
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowPreview(true)}
              variant="outline"
              className="border-primary-teal/20 text-primary-teal hover:bg-primary-teal/10"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              disabled={!hasChanges || isSaving}
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="bg-gradient-button text-white hover:bg-gradient-button-hover"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Status Messages */}
        {saveStatus === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
          >
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-green-700 dark:text-green-300">
              Personality settings saved successfully!
            </span>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-red-700 dark:text-red-300">
              {error}
            </span>
          </motion.div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Settings */}
          <PersonalityBasicSettings
            formData={formData}
            updateFormData={updateFormData}
            userId={user?.id}
          />

          {/* Personality Sliders */}
          <PersonalitySliders
            formData={formData}
            updateFormData={updateFormData}
          />

          {/* Language Settings */}
          <PersonalityLanguageSettings
            formData={formData}
            updateFormData={updateFormData}
          />

          {/* Tone Presets */}
          <PersonalityTonePresets
            formData={formData}
            updateFormData={updateFormData}
          />

          {/* Industry Settings */}
          <PersonalityIndustrySettings
            formData={formData}
            updateFormData={updateFormData}
            presets={presets}
            onPresetApply={handlePresetApply}
          />

          {/* Brand Voice */}
          <PersonalityBrandVoice
            formData={formData}
            updateFormData={updateFormData}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/20 backdrop-blur-glass"
          >
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-5 h-5 text-primary-teal" />
              <h3 className="text-lg font-heading font-semibold text-gray-900 dark:text-white">
                Personality Profile
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">Formality</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formData.personality_scores.formality}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">Enthusiasm</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formData.personality_scores.enthusiasm}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">Technical Depth</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formData.personality_scores.technical_depth}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">Empathy</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formData.personality_scores.empathy}%
                </span>
              </div>
            </div>
          </motion.div>

          {/* Configuration Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/20 backdrop-blur-glass"
          >
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-primary-teal" />
              <h3 className="text-lg font-heading font-semibold text-gray-900 dark:text-white">
                Configuration Details
              </h3>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-300">Bot Name</span>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formData.bot_name}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-300">Language</span>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formData.primary_language.toUpperCase()}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-300">Tone Preset</span>
                <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {formData.tone_preset}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-300">Industry</span>
                <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {formData.industry_setting.replace('_', ' ')}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <PersonalityPreview
          formData={formData}
          userId={user?.id}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}