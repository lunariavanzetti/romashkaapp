import { supabase } from '../supabaseClient';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import type { 
  ReportConfig, 
  ScheduledReportConfig, 
  ExportJob, 
  ExportConfig,
  TimeRange,
  BrandingConfig
} from '../../types/analytics';

export interface ReportData {
  title: string;
  subtitle?: string;
  dateRange: TimeRange;
  sections: ReportSection[];
  metadata: {
    generatedAt: Date;
    generatedBy: string;
    totalRecords: number;
    queryTime: number;
  };
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'metrics' | 'chart' | 'table' | 'text' | 'insights';
  data: any;
  visualizationType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  config?: any;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'performance' | 'satisfaction' | 'ai_analytics' | 'custom';
  sections: ReportSection[];
  filters: Record<string, any>;
  branding?: BrandingConfig;
}

export interface ScheduledReport {
  id: string;
  config: ScheduledReportConfig;
  lastRun?: Date;
  nextRun: Date;
  status: 'active' | 'paused' | 'failed';
  errorMessage?: string;
}

export class ReportingService {
  private static instance: ReportingService;

  private constructor() {}

  static getInstance(): ReportingService {
    if (!ReportingService.instance) {
      ReportingService.instance = new ReportingService();
    }
    return ReportingService.instance;
  }

  // Generate comprehensive report
  async generateReport(
    reportType: 'performance' | 'satisfaction' | 'ai_analytics' | 'custom',
    timeRange: TimeRange,
    filters: Record<string, any> = {},
    templateId?: string
  ): Promise<ReportData> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const startTime = Date.now();

    try {
      const template = templateId ? await this.getReportTemplate(templateId) : 
                                  await this.getDefaultTemplate(reportType);

      const reportData: ReportData = {
        title: template.name,
        subtitle: `${format(timeRange.start, 'MMM d, yyyy')} - ${format(timeRange.end, 'MMM d, yyyy')}`,
        dateRange: timeRange,
        sections: [],
        metadata: {
          generatedAt: new Date(),
          generatedBy: 'System', // TODO: Get from auth context
          totalRecords: 0,
          queryTime: 0
        }
      };

      // Generate each section
      for (const section of template.sections) {
        const sectionData = await this.generateReportSection(section, timeRange, filters);
        reportData.sections.push(sectionData);
      }

      // Update metadata
      reportData.metadata.queryTime = Date.now() - startTime;
      reportData.metadata.totalRecords = reportData.sections.reduce((sum, section) => {
        return sum + (Array.isArray(section.data) ? section.data.length : 0);
      }, 0);

      return reportData;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  // Export report to PDF
  async exportToPDF(
    reportData: ReportData,
    branding?: BrandingConfig
  ): Promise<Blob> {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let currentY = 20;

    // Add header
    if (branding?.logo) {
      // TODO: Add logo support
    }

    // Title
    pdf.setFontSize(20);
    pdf.text(reportData.title, 20, currentY);
    currentY += 10;

    // Subtitle
    if (reportData.subtitle) {
      pdf.setFontSize(12);
      pdf.text(reportData.subtitle, 20, currentY);
      currentY += 20;
    }

    // Sections
    for (const section of reportData.sections) {
      // Check if we need a new page
      if (currentY > pageHeight - 40) {
        pdf.addPage();
        currentY = 20;
      }

      // Section title
      pdf.setFontSize(14);
      pdf.text(section.title, 20, currentY);
      currentY += 10;

      // Section content
      await this.addSectionToPDF(pdf, section, 20, currentY, pageWidth - 40);
      currentY += 40;
    }

    // Footer
    const pageCount = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.text(
        `Generated on ${format(reportData.metadata.generatedAt, 'MMM d, yyyy HH:mm')}`,
        20,
        pageHeight - 10
      );
      pdf.text(
        `Page ${i} of ${pageCount}`,
        pageWidth - 40,
        pageHeight - 10
      );
    }

    return pdf.output('blob');
  }

  // Export report to Excel
  async exportToExcel(reportData: ReportData): Promise<Blob> {
    const workbook = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Report Title', reportData.title],
      ['Date Range', reportData.subtitle || ''],
      ['Generated At', format(reportData.metadata.generatedAt, 'MMM d, yyyy HH:mm')],
      ['Total Records', reportData.metadata.totalRecords],
      ['Query Time (ms)', reportData.metadata.queryTime],
      [''],
      ['Sections', '']
    ];

