// ROMASHKA Test Scenario Service
// Predefined test scenarios for AI playground

import { supabase } from '../lib/supabase';
import { 
  TestScenario, 
  TestScenarioResult,
  PlaygroundSession,
  PlaygroundAPIResponse
} from '../types/playground';
import { playgroundAIService } from './playgroundAIService';

export class TestScenarioService {
  // Predefined test scenarios
  private predefinedScenarios: TestScenario[] = [
    // Basic scenarios
    {
      id: 'basic-product-inquiry',
      name: 'Basic Product Inquiry',
      category: 'customer_service',
      difficulty: 'basic',
      message: 'Hi, I\'m interested in learning more about your product. Can you tell me about the main features?',
      expected_outcome: 'Provide clear information about product features',
      success_criteria: [
        'Responds with product information',
        'Maintains appropriate tone',
        'Asks relevant follow-up questions'
      ],
      tags: ['product', 'inquiry', 'basic']
    },
    {
      id: 'basic-greeting',
      name: 'Basic Greeting',
      category: 'general',
      difficulty: 'basic',
      message: 'Hello! How are you today?',
      expected_outcome: 'Respond with appropriate greeting and offer help',
      success_criteria: [
        'Responds warmly',
        'Offers assistance',
        'Maintains personality'
      ],
      tags: ['greeting', 'basic', 'general']
    },
    {
      id: 'basic-pricing',
      name: 'Basic Pricing Question',
      category: 'sales',
      difficulty: 'basic',
      message: 'What are your pricing options?',
      expected_outcome: 'Provide pricing information or guide to pricing resources',
      success_criteria: [
        'Addresses pricing question',
        'Provides helpful information',
        'Maintains professional tone'
      ],
      tags: ['pricing', 'sales', 'basic']
    },

    // Intermediate scenarios
    {
      id: 'intermediate-technical-issue',
      name: 'Technical Support Issue',
      category: 'technical_support',
      difficulty: 'intermediate',
      message: 'I\'m having trouble with the integration. The API keeps returning a 403 error. Can you help me troubleshoot this?',
      expected_outcome: 'Provide technical troubleshooting steps',
      success_criteria: [
        'Shows technical understanding',
        'Provides specific troubleshooting steps',
        'Maintains appropriate technical depth'
      ],
      tags: ['technical', 'troubleshooting', 'api', 'intermediate']
    },
    {
      id: 'intermediate-billing-dispute',
      name: 'Billing Dispute',
      category: 'customer_service',
      difficulty: 'intermediate',
      message: 'I was charged twice for my subscription this month. This is really frustrating and I need this resolved immediately.',
      expected_outcome: 'Handle billing concern with empathy and clear resolution steps',
      success_criteria: [
        'Shows empathy for frustration',
        'Provides clear resolution steps',
        'Maintains professional composure'
      ],
      tags: ['billing', 'dispute', 'empathy', 'intermediate']
    },
    {
      id: 'intermediate-feature-request',
      name: 'Feature Request',
      category: 'general',
      difficulty: 'intermediate',
      message: 'I love using your product, but I really need a dark mode option. Are there any plans to add this feature?',
      expected_outcome: 'Acknowledge request and provide information about feature development',
      success_criteria: [
        'Acknowledges positive feedback',
        'Addresses feature request appropriately',
        'Maintains engagement'
      ],
      tags: ['feature', 'request', 'feedback', 'intermediate']
    },

    // Advanced scenarios
    {
      id: 'advanced-complex-complaint',
      name: 'Complex Complaint',
      category: 'customer_service',
      difficulty: 'advanced',
      message: 'This is the third time I\'m contacting support about the same issue. Your previous agents promised it would be fixed, but it\'s still not working. I\'m considering canceling my subscription and switching to a competitor. This is completely unacceptable.',
      expected_outcome: 'Handle escalated complaint with high empathy and comprehensive solution',
      success_criteria: [
        'Shows deep empathy and understanding',
        'Acknowledges previous frustrations',
        'Provides comprehensive resolution plan',
        'Maintains professional composure under pressure'
      ],
      tags: ['complaint', 'escalation', 'retention', 'advanced']
    },
    {
      id: 'advanced-technical-integration',
      name: 'Complex Technical Integration',
      category: 'technical_support',
      difficulty: 'advanced',
      message: 'I\'m trying to integrate your API with our existing microservices architecture. We\'re using Kubernetes with istio service mesh, and I\'m getting intermittent timeout errors specifically when making batch requests. The error only occurs during peak traffic hours. I need detailed guidance on rate limiting and best practices for our specific setup.',
      expected_outcome: 'Provide comprehensive technical guidance for complex integration',
      success_criteria: [
        'Demonstrates deep technical understanding',
        'Provides specific solutions for complex scenario',
        'Addresses all technical aspects mentioned'
      ],
      tags: ['technical', 'integration', 'microservices', 'advanced']
    },
    {
      id: 'advanced-sales-objection',
      name: 'Sales Objection Handling',
      category: 'sales',
      difficulty: 'advanced',
      message: 'I\'ve been comparing your solution with your competitors, and frankly, they offer similar features at a lower price point. Your product seems overpriced for what it offers. Why should I choose you over them when I can get the same functionality for 40% less?',
      expected_outcome: 'Address price objection with value proposition and competitive differentiation',
      success_criteria: [
        'Acknowledges price concern professionally',
        'Highlights unique value proposition',
        'Differentiates from competitors',
        'Maintains sales momentum'
      ],
      tags: ['sales', 'objection', 'competitive', 'advanced']
    }
  ];

