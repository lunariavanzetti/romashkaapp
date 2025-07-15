import { supabase } from '../../../lib/supabase';
import OpenAI from 'openai';
import { aiTrainingService, TrainingData, KnowledgeGap, LearningInsight } from './aiTrainingService';
import { Message } from '../../openaiService';

export interface LearningUpdate {
  id: string;
  type: 'knowledge_update' | 'pattern_recognition' | 'model_optimization' | 'content_improvement';
  title: string;
  description: string;
  confidence: number;
  impact: number;
  applied: boolean;
  data: Record<string, any>;
  createdAt: Date;
  appliedAt?: Date;
}

export interface KnowledgeUpdate {
  id: string;
  itemId: string;
  type: 'create' | 'update' | 'optimize' | 'merge' | 'deprecate';
  content: string;
  title: string;
  category: string;
  tags: string[];
  effectiveness: number;
  confidence: number;
  source: 'conversation' | 'pattern' | 'gap_analysis' | 'feedback';
  sourceId: string;
  createdAt: Date;
}

export interface PatternRecognition {
  id: string;
  pattern: string;
  frequency: number;
  confidence: number;
  impact: number;
  context: string;
  examples: string[];
  suggestions: string[];
  actionable: boolean;
  createdAt: Date;
}

export interface ModelOptimization {
  id: string;
  type: 'prompt_optimization' | 'temperature_adjustment' | 'context_improvement' | 'response_tuning';
  parameter: string;
  oldValue: any;
  newValue: any;
  reason: string;
  performance: Record<string, number>;
  applied: boolean;
  createdAt: Date;
}

export interface ContentOptimization {
  id: string;
  contentId: string;
  type: 'effectiveness_improvement' | 'clarity_enhancement' | 'coverage_expansion' | 'accuracy_fix';
  currentContent: string;
  suggestedContent: string;
  improvementReason: string;
  confidenceScore: number;
  usageStats: Record<string, number>;
  createdAt: Date;
}

export class ContinuousLearningEngine {
  private static instance: ContinuousLearningEngine;
  private openai: OpenAI;
  private learningQueue: LearningUpdate[] = [];
  private knowledgeUpdates: KnowledgeUpdate[] = [];
  private recognizedPatterns: PatternRecognition[] = [];
  private modelOptimizations: ModelOptimization[] = [];
  private contentOptimizations: ContentOptimization[] = [];
  private isProcessing = false;
  private learningInterval?: NodeJS.Timeout;

