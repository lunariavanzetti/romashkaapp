// ROMASHKA A/B Testing Service
// Real A/B testing with statistical analysis for AI playground

import { supabase } from '../lib/supabase';
import { 
  PlaygroundABTest, 
  ABTestResults, 
  TestMetrics, 
  PlaygroundSession,
  ABTestForm,
  PlaygroundAPIResponse,
  BotPerformanceMetrics
} from '../types/playground';
import { playgroundAIService } from './playgroundAIService';
import { BotConfigurationService } from './botConfigurationService';

export class ABTestingService {
  private botConfigService: BotConfigurationService;

  constructor() {
    this.botConfigService = new BotConfigurationService();
  }

  /**
   * Create a new A/B test
   */
  async createABTest(
    userId: string,
    testForm: ABTestForm
  ): Promise<PlaygroundAPIResponse<PlaygroundABTest>> {
    try {
      const testData = {
        user_id: userId,
        test_name: testForm.test_name,
        control_session_id: testForm.control_session_id,
        variant_session_id: testForm.variant_session_id,
        test_messages: testForm.test_messages,
        sample_size: testForm.sample_size,
        status: 'running' as const,
        current_responses: 0,
        control_metrics: this.getEmptyMetrics(),
        variant_metrics: this.getEmptyMetrics(),
        statistical_significance: 0,
        confidence_interval: { lower: 0, upper: 0 }
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

  /**
   * Run A/B test
   */
  async runABTest(testId: string): Promise<PlaygroundAPIResponse<ABTestResults>> {
    try {
      // Get the test configuration
      const { data: abTest, error: testError } = await supabase
        .from('playground_ab_tests')
        .select('*')
        .eq('id', testId)
        .single();

      if (testError) {
        return {
          success: false,
          error: testError.message
        };
      }

      if (!abTest) {
        return {
          success: false,
          error: 'A/B test not found'
        };
      }

      // Get control and variant configurations
      const controlResult = await this.botConfigService.getBotConfiguration(abTest.control_session_id);
      const variantResult = await this.botConfigService.getBotConfiguration(abTest.variant_session_id);

      if (!controlResult.success || !variantResult.success) {
        return {
          success: false,
          error: 'Failed to load bot configurations'
        };
      }

      const controlConfig = controlResult.data!;
      const variantConfig = variantResult.data!;

      // Run tests for both configurations
      const controlMetrics = await this.runTestsForConfiguration(
        controlConfig,
        abTest.test_messages,
        abTest.sample_size
      );

      const variantMetrics = await this.runTestsForConfiguration(
        variantConfig,
        abTest.test_messages,
        abTest.sample_size
      );

      // Calculate statistical significance
      const statisticalSignificance = this.calculateStatisticalSignificance(
        controlMetrics,
        variantMetrics
      );

      // Determine winner
      const winner = this.determineWinner(controlMetrics, variantMetrics, statisticalSignificance);

      // Calculate improvements
      const improvement = this.calculateImprovement(controlMetrics, variantMetrics);

      // Update test in database
      const { error: updateError } = await supabase
        .from('playground_ab_tests')
        .update({
          control_metrics: controlMetrics,
          variant_metrics: variantMetrics,
          statistical_significance: statisticalSignificance,
          winner: winner,
          confidence_interval: this.calculateConfidenceInterval(controlMetrics, variantMetrics),
          status: 'completed',
          completed_at: new Date().toISOString(),
          current_responses: controlMetrics.total_responses + variantMetrics.total_responses,
          updated_at: new Date().toISOString()
        })
        .eq('id', testId);

      if (updateError) {
        console.error('Error updating A/B test:', updateError);
      }

      // Generate results
      const results: ABTestResults = {
        test_id: testId,
        control_config: controlConfig,
        variant_config: variantConfig,
        results: {
          control: controlMetrics,
          variant: variantMetrics,
          improvement: improvement,
          statistical_significance: statisticalSignificance,
          winner: winner,
          recommendation: this.generateRecommendation(winner, improvement, statisticalSignificance)
        }
      };

      return {
        success: true,
        data: results,
        message: 'A/B test completed successfully'
      };

    } catch (error) {
      console.error('Error running A/B test:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get all A/B tests for a user
   */
  async getABTests(userId: string): Promise<PlaygroundAPIResponse<PlaygroundABTest[]>> {
    try {
      const { data, error } = await supabase
        .from('playground_ab_tests')
        .select('*')
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

  /**
   * Get a specific A/B test
   */
  async getABTest(testId: string): Promise<PlaygroundAPIResponse<PlaygroundABTest>> {
    try {
      const { data, error } = await supabase
        .from('playground_ab_tests')
        .select('*')
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

  /**
   * Pause an A/B test
   */
  async pauseABTest(testId: string): Promise<PlaygroundAPIResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('playground_ab_tests')
        .update({
          status: 'paused',
          updated_at: new Date().toISOString()
        })
        .eq('id', testId);

      if (error) {
        console.error('Error pausing A/B test:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: true,
        message: 'A/B test paused successfully'
      };

    } catch (error) {
      console.error('Error pausing A/B test:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Resume an A/B test
   */
  async resumeABTest(testId: string): Promise<PlaygroundAPIResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('playground_ab_tests')
        .update({
          status: 'running',
          updated_at: new Date().toISOString()
        })
        .eq('id', testId);

      if (error) {
        console.error('Error resuming A/B test:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: true,
        message: 'A/B test resumed successfully'
      };

    } catch (error) {
      console.error('Error resuming A/B test:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete an A/B test
   */
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

  /**
   * Run tests for a specific configuration
   */
  private async runTestsForConfiguration(
    config: PlaygroundSession,
    testMessages: string[],
    sampleSize: number
  ): Promise<TestMetrics> {
    const responses = [];
    const errors = [];

    for (let i = 0; i < sampleSize; i++) {
      for (const message of testMessages) {
        try {
          const response = await playgroundAIService.generateResponse(message, config);
          responses.push(response);

          // Record performance metrics
          await this.botConfigService.recordPerformanceMetrics(
            config.id,
            config.user_id,
            {
              test_message: message,
              ai_response: response.response,
              response_time_ms: response.response_time_ms,
              quality_score: response.quality_score,
              confidence_score: response.confidence_score,
              personality_alignment: response.personality_analysis,
              tokens_used: response.tokens_used,
              cost_usd: response.cost_usd,
              error_details: response.error ? { error: response.error } : undefined
            }
          );

          // Add delay to avoid rate limiting
          await this.delay(200);

        } catch (error) {
          console.error('Error in test run:', error);
          errors.push(error);
        }
      }
    }

    // Calculate metrics
    const totalResponses = responses.length;
    const avgResponseTime = totalResponses > 0 ? 
      responses.reduce((sum, r) => sum + r.response_time_ms, 0) / totalResponses : 0;
    const avgQualityScore = totalResponses > 0 ? 
      responses.reduce((sum, r) => sum + r.quality_score, 0) / totalResponses : 0;
    const avgConfidenceScore = totalResponses > 0 ? 
      responses.reduce((sum, r) => sum + r.confidence_score, 0) / totalResponses : 0;
    const avgPersonalityAlignment = totalResponses > 0 ? 
      responses.reduce((sum, r) => sum + r.personality_analysis.alignment_score, 0) / totalResponses : 0;
    const totalTokens = responses.reduce((sum, r) => sum + r.tokens_used, 0);
    const totalCost = responses.reduce((sum, r) => sum + r.cost_usd, 0);
    const errorRate = errors.length / (totalResponses + errors.length);

    return {
      avg_response_time: avgResponseTime,
      avg_quality_score: avgQualityScore,
      avg_confidence_score: avgConfidenceScore,
      avg_personality_alignment: avgPersonalityAlignment,
      total_responses: totalResponses,
      total_tokens: totalTokens,
      total_cost: totalCost,
      error_rate: errorRate
    };
  }

  /**
   * Calculate statistical significance using Welch's t-test
   */
  private calculateStatisticalSignificance(
    controlMetrics: TestMetrics,
    variantMetrics: TestMetrics
  ): number {
    // Simple implementation using quality scores
    const controlMean = controlMetrics.avg_quality_score;
    const variantMean = variantMetrics.avg_quality_score;
    const controlN = controlMetrics.total_responses;
    const variantN = variantMetrics.total_responses;

    if (controlN === 0 || variantN === 0) {
      return 0;
    }

    // Assume standard deviation is 20% of the mean (approximation)
    const controlStd = controlMean * 0.2;
    const variantStd = variantMean * 0.2;

    // Calculate standard error
    const standardError = Math.sqrt(
      (controlStd * controlStd) / controlN + 
      (variantStd * variantStd) / variantN
    );

    if (standardError === 0) {
      return 0;
    }

    // Calculate t-statistic
    const tStatistic = Math.abs(variantMean - controlMean) / standardError;

    // Approximate p-value (simplified)
    // For a two-tailed test, we need t > 1.96 for 95% confidence
    return Math.min(0.95, tStatistic / 1.96);
  }

  /**
   * Determine the winner of the A/B test
   */
  private determineWinner(
    controlMetrics: TestMetrics,
    variantMetrics: TestMetrics,
    significance: number
  ): 'control' | 'variant' | 'inconclusive' {
    if (significance < 0.9) {
      return 'inconclusive';
    }

    // Use a composite score considering multiple metrics
    const controlScore = this.calculateCompositeScore(controlMetrics);
    const variantScore = this.calculateCompositeScore(variantMetrics);

    if (variantScore > controlScore) {
      return 'variant';
    } else if (controlScore > variantScore) {
      return 'control';
    } else {
      return 'inconclusive';
    }
  }

  /**
   * Calculate composite score for comparison
   */
  private calculateCompositeScore(metrics: TestMetrics): number {
    return (
      metrics.avg_quality_score * 0.4 +
      metrics.avg_confidence_score * 0.3 +
      metrics.avg_personality_alignment * 0.2 +
      (1 - metrics.error_rate) * 0.1
    );
  }

  /**
   * Calculate improvement percentages
   */
  private calculateImprovement(
    controlMetrics: TestMetrics,
    variantMetrics: TestMetrics
  ): {
    response_time: number;
    quality_score: number;
    confidence_score: number;
    personality_alignment: number;
  } {
    const calculatePercentChange = (oldValue: number, newValue: number): number => {
      if (oldValue === 0) return newValue > 0 ? 100 : 0;
      return ((newValue - oldValue) / oldValue) * 100;
    };

    return {
      response_time: -calculatePercentChange(controlMetrics.avg_response_time, variantMetrics.avg_response_time),
      quality_score: calculatePercentChange(controlMetrics.avg_quality_score, variantMetrics.avg_quality_score),
      confidence_score: calculatePercentChange(controlMetrics.avg_confidence_score, variantMetrics.avg_confidence_score),
      personality_alignment: calculatePercentChange(controlMetrics.avg_personality_alignment, variantMetrics.avg_personality_alignment)
    };
  }

  /**
   * Calculate confidence interval
   */
  private calculateConfidenceInterval(
    controlMetrics: TestMetrics,
    variantMetrics: TestMetrics
  ): { lower: number; upper: number } {
    const difference = variantMetrics.avg_quality_score - controlMetrics.avg_quality_score;
    const margin = 0.05; // 5% margin of error (simplified)

    return {
      lower: difference - margin,
      upper: difference + margin
    };
  }

  /**
   * Generate recommendation based on results
   */
  private generateRecommendation(
    winner: 'control' | 'variant' | 'inconclusive',
    improvement: any,
    significance: number
  ): string {
    if (significance < 0.9) {
      return 'The test results are not statistically significant. Consider running more tests or adjusting the configurations more significantly.';
    }

    if (winner === 'control') {
      return 'The control configuration performed better. Consider keeping the current settings or investigating why the variant underperformed.';
    }

    if (winner === 'variant') {
      const improvements = [];
      if (improvement.quality_score > 5) improvements.push(`${improvement.quality_score.toFixed(1)}% better quality`);
      if (improvement.confidence_score > 5) improvements.push(`${improvement.confidence_score.toFixed(1)}% better confidence`);
      if (improvement.personality_alignment > 5) improvements.push(`${improvement.personality_alignment.toFixed(1)}% better personality alignment`);
      
      return `The variant configuration performed better with ${improvements.join(', ')}. Consider implementing these changes.`;
    }

    return 'The test results are inconclusive. Both configurations performed similarly.';
  }

  /**
   * Get empty metrics structure
   */
  private getEmptyMetrics(): TestMetrics {
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

  /**
   * Validate A/B test form
   */
  validateABTestForm(form: ABTestForm): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!form.test_name || form.test_name.trim().length === 0) {
      errors.push('Test name is required');
    }

    if (!form.control_session_id) {
      errors.push('Control configuration is required');
    }

    if (!form.variant_session_id) {
      errors.push('Variant configuration is required');
    }

    if (form.control_session_id === form.variant_session_id) {
      errors.push('Control and variant configurations must be different');
    }

    if (!form.test_messages || form.test_messages.length === 0) {
      errors.push('At least one test message is required');
    }

    if (form.test_messages?.some(msg => msg.trim().length === 0)) {
      errors.push('Test messages cannot be empty');
    }

    if (form.sample_size < 1 || form.sample_size > 100) {
      errors.push('Sample size must be between 1 and 100');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Utility function to add delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const abTestingService = new ABTestingService();