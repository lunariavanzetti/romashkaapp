-- Advanced Analytics & Reporting System Database Schema (Fixed Version)
-- Run this in your Supabase SQL Editor

-- Create analytics aggregation tables
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
  
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(date, channel_type, department, agent_id)
);

-- Create real-time metrics cache
CREATE TABLE IF NOT EXISTS realtime_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(15,4) NOT NULL,
  dimensions JSONB, -- For filtering/grouping
  timestamp TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '1 hour'
);

-- Create conversation analytics
CREATE TABLE IF NOT EXISTS conversation_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) UNIQUE,
  
  -- Timing metrics
  started_at TIMESTAMP NOT NULL,
  first_response_at TIMESTAMP,
  resolved_at TIMESTAMP,
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
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create custom dashboard configurations
CREATE TABLE IF NOT EXISTS dashboard_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  name VARCHAR(255) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  layout JSONB NOT NULL, -- Widget positions and configurations
  filters JSONB, -- Default filters
  refresh_interval INTEGER DEFAULT 300, -- seconds
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create scheduled reports
CREATE TABLE IF NOT EXISTS scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  report_type VARCHAR(50) NOT NULL, -- 'performance', 'satisfaction', 'ai_analytics', 'custom'
  schedule_cron VARCHAR(100) NOT NULL, -- Cron expression
  recipients TEXT[] NOT NULL, -- Email addresses
  filters JSONB,
  format VARCHAR(20) DEFAULT 'pdf', -- 'pdf', 'excel', 'csv'
  last_sent_at TIMESTAMP,
  next_run_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create alert rules
CREATE TABLE IF NOT EXISTS alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  metric VARCHAR(100) NOT NULL,
  condition VARCHAR(20) NOT NULL, -- 'above', 'below', 'equals'
  threshold DECIMAL(15,4) NOT NULL,
  time_window_minutes INTEGER DEFAULT 60,
  channels TEXT[] DEFAULT '{"email"}', -- 'email', 'slack', 'webhook'
  recipients TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create alert history
CREATE TABLE IF NOT EXISTS alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES alert_rules(id),
  triggered_at TIMESTAMP DEFAULT NOW(),
  metric_value DECIMAL(15,4) NOT NULL,
  threshold_value DECIMAL(15,4) NOT NULL,
  sent_channels TEXT[],
  sent_recipients TEXT[]
);

-- Create export jobs
CREATE TABLE IF NOT EXISTS export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'conversations', 'analytics', 'customers'
  filters JSONB,
  format VARCHAR(20) NOT NULL, -- 'pdf', 'excel', 'csv', 'json'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  file_url TEXT,
  file_size_bytes BIGINT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtime_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies for daily_metrics
CREATE POLICY "Allow authenticated users to view metrics" ON daily_metrics
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow system to insert metrics" ON daily_metrics
  FOR INSERT WITH CHECK (true);

-- Create policies for realtime_metrics
CREATE POLICY "Allow authenticated users to view realtime metrics" ON realtime_metrics
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow system to manage realtime metrics" ON realtime_metrics
  FOR ALL USING (true);

-- Create policies for conversation_analytics
CREATE POLICY "Allow authenticated users to view conversation analytics" ON conversation_analytics
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow system to manage conversation analytics" ON conversation_analytics
  FOR ALL USING (true);

-- Create policies for dashboard_configs
CREATE POLICY "Allow users to manage their own dashboards" ON dashboard_configs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Allow users to view public dashboards" ON dashboard_configs
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

-- Create policies for scheduled_reports
CREATE POLICY "Allow users to manage their own reports" ON scheduled_reports
  FOR ALL USING (auth.uid() = created_by);

-- Create policies for alert_rules
CREATE POLICY "Allow users to manage their own alerts" ON alert_rules
  FOR ALL USING (auth.uid() = created_by);

-- Create policies for alert_history
CREATE POLICY "Allow users to view their alert history" ON alert_history
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create policies for export_jobs
CREATE POLICY "Allow users to manage their own exports" ON export_jobs
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(date);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_channel ON daily_metrics(channel_type);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_agent ON daily_metrics(agent_id);
CREATE INDEX IF NOT EXISTS idx_realtime_metrics_name ON realtime_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_realtime_metrics_timestamp ON realtime_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_realtime_metrics_expires ON realtime_metrics(expires_at);
CREATE INDEX IF NOT EXISTS idx_conversation_analytics_conversation ON conversation_analytics(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_analytics_resolved_by ON conversation_analytics(resolved_by);
CREATE INDEX IF NOT EXISTS idx_conversation_analytics_satisfaction ON conversation_analytics(customer_satisfaction);
CREATE INDEX IF NOT EXISTS idx_dashboard_configs_user ON dashboard_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_created_by ON scheduled_reports(created_by);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_run ON scheduled_reports(next_run_at);
CREATE INDEX IF NOT EXISTS idx_alert_rules_created_by ON alert_rules(created_by);
CREATE INDEX IF NOT EXISTS idx_alert_rules_active ON alert_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_export_jobs_user ON export_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_export_jobs_status ON export_jobs(status);

-- Insert sample data for testing (only if profiles table has data)
DO $$
BEGIN
  -- Only insert sample data if there are users in the profiles table
  IF EXISTS (SELECT 1 FROM profiles LIMIT 1) THEN
    -- Insert sample daily metrics
    INSERT INTO daily_metrics (date, channel_type, department, total_conversations, ai_resolved_conversations, human_resolved_conversations, avg_satisfaction_score, ai_confidence_avg, ai_accuracy_rate) VALUES
    (CURRENT_DATE - INTERVAL '7 days', 'website', 'support', 45, 32, 10, 4.2, 0.85, 0.78),
    (CURRENT_DATE - INTERVAL '6 days', 'website', 'support', 52, 38, 11, 4.4, 0.87, 0.81),
    (CURRENT_DATE - INTERVAL '5 days', 'whatsapp', 'sales', 28, 15, 12, 4.6, 0.82, 0.75),
    (CURRENT_DATE - INTERVAL '4 days', 'email', 'billing', 33, 8, 22, 3.8, 0.79, 0.72),
    (CURRENT_DATE - INTERVAL '3 days', 'website', 'support', 48, 35, 10, 4.3, 0.86, 0.80),
    (CURRENT_DATE - INTERVAL '2 days', 'whatsapp', 'sales', 31, 18, 11, 4.5, 0.84, 0.77),
    (CURRENT_DATE - INTERVAL '1 day', 'website', 'support', 55, 40, 12, 4.1, 0.88, 0.83),
    (CURRENT_DATE, 'website', 'support', 12, 8, 3, 4.3, 0.85, 0.79)
    ON CONFLICT DO NOTHING;

    -- Insert sample real-time metrics
    INSERT INTO realtime_metrics (metric_name, metric_value, dimensions) VALUES
    ('active_conversations', 23, '{"channel": "all"}'),
    ('avg_response_time', 45.2, '{"channel": "all"}'),
    ('satisfaction_score', 4.3, '{"channel": "all"}'),
    ('ai_resolution_rate', 0.78, '{"channel": "all"}'),
    ('agent_productivity', 0.85, '{"channel": "all"}')
    ON CONFLICT DO NOTHING;
  END IF;
END $$; 