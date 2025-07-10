-- Migration 004: Analytics & Reporting Tables
-- Creates tables for metrics, analytics, and reporting functionality

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
  dimensions JSONB DEFAULT '{}',
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
  resolved_by VARCHAR(20),
  resolution_type VARCHAR(50),
  handoff_count INTEGER DEFAULT 0,
  agent_switches INTEGER DEFAULT 0,
  -- Quality metrics
  customer_satisfaction INTEGER,
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
  layout JSONB NOT NULL,
  filters JSONB DEFAULT '{}',
  refresh_interval INTEGER DEFAULT 300,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scheduled reports configuration
CREATE TABLE IF NOT EXISTS scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  report_type VARCHAR(50) NOT NULL,
  schedule_cron VARCHAR(100) NOT NULL,
  recipients TEXT[] NOT NULL,
  filters JSONB DEFAULT '{}',
  format VARCHAR(20) DEFAULT 'pdf',
  last_sent_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alert rules
CREATE TABLE IF NOT EXISTS alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  metric VARCHAR(100) NOT NULL,
  condition VARCHAR(20) NOT NULL,
  threshold DECIMAL(15,4) NOT NULL,
  time_window_minutes INTEGER DEFAULT 60,
  channels TEXT[] DEFAULT '{"email"}',
  recipients TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alert history
CREATE TABLE IF NOT EXISTS alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES alert_rules(id) ON DELETE CASCADE,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metric_value DECIMAL(15,4) NOT NULL,
  threshold_value DECIMAL(15,4) NOT NULL,
  sent_channels TEXT[],
  sent_recipients TEXT[],
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT
);

-- Export jobs
CREATE TABLE IF NOT EXISTS export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  filters JSONB DEFAULT '{}',
  format VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  file_url TEXT,
  file_size_bytes BIGINT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtime_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Allow authenticated access" ON daily_metrics
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON realtime_metrics
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON conversation_analytics
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON dashboard_configs
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON scheduled_reports
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON alert_rules
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON alert_history
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON export_jobs
  FOR ALL USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(date);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_agent_id ON daily_metrics(agent_id);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_channel_type ON daily_metrics(channel_type);
