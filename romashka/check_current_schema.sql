-- Check current database schema
-- Run this in your Supabase SQL editor to see current schema

-- List all tables
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check tables related to training
SELECT table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name LIKE '%training%' 
ORDER BY table_name, ordinal_position;

-- Check tables related to templates
SELECT table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name LIKE '%template%' 
ORDER BY table_name, ordinal_position;

-- Check tables related to channels
SELECT table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name LIKE '%channel%' 
ORDER BY table_name, ordinal_position;

-- Check tables related to agents
SELECT table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name LIKE '%agent%' 
ORDER BY table_name, ordinal_position;

-- Check all table structures (key tables)
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
  AND t.table_name IN (
    'training_sessions',
    'training_conversations', 
    'training_files',
    'response_templates',
    'template_variables',
    'channels',
    'channel_configs',
    'agents',
    'user_agents',
    'conversations',
    'messages'
  )
ORDER BY t.table_name, c.ordinal_position;