-- ROMASHKA Master Database Schema
-- Complete database infrastructure for customer support platform
-- Version: 1.0.0
-- Compatible with: PostgreSQL 14+ / Supabase

-- ================================
-- EXTENSIONS & SETUP
-- ================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================
-- CORE USER MANAGEMENT
-- ================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name TEXT,
  company_name TEXT,
  website_url TEXT,
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'user', -- 'admin', 'agent', 'user'
  timezone VARCHAR(50) DEFAULT 'UTC',
  language VARCHAR(10) DEFAULT 'en',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_data JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- CUSTOMER MANAGEMENT
-- ================================

-- Customer profiles with custom fields
CREATE TABLE IF NOT EXISTS customer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  location VARCHAR(255),
  timezone VARCHAR(50) DEFAULT 'UTC',
  language VARCHAR(10) DEFAULT 'en',
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  total_conversations INTEGER DEFAULT 0,
  avg_satisfaction DECIMAL(3,2) DEFAULT 0,
  last_interaction TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'blocked', 'vip'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- AGENT MANAGEMENT
-- ================================

-- Agent availability and status tracking
CREATE TABLE IF NOT EXISTS agent_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  is_online BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'available', -- 'available', 'busy', 'away', 'offline'
  max_concurrent_chats INTEGER DEFAULT 5,
  current_chat_count INTEGER DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  auto_away_time INTEGER DEFAULT 300, -- seconds
  working_hours JSONB DEFAULT '{"monday": {"start": "09:00", "end": "17:00"}, "tuesday": {"start": "09:00", "end": "17:00"}, "wednesday": {"start": "09:00", "end": "17:00"}, "thursday": {"start": "09:00", "end": "17:00"}, "friday": {"start": "09:00", "end": "17:00"}}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Canned responses with categories
CREATE TABLE IF NOT EXISTS canned_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  shortcut VARCHAR(50), -- e.g., '/greeting', '/pricing'
  category VARCHAR(100) DEFAULT 'general',
  language VARCHAR(10) DEFAULT 'en',
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- COMMUNICATION CHANNELS
-- ================================

-- Communication channels (WhatsApp, Email, etc.)
CREATE TABLE IF NOT EXISTS communication_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'whatsapp', 'messenger', 'instagram', 'email', 'sms', 'website'
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'pending_setup'
  configuration JSONB NOT NULL DEFAULT '{}',
  webhook_url TEXT,
  webhook_secret VARCHAR(255),
  api_credentials JSONB, -- Encrypted credentials
  message_limit_per_day INTEGER DEFAULT 1000,
  messages_sent_today INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message templates (for channels)
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  language VARCHAR(10) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'utility', 'marketing', 'authentication'
  template_content JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  channel_type VARCHAR(50) NOT NULL,
  external_template_id VARCHAR(255),
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer channel preferences
CREATE TABLE IF NOT EXISTS customer_channel_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE,
  channel_type VARCHAR(50) NOT NULL,
  is_preferred BOOLEAN DEFAULT false,
  opt_in BOOLEAN DEFAULT true,
  last_interaction TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, channel_type)
);

-- Channel routing rules
CREATE TABLE IF NOT EXISTS channel_routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  priority INTEGER DEFAULT 0,
  conditions JSONB NOT NULL DEFAULT '{}', -- Business hours, customer type, etc.
  target_channel_type VARCHAR(50) NOT NULL,
  fallback_channel_type VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- CONVERSATIONS & MESSAGES
-- ================================

-- Enhanced conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE,
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  assigned_agent_id UUID REFERENCES profiles(id),
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'resolved', 'escalated', 'closed'
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  channel_type VARCHAR(50) DEFAULT 'website',
  channel_id UUID REFERENCES communication_channels(id),
  external_conversation_id VARCHAR(255),
  customer_phone VARCHAR(50),
  customer_social_id VARCHAR(255),
  tags TEXT[] DEFAULT '{}',
  satisfaction_score DECIMAL(3,2),
  resolution_time_seconds INTEGER,
  handoff_reason TEXT,
  department VARCHAR(100) DEFAULT 'general',
  -- AI enhancements
  language VARCHAR(10) DEFAULT 'en',
  sentiment VARCHAR(20), -- 'positive', 'negative', 'neutral'
  intent VARCHAR(100),
  ai_confidence DECIMAL(3,2),
  business_context JSONB DEFAULT '{}',
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  -- Metadata
  last_message TEXT,
  message_count INTEGER DEFAULT 0,
  workflow_id UUID
);

