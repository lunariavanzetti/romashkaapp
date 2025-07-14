import React from 'react';
import { motion } from 'framer-motion';
import { Palette, Briefcase, Smile, Coffee, Code, Heart, Check, Zap } from 'lucide-react';
import { PersonalityFormData, TONE_PRESETS, TonePreset } from '../../../../types/personality';

interface PersonalityTonePresetsProps {
  formData: PersonalityFormData;
  updateFormData: (updates: Partial<PersonalityFormData>) => void;
}

export default function PersonalityTonePresets({ 
  formData, 
  updateFormData 
}: PersonalityTonePresetsProps) {
  const handleToneChange = (tonePreset: TonePreset) => {
    const selectedTone = TONE_PRESETS.find(tone => tone.value === tonePreset);
    if (selectedTone) {
      updateFormData({ 
        tone_preset: tonePreset,
        // Optionally apply personality adjustments
        personality_scores: {
          ...formData.personality_scores,
          ...selectedTone.personalityAdjustments
        }
      });
    }
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Briefcase':
        return Briefcase;
      case 'Smile':
        return Smile;
      case 'Coffee':
        return Coffee;
      case 'Code':
        return Code;
      case 'Heart':
        return Heart;
      default:
        return Zap;
    }
  };

  const getPresetColor = (preset: TonePreset) => {
    switch (preset) {
      case 'professional':
        return 'from-blue-500 to-indigo-500';
      case 'friendly':
        return 'from-green-500 to-teal-500';
      case 'casual':
        return 'from-yellow-500 to-orange-500';
      case 'technical':
        return 'from-purple-500 to-violet-500';
      case 'supportive':
        return 'from-pink-500 to-rose-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/20 backdrop-blur-glass"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
          <Palette className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-heading font-semibold text-gray-900 dark:text-white">
            Tone Presets
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Choose a predefined tone that matches your communication style
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TONE_PRESETS.map((preset) => {
          const IconComponent = getIconComponent(preset.icon);
          const isSelected = formData.tone_preset === preset.value;
          const gradientColor = getPresetColor(preset.value);

          return (
            <button
              key={preset.value}
              onClick={() => handleToneChange(preset.value)}
              className={`relative p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                isSelected
                  ? 'border-primary-teal bg-primary-teal/10'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary-teal rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}

              {/* Icon */}
              <div className={`w-10 h-10 bg-gradient-to-br ${gradientColor} rounded-lg flex items-center justify-center mb-3`}>
                <IconComponent className="w-5 h-5 text-white" />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <h4 className={`font-medium ${isSelected ? 'text-primary-teal' : 'text-gray-900 dark:text-white'}`}>
                  {preset.label}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {preset.description}
                </p>
              </div>

              {/* Personality Adjustments Preview */}
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Personality adjustments:
                </div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(preset.personalityAdjustments).map(([key, value]) => (
                    <span
                      key={key}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs"
                    >
                      {key}: {value}%
                    </span>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Tone Details */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-8 h-8 bg-gradient-to-br ${getPresetColor(formData.tone_preset)} rounded-lg flex items-center justify-center`}>
            {React.createElement(getIconComponent(TONE_PRESETS.find(p => p.value === formData.tone_preset)?.icon || 'Zap'), {
              className: 'w-4 h-4 text-white'
            })}
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">
              Selected Tone: {TONE_PRESETS.find(p => p.value === formData.tone_preset)?.label}
            </h4>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {TONE_PRESETS.find(p => p.value === formData.tone_preset)?.description}
        </p>
      </div>

      {/* Tone Impact */}
      <div className="mt-6 space-y-3">
        <h4 className="font-medium text-gray-900 dark:text-white">
          How this tone affects responses:
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {getToneImpacts(formData.tone_preset).map((impact, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="w-2 h-2 bg-primary-teal rounded-full mt-2 flex-shrink-0"></div>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {impact}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Tone Option */}
      <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
        <div className="flex items-start gap-2">
          <Palette className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-purple-700 dark:text-purple-300">
            <strong>Pro Tip:</strong> You can fine-tune the personality sliders above to create a custom tone that perfectly matches your brand voice, even after selecting a preset.
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function getToneImpacts(tone: TonePreset): string[] {
  const impacts = {
    professional: [
      'Uses formal language and business terminology',
      'Maintains structured and organized responses',
      'Focuses on efficiency and clear communication',
      'Avoids casual expressions and slang'
    ],
    friendly: [
      'Uses warm and approachable language',
      'Includes personal touches and empathy',
      'Maintains positive and upbeat tone',
      'Uses conversational and natural expressions'
    ],
    casual: [
      'Uses relaxed and informal language',
      'Includes colloquialisms and casual expressions',
      'Maintains laid-back and easy-going tone',
      'Uses contractions and informal greetings'
    ],
    technical: [
      'Uses precise and detailed explanations',
      'Includes industry-specific terminology',
      'Focuses on accuracy and thoroughness',
      'Provides comprehensive technical information'
    ],
    supportive: [
      'Shows understanding and emotional awareness',
      'Provides comfort and reassurance',
      'Uses encouraging and positive language',
      'Acknowledges feelings and concerns'
    ]
  };

  return impacts[tone] || [];
}