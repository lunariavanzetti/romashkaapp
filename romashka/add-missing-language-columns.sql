-- Quick patch to add missing language columns
-- Run this to fix the "column language does not exist" error

-- Add language column to all tables that need it according to complete-schema.sql

-- Add to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';

-- Add to canned_responses table  
ALTER TABLE canned_responses ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';

-- Add to customer_profiles table
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';

-- Add to conversations table
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';

-- Add to knowledge_items table
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';

-- Add to message_templates table (already has it, but just in case)
ALTER TABLE message_templates ADD COLUMN IF NOT EXISTS language VARCHAR(10) NOT NULL DEFAULT 'en';

-- Add to intent_patterns table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'intent_patterns') THEN
    ALTER TABLE intent_patterns ADD COLUMN IF NOT EXISTS language VARCHAR(10) NOT NULL DEFAULT 'en';
  END IF;
END $$;

-- Verification - check all language columns exist
SELECT 
  'Language Column Verification' as check_type,
  table_name,
  column_name,
  data_type,
  '✓ EXISTS' as status
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND column_name = 'language'
  AND table_name IN (
    'profiles', 'canned_responses', 'customer_profiles', 
    'conversations', 'knowledge_items', 'message_templates',
    'intent_patterns'
  )
ORDER BY table_name;

SELECT 'Language columns patch completed! Try complete-schema.sql again.' as status;