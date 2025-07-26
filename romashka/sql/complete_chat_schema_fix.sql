-- Complete Chat Schema Fix
-- This adds all missing columns and tables for chat widget functionality

-- First, let's add missing columns to conversations table
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS workflow_id TEXT DEFAULT 'default-workflow',
ADD COLUMN IF NOT EXISTS user_email TEXT,
ADD COLUMN IF NOT EXISTS user_name TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add constraint for status if it doesn't exist
DO $$
BEGIN
    ALTER TABLE conversations ADD CONSTRAINT conversations_status_check CHECK (status IN ('active', 'closed', 'archived'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Add missing columns to messages table if they don't exist
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS sender_type TEXT DEFAULT 'user',
ADD COLUMN IF NOT EXISTS content TEXT,
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Add constraints for messages
DO $$
BEGIN
    ALTER TABLE messages ADD CONSTRAINT messages_sender_type_check CHECK (sender_type IN ('user', 'ai', 'agent'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE messages ADD CONSTRAINT messages_message_type_check CHECK (message_type IN ('text', 'image', 'file', 'system'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE messages ADD CONSTRAINT messages_status_check CHECK (status IN ('sending', 'sent', 'delivered', 'read', 'failed'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create typing_indicators table for real-time chat
CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT false,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, conversation_id)
);

-- Create workflow_executions table if it doesn't exist
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id TEXT NOT NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'completed' CHECK (status IN ('running', 'completed', 'failed', 'paused')),
  execution_data JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_workflow_id ON conversations(workflow_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_message_type ON messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_sender_type ON messages(sender_type);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation_id ON typing_indicators(conversation_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_user_id ON typing_indicators(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_conversation_id ON workflow_executions(conversation_id);

-- Enable RLS for all tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
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

DROP POLICY IF EXISTS "Public can update messages" ON messages;
CREATE POLICY "Public can update messages" ON messages
  FOR UPDATE USING (true);

-- RLS Policies for typing_indicators (public access for widget)
DROP POLICY IF EXISTS "Public can create typing indicators" ON typing_indicators;
CREATE POLICY "Public can create typing indicators" ON typing_indicators
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view typing indicators" ON typing_indicators;
CREATE POLICY "Public can view typing indicators" ON typing_indicators
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can update typing indicators" ON typing_indicators;
CREATE POLICY "Public can update typing indicators" ON typing_indicators
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public can delete typing indicators" ON typing_indicators;
CREATE POLICY "Public can delete typing indicators" ON typing_indicators
  FOR DELETE USING (true);

-- RLS Policies for workflow executions
DROP POLICY IF EXISTS "Public can create workflow executions" ON workflow_executions;
CREATE POLICY "Public can create workflow executions" ON workflow_executions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view workflow executions" ON workflow_executions;
CREATE POLICY "Public can view workflow executions" ON workflow_executions
  FOR SELECT USING (true);

-- Create function to update updated_at timestamp (if not exists)
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

DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_typing_indicators_updated_at ON typing_indicators;
CREATE TRIGGER update_typing_indicators_updated_at
    BEFORE UPDATE ON typing_indicators
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions for all tables
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Insert default workflow if it doesn't exist
INSERT INTO workflows (name, description, nodes, connections, is_active, user_id)
VALUES (
    'Default Chat Workflow',
    'Basic chat workflow for responding to user messages',
    '[
        {
            "id": "start",
            "type": "start", 
            "position": {"x": 100, "y": 100},
            "data": {"label": "Start"}
        },
        {
            "id": "ai_response",
            "type": "ai_response",
            "position": {"x": 300, "y": 100},
            "data": {"label": "Generate AI Response"}
        },
        {
            "id": "end",
            "type": "end",
            "position": {"x": 500, "y": 100},
            "data": {"label": "End"}
        }
    ]'::jsonb,
    '[
        {
            "id": "start-to-ai",
            "source": "start",
            "target": "ai_response"
        },
        {
            "id": "ai-to-end", 
            "source": "ai_response",
            "target": "end"
        }
    ]'::jsonb,
    true,
    NULL
)
ON CONFLICT (name) DO NOTHING;