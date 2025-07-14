-- ================================
-- SECURITY & COMPLIANCE SCHEMA EXTENSIONS
-- ================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ================================
-- GDPR COMPLIANCE TABLES
-- ================================

-- Data consent management
CREATE TABLE IF NOT EXISTS data_consent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  customer_id UUID,
  consent_type VARCHAR(50) NOT NULL, -- 'marketing', 'analytics', 'essential', 'functional'
  consent_given BOOLEAN NOT NULL,
  consent_method VARCHAR(50) NOT NULL, -- 'explicit', 'implicit', 'opt_in', 'opt_out'
  purpose TEXT NOT NULL,
  legal_basis VARCHAR(50) NOT NULL, -- 'consent', 'legitimate_interest', 'contract', 'legal_obligation'
  source_url TEXT,
  ip_address INET,
  user_agent TEXT,
  withdrawal_date TIMESTAMP WITH TIME ZONE,
  expiry_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data processing activities
CREATE TABLE IF NOT EXISTS data_processing_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_name VARCHAR(255) NOT NULL,
  purpose TEXT NOT NULL,
  legal_basis VARCHAR(50) NOT NULL,
  data_categories TEXT[] NOT NULL,
  data_subjects TEXT[] NOT NULL,
  recipients TEXT[],
  retention_period INTEGER, -- in days
  security_measures TEXT[],
  transfer_countries TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data subject requests (GDPR Article 15-22)
CREATE TABLE IF NOT EXISTS data_subject_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type VARCHAR(50) NOT NULL, -- 'access', 'rectification', 'erasure', 'portability', 'restrict', 'object'
  customer_id UUID,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  request_details TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'rejected'
  processed_by UUID REFERENCES profiles(id),
  processing_notes TEXT,
  completion_date TIMESTAMP WITH TIME ZONE,
  verification_method VARCHAR(50),
  documents_provided TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data retention policies
CREATE TABLE IF NOT EXISTS data_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_category VARCHAR(100) NOT NULL,
  retention_period INTEGER NOT NULL, -- in days
  retention_basis VARCHAR(100) NOT NULL,
  auto_delete BOOLEAN DEFAULT true,
  notification_before_days INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- AUDIT TRAIL ENHANCEMENT
-- ================================

-- Enhanced audit logs with detailed tracking
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL, -- 'login', 'logout', 'data_access', 'data_modify', 'data_delete', 'permission_change'
  user_id UUID,
  customer_id UUID,
  resource_type VARCHAR(50), -- 'conversation', 'message', 'knowledge_item', 'user', 'settings'
  resource_id UUID,
  action VARCHAR(50) NOT NULL, -- 'create', 'read', 'update', 'delete', 'export', 'import'
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(255),
  risk_score INTEGER DEFAULT 0, -- 0-100
  geolocation JSONB,
  success BOOLEAN DEFAULT true,
  failure_reason TEXT,
  additional_context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session tracking for security monitoring
CREATE TABLE IF NOT EXISTS security_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  refresh_token VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  device_info JSONB,
  geolocation JSONB,
  is_active BOOLEAN DEFAULT true,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invalidated_at TIMESTAMP WITH TIME ZONE,
  invalidation_reason VARCHAR(100)
);

-- ================================
-- SECURITY FEATURES
-- ================================

-- Two-factor authentication
CREATE TABLE IF NOT EXISTS two_factor_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT false,
  secret VARCHAR(255),
  backup_codes TEXT[],
  method VARCHAR(50) DEFAULT 'totp', -- 'totp', 'sms', 'email'
  phone_number VARCHAR(50),
  last_used TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API key management
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  key_preview VARCHAR(20) NOT NULL,
  permissions TEXT[] DEFAULT '{}',
  rate_limit_per_minute INTEGER DEFAULT 60,
  rate_limit_per_hour INTEGER DEFAULT 3600,
  last_used TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Role-based access control enhancement
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions TEXT[] NOT NULL,
  is_system_role BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User role assignments
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, role_id)
);

-- IP whitelisting
CREATE TABLE IF NOT EXISTS ip_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  ip_address INET NOT NULL,
  ip_range CIDR,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Geographic restrictions
