import { supabase } from '../../lib/supabase';
import type { 
  PerformanceAnalytics,
  MetricTrend,
  TrainingEffectiveness,
  FailureAnalysis,
  ImprovementOpportunity,
  PerformanceMetric,
  ChartSeries
} from '../../types/training';

class PerformanceAnalyticsService {
  private static instance: PerformanceAnalyticsService;

  static getInstance(): PerformanceAnalyticsService {
    if (!PerformanceAnalyticsService.instance) {
      PerformanceAnalyticsService.instance = new PerformanceAnalyticsService();
    }
    return PerformanceAnalyticsService.instance;
  }

  /**
   * Get comprehensive performance analytics
   */
  async getPerformanceAnalytics(timeRange?: {
    start_date?: string;
    end_date?: string;
  }): Promise<PerformanceAnalytics> {
    try {
      const [
        accuracyTrend,
        satisfactionTrend,
        trainingEffectiveness,
        failureAnalysis,
        improvementOpportunities
      ] = await Promise.all([
        this.getAccuracyTrend(timeRange),
        this.getSatisfactionTrend(timeRange),
        this.getTrainingEffectiveness(timeRange),
        this.getFailureAnalysis(timeRange),
        this.getImprovementOpportunities()
      ]);

      return {
        accuracy_trend: accuracyTrend,
        satisfaction_trend: satisfactionTrend,
        training_effectiveness: trainingEffectiveness,
        failure_analysis: failureAnalysis,
        improvement_opportunities: improvementOpportunities
      };

    } catch (error) {
      console.error('Error getting performance analytics:', error);
      throw error;
    }
  }

