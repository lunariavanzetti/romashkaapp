import { supabase } from '../../../lib/supabase';
import OpenAI from 'openai';
import { Message, ConversationContext, AIResponse } from '../../openaiService';

export interface ABTest {
  id: string;
  name: string;
  description: string;
  type: 'response_style' | 'personality' | 'conversation_flow' | 'escalation_rules' | 'template_effectiveness';
  status: 'draft' | 'active' | 'completed' | 'paused';
  startDate: Date;
  endDate?: Date;
  targetSampleSize: number;
  currentSampleSize: number;
  variants: ABTestVariant[];
  metrics: ABTestMetrics;
  settings: ABTestSettings;
  results?: ABTestResults;
  createdAt: Date;
  updatedAt: Date;
}

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  weight: number; // Traffic allocation percentage
  config: VariantConfig;
  metrics: VariantMetrics;
  isControl: boolean;
}

export interface VariantConfig {
  responseStyle?: {
    tone: 'professional' | 'friendly' | 'casual' | 'formal' | 'empathetic';
    verbosity: 'concise' | 'detailed' | 'balanced';
    personality: 'helpful' | 'knowledgeable' | 'enthusiastic' | 'calm' | 'proactive';
  };
  conversationFlow?: {
    escalationThreshold: number;
    maxTurns: number;
    clarificationStrategy: 'immediate' | 'after_failure' | 'proactive';
  };
  templateSettings?: {
    useTemplates: boolean;
    templatePriority: 'high' | 'medium' | 'low';
    customization: 'none' | 'light' | 'heavy';
  };
  modelParameters?: {
    temperature: number;
    maxTokens: number;
    presencePenalty: number;
    frequencyPenalty: number;
  };
}

export interface VariantMetrics {
  conversationCount: number;
  averageRating: number;
  completionRate: number;
  escalationRate: number;
  averageResponseTime: number;
  customerSatisfaction: number;
  resolutionRate: number;
  engagementScore: number;
}

export interface ABTestMetrics {
  totalConversations: number;
  significance: number;
  confidenceLevel: number;
  pValue: number;
  effectSize: number;
  winningVariant?: string;
  recommendations: string[];
}

export interface ABTestSettings {
  minimumSampleSize: number;
  confidenceLevel: number;
  significanceThreshold: number;
  maxDuration: number; // in days
  exclusionRules: string[];
  inclusionRules: string[];
}

export interface ABTestResults {
  winningVariant: string;
  significanceAchieved: boolean;
  improvementPercent: number;
  keyInsights: string[];
  recommendations: string[];
  detailedAnalysis: Record<string, any>;
}

export interface ConversationAssignment {
  conversationId: string;
  testId: string;
  variantId: string;
  assignedAt: Date;
  completed: boolean;
  results?: ConversationResult;
}

export interface ConversationResult {
  duration: number;
  messageCount: number;
  satisfaction: number;
  escalated: boolean;
  resolved: boolean;
  engagementScore: number;
  metadata: Record<string, any>;
}

export class ABTestingEngine {
  private static instance: ABTestingEngine;
  private openai: OpenAI;
  private activeTests: Map<string, ABTest> = new Map();
  private assignments: Map<string, ConversationAssignment> = new Map();

