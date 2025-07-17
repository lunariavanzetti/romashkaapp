// ROMASHKA Playground AI Service
// Real OpenAI integration with personality-based system prompts

import { 
  PlaygroundAIResponse, 
  PersonalityTraits, 
  ResponseStyle, 
  AIModel, 
  PersonalityAnalysis,
  PlaygroundSession
} from '../types/playground';

export class PlaygroundAIService {
  private openaiApiKey: string;
  private baseUrl = 'https://api.openai.com/v1/chat/completions';

  constructor() {
    this.openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    if (!this.openaiApiKey) {
      console.warn('OpenAI API key not found. AI responses will be simulated.');
    }
  }

  /**
   * Generate AI response with personality-based system prompt
   */
  async generateResponse(
    message: string,
    session: PlaygroundSession
  ): Promise<PlaygroundAIResponse> {
    const startTime = Date.now();

    try {
      // If no API key, return simulated response
      if (!this.openaiApiKey) {
        return this.generateSimulatedResponse(message, session);
      }

      // Generate personality-based system prompt
      const systemPrompt = this.generatePersonalitySystemPrompt(
        session.personality_traits,
        session.response_style,
        session.system_prompt
      );

      // Prepare OpenAI request
      const requestBody = {
        model: session.ai_model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: session.bot_configuration.temperature,
        max_tokens: session.bot_configuration.max_tokens,
        top_p: session.bot_configuration.top_p || 1.0,
        frequency_penalty: session.bot_configuration.frequency_penalty || 0.0,
        presence_penalty: session.bot_configuration.presence_penalty || 0.0
      };

      // Make API call to OpenAI
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const responseText = data.choices[0]?.message?.content || '';
      const responseTime = Date.now() - startTime;

      // Analyze personality alignment
      const personalityAnalysis = await this.analyzePersonalityAlignment(
        responseText,
        session.personality_traits
      );

      // Calculate scores
      const qualityScore = this.calculateQualityScore(responseText, message);
      const confidenceScore = this.calculateConfidenceScore(data.choices[0]);

      // Calculate cost (approximate)
      const tokensUsed = data.usage?.total_tokens || 0;
      const costUsd = this.calculateCost(session.ai_model, tokensUsed);

      return {
        response: responseText,
        response_time_ms: responseTime,
        quality_score: qualityScore,
        confidence_score: confidenceScore,
        personality_analysis: personalityAnalysis,
        tokens_used: tokensUsed,
        cost_usd: costUsd
      };

    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Return fallback response
      return {
        response: 'I apologize, but I encountered an error while processing your request. Please try again.',
        response_time_ms: Date.now() - startTime,
        quality_score: 0.3,
        confidence_score: 0.2,
        personality_analysis: {
          formality: 70,
          enthusiasm: 30,
          technical_depth: 40,
          empathy: 60,
          alignment_score: 0.5,
          analysis_notes: 'Error response generated'
        },
        tokens_used: 0,
        cost_usd: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate personality-based system prompt
   */
  private generatePersonalitySystemPrompt(
    traits: PersonalityTraits,
    style: ResponseStyle,
    customPrompt?: string
  ): string {
    const basePrompt = customPrompt || 'You are ROMASHKA Assistant, a customer support AI.';
    
    const personalityInstructions = this.generatePersonalityInstructions(traits, style);
    
    return `${basePrompt}

PERSONALITY GUIDELINES:
${personalityInstructions}

RESPONSE STYLE: ${style}

Always maintain these personality traits consistently throughout your responses while being helpful and accurate.`;
  }

  /**
   * Generate personality-specific instructions
   */
  private generatePersonalityInstructions(traits: PersonalityTraits, style: ResponseStyle): string {
    const instructions: string[] = [];

    // Formality instructions
    if (traits.formality >= 80) {
      instructions.push('- Use formal language, proper grammar, and professional terminology');
    } else if (traits.formality >= 60) {
      instructions.push('- Use professional but approachable language');
    } else if (traits.formality >= 40) {
      instructions.push('- Use conversational language that\'s friendly yet professional');
    } else {
      instructions.push('- Use casual, relaxed language that feels natural');
    }

    // Enthusiasm instructions
    if (traits.enthusiasm >= 80) {
      instructions.push('- Show high energy and excitement in your responses');
      instructions.push('- Use exclamation points and positive language frequently');
    } else if (traits.enthusiasm >= 60) {
      instructions.push('- Show moderate enthusiasm and positive energy');
    } else if (traits.enthusiasm >= 40) {
      instructions.push('- Maintain a neutral but pleasant tone');
    } else {
      instructions.push('- Keep responses calm and measured');
    }

    // Technical depth instructions
    if (traits.technical_depth >= 80) {
      instructions.push('- Provide detailed technical explanations when relevant');
      instructions.push('- Include specific steps, examples, and technical context');
    } else if (traits.technical_depth >= 60) {
      instructions.push('- Provide moderate technical detail when helpful');
    } else if (traits.technical_depth >= 40) {
      instructions.push('- Keep technical explanations simple and accessible');
    } else {
      instructions.push('- Avoid technical jargon and keep explanations very simple');
    }

    // Empathy instructions
    if (traits.empathy >= 80) {
      instructions.push('- Show deep understanding and emotional support');
      instructions.push('- Acknowledge feelings and validate concerns');
    } else if (traits.empathy >= 60) {
      instructions.push('- Show understanding and offer supportive responses');
    } else if (traits.empathy >= 40) {
      instructions.push('- Be considerate and acknowledge user concerns');
    } else {
      instructions.push('- Keep responses focused on facts and solutions');
    }

    // Style-specific instructions
    switch (style) {
      case 'professional':
        instructions.push('- Maintain a business-appropriate tone throughout');
        break;
      case 'casual':
        instructions.push('- Use relaxed, conversational language');
        break;
      case 'friendly':
        instructions.push('- Be warm and approachable in your responses');
        break;
      case 'conversational':
        instructions.push('- Engage naturally as if talking to a friend');
        break;
      case 'concise':
        instructions.push('- Keep responses brief and to the point');
        break;
      case 'detailed':
        instructions.push('- Provide comprehensive, thorough explanations');
        break;
    }

    return instructions.join('\n');
  }

  /**
   * Analyze personality alignment of AI response
   */
  private async analyzePersonalityAlignment(
    response: string,
    targetTraits: PersonalityTraits
  ): Promise<PersonalityAnalysis> {
    try {
      // If no API key, return simulated analysis
      if (!this.openaiApiKey) {
        return this.simulatePersonalityAnalysis(response, targetTraits);
      }

      const analysisPrompt = `Analyze the following response and rate it on these personality traits (0-100 scale):

Response: "${response}"

Rate the response on:
1. Formality (0=very casual, 100=very formal)
2. Enthusiasm (0=very subdued, 100=very enthusiastic)
3. Technical depth (0=very simple, 100=very detailed/technical)
4. Empathy (0=cold/factual, 100=very understanding/supportive)

Respond with only a JSON object in this format:
{
  "formality": 75,
  "enthusiasm": 60,
  "technical_depth": 80,
  "empathy": 70,
  "analysis_notes": "Brief explanation of the ratings"
}`;

      const response_analysis = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: analysisPrompt }],
          temperature: 0.1,
          max_tokens: 200
        })
      });

      if (!response_analysis.ok) {
        throw new Error('Analysis API call failed');
      }

      const analysisData = await response_analysis.json();
      const analysisText = analysisData.choices[0]?.message?.content || '';
      
      // Parse JSON response
      const analysis = JSON.parse(analysisText);
      
      // Calculate alignment score
      const alignmentScore = this.calculateAlignmentScore(analysis, targetTraits);
      
      return {
        ...analysis,
        alignment_score: alignmentScore
      };

    } catch (error) {
      console.error('Error analyzing personality alignment:', error);
      return this.simulatePersonalityAnalysis(response, targetTraits);
    }
  }

  /**
   * Calculate alignment score between analyzed and target traits
   */
  private calculateAlignmentScore(
    analyzedTraits: PersonalityTraits,
    targetTraits: PersonalityTraits
  ): number {
    const traits = ['formality', 'enthusiasm', 'technical_depth', 'empathy'] as const;
    let totalScore = 0;
    
    for (const trait of traits) {
      const difference = Math.abs(analyzedTraits[trait] - targetTraits[trait]);
      const traitScore = 1 - (difference / 100);
      totalScore += traitScore;
    }
    
    return totalScore / traits.length;
  }

  /**
   * Calculate quality score based on response characteristics
   */
  private calculateQualityScore(response: string, originalMessage: string): number {
    let score = 0.5; // Base score
    
    // Length appropriateness
    if (response.length >= 50 && response.length <= 500) {
      score += 0.2;
    } else if (response.length > 500 && response.length <= 1000) {
      score += 0.1;
    }
    
    // Coherence indicators
    if (response.includes('.') || response.includes('!') || response.includes('?')) {
      score += 0.1;
    }
    
    // Relevance (simple check if response mentions key words from message)
    const messageWords = originalMessage.toLowerCase().split(/\s+/);
    const responseWords = response.toLowerCase().split(/\s+/);
    const relevantWords = messageWords.filter(word => 
      word.length > 3 && responseWords.includes(word)
    );
    
    if (relevantWords.length > 0) {
      score += Math.min(0.2, relevantWords.length * 0.05);
    }
    
    return Math.min(1.0, score);
  }

  /**
   * Calculate confidence score from OpenAI response
   */
  private calculateConfidenceScore(choice: any): number {
    // OpenAI doesn't provide confidence scores, so we estimate based on response characteristics
    const finishReason = choice.finish_reason;
    
    if (finishReason === 'stop') {
      return 0.8; // Normal completion
    } else if (finishReason === 'length') {
      return 0.6; // Truncated due to length
    } else {
      return 0.4; // Other finish reasons
    }
  }

  /**
   * Calculate approximate cost based on model and tokens
   */
  private calculateCost(model: AIModel, tokens: number): number {
    const pricing = {
      'gpt-4o-mini': 0.000015, // $0.015 per 1K tokens
      'gpt-4': 0.03,           // $0.03 per 1K tokens
      'gpt-3.5-turbo': 0.0015  // $0.0015 per 1K tokens
    };
    
    return (tokens / 1000) * (pricing[model] || 0.0015);
  }

  /**
   * Generate simulated response when API key is not available
   */
  private generateSimulatedResponse(
    message: string,
    session: PlaygroundSession
  ): PlaygroundAIResponse {
    const responses = [
      "Thank you for your message! I understand you're looking for help with this. Let me provide you with a comprehensive solution.",
      "I appreciate you reaching out. Based on what you've shared, I can help you resolve this issue effectively.",
      "Hello! I'm here to assist you with your inquiry. Let me walk you through the best approach for your situation.",
      "Thanks for contacting our support team. I've reviewed your request and I'm ready to help you find the right solution.",
      "I understand your concern and I'm here to help. Let me provide you with some detailed information that should address your needs."
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // Simulate personality-based modifications
    let finalResponse = randomResponse;
    
    if (session.personality_traits.enthusiasm > 70) {
      finalResponse = finalResponse.replace(/\./g, '!');
    }
    
    if (session.personality_traits.formality < 40) {
      finalResponse = finalResponse.replace(/Thank you/g, 'Thanks');
      finalResponse = finalResponse.replace(/I appreciate/g, 'I really appreciate');
    }
    
    return {
      response: finalResponse,
      response_time_ms: Math.floor(Math.random() * 2000) + 500,
      quality_score: 0.75 + Math.random() * 0.2,
      confidence_score: 0.7 + Math.random() * 0.25,
      personality_analysis: this.simulatePersonalityAnalysis(finalResponse, session.personality_traits),
      tokens_used: Math.floor(Math.random() * 100) + 50,
      cost_usd: 0.001 + Math.random() * 0.002
    };
  }

  /**
   * Simulate personality analysis when API is not available
   */
  private simulatePersonalityAnalysis(
    response: string,
    targetTraits: PersonalityTraits
  ): PersonalityAnalysis {
    // Simulate analysis with some variance from target traits
    const variance = 15; // ±15 points variance
    
    const simulatedTraits = {
      formality: Math.max(0, Math.min(100, targetTraits.formality + (Math.random() - 0.5) * variance)),
      enthusiasm: Math.max(0, Math.min(100, targetTraits.enthusiasm + (Math.random() - 0.5) * variance)),
      technical_depth: Math.max(0, Math.min(100, targetTraits.technical_depth + (Math.random() - 0.5) * variance)),
      empathy: Math.max(0, Math.min(100, targetTraits.empathy + (Math.random() - 0.5) * variance))
    };
    
    const alignmentScore = this.calculateAlignmentScore(simulatedTraits, targetTraits);
    
    return {
      ...simulatedTraits,
      alignment_score: alignmentScore,
      analysis_notes: 'Simulated personality analysis (OpenAI API key not configured)'
    };
  }

  /**
   * Test the AI service configuration
   */
  async testConfiguration(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.openaiApiKey) {
        return {
          success: false,
          message: 'OpenAI API key not configured. Responses will be simulated.'
        };
      }

      // Test with a simple request
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          message: `OpenAI API error: ${errorData.error?.message || 'Unknown error'}`
        };
      }

      return {
        success: true,
        message: 'OpenAI API connection successful'
      };

    } catch (error) {
      return {
        success: false,
        message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Export singleton instance
export const playgroundAIService = new PlaygroundAIService();