// Debug script to check environment variables and API configuration
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

console.log('🔍 Environment Variables Debug');
console.log('=============================');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
const envExists = fs.existsSync(envPath);
console.log(`📁 .env file exists: ${envExists ? '✅ Yes' : '❌ No'}`);

if (envExists) {
  console.log('\n📄 .env file contents:');
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log(envContent);
  
  // Parse environment variables manually
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  });
  
  // Check environment variables
  const supabaseUrl = envVars.VITE_SUPABASE_URL;
  const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;
  
  console.log('\n🔑 Environment Variables:');
  console.log(`VITE_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Not set'}`);
  console.log(`VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Set' : '❌ Not set'}`);
  
  if (supabaseUrl) {
    console.log(`URL: ${supabaseUrl}`);
  }
  
  if (supabaseAnonKey) {
    console.log(`Key (first 10 chars): ${supabaseAnonKey.substring(0, 10)}...`);
  }
  
  // Check if using default values
  const isDefaultUrl = supabaseUrl === 'https://your-project.supabase.co';
  const isDefaultKey = supabaseAnonKey === 'your-anon-key-here';
  
  console.log('\n⚠️  Default Values Check:');
  console.log(`Using default URL: ${isDefaultUrl ? '❌ Yes' : '✅ No'}`);
  console.log(`Using default key: ${isDefaultKey ? '❌ Yes' : '✅ No'}`);
  
  // Test Supabase connection if credentials are valid
  if (supabaseUrl && supabaseAnonKey && !isDefaultUrl && !isDefaultKey) {
    console.log('\n🔗 Testing Supabase Connection...');
    
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      // Test a simple query
      const { data, error } = await supabase
        .from('conversations')
        .select('count')
        .limit(1);
      
      if (error) {
        console.log('❌ Connection failed:', error.message);
        
        if (error.code === 'PGRST301') {
          console.log('💡 This might be a Row Level Security (RLS) issue');
          console.log('   Make sure your RLS policies are configured correctly');
        } else if (error.code === 'PGRST116') {
          console.log('💡 The conversations table might not exist');
          console.log('   Run the setup-supabase.sql script in your Supabase dashboard');
        }
      } else {
        console.log('✅ Connection successful!');
        console.log('✅ API keys are valid');
      }
    } catch (err) {
      console.log('❌ Connection error:', err.message);
    }
  } else {
    console.log('\n❌ Cannot test connection - invalid credentials');
  }
} else {
  console.log('\n❌ No .env file found');
}

console.log('\n📋 Next Steps:');
if (!envExists) {
  console.log('1. Create a .env file in the romashka directory');
  console.log('2. Add your Supabase credentials:');
  console.log('   VITE_SUPABASE_URL=your_supabase_project_url');
  console.log('   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');
} else {
  console.log('1. Check your Supabase dashboard for any errors');
  console.log('2. Verify that the database schema has been applied');
  console.log('3. Check Row Level Security policies');
}

console.log('\n🔗 Supabase Dashboard: https://supabase.com/dashboard'); 