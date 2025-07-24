-- Enhanced Workflow System Migration
-- This migration enhances the existing workflow system with comprehensive automation capabilities

-- Drop existing constraints and indexes to recreate them
ALTER TABLE IF EXISTS workflow_executions DROP CONSTRAINT IF EXISTS workflow_executions_workflow_id_fkey;
DROP INDEX IF EXISTS idx_workflow_executions_workflow_id;
DROP INDEX IF EXISTS idx_workflow_executions_status;
DROP INDEX IF EXISTS idx_workflow_executions_started_at;

-- Enhance existing workflows table
ALTER TABLE workflows 
ADD COLUMN IF NOT EXISTS trigger_type VARCHAR(50) DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS trigger_conditions JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_triggered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS webhook_url TEXT,
ADD COLUMN IF NOT EXISTS webhook_secret TEXT,
ADD COLUMN IF NOT EXISTS retry_config JSONB DEFAULT '{"max_attempts": 3, "delay_ms": 1000}',
ADD COLUMN IF NOT EXISTS timeout_ms INTEGER DEFAULT 30000,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'custom';

-- Update workflow_executions table structure
ALTER TABLE workflow_executions 
ADD COLUMN IF NOT EXISTS trigger_event JSONB,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS timeout_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS result JSONB,
ADD COLUMN IF NOT EXISTS variables JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS customer_id UUID,
ADD COLUMN IF NOT EXISTS conversation_id_ref UUID;

-- Create workflow triggers table
CREATE TABLE IF NOT EXISTS workflow_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    trigger_type VARCHAR(50) NOT NULL,
    conditions JSONB NOT NULL DEFAULT '[]',
    settings JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workflow actions table
CREATE TABLE IF NOT EXISTS workflow_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    node_id TEXT NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    conditions JSONB DEFAULT '[]',
    retry_config JSONB DEFAULT '{"max_attempts": 3, "delay_ms": 1000}',
    order_index INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workflow execution logs table for detailed tracking
CREATE TABLE IF NOT EXISTS workflow_execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID REFERENCES workflow_executions(id) ON DELETE CASCADE,
    node_id TEXT,
    action_id UUID REFERENCES workflow_actions(id) ON DELETE SET NULL,
    level VARCHAR(10) DEFAULT 'info', -- info, warning, error, debug
    message TEXT NOT NULL,
    data JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create escalations table for human handoff
CREATE TABLE IF NOT EXISTS escalations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_execution_id UUID REFERENCES workflow_executions(id) ON DELETE CASCADE,
    customer_id UUID,
    conversation_id UUID,
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    department VARCHAR(50) DEFAULT 'support',
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    title VARCHAR(255),
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, assigned, in_progress, resolved, closed
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create workflow templates table
CREATE TABLE IF NOT EXISTS workflow_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL DEFAULT 'custom',
    tags TEXT[] DEFAULT '{}',
    complexity_level VARCHAR(20) DEFAULT 'intermediate', -- beginner, intermediate, advanced
    trigger_type VARCHAR(50) NOT NULL,
    nodes JSONB NOT NULL DEFAULT '[]',
    connections JSONB NOT NULL DEFAULT '[]',
    default_config JSONB DEFAULT '{}',
    use_cases TEXT[] DEFAULT '{}',
    thumbnail_url TEXT,
    is_public BOOLEAN DEFAULT false,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workflow analytics table for performance tracking
CREATE TABLE IF NOT EXISTS workflow_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_executions INTEGER DEFAULT 0,
    successful_executions INTEGER DEFAULT 0,
    failed_executions INTEGER DEFAULT 0,
    average_duration_ms NUMERIC DEFAULT 0,
    total_duration_ms BIGINT DEFAULT 0,
    error_rate NUMERIC DEFAULT 0,
    most_common_errors JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workflow_id, date)
);

-- Create workflow schedules table for time-based triggers
CREATE TABLE IF NOT EXISTS workflow_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    schedule_type VARCHAR(20) NOT NULL, -- interval, daily, weekly, monthly, cron
    schedule_value INTEGER, -- for interval (minutes)
    cron_expression TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    next_run_at TIMESTAMP WITH TIME ZONE,
    last_run_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create integration events table for tracking external triggers
