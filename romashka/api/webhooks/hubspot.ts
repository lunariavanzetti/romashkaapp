/**
 * HubSpot Webhook Handler
 * Handles real-time updates from HubSpot CRM
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
const RATE_LIMIT_MAX_REQUESTS = 100; // Max requests per window

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

    // Validate HubSpot signature
    const signature = req.headers['x-hubspot-signature'];
    const timestamp = req.headers['x-hubspot-request-timestamp'];
    
    if (!signature || !timestamp) {
      return res.status(400).json({ error: 'Missing required headers' });
    }

    // Verify signature
    const body = JSON.stringify(req.body);
    if (!verifyHubSpotSignature(body, signature, timestamp)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Process webhook payload
    const webhookData = req.body;
    
    if (!webhookData || !Array.isArray(webhookData)) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    const results = [];

    // Process each event in the batch
    for (const event of webhookData) {
      try {
        const result = await processHubSpotEvent(event, sourceIp);
        results.push(result);
      } catch (error) {
        console.error('Error processing HubSpot event:', error);
        results.push({
          eventId: event.eventId,
          success: false,
          error: error.message
        });
      }
    }

    // Log webhook reception
    await logWebhookEvent('hubspot', webhookData, sourceIp, true);

    // Send success response
    res.status(200).json({
      success: true,
      processed: results.length,
      results,
      duration_ms: Date.now() - startTime
    });

  } catch (error) {
    console.error('HubSpot webhook error:', error);
    
    // Log error
    await logWebhookEvent('hubspot', req.body, sourceIp, false, error.message);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      duration_ms: Date.now() - startTime
    });
  }
};

/**
 * Verify HubSpot webhook signature
 */
function verifyHubSpotSignature(body, signature, timestamp) {
  try {
    const webhookSecret = process.env.HUBSPOT_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('HubSpot webhook secret not configured');
      return false;
    }

    // HubSpot signature format: sha256=hash
    const expectedSignature = crypto
      .createHash('sha256')
      .update(webhookSecret + body)
      .digest('hex');

    const receivedSignature = signature.replace('sha256=', '');
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(receivedSignature)
    );
  } catch (error) {
    console.error('Error verifying HubSpot signature:', error);
    return false;
  }
}

/**
 * Check rate limit for IP address
 */
