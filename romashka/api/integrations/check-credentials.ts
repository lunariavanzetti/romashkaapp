/**
 * Check OAuth Credentials API Endpoint
 * Returns whether OAuth credentials are configured for each provider
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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

    return res.status(200).json({
      success: true,
      configured,
      details: credentials // For debugging (remove in production)
    });

  } catch (error) {
    console.error('Error checking OAuth credentials:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to check credentials' 
    });
  }
}