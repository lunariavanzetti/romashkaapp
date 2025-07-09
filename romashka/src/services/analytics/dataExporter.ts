import * as XLSX from 'xlsx';
import { supabase } from '../supabaseClient';
import { analyticsEngine } from './analyticsEngine';
import type { 
  ExportJob, 
  ExportConfig, 
  ExportResult,
  AnalyticsQuery,
  TimeRange 
} from '../../types/analytics';

export class DataExporter {
  private static instance: DataExporter;
  private exportJobs: Map<string, ExportJob> = new Map();

  private constructor() {}

  static getInstance(): DataExporter {
    if (!DataExporter.instance) {
      DataExporter.instance = new DataExporter();
    }
    return DataExporter.instance;
  }

  async exportData(config: ExportConfig): Promise<{ success: boolean; jobId?: string; error?: string }> {
    try {
      // Create export job
      const jobId = `export-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const job: ExportJob = {
        id: jobId,
        userId: 'current-user', // Would be from auth context
        name: `${config.type} Export`,
        type: config.type as any,
        filters: config.filters,
        format: config.format as any,
        status: 'pending',
        createdAt: new Date()
      };

      // Store job in memory and database
      this.exportJobs.set(jobId, job);
      await this.saveJobToDatabase(job);

      // Start export process in background
      this.processExportJob(jobId).catch(error => {
        console.error('Error processing export job:', error);
        this.updateJobStatus(jobId, 'failed', (error as Error).message);
      });

      return { success: true, jobId };
    } catch (error) {
      console.error('Error starting export:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  private async processExportJob(jobId: string): Promise<void> {
    const job = this.exportJobs.get(jobId);
    if (!job) {
      throw new Error(`Export job ${jobId} not found`);
    }

    try {
      // Update status to processing
      await this.updateJobStatus(jobId, 'processing');

      // Fetch data based on export type
      const data = await this.fetchExportData(job);
      
      // Generate export file
      const exportResult = await this.generateExportFile(data, job);
      
      // Save file and update job
      const fileUrl = await this.saveExportFile(exportResult.buffer, job);
      
      await this.updateJobStatus(jobId, 'completed', undefined, fileUrl, exportResult.size);
    } catch (error) {
      console.error('Error processing export job:', error);
      await this.updateJobStatus(jobId, 'failed', (error as Error).message);
    }
  }

  private async fetchExportData(job: ExportJob): Promise<any[]> {
    switch (job.type) {
      case 'conversations':
        return await this.fetchConversationsData(job.filters);
      case 'analytics':
        return await this.fetchAnalyticsData(job.filters);
      case 'customers':
        return await this.fetchCustomersData(job.filters);
      default:
        throw new Error(`Unsupported export type: ${job.type}`);
    }
  }

  private async fetchConversationsData(filters: any): Promise<any[]> {
    let query = supabase
      .from('conversations')
      .select(`
        *,
        profiles!conversations_customer_id_fkey(full_name, email),
        messages(count)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.timeRange?.start && filters.timeRange?.end) {
      query = query
        .gte('created_at', filters.timeRange.start)
        .lte('created_at', filters.timeRange.end);
    }

    if (filters.channels && filters.channels.length > 0) {
      query = query.in('channel', filters.channels);
    }

    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }

