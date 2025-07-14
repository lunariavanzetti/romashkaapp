import { supabase } from '../../supabaseClient';
import { MetricsCollector } from '../metricsCollector';

// Customer Satisfaction Types
export interface CustomerSatisfactionSurvey {
  id: string;
  conversationId: string;
  customerId: string;
  surveyType: 'post_conversation' | 'nps' | 'periodic';
  csatRating?: number;
  csatComment?: string;
  npsScore?: number;
  npsComment?: string;
  responseQualityRating?: number;
  resolutionSpeedRating?: number;
  agentFriendlinessRating?: number;
  sentimentScore?: number;
  sentimentMagnitude?: number;
  detectedEmotions?: Record<string, number>;
  channelType?: string;
  surveySentAt: Date;
  responseReceivedAt?: Date;
  responseTimeSeconds?: number;
  followUpRequired?: boolean;
  followUpReason?: string;
  followUpCompletedAt?: Date;
}

export interface SentimentAnalysis {
  id: string;
  conversationId: string;
  messageId: string;
  sentimentScore: number; // -1.0 to 1.0
  sentimentMagnitude: number; // 0.0 to 1.0
  confidenceScore: number; // 0.0 to 1.0
  detectedEmotions: Record<string, number>;
  dominantEmotion: string;
  messageContext: string;
  escalationRiskScore: number;
  analysisModel: string;
  processingTimeMs: number;
  createdAt: Date;
}

export interface SatisfactionTrend {
  period: string;
  csatAverage: number;
  csatCount: number;
  npsScore: number;
  npsCount: number;
  promoters: number;
  passives: number;
  detractors: number;
  sentimentAverage: number;
  responseRate: number;
  topCompliments: string[];
  topComplaints: string[];
}

export interface SatisfactionAlert {
  id: string;
  alertType: 'low_satisfaction' | 'negative_trend' | 'complaint_spike' | 'nps_decline';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedMetrics: string[];
  triggerValue: number;
  thresholdValue: number;
  suggestedActions: string[];
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
}

export interface CustomerFeedbackAnalysis {
  totalResponses: number;
  averageCSAT: number;
  averageNPS: number;
  npsClassification: {
    promoters: number;
    passives: number;
    detractors: number;
  };
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  topKeywords: Array<{ word: string; count: number; sentiment: number }>;
  commonThemes: Array<{ theme: string; count: number; sentiment: number }>;
  improvementAreas: Array<{ area: string; priority: number; mentions: number }>;
}

export class CustomerSatisfactionService {
  private static instance: CustomerSatisfactionService;
  private metricsCollector: MetricsCollector;

  // Satisfaction thresholds
  private readonly SATISFACTION_THRESHOLDS = {
    CSAT_EXCELLENT: 5,
    CSAT_GOOD: 4,
    CSAT_POOR: 3,
    NPS_PROMOTER: 9,
    NPS_PASSIVE: 7,
    NPS_DETRACTOR: 6,
    SENTIMENT_POSITIVE: 0.1,
    SENTIMENT_NEGATIVE: -0.1,
    ESCALATION_RISK: 0.7
  };

  private constructor() {
    this.metricsCollector = MetricsCollector.getInstance();
  }

  static getInstance(): CustomerSatisfactionService {
    if (!CustomerSatisfactionService.instance) {
      CustomerSatisfactionService.instance = new CustomerSatisfactionService();
    }
    return CustomerSatisfactionService.instance;
  }

