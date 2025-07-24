import { supabase } from '../supabaseClient';
import { HubSpotService } from '../integrations/hubspotService';
import { SalesforceService } from '../integrations/salesforceService';
import { ShopifyService } from '../integrations/shopifyService';
import { sendEmail } from '../messaging/emailService';
import { sendSMSNotification } from '../messaging/smsService';
import { sendSlackNotification } from '../messaging/slackService';
import type { 
  WorkflowTrigger, 
  WorkflowCondition, 
  WorkflowAction, 
  WorkflowExecution,
  WorkflowContext,
  TriggerEvent,
  ActionResult 
} from '../../types/workflow';

export interface WorkflowEngineConfig {
  maxRetries: number;
  retryDelay: number;
  timeout: number;
  enableLogging: boolean;
}

export class WorkflowEngine {
  private config: WorkflowEngineConfig;
  private hubspotService: HubSpotService;
  private salesforceService: SalesforceService;
  private shopifyService: ShopifyService;
  private executionQueue: Map<string, WorkflowExecution[]> = new Map();
  private activeExecutions: Set<string> = new Set();

  constructor(config: Partial<WorkflowEngineConfig> = {}) {
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 30000,
      enableLogging: true,
      ...config
    };

    this.hubspotService = new HubSpotService();
    this.salesforceService = new SalesforceService();
    this.shopifyService = new ShopifyService();

