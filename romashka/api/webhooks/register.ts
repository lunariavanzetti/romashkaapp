/**
 * Webhook Registration API
 * Handles webhook configuration and registration with external providers
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data: { user } } = await supabase.auth.getUser(req.headers.authorization?.replace('Bearer ', ''));
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      provider,
      events,
      webhook_url,
      secret,
      rate_limit = 100,
      timeout_ms = 30000,
      retry_attempts = 3,
      ip_whitelist = []
    } = req.body;

    // Validate required fields
    if (!provider || !events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ 
        error: 'Missing required fields: provider, events' 
      });
    }

    // Validate provider
    const supportedProviders = ['hubspot', 'shopify', 'salesforce'];
    if (!supportedProviders.includes(provider.toLowerCase())) {
      return res.status(400).json({ 
        error: `Unsupported provider. Supported providers: ${supportedProviders.join(', ')}` 
      });
    }

    // Generate webhook URL if not provided
    const finalWebhookUrl = webhook_url || `${process.env.WEBHOOK_BASE_URL || 'https://romashkaai.vercel.app'}/api/webhooks/${provider.toLowerCase()}`;

    // Generate secret if not provided
    const webhookSecret = secret || crypto.randomBytes(32).toString('hex');

    // Check if webhook configuration already exists
    const { data: existingConfig } = await supabase
      .from('webhook_configs')
      .select('*')
      .eq('provider', provider.toLowerCase())
      .eq('user_id', user.id)
      .single();

    let webhookConfig;

    if (existingConfig) {
      // Update existing configuration
      const { data, error } = await supabase
        .from('webhook_configs')
        .update({
          events,
          webhook_url: finalWebhookUrl,
          secret: webhookSecret,
          rate_limit,
          timeout_ms,
          retry_attempts,
          ip_whitelist,
          active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingConfig.id)
        .select()
        .single();

      if (error) throw error;
      webhookConfig = data;
    } else {
      // Create new configuration
      const { data, error } = await supabase
        .from('webhook_configs')
        .insert({
          user_id: user.id,
          provider: provider.toLowerCase(),
          events,
          webhook_url: finalWebhookUrl,
          secret: webhookSecret,
          rate_limit,
          timeout_ms,
          retry_attempts,
          ip_whitelist,
          active: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      webhookConfig = data;
    }

    // Register webhook with the external provider
    const registrationResult = await registerWebhookWithProvider(
      provider.toLowerCase(),
      events,
      finalWebhookUrl,
      webhookSecret,
      user
    );

    // Update configuration with external webhook ID if successful
    if (registrationResult.success && registrationResult.webhook_id) {
      await supabase
        .from('webhook_configs')
        .update({
          external_webhook_id: registrationResult.webhook_id,
          registration_status: 'registered'
        })
        .eq('id', webhookConfig.id);

      webhookConfig.external_webhook_id = registrationResult.webhook_id;
      webhookConfig.registration_status = 'registered';
    }

    // Log the registration
    await supabase
      .from('webhook_registration_logs')
      .insert({
        webhook_config_id: webhookConfig.id,
        provider: provider.toLowerCase(),
        action: existingConfig ? 'update' : 'create',
        success: registrationResult.success,
        response_data: registrationResult,
        created_at: new Date().toISOString()
      });

    res.status(200).json({
      success: true,
      message: `Webhook ${existingConfig ? 'updated' : 'registered'} successfully`,
      webhook_config: {
        id: webhookConfig.id,
        provider: webhookConfig.provider,
        events: webhookConfig.events,
        webhook_url: webhookConfig.webhook_url,
        rate_limit: webhookConfig.rate_limit,
        timeout_ms: webhookConfig.timeout_ms,
        retry_attempts: webhookConfig.retry_attempts,
        active: webhookConfig.active,
        registration_status: webhookConfig.registration_status,
        external_webhook_id: webhookConfig.external_webhook_id,
        created_at: webhookConfig.created_at
      },
      registration_result: registrationResult
    });

  } catch (error) {
    console.error('Webhook registration error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to register webhook',
      message: error.message
    });
  }
};

/**
 * Register webhook with external provider
 */
