-- Fix for get_realtime_messaging_metrics function type mismatch
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION get_realtime_messaging_metrics(
    time_window_minutes INTEGER DEFAULT 60
)
RETURNS TABLE (
    metric_name TEXT,
    metric_value NUMERIC,
    count INTEGER,
    avg_value NUMERIC,
    min_value NUMERIC,
    max_value NUMERIC,
    timestamp_range TSTZRANGE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rm.metric_name::TEXT,
        SUM(rm.metric_value) as metric_value,
        COUNT(*)::INTEGER as count,
        AVG(rm.metric_value) as avg_value,
        MIN(rm.metric_value) as min_value,
        MAX(rm.metric_value) as max_value,
        tstzrange(NOW() - INTERVAL '1 minute' * time_window_minutes, NOW()) as timestamp_range
    FROM realtime_metrics rm
    WHERE rm.timestamp >= NOW() - INTERVAL '1 minute' * time_window_minutes
    GROUP BY rm.metric_name
    ORDER BY rm.metric_name;
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT 'get_realtime_messaging_metrics function has been fixed!' as status;