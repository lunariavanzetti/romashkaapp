import type { 
  PlaygroundConfig, 
  PlaygroundConversation, 
  PerformanceAnalysis, 
  TestResponse, 
  SessionExport,
  TestScenario,
  PlaygroundSession,
  LivePlaygroundMetrics
} from '../types/playground';
import { supabase } from './supabaseClient';
import openaiService from './openaiService';

class PlaygroundService {
  private readonly sessionCache = new Map<string, PlaygroundSession>();
  private readonly metricsCache = new Map<string, LivePlaygroundMetrics>();

  async createSession(config: PlaygroundConfig, sessionName?: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('playground_sessions')
        .insert([
          {
            session_name: sessionName || `Session ${Date.now()}`,
            bot_configuration: config,
            test_conversations: [],
            performance_metrics: {
              avgResponseTime: 0,
              avgConfidence: 0,
              knowledgeCoverage: 0,
              totalMessages: 0,
              successfulResponses: 0,
              escalationRate: 0,
              avgSatisfactionRating: 0,
              sentimentDistribution: { positive: 0, negative: 0, neutral: 0 },
              intentAccuracy: 0,
              popularIntents: [],
              knowledgeGaps: []
            }
          }
        ])
        .select('id')
        .single();

      if (error) throw error;

      // Initialize session in cache
      const session: PlaygroundSession = {
        id: data.id,
        sessionName: sessionName || `Session ${Date.now()}`,
        config,
        conversations: [],
        scenarios: [],
        performance: {
          avgResponseTime: 0,
          avgConfidence: 0,
          knowledgeCoverage: 0,
          totalMessages: 0,
          successfulResponses: 0,
          escalationRate: 0,
          avgSatisfactionRating: 0,
          sentimentDistribution: { positive: 0, negative: 0, neutral: 0 },
          intentAccuracy: 0,
          popularIntents: [],
          knowledgeGaps: []
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString()
      };

      this.sessionCache.set(data.id, session);
      return data.id;
    } catch (error) {
      console.error('Error creating playground session:', error);
      throw error;
    }
  }

  async sendTestMessage(sessionId: string, message: string): Promise<TestResponse> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const startTime = Date.now();
      
      // Simulate AI response with enhanced analysis
      const response = await this.generateAIResponse(session.config, message, session.conversations);
      const responseTime = Date.now() - startTime;

      // Create conversation record
      const conversation: PlaygroundConversation = {
        id: crypto.randomUUID(),
        user: message,
        bot: response.message,
        timestamp: new Date().toISOString(),
        confidence: response.confidence,
        knowledgeSources: response.knowledgeSources,
        responseTimeMs: responseTime,
        sentiment: response.sentiment,
        intent: response.intent,
        intentConfidence: response.intentConfidence,
        contextUsed: response.contextUsed,
        escalated: response.escalationReason ? true : false,
        metadata: response.metadata
      };

      // Update session
      session.conversations.push(conversation);
      session.lastActivityAt = new Date().toISOString();
      await this.updateSession(sessionId, session);

      // Update live metrics
      this.updateLiveMetrics(sessionId, conversation);

