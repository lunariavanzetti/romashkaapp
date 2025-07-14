import { supabase } from '../../supabaseClient';
import { openaiService } from '../../openaiService';
import { analyticsEngine } from '../../analytics/analyticsEngine';

export interface ABTest {
  id: string;
  name: string;
  description: string;
  type: 'response_style' | 'personality' | 'conversation_flow' | 'template' | 'escalation_rule';
  status: 'draft' | 'active' | 'paused' | 'completed';
  startDate: Date;
  endDate: Date;
  variants: ABTestVariant[];
  metrics: string[];
  hypothesis: string;
  successCriteria: string;
  confidenceLevel: number;
  sampleSize: number;
  trafficAllocation: number;
  channels: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  config: any;
  trafficPercentage: number;
  isControl: boolean;
  metrics: ABTestMetrics;
}

export interface ABTestMetrics {
  conversions: number;
  interactions: number;
  avgResponseTime: number;
  customerSatisfaction: number;
  resolutionRate: number;
  escalationRate: number;
  conversionRate: number;
  confidence: number;
}

export interface ABTestResult {
  testId: string;
  duration: number;
  totalInteractions: number;
  winner: string;
  confidence: number;
  improvements: Record<string, number>;
  insights: string[];
  recommendation: string;
  statisticalSignificance: boolean;
  variants: ABTestVariant[];
}

export interface PersonalityConfig {
  name: string;
  tone: 'professional' | 'friendly' | 'casual' | 'empathetic' | 'authoritative';
  formality: 'formal' | 'informal' | 'neutral';
  responseLength: 'concise' | 'detailed' | 'balanced';
  emoticons: boolean;
  personalizations: boolean;
  proactiveOffers: boolean;
  escalationEagerness: 'low' | 'medium' | 'high';
}

export interface ConversationFlowConfig {
  name: string;
  greetingStyle: 'immediate' | 'warm' | 'professional' | 'casual';
  questionGathering: 'sequential' | 'batched' | 'adaptive';
  resolutionApproach: 'direct' | 'consultative' | 'collaborative';
  followUpPattern: 'none' | 'immediate' | 'scheduled';
  escalationTriggers: string[];
  maxTurns: number;
}

export class ABTestingEngine {
  private static instance: ABTestingEngine;
  private activeTests: Map<string, ABTest> = new Map();

  private constructor() {}

  static getInstance(): ABTestingEngine {
    if (!ABTestingEngine.instance) {
      ABTestingEngine.instance = new ABTestingEngine();
    }
    return ABTestingEngine.instance;
  }

