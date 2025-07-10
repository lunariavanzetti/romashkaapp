#!/usr/bin/env node

/**
 * ROMASHKA Database Schema Verification Script
 * 
 * This script verifies the complete database schema, checking:
 * - Table existence and structure
 * - Indexes and constraints
 * - Foreign key relationships
 * - RLS policies
 * - Functions and triggers
 * - Data integrity
 * 
 * Usage: node verify-schema.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'romashka',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
};

// Expected tables and their critical columns
const expectedTables = {
  'profiles': ['id', 'email', 'full_name', 'role', 'created_at', 'updated_at'],
  'customer_profiles': ['id', 'email', 'name', 'status', 'created_at', 'updated_at'],
  'agent_availability': ['id', 'agent_id', 'is_online', 'status', 'created_at', 'updated_at'],
  'canned_responses': ['id', 'title', 'content', 'category', 'language', 'created_at', 'updated_at'],
  'communication_channels': ['id', 'name', 'type', 'status', 'configuration', 'created_at', 'updated_at'],
  'message_templates': ['id', 'name', 'language', 'category', 'template_content', 'channel_type', 'status'],
  'customer_channel_preferences': ['id', 'customer_id', 'channel_type', 'is_preferred', 'opt_in'],
  'channel_routing_rules': ['id', 'name', 'priority', 'conditions', 'target_channel_type', 'is_active'],
  'conversations': ['id', 'customer_id', 'assigned_agent_id', 'status', 'priority', 'channel_type', 'created_at', 'updated_at'],
  'messages': ['id', 'conversation_id', 'sender_type', 'content', 'channel_type', 'created_at', 'updated_at'],
  'conversation_notes': ['id', 'conversation_id', 'agent_id', 'note', 'is_internal', 'created_at', 'updated_at'],
  'file_attachments': ['id', 'conversation_id', 'message_id', 'filename', 'file_path', 'file_size', 'mime_type'],
  'conversation_transfers': ['id', 'conversation_id', 'from_agent_id', 'to_agent_id', 'transfer_reason', 'transfer_type', 'status'],
  'sla_tracking': ['id', 'conversation_id', 'sla_type', 'target_time_seconds', 'actual_time_seconds', 'status'],
  'message_delivery_tracking': ['id', 'message_id', 'channel_type', 'delivery_status', 'created_at', 'updated_at'],
  'knowledge_categories': ['id', 'name', 'description', 'parent_id', 'order_index', 'is_active'],
  'knowledge_items': ['id', 'title', 'content', 'category_id', 'source_type', 'language', 'status', 'created_at', 'updated_at'],
  'knowledge_versions': ['id', 'knowledge_item_id', 'version', 'content', 'changes_description', 'created_at'],
  'knowledge_analytics': ['id', 'knowledge_item_id', 'conversation_id', 'was_helpful', 'usage_context', 'created_at'],
  'integrations': ['id', 'name', 'type', 'provider', 'status', 'configuration', 'credentials', 'created_at', 'updated_at'],
  'integration_field_mappings': ['id', 'integration_id', 'source_entity', 'target_entity', 'source_field', 'target_field'],
  'sync_jobs': ['id', 'integration_id', 'job_type', 'direction', 'status', 'records_processed', 'records_total'],
  'webhook_events': ['id', 'channel_id', 'event_type', 'source', 'payload', 'processed', 'created_at'],
  'webhook_subscriptions': ['id', 'integration_id', 'event_type', 'webhook_url', 'is_active', 'created_at'],
  'webhook_logs': ['id', 'webhook_subscription_id', 'event_type', 'response_status', 'created_at'],
  'daily_metrics': ['id', 'date', 'channel_type', 'agent_id', 'total_conversations', 'ai_resolved_conversations'],
  'realtime_metrics': ['id', 'metric_name', 'metric_value', 'dimensions', 'timestamp', 'expires_at'],
  'conversation_analytics': ['id', 'conversation_id', 'started_at', 'total_messages', 'customer_messages', 'ai_messages'],
  'dashboard_configs': ['id', 'user_id', 'name', 'is_default', 'layout', 'filters', 'refresh_interval'],
  'scheduled_reports': ['id', 'name', 'description', 'report_type', 'schedule_cron', 'recipients', 'format'],
  'playground_sessions': ['id', 'user_id', 'session_name', 'bot_configuration', 'test_conversations', 'performance_metrics'],
  'widget_configurations': ['id', 'user_id', 'widget_name', 'domain', 'configuration', 'status', 'created_at', 'updated_at'],
  'workflows': ['id', 'user_id', 'name', 'description', 'trigger_type', 'trigger_conditions', 'steps', 'nodes', 'connections'],
  'workflow_executions': ['id', 'workflow_id', 'conversation_id', 'status', 'started_at', 'execution_log'],
  'website_scan_jobs': ['id', 'user_id', 'urls', 'status', 'progress_percentage', 'pages_found', 'pages_processed'],
  'extracted_content': ['id', 'scan_job_id', 'url', 'title', 'content', 'content_type', 'created_at'],
  'intent_patterns': ['id', 'intent_name', 'language', 'patterns', 'examples', 'confidence_threshold', 'is_active'],
  'conversation_context': ['id', 'conversation_id', 'context_data', 'last_intent', 'conversation_summary', 'updated_at'],
  'system_settings': ['id', 'setting_key', 'setting_value', 'description', 'is_public', 'updated_at'],
  'audit_logs': ['id', 'user_id', 'action', 'entity_type', 'entity_id', 'changes', 'created_at']
};

// Expected indexes
const expectedIndexes = [
  'idx_conversations_customer_id',
  'idx_conversations_agent_id',
  'idx_conversations_status',
  'idx_conversations_created_at',
  'idx_messages_conversation_id',
  'idx_messages_sender_type',
  'idx_messages_created_at',
  'idx_customer_profiles_email',
  'idx_knowledge_items_category_id',
  'idx_knowledge_items_status',
  'idx_daily_metrics_date',
  'idx_agent_availability_agent_id',
  'idx_webhook_events_processed',
  'idx_canned_responses_category'
];

// Expected functions
const expectedFunctions = [
  'update_updated_at_column',
  'update_conversation_message_count',
  'auto_assign_conversation',
  'update_agent_chat_count',
  'update_customer_stats',
  'update_knowledge_usage',
  'create_conversation_analytics',
  'update_conversation_analytics',
  'finalize_conversation_analytics',
  'aggregate_daily_metrics',
  'cleanup_expired_metrics'
];

// Expected foreign keys
const expectedForeignKeys = [
  { table: 'agent_availability', column: 'agent_id', references: 'profiles(id)' },
  { table: 'conversations', column: 'customer_id', references: 'customer_profiles(id)' },
  { table: 'conversations', column: 'assigned_agent_id', references: 'profiles(id)' },
  { table: 'messages', column: 'conversation_id', references: 'conversations(id)' },
  { table: 'knowledge_items', column: 'category_id', references: 'knowledge_categories(id)' },
  { table: 'canned_responses', column: 'created_by', references: 'profiles(id)' },
  { table: 'workflows', column: 'user_id', references: 'profiles(id)' },
  { table: 'dashboard_configs', column: 'user_id', references: 'profiles(id)' }
];

class SchemaVerifier {
  constructor() {
    this.client = new Client(config);
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      details: []
    };
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('✅ Connected to database');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      process.exit(1);
    }
  }

  async disconnect() {
    await this.client.end();
  }

  log(type, message, details = null) {
    const icons = { pass: '✅', fail: '❌', warn: '⚠️', info: 'ℹ️' };
    console.log(`${icons[type]} ${message}`);
    
    if (details) {
      console.log(`   ${details}`);
    }

    this.results.details.push({ type, message, details });
    
    if (type === 'pass') this.results.passed++;
    else if (type === 'fail') this.results.failed++;
    else if (type === 'warn') this.results.warnings++;
  }

  async checkTableExists(tableName) {
    try {
      const result = await this.client.query(
        `SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`,
        [tableName]
      );
      return result.rows[0].exists;
    } catch (error) {
      return false;
    }
  }

  async checkTableColumns(tableName, expectedColumns) {
    try {
      const result = await this.client.query(
        `SELECT column_name, data_type, is_nullable, column_default
         FROM information_schema.columns
         WHERE table_schema = 'public' 
         AND table_name = $1
         ORDER BY ordinal_position`,
        [tableName]
      );

      const actualColumns = result.rows.map(row => row.column_name);
      const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));
      
      if (missingColumns.length > 0) {
        this.log('fail', `Table ${tableName} missing columns: ${missingColumns.join(', ')}`);
        return false;
      }

      return true;
    } catch (error) {
      this.log('fail', `Error checking columns for ${tableName}: ${error.message}`);
      return false;
    }
  }

  async checkIndexExists(indexName) {
    try {
      const result = await this.client.query(
        `SELECT EXISTS (
          SELECT 1 FROM pg_indexes 
          WHERE schemaname = 'public' 
          AND indexname = $1
        )`,
        [indexName]
      );
      return result.rows[0].exists;
    } catch (error) {
      return false;
    }
  }

  async checkFunctionExists(functionName) {
    try {
      const result = await this.client.query(
        `SELECT EXISTS (
          SELECT 1 FROM pg_proc p
          JOIN pg_namespace n ON p.pronamespace = n.oid
          WHERE n.nspname = 'public' 
          AND p.proname = $1
        )`,
        [functionName]
      );
      return result.rows[0].exists;
    } catch (error) {
      return false;
    }
  }

  async checkForeignKey(fkInfo) {
    try {
      const result = await this.client.query(
        `SELECT EXISTS (
          SELECT 1 FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = $1
          AND kcu.column_name = $2
        )`,
        [fkInfo.table, fkInfo.column]
      );
      return result.rows[0].exists;
    } catch (error) {
      return false;
    }
  }

  async checkRLSEnabled(tableName) {
    try {
      const result = await this.client.query(
        `SELECT relrowsecurity FROM pg_class 
         WHERE relname = $1 AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')`,
        [tableName]
      );
      return result.rows.length > 0 && result.rows[0].relrowsecurity;
    } catch (error) {
      return false;
    }
  }

  async checkExtensionExists(extensionName) {
    try {
      const result = await this.client.query(
        `SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = $1)`,
        [extensionName]
      );
      return result.rows[0].exists;
    } catch (error) {
      return false;
    }
  }

  async checkTriggerExists(triggerName, tableName) {
    try {
      const result = await this.client.query(
        `SELECT EXISTS (
          SELECT 1 FROM information_schema.triggers 
          WHERE trigger_name = $1 AND event_object_table = $2
        )`,
        [triggerName, tableName]
      );
      return result.rows[0].exists;
    } catch (error) {
      return false;
    }
  }

  async verifyExtensions() {
    console.log('\n🔍 Checking PostgreSQL Extensions...');
    
    const requiredExtensions = ['uuid-ossp', 'pg_stat_statements', 'pg_trgm', 'pgcrypto'];
    
    for (const extension of requiredExtensions) {
      const exists = await this.checkExtensionExists(extension);
      if (exists) {
        this.log('pass', `Extension ${extension} is installed`);
      } else {
        this.log('fail', `Extension ${extension} is missing`);
      }
    }
  }

  async verifyTables() {
    console.log('\n🔍 Checking Tables...');
    
    const tableNames = Object.keys(expectedTables);
    
    for (const tableName of tableNames) {
      const exists = await this.checkTableExists(tableName);
      
      if (exists) {
        this.log('pass', `Table ${tableName} exists`);
        
        // Check columns
        const columnsOk = await this.checkTableColumns(tableName, expectedTables[tableName]);
        if (columnsOk) {
          this.log('pass', `Table ${tableName} has required columns`);
        }
        
        // Check RLS
        const rlsEnabled = await this.checkRLSEnabled(tableName);
        if (rlsEnabled) {
          this.log('pass', `Table ${tableName} has RLS enabled`);
        } else {
          this.log('warn', `Table ${tableName} does not have RLS enabled`);
        }
      } else {
        this.log('fail', `Table ${tableName} does not exist`);
      }
    }
  }

  async verifyIndexes() {
    console.log('\n🔍 Checking Indexes...');
    
    for (const indexName of expectedIndexes) {
      const exists = await this.checkIndexExists(indexName);
      
      if (exists) {
        this.log('pass', `Index ${indexName} exists`);
      } else {
        this.log('fail', `Index ${indexName} is missing`);
      }
    }
  }

  async verifyFunctions() {
    console.log('\n🔍 Checking Functions...');
    
    for (const functionName of expectedFunctions) {
      const exists = await this.checkFunctionExists(functionName);
      
      if (exists) {
        this.log('pass', `Function ${functionName} exists`);
      } else {
        this.log('fail', `Function ${functionName} is missing`);
      }
    }
  }

  async verifyForeignKeys() {
    console.log('\n🔍 Checking Foreign Keys...');
    
    for (const fkInfo of expectedForeignKeys) {
      const exists = await this.checkForeignKey(fkInfo);
      
      if (exists) {
        this.log('pass', `Foreign key ${fkInfo.table}.${fkInfo.column} exists`);
      } else {
        this.log('fail', `Foreign key ${fkInfo.table}.${fkInfo.column} is missing`);
      }
    }
  }

  async verifyTriggers() {
    console.log('\n🔍 Checking Triggers...');
    
    const expectedTriggers = [
      { name: 'update_profiles_updated_at', table: 'profiles' },
      { name: 'update_conversations_updated_at', table: 'conversations' },
      { name: 'trigger_update_conversation_message_count', table: 'messages' },
      { name: 'trigger_create_conversation_analytics', table: 'conversations' },
      { name: 'trigger_update_agent_chat_count', table: 'conversations' }
    ];
    
    for (const trigger of expectedTriggers) {
      const exists = await this.checkTriggerExists(trigger.name, trigger.table);
      
      if (exists) {
        this.log('pass', `Trigger ${trigger.name} exists on ${trigger.table}`);
      } else {
        this.log('fail', `Trigger ${trigger.name} is missing on ${trigger.table}`);
      }
    }
  }

  async verifyDataIntegrity() {
    console.log('\n🔍 Checking Data Integrity...');
    
    try {
      // Check for orphaned records
      const orphanedMessages = await this.client.query(
        `SELECT COUNT(*) as count FROM messages m 
         WHERE NOT EXISTS (SELECT 1 FROM conversations c WHERE c.id = m.conversation_id)`
      );
      
      if (orphanedMessages.rows[0].count > 0) {
        this.log('warn', `Found ${orphanedMessages.rows[0].count} orphaned messages`);
      } else {
        this.log('pass', 'No orphaned messages found');
      }

      // Check for conversations without customer profiles
      const conversationsWithoutCustomers = await this.client.query(
        `SELECT COUNT(*) as count FROM conversations c 
         WHERE c.customer_id IS NOT NULL 
         AND NOT EXISTS (SELECT 1 FROM customer_profiles cp WHERE cp.id = c.customer_id)`
      );
      
      if (conversationsWithoutCustomers.rows[0].count > 0) {
        this.log('warn', `Found ${conversationsWithoutCustomers.rows[0].count} conversations without customer profiles`);
      } else {
        this.log('pass', 'All conversations have valid customer profiles');
      }

    } catch (error) {
      this.log('fail', `Error checking data integrity: ${error.message}`);
    }
  }

  async verifyPerformance() {
    console.log('\n🔍 Checking Performance...');
    
    try {
      // Check table sizes
      const tableSizes = await this.client.query(`
        SELECT 
          schemaname as schema,
          tablename as table,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          pg_total_relation_size(schemaname||'.'||tablename) as bytes
        FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 10
      `);
      
      this.log('info', 'Top 10 largest tables:');
      tableSizes.rows.forEach(row => {
        console.log(`   ${row.table}: ${row.size}`);
      });

      // Check for missing indexes on large tables
      const largeTablesWithoutIndexes = tableSizes.rows.filter(row => 
        row.bytes > 1000000 && // > 1MB
        !expectedIndexes.some(idx => idx.includes(row.table))
      );
      
      if (largeTablesWithoutIndexes.length > 0) {
        this.log('warn', `Large tables without proper indexes: ${largeTablesWithoutIndexes.map(t => t.table).join(', ')}`);
      } else {
        this.log('pass', 'All large tables have proper indexes');
      }

    } catch (error) {
      this.log('fail', `Error checking performance: ${error.message}`);
    }
  }

  async generateReport() {
    console.log('\n📊 Verification Summary');
    console.log('=' .repeat(50));
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`⚠️  Warnings: ${this.results.warnings}`);
    console.log('=' .repeat(50));
    
    if (this.results.failed > 0) {
      console.log('\n❌ Schema verification FAILED');
      console.log('Please fix the issues above before proceeding.');
      process.exit(1);
    } else if (this.results.warnings > 0) {
      console.log('\n⚠️  Schema verification completed with warnings');
      console.log('The database is functional but some optimizations are recommended.');
    } else {
      console.log('\n✅ Schema verification PASSED');
      console.log('Database schema is correctly set up and ready for use!');
    }

    // Save report to file
    const reportPath = path.join(__dirname, 'schema-verification-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      database: config.database,
      results: this.results
    }, null, 2));

    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }

  async run() {
    console.log('🚀 ROMASHKA Database Schema Verification');
    console.log('=' .repeat(50));
    console.log(`Database: ${config.database}`);
    console.log(`Host: ${config.host}:${config.port}`);
    console.log(`User: ${config.user}`);
    console.log('=' .repeat(50));

    await this.connect();
    
    try {
      await this.verifyExtensions();
      await this.verifyTables();
      await this.verifyIndexes();
      await this.verifyFunctions();
      await this.verifyForeignKeys();
      await this.verifyTriggers();
      await this.verifyDataIntegrity();
      await this.verifyPerformance();
      await this.generateReport();
    } catch (error) {
      console.error('❌ Verification failed:', error);
      process.exit(1);
    } finally {
      await this.disconnect();
    }
  }
}

// Run the verification
if (require.main === module) {
  const verifier = new SchemaVerifier();
  verifier.run().catch(console.error);
}

module.exports = SchemaVerifier; 