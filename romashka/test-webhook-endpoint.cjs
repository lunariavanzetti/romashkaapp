#!/usr/bin/env node

/**
 * WhatsApp Cloud API Webhook Test Endpoint
 * 
 * A simple Express server to test your WhatsApp webhook setup
 */

const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  const timestamp = new Date().toISOString();
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

// WhatsApp webhook endpoint - GET (for verification)
app.get('/api/webhooks/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  log(`WhatsApp webhook verification request received:`, colors.blue);
  log(`  Mode: ${mode}`);
  log(`  Token: ${token}`);
  log(`  Challenge: ${challenge}`);

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    log('✅ WhatsApp webhook verification successful!', colors.green);
    res.status(200).send(challenge);
  } else {
    log('❌ WhatsApp webhook verification failed!', colors.red);
    log(`Expected token: ${process.env.WHATSAPP_VERIFY_TOKEN}`);
    res.status(403).send('Forbidden');
  }
});



// WhatsApp webhook endpoint - POST (for receiving messages)
app.post('/api/webhooks/whatsapp', (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const payload = JSON.stringify(req.body);

  log('Incoming webhook POST request:', colors.cyan);
  log(`  Signature: ${signature}`);
  log(`  Payload size: ${payload.length} bytes`);

  // Validate webhook signature
  if (signature && process.env.WHATSAPP_WEBHOOK_SECRET) {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.WHATSAPP_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    if (signature === `sha256=${expectedSignature}`) {
      log('✅ Webhook signature validated successfully!', colors.green);
    } else {
      log('❌ Invalid webhook signature!', colors.red);
      return res.status(403).send('Forbidden');
    }
  } else {
    log('⚠️  No signature validation (missing secret)', colors.yellow);
  }

  // Process the webhook payload
  try {
    const data = req.body;
    
    if (data.object === 'whatsapp_business_account') {
      log('📱 WhatsApp Business Account webhook received', colors.green);
      
      data.entry?.forEach((entry, entryIndex) => {
        log(`\nEntry ${entryIndex + 1}:`, colors.blue);
        log(`  Business Account ID: ${entry.id}`);
        
        entry.changes?.forEach((change, changeIndex) => {
          log(`  Change ${changeIndex + 1}:`, colors.blue);
          log(`    Field: ${change.field}`);
          
          if (change.value) {
            const value = change.value;
            
            // Handle incoming messages
            if (value.messages) {
              log(`    📩 ${value.messages.length} message(s) received:`, colors.green);
              
              value.messages.forEach((message, msgIndex) => {
                log(`      Message ${msgIndex + 1}:`, colors.cyan);
                log(`        From: ${message.from}`);
                log(`        Type: ${message.type}`);
                log(`        ID: ${message.id}`);
                log(`        Timestamp: ${new Date(parseInt(message.timestamp) * 1000).toISOString()}`);
                
                if (message.text) {
                  log(`        Text: "${message.text.body}"`);
                }
                
                if (message.image) {
                  log(`        Image ID: ${message.image.id}`);
                  log(`        Caption: ${message.image.caption || 'No caption'}`);
                }
                
                if (message.audio) {
                  log(`        Audio ID: ${message.audio.id}`);
                }
                
                if (message.video) {
                  log(`        Video ID: ${message.video.id}`);
                }
                
                if (message.document) {
                  log(`        Document ID: ${message.document.id}`);
                  log(`        Filename: ${message.document.filename}`);
                }
              });
            }
            
            // Handle delivery status updates
            if (value.statuses) {
              log(`    📋 ${value.statuses.length} status update(s):`, colors.yellow);
              
              value.statuses.forEach((status, statusIndex) => {
                log(`      Status ${statusIndex + 1}:`, colors.cyan);
                log(`        Message ID: ${status.id}`);
                log(`        Status: ${status.status}`);
                log(`        Timestamp: ${new Date(parseInt(status.timestamp) * 1000).toISOString()}`);
                log(`        Recipient: ${status.recipient_id}`);
              });
            }
            
            // Handle contact information
            if (value.contacts) {
              log(`    👤 ${value.contacts.length} contact(s):`, colors.blue);
              
              value.contacts.forEach((contact, contactIndex) => {
                log(`      Contact ${contactIndex + 1}:`, colors.cyan);
                log(`        WhatsApp ID: ${contact.wa_id}`);
                log(`        Name: ${contact.profile?.name || 'Unknown'}`);
              });
            }
          }
        });
      });
    } else {
      log(`Received non-WhatsApp webhook: ${data.object}`, colors.yellow);
    }
    
    // Save webhook data to file for debugging
    const webhookLogDir = path.join(__dirname, 'webhook-logs');
    if (!fs.existsSync(webhookLogDir)) {
      fs.mkdirSync(webhookLogDir);
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFile = path.join(webhookLogDir, `whatsapp-webhook-${timestamp}.json`);
    fs.writeFileSync(logFile, JSON.stringify(data, null, 2));
    log(`📝 Webhook data saved to: ${logFile}`, colors.blue);
    
  } catch (error) {
    log(`❌ Error processing webhook: ${error.message}`, colors.red);
    console.error(error);
  }

  res.status(200).send('OK');
});



// Instagram webhook endpoint - GET (for verification)
app.get('/api/webhooks/instagram', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  log(`Instagram webhook verification request received:`, colors.blue);
  log(`  Mode: ${mode}`);
  log(`  Token: ${token}`);
  log(`  Challenge: ${challenge}`);

  if (mode === 'subscribe' && token === process.env.INSTAGRAM_VERIFY_TOKEN) {
    log('✅ Instagram webhook verification successful!', colors.green);
    res.status(200).send(challenge);
  } else {
    log('❌ Instagram webhook verification failed!', colors.red);
    log(`Expected token: ${process.env.INSTAGRAM_VERIFY_TOKEN}`);
    res.status(403).send('Forbidden');
  }
});

