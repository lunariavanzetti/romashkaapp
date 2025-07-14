-- ROMASHKA Complete Migration Script
-- Version: 1.0.0
-- Description: Complete ROMASHKA schema migration that builds on existing prompt_history table
-- Date: 2024-01-15
-- Author: ROMASHKA Team

-- ================================
-- MIGRATION METADATA
-- ================================

-- Check if migration has already been run
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schema_migrations') THEN
    IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = '001_complete_romashka_migration') THEN
      RAISE EXCEPTION 'Migration 001_complete_romashka_migration has already been applied';
    END IF;
  END IF;
END $$;

-- Create schema_migrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT
);

-- ================================
-- EXTENSIONS & PREREQUISITES
-- ================================

-- Create required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================
-- UTILITY FUNCTIONS
-- ================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate UUID
CREATE OR REPLACE FUNCTION generate_uuid()
RETURNS UUID AS $$
BEGIN
    RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql;

-- ================================
-- CORE USER MANAGEMENT
-- ================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name TEXT,
  company_name TEXT,
  website_url TEXT,
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'user', -- 'admin', 'agent', 'user'
  timezone VARCHAR(50) DEFAULT 'UTC',
  language VARCHAR(10) DEFAULT 'en',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_data JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- CUSTOMER MANAGEMENT
-- ================================

-- Customer profiles with custom fields
CREATE TABLE IF NOT EXISTS customer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  location VARCHAR(255),
  timezone VARCHAR(50) DEFAULT 'UTC',
  language VARCHAR(10) DEFAULT 'en',
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  total_conversations INTEGER DEFAULT 0,
  avg_satisfaction DECIMAL(3,2) DEFAULT 0,
  last_interaction TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'blocked', 'vip'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- AGENT MANAGEMENT
-- ================================

-- Agent availability and status tracking
CREATE TABLE IF NOT EXISTS agent_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  is_online BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'available', -- 'available', 'busy', 'away', 'offline'
  max_concurrent_chats INTEGER DEFAULT 5,
  current_chat_count INTEGER DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  auto_away_time INTEGER DEFAULT 300, -- seconds
  working_hours JSONB DEFAULT '{"monday": {"start": "09:00", "end": "17:00"}, "tuesday": {"start": "09:00", "end": "17:00"}, "wednesday": {"start": "09:00", "end": "17:00"}, "thursday": {"start": "09:00", "end": "17:00"}, "friday": {"start": "09:00", "end": "17:00"}}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- COMMUNICATION CHANNELS
-- ================================

-- Communication channels (WhatsApp, Email, etc.)
CREATE TABLE IF NOT EXISTS communication_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'whatsapp', 'messenger', 'instagram', 'email', 'sms', 'website'
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'pending_setup'
  configuration JSONB NOT NULL DEFAULT '{}',
  webhook_url TEXT,
  webhook_secret VARCHAR(255),
  api_credentials JSONB, -- Encrypted credentials
  message_limit_per_day INTEGER DEFAULT 1000,
  messages_sent_today INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- CONVERSATIONS & MESSAGES
-- ================================

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customer_profiles(id),
  assigned_agent_id UUID REFERENCES profiles(id),
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'closed', 'pending', 'resolved'
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  channel_type VARCHAR(50), -- 'whatsapp', 'email', 'website', 'phone'
  channel_id UUID REFERENCES communication_channels(id),
  external_conversation_id TEXT,
  customer_phone TEXT,
  customer_social_id TEXT,
  subject TEXT,
  tags TEXT[] DEFAULT '{}',
  satisfaction_score DECIMAL(3,2),
  language VARCHAR(10) DEFAULT 'en',
  sentiment VARCHAR(20),
  intent VARCHAR(100),
  ai_confidence DECIMAL(3,2),
  business_context JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL, -- 'customer', 'agent', 'system', 'ai'
  content TEXT NOT NULL,
  channel_type VARCHAR(50),
  external_message_id TEXT,
  message_type VARCHAR(50) DEFAULT 'text',
  media_url TEXT,
  media_caption TEXT,
  delivery_status VARCHAR(50) DEFAULT 'sent',
  role VARCHAR(20) DEFAULT 'user',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- KNOWLEDGE BASE
-- ================================

-- Knowledge categories
CREATE TABLE IF NOT EXISTS knowledge_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES knowledge_categories(id),
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge items
CREATE TABLE IF NOT EXISTS knowledge_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  category_id UUID REFERENCES knowledge_categories(id),
  source_type VARCHAR(50) NOT NULL, -- 'url', 'file', 'manual'
  source_url TEXT,
  file_path TEXT,
  confidence_score DECIMAL(3,2) DEFAULT 0.8,
  usage_count INTEGER DEFAULT 0,
  effectiveness_score DECIMAL(3,2) DEFAULT 0.5,
  language VARCHAR(10) DEFAULT 'en',
  tags TEXT[] DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'draft', 'archived'
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- CANNED RESPONSES
-- ================================

-- Canned responses with categories
CREATE TABLE IF NOT EXISTS canned_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  shortcut VARCHAR(50), -- e.g., '/greeting', '/pricing'
  category VARCHAR(100) DEFAULT 'general',
  language VARCHAR(10) DEFAULT 'en',
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- ANALYTICS & METRICS
-- ================================

