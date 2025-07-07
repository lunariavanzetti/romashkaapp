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
    'profiles',
    'conversations', 
    'messages',
    'workflows',
    'knowledge_base',
    'intent_patterns',
    'conversation_context'
  ];
  
  console.log('📋 Checking required tables...\n');
  
  let allTablesExist = true;
  
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
        } else {
          console.log(`⚠️  Table '${tableName}' exists but has issues: ${error.message}`);
        }
      } else {
        console.log(`✅ Table '${tableName}' exists and is accessible`);
      }
    } catch (err) {
      console.log(`❌ Error checking table '${tableName}': ${err.message}`);
      allTablesExist = false;
    }
  }
  
  console.log('\n📊 Summary:');
  if (allTablesExist) {
    console.log('✅ All required tables exist!');
    console.log('🎉 Your database schema is properly configured');
    console.log('\n📋 Next steps:');
    console.log('1. Restart your development server');
    console.log('2. The conversations page should now work');
    console.log('3. Check the analytics dashboard for data');
  } else {
    console.log('❌ Some tables are missing');
    console.log('\n💡 To fix this:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to the SQL Editor');
    console.log('3. Copy and paste the contents of setup-supabase.sql');
    console.log('4. Click "Run" to execute the schema');
    console.log('5. Run this verification script again');
  }
  
  // Test a simple query to conversations table
  console.log('\n🧪 Testing conversations query...');
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
}

verifySchema(); 