CREATE INDEX IF NOT EXISTS idx_realtime_metrics_expires_at ON realtime_metrics(expires_at);
CREATE INDEX IF NOT EXISTS idx_conversation_analytics_conversation_id ON conversation_analytics(conversation_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_configs_user_id ON dashboard_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_run_at ON scheduled_reports(next_run_at);
CREATE INDEX IF NOT EXISTS idx_alert_rules_is_active ON alert_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_alert_history_triggered_at ON alert_history(triggered_at);
CREATE INDEX IF NOT EXISTS idx_export_jobs_status ON export_jobs(status);

-- Triggers for updated_at
CREATE TRIGGER update_conversation_analytics_updated_at
  BEFORE UPDATE ON conversation_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_configs_updated_at
  BEFORE UPDATE ON dashboard_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_reports_updated_at
  BEFORE UPDATE ON scheduled_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alert_rules_updated_at
  BEFORE UPDATE ON alert_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create conversation analytics on new conversation
CREATE OR REPLACE FUNCTION create_conversation_analytics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO conversation_analytics (
    conversation_id,
    started_at,
    total_messages,
    customer_messages,
    ai_messages,
    agent_messages
  ) VALUES (
    NEW.id,
    NEW.created_at,
    0,
    0,
    0,
    0
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create analytics on new conversation
CREATE TRIGGER create_conversation_analytics_trigger
  AFTER INSERT ON conversations
  FOR EACH ROW EXECUTE FUNCTION create_conversation_analytics();

-- Function to update conversation analytics on message
CREATE OR REPLACE FUNCTION update_conversation_analytics_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversation_analytics 
  SET 
    total_messages = total_messages + 1,
    customer_messages = customer_messages + CASE WHEN NEW.sender_type = 'user' THEN 1 ELSE 0 END,
    ai_messages = ai_messages + CASE WHEN NEW.sender_type = 'ai' THEN 1 ELSE 0 END,
    agent_messages = agent_messages + CASE WHEN NEW.sender_type = 'agent' THEN 1 ELSE 0 END,
    first_response_at = CASE 
      WHEN first_response_at IS NULL AND NEW.sender_type IN ('ai', 'agent') THEN NEW.created_at
      ELSE first_response_at
    END,
    updated_at = NOW()
  WHERE conversation_id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update analytics on new message
CREATE TRIGGER update_conversation_analytics_on_message_trigger
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_analytics_on_message();

-- Function to update analytics on conversation resolution
CREATE OR REPLACE FUNCTION update_conversation_analytics_on_resolution()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if status changed to resolved
  IF OLD.status != 'resolved' AND NEW.status = 'resolved' THEN
    UPDATE conversation_analytics 
    SET 
      resolved_at = NEW.resolved_at,
      total_duration_seconds = EXTRACT(EPOCH FROM (NEW.resolved_at - started_at))::INTEGER,
      resolved_by = CASE 
        WHEN NEW.assigned_agent_id IS NOT NULL THEN 'agent'
        WHEN ai_messages > 0 THEN 'ai'
        ELSE 'abandoned'
      END,
      customer_satisfaction = NEW.satisfaction_score,
      updated_at = NOW()
    WHERE conversation_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update analytics on conversation resolution
CREATE TRIGGER update_conversation_analytics_on_resolution_trigger
  AFTER UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_conversation_analytics_on_resolution();

-- Function to cleanup expired realtime metrics
CREATE OR REPLACE FUNCTION cleanup_expired_realtime_metrics()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM realtime_metrics 
  WHERE expires_at < NOW();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to cleanup expired metrics periodically
CREATE TRIGGER cleanup_expired_realtime_metrics_trigger
  AFTER INSERT ON realtime_metrics
  FOR EACH STATEMENT EXECUTE FUNCTION cleanup_expired_realtime_metrics();

-- Function to aggregate daily metrics
CREATE OR REPLACE FUNCTION aggregate_daily_metrics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO daily_metrics (
    date,
    channel_type,
    department,
    agent_id,
    total_conversations,
    ai_resolved_conversations,
    human_resolved_conversations,
    abandoned_conversations,
    avg_first_response_time_seconds,
    avg_resolution_time_seconds,
    total_ratings,
    avg_satisfaction_score,
    ai_confidence_avg,
    handoff_rate
  )
  SELECT 
    target_date,
    c.channel_type,
    c.department,
    c.assigned_agent_id,
    COUNT(*) as total_conversations,
    COUNT(*) FILTER (WHERE ca.resolved_by = 'ai') as ai_resolved_conversations,
    COUNT(*) FILTER (WHERE ca.resolved_by = 'agent') as human_resolved_conversations,
    COUNT(*) FILTER (WHERE ca.resolved_by = 'abandoned') as abandoned_conversations,
    AVG(EXTRACT(EPOCH FROM (ca.first_response_at - ca.started_at)))::INTEGER as avg_first_response_time_seconds,
    AVG(ca.total_duration_seconds) as avg_resolution_time_seconds,
    COUNT(*) FILTER (WHERE c.satisfaction_score IS NOT NULL) as total_ratings,
    AVG(c.satisfaction_score) as avg_satisfaction_score,
    AVG(c.ai_confidence) as ai_confidence_avg,
    (COUNT(*) FILTER (WHERE ca.handoff_count > 0)::DECIMAL / COUNT(*)) as handoff_rate
  FROM conversations c
  LEFT JOIN conversation_analytics ca ON c.id = ca.conversation_id
  WHERE DATE(c.created_at) = target_date
  GROUP BY c.channel_type, c.department, c.assigned_agent_id
  ON CONFLICT (date, channel_type, department, agent_id) 
  DO UPDATE SET
    total_conversations = EXCLUDED.total_conversations,
    ai_resolved_conversations = EXCLUDED.ai_resolved_conversations,
    human_resolved_conversations = EXCLUDED.human_resolved_conversations,
    abandoned_conversations = EXCLUDED.abandoned_conversations,
    avg_first_response_time_seconds = EXCLUDED.avg_first_response_time_seconds,
    avg_resolution_time_seconds = EXCLUDED.avg_resolution_time_seconds,
    total_ratings = EXCLUDED.total_ratings,
    avg_satisfaction_score = EXCLUDED.avg_satisfaction_score,
    ai_confidence_avg = EXCLUDED.ai_confidence_avg,
    handoff_rate = EXCLUDED.handoff_rate;
END;
$$ LANGUAGE plpgsql;

-- Default dashboard configuration
INSERT INTO dashboard_configs (user_id, name, is_default, layout, filters) 
SELECT 
  id,
  'Default Dashboard',
  true,
  '{"widgets": [{"type": "conversations", "x": 0, "y": 0, "w": 6, "h": 4}, {"type": "response_time", "x": 6, "y": 0, "w": 6, "h": 4}, {"type": "satisfaction", "x": 0, "y": 4, "w": 6, "h": 4}, {"type": "ai_performance", "x": 6, "y": 4, "w": 6, "h": 4}]}',
  '{}'
FROM profiles 
WHERE NOT EXISTS (
  SELECT 1 FROM dashboard_configs 
  WHERE user_id = profiles.id 
  AND is_default = true
);

-- Default alert rules
INSERT INTO alert_rules (name, metric, condition, threshold, recipients, created_by) 
SELECT 
  'High Response Time',
  'avg_first_response_time_seconds',
  'above',
  600, -- 10 minutes
  ARRAY[profiles.email],
  profiles.id
FROM profiles 
WHERE role = 'admin'
AND NOT EXISTS (
  SELECT 1 FROM alert_rules 
  WHERE name = 'High Response Time' 
  AND created_by = profiles.id
);

-- Migration complete
SELECT 'Migration 004: Analytics & Reporting Tables Complete' as status;