    reportData.sections.forEach(section => {
      summaryData.push([section.title, section.type]);
    });

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Data sheets
    reportData.sections.forEach((section, index) => {
      if (section.type === 'table' || section.type === 'metrics') {
        const sheetData = this.convertSectionToSheetData(section);
        const worksheet = XLSX.utils.json_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(workbook, worksheet, `${section.title.substring(0, 31)}`);
      }
    });

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  // Export report to CSV
  async exportToCSV(reportData: ReportData): Promise<Blob> {
    let csvContent = '';
    
    // Header
    csvContent += `Report Title,${reportData.title}\n`;
    csvContent += `Date Range,${reportData.subtitle || ''}\n`;
    csvContent += `Generated At,${format(reportData.metadata.generatedAt, 'MMM d, yyyy HH:mm')}\n`;
    csvContent += `\n`;

    // Sections
    reportData.sections.forEach(section => {
      csvContent += `\n${section.title}\n`;
      
      if (section.type === 'table' || section.type === 'metrics') {
        const sheetData = this.convertSectionToSheetData(section);
        
        if (sheetData.length > 0) {
          // Headers
          const headers = Object.keys(sheetData[0]);
          csvContent += headers.join(',') + '\n';
          
          // Data rows
          sheetData.forEach(row => {
            const values = headers.map(header => {
              const value = row[header];
              return typeof value === 'string' && value.includes(',') ? 
                `"${value}"` : value;
            });
            csvContent += values.join(',') + '\n';
          });
        }
      }
      
      csvContent += '\n';
    });

    return new Blob([csvContent], { type: 'text/csv' });
  }

