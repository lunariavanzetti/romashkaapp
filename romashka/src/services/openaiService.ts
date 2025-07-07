import OpenAI from 'openai';

interface OpenAIConfig {
  apiKey: string;
  model: 'gpt-4o-mini';
  maxTokens: number;
  temperature: number;
  presencePenalty: number;
  frequencyPenalty: number;
}

interface ConversationContext {
  conversationId: string;
  messages: Message[];
  customerProfile: CustomerProfile;
  knowledgeBase: KnowledgeItem[];
  language: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  intent: string;
  confidence: number;
  businessContext: BusinessContext;
}

interface BusinessContext {
  companyName: string;
  industry: string;
  products: string[];
  policies: string[];
  contactInfo: ContactInfo;
}

interface ContactInfo {
  email: string;
  phone: string;
  website: string;
  address: string;
}

interface CustomerProfile {
  name: string;
  email: string;
  preferences: string[];
  history: string[];
  language: string;
}

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  relevanceScore: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'ai' | 'agent';
  content: string;
  created_at: string;
  metadata?: any;
}

interface AIResponse {
  message: string;
  confidence: number;
  intent: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  language: string;
  processingTime: number;
  tokensUsed: number;
  knowledgeSources: string[];
}

interface Entity {
  name: string;
  type: string;
  value: string;
}

interface CustomerPreferences {
  language: string;
  communicationStyle: string;
  topics: string[];
  urgency: string;
}

class OpenAIService {
  private openai: OpenAI;
  private config: OpenAIConfig;