  // CSAT Survey Management
  async createCSATSurvey(conversationId: string, customerId: string, channelType: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('customer_satisfaction_surveys')
        .insert({
          conversation_id: conversationId,
          customer_id: customerId,
          survey_type: 'post_conversation',
          channel_type: channelType,
          survey_sent_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Record metric event
      await this.metricsCollector.recordEvent({
        type: 'csat_survey_sent',
        value: 1,
        dimensions: { conversationId, customerId, channelType },
        timestamp: new Date(),
        conversationId
      });

      return data.id;
    } catch (error) {
      console.error('Error creating CSAT survey:', error);
      throw error;
    }
  }

  async recordCSATResponse(surveyId: string, rating: number, comment?: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('customer_satisfaction_surveys')
        .update({
          csat_rating: rating,
          csat_comment: comment,
          response_received_at: new Date().toISOString(),
          response_time_seconds: this.calculateResponseTime(surveyId)
        })
        .eq('id', surveyId)
        .select()
        .single();

      if (error) throw error;

      // Analyze sentiment of comment if provided
      if (comment) {
        const sentiment = await this.analyzeSentiment(comment);
        await supabase
          .from('customer_satisfaction_surveys')
          .update({
            sentiment_score: sentiment.score,
            sentiment_magnitude: sentiment.magnitude,
            detected_emotions: sentiment.emotions
          })
          .eq('id', surveyId);
      }

      // Record metric event
      await this.metricsCollector.recordEvent({
        type: 'csat_response_received',
        value: rating,
        dimensions: { surveyId, rating: rating.toString() },
        timestamp: new Date(),
        conversationId: data.conversation_id
      });

      // Check for follow-up requirements
      await this.checkFollowUpRequirements(surveyId, rating, comment);

    } catch (error) {
      console.error('Error recording CSAT response:', error);
      throw error;
    }
  }

  // NPS Survey Management
  async createNPSSurvey(customerId: string, channelType: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('customer_satisfaction_surveys')
        .insert({
          customer_id: customerId,
          survey_type: 'nps',
          channel_type: channelType,
          survey_sent_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      await this.metricsCollector.recordEvent({
        type: 'nps_survey_sent',
        value: 1,
        dimensions: { customerId, channelType },
        timestamp: new Date()
      });

      return data.id;
    } catch (error) {
      console.error('Error creating NPS survey:', error);
      throw error;
    }
  }

  async recordNPSResponse(surveyId: string, score: number, comment?: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('customer_satisfaction_surveys')
        .update({
          nps_score: score,
          nps_comment: comment,
          response_received_at: new Date().toISOString(),
          response_time_seconds: this.calculateResponseTime(surveyId)
        })
        .eq('id', surveyId)
        .select()
        .single();

      if (error) throw error;

      // Analyze sentiment of comment if provided
      if (comment) {
        const sentiment = await this.analyzeSentiment(comment);
        await supabase
          .from('customer_satisfaction_surveys')
          .update({
            sentiment_score: sentiment.score,
            sentiment_magnitude: sentiment.magnitude,
            detected_emotions: sentiment.emotions
          })
          .eq('id', surveyId);
      }

      await this.metricsCollector.recordEvent({
        type: 'nps_response_received',
        value: score,
        dimensions: { surveyId, score: score.toString() },
        timestamp: new Date(),
        conversationId: data.conversation_id
      });

      // Check for follow-up requirements (detractors need follow-up)
      if (score <= this.SATISFACTION_THRESHOLDS.NPS_DETRACTOR) {
        await this.checkFollowUpRequirements(surveyId, score, comment);
      }

    } catch (error) {
      console.error('Error recording NPS response:', error);
      throw error;
    }
  }

