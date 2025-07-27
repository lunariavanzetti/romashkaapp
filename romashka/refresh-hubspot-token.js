/**
 * Refresh expired HubSpot OAuth token and then sync data
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function refreshTokenAndSync() {
  console.log('🔄 Refreshing HubSpot OAuth Token\n');

  try {
    // Get the current token data
    const { data: tokens, error: tokenError } = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('provider', 'hubspot')
      .single();
      
    if (tokenError || !tokens) {
      console.log('❌ No HubSpot OAuth token found:', tokenError?.message);
      return;
    }
    
    console.log(`🔑 Found expired token for user: ${tokens.user_id}`);
    
    if (!tokens.refresh_token) {
      console.log('❌ No refresh token available. User needs to reconnect OAuth.');
      console.log('   Go to /integrations page and reconnect HubSpot.');
      return;
    }
    
    // Refresh the token
    console.log('🔄 Refreshing token using refresh_token...');
    
    const refreshResponse = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.HUBSPOT_CLIENT_ID,
        client_secret: process.env.HUBSPOT_CLIENT_SECRET,
        refresh_token: tokens.refresh_token
      })
    });
    
    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text();
      console.log(`❌ Token refresh failed: ${refreshResponse.status} ${refreshResponse.statusText}`);
      console.log(`   Error: ${errorText}`);
      return;
    }
    
    const refreshData = await refreshResponse.json();
    console.log('✅ Token refreshed successfully!');
    
    // Update token in database
    const expiresAt = new Date(Date.now() + (refreshData.expires_in * 1000));
    
    const { error: updateError } = await supabase
      .from('oauth_tokens')
      .update({
        access_token: refreshData.access_token,
        refresh_token: refreshData.refresh_token || tokens.refresh_token, // Use new refresh token if provided
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', tokens.id);
      
    if (updateError) {
      console.log('❌ Failed to update token in database:', updateError.message);
      return;
    }
    
    console.log(`✅ Token updated in database, expires: ${expiresAt.toLocaleString()}`);
    
    // Now sync data with the new token
    console.log('\n📥 Syncing HubSpot data with refreshed token...');
    
    const newAccessToken = refreshData.access_token;
    
    // Fetch contacts
    const contactsResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=50', {
      headers: {
        'Authorization': `Bearer ${newAccessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!contactsResponse.ok) {
      console.log(`❌ HubSpot contacts API error: ${contactsResponse.status} ${contactsResponse.statusText}`);
      return;
    }
    
    const contactsData = await contactsResponse.json();
    console.log(`✅ Fetched ${contactsData.results?.length || 0} contacts from HubSpot`);
    
    // Insert contacts
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
      
      // Clear existing contacts
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
    const dealsResponse = await fetch('https://api.hubapi.com/crm/v3/objects/deals?limit=50', {
      headers: {
        'Authorization': `Bearer ${newAccessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!dealsResponse.ok) {
      console.log(`❌ HubSpot deals API error: ${dealsResponse.status} ${dealsResponse.statusText}`);
    } else {
      const dealsData = await dealsResponse.json();
      console.log(`✅ Fetched ${dealsData.results?.length || 0} deals from HubSpot`);
      
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
        
        // Clear existing deals
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
    
    // Final verification
    const { data: finalContacts } = await supabase
      .from('synced_contacts')
      .select('*')
      .eq('user_id', tokens.user_id);
      
    const { data: finalDeals } = await supabase
      .from('synced_deals')
      .select('*')
      .eq('user_id', tokens.user_id);
    
    console.log(`\n📊 Sync Results:`);
    console.log(`   Contacts: ${finalContacts?.length || 0}`);
    console.log(`   Deals: ${finalDeals?.length || 0}`);
    
    if ((finalContacts?.length || 0) > 0 || (finalDeals?.length || 0) > 0) {
      console.log('\n🎉 HubSpot sync successful! AI-Integration Bridge is now ready.');
      console.log('📱 Test the chat widget with queries like:');
      console.log('   - "Who are our customers?"');
      console.log('   - "Show me recent contacts"');
      console.log('   - "What deals are in progress?"');
    }
    
  } catch (error) {
    console.error('❌ Token refresh failed:', error.message);
  }
}

refreshTokenAndSync().catch(console.error);