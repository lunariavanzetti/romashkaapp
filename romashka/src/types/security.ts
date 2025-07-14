// Security and Compliance Types

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

// ================================
// GDPR COMPLIANCE TYPES
// ================================

export interface DataConsent {
  id: string;
  user_id?: string;
  customer_id?: string;
  consent_type: 'marketing' | 'analytics' | 'essential' | 'functional';
  consent_given: boolean;
  consent_method: 'explicit' | 'implicit' | 'opt_in' | 'opt_out';
  purpose: string;
  legal_basis: 'consent' | 'legitimate_interest' | 'contract' | 'legal_obligation';
  source_url?: string;
  ip_address?: string;
  user_agent?: string;
  withdrawal_date?: string;
  expiry_date?: string;
  created_at: string;
  updated_at: string;
}

export interface DataProcessingActivity {
  id: string;
  activity_name: string;
  purpose: string;
  legal_basis: string;
  data_categories: string[];
  data_subjects: string[];
  recipients?: string[];
  retention_period?: number;
  security_measures?: string[];
  transfer_countries?: string[];
  created_at: string;
  updated_at: string;
}

export interface DataSubjectRequest {
  id: string;
  request_type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restrict' | 'object';
  customer_id?: string;
  customer_email?: string;
  customer_phone?: string;
  request_details?: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  processed_by?: string;
  processing_notes?: string;
  completion_date?: string;
  verification_method?: string;
  documents_provided?: string[];
  created_at: string;
  updated_at: string;
}

export interface DataRetentionPolicy {
  id: string;
  data_category: string;
  retention_period: number;
  retention_basis: string;
  auto_delete: boolean;
  notification_before_days: number;
  created_at: string;
  updated_at: string;
}

export interface ConsentSettings {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  lastUpdated: string;
}

export interface GDPRExportData {
  personal_data: {
    profile: any;
    conversations: any[];
    messages: any[];
    consent_records: DataConsent[];
  };
  metadata: {
    export_date: string;
    export_format: string;
    data_controller: string;
  };
}

// ================================
// AUDIT TRAIL TYPES
// ================================

export interface SecurityAuditLog {
  id: string;
  event_type: 'login' | 'logout' | 'data_access' | 'data_modify' | 'data_delete' | 'permission_change';
  user_id?: string;
  customer_id?: string;
  resource_type?: 'conversation' | 'message' | 'knowledge_item' | 'user' | 'settings';
  resource_id?: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'export' | 'import';
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  risk_score: number;
  geolocation?: {
    country?: string;
    city?: string;
    coordinates?: [number, number];
  };
  success: boolean;
  failure_reason?: string;
  additional_context?: any;
  created_at: string;
}

export interface SecuritySession {
  id: string;
  user_id: string;
  session_token: string;
  refresh_token?: string;
  ip_address?: string;
  user_agent?: string;
  device_info?: {
    device_type: string;
    os: string;
    browser: string;
  };
  geolocation?: {
    country?: string;
    city?: string;
    coordinates?: [number, number];
  };
  is_active: boolean;
  last_activity: string;
  expires_at?: string;
  created_at: string;
  invalidated_at?: string;
  invalidation_reason?: string;
}

export interface AuditFilter {
  event_type?: string;
  user_id?: string;
  resource_type?: string;
  action?: string;
  date_from?: string;
  date_to?: string;
  ip_address?: string;
  risk_score_min?: number;
  risk_score_max?: number;
  success?: boolean;
}

// ================================
// SECURITY FEATURES TYPES
// ================================

export interface TwoFactorAuth {
  id: string;
  user_id: string;
  enabled: boolean;
  secret?: string;
  backup_codes?: string[];
  method: 'totp' | 'sms' | 'email';
  phone_number?: string;
  last_used?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_hash: string;
  key_preview: string;
  permissions: string[];
  rate_limit_per_minute: number;
  rate_limit_per_hour: number;
  last_used?: string;
  usage_count: number;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  role: Role;
  assigned_by?: string;
  assigned_at: string;
  expires_at?: string;
}

