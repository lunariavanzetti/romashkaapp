-- Check what columns actually exist in conversation_analytics table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'conversation_analytics'
ORDER BY ordinal_position;

-- Also check if the table exists at all
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name = 'conversation_analytics';

-- Check what analytics-related tables exist
SELECT 
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name LIKE '%analytic%'
ORDER BY table_name;