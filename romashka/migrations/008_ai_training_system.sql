-- Migration 008: AI Training System
-- Complete AI training pipeline for enterprise features
-- Phase 1 Implementation

-- Training Datasets table
CREATE TABLE IF NOT EXISTS training_datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_paths TEXT[],
    data_type VARCHAR(50) NOT NULL, -- 'conversations', 'faq', 'knowledge'
    conversation_count INTEGER DEFAULT 0,
    quality_score DECIMAL(3,2) DEFAULT 0,
    processing_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    processing_error TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training Jobs table
CREATE TABLE IF NOT EXISTS training_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID REFERENCES training_datasets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    job_type VARCHAR(50) NOT NULL, -- 'conversation_analysis', 'scenario_training', 'model_optimization'
    job_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
    progress_percentage INTEGER DEFAULT 0,
    configuration JSONB DEFAULT '{}',
    results JSONB DEFAULT '{}',
    accuracy_improvement DECIMAL(3,2),
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training Sessions table
CREATE TABLE IF NOT EXISTS training_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES training_jobs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    session_name VARCHAR(255) NOT NULL,
    session_type VARCHAR(50) NOT NULL, -- 'analysis', 'training', 'validation'
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'failed'
    configuration JSONB DEFAULT '{}',
    data_source JSONB DEFAULT '{}',
    metrics JSONB DEFAULT '{}',
    insights JSONB DEFAULT '{}',
    duration_seconds INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training Metrics History table
CREATE TABLE IF NOT EXISTS training_metrics_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    metric_type VARCHAR(100) NOT NULL, -- 'accuracy', 'response_time', 'customer_satisfaction', 'resolution_rate'
    metric_value DECIMAL(10,4) NOT NULL,
    metric_unit VARCHAR(50), -- 'percentage', 'seconds', 'rating', 'count'
    context JSONB DEFAULT '{}',
    comparison_baseline DECIMAL(10,4),
    improvement_percentage DECIMAL(5,2),
    date_recorded TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge Gaps table
CREATE TABLE IF NOT EXISTS knowledge_gaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    topic VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    frequency INTEGER DEFAULT 1,
    impact_score DECIMAL(3,2) DEFAULT 0,
    severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    suggested_content TEXT,
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high'
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    contexts JSONB DEFAULT '[]', -- array of conversation contexts where gap was detected
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'resolved', 'dismissed'
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning Insights table
CREATE TABLE IF NOT EXISTS learning_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL, -- 'success_pattern', 'failure_pattern', 'improvement_opportunity'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    confidence_score DECIMAL(3,2) DEFAULT 0,
    impact_score DECIMAL(3,2) DEFAULT 0,
    actionable BOOLEAN DEFAULT false,
    category VARCHAR(100),
    data JSONB DEFAULT '{}',
    evidence JSONB DEFAULT '{}',
    recommendations TEXT[],
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'implemented', 'dismissed'
    implemented_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pattern Recognition table
