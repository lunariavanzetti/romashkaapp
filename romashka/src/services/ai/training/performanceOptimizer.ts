import { supabase } from '../../../lib/supabase';
import OpenAI from 'openai';
import { Message, ConversationContext, AIResponse } from '../../openaiService';
import { aiTrainingService, TrainingData } from './aiTrainingService';
import { continuousLearningEngine } from './continuousLearningEngine';

export interface AccuracyMetrics {
  id: string;
  conversationId: string;
  responseId: string;
  accuracyScore: number;
  confidenceScore: number;
  factualAccuracy: number;
  relevanceScore: number;
  completenessScore: number;
  clarityScore: number;
  assessmentMethod: 'automated' | 'manual' | 'feedback';
  assessedAt: Date;
  notes?: string;
}

export interface ImprovementRecommendation {
  id: string;
  type: 'response_quality' | 'knowledge_gap' | 'model_parameter' | 'content_update' | 'process_improvement';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: number;
  effort: number;
  confidence: number;
  data: Record<string, any>;
  actionItems: string[];
  expectedOutcome: string;
  timeframe: string;
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationPrediction {
  id: string;
  conversationId: string;
  predictionType: 'satisfaction' | 'escalation' | 'resolution' | 'engagement';
  predictedValue: number;
  confidence: number;
  factors: PredictionFactor[];
  recommendation: string;
  predictedAt: Date;
  actualOutcome?: number;
  accuracy?: number;
}

export interface PredictionFactor {
  factor: string;
  weight: number;
  value: number;
  impact: number;
  description: string;
}

export interface QualityAssessment {
  id: string;
  conversationId: string;
  messageId: string;
  overallQuality: number;
  dimensions: {
    accuracy: number;
    relevance: number;
    completeness: number;
    clarity: number;
    tone: number;
    helpfulness: number;
  };
  issues: QualityIssue[];
  suggestions: string[];
  automatedScore: number;
  humanScore?: number;
  assessedAt: Date;
}

export interface QualityIssue {
  type: 'factual_error' | 'irrelevant_response' | 'incomplete_answer' | 'unclear_language' | 'inappropriate_tone' | 'missing_context';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestion: string;
  confidence: number;
}

export interface PerformanceAnalytics {
  timeframe: string;
  metrics: {
    averageAccuracy: number;
    averageConfidence: number;
    accuracyTrend: number;
    confidenceTrend: number;
    responseQuality: number;
    qualityTrend: number;
    improvementRate: number;
  };
  distributions: {
    accuracyDistribution: Array<{ range: string; count: number; percentage: number }>;
    confidenceDistribution: Array<{ range: string; count: number; percentage: number }>;
    qualityDistribution: Array<{ range: string; count: number; percentage: number }>;
  };
  topIssues: Array<{ issue: string; frequency: number; impact: number }>;
  recommendations: ImprovementRecommendation[];
}

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private openai: OpenAI;
  private accuracyCache: Map<string, AccuracyMetrics> = new Map();
  private recommendationQueue: ImprovementRecommendation[] = [];
  private predictionModels: Map<string, any> = new Map();

