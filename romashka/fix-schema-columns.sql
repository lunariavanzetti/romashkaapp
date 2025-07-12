-- Fix Schema Columns Script
-- This script adds any missing columns to existing tables

-- ================================
-- Fix knowledge_categories table
-- ================================

-- Add missing columns to knowledge_categories if they don't exist
ALTER TABLE knowledge_categories ADD COLUMN IF NOT EXISTS icon VARCHAR(100);
ALTER TABLE knowledge_categories ADD COLUMN IF NOT EXISTS color VARCHAR(20);
ALTER TABLE knowledge_categories ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES knowledge_categories(id);
ALTER TABLE knowledge_categories ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE knowledge_categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE knowledge_categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE knowledge_categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ================================
-- Fix knowledge_items table
-- ================================

-- Add missing columns to knowledge_items if they don't exist
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS source_type VARCHAR(50) DEFAULT 'manual';
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2) DEFAULT 0.8;
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS effectiveness_score DECIMAL(3,2) DEFAULT 0.5;
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES profiles(id);
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ================================
-- Fix user_agents table
-- ================================

-- Add missing columns to user_agents if they don't exist
ALTER TABLE user_agents ADD COLUMN IF NOT EXISTS agent_type VARCHAR(50) DEFAULT 'ai_assistant';
ALTER TABLE user_agents ADD COLUMN IF NOT EXISTS agent_description TEXT;
ALTER TABLE user_agents ADD COLUMN IF NOT EXISTS agent_config JSONB DEFAULT '{}';
ALTER TABLE user_agents ADD COLUMN IF NOT EXISTS capabilities JSONB DEFAULT '{}';
ALTER TABLE user_agents ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE user_agents ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;
ALTER TABLE user_agents ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE user_agents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add constraint for agent_type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'user_agents_agent_type_check'
    ) THEN
        ALTER TABLE user_agents ADD CONSTRAINT user_agents_agent_type_check 
        CHECK (agent_type IN ('ai_assistant', 'chatbot', 'workflow_bot', 'analytics_bot', 'knowledge_bot'));
    END IF;
END $$;

-- ================================
-- Fix agent_work_logs table
-- ================================

-- Add missing columns to agent_work_logs if they don't exist
ALTER TABLE agent_work_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE agent_work_logs ADD COLUMN IF NOT EXISTS task_type VARCHAR(50) DEFAULT 'conversation';
ALTER TABLE agent_work_logs ADD COLUMN IF NOT EXISTS task_description TEXT;
ALTER TABLE agent_work_logs ADD COLUMN IF NOT EXISTS input_data JSONB DEFAULT '{}';
ALTER TABLE agent_work_logs ADD COLUMN IF NOT EXISTS output_data JSONB DEFAULT '{}';
ALTER TABLE agent_work_logs ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE agent_work_logs ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE agent_work_logs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE agent_work_logs ADD COLUMN IF NOT EXISTS execution_time_ms INTEGER;
ALTER TABLE agent_work_logs ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE agent_work_logs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE agent_work_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE agent_work_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add constraints for agent_work_logs if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'agent_work_logs_task_type_check'
    ) THEN
        ALTER TABLE agent_work_logs ADD CONSTRAINT agent_work_logs_task_type_check 
        CHECK (task_type IN ('conversation', 'knowledge_processing', 'workflow_execution', 'content_analysis', 'automation'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'agent_work_logs_status_check'
    ) THEN
        ALTER TABLE agent_work_logs ADD CONSTRAINT agent_work_logs_status_check 
        CHECK (status IN ('pending', 'in_progress', 'completed', 'failed'));
    END IF;
END $$;

-- ================================
-- Fix customer_profiles table
-- ================================

-- Add missing columns to customer_profiles if they don't exist
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS company VARCHAR(255);
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}';
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS total_conversations INTEGER DEFAULT 0;
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS avg_satisfaction DECIMAL(3,2) DEFAULT 0;
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS last_interaction TIMESTAMP WITH TIME ZONE;
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ================================
-- Fix conversations table
-- ================================

-- Add missing columns to conversations if they don't exist
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user_name VARCHAR(255);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS assigned_agent_id UUID REFERENCES profiles(id);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS channel_type VARCHAR(50) DEFAULT 'website';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES communication_channels(id);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS external_conversation_id VARCHAR(255);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS customer_social_id VARCHAR(255);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS satisfaction_score DECIMAL(3,2);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS resolution_time_seconds INTEGER;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS handoff_reason TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS department VARCHAR(100) DEFAULT 'general';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS sentiment VARCHAR(20);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS intent VARCHAR(100);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(3,2);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS business_context JSONB DEFAULT '{}';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS workflow_id UUID;

