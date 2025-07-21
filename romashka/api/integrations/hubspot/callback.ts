/**
 * HubSpot OAuth Callback API Endpoint
 * Handles the OAuth callback from HubSpot and completes the integration setup
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, state, error, error_description } = req.query;

    // Handle OAuth errors
    if (error) {
      console.error('HubSpot OAuth error:', error, error_description);
      return res.redirect(`${process.env.FRONTEND_URL}/integrations?error=oauth_failed&provider=hubspot&details=${error_description}`);
    }

    // Validate required parameters
    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/integrations?error=missing_params&provider=hubspot`);
    }

    // Exchange authorization code for access token
    const tokenUrl = 'https://api.hubapi.com/oauth/v1/token';
    
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.HUBSPOT_CLIENT_ID!,
      client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
      redirect_uri: `${process.env.VERCEL_URL || process.env.FRONTEND_URL}/api/integrations/hubspot/callback`,
      code: typeof code === 'string' ? code : '',
    });

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${tokenResponse.statusText} - ${errorText}`);
    }

    const tokenData = await tokenResponse.json();

    // Get token info to extract portal details
    const tokenInfoResponse = await fetch(`https://api.hubapi.com/oauth/v1/access-tokens/${tokenData.access_token}`, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!tokenInfoResponse.ok) {
      throw new Error(`Failed to fetch token info: ${tokenInfoResponse.statusText}`);
    }

    const tokenInfo = await tokenInfoResponse.json();

    // Extract user ID from state
    const userId = state; // Assuming state contains user ID

    if (!userId) {
      return res.redirect(`${process.env.FRONTEND_URL}/integrations?error=invalid_session&provider=hubspot`);
    }

    // Store OAuth token in database
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
    
    const { data: tokenRow, error: tokenError } = await supabase
      .from('oauth_tokens')
      .insert({
        user_id: userId,
        provider: 'hubspot',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_type: tokenData.token_type,
        expires_at: expiresAt.toISOString(),
        store_identifier: tokenInfo.hub_id.toString(),
      })
      .select()
      .single();

    if (tokenError) {
      console.error('Error storing OAuth token:', tokenError);
      return res.redirect(`${process.env.FRONTEND_URL}/integrations?error=database_error&provider=hubspot`);
    }

    // Store HubSpot-specific data
    const { error: portalError } = await supabase
      .from('hubspot_portals')
      .insert({
        user_id: userId,
        oauth_token_id: tokenRow.id,
        portal_id: tokenInfo.hub_id.toString(),
        hub_domain: tokenInfo.hub_domain,
        hub_id: tokenInfo.hub_id.toString(),
      });

    if (portalError) {
      console.error('Error storing portal data:', portalError);
      return res.redirect(`${process.env.FRONTEND_URL}/integrations?error=database_error&provider=hubspot`);
    }

    // Log successful integration
    await supabase
      .from('integration_logs')
      .insert({
        user_id: userId,
        provider: 'hubspot',
        action: 'oauth_connect',
        status: 'success',
        message: 'HubSpot portal connected successfully',
        details: {
          portal_id: tokenInfo.hub_id,
          hub_domain: tokenInfo.hub_domain,
          expires_in: tokenData.expires_in
        }
      });

    // Redirect to success page
    return res.redirect(`${process.env.FRONTEND_URL}/integrations?success=connected&provider=hubspot&portal=${tokenInfo.hub_id}`);

  } catch (error) {
    console.error('HubSpot OAuth callback error:', error);
    return res.redirect(`${process.env.FRONTEND_URL}/integrations?error=callback_failed&provider=hubspot`);
  }
}