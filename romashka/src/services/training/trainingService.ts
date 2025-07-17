import { supabase } from '../../lib/supabase';
import { aiTrainingService } from '../ai/training/aiTrainingService';

export interface DashboardStats {
  totalDatasets: number;
  totalConversations: number;
  averageAccuracy: number;
  activeTrainings: number;
  lastTraining: Date | null;
}

export interface RecentActivity {
  id: string;
  type: string;
  message: string;
  timestamp: Date;
  status: 'success' | 'error' | 'warning' | 'info';
}

export interface TrainingSession {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  datasetIds: string[];
  results?: {
    accuracyImprovement: number;
    processedRecords: number;
    errors: number;
  };
  config: {
    learningRate: number;
    epochs: number;
    batchSize: number;
    modelType: string;
  };
}

export interface TrainingDataset {
  id: string;
  name: string;
  filename: string;
  fileType: string;
  size: number;
  status: 'uploaded' | 'processing' | 'ready' | 'error';
  recordCount: number;
  categories: string[];
  uploadedAt: Date;
  processedAt?: Date;
  errors?: string[];
}

class TrainingService {
  private static instance: TrainingService;

  static getInstance(): TrainingService {
    if (!TrainingService.instance) {
      TrainingService.instance = new TrainingService();
    }
    return TrainingService.instance;
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Get total datasets
      const { data: datasets, error: datasetError } = await supabase
        .from('training_data')
        .select('id', { count: 'exact' });

      if (datasetError) throw datasetError;

      // Get total conversations
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id', { count: 'exact' });

      if (convError) throw convError;

      // Get active training sessions
      const { data: activeSessions, error: sessionError } = await supabase
        .from('training_sessions')
        .select('id', { count: 'exact' })
        .in('status', ['pending', 'running']);

      if (sessionError) throw sessionError;

      // Get last training session
      const { data: lastSession, error: lastError } = await supabase
        .from('training_sessions')
        .select('completed_at')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

      // Calculate average accuracy from recent training sessions
      const { data: recentSessions, error: accuracyError } = await supabase
        .from('training_sessions')
        .select('results')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(10);

      let averageAccuracy = 0;
      if (!accuracyError && recentSessions?.length > 0) {
        const accuracySum = recentSessions.reduce((sum, session) => {
          return sum + (session.results?.accuracyImprovement || 0);
        }, 0);
        averageAccuracy = accuracySum / recentSessions.length;
      }

      return {
        totalDatasets: datasets?.length || 0,
        totalConversations: conversations?.length || 0,
        averageAccuracy: Math.max(0, Math.min(1, 0.75 + averageAccuracy / 100)), // Base accuracy + improvements
        activeTrainings: activeSessions?.length || 0,
        lastTraining: lastSession && !lastError ? new Date(lastSession.completed_at) : null,
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get recent activity feed
   */
  async getRecentActivity(limit: number = 20): Promise<RecentActivity[]> {
    try {
      const activities: RecentActivity[] = [];

      // Get recent training sessions
      const { data: sessions, error: sessionError } = await supabase
        .from('training_sessions')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);

      if (!sessionError && sessions) {
        for (const session of sessions) {
          activities.push({
            id: `session-${session.id}`,
            type: 'training',
            message: `Training session "${session.name}" ${session.status}`,
            timestamp: new Date(session.started_at || session.created_at),
            status: session.status === 'completed' ? 'success' : 
                   session.status === 'failed' ? 'error' : 'info',
          });
        }
      }

      // Get recent data uploads
      const { data: uploads, error: uploadError } = await supabase
        .from('training_data')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!uploadError && uploads) {
        for (const upload of uploads) {
          activities.push({
            id: `upload-${upload.id}`,
            type: 'upload',
            message: `Dataset "${upload.filename}" uploaded`,
            timestamp: new Date(upload.created_at),
            status: upload.status === 'processed' ? 'success' : 
                   upload.status === 'error' ? 'error' : 'info',
          });
        }
      }

      // Sort by timestamp and limit
      return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting recent activity:', error);
      throw error;
    }
  }

