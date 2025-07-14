import { supabase } from '../../lib/supabase';
import {
  LeadScore,
  LeadScoringCriteria,
  LeadScoringRule,
  LeadScoringConfig,
  DEFAULT_LEAD_SCORING_CRITERIA,
  DEFAULT_ROUTING_RULES
} from '../../types/leadScoring';

export class LeadScoringEngine {
  private static instance: LeadScoringEngine;
  private config: LeadScoringConfig | null = null;

  private constructor() {}

  static getInstance(): LeadScoringEngine {
    if (!LeadScoringEngine.instance) {
      LeadScoringEngine.instance = new LeadScoringEngine();
    }
    return LeadScoringEngine.instance;
  }

  /**
   * Initialize lead scoring configuration
   */
  async initialize(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Load existing config or create default
      const { data: existingConfig } = await supabase
        .from('lead_scoring_config')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingConfig) {
        this.config = existingConfig.config;
      } else {
        // Create default configuration
        this.config = {
          rules: [{
            id: 'default_rule',
            name: 'Default Lead Scoring Rule',
            criteria: DEFAULT_LEAD_SCORING_CRITERIA,
            routing_rules: DEFAULT_ROUTING_RULES,
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }],
          default_criteria: DEFAULT_LEAD_SCORING_CRITERIA,
          scoring_settings: {
            auto_score_enabled: true,
            require_manual_review: false,
            score_threshold_consultation: 70,
            score_threshold_nurture: 40,
            score_expiry_days: 30
          }
        };

        // Save default config to database
        await this.saveConfiguration();
      }
    } catch (error) {
      console.error('Error initializing lead scoring engine:', error);
      throw error;
    }
  }

  /**
   * Score a lead based on collected information
   */
  async scoreLeadFromConversation(
    customerId: string,
    conversationId: string,
    leadData: Record<string, any>
  ): Promise<LeadScore> {
    if (!this.config) {
      await this.initialize();
    }

    const activeRule = this.config!.rules.find(rule => rule.active);
    if (!activeRule) {
      throw new Error('No active scoring rule found');
    }

    const score = this.calculateScore(activeRule.criteria, leadData);
    const routing = this.determineRouting(score.total_score, activeRule.routing_rules);

    const leadScore: LeadScore = {
      id: crypto.randomUUID(),
      customer_id: customerId,
      conversation_id: conversationId,
      total_score: score.total_score,
      max_possible_score: score.max_possible_score,
      score_percentage: Math.round((score.total_score / score.max_possible_score) * 100),
      criteria_scores: score.criteria_scores,
      score_breakdown: score.breakdown,
      routing_decision: routing,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Save to database
    await this.saveLeadScore(leadScore);

    return leadScore;
  }

  /**
   * Calculate score based on criteria and lead data
   */
  private calculateScore(criteria: LeadScoringCriteria[], leadData: Record<string, any>) {
    let totalScore = 0;
    let maxPossibleScore = 0;
    const criteriaScores: Record<string, number> = {};
    const breakdown: Array<{
      criteria_id: string;
      criteria_name: string;
      points_earned: number;
      max_points: number;
      value: any;
    }> = [];

    for (const criterion of criteria) {
      const value = leadData[criterion.id];
      let points = 0;
      const maxPoints = criterion.weight;

      if (value !== undefined && criterion.options) {
        // Find matching option
        const option = criterion.options.find(opt => {
          if (criterion.type === 'range') {
            return typeof value === 'number' && value >= (opt.value as number);
          }
          return opt.value === value;
        });

        if (option) {
          // Scale points based on criterion weight
          points = Math.round((option.points / 100) * criterion.weight);
        }
      }

      totalScore += points;
      maxPossibleScore += maxPoints;
      criteriaScores[criterion.id] = points;

      breakdown.push({
        criteria_id: criterion.id,
        criteria_name: criterion.name,
        points_earned: points,
        max_points: maxPoints,
        value: value
      });
    }

    return {
      total_score: totalScore,
      max_possible_score: maxPossibleScore,
      criteria_scores: criteriaScores,
      breakdown: breakdown
    };
  }

  /**
   * Determine routing decision based on score
   */
  private determineRouting(score: number, routingRules: any[]): LeadScore['routing_decision'] {
    for (const rule of routingRules) {
      if (score >= rule.min_score && score <= rule.max_score) {
        return rule.action;
      }
    }
    return 'manual_review';
  }

  /**
   * Get lead scoring questions for AI to ask
   */
  getQualificationQuestions(): Array<{
    id: string;
    question: string;
    type: string;
    options?: Array<{ value: any; label: string }>;
  }> {
    if (!this.config) return [];

    const activeRule = this.config.rules.find(rule => rule.active);
    if (!activeRule) return [];

    return activeRule.criteria.map(criterion => ({
      id: criterion.id,
      question: this.generateQuestionText(criterion),
      type: criterion.type,
      options: criterion.options?.map(opt => ({
        value: opt.value,
        label: opt.label
      }))
    }));
  }

  /**
   * Generate natural question text for criteria
   */
  private generateQuestionText(criterion: LeadScoringCriteria): string {
    const questionMap: Record<string, string> = {
      budget: "What's your monthly budget for customer service solutions?",
      company_size: "How many employees does your company have?",
      timeline: "What's your timeline for implementing a new customer service solution?",
      decision_maker: "What's your role in the decision-making process?",
      pain_points: "What are your biggest customer service challenges right now?",
      industry: "What industry is your company in?"
    };

    return questionMap[criterion.id] || `Please provide information about: ${criterion.name}`;
  }

  /**
   * Save lead score to database
   */
  private async saveLeadScore(leadScore: LeadScore): Promise<void> {
    const { error } = await supabase
      .from('lead_scores')
      .upsert(leadScore);

    if (error) {
      console.error('Error saving lead score:', error);
      throw error;
    }
  }

  /**
   * Save configuration to database
   */
  async saveConfiguration(): Promise<void> {
    if (!this.config) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('lead_scoring_config')
      .upsert({
        user_id: user.id,
        config: this.config,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving lead scoring config:', error);
      throw error;
    }
  }

  /**
   * Get lead scores for analytics
   */
  async getLeadScores(filters?: {
    start_date?: string;
    end_date?: string;
    min_score?: number;
    max_score?: number;
  }): Promise<LeadScore[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    let query = supabase
      .from('lead_scores')
      .select('*')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });

    if (filters?.start_date) {
      query = query.gte('created_at', filters.start_date);
    }
    if (filters?.end_date) {
      query = query.lte('created_at', filters.end_date);
    }
    if (filters?.min_score) {
      query = query.gte('total_score', filters.min_score);
    }
    if (filters?.max_score) {
      query = query.lte('total_score', filters.max_score);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching lead scores:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Update scoring configuration
   */
  async updateConfiguration(newConfig: LeadScoringConfig): Promise<void> {
    this.config = {
      ...newConfig,
      rules: newConfig.rules.map(rule => ({
        ...rule,
        updated_at: new Date().toISOString()
      }))
    };

    await this.saveConfiguration();
  }

  /**
   * Get current configuration
   */
  getConfiguration(): LeadScoringConfig | null {
    return this.config;
  }

  /**
   * Trigger automated actions based on lead score
   */
  async executeRoutingAction(leadScore: LeadScore): Promise<void> {
    switch (leadScore.routing_decision) {
      case 'immediate_consultation':
        await this.triggerConsultationBooking(leadScore);
        break;
      case 'nurture_sequence':
        await this.triggerNurtureSequence(leadScore);
        break;
      case 'resource_sharing':
        await this.triggerResourceSharing(leadScore);
        break;
      case 'manual_review':
        await this.triggerManualReview(leadScore);
        break;
    }
  }

  private async triggerConsultationBooking(leadScore: LeadScore): Promise<void> {
    try {
      // Import consultation booking service dynamically to avoid circular dependencies
      const { consultationBookingService } = await import('../calendar/consultationBookingService');
      
      // Get customer details
      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', leadScore.customer_id)
        .single();

      if (!customer) {
        console.error('Customer not found for lead score:', leadScore.id);
        return;
      }

      // Attempt to book consultation automatically
      await consultationBookingService.bookConsultationFromLeadScore(
        leadScore.id!,
        leadScore.customer_id,
        customer.email,
        customer.name || 'Unknown Customer'
      );

      console.log('Successfully triggered consultation booking for high-value lead:', leadScore.id);
    } catch (error) {
      console.error('Error triggering consultation booking:', error);
      // Fall back to manual review if calendar booking fails
      await this.triggerManualReview(leadScore);
    }
  }

  private async triggerNurtureSequence(leadScore: LeadScore): Promise<void> {
    // Integration with workflow automation system
    console.log('Triggering nurture sequence for medium-value lead:', leadScore.id);
    // TODO: Trigger workflow automation
  }

  private async triggerResourceSharing(leadScore: LeadScore): Promise<void> {
    // Send relevant resources and self-service options
    console.log('Triggering resource sharing for low-value lead:', leadScore.id);
    // TODO: Send automated resources
  }

  private async triggerManualReview(leadScore: LeadScore): Promise<void> {
    // Notify agents for manual review
    console.log('Triggering manual review for very low score lead:', leadScore.id);
    // TODO: Create task for manual review
  }
}

// Export singleton instance
export const leadScoringEngine = LeadScoringEngine.getInstance();