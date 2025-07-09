import puppeteer, { Browser, Page } from 'puppeteer';
import * as XLSX from 'xlsx';
import { supabase } from './supabaseClient';
import { analyticsEngine } from './analytics/analyticsEngine';
import { metricsCollector } from './analytics/metricsCollector';
import type { 
  ReportConfig, 
  ScheduledReportConfig, 
  BrandingConfig, 
  ExportJob,
  AnalyticsQuery 
} from '../types/analytics';

export class ReportGenerator {
  private static instance: ReportGenerator;
  private browser: Browser | null = null;

  private constructor() {}

  static getInstance(): ReportGenerator {
    if (!ReportGenerator.instance) {
      ReportGenerator.instance = new ReportGenerator();
    }
    return ReportGenerator.instance;
  }

  async initializeBrowser(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async generateReport(config: ReportConfig, filters: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('Starting report generation:', config.type);
      
      // Fetch data based on report configuration
      const reportData = await this.fetchReportData(config, filters);
      
      switch (config.format) {
        case 'pdf':
          return await this.generatePDFReport(config, reportData);
        case 'excel':
          return await this.generateExcelReport(config, reportData);
        case 'csv':
          return await this.generateCSVReport(config, reportData);
        default:
          throw new Error(`Unsupported format: ${config.format}`);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  private async fetchReportData(config: ReportConfig, filters: any): Promise<any> {
    const data: any = {
      sections: [],
      metadata: {
        generatedAt: new Date().toISOString(),
        title: config.data.title,
        description: config.data.description,
        filters
      }
    };

    // Process each section
    for (const section of config.data.sections) {
      const sectionData = await this.fetchSectionData(section, filters);
      data.sections.push({
        ...section,
        data: sectionData
      });
    }

    return data;
  }

  private async fetchSectionData(section: any, filters: any): Promise<any> {
    switch (section.type) {
      case 'kpi':
        return await this.fetchKPIData(section, filters);
      case 'chart':
        return await this.fetchChartData(section, filters);
      case 'table':
        return await this.fetchTableData(section, filters);
      case 'text':
        return { content: section.config.content || '' };
      default:
        return {};
    }
  }

  private async fetchKPIData(section: any, filters: any): Promise<any> {
    const metrics = section.config.metrics || ['activeConversations', 'satisfactionScore', 'aiResolutionRate'];
    const kpis = [];

    for (const metric of metrics) {
      const query: AnalyticsQuery = {
        metrics: [metric],
        dimensions: [],
        filters: filters,
        timeRange: {
          start: new Date(filters.timeRange.start),
          end: new Date(filters.timeRange.end),
          label: 'Report Period'
        },
        granularity: 'day'
      };

      const result = await analyticsEngine.calculateMetrics(query);
      
      kpis.push({
        name: metric,
        value: result.summary[metric] || 0,
        trend: this.calculateTrend(result.trends),
        format: this.getMetricFormat(metric)
      });
    }

    return { kpis };
  }

  private async fetchChartData(section: any, filters: any): Promise<any> {
    const metric = section.config.metric || 'conversationsByChannel';
    const chartType = section.config.chartType || 'line';
    
    const query: AnalyticsQuery = {
      metrics: [metric],
      dimensions: section.config.dimension ? [section.config.dimension] : [],
      filters: filters,
      timeRange: {
        start: new Date(filters.timeRange.start),
        end: new Date(filters.timeRange.end),
        label: 'Report Period'
      },
      granularity: 'day'
    };

    const result = await analyticsEngine.calculateMetrics(query);
    
    return {
      type: chartType,
      data: result.data,
      trends: result.trends,
      summary: result.summary
    };
  }

  private async fetchTableData(section: any, filters: any): Promise<any> {
    const columns = section.config.columns || ['customer', 'channel', 'status'];
    const dataSource = section.config.dataSource || 'conversations';
    
    let query = supabase
      .from(dataSource)
      .select('*')
      .limit(100);

    // Apply filters
    if (filters.timeRange.start && filters.timeRange.end) {
      query = query
        .gte('created_at', filters.timeRange.start)
        .lte('created_at', filters.timeRange.end);
    }

    if (filters.channels && filters.channels.length > 0) {
      query = query.in('channel', filters.channels);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching table data:', error);
      return { columns, rows: [] };
    }

    return {
      columns,
      rows: data || []
    };
  }

  private async generatePDFReport(config: ReportConfig, reportData: any): Promise<{ success: boolean; data?: any; error?: string }> {
    await this.initializeBrowser();
    
    if (!this.browser) {
      throw new Error('Failed to initialize browser');
    }

    const page = await this.browser.newPage();
    
    try {
      // Generate HTML content
      const html = this.generateReportHTML(config, reportData);
      
      // Set viewport and load content
      await page.setViewport({ width: 1200, height: 800 });
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      // Generate PDF
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        }
      });
      
      return { success: true, data: pdf };
    } catch (error) {
      console.error('Error generating PDF:', error);
      return { success: false, error: error.message };
    } finally {
      await page.close();
    }
  }