-- ================================
-- Fix messages table
-- ================================

-- Add missing columns to messages if they don't exist
ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_type VARCHAR(20) NOT NULL DEFAULT 'user';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES profiles(id);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS channel_type VARCHAR(50) DEFAULT 'website';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS external_message_id VARCHAR(255);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(50) DEFAULT 'text';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_caption TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(50) DEFAULT 'sent';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS intent_detected VARCHAR(100);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS knowledge_sources JSONB DEFAULT '{}';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS tokens_used INTEGER;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ================================
-- Create missing indexes
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

-- Knowledge categories indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_categories_parent_id ON knowledge_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_categories_is_active ON knowledge_categories(is_active);

-- Knowledge items indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_items_category_id ON knowledge_items(category_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_status ON knowledge_items(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_language ON knowledge_items(language);

-- ================================
-- Create missing triggers
-- ================================

-- Update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- User agents trigger
DROP TRIGGER IF EXISTS trigger_update_user_agents_updated_at ON user_agents;
CREATE TRIGGER trigger_update_user_agents_updated_at
    BEFORE UPDATE ON user_agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Agent work logs trigger
DROP TRIGGER IF EXISTS trigger_update_agent_work_logs_updated_at ON agent_work_logs;
CREATE TRIGGER trigger_update_agent_work_logs_updated_at
    BEFORE UPDATE ON agent_work_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Knowledge categories trigger
DROP TRIGGER IF EXISTS trigger_update_knowledge_categories_updated_at ON knowledge_categories;
CREATE TRIGGER trigger_update_knowledge_categories_updated_at
    BEFORE UPDATE ON knowledge_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Knowledge items trigger
DROP TRIGGER IF EXISTS trigger_update_knowledge_items_updated_at ON knowledge_items;
CREATE TRIGGER trigger_update_knowledge_items_updated_at
    BEFORE UPDATE ON knowledge_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Customer profiles trigger
DROP TRIGGER IF EXISTS trigger_update_customer_profiles_updated_at ON customer_profiles;
CREATE TRIGGER trigger_update_customer_profiles_updated_at
    BEFORE UPDATE ON customer_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Conversations trigger
DROP TRIGGER IF EXISTS trigger_update_conversations_updated_at ON conversations;
CREATE TRIGGER trigger_update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Messages trigger
DROP TRIGGER IF EXISTS trigger_update_messages_updated_at ON messages;
CREATE TRIGGER trigger_update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- Enable RLS on tables
-- ================================

-- Enable Row Level Security
ALTER TABLE knowledge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create basic policies (allow authenticated users)
DROP POLICY IF EXISTS "Allow authenticated access" ON knowledge_categories;
CREATE POLICY "Allow authenticated access" ON knowledge_categories
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated access" ON knowledge_items;
CREATE POLICY "Allow authenticated access" ON knowledge_items
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated access" ON customer_profiles;
CREATE POLICY "Allow authenticated access" ON customer_profiles
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated access" ON conversations;
CREATE POLICY "Allow authenticated access" ON conversations
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated access" ON messages;
CREATE POLICY "Allow authenticated access" ON messages
    FOR ALL USING (auth.role() = 'authenticated');

-- User-specific policies for user_agents and agent_work_logs
DROP POLICY IF EXISTS "Users can view their own agents" ON user_agents;
CREATE POLICY "Users can view their own agents" ON user_agents
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own agents" ON user_agents;
CREATE POLICY "Users can insert their own agents" ON user_agents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own agents" ON user_agents;
CREATE POLICY "Users can update their own agents" ON user_agents
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own agents" ON user_agents;
CREATE POLICY "Users can delete their own agents" ON user_agents
    FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own agent work logs" ON agent_work_logs;
CREATE POLICY "Users can view their own agent work logs" ON agent_work_logs
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own agent work logs" ON agent_work_logs;
CREATE POLICY "Users can insert their own agent work logs" ON agent_work_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own agent work logs" ON agent_work_logs;
CREATE POLICY "Users can update their own agent work logs" ON agent_work_logs
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own agent work logs" ON agent_work_logs;
CREATE POLICY "Users can delete their own agent work logs" ON agent_work_logs
    FOR DELETE USING (auth.uid() = user_id);

-- ================================
-- Create agent performance metrics view
-- ================================

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

SELECT '✅ Schema columns fixed successfully!' as status;