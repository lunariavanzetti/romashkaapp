/**
 * Webhook Monitoring Service
 * Handles analytics, alerting, and performance tracking
 */

import { supabase } from '../supabaseClient';
import { WebSocketManager } from './websocketManager';
import cron from 'node-cron';

export interface WebhookMetrics {
  provider: string;
  total_events: number;
  successful_events: number;
  failed_events: number;
  success_rate: number;
  average_processing_time: number;
  events_per_minute: number;
  error_rate: number;
  last_event_at: string;
}

export interface AlertRule {
  id: string;
  name: string;
  provider?: string;
  metric: 'success_rate' | 'error_rate' | 'processing_time' | 'event_volume';
  threshold: number;
  comparison: 'less_than' | 'greater_than' | 'equals';
  time_window_minutes: number;
  enabled: boolean;
  notification_channels: string[];
}

export interface Alert {
  id: string;
  rule_id: string;
  provider: string;
  metric: string;
  current_value: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  acknowledged: boolean;
  created_at: string;
}

export class WebhookMonitoringService {
  private wsManager: WebSocketManager;
  private alertRules: Map<string, AlertRule> = new Map();
  private metricsCache: Map<string, WebhookMetrics> = new Map();
  private readonly CACHE_TTL = 60000; // 1 minute

  constructor() {
    this.wsManager = new WebSocketManager();
    this.initializeMonitoring();
    this.startPeriodicTasks();
  }

  /**
   * Initialize monitoring system
   */
  private async initializeMonitoring(): Promise<void> {
    try {
      // Load alert rules from database
      await this.loadAlertRules();
      
      // Set up real-time subscriptions
      this.setupRealtimeSubscriptions();
      
      console.log('Webhook monitoring service initialized');
    } catch (error) {
      console.error('Error initializing webhook monitoring:', error);
    }
  }

  /**
   * Start periodic monitoring tasks
   */
  private startPeriodicTasks(): void {
    // Update metrics every minute
    cron.schedule('* * * * *', () => {
      this.updateMetrics();
    });

    // Check alerts every 5 minutes
    cron.schedule('*/5 * * * *', () => {
      this.checkAlerts();
    });

    // Generate daily reports at midnight
    cron.schedule('0 0 * * *', () => {
      this.generateDailyReport();
    });

    // Cleanup old data weekly
    cron.schedule('0 0 * * 0', () => {
      this.cleanupOldData();
    });
  }

  /**
   * Load alert rules from database
   */
  private async loadAlertRules(): Promise<void> {
    try {
      const { data: rules, error } = await supabase!
        .from('webhook_alert_rules')
        .select('*')
        .eq('enabled', true);

      if (error) throw error;

      this.alertRules.clear();
      rules?.forEach(rule => {
        this.alertRules.set(rule.id, rule);
      });

      console.log(`Loaded ${rules?.length || 0} alert rules`);
    } catch (error) {
      console.error('Error loading alert rules:', error);
    }
  }