function checkRateLimit(ip) {
  const now = Date.now();
  const key = `hubspot:${ip}`;
  
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
 * Process individual HubSpot event
 */
async function processHubSpotEvent(event, sourceIp) {
  const { eventId, subscriptionId, portalId, objectId, eventType, propertyName, propertyValue } = event;
  
  console.log(`Processing HubSpot event: ${eventType} for object ${objectId}`);

  const result = {
    eventId,
    success: false,
    processed_records: 0,
    actions_triggered: []
  };

  try {
    switch (eventType) {
      case 'contact.propertyChange':
        await handleContactPropertyChange(event);
        result.processed_records = 1;
        result.actions_triggered.push('contact_updated');
        break;

      case 'deal.propertyChange':
        await handleDealPropertyChange(event);
        result.processed_records = 1;
        result.actions_triggered.push('deal_updated');
        
        // Trigger workflow if deal stage changed
        if (propertyName === 'dealstage') {
          await triggerDealStageWorkflow(event);
          result.actions_triggered.push('workflow_triggered');
        }
        break;

      case 'company.propertyChange':
        await handleCompanyPropertyChange(event);
        result.processed_records = 1;
        result.actions_triggered.push('company_updated');
        break;

      case 'contact.creation':
        await handleContactCreation(event);
        result.processed_records = 1;
        result.actions_triggered.push('contact_created');
        break;

      case 'deal.creation':
        await handleDealCreation(event);
        await triggerNewDealWorkflow(event);
        result.processed_records = 1;
        result.actions_triggered.push('deal_created', 'workflow_triggered');
        break;

      case 'company.creation':
        await handleCompanyCreation(event);
        await updateAIKnowledge('company', event);
        result.processed_records = 1;
        result.actions_triggered.push('company_created', 'ai_knowledge_updated');
        break;

      case 'contact.deletion':
        await handleContactDeletion(event);
        await cleanupAIKnowledge('contact', objectId);
        result.processed_records = 1;
        result.actions_triggered.push('contact_deleted', 'ai_knowledge_cleaned');
        break;

      default:
        console.log(`Unhandled HubSpot event type: ${eventType}`);
        result.actions_triggered.push('event_logged');
    }

    result.success = true;

    // Broadcast real-time update
    await broadcastWebhookEvent('hubspot', eventType, {
      objectId,
      eventType,
      propertyName,
      propertyValue,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`Error processing HubSpot event ${eventId}:`, error);
    throw error;
  }

  return result;
}

/**
 * Handle contact property change
 */
async function handleContactPropertyChange(event) {
  const { objectId, propertyName, propertyValue } = event;

  // Update synced contact record
  const { error } = await supabase
    .from('synced_contacts')
    .upsert({
      external_id: objectId,
      provider: 'hubspot',
      [propertyName]: propertyValue,
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'external_id,provider'
    });

  if (error) {
    console.error('Error updating synced contact:', error);
    throw error;
  }

  // Update AI context if it's a critical property
  const criticalProperties = ['email', 'firstname', 'lastname', 'phone', 'company'];
  if (criticalProperties.includes(propertyName)) {
    await updateAIContactContext(objectId, propertyName, propertyValue);
  }
}

/**
 * Handle deal property change
 */
async function handleDealPropertyChange(event) {
  const { objectId, propertyName, propertyValue } = event;

  // Update synced deal record
  const { error } = await supabase
    .from('synced_deals')
    .upsert({
      external_id: objectId,
      provider: 'hubspot',
      [propertyName]: propertyValue,
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'external_id,provider'
    });

  if (error) {
    console.error('Error updating synced deal:', error);
    throw error;
  }
}

/**
 * Handle company property change
 */
async function handleCompanyPropertyChange(event) {
  const { objectId, propertyName, propertyValue } = event;

  // Update synced company record
  const { error } = await supabase
    .from('synced_companies')
    .upsert({
      external_id: objectId,
      provider: 'hubspot',
      [propertyName]: propertyValue,
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'external_id,provider'
    });

  if (error) {
    console.error('Error updating synced company:', error);
    throw error;
  }
}

/**
 * Handle contact creation
 */
async function handleContactCreation(event) {
  const { objectId, portalId } = event;

  // Fetch full contact data from HubSpot API
  const contactData = await fetchHubSpotContact(objectId);
  
  if (contactData) {
    // Create synced contact record
    const { error } = await supabase
      .from('synced_contacts')
      .insert({
        external_id: objectId,
        provider: 'hubspot',
        portal_id: portalId,
        email: contactData.properties.email,
        first_name: contactData.properties.firstname,
        last_name: contactData.properties.lastname,
        phone: contactData.properties.phone,
        company: contactData.properties.company,
        created_at: new Date().toISOString(),
        last_synced_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error creating synced contact:', error);
      throw error;
    }
  }
}

/**
 * Handle deal creation
 */
async function handleDealCreation(event) {
  const { objectId, portalId } = event;

  // Fetch full deal data from HubSpot API
  const dealData = await fetchHubSpotDeal(objectId);
  
  if (dealData) {
    // Create synced deal record
    const { error } = await supabase
      .from('synced_deals')
      .insert({
        external_id: objectId,
        provider: 'hubspot',
        portal_id: portalId,
        deal_name: dealData.properties.dealname,
        amount: dealData.properties.amount,
        stage: dealData.properties.dealstage,
        close_date: dealData.properties.closedate,
        created_at: new Date().toISOString(),
        last_synced_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error creating synced deal:', error);
      throw error;
    }
  }
}

/**
 * Handle company creation
 */
async function handleCompanyCreation(event) {
  const { objectId, portalId } = event;

  // Fetch full company data from HubSpot API
  const companyData = await fetchHubSpotCompany(objectId);
  
  if (companyData) {
    // Create synced company record
    const { error } = await supabase
      .from('synced_companies')
      .insert({
        external_id: objectId,
        provider: 'hubspot',
        portal_id: portalId,
        name: companyData.properties.name,
        domain: companyData.properties.domain,
        industry: companyData.properties.industry,
        created_at: new Date().toISOString(),
        last_synced_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error creating synced company:', error);
      throw error;
    }
  }
}

/**
 * Handle contact deletion
 */
async function handleContactDeletion(event) {
  const { objectId } = event;

  // Soft delete synced contact record
  const { error } = await supabase
    .from('synced_contacts')
    .update({
      deleted_at: new Date().toISOString(),
      last_synced_at: new Date().toISOString()
    })
    .eq('external_id', objectId)
    .eq('provider', 'hubspot');

  if (error) {
    console.error('Error deleting synced contact:', error);
    throw error;
  }
}

/**
 * Trigger deal stage workflow
 */
async function triggerDealStageWorkflow(event) {
  const { objectId, propertyValue } = event;
  
  // Insert workflow trigger
  await supabase
    .from('workflow_triggers')
    .insert({
      trigger_type: 'hubspot_deal_stage_change',
      trigger_data: {
        deal_id: objectId,
        new_stage: propertyValue,
        provider: 'hubspot'
      },
      created_at: new Date().toISOString()
    });
}

/**
 * Trigger new deal workflow
 */
async function triggerNewDealWorkflow(event) {
  const { objectId, portalId } = event;
  
  // Insert workflow trigger
  await supabase
    .from('workflow_triggers')
    .insert({
      trigger_type: 'hubspot_new_deal',
      trigger_data: {
        deal_id: objectId,
        portal_id: portalId,
        provider: 'hubspot'
      },
      created_at: new Date().toISOString()
    });
}

/**
 * Update AI knowledge base
 */
async function updateAIKnowledge(type, event) {
  // Insert AI knowledge update task
  await supabase
    .from('ai_knowledge_updates')
    .insert({
      update_type: `hubspot_${type}_change`,
      entity_id: event.objectId,
      entity_type: type,
      provider: 'hubspot',
      data: event,
      created_at: new Date().toISOString()
    });
}

/**
 * Cleanup AI knowledge
 */
async function cleanupAIKnowledge(type, objectId) {
  // Insert AI knowledge cleanup task
  await supabase
    .from('ai_knowledge_updates')
    .insert({
      update_type: `hubspot_${type}_deletion`,
      entity_id: objectId,
      entity_type: type,
      provider: 'hubspot',
      action: 'delete',
      created_at: new Date().toISOString()
    });
}

/**
 * Update AI contact context
 */
async function updateAIContactContext(objectId, propertyName, propertyValue) {
  // Insert AI context update task
  await supabase
    .from('ai_context_updates')
    .insert({
      update_type: 'hubspot_contact_property_change',
      entity_id: objectId,
      property_name: propertyName,
      property_value: propertyValue,
      provider: 'hubspot',
      created_at: new Date().toISOString()
    });
}

/**
 * Broadcast webhook event via WebSocket
 */
async function broadcastWebhookEvent(provider, eventType, data) {
  // This would typically use the WebSocketManager
  // For now, we'll log it
  console.log(`Broadcasting webhook event: ${provider}:${eventType}`, data);
}

/**
 * Fetch HubSpot contact data
 */
async function fetchHubSpotContact(contactId) {
  // This would make an API call to HubSpot
  // For now, return null to avoid external API calls in webhook handler
  return null;
}

/**
 * Fetch HubSpot deal data
 */
async function fetchHubSpotDeal(dealId) {
  // This would make an API call to HubSpot
  // For now, return null to avoid external API calls in webhook handler
  return null;
}

/**
 * Fetch HubSpot company data
 */
async function fetchHubSpotCompany(companyId) {
  // This would make an API call to HubSpot
  // For now, return null to avoid external API calls in webhook handler
  return null;
}

/**
 * Log webhook event
 */
async function logWebhookEvent(provider, payload, sourceIp, success, error = null) {
  try {
    await supabase
      .from('webhook_events')
      .insert({
        provider,
        event_type: 'batch',
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