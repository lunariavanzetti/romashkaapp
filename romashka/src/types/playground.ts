// ROMASHKA AI Playground Types
// Updated to work with existing database schema

export interface PersonalityTraits {
  formality: number;      // 0-100
  enthusiasm: number;     // 0-100
  technical_depth: number; // 0-100
  empathy: number;        // 0-100
}

export type ResponseStyle = 'professional' | 'casual' | 'friendly' | 'conversational' | 'concise' | 'detailed';

export type AIModel = 'gpt-4o-mini' | 'gpt-4' | 'gpt-3.5-turbo';

// Extended playground_sessions table (matches database schema)
export interface PlaygroundSession {
  id: string;
  user_id: string;
  session_name: string;
  bot_name: string;
  bot_avatar_url?: string;
  bot_configuration: {
    model: AIModel;
    temperature: number;
    max_tokens: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
  };
  personality_traits: PersonalityTraits;
  response_style: ResponseStyle;
  ai_model: AIModel;
  system_prompt?: string;
  is_active: boolean;
  last_tested_at?: string;
  test_count: number;
  test_conversations: PlaygroundConversation[];
  performance_metrics: {
    avg_response_time?: number;
    avg_quality_score?: number;
    total_tests?: number;
    total_tokens?: number;
    total_cost?: number;
  };
  created_at: string;
  updated_at: string;
}

export interface PlaygroundConversation {
  id: string;
  message: string;
  response: string;
  timestamp: string;
  response_time_ms: number;
  quality_score?: number;
  confidence_score?: number;
  personality_analysis?: PersonalityAnalysis;
}

export interface BotPerformanceMetrics {
  id: string;
  session_id: string;
  user_id: string;
  test_message: string;
  ai_response: string;
  response_time_ms: number;
  quality_score: number;
  confidence_score: number;
  personality_alignment: PersonalityAnalysis;
  tokens_used: number;
  cost_usd: number;
  error_details?: any;
  created_at: string;
}

export interface PersonalityAnalysis {
  formality: number;
  enthusiasm: number;
  technical_depth: number;
  empathy: number;
  alignment_score: number;
  analysis_notes?: string;
}

export interface PlaygroundAIResponse {
  response: string;
  response_time_ms: number;
  quality_score: number;
  confidence_score: number;
  personality_analysis: PersonalityAnalysis;
  tokens_used: number;
  cost_usd: number;
  error?: string;
}

export interface TestScenario {
  id: string;
  name: string;
  category: 'customer_service' | 'technical_support' | 'sales' | 'general';
  difficulty: 'basic' | 'intermediate' | 'advanced';
  message: string;
  expected_outcome: string;
  success_criteria: string[];
  tags: string[];
}

export interface TestScenarioResult {
  id: string;
  session_id: string;
  user_id: string;
  scenario_name: string;
  scenario_category: string;
  test_message: string;
  expected_outcome: string;
  ai_response: string;
  response_time_ms: number;
  passed: boolean;
  quality_score: number;
  personality_analysis: PersonalityAnalysis;
  notes?: string;
  created_at: string;
}

export interface PlaygroundABTest {
  id: string;
  user_id: string;
  test_name: string;
  control_session_id: string;
  variant_session_id: string;
  test_messages: string[];
  status: 'running' | 'completed' | 'paused' | 'cancelled';
  sample_size: number;
  current_responses: number;
  control_metrics: TestMetrics;
  variant_metrics: TestMetrics;
  statistical_significance: number;
  winner?: 'control' | 'variant' | 'inconclusive';
  confidence_interval: {
    lower: number;
    upper: number;
  };
  started_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TestMetrics {
  avg_response_time: number;
  avg_quality_score: number;
  avg_confidence_score: number;
  avg_personality_alignment: number;
  total_responses: number;
  total_tokens: number;
  total_cost: number;
  error_rate: number;
}

export interface ABTestResults {
  test_id: string;
  control_config: PlaygroundSession;
  variant_config: PlaygroundSession;
  results: {
    control: TestMetrics;
    variant: TestMetrics;
    improvement: {
      response_time: number;
      quality_score: number;
      confidence_score: number;
      personality_alignment: number;
    };
    statistical_significance: number;
    winner: 'control' | 'variant' | 'inconclusive';
    recommendation: string;
  };
}

// Form interfaces for UI
export interface PlaygroundConfigForm {
  bot_name: string;
  bot_avatar_url?: string;
  personality_traits: PersonalityTraits;
  response_style: ResponseStyle;
  ai_model: AIModel;
  system_prompt?: string;
  bot_configuration: {
    temperature: number;
    max_tokens: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
  };
}

export interface TestMessageForm {
  message: string;
  expected_outcome?: string;
  test_scenario?: string;
}

export interface ABTestForm {
  test_name: string;
  control_session_id: string;
  variant_session_id: string;
  test_messages: string[];
  sample_size: number;
}

// API Response interfaces
export interface PlaygroundAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PlaygroundStats {
  total_sessions: number;
  total_tests: number;
  avg_response_time: number;
  avg_quality_score: number;
  active_ab_tests: number;
  total_tokens_used: number;
  total_cost: number;
  top_performing_configs: PlaygroundSession[];
  recent_test_results: TestScenarioResult[];
}

// Constants
export const DEFAULT_PERSONALITY_TRAITS: PersonalityTraits = {
  formality: 70,
  enthusiasm: 60,
  technical_depth: 80,
  empathy: 75,
};

export const DEFAULT_BOT_CONFIG = {
  model: 'gpt-4o-mini' as AIModel,
  temperature: 0.7,
  max_tokens: 500,
  top_p: 1.0,
  frequency_penalty: 0.0,
  presence_penalty: 0.0,
};

export const RESPONSE_STYLES: { value: ResponseStyle; label: string; description: string }[] = [
  { value: 'professional', label: 'Professional', description: 'Formal, business-appropriate tone' },
  { value: 'casual', label: 'Casual', description: 'Relaxed, conversational tone' },
  { value: 'friendly', label: 'Friendly', description: 'Warm, approachable tone' },
  { value: 'conversational', label: 'Conversational', description: 'Natural, engaging dialogue' },
  { value: 'concise', label: 'Concise', description: 'Brief, to-the-point responses' },
  { value: 'detailed', label: 'Detailed', description: 'Comprehensive, thorough explanations' },
];

export const AI_MODELS: { value: AIModel; label: string; description: string }[] = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Fast, cost-effective for most tasks' },
  { value: 'gpt-4', label: 'GPT-4', description: 'Most capable model for complex tasks' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'Good balance of speed and capability' },
];

export const PERSONALITY_TRAIT_DESCRIPTIONS = {
  formality: 'How formal or informal the assistant should be',
  enthusiasm: 'How energetic and positive the assistant should sound',
  technical_depth: 'How detailed technical explanations should be',
  empathy: 'How understanding and emotionally supportive the assistant should be',
};

export const SCENARIO_CATEGORIES = {
  customer_service: 'Customer Service',
  technical_support: 'Technical Support',
  sales: 'Sales & Marketing',
  general: 'General Conversation',
};

export const DIFFICULTY_LEVELS = {
  basic: 'Basic',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}; 