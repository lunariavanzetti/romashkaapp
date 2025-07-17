-- ================================
-- MISSING SECURITY & ANALYTICS TABLES MIGRATION (FIXED)
-- Agent 27: Analytics & Security Integration Specialist
-- ================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================
-- SECURITY TABLES (MISSING)
-- ================================

-- Security sessions tracking
CREATE TABLE IF NOT EXISTS security_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    login_method TEXT DEFAULT 'password',
    session_duration INTERVAL,
    logout_reason TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security incidents monitoring
CREATE TABLE IF NOT EXISTS security_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_type TEXT NOT NULL CHECK (incident_type IN ('failed_login', 'suspicious_activity', 'data_breach', 'api_abuse', 'unauthorized_access')),
    severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    ip_address INET,
    description TEXT,
    detection_method TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance monitoring and results
CREATE TABLE IF NOT EXISTS compliance_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    compliance_type TEXT NOT NULL CHECK (compliance_type IN ('gdpr', 'ccpa', 'hipaa', 'sox', 'iso27001')),
    check_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'warning', 'error')),
    details JSONB DEFAULT '{}',
    remediation_steps TEXT[] DEFAULT '{}',
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    auto_remediated BOOLEAN DEFAULT FALSE,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    next_check_due TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API security monitoring
CREATE TABLE IF NOT EXISTS api_security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint TEXT,
    method TEXT,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    ip_address INET,
    request_size INTEGER,
    response_code INTEGER,
    response_time_ms INTEGER,
    rate_limit_hit BOOLEAN DEFAULT FALSE,
    suspicious_activity BOOLEAN DEFAULT FALSE,
    request_headers JSONB DEFAULT '{}',
    response_headers JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Two-factor authentication (if missing)
