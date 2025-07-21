/**
 * Salesforce OAuth Callback API Endpoint
 * Handles the OAuth callback from Salesforce and completes the integration setup
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
      console.error('Salesforce OAuth error:', error, error_description);
      return res.redirect(`${process.env.FRONTEND_URL}/integrations?error=oauth_failed&provider=salesforce&details=${error_description}`);
    }

    // Validate required parameters
    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/integrations?error=missing_params&provider=salesforce`);
    }

    // Exchange authorization code for access token
    const tokenUrl = 'https://login.salesforce.com/services/oauth2/token';
    
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.SALESFORCE_CLIENT_ID!,
      client_secret: process.env.SALESFORCE_CLIENT_SECRET!,
      redirect_uri: `${process.env.VERCEL_URL || process.env.FRONTEND_URL}/api/integrations/salesforce/callback`,
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

    // Get user info
    const userInfoResponse = await fetch(`${tokenData.instance_url}/services/oauth2/userinfo`, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!userInfoResponse.ok) {
      throw new Error(`Failed to fetch user info: ${userInfoResponse.statusText}`);
    }

    const userInfo = await userInfoResponse.json();

    // Extract user ID from state
    const userId = state; // Assuming state contains user ID

    if (!userId) {
      return res.redirect(`${process.env.FRONTEND_URL}/integrations?error=invalid_session&provider=salesforce`);
    }

    // Store OAuth token in database
    const { data: tokenRow, error: tokenError } = await supabase
      .from('oauth_tokens')
      .insert({
        user_id: userId,
        provider: 'salesforce',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_type: tokenData.token_type,
        scope: tokenData.scope,
        store_identifier: tokenData.instance_url,
      })
      .select()
      .single();

    if (tokenError) {
      console.error('Error storing OAuth token:', tokenError);
      return res.redirect(`${process.env.FRONTEND_URL}/integrations?error=database_error&provider=salesforce`);
    }

    // Store Salesforce-specific data
    const { error: orgError } = await supabase
      .from('salesforce_orgs')
      .insert({
        user_id: userId,
        oauth_token_id: tokenRow.id,
        instance_url: tokenData.instance_url,
        org_id: userInfo.organization_id,
        org_name: userInfo.organization?.name,
        org_type: userInfo.organization?.org_type,
      });

    if (orgError) {
      console.error('Error storing org data:', orgError);
      return res.redirect(`${process.env.FRONTEND_URL}/integrations?error=database_error&provider=salesforce`);
    }

    // Log successful integration
    await supabase
      .from('integration_logs')
      .insert({
        user_id: userId,
        provider: 'salesforce',
        action: 'oauth_connect',
        status: 'success',
        message: 'Salesforce org connected successfully',
        details: {
          instance_url: tokenData.instance_url,
          org_name: userInfo.organization?.name,
          scopes: tokenData.scope
        }
      });

    // Redirect to success page
    return res.redirect(`${process.env.FRONTEND_URL}/integrations?success=connected&provider=salesforce&org=${encodeURIComponent(userInfo.organization?.name || 'Unknown')}`);

  } catch (error) {
    console.error('Salesforce OAuth callback error:', error);
    return res.redirect(`${process.env.FRONTEND_URL}/integrations?error=callback_failed&provider=salesforce`);
  }
}