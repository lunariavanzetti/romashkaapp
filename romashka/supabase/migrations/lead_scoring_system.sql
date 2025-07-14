-- Lead Scoring System Database Schema
-- This migration creates tables and functions for the lead scoring system

-- Lead scoring configuration table
CREATE TABLE IF NOT EXISTS lead_scoring_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Lead scores table
CREATE TABLE IF NOT EXISTS lead_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  conversation_id UUID,
  total_score INTEGER NOT NULL DEFAULT 0,
  max_possible_score INTEGER NOT NULL DEFAULT 100,
  score_percentage INTEGER NOT NULL DEFAULT 0,
  criteria_scores JSONB NOT NULL DEFAULT '{}',
  score_breakdown JSONB NOT NULL DEFAULT '[]',
  routing_decision TEXT NOT NULL CHECK (routing_decision IN ('immediate_consultation', 'nurture_sequence', 'resource_sharing', 'manual_review')),
  lead_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lead scoring questions table (for AI to ask)
CREATE TABLE IF NOT EXISTS lead_scoring_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  criteria_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('range', 'boolean', 'category', 'text')),
  options JSONB,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lead scoring analytics table
CREATE TABLE IF NOT EXISTS lead_scoring_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_leads INTEGER DEFAULT 0,
  high_score_leads INTEGER DEFAULT 0,
  medium_score_leads INTEGER DEFAULT 0,
  low_score_leads INTEGER DEFAULT 0,
  conversion_rate_consultation DECIMAL(5,2) DEFAULT 0,
  conversion_rate_nurture DECIMAL(5,2) DEFAULT 0,
  average_score DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lead_scores_customer_id ON lead_scores(customer_id);
CREATE INDEX IF NOT EXISTS idx_lead_scores_conversation_id ON lead_scores(conversation_id);
CREATE INDEX IF NOT EXISTS idx_lead_scores_routing_decision ON lead_scores(routing_decision);
CREATE INDEX IF NOT EXISTS idx_lead_scores_created_at ON lead_scores(created_at);
CREATE INDEX IF NOT EXISTS idx_lead_scoring_config_user_id ON lead_scoring_config(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_scoring_questions_user_id ON lead_scoring_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_scoring_analytics_user_date ON lead_scoring_analytics(user_id, date);

-- Row Level Security (RLS) policies
ALTER TABLE lead_scoring_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_scoring_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_scoring_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lead_scoring_config
CREATE POLICY "Users can view their own lead scoring config"
ON lead_scoring_config FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lead scoring config"
ON lead_scoring_config FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lead scoring config"
ON lead_scoring_config FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for lead_scores
CREATE POLICY "Users can view lead scores for their customers"
ON lead_scores FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM customers 
    WHERE customers.id = lead_scores.customer_id 
    AND customers.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert lead scores for their customers"
ON lead_scores FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM customers 
    WHERE customers.id = lead_scores.customer_id 
    AND customers.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update lead scores for their customers"
ON lead_scores FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM customers 
    WHERE customers.id = lead_scores.customer_id 
    AND customers.user_id = auth.uid()
  )
);

