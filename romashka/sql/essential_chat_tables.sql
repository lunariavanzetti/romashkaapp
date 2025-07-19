-- Essential Chat Widget Tables - Simple Version
-- This creates only the necessary tables for chat widget functionality
-- without modifying existing workflows table

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id TEXT DEFAULT 'default-workflow',
  user_email TEXT,
  user_name TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'ai')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Workflow executions table
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id TEXT NOT NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'completed' CHECK (status IN ('running', 'completed', 'failed', 'paused')),
  execution_data JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_conversations_workflow_id ON conversations(workflow_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_conversation_id ON workflow_executions(conversation_id);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations (public access for widget)
DROP POLICY IF EXISTS "Public can create conversations" ON conversations;
CREATE POLICY "Public can create conversations" ON conversations
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view conversations" ON conversations;
CREATE POLICY "Public can view conversations" ON conversations
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can update conversations" ON conversations;
CREATE POLICY "Public can update conversations" ON conversations
  FOR UPDATE USING (true);

-- RLS Policies for messages (public access for widget)
DROP POLICY IF EXISTS "Public can create messages" ON messages;
CREATE POLICY "Public can create messages" ON messages
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view messages" ON messages;
CREATE POLICY "Public can view messages" ON messages
  FOR SELECT USING (true);

-- RLS Policies for workflow executions
DROP POLICY IF EXISTS "Public can create workflow executions" ON workflow_executions;
CREATE POLICY "Public can create workflow executions" ON workflow_executions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view workflow executions" ON workflow_executions;
CREATE POLICY "Public can view workflow executions" ON workflow_executions
  FOR SELECT USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;