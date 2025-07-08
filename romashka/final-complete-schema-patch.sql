-- Final Comprehensive Patch for Complete Schema
-- Run this to ensure ALL tables exist with proper columns before running complete-schema.sql

-- Create conversation_transfers table if it doesn't exist
CREATE TABLE IF NOT EXISTS conversation_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  from_agent_id UUID REFERENCES profiles(id),
  to_agent_id UUID REFERENCES profiles(id),
  transfer_reason TEXT,
  transfer_type VARCHAR(50) DEFAULT 'manual',
  transfer_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'pending'
);

-- Create sla_tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS sla_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sla_type VARCHAR(50) NOT NULL,
  target_time_seconds INTEGER NOT NULL,
  actual_time_seconds INTEGER,
  status VARCHAR(20) DEFAULT 'pending',
  breach_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create knowledge_categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS knowledge_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES knowledge_categories(id),
  order_index INTEGER DEFAULT 0,
  icon VARCHAR(100),
  color VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create knowledge_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS knowledge_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  category_id UUID REFERENCES knowledge_categories(id),
  source_type VARCHAR(50) NOT NULL,
  source_url TEXT,
  file_path TEXT,
  confidence_score DECIMAL(3,2) DEFAULT 0.8,
  usage_count INTEGER DEFAULT 0,
  effectiveness_score DECIMAL(3,2) DEFAULT 0.5,
  language VARCHAR(10) DEFAULT 'en',
  tags TEXT[] DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'active',
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create communication_channels table if it doesn't exist
CREATE TABLE IF NOT EXISTS communication_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  configuration JSONB NOT NULL DEFAULT '{}',
  webhook_url TEXT,
  webhook_secret VARCHAR(255),
  api_credentials JSONB,
  message_limit_per_day INTEGER DEFAULT 1000,
  messages_sent_today INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create message_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  language VARCHAR(10) NOT NULL,
  category VARCHAR(50) NOT NULL,
  template_content JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'pending',
  channel_type VARCHAR(50) NOT NULL,
  external_template_id VARCHAR(255),
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create integrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  provider VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'inactive',
  configuration JSONB NOT NULL DEFAULT '{}',
  credentials JSONB NOT NULL DEFAULT '{}',
  sync_settings JSONB DEFAULT '{}',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_frequency INTEGER DEFAULT 3600,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create widget_configurations table if it doesn't exist
CREATE TABLE IF NOT EXISTS widget_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  widget_name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  configuration JSONB NOT NULL DEFAULT '{}',
  embed_code TEXT,
  status VARCHAR(50) DEFAULT 'active',
  install_verified BOOLEAN DEFAULT false,
  custom_css TEXT,
  custom_js TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workflows table if it doesn't exist
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(50) NOT NULL,
  trigger_conditions JSONB DEFAULT '{}',
  steps JSONB NOT NULL DEFAULT '[]',
  nodes JSONB NOT NULL DEFAULT '[]',
  connections JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT false,
  execution_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workflow_executions table if it doesn't exist
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  current_node_id TEXT,
  context JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'running',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  execution_log JSONB DEFAULT '[]'
);