-- Enhanced messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL, -- 'user', 'ai', 'agent'
  sender_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  channel_type VARCHAR(50) DEFAULT 'website',
  external_message_id VARCHAR(255),
  message_type VARCHAR(50) DEFAULT 'text', -- 'text', 'image', 'audio', 'video', 'document', 'location'
  media_url TEXT,
  media_caption TEXT,
  delivery_status VARCHAR(50) DEFAULT 'sent', -- 'sent', 'delivered', 'read', 'failed'
  metadata JSONB DEFAULT '{}',
  -- AI enhancements
  confidence_score DECIMAL(3,2),
  processing_time_ms INTEGER,
  intent_detected VARCHAR(100),
  knowledge_sources JSONB DEFAULT '{}',
  tokens_used INTEGER,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation notes and internal comments
CREATE TABLE IF NOT EXISTS conversation_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT true,
  note_type VARCHAR(50) DEFAULT 'general', -- 'general', 'escalation', 'resolution'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File attachments and media storage
CREATE TABLE IF NOT EXISTS file_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  file_hash VARCHAR(64), -- SHA-256 hash for deduplication
  uploaded_by UUID REFERENCES profiles(id),
  storage_provider VARCHAR(50) DEFAULT 'supabase', -- 'supabase', 'aws', 'gcs'
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation transfers
CREATE TABLE IF NOT EXISTS conversation_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  from_agent_id UUID REFERENCES profiles(id),
  to_agent_id UUID REFERENCES profiles(id),
  transfer_reason TEXT,
  transfer_type VARCHAR(50) DEFAULT 'manual', -- 'manual', 'automatic', 'escalation'
  transfer_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'pending' -- 'pending', 'accepted', 'rejected'
);

-- SLA tracking
CREATE TABLE IF NOT EXISTS sla_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sla_type VARCHAR(50) NOT NULL, -- 'first_response', 'resolution', 'handoff'
  target_time_seconds INTEGER NOT NULL,
  actual_time_seconds INTEGER,
  status VARCHAR(20) DEFAULT 'pending', -- 'met', 'breached', 'pending'
  breach_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Message delivery tracking
CREATE TABLE IF NOT EXISTS message_delivery_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  channel_type VARCHAR(50) NOT NULL,
  external_message_id VARCHAR(255),
  delivery_status VARCHAR(50) DEFAULT 'sent',
  delivery_timestamp TIMESTAMP WITH TIME ZONE,
  read_timestamp TIMESTAMP WITH TIME ZONE,
  error_details JSONB,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- KNOWLEDGE MANAGEMENT
-- ================================

-- Knowledge categories
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

