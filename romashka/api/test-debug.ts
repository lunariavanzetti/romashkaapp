/**
 * Ultra-Simple Debug API Endpoint
 * Test absolute basic functionality
 */

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const response = {
      success: true,
      message: 'Ultra-simple debug API is working',
      method: req.method,
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      env: {
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasHubspotClientId: !!process.env.HUBSPOT_CLIENT_ID
      }
    };

    return res.status(200).json(response);

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Ultra-simple debug failed',
      details: String(error)
    });
  }
}