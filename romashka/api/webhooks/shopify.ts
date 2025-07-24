/**
 * Shopify Webhook Handler
 * Handles real-time updates from Shopify eCommerce platform
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
const RATE_LIMIT_MAX_REQUESTS = 200; // Max requests per window (higher for eCommerce)

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

    // Validate Shopify webhook
    const hmacHeader = req.headers['x-shopify-hmac-sha256'];
    const topic = req.headers['x-shopify-topic'];
    const shopDomain = req.headers['x-shopify-shop-domain'];
    
    if (!hmacHeader || !topic || !shopDomain) {
      return res.status(400).json({ error: 'Missing required Shopify headers' });
    }

    // Verify webhook signature
    const body = JSON.stringify(req.body);
    if (!verifyShopifySignature(body, hmacHeader)) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    // Process webhook based on topic
    const result = await processShopifyWebhook(topic, req.body, shopDomain, sourceIp);

    // Log webhook reception
    await logWebhookEvent('shopify', topic, req.body, sourceIp, true);

    // Send success response
    res.status(200).json({
      success: true,
      topic,
      shop_domain: shopDomain,
      processed_records: result.processed_records,
      actions_triggered: result.actions_triggered,
      duration_ms: Date.now() - startTime
    });

  } catch (error) {
    console.error('Shopify webhook error:', error);
    
    // Log error
    await logWebhookEvent('shopify', req.headers['x-shopify-topic'], req.body, sourceIp, false, error.message);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      duration_ms: Date.now() - startTime
    });
  }
};

/**
 * Verify Shopify webhook signature
 */
function verifyShopifySignature(body, hmacHeader) {
  try {
    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('Shopify webhook secret not configured');
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body, 'utf8')
      .digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(hmacHeader),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Error verifying Shopify signature:', error);
    return false;
  }
}

/**
 * Check rate limit for IP address
 */
