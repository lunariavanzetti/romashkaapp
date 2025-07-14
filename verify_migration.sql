-- ROMASHKA Migration Verification Script
-- Run this to verify all tables were created successfully

-- ================================
-- 1. CHECK ALL TABLES WERE CREATED
-- ================================

SELECT '=== ALL TABLES IN ROMASHKA SCHEMA ===' as info;
SELECT 
    table_name,
    'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ================================
-- 2. CHECK KEY TABLES
-- ================================

SELECT '=== KEY TABLES CHECK ===' as info;
SELECT 
    table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t.table_name)
         THEN '✅ EXISTS'
         ELSE '❌ MISSING'
    END as status
FROM (VALUES 
    ('profiles'),
    ('customer_profiles'),
    ('conversations'),
    ('messages'),
    ('knowledge_items'),
    ('knowledge_categories'),
    ('canned_responses'),
    ('communication_channels'),
    ('agent_availability'),
    ('daily_metrics'),
    ('conversation_analytics'),
    ('system_settings'),
    ('audit_logs'),
    ('prompt_history')
) AS t(table_name);

-- ================================
-- 3. CHECK MIGRATION RECORD
-- ================================

SELECT '=== MIGRATION RECORD ===' as info;
SELECT 
    version,
    description,
    applied_at
FROM schema_migrations
WHERE version = '001_complete_romashka_migration';

-- ================================
-- 4. CHECK PROMPT_HISTORY INTEGRATION
-- ================================

SELECT '=== PROMPT_HISTORY INTEGRATION ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'prompt_history'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ================================
-- 5. CHECK FOREIGN KEYS
-- ================================

SELECT '=== FOREIGN KEY RELATIONSHIPS ===' as info;
SELECT
    tc.table_name, 
    kcu.column_name,
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
-- 6. CHECK RLS POLICIES
-- ================================

SELECT '=== ROW LEVEL SECURITY POLICIES ===' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ================================
-- 7. SUMMARY STATISTICS
-- ================================

SELECT '=== MIGRATION SUMMARY ===' as info;
SELECT 
    'Total tables created' as metric,
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
    'Total RLS policies' as metric,
    COUNT(*) as value
FROM pg_policies 
WHERE schemaname = 'public'

UNION ALL

SELECT 
    'Total indexes' as metric,
    COUNT(*) as value
FROM pg_indexes 
WHERE schemaname = 'public'; 