// Instagram webhook endpoint - POST (for receiving messages)
app.post('/api/webhooks/instagram', (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const payload = JSON.stringify(req.body);

  log('Incoming Instagram webhook POST request:', colors.cyan);
  log(`  Signature: ${signature}`);
  log(`  Payload size: ${payload.length} bytes`);

  // Validate webhook signature for Instagram
  if (signature && process.env.INSTAGRAM_APP_SECRET) {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.INSTAGRAM_APP_SECRET)
      .update(payload)
      .digest('hex');

    if (signature === `sha256=${expectedSignature}`) {
      log('✅ Instagram webhook signature validated successfully!', colors.green);
    } else {
      log('❌ Invalid Instagram webhook signature!', colors.red);
      return res.status(403).send('Forbidden');
    }
  } else {
    log('⚠️  No Instagram signature validation (missing app secret)', colors.yellow);
  }

  // Process the Instagram webhook payload
  try {
    const data = req.body;
    
    if (data.object === 'instagram') {
      log('📸 Instagram webhook received', colors.green);
      
      data.entry?.forEach((entry, entryIndex) => {
        log(`\nEntry ${entryIndex + 1}:`, colors.blue);
        log(`  Instagram Account ID: ${entry.id}`);
        log(`  Time: ${new Date(entry.time * 1000).toISOString()}`);
        
        // Handle incoming messages
        if (entry.messaging) {
          log(`  📩 ${entry.messaging.length} messaging event(s):`, colors.green);
          
          entry.messaging.forEach((messaging, msgIndex) => {
            log(`    Event ${msgIndex + 1}:`, colors.cyan);
            log(`      Sender: ${messaging.sender?.id}`);
            log(`      Recipient: ${messaging.recipient?.id}`);
            log(`      Timestamp: ${new Date(messaging.timestamp).toISOString()}`);
            
            if (messaging.message) {
              log(`      Message:`, colors.green);
              log(`        ID: ${messaging.message.mid}`);
              
              if (messaging.message.text) {
                log(`        Text: "${messaging.message.text}"`);
              }
              
              if (messaging.message.attachments) {
                log(`        Attachments: ${messaging.message.attachments.length}`);
                messaging.message.attachments.forEach((attachment, attIndex) => {
                  log(`          ${attIndex + 1}. Type: ${attachment.type}, URL: ${attachment.payload?.url}`);
                });
              }
              
              if (messaging.message.quick_reply) {
                log(`        Quick Reply: ${messaging.message.quick_reply.payload}`);
              }
              
              if (messaging.message.reply_to) {
                log(`        Reply to: ${messaging.message.reply_to.mid}`);
              }
            }
            
            if (messaging.delivery) {
              log(`      Delivery:`, colors.yellow);
              log(`        Message IDs: ${messaging.delivery.mids?.join(', ')}`);
              log(`        Watermark: ${messaging.delivery.watermark}`);
            }
            
            if (messaging.read) {
              log(`      Read:`, colors.yellow);
              log(`        Watermark: ${messaging.read.watermark}`);
            }
            
            if (messaging.postback) {
              log(`      Postback:`, colors.blue);
              log(`        Payload: ${messaging.postback.payload}`);
              log(`        Title: ${messaging.postback.title}`);
            }
            
            if (messaging.reaction) {
              log(`      Reaction:`, colors.yellow);
              log(`        Emoji: ${messaging.reaction.emoji}`);
              log(`        Action: ${messaging.reaction.action}`);
              log(`        Target ID: ${messaging.reaction.mid}`);
            }
          });
        }
        
        // Handle story mentions
        if (entry.changes) {
          entry.changes.forEach((change, changeIndex) => {
            log(`  Change ${changeIndex + 1}:`, colors.blue);
            log(`    Field: ${change.field}`);
            
            if (change.value) {
              const value = change.value;
              
              if (change.field === 'mentions') {
                log(`    📖 Story mention:`, colors.green);
                log(`      Media ID: ${value.media_id}`);
                log(`      Comment ID: ${value.comment_id}`);
              }
              
              if (change.field === 'comments') {
                log(`    💬 Comment:`, colors.green);
                log(`      Comment ID: ${value.id}`);
                log(`      Text: "${value.text}"`);
                log(`      From: ${value.from?.id}`);
              }
            }
          });
        }
      });
    } else {
      log(`Received non-Instagram webhook: ${data.object}`, colors.yellow);
    }
    
    // Save webhook data to file for debugging
    const webhookLogDir = path.join(__dirname, 'webhook-logs');
    if (!fs.existsSync(webhookLogDir)) {
      fs.mkdirSync(webhookLogDir);
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFile = path.join(webhookLogDir, `instagram-webhook-${timestamp}.json`);
    fs.writeFileSync(logFile, JSON.stringify(data, null, 2));
    log(`📝 Instagram webhook data saved to: ${logFile}`, colors.blue);
    
  } catch (error) {
    log(`❌ Error processing Instagram webhook: ${error.message}`, colors.red);
    console.error(error);
  }

  res.status(200).send('OK');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: {
      whatsapp: {
        hasAccessToken: !!process.env.WHATSAPP_ACCESS_TOKEN,
        hasVerifyToken: !!process.env.WHATSAPP_VERIFY_TOKEN,
        hasWebhookSecret: !!process.env.WHATSAPP_WEBHOOK_SECRET
      },
      instagram: {
        hasAccessToken: !!process.env.INSTAGRAM_ACCESS_TOKEN,
        hasAppSecret: !!process.env.INSTAGRAM_APP_SECRET,
        hasVerifyToken: !!process.env.INSTAGRAM_VERIFY_TOKEN,
        hasPageId: !!process.env.INSTAGRAM_PAGE_ID
      },
      port: PORT
    }
  });
});

