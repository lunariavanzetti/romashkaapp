-- Check current database schema
-- Run these commands in your Supabase SQL editor or psql

-- 1. List all tables in the public schema
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Check if security tables exist
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'security_sessions'
) as security_sessions_exists,
EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'security_incidents'
) as security_incidents_exists,
EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'compliance_results'
) as compliance_results_exists;

-- 3. Check if analytics tables exist
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'daily_analytics'
) as daily_analytics_exists,
EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'conversation_analytics'
) as conversation_analytics_exists,
EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'performance_metrics'
) as performance_metrics_exists;

-- 4. Check conversations table structure (if exists)
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'conversations'
ORDER BY ordinal_position;

-- 5. Check messages table structure (if exists)
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'messages'
ORDER BY ordinal_position;

-- 6. Check profiles table structure (if exists)
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 7. Count records in key tables (if they exist)
DO $$
DECLARE
    table_name TEXT;
    sql_query TEXT;
    record_count INTEGER;
BEGIN
    FOR table_name IN 
        SELECT t.table_name 
        FROM information_schema.tables t 
        WHERE t.table_schema = 'public' 
        AND t.table_name IN ('conversations', 'messages', 'profiles', 'daily_analytics', 'security_sessions')
    LOOP
        sql_query := 'SELECT COUNT(*) FROM ' || table_name;
        EXECUTE sql_query INTO record_count;
        RAISE NOTICE 'Table %: % records', table_name, record_count;
    END LOOP;
END $$;