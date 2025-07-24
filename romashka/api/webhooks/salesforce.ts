/**
 * Salesforce Webhook Handler
 * Handles real-time updates from Salesforce CRM via Platform Events
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Rate limiting map
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 150; // Max requests per window

module.exports = async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  const sourceIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  try {
    // Rate limiting
    if (!checkRateLimit(sourceIp)) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    // Validate Salesforce webhook
    const authHeader = req.headers['authorization'];
    const eventType = req.headers['x-salesforce-event-type'];
    const orgId = req.headers['x-salesforce-org-id'];
    
    if (!authHeader || !eventType || !orgId) {
      return res.status(400).json({ error: 'Missing required Salesforce headers' });
    }

    // Verify webhook signature/auth
    if (!verifySalesforceAuth(authHeader, req.body)) {
      return res.status(401).json({ error: 'Invalid authorization' });
    }

    // Process webhook based on event type
    const result = await processSalesforceWebhook(eventType, req.body, orgId, sourceIp);

    // Log webhook reception
    await logWebhookEvent('salesforce', eventType, req.body, sourceIp, true);

    // Send success response
    res.status(200).json({
      success: true,
      event_type: eventType,
      org_id: orgId,
      processed_records: result.processed_records,
      actions_triggered: result.actions_triggered,
      duration_ms: Date.now() - startTime
    });

  } catch (error) {
    console.error('Salesforce webhook error:', error);
    
    // Log error
    await logWebhookEvent('salesforce', req.headers['x-salesforce-event-type'], req.body, sourceIp, false, error.message);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      duration_ms: Date.now() - startTime
    });
  }
};

/**
 * Verify Salesforce webhook authorization
 */
function verifySalesforceAuth(authHeader, body) {
  try {
    const webhookSecret = process.env.SALESFORCE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('Salesforce webhook secret not configured');
      return false;
    }

    // Extract token from Authorization header
    const token = authHeader.replace('Bearer ', '');
    
    // For production, implement proper JWT verification
    // For now, simple token comparison
    return token === webhookSecret;
  } catch (error) {
    console.error('Error verifying Salesforce auth:', error);
    return false;
  }
}

/**
 * Check rate limit for IP address
 */
function checkRateLimit(ip) {
  const now = Date.now();
  const key = `salesforce:${ip}`;
  
  const current = rateLimitMap.get(key);
  
  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  current.count++;
  return true;
}

/**
 * Process Salesforce webhook based on event type
 */
