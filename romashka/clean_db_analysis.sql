-- COMPLETE DATABASE ANALYSIS QUERY
-- Run this entire query to get complete database information

-- 1. ALL TABLES IN DATABASE
SELECT 
    '=== ALL TABLES ===' as info,
    table_name,
    table_type,
    is_insertable_into,
    is_typed
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. COMPLETE TABLE STRUCTURES
SELECT 
    '=== TABLE STRUCTURES ===' as info,
    t.table_name,
    c.column_name,
    c.ordinal_position,
    c.column_default,
    c.is_nullable,
    c.data_type,
    c.character_maximum_length,
    c.numeric_precision,
    c.numeric_scale,
    c.is_updatable
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public' AND c.table_schema = 'public'
ORDER BY t.table_name, c.ordinal_position;

-- 3. PRIMARY KEYS
SELECT 
    '=== PRIMARY KEYS ===' as info,
    tc.table_name,
    kcu.column_name,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public' 
    AND tc.constraint_type = 'PRIMARY KEY'
ORDER BY tc.table_name;

-- 4. FOREIGN KEYS
SELECT 
    '=== FOREIGN KEYS ===' as info,
    tc.table_name as source_table,
    kcu.column_name as source_column,
    ccu.table_name as target_table,
    ccu.column_name as target_column,
    tc.constraint_name,
    rc.update_rule,
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
WHERE tc.table_schema = 'public' 
    AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, kcu.column_name;

-- 5. INDEXES
SELECT 
    '=== INDEXES ===' as info,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 6. UNIQUE CONSTRAINTS
SELECT 
    '=== UNIQUE CONSTRAINTS ===' as info,
    tc.table_name,
    kcu.column_name,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public' 
    AND tc.constraint_type = 'UNIQUE'
ORDER BY tc.table_name, kcu.column_name;

-- 7. CHECK CONSTRAINTS
SELECT 
    '=== CHECK CONSTRAINTS ===' as info,
    tc.table_name,
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public' 
    AND tc.constraint_type = 'CHECK'
ORDER BY tc.table_name;

-- 8. VIEWS
SELECT 
    '=== VIEWS ===' as info,
    table_name as view_name,
    view_definition
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- 9. FUNCTIONS AND PROCEDURES
SELECT 
    '=== FUNCTIONS ===' as info,
    routine_name,
    routine_type,
    data_type as return_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 10. TRIGGERS
SELECT 
    '=== TRIGGERS ===' as info,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 11. TABLE SIZES AND ROW COUNTS
SELECT 
    '=== TABLE SIZES ===' as info,
    schemaname,
    tablename,
    attname as column_name,
    n_distinct,
    avg_width,
    correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY tablename, attname;

-- 12. ROW COUNTS FOR EACH TABLE
SELECT 
    '=== ROW COUNTS ===' as info,
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 13. SEQUENCE INFORMATION
SELECT 
    '=== SEQUENCES ===' as info,
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

-- 14. ENUM TYPES
SELECT 
    '=== ENUM TYPES ===' as info,
    t.typname as enum_name,
    e.enumlabel as enum_value,
    e.enumsortorder
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY t.typname, e.enumsortorder;

-- 15. SPECIFIC MESSAGING TABLES ANALYSIS
SELECT 
    '=== MESSAGING TABLES CHECK ===' as info,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations' AND table_schema = 'public') 
        THEN 'conversations - EXISTS'
        ELSE 'conversations - MISSING'
    END as conversations_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages' AND table_schema = 'public') 
        THEN 'messages - EXISTS'
        ELSE 'messages - MISSING'
    END as messages_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_profiles' AND table_schema = 'public') 
        THEN 'customer_profiles - EXISTS'
        ELSE 'customer_profiles - MISSING'
    END as customer_profiles_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') 
        THEN 'profiles - EXISTS'
        ELSE 'profiles - MISSING'
    END as profiles_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'realtime_metrics' AND table_schema = 'public') 
        THEN 'realtime_metrics - EXISTS'
        ELSE 'realtime_metrics - MISSING'
    END as realtime_metrics_status;

-- 16. RLS POLICIES (if any)
SELECT 
    '=== RLS POLICIES ===' as info,
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

-- 17. TABLE PERMISSIONS
SELECT 
    '=== TABLE PERMISSIONS ===' as info,
    table_name,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges
WHERE table_schema = 'public'
ORDER BY table_name, grantee;