  private generateReportHTML(config: ReportConfig, reportData: any): string {
    const branding = config.branding || {} as BrandingConfig;
    
    const styles = `
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #fff;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 2px solid ${branding.colors?.primary || '#3B82F6'};
        }
        .logo {
          max-height: 60px;
          margin-bottom: 20px;
        }
        .title {
          font-size: 28px;
          font-weight: bold;
          color: ${branding.colors?.primary || '#3B82F6'};
          margin: 0;
        }
        .description {
          font-size: 16px;
          color: #666;
          margin-top: 10px;
        }
        .section {
          margin-bottom: 40px;
          page-break-inside: avoid;
        }
        .section-title {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 20px;
          color: ${branding.colors?.primary || '#3B82F6'};
        }
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .kpi-card {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          border: 1px solid #e9ecef;
        }
        .kpi-value {
          font-size: 32px;
          font-weight: bold;
          color: ${branding.colors?.primary || '#3B82F6'};
        }
        .kpi-label {
          font-size: 14px;
          color: #666;
          margin-top: 5px;
        }
        .chart-placeholder {
          background: #f8f9fa;
          padding: 40px;
          text-align: center;
          border-radius: 8px;
          color: #666;
          margin-bottom: 20px;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .table th,
        .table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e9ecef;
        }
        .table th {
          background: #f8f9fa;
          font-weight: bold;
          color: ${branding.colors?.primary || '#3B82F6'};
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
          text-align: center;
          color: #666;
          font-size: 14px;
        }
        .text-content {
          line-height: 1.6;
          color: #333;
        }
        .spacer {
          height: 20px;
        }
      </style>
    `;

    const headerHTML = `
      <div class="header">
        ${branding.logo ? `<img src="${branding.logo}" alt="Logo" class="logo">` : ''}
        <h1 class="title">${config.data.title}</h1>
        ${config.data.description ? `<p class="description">${config.data.description}</p>` : ''}
        <p class="description">Generated on ${new Date().toLocaleDateString()}</p>
      </div>
    `;

    const sectionsHTML = reportData.sections.map((section: any) => {
      switch (section.type) {
        case 'kpi':
          return this.generateKPIHTML(section);
        case 'chart':
          return this.generateChartHTML(section);
        case 'table':
          return this.generateTableHTML(section);
        case 'text':
          return this.generateTextHTML(section);
        case 'spacer':
          return '<div class="spacer"></div>';
        default:
          return '';
      }
    }).join('');

    const footerHTML = `
      <div class="footer">
        ${branding.companyName ? `<p>${branding.companyName}</p>` : ''}
        ${branding.contactInfo ? `<p>${branding.contactInfo}</p>` : ''}
        <p>Report generated by Romashka Analytics Platform</p>
      </div>
    `;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${config.data.title}</title>
          ${styles}
        </head>
        <body>
          ${headerHTML}
          ${sectionsHTML}
          ${footerHTML}
        </body>
      </html>
    `;
  }

  private generateKPIHTML(section: any): string {
    const kpis = section.data.kpis || [];
    
    const kpiCards = kpis.map((kpi: any) => `
      <div class="kpi-card">
        <div class="kpi-value">${this.formatValue(kpi.value, kpi.format)}</div>
        <div class="kpi-label">${kpi.name}</div>
      </div>
    `).join('');

    return `
      <div class="section">
        <h2 class="section-title">${section.title}</h2>
        <div class="kpi-grid">
          ${kpiCards}
        </div>
      </div>
    `;
  }

  private generateChartHTML(section: any): string {
    return `
      <div class="section">
        <h2 class="section-title">${section.title}</h2>
        <div class="chart-placeholder">
          ${section.data.type.charAt(0).toUpperCase() + section.data.type.slice(1)} Chart
          <br>
          <small>Data points: ${section.data.data?.length || 0}</small>
        </div>
      </div>
    `;
  }

  private generateTableHTML(section: any): string {
    const { columns, rows } = section.data;
    
    const headerRow = columns.map((col: string) => `<th>${col}</th>`).join('');
    const dataRows = rows.slice(0, 20).map((row: any) => {
      const cells = columns.map((col: string) => `<td>${row[col] || '-'}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    return `
      <div class="section">
        <h2 class="section-title">${section.title}</h2>
        <table class="table">
          <thead>
            <tr>${headerRow}</tr>
          </thead>
          <tbody>
            ${dataRows}
          </tbody>
        </table>
        ${rows.length > 20 ? `<p><em>Showing first 20 of ${rows.length} rows</em></p>` : ''}
      </div>
    `;
  }

