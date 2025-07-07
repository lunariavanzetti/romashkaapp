-- Multi-Channel Communication System Database Schema
-- Run this in your Supabase SQL Editor

-- Create channels table
CREATE TABLE IF NOT EXISTS communication_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'whatsapp', 'messenger', 'instagram', 'email', 'sms', 'website'
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'pending_setup'
  configuration JSONB NOT NULL, -- Channel-specific config
  webhook_url TEXT,
  webhook_secret VARCHAR(255),
  api_credentials JSONB, -- Encrypted credentials
  message_limit_per_day INTEGER DEFAULT 1000,
  messages_sent_today INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Extend conversations table for channels
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS channel_type VARCHAR(50) DEFAULT 'website';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES communication_channels(id);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS external_conversation_id VARCHAR(255); -- WhatsApp chat ID, etc.
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS customer_social_id VARCHAR(255);

-- Extend messages table for channel-specific data
ALTER TABLE messages ADD COLUMN IF NOT EXISTS channel_type VARCHAR(50) DEFAULT 'website';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS external_message_id VARCHAR(255);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(50) DEFAULT 'text'; -- 'text', 'image', 'audio', 'video', 'document', 'location'
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_caption TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(50) DEFAULT 'sent'; -- 'sent', 'delivered', 'read', 'failed'

-- Create message templates table (for WhatsApp template messages)
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  language VARCHAR(10) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'utility', 'marketing', 'authentication'
  template_content JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  channel_type VARCHAR(50) NOT NULL,
  external_template_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create webhook events log
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES communication_channels(id),
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create customer channel preferences
CREATE TABLE IF NOT EXISTS customer_channel_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customer_profiles(id),
  channel_type VARCHAR(50) NOT NULL,
  is_preferred BOOLEAN DEFAULT false,
  opt_in BOOLEAN DEFAULT true,
  last_interaction TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(customer_id, channel_type)
);

-- Create channel routing rules
CREATE TABLE IF NOT EXISTS channel_routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  priority INTEGER DEFAULT 0,
  conditions JSONB NOT NULL, -- Business hours, customer type, etc.
  target_channel_type VARCHAR(50) NOT NULL,
  fallback_channel_type VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create message delivery tracking
CREATE TABLE IF NOT EXISTS message_delivery_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id),
  channel_type VARCHAR(50) NOT NULL,
  external_message_id VARCHAR(255),
  delivery_status VARCHAR(50) DEFAULT 'sent',
  delivery_timestamp TIMESTAMP,
  read_timestamp TIMESTAMP,
  error_details JSONB,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE communication_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_channel_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_routing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_delivery_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies for communication_channels
CREATE POLICY "Allow authenticated users to view channels" ON communication_channels
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage channels" ON communication_channels
  FOR ALL USING (auth.role() = 'authenticated');

-- Create policies for message_templates
CREATE POLICY "Allow authenticated users to view templates" ON message_templates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage templates" ON message_templates
  FOR ALL USING (auth.role() = 'authenticated');

-- Create policies for webhook_events
CREATE POLICY "Allow authenticated users to view webhook events" ON webhook_events
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow system to create webhook events" ON webhook_events
  FOR INSERT WITH CHECK (true);

-- Create policies for customer_channel_preferences
CREATE POLICY "Allow authenticated users to view customer preferences" ON customer_channel_preferences
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update customer preferences" ON customer_channel_preferences
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Create policies for channel_routing_rules
CREATE POLICY "Allow authenticated users to view routing rules" ON channel_routing_rules
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage routing rules" ON channel_routing_rules
  FOR ALL USING (auth.role() = 'authenticated');

-- Create policies for message_delivery_tracking
CREATE POLICY "Allow authenticated users to view delivery tracking" ON message_delivery_tracking
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow system to create delivery tracking" ON message_delivery_tracking
  FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_channel_type ON conversations(channel_type);
CREATE INDEX IF NOT EXISTS idx_conversations_channel_id ON conversations(channel_id);
CREATE INDEX IF NOT EXISTS idx_conversations_external_id ON conversations(external_conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_channel_type ON messages(channel_type);
CREATE INDEX IF NOT EXISTS idx_messages_external_id ON messages(external_message_id);
CREATE INDEX IF NOT EXISTS idx_messages_delivery_status ON messages(delivery_status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_channel_id ON webhook_events(channel_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_message_templates_channel_type ON message_templates(channel_type);
CREATE INDEX IF NOT EXISTS idx_message_templates_status ON message_templates(status);
CREATE INDEX IF NOT EXISTS idx_customer_preferences_channel_type ON customer_channel_preferences(channel_type);
CREATE INDEX IF NOT EXISTS idx_routing_rules_channel_type ON channel_routing_rules(target_channel_type);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_message_id ON message_delivery_tracking(message_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_status ON message_delivery_tracking(delivery_status);

-- Insert sample channels
INSERT INTO communication_channels (name, type, status, configuration) VALUES
('Website Chat', 'website', 'active', '{"theme": "dark", "position": "bottom-right"}'),
('WhatsApp Business', 'whatsapp', 'pending_setup', '{"phoneNumberId": "", "accessToken": "", "webhookSecret": ""}'),
('Facebook Messenger', 'messenger', 'pending_setup', '{"pageAccessToken": "", "appSecret": "", "verifyToken": ""}'),
('Email Support', 'email', 'pending_setup', '{"smtpHost": "", "smtpPort": 587, "supportEmail": ""}'),
('SMS Support', 'sms', 'pending_setup', '{"provider": "twilio", "apiKey": "", "phoneNumber": ""}')
ON CONFLICT DO NOTHING;

-- Insert sample message templates
INSERT INTO message_templates (name, language, category, template_content, status, channel_type) VALUES
('Order Status Update', 'en', 'utility', '{"text": "Your order #{order_number} is {status}. Track it here: {tracking_url}"}', 'approved', 'whatsapp'),
('Welcome Message', 'en', 'utility', '{"text": "Welcome to our support! How can we help you today?"}', 'approved', 'whatsapp'),
('Pricing Inquiry', 'en', 'marketing', '{"text": "Our pricing starts at ${price}/month. Would you like a demo?"}', 'pending', 'whatsapp')
ON CONFLICT DO NOTHING;

-- Insert sample routing rules
INSERT INTO channel_routing_rules (name, priority, conditions, target_channel_type, fallback_channel_type) VALUES
('Business Hours WhatsApp', 1, '{"businessHours": true, "customerType": "premium"}', 'whatsapp', 'email'),
('After Hours Email', 2, '{"businessHours": false}', 'email', 'website'),
('Urgent Issues SMS', 3, '{"priority": "urgent"}', 'sms', 'whatsapp')
ON CONFLICT DO NOTHING; 