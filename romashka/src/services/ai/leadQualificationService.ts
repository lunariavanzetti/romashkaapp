import { leadScoringEngine } from '../leadScoring/leadScoringEngine';
import { supabase } from '../../lib/supabase';

export interface QualificationQuestion {
  id: string;
  question: string;
  type: 'range' | 'category' | 'boolean' | 'text';
  options?: Array<{ value: any; label: string }>;
  collected?: boolean;
  value?: any;
}

export interface QualificationSession {
  id: string;
  customerId: string;
  conversationId: string;
  questions: QualificationQuestion[];
  currentQuestionIndex: number;
  collectedData: Record<string, any>;
  isComplete: boolean;
  score?: number;
  routingDecision?: string;
}

export class LeadQualificationService {
  private static instance: LeadQualificationService;
  private activeSessions: Map<string, QualificationSession> = new Map();

  private constructor() {}

  static getInstance(): LeadQualificationService {
    if (!LeadQualificationService.instance) {
      LeadQualificationService.instance = new LeadQualificationService();
    }
    return LeadQualificationService.instance;
  }

  /**
   * Start a lead qualification session
   */
  async startQualification(customerId: string, conversationId: string): Promise<QualificationSession> {
    // Initialize lead scoring engine
    await leadScoringEngine.initialize();
    
    // Get qualification questions
    const questions = leadScoringEngine.getQualificationQuestions();
    
    const session: QualificationSession = {
      id: crypto.randomUUID(),
      customerId,
      conversationId,
      questions: questions.map(q => ({
        id: q.id,
        question: q.question,
        type: q.type as any,
        options: q.options,
        collected: false
      })),
      currentQuestionIndex: 0,
      collectedData: {},
      isComplete: false
    };

    this.activeSessions.set(conversationId, session);
    return session;
  }

  /**
   * Get the next qualification question
   */
  getNextQuestion(conversationId: string): QualificationQuestion | null {
    const session = this.activeSessions.get(conversationId);
    if (!session || session.isComplete) return null;

    // Find next uncollected question
    for (let i = session.currentQuestionIndex; i < session.questions.length; i++) {
      if (!session.questions[i].collected) {
        session.currentQuestionIndex = i;
        return session.questions[i];
      }
    }

    return null;
  }

  /**
   * Process answer to a qualification question
   */
  async processAnswer(
    conversationId: string, 
    questionId: string, 
    answer: any
  ): Promise<{
    nextQuestion?: QualificationQuestion;
    isComplete: boolean;
    score?: number;
    routingDecision?: string;
    followUpMessage?: string;
  }> {
    const session = this.activeSessions.get(conversationId);
    if (!session) {
      throw new Error('No active qualification session found');
    }

    // Find and update the question
    const question = session.questions.find(q => q.id === questionId);
    if (!question) {
      throw new Error('Question not found in session');
    }

    // Process and validate the answer
    const processedAnswer = this.processAnswerValue(question, answer);
    
    question.collected = true;
    question.value = processedAnswer;
    session.collectedData[questionId] = processedAnswer;

    // Check if qualification is complete
    const allQuestionsAnswered = session.questions.every(q => q.collected);
    
    if (allQuestionsAnswered) {
      // Calculate lead score
      const leadScore = await leadScoringEngine.scoreLeadFromConversation(
        session.customerId,
        session.conversationId,
        session.collectedData
      );

      session.score = leadScore.total_score;
      session.routingDecision = leadScore.routing_decision;
      session.isComplete = true;

      // Execute routing action
      await leadScoringEngine.executeRoutingAction(leadScore);

      // Generate follow-up message based on routing decision
      const followUpMessage = this.generateFollowUpMessage(leadScore);

      return {
        isComplete: true,
        score: leadScore.total_score,
        routingDecision: leadScore.routing_decision,
        followUpMessage
      };
    } else {
      // Get next question
      const nextQuestion = this.getNextQuestion(conversationId);
      return {
        nextQuestion,
        isComplete: false
      };
    }
  }

  /**
   * Process and validate answer value based on question type
   */
  private processAnswerValue(question: QualificationQuestion, answer: any): any {
    switch (question.type) {
      case 'range':
        const numAnswer = parseInt(answer.toString().replace(/[^\d]/g, ''));
        return isNaN(numAnswer) ? 0 : numAnswer;
      
      case 'category':
        // Try to match the answer to available options
        if (question.options) {
          const matchedOption = question.options.find(opt => 
            opt.label.toLowerCase().includes(answer.toString().toLowerCase()) ||
            opt.value.toString().toLowerCase() === answer.toString().toLowerCase()
          );
          return matchedOption ? matchedOption.value : answer;
        }
        return answer;
      
      case 'boolean':
        const lowerAnswer = answer.toString().toLowerCase();
        return lowerAnswer.includes('yes') || lowerAnswer.includes('true') || lowerAnswer === '1';
      
      case 'text':
      default:
        return answer.toString();
    }
  }

