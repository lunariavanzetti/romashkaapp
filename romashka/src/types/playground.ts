// ROMASHKA AI Playground Types
// Updated to match the exact database schema from migration 009_ai_playground_implementation.sql

export interface PersonalityTraits {
  formality: number;      // 0-100
  enthusiasm: number;     // 0-100
  technical_depth: number; // 0-100
  empathy: number;        // 0-100
}

export type ResponseStyle = 'professional' | 'casual' | 'friendly' | 'conversational' | 'concise' | 'detailed';

export type AIModel = 'gpt-4o-mini' | 'gpt-4' | 'gpt-3.5-turbo';

export interface ModelParameters {
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
}

// Bot configurations table (matches database schema)
export interface BotConfiguration {
  id: string;
  user_id: string;
  bot_name: string;
  avatar_emoji: string;
  avatar_url?: string;
  personality_traits: PersonalityTraits;
  response_style: ResponseStyle;
  ai_model: AIModel;
  model_parameters: ModelParameters;
  system_prompt: string;
  custom_instructions?: string;
  is_active: boolean;
  test_count: number;
  last_tested_at?: string;
  performance_summary: {
    avg_response_time?: number;
    avg_quality_score?: number;
    avg_confidence_score?: number;
    total_tokens?: number;
    total_cost?: number;
  };
  created_at: string;
  updated_at: string;
}

// Bot performance metrics table (matches database schema)
export interface BotPerformanceMetrics {
  id: string;
  bot_config_id: string;
  user_id: string;
  test_scenario: string;
  test_message: string;
  ai_response: string;
  response_time_ms: number;
  quality_score: number;
  confidence_score: number;
  personality_alignment: PersonalityAnalysis;
  tokens_used: number;
  cost_usd: number;
  model_used: string;
  prompt_tokens: number;
  completion_tokens: number;
  error_details?: any;
  created_at: string;
}

// Playground A/B tests table (matches database schema)
export interface PlaygroundABTest {
  id: string;
  user_id: string;
  test_name: string;
  description?: string;
  control_config_id: string;
  variant_config_id: string;
  test_messages: string[];
  sample_size: number;
  status: 'running' | 'completed' | 'paused' | 'cancelled';
  current_responses: number;
  control_metrics: TestMetrics;
  variant_metrics: TestMetrics;
  statistical_significance: number;
  winner?: 'control' | 'variant' | 'inconclusive';
  confidence_interval: {
    lower: number;
    upper: number;
  };
  results_summary: any;
  started_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

// Test scenarios table (matches database schema)
export interface TestScenario {
  id: string;
  name: string;
  description?: string;
  category: 'customer_service' | 'technical_support' | 'sales' | 'general';
  difficulty: 'basic' | 'intermediate' | 'advanced';
  test_message: string;
  expected_outcome?: string;
  success_criteria: string[];
  evaluation_rubric: any;
  tags: string[];
  is_active: boolean;
  usage_count: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Test scenario results table (matches database schema)
export interface TestScenarioResult {
  id: string;
  bot_config_id: string;
  scenario_id: string;
  user_id: string;
  test_message: string;
  ai_response: string;
  response_time_ms: number;
  passed: boolean;
  quality_score: number;
  confidence_score: number;
  personality_analysis: PersonalityAnalysis;
  evaluation_notes?: string;
  tokens_used: number;
  cost_usd: number;
  created_at: string;
}

// Playground sessions table (matches database schema)
export interface PlaygroundSession {
  id: string;
  user_id: string;
  bot_config_id: string;
  session_name: string;
  session_type: 'testing' | 'ab_test' | 'scenario_run';
  test_conversations: PlaygroundConversation[];
  session_metrics: any;
  duration_seconds: number;
  started_at: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
}

// Supporting interfaces
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
  model_used: string;
  prompt_tokens: number;
  completion_tokens: number;
  error?: string;
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
  control_config: BotConfiguration;
  variant_config: BotConfiguration;
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
export interface BotConfigurationForm {
  bot_name: string;
  avatar_emoji: string;
  avatar_url?: string;
  personality_traits: PersonalityTraits;
  response_style: ResponseStyle;
  ai_model: AIModel;
  model_parameters: ModelParameters;
  system_prompt: string;
  custom_instructions?: string;
}

export interface TestMessageForm {
  message: string;
  expected_outcome?: string;
  test_scenario?: string;
}

export interface ABTestForm {
  test_name: string;
  description?: string;
  control_config_id: string;
  variant_config_id: string;
  test_messages: string[];
  sample_size: number;
}

export interface PlaygroundSessionForm {
  session_name: string;
  bot_config_id: string;
  session_type: 'testing' | 'ab_test' | 'scenario_run';
}

// API Response interfaces
export interface PlaygroundAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PlaygroundStats {
  total_configurations: number;
  total_tests: number;
  total_sessions: number;
  avg_response_time: number;
  avg_quality_score: number;
  active_ab_tests: number;
  total_tokens_used: number;
  total_cost: number;
  top_performing_configs: BotConfiguration[];
  recent_test_results: TestScenarioResult[];
}

// Constants
export const DEFAULT_PERSONALITY_TRAITS: PersonalityTraits = {
  formality: 70,
  enthusiasm: 60,
  technical_depth: 80,
  empathy: 75,
};

export const DEFAULT_MODEL_PARAMETERS: ModelParameters = {
  temperature: 0.7,
  max_tokens: 500,
  top_p: 1.0,
  frequency_penalty: 0.0,
  presence_penalty: 0.0,
};

export const DEFAULT_SYSTEM_PROMPT = 'You are ROMASHKA Assistant, a professional customer support AI. Be helpful, accurate, and maintain a professional tone while being empathetic to customer needs.';

export const RESPONSE_STYLES: { value: ResponseStyle; label: string; description: string }[] = [
  { value: 'professional', label: 'Professional', description: 'Formal, business-appropriate tone' },
  { value: 'casual', label: 'Casual', description: 'Relaxed, conversational tone' },
  { value: 'friendly', label: 'Friendly', description: 'Warm, approachable tone' },
  { value: 'conversational', label: 'Conversational', description: 'Natural, engaging dialogue' },
  { value: 'concise', label: 'Concise', description: 'Brief, to-the-point responses' },
  { value: 'detailed', label: 'Detailed', description: 'Comprehensive, thorough explanations' },
];

export const AI_MODELS: { value: AIModel; label: string; description: string; cost_per_1k_tokens: number }[] = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Fast, cost-effective for most tasks', cost_per_1k_tokens: 0.015 },
  { value: 'gpt-4', label: 'GPT-4', description: 'Most capable model for complex tasks', cost_per_1k_tokens: 0.03 },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'Good balance of speed and capability', cost_per_1k_tokens: 0.0015 },
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

export const SESSION_TYPES = {
  testing: 'Testing',
  ab_test: 'A/B Test',
  scenario_run: 'Scenario Run',
};

// Quality score thresholds
export const QUALITY_THRESHOLDS = {
  basic: 0.6,
  intermediate: 0.7,
  advanced: 0.8,
};

// Response time thresholds (in milliseconds)
export const RESPONSE_TIME_THRESHOLDS = {
  basic: 5000,
  intermediate: 4000,
  advanced: 3000,
};

// Personality alignment thresholds
export const PERSONALITY_ALIGNMENT_THRESHOLDS = {
  basic: 0.6,
  intermediate: 0.7,
  advanced: 0.8,
}; 