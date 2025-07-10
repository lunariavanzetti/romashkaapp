#!/usr/bin/env node

/**
 * WhatsApp Cloud API Webhook Setup Script
 * 
 * This script helps you set up and test your WhatsApp Business Cloud API webhook
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

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
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${colors.bright}${colors.blue}Step ${step}:${colors.reset} ${message}`);
}

function logSuccess(message) {
  log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logError(message) {
  log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logWarning(message) {
  log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

class WhatsAppWebhookSetup {
  constructor() {
    this.config = this.loadConfig();
  }

  loadConfig() {
    const envPath = path.join(__dirname, '.env');
    
    if (!fs.existsSync(envPath)) {
      logError('No .env file found! Please create one from .env.example');
      log('\nRun: cp .env.example .env');
      log('Then edit .env with your WhatsApp credentials');
      process.exit(1);
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const config = {};

    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value && !key.startsWith('#')) {
        config[key.trim()] = value.trim();
      }
    });

    return config;
  }

  validateConfig() {
    logStep(1, 'Validating WhatsApp Configuration');

    const requiredFields = [
      'WHATSAPP_PHONE_NUMBER_ID',
      'WHATSAPP_ACCESS_TOKEN',
      'WHATSAPP_WEBHOOK_SECRET',
      'WHATSAPP_VERIFY_TOKEN',
      'WHATSAPP_BUSINESS_ACCOUNT_ID'
    ];

    const missing = requiredFields.filter(field => 
      !this.config[field] || this.config[field].includes('your_') || this.config[field].includes('here')
    );

    if (missing.length > 0) {
      logError('Missing or incomplete WhatsApp configuration:');
      missing.forEach(field => log(`  - ${field}`));
      log('\nPlease update your .env file with real values');
      return false;
    }

    logSuccess('All WhatsApp configuration fields are present');
    return true;
  }

  generateWebhookInfo() {
    logStep(2, 'Webhook Configuration Information');

    const domain = process.env.WEBHOOK_DOMAIN || 'your-domain.com';
    const webhookUrl = `https://${domain}/api/webhooks/whatsapp`;

    log(`\n${colors.bright}Webhook URL:${colors.reset}`);
    log(`${colors.cyan}${webhookUrl}${colors.reset}`);

    log(`\n${colors.bright}Verify Token:${colors.reset}`);
    log(`${colors.cyan}${this.config.WHATSAPP_VERIFY_TOKEN}${colors.reset}`);

    log(`\n${colors.bright}Webhook Secret:${colors.reset}`);
    log(`${colors.cyan}${this.config.WHATSAPP_WEBHOOK_SECRET}${colors.reset}`);

    return { webhookUrl, verifyToken: this.config.WHATSAPP_VERIFY_TOKEN };
  }

  async testWebhookVerification(webhookUrl, verifyToken) {
    logStep(3, 'Testing Webhook Verification');

    return new Promise((resolve) => {
      const testUrl = `${webhookUrl}?hub.mode=subscribe&hub.verify_token=${verifyToken}&hub.challenge=test_challenge_123`;
      
      log(`Testing: ${testUrl}`);

      const request = https.get(testUrl, (response) => {
        let data = '';

        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          if (response.statusCode === 200 && data === 'test_challenge_123') {
            logSuccess('Webhook verification test passed!');
            resolve(true);
          } else {
            logError(`Webhook verification failed. Status: ${response.statusCode}, Response: ${data}`);
            resolve(false);
          }
        });
      });

      request.on('error', (error) => {
        logError(`Webhook test failed: ${error.message}`);
        logWarning('This is expected if your webhook endpoint is not yet deployed');
        resolve(false);
      });

      request.setTimeout(10000, () => {
        request.destroy();
        logWarning('Webhook test timed out - this is expected if your endpoint is not deployed yet');
        resolve(false);
      });
    });
  }

  validateWebhookSignature(payload, signature) {
    logStep(4, 'Testing Webhook Signature Validation');

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.config.WHATSAPP_WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');

      const isValid = signature === `sha256=${expectedSignature}`;
      
      if (isValid) {
        logSuccess('Webhook signature validation working correctly');
      } else {
        logError('Webhook signature validation failed');
      }

      return isValid;
    } catch (error) {
      logError(`Signature validation error: ${error.message}`);
      return false;
    }
  }

  generateSampleWebhookPayload() {
    logStep(5, 'Sample Webhook Payload');

    const samplePayload = {
      object: "whatsapp_business_account",
      entry: [{
        id: this.config.WHATSAPP_BUSINESS_ACCOUNT_ID,
        changes: [{
          value: {
            messaging_product: "whatsapp",
            metadata: {
              display_phone_number: "1234567890",
              phone_number_id: this.config.WHATSAPP_PHONE_NUMBER_ID
            },
            contacts: [{
              profile: { name: "Test User" },
              wa_id: "1234567890"
            }],
            messages: [{
              from: "1234567890",
              id: "wamid.test123",
              timestamp: Math.floor(Date.now() / 1000).toString(),
              text: { body: "Hello from WhatsApp!" },
              type: "text"
            }]
          },
          field: "messages"
        }]
      }]
    };

    log('\nSample incoming message payload:');
    log(JSON.stringify(samplePayload, null, 2));

    return samplePayload;
  }

  async testMessageSending() {
    logStep(6, 'Testing Message Sending (Optional)');

    logWarning('To test message sending, you need a verified phone number');
    log('\nSample code to send a test message:');

    const sampleCode = `
const response = await fetch('https://graph.facebook.com/v18.0/${this.config.WHATSAPP_PHONE_NUMBER_ID}/messages', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${this.config.WHATSAPP_ACCESS_TOKEN}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    messaging_product: 'whatsapp',
    to: 'VERIFIED_PHONE_NUMBER', // Replace with your verified number
    type: 'text',
    text: { body: 'Hello from ROMASHKA WhatsApp integration!' }
  })
});

const result = await response.json();
console.log('Message sent:', result);`;

    log(sampleCode);
  }

  displaySetupInstructions() {
    logStep(7, 'Meta Developer Console Setup Instructions');

    log(`\n${colors.bright}Follow these steps in Meta Developer Console:${colors.reset}`);
    
    log('\n1. Go to https://developers.facebook.com/');
    log('2. Select your WhatsApp Business app');
    log('3. Navigate to WhatsApp > Configuration');
    log('4. In the Webhook section:');
    log(`   - Callback URL: ${colors.cyan}https://your-domain.com/api/webhooks/whatsapp${colors.reset}`);
    log(`   - Verify Token: ${colors.cyan}${this.config.WHATSAPP_VERIFY_TOKEN}${colors.reset}`);
    log('5. Click "Verify and Save"');
    log('6. Subscribe to webhook fields:');
    log('   ✅ messages');
    log('   ✅ message_deliveries');
    log('   ✅ message_reads');
    log('   ✅ message_echoes (optional)');

    log(`\n${colors.bright}Important Notes:${colors.reset}`);
    log('• Your webhook URL must be publicly accessible via HTTPS');
    log('• Meta will make a GET request to verify your webhook');
    log('• Your webhook must respond with the challenge parameter');
    log('• POST requests will contain the actual webhook data');
  }

  displayNextSteps() {
    log(`\n${colors.bright}${colors.green}🎉 Webhook Setup Complete!${colors.reset}`);
    
    log(`\n${colors.bright}Next Steps:${colors.reset}`);
    log('1. Deploy your application with webhook endpoints');
    log('2. Update the webhook URL in Meta Developer Console');
    log('3. Test with a real WhatsApp message');
    log('4. Monitor webhook logs for incoming messages');

    log(`\n${colors.bright}Troubleshooting:${colors.reset}`);
    log('• Check webhook logs if messages are not received');
    log('• Verify webhook signature validation is working');
    log('• Ensure your phone number is added to the app');
    log('• Test webhook URL accessibility from external sources');
  }

  async run() {
    log(`${colors.bright}${colors.cyan}🚀 WhatsApp Cloud API Webhook Setup${colors.reset}\n`);

    // Validate configuration
    if (!this.validateConfig()) {
      return;
    }

    // Generate webhook info
    const { webhookUrl, verifyToken } = this.generateWebhookInfo();

    // Test webhook verification (optional)
    await this.testWebhookVerification(webhookUrl, verifyToken);

    // Test signature validation
    const testPayload = JSON.stringify({ test: 'data' });
    const testSignature = crypto
      .createHmac('sha256', this.config.WHATSAPP_WEBHOOK_SECRET)
      .update(testPayload)
      .digest('hex');
    this.validateWebhookSignature(testPayload, `sha256=${testSignature}`);

    // Generate sample payload
    this.generateSampleWebhookPayload();

    // Test message sending
    await this.testMessageSending();

    // Display setup instructions
    this.displaySetupInstructions();

    // Display next steps
    this.displayNextSteps();
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  const setup = new WhatsAppWebhookSetup();
  setup.run().catch(console.error);
}

module.exports = WhatsAppWebhookSetup;