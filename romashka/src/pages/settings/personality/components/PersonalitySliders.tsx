import React from 'react';
import { motion } from 'framer-motion';
import { Sliders, Briefcase, Zap, Code, Heart, Info } from 'lucide-react';
import { PersonalityFormData, PERSONALITY_SLIDERS, PersonalityScores } from '../../../../types/personality';

interface PersonalitySlidersProps {
  formData: PersonalityFormData;
  updateFormData: (updates: Partial<PersonalityFormData>) => void;
}

export default function PersonalitySliders({ formData, updateFormData }: PersonalitySlidersProps) {
  const handleSliderChange = (key: keyof PersonalityScores, value: number) => {
    updateFormData({
      personality_scores: {
        ...formData.personality_scores,
        [key]: value
      }
    });
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Briefcase':
        return Briefcase;
      case 'Zap':
        return Zap;
      case 'Code':
        return Code;
      case 'Heart':
        return Heart;
      default:
        return Sliders;
    }
  };

  const getSliderColor = (value: number) => {
    if (value >= 80) return 'from-green-500 to-green-600';
    if (value >= 60) return 'from-blue-500 to-blue-600';
    if (value >= 40) return 'from-yellow-500 to-yellow-600';
    if (value >= 20) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
  };

  const getValueDescription = (value: number) => {
    if (value >= 80) return 'Very High';
    if (value >= 60) return 'High';
    if (value >= 40) return 'Medium';
    if (value >= 20) return 'Low';
    return 'Very Low';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/20 backdrop-blur-glass"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
          <Sliders className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-heading font-semibold text-gray-900 dark:text-white">
            Personality Traits
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Adjust your AI assistant's personality characteristics
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {PERSONALITY_SLIDERS.map((slider) => {
          const IconComponent = getIconComponent(slider.icon);
          const currentValue = formData.personality_scores[slider.key];
          const sliderColor = getSliderColor(currentValue);
          const valueDescription = getValueDescription(currentValue);

          return (
            <div key={slider.key} className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 bg-gradient-to-br ${sliderColor} rounded-lg flex items-center justify-center`}>
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {slider.label}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {slider.description}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {currentValue}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {valueDescription}
                  </div>
                </div>
              </div>

              {/* Slider */}
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="range"
                    min={slider.min}
                    max={slider.max}
                    step={slider.step}
                    value={currentValue}
                    onChange={(e) => handleSliderChange(slider.key, parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, 
                        rgb(99, 102, 241) 0%, 
                        rgb(99, 102, 241) ${currentValue}%, 
                        rgb(229, 231, 235) ${currentValue}%, 
                        rgb(229, 231, 235) 100%)`
                    }}
                  />
                  <div
                    className="absolute top-0 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg pointer-events-none"
                    style={{ width: `${currentValue}%` }}
                  />
                </div>

                {/* Labels */}
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{slider.lowLabel}</span>
                  <span>{slider.highLabel}</span>
                </div>
              </div>

              {/* Quick Values */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">Quick set:</span>
                {[0, 25, 50, 75, 100].map((value) => (
                  <button
                    key={value}
                    onClick={() => handleSliderChange(slider.key, value)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      currentValue === value
                        ? 'bg-primary-teal text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {value}%
                  </button>
                ))}
              </div>

              {/* Impact Description */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Impact:</strong> {getImpactDescription(slider.key, currentValue)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall Balance Indicator */}
      <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 mb-2">
          <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h4 className="font-medium text-blue-900 dark:text-blue-100">
            Personality Balance
          </h4>
        </div>
        <div className="text-sm text-blue-700 dark:text-blue-300">
          {getBalanceDescription(formData.personality_scores)}
        </div>
      </div>
    </motion.div>
  );
}

function getImpactDescription(key: keyof PersonalityScores, value: number): string {
  const impacts = {
    formality: {
      high: 'Responses will be professional, structured, and use formal language.',
      medium: 'Responses will be polite but approachable, balancing professionalism with warmth.',
      low: 'Responses will be casual, friendly, and use conversational language.'
    },
    enthusiasm: {
      high: 'Responses will be energetic, positive, and show excitement about helping.',
      medium: 'Responses will be positive and helpful with moderate energy.',
      low: 'Responses will be calm, measured, and focus on providing information.'
    },
    technical_depth: {
      high: 'Responses will include detailed explanations and technical terminology.',
      medium: 'Responses will provide adequate detail without overwhelming users.',
      low: 'Responses will be simple, clear, and avoid technical jargon.'
    },
    empathy: {
      high: 'Responses will show understanding, acknowledge emotions, and provide comfort.',
      medium: 'Responses will be considerate and acknowledge user feelings.',
      low: 'Responses will be direct and focus on solutions rather than emotions.'
    }
  };

  const level = value >= 70 ? 'high' : value >= 30 ? 'medium' : 'low';
  return impacts[key][level];
}

function getBalanceDescription(scores: PersonalityScores): string {
  const average = Object.values(scores).reduce((sum, score) => sum + score, 0) / 4;
  const variance = Object.values(scores).reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / 4;
  
  if (variance < 200) {
    return 'Your personality settings are well-balanced, creating a consistent and predictable AI behavior.';
  } else if (variance < 500) {
    return 'Your personality has some distinct characteristics that will make interactions more dynamic.';
  } else {
    return 'Your personality has strong contrasts that may create unique but potentially inconsistent behaviors.';
  }
}

// Add CSS for custom slider styling
const sliderStyles = `
  .slider::-webkit-slider-thumb {
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    border: 2px solid white;
  }

  .slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    border: 2px solid white;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.innerText = sliderStyles;
  document.head.appendChild(styleSheet);
}