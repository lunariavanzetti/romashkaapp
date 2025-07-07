export interface PlaygroundConfig {
  botPersonality: string;
  welcomeMessage: string;
  language: string;
  knowledgeBaseIds: string[];
  workflows: string[];
  responseStyle: 'professional' | 'casual' | 'friendly';
}

export interface PlaygroundConversation {
  user: string;
  bot: string;
  timestamp: string;
  confidence?: number;
  knowledgeSources?: string[];
  responseTimeMs?: number;
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