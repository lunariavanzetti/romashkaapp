// ROMASHKA Test Scenario Service
// Execute predefined test scenarios with real AI testing
// Updated to work with test_scenarios and test_scenario_results tables

import { supabase } from '../lib/supabase';
import { 
  TestScenario, 
  TestScenarioResult, 
  BotConfiguration,
  PersonalityAnalysis,
  PlaygroundAPIResponse,
  QUALITY_THRESHOLDS,
  RESPONSE_TIME_THRESHOLDS,
  PERSONALITY_ALIGNMENT_THRESHOLDS
} from '../types/playground';
import { playgroundAIService } from './playgroundAIService';

export class TestScenarioService {
  // Get all available test scenarios
  async getTestScenarios(): Promise<PlaygroundAPIResponse<TestScenario[]>> {
    try {
      const { data, error } = await supabase
        .from('test_scenarios')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('difficulty', { ascending: true });

      if (error) {
        console.error('Error fetching test scenarios:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as TestScenario[]
      };
    } catch (error) {
      console.error('Error fetching test scenarios:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get test scenarios by category
  async getTestScenariosByCategory(category: string): Promise<PlaygroundAPIResponse<TestScenario[]>> {
    try {
      const { data, error } = await supabase
        .from('test_scenarios')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('difficulty', { ascending: true });

      if (error) {
        console.error('Error fetching test scenarios by category:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as TestScenario[]
      };
    } catch (error) {
      console.error('Error fetching test scenarios by category:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get test scenarios by difficulty
  async getTestScenariosByDifficulty(difficulty: string): Promise<PlaygroundAPIResponse<TestScenario[]>> {
    try {
      const { data, error } = await supabase
        .from('test_scenarios')
        .select('*')
        .eq('difficulty', difficulty)
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (error) {
        console.error('Error fetching test scenarios by difficulty:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as TestScenario[]
      };
    } catch (error) {
      console.error('Error fetching test scenarios by difficulty:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Run a single test scenario
  async runTestScenario(
    scenarioId: string,
    botConfig: BotConfiguration,
    userId: string
  ): Promise<PlaygroundAPIResponse<TestScenarioResult>> {
    try {
      // Get the test scenario
      const { data: scenario, error: scenarioError } = await supabase
        .from('test_scenarios')
        .select('*')
        .eq('id', scenarioId)
        .single();

      if (scenarioError) {
        console.error('Error fetching test scenario:', scenarioError);
        return {
          success: false,
          error: scenarioError.message
        };
      }

      // Generate AI response
      const aiResponse = await playgroundAIService.generateResponse(
        scenario.test_message,
        botConfig
      );

      // Evaluate the test result
      const passed = await this.evaluateTestResult(
        scenario,
        aiResponse.response,
        aiResponse.quality_score,
        aiResponse.personality_analysis,
        aiResponse.response_time_ms
      );

      // Create test scenario result
      const resultData = {
        bot_config_id: botConfig.id,
        scenario_id: scenarioId,
        user_id: userId,
        test_message: scenario.test_message,
        ai_response: aiResponse.response,
        response_time_ms: aiResponse.response_time_ms,
        passed: passed,
        quality_score: aiResponse.quality_score,
        confidence_score: aiResponse.confidence_score,
        personality_analysis: aiResponse.personality_analysis,
        evaluation_notes: this.generateEvaluationNotes(scenario, aiResponse, passed),
        tokens_used: aiResponse.tokens_used,
        cost_usd: aiResponse.cost_usd
      };

      // Save test result to database
      const { data: result, error: saveError } = await supabase
        .from('test_scenario_results')
        .insert([resultData])
        .select()
        .single();

      if (saveError) {
        console.error('Error saving test result:', saveError);
        return {
          success: false,
          error: saveError.message
        };
      }

      // Update scenario usage count
      await this.updateScenarioUsageCount(scenarioId);

      return {
        success: true,
        data: result as TestScenarioResult,
        message: `Test scenario "${scenario.name}" completed ${passed ? 'successfully' : 'with issues'}`
      };

    } catch (error) {
      console.error('Error running test scenario:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Run multiple test scenarios
  async runMultipleTestScenarios(
    scenarioIds: string[],
    botConfig: BotConfiguration,
    userId: string
  ): Promise<PlaygroundAPIResponse<TestScenarioResult[]>> {
    try {
      const results: TestScenarioResult[] = [];
      const errors: string[] = [];

      // Run each scenario
      for (const scenarioId of scenarioIds) {
        const result = await this.runTestScenario(scenarioId, botConfig, userId);
        
        if (result.success && result.data) {
          results.push(result.data);
        } else {
          errors.push(`Scenario ${scenarioId}: ${result.error}`);
        }
      }

      if (errors.length > 0 && results.length === 0) {
        return {
          success: false,
          error: `All scenarios failed: ${errors.join(', ')}`
        };
      }

      return {
        success: true,
        data: results,
        message: `Completed ${results.length} of ${scenarioIds.length} scenarios${errors.length > 0 ? ` (${errors.length} failed)` : ''}`
      };

    } catch (error) {
      console.error('Error running multiple test scenarios:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Run all scenarios in a category
  async runScenariosByCategory(
    category: string,
    botConfig: BotConfiguration,
    userId: string
  ): Promise<PlaygroundAPIResponse<TestScenarioResult[]>> {
    try {
      const scenariosResult = await this.getTestScenariosByCategory(category);
      
      if (!scenariosResult.success || !scenariosResult.data) {
        return {
          success: false,
          error: `Failed to get scenarios for category ${category}`
        };
      }

      const scenarioIds = scenariosResult.data.map(s => s.id);
      return this.runMultipleTestScenarios(scenarioIds, botConfig, userId);

    } catch (error) {
      console.error('Error running scenarios by category:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Run all scenarios of a difficulty level
  async runScenariosByDifficulty(
    difficulty: string,
    botConfig: BotConfiguration,
    userId: string
  ): Promise<PlaygroundAPIResponse<TestScenarioResult[]>> {
    try {
      const scenariosResult = await this.getTestScenariosByDifficulty(difficulty);
      
      if (!scenariosResult.success || !scenariosResult.data) {
        return {
          success: false,
          error: `Failed to get scenarios for difficulty ${difficulty}`
        };
      }

      const scenarioIds = scenariosResult.data.map(s => s.id);
      return this.runMultipleTestScenarios(scenarioIds, botConfig, userId);

    } catch (error) {
      console.error('Error running scenarios by difficulty:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get test results for a bot configuration
  async getTestResults(
    botConfigId: string,
    limit: number = 50
  ): Promise<PlaygroundAPIResponse<TestScenarioResult[]>> {
    try {
      const { data, error } = await supabase
        .from('test_scenario_results')
        .select(`
          *,
          test_scenarios:scenario_id (
            name,
            category,
            difficulty,
            description
          )
        `)
        .eq('bot_config_id', botConfigId)
        .order('created_at', { ascending: false })
        .limit(limit);

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

  // Get test results by scenario
  async getTestResultsByScenario(
    scenarioId: string,
    limit: number = 50
  ): Promise<PlaygroundAPIResponse<TestScenarioResult[]>> {
    try {
      const { data, error } = await supabase
        .from('test_scenario_results')
        .select(`
          *,
          bot_configurations:bot_config_id (
            bot_name,
            personality_traits,
            response_style
          )
        `)
        .eq('scenario_id', scenarioId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching test results by scenario:', error);
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
      console.error('Error fetching test results by scenario:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get performance summary for a bot configuration
  async getConfigurationPerformance(
    botConfigId: string
  ): Promise<PlaygroundAPIResponse<{
    total_tests: number;
    passed_tests: number;
    pass_rate: number;
    avg_quality_score: number;
    avg_response_time: number;
    avg_confidence_score: number;
    by_category: Record<string, {
      total: number;
      passed: number;
      pass_rate: number;
      avg_quality: number;
    }>;
    by_difficulty: Record<string, {
      total: number;
      passed: number;
      pass_rate: number;
      avg_quality: number;
    }>;
  }>> {
    try {
      const { data, error } = await supabase
        .from('test_scenario_results')
        .select(`
          *,
          test_scenarios:scenario_id (
            category,
            difficulty
          )
        `)
        .eq('bot_config_id', botConfigId);

      if (error) {
        console.error('Error fetching configuration performance:', error);
        return {
          success: false,
          error: error.message
        };
      }

      const results = data as any[];
      
      // Calculate overall statistics
      const totalTests = results.length;
      const passedTests = results.filter(r => r.passed).length;
      const passRate = totalTests > 0 ? passedTests / totalTests : 0;
      const avgQualityScore = totalTests > 0 ? 
        results.reduce((sum, r) => sum + r.quality_score, 0) / totalTests : 0;
      const avgResponseTime = totalTests > 0 ? 
        results.reduce((sum, r) => sum + r.response_time_ms, 0) / totalTests : 0;
      const avgConfidenceScore = totalTests > 0 ? 
        results.reduce((sum, r) => sum + r.confidence_score, 0) / totalTests : 0;

      // Calculate by category
      const byCategory: Record<string, any> = {};
      results.forEach(result => {
        const category = result.test_scenarios?.category || 'unknown';
        if (!byCategory[category]) {
          byCategory[category] = {
            total: 0,
            passed: 0,
            quality_sum: 0
          };
        }
        byCategory[category].total++;
        if (result.passed) byCategory[category].passed++;
        byCategory[category].quality_sum += result.quality_score;
      });

      // Calculate by difficulty
      const byDifficulty: Record<string, any> = {};
      results.forEach(result => {
        const difficulty = result.test_scenarios?.difficulty || 'unknown';
        if (!byDifficulty[difficulty]) {
          byDifficulty[difficulty] = {
            total: 0,
            passed: 0,
            quality_sum: 0
          };
        }
        byDifficulty[difficulty].total++;
        if (result.passed) byDifficulty[difficulty].passed++;
        byDifficulty[difficulty].quality_sum += result.quality_score;
      });

      // Format results
      const formattedByCategory: Record<string, any> = {};
      Object.entries(byCategory).forEach(([category, stats]) => {
        formattedByCategory[category] = {
          total: stats.total,
          passed: stats.passed,
          pass_rate: stats.total > 0 ? stats.passed / stats.total : 0,
          avg_quality: stats.total > 0 ? stats.quality_sum / stats.total : 0
        };
      });

      const formattedByDifficulty: Record<string, any> = {};
      Object.entries(byDifficulty).forEach(([difficulty, stats]) => {
        formattedByDifficulty[difficulty] = {
          total: stats.total,
          passed: stats.passed,
          pass_rate: stats.total > 0 ? stats.passed / stats.total : 0,
          avg_quality: stats.total > 0 ? stats.quality_sum / stats.total : 0
        };
      });

      return {
        success: true,
        data: {
          total_tests: totalTests,
          passed_tests: passedTests,
          pass_rate: passRate,
          avg_quality_score: avgQualityScore,
          avg_response_time: avgResponseTime,
          avg_confidence_score: avgConfidenceScore,
          by_category: formattedByCategory,
          by_difficulty: formattedByDifficulty
        }
      };

    } catch (error) {
      console.error('Error calculating configuration performance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Evaluate if a test result passes based on scenario difficulty
  private async evaluateTestResult(
    scenario: TestScenario,
    response: string,
    qualityScore: number,
    personalityAnalysis: PersonalityAnalysis,
    responseTimeMs: number
  ): Promise<boolean> {
    try {
      // Use the database function for evaluation
      const { data, error } = await supabase
        .rpc('evaluate_test_scenario_result', {
          scenario_id: scenario.id,
          quality_score: qualityScore,
          personality_alignment: personalityAnalysis,
          response_time_ms: responseTimeMs
        });

      if (error) {
        console.error('Error evaluating test result:', error);
        // Fallback to client-side evaluation
        return this.fallbackEvaluateTestResult(scenario, qualityScore, personalityAnalysis, responseTimeMs);
      }

      return data;
    } catch (error) {
      console.error('Error evaluating test result:', error);
      return this.fallbackEvaluateTestResult(scenario, qualityScore, personalityAnalysis, responseTimeMs);
    }
  }

  // Fallback evaluation if database function fails
  private fallbackEvaluateTestResult(
    scenario: TestScenario,
    qualityScore: number,
    personalityAnalysis: PersonalityAnalysis,
    responseTimeMs: number
  ): boolean {
    const qualityThreshold = QUALITY_THRESHOLDS[scenario.difficulty as keyof typeof QUALITY_THRESHOLDS];
    const timeThreshold = RESPONSE_TIME_THRESHOLDS[scenario.difficulty as keyof typeof RESPONSE_TIME_THRESHOLDS];
    const alignmentThreshold = PERSONALITY_ALIGNMENT_THRESHOLDS[scenario.difficulty as keyof typeof PERSONALITY_ALIGNMENT_THRESHOLDS];

    return qualityScore >= qualityThreshold && 
           responseTimeMs <= timeThreshold && 
           personalityAnalysis.alignment_score >= alignmentThreshold;
  }

  // Generate evaluation notes
  private generateEvaluationNotes(
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

    // Quality score feedback
    if (aiResponse.quality_score >= 0.8) {
      notes.push('🎯 Excellent response quality');
    } else if (aiResponse.quality_score >= 0.6) {
      notes.push('✅ Good response quality');
    } else {
      notes.push('⚠️ Response quality needs improvement');
    }

    // Response time feedback
    if (aiResponse.response_time_ms <= 2000) {
      notes.push('⚡ Fast response time');
    } else if (aiResponse.response_time_ms <= 4000) {
      notes.push('⏱️ Acceptable response time');
    } else {
      notes.push('🐌 Slow response time');
    }

    // Personality alignment feedback
    if (aiResponse.personality_analysis.alignment_score >= 0.8) {
      notes.push('🎭 Excellent personality alignment');
    } else if (aiResponse.personality_analysis.alignment_score >= 0.6) {
      notes.push('🎭 Good personality alignment');
    } else {
      notes.push('🎭 Personality alignment needs improvement');
    }

    return notes.join('\n');
  }

  // Update scenario usage count
  private async updateScenarioUsageCount(scenarioId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('test_scenarios')
        .update({ usage_count: supabase.raw('usage_count + 1') })
        .eq('id', scenarioId);

      if (error) {
        console.error('Error updating scenario usage count:', error);
      }
    } catch (error) {
      console.error('Error updating scenario usage count:', error);
    }
  }

  // Create a custom test scenario
  async createCustomScenario(
    userId: string,
    scenario: {
      name: string;
      description?: string;
      category: string;
      difficulty: string;
      test_message: string;
      expected_outcome?: string;
      success_criteria: string[];
      tags: string[];
    }
  ): Promise<PlaygroundAPIResponse<TestScenario>> {
    try {
      const { data, error } = await supabase
        .from('test_scenarios')
        .insert([{
          ...scenario,
          created_by: userId,
          is_active: true,
          usage_count: 0
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating custom scenario:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as TestScenario,
        message: 'Custom test scenario created successfully'
      };
    } catch (error) {
      console.error('Error creating custom scenario:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get user's custom scenarios
  async getUserCustomScenarios(userId: string): Promise<PlaygroundAPIResponse<TestScenario[]>> {
    try {
      const { data, error } = await supabase
        .from('test_scenarios')
        .select('*')
        .eq('created_by', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user custom scenarios:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as TestScenario[]
      };
    } catch (error) {
      console.error('Error fetching user custom scenarios:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get scenario statistics
  async getScenarioStatistics(): Promise<PlaygroundAPIResponse<{
    total_scenarios: number;
    by_category: Record<string, number>;
    by_difficulty: Record<string, number>;
    most_used: TestScenario[];
    recent_results: TestScenarioResult[];
  }>> {
    try {
      // Get all scenarios
      const { data: scenarios, error: scenariosError } = await supabase
        .from('test_scenarios')
        .select('*')
        .eq('is_active', true);

      if (scenariosError) {
        throw scenariosError;
      }

      // Get recent results
      const { data: recentResults, error: resultsError } = await supabase
        .from('test_scenario_results')
        .select(`
          *,
          test_scenarios:scenario_id (
            name,
            category,
            difficulty
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (resultsError) {
        throw resultsError;
      }

      // Calculate statistics
      const totalScenarios = scenarios?.length || 0;
      
      const byCategory: Record<string, number> = {};
      const byDifficulty: Record<string, number> = {};
      
      scenarios?.forEach(scenario => {
        byCategory[scenario.category] = (byCategory[scenario.category] || 0) + 1;
        byDifficulty[scenario.difficulty] = (byDifficulty[scenario.difficulty] || 0) + 1;
      });

      // Get most used scenarios
      const mostUsed = scenarios?.
        sort((a, b) => b.usage_count - a.usage_count).
        slice(0, 5) || [];

      return {
        success: true,
        data: {
          total_scenarios: totalScenarios,
          by_category: byCategory,
          by_difficulty: byDifficulty,
          most_used: mostUsed,
          recent_results: recentResults || []
        }
      };
    } catch (error) {
      console.error('Error fetching scenario statistics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const testScenarioService = new TestScenarioService();