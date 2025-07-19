#!/usr/bin/env node

// Quick test script to verify database connection and schema
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://dbieawxwlbwakkuvaihh.supabase.co';
const supabaseKey = process.env.VITE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiaWVhd3h3bGJ3YWtrdXZhaWhoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTE1MDkzMCwiZXhwIjoyMDY2NzI2OTMwfQ.YCO_lxeAsu21MVc5tVHmeIIlalGho_jPuKKOcybSZFQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  console.log('🔍 Testing database connection and schema...');
  
  try {
    // Test connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('ab_tests')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.log('❌ Connection or table error:', connectionError.message);
      
      // Try to run our safe schema
      console.log('🛠️ Attempting to create missing tables...');
      
      const sqlFile = join(__dirname, 'sql', 'final_safe_tables.sql');
      const sqlContent = fs.readFileSync(sqlFile, 'utf8');
      
      // Break SQL into individual statements and execute
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt && !stmt.startsWith('--'));
      
      for (const statement of statements) {
        if (statement) {
          try {
            const { error } = await supabase.rpc('exec_sql', { sql: statement });
            if (error) {
              console.log(`⚠️ Statement error: ${error.message}`);
            }
          } catch (err) {
            console.log(`⚠️ Statement execution error: ${err.message}`);
          }
        }
      }
    } else {
      console.log('✅ Database connection successful');
      console.log('✅ ab_tests table exists');
    }
    
    // Test each table
    const tables = [
      'ab_tests',
      'ab_test_results', 
      'response_templates',
      'personality_configs',
      'system_settings',
      'website_scans'
    ];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table ${table}: ${error.message}`);
        } else {
          console.log(`✅ Table ${table}: exists and accessible`);
        }
      } catch (err) {
        console.log(`❌ Table ${table}: ${err.message}`);
      }
    }
    
    // Test inserting a record to verify user_id field works
    try {
      const { data, error } = await supabase
        .from('personality_configs')
        .insert({
          user_id: 'test-user-123',
          name: 'Test Configuration',
          description: 'Test personality config'
        })
        .select()
        .single();
      
      if (error) {
        console.log('❌ Insert test failed:', error.message);
      } else {
        console.log('✅ Insert test successful - user_id field working');
        
        // Clean up test record
        await supabase
          .from('personality_configs')
          .delete()
          .eq('id', data.id);
      }
    } catch (err) {
      console.log('❌ Insert test error:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

// Run the test
testDatabase()
  .then(() => {
    console.log('🏁 Database test completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('💥 Test script failed:', err);
    process.exit(1);
  });