    if (filters.departments && filters.departments.length > 0) {
      query = query.in('department', filters.departments);
    }

    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch conversations: ${error.message}`);
    }

    return data || [];
  }

  private async fetchAnalyticsData(filters: any): Promise<any[]> {
    const query: AnalyticsQuery = {
      metrics: ['activeConversations', 'satisfactionScore', 'aiResolutionRate', 'avgResponseTime'],
      dimensions: ['channel', 'department', 'date'],
      filters: filters,
      timeRange: {
        start: new Date(filters.timeRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
        end: new Date(filters.timeRange?.end || new Date()),
        label: 'Export Period'
      },
      granularity: 'day'
    };

    const result = await analyticsEngine.calculateMetrics(query);
    return result.data || [];
  }

  private async fetchCustomersData(filters: any): Promise<any[]> {
    let query = supabase
      .from('profiles')
      .select(`
        *,
        conversations(count)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.timeRange?.start && filters.timeRange?.end) {
      query = query
        .gte('created_at', filters.timeRange.start)
        .lte('created_at', filters.timeRange.end);
    }

    if (filters.customerSegment) {
      query = query.eq('customer_segment', filters.customerSegment);
    }

    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch customers: ${error.message}`);
    }

    return data || [];
  }

  private async generateExportFile(data: any[], job: ExportJob): Promise<{ buffer: Buffer; size: number }> {
    switch (job.format) {
      case 'csv':
        return this.generateCSVFile(data, job);
      case 'excel':
        return this.generateExcelFile(data, job);
      case 'json':
        return this.generateJSONFile(data, job);
      default:
        throw new Error(`Unsupported export format: ${job.format}`);
    }
  }

  private async generateCSVFile(data: any[], job: ExportJob): Promise<{ buffer: Buffer; size: number }> {
    if (data.length === 0) {
      const buffer = Buffer.from('No data available\n', 'utf8');
      return { buffer, size: buffer.length };
    }

    // Extract headers from first row
    const headers = Object.keys(data[0]).filter(key => 
      typeof data[0][key] !== 'object' || data[0][key] === null
    );

    // Create CSV content
    let csvContent = '';
    
    // Add header row
    csvContent += headers.map(header => `"${header}"`).join(',') + '\n';
    
    // Add data rows
    for (const row of data) {
      const csvRow = headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) {
          return '""';
        }
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',');
      csvContent += csvRow + '\n';
    }

    const buffer = Buffer.from(csvContent, 'utf8');
    return { buffer, size: buffer.length };
  }

  private async generateExcelFile(data: any[], job: ExportJob): Promise<{ buffer: Buffer; size: number }> {
    const workbook = XLSX.utils.book_new();
    
    if (data.length === 0) {
      const emptySheet = XLSX.utils.aoa_to_sheet([['No data available']]);
      XLSX.utils.book_append_sheet(workbook, emptySheet, 'Data');
    } else {
      // Flatten nested objects for Excel export
      const flattenedData = data.map(row => this.flattenObject(row));
      
      // Create main data sheet
      const worksheet = XLSX.utils.json_to_sheet(flattenedData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
      
      // Add metadata sheet
      const metadataSheet = XLSX.utils.aoa_to_sheet([
        ['Export Information'],
        [''],
        ['Export Type', job.type],
        ['Export Format', job.format],
        ['Generated At', new Date().toISOString()],
        ['Total Records', data.length],
        [''],
        ['Filters Applied'],
        ...Object.entries(job.filters).map(([key, value]) => [key, JSON.stringify(value)])
      ]);
      XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Metadata');
    }

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    return { buffer, size: buffer.length };
  }

  private async generateJSONFile(data: any[], job: ExportJob): Promise<{ buffer: Buffer; size: number }> {
    const exportData = {
      metadata: {
        exportType: job.type,
        exportFormat: job.format,
        generatedAt: new Date().toISOString(),
        totalRecords: data.length,
        filters: job.filters
      },
      data: data
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const buffer = Buffer.from(jsonString, 'utf8');
    return { buffer, size: buffer.length };
  }

  private flattenObject(obj: any, prefix: string = ''): any {
    const flattened: any = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;
        
        if (value === null || value === undefined) {
          flattened[newKey] = '';
        } else if (typeof value === 'object' && !Array.isArray(value)) {
          Object.assign(flattened, this.flattenObject(value, newKey));
        } else if (Array.isArray(value)) {
          flattened[newKey] = value.join(', ');
        } else {
          flattened[newKey] = value;
        }
      }
    }
    
    return flattened;
  }

  private async saveExportFile(buffer: Buffer, job: ExportJob): Promise<string> {
    const fileName = `${job.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.${job.format}`;
    const filePath = `exports/${job.userId}/${fileName}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('export-files')
      .upload(filePath, buffer, {
        contentType: this.getContentType(job.format),
        upsert: false
      });

    if (error) {
      throw new Error(`Failed to save export file: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('export-files')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  }

  private getContentType(format: string): string {
    switch (format) {
      case 'csv':
        return 'text/csv';
      case 'excel':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'json':
        return 'application/json';
      default:
        return 'application/octet-stream';
    }
  }

  private async saveJobToDatabase(job: ExportJob): Promise<void> {
    const { error } = await supabase
      .from('export_jobs')
      .insert([{
        id: job.id,
        user_id: job.userId,
        name: job.name,
        type: job.type,
        filters: job.filters,
        format: job.format,
        status: job.status,
        created_at: job.createdAt.toISOString()
      }]);

    if (error) {
      console.error('Error saving export job to database:', error);
    }
  }

  private async updateJobStatus(
    jobId: string, 
    status: 'pending' | 'processing' | 'completed' | 'failed',
    errorMessage?: string,
    fileUrl?: string,
    fileSizeBytes?: number
  ): Promise<void> {
    const job = this.exportJobs.get(jobId);
    if (job) {
      job.status = status;
      job.errorMessage = errorMessage;
      job.fileUrl = fileUrl;
      job.fileSizeBytes = fileSizeBytes;
      
      if (status === 'completed' || status === 'failed') {
        job.completedAt = new Date();
      }
    }

    // Update in database
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (errorMessage) updateData.error_message = errorMessage;
    if (fileUrl) updateData.file_url = fileUrl;
    if (fileSizeBytes) updateData.file_size_bytes = fileSizeBytes;
    if (status === 'completed' || status === 'failed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('export_jobs')
      .update(updateData)
      .eq('id', jobId);

    if (error) {
      console.error('Error updating export job status:', error);
    }
  }

  async getExportJobStatus(jobId: string): Promise<ExportJob | null> {
    // Check memory first
    const memoryJob = this.exportJobs.get(jobId);
    if (memoryJob) {
      return memoryJob;
    }

    // Check database
    const { data, error } = await supabase
      .from('export_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error || !data) {
      return null;
    }

    // Convert database record to ExportJob
    const job: ExportJob = {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      type: data.type,
      filters: data.filters,
      format: data.format,
      status: data.status,
      fileUrl: data.file_url,
      fileSizeBytes: data.file_size_bytes,
      errorMessage: data.error_message,
      createdAt: new Date(data.created_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined
    };

    return job;
  }

  async getUserExportJobs(userId: string, limit: number = 50): Promise<ExportJob[]> {
    const { data, error } = await supabase
      .from('export_jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching user export jobs:', error);
      return [];
    }

    return (data || []).map((record: any) => ({
      id: record.id,
      userId: record.user_id,
      name: record.name,
      type: record.type,
      filters: record.filters,
      format: record.format,
      status: record.status,
      fileUrl: record.file_url,
      fileSizeBytes: record.file_size_bytes,
      errorMessage: record.error_message,
      createdAt: new Date(record.created_at),
      completedAt: record.completed_at ? new Date(record.completed_at) : undefined
    }));
  }

  async deleteExportJob(jobId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const job = await this.getExportJobStatus(jobId);
      if (!job) {
        return { success: false, error: 'Export job not found' };
      }

      // Delete file from storage if exists
      if (job.fileUrl) {
        const filePath = job.fileUrl.split('/').pop();
        if (filePath) {
          await supabase.storage
            .from('export-files')
            .remove([`exports/${job.userId}/${filePath}`]);
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('export_jobs')
        .delete()
        .eq('id', jobId);

      if (error) {
        throw new Error(`Failed to delete export job: ${error.message}`);
      }

      // Remove from memory
      this.exportJobs.delete(jobId);

      return { success: true };
    } catch (error) {
      console.error('Error deleting export job:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async cleanupExpiredJobs(): Promise<void> {
    try {
      const expiryDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      
      const { data: expiredJobs, error } = await supabase
        .from('export_jobs')
        .select('*')
        .lt('created_at', expiryDate.toISOString());

      if (error) {
        console.error('Error fetching expired jobs:', error);
        return;
      }

      for (const job of expiredJobs || []) {
        await this.deleteExportJob(job.id);
      }

      console.log(`Cleaned up ${expiredJobs?.length || 0} expired export jobs`);
    } catch (error) {
      console.error('Error cleaning up expired jobs:', error);
    }
  }

  // Batch export for large datasets
  async exportLargeDataset(
    config: ExportConfig,
    batchSize: number = 1000
  ): Promise<{ success: boolean; jobId?: string; error?: string }> {
    try {
      const jobId = `large-export-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const job: ExportJob = {
        id: jobId,
        userId: 'current-user',
        name: `Large ${config.type} Export`,
        type: config.type as any,
        filters: config.filters,
        format: config.format as any,
        status: 'pending',
        createdAt: new Date()
      };

      this.exportJobs.set(jobId, job);
      await this.saveJobToDatabase(job);

      // Process in batches
      this.processLargeExport(jobId, batchSize).catch(error => {
        console.error('Error processing large export:', error);
        this.updateJobStatus(jobId, 'failed', (error as Error).message);
      });

      return { success: true, jobId };
    } catch (error) {
      console.error('Error starting large export:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  private async processLargeExport(jobId: string, batchSize: number): Promise<void> {
    const job = this.exportJobs.get(jobId);
    if (!job) {
      throw new Error(`Export job ${jobId} not found`);
    }

    await this.updateJobStatus(jobId, 'processing');

    const allData: any[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const batchData = await this.fetchBatchData(job, offset, batchSize);
      allData.push(...batchData);
      
      if (batchData.length < batchSize) {
        hasMore = false;
      } else {
        offset += batchSize;
      }

      // Update progress (could be stored in job metadata)
      console.log(`Processed ${allData.length} records for job ${jobId}`);
    }

    const exportResult = await this.generateExportFile(allData, job);
    const fileUrl = await this.saveExportFile(exportResult.buffer, job);
    
    await this.updateJobStatus(jobId, 'completed', undefined, fileUrl, exportResult.size);
  }

  private async fetchBatchData(job: ExportJob, offset: number, limit: number): Promise<any[]> {
    switch (job.type) {
      case 'conversations':
        return await this.fetchConversationsBatch(job.filters, offset, limit);
      case 'analytics':
        return await this.fetchAnalyticsBatch(job.filters, offset, limit);
      case 'customers':
        return await this.fetchCustomersBatch(job.filters, offset, limit);
      default:
        return [];
    }
  }

  private async fetchConversationsBatch(filters: any, offset: number, limit: number): Promise<any[]> {
    let query = supabase
      .from('conversations')
      .select('*')
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (filters.timeRange?.start && filters.timeRange?.end) {
      query = query
        .gte('created_at', filters.timeRange.start)
        .lte('created_at', filters.timeRange.end);
    }

    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch conversations batch: ${error.message}`);
    }

    return data || [];
  }

  private async fetchAnalyticsBatch(filters: any, offset: number, limit: number): Promise<any[]> {
    // For analytics, we might need to fetch from daily_metrics table
    let query = supabase
      .from('daily_metrics')
      .select('*')
      .range(offset, offset + limit - 1)
      .order('date', { ascending: false });

    if (filters.timeRange?.start && filters.timeRange?.end) {
      query = query
        .gte('date', filters.timeRange.start)
        .lte('date', filters.timeRange.end);
    }

    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch analytics batch: ${error.message}`);
    }

    return data || [];
  }

  private async fetchCustomersBatch(filters: any, offset: number, limit: number): Promise<any[]> {
    let query = supabase
      .from('profiles')
      .select('*')
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (filters.timeRange?.start && filters.timeRange?.end) {
      query = query
        .gte('created_at', filters.timeRange.start)
        .lte('created_at', filters.timeRange.end);
    }

    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch customers batch: ${error.message}`);
    }

    return data || [];
  }
}

// Export singleton instance
export const dataExporter = DataExporter.getInstance();