// Start server
app.listen(PORT, () => {
  log(`🚀 Multi-Channel Webhook Test Server started`, colors.green);
  log(`📡 Server running on port ${PORT}`, colors.blue);
  log(`🔗 WhatsApp webhook: http://localhost:${PORT}/api/webhooks/whatsapp`, colors.cyan);
  log(`🔗 Instagram webhook: http://localhost:${PORT}/api/webhooks/instagram`, colors.cyan);
  log(`❤️  Health check: http://localhost:${PORT}/health`, colors.cyan);
  
  // Display WhatsApp environment status
  log('\n📋 WhatsApp Environment Status:', colors.bright);
  log(`  WHATSAPP_ACCESS_TOKEN: ${process.env.WHATSAPP_ACCESS_TOKEN ? '✅ Set' : '❌ Missing'}`, 
      process.env.WHATSAPP_ACCESS_TOKEN ? colors.green : colors.red);
  log(`  WHATSAPP_VERIFY_TOKEN: ${process.env.WHATSAPP_VERIFY_TOKEN ? '✅ Set' : '❌ Missing'}`, 
      process.env.WHATSAPP_VERIFY_TOKEN ? colors.green : colors.red);
  log(`  WHATSAPP_WEBHOOK_SECRET: ${process.env.WHATSAPP_WEBHOOK_SECRET ? '✅ Set' : '❌ Missing'}`, 
      process.env.WHATSAPP_WEBHOOK_SECRET ? colors.green : colors.red);
  

  
  // Display Instagram environment status
  log('\n📋 Instagram Environment Status:', colors.bright);
  log(`  INSTAGRAM_ACCESS_TOKEN: ${process.env.INSTAGRAM_ACCESS_TOKEN ? '✅ Set' : '❌ Missing'}`, 
      process.env.INSTAGRAM_ACCESS_TOKEN ? colors.green : colors.red);
  log(`  INSTAGRAM_APP_SECRET: ${process.env.INSTAGRAM_APP_SECRET ? '✅ Set' : '❌ Missing'}`, 
      process.env.INSTAGRAM_APP_SECRET ? colors.green : colors.red);
  log(`  INSTAGRAM_VERIFY_TOKEN: ${process.env.INSTAGRAM_VERIFY_TOKEN ? '✅ Set' : '❌ Missing'}`, 
      process.env.INSTAGRAM_VERIFY_TOKEN ? colors.green : colors.red);
  log(`  INSTAGRAM_PAGE_ID: ${process.env.INSTAGRAM_PAGE_ID ? '✅ Set' : '❌ Missing'}`, 
      process.env.INSTAGRAM_PAGE_ID ? colors.green : colors.red);
  
  // Display warnings for missing credentials
  const missingWhatsApp = [];
  const missingInstagram = [];
  
  if (!process.env.WHATSAPP_VERIFY_TOKEN) missingWhatsApp.push('WHATSAPP_VERIFY_TOKEN');
  if (!process.env.WHATSAPP_WEBHOOK_SECRET) missingWhatsApp.push('WHATSAPP_WEBHOOK_SECRET');
  
  if (!process.env.INSTAGRAM_VERIFY_TOKEN) missingInstagram.push('INSTAGRAM_VERIFY_TOKEN');
  if (!process.env.INSTAGRAM_APP_SECRET) missingInstagram.push('INSTAGRAM_APP_SECRET');
  
  if (missingWhatsApp.length > 0) {
    log(`\n⚠️  Missing WhatsApp credentials: ${missingWhatsApp.join(', ')}`, colors.yellow);
  }
  
  if (missingInstagram.length > 0) {
    log(`⚠️  Missing Instagram credentials: ${missingInstagram.join(', ')}`, colors.yellow);
  }
  
  log('\n🎯 Test webhook verification:', colors.bright);
  if (process.env.WHATSAPP_VERIFY_TOKEN) {
    log(`WhatsApp: curl "http://localhost:${PORT}/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=${process.env.WHATSAPP_VERIFY_TOKEN}&hub.challenge=test123"`, colors.cyan);
  }
  if (process.env.INSTAGRAM_VERIFY_TOKEN) {
    log(`Instagram: curl "http://localhost:${PORT}/api/webhooks/instagram?hub.mode=subscribe&hub.verify_token=${process.env.INSTAGRAM_VERIFY_TOKEN}&hub.challenge=test123"`, colors.cyan);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  log('\n👋 Shutting down webhook test server...', colors.yellow);
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('\n👋 Shutting down webhook test server...', colors.yellow);
  process.exit(0);
});