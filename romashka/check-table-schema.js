/**
 * Check the actual schema of sync tables to understand what columns exist
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableSchema() {
  console.log('🔍 Checking Sync Table Schema\n');

  try {
    // Test insert to see what columns work
    const tables = [
      { name: 'synced_contacts', testData: { user_id: 'test' } },
      { name: 'synced_deals', testData: { user_id: 'test' } }
    ];
    
    for (const table of tables) {
      console.log(`📋 ${table.name.toUpperCase()}:`);
      
      // Try basic insert to see what columns are required/available
      try {
        const { error } = await supabase
          .from(table.name)
          .insert([table.testData]);
          
        if (error) {
          console.log(`   Error with basic insert: ${error.message}`);
          
          // Try to understand what columns exist by testing different combinations
          const testCases = [
            { user_id: 'test', name: 'test' },
            { user_id: 'test', email: 'test@test.com' },
            { user_id: 'test', hubspot_id: 'test' },
            { user_id: 'test', raw_data: {} },
            { user_id: 'test', created_at: new Date().toISOString() }
          ];
          
          for (const testCase of testCases) {
            try {
              const { error: testError } = await supabase
                .from(table.name)
                .insert([testCase]);
                
              if (!testError) {
                console.log(`   ✅ Working columns: ${Object.keys(testCase).join(', ')}`);
                
                // Clean up
                await supabase
                  .from(table.name)
                  .delete()
                  .eq('user_id', 'test');
                  
                break;
              } else {
                console.log(`   ❌ Failed: ${Object.keys(testCase).join(', ')}`);
              }
            } catch (err) {
              console.log(`   ❌ Error: ${Object.keys(testCase).join(', ')} - ${err.message}`);
            }
          }
        } else {
          console.log(`   ✅ Basic insert worked`);
          
          // Clean up
          await supabase
            .from(table.name)
            .delete()
            .eq('user_id', 'test');
        }
      } catch (err) {
        console.log(`   ❌ Table error: ${err.message}`);
      }
      
      console.log('');
    }
    
    // Also check if we can see existing table structure
    console.log('🔍 Looking for existing data patterns...');
    
    const { data: existingContacts, error: contactsError } = await supabase
      .from('synced_contacts')
      .select('*')
      .limit(1);
      
    const { data: existingDeals, error: dealsError } = await supabase
      .from('synced_deals')
      .select('*')
      .limit(1);
    
    if (existingContacts && existingContacts.length > 0) {
      console.log('📋 Existing contact columns:', Object.keys(existingContacts[0]));
    } else {
      console.log('📋 No existing contacts to examine');
    }
    
    if (existingDeals && existingDeals.length > 0) {
      console.log('📋 Existing deal columns:', Object.keys(existingDeals[0]));
    } else {
      console.log('📋 No existing deals to examine');
    }
    
  } catch (error) {
    console.error('❌ Schema check failed:', error);
  }
}

checkTableSchema().catch(console.error);