  constructor() {
    this.openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true,
    });
    this.config = {
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      model: 'gpt-4o-mini',
      maxTokens: 500,
      temperature: 0.7,
      presencePenalty: 0.1,
      frequencyPenalty: 0.1
    };
  }

  async generateResponse(message: string, context: ConversationContext): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      // Step 1: Detect language if not provided
      const language = context.language || await this.detectLanguage(message);
      
      // Step 2: Analyze intent and sentiment
      const [intent, sentiment] = await Promise.all([
        this.detectIntent(message, language),
        this.analyzeSentiment(message, language)
      ]);
      
      // Step 3: Retrieve relevant knowledge
      const relevantKnowledge = await this.retrieveKnowledge(message, intent, context);
      
      // Step 4: Build system prompt with context
      const systemPrompt = this.buildSystemPrompt(context, relevantKnowledge, language);
      
      // Step 5: Generate response using GPT-4o Mini
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: "system", content: systemPrompt },
          ...this.buildConversationHistory(context.messages),
          { role: "user", content: message }
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        presence_penalty: this.config.presencePenalty,
        frequency_penalty: this.config.frequencyPenalty
      });

      const aiMessage = response.choices[0].message.content || "I apologize, I couldn't generate a response.";
      const confidence = await this.calculateConfidence(message, aiMessage, relevantKnowledge);
      
      return {
        message: aiMessage,
        confidence,
        intent,
        sentiment,
        language,
        processingTime: Date.now() - startTime,
        tokensUsed: response.usage?.total_tokens || 0,
        knowledgeSources: relevantKnowledge.map(k => k.id)
      };
      
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.getFallbackResponse(context.language || 'en');
    }
  }

  private async detectLanguage(text: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: "system",
            content: "Detect the language of the following text. Respond with only the ISO 639-1 language code (e.g., 'en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'ru', 'ja', 'zh', 'ko', 'ar'). If unsure, respond with 'en'."
          },
          { role: "user", content: text }
        ],
        temperature: 0.1,
        max_tokens: 10
      });
      
      const detectedLang = (response.choices[0].message.content?.trim().toLowerCase() || 'en');
      const supportedLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'ru', 'ja', 'zh', 'ko', 'ar'];
      
      return supportedLanguages.includes(detectedLang) ? detectedLang : 'en';
    } catch (error) {
      console.error('Language detection error:', error);
      return 'en';
    }
  }

  private async detectIntent(message: string, language: string): Promise<string> {
    try {
      const intentPrompt = this.getIntentDetectionPrompt(language);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: "system", content: intentPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.1,
        max_tokens: 50
      });
      
      return response.choices[0].message.content?.trim() || 'general_inquiry';
    } catch (error) {
      console.error('Intent detection error:', error);
      return 'general_inquiry';
    }
  }

  private async analyzeSentiment(message: string, language: string): Promise<'positive' | 'negative' | 'neutral'> {
    try {
      const sentimentPrompt = this.getSentimentAnalysisPrompt(language);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: "system", content: sentimentPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.1,
        max_tokens: 10
      });
      
      const sentiment = response.choices[0].message.content?.trim().toLowerCase() || 'neutral';
      return ['positive', 'negative', 'neutral'].includes(sentiment) ? sentiment as any : 'neutral';
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return 'neutral';
    }
  }

  private async retrieveKnowledge(message: string, intent: string, context: ConversationContext): Promise<KnowledgeItem[]> {
    // Use vector similarity search or keyword matching
    const relevantItems = context.knowledgeBase.filter(item => {
      const relevanceScore = this.calculateRelevanceScore(message, intent, item);
      return relevanceScore > 0.3;
    });
    
    return relevantItems.slice(0, 5); // Top 5 most relevant items
  }

  private calculateRelevanceScore(message: string, intent: string, knowledgeItem: KnowledgeItem): number {
    const messageWords = message.toLowerCase().split(' ');
    const knowledgeWords = knowledgeItem.content.toLowerCase().split(' ');
    const titleWords = knowledgeItem.title.toLowerCase().split(' ');
    
    let score = 0;
    
    // Check for word overlap
    const commonWords = messageWords.filter(word => 
      knowledgeWords.includes(word) || titleWords.includes(word)
    );
    score += commonWords.length / messageWords.length;
    
    // Check for intent match
    if (knowledgeItem.tags.includes(intent)) {
      score += 0.3;
    }
    
    // Check for category match
    if (knowledgeItem.category.toLowerCase().includes(intent)) {
      score += 0.2;
    }
    
    return Math.min(1, score);
  }

  private buildSystemPrompt(context: ConversationContext, knowledge: KnowledgeItem[], language: string): string {
    const languageInstructions = this.getLanguageInstructions(language);
    const businessInfo = this.formatBusinessContext(context.businessContext);
    const knowledgeInfo = this.formatKnowledgeBase(knowledge);
    
    return `You are ROMASHKA, an AI customer service agent for ${context.businessContext?.companyName || 'this company'}.

${languageInstructions}

BUSINESS CONTEXT:
${businessInfo}

KNOWLEDGE BASE:
${knowledgeInfo}

INSTRUCTIONS:
- Be helpful, professional, and concise
- Use the knowledge base to provide accurate information
- If you don't know something, admit it and offer to connect with a human agent
- Match the customer's tone and language preference
- Keep responses under 200 words unless more detail is specifically requested
- Always prioritize customer satisfaction and problem resolution

CONVERSATION CONTEXT:
- Customer sentiment: ${context.sentiment}
- Previous intent: ${context.intent}
- Language: ${context.language}`;
  }

  private buildConversationHistory(messages: Message[]): any[] {
    return messages.slice(-10).map(msg => ({
      role: msg.sender_type === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
  }

  private getLanguageInstructions(language: string): string {
    const instructions = {
      'en': 'Respond in clear, professional English.',
      'es': 'Responde en español claro y profesional.',
      'fr': 'Répondez en français clair et professionnel.',
      'de': 'Antworten Sie in klarem, professionellem Deutsch.',
      'it': 'Rispondi in italiano chiaro e professionale.',
      'pt': 'Responda em português claro e profissional.',
      'nl': 'Antwoord in duidelijk, professioneel Nederlands.',
      'ru': 'Отвечайте на ясном, профессиональном русском языке.',
      'ja': '明確で専門的な日本語で応答してください。',
      'zh': '用清晰、专业的中文回复。',
      'ko': '명확하고 전문적인 한국어로 응답하세요.',
      'ar': 'أجب باللغة العربية الواضحة والمهنية.'
    };
    
    return instructions[language as keyof typeof instructions] || instructions['en'];
  }

  private getIntentDetectionPrompt(language: string): string {
    return `Analyze the user's message and identify their intent. Respond with ONE of these intents:
- pricing_inquiry (asking about prices, costs, plans)
- product_info (asking about products, features, specifications)
- support_request (technical issues, problems, troubleshooting)
- order_status (checking order, shipping, delivery)
- return_refund (returns, refunds, exchanges)
- billing_question (payment, invoices, billing issues)
- general_inquiry (general questions, company info)
- booking_appointment (scheduling, meetings, demos)
- complaint (negative feedback, dissatisfaction)
- compliment (positive feedback, praise)

Respond with only the intent name, nothing else.`;
  }

  private getSentimentAnalysisPrompt(language: string): string {
    return `Analyze the emotional tone of the user's message. Respond with ONE word only:
- positive (happy, satisfied, excited, grateful)
- negative (angry, frustrated, disappointed, upset)
- neutral (informational, factual, neither positive nor negative)

Respond with only: positive, negative, or neutral`;
  }

  private formatBusinessContext(context: BusinessContext): string {
    if (!context) return 'No business context available.';
    
    return `
Company: ${context.companyName}
Industry: ${context.industry}
Products: ${context.products.join(', ')}
Policies: ${context.policies.join(', ')}
Contact: ${context.contactInfo.email} | ${context.contactInfo.phone}
Website: ${context.contactInfo.website}
Address: ${context.contactInfo.address}
`.trim();
  }

  private formatKnowledgeBase(knowledge: KnowledgeItem[]): string {
    if (knowledge.length === 0) return 'No relevant knowledge base information available.';
    
    return knowledge.map(item => `
Title: ${item.title}
Category: ${item.category}
Content: ${item.content.substring(0, 200)}...
Tags: ${item.tags.join(', ')}
`).join('\n---\n');
  }

  private async calculateConfidence(userMessage: string, aiResponse: string, knowledge: KnowledgeItem[]): Promise<number> {
    // Calculate confidence based on:
    // 1. Knowledge base coverage
    // 2. Response specificity
    // 3. Intent match accuracy
    
    let confidence = 0.5; // Base confidence
    
    // Boost confidence if relevant knowledge was found
    if (knowledge.length > 0) {
      confidence += 0.3;
    }
    
    // Boost confidence for specific responses (longer, more detailed)
    if (aiResponse.length > 100) {
      confidence += 0.1;
    }
    
    // Reduce confidence for generic responses
    if (aiResponse.includes("I don't know") || aiResponse.includes("not sure")) {
      confidence -= 0.2;
    }
    
    return Math.max(0, Math.min(1, confidence));
  }

  private getFallbackResponse(language: string): AIResponse {
    const fallbackMessages = {
      'en': "I'm sorry, I'm having trouble processing your request right now. Please try again later or contact our support team.",
      'es': "Lo siento, tengo problemas para procesar tu solicitud ahora. Por favor intenta más tarde o contacta a nuestro equipo de soporte.",
      'fr': "Désolé, j'ai des difficultés à traiter votre demande maintenant. Veuillez réessayer plus tard ou contacter notre équipe de support.",
      'de': "Entschuldigung, ich habe Probleme bei der Bearbeitung Ihrer Anfrage. Bitte versuchen Sie es später erneut oder kontaktieren Sie unser Support-Team.",
      'it': "Mi dispiace, ho problemi nell'elaborare la tua richiesta ora. Riprova più tardi o contatta il nostro team di supporto.",
      'pt': "Desculpe, estou tendo problemas para processar sua solicitação agora. Tente novamente mais tarde ou entre em contato com nossa equipe de suporte.",
      'nl': "Sorry, ik heb problemen met het verwerken van uw verzoek. Probeer het later opnieuw of neem contact op met ons supportteam.",
      'ru': "Извините, у меня проблемы с обработкой вашего запроса. Попробуйте позже или обратитесь в службу поддержки.",
      'ja': "申し訳ございませんが、現在リクエストの処理に問題があります。後でもう一度試すか、サポートチームにお問い合わせください。",
      'zh': "抱歉，我现在处理您的请求时遇到问题。请稍后再试或联系我们的支持团队。",
      'ko': "죄송합니다. 현재 요청 처리에 문제가 있습니다. 나중에 다시 시도하거나 지원팀에 문의하세요.",
      'ar': "آسف، أواجه مشكلة في معالجة طلبك الآن. يرجى المحاولة مرة أخرى لاحقاً أو الاتصال بفريق الدعم."
    };
    
    return {
      message: fallbackMessages[language as keyof typeof fallbackMessages] || fallbackMessages['en'],
      confidence: 0.1,
      intent: 'error',
      sentiment: 'neutral',
      language,
      processingTime: 0,
      tokensUsed: 0,
      knowledgeSources: []
    };
  }

  // Additional methods for advanced features
  async analyzeConversationContext(conversationId: string, messages: Message[]): Promise<ConversationContext> {
    // Analyze conversation history to extract context
    const lastMessage = messages[messages.length - 1];
    const language = await this.detectLanguage(lastMessage.content);
    const intent = await this.detectIntent(lastMessage.content, language);
    const sentiment = await this.analyzeSentiment(lastMessage.content, language);
    
    return {
      conversationId,
      messages,
      customerProfile: this.extractCustomerProfile(messages),
      knowledgeBase: [],
      language,
      sentiment,
      intent,
      confidence: 0.8,
      businessContext: this.getDefaultBusinessContext()
    };
  }

  private extractCustomerProfile(messages: Message[]): CustomerProfile {
    // Extract customer information from conversation history
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

  private getDefaultBusinessContext(): BusinessContext {
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
}

export default OpenAIService;
export type { AIResponse, ConversationContext, BusinessContext, CustomerProfile, KnowledgeItem, Message, Entity, CustomerPreferences }; 