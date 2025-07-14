-- ROMASHKA WhatsApp Enhancements Migration (FIXED)
-- Version: 2.0.0
-- Description: WhatsApp Business API enhancements for ROMASHKA
-- Date: 2024-01-15
-- Author: ROMASHKA Team

-- ================================
-- MIGRATION METADATA
-- ================================

-- Check if migration has already been run
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = '002_whatsapp_enhancements') THEN
    RAISE EXCEPTION 'Migration 002_whatsapp_enhancements has already been applied';
  END IF;
END $$;

-- ================================
-- WHATSAPP SPECIFIC TABLES
-- ================================

-- WhatsApp specific configurations
CREATE TABLE IF NOT EXISTS whatsapp_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES communication_channels(id) ON DELETE CASCADE,
  phone_number_id TEXT NOT NULL,
  business_account_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  webhook_secret TEXT NOT NULL,
  verify_token TEXT NOT NULL,
  business_verification_status VARCHAR(50) DEFAULT 'pending',
  features_enabled JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message templates for WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES communication_channels(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  language VARCHAR(10) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'utility', 'marketing', 'authentication'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  external_template_id TEXT,
  components JSONB NOT NULL,
  approval_notes TEXT,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(channel_id, name, language)
);

-- Business automation rules
CREATE TABLE IF NOT EXISTS whatsapp_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES communication_channels(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'welcome', 'out_of_hours', 'keyword_trigger', 'escalation'
  conditions JSONB NOT NULL,
  action JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business hours configuration
CREATE TABLE IF NOT EXISTS whatsapp_business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES communication_channels(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  timezone VARCHAR(50) DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(channel_id, day_of_week)
);

-- WhatsApp specific conversations extension
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  external_conversation_id TEXT,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  customer_profile_picture TEXT,
  last_message_from_business_timestamp TIMESTAMP WITH TIME ZONE,
  last_message_from_customer_timestamp TIMESTAMP WITH TIME ZONE,
  is_within_24h_window BOOLEAN DEFAULT false,
  conversation_state VARCHAR(50) DEFAULT 'active', -- 'active', 'paused', 'closed'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced message tracking
CREATE TABLE IF NOT EXISTS message_delivery_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  channel_type VARCHAR(50) NOT NULL,
  external_message_id TEXT,
  delivery_status VARCHAR(50) NOT NULL, -- 'sent', 'delivered', 'read', 'failed'
  delivery_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  error_details JSONB,
  webhook_payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interactive message responses
CREATE TABLE IF NOT EXISTS whatsapp_interactive_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id),
  response_type VARCHAR(50) NOT NULL, -- 'button', 'list', 'quick_reply'
  response_payload JSONB NOT NULL,
  customer_selection JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media attachments
CREATE TABLE IF NOT EXISTS whatsapp_media_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  media_type VARCHAR(50) NOT NULL, -- 'image', 'video', 'audio', 'document', 'location'
  media_url TEXT,
  external_media_id TEXT,
  caption TEXT,
  file_name TEXT,
  file_size INTEGER,
  mime_type VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook events logging
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES communication_channels(id),
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processing_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics and metrics
CREATE TABLE IF NOT EXISTS whatsapp_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES communication_channels(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  messages_sent INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  messages_delivered INTEGER DEFAULT 0,
  messages_read INTEGER DEFAULT 0,
  messages_failed INTEGER DEFAULT 0,
  unique_customers INTEGER DEFAULT 0,
  new_conversations INTEGER DEFAULT 0,
  avg_response_time_seconds INTEGER DEFAULT 0,
  template_messages_sent INTEGER DEFAULT 0,
  interactive_messages_sent INTEGER DEFAULT 0,
  cost_per_message DECIMAL(10,4) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(channel_id, date)
);

