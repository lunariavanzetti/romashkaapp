// ROMASHKA Bot Configuration Service
// Updated to work with extended playground_sessions table

import { supabase } from '../lib/supabase';
import { 
  PlaygroundSession, 
  PlaygroundConfigForm, 
  PersonalityTraits, 
  ResponseStyle, 
  AIModel,
  BotPerformanceMetrics,
  PlaygroundAPIResponse,
  PlaygroundStats,
  DEFAULT_PERSONALITY_TRAITS,
  DEFAULT_BOT_CONFIG
} from '../types/playground';

export class BotConfigurationService {
  // Create a new bot configuration (playground session)
  async createBotConfiguration(
    userId: string, 
    config: PlaygroundConfigForm
  ): Promise<PlaygroundAPIResponse<PlaygroundSession>> {
    try {
      const sessionData = {
        user_id: userId,
        session_name: config.bot_name,
        bot_name: config.bot_name,
        bot_avatar_url: config.bot_avatar_url,
        personality_traits: config.personality_traits,
        response_style: config.response_style,
        ai_model: config.ai_model,
        system_prompt: config.system_prompt,
        bot_configuration: config.bot_configuration,
        test_conversations: [],
        performance_metrics: {},
        is_active: true,
        test_count: 0
      };

      const { data, error } = await supabase
        .from('playground_sessions')
        .insert([sessionData])
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
        data: data as PlaygroundSession,
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
  async getBotConfigurations(userId: string): Promise<PlaygroundAPIResponse<PlaygroundSession[]>> {
    try {
      const { data, error } = await supabase
        .from('playground_sessions')
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
        data: data as PlaygroundSession[]
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
  async getBotConfiguration(sessionId: string): Promise<PlaygroundAPIResponse<PlaygroundSession>> {
    try {
      const { data, error } = await supabase
        .from('playground_sessions')
        .select('*')
        .eq('id', sessionId)
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
        data: data as PlaygroundSession
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
    sessionId: string, 
    config: Partial<PlaygroundConfigForm>
  ): Promise<PlaygroundAPIResponse<PlaygroundSession>> {
    try {
      const updateData: any = {};

      if (config.bot_name) {
        updateData.bot_name = config.bot_name;
        updateData.session_name = config.bot_name;
      }
      if (config.bot_avatar_url !== undefined) updateData.bot_avatar_url = config.bot_avatar_url;
      if (config.personality_traits) updateData.personality_traits = config.personality_traits;
      if (config.response_style) updateData.response_style = config.response_style;
      if (config.ai_model) updateData.ai_model = config.ai_model;
      if (config.system_prompt !== undefined) updateData.system_prompt = config.system_prompt;
      if (config.bot_configuration) updateData.bot_configuration = config.bot_configuration;

      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('playground_sessions')
        .update(updateData)
        .eq('id', sessionId)
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
        data: data as PlaygroundSession,
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
  async deleteBotConfiguration(sessionId: string): Promise<PlaygroundAPIResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('playground_sessions')
        .delete()
        .eq('id', sessionId);

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
    sessionId: string,
    newName?: string
  ): Promise<PlaygroundAPIResponse<PlaygroundSession>> {
    try {
      // Get the original configuration
      const originalResult = await this.getBotConfiguration(sessionId);
      if (!originalResult.success || !originalResult.data) {
        return {
          success: false,
          error: 'Original configuration not found'
        };
      }

      const original = originalResult.data;
      const clonedData = {
        user_id: original.user_id,
        session_name: newName || `${original.session_name} (Copy)`,
        bot_name: newName || `${original.bot_name} (Copy)`,
        bot_avatar_url: original.bot_avatar_url,
        personality_traits: original.personality_traits,
        response_style: original.response_style,
        ai_model: original.ai_model,
        system_prompt: original.system_prompt,
        bot_configuration: original.bot_configuration,
        test_conversations: [],
        performance_metrics: {},
        is_active: true,
        test_count: 0
      };

      const { data, error } = await supabase
        .from('playground_sessions')
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
        data: data as PlaygroundSession,
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
    sessionId: string,
    userId: string,
    metrics: {
      test_message: string;
      ai_response: string;
      response_time_ms: number;
      quality_score: number;
      confidence_score: number;
      personality_alignment: any;
      tokens_used: number;
      cost_usd: number;
      error_details?: any;
    }
  ): Promise<PlaygroundAPIResponse<BotPerformanceMetrics>> {
    try {
      const { data, error } = await supabase
        .from('bot_performance_metrics')
        .insert([{
          session_id: sessionId,
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

      // Update session performance metrics
      await this.updateSessionPerformanceMetrics(sessionId);

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

  // Update session performance metrics
  private async updateSessionPerformanceMetrics(sessionId: string): Promise<void> {
    try {
      // Get all performance metrics for this session
      const { data: metrics, error } = await supabase
        .from('bot_performance_metrics')
        .select('*')
        .eq('session_id', sessionId);

      if (error || !metrics || metrics.length === 0) {
        return;
      }

      // Calculate averages
      const totalTests = metrics.length;
      const avgResponseTime = Math.round(
        metrics.reduce((sum, m) => sum + m.response_time_ms, 0) / totalTests
      );
      const avgQualityScore = 
        metrics.reduce((sum, m) => sum + m.quality_score, 0) / totalTests;
      const totalTokens = metrics.reduce((sum, m) => sum + m.tokens_used, 0);
      const totalCost = metrics.reduce((sum, m) => sum + m.cost_usd, 0);

      // Update session with calculated metrics
      const performanceMetrics = {
        avg_response_time: avgResponseTime,
        avg_quality_score: avgQualityScore,
        total_tests: totalTests,
        total_tokens: totalTokens,
        total_cost: totalCost
      };

      await supabase
        .from('playground_sessions')
        .update({
          performance_metrics: performanceMetrics,
          test_count: totalTests,
          last_tested_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Error updating session performance metrics:', error);
    }
  }

  // Get performance metrics for a session
  async getPerformanceMetrics(sessionId: string): Promise<PlaygroundAPIResponse<BotPerformanceMetrics[]>> {
    try {
      const { data, error } = await supabase
        .from('bot_performance_metrics')
        .select('*')
        .eq('session_id', sessionId)
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
      // Get session counts and metrics
      const { data: sessions, error: sessionsError } = await supabase
        .from('playground_sessions')
        .select('*')
        .eq('user_id', userId);

      if (sessionsError) {
        throw sessionsError;
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
      const topPerforming = (sessions || [])
        .filter(s => s.performance_metrics?.avg_quality_score)
        .sort((a, b) => (b.performance_metrics?.avg_quality_score || 0) - (a.performance_metrics?.avg_quality_score || 0))
        .slice(0, 5);

      const stats: PlaygroundStats = {
        total_sessions: sessions?.length || 0,
        total_tests: totalTests,
        avg_response_time: avgResponseTime,
        avg_quality_score: avgQualityScore,
        active_ab_tests: abTests?.length || 0,
        total_tokens_used: totalTokens,
        total_cost: totalCost,
        top_performing_configs: topPerforming as PlaygroundSession[],
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
  async createDefaultBotConfiguration(userId: string): Promise<PlaygroundAPIResponse<PlaygroundSession>> {
    const defaultConfig: PlaygroundConfigForm = {
      bot_name: 'ROMASHKA Assistant',
      personality_traits: DEFAULT_PERSONALITY_TRAITS,
      response_style: 'professional',
      ai_model: 'gpt-4o-mini',
      system_prompt: 'You are ROMASHKA Assistant, a professional customer support AI. Be helpful, accurate, and maintain a professional tone while being empathetic to customer needs.',
      bot_configuration: DEFAULT_BOT_CONFIG
    };

    return this.createBotConfiguration(userId, defaultConfig);
  }

  // Validate bot configuration
  validateBotConfiguration(config: PlaygroundConfigForm): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.bot_name || config.bot_name.trim().length === 0) {
      errors.push('Bot name is required');
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

    if (!config.bot_configuration) {
      errors.push('Bot configuration is required');
    } else {
      const { temperature, max_tokens } = config.bot_configuration;
      if (temperature < 0 || temperature > 2) errors.push('Temperature must be between 0 and 2');
      if (max_tokens < 1 || max_tokens > 4000) errors.push('Max tokens must be between 1 and 4000');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const botConfigurationService = new BotConfigurationService();