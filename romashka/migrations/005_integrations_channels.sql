-- Migration 005: Integrations & Multi-Channel Communication
-- Creates tables for integrations, channels, and webhooks

-- Communication channels
CREATE TABLE IF NOT EXISTS communication_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  configuration JSONB NOT NULL,
  webhook_url TEXT,
  webhook_secret VARCHAR(255),
  api_credentials JSONB,
  message_limit_per_day INTEGER DEFAULT 1000,
  messages_sent_today INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message templates (for WhatsApp, etc.)
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  language VARCHAR(10) NOT NULL,
  category VARCHAR(50) NOT NULL,
  template_content JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  channel_type VARCHAR(50) NOT NULL,
  external_template_id VARCHAR(255),
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer channel preferences
CREATE TABLE IF NOT EXISTS customer_channel_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE,
  channel_type VARCHAR(50) NOT NULL,
  is_preferred BOOLEAN DEFAULT false,
  opt_in BOOLEAN DEFAULT true,
  last_interaction TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, channel_type)
);

-- Channel routing rules
CREATE TABLE IF NOT EXISTS channel_routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  priority INTEGER DEFAULT 0,
  conditions JSONB NOT NULL,
  target_channel_type VARCHAR(50) NOT NULL,
  fallback_channel_type VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message delivery tracking
CREATE TABLE IF NOT EXISTS message_delivery_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  channel_type VARCHAR(50) NOT NULL,
  external_message_id VARCHAR(255),
  delivery_status VARCHAR(50) DEFAULT 'sent',
  delivery_timestamp TIMESTAMP WITH TIME ZONE,
  read_timestamp TIMESTAMP WITH TIME ZONE,
  error_details JSONB,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook event logs
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES communication_channels(id),
  event_type VARCHAR(100) NOT NULL,
  source VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processing_attempts INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Integration configurations
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  provider VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'inactive',
  configuration JSONB NOT NULL,
  credentials JSONB NOT NULL,
  sync_settings JSONB DEFAULT '{}',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_frequency INTEGER DEFAULT 3600,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Integration field mappings
CREATE TABLE IF NOT EXISTS integration_field_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  source_entity VARCHAR(100) NOT NULL,
  target_entity VARCHAR(100) NOT NULL,
  source_field VARCHAR(255) NOT NULL,
  target_field VARCHAR(255) NOT NULL,
  transformation_rule TEXT,
  is_required BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sync jobs
CREATE TABLE IF NOT EXISTS sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  job_type VARCHAR(100) NOT NULL,
  direction VARCHAR(20) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  records_processed INTEGER DEFAULT 0,
  records_total INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook subscriptions
CREATE TABLE IF NOT EXISTS webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  webhook_url TEXT NOT NULL,
  secret_key VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  retry_count INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 30,
  last_triggered TIMESTAMP WITH TIME ZONE,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer sync mapping
CREATE TABLE IF NOT EXISTS customer_sync_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_profile_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  external_id VARCHAR(255) NOT NULL,
  external_entity_type VARCHAR(100) NOT NULL,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sync_status VARCHAR(50) DEFAULT 'synced',
  UNIQUE(customer_profile_id, integration_id)
);

