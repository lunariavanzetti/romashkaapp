import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('[Direct Test] Testing integration data access');
    
    // Use the known user ID
    const userId = '51193de1-b935-42a8-b341-9f021f6a90d2';
    
    // Test direct database access
    const [contactsResult, dealsResult] = await Promise.all([
      supabase
        .from('synced_contacts')
        .select('*')
        .eq('user_id', userId)
        .limit(5),
      
      supabase
        .from('synced_deals')
        .select('*')
        .eq('user_id', userId)
        .limit(5)
    ]);

    console.log('[Direct Test] Contacts result:', {
      error: contactsResult.error,
      count: contactsResult.data?.length || 0
    });

    console.log('[Direct Test] Deals result:', {
      error: dealsResult.error,
      count: dealsResult.data?.length || 0
    });

    // Format data for AI context
    let aiContext = '';
    
    if (contactsResult.data && contactsResult.data.length > 0) {
      aiContext += '\n=== CUSTOMER CONTACTS ===\n';
      contactsResult.data.forEach(contact => {
        aiContext += `• ${contact.first_name || ''} ${contact.last_name || ''} (${contact.email || 'No email'})`;
        if (contact.company) aiContext += ` - ${contact.company}`;
        aiContext += '\n';
      });
    }

    if (dealsResult.data && dealsResult.data.length > 0) {
      aiContext += '\n=== ACTIVE DEALS ===\n';
      dealsResult.data.forEach(deal => {
        aiContext += `• ${deal.deal_name || 'Unnamed Deal'}`;
        if (deal.amount) aiContext += ` - $${deal.amount}`;
        if (deal.stage) aiContext += ` (${deal.stage})`;
        aiContext += '\n';
      });
    }

    // Test OpenAI integration with context
    let aiResponse = '';
    if (aiContext) {
      const systemPrompt = `You are ROMASHKA, an AI customer service agent. Use the following real-time integration data to answer questions:

${aiContext}

Answer the question: "Who are our customers?" using the above data. Be specific and mention actual names and companies.`;

      try {
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: 'Who are our customers?' }
            ],
            temperature: 0.7,
            max_tokens: 500
          })
        });

        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json();
          aiResponse = openaiData.choices[0].message.content;
        } else {
          aiResponse = `OpenAI API error: ${openaiResponse.status}`;
        }
      } catch (openaiError) {
        aiResponse = `OpenAI error: ${openaiError}`;
      }
    } else {
      aiResponse = 'No integration data found to provide context';
    }

    return res.status(200).json({
      success: true,
      data: {
        userId,
        contactsCount: contactsResult.data?.length || 0,
        dealsCount: dealsResult.data?.length || 0,
        contactsError: contactsResult.error,
        dealsError: dealsResult.error,
        aiContext,
        aiResponse,
        contacts: contactsResult.data?.slice(0, 3) || [],
        deals: dealsResult.data?.slice(0, 3) || []
      }
    });

  } catch (error) {
    console.error('[Direct Test] Error:', error);
    return res.status(500).json({ 
      error: 'Direct integration test failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}