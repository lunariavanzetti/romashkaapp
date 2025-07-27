/**
 * Working HubSpot sync using the correct user_id and schema
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function workingHubSpotSync() {
  console.log('🚀 Working HubSpot Sync with Correct Schema\n');

  try {
    // Get the OAuth token with the real user_id
    const { data: tokens, error: tokenError } = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('provider', 'hubspot')
      .single();
      
    if (tokenError || !tokens) {
      console.log('❌ No HubSpot OAuth token found:', tokenError?.message);
      return;
    }
    
    console.log(`🔑 Using real user_id: ${tokens.user_id}`);
    
    // Test the schema with real user_id
    console.log('\n🧪 Testing schema with real user_id...');
    
    // Test contact schema
    const testContact = {
      user_id: tokens.user_id,
      provider: 'hubspot',
      external_id: 'test-contact-schema'
    };
    
    const { error: contactSchemaError } = await supabase
      .from('synced_contacts')
      .insert([testContact]);
      
    if (contactSchemaError) {
      console.log(`❌ Contact schema test failed: ${contactSchemaError.message}`);
    } else {
      console.log('✅ Contact schema works!');
      
      // Clean up
      await supabase
        .from('synced_contacts')
        .delete()
        .eq('external_id', 'test-contact-schema');
    }
    
    // Test deal schema with required name field
    const testDeal = {
      user_id: tokens.user_id,
      provider: 'hubspot',
      external_id: 'test-deal-schema',
      name: 'Test Deal Schema'
    };
    
    const { error: dealSchemaError } = await supabase
      .from('synced_deals')
      .insert([testDeal]);
      
    if (dealSchemaError) {
      console.log(`❌ Deal schema test failed: ${dealSchemaError.message}`);
    } else {
      console.log('✅ Deal schema works!');
      
      // Clean up
      await supabase
        .from('synced_deals')
        .delete()
        .eq('external_id', 'test-deal-schema');
    }
    
    // If schema tests pass, do real sync
    if (!contactSchemaError && !dealSchemaError) {
      console.log('\n📥 Starting real HubSpot data sync...');
      
      // Sync contacts
      console.log('   📞 Syncing contacts...');
      const contactsResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=20', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (contactsResponse.ok) {
        const contactsData = await contactsResponse.json();
        console.log(`   📥 Fetched ${contactsData.results?.length || 0} contacts from HubSpot`);
        
        if (contactsData.results && contactsData.results.length > 0) {
          const contactsToInsert = contactsData.results.map(contact => ({
            user_id: tokens.user_id,
            provider: 'hubspot',
            external_id: contact.id,
            data: {
              firstname: contact.properties.firstname || '',
              lastname: contact.properties.lastname || '',
              email: contact.properties.email || '',
              phone: contact.properties.phone || '',
              company: contact.properties.company || '',
              properties: contact.properties,
              id: contact.id
            }
          }));
          
          // Clear existing contacts
          await supabase
            .from('synced_contacts')
            .delete()
            .eq('user_id', tokens.user_id)
            .eq('provider', 'hubspot');
          
          const { error: insertError, data: insertedContacts } = await supabase
            .from('synced_contacts')
            .insert(contactsToInsert)
            .select();
            
          if (insertError) {
            console.log(`   ❌ Contact insert failed: ${insertError.message}`);
          } else {
            console.log(`   ✅ Successfully inserted ${insertedContacts.length} contacts!`);
          }
        }
      } else {
        console.log(`   ❌ HubSpot contacts API error: ${contactsResponse.status}`);
      }
      
      // Sync deals
      console.log('\n   🤝 Syncing deals...');
      const dealsResponse = await fetch('https://api.hubapi.com/crm/v3/objects/deals?limit=20', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (dealsResponse.ok) {
        const dealsData = await dealsResponse.json();
        console.log(`   📥 Fetched ${dealsData.results?.length || 0} deals from HubSpot`);
        
        if (dealsData.results && dealsData.results.length > 0) {
          const dealsToInsert = dealsData.results.map(deal => ({
            user_id: tokens.user_id,
            provider: 'hubspot',
            external_id: deal.id,
            name: deal.properties.dealname || `Deal ${deal.id}`, // Required field
            data: {
              dealname: deal.properties.dealname || '',
              amount: deal.properties.amount || '0',
              dealstage: deal.properties.dealstage || '',
              pipeline: deal.properties.pipeline || '',
              closedate: deal.properties.closedate || null,
              properties: deal.properties,
              id: deal.id
            }
          }));
          
          // Clear existing deals
          await supabase
            .from('synced_deals')
            .delete()
            .eq('user_id', tokens.user_id)
            .eq('provider', 'hubspot');
          
          const { error: insertError, data: insertedDeals } = await supabase
            .from('synced_deals')
            .insert(dealsToInsert)
            .select();
            
          if (insertError) {
            console.log(`   ❌ Deal insert failed: ${insertError.message}`);
          } else {
            console.log(`   ✅ Successfully inserted ${insertedDeals.length} deals!`);
          }
        }
      } else {
        console.log(`   ❌ HubSpot deals API error: ${dealsResponse.status}`);
      }
      
      // Final verification
      console.log('\n📊 Final Verification:');
      
      const { data: finalContacts } = await supabase
        .from('synced_contacts')
        .select('*')
        .eq('user_id', tokens.user_id)
        .eq('provider', 'hubspot');
        
      const { data: finalDeals } = await supabase
        .from('synced_deals')
        .select('*')
        .eq('user_id', tokens.user_id)
        .eq('provider', 'hubspot');
      
      console.log(`   📞 Contacts synced: ${finalContacts?.length || 0}`);
      console.log(`   🤝 Deals synced: ${finalDeals?.length || 0}`);
      
      if (finalContacts && finalContacts.length > 0) {
        const sampleContact = finalContacts[0];
        const contactName = sampleContact.data?.firstname && sampleContact.data?.lastname 
          ? `${sampleContact.data.firstname} ${sampleContact.data.lastname}`
          : sampleContact.data?.email || 'Unknown';
        console.log(`   👤 Sample contact: ${contactName}`);
      }
      
      if (finalDeals && finalDeals.length > 0) {
        const sampleDeal = finalDeals[0];
        const dealName = sampleDeal.data?.dealname || sampleDeal.name;
        const dealAmount = sampleDeal.data?.amount ? `$${sampleDeal.data.amount}` : 'No amount';
        console.log(`   💰 Sample deal: ${dealName} (${dealAmount})`);
      }
      
      if ((finalContacts?.length || 0) > 0 || (finalDeals?.length || 0) > 0) {
        console.log('\n🎉 HubSpot sync completed successfully!');
        console.log('🤖 AI-Integration Bridge is now ready with real data!');
        console.log('\n📱 Test these queries in the chat widget:');
        console.log('   ✨ "Who are our customers?"');
        console.log('   ✨ "Show me recent contacts"');
        console.log('   ✨ "What deals are in progress?"');
        console.log('   ✨ "Tell me about our sales pipeline"');
        console.log('   ✨ "How many customers do we have?"');
        
        console.log('\n🔗 Access the app at: https://romashkaai-autupclrv-lunariavanzetti-gmailcoms-projects.vercel.app/');
        console.log('   Click the chat widget button (bottom right corner)');
        console.log('   Ask integration questions and watch for AI-Integration Bridge logs in browser console');
      } else {
        console.log('\n⚠️  No data was synced. Check HubSpot API access and token validity.');
      }
    }
    
  } catch (error) {
    console.error('❌ Working sync failed:', error.message);
  }
}

workingHubSpotSync().catch(console.error);