  /**
   * Create a new training session
   */
  async createTrainingSession(config: {
    name: string;
    datasetIds: string[];
    learningRate?: number;
    epochs?: number;
    batchSize?: number;
    modelType?: string;
  }): Promise<TrainingSession> {
    try {
      const session: Partial<TrainingSession> = {
        id: crypto.randomUUID(),
        name: config.name,
        status: 'pending',
        progress: 0,
        datasetIds: config.datasetIds,
        config: {
          learningRate: config.learningRate || 0.001,
          epochs: config.epochs || 10,
          batchSize: config.batchSize || 32,
          modelType: config.modelType || 'fine-tuning',
        },
      };

      const { data, error } = await supabase
        .from('training_sessions')
        .insert({
          id: session.id,
          name: session.name,
          status: session.status,
          progress: session.progress,
          training_data_ids: session.datasetIds,
          config: session.config,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return {
        ...session,
        startedAt: new Date(data.started_at),
      } as TrainingSession;
    } catch (error) {
      console.error('Error creating training session:', error);
      throw error;
    }
  }

  /**
   * Start a training session
   */
  async startTrainingSession(sessionId: string): Promise<void> {
    try {
      await supabase
        .from('training_sessions')
        .update({
          status: 'running',
          started_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      // Start the actual training process
      this.runTrainingSession(sessionId);
    } catch (error) {
      console.error('Error starting training session:', error);
      throw error;
    }
  }

  /**
   * Get training session details
   */
  async getTrainingSession(sessionId: string): Promise<TrainingSession | null> {
    try {
      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        name: data.name,
        status: data.status,
        progress: data.progress,
        startedAt: data.started_at ? new Date(data.started_at) : undefined,
        completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
        datasetIds: data.training_data_ids || [],
        results: data.results,
        config: data.config,
      };
    } catch (error) {
      console.error('Error getting training session:', error);
      throw error;
    }
  }

  /**
   * Get all training sessions
   */
  async getTrainingSessions(): Promise<TrainingSession[]> {
    try {
      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .order('started_at', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      return data.map(session => ({
        id: session.id,
        name: session.name,
        status: session.status,
        progress: session.progress,
        startedAt: session.started_at ? new Date(session.started_at) : undefined,
        completedAt: session.completed_at ? new Date(session.completed_at) : undefined,
        datasetIds: session.training_data_ids || [],
        results: session.results,
        config: session.config,
      }));
    } catch (error) {
      console.error('Error getting training sessions:', error);
      throw error;
    }
  }

  /**
   * Get training datasets
   */
  async getTrainingDatasets(): Promise<TrainingDataset[]> {
    try {
      const { data, error } = await supabase
        .from('training_data')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      return data.map(dataset => ({
        id: dataset.id,
        name: dataset.filename,
        filename: dataset.filename,
        fileType: dataset.file_type,
        size: typeof dataset.content === 'object' ? JSON.stringify(dataset.content).length : 0,
        status: dataset.status,
        recordCount: dataset.content?.records?.length || 0,
        categories: dataset.category ? [dataset.category] : [],
        uploadedAt: new Date(dataset.created_at),
        processedAt: dataset.processed_at ? new Date(dataset.processed_at) : undefined,
      }));
    } catch (error) {
      console.error('Error getting training datasets:', error);
      throw error;
    }
  }

  /**
   * Delete a training dataset
   */
  async deleteTrainingDataset(datasetId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('training_data')
        .delete()
        .eq('id', datasetId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting training dataset:', error);
      throw error;
    }
  }

  /**
   * Cancel a training session
   */
  async cancelTrainingSession(sessionId: string): Promise<void> {
    try {
      await supabase
        .from('training_sessions')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Error cancelling training session:', error);
      throw error;
    }
  }

  /**
   * Run training session (private method)
   */
  private async runTrainingSession(sessionId: string): Promise<void> {
    try {
      const session = await this.getTrainingSession(sessionId);
      if (!session) {
        throw new Error('Training session not found');
      }

      // Simulate training progress
      const updateProgress = async (progress: number) => {
        await supabase
          .from('training_sessions')
          .update({ progress })
          .eq('id', sessionId);
      };

      // Get training data
      const { data: trainingData, error } = await supabase
        .from('training_data')
        .select('*')
        .in('id', session.datasetIds);

      if (error) throw error;

      let totalRecords = 0;
      let processedRecords = 0;
      let errors = 0;

      // Count total records
      for (const dataset of trainingData || []) {
        if (dataset.content?.records) {
          totalRecords += dataset.content.records.length;
        }
      }

      // Process training data
      for (let i = 0; i < session.config.epochs; i++) {
        await updateProgress((i / session.config.epochs) * 90);
        
        // Simulate epoch processing
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        processedRecords += Math.floor(totalRecords / session.config.epochs);
      }

      // Calculate accuracy improvement (simulated)
      const accuracyImprovement = Math.random() * 15 + 5; // 5-20% improvement

      // Complete training
      await supabase
        .from('training_sessions')
        .update({
          status: 'completed',
          progress: 100,
          completed_at: new Date().toISOString(),
          results: {
            accuracyImprovement,
            processedRecords,
            errors,
          },
        })
        .eq('id', sessionId);

    } catch (error) {
      console.error('Error running training session:', error);
      
      // Mark session as failed
      await supabase
        .from('training_sessions')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', sessionId);
    }
  }

  /**
   * Export training results
   */
  async exportTrainingResults(sessionId: string): Promise<Blob> {
    try {
      const session = await this.getTrainingSession(sessionId);
      if (!session) {
        throw new Error('Training session not found');
      }

      const exportData = {
        session: session,
        metrics: await aiTrainingService.getTrainingMetrics(),
        insights: await aiTrainingService.extractLearningInsights(),
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });

      return blob;
    } catch (error) {
      console.error('Error exporting training results:', error);
      throw error;
    }
  }
}

export const trainingService = TrainingService.getInstance();