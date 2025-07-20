-- ROMASHKA AI Agent Setup Tables
-- These tables support the complete agent setup workflow and monitoring

-- Table for human agents (Step 6: Add Human Agent Fallback)
CREATE TABLE IF NOT EXISTS human_agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    is_online BOOLEAN DEFAULT false,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT now(),
    assigned_conversations INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('available', 'busy', 'away', 'offline')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for escalation requests
CREATE TABLE IF NOT EXISTS escalation_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id VARCHAR(255) NOT NULL,
    customer_message TEXT NOT NULL,
    ai_response TEXT,
    escalation_reason VARCHAR(255) NOT NULL,
    assigned_agent_id UUID REFERENCES human_agents(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for conversation metrics (Step 8: Monitor Conversations)
CREATE TABLE IF NOT EXISTS conversation_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id VARCHAR(255) NOT NULL UNIQUE,
    ai_handled BOOLEAN DEFAULT false,
    escalated_to_human BOOLEAN DEFAULT false,
    customer_satisfaction INTEGER CHECK (customer_satisfaction >= 1 AND customer_satisfaction <= 5),
    response_time_ms INTEGER DEFAULT 0,
    message_count INTEGER DEFAULT 0,
    resolution_status VARCHAR(20) DEFAULT 'pending' CHECK (resolution_status IN ('resolved', 'pending', 'escalated', 'abandoned')),
    session_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
    session_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for escalation reasons tracking
CREATE TABLE IF NOT EXISTS escalation_reasons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id VARCHAR(255) NOT NULL,
    reason VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_id UUID REFERENCES human_agents(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Table for agent setup progress
CREATE TABLE IF NOT EXISTS agent_setup_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    current_step INTEGER DEFAULT 1,
    business_type VARCHAR(100),
    agent_name VARCHAR(255),
    agent_tone VARCHAR(50),
    website_url TEXT,
    knowledge_content TEXT,
    setup_completed BOOLEAN DEFAULT false,
    completed_steps JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(profile_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_human_agents_status ON human_agents(status);
CREATE INDEX IF NOT EXISTS idx_human_agents_online ON human_agents(is_online);
CREATE INDEX IF NOT EXISTS idx_escalation_requests_status ON escalation_requests(status);
CREATE INDEX IF NOT EXISTS idx_escalation_requests_agent ON escalation_requests(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_conversation_metrics_conversation ON conversation_metrics(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_metrics_session_start ON conversation_metrics(session_start);
CREATE INDEX IF NOT EXISTS idx_escalation_reasons_conversation ON escalation_reasons(conversation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_agent_setup_profile ON agent_setup_progress(profile_id);

-- Row Level Security (RLS) Policies
ALTER TABLE human_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_setup_progress ENABLE ROW LEVEL SECURITY;

-- Human agents policies
CREATE POLICY "Users can view human agents in their organization" ON human_agents
    FOR SELECT USING (
        profile_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM human_agents ha 
            WHERE ha.profile_id = auth.uid() 
            AND ha.status IN ('available', 'busy', 'away')
        )
    );

CREATE POLICY "Users can insert human agents" ON human_agents
    FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their own agent profile" ON human_agents
    FOR UPDATE USING (profile_id = auth.uid());

-- Escalation requests policies
CREATE POLICY "Agents can view escalations assigned to them or unassigned" ON escalation_requests
    FOR SELECT USING (
        assigned_agent_id IS NULL OR
        assigned_agent_id IN (
            SELECT id FROM human_agents WHERE profile_id = auth.uid()
        )
    );

CREATE POLICY "Users can create escalation requests" ON escalation_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Assigned agents can update escalations" ON escalation_requests
    FOR UPDATE USING (
        assigned_agent_id IN (
            SELECT id FROM human_agents WHERE profile_id = auth.uid()
        )
    );

-- Conversation metrics policies
CREATE POLICY "Users can view conversation metrics" ON conversation_metrics
    FOR SELECT USING (true);

CREATE POLICY "Users can insert conversation metrics" ON conversation_metrics
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update conversation metrics" ON conversation_metrics
    FOR UPDATE USING (true);

-- Escalation reasons policies
CREATE POLICY "Users can view escalation reasons" ON escalation_reasons
    FOR SELECT USING (true);

CREATE POLICY "Users can insert escalation reasons" ON escalation_reasons
    FOR INSERT WITH CHECK (true);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (
        recipient_id IN (
            SELECT id FROM human_agents WHERE profile_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (
        recipient_id IN (
            SELECT id FROM human_agents WHERE profile_id = auth.uid()
        )
    );

-- Agent setup progress policies
CREATE POLICY "Users can view their own setup progress" ON agent_setup_progress
    FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Users can insert their own setup progress" ON agent_setup_progress
    FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their own setup progress" ON agent_setup_progress
    FOR UPDATE USING (profile_id = auth.uid());

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_human_agents_updated_at ON human_agents;
CREATE TRIGGER update_human_agents_updated_at
    BEFORE UPDATE ON human_agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_escalation_requests_updated_at ON escalation_requests;
CREATE TRIGGER update_escalation_requests_updated_at
    BEFORE UPDATE ON escalation_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversation_metrics_updated_at ON conversation_metrics;
CREATE TRIGGER update_conversation_metrics_updated_at
    BEFORE UPDATE ON conversation_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_agent_setup_progress_updated_at ON agent_setup_progress;
CREATE TRIGGER update_agent_setup_progress_updated_at
    BEFORE UPDATE ON agent_setup_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing (optional)
-- INSERT INTO human_agents (profile_id, name, email, status) VALUES
-- (auth.uid(), 'John Doe', 'john@example.com', 'available'),
-- (auth.uid(), 'Jane Smith', 'jane@example.com', 'available');

COMMENT ON TABLE human_agents IS 'Stores human agents who can handle escalated conversations';
COMMENT ON TABLE escalation_requests IS 'Tracks when AI conversations are escalated to human agents';
COMMENT ON TABLE conversation_metrics IS 'Stores performance metrics for each conversation';
COMMENT ON TABLE escalation_reasons IS 'Tracks reasons why conversations were escalated';
COMMENT ON TABLE notifications IS 'Stores notifications for human agents';
COMMENT ON TABLE agent_setup_progress IS 'Tracks user progress through the agent setup wizard';