-- Knowledge items
CREATE TABLE IF NOT EXISTS knowledge_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  category_id UUID REFERENCES knowledge_categories(id),
  source_type VARCHAR(50) NOT NULL, -- 'url', 'file', 'manual'
  source_url TEXT,
  file_path TEXT,
  confidence_score DECIMAL(3,2) DEFAULT 0.8,
  usage_count INTEGER DEFAULT 0,
  effectiveness_score DECIMAL(3,2) DEFAULT 0.5,
  language VARCHAR(10) DEFAULT 'en',
  tags TEXT[] DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'draft', 'archived'
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge versions (for version control)
CREATE TABLE IF NOT EXISTS knowledge_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_item_id UUID REFERENCES knowledge_items(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  changes_description TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge analytics
CREATE TABLE IF NOT EXISTS knowledge_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_item_id UUID REFERENCES knowledge_items(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  was_helpful BOOLEAN,
  feedback_text TEXT,
  usage_context VARCHAR(100), -- 'chat', 'search', 'suggestion'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- INTEGRATIONS
-- ================================

-- Integration configurations
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL, -- 'crm', 'helpdesk', 'ecommerce', 'email_marketing'
  provider VARCHAR(100) NOT NULL, -- 'salesforce', 'hubspot', 'zendesk', 'shopify'
  status VARCHAR(50) DEFAULT 'inactive', -- 'active', 'inactive', 'error', 'pending_setup'
  configuration JSONB NOT NULL DEFAULT '{}',
  credentials JSONB NOT NULL DEFAULT '{}', -- Encrypted
  sync_settings JSONB DEFAULT '{}',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_frequency INTEGER DEFAULT 3600, -- seconds
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Integration field mappings
CREATE TABLE IF NOT EXISTS integration_field_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  source_entity VARCHAR(100) NOT NULL, -- 'conversation', 'customer', 'message'
  target_entity VARCHAR(100) NOT NULL, -- 'contact', 'deal', 'ticket'
  source_field VARCHAR(255) NOT NULL,
  target_field VARCHAR(255) NOT NULL,
  transformation_rule TEXT, -- JSON transformation logic
  is_required BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sync jobs tracking
CREATE TABLE IF NOT EXISTS sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  job_type VARCHAR(100) NOT NULL, -- 'full_sync', 'incremental', 'real_time'
  direction VARCHAR(20) NOT NULL, -- 'inbound', 'outbound', 'bidirectional'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  records_processed INTEGER DEFAULT 0,
  records_total INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- WEBHOOKS & EVENTS
-- ================================

-- Webhook event logs
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES communication_channels(id),
  event_type VARCHAR(100) NOT NULL,
  source VARCHAR(100) NOT NULL, -- 'whatsapp', 'webhook', 'api'
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processing_attempts INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Webhook subscriptions
CREATE TABLE IF NOT EXISTS webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  webhook_url TEXT NOT NULL,
  secret_key VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  retry_count INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 30,
  last_triggered TIMESTAMP WITH TIME ZONE,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook logs for debugging
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_subscription_id UUID REFERENCES webhook_subscriptions(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB,
  response_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- ANALYTICS & REPORTING
-- ================================

-- Daily metrics aggregation
CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  channel_type VARCHAR(50),
  department VARCHAR(100),
  agent_id UUID REFERENCES profiles(id),
  -- Conversation metrics
  total_conversations INTEGER DEFAULT 0,
  ai_resolved_conversations INTEGER DEFAULT 0,
  human_resolved_conversations INTEGER DEFAULT 0,
  abandoned_conversations INTEGER DEFAULT 0,
  -- Response time metrics
  avg_first_response_time_seconds INTEGER DEFAULT 0,
  avg_resolution_time_seconds INTEGER DEFAULT 0,
  -- Satisfaction metrics
  total_ratings INTEGER DEFAULT 0,
  avg_satisfaction_score DECIMAL(3,2) DEFAULT 0,
  -- AI performance
  ai_confidence_avg DECIMAL(3,2) DEFAULT 0,
  ai_accuracy_rate DECIMAL(3,2) DEFAULT 0,
  handoff_rate DECIMAL(3,2) DEFAULT 0,
  -- Business metrics
  leads_generated INTEGER DEFAULT 0,
  sales_qualified_leads INTEGER DEFAULT 0,
  revenue_attributed DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, channel_type, department, agent_id)
);

-- Real-time metrics cache
CREATE TABLE IF NOT EXISTS realtime_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(15,4) NOT NULL,
  dimensions JSONB DEFAULT '{}', -- For filtering/grouping
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 hour'
);

-- Conversation analytics
CREATE TABLE IF NOT EXISTS conversation_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE UNIQUE,
  -- Timing metrics
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  first_response_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  total_duration_seconds INTEGER,
  -- Interaction metrics
  total_messages INTEGER DEFAULT 0,
  customer_messages INTEGER DEFAULT 0,
  ai_messages INTEGER DEFAULT 0,
  agent_messages INTEGER DEFAULT 0,
  -- Resolution metrics
  resolved_by VARCHAR(20), -- 'ai', 'agent', 'abandoned'
  resolution_type VARCHAR(50), -- 'solved', 'escalated', 'abandoned', 'spam'
  handoff_count INTEGER DEFAULT 0,
  agent_switches INTEGER DEFAULT 0,
  -- Quality metrics
  customer_satisfaction INTEGER, -- 1-5 rating
  ai_accuracy_score DECIMAL(3,2),
  knowledge_items_used INTEGER DEFAULT 0,
  -- Business metrics
  lead_qualified BOOLEAN DEFAULT false,
  revenue_generated DECIMAL(10,2) DEFAULT 0,
  follow_up_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dashboard widget configurations