CREATE TABLE IF NOT EXISTS integration_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_type VARCHAR(50) NOT NULL, -- hubspot, salesforce, shopify
    event_type VARCHAR(100) NOT NULL,
    external_id TEXT,
    data JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    workflow_executions UUID[], -- array of execution IDs triggered by this event
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create webhook events table for external webhook triggers
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    headers JSONB DEFAULT '{}',
    body JSONB DEFAULT '{}',
    source_ip INET,
    user_agent TEXT,
    authenticated BOOLEAN DEFAULT false,
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    execution_id UUID REFERENCES workflow_executions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workflow conditions table for reusable conditions
CREATE TABLE IF NOT EXISTS workflow_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    field VARCHAR(255) NOT NULL,
    operator VARCHAR(50) NOT NULL,
    value JSONB NOT NULL,
    data_type VARCHAR(20) DEFAULT 'string',
    logical_operator VARCHAR(10) DEFAULT 'AND',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workflow variables table for dynamic data
CREATE TABLE IF NOT EXISTS workflow_variables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    execution_id UUID REFERENCES workflow_executions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    value JSONB NOT NULL,
    data_type VARCHAR(20) DEFAULT 'string',
    scope VARCHAR(20) DEFAULT 'execution', -- execution, workflow, global
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflows_trigger_type ON workflows(trigger_type);
CREATE INDEX IF NOT EXISTS idx_workflows_is_active ON workflows(is_active);
CREATE INDEX IF NOT EXISTS idx_workflows_category ON workflows(category);
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_started_at ON workflow_executions(started_at);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_customer_id ON workflow_executions(customer_id);

