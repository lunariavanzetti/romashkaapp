// Playground Configuration Types

export interface BotConfiguration {
  id: string;
  user_id: string;
  bot_name: string;
  avatar_emoji: string;
  personality_traits: PersonalityTraits;
  response_style: ResponseStyle;
  custom_instructions?: string;
  created_at: string;
  updated_at: string;
}

export interface PersonalityTraits {
  formality: number;        // 0-100
  enthusiasm: number;       // 0-100
  technical_depth: number;  // 0-100
  empathy: number;         // 0-100
}

export type ResponseStyle = 'professional' | 'casual' | 'friendly' | 'conversational' | 'concise' | 'detailed';

export interface BotPerformanceMetrics {
  id: string;
  bot_config_id: string;
  test_scenario: string;
  test_message: string;
  response_text: string;
  response_quality_score: number;  // 0-100
  response_time_ms: number;
  customer_satisfaction_rating: number;  // 0-5
  personality_consistency_score: number; // 0-1
  confidence_score: number;  // 0-1
  tokens_used: number;
  tested_at: string;
}

export interface PlaygroundABTest {
  id: string;
  user_id: string;
  test_name: string;
  description?: string;
  config_a_id: string;
  config_b_id: string;
  test_messages: string[];
  status: ABTestStatus;
  results: ABTestResults;
  winner?: 'A' | 'B' | 'tie';
  created_at: string;
  updated_at: string;
}

export type ABTestStatus = 'draft' | 'running' | 'completed' | 'paused';

export interface ABTestResults {
  config_a_metrics: TestMetrics;
  config_b_metrics: TestMetrics;
  statistical_significance: number;
  confidence_interval: number;
  recommendation: string;
}

export interface TestMetrics {
  average_response_time: number;
  average_quality_score: number;
  average_confidence: number;
  personality_consistency: number;
  total_tests: number;
}

export interface TestScenarioResult {
  id: string;
  bot_config_id: string;
  scenario_id: string;
  scenario_name: string;
  test_messages: TestMessage[];
  results: TestResult[];
  average_response_time: number;
  average_quality_score: number;
  average_confidence: number;
  tested_at: string;
}

export interface TestMessage {
  message: string;
  expected_intent?: string;
  expected_tone?: string;
}

export interface TestResult {
  message: string;
  response: string;
  response_time_ms: number;
  quality_score: number;
  confidence_score: number;
  personality_analysis: PersonalityAnalysis;
}

export interface PersonalityAnalysis {
  detected_formality: number;
  detected_enthusiasm: number;
  detected_technical_depth: number;
  detected_empathy: number;
  consistency_score: number;
  alignment_with_config: number;
}

// Playground AI Service Response
export interface PlaygroundAIResponse {
  response: string;
  response_time: number;
  confidence: number;
  personality_score: PersonalityAnalysis;
  tokens_used: number;
  knowledge_sources: string[];
  intent_detected?: string;
  sentiment?: string;
}

// Test Scenarios
export interface TestScenario {
  id: string;
  name: string;
  description: string;
  category: TestScenarioCategory;
  test_messages: TestMessage[];
  expected_behaviors: string[];
  difficulty_level: 'easy' | 'medium' | 'hard';
}

export type TestScenarioCategory = 'product-inquiry' | 'technical-support' | 'billing-questions' | 'general-conversation' | 'complaint-handling' | 'sales-inquiry';

// Legacy Types (keeping for backward compatibility)
export interface PlaygroundConfig {
  botPersonality: string;
  welcomeMessage: string;
  language: string;
  knowledgeBaseIds: string[];
  workflows: string[];
  responseStyle: 'professional' | 'casual' | 'friendly';
}

export interface PlaygroundConversation {
  id: string;
  message: string;
  response: string;
  timestamp: Date;
  confidence?: number;
  processingTime?: number;
}

export interface PerformanceAnalysis {
  avgResponseTime: number;
  avgConfidence: number;
  knowledgeCoverage: number;
  totalMessages: number;
}

export interface TestResponse {
  message: string;
  confidence: number;
  knowledgeSources: string[];
  responseTimeMs: number;
}

export interface SessionExport {
  session: PlaygroundConfig;
  history: PlaygroundConversation[];
  performance: PerformanceAnalysis;
}

// Form and UI Types
export interface BotConfigFormData {
  bot_name: string;
  avatar_emoji: string;
  personality_traits: PersonalityTraits;
  response_style: ResponseStyle;
  custom_instructions?: string;
}

export interface PlaygroundState {
  currentConfig: BotConfiguration | null;
  testHistory: PlaygroundConversation[];
  isLoading: boolean;
  testResponse: string | null;
  selectedScenario: TestScenario | null;
  abTests: PlaygroundABTest[];
  performanceMetrics: BotPerformanceMetrics[];
} 