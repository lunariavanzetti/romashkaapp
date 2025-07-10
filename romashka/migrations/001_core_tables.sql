-- Migration 001: Core Tables Setup
-- Creates the essential tables for ROMASHKA

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name TEXT,
  company_name TEXT,
  website_url TEXT,
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'user',
  timezone VARCHAR(50) DEFAULT 'UTC',
  language VARCHAR(10) DEFAULT 'en',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_data JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customer profiles table
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
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE,
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  assigned_agent_id UUID REFERENCES profiles(id),
  status VARCHAR(50) DEFAULT 'active',
  priority VARCHAR(20) DEFAULT 'normal',
  channel_type VARCHAR(50) DEFAULT 'website',
  tags TEXT[] DEFAULT '{}',
  satisfaction_score DECIMAL(3,2),
  resolution_time_seconds INTEGER,
  department VARCHAR(100) DEFAULT 'general',
  language VARCHAR(10) DEFAULT 'en',
  sentiment VARCHAR(20),
  intent VARCHAR(100),
  ai_confidence DECIMAL(3,2),
  business_context JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  last_message TEXT,
  message_count INTEGER DEFAULT 0,
  workflow_id UUID
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL,
  sender_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  channel_type VARCHAR(50) DEFAULT 'website',
  message_type VARCHAR(50) DEFAULT 'text',
  metadata JSONB DEFAULT '{}',
  confidence_score DECIMAL(3,2),
  processing_time_ms INTEGER,
  intent_detected VARCHAR(100),
  knowledge_sources JSONB DEFAULT '{}',
  tokens_used INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow authenticated access" ON conversations
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON messages
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON customer_profiles
  FOR ALL USING (auth.role() = 'authenticated');

-- Basic indexes
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agent_id ON conversations(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_email ON customer_profiles(email);

-- Functions for new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, company_name, website_url, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'fullName',
    NEW.raw_user_meta_data->>'companyName',
    NEW.raw_user_meta_data->>'websiteUrl',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_profiles_updated_at
  BEFORE UPDATE ON customer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migration complete
SELECT 'Migration 001: Core Tables Setup Complete' as status;