async function processSalesforceWebhook(eventType, payload, orgId, sourceIp) {
  console.log(`Processing Salesforce webhook: ${eventType} from org ${orgId}`);

  const result = {
    processed_records: 0,
    actions_triggered: []
  };

  try {
    // Handle different Salesforce Platform Events
    switch (eventType) {
      case 'OpportunityChangeEvent':
        await handleOpportunityChange(payload, orgId);
        await triggerOpportunityWorkflow(payload, orgId);
        result.processed_records = payload.length || 1;
        result.actions_triggered.push('opportunity_updated', 'workflow_triggered');
        break;

      case 'LeadChangeEvent':
        await handleLeadChange(payload, orgId);
        await updateAILeadContext(payload);
        result.processed_records = payload.length || 1;
        result.actions_triggered.push('lead_updated', 'ai_context_updated');
        break;

      case 'AccountChangeEvent':
        await handleAccountChange(payload, orgId);
        await refreshCustomerData(payload, orgId);
        result.processed_records = payload.length || 1;
        result.actions_triggered.push('account_updated', 'customer_refreshed');
        break;

      case 'ContactChangeEvent':
        await handleContactChange(payload, orgId);
        await syncContactToHubSpot(payload, orgId);
        result.processed_records = payload.length || 1;
        result.actions_triggered.push('contact_updated', 'hubspot_synced');
        break;

      case 'TaskChangeEvent':
        await handleTaskChange(payload, orgId);
        await notifyRelevantAgents(payload, orgId);
        result.processed_records = payload.length || 1;
        result.actions_triggered.push('task_updated', 'agents_notified');
        break;

      case 'CaseChangeEvent':
        await handleCaseChange(payload, orgId);
        await triggerSupportWorkflow(payload, orgId);
        result.processed_records = payload.length || 1;
        result.actions_triggered.push('case_updated', 'support_workflow_triggered');
        break;

      case 'CustomObjectChangeEvent':
        await handleCustomObjectChange(payload, orgId);
        result.processed_records = payload.length || 1;
        result.actions_triggered.push('custom_object_updated');
        break;

      default:
        console.log(`Unhandled Salesforce event type: ${eventType}`);
        result.actions_triggered.push('event_logged');
    }

    // Broadcast real-time update
    await broadcastWebhookEvent('salesforce', eventType, {
      org_id: orgId,
      event_type: eventType,
      payload: sanitizePayloadForBroadcast(payload),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`Error processing Salesforce webhook ${eventType}:`, error);
    throw error;
  }

  return result;
}

/**
 * Handle Opportunity change events
 */
async function handleOpportunityChange(events, orgId) {
  const eventArray = Array.isArray(events) ? events : [events];
  
  for (const event of eventArray) {
    const { header, data } = event;
    
    if (header.changeType === 'CREATE' || header.changeType === 'UPDATE') {
      const opportunityData = {
        external_id: data.Id || header.recordId,
        provider: 'salesforce',
        org_id: orgId,
        name: data.Name,
        account_id: data.AccountId,
        amount: data.Amount ? parseFloat(data.Amount) : null,
        stage_name: data.StageName,
        probability: data.Probability,
        close_date: data.CloseDate,
        lead_source: data.LeadSource,
        owner_id: data.OwnerId,
        created_date: data.CreatedDate,
        last_modified_date: data.LastModifiedDate,
        last_synced_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('synced_opportunities')
        .upsert(opportunityData, {
          onConflict: 'external_id,provider'
        });

      if (error) {
        console.error('Error syncing opportunity:', error);
        throw error;
      }

      // Log stage changes for workflow triggers
      if (data.StageName) {
        await logOpportunityStageChange(data.Id || header.recordId, data.StageName, orgId);
      }
    } else if (header.changeType === 'DELETE') {
      await supabase
        .from('synced_opportunities')
        .update({
          deleted_at: new Date().toISOString(),
          last_synced_at: new Date().toISOString()
        })
        .eq('external_id', header.recordId)
        .eq('provider', 'salesforce');
    }
  }
}

/**
 * Handle Lead change events
 */
async function handleLeadChange(events, orgId) {
  const eventArray = Array.isArray(events) ? events : [events];
  
  for (const event of eventArray) {
    const { header, data } = event;
    
    if (header.changeType === 'CREATE' || header.changeType === 'UPDATE') {
      const leadData = {
        external_id: data.Id || header.recordId,
        provider: 'salesforce',
        org_id: orgId,
        first_name: data.FirstName,
        last_name: data.LastName,
        email: data.Email,
        phone: data.Phone,
        company: data.Company,
        title: data.Title,
        status: data.Status,
        lead_source: data.LeadSource,
        rating: data.Rating,
        owner_id: data.OwnerId,
        created_date: data.CreatedDate,
        last_modified_date: data.LastModifiedDate,
        last_synced_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('synced_leads')
        .upsert(leadData, {
          onConflict: 'external_id,provider'
        });

      if (error) {
        console.error('Error syncing lead:', error);
        throw error;
      }

      // Track lead status changes
      if (data.Status) {
        await logLeadStatusChange(data.Id || header.recordId, data.Status, orgId);
      }
    } else if (header.changeType === 'DELETE') {
      await supabase
        .from('synced_leads')
        .update({
          deleted_at: new Date().toISOString(),
          last_synced_at: new Date().toISOString()
        })
        .eq('external_id', header.recordId)
        .eq('provider', 'salesforce');
    }
  }
}

/**
 * Handle Account change events
 */
async function handleAccountChange(events, orgId) {
  const eventArray = Array.isArray(events) ? events : [events];
  
  for (const event of eventArray) {
    const { header, data } = event;
    
    if (header.changeType === 'CREATE' || header.changeType === 'UPDATE') {
      const accountData = {
        external_id: data.Id || header.recordId,
        provider: 'salesforce',
        org_id: orgId,
        name: data.Name,
        type: data.Type,
        industry: data.Industry,
        annual_revenue: data.AnnualRevenue ? parseFloat(data.AnnualRevenue) : null,
        number_of_employees: data.NumberOfEmployees,
        phone: data.Phone,
        website: data.Website,
        billing_street: data.BillingStreet,
        billing_city: data.BillingCity,
        billing_state: data.BillingState,
        billing_postal_code: data.BillingPostalCode,
        billing_country: data.BillingCountry,
        owner_id: data.OwnerId,
        created_date: data.CreatedDate,
        last_modified_date: data.LastModifiedDate,
        last_synced_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('synced_accounts')
        .upsert(accountData, {
          onConflict: 'external_id,provider'
        });

      if (error) {
        console.error('Error syncing account:', error);
        throw error;
      }
    } else if (header.changeType === 'DELETE') {
      await supabase
        .from('synced_accounts')
        .update({
          deleted_at: new Date().toISOString(),
          last_synced_at: new Date().toISOString()
        })
        .eq('external_id', header.recordId)
        .eq('provider', 'salesforce');
    }
  }
}

/**
 * Handle Contact change events
 */
async function handleContactChange(events, orgId) {
  const eventArray = Array.isArray(events) ? events : [events];
  
  for (const event of eventArray) {
    const { header, data } = event;
    
    if (header.changeType === 'CREATE' || header.changeType === 'UPDATE') {
      const contactData = {
        external_id: data.Id || header.recordId,
        provider: 'salesforce',
        org_id: orgId,
        account_id: data.AccountId,
        first_name: data.FirstName,
        last_name: data.LastName,
        email: data.Email,
        phone: data.Phone,
        mobile_phone: data.MobilePhone,
        title: data.Title,
        department: data.Department,
        lead_source: data.LeadSource,
        owner_id: data.OwnerId,
        created_date: data.CreatedDate,
        last_modified_date: data.LastModifiedDate,
        last_synced_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('synced_contacts')
        .upsert(contactData, {
          onConflict: 'external_id,provider'
        });

      if (error) {
        console.error('Error syncing contact:', error);
        throw error;
      }
    } else if (header.changeType === 'DELETE') {
      await supabase
        .from('synced_contacts')
        .update({
          deleted_at: new Date().toISOString(),
          last_synced_at: new Date().toISOString()
        })
        .eq('external_id', header.recordId)
        .eq('provider', 'salesforce');
    }
  }
}

/**
 * Handle Task change events
 */
async function handleTaskChange(events, orgId) {
  const eventArray = Array.isArray(events) ? events : [events];
  
  for (const event of eventArray) {
    const { header, data } = event;
    
    if (header.changeType === 'CREATE' || header.changeType === 'UPDATE') {
      const taskData = {
        external_id: data.Id || header.recordId,
        provider: 'salesforce',
        org_id: orgId,
        subject: data.Subject,
        description: data.Description,
        status: data.Status,
        priority: data.Priority,
        activity_date: data.ActivityDate,
        who_id: data.WhoId,
        what_id: data.WhatId,
        owner_id: data.OwnerId,
        created_date: data.CreatedDate,
        last_modified_date: data.LastModifiedDate,
        last_synced_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('synced_tasks')
        .upsert(taskData, {
          onConflict: 'external_id,provider'
        });

      if (error) {
        console.error('Error syncing task:', error);
        throw error;
      }

      // Create notification for new tasks
      if (header.changeType === 'CREATE') {
        await createTaskNotification(taskData, orgId);
      }
    } else if (header.changeType === 'DELETE') {
      await supabase
        .from('synced_tasks')
        .update({
          deleted_at: new Date().toISOString(),
          last_synced_at: new Date().toISOString()
        })
        .eq('external_id', header.recordId)
        .eq('provider', 'salesforce');
    }
  }
}

/**
 * Handle Case change events
 */
async function handleCaseChange(events, orgId) {
  const eventArray = Array.isArray(events) ? events : [events];
  
  for (const event of eventArray) {
    const { header, data } = event;
    
    if (header.changeType === 'CREATE' || header.changeType === 'UPDATE') {
      const caseData = {
        external_id: data.Id || header.recordId,
        provider: 'salesforce',
        org_id: orgId,
        case_number: data.CaseNumber,
        account_id: data.AccountId,
        contact_id: data.ContactId,
        subject: data.Subject,
        description: data.Description,
        status: data.Status,
        priority: data.Priority,
        origin: data.Origin,
        reason: data.Reason,
        type: data.Type,
        owner_id: data.OwnerId,
        created_date: data.CreatedDate,
        last_modified_date: data.LastModifiedDate,
        last_synced_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('synced_cases')
        .upsert(caseData, {
          onConflict: 'external_id,provider'
        });

      if (error) {
        console.error('Error syncing case:', error);
        throw error;
      }
    } else if (header.changeType === 'DELETE') {
      await supabase
        .from('synced_cases')
        .update({
          deleted_at: new Date().toISOString(),
          last_synced_at: new Date().toISOString()
        })
        .eq('external_id', header.recordId)
        .eq('provider', 'salesforce');
    }
  }
}

/**
 * Handle Custom Object change events
 */
async function handleCustomObjectChange(events, orgId) {
  const eventArray = Array.isArray(events) ? events : [events];
  
  for (const event of eventArray) {
    const { header, data } = event;
    
    // Log custom object changes for later processing
    await supabase
      .from('custom_object_changes')
      .insert({
        external_id: header.recordId,
        provider: 'salesforce',
        org_id: orgId,
        object_type: header.entityName,
        change_type: header.changeType,
        change_data: data,
        created_at: new Date().toISOString()
      });
  }
}

/**
 * Trigger opportunity workflow
 */
async function triggerOpportunityWorkflow(events, orgId) {
  const eventArray = Array.isArray(events) ? events : [events];
  
  for (const event of eventArray) {
    if (event.header.changeType === 'UPDATE' && event.data.StageName) {
      await supabase
        .from('workflow_triggers')
        .insert({
          trigger_type: 'salesforce_opportunity_stage_change',
          trigger_data: {
            opportunity_id: event.data.Id || event.header.recordId,
            org_id: orgId,
            new_stage: event.data.StageName,
            amount: event.data.Amount,
            provider: 'salesforce'
          },
          created_at: new Date().toISOString()
        });
    }
  }
}

/**
 * Update AI lead context
 */
async function updateAILeadContext(events) {
  const eventArray = Array.isArray(events) ? events : [events];
  
  for (const event of eventArray) {
    if (event.header.changeType === 'UPDATE' && event.data.Status) {
      await supabase
        .from('ai_context_updates')
        .insert({
          update_type: 'salesforce_lead_status_change',
          entity_id: event.data.Id || event.header.recordId,
          entity_type: 'lead',
          provider: 'salesforce',
          data: {
            new_status: event.data.Status,
            email: event.data.Email,
            company: event.data.Company
          },
          created_at: new Date().toISOString()
        });
    }
  }
}

/**
 * Refresh customer data
 */
async function refreshCustomerData(events, orgId) {
  const eventArray = Array.isArray(events) ? events : [events];
  
  for (const event of eventArray) {
    await supabase
      .from('customer_data_refresh_tasks')
      .insert({
        account_id: event.data.Id || event.header.recordId,
        provider: 'salesforce',
        org_id: orgId,
        refresh_type: 'account_change',
        created_at: new Date().toISOString()
      });
  }
}

/**
 * Sync contact to HubSpot if connected
 */
async function syncContactToHubSpot(events, orgId) {
  // Check if HubSpot integration is active
  const { data: integration } = await supabase
    .from('integrations')
    .select('*')
    .eq('provider', 'hubspot')
    .eq('status', 'active')
    .single();

  if (integration) {
    const eventArray = Array.isArray(events) ? events : [events];
    
    for (const event of eventArray) {
      await supabase
        .from('cross_platform_sync_tasks')
        .insert({
          source_provider: 'salesforce',
          target_provider: 'hubspot',
          sync_type: 'contact_sync',
          entity_id: event.data.Id || event.header.recordId,
          entity_data: event.data,
          created_at: new Date().toISOString()
        });
    }
  }
}

/**
 * Notify relevant agents
 */
async function notifyRelevantAgents(events, orgId) {
  const eventArray = Array.isArray(events) ? events : [events];
  
  for (const event of eventArray) {
    if (event.header.changeType === 'CREATE') {
      await supabase
        .from('agent_notifications')
        .insert({
          notification_type: 'new_task',
          title: `New Task: ${event.data.Subject}`,
          message: `A new task has been created in Salesforce`,
          task_id: event.data.Id || event.header.recordId,
          owner_id: event.data.OwnerId,
          provider: 'salesforce',
          created_at: new Date().toISOString()
        });
    }
  }
}

/**
 * Trigger support workflow
 */
async function triggerSupportWorkflow(events, orgId) {
  const eventArray = Array.isArray(events) ? events : [events];
  
  for (const event of eventArray) {
    if (event.header.changeType === 'CREATE') {
      await supabase
        .from('workflow_triggers')
        .insert({
          trigger_type: 'salesforce_new_case',
          trigger_data: {
            case_id: event.data.Id || event.header.recordId,
            org_id: orgId,
            priority: event.data.Priority,
            status: event.data.Status,
            provider: 'salesforce'
          },
          created_at: new Date().toISOString()
        });
    }
  }
}

/**
 * Log opportunity stage change
 */
async function logOpportunityStageChange(opportunityId, newStage, orgId) {
  await supabase
    .from('opportunity_stage_changes')
    .insert({
      opportunity_id: opportunityId,
      new_stage: newStage,
      provider: 'salesforce',
      org_id: orgId,
      created_at: new Date().toISOString()
    });
}

/**
 * Log lead status change
 */
async function logLeadStatusChange(leadId, newStatus, orgId) {
  await supabase
    .from('lead_status_changes')
    .insert({
      lead_id: leadId,
      new_status: newStatus,
      provider: 'salesforce',
      org_id: orgId,
      created_at: new Date().toISOString()
    });
}

/**
 * Create task notification
 */
async function createTaskNotification(taskData, orgId) {
  await supabase
    .from('task_notifications')
    .insert({
      task_id: taskData.external_id,
      subject: taskData.subject,
      owner_id: taskData.owner_id,
      provider: 'salesforce',
      org_id: orgId,
      created_at: new Date().toISOString()
    });
}

/**
 * Sanitize payload for WebSocket broadcast
 */
function sanitizePayloadForBroadcast(payload) {
  // Remove sensitive information before broadcasting
  const sanitized = Array.isArray(payload) ? payload.map(event => ({
    header: event.header,
    data: {
      Id: event.data.Id,
      Name: event.data.Name,
      Status: event.data.Status,
      StageName: event.data.StageName
      // Only include non-sensitive fields
    }
  })) : payload;
  
  return sanitized;
}

/**
 * Broadcast webhook event via WebSocket
 */
async function broadcastWebhookEvent(provider, eventType, data) {
  // This would typically use the WebSocketManager
  console.log(`Broadcasting webhook event: ${provider}:${eventType}`, data);
}

/**
 * Log webhook event
 */
async function logWebhookEvent(provider, eventType, payload, sourceIp, success, error = null) {
  try {
    await supabase
      .from('webhook_events')
      .insert({
        provider,
        event_type: eventType,
        payload,
        source_ip: sourceIp,
        processed: success,
        success,
        error_message: error,
        created_at: new Date().toISOString()
      });
  } catch (logError) {
    console.error('Error logging webhook event:', logError);
  }
}