import { 
  BotConfiguration, 
  PlaygroundABTest,
  ABTestResults,
  TestMetrics,
  TestScenarioResult,
  ABTestStatus
} from '../types/playground';
import { botConfigurationService } from './botConfigurationService';
import { playgroundAIService } from './playgroundAIService';
import { testScenarioService } from './testScenarioService';

export class ABTestingService {
  
  /**
   * Create a new A/B test
   */
  async createABTest(
    testName: string,
    description: string,
    configA: BotConfiguration,
    configB: BotConfiguration,
    testMessages: string[]
  ): Promise<PlaygroundABTest> {
    try {
      return await botConfigurationService.createABTest(
        testName,
        description,
        configA.id,
        configB.id,
        testMessages
      );
    } catch (error) {
      console.error('Error creating A/B test:', error);
      throw error;
    }
  }

  /**
   * Run an A/B test
   */
  async runABTest(testId: string): Promise<ABTestResults> {
    try {
      // Get all A/B tests for the user to find this specific test
      const abTests = await botConfigurationService.getABTests();
      const test = abTests.find(t => t.id === testId);
      
      if (!test) {
        throw new Error(`A/B test with ID ${testId} not found`);
      }

      // Load the bot configurations
      const [configA, configB] = await Promise.all([
        botConfigurationService.loadBotConfig().then(config => 
          config?.id === test.config_a_id ? config : null
        ),
        botConfigurationService.loadBotConfig().then(config => 
          config?.id === test.config_b_id ? config : null
        )
      ]);

      if (!configA || !configB) {
        throw new Error('Could not load bot configurations for A/B test');
      }

      // Run tests for both configurations
      const [metricsA, metricsB] = await Promise.all([
        this.runTestsForConfiguration(configA, test.test_messages),
        this.runTestsForConfiguration(configB, test.test_messages)
      ]);

      // Analyze results
      const results: ABTestResults = {
        config_a_metrics: metricsA,
        config_b_metrics: metricsB,
        statistical_significance: this.calculateStatisticalSignificance(metricsA, metricsB),
        confidence_interval: this.calculateConfidenceInterval(metricsA, metricsB),
        recommendation: this.generateRecommendation(metricsA, metricsB)
      };

      // Determine winner
      const winner = this.determineWinner(metricsA, metricsB);

      // Update the test with results
      await botConfigurationService.updateABTestResults(testId, results, winner);

      return results;

    } catch (error) {
      console.error('Error running A/B test:', error);
      throw error;
    }
  }

  /**
   * Run tests for a specific configuration
   */
  private async runTestsForConfiguration(
    config: BotConfiguration,
    testMessages: string[]
  ): Promise<TestMetrics> {
    const results = [];
    let totalResponseTime = 0;
    let totalQuality = 0;
    let totalConfidence = 0;
    let totalPersonalityConsistency = 0;

    for (const message of testMessages) {
      try {
        const response = await playgroundAIService.generateTestResponse(message, config);
        
        results.push({
          message,
          response: response.response,
          response_time: response.response_time,
          quality_score: response.confidence * 100,
          confidence: response.confidence,
          personality_consistency: response.personality_score.consistency_score
        });

        totalResponseTime += response.response_time;
        totalQuality += response.confidence * 100;
        totalConfidence += response.confidence;
        totalPersonalityConsistency += response.personality_score.consistency_score;

        // Add delay between tests to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`Error testing message "${message}":`, error);
      }
    }

    return {
      average_response_time: totalResponseTime / results.length,
      average_quality_score: totalQuality / results.length,
      average_confidence: totalConfidence / results.length,
      personality_consistency: totalPersonalityConsistency / results.length,
      total_tests: results.length
    };
  }

  /**
   * Calculate statistical significance between two test metrics
   */
  private calculateStatisticalSignificance(metricsA: TestMetrics, metricsB: TestMetrics): number {
    // Simplified statistical significance calculation
    // In a real implementation, you'd use proper statistical tests like t-test
    
    const qualityDiff = Math.abs(metricsA.average_quality_score - metricsB.average_quality_score);
    const combinedVariance = this.calculateVariance(metricsA, metricsB);
    
    // Simple significance score based on difference and sample size
    const sampleSize = Math.min(metricsA.total_tests, metricsB.total_tests);
    const significance = Math.min(0.99, (qualityDiff / combinedVariance) * (sampleSize / 10));
    
    return Math.round(significance * 100) / 100;
  }

