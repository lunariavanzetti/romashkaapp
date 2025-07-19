-- ROMASHKA Security and Compliance Tables
-- Migration: 004_security_tables.sql
-- Version: 1.0.0
-- Description: Create tables for security monitoring, compliance, audit trails, and GDPR compliance
-- Date: 2024-01-19

-- ================================
-- SECURITY MONITORING TABLES
-- ================================

-- Security sessions tracking
CREATE TABLE IF NOT EXISTS security_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  user_agent TEXT,
  ip_address INET,
  geolocation JSONB,
  is_active BOOLEAN DEFAULT true,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Security incidents
CREATE TABLE IF NOT EXISTS security_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  incident_type VARCHAR(100) NOT NULL, -- 'breach', 'unauthorized_access', 'suspicious_activity', etc.
  severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'closed'
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  affected_users TEXT[],
  impact_assessment JSONB,
  remediation_actions JSONB,
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security alerts
CREATE TABLE IF NOT EXISTS security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) DEFAULT 'medium',
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'open',
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API keys management
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  key_name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  key_prefix VARCHAR(20) NOT NULL,
  permissions TEXT[] DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Encryption keys management
CREATE TABLE IF NOT EXISTS encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name VARCHAR(255) UNIQUE NOT NULL,
  key_type VARCHAR(50) NOT NULL, -- 'aes', 'rsa', 'symmetric', etc.
  algorithm VARCHAR(50) NOT NULL,
  key_size INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_rotated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  next_rotation TIMESTAMP WITH TIME ZONE
);

-- ================================
-- COMPLIANCE AND AUDIT TABLES
-- ================================

-- Compliance checks configuration
CREATE TABLE IF NOT EXISTS compliance_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_name VARCHAR(255) NOT NULL,
  check_type VARCHAR(100) NOT NULL, -- 'gdpr', 'security', 'data_retention', 'access_control', 'data_protection'
  description TEXT,
  check_configuration JSONB DEFAULT '{}',
  check_frequency VARCHAR(50) DEFAULT 'daily', -- 'daily', 'weekly', 'monthly', 'quarterly'
  is_active BOOLEAN DEFAULT true,
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance check results
CREATE TABLE IF NOT EXISTS compliance_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_id UUID REFERENCES compliance_checks(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL, -- 'passed', 'failed', 'warning', 'error'
  result_details JSONB DEFAULT '{}',
  recommendations TEXT[],
  severity VARCHAR(20) DEFAULT 'medium',
  auto_remediated BOOLEAN DEFAULT false,
  remediation_actions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security audit logs
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action_type VARCHAR(100) NOT NULL, -- 'data_access', 'data_modify', 'auth', 'system'
  action VARCHAR(100) NOT NULL, -- 'create', 'read', 'update', 'delete', 'login', 'logout'
  resource_type VARCHAR(100), -- 'user', 'conversation', 'knowledge_item', etc.
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- GDPR AND DATA PROTECTION TABLES
-- ================================

-- Data consent tracking
CREATE TABLE IF NOT EXISTS data_consent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type VARCHAR(100) NOT NULL, -- 'marketing', 'analytics', 'functional', 'essential'
  consent_given BOOLEAN NOT NULL,
  consent_source VARCHAR(100), -- 'registration', 'settings', 'popup', etc.
  consent_version VARCHAR(50),
  withdrawal_date TIMESTAMP WITH TIME ZONE,
  expiry_date TIMESTAMP WITH TIME ZONE,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data subject requests (GDPR Article 15-22)
CREATE TABLE IF NOT EXISTS data_subject_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type VARCHAR(50) NOT NULL, -- 'access', 'rectification', 'erasure', 'portability', 'restriction', 'objection'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'rejected'
  request_details JSONB DEFAULT '{}',
  response_details JSONB DEFAULT '{}',
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  deadline TIMESTAMP WITH TIME ZONE,
  assigned_to UUID REFERENCES auth.users(id)
);

-- Data retention policies
CREATE TABLE IF NOT EXISTS data_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_category VARCHAR(100) NOT NULL, -- 'user_data', 'conversation_data', 'analytics_data', etc.
  retention_period_days INTEGER NOT NULL,
  description TEXT,
  legal_basis VARCHAR(255),
  auto_delete BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PII detection patterns
CREATE TABLE IF NOT EXISTS pii_detection_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_name VARCHAR(255) NOT NULL,
  pattern_regex TEXT NOT NULL,
  pattern_type VARCHAR(100) NOT NULL, -- 'email', 'phone', 'ssn', 'credit_card', etc.
  confidence_threshold DECIMAL(3,2) DEFAULT 0.8,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User roles and permissions
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  permissions TEXT[] DEFAULT '{}',
  is_system_role BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, role_id)
);

-- ================================
-- INDEXES FOR PERFORMANCE
-- ================================

-- Security sessions indexes
CREATE INDEX IF NOT EXISTS idx_security_sessions_user_id ON security_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_security_sessions_active ON security_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_security_sessions_activity ON security_sessions(last_activity);
CREATE INDEX IF NOT EXISTS idx_security_sessions_ip ON security_sessions(ip_address);

-- Security incidents indexes
CREATE INDEX IF NOT EXISTS idx_security_incidents_type ON security_incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_security_incidents_severity ON security_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_security_incidents_status ON security_incidents(status);
CREATE INDEX IF NOT EXISTS idx_security_incidents_detected ON security_incidents(detected_at);

-- Security alerts indexes
CREATE INDEX IF NOT EXISTS idx_security_alerts_type ON security_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_status ON security_alerts(status);

-- API keys indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);

-- Compliance checks indexes
CREATE INDEX IF NOT EXISTS idx_compliance_checks_type ON compliance_checks(check_type);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_active ON compliance_checks(is_active);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_next_run ON compliance_checks(next_run);

