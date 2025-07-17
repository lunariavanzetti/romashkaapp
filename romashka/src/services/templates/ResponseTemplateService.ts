/**
 * Response Template Service
 * AI-optimized template system with variables, analytics, and auto-suggestions
 * Phase 2 Implementation - Meeting Lyro.ai standards
 */

import { supabase } from '../supabaseClient';

export interface ResponseTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  content: string;
  variables: TemplateVariable[];
  triggers: TemplateTrigger[];
  performanceScore: number;
  usageCount: number;
  effectivenessScore: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateVariable {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';
  required: boolean;
  defaultValue?: string;
  options?: string[];
  validationRules?: Record<string, any>;
  placeholder?: string;
  description?: string;
  sortOrder: number;
}

export interface TemplateTrigger {
  id: string;
  type: 'keyword' | 'intent' | 'sentiment' | 'context';
  value: string;
  condition: 'contains' | 'equals' | 'starts_with' | 'ends_with' | 'regex';
  confidenceThreshold: number;
  priority: number;
  isActive: boolean;
}

export interface TemplateSuggestion {
  templateId: string;
  templateName: string;
  templateContent: string;
  confidenceScore: number;
  matchReason: string;
  variables: TemplateVariable[];
  estimatedResponseTime: number;
}

export interface TemplateFilter {
  category?: string;
  minEffectiveness?: number;
  isActive?: boolean;
  hasVariables?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface TemplateAnalytics {
  templateId: string;
  usageCount: number;
  successRate: number;
  averageResponseTime: number;
  customerSatisfaction: number;
  conversionRate: number;
  effectivenessScore: number;
  lastUsedAt?: Date;
  performanceTrend: 'improving' | 'declining' | 'stable';
  optimizationSuggestions: string[];
  abTestResults: Record<string, any>;
}

export interface TemplateOptimization {
  id: string;
  templateId: string;
  optimizationType: 'ai_rewrite' | 'a_b_test' | 'performance_tune';
  originalContent: string;
  optimizedContent: string;
  optimizationReason: string;
  expectedImprovement: number;
  actualImprovement?: number;
  testResults: Record<string, any>;
  status: 'pending' | 'testing' | 'approved' | 'rejected';
}

export interface ABTestResult {
  testId: string;
  testName: string;
  variantA: string;
  variantB: string;
  trafficSplit: number;
  winnerVariant?: 'A' | 'B';
  confidenceLevel: number;
  results: {
    variantA: {
      impressions: number;
      conversions: number;
      conversionRate: number;
    };
    variantB: {
      impressions: number;
      conversions: number;
      conversionRate: number;
    };
  };
}

export class ResponseTemplateService {
  
