/**
 * Check what data exists in sync tables and diagnose the issue
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSyncData() {
  console.log('🔍 Checking Sync Data Status\n');

  try {
    // Check all sync tables
    const tables = ['synced_contacts', 'synced_deals', 'synced_companies', 'synced_products', 'synced_orders'];
    
    for (const table of tables) {
      console.log(`📋 ${table.toUpperCase()}:`);
      
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact' })
          .limit(3);
          
        if (error) {
          console.log(`   ❌ Error: ${error.message}`);
        } else {
          console.log(`   📊 Total records: ${count || 0}`);
          
          if (data && data.length > 0) {
            console.log(`   📝 Sample record:`);
            const sample = data[0];
            console.log(`      Keys: ${Object.keys(sample).join(', ')}`);
            
            if (sample.user_id) {
              console.log(`      User ID: ${sample.user_id}`);
            }
            
            if (sample.firstname && sample.lastname) {
              console.log(`      Name: ${sample.firstname} ${sample.lastname}`);
            } else if (sample.name) {
              console.log(`      Name: ${sample.name}`);
            } else if (sample.dealname) {
              console.log(`      Deal: ${sample.dealname}`);
            }
            
            if (sample.email) {
              console.log(`      Email: ${sample.email}`);
            }
          }
        }
      } catch (err) {
        console.log(`   ❌ Table error: ${err.message}`);
      }
      
      console.log('');
    }
    
    // Check oauth_tokens table to see if we have valid tokens
    console.log('🔑 OAUTH TOKENS:');
    try {
      const { data: tokens, error: tokenError } = await supabase
        .from('oauth_tokens')
        .select('provider, user_id, access_token, created_at, expires_at')
        .eq('provider', 'hubspot');
        
      if (tokenError) {
        console.log(`   ❌ Error: ${tokenError.message}`);
      } else {
        console.log(`   📊 HubSpot tokens: ${tokens.length}`);
        
        if (tokens.length > 0) {
          for (const token of tokens) {
            console.log(`   🔑 User: ${token.user_id}`);
            console.log(`      Token: ${token.access_token ? token.access_token.substring(0, 20) + '...' : 'None'}`);
            console.log(`      Created: ${token.created_at}`);
            console.log(`      Expires: ${token.expires_at || 'Unknown'}`);
          }
        }
      }
    } catch (err) {
      console.log(`   ❌ OAuth tokens error: ${err.message}`);
    }
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('   1. If no sync data exists, run HubSpot sync from /integrations page');
    console.log('   2. Check if /api/test-sync endpoint works');
    console.log('   3. Verify OAuth tokens are valid and not expired');
    console.log('   4. Check that user_id matches between tokens and expected user');
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkSyncData().catch(console.error);