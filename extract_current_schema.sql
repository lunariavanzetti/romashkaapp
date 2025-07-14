-- ROMASHKA Complete Schema Extraction Script
-- Run this in your Supabase SQL Editor to get your complete current schema
-- This will show you exactly what's in your live database

-- ================================
-- 1. CHECK AUTH SYSTEM
-- ================================

-- Check if Supabase Auth is properly set up
SELECT 'AUTH SYSTEM CHECK' as section;
SELECT 
    'auth.users exists' as check_type,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') 
         THEN 'YES - Supabase Auth is active' 
         ELSE 'NO - Missing Supabase Auth' 
    END as result;

-- Check if you have custom users table (this would be a problem)
SELECT 
    'custom users table exists' as check_type,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')
         THEN 'YES - You have custom users table (CONFLICT!)'
         ELSE 'NO - No custom users table (GOOD!)'
    END as result;

-- ================================
-- 2. LIST ALL TABLES IN YOUR DATABASE
-- ================================

SELECT 'ALL TABLES IN DATABASE' as section;
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema IN ('public', 'auth')
  AND table_type = 'BASE TABLE'
ORDER BY table_schema, table_name;

-- ================================
-- 3. DETAILED TABLE STRUCTURE
-- ================================

SELECT 'TABLE STRUCTURE DETAILS' as section;
SELECT 
    t.table_schema,
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default,
    c.character_maximum_length,
    c.numeric_precision,
    c.numeric_scale
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;

-- ================================
-- 4. FOREIGN KEY RELATIONSHIPS
-- ================================

SELECT 'FOREIGN KEY RELATIONSHIPS' as section;
SELECT
    tc.table_schema, 
    tc.table_name, 
    kcu.column_name,
    tc.constraint_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ================================
-- 5. INDEXES
-- ================================

SELECT 'INDEXES' as section;
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ================================
-- 6. FUNCTIONS AND TRIGGERS
-- ================================

SELECT 'FUNCTIONS' as section;
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;

SELECT 'TRIGGERS' as section;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ================================
-- 7. POLICIES (RLS)
-- ================================

SELECT 'ROW LEVEL SECURITY POLICIES' as section;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ================================
-- 8. EXTENSIONS
-- ================================

SELECT 'EXTENSIONS' as section;
SELECT 
    extname as extension_name,
    extversion as version
FROM pg_extension
ORDER BY extname;

-- ================================
-- 9. SUMMARY STATISTICS
-- ================================

SELECT 'SCHEMA SUMMARY' as section;
SELECT 
    'Total tables' as metric,
    COUNT(*) as value
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'

UNION ALL

SELECT 
    'Total columns' as metric,
    COUNT(*) as value
FROM information_schema.columns 
WHERE table_schema = 'public'

UNION ALL

SELECT 
    'Total foreign keys' as metric,
    COUNT(*) as value
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' 
  AND table_schema = 'public'

UNION ALL

SELECT 
    'Total indexes' as metric,
    COUNT(*) as value
FROM pg_indexes 
WHERE schemaname = 'public'

UNION ALL

SELECT 
    'Total functions' as metric,
    COUNT(*) as value
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'

UNION ALL

SELECT 
    'Total triggers' as metric,
    COUNT(*) as value
FROM information_schema.triggers 
WHERE trigger_schema = 'public'

UNION ALL

SELECT 
    'Total RLS policies' as metric,
    COUNT(*) as value
FROM pg_policies 
WHERE schemaname = 'public'; 