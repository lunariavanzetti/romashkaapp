/**
 * Check OAuth Credentials API Endpoint
 * Returns whether OAuth credentials are configured for each provider
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log(`[DEBUG] check-credentials called - Method: ${req.method}, URL: ${req.url}`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
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
    console.log('[DEBUG] Checking environment variables...');
    
    const envDebug = {
      HUBSPOT_CLIENT_ID: !!process.env.HUBSPOT_CLIENT_ID,
      HUBSPOT_CLIENT_SECRET: !!process.env.HUBSPOT_CLIENT_SECRET,
      SHOPIFY_CLIENT_ID: !!process.env.SHOPIFY_CLIENT_ID,
      SHOPIFY_CLIENT_SECRET: !!process.env.SHOPIFY_CLIENT_SECRET,
      SALESFORCE_CLIENT_ID: !!process.env.SALESFORCE_CLIENT_ID,
      SALESFORCE_CLIENT_SECRET: !!process.env.SALESFORCE_CLIENT_SECRET
    };
    
    console.log('[DEBUG] Environment variables status:', envDebug);
    
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

    // Check if any credentials are properly configured
    const configured = Object.fromEntries(
      Object.entries(credentials).map(([provider, creds]) => [
        provider,
        creds.hasClientId && creds.hasClientSecret
      ])
    );

    console.log('[DEBUG] Credentials check result:', { configured, credentials });

    return res.status(200).json({
      success: true,
      configured,
      details: credentials, // For debugging (remove in production)
      debug: {
        timestamp: new Date().toISOString(),
        method: req.method,
        envDebug
      }
    });

  } catch (error) {
    console.error('Error checking OAuth credentials:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to check credentials',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}