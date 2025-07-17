// ROMASHKA A/B Testing Service
// Statistical A/B testing for bot configurations
// Updated to work with playground_ab_tests table and BotConfiguration objects

import { supabase } from '../lib/supabase';
import { 
  PlaygroundABTest, 
  ABTestResults, 
  BotConfiguration,
  ABTestForm,
  TestMetrics,
  PlaygroundAPIResponse
} from '../types/playground';
import { playgroundAIService } from './playgroundAIService';
import { botConfigurationService } from './botConfigurationService';

export class ABTestingService {
  // Create a new A/B test
  async createABTest(
    userId: string,
    testForm: ABTestForm
  ): Promise<PlaygroundAPIResponse<PlaygroundABTest>> {
    try {
      // Validate that both configurations exist
      const [controlResult, variantResult] = await Promise.all([
        botConfigurationService.getBotConfiguration(testForm.control_config_id),
        botConfigurationService.getBotConfiguration(testForm.variant_config_id)
      ]);

      if (!controlResult.success || !variantResult.success) {
        return {
          success: false,
          error: 'One or both bot configurations not found'
        };
      }

      const testData = {
        user_id: userId,
        test_name: testForm.test_name,
        description: testForm.description,
        control_config_id: testForm.control_config_id,
        variant_config_id: testForm.variant_config_id,
        test_messages: testForm.test_messages,
        sample_size: testForm.sample_size,
        status: 'running',
        current_responses: 0,
        control_metrics: {},
        variant_metrics: {},
        statistical_significance: 0.0,
        confidence_interval: {},
        results_summary: {}
      };

      const { data, error } = await supabase
        .from('playground_ab_tests')
        .insert([testData])
        .select()
        .single();

      if (error) {
        console.error('Error creating A/B test:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as PlaygroundABTest,
        message: 'A/B test created successfully'
      };
    } catch (error) {
      console.error('Error creating A/B test:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get all A/B tests for a user
  async getABTests(userId: string): Promise<PlaygroundAPIResponse<PlaygroundABTest[]>> {
    try {
      const { data, error } = await supabase
        .from('playground_ab_tests')
        .select(`
          *,
          control_config:control_config_id (
            bot_name,
            personality_traits,
            response_style
          ),
          variant_config:variant_config_id (
            bot_name,
            personality_traits,
            response_style
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching A/B tests:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as PlaygroundABTest[]
      };
    } catch (error) {
      console.error('Error fetching A/B tests:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get a specific A/B test
  async getABTest(testId: string): Promise<PlaygroundAPIResponse<PlaygroundABTest>> {
    try {
      const { data, error } = await supabase
        .from('playground_ab_tests')
        .select(`
          *,
          control_config:control_config_id (
            bot_name,
            personality_traits,
            response_style,
            ai_model,
            model_parameters,
            system_prompt
          ),
          variant_config:variant_config_id (
            bot_name,
            personality_traits,
            response_style,
            ai_model,
            model_parameters,
            system_prompt
          )
        `)
        .eq('id', testId)
        .single();

      if (error) {
        console.error('Error fetching A/B test:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as PlaygroundABTest
      };
    } catch (error) {
      console.error('Error fetching A/B test:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Run A/B test
  async runABTest(
    testId: string,
    userId: string
  ): Promise<PlaygroundAPIResponse<PlaygroundABTest>> {
    try {
      // Get the test configuration
      const testResult = await this.getABTest(testId);
      
      if (!testResult.success || !testResult.data) {
        return {
          success: false,
          error: 'A/B test not found'
        };
      }

      const test = testResult.data;
      
      if (test.status !== 'running') {
        return {
          success: false,
          error: 'A/B test is not in running state'
        };
      }

      // Get the bot configurations
      const [controlResult, variantResult] = await Promise.all([
        botConfigurationService.getBotConfiguration(test.control_config_id),
        botConfigurationService.getBotConfiguration(test.variant_config_id)
      ]);

      if (!controlResult.success || !variantResult.success) {
        return {
          success: false,
          error: 'Failed to fetch bot configurations'
        };
      }

      const controlConfig = controlResult.data!;
      const variantConfig = variantResult.data!;

      // Run tests for both configurations
      const controlResults = await this.runTestsForConfiguration(
        controlConfig,
        test.test_messages,
        userId
      );

      const variantResults = await this.runTestsForConfiguration(
        variantConfig,
        test.test_messages,
        userId
      );

      if (!controlResults.success || !variantResults.success) {
        return {
          success: false,
          error: 'Failed to run tests for one or both configurations'
        };
      }

      // Calculate metrics
      const controlMetrics = this.calculateTestMetrics(controlResults.data!);
      const variantMetrics = this.calculateTestMetrics(variantResults.data!);

      // Calculate statistical significance
      const statisticalSignificance = this.calculateStatisticalSignificance(
        controlResults.data!,
        variantResults.data!
      );

      // Determine winner
      const winner = this.determineWinner(controlMetrics, variantMetrics, statisticalSignificance);

      // Calculate confidence interval
      const confidenceInterval = this.calculateConfidenceInterval(
        controlResults.data!,
        variantResults.data!
      );

      // Generate results summary
      const resultsSummary = this.generateResultsSummary(
        controlMetrics,
        variantMetrics,
        winner,
        statisticalSignificance
      );

      // Update test with results
      const updateData = {
        current_responses: test.sample_size,
        control_metrics: controlMetrics,
        variant_metrics: variantMetrics,
        statistical_significance: statisticalSignificance,
        winner: winner,
        confidence_interval: confidenceInterval,
        results_summary: resultsSummary,
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: updatedTest, error: updateError } = await supabase
        .from('playground_ab_tests')
        .update(updateData)
        .eq('id', testId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating A/B test:', updateError);
        return {
          success: false,
          error: updateError.message
        };
      }

      return {
        success: true,
        data: updatedTest as PlaygroundABTest,
        message: `A/B test completed. Winner: ${winner}`
      };

    } catch (error) {
      console.error('Error running A/B test:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Run tests for a specific configuration
  private async runTestsForConfiguration(
    config: BotConfiguration,
    testMessages: string[],
    userId: string
  ): Promise<PlaygroundAPIResponse<any[]>> {
    try {
      const results = [];

      for (const message of testMessages) {
        const aiResponse = await playgroundAIService.generateResponse(message, config);
        
        // Record performance metrics
        await botConfigurationService.recordPerformanceMetrics(
          config.id,
          userId,
          {
            test_scenario: 'A/B Test',
            test_message: message,
            ai_response: aiResponse.response,
            response_time_ms: aiResponse.response_time_ms,
            quality_score: aiResponse.quality_score,
            confidence_score: aiResponse.confidence_score,
            personality_alignment: aiResponse.personality_analysis,
            tokens_used: aiResponse.tokens_used,
            cost_usd: aiResponse.cost_usd,
            model_used: aiResponse.model_used,
            prompt_tokens: aiResponse.prompt_tokens,
            completion_tokens: aiResponse.completion_tokens,
            error_details: aiResponse.error ? { error: aiResponse.error } : undefined
          }
        );

        results.push({
          test_message: message,
          ai_response: aiResponse.response,
          response_time_ms: aiResponse.response_time_ms,
          quality_score: aiResponse.quality_score,
          confidence_score: aiResponse.confidence_score,
          personality_alignment: aiResponse.personality_analysis.alignment_score,
          tokens_used: aiResponse.tokens_used,
          cost_usd: aiResponse.cost_usd,
          error: aiResponse.error
        });

        // Add small delay to avoid rate limiting
        await this.delay(100);
      }

      return {
        success: true,
        data: results
      };
    } catch (error) {
      console.error('Error running tests for configuration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Calculate test metrics from results
  private calculateTestMetrics(results: any[]): TestMetrics {
    const totalResponses = results.length;
    const errorCount = results.filter(r => r.error).length;
    
    if (totalResponses === 0) {
      return {
        avg_response_time: 0,
        avg_quality_score: 0,
        avg_confidence_score: 0,
        avg_personality_alignment: 0,
        total_responses: 0,
        total_tokens: 0,
        total_cost: 0,
        error_rate: 0
      };
    }

    const successfulResults = results.filter(r => !r.error);
    const successfulCount = successfulResults.length;

    return {
      avg_response_time: successfulCount > 0 ? 
        successfulResults.reduce((sum, r) => sum + r.response_time_ms, 0) / successfulCount : 0,
      avg_quality_score: successfulCount > 0 ? 
        successfulResults.reduce((sum, r) => sum + r.quality_score, 0) / successfulCount : 0,
      avg_confidence_score: successfulCount > 0 ? 
        successfulResults.reduce((sum, r) => sum + r.confidence_score, 0) / successfulCount : 0,
      avg_personality_alignment: successfulCount > 0 ? 
        successfulResults.reduce((sum, r) => sum + r.personality_alignment, 0) / successfulCount : 0,
      total_responses: totalResponses,
      total_tokens: results.reduce((sum, r) => sum + (r.tokens_used || 0), 0),
      total_cost: results.reduce((sum, r) => sum + (r.cost_usd || 0), 0),
      error_rate: errorCount / totalResponses
    };
  }

  // Calculate statistical significance using Welch's t-test
  private calculateStatisticalSignificance(controlResults: any[], variantResults: any[]): number {
    const controlQuality = controlResults.filter(r => !r.error).map(r => r.quality_score);
    const variantQuality = variantResults.filter(r => !r.error).map(r => r.quality_score);

    if (controlQuality.length === 0 || variantQuality.length === 0) {
      return 0;
    }

    // Calculate means
    const controlMean = controlQuality.reduce((sum, val) => sum + val, 0) / controlQuality.length;
    const variantMean = variantQuality.reduce((sum, val) => sum + val, 0) / variantQuality.length;

    // Calculate variances
    const controlVariance = controlQuality.reduce((sum, val) => sum + Math.pow(val - controlMean, 2), 0) / (controlQuality.length - 1);
    const variantVariance = variantQuality.reduce((sum, val) => sum + Math.pow(val - variantMean, 2), 0) / (variantQuality.length - 1);

    // Welch's t-test
    const standardError = Math.sqrt(controlVariance / controlQuality.length + variantVariance / variantQuality.length);
    
    if (standardError === 0) return 0;
    
    const tStatistic = Math.abs(controlMean - variantMean) / standardError;
    
    // Approximate p-value (simplified)
    const pValue = 2 * (1 - this.normalCDF(tStatistic));
    
    return 1 - pValue; // Return significance level
  }

  // Normal cumulative distribution function approximation
  private normalCDF(x: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
  }

  // Determine winner based on metrics and significance
  private determineWinner(
    controlMetrics: TestMetrics,
    variantMetrics: TestMetrics,
    statisticalSignificance: number
  ): 'control' | 'variant' | 'inconclusive' {
    // Require at least 80% confidence for declaring a winner
    if (statisticalSignificance < 0.8) {
      return 'inconclusive';
    }

    // Calculate composite score (weighted average of key metrics)
    const controlScore = this.calculateCompositeScore(controlMetrics);
    const variantScore = this.calculateCompositeScore(variantMetrics);

    if (Math.abs(controlScore - variantScore) < 0.05) {
      return 'inconclusive';
    }

    return variantScore > controlScore ? 'variant' : 'control';
  }

  // Calculate composite score from metrics
  private calculateCompositeScore(metrics: TestMetrics): number {
    const qualityWeight = 0.4;
    const responseTimeWeight = 0.3;
    const personalityWeight = 0.2;
    const errorRateWeight = 0.1;

    // Normalize response time (lower is better)
    const normalizedResponseTime = Math.max(0, 1 - (metrics.avg_response_time / 5000));

    // Normalize error rate (lower is better)
    const normalizedErrorRate = Math.max(0, 1 - metrics.error_rate);

    return (
      metrics.avg_quality_score * qualityWeight +
      normalizedResponseTime * responseTimeWeight +
      metrics.avg_personality_alignment * personalityWeight +
      normalizedErrorRate * errorRateWeight
    );
  }

  // Calculate confidence interval
  private calculateConfidenceInterval(controlResults: any[], variantResults: any[]): any {
    const controlQuality = controlResults.filter(r => !r.error).map(r => r.quality_score);
    const variantQuality = variantResults.filter(r => !r.error).map(r => r.quality_score);

    if (controlQuality.length === 0 || variantQuality.length === 0) {
      return { lower: 0, upper: 0 };
    }

    const controlMean = controlQuality.reduce((sum, val) => sum + val, 0) / controlQuality.length;
    const variantMean = variantQuality.reduce((sum, val) => sum + val, 0) / variantQuality.length;
    const difference = variantMean - controlMean;

    const controlVariance = controlQuality.reduce((sum, val) => sum + Math.pow(val - controlMean, 2), 0) / (controlQuality.length - 1);
    const variantVariance = variantQuality.reduce((sum, val) => sum + Math.pow(val - variantMean, 2), 0) / (variantQuality.length - 1);

    const standardError = Math.sqrt(controlVariance / controlQuality.length + variantVariance / variantQuality.length);
    const marginOfError = 1.96 * standardError; // 95% confidence interval

    return {
      lower: difference - marginOfError,
      upper: difference + marginOfError
    };
  }

  // Generate results summary
  private generateResultsSummary(
    controlMetrics: TestMetrics,
    variantMetrics: TestMetrics,
    winner: string,
    statisticalSignificance: number
  ): any {
    const improvement = {
      response_time: ((controlMetrics.avg_response_time - variantMetrics.avg_response_time) / controlMetrics.avg_response_time) * 100,
      quality_score: ((variantMetrics.avg_quality_score - controlMetrics.avg_quality_score) / controlMetrics.avg_quality_score) * 100,
      confidence_score: ((variantMetrics.avg_confidence_score - controlMetrics.avg_confidence_score) / controlMetrics.avg_confidence_score) * 100,
      personality_alignment: ((variantMetrics.avg_personality_alignment - controlMetrics.avg_personality_alignment) / controlMetrics.avg_personality_alignment) * 100
    };

    let recommendation = '';
    
    if (winner === 'variant') {
      recommendation = `The variant configuration shows statistically significant improvement. Key improvements: ${this.getTopImprovements(improvement)}. Recommend deploying the variant configuration.`;
    } else if (winner === 'control') {
      recommendation = `The control configuration performs better. The variant shows declining performance in key metrics. Recommend keeping the current configuration.`;
    } else {
      recommendation = `Results are inconclusive. The difference between configurations is not statistically significant. Consider running a larger test or testing different configurations.`;
    }

    return {
      winner,
      statistical_significance: statisticalSignificance,
      confidence_level: `${(statisticalSignificance * 100).toFixed(1)}%`,
      improvement,
      recommendation,
      key_insights: this.generateKeyInsights(controlMetrics, variantMetrics, improvement)
    };
  }

  // Get top improvements
  private getTopImprovements(improvement: any): string {
    const improvements = Object.entries(improvement)
      .map(([key, value]) => ({ key, value: value as number }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 2)
      .map(item => `${item.key.replace('_', ' ')} (+${item.value.toFixed(1)}%)`);

    return improvements.length > 0 ? improvements.join(', ') : 'no significant improvements';
  }

  // Generate key insights
  private generateKeyInsights(
    controlMetrics: TestMetrics,
    variantMetrics: TestMetrics,
    improvement: any
  ): string[] {
    const insights = [];

    if (Math.abs(improvement.response_time) > 10) {
      insights.push(`Response time ${improvement.response_time > 0 ? 'improved' : 'declined'} by ${Math.abs(improvement.response_time).toFixed(1)}%`);
    }

    if (Math.abs(improvement.quality_score) > 5) {
      insights.push(`Quality score ${improvement.quality_score > 0 ? 'improved' : 'declined'} by ${Math.abs(improvement.quality_score).toFixed(1)}%`);
    }

    if (Math.abs(improvement.personality_alignment) > 5) {
      insights.push(`Personality alignment ${improvement.personality_alignment > 0 ? 'improved' : 'declined'} by ${Math.abs(improvement.personality_alignment).toFixed(1)}%`);
    }

    if (controlMetrics.error_rate !== variantMetrics.error_rate) {
      const errorChange = ((variantMetrics.error_rate - controlMetrics.error_rate) / controlMetrics.error_rate) * 100;
      insights.push(`Error rate ${errorChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(errorChange).toFixed(1)}%`);
    }

    const costChange = ((variantMetrics.total_cost - controlMetrics.total_cost) / controlMetrics.total_cost) * 100;
    if (Math.abs(costChange) > 10) {
      insights.push(`Cost ${costChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(costChange).toFixed(1)}%`);
    }

    return insights;
  }

  // Update A/B test status
  async updateABTestStatus(
    testId: string,
    status: 'running' | 'completed' | 'paused' | 'cancelled'
  ): Promise<PlaygroundAPIResponse<PlaygroundABTest>> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'completed' || status === 'cancelled') {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('playground_ab_tests')
        .update(updateData)
        .eq('id', testId)
        .select()
        .single();

      if (error) {
        console.error('Error updating A/B test status:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as PlaygroundABTest,
        message: `A/B test status updated to ${status}`
      };
    } catch (error) {
      console.error('Error updating A/B test status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Delete A/B test
  async deleteABTest(testId: string): Promise<PlaygroundAPIResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('playground_ab_tests')
        .delete()
        .eq('id', testId);

      if (error) {
        console.error('Error deleting A/B test:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: true,
        message: 'A/B test deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting A/B test:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get A/B test statistics
  async getABTestStatistics(userId: string): Promise<PlaygroundAPIResponse<{
    total_tests: number;
    completed_tests: number;
    running_tests: number;
    avg_improvement: number;
    most_successful_tests: PlaygroundABTest[];
    recent_tests: PlaygroundABTest[];
  }>> {
    try {
      const { data, error } = await supabase
        .from('playground_ab_tests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching A/B test statistics:', error);
        return {
          success: false,
          error: error.message
        };
      }

      const tests = data as PlaygroundABTest[];
      const totalTests = tests.length;
      const completedTests = tests.filter(t => t.status === 'completed').length;
      const runningTests = tests.filter(t => t.status === 'running').length;

      const completedTestsWithResults = tests.filter(t => 
        t.status === 'completed' && 
        t.results_summary?.improvement?.quality_score !== undefined
      );

      const avgImprovement = completedTestsWithResults.length > 0 ? 
        completedTestsWithResults.reduce((sum, t) => sum + (t.results_summary?.improvement?.quality_score || 0), 0) / completedTestsWithResults.length : 0;

      const mostSuccessful = tests
        .filter(t => t.status === 'completed' && t.statistical_significance > 0.8)
        .sort((a, b) => b.statistical_significance - a.statistical_significance)
        .slice(0, 5);

      const recentTests = tests.slice(0, 10);

      return {
        success: true,
        data: {
          total_tests: totalTests,
          completed_tests: completedTests,
          running_tests: runningTests,
          avg_improvement: avgImprovement,
          most_successful_tests: mostSuccessful,
          recent_tests: recentTests
        }
      };
    } catch (error) {
      console.error('Error fetching A/B test statistics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Utility function to add delay
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Validate A/B test form
  validateABTestForm(form: ABTestForm): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!form.test_name || form.test_name.trim().length === 0) {
      errors.push('Test name is required');
    }

    if (!form.control_config_id) {
      errors.push('Control configuration is required');
    }

    if (!form.variant_config_id) {
      errors.push('Variant configuration is required');
    }

    if (form.control_config_id === form.variant_config_id) {
      errors.push('Control and variant configurations must be different');
    }

    if (!form.test_messages || form.test_messages.length === 0) {
      errors.push('At least one test message is required');
    }

    if (form.test_messages && form.test_messages.some(msg => msg.trim().length === 0)) {
      errors.push('All test messages must be non-empty');
    }

    if (form.sample_size < 1 || form.sample_size > 100) {
      errors.push('Sample size must be between 1 and 100');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Get recommended test messages based on configuration differences
  getRecommendedTestMessages(
    controlConfig: BotConfiguration,
    variantConfig: BotConfiguration
  ): string[] {
    const messages = [];

    // If personality traits are different, test personality-specific scenarios
    if (JSON.stringify(controlConfig.personality_traits) !== JSON.stringify(variantConfig.personality_traits)) {
      messages.push('Hello! I need help with a technical issue.');
      messages.push('I\'m frustrated with my recent experience and need immediate assistance.');
      messages.push('Can you explain how your product works in detail?');
    }

    // If response styles are different, test style-specific scenarios
    if (controlConfig.response_style !== variantConfig.response_style) {
      messages.push('What are your pricing options?');
      messages.push('I have a complex question about integration.');
      messages.push('Thank you for your help today!');
    }

    // If AI models are different, test complexity scenarios
    if (controlConfig.ai_model !== variantConfig.ai_model) {
      messages.push('I need to integrate your API with our microservices architecture.');
      messages.push('Can you walk me through the setup process step by step?');
      messages.push('What are the best practices for handling errors?');
    }

    // Default messages if no specific differences
    if (messages.length === 0) {
      messages.push('Hi there! How can I get started?');
      messages.push('I have a question about your service.');
      messages.push('Can you help me troubleshoot an issue?');
      messages.push('What makes your solution different from competitors?');
    }

    return messages;
  }
}

// Export singleton instance
export const abTestingService = new ABTestingService();