      return {
        message: response.message,
        confidence: response.confidence,
        knowledgeSources: response.knowledgeSources,
        responseTimeMs: responseTime,
        intent: response.intent,
        intentConfidence: response.intentConfidence,
        sentiment: response.sentiment,
        contextUsed: response.contextUsed,
        suggestedActions: response.suggestedActions,
        escalationReason: response.escalationReason,
        metadata: response.metadata
      };
    } catch (error) {
      console.error('Error sending test message:', error);
      throw error;
    }
  }

  async getSessionHistory(sessionId: string): Promise<PlaygroundConversation[]> {
    try {
      const session = await this.getSession(sessionId);
      return session?.conversations || [];
    } catch (error) {
      console.error('Error getting session history:', error);
      throw error;
    }
  }

  async resetSession(sessionId: string): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      session.conversations = [];
      session.performance = {
        avgResponseTime: 0,
        avgConfidence: 0,
        knowledgeCoverage: 0,
        totalMessages: 0,
        successfulResponses: 0,
        escalationRate: 0,
        avgSatisfactionRating: 0,
        sentimentDistribution: { positive: 0, negative: 0, neutral: 0 },
        intentAccuracy: 0,
        popularIntents: [],
        knowledgeGaps: []
      };

      await this.updateSession(sessionId, session);
      this.metricsCache.delete(sessionId);
    } catch (error) {
      console.error('Error resetting session:', error);
      throw error;
    }
  }

  async analyzePerformance(sessionId: string): Promise<PerformanceAnalysis> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const conversations = session.conversations;
      if (conversations.length === 0) {
        return session.performance;
      }

      const analysis: PerformanceAnalysis = {
        avgResponseTime: this.calculateAverage(conversations.map(c => c.responseTimeMs || 0)),
        avgConfidence: this.calculateAverage(conversations.map(c => c.confidence || 0)),
        knowledgeCoverage: this.calculateKnowledgeCoverage(conversations),
        totalMessages: conversations.length,
        successfulResponses: conversations.filter(c => c.confidence && c.confidence > 0.7).length,
        escalationRate: (conversations.filter(c => c.escalated).length / conversations.length) * 100,
        avgSatisfactionRating: this.calculateAverage(conversations.map(c => c.satisfactionRating || 0).filter(r => r > 0)),
        sentimentDistribution: this.calculateSentimentDistribution(conversations),
        intentAccuracy: this.calculateIntentAccuracy(conversations),
        popularIntents: this.calculatePopularIntents(conversations),
        knowledgeGaps: this.identifyKnowledgeGaps(conversations)
      };

      // Update session performance
      session.performance = analysis;
      await this.updateSession(sessionId, session);

      return analysis;
    } catch (error) {
      console.error('Error analyzing performance:', error);
      throw error;
    }
  }

  async exportSession(sessionId: string): Promise<SessionExport> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const performance = await this.analyzePerformance(sessionId);

      return {
        sessionId,
        sessionName: session.sessionName,
        session: session.config,
        history: session.conversations,
        performance,
        testScenarios: session.scenarios,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
    } catch (error) {
      console.error('Error exporting session:', error);
      throw error;
    }
  }

  async createTestScenario(sessionId: string, scenario: Omit<TestScenario, 'id' | 'createdAt' | 'runCount' | 'successRate'>): Promise<TestScenario> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const newScenario: TestScenario = {
        ...scenario,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        runCount: 0,
        successRate: 0
      };

      session.scenarios.push(newScenario);
      await this.updateSession(sessionId, session);

      return newScenario;
    } catch (error) {
      console.error('Error creating test scenario:', error);
      throw error;
    }
  }

  async runTestScenario(sessionId: string, scenarioId: string): Promise<{ success: boolean; results: TestResponse[] }> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const scenario = session.scenarios.find(s => s.id === scenarioId);
      if (!scenario) {
        throw new Error('Scenario not found');
      }

      const results: TestResponse[] = [];
      let success = true;

      for (const message of scenario.messages) {
        if (message.role === 'user') {
          const response = await this.sendTestMessage(sessionId, message.content);
          results.push(response);

          // Validate against expectations
          if (message.expectedConfidence && response.confidence < message.expectedConfidence) {
            success = false;
          }
          if (message.expectedIntent && response.intent !== message.expectedIntent) {
            success = false;
          }
        }
      }

      // Update scenario statistics
      scenario.runCount++;
      scenario.lastRunAt = new Date().toISOString();
      if (success) {
        scenario.successRate = ((scenario.successRate * (scenario.runCount - 1)) + 100) / scenario.runCount;
      } else {
        scenario.successRate = (scenario.successRate * (scenario.runCount - 1)) / scenario.runCount;
      }

      await this.updateSession(sessionId, session);

      return { success, results };
    } catch (error) {
      console.error('Error running test scenario:', error);
      throw error;
    }
  }

  async getLiveMetrics(sessionId: string): Promise<LivePlaygroundMetrics> {
    try {
      const cached = this.metricsCache.get(sessionId);
      if (cached) {
        return cached;
      }

      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const metrics = this.calculateLiveMetrics(session);
      this.metricsCache.set(sessionId, metrics);
      return metrics;
    } catch (error) {
      console.error('Error getting live metrics:', error);
      throw error;
    }
  }

  async updateBotConfiguration(sessionId: string, config: Partial<PlaygroundConfig>): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      session.config = { ...session.config, ...config };
      await this.updateSession(sessionId, session);
    } catch (error) {
      console.error('Error updating bot configuration:', error);
      throw error;
    }
  }

  private async getSession(sessionId: string): Promise<PlaygroundSession | null> {
    // Check cache first
    const cached = this.sessionCache.get(sessionId);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const { data, error } = await supabase
      .from('playground_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error || !data) {
      return null;
    }

    const session: PlaygroundSession = {
      id: data.id,
      sessionName: data.session_name,
      config: data.bot_configuration,
      conversations: data.test_conversations || [],
      scenarios: [],
      performance: data.performance_metrics || {
        avgResponseTime: 0,
        avgConfidence: 0,
        knowledgeCoverage: 0,
        totalMessages: 0,
        successfulResponses: 0,
        escalationRate: 0,
        avgSatisfactionRating: 0,
        sentimentDistribution: { positive: 0, negative: 0, neutral: 0 },
        intentAccuracy: 0,
        popularIntents: [],
        knowledgeGaps: []
      },
      isActive: true,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      lastActivityAt: data.updated_at
    };

    this.sessionCache.set(sessionId, session);
    return session;
  }

  private async updateSession(sessionId: string, session: PlaygroundSession): Promise<void> {
    const { error } = await supabase
      .from('playground_sessions')
      .update({
        session_name: session.sessionName,
        bot_configuration: session.config,
        test_conversations: session.conversations,
        performance_metrics: session.performance,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) {
      throw error;
    }

    this.sessionCache.set(sessionId, session);
  }

  private async generateAIResponse(config: PlaygroundConfig, message: string, context: PlaygroundConversation[]): Promise<TestResponse> {
    // Simulate AI response based on configuration
    const responseTime = Math.random() * 2000 + 500; // 500ms - 2.5s
    const confidence = Math.random() * 0.4 + 0.6; // 0.6 - 1.0
    
    const intents = ['greeting', 'question', 'complaint', 'compliment', 'request', 'goodbye'];
    const sentiments = ['positive', 'negative', 'neutral'] as const;
    
    const intent = intents[Math.floor(Math.random() * intents.length)];
    const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
    
    let botMessage = `I understand you're asking about "${message}". `;
    
    switch (config.responseStyle) {
      case 'professional':
        botMessage += "I'll be happy to assist you with this inquiry.";
        break;
      case 'casual':
        botMessage += "Sure thing! Let me help you out with that.";
        break;
      case 'friendly':
        botMessage += "I'd love to help you with this! 😊";
        break;
    }

    const knowledgeSources = config.knowledgeBaseIds.slice(0, Math.floor(Math.random() * 3) + 1);
    
    return {
      message: botMessage,
      confidence,
      knowledgeSources,
      responseTimeMs: responseTime,
      intent,
      intentConfidence: Math.random() * 0.3 + 0.7,
      sentiment,
      contextUsed: context.length > 0 && Math.random() > 0.3,
      suggestedActions: this.generateSuggestedActions(intent, sentiment),
      escalationReason: confidence < 0.3 ? 'Low confidence response' : undefined,
      metadata: {
        modelUsed: 'gpt-4',
        processingTime: responseTime,
        tokensUsed: Math.floor(Math.random() * 100) + 50
      }
    };
  }

  private generateSuggestedActions(intent: string, sentiment: string): string[] {
    const actions: string[] = [];
    
    if (intent === 'complaint' && sentiment === 'negative') {
      actions.push('Escalate to human agent', 'Offer compensation', 'Schedule follow-up');
    } else if (intent === 'question') {
      actions.push('Provide documentation link', 'Offer live demo', 'Schedule consultation');
    } else if (intent === 'compliment') {
      actions.push('Thank customer', 'Request testimonial', 'Offer additional services');
    }
    
    return actions;
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateKnowledgeCoverage(conversations: PlaygroundConversation[]): number {
    const totalWithSources = conversations.filter(c => c.knowledgeSources && c.knowledgeSources.length > 0).length;
    return conversations.length > 0 ? (totalWithSources / conversations.length) * 100 : 0;
  }

  private calculateSentimentDistribution(conversations: PlaygroundConversation[]): { positive: number; negative: number; neutral: number } {
    const distribution = { positive: 0, negative: 0, neutral: 0 };
    
    conversations.forEach(c => {
      if (c.sentiment) {
        distribution[c.sentiment]++;
      }
    });
    
    return distribution;
  }

  private calculateIntentAccuracy(conversations: PlaygroundConversation[]): number {
    const withIntent = conversations.filter(c => c.intent && c.intentConfidence && c.intentConfidence > 0.7);
    return conversations.length > 0 ? (withIntent.length / conversations.length) * 100 : 0;
  }

  private calculatePopularIntents(conversations: PlaygroundConversation[]): Array<{ intent: string; count: number; confidence: number }> {
    const intentMap = new Map<string, { count: number; totalConfidence: number }>();
    
    conversations.forEach(c => {
      if (c.intent && c.intentConfidence) {
        const existing = intentMap.get(c.intent) || { count: 0, totalConfidence: 0 };
        intentMap.set(c.intent, {
          count: existing.count + 1,
          totalConfidence: existing.totalConfidence + c.intentConfidence
        });
      }
    });
    
    return Array.from(intentMap.entries()).map(([intent, data]) => ({
      intent,
      count: data.count,
      confidence: data.totalConfidence / data.count
    })).sort((a, b) => b.count - a.count);
  }

  private identifyKnowledgeGaps(conversations: PlaygroundConversation[]): Array<{ query: string; count: number; suggestedSources: string[] }> {
    const lowConfidenceMessages = conversations.filter(c => c.confidence && c.confidence < 0.5);
    const gapMap = new Map<string, number>();
    
    lowConfidenceMessages.forEach(c => {
      const query = c.user.toLowerCase();
      gapMap.set(query, (gapMap.get(query) || 0) + 1);
    });
    
    return Array.from(gapMap.entries()).map(([query, count]) => ({
      query,
      count,
      suggestedSources: ['FAQ', 'Product Documentation', 'Training Materials']
    })).sort((a, b) => b.count - a.count);
  }

  private calculateLiveMetrics(session: PlaygroundSession): LivePlaygroundMetrics {
    const recentConversations = session.conversations.filter(c => 
      Date.now() - new Date(c.timestamp).getTime() < 5 * 60 * 1000 // Last 5 minutes
    );
    
    return {
      activeConversations: recentConversations.length,
      avgResponseTime: this.calculateAverage(recentConversations.map(c => c.responseTimeMs || 0)),
      currentConfidence: this.calculateAverage(recentConversations.map(c => c.confidence || 0)),
      messagesPerMinute: recentConversations.length / 5,
      knowledgeHitRate: this.calculateKnowledgeCoverage(recentConversations),
      currentSentiment: this.getMostRecentSentiment(recentConversations),
      intentClassificationRate: this.calculateIntentAccuracy(recentConversations),
      escalationRate: (recentConversations.filter(c => c.escalated).length / Math.max(recentConversations.length, 1)) * 100,
      memoryUsage: Math.random() * 100, // Simulated
      apiCallsPerMinute: recentConversations.length * 2 // Simulated
    };
  }

  private getMostRecentSentiment(conversations: PlaygroundConversation[]): 'positive' | 'negative' | 'neutral' {
    const recent = conversations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    return recent?.sentiment || 'neutral';
  }

  private updateLiveMetrics(sessionId: string, conversation: PlaygroundConversation): void {
    // Update cached metrics
    const session = this.sessionCache.get(sessionId);
    if (session) {
      const metrics = this.calculateLiveMetrics(session);
      this.metricsCache.set(sessionId, metrics);
    }
  }
}

export default new PlaygroundService(); 