-- Webhook logs
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_subscription_id UUID REFERENCES webhook_subscriptions(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB,
  response_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Integration audit logs
CREATE TABLE IF NOT EXISTS integration_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id VARCHAR(255),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE communication_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_channel_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_routing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_delivery_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_field_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_sync_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Allow authenticated access" ON communication_channels
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON message_templates
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON customer_channel_preferences
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON channel_routing_rules
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON message_delivery_tracking
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON webhook_events
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON integrations
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON integration_field_mappings
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON sync_jobs
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON webhook_subscriptions
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON customer_sync_mapping
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON webhook_logs
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON integration_audit_logs
  FOR ALL USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_communication_channels_type ON communication_channels(type);
CREATE INDEX IF NOT EXISTS idx_message_templates_channel_type ON message_templates(channel_type);
CREATE INDEX IF NOT EXISTS idx_customer_channel_preferences_customer_id ON customer_channel_preferences(customer_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);
CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations(type);
CREATE INDEX IF NOT EXISTS idx_integrations_status ON integrations(status);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_integration_id ON sync_jobs(integration_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_status ON sync_jobs(status);
CREATE INDEX IF NOT EXISTS idx_customer_sync_mapping_customer_id ON customer_sync_mapping(customer_profile_id);
CREATE INDEX IF NOT EXISTS idx_customer_sync_mapping_integration_id ON customer_sync_mapping(integration_id);

-- Triggers for updated_at
CREATE TRIGGER update_communication_channels_updated_at
  BEFORE UPDATE ON communication_channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_templates_updated_at
  BEFORE UPDATE ON message_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_channel_preferences_updated_at
  BEFORE UPDATE ON customer_channel_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channel_routing_rules_updated_at
  BEFORE UPDATE ON channel_routing_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_delivery_tracking_updated_at
  BEFORE UPDATE ON message_delivery_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integration_field_mappings_updated_at
  BEFORE UPDATE ON integration_field_mappings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create message delivery tracking
CREATE OR REPLACE FUNCTION create_message_delivery_tracking()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create tracking for non-website channels
  IF NEW.channel_type != 'website' THEN
    INSERT INTO message_delivery_tracking (
      message_id,
      channel_type,
      delivery_status
    ) VALUES (
      NEW.id,
      NEW.channel_type,
      'sent'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create delivery tracking on new message
CREATE TRIGGER create_message_delivery_tracking_trigger
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION create_message_delivery_tracking();

-- Function to reset daily message limits
CREATE OR REPLACE FUNCTION reset_daily_message_limits()
RETURNS VOID AS $$
BEGIN
  UPDATE communication_channels 
  SET 
    messages_sent_today = 0,
    last_reset_date = CURRENT_DATE
  WHERE last_reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to update template usage count
CREATE OR REPLACE FUNCTION update_template_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the message metadata contains template information
  IF NEW.metadata ? 'template_id' THEN
    UPDATE message_templates 
    SET usage_count = usage_count + 1
    WHERE id = (NEW.metadata->>'template_id')::UUID;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update template usage
CREATE TRIGGER update_template_usage_trigger
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_template_usage();

-- Function to handle webhook event processing
CREATE OR REPLACE FUNCTION process_webhook_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment processing attempts
  UPDATE webhook_events 
  SET processing_attempts = processing_attempts + 1
  WHERE id = NEW.id;
  
  -- Log the processing attempt
  INSERT INTO audit_logs (
    action,
    entity_type,
    entity_id,
    changes
  ) VALUES (
    'webhook_processing',
    'webhook_events',
    NEW.id,
    jsonb_build_object(
      'event_type', NEW.event_type,
      'source', NEW.source,
      'attempt', NEW.processing_attempts + 1
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Default communication channels
INSERT INTO communication_channels (name, type, configuration, created_by) 
SELECT 
  'Website Chat',
  'website',
  '{"enabled": true, "welcome_message": "Hello! How can I help you today?"}',
  id
FROM profiles 
WHERE role = 'admin'
AND NOT EXISTS (
  SELECT 1 FROM communication_channels 
  WHERE type = 'website' 
  AND created_by = profiles.id
);

-- Default channel routing rules
INSERT INTO channel_routing_rules (name, priority, conditions, target_channel_type, created_by) 
SELECT 
  'Default Website Routing',
  1,
  '{"business_hours": {"start": "09:00", "end": "17:00"}, "timezone": "UTC"}',
  'website',
  id
FROM profiles 
WHERE role = 'admin'
AND NOT EXISTS (
  SELECT 1 FROM channel_routing_rules 
  WHERE name = 'Default Website Routing' 
  AND created_by = profiles.id
);

-- Default message templates
INSERT INTO message_templates (name, language, category, template_content, channel_type, status, created_by) 
SELECT 
  'Welcome Message',
  'en',
  'utility',
  '{"type": "text", "content": "Welcome to our support chat! How can I help you today?"}',
  'website',
  'approved',
  id
FROM profiles 
WHERE role = 'admin'
AND NOT EXISTS (
  SELECT 1 FROM message_templates 
  WHERE name = 'Welcome Message' 
  AND channel_type = 'website' 
  AND created_by = profiles.id
);

-- Migration complete
SELECT 'Migration 005: Integrations & Multi-Channel Communication Complete' as status;