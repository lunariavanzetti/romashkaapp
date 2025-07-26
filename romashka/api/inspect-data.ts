import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const userId = '51193de1-b935-42a8-b341-9f021f6a90d2';

    // Get actual contact and deal data
    const [contactsResult, dealsResult] = await Promise.all([
      supabase
        .from('synced_contacts')
        .select('*')
        .eq('user_id', userId),
      
      supabase
        .from('synced_deals')
        .select('*')
        .eq('user_id', userId)
    ]);

    const contacts = contactsResult.data || [];
    const deals = dealsResult.data || [];

    return res.status(200).json({
      success: true,
      data: {
        contacts: contacts.map(c => ({
          name: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
          email: c.email,
          company: c.company,
          phone: c.phone,
          job_title: c.job_title,
          created_at: c.created_at
        })),
        deals: deals.map(d => ({
          deal_name: d.deal_name,
          amount: d.amount,
          stage: d.stage,
          close_date: d.close_date,
          contact_email: d.contact_email,
          created_at: d.created_at
        })),
        summary: {
          total_contacts: contacts.length,
          total_deals: deals.length,
          total_deal_value: deals.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0),
          companies: [...new Set(contacts.filter(c => c.company).map(c => c.company))],
          deal_stages: [...new Set(deals.filter(d => d.stage).map(d => d.stage))]
        }
      }
    });

  } catch (error) {
    console.error('Data inspection error:', error);
    return res.status(500).json({ 
      error: 'Failed to inspect data', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}