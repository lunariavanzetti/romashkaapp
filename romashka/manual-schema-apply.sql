-- Manual Advanced Chat Schema Application
-- Run this in your Supabase SQL Editor

-- First, let's check if we have any existing data that might conflict
SELECT 'Checking existing data...' as status;

-- Check if agent_availability table exists and has data
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agent_availability') 
    THEN 'agent_availability table exists'
    ELSE 'agent_availability table does not exist'
  END as table_status;

-- Check profiles table for existing users
SELECT COUNT(*) as profile_count FROM profiles;

-- Now apply the schema step by step
-- 1. Extend conversations table
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS assigned_agent_id UUID REFERENCES profiles(id);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS customer_satisfaction INTEGER;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS resolution_time_seconds INTEGER;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS handoff_reason TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS department VARCHAR(100);

-- 2. Create agent availability table
CREATE TABLE IF NOT EXISTS agent_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES profiles(id) NOT NULL,
  is_online BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'available',
  max_concurrent_chats INTEGER DEFAULT 5,
  current_chat_count INTEGER DEFAULT 0,
  last_activity TIMESTAMP DEFAULT NOW(),
  auto_away_time INTEGER DEFAULT 300,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create canned responses table
CREATE TABLE IF NOT EXISTS canned_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  shortcut VARCHAR(50),
  category VARCHAR(100),
  language VARCHAR(10) DEFAULT 'en',
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Create conversation notes table
CREATE TABLE IF NOT EXISTS conversation_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  agent_id UUID REFERENCES profiles(id),
  note TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Create customer profiles table
CREATE TABLE IF NOT EXISTS customer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255),
  name VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  location VARCHAR(255),
  timezone VARCHAR(50),
  language VARCHAR(10) DEFAULT 'en',
  tags TEXT[],
  custom_fields JSONB,
  total_conversations INTEGER DEFAULT 0,
  avg_satisfaction DECIMAL(2,1),
  last_interaction TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Create file attachments table
CREATE TABLE IF NOT EXISTS file_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  message_id UUID REFERENCES messages(id),
  filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Create conversation transfers table
CREATE TABLE IF NOT EXISTS conversation_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  from_agent_id UUID REFERENCES profiles(id),
  to_agent_id UUID REFERENCES profiles(id),
  transfer_reason TEXT,
  transfer_time TIMESTAMP DEFAULT NOW()
);

-- 8. Create SLA tracking table
CREATE TABLE IF NOT EXISTS sla_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  sla_type VARCHAR(50),
  target_time_seconds INTEGER,
  actual_time_seconds INTEGER,
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on all new tables
ALTER TABLE agent_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE canned_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies (drop if exists first to avoid conflicts)
DROP POLICY IF EXISTS "Agents can view own availability" ON agent_availability;
DROP POLICY IF EXISTS "Agents can update own availability" ON agent_availability;
DROP POLICY IF EXISTS "Agents can insert own availability" ON agent_availability;

CREATE POLICY "Agents can view own availability" ON agent_availability
  FOR SELECT USING (auth.uid() = agent_id);

CREATE POLICY "Agents can update own availability" ON agent_availability
  FOR UPDATE USING (auth.uid() = agent_id);

CREATE POLICY "Agents can insert own availability" ON agent_availability
  FOR INSERT WITH CHECK (auth.uid() = agent_id);

-- Canned responses policies
DROP POLICY IF EXISTS "Allow authenticated users to view public responses" ON canned_responses;
DROP POLICY IF EXISTS "Allow users to create responses" ON canned_responses;
DROP POLICY IF EXISTS "Allow users to update own responses" ON canned_responses;

CREATE POLICY "Allow authenticated users to view public responses" ON canned_responses
  FOR SELECT USING (auth.role() = 'authenticated' AND (is_public = true OR created_by = auth.uid()));

CREATE POLICY "Allow users to create responses" ON canned_responses
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Allow users to update own responses" ON canned_responses
  FOR UPDATE USING (auth.uid() = created_by);

-- Conversation notes policies
DROP POLICY IF EXISTS "Allow agents to view conversation notes" ON conversation_notes;
DROP POLICY IF EXISTS "Allow agents to create notes" ON conversation_notes;

CREATE POLICY "Allow agents to view conversation notes" ON conversation_notes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow agents to create notes" ON conversation_notes
  FOR INSERT WITH CHECK (auth.uid() = agent_id);

-- Customer profiles policies
DROP POLICY IF EXISTS "Allow authenticated users to view customer profiles" ON customer_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update customer profiles" ON customer_profiles;

CREATE POLICY "Allow authenticated users to view customer profiles" ON customer_profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update customer profiles" ON customer_profiles
  FOR UPDATE USING (auth.role() = 'authenticated');

-- File attachments policies
DROP POLICY IF EXISTS "Allow authenticated users to view attachments" ON file_attachments;
DROP POLICY IF EXISTS "Allow authenticated users to upload attachments" ON file_attachments;

CREATE POLICY "Allow authenticated users to view attachments" ON file_attachments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to upload attachments" ON file_attachments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Conversation transfers policies
DROP POLICY IF EXISTS "Allow authenticated users to view transfers" ON conversation_transfers;
DROP POLICY IF EXISTS "Allow agents to create transfers" ON conversation_transfers;

CREATE POLICY "Allow authenticated users to view transfers" ON conversation_transfers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow agents to create transfers" ON conversation_transfers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- SLA tracking policies
DROP POLICY IF EXISTS "Allow authenticated users to view SLA data" ON sla_tracking;
DROP POLICY IF EXISTS "Allow system to create SLA records" ON sla_tracking;

CREATE POLICY "Allow authenticated users to view SLA data" ON sla_tracking
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow system to create SLA records" ON sla_tracking
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_conversations_assigned_agent ON conversations(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_priority ON conversations(priority);
CREATE INDEX IF NOT EXISTS idx_conversations_department ON conversations(department);
CREATE INDEX IF NOT EXISTS idx_agent_availability_status ON agent_availability(status);
CREATE INDEX IF NOT EXISTS idx_agent_availability_agent_id ON agent_availability(agent_id);
CREATE INDEX IF NOT EXISTS idx_canned_responses_shortcut ON canned_responses(shortcut);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_email ON customer_profiles(email);
CREATE INDEX IF NOT EXISTS idx_file_attachments_conversation ON file_attachments(conversation_id);

-- Insert sample canned responses (safe, no foreign key dependencies)
INSERT INTO canned_responses (title, content, shortcut, category) VALUES
('Greeting', 'Hello! How can I help you today?', '/greeting', 'General'),
('Pricing Info', 'Our pricing starts at $29/month. Would you like me to send you our detailed pricing guide?', '/pricing', 'Sales'),
('Technical Support', 'I understand you''re having a technical issue. Let me connect you with our technical support team.', '/tech', 'Support'),
('Billing Question', 'I''d be happy to help with your billing question. Could you provide your account number?', '/billing', 'Billing'),
('Thank You', 'Thank you for contacting us! Is there anything else I can help you with?', '/thanks', 'General')
ON CONFLICT DO NOTHING;

-- Verify the tables were created successfully
SELECT 'Schema application completed!' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'agent_availability',
  'canned_responses',
  'conversation_notes', 
  'customer_profiles',
  'file_attachments',
  'conversation_transfers',
  'sla_tracking'
) ORDER BY table_name; 