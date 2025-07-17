-- Security and Analytics Tables Migration
-- This migration adds the missing security and analytics tables

-- ================================
-- SECURITY TABLES
-- ================================

-- Two-factor authentication
CREATE TABLE IF NOT EXISTS two_factor_auth (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT false,
    secret VARCHAR(255),
    backup_codes TEXT[],
    method VARCHAR(20) DEFAULT 'totp', -- 'totp', 'sms', 'email'
    phone_number VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security sessions
CREATE TABLE IF NOT EXISTS security_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    login_method VARCHAR(50),
    session_duration INTERVAL,
    logout_reason VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE
);

-- Security incidents
CREATE TABLE IF NOT EXISTS security_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_type VARCHAR(50) NOT NULL, -- 'failed_login', 'suspicious_activity', 'data_breach', 'api_abuse'
    severity VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    ip_address INET,
    description TEXT,
    detection_method VARCHAR(100),
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance checks
CREATE TABLE IF NOT EXISTS compliance_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    check_name VARCHAR(100) NOT NULL,
    check_type VARCHAR(50) NOT NULL, -- 'gdpr', 'security', 'data_retention', 'access_control'
    check_description TEXT,
    check_frequency VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly'
    last_run TIMESTAMP WITH TIME ZONE,
    next_run TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance results
CREATE TABLE IF NOT EXISTS compliance_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    check_id UUID NOT NULL REFERENCES compliance_checks(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL, -- 'passed', 'failed', 'warning', 'error'
    result_details JSONB DEFAULT '{}',
    recommendations TEXT[] DEFAULT '{}',
    severity VARCHAR(20) DEFAULT 'medium',
    auto_remediated BOOLEAN DEFAULT false,
    remediation_actions TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API security logs
CREATE TABLE IF NOT EXISTS api_security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint VARCHAR(255),
    method VARCHAR(10),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    ip_address INET,
    request_size INTEGER,
    response_code INTEGER,
    response_time_ms INTEGER,
    rate_limit_hit BOOLEAN DEFAULT false,
    suspicious_activity BOOLEAN DEFAULT false,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- ANALYTICS TABLES
-- ================================

-- Conversation analytics
CREATE TABLE IF NOT EXISTS conversation_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    channel_type VARCHAR(50),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    message_count INTEGER DEFAULT 0,
    avg_response_time_seconds INTEGER,
    resolution_status VARCHAR(50), -- 'resolved', 'escalated', 'abandoned'
    customer_satisfaction INTEGER CHECK (customer_satisfaction >= 1 AND customer_satisfaction <= 5),
    ai_accuracy_score DECIMAL(3,2) CHECK (ai_accuracy_score >= 0 AND ai_accuracy_score <= 1),
    topics TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily analytics aggregation
CREATE TABLE IF NOT EXISTS daily_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    total_conversations INTEGER DEFAULT 0,
    avg_response_time_seconds INTEGER DEFAULT 0,
    resolution_rate DECIMAL(5,2) DEFAULT 0,
    avg_customer_satisfaction DECIMAL(3,2) DEFAULT 0,
    ai_accuracy_score DECIMAL(3,2) DEFAULT 0,
    channel_distribution JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date)
);

-- Performance metrics
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type VARCHAR(50) NOT NULL,
    metric_value DECIMAL(10,2),
    metric_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Real-time metrics
CREATE TABLE IF NOT EXISTS realtime_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    active_conversations INTEGER DEFAULT 0,
    response_time INTEGER DEFAULT 0,
    satisfaction DECIMAL(3,2) DEFAULT 0,
    ai_resolution DECIMAL(3,2) DEFAULT 0,
    queue_length INTEGER DEFAULT 0,
    agent_utilization DECIMAL(3,2) DEFAULT 0
);

-- ================================
-- INDEXES
-- ================================

