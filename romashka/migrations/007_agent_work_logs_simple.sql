-- Migration: 007_agent_work_logs_simple.sql
-- This table tracks the work performed by AI background agents
-- Simplified version that works with existing schema

-- Create agent_work_logs table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agent_work_logs_agent_id ON agent_work_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_work_logs_user_id ON agent_work_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_work_logs_status ON agent_work_logs(status);
CREATE INDEX IF NOT EXISTS idx_agent_work_logs_task_type ON agent_work_logs(task_type);
CREATE INDEX IF NOT EXISTS idx_agent_work_logs_created_at ON agent_work_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_work_logs_agent_id_created_at ON agent_work_logs(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_work_logs_user_id_agent_id ON agent_work_logs(user_id, agent_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_agent_work_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_agent_work_logs_updated_at
    BEFORE UPDATE ON agent_work_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_work_logs_updated_at();

-- Function to automatically calculate execution time
CREATE OR REPLACE FUNCTION calculate_execution_time()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' OR NEW.status = 'failed' THEN
        NEW.completed_at = NOW();
        IF NEW.started_at IS NOT NULL THEN
            NEW.execution_time_ms = EXTRACT(EPOCH FROM (NOW() - NEW.started_at)) * 1000;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to calculate execution time
CREATE TRIGGER trigger_calculate_execution_time
    BEFORE UPDATE ON agent_work_logs
    FOR EACH ROW
    EXECUTE FUNCTION calculate_execution_time();

-- Add RLS (Row Level Security) policies
ALTER TABLE agent_work_logs ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own agent work logs
CREATE POLICY "Users can view their own agent work logs" ON agent_work_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to insert their own agent work logs
CREATE POLICY "Users can insert their own agent work logs" ON agent_work_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own agent work logs
CREATE POLICY "Users can update their own agent work logs" ON agent_work_logs
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy for users to delete their own agent work logs
CREATE POLICY "Users can delete their own agent work logs" ON agent_work_logs
    FOR DELETE USING (auth.uid() = user_id);

-- Create a view for agent performance metrics
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

-- Create a view for daily agent performance
CREATE OR REPLACE VIEW daily_agent_performance AS
SELECT 
    user_id,
    agent_id,
    agent_name,
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_tasks,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_tasks,
    AVG(execution_time_ms) FILTER (WHERE status = 'completed') as avg_execution_time_ms,
    (COUNT(*) FILTER (WHERE status = 'completed')::float / NULLIF(COUNT(*), 0) * 100) as success_rate
FROM agent_work_logs
GROUP BY user_id, agent_id, agent_name, DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON agent_work_logs TO authenticated;
GRANT SELECT ON agent_performance_metrics TO authenticated;
GRANT SELECT ON daily_agent_performance TO authenticated;

-- Migration complete
SELECT 'Migration 007: Agent Work Logs table created successfully' as status;