CREATE TABLE IF NOT EXISTS pattern_recognition (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    pattern_name VARCHAR(255) NOT NULL,
    pattern_type VARCHAR(50) NOT NULL, -- 'conversation_flow', 'response_effectiveness', 'customer_behavior'
    pattern_description TEXT,
    frequency INTEGER DEFAULT 1,
    confidence_score DECIMAL(3,2) DEFAULT 0,
    impact_score DECIMAL(3,2) DEFAULT 0,
    context VARCHAR(100) NOT NULL, -- 'frequently_asked_questions', 'successful_responses', 'failed_responses'
    examples JSONB DEFAULT '[]',
    suggestions TEXT[],
    actionable BOOLEAN DEFAULT false,
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training Scenarios table
CREATE TABLE IF NOT EXISTS training_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    scenario_text TEXT NOT NULL,
    ideal_response TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    difficulty_level VARCHAR(20) DEFAULT 'medium', -- 'easy', 'medium', 'hard'
    category VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training Results table
CREATE TABLE IF NOT EXISTS training_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE,
    scenario_id UUID REFERENCES training_scenarios(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    ai_response TEXT,
    expected_response TEXT,
    accuracy_score DECIMAL(3,2),
    response_time_ms INTEGER,
    feedback TEXT,
    improvement_suggestions TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_training_datasets_user_id ON training_datasets(user_id);
CREATE INDEX IF NOT EXISTS idx_training_datasets_status ON training_datasets(processing_status);
CREATE INDEX IF NOT EXISTS idx_training_datasets_created_at ON training_datasets(created_at);

CREATE INDEX IF NOT EXISTS idx_training_jobs_dataset_id ON training_jobs(dataset_id);
CREATE INDEX IF NOT EXISTS idx_training_jobs_user_id ON training_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_training_jobs_status ON training_jobs(job_status);
CREATE INDEX IF NOT EXISTS idx_training_jobs_type ON training_jobs(job_type);

CREATE INDEX IF NOT EXISTS idx_training_sessions_job_id ON training_sessions(job_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_user_id ON training_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_status ON training_sessions(status);
CREATE INDEX IF NOT EXISTS idx_training_sessions_type ON training_sessions(session_type);

CREATE INDEX IF NOT EXISTS idx_training_metrics_session_id ON training_metrics_history(session_id);
CREATE INDEX IF NOT EXISTS idx_training_metrics_user_id ON training_metrics_history(user_id);
CREATE INDEX IF NOT EXISTS idx_training_metrics_type ON training_metrics_history(metric_type);
CREATE INDEX IF NOT EXISTS idx_training_metrics_date ON training_metrics_history(date_recorded);

CREATE INDEX IF NOT EXISTS idx_knowledge_gaps_user_id ON knowledge_gaps(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_gaps_topic ON knowledge_gaps(topic);
CREATE INDEX IF NOT EXISTS idx_knowledge_gaps_status ON knowledge_gaps(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_gaps_priority ON knowledge_gaps(priority);

CREATE INDEX IF NOT EXISTS idx_learning_insights_user_id ON learning_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_insights_type ON learning_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_learning_insights_status ON learning_insights(status);

CREATE INDEX IF NOT EXISTS idx_pattern_recognition_user_id ON pattern_recognition(user_id);
CREATE INDEX IF NOT EXISTS idx_pattern_recognition_type ON pattern_recognition(pattern_type);
CREATE INDEX IF NOT EXISTS idx_pattern_recognition_context ON pattern_recognition(context);

CREATE INDEX IF NOT EXISTS idx_training_scenarios_user_id ON training_scenarios(user_id);
CREATE INDEX IF NOT EXISTS idx_training_scenarios_active ON training_scenarios(is_active);
CREATE INDEX IF NOT EXISTS idx_training_scenarios_category ON training_scenarios(category);

CREATE INDEX IF NOT EXISTS idx_training_results_session_id ON training_results(session_id);
CREATE INDEX IF NOT EXISTS idx_training_results_scenario_id ON training_results(scenario_id);
CREATE INDEX IF NOT EXISTS idx_training_results_user_id ON training_results(user_id);

-- Enable RLS
ALTER TABLE training_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_metrics_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE pattern_recognition ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own training datasets" ON training_datasets FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create training datasets" ON training_datasets FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own training datasets" ON training_datasets FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view own training jobs" ON training_jobs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create training jobs" ON training_jobs FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own training jobs" ON training_jobs FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view own training sessions" ON training_sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create training sessions" ON training_sessions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own training sessions" ON training_sessions FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view own training metrics" ON training_metrics_history FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create training metrics" ON training_metrics_history FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own knowledge gaps" ON knowledge_gaps FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create knowledge gaps" ON knowledge_gaps FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own knowledge gaps" ON knowledge_gaps FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view own learning insights" ON learning_insights FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create learning insights" ON learning_insights FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own learning insights" ON learning_insights FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view own pattern recognition" ON pattern_recognition FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create pattern recognition" ON pattern_recognition FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own pattern recognition" ON pattern_recognition FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view own training scenarios" ON training_scenarios FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create training scenarios" ON training_scenarios FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own training scenarios" ON training_scenarios FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view own training results" ON training_results FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create training results" ON training_results FOR INSERT WITH CHECK (user_id = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER update_training_datasets_updated_at BEFORE UPDATE ON training_datasets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_training_jobs_updated_at BEFORE UPDATE ON training_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_training_sessions_updated_at BEFORE UPDATE ON training_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_knowledge_gaps_updated_at BEFORE UPDATE ON knowledge_gaps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_learning_insights_updated_at BEFORE UPDATE ON learning_insights FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pattern_recognition_updated_at BEFORE UPDATE ON pattern_recognition FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_training_scenarios_updated_at BEFORE UPDATE ON training_scenarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Training functions
CREATE OR REPLACE FUNCTION get_training_metrics_summary(user_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE(
    metric_type VARCHAR(100),
    current_value DECIMAL(10,4),
    previous_value DECIMAL(10,4),
    improvement_percentage DECIMAL(5,2),
    trend VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    WITH current_metrics AS (
        SELECT 
            tmh.metric_type,
            AVG(tmh.metric_value) as avg_value
        FROM training_metrics_history tmh
        WHERE tmh.user_id = user_uuid
        AND tmh.date_recorded >= NOW() - INTERVAL '1 day' * days_back
        GROUP BY tmh.metric_type
    ),
    previous_metrics AS (
        SELECT 
            tmh.metric_type,
            AVG(tmh.metric_value) as avg_value
        FROM training_metrics_history tmh
        WHERE tmh.user_id = user_uuid
        AND tmh.date_recorded >= NOW() - INTERVAL '1 day' * (days_back * 2)
        AND tmh.date_recorded < NOW() - INTERVAL '1 day' * days_back
        GROUP BY tmh.metric_type
    )
    SELECT 
        c.metric_type,
        c.avg_value,
        COALESCE(p.avg_value, 0),
        CASE 
            WHEN p.avg_value > 0 THEN ((c.avg_value - p.avg_value) / p.avg_value * 100)
            ELSE 0 
        END,
        CASE 
            WHEN p.avg_value IS NULL THEN 'new'::VARCHAR(20)
            WHEN c.avg_value > p.avg_value THEN 'improving'::VARCHAR(20)
            WHEN c.avg_value < p.avg_value THEN 'declining'::VARCHAR(20)
            ELSE 'stable'::VARCHAR(20)
        END
    FROM current_metrics c
    LEFT JOIN previous_metrics p ON c.metric_type = p.metric_type;
END;
$$ LANGUAGE plpgsql;

-- Insert sample training scenarios
INSERT INTO training_scenarios (user_id, name, description, scenario_text, ideal_response, context, difficulty_level, category, tags) VALUES
(
    (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
    'Order Status Inquiry',
    'Customer asking about order status',
    'Hi, I placed an order 3 days ago and I haven''t received any updates. Can you help me check the status?',
    'I''d be happy to help you check your order status! Could you please provide me with your order number or the email address you used when placing the order?',
    '{"customer_emotion": "concerned", "urgency": "medium", "context": "e-commerce"}',
    'easy',
    'Customer Service',
    ARRAY['orders', 'status', 'inquiry']
),
(
    (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
    'Technical Support - Complex Issue',
    'Customer with technical problem requiring troubleshooting',
    'I''m having trouble connecting to your API. I keep getting a 401 error even though I''m using the correct API key. This is affecting our production system.',
    'I understand this is impacting your production system, so let''s resolve this quickly. A 401 error typically indicates an authentication issue. Let me help you troubleshoot: 1) First, can you confirm you''re using the API key in the Authorization header? 2) Is this a new API key or one that was working before?',
    '{"customer_emotion": "frustrated", "urgency": "high", "context": "technical_support", "system_impact": "production"}',
    'hard',
    'Technical Support',
    ARRAY['api', 'authentication', 'troubleshooting', 'production']
)
ON CONFLICT DO NOTHING;