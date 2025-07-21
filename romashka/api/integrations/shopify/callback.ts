/**
 * Shopify OAuth Callback API Endpoint
 * Handles the OAuth callback from Shopify and completes the integration setup
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
    const { code, shop, state, error, error_description } = req.query;

    // Handle OAuth errors
    if (error) {
      console.error('Shopify OAuth error:', error, error_description);
      return res.redirect(`${process.env.FRONTEND_URL}/integrations?error=oauth_failed&provider=shopify&details=${error_description}`);
    }

    // Validate required parameters
    if (!code || !shop) {
      return res.redirect(`${process.env.FRONTEND_URL}/integrations?error=missing_params&provider=shopify`);
    }

    // Extract shop domain (remove .myshopify.com if present)
    const shopDomain = typeof shop === 'string' ? shop.replace('.myshopify.com', '') : '';

    // Exchange authorization code for access token
    const tokenUrl = `https://${shopDomain}.myshopify.com/admin/oauth/access_token`;
    
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_CLIENT_ID,
        client_secret: process.env.SHOPIFY_CLIENT_SECRET,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json();

    // Get shop details
    const shopResponse = await fetch(`https://${shopDomain}.myshopify.com/admin/api/2023-07/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': tokenData.access_token,
        'Content-Type': 'application/json',
      },
    });

    if (!shopResponse.ok) {
      throw new Error(`Failed to fetch shop details: ${shopResponse.statusText}`);
    }

    const shopData = await shopResponse.json();
    const shopInfo = shopData.shop;

    // Extract user ID from state (if implemented) or handle differently
    // For now, we'll need to get this from the user session
    // This is a simplified version - in production, you'd want proper state management
    const userId = state; // Assuming state contains user ID

    if (!userId) {
      return res.redirect(`${process.env.FRONTEND_URL}/integrations?error=invalid_session&provider=shopify`);
    }

    // Store OAuth token in database
    const { data: tokenRow, error: tokenError } = await supabase
      .from('oauth_tokens')
      .insert({
        user_id: userId,
        provider: 'shopify',
        access_token: tokenData.access_token,
        scope: tokenData.scope,
        store_identifier: shopDomain,
      })
      .select()
      .single();

    if (tokenError) {
      console.error('Error storing OAuth token:', tokenError);
      return res.redirect(`${process.env.FRONTEND_URL}/integrations?error=database_error&provider=shopify`);
    }

    // Store Shopify-specific data
    const { error: shopError } = await supabase
      .from('shopify_stores')
      .insert({
        user_id: userId,
        oauth_token_id: tokenRow.id,
        shop_domain: shopDomain,
        shop_name: shopInfo.name,
        email: shopInfo.email,
        currency: shopInfo.currency,
        timezone: shopInfo.iana_timezone,
        country_code: shopInfo.country_code,
      });

    if (shopError) {
      console.error('Error storing shop data:', shopError);
      return res.redirect(`${process.env.FRONTEND_URL}/integrations?error=database_error&provider=shopify`);
    }

    // Log successful integration
    await supabase
      .from('integration_logs')
      .insert({
        user_id: userId,
        provider: 'shopify',
        action: 'oauth_connect',
        status: 'success',
        message: 'Shopify store connected successfully',
        details: {
          shop_domain: shopDomain,
          shop_name: shopInfo.name,
          scopes: tokenData.scope
        }
      });

    // Redirect to success page
    return res.redirect(`${process.env.FRONTEND_URL}/integrations?success=connected&provider=shopify&store=${shopDomain}`);

  } catch (error) {
    console.error('Shopify OAuth callback error:', error);
    return res.redirect(`${process.env.FRONTEND_URL}/integrations?error=callback_failed&provider=shopify`);
  }
}