  private constructor() {
    this.openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY!,
    });
  }

  static getInstance(): ABTestingEngine {
    if (!ABTestingEngine.instance) {
      ABTestingEngine.instance = new ABTestingEngine();
    }
    return ABTestingEngine.instance;
  }

  /**
   * Create a new A/B test
   */
  async createTest(testConfig: Partial<ABTest>): Promise<ABTest> {
    const test: ABTest = {
      id: crypto.randomUUID(),
      name: testConfig.name || 'New A/B Test',
      description: testConfig.description || '',
      type: testConfig.type || 'response_style',
      status: 'draft',
      startDate: testConfig.startDate || new Date(),
      targetSampleSize: testConfig.targetSampleSize || 1000,
      currentSampleSize: 0,
      variants: testConfig.variants || [],
      metrics: {
        totalConversations: 0,
        significance: 0,
        confidenceLevel: 0.95,
        pValue: 1,
        effectSize: 0,
        recommendations: [],
      },
      settings: {
        minimumSampleSize: 100,
        confidenceLevel: 0.95,
        significanceThreshold: 0.05,
        maxDuration: 30,
        exclusionRules: [],
        inclusionRules: [],
        ...testConfig.settings,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store in database
    await supabase
      .from('ab_tests')
      .insert({
        id: test.id,
        name: test.name,
        description: test.description,
        type: test.type,
        status: test.status,
        start_date: test.startDate.toISOString(),
        end_date: test.endDate?.toISOString(),
        target_sample_size: test.targetSampleSize,
        current_sample_size: test.currentSampleSize,
        variants: test.variants,
        metrics: test.metrics,
        settings: test.settings,
        created_at: test.createdAt.toISOString(),
        updated_at: test.updatedAt.toISOString(),
      });

    return test;
  }

  /**
   * Start an A/B test
   */
  async startTest(testId: string): Promise<void> {
    const test = await this.getTest(testId);
    if (!test) throw new Error('Test not found');

    // Validate test configuration
    await this.validateTestConfiguration(test);

    // Update test status
    test.status = 'active';
    test.startDate = new Date();
    test.updatedAt = new Date();

    // Store in memory for quick access
    this.activeTests.set(testId, test);

    // Update database
    await supabase
      .from('ab_tests')
      .update({
        status: 'active',
        start_date: test.startDate.toISOString(),
        updated_at: test.updatedAt.toISOString(),
      })
      .eq('id', testId);
  }

  /**
   * Assign conversation to test variant
   */
  async assignConversation(conversationId: string, context: ConversationContext): Promise<ConversationAssignment | null> {
    // Find applicable active tests
    const applicableTests = Array.from(this.activeTests.values()).filter(test => 
      this.isConversationEligible(test, context)
    );

    if (applicableTests.length === 0) return null;

    // Select test (priority to oldest test needing samples)
    const selectedTest = applicableTests.reduce((oldest, current) => 
      current.startDate < oldest.startDate ? current : oldest
    );

    // Select variant based on weights
    const selectedVariant = this.selectVariant(selectedTest);

    const assignment: ConversationAssignment = {
      conversationId,
      testId: selectedTest.id,
      variantId: selectedVariant.id,
      assignedAt: new Date(),
      completed: false,
    };

    // Store assignment
    this.assignments.set(conversationId, assignment);

    // Store in database
    await supabase
      .from('conversation_assignments')
      .insert({
        conversation_id: conversationId,
        test_id: selectedTest.id,
        variant_id: selectedVariant.id,
        assigned_at: assignment.assignedAt.toISOString(),
        completed: false,
      });

    return assignment;
  }

  /**
   * Get variant configuration for conversation
   */
  async getVariantConfig(conversationId: string): Promise<VariantConfig | null> {
    const assignment = this.assignments.get(conversationId);
    if (!assignment) return null;

    const test = this.activeTests.get(assignment.testId);
    if (!test) return null;

    const variant = test.variants.find(v => v.id === assignment.variantId);
    return variant?.config || null;
  }

  /**
   * Generate AI response with variant configuration
   */
  async generateVariantResponse(
    message: string,
    context: ConversationContext,
    variantConfig: VariantConfig
  ): Promise<AIResponse> {
    // Modify system prompt based on variant config
    const systemPrompt = this.buildVariantSystemPrompt(variantConfig);
    
    // Apply model parameters from variant
    const modelParams = {
      temperature: variantConfig.modelParameters?.temperature || 0.7,
      max_tokens: variantConfig.modelParameters?.maxTokens || 500,
      presence_penalty: variantConfig.modelParameters?.presencePenalty || 0,
      frequency_penalty: variantConfig.modelParameters?.frequencyPenalty || 0,
    };

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        ...modelParams,
      });

      const aiResponse: AIResponse = {
        message: response.choices[0].message.content || '',
        confidence: 0.8, // Calculate based on response quality
        intent: context.intent,
        sentiment: context.sentiment,
        language: context.language,
        processingTime: 500, // Mock processing time
        tokensUsed: response.usage?.total_tokens || 0,
        knowledgeSources: [], // Extract from knowledge retrieval
      };

      return aiResponse;
    } catch (error) {
      console.error('Error generating variant response:', error);
      throw error;
    }
  }

  /**
   * Record conversation completion
   */
  async recordConversationCompletion(
    conversationId: string,
    result: ConversationResult
  ): Promise<void> {
    const assignment = this.assignments.get(conversationId);
    if (!assignment) return;

    // Update assignment
    assignment.completed = true;
    assignment.results = result;

    // Update test metrics
    await this.updateTestMetrics(assignment.testId, assignment.variantId, result);

    // Store results in database
    await supabase
      .from('conversation_assignments')
      .update({
        completed: true,
        results: result,
        completed_at: new Date().toISOString(),
      })
      .eq('conversation_id', conversationId);

    // Check if test should be concluded
    await this.checkTestCompletion(assignment.testId);
  }

  /**
   * Get test results and analysis
   */
  async getTestResults(testId: string): Promise<ABTestResults | null> {
    const test = await this.getTest(testId);
    if (!test) return null;

    // Calculate statistical significance
    const significance = await this.calculateStatisticalSignificance(test);
    
    // Determine winning variant
    const winningVariant = this.determineWinningVariant(test);
    
    // Generate insights and recommendations
    const insights = await this.generateTestInsights(test);
    
    const results: ABTestResults = {
      winningVariant: winningVariant.name,
      significanceAchieved: significance.pValue < test.settings.significanceThreshold,
      improvementPercent: significance.improvementPercent,
      keyInsights: insights.keyInsights,
      recommendations: insights.recommendations,
      detailedAnalysis: {
        variants: test.variants.map(v => ({
          name: v.name,
          metrics: v.metrics,
          performance: this.calculateVariantPerformance(v),
        })),
        statisticalAnalysis: significance,
      },
    };

    return results;
  }

  /**
   * Get all active tests
   */
  async getActiveTests(): Promise<ABTest[]> {
    return Array.from(this.activeTests.values());
  }

  /**
   * Stop a test
   */
  async stopTest(testId: string): Promise<void> {
    const test = this.activeTests.get(testId);
    if (!test) throw new Error('Test not found');

    test.status = 'completed';
    test.endDate = new Date();
    test.updatedAt = new Date();

    // Generate final results
    test.results = await this.getTestResults(testId);

    // Update database
    await supabase
      .from('ab_tests')
      .update({
        status: 'completed',
        end_date: test.endDate.toISOString(),
        updated_at: test.updatedAt.toISOString(),
        results: test.results,
      })
      .eq('id', testId);

    // Remove from active tests
    this.activeTests.delete(testId);
  }

  /**
   * Create pre-defined test templates
   */
  async createResponseStyleTest(): Promise<ABTest> {
    const variants: ABTestVariant[] = [
      {
        id: crypto.randomUUID(),
        name: 'Professional Style',
        description: 'Formal, professional tone',
        weight: 50,
        isControl: true,
        config: {
          responseStyle: {
            tone: 'professional',
            verbosity: 'balanced',
            personality: 'helpful',
          },
        },
        metrics: {
          conversationCount: 0,
          averageRating: 0,
          completionRate: 0,
          escalationRate: 0,
          averageResponseTime: 0,
          customerSatisfaction: 0,
          resolutionRate: 0,
          engagementScore: 0,
        },
      },
      {
        id: crypto.randomUUID(),
        name: 'Friendly Style',
        description: 'Warm, friendly tone',
        weight: 50,
        isControl: false,
        config: {
          responseStyle: {
            tone: 'friendly',
            verbosity: 'balanced',
            personality: 'enthusiastic',
          },
        },
        metrics: {
          conversationCount: 0,
          averageRating: 0,
          completionRate: 0,
          escalationRate: 0,
          averageResponseTime: 0,
          customerSatisfaction: 0,
          resolutionRate: 0,
          engagementScore: 0,
        },
      },
    ];

    return this.createTest({
      name: 'Response Style Test',
      description: 'Test different response styles for customer satisfaction',
      type: 'response_style',
      variants,
      targetSampleSize: 500,
    });
  }

  /**
   * Create personality configuration test
   */
  async createPersonalityTest(): Promise<ABTest> {
    const variants: ABTestVariant[] = [
      {
        id: crypto.randomUUID(),
        name: 'Helpful Assistant',
        description: 'Focused on being helpful and supportive',
        weight: 33,
        isControl: true,
        config: {
          responseStyle: {
            tone: 'professional',
            verbosity: 'balanced',
            personality: 'helpful',
          },
        },
        metrics: {
          conversationCount: 0,
          averageRating: 0,
          completionRate: 0,
          escalationRate: 0,
          averageResponseTime: 0,
          customerSatisfaction: 0,
          resolutionRate: 0,
          engagementScore: 0,
        },
      },
      {
        id: crypto.randomUUID(),
        name: 'Knowledgeable Expert',
        description: 'Emphasizes expertise and knowledge',
        weight: 33,
        isControl: false,
        config: {
          responseStyle: {
            tone: 'professional',
            verbosity: 'detailed',
            personality: 'knowledgeable',
          },
        },
        metrics: {
          conversationCount: 0,
          averageRating: 0,
          completionRate: 0,
          escalationRate: 0,
          averageResponseTime: 0,
          customerSatisfaction: 0,
          resolutionRate: 0,
          engagementScore: 0,
        },
      },
      {
        id: crypto.randomUUID(),
        name: 'Proactive Guide',
        description: 'Takes initiative and guides conversations',
        weight: 34,
        isControl: false,
        config: {
          responseStyle: {
            tone: 'friendly',
            verbosity: 'balanced',
            personality: 'proactive',
          },
        },
        metrics: {
          conversationCount: 0,
          averageRating: 0,
          completionRate: 0,
          escalationRate: 0,
          averageResponseTime: 0,
          customerSatisfaction: 0,
          resolutionRate: 0,
          engagementScore: 0,
        },
      },
    ];

    return this.createTest({
      name: 'AI Personality Test',
      description: 'Test different AI personalities for engagement',
      type: 'personality',
      variants,
      targetSampleSize: 750,
    });
  }

  // Private helper methods

  private async getTest(testId: string): Promise<ABTest | null> {
    // Check memory first
    if (this.activeTests.has(testId)) {
      return this.activeTests.get(testId)!;
    }

    // Query database
    const { data, error } = await supabase
      .from('ab_tests')
      .select('*')
      .eq('id', testId)
      .single();

    if (error || !data) return null;

    const test: ABTest = {
      id: data.id,
      name: data.name,
      description: data.description,
      type: data.type,
      status: data.status,
      startDate: new Date(data.start_date),
      endDate: data.end_date ? new Date(data.end_date) : undefined,
      targetSampleSize: data.target_sample_size,
      currentSampleSize: data.current_sample_size,
      variants: data.variants,
      metrics: data.metrics,
      settings: data.settings,
      results: data.results,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    return test;
  }

  private async validateTestConfiguration(test: ABTest): Promise<void> {
    // Validate variants
    if (test.variants.length < 2) {
      throw new Error('Test must have at least 2 variants');
    }

    // Validate weights sum to 100
    const totalWeight = test.variants.reduce((sum, v) => sum + v.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.1) {
      throw new Error('Variant weights must sum to 100%');
    }

    // Validate control variant exists
    const hasControl = test.variants.some(v => v.isControl);
    if (!hasControl) {
      throw new Error('Test must have a control variant');
    }
  }

  private isConversationEligible(test: ABTest, context: ConversationContext): boolean {
    // Check if conversation meets inclusion rules
    // This is a simplified version - real implementation would be more complex
    return true;
  }

  private selectVariant(test: ABTest): ABTestVariant {
    // Simple weighted random selection
    const random = Math.random() * 100;
    let cumulativeWeight = 0;

    for (const variant of test.variants) {
      cumulativeWeight += variant.weight;
      if (random <= cumulativeWeight) {
        return variant;
      }
    }

    // Fallback to first variant
    return test.variants[0];
  }

  private buildVariantSystemPrompt(config: VariantConfig): string {
    let prompt = 'You are a helpful AI assistant. ';

    if (config.responseStyle) {
      const { tone, verbosity, personality } = config.responseStyle;
      
      // Add tone instructions
      switch (tone) {
        case 'professional':
          prompt += 'Maintain a professional and business-appropriate tone. ';
          break;
        case 'friendly':
          prompt += 'Use a warm, friendly, and approachable tone. ';
          break;
        case 'casual':
          prompt += 'Keep the conversation casual and relaxed. ';
          break;
        case 'formal':
          prompt += 'Use formal language and structure. ';
          break;
        case 'empathetic':
          prompt += 'Show empathy and understanding in your responses. ';
          break;
      }

      // Add verbosity instructions
      switch (verbosity) {
        case 'concise':
          prompt += 'Keep responses brief and to the point. ';
          break;
        case 'detailed':
          prompt += 'Provide comprehensive and detailed responses. ';
          break;
        case 'balanced':
          prompt += 'Balance brevity with completeness. ';
          break;
      }

      // Add personality instructions
      switch (personality) {
        case 'helpful':
          prompt += 'Focus on being as helpful as possible. ';
          break;
        case 'knowledgeable':
          prompt += 'Demonstrate expertise and knowledge. ';
          break;
        case 'enthusiastic':
          prompt += 'Show enthusiasm and positivity. ';
          break;
        case 'calm':
          prompt += 'Maintain a calm and composed demeanor. ';
          break;
        case 'proactive':
          prompt += 'Take initiative and guide the conversation. ';
          break;
      }
    }

    return prompt;
  }

  private async updateTestMetrics(testId: string, variantId: string, result: ConversationResult): Promise<void> {
    const test = this.activeTests.get(testId);
    if (!test) return;

    const variant = test.variants.find(v => v.id === variantId);
    if (!variant) return;

    // Update variant metrics
    variant.metrics.conversationCount++;
    variant.metrics.averageRating = this.updateAverage(
      variant.metrics.averageRating,
      result.satisfaction,
      variant.metrics.conversationCount
    );
    variant.metrics.completionRate = this.updateAverage(
      variant.metrics.completionRate,
      result.resolved ? 1 : 0,
      variant.metrics.conversationCount
    );
    variant.metrics.escalationRate = this.updateAverage(
      variant.metrics.escalationRate,
      result.escalated ? 1 : 0,
      variant.metrics.conversationCount
    );
    variant.metrics.averageResponseTime = this.updateAverage(
      variant.metrics.averageResponseTime,
      result.duration,
      variant.metrics.conversationCount
    );
    variant.metrics.customerSatisfaction = variant.metrics.averageRating;
    variant.metrics.resolutionRate = variant.metrics.completionRate;
    variant.metrics.engagementScore = this.updateAverage(
      variant.metrics.engagementScore,
      result.engagementScore,
      variant.metrics.conversationCount
    );

    // Update test metrics
    test.currentSampleSize++;
    test.metrics.totalConversations++;
    test.updatedAt = new Date();

    // Store updated metrics
    await supabase
      .from('ab_tests')
      .update({
        current_sample_size: test.currentSampleSize,
        metrics: test.metrics,
        variants: test.variants,
        updated_at: test.updatedAt.toISOString(),
      })
      .eq('id', testId);
  }

  private updateAverage(currentAvg: number, newValue: number, count: number): number {
    return ((currentAvg * (count - 1)) + newValue) / count;
  }

  private async checkTestCompletion(testId: string): Promise<void> {
    const test = this.activeTests.get(testId);
    if (!test) return;

    // Check if target sample size reached
    if (test.currentSampleSize >= test.targetSampleSize) {
      await this.stopTest(testId);
      return;
    }

    // Check if statistical significance achieved
    const significance = await this.calculateStatisticalSignificance(test);
    if (significance.pValue < test.settings.significanceThreshold) {
      await this.stopTest(testId);
      return;
    }

    // Check if maximum duration reached
    const daysSinceStart = (Date.now() - test.startDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceStart >= test.settings.maxDuration) {
      await this.stopTest(testId);
    }
  }

  private async calculateStatisticalSignificance(test: ABTest): Promise<{
    pValue: number;
    improvementPercent: number;
    significance: number;
  }> {
    // Simplified statistical significance calculation
    // In a real implementation, you'd use proper statistical tests
    
    const controlVariant = test.variants.find(v => v.isControl);
    if (!controlVariant) return { pValue: 1, improvementPercent: 0, significance: 0 };

    const testVariants = test.variants.filter(v => !v.isControl);
    
    let bestImprovement = 0;
    let bestPValue = 1;

    for (const variant of testVariants) {
      const improvement = ((variant.metrics.averageRating - controlVariant.metrics.averageRating) / controlVariant.metrics.averageRating) * 100;
      
      // Simplified p-value calculation (normally would use proper statistical tests)
      const sampleSize = Math.min(variant.metrics.conversationCount, controlVariant.metrics.conversationCount);
      const pValue = sampleSize > 30 ? Math.max(0.001, 1 - (sampleSize / 100)) : 1;

      if (improvement > bestImprovement) {
        bestImprovement = improvement;
        bestPValue = pValue;
      }
    }

    return {
      pValue: bestPValue,
      improvementPercent: bestImprovement,
      significance: bestPValue < 0.05 ? 1 : 0,
    };
  }

  private determineWinningVariant(test: ABTest): ABTestVariant {
    return test.variants.reduce((best, current) => 
      current.metrics.averageRating > best.metrics.averageRating ? current : best
    );
  }

  private async generateTestInsights(test: ABTest): Promise<{
    keyInsights: string[];
    recommendations: string[];
  }> {
    const insights: string[] = [];
    const recommendations: string[] = [];

    // Analyze performance differences
    const bestVariant = this.determineWinningVariant(test);
    const controlVariant = test.variants.find(v => v.isControl);

    if (controlVariant && bestVariant.id !== controlVariant.id) {
      const improvement = ((bestVariant.metrics.averageRating - controlVariant.metrics.averageRating) / controlVariant.metrics.averageRating) * 100;
      insights.push(`${bestVariant.name} performed ${improvement.toFixed(1)}% better than the control`);
      recommendations.push(`Consider implementing ${bestVariant.name} configuration`);
    }

    // Analyze escalation rates
    const avgEscalationRate = test.variants.reduce((sum, v) => sum + v.metrics.escalationRate, 0) / test.variants.length;
    const lowestEscalation = test.variants.reduce((best, current) => 
      current.metrics.escalationRate < best.metrics.escalationRate ? current : best
    );

    if (lowestEscalation.metrics.escalationRate < avgEscalationRate * 0.8) {
      insights.push(`${lowestEscalation.name} had significantly lower escalation rate (${(lowestEscalation.metrics.escalationRate * 100).toFixed(1)}%)`);
      recommendations.push('Focus on configuration elements that reduce escalation');
    }

    return { keyInsights: insights, recommendations };
  }

  private calculateVariantPerformance(variant: ABTestVariant): Record<string, number> {
    return {
      overallScore: (
        variant.metrics.averageRating * 0.3 +
        variant.metrics.completionRate * 0.25 +
        variant.metrics.customerSatisfaction * 0.25 +
        (1 - variant.metrics.escalationRate) * 0.2
      ),
      satisfactionScore: variant.metrics.customerSatisfaction,
      efficiencyScore: variant.metrics.completionRate,
      engagementScore: variant.metrics.engagementScore,
    };
  }
}

export const abTestingEngine = ABTestingEngine.getInstance();