function checkRateLimit(ip) {
  const now = Date.now();
  const key = `shopify:${ip}`;
  
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
 * Process Shopify webhook based on topic
 */
async function processShopifyWebhook(topic, payload, shopDomain, sourceIp) {
  console.log(`Processing Shopify webhook: ${topic} from ${shopDomain}`);

  const result = {
    processed_records: 0,
    actions_triggered: []
  };

  try {
    switch (topic) {
      case 'orders/create':
        await handleOrderCreate(payload, shopDomain);
        await triggerNewOrderWorkflow(payload, shopDomain);
        await sendNewOrderNotification(payload);
        result.processed_records = 1;
        result.actions_triggered.push('order_created', 'workflow_triggered', 'notification_sent');
        break;

      case 'orders/updated':
        await handleOrderUpdate(payload, shopDomain);
        await notifyCustomerOfOrderUpdate(payload);
        result.processed_records = 1;
        result.actions_triggered.push('order_updated', 'customer_notified');
        break;

      case 'orders/paid':
        await handleOrderPaid(payload, shopDomain);
        await triggerOrderPaidWorkflow(payload, shopDomain);
        result.processed_records = 1;
        result.actions_triggered.push('order_paid', 'workflow_triggered');
        break;

      case 'orders/cancelled':
        await handleOrderCancelled(payload, shopDomain);
        await triggerOrderCancelledWorkflow(payload, shopDomain);
        result.processed_records = 1;
        result.actions_triggered.push('order_cancelled', 'workflow_triggered');
        break;

      case 'orders/fulfilled':
        await handleOrderFulfilled(payload, shopDomain);
        await sendFulfillmentNotification(payload);
        result.processed_records = 1;
        result.actions_triggered.push('order_fulfilled', 'notification_sent');
        break;

      case 'customers/create':
        await handleCustomerCreate(payload, shopDomain);
        await syncCustomerToHubSpot(payload, shopDomain);
        await addCustomerToEmailList(payload);
        result.processed_records = 1;
        result.actions_triggered.push('customer_created', 'hubspot_synced', 'email_subscribed');
        break;

      case 'customers/update':
        await handleCustomerUpdate(payload, shopDomain);
        await updateCustomerInHubSpot(payload, shopDomain);
        result.processed_records = 1;
        result.actions_triggered.push('customer_updated', 'hubspot_updated');
        break;

      case 'products/create':
        await handleProductCreate(payload, shopDomain);
        await updateAIProductKnowledge(payload, 'create');
        result.processed_records = 1;
        result.actions_triggered.push('product_created', 'ai_knowledge_updated');
        break;

      case 'products/update':
        await handleProductUpdate(payload, shopDomain);
        await updateAIProductKnowledge(payload, 'update');
        result.processed_records = 1;
        result.actions_triggered.push('product_updated', 'ai_knowledge_updated');
        break;

      case 'inventory_levels/update':
        await handleInventoryUpdate(payload, shopDomain);
        await checkLowStockAlerts(payload);
        result.processed_records = 1;
        result.actions_triggered.push('inventory_updated', 'stock_checked');
        break;

      case 'app/uninstalled':
        await handleAppUninstall(payload, shopDomain);
        result.processed_records = 1;
        result.actions_triggered.push('app_uninstalled');
        break;

      default:
        console.log(`Unhandled Shopify webhook topic: ${topic}`);
        result.actions_triggered.push('event_logged');
    }

    // Broadcast real-time update
    await broadcastWebhookEvent('shopify', topic, {
      shop_domain: shopDomain,
      topic,
      payload: sanitizePayloadForBroadcast(payload),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`Error processing Shopify webhook ${topic}:`, error);
    throw error;
  }

  return result;
}

/**
 * Handle new order creation
 */
async function handleOrderCreate(order, shopDomain) {
  const orderData = {
    external_id: order.id.toString(),
    provider: 'shopify',
    shop_domain: shopDomain,
    order_number: order.order_number || order.name,
    customer_id: order.customer?.id?.toString(),
    customer_email: order.customer?.email,
    total_amount: parseFloat(order.total_price || 0),
    currency: order.currency,
    financial_status: order.financial_status,
    fulfillment_status: order.fulfillment_status,
    line_items: order.line_items,
    shipping_address: order.shipping_address,
    billing_address: order.billing_address,
    created_at: order.created_at,
    updated_at: order.updated_at,
    last_synced_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('synced_orders')
    .insert(orderData);

  if (error) {
    console.error('Error creating synced order:', error);
    throw error;
  }

  // Update customer order count
  if (order.customer?.id) {
    await updateCustomerOrderStats(order.customer.id, shopDomain);
  }
}

/**
 * Handle order update
 */
async function handleOrderUpdate(order, shopDomain) {
  const { error } = await supabase
    .from('synced_orders')
    .update({
      financial_status: order.financial_status,
      fulfillment_status: order.fulfillment_status,
      total_amount: parseFloat(order.total_price || 0),
      updated_at: order.updated_at,
      last_synced_at: new Date().toISOString()
    })
    .eq('external_id', order.id.toString())
    .eq('provider', 'shopify');

  if (error) {
    console.error('Error updating synced order:', error);
    throw error;
  }
}

/**
 * Handle order paid
 */
async function handleOrderPaid(order, shopDomain) {
  await handleOrderUpdate(order, shopDomain);
  
  // Log payment event
  await supabase
    .from('order_events')
    .insert({
      order_id: order.id.toString(),
      provider: 'shopify',
      event_type: 'payment_received',
      event_data: {
        amount: order.total_price,
        currency: order.currency,
        payment_gateway: order.gateway
      },
      created_at: new Date().toISOString()
    });
}

/**
 * Handle order cancellation
 */
async function handleOrderCancelled(order, shopDomain) {
  await handleOrderUpdate(order, shopDomain);
  
  // Log cancellation event
  await supabase
    .from('order_events')
    .insert({
      order_id: order.id.toString(),
      provider: 'shopify',
      event_type: 'order_cancelled',
      event_data: {
        cancel_reason: order.cancel_reason,
        cancelled_at: order.cancelled_at
      },
      created_at: new Date().toISOString()
    });
}

/**
 * Handle order fulfillment
 */
async function handleOrderFulfilled(order, shopDomain) {
  await handleOrderUpdate(order, shopDomain);
  
  // Log fulfillment event
  await supabase
    .from('order_events')
    .insert({
      order_id: order.id.toString(),
      provider: 'shopify',
      event_type: 'order_fulfilled',
      event_data: {
        fulfillment_status: order.fulfillment_status,
        tracking_numbers: order.fulfillments?.map(f => f.tracking_number).filter(Boolean)
      },
      created_at: new Date().toISOString()
    });
}

/**
 * Handle customer creation
 */
async function handleCustomerCreate(customer, shopDomain) {
  const customerData = {
    external_id: customer.id.toString(),
    provider: 'shopify',
    shop_domain: shopDomain,
    email: customer.email,
    first_name: customer.first_name,
    last_name: customer.last_name,
    phone: customer.phone,
    total_spent: parseFloat(customer.total_spent || 0),
    orders_count: customer.orders_count || 0,
    accepts_marketing: customer.accepts_marketing,
    marketing_opt_in_level: customer.marketing_opt_in_level,
    created_at: customer.created_at,
    updated_at: customer.updated_at,
    last_synced_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('synced_customers')
    .insert(customerData);

  if (error) {
    console.error('Error creating synced customer:', error);
    throw error;
  }
}

/**
 * Handle customer update
 */
async function handleCustomerUpdate(customer, shopDomain) {
  const { error } = await supabase
    .from('synced_customers')
    .update({
      email: customer.email,
      first_name: customer.first_name,
      last_name: customer.last_name,
      phone: customer.phone,
      total_spent: parseFloat(customer.total_spent || 0),
      orders_count: customer.orders_count || 0,
      accepts_marketing: customer.accepts_marketing,
      marketing_opt_in_level: customer.marketing_opt_in_level,
      updated_at: customer.updated_at,
      last_synced_at: new Date().toISOString()
    })
    .eq('external_id', customer.id.toString())
    .eq('provider', 'shopify');

  if (error) {
    console.error('Error updating synced customer:', error);
    throw error;
  }
}

/**
 * Handle product creation
 */
async function handleProductCreate(product, shopDomain) {
  const productData = {
    external_id: product.id.toString(),
    provider: 'shopify',
    shop_domain: shopDomain,
    title: product.title,
    handle: product.handle,
    description: product.body_html,
    product_type: product.product_type,
    vendor: product.vendor,
    tags: product.tags,
    status: product.status,
    variants: product.variants,
    images: product.images,
    created_at: product.created_at,
    updated_at: product.updated_at,
    last_synced_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('synced_products')
    .insert(productData);

  if (error) {
    console.error('Error creating synced product:', error);
    throw error;
  }
}

/**
 * Handle product update
 */
async function handleProductUpdate(product, shopDomain) {
  const { error } = await supabase
    .from('synced_products')
    .update({
      title: product.title,
      handle: product.handle,
      description: product.body_html,
      product_type: product.product_type,
      vendor: product.vendor,
      tags: product.tags,
      status: product.status,
      variants: product.variants,
      images: product.images,
      updated_at: product.updated_at,
      last_synced_at: new Date().toISOString()
    })
    .eq('external_id', product.id.toString())
    .eq('provider', 'shopify');

  if (error) {
    console.error('Error updating synced product:', error);
    throw error;
  }
}

/**
 * Handle inventory level update
 */
async function handleInventoryUpdate(inventoryLevel, shopDomain) {
  const { error } = await supabase
    .from('inventory_levels')
    .upsert({
      inventory_item_id: inventoryLevel.inventory_item_id.toString(),
      location_id: inventoryLevel.location_id.toString(),
      provider: 'shopify',
      shop_domain: shopDomain,
      available: inventoryLevel.available,
      updated_at: inventoryLevel.updated_at,
      last_synced_at: new Date().toISOString()
    }, {
      onConflict: 'inventory_item_id,location_id,provider'
    });

  if (error) {
    console.error('Error updating inventory level:', error);
    throw error;
  }
}

/**
 * Handle app uninstall
 */
async function handleAppUninstall(payload, shopDomain) {
  // Mark all integrations for this shop as inactive
  const { error } = await supabase
    .from('integrations')
    .update({
      status: 'inactive',
      updated_at: new Date().toISOString()
    })
    .eq('provider', 'shopify')
    .eq('shop_domain', shopDomain);

  if (error) {
    console.error('Error handling app uninstall:', error);
    throw error;
  }
}

/**
 * Trigger new order workflow
 */
async function triggerNewOrderWorkflow(order, shopDomain) {
  await supabase
    .from('workflow_triggers')
    .insert({
      trigger_type: 'shopify_new_order',
      trigger_data: {
        order_id: order.id.toString(),
        shop_domain: shopDomain,
        order_value: order.total_price,
        customer_email: order.customer?.email,
        provider: 'shopify'
      },
      created_at: new Date().toISOString()
    });
}

/**
 * Trigger order paid workflow
 */
async function triggerOrderPaidWorkflow(order, shopDomain) {
  await supabase
    .from('workflow_triggers')
    .insert({
      trigger_type: 'shopify_order_paid',
      trigger_data: {
        order_id: order.id.toString(),
        shop_domain: shopDomain,
        payment_amount: order.total_price,
        customer_email: order.customer?.email,
        provider: 'shopify'
      },
      created_at: new Date().toISOString()
    });
}

/**
 * Trigger order cancelled workflow
 */
async function triggerOrderCancelledWorkflow(order, shopDomain) {
  await supabase
    .from('workflow_triggers')
    .insert({
      trigger_type: 'shopify_order_cancelled',
      trigger_data: {
        order_id: order.id.toString(),
        shop_domain: shopDomain,
        cancel_reason: order.cancel_reason,
        customer_email: order.customer?.email,
        provider: 'shopify'
      },
      created_at: new Date().toISOString()
    });
}

/**
 * Send new order notification
 */
async function sendNewOrderNotification(order) {
  await supabase
    .from('ai_notifications')
    .insert({
      notification_type: 'new_order',
      title: `New Order: ${order.name}`,
      message: `New order received for $${order.total_price} from ${order.customer?.email || 'Guest'}`,
      data: {
        order_id: order.id,
        order_name: order.name,
        total_price: order.total_price,
        customer_email: order.customer?.email
      },
      created_at: new Date().toISOString()
    });
}

/**
 * Notify customer of order update
 */
async function notifyCustomerOfOrderUpdate(order) {
  if (order.customer?.email) {
    await supabase
      .from('customer_notifications')
      .insert({
        customer_email: order.customer.email,
        notification_type: 'order_update',
        title: `Order Update: ${order.name}`,
        message: `Your order status has been updated to: ${order.fulfillment_status}`,
        order_id: order.id.toString(),
        provider: 'shopify',
        created_at: new Date().toISOString()
      });
  }
}

/**
 * Send fulfillment notification
 */
async function sendFulfillmentNotification(order) {
  if (order.customer?.email) {
    await supabase
      .from('customer_notifications')
      .insert({
        customer_email: order.customer.email,
        notification_type: 'order_fulfilled',
        title: `Order Shipped: ${order.name}`,
        message: 'Your order has been shipped and is on its way!',
        order_id: order.id.toString(),
        provider: 'shopify',
        created_at: new Date().toISOString()
      });
  }
}

/**
 * Sync customer to HubSpot if connected
 */
async function syncCustomerToHubSpot(customer, shopDomain) {
  // Check if HubSpot integration is active
  const { data: integration } = await supabase
    .from('integrations')
    .select('*')
    .eq('provider', 'hubspot')
    .eq('status', 'active')
    .single();

  if (integration) {
    await supabase
      .from('cross_platform_sync_tasks')
      .insert({
        source_provider: 'shopify',
        target_provider: 'hubspot',
        sync_type: 'customer_create',
        entity_id: customer.id.toString(),
        entity_data: customer,
        created_at: new Date().toISOString()
      });
  }
}

/**
 * Update customer in HubSpot
 */
async function updateCustomerInHubSpot(customer, shopDomain) {
  // Check if HubSpot integration is active
  const { data: integration } = await supabase
    .from('integrations')
    .select('*')
    .eq('provider', 'hubspot')
    .eq('status', 'active')
    .single();

  if (integration) {
    await supabase
      .from('cross_platform_sync_tasks')
      .insert({
        source_provider: 'shopify',
        target_provider: 'hubspot',
        sync_type: 'customer_update',
        entity_id: customer.id.toString(),
        entity_data: customer,
        created_at: new Date().toISOString()
      });
  }
}

/**
 * Add customer to email marketing list
 */
async function addCustomerToEmailList(customer) {
  if (customer.accepts_marketing && customer.email) {
    await supabase
      .from('email_marketing_tasks')
      .insert({
        task_type: 'add_subscriber',
        email: customer.email,
        subscriber_data: {
          first_name: customer.first_name,
          last_name: customer.last_name,
          source: 'shopify_customer_create'
        },
        created_at: new Date().toISOString()
      });
  }
}

/**
 * Update AI product knowledge
 */
async function updateAIProductKnowledge(product, action) {
  await supabase
    .from('ai_knowledge_updates')
    .insert({
      update_type: `shopify_product_${action}`,
      entity_id: product.id.toString(),
      entity_type: 'product',
      provider: 'shopify',
      data: {
        title: product.title,
        description: product.body_html,
        product_type: product.product_type,
        vendor: product.vendor,
        tags: product.tags,
        variants: product.variants
      },
      created_at: new Date().toISOString()
    });
}

/**
 * Check for low stock alerts
 */
async function checkLowStockAlerts(inventoryLevel) {
  const LOW_STOCK_THRESHOLD = 10;
  
  if (inventoryLevel.available <= LOW_STOCK_THRESHOLD) {
    await supabase
      .from('inventory_alerts')
      .insert({
        inventory_item_id: inventoryLevel.inventory_item_id.toString(),
        location_id: inventoryLevel.location_id.toString(),
        provider: 'shopify',
        alert_type: 'low_stock',
        current_level: inventoryLevel.available,
        threshold: LOW_STOCK_THRESHOLD,
        created_at: new Date().toISOString()
      });
  }
}

/**
 * Update customer order statistics
 */
async function updateCustomerOrderStats(customerId, shopDomain) {
  // This would typically aggregate order data
  // For now, we'll just log the update
  console.log(`Updating order stats for customer ${customerId} in ${shopDomain}`);
}

/**
 * Sanitize payload for WebSocket broadcast
 */
function sanitizePayloadForBroadcast(payload) {
  // Remove sensitive information before broadcasting
  const sanitized = { ...payload };
  delete sanitized.note_attributes;
  delete sanitized.customer?.note;
  return sanitized;
}

/**
 * Broadcast webhook event via WebSocket
 */
async function broadcastWebhookEvent(provider, topic, data) {
  // This would typically use the WebSocketManager
  console.log(`Broadcasting webhook event: ${provider}:${topic}`, data);
}

/**
 * Log webhook event
 */
async function logWebhookEvent(provider, topic, payload, sourceIp, success, error = null) {
  try {
    await supabase
      .from('webhook_events')
      .insert({
        provider,
        event_type: topic,
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