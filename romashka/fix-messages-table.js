// Script to check and fix missing columns in messages table
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

console.log('🔧 Checking and Fixing Messages Table');
console.log('=====================================');

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAndFixMessagesTable() {
  try {
    console.log('📋 Checking messages table structure...');
    
    // Check if messages table exists and get its structure
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'messages' });
    
    if (columnsError) {
      console.log('⚠️  Could not check table structure, proceeding with column additions...');
    } else {
      console.log('📊 Current columns in messages table:');
      console.log(columns);
    }
    
    // Define required columns for analytics
    const requiredColumns = [
      { name: 'processing_time_ms', type: 'INTEGER' },
      { name: 'confidence_score', type: 'DECIMAL(3,2)' },
      { name: 'intent_detected', type: 'VARCHAR(100)' },
      { name: 'knowledge_sources', type: 'JSONB' },
      { name: 'tokens_used', type: 'INTEGER' },
      { name: 'metadata', type: 'JSONB' }
    ];
    
    console.log('\n🔧 Adding missing columns to messages table...');
    
    // Add missing columns
    for (const column of requiredColumns) {
      try {
        const alterQuery = `ALTER TABLE messages ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}`;
        console.log(`Adding column: ${column.name} (${column.type})`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: alterQuery });
        
        if (error) {
          console.log(`⚠️  Column ${column.name}: ${error.message}`);
        } else {
          console.log(`✅ Column ${column.name} added successfully`);
        }
      } catch (err) {
        console.log(`⚠️  Column ${column.name}: ${err.message}`);
      }
    }
    
    console.log('\n🧪 Testing messages query...');
    
    // Test a simple query to messages table
    const { data, error } = await supabase
      .from('messages')
      .select('id, content, created_at, processing_time_ms, confidence_score')
      .limit(1);
    
    if (error) {
      console.log('❌ Messages query failed:', error.message);
      
      if (error.code === '42703') {
        console.log('💡 This indicates a missing column. Let\'s add them manually.');
        await addColumnsManually();
      }
    } else {
      console.log('✅ Messages query successful!');
      console.log('📝 Sample message structure:', data?.[0] || 'No messages found');
    }
    
  } catch (error) {
    console.log('❌ Error checking messages table:', error.message);
  }
}

async function addColumnsManually() {
  console.log('\n🔧 Adding columns manually via SQL...');
  
  const alterStatements = [
    'ALTER TABLE messages ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER;',
    'ALTER TABLE messages ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2);',
    'ALTER TABLE messages ADD COLUMN IF NOT EXISTS intent_detected VARCHAR(100);',
    'ALTER TABLE messages ADD COLUMN IF NOT EXISTS knowledge_sources JSONB;',
    'ALTER TABLE messages ADD COLUMN IF NOT EXISTS tokens_used INTEGER;',
    'ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata JSONB;'
  ];
  
  for (const statement of alterStatements) {
    try {
      console.log(`Executing: ${statement.trim()}`);
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.log(`⚠️  ${error.message}`);
      } else {
        console.log('✅ Success');
      }
    } catch (err) {
      console.log(`⚠️  ${err.message}`);
    }
  }
}

// Alternative: Use the REST API approach
async function addColumnsViaREST() {
  console.log('\n🔧 Adding columns via REST API...');
  
  const alterStatements = [
    'ALTER TABLE messages ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER;',
    'ALTER TABLE messages ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2);',
    'ALTER TABLE messages ADD COLUMN IF NOT EXISTS intent_detected VARCHAR(100);',
    'ALTER TABLE messages ADD COLUMN IF NOT EXISTS knowledge_sources JSONB;',
    'ALTER TABLE messages ADD COLUMN IF NOT EXISTS tokens_used INTEGER;',
    'ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata JSONB;'
  ];
  
  for (const statement of alterStatements) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({ sql: statement })
      });
      
      if (response.ok) {
        console.log('✅ Success');
      } else {
        const error = await response.text();
        console.log(`⚠️  ${error}`);
      }
    } catch (err) {
      console.log(`⚠️  ${err.message}`);
    }
  }
}

console.log('\n📋 Manual SQL Commands (if automated approach fails):');
console.log('Copy and paste these into your Supabase SQL Editor:');
console.log(`
ALTER TABLE messages ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS intent_detected VARCHAR(100);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS knowledge_sources JSONB;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS tokens_used INTEGER;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata JSONB;
`);

// Try the automated approach
checkAndFixMessagesTable().catch(() => {
  console.log('\n🔄 Trying REST API approach...');
  addColumnsViaREST();
}); 