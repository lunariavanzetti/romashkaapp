-- COMPLETE DATABASE SCHEMA ANALYSIS
-- Run this entire query in your Supabase SQL Editor
-- Copy and paste the ENTIRE output to share with me

-- 1. ALL TABLES WITH BASIC INFO
SELECT 
    '=== ALL TABLES ===' as section,
    table_name,
    table_type,
    is_insertable_into,
    is_typed,
    commit_action
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. COMPLETE COLUMN DETAILS FOR ALL TABLES
SELECT 
    '=== COLUMN DETAILS ===' as section,
    table_name,
    column_name,
    ordinal_position,
    column_default,
    is_nullable,
    data_type,
    character_maximum_length,
    numeric_precision,
    numeric_scale,
    datetime_precision,
    is_identity,
    identity_generation
FROM information_schema.columns 
WHERE table_schema = 'public' 
ORDER BY table_name, ordinal_position;

-- 3. PRIMARY KEYS AND UNIQUE CONSTRAINTS
SELECT 
    '=== PRIMARY KEYS ===' as section,
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    kcu.ordinal_position
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
    AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
ORDER BY tc.table_name, kcu.ordinal_position;

-- 4. FOREIGN KEY RELATIONSHIPS
SELECT 
    '=== FOREIGN KEYS ===' as section,
    tc.table_name as source_table,
    kcu.column_name as source_column,
    ccu.table_name as target_table,
    ccu.column_name as target_column,
    tc.constraint_name,
    rc.update_rule,
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc 
    ON tc.constraint_name = rc.constraint_name
WHERE tc.table_schema = 'public' 
    AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, kcu.column_name;

-- 5. INDEXES
SELECT 
    '=== INDEXES ===' as section,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 6. CHECK CONSTRAINTS
SELECT 
    '=== CHECK CONSTRAINTS ===' as section,
    tc.table_name,
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public' 
    AND tc.constraint_type = 'CHECK'
ORDER BY tc.table_name;

-- 7. VIEWS
SELECT 
    '=== VIEWS ===' as section,
    table_name as view_name,
    view_definition
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 8. FUNCTIONS AND PROCEDURES
SELECT 
    '=== FUNCTIONS ===' as section,
    routine_name,
    routine_type,
    data_type as return_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 9. TRIGGERS
SELECT 
    '=== TRIGGERS ===' as section,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing,
    action_orientation
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 10. ROW LEVEL SECURITY POLICIES
SELECT 
    '=== RLS POLICIES ===' as section,
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

-- 11. TABLE STATISTICS AND ROW COUNTS
SELECT 
    '=== TABLE STATS ===' as section,
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 12. EXTENSIONS
SELECT 
    '=== EXTENSIONS ===' as section,
    extname,
    extversion,
    extrelocatable,
    extnamespace::regnamespace as schema
FROM pg_extension
ORDER BY extname;

-- 13. ENUM TYPES
SELECT 
    '=== ENUM TYPES ===' as section,
    t.typname as enum_name,
    e.enumlabel as enum_value,
    e.enumsortorder
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
ORDER BY t.typname, e.enumsortorder;

-- 14. STORAGE BUCKETS (SUPABASE SPECIFIC)
SELECT 
    '=== STORAGE BUCKETS ===' as section,
    id,
    name,
    owner,
    created_at,
    updated_at,
    public,
    avif_autodetection,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets
ORDER BY name;

-- 15. SCHEMA MIGRATIONS (IF EXISTS)
SELECT 
    '=== MIGRATIONS ===' as section,
    version,
    description,
    applied_at
FROM schema_migrations 
ORDER BY applied_at DESC
LIMIT 20;

-- 16. SEQUENCES
SELECT 
    '=== SEQUENCES ===' as section,
    sequence_name,
    data_type,
    start_value,
    minimum_value,
    maximum_value,
    increment,
    cycle_option
FROM information_schema.sequences 
WHERE sequence_schema = 'public'
ORDER BY sequence_name;

-- 17. DOMAIN TYPES
SELECT 
    '=== DOMAIN TYPES ===' as section,
    domain_name,
    data_type,
    character_maximum_length,
    domain_default,
    is_nullable
FROM information_schema.domains 
WHERE domain_schema = 'public'
ORDER BY domain_name;

-- 18. TABLE SIZES
SELECT 
    '=== TABLE SIZES ===' as section,
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- END OF ANALYSIS
SELECT '=== ANALYSIS COMPLETE ===' as section, NOW() as timestamp;