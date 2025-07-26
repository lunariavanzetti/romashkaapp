-- Fix RLS policies and permissions for integrations and related tables

-- Fix oauth_tokens RLS policies
DROP POLICY IF EXISTS "Users can view their own OAuth tokens" ON oauth_tokens;
DROP POLICY IF EXISTS "Users can insert their own OAuth tokens" ON oauth_tokens;
DROP POLICY IF EXISTS "Users can update their own OAuth tokens" ON oauth_tokens;
DROP POLICY IF EXISTS "Users can delete their own OAuth tokens" ON oauth_tokens;

CREATE POLICY "Users can view their own OAuth tokens" ON oauth_tokens
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own OAuth tokens" ON oauth_tokens
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own OAuth tokens" ON oauth_tokens
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own OAuth tokens" ON oauth_tokens
FOR DELETE USING (auth.uid() = user_id);

-- Fix conversations table RLS policies (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conversations') THEN
        DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
        DROP POLICY IF EXISTS "Users can insert their own conversations" ON conversations;
        DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
        DROP POLICY IF EXISTS "Users can delete their own conversations" ON conversations;

        CREATE POLICY "Users can view their own conversations" ON conversations
        FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own conversations" ON conversations
        FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own conversations" ON conversations
        FOR UPDATE USING (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own conversations" ON conversations
        FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Fix messages table RLS policies (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages') THEN
        DROP POLICY IF EXISTS "Users can view messages from their conversations" ON messages;
        DROP POLICY IF EXISTS "Users can insert messages" ON messages;
        DROP POLICY IF EXISTS "Users can update their messages" ON messages;
        DROP POLICY IF EXISTS "Users can delete their messages" ON messages;

        -- Allow users to view messages if they own the conversation
        CREATE POLICY "Users can view messages from their conversations" ON messages
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM conversations 
                WHERE conversations.id = messages.conversation_id 
                AND conversations.user_id = auth.uid()
            )
        );

        -- Allow users to insert messages to their conversations
        CREATE POLICY "Users can insert messages" ON messages
        FOR INSERT WITH CHECK (
            EXISTS (
                SELECT 1 FROM conversations 
                WHERE conversations.id = messages.conversation_id 
                AND conversations.user_id = auth.uid()
            )
        );

        -- Allow users to update messages in their conversations
        CREATE POLICY "Users can update their messages" ON messages
        FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM conversations 
                WHERE conversations.id = messages.conversation_id 
                AND conversations.user_id = auth.uid()
            )
        );

        -- Allow users to delete messages from their conversations
        CREATE POLICY "Users can delete their messages" ON messages
        FOR DELETE USING (
            EXISTS (
                SELECT 1 FROM conversations 
                WHERE conversations.id = messages.conversation_id 
                AND conversations.user_id = auth.uid()
            )
        );
    END IF;
END $$;

-- Fix synced data tables RLS policies
DROP POLICY IF EXISTS "Users can manage their synced contacts" ON synced_contacts;
CREATE POLICY "Users can manage their synced contacts" ON synced_contacts
FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their synced deals" ON synced_deals;
CREATE POLICY "Users can manage their synced deals" ON synced_deals
FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their synced orders" ON synced_orders;
CREATE POLICY "Users can manage their synced orders" ON synced_orders
FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their synced products" ON synced_products;
CREATE POLICY "Users can manage their synced products" ON synced_products
FOR ALL USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON oauth_tokens TO authenticated;
GRANT ALL ON synced_contacts TO authenticated;
GRANT ALL ON synced_deals TO authenticated;  
GRANT ALL ON synced_orders TO authenticated;
GRANT ALL ON synced_products TO authenticated;

-- Grant permissions on conversations and messages if they exist
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conversations') THEN
        GRANT ALL ON conversations TO authenticated;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages') THEN
        GRANT ALL ON messages TO authenticated;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_provider ON oauth_tokens(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_synced_contacts_user_provider ON synced_contacts(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_synced_deals_user_provider ON synced_deals(user_id, provider);

-- Refresh all table statistics
ANALYZE oauth_tokens;
ANALYZE synced_contacts;
ANALYZE synced_deals;
ANALYZE synced_orders;
ANALYZE synced_products;