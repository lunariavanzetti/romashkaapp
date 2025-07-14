-- Calendar Integration System Database Schema
-- This migration creates tables and functions for calendar integration and consultation booking

-- Calendar configurations table
CREATE TABLE IF NOT EXISTS calendar_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider JSONB NOT NULL DEFAULT '{}',
  calendar_id TEXT NOT NULL,
  calendar_name TEXT NOT NULL,
  default_duration INTEGER DEFAULT 30,
  buffer_time INTEGER DEFAULT 15,
  working_hours JSONB NOT NULL DEFAULT '{}',
  timezone TEXT DEFAULT 'UTC',
  booking_settings JSONB NOT NULL DEFAULT '{}',
  notification_settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, calendar_id)
);

-- Calendar events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  attendees JSONB DEFAULT '[]',
  meeting_link TEXT,
  calendar_id TEXT NOT NULL,
  external_id TEXT,
  event_status TEXT DEFAULT 'confirmed' CHECK (event_status IN ('confirmed', 'tentative', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Consultation bookings table
CREATE TABLE IF NOT EXISTS consultation_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  lead_score_id UUID REFERENCES lead_scores(id) ON DELETE SET NULL,
  event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
  calendar_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  meeting_type TEXT DEFAULT 'consultation' CHECK (meeting_type IN ('consultation', 'demo', 'support', 'sales')),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  meeting_link TEXT,
  customer_details JSONB NOT NULL DEFAULT '{}',
  notes TEXT,
  reminders_sent JSONB DEFAULT '[]',
  booking_source TEXT DEFAULT 'manual' CHECK (booking_source IN ('manual', 'auto_lead_scoring', 'website_widget', 'direct_link')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reminder sequences table
CREATE TABLE IF NOT EXISTS reminder_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES consultation_bookings(id) ON DELETE CASCADE,
  sequence_type TEXT NOT NULL CHECK (sequence_type IN ('confirmation', 'reminder', 'follow_up')),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  content JSONB NOT NULL DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Calendar analytics table
CREATE TABLE IF NOT EXISTS calendar_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_bookings INTEGER DEFAULT 0,
  confirmed_bookings INTEGER DEFAULT 0,
  cancelled_bookings INTEGER DEFAULT 0,
  completed_bookings INTEGER DEFAULT 0,
  no_show_bookings INTEGER DEFAULT 0,
  total_duration_minutes INTEGER DEFAULT 0,
  booking_types JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_configs_user_id ON calendar_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_external_id ON calendar_events(external_id);
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_customer_id ON consultation_bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_scheduled_at ON consultation_bookings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_status ON consultation_bookings(status);
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_lead_score_id ON consultation_bookings(lead_score_id);
CREATE INDEX IF NOT EXISTS idx_reminder_sequences_booking_id ON reminder_sequences(booking_id);
CREATE INDEX IF NOT EXISTS idx_reminder_sequences_scheduled_at ON reminder_sequences(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_reminder_sequences_status ON reminder_sequences(status);
CREATE INDEX IF NOT EXISTS idx_calendar_analytics_user_date ON calendar_analytics(user_id, date);

-- Row Level Security (RLS) policies
ALTER TABLE calendar_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calendar_configs
CREATE POLICY "Users can manage their own calendar configs"
ON calendar_configs FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for calendar_events
CREATE POLICY "Users can manage their own calendar events"
ON calendar_events FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for consultation_bookings
CREATE POLICY "Users can view consultation bookings for their customers"
ON consultation_bookings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM customers 
    WHERE customers.id = consultation_bookings.customer_id 
    AND customers.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert consultation bookings for their customers"
ON consultation_bookings FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM customers 
    WHERE customers.id = consultation_bookings.customer_id 
    AND customers.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update consultation bookings for their customers"
ON consultation_bookings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM customers 
    WHERE customers.id = consultation_bookings.customer_id 
    AND customers.user_id = auth.uid()
  )
);

-- RLS Policies for reminder_sequences
CREATE POLICY "Users can manage reminder sequences for their bookings"
ON reminder_sequences FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM consultation_bookings cb
    JOIN customers c ON c.id = cb.customer_id
    WHERE cb.id = reminder_sequences.booking_id 
    AND c.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM consultation_bookings cb
    JOIN customers c ON c.id = cb.customer_id
    WHERE cb.id = reminder_sequences.booking_id 
    AND c.user_id = auth.uid()
  )
);

