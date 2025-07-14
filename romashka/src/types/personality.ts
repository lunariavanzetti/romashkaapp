// AI Personality Configuration Types

export interface PersonalityScores {
  formality: number; // 0-100
  enthusiasm: number; // 0-100
  technical_depth: number; // 0-100
  empathy: number; // 0-100
}

export interface BrandVoiceConfig {
  keywords: string[];
  avoid_phrases: string[];
  guidelines: string;
  response_examples: ResponseExample[];
}

export interface ResponseExample {
  scenario: string;
  user_message: string;
  preferred_response: string;
  tone_notes: string;
}

export type TonePreset = 'professional' | 'friendly' | 'casual' | 'technical' | 'supportive';

export type IndustrySetting = 'saas' | 'ecommerce' | 'healthcare' | 'finance' | 'education' | 'real_estate' | 'technology' | 'general';

export type PrimaryLanguage = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'zh' | 'ja' | 'ko';

export interface PersonalityConfig {
  id: string;
  user_id: string;
  bot_name: string;
  avatar_url?: string;
  personality_scores: PersonalityScores;
  primary_language: PrimaryLanguage;
  tone_preset: TonePreset;
  industry_setting: IndustrySetting;
  brand_voice_config: BrandVoiceConfig;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PersonalityPreset {
  id: string;
  name: string;
  industry: IndustrySetting;
  description: string;
  personality_scores: PersonalityScores;
  tone_preset: TonePreset;
  brand_voice_config: BrandVoiceConfig;
  is_default: boolean;
  created_at: string;
}

export interface PersonalityAnalytics {
  id: string;
  user_id: string;
  personality_config_id: string;
  conversation_id?: string;
  interaction_type: InteractionType;
  effectiveness_score?: number;
  customer_satisfaction?: number;
  response_time_improvement?: number;
  analytics_data: Record<string, any>;
  created_at: string;
}

export type InteractionType = 'response_generation' | 'tone_adjustment' | 'language_adaptation' | 'brand_alignment';

// UI-specific types
export interface PersonalitySliderConfig {
  key: keyof PersonalityScores;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  icon: string;
  lowLabel: string;
  highLabel: string;
}

export interface LanguageOption {
  code: PrimaryLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export interface TonePresetOption {
  value: TonePreset;
  label: string;
  description: string;
  icon: string;
  personalityAdjustments: Partial<PersonalityScores>;
}

export interface IndustryOption {
  value: IndustrySetting;
  label: string;
  description: string;
  icon: string;
  preset?: PersonalityPreset;
}

// Form types
export interface PersonalityFormData {
  bot_name: string;
  avatar_url?: string;
  personality_scores: PersonalityScores;
  primary_language: PrimaryLanguage;
  tone_preset: TonePreset;
  industry_setting: IndustrySetting;
  brand_voice_config: BrandVoiceConfig;
}

export interface PersonalityValidationResult {
  isValid: boolean;
  errors: {
    field: string;
    message: string;
  }[];
}

// API response types
export interface PersonalityConfigResponse {
  data: PersonalityConfig;
  success: boolean;
  error?: string;
}

export interface PersonalityPresetsResponse {
  data: PersonalityPreset[];
  success: boolean;
  error?: string;
}

export interface PersonalityAnalyticsResponse {
  data: PersonalityAnalytics[];
  success: boolean;
  error?: string;
}

// Service types
export interface PersonalityProcessingResult {
  processed_prompt: string;
  tone_adjustments: string[];
  language_adaptations: string[];
  brand_alignments: string[];
  confidence_score: number;
  processing_time_ms: number;
}

export interface PersonalityContext {
  personality_config: PersonalityConfig;
  conversation_history: string[];
  customer_sentiment: 'positive' | 'negative' | 'neutral';
  urgency_level: 'low' | 'medium' | 'high';
  business_context: Record<string, any>;
}

// Preview types
export interface PersonalityPreviewData {
  sample_messages: {
    user_message: string;
    ai_response: string;
    explanation: string;
  }[];
  tone_analysis: {
    formality_level: string;
    enthusiasm_level: string;
    technical_depth_level: string;
    empathy_level: string;
  };
  brand_voice_compliance: {
    keywords_used: string[];
    avoided_phrases: string[];
    guidelines_followed: string[];
  };
}

// Constants
export const PERSONALITY_SLIDERS: PersonalitySliderConfig[] = [
  {
    key: 'formality',
    label: 'Formality',
    description: 'How formal or casual the AI should be in its responses',
    min: 0,
    max: 100,
    step: 1,
    icon: 'Briefcase',
    lowLabel: 'Very Casual',
    highLabel: 'Very Formal'
  },
  {
    key: 'enthusiasm',
    label: 'Enthusiasm',
    description: 'How energetic and excited the AI should sound',
    min: 0,
    max: 100,
    step: 1,
    icon: 'Zap',
    lowLabel: 'Very Calm',
    highLabel: 'Very Enthusiastic'
  },
  {
    key: 'technical_depth',
    label: 'Technical Depth',
    description: 'How detailed and technical the explanations should be',
    min: 0,
    max: 100,
    step: 1,
    icon: 'Code',
    lowLabel: 'Simple',
    highLabel: 'Very Technical'
  },
  {
    key: 'empathy',
    label: 'Empathy',
    description: 'How understanding and compassionate the AI should be',
    min: 0,
    max: 100,
    step: 1,
    icon: 'Heart',
    lowLabel: 'Direct',
    highLabel: 'Very Empathetic'
  }
];

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' }
];

export const TONE_PRESETS: TonePresetOption[] = [
  {
    value: 'professional',
    label: 'Professional',
    description: 'Polished, business-appropriate communication',
    icon: 'Briefcase',
    personalityAdjustments: { formality: 75, enthusiasm: 50, technical_depth: 60, empathy: 65 }
  },
  {
    value: 'friendly',
    label: 'Friendly',
    description: 'Warm, approachable, and conversational',
    icon: 'Smile',
    personalityAdjustments: { formality: 45, enthusiasm: 80, technical_depth: 40, empathy: 80 }
  },
  {
    value: 'casual',
    label: 'Casual',
    description: 'Relaxed, informal, and easy-going',
    icon: 'Coffee',
    personalityAdjustments: { formality: 25, enthusiasm: 70, technical_depth: 35, empathy: 70 }
  },
  {
    value: 'technical',
    label: 'Technical',
    description: 'Precise, detailed, and expertise-focused',
    icon: 'Code',
    personalityAdjustments: { formality: 80, enthusiasm: 40, technical_depth: 90, empathy: 50 }
  },
  {
    value: 'supportive',
    label: 'Supportive',
    description: 'Caring, understanding, and helpful',
    icon: 'Heart',
    personalityAdjustments: { formality: 60, enthusiasm: 60, technical_depth: 45, empathy: 95 }
  }
];

export const INDUSTRY_OPTIONS: IndustryOption[] = [
  {
    value: 'saas',
    label: 'SaaS',
    description: 'Software as a Service businesses',
    icon: 'Cloud'
  },
  {
    value: 'ecommerce',
    label: 'E-commerce',
    description: 'Online retail and shopping platforms',
    icon: 'ShoppingCart'
  },
  {
    value: 'healthcare',
    label: 'Healthcare',
    description: 'Medical and health services',
    icon: 'Activity'
  },
  {
    value: 'finance',
    label: 'Finance',
    description: 'Banking and financial services',
    icon: 'DollarSign'
  },
  {
    value: 'education',
    label: 'Education',
    description: 'Learning and educational institutions',
    icon: 'BookOpen'
  },
  {
    value: 'real_estate',
    label: 'Real Estate',
    description: 'Property and real estate services',
    icon: 'Home'
  },
  {
    value: 'technology',
    label: 'Technology',
    description: 'Tech companies and startups',
    icon: 'Cpu'
  },
  {
    value: 'general',
    label: 'General',
    description: 'General business and services',
    icon: 'Building'
  }
];

// Default values
export const DEFAULT_PERSONALITY_CONFIG: Omit<PersonalityConfig, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  bot_name: 'ROMASHKA Assistant',
  avatar_url: undefined,
  personality_scores: {
    formality: 50,
    enthusiasm: 60,
    technical_depth: 50,
    empathy: 70
  },
  primary_language: 'en',
  tone_preset: 'professional',
  industry_setting: 'general',
  brand_voice_config: {
    keywords: [],
    avoid_phrases: [],
    guidelines: '',
    response_examples: []
  },
  is_active: true
};

export const DEFAULT_RESPONSE_EXAMPLE: ResponseExample = {
  scenario: '',
  user_message: '',
  preferred_response: '',
  tone_notes: ''
};