-- ROMASHKA Complete Database Setup Script
-- This script runs all migrations in the correct order
-- Execute this in Supabase SQL editor

-- ================================
-- STEP 1: Extensions and Functions
-- ================================

-- Create required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Utility function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- STEP 2: Core Profile Tables
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

-- Customer profiles
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
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- STEP 3: User Agents Table
-- ================================

-- User agents table - links users to their AI agents
CREATE TABLE IF NOT EXISTS user_agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    agent_id VARCHAR(255) NOT NULL UNIQUE,
    agent_name VARCHAR(255) NOT NULL,
    agent_type VARCHAR(50) NOT NULL DEFAULT 'ai_assistant' CHECK (agent_type IN ('ai_assistant', 'chatbot', 'workflow_bot', 'analytics_bot', 'knowledge_bot')),
    agent_description TEXT,
    agent_config JSONB DEFAULT '{}',
    capabilities JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- STEP 4: Communication & Conversation Tables
-- ================================

-- Communication channels
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

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE,
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    assigned_agent_id UUID REFERENCES profiles(id),
    status VARCHAR(50) DEFAULT 'active',
    priority VARCHAR(20) DEFAULT 'normal',
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
    language VARCHAR(10) DEFAULT 'en',
    sentiment VARCHAR(20),
    intent VARCHAR(100),
    ai_confidence DECIMAL(3,2),
    business_context JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    last_message TEXT,
    message_count INTEGER DEFAULT 0,
    workflow_id UUID
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL,
    sender_id UUID REFERENCES profiles(id),
    content TEXT NOT NULL,
    channel_type VARCHAR(50) DEFAULT 'website',
    external_message_id VARCHAR(255),
    message_type VARCHAR(50) DEFAULT 'text',
    media_url TEXT,
    media_caption TEXT,
    delivery_status VARCHAR(50) DEFAULT 'sent',
    metadata JSONB DEFAULT '{}',
    confidence_score DECIMAL(3,2),
    processing_time_ms INTEGER,
    intent_detected VARCHAR(100),
    knowledge_sources JSONB DEFAULT '{}',
    tokens_used INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- STEP 5: Agent Work Logs Table
-- ================================

-- Agent work logs table
CREATE TABLE IF NOT EXISTS agent_work_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id VARCHAR(255) NOT NULL,
    agent_name VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    task_type VARCHAR(50) NOT NULL CHECK (task_type IN ('conversation', 'knowledge_processing', 'workflow_execution', 'content_analysis', 'automation')),
    task_description TEXT NOT NULL,
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    execution_time_ms INTEGER,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- STEP 6: Knowledge Management Tables
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

-- ================================
-- STEP 7: Additional Tables
-- ================================

-- Agent availability
CREATE TABLE IF NOT EXISTS agent_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    is_online BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'available',
    max_concurrent_chats INTEGER DEFAULT 5,
    current_chat_count INTEGER DEFAULT 0,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    auto_away_time INTEGER DEFAULT 300,
    working_hours JSONB DEFAULT '{"monday": {"start": "09:00", "end": "17:00"}, "tuesday": {"start": "09:00", "end": "17:00"}, "wednesday": {"start": "09:00", "end": "17:00"}, "thursday": {"start": "09:00", "end": "17:00"}, "friday": {"start": "09:00", "end": "17:00"}}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Canned responses
CREATE TABLE IF NOT EXISTS canned_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    shortcut VARCHAR(50),
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
-- STEP 8: Create Performance Indexes
-- ================================

-- User agents indexes
CREATE INDEX IF NOT EXISTS idx_user_agents_user_id ON user_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_agents_agent_id ON user_agents(agent_id);
CREATE INDEX IF NOT EXISTS idx_user_agents_agent_type ON user_agents(agent_type);
CREATE INDEX IF NOT EXISTS idx_user_agents_is_active ON user_agents(is_active);

-- Agent work logs indexes
CREATE INDEX IF NOT EXISTS idx_agent_work_logs_agent_id ON agent_work_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_work_logs_user_id ON agent_work_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_work_logs_status ON agent_work_logs(status);
CREATE INDEX IF NOT EXISTS idx_agent_work_logs_task_type ON agent_work_logs(task_type);
CREATE INDEX IF NOT EXISTS idx_agent_work_logs_created_at ON agent_work_logs(created_at DESC);

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agent_id ON conversations(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_type ON messages(sender_type);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Customer profiles indexes
CREATE INDEX IF NOT EXISTS idx_customer_profiles_email ON customer_profiles(email);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_phone ON customer_profiles(phone);

-- ================================
-- STEP 9: Create Triggers
-- ================================

-- User agents triggers
CREATE TRIGGER trigger_update_user_agents_updated_at
    BEFORE UPDATE ON user_agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Agent work logs triggers
CREATE TRIGGER trigger_update_agent_work_logs_updated_at
    BEFORE UPDATE ON agent_work_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Profiles triggers
CREATE TRIGGER trigger_update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Customer profiles triggers
CREATE TRIGGER trigger_update_customer_profiles_updated_at
    BEFORE UPDATE ON customer_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Conversations triggers
CREATE TRIGGER trigger_update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Messages triggers
CREATE TRIGGER trigger_update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- STEP 10: Enable RLS and Create Policies
-- ================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_items ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- User agents policies
CREATE POLICY "Users can view their own agents" ON user_agents
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own agents" ON user_agents
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own agents" ON user_agents
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own agents" ON user_agents
    FOR DELETE USING (auth.uid() = user_id);

-- Agent work logs policies
CREATE POLICY "Users can view their own agent work logs" ON agent_work_logs
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own agent work logs" ON agent_work_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own agent work logs" ON agent_work_logs
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own agent work logs" ON agent_work_logs
    FOR DELETE USING (auth.uid() = user_id);

-- Allow authenticated users to access other tables
CREATE POLICY "Allow authenticated access" ON customer_profiles
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON conversations
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON messages
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON knowledge_categories
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON knowledge_items
    FOR ALL USING (auth.role() = 'authenticated');

-- ================================
-- STEP 11: Create Views
-- ================================

-- Agent performance metrics view
CREATE OR REPLACE VIEW agent_performance_metrics AS
SELECT 
    user_id,
    agent_id,
    agent_name,
    COUNT(*) as total_tasks,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_tasks,
    COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_tasks,
    AVG(execution_time_ms) FILTER (WHERE status = 'completed') as avg_execution_time_ms,
    MIN(execution_time_ms) FILTER (WHERE status = 'completed') as min_execution_time_ms,
    MAX(execution_time_ms) FILTER (WHERE status = 'completed') as max_execution_time_ms,
    (COUNT(*) FILTER (WHERE status = 'completed')::float / NULLIF(COUNT(*), 0) * 100) as success_rate,
    (COUNT(*) FILTER (WHERE status = 'failed')::float / NULLIF(COUNT(*), 0) * 100) as failure_rate,
    MAX(updated_at) as last_activity,
    COUNT(DISTINCT task_type) as task_types_handled,
    DATE_TRUNC('day', MAX(created_at)) as last_task_date
FROM agent_work_logs
GROUP BY user_id, agent_id, agent_name;

-- Grant permissions
GRANT SELECT ON agent_performance_metrics TO authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON customer_profiles TO authenticated;
GRANT ALL ON user_agents TO authenticated;
GRANT ALL ON agent_work_logs TO authenticated;
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON knowledge_categories TO authenticated;
GRANT ALL ON knowledge_items TO authenticated;

-- ================================
-- STEP 12: Complete
-- ================================

SELECT 'Database setup completed successfully! All tables, indexes, triggers, and policies have been created.' as status;