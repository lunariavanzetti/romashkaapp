import { supabase } from '../../supabaseClient';
import { MetricsCollector } from '../metricsCollector';
import { performanceMetricsService } from './performanceMetricsService';

// ROI Calculation Types
export interface ROICalculation {
  id: string;
  periodStart: string;
  periodEnd: string;
  costAnalysis: {
    laborCostBefore: number;
    laborCostAfter: number;
    laborCostSavings: number;
    aiOperationalCost: number;
    platformOperationalCost: number;
    trainingCost: number;
  };
  revenueImpact: {
    revenueBefore: number;
    revenueAfter: number;
    revenueIncrease: number;
  };
  efficiencyMetrics: {
    timeSavedHours: number;
    productivityIncreasePercent: number;
  };
  customerMetrics: {
    satisfactionImprovement: number;
    retentionRateImprovement: number;
    lifetimeValueIncrease: number;
  };
  calculatedROI: {
    totalInvestment: number;
    totalBenefits: number;
    netBenefit: number;
    roiPercentage: number;
    paybackPeriodMonths: number;
  };
  calculationMethod: string;
  calculatedBy: string;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ROIBenchmark {
  metric: string;
  industryAverage: number;
  currentValue: number;
  performanceRating: 'excellent' | 'good' | 'average' | 'below_average' | 'poor';
  improvementOpportunity: number;
  recommendations: string[];
}

export interface CostSavingsAnalysis {
  period: string;
  totalSavings: number;
  savingsBreakdown: {
    laborSavings: number;
    operationalSavings: number;
    efficiencySavings: number;
    scalingSavings: number;
  };
  costAvoidance: {
    hiringCosts: number;
    trainingCosts: number;
    infrastructureCosts: number;
  };
  automationImpact: {
    conversationsAutomated: number;
    hoursAutomated: number;
    costPerAutomatedConversation: number;
  };
}

export interface RevenueImpactAnalysis {
  period: string;
  directRevenue: {
    salesGenerated: number;
    upsellsGenerated: number;
    retentionRevenue: number;
  };
  indirectRevenue: {
    improvedConversions: number;
    reducedChurn: number;
    brandValueIncrease: number;
  };
  revenuePerConversation: {
    before: number;
    after: number;
    improvement: number;
  };
  conversionMetrics: {
    leadToSaleConversion: number;
    averageOrderValue: number;
    customerLifetimeValue: number;
  };
}

export interface EfficiencyGainsAnalysis {
  period: string;
  timeMetrics: {
    totalTimeSaved: number;
    averageHandleTime: {
      before: number;
      after: number;
      improvement: number;
    };
    firstCallResolution: {
      before: number;
      after: number;
      improvement: number;
    };
  };
  productivityMetrics: {
    conversationsPerAgent: {
      before: number;
      after: number;
      improvement: number;
    };
    agentUtilization: {
      before: number;
      after: number;
      improvement: number;
    };
  };
  scalabilityMetrics: {
    peakCapacityHandling: number;
    elasticityImprovement: number;
    resourceOptimization: number;
  };
}

export interface ROIReport {
  id: string;
  reportType: 'monthly' | 'quarterly' | 'annual' | 'custom';
  period: {
    start: string;
    end: string;
  };
  executiveSummary: {
    totalROI: number;
    paybackPeriod: number;
    keyAchievements: string[];
    majorSavings: string[];
    growthOpportunities: string[];
  };
  costBenefitAnalysis: {
    totalInvestment: number;
    totalBenefits: number;
    netBenefit: number;
    benefitCostRatio: number;
  };
  performanceMetrics: {
    responseTimeImprovement: number;
    resolutionRateImprovement: number;
    satisfactionImprovement: number;
    automationRate: number;
  };
  benchmarkComparison: ROIBenchmark[];
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  projections: {
    nextQuarter: number;
    nextYear: number;
    threeYear: number;
  };
  generatedAt: Date;
  approvedAt?: Date;
}

export class ROICalculationService {
  private static instance: ROICalculationService;
  private metricsCollector: MetricsCollector;