-- RLS Policies for lead_scoring_questions
CREATE POLICY "Users can manage their own lead scoring questions"
ON lead_scoring_questions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for lead_scoring_analytics
CREATE POLICY "Users can manage their own lead scoring analytics"
ON lead_scoring_analytics FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Function to update lead scoring analytics
CREATE OR REPLACE FUNCTION update_lead_scoring_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update daily analytics when a new lead score is created
  INSERT INTO lead_scoring_analytics (
    user_id,
    date,
    total_leads,
    high_score_leads,
    medium_score_leads,
    low_score_leads,
    average_score
  )
  VALUES (
    (SELECT user_id FROM customers WHERE id = NEW.customer_id),
    CURRENT_DATE,
    1,
    CASE WHEN NEW.routing_decision = 'immediate_consultation' THEN 1 ELSE 0 END,
    CASE WHEN NEW.routing_decision = 'nurture_sequence' THEN 1 ELSE 0 END,
    CASE WHEN NEW.routing_decision IN ('resource_sharing', 'manual_review') THEN 1 ELSE 0 END,
    NEW.score_percentage
  )
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    total_leads = lead_scoring_analytics.total_leads + 1,
    high_score_leads = lead_scoring_analytics.high_score_leads + 
      CASE WHEN NEW.routing_decision = 'immediate_consultation' THEN 1 ELSE 0 END,
    medium_score_leads = lead_scoring_analytics.medium_score_leads + 
      CASE WHEN NEW.routing_decision = 'nurture_sequence' THEN 1 ELSE 0 END,
    low_score_leads = lead_scoring_analytics.low_score_leads + 
      CASE WHEN NEW.routing_decision IN ('resource_sharing', 'manual_review') THEN 1 ELSE 0 END,
    average_score = (
      (lead_scoring_analytics.average_score * lead_scoring_analytics.total_leads + NEW.score_percentage)
      / (lead_scoring_analytics.total_leads + 1)
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update analytics on lead score creation
CREATE TRIGGER update_lead_scoring_analytics_trigger
  AFTER INSERT ON lead_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_scoring_analytics();

-- Function to get lead scoring statistics
CREATE OR REPLACE FUNCTION get_lead_scoring_stats(user_uuid UUID, start_date DATE DEFAULT NULL, end_date DATE DEFAULT NULL)
RETURNS TABLE (
  total_leads BIGINT,
  high_score_leads BIGINT,
  medium_score_leads BIGINT,
  low_score_leads BIGINT,
  average_score NUMERIC,
  conversion_rates JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_leads,
    COUNT(*) FILTER (WHERE routing_decision = 'immediate_consultation') as high_score_leads,
    COUNT(*) FILTER (WHERE routing_decision = 'nurture_sequence') as medium_score_leads,
    COUNT(*) FILTER (WHERE routing_decision IN ('resource_sharing', 'manual_review')) as low_score_leads,
    AVG(score_percentage) as average_score,
    jsonb_build_object(
      'consultation_rate', 
      ROUND(
        (COUNT(*) FILTER (WHERE routing_decision = 'immediate_consultation')::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 
        2
      ),
      'nurture_rate',
      ROUND(
        (COUNT(*) FILTER (WHERE routing_decision = 'nurture_sequence')::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 
        2
      )
    ) as conversion_rates
  FROM lead_scores ls
  JOIN customers c ON c.id = ls.customer_id
  WHERE c.user_id = user_uuid
    AND (start_date IS NULL OR ls.created_at::DATE >= start_date)
    AND (end_date IS NULL OR ls.created_at::DATE <= end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get lead scoring trends
CREATE OR REPLACE FUNCTION get_lead_scoring_trends(user_uuid UUID, days INTEGER DEFAULT 30)
RETURNS TABLE (
  date DATE,
  total_leads INTEGER,
  high_score_leads INTEGER,
  medium_score_leads INTEGER,
  low_score_leads INTEGER,
  average_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.date::DATE,
    COALESCE(a.total_leads, 0) as total_leads,
    COALESCE(a.high_score_leads, 0) as high_score_leads,
    COALESCE(a.medium_score_leads, 0) as medium_score_leads,
    COALESCE(a.low_score_leads, 0) as low_score_leads,
    COALESCE(a.average_score, 0) as average_score
  FROM generate_series(
    CURRENT_DATE - INTERVAL '1 day' * days,
    CURRENT_DATE,
    INTERVAL '1 day'
  ) d(date)
  LEFT JOIN lead_scoring_analytics a ON a.date = d.date::DATE AND a.user_id = user_uuid
  ORDER BY d.date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default lead scoring configuration for existing users
INSERT INTO lead_scoring_config (user_id, config)
SELECT 
  id as user_id,
  jsonb_build_object(
    'rules', jsonb_build_array(
      jsonb_build_object(
        'id', 'default_rule',
        'name', 'Default Lead Scoring Rule',
        'active', true,
        'criteria', '[]'::jsonb,
        'routing_rules', '[]'::jsonb,
        'created_at', CURRENT_TIMESTAMP,
        'updated_at', CURRENT_TIMESTAMP
      )
    ),
    'default_criteria', '[]'::jsonb,
    'scoring_settings', jsonb_build_object(
      'auto_score_enabled', true,
      'require_manual_review', false,
      'score_threshold_consultation', 70,
      'score_threshold_nurture', 40,
      'score_expiry_days', 30
    )
  ) as config
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM lead_scoring_config)
ON CONFLICT (user_id) DO NOTHING;

COMMENT ON TABLE lead_scoring_config IS 'Lead scoring configuration and rules for each user';
COMMENT ON TABLE lead_scores IS 'Individual lead scores with breakdown and routing decisions';
COMMENT ON TABLE lead_scoring_questions IS 'AI questions for lead qualification';
COMMENT ON TABLE lead_scoring_analytics IS 'Daily aggregated lead scoring analytics';
COMMENT ON FUNCTION get_lead_scoring_stats IS 'Get lead scoring statistics for a user within date range';
COMMENT ON FUNCTION get_lead_scoring_trends IS 'Get daily lead scoring trends for the last N days';