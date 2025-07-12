#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * Checks if all required environment variables are properly set
 */

const fs = require('fs');
const path = require('path');

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

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

class EnvValidator {
  constructor() {
    this.config = this.loadConfig();
    this.errors = [];
    this.warnings = [];
  }

  loadConfig() {
    const envPath = path.join(__dirname, '.env');
    
    if (!fs.existsSync(envPath)) {
      logError('No .env file found!');
      logInfo('Please create one from .env.example: cp .env.example .env');
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

  validateWhatsApp() {
    log('\n🔍 Validating WhatsApp Configuration...', colors.bright);
    
    const required = [
      'WHATSAPP_PHONE_NUMBER_ID',
      'WHATSAPP_ACCESS_TOKEN', 
      'WHATSAPP_WEBHOOK_SECRET',
      'WHATSAPP_VERIFY_TOKEN',
      'WHATSAPP_BUSINESS_ACCOUNT_ID'
    ];

    const patterns = {
      'WHATSAPP_PHONE_NUMBER_ID': /^\d+$/,
      'WHATSAPP_ACCESS_TOKEN': /^[A-Za-z0-9_-]+$/,
      'WHATSAPP_WEBHOOK_SECRET': /^.{8,}$/,
      'WHATSAPP_VERIFY_TOKEN': /^.{8,}$/,
      'WHATSAPP_BUSINESS_ACCOUNT_ID': /^\d+$/
    };

    const descriptions = {
      'WHATSAPP_PHONE_NUMBER_ID': 'Phone Number ID (numeric)',
      'WHATSAPP_ACCESS_TOKEN': 'Access Token (alphanumeric)',
      'WHATSAPP_WEBHOOK_SECRET': 'Webhook Secret (min 8 chars)',
      'WHATSAPP_VERIFY_TOKEN': 'Verify Token (min 8 chars)',
      'WHATSAPP_BUSINESS_ACCOUNT_ID': 'Business Account ID (numeric)'
    };

    required.forEach(key => {
      const value = this.config[key];
      const pattern = patterns[key];
      const description = descriptions[key];
      
      if (!value) {
        this.errors.push(`Missing ${key}`);
        logError(`${description} - NOT SET`);
      } else if (value.includes('your_') || value.includes('here')) {
        this.errors.push(`${key} contains placeholder text`);
        logError(`${description} - PLACEHOLDER VALUE`);
      } else if (pattern && !pattern.test(value)) {
        this.errors.push(`${key} format invalid`);
        logError(`${description} - INVALID FORMAT`);
      } else {
        logSuccess(`${description} - OK (${value.length} chars)`);
      }
    });
  }

  validateInstagram() {
    log('\n🔍 Validating Instagram Configuration...', colors.bright);
    
    const required = [
      'INSTAGRAM_ACCESS_TOKEN',
      'INSTAGRAM_APP_SECRET',
      'INSTAGRAM_VERIFY_TOKEN',
      'INSTAGRAM_PAGE_ID'
    ];

    const patterns = {
      'INSTAGRAM_ACCESS_TOKEN': /^[A-Za-z0-9_-]+$/,
      'INSTAGRAM_APP_SECRET': /^[A-Za-z0-9]+$/,
      'INSTAGRAM_VERIFY_TOKEN': /^.{8,}$/,
      'INSTAGRAM_PAGE_ID': /^\d+$/
    };

    const descriptions = {
      'INSTAGRAM_ACCESS_TOKEN': 'Access Token (alphanumeric)',
      'INSTAGRAM_APP_SECRET': 'App Secret (alphanumeric)',
      'INSTAGRAM_VERIFY_TOKEN': 'Verify Token (min 8 chars)',
      'INSTAGRAM_PAGE_ID': 'Business Account ID (numeric)'
    };

    required.forEach(key => {
      const value = this.config[key];
      const pattern = patterns[key];
      const description = descriptions[key];
      
      if (!value) {
        this.errors.push(`Missing ${key}`);
        logError(`${description} - NOT SET`);
      } else if (value.includes('your_') || value.includes('here')) {
        this.errors.push(`${key} contains placeholder text`);
        logError(`${description} - PLACEHOLDER VALUE`);
      } else if (pattern && !pattern.test(value)) {
        this.errors.push(`${key} format invalid`);
        logError(`${description} - INVALID FORMAT`);
      } else {
        logSuccess(`${description} - OK (${value.length} chars)`);
      }
    });
  }

  validateOptional() {
    log('\n🔍 Checking Optional Configuration...', colors.bright);
    
    const optional = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_OPENAI_API_KEY'
    ];

    optional.forEach(key => {
      const value = this.config[key];
      if (!value || value.includes('your_')) {
        logWarning(`${key} - Not configured (optional)`);
      } else {
        logSuccess(`${key} - OK`);
      }
    });
  }

  validateFormats() {
    log('\n🔍 Validating Token Formats...', colors.bright);
    
    // WhatsApp Token Format Validation
    const whatsappToken = this.config['WHATSAPP_ACCESS_TOKEN'];
    if (whatsappToken) {
      if (whatsappToken.startsWith('EAA')) {
        logSuccess('WhatsApp Access Token - Correct Facebook format');
      } else {
        logWarning('WhatsApp Access Token - May not be Facebook format');
      }
    }

    // Instagram Token Format Validation
    const instagramToken = this.config['INSTAGRAM_ACCESS_TOKEN'];
    if (instagramToken) {
      if (instagramToken.startsWith('EAA') || instagramToken.startsWith('IGQ')) {
        logSuccess('Instagram Access Token - Correct format');
      } else {
        logWarning('Instagram Access Token - May not be correct format');
      }
    }

    // Phone Number ID Format
    const phoneNumberId = this.config['WHATSAPP_PHONE_NUMBER_ID'];
    if (phoneNumberId) {
      if (phoneNumberId.length >= 10) {
        logSuccess('WhatsApp Phone Number ID - Correct length');
      } else {
        logWarning('WhatsApp Phone Number ID - May be too short');
      }
    }

    // Business Account ID Format
    const businessAccountId = this.config['WHATSAPP_BUSINESS_ACCOUNT_ID'];
    if (businessAccountId) {
      if (businessAccountId.length >= 10) {
        logSuccess('WhatsApp Business Account ID - Correct length');
      } else {
        logWarning('WhatsApp Business Account ID - May be too short');
      }
    }
  }

  checkSecurity() {
    log('\n🔍 Security Validation...', colors.bright);
    
    const securityChecks = [
      'WHATSAPP_WEBHOOK_SECRET',
      'WHATSAPP_VERIFY_TOKEN',
      'INSTAGRAM_VERIFY_TOKEN'
    ];

    securityChecks.forEach(key => {
      const value = this.config[key];
      if (value) {
        if (value.length < 8) {
          this.warnings.push(`${key} should be at least 8 characters`);
          logWarning(`${key} - Too short (should be 8+ chars)`);
        } else if (value.match(/^[a-zA-Z0-9]{8,}$/)) {
          logSuccess(`${key} - Good security format`);
        } else {
          logWarning(`${key} - Consider using alphanumeric characters`);
        }
      }
    });
  }

  generateReport() {
    log('\n📊 Validation Report', colors.bright);
    
    if (this.errors.length === 0) {
      logSuccess('All required environment variables are properly configured!');
    } else {
      logError(`Found ${this.errors.length} error(s):`);
      this.errors.forEach(error => log(`  • ${error}`, colors.red));
    }

    if (this.warnings.length > 0) {
      logWarning(`Found ${this.warnings.length} warning(s):`);
      this.warnings.forEach(warning => log(`  • ${warning}`, colors.yellow));
    }

    log('\n📋 Next Steps:', colors.bright);
    
    if (this.errors.length > 0) {
      log('1. Fix the errors listed above', colors.red);
      log('2. Run this validation script again', colors.red);
    } else {
      log('1. Test your webhook server: npm run test:webhook', colors.green);
      log('2. Test WhatsApp setup: npm run setup:whatsapp', colors.green);
      log('3. Configure webhooks in Meta Developer Console', colors.green);
    }
  }

  run() {
    log('🔍 ROMASHKA Environment Variables Validation', colors.cyan);
    log('=' .repeat(50), colors.cyan);
    
    this.validateWhatsApp();
    this.validateInstagram();
    this.validateOptional();
    this.validateFormats();
    this.checkSecurity();
    this.generateReport();
  }
}

// Run validation
const validator = new EnvValidator();
validator.run();