  /**
   * Calculate confidence interval
   */
  private calculateConfidenceInterval(metricsA: TestMetrics, metricsB: TestMetrics): number {
    // Simplified confidence interval calculation
    const sampleSize = Math.min(metricsA.total_tests, metricsB.total_tests);
    const baseConfidence = 0.8; // 80% base confidence
    const sampleSizeBonus = Math.min(0.15, sampleSize * 0.01); // Up to 15% bonus for larger samples
    
    return Math.round((baseConfidence + sampleSizeBonus) * 100) / 100;
  }

  /**
   * Calculate variance for significance testing
   */
  private calculateVariance(metricsA: TestMetrics, metricsB: TestMetrics): number {
    // Simplified variance calculation
    const avgQuality = (metricsA.average_quality_score + metricsB.average_quality_score) / 2;
    const varianceA = Math.pow(metricsA.average_quality_score - avgQuality, 2);
    const varianceB = Math.pow(metricsB.average_quality_score - avgQuality, 2);
    
    return Math.sqrt((varianceA + varianceB) / 2) || 1; // Prevent division by zero
  }

  /**
   * Determine the winner of the A/B test
   */
  private determineWinner(metricsA: TestMetrics, metricsB: TestMetrics): 'A' | 'B' | 'tie' {
    const scoreA = this.calculateOverallScore(metricsA);
    const scoreB = this.calculateOverallScore(metricsB);
    
    const threshold = 5; // 5% threshold for declaring a winner
    const difference = Math.abs(scoreA - scoreB);
    
    if (difference < threshold) {
      return 'tie';
    }
    
    return scoreA > scoreB ? 'A' : 'B';
  }

  /**
   * Calculate overall score for a configuration
   */
  private calculateOverallScore(metrics: TestMetrics): number {
    // Weighted scoring system
    const qualityWeight = 0.4;
    const responseTimeWeight = 0.3;
    const confidenceWeight = 0.2;
    const consistencyWeight = 0.1;

    // Normalize response time (lower is better)
    const normalizedResponseTime = Math.max(0, 100 - (metrics.average_response_time / 50));
    
    const score = 
      (metrics.average_quality_score * qualityWeight) +
      (normalizedResponseTime * responseTimeWeight) +
      (metrics.average_confidence * 100 * confidenceWeight) +
      (metrics.personality_consistency * 100 * consistencyWeight);

    return Math.round(score * 100) / 100;
  }

  /**
   * Generate recommendation based on test results
   */
  private generateRecommendation(metricsA: TestMetrics, metricsB: TestMetrics): string {
    const scoreA = this.calculateOverallScore(metricsA);
    const scoreB = this.calculateOverallScore(metricsB);
    const winner = this.determineWinner(metricsA, metricsB);
    
    if (winner === 'tie') {
      return `Both configurations perform similarly (A: ${scoreA.toFixed(1)}, B: ${scoreB.toFixed(1)}). Consider testing with more scenarios or different personality settings for clearer results.`;
    }
    
    const winnerMetrics = winner === 'A' ? metricsA : metricsB;
    const loserMetrics = winner === 'A' ? metricsB : metricsA;
    const winnerScore = winner === 'A' ? scoreA : scoreB;
    
    let recommendation = `Configuration ${winner} is the winner with a score of ${winnerScore.toFixed(1)}. `;
    
    // Add specific insights
    if (winnerMetrics.average_quality_score > loserMetrics.average_quality_score + 10) {
      recommendation += `Configuration ${winner} provides significantly better response quality. `;
    }
    
    if (winnerMetrics.average_response_time < loserMetrics.average_response_time - 500) {
      recommendation += `Configuration ${winner} responds faster by ${Math.round((loserMetrics.average_response_time - winnerMetrics.average_response_time) / 1000 * 10) / 10} seconds on average. `;
    }
    
    if (winnerMetrics.personality_consistency > loserMetrics.personality_consistency + 0.1) {
      recommendation += `Configuration ${winner} maintains better personality consistency. `;
    }
    
    recommendation += `Consider adopting Configuration ${winner} for your bot.`;
    
    return recommendation;
  }