CREATE TABLE IF NOT EXISTS dashboard_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  layout JSONB NOT NULL DEFAULT '{}', -- Widget positions and configurations
  filters JSONB DEFAULT '{}', -- Default filters
  refresh_interval INTEGER DEFAULT 300, -- seconds
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scheduled reports configuration
CREATE TABLE IF NOT EXISTS scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  report_type VARCHAR(50) NOT NULL, -- 'performance', 'satisfaction', 'ai_analytics', 'custom'
  schedule_cron VARCHAR(100) NOT NULL, -- Cron expression
  recipients TEXT[] NOT NULL, -- Email addresses
  filters JSONB DEFAULT '{}',
  format VARCHAR(20) DEFAULT 'pdf', -- 'pdf', 'excel', 'csv'
  last_sent_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- PLAYGROUND & WIDGETS
-- ================================

-- Playground sessions
CREATE TABLE IF NOT EXISTS playground_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_name VARCHAR(255),
  bot_configuration JSONB NOT NULL DEFAULT '{}',
  test_conversations JSONB DEFAULT '[]',
  performance_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Widget configurations
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

-- ================================
-- WORKFLOW & AUTOMATION
-- ================================

-- Workflows
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(50) NOT NULL, -- 'manual', 'intent', 'keyword', 'schedule'
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

-- Workflow executions
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  current_node_id TEXT,
  context JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'running', -- 'running', 'completed', 'failed', 'paused'
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  execution_log JSONB DEFAULT '[]'
);

-- ================================
-- WEBSITE SCANNING
-- ================================

-- Website scan jobs
CREATE TABLE IF NOT EXISTS website_scan_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID,
  urls TEXT[] NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'scanning', 'processing', 'completed', 'failed'
  progress_percentage INTEGER DEFAULT 0,
  pages_found INTEGER DEFAULT 0,
  pages_processed INTEGER DEFAULT 0,
  scan_settings JSONB DEFAULT '{"maxDepth": 2, "respectRobots": true, "maxPages": 50}',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Extracted content
