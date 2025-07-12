export interface PlaygroundConfig {
  botPersonality: string;
  welcomeMessage: string;
  language: string;
  knowledgeBaseIds: string[];
  workflows: string[];
  responseStyle: 'professional' | 'casual' | 'friendly';
  tone: 'formal' | 'informal' | 'empathetic' | 'authoritative';
  fallbackBehavior: 'escalate' | 'apologize' | 'redirect' | 'custom';
  customPrompts: Record<string, string>;
  integrationSettings: {
    enableAnalytics: boolean;
    enableSentiment: boolean;
    enableIntentDetection: boolean;
    enableKnowledgeTracking: boolean;
  };
  advancedSettings: {
    maxResponseTime: number;
    confidenceThreshold: number;
    enableContextMemory: boolean;
    maxContextTurns: number;
    enablePersonalization: boolean;
  };
}

export interface PlaygroundConversation {
  id: string;
  user: string;
  bot: string;
  timestamp: string;
  confidence?: number;
  knowledgeSources?: string[];
  responseTimeMs?: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
  intent?: string;
  intentConfidence?: number;
  contextUsed?: boolean;
  escalated?: boolean;
  satisfactionRating?: number;
  metadata?: Record<string, any>;
}

export interface PerformanceAnalysis {
  avgResponseTime: number;
  avgConfidence: number;
  knowledgeCoverage: number;
  totalMessages: number;
  successfulResponses: number;
  escalationRate: number;
  avgSatisfactionRating: number;
  sentimentDistribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
  intentAccuracy: number;
  popularIntents: Array<{
    intent: string;
    count: number;
    confidence: number;
  }>;
  knowledgeGaps: Array<{
    query: string;
    count: number;
    suggestedSources: string[];
  }>;
}

export interface TestResponse {
  message: string;
  confidence: number;
  knowledgeSources: string[];
  responseTimeMs: number;
  intent?: string;
  intentConfidence?: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
  contextUsed?: boolean;
  suggestedActions?: string[];
  escalationReason?: string;
  metadata?: Record<string, any>;
}

export interface SessionExport {
  sessionId: string;
  sessionName: string;
  session: PlaygroundConfig;
  history: PlaygroundConversation[];
  performance: PerformanceAnalysis;
  testScenarios: TestScenario[];
  exportedAt: string;
  version: string;
}

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    expectedConfidence?: number;
    expectedIntent?: string;
    expectedSources?: string[];
  }>;
  expectedOutcome: 'success' | 'escalation' | 'fallback';
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  lastRunAt?: string;
  runCount: number;
  successRate: number;
}

export interface PlaygroundSession {
  id: string;
  sessionName: string;
  config: PlaygroundConfig;
  conversations: PlaygroundConversation[];
  scenarios: TestScenario[];
  performance: PerformanceAnalysis;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
}

export interface LivePlaygroundMetrics {
  activeConversations: number;
  avgResponseTime: number;
  currentConfidence: number;
  messagesPerMinute: number;
  knowledgeHitRate: number;
  currentSentiment: 'positive' | 'negative' | 'neutral';
  intentClassificationRate: number;
  escalationRate: number;
  memoryUsage: number;
  apiCallsPerMinute: number;
} 