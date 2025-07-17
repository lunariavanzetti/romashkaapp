import { 
  TestScenario, 
  TestScenarioResult, 
  BotConfiguration,
  TestScenarioCategory,
  TestMessage
} from '../types/playground';
import { playgroundAIService } from './playgroundAIService';
import { botConfigurationService } from './botConfigurationService';

export class TestScenarioService {
  private scenarios: Map<string, TestScenario> = new Map();

  constructor() {
    this.initializeScenarios();
  }

  /**
   * Initialize predefined test scenarios
   */
  private initializeScenarios(): void {
    const scenarios: TestScenario[] = [
      {
        id: 'product-inquiry-basic',
        name: 'Product Inquiry - Basic',
        description: 'Customer asking about product features and pricing',
        category: 'product-inquiry',
        difficulty_level: 'easy',
        test_messages: [
          { message: 'What are your pricing plans?', expected_intent: 'pricing_inquiry' },
          { message: 'Can you tell me about your features?', expected_intent: 'feature_inquiry' },
          { message: 'Do you offer enterprise features?', expected_intent: 'enterprise_inquiry' }
        ],
        expected_behaviors: ['helpful', 'informative', 'sales-oriented']
      },
      {
        id: 'product-inquiry-advanced',
        name: 'Product Inquiry - Advanced',
        description: 'Complex product questions requiring detailed knowledge',
        category: 'product-inquiry',
        difficulty_level: 'hard',
        test_messages: [
          { message: 'How does your API rate limiting work and what are the exact limits?', expected_intent: 'technical_inquiry' },
          { message: 'Can I get a demo of your product for my team of 50 people?', expected_intent: 'demo_request' },
          { message: 'What integrations do you support and do you have webhooks?', expected_intent: 'integration_inquiry' }
        ],
        expected_behaviors: ['technical', 'detailed', 'solution-focused']
      },
      {
        id: 'technical-support-basic',
        name: 'Technical Support - Basic',
        description: 'Common technical issues and troubleshooting',
        category: 'technical-support',
        difficulty_level: 'medium',
        test_messages: [
          { message: 'I cannot log into my account', expected_intent: 'login_issue' },
          { message: 'The app keeps crashing on my phone', expected_intent: 'technical_issue' },
          { message: 'How do I reset my password?', expected_intent: 'password_reset' }
        ],
        expected_behaviors: ['empathetic', 'solution-focused', 'technical']
      },
      {
        id: 'technical-support-advanced',
        name: 'Technical Support - Advanced',
        description: 'Complex technical problems requiring deep troubleshooting',
        category: 'technical-support',
        difficulty_level: 'hard',
        test_messages: [
          { message: 'My integration stopped working after the latest API update', expected_intent: 'integration_issue' },
          { message: 'I\'m getting a 403 error when trying to access the dashboard', expected_intent: 'access_error' },
          { message: 'The webhook is not receiving data, but the logs show it\'s being sent', expected_intent: 'webhook_issue' }
        ],
        expected_behaviors: ['technical', 'methodical', 'solution-focused']
      },
      {
        id: 'billing-questions-basic',
        name: 'Billing Questions - Basic',
        description: 'Common billing and payment inquiries',
        category: 'billing-questions',
        difficulty_level: 'easy',
        test_messages: [
          { message: 'Why was I charged twice this month?', expected_intent: 'billing_inquiry' },
          { message: 'How do I cancel my subscription?', expected_intent: 'cancellation_request' },
          { message: 'Can I get a refund for last month?', expected_intent: 'refund_request' }
        ],
        expected_behaviors: ['careful', 'policy-aware', 'empathetic']
      },
      {
        id: 'billing-questions-complex',
        name: 'Billing Questions - Complex',
        description: 'Complex billing scenarios and edge cases',
        category: 'billing-questions',
        difficulty_level: 'hard',
        test_messages: [
          { message: 'I was charged for overages but I don\'t think I exceeded my limits', expected_intent: 'billing_dispute' },
          { message: 'Can I change my billing cycle from monthly to annual mid-subscription?', expected_intent: 'billing_change' },
          { message: 'I need a detailed invoice breakdown for our accounting department', expected_intent: 'invoice_request' }
        ],
        expected_behaviors: ['careful', 'detailed', 'policy-aware']
      },
      {
        id: 'complaint-handling',
        name: 'Complaint Handling',
        description: 'Handling customer complaints and negative feedback',
        category: 'complaint-handling',
        difficulty_level: 'hard',
        test_messages: [
          { message: 'Your service is terrible and I want to speak to a manager!', expected_intent: 'complaint', expected_tone: 'angry' },
          { message: 'I\'ve been waiting 3 days for support and no one has responded', expected_intent: 'escalation_request', expected_tone: 'frustrated' },
          { message: 'This is the worst customer service I\'ve ever experienced', expected_intent: 'complaint', expected_tone: 'angry' }
        ],
        expected_behaviors: ['empathetic', 'de-escalating', 'solution-focused']
      },
      {
        id: 'sales-inquiry',
        name: 'Sales Inquiry',
        description: 'Sales-focused conversations and lead qualification',
        category: 'sales-inquiry',
        difficulty_level: 'medium',
        test_messages: [
          { message: 'I\'m interested in your enterprise plan for my company', expected_intent: 'sales_inquiry' },
          { message: 'Can you help me understand which plan would be best for us?', expected_intent: 'plan_recommendation' },
          { message: 'Do you offer custom pricing for large organizations?', expected_intent: 'pricing_negotiation' }
        ],
        expected_behaviors: ['sales-oriented', 'consultative', 'helpful']
      },
      {
        id: 'general-conversation',
        name: 'General Conversation',
        description: 'Casual conversation and general inquiries',
        category: 'general-conversation',
        difficulty_level: 'easy',
        test_messages: [
          { message: 'Hi there! How are you today?', expected_intent: 'greeting' },
          { message: 'What can you help me with?', expected_intent: 'capabilities_inquiry' },
          { message: 'Thank you for your help!', expected_intent: 'gratitude' }
        ],
        expected_behaviors: ['friendly', 'welcoming', 'helpful']
      }
    ];

    scenarios.forEach(scenario => {
      this.scenarios.set(scenario.id, scenario);
    });
  }