  // Industry benchmarks
  private readonly INDUSTRY_BENCHMARKS = {
    ROI_PERCENTAGE: 150, // 150% average ROI
    PAYBACK_PERIOD_MONTHS: 8, // 8 months average payback
    COST_SAVINGS_PERCENT: 30, // 30% cost savings
    PRODUCTIVITY_IMPROVEMENT: 40, // 40% productivity improvement
    SATISFACTION_IMPROVEMENT: 15, // 15% satisfaction improvement
    AUTOMATION_RATE: 60, // 60% automation rate
    FIRST_CALL_RESOLUTION: 70, // 70% first call resolution
    RESPONSE_TIME_IMPROVEMENT: 50 // 50% response time improvement
  };

  private constructor() {
    this.metricsCollector = MetricsCollector.getInstance();
  }

  static getInstance(): ROICalculationService {
    if (!ROICalculationService.instance) {
      ROICalculationService.instance = new ROICalculationService();
    }
    return ROICalculationService.instance;
  }

  // Main ROI Calculation
  async calculateROI(periodStart: string, periodEnd: string, calculatedBy: string): Promise<ROICalculation> {
    try {
      // Get performance metrics for the period
      const performanceData = await this.getPerformanceDataForPeriod(periodStart, periodEnd);
      
      // Calculate cost analysis
      const costAnalysis = await this.calculateCostAnalysis(periodStart, periodEnd, performanceData);
      
      // Calculate revenue impact
      const revenueImpact = await this.calculateRevenueImpact(periodStart, periodEnd, performanceData);
      
      // Calculate efficiency metrics
      const efficiencyMetrics = await this.calculateEfficiencyMetrics(periodStart, periodEnd, performanceData);
      
      // Calculate customer metrics
      const customerMetrics = await this.calculateCustomerMetrics(periodStart, periodEnd);
      
      // Calculate final ROI
      const totalInvestment = costAnalysis.aiOperationalCost + costAnalysis.platformOperationalCost + costAnalysis.trainingCost;
      const totalBenefits = costAnalysis.laborCostSavings + revenueImpact.revenueIncrease + customerMetrics.lifetimeValueIncrease;
      const netBenefit = totalBenefits - totalInvestment;
      const roiPercentage = totalInvestment > 0 ? (netBenefit / totalInvestment) * 100 : 0;
      const paybackPeriodMonths = totalInvestment > 0 ? Math.ceil((totalInvestment / (totalBenefits / 12))) : 0;

      const calculatedROI = {
        totalInvestment,
        totalBenefits,
        netBenefit,
        roiPercentage,
        paybackPeriodMonths
      };

      // Store in database
      const { data, error } = await supabase
        .from('roi_calculations')
        .insert({
          calculation_period_start: periodStart,
          calculation_period_end: periodEnd,
          labor_cost_before: costAnalysis.laborCostBefore,
          labor_cost_after: costAnalysis.laborCostAfter,
          labor_cost_savings: costAnalysis.laborCostSavings,
          ai_operational_cost: costAnalysis.aiOperationalCost,
          platform_operational_cost: costAnalysis.platformOperationalCost,
          training_cost: costAnalysis.trainingCost,
          revenue_before: revenueImpact.revenueBefore,
          revenue_after: revenueImpact.revenueAfter,
          revenue_increase: revenueImpact.revenueIncrease,
          time_saved_hours: efficiencyMetrics.timeSavedHours,
          productivity_increase_percent: efficiencyMetrics.productivityIncreasePercent,
          customer_satisfaction_improvement: customerMetrics.satisfactionImprovement,
          customer_retention_rate_improvement: customerMetrics.retentionRateImprovement,
          customer_lifetime_value_increase: customerMetrics.lifetimeValueIncrease,
          total_investment: totalInvestment,
          total_benefits: totalBenefits,
          net_benefit: netBenefit,
          roi_percentage: roiPercentage,
          payback_period_months: paybackPeriodMonths,
          calculation_method: 'comprehensive_analysis_v1',
          calculated_by: calculatedBy
        })
        .select()
        .single();

      if (error) throw error;

      // Record metric event
      await this.metricsCollector.recordEvent({
        type: 'roi_calculation_completed',
        value: roiPercentage,
        dimensions: { 
          periodStart, 
          periodEnd, 
          calculatedBy,
          paybackPeriod: paybackPeriodMonths.toString()
        },
        timestamp: new Date()
      });

      return {
        id: data.id,
        periodStart: data.calculation_period_start,
        periodEnd: data.calculation_period_end,
        costAnalysis,
        revenueImpact,
        efficiencyMetrics,
        customerMetrics,
        calculatedROI,
        calculationMethod: data.calculation_method,
        calculatedBy: data.calculated_by,
        approvedBy: data.approved_by,
        approvedAt: data.approved_at ? new Date(data.approved_at) : undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error calculating ROI:', error);
      throw error;
    }
  }

  // Cost Savings Analysis
  async analyzeCostSavings(periodStart: string, periodEnd: string): Promise<CostSavingsAnalysis> {
    try {
      const performanceData = await this.getPerformanceDataForPeriod(periodStart, periodEnd);
      
      // Calculate labor savings
      const avgAgentSalary = 50000; // $50k annual salary
      const hourlyRate = avgAgentSalary / (40 * 52); // $24/hour
      const totalConversations = performanceData.reduce((sum, row) => sum + (row.total_conversations || 0), 0);
      const aiResolvedConversations = performanceData.reduce((sum, row) => sum + (row.ai_resolved_conversations || 0), 0);
      const avgHandleTime = 15; // 15 minutes per conversation
      const hoursAutomated = (aiResolvedConversations * avgHandleTime) / 60;
      const laborSavings = hoursAutomated * hourlyRate;

      // Calculate operational savings
      const operationalSavings = laborSavings * 0.3; // 30% additional operational costs
      
      // Calculate efficiency savings
      const efficiencySavings = this.calculateEfficiencySavings(performanceData);
      
      // Calculate scaling savings
      const scalingSavings = this.calculateScalingSavings(performanceData);
      
      // Calculate cost avoidance
      const costAvoidance = {
        hiringCosts: (aiResolvedConversations / 1000) * 15000, // $15k per hire avoided
        trainingCosts: (aiResolvedConversations / 1000) * 5000, // $5k training cost avoided
        infrastructureCosts: laborSavings * 0.2 // 20% of labor savings in infrastructure
      };

      const totalSavings = laborSavings + operationalSavings + efficiencySavings + scalingSavings;

      return {
        period: `${periodStart} to ${periodEnd}`,
        totalSavings,
        savingsBreakdown: {
          laborSavings,
          operationalSavings,
          efficiencySavings,
          scalingSavings
        },
        costAvoidance,
        automationImpact: {
          conversationsAutomated: aiResolvedConversations,
          hoursAutomated,
          costPerAutomatedConversation: aiResolvedConversations > 0 ? totalSavings / aiResolvedConversations : 0
        }
      };
    } catch (error) {
      console.error('Error analyzing cost savings:', error);
      throw error;
    }
  }

  // Revenue Impact Analysis
  async analyzeRevenueImpact(periodStart: string, periodEnd: string): Promise<RevenueImpactAnalysis> {
    try {
      // Get conversation data with revenue attribution
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('*, customer_profiles(*)')
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd);

      if (error) throw error;

      // Calculate direct revenue impact
      const salesGenerated = conversations
        .filter(conv => conv.outcome === 'sale')
        .reduce((sum, conv) => sum + (conv.revenue_attributed || 0), 0);

      const upsellsGenerated = conversations
        .filter(conv => conv.outcome === 'upsell')
        .reduce((sum, conv) => sum + (conv.revenue_attributed || 0), 0);

      const retentionRevenue = conversations
        .filter(conv => conv.outcome === 'retention')
        .reduce((sum, conv) => sum + (conv.revenue_attributed || 0), 0);

      // Calculate indirect revenue impact
      const improvedConversions = this.calculateImprovedConversions(conversations);
      const reducedChurn = this.calculateReducedChurn(conversations);
      const brandValueIncrease = this.calculateBrandValueIncrease(conversations);

      // Calculate revenue per conversation
      const totalRevenue = salesGenerated + upsellsGenerated + retentionRevenue;
      const revenuePerConversation = conversations.length > 0 ? totalRevenue / conversations.length : 0;

      // Get baseline for comparison
      const baselineRevenue = await this.getBaselineRevenue(periodStart, periodEnd);

      return {
        period: `${periodStart} to ${periodEnd}`,
        directRevenue: {
          salesGenerated,
          upsellsGenerated,
          retentionRevenue
        },
        indirectRevenue: {
          improvedConversions,
          reducedChurn,
          brandValueIncrease
        },
        revenuePerConversation: {
          before: baselineRevenue.perConversation,
          after: revenuePerConversation,
          improvement: revenuePerConversation - baselineRevenue.perConversation
        },
        conversionMetrics: {
          leadToSaleConversion: this.calculateConversionRate(conversations, 'lead', 'sale'),
          averageOrderValue: this.calculateAverageOrderValue(conversations),
          customerLifetimeValue: this.calculateCustomerLifetimeValue(conversations)
        }
      };
    } catch (error) {
      console.error('Error analyzing revenue impact:', error);
      throw error;
    }
  }

