-- Check current database schema
-- This script will help us understand the actual database structure

-- 1. List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Check conversations table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'conversations' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check messages table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'messages' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check customer_profiles table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'customer_profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Check if realtime_metrics table exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'realtime_metrics' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Check profiles table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. Check for any tables that might be related to messaging
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND (table_name LIKE '%message%' OR table_name LIKE '%conversation%' OR table_name LIKE '%chat%')
ORDER BY table_name;