CREATE INDEX IF NOT EXISTS idx_workflow_triggers_workflow_id ON workflow_triggers(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_triggers_type ON workflow_triggers(trigger_type);
CREATE INDEX IF NOT EXISTS idx_workflow_triggers_active ON workflow_triggers(is_active);

CREATE INDEX IF NOT EXISTS idx_workflow_actions_workflow_id ON workflow_actions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_actions_type ON workflow_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_workflow_actions_node_id ON workflow_actions(node_id);

CREATE INDEX IF NOT EXISTS idx_workflow_execution_logs_execution_id ON workflow_execution_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_workflow_execution_logs_level ON workflow_execution_logs(level);
CREATE INDEX IF NOT EXISTS idx_workflow_execution_logs_timestamp ON workflow_execution_logs(timestamp);

CREATE INDEX IF NOT EXISTS idx_escalations_status ON escalations(status);
CREATE INDEX IF NOT EXISTS idx_escalations_priority ON escalations(priority);
CREATE INDEX IF NOT EXISTS idx_escalations_assigned_to ON escalations(assigned_to);
CREATE INDEX IF NOT EXISTS idx_escalations_created_at ON escalations(created_at);

CREATE INDEX IF NOT EXISTS idx_workflow_templates_category ON workflow_templates(category);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_public ON workflow_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_usage ON workflow_templates(usage_count);

CREATE INDEX IF NOT EXISTS idx_workflow_analytics_workflow_id ON workflow_analytics(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_analytics_date ON workflow_analytics(date);

CREATE INDEX IF NOT EXISTS idx_workflow_schedules_workflow_id ON workflow_schedules(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_schedules_next_run ON workflow_schedules(next_run_at);
CREATE INDEX IF NOT EXISTS idx_workflow_schedules_active ON workflow_schedules(is_active);

CREATE INDEX IF NOT EXISTS idx_integration_events_type ON integration_events(integration_type, event_type);
CREATE INDEX IF NOT EXISTS idx_integration_events_processed ON integration_events(processed);
CREATE INDEX IF NOT EXISTS idx_integration_events_created_at ON integration_events(created_at);

CREATE INDEX IF NOT EXISTS idx_webhook_events_workflow_id ON webhook_events(workflow_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);

CREATE INDEX IF NOT EXISTS idx_workflow_variables_workflow_id ON workflow_variables(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_variables_execution_id ON workflow_variables(execution_id);
CREATE INDEX IF NOT EXISTS idx_workflow_variables_name ON workflow_variables(name);

-- Add foreign key constraints
ALTER TABLE workflow_executions 
ADD CONSTRAINT workflow_executions_workflow_id_fkey 
FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE;

-- Create functions for workflow automation

-- Function to update workflow analytics
CREATE OR REPLACE FUNCTION update_workflow_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update daily analytics when execution completes
    IF NEW.status IN ('completed', 'failed') AND (OLD.status IS NULL OR OLD.status NOT IN ('completed', 'failed')) THEN
        INSERT INTO workflow_analytics (
            workflow_id, 
            date, 
            total_executions, 
            successful_executions, 
            failed_executions,
            total_duration_ms
        ) VALUES (
            NEW.workflow_id,
            CURRENT_DATE,
            1,
            CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
            CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
            EXTRACT(EPOCH FROM (COALESCE(NEW.completed_at, NOW()) - NEW.started_at)) * 1000
        )
        ON CONFLICT (workflow_id, date) DO UPDATE SET
            total_executions = workflow_analytics.total_executions + 1,
            successful_executions = workflow_analytics.successful_executions + 
                CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
            failed_executions = workflow_analytics.failed_executions + 
                CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
            total_duration_ms = workflow_analytics.total_duration_ms + 
                EXTRACT(EPOCH FROM (COALESCE(NEW.completed_at, NOW()) - NEW.started_at)) * 1000,
            average_duration_ms = (workflow_analytics.total_duration_ms + 
                EXTRACT(EPOCH FROM (COALESCE(NEW.completed_at, NOW()) - NEW.started_at)) * 1000) / 
                (workflow_analytics.total_executions + 1),
            error_rate = (workflow_analytics.failed_executions + 
                CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END)::NUMERIC / 
                (workflow_analytics.total_executions + 1) * 100,
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update workflow execution counts
CREATE OR REPLACE FUNCTION update_workflow_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        UPDATE workflows 
        SET success_count = success_count + 1,
            execution_count = execution_count + 1,
            updated_at = NOW()
        WHERE id = NEW.workflow_id;
    ELSIF NEW.status = 'failed' AND (OLD.status IS NULL OR OLD.status != 'failed') THEN
        UPDATE workflows 
        SET failure_count = failure_count + 1,
            execution_count = execution_count + 1,
            updated_at = NOW()
        WHERE id = NEW.workflow_id;
    ELSIF NEW.status IN ('completed', 'failed') AND OLD.status NOT IN ('completed', 'failed') THEN
        UPDATE workflows 
        SET execution_count = execution_count + 1,
            updated_at = NOW()
        WHERE id = NEW.workflow_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate webhook URLs
CREATE OR REPLACE FUNCTION generate_webhook_url()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.trigger_type = 'webhook' AND (NEW.webhook_url IS NULL OR NEW.webhook_url = '') THEN
        NEW.webhook_url = 'https://api.romashka.com/webhooks/workflows/' || NEW.id::text;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to schedule next workflow run
CREATE OR REPLACE FUNCTION schedule_next_run()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.schedule_type = 'interval' AND NEW.schedule_value IS NOT NULL THEN
        NEW.next_run_at = NOW() + (NEW.schedule_value || ' minutes')::INTERVAL;
    ELSIF NEW.schedule_type = 'daily' AND NEW.schedule_value IS NOT NULL THEN
        NEW.next_run_at = (CURRENT_DATE + 1)::TIMESTAMP + (NEW.schedule_value || ' minutes')::INTERVAL;
    ELSIF NEW.schedule_type = 'weekly' THEN
        NEW.next_run_at = (CURRENT_DATE + 7)::TIMESTAMP;
    ELSIF NEW.schedule_type = 'monthly' THEN
        NEW.next_run_at = (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')::TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_workflow_analytics ON workflow_executions;
CREATE TRIGGER trigger_update_workflow_analytics
    AFTER UPDATE ON workflow_executions
    FOR EACH ROW
    EXECUTE FUNCTION update_workflow_analytics();

DROP TRIGGER IF EXISTS trigger_update_workflow_counts ON workflow_executions;
CREATE TRIGGER trigger_update_workflow_counts
    AFTER UPDATE ON workflow_executions
    FOR EACH ROW
    EXECUTE FUNCTION update_workflow_counts();

DROP TRIGGER IF EXISTS trigger_generate_webhook_url ON workflows;
CREATE TRIGGER trigger_generate_webhook_url
    BEFORE INSERT OR UPDATE ON workflows
    FOR EACH ROW
    EXECUTE FUNCTION generate_webhook_url();

DROP TRIGGER IF EXISTS trigger_schedule_next_run ON workflow_schedules;
CREATE TRIGGER trigger_schedule_next_run
    BEFORE INSERT OR UPDATE ON workflow_schedules
    FOR EACH ROW
    EXECUTE FUNCTION schedule_next_run();

-- Insert default workflow templates
INSERT INTO workflow_templates (
    id,
    name,
    description,
    category,
    tags,
    complexity_level,
    trigger_type,
    nodes,
    connections,
    default_config,
    use_cases,
    is_public
) VALUES 
(
    gen_random_uuid(),
    'Customer Complaint Escalation',
    'Automatically escalate customer complaints based on sentiment analysis and customer tier',
    'customer_service',
    ARRAY['escalation', 'sentiment', 'complaints', 'support'],
    'intermediate',
    'chat_message',
    '[]'::jsonb,
    '[]'::jsonb,
    '{"sentiment_threshold": -0.7, "keywords": ["refund", "cancel", "terrible", "awful", "worst", "hate"], "premium_tier_only": true}'::jsonb,
    ARRAY['Automatically detect negative customer sentiment', 'Escalate premium customer complaints immediately', 'Notify managers of critical issues', 'Send apology emails to affected customers'],
    true
),
(
    gen_random_uuid(),
    'Order Delay Notification',
    'Automatically notify customers about order delays and offer compensation',
    'customer_service',
    ARRAY['orders', 'notifications', 'delays', 'compensation'],
    'beginner',
    'integration_change',
    '[]'::jsonb,
    '[]'::jsonb,
    '{"min_order_value": 500, "compensation_percentage": 10, "notification_channels": ["email", "sms", "chat"]}'::jsonb,
    ARRAY['Proactively notify customers of order delays', 'Offer automatic compensation for high-value orders', 'Update CRM with customer interactions', 'Schedule follow-up reminders'],
    true
),
(
    gen_random_uuid(),
    'Sales Opportunity Follow-up',
    'Automatically follow up on sales opportunities based on deal stage and value',
    'sales_automation',
    ARRAY['sales', 'follow-up', 'opportunities', 'automation'],
    'advanced',
    'integration_change',
    '[]'::jsonb,
    '[]'::jsonb,
    '{"follow_up_delay_days": 3, "min_deal_value": 10000, "email_sequence_count": 3, "manager_notification_threshold": 50000}'::jsonb,
    ARRAY['Automatic follow-up on high-value deals', 'Create tasks in Salesforce for sales reps', 'Send personalized email sequences', 'Notify managers of large opportunities'],
    true
);

-- Create RLS policies for workflow security
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_analytics ENABLE ROW LEVEL SECURITY;

-- Workflows policies
CREATE POLICY "Users can view their own workflows" ON workflows
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create workflows" ON workflows
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own workflows" ON workflows
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own workflows" ON workflows
    FOR DELETE USING (user_id = auth.uid());

-- Workflow executions policies
CREATE POLICY "Users can view executions of their workflows" ON workflow_executions
    FOR SELECT USING (
        workflow_id IN (SELECT id FROM workflows WHERE user_id = auth.uid())
    );

-- Workflow templates policies
CREATE POLICY "Everyone can view public templates" ON workflow_templates
    FOR SELECT USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create templates" ON workflow_templates
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own templates" ON workflow_templates
    FOR UPDATE USING (created_by = auth.uid());

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create view for workflow dashboard
CREATE OR REPLACE VIEW workflow_dashboard AS
SELECT 
    w.id,
    w.name,
    w.description,
    w.trigger_type,
    w.is_active,
    w.execution_count,
    w.success_count,
    w.failure_count,
    CASE 
        WHEN w.execution_count > 0 THEN (w.success_count::NUMERIC / w.execution_count * 100)
        ELSE 0 
    END as success_rate,
    w.created_at,
    w.updated_at,
    COALESCE(recent_analytics.avg_duration, 0) as avg_execution_time,
    COALESCE(recent_executions.last_execution, w.created_at) as last_execution
FROM workflows w
LEFT JOIN (
    SELECT 
        workflow_id,
        AVG(average_duration_ms) as avg_duration
    FROM workflow_analytics 
    WHERE date >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY workflow_id
) recent_analytics ON w.id = recent_analytics.workflow_id
LEFT JOIN (
    SELECT 
        workflow_id,
        MAX(started_at) as last_execution
    FROM workflow_executions
    GROUP BY workflow_id
) recent_executions ON w.id = recent_executions.workflow_id;

-- Grant access to the view
GRANT SELECT ON workflow_dashboard TO authenticated;

COMMENT ON TABLE workflows IS 'Enhanced workflows table with comprehensive automation capabilities';
COMMENT ON TABLE workflow_executions IS 'Enhanced workflow execution tracking with detailed logging';
COMMENT ON TABLE workflow_triggers IS 'Workflow trigger configurations for event-driven automation';
COMMENT ON TABLE workflow_actions IS 'Individual workflow actions with retry and error handling';
COMMENT ON TABLE escalations IS 'Human escalation tracking for workflow failures or customer issues';
COMMENT ON TABLE workflow_templates IS 'Pre-built workflow templates for common use cases';
COMMENT ON TABLE workflow_analytics IS 'Daily analytics for workflow performance monitoring';

SELECT 'Enhanced Workflow System Migration Complete' as status;