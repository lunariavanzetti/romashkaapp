-- Website Behavior Triggers System Database Schema
-- This migration creates tables and functions for tracking website behavior and triggering actions

-- Behavior triggers table
CREATE TABLE IF NOT EXISTS behavior_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('exit_intent', 'time_on_page', 'scroll_depth', 'page_visit_count', 'return_visitor', 'inactivity', 'form_abandonment')),
  conditions JSONB NOT NULL DEFAULT '[]',
  actions JSONB NOT NULL DEFAULT '[]',
  active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  targeting JSONB NOT NULL DEFAULT '{}',
  analytics JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Visitor sessions table
CREATE TABLE IF NOT EXISTS visitor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  session_start TIMESTAMP WITH TIME ZONE NOT NULL,
  session_end TIMESTAMP WITH TIME ZONE,
  page_views JSONB DEFAULT '[]',
  events JSONB DEFAULT '[]',
  user_agent TEXT,
  ip_address TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'tablet', 'mobile')),
  browser TEXT,
  traffic_source TEXT CHECK (traffic_source IN ('direct', 'search', 'social', 'email', 'referral', 'paid')),
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  is_returning BOOLEAN DEFAULT false,
  total_session_time INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Page views table
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES visitor_sessions(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  page_title TEXT,
  time_on_page INTEGER DEFAULT 0,
  scroll_depth INTEGER DEFAULT 0,
  exit_intent_detected BOOLEAN DEFAULT false,
  form_interactions JSONB DEFAULT '[]',
  custom_events JSONB DEFAULT '[]',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger events table
CREATE TABLE IF NOT EXISTS trigger_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_id UUID NOT NULL REFERENCES behavior_triggers(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  session_id UUID NOT NULL REFERENCES visitor_sessions(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  user_agent TEXT,
  trigger_conditions JSONB NOT NULL DEFAULT '[]',
  actions_executed JSONB NOT NULL DEFAULT '[]',
  converted BOOLEAN DEFAULT false,
  conversion_value NUMERIC,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger analytics table
CREATE TABLE IF NOT EXISTS trigger_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_id UUID NOT NULL REFERENCES behavior_triggers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  page_url TEXT NOT NULL,
  total_visitors INTEGER DEFAULT 0,
  triggered_visitors INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue NUMERIC DEFAULT 0,
  avg_engagement_time NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(trigger_id, date, page_url)
);

-- Visitor behavior profiles table
CREATE TABLE IF NOT EXISTS visitor_behavior_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  first_visit TIMESTAMP WITH TIME ZONE,
  last_visit TIMESTAMP WITH TIME ZONE,
  total_sessions INTEGER DEFAULT 0,
  total_page_views INTEGER DEFAULT 0,
  total_time_spent INTEGER DEFAULT 0,
  avg_session_duration NUMERIC DEFAULT 0,
  bounce_rate NUMERIC DEFAULT 0,
  conversion_rate NUMERIC DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  favorite_pages JSONB DEFAULT '[]',
  behavior_patterns JSONB DEFAULT '{}',
  segments JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Website performance metrics table
CREATE TABLE IF NOT EXISTS website_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  page_url TEXT NOT NULL,
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  avg_time_on_page NUMERIC DEFAULT 0,
  avg_scroll_depth NUMERIC DEFAULT 0,
  bounce_rate NUMERIC DEFAULT 0,
  exit_rate NUMERIC DEFAULT 0,
  conversion_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date, page_url)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_behavior_triggers_user_id ON behavior_triggers(user_id);
CREATE INDEX IF NOT EXISTS idx_behavior_triggers_active ON behavior_triggers(active);
CREATE INDEX IF NOT EXISTS idx_behavior_triggers_priority ON behavior_triggers(priority);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_visitor_id ON visitor_sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_user_id ON visitor_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_session_start ON visitor_sessions(session_start);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_page_url ON page_views(page_url);
CREATE INDEX IF NOT EXISTS idx_trigger_events_trigger_id ON trigger_events(trigger_id);
CREATE INDEX IF NOT EXISTS idx_trigger_events_visitor_id ON trigger_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_trigger_events_created_at ON trigger_events(created_at);
CREATE INDEX IF NOT EXISTS idx_trigger_analytics_trigger_date ON trigger_analytics(trigger_id, date);
CREATE INDEX IF NOT EXISTS idx_visitor_behavior_profiles_visitor_id ON visitor_behavior_profiles(visitor_id);
CREATE INDEX IF NOT EXISTS idx_website_performance_metrics_user_date ON website_performance_metrics(user_id, date);

-- Row Level Security (RLS) policies
ALTER TABLE behavior_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE trigger_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE trigger_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_behavior_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for behavior_triggers
CREATE POLICY "Users can manage their own behavior triggers"
ON behavior_triggers FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for visitor_sessions (public read for tracking)
CREATE POLICY "Public can create visitor sessions"
ON visitor_sessions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view their own visitor sessions"
ON visitor_sessions FOR SELECT
USING (user_id = auth.uid()::text OR auth.uid() IS NULL);

CREATE POLICY "Users can update their own visitor sessions"
ON visitor_sessions FOR UPDATE
USING (user_id = auth.uid()::text);

-- RLS Policies for page_views
CREATE POLICY "Public can create page views"
ON page_views FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view page views for their sessions"
ON page_views FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM visitor_sessions vs
    WHERE vs.id = page_views.session_id
    AND (vs.user_id = auth.uid()::text OR auth.uid() IS NULL)
  )
);

