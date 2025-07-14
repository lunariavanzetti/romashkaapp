import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Check } from 'lucide-react';
import { PersonalityFormData, LANGUAGE_OPTIONS, PrimaryLanguage } from '../../../../types/personality';

interface PersonalityLanguageSettingsProps {
  formData: PersonalityFormData;
  updateFormData: (updates: Partial<PersonalityFormData>) => void;
}

export default function PersonalityLanguageSettings({ 
  formData, 
  updateFormData 
}: PersonalityLanguageSettingsProps) {
  const handleLanguageChange = (language: PrimaryLanguage) => {
    updateFormData({ primary_language: language });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/20 backdrop-blur-glass"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
          <Globe className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-heading font-semibold text-gray-900 dark:text-white">
            Primary Language
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Choose the primary language for your AI assistant
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {LANGUAGE_OPTIONS.map((language) => (
          <button
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
              formData.primary_language === language.code
                ? 'border-primary-teal bg-primary-teal/10 text-primary-teal'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
            }`}
          >
            {/* Selection indicator */}
            {formData.primary_language === language.code && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary-teal rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}

            {/* Flag and language info */}
            <div className="text-center space-y-2">
              <div className="text-2xl">{language.flag}</div>
              <div className="text-sm font-medium">{language.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {language.nativeName}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Selected Language Info */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="text-2xl">
            {LANGUAGE_OPTIONS.find(lang => lang.code === formData.primary_language)?.flag}
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">
              Selected Language: {LANGUAGE_OPTIONS.find(lang => lang.code === formData.primary_language)?.name}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Your AI assistant will primarily communicate in this language and adapt cultural references accordingly.
            </p>
          </div>
        </div>
      </div>

      {/* Language Features */}
      <div className="mt-6 space-y-3">
        <h4 className="font-medium text-gray-900 dark:text-white">Language Features:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-primary-teal rounded-full mt-2 flex-shrink-0"></div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Cultural Adaptation:</strong> Responses will include appropriate cultural references and context
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-primary-teal rounded-full mt-2 flex-shrink-0"></div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Formal/Informal:</strong> Automatic detection of appropriate formality levels
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-primary-teal rounded-full mt-2 flex-shrink-0"></div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Time Zones:</strong> Responses consider relevant time zones and business hours
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-primary-teal rounded-full mt-2 flex-shrink-0"></div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Multilingual Support:</strong> Can switch languages when requested by users
            </div>
          </div>
        </div>
      </div>

      {/* Language-specific Notes */}
      {getLanguageNotes(formData.primary_language) && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Note:</strong> {getLanguageNotes(formData.primary_language)}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function getLanguageNotes(language: PrimaryLanguage): string | null {
  const notes = {
    'es': 'Spanish responses will consider regional variations and use appropriate formal (usted) or informal (tú) address based on context.',
    'fr': 'French responses will use appropriate formal (vous) or informal (tu) address and consider cultural politeness conventions.',
    'de': 'German responses will use appropriate formal (Sie) or informal (du) address and consider cultural directness preferences.',
    'zh': 'Chinese responses will consider cultural communication styles and appropriate levels of formality.',
    'ja': 'Japanese responses will use appropriate levels of politeness (keigo) and consider cultural context.',
    'ko': 'Korean responses will use appropriate honorific levels and consider cultural communication patterns.',
    'ru': 'Russian responses will use appropriate formal/informal address and consider cultural communication styles.',
    'pt': 'Portuguese responses will consider regional variations and appropriate formality levels.',
    'it': 'Italian responses will use appropriate formal (Lei) or informal (tu) address and cultural expressions.',
    'en': null
  };

  return notes[language] || null;
}