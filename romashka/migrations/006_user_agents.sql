-- Migration: 006_user_agents.sql
-- Creates the user_agents table to link users to their AI agents

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_agents_user_id ON user_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_agents_agent_id ON user_agents(agent_id);
CREATE INDEX IF NOT EXISTS idx_user_agents_agent_type ON user_agents(agent_type);
CREATE INDEX IF NOT EXISTS idx_user_agents_is_active ON user_agents(is_active);
CREATE INDEX IF NOT EXISTS idx_user_agents_user_id_is_active ON user_agents(user_id, is_active);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_agents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_user_agents_updated_at
    BEFORE UPDATE ON user_agents
    FOR EACH ROW
    EXECUTE FUNCTION update_user_agents_updated_at();

-- Add RLS (Row Level Security) policies
ALTER TABLE user_agents ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own agents
CREATE POLICY "Users can view their own agents" ON user_agents
    FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to insert their own agents
CREATE POLICY "Users can insert their own agents" ON user_agents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own agents
CREATE POLICY "Users can update their own agents" ON user_agents
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy for users to delete their own agents
CREATE POLICY "Users can delete their own agents" ON user_agents
    FOR DELETE USING (auth.uid() = user_id);

-- Function to ensure only one primary agent per user
CREATE OR REPLACE FUNCTION ensure_single_primary_agent()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = true THEN
        -- Set all other agents for this user to non-primary
        UPDATE user_agents 
        SET is_primary = false 
        WHERE user_id = NEW.user_id 
        AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to ensure only one primary agent per user
CREATE TRIGGER trigger_ensure_single_primary_agent
    BEFORE INSERT OR UPDATE ON user_agents
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_primary_agent();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_agents TO authenticated;

-- Migration complete
SELECT 'Migration 006: User Agents table created successfully' as status;