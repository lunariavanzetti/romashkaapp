-- Migration 009: Enhanced Template System
-- Adds enterprise template features: variables, AI optimization, A/B testing, analytics

-- Template Variables System
CREATE TABLE IF NOT EXISTS template_variables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    variable_name TEXT NOT NULL,
    variable_type TEXT NOT NULL CHECK (variable_type IN ('string', 'number', 'boolean', 'date', 'array', 'object')),
    default_value JSONB,
    validation_rules JSONB,
    description TEXT,
    is_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Template Analytics
CREATE TABLE IF NOT EXISTS template_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    avg_response_time DECIMAL(10,2) DEFAULT 0,
    user_satisfaction DECIMAL(3,2) DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    analytics_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Template Suggestions (AI-powered)
CREATE TABLE IF NOT EXISTS template_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    context_data JSONB NOT NULL,
    suggested_template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
    suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('ai_generated', 'usage_based', 'context_aware', 'performance_optimized')),
    confidence_score DECIMAL(3,2) DEFAULT 0,
    suggestion_text TEXT,
    is_accepted BOOLEAN DEFAULT false,
    feedback_score INTEGER CHECK (feedback_score >= 1 AND feedback_score <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    accepted_at TIMESTAMP WITH TIME ZONE
);

-- Template Optimization (AI-driven improvements)
CREATE TABLE IF NOT EXISTS template_optimization (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    optimization_type TEXT NOT NULL CHECK (optimization_type IN ('ai_rewrite', 'performance_boost', 'personalization', 'sentiment_adjustment')),
    original_content TEXT NOT NULL,
    optimized_content TEXT NOT NULL,
    improvement_score DECIMAL(5,2) DEFAULT 0,
    performance_metrics JSONB,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    activated_at TIMESTAMP WITH TIME ZONE
);

-- Template Usage History (detailed tracking)
CREATE TABLE IF NOT EXISTS template_usage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    usage_context JSONB,
    variables_used JSONB,
    response_time_ms INTEGER,
    user_satisfaction INTEGER CHECK (user_satisfaction >= 1 AND user_satisfaction <= 5),
    effectiveness_score DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Template A/B Tests
CREATE TABLE IF NOT EXISTS template_ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_name TEXT NOT NULL,
    template_a_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    template_b_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    traffic_split DECIMAL(3,2) DEFAULT 0.5,
    success_metric TEXT NOT NULL CHECK (success_metric IN ('conversion_rate', 'response_time', 'user_satisfaction', 'engagement')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'paused')),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    results JSONB,
    winner_template_id UUID REFERENCES templates(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Template Performance Metrics
CREATE TABLE IF NOT EXISTS template_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('response_time', 'accuracy', 'satisfaction', 'conversion', 'engagement')),
    measurement_date DATE DEFAULT CURRENT_DATE,
    aggregation_period TEXT DEFAULT 'daily' CHECK (aggregation_period IN ('hourly', 'daily', 'weekly', 'monthly')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Template Triggers (automated deployment)
CREATE TABLE IF NOT EXISTS template_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('keyword_match', 'sentiment_detection', 'context_based', 'time_based', 'performance_threshold')),
    trigger_conditions JSONB NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('suggest', 'auto_apply', 'notify', 'escalate')),
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1,
    success_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_template_variables_template_id ON template_variables(template_id);
CREATE INDEX IF NOT EXISTS idx_template_analytics_template_id ON template_analytics(template_id);
CREATE INDEX IF NOT EXISTS idx_template_analytics_date ON template_analytics(analytics_date);
CREATE INDEX IF NOT EXISTS idx_template_suggestions_user_id ON template_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_template_suggestions_type ON template_suggestions(suggestion_type);
CREATE INDEX IF NOT EXISTS idx_template_optimization_template_id ON template_optimization(template_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_history_template_id ON template_usage_history(template_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_history_user_id ON template_usage_history(user_id);
CREATE INDEX IF NOT EXISTS idx_template_ab_tests_status ON template_ab_tests(status);
CREATE INDEX IF NOT EXISTS idx_template_performance_metrics_template_id ON template_performance_metrics(template_id);
CREATE INDEX IF NOT EXISTS idx_template_performance_metrics_date ON template_performance_metrics(measurement_date);
CREATE INDEX IF NOT EXISTS idx_template_triggers_template_id ON template_triggers(template_id);
CREATE INDEX IF NOT EXISTS idx_template_triggers_active ON template_triggers(is_active);

-- Row Level Security Policies
ALTER TABLE template_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_optimization ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_usage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_triggers ENABLE ROW LEVEL SECURITY;

-- Template Variables Policies
DROP POLICY IF EXISTS "Users can view template variables they have access to" ON template_variables;
CREATE POLICY "Users can view template variables they have access to" ON template_variables
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM templates t 
            WHERE t.id = template_variables.template_id 
            AND t.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage template variables for their templates" ON template_variables;
CREATE POLICY "Users can manage template variables for their templates" ON template_variables
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM templates t 
            WHERE t.id = template_variables.template_id 
            AND t.user_id = auth.uid()
        )
    );

