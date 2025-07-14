import { supabase } from '../lib/supabase';
import { 
  PersonalityConfig, 
  PersonalityPreset, 
  PersonalityAnalytics,
  PersonalityFormData,
  PersonalityValidationResult,
  PersonalityProcessingResult,
  PersonalityContext,
  PersonalityPreviewData,
  PersonalityScores,
  BrandVoiceConfig,
  TonePreset,
  IndustrySetting,
  PrimaryLanguage,
  DEFAULT_PERSONALITY_CONFIG,
  TONE_PRESETS,
  InteractionType
} from '../types/personality';

export class PersonalityService {
  
  /**
   * Get the active personality configuration for a user
   */
  async getActivePersonalityConfig(userId: string): Promise<PersonalityConfig | null> {
    try {
      const { data, error } = await supabase
        .from('personality_configs')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No config found, create default
          return await this.createDefaultPersonalityConfig(userId);
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching personality config:', error);
      return null;
    }
  }

  /**
   * Create a default personality configuration for a user
   */
  async createDefaultPersonalityConfig(userId: string): Promise<PersonalityConfig> {
    const defaultConfig = {
      ...DEFAULT_PERSONALITY_CONFIG,
      user_id: userId
    };

    const { data, error } = await supabase
      .from('personality_configs')
      .insert([defaultConfig])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Update personality configuration
   */
  async updatePersonalityConfig(
    userId: string, 
    updates: Partial<PersonalityFormData>
  ): Promise<PersonalityConfig> {
    // First, validate the updates
    const validationResult = this.validatePersonalityConfig(updates);
    if (!validationResult.isValid) {
      throw new Error(`Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
    }

    const { data, error } = await supabase
      .from('personality_configs')
      .update(updates)
      .eq('user_id', userId)
      .eq('is_active', true)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Get all personality presets
   */
  async getPersonalityPresets(): Promise<PersonalityPreset[]> {
    const { data, error } = await supabase
      .from('personality_presets')
      .select('*')
      .order('industry', { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  }

  /**
   * Get personality presets by industry
   */
  async getPersonalityPresetsByIndustry(industry: IndustrySetting): Promise<PersonalityPreset[]> {
    const { data, error } = await supabase
      .from('personality_presets')
      .select('*')
      .eq('industry', industry)
      .order('is_default', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  }

  /**
   * Apply a personality preset to user's configuration
   */
  async applyPersonalityPreset(userId: string, presetId: string): Promise<PersonalityConfig> {
    // Get the preset
    const { data: preset, error: presetError } = await supabase
      .from('personality_presets')
      .select('*')
      .eq('id', presetId)
      .single();

    if (presetError) {
      throw presetError;
    }

    // Update user's config with preset values
    const updates: Partial<PersonalityFormData> = {
      personality_scores: preset.personality_scores,
      tone_preset: preset.tone_preset,
      industry_setting: preset.industry,
      brand_voice_config: preset.brand_voice_config
    };

    return await this.updatePersonalityConfig(userId, updates);
  }

  /**
   * Upload and set avatar for personality configuration
   */
  async uploadPersonalityAvatar(userId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('personality-avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('personality-avatars')
      .getPublicUrl(data.path);

    // Update the personality config with the new avatar URL
    await this.updatePersonalityConfig(userId, {
      avatar_url: urlData.publicUrl
    });

    return urlData.publicUrl;
  }

  /**
   * Validate personality configuration
   */
  validatePersonalityConfig(config: Partial<PersonalityFormData>): PersonalityValidationResult {
    const errors: { field: string; message: string }[] = [];

    // Validate bot name
    if (config.bot_name !== undefined) {
      if (!config.bot_name.trim()) {
        errors.push({ field: 'bot_name', message: 'Bot name is required' });
      } else if (config.bot_name.length > 100) {
        errors.push({ field: 'bot_name', message: 'Bot name must be less than 100 characters' });
      }
    }

    // Validate personality scores
    if (config.personality_scores) {
      const scores = config.personality_scores;
      const requiredScores = ['formality', 'enthusiasm', 'technical_depth', 'empathy'];
      
      for (const score of requiredScores) {
        const value = scores[score as keyof PersonalityScores];
        if (value === undefined || value < 0 || value > 100) {
          errors.push({ 
            field: `personality_scores.${score}`, 
            message: `${score} must be between 0 and 100` 
          });
        }
      }
    }

    // Validate brand voice config
    if (config.brand_voice_config) {
      const brandVoice = config.brand_voice_config;
      
      if (brandVoice.guidelines && brandVoice.guidelines.length > 2000) {
        errors.push({ 
          field: 'brand_voice_config.guidelines', 
          message: 'Guidelines must be less than 2000 characters' 
        });
      }

      if (brandVoice.keywords && brandVoice.keywords.length > 50) {
        errors.push({ 
          field: 'brand_voice_config.keywords', 
          message: 'Maximum 50 keywords allowed' 
        });
      }

      if (brandVoice.avoid_phrases && brandVoice.avoid_phrases.length > 50) {
        errors.push({ 
          field: 'brand_voice_config.avoid_phrases', 
          message: 'Maximum 50 avoid phrases allowed' 
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Process personality settings for AI prompt engineering
   */
  async processPersonalityForAI(
    userId: string, 
    context: Partial<PersonalityContext> = {}
  ): Promise<PersonalityProcessingResult> {
    const startTime = Date.now();
    
    try {
      const personalityConfig = await this.getActivePersonalityConfig(userId);
      if (!personalityConfig) {
        throw new Error('No personality configuration found');
      }

      const processedPrompt = this.buildPersonalityPrompt(personalityConfig, context);
      const toneAdjustments = this.generateToneAdjustments(personalityConfig.personality_scores);
      const languageAdaptations = this.generateLanguageAdaptations(personalityConfig.primary_language);
      const brandAlignments = this.generateBrandAlignments(personalityConfig.brand_voice_config);

      const processingTime = Date.now() - startTime;
      const confidenceScore = this.calculatePersonalityConfidence(personalityConfig);

      // Log analytics
      await this.logPersonalityAnalytics(
        userId,
        personalityConfig.id,
        'response_generation',
        context.conversation_history?.length || 0,
        confidenceScore,
        processingTime
      );

      return {
        processed_prompt: processedPrompt,
        tone_adjustments: toneAdjustments,
        language_adaptations: languageAdaptations,
        brand_alignments: brandAlignments,
        confidence_score: confidenceScore,
        processing_time_ms: processingTime
      };
    } catch (error) {
      console.error('Error processing personality for AI:', error);
      throw error;
    }
  }

  /**
   * Build personality-enhanced prompt for AI
   */
  private buildPersonalityPrompt(
    config: PersonalityConfig, 
    context: Partial<PersonalityContext> = {}
  ): string {
    const { personality_scores, tone_preset, primary_language, brand_voice_config } = config;

    let prompt = `You are ${config.bot_name}, an AI assistant with the following personality characteristics:\n\n`;

    // Add personality traits
    prompt += `PERSONALITY TRAITS:\n`;
    prompt += `- Formality Level: ${this.getPersonalityLevel(personality_scores.formality)} (${personality_scores.formality}/100)\n`;
    prompt += `- Enthusiasm Level: ${this.getPersonalityLevel(personality_scores.enthusiasm)} (${personality_scores.enthusiasm}/100)\n`;
    prompt += `- Technical Depth: ${this.getPersonalityLevel(personality_scores.technical_depth)} (${personality_scores.technical_depth}/100)\n`;
    prompt += `- Empathy Level: ${this.getPersonalityLevel(personality_scores.empathy)} (${personality_scores.empathy}/100)\n\n`;

    // Add tone instructions
    const tonePreset = TONE_PRESETS.find(t => t.value === tone_preset);
    if (tonePreset) {
      prompt += `TONE STYLE: ${tonePreset.label}\n`;
      prompt += `${tonePreset.description}\n\n`;
    }

    // Add language instructions
    prompt += `PRIMARY LANGUAGE: ${primary_language.toUpperCase()}\n`;
    prompt += `Always respond in ${primary_language === 'en' ? 'English' : this.getLanguageName(primary_language)} unless specifically asked to use another language.\n\n`;

    // Add brand voice guidelines
    if (brand_voice_config.guidelines) {
      prompt += `BRAND VOICE GUIDELINES:\n${brand_voice_config.guidelines}\n\n`;
    }

    if (brand_voice_config.keywords.length > 0) {
      prompt += `PREFERRED KEYWORDS TO USE: ${brand_voice_config.keywords.join(', ')}\n\n`;
    }

    if (brand_voice_config.avoid_phrases.length > 0) {
      prompt += `PHRASES TO AVOID: ${brand_voice_config.avoid_phrases.join(', ')}\n\n`;
    }

    // Add context-specific instructions
    if (context.customer_sentiment) {
      prompt += `CUSTOMER SENTIMENT: ${context.customer_sentiment}\n`;
      prompt += this.getSentimentInstructions(context.customer_sentiment, personality_scores);
    }

    if (context.urgency_level) {
      prompt += `URGENCY LEVEL: ${context.urgency_level}\n`;
      prompt += this.getUrgencyInstructions(context.urgency_level, personality_scores);
    }

    prompt += `\nAlways maintain these personality characteristics consistently throughout the conversation.`;

    return prompt;
  }

  /**
   * Generate tone adjustments based on personality scores
   */
  private generateToneAdjustments(scores: PersonalityScores): string[] {
    const adjustments: string[] = [];

    if (scores.formality > 70) {
      adjustments.push('Use professional language and formal greetings');
      adjustments.push('Avoid contractions and casual expressions');
    } else if (scores.formality < 30) {
      adjustments.push('Use casual language and relaxed tone');
      adjustments.push('Feel free to use contractions and informal expressions');
    }

    if (scores.enthusiasm > 80) {
      adjustments.push('Show excitement and energy in responses');
      adjustments.push('Use exclamation points and positive language');
    } else if (scores.enthusiasm < 20) {
      adjustments.push('Maintain a calm and measured tone');
      adjustments.push('Use neutral language without excessive enthusiasm');
    }

    if (scores.technical_depth > 80) {
      adjustments.push('Provide detailed technical explanations');
      adjustments.push('Use industry-specific terminology when appropriate');
    } else if (scores.technical_depth < 20) {
      adjustments.push('Keep explanations simple and accessible');
      adjustments.push('Avoid technical jargon and complex concepts');
    }

    if (scores.empathy > 80) {
      adjustments.push('Show understanding and emotional awareness');
      adjustments.push('Acknowledge feelings and provide emotional support');
    } else if (scores.empathy < 20) {
      adjustments.push('Focus on facts and solutions');
      adjustments.push('Maintain a direct and task-oriented approach');
    }

    return adjustments;
  }

  /**
   * Generate language adaptations
   */
  private generateLanguageAdaptations(language: PrimaryLanguage): string[] {
    const adaptations: string[] = [];

    switch (language) {
      case 'es':
        adaptations.push('Use appropriate Spanish cultural references');
        adaptations.push('Consider time zones and cultural context for Spanish-speaking regions');
        break;
      case 'fr':
        adaptations.push('Use appropriate French cultural references');
        adaptations.push('Consider formal vs informal address (vous vs tu)');
        break;
      case 'de':
        adaptations.push('Use appropriate German cultural references');
        adaptations.push('Consider formal vs informal address (Sie vs du)');
        break;
      case 'zh':
        adaptations.push('Use appropriate Chinese cultural references');
        adaptations.push('Consider cultural sensitivity and context');
        break;
      case 'ja':
        adaptations.push('Use appropriate Japanese cultural references');
        adaptations.push('Consider levels of politeness (keigo)');
        break;
      default:
        adaptations.push('Use culturally neutral references');
        adaptations.push('Consider international audience context');
    }

    return adaptations;
  }

  /**
   * Generate brand alignments
   */
  private generateBrandAlignments(brandVoice: BrandVoiceConfig): string[] {
    const alignments: string[] = [];

    if (brandVoice.keywords.length > 0) {
      alignments.push(`Incorporate these keywords naturally: ${brandVoice.keywords.join(', ')}`);
    }

    if (brandVoice.avoid_phrases.length > 0) {
      alignments.push(`Avoid these phrases: ${brandVoice.avoid_phrases.join(', ')}`);
    }

    if (brandVoice.response_examples.length > 0) {
      alignments.push('Follow the tone and style of provided response examples');
    }

    return alignments;
  }

  /**
   * Calculate personality confidence score
   */
  private calculatePersonalityConfidence(config: PersonalityConfig): number {
    let confidence = 0.7; // Base confidence

    // Increase confidence based on completeness
    if (config.bot_name && config.bot_name !== 'ROMASHKA Assistant') confidence += 0.05;
    if (config.avatar_url) confidence += 0.05;
    if (config.brand_voice_config.guidelines) confidence += 0.1;
    if (config.brand_voice_config.keywords.length > 0) confidence += 0.05;
    if (config.brand_voice_config.response_examples.length > 0) confidence += 0.05;

    return Math.min(confidence, 1.0);
  }

  /**
   * Log personality analytics
   */
  private async logPersonalityAnalytics(
    userId: string,
    configId: string,
    interactionType: InteractionType,
    conversationLength: number,
    confidenceScore: number,
    processingTime: number,
    conversationId?: string
  ): Promise<void> {
    try {
      await supabase
        .from('personality_analytics')
        .insert([{
          user_id: userId,
          personality_config_id: configId,
          conversation_id: conversationId,
          interaction_type: interactionType,
          effectiveness_score: confidenceScore,
          analytics_data: {
            conversation_length: conversationLength,
            processing_time_ms: processingTime,
            timestamp: new Date().toISOString()
          }
        }]);
    } catch (error) {
      console.error('Error logging personality analytics:', error);
    }
  }

  /**
   * Generate personality preview data
   */
  async generatePersonalityPreview(
    userId: string,
    tempConfig?: Partial<PersonalityFormData>
  ): Promise<PersonalityPreviewData> {
    const config = tempConfig 
      ? { ...await this.getActivePersonalityConfig(userId), ...tempConfig }
      : await this.getActivePersonalityConfig(userId);

    if (!config) {
      throw new Error('No personality configuration found');
    }

    const sampleMessages = this.generateSampleMessages(config);
    const toneAnalysis = this.analyzeTone(config.personality_scores);
    const brandVoiceCompliance = this.analyzeBrandVoiceCompliance(config.brand_voice_config);

    return {
      sample_messages: sampleMessages,
      tone_analysis: toneAnalysis,
      brand_voice_compliance: brandVoiceCompliance
    };
  }

  /**
   * Generate sample messages for preview
   */
  private generateSampleMessages(config: PersonalityConfig) {
    const samples = [
      {
        user_message: "Hi, I need help with your product.",
        scenario: "Initial greeting"
      },
      {
        user_message: "I'm having trouble understanding how this works.",
        scenario: "Customer confusion"
      },
      {
        user_message: "I'm not satisfied with the service.",
        scenario: "Customer complaint"
      }
    ];

    return samples.map(sample => ({
      user_message: sample.user_message,
      ai_response: this.generateSampleResponse(sample.user_message, config),
      explanation: `Response tailored for ${sample.scenario} based on your personality settings`
    }));
  }

  /**
   * Generate sample AI response based on personality
   */
  private generateSampleResponse(userMessage: string, config: PersonalityConfig): string {
    const { personality_scores, tone_preset, bot_name } = config;
    
    let response = `Hello! I'm ${bot_name}. `;

    // Adjust response based on formality
    if (personality_scores.formality > 70) {
      response += "I would be pleased to assist you with your inquiry.";
    } else {
      response += "I'm here to help you out!";
    }

    // Adjust based on enthusiasm
    if (personality_scores.enthusiasm > 80) {
      response += " I'm excited to help you find the perfect solution!";
    } else if (personality_scores.enthusiasm < 30) {
      response += " Let me help you resolve this.";
    }

    // Add empathy if high
    if (personality_scores.empathy > 80) {
      response += " I understand this might be frustrating, and I'm here to make sure we get this sorted out for you.";
    }

    return response;
  }

  /**
   * Analyze tone based on personality scores
   */
  private analyzeTone(scores: PersonalityScores) {
    return {
      formality_level: this.getPersonalityLevel(scores.formality),
      enthusiasm_level: this.getPersonalityLevel(scores.enthusiasm),
      technical_depth_level: this.getPersonalityLevel(scores.technical_depth),
      empathy_level: this.getPersonalityLevel(scores.empathy)
    };
  }

  /**
   * Analyze brand voice compliance
   */
  private analyzeBrandVoiceCompliance(brandVoice: BrandVoiceConfig) {
    return {
      keywords_used: brandVoice.keywords.slice(0, 5),
      avoided_phrases: brandVoice.avoid_phrases.slice(0, 5),
      guidelines_followed: brandVoice.guidelines ? [brandVoice.guidelines.substring(0, 100) + '...'] : []
    };
  }

  /**
   * Get personality level description
   */
  private getPersonalityLevel(score: number): string {
    if (score >= 80) return 'Very High';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    if (score >= 20) return 'Low';
    return 'Very Low';
  }

  /**
   * Get language name from code
   */
  private getLanguageName(code: PrimaryLanguage): string {
    const languages = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ko': 'Korean'
    };
    return languages[code] || 'English';
  }

  /**
   * Get sentiment-specific instructions
   */
  private getSentimentInstructions(sentiment: string, scores: PersonalityScores): string {
    let instructions = '';
    
    switch (sentiment) {
      case 'negative':
        instructions = 'The customer seems frustrated. ';
        if (scores.empathy > 60) {
          instructions += 'Show extra empathy and understanding. ';
        }
        instructions += 'Focus on solutions and positive outcomes.\n';
        break;
      case 'positive':
        instructions = 'The customer seems happy. ';
        if (scores.enthusiasm > 60) {
          instructions += 'Match their positive energy. ';
        }
        instructions += 'Maintain the positive momentum.\n';
        break;
      default:
        instructions = 'Maintain a balanced approach.\n';
    }
    
    return instructions;
  }

  /**
   * Get urgency-specific instructions
   */
  private getUrgencyInstructions(urgency: string, scores: PersonalityScores): string {
    let instructions = '';
    
    switch (urgency) {
      case 'high':
        instructions = 'This is urgent. ';
        if (scores.technical_depth > 60) {
          instructions += 'Provide direct, technical solutions quickly. ';
        } else {
          instructions += 'Provide clear, immediate assistance. ';
        }
        instructions += 'Minimize small talk.\n';
        break;
      case 'low':
        instructions = 'No immediate urgency. ';
        if (scores.empathy > 60) {
          instructions += 'Take time to understand the customer fully. ';
        }
        instructions += 'Provide comprehensive assistance.\n';
        break;
      default:
        instructions = 'Standard urgency level.\n';
    }
    
    return instructions;
  }

  /**
   * Get personality analytics for a user
   */
  async getPersonalityAnalytics(userId: string, days: number = 30): Promise<PersonalityAnalytics[]> {
    const { data, error } = await supabase
      .from('personality_analytics')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  }

  /**
   * Delete personality configuration
   */
  async deletePersonalityConfig(userId: string): Promise<void> {
    const { error } = await supabase
      .from('personality_configs')
      .delete()
      .eq('user_id', userId);

    if (error) {
      throw error;
    }
  }
}

export const personalityService = new PersonalityService();