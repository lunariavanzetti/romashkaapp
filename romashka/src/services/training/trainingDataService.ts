import { supabase } from '../../lib/supabase';
import type { 
  TrainingData, 
  TrainingDashboardStats, 
  RecentActivity, 
  APIResponse,
  PaginatedResponse 
} from '../../types/training';

class TrainingDataService {
  private static instance: TrainingDataService;

  static getInstance(): TrainingDataService {
    if (!TrainingDataService.instance) {
      TrainingDataService.instance = new TrainingDataService();
    }
    return TrainingDataService.instance;
  }

  /**
   * Get dashboard statistics for the current user
   */
  async getDashboardStats(): Promise<TrainingDashboardStats> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Call the database function to get training stats
      const { data, error } = await supabase
        .rpc('get_training_stats', { user_uuid: user.id });

      if (error) throw error;

      const stats = data?.[0] || {
        total_datasets: 0,
        total_conversations: 0,
        average_accuracy: 0,
        active_trainings: 0,
        last_training: null
      };

      return {
        total_datasets: stats.total_datasets,
        total_conversations: stats.total_conversations,
        average_accuracy: stats.average_accuracy || 0,
        active_trainings: stats.active_trainings,
        last_training: stats.last_training
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get recent activity for the training dashboard
   */
  async getRecentActivity(limit: number = 20): Promise<RecentActivity[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const activities: RecentActivity[] = [];

      // Get recent training data uploads
      const { data: uploads, error: uploadError } = await supabase
        .from('training_data')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!uploadError && uploads) {
        for (const upload of uploads) {
          activities.push({
            id: `upload-${upload.id}`,
            type: 'upload',
            message: `Dataset "${upload.filename}" ${upload.status}`,
            timestamp: upload.created_at,
            status: upload.status === 'processed' ? 'success' : 
                   upload.status === 'error' ? 'error' : 'info',
            metadata: {
              filename: upload.filename,
              record_count: upload.record_count,
              category: upload.category
            }
          });
        }
      }

      // Get recent training jobs
      const { data: jobs, error: jobError } = await supabase
        .from('training_jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!jobError && jobs) {
        for (const job of jobs) {
          activities.push({
            id: `job-${job.id}`,
            type: 'training',
            message: `Training job "${job.name}" ${job.status}`,
            timestamp: job.started_at || job.created_at,
            status: job.status === 'completed' ? 'success' : 
                   job.status === 'failed' ? 'error' : 'info',
            metadata: {
              job_name: job.name,
              progress: job.progress,
              training_data_count: job.training_data_ids?.length || 0
            }
          });
        }
      }

      // Get recent insights
      const { data: insights, error: insightError } = await supabase
        .from('training_insights')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!insightError && insights) {
        for (const insight of insights) {
          activities.push({
            id: `insight-${insight.id}`,
            type: 'insight',
            message: `New insight: ${insight.insight_title}`,
            timestamp: insight.created_at,
            status: 'info',
            metadata: {
              insight_type: insight.insight_type,
              confidence_score: insight.confidence_score
            }
          });
        }
      }

