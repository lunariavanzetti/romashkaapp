/**
 * Apply database migration using direct Supabase operations
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigrationDirect() {
  console.log('🚀 Applying Chat Widget Database Migration (Direct Method)\n');

  try {
    console.log('1️⃣ Adding missing columns to conversations table...');
    
    // Since we can't ALTER TABLE directly, let's check what happens when we try to insert
    // First let's see if we can add basic data
    const testId = crypto.randomUUID();
    
    try {
      const { data: testConv, error: insertError } = await supabase
        .from('conversations')
        .insert([{
          id: testId,
          // Try just the basic columns that might already exist
        }])
        .select()
        .single();
        
      if (insertError) {
        console.log('❌ Basic conversation insert failed:', insertError.message);
        console.log('   This suggests the table structure needs to be fixed manually');
      } else {
        console.log('✅ Basic conversation creation works');
        
        // Clean up
        await supabase
          .from('conversations')
          .delete()
          .eq('id', testId);
      }
    } catch (error) {
      console.log('❌ Conversation test failed:', error.message);
    }
    
    console.log('\n2️⃣ Checking current table structures...');
    
    // Let's try to understand what columns actually exist by trying different inserts
    const structures = {
      conversations: {},
      messages: {}
    };
    
    // Test conversations table columns
    console.log('   Testing conversations columns...');
    const testCases = [
      { id: crypto.randomUUID() },
      { id: crypto.randomUUID(), workflow_id: 'test' },
      { id: crypto.randomUUID(), status: 'active' },
      { id: crypto.randomUUID(), metadata: {} }
    ];
    
    for (const testCase of testCases) {
      try {
        const { error } = await supabase
          .from('conversations')
          .insert([testCase]);
          
        if (!error) {
          console.log(`     ✅ Columns work: ${Object.keys(testCase).join(', ')}`);
          Object.assign(structures.conversations, testCase);
          
          // Clean up
          await supabase
            .from('conversations')
            .delete()
            .eq('id', testCase.id);
        } else {
          console.log(`     ❌ Failed: ${Object.keys(testCase).join(', ')} - ${error.message}`);
        }
      } catch (err) {
        console.log(`     ❌ Error: ${Object.keys(testCase).join(', ')} - ${err.message}`);
      }
    }
    
    console.log('\n3️⃣ Testing messages table...');
    
    // Create a test conversation first
    const convId = crypto.randomUUID();
    const { error: convCreateError } = await supabase
      .from('conversations')
      .insert([{ id: convId }]);
      
    if (convCreateError) {
      console.log('❌ Could not create test conversation for messages test:', convCreateError.message);
    } else {
      const messageTests = [
        { conversation_id: convId },
        { conversation_id: convId, content: 'test' },
        { conversation_id: convId, content: 'test', sender_type: 'user' },
        { conversation_id: convId, content: 'test', sender_type: 'user', message_type: 'text' },
        { conversation_id: convId, content: 'test', sender_type: 'user', status: 'sent' }
      ];
      
      for (const testCase of messageTests) {
        try {
          const { error } = await supabase
            .from('messages')
            .insert([testCase]);
            
          if (!error) {
            console.log(`     ✅ Message columns work: ${Object.keys(testCase).join(', ')}`);
          } else {
            console.log(`     ❌ Failed: ${Object.keys(testCase).join(', ')} - ${error.message}`);
          }
        } catch (err) {
          console.log(`     ❌ Error: ${Object.keys(testCase).join(', ')} - ${err.message}`);
        }
      }
      
      // Clean up test conversation
      await supabase
        .from('conversations')
        .delete()
        .eq('id', convId);
    }
    
    console.log('\n4️⃣ Summary and Next Steps:');
    console.log('   The database migration needs to be applied manually through Supabase SQL Editor.');
    console.log('   Please copy the SQL from sql/complete_chat_schema_fix.sql and run it there.');
    console.log('   Alternatively, we can create a simpler solution using existing columns.');
    
  } catch (error) {
    console.error('❌ Migration test failed:', error);
  }
}

applyMigrationDirect().catch(console.error);