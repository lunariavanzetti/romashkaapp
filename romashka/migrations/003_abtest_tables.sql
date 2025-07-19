-- ROMASHKA A/B Testing and Bot Configuration Tables
-- Migration: 003_abtest_tables.sql
-- Version: 1.0.0
-- Description: Create tables for A/B testing, bot configurations, and playground testing
-- Date: 2024-01-19

-- ================================
-- BOT CONFIGURATION TABLES
-- ================================

-- Bot configurations table
CREATE TABLE IF NOT EXISTS bot_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  bot_name VARCHAR(255) NOT NULL DEFAULT 'ROMASHKA Assistant',
  avatar_emoji VARCHAR(10) DEFAULT '🤖',
  personality_traits JSONB NOT NULL DEFAULT '{"formality": 50, "enthusiasm": 50, "technical_depth": 50, "empathy": 50}',
  response_style VARCHAR(20) DEFAULT 'conversational', -- 'concise', 'detailed', 'conversational'
  custom_instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bot performance metrics
CREATE TABLE IF NOT EXISTS bot_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_config_id UUID REFERENCES bot_configurations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_type VARCHAR(50) NOT NULL, -- 'response_time', 'satisfaction', 'accuracy', 'conversion'
  metric_value DECIMAL(10,2) NOT NULL,
  test_date DATE DEFAULT CURRENT_DATE,
  tested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  context JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test scenarios for playground testing
CREATE TABLE IF NOT EXISTS test_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  user_messages TEXT[] NOT NULL,
  expected_outcomes TEXT[],
  difficulty_level VARCHAR(20) DEFAULT 'medium', -- 'easy', 'medium', 'hard', 'expert'
  category VARCHAR(100) DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A/B test configurations
CREATE TABLE IF NOT EXISTS ab_test_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  test_name VARCHAR(255) NOT NULL,
  description TEXT,
  variants JSONB NOT NULL DEFAULT '[]', -- Array of variant configurations
  metrics JSONB DEFAULT '{"response_time": 0, "satisfaction": 0, "conversions": 0}',
  is_running BOOLEAN DEFAULT false,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  sample_size INTEGER DEFAULT 100,
  confidence_level DECIMAL(3,2) DEFAULT 0.95,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A/B test results (individual test interactions)
CREATE TABLE IF NOT EXISTS ab_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_config_id UUID REFERENCES ab_test_configurations(id) ON DELETE CASCADE,
  variant_id VARCHAR(100) NOT NULL,
  user_message TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  response_time_ms INTEGER,
  satisfaction_score INTEGER, -- 1-5 rating
  conversion_achieved BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Playground test results
CREATE TABLE IF NOT EXISTS playground_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  bot_config_id UUID REFERENCES bot_configurations(id) ON DELETE CASCADE,
  test_scenario_id UUID REFERENCES test_scenarios(id) ON DELETE SET NULL,
  user_message TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  response_time_ms INTEGER,
  confidence_score DECIMAL(3,2),
  personality_analysis JSONB,
  knowledge_sources TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- INDEXES FOR PERFORMANCE
-- ================================

CREATE INDEX IF NOT EXISTS idx_bot_configurations_user_id ON bot_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_configurations_active ON bot_configurations(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_bot_performance_metrics_config_id ON bot_performance_metrics(bot_config_id);
CREATE INDEX IF NOT EXISTS idx_bot_performance_metrics_user_id ON bot_performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_performance_metrics_type_date ON bot_performance_metrics(metric_type, test_date);

CREATE INDEX IF NOT EXISTS idx_test_scenarios_user_id ON test_scenarios(user_id);
CREATE INDEX IF NOT EXISTS idx_test_scenarios_active ON test_scenarios(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_test_scenarios_category ON test_scenarios(category);

CREATE INDEX IF NOT EXISTS idx_ab_test_configurations_user_id ON ab_test_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_configurations_running ON ab_test_configurations(is_running);

CREATE INDEX IF NOT EXISTS idx_ab_test_results_config_id ON ab_test_results(test_config_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_variant ON ab_test_results(test_config_id, variant_id);

CREATE INDEX IF NOT EXISTS idx_playground_test_results_user_id ON playground_test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_playground_test_results_config_id ON playground_test_results(bot_config_id);
CREATE INDEX IF NOT EXISTS idx_playground_test_results_scenario ON playground_test_results(test_scenario_id);

-- ================================
-- ROW LEVEL SECURITY POLICIES
-- ================================

-- Enable RLS on all tables
ALTER TABLE bot_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE playground_test_results ENABLE ROW LEVEL SECURITY;

-- Bot configurations policies
CREATE POLICY "Users can manage own bot configurations" ON bot_configurations
  FOR ALL USING (auth.uid() = user_id);

-- Bot performance metrics policies
CREATE POLICY "Users can manage own performance metrics" ON bot_performance_metrics
  FOR ALL USING (auth.uid() = user_id);

-- Test scenarios policies
CREATE POLICY "Users can manage own test scenarios" ON test_scenarios
  FOR ALL USING (auth.uid() = user_id);

-- A/B test configurations policies
CREATE POLICY "Users can manage own A/B test configurations" ON ab_test_configurations
  FOR ALL USING (auth.uid() = user_id);

-- A/B test results policies
CREATE POLICY "Users can view own A/B test results" ON ab_test_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ab_test_configurations 
      WHERE id = ab_test_results.test_config_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert A/B test results" ON ab_test_results
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM ab_test_configurations 
      WHERE id = ab_test_results.test_config_id 
      AND user_id = auth.uid()
    )
  );

-- Playground test results policies
CREATE POLICY "Users can manage own playground test results" ON playground_test_results
  FOR ALL USING (auth.uid() = user_id);

-- ================================
-- TRIGGERS FOR UPDATED_AT
-- ================================

CREATE TRIGGER update_bot_configurations_updated_at
    BEFORE UPDATE ON bot_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_scenarios_updated_at
    BEFORE UPDATE ON test_scenarios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ab_test_configurations_updated_at
    BEFORE UPDATE ON ab_test_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- SAMPLE DATA (Optional)
-- ================================

-- Insert default system-wide test scenarios
INSERT INTO test_scenarios (id, user_id, name, description, user_messages, expected_outcomes, difficulty_level, category) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'Customer Support Greeting', 'Test how the bot handles initial customer greetings', ARRAY['Hello, I need help with my account', 'Hi there! Can someone assist me?'], ARRAY['Friendly greeting', 'Offer assistance'], 'easy', 'greeting'),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'Product Information', 'Test how the bot provides product details', ARRAY['What are your pricing plans?', 'Tell me about your features'], ARRAY['Detailed pricing info', 'Feature comparison'], 'medium', 'product_info'),
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'Technical Support', 'Test how the bot handles technical issues', ARRAY['My dashboard is not loading properly', 'I''m getting an error when trying to integrate'], ARRAY['Technical diagnosis', 'Step-by-step solution'], 'hard', 'technical_support')
ON CONFLICT (id) DO NOTHING;

-- Success message
SELECT 'A/B Testing and Bot Configuration tables created successfully!' as status;