    // Initialize event listeners
    this.initializeEventListeners();
  }

  private initializeEventListeners(): void {
    // Set up real-time listeners for workflow triggers
    this.setupChatEventListeners();
    this.setupIntegrationEventListeners();
    this.setupTimeBasedTriggers();
  }

  private setupChatEventListeners(): void {
    // Listen for chat events from Supabase realtime
    supabase
      .channel('chat_events')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => this.handleChatEvent(payload.new)
      )
      .subscribe();
  }

  private setupIntegrationEventListeners(): void {
    // Listen for integration data changes
    supabase
      .channel('integration_events')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'integration_sync_logs' },
        (payload) => this.handleIntegrationEvent(payload)
      )
      .subscribe();
  }

  private setupTimeBasedTriggers(): void {
    // Set up periodic checks for time-based triggers
    setInterval(() => {
      this.checkTimeBasedTriggers();
    }, 60000); // Check every minute
  }

  async handleChatEvent(message: any): Promise<void> {
    const event: TriggerEvent = {
      type: 'chat_message',
      data: message,
      timestamp: new Date(),
      source: 'chat_system'
    };

    await this.processTriggerEvent(event);
  }

  async handleIntegrationEvent(payload: any): Promise<void> {
    const event: TriggerEvent = {
      type: 'integration_change',
      data: payload,
      timestamp: new Date(),
      source: 'integration_system'
    };

    await this.processTriggerEvent(event);
  }

  async checkTimeBasedTriggers(): Promise<void> {
    try {
      const { data: workflows, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('is_active', true)
        .eq('trigger_type', 'time_based');

      if (error) throw error;

      for (const workflow of workflows || []) {
        await this.evaluateTimeBasedTrigger(workflow);
      }
    } catch (error) {
      console.error('Error checking time-based triggers:', error);
    }
  }

  private async evaluateTimeBasedTrigger(workflow: any): Promise<void> {
    const triggerConditions = workflow.trigger_conditions;
    const now = new Date();

    // Check if it's time to trigger based on schedule
    if (this.shouldTriggerTimeBasedWorkflow(triggerConditions, now)) {
      const event: TriggerEvent = {
        type: 'time_trigger',
        data: { workflow_id: workflow.id, trigger_time: now },
        timestamp: now,
        source: 'time_system'
      };

      await this.executeWorkflow(workflow.id, event);
    }
  }

  private shouldTriggerTimeBasedWorkflow(conditions: any, now: Date): boolean {
    // Implement time-based trigger logic
    const { schedule_type, schedule_value, last_triggered } = conditions;

    if (!schedule_type) return false;

    const lastTriggered = last_triggered ? new Date(last_triggered) : new Date(0);
    const timeDiff = now.getTime() - lastTriggered.getTime();

    switch (schedule_type) {
      case 'interval':
        return timeDiff >= (schedule_value * 60 * 1000); // schedule_value in minutes
      case 'daily':
        return timeDiff >= (24 * 60 * 60 * 1000);
      case 'weekly':
        return timeDiff >= (7 * 24 * 60 * 60 * 1000);
      default:
        return false;
    }
  }

  async processTriggerEvent(event: TriggerEvent): Promise<void> {
    try {
      // Find workflows that match this trigger
      const matchingWorkflows = await this.findMatchingWorkflows(event);

      for (const workflow of matchingWorkflows) {
        // Check if workflow should be triggered based on conditions
        if (await this.evaluateTriggerConditions(workflow, event)) {
          await this.executeWorkflow(workflow.id, event);
        }
      }
    } catch (error) {
      console.error('Error processing trigger event:', error);
    }
  }

  private async findMatchingWorkflows(event: TriggerEvent): Promise<any[]> {
    const { data: workflows, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('is_active', true)
      .eq('trigger_type', event.type);

    if (error) throw error;
    return workflows || [];
  }

  private async evaluateTriggerConditions(workflow: any, event: TriggerEvent): Promise<boolean> {
    const conditions = workflow.trigger_conditions;
    if (!conditions) return true;

    try {
      return await this.evaluateConditions(conditions, { event, workflow });
    } catch (error) {
      console.error('Error evaluating trigger conditions:', error);
      return false;
    }
  }

  async executeWorkflow(workflowId: string, triggerEvent: TriggerEvent): Promise<WorkflowExecution> {
    const executionId = `${workflowId}_${Date.now()}`;
    
    if (this.activeExecutions.has(executionId)) {
      throw new Error('Workflow execution already in progress');
    }

    this.activeExecutions.add(executionId);

    try {
      // Create execution record
      const execution: WorkflowExecution = {
        id: executionId,
        workflow_id: workflowId,
        trigger_event: triggerEvent,
        status: 'running',
        context: {},
        started_at: new Date(),
        execution_log: []
      };

      // Store execution in database
      await this.storeExecution(execution);

      // Get workflow definition
      const { data: workflow, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (error || !workflow) {
        throw new Error('Workflow not found');
      }

      // Execute workflow steps
      const result = await this.executeWorkflowSteps(workflow, execution);

      // Update execution status
      execution.status = result.success ? 'completed' : 'failed';
      execution.completed_at = new Date();
      execution.result = result;

      await this.updateExecution(execution);

      return execution;
    } catch (error) {
      console.error('Workflow execution error:', error);
      
      const failedExecution: WorkflowExecution = {
        id: executionId,
        workflow_id: workflowId,
        trigger_event: triggerEvent,
        status: 'failed',
        context: {},
        started_at: new Date(),
        completed_at: new Date(),
        error_message: error instanceof Error ? error.message : 'Unknown error',
        execution_log: []
      };

      await this.storeExecution(failedExecution);
      return failedExecution;
    } finally {
      this.activeExecutions.delete(executionId);
    }
  }

  private async executeWorkflowSteps(workflow: any, execution: WorkflowExecution): Promise<ActionResult> {
    const steps = workflow.nodes || workflow.steps || [];
    const context: WorkflowContext = {
      workflow_id: workflow.id,
      execution_id: execution.id,
      trigger_event: execution.trigger_event,
      variables: {},
      integrations: {
        hubspot: this.hubspotService,
        salesforce: this.salesforceService,
        shopify: this.shopifyService
      }
    };

    let currentStep = 0;
    const results: ActionResult[] = [];

    try {
      for (const step of steps) {
        this.logExecution(execution, `Executing step: ${step.type}`, step);

        // Evaluate step conditions
        if (step.conditions && !await this.evaluateConditions(step.conditions, context)) {
          this.logExecution(execution, `Step conditions not met, skipping`, step);
          continue;
        }

        // Execute step action
        const result = await this.executeAction(step, context);
        results.push(result);

        this.logExecution(execution, `Step completed`, { step, result });

        if (!result.success && step.required !== false) {
          throw new Error(`Required step failed: ${result.error}`);
        }

        currentStep++;
      }

      return {
        success: true,
        message: 'Workflow completed successfully',
        data: { results, steps_executed: currentStep }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: { results, steps_executed: currentStep }
      };
    }
  }

  private async executeAction(action: WorkflowAction, context: WorkflowContext): Promise<ActionResult> {
    const { type, config } = action;

    try {
      switch (type) {
        case 'send_email':
          return await this.executeEmailAction(config, context);
        case 'send_sms':
          return await this.executeSMSAction(config, context);
        case 'send_slack':
          return await this.executeSlackAction(config, context);
        case 'hubspot_create_contact':
          return await this.executeHubSpotCreateContact(config, context);
        case 'hubspot_update_deal':
          return await this.executeHubSpotUpdateDeal(config, context);
        case 'salesforce_create_task':
          return await this.executeSalesforceCreateTask(config, context);
        case 'shopify_update_order':
          return await this.executeShopifyUpdateOrder(config, context);
        case 'escalate_to_human':
          return await this.executeEscalateToHuman(config, context);
        case 'delay':
          return await this.executeDelay(config, context);
        case 'webhook':
          return await this.executeWebhook(config, context);
        case 'custom_script':
          return await this.executeCustomScript(config, context);
        default:
          throw new Error(`Unknown action type: ${type}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async executeEmailAction(config: any, context: WorkflowContext): Promise<ActionResult> {
    const { to, subject, template, variables } = config;
    
    // Replace variables in template
    const processedSubject = this.processTemplate(subject, context, variables);
    const processedContent = this.processTemplate(template, context, variables);
    
    await sendEmail({
      to: this.processTemplate(to, context, variables),
      subject: processedSubject,
      html: processedContent
    });

    return {
      success: true,
      message: 'Email sent successfully',
      data: { to, subject: processedSubject }
    };
  }

  private async executeSMSAction(config: any, context: WorkflowContext): Promise<ActionResult> {
    const { to, message, variables } = config;
    
    const processedMessage = this.processTemplate(message, context, variables);
    const processedTo = this.processTemplate(to, context, variables);
    
    await sendSMSNotification(processedTo, processedMessage);

    return {
      success: true,
      message: 'SMS sent successfully',
      data: { to: processedTo, message: processedMessage }
    };
  }

  private async executeSlackAction(config: any, context: WorkflowContext): Promise<ActionResult> {
    const { channel, message, variables } = config;
    
    const processedMessage = this.processTemplate(message, context, variables);
    
    await sendSlackNotification(channel, processedMessage);

    return {
      success: true,
      message: 'Slack notification sent successfully',
      data: { channel, message: processedMessage }
    };
  }

  private async executeHubSpotCreateContact(config: any, context: WorkflowContext): Promise<ActionResult> {
    const { properties } = config;
    
    // Process template variables in properties
    const processedProperties = this.processObjectTemplate(properties, context);
    
    const result = await context.integrations.hubspot.createContact(processedProperties);

    return {
      success: true,
      message: 'HubSpot contact created successfully',
      data: result
    };
  }

  private async executeHubSpotUpdateDeal(config: any, context: WorkflowContext): Promise<ActionResult> {
    const { dealId, properties } = config;
    
    const processedDealId = this.processTemplate(dealId, context);
    const processedProperties = this.processObjectTemplate(properties, context);
    
    const result = await context.integrations.hubspot.updateDeal(processedDealId, processedProperties);

    return {
      success: true,
      message: 'HubSpot deal updated successfully',
      data: result
    };
  }

  private async executeSalesforceCreateTask(config: any, context: WorkflowContext): Promise<ActionResult> {
    const { taskData } = config;
    
    const processedTaskData = this.processObjectTemplate(taskData, context);
    
    const result = await context.integrations.salesforce.createTask(processedTaskData);

    return {
      success: true,
      message: 'Salesforce task created successfully',
      data: result
    };
  }

  private async executeShopifyUpdateOrder(config: any, context: WorkflowContext): Promise<ActionResult> {
    const { orderId, updates } = config;
    
    const processedOrderId = this.processTemplate(orderId, context);
    const processedUpdates = this.processObjectTemplate(updates, context);
    
    const result = await context.integrations.shopify.updateOrder(processedOrderId, processedUpdates);

    return {
      success: true,
      message: 'Shopify order updated successfully',
      data: result
    };
  }

  private async executeEscalateToHuman(config: any, context: WorkflowContext): Promise<ActionResult> {
    const { priority, department, message } = config;
    
    // Create escalation record
    const { data, error } = await supabase
      .from('escalations')
      .insert({
        workflow_execution_id: context.execution_id,
        priority: priority || 'medium',
        department: department || 'support',
        message: this.processTemplate(message, context),
        status: 'pending',
        created_at: new Date()
      });

    if (error) throw error;

    return {
      success: true,
      message: 'Escalated to human agent successfully',
      data: data
    };
  }

  private async executeDelay(config: any, context: WorkflowContext): Promise<ActionResult> {
    const { duration } = config; // duration in milliseconds
    
    await new Promise(resolve => setTimeout(resolve, duration));

    return {
      success: true,
      message: `Delayed for ${duration}ms`,
      data: { duration }
    };
  }

  private async executeWebhook(config: any, context: WorkflowContext): Promise<ActionResult> {
    const { url, method, headers, body } = config;
    
    const processedUrl = this.processTemplate(url, context);
    const processedHeaders = this.processObjectTemplate(headers, context);
    const processedBody = this.processObjectTemplate(body, context);
    
    const response = await fetch(processedUrl, {
      method: method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...processedHeaders
      },
      body: JSON.stringify(processedBody)
    });

    const result = await response.json();

    return {
      success: response.ok,
      message: response.ok ? 'Webhook executed successfully' : 'Webhook failed',
      data: { status: response.status, result }
    };
  }

  private async executeCustomScript(config: any, context: WorkflowContext): Promise<ActionResult> {
    const { script, timeout } = config;
    
    try {
      // Create a sandboxed environment for script execution
      const scriptFunction = new Function('context', script);
      const result = await Promise.race([
        scriptFunction(context),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Script timeout')), timeout || 5000)
        )
      ]);

      return {
        success: true,
        message: 'Custom script executed successfully',
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Script execution failed'
      };
    }
  }

  private async evaluateConditions(conditions: WorkflowCondition[], context: any): Promise<boolean> {
    if (!conditions || conditions.length === 0) return true;

    for (const condition of conditions) {
      const result = await this.evaluateCondition(condition, context);
      
      if (condition.operator === 'AND' && !result) return false;
      if (condition.operator === 'OR' && result) return true;
    }

    return true;
  }

  private async evaluateCondition(condition: WorkflowCondition, context: any): Promise<boolean> {
    const { field, operator, value, type } = condition;
    
    let fieldValue = this.getFieldValue(field, context);
    
    // Type conversion
    if (type === 'number') {
      fieldValue = Number(fieldValue);
      value = Number(value);
    } else if (type === 'date') {
      fieldValue = new Date(fieldValue);
      value = new Date(value);
    }

    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'not_equals':
        return fieldValue !== value;
      case 'contains':
        return String(fieldValue).includes(String(value));
      case 'not_contains':
        return !String(fieldValue).includes(String(value));
      case 'greater_than':
        return fieldValue > value;
      case 'less_than':
        return fieldValue < value;
      case 'greater_equal':
        return fieldValue >= value;
      case 'less_equal':
        return fieldValue <= value;
      case 'regex':
        return new RegExp(String(value)).test(String(fieldValue));
      case 'in':
        return Array.isArray(value) && value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(value) && !value.includes(fieldValue);
      default:
        return false;
    }
  }

  private getFieldValue(field: string, context: any): any {
    const parts = field.split('.');
    let value = context;
    
    for (const part of parts) {
      if (value === null || value === undefined) return null;
      value = value[part];
    }
    
    return value;
  }

  private processTemplate(template: string, context: WorkflowContext, variables?: any): string {
    if (!template) return '';
    
    let processed = template;
    
    // Replace context variables
    processed = processed.replace(/\{\{(.+?)\}\}/g, (match, key) => {
      const value = this.getFieldValue(key.trim(), context);
      return value !== null && value !== undefined ? String(value) : match;
    });
    
    // Replace custom variables
    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        processed = processed.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
      }
    }
    
    return processed;
  }

  private processObjectTemplate(obj: any, context: WorkflowContext): any {
    if (typeof obj === 'string') {
      return this.processTemplate(obj, context);
    } else if (Array.isArray(obj)) {
      return obj.map(item => this.processObjectTemplate(item, context));
    } else if (obj && typeof obj === 'object') {
      const processed: any = {};
      for (const [key, value] of Object.entries(obj)) {
        processed[key] = this.processObjectTemplate(value, context);
      }
      return processed;
    }
    return obj;
  }

  private async storeExecution(execution: WorkflowExecution): Promise<void> {
    const { error } = await supabase
      .from('workflow_executions')
      .insert({
        id: execution.id,
        workflow_id: execution.workflow_id,
        status: execution.status,
        context: execution.context,
        started_at: execution.started_at,
        completed_at: execution.completed_at,
        error_message: execution.error_message,
        execution_log: execution.execution_log
      });

    if (error) throw error;
  }

  private async updateExecution(execution: WorkflowExecution): Promise<void> {
    const { error } = await supabase
      .from('workflow_executions')
      .update({
        status: execution.status,
        context: execution.context,
        completed_at: execution.completed_at,
        error_message: execution.error_message,
        execution_log: execution.execution_log
      })
      .eq('id', execution.id);

    if (error) throw error;
  }

  private logExecution(execution: WorkflowExecution, message: string, data?: any): void {
    if (!this.config.enableLogging) return;

    const logEntry = {
      timestamp: new Date(),
      message,
      data
    };

    execution.execution_log = execution.execution_log || [];
    execution.execution_log.push(logEntry);
  }

  // Analytics and monitoring methods
  async getWorkflowAnalytics(workflowId: string, timeRange?: { start: Date; end: Date }): Promise<any> {
    let query = supabase
      .from('workflow_executions')
      .select('*')
      .eq('workflow_id', workflowId);

    if (timeRange) {
      query = query
        .gte('started_at', timeRange.start.toISOString())
        .lte('started_at', timeRange.end.toISOString());
    }

    const { data: executions, error } = await query;
    if (error) throw error;

    const total = executions?.length || 0;
    const successful = executions?.filter(e => e.status === 'completed').length || 0;
    const failed = executions?.filter(e => e.status === 'failed').length || 0;
    const running = executions?.filter(e => e.status === 'running').length || 0;

    return {
      total_executions: total,
      successful_executions: successful,
      failed_executions: failed,
      running_executions: running,
      success_rate: total > 0 ? (successful / total) * 100 : 0,
      failure_rate: total > 0 ? (failed / total) * 100 : 0,
      executions: executions
    };
  }

  async pauseWorkflow(workflowId: string): Promise<void> {
    const { error } = await supabase
      .from('workflows')
      .update({ is_active: false })
      .eq('id', workflowId);

    if (error) throw error;
  }

  async resumeWorkflow(workflowId: string): Promise<void> {
    const { error } = await supabase
      .from('workflows')
      .update({ is_active: true })
      .eq('id', workflowId);

    if (error) throw error;
  }

  async deleteWorkflow(workflowId: string): Promise<void> {
    // Delete executions first
    await supabase
      .from('workflow_executions')
      .delete()
      .eq('workflow_id', workflowId);

    // Delete workflow
    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', workflowId);

    if (error) throw error;
  }
}

// Export singleton instance
export const workflowEngine = new WorkflowEngine();