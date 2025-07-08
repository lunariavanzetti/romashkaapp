-- Migration 006: Workflows & Utility Tables
-- Creates tables for workflow automation, playground, widgets, and utility functions

-- Workflows
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(50) NOT NULL,
  trigger_conditions JSONB DEFAULT '{}',
  steps JSONB NOT NULL DEFAULT '[]',
  nodes JSONB NOT NULL DEFAULT '[]',
  connections JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT false,
  execution_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow executions
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  current_node_id TEXT,
  context JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'running',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  execution_log JSONB DEFAULT '[]'
);

-- Playground sessions
CREATE TABLE IF NOT EXISTS playground_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_name VARCHAR(255),
  bot_configuration JSONB NOT NULL,
  test_conversations JSONB DEFAULT '[]',
  performance_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Widget configurations
CREATE TABLE IF NOT EXISTS widget_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  widget_name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  configuration JSONB NOT NULL,
  embed_code TEXT,
  status VARCHAR(50) DEFAULT 'active',
  install_verified BOOLEAN DEFAULT false,
  custom_css TEXT,
  custom_js TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Website scan jobs
CREATE TABLE IF NOT EXISTS website_scan_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID,
  urls TEXT[] NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  progress_percentage INTEGER DEFAULT 0,
  pages_found INTEGER DEFAULT 0,
  pages_processed INTEGER DEFAULT 0,
  scan_settings JSONB DEFAULT '{"maxDepth": 2, "respectRobots": true, "maxPages": 50}',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Extracted content
