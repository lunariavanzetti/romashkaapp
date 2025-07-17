-- ================================
-- SECURITY & ANALYTICS ENHANCEMENT
-- Migration: 008_security_analytics_fix.sql
-- Purpose: Fix security dashboard 404 errors and provide analytics sample data
-- ================================

-- ================================
-- SECURITY MONITORING TABLES
-- ================================

-- Security sessions tracking
CREATE TABLE IF NOT EXISTS security_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE,
  ip_address INET,
  user_agent TEXT,
  device_info JSONB DEFAULT '{}',
  geolocation JSONB DEFAULT '{}',
  login_method TEXT DEFAULT 'password',
  session_duration INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  logout_reason TEXT,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  invalidated_at TIMESTAMP WITH TIME ZONE,
  invalidation_reason TEXT
);

-- Security incidents monitoring
CREATE TABLE IF NOT EXISTS security_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_type TEXT NOT NULL, -- 'failed_login', 'suspicious_activity', 'data_breach', 'unauthorized_access', 'malware', 'ddos'
  severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  status TEXT DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'closed'
  title TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES profiles(id),
  ip_address INET,
  affected_systems TEXT[] DEFAULT '{}',
  affected_users INTEGER DEFAULT 0,
  detection_method TEXT DEFAULT 'automatic',
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  assigned_to UUID REFERENCES profiles(id),
  containment_actions TEXT[] DEFAULT '{}',
  investigation_notes TEXT,
  lessons_learned TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance checks
CREATE TABLE IF NOT EXISTS compliance_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_name TEXT NOT NULL,
  check_type TEXT NOT NULL, -- 'gdpr', 'security', 'data_retention', 'access_control'
  check_description TEXT,
  check_frequency TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance check results
CREATE TABLE IF NOT EXISTS compliance_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_id UUID REFERENCES compliance_checks(id) ON DELETE CASCADE,
  status TEXT NOT NULL, -- 'passed', 'failed', 'warning', 'error'
  result_details JSONB DEFAULT '{}',
  recommendations TEXT[] DEFAULT '{}',
  severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  auto_remediated BOOLEAN DEFAULT false,
  remediation_actions TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API security monitoring
CREATE TABLE IF NOT EXISTS api_security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT,
  method TEXT,
  user_id UUID REFERENCES profiles(id),
  ip_address INET,
  request_size INTEGER,
  response_code INTEGER,
  response_time_ms INTEGER,
  rate_limit_hit BOOLEAN DEFAULT FALSE,
  suspicious_activity BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- ENHANCED ANALYTICS TABLES
-- ================================

-- Performance metrics for real-time analytics
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_type TEXT NOT NULL, -- 'response_time', 'satisfaction', 'resolution_rate', 'ai_accuracy'
  metric_value DECIMAL(10,4) NOT NULL,
  dimensions JSONB DEFAULT '{}', -- Channel, agent, department, etc.
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Predictive analytics data
CREATE TABLE IF NOT EXISTS predictive_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_type TEXT NOT NULL, -- 'volume_forecast', 'satisfaction_trend', 'staffing_needs'
  prediction_date DATE NOT NULL,
  predicted_value DECIMAL(10,2) NOT NULL,
  confidence_level DECIMAL(5,2) NOT NULL,
  actual_value DECIMAL(10,2),
  model_version TEXT DEFAULT '1.0',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- INDEXES FOR PERFORMANCE
-- ================================

-- Security table indexes
CREATE INDEX IF NOT EXISTS idx_security_sessions_user_id ON security_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_security_sessions_token ON security_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_security_sessions_active ON security_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_security_sessions_created_at ON security_sessions(created_at);

CREATE INDEX IF NOT EXISTS idx_security_incidents_type ON security_incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_security_incidents_severity ON security_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_security_incidents_status ON security_incidents(status);
CREATE INDEX IF NOT EXISTS idx_security_incidents_created_at ON security_incidents(created_at);

CREATE INDEX IF NOT EXISTS idx_compliance_results_check_id ON compliance_results(check_id);
CREATE INDEX IF NOT EXISTS idx_compliance_results_status ON compliance_results(status);
CREATE INDEX IF NOT EXISTS idx_compliance_results_created_at ON compliance_results(created_at);

CREATE INDEX IF NOT EXISTS idx_api_security_logs_endpoint ON api_security_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_security_logs_user_id ON api_security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_security_logs_timestamp ON api_security_logs(timestamp);

-- Analytics table indexes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp);