CREATE TABLE IF NOT EXISTS geographic_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  restriction_type VARCHAR(50) NOT NULL, -- 'allow', 'deny'
  country_codes TEXT[] NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- DATA PROTECTION
-- ================================

-- PII detection and masking
CREATE TABLE IF NOT EXISTS pii_detection_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_name VARCHAR(100) NOT NULL,
  regex_pattern TEXT NOT NULL,
  pattern_type VARCHAR(50) NOT NULL, -- 'email', 'phone', 'ssn', 'credit_card', 'custom'
  sensitivity_level INTEGER DEFAULT 1, -- 1-5
  mask_character VARCHAR(5) DEFAULT '*',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data encryption keys
CREATE TABLE IF NOT EXISTS encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name VARCHAR(100) NOT NULL,
  key_purpose VARCHAR(100) NOT NULL, -- 'messages', 'files', 'pii', 'backups'
  key_hash VARCHAR(255) NOT NULL,
  algorithm VARCHAR(50) NOT NULL, -- 'AES-256', 'RSA-2048'
  is_active BOOLEAN DEFAULT true,
  rotation_schedule VARCHAR(50), -- 'monthly', 'quarterly', 'yearly'
  last_rotated TIMESTAMP WITH TIME ZONE,
  next_rotation TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File security scanning
CREATE TABLE IF NOT EXISTS file_security_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL,
  scan_type VARCHAR(50) NOT NULL, -- 'virus', 'malware', 'content'
  scan_result VARCHAR(50) NOT NULL, -- 'clean', 'infected', 'suspicious', 'error'
  scan_details JSONB,
  quarantined BOOLEAN DEFAULT false,
  scanner_version VARCHAR(50),
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- COMPLIANCE MONITORING
-- ================================

-- Compliance checks and results
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

-- Compliance check results
CREATE TABLE IF NOT EXISTS compliance_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_id UUID NOT NULL REFERENCES compliance_checks(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL, -- 'passed', 'failed', 'warning', 'error'
  result_details JSONB,
  recommendations TEXT[],
  severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  auto_remediated BOOLEAN DEFAULT false,
  remediation_actions TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security incidents
CREATE TABLE IF NOT EXISTS security_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_type VARCHAR(50) NOT NULL, -- 'data_breach', 'unauthorized_access', 'malware', 'ddos'
  severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'closed'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  affected_systems TEXT[],
  affected_users INTEGER DEFAULT 0,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  assigned_to UUID REFERENCES profiles(id),
  containment_actions TEXT[],
  investigation_notes TEXT,
  lessons_learned TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- INDEXES FOR PERFORMANCE
-- ================================

-- Data consent indexes
CREATE INDEX IF NOT EXISTS idx_data_consent_user_id ON data_consent(user_id);
CREATE INDEX IF NOT EXISTS idx_data_consent_customer_id ON data_consent(customer_id);
CREATE INDEX IF NOT EXISTS idx_data_consent_type ON data_consent(consent_type);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_id ON security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_event_type ON security_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created_at ON security_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_resource ON security_audit_logs(resource_type, resource_id);

-- Session indexes
CREATE INDEX IF NOT EXISTS idx_security_sessions_user_id ON security_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_security_sessions_token ON security_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_security_sessions_active ON security_sessions(is_active);

-- API key indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);

-- Role indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

-- Compliance indexes
CREATE INDEX IF NOT EXISTS idx_compliance_results_check_id ON compliance_results(check_id);
CREATE INDEX IF NOT EXISTS idx_compliance_results_status ON compliance_results(status);
CREATE INDEX IF NOT EXISTS idx_compliance_results_created_at ON compliance_results(created_at);

-- ================================
-- ROW LEVEL SECURITY POLICIES
-- ================================

-- Enable RLS on all security tables
ALTER TABLE data_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_processing_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_subject_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_factor_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE geographic_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;

-- Security policies for data consent
CREATE POLICY "Users can view own consent records" ON data_consent
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own consent" ON data_consent
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own consent" ON data_consent
  FOR UPDATE USING (user_id = auth.uid());

-- Security policies for audit logs (read-only for security team)
CREATE POLICY "Security team can view all audit logs" ON security_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('security_admin', 'compliance_officer')
    )
  );

