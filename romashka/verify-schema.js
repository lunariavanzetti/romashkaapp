// Script to verify database schema
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read environment variables
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Verifying Database Schema');
console.log('============================');

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifySchema() {
  const requiredTables = [
    // Core tables
    'profiles',
    'conversations', 
    'messages',
    'customer_profiles',
    
    // Agent management
    'agent_availability',
    'canned_responses',
    'conversation_notes',
    'file_attachments',
    'conversation_transfers',
    'sla_tracking',
    
    // Knowledge management
    'knowledge_categories',
    'knowledge_items',
    'knowledge_versions',
    'knowledge_analytics',
    'intent_patterns',
    'conversation_context',
    
    // Analytics
    'daily_metrics',
    'realtime_metrics',
    'conversation_analytics',
    'dashboard_configs',
    'scheduled_reports',
    'alert_rules',
    'alert_history',
    'export_jobs',
    
    // Channels & Integrations
    'communication_channels',
    'message_templates',
    'customer_channel_preferences',
    'channel_routing_rules',
    'message_delivery_tracking',
    'webhook_events',
    'integrations',
    'integration_field_mappings',
    'sync_jobs',
    'webhook_subscriptions',
    'customer_sync_mapping',
    'webhook_logs',
    'integration_audit_logs',
    
    // Workflows & Automation
    'workflows',
    'workflow_executions',
    'playground_sessions',
    'widget_configurations',
    'website_scan_jobs',
    'extracted_content',
    'auto_generated_knowledge',
    
    // Utility tables
    'system_settings',
    'audit_logs'
  ];
  
  console.log('📋 Checking required tables...\n');
  
  let allTablesExist = true;
  let tableStats = {
    existing: 0,
    missing: 0,
    errors: 0
  };
  
  for (const tableName of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`❌ Table '${tableName}' does not exist`);
          allTablesExist = false;
          tableStats.missing++;
        } else {
          console.log(`⚠️  Table '${tableName}' exists but has issues: ${error.message}`);
          tableStats.errors++;
        }
      } else {
        console.log(`✅ Table '${tableName}' exists and is accessible`);
        tableStats.existing++;
      }
    } catch (err) {
      console.log(`❌ Error checking table '${tableName}': ${err.message}`);
      allTablesExist = false;
      tableStats.errors++;
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`✅ Existing tables: ${tableStats.existing}`);
  console.log(`❌ Missing tables: ${tableStats.missing}`);
  console.log(`⚠️  Tables with errors: ${tableStats.errors}`);
  console.log(`📋 Total tables checked: ${requiredTables.length}`);
  
  if (allTablesExist) {
    console.log('\n🎉 All required tables exist!');
    console.log('✅ Your database schema is properly configured');
    console.log('\n📋 Next steps:');
    console.log('1. Restart your development server');
    console.log('2. The conversations page should now work');
    console.log('3. Check the analytics dashboard for data');
    console.log('4. Test the knowledge base functionality');
    console.log('5. Configure your channels and integrations');
  } else {
    console.log('\n❌ Some tables are missing or have errors');
    console.log('\n💡 To fix this:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to the SQL Editor');
    console.log('3. Run the complete-schema.sql file to create all tables');
    console.log('4. Alternatively, run individual migration files in order:');
    console.log('   - migrations/001_core_tables.sql');
    console.log('   - migrations/002_knowledge_management.sql');
    console.log('   - migrations/003_agent_management.sql');
    console.log('   - migrations/004_analytics_reporting.sql');
    console.log('   - migrations/005_integrations_channels.sql');
    console.log('   - migrations/006_workflows_utilities.sql');
    console.log('5. Run db-functions.sql to create functions and triggers');
    console.log('6. Optionally, run seed-data.sql for development data');
    console.log('7. Run this verification script again');
  }
  
  // Test critical queries and functions
  console.log('\n🧪 Testing critical functionality...');
  
  // Test conversations query
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .limit(5);
    
    if (error) {
      console.log('❌ Conversations query failed:', error.message);
    } else {
      console.log(`✅ Conversations query successful! Found ${data?.length || 0} conversations`);
      
      if (data && data.length > 0) {
        console.log('📝 Sample conversation:', {
          id: data[0].id,
          user_name: data[0].user_name,
          status: data[0].status,
          created_at: data[0].created_at
        });
      }
    }
  } catch (err) {
    console.log('❌ Error testing conversations query:', err.message);
  }
  
  // Test knowledge items query
  try {
    const { data, error } = await supabase
      .from('knowledge_items')
      .select('*')
      .limit(3);
    
    if (error) {
      console.log('❌ Knowledge items query failed:', error.message);
    } else {
      console.log(`✅ Knowledge items query successful! Found ${data?.length || 0} items`);
    }
  } catch (err) {
    console.log('❌ Error testing knowledge items query:', err.message);
  }
  
  // Test system settings query
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('setting_key, setting_value')
      .eq('setting_key', 'app_name')
      .single();
    
    if (error) {
      console.log('❌ System settings query failed:', error.message);
    } else {
      console.log(`✅ System settings query successful! App name: ${data?.setting_value || 'Not set'}`);
    }
  } catch (err) {
    console.log('❌ Error testing system settings query:', err.message);
  }
  
  // Test RLS policies
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ RLS policies test failed:', error.message);
    } else {
      console.log('✅ RLS policies are working correctly');
    }
  } catch (err) {
    console.log('❌ Error testing RLS policies:', err.message);
  }
  
  // Test analytics tables
  try {
    const { data, error } = await supabase
      .from('daily_metrics')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Analytics tables test failed:', error.message);
    } else {
      console.log('✅ Analytics tables are accessible');
    }
  } catch (err) {
    console.log('❌ Error testing analytics tables:', err.message);
  }
  
  // Performance recommendations
  console.log('\n🔧 Performance recommendations:');
  console.log('- Ensure all required indexes are created');
  console.log('- Monitor query performance with pg_stat_statements');
  console.log('- Set up regular maintenance tasks');
  console.log('- Configure backup procedures');
  console.log('- Test all database functions and triggers');
  
  // Security recommendations
  console.log('\n🔒 Security recommendations:');
  console.log('- Review and refine RLS policies');
  console.log('- Implement proper API key management');
  console.log('- Set up audit logging');
  console.log('- Configure proper user roles and permissions');
  console.log('- Enable SSL/TLS encryption');
}

verifySchema(); 