  /**
   * Create templates with AI optimization
   */
  async createTemplate(template: {
    name: string;
    category: string;
    content: string;
    variables: Omit<TemplateVariable, 'id'>[];
    triggers: Omit<TemplateTrigger, 'id'>[];
    description?: string;
  }): Promise<ResponseTemplate> {
    try {
      // Create the template
      const { data: templateData, error: templateError } = await supabase
        .from('templates')
        .insert({
          name: template.name,
          description: template.description,
          category: template.category,
          content: template.content,
          is_active: true
        })
        .select()
        .single();

      if (templateError) {
        throw new Error(`Failed to create template: ${templateError.message}`);
      }

      // Create template variables
      const variablePromises = template.variables.map((variable, index) => 
        supabase.from('template_variables').insert({
          template_id: templateData.id,
          variable_name: variable.name,
          variable_type: variable.type,
          is_required: variable.required,
          default_value: variable.defaultValue,
          options: variable.options || [],
          validation_rules: variable.validationRules || {},
          placeholder: variable.placeholder,
          description: variable.description,
          sort_order: index
        })
      );

      // Create template triggers
      const triggerPromises = template.triggers.map((trigger, index) => 
        supabase.from('template_triggers').insert({
          template_id: templateData.id,
          trigger_type: trigger.type,
          trigger_value: trigger.value,
          trigger_condition: trigger.condition,
          confidence_threshold: trigger.confidenceThreshold,
          priority: index + 1,
          is_active: true
        })
      );

      await Promise.all([...variablePromises, ...triggerPromises]);

      // Return the complete template
      return this.getTemplateById(templateData.id);
      
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }

  /**
   * AI-powered template optimization
   */
  async optimizeTemplate(templateId: string): Promise<{
    originalTemplate: string;
    optimizedTemplate: string;
    improvementAreas: string[];
    expectedPerformanceGain: number;
  }> {
    try {
      // Get current template
      const template = await this.getTemplateById(templateId);
      
      // Get template analytics for optimization context
      const analytics = await this.getTemplateAnalytics(templateId);
      
      // AI optimization logic (simulated)
      const optimizationResult = await this.performAIOptimization(template, analytics);
      
      // Save optimization record
      const { data: optimizationData, error } = await supabase
        .from('template_optimization')
        .insert({
          template_id: templateId,
          optimization_type: 'ai_rewrite',
          original_content: template.content,
          optimized_content: optimizationResult.optimizedContent,
          optimization_reason: optimizationResult.reason,
          expected_improvement: optimizationResult.expectedImprovement,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save optimization: ${error.message}`);
      }

      return {
        originalTemplate: template.content,
        optimizedTemplate: optimizationResult.optimizedContent,
        improvementAreas: optimizationResult.improvementAreas,
        expectedPerformanceGain: optimizationResult.expectedImprovement
      };
      
    } catch (error) {
      console.error('Error optimizing template:', error);
      throw error;
    }
  }

  /**
   * Auto-suggest templates based on customer message
   */
  async suggestTemplates(
    customerMessage: string,
    conversationContext: any[]
  ): Promise<TemplateSuggestion[]> {
    try {
      // Use database function for AI-powered suggestions
      const { data: suggestions, error } = await supabase
        .rpc('get_template_suggestions', {
          customer_message_text: customerMessage,
          user_uuid: (await supabase.auth.getUser()).data.user?.id,
          limit_count: 5
        });

      if (error) {
        throw new Error(`Failed to get suggestions: ${error.message}`);
      }

      // Enhance suggestions with variables and timing
      const enhancedSuggestions = await Promise.all(
        suggestions.map(async (suggestion: any) => {
          const variables = await this.getTemplateVariables(suggestion.template_id);
          const analytics = await this.getTemplateAnalytics(suggestion.template_id);
          
          return {
            templateId: suggestion.template_id,
            templateName: suggestion.template_name,
            templateContent: suggestion.template_content,
            confidenceScore: suggestion.confidence_score,
            matchReason: suggestion.match_reason,
            variables,
            estimatedResponseTime: analytics.averageResponseTime
          };
        })
      );

      // Log the suggestion for analytics
      await this.logTemplateSuggestion(customerMessage, enhancedSuggestions);

      return enhancedSuggestions;
      
    } catch (error) {
      console.error('Error suggesting templates:', error);
      throw error;
    }
  }

  /**
   * Track template performance
   */
  async getTemplateAnalytics(templateId: string): Promise<TemplateAnalytics> {
    try {
      const { data: analytics, error } = await supabase
        .from('template_analytics')
        .select('*')
        .eq('template_id', templateId)
        .order('date_period', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to get analytics: ${error.message}`);
      }

      if (!analytics) {
        // Return default analytics if none exist
        return {
          templateId,
          usageCount: 0,
          successRate: 0,
          averageResponseTime: 0,
          customerSatisfaction: 0,
          conversionRate: 0,
          effectivenessScore: 0,
          performanceTrend: 'stable',
          optimizationSuggestions: [],
          abTestResults: {}
        };
      }

      return {
        templateId: analytics.template_id,
        usageCount: analytics.usage_count,
        successRate: analytics.success_rate,
        averageResponseTime: analytics.average_response_time,
        customerSatisfaction: analytics.customer_satisfaction,
        conversionRate: analytics.conversion_rate,
        effectivenessScore: analytics.effectiveness_score,
        lastUsedAt: analytics.last_used_at,
        performanceTrend: analytics.performance_trend,
        optimizationSuggestions: analytics.optimization_suggestions || [],
        abTestResults: analytics.a_b_test_results || {}
      };
      
    } catch (error) {
      console.error('Error getting template analytics:', error);
      throw error;
    }
  }

  /**
   * Smart template search
   */
  async searchTemplates(
    query: string,
    filters: TemplateFilter[] = []
  ): Promise<ResponseTemplate[]> {
    try {
      let queryBuilder = supabase
        .from('templates')
        .select(`
          *,
          template_variables(*),
          template_triggers(*),
          template_analytics(*)
        `)
        .eq('is_active', true);

      // Apply text search
      if (query) {
        queryBuilder = queryBuilder.textSearch('content', query);
      }

      // Apply filters
      filters.forEach(filter => {
        if (filter.category) {
          queryBuilder = queryBuilder.eq('category', filter.category);
        }
        if (filter.isActive !== undefined) {
          queryBuilder = queryBuilder.eq('is_active', filter.isActive);
        }
        if (filter.dateRange) {
          queryBuilder = queryBuilder
            .gte('created_at', filter.dateRange.start.toISOString())
            .lte('created_at', filter.dateRange.end.toISOString());
        }
      });

      const { data, error } = await queryBuilder
        .order('usage_count', { ascending: false })
        .limit(20);

      if (error) {
        throw new Error(`Failed to search templates: ${error.message}`);
      }

      return data.map(this.mapTemplateData);
      
    } catch (error) {
      console.error('Error searching templates:', error);
      throw error;
    }
  }

  /**
   * Get template by ID with full details
   */
  async getTemplateById(templateId: string): Promise<ResponseTemplate> {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select(`
          *,
          template_variables(*),
          template_triggers(*),
          template_analytics(*)
        `)
        .eq('id', templateId)
        .single();

      if (error) {
        throw new Error(`Failed to get template: ${error.message}`);
      }

      return this.mapTemplateData(data);
      
    } catch (error) {
      console.error('Error getting template:', error);
      throw error;
    }
  }

