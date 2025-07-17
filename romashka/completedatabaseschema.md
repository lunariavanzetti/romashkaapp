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
    is_nullable = 'YES' as is_nullable,
    data_type,
    character_maximum_length,
    numeric_precision,
    numeric_scale,
    datetime_precision,
    is_identity = 'YES' as is_identity,
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
    relname as tablename,
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
ORDER BY relname;

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
    domain_default
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


answers 
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
    "table_name": "ai_response_queue",
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
    "table_name": "knowledge_gaps",
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
    "table_name": "learning_insights",
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
    "table_name": "pattern_recognition",
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
    "table_name": "template_ab_tests",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "template_analytics",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "template_categories",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "template_optimization",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "template_performance_metrics",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "template_suggestions",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "template_triggers",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "template_usage_history",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "template_variables",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "templates",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "training_datasets",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "training_jobs",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "training_metrics_history",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "training_results",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "training_scenarios",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES",
    "is_typed": "NO",
    "commit_action": null
  },
  {
    "section": "=== ALL TABLES ===",
    "table_name": "training_sessions",
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
    "is_nullable": false,
    "data_type": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_availability",
    "column_name": "agent_id",
    "ordinal_position": 2,
    "column_default": null,
    "is_nullable": false,
    "data_type": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_availability",
    "column_name": "is_online",
    "ordinal_position": 3,
    "column_default": "false",
    "is_nullable": true,
    "data_type": "boolean",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_availability",
    "column_name": "status",
    "ordinal_position": 4,
    "column_default": "'available'::character varying",
    "is_nullable": true,
    "data_type": "character varying",
    "character_maximum_length": 50,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_availability",
    "column_name": "max_concurrent_chats",
    "ordinal_position": 5,
    "column_default": "5",
    "is_nullable": true,
    "data_type": "integer",
    "character_maximum_length": null,
    "numeric_precision": 32,
    "numeric_scale": 0,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_availability",
    "column_name": "current_chat_count",
    "ordinal_position": 6,
    "column_default": "0",
    "is_nullable": true,
    "data_type": "integer",
    "character_maximum_length": null,
    "numeric_precision": 32,
    "numeric_scale": 0,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_availability",
    "column_name": "last_activity",
    "ordinal_position": 7,
    "column_default": "now()",
    "is_nullable": true,
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": 6,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_availability",
    "column_name": "auto_away_time",
    "ordinal_position": 8,
    "column_default": "300",
    "is_nullable": true,
    "data_type": "integer",
    "character_maximum_length": null,
    "numeric_precision": 32,
    "numeric_scale": 0,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_availability",
    "column_name": "created_at",
    "ordinal_position": 9,
    "column_default": "now()",
    "is_nullable": true,
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": 6,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_availability",
    "column_name": "updated_at",
    "ordinal_position": 10,
    "column_default": "now()",
    "is_nullable": true,
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": 6,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_availability",
    "column_name": "working_hours",
    "ordinal_position": 11,
    "column_default": "'{\"friday\": {\"end\": \"17:00\", \"start\": \"09:00\"}, \"monday\": {\"end\": \"17:00\", \"start\": \"09:00\"}, \"tuesday\": {\"end\": \"17:00\", \"start\": \"09:00\"}, \"thursday\": {\"end\": \"17:00\", \"start\": \"09:00\"}, \"wednesday\": {\"end\": \"17:00\", \"start\": \"09:00\"}}'::jsonb",
    "is_nullable": true,
    "data_type": "jsonb",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_performance_metrics",
    "column_name": "user_id",
    "ordinal_position": 1,
    "column_default": null,
    "is_nullable": true,
    "data_type": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_performance_metrics",
    "column_name": "agent_id",
    "ordinal_position": 2,
    "column_default": null,
    "is_nullable": true,
    "data_type": "character varying",
    "character_maximum_length": 255,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_performance_metrics",
    "column_name": "agent_name",
    "ordinal_position": 3,
    "column_default": null,
    "is_nullable": true,
    "data_type": "character varying",
    "character_maximum_length": 255,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_performance_metrics",
    "column_name": "total_tasks",
    "ordinal_position": 4,
    "column_default": null,
    "is_nullable": true,
    "data_type": "bigint",
    "character_maximum_length": null,
    "numeric_precision": 64,
    "numeric_scale": 0,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_performance_metrics",
    "column_name": "completed_tasks",
    "ordinal_position": 5,
    "column_default": null,
    "is_nullable": true,
    "data_type": "bigint",
    "character_maximum_length": null,
    "numeric_precision": 64,
    "numeric_scale": 0,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_performance_metrics",
    "column_name": "failed_tasks",
    "ordinal_position": 6,
    "column_default": null,
    "is_nullable": true,
    "data_type": "bigint",
    "character_maximum_length": null,
    "numeric_precision": 64,
    "numeric_scale": 0,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_performance_metrics",
    "column_name": "in_progress_tasks",
    "ordinal_position": 7,
    "column_default": null,
    "is_nullable": true,
    "data_type": "bigint",
    "character_maximum_length": null,
    "numeric_precision": 64,
    "numeric_scale": 0,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_performance_metrics",
    "column_name": "avg_execution_time_ms",
    "ordinal_position": 8,
    "column_default": null,
    "is_nullable": true,
    "data_type": "numeric",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_performance_metrics",
    "column_name": "min_execution_time_ms",
    "ordinal_position": 9,
    "column_default": null,
    "is_nullable": true,
    "data_type": "integer",
    "character_maximum_length": null,
    "numeric_precision": 32,
    "numeric_scale": 0,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_performance_metrics",
    "column_name": "max_execution_time_ms",
    "ordinal_position": 10,
    "column_default": null,
    "is_nullable": true,
    "data_type": "integer",
    "character_maximum_length": null,
    "numeric_precision": 32,
    "numeric_scale": 0,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_performance_metrics",
    "column_name": "success_rate",
    "ordinal_position": 11,
    "column_default": null,
    "is_nullable": true,
    "data_type": "double precision",
    "character_maximum_length": null,
    "numeric_precision": 53,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_performance_metrics",
    "column_name": "failure_rate",
    "ordinal_position": 12,
    "column_default": null,
    "is_nullable": true,
    "data_type": "double precision",
    "character_maximum_length": null,
    "numeric_precision": 53,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_performance_metrics",
    "column_name": "last_activity",
    "ordinal_position": 13,
    "column_default": null,
    "is_nullable": true,
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": 6,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_performance_metrics",
    "column_name": "task_types_handled",
    "ordinal_position": 14,
    "column_default": null,
    "is_nullable": true,
    "data_type": "bigint",
    "character_maximum_length": null,
    "numeric_precision": 64,
    "numeric_scale": 0,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_performance_metrics",
    "column_name": "last_task_date",
    "ordinal_position": 15,
    "column_default": null,
    "is_nullable": true,
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": 6,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_work_logs",
    "column_name": "id",
    "ordinal_position": 1,
    "column_default": "gen_random_uuid()",
    "is_nullable": false,
    "data_type": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_work_logs",
    "column_name": "agent_id",
    "ordinal_position": 2,
    "column_default": null,
    "is_nullable": false,
    "data_type": "character varying",
    "character_maximum_length": 255,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_work_logs",
    "column_name": "agent_name",
    "ordinal_position": 3,
    "column_default": null,
    "is_nullable": false,
    "data_type": "character varying",
    "character_maximum_length": 255,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_work_logs",
    "column_name": "user_id",
    "ordinal_position": 4,
    "column_default": null,
    "is_nullable": true,
    "data_type": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_work_logs",
    "column_name": "task_type",
    "ordinal_position": 5,
    "column_default": null,
    "is_nullable": false,
    "data_type": "character varying",
    "character_maximum_length": 50,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_work_logs",
    "column_name": "task_description",
    "ordinal_position": 6,
    "column_default": null,
    "is_nullable": false,
    "data_type": "text",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_work_logs",
    "column_name": "input_data",
    "ordinal_position": 7,
    "column_default": "'{}'::jsonb",
    "is_nullable": true,
    "data_type": "jsonb",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_work_logs",
    "column_name": "output_data",
    "ordinal_position": 8,
    "column_default": "'{}'::jsonb",
    "is_nullable": true,
    "data_type": "jsonb",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_work_logs",
    "column_name": "status",
    "ordinal_position": 9,
    "column_default": "'pending'::character varying",
    "is_nullable": false,
    "data_type": "character varying",
    "character_maximum_length": 20,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_work_logs",
    "column_name": "started_at",
    "ordinal_position": 10,
    "column_default": "now()",
    "is_nullable": false,
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": 6,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_work_logs",
    "column_name": "completed_at",
    "ordinal_position": 11,
    "column_default": null,
    "is_nullable": true,
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": 6,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_work_logs",
    "column_name": "execution_time_ms",
    "ordinal_position": 12,
    "column_default": null,
    "is_nullable": true,
    "data_type": "integer",
    "character_maximum_length": null,
    "numeric_precision": 32,
    "numeric_scale": 0,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_work_logs",
    "column_name": "error_message",
    "ordinal_position": 13,
    "column_default": null,
    "is_nullable": true,
    "data_type": "text",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_work_logs",
    "column_name": "metadata",
    "ordinal_position": 14,
    "column_default": "'{}'::jsonb",
    "is_nullable": true,
    "data_type": "jsonb",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_work_logs",
    "column_name": "created_at",
    "ordinal_position": 15,
    "column_default": "now()",
    "is_nullable": true,
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": 6,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "agent_work_logs",
    "column_name": "updated_at",
    "ordinal_position": 16,
    "column_default": "now()",
    "is_nullable": true,
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": 6,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "ai_response_queue",
    "column_name": "id",
    "ordinal_position": 1,
    "column_default": "gen_random_uuid()",
    "is_nullable": false,
    "data_type": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "ai_response_queue",
    "column_name": "conversation_id",
    "ordinal_position": 2,
    "column_default": null,
    "is_nullable": false,
    "data_type": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "ai_response_queue",
    "column_name": "message_id",
    "ordinal_position": 3,
    "column_default": null,
    "is_nullable": false,
    "data_type": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "ai_response_queue",
    "column_name": "user_message",
    "ordinal_position": 4,
    "column_default": null,
    "is_nullable": false,
    "data_type": "text",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "ai_response_queue",
    "column_name": "status",
    "ordinal_position": 5,
    "column_default": "'pending'::character varying",
    "is_nullable": true,
    "data_type": "character varying",
    "character_maximum_length": 20,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "ai_response_queue",
    "column_name": "priority",
    "ordinal_position": 6,
    "column_default": "3",
    "is_nullable": true,
    "data_type": "integer",
    "character_maximum_length": null,
    "numeric_precision": 32,
    "numeric_scale": 0,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "ai_response_queue",
    "column_name": "retry_count",
    "ordinal_position": 7,
    "column_default": "0",
    "is_nullable": true,
    "data_type": "integer",
    "character_maximum_length": null,
    "numeric_precision": 32,
    "numeric_scale": 0,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "ai_response_queue",
    "column_name": "max_retries",
    "ordinal_position": 8,
    "column_default": "3",
    "is_nullable": true,
    "data_type": "integer",
    "character_maximum_length": null,
    "numeric_precision": 32,
    "numeric_scale": 0,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "ai_response_queue",
    "column_name": "ai_response",
    "ordinal_position": 9,
    "column_default": null,
    "is_nullable": true,
    "data_type": "text",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "ai_response_queue",
    "column_name": "ai_confidence",
    "ordinal_position": 10,
    "column_default": null,
    "is_nullable": true,
    "data_type": "numeric",
    "character_maximum_length": null,
    "numeric_precision": 3,
    "numeric_scale": 2,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "ai_response_queue",
    "column_name": "response_time_ms",
    "ordinal_position": 11,
    "column_default": null,
    "is_nullable": true,
    "data_type": "integer",
    "character_maximum_length": null,
    "numeric_precision": 32,
    "numeric_scale": 0,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "ai_response_queue",
    "column_name": "error_message",
    "ordinal_position": 12,
    "column_default": null,
    "is_nullable": true,
    "data_type": "text",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "ai_response_queue",
    "column_name": "created_at",
    "ordinal_position": 13,
    "column_default": "now()",
    "is_nullable": true,
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": 6,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "ai_response_queue",
    "column_name": "process_after",
    "ordinal_position": 14,
    "column_default": "now()",
    "is_nullable": true,
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": 6,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "ai_response_queue",
    "column_name": "processed_at",
    "ordinal_position": 15,
    "column_default": null,
    "is_nullable": true,
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": 6,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "ai_response_queue",
    "column_name": "completed_at",
    "ordinal_position": 16,
    "column_default": null,
    "is_nullable": true,
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": 6,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "alert_history",
    "column_name": "id",
    "ordinal_position": 1,
    "column_default": "gen_random_uuid()",
    "is_nullable": false,
    "data_type": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "alert_history",
    "column_name": "rule_id",
    "ordinal_position": 2,
    "column_default": null,
    "is_nullable": true,
    "data_type": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "alert_history",
    "column_name": "triggered_at",
    "ordinal_position": 3,
    "column_default": "now()",
    "is_nullable": true,
    "data_type": "timestamp without time zone",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": 6,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "alert_history",
    "column_name": "metric_value",
    "ordinal_position": 4,
    "column_default": null,
    "is_nullable": false,
    "data_type": "numeric",
    "character_maximum_length": null,
    "numeric_precision": 15,
    "numeric_scale": 4,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "alert_history",
    "column_name": "threshold_value",
    "ordinal_position": 5,
    "column_default": null,
    "is_nullable": false,
    "data_type": "numeric",
    "character_maximum_length": null,
    "numeric_precision": 15,
    "numeric_scale": 4,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "alert_history",
    "column_name": "sent_channels",
    "ordinal_position": 6,
    "column_default": null,
    "is_nullable": true,
    "data_type": "ARRAY",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "alert_history",
    "column_name": "sent_recipients",
    "ordinal_position": 7,
    "column_default": null,
    "is_nullable": true,
    "data_type": "ARRAY",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "alert_rules",
    "column_name": "id",
    "ordinal_position": 1,
    "column_default": "gen_random_uuid()",
    "is_nullable": false,
    "data_type": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "alert_rules",
    "column_name": "name",
    "ordinal_position": 2,
    "column_default": null,
    "is_nullable": false,
    "data_type": "character varying",
    "character_maximum_length": 255,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "alert_rules",
    "column_name": "metric",
    "ordinal_position": 3,
    "column_default": null,
    "is_nullable": false,
    "data_type": "character varying",
    "character_maximum_length": 100,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "alert_rules",
    "column_name": "condition",
    "ordinal_position": 4,
    "column_default": null,
    "is_nullable": false,
    "data_type": "character varying",
    "character_maximum_length": 20,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "alert_rules",
    "column_name": "threshold",
    "ordinal_position": 5,
    "column_default": null,
    "is_nullable": false,
    "data_type": "numeric",
    "character_maximum_length": null,
    "numeric_precision": 15,
    "numeric_scale": 4,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "alert_rules",
    "column_name": "time_window_minutes",
    "ordinal_position": 6,
    "column_default": "60",
    "is_nullable": true,
    "data_type": "integer",
    "character_maximum_length": null,
    "numeric_precision": 32,
    "numeric_scale": 0,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "alert_rules",
    "column_name": "channels",
    "ordinal_position": 7,
    "column_default": "'{email}'::text[]",
    "is_nullable": true,
    "data_type": "ARRAY",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "alert_rules",
    "column_name": "recipients",
    "ordinal_position": 8,
    "column_default": null,
    "is_nullable": false,
    "data_type": "ARRAY",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "alert_rules",
    "column_name": "is_active",
    "ordinal_position": 9,
    "column_default": "true",
    "is_nullable": true,
    "data_type": "boolean",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "alert_rules",
    "column_name": "created_by",
    "ordinal_position": 10,
    "column_default": null,
    "is_nullable": true,
    "data_type": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "alert_rules",
    "column_name": "created_at",
    "ordinal_position": 11,
    "column_default": "now()",
    "is_nullable": true,
    "data_type": "timestamp without time zone",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": 6,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "audit_logs",
    "column_name": "id",
    "ordinal_position": 1,
    "column_default": "gen_random_uuid()",
    "is_nullable": false,
    "data_type": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "audit_logs",
    "column_name": "user_id",
    "ordinal_position": 2,
    "column_default": null,
    "is_nullable": true,
    "data_type": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "audit_logs",
    "column_name": "action",
    "ordinal_position": 3,
    "column_default": null,
    "is_nullable": false,
    "data_type": "character varying",
    "character_maximum_length": 100,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "audit_logs",
    "column_name": "entity_type",
    "ordinal_position": 4,
    "column_default": null,
    "is_nullable": false,
    "data_type": "character varying",
    "character_maximum_length": 100,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "audit_logs",
    "column_name": "entity_id",
    "ordinal_position": 5,
    "column_default": null,
    "is_nullable": true,
    "data_type": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "audit_logs",
    "column_name": "changes",
    "ordinal_position": 6,
    "column_default": null,
    "is_nullable": true,
    "data_type": "jsonb",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "audit_logs",
    "column_name": "ip_address",
    "ordinal_position": 7,
    "column_default": null,
    "is_nullable": true,
    "data_type": "inet",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "audit_logs",
    "column_name": "user_agent",
    "ordinal_position": 8,
    "column_default": null,
    "is_nullable": true,
    "data_type": "text",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "audit_logs",
    "column_name": "created_at",
    "ordinal_position": 9,
    "column_default": "now()",
    "is_nullable": true,
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": 6,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "auto_generated_knowledge",
    "column_name": "id",
    "ordinal_position": 1,
    "column_default": "gen_random_uuid()",
    "is_nullable": false,
    "data_type": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "auto_generated_knowledge",
    "column_name": "scan_job_id",
    "ordinal_position": 2,
    "column_default": null,
    "is_nullable": true,
    "data_type": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "auto_generated_knowledge",
    "column_name": "extracted_content_id",
    "ordinal_position": 3,
    "column_default": null,
    "is_nullable": true,
    "data_type": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "auto_generated_knowledge",
    "column_name": "knowledge_item_id",
    "ordinal_position": 4,
    "column_default": null,
    "is_nullable": true,
    "data_type": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "auto_generated_knowledge",
    "column_name": "auto_category",
    "ordinal_position": 5,
    "column_default": null,
    "is_nullable": true,
    "data_type": "character varying",
    "character_maximum_length": 255,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "auto_generated_knowledge",
    "column_name": "confidence_score",
    "ordinal_position": 6,
    "column_default": null,
    "is_nullable": true,
    "data_type": "numeric",
    "character_maximum_length": null,
    "numeric_precision": 3,
    "numeric_scale": 2,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "auto_generated_knowledge",
    "column_name": "needs_review",
    "ordinal_position": 7,
    "column_default": "true",
    "is_nullable": true,
    "data_type": "boolean",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "auto_generated_knowledge",
    "column_name": "approved",
    "ordinal_position": 8,
    "column_default": "false",
    "is_nullable": true,
    "data_type": "boolean",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "auto_generated_knowledge",
    "column_name": "created_at",
    "ordinal_position": 9,
    "column_default": "now()",
    "is_nullable": true,
    "data_type": "timestamp without time zone",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": 6,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "canned_responses",
    "column_name": "id",
    "ordinal_position": 1,
    "column_default": "gen_random_uuid()",
    "is_nullable": false,
    "data_type": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "canned_responses",
    "column_name": "title",
    "ordinal_position": 2,
    "column_default": null,
    "is_nullable": false,
    "data_type": "character varying",
    "character_maximum_length": 255,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "canned_responses",
    "column_name": "content",
    "ordinal_position": 3,
    "column_default": null,
    "is_nullable": false,
    "data_type": "text",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "canned_responses",
    "column_name": "shortcut",
    "ordinal_position": 4,
    "column_default": null,
    "is_nullable": true,
    "data_type": "character varying",
    "character_maximum_length": 50,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "canned_responses",
    "column_name": "category",
    "ordinal_position": 5,
    "column_default": null,
    "is_nullable": true,
    "data_type": "character varying",
    "character_maximum_length": 100,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
    "identity_generation": null
  },
  {
    "section": "=== COLUMN DETAILS ===",
    "table_name": "canned_responses",
    "column_name": "language",
    "ordinal_position": 6,
    "column_default": "'en'::character varying",
    "is_nullable": true,
    "data_type": "character varying",
    "character_maximum_length": 10,
    "numeric_precision": null,
    "numeric_scale": null,
    "datetime_precision": null,
    "is_identity": false,
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
    "table_name": "ai_response_queue",
    "constraint_name": "ai_response_queue_pkey",
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
    "constraint_name": "conversation_context_pkey",
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
    "constraint_name": "customer_profiles_phone_key",
    "constraint_type": "UNIQUE",
    "column_name": "phone",
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
    "table_name": "knowledge_gaps",
    "constraint_name": "knowledge_gaps_pkey",
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
    "table_name": "learning_insights",
    "constraint_name": "learning_insights_pkey",
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
    "table_name": "pattern_recognition",
    "constraint_name": "pattern_recognition_pkey",
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
    "table_name": "template_ab_tests",
    "constraint_name": "template_ab_tests_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "template_analytics",
    "constraint_name": "template_analytics_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "template_categories",
    "constraint_name": "template_categories_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "template_categories",
    "constraint_name": "template_categories_name_key",
    "constraint_type": "UNIQUE",
    "column_name": "name",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "template_optimization",
    "constraint_name": "template_optimization_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "template_performance_metrics",
    "constraint_name": "template_performance_metrics_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "template_suggestions",
    "constraint_name": "template_suggestions_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "template_triggers",
    "constraint_name": "template_triggers_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "template_usage_history",
    "constraint_name": "template_usage_history_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "template_variables",
    "constraint_name": "template_variables_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "template_variables",
    "constraint_name": "template_variables_template_id_variable_name_key",
    "constraint_type": "UNIQUE",
    "column_name": "template_id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "template_variables",
    "constraint_name": "template_variables_template_id_variable_name_key",
    "constraint_type": "UNIQUE",
    "column_name": "variable_name",
    "ordinal_position": 2
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "templates",
    "constraint_name": "templates_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "training_datasets",
    "constraint_name": "training_datasets_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "training_jobs",
    "constraint_name": "training_jobs_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "training_metrics_history",
    "constraint_name": "training_metrics_history_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "training_results",
    "constraint_name": "training_results_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "training_scenarios",
    "constraint_name": "training_scenarios_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "ordinal_position": 1
  },
  {
    "section": "=== PRIMARY KEYS ===",
    "table_name": "training_sessions",
    "constraint_name": "training_sessions_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
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
    "source_table": "ai_response_queue",
    "source_column": "conversation_id",
    "target_table": "conversations",
    "target_column": "id",
    "constraint_name": "ai_response_queue_conversation_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "ai_response_queue",
    "source_column": "message_id",
    "target_table": "messages",
    "target_column": "id",
    "constraint_name": "ai_response_queue_message_id_fkey",
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
    "source_table": "knowledge_gaps",
    "source_column": "user_id",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "knowledge_gaps_user_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
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
    "source_table": "learning_insights",
    "source_column": "user_id",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "learning_insights_user_id_fkey",
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
    "source_table": "pattern_recognition",
    "source_column": "user_id",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "pattern_recognition_user_id_fkey",
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
    "source_table": "template_ab_tests",
    "source_column": "template_id",
    "target_table": "templates",
    "target_column": "id",
    "constraint_name": "template_ab_tests_template_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "template_ab_tests",
    "source_column": "user_id",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "template_ab_tests_user_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "template_analytics",
    "source_column": "template_id",
    "target_table": "templates",
    "target_column": "id",
    "constraint_name": "template_analytics_template_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "template_analytics",
    "source_column": "user_id",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "template_analytics_user_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "template_categories",
    "source_column": "parent_id",
    "target_table": "template_categories",
    "target_column": "id",
    "constraint_name": "template_categories_parent_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "template_optimization",
    "source_column": "approved_by",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "template_optimization_approved_by_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "NO ACTION"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "template_optimization",
    "source_column": "template_id",
    "target_table": "templates",
    "target_column": "id",
    "constraint_name": "template_optimization_template_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "template_optimization",
    "source_column": "user_id",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "template_optimization_user_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "template_performance_metrics",
    "source_column": "template_id",
    "target_table": "templates",
    "target_column": "id",
    "constraint_name": "template_performance_metrics_template_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "template_performance_metrics",
    "source_column": "user_id",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "template_performance_metrics_user_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "template_suggestions",
    "source_column": "conversation_id",
    "target_table": "conversations",
    "target_column": "id",
    "constraint_name": "template_suggestions_conversation_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "template_suggestions",
    "source_column": "message_id",
    "target_table": "messages",
    "target_column": "id",
    "constraint_name": "template_suggestions_message_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "template_suggestions",
    "source_column": "selected_template_id",
    "target_table": "templates",
    "target_column": "id",
    "constraint_name": "template_suggestions_selected_template_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "NO ACTION"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "template_suggestions",
    "source_column": "user_id",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "template_suggestions_user_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "template_triggers",
    "source_column": "template_id",
    "target_table": "templates",
    "target_column": "id",
    "constraint_name": "template_triggers_template_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "template_triggers",
    "source_column": "user_id",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "template_triggers_user_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "template_usage_history",
    "source_column": "conversation_id",
    "target_table": "conversations",
    "target_column": "id",
    "constraint_name": "template_usage_history_conversation_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "template_usage_history",
    "source_column": "message_id",
    "target_table": "messages",
    "target_column": "id",
    "constraint_name": "template_usage_history_message_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "template_usage_history",
    "source_column": "template_id",
    "target_table": "templates",
    "target_column": "id",
    "constraint_name": "template_usage_history_template_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "template_usage_history",
    "source_column": "user_id",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "template_usage_history_user_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "template_variables",
    "source_column": "template_id",
    "target_table": "templates",
    "target_column": "id",
    "constraint_name": "template_variables_template_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "template_variables",
    "source_column": "user_id",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "template_variables_user_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "templates",
    "source_column": "created_by",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "templates_created_by_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "training_datasets",
    "source_column": "user_id",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "training_datasets_user_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "training_jobs",
    "source_column": "dataset_id",
    "target_table": "training_datasets",
    "target_column": "id",
    "constraint_name": "training_jobs_dataset_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "training_jobs",
    "source_column": "user_id",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "training_jobs_user_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "training_metrics_history",
    "source_column": "session_id",
    "target_table": "training_sessions",
    "target_column": "id",
    "constraint_name": "training_metrics_history_session_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "training_metrics_history",
    "source_column": "user_id",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "training_metrics_history_user_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "training_results",
    "source_column": "scenario_id",
    "target_table": "training_scenarios",
    "target_column": "id",
    "constraint_name": "training_results_scenario_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "training_results",
    "source_column": "session_id",
    "target_table": "training_sessions",
    "target_column": "id",
    "constraint_name": "training_results_session_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "training_results",
    "source_column": "user_id",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "training_results_user_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "training_scenarios",
    "source_column": "user_id",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "training_scenarios_user_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "training_sessions",
    "source_column": "job_id",
    "target_table": "training_jobs",
    "target_column": "id",
    "constraint_name": "training_sessions_job_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "section": "=== FOREIGN KEYS ===",
    "source_table": "training_sessions",
    "source_column": "user_id",
    "target_table": "profiles",
    "target_column": "id",
    "constraint_name": "training_sessions_user_id_fkey",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
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
    "constraint_name": "2200_36933_10_not_null",
    "check_clause": "started_at IS NOT NULL"
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
    "constraint_name": "2200_36933_1_not_null",
    "check_clause": "id IS NOT NULL"
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
    "constraint_name": "2200_36933_3_not_null",
    "check_clause": "agent_name IS NOT NULL"
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
    "constraint_name": "agent_work_logs_status_check",
    "check_clause": "(((status)::text = ANY ((ARRAY['pending'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'failed'::character varying])::text[])))"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "ai_response_queue",
    "constraint_name": "2200_46263_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "ai_response_queue",
    "constraint_name": "ai_response_queue_status_check",
    "check_clause": "(((status)::text = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'completed'::character varying, 'failed'::character varying])::text[])))"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "ai_response_queue",
    "constraint_name": "2200_46263_4_not_null",
    "check_clause": "user_message IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "ai_response_queue",
    "constraint_name": "ai_response_queue_priority_check",
    "check_clause": "(((priority >= 1) AND (priority <= 5)))"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "ai_response_queue",
    "constraint_name": "2200_46263_3_not_null",
    "check_clause": "message_id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "ai_response_queue",
    "constraint_name": "2200_46263_2_not_null",
    "check_clause": "conversation_id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "alert_history",
    "constraint_name": "2200_27833_4_not_null",
    "check_clause": "metric_value IS NOT NULL"
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
    "table_name": "alert_rules",
    "constraint_name": "2200_27816_2_not_null",
    "check_clause": "name IS NOT NULL"
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
    "constraint_name": "2200_27816_8_not_null",
    "check_clause": "recipients IS NOT NULL"
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
    "constraint_name": "2200_27816_4_not_null",
    "check_clause": "condition IS NOT NULL"
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
    "constraint_name": "2200_33397_1_not_null",
    "check_clause": "id IS NOT NULL"
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
    "constraint_name": "2200_27477_1_not_null",
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
    "constraint_name": "2200_27477_5_not_null",
    "check_clause": "target_channel_type IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "channel_routing_rules",
    "constraint_name": "2200_27477_2_not_null",
    "check_clause": "name IS NOT NULL"
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
    "constraint_name": "2200_27413_5_not_null",
    "check_clause": "configuration IS NOT NULL"
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
    "constraint_name": "2200_27413_2_not_null",
    "check_clause": "name IS NOT NULL"
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
    "constraint_name": "2200_33227_4_not_null",
    "check_clause": "note IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "conversation_notes",
    "constraint_name": "2200_33227_1_not_null",
    "check_clause": "id IS NOT NULL"
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
    "constraint_name": "2200_30885_1_not_null",
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
    "constraint_name": "2200_27782_3_not_null",
    "check_clause": "name IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "dashboard_configs",
    "constraint_name": "2200_27782_1_not_null",
    "check_clause": "id IS NOT NULL"
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
    "constraint_name": "2200_27847_4_not_null",
    "check_clause": "type IS NOT NULL"
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
    "constraint_name": "2200_27847_3_not_null",
    "check_clause": "name IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "export_jobs",
    "constraint_name": "2200_27847_6_not_null",
    "check_clause": "format IS NOT NULL"
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
    "constraint_name": "2200_28045_5_not_null",
    "check_clause": "content IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "extracted_content",
    "constraint_name": "2200_28045_3_not_null",
    "check_clause": "url IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "file_attachments",
    "constraint_name": "2200_33249_1_not_null",
    "check_clause": "id IS NOT NULL"
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
    "table_name": "integration_field_mappings",
    "constraint_name": "2200_33313_1_not_null",
    "check_clause": "id IS NOT NULL"
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
    "table_name": "integrations",
    "constraint_name": "2200_31633_1_not_null",
    "check_clause": "id IS NOT NULL"
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
    "constraint_name": "2200_31633_7_not_null",
    "check_clause": "credentials IS NOT NULL"
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
    "table_name": "knowledge_analytics",
    "constraint_name": "2200_33294_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "knowledge_base",
    "constraint_name": "2200_26934_2_not_null",
    "check_clause": "title IS NOT NULL"
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
    "table_name": "knowledge_categories",
    "constraint_name": "2200_29364_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "knowledge_categories",
    "constraint_name": "2200_29364_2_not_null",
    "check_clause": "name IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "knowledge_gaps",
    "constraint_name": "2200_45166_3_not_null",
    "check_clause": "topic IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "knowledge_gaps",
    "constraint_name": "2200_45166_1_not_null",
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
    "constraint_name": "2200_29373_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "knowledge_items",
    "constraint_name": "2200_29373_2_not_null",
    "check_clause": "title IS NOT NULL"
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
    "table_name": "learning_insights",
    "constraint_name": "2200_45188_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "learning_insights",
    "constraint_name": "2200_45188_5_not_null",
    "check_clause": "description IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "learning_insights",
    "constraint_name": "2200_45188_4_not_null",
    "check_clause": "title IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "learning_insights",
    "constraint_name": "2200_45188_3_not_null",
    "check_clause": "insight_type IS NOT NULL"
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
    "constraint_name": "2200_27436_5_not_null",
    "check_clause": "template_content IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "message_templates",
    "constraint_name": "2200_27436_4_not_null",
    "check_clause": "category IS NOT NULL"
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
    "constraint_name": "2200_27436_7_not_null",
    "check_clause": "channel_type IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "messages",
    "constraint_name": "2200_31290_3_not_null",
    "check_clause": "sender_type IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "messages",
    "constraint_name": "2200_31290_5_not_null",
    "check_clause": "content IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "messages",
    "constraint_name": "2200_31290_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "onboarding_responses",
    "constraint_name": "2200_43048_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "onboarding_responses",
    "constraint_name": "2200_43048_2_not_null",
    "check_clause": "user_id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "pattern_recognition",
    "constraint_name": "2200_45209_4_not_null",
    "check_clause": "pattern_type IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "pattern_recognition",
    "constraint_name": "2200_45209_9_not_null",
    "check_clause": "context IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "pattern_recognition",
    "constraint_name": "2200_45209_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "pattern_recognition",
    "constraint_name": "2200_45209_3_not_null",
    "check_clause": "pattern_name IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "playground_sessions",
    "constraint_name": "2200_29430_4_not_null",
    "check_clause": "bot_configuration IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "playground_sessions",
    "constraint_name": "2200_29430_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "profiles",
    "constraint_name": "2200_17572_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "realtime_metrics",
    "constraint_name": "2200_27748_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "realtime_metrics",
    "constraint_name": "2200_27748_3_not_null",
    "check_clause": "metric_value IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "realtime_metrics",
    "constraint_name": "2200_27748_2_not_null",
    "check_clause": "metric_name IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "scan_job_logs",
    "constraint_name": "2200_28078_4_not_null",
    "check_clause": "message IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "scan_job_logs",
    "constraint_name": "2200_28078_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "scan_job_logs",
    "constraint_name": "2200_28078_3_not_null",
    "check_clause": "log_level IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "scheduled_reports",
    "constraint_name": "2200_27800_6_not_null",
    "check_clause": "recipients IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "scheduled_reports",
    "constraint_name": "2200_27800_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "scheduled_reports",
    "constraint_name": "2200_27800_2_not_null",
    "check_clause": "name IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "scheduled_reports",
    "constraint_name": "2200_27800_4_not_null",
    "check_clause": "report_type IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "scheduled_reports",
    "constraint_name": "2200_27800_5_not_null",
    "check_clause": "schedule_cron IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "sla_tracking",
    "constraint_name": "2200_27356_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "sync_jobs",
    "constraint_name": "2200_33330_4_not_null",
    "check_clause": "direction IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "sync_jobs",
    "constraint_name": "2200_33330_3_not_null",
    "check_clause": "job_type IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "sync_jobs",
    "constraint_name": "2200_33330_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "system_settings",
    "constraint_name": "2200_33380_3_not_null",
    "check_clause": "setting_value IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "system_settings",
    "constraint_name": "2200_33380_2_not_null",
    "check_clause": "setting_key IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "system_settings",
    "constraint_name": "2200_33380_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "template_ab_tests",
    "constraint_name": "2200_45680_5_not_null",
    "check_clause": "variant_a_content IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "template_ab_tests",
    "constraint_name": "2200_45680_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "template_ab_tests",
    "constraint_name": "2200_45680_4_not_null",
    "check_clause": "test_name IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "template_ab_tests",
    "constraint_name": "2200_45680_6_not_null",
    "check_clause": "variant_b_content IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "template_analytics",
    "constraint_name": "2200_45558_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "template_categories",
    "constraint_name": "2200_45397_2_not_null",
    "check_clause": "name IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "template_categories",
    "constraint_name": "2200_45397_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "template_optimization",
    "constraint_name": "2200_45621_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "template_optimization",
    "constraint_name": "2200_45621_4_not_null",
    "check_clause": "optimization_type IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "template_optimization",
    "constraint_name": "2200_45621_5_not_null",
    "check_clause": "original_content IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "template_optimization",
    "constraint_name": "2200_45621_6_not_null",
    "check_clause": "optimized_content IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "template_performance_metrics",
    "constraint_name": "2200_45707_5_not_null",
    "check_clause": "metric_value IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "template_performance_metrics",
    "constraint_name": "2200_45707_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "template_performance_metrics",
    "constraint_name": "2200_45707_4_not_null",
    "check_clause": "metric_name IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "template_suggestions",
    "constraint_name": "2200_45588_6_not_null",
    "check_clause": "suggested_templates IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "template_suggestions",
    "constraint_name": "2200_45588_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "template_suggestions",
    "constraint_name": "2200_45588_5_not_null",
    "check_clause": "customer_message IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "template_triggers",
    "constraint_name": "2200_45726_4_not_null",
    "check_clause": "trigger_type IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "template_triggers",
    "constraint_name": "2200_45726_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "template_triggers",
    "constraint_name": "2200_45726_5_not_null",
    "check_clause": "trigger_value IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "template_usage_history",
    "constraint_name": "2200_45648_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "template_variables",
    "constraint_name": "2200_45532_4_not_null",
    "check_clause": "variable_name IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "template_variables",
    "constraint_name": "2200_45532_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "template_variables",
    "constraint_name": "2200_45532_5_not_null",
    "check_clause": "variable_type IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "templates",
    "constraint_name": "2200_45376_2_not_null",
    "check_clause": "name IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "templates",
    "constraint_name": "2200_45376_5_not_null",
    "check_clause": "content IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "templates",
    "constraint_name": "2200_45376_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "training_datasets",
    "constraint_name": "2200_45076_3_not_null",
    "check_clause": "name IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "training_datasets",
    "constraint_name": "2200_45076_6_not_null",
    "check_clause": "data_type IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "training_datasets",
    "constraint_name": "2200_45076_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "training_jobs",
    "constraint_name": "2200_45094_4_not_null",
    "check_clause": "name IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "training_jobs",
    "constraint_name": "2200_45094_5_not_null",
    "check_clause": "job_type IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "training_jobs",
    "constraint_name": "2200_45094_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "training_metrics_history",
    "constraint_name": "2200_45145_4_not_null",
    "check_clause": "metric_type IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "training_metrics_history",
    "constraint_name": "2200_45145_5_not_null",
    "check_clause": "metric_value IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "training_metrics_history",
    "constraint_name": "2200_45145_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "training_results",
    "constraint_name": "2200_45250_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "training_scenarios",
    "constraint_name": "2200_45229_5_not_null",
    "check_clause": "scenario_text IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "training_scenarios",
    "constraint_name": "2200_45229_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "training_scenarios",
    "constraint_name": "2200_45229_3_not_null",
    "check_clause": "name IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "training_scenarios",
    "constraint_name": "2200_45229_6_not_null",
    "check_clause": "ideal_response IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "training_sessions",
    "constraint_name": "2200_45118_4_not_null",
    "check_clause": "session_name IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "training_sessions",
    "constraint_name": "2200_45118_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "training_sessions",
    "constraint_name": "2200_45118_5_not_null",
    "check_clause": "session_type IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "user_agents",
    "constraint_name": "2200_36910_5_not_null",
    "check_clause": "agent_type IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "user_agents",
    "constraint_name": "2200_36910_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "user_agents",
    "constraint_name": "2200_36910_4_not_null",
    "check_clause": "agent_name IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "user_agents",
    "constraint_name": "2200_36910_3_not_null",
    "check_clause": "agent_id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "user_agents",
    "constraint_name": "2200_36910_2_not_null",
    "check_clause": "user_id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "user_agents",
    "constraint_name": "user_agents_agent_type_check",
    "check_clause": "(((agent_type)::text = ANY ((ARRAY['ai_assistant'::character varying, 'chatbot'::character varying, 'workflow_bot'::character varying, 'analytics_bot'::character varying, 'knowledge_bot'::character varying])::text[])))"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "webhook_events",
    "constraint_name": "2200_27446_4_not_null",
    "check_clause": "payload IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "webhook_events",
    "constraint_name": "2200_27446_3_not_null",
    "check_clause": "event_type IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "webhook_events",
    "constraint_name": "2200_27446_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "webhook_logs",
    "constraint_name": "2200_33366_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "webhook_logs",
    "constraint_name": "2200_33366_3_not_null",
    "check_clause": "event_type IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "webhook_subscriptions",
    "constraint_name": "2200_33347_3_not_null",
    "check_clause": "event_type IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "webhook_subscriptions",
    "constraint_name": "2200_33347_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "webhook_subscriptions",
    "constraint_name": "2200_33347_4_not_null",
    "check_clause": "webhook_url IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "website_scan_jobs",
    "constraint_name": "2200_28026_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "website_scan_jobs",
    "constraint_name": "2200_28026_4_not_null",
    "check_clause": "urls IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "widget_configurations",
    "constraint_name": "2200_29447_5_not_null",
    "check_clause": "configuration IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "widget_configurations",
    "constraint_name": "2200_29447_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "workflow_executions",
    "constraint_name": "2200_31654_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "workflows",
    "constraint_name": "2200_26916_1_not_null",
    "check_clause": "id IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "workflows",
    "constraint_name": "2200_26916_6_not_null",
    "check_clause": "connections IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "workflows",
    "constraint_name": "2200_26916_5_not_null",
    "check_clause": "nodes IS NOT NULL"
  },
  {
    "section": "=== CHECK CONSTRAINTS ===",
    "table_name": "workflows",
    "constraint_name": "2200_26916_3_not_null",
    "check_clause": "name IS NOT NULL"
  }
]" 

