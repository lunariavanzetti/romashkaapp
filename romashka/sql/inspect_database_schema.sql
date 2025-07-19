-- Comprehensive Database Schema Inspection Queries
-- Run each section and paste results to understand your complete database structure

-- ==========================================
-- 1. LIST ALL TABLES IN DATABASE
-- ==========================================
SELECT 
    schemaname,
    tablename,
    tableowner,
    tablespace,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname IN ('public', 'auth', 'storage')
ORDER BY schemaname, tablename;

-- ==========================================
-- 2. TABLE STRUCTURE FOR EACH KEY TABLE
-- ==========================================

-- Check response_templates structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'response_templates' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check personality_configs structure  
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'personality_configs' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check system_settings structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'system_settings' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check ab_tests structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'ab_tests' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check ab_test_results structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'ab_test_results' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check website_scans structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'website_scans' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ==========================================
-- 3. CHECK AUTH SCHEMA (if exists)
-- ==========================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'auth'
ORDER BY ordinal_position;

-- ==========================================
-- 4. FOREIGN KEY CONSTRAINTS
-- ==========================================
SELECT
    tc.table_schema, 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public';

-- ==========================================
-- 5. INDEXES ON TABLES
-- ==========================================
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ==========================================
-- 6. ROW LEVEL SECURITY POLICIES
-- ==========================================
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

-- ==========================================
-- 7. SAMPLE DATA FROM KEY TABLES
-- ==========================================

-- Count records in each table
SELECT 'response_templates' as table_name, COUNT(*) as record_count FROM response_templates
UNION ALL
SELECT 'personality_configs', COUNT(*) FROM personality_configs  
UNION ALL
SELECT 'system_settings', COUNT(*) FROM system_settings
UNION ALL
SELECT 'ab_tests', COUNT(*) FROM ab_tests
UNION ALL
SELECT 'ab_test_results', COUNT(*) FROM ab_test_results
UNION ALL
SELECT 'website_scans', COUNT(*) FROM website_scans;

-- Sample ab_tests data
SELECT 
    id,
    user_id,
    name,
    status,
    created_at
FROM ab_tests 
LIMIT 3;

-- Sample personality configs
SELECT 
    id,
    user_id,
    name,
    tone,
    style,
    created_at
FROM personality_configs
LIMIT 3;

-- ==========================================
-- 8. TRIGGERS AND FUNCTIONS
-- ==========================================
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- List custom functions
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- ==========================================
-- 9. EXTENSIONS AND CAPABILITIES
-- ==========================================
SELECT 
    extname,
    extversion,
    extrelocatable
FROM pg_extension
ORDER BY extname;

-- ==========================================
-- 10. CURRENT DATABASE CONNECTION INFO
-- ==========================================
SELECT 
    current_database() as database_name,
    current_user as current_user,
    session_user as session_user,
    current_setting('server_version') as postgres_version;