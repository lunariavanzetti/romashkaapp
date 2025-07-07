import { supabase } from './supabaseClient';
import type { ConversationContext, Message, Entity, CustomerPreferences, AIResponse } from './openaiService';

class ContextManager {
  async updateContext(conversationId: string, message: string, response: AIResponse): Promise<void> {
    try {
      // Update conversation with AI analysis
      const { error: convError } = await supabase
        .from('conversations')
        .update({
          language: response.language,
          sentiment: response.sentiment,
          intent: response.intent,
          ai_confidence: response.confidence,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (convError) throw convError;

      // Update conversation context
      const contextData = {
        last_intent: response.intent,
        sentiment: response.sentiment,
        language: response.language,
        confidence: response.confidence,
        processing_time: response.processingTime,
        tokens_used: response.tokensUsed,
        knowledge_sources: response.knowledgeSources
      };

      const { error: contextError } = await supabase
        .from('conversation_context')
        .upsert({
          conversation_id: conversationId,
          context_data: contextData,
          last_intent: response.intent,
          updated_at: new Date().toISOString()
        });

      if (contextError) throw contextError;

    } catch (error) {
      console.error('Error updating context:', error);
    }
  }

  async getConversationContext(conversationId: string): Promise<ConversationContext | null> {
    try {
      // Get conversation data
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (convError) throw convError;

      // Get messages
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (msgError) throw msgError;

      // Get context data
      const { data: contextData, error: contextError } = await supabase
        .from('conversation_context')
        .select('*')
        .eq('conversation_id', conversationId)
        .single();

      if (contextError && contextError.code !== 'PGRST116') throw contextError;

      return {
        conversationId,
        messages: messages || [],
        customerProfile: this.extractCustomerProfile(messages || []),
        knowledgeBase: [], // Will be populated by knowledge retrieval
        language: conversation.language || 'en',
        sentiment: (conversation.sentiment as any) || 'neutral',
        intent: conversation.intent || 'general_inquiry',
        confidence: conversation.ai_confidence || 0.5,
        businessContext: this.getDefaultBusinessContext()
      };

    } catch (error) {
      console.error('Error getting conversation context:', error);
      return null;
    }
  }

  async summarizeConversation(messages: Message[]): Promise<string> {
    try {
      // Use OpenAI to generate a summary
      const { OpenAI } = await import('openai');
      const openai = new OpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true,
      });

      const conversationText = messages
        .map(msg => `${msg.sender_type}: ${msg.content}`)
        .join('\n');

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Summarize this conversation in 2-3 sentences, highlighting the main topic and any key decisions or actions taken.'
          },
          {
            role: 'user',
            content: conversationText
          }
        ],
        max_tokens: 150,
        temperature: 0.3
      });

      return response.choices[0].message.content || 'No summary available.';
    } catch (error) {
      console.error('Error summarizing conversation:', error);
      return 'Summary generation failed.';
    }
  }

  async extractKeyEntities(conversationId: string): Promise<Entity[]> {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const conversationText = messages?.map(m => m.content).join(' ') || '';

      // Use OpenAI to extract entities
      const { OpenAI } = await import('openai');
      const openai = new OpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true,
      });

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Extract key entities from this conversation. Return as JSON array with objects containing: name, type (person, product, company, location, etc.), value. Example: [{"name": "John", "type": "person", "value": "customer"}]'
          },
          {
            role: 'user',
            content: conversationText
          }
        ],
        max_tokens: 200,
        temperature: 0.1
      });

      const entitiesText = response.choices[0].message.content || '[]';
      return JSON.parse(entitiesText);

    } catch (error) {
      console.error('Error extracting entities:', error);
      return [];
    }
  }

  async identifyCustomerPreferences(conversationId: string): Promise<CustomerPreferences> {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('content, sender_type')
        .eq('conversation_id', conversationId)
        .eq('sender_type', 'user')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const userMessages = messages?.map(m => m.content).join(' ') || '';

      // Use OpenAI to analyze preferences
      const { OpenAI } = await import('openai');
      const openai = new OpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true,
      });

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Analyze customer preferences from these messages. Return as JSON: {"language": "en/es/fr/etc", "communicationStyle": "formal/casual", "topics": ["topic1", "topic2"], "urgency": "low/medium/high"}'
          },
          {
            role: 'user',
            content: userMessages
          }
        ],
        max_tokens: 150,
        temperature: 0.3
      });

      const preferencesText = response.choices[0].message.content || '{}';
      return JSON.parse(preferencesText);

    } catch (error) {
      console.error('Error identifying preferences:', error);
      return {
        language: 'en',
        communicationStyle: 'formal',
        topics: [],
        urgency: 'medium'
      };
    }
  }

  private extractCustomerProfile(messages: Message[]): any {
    const userMessages = messages.filter(m => m.sender_type === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1];

    return {
      name: 'Customer',
      email: 'customer@example.com',
      preferences: [],
      history: userMessages.map(m => m.content),
      language: 'en'
    };
  }

  private getDefaultBusinessContext(): any {
    return {
      companyName: 'ROMASHKA',
      industry: 'Technology',
      products: ['AI Chat Support', 'Customer Service Platform'],
      policies: ['24/7 Support', 'Money-back guarantee'],
      contactInfo: {
        email: 'support@romashka.com',
        phone: '+1 (555) 123-4567',
        website: 'https://romashka.com',
        address: '123 Tech Street, Silicon Valley, CA'
      }
    };
  }

  async updateConversationSummary(conversationId: string): Promise<void> {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const summary = await this.summarizeConversation(messages || []);

      const { error: updateError } = await supabase
        .from('conversation_context')
        .upsert({
          conversation_id: conversationId,
          conversation_summary: summary,
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;

    } catch (error) {
      console.error('Error updating conversation summary:', error);
    }
  }

  async updateCustomerPreferences(conversationId: string): Promise<void> {
    try {
      const preferences = await this.identifyCustomerPreferences(conversationId);

      const { error } = await supabase
        .from('conversation_context')
        .upsert({
          conversation_id: conversationId,
          customer_preferences: preferences,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

    } catch (error) {
      console.error('Error updating customer preferences:', error);
    }
  }

  async updateKeyEntities(conversationId: string): Promise<void> {
    try {
      const entities = await this.extractKeyEntities(conversationId);

      const { error } = await supabase
        .from('conversation_context')
        .upsert({
          conversation_id: conversationId,
          key_entities: entities,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

    } catch (error) {
      console.error('Error updating key entities:', error);
    }
  }
}

export default new ContextManager(); 