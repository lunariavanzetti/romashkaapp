-- Migration 009: Enhanced Response Templates System
-- AI-optimized template system with variables, analytics, and auto-suggestions
-- Phase 2 Implementation

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Template Variables table
CREATE TABLE IF NOT EXISTS template_variables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    variable_name VARCHAR(255) NOT NULL,
    variable_type VARCHAR(50) NOT NULL, -- 'text', 'number', 'date', 'select', 'boolean'
    is_required BOOLEAN DEFAULT false,
    default_value TEXT,
    options JSONB DEFAULT '[]', -- for select type
    validation_rules JSONB DEFAULT '{}',
    placeholder TEXT,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(template_id, variable_name)
);

-- Template Analytics table
CREATE TABLE IF NOT EXISTS template_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    average_response_time DECIMAL(10,2) DEFAULT 0,
    customer_satisfaction DECIMAL(3,2) DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    effectiveness_score DECIMAL(3,2) DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    performance_trend VARCHAR(20) DEFAULT 'stable', -- 'improving', 'declining', 'stable'
    optimization_suggestions JSONB DEFAULT '[]',
    a_b_test_results JSONB DEFAULT '{}',
    date_period DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Template Suggestions table
CREATE TABLE IF NOT EXISTS template_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    customer_message TEXT NOT NULL,
    suggested_templates JSONB NOT NULL, -- array of template suggestions with scores
    context JSONB DEFAULT '{}',
    confidence_score DECIMAL(3,2) DEFAULT 0,
    was_used BOOLEAN DEFAULT false,
    selected_template_id UUID REFERENCES templates(id),
    feedback_rating INTEGER, -- 1-5 rating
    feedback_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Template Optimization table
CREATE TABLE IF NOT EXISTS template_optimization (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    optimization_type VARCHAR(50) NOT NULL, -- 'ai_rewrite', 'a_b_test', 'performance_tune'
    original_content TEXT NOT NULL,
    optimized_content TEXT NOT NULL,
    optimization_reason TEXT,
    expected_improvement DECIMAL(5,2),
    actual_improvement DECIMAL(5,2),
    test_results JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'testing', 'approved', 'rejected'
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Template Usage History table
CREATE TABLE IF NOT EXISTS template_usage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    variables_used JSONB DEFAULT '{}',
    response_time_ms INTEGER,
    customer_reaction VARCHAR(50), -- 'positive', 'negative', 'neutral'
    effectiveness_rating INTEGER, -- 1-5 rating
    context_match_score DECIMAL(3,2) DEFAULT 0,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Template A/B Tests table
CREATE TABLE IF NOT EXISTS template_ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    test_name VARCHAR(255) NOT NULL,
    variant_a_content TEXT NOT NULL,
    variant_b_content TEXT NOT NULL,
    test_config JSONB DEFAULT '{}',
    traffic_split DECIMAL(3,2) DEFAULT 0.5, -- 0.5 = 50/50 split
    status VARCHAR(20) DEFAULT 'running', -- 'running', 'completed', 'paused'
    confidence_level DECIMAL(3,2) DEFAULT 0.95,
    significance_threshold DECIMAL(3,2) DEFAULT 0.05,
    results JSONB DEFAULT '{}',
    winner_variant CHAR(1), -- 'A' or 'B'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Template Performance Metrics table
CREATE TABLE IF NOT EXISTS template_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,4) NOT NULL,
    metric_unit VARCHAR(50),
    benchmark_value DECIMAL(10,4),
    variance_percentage DECIMAL(5,2),
    trend_direction VARCHAR(20), -- 'up', 'down', 'stable'
    measurement_period VARCHAR(20) DEFAULT 'daily', -- 'hourly', 'daily', 'weekly', 'monthly'
    date_recorded TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Template Triggers table
CREATE TABLE IF NOT EXISTS template_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    trigger_type VARCHAR(50) NOT NULL, -- 'keyword', 'intent', 'sentiment', 'context'
    trigger_value TEXT NOT NULL,
    trigger_condition VARCHAR(50) DEFAULT 'contains', -- 'contains', 'equals', 'starts_with', 'ends_with', 'regex'
    confidence_threshold DECIMAL(3,2) DEFAULT 0.8,
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_template_variables_template_id ON template_variables(template_id);
CREATE INDEX IF NOT EXISTS idx_template_variables_user_id ON template_variables(user_id);
CREATE INDEX IF NOT EXISTS idx_template_variables_type ON template_variables(variable_type);

CREATE INDEX IF NOT EXISTS idx_template_analytics_template_id ON template_analytics(template_id);
CREATE INDEX IF NOT EXISTS idx_template_analytics_user_id ON template_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_template_analytics_date_period ON template_analytics(date_period);
CREATE INDEX IF NOT EXISTS idx_template_analytics_effectiveness ON template_analytics(effectiveness_score);