  /**
   * Get all available test scenarios
   */
  getAllScenarios(): TestScenario[] {
    return Array.from(this.scenarios.values());
  }

  /**
   * Get scenarios by category
   */
  getScenariosByCategory(category: TestScenarioCategory): TestScenario[] {
    return Array.from(this.scenarios.values()).filter(
      scenario => scenario.category === category
    );
  }

  /**
   * Get scenarios by difficulty level
   */
  getScenariosByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): TestScenario[] {
    return Array.from(this.scenarios.values()).filter(
      scenario => scenario.difficulty_level === difficulty
    );
  }

  /**
   * Get a specific scenario by ID
   */
  getScenario(scenarioId: string): TestScenario | null {
    return this.scenarios.get(scenarioId) || null;
  }

  /**
   * Run a specific test scenario
   */
  async runTestScenario(
    scenarioId: string,
    botConfig: BotConfiguration
  ): Promise<TestScenarioResult> {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw new Error(`Test scenario '${scenarioId}' not found`);
    }

    return await playgroundAIService.runTestScenario(scenario, botConfig);
  }

  /**
   * Run all scenarios for a bot configuration
   */
  async runAllScenarios(botConfig: BotConfiguration): Promise<{
    results: TestScenarioResult[];
    summary: {
      total_scenarios: number;
      average_response_time: number;
      average_quality_score: number;
      average_confidence: number;
      performance_by_category: { [category: string]: number };
      performance_by_difficulty: { [difficulty: string]: number };
    };
  }> {
    const results: TestScenarioResult[] = [];
    const allScenarios = this.getAllScenarios();

    // Run all scenarios sequentially to avoid overwhelming the API
    for (const scenario of allScenarios) {
      try {
        const result = await playgroundAIService.runTestScenario(scenario, botConfig);
        results.push(result);
        
        // Add small delay between scenarios to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to run scenario ${scenario.id}:`, error);
      }
    }

    // Calculate summary statistics
    const summary = this.calculateScenarioSummary(results);

    return { results, summary };
  }

  /**
   * Calculate summary statistics for scenario results
   */
  private calculateScenarioSummary(results: TestScenarioResult[]) {
    if (results.length === 0) {
      return {
        total_scenarios: 0,
        average_response_time: 0,
        average_quality_score: 0,
        average_confidence: 0,
        performance_by_category: {},
        performance_by_difficulty: {}
      };
    }

    const totalResponseTime = results.reduce((sum, r) => sum + r.average_response_time, 0);
    const totalQuality = results.reduce((sum, r) => sum + r.average_quality_score, 0);
    const totalConfidence = results.reduce((sum, r) => sum + r.average_confidence, 0);

    // Group by category and difficulty
    const categoryGroups: { [key: string]: TestScenarioResult[] } = {};
    const difficultyGroups: { [key: string]: TestScenarioResult[] } = {};

    results.forEach(result => {
      const scenario = this.scenarios.get(result.scenario_id);
      if (scenario) {
        // Group by category
        if (!categoryGroups[scenario.category]) {
          categoryGroups[scenario.category] = [];
        }
        categoryGroups[scenario.category].push(result);

        // Group by difficulty
        if (!difficultyGroups[scenario.difficulty_level]) {
          difficultyGroups[scenario.difficulty_level] = [];
        }
        difficultyGroups[scenario.difficulty_level].push(result);
      }
    });

    // Calculate averages by category
    const performanceByCategory: { [category: string]: number } = {};
    Object.keys(categoryGroups).forEach(category => {
      const categoryResults = categoryGroups[category];
      const avgQuality = categoryResults.reduce((sum, r) => sum + r.average_quality_score, 0) / categoryResults.length;
      performanceByCategory[category] = Math.round(avgQuality);
    });

    // Calculate averages by difficulty
    const performanceByDifficulty: { [difficulty: string]: number } = {};
    Object.keys(difficultyGroups).forEach(difficulty => {
      const difficultyResults = difficultyGroups[difficulty];
      const avgQuality = difficultyResults.reduce((sum, r) => sum + r.average_quality_score, 0) / difficultyResults.length;
      performanceByDifficulty[difficulty] = Math.round(avgQuality);
    });

    return {
      total_scenarios: results.length,
      average_response_time: Math.round(totalResponseTime / results.length),
      average_quality_score: Math.round(totalQuality / results.length),
      average_confidence: Math.round((totalConfidence / results.length) * 100) / 100,
      performance_by_category: performanceByCategory,
      performance_by_difficulty: performanceByDifficulty
    };
  }

  /**
   * Get performance insights based on scenario results
   */
  getPerformanceInsights(results: TestScenarioResult[]): string[] {
    const insights: string[] = [];
    const summary = this.calculateScenarioSummary(results);

    // Response time insights
    if (summary.average_response_time > 3000) {
      insights.push('Response times are slower than optimal. Consider simplifying personality settings or custom instructions.');
    } else if (summary.average_response_time < 1500) {
      insights.push('Excellent response times! Your configuration is well-optimized.');
    }

    // Quality insights
    if (summary.average_quality_score < 70) {
      insights.push('Response quality could be improved. Review your personality settings and custom instructions.');
    } else if (summary.average_quality_score > 85) {
      insights.push('Outstanding response quality! Your bot is performing excellently.');
    }

    // Category-specific insights
    if (summary.performance_by_category['complaint-handling'] && summary.performance_by_category['complaint-handling'] < 70) {
      insights.push('Consider increasing empathy settings for better complaint handling.');
    }

    if (summary.performance_by_category['technical-support'] && summary.performance_by_category['technical-support'] < 70) {
      insights.push('Technical support responses could be improved. Consider increasing technical depth settings.');
    }

    // Difficulty-specific insights
    if (summary.performance_by_difficulty['hard'] && summary.performance_by_difficulty['hard'] < 60) {
      insights.push('Performance on complex scenarios needs improvement. Consider adding more detailed custom instructions.');
    }

    if (insights.length === 0) {
      insights.push('Your bot configuration is performing well across all test scenarios!');
    }

    return insights;
  }

  /**
   * Create a custom test scenario
   */
  createCustomScenario(
    name: string,
    description: string,
    category: TestScenarioCategory,
    testMessages: TestMessage[],
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ): TestScenario {
    const customScenario: TestScenario = {
      id: `custom_${Date.now()}`,
      name: name,
      description: description,
      category: category,
      test_messages: testMessages,
      expected_behaviors: [],
      difficulty_level: difficulty
    };

    this.scenarios.set(customScenario.id, customScenario);
    return customScenario;
  }

  /**
   * Remove a custom scenario
   */
  removeCustomScenario(scenarioId: string): boolean {
    if (scenarioId.startsWith('custom_')) {
      return this.scenarios.delete(scenarioId);
    }
    return false; // Don't allow deletion of predefined scenarios
  }
}

// Create singleton instance
export const testScenarioService = new TestScenarioService();