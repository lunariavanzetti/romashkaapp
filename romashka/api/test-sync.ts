import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('[DEBUG] Test sync endpoint called');
    
    // Make a POST request to our sync endpoint
    const syncResponse = await fetch(`${req.headers.origin || 'https://romashkaai.vercel.app'}/api/integrations/sync-hubspot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        integrationId: '36e6f929-5048-45d9-81c1-7479317fe890',
        userId: '51193de1-b935-42a8-b341-9f021f6a90d2'
      })
    });

    console.log('[DEBUG] Sync response status:', syncResponse.status);
    
    if (!syncResponse.ok) {
      const errorText = await syncResponse.text();
      console.error('[DEBUG] Sync failed:', errorText);
      return res.status(500).json({ 
        error: 'Sync failed', 
        status: syncResponse.status,
        details: errorText 
      });
    }

    const syncResult = await syncResponse.json();
    console.log('[DEBUG] Sync completed:', syncResult);
    
    return res.status(200).json({
      success: true,
      message: 'HubSpot sync completed successfully!',
      result: syncResult
    });

  } catch (error) {
    console.error('[DEBUG] Test sync error:', error);
    return res.status(500).json({ 
      error: 'Test sync failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}