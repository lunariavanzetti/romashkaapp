-- Chat Widget Enhanced Schema - FIXED VERSION
-- Create additional tables needed for chat widget functionality

-- First, let's check what columns exist in workflows table
-- Run this first to see the structure:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'workflows';

-- Update workflows table to add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add steps column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflows' AND column_name = 'steps') THEN
        ALTER TABLE workflows ADD COLUMN steps JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    -- Add connections column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflows' AND column_name = 'connections') THEN
        ALTER TABLE workflows ADD COLUMN connections JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflows' AND column_name = 'is_active') THEN
        ALTER TABLE workflows ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    -- Add description column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflows' AND column_name = 'description') THEN
        ALTER TABLE workflows ADD COLUMN description TEXT;
    END IF;
END $$;

-- Conversations table (if not exists)
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

-- Messages table (if not exists)
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

-- Workflow templates table
CREATE TABLE IF NOT EXISTS workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  workflow_id TEXT NOT NULL,
  thumbnail TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Chat widget configurations table
CREATE TABLE IF NOT EXISTS chat_widget_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default Widget',
  theme TEXT DEFAULT 'auto' CHECK (theme IN ('light', 'dark', 'auto')),
  position TEXT DEFAULT 'bottom-right' CHECK (position IN ('bottom-right', 'bottom-left')),
  primary_color TEXT DEFAULT '#ec4899',
  welcome_message TEXT DEFAULT 'Hello! How can I help you today?',
  placeholder_text TEXT DEFAULT 'Type your message...',
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_workflow_id ON conversations(workflow_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_conversation_id ON workflow_executions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_widget_configs_user_id ON chat_widget_configs(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_widget_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workflows
DROP POLICY IF EXISTS "Users can view their own workflows" ON workflows;
CREATE POLICY "Users can view their own workflows" ON workflows
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert their own workflows" ON workflows;
CREATE POLICY "Users can insert their own workflows" ON workflows
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can update their own workflows" ON workflows;
CREATE POLICY "Users can update their own workflows" ON workflows
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can delete their own workflows" ON workflows;
CREATE POLICY "Users can delete their own workflows" ON workflows
  FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- RLS Policies for conversations (allow public access for widget functionality)
DROP POLICY IF EXISTS "Public can create conversations" ON conversations;
CREATE POLICY "Public can create conversations" ON conversations
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view conversations" ON conversations;
CREATE POLICY "Public can view conversations" ON conversations
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can update conversations" ON conversations;
CREATE POLICY "Public can update conversations" ON conversations
  FOR UPDATE USING (true);

-- RLS Policies for messages (allow public access for widget functionality)
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

-- RLS Policies for workflow templates
DROP POLICY IF EXISTS "Public can view workflow templates" ON workflow_templates;
CREATE POLICY "Public can view workflow templates" ON workflow_templates
  FOR SELECT USING (is_public = true);

-- RLS Policies for chat widget configs
DROP POLICY IF EXISTS "Users can view their own widget configs" ON chat_widget_configs;
CREATE POLICY "Users can view their own widget configs" ON chat_widget_configs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own widget configs" ON chat_widget_configs;
CREATE POLICY "Users can insert their own widget configs" ON chat_widget_configs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own widget configs" ON chat_widget_configs;
CREATE POLICY "Users can update their own widget configs" ON chat_widget_configs
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own widget configs" ON chat_widget_configs;
CREATE POLICY "Users can delete their own widget configs" ON chat_widget_configs
  FOR DELETE USING (auth.uid() = user_id);

-- Insert default workflow using a compatible approach
-- First, check if default workflow exists
DO $$
BEGIN
    -- Insert default workflow if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM workflows WHERE name = 'Default Chat Workflow') THEN
        INSERT INTO workflows (name, description, steps, connections, is_active, user_id)
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
        );
    END IF;
END $$;

-- Insert default widget configuration for existing users (if any)
INSERT INTO chat_widget_configs (user_id, name, welcome_message)
SELECT 
    id,
    'Default Widget',
    'Hello! I''m ROMASHKA AI, your customer service assistant. How can I help you today?'
FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 FROM chat_widget_configs WHERE user_id = auth.users.id
)
ON CONFLICT DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_workflows_updated_at ON workflows;
CREATE TRIGGER update_workflows_updated_at
    BEFORE UPDATE ON workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workflow_templates_updated_at ON workflow_templates;
CREATE TRIGGER update_workflow_templates_updated_at
    BEFORE UPDATE ON workflow_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_widget_configs_updated_at ON chat_widget_configs;
CREATE TRIGGER update_chat_widget_configs_updated_at
    BEFORE UPDATE ON chat_widget_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;