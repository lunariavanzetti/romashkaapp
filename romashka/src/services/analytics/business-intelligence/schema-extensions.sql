-- Advanced Analytics & Business Intelligence Schema Extensions
-- ROMASHKA - Customer Satisfaction & ROI Analytics
-- Version: 1.0.0

-- ================================
-- CUSTOMER SATISFACTION TRACKING
-- ================================

-- Enhanced customer satisfaction surveys
CREATE TABLE IF NOT EXISTS customer_satisfaction_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE,
  survey_type VARCHAR(50) NOT NULL DEFAULT 'post_conversation', -- 'post_conversation', 'nps', 'periodic'
  
  -- CSAT Metrics
  csat_rating INTEGER CHECK (csat_rating >= 1 AND csat_rating <= 5),
  csat_comment TEXT,
  
  -- NPS Metrics
  nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
  nps_comment TEXT,
  
  -- Detailed feedback
  response_quality_rating INTEGER CHECK (response_quality_rating >= 1 AND response_quality_rating <= 5),
  resolution_speed_rating INTEGER CHECK (resolution_speed_rating >= 1 AND resolution_speed_rating <= 5),
  agent_friendliness_rating INTEGER CHECK (agent_friendliness_rating >= 1 AND resolution_speed_rating <= 5),
  
  -- Sentiment analysis
  sentiment_score DECIMAL(3,2), -- -1.0 to 1.0
  sentiment_magnitude DECIMAL(3,2), -- 0.0 to 1.0
  detected_emotions JSONB DEFAULT '{}',
  
  -- Survey metadata
  channel_type VARCHAR(50),
  survey_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  response_received_at TIMESTAMP WITH TIME ZONE,
  response_time_seconds INTEGER,
  
  -- Follow-up tracking
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_reason TEXT,
  follow_up_completed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time sentiment analysis during conversations
CREATE TABLE IF NOT EXISTS conversation_sentiment_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  
  -- Sentiment metrics
  sentiment_score DECIMAL(3,2) NOT NULL, -- -1.0 to 1.0
  sentiment_magnitude DECIMAL(3,2) NOT NULL, -- 0.0 to 1.0
  confidence_score DECIMAL(3,2) NOT NULL, -- 0.0 to 1.0
  
  -- Emotion detection
  detected_emotions JSONB DEFAULT '{}', -- {"joy": 0.8, "frustration": 0.2}
  dominant_emotion VARCHAR(50),
  
  -- Context analysis
  message_context VARCHAR(100), -- 'greeting', 'complaint', 'question', 'compliment'
  escalation_risk_score DECIMAL(3,2) DEFAULT 0, -- 0.0 to 1.0
  
  -- Analysis metadata
  analysis_model VARCHAR(100),
  processing_time_ms INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- PERFORMANCE METRICS SYSTEM
-- ================================

-- Enhanced performance metrics with SLA tracking
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  hour INTEGER, -- 0-23 for hourly metrics
  
  -- Identifiers
  agent_id UUID REFERENCES profiles(id),
  channel_type VARCHAR(50),
  department VARCHAR(100),
  
  -- Response Time Metrics (target: <30 seconds)
  avg_response_time_seconds INTEGER DEFAULT 0,
  p50_response_time_seconds INTEGER DEFAULT 0,
  p95_response_time_seconds INTEGER DEFAULT 0,
  response_time_sla_met INTEGER DEFAULT 0,
  response_time_sla_total INTEGER DEFAULT 0,
  
  -- Resolution Rate Metrics (target: >80%)
  total_conversations INTEGER DEFAULT 0,
  ai_resolved_conversations INTEGER DEFAULT 0,
  human_resolved_conversations INTEGER DEFAULT 0,
  escalated_conversations INTEGER DEFAULT 0,
  abandoned_conversations INTEGER DEFAULT 0,
  
  -- Agent Productivity Metrics
  conversations_handled INTEGER DEFAULT 0,
  active_time_minutes INTEGER DEFAULT 0,
  conversations_per_hour DECIMAL(5,2) DEFAULT 0,
  concurrent_conversations_avg DECIMAL(3,1) DEFAULT 0,
  
  -- Cost Metrics
  agent_cost_per_conversation DECIMAL(8,2) DEFAULT 0,
  ai_cost_per_conversation DECIMAL(8,2) DEFAULT 0,
  total_operational_cost DECIMAL(10,2) DEFAULT 0,
  
  -- Quality Metrics
  avg_satisfaction_score DECIMAL(3,2) DEFAULT 0,
  satisfaction_responses INTEGER DEFAULT 0,
  complaint_rate DECIMAL(3,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, hour, agent_id, channel_type, department)
);

