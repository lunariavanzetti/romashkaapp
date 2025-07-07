import { OpenAI } from 'openai';
import type { KnowledgeBase } from '../types/supabase';

const openai = new OpenAI({ apiKey: import.meta.env.VITE_OPENAI_API_KEY, dangerouslyAllowBrowser: true });

export class AIService {
  async generateResponse(message: string, context: KnowledgeBase[], language: string = 'en') {
    const systemPrompt = `You are ROMASHKA, an AI customer service agent.\nUse the following knowledge base to answer questions: ${JSON.stringify(context)}\nBe helpful, professional, concise. Reply in ${language}.`;
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 500
    });
    return response.choices[0].message.content;
  }
  // TODO: Add sentiment analysis, categorization, fallback, etc.
} 