CREATE POLICY "Users can update page views for their sessions"
ON page_views FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM visitor_sessions vs
    WHERE vs.id = page_views.session_id
    AND vs.user_id = auth.uid()::text
  )
);

-- RLS Policies for trigger_events
CREATE POLICY "Public can create trigger events"
ON trigger_events FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view trigger events for their triggers"
ON trigger_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM behavior_triggers bt
    WHERE bt.id = trigger_events.trigger_id
    AND (bt.user_id = auth.uid() OR auth.uid() IS NULL)
  )
);

CREATE POLICY "Users can update trigger events for their triggers"
ON trigger_events FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM behavior_triggers bt
    WHERE bt.id = trigger_events.trigger_id
    AND bt.user_id = auth.uid()
  )
);

-- RLS Policies for trigger_analytics
CREATE POLICY "Users can manage trigger analytics for their triggers"
ON trigger_analytics FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM behavior_triggers bt
    WHERE bt.id = trigger_analytics.trigger_id
    AND bt.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM behavior_triggers bt
    WHERE bt.id = trigger_analytics.trigger_id
    AND bt.user_id = auth.uid()
  )
);

-- RLS Policies for visitor_behavior_profiles
CREATE POLICY "Users can view visitor behavior profiles"
ON visitor_behavior_profiles FOR SELECT
USING (user_id = auth.uid()::text OR auth.uid() IS NULL);

CREATE POLICY "Users can manage their own visitor behavior profiles"
ON visitor_behavior_profiles FOR ALL
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

