import { supabase } from '../lib/supabase';
import type { 
  BotConfiguration, 
  PersonalityTraits, 
  BotConfigurationHistory,
  BotPerformanceMetric,
  TestScenario,
  ABTestConfiguration,
  PlaygroundTestResult
} from '../types/botConfiguration';

export class BotConfigurationService {
  /**
   * Save bot configuration to database
   */
  async saveBotConfig(config: BotConfiguration): Promise<BotConfiguration> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const configData = {
      user_id: user.id,
      bot_name: config.bot_name,
      avatar_emoji: config.avatar_emoji,
      personality_traits: config.personality_traits,
      response_style: config.response_style,
      custom_instructions: config.custom_instructions,
      is_active: config.is_active ?? true
    };

    let result;
    if (config.id) {
      // Update existing configuration
      const { data, error } = await supabase
        .from('bot_configurations')
        .update(configData)
        .eq('id', config.id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Create new configuration
      const { data, error } = await supabase
        .from('bot_configurations')
        .insert(configData)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }

    return result;
  }

  /**
   * Load bot configuration for current user
   */
  async loadBotConfig(userId?: string): Promise<BotConfiguration | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const targetUserId = userId || user.id;

    const { data, error } = await supabase
      .from('bot_configurations')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Update personality traits only
   */
  async updatePersonalityTraits(configId: string, traits: PersonalityTraits): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('bot_configurations')
      .update({ personality_traits: traits })
      .eq('id', configId)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  /**
   * Get configuration history for user
   */
  async getConfigurationHistory(): Promise<BotConfigurationHistory> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get all configurations
    const { data: configurations, error: configError } = await supabase
      .from('bot_configurations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (configError) throw configError;

    // Get performance metrics
    const { data: metrics, error: metricsError } = await supabase
      .from('bot_performance_metrics')
      .select(`
        *,
        bot_configurations!inner(user_id)
      `)
      .eq('bot_configurations.user_id', user.id)
      .order('tested_at', { ascending: false });

    if (metricsError) throw metricsError;

    // Get test results
    const { data: testResults, error: resultsError } = await supabase
      .from('playground_test_results')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (resultsError) throw resultsError;

    return {
      configurations: configurations || [],
      performance_metrics: metrics || [],
      test_results: testResults || []
    };
  }

  /**
   * Create default bot configuration for new user
   */
  async createDefaultConfiguration(): Promise<BotConfiguration> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const defaultConfig: BotConfiguration = {
      bot_name: 'ROMASHKA Assistant',
      avatar_emoji: '🤖',
      personality_traits: {
        formality: 50,
        enthusiasm: 50,
        technical_depth: 50,
        empathy: 50
      },
      response_style: 'conversational',
      custom_instructions: 'You are a helpful AI customer service assistant. Be professional, friendly, and provide accurate information.',
      is_active: true
    };

