-- Check your actual live database schema
-- Copy and paste these queries into your Supabase SQL editor

-- 1. List ALL tables in your database
SELECT schemaname, tablename, tableowner, hasindexes, hasrules, hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 2. Check if training-related tables exist
SELECT table_name, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t.table_name) 
            THEN 'EXISTS' 
            ELSE 'MISSING' 
       END as status
FROM (VALUES 
    ('ai_training_data'),
    ('training_sessions'),
    ('training_metrics_history'),
    ('training_conversations'),
    ('training_files'),
    ('knowledge_gaps'),
    ('learning_insights'),
    ('learning_updates'),
    ('knowledge_updates'),
    ('pattern_recognition')
) AS t(table_name);

-- 3. Check if template-related tables exist
SELECT table_name, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t.table_name) 
            THEN 'EXISTS' 
            ELSE 'MISSING' 
       END as status
FROM (VALUES 
    ('templates'),
    ('template_categories'),
    ('template_variables'),
    ('response_templates'),
    ('message_templates'),
    ('ai_training_sessions'),
    ('training_samples')
) AS t(table_name);

-- 4. Check if channel-related tables exist
SELECT table_name, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t.table_name) 
            THEN 'EXISTS' 
            ELSE 'MISSING' 
       END as status
FROM (VALUES 
    ('communication_channels'),
    ('channels'),
    ('channel_configs'),
    ('whatsapp_channels'),
    ('whatsapp_message_templates'),
    ('channel_analytics')
) AS t(table_name);

-- 5. Check if core tables exist (these should definitely be there)
SELECT table_name, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t.table_name) 
            THEN 'EXISTS' 
            ELSE 'MISSING' 
       END as status
FROM (VALUES 
    ('profiles'),
    ('customer_profiles'),
    ('conversations'),
    ('messages'),
    ('agents'),
    ('user_agents'),
    ('knowledge_items'),
    ('knowledge_categories')
) AS t(table_name);

-- 6. If training tables exist, show their structure
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name IN ('ai_training_data', 'training_sessions', 'training_metrics_history')
ORDER BY table_name, ordinal_position;

-- 7. If template tables exist, show their structure  
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name IN ('templates', 'template_categories', 'response_templates')
ORDER BY table_name, ordinal_position;

-- 8. Check what migrations have been applied
SELECT * FROM schema_migrations ORDER BY applied_at DESC;

-- 9. Show table sizes and row counts
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation,
    most_common_vals,
    most_common_freqs
FROM pg_stats 
WHERE schemaname = 'public' 
  AND tablename IN ('conversations', 'messages', 'profiles', 'templates', 'ai_training_data')
ORDER BY tablename, attname;