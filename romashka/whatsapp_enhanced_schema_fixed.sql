-- WhatsApp Business API Enhanced Schema (FIXED)
-- This extends the existing schema with WhatsApp-specific features
-- FIXED: Uses auth.users instead of custom users table

-- Communication Channels table for channel management
CREATE TABLE IF NOT EXISTS communication_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id), -- FIXED: Use auth.users
  type VARCHAR(50) NOT NULL, -- 'whatsapp', 'messenger', 'instagram', etc.
  name VARCHAR(255) NOT NULL,
  configuration JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'pending_setup'
  webhook_url TEXT,
  webhook_secret TEXT,
  message_limit_per_day INTEGER DEFAULT 1000,
  messages_sent_today INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

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
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
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
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
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
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
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
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
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
  last_message_from_business_timestamp TIMESTAMP,
  last_message_from_customer_timestamp TIMESTAMP,
  is_within_24h_window BOOLEAN DEFAULT false,
  conversation_state VARCHAR(50) DEFAULT 'active', -- 'active', 'paused', 'closed'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enhanced message tracking
CREATE TABLE IF NOT EXISTS message_delivery_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  channel_type VARCHAR(50) NOT NULL,
  external_message_id TEXT,
  delivery_status VARCHAR(50) NOT NULL, -- 'sent', 'delivered', 'read', 'failed'
  delivery_timestamp TIMESTAMP DEFAULT NOW(),
  error_details JSONB,
  webhook_payload JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Interactive message responses
CREATE TABLE IF NOT EXISTS whatsapp_interactive_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id),
  response_type VARCHAR(50) NOT NULL, -- 'button', 'list', 'quick_reply'
  response_payload JSONB NOT NULL,
  customer_selection JSONB,
  created_at TIMESTAMP DEFAULT NOW()
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
  created_at TIMESTAMP DEFAULT NOW()
);

-- Webhook events logging
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES communication_channels(id),
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processing_error TEXT,
  created_at TIMESTAMP DEFAULT NOW()
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
  created_at TIMESTAMP DEFAULT NOW(),
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
  last_interaction_at TIMESTAMP,
  preferences JSONB DEFAULT '{}',
  tags TEXT[],
  score INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
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
  last_calculated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_communication_channels_user_id ON communication_channels(user_id);
CREATE INDEX IF NOT EXISTS idx_communication_channels_type ON communication_channels(type);
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

-- Add columns to existing tables if they don't exist
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS channel_type VARCHAR(50);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS channel_id UUID;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS external_conversation_id TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS customer_social_id TEXT;

ALTER TABLE messages ADD COLUMN IF NOT EXISTS channel_type VARCHAR(50);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS external_message_id TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(50) DEFAULT 'text';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_caption TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(50) DEFAULT 'sent';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- Functions remain the same
CREATE OR REPLACE FUNCTION is_business_hours(channel_id UUID, check_time TIMESTAMP DEFAULT NOW())
RETURNS BOOLEAN AS $$
DECLARE
    is_open BOOLEAN := FALSE;
    current_day INTEGER;
    current_time TIME;
BEGIN
    -- Get current day of week (0=Sunday, 1=Monday, etc.)
    current_day := EXTRACT(DOW FROM check_time);
    current_time := check_time::TIME;
    
    -- Check if there's a business hour configuration for this day
    SELECT COUNT(*) > 0 INTO is_open
    FROM whatsapp_business_hours 
    WHERE whatsapp_business_hours.channel_id = is_business_hours.channel_id
        AND day_of_week = current_day
        AND is_active = true
        AND current_time BETWEEN start_time AND end_time;
    
    RETURN is_open;
END;
$$ LANGUAGE plpgsql;

-- Create a function to update daily message count
CREATE OR REPLACE FUNCTION reset_daily_message_count()
RETURNS VOID AS $$
BEGIN
    UPDATE communication_channels 
    SET messages_sent_today = 0, last_reset_date = CURRENT_DATE
    WHERE last_reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Create a function to increment message count
CREATE OR REPLACE FUNCTION increment_message_count(channel_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE communication_channels 
    SET messages_sent_today = messages_sent_today + 1
    WHERE id = channel_id;
END;
$$ LANGUAGE plpgsql;