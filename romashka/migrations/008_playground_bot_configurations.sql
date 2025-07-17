-- Migration 008: Playground Bot Configurations
-- Creates tables for bot configurations and performance tracking in playground

-- Bot configurations table
CREATE TABLE IF NOT EXISTS bot_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    bot_name TEXT NOT NULL DEFAULT 'ROMASHKA Assistant',
    avatar_emoji TEXT DEFAULT '🤖',
    personality_traits JSONB NOT NULL DEFAULT '{
        "formality": 50,
        "enthusiasm": 50,
        "technical_depth": 50,
        "empathy": 50
    }',
    response_style TEXT DEFAULT 'conversational' CHECK (response_style IN ('professional', 'casual', 'friendly', 'conversational', 'concise', 'detailed')),
    custom_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT personality_traits_check CHECK (
        personality_traits ? 'formality' AND 
        personality_traits ? 'enthusiasm' AND 
        personality_traits ? 'technical_depth' AND 
        personality_traits ? 'empathy'
    )
);

-- Bot performance metrics
CREATE TABLE IF NOT EXISTS bot_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_config_id UUID REFERENCES bot_configurations(id) ON DELETE CASCADE NOT NULL,
    test_scenario TEXT NOT NULL,
    test_message TEXT NOT NULL,
    response_text TEXT NOT NULL,
    response_quality_score INTEGER CHECK (response_quality_score >= 0 AND response_quality_score <= 100),
    response_time_ms INTEGER NOT NULL,
    customer_satisfaction_rating DECIMAL(2,1) CHECK (customer_satisfaction_rating >= 0 AND customer_satisfaction_rating <= 5),
    personality_consistency_score DECIMAL(3,2) CHECK (personality_consistency_score >= 0 AND personality_consistency_score <= 1),
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    tokens_used INTEGER DEFAULT 0,
    tested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A/B testing configurations
CREATE TABLE IF NOT EXISTS playground_ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    test_name TEXT NOT NULL,
    description TEXT,
    config_a_id UUID REFERENCES bot_configurations(id) ON DELETE CASCADE NOT NULL,
    config_b_id UUID REFERENCES bot_configurations(id) ON DELETE CASCADE NOT NULL,
    test_messages TEXT[] NOT NULL DEFAULT '{}',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'completed', 'paused')),
    results JSONB DEFAULT '{}',
    winner TEXT CHECK (winner IN ('A', 'B', 'tie', null)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test scenario results
CREATE TABLE IF NOT EXISTS test_scenario_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_config_id UUID REFERENCES bot_configurations(id) ON DELETE CASCADE NOT NULL,
    scenario_id TEXT NOT NULL,
    scenario_name TEXT NOT NULL,
    test_messages JSONB NOT NULL DEFAULT '[]',
    results JSONB NOT NULL DEFAULT '[]',
    average_response_time DECIMAL(8,2),
    average_quality_score DECIMAL(5,2),
    average_confidence DECIMAL(3,2),
    tested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bot_configurations_user_id ON bot_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_performance_metrics_config_id ON bot_performance_metrics(bot_config_id);
CREATE INDEX IF NOT EXISTS idx_bot_performance_metrics_tested_at ON bot_performance_metrics(tested_at);
CREATE INDEX IF NOT EXISTS idx_playground_ab_tests_user_id ON playground_ab_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_playground_ab_tests_status ON playground_ab_tests(status);
CREATE INDEX IF NOT EXISTS idx_test_scenario_results_config_id ON test_scenario_results(bot_config_id);

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_bot_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bot_configurations_update_timestamp
    BEFORE UPDATE ON bot_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_bot_config_timestamp();

CREATE TRIGGER playground_ab_tests_update_timestamp
    BEFORE UPDATE ON playground_ab_tests
    FOR EACH ROW
    EXECUTE FUNCTION update_bot_config_timestamp();

-- Enable Row Level Security
ALTER TABLE bot_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE playground_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_scenario_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own bot configurations" ON bot_configurations
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view performance metrics for their bot configurations" ON bot_performance_metrics
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM bot_configurations WHERE id = bot_config_id
        )
    );

CREATE POLICY "Users can manage their own A/B tests" ON playground_ab_tests
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view scenario results for their bot configurations" ON test_scenario_results
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM bot_configurations WHERE id = bot_config_id
        )
    );

-- Add helpful comments
COMMENT ON TABLE bot_configurations IS 'Playground bot configuration settings with personality traits';
COMMENT ON TABLE bot_performance_metrics IS 'Performance tracking for bot configurations in playground';
COMMENT ON TABLE playground_ab_tests IS 'A/B testing configurations for comparing bot setups';
COMMENT ON TABLE test_scenario_results IS 'Results from running predefined test scenarios';