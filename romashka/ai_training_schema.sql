-- AI Training System Database Schema Extensions
-- This file contains the additional tables needed for the AI training system

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- AI Training Data table
CREATE TABLE IF NOT EXISTS ai_training_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  success BOOLEAN NOT NULL,
  customer_rating DECIMAL(3,2),
  agent_rating DECIMAL(3,2),
  resolution_time INTEGER, -- seconds
  handoff_occurred BOOLEAN DEFAULT FALSE,
  knowledge_used TEXT[], -- array of knowledge source IDs
  topics TEXT[], -- array of conversation topics
  sentiment VARCHAR(20),
  confidence DECIMAL(3,2),
  learning_points TEXT[], -- array of learning insights
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Knowledge Gaps table
CREATE TABLE IF NOT EXISTS knowledge_gaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic VARCHAR(255) NOT NULL,
  frequency INTEGER DEFAULT 1,
  impact DECIMAL(3,2) DEFAULT 0,
  suggested_content TEXT,
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high
  detected_at TIMESTAMP DEFAULT NOW(),
  contexts TEXT[], -- array of conversation IDs where gap was detected
  status VARCHAR(20) DEFAULT 'active', -- active, resolved, dismissed
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Learning Insights table
CREATE TABLE IF NOT EXISTS learning_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL, -- success_pattern, failure_pattern, improvement_opportunity
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  confidence DECIMAL(3,2) DEFAULT 0,
  impact DECIMAL(3,2) DEFAULT 0,
  actionable BOOLEAN DEFAULT FALSE,
  data JSONB, -- additional structured data
  status VARCHAR(20) DEFAULT 'active', -- active, implemented, dismissed
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Continuous Learning Updates table
CREATE TABLE IF NOT EXISTS learning_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL, -- knowledge_update, pattern_recognition, model_optimization, content_improvement
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  confidence DECIMAL(3,2) DEFAULT 0,
  impact DECIMAL(3,2) DEFAULT 0,
  applied BOOLEAN DEFAULT FALSE,
  approved BOOLEAN DEFAULT FALSE,
  data JSONB, -- additional structured data
  created_at TIMESTAMP DEFAULT NOW(),
  applied_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Knowledge Updates table
CREATE TABLE IF NOT EXISTS knowledge_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID, -- references knowledge_items(id)
  type VARCHAR(50) NOT NULL, -- create, update, optimize, merge, deprecate
  content TEXT NOT NULL,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  tags TEXT[],
  effectiveness DECIMAL(3,2) DEFAULT 0,
  confidence DECIMAL(3,2) DEFAULT 0,
  source VARCHAR(50) NOT NULL, -- conversation, pattern, gap_analysis, feedback
  source_id UUID, -- ID of the source (conversation_id, pattern_id, etc.)
  status VARCHAR(20) DEFAULT 'pending', -- pending, applied, rejected
  created_at TIMESTAMP DEFAULT NOW(),
  applied_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Pattern Recognition table
