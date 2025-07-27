/**
 * Final test to determine exact schema and perform successful sync
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function finalSyncTest() {
  console.log('🔍 Final Schema Discovery and Sync Test\n');

  try {
    const testUserId = crypto.randomUUID();
    
    // Test with all discovered required fields
    console.log('📋 Testing required fields...');
    
    const minimalContact = {
      user_id: testUserId,
      provider: 'hubspot',
      external_id: 'test-contact-123'
    };
    
    const { error: contactError } = await supabase
      .from('synced_contacts')
      .insert([minimalContact]);
      
    if (contactError) {
      console.log(`❌ Contact minimal test failed: ${contactError.message}`);
    } else {
      console.log('✅ Contact minimal test passed!');
      
      // Test additional fields
      const extendedContact = {
        user_id: testUserId,
        provider: 'hubspot',
        external_id: 'test-contact-456',
        data: { name: 'John Doe', email: 'john@example.com' }
      };
      
      const { error: extendedError } = await supabase
        .from('synced_contacts')
        .insert([extendedContact]);
        
      if (extendedError) {
        console.log(`❌ Extended contact test failed: ${extendedError.message}`);
      } else {
        console.log('✅ Extended contact test passed!');
      }
      
      // Clean up
      await supabase
        .from('synced_contacts')
        .delete()
        .eq('user_id', testUserId);
    }
    
    // Test deals
    const minimalDeal = {
      user_id: testUserId,
      provider: 'hubspot',
      external_id: 'test-deal-123'
    };
    
    const { error: dealError } = await supabase
      .from('synced_deals')
      .insert([minimalDeal]);
      
    if (dealError) {
      console.log(`❌ Deal minimal test failed: ${dealError.message}`);
    } else {
      console.log('✅ Deal minimal test passed!');
      
      // Clean up
      await supabase
        .from('synced_deals')
        .delete()
        .eq('user_id', testUserId);
    }
    
    // If minimal tests passed, do actual sync
    if (!contactError && !dealError) {
      console.log('\n🚀 Schema discovered! Running actual HubSpot sync...');
      
      // Get OAuth token
      const { data: tokens } = await supabase
        .from('oauth_tokens')
        .select('*')
        .eq('provider', 'hubspot')
        .single();
        
      if (tokens && tokens.access_token) {
        console.log(`🔑 Using token for user: ${tokens.user_id}`);
        
        // Sync contacts
        console.log('\n📥 Syncing contacts...');
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
            const contactsToSync = contactsData.results.map(contact => ({
              user_id: tokens.user_id,
              provider: 'hubspot',
              external_id: contact.id,
              data: {
                firstname: contact.properties.firstname || '',
                lastname: contact.properties.lastname || '',
                email: contact.properties.email || '',
                phone: contact.properties.phone || '',
                company: contact.properties.company || '',
                raw: contact
              }
            }));
            
            // Clear existing contacts for this user
            await supabase
              .from('synced_contacts')
              .delete()
              .eq('user_id', tokens.user_id)
              .eq('provider', 'hubspot');
            
            const { error: insertError } = await supabase
              .from('synced_contacts')
              .insert(contactsToSync);
              
            if (insertError) {
              console.log(`   ❌ Contact insert failed: ${insertError.message}`);
            } else {
              console.log(`   ✅ Successfully synced ${contactsToSync.length} contacts!`);
            }
          }
        } else {
          console.log(`   ❌ HubSpot contacts API error: ${contactsResponse.status}`);
        }
        
        // Sync deals
        console.log('\n📥 Syncing deals...');
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
            const dealsToSync = dealsData.results.map(deal => ({
              user_id: tokens.user_id,
              provider: 'hubspot',
              external_id: deal.id,
              data: {
                dealname: deal.properties.dealname || '',
                amount: deal.properties.amount || '0',
                dealstage: deal.properties.dealstage || '',
                pipeline: deal.properties.pipeline || '',
                closedate: deal.properties.closedate || null,
                raw: deal
              }
            }));
            
            // Clear existing deals for this user
            await supabase
              .from('synced_deals')
              .delete()
              .eq('user_id', tokens.user_id)
              .eq('provider', 'hubspot');
            
            const { error: insertError } = await supabase
              .from('synced_deals')
              .insert(dealsToSync);
              
            if (insertError) {
              console.log(`   ❌ Deal insert failed: ${insertError.message}`);
            } else {
              console.log(`   ✅ Successfully synced ${dealsToSync.length} deals!`);
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
          .eq('user_id', tokens.user_id);
          
        const { data: finalDeals } = await supabase
          .from('synced_deals')
          .select('*')
          .eq('user_id', tokens.user_id);
        
        console.log(`   📞 Contacts synced: ${finalContacts?.length || 0}`);
        console.log(`   🤝 Deals synced: ${finalDeals?.length || 0}`);
        
        if (finalContacts && finalContacts.length > 0) {
          const sample = finalContacts[0];
          const contactName = sample.data?.firstname && sample.data?.lastname 
            ? `${sample.data.firstname} ${sample.data.lastname}`
            : sample.data?.email || 'Unknown';
          console.log(`   👤 Sample contact: ${contactName}`);
        }
        
        if (finalDeals && finalDeals.length > 0) {
          const sample = finalDeals[0];
          const dealName = sample.data?.dealname || 'Unknown Deal';
          const dealAmount = sample.data?.amount || '0';
          console.log(`   💰 Sample deal: ${dealName} ($${dealAmount})`);
        }
        
        if ((finalContacts?.length || 0) > 0 || (finalDeals?.length || 0) > 0) {
          console.log('\n🎉 HubSpot sync successful! AI-Integration Bridge is now ready!');
          console.log('📱 Test the chat widget with these queries:');
          console.log('   - "Who are our customers?"');
          console.log('   - "Show me recent contacts"');
          console.log('   - "What deals are in progress?"');
          console.log('   - "Tell me about our sales pipeline"');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Final test failed:', error);
  }
}

finalSyncTest().catch(console.error);