-- Template Analytics Policies
DROP POLICY IF EXISTS "Users can view analytics for their templates" ON template_analytics;
CREATE POLICY "Users can view analytics for their templates" ON template_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM templates t 
            WHERE t.id = template_analytics.template_id 
            AND t.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "System can update template analytics" ON template_analytics;
CREATE POLICY "System can update template analytics" ON template_analytics
    FOR ALL USING (true);

-- Template Suggestions Policies
DROP POLICY IF EXISTS "Users can view their template suggestions" ON template_suggestions;
CREATE POLICY "Users can view their template suggestions" ON template_suggestions
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their template suggestions" ON template_suggestions;
CREATE POLICY "Users can manage their template suggestions" ON template_suggestions
    FOR ALL USING (user_id = auth.uid());

-- Template Optimization Policies
DROP POLICY IF EXISTS "Users can view optimization for their templates" ON template_optimization;
CREATE POLICY "Users can view optimization for their templates" ON template_optimization
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM templates t 
            WHERE t.id = template_optimization.template_id 
            AND t.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage optimization for their templates" ON template_optimization;
CREATE POLICY "Users can manage optimization for their templates" ON template_optimization
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM templates t 
            WHERE t.id = template_optimization.template_id 
            AND t.user_id = auth.uid()
        )
    );

-- Template Usage History Policies
DROP POLICY IF EXISTS "Users can view their template usage history" ON template_usage_history;
CREATE POLICY "Users can view their template usage history" ON template_usage_history
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can log their template usage" ON template_usage_history;
CREATE POLICY "Users can log their template usage" ON template_usage_history
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Template A/B Tests Policies
DROP POLICY IF EXISTS "Users can view A/B tests for their templates" ON template_ab_tests;
CREATE POLICY "Users can view A/B tests for their templates" ON template_ab_tests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM templates t 
            WHERE (t.id = template_ab_tests.template_a_id OR t.id = template_ab_tests.template_b_id)
            AND t.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage A/B tests for their templates" ON template_ab_tests;
CREATE POLICY "Users can manage A/B tests for their templates" ON template_ab_tests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM templates t 
            WHERE (t.id = template_ab_tests.template_a_id OR t.id = template_ab_tests.template_b_id)
            AND t.user_id = auth.uid()
        )
    );

-- Template Performance Metrics Policies
DROP POLICY IF EXISTS "Users can view performance metrics for their templates" ON template_performance_metrics;
CREATE POLICY "Users can view performance metrics for their templates" ON template_performance_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM templates t 
            WHERE t.id = template_performance_metrics.template_id 
            AND t.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "System can update performance metrics" ON template_performance_metrics;
CREATE POLICY "System can update performance metrics" ON template_performance_metrics
    FOR ALL USING (true);

-- Template Triggers Policies
DROP POLICY IF EXISTS "Users can view triggers for their templates" ON template_triggers;
CREATE POLICY "Users can view triggers for their templates" ON template_triggers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM templates t 
            WHERE t.id = template_triggers.template_id 
            AND t.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage triggers for their templates" ON template_triggers;
CREATE POLICY "Users can manage triggers for their templates" ON template_triggers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM templates t 
            WHERE t.id = template_triggers.template_id 
            AND t.user_id = auth.uid()
        )
    );

-- Functions for template analytics
CREATE OR REPLACE FUNCTION update_template_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update usage count and last used timestamp
    INSERT INTO template_analytics (template_id, usage_count, last_used_at)
    VALUES (NEW.template_id, 1, now())
    ON CONFLICT (template_id, analytics_date) 
    DO UPDATE SET 
        usage_count = template_analytics.usage_count + 1,
        last_used_at = now(),
        updated_at = now();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic analytics updates
DROP TRIGGER IF EXISTS trigger_update_template_analytics ON template_usage_history;
CREATE TRIGGER trigger_update_template_analytics
    AFTER INSERT ON template_usage_history
    FOR EACH ROW
    EXECUTE FUNCTION update_template_analytics();

-- Function to calculate template performance scores
CREATE OR REPLACE FUNCTION calculate_template_performance_score(template_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    performance_score DECIMAL DEFAULT 0;
    usage_count INTEGER DEFAULT 0;
    avg_satisfaction DECIMAL DEFAULT 0;
    avg_response_time DECIMAL DEFAULT 0;
    success_rate DECIMAL DEFAULT 0;
BEGIN
    -- Get usage metrics
    SELECT COUNT(*), AVG(user_satisfaction), AVG(response_time_ms), AVG(effectiveness_score)
    INTO usage_count, avg_satisfaction, avg_response_time, success_rate
    FROM template_usage_history
    WHERE template_usage_history.template_id = calculate_template_performance_score.template_id;
    
    -- Calculate composite score (weighted average)
    performance_score := (
        (COALESCE(avg_satisfaction, 0) * 0.3) +
        (CASE WHEN avg_response_time > 0 THEN (5000 / avg_response_time) * 0.2 ELSE 0 END) +
        (COALESCE(success_rate, 0) * 0.3) +
        (LEAST(usage_count / 100.0, 1) * 0.2)
    );
    
    RETURN LEAST(performance_score, 5.0);
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON template_variables TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON template_analytics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON template_suggestions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON template_optimization TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON template_usage_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON template_ab_tests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON template_performance_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON template_triggers TO authenticated;

-- Grant sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;