  /**
   * Get all templates with pagination
   */
  async getTemplates(
    page: number = 1,
    limit: number = 20,
    filters: TemplateFilter[] = []
  ): Promise<{ templates: ResponseTemplate[]; total: number }> {
    try {
      let queryBuilder = supabase
        .from('templates')
        .select(`
          *,
          template_variables(*),
          template_triggers(*),
          template_analytics(*)
        `, { count: 'exact' })
        .eq('is_active', true);

      // Apply filters
      filters.forEach(filter => {
        if (filter.category) {
          queryBuilder = queryBuilder.eq('category', filter.category);
        }
        if (filter.minEffectiveness) {
          queryBuilder = queryBuilder.gte('effectiveness_score', filter.minEffectiveness);
        }
        if (filter.dateRange) {
          queryBuilder = queryBuilder
            .gte('created_at', filter.dateRange.start.toISOString())
            .lte('created_at', filter.dateRange.end.toISOString());
        }
      });

      const { data, error, count } = await queryBuilder
        .order('updated_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) {
        throw new Error(`Failed to get templates: ${error.message}`);
      }

      return {
        templates: data.map(this.mapTemplateData),
        total: count || 0
      };
      
    } catch (error) {
      console.error('Error getting templates:', error);
      throw error;
    }
  }