CREATE TABLE IF NOT EXISTS pattern_recognition (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern VARCHAR(500) NOT NULL,
  frequency INTEGER DEFAULT 1,
  confidence DECIMAL(3,2) DEFAULT 0,
  impact DECIMAL(3,2) DEFAULT 0,
  context VARCHAR(100) NOT NULL, -- frequently_asked_questions, successful_responses, failed_responses
  examples TEXT[], -- array of example texts
  suggestions TEXT[], -- array of improvement suggestions
  actionable BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'active', -- active, implemented, dismissed
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Model Optimizations table
CREATE TABLE IF NOT EXISTS model_optimizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL, -- prompt_optimization, temperature_adjustment, context_improvement, response_tuning
  parameter VARCHAR(100) NOT NULL,
  old_value JSONB,
  new_value JSONB,
  reason TEXT NOT NULL,
  performance JSONB, -- performance metrics before and after
  applied BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'pending', -- pending, applied, rejected
  created_at TIMESTAMP DEFAULT NOW(),
  applied_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Content Optimizations table
CREATE TABLE IF NOT EXISTS content_optimizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID, -- references knowledge_items(id)
  type VARCHAR(50) NOT NULL, -- effectiveness_improvement, clarity_enhancement, coverage_expansion, accuracy_fix
  current_content TEXT NOT NULL,
  suggested_content TEXT NOT NULL,
  improvement_reason TEXT NOT NULL,
  confidence_score DECIMAL(3,2) DEFAULT 0,
  usage_stats JSONB, -- usage statistics that led to optimization
  status VARCHAR(20) DEFAULT 'pending', -- pending, applied, rejected
  created_at TIMESTAMP DEFAULT NOW(),
  applied_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- A/B Tests table
CREATE TABLE IF NOT EXISTS ab_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- response_style, personality, conversation_flow, escalation_rules, template_effectiveness
  status VARCHAR(20) DEFAULT 'draft', -- draft, active, completed, paused
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  target_sample_size INTEGER DEFAULT 1000,
  current_sample_size INTEGER DEFAULT 0,
  variants JSONB NOT NULL, -- array of test variants
  metrics JSONB, -- test metrics and results
  settings JSONB, -- test configuration settings
  results JSONB, -- final test results
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Conversation Assignments table (for A/B testing)
CREATE TABLE IF NOT EXISTS conversation_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  test_id UUID REFERENCES ab_tests(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL, -- ID of the variant within the test
  assigned_at TIMESTAMP DEFAULT NOW(),
  completed BOOLEAN DEFAULT FALSE,
  results JSONB, -- conversation results for the test
  completed_at TIMESTAMP,
  UNIQUE(conversation_id, test_id)
);

-- Accuracy Metrics table
CREATE TABLE IF NOT EXISTS accuracy_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  response_id UUID, -- references messages(id)
  accuracy_score DECIMAL(3,2) NOT NULL,
  confidence_score DECIMAL(3,2) NOT NULL,
  factual_accuracy DECIMAL(3,2) NOT NULL,
  relevance_score DECIMAL(3,2) NOT NULL,
  completeness_score DECIMAL(3,2) NOT NULL,
  clarity_score DECIMAL(3,2) NOT NULL,
  assessment_method VARCHAR(20) NOT NULL, -- automated, manual, feedback
  notes TEXT,
  assessed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Quality Assessments table
CREATE TABLE IF NOT EXISTS quality_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  message_id UUID, -- references messages(id)
  overall_quality DECIMAL(3,2) NOT NULL,
  dimensions JSONB NOT NULL, -- accuracy, relevance, completeness, clarity, tone, helpfulness
  issues JSONB, -- array of quality issues
  suggestions TEXT[], -- array of improvement suggestions
  automated_score DECIMAL(3,2) NOT NULL,
  human_score DECIMAL(3,2),
  assessed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Conversation Predictions table
CREATE TABLE IF NOT EXISTS conversation_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  prediction_type VARCHAR(50) NOT NULL, -- satisfaction, escalation, resolution, engagement
  predicted_value DECIMAL(3,2) NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  factors JSONB NOT NULL, -- prediction factors with weights
  recommendation TEXT,
  predicted_at TIMESTAMP DEFAULT NOW(),
  actual_outcome DECIMAL(3,2),
  accuracy DECIMAL(3,2),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Improvement Recommendations table
CREATE TABLE IF NOT EXISTS improvement_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL, -- response_quality, knowledge_gap, model_parameter, content_update, process_improvement
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  impact DECIMAL(3,2) DEFAULT 0,
  effort DECIMAL(3,2) DEFAULT 0,
  confidence DECIMAL(3,2) DEFAULT 0,
  data JSONB, -- additional structured data
  action_items TEXT[], -- array of specific action items
  expected_outcome TEXT,
  timeframe VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, completed, dismissed
  assigned_to UUID, -- references users(id)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Conversation Feedback table (enhanced)
CREATE TABLE IF NOT EXISTS conversation_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comments TEXT,
  feedback_type VARCHAR(20) NOT NULL, -- customer, agent, system
  categories TEXT[], -- array of feedback categories
  sentiment VARCHAR(20), -- positive, negative, neutral
  actionable BOOLEAN DEFAULT FALSE,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Training Sessions table
CREATE TABLE IF NOT EXISTS training_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- manual, automated, scheduled
  status VARCHAR(20) DEFAULT 'pending', -- pending, running, completed, failed
  configuration JSONB, -- training configuration
  data_source JSONB, -- source of training data
  metrics JSONB, -- training metrics and results
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Training Metrics History table
CREATE TABLE IF NOT EXISTS training_metrics_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_type VARCHAR(50) NOT NULL, -- accuracy, satisfaction, confidence, success_rate
  value DECIMAL(10,4) NOT NULL,
  timeframe VARCHAR(20) NOT NULL, -- daily, weekly, monthly
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  additional_data JSONB, -- breakdown by channel, agent, etc.
  created_at TIMESTAMP DEFAULT NOW()
);