  // Real-time Sentiment Analysis
  async analyzeSentimentForMessage(conversationId: string, messageId: string, content: string): Promise<SentimentAnalysis> {
    try {
      const sentiment = await this.analyzeSentiment(content);
      
      // Determine message context
      const messageContext = this.determineMessageContext(content);
      
      // Calculate escalation risk
      const escalationRisk = this.calculateEscalationRisk(sentiment, messageContext);

      const { data, error } = await supabase
        .from('conversation_sentiment_analysis')
        .insert({
          conversation_id: conversationId,
          message_id: messageId,
          sentiment_score: sentiment.score,
          sentiment_magnitude: sentiment.magnitude,
          confidence_score: sentiment.confidence,
          detected_emotions: sentiment.emotions,
          dominant_emotion: sentiment.dominantEmotion,
          message_context: messageContext,
          escalation_risk_score: escalationRisk,
          analysis_model: sentiment.model,
          processing_time_ms: sentiment.processingTime
        })
        .select()
        .single();

      if (error) throw error;

      // Record metric event
      await this.metricsCollector.recordEvent({
        type: 'sentiment_analysis_completed',
        value: sentiment.score,
        dimensions: { 
          conversationId, 
          messageId, 
          sentiment: sentiment.score > 0 ? 'positive' : sentiment.score < 0 ? 'negative' : 'neutral',
          escalationRisk: escalationRisk.toString()
        },
        timestamp: new Date(),
        conversationId
      });

      return {
        id: data.id,
        conversationId: data.conversation_id,
        messageId: data.message_id,
        sentimentScore: data.sentiment_score,
        sentimentMagnitude: data.sentiment_magnitude,
        confidenceScore: data.confidence_score,
        detectedEmotions: data.detected_emotions,
        dominantEmotion: data.dominant_emotion,
        messageContext: data.message_context,
        escalationRiskScore: data.escalation_risk_score,
        analysisModel: data.analysis_model,
        processingTimeMs: data.processing_time_ms,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error('Error analyzing sentiment for message:', error);
      throw error;
    }
  }

  // Satisfaction Trend Analysis
  async getSatisfactionTrends(startDate: string, endDate: string, granularity: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<SatisfactionTrend[]> {
    try {
      const { data: surveys, error } = await supabase
        .from('customer_satisfaction_surveys')
        .select('*')
        .gte('response_received_at', startDate)
        .lte('response_received_at', endDate)
        .not('response_received_at', 'is', null);

      if (error) throw error;

      // Group data by time period
      const groupedData = this.groupSurveysByPeriod(surveys, granularity);
      
      const trends: SatisfactionTrend[] = [];
      
      for (const [period, periodSurveys] of groupedData) {
        const csatSurveys = periodSurveys.filter(s => s.csat_rating !== null);
        const npsSurveys = periodSurveys.filter(s => s.nps_score !== null);
        
        // Calculate NPS classification
        const promoters = npsSurveys.filter(s => s.nps_score >= this.SATISFACTION_THRESHOLDS.NPS_PROMOTER).length;
        const passives = npsSurveys.filter(s => s.nps_score >= this.SATISFACTION_THRESHOLDS.NPS_PASSIVE && s.nps_score < this.SATISFACTION_THRESHOLDS.NPS_PROMOTER).length;
        const detractors = npsSurveys.filter(s => s.nps_score <= this.SATISFACTION_THRESHOLDS.NPS_DETRACTOR).length;
        
        // Calculate averages
        const csatAverage = csatSurveys.length > 0 ? 
          csatSurveys.reduce((sum, s) => sum + s.csat_rating, 0) / csatSurveys.length : 0;
        
        const npsScore = npsSurveys.length > 0 ? 
          ((promoters - detractors) / npsSurveys.length) * 100 : 0;
        
        const sentimentAverage = periodSurveys.filter(s => s.sentiment_score !== null).length > 0 ?
          periodSurveys.filter(s => s.sentiment_score !== null).reduce((sum, s) => sum + s.sentiment_score, 0) / periodSurveys.filter(s => s.sentiment_score !== null).length : 0;

        // Extract top themes
        const comments = periodSurveys.map(s => s.csat_comment || s.nps_comment).filter(Boolean);
        const { compliments, complaints } = this.extractTopThemes(comments);

        trends.push({
          period,
          csatAverage,
          csatCount: csatSurveys.length,
          npsScore,
          npsCount: npsSurveys.length,
          promoters,
          passives,
          detractors,
          sentimentAverage,
          responseRate: this.calculateResponseRate(period),
          topCompliments: compliments,
          topComplaints: complaints
        });
      }

      return trends.sort((a, b) => a.period.localeCompare(b.period));
    } catch (error) {
      console.error('Error getting satisfaction trends:', error);
      throw error;
    }
  }

  // Satisfaction Alerts
  async checkSatisfactionAlerts(): Promise<SatisfactionAlert[]> {
    try {
      const alerts: SatisfactionAlert[] = [];
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      
      // Get recent satisfaction data
      const { data: recentSurveys, error } = await supabase
        .from('customer_satisfaction_surveys')
        .select('*')
        .gte('response_received_at', yesterday.toISOString())
        .not('response_received_at', 'is', null);

      if (error) throw error;

      // Check for low satisfaction
      const lowCSATSurveys = recentSurveys.filter(s => s.csat_rating && s.csat_rating <= this.SATISFACTION_THRESHOLDS.CSAT_POOR);
      if (lowCSATSurveys.length > 0) {
        const percentage = (lowCSATSurveys.length / recentSurveys.filter(s => s.csat_rating).length) * 100;
        if (percentage > 20) { // More than 20% low satisfaction
          alerts.push({
            id: `low_satisfaction_${Date.now()}`,
            alertType: 'low_satisfaction',
            severity: percentage > 40 ? 'critical' : 'high',
            title: 'High Volume of Low Satisfaction Ratings',
            description: `${percentage.toFixed(1)}% of recent CSAT responses are 3 or below`,
            affectedMetrics: ['csat_rating', 'customer_satisfaction'],
            triggerValue: percentage,
            thresholdValue: 20,
            suggestedActions: [
              'Review conversations with low ratings',
              'Identify common issues causing dissatisfaction',
              'Consider agent training or process improvements',
              'Reach out to dissatisfied customers for follow-up'
            ],
            createdAt: new Date()
          });
        }
      }

      // Check for NPS decline
      const npsScores = recentSurveys.filter(s => s.nps_score !== null).map(s => s.nps_score);
      if (npsScores.length > 0) {
        const averageNPS = npsScores.reduce((sum, score) => sum + score, 0) / npsScores.length;
        if (averageNPS < 6) { // Average NPS below 6
          alerts.push({
            id: `nps_decline_${Date.now()}`,
            alertType: 'nps_decline',
            severity: averageNPS < 3 ? 'critical' : 'high',
            title: 'Declining NPS Score',
            description: `Average NPS score has dropped to ${averageNPS.toFixed(1)}`,
            affectedMetrics: ['nps_score', 'customer_loyalty'],
            triggerValue: averageNPS,
            thresholdValue: 6,
            suggestedActions: [
              'Analyze detractor feedback for improvement opportunities',
              'Implement customer retention strategies',
              'Follow up with detractors to understand concerns',
              'Review and improve customer experience touchpoints'
            ],
            createdAt: new Date()
          });
        }
      }

      // Check for negative sentiment spike
      const { data: sentimentData, error: sentimentError } = await supabase
        .from('conversation_sentiment_analysis')
        .select('sentiment_score')
        .gte('created_at', yesterday.toISOString());

      if (!sentimentError && sentimentData.length > 0) {
        const negativeSentiments = sentimentData.filter(s => s.sentiment_score < this.SATISFACTION_THRESHOLDS.SENTIMENT_NEGATIVE);
        const negativePercentage = (negativeSentiments.length / sentimentData.length) * 100;
        
        if (negativePercentage > 30) { // More than 30% negative sentiment
          alerts.push({
            id: `negative_sentiment_${Date.now()}`,
            alertType: 'complaint_spike',
            severity: negativePercentage > 50 ? 'critical' : 'high',
            title: 'Spike in Negative Sentiment',
            description: `${negativePercentage.toFixed(1)}% of recent messages show negative sentiment`,
            affectedMetrics: ['sentiment_score', 'message_sentiment'],
            triggerValue: negativePercentage,
            thresholdValue: 30,
            suggestedActions: [
              'Review conversations with negative sentiment',
              'Identify common themes in negative feedback',
              'Provide additional agent training on conflict resolution',
              'Consider escalation procedures for negative sentiment'
            ],
            createdAt: new Date()
          });
        }
      }

      return alerts;
    } catch (error) {
      console.error('Error checking satisfaction alerts:', error);
      throw error;
    }
  }

  // Customer Feedback Analysis
  async analyzeCustomerFeedback(startDate: string, endDate: string): Promise<CustomerFeedbackAnalysis> {
    try {
      const { data: surveys, error } = await supabase
        .from('customer_satisfaction_surveys')
        .select('*')
        .gte('response_received_at', startDate)
        .lte('response_received_at', endDate)
        .not('response_received_at', 'is', null);

      if (error) throw error;

      const csatSurveys = surveys.filter(s => s.csat_rating !== null);
      const npsSurveys = surveys.filter(s => s.nps_score !== null);
      const commentsWithSentiment = surveys.filter(s => s.csat_comment || s.nps_comment);

      // Calculate basic metrics
      const averageCSAT = csatSurveys.length > 0 ? 
        csatSurveys.reduce((sum, s) => sum + s.csat_rating, 0) / csatSurveys.length : 0;

      const averageNPS = npsSurveys.length > 0 ? 
        npsSurveys.reduce((sum, s) => sum + s.nps_score, 0) / npsSurveys.length : 0;

      // NPS classification
      const promoters = npsSurveys.filter(s => s.nps_score >= this.SATISFACTION_THRESHOLDS.NPS_PROMOTER).length;
      const passives = npsSurveys.filter(s => s.nps_score >= this.SATISFACTION_THRESHOLDS.NPS_PASSIVE && s.nps_score < this.SATISFACTION_THRESHOLDS.NPS_PROMOTER).length;
      const detractors = npsSurveys.filter(s => s.nps_score <= this.SATISFACTION_THRESHOLDS.NPS_DETRACTOR).length;

      // Sentiment breakdown
      const positive = commentsWithSentiment.filter(s => s.sentiment_score > this.SATISFACTION_THRESHOLDS.SENTIMENT_POSITIVE).length;
      const negative = commentsWithSentiment.filter(s => s.sentiment_score < this.SATISFACTION_THRESHOLDS.SENTIMENT_NEGATIVE).length;
      const neutral = commentsWithSentiment.length - positive - negative;

      // Extract keywords and themes
      const allComments = surveys.map(s => s.csat_comment || s.nps_comment).filter(Boolean);
      const topKeywords = this.extractKeywords(allComments);
      const commonThemes = this.extractThemes(allComments);
      const improvementAreas = this.identifyImprovementAreas(allComments);

      return {
        totalResponses: surveys.length,
        averageCSAT,
        averageNPS,
        npsClassification: {
          promoters,
          passives,
          detractors
        },
        sentimentBreakdown: {
          positive,
          neutral,
          negative
        },
        topKeywords,
        commonThemes,
        improvementAreas
      };
    } catch (error) {
      console.error('Error analyzing customer feedback:', error);
      throw error;
    }
  }

  // Helper methods
  private async analyzeSentiment(text: string): Promise<any> {
    // This would integrate with a real sentiment analysis service
    // For now, we'll use a simple implementation
    const words = text.toLowerCase().split(/\s+/);
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'helpful', 'satisfied', 'happy'];
    const negativeWords = ['bad', 'terrible', 'awful', 'disappointed', 'frustrated', 'angry', 'upset'];
    
    let score = 0;
    const emotions: Record<string, number> = {};
    
    words.forEach(word => {
      if (positiveWords.includes(word)) score += 0.1;
      if (negativeWords.includes(word)) score -= 0.1;
    });
    
    score = Math.max(-1, Math.min(1, score));
    
    return {
      score,
      magnitude: Math.abs(score),
      confidence: 0.8,
      emotions,
      dominantEmotion: score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral',
      model: 'simple_sentiment_v1',
      processingTime: 50
    };
  }

  private determineMessageContext(content: string): string {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('hello') || lowerContent.includes('hi')) return 'greeting';
    if (lowerContent.includes('problem') || lowerContent.includes('issue')) return 'complaint';
    if (lowerContent.includes('thank') || lowerContent.includes('great')) return 'compliment';
    if (lowerContent.includes('?')) return 'question';
    
    return 'general';
  }

