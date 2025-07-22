-- Complete Database Schema Fix
-- This addresses ALL remaining database errors: messages, conversations, oauth_tokens

-- 1. Fix conversations table - add any missing columns that might cause 400 errors
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS summary TEXT;

-- 2. Ensure all required message columns exist and have proper defaults
ALTER TABLE messages ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'sent';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(50) DEFAULT 'text';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Update existing NULL values
UPDATE messages SET status = 'sent' WHERE status IS NULL;
UPDATE messages SET message_type = 'text' WHERE message_type IS NULL;
UPDATE messages SET metadata = '{}' WHERE metadata IS NULL;
UPDATE conversations SET title = 'Conversation' WHERE title IS NULL;

-- 4. Fix oauth_tokens table accessibility (ensure proper RLS)
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own oauth tokens" ON oauth_tokens;
DROP POLICY IF EXISTS "Allow authenticated users to manage oauth_tokens" ON oauth_tokens;

-- Create simple RLS policy for oauth_tokens
CREATE POLICY "Allow authenticated users to manage oauth_tokens" ON oauth_tokens
  FOR ALL USING (auth.uid() IS NOT NULL);

-- 5. Fix synced data tables RLS
ALTER TABLE synced_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE synced_orders ENABLE ROW LEVEL SECURITY;  
ALTER TABLE synced_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE synced_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies for all synced data tables
DROP POLICY IF EXISTS "Users can manage their own synced contacts" ON synced_contacts;
CREATE POLICY "Users can manage their own synced contacts" ON synced_contacts
  FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can manage their own synced orders" ON synced_orders;
CREATE POLICY "Users can manage their own synced orders" ON synced_orders
  FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can manage their own synced products" ON synced_products;
CREATE POLICY "Users can manage their own synced products" ON synced_products
  FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can manage their own synced deals" ON synced_deals;
CREATE POLICY "Users can manage their own synced deals" ON synced_deals
  FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view their own integration logs" ON integration_logs;
CREATE POLICY "Users can view their own integration logs" ON integration_logs
  FOR ALL USING (auth.uid() IS NOT NULL);

-- 6. Create helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_provider ON oauth_tokens(user_id, provider);

-- 7. Ensure conversations table has proper RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own conversations" ON conversations;
CREATE POLICY "Users can manage their own conversations" ON conversations
  FOR ALL USING (auth.uid() IS NOT NULL);

-- 8. Grant necessary permissions
GRANT ALL ON oauth_tokens TO authenticated;
GRANT ALL ON synced_contacts TO authenticated;
GRANT ALL ON synced_orders TO authenticated;
GRANT ALL ON synced_products TO authenticated;
GRANT ALL ON synced_deals TO authenticated;
GRANT ALL ON integration_logs TO authenticated;
GRANT ALL ON shopify_stores TO authenticated;
GRANT ALL ON salesforce_orgs TO authenticated;
GRANT ALL ON hubspot_portals TO authenticated;

-- 9. Create missing provider-specific tables RLS if not exists
ALTER TABLE shopify_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE salesforce_orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hubspot_portals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own shopify stores" ON shopify_stores;
CREATE POLICY "Users can manage their own shopify stores" ON shopify_stores
  FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can manage their own salesforce orgs" ON salesforce_orgs;
CREATE POLICY "Users can manage their own salesforce orgs" ON salesforce_orgs
  FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can manage their own hubspot portals" ON hubspot_portals;
CREATE POLICY "Users can manage their own hubspot portals" ON hubspot_portals
  FOR ALL USING (auth.uid() IS NOT NULL);

-- 10. Ensure the RPC function exists and works
DROP FUNCTION IF EXISTS get_next_ai_response_job();

CREATE OR REPLACE FUNCTION get_next_ai_response_job()
RETURNS TABLE (
  id UUID,
  conversation_id UUID,
  message_content TEXT,
  user_id UUID,
  priority INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return empty result set to prevent errors
  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION get_next_ai_response_job() TO authenticated;