-- ================================
-- ROI CALCULATIONS & TRACKING
-- ================================

-- ROI tracking and calculations
CREATE TABLE IF NOT EXISTS roi_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calculation_period_start DATE NOT NULL,
  calculation_period_end DATE NOT NULL,
  
  -- Cost Analysis
  labor_cost_before DECIMAL(12,2) DEFAULT 0,
  labor_cost_after DECIMAL(12,2) DEFAULT 0,
  labor_cost_savings DECIMAL(12,2) DEFAULT 0,
  
  ai_operational_cost DECIMAL(12,2) DEFAULT 0,
  platform_operational_cost DECIMAL(12,2) DEFAULT 0,
  training_cost DECIMAL(12,2) DEFAULT 0,
  
  -- Revenue Impact
  revenue_before DECIMAL(12,2) DEFAULT 0,
  revenue_after DECIMAL(12,2) DEFAULT 0,
  revenue_increase DECIMAL(12,2) DEFAULT 0,
  
  -- Efficiency Metrics
  time_saved_hours INTEGER DEFAULT 0,
  productivity_increase_percent DECIMAL(5,2) DEFAULT 0,
  
  -- Customer Metrics
  customer_satisfaction_improvement DECIMAL(3,2) DEFAULT 0,
  customer_retention_rate_improvement DECIMAL(3,2) DEFAULT 0,
  customer_lifetime_value_increase DECIMAL(12,2) DEFAULT 0,
  
  -- Calculated ROI
  total_investment DECIMAL(12,2) DEFAULT 0,
  total_benefits DECIMAL(12,2) DEFAULT 0,
  net_benefit DECIMAL(12,2) DEFAULT 0,
  roi_percentage DECIMAL(5,2) DEFAULT 0,
  payback_period_months INTEGER DEFAULT 0,
  
  -- Metadata
  calculation_method VARCHAR(100),
  calculated_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- PREDICTIVE ANALYTICS
-- ================================

-- Predictive model results and forecasting
CREATE TABLE IF NOT EXISTS predictive_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name VARCHAR(100) NOT NULL,
  model_version VARCHAR(50) NOT NULL,
  prediction_type VARCHAR(100) NOT NULL, -- 'volume_forecast', 'satisfaction_prediction', 'escalation_risk'
  
  -- Target information
  target_date DATE,
  target_period VARCHAR(50), -- 'hourly', 'daily', 'weekly', 'monthly'
  
  -- Predictions
  predicted_value DECIMAL(15,4) NOT NULL,
  confidence_interval_lower DECIMAL(15,4),
  confidence_interval_upper DECIMAL(15,4),
  confidence_score DECIMAL(3,2),
  
  -- Input features
  input_features JSONB DEFAULT '{}',
  feature_importance JSONB DEFAULT '{}',
  
  -- Model performance
  model_accuracy DECIMAL(3,2),
  model_precision DECIMAL(3,2),
  model_recall DECIMAL(3,2),
  model_f1_score DECIMAL(3,2),
  
  -- Actual vs Predicted (for model evaluation)
  actual_value DECIMAL(15,4),
  prediction_error DECIMAL(15,4),
  
  -- Metadata
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  model_training_date TIMESTAMP WITH TIME ZONE,
  data_window_start TIMESTAMP WITH TIME ZONE,
  data_window_end TIMESTAMP WITH TIME ZONE
);