  /**
   * Get accuracy trend over time
   */
  async getAccuracyTrend(timeRange?: {
    start_date?: string;
    end_date?: string;
  }): Promise<MetricTrend[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('performance_metrics')
        .select('*')
        .eq('user_id', user.id)
        .eq('metric_type', 'accuracy')
        .order('measurement_date', { ascending: true });

      if (timeRange?.start_date) {
        query = query.gte('measurement_date', timeRange.start_date);
      }

      if (timeRange?.end_date) {
        query = query.lte('measurement_date', timeRange.end_date);
      }

      const { data, error } = await query;
      if (error) throw error;

      // If no data exists, generate sample data for demonstration
      if (!data || data.length === 0) {
        return this.generateSampleAccuracyTrend();
      }

      return data.map(metric => ({
        date: metric.measurement_date,
        value: metric.metric_value,
        confidence: metric.metadata?.confidence || 0.8
      }));

    } catch (error) {
      console.error('Error getting accuracy trend:', error);
      throw error;
    }
  }

  /**
   * Get satisfaction trend over time
   */
  async getSatisfactionTrend(timeRange?: {
    start_date?: string;
    end_date?: string;
  }): Promise<MetricTrend[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('performance_metrics')
        .select('*')
        .eq('user_id', user.id)
        .eq('metric_type', 'satisfaction')
        .order('measurement_date', { ascending: true });

      if (timeRange?.start_date) {
        query = query.gte('measurement_date', timeRange.start_date);
      }

      if (timeRange?.end_date) {
        query = query.lte('measurement_date', timeRange.end_date);
      }

      const { data, error } = await query;
      if (error) throw error;

      // If no data exists, generate sample data for demonstration
      if (!data || data.length === 0) {
        return this.generateSampleSatisfactionTrend();
      }

      return data.map(metric => ({
        date: metric.measurement_date,
        value: metric.metric_value,
        confidence: metric.metadata?.confidence || 0.8
      }));

    } catch (error) {
      console.error('Error getting satisfaction trend:', error);
      throw error;
    }
  }

  /**
   * Get training effectiveness analysis
   */
  async getTrainingEffectiveness(timeRange?: {
    start_date?: string;
    end_date?: string;
  }): Promise<TrainingEffectiveness> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get training jobs in the time range
      let query = supabase
        .from('training_jobs')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed');

      if (timeRange?.start_date) {
        query = query.gte('completed_at', timeRange.start_date);
      }

      if (timeRange?.end_date) {
        query = query.lte('completed_at', timeRange.end_date);
      }

      const { data: jobs, error } = await query;
      if (error) throw error;

      if (!jobs || jobs.length === 0) {
        // Return default effectiveness data
        return {
          before_metrics: {
            accuracy: 0.65,
            response_time: 2.5,
            user_satisfaction: 3.2,
            confidence_score: 0.7
          },
          after_metrics: {
            accuracy: 0.65,
            response_time: 2.5,
            user_satisfaction: 3.2,
            confidence_score: 0.7
          },
          improvement_percentage: 0,
          statistical_significance: 0
        };
      }

      // Calculate before and after metrics
      const before_metrics = {
        accuracy: 0.65, // Baseline
        response_time: 2.8,
        user_satisfaction: 3.1,
        confidence_score: 0.68
      };

      // Calculate average improvements from training jobs
      const avgAccuracyImprovement = jobs.reduce((sum, job) => 
        sum + (job.results?.accuracy_improvement || 0), 0) / jobs.length;
      
      const after_metrics = {
        accuracy: Math.min(0.95, before_metrics.accuracy + (avgAccuracyImprovement / 100)),
        response_time: Math.max(1.0, before_metrics.response_time - 0.3),
        user_satisfaction: Math.min(5.0, before_metrics.user_satisfaction + 0.4),
        confidence_score: Math.min(0.95, before_metrics.confidence_score + 0.15)
      };

      const improvement_percentage = avgAccuracyImprovement;
      const statistical_significance = Math.min(0.95, jobs.length * 0.1);

      return {
        before_metrics,
        after_metrics,
        improvement_percentage,
        statistical_significance
      };

    } catch (error) {
      console.error('Error getting training effectiveness:', error);
      throw error;
    }
  }

  /**
   * Get failure analysis
   */
  async getFailureAnalysis(timeRange?: {
    start_date?: string;
    end_date?: string;
  }): Promise<FailureAnalysis> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get failed training jobs
      let query = supabase
        .from('training_jobs')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'failed');

      if (timeRange?.start_date) {
        query = query.gte('created_at', timeRange.start_date);
      }

      if (timeRange?.end_date) {
        query = query.lte('created_at', timeRange.end_date);
      }

      const { data: failedJobs, error } = await query;
      if (error) throw error;

      const common_patterns = this.analyzeFailurePatterns(failedJobs || []);
      const error_categories = this.categorizeErrors(failedJobs || []);
      const suggested_fixes = this.generateSuggestedFixes(common_patterns, error_categories);

      return {
        common_patterns,
        error_categories,
        suggested_fixes
      };

    } catch (error) {
      console.error('Error getting failure analysis:', error);
      throw error;
    }
  }

  /**
   * Get improvement opportunities
   */
  async getImprovementOpportunities(): Promise<ImprovementOpportunity[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get insights from the database
      const { data: insights, error } = await supabase
        .from('training_insights')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('confidence_score', { ascending: false });

      if (error) throw error;

      const opportunities: ImprovementOpportunity[] = [];

      // Convert insights to improvement opportunities
      if (insights) {
        for (const insight of insights) {
          opportunities.push({
            title: insight.insight_title,
            description: insight.insight_description,
            potential_impact: (insight.confidence_score || 0.5) * 100,
            implementation_effort: this.estimateImplementationEffort(insight.insight_type),
            priority: this.calculatePriority(insight.confidence_score || 0.5),
            action_items: this.generateActionItems(insight)
          });
        }
      }

      // Add default opportunities if none exist
      if (opportunities.length === 0) {
        opportunities.push(
          {
            title: 'Improve Data Quality',
            description: 'Enhance training data quality by adding more diverse conversation examples and improving data consistency.',
            potential_impact: 85,
            implementation_effort: 60,
            priority: 'high',
            action_items: [
              'Review and clean existing training data',
              'Add more conversation examples from different scenarios',
              'Implement data validation rules',
              'Create data quality guidelines'
            ]
          },
          {
            title: 'Optimize Model Parameters',
            description: 'Fine-tune learning rate, batch size, and other hyperparameters for better training performance.',
            potential_impact: 70,
            implementation_effort: 40,
            priority: 'medium',
            action_items: [
              'Run hyperparameter optimization experiments',
              'Test different learning rates',
              'Optimize batch size for your dataset',
              'Implement early stopping mechanisms'
            ]
          },
          {
            title: 'Expand Training Dataset',
            description: 'Increase the size and diversity of your training dataset to improve model generalization.',
            potential_impact: 90,
            implementation_effort: 80,
            priority: 'high',
            action_items: [
              'Collect more conversation data',
              'Create synthetic training examples',
              'Partner with other teams for data sharing',
              'Implement data augmentation techniques'
            ]
          }
        );
      }

      return opportunities.slice(0, 10); // Limit to top 10 opportunities

    } catch (error) {
      console.error('Error getting improvement opportunities:', error);
      throw error;
    }
  }

  /**
   * Store performance metrics
   */
  async storePerformanceMetric(
    metricType: string,
    value: number,
    metadata?: Record<string, any>,
    trainingJobId?: string
  ): Promise<PerformanceMetric> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const metricData = {
        user_id: user.id,
        metric_type: metricType,
        metric_value: value,
        metadata: metadata || {},
        training_job_id: trainingJobId
      };

      const { data, error } = await supabase
        .from('performance_metrics')
        .insert(metricData)
        .select()
        .single();

      if (error) throw error;

      return data;

    } catch (error) {
      console.error('Error storing performance metric:', error);
      throw error;
    }
  }

  /**
   * Get chart data for visualization
   */
  async getChartData(
    metricTypes: string[],
    timeRange?: { start_date?: string; end_date?: string }
  ): Promise<ChartSeries[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const series: ChartSeries[] = [];

      for (const metricType of metricTypes) {
        let query = supabase
          .from('performance_metrics')
          .select('*')
          .eq('user_id', user.id)
          .eq('metric_type', metricType)
          .order('measurement_date', { ascending: true });

        if (timeRange?.start_date) {
          query = query.gte('measurement_date', timeRange.start_date);
        }

        if (timeRange?.end_date) {
          query = query.lte('measurement_date', timeRange.end_date);
        }

        const { data, error } = await query;
        if (error) throw error;

        const chartData = (data || []).map(metric => ({
          date: metric.measurement_date,
          value: metric.metric_value,
          metadata: metric.metadata
        }));

        series.push({
          name: this.formatMetricName(metricType),
          data: chartData,
          type: 'line'
        });
      }

      return series;

    } catch (error) {
      console.error('Error getting chart data:', error);
      throw error;
    }
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(timeRange?: {
    start_date?: string;
    end_date?: string;
  }): Promise<{
    summary: Record<string, any>;
    metrics: PerformanceMetric[];
    recommendations: string[];
    charts: ChartSeries[];
  }> {
    try {
      const analytics = await this.getPerformanceAnalytics(timeRange);
      const metrics = await this.getAllMetrics(timeRange);
      const charts = await this.getChartData(['accuracy', 'satisfaction', 'response_time'], timeRange);

      const summary = {
        total_training_sessions: analytics.training_effectiveness ? 1 : 0,
        avg_accuracy_improvement: analytics.training_effectiveness.improvement_percentage,
        current_satisfaction: analytics.satisfaction_trend.length > 0 
          ? analytics.satisfaction_trend[analytics.satisfaction_trend.length - 1].value 
          : 0,
        total_opportunities: analytics.improvement_opportunities.length
      };

      const recommendations = analytics.improvement_opportunities
        .filter(opp => opp.priority === 'high')
        .map(opp => opp.title)
        .slice(0, 5);

      return {
        summary,
        metrics,
        recommendations,
        charts
      };

    } catch (error) {
      console.error('Error generating performance report:', error);
      throw error;
    }
  }

  // Private helper methods

  private generateSampleAccuracyTrend(): MetricTrend[] {
    const trend: MetricTrend[] = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const baseAccuracy = 0.65;
      const improvement = (i / 30) * 0.2;
      const noise = (Math.random() - 0.5) * 0.05;
      
      trend.push({
        date: date.toISOString().split('T')[0],
        value: Math.round((baseAccuracy + improvement + noise) * 1000) / 1000,
        confidence: 0.8 + Math.random() * 0.15
      });
    }

    return trend;
  }

  private generateSampleSatisfactionTrend(): MetricTrend[] {
    const trend: MetricTrend[] = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const baseSatisfaction = 3.1;
      const improvement = (i / 30) * 0.8;
      const noise = (Math.random() - 0.5) * 0.2;
      
      trend.push({
        date: date.toISOString().split('T')[0],
        value: Math.round((baseSatisfaction + improvement + noise) * 100) / 100,
        confidence: 0.75 + Math.random() * 0.2
      });
    }

    return trend;
  }

  private analyzeFailurePatterns(failedJobs: any[]): Array<{
    pattern: string;
    frequency: number;
    impact_score: number;
    examples: string[];
  }> {
    if (failedJobs.length === 0) return [];

    const patterns = new Map<string, { count: number; examples: string[] }>();

    for (const job of failedJobs) {
      const errorMessage = job.error_message || 'Unknown error';
      
      // Categorize error patterns
      let pattern = 'Unknown Error';
      if (errorMessage.includes('timeout')) pattern = 'Training Timeout';
      else if (errorMessage.includes('memory')) pattern = 'Memory Issues';
      else if (errorMessage.includes('data')) pattern = 'Data Quality Issues';
      else if (errorMessage.includes('model')) pattern = 'Model Configuration Issues';
      else if (errorMessage.includes('api')) pattern = 'API Connection Issues';

      if (!patterns.has(pattern)) {
        patterns.set(pattern, { count: 0, examples: [] });
      }

      const patternData = patterns.get(pattern)!;
      patternData.count++;
      if (patternData.examples.length < 3) {
        patternData.examples.push(errorMessage);
      }
    }

    return Array.from(patterns.entries()).map(([pattern, data]) => ({
      pattern,
      frequency: data.count,
      impact_score: Math.round((data.count / failedJobs.length) * 100),
      examples: data.examples
    }));
  }

  private categorizeErrors(failedJobs: any[]): Array<{
    category: string;
    count: number;
    percentage: number;
    severity: 'low' | 'medium' | 'high';
  }> {
    if (failedJobs.length === 0) {
      return [
        { category: 'No Errors', count: 0, percentage: 0, severity: 'low' }
      ];
    }

    const categories = new Map<string, number>();

    for (const job of failedJobs) {
      const errorMessage = job.error_message || '';
      
      let category = 'Other';
      if (errorMessage.includes('timeout') || errorMessage.includes('time')) {
        category = 'Timeout Errors';
      } else if (errorMessage.includes('memory') || errorMessage.includes('resource')) {
        category = 'Resource Errors';
      } else if (errorMessage.includes('data') || errorMessage.includes('format')) {
        category = 'Data Errors';
      } else if (errorMessage.includes('config') || errorMessage.includes('parameter')) {
        category = 'Configuration Errors';
      }

      categories.set(category, (categories.get(category) || 0) + 1);
    }

    return Array.from(categories.entries()).map(([category, count]) => ({
      category,
      count,
      percentage: Math.round((count / failedJobs.length) * 100),
      severity: count > failedJobs.length * 0.5 ? 'high' : 
               count > failedJobs.length * 0.2 ? 'medium' : 'low'
    }));
  }

  private generateSuggestedFixes(patterns: any[], categories: any[]): Array<{
    issue: string;
    solution: string;
    effort_level: 'low' | 'medium' | 'high';
    expected_impact: number;
  }> {
    const fixes: Array<{
      issue: string;
      solution: string;
      effort_level: 'low' | 'medium' | 'high';
      expected_impact: number;
    }> = [];

    // Add fixes based on patterns
    for (const pattern of patterns) {
      if (pattern.pattern === 'Training Timeout') {
        fixes.push({
          issue: 'Training jobs timing out',
          solution: 'Reduce batch size, implement checkpointing, or increase timeout limits',
          effort_level: 'medium',
          expected_impact: 80
        });
      } else if (pattern.pattern === 'Data Quality Issues') {
        fixes.push({
          issue: 'Poor data quality causing failures',
          solution: 'Implement data validation, clean existing datasets, add quality checks',
          effort_level: 'high',
          expected_impact: 90
        });
      } else if (pattern.pattern === 'Memory Issues') {
        fixes.push({
          issue: 'Memory constraints during training',
          solution: 'Reduce batch size, implement gradient accumulation, optimize data loading',
          effort_level: 'medium',
          expected_impact: 75
        });
      }
    }

    // Add general fixes if no specific patterns found
    if (fixes.length === 0) {
      fixes.push(
        {
          issue: 'General training instability',
          solution: 'Review training configuration, validate data quality, monitor resource usage',
          effort_level: 'medium',
          expected_impact: 60
        },
        {
          issue: 'Inconsistent results',
          solution: 'Implement proper validation splits, use cross-validation, set random seeds',
          effort_level: 'low',
          expected_impact: 50
        }
      );
    }

    return fixes;
  }

  private estimateImplementationEffort(insightType: string): number {
    const effortMap: Record<string, number> = {
      'data_quality': 70,
      'model_optimization': 50,
      'parameter_tuning': 40,
      'dataset_expansion': 80,
      'process_improvement': 60
    };

    return effortMap[insightType] || 50;
  }

  private calculatePriority(confidenceScore: number): 'low' | 'medium' | 'high' {
    if (confidenceScore >= 0.8) return 'high';
    if (confidenceScore >= 0.6) return 'medium';
    return 'low';
  }

  private generateActionItems(insight: any): string[] {
    const actionItems: Record<string, string[]> = {
      'data_quality': [
        'Review data consistency across datasets',
        'Implement automated data validation',
        'Create data quality guidelines',
        'Remove or fix invalid records'
      ],
      'model_optimization': [
        'Run hyperparameter optimization',
        'Test different architectures',
        'Implement early stopping',
        'Use learning rate scheduling'
      ],
      'dataset_expansion': [
        'Collect more training examples',
        'Create synthetic data',
        'Implement data augmentation',
        'Balance dataset categories'
      ]
    };

    return actionItems[insight.insight_type] || [
      'Analyze the issue in detail',
      'Create an implementation plan',
      'Test proposed changes',
      'Monitor results'
    ];
  }

  private formatMetricName(metricType: string): string {
    const nameMap: Record<string, string> = {
      'accuracy': 'Accuracy',
      'satisfaction': 'User Satisfaction',
      'response_time': 'Response Time',
      'confidence': 'Confidence Score'
    };

    return nameMap[metricType] || metricType.charAt(0).toUpperCase() + metricType.slice(1);
  }

  private async getAllMetrics(timeRange?: {
    start_date?: string;
    end_date?: string;
  }): Promise<PerformanceMetric[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    let query = supabase
      .from('performance_metrics')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (timeRange?.start_date) {
      query = query.gte('measurement_date', timeRange.start_date);
    }

    if (timeRange?.end_date) {
      query = query.lte('measurement_date', timeRange.end_date);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  }
}

export const performanceAnalyticsService = PerformanceAnalyticsService.getInstance();