  /**
   * Get all predefined test scenarios
   */
  getPredefinedScenarios(): TestScenario[] {
    return this.predefinedScenarios;
  }

  /**
   * Get scenarios by category
   */
  getScenariosByCategory(category: string): TestScenario[] {
    return this.predefinedScenarios.filter(scenario => scenario.category === category);
  }

  /**
   * Get scenarios by difficulty
   */
  getScenariosByDifficulty(difficulty: string): TestScenario[] {
    return this.predefinedScenarios.filter(scenario => scenario.difficulty === difficulty);
  }

  /**
   * Get a specific scenario by ID
   */
  getScenarioById(id: string): TestScenario | null {
    return this.predefinedScenarios.find(scenario => scenario.id === id) || null;
  }

  /**
   * Run a test scenario against a bot configuration
   */
  async runTestScenario(
    scenarioId: string,
    session: PlaygroundSession,
    userId: string
  ): Promise<PlaygroundAPIResponse<TestScenarioResult>> {
    try {
      const scenario = this.getScenarioById(scenarioId);
      if (!scenario) {
        return {
          success: false,
          error: 'Scenario not found'
        };
      }

      // Generate AI response
      const aiResponse = await playgroundAIService.generateResponse(
        scenario.message,
        session
      );

      // Evaluate if test passed
      const passed = this.evaluateTestResult(
        scenario,
        aiResponse.response,
        aiResponse.quality_score,
        aiResponse.personality_analysis
      );

      // Create test result
      const testResult: Omit<TestScenarioResult, 'id' | 'created_at'> = {
        session_id: session.id,
        user_id: userId,
        scenario_name: scenario.name,
        scenario_category: scenario.category,
        test_message: scenario.message,
        expected_outcome: scenario.expected_outcome,
        ai_response: aiResponse.response,
        response_time_ms: aiResponse.response_time_ms,
        passed: passed,
        quality_score: aiResponse.quality_score,
        personality_analysis: aiResponse.personality_analysis,
        notes: this.generateTestNotes(scenario, aiResponse, passed)
      };

      // Save to database
      const { data, error } = await supabase
        .from('test_scenario_results')
        .insert([testResult])
        .select()
        .single();

      if (error) {
        console.error('Error saving test scenario result:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as TestScenarioResult,
        message: `Test scenario "${scenario.name}" completed successfully`
      };

    } catch (error) {
      console.error('Error running test scenario:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Run multiple test scenarios
   */
  async runMultipleScenarios(
    scenarioIds: string[],
    session: PlaygroundSession,
    userId: string
  ): Promise<PlaygroundAPIResponse<TestScenarioResult[]>> {
    try {
      const results: TestScenarioResult[] = [];
      const errors: string[] = [];

      for (const scenarioId of scenarioIds) {
        const result = await this.runTestScenario(scenarioId, session, userId);
        
        if (result.success && result.data) {
          results.push(result.data);
        } else {
          errors.push(`Failed to run scenario ${scenarioId}: ${result.error}`);
        }

        // Add small delay between tests to avoid rate limiting
        await this.delay(500);
      }

      return {
        success: true,
        data: results,
        message: `Completed ${results.length} out of ${scenarioIds.length} scenarios`,
        ...(errors.length > 0 && { error: errors.join('; ') })
      };

    } catch (error) {
      console.error('Error running multiple scenarios:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get test results for a session
   */
  async getTestResults(sessionId: string): Promise<PlaygroundAPIResponse<TestScenarioResult[]>> {
    try {
      const { data, error } = await supabase
        .from('test_scenario_results')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching test results:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as TestScenarioResult[]
      };

    } catch (error) {
      console.error('Error fetching test results:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get test results for a user
   */
  async getUserTestResults(userId: string): Promise<PlaygroundAPIResponse<TestScenarioResult[]>> {
    try {
      const { data, error } = await supabase
        .from('test_scenario_results')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user test results:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as TestScenarioResult[]
      };

    } catch (error) {
      console.error('Error fetching user test results:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Evaluate if a test passed based on the response
   */
  private evaluateTestResult(
    scenario: TestScenario,
    response: string,
    qualityScore: number,
    personalityAnalysis: any
  ): boolean {
    // Basic quality threshold
    if (qualityScore < 0.6) {
      return false;
    }

    // Personality alignment threshold
    if (personalityAnalysis.alignment_score < 0.7) {
      return false;
    }

    // Response length check
    if (response.length < 20) {
      return false;
    }

    // Scenario-specific checks
    switch (scenario.difficulty) {
      case 'basic':
        return qualityScore >= 0.6;
      case 'intermediate':
        return qualityScore >= 0.7 && personalityAnalysis.alignment_score >= 0.7;
      case 'advanced':
        return qualityScore >= 0.8 && personalityAnalysis.alignment_score >= 0.8;
      default:
        return qualityScore >= 0.6;
    }
  }

  /**
   * Generate test notes
   */
  private generateTestNotes(
    scenario: TestScenario,
    aiResponse: any,
    passed: boolean
  ): string {
    const notes: string[] = [];

    if (passed) {
      notes.push('✅ Test passed successfully');
    } else {
      notes.push('❌ Test failed');
    }

    notes.push(`Quality Score: ${(aiResponse.quality_score * 100).toFixed(1)}%`);
    notes.push(`Personality Alignment: ${(aiResponse.personality_analysis.alignment_score * 100).toFixed(1)}%`);
    notes.push(`Response Time: ${aiResponse.response_time_ms}ms`);

    // Add scenario-specific notes
    if (scenario.difficulty === 'advanced' && aiResponse.quality_score < 0.8) {
      notes.push('⚠️ Advanced scenario requires higher quality score');
    }

    if (aiResponse.personality_analysis.alignment_score < 0.7) {
      notes.push('⚠️ Personality alignment could be improved');
    }

    if (aiResponse.response_time_ms > 3000) {
      notes.push('⚠️ Response time is slower than optimal');
    }

    return notes.join('\n');
  }

  /**
   * Create custom test scenario
   */
  async createCustomScenario(
    scenario: Omit<TestScenario, 'id'>
  ): TestScenario {
    const customScenario: TestScenario = {
      id: `custom-${Date.now()}`,
      ...scenario
    };

    return customScenario;
  }

  /**
   * Get test statistics for a session
   */
  async getSessionTestStats(sessionId: string): Promise<PlaygroundAPIResponse<{
    total_tests: number;
    passed_tests: number;
    failed_tests: number;
    avg_quality_score: number;
    avg_response_time: number;
    avg_personality_alignment: number;
    tests_by_category: Record<string, number>;
    tests_by_difficulty: Record<string, number>;
  }>> {
    try {
      const results = await this.getTestResults(sessionId);
      
      if (!results.success || !results.data) {
        return {
          success: false,
          error: 'Failed to fetch test results'
        };
      }

      const data = results.data;
      const totalTests = data.length;
      const passedTests = data.filter(result => result.passed).length;
      const failedTests = totalTests - passedTests;

      const avgQualityScore = totalTests > 0 ? 
        data.reduce((sum, result) => sum + result.quality_score, 0) / totalTests : 0;

      const avgResponseTime = totalTests > 0 ? 
        data.reduce((sum, result) => sum + result.response_time_ms, 0) / totalTests : 0;

      const avgPersonalityAlignment = totalTests > 0 ? 
        data.reduce((sum, result) => sum + result.personality_analysis.alignment_score, 0) / totalTests : 0;

      const testsByCategory = data.reduce((acc, result) => {
        acc[result.scenario_category] = (acc[result.scenario_category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const testsByDifficulty = data.reduce((acc, result) => {
        const scenario = this.getScenarioById(result.scenario_name);
        if (scenario) {
          acc[scenario.difficulty] = (acc[scenario.difficulty] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      return {
        success: true,
        data: {
          total_tests: totalTests,
          passed_tests: passedTests,
          failed_tests: failedTests,
          avg_quality_score: avgQualityScore,
          avg_response_time: avgResponseTime,
          avg_personality_alignment: avgPersonalityAlignment,
          tests_by_category: testsByCategory,
          tests_by_difficulty: testsByDifficulty
        }
      };

    } catch (error) {
      console.error('Error getting session test stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete test result
   */
  async deleteTestResult(resultId: string): Promise<PlaygroundAPIResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('test_scenario_results')
        .delete()
        .eq('id', resultId);

      if (error) {
        console.error('Error deleting test result:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: true,
        message: 'Test result deleted successfully'
      };

    } catch (error) {
      console.error('Error deleting test result:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Utility function to add delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const testScenarioService = new TestScenarioService();