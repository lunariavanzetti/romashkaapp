-- Final Chat Widget Schema - Matches Your Actual Database Structure
-- Your workflows table uses 'nodes' not 'steps' - this is now corrected

-- Insert default workflow using correct column names from your actual table
DO $$
BEGIN
    -- Insert default workflow if it doesn't exist (using your actual column structure)
    IF NOT EXISTS (SELECT 1 FROM workflows WHERE name = 'Default Chat Workflow') THEN
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
        );
    END IF;
END $$;

-- Chat widget configurations table (if you want widget customization)
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

-- Enable RLS for chat widget configs
ALTER TABLE chat_widget_configs ENABLE ROW LEVEL SECURITY;

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

-- Index for chat widget configs
CREATE INDEX IF NOT EXISTS idx_chat_widget_configs_user_id ON chat_widget_configs(user_id);

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

-- Create trigger for chat widget configs updated_at
DROP TRIGGER IF EXISTS update_chat_widget_configs_updated_at ON chat_widget_configs;
CREATE TRIGGER update_chat_widget_configs_updated_at
    BEFORE UPDATE ON chat_widget_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions for new table
GRANT ALL ON chat_widget_configs TO anon, authenticated;