  /**
   * Update template
   */
  async updateTemplate(
    templateId: string,
    updates: Partial<{
      name: string;
      description: string;
      category: string;
      content: string;
      variables: Omit<TemplateVariable, 'id'>[];
      triggers: Omit<TemplateTrigger, 'id'>[];
      isActive: boolean;
    }>
  ): Promise<ResponseTemplate> {
    try {
      // Update template
      const { error: templateError } = await supabase
        .from('templates')
        .update({
          name: updates.name,
          description: updates.description,
          category: updates.category,
          content: updates.content,
          is_active: updates.isActive
        })
        .eq('id', templateId);

      if (templateError) {
        throw new Error(`Failed to update template: ${templateError.message}`);
      }

      // Update variables if provided
      if (updates.variables) {
        // Delete existing variables
        await supabase
          .from('template_variables')
          .delete()
          .eq('template_id', templateId);

        // Insert new variables
        const variablePromises = updates.variables.map((variable, index) => 
          supabase.from('template_variables').insert({
            template_id: templateId,
            variable_name: variable.name,
            variable_type: variable.type,
            is_required: variable.required,
            default_value: variable.defaultValue,
            options: variable.options || [],
            validation_rules: variable.validationRules || {},
            placeholder: variable.placeholder,
            description: variable.description,
            sort_order: index
          })
        );

        await Promise.all(variablePromises);
      }

      // Update triggers if provided
      if (updates.triggers) {
        // Delete existing triggers
        await supabase
          .from('template_triggers')
          .delete()
          .eq('template_id', templateId);

        // Insert new triggers
        const triggerPromises = updates.triggers.map((trigger, index) => 
          supabase.from('template_triggers').insert({
            template_id: templateId,
            trigger_type: trigger.type,
            trigger_value: trigger.value,
            trigger_condition: trigger.condition,
            confidence_threshold: trigger.confidenceThreshold,
            priority: index + 1,
            is_active: true
          })
        );

        await Promise.all(triggerPromises);
      }

      return this.getTemplateById(templateId);
      
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', templateId);

      if (error) {
        throw new Error(`Failed to delete template: ${error.message}`);
      }
      
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }

  /**
   * Record template usage
   */
  async recordTemplateUsage(
    templateId: string,
    conversationId: string,
    messageId: string,
    variablesUsed: Record<string, any>,
    responseTime: number,
    effectiveness: number
  ): Promise<void> {
    try {
      await supabase
        .from('template_usage_history')
        .insert({
          template_id: templateId,
          conversation_id: conversationId,
          message_id: messageId,
          variables_used: variablesUsed,
          response_time_ms: responseTime,
          effectiveness_rating: effectiveness,
          context_match_score: 0.8, // This would be calculated based on context
          customer_reaction: 'neutral' // This would be determined by sentiment analysis
        });

      // Update template usage count
      await supabase
        .from('templates')
        .update({ usage_count: supabase.sql`usage_count + 1` })
        .eq('id', templateId);
      
    } catch (error) {
      console.error('Error recording template usage:', error);
      throw error;
    }
  }

  /**
   * Start A/B test for template
   */
  async startABTest(
    templateId: string,
    testName: string,
    variantA: string,
    variantB: string,
    trafficSplit: number = 0.5
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('template_ab_tests')
        .insert({
          template_id: templateId,
          test_name: testName,
          variant_a_content: variantA,
          variant_b_content: variantB,
          traffic_split: trafficSplit,
          status: 'running'
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to start A/B test: ${error.message}`);
      }

      return data.id;
      
    } catch (error) {
      console.error('Error starting A/B test:', error);
      throw error;
    }
  }

  /**
   * Get A/B test results
   */
  async getABTestResults(testId: string): Promise<ABTestResult> {
    try {
      const { data, error } = await supabase
        .from('template_ab_tests')
        .select('*')
        .eq('id', testId)
        .single();

      if (error) {
        throw new Error(`Failed to get A/B test results: ${error.message}`);
      }

      return {
        testId: data.id,
        testName: data.test_name,
        variantA: data.variant_a_content,
        variantB: data.variant_b_content,
        trafficSplit: data.traffic_split,
        winnerVariant: data.winner_variant,
        confidenceLevel: data.confidence_level,
        results: data.results || {
          variantA: { impressions: 0, conversions: 0, conversionRate: 0 },
          variantB: { impressions: 0, conversions: 0, conversionRate: 0 }
        }
      };
      
    } catch (error) {
      console.error('Error getting A/B test results:', error);
      throw error;
    }
  }

  /**
   * Get template categories
   */
  async getTemplateCategories(): Promise<Array<{ id: string; name: string; count: number }>> {
    try {
      const { data, error } = await supabase
        .from('template_categories')
        .select('*')
        .order('sort_order');

      if (error) {
        throw new Error(`Failed to get categories: ${error.message}`);
      }

      // Get template counts for each category
      const categoriesWithCounts = await Promise.all(
        data.map(async (category) => {
          const { count } = await supabase
            .from('templates')
            .select('*', { count: 'exact', head: true })
            .eq('category', category.name)
            .eq('is_active', true);

          return {
            id: category.id,
            name: category.name,
            count: count || 0
          };
        })
      );

      return categoriesWithCounts;
      
    } catch (error) {
      console.error('Error getting template categories:', error);
      throw error;
    }
  }

  /**
   * Get template variables
   */
  private async getTemplateVariables(templateId: string): Promise<TemplateVariable[]> {
    const { data, error } = await supabase
      .from('template_variables')
      .select('*')
      .eq('template_id', templateId)
      .order('sort_order');

    if (error) {
      throw new Error(`Failed to get template variables: ${error.message}`);
    }

    return data.map(variable => ({
      id: variable.id,
      name: variable.variable_name,
      type: variable.variable_type,
      required: variable.is_required,
      defaultValue: variable.default_value,
      options: variable.options || [],
      validationRules: variable.validation_rules || {},
      placeholder: variable.placeholder,
      description: variable.description,
      sortOrder: variable.sort_order
    }));
  }

  /**
   * Get template triggers
   */
  private async getTemplateTriggers(templateId: string): Promise<TemplateTrigger[]> {
    const { data, error } = await supabase
      .from('template_triggers')
      .select('*')
      .eq('template_id', templateId)
      .eq('is_active', true)
      .order('priority');

    if (error) {
      throw new Error(`Failed to get template triggers: ${error.message}`);
    }

    return data.map(trigger => ({
      id: trigger.id,
      type: trigger.trigger_type,
      value: trigger.trigger_value,
      condition: trigger.trigger_condition,
      confidenceThreshold: trigger.confidence_threshold,
      priority: trigger.priority,
      isActive: trigger.is_active
    }));
  }

  /**
   * Map database data to ResponseTemplate interface
   */
  private mapTemplateData(data: any): ResponseTemplate {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      category: data.category,
      content: data.content,
      variables: (data.template_variables || []).map((v: any) => ({
        id: v.id,
        name: v.variable_name,
        type: v.variable_type,
        required: v.is_required,
        defaultValue: v.default_value,
        options: v.options || [],
        validationRules: v.validation_rules || {},
        placeholder: v.placeholder,
        description: v.description,
        sortOrder: v.sort_order
      })),
      triggers: (data.template_triggers || []).map((t: any) => ({
        id: t.id,
        type: t.trigger_type,
        value: t.trigger_value,
        condition: t.trigger_condition,
        confidenceThreshold: t.confidence_threshold,
        priority: t.priority,
        isActive: t.is_active
      })),
      performanceScore: data.effectiveness_score || 0,
      usageCount: data.usage_count || 0,
      effectivenessScore: data.template_analytics?.[0]?.effectiveness_score || 0,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  /**
   * Perform AI optimization (simulated)
   */
  private async performAIOptimization(
    template: ResponseTemplate,
    analytics: TemplateAnalytics
  ): Promise<{
    optimizedContent: string;
    reason: string;
    improvementAreas: string[];
    expectedImprovement: number;
  }> {
    // Simulate AI optimization logic
    const improvementAreas = [];
    let optimizedContent = template.content;
    
    // Analyze current performance
    if (analytics.customerSatisfaction < 3) {
      improvementAreas.push('Customer satisfaction improvement');
      optimizedContent = optimizedContent.replace(/\b(sorry|apologize)\b/gi, 'I understand');
    }
    
    if (analytics.averageResponseTime > 30) {
      improvementAreas.push('Response time optimization');
      optimizedContent = optimizedContent.replace(/\b(please|kindly)\b/gi, '');
    }
    
    if (analytics.effectivenessScore < 0.7) {
      improvementAreas.push('Effectiveness enhancement');
      optimizedContent = `${optimizedContent}\n\nIs there anything else I can help you with?`;
    }

    return {
      optimizedContent,
      reason: `Optimization based on analytics: ${improvementAreas.join(', ')}`,
      improvementAreas,
      expectedImprovement: Math.min(25, (1 - analytics.effectivenessScore) * 30)
    };
  }

  /**
   * Log template suggestion for analytics
   */
  private async logTemplateSuggestion(
    customerMessage: string,
    suggestions: TemplateSuggestion[]
  ): Promise<void> {
    try {
      await supabase
        .from('template_suggestions')
        .insert({
          customer_message: customerMessage,
          suggested_templates: suggestions.map(s => ({
            templateId: s.templateId,
            confidenceScore: s.confidenceScore,
            matchReason: s.matchReason
          })),
          confidence_score: suggestions.length > 0 ? suggestions[0].confidenceScore : 0
        });
    } catch (error) {
      console.error('Error logging template suggestion:', error);
    }
  }
}