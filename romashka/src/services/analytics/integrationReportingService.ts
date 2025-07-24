/**
 * Integration Reporting Service
 * Handles report generation, scheduled reports, and data exports for integration analytics
 */

import { supabase } from '../supabaseClient';
import { integrationAnalyticsService, IntegrationDashboardData } from './integrationAnalytics';

export interface ReportConfig {
  id: string;
  name: string;
  type: 'executive' | 'operational' | 'technical' | 'business_impact';
  format: 'pdf' | 'excel' | 'csv' | 'json';
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    day_of_week?: number;
    day_of_month?: number;
    time: string;
  };
  recipients: string[];
  filters: {
    time_range: string;
    integrations?: string[];
    metrics?: string[];
  };
  template_config: ReportTemplateConfig;
  is_active: boolean;
  created_by: string;
  created_at: string;
  last_generated?: string;
}

export interface ReportTemplateConfig {
  include_executive_summary: boolean;
  include_charts: boolean;
  include_detailed_metrics: boolean;
  include_recommendations: boolean;
  include_raw_data: boolean;
  branding?: {
    logo_url?: string;
    company_name: string;
    primary_color: string;
    secondary_color: string;
  };
}

export interface GeneratedReport {
  id: string;
  config_id: string;
  title: string;
  format: string;
  file_url: string;
  file_size_bytes: number;
  generation_time_ms: number;
  data_period: {
    start: string;
    end: string;
  };
  summary: ReportSummary;
  created_at: string;
}

export interface ReportSummary {
  total_integrations: number;
  overall_health_score: number;
  total_api_calls: number;
  success_rate: number;
  business_impact_roi: number;
  key_insights: string[];
  recommendations: string[];
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'json' | 'pdf';
  include_headers: boolean;
  date_format: 'iso' | 'local' | 'unix';
  filters?: {
    start_date?: string;
    end_date?: string;
    integrations?: string[];
    metrics?: string[];
  };
}

