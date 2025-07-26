/**
 * Simple Debug API Endpoint
 * Test basic functionality without dependencies
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Test environment variables
    const envTest = {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_KEY,
      hasHubspotClientId: !!process.env.HUBSPOT_CLIENT_ID,
      hasHubspotSecret: !!process.env.HUBSPOT_CLIENT_SECRET,
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    };

    // Test basic Supabase import
    let supabaseTest = 'Not tested';
    try {
      const { createClient } = await import('@supabase/supabase-js');
      supabaseTest = 'Import successful';
      
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_KEY
        );
        supabaseTest = 'Client created successfully';
      }
    } catch (supabaseError) {
      supabaseTest = `Error: ${supabaseError instanceof Error ? supabaseError.message : 'Unknown'}`;
    }

    return res.status(200).json({
      success: true,
      message: 'Debug API is working',
      method: req.method,
      url: req.url,
      environment: envTest,
      supabaseTest,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Debug API failed',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}