  private constructor() {
    this.openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY!,
      dangerouslyAllowBrowser: true,
    });
    
    // Start continuous learning cycle
    this.startContinuousLearning();
  }

  static getInstance(): ContinuousLearningEngine {
    if (!ContinuousLearningEngine.instance) {
      ContinuousLearningEngine.instance = new ContinuousLearningEngine();
    }
    return ContinuousLearningEngine.instance;
  }

  /**
   * Start continuous learning cycle
   */
  private startContinuousLearning(): void {
    // Process learning updates every 5 minutes
    this.learningInterval = setInterval(() => {
      this.processContinuousLearning();
    }, 5 * 60 * 1000);
  }

  /**
   * Process continuous learning updates
   */
  async processContinuousLearning(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    try {
      // 1. Analyze recent conversations for learning opportunities
      await this.analyzeRecentConversations();
      
      // 2. Update knowledge base from successful interactions
      await this.updateKnowledgeBase();
      
      // 3. Recognize patterns in conversations
      await this.recognizePatterns();
      
      // 4. Optimize model parameters
      await this.optimizeModelParameters();
      
      // 5. Suggest content improvements
      await this.suggestContentImprovements();
      
      // 6. Apply approved learning updates
      await this.applyLearningUpdates();
      
    } catch (error) {
      console.error('Error in continuous learning:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Analyze recent conversations for learning opportunities
   */
  private async analyzeRecentConversations(): Promise<void> {
    try {
      // Get conversations from the last hour
      const { data: recentConversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages (*)
        `)
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
        .eq('status', 'closed');

      if (error) throw error;

      for (const conversation of recentConversations) {
        const trainingData = await aiTrainingService.analyzeConversation(conversation.id);
        
        // Generate learning updates based on conversation analysis
        if (trainingData.success) {
          await this.generateSuccessLearningUpdate(trainingData);
        } else {
          await this.generateFailureLearningUpdate(trainingData);
        }
      }
    } catch (error) {
      console.error('Error analyzing recent conversations:', error);
    }
  }

  /**
   * Update knowledge base from successful interactions
   */
  private async updateKnowledgeBase(): Promise<void> {
    try {
      // Get successful conversations with high confidence
      const { data: successfulConversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages (*)
        `)
        .gte('satisfaction_score', 4)
        .gte('ai_confidence', 0.8)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      for (const conversation of successfulConversations) {
        const knowledgeUpdate = await this.extractKnowledgeFromConversation(conversation);
        
        if (knowledgeUpdate) {
          this.knowledgeUpdates.push(knowledgeUpdate);
          await this.storeKnowledgeUpdate(knowledgeUpdate);
        }
      }
    } catch (error) {
      console.error('Error updating knowledge base:', error);
    }
  }

  /**
   * Recognize patterns in conversations
   */
  private async recognizePatterns(): Promise<void> {
    try {
      // Get conversations from the last 7 days
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages (*)
        `)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      // Analyze question patterns
      const questionPatterns = await this.analyzeQuestionPatterns(conversations);
      
      for (const pattern of questionPatterns) {
        this.recognizedPatterns.push(pattern);
        await this.storePatternRecognition(pattern);
      }

      // Analyze response patterns
      const responsePatterns = await this.analyzeResponsePatterns(conversations);
      
      for (const pattern of responsePatterns) {
        this.recognizedPatterns.push(pattern);
        await this.storePatternRecognition(pattern);
      }
    } catch (error) {
      console.error('Error recognizing patterns:', error);
    }
  }

  /**
   * Optimize model parameters based on performance
   */
  private async optimizeModelParameters(): Promise<void> {
    try {
      // Get recent performance data
      const metrics = await aiTrainingService.getTrainingMetrics(7);
      
      // Analyze temperature optimization
      const temperatureOptimization = await this.analyzeTemperatureOptimization(metrics);
      if (temperatureOptimization) {
        this.modelOptimizations.push(temperatureOptimization);
        await this.storeModelOptimization(temperatureOptimization);
      }
      
      // Analyze context optimization
      const contextOptimization = await this.analyzeContextOptimization(metrics);
      if (contextOptimization) {
        this.modelOptimizations.push(contextOptimization);
        await this.storeModelOptimization(contextOptimization);
      }
      
      // Analyze prompt optimization
      const promptOptimization = await this.analyzePromptOptimization(metrics);
      if (promptOptimization) {
        this.modelOptimizations.push(promptOptimization);
        await this.storeModelOptimization(promptOptimization);
      }
    } catch (error) {
      console.error('Error optimizing model parameters:', error);
    }
  }

  /**
   * Suggest content improvements based on usage analytics
   */
  private async suggestContentImprovements(): Promise<void> {
    try {
      // Get knowledge items with usage statistics
      const { data: knowledgeItems, error } = await supabase
        .from('knowledge_items')
        .select(`
          *,
          knowledge_analytics (*)
        `)
        .eq('status', 'active');

      if (error) throw error;

      for (const item of knowledgeItems) {
        const improvement = await this.analyzeContentEffectiveness(item);
        
        if (improvement) {
          this.contentOptimizations.push(improvement);
          await this.storeContentOptimization(improvement);
        }
      }
    } catch (error) {
      console.error('Error suggesting content improvements:', error);
    }
  }

  /**
   * Apply approved learning updates
   */
  private async applyLearningUpdates(): Promise<void> {
    try {
      // Get approved learning updates
      const { data: approvedUpdates, error } = await supabase
        .from('learning_updates')
        .select('*')
        .eq('applied', false)
        .eq('approved', true);

      if (error) throw error;

      for (const update of approvedUpdates) {
        await this.applyLearningUpdate(update);
      }
    } catch (error) {
      console.error('Error applying learning updates:', error);
    }
  }

  /**
   * Generate learning update from successful conversation
   */
  private async generateSuccessLearningUpdate(trainingData: TrainingData): Promise<void> {
    const update: LearningUpdate = {
      id: crypto.randomUUID(),
      type: 'pattern_recognition',
      title: 'Successful Interaction Pattern',
      description: `Identified successful pattern: ${trainingData.topics.join(', ')}`,
      confidence: trainingData.confidence,
      impact: 0.7,
      applied: false,
      data: {
        conversationId: trainingData.conversationId,
        topics: trainingData.topics,
        knowledgeUsed: trainingData.knowledgeUsed,
        resolutionTime: trainingData.resolutionTime,
        learningPoints: trainingData.learningPoints,
      },
      createdAt: new Date(),
    };

    this.learningQueue.push(update);
    await this.storeLearningUpdate(update);
  }

  /**
   * Generate learning update from failed conversation
   */
  private async generateFailureLearningUpdate(trainingData: TrainingData): Promise<void> {
    const update: LearningUpdate = {
      id: crypto.randomUUID(),
      type: 'knowledge_update',
      title: 'Knowledge Gap Identified',
      description: `Knowledge gap in: ${trainingData.topics.join(', ')}`,
      confidence: 0.8,
      impact: 0.9,
      applied: false,
      data: {
        conversationId: trainingData.conversationId,
        topics: trainingData.topics,
        failureReasons: trainingData.learningPoints,
      },
      createdAt: new Date(),
    };

    this.learningQueue.push(update);
    await this.storeLearningUpdate(update);
  }

  /**
   * Extract knowledge from successful conversation
   */
  private async extractKnowledgeFromConversation(conversation: any): Promise<KnowledgeUpdate | null> {
    try {
      const aiMessages = conversation.messages.filter((m: Message) => m.sender_type === 'ai');
      const userMessages = conversation.messages.filter((m: Message) => m.sender_type === 'user');
      
      if (aiMessages.length === 0 || userMessages.length === 0) return null;

      const conversationText = conversation.messages
        .map((m: Message) => `${m.sender_type}: ${m.content}`)
        .join('\n');

      const prompt = `
Analyze this successful conversation and extract reusable knowledge:
${conversationText}

Extract:
1. Key question patterns
2. Effective response patterns
3. Knowledge that can be generalized
4. Suggested title and category

Return as JSON with: title, content, category, tags, effectiveness (0-1).
`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });

      const extracted = JSON.parse(response.choices[0].message.content || '{}');
      
      if (!extracted.title || !extracted.content) return null;

      return {
        id: crypto.randomUUID(),
        itemId: crypto.randomUUID(),
        type: 'create',
        content: extracted.content,
        title: extracted.title,
        category: extracted.category || 'general',
        tags: extracted.tags || [],
        effectiveness: extracted.effectiveness || 0.8,
        confidence: 0.8,
        source: 'conversation',
        sourceId: conversation.id,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error('Error extracting knowledge from conversation:', error);
      return null;
    }
  }

  /**
   * Analyze question patterns in conversations
   */
  private async analyzeQuestionPatterns(conversations: any[]): Promise<PatternRecognition[]> {
    const patterns: PatternRecognition[] = [];
    const questionFrequency: Map<string, { count: number; examples: string[] }> = new Map();

    for (const conversation of conversations) {
      const userMessages = conversation.messages.filter((m: Message) => m.sender_type === 'user');
      
      for (const message of userMessages) {
        const normalizedQuestion = await this.normalizeQuestion(message.content);
        
        if (questionFrequency.has(normalizedQuestion)) {
          const data = questionFrequency.get(normalizedQuestion)!;
          data.count++;
          data.examples.push(message.content);
        } else {
          questionFrequency.set(normalizedQuestion, {
            count: 1,
            examples: [message.content],
          });
        }
      }
    }

    // Create patterns for frequently asked questions
    for (const [pattern, data] of questionFrequency) {
      if (data.count >= 3) { // Pattern threshold
        patterns.push({
          id: crypto.randomUUID(),
          pattern,
          frequency: data.count,
          confidence: Math.min(data.count / 10, 0.95),
          impact: Math.min(data.count / 20, 0.8),
          context: 'frequently_asked_questions',
          examples: data.examples.slice(0, 5),
          suggestions: [
            'Create dedicated knowledge base entry',
            'Optimize response template',
            'Add to FAQ section',
          ],
          actionable: true,
          createdAt: new Date(),
        });
      }
    }

    return patterns;
  }

  /**
   * Analyze response patterns in conversations
   */
  private async analyzeResponsePatterns(conversations: any[]): Promise<PatternRecognition[]> {
    const patterns: PatternRecognition[] = [];
    const successfulResponses: string[] = [];
    const failedResponses: string[] = [];

    for (const conversation of conversations) {
      const isSuccessful = conversation.satisfaction_score >= 4;
      const aiMessages = conversation.messages.filter((m: Message) => m.sender_type === 'ai');
      
      for (const message of aiMessages) {
        if (isSuccessful) {
          successfulResponses.push(message.content);
        } else {
          failedResponses.push(message.content);
        }
      }
    }

    if (successfulResponses.length > 0) {
      const successPattern = await this.analyzeResponseLanguagePattern(successfulResponses, 'successful');
      if (successPattern) patterns.push(successPattern);
    }

    if (failedResponses.length > 0) {
      const failurePattern = await this.analyzeResponseLanguagePattern(failedResponses, 'failed');
      if (failurePattern) patterns.push(failurePattern);
    }

    return patterns;
  }

  /**
   * Analyze temperature optimization based on performance
   */
  private async analyzeTemperatureOptimization(metrics: any): Promise<ModelOptimization | null> {
    // If confidence is low, suggest reducing temperature
    if (metrics.avgConfidence < 0.7) {
      return {
        id: crypto.randomUUID(),
        type: 'temperature_adjustment',
        parameter: 'temperature',
        oldValue: 0.7,
        newValue: 0.5,
        reason: 'Low confidence scores suggest need for more deterministic responses',
        performance: {
          avgConfidence: metrics.avgConfidence,
          successRate: metrics.successRate,
        },
        applied: false,
        createdAt: new Date(),
      };
    }

    // If success rate is low but confidence is high, suggest increasing temperature
    if (metrics.successRate < 0.7 && metrics.avgConfidence > 0.8) {
      return {
        id: crypto.randomUUID(),
        type: 'temperature_adjustment',
        parameter: 'temperature',
        oldValue: 0.5,
        newValue: 0.7,
        reason: 'Low success rate despite high confidence suggests need for more creative responses',
        performance: {
          avgConfidence: metrics.avgConfidence,
          successRate: metrics.successRate,
        },
        applied: false,
        createdAt: new Date(),
      };
    }

    return null;
  }

  /**
   * Analyze context optimization
   */
  private async analyzeContextOptimization(metrics: any): Promise<ModelOptimization | null> {
    // If handoff rate is high, suggest context improvement
    if (metrics.handoffRate > 0.3) {
      return {
        id: crypto.randomUUID(),
        type: 'context_improvement',
        parameter: 'context_window',
        oldValue: 'current',
        newValue: 'expanded',
        reason: 'High handoff rate suggests AI needs more context to handle complex queries',
        performance: {
          handoffRate: metrics.handoffRate,
          successRate: metrics.successRate,
        },
        applied: false,
        createdAt: new Date(),
      };
    }

    return null;
  }

  /**
   * Analyze prompt optimization
   */
  private async analyzePromptOptimization(metrics: any): Promise<ModelOptimization | null> {
    // If satisfaction is low, suggest prompt improvement
    if (metrics.avgSatisfaction < 3.5) {
      return {
        id: crypto.randomUUID(),
        type: 'prompt_optimization',
        parameter: 'system_prompt',
        oldValue: 'current',
        newValue: 'optimized',
        reason: 'Low satisfaction scores suggest need for prompt refinement',
        performance: {
          avgSatisfaction: metrics.avgSatisfaction,
          successRate: metrics.successRate,
        },
        applied: false,
        createdAt: new Date(),
      };
    }

    return null;
  }

  /**
   * Analyze content effectiveness
   */
  private async analyzeContentEffectiveness(item: any): Promise<ContentOptimization | null> {
    const analytics = item.knowledge_analytics || [];
    const usageCount = analytics.reduce((sum: number, a: any) => sum + a.usage_count, 0);
    const successRate = analytics.reduce((sum: number, a: any) => sum + a.success_rate, 0) / Math.max(analytics.length, 1);

    // If content is used frequently but has low success rate
    if (usageCount > 10 && successRate < 0.7) {
      return {
        id: crypto.randomUUID(),
        contentId: item.id,
        type: 'effectiveness_improvement',
        currentContent: item.content,
        suggestedContent: `${item.content} [Needs improvement based on usage analytics]`,
        improvementReason: 'High usage but low success rate indicates content needs refinement',
        confidenceScore: 0.8,
        usageStats: {
          usageCount,
          successRate,
        },
        createdAt: new Date(),
      };
    }

    return null;
  }

  /**
   * Apply individual learning update
   */
  private async applyLearningUpdate(update: any): Promise<void> {
    try {
      switch (update.type) {
        case 'knowledge_update':
          await this.applyKnowledgeUpdate(update);
          break;
        case 'pattern_recognition':
          await this.applyPatternUpdate(update);
          break;
        case 'model_optimization':
          await this.applyModelOptimization(update);
          break;
        case 'content_improvement':
          await this.applyContentImprovement(update);
          break;
      }

      // Mark as applied
      await supabase
        .from('learning_updates')
        .update({
          applied: true,
          applied_at: new Date().toISOString(),
        })
        .eq('id', update.id);
    } catch (error) {
      console.error('Error applying learning update:', error);
    }
  }

  /**
   * Normalize question for pattern recognition
   */
  private async normalizeQuestion(question: string): Promise<string> {
    const prompt = `
Normalize this question to identify similar patterns:
"${question}"

Return a normalized version that captures the intent and structure but removes specific details.
Example: "What is the price of Product X?" -> "What is the price of [product]?"
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      });

      return response.choices[0].message.content || question;
    } catch (error) {
      console.error('Error normalizing question:', error);
      return question;
    }
  }

  /**
   * Analyze response language patterns
   */
  private async analyzeResponseLanguagePattern(responses: string[], type: string): Promise<PatternRecognition | null> {
    const sample = responses.slice(0, 20).join('\n---\n');
    
    const prompt = `
Analyze these ${type} AI responses and identify patterns:
${sample}

Identify:
1. Common language patterns
2. Structural elements
3. Effectiveness indicators
4. Improvement suggestions

Return as JSON with pattern, confidence, impact, suggestions.
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        id: crypto.randomUUID(),
        pattern: analysis.pattern || `${type} response pattern`,
        frequency: responses.length,
        confidence: analysis.confidence || 0.7,
        impact: analysis.impact || 0.6,
        context: `${type}_responses`,
        examples: responses.slice(0, 3),
        suggestions: analysis.suggestions || [],
        actionable: true,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error('Error analyzing response pattern:', error);
      return null;
    }
  }

  // Storage methods
  private async storeLearningUpdate(update: LearningUpdate): Promise<void> {
    await supabase
      .from('learning_updates')
      .insert({
        id: update.id,
        type: update.type,
        title: update.title,
        description: update.description,
        confidence: update.confidence,
        impact: update.impact,
        applied: update.applied,
        data: update.data,
        created_at: update.createdAt.toISOString(),
      });
  }

  private async storeKnowledgeUpdate(update: KnowledgeUpdate): Promise<void> {
    await supabase
      .from('knowledge_updates')
      .insert({
        id: update.id,
        item_id: update.itemId,
        type: update.type,
        content: update.content,
        title: update.title,
        category: update.category,
        tags: update.tags,
        effectiveness: update.effectiveness,
        confidence: update.confidence,
        source: update.source,
        source_id: update.sourceId,
        created_at: update.createdAt.toISOString(),
      });
  }

  private async storePatternRecognition(pattern: PatternRecognition): Promise<void> {
    await supabase
      .from('pattern_recognition')
      .insert({
        id: pattern.id,
        pattern: pattern.pattern,
        frequency: pattern.frequency,
        confidence: pattern.confidence,
        impact: pattern.impact,
        context: pattern.context,
        examples: pattern.examples,
        suggestions: pattern.suggestions,
        actionable: pattern.actionable,
        created_at: pattern.createdAt.toISOString(),
      });
  }

  private async storeModelOptimization(optimization: ModelOptimization): Promise<void> {
    await supabase
      .from('model_optimizations')
      .insert({
        id: optimization.id,
        type: optimization.type,
        parameter: optimization.parameter,
        old_value: optimization.oldValue,
        new_value: optimization.newValue,
        reason: optimization.reason,
        performance: optimization.performance,
        applied: optimization.applied,
        created_at: optimization.createdAt.toISOString(),
      });
  }

  private async storeContentOptimization(optimization: ContentOptimization): Promise<void> {
    await supabase
      .from('content_optimizations')
      .insert({
        id: optimization.id,
        content_id: optimization.contentId,
        type: optimization.type,
        current_content: optimization.currentContent,
        suggested_content: optimization.suggestedContent,
        improvement_reason: optimization.improvementReason,
        confidence_score: optimization.confidenceScore,
        usage_stats: optimization.usageStats,
        created_at: optimization.createdAt.toISOString(),
      });
  }

  // Apply methods
  private async applyKnowledgeUpdate(update: any): Promise<void> {
    // Implementation for applying knowledge updates
    console.log('Applying knowledge update:', update.title);
  }

  private async applyPatternUpdate(update: any): Promise<void> {
    // Implementation for applying pattern updates
    console.log('Applying pattern update:', update.title);
  }

  private async applyModelOptimization(update: any): Promise<void> {
    // Implementation for applying model optimizations
    console.log('Applying model optimization:', update.title);
  }

  private async applyContentImprovement(update: any): Promise<void> {
    // Implementation for applying content improvements
    console.log('Applying content improvement:', update.title);
  }

  /**
   * Get learning engine status
   */
  async getStatus(): Promise<{
    isRunning: boolean;
    queueSize: number;
    lastProcessed: Date;
    stats: Record<string, number>;
  }> {
    return {
      isRunning: !this.isProcessing,
      queueSize: this.learningQueue.length,
      lastProcessed: new Date(),
      stats: {
        knowledgeUpdates: this.knowledgeUpdates.length,
        recognizedPatterns: this.recognizedPatterns.length,
        modelOptimizations: this.modelOptimizations.length,
        contentOptimizations: this.contentOptimizations.length,
      },
    };
  }

  /**
   * Stop continuous learning
   */
  stop(): void {
    if (this.learningInterval) {
      clearInterval(this.learningInterval);
    }
  }
}

export const continuousLearningEngine = ContinuousLearningEngine.getInstance();