-- RLS Policies for website_performance_metrics
CREATE POLICY "Users can manage their own website performance metrics"
ON website_performance_metrics FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Function to update trigger analytics
CREATE OR REPLACE FUNCTION update_trigger_analytics(trigger_id UUID, page_url TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO trigger_analytics (trigger_id, date, page_url, triggered_visitors)
  VALUES (trigger_id, CURRENT_DATE, page_url, 1)
  ON CONFLICT (trigger_id, date, page_url)
  DO UPDATE SET triggered_visitors = trigger_analytics.triggered_visitors + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update visitor behavior profile
CREATE OR REPLACE FUNCTION update_visitor_behavior_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO visitor_behavior_profiles (
    visitor_id,
    user_id,
    first_visit,
    last_visit,
    total_sessions,
    total_page_views,
    total_time_spent,
    avg_session_duration
  )
  VALUES (
    NEW.visitor_id,
    NEW.user_id,
    NEW.session_start,
    NEW.session_start,
    1,
    0,
    COALESCE(NEW.total_session_time, 0),
    COALESCE(NEW.total_session_time, 0)
  )
  ON CONFLICT (visitor_id)
  DO UPDATE SET
    last_visit = NEW.session_start,
    total_sessions = visitor_behavior_profiles.total_sessions + 1,
    total_time_spent = visitor_behavior_profiles.total_time_spent + COALESCE(NEW.total_session_time, 0),
    avg_session_duration = (visitor_behavior_profiles.total_time_spent + COALESCE(NEW.total_session_time, 0)) / (visitor_behavior_profiles.total_sessions + 1),
    updated_at = CURRENT_TIMESTAMP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update visitor behavior profile
CREATE TRIGGER update_visitor_behavior_profile_trigger
  AFTER INSERT OR UPDATE OF total_session_time ON visitor_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_visitor_behavior_profile();

-- Function to update website performance metrics
CREATE OR REPLACE FUNCTION update_website_performance_metrics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO website_performance_metrics (
    user_id,
    date,
    page_url,
    page_views,
    avg_time_on_page,
    avg_scroll_depth
  )
  SELECT 
    vs.user_id::UUID,
    CURRENT_DATE,
    NEW.page_url,
    1,
    NEW.time_on_page,
    NEW.scroll_depth
  FROM visitor_sessions vs
  WHERE vs.id = NEW.session_id
  ON CONFLICT (user_id, date, page_url)
  DO UPDATE SET
    page_views = website_performance_metrics.page_views + 1,
    avg_time_on_page = (website_performance_metrics.avg_time_on_page * website_performance_metrics.page_views + NEW.time_on_page) / (website_performance_metrics.page_views + 1),
    avg_scroll_depth = (website_performance_metrics.avg_scroll_depth * website_performance_metrics.page_views + NEW.scroll_depth) / (website_performance_metrics.page_views + 1);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update website performance metrics
CREATE TRIGGER update_website_performance_metrics_trigger
  AFTER INSERT OR UPDATE OF time_on_page, scroll_depth ON page_views
  FOR EACH ROW
  EXECUTE FUNCTION update_website_performance_metrics();

-- Function to get trigger performance metrics
CREATE OR REPLACE FUNCTION get_trigger_performance_metrics(user_uuid UUID, start_date DATE DEFAULT NULL, end_date DATE DEFAULT NULL)
RETURNS TABLE (
  trigger_id UUID,
  trigger_name TEXT,
  total_triggers BIGINT,
  total_conversions BIGINT,
  conversion_rate NUMERIC,
  revenue NUMERIC,
  avg_engagement_time NUMERIC,
  performance_by_page JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bt.id as trigger_id,
    bt.name as trigger_name,
    COUNT(te.id) as total_triggers,
    COUNT(te.id) FILTER (WHERE te.converted = true) as total_conversions,
    CASE 
      WHEN COUNT(te.id) > 0 
      THEN ROUND((COUNT(te.id) FILTER (WHERE te.converted = true)::DECIMAL / COUNT(te.id)) * 100, 2)
      ELSE 0 
    END as conversion_rate,
    COALESCE(SUM(te.conversion_value), 0) as revenue,
    COALESCE(AVG((te.metadata->>'time_on_page')::NUMERIC), 0) as avg_engagement_time,
    COALESCE(
      jsonb_object_agg(
        te.page_url,
        jsonb_build_object(
          'triggers', COUNT(te.id),
          'conversions', COUNT(te.id) FILTER (WHERE te.converted = true),
          'conversion_rate', CASE 
            WHEN COUNT(te.id) > 0 
            THEN ROUND((COUNT(te.id) FILTER (WHERE te.converted = true)::DECIMAL / COUNT(te.id)) * 100, 2)
            ELSE 0 
          END
        )
      ),
      '{}'::jsonb
    ) as performance_by_page
  FROM behavior_triggers bt
  LEFT JOIN trigger_events te ON te.trigger_id = bt.id
  WHERE bt.user_id = user_uuid
    AND (start_date IS NULL OR te.created_at::DATE >= start_date)
    AND (end_date IS NULL OR te.created_at::DATE <= end_date)
  GROUP BY bt.id, bt.name
  ORDER BY total_triggers DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get visitor behavior trends
CREATE OR REPLACE FUNCTION get_visitor_behavior_trends(user_uuid UUID, days INTEGER DEFAULT 30)
RETURNS TABLE (
  date DATE,
  unique_visitors BIGINT,
  page_views BIGINT,
  avg_session_duration NUMERIC,
  bounce_rate NUMERIC,
  conversion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH daily_stats AS (
    SELECT 
      vs.session_start::DATE as date,
      COUNT(DISTINCT vs.visitor_id) as unique_visitors,
      COUNT(pv.id) as page_views,
      AVG(vs.total_session_time) as avg_session_duration,
      COUNT(DISTINCT vs.visitor_id) FILTER (WHERE array_length(vs.page_views, 1) = 1) as bounce_visitors,
      COUNT(DISTINCT te.visitor_id) FILTER (WHERE te.converted = true) as converted_visitors
    FROM visitor_sessions vs
    LEFT JOIN page_views pv ON pv.session_id = vs.id
    LEFT JOIN trigger_events te ON te.visitor_id = vs.visitor_id
    WHERE vs.user_id = user_uuid::text
      AND vs.session_start::DATE >= CURRENT_DATE - INTERVAL '1 day' * days
    GROUP BY vs.session_start::DATE
  )
  SELECT 
    d.date,
    COALESCE(ds.unique_visitors, 0) as unique_visitors,
    COALESCE(ds.page_views, 0) as page_views,
    COALESCE(ds.avg_session_duration, 0) as avg_session_duration,
    CASE 
      WHEN ds.unique_visitors > 0 
      THEN ROUND((ds.bounce_visitors::DECIMAL / ds.unique_visitors) * 100, 2)
      ELSE 0 
    END as bounce_rate,
    CASE 
      WHEN ds.unique_visitors > 0 
      THEN ROUND((ds.converted_visitors::DECIMAL / ds.unique_visitors) * 100, 2)
      ELSE 0 
    END as conversion_rate
  FROM generate_series(
    CURRENT_DATE - INTERVAL '1 day' * days,
    CURRENT_DATE,
    INTERVAL '1 day'
  ) d(date)
  LEFT JOIN daily_stats ds ON ds.date = d.date::DATE
  ORDER BY d.date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top performing pages
CREATE OR REPLACE FUNCTION get_top_performing_pages(user_uuid UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  page_url TEXT,
  page_views BIGINT,
  unique_visitors BIGINT,
  avg_time_on_page NUMERIC,
  avg_scroll_depth NUMERIC,
  bounce_rate NUMERIC,
  conversion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pv.page_url,
    COUNT(pv.id) as page_views,
    COUNT(DISTINCT vs.visitor_id) as unique_visitors,
    AVG(pv.time_on_page) as avg_time_on_page,
    AVG(pv.scroll_depth) as avg_scroll_depth,
    CASE 
      WHEN COUNT(DISTINCT vs.visitor_id) > 0 
      THEN ROUND((COUNT(DISTINCT vs.visitor_id) FILTER (WHERE vs.total_session_time < 10)::DECIMAL / COUNT(DISTINCT vs.visitor_id)) * 100, 2)
      ELSE 0 
    END as bounce_rate,
    CASE 
      WHEN COUNT(DISTINCT vs.visitor_id) > 0 
      THEN ROUND((COUNT(DISTINCT te.visitor_id) FILTER (WHERE te.converted = true)::DECIMAL / COUNT(DISTINCT vs.visitor_id)) * 100, 2)
      ELSE 0 
    END as conversion_rate
  FROM page_views pv
  JOIN visitor_sessions vs ON vs.id = pv.session_id
  LEFT JOIN trigger_events te ON te.visitor_id = vs.visitor_id AND te.page_url = pv.page_url
  WHERE vs.user_id = user_uuid::text
  GROUP BY pv.page_url
  ORDER BY page_views DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default behavior triggers for existing users
INSERT INTO behavior_triggers (user_id, name, description, trigger_type, conditions, actions, targeting)
SELECT 
  u.id,
  'Exit Intent Engagement',
  'Show a popup when users are about to leave to re-engage them',
  'exit_intent',
  '[{"id": "exit_intent", "type": "exit_intent", "operator": "equals", "value": true, "settings": {"sensitivity": "medium", "delay": 1000, "mobile_enabled": false}}]'::jsonb,
  '[{"id": "exit_intent_popup", "type": "show_popup", "config": {"content": {"title": "Wait! Don\'t leave yet", "message": "We\'re here to help! Chat with us before you go.", "button_text": "Start Chat"}, "style": {"position": "center", "animation": "fade", "theme": "branded", "size": "medium"}}, "delay": 0, "priority": 1}]'::jsonb,
  '{"pages": {"include": [], "exclude": []}, "devices": ["desktop", "tablet", "mobile"], "visitor_type": "both"}'::jsonb
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM behavior_triggers bt 
  WHERE bt.user_id = u.id 
  AND bt.name = 'Exit Intent Engagement'
);

COMMENT ON TABLE behavior_triggers IS 'Website behavior triggers configuration';
COMMENT ON TABLE visitor_sessions IS 'Visitor session tracking data';
COMMENT ON TABLE page_views IS 'Individual page view tracking';
COMMENT ON TABLE trigger_events IS 'Triggered behavior events and actions';
COMMENT ON TABLE trigger_analytics IS 'Aggregated trigger performance analytics';
COMMENT ON TABLE visitor_behavior_profiles IS 'Visitor behavior patterns and profiles';
COMMENT ON TABLE website_performance_metrics IS 'Website performance metrics by page';
COMMENT ON FUNCTION get_trigger_performance_metrics IS 'Get trigger performance metrics for a user';
COMMENT ON FUNCTION get_visitor_behavior_trends IS 'Get visitor behavior trends over time';
COMMENT ON FUNCTION get_top_performing_pages IS 'Get top performing pages by various metrics';