    return await this.saveBotConfig(defaultConfig);
  }

  /**
   * Save performance metric
   */
  async savePerformanceMetric(metric: BotPerformanceMetric): Promise<void> {
    const { error } = await supabase
      .from('bot_performance_metrics')
      .insert(metric);

    if (error) throw error;
  }

  /**
   * Get test scenarios for user
   */
  async getTestScenarios(): Promise<TestScenario[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('test_scenarios')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // If no custom scenarios exist, return default scenarios
    if (!data || data.length === 0) {
      return this.getDefaultTestScenarios();
    }
    
    return data;
  }

  /**
   * Get default test scenarios for new users
   */
  private getDefaultTestScenarios(): TestScenario[] {
    return [
      {
        id: 'default-1',
        name: 'Customer Support Greeting',
        description: 'Test how the bot handles initial customer greetings and requests for help',
        user_messages: [
          'Hello, I need help with my account',
          'Hi there! Can someone assist me?',
          'Good morning, I have a question about your services'
        ],
        expected_outcomes: ['Friendly greeting', 'Offer assistance', 'Ask for specifics'],
        difficulty_level: 'easy',
        category: 'greeting',
        is_active: true,
        user_id: 'default',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'default-2',
        name: 'Product Information',
        description: 'Test how the bot provides product details and pricing information',
        user_messages: [
          'What are your pricing plans?',
          'Tell me about your features',
          'How much does the professional plan cost?'
        ],
        expected_outcomes: ['Detailed pricing info', 'Feature comparison', 'Clear pricing structure'],
        difficulty_level: 'medium',
        category: 'product_info',
        is_active: true,
        user_id: 'default',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'default-3',
        name: 'Technical Support',
        description: 'Test how the bot handles technical issues and troubleshooting',
        user_messages: [
          'My dashboard is not loading properly',
          'I\'m getting an error when trying to integrate with Slack',
          'The AI responses seem slower than usual'
        ],
        expected_outcomes: ['Technical diagnosis', 'Step-by-step solution', 'Escalation if needed'],
        difficulty_level: 'hard',
        category: 'technical_support',
        is_active: true,
        user_id: 'default',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'default-4',
        name: 'Billing and Account',
        description: 'Test how the bot handles billing questions and account management',
        user_messages: [
          'I want to upgrade my plan',
          'When will I be charged for next month?',
          'Can I cancel my subscription?'
        ],
        expected_outcomes: ['Clear billing info', 'Upgrade process', 'Account management guidance'],
        difficulty_level: 'medium',
        category: 'billing',
        is_active: true,
        user_id: 'default',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'default-5',
        name: 'Complex Problem Solving',
        description: 'Test how the bot handles complex, multi-part customer issues',
        user_messages: [
          'I\'ve been trying to set up WhatsApp integration for 3 days, followed all the docs, but customers\' messages aren\'t coming through. I\'ve checked the webhook URL, verified the API keys, and even recreated the integration twice. What else could be wrong?'
        ],
        expected_outcomes: ['Systematic troubleshooting', 'Multiple solution attempts', 'Expert escalation'],
        difficulty_level: 'expert',
        category: 'complex_troubleshooting',
        is_active: true,
        user_id: 'default',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  /**
   * Create custom test scenario
   */
  async createTestScenario(scenario: Omit<TestScenario, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<TestScenario> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('test_scenarios')
      .insert({
        user_id: user.id,
        ...scenario
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Save A/B test configuration
   */
  async saveABTestConfig(config: ABTestConfiguration): Promise<ABTestConfiguration> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const configData = {
      user_id: user.id,
      test_name: config.test_name,
      description: config.description,
      variants: config.variants,
      metrics: config.metrics,
      is_running: config.is_running ?? false,
      start_date: config.start_date,
      end_date: config.end_date
    };

    let result;
    if (config.id) {
      const { data, error } = await supabase
        .from('ab_test_configurations')
        .update(configData)
        .eq('id', config.id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('ab_test_configurations')
        .insert(configData)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }

    return result;
  }

  /**
   * Get A/B test configurations
   */
  async getABTestConfigs(): Promise<ABTestConfiguration[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('ab_test_configurations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Save playground test result
   */
  async saveTestResult(result: PlaygroundTestResult): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('playground_test_results')
      .insert({
        user_id: user.id,
        ...result
      });

    if (error) throw error;
  }

  /**
   * Get playground test results
   */
  async getTestResults(botConfigId?: string): Promise<PlaygroundTestResult[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    let query = supabase
      .from('playground_test_results')
      .select('*')
      .eq('user_id', user.id);

    if (botConfigId) {
      query = query.eq('bot_config_id', botConfigId);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return data || [];
  }

  /**
   * Delete bot configuration
   */
  async deleteBotConfig(configId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('bot_configurations')
      .delete()
      .eq('id', configId)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  /**
   * Deactivate bot configuration
   */
  async deactivateBotConfig(configId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('bot_configurations')
      .update({ is_active: false })
      .eq('id', configId)
      .eq('user_id', user.id);

    if (error) throw error;
  }
}

export const botConfigurationService = new BotConfigurationService();