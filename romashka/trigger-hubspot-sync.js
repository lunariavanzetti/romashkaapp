/**
 * Trigger HubSpot sync to populate the database with contact and deal data
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function triggerHubSpotSync() {
  console.log('🚀 Triggering HubSpot Data Sync\n');

  try {
    // First, get the OAuth token
    const { data: tokens, error: tokenError } = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('provider', 'hubspot')
      .single();
      
    if (tokenError || !tokens) {
      console.log('❌ No HubSpot OAuth token found:', tokenError?.message);
      return;
    }
    
    console.log(`✅ Found HubSpot token for user: ${tokens.user_id}`);
    
    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(tokens.expires_at);
    
    if (now > expiresAt) {
      console.log('❌ Token is expired. Need to refresh or reconnect.');
      return;
    }
    
    console.log(`✅ Token valid until: ${expiresAt.toLocaleString()}`);
    
    // Now manually sync HubSpot data using the token
    console.log('\n📥 Fetching contacts from HubSpot...');
    
    const contactsResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=50', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!contactsResponse.ok) {
      console.log(`❌ HubSpot contacts API error: ${contactsResponse.status} ${contactsResponse.statusText}`);
      return;
    }
    
    const contactsData = await contactsResponse.json();
    console.log(`✅ Fetched ${contactsData.results?.length || 0} contacts from HubSpot`);
    
    // Insert contacts into synced_contacts table
    if (contactsData.results && contactsData.results.length > 0) {
      const contactsToInsert = contactsData.results.map(contact => ({
        user_id: tokens.user_id,
        hubspot_contact_id: contact.id,
        firstname: contact.properties.firstname || '',
        lastname: contact.properties.lastname || '',
        email: contact.properties.email || '',
        phone: contact.properties.phone || '',
        company: contact.properties.company || '',
        raw_data: contact,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      // Clear existing contacts for this user first
      await supabase
        .from('synced_contacts')
        .delete()
        .eq('user_id', tokens.user_id);
      
      const { error: insertError } = await supabase
        .from('synced_contacts')
        .insert(contactsToInsert);
        
      if (insertError) {
        console.log('❌ Failed to insert contacts:', insertError.message);
      } else {
        console.log(`✅ Inserted ${contactsToInsert.length} contacts into database`);
      }
    }
    
    // Fetch deals
    console.log('\n📥 Fetching deals from HubSpot...');
    
    const dealsResponse = await fetch('https://api.hubapi.com/crm/v3/objects/deals?limit=50', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!dealsResponse.ok) {
      console.log(`❌ HubSpot deals API error: ${dealsResponse.status} ${dealsResponse.statusText}`);
    } else {
      const dealsData = await dealsResponse.json();
      console.log(`✅ Fetched ${dealsData.results?.length || 0} deals from HubSpot`);
      
      // Insert deals into synced_deals table
      if (dealsData.results && dealsData.results.length > 0) {
        const dealsToInsert = dealsData.results.map(deal => ({
          user_id: tokens.user_id,
          hubspot_deal_id: deal.id,
          dealname: deal.properties.dealname || '',
          amount: deal.properties.amount || '0',
          dealstage: deal.properties.dealstage || '',
          pipeline: deal.properties.pipeline || '',
          closedate: deal.properties.closedate || null,
          raw_data: deal,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        // Clear existing deals for this user first
        await supabase
          .from('synced_deals')
          .delete()
          .eq('user_id', tokens.user_id);
        
        const { error: insertError } = await supabase
          .from('synced_deals')
          .insert(dealsToInsert);
          
        if (insertError) {
          console.log('❌ Failed to insert deals:', insertError.message);
        } else {
          console.log(`✅ Inserted ${dealsToInsert.length} deals into database`);
        }
      }
    }
    
    // Verify the sync worked
    console.log('\n✅ Sync complete! Verifying data...');
    
    const { data: finalContacts, error: finalContactsError } = await supabase
      .from('synced_contacts')
      .select('*')
      .eq('user_id', tokens.user_id);
      
    const { data: finalDeals, error: finalDealsError } = await supabase
      .from('synced_deals')
      .select('*')
      .eq('user_id', tokens.user_id);
    
    console.log(`📊 Final counts:`);
    console.log(`   Contacts: ${finalContacts?.length || 0}`);
    console.log(`   Deals: ${finalDeals?.length || 0}`);
    
    if ((finalContacts?.length || 0) > 0) {
      console.log('\n🎉 HubSpot sync successful! Data is now available for AI-Integration Bridge.');
      console.log('📱 You can now test the chat widget with integration queries.');
    }
    
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
  }
}

triggerHubSpotSync().catch(console.error);