/**
 * Test sync tables with required provider field
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testWithProvider() {
  console.log('🧪 Testing Sync Tables with Provider Field\n');

  try {
    const testUserId = crypto.randomUUID();
    
    // Test with provider field
    console.log('📋 SYNCED_CONTACTS with provider:');
    
    const contactTests = [
      { user_id: testUserId, provider: 'hubspot' },
      { user_id: testUserId, provider: 'hubspot', name: 'John Doe' },
      { user_id: testUserId, provider: 'hubspot', email: 'john@example.com' },
      { user_id: testUserId, provider: 'hubspot', contact_id: '12345' },
      { user_id: testUserId, provider: 'hubspot', data: { test: true } }
    ];
    
    let workingContactSchema = null;
    
    for (const test of contactTests) {
      try {
        const { error } = await supabase
          .from('synced_contacts')
          .insert([test]);
          
        if (!error) {
          console.log(`   ✅ Working: ${Object.keys(test).join(', ')}`);
          workingContactSchema = Object.keys(test);
          
          // Clean up
          await supabase
            .from('synced_contacts')
            .delete()
            .eq('user_id', testUserId);
            
          break;
        } else {
          console.log(`   ❌ Failed: ${Object.keys(test).join(', ')} - ${error.message}`);
        }
      } catch (err) {
        console.log(`   ❌ Error: ${err.message}`);
      }
    }
    
    console.log('\n📋 SYNCED_DEALS with provider:');
    
    const dealTests = [
      { user_id: testUserId, provider: 'hubspot' },
      { user_id: testUserId, provider: 'hubspot', name: 'Test Deal' },
      { user_id: testUserId, provider: 'hubspot', deal_id: '12345' },
      { user_id: testUserId, provider: 'hubspot', amount: '1000' },
      { user_id: testUserId, provider: 'hubspot', data: { test: true } }
    ];
    
    let workingDealSchema = null;
    
    for (const test of dealTests) {
      try {
        const { error } = await supabase
          .from('synced_deals')
          .insert([test]);
          
        if (!error) {
          console.log(`   ✅ Working: ${Object.keys(test).join(', ')}`);
          workingDealSchema = Object.keys(test);
          
          // Clean up
          await supabase
            .from('synced_deals')
            .delete()
            .eq('user_id', testUserId);
            
          break;
        } else {
          console.log(`   ❌ Failed: ${Object.keys(test).join(', ')} - ${error.message}`);
        }
      } catch (err) {
        console.log(`   ❌ Error: ${err.message}`);
      }
    }
    
    console.log('\n📊 Working Schema:');
    console.log(`   Contacts: ${workingContactSchema ? workingContactSchema.join(', ') : 'None'}`);
    console.log(`   Deals: ${workingDealSchema ? workingDealSchema.join(', ') : 'None'}`);
    
    if (workingContactSchema && workingDealSchema) {
      console.log('\n🚀 Now running actual HubSpot sync with working schema...');
      
      // Get OAuth token
      const { data: tokens } = await supabase
        .from('oauth_tokens')
        .select('*')
        .eq('provider', 'hubspot')
        .single();
        
      if (tokens && tokens.access_token) {
        // Sync contacts
        const contactsResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=10', {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (contactsResponse.ok) {
          const contactsData = await contactsResponse.json();
          console.log(`   📥 Fetched ${contactsData.results?.length || 0} contacts`);
          
          if (contactsData.results && contactsData.results.length > 0) {
            const contactsToSync = contactsData.results.map((contact, index) => {
              const record = {
                user_id: tokens.user_id,
                provider: 'hubspot'
              };
              
              // Add available fields based on working schema
              if (workingContactSchema.includes('name')) {
                record.name = `${contact.properties.firstname || ''} ${contact.properties.lastname || ''}`.trim() || `Contact ${index + 1}`;
              }
              if (workingContactSchema.includes('email')) {
                record.email = contact.properties.email || '';
              }
              if (workingContactSchema.includes('contact_id')) {
                record.contact_id = contact.id;
              }
              if (workingContactSchema.includes('data')) {
                record.data = contact;
              }
              
              return record;
            });
            
            // Clear existing and insert new
            await supabase
              .from('synced_contacts')
              .delete()
              .eq('user_id', tokens.user_id)
              .eq('provider', 'hubspot');
            
            const { error: contactInsertError } = await supabase
              .from('synced_contacts')
              .insert(contactsToSync);
              
            if (contactInsertError) {
              console.log(`   ❌ Contact sync failed: ${contactInsertError.message}`);
            } else {
              console.log(`   ✅ Synced ${contactsToSync.length} contacts successfully!`);
            }
          }
        }
        
        // Sync deals
        const dealsResponse = await fetch('https://api.hubapi.com/crm/v3/objects/deals?limit=10', {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (dealsResponse.ok) {
          const dealsData = await dealsResponse.json();
          console.log(`   📥 Fetched ${dealsData.results?.length || 0} deals`);
          
          if (dealsData.results && dealsData.results.length > 0) {
            const dealsToSync = dealsData.results.map((deal, index) => {
              const record = {
                user_id: tokens.user_id,
                provider: 'hubspot'
              };
              
              // Add available fields based on working schema
              if (workingDealSchema.includes('name')) {
                record.name = deal.properties.dealname || `Deal ${index + 1}`;
              }
              if (workingDealSchema.includes('amount')) {
                record.amount = deal.properties.amount || '0';
              }
              if (workingDealSchema.includes('deal_id')) {
                record.deal_id = deal.id;
              }
              if (workingDealSchema.includes('data')) {
                record.data = deal;
              }
              
              return record;
            });
            
            // Clear existing and insert new
            await supabase
              .from('synced_deals')
              .delete()
              .eq('user_id', tokens.user_id)
              .eq('provider', 'hubspot');
            
            const { error: dealInsertError } = await supabase
              .from('synced_deals')
              .insert(dealsToSync);
              
            if (dealInsertError) {
              console.log(`   ❌ Deal sync failed: ${dealInsertError.message}`);
            } else {
              console.log(`   ✅ Synced ${dealsToSync.length} deals successfully!`);
            }
          }
        }
        
        // Verify final results
        const { data: finalContacts } = await supabase
          .from('synced_contacts')
          .select('*')
          .eq('user_id', tokens.user_id);
          
        const { data: finalDeals } = await supabase
          .from('synced_deals')
          .select('*')
          .eq('user_id', tokens.user_id);
        
        console.log(`\n🎉 Final Results:`);
        console.log(`   Contacts in database: ${finalContacts?.length || 0}`);
        console.log(`   Deals in database: ${finalDeals?.length || 0}`);
        
        if ((finalContacts?.length || 0) > 0) {
          console.log(`   Sample contact: ${finalContacts[0].name || finalContacts[0].email || 'Unnamed'}`);
        }
        
        if ((finalDeals?.length || 0) > 0) {
          console.log(`   Sample deal: ${finalDeals[0].name || finalDeals[0].amount || 'Unnamed'}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testWithProvider().catch(console.error);