      // Sort by timestamp and limit
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

    } catch (error) {
      console.error('Error getting recent activity:', error);
      throw error;
    }
  }

  /**
   * Get all training datasets for the current user
   */
  async getTrainingDatasets(page: number = 1, limit: number = 10): Promise<PaginatedResponse<TrainingData>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const offset = (page - 1) * limit;

      // Get total count
      const { count } = await supabase
        .from('training_data')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get paginated data
      const { data, error } = await supabase
        .from('training_data')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        data: data || [],
        pagination: {
          page,
          per_page: limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit)
        }
      };

    } catch (error) {
      console.error('Error getting training datasets:', error);
      throw error;
    }
  }

  /**
   * Get a specific training dataset by ID
   */
  async getTrainingDataset(id: string): Promise<TrainingData | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('training_data')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows returned
        throw error;
      }

      return data;

    } catch (error) {
      console.error('Error getting training dataset:', error);
      throw error;
    }
  }

  /**
   * Create a new training dataset
   */
  async createTrainingDataset(dataset: Partial<TrainingData>): Promise<TrainingData> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('training_data')
        .insert({
          ...dataset,
          user_id: user.id,
          status: 'pending',
          record_count: 0,
          valid_records: 0,
          invalid_records: 0,
          categories: dataset.categories || []
        })
        .select()
        .single();

      if (error) throw error;

      return data;

    } catch (error) {
      console.error('Error creating training dataset:', error);
      throw error;
    }
  }

  /**
   * Update a training dataset
   */
  async updateTrainingDataset(id: string, updates: Partial<TrainingData>): Promise<TrainingData> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('training_data')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      return data;

    } catch (error) {
      console.error('Error updating training dataset:', error);
      throw error;
    }
  }

  /**
   * Delete a training dataset
   */
  async deleteTrainingDataset(id: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('training_data')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

    } catch (error) {
      console.error('Error deleting training dataset:', error);
      throw error;
    }
  }

  /**
   * Get training datasets by category
   */
  async getDatasetsByCategory(category: string): Promise<TrainingData[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('training_data')
        .select('*')
        .eq('user_id', user.id)
        .eq('category', category)
        .eq('status', 'processed')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('Error getting datasets by category:', error);
      throw error;
    }
  }

  /**
   * Search training datasets
   */
  async searchDatasets(query: string, filters?: {
    category?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<TrainingData[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let queryBuilder = supabase
        .from('training_data')
        .select('*')
        .eq('user_id', user.id);

      // Add text search
      if (query) {
        queryBuilder = queryBuilder.or(`filename.ilike.%${query}%,category.ilike.%${query}%`);
      }

      // Add filters
      if (filters?.category) {
        queryBuilder = queryBuilder.eq('category', filters.category);
      }

      if (filters?.status) {
        queryBuilder = queryBuilder.eq('status', filters.status);
      }

      if (filters?.date_from) {
        queryBuilder = queryBuilder.gte('created_at', filters.date_from);
      }

      if (filters?.date_to) {
        queryBuilder = queryBuilder.lte('created_at', filters.date_to);
      }

      const { data, error } = await queryBuilder.order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('Error searching datasets:', error);
      throw error;
    }
  }

  /**
   * Get dataset quality metrics
   */
  async getDatasetQualityMetrics(datasetId: string): Promise<{
    overall_quality: number;
    completeness: number;
    consistency: number;
    diversity: number;
    issues: string[];
    recommendations: string[];
  }> {
    try {
      const dataset = await this.getTrainingDataset(datasetId);
      if (!dataset) throw new Error('Dataset not found');

      // Calculate quality metrics based on the dataset content
      const content = dataset.content;
      const records = Array.isArray(content) ? content : content?.records || [];

      const totalRecords = records.length;
      if (totalRecords === 0) {
        return {
          overall_quality: 0,
          completeness: 0,
          consistency: 0,
          diversity: 0,
          issues: ['No data records found'],
          recommendations: ['Upload data records to improve quality metrics']
        };
      }

      // Calculate completeness (records with all required fields)
      const completeRecords = records.filter((record: any) => 
        record.user_message && record.ai_response
      ).length;
      const completeness = completeRecords / totalRecords;

      // Calculate consistency (similar format across records)
      const formatConsistency = this.calculateFormatConsistency(records);

      // Calculate diversity (variety in conversations)
      const diversity = this.calculateDiversity(records);

      // Overall quality score
      const overall_quality = (completeness + formatConsistency + diversity) / 3;

      // Generate issues and recommendations
      const issues: string[] = [];
      const recommendations: string[] = [];

      if (completeness < 0.8) {
        issues.push(`${Math.round((1 - completeness) * 100)}% of records are missing required fields`);
        recommendations.push('Ensure all records have both user messages and AI responses');
      }

      if (formatConsistency < 0.7) {
        issues.push('Inconsistent data format across records');
        recommendations.push('Standardize the data format before training');
      }

      if (diversity < 0.6) {
        issues.push('Limited diversity in conversation topics');
        recommendations.push('Add more varied conversation examples');
      }

      return {
        overall_quality: Math.round(overall_quality * 100) / 100,
        completeness: Math.round(completeness * 100) / 100,
        consistency: Math.round(formatConsistency * 100) / 100,
        diversity: Math.round(diversity * 100) / 100,
        issues,
        recommendations
      };

    } catch (error) {
      console.error('Error getting dataset quality metrics:', error);
      throw error;
    }
  }

  /**
   * Private helper method to calculate format consistency
   */
  private calculateFormatConsistency(records: any[]): number {
    if (records.length === 0) return 0;

    const firstRecord = records[0];
    const expectedKeys = Object.keys(firstRecord);
    
    const consistentRecords = records.filter(record => {
      const recordKeys = Object.keys(record);
      return expectedKeys.every(key => recordKeys.includes(key));
    });

    return consistentRecords.length / records.length;
  }

  /**
   * Private helper method to calculate conversation diversity
   */
  private calculateDiversity(records: any[]): number {
    if (records.length === 0) return 0;

    // Simple diversity calculation based on unique words in messages
    const allWords = new Set<string>();
    const messageWords = new Set<string>();

    for (const record of records) {
      const message = record.user_message || '';
      const words = message.toLowerCase().split(/\s+/).filter(word => word.length > 2);
      
      words.forEach(word => {
        allWords.add(word);
        messageWords.add(word);
      });
    }

    // Diversity is the ratio of unique words to total words (simplified)
    return Math.min(1, allWords.size / (records.length * 10)); // Normalize to 0-1
  }

  /**
   * Get all available categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('training_data')
        .select('category')
        .eq('user_id', user.id)
        .not('category', 'is', null);

      if (error) throw error;

      const categories = Array.from(new Set(
        data?.map(item => item.category).filter(Boolean) || []
      ));

      return categories.sort();

    } catch (error) {
      console.error('Error getting categories:', error);
      throw error;
    }
  }

  /**
   * Export training dataset
   */
  async exportDataset(datasetId: string, format: 'json' | 'csv' = 'json'): Promise<Blob> {
    try {
      const dataset = await this.getTrainingDataset(datasetId);
      if (!dataset) throw new Error('Dataset not found');

      let content: string;
      let mimeType: string;

      if (format === 'csv') {
        content = this.convertToCSV(dataset.content);
        mimeType = 'text/csv';
      } else {
        content = JSON.stringify(dataset, null, 2);
        mimeType = 'application/json';
      }

      return new Blob([content], { type: mimeType });

    } catch (error) {
      console.error('Error exporting dataset:', error);
      throw error;
    }
  }

  /**
   * Private helper method to convert data to CSV
   */
  private convertToCSV(data: any): string {
    const records = Array.isArray(data) ? data : data?.records || [];
    if (records.length === 0) return '';

    const headers = Object.keys(records[0]);
    const csvContent = [
      headers.join(','),
      ...records.map((record: any) => 
        headers.map(header => {
          const value = record[header] || '';
          // Escape quotes and wrap in quotes if contains comma or quotes
          const escapedValue = String(value).replace(/"/g, '""');
          return /[",\n\r]/.test(escapedValue) ? `"${escapedValue}"` : escapedValue;
        }).join(',')
      )
    ].join('\n');

    return csvContent;
  }
}

export const trainingDataService = TrainingDataService.getInstance();