  private generateTextHTML(section: any): string {
    return `
      <div class="section">
        <h2 class="section-title">${section.title}</h2>
        <div class="text-content">
          ${section.data.content || ''}
        </div>
      </div>
    `;
  }

  private async generateExcelReport(config: ReportConfig, reportData: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const workbook = XLSX.utils.book_new();
      
      // Create summary sheet
      const summaryData = [
        ['Report Title', config.data.title],
        ['Generated', new Date().toLocaleDateString()],
        ['Description', config.data.description || ''],
        [''],
        ['Filters Applied:'],
        ['Time Range', `${reportData.metadata.filters.timeRange.start} - ${reportData.metadata.filters.timeRange.end}`],
        ['Channels', reportData.metadata.filters.channels.join(', ') || 'All'],
        ['']
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      
      // Create sheets for each section
      for (const section of reportData.sections) {
        if (section.type === 'kpi') {
          this.addKPISheet(workbook, section);
        } else if (section.type === 'table') {
          this.addTableSheet(workbook, section);
        } else if (section.type === 'chart') {
          this.addChartSheet(workbook, section);
        }
      }
      
      // Generate Excel buffer
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      
      return { success: true, data: excelBuffer };
    } catch (error) {
      console.error('Error generating Excel report:', error);
      return { success: false, error: error.message };
    }
  }

  private addKPISheet(workbook: XLSX.WorkBook, section: any): void {
    const kpis = section.data.kpis || [];
    const data = [
      ['KPI Name', 'Value', 'Trend'],
      ...kpis.map((kpi: any) => [kpi.name, kpi.value, kpi.trend])
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, section.title.substring(0, 30));
  }

  private addTableSheet(workbook: XLSX.WorkBook, section: any): void {
    const { columns, rows } = section.data;
    const data = [
      columns,
      ...rows.map((row: any) => columns.map((col: string) => row[col] || ''))
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, section.title.substring(0, 30));
  }

  private addChartSheet(workbook: XLSX.WorkBook, section: any): void {
    const chartData = section.data.data || [];
    const data = [
      ['Date', 'Value'],
      ...chartData.map((point: any) => [point.date, point.value])
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, section.title.substring(0, 30));
  }

