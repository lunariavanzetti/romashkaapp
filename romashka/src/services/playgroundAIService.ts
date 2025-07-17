import { OpenAI } from 'openai';
import { 
  BotConfiguration, 
  PersonalityTraits,
  PlaygroundAIResponse,
  PersonalityAnalysis,
  TestScenario,
  TestScenarioResult,
  TestResult,
  TestMessage
} from '../types/playground';
import { botConfigurationService } from './botConfigurationService';

export class PlaygroundAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true,
    });
  }

  /**
   * Generate real AI response based on bot configuration
   */
  async generateTestResponse(
    testMessage: string,
    botConfig: BotConfiguration,
    knowledgeContext?: string[]
  ): Promise<PlaygroundAIResponse> {
    const startTime = Date.now();

    try {
      // Create personality-specific system prompt
      const systemPrompt = this.createSystemPrompt(botConfig);

      // Build knowledge context if provided
      const contextPrompt = knowledgeContext && knowledgeContext.length > 0 
        ? `\n\nKnowledge Base Context:\n${knowledgeContext.join('\n\n')}`
        : '';

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt + contextPrompt },
          { role: 'user', content: testMessage }
        ],
        temperature: this.calculateTemperature(botConfig.personality_traits),
        max_tokens: this.calculateMaxTokens(botConfig.response_style),
        presence_penalty: this.calculatePresencePenalty(botConfig.personality_traits),
        frequency_penalty: this.calculateFrequencyPenalty(botConfig.personality_traits)
      });

      const aiMessage = response.choices[0].message.content || "I apologize, I couldn't generate a response.";
      const responseTime = Date.now() - startTime;
      const tokensUsed = response.usage?.total_tokens || 0;

      // Analyze personality alignment
      const personalityScore = await this.analyzePersonalityAlignment(
        aiMessage, 
        botConfig.personality_traits
      );

      // Calculate confidence based on response quality and personality alignment
      const confidence = this.calculateConfidence(
        testMessage,
        aiMessage,
        personalityScore.alignment_with_config
      );

      // Track performance metrics
      if (botConfig.id) {
        await botConfigurationService.trackPerformanceMetrics(
          botConfig.id,
          'manual_test',
          testMessage,
          aiMessage,
          responseTime,
          Math.round(confidence * 100),
          confidence,
          tokensUsed,
          undefined, // satisfaction rating (user can provide later)
          personalityScore.consistency_score
        );
      }

      return {
        response: aiMessage,
        response_time: responseTime,
        confidence: confidence,
        personality_score: personalityScore,
        tokens_used: tokensUsed,
        knowledge_sources: knowledgeContext || []
      };

    } catch (error) {
      console.error('OpenAI API error in playground:', error);
      return this.getFallbackResponse(testMessage, botConfig);
    }
  }

  /**
   * Create system prompt based on bot configuration
   */
  private createSystemPrompt(config: BotConfiguration): string {
    const { formality, enthusiasm, technical_depth, empathy } = config.personality_traits;

    const formalityLevel = this.getPersonalityDescription(formality, 'formality');
    const enthusiasmLevel = this.getPersonalityDescription(enthusiasm, 'enthusiasm');
    const technicalLevel = this.getPersonalityDescription(technical_depth, 'technical_depth');
    const empathyLevel = this.getPersonalityDescription(empathy, 'empathy');

    const responseStyleInstruction = this.getResponseStyleInstruction(config.response_style);

    return `You are ${config.bot_name}, an AI assistant with the following personality configuration:

PERSONALITY TRAITS:
- Formality Level: ${formality}% (${formalityLevel})
- Enthusiasm Level: ${enthusiasm}% (${enthusiasmLevel})
- Technical Depth: ${technical_depth}% (${technicalLevel})
- Empathy Level: ${empathy}% (${empathyLevel})

RESPONSE STYLE: ${responseStyleInstruction}

${config.custom_instructions ? `CUSTOM INSTRUCTIONS:\n${config.custom_instructions}\n` : ''}

IMPORTANT GUIDELINES:
- Maintain consistent personality throughout the conversation
- Adapt your communication style based on the personality percentages above
- Be helpful and provide accurate information
- Keep responses appropriate for customer service context
- Always prioritize user satisfaction and problem resolution

Remember: You are being tested in a playground environment. Demonstrate your personality clearly and consistently.`;
  }

  /**
   * Get personality description based on score
   */
  private getPersonalityDescription(score: number, trait: string): string {
    const descriptions = {
      formality: {
        low: 'very casual and relaxed',
        medium: 'balanced between casual and professional',
        high: 'very formal and professional'
      },
      enthusiasm: {
        low: 'calm and reserved',
        medium: 'moderately enthusiastic',
        high: 'very energetic and excited'
      },
      technical_depth: {
        low: 'simple and easy-to-understand',
        medium: 'moderately detailed',
        high: 'highly technical and detailed'
      },
      empathy: {
        low: 'direct and straightforward',
        medium: 'understanding and supportive',
        high: 'very compassionate and emotionally aware'
      }
    };

    const level = score < 33 ? 'low' : score < 67 ? 'medium' : 'high';
    return descriptions[trait][level];
  }

  /**
   * Get response style instruction
   */
  private getResponseStyleInstruction(style: string): string {
    const instructions = {
      professional: 'Use professional language and maintain business-appropriate tone',
      casual: 'Use casual, friendly language as if talking to a friend',
      friendly: 'Be warm, approachable, and welcoming in your responses',
      conversational: 'Engage in natural, flowing conversation',
      concise: 'Keep responses brief and to the point',
      detailed: 'Provide comprehensive, thorough explanations'
    };

    return instructions[style] || instructions.conversational;
  }

  /**
   * Calculate OpenAI parameters based on personality
   */
  private calculateTemperature(traits: PersonalityTraits): number {
    // Higher creativity for high enthusiasm and low formality
    const creativityScore = (traits.enthusiasm + (100 - traits.formality)) / 200;
    return Math.max(0.3, Math.min(1.0, 0.5 + creativityScore * 0.4));
  }

  private calculateMaxTokens(responseStyle: string): number {
    const tokenLimits = {
      concise: 200,
      professional: 400,
      casual: 350,
      friendly: 350,
      conversational: 450,
      detailed: 600
    };

    return tokenLimits[responseStyle] || 400;
  }

  private calculatePresencePenalty(traits: PersonalityTraits): number {
    // Higher penalty for high formality to avoid repetition
    return traits.formality / 200; // 0.0 to 0.5
  }

  private calculateFrequencyPenalty(traits: PersonalityTraits): number {
    // Higher penalty for high technical depth to encourage varied vocabulary
    return traits.technical_depth / 200; // 0.0 to 0.5
  }

  /**
   * Analyze personality alignment in the response
   */
  private async analyzePersonalityAlignment(
    response: string,
    expectedTraits: PersonalityTraits
  ): Promise<PersonalityAnalysis> {
    try {
      const analysisPrompt = `Analyze the following response for personality traits on a scale of 0-100:

Response: "${response}"

Rate the response for:
1. Formality (0 = very casual, 100 = very formal)
2. Enthusiasm (0 = reserved, 100 = very enthusiastic)
3. Technical Depth (0 = simple, 100 = highly technical)
4. Empathy (0 = direct, 100 = very compassionate)

Expected traits: Formality: ${expectedTraits.formality}, Enthusiasm: ${expectedTraits.enthusiasm}, Technical Depth: ${expectedTraits.technical_depth}, Empathy: ${expectedTraits.empathy}

Respond in JSON format:
{
  "detected_formality": number,
  "detected_enthusiasm": number,
  "detected_technical_depth": number,
  "detected_empathy": number,
  "consistency_score": number (0-1),
  "alignment_with_config": number (0-1)
}`;

      const analysisResponse = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: analysisPrompt }],
        temperature: 0.1,
        max_tokens: 200
      });

      const analysis = JSON.parse(analysisResponse.choices[0].message.content || '{}');
      return {
        detected_formality: analysis.detected_formality || 50,
        detected_enthusiasm: analysis.detected_enthusiasm || 50,
        detected_technical_depth: analysis.detected_technical_depth || 50,
        detected_empathy: analysis.detected_empathy || 50,
        consistency_score: analysis.consistency_score || 0.5,
        alignment_with_config: analysis.alignment_with_config || 0.5
      };

    } catch (error) {
      console.error('Error analyzing personality alignment:', error);
      // Return default analysis if API call fails
      return {
        detected_formality: 50,
        detected_enthusiasm: 50,
        detected_technical_depth: 50,
        detected_empathy: 50,
        consistency_score: 0.5,
        alignment_with_config: 0.5
      };
    }
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(
    userMessage: string,
    aiResponse: string,
    personalityAlignment: number
  ): number {
    // Base confidence on response quality factors
    let confidence = 0.7; // Base confidence

    // Adjust based on response length appropriateness
    const responseLength = aiResponse.length;
    if (responseLength > 50 && responseLength < 500) {
      confidence += 0.1;
    }

    // Adjust based on personality alignment
    confidence += (personalityAlignment - 0.5) * 0.4;

    // Ensure confidence is between 0 and 1
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Get fallback response when API fails
   */
  private getFallbackResponse(testMessage: string, config: BotConfiguration): PlaygroundAIResponse {
    const fallbackMessage = `I apologize, but I'm experiencing technical difficulties right now. As ${config.bot_name}, I would normally respond to your message "${testMessage}" with a response that matches my personality settings (${config.personality_traits.formality}% formal, ${config.personality_traits.enthusiasm}% enthusiastic). Please try again in a moment.`;

    return {
      response: fallbackMessage,
      response_time: 1000,
      confidence: 0.1,
      personality_score: {
        detected_formality: config.personality_traits.formality,
        detected_enthusiasm: config.personality_traits.enthusiasm,
        detected_technical_depth: config.personality_traits.technical_depth,
        detected_empathy: config.personality_traits.empathy,
        consistency_score: 0.1,
        alignment_with_config: 0.1
      },
      tokens_used: 0,
      knowledge_sources: []
    };
  }

  /**
   * Run a complete test scenario
   */
  async runTestScenario(
    scenario: TestScenario,
    botConfig: BotConfiguration
  ): Promise<TestScenarioResult> {
    const results: TestResult[] = [];
    let totalResponseTime = 0;
    let totalQuality = 0;
    let totalConfidence = 0;

    for (const testMessage of scenario.test_messages) {
      const response = await this.generateTestResponse(
        testMessage.message,
        botConfig
      );

      const result: TestResult = {
        message: testMessage.message,
        response: response.response,
        response_time_ms: response.response_time,
        quality_score: response.confidence * 100,
        confidence_score: response.confidence,
        personality_analysis: response.personality_score
      };

      results.push(result);
      totalResponseTime += response.response_time;
      totalQuality += response.confidence * 100;
      totalConfidence += response.confidence;
    }

    const scenarioResult: TestScenarioResult = {
      id: `test_${Date.now()}`,
      bot_config_id: botConfig.id,
      scenario_id: scenario.id,
      scenario_name: scenario.name,
      test_messages: scenario.test_messages,
      results: results,
      average_response_time: totalResponseTime / results.length,
      average_quality_score: totalQuality / results.length,
      average_confidence: totalConfidence / results.length,
      tested_at: new Date().toISOString()
    };

    // Save results to database
    await botConfigurationService.saveTestScenarioResults(scenarioResult);

    return scenarioResult;
  }
}

// Create singleton instance
export const playgroundAIService = new PlaygroundAIService();