  // Efficiency Gains Analysis
  async analyzeEfficiencyGains(periodStart: string, periodEnd: string): Promise<EfficiencyGainsAnalysis> {
    try {
      const performanceData = await this.getPerformanceDataForPeriod(periodStart, periodEnd);
      const baselineData = await this.getBaselinePerformanceData(periodStart, periodEnd);

      // Calculate time metrics
      const currentAvgHandleTime = performanceData.reduce((sum, row) => sum + (row.avg_response_time_seconds || 0), 0) / performanceData.length;
      const baselineAvgHandleTime = baselineData.avgHandleTime;
      const handleTimeImprovement = baselineAvgHandleTime - currentAvgHandleTime;

      const currentFCR = performanceData.reduce((sum, row) => {
        const total = row.total_conversations || 0;
        const resolved = (row.ai_resolved_conversations || 0) + (row.human_resolved_conversations || 0);
        return sum + (total > 0 ? resolved / total : 0);
      }, 0) / performanceData.length;

      const totalTimeSaved = this.calculateTotalTimeSaved(performanceData, baselineData);

      // Calculate productivity metrics
      const currentConversationsPerAgent = performanceData.reduce((sum, row) => sum + (row.conversations_per_hour || 0), 0) / performanceData.length;
      const baselineConversationsPerAgent = baselineData.conversationsPerAgent;

      const currentAgentUtilization = this.calculateAgentUtilization(performanceData);
      const baselineAgentUtilization = baselineData.agentUtilization;

      return {
        period: `${periodStart} to ${periodEnd}`,
        timeMetrics: {
          totalTimeSaved,
          averageHandleTime: {
            before: baselineAvgHandleTime,
            after: currentAvgHandleTime,
            improvement: handleTimeImprovement
          },
          firstCallResolution: {
            before: baselineData.firstCallResolution,
            after: currentFCR,
            improvement: currentFCR - baselineData.firstCallResolution
          }
        },
        productivityMetrics: {
          conversationsPerAgent: {
            before: baselineConversationsPerAgent,
            after: currentConversationsPerAgent,
            improvement: currentConversationsPerAgent - baselineConversationsPerAgent
          },
          agentUtilization: {
            before: baselineAgentUtilization,
            after: currentAgentUtilization,
            improvement: currentAgentUtilization - baselineAgentUtilization
          }
        },
        scalabilityMetrics: {
          peakCapacityHandling: this.calculatePeakCapacityHandling(performanceData),
          elasticityImprovement: this.calculateElasticityImprovement(performanceData),
          resourceOptimization: this.calculateResourceOptimization(performanceData)
        }
      };
    } catch (error) {
      console.error('Error analyzing efficiency gains:', error);
      throw error;
    }
  }

