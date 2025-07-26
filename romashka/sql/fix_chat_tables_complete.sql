-- Complete Chat Tables Fix - Missing Columns and Constraints
-- This adds missing columns to messages table and fixes issues

-- Add missing columns to messages table if they don't exist
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'read', 'failed')),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Extend sender_type to include 'agent' option
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_type_check;
ALTER TABLE messages ADD CONSTRAINT messages_sender_type_check CHECK (sender_type IN ('user', 'ai', 'agent'));

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

-- Enable RLS for typing_indicators
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

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

-- Create trigger for messages updated_at
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for typing_indicators updated_at
DROP TRIGGER IF EXISTS update_typing_indicators_updated_at ON typing_indicators;
CREATE TRIGGER update_typing_indicators_updated_at
    BEFORE UPDATE ON typing_indicators
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation_id ON typing_indicators(conversation_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_user_id ON typing_indicators(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_message_type ON messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_sender_type ON messages(sender_type);

-- Grant permissions for new table
GRANT ALL ON typing_indicators TO anon, authenticated;

-- Update grant permissions for all tables
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;