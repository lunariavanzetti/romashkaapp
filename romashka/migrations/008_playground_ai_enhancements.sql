-- ROMASHKA AI Playground Enhancement Migration
-- Migration: 008_playground_ai_enhancements.sql
-- Version: 1.0.0
-- Description: Enhanced AI playground with real OpenAI integration and bot configurations
-- Date: 2024-01-15
-- Author: ROMASHKA Team

-- ================================
-- MIGRATION METADATA
-- ================================

-- Check if migration has already been run
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schema_migrations') THEN
    IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = '008_playground_ai_enhancements') THEN
      RAISE NOTICE 'Migration 008_playground_ai_enhancements has already been applied';
      RETURN;
    END IF;
  END IF;
END $$;

-- ================================
-- EXTEND EXISTING PLAYGROUND_SESSIONS TABLE
-- ================================

-- Add new columns to existing playground_sessions table
ALTER TABLE playground_sessions
ADD COLUMN IF NOT EXISTS bot_name VARCHAR(255) DEFAULT 'ROMASHKA Assistant',
ADD COLUMN IF NOT EXISTS bot_avatar_url TEXT,
ADD COLUMN IF NOT EXISTS personality_traits JSONB DEFAULT '{"formality": 50, "enthusiasm": 60, "technical_depth": 70, "empathy": 80}'::jsonb,
ADD COLUMN IF NOT EXISTS response_style VARCHAR(50) DEFAULT 'professional',
ADD COLUMN IF NOT EXISTS ai_model VARCHAR(50) DEFAULT 'gpt-4o-mini',
ADD COLUMN IF NOT EXISTS system_prompt TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_tested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS test_count INTEGER DEFAULT 0;

-- ================================
-- NEW TABLES FOR AI PLAYGROUND
-- ================================

-- Bot performance metrics for tracking AI response quality
CREATE TABLE IF NOT EXISTS bot_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES playground_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  test_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  response_time_ms INTEGER NOT NULL,
  quality_score DECIMAL(3,2) DEFAULT 0.0,
  confidence_score DECIMAL(3,2) DEFAULT 0.0,
  personality_alignment JSONB DEFAULT '{}',
  tokens_used INTEGER DEFAULT 0,
  cost_usd DECIMAL(10,6) DEFAULT 0.0,
  error_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Add constraints
  CONSTRAINT quality_score_range CHECK (quality_score >= 0.0 AND quality_score <= 1.0),
  CONSTRAINT confidence_score_range CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0)
);

-- A/B Testing configurations
CREATE TABLE IF NOT EXISTS playground_ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  test_name VARCHAR(255) NOT NULL,
  control_session_id UUID REFERENCES playground_sessions(id) ON DELETE CASCADE,
  variant_session_id UUID REFERENCES playground_sessions(id) ON DELETE CASCADE,
  test_messages TEXT[] NOT NULL,
  status VARCHAR(50) DEFAULT 'running',
  sample_size INTEGER DEFAULT 10,
  current_responses INTEGER DEFAULT 0,
  control_metrics JSONB DEFAULT '{}',
  variant_metrics JSONB DEFAULT '{}',
  statistical_significance DECIMAL(3,2) DEFAULT 0.0,
  winner VARCHAR(50), -- 'control', 'variant', 'inconclusive'
  confidence_interval JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test scenario results
CREATE TABLE IF NOT EXISTS test_scenario_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES playground_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  scenario_name VARCHAR(255) NOT NULL,
  scenario_category VARCHAR(100) NOT NULL,
  test_message TEXT NOT NULL,
  expected_outcome TEXT,
  ai_response TEXT NOT NULL,
  response_time_ms INTEGER NOT NULL,
  passed BOOLEAN DEFAULT false,
  quality_score DECIMAL(3,2) DEFAULT 0.0,
  personality_analysis JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- INDEXES FOR PERFORMANCE
-- ================================

-- Performance metrics indexes
CREATE INDEX IF NOT EXISTS idx_bot_performance_metrics_session_id ON bot_performance_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_bot_performance_metrics_user_id ON bot_performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_performance_metrics_created_at ON bot_performance_metrics(created_at);

-- A/B testing indexes
CREATE INDEX IF NOT EXISTS idx_playground_ab_tests_user_id ON playground_ab_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_playground_ab_tests_status ON playground_ab_tests(status);
CREATE INDEX IF NOT EXISTS idx_playground_ab_tests_control_session ON playground_ab_tests(control_session_id);
CREATE INDEX IF NOT EXISTS idx_playground_ab_tests_variant_session ON playground_ab_tests(variant_session_id);

-- Test scenario results indexes
CREATE INDEX IF NOT EXISTS idx_test_scenario_results_session_id ON test_scenario_results(session_id);
CREATE INDEX IF NOT EXISTS idx_test_scenario_results_user_id ON test_scenario_results(user_id);
CREATE INDEX IF NOT EXISTS idx_test_scenario_results_scenario_name ON test_scenario_results(scenario_name);
CREATE INDEX IF NOT EXISTS idx_test_scenario_results_created_at ON test_scenario_results(created_at);