  // Generate ROI Report
  async generateROIReport(reportType: 'monthly' | 'quarterly' | 'annual' | 'custom', periodStart: string, periodEnd: string): Promise<ROIReport> {
    try {
      const roiCalculation = await this.calculateROI(periodStart, periodEnd, 'system');
      const costSavings = await this.analyzeCostSavings(periodStart, periodEnd);
      const revenueImpact = await this.analyzeRevenueImpact(periodStart, periodEnd);
      const efficiencyGains = await this.analyzeEfficiencyGains(periodStart, periodEnd);
      const benchmarks = await this.generateBenchmarkComparison(roiCalculation);

      const report: ROIReport = {
        id: `roi_report_${Date.now()}`,
        reportType,
        period: {
          start: periodStart,
          end: periodEnd
        },
        executiveSummary: {
          totalROI: roiCalculation.calculatedROI.roiPercentage,
          paybackPeriod: roiCalculation.calculatedROI.paybackPeriodMonths,
          keyAchievements: this.generateKeyAchievements(roiCalculation, costSavings, revenueImpact),
          majorSavings: this.generateMajorSavings(costSavings),
          growthOpportunities: this.generateGrowthOpportunities(benchmarks)
        },
        costBenefitAnalysis: {
          totalInvestment: roiCalculation.calculatedROI.totalInvestment,
          totalBenefits: roiCalculation.calculatedROI.totalBenefits,
          netBenefit: roiCalculation.calculatedROI.netBenefit,
          benefitCostRatio: roiCalculation.calculatedROI.totalInvestment > 0 ? roiCalculation.calculatedROI.totalBenefits / roiCalculation.calculatedROI.totalInvestment : 0
        },
        performanceMetrics: {
          responseTimeImprovement: efficiencyGains.timeMetrics.averageHandleTime.improvement,
          resolutionRateImprovement: efficiencyGains.timeMetrics.firstCallResolution.improvement,
          satisfactionImprovement: roiCalculation.customerMetrics.satisfactionImprovement,
          automationRate: costSavings.automationImpact.conversationsAutomated / (costSavings.automationImpact.conversationsAutomated + 1000) // Simplified calculation
        },
        benchmarkComparison: benchmarks,
        recommendations: this.generateRecommendations(roiCalculation, benchmarks),
        projections: this.generateProjections(roiCalculation),
        generatedAt: new Date()
      };

      // Store report in database (you might want to create a reports table)
      await this.metricsCollector.recordEvent({
        type: 'roi_report_generated',
        value: report.executiveSummary.totalROI,
        dimensions: { 
          reportType, 
          periodStart, 
          periodEnd,
          paybackPeriod: report.executiveSummary.paybackPeriod.toString()
        },
        timestamp: new Date()
      });

      return report;
    } catch (error) {
      console.error('Error generating ROI report:', error);
      throw error;
    }
  }