export interface IPWhitelist {
  id: string;
  user_id?: string;
  ip_address: string;
  ip_range?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GeographicRestriction {
  id: string;
  user_id?: string;
  restriction_type: 'allow' | 'deny';
  country_codes: string[];
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SecuritySettings {
  two_factor_enabled: boolean;
  session_timeout: number;
  ip_whitelist_enabled: boolean;
  geographic_restrictions_enabled: boolean;
  api_key_rotation_days: number;
  password_policy: {
    min_length: number;
    require_uppercase: boolean;
    require_lowercase: boolean;
    require_numbers: boolean;
    require_symbols: boolean;
    max_age_days: number;
  };
}

// ================================
// DATA PROTECTION TYPES
// ================================

export interface PIIDetectionPattern {
  id: string;
  pattern_name: string;
  regex_pattern: string;
  pattern_type: 'email' | 'phone' | 'ssn' | 'credit_card' | 'ip_address' | 'custom';
  sensitivity_level: 1 | 2 | 3 | 4 | 5;
  mask_character: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EncryptionKey {
  id: string;
  key_name: string;
  key_purpose: 'messages' | 'files' | 'pii' | 'backups';
  key_hash: string;
  algorithm: 'AES-256' | 'RSA-2048';
  is_active: boolean;
  rotation_schedule?: 'monthly' | 'quarterly' | 'yearly';
  last_rotated?: string;
  next_rotation?: string;
  created_at: string;
  updated_at: string;
}

export interface FileSecurityScan {
  id: string;
  file_id: string;
  scan_type: 'virus' | 'malware' | 'content';
  scan_result: 'clean' | 'infected' | 'suspicious' | 'error';
  scan_details?: any;
  quarantined: boolean;
  scanner_version?: string;
  scanned_at: string;
}

export interface DataMaskingRule {
  id: string;
  name: string;
  field_pattern: string;
  mask_type: 'partial' | 'full' | 'hash' | 'tokenize';
  preserve_length: boolean;
  mask_character: string;
  exceptions?: string[];
  is_active: boolean;
}

// ================================
// COMPLIANCE MONITORING TYPES
// ================================

export interface ComplianceCheck {
  id: string;
  check_name: string;
  check_type: 'gdpr' | 'security' | 'data_retention' | 'access_control' | 'data_protection';
  check_description?: string;
  check_frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  last_run?: string;
  next_run?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ComplianceResult {
  id: string;
  check_id: string;
  check: ComplianceCheck;
  status: 'passed' | 'failed' | 'warning' | 'error';
  result_details?: any;
  recommendations?: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  auto_remediated: boolean;
  remediation_actions?: string[];
  created_at: string;
}

export interface SecurityIncident {
  id: string;
  incident_type: 'data_breach' | 'unauthorized_access' | 'malware' | 'ddos' | 'phishing' | 'insider_threat';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  title: string;
  description?: string;
  affected_systems?: string[];
  affected_users: number;
  detected_at: string;
  resolved_at?: string;
  assigned_to?: string;
  containment_actions?: string[];
  investigation_notes?: string;
  lessons_learned?: string;
  created_at: string;
  updated_at: string;
}

export interface ComplianceDashboard {
  overall_score: number;
  compliance_status: 'compliant' | 'partial' | 'non_compliant';
  last_assessment: string;
  next_assessment: string;
  categories: {
    gdpr: ComplianceScore;
    security: ComplianceScore;
    data_protection: ComplianceScore;
    access_control: ComplianceScore;
  };
  recent_incidents: SecurityIncident[];
  pending_reviews: number;
  automated_fixes: number;
}

export interface ComplianceScore {
  score: number;
  status: 'passed' | 'failed' | 'warning';
  last_checked: string;
  issues: number;
  recommendations: string[];
}

// ================================
// CONSENT MANAGEMENT TYPES
// ================================

export interface ConsentBanner {
  id: string;
  title: string;
  message: string;
  privacy_policy_url: string;
  cookie_policy_url: string;
  consent_types: string[];
  position: 'top' | 'bottom' | 'modal';
  theme: 'light' | 'dark' | 'auto';
  mandatory_acceptance: boolean;
  show_detailed_options: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConsentRecord {
  id: string;
  visitor_id: string;
  consent_string: string;
  consent_details: ConsentSettings;
  ip_address: string;
  user_agent: string;
  source_page: string;
  created_at: string;
  updated_at: string;
}

// ================================
// SECURITY MONITORING TYPES
// ================================

export interface SecurityAlert {
  id: string;
  alert_type: 'suspicious_login' | 'failed_authentication' | 'data_breach' | 'unusual_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: any;
  user_id?: string;
  ip_address?: string;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
}

export interface SecurityMetrics {
  total_logins: number;
  failed_logins: number;
  active_sessions: number;
  blocked_ips: number;
  security_incidents: number;
  compliance_score: number;
  last_updated: string;
}

export interface RiskAssessment {
  user_id: string;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  factors: {
    unusual_location: boolean;
    unusual_time: boolean;
    multiple_failed_attempts: boolean;
    suspicious_device: boolean;
    privilege_escalation: boolean;
  };
  recommendations: string[];
  last_assessed: string;
}

// ================================
// UTILITY TYPES
// ================================

export interface SecurityContext {
  user: User;
  session: SecuritySession;
  permissions: string[];
  ip_address: string;
  user_agent: string;
  geolocation?: {
    country?: string;
    city?: string;
  };
}

export interface SecurityAction {
  type: string;
  payload: any;
  timestamp: string;
  user_id: string;
  session_id: string;
}

export interface SecurityPolicy {
  id: string;
  name: string;
  type: 'password' | 'session' | 'access' | 'data';
  rules: any;
  enforcement_level: 'advisory' | 'warning' | 'blocking';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SecurityConfiguration {
  authentication: {
    require_2fa: boolean;
    session_timeout: number;
    max_failed_attempts: number;
    lockout_duration: number;
  };
  data_protection: {
    encryption_enabled: boolean;
    pii_masking_enabled: boolean;
    data_retention_enabled: boolean;
    backup_encryption: boolean;
  };
  monitoring: {
    audit_logging: boolean;
    real_time_alerts: boolean;
    anomaly_detection: boolean;
    compliance_monitoring: boolean;
  };
  access_control: {
    rbac_enabled: boolean;
    ip_whitelisting: boolean;
    geographic_restrictions: boolean;
    api_rate_limiting: boolean;
  };
}