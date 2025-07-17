import { PlaygroundConfig, PlaygroundConversation, PerformanceAnalysis, TestResponse, SessionExport } from '../types/playground';
import { botConfigurationService } from './botConfigurationService';
import { playgroundAIService } from './playgroundAIService';
import type { BotConfiguration, PlaygroundTestResult } from '../types/botConfiguration';

class PlaygroundService {
  private currentBotConfig: BotConfiguration | null = null;
  private sessionHistory: PlaygroundConversation[] = [];

  async createSession(config: PlaygroundConfig): Promise<string> {
    try {
      // Convert old config format to new bot configuration format
      const botConfig: BotConfiguration = {
        bot_name: 'ROMASHKA Assistant',
        avatar_emoji: '🤖',
        personality_traits: {
          formality: 50,
          enthusiasm: 50,
          technical_depth: 50,
          empathy: 50
        },
        response_style: config.responseStyle === 'professional' ? 'detailed' : 
                       config.responseStyle === 'casual' ? 'conversational' : 'conversational',
        custom_instructions: 'You are a helpful AI customer service assistant.'
      };

      // Save configuration
      this.currentBotConfig = await botConfigurationService.saveBotConfig(botConfig);
      this.sessionHistory = [];

      return this.currentBotConfig.id || 'session-' + Date.now();
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }

  async sendTestMessage(sessionId: string, message: string): Promise<TestResponse> {
    try {
      if (!this.currentBotConfig) {
        // Load or create default configuration
        this.currentBotConfig = await botConfigurationService.loadBotConfig() || 
                               await botConfigurationService.createDefaultConfiguration();
      }

      // Generate real AI response
      const knowledgeContext = playgroundAIService.getDefaultKnowledgeContext();
      const response = await playgroundAIService.generateTestResponse(
        message,
        this.currentBotConfig,
        knowledgeContext
      );

      // Save test result
      if (this.currentBotConfig.id) {
        const testResult: PlaygroundTestResult = {
          bot_config_id: this.currentBotConfig.id,
          test_message: message,
          bot_response: response.response,
          response_time_ms: response.response_time,
          confidence_score: response.confidence / 100,
          personality_analysis: response.personality_score,
          knowledge_sources: response.knowledge_sources
        };

        await botConfigurationService.saveTestResult(testResult);
      }

      // Add to session history
      this.sessionHistory.push({
        user: message,
        bot: response.response,
        timestamp: new Date().toISOString(),
        confidence: response.confidence / 100,
        knowledgeSources: response.knowledge_sources,
        responseTimeMs: response.response_time
      });

      return {
        message: response.response,
        confidence: response.confidence / 100,
        knowledgeSources: response.knowledge_sources,
        responseTimeMs: response.response_time
      };
    } catch (error) {
      console.error('Failed to send test message:', error);
      throw error;
    }
  }

  async getSessionHistory(sessionId: string): Promise<PlaygroundConversation[]> {
    return this.sessionHistory;
  }

  async resetSession(sessionId: string): Promise<void> {
    this.sessionHistory = [];
  }

  async analyzePerformance(sessionId: string): Promise<PerformanceAnalysis> {
    if (this.sessionHistory.length === 0) {
      return {
        avgResponseTime: 0,
        avgConfidence: 0,
        knowledgeCoverage: 0,
        totalMessages: 0
      };
    }

    const totalMessages = this.sessionHistory.length;
    const avgResponseTime = this.sessionHistory.reduce((sum, conv) => sum + (conv.responseTimeMs || 0), 0) / totalMessages;
    const avgConfidence = this.sessionHistory.reduce((sum, conv) => sum + (conv.confidence || 0), 0) / totalMessages;
    
    // Calculate knowledge coverage based on knowledge sources used
    const uniqueKnowledgeSources = new Set();
    this.sessionHistory.forEach(conv => {
      conv.knowledgeSources?.forEach(source => uniqueKnowledgeSources.add(source));
    });
    
    const knowledgeCoverage = Math.min(100, (uniqueKnowledgeSources.size / 10) * 100); // Assuming 10 total knowledge sources

    return {
      avgResponseTime,
      avgConfidence,
      knowledgeCoverage,
      totalMessages
    };
  }

  async exportSession(sessionId: string): Promise<SessionExport> {
    const performance = await this.analyzePerformance(sessionId);
    
    return {
      session: {
        botPersonality: this.currentBotConfig?.bot_name || 'ROMASHKA Assistant',
        welcomeMessage: 'Hello! How can I help you today?',
        language: 'en',
        knowledgeBaseIds: [],
        workflows: [],
        responseStyle: this.currentBotConfig?.response_style || 'conversational'
      },
      history: this.sessionHistory,
      performance
    };
  }

  // New methods for enhanced functionality
  async getCurrentBotConfig(): Promise<BotConfiguration | null> {
    if (!this.currentBotConfig) {
      this.currentBotConfig = await botConfigurationService.loadBotConfig();
    }
    return this.currentBotConfig;
  }

  async updateBotConfig(config: BotConfiguration): Promise<void> {
    this.currentBotConfig = await botConfigurationService.saveBotConfig(config);
  }

  async runScenarioTest(scenarioMessages: string[]): Promise<TestResponse[]> {
    if (!this.currentBotConfig) {
      this.currentBotConfig = await botConfigurationService.loadBotConfig() || 
                             await botConfigurationService.createDefaultConfiguration();
    }

    const results: TestResponse[] = [];
    const knowledgeContext = playgroundAIService.getDefaultKnowledgeContext();

    for (const message of scenarioMessages) {
      try {
        const response = await playgroundAIService.generateTestResponse(
          message,
          this.currentBotConfig,
          knowledgeContext
        );

        results.push({
          message: response.response,
          confidence: response.confidence / 100,
          knowledgeSources: response.knowledge_sources,
          responseTimeMs: response.response_time
        });

        // Add to session history
        this.sessionHistory.push({
          user: message,
          bot: response.response,
          timestamp: new Date().toISOString(),
          confidence: response.confidence / 100,
          knowledgeSources: response.knowledge_sources,
          responseTimeMs: response.response_time
        });
      } catch (error) {
        console.error('Failed to test scenario message:', message, error);
      }
    }

    return results;
  }
}

export default new PlaygroundService(); 