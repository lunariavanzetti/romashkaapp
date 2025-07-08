-- Drop Conflicting RLS Policies - Safe Version
-- Run this to remove existing policies that conflict with complete-schema.sql
-- This version checks if tables exist before dropping policies

-- Drop policies only on tables that exist using dynamic SQL with existence checks
DO $$
DECLARE
    table_names TEXT[] := ARRAY[
        'profiles', 'conversations', 'messages', 'customer_profiles', 
        'knowledge_items', 'knowledge_categories', 'canned_responses', 
        'agent_availability', 'conversation_notes', 'file_attachments',
        'daily_metrics', 'realtime_metrics', 'conversation_analytics',
        'dashboard_configs', 'scheduled_reports', 'playground_sessions',
        'widget_configurations', 'workflows', 'workflow_executions',
        'website_scan_jobs', 'extracted_content', 'intent_patterns',
        'conversation_context', 'communication_channels', 'message_templates',
        'integrations', 'integration_field_mappings', 'webhook_events',
        'audit_logs', 'conversation_transfers', 'sla_tracking',
        'customer_channel_preferences'
    ];
    table_name TEXT;
BEGIN
    -- Loop through each table name
    FOREACH table_name IN ARRAY table_names
    LOOP
        -- Check if table exists before dropping policies
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND information_schema.tables.table_name = table_name
        ) THEN
            -- Drop common policy patterns for existing tables
            EXECUTE format('DROP POLICY IF EXISTS %L ON %I', 'Allow authenticated access', table_name);
            EXECUTE format('DROP POLICY IF EXISTS %L ON %I', 'Users can view own profile', table_name);
            EXECUTE format('DROP POLICY IF EXISTS %L ON %I', 'Users can update own profile', table_name);
            EXECUTE format('DROP POLICY IF EXISTS %L ON %I', 'Allow users to view own profile', table_name);
            EXECUTE format('DROP POLICY IF EXISTS %L ON %I', 'Allow users to update own profile', table_name);
            
            -- Drop specific policies that might exist
            IF table_name = 'agent_availability' THEN
                EXECUTE format('DROP POLICY IF EXISTS %L ON %I', 'Agents can view own availability', table_name);
                EXECUTE format('DROP POLICY IF EXISTS %L ON %I', 'Agents can update own availability', table_name);
                EXECUTE format('DROP POLICY IF EXISTS %L ON %I', 'Agents can insert own availability', table_name);
            END IF;
            
            IF table_name = 'canned_responses' THEN
                EXECUTE format('DROP POLICY IF EXISTS %L ON %I', 'Allow authenticated users to view public responses', table_name);
                EXECUTE format('DROP POLICY IF EXISTS %L ON %I', 'Allow users to create responses', table_name);
                EXECUTE format('DROP POLICY IF EXISTS %L ON %I', 'Allow users to update own responses', table_name);
            END IF;
            
            IF table_name = 'conversation_notes' THEN
                EXECUTE format('DROP POLICY IF EXISTS %L ON %I', 'Allow agents to view conversation notes', table_name);
                EXECUTE format('DROP POLICY IF EXISTS %L ON %I', 'Allow agents to create notes', table_name);
            END IF;
            
            IF table_name = 'customer_profiles' THEN
                EXECUTE format('DROP POLICY IF EXISTS %L ON %I', 'Allow authenticated users to view customer profiles', table_name);
                EXECUTE format('DROP POLICY IF EXISTS %L ON %I', 'Allow authenticated users to update customer profiles', table_name);
            END IF;
            
            IF table_name = 'file_attachments' THEN
                EXECUTE format('DROP POLICY IF EXISTS %L ON %I', 'Allow authenticated users to view attachments', table_name);
                EXECUTE format('DROP POLICY IF EXISTS %L ON %I', 'Allow authenticated users to upload attachments', table_name);
            END IF;
            
            IF table_name = 'conversation_transfers' THEN
                EXECUTE format('DROP POLICY IF EXISTS %L ON %I', 'Allow authenticated users to view transfers', table_name);
                EXECUTE format('DROP POLICY IF EXISTS %L ON %I', 'Allow agents to create transfers', table_name);
            END IF;
            
            IF table_name = 'sla_tracking' THEN
                EXECUTE format('DROP POLICY IF EXISTS %L ON %I', 'Allow authenticated users to view SLA data', table_name);
                EXECUTE format('DROP POLICY IF EXISTS %L ON %I', 'Allow system to create SLA records', table_name);
            END IF;
        END IF;
    END LOOP;
END $$;

-- Now drop ALL existing policies using the system catalog (safest approach)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Verification - show any remaining policies (should be empty)
SELECT 
  'Remaining Policies' as check_type,
  tablename,
  policyname,
  'Still exists' as status
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Show count of remaining policies
SELECT 
  'Policy Count' as check_type,
  COUNT(*)::text || ' policies remaining' as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ ALL CLEARED'
    ELSE '⚠ Some policies remain'
  END as status
FROM pg_policies 
WHERE schemaname = 'public';

-- Show which tables currently exist
SELECT 
  'Existing Tables' as check_type,
  table_name,
  '✓ EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

SELECT 'All conflicting policies safely dropped! Now run complete-schema.sql' as status;