-- Staffing predictions and recommendations
CREATE TABLE IF NOT EXISTS staffing_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_date DATE NOT NULL,
  prediction_hour INTEGER, -- 0-23 for hourly predictions
  
  -- Volume predictions
  predicted_conversation_volume INTEGER NOT NULL,
  predicted_ai_resolution_rate DECIMAL(3,2) NOT NULL,
  predicted_human_conversations INTEGER NOT NULL,
  
  -- Staffing recommendations
  recommended_agents_online INTEGER NOT NULL,
  recommended_agents_by_skill JSONB DEFAULT '{}',
  recommended_agents_by_channel JSONB DEFAULT '{}',
  
  -- SLA predictions
  predicted_avg_response_time INTEGER,
  predicted_sla_breach_risk DECIMAL(3,2),
  
  -- Confidence metrics
  prediction_confidence DECIMAL(3,2) NOT NULL,
  model_used VARCHAR(100),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- EXECUTIVE REPORTING
-- ================================

-- Executive dashboard configurations
CREATE TABLE IF NOT EXISTS executive_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_name VARCHAR(255) NOT NULL,
  dashboard_type VARCHAR(100) NOT NULL, -- 'monthly', 'quarterly', 'annual', 'custom'
  
  -- Dashboard configuration
  metrics_config JSONB NOT NULL DEFAULT '{}',
  visualization_config JSONB NOT NULL DEFAULT '{}',
  filter_config JSONB NOT NULL DEFAULT '{}',
  
  -- Access control
  created_by UUID REFERENCES profiles(id) NOT NULL,
  shared_with UUID[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT FALSE,
  
  -- Scheduling
  auto_refresh_interval INTEGER, -- minutes
  scheduled_reports JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scheduled reports and automated delivery
CREATE TABLE IF NOT EXISTS scheduled_executive_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_name VARCHAR(255) NOT NULL,
  report_type VARCHAR(100) NOT NULL, -- 'monthly_summary', 'quarterly_review', 'roi_report'
  
  -- Report configuration
  report_config JSONB NOT NULL DEFAULT '{}',
  recipients EMAIL[] NOT NULL,
  
  -- Scheduling
  schedule_cron VARCHAR(100) NOT NULL, -- Cron expression
  timezone VARCHAR(50) DEFAULT 'UTC',
  next_run_at TIMESTAMP WITH TIME ZONE,
  
  -- Delivery options
  delivery_method VARCHAR(50) DEFAULT 'email', -- 'email', 'slack', 'webhook'
  delivery_config JSONB DEFAULT '{}',
  
  -- Status tracking
  is_active BOOLEAN DEFAULT TRUE,
  last_run_at TIMESTAMP WITH TIME ZONE,
  last_run_status VARCHAR(50),
  last_run_error TEXT,
  
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- WORKFLOW AUTOMATION ANALYTICS
-- ================================

-- Workflow automation effectiveness tracking
CREATE TABLE IF NOT EXISTS workflow_automation_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  
  -- Execution metrics
  total_executions INTEGER DEFAULT 0,
  successful_executions INTEGER DEFAULT 0,
  failed_executions INTEGER DEFAULT 0,
  avg_execution_time_seconds INTEGER DEFAULT 0,
  
  -- Effectiveness metrics
  success_rate DECIMAL(3,2) DEFAULT 0,
  cost_savings_per_execution DECIMAL(8,2) DEFAULT 0,
  time_saved_per_execution_seconds INTEGER DEFAULT 0,
  
  -- Trigger analysis
  trigger_effectiveness JSONB DEFAULT '{}',
  most_common_trigger VARCHAR(255),
  trigger_accuracy_rate DECIMAL(3,2) DEFAULT 0,
  
  -- Business impact
  conversations_automated INTEGER DEFAULT 0,
  manual_interventions_required INTEGER DEFAULT 0,
  customer_satisfaction_impact DECIMAL(3,2) DEFAULT 0,
  
  -- Period tracking
  analysis_period_start DATE NOT NULL,
  analysis_period_end DATE NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- INDEXES FOR PERFORMANCE
-- ================================

-- Customer satisfaction indexes
CREATE INDEX IF NOT EXISTS idx_customer_satisfaction_surveys_conversation_id ON customer_satisfaction_surveys(conversation_id);
CREATE INDEX IF NOT EXISTS idx_customer_satisfaction_surveys_customer_id ON customer_satisfaction_surveys(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_satisfaction_surveys_survey_type ON customer_satisfaction_surveys(survey_type);
CREATE INDEX IF NOT EXISTS idx_customer_satisfaction_surveys_created_at ON customer_satisfaction_surveys(created_at);

-- Sentiment analysis indexes
CREATE INDEX IF NOT EXISTS idx_conversation_sentiment_analysis_conversation_id ON conversation_sentiment_analysis(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_sentiment_analysis_message_id ON conversation_sentiment_analysis(message_id);
CREATE INDEX IF NOT EXISTS idx_conversation_sentiment_analysis_created_at ON conversation_sentiment_analysis(created_at);

-- Performance metrics indexes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_date ON performance_metrics(date);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_agent_id ON performance_metrics(agent_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_channel_type ON performance_metrics(channel_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_date_hour ON performance_metrics(date, hour);

-- ROI calculations indexes
CREATE INDEX IF NOT EXISTS idx_roi_calculations_period ON roi_calculations(calculation_period_start, calculation_period_end);
CREATE INDEX IF NOT EXISTS idx_roi_calculations_created_at ON roi_calculations(created_at);

-- Predictive analytics indexes
CREATE INDEX IF NOT EXISTS idx_predictive_analytics_model_name ON predictive_analytics(model_name);
CREATE INDEX IF NOT EXISTS idx_predictive_analytics_prediction_type ON predictive_analytics(prediction_type);
CREATE INDEX IF NOT EXISTS idx_predictive_analytics_target_date ON predictive_analytics(target_date);

-- Staffing predictions indexes
CREATE INDEX IF NOT EXISTS idx_staffing_predictions_date ON staffing_predictions(prediction_date);
CREATE INDEX IF NOT EXISTS idx_staffing_predictions_date_hour ON staffing_predictions(prediction_date, prediction_hour);

-- Executive dashboard indexes
CREATE INDEX IF NOT EXISTS idx_executive_dashboards_created_by ON executive_dashboards(created_by);
CREATE INDEX IF NOT EXISTS idx_executive_dashboards_dashboard_type ON executive_dashboards(dashboard_type);

-- Workflow automation analytics indexes
CREATE INDEX IF NOT EXISTS idx_workflow_automation_analytics_workflow_id ON workflow_automation_analytics(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_automation_analytics_period ON workflow_automation_analytics(analysis_period_start, analysis_period_end);

-- ================================
-- ROW LEVEL SECURITY
-- ================================

-- Enable RLS on all new tables
ALTER TABLE customer_satisfaction_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_sentiment_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE roi_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictive_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE staffing_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE executive_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_executive_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_automation_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated access to satisfaction surveys" ON customer_satisfaction_surveys
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access to sentiment analysis" ON conversation_sentiment_analysis
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access to performance metrics" ON performance_metrics
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access to ROI calculations" ON roi_calculations
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access to predictive analytics" ON predictive_analytics
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access to staffing predictions" ON staffing_predictions
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow managing own executive dashboards" ON executive_dashboards
  FOR ALL USING (auth.uid() = created_by);

CREATE POLICY "Allow managing own scheduled reports" ON scheduled_executive_reports
  FOR ALL USING (auth.uid() = created_by);

CREATE POLICY "Allow authenticated access to workflow analytics" ON workflow_automation_analytics
  FOR ALL USING (auth.role() = 'authenticated');

-- Final success message
SELECT 'Advanced Analytics & Business Intelligence Schema Extensions completed successfully!' as status;