  private async generateCSVReport(config: ReportConfig, reportData: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      let csvContent = '';
      
      // Add header
      csvContent += `"${config.data.title}"\n`;
      csvContent += `"Generated: ${new Date().toLocaleDateString()}"\n`;
      csvContent += `"Description: ${config.data.description || ''}"\n\n`;
      
      // Process each section
      for (const section of reportData.sections) {
        csvContent += `"${section.title}"\n`;
        
        if (section.type === 'kpi') {
          csvContent += '"KPI Name","Value","Trend"\n';
          section.data.kpis.forEach((kpi: any) => {
            csvContent += `"${kpi.name}","${kpi.value}","${kpi.trend}"\n`;
          });
        } else if (section.type === 'table') {
          const { columns, rows } = section.data;
          csvContent += columns.map((col: string) => `"${col}"`).join(',') + '\n';
          rows.forEach((row: any) => {
            csvContent += columns.map((col: string) => `"${row[col] || ''}"`).join(',') + '\n';
          });
        }
        
        csvContent += '\n';
      }
      
      const csvBuffer = Buffer.from(csvContent, 'utf8');
      return { success: true, data: csvBuffer };
    } catch (error) {
      console.error('Error generating CSV report:', error);
      return { success: false, error: error.message };
    }
  }

  // Scheduled Reports
  async scheduleReport(config: ScheduledReportConfig): Promise<{ success: boolean; error?: string }> {
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
          is_active: config.isActive,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error scheduling report:', error);
      return { success: false, error: error.message };
    }
  }

  async processScheduledReports(): Promise<void> {
    try {
      const { data: scheduledReports, error } = await supabase
        .from('scheduled_reports')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      for (const report of scheduledReports || []) {
        if (this.shouldRunReport(report)) {
          await this.executeScheduledReport(report);
        }
      }
    } catch (error) {
      console.error('Error processing scheduled reports:', error);
    }
  }

  private shouldRunReport(report: any): boolean {
    // Simple cron-like logic - in production, use a proper cron library
    const now = new Date();
    const lastRun = report.last_run ? new Date(report.last_run) : null;
    
    // For demo purposes, check if it's been more than 24 hours
    if (!lastRun || now.getTime() - lastRun.getTime() > 24 * 60 * 60 * 1000) {
      return true;
    }
    
    return false;
  }

  private async executeScheduledReport(scheduledReport: any): Promise<void> {
    try {
      const config: ReportConfig = {
        type: scheduledReport.report_type,
        format: scheduledReport.format,
        data: {
          title: scheduledReport.name,
          description: scheduledReport.description,
          sections: [] // Would be populated from saved template
        }
      };

      const result = await this.generateReport(config, scheduledReport.filters);
      
      if (result.success) {
        await this.emailReport(result.data, scheduledReport.recipients, scheduledReport.name);
        
        // Update last run timestamp
        await supabase
          .from('scheduled_reports')
          .update({ last_run: new Date().toISOString() })
          .eq('id', scheduledReport.id);
      }
    } catch (error) {
      console.error('Error executing scheduled report:', error);
    }
  }

  private async emailReport(reportData: any, recipients: string[], reportName: string): Promise<void> {
    // Email implementation would go here
    console.log(`Emailing report "${reportName}" to:`, recipients);
  }

  // Utility methods
  private calculateTrend(trends: any[]): string {
    if (!trends || trends.length < 2) return '0%';
    
    const latest = trends[trends.length - 1];
    const previous = trends[trends.length - 2];
    
    const change = ((latest.value - previous.value) / previous.value) * 100;
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
  }

  private getMetricFormat(metric: string): string {
    const formats: Record<string, string> = {
      'activeConversations': 'number',
      'satisfactionScore': 'decimal',
      'aiResolutionRate': 'percentage',
      'avgResponseTime': 'duration'
    };
    
    return formats[metric] || 'number';
  }

  private formatValue(value: any, format: string): string {
    if (typeof value !== 'number') return value?.toString() || '0';
    
    switch (format) {
      case 'percentage':
        return `${(value * 100).toFixed(1)}%`;
      case 'decimal':
        return value.toFixed(2);
      case 'duration':
        return `${Math.round(value)}s`;
      default:
        return value.toLocaleString();
    }
  }
}

// Export singleton instance
export const reportGenerator = ReportGenerator.getInstance();