  /**
   * Generate follow-up message based on routing decision
   */
  private generateFollowUpMessage(leadScore: any): string {
    switch (leadScore.routing_decision) {
      case 'immediate_consultation':
        return `Based on your needs, you're an excellent fit for our services! I'd love to schedule a consultation with our team to discuss how we can help you achieve your goals. Are you available for a 30-minute call this week?`;
      
      case 'nurture_sequence':
        return `Thank you for sharing that information! Based on your requirements, I think our solution could be a great fit for your business. Let me share some relevant resources and case studies that might interest you. I'll also follow up with some additional information that could be helpful.`;
      
      case 'resource_sharing':
        return `I appreciate you taking the time to answer those questions! Based on your current situation, I'd recommend starting with our self-service resources and knowledge base. I'll send you some helpful guides and tutorials that can get you started right away.`;
      
      case 'manual_review':
        return `Thank you for providing that information. Let me have one of our specialists review your requirements and get back to you with a personalized recommendation. Someone from our team will reach out within 24 hours.`;
      
      default:
        return `Thank you for answering those questions! Let me review your information and provide you with the best next steps.`;
    }
  }

  /**
   * Check if a conversation needs qualification
   */
  shouldStartQualification(conversationHistory: any[]): boolean {
    // Logic to determine if we should start qualification
    // For example, if customer shows buying intent or asks about pricing
    
    const buyingIntentKeywords = [
      'price', 'cost', 'budget', 'buy', 'purchase', 'plan', 'subscription',
      'demo', 'trial', 'consultation', 'meeting', 'schedule', 'contact sales',
      'enterprise', 'business', 'company', 'team', 'implementation'
    ];

    const recentMessages = conversationHistory.slice(-3);
    const hasIntent = recentMessages.some(msg => 
      buyingIntentKeywords.some(keyword => 
        msg.content?.toLowerCase().includes(keyword)
      )
    );

    return hasIntent;
  }

  /**
   * Get qualification session status
   */
  getSessionStatus(conversationId: string): QualificationSession | null {
    return this.activeSessions.get(conversationId) || null;
  }

  /**
   * End qualification session
   */
  endSession(conversationId: string): void {
    this.activeSessions.delete(conversationId);
  }

  /**
   * Generate natural question text with context
   */
  generateContextualQuestion(question: QualificationQuestion, previousAnswers: Record<string, any>): string {
    const baseQuestion = question.question;
    
    // Add context based on previous answers
    let contextualIntro = '';
    
    if (Object.keys(previousAnswers).length > 0) {
      contextualIntro = "That's helpful to know! ";
    }

    // Make the question more conversational
    const conversationalQuestion = this.makeQuestionConversational(baseQuestion, question.type);
    
    return contextualIntro + conversationalQuestion;
  }

  /**
   * Make questions more conversational and natural
   */
  private makeQuestionConversational(question: string, type: string): string {
    const conversationalPhrases = [
      "I'd love to learn more about",
      "Could you tell me",
      "I'm curious about",
      "To better help you, could you share"
    ];

    const randomPhrase = conversationalPhrases[Math.floor(Math.random() * conversationalPhrases.length)];
    
    // Convert question to more natural form
    const naturalQuestion = question
      .replace(/^What's/, randomPhrase)
      .replace(/^What is/, randomPhrase)
      .replace(/^How many/, `${randomPhrase} how many`)
      .replace(/\?$/, '?');

    return naturalQuestion;
  }

  /**
   * Get qualification analytics
   */
  async getQualificationAnalytics(userId: string, startDate?: string, endDate?: string) {
    const { data, error } = await supabase.rpc('get_lead_scoring_stats', {
      user_uuid: userId,
      start_date: startDate,
      end_date: endDate
    });

    if (error) {
      console.error('Error fetching qualification analytics:', error);
      throw error;
    }

    return data[0] || {};
  }

  /**
   * Get qualification trends
   */
  async getQualificationTrends(userId: string, days: number = 30) {
    const { data, error } = await supabase.rpc('get_lead_scoring_trends', {
      user_uuid: userId,
      days: days
    });

    if (error) {
      console.error('Error fetching qualification trends:', error);
      throw error;
    }

    return data || [];
  }
}

// Export singleton instance
export const leadQualificationService = LeadQualificationService.getInstance();