  private constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });
  }

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  /**
   * Assess response accuracy automatically
   */
  async assessResponseAccuracy(
    conversationId: string,
    messageId: string,
    response: AIResponse,
    context: ConversationContext
  ): Promise<AccuracyMetrics> {
    try {
      // Get conversation history for context
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Analyze response accuracy using AI
      const accuracyAssessment = await this.analyzeResponseAccuracy(
        response.message,
        messages,
        context
      );

      const metrics: AccuracyMetrics = {
        id: crypto.randomUUID(),
        conversationId,
        responseId: messageId,
        accuracyScore: accuracyAssessment.overall,
        confidenceScore: response.confidence,
        factualAccuracy: accuracyAssessment.factual,
        relevanceScore: accuracyAssessment.relevance,
        completenessScore: accuracyAssessment.completeness,
        clarityScore: accuracyAssessment.clarity,
        assessmentMethod: 'automated',
        assessedAt: new Date(),
        notes: accuracyAssessment.notes,
      };

      // Store in cache and database
      this.accuracyCache.set(messageId, metrics);
      await this.storeAccuracyMetrics(metrics);

      // Generate recommendations if accuracy is low
      if (metrics.accuracyScore < 0.7) {
        await this.generateAccuracyRecommendations(metrics, response, context);
      }

      return metrics;
    } catch (error) {
      console.error('Error assessing response accuracy:', error);
      throw error;
    }
  }

  /**
   * Predict conversation outcomes
   */
  async predictConversationOutcome(
    conversationId: string,
    context: ConversationContext
  ): Promise<ConversationPrediction[]> {
    try {
      const predictions: ConversationPrediction[] = [];

      // Get conversation history
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Predict satisfaction
      const satisfactionPrediction = await this.predictSatisfaction(messages, context);
      predictions.push(satisfactionPrediction);

      // Predict escalation probability
      const escalationPrediction = await this.predictEscalation(messages, context);
      predictions.push(escalationPrediction);

      // Predict resolution probability
      const resolutionPrediction = await this.predictResolution(messages, context);
      predictions.push(resolutionPrediction);

      // Predict engagement level
      const engagementPrediction = await this.predictEngagement(messages, context);
      predictions.push(engagementPrediction);

      // Store predictions
      for (const prediction of predictions) {
        await this.storePrediction(prediction);
      }

      return predictions;
    } catch (error) {
      console.error('Error predicting conversation outcome:', error);
      throw error;
    }
  }

  /**
   * Perform quality assurance check
   */
  async performQualityAssurance(
    conversationId: string,
    messageId: string,
    response: string,
    context: ConversationContext
  ): Promise<QualityAssessment> {
    try {
      const assessment = await this.assessResponseQuality(response, context);
      
      const qualityAssessment: QualityAssessment = {
        id: crypto.randomUUID(),
        conversationId,
        messageId,
        overallQuality: assessment.overall,
        dimensions: assessment.dimensions,
        issues: assessment.issues,
        suggestions: assessment.suggestions,
        automatedScore: assessment.overall,
        assessedAt: new Date(),
      };

      // Store assessment
      await this.storeQualityAssessment(qualityAssessment);

      // Generate improvement recommendations for quality issues
      if (qualityAssessment.overallQuality < 0.8) {
        await this.generateQualityRecommendations(qualityAssessment);
      }

      return qualityAssessment;
    } catch (error) {
      console.error('Error performing quality assurance:', error);
      throw error;
    }
  }

  /**
   * Generate improvement recommendations
   */
  async generateRecommendations(
    timeframe: 'daily' | 'weekly' | 'monthly' = 'weekly'
  ): Promise<ImprovementRecommendation[]> {
    try {
      // Get performance data for the timeframe
      const performanceData = await this.getPerformanceData(timeframe);
      
      // Analyze patterns and generate recommendations
      const recommendations: ImprovementRecommendation[] = [];

      // Accuracy-based recommendations
      if (performanceData.averageAccuracy < 0.8) {
        recommendations.push(await this.createAccuracyRecommendation(performanceData));
      }

      // Knowledge gap recommendations
      const knowledgeGaps = await aiTrainingService.identifyKnowledgeGaps();
      for (const gap of knowledgeGaps.slice(0, 5)) {
        recommendations.push(await this.createKnowledgeGapRecommendation(gap));
      }

      // Model parameter recommendations
      const modelRecommendations = await this.generateModelRecommendations(performanceData);
      recommendations.push(...modelRecommendations);

      // Content update recommendations
      const contentRecommendations = await this.generateContentRecommendations(performanceData);
      recommendations.push(...contentRecommendations);

      // Process improvement recommendations
      const processRecommendations = await this.generateProcessRecommendations(performanceData);
      recommendations.push(...processRecommendations);

      // Sort by priority and impact
      recommendations.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.impact - a.impact;
      });

      // Store recommendations
      for (const recommendation of recommendations) {
        await this.storeRecommendation(recommendation);
        this.recommendationQueue.push(recommendation);
      }

      return recommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw error;
    }
  }

  /**
   * Get performance analytics
   */
  async getPerformanceAnalytics(timeframe: string = '30d'): Promise<PerformanceAnalytics> {
    try {
      const startDate = this.getStartDate(timeframe);
      
      // Get accuracy metrics
      const { data: accuracyData, error: accuracyError } = await supabase
        .from('accuracy_metrics')
        .select('*')
        .gte('assessed_at', startDate.toISOString());

      if (accuracyError) throw accuracyError;

      // Get quality assessments
      const { data: qualityData, error: qualityError } = await supabase
        .from('quality_assessments')
        .select('*')
        .gte('assessed_at', startDate.toISOString());

      if (qualityError) throw qualityError;

      // Calculate metrics
      const metrics = this.calculatePerformanceMetrics(accuracyData, qualityData);
      
      // Generate distributions
      const distributions = this.calculateDistributions(accuracyData, qualityData);
      
      // Identify top issues
      const topIssues = this.identifyTopIssues(qualityData);
      
      // Get recent recommendations
      const { data: recommendations, error: recError } = await supabase
        .from('improvement_recommendations')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .limit(10);

      if (recError) throw recError;

      return {
        timeframe,
        metrics,
        distributions,
        topIssues,
        recommendations: recommendations || [],
      };
    } catch (error) {
      console.error('Error getting performance analytics:', error);
      throw error;
    }
  }

  /**
   * Update prediction accuracy when actual outcomes are known
   */
  async updatePredictionAccuracy(
    conversationId: string,
    actualOutcomes: Record<string, number>
  ): Promise<void> {
    try {
      // Get predictions for this conversation
      const { data: predictions, error } = await supabase
        .from('conversation_predictions')
        .select('*')
        .eq('conversation_id', conversationId);

      if (error) throw error;

      // Update each prediction with actual outcome
      for (const prediction of predictions) {
        const actualValue = actualOutcomes[prediction.prediction_type];
        if (actualValue !== undefined) {
          const accuracy = 1 - Math.abs(prediction.predicted_value - actualValue);
          
          await supabase
            .from('conversation_predictions')
            .update({
              actual_outcome: actualValue,
              accuracy: accuracy,
              updated_at: new Date().toISOString(),
            })
            .eq('id', prediction.id);
        }
      }

      // Update prediction model performance
      await this.updatePredictionModels(predictions, actualOutcomes);
    } catch (error) {
      console.error('Error updating prediction accuracy:', error);
      throw error;
    }
  }

  // Private helper methods

  private async analyzeResponseAccuracy(
    response: string,
    messages: Message[],
    context: ConversationContext
  ): Promise<{
    overall: number;
    factual: number;
    relevance: number;
    completeness: number;
    clarity: number;
    notes: string;
  }> {
    const conversationHistory = messages.map(m => `${m.sender_type}: ${m.content}`).join('\n');
    
    const prompt = `
Analyze the accuracy of this AI response in the context of the conversation:

Conversation History:
${conversationHistory}

AI Response to Analyze:
${response}

Evaluate on a scale of 0-1:
1. Factual accuracy (is the information correct?)
2. Relevance (does it address the user's question?)
3. Completeness (is the answer complete?)
4. Clarity (is it clear and understandable?)

Return as JSON with: overall, factual, relevance, completeness, clarity, notes
`;

    try {
      const aiResponse = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });

      const assessment = JSON.parse(aiResponse.choices[0].message.content || '{}');
      
      return {
        overall: assessment.overall || 0.5,
        factual: assessment.factual || 0.5,
        relevance: assessment.relevance || 0.5,
        completeness: assessment.completeness || 0.5,
        clarity: assessment.clarity || 0.5,
        notes: assessment.notes || '',
      };
    } catch (error) {
      console.error('Error analyzing response accuracy:', error);
      return {
        overall: 0.5,
        factual: 0.5,
        relevance: 0.5,
        completeness: 0.5,
        clarity: 0.5,
        notes: 'Error in automated assessment',
      };
    }
  }

  private async predictSatisfaction(
    messages: Message[],
    context: ConversationContext
  ): Promise<ConversationPrediction> {
    // Analyze conversation factors
    const factors: PredictionFactor[] = [
      {
        factor: 'response_time',
        weight: 0.2,
        value: this.calculateAvgResponseTime(messages),
        impact: 0.3,
        description: 'Average response time in conversation',
      },
      {
        factor: 'message_count',
        weight: 0.15,
        value: messages.length / 10, // Normalize
        impact: 0.2,
        description: 'Number of messages in conversation',
      },
      {
        factor: 'ai_confidence',
        weight: 0.25,
        value: context.confidence,
        impact: 0.4,
        description: 'AI confidence in responses',
      },
      {
        factor: 'sentiment',
        weight: 0.2,
        value: this.sentimentToScore(context.sentiment),
        impact: 0.3,
        description: 'Overall conversation sentiment',
      },
      {
        factor: 'resolution_progress',
        weight: 0.2,
        value: this.estimateResolutionProgress(messages),
        impact: 0.4,
        description: 'Progress toward resolution',
      },
    ];

    // Calculate weighted prediction
    const predictedValue = factors.reduce((sum, factor) => 
      sum + (factor.weight * factor.value), 0
    );

    // Calculate confidence based on factor reliability
    const confidence = factors.reduce((sum, factor) => 
      sum + (factor.weight * factor.impact), 0
    );

    return {
      id: crypto.randomUUID(),
      conversationId: context.conversationId,
      predictionType: 'satisfaction',
      predictedValue: Math.min(1, Math.max(0, predictedValue)),
      confidence: Math.min(1, Math.max(0, confidence)),
      factors,
      recommendation: this.generateSatisfactionRecommendation(predictedValue, factors),
      predictedAt: new Date(),
    };
  }

  private async predictEscalation(
    messages: Message[],
    context: ConversationContext
  ): Promise<ConversationPrediction> {
    const factors: PredictionFactor[] = [
      {
        factor: 'negative_sentiment',
        weight: 0.3,
        value: context.sentiment === 'negative' ? 1 : 0,
        impact: 0.5,
        description: 'Customer sentiment is negative',
      },
      {
        factor: 'repeated_questions',
        weight: 0.25,
        value: this.detectRepeatedQuestions(messages),
        impact: 0.4,
        description: 'Customer asking same questions repeatedly',
      },
      {
        factor: 'low_confidence',
        weight: 0.2,
        value: context.confidence < 0.6 ? 1 : 0,
        impact: 0.3,
        description: 'AI responses have low confidence',
      },
      {
        factor: 'conversation_length',
        weight: 0.15,
        value: Math.min(1, messages.length / 20),
        impact: 0.2,
        description: 'Conversation is getting lengthy',
      },
      {
        factor: 'unresolved_issues',
        weight: 0.1,
        value: this.detectUnresolvedIssues(messages),
        impact: 0.3,
        description: 'Issues remain unresolved',
      },
    ];

    const predictedValue = factors.reduce((sum, factor) => 
      sum + (factor.weight * factor.value), 0
    );

    const confidence = factors.reduce((sum, factor) => 
      sum + (factor.weight * factor.impact), 0
    );

    return {
      id: crypto.randomUUID(),
      conversationId: context.conversationId,
      predictionType: 'escalation',
      predictedValue: Math.min(1, Math.max(0, predictedValue)),
      confidence: Math.min(1, Math.max(0, confidence)),
      factors,
      recommendation: this.generateEscalationRecommendation(predictedValue, factors),
      predictedAt: new Date(),
    };
  }

  private async predictResolution(
    messages: Message[],
    context: ConversationContext
  ): Promise<ConversationPrediction> {
    const factors: PredictionFactor[] = [
      {
        factor: 'clear_intent',
        weight: 0.25,
        value: context.intent ? 0.8 : 0.3,
        impact: 0.4,
        description: 'Customer intent is clear',
      },
      {
        factor: 'knowledge_availability',
        weight: 0.3,
        value: this.assessKnowledgeAvailability(context),
        impact: 0.5,
        description: 'Relevant knowledge is available',
      },
      {
        factor: 'conversation_focus',
        weight: 0.2,
        value: this.assessConversationFocus(messages),
        impact: 0.3,
        description: 'Conversation stays focused on topic',
      },
      {
        factor: 'customer_engagement',
        weight: 0.15,
        value: this.assessCustomerEngagement(messages),
        impact: 0.2,
        description: 'Customer is engaged in conversation',
      },
      {
        factor: 'complexity_level',
        weight: 0.1,
        value: 1 - this.assessComplexityLevel(messages),
        impact: 0.2,
        description: 'Issue complexity is manageable',
      },
    ];

    const predictedValue = factors.reduce((sum, factor) => 
      sum + (factor.weight * factor.value), 0
    );

    const confidence = factors.reduce((sum, factor) => 
      sum + (factor.weight * factor.impact), 0
    );

    return {
      id: crypto.randomUUID(),
      conversationId: context.conversationId,
      predictionType: 'resolution',
      predictedValue: Math.min(1, Math.max(0, predictedValue)),
      confidence: Math.min(1, Math.max(0, confidence)),
      factors,
      recommendation: this.generateResolutionRecommendation(predictedValue, factors),
      predictedAt: new Date(),
    };
  }

  private async predictEngagement(
    messages: Message[],
    context: ConversationContext
  ): Promise<ConversationPrediction> {
    const factors: PredictionFactor[] = [
      {
        factor: 'response_rate',
        weight: 0.3,
        value: this.calculateResponseRate(messages),
        impact: 0.4,
        description: 'Customer response rate',
      },
      {
        factor: 'message_quality',
        weight: 0.25,
        value: this.assessMessageQuality(messages),
        impact: 0.3,
        description: 'Quality of customer messages',
      },
      {
        factor: 'positive_sentiment',
        weight: 0.2,
        value: context.sentiment === 'positive' ? 1 : 0.5,
        impact: 0.3,
        description: 'Positive customer sentiment',
      },
      {
        factor: 'conversation_flow',
        weight: 0.15,
        value: this.assessConversationFlow(messages),
        impact: 0.2,
        description: 'Smooth conversation flow',
      },
      {
        factor: 'proactive_responses',
        weight: 0.1,
        value: this.detectProactiveResponses(messages),
        impact: 0.2,
        description: 'AI provides proactive suggestions',
      },
    ];

    const predictedValue = factors.reduce((sum, factor) => 
      sum + (factor.weight * factor.value), 0
    );

    const confidence = factors.reduce((sum, factor) => 
      sum + (factor.weight * factor.impact), 0
    );

    return {
      id: crypto.randomUUID(),
      conversationId: context.conversationId,
      predictionType: 'engagement',
      predictedValue: Math.min(1, Math.max(0, predictedValue)),
      confidence: Math.min(1, Math.max(0, confidence)),
      factors,
      recommendation: this.generateEngagementRecommendation(predictedValue, factors),
      predictedAt: new Date(),
    };
  }

  private async assessResponseQuality(
    response: string,
    context: ConversationContext
  ): Promise<{
    overall: number;
    dimensions: {
      accuracy: number;
      relevance: number;
      completeness: number;
      clarity: number;
      tone: number;
      helpfulness: number;
    };
    issues: QualityIssue[];
    suggestions: string[];
  }> {
    const prompt = `
Assess the quality of this AI response:

Response: ${response}
Context: ${JSON.stringify(context)}

Evaluate dimensions (0-1):
1. Accuracy - factual correctness
2. Relevance - addresses user's need
3. Completeness - provides full answer
4. Clarity - clear and understandable
5. Tone - appropriate tone
6. Helpfulness - genuinely helpful

Also identify any issues and provide suggestions.

Return as JSON with: overall, dimensions, issues, suggestions
`;

    try {
      const aiResponse = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });

      const assessment = JSON.parse(aiResponse.choices[0].message.content || '{}');
      
      return {
        overall: assessment.overall || 0.5,
        dimensions: {
          accuracy: assessment.dimensions?.accuracy || 0.5,
          relevance: assessment.dimensions?.relevance || 0.5,
          completeness: assessment.dimensions?.completeness || 0.5,
          clarity: assessment.dimensions?.clarity || 0.5,
          tone: assessment.dimensions?.tone || 0.5,
          helpfulness: assessment.dimensions?.helpfulness || 0.5,
        },
        issues: assessment.issues || [],
        suggestions: assessment.suggestions || [],
      };
    } catch (error) {
      console.error('Error assessing response quality:', error);
      return {
        overall: 0.5,
        dimensions: {
          accuracy: 0.5,
          relevance: 0.5,
          completeness: 0.5,
          clarity: 0.5,
          tone: 0.5,
          helpfulness: 0.5,
        },
        issues: [],
        suggestions: [],
      };
    }
  }

  // Storage methods
  private async storeAccuracyMetrics(metrics: AccuracyMetrics): Promise<void> {
    await supabase
      .from('accuracy_metrics')
      .insert({
        id: metrics.id,
        conversation_id: metrics.conversationId,
        response_id: metrics.responseId,
        accuracy_score: metrics.accuracyScore,
        confidence_score: metrics.confidenceScore,
        factual_accuracy: metrics.factualAccuracy,
        relevance_score: metrics.relevanceScore,
        completeness_score: metrics.completenessScore,
        clarity_score: metrics.clarityScore,
        assessment_method: metrics.assessmentMethod,
        assessed_at: metrics.assessedAt.toISOString(),
        notes: metrics.notes,
      });
  }

  private async storePrediction(prediction: ConversationPrediction): Promise<void> {
    await supabase
      .from('conversation_predictions')
      .insert({
        id: prediction.id,
        conversation_id: prediction.conversationId,
        prediction_type: prediction.predictionType,
        predicted_value: prediction.predictedValue,
        confidence: prediction.confidence,
        factors: prediction.factors,
        recommendation: prediction.recommendation,
        predicted_at: prediction.predictedAt.toISOString(),
      });
  }

  private async storeQualityAssessment(assessment: QualityAssessment): Promise<void> {
    await supabase
      .from('quality_assessments')
      .insert({
        id: assessment.id,
        conversation_id: assessment.conversationId,
        message_id: assessment.messageId,
        overall_quality: assessment.overallQuality,
        dimensions: assessment.dimensions,
        issues: assessment.issues,
        suggestions: assessment.suggestions,
        automated_score: assessment.automatedScore,
        human_score: assessment.humanScore,
        assessed_at: assessment.assessedAt.toISOString(),
      });
  }

  private async storeRecommendation(recommendation: ImprovementRecommendation): Promise<void> {
    await supabase
      .from('improvement_recommendations')
      .insert({
        id: recommendation.id,
        type: recommendation.type,
        priority: recommendation.priority,
        title: recommendation.title,
        description: recommendation.description,
        impact: recommendation.impact,
        effort: recommendation.effort,
        confidence: recommendation.confidence,
        data: recommendation.data,
        action_items: recommendation.actionItems,
        expected_outcome: recommendation.expectedOutcome,
        timeframe: recommendation.timeframe,
        status: recommendation.status,
        created_at: recommendation.createdAt.toISOString(),
        updated_at: recommendation.updatedAt.toISOString(),
      });
  }

  // Utility methods
  private calculateAvgResponseTime(messages: Message[]): number {
    if (messages.length < 2) return 0.5;
    
    let totalTime = 0;
    let count = 0;
    
    for (let i = 1; i < messages.length; i++) {
      const prev = new Date(messages[i - 1].created_at);
      const curr = new Date(messages[i].created_at);
      totalTime += (curr.getTime() - prev.getTime()) / 1000; // seconds
      count++;
    }
    
    const avgTime = totalTime / count;
    return Math.min(1, Math.max(0, 1 - (avgTime / 300))); // Normalize to 0-1, 5min = 0
  }

  private sentimentToScore(sentiment: string): number {
    switch (sentiment) {
      case 'positive': return 1;
      case 'neutral': return 0.5;
      case 'negative': return 0;
      default: return 0.5;
    }
  }

  private estimateResolutionProgress(messages: Message[]): number {
    // Simple heuristic: AI responses tend to get more specific over time
    const aiMessages = messages.filter(m => m.sender_type === 'ai');
    if (aiMessages.length === 0) return 0;
    
    // Look for resolution indicators in recent messages
    const recent = aiMessages.slice(-3);
    const resolutionKeywords = ['solution', 'resolved', 'fixed', 'complete', 'done'];
    
    let score = 0;
    for (const message of recent) {
      for (const keyword of resolutionKeywords) {
        if (message.content.toLowerCase().includes(keyword)) {
          score += 0.3;
        }
      }
    }
    
    return Math.min(1, score);
  }

  private detectRepeatedQuestions(messages: Message[]): number {
    const userMessages = messages.filter(m => m.sender_type === 'user');
    if (userMessages.length < 2) return 0;
    
    // Simple similarity check
    let repeatedCount = 0;
    for (let i = 1; i < userMessages.length; i++) {
      const similarity = this.calculateSimilarity(
        userMessages[i].content,
        userMessages[i - 1].content
      );
      if (similarity > 0.7) repeatedCount++;
    }
    
    return Math.min(1, repeatedCount / userMessages.length);
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Simple word overlap similarity
    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  }

  private detectUnresolvedIssues(messages: Message[]): number {
    // Look for unresolved issue indicators
    const indicators = ['still', 'not working', 'problem', 'issue', 'help'];
    const recent = messages.slice(-3);
    
    let score = 0;
    for (const message of recent) {
      for (const indicator of indicators) {
        if (message.content.toLowerCase().includes(indicator)) {
          score += 0.2;
        }
      }
    }
    
    return Math.min(1, score);
  }

  private assessKnowledgeAvailability(context: ConversationContext): number {
    // Check if knowledge sources are available for the intent
    if (!context.intent) return 0.3;
    
    // This would typically check against the knowledge base
    // For now, return a reasonable estimate
    return 0.7;
  }

  private assessConversationFocus(messages: Message[]): number {
    // Simple heuristic: focused conversations have consistent topic
    if (messages.length < 3) return 0.8;
    
    // This would involve topic modeling in a real implementation
    // For now, return a reasonable estimate
    return 0.6;
  }

  private assessCustomerEngagement(messages: Message[]): number {
    const userMessages = messages.filter(m => m.sender_type === 'user');
    if (userMessages.length === 0) return 0;
    
    // Look for engagement indicators
    const avgLength = userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length;
    const engagementScore = Math.min(1, avgLength / 100); // Normalize
    
    return engagementScore;
  }

  private assessComplexityLevel(messages: Message[]): number {
    // Simple complexity assessment based on message length and technical terms
    const allText = messages.map(m => m.content).join(' ');
    const technicalTerms = ['API', 'configuration', 'integration', 'database', 'server'];
    
    let complexity = 0;
    for (const term of technicalTerms) {
      if (allText.toLowerCase().includes(term.toLowerCase())) {
        complexity += 0.2;
      }
    }
    
    // Add length factor
    complexity += Math.min(0.5, allText.length / 2000);
    
    return Math.min(1, complexity);
  }

  private calculateResponseRate(messages: Message[]): number {
    const userMessages = messages.filter(m => m.sender_type === 'user');
    const aiMessages = messages.filter(m => m.sender_type === 'ai');
    
    if (userMessages.length === 0) return 0;
    
    return Math.min(1, aiMessages.length / userMessages.length);
  }

  private assessMessageQuality(messages: Message[]): number {
    const userMessages = messages.filter(m => m.sender_type === 'user');
    if (userMessages.length === 0) return 0.5;
    
    // Simple quality metrics
    const avgLength = userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length;
    const qualityScore = Math.min(1, avgLength / 50); // Normalize
    
    return qualityScore;
  }

  private assessConversationFlow(messages: Message[]): number {
    // Simple flow assessment - alternating user/ai messages indicate good flow
    let goodFlow = 0;
    for (let i = 1; i < messages.length; i++) {
      if (messages[i].sender_type !== messages[i - 1].sender_type) {
        goodFlow++;
      }
    }
    
    return messages.length > 1 ? goodFlow / (messages.length - 1) : 0.5;
  }

  private detectProactiveResponses(messages: Message[]): number {
    const aiMessages = messages.filter(m => m.sender_type === 'ai');
    
    const proactiveIndicators = ['suggest', 'recommend', 'might also', 'consider', 'additionally'];
    let proactiveCount = 0;
    
    for (const message of aiMessages) {
      for (const indicator of proactiveIndicators) {
        if (message.content.toLowerCase().includes(indicator)) {
          proactiveCount++;
          break;
        }
      }
    }
    
    return aiMessages.length > 0 ? proactiveCount / aiMessages.length : 0;
  }

  private generateSatisfactionRecommendation(prediction: number, factors: PredictionFactor[]): string {
    if (prediction < 0.5) {
      const weakestFactor = factors.reduce((min, factor) => 
        factor.value < min.value ? factor : min
      );
      return `Focus on improving ${weakestFactor.factor} to increase satisfaction`;
    }
    return 'Continue current approach to maintain satisfaction';
  }

  private generateEscalationRecommendation(prediction: number, factors: PredictionFactor[]): string {
    if (prediction > 0.7) {
      return 'High escalation risk - consider human handoff';
    } else if (prediction > 0.5) {
      return 'Moderate escalation risk - increase response quality';
    }
    return 'Low escalation risk - continue current approach';
  }

  private generateResolutionRecommendation(prediction: number, factors: PredictionFactor[]): string {
    if (prediction < 0.5) {
      return 'Low resolution probability - consider alternative approaches';
    }
    return 'Good resolution probability - continue current approach';
  }

  private generateEngagementRecommendation(prediction: number, factors: PredictionFactor[]): string {
    if (prediction < 0.5) {
      return 'Low engagement - use more interactive responses';
    }
    return 'Good engagement - maintain current interaction style';
  }

  // Additional helper methods for recommendations and analytics
  private async getPerformanceData(timeframe: string): Promise<any> {
    const startDate = this.getStartDate(timeframe);
    
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    const avgAccuracy = conversations.reduce((sum, c) => sum + (c.ai_confidence || 0), 0) / conversations.length;
    
    return {
      totalConversations: conversations.length,
      averageAccuracy: avgAccuracy,
      averageConfidence: avgAccuracy, // Simplified
      satisfactionScore: conversations.reduce((sum, c) => sum + (c.satisfaction_score || 0), 0) / conversations.length,
    };
  }

  private getStartDate(timeframe: string): Date {
    const now = new Date();
    const days = timeframe === 'daily' ? 1 : timeframe === 'weekly' ? 7 : 30;
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }

  private async createAccuracyRecommendation(data: any): Promise<ImprovementRecommendation> {
    return {
      id: crypto.randomUUID(),
      type: 'response_quality',
      priority: 'high',
      title: 'Improve Response Accuracy',
      description: `Current accuracy is ${(data.averageAccuracy * 100).toFixed(1)}%, below target of 80%`,
      impact: 0.8,
      effort: 0.6,
      confidence: 0.9,
      data: { currentAccuracy: data.averageAccuracy },
      actionItems: [
        'Review and update knowledge base',
        'Improve response validation',
        'Implement additional fact-checking',
      ],
      expectedOutcome: 'Increase accuracy to 85%+',
      timeframe: '2 weeks',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private async createKnowledgeGapRecommendation(gap: any): Promise<ImprovementRecommendation> {
    return {
      id: crypto.randomUUID(),
      type: 'knowledge_gap',
      priority: gap.priority,
      title: `Address Knowledge Gap: ${gap.topic}`,
      description: gap.suggestedContent,
      impact: gap.impact,
      effort: 0.4,
      confidence: 0.8,
      data: { topic: gap.topic, frequency: gap.frequency },
      actionItems: [
        'Create knowledge base content',
        'Train AI on new content',
        'Test with sample conversations',
      ],
      expectedOutcome: 'Reduce knowledge gap frequency by 70%',
      timeframe: '1 week',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private async generateModelRecommendations(data: any): Promise<ImprovementRecommendation[]> {
    const recommendations: ImprovementRecommendation[] = [];

    if (data.averageConfidence < 0.7) {
      recommendations.push({
        id: crypto.randomUUID(),
        type: 'model_parameter',
        priority: 'medium',
        title: 'Optimize Model Parameters',
        description: 'Adjust temperature and other parameters for better performance',
        impact: 0.6,
        effort: 0.3,
        confidence: 0.7,
        data: { currentConfidence: data.averageConfidence },
        actionItems: [
          'Analyze optimal temperature settings',
          'Adjust presence/frequency penalties',
          'Test parameter changes',
        ],
        expectedOutcome: 'Improve confidence by 15%',
        timeframe: '3 days',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return recommendations;
  }

  private async generateContentRecommendations(data: any): Promise<ImprovementRecommendation[]> {
    const recommendations: ImprovementRecommendation[] = [];

    // Check for outdated content
    recommendations.push({
      id: crypto.randomUUID(),
      type: 'content_update',
      priority: 'medium',
      title: 'Update Knowledge Base Content',
      description: 'Regular content refresh to maintain accuracy',
      impact: 0.5,
      effort: 0.4,
      confidence: 0.8,
      data: {},
      actionItems: [
        'Review content age and usage',
        'Update outdated information',
        'Add new relevant content',
      ],
      expectedOutcome: 'Improve content freshness by 20%',
      timeframe: '1 week',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return recommendations;
  }

  private async generateProcessRecommendations(data: any): Promise<ImprovementRecommendation[]> {
    const recommendations: ImprovementRecommendation[] = [];

    if (data.satisfactionScore < 3.5) {
      recommendations.push({
        id: crypto.randomUUID(),
        type: 'process_improvement',
        priority: 'high',
        title: 'Improve Response Process',
        description: 'Enhance the overall response generation process',
        impact: 0.7,
        effort: 0.5,
        confidence: 0.8,
        data: { currentSatisfaction: data.satisfactionScore },
        actionItems: [
          'Implement better context handling',
          'Add response validation checks',
          'Improve escalation logic',
        ],
        expectedOutcome: 'Increase satisfaction to 4.0+',
        timeframe: '2 weeks',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return recommendations;
  }

  private calculatePerformanceMetrics(accuracyData: any[], qualityData: any[]): any {
    const accuracy = accuracyData.length > 0 ? 
      accuracyData.reduce((sum, a) => sum + a.accuracy_score, 0) / accuracyData.length : 0;
    
    const quality = qualityData.length > 0 ? 
      qualityData.reduce((sum, q) => sum + q.overall_quality, 0) / qualityData.length : 0;

    return {
      averageAccuracy: accuracy,
      averageConfidence: accuracy, // Simplified
      accuracyTrend: 0, // Would calculate from time series
      confidenceTrend: 0,
      responseQuality: quality,
      qualityTrend: 0,
      improvementRate: 0,
    };
  }

  private calculateDistributions(accuracyData: any[], qualityData: any[]): any {
    return {
      accuracyDistribution: this.createDistribution(accuracyData, 'accuracy_score'),
      confidenceDistribution: this.createDistribution(accuracyData, 'confidence_score'),
      qualityDistribution: this.createDistribution(qualityData, 'overall_quality'),
    };
  }

  private createDistribution(data: any[], field: string): Array<{ range: string; count: number; percentage: number }> {
    const ranges = [
      { range: '0-0.2', min: 0, max: 0.2 },
      { range: '0.2-0.4', min: 0.2, max: 0.4 },
      { range: '0.4-0.6', min: 0.4, max: 0.6 },
      { range: '0.6-0.8', min: 0.6, max: 0.8 },
      { range: '0.8-1.0', min: 0.8, max: 1.0 },
    ];

    const total = data.length;
    
    return ranges.map(range => {
      const count = data.filter(item => {
        const value = item[field];
        return value >= range.min && value < range.max;
      }).length;
      
      return {
        range: range.range,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      };
    });
  }

  private identifyTopIssues(qualityData: any[]): Array<{ issue: string; frequency: number; impact: number }> {
    const issueMap = new Map<string, { frequency: number; impact: number }>();

    for (const quality of qualityData) {
      if (quality.issues) {
        for (const issue of quality.issues) {
          if (issueMap.has(issue.type)) {
            const existing = issueMap.get(issue.type)!;
            existing.frequency++;
            existing.impact += issue.severity === 'high' ? 0.8 : issue.severity === 'medium' ? 0.5 : 0.2;
          } else {
            issueMap.set(issue.type, {
              frequency: 1,
              impact: issue.severity === 'high' ? 0.8 : issue.severity === 'medium' ? 0.5 : 0.2,
            });
          }
        }
      }
    }

    return Array.from(issueMap.entries())
      .map(([issue, data]) => ({
        issue,
        frequency: data.frequency,
        impact: data.impact / data.frequency, // Average impact
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  }

  private async generateAccuracyRecommendations(
    metrics: AccuracyMetrics,
    response: AIResponse,
    context: ConversationContext
  ): Promise<void> {
    const recommendation: ImprovementRecommendation = {
      id: crypto.randomUUID(),
      type: 'response_quality',
      priority: metrics.accuracyScore < 0.5 ? 'high' : 'medium',
      title: 'Improve Response Accuracy',
      description: `Response accuracy is ${(metrics.accuracyScore * 100).toFixed(1)}%`,
      impact: 0.8,
      effort: 0.4,
      confidence: 0.9,
      data: { conversationId: metrics.conversationId, accuracyScore: metrics.accuracyScore },
      actionItems: [
        'Review knowledge sources',
        'Improve fact validation',
        'Enhance context understanding',
      ],
      expectedOutcome: 'Increase accuracy by 20%',
      timeframe: '1 week',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.storeRecommendation(recommendation);
  }

  private async generateQualityRecommendations(assessment: QualityAssessment): Promise<void> {
    const recommendation: ImprovementRecommendation = {
      id: crypto.randomUUID(),
      type: 'response_quality',
      priority: assessment.overallQuality < 0.6 ? 'high' : 'medium',
      title: 'Improve Response Quality',
      description: `Response quality is ${(assessment.overallQuality * 100).toFixed(1)}%`,
      impact: 0.7,
      effort: 0.5,
      confidence: 0.8,
      data: { 
        conversationId: assessment.conversationId,
        qualityScore: assessment.overallQuality,
        issues: assessment.issues,
      },
      actionItems: assessment.suggestions,
      expectedOutcome: 'Increase quality by 15%',
      timeframe: '1 week',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.storeRecommendation(recommendation);
  }

  private async updatePredictionModels(
    predictions: any[],
    actualOutcomes: Record<string, number>
  ): Promise<void> {
    // Update model accuracy metrics
    for (const prediction of predictions) {
      const modelKey = prediction.prediction_type;
      const actualValue = actualOutcomes[modelKey];
      
      if (actualValue !== undefined) {
        const accuracy = 1 - Math.abs(prediction.predicted_value - actualValue);
        
        // Update model performance tracking
        if (!this.predictionModels.has(modelKey)) {
          this.predictionModels.set(modelKey, {
            totalPredictions: 0,
            totalAccuracy: 0,
            averageAccuracy: 0,
          });
        }
        
        const model = this.predictionModels.get(modelKey)!;
        model.totalPredictions++;
        model.totalAccuracy += accuracy;
        model.averageAccuracy = model.totalAccuracy / model.totalPredictions;
      }
    }
  }
}

export const performanceOptimizer = PerformanceOptimizer.getInstance();