  // Helper Methods
  private async getPerformanceDataForPeriod(periodStart: string, periodEnd: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('performance_metrics')
      .select('*')
      .gte('date', periodStart)
      .lte('date', periodEnd);

    if (error) throw error;
    return data || [];
  }

  private async calculateCostAnalysis(periodStart: string, periodEnd: string, performanceData: any[]): Promise<any> {
    const totalConversations = performanceData.reduce((sum, row) => sum + (row.total_conversations || 0), 0);
    const aiResolvedConversations = performanceData.reduce((sum, row) => sum + (row.ai_resolved_conversations || 0), 0);
    const humanResolvedConversations = performanceData.reduce((sum, row) => sum + (row.human_resolved_conversations || 0), 0);

    const avgAgentSalary = 50000; // $50k annual
    const hourlyRate = avgAgentSalary / (40 * 52); // $24/hour
    const avgHandleTime = 15; // 15 minutes per conversation

    const laborCostBefore = (totalConversations * avgHandleTime / 60) * hourlyRate;
    const laborCostAfter = (humanResolvedConversations * avgHandleTime / 60) * hourlyRate;
    const laborCostSavings = laborCostBefore - laborCostAfter;

    const aiOperationalCost = aiResolvedConversations * 0.50; // $0.50 per AI conversation
    const platformOperationalCost = totalConversations * 0.10; // $0.10 per conversation
    const trainingCost = 5000; // $5k training cost

    return {
      laborCostBefore,
      laborCostAfter,
      laborCostSavings,
      aiOperationalCost,
      platformOperationalCost,
      trainingCost
    };
  }

  private async calculateRevenueImpact(periodStart: string, periodEnd: string, performanceData: any[]): Promise<any> {
    // Simplified revenue impact calculation
    const totalConversations = performanceData.reduce((sum, row) => sum + (row.total_conversations || 0), 0);
    const avgRevenuePerConversation = 50; // $50 average revenue per conversation
    const conversionRateImprovement = 0.15; // 15% improvement in conversion rate

    const revenueBefore = totalConversations * avgRevenuePerConversation;
    const revenueAfter = totalConversations * avgRevenuePerConversation * (1 + conversionRateImprovement);
    const revenueIncrease = revenueAfter - revenueBefore;

    return {
      revenueBefore,
      revenueAfter,
      revenueIncrease
    };
  }

  private async calculateEfficiencyMetrics(periodStart: string, periodEnd: string, performanceData: any[]): Promise<any> {
    const aiResolvedConversations = performanceData.reduce((sum, row) => sum + (row.ai_resolved_conversations || 0), 0);
    const avgHandleTime = 15; // 15 minutes per conversation
    const timeSavedHours = (aiResolvedConversations * avgHandleTime) / 60;
    const productivityIncreasePercent = 40; // 40% productivity increase

    return {
      timeSavedHours,
      productivityIncreasePercent
    };
  }