-- ================================
-- ROW LEVEL SECURITY POLICIES
-- ================================

-- Enable RLS on new tables
ALTER TABLE bot_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE playground_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_scenario_results ENABLE ROW LEVEL SECURITY;

-- Bot performance metrics policies
CREATE POLICY "Allow users to view their own bot performance metrics"
ON bot_performance_metrics FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own bot performance metrics"
ON bot_performance_metrics FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own bot performance metrics"
ON bot_performance_metrics FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own bot performance metrics"
ON bot_performance_metrics FOR DELETE
USING (auth.uid() = user_id);

-- A/B testing policies
CREATE POLICY "Allow users to view their own A/B tests"
ON playground_ab_tests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to manage their own A/B tests"
ON playground_ab_tests FOR ALL
USING (auth.uid() = user_id);

-- Test scenario results policies
CREATE POLICY "Allow users to view their own test scenario results"
ON test_scenario_results FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to manage their own test scenario results"
ON test_scenario_results FOR ALL
USING (auth.uid() = user_id);

-- ================================
-- TRIGGERS FOR UPDATED_AT
-- ================================

-- Update triggers for new tables
CREATE TRIGGER update_playground_ab_tests_updated_at
BEFORE UPDATE ON playground_ab_tests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- UTILITY FUNCTIONS
-- ================================

-- Function to calculate personality alignment score
CREATE OR REPLACE FUNCTION calculate_personality_alignment(
  target_traits JSONB,
  analyzed_traits JSONB
) RETURNS DECIMAL(3,2) AS $$
DECLARE
  total_score DECIMAL := 0;
  trait_count INTEGER := 0;
  trait_key TEXT;
  target_value NUMERIC;
  analyzed_value NUMERIC;
  trait_score DECIMAL;
BEGIN
  -- Loop through each personality trait
  FOR trait_key IN SELECT jsonb_object_keys(target_traits) LOOP
    target_value := (target_traits ->> trait_key)::NUMERIC;
    analyzed_value := (analyzed_traits ->> trait_key)::NUMERIC;
    
    -- Calculate alignment score (closer to 1 means better alignment)
    trait_score := 1.0 - ABS(target_value - analyzed_value) / 100.0;
    total_score := total_score + trait_score;
    trait_count := trait_count + 1;
  END LOOP;
  
  -- Return average alignment score
  IF trait_count > 0 THEN
    RETURN total_score / trait_count;
  ELSE
    RETURN 0.0;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update performance metrics
CREATE OR REPLACE FUNCTION update_session_performance_metrics(
  p_session_id UUID,
  p_avg_response_time INTEGER,
  p_avg_quality_score DECIMAL,
  p_total_tests INTEGER
) RETURNS void AS $$
BEGIN
  UPDATE playground_sessions
  SET 
    performance_metrics = jsonb_set(
      jsonb_set(
        jsonb_set(
          COALESCE(performance_metrics, '{}'),
          '{avg_response_time}',
          to_jsonb(p_avg_response_time)
        ),
        '{avg_quality_score}',
        to_jsonb(p_avg_quality_score)
      ),
      '{total_tests}',
      to_jsonb(p_total_tests)
    ),
    test_count = p_total_tests,
    last_tested_at = NOW(),
    updated_at = NOW()
  WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- SAMPLE DATA FOR TESTING
-- ================================

-- Sample bot configurations (only insert if none exist)
INSERT INTO playground_sessions (user_id, session_name, bot_name, bot_configuration, personality_traits, response_style, system_prompt)
SELECT 
  id,
  'Default Assistant',
  'ROMASHKA Assistant',
  '{"model": "gpt-4o-mini", "temperature": 0.7, "max_tokens": 500}',
  '{"formality": 70, "enthusiasm": 60, "technical_depth": 80, "empathy": 75}',
  'professional',
  'You are ROMASHKA Assistant, a professional customer support AI. Be helpful, accurate, and maintain a professional tone.'
FROM profiles 
WHERE NOT EXISTS (SELECT 1 FROM playground_sessions WHERE user_id = profiles.id);

-- ================================
-- REGISTER MIGRATION
-- ================================

-- Record migration completion
INSERT INTO schema_migrations (version, description)
VALUES ('008_playground_ai_enhancements', 'Enhanced AI playground with real OpenAI integration and bot configurations');

-- ================================
-- VERIFICATION QUERY
-- ================================

-- Verify the migration was successful
DO $$
BEGIN
  RAISE NOTICE 'Migration 008_playground_ai_enhancements completed successfully!';
  RAISE NOTICE 'New tables created: bot_performance_metrics, playground_ab_tests, test_scenario_results';
  RAISE NOTICE 'playground_sessions table enhanced with AI-specific columns';
  RAISE NOTICE 'RLS policies and indexes created for security and performance';
END $$;