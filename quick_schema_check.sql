-- Quick Schema Check for ROMASHKA
-- Run this first to get a quick overview of your current schema

-- 1. Check Auth System
SELECT '=== AUTH SYSTEM CHECK ===' as info;
SELECT 
    'auth.users exists' as check_type,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') 
         THEN 'YES - Supabase Auth is active' 
         ELSE 'NO - Missing Supabase Auth' 
    END as result;

SELECT 
    'custom users table exists' as check_type,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')
         THEN 'YES - You have custom users table (CONFLICT!)'
         ELSE 'NO - No custom users table (GOOD!)'
    END as result;

-- 2. List All Your Tables
SELECT '=== ALL TABLES IN YOUR DATABASE ===' as info;
SELECT 
    table_schema,
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 3. Check Key Tables
SELECT '=== KEY TABLES CHECK ===' as info;
SELECT 
    table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t.table_name)
         THEN 'EXISTS'
         ELSE 'MISSING'
    END as status
FROM (VALUES 
    ('profiles'),
    ('conversations'),
    ('messages'),
    ('customer_profiles'),
    ('agent_availability'),
    ('communication_channels'),
    ('knowledge_items'),
    ('canned_responses')
) AS t(table_name);

-- 4. Check Foreign Keys to auth.users
SELECT '=== FOREIGN KEYS TO AUTH.USERS ===' as info;
SELECT
    tc.table_name, 
    kcu.column_name,
    'References auth.users' as reference
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND ccu.table_schema = 'auth'
  AND ccu.table_name = 'users'
ORDER BY tc.table_name, kcu.column_name;

-- 5. Check Foreign Keys to custom users (PROBLEM!)
SELECT '=== FOREIGN KEYS TO CUSTOM USERS (PROBLEM!) ===' as info;
SELECT
    tc.table_name, 
    kcu.column_name,
    'References custom users table' as reference
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND ccu.table_schema = 'public'
  AND ccu.table_name = 'users'
ORDER BY tc.table_name, kcu.column_name; 