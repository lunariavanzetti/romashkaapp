import { supabase } from '../../lib/supabase';
import {
  ROICalculation,
  ROIMetrics,
  ROICosts,
  ROIRevenue,
  ROITemplate,
  ROIComparison,
  ROIForecasting,
  ROIInsight,
  ROIReport,
  ROI_CALCULATION_METHODS,
  INDUSTRY_BENCHMARKS
} from '../../types/roiCalculations';

export class ROICalculationEngine {
  private static instance: ROICalculationEngine;

  private constructor() {}

  static getInstance(): ROICalculationEngine {
    if (!ROICalculationEngine.instance) {
      ROICalculationEngine.instance = new ROICalculationEngine();
    }
    return ROICalculationEngine.instance;
  }

  /**
   * Create a new ROI calculation
   */
  async createCalculation(
    name: string,
    description: string,
    periodStart: string,
    periodEnd: string,
    metrics: Partial<ROIMetrics>,
    costs: Partial<ROICosts>,
    revenue: Partial<ROIRevenue>,
    calculationMethod: string = 'standard',
    customFormula?: string
  ): Promise<ROICalculation> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Calculate ROI
      const calculationResult = this.calculateROI(metrics, costs, revenue, calculationMethod, customFormula);

      const calculationData: Omit<ROICalculation, 'id' | 'created_at' | 'updated_at'> = {
        user_id: user.id,
        calculation_name: name,
        description,
        period_start: periodStart,
        period_end: periodEnd,
        metrics: this.normalizeMetrics(metrics),
        costs: this.normalizeCosts(costs),
        revenue: this.normalizeRevenue(revenue),
        calculated_roi: calculationResult.roi,
        roi_percentage: calculationResult.roiPercentage,
        payback_period_months: calculationResult.paybackPeriod,
        calculation_method: calculationMethod as any,
        custom_formula: customFormula,
        tags: []
      };

      const { data: calculation, error } = await supabase
        .from('roi_calculations')
        .insert(calculationData)
        .select()
        .single();

      if (error) {
        console.error('Error creating ROI calculation:', error);
        throw error;
      }

