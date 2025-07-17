// ROMASHKA Bot Configuration Service
// Updated to work with actual bot_configurations table schema from migration 009

import { supabase } from '../lib/supabase';
import { 
  BotConfiguration, 
  BotConfigurationForm, 
  PersonalityTraits, 
  ResponseStyle, 
  AIModel,
  ModelParameters,
  BotPerformanceMetrics,
  PlaygroundAPIResponse,
  PlaygroundStats,
  DEFAULT_PERSONALITY_TRAITS,
  DEFAULT_MODEL_PARAMETERS,
  DEFAULT_SYSTEM_PROMPT
} from '../types/playground';

export class BotConfigurationService {
  // Create a new bot configuration
  async createBotConfiguration(
    userId: string, 
    config: BotConfigurationForm
  ): Promise<PlaygroundAPIResponse<BotConfiguration>> {
    try {
      const configData = {
        user_id: userId,
        bot_name: config.bot_name,
        avatar_emoji: config.avatar_emoji,
        avatar_url: config.avatar_url,
        personality_traits: config.personality_traits,
        response_style: config.response_style,
        ai_model: config.ai_model,
        model_parameters: config.model_parameters,
        system_prompt: config.system_prompt,
        custom_instructions: config.custom_instructions,
        is_active: true,
        test_count: 0,
        performance_summary: {}
      };

      const { data, error } = await supabase
        .from('bot_configurations')
        .insert([configData])
        .select()
        .single();

      if (error) {
        console.error('Error creating bot configuration:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as BotConfiguration,
        message: 'Bot configuration created successfully'
      };
    } catch (error) {
      console.error('Error creating bot configuration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get all bot configurations for a user
  async getBotConfigurations(userId: string): Promise<PlaygroundAPIResponse<BotConfiguration[]>> {
    try {
      const { data, error } = await supabase
        .from('bot_configurations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bot configurations:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as BotConfiguration[]
      };
    } catch (error) {
      console.error('Error fetching bot configurations:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get a specific bot configuration
  async getBotConfiguration(configId: string): Promise<PlaygroundAPIResponse<BotConfiguration>> {
    try {
      const { data, error } = await supabase
        .from('bot_configurations')
        .select('*')
        .eq('id', configId)
        .single();

      if (error) {
        console.error('Error fetching bot configuration:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as BotConfiguration
      };
    } catch (error) {
      console.error('Error fetching bot configuration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Update a bot configuration
  async updateBotConfiguration(
    configId: string, 
    config: Partial<BotConfigurationForm>
  ): Promise<PlaygroundAPIResponse<BotConfiguration>> {
    try {
      const updateData: any = {};

      if (config.bot_name) updateData.bot_name = config.bot_name;
      if (config.avatar_emoji) updateData.avatar_emoji = config.avatar_emoji;
      if (config.avatar_url !== undefined) updateData.avatar_url = config.avatar_url;
      if (config.personality_traits) updateData.personality_traits = config.personality_traits;
      if (config.response_style) updateData.response_style = config.response_style;
      if (config.ai_model) updateData.ai_model = config.ai_model;
      if (config.model_parameters) updateData.model_parameters = config.model_parameters;
      if (config.system_prompt) updateData.system_prompt = config.system_prompt;
      if (config.custom_instructions !== undefined) updateData.custom_instructions = config.custom_instructions;

      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('bot_configurations')
        .update(updateData)
        .eq('id', configId)
        .select()
        .single();

      if (error) {
        console.error('Error updating bot configuration:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as BotConfiguration,
        message: 'Bot configuration updated successfully'
      };
    } catch (error) {
      console.error('Error updating bot configuration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Delete a bot configuration
  async deleteBotConfiguration(configId: string): Promise<PlaygroundAPIResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('bot_configurations')
        .delete()
        .eq('id', configId);

      if (error) {
        console.error('Error deleting bot configuration:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: true,
        message: 'Bot configuration deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting bot configuration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Clone a bot configuration
  async cloneBotConfiguration(
    configId: string,
    newName?: string
  ): Promise<PlaygroundAPIResponse<BotConfiguration>> {
    try {
      // Get the original configuration
      const originalResult = await this.getBotConfiguration(configId);
      if (!originalResult.success || !originalResult.data) {
        return {
          success: false,
          error: 'Original configuration not found'
        };
      }

      const original = originalResult.data;
      const clonedData = {
        user_id: original.user_id,
        bot_name: newName || `${original.bot_name} (Copy)`,
        avatar_emoji: original.avatar_emoji,
        avatar_url: original.avatar_url,
        personality_traits: original.personality_traits,
        response_style: original.response_style,
        ai_model: original.ai_model,
        model_parameters: original.model_parameters,
        system_prompt: original.system_prompt,
        custom_instructions: original.custom_instructions,
        is_active: true,
        test_count: 0,
        performance_summary: {}
      };

      const { data, error } = await supabase
        .from('bot_configurations')
        .insert([clonedData])
        .select()
        .single();

      if (error) {
        console.error('Error cloning bot configuration:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as BotConfiguration,
        message: 'Bot configuration cloned successfully'
      };
    } catch (error) {
      console.error('Error cloning bot configuration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Record performance metrics
  async recordPerformanceMetrics(
    configId: string,
    userId: string,
    metrics: {
      test_scenario: string;
      test_message: string;
      ai_response: string;
      response_time_ms: number;
      quality_score: number;
      confidence_score: number;
      personality_alignment: any;
      tokens_used: number;
      cost_usd: number;
      model_used: string;
      prompt_tokens: number;
      completion_tokens: number;
      error_details?: any;
    }
  ): Promise<PlaygroundAPIResponse<BotPerformanceMetrics>> {
    try {
      const { data, error } = await supabase
        .from('bot_performance_metrics')
        .insert([{
          bot_config_id: configId,
          user_id: userId,
          ...metrics
        }])
        .select()
        .single();

      if (error) {
        console.error('Error recording performance metrics:', error);
        return {
          success: false,
          error: error.message
        };
      }

      // Update bot configuration performance summary
      await this.updateConfigurationPerformanceSummary(configId);

      return {
        success: true,
        data: data as BotPerformanceMetrics
      };
    } catch (error) {
      console.error('Error recording performance metrics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Update configuration performance summary using the database function
  private async updateConfigurationPerformanceSummary(configId: string): Promise<void> {
    try {
      const { error } = await supabase
        .rpc('update_bot_config_performance_summary', {
          config_id: configId
        });

      if (error) {
        console.error('Error updating configuration performance summary:', error);
      }
    } catch (error) {
      console.error('Error updating configuration performance summary:', error);
    }
  }

  // Get performance metrics for a configuration
  async getPerformanceMetrics(configId: string): Promise<PlaygroundAPIResponse<BotPerformanceMetrics[]>> {
    try {
      const { data, error } = await supabase
        .from('bot_performance_metrics')
        .select('*')
        .eq('bot_config_id', configId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching performance metrics:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as BotPerformanceMetrics[]
      };
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get playground statistics
  async getPlaygroundStats(userId: string): Promise<PlaygroundAPIResponse<PlaygroundStats>> {
    try {
      // Get configuration counts and metrics
      const { data: configurations, error: configsError } = await supabase
        .from('bot_configurations')
        .select('*')
        .eq('user_id', userId);

      if (configsError) {
        throw configsError;
      }

      // Get performance metrics
      const { data: metrics, error: metricsError } = await supabase
        .from('bot_performance_metrics')
        .select('*')
        .eq('user_id', userId);

      if (metricsError) {
        throw metricsError;
      }

      // Get A/B tests
      const { data: abTests, error: abTestsError } = await supabase
        .from('playground_ab_tests')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'running');

      if (abTestsError) {
        throw abTestsError;
      }

      // Get playground sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('playground_sessions')
        .select('*')
        .eq('user_id', userId);

      if (sessionsError) {
        throw sessionsError;
      }

      // Get recent test results
      const { data: testResults, error: testResultsError } = await supabase
        .from('test_scenario_results')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (testResultsError) {
        throw testResultsError;
      }

      // Calculate statistics
      const totalTests = metrics?.length || 0;
      const avgResponseTime = totalTests > 0 ? 
        Math.round(metrics!.reduce((sum, m) => sum + m.response_time_ms, 0) / totalTests) : 0;
      const avgQualityScore = totalTests > 0 ? 
        metrics!.reduce((sum, m) => sum + m.quality_score, 0) / totalTests : 0;
      const totalTokens = metrics?.reduce((sum, m) => sum + m.tokens_used, 0) || 0;
      const totalCost = metrics?.reduce((sum, m) => sum + m.cost_usd, 0) || 0;

      // Get top performing configurations
      const topPerforming = (configurations || [])
        .filter(c => c.performance_summary?.avg_quality_score)
        .sort((a, b) => (b.performance_summary?.avg_quality_score || 0) - (a.performance_summary?.avg_quality_score || 0))
        .slice(0, 5);

      const stats: PlaygroundStats = {
        total_configurations: configurations?.length || 0,
        total_tests: totalTests,
        total_sessions: sessions?.length || 0,
        avg_response_time: avgResponseTime,
        avg_quality_score: avgQualityScore,
        active_ab_tests: abTests?.length || 0,
        total_tokens_used: totalTokens,
        total_cost: totalCost,
        top_performing_configs: topPerforming as BotConfiguration[],
        recent_test_results: testResults || []
      };

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('Error fetching playground stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Create default bot configuration for new users
  async createDefaultBotConfiguration(userId: string): Promise<PlaygroundAPIResponse<BotConfiguration>> {
    const defaultConfig: BotConfigurationForm = {
      bot_name: 'ROMASHKA Assistant',
      avatar_emoji: '🤖',
      personality_traits: DEFAULT_PERSONALITY_TRAITS,
      response_style: 'professional',
      ai_model: 'gpt-4o-mini',
      model_parameters: DEFAULT_MODEL_PARAMETERS,
      system_prompt: DEFAULT_SYSTEM_PROMPT
    };

    return this.createBotConfiguration(userId, defaultConfig);
  }

  // Get or create default configuration for user
  async getOrCreateDefaultConfiguration(userId: string): Promise<PlaygroundAPIResponse<BotConfiguration>> {
    try {
      // First try to get existing configurations
      const configsResult = await this.getBotConfigurations(userId);
      
      if (configsResult.success && configsResult.data && configsResult.data.length > 0) {
        // Return the first active configuration
        const activeConfig = configsResult.data.find(c => c.is_active);
        if (activeConfig) {
          return {
            success: true,
            data: activeConfig
          };
        }
      }

      // Create default configuration if none exists
      return this.createDefaultBotConfiguration(userId);
    } catch (error) {
      console.error('Error getting or creating default configuration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Activate/deactivate a configuration
  async toggleConfigurationActive(configId: string, isActive: boolean): Promise<PlaygroundAPIResponse<BotConfiguration>> {
    try {
      const { data, error } = await supabase
        .from('bot_configurations')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', configId)
        .select()
        .single();

      if (error) {
        console.error('Error toggling configuration active status:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as BotConfiguration,
        message: `Configuration ${isActive ? 'activated' : 'deactivated'} successfully`
      };
    } catch (error) {
      console.error('Error toggling configuration active status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Validate bot configuration
  validateBotConfiguration(config: BotConfigurationForm): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.bot_name || config.bot_name.trim().length === 0) {
      errors.push('Bot name is required');
    }

    if (!config.avatar_emoji || config.avatar_emoji.trim().length === 0) {
      errors.push('Avatar emoji is required');
    }

    if (!config.personality_traits) {
      errors.push('Personality traits are required');
    } else {
      const { formality, enthusiasm, technical_depth, empathy } = config.personality_traits;
      if (formality < 0 || formality > 100) errors.push('Formality must be between 0 and 100');
      if (enthusiasm < 0 || enthusiasm > 100) errors.push('Enthusiasm must be between 0 and 100');
      if (technical_depth < 0 || technical_depth > 100) errors.push('Technical depth must be between 0 and 100');
      if (empathy < 0 || empathy > 100) errors.push('Empathy must be between 0 and 100');
    }

    if (!config.response_style) {
      errors.push('Response style is required');
    }

    if (!config.ai_model) {
      errors.push('AI model is required');
    }

    if (!config.model_parameters) {
      errors.push('Model parameters are required');
    } else {
      const { temperature, max_tokens, top_p, frequency_penalty, presence_penalty } = config.model_parameters;
      if (temperature < 0 || temperature > 2) errors.push('Temperature must be between 0 and 2');
      if (max_tokens < 1 || max_tokens > 4000) errors.push('Max tokens must be between 1 and 4000');
      if (top_p < 0 || top_p > 1) errors.push('Top P must be between 0 and 1');
      if (frequency_penalty < -2 || frequency_penalty > 2) errors.push('Frequency penalty must be between -2 and 2');
      if (presence_penalty < -2 || presence_penalty > 2) errors.push('Presence penalty must be between -2 and 2');
    }

    if (!config.system_prompt || config.system_prompt.trim().length === 0) {
      errors.push('System prompt is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const botConfigurationService = new BotConfigurationService();