-- RLS Policies for calendar_analytics
CREATE POLICY "Users can manage their own calendar analytics"
ON calendar_analytics FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Function to update calendar analytics
CREATE OR REPLACE FUNCTION update_calendar_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update daily analytics when a booking status changes
  INSERT INTO calendar_analytics (
    user_id,
    date,
    total_bookings,
    confirmed_bookings,
    cancelled_bookings,
    completed_bookings,
    no_show_bookings,
    total_duration_minutes,
    booking_types
  )
  SELECT 
    c.user_id,
    NEW.scheduled_at::DATE,
    1,
    CASE WHEN NEW.status = 'confirmed' THEN 1 ELSE 0 END,
    CASE WHEN NEW.status = 'cancelled' THEN 1 ELSE 0 END,
    CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
    CASE WHEN NEW.status = 'no_show' THEN 1 ELSE 0 END,
    CASE WHEN NEW.status IN ('completed', 'no_show') THEN NEW.duration_minutes ELSE 0 END,
    jsonb_build_object(NEW.meeting_type, 1)
  FROM customers c
  WHERE c.id = NEW.customer_id
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    total_bookings = calendar_analytics.total_bookings + 
      CASE WHEN TG_OP = 'INSERT' THEN 1 
           WHEN TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN 0
           ELSE 0 END,
    confirmed_bookings = calendar_analytics.confirmed_bookings + 
      CASE WHEN NEW.status = 'confirmed' THEN 1 
           WHEN OLD.status = 'confirmed' AND NEW.status != 'confirmed' THEN -1
           ELSE 0 END,
    cancelled_bookings = calendar_analytics.cancelled_bookings + 
      CASE WHEN NEW.status = 'cancelled' THEN 1 
           WHEN OLD.status = 'cancelled' AND NEW.status != 'cancelled' THEN -1
           ELSE 0 END,
    completed_bookings = calendar_analytics.completed_bookings + 
      CASE WHEN NEW.status = 'completed' THEN 1 
           WHEN OLD.status = 'completed' AND NEW.status != 'completed' THEN -1
           ELSE 0 END,
    no_show_bookings = calendar_analytics.no_show_bookings + 
      CASE WHEN NEW.status = 'no_show' THEN 1 
           WHEN OLD.status = 'no_show' AND NEW.status != 'no_show' THEN -1
           ELSE 0 END,
    total_duration_minutes = calendar_analytics.total_duration_minutes + 
      CASE WHEN NEW.status IN ('completed', 'no_show') AND OLD.status NOT IN ('completed', 'no_show') THEN NEW.duration_minutes
           WHEN OLD.status IN ('completed', 'no_show') AND NEW.status NOT IN ('completed', 'no_show') THEN -OLD.duration_minutes
           ELSE 0 END,
    booking_types = calendar_analytics.booking_types || 
      jsonb_build_object(
        NEW.meeting_type, 
        COALESCE((calendar_analytics.booking_types->>NEW.meeting_type)::INTEGER, 0) + 1
      );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update analytics on booking changes
CREATE TRIGGER update_calendar_analytics_trigger
  AFTER INSERT OR UPDATE OF status ON consultation_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_analytics();