-- Security policies for sessions
CREATE POLICY "Users can view own sessions" ON security_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own sessions" ON security_sessions
  FOR UPDATE USING (user_id = auth.uid());

-- Security policies for 2FA
CREATE POLICY "Users can manage own 2FA" ON two_factor_auth
  FOR ALL USING (user_id = auth.uid());

-- Security policies for API keys
CREATE POLICY "Users can manage own API keys" ON api_keys
  FOR ALL USING (user_id = auth.uid());

-- Security policies for roles (admin only)
CREATE POLICY "Admin can manage roles" ON roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

-- Security policies for user roles (admin only)
CREATE POLICY "Admin can manage user roles" ON user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

-- Security policies for compliance (compliance officers and admins)
CREATE POLICY "Compliance team can view compliance data" ON compliance_checks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'compliance_officer', 'security_admin')
    )
  );

CREATE POLICY "Compliance team can view compliance results" ON compliance_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'compliance_officer', 'security_admin')
    )
  );

-- Insert default roles
INSERT INTO roles (name, description, permissions, is_system_role) VALUES
  ('admin', 'System Administrator', ARRAY['all'], true),
  ('security_admin', 'Security Administrator', ARRAY['security:read', 'security:write', 'audit:read', 'compliance:read'], true),
  ('compliance_officer', 'Compliance Officer', ARRAY['compliance:read', 'compliance:write', 'audit:read', 'gdpr:read', 'gdpr:write'], true),
  ('agent', 'Customer Support Agent', ARRAY['conversations:read', 'conversations:write', 'knowledge:read'], true),
  ('user', 'Standard User', ARRAY['conversations:read', 'knowledge:read'], true)
ON CONFLICT (name) DO NOTHING;

-- Insert default compliance checks
INSERT INTO compliance_checks (check_name, check_type, check_description, check_frequency) VALUES
  ('GDPR Consent Validation', 'gdpr', 'Validate that all data processing has proper consent', 'daily'),
  ('Data Retention Compliance', 'data_retention', 'Check for data that exceeds retention policies', 'daily'),
  ('Access Control Review', 'security', 'Review user access permissions and roles', 'weekly'),
  ('Session Security Check', 'security', 'Validate session security and detect anomalies', 'daily'),
  ('API Key Security Audit', 'security', 'Review API key usage and security', 'weekly'),
  ('PII Detection Scan', 'data_protection', 'Scan for unmasked PII in conversations', 'daily'),
  ('Encryption Key Rotation', 'security', 'Check encryption key rotation schedule', 'monthly')
ON CONFLICT (check_name) DO NOTHING;

-- Insert default PII detection patterns
INSERT INTO pii_detection_patterns (pattern_name, regex_pattern, pattern_type, sensitivity_level) VALUES
  ('Email Address', '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b', 'email', 2),
  ('Phone Number', '\\b\\+?\\d{1,3}[-.]?\\(?\\d{3}\\)?[-.]?\\d{3}[-.]?\\d{4}\\b', 'phone', 2),
  ('Social Security Number', '\\b\\d{3}-\\d{2}-\\d{4}\\b', 'ssn', 5),
  ('Credit Card Number', '\\b\\d{4}[-\\s]?\\d{4}[-\\s]?\\d{4}[-\\s]?\\d{4}\\b', 'credit_card', 5),
  ('IP Address', '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', 'ip_address', 3)
ON CONFLICT (pattern_name) DO NOTHING;

-- Insert default data retention policies
INSERT INTO data_retention_policies (data_category, retention_period, retention_basis, auto_delete) VALUES
  ('conversation_messages', 2555, 'Business requirement - 7 years', false), -- 7 years
  ('customer_data', 2555, 'Legal requirement - 7 years', false), -- 7 years
  ('audit_logs', 2555, 'Compliance requirement - 7 years', false), -- 7 years
  ('session_data', 90, 'Security requirement - 90 days', true), -- 90 days
  ('temp_files', 30, 'Operational requirement - 30 days', true), -- 30 days
  ('anonymous_analytics', 730, 'Business requirement - 2 years', true) -- 2 years
ON CONFLICT (data_category) DO NOTHING;