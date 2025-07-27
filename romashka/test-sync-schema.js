/**
 * Test sync table schema with proper UUID format
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSyncSchema() {
  console.log('🧪 Testing Sync Table Schema with UUID\n');

  try {
    const testUserId = crypto.randomUUID();
    console.log(`Using test UUID: ${testUserId}`);
    
    // Test synced_contacts
    console.log('\n📋 SYNCED_CONTACTS:');
    
    const contactTestCases = [
      { user_id: testUserId },
      { user_id: testUserId, name: 'John Doe' },
      { user_id: testUserId, email: 'john@example.com' },
      { user_id: testUserId, hubspot_id: '12345' },
      { user_id: testUserId, raw_data: { test: true } },
      { user_id: testUserId, created_at: new Date().toISOString() },
      { user_id: testUserId, firstname: 'John', lastname: 'Doe' }
    ];
    
    let workingContactColumns = null;
    
    for (const testCase of contactTestCases) {
      try {
        const { error } = await supabase
          .from('synced_contacts')
          .insert([testCase]);
          
        if (!error) {
          console.log(`   ✅ Working columns: ${Object.keys(testCase).join(', ')}`);
          workingContactColumns = Object.keys(testCase);
          
          // Clean up
          await supabase
            .from('synced_contacts')
            .delete()
            .eq('user_id', testUserId);
            
          break;
        } else {
          console.log(`   ❌ Failed: ${Object.keys(testCase).join(', ')} - ${error.message}`);
        }
      } catch (err) {
        console.log(`   ❌ Error: ${Object.keys(testCase).join(', ')} - ${err.message}`);
      }
    }
    
    // Test synced_deals
    console.log('\n📋 SYNCED_DEALS:');
    
    const dealTestCases = [
      { user_id: testUserId },
      { user_id: testUserId, name: 'Test Deal' },
      { user_id: testUserId, amount: '1000' },
      { user_id: testUserId, hubspot_id: '12345' },
      { user_id: testUserId, raw_data: { test: true } },
      { user_id: testUserId, created_at: new Date().toISOString() },
      { user_id: testUserId, dealname: 'Test Deal', amount: '1000' }
    ];
    
    let workingDealColumns = null;
    
    for (const testCase of dealTestCases) {
      try {
        const { error } = await supabase
          .from('synced_deals')
          .insert([testCase]);
          
        if (!error) {
          console.log(`   ✅ Working columns: ${Object.keys(testCase).join(', ')}`);
          workingDealColumns = Object.keys(testCase);
          
          // Clean up
          await supabase
            .from('synced_deals')
            .delete()
            .eq('user_id', testUserId);
            
          break;
        } else {
          console.log(`   ❌ Failed: ${Object.keys(testCase).join(', ')} - ${error.message}`);
        }
      } catch (err) {
        console.log(`   ❌ Error: ${Object.keys(testCase).join(', ')} - ${err.message}`);
      }
    }
    
    console.log('\n📊 Schema Summary:');
    console.log(`   synced_contacts working columns: ${workingContactColumns ? workingContactColumns.join(', ') : 'None found'}`);
    console.log(`   synced_deals working columns: ${workingDealColumns ? workingDealColumns.join(', ') : 'None found'}`);
    
    if (workingContactColumns && workingDealColumns) {
      console.log('\n✅ Found working schema! Creating simplified sync script...');
      
      // Create a simplified sync that works with the available columns
      console.log('\n🔧 Testing simplified HubSpot sync...');
      
      // Get the valid OAuth token
      const { data: tokens } = await supabase
        .from('oauth_tokens')
        .select('*')
        .eq('provider', 'hubspot')
        .single();
        
      if (tokens && tokens.access_token) {
        // Try to sync with minimal data
        const contactsResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=3', {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (contactsResponse.ok) {
          const contactsData = await contactsResponse.json();
          console.log(`   📥 Got ${contactsData.results?.length || 0} contacts from HubSpot`);
          
          if (contactsData.results && contactsData.results.length > 0) {
            // Create minimal contact records
            const minimalContacts = contactsData.results.map((contact, index) => {
              const base = { user_id: tokens.user_id };
              
              // Add only the columns we know work
              if (workingContactColumns.includes('name')) {
                base.name = `${contact.properties.firstname || ''} ${contact.properties.lastname || ''}`.trim() || `Contact ${index + 1}`;
              }
              if (workingContactColumns.includes('email')) {
                base.email = contact.properties.email || '';
              }
              if (workingContactColumns.includes('hubspot_id')) {
                base.hubspot_id = contact.id;
              }
              if (workingContactColumns.includes('raw_data')) {
                base.raw_data = contact;
              }
              if (workingContactColumns.includes('created_at')) {
                base.created_at = new Date().toISOString();
              }
              
              return base;
            });
            
            const { error: syncError } = await supabase
              .from('synced_contacts')
              .insert(minimalContacts);
              
            if (syncError) {
              console.log(`   ❌ Sync failed: ${syncError.message}`);
            } else {
              console.log(`   ✅ Successfully synced ${minimalContacts.length} contacts!`);
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Schema test failed:', error);
  }
}

testSyncSchema().catch(console.error);