7. "[
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
    "routine_name": "calculate_template_effectiveness",
    "routine_type": "FUNCTION",
    "return_type": "numeric",
    "routine_definition": "\nDECLARE\n    effectiveness_score DECIMAL(3,2);\nBEGIN\n    SELECT \n        (\n            (AVG(CASE WHEN tuh.effectiveness_rating >= 4 THEN 1 ELSE 0 END) * 0.4) +\n            (AVG(CASE WHEN tuh.customer_reaction = 'positive' THEN 1 ELSE 0 END) * 0.3) +\n            (AVG(tuh.context_match_score) * 0.3)\n        ) INTO effectiveness_score\n    FROM template_usage_history tuh\n    WHERE tuh.template_id = template_uuid\n    AND tuh.used_at >= NOW() - INTERVAL '1 day' * days_back;\n    \n    RETURN COALESCE(effectiveness_score, 0.0);\nEND;\n"
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
    "routine_name": "cleanup_ai_response_queue",
    "routine_type": "FUNCTION",
    "return_type": "integer",
    "routine_definition": "\nDECLARE\n    deleted_count INTEGER;\nBEGIN\n    DELETE FROM ai_response_queue\n    WHERE completed_at IS NOT NULL\n        AND completed_at < NOW() - INTERVAL '1 day' * older_than_days;\n    \n    GET DIAGNOSTICS deleted_count = ROW_COUNT;\n    \n    RETURN deleted_count;\nEND;\n"
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
    "routine_name": "cleanup_realtime_metrics",
    "routine_type": "FUNCTION",
    "return_type": "integer",
    "routine_definition": "\nDECLARE\n    deleted_count INTEGER;\nBEGIN\n    DELETE FROM realtime_metrics\n    WHERE timestamp < NOW() - INTERVAL '1 day' * older_than_days;\n    \n    GET DIAGNOSTICS deleted_count = ROW_COUNT;\n    \n    RETURN deleted_count;\nEND;\n"
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "complete_ai_response_job",
    "routine_type": "FUNCTION",
    "return_type": "boolean",
    "routine_definition": "\nDECLARE\n    job_record RECORD;\n    conversation_record RECORD;\n    new_message_id UUID;\nBEGIN\n    -- Get job details\n    SELECT * INTO job_record\n    FROM ai_response_queue\n    WHERE id = job_id AND status = 'processing';\n    \n    IF NOT FOUND THEN\n        RETURN FALSE;\n    END IF;\n    \n    -- Get conversation details\n    SELECT * INTO conversation_record\n    FROM conversations\n    WHERE id = job_record.conversation_id;\n    \n    -- Insert AI response message if confidence is high enough\n    IF confidence >= 0.6 AND NOT requires_human THEN\n        INSERT INTO messages (\n            id,\n            conversation_id,\n            sender_type,\n            content,\n            channel_type,\n            message_type,\n            delivery_status,\n            confidence_score,\n            processing_time_ms,\n            metadata,\n            created_at\n        ) VALUES (\n            gen_random_uuid(),\n            job_record.conversation_id,\n            'ai',\n            ai_response,\n            conversation_record.channel_type,\n            'text',\n            'sent',\n            confidence,\n            response_time_ms,\n            jsonb_build_object(\n                'confidence', confidence,\n                'response_time', response_time_ms,\n                'generated_at', NOW(),\n                'requires_human', requires_human\n            ),\n            NOW()\n        ) RETURNING id INTO new_message_id;\n        \n        -- Update conversation with AI response\n        UPDATE conversations SET\n            last_message = ai_response,\n            last_message_at = NOW(),\n            message_count = COALESCE(message_count, 0) + 1,\n            ai_confidence = confidence,\n            requires_human = requires_human,\n            updated_at = NOW()\n        WHERE id = job_record.conversation_id;\n        \n    ELSE\n        -- Mark conversation as requiring human intervention\n        UPDATE conversations SET\n            requires_human = TRUE,\n            ai_confidence = confidence,\n            escalation_reason = CASE \n                WHEN confidence < 0.6 THEN 'low_confidence'\n                ELSE 'human_requested'\n            END,\n            updated_at = NOW()\n        WHERE id = job_record.conversation_id;\n    END IF;\n    \n    -- Mark job as completed\n    UPDATE ai_response_queue SET\n        status = 'completed',\n        ai_response = ai_response,\n        ai_confidence = confidence,\n        response_time_ms = response_time_ms,\n        completed_at = NOW()\n    WHERE id = job_id;\n    \n    -- Track performance metrics\n    INSERT INTO realtime_metrics (\n        metric_name,\n        metric_value,\n        dimensions,\n        timestamp\n    ) VALUES (\n        'ai_response_generated',\n        response_time_ms,\n        jsonb_build_object(\n            'conversation_id', job_record.conversation_id,\n            'confidence', confidence,\n            'requires_human', requires_human,\n            'channel_type', conversation_record.channel_type\n        ),\n        NOW()\n    );\n    \n    RETURN TRUE;\nEND;\n"
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "create_conversation",
    "routine_type": "FUNCTION",
    "return_type": "uuid",
    "routine_definition": "\nDECLARE\n    found_customer_id UUID;\n    conversation_id UUID;\n    search_field TEXT;\n    existing_conversation_id UUID;\nBEGIN\n    -- Determine search field based on identifier format\n    IF customer_identifier LIKE '%@%' THEN\n        search_field := 'email';\n    ELSE\n        search_field := 'phone';\n    END IF;\n    \n    -- Find or create customer\n    EXECUTE format('\n        INSERT INTO customer_profiles (id, %I, name, status, created_at, first_interaction, last_interaction)\n        VALUES (gen_random_uuid(), $1, $2, ''active'', NOW(), NOW(), NOW())\n        ON CONFLICT (%I) DO UPDATE SET\n            last_interaction = NOW(),\n            total_conversations = customer_profiles.total_conversations + 1\n        RETURNING id', search_field, search_field)\n    USING customer_identifier, \n          CASE WHEN customer_identifier LIKE '%@%' THEN split_part(customer_identifier, '@', 1) ELSE customer_identifier END\n    INTO found_customer_id;\n    \n    -- Check for existing active conversation\n    SELECT c.id INTO existing_conversation_id\n    FROM conversations c\n    WHERE c.customer_id = found_customer_id\n        AND c.channel_type = $2\n        AND c.status = 'active'\n    ORDER BY c.created_at DESC\n    LIMIT 1;\n    \n    IF existing_conversation_id IS NOT NULL THEN\n        RETURN existing_conversation_id;\n    END IF;\n    \n    -- Create new conversation\n    INSERT INTO conversations (\n        id,\n        customer_id,\n        customer_name,\n        user_name,\n        user_email,\n        customer_phone,\n        channel_type,\n        status,\n        priority,\n        language,\n        department,\n        message_count,\n        requires_human,\n        created_at,\n        last_message_at,\n        last_message\n    ) VALUES (\n        gen_random_uuid(),\n        found_customer_id,\n        CASE WHEN search_field = 'email' THEN split_part(customer_identifier, '@', 1) ELSE customer_identifier END,\n        CASE WHEN search_field = 'email' THEN split_part(customer_identifier, '@', 1) ELSE customer_identifier END,\n        CASE WHEN search_field = 'email' THEN customer_identifier ELSE NULL END,\n        CASE WHEN search_field = 'phone' THEN customer_identifier ELSE NULL END,\n        $2,\n        'active',\n        'normal',\n        'en',\n        'general',\n        0,\n        FALSE,\n        NOW(),\n        NOW(),\n        COALESCE(initial_message, '')\n    ) RETURNING id INTO conversation_id;\n    \n    -- Insert initial message if provided\n    IF initial_message IS NOT NULL THEN\n        INSERT INTO messages (\n            conversation_id,\n            sender_type,\n            content,\n            channel_type,\n            message_type,\n            delivery_status,\n            created_at\n        ) VALUES (\n            conversation_id,\n            'user',\n            initial_message,\n            $2,\n            'text',\n            'delivered',\n            NOW()\n        );\n    END IF;\n    \n    RETURN conversation_id;\nEND;\n"
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
    "routine_name": "fail_ai_response_job",
    "routine_type": "FUNCTION",
    "return_type": "boolean",
    "routine_definition": "\nDECLARE\n    job_record RECORD;\n    should_retry BOOLEAN := FALSE;\nBEGIN\n    -- Get job details\n    SELECT * INTO job_record\n    FROM ai_response_queue\n    WHERE id = job_id AND status = 'processing';\n    \n    IF NOT FOUND THEN\n        RETURN FALSE;\n    END IF;\n    \n    -- Check if we should retry\n    IF job_record.retry_count < job_record.max_retries THEN\n        should_retry := TRUE;\n    END IF;\n    \n    IF should_retry THEN\n        -- Increment retry count and reset to pending\n        UPDATE ai_response_queue SET\n            status = 'pending',\n            retry_count = retry_count + 1,\n            process_after = NOW() + INTERVAL '30 seconds', -- Wait 30 seconds before retry\n            error_message = error_message\n        WHERE id = job_id;\n    ELSE\n        -- Mark as failed\n        UPDATE ai_response_queue SET\n            status = 'failed',\n            error_message = error_message,\n            completed_at = NOW()\n        WHERE id = job_id;\n        \n        -- Mark conversation as requiring human intervention\n        UPDATE conversations SET\n            requires_human = TRUE,\n            escalation_reason = 'ai_failure',\n            updated_at = NOW()\n        WHERE id = job_record.conversation_id;\n    END IF;\n    \n    RETURN TRUE;\nEND;\n"
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
    "routine_name": "get_conversation_performance_metrics",
    "routine_type": "FUNCTION",
    "return_type": "record",
    "routine_definition": "\nBEGIN\n    RETURN QUERY\n    SELECT \n        COUNT(*)::INTEGER as total_messages,\n        COUNT(*) FILTER (WHERE sender_type = 'ai')::INTEGER as ai_messages,\n        COUNT(*) FILTER (WHERE sender_type IN ('agent', 'user'))::INTEGER as human_messages,\n        AVG(processing_time_ms) as avg_response_time_ms,\n        AVG(confidence_score) as ai_confidence_avg,\n        COUNT(*) FILTER (WHERE (metadata->>'requires_human')::boolean = true)::INTEGER as escalation_count,\n        (SELECT satisfaction_rating FROM conversations WHERE id = conversation_id) as satisfaction_rating,\n        EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at)))/60 as conversation_duration_minutes\n    FROM messages\n    WHERE conversation_id = $1;\nEND;\n"
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "get_conversation_with_messages",
    "routine_type": "FUNCTION",
    "return_type": "record",
    "routine_definition": "\nBEGIN\n    RETURN QUERY\n    SELECT \n        to_jsonb(c.*) as conversation_data,\n        COALESCE(\n            jsonb_agg(\n                to_jsonb(m.*) ORDER BY m.created_at ASC\n            ) FILTER (WHERE m.id IS NOT NULL),\n            '[]'::jsonb\n        ) as messages_data\n    FROM conversations c\n    LEFT JOIN (\n        SELECT *\n        FROM messages\n        WHERE conversation_id = $1\n        ORDER BY created_at DESC\n        LIMIT message_limit\n    ) m ON m.conversation_id = c.id\n    WHERE c.id = $1\n    GROUP BY c.id;\nEND;\n"
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "get_next_ai_response_job",
    "routine_type": "FUNCTION",
    "return_type": "record",
    "routine_definition": "\nDECLARE\n    selected_job_id UUID;\nBEGIN\n    -- First, get and lock the next job\n    SELECT arq.id INTO selected_job_id\n    FROM ai_response_queue arq\n    WHERE arq.status = 'pending'\n        AND arq.process_after <= NOW()\n        AND arq.retry_count < arq.max_retries\n    ORDER BY arq.priority ASC, arq.created_at ASC\n    LIMIT 1\n    FOR UPDATE SKIP LOCKED;\n    \n    -- If no job found, return empty\n    IF selected_job_id IS NULL THEN\n        RETURN;\n    END IF;\n    \n    -- Update the job status to 'processing'\n    UPDATE ai_response_queue \n    SET status = 'processing',\n        started_at = NOW(),\n        updated_at = NOW()\n    WHERE id = selected_job_id;\n    \n    -- Return the job details\n    RETURN QUERY\n    SELECT \n        arq.id,\n        arq.conversation_id,\n        arq.message_id,\n        arq.user_message,\n        -- Get conversation context\n        jsonb_build_object(\n            'channel_type', c.channel_type,\n            'language', c.language,\n            'priority', c.priority,\n            'department', c.department,\n            'intent', c.intent,\n            'sentiment', c.sentiment,\n            'message_count', c.message_count,\n            'recent_messages', (\n                SELECT jsonb_agg(\n                    jsonb_build_object(\n                        'id', m.id,\n                        'content', m.content,\n                        'sender_type', m.sender_type,\n                        'created_at', m.created_at\n                    ) ORDER BY m.created_at DESC\n                )\n                FROM (\n                    SELECT m.id, m.content, m.sender_type, m.created_at\n                    FROM messages m\n                    WHERE m.conversation_id = arq.conversation_id\n                    ORDER BY m.created_at DESC\n                    LIMIT 10\n                ) m\n            )\n        ),\n        -- Get customer profile\n        jsonb_build_object(\n            'id', cp.id,\n            'name', cp.name,\n            'email', cp.email,\n            'phone', cp.phone,\n            'total_conversations', cp.total_conversations,\n            'satisfaction_rating', cp.satisfaction_rating,\n            'preferences', cp.preferences\n        ),\n        arq.priority\n    FROM ai_response_queue arq\n    JOIN conversations c ON c.id = arq.conversation_id\n    LEFT JOIN customer_profiles cp ON cp.id = c.customer_id\n    WHERE arq.id = selected_job_id;\nEND;\n"
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "get_realtime_messaging_metrics",
    "routine_type": "FUNCTION",
    "return_type": "record",
    "routine_definition": "\nBEGIN\n    RETURN QUERY\n    SELECT \n        rm.metric_name::TEXT,\n        SUM(rm.metric_value) as metric_value,\n        COUNT(*)::INTEGER as count,\n        AVG(rm.metric_value) as avg_value,\n        MIN(rm.metric_value) as min_value,\n        MAX(rm.metric_value) as max_value,\n        tstzrange(NOW() - INTERVAL '1 minute' * time_window_minutes, NOW()) as timestamp_range\n    FROM realtime_metrics rm\n    WHERE rm.timestamp >= NOW() - INTERVAL '1 minute' * time_window_minutes\n    GROUP BY rm.metric_name\n    ORDER BY rm.metric_name;\nEND;\n"
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "get_template_suggestions",
    "routine_type": "FUNCTION",
    "return_type": "record",
    "routine_definition": "\nBEGIN\n    RETURN QUERY\n    SELECT \n        t.id,\n        t.name,\n        t.content,\n        CASE \n            WHEN customer_message_text ILIKE '%' || SPLIT_PART(t.content, ' ', 1) || '%' THEN 0.8\n            WHEN customer_message_text ILIKE '%' || SPLIT_PART(t.content, ' ', 2) || '%' THEN 0.6\n            ELSE 0.1 + (t.usage_count::DECIMAL / 1000)\n        END as confidence,\n        CASE \n            WHEN customer_message_text ILIKE '%' || SPLIT_PART(t.content, ' ', 1) || '%' THEN 'Content match'\n            WHEN customer_message_text ILIKE '%' || SPLIT_PART(t.content, ' ', 2) || '%' THEN 'Partial match'\n            ELSE 'Usage frequency'\n        END as match_reason\n    FROM templates t\n    WHERE t.created_by = user_uuid\n    AND t.is_active = true\n    ORDER BY confidence DESC\n    LIMIT limit_count;\nEND;\n"
  },
  {
    "section": "=== FUNCTIONS ===",
    "routine_name": "get_training_metrics_summary",
    "routine_type": "FUNCTION",
    "return_type": "record",
    "routine_definition": "\nBEGIN\n    RETURN QUERY\n    WITH current_metrics AS (\n        SELECT \n            tmh.metric_type,\n            AVG(tmh.metric_value) as avg_value\n        FROM training_metrics_history tmh\n        WHERE tmh.user_id = user_uuid\n        AND tmh.date_recorded >= NOW() - INTERVAL '1 day' * days_back\n        GROUP BY tmh.metric_type\n    ),\n    previous_metrics AS (\n        SELECT \n            tmh.metric_type,\n            AVG(tmh.metric_value) as avg_value\n        FROM training_metrics_history tmh\n        WHERE tmh.user_id = user_uuid\n        AND tmh.date_recorded >= NOW() - INTERVAL '1 day' * (days_back * 2)\n        AND tmh.date_recorded < NOW() - INTERVAL '1 day' * days_back\n        GROUP BY tmh.metric_type\n    )\n    SELECT \n        c.metric_type,\n        c.avg_value,\n        COALESCE(p.avg_value, 0),\n        CASE \n            WHEN p.avg_value > 0 THEN ((c.avg_value - p.avg_value) / p.avg_value * 100)\n            ELSE 0 \n        END,\n        CASE \n            WHEN p.avg_value IS NULL THEN 'new'::VARCHAR(20)\n            WHEN c.avg_value > p.avg_value THEN 'improving'::VARCHAR(20)\n            WHEN c.avg_value < p.avg_value THEN 'declining'::VARCHAR(20)\n            ELSE 'stable'::VARCHAR(20)\n        END\n    FROM current_metrics c\n    LEFT JOIN previous_metrics p ON c.metric_type = p.metric_type;\nEND;\n"
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
    "routine_name": "handle_new_message",
    "routine_type": "FUNCTION",
    "return_type": "trigger",
    "routine_definition": "\nDECLARE\n    conversation_record RECORD;\n    should_generate_ai_response BOOLEAN := FALSE;\n    customer_profile RECORD;\n    response_delay_ms INTEGER := 1000; -- 1 second delay for AI response\nBEGIN\n    -- Update conversation metadata\n    UPDATE conversations SET\n        last_message = NEW.content,\n        last_message_at = NEW.created_at,\n        message_count = COALESCE(message_count, 0) + 1,\n        updated_at = NOW()\n    WHERE id = NEW.conversation_id;\n\n    -- Get conversation details\n    SELECT * INTO conversation_record\n    FROM conversations\n    WHERE id = NEW.conversation_id;\n\n    -- Only generate AI response for user messages in active conversations\n    IF NEW.sender_type = 'user' AND conversation_record.status = 'active' THEN\n        -- Check if AI should respond (not if human agent is active)\n        IF conversation_record.requires_human = FALSE OR conversation_record.requires_human IS NULL THEN\n            should_generate_ai_response := TRUE;\n        END IF;\n    END IF;\n\n    -- Insert AI response generation job (processed by background service)\n    IF should_generate_ai_response THEN\n        INSERT INTO ai_response_queue (\n            conversation_id,\n            message_id,\n            user_message,\n            status,\n            priority,\n            created_at,\n            process_after\n        ) VALUES (\n            NEW.conversation_id,\n            NEW.id,\n            NEW.content,\n            'pending',\n            CASE \n                WHEN conversation_record.priority = 'urgent' THEN 1\n                WHEN conversation_record.priority = 'high' THEN 2\n                WHEN conversation_record.priority = 'normal' THEN 3\n                ELSE 4\n            END,\n            NOW(),\n            NOW() + INTERVAL '1 second'\n        );\n    END IF;\n\n    -- Update customer profile last interaction\n    UPDATE customer_profiles SET\n        last_interaction = NEW.created_at,\n        total_conversations = (\n            SELECT COUNT(DISTINCT conversation_id)\n            FROM messages\n            WHERE conversation_id IN (\n                SELECT id FROM conversations WHERE customer_id = conversation_record.customer_id\n            )\n        )\n    WHERE id = conversation_record.customer_id;\n\n    -- Track real-time metrics\n    INSERT INTO realtime_metrics (\n        metric_name,\n        metric_value,\n        dimensions,\n        timestamp\n    ) VALUES (\n        'message_received',\n        1,\n        jsonb_build_object(\n            'conversation_id', NEW.conversation_id,\n            'channel_type', NEW.channel_type,\n            'sender_type', NEW.sender_type,\n            'message_length', LENGTH(NEW.content)\n        ),\n        NOW()\n    );\n\n    RETURN NEW;\nEND;\n"
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
    "routine_name": "update_template_analytics_daily",
    "routine_type": "FUNCTION",
    "return_type": "void",
    "routine_definition": "\nBEGIN\n    INSERT INTO template_analytics (\n        template_id,\n        user_id,\n        usage_count,\n        success_rate,\n        average_response_time,\n        customer_satisfaction,\n        effectiveness_score,\n        last_used_at,\n        date_period\n    )\n    SELECT \n        tuh.template_id,\n        tuh.user_id,\n        COUNT(*) as usage_count,\n        AVG(CASE WHEN tuh.effectiveness_rating >= 4 THEN 100 ELSE 0 END) as success_rate,\n        AVG(tuh.response_time_ms) as average_response_time,\n        AVG(CASE WHEN tuh.customer_reaction = 'positive' THEN 5 \n                 WHEN tuh.customer_reaction = 'neutral' THEN 3\n                 ELSE 1 END) as customer_satisfaction,\n        calculate_template_effectiveness(tuh.template_id, 1) as effectiveness_score,\n        MAX(tuh.used_at) as last_used_at,\n        CURRENT_DATE as date_period\n    FROM template_usage_history tuh\n    WHERE tuh.used_at >= CURRENT_DATE - INTERVAL '1 day'\n    AND tuh.used_at < CURRENT_DATE\n    GROUP BY tuh.template_id, tuh.user_id\n    ON CONFLICT (template_id, user_id, date_period)\n    DO UPDATE SET\n        usage_count = EXCLUDED.usage_count,\n        success_rate = EXCLUDED.success_rate,\n        average_response_time = EXCLUDED.average_response_time,\n        customer_satisfaction = EXCLUDED.customer_satisfaction,\n        effectiveness_score = EXCLUDED.effectiveness_score,\n        last_used_at = EXCLUDED.last_used_at,\n        updated_at = NOW();\nEND;\n"
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
    "event_manipulation": "UPDATE",
    "event_object_table": "knowledge_analytics",
    "action_statement": "EXECUTE FUNCTION calculate_knowledge_effectiveness()",
    "action_timing": "AFTER",
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
    "trigger_name": "update_knowledge_gaps_updated_at",
    "event_manipulation": "UPDATE",
    "event_object_table": "knowledge_gaps",
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
    "trigger_name": "update_learning_insights_updated_at",
    "event_manipulation": "UPDATE",
    "event_object_table": "learning_insights",
    "action_statement": "EXECUTE FUNCTION update_updated_at_column()",
    "action_timing": "BEFORE",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "trigger_handle_new_message",
    "event_manipulation": "INSERT",
    "event_object_table": "messages",
    "action_statement": "EXECUTE FUNCTION handle_new_message()",
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
    "trigger_name": "trigger_update_conversation_analytics",
    "event_manipulation": "DELETE",
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
    "trigger_name": "update_pattern_recognition_updated_at",
    "event_manipulation": "UPDATE",
    "event_object_table": "pattern_recognition",
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
    "trigger_name": "update_template_ab_tests_updated_at",
    "event_manipulation": "UPDATE",
    "event_object_table": "template_ab_tests",
    "action_statement": "EXECUTE FUNCTION update_updated_at_column()",
    "action_timing": "BEFORE",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "update_template_analytics_updated_at",
    "event_manipulation": "UPDATE",
    "event_object_table": "template_analytics",
    "action_statement": "EXECUTE FUNCTION update_updated_at_column()",
    "action_timing": "BEFORE",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "update_template_categories_updated_at",
    "event_manipulation": "UPDATE",
    "event_object_table": "template_categories",
    "action_statement": "EXECUTE FUNCTION update_updated_at_column()",
    "action_timing": "BEFORE",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "update_template_optimization_updated_at",
    "event_manipulation": "UPDATE",
    "event_object_table": "template_optimization",
    "action_statement": "EXECUTE FUNCTION update_updated_at_column()",
    "action_timing": "BEFORE",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "update_template_suggestions_updated_at",
    "event_manipulation": "UPDATE",
    "event_object_table": "template_suggestions",
    "action_statement": "EXECUTE FUNCTION update_updated_at_column()",
    "action_timing": "BEFORE",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "update_template_triggers_updated_at",
    "event_manipulation": "UPDATE",
    "event_object_table": "template_triggers",
    "action_statement": "EXECUTE FUNCTION update_updated_at_column()",
    "action_timing": "BEFORE",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "update_template_variables_updated_at",
    "event_manipulation": "UPDATE",
    "event_object_table": "template_variables",
    "action_statement": "EXECUTE FUNCTION update_updated_at_column()",
    "action_timing": "BEFORE",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "update_templates_updated_at",
    "event_manipulation": "UPDATE",
    "event_object_table": "templates",
    "action_statement": "EXECUTE FUNCTION update_updated_at_column()",
    "action_timing": "BEFORE",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "update_training_datasets_updated_at",
    "event_manipulation": "UPDATE",
    "event_object_table": "training_datasets",
    "action_statement": "EXECUTE FUNCTION update_updated_at_column()",
    "action_timing": "BEFORE",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "update_training_jobs_updated_at",
    "event_manipulation": "UPDATE",
    "event_object_table": "training_jobs",
    "action_statement": "EXECUTE FUNCTION update_updated_at_column()",
    "action_timing": "BEFORE",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "update_training_scenarios_updated_at",
    "event_manipulation": "UPDATE",
    "event_object_table": "training_scenarios",
    "action_statement": "EXECUTE FUNCTION update_updated_at_column()",
    "action_timing": "BEFORE",
    "action_orientation": "ROW"
  },
  {
    "section": "=== TRIGGERS ===",
    "trigger_name": "update_training_sessions_updated_at",
    "event_manipulation": "UPDATE",
    "event_object_table": "training_sessions",
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

10. "[
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
    "tablename": "ai_response_queue",
    "policyname": "AI response queue access",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "true",
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
    "tablename": "knowledge_gaps",
    "policyname": "Users can create knowledge gaps",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(user_id = auth.uid())"
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "knowledge_gaps",
    "policyname": "Users can update own knowledge gaps",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(user_id = auth.uid())",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "knowledge_gaps",
    "policyname": "Users can view own knowledge gaps",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(user_id = auth.uid())",
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
    "tablename": "learning_insights",
    "policyname": "Users can create learning insights",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(user_id = auth.uid())"
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "learning_insights",
    "policyname": "Users can update own learning insights",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(user_id = auth.uid())",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "learning_insights",
    "policyname": "Users can view own learning insights",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(user_id = auth.uid())",
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
    "tablename": "pattern_recognition",
    "policyname": "Users can create pattern recognition",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(user_id = auth.uid())"
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "pattern_recognition",
    "policyname": "Users can update own pattern recognition",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(user_id = auth.uid())",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "pattern_recognition",
    "policyname": "Users can view own pattern recognition",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(user_id = auth.uid())",
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
    "tablename": "template_ab_tests",
    "policyname": "Users can create template ab tests",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(user_id = auth.uid())"
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "template_ab_tests",
    "policyname": "Users can update own template ab tests",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(user_id = auth.uid())",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "template_ab_tests",
    "policyname": "Users can view own template ab tests",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(user_id = auth.uid())",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "template_analytics",
    "policyname": "Users can create template analytics",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(user_id = auth.uid())"
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "template_analytics",
    "policyname": "Users can update own template analytics",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(user_id = auth.uid())",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "template_analytics",
    "policyname": "Users can view own template analytics",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(user_id = auth.uid())",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "template_categories",
    "policyname": "Admins can manage template categories",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND ((profiles.role)::text = 'admin'::text))))",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "template_categories",
    "policyname": "Users can view template categories",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "true",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "template_optimization",
    "policyname": "Users can create template optimization",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(user_id = auth.uid())"
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "template_optimization",
    "policyname": "Users can update own template optimization",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(user_id = auth.uid())",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "template_optimization",
    "policyname": "Users can view own template optimization",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(user_id = auth.uid())",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "template_performance_metrics",
    "policyname": "Users can create template performance metrics",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(user_id = auth.uid())"
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "template_performance_metrics",
    "policyname": "Users can view own template performance metrics",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(user_id = auth.uid())",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "template_suggestions",
    "policyname": "Users can create template suggestions",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(user_id = auth.uid())"
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "template_suggestions",
    "policyname": "Users can update own template suggestions",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(user_id = auth.uid())",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "template_suggestions",
    "policyname": "Users can view own template suggestions",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(user_id = auth.uid())",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "template_triggers",
    "policyname": "Users can create template triggers",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(user_id = auth.uid())"
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "template_triggers",
    "policyname": "Users can delete own template triggers",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "DELETE",
    "qual": "(user_id = auth.uid())",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "template_triggers",
    "policyname": "Users can update own template triggers",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(user_id = auth.uid())",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "template_triggers",
    "policyname": "Users can view own template triggers",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(user_id = auth.uid())",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "template_usage_history",
    "policyname": "Users can create template usage history",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(user_id = auth.uid())"
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "template_usage_history",
    "policyname": "Users can view own template usage history",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(user_id = auth.uid())",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "template_variables",
    "policyname": "Users can create template variables",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(user_id = auth.uid())"
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "template_variables",
    "policyname": "Users can delete own template variables",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "DELETE",
    "qual": "(user_id = auth.uid())",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "template_variables",
    "policyname": "Users can update own template variables",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(user_id = auth.uid())",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "template_variables",
    "policyname": "Users can view own template variables",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(user_id = auth.uid())",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "templates",
    "policyname": "Users can create templates",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(created_by = auth.uid())"
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "templates",
    "policyname": "Users can delete own templates",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "DELETE",
    "qual": "(created_by = auth.uid())",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "templates",
    "policyname": "Users can update own templates",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(created_by = auth.uid())",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "templates",
    "policyname": "Users can view own templates",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "((created_by = auth.uid()) OR (EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND ((profiles.role)::text = ANY ((ARRAY['admin'::character varying, 'agent'::character varying])::text[]))))))",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "training_datasets",
    "policyname": "Users can create training datasets",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(user_id = auth.uid())"
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "training_datasets",
    "policyname": "Users can update own training datasets",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(user_id = auth.uid())",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "training_datasets",
    "policyname": "Users can view own training datasets",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(user_id = auth.uid())",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "training_jobs",
    "policyname": "Users can create training jobs",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(user_id = auth.uid())"
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "training_jobs",
    "policyname": "Users can update own training jobs",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(user_id = auth.uid())",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "training_jobs",
    "policyname": "Users can view own training jobs",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(user_id = auth.uid())",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "training_metrics_history",
    "policyname": "Users can create training metrics",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(user_id = auth.uid())"
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "training_metrics_history",
    "policyname": "Users can view own training metrics",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(user_id = auth.uid())",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "training_results",
    "policyname": "Users can create training results",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(user_id = auth.uid())"
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "training_results",
    "policyname": "Users can view own training results",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(user_id = auth.uid())",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "training_scenarios",
    "policyname": "Users can create training scenarios",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(user_id = auth.uid())"
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "training_scenarios",
    "policyname": "Users can update own training scenarios",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(user_id = auth.uid())",
    "with_check": null
  },
  {
    "section": "=== RLS POLICIES ===",
    "schemaname": "public",
    "tablename": "training_scenarios",
    "policyname": "Users can view own training scenarios",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(user_id = auth.uid())",
    "with_check": null
  }
]" 