-- Create website_scan_jobs table if it doesn't exist
CREATE TABLE IF NOT EXISTS website_scan_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID,
  urls TEXT[] NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  progress_percentage INTEGER DEFAULT 0,
  pages_found INTEGER DEFAULT 0,
  pages_processed INTEGER DEFAULT 0,
  scan_settings JSONB DEFAULT '{"maxDepth": 2, "respectRobots": true, "maxPages": 50}',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Now add missing status columns to existing tables (if they don't have them)
ALTER TABLE conversation_transfers ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE sla_tracking ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE communication_channels ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE message_templates ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE integrations ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'inactive';
ALTER TABLE widget_configurations ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE workflow_executions ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'running';
ALTER TABLE website_scan_jobs ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';

-- Add any other missing columns that might be expected
ALTER TABLE conversation_transfers ADD COLUMN IF NOT EXISTS transfer_type VARCHAR(50) DEFAULT 'manual';
ALTER TABLE conversation_transfers ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE conversation_transfers ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE sla_tracking ADD COLUMN IF NOT EXISTS breach_reason TEXT;
ALTER TABLE sla_tracking ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2) DEFAULT 0.8;
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS effectiveness_score DECIMAL(3,2) DEFAULT 0.5;
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES profiles(id);
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE communication_channels ADD COLUMN IF NOT EXISTS webhook_url TEXT;
ALTER TABLE communication_channels ADD COLUMN IF NOT EXISTS webhook_secret VARCHAR(255);
ALTER TABLE communication_channels ADD COLUMN IF NOT EXISTS api_credentials JSONB;
ALTER TABLE communication_channels ADD COLUMN IF NOT EXISTS message_limit_per_day INTEGER DEFAULT 1000;
ALTER TABLE communication_channels ADD COLUMN IF NOT EXISTS messages_sent_today INTEGER DEFAULT 0;
ALTER TABLE communication_channels ADD COLUMN IF NOT EXISTS last_reset_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE communication_channels ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);
ALTER TABLE communication_channels ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create basic indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversation_transfers_conversation_id ON conversation_transfers(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_transfers_status ON conversation_transfers(status);
CREATE INDEX IF NOT EXISTS idx_sla_tracking_conversation_id ON sla_tracking(conversation_id);
CREATE INDEX IF NOT EXISTS idx_sla_tracking_status ON sla_tracking(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_status ON knowledge_items(status);
CREATE INDEX IF NOT EXISTS idx_communication_channels_status ON communication_channels(status);
CREATE INDEX IF NOT EXISTS idx_message_templates_status ON message_templates(status);
CREATE INDEX IF NOT EXISTS idx_integrations_status ON integrations(status);
CREATE INDEX IF NOT EXISTS idx_widget_configurations_status ON widget_configurations(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_website_scan_jobs_status ON website_scan_jobs(status);

-- Enable RLS on all tables
ALTER TABLE conversation_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_scan_jobs ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (allow authenticated access)
DROP POLICY IF EXISTS "Allow authenticated access" ON conversation_transfers;
CREATE POLICY "Allow authenticated access" ON conversation_transfers FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated access" ON sla_tracking;
CREATE POLICY "Allow authenticated access" ON sla_tracking FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated access" ON knowledge_categories;
CREATE POLICY "Allow authenticated access" ON knowledge_categories FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated access" ON knowledge_items;
CREATE POLICY "Allow authenticated access" ON knowledge_items FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated access" ON communication_channels;
CREATE POLICY "Allow authenticated access" ON communication_channels FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated access" ON message_templates;
CREATE POLICY "Allow authenticated access" ON message_templates FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated access" ON integrations;
CREATE POLICY "Allow authenticated access" ON integrations FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated access" ON widget_configurations;
CREATE POLICY "Allow authenticated access" ON widget_configurations FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated access" ON workflows;
CREATE POLICY "Allow authenticated access" ON workflows FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated access" ON workflow_executions;
CREATE POLICY "Allow authenticated access" ON workflow_executions FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated access" ON website_scan_jobs;
CREATE POLICY "Allow authenticated access" ON website_scan_jobs FOR ALL USING (auth.role() = 'authenticated');

-- Final verification - check all status columns exist
SELECT 
  'Status Column Verification' as check_type,
  table_name,
  column_name,
  '✓ EXISTS' as status
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND column_name = 'status'
  AND table_name IN (
    'conversations', 'conversation_transfers', 'sla_tracking', 
    'knowledge_items', 'communication_channels', 'message_templates',
    'integrations', 'widget_configurations', 'workflow_executions', 
    'website_scan_jobs'
  )
ORDER BY table_name;

-- Show total table count
SELECT 
  'Final Table Count' as check_type,
  COUNT(*)::text || ' tables ready' as item,
  '✓ PREPARED FOR COMPLETE SCHEMA' as status
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

SELECT 'Final comprehensive patch completed! Ready for complete-schema.sql' as status;