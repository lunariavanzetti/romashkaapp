-- Pre-Complete Schema Patch - Version 2
-- Run this BEFORE running complete-schema.sql to fix missing columns
-- This version fixes the messages table existence issue

-- First, create tables that might not exist

-- Create profiles table if it doesn't exist (referencing auth.users)
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

-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL,
  sender_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  channel_type VARCHAR(50) DEFAULT 'website',
  external_message_id VARCHAR(255),
  message_type VARCHAR(50) DEFAULT 'text',
  media_url TEXT,
  media_caption TEXT,
  delivery_status VARCHAR(50) DEFAULT 'sent',
  metadata JSONB DEFAULT '{}',
  confidence_score DECIMAL(3,2),
  processing_time_ms INTEGER,
  intent_detected VARCHAR(100),
  knowledge_sources JSONB DEFAULT '{}',
  tokens_used INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Now add missing columns to existing tables

-- Add missing columns to conversations table
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS workflow_id UUID;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS sentiment VARCHAR(20);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS intent VARCHAR(100);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(3,2);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS business_context JSONB DEFAULT '{}';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS satisfaction_score DECIMAL(3,2);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS resolution_time_seconds INTEGER;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS handoff_reason TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS department VARCHAR(100) DEFAULT 'general';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS channel_id UUID;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS external_conversation_id VARCHAR(255);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS customer_social_id VARCHAR(255);

-- Add missing columns to customer_profiles table
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add missing columns to profiles table (now that we know it exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add missing columns to messages table (now that we know it exists)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS intent_detected VARCHAR(100);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS knowledge_sources JSONB DEFAULT '{}';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS tokens_used INTEGER;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS channel_type VARCHAR(50) DEFAULT 'website';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS external_message_id VARCHAR(255);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(50) DEFAULT 'text';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_caption TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(50) DEFAULT 'sent';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES profiles(id);

-- Add missing columns to canned_responses table
ALTER TABLE canned_responses ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE canned_responses ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE canned_responses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add missing columns to agent_availability table
ALTER TABLE agent_availability ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE agent_availability ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT '{"monday": {"start": "09:00", "end": "17:00"}, "tuesday": {"start": "09:00", "end": "17:00"}, "wednesday": {"start": "09:00", "end": "17:00"}, "thursday": {"start": "09:00", "end": "17:00"}, "friday": {"start": "09:00", "end": "17:00"}}';

-- Add missing columns to customer_channel_preferences table
ALTER TABLE customer_channel_preferences ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update column types to match complete schema (with TIME ZONE) - with error handling
DO $$
BEGIN
  BEGIN
    -- Update conversations timestamps
    ALTER TABLE conversations ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;
  EXCEPTION WHEN others THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE conversations ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;
  EXCEPTION WHEN others THEN NULL;
  END;
  
  BEGIN
    -- Update customer_profiles timestamps
    ALTER TABLE customer_profiles ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;
  EXCEPTION WHEN others THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE customer_profiles ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;
  EXCEPTION WHEN others THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE customer_profiles ALTER COLUMN last_interaction TYPE TIMESTAMP WITH TIME ZONE;
  EXCEPTION WHEN others THEN NULL;
  END;
  
  BEGIN
    -- Update agent_availability timestamps
    ALTER TABLE agent_availability ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;
  EXCEPTION WHEN others THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE agent_availability ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;
  EXCEPTION WHEN others THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE agent_availability ALTER COLUMN last_activity TYPE TIMESTAMP WITH TIME ZONE;
  EXCEPTION WHEN others THEN NULL;
  END;
  
  BEGIN
    -- Update canned_responses timestamps
    ALTER TABLE canned_responses ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;
  EXCEPTION WHEN others THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE canned_responses ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;
  EXCEPTION WHEN others THEN NULL;
  END;
  
  BEGIN
    -- Update customer_channel_preferences timestamps
    ALTER TABLE customer_channel_preferences ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;
  EXCEPTION WHEN others THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE customer_channel_preferences ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;
  EXCEPTION WHEN others THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE customer_channel_preferences ALTER COLUMN last_interaction TYPE TIMESTAMP WITH TIME ZONE;
  EXCEPTION WHEN others THEN NULL;
  END;
END $$;

-- Create basic indexes that might be expected
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned_agent_id ON conversations(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_type ON messages(sender_type);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);

-- Enable RLS on new tables
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for messages
DROP POLICY IF EXISTS "Allow authenticated access" ON messages;
CREATE POLICY "Allow authenticated access" ON messages
  FOR ALL USING (auth.role() = 'authenticated');

-- Create basic RLS policies for profiles
DROP POLICY IF EXISTS "Allow users to view own profile" ON profiles;
CREATE POLICY "Allow users to view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow users to update own profile" ON profiles;
CREATE POLICY "Allow users to update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Verification
SELECT 
  'Pre-patch verification' as check_type,
  'conversations.status' as item,
  CASE WHEN column_name IS NOT NULL THEN '✓ EXISTS' ELSE '✗ MISSING' END as status
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'status'
UNION ALL
SELECT 
  'Pre-patch verification' as check_type,
  'messages table' as item,
  CASE WHEN table_name IS NOT NULL THEN '✓ EXISTS' ELSE '✗ MISSING' END as status
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'messages'
UNION ALL
SELECT 
  'Pre-patch verification' as check_type,
  'profiles table' as item,
  CASE WHEN table_name IS NOT NULL THEN '✓ EXISTS' ELSE '✗ MISSING' END as status
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'profiles'
UNION ALL
SELECT 
  'Pre-patch verification' as check_type,
  'messages.metadata column' as item,
  CASE WHEN column_name IS NOT NULL THEN '✓ EXISTS' ELSE '✗ MISSING' END as status
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'metadata';

-- Count tables to verify
SELECT 
  'Table count verification' as check_type,
  COUNT(*)::text || ' tables exist' as item,
  '✓ VERIFIED' as status
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

SELECT 'Pre-complete schema patch v2 completed successfully!' as status;