export class IntegrationReportingService {
  /**
   * Generate a comprehensive integration analytics report
   */
  async generateReport(
    userId: string,
    reportConfig: Partial<ReportConfig>
  ): Promise<GeneratedReport> {
    const startTime = Date.now();
    
    try {
      // Get dashboard data for the specified time range
      const dashboardData = await integrationAnalyticsService.getDashboardData(
        userId,
        reportConfig.filters?.time_range || '30d'
      );

      // Generate report based on type and format
      const reportContent = await this.buildReportContent(dashboardData, reportConfig);
      
      // Create file and upload
      const fileUrl = await this.saveReportFile(reportContent, reportConfig.format || 'pdf');
      
      const generatedReport: GeneratedReport = {
        id: this.generateReportId(),
        config_id: reportConfig.id || 'manual',
        title: reportConfig.name || `Integration Analytics Report - ${new Date().toLocaleDateString()}`,
        format: reportConfig.format || 'pdf',
        file_url: fileUrl,
        file_size_bytes: this.estimateFileSize(reportContent),
        generation_time_ms: Date.now() - startTime,
        data_period: {
          start: this.getTimeRangeStart(reportConfig.filters?.time_range || '30d'),
          end: new Date().toISOString()
        },
        summary: this.generateReportSummary(dashboardData),
        created_at: new Date().toISOString()
      };

      // Save report record
      await this.saveReportRecord(userId, generatedReport);

      return generatedReport;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  /**
   * Create a scheduled report configuration
   */
  async createScheduledReport(
    userId: string,
    config: Omit<ReportConfig, 'id' | 'created_by' | 'created_at'>
  ): Promise<string> {
    try {
      const reportConfig: ReportConfig = {
        ...config,
        id: this.generateReportId(),
        created_by: userId,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase!
        .from('scheduled_reports')
        .insert(reportConfig)
        .select()
        .single();

      if (error) throw error;

      return data.id;
    } catch (error) {
      console.error('Error creating scheduled report:', error);
      throw error;
    }
  }

  /**
   * Export integration data in various formats
   */
  async exportData(
    userId: string,
    dataType: 'query_metrics' | 'business_impact' | 'conversation_outcomes' | 'health_metrics',
    options: ExportOptions
  ): Promise<{ downloadUrl: string; fileName: string }> {
    try {
      const data = await this.fetchExportData(userId, dataType, options.filters);
      const exportContent = await this.formatExportData(data, options);
      
      const fileName = `${dataType}_export_${new Date().toISOString().split('T')[0]}.${options.format}`;
      const downloadUrl = await this.saveExportFile(exportContent, fileName, options.format);

      return { downloadUrl, fileName };
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  /**
   * Get available report templates
   */
  getReportTemplates(): Array<{
    id: string;
    name: string;
    description: string;
    type: string;
    preview_url?: string;
  }> {
    return [
      {
        id: 'executive_summary',
        name: 'Executive Summary',
        description: 'High-level overview for leadership with key metrics and ROI',
        type: 'executive'
      },
      {
        id: 'operational_dashboard',
        name: 'Operational Dashboard',
        description: 'Detailed operational metrics for IT and operations teams',
        type: 'operational'
      },
      {
        id: 'business_impact',
        name: 'Business Impact Analysis',
        description: 'Focus on ROI, cost savings, and business value metrics',
        type: 'business_impact'
      },
      {
        id: 'technical_deep_dive',
        name: 'Technical Deep Dive',
        description: 'Detailed technical metrics, API performance, and system health',
        type: 'technical'
      }
    ];
  }

  /**
   * Build report content based on configuration
   */
  private async buildReportContent(
    dashboardData: IntegrationDashboardData,
    config: Partial<ReportConfig>
  ): Promise<any> {
    const content: any = {
      metadata: {
        title: config.name || 'Integration Analytics Report',
        generated_at: new Date().toISOString(),
        period: config.filters?.time_range || '30d',
        type: config.type || 'executive'
      }
    };

    // Executive Summary
    if (config.template_config?.include_executive_summary !== false) {
      content.executive_summary = {
        overall_health_score: dashboardData.integrationHealth.overall_health_score,
        total_roi: dashboardData.businessImpact.total_roi,
        query_success_rate: dashboardData.aiPerformance.query_success_rate,
        data_utilization_rate: dashboardData.conversationIntelligence.data_utilization_rate,
        key_insights: this.generateKeyInsights(dashboardData),
        recommendations: this.generateRecommendations(dashboardData)
      };
    }

    // Detailed Metrics
    if (config.template_config?.include_detailed_metrics !== false) {
      content.detailed_metrics = {
        integration_health: dashboardData.integrationHealth,
        ai_performance: dashboardData.aiPerformance,
        business_impact: dashboardData.businessImpact,
        conversation_intelligence: dashboardData.conversationIntelligence
      };
    }

    // Charts and Visualizations
    if (config.template_config?.include_charts) {
      content.charts = await this.generateChartData(dashboardData);
    }

    // Raw Data
    if (config.template_config?.include_raw_data) {
      content.raw_data = await this.fetchRawData(config.filters);
    }

    return content;
  }

  /**
   * Generate key insights from dashboard data
   */
  private generateKeyInsights(data: IntegrationDashboardData): string[] {
    const insights: string[] = [];

    // Health insights
    const healthScore = data.integrationHealth.overall_health_score;
    if (healthScore > 0.9) {
      insights.push('All integrations are performing excellently with minimal issues');
    } else if (healthScore > 0.7) {
      insights.push('Integrations are generally healthy with some areas for improvement');
    } else {
      insights.push('Integration health requires attention - multiple issues detected');
    }

    // Performance insights
    const querySuccessRate = data.aiPerformance.query_success_rate;
    if (querySuccessRate > 0.95) {
      insights.push('AI queries are highly successful, indicating good data quality');
    } else if (querySuccessRate < 0.8) {
      insights.push('AI query success rate is below optimal - data quality issues may exist');
    }

    // Business impact insights
    const roi = data.businessImpact.total_roi;
    if (roi > 20) {
      insights.push('Integration ROI is exceptional, delivering significant business value');
    } else if (roi > 10) {
      insights.push('Integration ROI is positive and meeting expectations');
    } else if (roi > 0) {
      insights.push('Integration ROI is positive but has room for improvement');
    } else {
      insights.push('Integration ROI is negative - review cost-benefit analysis');
    }

    return insights;
  }

  /**
   * Generate recommendations based on data
   */
  private generateRecommendations(data: IntegrationDashboardData): string[] {
    const recommendations: string[] = [];

    // Health-based recommendations
    const unhealthyIntegrations = data.integrationHealth.integrations.filter(i => i.status !== 'healthy');
    if (unhealthyIntegrations.length > 0) {
      recommendations.push(`Address issues with ${unhealthyIntegrations.map(i => i.provider).join(', ')} integrations`);
    }

    // Performance-based recommendations
    if (data.aiPerformance.avg_response_time_ms > 1000) {
      recommendations.push('Optimize API response times to improve user experience');
    }

    // Data utilization recommendations
    if (data.conversationIntelligence.data_utilization_rate < 0.5) {
      recommendations.push('Increase integration data utilization in conversations');
    }

    // Business impact recommendations
    if (data.businessImpact.total_roi < 15) {
      recommendations.push('Focus on high-ROI integration features to maximize business value');
    }

    return recommendations;
  }

  /**
   * Generate chart data for visualizations
   */
  private async generateChartData(data: IntegrationDashboardData): Promise<any> {
    return {
      health_trends: data.integrationHealth.sync_trends,
      performance_trends: data.aiPerformance.performance_trends,
      data_type_usage: data.aiPerformance.most_valuable_data_types,
      efficiency_gains: data.businessImpact.efficiency_gains
    };
  }

  /**
   * Fetch raw data for detailed analysis
   */
  private async fetchRawData(filters?: any): Promise<any> {
    // TODO: Implement raw data fetching based on filters
    return {};
  }

  /**
   * Save report file and return URL
   */
  private async saveReportFile(content: any, format: string): Promise<string> {
    // TODO: Implement file saving to cloud storage
    return `https://storage.example.com/reports/${this.generateReportId()}.${format}`;
  }

  /**
   * Save export file and return URL
   */
  private async saveExportFile(content: any, fileName: string, format: string): Promise<string> {
    // TODO: Implement export file saving
    return `https://storage.example.com/exports/${fileName}`;
  }

  /**
   * Format data for export
   */
  private async formatExportData(data: any[], options: ExportOptions): Promise<any> {
    switch (options.format) {
      case 'csv':
        return this.formatAsCSV(data, options);
      case 'excel':
        return this.formatAsExcel(data, options);
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'pdf':
        return this.formatAsPDF(data, options);
      default:
        return data;
    }
  }

  /**
   * Format data as CSV
   */
  private formatAsCSV(data: any[], options: ExportOptions): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvContent = [
      options.include_headers ? headers.join(',') : '',
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        }).join(',')
      )
    ].filter(Boolean).join('\n');

    return csvContent;
  }

  /**
   * Format data as Excel
   */
  private formatAsExcel(data: any[], options: ExportOptions): any {
    // TODO: Implement Excel formatting
    return data;
  }

  /**
   * Format data as PDF
   */
  private formatAsPDF(data: any[], options: ExportOptions): any {
    // TODO: Implement PDF formatting
    return data;
  }

  /**
   * Fetch export data based on type and filters
   */
  private async fetchExportData(userId: string, dataType: string, filters?: any): Promise<any[]> {
    let tableName = '';
    
    switch (dataType) {
      case 'query_metrics':
        tableName = 'integration_query_metrics';
        break;
      case 'business_impact':
        tableName = 'business_impact_metrics';
        break;
      case 'conversation_outcomes':
        tableName = 'conversation_outcomes';
        break;
      case 'health_metrics':
        tableName = 'integration_health_metrics';
        break;
      default:
        throw new Error(`Unknown data type: ${dataType}`);
    }

    let query = supabase!.from(tableName).select('*').eq('user_id', userId);

    if (filters?.start_date) {
      query = query.gte('created_at', filters.start_date);
    }
    if (filters?.end_date) {
      query = query.lte('created_at', filters.end_date);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  }

  /**
   * Save report record to database
   */
  private async saveReportRecord(userId: string, report: GeneratedReport): Promise<void> {
    const { error } = await supabase!
      .from('generated_reports')
      .insert({
        ...report,
        user_id: userId
      });

    if (error) throw error;
  }

  /**
   * Generate report summary
   */
  private generateReportSummary(data: IntegrationDashboardData): ReportSummary {
    return {
      total_integrations: data.integrationHealth.integrations.length,
      overall_health_score: data.integrationHealth.overall_health_score,
      total_api_calls: data.realTimeMetrics.api_calls_per_minute * 1440, // Estimate daily calls
      success_rate: data.aiPerformance.query_success_rate,
      business_impact_roi: data.businessImpact.total_roi,
      key_insights: this.generateKeyInsights(data),
      recommendations: this.generateRecommendations(data)
    };
  }

  /**
   * Helper methods
   */
  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private estimateFileSize(content: any): number {
    return JSON.stringify(content).length * 2; // Rough estimate
  }

  private getTimeRangeStart(timeRange: string): string {
    const days = parseInt(timeRange.replace('d', ''));
    const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
    return startDate.toISOString();
  }
}

export const integrationReportingService = new IntegrationReportingService();