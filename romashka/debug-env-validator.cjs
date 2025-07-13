#!/usr/bin/env node

console.log('🔍 ROMASHKA Environment Variables Debug & Validation');
console.log('=' .repeat(60));

// Load environment variables
require('dotenv').config();

// Test Supabase connection
async function testSupabaseConnection() {
  const { createClient } = require('@supabase/supabase-js');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  console.log('\n📊 SUPABASE CONFIGURATION:');
  console.log('URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('Key:', supabaseKey ? '✅ Set' : '❌ Missing');
  
  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Test basic connection
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      
      if (error) {
        console.log('❌ Supabase Connection Error:', error.message);
        
        // Check if it's an RLS issue
        if (error.message.includes('Row Level Security')) {
          console.log('💡 This might be an RLS policy issue');
          console.log('💡 Try: ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;');
        }
      } else {
        console.log('✅ Supabase Connection: SUCCESS');
      }
    } catch (err) {
      console.log('❌ Supabase Error:', err.message);
    }
  }
}

// Test OpenAI connection
async function testOpenAIConnection() {
  const openaiKey = process.env.VITE_OPENAI_API_KEY;
  
  console.log('\n🤖 OPENAI CONFIGURATION:');
  console.log('Key:', openaiKey ? '✅ Set' : '❌ Missing');
  
  if (openaiKey && openaiKey !== 'your_openai_api_key_here') {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
        },
      });
      
      if (response.ok) {
        console.log('✅ OpenAI Connection: SUCCESS');
      } else {
        console.log('❌ OpenAI Error:', response.status, response.statusText);
      }
    } catch (err) {
      console.log('❌ OpenAI Connection Error:', err.message);
    }
  } else {
    console.log('❌ OpenAI API key is placeholder or missing');
  }
}

// Validate all environment variables
function validateEnvironment() {
  console.log('\n🔍 ENVIRONMENT VARIABLES VALIDATION:');
  
  const requiredVars = {
    'VITE_SUPABASE_URL': process.env.VITE_SUPABASE_URL,
    'VITE_SUPABASE_ANON_KEY': process.env.VITE_SUPABASE_ANON_KEY,
    'VITE_OPENAI_API_KEY': process.env.VITE_OPENAI_API_KEY,
    'DATABASE_URL': process.env.DATABASE_URL,
    'WHATSAPP_ACCESS_TOKEN': process.env.WHATSAPP_ACCESS_TOKEN,
    'WHATSAPP_VERIFY_TOKEN': process.env.WHATSAPP_VERIFY_TOKEN,
    'WHATSAPP_WEBHOOK_SECRET': process.env.WHATSAPP_WEBHOOK_SECRET,
  };
  
  let allValid = true;
  
  Object.entries(requiredVars).forEach(([key, value]) => {
    const isSet = value && value !== '' && !value.includes('your_') && !value.includes('placeholder');
    console.log(`${key}: ${isSet ? '✅ Valid' : '❌ Missing/Placeholder'}`);
    if (!isSet) allValid = false;
  });
  
  console.log(`\n📊 Overall Status: ${allValid ? '✅ ALL VALID' : '❌ ISSUES FOUND'}`);
  
  return allValid;
}

// Check for CSP issues
function checkCSPIssues() {
  console.log('\n🛡️ CSP DEBUGGING:');
  console.log('The WebSocket error suggests CSP is still active.');
  console.log('Possible sources:');
  console.log('1. Vercel deployment cache');
  console.log('2. Browser cache');
  console.log('3. Built-in Vite CSP');
  console.log('4. Meta tags in HTML');
  
  console.log('\n💡 SOLUTIONS TO TRY:');
  console.log('1. Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R)');
  console.log('2. Clear browser cache completely');
  console.log('3. Try incognito/private mode');
  console.log('4. Force Vercel rebuild');
}

// Main execution
async function main() {
  const isValid = validateEnvironment();
  
  if (isValid) {
    await testSupabaseConnection();
    await testOpenAIConnection();
  }
  
  checkCSPIssues();
  
  console.log('\n🚀 RECOMMENDATIONS:');
  if (!isValid) {
    console.log('❌ Fix environment variables first');
  } else {
    console.log('✅ Environment looks good');
    console.log('💡 The issue is likely CSP caching');
    console.log('🔧 Try the CSP solutions above');
  }
}

main().catch(console.error);