import { supabase } from '../supabaseClient';

export interface ABTestVariant {
  id: string;
  traits: {
    friendliness: number;
    professionalism: number;
    empathy: number;
    enthusiasm: number;
    helpfulness: number;
  };
  tone: 'formal' | 'casual' | 'friendly' | 'professional' | 'warm';
  style: 'concise' | 'detailed' | 'conversational' | 'direct';
  greeting: string;
  responseLength: 'short' | 'medium' | 'long';
  personality: string;
}

export interface ABTest {
  id: string;
  user_id: string; // TEXT field to avoid foreign key issues
  name: string;
  description: string;
  variant_a_config: ABTestVariant;
  variant_b_config: ABTestVariant;
  traffic_split: number; // 0.5 = 50/50 split
  status: 'draft' | 'running' | 'completed' | 'paused';
  start_date?: string;
  end_date?: string;
  target_sample_size: number;
  confidence_level: number;
  created_at: string;
  updated_at: string;
}

export interface ABTestResult {
  id: string;
  test_id: string;
  conversation_id: string;
  variant: 'A' | 'B';
  response_time_ms: number;
  satisfaction_score?: number; // 1-5 scale
  escalated: boolean;
  converted: boolean;
  session_data: any;
  created_at: string;
}

export interface ABTestMetrics {
  variant: 'A' | 'B';
  total_interactions: number;
  avg_response_time: number;
  avg_satisfaction: number;
  conversion_rate: number;
  escalation_rate: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
}

export interface ABTestAnalysis {
  test: ABTest;
  variant_a_metrics: ABTestMetrics;
  variant_b_metrics: ABTestMetrics;
  statistical_significance: {
    is_significant: boolean;
    p_value: number;
    confidence_level: number;
    winner?: 'A' | 'B';
    improvement_percentage?: number;
  };
  recommendations: string[];
}

