import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('[DEBUG] Knowledge generation test endpoint called');

    // Test user ID (from previous sync)
    const userId = '51193de1-b935-42a8-b341-9f021f6a90d2';

    // Fetch integration data
    const [contactsResult, dealsResult, productsResult, ordersResult] = await Promise.all([
      supabase
        .from('synced_contacts')
        .select('*')
        .eq('user_id', userId),
      
      supabase
        .from('synced_deals')
        .select('*')
        .eq('user_id', userId),
        
      supabase
        .from('synced_products')
        .select('*')
        .eq('user_id', userId),
        
      supabase
        .from('synced_orders')
        .select('*')
        .eq('user_id', userId)
    ]);

    console.log('[DEBUG] Integration data counts:', {
      contacts: contactsResult.data?.length || 0,
      deals: dealsResult.data?.length || 0,
      products: productsResult.data?.length || 0,
      orders: ordersResult.data?.length || 0
    });

    // Generate knowledge entries
    const knowledgeEntries = [];
    const contacts = contactsResult.data || [];
    const deals = dealsResult.data || [];
    const products = productsResult.data || [];
    const orders = ordersResult.data || [];

    // Customer overview knowledge
    if (contacts.length > 0) {
      const companies = [...new Set(contacts.filter(c => c.company).map(c => c.company))];
      
      knowledgeEntries.push({
        title: 'Customer Database Overview',
        content: `We have ${contacts.length} contacts in our system. Key companies include: ${companies.slice(0, 10).join(', ')}. Our customer base spans across various industries and represents our growing network of business relationships.`,
        category: 'customers',
        tags: ['contacts', 'customers', 'overview'],
        source: 'integration_auto_generated',
        confidence_score: 0.9
      });
    }

    // Sales pipeline knowledge
    if (deals.length > 0) {
      const totalValue = deals.reduce((sum, deal) => sum + (Number(deal.amount) || 0), 0);
      const stages = [...new Set(deals.filter(d => d.stage).map(d => d.stage))];
      
      knowledgeEntries.push({
        title: 'Sales Pipeline Overview',
        content: `We currently have ${deals.length} active deals in our pipeline with a total value of $${totalValue.toLocaleString()}. Deal stages include: ${stages.join(', ')}. Our sales team is actively working on closing these opportunities.`,
        category: 'sales',
        tags: ['deals', 'pipeline', 'sales'],
        source: 'integration_auto_generated',
        confidence_score: 0.9
      });
    }

    // Business overview summary
    knowledgeEntries.push({
      title: 'Business Overview Summary',
      content: `Our business currently manages ${contacts.length} customer contacts, ${deals.length} active deals, ${products.length} products, and ${orders.length} processed orders. This integrated view provides a comprehensive understanding of our business operations, customer relationships, and sales performance.`,
      category: 'overview',
      tags: ['summary', 'business', 'overview', 'integrated'],
      source: 'integration_auto_generated',
      confidence_score: 0.95
    });

    // Save to knowledge base (delete existing auto-generated first)
    await supabase
      .from('knowledge_base')
      .delete()
      .eq('user_id', userId)
      .eq('source', 'integration_auto_generated');

    // Insert new knowledge entries
    const dbEntries = knowledgeEntries.map(entry => ({
      user_id: userId,
      title: entry.title,
      content: entry.content,
      category: entry.category,
      tags: entry.tags,
      source: entry.source,
      confidence_score: entry.confidence_score,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { error: insertError } = await supabase
      .from('knowledge_base')
      .insert(dbEntries);

    if (insertError) {
      console.error('[DEBUG] Knowledge insert error:', insertError);
      return res.status(500).json({
        error: 'Failed to save knowledge entries',
        details: insertError.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Smart Knowledge Generation test completed',
      data: {
        integrationDataCounts: {
          contacts: contacts.length,
          deals: deals.length,
          products: products.length,
          orders: orders.length
        },
        generatedKnowledge: knowledgeEntries,
        savedCount: dbEntries.length
      }
    });

  } catch (error) {
    console.error('[DEBUG] Knowledge generation test error:', error);
    return res.status(500).json({ 
      error: 'Knowledge generation test failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}