-- ROMASHKA Schema Diagnostic Script
-- Run this in your Supabase SQL Editor to understand your current schema

-- 1. Check if you have auth.users (Supabase managed)
SELECT 'auth.users exists' as check_type, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') 
            THEN 'YES - You have Supabase auth' 
            ELSE 'NO - Missing Supabase auth' 
       END as result;

-- 2. Check if you have custom users table
SELECT 'custom users table exists' as check_type,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')
            THEN 'YES - You have custom users table (PROBLEM!)'
            ELSE 'NO - No custom users table (GOOD!)'
       END as result;

-- 3. Check if you have profiles table
SELECT 'profiles table exists' as check_type,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
            THEN 'YES - You have profiles table'
            ELSE 'NO - No profiles table'
       END as result;

-- 4. List all your current tables
SELECT 'Current tables' as check_type, 
       array_agg(table_name ORDER BY table_name) as result
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

-- 5. Check foreign key dependencies
SELECT 'Foreign keys to users' as check_type,
       CASE WHEN COUNT(*) > 0 
            THEN 'Found ' || COUNT(*) || ' foreign keys to users table'
            ELSE 'No foreign keys to users table'
       END as result
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'users';

-- 6. Check foreign keys to auth.users
SELECT 'Foreign keys to auth.users' as check_type,
       CASE WHEN COUNT(*) > 0 
            THEN 'Found ' || COUNT(*) || ' foreign keys to auth.users'
            ELSE 'No foreign keys to auth.users'
       END as result
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_schema = 'auth'
  AND ccu.table_name = 'users';