  private calculateEscalationRisk(sentiment: any, messageContext: string): number {
    let risk = 0;
    
    // Negative sentiment increases risk
    if (sentiment.score < -0.5) risk += 0.4;
    else if (sentiment.score < -0.2) risk += 0.2;
    
    // High magnitude increases risk
    if (sentiment.magnitude > 0.7) risk += 0.2;
    
    // Complaint context increases risk
    if (messageContext === 'complaint') risk += 0.3;
    
    return Math.min(1, risk);
  }

  private async calculateResponseTime(surveyId: string): Promise<number> {
    const { data, error } = await supabase
      .from('customer_satisfaction_surveys')
      .select('survey_sent_at')
      .eq('id', surveyId)
      .single();

    if (error) return 0;

    const sentAt = new Date(data.survey_sent_at);
    const now = new Date();
    return Math.floor((now.getTime() - sentAt.getTime()) / 1000);
  }

  private async checkFollowUpRequirements(surveyId: string, rating: number, comment?: string): Promise<void> {
    let followUpRequired = false;
    let followUpReason = '';

    if (rating <= 2) {
      followUpRequired = true;
      followUpReason = 'Low satisfaction rating requires follow-up';
    } else if (comment && comment.toLowerCase().includes('problem')) {
      followUpRequired = true;
      followUpReason = 'Customer mentioned problem in feedback';
    }

    if (followUpRequired) {
      await supabase
        .from('customer_satisfaction_surveys')
        .update({
          follow_up_required: true,
          follow_up_reason: followUpReason
        })
        .eq('id', surveyId);
    }
  }