  /**
   * Set up real-time subscriptions for webhook events
   */
  private setupRealtimeSubscriptions(): void {
    // Subscribe to webhook events for real-time monitoring
    supabase!
      .channel('webhook_events')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'webhook_events' },
        (payload) => {
          this.handleNewWebhookEvent(payload.new);
        }
      )
      .subscribe();

    // Subscribe to alert rule changes
    supabase!
      .channel('webhook_alert_rules')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'webhook_alert_rules' },
        () => {
          this.loadAlertRules();
        }
      )
      .subscribe();
  }

  /**
   * Handle new webhook event for real-time monitoring
   */
  private async handleNewWebhookEvent(event: any): Promise<void> {
    try {
      // Update metrics cache
      await this.updateProviderMetrics(event.provider);

      // Check for immediate alerts
      await this.checkImmediateAlerts(event);

      // Broadcast real-time update
      await this.wsManager.broadcast('webhook-metrics-update', {
        provider: event.provider,
        event_type: event.event_type,
        success: event.success,
        timestamp: event.created_at
      });

    } catch (error) {
      console.error('Error handling new webhook event:', error);
    }
  }

  /**
   * Update metrics for all providers
   */
  public async updateMetrics(): Promise<void> {
    try {
      const providers = ['hubspot', 'shopify', 'salesforce'];
      
      await Promise.all(
        providers.map(provider => this.updateProviderMetrics(provider))
      );

    } catch (error) {
      console.error('Error updating metrics:', error);
    }
  }

  /**
   * Update metrics for a specific provider
   */
  private async updateProviderMetrics(provider: string): Promise<WebhookMetrics> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Get events from the last hour
      const { data: events, error } = await supabase!
        .from('webhook_events')
        .select('success, created_at, processed_at')
        .eq('provider', provider)
        .gte('created_at', oneHourAgo.toISOString());

      if (error) throw error;

      const totalEvents = events?.length || 0;
      const successfulEvents = events?.filter(e => e.success).length || 0;
      const failedEvents = totalEvents - successfulEvents;
      const successRate = totalEvents > 0 ? (successfulEvents / totalEvents) * 100 : 0;
      const errorRate = totalEvents > 0 ? (failedEvents / totalEvents) * 100 : 0;

      // Calculate average processing time
      const processedEvents = events?.filter(e => e.processed_at) || [];
      let averageProcessingTime = 0;
      
      if (processedEvents.length > 0) {
        const totalProcessingTime = processedEvents.reduce((sum, event) => {
          const processingTime = new Date(event.processed_at).getTime() - new Date(event.created_at).getTime();
          return sum + processingTime;
        }, 0);
        averageProcessingTime = totalProcessingTime / processedEvents.length;
      }

      // Calculate events per minute
      const eventsPerMinute = totalEvents / 60;

      // Get last event timestamp
      const lastEventAt = events?.[0]?.created_at || new Date().toISOString();

      const metrics: WebhookMetrics = {
        provider,
        total_events: totalEvents,
        successful_events: successfulEvents,
        failed_events: failedEvents,
        success_rate: Math.round(successRate * 100) / 100,
        average_processing_time: Math.round(averageProcessingTime),
        events_per_minute: Math.round(eventsPerMinute * 100) / 100,
        error_rate: Math.round(errorRate * 100) / 100,
        last_event_at: lastEventAt
      };

      // Cache metrics
      this.metricsCache.set(provider, metrics);

      // Store metrics in database for historical tracking
      await this.storeMetrics(metrics);

      return metrics;

    } catch (error) {
      console.error(`Error updating metrics for ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Store metrics in database
   */
  private async storeMetrics(metrics: WebhookMetrics): Promise<void> {
    try {
      await supabase!
        .from('webhook_metrics')
        .insert({
          provider: metrics.provider,
          total_events: metrics.total_events,
          successful_events: metrics.successful_events,
          failed_events: metrics.failed_events,
          success_rate: metrics.success_rate,
          average_processing_time: metrics.average_processing_time,
          events_per_minute: metrics.events_per_minute,
          error_rate: metrics.error_rate,
          last_event_at: metrics.last_event_at,
          recorded_at: new Date().toISOString()
        });

    } catch (error) {
      console.error('Error storing metrics:', error);
    }
  }

  /**
   * Check all alert rules
   */
  private async checkAlerts(): Promise<void> {
    try {
      for (const [ruleId, rule] of this.alertRules) {
        await this.checkAlertRule(rule);
      }
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  }

  /**
   * Check immediate alerts for a specific event
   */
  private async checkImmediateAlerts(event: any): Promise<void> {
    try {
      // Check for high-priority immediate alerts
      const immediateRules = Array.from(this.alertRules.values()).filter(rule => 
        rule.time_window_minutes <= 1 && 
        (!rule.provider || rule.provider === event.provider)
      );

      for (const rule of immediateRules) {
        await this.checkAlertRule(rule);
      }

    } catch (error) {
      console.error('Error checking immediate alerts:', error);
    }
  }

  /**
   * Check a specific alert rule
   */
  private async checkAlertRule(rule: AlertRule): Promise<void> {
    try {
      const timeWindow = new Date(Date.now() - rule.time_window_minutes * 60 * 1000);
      
      // Get metrics for the time window
      const { data: events, error } = await supabase!
        .from('webhook_events')
        .select('success, created_at, processed_at')
        .eq('provider', rule.provider || '')
        .gte('created_at', timeWindow.toISOString());

      if (error) throw error;

      if (!events || events.length === 0) return;

      let currentValue: number;
      
      switch (rule.metric) {
        case 'success_rate':
          const successfulEvents = events.filter(e => e.success).length;
          currentValue = (successfulEvents / events.length) * 100;
          break;
          
        case 'error_rate':
          const failedEvents = events.filter(e => !e.success).length;
          currentValue = (failedEvents / events.length) * 100;
          break;
          
        case 'processing_time':
          const processedEvents = events.filter(e => e.processed_at);
          if (processedEvents.length === 0) return;
          const totalTime = processedEvents.reduce((sum, event) => {
            return sum + (new Date(event.processed_at).getTime() - new Date(event.created_at).getTime());
          }, 0);
          currentValue = totalTime / processedEvents.length;
          break;
          
        case 'event_volume':
          currentValue = events.length;
          break;
          
        default:
          return;
      }

      // Check if alert condition is met
      let alertTriggered = false;
      
      switch (rule.comparison) {
        case 'less_than':
          alertTriggered = currentValue < rule.threshold;
          break;
        case 'greater_than':
          alertTriggered = currentValue > rule.threshold;
          break;
        case 'equals':
          alertTriggered = Math.abs(currentValue - rule.threshold) < 0.01;
          break;
      }

      if (alertTriggered) {
        await this.createAlert(rule, currentValue);
      }

    } catch (error) {
      console.error(`Error checking alert rule ${rule.id}:`, error);
    }
  }

  /**
   * Create an alert
   */
  private async createAlert(rule: AlertRule, currentValue: number): Promise<void> {
    try {
      // Check if similar alert already exists and is not acknowledged
      const { data: existingAlert } = await supabase!
        .from('webhook_alerts')
        .select('id')
        .eq('rule_id', rule.id)
        .eq('acknowledged', false)
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
        .single();

      if (existingAlert) {
        // Don't create duplicate alerts
        return;
      }

      // Determine severity
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
      
      if (rule.metric === 'success_rate' && currentValue < 50) {
        severity = 'critical';
      } else if (rule.metric === 'error_rate' && currentValue > 50) {
        severity = 'critical';
      } else if (rule.metric === 'processing_time' && currentValue > 30000) {
        severity = 'high';
      }

      // Create alert message
      const message = this.generateAlertMessage(rule, currentValue);

      // Insert alert into database
      const { data: alert, error } = await supabase!
        .from('webhook_alerts')
        .insert({
          rule_id: rule.id,
          provider: rule.provider || 'all',
          metric: rule.metric,
          current_value: currentValue,
          threshold: rule.threshold,
          severity,
          message,
          acknowledged: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Send notifications
      await this.sendAlertNotifications(alert, rule);

      // Broadcast alert via WebSocket
      await this.wsManager.broadcast('webhook-alert', {
        alert,
        rule: {
          name: rule.name,
          provider: rule.provider
        }
      });

      console.log(`Alert created: ${message}`);

    } catch (error) {
      console.error('Error creating alert:', error);
    }
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(rule: AlertRule, currentValue: number): string {
    const metricName = rule.metric.replace('_', ' ');
    const providerText = rule.provider ? ` for ${rule.provider}` : '';
    
    return `${rule.name}: ${metricName}${providerText} is ${currentValue.toFixed(2)} (threshold: ${rule.threshold})`;
  }

  /**
   * Send alert notifications
   */
  private async sendAlertNotifications(alert: Alert, rule: AlertRule): Promise<void> {
    try {
      for (const channel of rule.notification_channels) {
        switch (channel) {
          case 'email':
            await this.sendEmailNotification(alert, rule);
            break;
          case 'slack':
            await this.sendSlackNotification(alert, rule);
            break;
          case 'webhook':
            await this.sendWebhookNotification(alert, rule);
            break;
          case 'sms':
            await this.sendSMSNotification(alert, rule);
            break;
        }
      }
    } catch (error) {
      console.error('Error sending alert notifications:', error);
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(alert: Alert, rule: AlertRule): Promise<void> {
    // Implementation would integrate with email service
    console.log(`Email notification sent for alert: ${alert.message}`);
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(alert: Alert, rule: AlertRule): Promise<void> {
    // Implementation would integrate with Slack API
    console.log(`Slack notification sent for alert: ${alert.message}`);
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(alert: Alert, rule: AlertRule): Promise<void> {
    // Implementation would send webhook to external system
    console.log(`Webhook notification sent for alert: ${alert.message}`);
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(alert: Alert, rule: AlertRule): Promise<void> {
    // Implementation would integrate with SMS service
    console.log(`SMS notification sent for alert: ${alert.message}`);
  }

  /**
   * Generate daily report
   */
  private async generateDailyReport(): Promise<void> {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const today = new Date(yesterday);
      today.setDate(today.getDate() + 1);

      // Get daily statistics
      const { data: events, error } = await supabase!
        .from('webhook_events')
        .select('provider, success, created_at')
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', today.toISOString());

      if (error) throw error;

      // Generate report by provider
      const providerStats = new Map();
      
      events?.forEach(event => {
        if (!providerStats.has(event.provider)) {
          providerStats.set(event.provider, { total: 0, successful: 0, failed: 0 });
        }
        
        const stats = providerStats.get(event.provider);
        stats.total++;
        if (event.success) {
          stats.successful++;
        } else {
          stats.failed++;
        }
      });

      // Store daily report
      for (const [provider, stats] of providerStats) {
        await supabase!
          .from('webhook_daily_reports')
          .insert({
            provider,
            report_date: yesterday.toISOString().split('T')[0],
            total_events: stats.total,
            successful_events: stats.successful,
            failed_events: stats.failed,
            success_rate: (stats.successful / stats.total) * 100,
            created_at: new Date().toISOString()
          });
      }

      console.log(`Daily report generated for ${yesterday.toISOString().split('T')[0]}`);

    } catch (error) {
      console.error('Error generating daily report:', error);
    }
  }

  /**
   * Cleanup old data
   */
  private async cleanupOldData(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Cleanup old webhook events (keep only last 30 days)
      await supabase!
        .from('webhook_events')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString());

      // Cleanup old metrics (keep only last 90 days)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      await supabase!
        .from('webhook_metrics')
        .delete()
        .lt('recorded_at', ninetyDaysAgo.toISOString());

      console.log('Old webhook data cleaned up');

    } catch (error) {
      console.error('Error cleaning up old data:', error);
    }
  }

  /**
   * Get current metrics for a provider
   */
  public getMetrics(provider: string): WebhookMetrics | null {
    return this.metricsCache.get(provider) || null;
  }

  /**
   * Get all current metrics
   */
  public getAllMetrics(): Map<string, WebhookMetrics> {
    return new Map(this.metricsCache);
  }

  /**
   * Acknowledge an alert
   */
  public async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    try {
      await supabase!
        .from('webhook_alerts')
        .update({
          acknowledged: true,
          acknowledged_by: userId,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', alertId);

      console.log(`Alert ${alertId} acknowledged by user ${userId}`);

    } catch (error) {
      console.error('Error acknowledging alert:', error);
      throw error;
    }
  }

  /**
   * Create or update alert rule
   */
  public async upsertAlertRule(rule: Omit<AlertRule, 'id'>): Promise<string> {
    try {
      const { data, error } = await supabase!
        .from('webhook_alert_rules')
        .upsert({
          ...rule,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Reload alert rules
      await this.loadAlertRules();

      return data.id;

    } catch (error) {
      console.error('Error upserting alert rule:', error);
      throw error;
    }
  }
}