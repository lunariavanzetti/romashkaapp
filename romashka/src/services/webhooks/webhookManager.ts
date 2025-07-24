/**
 * Real-time Webhooks System - Core Manager
 * Handles webhook infrastructure, security, and event processing
 */

import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { supabase } from '../supabaseClient';
import { WebhookEventQueue } from './eventQueue';
import { WebSocketManager } from './websocketManager';
import { WorkflowEngine } from '../workflowEngine';

export interface WebhookEvent {
  id: string;
  provider: string;
  event_type: string;
  payload: Record<string, any>;
  signature?: string;
  timestamp: string;
  source_ip?: string;
  user_agent?: string;
  processed: boolean;
  retry_count: number;
  created_at: string;
}

export interface WebhookConfig {
  provider: string;
  endpoint: string;
  secret: string;
  events: string[];
  rate_limit: number;
  timeout_ms: number;
  retry_attempts: number;
  ip_whitelist?: string[];
}

export interface ProcessingResult {
  success: boolean;
  processed_records: number;
  errors: string[];
  duration_ms: number;
  actions_triggered: string[];
}

export class WebhookManager {
  private eventQueue: WebhookEventQueue;
  private wsManager: WebSocketManager;
  private workflowEngine: WorkflowEngine;
  private rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map();

  constructor() {
    this.eventQueue = new WebhookEventQueue();
    this.wsManager = new WebSocketManager();
    this.workflowEngine = new WorkflowEngine();
  }