CREATE TABLE IF NOT EXISTS extracted_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_job_id UUID REFERENCES website_scan_jobs(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title VARCHAR(500),
  content TEXT NOT NULL,
  content_type VARCHAR(100), -- 'pricing', 'faq', 'about', 'product', 'policy', 'general'
  headings JSONB,
  metadata JSONB,
  word_count INTEGER,
  processing_quality DECIMAL(3,2),
  extracted_entities JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- AI & INTENT MANAGEMENT
-- ================================

-- Intent patterns
CREATE TABLE IF NOT EXISTS intent_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_name VARCHAR(100) NOT NULL,
  language VARCHAR(10) NOT NULL,
  patterns TEXT[] NOT NULL,
  examples JSONB,
  confidence_threshold DECIMAL(3,2) DEFAULT 0.8,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation context
CREATE TABLE IF NOT EXISTS conversation_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE UNIQUE,
  context_data JSONB NOT NULL,
  last_intent VARCHAR(100),
  conversation_summary TEXT,
  key_entities JSONB,
  customer_preferences JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- SYSTEM UTILITIES
-- ================================

-- System settings
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(255) NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- PERFORMANCE INDEXES
-- ================================

-- Primary relationship indexes
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agent_id ON conversations(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_channel_type ON conversations(channel_type);
CREATE INDEX IF NOT EXISTS idx_conversations_status_created_at ON conversations(status, created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_agent_status ON conversations(assigned_agent_id, status);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_type ON messages(sender_type);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_customer_profiles_email ON customer_profiles(email);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_phone ON customer_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_created_at ON customer_profiles(created_at);

-- Agent and availability indexes
CREATE INDEX IF NOT EXISTS idx_agent_availability_agent_id ON agent_availability(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_availability_is_online ON agent_availability(is_online);
CREATE INDEX IF NOT EXISTS idx_agent_availability_status ON agent_availability(status);

-- Knowledge management indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_items_category_id ON knowledge_items(category_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_status ON knowledge_items(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_language ON knowledge_items(language);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(date);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_agent_id ON daily_metrics(agent_id);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_channel_type ON daily_metrics(channel_type);

-- Webhook and integration indexes
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);
CREATE INDEX IF NOT EXISTS idx_integrations_status ON integrations(status);

-- Canned responses indexes
CREATE INDEX IF NOT EXISTS idx_canned_responses_category ON canned_responses(category);
CREATE INDEX IF NOT EXISTS idx_canned_responses_shortcut ON canned_responses(shortcut);
CREATE INDEX IF NOT EXISTS idx_canned_responses_language ON canned_responses(language);

-- Text search indexes (for large datasets)
CREATE INDEX IF NOT EXISTS idx_knowledge_items_content_trgm ON knowledge_items USING gin(content gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_title_trgm ON knowledge_items USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_messages_content_trgm ON messages USING gin(content gin_trgm_ops);

-- ================================
-- ROW LEVEL SECURITY (RLS)
-- ================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE canned_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_channel_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_routing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_delivery_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_field_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtime_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE playground_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_scan_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE intent_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ================================
-- RLS POLICIES
-- ================================

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Customer profiles policies
CREATE POLICY "Allow authenticated access to customer profiles" ON customer_profiles
  FOR ALL USING (auth.role() = 'authenticated');

-- Agent availability policies
CREATE POLICY "Agents can manage own availability" ON agent_availability
  FOR ALL USING (auth.uid() = agent_id);

CREATE POLICY "Allow viewing all agent availability" ON agent_availability
  FOR SELECT USING (auth.role() = 'authenticated');

-- Conversations policies
CREATE POLICY "Allow authenticated access to conversations" ON conversations
  FOR ALL USING (auth.role() = 'authenticated');

-- Messages policies
CREATE POLICY "Allow authenticated access to messages" ON messages
  FOR ALL USING (auth.role() = 'authenticated');

-- Knowledge management policies
CREATE POLICY "Allow authenticated access to knowledge items" ON knowledge_items
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access to knowledge categories" ON knowledge_categories
  FOR ALL USING (auth.role() = 'authenticated');

-- Canned responses policies
CREATE POLICY "Allow viewing public canned responses" ON canned_responses
  FOR SELECT USING (auth.role() = 'authenticated' AND (is_public = true OR created_by = auth.uid()));

CREATE POLICY "Allow managing own canned responses" ON canned_responses
  FOR ALL USING (auth.uid() = created_by);

-- Integration policies
CREATE POLICY "Allow managing own integrations" ON integrations
  FOR ALL USING (auth.uid() = created_by);

-- Analytics policies (read-only for most users)
CREATE POLICY "Allow authenticated access to analytics" ON daily_metrics
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access to conversation analytics" ON conversation_analytics
  FOR ALL USING (auth.role() = 'authenticated');

-- Dashboard and widget policies
CREATE POLICY "Allow managing own dashboards" ON dashboard_configs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Allow managing own widgets" ON widget_configurations
  FOR ALL USING (auth.uid() = user_id);

-- Workflow policies
CREATE POLICY "Allow managing own workflows" ON workflows
  FOR ALL USING (auth.uid() = user_id);

-- General authenticated access for remaining tables
CREATE POLICY "Allow authenticated access" ON conversation_notes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON file_attachments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON conversation_transfers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON sla_tracking FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON communication_channels FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON message_templates FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON customer_channel_preferences FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON webhook_events FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON realtime_metrics FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON scheduled_reports FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON playground_sessions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON workflow_executions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON website_scan_jobs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON extracted_content FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON intent_patterns FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON conversation_context FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON audit_logs FOR ALL USING (auth.role() = 'authenticated');

-- System settings (admin only)
CREATE POLICY "Allow admin access to system settings" ON system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Final success message
SELECT 'ROMASHKA Master Schema completed successfully!' as status;