11. "[
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
    "tablename": "ai_response_queue",
    "inserts": 8,
    "updates": 0,
    "deletes": 0,
    "live_rows": 0,
    "dead_rows": 8,
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
    "inserts": 32,
    "updates": 62,
    "deletes": 0,
    "live_rows": 3,
    "dead_rows": 37,
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
    "inserts": 33,
    "updates": 67,
    "deletes": 4,
    "live_rows": 0,
    "dead_rows": 49,
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
    "inserts": 40,
    "updates": 52,
    "deletes": 4,
    "live_rows": 3,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": "2025-07-17 16:48:54.764816+00",
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
    "tablename": "knowledge_gaps",
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
    "tablename": "learning_insights",
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
    "inserts": 56,
    "updates": 0,
    "deletes": 6,
    "live_rows": 0,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": "2025-07-17 16:48:54.762697+00",
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
    "tablename": "pattern_recognition",
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
    "inserts": 13,
    "updates": 0,
    "deletes": 0,
    "live_rows": 5,
    "dead_rows": 8,
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
    "tablename": "template_ab_tests",
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
    "tablename": "template_analytics",
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
    "tablename": "template_categories",
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
    "tablename": "template_optimization",
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
    "tablename": "template_performance_metrics",
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
    "tablename": "template_suggestions",
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
    "tablename": "template_triggers",
    "inserts": 1,
    "updates": 0,
    "deletes": 0,
    "live_rows": 1,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "template_usage_history",
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
    "tablename": "template_variables",
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
    "tablename": "templates",
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
    "tablename": "training_datasets",
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
    "tablename": "training_jobs",
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
    "tablename": "training_metrics_history",
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
    "tablename": "training_results",
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
    "tablename": "training_scenarios",
    "inserts": 2,
    "updates": 0,
    "deletes": 0,
    "live_rows": 2,
    "dead_rows": 0,
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "section": "=== TABLE STATS ===",
    "schemaname": "public",
    "tablename": "training_sessions",
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