CREATE INDEX IF NOT EXISTS idx_template_suggestions_user_id ON template_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_template_suggestions_conversation_id ON template_suggestions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_template_suggestions_confidence ON template_suggestions(confidence_score);
CREATE INDEX IF NOT EXISTS idx_template_suggestions_was_used ON template_suggestions(was_used);

CREATE INDEX IF NOT EXISTS idx_template_optimization_template_id ON template_optimization(template_id);
CREATE INDEX IF NOT EXISTS idx_template_optimization_user_id ON template_optimization(user_id);
CREATE INDEX IF NOT EXISTS idx_template_optimization_type ON template_optimization(optimization_type);
CREATE INDEX IF NOT EXISTS idx_template_optimization_status ON template_optimization(status);

CREATE INDEX IF NOT EXISTS idx_template_usage_history_template_id ON template_usage_history(template_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_history_user_id ON template_usage_history(user_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_history_conversation_id ON template_usage_history(conversation_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_history_used_at ON template_usage_history(used_at);

CREATE INDEX IF NOT EXISTS idx_template_ab_tests_template_id ON template_ab_tests(template_id);
CREATE INDEX IF NOT EXISTS idx_template_ab_tests_user_id ON template_ab_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_template_ab_tests_status ON template_ab_tests(status);

CREATE INDEX IF NOT EXISTS idx_template_performance_metrics_template_id ON template_performance_metrics(template_id);
CREATE INDEX IF NOT EXISTS idx_template_performance_metrics_user_id ON template_performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_template_performance_metrics_metric_name ON template_performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_template_performance_metrics_date ON template_performance_metrics(date_recorded);

CREATE INDEX IF NOT EXISTS idx_template_triggers_template_id ON template_triggers(template_id);
CREATE INDEX IF NOT EXISTS idx_template_triggers_user_id ON template_triggers(user_id);
CREATE INDEX IF NOT EXISTS idx_template_triggers_type ON template_triggers(trigger_type);
CREATE INDEX IF NOT EXISTS idx_template_triggers_active ON template_triggers(is_active);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_template_suggestions_message_search ON template_suggestions USING gin(to_tsvector('english', customer_message));
CREATE INDEX IF NOT EXISTS idx_template_optimization_content_search ON template_optimization USING gin(to_tsvector('english', original_content || ' ' || optimized_content));

-- Enable RLS
ALTER TABLE template_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_optimization ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_usage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_triggers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own template variables" ON template_variables FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create template variables" ON template_variables FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own template variables" ON template_variables FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own template variables" ON template_variables FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Users can view own template analytics" ON template_analytics FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create template analytics" ON template_analytics FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own template analytics" ON template_analytics FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view own template suggestions" ON template_suggestions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create template suggestions" ON template_suggestions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own template suggestions" ON template_suggestions FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view own template optimization" ON template_optimization FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create template optimization" ON template_optimization FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own template optimization" ON template_optimization FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view own template usage history" ON template_usage_history FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create template usage history" ON template_usage_history FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own template ab tests" ON template_ab_tests FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create template ab tests" ON template_ab_tests FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own template ab tests" ON template_ab_tests FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view own template performance metrics" ON template_performance_metrics FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create template performance metrics" ON template_performance_metrics FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own template triggers" ON template_triggers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create template triggers" ON template_triggers FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own template triggers" ON template_triggers FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own template triggers" ON template_triggers FOR DELETE USING (user_id = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER update_template_variables_updated_at BEFORE UPDATE ON template_variables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_template_analytics_updated_at BEFORE UPDATE ON template_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_template_suggestions_updated_at BEFORE UPDATE ON template_suggestions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_template_optimization_updated_at BEFORE UPDATE ON template_optimization FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_template_ab_tests_updated_at BEFORE UPDATE ON template_ab_tests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_template_triggers_updated_at BEFORE UPDATE ON template_triggers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Template analytics functions
CREATE OR REPLACE FUNCTION calculate_template_effectiveness(template_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    effectiveness_score DECIMAL(3,2);
BEGIN
    SELECT 
        (
            (AVG(CASE WHEN tuh.effectiveness_rating >= 4 THEN 1 ELSE 0 END) * 0.4) +
            (AVG(CASE WHEN tuh.customer_reaction = 'positive' THEN 1 ELSE 0 END) * 0.3) +
            (AVG(tuh.context_match_score) * 0.3)
        ) INTO effectiveness_score
    FROM template_usage_history tuh
    WHERE tuh.template_id = template_uuid
    AND tuh.used_at >= NOW() - INTERVAL '1 day' * days_back;
    
    RETURN COALESCE(effectiveness_score, 0.0);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_template_suggestions(customer_message_text TEXT, user_uuid UUID, limit_count INTEGER DEFAULT 5)
RETURNS TABLE(
    template_id UUID,
    template_name VARCHAR(255),
    template_content TEXT,
    confidence_score DECIMAL(3,2),
    match_reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.name,
        t.content,
        CASE 
            WHEN customer_message_text ILIKE '%' || SPLIT_PART(t.content, ' ', 1) || '%' THEN 0.8
            WHEN customer_message_text ILIKE '%' || SPLIT_PART(t.content, ' ', 2) || '%' THEN 0.6
            ELSE 0.1 + (t.usage_count::DECIMAL / 1000)
        END as confidence,
        CASE 
            WHEN customer_message_text ILIKE '%' || SPLIT_PART(t.content, ' ', 1) || '%' THEN 'Content match'
            WHEN customer_message_text ILIKE '%' || SPLIT_PART(t.content, ' ', 2) || '%' THEN 'Partial match'
            ELSE 'Usage frequency'
        END as match_reason
    FROM templates t
    WHERE t.created_by = user_uuid
    AND t.is_active = true
    ORDER BY confidence DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_template_analytics_daily()
RETURNS void AS $$
BEGIN
    INSERT INTO template_analytics (
        template_id,
        user_id,
        usage_count,
        success_rate,
        average_response_time,
        customer_satisfaction,
        effectiveness_score,
        last_used_at,
        date_period
    )
    SELECT 
        tuh.template_id,
        tuh.user_id,
        COUNT(*) as usage_count,
        AVG(CASE WHEN tuh.effectiveness_rating >= 4 THEN 100 ELSE 0 END) as success_rate,
        AVG(tuh.response_time_ms) as average_response_time,
        AVG(CASE WHEN tuh.customer_reaction = 'positive' THEN 5 
                 WHEN tuh.customer_reaction = 'neutral' THEN 3
                 ELSE 1 END) as customer_satisfaction,
        calculate_template_effectiveness(tuh.template_id, 1) as effectiveness_score,
        MAX(tuh.used_at) as last_used_at,
        CURRENT_DATE as date_period
    FROM template_usage_history tuh
    WHERE tuh.used_at >= CURRENT_DATE - INTERVAL '1 day'
    AND tuh.used_at < CURRENT_DATE
    GROUP BY tuh.template_id, tuh.user_id
    ON CONFLICT (template_id, user_id, date_period)
    DO UPDATE SET
        usage_count = EXCLUDED.usage_count,
        success_rate = EXCLUDED.success_rate,
        average_response_time = EXCLUDED.average_response_time,
        customer_satisfaction = EXCLUDED.customer_satisfaction,
        effectiveness_score = EXCLUDED.effectiveness_score,
        last_used_at = EXCLUDED.last_used_at,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Insert sample template variables for existing templates
INSERT INTO template_variables (template_id, user_id, variable_name, variable_type, is_required, default_value, placeholder, description, sort_order)
SELECT 
    t.id,
    t.created_by,
    'customer_name',
    'text',
    true,
    '',
    'Enter customer name',
    'Customer full name for personalization',
    1
FROM templates t
WHERE t.id IN (SELECT id FROM templates LIMIT 5)
AND t.created_by IS NOT NULL
ON CONFLICT (template_id, variable_name) DO NOTHING;

INSERT INTO template_variables (template_id, user_id, variable_name, variable_type, is_required, options, placeholder, description, sort_order)
SELECT 
    t.id,
    t.created_by,
    'urgency_level',
    'select',
    false,
    '["low", "medium", "high", "critical"]',
    'Select urgency level',
    'Priority level for response timing',
    2
FROM templates t
WHERE t.id IN (SELECT id FROM templates LIMIT 5)
AND t.created_by IS NOT NULL
ON CONFLICT (template_id, variable_name) DO NOTHING;

-- Insert sample template triggers
INSERT INTO template_triggers (template_id, user_id, trigger_type, trigger_value, confidence_threshold, priority)
SELECT 
    t.id,
    t.created_by,
    'keyword',
    'order status',
    0.8,
    1
FROM templates t
WHERE t.name ILIKE '%order%'
AND t.created_by IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO template_triggers (template_id, user_id, trigger_type, trigger_value, confidence_threshold, priority)
SELECT 
    t.id,
    t.created_by,
    'intent',
    'billing_inquiry',
    0.9,
    1
FROM templates t
WHERE t.name ILIKE '%billing%' OR t.name ILIKE '%payment%'
AND t.created_by IS NOT NULL
ON CONFLICT DO NOTHING;