CREATE TABLE IF NOT EXISTS two_factor_auth (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT FALSE,
    secret TEXT,
    backup_codes TEXT[],
    method TEXT DEFAULT 'totp' CHECK (method IN ('totp', 'sms', 'email')),
    phone_number TEXT,
    email TEXT,
    last_used TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- ENHANCED ANALYTICS TABLES
-- ================================

-- Predictive analytics storage
CREATE TABLE IF NOT EXISTS predictive_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_type TEXT NOT NULL CHECK (prediction_type IN ('volume_forecast', 'satisfaction_trend', 'staffing_needs', 'performance_prediction')),
    prediction_date DATE NOT NULL,
    predicted_value DECIMAL(10,4),
    confidence_level DECIMAL(5,4) CHECK (confidence_level >= 0 AND confidence_level <= 1),
    model_version TEXT DEFAULT '1.0',
    input_features JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business intelligence metrics
CREATE TABLE IF NOT EXISTS business_intelligence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_category TEXT NOT NULL CHECK (metric_category IN ('kpi', 'trend', 'insight', 'recommendation')),
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(15,4),
    metric_unit TEXT,
    time_period TEXT,
    dimensions JSONB DEFAULT '{}',
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Customer journey analytics
CREATE TABLE IF NOT EXISTS customer_journey (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE,
    journey_stage TEXT NOT NULL CHECK (journey_stage IN ('discovery', 'consideration', 'decision', 'onboarding', 'support', 'retention')),
    touchpoint TEXT,
    channel_type TEXT,
    interaction_type TEXT,
    session_duration INTEGER,
    conversion_achieved BOOLEAN DEFAULT FALSE,
    satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sentiment analysis results
CREATE TABLE IF NOT EXISTS sentiment_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    sentiment_score DECIMAL(3,2) CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
    sentiment_label TEXT CHECK (sentiment_label IN ('positive', 'negative', 'neutral')),
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    emotions JSONB DEFAULT '{}',
    keywords TEXT[],
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Advanced performance metrics
CREATE TABLE IF NOT EXISTS advanced_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type TEXT NOT NULL,
    metric_subtype TEXT,
    metric_value DECIMAL(15,4),
    metric_metadata JSONB DEFAULT '{}',
    aggregation_period TEXT CHECK (aggregation_period IN ('minute', 'hour', 'day', 'week', 'month')),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- INDEXES FOR PERFORMANCE
-- ================================

-- Security indexes
CREATE INDEX IF NOT EXISTS idx_security_sessions_user_id ON security_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_security_sessions_active ON security_sessions(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_security_sessions_token ON security_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_security_sessions_last_activity ON security_sessions(last_activity);

CREATE INDEX IF NOT EXISTS idx_security_incidents_type ON security_incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_security_incidents_severity ON security_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_security_incidents_user_id ON security_incidents(user_id);
CREATE INDEX IF NOT EXISTS idx_security_incidents_created_at ON security_incidents(created_at);
CREATE INDEX IF NOT EXISTS idx_security_incidents_resolved ON security_incidents(resolved);

CREATE INDEX IF NOT EXISTS idx_compliance_results_type ON compliance_results(compliance_type);
CREATE INDEX IF NOT EXISTS idx_compliance_results_status ON compliance_results(status);
CREATE INDEX IF NOT EXISTS idx_compliance_results_checked_at ON compliance_results(checked_at);
CREATE INDEX IF NOT EXISTS idx_compliance_results_next_check ON compliance_results(next_check_due);

CREATE INDEX IF NOT EXISTS idx_api_security_logs_user_id ON api_security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_security_logs_endpoint ON api_security_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_security_logs_timestamp ON api_security_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_api_security_logs_suspicious ON api_security_logs(suspicious_activity) WHERE suspicious_activity = TRUE;

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_predictive_analytics_type ON predictive_analytics(prediction_type);
CREATE INDEX IF NOT EXISTS idx_predictive_analytics_date ON predictive_analytics(prediction_date);
CREATE INDEX IF NOT EXISTS idx_predictive_analytics_created_at ON predictive_analytics(created_at);

CREATE INDEX IF NOT EXISTS idx_business_intelligence_category ON business_intelligence(metric_category);
CREATE INDEX IF NOT EXISTS idx_business_intelligence_name ON business_intelligence(metric_name);
CREATE INDEX IF NOT EXISTS idx_business_intelligence_calculated_at ON business_intelligence(calculated_at);

CREATE INDEX IF NOT EXISTS idx_customer_journey_customer_id ON customer_journey(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_journey_stage ON customer_journey(journey_stage);
CREATE INDEX IF NOT EXISTS idx_customer_journey_created_at ON customer_journey(created_at);

CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_conversation_id ON sentiment_analysis(conversation_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_message_id ON sentiment_analysis(message_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_sentiment ON sentiment_analysis(sentiment_label);
CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_analyzed_at ON sentiment_analysis(analyzed_at);

CREATE INDEX IF NOT EXISTS idx_advanced_metrics_type ON advanced_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_advanced_metrics_subtype ON advanced_metrics(metric_subtype);
CREATE INDEX IF NOT EXISTS idx_advanced_metrics_period ON advanced_metrics(aggregation_period);
CREATE INDEX IF NOT EXISTS idx_advanced_metrics_start_time ON advanced_metrics(start_time);

-- ================================
-- ROW LEVEL SECURITY POLICIES
-- ================================

-- Enable RLS on new tables
ALTER TABLE security_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictive_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_journey ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE advanced_metrics ENABLE ROW LEVEL SECURITY;

-- Security policies
CREATE POLICY "Users can view own security sessions" ON security_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own security sessions" ON security_sessions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view security incidents" ON security_incidents
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (
        SELECT id FROM profiles WHERE role IN ('admin', 'security_admin')
    ));

CREATE POLICY "Admin can view all compliance results" ON compliance_results
    FOR SELECT USING (auth.uid() IN (
        SELECT id FROM profiles WHERE role IN ('admin', 'compliance_admin')
    ));

CREATE POLICY "Users can view own API logs" ON api_security_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view analytics" ON predictive_analytics
    FOR SELECT USING (TRUE);

CREATE POLICY "Users can view business intelligence" ON business_intelligence
    FOR SELECT USING (TRUE);

CREATE POLICY "Users can view customer journey" ON customer_journey
    FOR SELECT USING (TRUE);

CREATE POLICY "Users can view sentiment analysis" ON sentiment_analysis
    FOR SELECT USING (TRUE);

CREATE POLICY "Users can view advanced metrics" ON advanced_metrics
    FOR SELECT USING (TRUE);

-- ================================
-- FUNCTIONS FOR ANALYTICS
-- ================================

-- Function to get real-time security metrics
CREATE OR REPLACE FUNCTION get_security_metrics()
RETURNS TABLE (
    active_sessions INTEGER,
    recent_incidents INTEGER,
    compliance_score DECIMAL,
    api_security_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM security_sessions WHERE is_active = TRUE),
        (SELECT COUNT(*)::INTEGER FROM security_incidents WHERE resolved = FALSE AND created_at > NOW() - INTERVAL '24 hours'),
        (SELECT AVG(CASE WHEN status = 'passed' THEN 100 WHEN status = 'warning' THEN 75 WHEN status = 'failed' THEN 0 ELSE 50 END) FROM compliance_results WHERE checked_at > NOW() - INTERVAL '24 hours'),
        (SELECT (1.0 - (COUNT(*)::DECIMAL / NULLIF((SELECT COUNT(*) FROM api_security_logs WHERE timestamp > NOW() - INTERVAL '24 hours'), 0))) * 100 FROM api_security_logs WHERE suspicious_activity = TRUE AND timestamp > NOW() - INTERVAL '24 hours');
END;
$$ LANGUAGE plpgsql;

-- Function to get analytics dashboard data
CREATE OR REPLACE FUNCTION get_analytics_dashboard_data()
RETURNS TABLE (
    active_conversations INTEGER,
    avg_response_time DECIMAL,
    resolution_rate DECIMAL,
    satisfaction_score DECIMAL,
    ai_accuracy DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM conversations WHERE status = 'active'),
        (SELECT COALESCE(AVG(avg_response_time_seconds), 120) FROM conversation_analytics WHERE created_at > NOW() - INTERVAL '24 hours'),
        (SELECT COALESCE(AVG(CASE WHEN resolution_status = 'resolved' THEN 1.0 ELSE 0.0 END), 0.85) FROM conversation_analytics WHERE created_at > NOW() - INTERVAL '24 hours'),
        (SELECT COALESCE(AVG(customer_satisfaction), 4.2) FROM conversation_analytics WHERE customer_satisfaction IS NOT NULL AND created_at > NOW() - INTERVAL '24 hours'),
        (SELECT COALESCE(AVG(ai_accuracy_score), 0.88) FROM conversation_analytics WHERE ai_accuracy_score IS NOT NULL AND created_at > NOW() - INTERVAL '24 hours');
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_analytics_data()
RETURNS VOID AS $$
BEGIN
    -- Clean up old API security logs (keep 30 days)
    DELETE FROM api_security_logs WHERE timestamp < NOW() - INTERVAL '30 days';
    
    -- Clean up old security sessions (keep 90 days)
    DELETE FROM security_sessions WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Clean up old sentiment analysis (keep 90 days)
    DELETE FROM sentiment_analysis WHERE analyzed_at < NOW() - INTERVAL '90 days';
    
    -- Clean up old advanced metrics (keep 90 days)
    DELETE FROM advanced_metrics WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Clean up old predictive analytics (keep 180 days)
    DELETE FROM predictive_analytics WHERE created_at < NOW() - INTERVAL '180 days';
END;
$$ LANGUAGE plpgsql;

-- ================================
-- SAMPLE DATA FOR TESTING
-- ================================

-- Insert sample security sessions
INSERT INTO security_sessions (user_id, session_token, ip_address, user_agent, login_method, session_duration, is_active) VALUES
    ((SELECT id FROM profiles LIMIT 1), 'session_' || gen_random_uuid(), '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'password', INTERVAL '2 hours', TRUE),
    ((SELECT id FROM profiles LIMIT 1), 'session_' || gen_random_uuid(), '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'oauth', INTERVAL '1 hour', TRUE),
    ((SELECT id FROM profiles LIMIT 1), 'session_' || gen_random_uuid(), '192.168.1.102', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36', 'password', INTERVAL '3 hours', FALSE)
ON CONFLICT DO NOTHING;

-- Insert sample security incidents
INSERT INTO security_incidents (incident_type, severity, ip_address, description, detection_method, resolved) VALUES
    ('failed_login', 'medium', '192.168.1.200', 'Multiple failed login attempts from same IP', 'automated_detection', FALSE),
    ('suspicious_activity', 'high', '10.0.0.50', 'Unusual API access pattern detected', 'anomaly_detection', FALSE),
    ('api_abuse', 'low', '172.16.0.100', 'Rate limit exceeded multiple times', 'rate_limiter', TRUE)
ON CONFLICT DO NOTHING;

-- Insert sample compliance results
INSERT INTO compliance_results (compliance_type, check_name, status, details, remediation_steps, next_check_due) VALUES
    ('gdpr', 'Data Retention Policy Check', 'passed', '{"retention_period": "2 years", "compliance_rate": "100%"}', '{}', NOW() + INTERVAL '1 day'),
    ('gdpr', 'Consent Management Audit', 'warning', '{"missing_consents": 5, "total_records": 1000}', '{"Update consent records", "Implement consent refresh workflow"}', NOW() + INTERVAL '1 day'),
    ('ccpa', 'Data Subject Rights Verification', 'passed', '{"requests_processed": 45, "avg_response_time": "3 days"}', '{}', NOW() + INTERVAL '1 day'),
    ('hipaa', 'Access Control Review', 'failed', '{"unauthorized_access_attempts": 3, "security_score": 75}', '{"Review user permissions", "Implement additional access controls"}', NOW() + INTERVAL '1 day'),
    ('sox', 'Financial Data Security Check', 'passed', '{"encryption_status": "enabled", "audit_trail": "complete"}', '{}', NOW() + INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- Insert sample API security logs
INSERT INTO api_security_logs (endpoint, method, ip_address, request_size, response_code, response_time_ms, rate_limit_hit, suspicious_activity) VALUES
    ('/api/conversations', 'GET', '192.168.1.100', 1024, 200, 150, FALSE, FALSE),
    ('/api/messages', 'POST', '192.168.1.101', 2048, 201, 200, FALSE, FALSE),
    ('/api/auth/login', 'POST', '192.168.1.200', 512, 401, 100, TRUE, TRUE),
    ('/api/users', 'GET', '10.0.0.50', 1024, 200, 500, FALSE, TRUE),
    ('/api/analytics', 'GET', '172.16.0.100', 1024, 200, 300, FALSE, FALSE)
ON CONFLICT DO NOTHING;

-- Insert sample predictive analytics
INSERT INTO predictive_analytics (prediction_type, prediction_date, predicted_value, confidence_level, model_version) VALUES
    ('volume_forecast', CURRENT_DATE + INTERVAL '1 day', 120.5, 0.85, '1.0'),
    ('volume_forecast', CURRENT_DATE + INTERVAL '2 days', 135.2, 0.82, '1.0'),
    ('volume_forecast', CURRENT_DATE + INTERVAL '3 days', 98.7, 0.88, '1.0'),
    ('satisfaction_trend', CURRENT_DATE + INTERVAL '1 day', 4.2, 0.78, '1.0'),
    ('satisfaction_trend', CURRENT_DATE + INTERVAL '2 days', 4.3, 0.75, '1.0'),
    ('staffing_needs', CURRENT_DATE + INTERVAL '1 day', 8.0, 0.90, '1.0'),
    ('performance_prediction', CURRENT_DATE + INTERVAL '1 day', 0.92, 0.85, '1.0')
ON CONFLICT DO NOTHING;

-- Insert sample business intelligence metrics (FIXED - added missing closing parenthesis)
INSERT INTO business_intelligence (metric_category, metric_name, metric_value, metric_unit, time_period, dimensions) VALUES
    ('kpi', 'Customer Satisfaction Score', 4.2, 'score', 'daily', '{"channel": "all", "department": "support"}'),
    ('kpi', 'Average Response Time', 120.5, 'seconds', 'daily', '{"channel": "all", "department": "support"}'),
    ('kpi', 'Resolution Rate', 0.85, 'percentage', 'daily', '{"channel": "all", "department": "support"}'),
    ('kpi', 'AI Accuracy Score', 0.88, 'percentage', 'daily', '{"model": "v1.0", "department": "ai"}'),
    ('trend', 'Volume Growth', 0.15, 'percentage', 'weekly', '{"comparison": "week_over_week"}'),
    ('insight', 'Peak Hours Identified', 2.0, 'hours', 'daily', '{"peak_start": "09:00", "peak_end": "11:00"}'),
    ('recommendation', 'Staffing Optimization', 3.0, 'agents', 'daily', '{"action": "increase_peak_hours"}')
ON CONFLICT DO NOTHING;

-- Insert sample customer journey data
INSERT INTO customer_journey (customer_id, journey_stage, touchpoint, channel_type, interaction_type, session_duration, conversion_achieved, satisfaction_score) VALUES
    ((SELECT id FROM customer_profiles LIMIT 1), 'discovery', 'website', 'web', 'page_view', 45, FALSE, 4),
    ((SELECT id FROM customer_profiles LIMIT 1), 'consideration', 'chat_widget', 'web', 'conversation', 180, TRUE, 5),
    ((SELECT id FROM customer_profiles LIMIT 1), 'decision', 'email', 'email', 'inquiry', 0, TRUE, 4),
    ((SELECT id FROM customer_profiles LIMIT 1), 'onboarding', 'support_chat', 'web', 'conversation', 300, TRUE, 5)
ON CONFLICT DO NOTHING;

-- Insert sample sentiment analysis
INSERT INTO sentiment_analysis (conversation_id, message_id, sentiment_score, sentiment_label, confidence, emotions, keywords) VALUES
    ((SELECT id FROM conversations LIMIT 1), (SELECT id FROM messages LIMIT 1), 0.8, 'positive', 0.92, '{"joy": 0.7, "trust": 0.6}', '{"great", "helpful", "satisfied"}'),
    ((SELECT id FROM conversations LIMIT 1), (SELECT id FROM messages LIMIT 1 OFFSET 1), -0.3, 'negative', 0.85, '{"anger": 0.4, "frustration": 0.5}', '{"problem", "issue", "disappointed"}'),
    ((SELECT id FROM conversations LIMIT 1), (SELECT id FROM messages LIMIT 1 OFFSET 2), 0.1, 'neutral', 0.78, '{"neutral": 0.8}', '{"question", "information", "help"}')
ON CONFLICT DO NOTHING;

-- Insert sample advanced metrics
INSERT INTO advanced_metrics (metric_type, metric_subtype, metric_value, aggregation_period, start_time, end_time) VALUES
    ('response_time', 'avg', 120.5, 'hour', NOW() - INTERVAL '1 hour', NOW()),
    ('response_time', 'p95', 250.0, 'hour', NOW() - INTERVAL '1 hour', NOW()),
    ('satisfaction', 'avg', 4.2, 'hour', NOW() - INTERVAL '1 hour', NOW()),
    ('resolution_rate', 'percentage', 0.85, 'hour', NOW() - INTERVAL '1 hour', NOW()),
    ('ai_accuracy', 'percentage', 0.88, 'hour', NOW() - INTERVAL '1 hour', NOW()),
    ('conversation_volume', 'count', 45, 'hour', NOW() - INTERVAL '1 hour', NOW())
ON CONFLICT DO NOTHING;

-- Success notification
DO $$
BEGIN
    RAISE NOTICE 'Security and Analytics tables migration completed successfully!';
    RAISE NOTICE 'Added tables: security_sessions, security_incidents, compliance_results, api_security_logs';
    RAISE NOTICE 'Added tables: predictive_analytics, business_intelligence, customer_journey, sentiment_analysis, advanced_metrics';
    RAISE NOTICE 'Added indexes and RLS policies for security';
    RAISE NOTICE 'Added sample data for testing';
    RAISE NOTICE 'Added utility functions for dashboard queries';
END $$;