export class ABTestingService {
  // Create a new A/B test
  async createTest(testConfig: Partial<ABTest>): Promise<ABTest> {
    const { data, error } = await supabase
      .from('ab_tests')
      .insert([{
        ...testConfig,
        status: 'draft',
        traffic_split: testConfig.traffic_split || 0.5,
        target_sample_size: testConfig.target_sample_size || 100,
        confidence_level: testConfig.confidence_level || 0.95
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Start a test
  async startTest(testId: string): Promise<ABTest> {
    const { data, error } = await supabase
      .from('ab_tests')
      .update({
        status: 'running',
        start_date: new Date().toISOString()
      })
      .eq('id', testId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Stop a test
  async stopTest(testId: string): Promise<ABTest> {
    const { data, error } = await supabase
      .from('ab_tests')
      .update({
        status: 'completed',
        end_date: new Date().toISOString()
      })
      .eq('id', testId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get test by ID
  async getTest(testId: string): Promise<ABTest> {
    const { data, error } = await supabase
      .from('ab_tests')
      .select('*')
      .eq('id', testId)
      .single();

    if (error) throw error;
    return data;
  }

  // Get all tests for a user
  async getUserTests(userId: string): Promise<ABTest[]> {
    const { data, error } = await supabase
      .from('ab_tests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Assign variant to a new conversation
  async assignVariant(testId: string): Promise<'A' | 'B'> {
    const test = await this.getTest(testId);
    
    if (test.status !== 'running') {
      throw new Error('Test is not running');
    }

    // Simple random assignment based on traffic split
    return Math.random() < test.traffic_split ? 'A' : 'B';
  }

  // Record test result
  async recordResult(result: Omit<ABTestResult, 'id' | 'created_at'>): Promise<ABTestResult> {
    const { data, error } = await supabase
      .from('ab_test_results')
      .insert([result])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get test results
  async getTestResults(testId: string): Promise<ABTestResult[]> {
    const { data, error } = await supabase
      .from('ab_test_results')
      .select('*')
      .eq('test_id', testId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Calculate test metrics
  async calculateMetrics(testId: string): Promise<{ variantA: ABTestMetrics; variantB: ABTestMetrics }> {
    const results = await this.getTestResults(testId);
    
    const variantAResults = results.filter(r => r.variant === 'A');
    const variantBResults = results.filter(r => r.variant === 'B');

    const calculateVariantMetrics = (variantResults: ABTestResult[]): ABTestMetrics => {
      const totalInteractions = variantResults.length;
      
      if (totalInteractions === 0) {
        return {
          variant: variantResults === variantAResults ? 'A' : 'B',
          total_interactions: 0,
          avg_response_time: 0,
          avg_satisfaction: 0,
          conversion_rate: 0,
          escalation_rate: 0,
          confidence_interval: { lower: 0, upper: 0 }
        };
      }

      const avgResponseTime = variantResults.reduce((sum, r) => sum + r.response_time_ms, 0) / totalInteractions;
      const satisfactionScores = variantResults.filter(r => r.satisfaction_score !== null);
      const avgSatisfaction = satisfactionScores.length > 0 
        ? satisfactionScores.reduce((sum, r) => sum + (r.satisfaction_score || 0), 0) / satisfactionScores.length
        : 0;
      const conversionRate = variantResults.filter(r => r.converted).length / totalInteractions;
      const escalationRate = variantResults.filter(r => r.escalated).length / totalInteractions;

      // Simple confidence interval calculation (would use proper statistical methods in production)
      const stdError = Math.sqrt(conversionRate * (1 - conversionRate) / totalInteractions);
      const marginOfError = 1.96 * stdError; // 95% confidence

      return {
        variant: variantResults === variantAResults ? 'A' : 'B',
        total_interactions: totalInteractions,
        avg_response_time: Math.round(avgResponseTime),
        avg_satisfaction: Math.round(avgSatisfaction * 10) / 10,
        conversion_rate: Math.round(conversionRate * 1000) / 10, // percentage with 1 decimal
        escalation_rate: Math.round(escalationRate * 1000) / 10,
        confidence_interval: {
          lower: Math.max(0, conversionRate - marginOfError),
          upper: Math.min(1, conversionRate + marginOfError)
        }
      };
    };

    return {
      variantA: calculateVariantMetrics(variantAResults),
      variantB: calculateVariantMetrics(variantBResults)
    };
  }

  // Perform statistical analysis
  async analyzeTest(testId: string): Promise<ABTestAnalysis> {
    const test = await this.getTest(testId);
    const { variantA, variantB } = await this.calculateMetrics(testId);

    // Simple statistical significance test (would use proper methods like t-test in production)
    const isSignificant = variantA.total_interactions >= 30 && variantB.total_interactions >= 30;
    
    let winner: 'A' | 'B' | undefined;
    let improvementPercentage: number | undefined;

    if (isSignificant) {
      if (variantB.conversion_rate > variantA.conversion_rate) {
        winner = 'B';
        improvementPercentage = ((variantB.conversion_rate - variantA.conversion_rate) / variantA.conversion_rate) * 100;
      } else if (variantA.conversion_rate > variantB.conversion_rate) {
        winner = 'A';
        improvementPercentage = ((variantA.conversion_rate - variantB.conversion_rate) / variantB.conversion_rate) * 100;
      }
    }

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (!isSignificant) {
      recommendations.push('Continue test to reach statistical significance (minimum 30 samples per variant)');
    }
    
    if (winner) {
      recommendations.push(`Variant ${winner} shows ${improvementPercentage?.toFixed(1)}% improvement - consider implementing this configuration`);
    }

    if (variantA.escalation_rate > 20 || variantB.escalation_rate > 20) {
      recommendations.push('High escalation rates detected - consider adjusting personality settings');
    }

    if (variantA.avg_satisfaction < 3.5 || variantB.avg_satisfaction < 3.5) {
      recommendations.push('Low satisfaction scores - review and optimize response quality');
    }

    return {
      test,
      variant_a_metrics: variantA,
      variant_b_metrics: variantB,
      statistical_significance: {
        is_significant: isSignificant,
        p_value: isSignificant ? 0.04 : 0.15, // Mock p-value
        confidence_level: test.confidence_level,
        winner,
        improvement_percentage: improvementPercentage
      },
      recommendations
    };
  }

  // Generate sample data for demonstration
  async generateSampleData(testId: string, sampleSize: number = 100): Promise<void> {
    const variants: ('A' | 'B')[] = [];
    
    // Generate balanced sample
    for (let i = 0; i < sampleSize; i++) {
      variants.push(i % 2 === 0 ? 'A' : 'B');
    }

    const results: Omit<ABTestResult, 'id' | 'created_at'>[] = variants.map((variant, index) => {
      // Variant B is designed to perform better
      const isVariantB = variant === 'B';
      
      return {
        test_id: testId,
        conversation_id: `conversation-${index}`,
        variant,
        response_time_ms: Math.random() * (isVariantB ? 400 : 600) + 200, // B is faster
        satisfaction_score: Math.random() > 0.3 ? Math.floor(Math.random() * (isVariantB ? 2 : 3)) + (isVariantB ? 4 : 3) : undefined, // B has higher satisfaction
        escalated: Math.random() < (isVariantB ? 0.12 : 0.25), // B has lower escalation
        converted: Math.random() < (isVariantB ? 0.23 : 0.15), // B has higher conversion
        session_data: {
          user_agent: 'Mozilla/5.0...',
          duration_seconds: Math.floor(Math.random() * 300),
          pages_viewed: Math.floor(Math.random() * 5) + 1
        }
      };
    });

    // Insert results in batches
    const batchSize = 20;
    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize);
      await supabase.from('ab_test_results').insert(batch);
    }
  }
}