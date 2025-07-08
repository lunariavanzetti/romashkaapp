-- Fix for customer_id column error
-- This script addresses the "column customer_id does not exist" error
-- Run this in your Supabase SQL Editor

-- First, let's check if customer_profiles table exists
-- If not, create it first
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

-- Check if conversations table exists and has correct structure
-- If it exists but doesn't have customer_id column, add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'customer_id'
  ) THEN
    -- Add customer_id column if it doesn't exist
    ALTER TABLE conversations ADD COLUMN customer_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE;
    
    -- If there's a user_id column, we might need to migrate data
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'conversations' 
      AND column_name = 'user_id'
    ) THEN
      -- You can uncomment this line if you need to migrate user_id to customer_id
      -- UPDATE conversations SET customer_id = user_id WHERE customer_id IS NULL;
      NULL;
    END IF;
  END IF;
END $$;

-- Ensure customer_channel_preferences table exists with correct structure
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_email ON customer_profiles(email);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_phone ON customer_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_customer_channel_preferences_customer_id ON customer_channel_preferences(customer_id);

-- Enable RLS on customer_profiles if not already enabled
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Allow authenticated access" ON customer_profiles;
CREATE POLICY "Allow authenticated access" ON customer_profiles
  FOR ALL USING (auth.role() = 'authenticated');

-- Enable RLS on customer_channel_preferences if not already enabled  
ALTER TABLE customer_channel_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for customer_channel_preferences
DROP POLICY IF EXISTS "Allow authenticated access" ON customer_channel_preferences;
CREATE POLICY "Allow authenticated access" ON customer_channel_preferences
  FOR ALL USING (auth.role() = 'authenticated');

-- Verify the fix
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
WHERE table_schema = 'public' AND table_name = 'customer_channel_preferences';

-- Insert some sample data to test
INSERT INTO customer_profiles (email, name, phone, company, location)
VALUES 
  ('john.doe@example.com', 'John Doe', '+1234567890', 'Acme Corp', 'New York'),
  ('jane.smith@example.com', 'Jane Smith', '+1234567891', 'TechCorp', 'San Francisco'),
  ('bob.johnson@example.com', 'Bob Johnson', '+1234567892', 'StartupXYZ', 'Austin')
ON CONFLICT (email) DO NOTHING;

SELECT 'Schema fix completed successfully!' as status;