-- Compliance results indexes
CREATE INDEX IF NOT EXISTS idx_compliance_results_check_id ON compliance_results(check_id);
CREATE INDEX IF NOT EXISTS idx_compliance_results_status ON compliance_results(status);
CREATE INDEX IF NOT EXISTS idx_compliance_results_severity ON compliance_results(severity);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON security_audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON security_audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON security_audit_logs(created_at);

-- Data consent indexes
CREATE INDEX IF NOT EXISTS idx_data_consent_user_id ON data_consent(user_id);
CREATE INDEX IF NOT EXISTS idx_data_consent_type ON data_consent(consent_type);
CREATE INDEX IF NOT EXISTS idx_data_consent_given ON data_consent(consent_given);

-- Data subject requests indexes
CREATE INDEX IF NOT EXISTS idx_dsr_user_id ON data_subject_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_dsr_type ON data_subject_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_dsr_status ON data_subject_requests(status);
CREATE INDEX IF NOT EXISTS idx_dsr_deadline ON data_subject_requests(deadline);

-- User roles indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active);

-- ================================
-- ROW LEVEL SECURITY POLICIES
-- ================================

-- Enable RLS on all security tables
ALTER TABLE security_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE encryption_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_subject_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE pii_detection_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Security sessions policies
CREATE POLICY "Users can view own sessions" ON security_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage all sessions" ON security_sessions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Security incidents policies (admin only)
CREATE POLICY "Admins can manage security incidents" ON security_incidents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name IN ('admin', 'security_admin')
      AND ur.is_active = true
    )
  );

-- API keys policies
CREATE POLICY "Users can manage own API keys" ON api_keys
  FOR ALL USING (auth.uid() = user_id);

-- Data consent policies
CREATE POLICY "Users can manage own consent" ON data_consent
  FOR ALL USING (auth.uid() = user_id);

-- Data subject requests policies
CREATE POLICY "Users can manage own requests" ON data_subject_requests
  FOR ALL USING (auth.uid() = user_id);

-- Audit logs policies (read-only for users, full access for admins)
CREATE POLICY "Users can view own audit logs" ON security_audit_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit logs" ON security_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name IN ('admin', 'security_admin')
      AND ur.is_active = true
    )
  );

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" ON security_audit_logs
  FOR INSERT WITH CHECK (true);

-- ================================
-- TRIGGERS
-- ================================

-- Updated_at triggers
CREATE TRIGGER update_security_incidents_updated_at
    BEFORE UPDATE ON security_incidents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at
    BEFORE UPDATE ON api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_checks_updated_at
    BEFORE UPDATE ON compliance_checks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_consent_updated_at
    BEFORE UPDATE ON data_consent
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_retention_policies_updated_at
    BEFORE UPDATE ON data_retention_policies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pii_detection_patterns_updated_at
    BEFORE UPDATE ON pii_detection_patterns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- SEED DATA
-- ================================

-- Insert default roles
INSERT INTO roles (name, description, permissions, is_system_role) VALUES
('admin', 'Full system administrator', ARRAY['all'], true),
('security_admin', 'Security and compliance administrator', ARRAY['security_read', 'security_write', 'compliance_read', 'compliance_write', 'audit_read'], true),
('agent', 'Customer service agent', ARRAY['conversations_read', 'conversations_write', 'knowledge_read'], true),
('user', 'Regular user', ARRAY['profile_read', 'profile_write'], true)
ON CONFLICT (name) DO NOTHING;

-- Insert default compliance checks
INSERT INTO compliance_checks (check_name, check_type, description, check_frequency) VALUES
('GDPR Consent Validation', 'gdpr', 'Validate all user consents are current and valid', 'daily'),
('Data Retention Compliance', 'data_retention', 'Check for data that exceeds retention periods', 'daily'),
('Access Control Review', 'access_control', 'Review user permissions and role assignments', 'weekly'),
('Session Security Check', 'security', 'Validate active sessions and detect anomalies', 'daily'),
('API Key Security Audit', 'security', 'Review API key usage and security', 'weekly'),
('PII Detection Scan', 'data_protection', 'Scan for unprotected personally identifiable information', 'daily'),
('Encryption Key Rotation', 'data_protection', 'Check encryption key rotation schedules', 'monthly')
ON CONFLICT DO NOTHING;

-- Insert default data retention policies
INSERT INTO data_retention_policies (data_category, retention_period_days, description, legal_basis, auto_delete) VALUES
('user_profiles', 2555, 'User profile data (7 years)', 'Legal obligation', false),
('conversation_data', 1095, 'Customer conversation history (3 years)', 'Legitimate interest', true),
('analytics_data', 365, 'Usage analytics and metrics (1 year)', 'Legitimate interest', true),
('audit_logs', 2555, 'Security audit logs (7 years)', 'Legal obligation', false),
('session_data', 90, 'User session information (3 months)', 'Necessary for service', true),
('consent_records', 2555, 'GDPR consent records (7 years)', 'Legal obligation', false)
ON CONFLICT DO NOTHING;

-- Insert default PII detection patterns
INSERT INTO pii_detection_patterns (pattern_name, pattern_regex, pattern_type, confidence_threshold) VALUES
('Email Address', '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', 'email', 0.95),
('Phone Number', '(\+\d{1,3}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}', 'phone', 0.85),
('Credit Card', '\b(?:\d{4}[\s-]?){3}\d{4}\b', 'credit_card', 0.90),
('SSN', '\b\d{3}-?\d{2}-?\d{4}\b', 'ssn', 0.95),
('IP Address', '\b(?:\d{1,3}\.){3}\d{1,3}\b', 'ip_address', 0.80)
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Security and compliance tables created successfully!' as status;