export interface PersonalityTraits {
  formality: number;        // 0-100
  enthusiasm: number;       // 0-100
  technical_depth: number;  // 0-100
  empathy: number;         // 0-100
}

export interface BotConfiguration {
  id?: string;
  user_id?: string;
  bot_name: string;
  avatar_emoji: string;
  personality_traits: PersonalityTraits;
  response_style: 'concise' | 'detailed' | 'conversational';
  custom_instructions?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PersonalityAnalysis {
  formality_score: number;
  enthusiasm_score: number;
  technical_depth_score: number;
  empathy_score: number;
  overall_alignment: number;
  suggestions: string[];
}

export interface BotPerformanceMetric {
  id?: string;
  bot_config_id: string;
  test_scenario?: string;
  response_quality_score?: number;
  response_time_ms: number;
  customer_satisfaction_rating?: number;
  confidence_score?: number;
  personality_analysis?: PersonalityAnalysis;
  tested_at?: string;
}

export interface TestScenario {
  id?: string;
  user_id?: string;
  name: string;
  description?: string;
  user_messages: string[];
  expected_outcomes?: string[];
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ABTestVariant {
  id: string;
  name: string;
  personality_traits: Partial<PersonalityTraits>;
  response_style?: 'concise' | 'detailed' | 'conversational';
  custom_instructions?: string;
  weight: number;
}

export interface ABTestConfiguration {
  id?: string;
  user_id?: string;
  test_name: string;
  description?: string;
  variants: ABTestVariant[];
  metrics: {
    response_time: number;
    satisfaction: number;
    conversions: number;
  };
  is_running?: boolean;
  start_date?: string;
  end_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PlaygroundTestResult {
  id?: string;
  user_id?: string;
  bot_config_id: string;
  test_scenario_id?: string;
  test_message: string;
  bot_response: string;
  response_time_ms: number;
  confidence_score?: number;
  personality_analysis?: PersonalityAnalysis;
  knowledge_sources?: string[];
  created_at?: string;
}

export interface PlaygroundTestResponse {
  response: string;
  response_time: number;
  confidence: number;
  personality_score: PersonalityAnalysis;
  knowledge_sources: string[];
}

export interface BotConfigurationHistory {
  configurations: BotConfiguration[];
  performance_metrics: BotPerformanceMetric[];
  test_results: PlaygroundTestResult[];
}