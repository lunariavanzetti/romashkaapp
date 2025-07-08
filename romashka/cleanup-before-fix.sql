-- Cleanup script to remove partially created tables
-- Run this ONLY if you need to start fresh after a failed schema creation
-- WARNING: This will delete all data in these tables!

-- Drop tables in reverse dependency order to avoid foreign key errors
DROP TABLE IF EXISTS customer_channel_preferences CASCADE;
DROP TABLE IF EXISTS conversation_notes CASCADE;
DROP TABLE IF EXISTS file_attachments CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS customer_profiles CASCADE;

-- Drop any remaining constraints that might cause issues
DROP INDEX IF EXISTS idx_conversations_customer_id;
DROP INDEX IF EXISTS idx_customer_profiles_email;
DROP INDEX IF EXISTS idx_customer_profiles_phone;
DROP INDEX IF EXISTS idx_customer_channel_preferences_customer_id;

-- Verify cleanup
SELECT 
  'Tables remaining' as info,
  table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'customer_profiles', 
    'conversations', 
    'customer_channel_preferences',
    'messages',
    'conversation_notes',
    'file_attachments'
  );

SELECT 'Cleanup completed. You can now run fix-customer-id-error-v2.sql' as status;