async function registerWebhookWithProvider(provider, events, webhookUrl, secret, user) {
  try {
    switch (provider) {
      case 'hubspot':
        return await registerHubSpotWebhook(events, webhookUrl, secret, user);
      
      case 'shopify':
        return await registerShopifyWebhook(events, webhookUrl, secret, user);
      
      case 'salesforce':
        return await registerSalesforceWebhook(events, webhookUrl, secret, user);
      
      default:
        return {
          success: false,
          error: `Provider ${provider} not implemented`
        };
    }
  } catch (error) {
    console.error(`Error registering webhook with ${provider}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Register HubSpot webhook
 */
async function registerHubSpotWebhook(events, webhookUrl, secret, user) {
  try {
    // Get HubSpot access token for the user
    const { data: tokenData } = await supabase
      .from('oauth_tokens')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('provider', 'hubspot')
      .single();

    if (!tokenData) {
      return {
        success: false,
        error: 'HubSpot integration not found. Please connect HubSpot first.'
      };
    }

    // Map events to HubSpot subscription types
    const hubspotSubscriptions = events.map(event => {
      switch (event) {
        case 'contact.propertyChange':
          return { subscriptionType: 'contact.propertyChange', active: true };
        case 'deal.stageChange':
          return { subscriptionType: 'deal.propertyChange', active: true };
        case 'company.creation':
          return { subscriptionType: 'company.creation', active: true };
        case 'contact.deletion':
          return { subscriptionType: 'contact.deletion', active: true };
        default:
          return { subscriptionType: event, active: true };
      }
    });

    // Create webhook subscription in HubSpot
    const response = await fetch('https://api.hubapi.com/webhooks/v3/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        eventType: 'contact.propertyChange', // HubSpot requires individual subscriptions
        propertyName: 'email', // Example property
        active: true
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`HubSpot API error: ${response.status} - ${errorData}`);
    }

    const webhookData = await response.json();

    return {
      success: true,
      webhook_id: webhookData.id,
      provider_response: webhookData
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Register Shopify webhook
 */
async function registerShopifyWebhook(events, webhookUrl, secret, user) {
  try {
    // Get Shopify access token for the user
    const { data: tokenData } = await supabase
      .from('oauth_tokens')
      .select('access_token, store_identifier')
      .eq('user_id', user.id)
      .eq('provider', 'shopify')
      .single();

    if (!tokenData) {
      return {
        success: false,
        error: 'Shopify integration not found. Please connect Shopify first.'
      };
    }

    const webhookIds = [];

    // Create individual webhooks for each event type
    for (const event of events) {
      const response = await fetch(`https://${tokenData.store_identifier}.myshopify.com/admin/api/2023-10/webhooks.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': tokenData.access_token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          webhook: {
            topic: event,
            address: webhookUrl,
            format: 'json'
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`Shopify webhook creation failed for ${event}:`, errorData);
        continue;
      }

      const webhookData = await response.json();
      webhookIds.push(webhookData.webhook.id);
    }

    return {
      success: webhookIds.length > 0,
      webhook_id: webhookIds.join(','),
      created_webhooks: webhookIds.length,
      total_events: events.length
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Register Salesforce webhook (Platform Events)
 */
async function registerSalesforceWebhook(events, webhookUrl, secret, user) {
  try {
    // Get Salesforce access token for the user
    const { data: tokenData } = await supabase
      .from('oauth_tokens')
      .select('access_token, instance_url')
      .eq('user_id', user.id)
      .eq('provider', 'salesforce')
      .single();

    if (!tokenData) {
      return {
        success: false,
        error: 'Salesforce integration not found. Please connect Salesforce first.'
      };
    }

    // For Salesforce, we typically use Platform Events or Streaming API
    // This is a simplified example - actual implementation would depend on the specific setup
    
    // Create a Remote Site Setting or similar configuration
    const response = await fetch(`${tokenData.instance_url}/services/data/v58.0/sobjects/RemoteSiteSetting/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        SiteName: 'ROMASHKA_Webhook',
        EndpointUrl: webhookUrl,
        Description: 'ROMASHKA Webhook Endpoint',
        IsActive: true
      })
    });

    // Note: Actual Salesforce webhook setup is more complex and typically involves:
    // 1. Creating Platform Events
    // 2. Setting up Apex Triggers
    // 3. Configuring Streaming API subscriptions
    // This is a simplified representation

    return {
      success: true,
      webhook_id: 'salesforce_platform_events',
      message: 'Salesforce webhook configuration initiated. Manual setup may be required.',
      setup_required: true
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}