  private async calculateCustomerMetrics(periodStart: string, periodEnd: string): Promise<any> {
    // Get satisfaction data
    const { data: satisfactionData, error } = await supabase
      .from('customer_satisfaction_surveys')
      .select('*')
      .gte('response_received_at', periodStart)
      .lte('response_received_at', periodEnd);

    if (error) throw error;

    const currentSatisfaction = satisfactionData
      .filter(s => s.csat_rating)
      .reduce((sum, s) => sum + s.csat_rating, 0) / satisfactionData.filter(s => s.csat_rating).length;

    const baselineSatisfaction = 3.5; // Baseline satisfaction
    const satisfactionImprovement = currentSatisfaction - baselineSatisfaction;
    const retentionRateImprovement = 0.10; // 10% improvement
    const lifetimeValueIncrease = 25000; // $25k increase in CLV

    return {
      satisfactionImprovement,
      retentionRateImprovement,
      lifetimeValueIncrease
    };
  }

  private async generateBenchmarkComparison(roiCalculation: ROICalculation): Promise<ROIBenchmark[]> {
    const benchmarks: ROIBenchmark[] = [];

    // ROI Percentage benchmark
    benchmarks.push({
      metric: 'ROI Percentage',
      industryAverage: this.INDUSTRY_BENCHMARKS.ROI_PERCENTAGE,
      currentValue: roiCalculation.calculatedROI.roiPercentage,
      performanceRating: this.getPerformanceRating(roiCalculation.calculatedROI.roiPercentage, this.INDUSTRY_BENCHMARKS.ROI_PERCENTAGE),
      improvementOpportunity: Math.max(0, this.INDUSTRY_BENCHMARKS.ROI_PERCENTAGE - roiCalculation.calculatedROI.roiPercentage),
      recommendations: this.getROIRecommendations(roiCalculation.calculatedROI.roiPercentage, this.INDUSTRY_BENCHMARKS.ROI_PERCENTAGE)
    });

    // Payback Period benchmark
    benchmarks.push({
      metric: 'Payback Period (Months)',
      industryAverage: this.INDUSTRY_BENCHMARKS.PAYBACK_PERIOD_MONTHS,
      currentValue: roiCalculation.calculatedROI.paybackPeriodMonths,
      performanceRating: this.getPerformanceRating(this.INDUSTRY_BENCHMARKS.PAYBACK_PERIOD_MONTHS, roiCalculation.calculatedROI.paybackPeriodMonths, true),
      improvementOpportunity: Math.max(0, roiCalculation.calculatedROI.paybackPeriodMonths - this.INDUSTRY_BENCHMARKS.PAYBACK_PERIOD_MONTHS),
      recommendations: this.getPaybackRecommendations(roiCalculation.calculatedROI.paybackPeriodMonths, this.INDUSTRY_BENCHMARKS.PAYBACK_PERIOD_MONTHS)
    });

    return benchmarks;
  }

  private getPerformanceRating(currentValue: number, benchmark: number, inverse: boolean = false): 'excellent' | 'good' | 'average' | 'below_average' | 'poor' {
    const ratio = inverse ? benchmark / currentValue : currentValue / benchmark;
    
    if (ratio >= 1.5) return 'excellent';
    if (ratio >= 1.2) return 'good';
    if (ratio >= 0.8) return 'average';
    if (ratio >= 0.6) return 'below_average';
    return 'poor';
  }

  private getROIRecommendations(currentROI: number, benchmarkROI: number): string[] {
    const recommendations: string[] = [];
    
    if (currentROI < benchmarkROI) {
      recommendations.push('Increase automation rate to reduce labor costs');
      recommendations.push('Improve AI accuracy to handle more complex queries');
      recommendations.push('Optimize agent productivity through better workflows');
    } else {
      recommendations.push('Maintain current performance levels');
      recommendations.push('Explore advanced automation opportunities');
    }
    
    return recommendations;
  }

