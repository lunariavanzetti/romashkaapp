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


ANSWERS 
1. "[
  {
    "section": "=== ALL TABLES ===",
    "table_name": "agent_availability",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "agent_performance_metrics",
    "table_type": "VIEW",
    "is_insertable_into": "NO",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "agent_work_logs",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "alert_history",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "alert_rules",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "audit_logs",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "auto_generated_knowledge",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "canned_responses",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "channel_routing_rules",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "chat_sessions",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "communication_channels",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "content_processing_queue",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "conversation_analytics",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "conversation_context",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "conversation_notes",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "conversation_transfers",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "conversations",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "customer_channel_preferences",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "customer_profiles",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "daily_metrics",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "dashboard_configs",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "embeddings",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "export_jobs",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "extracted_content",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "file_attachments",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "integration_field_mappings",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "integrations",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "intent_patterns",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "knowledge_analytics",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "knowledge_base",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "knowledge_categories",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "knowledge_items",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "knowledge_versions",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "message_delivery_tracking",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "message_templates",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "messages",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "onboarding_responses",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "playground_sessions",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "profiles",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "realtime_metrics",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "scan_job_logs",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "scheduled_reports",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "sla_tracking",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "sync_jobs",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "system_settings",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "user_agents",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "webhook_events",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "webhook_logs",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "webhook_subscriptions",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "website_scan_jobs",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "widget_configurations",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "workflow_executions",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "workflows",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  }
]" 
2. "[
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_availability",
    "column_name": "id",
    "ordinal_position": 1,
    "column_default": "gen_random_uuid()",
    "is_nullable": "NO",
    "data_type": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_availability",
    "column_name": "agent_id",
    "ordinal_position": 2,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_availability",
    "column_name": "is_online",
    "ordinal_position": 3,
    "column_default": "false",
    "is_nullable": "YES",
    "data_type": "boolean",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_availability",
    "column_name": "status",
    "ordinal_position": 4,
    "column_default": "'available'::character varying",
    "is_nullable": "YES",
    "data_type": "character varying",
    "character_maximum_length": 50,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_availability",
    "column_name": "max_concurrent_chats",
    "ordinal_position": 5,
    "column_default": "5",
    "is_nullable": "YES",
    "data_type": "integer",
    "character_maximum_length": null,
    "numeric_precision": 32,
    "numeric_scale": 0,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_availability",
    "column_name": "current_chat_count",
    "ordinal_position": 6,
    "column_default": "0",
    "is_nullable": "YES",
    "data_type": "integer",
    "character_maximum_length": null,
    "numeric_precision": 32,
    "numeric_scale": 0,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_availability",
    "column_name": "last_activity",
    "ordinal_position": 7,
    "column_default": "now()",
    "is_nullable": "YES",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": 6,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_availability",
    "column_name": "auto_away_time",
    "ordinal_position": 8,
    "column_default": "300",
    "is_nullable": "YES",
    "data_type": "integer",
    "character_maximum_length": null,
    "numeric_precision": 32,
    "numeric_scale": 0,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_availability",
    "column_name": "created_at",
    "ordinal_position": 9,
    "column_default": "now()",
    "is_nullable": "YES",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": 6,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_availability",
    "column_name": "updated_at",
    "ordinal_position": 10,
    "column_default": "now()",
    "is_nullable": "YES",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": 6,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_availability",
    "column_name": "working_hours",
    "ordinal_position": 11,
    "column_default": "'{\"friday\": {\"end\": \"17:00\", \"start\": \"09:00\"}, \"monday\": {\"end\": \"17:00\", \"start\": \"09:00\"}, \"tuesday\": {\"end\": \"17:00\", \"start\": \"09:00\"}, \"thursday\": {\"end\": \"17:00\", \"start\": \"09:00\"}, \"wednesday\": {\"end\": \"17:00\", \"start\": \"09:00\"}}'::jsonb",
    "is_nullable": "YES",
    "data_type": "jsonb",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_performance_metrics",
    "column_name": "user_id",
    "ordinal_position": 1,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_performance_metrics",
    "column_name": "agent_id",
    "ordinal_position": 2,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "character varying",
    "character_maximum_length": 255,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_performance_metrics",
    "column_name": "agent_name",
    "ordinal_position": 3,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "character varying",
    "character_maximum_length": 255,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_performance_metrics",
    "column_name": "total_tasks",
    "ordinal_position": 4,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "bigint",
    "character_maximum_length": null,
    "numeric_precision": 64,
    "numeric_scale": 0,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_performance_metrics",
    "column_name": "completed_tasks",
    "ordinal_position": 5,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "bigint",
    "character_maximum_length": null,
    "numeric_precision": 64,
    "numeric_scale": 0,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_performance_metrics",
    "column_name": "failed_tasks",
    "ordinal_position": 6,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "bigint",
    "character_maximum_length": null,
    "numeric_precision": 64,
    "numeric_scale": 0,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_performance_metrics",
    "column_name": "in_progress_tasks",
    "ordinal_position": 7,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "bigint",
    "character_maximum_length": null,
    "numeric_precision": 64,
    "numeric_scale": 0,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_performance_metrics",
    "column_name": "avg_execution_time_ms",
    "ordinal_position": 8,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "numeric",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_performance_metrics",
    "column_name": "min_execution_time_ms",
    "ordinal_position": 9,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "integer",
    "character_maximum_length": null,
    "numeric_precision": 32,
    "numeric_scale": 0,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_performance_metrics",
    "column_name": "max_execution_time_ms",
    "ordinal_position": 10,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "integer",
    "character_maximum_length": null,
    "numeric_precision": 32,
    "numeric_scale": 0,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_performance_metrics",
    "column_name": "success_rate",
    "ordinal_position": 11,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "double precision",
    "character_maximum_length": null,
    "numeric_precision": 53,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_performance_metrics",
    "column_name": "failure_rate",
    "ordinal_position": 12,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "double precision",
    "character_maximum_length": null,
    "numeric_precision": 53,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_performance_metrics",
    "column_name": "last_activity",
    "ordinal_position": 13,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": 6,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_performance_metrics",
    "column_name": "task_types_handled",
    "ordinal_position": 14,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "bigint",
    "character_maximum_length": null,
    "numeric_precision": 64,
    "numeric_scale": 0,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_performance_metrics",
    "column_name": "last_task_date",
    "ordinal_position": 15,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": 6,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_work_logs",
    "column_name": "id",
    "ordinal_position": 1,
    "column_default": "gen_random_uuid()",
    "is_nullable": "NO",
    "data_type": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_work_logs",
    "column_name": "agent_id",
    "ordinal_position": 2,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "character varying",
    "character_maximum_length": 255,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_work_logs",
    "column_name": "agent_name",
    "ordinal_position": 3,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "character varying",
    "character_maximum_length": 255,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_work_logs",
    "column_name": "user_id",
    "ordinal_position": 4,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_work_logs",
    "column_name": "task_type",
    "ordinal_position": 5,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "character varying",
    "character_maximum_length": 50,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_work_logs",
    "column_name": "task_description",
    "ordinal_position": 6,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_work_logs",
    "column_name": "input_data",
    "ordinal_position": 7,
    "column_default": "'{}'::jsonb",
    "is_nullable": "YES",
    "data_type": "jsonb",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_work_logs",
    "column_name": "output_data",
    "ordinal_position": 8,
    "column_default": "'{}'::jsonb",
    "is_nullable": "YES",
    "data_type": "jsonb",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_work_logs",
    "column_name": "status",
    "ordinal_position": 9,
    "column_default": "'pending'::character varying",
    "is_nullable": "NO",
    "data_type": "character varying",
    "character_maximum_length": 20,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_work_logs",
    "column_name": "started_at",
    "ordinal_position": 10,
    "column_default": "now()",
    "is_nullable": "NO",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": 6,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_work_logs",
    "column_name": "completed_at",
    "ordinal_position": 11,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": 6,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_work_logs",
    "column_name": "execution_time_ms",
    "ordinal_position": 12,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "integer",
    "character_maximum_length": null,
    "numeric_precision": 32,
    "numeric_scale": 0,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_work_logs",
    "column_name": "error_message",
    "ordinal_position": 13,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "text",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_work_logs",
    "column_name": "metadata",
    "ordinal_position": 14,
    "column_default": "'{}'::jsonb",
    "is_nullable": "YES",
    "data_type": "jsonb",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_work_logs",
    "column_name": "created_at",
    "ordinal_position": 15,
    "column_default": "now()",
    "is_nullable": "YES",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": 6,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_work_logs",
    "column_name": "updated_at",
    "ordinal_position": 16,
    "column_default": "now()",
    "is_nullable": "YES",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": 6,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "alert_history",
    "column_name": "id",
    "ordinal_position": 1,
    "column_default": "gen_random_uuid()",
    "is_nullable": "NO",
    "data_type": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "alert_history",
    "column_name": "rule_id",
    "ordinal_position": 2,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "alert_history",
    "column_name": "triggered_at",
    "ordinal_position": 3,
    "column_default": "now()",
    "is_nullable": "YES",
    "data_type": "timestamp without time zone",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": 6,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "alert_history",
    "column_name": "metric_value",
    "ordinal_position": 4,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "numeric",
    "character_maximum_length": null,
    "numeric_precision": 15,
    "numeric_scale": 4,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "alert_history",
    "column_name": "threshold_value",
    "ordinal_position": 5,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "numeric",
    "character_maximum_length": null,
    "numeric_precision": 15,
    "numeric_scale": 4,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "alert_history",
    "column_name": "sent_channels",
    "ordinal_position": 6,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "ARRAY",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "alert_history",
    "column_name": "sent_recipients",
    "ordinal_position": 7,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "ARRAY",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "alert_rules",
    "column_name": "id",
    "ordinal_position": 1,
    "column_default": "gen_random_uuid()",
    "is_nullable": "NO",
    "data_type": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "alert_rules",
    "column_name": "name",
    "ordinal_position": 2,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "character varying",
    "character_maximum_length": 255,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "alert_rules",
    "column_name": "metric",
    "ordinal_position": 3,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "character varying",
    "character_maximum_length": 100,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "alert_rules",
    "column_name": "condition",
    "ordinal_position": 4,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "character varying",
    "character_maximum_length": 20,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "alert_rules",
    "column_name": "threshold",
    "ordinal_position": 5,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "numeric",
    "character_maximum_length": null,
    "numeric_precision": 15,
    "numeric_scale": 4,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "alert_rules",
    "column_name": "time_window_minutes",
    "ordinal_position": 6,
    "column_default": "60",
    "is_nullable": "YES",
    "data_type": "integer",
    "character_maximum_length": null,
    "numeric_precision": 32,
    "numeric_scale": 0,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "alert_rules",
    "column_name": "channels",
    "ordinal_position": 7,
    "column_default": "'{email}'::text[]",
    "is_nullable": "YES",
    "data_type": "ARRAY",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "alert_rules",
    "column_name": "recipients",
    "ordinal_position": 8,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "ARRAY",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "alert_rules",
    "column_name": "is_active",
    "ordinal_position": 9,
    "column_default": "true",
    "is_nullable": "YES",
    "data_type": "boolean",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "alert_rules",
    "column_name": "created_by",
    "ordinal_position": 10,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "alert_rules",
    "column_name": "created_at",
    "ordinal_position": 11,
    "column_default": "now()",
    "is_nullable": "YES",
    "data_type": "timestamp without time zone",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": 6,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "audit_logs",
    "column_name": "id",
    "ordinal_position": 1,
    "column_default": "gen_random_uuid()",
    "is_nullable": "NO",
    "data_type": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "audit_logs",
    "column_name": "user_id",
    "ordinal_position": 2,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "audit_logs",
    "column_name": "action",
    "ordinal_position": 3,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "character varying",
    "character_maximum_length": 100,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "audit_logs",
    "column_name": "entity_type",
    "ordinal_position": 4,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "character varying",
    "character_maximum_length": 100,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "audit_logs",
    "column_name": "entity_id",
    "ordinal_position": 5,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "audit_logs",
    "column_name": "changes",
    "ordinal_position": 6,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "jsonb",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "audit_logs",
    "column_name": "ip_address",
    "ordinal_position": 7,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "inet",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "audit_logs",
    "column_name": "user_agent",
    "ordinal_position": 8,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "text",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "audit_logs",
    "column_name": "created_at",
    "ordinal_position": 9,
    "column_default": "now()",
    "is_nullable": "YES",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": 6,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "auto_generated_knowledge",
    "column_name": "id",
    "ordinal_position": 1,
    "column_default": "gen_random_uuid()",
    "is_nullable": "NO",
    "data_type": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "auto_generated_knowledge",
    "column_name": "scan_job_id",
    "ordinal_position": 2,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "auto_generated_knowledge",
    "column_name": "extracted_content_id",
    "ordinal_position": 3,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "auto_generated_knowledge",
    "column_name": "knowledge_item_id",
    "ordinal_position": 4,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "auto_generated_knowledge",
    "column_name": "auto_category",
    "ordinal_position": 5,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "character varying",
    "character_maximum_length": 255,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "auto_generated_knowledge",
    "column_name": "confidence_score",
    "ordinal_position": 6,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "numeric",
    "character_maximum_length": null,
    "numeric_precision": 3,
    "numeric_scale": 2,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "auto_generated_knowledge",
    "column_name": "needs_review",
    "ordinal_position": 7,
    "column_default": "true",
    "is_nullable": "YES",
    "data_type": "boolean",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "auto_generated_knowledge",
    "column_name": "approved",
    "ordinal_position": 8,
    "column_default": "false",
    "is_nullable": "YES",
    "data_type": "boolean",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "auto_generated_knowledge",
    "column_name": "created_at",
    "ordinal_position": 9,
    "column_default": "now()",
    "is_nullable": "YES",
    "data_type": "timestamp without time zone",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": 6,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "canned_responses",
    "column_name": "id",
    "ordinal_position": 1,
    "column_default": "gen_random_uuid()",
    "is_nullable": "NO",
    "data_type": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "canned_responses",
    "column_name": "title",
    "ordinal_position": 2,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "character varying",
    "character_maximum_length": 255,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "canned_responses",
    "column_name": "content",
    "ordinal_position": 3,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "canned_responses",
    "column_name": "shortcut",
    "ordinal_position": 4,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "character varying",
    "character_maximum_length": 50,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "canned_responses",
    "column_name": "category",
    "ordinal_position": 5,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "character varying",
    "character_maximum_length": 100,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "canned_responses",
    "column_name": "language",
    "ordinal_position": 6,
    "column_default": "'en'::character varying",
    "is_nullable": "YES",
    "data_type": "character varying",
    "character_maximum_length": 10,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "canned_responses",
    "column_name": "usage_count",
    "ordinal_position": 7,
    "column_default": "0",
    "is_nullable": "YES",
    "data_type": "integer",
    "character_maximum_length": null,
    "numeric_precision": 32,
    "numeric_scale": 0,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "canned_responses",
    "column_name": "created_by",
    "ordinal_position": 8,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "canned_responses",
    "column_name": "is_public",
    "ordinal_position": 9,
    "column_default": "true",
    "is_nullable": "YES",
    "data_type": "boolean",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "canned_responses",
    "column_name": "created_at",
    "ordinal_position": 10,
    "column_default": "now()",
    "is_nullable": "YES",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": 6,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "canned_responses",
    "column_name": "is_active",
    "ordinal_position": 11,
    "column_default": "true",
    "is_nullable": "YES",
    "data_type": "boolean",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "canned_responses",
    "column_name": "tags",
    "ordinal_position": 12,
    "column_default": "'{}'::text[]",
    "is_nullable": "YES",
    "data_type": "ARRAY",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "canned_responses",
    "column_name": "updated_at",
    "ordinal_position": 13,
    "column_default": "now()",
    "is_nullable": "YES",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": 6,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "channel_routing_rules",
    "column_name": "id",
    "ordinal_position": 1,
    "column_default": "gen_random_uuid()",
    "is_nullable": "NO",
    "data_type": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "channel_routing_rules",
    "column_name": "name",
    "ordinal_position": 2,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "character varying",
    "character_maximum_length": 255,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "channel_routing_rules",
    "column_name": "priority",
    "ordinal_position": 3,
    "column_default": "0",
    "is_nullable": "YES",
    "data_type": "integer",
    "character_maximum_length": null,
    "numeric_precision": 32,
    "numeric_scale": 0,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "channel_routing_rules",
    "column_name": "conditions",
    "ordinal_position": 4,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "jsonb",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "channel_routing_rules",
    "column_name": "target_channel_type",
    "ordinal_position": 5,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "character varying",
    "character_maximum_length": 50,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "channel_routing_rules",
    "column_name": "fallback_channel_type",
    "ordinal_position": 6,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "character varying",
    "character_maximum_length": 50,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "channel_routing_rules",
    "column_name": "is_active",
    "ordinal_position": 7,
    "column_default": "true",
    "is_nullable": "YES",
    "data_type": "boolean",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "channel_routing_rules",
    "column_name": "created_at",
    "ordinal_position": 8,
    "column_default": "now()",
    "is_nullable": "YES",
    "data_type": "timestamp without time zone",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": 6,
    "is_identity": "NO",
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "chat_sessions",
    "column_name": "id",
    "ordinal_position": 1,
    "column_default": "gen_random_uuid()",
    "is_nullable": "NO",
    "data_type": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": "NO",
    "identity_generation": null
  }
]" 
3. "[
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "agent_availability",
    "constraint_name": "agent_availability_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "agent_work_logs",
    "constraint_name": "agent_work_logs_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "alert_history",
    "constraint_name": "alert_history_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "alert_rules",
    "constraint_name": "alert_rules_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "audit_logs",
    "constraint_name": "audit_logs_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "auto_generated_knowledge",
    "constraint_name": "auto_generated_knowledge_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "canned_responses",
    "constraint_name": "canned_responses_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "channel_routing_rules",
    "constraint_name": "channel_routing_rules_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "chat_sessions",
    "constraint_name": "chat_sessions_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "communication_channels",
    "constraint_name": "communication_channels_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "content_processing_queue",
    "constraint_name": "content_processing_queue_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "conversation_analytics",
    "constraint_name": "conversation_analytics_conversation_id_key",
    "constraint_type": "UNIQUE",
    "column_name": "conversation_id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "conversation_analytics",
    "constraint_name": "conversation_analytics_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "conversation_context",
    "constraint_name": "conversation_context_conversation_id_key",
    "constraint_type": "UNIQUE",
    "column_name": "conversation_id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "conversation_context",
    "constraint_name": "conversation_context_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "conversation_notes",
    "constraint_name": "conversation_notes_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "conversation_transfers",
    "constraint_name": "conversation_transfers_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "conversations",
    "constraint_name": "conversations_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "customer_channel_preferences",
    "constraint_name": "customer_channel_preferences_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "customer_channel_preferences",
    "constraint_name": "customer_channel_preferences_customer_id_channel_type_key",
    "constraint_type": "UNIQUE",
    "column_name": "customer_id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "customer_channel_preferences",
    "constraint_name": "customer_channel_preferences_customer_id_channel_type_key",
    "constraint_type": "UNIQUE",
    "column_name": "channel_type",
    "ordinal_position": 2
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "customer_profiles",
    "constraint_name": "customer_profiles_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "customer_profiles",
    "constraint_name": "customer_profiles_email_key",
    "constraint_type": "UNIQUE",
    "column_name": "email",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "daily_metrics",
    "constraint_name": "daily_metrics_date_channel_type_department_agent_id_key",
    "constraint_type": "UNIQUE",
    "column_name": "date",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "daily_metrics",
    "constraint_name": "daily_metrics_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "daily_metrics",
    "constraint_name": "daily_metrics_date_channel_type_department_agent_id_key",
    "constraint_type": "UNIQUE",
    "column_name": "channel_type",
    "ordinal_position": 2
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "daily_metrics",
    "constraint_name": "daily_metrics_date_channel_type_department_agent_id_key",
    "constraint_type": "UNIQUE",
    "column_name": "department",
    "ordinal_position": 3
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "daily_metrics",
    "constraint_name": "daily_metrics_date_channel_type_department_agent_id_key",
    "constraint_type": "UNIQUE",
    "column_name": "agent_id",
    "ordinal_position": 4
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "dashboard_configs",
    "constraint_name": "dashboard_configs_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "embeddings",
    "constraint_name": "embeddings_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "export_jobs",
    "constraint_name": "export_jobs_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "extracted_content",
    "constraint_name": "extracted_content_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "file_attachments",
    "constraint_name": "file_attachments_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "integration_field_mappings",
    "constraint_name": "integration_field_mappings_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "integrations",
    "constraint_name": "integrations_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "intent_patterns",
    "constraint_name": "intent_patterns_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "knowledge_analytics",
    "constraint_name": "knowledge_analytics_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "knowledge_base",
    "constraint_name": "knowledge_base_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "knowledge_categories",
    "constraint_name": "knowledge_categories_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "knowledge_items",
    "constraint_name": "knowledge_items_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "knowledge_versions",
    "constraint_name": "knowledge_versions_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "message_delivery_tracking",
    "constraint_name": "message_delivery_tracking_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "message_templates",
    "constraint_name": "message_templates_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "messages",
    "constraint_name": "messages_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "messages",
    "constraint_name": "messages_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "messages",
    "constraint_name": "messages_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "inserted_at",
    "ordinal_position": 2
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "onboarding_responses",
    "constraint_name": "onboarding_responses_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "playground_sessions",
    "constraint_name": "playground_sessions_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "profiles",
    "constraint_name": "profiles_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "realtime_metrics",
    "constraint_name": "realtime_metrics_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "scan_job_logs",
    "constraint_name": "scan_job_logs_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "scheduled_reports",
    "constraint_name": "scheduled_reports_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "sla_tracking",
    "constraint_name": "sla_tracking_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "sync_jobs",
    "constraint_name": "sync_jobs_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "system_settings",
    "constraint_name": "system_settings_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "system_settings",
    "constraint_name": "system_settings_setting_key_key",
    "constraint_type": "UNIQUE",
    "column_name": "setting_key",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "user_agents",
    "constraint_name": "user_agents_agent_id_key",
    "constraint_type": "UNIQUE",
    "column_name": "agent_id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "user_agents",
    "constraint_name": "user_agents_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "webhook_events",
    "constraint_name": "webhook_events_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "webhook_logs",
    "constraint_name": "webhook_logs_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "webhook_subscriptions",
    "constraint_name": "webhook_subscriptions_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "website_scan_jobs",
    "constraint_name": "website_scan_jobs_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "widget_configurations",
    "constraint_name": "widget_configurations_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "workflow_executions",
    "constraint_name": "workflow_executions_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "workflows",
    "constraint_name": "workflows_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  }
]" 
4. "[
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "agent_availability",
    "source_column": "agent_id",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "agent_availability_agent_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "NO ACTION"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "agent_work_logs",
    "source_column": "user_id",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "agent_work_logs_user_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "alert_history",
    "source_column": "rule_id",
    "target_table": "alert_rules",
    "target_column": "id",
    "constraint_name": "alert_history_rule_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "NO ACTION"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "alert_rules",
    "source_column": "created_by",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "alert_rules_created_by_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "NO ACTION"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "audit_logs",
    "source_column": "user_id",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "audit_logs_user_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "NO ACTION"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "auto_generated_knowledge",
    "source_column": "extracted_content_id",
    "target_table": "extracted_content",
    "target_column": "id",
    "constraint_name": "auto_generated_knowledge_extracted_content_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "auto_generated_knowledge",
    "source_column": "scan_job_id",
    "target_table": "website_scan_jobs",
    "target_column": "id",
    "constraint_name": "auto_generated_knowledge_scan_job_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "canned_responses",
    "source_column": "created_by",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "canned_responses_created_by_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "NO ACTION"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "communication_channels",
    "source_column": "created_by",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "communication_channels_created_by_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "NO ACTION"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "content_processing_queue",
    "source_column": "extracted_content_id",
    "target_table": "extracted_content",
    "target_column": "id",
    "constraint_name": "content_processing_queue_extracted_content_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "conversation_notes",
    "source_column": "agent_id",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "conversation_notes_agent_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "conversation_notes",
    "source_column": "conversation_id",
    "target_table": "conversations",
    "target_column": "id",
    "constraint_name": "conversation_notes_conversation_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "conversation_transfers",
    "source_column": "from_agent_id",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "conversation_transfers_from_agent_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "NO ACTION"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "conversation_transfers",
    "source_column": "to_agent_id",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "conversation_transfers_to_agent_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "NO ACTION"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "conversations",
    "source_column": "customer_id",
    "target_table": "customer_profiles",
    "target_column": "id",
    "constraint_name": "conversations_customer_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "customer_channel_preferences",
    "source_column": "customer_id",
    "target_table": "customer_profiles",
    "target_column": "id",
    "constraint_name": "customer_channel_preferences_customer_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "daily_metrics",
    "source_column": "agent_id",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "daily_metrics_agent_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "NO ACTION"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "dashboard_configs",
    "source_column": "user_id",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "dashboard_configs_user_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "NO ACTION"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "export_jobs",
    "source_column": "user_id",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "export_jobs_user_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "NO ACTION"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "extracted_content",
    "source_column": "scan_job_id",
    "target_table": "website_scan_jobs",
    "target_column": "id",
    "constraint_name": "extracted_content_scan_job_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "file_attachments",
    "source_column": "conversation_id",
    "target_table": "conversations",
    "target_column": "id",
    "constraint_name": "file_attachments_conversation_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "file_attachments",
    "source_column": "message_id",
    "target_table": "messages",
    "target_column": "id",
    "constraint_name": "file_attachments_message_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "file_attachments",
    "source_column": "uploaded_by",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "file_attachments_uploaded_by_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "NO ACTION"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "integration_field_mappings",
    "source_column": "integration_id",
    "target_table": "integrations",
    "target_column": "id",
    "constraint_name": "integration_field_mappings_integration_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "integrations",
    "source_column": "created_by",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "integrations_created_by_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "NO ACTION"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "knowledge_analytics",
    "source_column": "conversation_id",
    "target_table": "conversations",
    "target_column": "id",
    "constraint_name": "knowledge_analytics_conversation_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "knowledge_analytics",
    "source_column": "knowledge_item_id",
    "target_table": "knowledge_items",
    "target_column": "id",
    "constraint_name": "knowledge_analytics_knowledge_item_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "knowledge_categories",
    "source_column": "parent_id",
    "target_table": "knowledge_categories",
    "target_column": "id",
    "constraint_name": "knowledge_categories_parent_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "NO ACTION"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "knowledge_items",
    "source_column": "category_id",
    "target_table": "knowledge_categories",
    "target_column": "id",
    "constraint_name": "knowledge_items_category_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "NO ACTION"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "knowledge_items",
    "source_column": "created_by",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "knowledge_items_created_by_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "NO ACTION"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "knowledge_items",
    "source_column": "updated_by",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "knowledge_items_updated_by_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "NO ACTION"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "knowledge_versions",
    "source_column": "created_by",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "knowledge_versions_created_by_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "NO ACTION"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "knowledge_versions",
    "source_column": "knowledge_item_id",
    "target_table": "knowledge_items",
    "target_column": "id",
    "constraint_name": "knowledge_versions_knowledge_item_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "messages",
    "source_column": "conversation_id",
    "target_table": "conversations",
    "target_column": "id",
    "constraint_name": "messages_conversation_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "messages",
    "source_column": "sender_id",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "messages_sender_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "NO ACTION"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "onboarding_responses",
    "source_column": "user_id",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "onboarding_responses_user_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "playground_sessions",
    "source_column": "user_id",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "playground_sessions_user_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "NO ACTION"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "scan_job_logs",
    "source_column": "scan_job_id",
    "target_table": "website_scan_jobs",
    "target_column": "id",
    "constraint_name": "scan_job_logs_scan_job_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "scheduled_reports",
    "source_column": "created_by",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "scheduled_reports_created_by_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "NO ACTION"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "sync_jobs",
    "source_column": "integration_id",
    "target_table": "integrations",
    "target_column": "id",
    "constraint_name": "sync_jobs_integration_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "system_settings",
    "source_column": "updated_by",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "system_settings_updated_by_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "NO ACTION"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "user_agents",
    "source_column": "user_id",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "user_agents_user_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "webhook_events",
    "source_column": "channel_id",
    "target_table": "communication_channels",
    "target_column": "id",
    "constraint_name": "webhook_events_channel_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "NO ACTION"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "webhook_logs",
    "source_column": "webhook_subscription_id",
    "target_table": "webhook_subscriptions",
    "target_column": "id",
    "constraint_name": "webhook_logs_webhook_subscription_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "webhook_subscriptions",
    "source_column": "integration_id",
    "target_table": "integrations",
    "target_column": "id",
    "constraint_name": "webhook_subscriptions_integration_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "website_scan_jobs",
    "source_column": "user_id",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "website_scan_jobs_user_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "NO ACTION"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "widget_configurations",
    "source_column": "user_id",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "widget_configurations_user_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "NO ACTION"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "workflow_executions",
    "source_column": "conversation_id",
    "target_table": "conversations",
    "target_column": "id",
    "constraint_name": "workflow_executions_conversation_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "workflow_executions",
    "source_column": "workflow_id",
    "target_table": "workflows",
    "target_column": "id",
    "constraint_name": "workflow_executions_workflow_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "workflows",
    "source_column": "user_id",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "workflows_user_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  }
]" 
5. "[
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "agent_availability",
    "indexname": "agent_availability_pkey",
    "indexdef": "CREATE UNIQUE INDEX agent_availability_pkey ON public.agent_availability USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "agent_availability",
    "indexname": "idx_agent_availability_agent_id",
    "indexdef": "CREATE INDEX idx_agent_availability_agent_id ON public.agent_availability USING btree (agent_id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "agent_availability",
    "indexname": "idx_agent_availability_is_online",
    "indexdef": "CREATE INDEX idx_agent_availability_is_online ON public.agent_availability USING btree (is_online)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "agent_availability",
    "indexname": "idx_agent_availability_status",
    "indexdef": "CREATE INDEX idx_agent_availability_status ON public.agent_availability USING btree (status)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "agent_work_logs",
    "indexname": "agent_work_logs_pkey",
    "indexdef": "CREATE UNIQUE INDEX agent_work_logs_pkey ON public.agent_work_logs USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "agent_work_logs",
    "indexname": "idx_agent_work_logs_agent_id",
    "indexdef": "CREATE INDEX idx_agent_work_logs_agent_id ON public.agent_work_logs USING btree (agent_id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "agent_work_logs",
    "indexname": "idx_agent_work_logs_created_at",
    "indexdef": "CREATE INDEX idx_agent_work_logs_created_at ON public.agent_work_logs USING btree (created_at DESC)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "agent_work_logs",
    "indexname": "idx_agent_work_logs_status",
    "indexdef": "CREATE INDEX idx_agent_work_logs_status ON public.agent_work_logs USING btree (status)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "agent_work_logs",
    "indexname": "idx_agent_work_logs_task_type",
    "indexdef": "CREATE INDEX idx_agent_work_logs_task_type ON public.agent_work_logs USING btree (task_type)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "agent_work_logs",
    "indexname": "idx_agent_work_logs_user_id",
    "indexdef": "CREATE INDEX idx_agent_work_logs_user_id ON public.agent_work_logs USING btree (user_id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "alert_history",
    "indexname": "alert_history_pkey",
    "indexdef": "CREATE UNIQUE INDEX alert_history_pkey ON public.alert_history USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "alert_rules",
    "indexname": "alert_rules_pkey",
    "indexdef": "CREATE UNIQUE INDEX alert_rules_pkey ON public.alert_rules USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "alert_rules",
    "indexname": "idx_alert_rules_active",
    "indexdef": "CREATE INDEX idx_alert_rules_active ON public.alert_rules USING btree (is_active)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "alert_rules",
    "indexname": "idx_alert_rules_created_by",
    "indexdef": "CREATE INDEX idx_alert_rules_created_by ON public.alert_rules USING btree (created_by)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "audit_logs",
    "indexname": "audit_logs_pkey",
    "indexdef": "CREATE UNIQUE INDEX audit_logs_pkey ON public.audit_logs USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "auto_generated_knowledge",
    "indexname": "auto_generated_knowledge_pkey",
    "indexdef": "CREATE UNIQUE INDEX auto_generated_knowledge_pkey ON public.auto_generated_knowledge USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "auto_generated_knowledge",
    "indexname": "idx_auto_generated_knowledge_needs_review",
    "indexdef": "CREATE INDEX idx_auto_generated_knowledge_needs_review ON public.auto_generated_knowledge USING btree (needs_review)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "auto_generated_knowledge",
    "indexname": "idx_auto_generated_knowledge_scan_job_id",
    "indexdef": "CREATE INDEX idx_auto_generated_knowledge_scan_job_id ON public.auto_generated_knowledge USING btree (scan_job_id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "canned_responses",
    "indexname": "canned_responses_pkey",
    "indexdef": "CREATE UNIQUE INDEX canned_responses_pkey ON public.canned_responses USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "canned_responses",
    "indexname": "idx_canned_responses_category",
    "indexdef": "CREATE INDEX idx_canned_responses_category ON public.canned_responses USING btree (category)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "canned_responses",
    "indexname": "idx_canned_responses_language",
    "indexdef": "CREATE INDEX idx_canned_responses_language ON public.canned_responses USING btree (language)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "canned_responses",
    "indexname": "idx_canned_responses_shortcut",
    "indexdef": "CREATE INDEX idx_canned_responses_shortcut ON public.canned_responses USING btree (shortcut)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "channel_routing_rules",
    "indexname": "channel_routing_rules_pkey",
    "indexdef": "CREATE UNIQUE INDEX channel_routing_rules_pkey ON public.channel_routing_rules USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "channel_routing_rules",
    "indexname": "idx_routing_rules_channel_type",
    "indexdef": "CREATE INDEX idx_routing_rules_channel_type ON public.channel_routing_rules USING btree (target_channel_type)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "chat_sessions",
    "indexname": "chat_sessions_pkey",
    "indexdef": "CREATE UNIQUE INDEX chat_sessions_pkey ON public.chat_sessions USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "communication_channels",
    "indexname": "communication_channels_pkey",
    "indexdef": "CREATE UNIQUE INDEX communication_channels_pkey ON public.communication_channels USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "communication_channels",
    "indexname": "idx_communication_channels_status",
    "indexdef": "CREATE INDEX idx_communication_channels_status ON public.communication_channels USING btree (status)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "content_processing_queue",
    "indexname": "content_processing_queue_pkey",
    "indexdef": "CREATE UNIQUE INDEX content_processing_queue_pkey ON public.content_processing_queue USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "content_processing_queue",
    "indexname": "idx_content_processing_queue_status",
    "indexdef": "CREATE INDEX idx_content_processing_queue_status ON public.content_processing_queue USING btree (processing_status)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "conversation_analytics",
    "indexname": "conversation_analytics_conversation_id_key",
    "indexdef": "CREATE UNIQUE INDEX conversation_analytics_conversation_id_key ON public.conversation_analytics USING btree (conversation_id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "conversation_analytics",
    "indexname": "conversation_analytics_pkey",
    "indexdef": "CREATE UNIQUE INDEX conversation_analytics_pkey ON public.conversation_analytics USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "conversation_analytics",
    "indexname": "idx_conversation_analytics_conversation",
    "indexdef": "CREATE INDEX idx_conversation_analytics_conversation ON public.conversation_analytics USING btree (conversation_id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "conversation_analytics",
    "indexname": "idx_conversation_analytics_resolved_by",
    "indexdef": "CREATE INDEX idx_conversation_analytics_resolved_by ON public.conversation_analytics USING btree (resolved_by)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "conversation_analytics",
    "indexname": "idx_conversation_analytics_satisfaction",
    "indexdef": "CREATE INDEX idx_conversation_analytics_satisfaction ON public.conversation_analytics USING btree (customer_satisfaction)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "conversation_context",
    "indexname": "conversation_context_conversation_id_key",
    "indexdef": "CREATE UNIQUE INDEX conversation_context_conversation_id_key ON public.conversation_context USING btree (conversation_id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "conversation_context",
    "indexname": "conversation_context_pkey",
    "indexdef": "CREATE UNIQUE INDEX conversation_context_pkey ON public.conversation_context USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "conversation_notes",
    "indexname": "conversation_notes_pkey",
    "indexdef": "CREATE UNIQUE INDEX conversation_notes_pkey ON public.conversation_notes USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "conversation_transfers",
    "indexname": "conversation_transfers_pkey",
    "indexdef": "CREATE UNIQUE INDEX conversation_transfers_pkey ON public.conversation_transfers USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "conversation_transfers",
    "indexname": "idx_conversation_transfers_conversation_id",
    "indexdef": "CREATE INDEX idx_conversation_transfers_conversation_id ON public.conversation_transfers USING btree (conversation_id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "conversation_transfers",
    "indexname": "idx_conversation_transfers_status",
    "indexdef": "CREATE INDEX idx_conversation_transfers_status ON public.conversation_transfers USING btree (status)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "conversations",
    "indexname": "conversations_pkey",
    "indexdef": "CREATE UNIQUE INDEX conversations_pkey ON public.conversations USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "conversations",
    "indexname": "idx_conversations_agent_id",
    "indexdef": "CREATE INDEX idx_conversations_agent_id ON public.conversations USING btree (assigned_agent_id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "conversations",
    "indexname": "idx_conversations_agent_status",
    "indexdef": "CREATE INDEX idx_conversations_agent_status ON public.conversations USING btree (assigned_agent_id, status)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "conversations",
    "indexname": "idx_conversations_assigned_agent_id",
    "indexdef": "CREATE INDEX idx_conversations_assigned_agent_id ON public.conversations USING btree (assigned_agent_id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "conversations",
    "indexname": "idx_conversations_channel_type",
    "indexdef": "CREATE INDEX idx_conversations_channel_type ON public.conversations USING btree (channel_type)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "conversations",
    "indexname": "idx_conversations_created_at",
    "indexdef": "CREATE INDEX idx_conversations_created_at ON public.conversations USING btree (created_at)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "conversations",
    "indexname": "idx_conversations_customer_id",
    "indexdef": "CREATE INDEX idx_conversations_customer_id ON public.conversations USING btree (customer_id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "conversations",
    "indexname": "idx_conversations_customer_name",
    "indexdef": "CREATE INDEX idx_conversations_customer_name ON public.conversations USING btree (customer_name)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "conversations",
    "indexname": "idx_conversations_last_message_at",
    "indexdef": "CREATE INDEX idx_conversations_last_message_at ON public.conversations USING btree (last_message_at)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "conversations",
    "indexname": "idx_conversations_status",
    "indexdef": "CREATE INDEX idx_conversations_status ON public.conversations USING btree (status)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "conversations",
    "indexname": "idx_conversations_status_created_at",
    "indexdef": "CREATE INDEX idx_conversations_status_created_at ON public.conversations USING btree (status, created_at)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "customer_channel_preferences",
    "indexname": "customer_channel_preferences_customer_id_channel_type_key",
    "indexdef": "CREATE UNIQUE INDEX customer_channel_preferences_customer_id_channel_type_key ON public.customer_channel_preferences USING btree (customer_id, channel_type)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "customer_channel_preferences",
    "indexname": "customer_channel_preferences_pkey",
    "indexdef": "CREATE UNIQUE INDEX customer_channel_preferences_pkey ON public.customer_channel_preferences USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "customer_channel_preferences",
    "indexname": "idx_customer_channel_preferences_customer_id",
    "indexdef": "CREATE INDEX idx_customer_channel_preferences_customer_id ON public.customer_channel_preferences USING btree (customer_id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "customer_profiles",
    "indexname": "customer_profiles_email_key",
    "indexdef": "CREATE UNIQUE INDEX customer_profiles_email_key ON public.customer_profiles USING btree (email)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "customer_profiles",
    "indexname": "customer_profiles_pkey",
    "indexdef": "CREATE UNIQUE INDEX customer_profiles_pkey ON public.customer_profiles USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "customer_profiles",
    "indexname": "idx_customer_profiles_created_at",
    "indexdef": "CREATE INDEX idx_customer_profiles_created_at ON public.customer_profiles USING btree (created_at)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "customer_profiles",
    "indexname": "idx_customer_profiles_email",
    "indexdef": "CREATE INDEX idx_customer_profiles_email ON public.customer_profiles USING btree (email)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "customer_profiles",
    "indexname": "idx_customer_profiles_phone",
    "indexdef": "CREATE INDEX idx_customer_profiles_phone ON public.customer_profiles USING btree (phone)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "daily_metrics",
    "indexname": "daily_metrics_date_channel_type_department_agent_id_key",
    "indexdef": "CREATE UNIQUE INDEX daily_metrics_date_channel_type_department_agent_id_key ON public.daily_metrics USING btree (date, channel_type, department, agent_id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "daily_metrics",
    "indexname": "daily_metrics_pkey",
    "indexdef": "CREATE UNIQUE INDEX daily_metrics_pkey ON public.daily_metrics USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "daily_metrics",
    "indexname": "idx_daily_metrics_agent",
    "indexdef": "CREATE INDEX idx_daily_metrics_agent ON public.daily_metrics USING btree (agent_id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "daily_metrics",
    "indexname": "idx_daily_metrics_agent_id",
    "indexdef": "CREATE INDEX idx_daily_metrics_agent_id ON public.daily_metrics USING btree (agent_id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "daily_metrics",
    "indexname": "idx_daily_metrics_channel",
    "indexdef": "CREATE INDEX idx_daily_metrics_channel ON public.daily_metrics USING btree (channel_type)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "daily_metrics",
    "indexname": "idx_daily_metrics_channel_type",
    "indexdef": "CREATE INDEX idx_daily_metrics_channel_type ON public.daily_metrics USING btree (channel_type)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "daily_metrics",
    "indexname": "idx_daily_metrics_date",
    "indexdef": "CREATE INDEX idx_daily_metrics_date ON public.daily_metrics USING btree (date)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "dashboard_configs",
    "indexname": "dashboard_configs_pkey",
    "indexdef": "CREATE UNIQUE INDEX dashboard_configs_pkey ON public.dashboard_configs USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "dashboard_configs",
    "indexname": "idx_dashboard_configs_user",
    "indexdef": "CREATE INDEX idx_dashboard_configs_user ON public.dashboard_configs USING btree (user_id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "embeddings",
    "indexname": "embeddings_pkey",
    "indexdef": "CREATE UNIQUE INDEX embeddings_pkey ON public.embeddings USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "export_jobs",
    "indexname": "export_jobs_pkey",
    "indexdef": "CREATE UNIQUE INDEX export_jobs_pkey ON public.export_jobs USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "export_jobs",
    "indexname": "idx_export_jobs_status",
    "indexdef": "CREATE INDEX idx_export_jobs_status ON public.export_jobs USING btree (status)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "export_jobs",
    "indexname": "idx_export_jobs_user",
    "indexdef": "CREATE INDEX idx_export_jobs_user ON public.export_jobs USING btree (user_id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "extracted_content",
    "indexname": "extracted_content_pkey",
    "indexdef": "CREATE UNIQUE INDEX extracted_content_pkey ON public.extracted_content USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "extracted_content",
    "indexname": "idx_extracted_content_content_type",
    "indexdef": "CREATE INDEX idx_extracted_content_content_type ON public.extracted_content USING btree (content_type)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "extracted_content",
    "indexname": "idx_extracted_content_scan_job_id",
    "indexdef": "CREATE INDEX idx_extracted_content_scan_job_id ON public.extracted_content USING btree (scan_job_id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "file_attachments",
    "indexname": "file_attachments_pkey",
    "indexdef": "CREATE UNIQUE INDEX file_attachments_pkey ON public.file_attachments USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "integration_field_mappings",
    "indexname": "integration_field_mappings_pkey",
    "indexdef": "CREATE UNIQUE INDEX integration_field_mappings_pkey ON public.integration_field_mappings USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "integrations",
    "indexname": "idx_integrations_status",
    "indexdef": "CREATE INDEX idx_integrations_status ON public.integrations USING btree (status)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "integrations",
    "indexname": "integrations_pkey",
    "indexdef": "CREATE UNIQUE INDEX integrations_pkey ON public.integrations USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "intent_patterns",
    "indexname": "intent_patterns_pkey",
    "indexdef": "CREATE UNIQUE INDEX intent_patterns_pkey ON public.intent_patterns USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "knowledge_analytics",
    "indexname": "knowledge_analytics_pkey",
    "indexdef": "CREATE UNIQUE INDEX knowledge_analytics_pkey ON public.knowledge_analytics USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "knowledge_base",
    "indexname": "knowledge_base_pkey",
    "indexdef": "CREATE UNIQUE INDEX knowledge_base_pkey ON public.knowledge_base USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "knowledge_categories",
    "indexname": "idx_knowledge_categories_is_active",
    "indexdef": "CREATE INDEX idx_knowledge_categories_is_active ON public.knowledge_categories USING btree (is_active)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "knowledge_categories",
    "indexname": "idx_knowledge_categories_parent_id",
    "indexdef": "CREATE INDEX idx_knowledge_categories_parent_id ON public.knowledge_categories USING btree (parent_id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "knowledge_categories",
    "indexname": "knowledge_categories_pkey",
    "indexdef": "CREATE UNIQUE INDEX knowledge_categories_pkey ON public.knowledge_categories USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "knowledge_items",
    "indexname": "idx_knowledge_items_category_id",
    "indexdef": "CREATE INDEX idx_knowledge_items_category_id ON public.knowledge_items USING btree (category_id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "knowledge_items",
    "indexname": "idx_knowledge_items_content_trgm",
    "indexdef": "CREATE INDEX idx_knowledge_items_content_trgm ON public.knowledge_items USING gin (content gin_trgm_ops)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "knowledge_items",
    "indexname": "idx_knowledge_items_language",
    "indexdef": "CREATE INDEX idx_knowledge_items_language ON public.knowledge_items USING btree (language)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "knowledge_items",
    "indexname": "idx_knowledge_items_status",
    "indexdef": "CREATE INDEX idx_knowledge_items_status ON public.knowledge_items USING btree (status)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "knowledge_items",
    "indexname": "idx_knowledge_items_title_trgm",
    "indexdef": "CREATE INDEX idx_knowledge_items_title_trgm ON public.knowledge_items USING gin (title gin_trgm_ops)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "knowledge_items",
    "indexname": "knowledge_items_pkey",
    "indexdef": "CREATE UNIQUE INDEX knowledge_items_pkey ON public.knowledge_items USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "knowledge_versions",
    "indexname": "knowledge_versions_pkey",
    "indexdef": "CREATE UNIQUE INDEX knowledge_versions_pkey ON public.knowledge_versions USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "message_delivery_tracking",
    "indexname": "idx_delivery_tracking_message_id",
    "indexdef": "CREATE INDEX idx_delivery_tracking_message_id ON public.message_delivery_tracking USING btree (message_id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "message_delivery_tracking",
    "indexname": "idx_delivery_tracking_status",
    "indexdef": "CREATE INDEX idx_delivery_tracking_status ON public.message_delivery_tracking USING btree (delivery_status)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "message_delivery_tracking",
    "indexname": "message_delivery_tracking_pkey",
    "indexdef": "CREATE UNIQUE INDEX message_delivery_tracking_pkey ON public.message_delivery_tracking USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "message_templates",
    "indexname": "idx_message_templates_channel_type",
    "indexdef": "CREATE INDEX idx_message_templates_channel_type ON public.message_templates USING btree (channel_type)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "message_templates",
    "indexname": "idx_message_templates_status",
    "indexdef": "CREATE INDEX idx_message_templates_status ON public.message_templates USING btree (status)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "message_templates",
    "indexname": "message_templates_pkey",
    "indexdef": "CREATE UNIQUE INDEX message_templates_pkey ON public.message_templates USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "messages",
    "indexname": "idx_messages_content_trgm",
    "indexdef": "CREATE INDEX idx_messages_content_trgm ON public.messages USING gin (content gin_trgm_ops)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "messages",
    "indexname": "idx_messages_conversation_created",
    "indexdef": "CREATE INDEX idx_messages_conversation_created ON public.messages USING btree (conversation_id, created_at)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "messages",
    "indexname": "idx_messages_conversation_id",
    "indexdef": "CREATE INDEX idx_messages_conversation_id ON public.messages USING btree (conversation_id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "messages",
    "indexname": "idx_messages_created_at",
    "indexdef": "CREATE INDEX idx_messages_created_at ON public.messages USING btree (created_at)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "messages",
    "indexname": "idx_messages_sender_type",
    "indexdef": "CREATE INDEX idx_messages_sender_type ON public.messages USING btree (sender_type)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "messages",
    "indexname": "messages_pkey",
    "indexdef": "CREATE UNIQUE INDEX messages_pkey ON public.messages USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "onboarding_responses",
    "indexname": "onboarding_responses_pkey",
    "indexdef": "CREATE UNIQUE INDEX onboarding_responses_pkey ON public.onboarding_responses USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "playground_sessions",
    "indexname": "playground_sessions_pkey",
    "indexdef": "CREATE UNIQUE INDEX playground_sessions_pkey ON public.playground_sessions USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "profiles",
    "indexname": "profiles_pkey",
    "indexdef": "CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "realtime_metrics",
    "indexname": "idx_realtime_metrics_expires",
    "indexdef": "CREATE INDEX idx_realtime_metrics_expires ON public.realtime_metrics USING btree (expires_at)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "realtime_metrics",
    "indexname": "idx_realtime_metrics_name",
    "indexdef": "CREATE INDEX idx_realtime_metrics_name ON public.realtime_metrics USING btree (metric_name)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "realtime_metrics",
    "indexname": "idx_realtime_metrics_timestamp",
    "indexdef": "CREATE INDEX idx_realtime_metrics_timestamp ON public.realtime_metrics USING btree (\"timestamp\")"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "realtime_metrics",
    "indexname": "realtime_metrics_pkey",
    "indexdef": "CREATE UNIQUE INDEX realtime_metrics_pkey ON public.realtime_metrics USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "scan_job_logs",
    "indexname": "idx_scan_job_logs_scan_job_id",
    "indexdef": "CREATE INDEX idx_scan_job_logs_scan_job_id ON public.scan_job_logs USING btree (scan_job_id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "scan_job_logs",
    "indexname": "scan_job_logs_pkey",
    "indexdef": "CREATE UNIQUE INDEX scan_job_logs_pkey ON public.scan_job_logs USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "scheduled_reports",
    "indexname": "idx_scheduled_reports_created_by",
    "indexdef": "CREATE INDEX idx_scheduled_reports_created_by ON public.scheduled_reports USING btree (created_by)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "scheduled_reports",
    "indexname": "idx_scheduled_reports_next_run",
    "indexdef": "CREATE INDEX idx_scheduled_reports_next_run ON public.scheduled_reports USING btree (next_run_at)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "scheduled_reports",
    "indexname": "scheduled_reports_pkey",
    "indexdef": "CREATE UNIQUE INDEX scheduled_reports_pkey ON public.scheduled_reports USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "sla_tracking",
    "indexname": "idx_sla_tracking_conversation_id",
    "indexdef": "CREATE INDEX idx_sla_tracking_conversation_id ON public.sla_tracking USING btree (conversation_id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "sla_tracking",
    "indexname": "idx_sla_tracking_status",
    "indexdef": "CREATE INDEX idx_sla_tracking_status ON public.sla_tracking USING btree (status)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "sla_tracking",
    "indexname": "sla_tracking_pkey",
    "indexdef": "CREATE UNIQUE INDEX sla_tracking_pkey ON public.sla_tracking USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "sync_jobs",
    "indexname": "sync_jobs_pkey",
    "indexdef": "CREATE UNIQUE INDEX sync_jobs_pkey ON public.sync_jobs USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "system_settings",
    "indexname": "system_settings_pkey",
    "indexdef": "CREATE UNIQUE INDEX system_settings_pkey ON public.system_settings USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "system_settings",
    "indexname": "system_settings_setting_key_key",
    "indexdef": "CREATE UNIQUE INDEX system_settings_setting_key_key ON public.system_settings USING btree (setting_key)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "user_agents",
    "indexname": "idx_user_agents_agent_id",
    "indexdef": "CREATE INDEX idx_user_agents_agent_id ON public.user_agents USING btree (agent_id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "user_agents",
    "indexname": "idx_user_agents_agent_type",
    "indexdef": "CREATE INDEX idx_user_agents_agent_type ON public.user_agents USING btree (agent_type)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "user_agents",
    "indexname": "idx_user_agents_is_active",
    "indexdef": "CREATE INDEX idx_user_agents_is_active ON public.user_agents USING btree (is_active)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "user_agents",
    "indexname": "idx_user_agents_user_id",
    "indexdef": "CREATE INDEX idx_user_agents_user_id ON public.user_agents USING btree (user_id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "user_agents",
    "indexname": "user_agents_agent_id_key",
    "indexdef": "CREATE UNIQUE INDEX user_agents_agent_id_key ON public.user_agents USING btree (agent_id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "user_agents",
    "indexname": "user_agents_pkey",
    "indexdef": "CREATE UNIQUE INDEX user_agents_pkey ON public.user_agents USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "webhook_events",
    "indexname": "idx_webhook_events_channel_id",
    "indexdef": "CREATE INDEX idx_webhook_events_channel_id ON public.webhook_events USING btree (channel_id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "webhook_events",
    "indexname": "idx_webhook_events_created_at",
    "indexdef": "CREATE INDEX idx_webhook_events_created_at ON public.webhook_events USING btree (created_at)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "webhook_events",
    "indexname": "idx_webhook_events_processed",
    "indexdef": "CREATE INDEX idx_webhook_events_processed ON public.webhook_events USING btree (processed)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "webhook_events",
    "indexname": "webhook_events_pkey",
    "indexdef": "CREATE UNIQUE INDEX webhook_events_pkey ON public.webhook_events USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "webhook_logs",
    "indexname": "webhook_logs_pkey",
    "indexdef": "CREATE UNIQUE INDEX webhook_logs_pkey ON public.webhook_logs USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "webhook_subscriptions",
    "indexname": "webhook_subscriptions_pkey",
    "indexdef": "CREATE UNIQUE INDEX webhook_subscriptions_pkey ON public.webhook_subscriptions USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "website_scan_jobs",
    "indexname": "idx_website_scan_jobs_status",
    "indexdef": "CREATE INDEX idx_website_scan_jobs_status ON public.website_scan_jobs USING btree (status)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "website_scan_jobs",
    "indexname": "idx_website_scan_jobs_user_id",
    "indexdef": "CREATE INDEX idx_website_scan_jobs_user_id ON public.website_scan_jobs USING btree (user_id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "website_scan_jobs",
    "indexname": "website_scan_jobs_pkey",
    "indexdef": "CREATE UNIQUE INDEX website_scan_jobs_pkey ON public.website_scan_jobs USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "widget_configurations",
    "indexname": "idx_widget_configurations_status",
    "indexdef": "CREATE INDEX idx_widget_configurations_status ON public.widget_configurations USING btree (status)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "widget_configurations",
    "indexname": "widget_configurations_pkey",
    "indexdef": "CREATE UNIQUE INDEX widget_configurations_pkey ON public.widget_configurations USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "workflow_executions",
    "indexname": "idx_workflow_executions_status",
    "indexdef": "CREATE INDEX idx_workflow_executions_status ON public.workflow_executions USING btree (status)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "workflow_executions",
    "indexname": "workflow_executions_pkey",
    "indexdef": "CREATE UNIQUE INDEX workflow_executions_pkey ON public.workflow_executions USING btree (id)"
  },
  {
    "section": "=== INDEXES ===",
    "schemaname": "public",
    "tablename": "workflows",
    "indexname": "workflows_pkey",
    "indexdef": "CREATE UNIQUE INDEX workflows_pkey ON public.workflows USING btree (id)"
  }
]" 
6. "[
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "agent_availability",
    "constraint_name": "2200_27242_2_not_null",
    "check_clause": "agent_id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "agent_availability",
    "constraint_name": "2200_27242_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "agent_work_logs",
    "constraint_name": "2200_36933_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "agent_work_logs",
    "constraint_name": "agent_work_logs_status_check",
    "check_clause": "(((status)::text = ANY ((ARRAY['pending'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'failed'::character varying])::text[])))"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "agent_work_logs",
    "constraint_name": "2200_36933_9_not_null",
    "check_clause": "status IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "agent_work_logs",
    "constraint_name": "2200_36933_6_not_null",
    "check_clause": "task_description IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "agent_work_logs",
    "constraint_name": "agent_work_logs_task_type_check",
    "check_clause": "(((task_type)::text = ANY ((ARRAY['conversation'::character varying, 'knowledge_processing'::character varying, 'workflow_execution'::character varying, 'content_analysis'::character varying, 'automation'::character varying])::text[])))"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "agent_work_logs",
    "constraint_name": "2200_36933_5_not_null",
    "check_clause": "task_type IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "agent_work_logs",
    "constraint_name": "2200_36933_3_not_null",
    "check_clause": "agent_name IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "agent_work_logs",
    "constraint_name": "2200_36933_2_not_null",
    "check_clause": "agent_id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "agent_work_logs",
    "constraint_name": "2200_36933_10_not_null",
    "check_clause": "started_at IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "alert_history",
    "constraint_name": "2200_27833_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "alert_history",
    "constraint_name": "2200_27833_5_not_null",
    "check_clause": "threshold_value IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "alert_history",
    "constraint_name": "2200_27833_4_not_null",
    "check_clause": "metric_value IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "alert_rules",
    "constraint_name": "2200_27816_4_not_null",
    "check_clause": "condition IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "alert_rules",
    "constraint_name": "2200_27816_5_not_null",
    "check_clause": "threshold IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "alert_rules",
    "constraint_name": "2200_27816_8_not_null",
    "check_clause": "recipients IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "alert_rules",
    "constraint_name": "2200_27816_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "alert_rules",
    "constraint_name": "2200_27816_2_not_null",
    "check_clause": "name IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "alert_rules",
    "constraint_name": "2200_27816_3_not_null",
    "check_clause": "metric IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "audit_logs",
    "constraint_name": "2200_33397_3_not_null",
    "check_clause": "action IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "audit_logs",
    "constraint_name": "2200_33397_4_not_null",
    "check_clause": "entity_type IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "audit_logs",
    "constraint_name": "2200_33397_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "auto_generated_knowledge",
    "constraint_name": "2200_28059_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "canned_responses",
    "constraint_name": "2200_27260_3_not_null",
    "check_clause": "content IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "canned_responses",
    "constraint_name": "2200_27260_2_not_null",
    "check_clause": "title IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "canned_responses",
    "constraint_name": "2200_27260_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "channel_routing_rules",
    "constraint_name": "2200_27477_4_not_null",
    "check_clause": "conditions IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "channel_routing_rules",
    "constraint_name": "2200_27477_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "channel_routing_rules",
    "constraint_name": "2200_27477_2_not_null",
    "check_clause": "name IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "channel_routing_rules",
    "constraint_name": "2200_27477_5_not_null",
    "check_clause": "target_channel_type IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "chat_sessions",
    "constraint_name": "2200_17600_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "communication_channels",
    "constraint_name": "2200_27413_3_not_null",
    "check_clause": "type IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "communication_channels",
    "constraint_name": "2200_27413_2_not_null",
    "check_clause": "name IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "communication_channels",
    "constraint_name": "2200_27413_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "communication_channels",
    "constraint_name": "2200_27413_5_not_null",
    "check_clause": "configuration IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "content_processing_queue",
    "constraint_name": "2200_28092_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "conversation_analytics",
    "constraint_name": "2200_27758_3_not_null",
    "check_clause": "started_at IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "conversation_analytics",
    "constraint_name": "2200_27758_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "conversation_context",
    "constraint_name": "2200_26958_3_not_null",
    "check_clause": "context_data IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "conversation_context",
    "constraint_name": "2200_26958_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "conversation_notes",
    "constraint_name": "2200_33227_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "conversation_notes",
    "constraint_name": "2200_33227_4_not_null",
    "check_clause": "note IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "conversation_transfers",
    "constraint_name": "2200_27332_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "conversations",
    "constraint_name": "satisfaction_rating_check",
    "check_clause": "(((satisfaction_rating >= 1) AND (satisfaction_rating <= 5)))"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "conversations",
    "constraint_name": "2200_30885_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "customer_channel_preferences",
    "constraint_name": "2200_30903_3_not_null",
    "check_clause": "channel_type IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "customer_channel_preferences",
    "constraint_name": "2200_30903_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "customer_profiles",
    "constraint_name": "2200_30866_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "daily_metrics",
    "constraint_name": "2200_27720_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "daily_metrics",
    "constraint_name": "2200_27720_2_not_null",
    "check_clause": "date IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "dashboard_configs",
    "constraint_name": "2200_27782_5_not_null",
    "check_clause": "layout IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "dashboard_configs",
    "constraint_name": "2200_27782_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "dashboard_configs",
    "constraint_name": "2200_27782_3_not_null",
    "check_clause": "name IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "embeddings",
    "constraint_name": "2200_17586_3_not_null",
    "check_clause": "content IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "embeddings",
    "constraint_name": "2200_17586_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "export_jobs",
    "constraint_name": "2200_27847_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "export_jobs",
    "constraint_name": "2200_27847_6_not_null",
    "check_clause": "format IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "export_jobs",
    "constraint_name": "2200_27847_4_not_null",
    "check_clause": "type IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "export_jobs",
    "constraint_name": "2200_27847_3_not_null",
    "check_clause": "name IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "extracted_content",
    "constraint_name": "2200_28045_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "extracted_content",
    "constraint_name": "2200_28045_3_not_null",
    "check_clause": "url IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "extracted_content",
    "constraint_name": "2200_28045_5_not_null",
    "check_clause": "content IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "file_attachments",
    "constraint_name": "2200_33249_5_not_null",
    "check_clause": "file_path IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "file_attachments",
    "constraint_name": "2200_33249_4_not_null",
    "check_clause": "filename IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "file_attachments",
    "constraint_name": "2200_33249_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "integration_field_mappings",
    "constraint_name": "2200_33313_6_not_null",
    "check_clause": "target_field IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "integration_field_mappings",
    "constraint_name": "2200_33313_5_not_null",
    "check_clause": "source_field IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "integration_field_mappings",
    "constraint_name": "2200_33313_4_not_null",
    "check_clause": "target_entity IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "integration_field_mappings",
    "constraint_name": "2200_33313_3_not_null",
    "check_clause": "source_entity IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "integration_field_mappings",
    "constraint_name": "2200_33313_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "integrations",
    "constraint_name": "2200_31633_3_not_null",
    "check_clause": "type IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "integrations",
    "constraint_name": "2200_31633_2_not_null",
    "check_clause": "name IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "integrations",
    "constraint_name": "2200_31633_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "integrations",
    "constraint_name": "2200_31633_7_not_null",
    "check_clause": "credentials IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "integrations",
    "constraint_name": "2200_31633_6_not_null",
    "check_clause": "configuration IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "integrations",
    "constraint_name": "2200_31633_4_not_null",
    "check_clause": "provider IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "intent_patterns",
    "constraint_name": "2200_26947_3_not_null",
    "check_clause": "language IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "intent_patterns",
    "constraint_name": "2200_26947_2_not_null",
    "check_clause": "intent_name IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "intent_patterns",
    "constraint_name": "2200_26947_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "intent_patterns",
    "constraint_name": "2200_26947_4_not_null",
    "check_clause": "patterns IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "knowledge_analytics",
    "constraint_name": "2200_33294_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "knowledge_base",
    "constraint_name": "2200_26934_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "knowledge_base",
    "constraint_name": "2200_26934_3_not_null",
    "check_clause": "content IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "knowledge_base",
    "constraint_name": "2200_26934_2_not_null",
    "check_clause": "title IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "knowledge_categories",
    "constraint_name": "2200_29364_2_not_null",
    "check_clause": "name IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "knowledge_categories",
    "constraint_name": "2200_29364_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "knowledge_items",
    "constraint_name": "2200_29373_3_not_null",
    "check_clause": "content IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "knowledge_items",
    "constraint_name": "2200_29373_2_not_null",
    "check_clause": "title IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "knowledge_items",
    "constraint_name": "2200_29373_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "knowledge_versions",
    "constraint_name": "2200_33275_4_not_null",
    "check_clause": "content IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "knowledge_versions",
    "constraint_name": "2200_33275_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "knowledge_versions",
    "constraint_name": "2200_33275_3_not_null",
    "check_clause": "version IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "message_delivery_tracking",
    "constraint_name": "2200_27488_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "message_delivery_tracking",
    "constraint_name": "2200_27488_3_not_null",
    "check_clause": "channel_type IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "message_templates",
    "constraint_name": "2200_27436_7_not_null",
    "check_clause": "channel_type IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "message_templates",
    "constraint_name": "2200_27436_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "message_templates",
    "constraint_name": "2200_27436_2_not_null",
    "check_clause": "name IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "message_templates",
    "constraint_name": "2200_27436_3_not_null",
    "check_clause": "language IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "message_templates",
    "constraint_name": "2200_27436_4_not_null",
    "check_clause": "category IS NOT NULL"
  }
]"
7. "[
  {
    "section": "=== VIEWS ===",
    "view_name": "agent_performance_metrics",
    "view_definition": " SELECT agent_work_logs.user_id,\n    agent_work_logs.agent_id,\n    agent_work_logs.agent_name,\n    count(*) AS total_tasks,\n    count(*) FILTER (WHERE ((agent_work_logs.status)::text = 'completed'::text)) AS completed_tasks,\n    count(*) FILTER (WHERE ((agent_work_logs.status)::text = 'failed'::text)) AS failed_tasks,\n    count(*) FILTER (WHERE ((agent_work_logs.status)::text = 'in_progress'::text)) AS in_progress_tasks,\n    avg(agent_work_logs.execution_time_ms) FILTER (WHERE ((agent_work_logs.status)::text = 'completed'::text)) AS avg_execution_time_ms,\n    min(agent_work_logs.execution_time_ms) FILTER (WHERE ((agent_work_logs.status)::text = 'completed'::text)) AS min_execution_time_ms,\n    max(agent_work_logs.execution_time_ms) FILTER (WHERE ((agent_work_logs.status)::text = 'completed'::text)) AS max_execution_time_ms,\n    (((count(*) FILTER (WHERE ((agent_work_logs.status)::text = 'completed'::text)))::double precision / (NULLIF(count(*), 0))::double precision) * (100)::double precision) AS success_rate,\n    (((count(*) FILTER (WHERE ((agent_work_logs.status)::text = 'failed'::text)))::double precision / (NULLIF(count(*), 0))::double precision) * (100)::double precision) AS failure_rate,\n    max(agent_work_logs.updated_at) AS last_activity,\n    count(DISTINCT agent_work_logs.task_type) AS task_types_handled,\n    date_trunc('day'::text, max(agent_work_logs.created_at)) AS last_task_date\n   FROM agent_work_logs\n  GROUP BY agent_work_logs.user_id, agent_work_logs.agent_id, agent_work_logs.agent_name;"
  }
]" 
8. "[
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "aggregate_daily_metrics",
    "routine_type": "FUNCTION",
    "return_type": "void",
    "routine_definition": "\nDECLARE\n    metric_date DATE := CURRENT_DATE - INTERVAL '1 day';\nBEGIN\n    -- Aggregate conversation metrics by channel and agent\n    INSERT INTO daily_metrics (\n        date,\n        channel_type,\n        agent_id,\n        total_conversations,\n        ai_resolved_conversations,\n        human_resolved_conversations,\n        avg_first_response_time_seconds,\n        avg_resolution_time_seconds,\n        avg_satisfaction_score\n    )\n    SELECT\n        metric_date,\n        c.channel_type,\n        c.assigned_agent_id,\n        COUNT(*) as total_conversations,\n        COUNT(CASE WHEN c.assigned_agent_id IS NULL THEN 1 END) as ai_resolved,\n        COUNT(CASE WHEN c.assigned_agent_id IS NOT NULL THEN 1 END) as human_resolved,\n        AVG(EXTRACT(EPOCH FROM (first_response.created_at - c.created_at)))::INTEGER as avg_first_response,\n        AVG(c.resolution_time_seconds) as avg_resolution,\n        AVG(c.satisfaction_score) as avg_satisfaction\n    FROM conversations c\n    LEFT JOIN (\n        SELECT \n            conversation_id,\n            MIN(created_at) as created_at\n        FROM messages\n        WHERE sender_type IN ('ai', 'agent')\n        GROUP BY conversation_id\n    ) first_response ON c.id = first_response.conversation_id\n    WHERE DATE(c.created_at) = metric_date\n    GROUP BY c.channel_type, c.assigned_agent_id\n    ON CONFLICT (date, channel_type, department, agent_id) DO UPDATE SET\n        total_conversations = EXCLUDED.total_conversations,\n        ai_resolved_conversations = EXCLUDED.ai_resolved_conversations,\n        human_resolved_conversations = EXCLUDED.human_resolved_conversations,\n        avg_first_response_time_seconds = EXCLUDED.avg_first_response_time_seconds,\n        avg_resolution_time_seconds = EXCLUDED.avg_resolution_time_seconds,\n        avg_satisfaction_score = EXCLUDED.avg_satisfaction_score;\n        \nEND;\n"
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "auto_assign_conversation",
    "routine_type": "FUNCTION",
    "return_type": "trigger",
    "routine_definition": "\nDECLARE\n    available_agent_id UUID;\nBEGIN\n    -- Only auto-assign if no agent is assigned and conversation is active\n    IF NEW.assigned_agent_id IS NULL AND NEW.status = 'active' THEN\n        -- Find an available agent with lowest current chat count\n        SELECT agent_id INTO available_agent_id\n        FROM agent_availability\n        WHERE is_online = true \n        AND status = 'available'\n        AND current_chat_count < max_concurrent_chats\n        ORDER BY current_chat_count ASC, last_activity DESC\n        LIMIT 1;\n        \n        IF available_agent_id IS NOT NULL THEN\n            NEW.assigned_agent_id = available_agent_id;\n            \n            -- Update agent's current chat count\n            UPDATE agent_availability\n            SET current_chat_count = current_chat_count + 1\n            WHERE agent_id = available_agent_id;\n        END IF;\n    END IF;\n    \n    RETURN NEW;\nEND;\n"
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "calculate_knowledge_effectiveness",
    "routine_type": "FUNCTION",
    "return_type": "trigger",
    "routine_definition": "\nDECLARE\n    total_usage INTEGER;\n    helpful_usage INTEGER;\n    effectiveness DECIMAL(3,2);\nBEGIN\n    -- Get usage statistics for the knowledge item\n    SELECT \n        COUNT(*) as total,\n        COUNT(CASE WHEN was_helpful = true THEN 1 END) as helpful\n    INTO total_usage, helpful_usage\n    FROM knowledge_analytics\n    WHERE knowledge_item_id = NEW.knowledge_item_id;\n    \n    -- Calculate effectiveness score\n    IF total_usage > 0 THEN\n        effectiveness = (helpful_usage::DECIMAL / total_usage::DECIMAL);\n    ELSE\n        effectiveness = 0.5;\n    END IF;\n    \n    -- Update knowledge item\n    UPDATE knowledge_items\n    SET effectiveness_score = effectiveness\n    WHERE id = NEW.knowledge_item_id;\n    \n    RETURN NEW;\nEND;\n"
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "calculate_word_count",
    "routine_type": "FUNCTION",
    "return_type": "integer",
    "routine_definition": "\nBEGIN\n    RETURN array_length(regexp_split_to_array(trim(content), '\\s+'), 1);\nEND;\n"
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "check_onboarding_status",
    "routine_type": "FUNCTION",
    "return_type": "boolean",
    "routine_definition": "\n  SELECT onboarding_completed FROM profiles WHERE id = user_id;\n"
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "cleanup_expired_metrics",
    "routine_type": "FUNCTION",
    "return_type": "void",
    "routine_definition": "\nBEGIN\n    DELETE FROM realtime_metrics WHERE expires_at < NOW();\nEND;\n"
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "create_conversation_analytics",
    "routine_type": "FUNCTION",
    "return_type": "trigger",
    "routine_definition": "\nBEGIN\n    INSERT INTO conversation_analytics (\n        conversation_id,\n        started_at,\n        total_messages,\n        customer_messages,\n        ai_messages,\n        agent_messages\n    ) VALUES (\n        NEW.id,\n        NEW.created_at,\n        0,\n        0,\n        0,\n        0\n    );\n    \n    RETURN NEW;\nEND;\n"
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "create_knowledge_version",
    "routine_type": "FUNCTION",
    "return_type": "trigger",
    "routine_definition": "\nBEGIN\n    -- Only create version if content actually changed\n    IF OLD.content IS DISTINCT FROM NEW.content THEN\n        INSERT INTO knowledge_versions (\n            knowledge_item_id,\n            version,\n            content,\n            changes_description,\n            created_by\n        ) VALUES (\n            NEW.id,\n            NEW.version,\n            NEW.content,\n            'Auto-created version from content update',\n            NEW.updated_by\n        );\n    END IF;\n    \n    RETURN NEW;\nEND;\n"
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "finalize_conversation_analytics",
    "routine_type": "FUNCTION",
    "return_type": "trigger",
    "routine_definition": "\nDECLARE\n    first_response_time INTEGER;\n    total_duration INTEGER;\n    resolution_type VARCHAR(50);\n    resolved_by VARCHAR(20);\nBEGIN\n    -- Only process when conversation is resolved\n    IF NEW.status IN ('resolved', 'closed') AND OLD.status NOT IN ('resolved', 'closed') THEN\n        -- Calculate first response time\n        SELECT EXTRACT(EPOCH FROM (created_at - NEW.created_at))::INTEGER\n        INTO first_response_time\n        FROM messages\n        WHERE conversation_id = NEW.id\n        AND sender_type IN ('ai', 'agent')\n        ORDER BY created_at ASC\n        LIMIT 1;\n        \n        -- Calculate total duration\n        total_duration = EXTRACT(EPOCH FROM (NOW() - NEW.created_at))::INTEGER;\n        \n        -- Determine resolution type and who resolved it\n        resolution_type = CASE \n            WHEN NEW.status = 'resolved' THEN 'solved'\n            WHEN NEW.status = 'closed' THEN 'closed'\n            ELSE 'other'\n        END;\n        \n        resolved_by = CASE\n            WHEN NEW.assigned_agent_id IS NOT NULL THEN 'agent'\n            ELSE 'ai'\n        END;\n        \n        -- Update conversation analytics\n        UPDATE conversation_analytics\n        SET \n            resolved_at = NOW(),\n            total_duration_seconds = total_duration,\n            resolved_by = resolved_by,\n            resolution_type = resolution_type,\n            customer_satisfaction = NEW.satisfaction_score,\n            updated_at = NOW()\n        WHERE conversation_id = NEW.id;\n        \n        -- Update resolution time in conversations table\n        UPDATE conversations\n        SET resolution_time_seconds = total_duration,\n            resolved_at = NOW()\n        WHERE id = NEW.id;\n    END IF;\n    \n    RETURN NEW;\nEND;\n"
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "generate_uuid",
    "routine_type": "FUNCTION",
    "return_type": "uuid",
    "routine_definition": "\nBEGIN\n    RETURN gen_random_uuid();\nEND;\n"
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "gin_extract_query_trgm",
    "routine_type": "FUNCTION",
    "return_type": "internal",
    "routine_definition": null
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "gin_extract_value_trgm",
    "routine_type": "FUNCTION",
    "return_type": "internal",
    "routine_definition": null
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "gin_trgm_consistent",
    "routine_type": "FUNCTION",
    "return_type": "boolean",
    "routine_definition": null
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "gin_trgm_triconsistent",
    "routine_type": "FUNCTION",
    "return_type": "\"char\"",
    "routine_definition": null
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "gtrgm_compress",
    "routine_type": "FUNCTION",
    "return_type": "internal",
    "routine_definition": null
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "gtrgm_consistent",
    "routine_type": "FUNCTION",
    "return_type": "boolean",
    "routine_definition": null
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "gtrgm_decompress",
    "routine_type": "FUNCTION",
    "return_type": "internal",
    "routine_definition": null
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "gtrgm_distance",
    "routine_type": "FUNCTION",
    "return_type": "double precision",
    "routine_definition": null
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "gtrgm_in",
    "routine_type": "FUNCTION",
    "return_type": "USER-DEFINED",
    "routine_definition": null
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "gtrgm_options",
    "routine_type": "FUNCTION",
    "return_type": "void",
    "routine_definition": null
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "gtrgm_out",
    "routine_type": "FUNCTION",
    "return_type": "cstring",
    "routine_definition": null
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "gtrgm_penalty",
    "routine_type": "FUNCTION",
    "return_type": "internal",
    "routine_definition": null
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "gtrgm_picksplit",
    "routine_type": "FUNCTION",
    "return_type": "internal",
    "routine_definition": null
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "gtrgm_same",
    "routine_type": "FUNCTION",
    "return_type": "internal",
    "routine_definition": null
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "gtrgm_union",
    "routine_type": "FUNCTION",
    "return_type": "USER-DEFINED",
    "routine_definition": null
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "log_data_changes",
    "routine_type": "FUNCTION",
    "return_type": "trigger",
    "routine_definition": "\nDECLARE\n    changes_json JSONB;\nBEGIN\n    -- Create changes JSON for UPDATE operations\n    IF TG_OP = 'UPDATE' THEN\n        changes_json = jsonb_build_object(\n            'before', row_to_json(OLD),\n            'after', row_to_json(NEW)\n        );\n    ELSIF TG_OP = 'INSERT' THEN\n        changes_json = jsonb_build_object(\n            'after', row_to_json(NEW)\n        );\n    ELSIF TG_OP = 'DELETE' THEN\n        changes_json = jsonb_build_object(\n            'before', row_to_json(OLD)\n        );\n    END IF;\n    \n    -- Insert audit log\n    INSERT INTO audit_logs (\n        user_id,\n        action,\n        entity_type,\n        entity_id,\n        changes,\n        created_at\n    ) VALUES (\n        auth.uid(),\n        TG_OP,\n        TG_TABLE_NAME,\n        CASE \n            WHEN TG_OP = 'DELETE' THEN OLD.id\n            ELSE NEW.id\n        END,\n        changes_json,\n        NOW()\n    );\n    \n    RETURN CASE TG_OP\n        WHEN 'DELETE' THEN OLD\n        ELSE NEW\n    END;\nEND;\n"
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "mark_onboarding_complete",
    "routine_type": "FUNCTION",
    "return_type": "void",
    "routine_definition": "\nBEGIN\n  UPDATE profiles\n    SET onboarding_completed = TRUE,\n        onboarding_skipped = FALSE,\n        onboarding_completed_at = NOW()\n    WHERE id = user_id;\nEND;\n"
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "process_webhook_event",
    "routine_type": "FUNCTION",
    "return_type": "trigger",
    "routine_definition": "\nBEGIN\n    -- Mark event as processed\n    NEW.processed = true;\n    NEW.processed_at = NOW();\n    \n    -- Additional webhook processing logic would go here\n    \n    RETURN NEW;\nEND;\n"
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "save_onboarding_response",
    "routine_type": "FUNCTION",
    "return_type": "uuid",
    "routine_definition": "\nDECLARE\n  response_id UUID;\nBEGIN\n  -- Upsert: if a response exists, update; else insert\n  INSERT INTO onboarding_responses (\n    user_id, business_name, business_type, team_size, monthly_conversations,\n    primary_goals, experience_level, pain_points, current_tools\n  ) VALUES (\n    user_id, business_name, business_type, team_size, monthly_conversations,\n    primary_goals, experience_level, pain_points, current_tools\n  )\n  ON CONFLICT (user_id) DO UPDATE SET\n    business_name = EXCLUDED.business_name,\n    business_type = EXCLUDED.business_type,\n    team_size = EXCLUDED.team_size,\n    monthly_conversations = EXCLUDED.monthly_conversations,\n    primary_goals = EXCLUDED.primary_goals,\n    experience_level = EXCLUDED.experience_level,\n    pain_points = EXCLUDED.pain_points,\n    current_tools = EXCLUDED.current_tools,\n    created_at = NOW()\n  RETURNING id INTO response_id;\n\n  RETURN response_id;\nEND;\n"
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "set_limit",
    "routine_type": "FUNCTION",
    "return_type": "real",
    "routine_definition": null
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "set_word_count",
    "routine_type": "FUNCTION",
    "return_type": "trigger",
    "routine_definition": "\nBEGIN\n    NEW.word_count = calculate_word_count(NEW.content);\n    RETURN NEW;\nEND;\n"
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "show_limit",
    "routine_type": "FUNCTION",
    "return_type": "real",
    "routine_definition": null
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "show_trgm",
    "routine_type": "FUNCTION",
    "return_type": "ARRAY",
    "routine_definition": null
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "similarity",
    "routine_type": "FUNCTION",
    "return_type": "real",
    "routine_definition": null
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "similarity_dist",
    "routine_type": "FUNCTION",
    "return_type": "real",
    "routine_definition": null
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "similarity_op",
    "routine_type": "FUNCTION",
    "return_type": "boolean",
    "routine_definition": null
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "strict_word_similarity",
    "routine_type": "FUNCTION",
    "return_type": "real",
    "routine_definition": null
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "strict_word_similarity_commutator_op",
    "routine_type": "FUNCTION",
    "return_type": "boolean",
    "routine_definition": null
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "strict_word_similarity_dist_commutator_op",
    "routine_type": "FUNCTION",
    "return_type": "real",
    "routine_definition": null
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "strict_word_similarity_dist_op",
    "routine_type": "FUNCTION",
    "return_type": "real",
    "routine_definition": null
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "strict_word_similarity_op",
    "routine_type": "FUNCTION",
    "return_type": "boolean",
    "routine_definition": null
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "track_canned_response_usage",
    "routine_type": "FUNCTION",
    "return_type": "trigger",
    "routine_definition": "\nBEGIN\n    -- This would be called when a canned response is used\n    -- Implementation depends on how canned responses are tracked in messages\n    RETURN NEW;\nEND;\n"
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "update_agent_chat_count",
    "routine_type": "FUNCTION",
    "return_type": "trigger",
    "routine_definition": "\nBEGIN\n    -- Handle conversation closure\n    IF OLD.status IN ('active', 'escalated') AND NEW.status IN ('resolved', 'closed') THEN\n        IF OLD.assigned_agent_id IS NOT NULL THEN\n            UPDATE agent_availability\n            SET current_chat_count = GREATEST(current_chat_count - 1, 0)\n            WHERE agent_id = OLD.assigned_agent_id;\n        END IF;\n    END IF;\n    \n    -- Handle conversation reopening\n    IF OLD.status IN ('resolved', 'closed') AND NEW.status IN ('active', 'escalated') THEN\n        IF NEW.assigned_agent_id IS NOT NULL THEN\n            UPDATE agent_availability\n            SET current_chat_count = current_chat_count + 1\n            WHERE agent_id = NEW.assigned_agent_id;\n        END IF;\n    END IF;\n    \n    -- Handle agent transfer\n    IF OLD.assigned_agent_id IS NOT NULL AND NEW.assigned_agent_id IS NOT NULL \n       AND OLD.assigned_agent_id != NEW.assigned_agent_id THEN\n        -- Decrease count for old agent\n        UPDATE agent_availability\n        SET current_chat_count = GREATEST(current_chat_count - 1, 0)\n        WHERE agent_id = OLD.assigned_agent_id;\n        \n        -- Increase count for new agent\n        UPDATE agent_availability\n        SET current_chat_count = current_chat_count + 1\n        WHERE agent_id = NEW.assigned_agent_id;\n    END IF;\n    \n    RETURN NEW;\nEND;\n"
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "update_conversation_analytics",
    "routine_type": "FUNCTION",
    "return_type": "trigger",
    "routine_definition": "\nBEGIN\n    IF TG_OP = 'INSERT' THEN\n        UPDATE conversation_analytics\n        SET total_messages = total_messages + 1,\n            customer_messages = CASE WHEN NEW.sender_type = 'user' THEN customer_messages + 1 ELSE customer_messages END,\n            ai_messages = CASE WHEN NEW.sender_type = 'ai' THEN ai_messages + 1 ELSE ai_messages END,\n            agent_messages = CASE WHEN NEW.sender_type = 'agent' THEN agent_messages + 1 ELSE agent_messages END\n        WHERE conversation_id = NEW.conversation_id;\n        \n        RETURN NEW;\n    END IF;\n    \n    IF TG_OP = 'DELETE' THEN\n        UPDATE conversation_analytics\n        SET total_messages = GREATEST(total_messages - 1, 0),\n            customer_messages = CASE WHEN OLD.sender_type = 'user' THEN GREATEST(customer_messages - 1, 0) ELSE customer_messages END,\n            ai_messages = CASE WHEN OLD.sender_type = 'ai' THEN GREATEST(ai_messages - 1, 0) ELSE ai_messages END,\n            agent_messages = CASE WHEN OLD.sender_type = 'agent' THEN GREATEST(agent_messages - 1, 0) ELSE agent_messages END\n        WHERE conversation_id = OLD.conversation_id;\n        \n        RETURN OLD;\n    END IF;\n    \n    RETURN NULL;\nEND;\n"
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "update_conversation_message_count",
    "routine_type": "FUNCTION",
    "return_type": "trigger",
    "routine_definition": "\nBEGIN\n    IF TG_OP = 'INSERT' THEN\n        UPDATE conversations \n        SET message_count = message_count + 1,\n            last_message_at = NEW.created_at,\n            last_message = LEFT(NEW.content, 200)\n        WHERE id = NEW.conversation_id;\n        \n        RETURN NEW;\n    END IF;\n    \n    IF TG_OP = 'DELETE' THEN\n        UPDATE conversations \n        SET message_count = GREATEST(message_count - 1, 0)\n        WHERE id = OLD.conversation_id;\n        \n        -- Update last_message and last_message_at\n        UPDATE conversations \n        SET last_message = (\n            SELECT LEFT(content, 200) \n            FROM messages \n            WHERE conversation_id = OLD.conversation_id \n            ORDER BY created_at DESC \n            LIMIT 1\n        ),\n        last_message_at = (\n            SELECT created_at \n            FROM messages \n            WHERE conversation_id = OLD.conversation_id \n            ORDER BY created_at DESC \n            LIMIT 1\n        )\n        WHERE id = OLD.conversation_id;\n        \n        RETURN OLD;\n    END IF;\n    \n    RETURN NULL;\nEND;\n"
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "update_customer_stats",
    "routine_type": "FUNCTION",
    "return_type": "trigger",
    "routine_definition": "\nBEGIN\n    IF TG_OP = 'INSERT' THEN\n        UPDATE customer_profiles\n        SET total_conversations = total_conversations + 1,\n            last_interaction = NEW.created_at\n        WHERE id = NEW.customer_id;\n        \n        RETURN NEW;\n    END IF;\n    \n    IF TG_OP = 'UPDATE' THEN\n        -- Update satisfaction score if changed\n        IF OLD.satisfaction_score IS NULL AND NEW.satisfaction_score IS NOT NULL THEN\n            UPDATE customer_profiles\n            SET avg_satisfaction = (\n                SELECT AVG(satisfaction_score)\n                FROM conversations\n                WHERE customer_id = NEW.customer_id\n                AND satisfaction_score IS NOT NULL\n            )\n            WHERE id = NEW.customer_id;\n        END IF;\n        \n        RETURN NEW;\n    END IF;\n    \n    RETURN NULL;\nEND;\n"
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "update_knowledge_usage",
    "routine_type": "FUNCTION",
    "return_type": "trigger",
    "routine_definition": "\nBEGIN\n    IF TG_OP = 'INSERT' THEN\n        UPDATE knowledge_items\n        SET usage_count = usage_count + 1\n        WHERE id = NEW.knowledge_item_id;\n        \n        RETURN NEW;\n    END IF;\n    \n    RETURN NULL;\nEND;\n"
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "update_scan_job_progress",
    "routine_type": "FUNCTION",
    "return_type": "trigger",
    "routine_definition": "\nBEGIN\n    -- Update progress percentage based on pages processed vs pages found\n    IF NEW.pages_found > 0 THEN\n        NEW.progress_percentage = (NEW.pages_processed::DECIMAL / NEW.pages_found::DECIMAL * 100)::INTEGER;\n    END IF;\n    \n    -- Update status based on progress\n    IF NEW.progress_percentage = 100 THEN\n        NEW.status = 'completed';\n        NEW.completed_at = NOW();\n    ELSIF NEW.progress_percentage > 0 THEN\n        NEW.status = 'scanning';\n        IF NEW.started_at IS NULL THEN\n            NEW.started_at = NOW();\n        END IF;\n    END IF;\n    \n    RETURN NEW;\nEND;\n"
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "update_updated_at_column",
    "routine_type": "FUNCTION",
    "return_type": "trigger",
    "routine_definition": "\nBEGIN\n    NEW.updated_at = NOW();\n    RETURN NEW;\nEND;\n"
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "word_similarity",
    "routine_type": "FUNCTION",
    "return_type": "real",
    "routine_definition": null
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "word_similarity_commutator_op",
    "routine_type": "FUNCTION",
    "return_type": "boolean",
    "routine_definition": null
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "word_similarity_dist_commutator_op",
    "routine_type": "FUNCTION",
    "return_type": "real",
    "routine_definition": null
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "word_similarity_dist_op",
    "routine_type": "FUNCTION",
    "return_type": "real",
    "routine_definition": null
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "word_similarity_op",
    "routine_type": "FUNCTION",
    "return_type": "boolean",
    "routine_definition": null
  }
]" 
9. "[
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "update_agent_availability_updated_at",
    "event_manipulation": "UPDATE",
    "event_object_table": "agent_availability",
    "action_statement": "EXECUTE FUNCTION update_updated_at_column()",
    "action_timing": "BEFORE",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "trigger_update_agent_work_logs_updated_at",
    "event_manipulation": "UPDATE",
    "event_object_table": "agent_work_logs",
    "action_statement": "EXECUTE FUNCTION update_updated_at_column()",
    "action_timing": "BEFORE",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "update_canned_responses_updated_at",
    "event_manipulation": "UPDATE",
    "event_object_table": "canned_responses",
    "action_statement": "EXECUTE FUNCTION update_updated_at_column()",
    "action_timing": "BEFORE",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "trigger_auto_assign_conversation",
    "event_manipulation": "INSERT",
    "event_object_table": "conversations",
    "action_statement": "EXECUTE FUNCTION auto_assign_conversation()",
    "action_timing": "BEFORE",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "trigger_create_conversation_analytics",
    "event_manipulation": "INSERT",
    "event_object_table": "conversations",
    "action_statement": "EXECUTE FUNCTION create_conversation_analytics()",
    "action_timing": "AFTER",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "trigger_finalize_conversation_analytics",
    "event_manipulation": "UPDATE",
    "event_object_table": "conversations",
    "action_statement": "EXECUTE FUNCTION finalize_conversation_analytics()",
    "action_timing": "AFTER",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "trigger_update_agent_chat_count",
    "event_manipulation": "UPDATE",
    "event_object_table": "conversations",
    "action_statement": "EXECUTE FUNCTION update_agent_chat_count()",
    "action_timing": "AFTER",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "trigger_update_conversations_updated_at",
    "event_manipulation": "UPDATE",
    "event_object_table": "conversations",
    "action_statement": "EXECUTE FUNCTION update_updated_at_column()",
    "action_timing": "BEFORE",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "trigger_update_customer_stats",
    "event_manipulation": "UPDATE",
    "event_object_table": "conversations",
    "action_statement": "EXECUTE FUNCTION update_customer_stats()",
    "action_timing": "AFTER",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "trigger_update_customer_stats",
    "event_manipulation": "INSERT",
    "event_object_table": "conversations",
    "action_statement": "EXECUTE FUNCTION update_customer_stats()",
    "action_timing": "AFTER",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "update_conversations_updated_at",
    "event_manipulation": "UPDATE",
    "event_object_table": "conversations",
    "action_statement": "EXECUTE FUNCTION update_updated_at_column()",
    "action_timing": "BEFORE",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "trigger_update_customer_profiles_updated_at",
    "event_manipulation": "UPDATE",
    "event_object_table": "customer_profiles",
    "action_statement": "EXECUTE FUNCTION update_updated_at_column()",
    "action_timing": "BEFORE",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "update_customer_profiles_updated_at",
    "event_manipulation": "UPDATE",
    "event_object_table": "customer_profiles",
    "action_statement": "EXECUTE FUNCTION update_updated_at_column()",
    "action_timing": "BEFORE",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "set_word_count_trigger",
    "event_manipulation": "UPDATE",
    "event_object_table": "extracted_content",
    "action_statement": "EXECUTE FUNCTION set_word_count()",
    "action_timing": "BEFORE",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "set_word_count_trigger",
    "event_manipulation": "INSERT",
    "event_object_table": "extracted_content",
    "action_statement": "EXECUTE FUNCTION set_word_count()",
    "action_timing": "BEFORE",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "trigger_calculate_knowledge_effectiveness",
    "event_manipulation": "INSERT",
    "event_object_table": "knowledge_analytics",
    "action_statement": "EXECUTE FUNCTION calculate_knowledge_effectiveness()",
    "action_timing": "AFTER",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "trigger_calculate_knowledge_effectiveness",
    "event_manipulation": "UPDATE",
    "event_object_table": "knowledge_analytics",
    "action_statement": "EXECUTE FUNCTION calculate_knowledge_effectiveness()",
    "action_timing": "AFTER",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "trigger_update_knowledge_usage",
    "event_manipulation": "INSERT",
    "event_object_table": "knowledge_analytics",
    "action_statement": "EXECUTE FUNCTION update_knowledge_usage()",
    "action_timing": "AFTER",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "trigger_update_knowledge_categories_updated_at",
    "event_manipulation": "UPDATE",
    "event_object_table": "knowledge_categories",
    "action_statement": "EXECUTE FUNCTION update_updated_at_column()",
    "action_timing": "BEFORE",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "trigger_create_knowledge_version",
    "event_manipulation": "UPDATE",
    "event_object_table": "knowledge_items",
    "action_statement": "EXECUTE FUNCTION create_knowledge_version()",
    "action_timing": "AFTER",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "trigger_update_knowledge_items_updated_at",
    "event_manipulation": "UPDATE",
    "event_object_table": "knowledge_items",
    "action_statement": "EXECUTE FUNCTION update_updated_at_column()",
    "action_timing": "BEFORE",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "update_knowledge_items_updated_at",
    "event_manipulation": "UPDATE",
    "event_object_table": "knowledge_items",
    "action_statement": "EXECUTE FUNCTION update_updated_at_column()",
    "action_timing": "BEFORE",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "trigger_update_conversation_analytics",
    "event_manipulation": "DELETE",
    "event_object_table": "messages",
    "action_statement": "EXECUTE FUNCTION update_conversation_analytics()",
    "action_timing": "AFTER",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "trigger_update_conversation_analytics",
    "event_manipulation": "INSERT",
    "event_object_table": "messages",
    "action_statement": "EXECUTE FUNCTION update_conversation_analytics()",
    "action_timing": "AFTER",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "trigger_update_conversation_message_count",
    "event_manipulation": "DELETE",
    "event_object_table": "messages",
    "action_statement": "EXECUTE FUNCTION update_conversation_message_count()",
    "action_timing": "AFTER",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "trigger_update_conversation_message_count",
    "event_manipulation": "INSERT",
    "event_object_table": "messages",
    "action_statement": "EXECUTE FUNCTION update_conversation_message_count()",
    "action_timing": "AFTER",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "trigger_update_messages_updated_at",
    "event_manipulation": "UPDATE",
    "event_object_table": "messages",
    "action_statement": "EXECUTE FUNCTION update_updated_at_column()",
    "action_timing": "BEFORE",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "update_messages_updated_at",
    "event_manipulation": "UPDATE",
    "event_object_table": "messages",
    "action_statement": "EXECUTE FUNCTION update_updated_at_column()",
    "action_timing": "BEFORE",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "trigger_update_profiles_updated_at",
    "event_manipulation": "UPDATE",
    "event_object_table": "profiles",
    "action_statement": "EXECUTE FUNCTION update_updated_at_column()",
    "action_timing": "BEFORE",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "update_profiles_updated_at",
    "event_manipulation": "UPDATE",
    "event_object_table": "profiles",
    "action_statement": "EXECUTE FUNCTION update_updated_at_column()",
    "action_timing": "BEFORE",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "trigger_update_user_agents_updated_at",
    "event_manipulation": "UPDATE",
    "event_object_table": "user_agents",
    "action_statement": "EXECUTE FUNCTION update_updated_at_column()",
    "action_timing": "BEFORE",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "update_scan_job_progress_trigger",
    "event_manipulation": "UPDATE",
    "event_object_table": "website_scan_jobs",
    "action_statement": "EXECUTE FUNCTION update_scan_job_progress()",
    "action_timing": "BEFORE",
    "action_orientation": "ROW"
  }
]" 
10.  "[
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "agent_availability",
    "policyname": "Agents can manage own availability",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.uid() = agent_id)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "agent_availability",
    "policyname": "Allow viewing all agent availability",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(auth.role() = 'authenticated'::text)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "agent_work_logs",
    "policyname": "Users can delete their own agent work logs",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "DELETE",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "agent_work_logs",
    "policyname": "Users can insert their own agent work logs",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(auth.uid() = user_id)"
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "agent_work_logs",
    "policyname": "Users can update their own agent work logs",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "agent_work_logs",
    "policyname": "Users can view their own agent work logs",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "audit_logs",
    "policyname": "Allow authenticated access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.role() = 'authenticated'::text)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "canned_responses",
    "policyname": "Allow managing own canned responses",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.uid() = created_by)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "canned_responses",
    "policyname": "Allow viewing public canned responses",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "((auth.role() = 'authenticated'::text) AND ((is_public = true) OR (created_by = auth.uid())))",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "communication_channels",
    "policyname": "Allow authenticated access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.role() = 'authenticated'::text)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "conversation_analytics",
    "policyname": "Allow authenticated access to conversation analytics",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.role() = 'authenticated'::text)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "conversation_context",
    "policyname": "Allow authenticated access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.role() = 'authenticated'::text)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "conversation_notes",
    "policyname": "Allow authenticated access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.role() = 'authenticated'::text)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "conversation_transfers",
    "policyname": "Allow authenticated access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.role() = 'authenticated'::text)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "conversations",
    "policyname": "Allow authenticated access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.role() = 'authenticated'::text)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "conversations",
    "policyname": "Allow authenticated access to conversations",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.role() = 'authenticated'::text)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "customer_channel_preferences",
    "policyname": "Allow authenticated access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.role() = 'authenticated'::text)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "customer_profiles",
    "policyname": "Allow authenticated access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.role() = 'authenticated'::text)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "customer_profiles",
    "policyname": "Allow authenticated access to customer profiles",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.role() = 'authenticated'::text)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "daily_metrics",
    "policyname": "Allow authenticated access to analytics",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(auth.role() = 'authenticated'::text)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "dashboard_configs",
    "policyname": "Allow managing own dashboards",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "extracted_content",
    "policyname": "Allow authenticated access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.role() = 'authenticated'::text)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "file_attachments",
    "policyname": "Allow authenticated access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.role() = 'authenticated'::text)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "integrations",
    "policyname": "Allow managing own integrations",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.uid() = created_by)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "intent_patterns",
    "policyname": "Allow authenticated access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.role() = 'authenticated'::text)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "knowledge_categories",
    "policyname": "Allow authenticated access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.role() = 'authenticated'::text)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "knowledge_categories",
    "policyname": "Allow authenticated access to knowledge categories",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.role() = 'authenticated'::text)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "knowledge_items",
    "policyname": "Allow authenticated access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.role() = 'authenticated'::text)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "knowledge_items",
    "policyname": "Allow authenticated access to knowledge items",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.role() = 'authenticated'::text)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "message_templates",
    "policyname": "Allow authenticated access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.role() = 'authenticated'::text)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "messages",
    "policyname": "Allow authenticated access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.role() = 'authenticated'::text)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "messages",
    "policyname": "Allow authenticated access to messages",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.role() = 'authenticated'::text)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "onboarding_responses",
    "policyname": "Users can delete their onboarding response",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "DELETE",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "onboarding_responses",
    "policyname": "Users can insert their onboarding response",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(auth.uid() = user_id)"
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "onboarding_responses",
    "policyname": "Users can update their onboarding response",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "onboarding_responses",
    "policyname": "Users can view their onboarding response",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "playground_sessions",
    "policyname": "Allow authenticated access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.role() = 'authenticated'::text)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "Users can create their own profile",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(auth.uid() = id)"
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "Users can update own onboarding status",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(auth.uid() = id)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "Users can update own profile",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(auth.uid() = id)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "Users can update their own profile",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(auth.uid() = id)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "Users can view own profile",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(auth.uid() = id)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "Users can view their own profile",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(auth.uid() = id)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "realtime_metrics",
    "policyname": "Allow authenticated access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.role() = 'authenticated'::text)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "scheduled_reports",
    "policyname": "Allow authenticated access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.role() = 'authenticated'::text)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "sla_tracking",
    "policyname": "Allow authenticated access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.role() = 'authenticated'::text)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "system_settings",
    "policyname": "Allow admin access to system settings",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND ((profiles.role)::text = 'admin'::text))))",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "user_agents",
    "policyname": "Users can delete their own agents",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "DELETE",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "user_agents",
    "policyname": "Users can insert their own agents",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(auth.uid() = user_id)"
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "user_agents",
    "policyname": "Users can update their own agents",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "user_agents",
    "policyname": "Users can view their own agents",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "webhook_events",
    "policyname": "Allow authenticated access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.role() = 'authenticated'::text)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "website_scan_jobs",
    "policyname": "Allow authenticated access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.role() = 'authenticated'::text)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "widget_configurations",
    "policyname": "Allow managing own widgets",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "workflow_executions",
    "policyname": "Allow authenticated access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.role() = 'authenticated'::text)",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "workflows",
    "policyname": "Allow managing own workflows",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  }
]" 
11.  "[
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "agent_availability",
    "inserts": 0,
    "updates": 0,
    "deletes": 0,
    "live_rows": 0,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "agent_work_logs",
    "inserts": 10,
    "updates": 0,
    "deletes": 0,
    "live_rows": 3,
    "dead_rows": 7,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "alert_history",
    "inserts": 0,
    "updates": 0,
    "deletes": 0,
    "live_rows": 0,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "alert_rules",
    "inserts": 0,
    "updates": 0,
    "deletes": 0,
    "live_rows": 0,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "audit_logs",
    "inserts": 0,
    "updates": 0,
    "deletes": 0,
    "live_rows": 0,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "auto_generated_knowledge",
    "inserts": 0,
    "updates": 0,
    "deletes": 0,
    "live_rows": 0,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "canned_responses",
    "inserts": 7,
    "updates": 0,
    "deletes": 0,
    "live_rows": 7,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "channel_routing_rules",
    "inserts": 6,
    "updates": 0,
    "deletes": 0,
    "live_rows": 6,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "chat_sessions",
    "inserts": 0,
    "updates": 0,
    "deletes": 0,
    "live_rows": 0,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "communication_channels",
    "inserts": 29,
    "updates": 0,
    "deletes": 0,
    "live_rows": 8,
    "dead_rows": 21,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "content_processing_queue",
    "inserts": 0,
    "updates": 0,
    "deletes": 0,
    "live_rows": 0,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "conversation_analytics",
    "inserts": 24,
    "updates": 48,
    "deletes": 0,
    "live_rows": 3,
    "dead_rows": 15,
    "last_vacuum": null,
    "last_autovacuum": "2025-07-12 13:50:50.169144+00",
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "conversation_context",
    "inserts": 0,
    "updates": 0,
    "deletes": 0,
    "live_rows": 0,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "conversation_notes",
    "inserts": 0,
    "updates": 0,
    "deletes": 0,
    "live_rows": 0,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "conversation_transfers",
    "inserts": 0,
    "updates": 0,
    "deletes": 0,
    "live_rows": 0,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "conversations",
    "inserts": 25,
    "updates": 51,
    "deletes": 1,
    "live_rows": 3,
    "dead_rows": 37,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "customer_channel_preferences",
    "inserts": 1,
    "updates": 0,
    "deletes": 1,
    "live_rows": 0,
    "dead_rows": 1,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "customer_profiles",
    "inserts": 34,
    "updates": 30,
    "deletes": 1,
    "live_rows": 6,
    "dead_rows": 46,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "daily_metrics",
    "inserts": 8,
    "updates": 0,
    "deletes": 0,
    "live_rows": 8,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "dashboard_configs",
    "inserts": 0,
    "updates": 0,
    "deletes": 0,
    "live_rows": 0,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "embeddings",
    "inserts": 0,
    "updates": 0,
    "deletes": 0,
    "live_rows": 0,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "export_jobs",
    "inserts": 0,
    "updates": 0,
    "deletes": 0,
    "live_rows": 0,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "extracted_content",
    "inserts": 7,
    "updates": 0,
    "deletes": 0,
    "live_rows": 7,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "file_attachments",
    "inserts": 0,
    "updates": 0,
    "deletes": 0,
    "live_rows": 0,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "integration_field_mappings",
    "inserts": 0,
    "updates": 0,
    "deletes": 0,
    "live_rows": 0,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "integrations",
    "inserts": 0,
    "updates": 0,
    "deletes": 0,
    "live_rows": 0,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "intent_patterns",
    "inserts": 0,
    "updates": 0,
    "deletes": 0,
    "live_rows": 0,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "knowledge_analytics",
    "inserts": 0,
    "updates": 0,
    "deletes": 0,
    "live_rows": 0,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "knowledge_base",
    "inserts": 0,
    "updates": 0,
    "deletes": 0,
    "live_rows": 0,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "knowledge_categories",
    "inserts": 24,
    "updates": 0,
    "deletes": 0,
    "live_rows": 4,
    "dead_rows": 20,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "knowledge_items",
    "inserts": 12,
    "updates": 7,
    "deletes": 0,
    "live_rows": 3,
    "dead_rows": 16,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "knowledge_versions",
    "inserts": 0,
    "updates": 0,
    "deletes": 0,
    "live_rows": 0,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "message_delivery_tracking",
    "inserts": 0,
    "updates": 0,
    "deletes": 0,
    "live_rows": 0,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "message_templates",
    "inserts": 6,
    "updates": 0,
    "deletes": 0,
    "live_rows": 6,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "messages",
    "inserts": 48,
    "updates": 0,
    "deletes": 0,
    "live_rows": 6,
    "dead_rows": 42,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "onboarding_responses",
    "inserts": 0,
    "updates": 0,
    "deletes": 0,
    "live_rows": 0,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "playground_sessions",
    "inserts": 0,
    "updates": 0,
    "deletes": 0,
    "live_rows": 0,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "profiles",
    "inserts": 6,
    "updates": 26,
    "deletes": 0,
    "live_rows": 3,
    "dead_rows": 10,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "realtime_metrics",
    "inserts": 5,
    "updates": 0,
    "deletes": 0,
    "live_rows": 5,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "scan_job_logs",
    "inserts": 9,
    "updates": 0,
    "deletes": 0,
    "live_rows": 9,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "scheduled_reports",
    "inserts": 0,
    "updates": 0,
    "deletes": 0,
    "live_rows": 0,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "sla_tracking",
    "inserts": 0,
    "updates": 0,
    "deletes": 0,
    "live_rows": 0,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "sync_jobs",
    "inserts": 0,
    "updates": 0,
    "deletes": 0,
    "live_rows": 0,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "system_settings",
    "inserts": 5,
    "updates": 0,
    "deletes": 0,
    "live_rows": 5,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "user_agents",
    "inserts": 24,
    "updates": 0,
    "deletes": 0,
    "live_rows": 3,
    "dead_rows": 21,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "webhook_events",
    "inserts": 0,
    "updates": 0,
    "deletes": 0,
    "live_rows": 0,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "webhook_logs",
    "inserts": 0,
    "updates": 0,
    "deletes": 0,
    "live_rows": 0,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "webhook_subscriptions",
    "inserts": 0,
    "updates": 0,
    "deletes": 0,
    "live_rows": 0,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "website_scan_jobs",
    "inserts": 7,
    "updates": 34,
    "deletes": 0,
    "live_rows": 7,
    "dead_rows": 11,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "widget_configurations",
    "inserts": 0,
    "updates": 0,
    "deletes": 0,
    "live_rows": 0,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "workflow_executions",
    "inserts": 0,
    "updates": 0,
    "deletes": 0,
    "live_rows": 0,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "workflows",
    "inserts": 0,
    "updates": 0,
    "deletes": 0,
    "live_rows": 0,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  }
]" 
12.  "[
  {
    "section": "=== EXTENSIONS ===",
    "extname": "pg_graphql",
    "extversion": "1.5.11",
    "extrelocatable": false,
    "schema": "graphql"
  },
  {
    "section": "=== EXTENSIONS ===",
    "extname": "pg_stat_statements",
    "extversion": "1.10",
    "extrelocatable": true,
    "schema": "extensions"
  },
  {
    "section": "=== EXTENSIONS ===",
    "extname": "pg_trgm",
    "extversion": "1.6",
    "extrelocatable": true,
    "schema": "public"
  },
  {
    "section": "=== EXTENSIONS ===",
    "extname": "pgcrypto",
    "extversion": "1.3",
    "extrelocatable": true,
    "schema": "extensions"
  },
  {
    "section": "=== EXTENSIONS ===",
    "extname": "plpgsql",
    "extversion": "1.0",
    "extrelocatable": false,
    "schema": "pg_catalog"
  },
  {
    "section": "=== EXTENSIONS ===",
    "extname": "supabase_vault",
    "extversion": "0.3.1",
    "extrelocatable": false,
    "schema": "vault"
  },
  {
    "section": "=== EXTENSIONS ===",
    "extname": "uuid-ossp",
    "extversion": "1.1",
    "extrelocatable": true,
    "schema": "extensions"
  },
  {
    "section": "=== EXTENSIONS ===",
    "extname": "vector",
    "extversion": "0.8.0",
    "extrelocatable": true,
    "schema": "extensions"
  }
]" 
13. "[
  {
    "section": "=== ENUM TYPES ===",
    "enum_name": "aal_level",
    "enum_value": "aal1",
    "enumsortorder": 1
  },
  {
    "section": "=== ENUM TYPES ===",
    "enum_name": "aal_level",
    "enum_value": "aal2",
    "enumsortorder": 2
  },
  {
    "section": "=== ENUM TYPES ===",
    "enum_name": "aal_level",
    "enum_value": "aal3",
    "enumsortorder": 3
  },
  {
    "section": "=== ENUM TYPES ===",
    "enum_name": "action",
    "enum_value": "INSERT",
    "enumsortorder": 1
  },
  {
    "section": "=== ENUM TYPES ===",
    "enum_name": "action",
    "enum_value": "UPDATE",
    "enumsortorder": 2
  },
  {
    "section": "=== ENUM TYPES ===",
    "enum_name": "action",
    "enum_value": "DELETE",
    "enumsortorder": 3
  },
  {
    "section": "=== ENUM TYPES ===",
    "enum_name": "action",
    "enum_value": "TRUNCATE",
    "enumsortorder": 4
  },
  {
    "section": "=== ENUM TYPES ===",
    "enum_name": "action",
    "enum_value": "ERROR",
    "enumsortorder": 5
  },
  {
    "section": "=== ENUM TYPES ===",
    "enum_name": "code_challenge_method",
    "enum_value": "s256",
    "enumsortorder": 1
  },
  {
    "section": "=== ENUM TYPES ===",
    "enum_name": "code_challenge_method",
    "enum_value": "plain",
    "enumsortorder": 2
  },
  {
    "section": "=== ENUM TYPES ===",
    "enum_name": "equality_op",
    "enum_value": "eq",
    "enumsortorder": 1
  },
  {
    "section": "=== ENUM TYPES ===",
    "enum_name": "equality_op",
    "enum_value": "neq",
    "enumsortorder": 2
  },
  {
    "section": "=== ENUM TYPES ===",
    "enum_name": "equality_op",
    "enum_value": "lt",
    "enumsortorder": 3
  },
  {
    "section": "=== ENUM TYPES ===",
    "enum_name": "equality_op",
    "enum_value": "lte",
    "enumsortorder": 4
  },
  {
    "section": "=== ENUM TYPES ===",
    "enum_name": "equality_op",
    "enum_value": "gt",
    "enumsortorder": 5
  },
  {
    "section": "=== ENUM TYPES ===",
    "enum_name": "equality_op",
    "enum_value": "gte",
    "enumsortorder": 6
  },
  {
    "section": "=== ENUM TYPES ===",
    "enum_name": "equality_op",
    "enum_value": "in",
    "enumsortorder": 7
  },
  {
    "section": "=== ENUM TYPES ===",
    "enum_name": "factor_status",
    "enum_value": "unverified",
    "enumsortorder": 1
  },
  {
    "section": "=== ENUM TYPES ===",
    "enum_name": "factor_status",
    "enum_value": "verified",
    "enumsortorder": 2
  },
  {
    "section": "=== ENUM TYPES ===",
    "enum_name": "factor_type",
    "enum_value": "totp",
    "enumsortorder": 1
  },
  {
    "section": "=== ENUM TYPES ===",
    "enum_name": "factor_type",
    "enum_value": "webauthn",
    "enumsortorder": 2
  },
  {
    "section": "=== ENUM TYPES ===",
    "enum_name": "factor_type",
    "enum_value": "phone",
    "enumsortorder": 3
  },
  {
    "section": "=== ENUM TYPES ===",
    "enum_name": "one_time_token_type",
    "enum_value": "confirmation_token",
    "enumsortorder": 1
  },
  {
    "section": "=== ENUM TYPES ===",
    "enum_name": "one_time_token_type",
    "enum_value": "reauthentication_token",
    "enumsortorder": 2
  },
  {
    "section": "=== ENUM TYPES ===",
    "enum_name": "one_time_token_type",
    "enum_value": "recovery_token",
    "enumsortorder": 3
  },
  {
    "section": "=== ENUM TYPES ===",
    "enum_name": "one_time_token_type",
    "enum_value": "email_change_token_new",
    "enumsortorder": 4
  },
  {
    "section": "=== ENUM TYPES ===",
    "enum_name": "one_time_token_type",
    "enum_value": "email_change_token_current",
    "enumsortorder": 5
  },
  {
    "section": "=== ENUM TYPES ===",
    "enum_name": "one_time_token_type",
    "enum_value": "phone_change_token",
    "enumsortorder": 6
  }
]"