-- Daily metrics
CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  agent_id UUID REFERENCES profiles(id),
  channel_type VARCHAR(50),
  conversations_started INTEGER DEFAULT 0,
  conversations_resolved INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  avg_response_time_seconds INTEGER DEFAULT 0,
  customer_satisfaction_score DECIMAL(3,2) DEFAULT 0,
  total_duration_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, agent_id, channel_type)
);

-- Conversation analytics
CREATE TABLE IF NOT EXISTS conversation_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  total_messages INTEGER DEFAULT 0,
  customer_messages INTEGER DEFAULT 0,
  agent_messages INTEGER DEFAULT 0,
  avg_response_time_seconds INTEGER DEFAULT 0,
  first_response_time_seconds INTEGER DEFAULT 0,
  resolution_time_minutes INTEGER DEFAULT 0,
  customer_satisfaction_score DECIMAL(3,2),
  sentiment_score DECIMAL(3,2),
  intent_detected VARCHAR(100),
  keywords_extracted TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- SYSTEM SETTINGS
-- ================================

-- System settings
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'general',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- AUDIT LOGS
-- ================================

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- INTEGRATE WITH EXISTING PROMPT_HISTORY
-- ================================

-- Add columns to existing prompt_history table to integrate with ROMASHKA
ALTER TABLE prompt_history ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id);
ALTER TABLE prompt_history ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE prompt_history ADD COLUMN IF NOT EXISTS message_id UUID REFERENCES messages(id);
ALTER TABLE prompt_history ADD COLUMN IF NOT EXISTS prompt_type VARCHAR(50) DEFAULT 'general';
ALTER TABLE prompt_history ADD COLUMN IF NOT EXISTS model_used VARCHAR(100);
ALTER TABLE prompt_history ADD COLUMN IF NOT EXISTS tokens_used INTEGER;
ALTER TABLE prompt_history ADD COLUMN IF NOT EXISTS response_time_ms INTEGER;

-- ================================
-- INDEXES FOR PERFORMANCE
-- ================================

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agent_id ON conversations(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_channel_type ON conversations(channel_type);
CREATE INDEX IF NOT EXISTS idx_conversations_status_created_at ON conversations(status, created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_agent_status ON conversations(assigned_agent_id, status);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_type ON messages(sender_type);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at);

-- Customer profiles indexes
CREATE INDEX IF NOT EXISTS idx_customer_profiles_email ON customer_profiles(email);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_phone ON customer_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_created_at ON customer_profiles(created_at);

-- Agent availability indexes
CREATE INDEX IF NOT EXISTS idx_agent_availability_agent_id ON agent_availability(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_availability_is_online ON agent_availability(is_online);
CREATE INDEX IF NOT EXISTS idx_agent_availability_status ON agent_availability(status);

-- Knowledge base indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_items_category_id ON knowledge_items(category_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_status ON knowledge_items(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_language ON knowledge_items(language);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(date);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_agent_id ON daily_metrics(agent_id);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_channel_type ON daily_metrics(channel_type);

-- Canned responses indexes
CREATE INDEX IF NOT EXISTS idx_canned_responses_category ON canned_responses(category);
CREATE INDEX IF NOT EXISTS idx_canned_responses_shortcut ON canned_responses(shortcut);
CREATE INDEX IF NOT EXISTS idx_canned_responses_language ON canned_responses(language);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_items_content_trgm ON knowledge_items USING gin(content gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_title_trgm ON knowledge_items USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_messages_content_trgm ON messages USING gin(content gin_trgm_ops);

-- ================================
-- TRIGGERS
-- ================================

-- Update timestamps triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_profiles_updated_at
    BEFORE UPDATE ON customer_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- ROW LEVEL SECURITY (RLS)
-- ================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE canned_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Customer profiles policies
CREATE POLICY "Allow authenticated access to customer profiles" ON customer_profiles
  FOR ALL USING (auth.role() = 'authenticated');

-- Agent availability policies
CREATE POLICY "Agents can manage own availability" ON agent_availability
  FOR ALL USING (auth.uid() = agent_id);

-- Conversations policies
CREATE POLICY "Allow authenticated access to conversations" ON conversations
  FOR ALL USING (auth.role() = 'authenticated');

-- Messages policies
CREATE POLICY "Allow authenticated access to messages" ON messages
  FOR ALL USING (auth.role() = 'authenticated');

-- Knowledge base policies
CREATE POLICY "Allow authenticated access to knowledge items" ON knowledge_items
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access to knowledge categories" ON knowledge_categories
  FOR ALL USING (auth.role() = 'authenticated');

-- Canned responses policies
CREATE POLICY "Allow authenticated access to canned responses" ON canned_responses
  FOR ALL USING (auth.role() = 'authenticated');

-- Communication channels policies
CREATE POLICY "Allow authenticated access to communication channels" ON communication_channels
  FOR ALL USING (auth.role() = 'authenticated');

-- Analytics policies
CREATE POLICY "Allow authenticated access to daily metrics" ON daily_metrics
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access to conversation analytics" ON conversation_analytics
  FOR ALL USING (auth.role() = 'authenticated');

-- System settings policies
CREATE POLICY "Allow admin access to system settings" ON system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Audit logs policies
CREATE POLICY "Allow authenticated access to audit logs" ON audit_logs
  FOR ALL USING (auth.role() = 'authenticated');

-- ================================
-- INSERT MIGRATION RECORD
-- ================================

INSERT INTO schema_migrations (version, description)
VALUES ('001_complete_romashka_migration', 'Complete ROMASHKA schema migration with prompt_history integration')
ON CONFLICT (version) DO NOTHING; 