  private getPaybackRecommendations(currentPayback: number, benchmarkPayback: number): string[] {
    const recommendations: string[] = [];
    
    if (currentPayback > benchmarkPayback) {
      recommendations.push('Accelerate implementation timeline');
      recommendations.push('Focus on high-impact, low-cost improvements');
      recommendations.push('Prioritize automation of repetitive tasks');
    } else {
      recommendations.push('Current payback period is excellent');
      recommendations.push('Consider expanding to additional use cases');
    }
    
    return recommendations;
  }

  private generateKeyAchievements(roiCalculation: ROICalculation, costSavings: CostSavingsAnalysis, revenueImpact: RevenueImpactAnalysis): string[] {
    return [
      `Achieved ${roiCalculation.calculatedROI.roiPercentage.toFixed(1)}% ROI`,
      `Saved $${costSavings.totalSavings.toLocaleString()} in operational costs`,
      `Generated $${revenueImpact.directRevenue.salesGenerated.toLocaleString()} in additional revenue`,
      `Automated ${costSavings.automationImpact.conversationsAutomated.toLocaleString()} conversations`
    ];
  }

  private generateMajorSavings(costSavings: CostSavingsAnalysis): string[] {
    return [
      `Labor cost savings: $${costSavings.savingsBreakdown.laborSavings.toLocaleString()}`,
      `Operational savings: $${costSavings.savingsBreakdown.operationalSavings.toLocaleString()}`,
      `Efficiency gains: $${costSavings.savingsBreakdown.efficiencySavings.toLocaleString()}`
    ];
  }

  private generateGrowthOpportunities(benchmarks: ROIBenchmark[]): string[] {
    return benchmarks
      .filter(b => b.improvementOpportunity > 0)
      .map(b => `Improve ${b.metric} by ${b.improvementOpportunity.toFixed(1)}%`);
  }

  private generateRecommendations(roiCalculation: ROICalculation, benchmarks: ROIBenchmark[]): any {
    return {
      immediate: ['Optimize current automation rules', 'Improve response time SLAs'],
      shortTerm: ['Expand AI capabilities', 'Enhance agent training programs'],
      longTerm: ['Implement advanced analytics', 'Scale to additional channels']
    };
  }

  private generateProjections(roiCalculation: ROICalculation): any {
    const currentROI = roiCalculation.calculatedROI.roiPercentage;
    return {
      nextQuarter: currentROI * 1.1,
      nextYear: currentROI * 1.3,
      threeYear: currentROI * 1.8
    };
  }

  // Additional helper methods would go here...
  private calculateEfficiencySavings(performanceData: any[]): number {
    return 5000; // Simplified calculation
  }

  private calculateScalingSavings(performanceData: any[]): number {
    return 3000; // Simplified calculation
  }

  private calculateImprovedConversions(conversations: any[]): number {
    return 15000; // Simplified calculation
  }

  private calculateReducedChurn(conversations: any[]): number {
    return 8000; // Simplified calculation
  }

  private calculateBrandValueIncrease(conversations: any[]): number {
    return 10000; // Simplified calculation
  }

  private async getBaselineRevenue(periodStart: string, periodEnd: string): Promise<any> {
    return { perConversation: 45 }; // Simplified baseline
  }

  private calculateConversionRate(conversations: any[], from: string, to: string): number {
    return 0.25; // 25% conversion rate
  }

  private calculateAverageOrderValue(conversations: any[]): number {
    return 250; // $250 AOV
  }

  private calculateCustomerLifetimeValue(conversations: any[]): number {
    return 2500; // $2500 CLV
  }

  private async getBaselinePerformanceData(periodStart: string, periodEnd: string): Promise<any> {
    return {
      avgHandleTime: 900, // 15 minutes in seconds
      conversationsPerAgent: 6,
      agentUtilization: 0.7,
      firstCallResolution: 0.65
    };
  }

  private calculateTotalTimeSaved(performanceData: any[], baselineData: any): number {
    return 500; // 500 hours saved
  }

  private calculateAgentUtilization(performanceData: any[]): number {
    return 0.85; // 85% utilization
  }

  private calculatePeakCapacityHandling(performanceData: any[]): number {
    return 1.4; // 40% improvement
  }

  private calculateElasticityImprovement(performanceData: any[]): number {
    return 1.6; // 60% improvement
  }

  private calculateResourceOptimization(performanceData: any[]): number {
    return 1.3; // 30% improvement
  }
}

export const roiCalculationService = ROICalculationService.getInstance();