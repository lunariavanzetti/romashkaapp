/**
 * Test script to inspect the actual database schema
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectSchema() {
  console.log('🔍 Inspecting Database Schema\n');

  try {
    // Check conversations table structure
    console.log('📋 Conversations table columns:');
    const { data: convColumns, error: convError } = await supabase
      .rpc('get_table_columns', { table_name: 'conversations' });
    
    if (convError) {
      console.log('❌ Error getting conversations columns:', convError.message);
      
      // Try alternative approach - simple select to see what columns exist
      const { data: sample, error: sampleError } = await supabase
        .from('conversations')
        .select('*')
        .limit(1);
        
      if (!sampleError && sample && sample.length > 0) {
        console.log('   Available columns:', Object.keys(sample[0]));
      } else if (!sampleError) {
        console.log('   Table exists but is empty');
      }
    } else {
      console.log('   Columns:', convColumns);
    }

    // Check messages table structure
    console.log('\n📋 Messages table columns:');
    const { data: msgColumns, error: msgError } = await supabase
      .rpc('get_table_columns', { table_name: 'messages' });
    
    if (msgError) {
      console.log('❌ Error getting messages columns:', msgError.message);
      
      // Try alternative approach
      const { data: sample, error: sampleError } = await supabase
        .from('messages')
        .select('*')
        .limit(1);
        
      if (!sampleError && sample && sample.length > 0) {
        console.log('   Available columns:', Object.keys(sample[0]));
      } else if (!sampleError) {
        console.log('   Table exists but is empty');
      }
    } else {
      console.log('   Columns:', msgColumns);
    }

    // Check for workflows table
    console.log('\n📋 Workflows table:');
    const { data: workflows, error: workflowError } = await supabase
      .from('workflows')
      .select('*')
      .limit(1);
      
    if (workflowError) {
      console.log('❌ Workflows table error:', workflowError.message);
    } else {
      console.log('✅ Workflows table accessible');
      if (workflows.length > 0) {
        console.log('   Available columns:', Object.keys(workflows[0]));
      }
    }

    // Check synced data
    console.log('\n📋 Integration sync status:');
    const { data: contacts, error: contactsError } = await supabase
      .from('synced_contacts')
      .select('*')
      .limit(3);
      
    if (contactsError) {
      console.log('❌ Synced contacts error:', contactsError.message);
    } else {
      console.log(`✅ Found ${contacts.length} synced contacts`);
      if (contacts.length > 0) {
        console.log('   Contact columns:', Object.keys(contacts[0]));
        console.log('   Sample:', contacts[0]);
      }
    }

  } catch (error) {
    console.error('❌ Schema inspection failed:', error);
  }
}

inspectSchema().catch(console.error);