CREATE TABLE IF NOT EXISTS extracted_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_job_id UUID REFERENCES website_scan_jobs(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title VARCHAR(500),
  content TEXT NOT NULL,
  content_type VARCHAR(100),
  headings JSONB,
  metadata JSONB,
  word_count INTEGER,
  processing_quality DECIMAL(3,2),
  extracted_entities JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto-generated knowledge
CREATE TABLE IF NOT EXISTS auto_generated_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_job_id UUID REFERENCES website_scan_jobs(id) ON DELETE CASCADE,
  extracted_content_id UUID REFERENCES extracted_content(id) ON DELETE CASCADE,
  knowledge_item_id UUID REFERENCES knowledge_items(id),
  auto_category VARCHAR(255),
  confidence_score DECIMAL(3,2),
  needs_review BOOLEAN DEFAULT true,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System settings
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(255) NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE playground_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_scan_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_generated_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Allow authenticated access" ON workflows
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON workflow_executions
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON playground_sessions
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON widget_configurations
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON website_scan_jobs
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON extracted_content
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON auto_generated_knowledge
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON audit_logs
  FOR ALL USING (auth.role() = 'authenticated');

-- System settings - public read, admin write
CREATE POLICY "Public read system settings" ON system_settings
  FOR SELECT USING (is_public = true OR auth.role() = 'authenticated');

CREATE POLICY "Admin write system settings" ON system_settings
  FOR ALL USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_is_active ON workflows(is_active);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_conversation_id ON workflow_executions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_playground_sessions_user_id ON playground_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_widget_configurations_user_id ON widget_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_widget_configurations_domain ON widget_configurations(domain);
CREATE INDEX IF NOT EXISTS idx_website_scan_jobs_user_id ON website_scan_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_website_scan_jobs_status ON website_scan_jobs(status);
CREATE INDEX IF NOT EXISTS idx_extracted_content_scan_job_id ON extracted_content(scan_job_id);
CREATE INDEX IF NOT EXISTS idx_auto_generated_knowledge_scan_job_id ON auto_generated_knowledge(scan_job_id);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Triggers for updated_at
CREATE TRIGGER update_workflows_updated_at
  BEFORE UPDATE ON workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_playground_sessions_updated_at
  BEFORE UPDATE ON playground_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_widget_configurations_updated_at
  BEFORE UPDATE ON widget_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update workflow statistics
CREATE OR REPLACE FUNCTION update_workflow_statistics()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    UPDATE workflows 
    SET 
      execution_count = execution_count + 1,
      success_count = success_count + 1
    WHERE id = NEW.workflow_id;
  ELSIF NEW.status = 'failed' THEN
    UPDATE workflows 
    SET 
      execution_count = execution_count + 1,
      failure_count = failure_count + 1
    WHERE id = NEW.workflow_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update workflow statistics
CREATE TRIGGER update_workflow_statistics_trigger
  AFTER UPDATE ON workflow_executions
  FOR EACH ROW EXECUTE FUNCTION update_workflow_statistics();

-- Function to create audit log entry
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    changes
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE 
      WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
      WHEN TG_OP = 'UPDATE' THEN jsonb_build_object(
        'old', to_jsonb(OLD),
        'new', to_jsonb(NEW)
      )
      ELSE to_jsonb(NEW)
    END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to generate widget embed code
CREATE OR REPLACE FUNCTION generate_widget_embed_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.embed_code = format(
    '<script>
      (function(r,o,m,a,s,h,k,a_) {
        r.RomashkaWidget = r.RomashkaWidget || {};
        r.RomashkaWidget.config = %s;
        a = o.createElement(m);
        s = o.getElementsByTagName(m)[0];
        a.async = 1;
        a.src = "https://widget.romashka.com/embed.js";
        s.parentNode.insertBefore(a, s);
      })(window, document, "script");
    </script>',
    NEW.configuration::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to generate embed code
CREATE TRIGGER generate_widget_embed_code_trigger
  BEFORE INSERT OR UPDATE ON widget_configurations
  FOR EACH ROW EXECUTE FUNCTION generate_widget_embed_code();

-- Function to update scan job progress
CREATE OR REPLACE FUNCTION update_scan_job_progress()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE website_scan_jobs 
  SET 
    pages_processed = (
      SELECT COUNT(*) 
      FROM extracted_content 
      WHERE scan_job_id = NEW.scan_job_id
    ),
    progress_percentage = CASE 
      WHEN pages_found > 0 THEN 
        (SELECT COUNT(*) * 100 / pages_found FROM extracted_content WHERE scan_job_id = NEW.scan_job_id)
      ELSE 0
    END
  WHERE id = NEW.scan_job_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update scan job progress
CREATE TRIGGER update_scan_job_progress_trigger
  AFTER INSERT ON extracted_content
  FOR EACH ROW EXECUTE FUNCTION update_scan_job_progress();

-- Default system settings
INSERT INTO system_settings (setting_key, setting_value, description, is_public) VALUES
('app_name', '"ROMASHKA"', 'Application name', true),
('app_version', '"1.0.0"', 'Application version', true),
('maintenance_mode', 'false', 'Maintenance mode flag', false),
('max_file_size', '10485760', 'Maximum file size in bytes (10MB)', false),
('allowed_file_types', '["jpg", "jpeg", "png", "gif", "pdf", "doc", "docx", "txt"]', 'Allowed file types for uploads', false),
('default_language', '"en"', 'Default system language', true),
('ai_confidence_threshold', '0.8', 'Minimum AI confidence threshold', false),
('max_conversation_duration', '86400', 'Maximum conversation duration in seconds (24 hours)', false),
('sla_first_response_seconds', '300', 'SLA for first response in seconds (5 minutes)', false),
('sla_resolution_seconds', '3600', 'SLA for resolution in seconds (1 hour)', false),
('enable_real_time_notifications', 'true', 'Enable real-time notifications', false),
('enable_analytics', 'true', 'Enable analytics tracking', false),
('backup_retention_days', '30', 'Backup retention period in days', false),
('log_retention_days', '90', 'Log retention period in days', false),
('enable_webhooks', 'true', 'Enable webhook functionality', false),
('webhook_retry_attempts', '3', 'Maximum webhook retry attempts', false),
('enable_integrations', 'true', 'Enable third-party integrations', false),
('default_timezone', '"UTC"', 'Default system timezone', true),
('enable_auto_assignment', 'true', 'Enable automatic agent assignment', false),
('auto_assignment_algorithm', '"round_robin"', 'Auto assignment algorithm (round_robin, least_loaded)', false),
('enable_sentiment_analysis', 'true', 'Enable sentiment analysis', false),
('enable_intent_detection', 'true', 'Enable intent detection', false),
('knowledge_base_auto_update', 'true', 'Enable automatic knowledge base updates', false),
('enable_canned_responses', 'true', 'Enable canned responses', false),
('max_canned_responses', '100', 'Maximum canned responses per user', false),
('enable_file_attachments', 'true', 'Enable file attachments', false),
('enable_voice_messages', 'false', 'Enable voice messages', false),
('enable_video_calls', 'false', 'Enable video calls', false),
('default_agent_status', '"available"', 'Default agent status', false),
('agent_auto_away_time', '300', 'Agent auto-away time in seconds (5 minutes)', false),
('conversation_auto_close_time', '86400', 'Auto-close conversations after inactivity (24 hours)', false),
('enable_customer_satisfaction', 'true', 'Enable customer satisfaction surveys', false),
('satisfaction_survey_delay', '60', 'Delay before showing satisfaction survey (seconds)', false),
('enable_typing_indicators', 'true', 'Enable typing indicators', false),
('enable_read_receipts', 'true', 'Enable read receipts', false),
('enable_multi_language', 'true', 'Enable multi-language support', false),
('supported_languages', '["en", "es", "fr", "de", "it", "pt", "nl", "ru", "ja", "zh", "ko", "ar"]', 'Supported languages', true),
('enable_business_hours', 'true', 'Enable business hours', false),
('default_business_hours', '{"monday": {"start": "09:00", "end": "17:00"}, "tuesday": {"start": "09:00", "end": "17:00"}, "wednesday": {"start": "09:00", "end": "17:00"}, "thursday": {"start": "09:00", "end": "17:00"}, "friday": {"start": "09:00", "end": "17:00"}}', 'Default business hours', false),
('enable_queue_management', 'true', 'Enable queue management', false),
('max_queue_size', '100', 'Maximum queue size', false),
('queue_timeout_seconds', '1800', 'Queue timeout in seconds (30 minutes)', false),
('enable_chatbot', 'true', 'Enable AI chatbot', false),
('chatbot_handoff_threshold', '0.5', 'Confidence threshold for chatbot handoff', false),
('enable_proactive_messages', 'true', 'Enable proactive messages', false),
('proactive_message_delay', '30', 'Delay before showing proactive message (seconds)', false),
('enable_conversation_transcripts', 'true', 'Enable conversation transcripts', false),
('transcript_email_enabled', 'true', 'Enable email transcripts', false),
('enable_conversation_rating', 'true', 'Enable conversation rating', false),
('rating_scale', '5', 'Rating scale (1-5)', false),
('enable_tag_suggestions', 'true', 'Enable tag suggestions', false),
('max_tags_per_conversation', '10', 'Maximum tags per conversation', false),
('enable_smart_routing', 'true', 'Enable smart routing', false),
('routing_algorithm', '"skill_based"', 'Routing algorithm (skill_based, round_robin, least_loaded)', false),
('enable_performance_monitoring', 'true', 'Enable performance monitoring', false),
('performance_alert_threshold', '1000', 'Performance alert threshold (ms)', false),
('enable_data_export', 'true', 'Enable data export', false),
('export_format_options', '["csv", "json", "pdf", "excel"]', 'Available export formats', false),
('max_export_records', '10000', 'Maximum records per export', false),
('enable_api_access', 'true', 'Enable API access', false),
('api_rate_limit', '1000', 'API rate limit per hour', false),
('enable_webhooks_retry', 'true', 'Enable webhook retry mechanism', false),
('webhook_timeout_seconds', '30', 'Webhook timeout in seconds', false),
('enable_real_time_analytics', 'true', 'Enable real-time analytics', false),
('analytics_refresh_interval', '60', 'Analytics refresh interval (seconds)', false),
('enable_conversation_history', 'true', 'Enable conversation history', false),
('conversation_history_retention', '365', 'Conversation history retention (days)', false),
('enable_customer_profiles', 'true', 'Enable customer profiles', false),
('customer_profile_enrichment', 'true', 'Enable customer profile enrichment', false),
('enable_knowledge_base', 'true', 'Enable knowledge base', false),
('knowledge_base_search_enabled', 'true', 'Enable knowledge base search', false),
('enable_website_scanning', 'true', 'Enable website scanning', false),
('max_scan_pages', '100', 'Maximum pages to scan per job', false),
('scan_respect_robots', 'true', 'Respect robots.txt during scanning', false),
('enable_playground', 'true', 'Enable AI playground', false),
('playground_session_timeout', '3600', 'Playground session timeout (seconds)', false),
('enable_widget_builder', 'true', 'Enable widget builder', false),
('widget_customization_enabled', 'true', 'Enable widget customization', false),
('enable_white_labeling', 'false', 'Enable white labeling', false),
('white_label_domain', '""', 'White label domain', false),
('enable_custom_branding', 'false', 'Enable custom branding', false),
('custom_logo_url', '""', 'Custom logo URL', false),
('custom_primary_color', '"#3B82F6"', 'Custom primary color', false),
('custom_secondary_color', '"#10B981"', 'Custom secondary color', false),
('enable_sso', 'false', 'Enable Single Sign-On', false),
('sso_provider', '"saml"', 'SSO provider (saml, oauth2)', false),
('enable_2fa', 'false', 'Enable Two-Factor Authentication', false),
('password_policy_enabled', 'true', 'Enable password policy', false),
('password_min_length', '8', 'Minimum password length', false),
('session_timeout_minutes', '480', 'Session timeout in minutes (8 hours)', false),
('enable_audit_logging', 'true', 'Enable audit logging', false),
('audit_log_retention_days', '365', 'Audit log retention (days)', false),
('enable_gdpr_compliance', 'true', 'Enable GDPR compliance features', false),
('data_retention_policy_days', '2555', 'Data retention policy (days - 7 years)', false),
('enable_encryption_at_rest', 'true', 'Enable encryption at rest', false),
('enable_encryption_in_transit', 'true', 'Enable encryption in transit', false),
('backup_frequency_hours', '24', 'Backup frequency in hours', false),
('enable_disaster_recovery', 'true', 'Enable disaster recovery', false),
('health_check_interval_seconds', '60', 'Health check interval (seconds)', false),
('enable_monitoring_alerts', 'true', 'Enable monitoring alerts', false),
('alert_email_recipients', '[]', 'Alert email recipients', false),
('enable_status_page', 'true', 'Enable status page', false),
('status_page_url', '""', 'Status page URL', false),
('enable_feature_flags', 'true', 'Enable feature flags', false),
('feature_rollout_percentage', '100', 'Feature rollout percentage', false),
('enable_a_b_testing', 'false', 'Enable A/B testing', false),
('a_b_test_traffic_split', '50', 'A/B test traffic split percentage', false),
('enable_beta_features', 'false', 'Enable beta features', false),
('beta_features_whitelist', '[]', 'Beta features whitelist (user IDs)', false),
('maintenance_window_start', '"02:00"', 'Maintenance window start time', false),
('maintenance_window_end', '"04:00"', 'Maintenance window end time', false),
('maintenance_window_timezone', '"UTC"', 'Maintenance window timezone', false),
('enable_scheduled_maintenance', 'true', 'Enable scheduled maintenance', false),
('last_maintenance_date', 'null', 'Last maintenance date', false),
('next_maintenance_date', 'null', 'Next maintenance date', false),
('system_status', '"operational"', 'System status', true),
('system_message', '""', 'System message', true),
('enable_system_announcements', 'true', 'Enable system announcements', false),
('announcement_message', '""', 'Current announcement message', true),
('announcement_type', '"info"', 'Announcement type (info, warning, error)', true),
('announcement_expires_at', 'null', 'Announcement expiration time', false),
('enable_user_onboarding', 'true', 'Enable user onboarding', false),
('onboarding_steps', '["profile", "integration", "knowledge", "testing"]', 'Onboarding steps', false),
('enable_user_tutorials', 'true', 'Enable user tutorials', false),
('enable_contextual_help', 'true', 'Enable contextual help', false),
('help_documentation_url', '"https://docs.romashka.com"', 'Help documentation URL', true),
('support_email', '"support@romashka.com"', 'Support email address', true),
('support_phone', '""', 'Support phone number', true),
('enable_community_forum', 'false', 'Enable community forum', false),
('community_forum_url', '""', 'Community forum URL', true),
('enable_feedback_collection', 'true', 'Enable feedback collection', false),
('feedback_collection_url', '""', 'Feedback collection URL', false),
('enable_feature_requests', 'true', 'Enable feature requests', false),
('feature_request_url', '""', 'Feature request URL', false),
('enable_bug_reports', 'true', 'Enable bug reports', false),
('bug_report_url', '""', 'Bug report URL', false),
('terms_of_service_url', '""', 'Terms of service URL', true),
('privacy_policy_url', '""', 'Privacy policy URL', true),
('cookie_policy_url', '""', 'Cookie policy URL', true),
('enable_cookie_consent', 'true', 'Enable cookie consent', false),
('cookie_consent_type', '"opt_in"', 'Cookie consent type (opt_in, opt_out)', false),
('enable_analytics_consent', 'true', 'Enable analytics consent', false),
('enable_marketing_consent', 'true', 'Enable marketing consent', false),
('enable_personalization_consent', 'true', 'Enable personalization consent', false),
('data_processing_legal_basis', '"legitimate_interest"', 'Data processing legal basis', false),
('enable_right_to_be_forgotten', 'true', 'Enable right to be forgotten', false),
('enable_data_portability', 'true', 'Enable data portability', false),
('enable_data_rectification', 'true', 'Enable data rectification', false),
('enable_data_access_request', 'true', 'Enable data access request', false),
('data_controller_name', '"ROMASHKA"', 'Data controller name', false),
('data_controller_email', '"privacy@romashka.com"', 'Data controller email', false),
('data_protection_officer_email', '"dpo@romashka.com"', 'Data protection officer email', false),
('supervisory_authority_name', '""', 'Supervisory authority name', false),
('supervisory_authority_email', '""', 'Supervisory authority email', false),
('enable_third_party_sharing', 'false', 'Enable third party sharing', false),
('third_party_sharing_purposes', '[]', 'Third party sharing purposes', false),
('enable_marketing_communications', 'true', 'Enable marketing communications', false),
('marketing_unsubscribe_url', '""', 'Marketing unsubscribe URL', false),
('enable_transactional_emails', 'true', 'Enable transactional emails', false),
('transactional_email_provider', '"sendgrid"', 'Transactional email provider', false),
('enable_push_notifications', 'true', 'Enable push notifications', false),
('push_notification_provider', '"firebase"', 'Push notification provider', false),
('enable_sms_notifications', 'false', 'Enable SMS notifications', false),
('sms_notification_provider', '"twilio"', 'SMS notification provider', false),
('enable_in_app_notifications', 'true', 'Enable in-app notifications', false),
('notification_retention_days', '30', 'Notification retention (days)', false)
ON CONFLICT (setting_key) DO NOTHING;

-- Default workflows
INSERT INTO workflows (user_id, name, description, trigger_type, trigger_conditions, nodes, connections, is_active) 
SELECT 
  id,
  'Auto-Assignment Workflow',
  'Automatically assign conversations to available agents',
  'conversation_created',
  '{"conditions": [{"field": "channel_type", "operator": "equals", "value": "website"}]}',
  '[{"id": "start", "type": "trigger", "data": {"label": "Conversation Created"}}, {"id": "assign", "type": "action", "data": {"label": "Assign to Agent", "action": "assign_agent"}}]',
  '[{"source": "start", "target": "assign"}]',
  true
FROM profiles 
WHERE role = 'admin'
AND NOT EXISTS (
  SELECT 1 FROM workflows 
  WHERE name = 'Auto-Assignment Workflow' 
  AND user_id = profiles.id
);

-- Default playground session
INSERT INTO playground_sessions (user_id, session_name, bot_configuration, test_conversations) 
SELECT 
  id,
  'Default Bot Configuration',
  '{"personality": "helpful", "tone": "professional", "knowledge_base_enabled": true, "fallback_enabled": true}',
  '[]'
FROM profiles 
WHERE role = 'admin'
AND NOT EXISTS (
  SELECT 1 FROM playground_sessions 
  WHERE session_name = 'Default Bot Configuration' 
  AND user_id = profiles.id
);

-- Default widget configuration
INSERT INTO widget_configurations (user_id, widget_name, configuration, status) 
SELECT 
  id,
  'Default Chat Widget',
  '{"theme": "light", "position": "bottom-right", "greeting": "Hello! How can I help you today?", "colors": {"primary": "#3B82F6", "secondary": "#10B981"}}',
  'active'
FROM profiles 
WHERE role = 'admin'
AND NOT EXISTS (
  SELECT 1 FROM widget_configurations 
  WHERE widget_name = 'Default Chat Widget' 
  AND user_id = profiles.id
);

-- Migration complete
SELECT 'Migration 006: Workflows & Utility Tables Complete' as status;