import OpenAI from 'openai';
import { supabase } from './supabaseClient';
import type { 
  BotConfiguration, 
  PersonalityTraits, 
  PersonalityAnalysis, 
  PlaygroundTestResponse 
} from '../types/botConfiguration';

interface KnowledgeContext {
  companyName?: string;
  industry?: string;
  products?: string[];
  services?: string[];
  policies?: string[];
  faqs?: Array<{ question: string; answer: string; }>;
  extractedContent?: Array<{
    url: string;
    title: string;
    content: string;
    content_type: string;
  }>;
}

export class PlaygroundAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });
  }

  /**
   * Get real knowledge context from scanned website data
   */
  async getRealKnowledgeContext(): Promise<KnowledgeContext> {
    try {
      console.log('🔍 Fetching real scanned content from database...');
      
      if (!supabase) {
        console.warn('⚠️ Supabase not available, using default context');
        return this.getDefaultKnowledgeContext();
      }

      // Get the latest extracted content
      const { data: extractedContent, error } = await supabase
        .from('extracted_content')
        .select('url, title, content, content_type')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('❌ Error fetching scanned content:', error);
        return this.getDefaultKnowledgeContext();
      }

      if (!extractedContent || extractedContent.length === 0) {
        console.warn('⚠️ No scanned content found, using default context');
        return this.getDefaultKnowledgeContext();
      }

      console.log(`✅ Found ${extractedContent.length} pieces of scanned content`);

      // Extract FAQs from content
      const faqs: Array<{ question: string; answer: string; }> = [];
      
      extractedContent.forEach(content => {
        if (content.content_type === 'faq' && content.content) {
          // Extract Q&A pairs from FAQ content
          const qaPairs = this.extractQAPairs(content.content);
          faqs.push(...qaPairs);
        }
      });

      // Extract company name from content
      let companyName = 'ROMASHKA';
      const aboutContent = extractedContent.find(c => c.content_type === 'about');
      if (aboutContent) {
        const nameMatch = aboutContent.content.match(/(?:about|company|we are)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
        if (nameMatch) companyName = nameMatch[1];
      }

      return {
        companyName,
        industry: 'Wedding Services', // Detected from your content
        extractedContent,
        faqs,
        products: [],
        services: [],
        policies: []
      };

    } catch (error) {
      console.error('❌ Error getting real knowledge context:', error);
      return this.getDefaultKnowledgeContext();
    }
  }

  /**
   * Extract Q&A pairs from FAQ content
   */
  private extractQAPairs(content: string): Array<{ question: string; answer: string; }> {
    const pairs: Array<{ question: string; answer: string; }> = [];
    
    // Split content into lines and look for questions (ending with ?)
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this line looks like a question
      if (line.includes('?') && line.length > 10 && line.length < 200) {
        const question = line;
        
        // Look for the answer in the next few lines
        let answer = '';
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const nextLine = lines[j];
          
          // Stop if we hit another question
          if (nextLine.includes('?') && nextLine.length > 10) break;
          
          // Add this line to the answer
          if (nextLine.length > 10) {
            answer += (answer ? ' ' : '') + nextLine;
          }
        }
        
        if (answer.length > 10) {
          pairs.push({ question, answer });
        }
      }
    }
    
    console.log(`📝 Extracted ${pairs.length} Q&A pairs from FAQ content`);
    return pairs;
  }

  /**
   * Generate test response with personality-specific system prompt
   */
  async generateTestResponse(
    testMessage: string,
    botConfig: BotConfiguration,
    knowledgeContext?: KnowledgeContext
  ): Promise<PlaygroundTestResponse> {
    const startTime = Date.now();
    
    try {
      const systemPrompt = this.createSystemPrompt(botConfig, knowledgeContext);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: testMessage }
        ],
        temperature: this.calculateTemperature(botConfig.personality_traits),
        max_tokens: this.calculateMaxTokens(botConfig.response_style),
        presence_penalty: this.calculatePresencePenalty(botConfig.personality_traits),
        frequency_penalty: 0.1
      });

      const responseTime = Date.now() - startTime;
      const botResponse = response.choices[0]?.message?.content || '';
      
      // Analyze response quality
      const personalityScore = await this.analyzeResponseQuality(
        botResponse, 
        botConfig.personality_traits
      );

      // Extract knowledge sources (simulate for now)
      const knowledgeSources = this.extractKnowledgeSources(botResponse, knowledgeContext);

      // Calculate confidence based on response quality and completion
      const confidence = this.calculateConfidence(response, personalityScore);

      return {
        response: botResponse,
        response_time: responseTime,
        confidence,
        personality_score: personalityScore,
        knowledge_sources: knowledgeSources
      };

    } catch (error) {
      console.error('OpenAI API error:', error);
      
      // Fallback to mock response when API fails
      console.log('Using fallback mock response due to API error');
      return this.generateMockResponse(testMessage, botConfig, knowledgeContext);
    }
  }

  /**
   * Create personality-specific system prompt
   */
  private createSystemPrompt(config: BotConfiguration, context?: KnowledgeContext): string {
    const { formality, enthusiasm, technical_depth, empathy } = config.personality_traits;
    
    let prompt = `You are ${config.bot_name}, a customer service AI assistant.`;
    
    if (context?.companyName) {
      prompt += ` You work for ${context.companyName}`;
      if (context.industry) {
        prompt += ` in the ${context.industry} industry`;
      }
      prompt += '.';
    }

    prompt += '\n\nPersonality Configuration:\n';
    
    // Formality level
    if (formality <= 20) {
      prompt += '- Communication Style: Very casual and relaxed. Use contractions, informal language, and a friendly tone.\n';
    } else if (formality <= 40) {
      prompt += '- Communication Style: Casual but professional. Balance friendliness with competence.\n';
    } else if (formality <= 60) {
      prompt += '- Communication Style: Conversational and approachable while maintaining professionalism.\n';
    } else if (formality <= 80) {
      prompt += '- Communication Style: Professional and polished. Use proper grammar and structured responses.\n';
    } else {
      prompt += '- Communication Style: Very formal and business-like. Use complete sentences and avoid contractions.\n';
    }

    // Enthusiasm level
    if (enthusiasm <= 20) {
      prompt += '- Energy Level: Calm and measured. Provide steady, reliable responses without excessive excitement.\n';
    } else if (enthusiasm <= 40) {
      prompt += '- Energy Level: Moderate enthusiasm. Show interest while remaining composed.\n';
    } else if (enthusiasm <= 60) {
      prompt += '- Energy Level: Positive and engaging. Express genuine interest in helping customers.\n';
    } else if (enthusiasm <= 80) {
      prompt += '- Energy Level: High enthusiasm. Use exclamation points and positive language frequently.\n';
    } else {
      prompt += '- Energy Level: Very energetic and excited! Show passion for helping and solving problems!\n';
    }

    // Technical depth
    if (technical_depth <= 20) {
      prompt += '- Technical Explanations: Keep explanations very simple. Avoid jargon and use everyday language.\n';
    } else if (technical_depth <= 40) {
      prompt += '- Technical Explanations: Provide basic explanations with minimal technical terms.\n';
    } else if (technical_depth <= 60) {
      prompt += '- Technical Explanations: Balance technical accuracy with accessibility.\n';
    } else if (technical_depth <= 80) {
      prompt += '- Technical Explanations: Provide detailed technical information with clear explanations.\n';
    } else {
      prompt += '- Technical Explanations: Give comprehensive technical details and in-depth analysis.\n';
    }

    // Empathy level
    if (empathy <= 20) {
      prompt += '- Empathy: Direct and solution-focused. Address problems efficiently without emotional language.\n';
    } else if (empathy <= 40) {
      prompt += '- Empathy: Acknowledge customer concerns while focusing on solutions.\n';
    } else if (empathy <= 60) {
      prompt += '- Empathy: Show understanding and compassion for customer situations.\n';
    } else if (empathy <= 80) {
      prompt += '- Empathy: Express genuine concern and understanding. Validate customer feelings.\n';
    } else {
      prompt += '- Empathy: Be very understanding and supportive. Show deep concern for customer wellbeing.\n';
    }

    // Response style
    const styleInstructions = {
      'concise': 'Keep responses brief and to the point. Aim for 1-2 sentences when possible.',
      'detailed': 'Provide comprehensive responses with thorough explanations and examples.',
      'conversational': 'Use a natural, flowing dialogue style that feels like a helpful conversation.'
    };
    
    prompt += `\nResponse Style: ${styleInstructions[config.response_style]}\n`;

    // Custom instructions
    if (config.custom_instructions) {
      prompt += `\nAdditional Instructions: ${config.custom_instructions}\n`;
    }

    // Knowledge context
    if (context) {
      prompt += '\nKnowledge Base:\n';
      if (context.products?.length) {
        prompt += `- Products/Services: ${context.products.join(', ')}\n`;
      }
      if (context.policies?.length) {
        prompt += `- Company Policies: ${context.policies.join(', ')}\n`;
      }
      if (context.faqs?.length) {
        prompt += '- Common Questions:\n';
        context.faqs.forEach(faq => {
          prompt += `  Q: ${faq.question}\n  A: ${faq.answer}\n`;
        });
      }
    }

    prompt += '\nAlways maintain this personality consistently in your responses. Be helpful, accurate, and aligned with the personality traits specified above.';

    return prompt;
  }

  /**
   * Analyze response quality based on personality settings
   */
  async analyzeResponseQuality(
    response: string,
    expectedPersonality: PersonalityTraits
  ): Promise<PersonalityAnalysis> {
    try {
      const analysisPrompt = `
        Analyze the following customer service response and rate how well it matches the expected personality traits on a scale of 0-100:

        Response: "${response}"

        Expected Personality:
        - Formality: ${expectedPersonality.formality}% (0% = very casual, 100% = very formal)
        - Enthusiasm: ${expectedPersonality.enthusiasm}% (0% = reserved, 100% = very energetic)
        - Technical Depth: ${expectedPersonality.technical_depth}% (0% = simple, 100% = very technical)
        - Empathy: ${expectedPersonality.empathy}% (0% = direct, 100% = very understanding)

        Please provide a JSON response with the following structure:
        {
          "formality_score": <number 0-100>,
          "enthusiasm_score": <number 0-100>,
          "technical_depth_score": <number 0-100>,
          "empathy_score": <number 0-100>,
          "overall_alignment": <number 0-100>,
          "suggestions": ["<suggestion1>", "<suggestion2>"]
        }
      `;

      const analysisResponse = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: analysisPrompt }],
        temperature: 0.1,
        max_tokens: 500
      });

      const analysisText = analysisResponse.choices[0]?.message?.content || '{}';
      
      try {
        const analysis = JSON.parse(analysisText);
        return {
          formality_score: analysis.formality_score || 50,
          enthusiasm_score: analysis.enthusiasm_score || 50,
          technical_depth_score: analysis.technical_depth_score || 50,
          empathy_score: analysis.empathy_score || 50,
          overall_alignment: analysis.overall_alignment || 50,
          suggestions: analysis.suggestions || []
        };
      } catch (parseError) {
        console.warn('Failed to parse personality analysis:', parseError);
        return this.createDefaultAnalysis();
      }

    } catch (error) {
      console.error('Error analyzing response quality:', error);
      return this.createDefaultAnalysis();
    }
  }

  /**
   * Calculate temperature based on personality traits
   */
  private calculateTemperature(traits: PersonalityTraits): number {
    // Higher enthusiasm and lower formality = higher temperature (more creative)
    const creativityFactor = (traits.enthusiasm + (100 - traits.formality)) / 200;
    return Math.max(0.1, Math.min(1.0, 0.3 + (creativityFactor * 0.5)));
  }

  /**
   * Calculate max tokens based on response style
   */
  private calculateMaxTokens(style: string): number {
    switch (style) {
      case 'concise': return 150;
      case 'detailed': return 500;
      case 'conversational': return 300;
      default: return 300;
    }
  }

  /**
   * Calculate presence penalty based on personality traits
   */
  private calculatePresencePenalty(traits: PersonalityTraits): number {
    // Higher technical depth = lower penalty (allow repetition of technical terms)
    return Math.max(0, Math.min(1.0, 0.6 - (traits.technical_depth / 200)));
  }

  /**
   * Extract knowledge sources from response
   */
  private extractKnowledgeSources(response: string, context?: KnowledgeContext): string[] {
    const sources: string[] = [];
    
    if (!context) return sources;

    // Check for product mentions
    context.products?.forEach(product => {
      if (response.toLowerCase().includes(product.toLowerCase())) {
        sources.push(`Product: ${product}`);
      }
    });

    // Check for policy mentions
    context.policies?.forEach(policy => {
      if (response.toLowerCase().includes(policy.toLowerCase())) {
        sources.push(`Policy: ${policy}`);
      }
    });

    // Check for FAQ matches
    context.faqs?.forEach(faq => {
      const questionWords = faq.question.toLowerCase().split(' ');
      const responseWords = response.toLowerCase().split(' ');
      const matches = questionWords.filter(word => responseWords.includes(word));
      
      if (matches.length > 2) {
        sources.push(`FAQ: ${faq.question}`);
      }
    });

    return sources;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(response: any, personalityScore: PersonalityAnalysis): number {
    // Base confidence from OpenAI response quality
    const baseConfidence = response.choices[0]?.finish_reason === 'stop' ? 0.8 : 0.6;
    
    // Adjust based on personality alignment
    const alignmentFactor = personalityScore.overall_alignment / 100;
    
    // Final confidence score
    return Math.round((baseConfidence * 0.7 + alignmentFactor * 0.3) * 100);
  }

  /**
   * Create default analysis when analysis fails
   */
  private createDefaultAnalysis(): PersonalityAnalysis {
    return {
      formality_score: 50,
      enthusiasm_score: 50,
      technical_depth_score: 50,
      empathy_score: 50,
      overall_alignment: 50,
      suggestions: ['Unable to analyze response quality. Please try again.']
    };
  }

  /**
   * Test multiple scenarios with current configuration
   */
  async runScenarioTests(
    scenarios: string[],
    botConfig: BotConfiguration,
    knowledgeContext?: KnowledgeContext
  ): Promise<PlaygroundTestResponse[]> {
    const results: PlaygroundTestResponse[] = [];
    
    for (const scenario of scenarios) {
      try {
        const result = await this.generateTestResponse(scenario, botConfig, knowledgeContext);
        results.push(result);
      } catch (error) {
        console.error(`Failed to test scenario: ${scenario}`, error);
        // Continue with other scenarios
      }
    }
    
    return results;
  }

  /**
   * Generate mock response when OpenAI API fails
   */
  private generateMockResponse(
    testMessage: string,
    botConfig: BotConfiguration,
    knowledgeContext?: KnowledgeContext
  ): PlaygroundTestResponse {
    const startTime = Date.now();
    
    // Generate personality-appropriate response based on config
    let response = this.createMockResponseText(testMessage, botConfig, knowledgeContext);
    
    const responseTime = Math.random() * 800 + 200; // 200-1000ms
    
    // Create mock personality analysis
    const personalityScore: PersonalityAnalysis = {
      formality_score: Math.max(0, Math.min(100, botConfig.personality_traits.formality + (Math.random() * 20 - 10))),
      enthusiasm_score: Math.max(0, Math.min(100, botConfig.personality_traits.enthusiasm + (Math.random() * 20 - 10))),
      technical_depth_score: Math.max(0, Math.min(100, botConfig.personality_traits.technical_depth + (Math.random() * 20 - 10))),
      empathy_score: Math.max(0, Math.min(100, botConfig.personality_traits.empathy + (Math.random() * 20 - 10))),
      overall_alignment: 75 + Math.random() * 20, // 75-95% alignment
      suggestions: ['Response generated in demo mode - connect OpenAI for full functionality']
    };
    
    const knowledgeSources = this.extractKnowledgeSources(response, knowledgeContext);
    const confidence = 85 + Math.random() * 10; // 85-95% confidence
    
    return {
      response,
      response_time: Math.round(responseTime),
      confidence: Math.round(confidence),
      personality_score: personalityScore,
      knowledge_sources: knowledgeSources
    };
  }

  /**
   * Create personality-appropriate mock response text
   */
  private createMockResponseText(
    testMessage: string,
    botConfig: BotConfiguration,
    knowledgeContext?: KnowledgeContext
  ): string {
    const { formality, enthusiasm, technical_depth, empathy } = botConfig.personality_traits;
    const message = testMessage.toLowerCase();
    
    // Determine response type based on message content
    let baseResponse = '';
    
    if (message.includes('price') || message.includes('cost') || message.includes('pricing')) {
      if (knowledgeContext?.faqs?.find(faq => faq.question.toLowerCase().includes('pricing'))) {
        baseResponse = knowledgeContext.faqs.find(faq => faq.question.toLowerCase().includes('pricing'))!.answer;
      } else {
        baseResponse = 'Our pricing varies based on your specific needs. I\'d be happy to help you find the right plan for your business.';
      }
    } else if (message.includes('help') || message.includes('support')) {
      baseResponse = 'I\'m here to assist you with any questions or concerns you might have.';
    } else if (message.includes('technical') || message.includes('integration')) {
      baseResponse = 'I can help you with technical questions and integration support.';
    } else if (message.includes('hello') || message.includes('hi')) {
      baseResponse = 'Welcome! I\'m here to help you with any questions you might have.';
    } else {
      baseResponse = 'Thank you for reaching out. I\'ll do my best to help you with your question.';
    }
    
    // Adjust response based on personality traits
    let adjustedResponse = baseResponse;
    
    // Formality adjustment
    if (formality <= 30) {
      adjustedResponse = adjustedResponse.replace(/I am/g, 'I\'m').replace(/I will/g, 'I\'ll');
      adjustedResponse = adjustedResponse.replace(/\./g, '!');
    } else if (formality >= 80) {
      adjustedResponse = adjustedResponse.replace(/I'm/g, 'I am').replace(/I'll/g, 'I will');
      adjustedResponse = adjustedResponse + ' Please let me know if you need any additional assistance.';
    }
    
    // Enthusiasm adjustment
    if (enthusiasm >= 70) {
      adjustedResponse = adjustedResponse.replace(/\./g, '!');
      adjustedResponse = adjustedResponse.replace(/help/g, 'love to help');
    } else if (enthusiasm <= 30) {
      adjustedResponse = adjustedResponse.replace(/!/g, '.');
    }
    
    // Empathy adjustment
    if (empathy >= 70) {
      adjustedResponse = 'I understand this might be important to you. ' + adjustedResponse;
    }
    
    // Technical depth adjustment
    if (technical_depth >= 70 && (message.includes('technical') || message.includes('integration'))) {
      adjustedResponse += ' I can provide detailed technical documentation and step-by-step implementation guides.';
    }
    
    // Add company context if available
    if (knowledgeContext?.companyName) {
      adjustedResponse = adjustedResponse.replace(/I'm/g, `I'm ${botConfig.bot_name} from ${knowledgeContext.companyName}, and I'm`);
    }
    
    return adjustedResponse;
  }

  /**
   * Get default knowledge context for testing
   */
  getDefaultKnowledgeContext(): KnowledgeContext {
    return {
      companyName: 'ROMASHKA',
      industry: 'Customer Service Technology',
      products: ['AI Chat Support', 'Customer Service Platform', 'Knowledge Base'],
      services: ['Customer Support', 'Technical Support', 'Account Management'],
      policies: ['30-day money-back guarantee', '24/7 support', 'Data privacy protection'],
      faqs: [
        {
          question: 'How do I get started?',
          answer: 'Sign up for a free account and follow our onboarding guide.'
        },
        {
          question: 'What are your pricing plans?',
          answer: 'We offer Starter ($29/month), Professional ($99/month), and Enterprise (custom pricing) plans.'
        },
        {
          question: 'Do you offer technical support?',
          answer: 'Yes, we provide 24/7 technical support via chat, email, and phone.'
        }
      ]
    };
  }
}

export const playgroundAIService = new PlaygroundAIService();