12. "[
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

16. "Success. No rows returned" 

17. "Success. No rows returned" 

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
    "total_size": "280 kB",
    "table_size": "0 bytes",
    "index_size": "280 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "conversations",
    "total_size": "216 kB",
    "table_size": "8192 bytes",
    "index_size": "208 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "customer_profiles",
    "total_size": "160 kB",
    "table_size": "8192 bytes",
    "index_size": "152 kB"
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
    "tablename": "templates",
    "total_size": "112 kB",
    "table_size": "8192 bytes",
    "index_size": "104 kB"
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
    "tablename": "ai_response_queue",
    "total_size": "96 kB",
    "table_size": "8192 bytes",
    "index_size": "88 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "template_triggers",
    "total_size": "96 kB",
    "table_size": "8192 bytes",
    "index_size": "88 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "training_scenarios",
    "total_size": "80 kB",
    "table_size": "8192 bytes",
    "index_size": "72 kB"
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
    "tablename": "knowledge_categories",
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
    "tablename": "website_scan_jobs",
    "total_size": "64 kB",
    "table_size": "8192 bytes",
    "index_size": "56 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "template_suggestions",
    "total_size": "64 kB",
    "table_size": "0 bytes",
    "index_size": "64 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "template_optimization",
    "total_size": "64 kB",
    "table_size": "0 bytes",
    "index_size": "64 kB"
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
    "tablename": "scan_job_logs",
    "total_size": "48 kB",
    "table_size": "8192 bytes",
    "index_size": "40 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "template_categories",
    "total_size": "48 kB",
    "table_size": "8192 bytes",
    "index_size": "40 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "training_jobs",
    "total_size": "48 kB",
    "table_size": "0 bytes",
    "index_size": "48 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "training_sessions",
    "total_size": "48 kB",
    "table_size": "0 bytes",
    "index_size": "48 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "training_metrics_history",
    "total_size": "48 kB",
    "table_size": "0 bytes",
    "index_size": "48 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "knowledge_gaps",
    "total_size": "48 kB",
    "table_size": "0 bytes",
    "index_size": "48 kB"
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
    "tablename": "template_variables",
    "total_size": "48 kB",
    "table_size": "0 bytes",
    "index_size": "48 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "template_analytics",
    "total_size": "48 kB",
    "table_size": "0 bytes",
    "index_size": "48 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "template_usage_history",
    "total_size": "48 kB",
    "table_size": "0 bytes",
    "index_size": "48 kB"
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
    "tablename": "template_ab_tests",
    "total_size": "40 kB",
    "table_size": "0 bytes",
    "index_size": "40 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "learning_insights",
    "total_size": "40 kB",
    "table_size": "0 bytes",
    "index_size": "40 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "pattern_recognition",
    "total_size": "40 kB",
    "table_size": "0 bytes",
    "index_size": "40 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "template_performance_metrics",
    "total_size": "40 kB",
    "table_size": "0 bytes",
    "index_size": "40 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "training_datasets",
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
    "tablename": "webhook_events",
    "total_size": "40 kB",
    "table_size": "0 bytes",
    "index_size": "40 kB"
  },
  {
    "section": "=== TABLE SIZES ===",
    "schemaname": "public",
    "tablename": "training_results",
    "total_size": "40 kB",
    "table_size": "0 bytes",
    "index_size": "40 kB"
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
    "tablename": "alert_rules",
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
    "tablename": "conversation_transfers",
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
    "tablename": "workflow_executions",
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
    "tablename": "integrations",
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
    "tablename": "content_processing_queue",
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
    "tablename": "auto_generated_knowledge",
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
    "tablename": "knowledge_base",
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
    "tablename": "webhook_subscriptions",
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
    "tablename": "onboarding_responses",
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
    "tablename": "intent_patterns",
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
    "tablename": "alert_history",
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
  }
]"