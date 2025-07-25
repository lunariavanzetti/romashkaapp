/**
 * Check OAuth Credentials API Endpoint
 * Returns user info and connected integrations for authenticated users
 * Vercel Serverless Function
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log(`[DEBUG] check-credentials called - Method: ${req.method}, URL: ${req.url}`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    console.log(`[DEBUG] Method not allowed: ${req.method}`);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Try to get user from cookies first (for browser requests)
    let user = null;
    let authError = null;

    // Check for Supabase session cookie
    if (req.headers.cookie) {
      const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      // Look for Supabase auth token in cookies
      const authToken = cookies['sb-dbieawxwlbwakkuvaihh-auth-token'];
      if (authToken) {
        try {
          const tokenData = JSON.parse(decodeURIComponent(authToken));
          if (tokenData.access_token) {
            const { data, error } = await supabase.auth.getUser(tokenData.access_token);
            user = data.user;
            authError = error;
          }
        } catch (cookieError) {
          console.log('[DEBUG] Cookie parsing failed:', cookieError);
        }
      }
    }

    // If no user from cookies, check Authorization header
    if (!user && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const { data, error } = await supabase.auth.getUser(token);
        user = data.user;
        authError = error;
      }
    }

    console.log('[DEBUG] User authentication status:', { 
      hasUser: !!user, 
      userId: user?.id,
      authError: authError?.message 
    });

    // Check environment variables for OAuth credentials
    const envDebug = {
      HUBSPOT_CLIENT_ID: !!process.env.HUBSPOT_CLIENT_ID,
      HUBSPOT_CLIENT_SECRET: !!process.env.HUBSPOT_CLIENT_SECRET,
      SHOPIFY_CLIENT_ID: !!process.env.SHOPIFY_CLIENT_ID,
      SHOPIFY_CLIENT_SECRET: !!process.env.SHOPIFY_CLIENT_SECRET,
      SALESFORCE_CLIENT_ID: !!process.env.SALESFORCE_CLIENT_ID,
      SALESFORCE_CLIENT_SECRET: !!process.env.SALESFORCE_CLIENT_SECRET
    };

    const credentials = {
      shopify: {
        hasClientId: !!(process.env.SHOPIFY_CLIENT_ID && process.env.SHOPIFY_CLIENT_ID.length > 0),
        hasClientSecret: !!(process.env.SHOPIFY_CLIENT_SECRET && process.env.SHOPIFY_CLIENT_SECRET.length > 0)
      },
      salesforce: {
        hasClientId: !!(process.env.SALESFORCE_CLIENT_ID && process.env.SALESFORCE_CLIENT_ID.length > 0),
        hasClientSecret: !!(process.env.SALESFORCE_CLIENT_SECRET && process.env.SALESFORCE_CLIENT_SECRET.length > 0)
      },
      hubspot: {
        hasClientId: !!(process.env.HUBSPOT_CLIENT_ID && process.env.HUBSPOT_CLIENT_ID.length > 0),
        hasClientSecret: !!(process.env.HUBSPOT_CLIENT_SECRET && process.env.HUBSPOT_CLIENT_SECRET.length > 0)
      }
    };

    const configured = Object.fromEntries(
      Object.entries(credentials).map(([provider, creds]) => [
        provider,
        creds.hasClientId && creds.hasClientSecret
      ])
    );

    let integrations = [];
    
    // If user is authenticated, get their connected integrations
    if (user) {
      const { data: integrationsData, error: integrationsError } = await supabase
        .from('oauth_tokens')
        .select('*')
        .eq('user_id', user.id)
        .in('provider', ['shopify', 'salesforce', 'hubspot']);

      if (integrationsError) {
        console.error('[DEBUG] Error fetching integrations:', integrationsError);
      } else {
        integrations = integrationsData || [];
        console.log('[DEBUG] Found integrations:', integrations.length);
      }
    }

    const response = {
      success: true,
      configured,
      user: user ? {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      } : null,
      integrations,
      debug: {
        timestamp: new Date().toISOString(),
        method: req.method,
        envDebug,
        hasAuthHeader: !!req.headers.authorization,
        hasCookies: !!req.headers.cookie
      }
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error checking OAuth credentials:', error);
    const errorResponse = { 
      success: false, 
      error: 'Failed to check credentials',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
    
    return res.status(500).json(errorResponse);
  }
}