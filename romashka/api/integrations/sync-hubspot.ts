import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[DEBUG] HubSpot sync request received');
    const { integrationId, userId } = req.body;

    if (!integrationId || !userId) {
      console.log('[DEBUG] Missing parameters:', { integrationId, userId });
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // First refresh the token to ensure it's valid
    const origin = req.headers.origin || 'https://romashkaai.vercel.app';
    const refreshResponse = await fetch(`${origin}/api/integrations/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ integrationId, userId })
    });

    if (!refreshResponse.ok) {
      console.log('[DEBUG] Token refresh failed');
      return res.status(400).json({ error: 'Unable to refresh token' });
    }

    const { accessToken } = await refreshResponse.json();
    console.log('[DEBUG] Got valid access token, starting sync');

    // Sync contacts
    console.log('[DEBUG] Fetching contacts from HubSpot API');
    const contactsResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?properties=email,firstname,lastname,phone,company,jobtitle,lifecyclestage,hs_lead_source,createdate,lastmodifieddate&limit=100', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('[DEBUG] Contacts API response status:', contactsResponse.status);

    if (!contactsResponse.ok) {
      const errorText = await contactsResponse.text();
      console.error('[DEBUG] HubSpot contacts API failed:', contactsResponse.status, errorText);
      return res.status(400).json({ error: 'Failed to fetch contacts from HubSpot', details: errorText });
    }

    const contactsData = await contactsResponse.json();
    console.log('[DEBUG] Fetched contacts from HubSpot:', contactsData.results?.length || 0);

    // Store contacts in database
    let contactsStored = 0;
    if (contactsData.results && contactsData.results.length > 0) {
      for (const contact of contactsData.results) {
        try {
          await supabase
            .from('synced_contacts')
            .upsert({
              user_id: userId,
              provider: 'hubspot',
              external_id: contact.id,
              email: contact.properties.email || null,
              first_name: contact.properties.firstname || null,
              last_name: contact.properties.lastname || null,
              phone: contact.properties.phone || null,
              company: contact.properties.company || null,
              job_title: contact.properties.jobtitle || null,
              lifecycle_stage: contact.properties.lifecyclestage || null,
              lead_source: contact.properties.hs_lead_source || null,
              raw_data: contact,
              created_at: contact.properties.createdate ? new Date(contact.properties.createdate) : new Date(),
              updated_at: contact.properties.lastmodifieddate ? new Date(contact.properties.lastmodifieddate) : new Date()
            }, {
              onConflict: 'user_id,provider,external_id'
            });
          contactsStored++;
        } catch (error) {
          console.error('[DEBUG] Error storing contact:', error);
        }
      }
    }

    // Sync deals
    console.log('[DEBUG] Fetching deals from HubSpot API');
    const dealsResponse = await fetch('https://api.hubapi.com/crm/v3/objects/deals?properties=dealname,amount,dealstage,closedate,createdate,pipeline,dealtype&limit=100', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('[DEBUG] Deals API response status:', dealsResponse.status);

    let dealsStored = 0;
    if (dealsResponse.ok) {
      const dealsData = await dealsResponse.json();
      console.log('[DEBUG] Fetched deals from HubSpot:', dealsData.results?.length || 0);
      
      if (dealsData.results && dealsData.results.length > 0) {
        for (const deal of dealsData.results) {
          try {
            await supabase
              .from('synced_deals')
              .upsert({
                user_id: userId,
                provider: 'hubspot',
                external_id: deal.id,
                deal_name: deal.properties.dealname || null,
                amount: deal.properties.amount ? parseFloat(deal.properties.amount) : null,
                stage: deal.properties.dealstage || null,
                close_date: deal.properties.closedate ? new Date(deal.properties.closedate) : null,
                pipeline: deal.properties.pipeline || null,
                deal_type: deal.properties.dealtype || null,
                raw_data: deal,
                created_at: deal.properties.createdate ? new Date(deal.properties.createdate) : new Date(),
                updated_at: new Date()
              }, {
                onConflict: 'user_id,provider,external_id'
              });
            dealsStored++;
          } catch (error) {
            console.error('[DEBUG] Error storing deal:', error);
          }
        }
      }
    }

    // Update integration last sync time
    await supabase
      .from('oauth_tokens')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', integrationId);

    const result = {
      contacts: contactsStored,
      deals: dealsStored,
      total_synced: contactsStored + dealsStored,
      last_sync_at: new Date().toISOString()
    };

    console.log('[DEBUG] Sync completed:', result);
    return res.status(200).json(result);

  } catch (error) {
    console.error('[DEBUG] Sync error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}