-- Function to get booking analytics
CREATE OR REPLACE FUNCTION get_booking_analytics(user_uuid UUID, start_date DATE DEFAULT NULL, end_date DATE DEFAULT NULL)
RETURNS TABLE (
  total_bookings BIGINT,
  confirmed_bookings BIGINT,
  cancelled_bookings BIGINT,
  completed_bookings BIGINT,
  no_show_bookings BIGINT,
  completion_rate NUMERIC,
  no_show_rate NUMERIC,
  average_duration NUMERIC,
  booking_types JSONB,
  popular_times JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH booking_stats AS (
    SELECT 
      COUNT(*) as total_bookings,
      COUNT(*) FILTER (WHERE cb.status = 'confirmed') as confirmed_bookings,
      COUNT(*) FILTER (WHERE cb.status = 'cancelled') as cancelled_bookings,
      COUNT(*) FILTER (WHERE cb.status = 'completed') as completed_bookings,
      COUNT(*) FILTER (WHERE cb.status = 'no_show') as no_show_bookings,
      AVG(cb.duration_minutes) FILTER (WHERE cb.status IN ('completed', 'no_show')) as avg_duration,
      jsonb_object_agg(cb.meeting_type, COUNT(*)) as meeting_types,
      jsonb_object_agg(
        EXTRACT(hour FROM cb.scheduled_at)::TEXT, 
        COUNT(*)
      ) as time_distribution
    FROM consultation_bookings cb
    JOIN customers c ON c.id = cb.customer_id
    WHERE c.user_id = user_uuid
      AND (start_date IS NULL OR cb.scheduled_at::DATE >= start_date)
      AND (end_date IS NULL OR cb.scheduled_at::DATE <= end_date)
  )
  SELECT 
    bs.total_bookings,
    bs.confirmed_bookings,
    bs.cancelled_bookings,
    bs.completed_bookings,
    bs.no_show_bookings,
    CASE 
      WHEN (bs.confirmed_bookings + bs.completed_bookings) > 0 
      THEN ROUND((bs.completed_bookings::DECIMAL / (bs.confirmed_bookings + bs.completed_bookings)) * 100, 2)
      ELSE 0 
    END as completion_rate,
    CASE 
      WHEN bs.total_bookings > 0 
      THEN ROUND((bs.no_show_bookings::DECIMAL / bs.total_bookings) * 100, 2)
      ELSE 0 
    END as no_show_rate,
    COALESCE(bs.avg_duration, 0) as average_duration,
    COALESCE(bs.meeting_types, '{}'::jsonb) as booking_types,
    COALESCE(bs.time_distribution, '{}'::jsonb) as popular_times
  FROM booking_stats bs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get booking trends
CREATE OR REPLACE FUNCTION get_booking_trends(user_uuid UUID, days INTEGER DEFAULT 30)
RETURNS TABLE (
  date DATE,
  total_bookings INTEGER,
  confirmed_bookings INTEGER,
  cancelled_bookings INTEGER,
  completed_bookings INTEGER,
  no_show_bookings INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.date::DATE,
    COALESCE(ca.total_bookings, 0) as total_bookings,
    COALESCE(ca.confirmed_bookings, 0) as confirmed_bookings,
    COALESCE(ca.cancelled_bookings, 0) as cancelled_bookings,
    COALESCE(ca.completed_bookings, 0) as completed_bookings,
    COALESCE(ca.no_show_bookings, 0) as no_show_bookings
  FROM generate_series(
    CURRENT_DATE - INTERVAL '1 day' * days,
    CURRENT_DATE,
    INTERVAL '1 day'
  ) d(date)
  LEFT JOIN calendar_analytics ca ON ca.date = d.date::DATE AND ca.user_id = user_uuid
  ORDER BY d.date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process pending reminders
CREATE OR REPLACE FUNCTION process_pending_reminders()
RETURNS TABLE (
  reminder_id UUID,
  booking_id UUID,
  customer_email TEXT,
  sequence_type TEXT,
  content JSONB
) AS $$
BEGIN
  RETURN QUERY
  UPDATE reminder_sequences 
  SET status = 'sent', sent_at = CURRENT_TIMESTAMP
  WHERE status = 'pending' 
    AND scheduled_at <= CURRENT_TIMESTAMP
  RETURNING 
    reminder_sequences.id as reminder_id,
    reminder_sequences.booking_id,
    (SELECT (cb.customer_details->>'email')::TEXT 
     FROM consultation_bookings cb 
     WHERE cb.id = reminder_sequences.booking_id) as customer_email,
    reminder_sequences.sequence_type,
    reminder_sequences.content;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default calendar configurations for existing users (if they have integration credentials)
INSERT INTO calendar_configs (user_id, provider, calendar_id, calendar_name, working_hours, booking_settings, notification_settings)
SELECT 
  ic.user_id,
  jsonb_build_object(
    'id', 'google',
    'name', 'Google Calendar',
    'type', 'google',
    'enabled', true,
    'config', '{}'::jsonb
  ) as provider,
  'primary' as calendar_id,
  'Primary Calendar' as calendar_name,
  jsonb_build_object(
    'monday', jsonb_build_object('enabled', true, 'start', '09:00', 'end', '17:00'),
    'tuesday', jsonb_build_object('enabled', true, 'start', '09:00', 'end', '17:00'),
    'wednesday', jsonb_build_object('enabled', true, 'start', '09:00', 'end', '17:00'),
    'thursday', jsonb_build_object('enabled', true, 'start', '09:00', 'end', '17:00'),
    'friday', jsonb_build_object('enabled', true, 'start', '09:00', 'end', '17:00'),
    'saturday', jsonb_build_object('enabled', false, 'start', '09:00', 'end', '17:00'),
    'sunday', jsonb_build_object('enabled', false, 'start', '09:00', 'end', '17:00')
  ) as working_hours,
  jsonb_build_object(
    'advance_notice_hours', 2,
    'max_days_ahead', 30,
    'allow_weekends', false,
    'confirmation_required', false,
    'auto_create_meeting_links', true
  ) as booking_settings,
  jsonb_build_object(
    'send_confirmations', true,
    'send_reminders', true,
    'reminder_times', '[24, 2]'::jsonb,
    'custom_email_templates', '{}'::jsonb
  ) as notification_settings
FROM integration_credentials ic
WHERE ic.provider = 'google_calendar'
  AND ic.user_id NOT IN (SELECT user_id FROM calendar_configs WHERE provider->>'type' = 'google')
ON CONFLICT (user_id, calendar_id) DO NOTHING;

COMMENT ON TABLE calendar_configs IS 'Calendar configuration settings for each user';
COMMENT ON TABLE calendar_events IS 'Calendar events synchronized from external providers';
COMMENT ON TABLE consultation_bookings IS 'Consultation bookings with customers';
COMMENT ON TABLE reminder_sequences IS 'Automated reminder and follow-up sequences';
COMMENT ON TABLE calendar_analytics IS 'Daily aggregated booking and calendar analytics';
COMMENT ON FUNCTION get_booking_analytics IS 'Get booking analytics for a user within date range';
COMMENT ON FUNCTION get_booking_trends IS 'Get daily booking trends for the last N days';
COMMENT ON FUNCTION process_pending_reminders IS 'Process and mark pending reminders as sent';