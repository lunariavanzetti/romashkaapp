import { supabase } from '../lib/supabase';
import { 
  BotConfiguration, 
  PersonalityTraits,
  ResponseStyle,
  BotConfigFormData,
  BotPerformanceMetrics,
  PlaygroundABTest,
  TestScenarioResult,
  ABTestResults,
  TestMetrics
} from '../types/playground';

export class BotConfigurationService {
  
  /**
   * Save bot configuration to database
   */
  async saveBotConfig(config: BotConfigFormData): Promise<BotConfiguration> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if user already has a configuration
      const { data: existingConfig } = await supabase
        .from('bot_configurations')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingConfig) {
        // Update existing configuration
        const { data, error } = await supabase
          .from('bot_configurations')
          .update({
            bot_name: config.bot_name,
            avatar_emoji: config.avatar_emoji,
            personality_traits: config.personality_traits,
            response_style: config.response_style,
            custom_instructions: config.custom_instructions,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingConfig.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new configuration
        const { data, error } = await supabase
          .from('bot_configurations')
          .insert([{
            user_id: user.id,
            bot_name: config.bot_name,
            avatar_emoji: config.avatar_emoji,
            personality_traits: config.personality_traits,
            response_style: config.response_style,
            custom_instructions: config.custom_instructions
          }])
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error saving bot config:', error);
      throw error;
    }
  }

  /**
   * Load bot configuration for current user
   */
  async loadBotConfig(userId?: string): Promise<BotConfiguration | null> {
    try {
      let targetUserId = userId;
      
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        targetUserId = user.id;
      }

      const { data, error } = await supabase
        .from('bot_configurations')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No configuration found, create default
          return await this.createDefaultConfig(targetUserId);
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error loading bot config:', error);
      return null;
    }
  }

  /**
   * Create default bot configuration
   */
  async createDefaultConfig(userId: string): Promise<BotConfiguration> {
    const defaultConfig: BotConfigFormData = {
      bot_name: 'ROMASHKA Assistant',
      avatar_emoji: '🤖',
      personality_traits: {
        formality: 50,
        enthusiasm: 50,
        technical_depth: 50,
        empathy: 50
      },
      response_style: 'conversational',
      custom_instructions: ''
    };

    return await this.saveBotConfig(defaultConfig);
  }

  /**
   * Update personality traits
   */
  async updatePersonalityTraits(traits: PersonalityTraits): Promise<BotConfiguration> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('bot_configurations')
        .update({
          personality_traits: traits,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating personality traits:', error);
      throw error;
    }
  }

  /**
   * Get configuration history for user
   */
  async getConfigurationHistory(): Promise<BotConfiguration[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('bot_configurations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting configuration history:', error);
      return [];
    }
  }

  /**
   * Track performance metrics for a test
   */
  async trackPerformanceMetrics(
    configId: string,
    testScenario: string,
    testMessage: string,
    responseText: string,
    responseTimeMs: number,
    qualityScore: number,
    confidenceScore: number,
    tokensUsed: number,
    satisfactionRating?: number,
    personalityConsistency?: number
  ): Promise<BotPerformanceMetrics> {
    try {
      const { data, error } = await supabase
        .from('bot_performance_metrics')
        .insert([{
          bot_config_id: configId,
          test_scenario: testScenario,
          test_message: testMessage,
          response_text: responseText,
          response_time_ms: responseTimeMs,
          response_quality_score: qualityScore,
          confidence_score: confidenceScore,
          tokens_used: tokensUsed,
          customer_satisfaction_rating: satisfactionRating || 0,
          personality_consistency_score: personalityConsistency || 0.5
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error tracking performance metrics:', error);
      throw error;
    }
  }

  /**
   * Get performance metrics for a configuration
   */
  async getPerformanceMetrics(configId: string): Promise<{
    averageResponseTime: number;
    averageQualityScore: number;
    testCount: number;
    personalityConsistency: number;
    improvementSuggestions: string[];
  }> {
    try {
      const { data, error } = await supabase
        .from('bot_performance_metrics')
        .select('*')
        .eq('bot_config_id', configId);

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          averageResponseTime: 0,
          averageQualityScore: 0,
          testCount: 0,
          personalityConsistency: 0,
          improvementSuggestions: []
        };
      }

      const metrics = data as BotPerformanceMetrics[];
      const avgResponseTime = metrics.reduce((sum, m) => sum + m.response_time_ms, 0) / metrics.length;
      const avgQualityScore = metrics.reduce((sum, m) => sum + m.response_quality_score, 0) / metrics.length;
      const avgPersonalityConsistency = metrics.reduce((sum, m) => sum + (m.personality_consistency_score || 0), 0) / metrics.length;

      const suggestions = this.generateImprovementSuggestions(avgQualityScore, avgResponseTime, avgPersonalityConsistency);

      return {
        averageResponseTime: Math.round(avgResponseTime),
        averageQualityScore: Math.round(avgQualityScore),
        testCount: metrics.length,
        personalityConsistency: Math.round(avgPersonalityConsistency * 100) / 100,
        improvementSuggestions: suggestions
      };
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      return {
        averageResponseTime: 0,
        averageQualityScore: 0,
        testCount: 0,
        personalityConsistency: 0,
        improvementSuggestions: []
      };
    }
  }

  /**
   * Generate improvement suggestions based on metrics
   */
  private generateImprovementSuggestions(
    qualityScore: number, 
    responseTime: number, 
    personalityConsistency: number
  ): string[] {
    const suggestions: string[] = [];

    if (qualityScore < 70) {
      suggestions.push('Consider refining your custom instructions to improve response quality');
      suggestions.push('Add more context to your bot configuration');
    }

    if (responseTime > 3000) {
      suggestions.push('Response time is high - consider simplifying personality settings');
      suggestions.push('Reduce custom instructions length for faster responses');
    }

    if (personalityConsistency < 0.7) {
      suggestions.push('Personality consistency is low - review and clarify personality trait settings');
      suggestions.push('Consider using more specific custom instructions');
    }

    if (qualityScore > 85 && responseTime < 2000 && personalityConsistency > 0.8) {
      suggestions.push('Excellent performance! Consider creating A/B tests to further optimize');
    }

    return suggestions;
  }

  /**
   * Create A/B test
   */
  async createABTest(
    testName: string,
    description: string,
    configAId: string,
    configBId: string,
    testMessages: string[]
  ): Promise<PlaygroundABTest> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('playground_ab_tests')
        .insert([{
          user_id: user.id,
          test_name: testName,
          description: description,
          config_a_id: configAId,
          config_b_id: configBId,
          test_messages: testMessages,
          status: 'draft',
          results: {}
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating A/B test:', error);
      throw error;
    }
  }

  /**
   * Get A/B tests for user
   */
  async getABTests(): Promise<PlaygroundABTest[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('playground_ab_tests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting A/B tests:', error);
      return [];
    }
  }

  /**
   * Update A/B test results
   */
  async updateABTestResults(testId: string, results: ABTestResults, winner?: 'A' | 'B' | 'tie'): Promise<PlaygroundABTest> {
    try {
      const { data, error } = await supabase
        .from('playground_ab_tests')
        .update({
          results: results,
          winner: winner,
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', testId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating A/B test results:', error);
      throw error;
    }
  }

  /**
   * Save test scenario results
   */
  async saveTestScenarioResults(result: Omit<TestScenarioResult, 'id' | 'tested_at'>): Promise<TestScenarioResult> {
    try {
      const { data, error } = await supabase
        .from('test_scenario_results')
        .insert([{
          ...result,
          tested_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving test scenario results:', error);
      throw error;
    }
  }

  /**
   * Get test scenario results for a configuration
   */
  async getTestScenarioResults(configId: string): Promise<TestScenarioResult[]> {
    try {
      const { data, error } = await supabase
        .from('test_scenario_results')
        .select('*')
        .eq('bot_config_id', configId)
        .order('tested_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting test scenario results:', error);
      return [];
    }
  }

  /**
   * Delete bot configuration
   */
  async deleteBotConfig(configId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('bot_configurations')
        .delete()
        .eq('id', configId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting bot config:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const botConfigurationService = new BotConfigurationService();