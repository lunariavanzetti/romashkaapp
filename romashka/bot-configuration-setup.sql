-- Bot Configuration System Setup
-- Run this SQL in your Supabase SQL editor to set up the AI playground

-- Bot configurations table
CREATE TABLE IF NOT EXISTS bot_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  bot_name TEXT NOT NULL DEFAULT 'ROMASHKA Assistant',
  avatar_emoji TEXT DEFAULT '🤖',
  personality_traits JSONB NOT NULL DEFAULT '{
    "formality": 50,
    "enthusiasm": 50,
    "technical_depth": 50,
    "empathy": 50
  }',
  response_style TEXT DEFAULT 'conversational',
  custom_instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bot performance metrics
CREATE TABLE IF NOT EXISTS bot_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_config_id UUID REFERENCES bot_configurations(id) ON DELETE CASCADE,
  test_scenario TEXT,
  response_quality_score INTEGER,
  response_time_ms INTEGER,
  customer_satisfaction_rating DECIMAL(2,1),
  confidence_score DECIMAL(3,2),
  personality_analysis JSONB DEFAULT '{}',
  tested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test scenarios table
CREATE TABLE IF NOT EXISTS test_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  user_messages TEXT[] NOT NULL,
  expected_outcomes TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A/B test configurations
CREATE TABLE IF NOT EXISTS ab_test_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  description TEXT,
  variants JSONB NOT NULL DEFAULT '[]',
  metrics JSONB DEFAULT '{}',
  is_running BOOLEAN DEFAULT false,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Playground test results
CREATE TABLE IF NOT EXISTS playground_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  bot_config_id UUID REFERENCES bot_configurations(id) ON DELETE CASCADE,
  test_scenario_id UUID REFERENCES test_scenarios(id) ON DELETE SET NULL,
  test_message TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  response_time_ms INTEGER,
  confidence_score DECIMAL(3,2),
  personality_analysis JSONB DEFAULT '{}',
  knowledge_sources TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bot_configurations_user_id ON bot_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_configurations_active ON bot_configurations(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_bot_performance_metrics_config_id ON bot_performance_metrics(bot_config_id);
CREATE INDEX IF NOT EXISTS idx_test_scenarios_user_id ON test_scenarios(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_configurations_user_id ON ab_test_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_playground_test_results_user_id ON playground_test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_playground_test_results_config_id ON playground_test_results(bot_config_id);

-- Row Level Security
ALTER TABLE bot_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE playground_test_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own bot configurations" ON bot_configurations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own performance metrics" ON bot_performance_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM bot_configurations 
      WHERE bot_configurations.id = bot_performance_metrics.bot_config_id 
      AND bot_configurations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own test scenarios" ON test_scenarios
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own A/B tests" ON ab_test_configurations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own test results" ON playground_test_results
  FOR ALL USING (auth.uid() = user_id);

-- Functions for updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_bot_configurations_updated_at
  BEFORE UPDATE ON bot_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_scenarios_updated_at
  BEFORE UPDATE ON test_scenarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ab_test_configurations_updated_at
  BEFORE UPDATE ON ab_test_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();