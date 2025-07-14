export interface LeadScoringCriteria {
  id: string;
  name: string;
  weight: number; // 0-100 points
  type: 'range' | 'boolean' | 'category' | 'text';
  options?: Array<{
    value: string | number;
    label: string;
    points: number;
  }>;
}

export interface LeadScore {
  id: string;
  customer_id: string;
  conversation_id?: string;
  total_score: number;
  max_possible_score: number;
  score_percentage: number;
  criteria_scores: Record<string, number>;
  score_breakdown: Array<{
    criteria_id: string;
    criteria_name: string;
    points_earned: number;
    max_points: number;
    value: any;
  }>;
  routing_decision: 'immediate_consultation' | 'nurture_sequence' | 'resource_sharing' | 'manual_review';
  created_at: string;
  updated_at: string;
}

export interface LeadScoringRule {
  id: string;
  name: string;
  criteria: LeadScoringCriteria[];
  routing_rules: Array<{
    min_score: number;
    max_score: number;
    action: 'immediate_consultation' | 'nurture_sequence' | 'resource_sharing' | 'manual_review';
    description: string;
  }>;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeadScoringConfig {
  rules: LeadScoringRule[];
  default_criteria: LeadScoringCriteria[];
  scoring_settings: {
    auto_score_enabled: boolean;
    require_manual_review: boolean;
    score_threshold_consultation: number;
    score_threshold_nurture: number;
    score_expiry_days: number;
  };
}

// Predefined scoring criteria templates
export const DEFAULT_LEAD_SCORING_CRITERIA: LeadScoringCriteria[] = [
  {
    id: 'budget',
    name: 'Monthly Budget',
    weight: 25,
    type: 'range',
    options: [
      { value: 10000, label: '$10K+ per month', points: 25 },
      { value: 5000, label: '$5K-$10K per month', points: 20 },
      { value: 2000, label: '$2K-$5K per month', points: 15 },
      { value: 500, label: '$500-$2K per month', points: 10 },
      { value: 0, label: 'Under $500 per month', points: 5 },
    ]
  },
  {
    id: 'company_size',
    name: 'Company Size',
    weight: 20,
    type: 'category',
    options: [
      { value: '500+', label: '500+ employees', points: 20 },
      { value: '100-500', label: '100-500 employees', points: 18 },
      { value: '50-100', label: '50-100 employees', points: 15 },
      { value: '10-50', label: '10-50 employees', points: 12 },
      { value: '1-10', label: '1-10 employees', points: 8 },
      { value: 'freelancer', label: 'Freelancer/Solo', points: 5 },
    ]
  },
  {
    id: 'timeline',
    name: 'Implementation Timeline',
    weight: 15,
    type: 'category',
    options: [
      { value: 'immediate', label: 'Ready to start immediately', points: 15 },
      { value: '1_month', label: 'Within 1 month', points: 12 },
      { value: '3_months', label: 'Within 3 months', points: 10 },
      { value: '6_months', label: 'Within 6 months', points: 7 },
      { value: '12_months', label: 'Within 12 months', points: 5 },
      { value: 'exploring', label: 'Just exploring options', points: 2 },
    ]
  },
  {
    id: 'decision_maker',
    name: 'Decision Making Authority',
    weight: 20,
    type: 'category',
    options: [
      { value: 'ceo', label: 'CEO/Founder', points: 20 },
      { value: 'cto', label: 'CTO/Technical Leader', points: 18 },
      { value: 'marketing_director', label: 'Marketing Director', points: 16 },
      { value: 'manager', label: 'Department Manager', points: 12 },
      { value: 'team_lead', label: 'Team Lead', points: 8 },
      { value: 'employee', label: 'Employee/Contributor', points: 4 },
    ]
  },
  {
    id: 'pain_points',
    name: 'Current Challenges',
    weight: 15,
    type: 'category',
    options: [
      { value: 'customer_support', label: 'Customer support overwhelmed', points: 15 },
      { value: 'response_time', label: 'Slow response times', points: 13 },
      { value: 'scaling_issues', label: 'Scaling customer service', points: 12 },
      { value: 'cost_reduction', label: 'Need to reduce costs', points: 10 },
      { value: 'automation', label: 'Want to automate processes', points: 11 },
      { value: 'integration', label: 'Need better integrations', points: 9 },
      { value: 'analytics', label: 'Lack of analytics/insights', points: 8 },
      { value: 'no_issues', label: 'No specific issues', points: 3 },
    ]
  },
  {
    id: 'industry',
    name: 'Industry Type',
    weight: 5,
    type: 'category',
    options: [
      { value: 'saas', label: 'SaaS/Technology', points: 5 },
      { value: 'ecommerce', label: 'E-commerce/Retail', points: 5 },
      { value: 'healthcare', label: 'Healthcare', points: 4 },
      { value: 'finance', label: 'Finance/Banking', points: 4 },
      { value: 'education', label: 'Education', points: 4 },
      { value: 'consulting', label: 'Consulting/Services', points: 4 },
      { value: 'manufacturing', label: 'Manufacturing', points: 3 },
      { value: 'other', label: 'Other', points: 2 },
    ]
  }
];

export const DEFAULT_ROUTING_RULES = [
  {
    min_score: 70,
    max_score: 100,
    action: 'immediate_consultation' as const,
    description: 'High-value lead - Book consultation immediately'
  },
  {
    min_score: 40,
    max_score: 69,
    action: 'nurture_sequence' as const,
    description: 'Medium-value lead - Enter nurture workflow'
  },
  {
    min_score: 20,
    max_score: 39,
    action: 'resource_sharing' as const,
    description: 'Low-value lead - Share resources and self-service options'
  },
  {
    min_score: 0,
    max_score: 19,
    action: 'manual_review' as const,
    description: 'Very low score - Manual review required'
  }
];