14. "[
  {
    "section": "=== STORAGE BUCKETS ===",
    "id": "avatars",
    "name": "avatars",
    "owner": null,
    "created_at": "2025-07-15 23:46:52.239362+00",
    "updated_at": "2025-07-15 23:46:52.239362+00",
    "public": true,
    "avif_autodetection": false,
    "file_size_limit": 5242880,
    "allowed_mime_types": [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp"
    ]
  },
  {
    "section": "=== STORAGE BUCKETS ===",
    "id": "backups",
    "name": "backups",
    "owner": null,
    "created_at": "2025-07-15 23:46:52.239362+00",
    "updated_at": "2025-07-15 23:46:52.239362+00",
    "public": false,
    "avif_autodetection": false,
    "file_size_limit": 1073741824,
    "allowed_mime_types": [
      "application/gzip",
      "application/zip",
      "application/x-tar"
    ]
  },
  {
    "section": "=== STORAGE BUCKETS ===",
    "id": "brand-assets",
    "name": "brand-assets",
    "owner": null,
    "created_at": "2025-07-15 23:46:52.239362+00",
    "updated_at": "2025-07-15 23:46:52.239362+00",
    "public": true,
    "avif_autodetection": false,
    "file_size_limit": 10485760,
    "allowed_mime_types": [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml"
    ]
  },
  {
    "section": "=== STORAGE BUCKETS ===",
    "id": "chat-attachments",
    "name": "chat-attachments",
    "owner": null,
    "created_at": "2025-07-15 23:46:52.239362+00",
    "updated_at": "2025-07-15 23:46:52.239362+00",
    "public": false,
    "avif_autodetection": false,
    "file_size_limit": 52428800,
    "allowed_mime_types": [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]
  },
  {
    "section": "=== STORAGE BUCKETS ===",
    "id": "documents",
    "name": "documents",
    "owner": null,
    "created_at": "2025-07-15 23:46:52.239362+00",
    "updated_at": "2025-07-15 23:46:52.239362+00",
    "public": false,
    "avif_autodetection": false,
    "file_size_limit": 52428800,
    "allowed_mime_types": [
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/csv",
      "application/json"
    ]
  },
  {
    "section": "=== STORAGE BUCKETS ===",
    "id": "logos",
    "name": "logos",
    "owner": null,
    "created_at": "2025-07-15 23:46:52.239362+00",
    "updated_at": "2025-07-15 23:46:52.239362+00",
    "public": true,
    "avif_autodetection": false,
    "file_size_limit": 10485760,
    "allowed_mime_types": [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml"
    ]
  },
  {
    "section": "=== STORAGE BUCKETS ===",
    "id": "personality-avatars",
    "name": "personality-avatars",
    "owner": null,
    "created_at": "2025-07-15 23:46:52.239362+00",
    "updated_at": "2025-07-15 23:46:52.239362+00",
    "public": true,
    "avif_autodetection": false,
    "file_size_limit": 5242880,
    "allowed_mime_types": [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp"
    ]
  },
  {
    "section": "=== STORAGE BUCKETS ===",
    "id": "training-data",
    "name": "training-data",
    "owner": null,
    "created_at": "2025-07-15 23:46:52.239362+00",
    "updated_at": "2025-07-15 23:46:52.239362+00",
    "public": false,
    "avif_autodetection": false,
    "file_size_limit": 104857600,
    "allowed_mime_types": [
      "application/json",
      "text/plain",
      "text/csv",
      "application/xml"
    ]
  }
]" 


