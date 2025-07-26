import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('[DEBUG] AI Integration test endpoint called');

    // Test user ID (from previous sync)
    const userId = '51193de1-b935-42a8-b341-9f021f6a90d2';

    // Fetch integration data
    const [contactsResult, dealsResult] = await Promise.all([
      supabase
        .from('synced_contacts')
        .select('*')
        .eq('user_id', userId)
        .limit(10),
      
      supabase
        .from('synced_deals')
        .select('*')
        .eq('user_id', userId)
        .limit(10)
    ]);

    console.log('[DEBUG] Contacts query result:', {
      error: contactsResult.error,
      count: contactsResult.data?.length || 0
    });

    console.log('[DEBUG] Deals query result:', {
      error: dealsResult.error,
      count: dealsResult.data?.length || 0
    });

    // Format response
    const integrationData = {
      contacts: contactsResult.data || [],
      deals: dealsResult.data || [],
      contactsError: contactsResult.error,
      dealsError: dealsResult.error
    };

    // Test AI context generation
    let aiContext = '';
    
    if (integrationData.contacts.length > 0) {
      aiContext += '\n=== CUSTOMER CONTACTS ===\n';
      integrationData.contacts.forEach(contact => {
        aiContext += `• ${contact.first_name || ''} ${contact.last_name || ''} (${contact.email || 'No email'})`;
        if (contact.company) aiContext += ` - ${contact.company}`;
        aiContext += '\n';
      });
    }

    if (integrationData.deals.length > 0) {
      aiContext += '\n=== ACTIVE DEALS ===\n';
      integrationData.deals.forEach(deal => {
        aiContext += `• ${deal.deal_name || 'Unnamed Deal'}`;
        if (deal.amount) aiContext += ` - $${deal.amount}`;
        if (deal.stage) aiContext += ` (${deal.stage})`;
        aiContext += '\n';
      });
    }

    return res.status(200).json({
      success: true,
      message: 'AI Integration Bridge test completed',
      data: {
        contactsCount: integrationData.contacts.length,
        dealsCount: integrationData.deals.length,
        integrationData: integrationData,
        aiContext: aiContext,
        errors: {
          contacts: contactsResult.error,
          deals: dealsResult.error
        }
      }
    });

  } catch (error) {
    console.error('[DEBUG] AI Integration test error:', error);
    return res.status(500).json({ 
      error: 'AI Integration test failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}