  /**
   * Validate webhook signature for security
   */
  async validateSignature(
    payload: string,
    signature: string,
    secret: string,
    provider: string
  ): Promise<boolean> {
    try {
      let expectedSignature: string;

      switch (provider.toLowerCase()) {
        case 'hubspot':
          expectedSignature = createHash('sha256')
            .update(secret + payload)
            .digest('hex');
          return timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
          );

        case 'shopify':
          expectedSignature = createHmac('sha256', secret)
            .update(payload, 'utf8')
            .digest('base64');
          return timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
          );

        case 'salesforce':
          // Salesforce uses different signature validation
          const computedSignature = createHmac('sha256', secret)
            .update(payload)
            .digest('hex');
          return signature === computedSignature;

        default:
          // Generic HMAC-SHA256 validation
          expectedSignature = createHmac('sha256', secret)
            .update(payload)
            .digest('hex');
          return timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
          );
      }
    } catch (error) {
      console.error('Signature validation error:', error);
      return false;
    }
  }

  /**
   * Check rate limits for webhook endpoint
   */
  checkRateLimit(provider: string, sourceIp: string, limit: number): boolean {
    const key = `${provider}:${sourceIp}`;
    const now = Date.now();
    const windowMs = 60000; // 1 minute window

    const current = this.rateLimitMap.get(key);
    
    if (!current || now > current.resetTime) {
      this.rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (current.count >= limit) {
      return false;
    }

    current.count++;
    return true;
  }

  /**
   * Validate IP whitelist if configured
   */
  validateIpWhitelist(sourceIp: string, whitelist?: string[]): boolean {
    if (!whitelist || whitelist.length === 0) {
      return true; // No whitelist configured
    }
    return whitelist.includes(sourceIp);
  }

  /**
   * Process incoming webhook event
   */
  async processWebhook(
    provider: string,
    eventType: string,
    payload: Record<string, any>,
    headers: Record<string, string>,
    sourceIp: string
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    const result: ProcessingResult = {
      success: false,
      processed_records: 0,
      errors: [],
      duration_ms: 0,
      actions_triggered: []
    };

    try {
      // Get webhook configuration
      const config = await this.getWebhookConfig(provider);
      if (!config) {
        throw new Error(`No webhook configuration found for provider: ${provider}`);
      }

      // Validate IP whitelist
      if (!this.validateIpWhitelist(sourceIp, config.ip_whitelist)) {
        throw new Error('IP address not in whitelist');
      }

      // Check rate limits
      if (!this.checkRateLimit(provider, sourceIp, config.rate_limit)) {
        throw new Error('Rate limit exceeded');
      }

      // Validate signature
      const signature = headers['x-hub-signature-256'] || headers['x-shopify-hmac-sha256'] || headers['authorization'];
      if (signature && !await this.validateSignature(JSON.stringify(payload), signature, config.secret, provider)) {
        throw new Error('Invalid webhook signature');
      }

      // Create webhook event record
      const webhookEvent = await this.createWebhookEvent(provider, eventType, payload, headers, sourceIp);

      // Queue event for processing
      await this.eventQueue.enqueue({
        id: webhookEvent.id,
        provider,
        event_type: eventType,
        payload,
        priority: this.getEventPriority(eventType),
        timestamp: new Date().toISOString()
      });

      // Process event immediately for high-priority events
      if (this.getEventPriority(eventType) === 'high') {
        const processingResult = await this.processEvent(webhookEvent);
        result.processed_records = processingResult.processed_records;
        result.actions_triggered = processingResult.actions_triggered;
      }

      result.success = true;
      result.duration_ms = Date.now() - startTime;

      // Send real-time update via WebSocket
      await this.wsManager.broadcast('webhook-event', {
        provider,
        event_type: eventType,
        timestamp: new Date().toISOString(),
        success: true
      });

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      result.duration_ms = Date.now() - startTime;

      // Log error
      await this.logWebhookError(provider, eventType, error, payload);
    }

    return result;
  }

  /**
   * Process individual webhook event
   */
  private async processEvent(event: WebhookEvent): Promise<ProcessingResult> {
    const result: ProcessingResult = {
      success: false,
      processed_records: 0,
      errors: [],
      duration_ms: 0,
      actions_triggered: []
    };

    const startTime = Date.now();

    try {
      switch (event.provider.toLowerCase()) {
        case 'hubspot':
          const hubspotResult = await this.processHubSpotEvent(event);
          Object.assign(result, hubspotResult);
          break;

        case 'shopify':
          const shopifyResult = await this.processShopifyEvent(event);
          Object.assign(result, shopifyResult);
          break;

        case 'salesforce':
          const salesforceResult = await this.processSalesforceEvent(event);
          Object.assign(result, salesforceResult);
          break;

        default:
          throw new Error(`Unsupported provider: ${event.provider}`);
      }

      // Mark event as processed
      await this.markEventProcessed(event.id, true);
      result.success = true;

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Processing failed');
      await this.markEventProcessed(event.id, false, error instanceof Error ? error.message : 'Unknown error');
    }

    result.duration_ms = Date.now() - startTime;
    return result;
  }

  /**
   * Process HubSpot webhook events
   */
  private async processHubSpotEvent(event: WebhookEvent): Promise<Partial<ProcessingResult>> {
    const { event_type, payload } = event;
    const result: Partial<ProcessingResult> = {
      processed_records: 0,
      actions_triggered: []
    };

    switch (event_type) {
      case 'contact.propertyChange':
        await this.updateSyncedContact(payload);
        result.processed_records = 1;
        result.actions_triggered?.push('contact_updated');
        break;

      case 'deal.stageChange':
        await this.updateSyncedDeal(payload);
        await this.triggerDealWorkflow(payload);
        result.processed_records = 1;
        result.actions_triggered?.push('deal_updated', 'workflow_triggered');
        break;

      case 'company.creation':
        await this.createSyncedCompany(payload);
        await this.updateAIKnowledge('company', payload);
        result.processed_records = 1;
        result.actions_triggered?.push('company_created', 'ai_knowledge_updated');
        break;

      case 'contact.deletion':
        await this.deleteSyncedContact(payload);
        await this.cleanupAIKnowledge('contact', payload.objectId);
        result.processed_records = 1;
        result.actions_triggered?.push('contact_deleted', 'ai_knowledge_cleaned');
        break;
    }

    return result;
  }

  /**
   * Process Shopify webhook events
   */
  private async processShopifyEvent(event: WebhookEvent): Promise<Partial<ProcessingResult>> {
    const { event_type, payload } = event;
    const result: Partial<ProcessingResult> = {
      processed_records: 0,
      actions_triggered: []
    };

    switch (event_type) {
      case 'orders/create':
        await this.createSyncedOrder(payload);
        await this.triggerNewOrderWorkflow(payload);
        await this.sendAINotification('new_order', payload);
        result.processed_records = 1;
        result.actions_triggered?.push('order_created', 'workflow_triggered', 'ai_notified');
        break;

      case 'orders/updated':
        await this.updateSyncedOrder(payload);
        await this.notifyCustomerViaChat(payload);
        result.processed_records = 1;
        result.actions_triggered?.push('order_updated', 'customer_notified');
        break;

      case 'customers/create':
        await this.createSyncedCustomer(payload);
        await this.syncToHubSpotIfConnected(payload);
        result.processed_records = 1;
        result.actions_triggered?.push('customer_created', 'hubspot_synced');
        break;

      case 'inventory_levels/update':
        await this.updateInventoryLevel(payload);
        await this.updateAIProductKnowledge(payload);
        result.processed_records = 1;
        result.actions_triggered?.push('inventory_updated', 'ai_knowledge_updated');
        break;
    }

    return result;
  }

  /**
   * Process Salesforce webhook events
   */
  private async processSalesforceEvent(event: WebhookEvent): Promise<Partial<ProcessingResult>> {
    const { event_type, payload } = event;
    const result: Partial<ProcessingResult> = {
      processed_records: 0,
      actions_triggered: []
    };

    switch (event_type) {
      case 'OpportunityChangeEvent':
        await this.updateSyncedOpportunity(payload);
        await this.triggerFollowUpWorkflow(payload);
        result.processed_records = 1;
        result.actions_triggered?.push('opportunity_updated', 'followup_triggered');
        break;

      case 'LeadChangeEvent':
        await this.updateSyncedLead(payload);
        await this.updateAIContext('lead', payload);
        result.processed_records = 1;
        result.actions_triggered?.push('lead_updated', 'ai_context_updated');
        break;

      case 'AccountChangeEvent':
        await this.updateSyncedAccount(payload);
        await this.refreshCustomerData(payload);
        result.processed_records = 1;
        result.actions_triggered?.push('account_updated', 'customer_refreshed');
        break;

      case 'TaskCreationEvent':
        await this.createSyncedTask(payload);
        await this.notifyRelevantAgents(payload);
        result.processed_records = 1;
        result.actions_triggered?.push('task_created', 'agents_notified');
        break;
    }

    return result;
  }

  /**
   * Get event priority for queue processing
   */
  private getEventPriority(eventType: string): 'high' | 'medium' | 'low' {
    const highPriorityEvents = [
      'orders/create',
      'deal.stageChange',
      'OpportunityChangeEvent',
      'TaskCreationEvent'
    ];

    const mediumPriorityEvents = [
      'contact.propertyChange',
      'orders/updated',
      'LeadChangeEvent'
    ];

    if (highPriorityEvents.includes(eventType)) return 'high';
    if (mediumPriorityEvents.includes(eventType)) return 'medium';
    return 'low';
  }

  /**
   * Create webhook event record in database
   */
  private async createWebhookEvent(
    provider: string,
    eventType: string,
    payload: Record<string, any>,
    headers: Record<string, string>,
    sourceIp: string
  ): Promise<WebhookEvent> {
    const { data, error } = await supabase!
      .from('webhook_events')
      .insert({
        provider,
        event_type: eventType,
        payload,
        signature: headers['x-hub-signature-256'] || headers['x-shopify-hmac-sha256'],
        timestamp: new Date().toISOString(),
        source_ip: sourceIp,
        user_agent: headers['user-agent'],
        processed: false,
        retry_count: 0
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get webhook configuration for provider
   */
  private async getWebhookConfig(provider: string): Promise<WebhookConfig | null> {
    const { data, error } = await supabase!
      .from('webhook_configs')
      .select('*')
      .eq('provider', provider)
      .eq('active', true)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Mark webhook event as processed
   */
  private async markEventProcessed(eventId: string, success: boolean, error?: string): Promise<void> {
    await supabase!
      .from('webhook_events')
      .update({
        processed: true,
        success,
        error_message: error,
        processed_at: new Date().toISOString()
      })
      .eq('id', eventId);
  }

  /**
   * Log webhook processing error
   */
  private async logWebhookError(
    provider: string,
    eventType: string,
    error: any,
    payload: Record<string, any>
  ): Promise<void> {
    await supabase!
      .from('webhook_errors')
      .insert({
        provider,
        event_type: eventType,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        error_stack: error instanceof Error ? error.stack : null,
        payload,
        created_at: new Date().toISOString()
      });
  }

  // Database update methods (to be implemented based on specific requirements)
  private async updateSyncedContact(payload: any): Promise<void> {
    // Implementation for updating synced contacts
  }

  private async updateSyncedDeal(payload: any): Promise<void> {
    // Implementation for updating synced deals
  }

  private async createSyncedCompany(payload: any): Promise<void> {
    // Implementation for creating synced companies
  }

  private async deleteSyncedContact(payload: any): Promise<void> {
    // Implementation for deleting synced contacts
  }

  private async createSyncedOrder(payload: any): Promise<void> {
    // Implementation for creating synced orders
  }

  private async updateSyncedOrder(payload: any): Promise<void> {
    // Implementation for updating synced orders
  }

  private async createSyncedCustomer(payload: any): Promise<void> {
    // Implementation for creating synced customers
  }

  private async updateInventoryLevel(payload: any): Promise<void> {
    // Implementation for updating inventory levels
  }

  private async updateSyncedOpportunity(payload: any): Promise<void> {
    // Implementation for updating synced opportunities
  }

  private async updateSyncedLead(payload: any): Promise<void> {
    // Implementation for updating synced leads
  }

  private async updateSyncedAccount(payload: any): Promise<void> {
    // Implementation for updating synced accounts
  }

  private async createSyncedTask(payload: any): Promise<void> {
    // Implementation for creating synced tasks
  }

  // Workflow and notification methods
  private async triggerDealWorkflow(payload: any): Promise<void> {
    await this.workflowEngine.trigger('deal_stage_change', payload);
  }

  private async triggerNewOrderWorkflow(payload: any): Promise<void> {
    await this.workflowEngine.trigger('new_order', payload);
  }

  private async triggerFollowUpWorkflow(payload: any): Promise<void> {
    await this.workflowEngine.trigger('opportunity_follow_up', payload);
  }

  private async updateAIKnowledge(type: string, payload: any): Promise<void> {
    // Implementation for updating AI knowledge base
  }

  private async cleanupAIKnowledge(type: string, id: string): Promise<void> {
    // Implementation for cleaning up AI knowledge
  }

  private async sendAINotification(type: string, payload: any): Promise<void> {
    // Implementation for sending AI notifications
  }

  private async notifyCustomerViaChat(payload: any): Promise<void> {
    // Implementation for notifying customers via chat
  }

  private async syncToHubSpotIfConnected(payload: any): Promise<void> {
    // Implementation for syncing to HubSpot if connected
  }

  private async updateAIProductKnowledge(payload: any): Promise<void> {
    // Implementation for updating AI product knowledge
  }

  private async updateAIContext(type: string, payload: any): Promise<void> {
    // Implementation for updating AI context
  }

  private async refreshCustomerData(payload: any): Promise<void> {
    // Implementation for refreshing customer data
  }

  private async notifyRelevantAgents(payload: any): Promise<void> {
    // Implementation for notifying relevant agents
  }
}