CREATE INDEX IF NOT EXISTS idx_predictive_analytics_type ON predictive_analytics(prediction_type);
CREATE INDEX IF NOT EXISTS idx_predictive_analytics_date ON predictive_analytics(prediction_date);

-- ================================
-- ROW LEVEL SECURITY
-- ================================

-- Enable RLS on security tables
ALTER TABLE security_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictive_analytics ENABLE ROW LEVEL SECURITY;

-- Security policies
CREATE POLICY "Users can view own sessions" ON security_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all sessions" ON security_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'security_admin')
    )
  );

CREATE POLICY "Admin can manage security incidents" ON security_incidents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'security_admin')
    )
  );

CREATE POLICY "Authenticated users can view compliance results" ON compliance_results
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage compliance" ON compliance_checks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'security_admin')
    )
  );

CREATE POLICY "Authenticated users can view analytics" ON performance_metrics
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view predictions" ON predictive_analytics
  FOR SELECT USING (auth.role() = 'authenticated');

-- ================================
-- SAMPLE DATA FOR ANALYTICS
-- ================================

-- Insert sample compliance checks
INSERT INTO compliance_checks (check_name, check_type, check_description, check_frequency) VALUES
  ('GDPR Consent Validation', 'gdpr', 'Validate that all data processing has proper consent', 'daily'),
  ('Data Retention Compliance', 'data_retention', 'Check for data that exceeds retention policies', 'daily'),
  ('Access Control Review', 'security', 'Review user access permissions and roles', 'weekly'),
  ('Session Security Check', 'security', 'Validate session security and detect anomalies', 'daily'),
  ('API Security Monitoring', 'security', 'Monitor API endpoints for suspicious activity', 'daily')
ON CONFLICT (check_name) DO NOTHING;

-- Insert sample compliance results
INSERT INTO compliance_results (check_id, status, result_details, recommendations, severity, auto_remediated)
SELECT 
  c.id,
  CASE 
    WHEN random() < 0.8 THEN 'passed'
    WHEN random() < 0.9 THEN 'warning'
    ELSE 'failed'
  END,
  '{"checks_performed": 150, "issues_found": 2, "compliance_score": 95}',
  CASE 
    WHEN random() < 0.8 THEN ARRAY['No action required']
    ELSE ARRAY['Review access permissions', 'Update security policies']
  END,
  CASE 
    WHEN random() < 0.7 THEN 'low'
    WHEN random() < 0.9 THEN 'medium'
    ELSE 'high'
  END,
  random() < 0.3
FROM compliance_checks c
WHERE NOT EXISTS (
  SELECT 1 FROM compliance_results cr WHERE cr.check_id = c.id
);

-- Insert sample security incidents
INSERT INTO security_incidents (incident_type, severity, status, title, description, affected_users, detection_method)
VALUES 
  ('failed_login', 'low', 'resolved', 'Multiple failed login attempts', 'User attempted to login with incorrect credentials 5 times', 1, 'automatic'),
  ('suspicious_activity', 'medium', 'investigating', 'Unusual access pattern detected', 'User accessed system from new location', 1, 'ml_detection'),
  ('data_breach', 'high', 'resolved', 'Potential data exposure', 'Misconfigured API endpoint exposed user data', 50, 'security_audit')
ON CONFLICT DO NOTHING;

-- Insert sample security sessions (last 30 days)
INSERT INTO security_sessions (user_id, session_token, ip_address, user_agent, login_method, session_duration, is_active, created_at, last_activity)
SELECT 
  p.id,
  'session_' || generate_random_uuid(),
  ('192.168.1.' || floor(random() * 255)::int)::inet,
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'password',
  floor(random() * 3600)::int,
  random() < 0.3,
  NOW() - (random() * interval '30 days'),
  NOW() - (random() * interval '1 day')
FROM profiles p
WHERE p.role IS NOT NULL
LIMIT 100;

-- Insert sample daily analytics (last 30 days)
INSERT INTO daily_analytics (date, total_conversations, avg_response_time_seconds, resolution_rate, avg_customer_satisfaction, ai_accuracy_score, channel_distribution)
SELECT 
  date_series.date,
  floor(random() * 100 + 50)::int,
  floor(random() * 300 + 60)::int,
  (random() * 0.3 + 0.7)::decimal(5,2),
  (random() * 2 + 3)::decimal(3,2),
  (random() * 0.2 + 0.8)::decimal(3,2),
  '{"website": 60, "whatsapp": 25, "email": 15}'::jsonb