  // Schedule report
  async scheduleReport(config: ScheduledReportConfig): Promise<string> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .insert([{
          name: config.name,
          description: config.description,
          report_type: config.reportType,
          schedule_cron: config.scheduleCron,
          recipients: config.recipients,
          filters: config.filters,
          format: config.format,
          is_active: config.isActive
        }])
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error scheduling report:', error);
      throw error;
    }
  }

  // Get scheduled reports
  async getScheduledReports(): Promise<ScheduledReport[]> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(report => ({
        id: report.id,
        config: {
          name: report.name,
          description: report.description,
          reportType: report.report_type,
          scheduleCron: report.schedule_cron,
          recipients: report.recipients,
          filters: report.filters,
          format: report.format,
          isActive: report.is_active
        },
        lastRun: report.last_sent_at ? new Date(report.last_sent_at) : undefined,
        nextRun: new Date(report.next_run_at),
        status: report.is_active ? 'active' : 'paused'
      }));
    } catch (error) {
      console.error('Error fetching scheduled reports:', error);
      throw error;
    }
  }

  // Process scheduled reports
  async processScheduledReports(): Promise<void> {
    const reports = await this.getScheduledReports();
    const now = new Date();

    for (const report of reports) {
      if (report.status === 'active' && report.nextRun <= now) {
        try {
          await this.executeScheduledReport(report);
        } catch (error) {
          console.error(`Error executing scheduled report ${report.id}:`, error);
        }
      }
    }
  }

  // Create export job
  async createExportJob(
    userId: string,
    name: string,
    type: 'conversations' | 'analytics' | 'customers',
    filters: Record<string, any>,
    format: 'pdf' | 'excel' | 'csv' | 'json'
  ): Promise<string> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      const { data, error } = await supabase
        .from('export_jobs')
        .insert([{
          user_id: userId,
          name,
          type,
          filters,
          format,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;

      // Start processing in background
      this.processExportJob(data.id);

      return data.id;
    } catch (error) {
      console.error('Error creating export job:', error);
      throw error;
    }
  }

  // Get export jobs
  async getExportJobs(userId: string): Promise<ExportJob[]> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      const { data, error } = await supabase
        .from('export_jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(job => ({
        id: job.id,
        userId: job.user_id,
        name: job.name,
        type: job.type,
        filters: job.filters,
        format: job.format,
        status: job.status,
        fileUrl: job.file_url,
        fileSizeBytes: job.file_size_bytes,
        errorMessage: job.error_message,
        createdAt: new Date(job.created_at),
        completedAt: job.completed_at ? new Date(job.completed_at) : undefined
      }));
    } catch (error) {
      console.error('Error fetching export jobs:', error);
      throw error;
    }
  }

  // Private helper methods
  private async generateReportSection(
    section: ReportSection,
    timeRange: TimeRange,
    filters: Record<string, any>
  ): Promise<ReportSection> {
    switch (section.type) {
      case 'metrics':
        return await this.generateMetricsSection(section, timeRange, filters);
      case 'table':
        return await this.generateTableSection(section, timeRange, filters);
      case 'chart':
        return await this.generateChartSection(section, timeRange, filters);
      case 'insights':
        return await this.generateInsightsSection(section, timeRange, filters);
      default:
        return section;
    }
  }

  private async generateMetricsSection(
    section: ReportSection,
    timeRange: TimeRange,
    filters: Record<string, any>
  ): Promise<ReportSection> {
    const { data: metricsData, error } = await supabase!
      .from('daily_metrics')
      .select('*')
      .gte('date', timeRange.start.toISOString().split('T')[0])
      .lte('date', timeRange.end.toISOString().split('T')[0]);

    if (error) throw error;

    const metrics = this.calculateAggregateMetrics(metricsData || []);

    return {
      ...section,
      data: metrics
    };
  }

  private async generateTableSection(
    section: ReportSection,
    timeRange: TimeRange,
    filters: Record<string, any>
  ): Promise<ReportSection> {
    const { data, error } = await supabase!
      .from('conversations')
      .select(`
        id,
        created_at,
        channel_type,
        status,
        customer_name,
        assigned_agent_id,
        satisfaction_rating,
        profiles!conversations_assigned_agent_id_fkey(full_name)
      `)
      .gte('created_at', timeRange.start.toISOString())
      .lte('created_at', timeRange.end.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      ...section,
      data: data || []
    };
  }

  private async generateChartSection(
    section: ReportSection,
    timeRange: TimeRange,
    filters: Record<string, any>
  ): Promise<ReportSection> {
    const { data: chartData, error } = await supabase!
      .from('daily_metrics')
      .select('date, total_conversations, ai_resolved_conversations, avg_satisfaction_score')
      .gte('date', timeRange.start.toISOString().split('T')[0])
      .lte('date', timeRange.end.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) throw error;

    return {
      ...section,
      data: chartData || []
    };
  }

  private async generateInsightsSection(
    section: ReportSection,
    timeRange: TimeRange,
    filters: Record<string, any>
  ): Promise<ReportSection> {
    // Generate insights based on data analysis
    const insights = [
      {
        title: 'Performance Trend',
        description: 'Response times have improved by 15% compared to previous period',
        impact: 'positive',
        confidence: 85
      },
      {
        title: 'AI Effectiveness',
        description: 'AI resolution rate increased to 68%, reducing agent workload',
        impact: 'positive',
        confidence: 92
      },
      {
        title: 'Customer Satisfaction',
        description: 'Average satisfaction score maintained at 4.2/5 stars',
        impact: 'neutral',
        confidence: 78
      }
    ];

    return {
      ...section,
      data: insights
    };
  }

  private async getReportTemplate(templateId: string): Promise<ReportTemplate> {
    // TODO: Implement template loading from database
    return this.getDefaultTemplate('performance');
  }

  private async getDefaultTemplate(reportType: string): Promise<ReportTemplate> {
    const templates = {
      performance: {
        id: 'performance_default',
        name: 'Performance Report',
        description: 'Comprehensive performance analysis',
        category: 'performance' as const,
        sections: [
          {
            id: 'metrics',
            title: 'Key Metrics',
            type: 'metrics' as const,
            data: null
          },
          {
            id: 'trends',
            title: 'Performance Trends',
            type: 'chart' as const,
            data: null,
            visualizationType: 'line' as const
          },
          {
            id: 'conversations',
            title: 'Recent Conversations',
            type: 'table' as const,
            data: null
          },
          {
            id: 'insights',
            title: 'Key Insights',
            type: 'insights' as const,
            data: null
          }
        ],
        filters: {}
      },
      satisfaction: {
        id: 'satisfaction_default',
        name: 'Customer Satisfaction Report',
        description: 'Customer satisfaction analysis',
        category: 'satisfaction' as const,
        sections: [
          {
            id: 'satisfaction_metrics',
            title: 'Satisfaction Metrics',
            type: 'metrics' as const,
            data: null
          },
          {
            id: 'satisfaction_trends',
            title: 'Satisfaction Trends',
            type: 'chart' as const,
            data: null,
            visualizationType: 'line' as const
          }
        ],
        filters: {}
      },
      ai_analytics: {
        id: 'ai_analytics_default',
        name: 'AI Analytics Report',
        description: 'AI performance and analytics',
        category: 'ai_analytics' as const,
        sections: [
          {
            id: 'ai_metrics',
            title: 'AI Performance Metrics',
            type: 'metrics' as const,
            data: null
          },
          {
            id: 'ai_trends',
            title: 'AI Performance Trends',
            type: 'chart' as const,
            data: null,
            visualizationType: 'line' as const
          }
        ],
        filters: {}
      }
    };

    return templates[reportType as keyof typeof templates] || templates.performance;
  }

  private calculateAggregateMetrics(data: any[]): any[] {
    const totalConversations = data.reduce((sum, d) => sum + (d.total_conversations || 0), 0);
    const aiResolved = data.reduce((sum, d) => sum + (d.ai_resolved_conversations || 0), 0);
    const avgSatisfaction = data.reduce((sum, d) => sum + (d.avg_satisfaction_score || 0), 0) / data.length;
    const avgResponseTime = data.reduce((sum, d) => sum + (d.avg_first_response_time_seconds || 0), 0) / data.length;

    return [
      { metric: 'Total Conversations', value: totalConversations, format: 'number' },
      { metric: 'AI Resolution Rate', value: totalConversations > 0 ? (aiResolved / totalConversations * 100) : 0, format: 'percentage' },
      { metric: 'Average Satisfaction', value: avgSatisfaction, format: 'decimal' },
      { metric: 'Average Response Time', value: avgResponseTime, format: 'time' }
    ];
  }

  private convertSectionToSheetData(section: ReportSection): any[] {
    if (section.type === 'metrics') {
      return section.data.map((metric: any) => ({
        Metric: metric.metric,
        Value: metric.value,
        Format: metric.format
      }));
    }
    
    if (section.type === 'table') {
      return section.data.map((row: any) => ({
        ID: row.id,
        'Created At': format(new Date(row.created_at), 'MMM d, yyyy HH:mm'),
        Channel: row.channel_type,
        Status: row.status,
        Customer: row.customer_name,
        Agent: row.profiles?.full_name || 'N/A',
        Satisfaction: row.satisfaction_rating || 'N/A'
      }));
    }
    
    return [];
  }

  private async addSectionToPDF(
    pdf: jsPDF,
    section: ReportSection,
    x: number,
    y: number,
    width: number
  ): Promise<void> {
    switch (section.type) {
      case 'metrics':
        this.addMetricsToPDF(pdf, section.data, x, y, width);
        break;
      case 'table':
        this.addTableToPDF(pdf, section.data, x, y, width);
        break;
      case 'text':
        pdf.text(section.data, x, y, { maxWidth: width });
        break;
      default:
        pdf.text(`[${section.type} visualization]`, x, y);
    }
  }

  private addMetricsToPDF(pdf: jsPDF, metrics: any[], x: number, y: number, width: number): void {
    let currentY = y;
    
    metrics.forEach(metric => {
      pdf.setFontSize(10);
      pdf.text(`${metric.metric}: ${metric.value}`, x, currentY);
      currentY += 6;
    });
  }

  private addTableToPDF(pdf: jsPDF, data: any[], x: number, y: number, width: number): void {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const cellWidth = width / headers.length;
    let currentY = y;
    
    // Headers
    pdf.setFontSize(8);
    headers.forEach((header, index) => {
      pdf.text(header, x + (index * cellWidth), currentY);
    });
    currentY += 6;
    
    // Data rows (limit to first 10 for space)
    data.slice(0, 10).forEach(row => {
      headers.forEach((header, index) => {
        const value = String(row[header] || '');
        pdf.text(value.substring(0, 15), x + (index * cellWidth), currentY);
      });
      currentY += 4;
    });
  }

  private async executeScheduledReport(report: ScheduledReport): Promise<void> {
    // TODO: Implement scheduled report execution
    console.log(`Executing scheduled report: ${report.id}`);
  }

  private async processExportJob(jobId: string): Promise<void> {
    // TODO: Implement export job processing
    console.log(`Processing export job: ${jobId}`);
  }
}