-- Security indexes
CREATE INDEX IF NOT EXISTS idx_security_sessions_user_id ON security_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_security_sessions_token ON security_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_security_sessions_active ON security_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_security_incidents_user_id ON security_incidents(user_id);
CREATE INDEX IF NOT EXISTS idx_security_incidents_type ON security_incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_security_incidents_severity ON security_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_compliance_results_check_id ON compliance_results(check_id);
CREATE INDEX IF NOT EXISTS idx_compliance_results_status ON compliance_results(status);
CREATE INDEX IF NOT EXISTS idx_api_security_logs_user_id ON api_security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_security_logs_timestamp ON api_security_logs(timestamp);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_conversation_analytics_conv_id ON conversation_analytics(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_analytics_channel ON conversation_analytics(channel_type);
CREATE INDEX IF NOT EXISTS idx_conversation_analytics_start_time ON conversation_analytics(start_time);
CREATE INDEX IF NOT EXISTS idx_daily_analytics_date ON daily_analytics(date);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(metric_timestamp);
CREATE INDEX IF NOT EXISTS idx_realtime_metrics_timestamp ON realtime_metrics(timestamp);

-- ================================
-- ROW LEVEL SECURITY
-- ================================

-- Enable RLS
ALTER TABLE security_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtime_metrics ENABLE ROW LEVEL SECURITY;

-- Security policies
CREATE POLICY "Users can view own sessions" ON security_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own sessions" ON security_sessions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own incidents" ON security_incidents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all compliance results" ON compliance_results
    FOR SELECT USING (true); -- Will be refined based on user roles

CREATE POLICY "Users can view own analytics" ON conversation_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations c 
            WHERE c.id = conversation_analytics.conversation_id 
            AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view daily analytics" ON daily_analytics
    FOR SELECT USING (true);

CREATE POLICY "Users can view performance metrics" ON performance_metrics
    FOR SELECT USING (true);

CREATE POLICY "Users can view realtime metrics" ON realtime_metrics
    FOR SELECT USING (true);

-- ================================
-- SAMPLE DATA
-- ================================

-- Insert default compliance checks
INSERT INTO compliance_checks (check_name, check_type, check_description, check_frequency) VALUES
    ('GDPR Consent Validation', 'gdpr', 'Validate that all data processing has proper consent', 'daily'),
    ('Data Retention Compliance', 'data_retention', 'Check for data that exceeds retention policies', 'daily'),
    ('Access Control Review', 'security', 'Review user access permissions and roles', 'weekly'),
    ('Session Security Check', 'security', 'Validate session security and detect anomalies', 'daily'),
    ('API Security Audit', 'security', 'Review API usage and security', 'weekly')
ON CONFLICT (check_name) DO NOTHING;

-- Insert sample analytics data for testing
INSERT INTO daily_analytics (date, total_conversations, avg_response_time_seconds, resolution_rate, avg_customer_satisfaction, ai_accuracy_score, channel_distribution) VALUES
    (CURRENT_DATE - INTERVAL '30 days', 45, 120, 0.85, 4.2, 0.78, '{"whatsapp": 20, "email": 15, "widget": 10}'),
    (CURRENT_DATE - INTERVAL '29 days', 52, 115, 0.88, 4.3, 0.82, '{"whatsapp": 25, "email": 18, "widget": 9}'),
    (CURRENT_DATE - INTERVAL '28 days', 38, 130, 0.82, 4.1, 0.75, '{"whatsapp": 18, "email": 12, "widget": 8}'),
    (CURRENT_DATE - INTERVAL '27 days', 61, 108, 0.90, 4.4, 0.85, '{"whatsapp": 30, "email": 20, "widget": 11}'),
    (CURRENT_DATE - INTERVAL '26 days', 47, 125, 0.87, 4.2, 0.80, '{"whatsapp": 22, "email": 16, "widget": 9}'),
    (CURRENT_DATE - INTERVAL '25 days', 55, 118, 0.89, 4.3, 0.83, '{"whatsapp": 28, "email": 19, "widget": 8}'),
    (CURRENT_DATE - INTERVAL '24 days', 42, 135, 0.84, 4.0, 0.77, '{"whatsapp": 20, "email": 14, "widget": 8}'),
    (CURRENT_DATE - INTERVAL '23 days', 49, 122, 0.86, 4.2, 0.79, '{"whatsapp": 24, "email": 17, "widget": 8}'),
    (CURRENT_DATE - INTERVAL '22 days', 58, 112, 0.91, 4.4, 0.86, '{"whatsapp": 32, "email": 18, "widget": 8}'),
    (CURRENT_DATE - INTERVAL '21 days', 44, 128, 0.83, 4.1, 0.76, '{"whatsapp": 21, "email": 15, "widget": 8}'),
    (CURRENT_DATE - INTERVAL '20 days', 53, 116, 0.88, 4.3, 0.81, '{"whatsapp": 26, "email": 19, "widget": 8}'),
    (CURRENT_DATE - INTERVAL '19 days', 46, 124, 0.85, 4.2, 0.78, '{"whatsapp": 23, "email": 16, "widget": 7}'),
    (CURRENT_DATE - INTERVAL '18 days', 51, 119, 0.89, 4.3, 0.82, '{"whatsapp": 27, "email": 17, "widget": 7}'),
    (CURRENT_DATE - INTERVAL '17 days', 39, 132, 0.81, 4.0, 0.74, '{"whatsapp": 19, "email": 13, "widget": 7}'),
    (CURRENT_DATE - INTERVAL '16 days', 56, 114, 0.90, 4.4, 0.84, '{"whatsapp": 29, "email": 20, "widget": 7}'),
    (CURRENT_DATE - INTERVAL '15 days', 48, 121, 0.87, 4.2, 0.80, '{"whatsapp": 24, "email": 17, "widget": 7}'),
    (CURRENT_DATE - INTERVAL '14 days', 62, 109, 0.92, 4.5, 0.87, '{"whatsapp": 33, "email": 21, "widget": 8}'),
    (CURRENT_DATE - INTERVAL '13 days', 43, 127, 0.84, 4.1, 0.77, '{"whatsapp": 21, "email": 15, "widget": 7}'),
    (CURRENT_DATE - INTERVAL '12 days', 50, 117, 0.88, 4.3, 0.81, '{"whatsapp": 26, "email": 18, "widget": 6}'),
    (CURRENT_DATE - INTERVAL '11 days', 45, 123, 0.86, 4.2, 0.79, '{"whatsapp": 23, "email": 16, "widget": 6}'),
    (CURRENT_DATE - INTERVAL '10 days', 54, 115, 0.89, 4.3, 0.83, '{"whatsapp": 28, "email": 19, "widget": 7}'),
    (CURRENT_DATE - INTERVAL '9 days', 41, 129, 0.82, 4.0, 0.75, '{"whatsapp": 20, "email": 14, "widget": 7}'),
    (CURRENT_DATE - INTERVAL '8 days', 57, 111, 0.91, 4.4, 0.85, '{"whatsapp": 30, "email": 20, "widget": 7}'),
    (CURRENT_DATE - INTERVAL '7 days', 47, 120, 0.87, 4.2, 0.80, '{"whatsapp": 24, "email": 17, "widget": 6}'),
    (CURRENT_DATE - INTERVAL '6 days', 59, 110, 0.92, 4.5, 0.86, '{"whatsapp": 31, "email": 21, "widget": 7}'),
    (CURRENT_DATE - INTERVAL '5 days', 44, 126, 0.84, 4.1, 0.77, '{"whatsapp": 22, "email": 15, "widget": 7}'),
    (CURRENT_DATE - INTERVAL '4 days', 52, 118, 0.89, 4.3, 0.82, '{"whatsapp": 27, "email": 18, "widget": 7}'),
    (CURRENT_DATE - INTERVAL '3 days', 48, 122, 0.86, 4.2, 0.79, '{"whatsapp": 25, "email": 16, "widget": 7}'),
    (CURRENT_DATE - INTERVAL '2 days', 55, 113, 0.90, 4.4, 0.84, '{"whatsapp": 29, "email": 19, "widget": 7}'),
    (CURRENT_DATE - INTERVAL '1 day', 46, 124, 0.85, 4.2, 0.78, '{"whatsapp": 24, "email": 16, "widget": 6}'),
    (CURRENT_DATE, 51, 117, 0.88, 4.3, 0.81, '{"whatsapp": 27, "email": 17, "widget": 7}')
ON CONFLICT (date) DO NOTHING;

-- Insert sample performance metrics
INSERT INTO performance_metrics (metric_type, metric_value, metric_timestamp) VALUES
    ('avg_response_time', 120.5, NOW() - INTERVAL '1 hour'),
    ('customer_satisfaction', 4.2, NOW() - INTERVAL '1 hour'),
    ('ai_accuracy', 0.85, NOW() - INTERVAL '1 hour'),
    ('active_conversations', 15, NOW() - INTERVAL '30 minutes'),
    ('avg_response_time', 118.3, NOW() - INTERVAL '30 minutes'),
    ('customer_satisfaction', 4.3, NOW() - INTERVAL '30 minutes'),
    ('ai_accuracy', 0.87, NOW() - INTERVAL '30 minutes'),
    ('active_conversations', 18, NOW())
ON CONFLICT DO NOTHING;

-- Insert sample realtime metrics
INSERT INTO realtime_metrics (timestamp, active_conversations, response_time, satisfaction, ai_resolution, queue_length, agent_utilization) VALUES
    (NOW() - INTERVAL '30 minutes', 15, 120, 4.2, 0.85, 3, 0.75),
    (NOW() - INTERVAL '25 minutes', 18, 115, 4.3, 0.87, 2, 0.82),
    (NOW() - INTERVAL '20 minutes', 16, 125, 4.1, 0.83, 4, 0.78),
    (NOW() - INTERVAL '15 minutes', 20, 110, 4.4, 0.90, 1, 0.85),
    (NOW() - INTERVAL '10 minutes', 17, 118, 4.2, 0.86, 3, 0.80),
    (NOW() - INTERVAL '5 minutes', 19, 112, 4.3, 0.88, 2, 0.83),
    (NOW(), 21, 108, 4.4, 0.91, 1, 0.87);

-- ================================
-- TRIGGERS
-- ================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_two_factor_auth_updated_at
    BEFORE UPDATE ON two_factor_auth
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_checks_updated_at
    BEFORE UPDATE ON compliance_checks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically aggregate conversation analytics
CREATE OR REPLACE FUNCTION aggregate_daily_analytics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO daily_analytics (
        date, 
        total_conversations, 
        avg_response_time_seconds, 
        resolution_rate, 
        avg_customer_satisfaction, 
        ai_accuracy_score
    )
    SELECT 
        DATE(NEW.created_at),
        COUNT(*),
        AVG(avg_response_time_seconds),
        AVG(CASE WHEN resolution_status = 'resolved' THEN 1 ELSE 0 END),
        AVG(customer_satisfaction),
        AVG(ai_accuracy_score)
    FROM conversation_analytics
    WHERE DATE(created_at) = DATE(NEW.created_at)
    GROUP BY DATE(created_at)
    ON CONFLICT (date) DO UPDATE SET
        total_conversations = EXCLUDED.total_conversations,
        avg_response_time_seconds = EXCLUDED.avg_response_time_seconds,
        resolution_rate = EXCLUDED.resolution_rate,
        avg_customer_satisfaction = EXCLUDED.avg_customer_satisfaction,
        ai_accuracy_score = EXCLUDED.ai_accuracy_score;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_aggregate_daily_analytics
    AFTER INSERT ON conversation_analytics
    FOR EACH ROW
    EXECUTE FUNCTION aggregate_daily_analytics();

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Security and Analytics tables migration completed successfully!';
END $$;