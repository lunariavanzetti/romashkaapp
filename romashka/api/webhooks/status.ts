/**
 * Webhook Status and Monitoring API
 * Provides health monitoring and statistics for webhook endpoints
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data: { user } } = await supabase.auth.getUser(req.headers.authorization?.replace('Bearer ', ''));
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { provider, time_range = '24h' } = req.query;

    // Get webhook configurations for the user
    let configQuery = supabase
      .from('webhook_configs')
      .select('*')
      .eq('user_id', user.id);

    if (provider) {
      configQuery = configQuery.eq('provider', provider.toLowerCase());
    }

    const { data: webhookConfigs, error: configError } = await configQuery;

    if (configError) {
      throw configError;
    }

    if (!webhookConfigs || webhookConfigs.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No webhook configurations found',
        webhooks: [],
        overall_stats: {
          total_webhooks: 0,
          active_webhooks: 0,
          total_events_processed: 0,
          success_rate: 0,
          average_processing_time: 0
        }
      });
    }

    // Calculate time range for statistics
    const timeRangeMs = parseTimeRange(time_range);
    const startTime = new Date(Date.now() - timeRangeMs).toISOString();

    // Get detailed statistics for each webhook
    const webhookStatuses = await Promise.all(
      webhookConfigs.map(config => getWebhookStatus(config, startTime))
    );

    // Calculate overall statistics
    const overallStats = calculateOverallStats(webhookStatuses);

    // Get recent events summary
    const recentEvents = await getRecentEvents(user.id, provider, 10);

    // Get queue statistics
    const queueStats = await getQueueStatistics();

    res.status(200).json({
      success: true,
      webhooks: webhookStatuses,
      overall_stats: overallStats,
      recent_events: recentEvents,
      queue_stats: queueStats,
      time_range,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Webhook status error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve webhook status',
      message: error.message
    });
  }
};

/**
 * Get detailed status for a single webhook configuration
 */
async function getWebhookStatus(config, startTime) {
  try {
    // Get event statistics
    const { data: eventStats } = await supabase
      .from('webhook_events')
      .select('success, processed, created_at, error_message')
      .eq('provider', config.provider)
      .gte('created_at', startTime);

    // Calculate statistics
    const totalEvents = eventStats?.length || 0;
    const successfulEvents = eventStats?.filter(e => e.success).length || 0;
    const failedEvents = eventStats?.filter(e => !e.success).length || 0;
    const pendingEvents = eventStats?.filter(e => !e.processed).length || 0;

    const successRate = totalEvents > 0 ? (successfulEvents / totalEvents) * 100 : 0;

    // Get latest event
    const { data: latestEvent } = await supabase
      .from('webhook_events')
      .select('*')
      .eq('provider', config.provider)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get error summary
    const { data: recentErrors } = await supabase
      .from('webhook_events')
      .select('error_message, created_at')
      .eq('provider', config.provider)
      .eq('success', false)
      .gte('created_at', startTime)
      .order('created_at', { ascending: false })
      .limit(5);

    // Calculate average processing time
    const { data: processingTimes } = await supabase
      .from('webhook_events')
      .select('created_at, processed_at')
      .eq('provider', config.provider)
      .eq('processed', true)
      .not('processed_at', 'is', null)
      .gte('created_at', startTime);

    let averageProcessingTime = 0;
    if (processingTimes && processingTimes.length > 0) {
      const totalProcessingTime = processingTimes.reduce((sum, event) => {
        const processingTime = new Date(event.processed_at).getTime() - new Date(event.created_at).getTime();
        return sum + processingTime;
      }, 0);
      averageProcessingTime = totalProcessingTime / processingTimes.length;
    }

    // Determine health status
    let healthStatus = 'healthy';
    if (successRate < 90) {
      healthStatus = 'degraded';
    }
    if (successRate < 50 || !config.active) {
      healthStatus = 'unhealthy';
    }

    return {
      id: config.id,
      provider: config.provider,
      events: config.events,
      webhook_url: config.webhook_url,
      active: config.active,
      registration_status: config.registration_status,
      external_webhook_id: config.external_webhook_id,
      health_status: healthStatus,
      statistics: {
        total_events: totalEvents,
        successful_events: successfulEvents,
        failed_events: failedEvents,
        pending_events: pendingEvents,
        success_rate: Math.round(successRate * 100) / 100,
        average_processing_time_ms: Math.round(averageProcessingTime)
      },
      latest_event: latestEvent ? {
        id: latestEvent.id,
        event_type: latestEvent.event_type,
        success: latestEvent.success,
        created_at: latestEvent.created_at,
        error_message: latestEvent.error_message
      } : null,
      recent_errors: recentErrors || [],
      configuration: {
        rate_limit: config.rate_limit,
        timeout_ms: config.timeout_ms,
        retry_attempts: config.retry_attempts,
        ip_whitelist: config.ip_whitelist
      },
      created_at: config.created_at,
      updated_at: config.updated_at
    };

  } catch (error) {
    console.error(`Error getting status for webhook ${config.id}:`, error);
    return {
      id: config.id,
      provider: config.provider,
      health_status: 'error',
      error: error.message
    };
  }
}