16. Success. No rows returned 
17. Success. No rows returned 
18. "[
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "extracted_content",
    "total_size": "464 kB",
    "table_size": "16 kB",
    "index_size": "448 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "messages",
    "total_size": "208 kB",
    "table_size": "16 kB",
    "index_size": "192 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "conversations",
    "total_size": "192 kB",
    "table_size": "8192 bytes",
    "index_size": "184 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "knowledge_items",
    "total_size": "152 kB",
    "table_size": "8192 bytes",
    "index_size": "144 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "daily_metrics",
    "total_size": "120 kB",
    "table_size": "8192 bytes",
    "index_size": "112 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "agent_work_logs",
    "total_size": "112 kB",
    "table_size": "8192 bytes",
    "index_size": "104 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "user_agents",
    "total_size": "112 kB",
    "table_size": "8192 bytes",
    "index_size": "104 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "conversation_analytics",
    "total_size": "104 kB",
    "table_size": "8192 bytes",
    "index_size": "96 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "customer_profiles",
    "total_size": "96 kB",
    "table_size": "8192 bytes",
    "index_size": "88 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "canned_responses",
    "total_size": "80 kB",
    "table_size": "8192 bytes",
    "index_size": "72 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "realtime_metrics",
    "total_size": "80 kB",
    "table_size": "8192 bytes",
    "index_size": "72 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "website_scan_jobs",
    "total_size": "64 kB",
    "table_size": "8192 bytes",
    "index_size": "56 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "message_templates",
    "total_size": "64 kB",
    "table_size": "8192 bytes",
    "index_size": "56 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "knowledge_categories",
    "total_size": "64 kB",
    "table_size": "8192 bytes",
    "index_size": "56 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "customer_channel_preferences",
    "total_size": "56 kB",
    "table_size": "8192 bytes",
    "index_size": "48 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "system_settings",
    "total_size": "48 kB",
    "table_size": "8192 bytes",
    "index_size": "40 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "channel_routing_rules",
    "total_size": "48 kB",
    "table_size": "8192 bytes",
    "index_size": "40 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "scan_job_logs",
    "total_size": "48 kB",
    "table_size": "8192 bytes",
    "index_size": "40 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "communication_channels",
    "total_size": "48 kB",
    "table_size": "8192 bytes",
    "index_size": "40 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "webhook_events",
    "total_size": "40 kB",
    "table_size": "0 bytes",
    "index_size": "40 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "agent_availability",
    "total_size": "40 kB",
    "table_size": "0 bytes",
    "index_size": "40 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "alert_rules",
    "total_size": "32 kB",
    "table_size": "0 bytes",
    "index_size": "32 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "conversation_transfers",
    "total_size": "32 kB",
    "table_size": "0 bytes",
    "index_size": "32 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "message_delivery_tracking",
    "total_size": "32 kB",
    "table_size": "0 bytes",
    "index_size": "32 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "scheduled_reports",
    "total_size": "32 kB",
    "table_size": "0 bytes",
    "index_size": "32 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "export_jobs",
    "total_size": "32 kB",
    "table_size": "0 bytes",
    "index_size": "32 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "sla_tracking",
    "total_size": "32 kB",
    "table_size": "0 bytes",
    "index_size": "32 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "profiles",
    "total_size": "32 kB",
    "table_size": "8192 bytes",
    "index_size": "24 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "auto_generated_knowledge",
    "total_size": "24 kB",
    "table_size": "0 bytes",
    "index_size": "24 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "integrations",
    "total_size": "24 kB",
    "table_size": "0 bytes",
    "index_size": "24 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "workflow_executions",
    "total_size": "24 kB",
    "table_size": "0 bytes",
    "index_size": "24 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "dashboard_configs",
    "total_size": "24 kB",
    "table_size": "0 bytes",
    "index_size": "24 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "conversation_context",
    "total_size": "24 kB",
    "table_size": "0 bytes",
    "index_size": "24 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "content_processing_queue",
    "total_size": "24 kB",
    "table_size": "0 bytes",
    "index_size": "24 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "widget_configurations",
    "total_size": "24 kB",
    "table_size": "0 bytes",
    "index_size": "24 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "sync_jobs",
    "total_size": "16 kB",
    "table_size": "0 bytes",
    "index_size": "16 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "integration_field_mappings",
    "total_size": "16 kB",
    "table_size": "0 bytes",
    "index_size": "16 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "onboarding_responses",
    "total_size": "16 kB",
    "table_size": "0 bytes",
    "index_size": "16 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "knowledge_analytics",
    "total_size": "16 kB",
    "table_size": "0 bytes",
    "index_size": "16 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "knowledge_versions",
    "total_size": "16 kB",
    "table_size": "0 bytes",
    "index_size": "16 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "file_attachments",
    "total_size": "16 kB",
    "table_size": "0 bytes",
    "index_size": "16 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "conversation_notes",
    "total_size": "16 kB",
    "table_size": "0 bytes",
    "index_size": "16 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "audit_logs",
    "total_size": "16 kB",
    "table_size": "0 bytes",
    "index_size": "16 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "embeddings",
    "total_size": "16 kB",
    "table_size": "0 bytes",
    "index_size": "16 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "knowledge_base",
    "total_size": "16 kB",
    "table_size": "0 bytes",
    "index_size": "16 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "alert_history",
    "total_size": "16 kB",
    "table_size": "0 bytes",
    "index_size": "16 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "chat_sessions",
    "total_size": "16 kB",
    "table_size": "0 bytes",
    "index_size": "16 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "intent_patterns",
    "total_size": "16 kB",
    "table_size": "0 bytes",
    "index_size": "16 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "workflows",
    "total_size": "16 kB",
    "table_size": "0 bytes",
    "index_size": "16 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "webhook_logs",
    "total_size": "16 kB",
    "table_size": "0 bytes",
    "index_size": "16 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "playground_sessions",
    "total_size": "16 kB",
    "table_size": "0 bytes",
    "index_size": "16 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "webhook_subscriptions",
    "total_size": "16 kB",
    "table_size": "0 bytes",
    "index_size": "16 kB"
  }
]" 
19. "[
  {
    "section": "=== ANALYSIS COMPLETE ===",
    "timestamp": "2025-07-17 13:19:55.581858+00"
  }
]"
