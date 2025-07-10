-- Fix for customer_id column error - Version 2
-- This version fixes the ON CONFLICT error by ensuring unique constraints exist
-- Run this in your Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- First, let's create customer_profiles table with proper unique constraint
CREATE TABLE IF NOT EXISTS customer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255),
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

-- Add unique constraint to email column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'customer_profiles' 
    AND constraint_type = 'UNIQUE'
    AND constraint_name = 'customer_profiles_email_key'
  ) THEN
    ALTER TABLE customer_profiles ADD CONSTRAINT customer_profiles_email_key UNIQUE (email);
  END IF;
END $$;

-- Check if conversations table exists and has correct structure
-- If it exists but doesn't have customer_id column, add it
DO $$ 
BEGIN
  -- First check if conversations table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'conversations' 
    AND table_schema = 'public'
  ) THEN
    -- Check if customer_id column exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'conversations' 
      AND column_name = 'customer_id'
    ) THEN
      -- Add customer_id column if it doesn't exist
      ALTER TABLE conversations ADD COLUMN customer_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE;
    END IF;
  ELSE
    -- Create conversations table if it doesn't exist
    CREATE TABLE conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE,
      user_name VARCHAR(255),
      user_email VARCHAR(255),
      assigned_agent_id UUID,
      status VARCHAR(50) DEFAULT 'active',
      priority VARCHAR(20) DEFAULT 'normal',
      channel_type VARCHAR(50) DEFAULT 'website',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

-- Create customer_channel_preferences table with proper structure
CREATE TABLE IF NOT EXISTS customer_channel_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE,
  channel_type VARCHAR(50) NOT NULL,
  is_preferred BOOLEAN DEFAULT false,
  opt_in BOOLEAN DEFAULT true,
  last_interaction TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint to customer_channel_preferences
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'customer_channel_preferences' 
    AND constraint_type = 'UNIQUE'
    AND constraint_name = 'customer_channel_preferences_customer_id_channel_type_key'
  ) THEN
    ALTER TABLE customer_channel_preferences 
    ADD CONSTRAINT customer_channel_preferences_customer_id_channel_type_key 
    UNIQUE (customer_id, channel_type);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_email ON customer_profiles(email);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_phone ON customer_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_customer_channel_preferences_customer_id ON customer_channel_preferences(customer_id);

-- Enable RLS on customer_profiles if not already enabled
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated access" ON customer_profiles;
CREATE POLICY "Allow authenticated access" ON customer_profiles
  FOR ALL USING (auth.role() = 'authenticated');

-- Enable RLS on conversations if not already enabled
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for conversations
DROP POLICY IF EXISTS "Allow authenticated access" ON conversations;
CREATE POLICY "Allow authenticated access" ON conversations
  FOR ALL USING (auth.role() = 'authenticated');

-- Enable RLS on customer_channel_preferences if not already enabled  
ALTER TABLE customer_channel_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for customer_channel_preferences
DROP POLICY IF EXISTS "Allow authenticated access" ON customer_channel_preferences;
CREATE POLICY "Allow authenticated access" ON customer_channel_preferences
  FOR ALL USING (auth.role() = 'authenticated');

-- Insert sample data with safer approach (no ON CONFLICT if constraint doesn't exist)
DO $$
BEGIN
  -- Insert test customers only if they don't already exist
  IF NOT EXISTS (SELECT 1 FROM customer_profiles WHERE email = 'john.doe@example.com') THEN
    INSERT INTO customer_profiles (email, name, phone, company, location)
    VALUES ('john.doe@example.com', 'John Doe', '+1234567890', 'Acme Corp', 'New York');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM customer_profiles WHERE email = 'jane.smith@example.com') THEN
    INSERT INTO customer_profiles (email, name, phone, company, location)
    VALUES ('jane.smith@example.com', 'Jane Smith', '+1234567891', 'TechCorp', 'San Francisco');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM customer_profiles WHERE email = 'bob.johnson@example.com') THEN
    INSERT INTO customer_profiles (email, name, phone, company, location)
    VALUES ('bob.johnson@example.com', 'Bob Johnson', '+1234567892', 'StartupXYZ', 'Austin');
  END IF;
END $$;

-- Verify the fix worked
SELECT 
  'customer_profiles' as table_name,
  CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'customer_profiles'
UNION ALL
SELECT 
  'customer_id column in conversations' as table_name,
  CASE WHEN column_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'customer_id'
UNION ALL
SELECT 
  'customer_channel_preferences' as table_name,
  CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'customer_channel_preferences'
UNION ALL
SELECT 
  'email unique constraint' as table_name,
  CASE WHEN constraint_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
  AND table_name = 'customer_profiles' 
  AND constraint_type = 'UNIQUE'
  AND constraint_name = 'customer_profiles_email_key';

-- Show inserted sample data
SELECT 
  'Sample data count' as info,
  COUNT(*)::text as value
FROM customer_profiles;

SELECT 'Fix completed successfully!' as status;