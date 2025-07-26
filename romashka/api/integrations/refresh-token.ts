import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { integrationId, userId } = req.body;

    if (!integrationId || !userId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Get the current token from database
    const { data: token, error: tokenError } = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('id', integrationId)
      .eq('user_id', userId)
      .single();

    if (tokenError || !token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    if (token.provider !== 'hubspot') {
      return res.status(400).json({ error: 'Only HubSpot token refresh supported' });
    }

    // Check if token needs refresh
    const expiresAt = new Date(token.expires_at);
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    if (expiresAt > fiveMinutesFromNow) {
      // Token is still valid
      return res.status(200).json({ 
        accessToken: token.access_token,
        refreshed: false 
      });
    }

    // Refresh the token
    const refreshResponse = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.HUBSPOT_CLIENT_ID!,
        client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
        refresh_token: token.refresh_token,
      }),
    });

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text();
      console.error('HubSpot token refresh failed:', errorText);
      return res.status(400).json({ error: 'Token refresh failed', details: errorText });
    }

    const refreshData = await refreshResponse.json();

    // Update database with new token
    const newExpiresAt = new Date(Date.now() + refreshData.expires_in * 1000);
    
    const { error: updateError } = await supabase
      .from('oauth_tokens')
      .update({
        access_token: refreshData.access_token,
        refresh_token: refreshData.refresh_token || token.refresh_token,
        expires_at: newExpiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', integrationId);

    if (updateError) {
      console.error('Database update error:', updateError);
      return res.status(500).json({ error: 'Failed to update token in database' });
    }

    return res.status(200).json({ 
      accessToken: refreshData.access_token,
      refreshed: true 
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}