      return calculation;
    } catch (error) {
      console.error('Error creating ROI calculation:', error);
      throw error;
    }
  }

  /**
   * Get ROI calculations for user
   */
  async getCalculations(filters?: {
    startDate?: string;
    endDate?: string;
    tags?: string[];
    method?: string;
  }): Promise<ROICalculation[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('roi_calculations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filters?.startDate) {
        query = query.gte('period_start', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('period_end', filters.endDate);
      }
      if (filters?.method) {
        query = query.eq('calculation_method', filters.method);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching ROI calculations:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching ROI calculations:', error);
      throw error;
    }
  }

  /**
   * Update an existing ROI calculation
   */
  async updateCalculation(
    id: string,
    updates: Partial<ROICalculation>
  ): Promise<ROICalculation> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Recalculate ROI if metrics, costs, or revenue changed
      if (updates.metrics || updates.costs || updates.revenue) {
        const { data: existing } = await supabase
          .from('roi_calculations')
          .select('*')
          .eq('id', id)
          .single();

        if (!existing) throw new Error('Calculation not found');

        const newMetrics = { ...existing.metrics, ...updates.metrics };
        const newCosts = { ...existing.costs, ...updates.costs };
        const newRevenue = { ...existing.revenue, ...updates.revenue };

        const calculationResult = this.calculateROI(
          newMetrics,
          newCosts,
          newRevenue,
          updates.calculation_method || existing.calculation_method,
          updates.custom_formula || existing.custom_formula
        );

        updates.calculated_roi = calculationResult.roi;
        updates.roi_percentage = calculationResult.roiPercentage;
        updates.payback_period_months = calculationResult.paybackPeriod;
      }

      const { data, error } = await supabase
        .from('roi_calculations')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating ROI calculation:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating ROI calculation:', error);
      throw error;
    }
  }

  /**
   * Delete ROI calculation
   */
  async deleteCalculation(id: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('roi_calculations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting ROI calculation:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error deleting ROI calculation:', error);
      throw error;
    }
  }

  /**
   * Calculate ROI based on metrics, costs, and revenue
   */
  private calculateROI(
    metrics: Partial<ROIMetrics>,
    costs: Partial<ROICosts>,
    revenue: Partial<ROIRevenue>,
    method: string = 'standard',
    customFormula?: string
  ): { roi: number; roiPercentage: number; paybackPeriod: number } {
    // Calculate total costs
    const totalCosts = this.calculateTotalCosts(costs);
    
    // Calculate total revenue
    const totalRevenue = this.calculateTotalRevenue(revenue);
    
    // Calculate ROI based on method
    let roi = 0;
    let roiPercentage = 0;
    let paybackPeriod = 0;

    switch (method) {
      case 'standard':
        roi = totalRevenue - totalCosts;
        roiPercentage = totalCosts > 0 ? (roi / totalCosts) * 100 : 0;
        break;
      
      case 'marketing':
        const marketingCosts = this.calculateMarketingCosts(costs);
        roi = totalRevenue - marketingCosts;
        roiPercentage = marketingCosts > 0 ? (roi / marketingCosts) * 100 : 0;
        break;
      
      case 'customer_acquisition':
        const clv = metrics.conversions?.customer_lifetime_value || 0;
        const cac = metrics.lead_generation?.cost_per_lead || 0;
        roi = clv - cac;
        roiPercentage = cac > 0 ? (roi / cac) * 100 : 0;
        break;
      
      case 'time_based':
        const monthlyRevenue = totalRevenue / 12;
        const monthlyCosts = totalCosts / 12;
        roi = monthlyRevenue - monthlyCosts;
        roiPercentage = monthlyCosts > 0 ? (roi / monthlyCosts) * 100 : 0;
        break;
      
      case 'custom':
        if (customFormula) {
          const result = this.evaluateCustomFormula(customFormula, metrics, costs, revenue);
          roi = result.roi;
          roiPercentage = result.roiPercentage;
        }
        break;
    }

    // Calculate payback period
    const monthlyRevenue = totalRevenue / 12;
    const monthlyCosts = totalCosts / 12;
    const monthlyProfit = monthlyRevenue - monthlyCosts;
    
    if (monthlyProfit > 0) {
      paybackPeriod = totalCosts / monthlyProfit;
    }

    return {
      roi: Math.round(roi * 100) / 100,
      roiPercentage: Math.round(roiPercentage * 100) / 100,
      paybackPeriod: Math.round(paybackPeriod * 100) / 100
    };
  }

  /**
   * Calculate total costs from all cost categories
   */
  private calculateTotalCosts(costs: Partial<ROICosts>): number {
    let total = 0;
    
    // Platform costs
    if (costs.platform_costs) {
      total += costs.platform_costs.romashka_subscription || 0;
      total += costs.platform_costs.integrations || 0;
      total += costs.platform_costs.additional_tools || 0;
    }
    
    // Marketing costs
    if (costs.marketing_costs) {
      total += costs.marketing_costs.advertising_spend || 0;
      total += costs.marketing_costs.content_creation || 0;
      total += costs.marketing_costs.email_marketing || 0;
      total += costs.marketing_costs.social_media || 0;
    }
    
    // Personnel costs
    if (costs.personnel_costs) {
      total += costs.personnel_costs.staff_salaries || 0;
      total += costs.personnel_costs.training_costs || 0;
      total += costs.personnel_costs.contractor_fees || 0;
    }
    
    // Implementation costs
    if (costs.implementation_costs) {
      total += costs.implementation_costs.setup_costs || 0;
      total += costs.implementation_costs.customization || 0;
      total += costs.implementation_costs.consulting || 0;
    }
    
    // Operational costs
    if (costs.operational_costs) {
      total += costs.operational_costs.hosting || 0;
      total += costs.operational_costs.maintenance || 0;
      total += costs.operational_costs.support || 0;
    }
    
    return total;
  }

  /**
   * Calculate total revenue from all revenue sources
   */
  private calculateTotalRevenue(revenue: Partial<ROIRevenue>): number {
    let total = 0;
    
    // Direct revenue
    if (revenue.direct_revenue) {
      total += revenue.direct_revenue.sales_revenue || 0;
      total += revenue.direct_revenue.subscription_revenue || 0;
      total += revenue.direct_revenue.service_revenue || 0;
    }
    
    // Indirect revenue
    if (revenue.indirect_revenue) {
      total += revenue.indirect_revenue.upsells || 0;
      total += revenue.indirect_revenue.cross_sells || 0;
      total += revenue.indirect_revenue.renewals || 0;
    }
    
    // Cost savings (treated as revenue)
    if (revenue.cost_savings) {
      total += revenue.cost_savings.support_automation || 0;
      total += revenue.cost_savings.lead_qualification || 0;
      total += revenue.cost_savings.time_savings || 0;
      total += revenue.cost_savings.process_efficiency || 0;
    }
    
    return total;
  }

  /**
   * Calculate marketing-specific costs
   */
  private calculateMarketingCosts(costs: Partial<ROICosts>): number {
    let total = 0;
    
    if (costs.marketing_costs) {
      total += costs.marketing_costs.advertising_spend || 0;
      total += costs.marketing_costs.content_creation || 0;
      total += costs.marketing_costs.email_marketing || 0;
      total += costs.marketing_costs.social_media || 0;
    }
    
    return total;
  }

  /**
   * Evaluate custom formula
   */
  private evaluateCustomFormula(
    formula: string,
    metrics: Partial<ROIMetrics>,
    costs: Partial<ROICosts>,
    revenue: Partial<ROIRevenue>
  ): { roi: number; roiPercentage: number } {
    // This is a simplified implementation
    // In a real-world scenario, you'd want to use a proper formula parser
    const totalRevenue = this.calculateTotalRevenue(revenue);
    const totalCosts = this.calculateTotalCosts(costs);
    
    // Replace variables in formula
    let processedFormula = formula
      .replace(/revenue/g, totalRevenue.toString())
      .replace(/costs/g, totalCosts.toString())
      .replace(/profit/g, (totalRevenue - totalCosts).toString());
    
    try {
      // Basic evaluation (in production, use a proper formula parser)
      const roi = eval(processedFormula);
      const roiPercentage = totalCosts > 0 ? (roi / totalCosts) * 100 : 0;
      
      return { roi, roiPercentage };
    } catch (error) {
      console.error('Error evaluating custom formula:', error);
      return { roi: 0, roiPercentage: 0 };
    }
  }

  /**
   * Generate ROI insights
   */
  async generateInsights(calculationId: string): Promise<ROIInsight[]> {
    try {
      const { data: calculation } = await supabase
        .from('roi_calculations')
        .select('*')
        .eq('id', calculationId)
        .single();

      if (!calculation) throw new Error('Calculation not found');

      const insights: ROIInsight[] = [];
      
      // Performance insights
      if (calculation.roi_percentage > 200) {
        insights.push({
          type: 'positive',
          category: 'performance',
          title: 'Excellent ROI Performance',
          description: `Your ROI of ${calculation.roi_percentage}% exceeds industry benchmarks`,
          impact: 'high',
          recommendation: 'Consider scaling your current strategies to maximize returns',
          confidence: 90
        });
      } else if (calculation.roi_percentage < 50) {
        insights.push({
          type: 'negative',
          category: 'performance',
          title: 'Low ROI Performance',
          description: `Your ROI of ${calculation.roi_percentage}% is below industry standards`,
          impact: 'high',
          recommendation: 'Review and optimize your cost structure and revenue strategies',
          confidence: 85
        });
      }

      // Cost insights
      const totalCosts = this.calculateTotalCosts(calculation.costs);
      const totalRevenue = this.calculateTotalRevenue(calculation.revenue);
      const costRatio = totalCosts / totalRevenue;

      if (costRatio > 0.8) {
        insights.push({
          type: 'negative',
          category: 'cost',
          title: 'High Cost Ratio',
          description: `Costs represent ${(costRatio * 100).toFixed(1)}% of your revenue`,
          impact: 'medium',
          recommendation: 'Focus on cost optimization and efficiency improvements',
          confidence: 80
        });
      }

      // Revenue insights
      const directRevenue = this.calculateDirectRevenue(calculation.revenue);
      const indirectRevenue = this.calculateIndirectRevenue(calculation.revenue);
      
      if (indirectRevenue > directRevenue * 0.3) {
        insights.push({
          type: 'positive',
          category: 'revenue',
          title: 'Strong Indirect Revenue',
          description: 'Indirect revenue sources are contributing significantly to your ROI',
          impact: 'medium',
          recommendation: 'Continue to nurture existing customers for upsells and renewals',
          confidence: 75
        });
      }

      // Payback period insights
      if (calculation.payback_period_months < 12) {
        insights.push({
          type: 'positive',
          category: 'efficiency',
          title: 'Fast Payback Period',
          description: `Your payback period of ${calculation.payback_period_months} months is excellent`,
          impact: 'medium',
          recommendation: 'Your investment is recovering quickly, consider increasing investment',
          confidence: 85
        });
      } else if (calculation.payback_period_months > 24) {
        insights.push({
          type: 'negative',
          category: 'efficiency',
          title: 'Slow Payback Period',
          description: `Your payback period of ${calculation.payback_period_months} months is concerning`,
          impact: 'high',
          recommendation: 'Focus on accelerating revenue generation and reducing costs',
          confidence: 80
        });
      }

      return insights;
    } catch (error) {
      console.error('Error generating insights:', error);
      throw error;
    }
  }

  /**
   * Create ROI comparison between periods
   */
  async createComparison(
    name: string,
    calculationIds: string[]
  ): Promise<ROIComparison> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: calculations } = await supabase
        .from('roi_calculations')
        .select('*')
        .in('id', calculationIds)
        .eq('user_id', user.id);

      if (!calculations || calculations.length === 0) {
        throw new Error('No calculations found');
      }

      // Analyze trends
      const sortedCalculations = calculations.sort((a, b) => 
        new Date(a.period_start).getTime() - new Date(b.period_start).getTime()
      );

      const firstROI = sortedCalculations[0].roi_percentage;
      const lastROI = sortedCalculations[sortedCalculations.length - 1].roi_percentage;
      const trendPercentage = firstROI > 0 ? ((lastROI - firstROI) / firstROI) * 100 : 0;

      let trend: 'improving' | 'declining' | 'stable' = 'stable';
      if (trendPercentage > 10) trend = 'improving';
      else if (trendPercentage < -10) trend = 'declining';

      const bestPerforming = sortedCalculations.reduce((best, current) => 
        current.roi_percentage > best.roi_percentage ? current : best
      );

      const worstPerforming = sortedCalculations.reduce((worst, current) => 
        current.roi_percentage < worst.roi_percentage ? current : worst
      );

      const comparisonData: Omit<ROIComparison, 'id' | 'created_at'> = {
        user_id: user.id,
        comparison_name: name,
        periods: sortedCalculations,
        analysis: {
          trend,
          trend_percentage: trendPercentage,
          best_performing_period: bestPerforming.id,
          worst_performing_period: worstPerforming.id,
          key_insights: this.generateComparisonInsights(sortedCalculations)
        }
      };

      const { data: comparison, error } = await supabase
        .from('roi_comparisons')
        .insert(comparisonData)
        .select()
        .single();

      if (error) {
        console.error('Error creating ROI comparison:', error);
        throw error;
      }

      return comparison;
    } catch (error) {
      console.error('Error creating ROI comparison:', error);
      throw error;
    }
  }

  /**
   * Generate forecasting for future periods
   */
  async createForecast(
    name: string,
    baseCalculationId: string,
    forecastMonths: number,
    assumptions: {
      growthRate: number;
      costInflation: number;
      marketChanges: number;
      seasonalFactors: number[];
    }
  ): Promise<ROIForecasting> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: baseCalculation } = await supabase
        .from('roi_calculations')
        .select('*')
        .eq('id', baseCalculationId)
        .single();

      if (!baseCalculation) throw new Error('Base calculation not found');

      // Project metrics, costs, and revenue
      const projectedMetrics = this.projectMetrics(baseCalculation.metrics, assumptions);
      const projectedCosts = this.projectCosts(baseCalculation.costs, assumptions);
      const projectedRevenue = this.projectRevenue(baseCalculation.revenue, assumptions);

      // Calculate projected ROI
      const { roiPercentage: projectedROI } = this.calculateROI(
        projectedMetrics,
        projectedCosts,
        projectedRevenue,
        baseCalculation.calculation_method,
        baseCalculation.custom_formula
      );

      const forecastData: Omit<ROIForecasting, 'id' | 'created_at'> = {
        user_id: user.id,
        forecast_name: name,
        base_calculation: baseCalculationId,
        forecast_period_months: forecastMonths,
        assumptions: {
          growth_rate: assumptions.growthRate,
          cost_inflation: assumptions.costInflation,
          market_changes: assumptions.marketChanges,
          seasonal_factors: assumptions.seasonalFactors
        },
        projected_metrics: projectedMetrics,
        projected_costs: projectedCosts,
        projected_revenue: projectedRevenue,
        projected_roi: projectedROI,
        confidence_level: this.calculateConfidenceLevel(assumptions)
      };

      const { data: forecast, error } = await supabase
        .from('roi_forecasts')
        .insert(forecastData)
        .select()
        .single();

      if (error) {
        console.error('Error creating ROI forecast:', error);
        throw error;
      }

      return forecast;
    } catch (error) {
      console.error('Error creating ROI forecast:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive ROI report
   */
  async generateReport(
    calculationId: string,
    reportType: 'standard' | 'executive' | 'detailed' | 'comparison' = 'standard'
  ): Promise<ROIReport> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: calculation } = await supabase
        .from('roi_calculations')
        .select('*')
        .eq('id', calculationId)
        .single();

      if (!calculation) throw new Error('Calculation not found');

      const insights = await this.generateInsights(calculationId);
      const totalRevenue = this.calculateTotalRevenue(calculation.revenue);
      const totalCosts = this.calculateTotalCosts(calculation.costs);

      const report: Omit<ROIReport, 'id'> = {
        user_id: user.id,
        report_name: `ROI Report - ${calculation.calculation_name}`,
        calculation_id: calculationId,
        report_type: reportType,
        generated_at: new Date().toISOString(),
        period_covered: {
          start: calculation.period_start,
          end: calculation.period_end
        },
        executive_summary: {
          roi_percentage: calculation.roi_percentage,
          total_revenue: totalRevenue,
          total_costs: totalCosts,
          payback_period: calculation.payback_period_months,
          key_highlights: insights.filter(i => i.impact === 'high').map(i => i.title)
        },
        insights,
        charts_data: this.generateChartsData(calculation),
        recommendations: insights.map(i => i.recommendation),
        next_steps: this.generateNextSteps(calculation, insights)
      };

      const { data: savedReport, error } = await supabase
        .from('roi_reports')
        .insert(report)
        .select()
        .single();

      if (error) {
        console.error('Error generating ROI report:', error);
        throw error;
      }

      return savedReport;
    } catch (error) {
      console.error('Error generating ROI report:', error);
      throw error;
    }
  }

  /**
   * Helper methods
   */
  private normalizeMetrics(metrics: Partial<ROIMetrics>): ROIMetrics {
    return {
      website_traffic: {
        unique_visitors: 0,
        page_views: 0,
        session_duration: 0,
        bounce_rate: 0,
        ...metrics.website_traffic
      },
      lead_generation: {
        total_leads: 0,
        qualified_leads: 0,
        lead_quality_score: 0,
        cost_per_lead: 0,
        ...metrics.lead_generation
      },
      conversions: {
        total_conversions: 0,
        conversion_rate: 0,
        avg_order_value: 0,
        customer_lifetime_value: 0,
        ...metrics.conversions
      },
      engagement: {
        chat_sessions: 0,
        email_opens: 0,
        email_clicks: 0,
        social_shares: 0,
        ...metrics.engagement
      },
      support: {
        tickets_resolved: 0,
        avg_resolution_time: 0,
        customer_satisfaction: 0,
        automation_rate: 0,
        ...metrics.support
      }
    };
  }

  private normalizeCosts(costs: Partial<ROICosts>): ROICosts {
    return {
      platform_costs: {
        romashka_subscription: 0,
        integrations: 0,
        additional_tools: 0,
        ...costs.platform_costs
      },
      marketing_costs: {
        advertising_spend: 0,
        content_creation: 0,
        email_marketing: 0,
        social_media: 0,
        ...costs.marketing_costs
      },
      personnel_costs: {
        staff_salaries: 0,
        training_costs: 0,
        contractor_fees: 0,
        ...costs.personnel_costs
      },
      implementation_costs: {
        setup_costs: 0,
        customization: 0,
        consulting: 0,
        ...costs.implementation_costs
      },
      operational_costs: {
        hosting: 0,
        maintenance: 0,
        support: 0,
        ...costs.operational_costs
      }
    };
  }

  private normalizeRevenue(revenue: Partial<ROIRevenue>): ROIRevenue {
    return {
      direct_revenue: {
        sales_revenue: 0,
        subscription_revenue: 0,
        service_revenue: 0,
        ...revenue.direct_revenue
      },
      indirect_revenue: {
        upsells: 0,
        cross_sells: 0,
        renewals: 0,
        ...revenue.indirect_revenue
      },
      cost_savings: {
        support_automation: 0,
        lead_qualification: 0,
        time_savings: 0,
        process_efficiency: 0,
        ...revenue.cost_savings
      },
      attribution: {
        romashka_attributed: 0,
        other_channels: 0,
        organic: 0,
        ...revenue.attribution
      }
    };
  }

  private calculateDirectRevenue(revenue: ROIRevenue): number {
    return (revenue.direct_revenue.sales_revenue || 0) +
           (revenue.direct_revenue.subscription_revenue || 0) +
           (revenue.direct_revenue.service_revenue || 0);
  }

  private calculateIndirectRevenue(revenue: ROIRevenue): number {
    return (revenue.indirect_revenue.upsells || 0) +
           (revenue.indirect_revenue.cross_sells || 0) +
           (revenue.indirect_revenue.renewals || 0) +
           (revenue.cost_savings.support_automation || 0) +
           (revenue.cost_savings.lead_qualification || 0) +
           (revenue.cost_savings.time_savings || 0) +
           (revenue.cost_savings.process_efficiency || 0);
  }

  private generateComparisonInsights(calculations: ROICalculation[]): string[] {
    const insights: string[] = [];
    
    if (calculations.length >= 2) {
      const latest = calculations[calculations.length - 1];
      const previous = calculations[calculations.length - 2];
      
      const roiChange = latest.roi_percentage - previous.roi_percentage;
      if (roiChange > 0) {
        insights.push(`ROI improved by ${roiChange.toFixed(1)}% compared to the previous period`);
      } else if (roiChange < 0) {
        insights.push(`ROI declined by ${Math.abs(roiChange).toFixed(1)}% compared to the previous period`);
      }
    }
    
    return insights;
  }

  private projectMetrics(baseMetrics: ROIMetrics, assumptions: any): ROIMetrics {
    const growth = 1 + (assumptions.growthRate / 100);
    const marketFactor = 1 + (assumptions.marketChanges / 100);
    
    return {
      website_traffic: {
        unique_visitors: Math.round(baseMetrics.website_traffic.unique_visitors * growth * marketFactor),
        page_views: Math.round(baseMetrics.website_traffic.page_views * growth * marketFactor),
        session_duration: baseMetrics.website_traffic.session_duration * marketFactor,
        bounce_rate: baseMetrics.website_traffic.bounce_rate / marketFactor
      },
      lead_generation: {
        total_leads: Math.round(baseMetrics.lead_generation.total_leads * growth * marketFactor),
        qualified_leads: Math.round(baseMetrics.lead_generation.qualified_leads * growth * marketFactor),
        lead_quality_score: baseMetrics.lead_generation.lead_quality_score * marketFactor,
        cost_per_lead: baseMetrics.lead_generation.cost_per_lead * (1 + assumptions.costInflation / 100)
      },
      conversions: {
        total_conversions: Math.round(baseMetrics.conversions.total_conversions * growth * marketFactor),
        conversion_rate: baseMetrics.conversions.conversion_rate * marketFactor,
        avg_order_value: baseMetrics.conversions.avg_order_value * growth,
        customer_lifetime_value: baseMetrics.conversions.customer_lifetime_value * growth
      },
      engagement: baseMetrics.engagement,
      support: baseMetrics.support
    };
  }

  private projectCosts(baseCosts: ROICosts, assumptions: any): ROICosts {
    const inflation = 1 + (assumptions.costInflation / 100);
    
    return {
      platform_costs: {
        romashka_subscription: baseCosts.platform_costs.romashka_subscription * inflation,
        integrations: baseCosts.platform_costs.integrations * inflation,
        additional_tools: baseCosts.platform_costs.additional_tools * inflation
      },
      marketing_costs: {
        advertising_spend: baseCosts.marketing_costs.advertising_spend * inflation,
        content_creation: baseCosts.marketing_costs.content_creation * inflation,
        email_marketing: baseCosts.marketing_costs.email_marketing * inflation,
        social_media: baseCosts.marketing_costs.social_media * inflation
      },
      personnel_costs: {
        staff_salaries: baseCosts.personnel_costs.staff_salaries * inflation,
        training_costs: baseCosts.personnel_costs.training_costs * inflation,
        contractor_fees: baseCosts.personnel_costs.contractor_fees * inflation
      },
      implementation_costs: baseCosts.implementation_costs,
      operational_costs: {
        hosting: baseCosts.operational_costs.hosting * inflation,
        maintenance: baseCosts.operational_costs.maintenance * inflation,
        support: baseCosts.operational_costs.support * inflation
      }
    };
  }

  private projectRevenue(baseRevenue: ROIRevenue, assumptions: any): ROIRevenue {
    const growth = 1 + (assumptions.growthRate / 100);
    const marketFactor = 1 + (assumptions.marketChanges / 100);
    
    return {
      direct_revenue: {
        sales_revenue: baseRevenue.direct_revenue.sales_revenue * growth * marketFactor,
        subscription_revenue: baseRevenue.direct_revenue.subscription_revenue * growth,
        service_revenue: baseRevenue.direct_revenue.service_revenue * growth * marketFactor
      },
      indirect_revenue: {
        upsells: baseRevenue.indirect_revenue.upsells * growth,
        cross_sells: baseRevenue.indirect_revenue.cross_sells * growth,
        renewals: baseRevenue.indirect_revenue.renewals * growth
      },
      cost_savings: baseRevenue.cost_savings,
      attribution: baseRevenue.attribution
    };
  }

  private calculateConfidenceLevel(assumptions: any): number {
    // Simple confidence calculation based on assumption volatility
    const volatility = Math.abs(assumptions.growthRate) + 
                      Math.abs(assumptions.costInflation) + 
                      Math.abs(assumptions.marketChanges);
    
    return Math.max(50, 100 - (volatility / 3));
  }

  private generateChartsData(calculation: ROICalculation): any {
    const totalRevenue = this.calculateTotalRevenue(calculation.revenue);
    const totalCosts = this.calculateTotalCosts(calculation.costs);
    
    return {
      roi_trend: [
        { date: calculation.period_start, value: 0 },
        { date: calculation.period_end, value: calculation.roi_percentage }
      ],
      cost_breakdown: [
        { category: 'Platform', value: this.calculateTotalCosts({ platform_costs: calculation.costs.platform_costs }) },
        { category: 'Marketing', value: this.calculateTotalCosts({ marketing_costs: calculation.costs.marketing_costs }) },
        { category: 'Personnel', value: this.calculateTotalCosts({ personnel_costs: calculation.costs.personnel_costs }) },
        { category: 'Implementation', value: this.calculateTotalCosts({ implementation_costs: calculation.costs.implementation_costs }) },
        { category: 'Operational', value: this.calculateTotalCosts({ operational_costs: calculation.costs.operational_costs }) }
      ],
      revenue_sources: [
        { source: 'Direct Revenue', value: this.calculateDirectRevenue(calculation.revenue) },
        { source: 'Indirect Revenue', value: this.calculateIndirectRevenue(calculation.revenue) }
      ],
      performance_metrics: [
        { metric: 'ROI', value: calculation.roi_percentage, benchmark: 200 },
        { metric: 'Payback Period', value: calculation.payback_period_months, benchmark: 18 }
      ]
    };
  }

  private generateNextSteps(calculation: ROICalculation, insights: ROIInsight[]): string[] {
    const steps: string[] = [];
    
    if (calculation.roi_percentage < 100) {
      steps.push('Focus on improving conversion rates and reducing acquisition costs');
    }
    
    if (calculation.payback_period_months > 24) {
      steps.push('Accelerate revenue generation through improved sales processes');
    }
    
    const highImpactInsights = insights.filter(i => i.impact === 'high');
    if (highImpactInsights.length > 0) {
      steps.push('Address high-impact areas identified in the insights section');
    }
    
    steps.push('Monitor ROI trends monthly and adjust strategies accordingly');
    
    return steps;
  }
}

// Export singleton instance
export const roiCalculationEngine = ROICalculationEngine.getInstance();