FROM generate_series(
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE,
  INTERVAL '1 day'
) AS date_series(date)
WHERE NOT EXISTS (
  SELECT 1 FROM daily_analytics da WHERE da.date = date_series.date
);

-- Insert sample conversation analytics (last 30 days)
INSERT INTO conversation_analytics (conversation_id, started_at, first_response_at, resolved_at, total_duration_seconds, total_messages, customer_messages, ai_messages, agent_messages, resolved_by, customer_satisfaction, ai_accuracy_score)
SELECT 
  gen_random_uuid(),
  NOW() - (random() * interval '30 days'),
  NOW() - (random() * interval '30 days') + (random() * interval '5 minutes'),
  NOW() - (random() * interval '30 days') + (random() * interval '30 minutes'),
  floor(random() * 1800 + 300)::int,
  floor(random() * 20 + 5)::int,
  floor(random() * 10 + 3)::int,
  floor(random() * 5 + 1)::int,
  floor(random() * 5 + 1)::int,
  CASE 
    WHEN random() < 0.6 THEN 'ai'
    ELSE 'agent'
  END,
  floor(random() * 2 + 3)::int,
  (random() * 0.3 + 0.7)::decimal(3,2)
FROM generate_series(1, 300) AS seq;

-- Insert sample performance metrics (last 7 days)
INSERT INTO performance_metrics (metric_name, metric_type, metric_value, dimensions, timestamp)
SELECT 
  metric_data.name,
  metric_data.type,
  metric_data.value,
  metric_data.dimensions,
  NOW() - (random() * interval '7 days')
FROM (
  SELECT 
    'response_time' as name,
    'response_time' as type,
    (random() * 300 + 30)::decimal(10,4) as value,
    '{"channel": "website", "agent": "ai"}'::jsonb as dimensions
  UNION ALL
  SELECT 
    'satisfaction_score' as name,
    'satisfaction' as type,
    (random() * 2 + 3)::decimal(10,4) as value,
    '{"channel": "whatsapp", "agent": "human"}'::jsonb as dimensions
  UNION ALL
  SELECT 
    'resolution_rate' as name,
    'resolution_rate' as type,
    (random() * 0.3 + 0.7)::decimal(10,4) as value,
    '{"department": "support", "priority": "normal"}'::jsonb as dimensions
) AS metric_data,
generate_series(1, 50) AS seq;

-- Insert sample predictive analytics (next 30 days)
INSERT INTO predictive_analytics (prediction_type, prediction_date, predicted_value, confidence_level, model_version)
SELECT 
  'volume_forecast',
  CURRENT_DATE + (seq || ' days')::interval,
  (random() * 50 + 75)::decimal(10,2),
  (random() * 20 + 75)::decimal(5,2),
  '1.0'
FROM generate_series(1, 30) AS seq;

INSERT INTO predictive_analytics (prediction_type, prediction_date, predicted_value, confidence_level, model_version)
SELECT 
  'satisfaction_trend',
  CURRENT_DATE + (seq || ' days')::interval,
  (random() * 1 + 4)::decimal(10,2),
  (random() * 15 + 80)::decimal(5,2),
  '1.0'
FROM generate_series(1, 30) AS seq;

-- ================================
-- VERIFICATION QUERIES
-- ================================

-- Verify security tables exist
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'security_sessions') = 1;
  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'security_incidents') = 1;
  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'compliance_results') = 1;
  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'compliance_checks') = 1;
  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'performance_metrics') = 1;
  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'predictive_analytics') = 1;
  
  RAISE NOTICE 'All security and analytics tables created successfully';
END $$;

-- Verify sample data inserted
SELECT 
  'security_sessions' as table_name,
  COUNT(*) as record_count
FROM security_sessions
UNION ALL
SELECT 
  'security_incidents' as table_name,
  COUNT(*) as record_count
FROM security_incidents
UNION ALL
SELECT 
  'compliance_results' as table_name,
  COUNT(*) as record_count
FROM compliance_results
UNION ALL
SELECT 
  'daily_analytics' as table_name,
  COUNT(*) as record_count
FROM daily_analytics
UNION ALL
SELECT 
  'conversation_analytics' as table_name,
  COUNT(*) as record_count
FROM conversation_analytics
UNION ALL
SELECT 
  'performance_metrics' as table_name,
  COUNT(*) as record_count
FROM performance_metrics
UNION ALL
SELECT 
  'predictive_analytics' as table_name,
  COUNT(*) as record_count
FROM predictive_analytics;

-- Success message
SELECT 'Security and Analytics Enhancement Migration Completed Successfully!' as status;