  private groupSurveysByPeriod(surveys: any[], granularity: string): Map<string, any[]> {
    const grouped = new Map();
    
    surveys.forEach(survey => {
      const date = new Date(survey.response_received_at);
      let key: string;
      
      switch (granularity) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }
      
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key).push(survey);
    });
    
    return grouped;
  }

  private async calculateResponseRate(period: string): Promise<number> {
    // This would calculate the actual response rate for the period
    // For now, returning a placeholder
    return 0.65; // 65% response rate
  }

  private extractTopThemes(comments: string[]): { compliments: string[]; complaints: string[] } {
    // Simple theme extraction - in production, this would use NLP
    const compliments = ['fast response', 'helpful agent', 'quick resolution'];
    const complaints = ['slow response', 'unhelpful', 'not resolved'];
    
    return { compliments, complaints };
  }

  private extractKeywords(comments: string[]): Array<{ word: string; count: number; sentiment: number }> {
    // Simple keyword extraction - in production, this would use NLP
    return [
      { word: 'fast', count: 15, sentiment: 0.8 },
      { word: 'helpful', count: 12, sentiment: 0.9 },
      { word: 'slow', count: 8, sentiment: -0.6 }
    ];
  }

  private extractThemes(comments: string[]): Array<{ theme: string; count: number; sentiment: number }> {
    return [
      { theme: 'Response Time', count: 25, sentiment: 0.2 },
      { theme: 'Agent Helpfulness', count: 18, sentiment: 0.7 },
      { theme: 'Problem Resolution', count: 22, sentiment: 0.1 }
    ];
  }

  private identifyImprovementAreas(comments: string[]): Array<{ area: string; priority: number; mentions: number }> {
    return [
      { area: 'Response Time', priority: 1, mentions: 15 },
      { area: 'Knowledge Base', priority: 2, mentions: 10 },
      { area: 'Agent Training', priority: 3, mentions: 8 }
    ];
  }
}

export const customerSatisfactionService = CustomerSatisfactionService.getInstance();