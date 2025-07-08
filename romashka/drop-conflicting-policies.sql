-- Drop Conflicting RLS Policies
-- Run this to remove existing policies that conflict with complete-schema.sql

-- Drop all existing policies that might conflict
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to view own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated access" ON profiles;

DROP POLICY IF EXISTS "Allow authenticated access" ON conversations;
DROP POLICY IF EXISTS "Allow authenticated access" ON messages;
DROP POLICY IF EXISTS "Allow authenticated access" ON customer_profiles;
DROP POLICY IF EXISTS "Allow authenticated access" ON knowledge_items;
DROP POLICY IF EXISTS "Allow authenticated access" ON knowledge_categories;
DROP POLICY IF EXISTS "Allow authenticated access" ON canned_responses;
DROP POLICY IF EXISTS "Allow authenticated access" ON agent_availability;
DROP POLICY IF EXISTS "Allow authenticated access" ON conversation_notes;
DROP POLICY IF EXISTS "Allow authenticated access" ON file_attachments;
DROP POLICY IF EXISTS "Allow authenticated access" ON daily_metrics;
DROP POLICY IF EXISTS "Allow authenticated access" ON realtime_metrics;
DROP POLICY IF EXISTS "Allow authenticated access" ON conversation_analytics;
DROP POLICY IF EXISTS "Allow authenticated access" ON dashboard_configs;
DROP POLICY IF EXISTS "Allow authenticated access" ON scheduled_reports;
DROP POLICY IF EXISTS "Allow authenticated access" ON playground_sessions;
DROP POLICY IF EXISTS "Allow authenticated access" ON widget_configurations;
DROP POLICY IF EXISTS "Allow authenticated access" ON workflows;
DROP POLICY IF EXISTS "Allow authenticated access" ON workflow_executions;
DROP POLICY IF EXISTS "Allow authenticated access" ON website_scan_jobs;
DROP POLICY IF EXISTS "Allow authenticated access" ON extracted_content;
DROP POLICY IF EXISTS "Allow authenticated access" ON intent_patterns;
DROP POLICY IF EXISTS "Allow authenticated access" ON conversation_context;
DROP POLICY IF EXISTS "Allow authenticated access" ON communication_channels;
DROP POLICY IF EXISTS "Allow authenticated access" ON message_templates;
DROP POLICY IF EXISTS "Allow authenticated access" ON integrations;
DROP POLICY IF EXISTS "Allow authenticated access" ON integration_field_mappings;
DROP POLICY IF EXISTS "Allow authenticated access" ON webhook_events;
DROP POLICY IF EXISTS "Allow authenticated access" ON audit_logs;
DROP POLICY IF EXISTS "Allow authenticated access" ON conversation_transfers;
DROP POLICY IF EXISTS "Allow authenticated access" ON sla_tracking;
DROP POLICY IF EXISTS "Allow authenticated access" ON customer_channel_preferences;

-- Drop other common policy names that might conflict
DROP POLICY IF EXISTS "Agents can view own availability" ON agent_availability;
DROP POLICY IF EXISTS "Agents can update own availability" ON agent_availability;
DROP POLICY IF EXISTS "Agents can insert own availability" ON agent_availability;

DROP POLICY IF EXISTS "Allow authenticated users to view public responses" ON canned_responses;
DROP POLICY IF EXISTS "Allow users to create responses" ON canned_responses;
DROP POLICY IF EXISTS "Allow users to update own responses" ON canned_responses;

DROP POLICY IF EXISTS "Allow agents to view conversation notes" ON conversation_notes;
DROP POLICY IF EXISTS "Allow agents to create notes" ON conversation_notes;

DROP POLICY IF EXISTS "Allow authenticated users to view customer profiles" ON customer_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update customer profiles" ON customer_profiles;

DROP POLICY IF EXISTS "Allow authenticated users to view attachments" ON file_attachments;
DROP POLICY IF EXISTS "Allow authenticated users to upload attachments" ON file_attachments;

DROP POLICY IF EXISTS "Allow authenticated users to view transfers" ON conversation_transfers;
DROP POLICY IF EXISTS "Allow agents to create transfers" ON conversation_transfers;

DROP POLICY IF EXISTS "Allow authenticated users to view SLA data" ON sla_tracking;
DROP POLICY IF EXISTS "Allow system to create SLA records" ON sla_tracking;

-- Drop any other policies that might exist on these tables
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

-- Verification - show remaining policies (should be empty or very few)
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

SELECT 'All conflicting policies dropped! Now run complete-schema.sql' as status;