-- Customer behavior tracking
CREATE TABLE IF NOT EXISTS whatsapp_customer_behavior (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES communication_channels(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  total_messages_sent INTEGER DEFAULT 0,
  total_messages_received INTEGER DEFAULT 0,
  avg_response_time_seconds INTEGER DEFAULT 0,
  last_interaction_at TIMESTAMP WITH TIME ZONE,
  preferences JSONB DEFAULT '{}',
  tags TEXT[],
  score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(channel_id, customer_phone)
);

-- Lead scoring for WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_lead_scoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  interaction_score INTEGER DEFAULT 0,
  engagement_score INTEGER DEFAULT 0,
  intent_score INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  scoring_factors JSONB DEFAULT '{}',
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- INDEXES FOR PERFORMANCE
-- ================================

-- WhatsApp specific indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_configurations_channel_id ON whatsapp_configurations(channel_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_templates_channel_id ON whatsapp_message_templates(channel_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_templates_status ON whatsapp_message_templates(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_automation_rules_channel_id ON whatsapp_automation_rules(channel_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_automation_rules_type ON whatsapp_automation_rules(type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_conversation_id ON whatsapp_conversations(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_customer_phone ON whatsapp_conversations(customer_phone);
CREATE INDEX IF NOT EXISTS idx_message_delivery_tracking_message_id ON message_delivery_tracking(message_id);
CREATE INDEX IF NOT EXISTS idx_message_delivery_tracking_external_id ON message_delivery_tracking(external_message_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_interactive_responses_message_id ON whatsapp_interactive_responses(message_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_media_attachments_message_id ON whatsapp_media_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_channel_id ON webhook_events(channel_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_whatsapp_analytics_channel_id ON whatsapp_analytics(channel_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_analytics_date ON whatsapp_analytics(date);
CREATE INDEX IF NOT EXISTS idx_whatsapp_customer_behavior_channel_id ON whatsapp_customer_behavior(channel_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_customer_behavior_phone ON whatsapp_customer_behavior(customer_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_lead_scoring_conversation_id ON whatsapp_lead_scoring(conversation_id);

-- ================================
-- FUNCTIONS
-- ================================

-- Function to check if business is open (FIXED variable names)
CREATE OR REPLACE FUNCTION is_business_hours(channel_id UUID, check_time TIMESTAMP WITH TIME ZONE DEFAULT NOW())
RETURNS BOOLEAN AS $$
DECLARE
    is_open BOOLEAN := FALSE;
    current_day_num INTEGER;
    current_time_val TIME;
BEGIN
    -- Get current day of week (0=Sunday, 1=Monday, etc.)
    current_day_num := EXTRACT(DOW FROM check_time);
    current_time_val := check_time::TIME;
    
    -- Check if there's a business hour configuration for this day
    SELECT COUNT(*) > 0 INTO is_open
    FROM whatsapp_business_hours 
    WHERE whatsapp_business_hours.channel_id = is_business_hours.channel_id
        AND day_of_week = current_day_num
        AND is_active = true
        AND current_time_val BETWEEN start_time AND end_time;
    
    RETURN is_open;
END;
$$ LANGUAGE plpgsql;

-- Function to reset daily message count
CREATE OR REPLACE FUNCTION reset_daily_message_count()
RETURNS VOID AS $$
BEGIN
    UPDATE communication_channels 
    SET messages_sent_today = 0, last_reset_date = CURRENT_DATE
    WHERE last_reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to increment message count
CREATE OR REPLACE FUNCTION increment_message_count(channel_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE communication_channels 
    SET messages_sent_today = messages_sent_today + 1
    WHERE id = channel_id;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- ROW LEVEL SECURITY (RLS)
-- ================================

-- Enable RLS on WhatsApp tables
ALTER TABLE whatsapp_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_delivery_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_interactive_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_media_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_customer_behavior ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_lead_scoring ENABLE ROW LEVEL SECURITY;

-- WhatsApp policies
CREATE POLICY "Allow authenticated access to whatsapp_configurations" ON whatsapp_configurations
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access to whatsapp_message_templates" ON whatsapp_message_templates
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access to whatsapp_automation_rules" ON whatsapp_automation_rules
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access to whatsapp_business_hours" ON whatsapp_business_hours
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access to whatsapp_conversations" ON whatsapp_conversations
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access to message_delivery_tracking" ON message_delivery_tracking
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access to whatsapp_interactive_responses" ON whatsapp_interactive_responses
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access to whatsapp_media_attachments" ON whatsapp_media_attachments
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access to webhook_events" ON webhook_events
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access to whatsapp_analytics" ON whatsapp_analytics
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access to whatsapp_customer_behavior" ON whatsapp_customer_behavior
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access to whatsapp_lead_scoring" ON whatsapp_lead_scoring
  FOR ALL USING (auth.role() = 'authenticated');

-- ================================
-- INSERT MIGRATION RECORD
-- ================================

INSERT INTO schema_migrations (version, description)
VALUES ('002_whatsapp_enhancements', 'WhatsApp Business API enhancements for ROMASHKA')
ON CONFLICT (version) DO NOTHING; 