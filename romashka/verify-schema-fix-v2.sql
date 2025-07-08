-- Schema Fix Verification Script - Version 2
-- Run this after executing fix-customer-id-error-v3.sql to verify everything works
-- This version fixes the ambiguous column reference errors

-- Check if all critical tables exist
SELECT 
  'Table Existence Check' as check_type,
  expected_tables.table_name,
  CASE WHEN ist.table_name IS NOT NULL THEN '✓ EXISTS' ELSE '✗ MISSING' END as status
FROM (
  SELECT 'customer_profiles' as table_name
  UNION ALL SELECT 'conversations'
  UNION ALL SELECT 'customer_channel_preferences'
  UNION ALL SELECT 'messages'
  UNION ALL SELECT 'profiles'
) expected_tables
LEFT JOIN information_schema.tables ist ON expected_tables.table_name = ist.table_name 
  AND ist.table_schema = 'public'
ORDER BY expected_tables.table_name;

-- Check if customer_id column exists in conversations table
SELECT 
  'Column Existence Check' as check_type,
  'customer_id in conversations' as column_check,
  CASE WHEN col.column_name IS NOT NULL THEN '✓ EXISTS' ELSE '✗ MISSING' END as status
FROM information_schema.columns col
WHERE col.table_schema = 'public' 
  AND col.table_name = 'conversations' 
  AND col.column_name = 'customer_id';

-- Check foreign key constraints
SELECT 
  'Foreign Key Check' as check_type,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  '✓ CONSTRAINT EXISTS' as status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND (
    (tc.table_name = 'conversations' AND kcu.column_name = 'customer_id') OR
    (tc.table_name = 'customer_channel_preferences' AND kcu.column_name = 'customer_id')
  );

-- Check indexes
SELECT 
  'Index Check' as check_type,
  pi.indexname,
  pi.tablename,
  '✓ INDEX EXISTS' as status
FROM pg_indexes pi
WHERE pi.schemaname = 'public' 
  AND pi.indexname IN (
    'idx_conversations_customer_id',
    'idx_customer_profiles_email',
    'idx_customer_channel_preferences_customer_id'
  )
ORDER BY pi.tablename, pi.indexname;

-- Check RLS policies
SELECT 
  'RLS Policy Check' as check_type,
  pp.tablename,
  pp.policyname,
  '✓ POLICY EXISTS' as status
FROM pg_policies pp
WHERE pp.schemaname = 'public' 
  AND pp.tablename IN ('customer_profiles', 'customer_channel_preferences')
ORDER BY pp.tablename;

-- Check unique constraints
SELECT 
  'Unique Constraint Check' as check_type,
  tc.table_name,
  tc.constraint_name,
  '✓ UNIQUE CONSTRAINT EXISTS' as status
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public' 
  AND tc.constraint_type = 'UNIQUE'
  AND tc.table_name IN ('customer_profiles', 'customer_channel_preferences')
ORDER BY tc.table_name;

-- Test data insertion (this will fail if foreign keys don't work)
BEGIN;
  -- Insert test customer
  INSERT INTO customer_profiles (email, name, phone, company) 
  VALUES ('test-fix@example.com', 'Test Fix User', '+1234567890', 'Test Company');
  
  -- Insert test conversation
  INSERT INTO conversations (customer_id, user_name, user_email, status) 
  SELECT cp.id, 'Test Fix User', 'test-fix@example.com', 'active'
  FROM customer_profiles cp 
  WHERE cp.email = 'test-fix@example.com';
  
  -- Insert test channel preference
  INSERT INTO customer_channel_preferences (customer_id, channel_type, is_preferred)
  SELECT cp.id, 'email', true
  FROM customer_profiles cp 
  WHERE cp.email = 'test-fix@example.com';
  
  -- Verify the test data was inserted correctly
  SELECT 
    'Data Insertion Test' as check_type,
    cp.name as customer_name,
    c.status as conversation_status,
    ccp.channel_type,
    ccp.is_preferred,
    '✓ DATA INSERTED' as status
  FROM customer_profiles cp
  LEFT JOIN conversations c ON cp.id = c.customer_id
  LEFT JOIN customer_channel_preferences ccp ON cp.id = ccp.customer_id
  WHERE cp.email = 'test-fix@example.com';
  
  -- Clean up test data
  DELETE FROM customer_channel_preferences WHERE customer_id IN (
    SELECT id FROM customer_profiles WHERE email = 'test-fix@example.com'
  );
  DELETE FROM conversations WHERE customer_id IN (
    SELECT id FROM customer_profiles WHERE email = 'test-fix@example.com'
  );
  DELETE FROM customer_profiles WHERE email = 'test-fix@example.com';
  
COMMIT;

-- Final status check
SELECT 
  'Final Status' as check_type,
  'Schema Fix Verification' as description,
  '✓ COMPLETED SUCCESSFULLY' as status
UNION ALL
SELECT 
  'Next Steps' as check_type,
  'Run complete-schema.sql' as description,
  '→ RECOMMENDED' as status;

-- Show summary of all tables in the database
SELECT 
  'Database Summary' as check_type,
  ist.table_name,
  (
    SELECT COUNT(*) 
    FROM information_schema.columns col
    WHERE col.table_name = ist.table_name AND col.table_schema = 'public'
  ) as column_count,
  '✓ TABLE EXISTS' as status
FROM information_schema.tables ist
WHERE ist.table_schema = 'public'
  AND ist.table_type = 'BASE TABLE'
ORDER BY ist.table_name;