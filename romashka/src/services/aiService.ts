import { OpenAI } from 'openai';
import type { KnowledgeBase } from '../types/supabase';
import type { User } from '@supabase/supabase-js';
import AIIntegrationBridge from './integrations/aiIntegrationBridge';

const openai = new OpenAI({ apiKey: import.meta.env.VITE_OPENAI_API_KEY, dangerouslyAllowBrowser: true });

export class AIService {
  async generateResponse(message: string, context: KnowledgeBase[], language: string = 'en', user?: User) {
    console.log('[AI Service] generateResponse called with:', { 
      message: message.substring(0, 50) + '...', 
      hasUser: !!user, 
      userId: user?.id 
    });
    
    let systemPrompt = `You are ROMASHKA, an AI customer service agent.\nUse the following knowledge base to answer questions: ${JSON.stringify(context)}\nBe helpful, professional, concise. Reply in ${language}.`;
    
    // Enhanced with Integration Bridge - access real-time CRM/e-commerce data
    let integrationContext = '';
    if (user) {
      try {
        console.log('[AI Service] User available, creating integration bridge for user:', user.id);
        const bridge = new AIIntegrationBridge(user);
        
        // Check if the message is asking about integration data
        const isIntegrationQuery = bridge.isIntegrationQuery(message);
        console.log('[AI Service] Integration query detected:', isIntegrationQuery);
        
        if (isIntegrationQuery) {
          console.log('[AI Service] Fetching relevant integration data...');
          integrationContext = await bridge.getRelevantData(message);
          console.log('[AI Service] Integration context received:', integrationContext ? integrationContext.substring(0, 200) + '...' : 'EMPTY');
          
          if (integrationContext) {
            systemPrompt += `\n\n=== REAL-TIME INTEGRATION DATA ===\n${integrationContext}\n\nUse this integration data to provide accurate, up-to-date information about customers, deals, orders, and products. When referencing this data, be specific and helpful.`;
            console.log('[AI Service] System prompt enhanced with integration data');
          } else {
            console.warn('[AI Service] No integration context returned despite being integration query');
          }
        }
      } catch (error) {
        console.error('[AI Service] Integration bridge error:', error);
        // Continue without integration data if there's an error
      }
    } else {
      console.warn('[AI Service] No user provided - cannot access integration data');
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 800 // Increased for integration context
    });
    return response.choices[0].message.content;
  }

  async generateResponseWithIntegrationContext(message: string, context: KnowledgeBase[], user: User, language: string = 'en') {
    return this.generateResponse(message, context, language, user);
  }
  
  // TODO: Add sentiment analysis, categorization, fallback, etc.
}

export const aiService = new AIService(); 