  /**
   * Compare configurations across different scenarios
   */
  async compareConfigurations(
    configA: BotConfiguration,
    configB: BotConfiguration,
    scenarioIds?: string[]
  ): Promise<{
    overall_winner: 'A' | 'B' | 'tie';
    scenario_results: { [scenarioId: string]: 'A' | 'B' | 'tie' };
    detailed_metrics: {
      config_a: { [scenarioId: string]: TestMetrics };
      config_b: { [scenarioId: string]: TestMetrics };
    };
    insights: string[];
  }> {
    
    const scenarios = scenarioIds 
      ? scenarioIds.map(id => testScenarioService.getScenario(id)).filter(Boolean)
      : testScenarioService.getAllScenarios().slice(0, 5); // Limit to 5 for performance

    const scenarioResults: { [scenarioId: string]: 'A' | 'B' | 'tie' } = {};
    const detailedMetrics = {
      config_a: {} as { [scenarioId: string]: TestMetrics },
      config_b: {} as { [scenarioId: string]: TestMetrics }
    };

    let aWins = 0;
    let bWins = 0;

    for (const scenario of scenarios) {
      if (!scenario) continue;

      // Run scenario for both configurations
      const [resultA, resultB] = await Promise.all([
        playgroundAIService.runTestScenario(scenario, configA),
        playgroundAIService.runTestScenario(scenario, configB)
      ]);

      const metricsA: TestMetrics = {
        average_response_time: resultA.average_response_time,
        average_quality_score: resultA.average_quality_score,
        average_confidence: resultA.average_confidence,
        personality_consistency: resultA.results.reduce((sum, r) => sum + r.personality_analysis.consistency_score, 0) / resultA.results.length,
        total_tests: resultA.results.length
      };

      const metricsB: TestMetrics = {
        average_response_time: resultB.average_response_time,
        average_quality_score: resultB.average_quality_score,
        average_confidence: resultB.average_confidence,
        personality_consistency: resultB.results.reduce((sum, r) => sum + r.personality_analysis.consistency_score, 0) / resultB.results.length,
        total_tests: resultB.results.length
      };

      detailedMetrics.config_a[scenario.id] = metricsA;
      detailedMetrics.config_b[scenario.id] = metricsB;

      const winner = this.determineWinner(metricsA, metricsB);
      scenarioResults[scenario.id] = winner;

      if (winner === 'A') aWins++;
      else if (winner === 'B') bWins++;

      // Add delay between scenarios
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const overallWinner: 'A' | 'B' | 'tie' = aWins > bWins ? 'A' : bWins > aWins ? 'B' : 'tie';
    const insights = this.generateComparisonInsights(detailedMetrics, scenarioResults, overallWinner);

    return {
      overall_winner: overallWinner,
      scenario_results: scenarioResults,
      detailed_metrics: detailedMetrics,
      insights
    };
  }

  /**
   * Generate insights from configuration comparison
   */
  private generateComparisonInsights(
    detailedMetrics: any,
    scenarioResults: { [scenarioId: string]: 'A' | 'B' | 'tie' },
    overallWinner: 'A' | 'B' | 'tie'
  ): string[] {
    const insights: string[] = [];

    if (overallWinner !== 'tie') {
      insights.push(`Configuration ${overallWinner} performed better overall across test scenarios.`);
    } else {
      insights.push('Both configurations performed equally well overall.');
    }

    // Analyze performance by scenario type
    const categoryPerformance: { [category: string]: { A: number, B: number, tie: number } } = {};
    
    Object.entries(scenarioResults).forEach(([scenarioId, winner]) => {
      const scenario = testScenarioService.getScenario(scenarioId);
      if (scenario) {
        if (!categoryPerformance[scenario.category]) {
          categoryPerformance[scenario.category] = { A: 0, B: 0, tie: 0 };
        }
        categoryPerformance[scenario.category][winner]++;
      }
    });

    // Generate category-specific insights
    Object.entries(categoryPerformance).forEach(([category, performance]) => {
      if (performance.A > performance.B) {
        insights.push(`Configuration A excels in ${category} scenarios.`);
      } else if (performance.B > performance.A) {
        insights.push(`Configuration B excels in ${category} scenarios.`);
      }
    });

    return insights;
  }

  /**
   * Get all A/B tests for the current user
   */
  async getABTests(): Promise<PlaygroundABTest[]> {
    return await botConfigurationService.getABTests();
  }

  /**
   * Update A/B test status
   */
  async updateABTestStatus(testId: string, status: ABTestStatus): Promise<void> {
    // This would update the test status in the database
    // For now, we'll use the existing updateABTestResults method
    const currentTests = await this.getABTests();
    const test = currentTests.find(t => t.id === testId);
    
    if (test) {
      await botConfigurationService.updateABTestResults(testId, test.results, test.winner);
    }
  }
}

// Create singleton instance
export const abTestingService = new ABTestingService();