/**
 * Calculate overall statistics across all webhooks
 */
function calculateOverallStats(webhookStatuses) {
  const totalWebhooks = webhookStatuses.length;
  const activeWebhooks = webhookStatuses.filter(w => w.active).length;
  const healthyWebhooks = webhookStatuses.filter(w => w.health_status === 'healthy').length;

  const totalEvents = webhookStatuses.reduce((sum, w) => 
    sum + (w.statistics?.total_events || 0), 0);
  const successfulEvents = webhookStatuses.reduce((sum, w) => 
    sum + (w.statistics?.successful_events || 0), 0);
  const failedEvents = webhookStatuses.reduce((sum, w) => 
    sum + (w.statistics?.failed_events || 0), 0);

  const overallSuccessRate = totalEvents > 0 ? (successfulEvents / totalEvents) * 100 : 0;

  const totalProcessingTime = webhookStatuses.reduce((sum, w) => 
    sum + (w.statistics?.average_processing_time_ms || 0), 0);
  const averageProcessingTime = totalWebhooks > 0 ? totalProcessingTime / totalWebhooks : 0;

  return {
    total_webhooks: totalWebhooks,
    active_webhooks: activeWebhooks,
    healthy_webhooks: healthyWebhooks,
    health_percentage: totalWebhooks > 0 ? Math.round((healthyWebhooks / totalWebhooks) * 100) : 0,
    total_events_processed: totalEvents,
    successful_events: successfulEvents,
    failed_events: failedEvents,
    success_rate: Math.round(overallSuccessRate * 100) / 100,
    average_processing_time_ms: Math.round(averageProcessingTime)
  };
}

/**
 * Get recent webhook events
 */
async function getRecentEvents(userId, provider, limit = 10) {
  try {
    let query = supabase
      .from('webhook_events')
      .select(`
        id,
        provider,
        event_type,
        success,
        processed,
        error_message,
        created_at,
        processed_at
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (provider) {
      query = query.eq('provider', provider.toLowerCase());
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];

  } catch (error) {
    console.error('Error getting recent events:', error);
    return [];
  }
}

/**
 * Get queue statistics from Redis (if available)
 */
async function getQueueStatistics() {
  try {
    // This would typically connect to Redis to get queue stats
    // For now, we'll return mock data or get from database
    
    const { data: queueEvents } = await supabase
      .from('webhook_events')
      .select('processed, success')
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()); // Last hour

    const totalInQueue = queueEvents?.filter(e => !e.processed).length || 0;
    const processingCount = 0; // Would get from Redis
    const completedCount = queueEvents?.filter(e => e.processed && e.success).length || 0;
    const failedCount = queueEvents?.filter(e => e.processed && !e.success).length || 0;

    return {
      pending: totalInQueue,
      processing: processingCount,
      completed: completedCount,
      failed: failedCount,
      total: (queueEvents?.length || 0)
    };

  } catch (error) {
    console.error('Error getting queue statistics:', error);
    return {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      total: 0,
      error: 'Unable to retrieve queue statistics'
    };
  }
}

/**
 * Parse time range string to milliseconds
 */
function parseTimeRange(timeRange) {
  const ranges = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '12h': 12 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  };

  return ranges[timeRange] || ranges['24h'];
}