-- Performance Baselines table
CREATE TABLE IF NOT EXISTS performance_baselines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name VARCHAR(100) NOT NULL,
  baseline_value DECIMAL(10,4) NOT NULL,
  target_value DECIMAL(10,4),
  measurement_period VARCHAR(20) NOT NULL, -- daily, weekly, monthly
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_training_data_conversation_id ON ai_training_data(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_training_data_created_at ON ai_training_data(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_training_data_success ON ai_training_data(success);

CREATE INDEX IF NOT EXISTS idx_knowledge_gaps_topic ON knowledge_gaps(topic);
CREATE INDEX IF NOT EXISTS idx_knowledge_gaps_priority ON knowledge_gaps(priority);
CREATE INDEX IF NOT EXISTS idx_knowledge_gaps_status ON knowledge_gaps(status);

CREATE INDEX IF NOT EXISTS idx_learning_insights_type ON learning_insights(type);
CREATE INDEX IF NOT EXISTS idx_learning_insights_created_at ON learning_insights(created_at);

CREATE INDEX IF NOT EXISTS idx_learning_updates_type ON learning_updates(type);
CREATE INDEX IF NOT EXISTS idx_learning_updates_applied ON learning_updates(applied);

CREATE INDEX IF NOT EXISTS idx_pattern_recognition_context ON pattern_recognition(context);
CREATE INDEX IF NOT EXISTS idx_pattern_recognition_frequency ON pattern_recognition(frequency);

CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON ab_tests(status);
CREATE INDEX IF NOT EXISTS idx_ab_tests_type ON ab_tests(type);

CREATE INDEX IF NOT EXISTS idx_conversation_assignments_conversation_id ON conversation_assignments(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_assignments_test_id ON conversation_assignments(test_id);

CREATE INDEX IF NOT EXISTS idx_accuracy_metrics_conversation_id ON accuracy_metrics(conversation_id);
CREATE INDEX IF NOT EXISTS idx_accuracy_metrics_assessed_at ON accuracy_metrics(assessed_at);

CREATE INDEX IF NOT EXISTS idx_quality_assessments_conversation_id ON quality_assessments(conversation_id);
CREATE INDEX IF NOT EXISTS idx_quality_assessments_assessed_at ON quality_assessments(assessed_at);

CREATE INDEX IF NOT EXISTS idx_conversation_predictions_conversation_id ON conversation_predictions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_predictions_type ON conversation_predictions(prediction_type);

CREATE INDEX IF NOT EXISTS idx_improvement_recommendations_priority ON improvement_recommendations(priority);
CREATE INDEX IF NOT EXISTS idx_improvement_recommendations_status ON improvement_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_improvement_recommendations_type ON improvement_recommendations(type);

CREATE INDEX IF NOT EXISTS idx_conversation_feedback_conversation_id ON conversation_feedback(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_feedback_rating ON conversation_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_conversation_feedback_type ON conversation_feedback(feedback_type);

CREATE INDEX IF NOT EXISTS idx_training_sessions_status ON training_sessions(status);
CREATE INDEX IF NOT EXISTS idx_training_sessions_created_at ON training_sessions(created_at);

CREATE INDEX IF NOT EXISTS idx_training_metrics_history_metric_type ON training_metrics_history(metric_type);
CREATE INDEX IF NOT EXISTS idx_training_metrics_history_start_date ON training_metrics_history(start_date);

-- Create functions for common queries
CREATE OR REPLACE FUNCTION get_training_metrics(
  p_start_date TIMESTAMP,
  p_end_date TIMESTAMP DEFAULT NOW()
) RETURNS TABLE (
  total_conversations INTEGER,
  success_rate DECIMAL(3,2),
  avg_confidence DECIMAL(3,2),
  avg_satisfaction DECIMAL(3,2),
  handoff_rate DECIMAL(3,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_conversations,
    (COUNT(*) FILTER (WHERE success = TRUE))::DECIMAL / GREATEST(COUNT(*), 1) as success_rate,
    AVG(confidence) as avg_confidence,
    AVG(customer_rating) as avg_satisfaction,
    (COUNT(*) FILTER (WHERE handoff_occurred = TRUE))::DECIMAL / GREATEST(COUNT(*), 1) as handoff_rate
  FROM ai_training_data
  WHERE created_at >= p_start_date AND created_at <= p_end_date;
END;
$$ LANGUAGE plpgsql;

-- Create function to get knowledge gaps by priority
CREATE OR REPLACE FUNCTION get_knowledge_gaps_by_priority(
  p_priority VARCHAR(20) DEFAULT NULL
) RETURNS TABLE (
  id UUID,
  topic VARCHAR(255),
  frequency INTEGER,
  impact DECIMAL(3,2),
  suggested_content TEXT,
  priority VARCHAR(20)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kg.id,
    kg.topic,
    kg.frequency,
    kg.impact,
    kg.suggested_content,
    kg.priority
  FROM knowledge_gaps kg
  WHERE (p_priority IS NULL OR kg.priority = p_priority)
    AND kg.status = 'active'
  ORDER BY kg.frequency DESC, kg.impact DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get performance trends
CREATE OR REPLACE FUNCTION get_performance_trends(
  p_metric_type VARCHAR(50),
  p_days INTEGER DEFAULT 30
) RETURNS TABLE (
  date DATE,
  value DECIMAL(10,4),
  trend_direction VARCHAR(10)
) AS $$
BEGIN
  RETURN QUERY
  WITH daily_metrics AS (
    SELECT 
      DATE(created_at) as metric_date,
      AVG(
        CASE 
          WHEN p_metric_type = 'accuracy' THEN accuracy_score
          WHEN p_metric_type = 'confidence' THEN confidence_score
          ELSE 0
        END
      ) as metric_value
    FROM accuracy_metrics
    WHERE created_at >= NOW() - INTERVAL '1 day' * p_days
    GROUP BY DATE(created_at)
  ),
  with_trends AS (
    SELECT 
      metric_date,
      metric_value,
      LAG(metric_value) OVER (ORDER BY metric_date) as prev_value
    FROM daily_metrics
  )
  SELECT 
    metric_date,
    metric_value,
    CASE 
      WHEN prev_value IS NULL THEN 'stable'
      WHEN metric_value > prev_value THEN 'up'
      WHEN metric_value < prev_value THEN 'down'
      ELSE 'stable'
    END as trend_direction
  FROM with_trends
  ORDER BY metric_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update training metrics history
CREATE OR REPLACE FUNCTION update_training_metrics_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert daily metrics summary
  INSERT INTO training_metrics_history (
    metric_type,
    value,
    timeframe,
    start_date,
    end_date
  )
  SELECT 
    'accuracy',
    AVG(accuracy_score),
    'daily',
    DATE_TRUNC('day', NOW()),
    DATE_TRUNC('day', NOW()) + INTERVAL '1 day'
  FROM accuracy_metrics
  WHERE DATE(assessed_at) = DATE(NOW())
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for accuracy metrics
CREATE TRIGGER trigger_update_training_metrics_history
  AFTER INSERT ON accuracy_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_training_metrics_history();

-- Create view for training dashboard
CREATE OR REPLACE VIEW training_dashboard_summary AS
SELECT 
  t.total_conversations,
  t.success_rate,
  t.avg_confidence,
  t.avg_satisfaction,
  t.handoff_rate,
  COUNT(kg.id) as knowledge_gaps_count,
  COUNT(li.id) as learning_insights_count,
  COUNT(at.id) as active_tests_count,
  COUNT(ir.id) as pending_recommendations_count
FROM get_training_metrics(NOW() - INTERVAL '30 days') t
CROSS JOIN (
  SELECT COUNT(*) as total_conversations FROM ai_training_data 
  WHERE created_at >= NOW() - INTERVAL '30 days'
) base
LEFT JOIN knowledge_gaps kg ON kg.status = 'active'
LEFT JOIN learning_insights li ON li.status = 'active'
LEFT JOIN ab_tests at ON at.status = 'active'
LEFT JOIN improvement_recommendations ir ON ir.status = 'pending'
GROUP BY t.total_conversations, t.success_rate, t.avg_confidence, t.avg_satisfaction, t.handoff_rate;

-- Sample data for testing (optional)
-- INSERT INTO performance_baselines (metric_name, baseline_value, target_value, measurement_period, description)
-- VALUES 
--   ('ai_accuracy', 0.80, 0.90, 'daily', 'AI response accuracy baseline'),
--   ('customer_satisfaction', 3.5, 4.2, 'daily', 'Customer satisfaction score baseline'),
--   ('response_time', 30.0, 15.0, 'daily', 'Average response time baseline (seconds)'),
--   ('handoff_rate', 0.25, 0.15, 'daily', 'Human handoff rate baseline');

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO your_app_user;