  /**
   * Create and start an A/B test
   */
  async createTest(testConfig: Partial<ABTest>): Promise<ABTest> {
    try {
      const test: ABTest = {
        id: crypto.randomUUID(),
        name: testConfig.name || 'Unnamed Test',
        description: testConfig.description || '',
        type: testConfig.type || 'response_style',
        status: 'draft',
        startDate: testConfig.startDate || new Date(),
        endDate: testConfig.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        variants: testConfig.variants || [],
        metrics: testConfig.metrics || ['conversion_rate', 'customer_satisfaction'],
        hypothesis: testConfig.hypothesis || '',
        successCriteria: testConfig.successCriteria || '',
        confidenceLevel: testConfig.confidenceLevel || 0.95,
        sampleSize: testConfig.sampleSize || 1000,
        trafficAllocation: testConfig.trafficAllocation || 0.1,
        channels: testConfig.channels || ['web', 'whatsapp'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store test in database
      await supabase
        .from('ab_tests')
        .insert({
          id: test.id,
          name: test.name,
          description: test.description,
          type: test.type,
          status: test.status,
          start_date: test.startDate.toISOString(),
          end_date: test.endDate.toISOString(),
          variants: test.variants,
          metrics: test.metrics,
          hypothesis: test.hypothesis,
          success_criteria: test.successCriteria,
          confidence_level: test.confidenceLevel,
          sample_size: test.sampleSize,
          traffic_allocation: test.trafficAllocation,
          channels: test.channels,
          created_at: test.createdAt.toISOString(),
          updated_at: test.updatedAt.toISOString()
        });

      return test;
    } catch (error) {
      console.error('Error creating A/B test:', error);
      throw error;
    }
  }

  /**
   * Create personality test
   */
  async createPersonalityTest(
    name: string,
    personalities: PersonalityConfig[],
    channels: string[] = ['web', 'whatsapp']
  ): Promise<ABTest> {
    const variants: ABTestVariant[] = personalities.map((personality, index) => ({
      id: crypto.randomUUID(),
      name: personality.name,
      description: `Testing ${personality.name} personality`,
      config: personality,
      trafficPercentage: 100 / personalities.length,
      isControl: index === 0,
      metrics: {
        conversions: 0,
        interactions: 0,
        avgResponseTime: 0,
        customerSatisfaction: 0,
        resolutionRate: 0,
        escalationRate: 0,
        conversionRate: 0,
        confidence: 0
      }
    }));

    return this.createTest({
      name,
      description: `Testing different AI personalities: ${personalities.map(p => p.name).join(', ')}`,
      type: 'personality',
      variants,
      metrics: ['customer_satisfaction', 'resolution_rate', 'escalation_rate'],
      hypothesis: 'Different AI personalities will impact customer satisfaction and resolution rates',
      successCriteria: 'Increase customer satisfaction by 10% and reduce escalation rate by 5%',
      channels
    });
  }

  /**
   * Create conversation flow test
   */
  async createConversationFlowTest(
    name: string,
    flows: ConversationFlowConfig[],
    channels: string[] = ['web', 'whatsapp']
  ): Promise<ABTest> {
    const variants: ABTestVariant[] = flows.map((flow, index) => ({
      id: crypto.randomUUID(),
      name: flow.name,
      description: `Testing ${flow.name} conversation flow`,
      config: flow,
      trafficPercentage: 100 / flows.length,
      isControl: index === 0,
      metrics: {
        conversions: 0,
        interactions: 0,
        avgResponseTime: 0,
        customerSatisfaction: 0,
        resolutionRate: 0,
        escalationRate: 0,
        conversionRate: 0,
        confidence: 0
      }
    }));

    return this.createTest({
      name,
      description: `Testing different conversation flows: ${flows.map(f => f.name).join(', ')}`,
      type: 'conversation_flow',
      variants,
      metrics: ['resolution_rate', 'avg_response_time', 'customer_satisfaction'],
      hypothesis: 'Different conversation flows will impact resolution efficiency and customer satisfaction',
      successCriteria: 'Reduce response time by 15% and increase resolution rate by 8%',
      channels
    });
  }

  /**
   * Create template effectiveness test
   */
  async createTemplateTest(
    name: string,
    templates: any[],
    channels: string[] = ['web', 'whatsapp']
  ): Promise<ABTest> {
    const variants: ABTestVariant[] = templates.map((template, index) => ({
      id: crypto.randomUUID(),
      name: template.name,
      description: `Testing ${template.name} template`,
      config: template,
      trafficPercentage: 100 / templates.length,
      isControl: index === 0,
      metrics: {
        conversions: 0,
        interactions: 0,
        avgResponseTime: 0,
        customerSatisfaction: 0,
        resolutionRate: 0,
        escalationRate: 0,
        conversionRate: 0,
        confidence: 0
      }
    }));

    return this.createTest({
      name,
      description: `Testing different response templates: ${templates.map(t => t.name).join(', ')}`,
      type: 'template',
      variants,
      metrics: ['conversion_rate', 'customer_satisfaction', 'resolution_rate'],
      hypothesis: 'Different response templates will impact conversion and satisfaction rates',
      successCriteria: 'Increase conversion rate by 12% and maintain satisfaction above 4.0',
      channels
    });
  }

  /**
   * Start an A/B test
   */
  async startTest(testId: string): Promise<void> {
    try {
      const { data: testData, error } = await supabase
        .from('ab_tests')
        .select('*')
        .eq('id', testId)
        .single();

      if (error) throw error;

      const test = testData as ABTest;
      test.status = 'active';
      test.updatedAt = new Date();

      // Update database
      await supabase
        .from('ab_tests')
        .update({
          status: 'active',
          updated_at: test.updatedAt.toISOString()
        })
        .eq('id', testId);

      // Add to active tests
      this.activeTests.set(testId, test);

      console.log(`Started A/B test: ${test.name}`);
    } catch (error) {
      console.error('Error starting A/B test:', error);
      throw error;
    }
  }

  /**
   * Get variant for conversation
   */
  async getVariantForConversation(conversationId: string, channel: string): Promise<ABTestVariant | null> {
    try {
      // Get active tests for this channel
      const { data: activeTests, error } = await supabase
        .from('ab_tests')
        .select('*')
        .eq('status', 'active')
        .contains('channels', [channel]);

      if (error) throw error;

      if (!activeTests || activeTests.length === 0) return null;

      // Select test based on traffic allocation
      const eligibleTests = activeTests.filter(test => Math.random() < test.traffic_allocation);
      
      if (eligibleTests.length === 0) return null;

      // Select random test
      const selectedTest = eligibleTests[Math.floor(Math.random() * eligibleTests.length)];
      
      // Select variant based on traffic percentage
      const random = Math.random() * 100;
      let cumulative = 0;
      
      for (const variant of selectedTest.variants) {
        cumulative += variant.trafficPercentage;
        if (random <= cumulative) {
          // Record participation
          await this.recordParticipation(conversationId, selectedTest.id, variant.id);
          return variant;
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting variant for conversation:', error);
      return null;
    }
  }

  /**
   * Record test participation
   */
  private async recordParticipation(conversationId: string, testId: string, variantId: string): Promise<void> {
    try {
      await supabase
        .from('ab_test_participations')
        .insert({
          conversation_id: conversationId,
          test_id: testId,
          variant_id: variantId,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error recording participation:', error);
    }
  }

  /**
   * Record test outcome
   */
  async recordOutcome(
    conversationId: string,
    metrics: {
      converted: boolean;
      responseTime: number;
      satisfaction: number;
      resolved: boolean;
      escalated: boolean;
    }
  ): Promise<void> {
    try {
      // Get test participation
      const { data: participation, error } = await supabase
        .from('ab_test_participations')
        .select('*')
        .eq('conversation_id', conversationId)
        .single();

      if (error || !participation) return;

      // Record outcome
      await supabase
        .from('ab_test_outcomes')
        .insert({
          conversation_id: conversationId,
          test_id: participation.test_id,
          variant_id: participation.variant_id,
          converted: metrics.converted,
          response_time: metrics.responseTime,
          satisfaction: metrics.satisfaction,
          resolved: metrics.resolved,
          escalated: metrics.escalated,
          created_at: new Date().toISOString()
        });

      // Update variant metrics
      await this.updateVariantMetrics(participation.test_id, participation.variant_id, metrics);

    } catch (error) {
      console.error('Error recording outcome:', error);
    }
  }

  /**
   * Update variant metrics
   */
  private async updateVariantMetrics(testId: string, variantId: string, metrics: any): Promise<void> {
    try {
      // Get current metrics
      const { data: outcomes, error } = await supabase
        .from('ab_test_outcomes')
        .select('*')
        .eq('test_id', testId)
        .eq('variant_id', variantId);

      if (error) throw error;

      // Calculate updated metrics
      const totalInteractions = outcomes?.length || 0;
      const conversions = outcomes?.filter(o => o.converted).length || 0;
      const avgResponseTime = outcomes?.reduce((sum, o) => sum + o.response_time, 0) / totalInteractions || 0;
      const avgSatisfaction = outcomes?.reduce((sum, o) => sum + o.satisfaction, 0) / totalInteractions || 0;
      const resolutionRate = outcomes?.filter(o => o.resolved).length / totalInteractions || 0;
      const escalationRate = outcomes?.filter(o => o.escalated).length / totalInteractions || 0;
      const conversionRate = conversions / totalInteractions || 0;

      // Update test variant
      await supabase
        .from('ab_tests')
        .update({
          variants: supabase.rpc('update_variant_metrics', {
            test_id: testId,
            variant_id: variantId,
            metrics: {
              conversions,
              interactions: totalInteractions,
              avgResponseTime,
              customerSatisfaction: avgSatisfaction,
              resolutionRate,
              escalationRate,
              conversionRate,
              confidence: this.calculateConfidence(totalInteractions, conversions)
            }
          })
        })
        .eq('id', testId);

    } catch (error) {
      console.error('Error updating variant metrics:', error);
    }
  }

  /**
   * Analyze test results
   */
  async analyzeTestResults(testId: string): Promise<ABTestResult> {
    try {
      const { data: test, error } = await supabase
        .from('ab_tests')
        .select('*')
        .eq('id', testId)
        .single();

      if (error) throw error;

      const { data: outcomes, error: outcomesError } = await supabase
        .from('ab_test_outcomes')
        .select('*')
        .eq('test_id', testId);

      if (outcomesError) throw outcomesError;

      // Calculate statistical significance
      const { winner, confidence, insights } = await this.calculateStatisticalSignificance(test, outcomes);

      // Generate recommendations
      const recommendation = await this.generateRecommendation(test, outcomes, winner);

      const result: ABTestResult = {
        testId,
        duration: Date.now() - new Date(test.created_at).getTime(),
        totalInteractions: outcomes?.length || 0,
        winner,
        confidence,
        improvements: this.calculateImprovements(test.variants),
        insights,
        recommendation,
        statisticalSignificance: confidence > test.confidence_level,
        variants: test.variants
      };

      // Store results
      await supabase
        .from('ab_test_results')
        .insert({
          test_id: testId,
          results: result,
          created_at: new Date().toISOString()
        });

      return result;
    } catch (error) {
      console.error('Error analyzing test results:', error);
      throw error;
    }
  }

  /**
   * Calculate statistical significance
   */
  private async calculateStatisticalSignificance(test: any, outcomes: any[]): Promise<{
    winner: string;
    confidence: number;
    insights: string[];
  }> {
    try {
      // Group outcomes by variant
      const variantOutcomes = outcomes.reduce((acc, outcome) => {
        if (!acc[outcome.variant_id]) acc[outcome.variant_id] = [];
        acc[outcome.variant_id].push(outcome);
        return acc;
      }, {});

      // Calculate metrics for each variant
      const variantStats = Object.entries(variantOutcomes).map(([variantId, outcomes]: [string, any]) => {
        const variant = test.variants.find((v: any) => v.id === variantId);
        const conversions = outcomes.filter((o: any) => o.converted).length;
        const conversionRate = conversions / outcomes.length;
        const satisfaction = outcomes.reduce((sum: number, o: any) => sum + o.satisfaction, 0) / outcomes.length;
        
        return {
          variantId,
          name: variant?.name || 'Unknown',
          conversions,
          interactions: outcomes.length,
          conversionRate,
          satisfaction,
          isControl: variant?.isControl || false
        };
      });

      // Find winner (highest conversion rate)
      const winner = variantStats.reduce((best, current) => 
        current.conversionRate > best.conversionRate ? current : best
      );

      // Calculate confidence using z-test
      const control = variantStats.find(v => v.isControl);
      const confidence = control ? this.calculateZTestConfidence(control, winner) : 0.95;

      // Generate insights
      const insights = await this.generateInsights(variantStats, test);

      return {
        winner: winner.name,
        confidence,
        insights
      };
    } catch (error) {
      console.error('Error calculating statistical significance:', error);
      return {
        winner: 'Unknown',
        confidence: 0,
        insights: ['Error calculating significance']
      };
    }
  }

  /**
   * Generate recommendation
   */
  private async generateRecommendation(test: any, outcomes: any[], winner: string): Promise<string> {
    try {
      const recommendationPrompt = `
        Based on this A/B test results, provide a recommendation:
        
        Test: ${test.name}
        Type: ${test.type}
        Winner: ${winner}
        Total Interactions: ${outcomes.length}
        
        Variants Performance:
        ${test.variants.map((v: any) => `
          ${v.name}: ${v.metrics.conversionRate}% conversion, ${v.metrics.customerSatisfaction} satisfaction
        `).join('\n')}
        
        Provide specific recommendations for:
        - Whether to implement the winning variant
        - Areas for further optimization
        - Next steps for testing
        
        Be specific and actionable.
      `;

      const recommendation = await openaiService.generateResponse({
        messages: [{ role: 'user', content: recommendationPrompt }],
        temperature: 0.2,
        maxTokens: 500
      });

      return recommendation.content;
    } catch (error) {
      console.error('Error generating recommendation:', error);
      return 'Unable to generate recommendation';
    }
  }

  /**
   * Complete test
   */
  async completeTest(testId: string): Promise<ABTestResult> {
    try {
      // Analyze results
      const results = await this.analyzeTestResults(testId);

      // Update test status
      await supabase
        .from('ab_tests')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', testId);

      // Remove from active tests
      this.activeTests.delete(testId);

      return results;
    } catch (error) {
      console.error('Error completing test:', error);
      throw error;
    }
  }

  /**
   * Get active tests
   */
  async getActiveTests(): Promise<ABTest[]> {
    try {
      const { data: tests, error } = await supabase
        .from('ab_tests')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return tests || [];
    } catch (error) {
      console.error('Error getting active tests:', error);
      return [];
    }
  }

  /**
   * Get test results
   */
  async getTestResults(testId: string): Promise<ABTestResult | null> {
    try {
      const { data: result, error } = await supabase
        .from('ab_test_results')
        .select('*')
        .eq('test_id', testId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      return result?.results || null;
    } catch (error) {
      console.error('Error getting test results:', error);
      return null;
    }
  }

  private calculateConfidence(interactions: number, conversions: number): number {
    if (interactions === 0) return 0;
    const p = conversions / interactions;
    const z = 1.96; // 95% confidence interval
    const margin = z * Math.sqrt((p * (1 - p)) / interactions);
    return Math.max(0, Math.min(1, 1 - margin)) * 100;
  }

  private calculateZTestConfidence(control: any, variant: any): number {
    const p1 = control.conversionRate;
    const p2 = variant.conversionRate;
    const n1 = control.interactions;
    const n2 = variant.interactions;
    
    const pooledP = (control.conversions + variant.conversions) / (n1 + n2);
    const se = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2));
    const z = Math.abs(p1 - p2) / se;
    
    // Convert z-score to confidence level
    return Math.min(0.999, 1 - 2 * (1 - this.normalCDF(z)));
  }

  private normalCDF(x: number): number {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  private erf(x: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  private calculateImprovements(variants: ABTestVariant[]): Record<string, number> {
    const control = variants.find(v => v.isControl);
    if (!control) return {};

    const improvements: Record<string, number> = {};
    
    variants.forEach(variant => {
      if (!variant.isControl) {
        improvements[variant.name] = {
          conversionRate: ((variant.metrics.conversionRate - control.metrics.conversionRate) / control.metrics.conversionRate) * 100,
          satisfaction: ((variant.metrics.customerSatisfaction - control.metrics.customerSatisfaction) / control.metrics.customerSatisfaction) * 100,
          resolutionRate: ((variant.metrics.resolutionRate - control.metrics.resolutionRate) / control.metrics.resolutionRate) * 100
        };
      }
    });

    return improvements;
  }

  private async generateInsights(variantStats: any[], test: any): Promise<string[]> {
    const insights: string[] = [];

    // Performance insights
    const bestPerforming = variantStats.reduce((best, current) => 
      current.conversionRate > best.conversionRate ? current : best
    );
    insights.push(`Best performing variant: ${bestPerforming.name} with ${(bestPerforming.conversionRate * 100).toFixed(2)}% conversion rate`);

    // Satisfaction insights
    const highestSatisfaction = variantStats.reduce((best, current) => 
      current.satisfaction > best.satisfaction ? current : best
    );
    insights.push(`Highest satisfaction: ${highestSatisfaction.name} with ${highestSatisfaction.satisfaction.toFixed(2)} rating`);

    // Statistical significance
    const control = variantStats.find(v => v.isControl);
    if (control && bestPerforming.variantId !== control.variantId) {
      const improvement = ((bestPerforming.conversionRate - control.conversionRate) / control.conversionRate) * 100;
      insights.push(`${improvement.toFixed(2)}% improvement over control`);
    }

    return insights;
  }
}

export const abTestingEngine = ABTestingEngine.getInstance();