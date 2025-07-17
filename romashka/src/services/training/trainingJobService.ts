import { supabase } from '../../lib/supabase';
import type { 
  TrainingJob, 
  TrainingConfiguration,
  TrainingSession,
  ProgressData,
  APIResponse 
} from '../../types/training';

class TrainingJobService {
  private static instance: TrainingJobService;

  static getInstance(): TrainingJobService {
    if (!TrainingJobService.instance) {
      TrainingJobService.instance = new TrainingJobService();
    }
    return TrainingJobService.instance;
  }

  /**
   * Create a new training job
   */
  async createTrainingJob(config: TrainingConfiguration): Promise<TrainingJob> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Validate the configuration
      await this.validateTrainingConfig(config);

      const jobData = {
        user_id: user.id,
        name: config.name,
        description: config.description || '',
        status: 'pending' as const,
        progress: 0,
        training_data_ids: config.selected_datasets,
        model_config: config.model_config,
        results: {}
      };

      const { data, error } = await supabase
        .from('training_jobs')
        .insert(jobData)
        .select()
        .single();

      if (error) throw error;

      return data;

    } catch (error) {
      console.error('Error creating training job:', error);
      throw error;
    }
  }

  /**
   * Start a training job
   */
  async startTrainingJob(jobId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get the job details
      const job = await this.getTrainingJob(jobId);
      if (!job) throw new Error('Training job not found');

      if (job.status !== 'pending') {
        throw new Error('Training job is not in pending status');
      }

      // Update job status to running
      await supabase
        .from('training_jobs')
        .update({
          status: 'running',
          started_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .eq('user_id', user.id);

      // Create a training session
      await this.createTrainingSession(jobId);

      // Start the actual training process
      this.executeTrainingJob(jobId).catch(error => {
        console.error('Training job execution failed:', error);
        this.markJobAsFailed(jobId, error.message);
      });

    } catch (error) {
      console.error('Error starting training job:', error);
      throw error;
    }
  }

  /**
   * Stop/cancel a training job
   */
  async cancelTrainingJob(jobId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      await supabase
        .from('training_jobs')
        .update({
          status: 'cancelled',
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .eq('user_id', user.id);

      // Update any active training sessions
      await supabase
        .from('training_sessions')
        .update({
          status: 'completed'
        })
        .eq('training_job_id', jobId)
        .eq('user_id', user.id);

    } catch (error) {
      console.error('Error cancelling training job:', error);
      throw error;
    }
  }

  /**
   * Get a specific training job
   */
  async getTrainingJob(jobId: string): Promise<TrainingJob | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('training_jobs')
        .select('*')
        .eq('id', jobId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data;

    } catch (error) {
      console.error('Error getting training job:', error);
      throw error;
    }
  }

  /**
   * Get all training jobs for the current user
   */
  async getTrainingJobs(status?: string): Promise<TrainingJob[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('training_jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('Error getting training jobs:', error);
      throw error;
    }
  }

  /**
   * Get training job progress
   */
  async getTrainingProgress(jobId: string): Promise<{
    job: TrainingJob;
    session?: TrainingSession;
    estimated_completion?: Date;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get job details using the database function
      const { data: progressData, error: progressError } = await supabase
        .rpc('get_training_progress', { job_uuid: jobId });

      if (progressError) throw progressError;

      const job = await this.getTrainingJob(jobId);
      if (!job) throw new Error('Training job not found');

      // Get active training session
      const { data: sessionData, error: sessionError } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('training_job_id', jobId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      const session = sessionError ? undefined : sessionData;

      const progress = progressData?.[0];
      const estimated_completion = progress?.estimated_completion 
        ? new Date(progress.estimated_completion) 
        : undefined;

      return {
        job,
        session,
        estimated_completion
      };

    } catch (error) {
      console.error('Error getting training progress:', error);
      throw error;
    }
  }

  /**
   * Update training job progress
   */
  async updateTrainingProgress(
    jobId: string, 
    progress: number, 
    progressData?: Partial<ProgressData>
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Update training job progress
      await supabase
        .from('training_jobs')
        .update({ progress })
        .eq('id', jobId)
        .eq('user_id', user.id);

      // Update training session progress data if provided
      if (progressData) {
        await supabase
          .from('training_sessions')
          .update({
            progress_data: progressData
          })
          .eq('training_job_id', jobId)
          .eq('user_id', user.id)
          .eq('status', 'active');
      }

    } catch (error) {
      console.error('Error updating training progress:', error);
      throw error;
    }
  }

  /**
   * Complete a training job with results
   */
  async completeTrainingJob(jobId: string, results: any): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      await supabase
        .from('training_jobs')
        .update({
          status: 'completed',
          progress: 100,
          completed_at: new Date().toISOString(),
          results
        })
        .eq('id', jobId)
        .eq('user_id', user.id);

      // Update training session
      await supabase
        .from('training_sessions')
        .update({
          status: 'completed'
        })
        .eq('training_job_id', jobId)
        .eq('user_id', user.id);

    } catch (error) {
      console.error('Error completing training job:', error);
      throw error;
    }
  }

  /**
   * Mark a training job as failed
   */
  async markJobAsFailed(jobId: string, errorMessage: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      await supabase
        .from('training_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: errorMessage
        })
        .eq('id', jobId)
        .eq('user_id', user.id);

      // Update training session
      await supabase
        .from('training_sessions')
        .update({
          status: 'error'
        })
        .eq('training_job_id', jobId)
        .eq('user_id', user.id);

    } catch (error) {
      console.error('Error marking job as failed:', error);
    }
  }

  /**
   * Delete a training job
   */
  async deleteTrainingJob(jobId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // First delete related training sessions
      await supabase
        .from('training_sessions')
        .delete()
        .eq('training_job_id', jobId)
        .eq('user_id', user.id);

      // Then delete the training job
      const { error } = await supabase
        .from('training_jobs')
        .delete()
        .eq('id', jobId)
        .eq('user_id', user.id);

      if (error) throw error;

    } catch (error) {
      console.error('Error deleting training job:', error);
      throw error;
    }
  }

  /**
   * Get training job metrics
   */
  async getJobMetrics(jobId: string): Promise<{
    accuracy_improvement: number;
    training_time: number;
    data_quality: number;
    model_performance: number;
  }> {
    try {
      const job = await this.getTrainingJob(jobId);
      if (!job || job.status !== 'completed') {
        throw new Error('Job not completed or not found');
      }

      const results = job.results || {};
      
      return {
        accuracy_improvement: results.accuracy_improvement || 0,
        training_time: results.training_time || 0,
        data_quality: results.data_quality || 0,
        model_performance: results.final_accuracy || 0
      };

    } catch (error) {
      console.error('Error getting job metrics:', error);
      throw error;
    }
  }

  /**
   * Private method to validate training configuration
   */
  private async validateTrainingConfig(config: TrainingConfiguration): Promise<void> {
    const errors: string[] = [];

    // Validate name
    if (!config.name || config.name.trim().length === 0) {
      errors.push('Training job name is required');
    }

    if (config.name && config.name.length > 255) {
      errors.push('Training job name must be less than 255 characters');
    }

    // Validate selected datasets
    if (!config.selected_datasets || config.selected_datasets.length === 0) {
      errors.push('At least one dataset must be selected');
    }

    // Validate model configuration
    if (config.model_config.learning_rate && 
        (config.model_config.learning_rate <= 0 || config.model_config.learning_rate > 1)) {
      errors.push('Learning rate must be between 0 and 1');
    }

    if (config.model_config.epochs && 
        (config.model_config.epochs < 1 || config.model_config.epochs > 100)) {
      errors.push('Epochs must be between 1 and 100');
    }

    if (config.model_config.batch_size && 
        (config.model_config.batch_size < 1 || config.model_config.batch_size > 256)) {
      errors.push('Batch size must be between 1 and 256');
    }

    // Check if datasets exist and are accessible
    if (config.selected_datasets.length > 0) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: datasets, error } = await supabase
        .from('training_data')
        .select('id, status')
        .eq('user_id', user.id)
        .in('id', config.selected_datasets);

      if (error) throw error;

      if (datasets.length !== config.selected_datasets.length) {
        errors.push('Some selected datasets were not found');
      }

      const unprocessedDatasets = datasets.filter(d => d.status !== 'processed');
      if (unprocessedDatasets.length > 0) {
        errors.push('All selected datasets must be in processed status');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Private method to create a training session
   */
  private async createTrainingSession(jobId: string): Promise<TrainingSession> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const sessionData = {
      user_id: user.id,
      training_job_id: jobId,
      status: 'active' as const,
      session_data: {},
      progress_data: {
        current_step: 'Initializing',
        steps_completed: 0,
        total_steps: 10,
        current_epoch: 0,
        total_epochs: 1,
        loss_history: [],
        accuracy_history: []
      }
    };

    const { data, error } = await supabase
      .from('training_sessions')
      .insert(sessionData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Private method to execute the actual training job
   */
  private async executeTrainingJob(jobId: string): Promise<void> {
    try {
      const job = await this.getTrainingJob(jobId);
      if (!job) throw new Error('Training job not found');

      // Get training datasets
      const { data: datasets, error: dataError } = await supabase
        .from('training_data')
        .select('*')
        .in('id', job.training_data_ids);

      if (dataError) throw dataError;

      // Simulate training process with progress updates
      const totalSteps = 10;
      const epochs = job.model_config.epochs || 5;

      // Step 1: Data preparation
      await this.updateTrainingProgress(jobId, 10, {
        current_step: 'Preparing training data',
        steps_completed: 1,
        total_steps: totalSteps,
        current_epoch: 0,
        total_epochs: epochs
      });

      await this.delay(2000);

      // Step 2: Model initialization
      await this.updateTrainingProgress(jobId, 20, {
        current_step: 'Initializing model',
        steps_completed: 2,
        total_steps: totalSteps
      });

      await this.delay(1000);

      // Steps 3-8: Training epochs
      const lossHistory: number[] = [];
      const accuracyHistory: number[] = [];

      for (let epoch = 1; epoch <= epochs; epoch++) {
        const epochProgress = 20 + (60 * epoch) / epochs;
        
        // Simulate loss and accuracy improvement
        const loss = 2.0 - (epoch / epochs) * 1.5 + Math.random() * 0.2;
        const accuracy = 0.5 + (epoch / epochs) * 0.4 + Math.random() * 0.1;
        
        lossHistory.push(Math.round(loss * 1000) / 1000);
        accuracyHistory.push(Math.round(accuracy * 1000) / 1000);

        await this.updateTrainingProgress(jobId, epochProgress, {
          current_step: `Training epoch ${epoch}/${epochs}`,
          steps_completed: 2 + epoch,
          total_steps: totalSteps,
          current_epoch: epoch,
          total_epochs: epochs,
          loss_history: lossHistory,
          accuracy_history: accuracyHistory
        });

        await this.delay(3000); // Simulate epoch time
      }

      // Step 9: Model evaluation
      await this.updateTrainingProgress(jobId, 90, {
        current_step: 'Evaluating model performance',
        steps_completed: totalSteps - 1,
        total_steps: totalSteps
      });

      await this.delay(2000);

      // Step 10: Finalization
      const finalAccuracy = accuracyHistory[accuracyHistory.length - 1] || 0.75;
      const initialAccuracy = 0.6; // Baseline
      const accuracyImprovement = ((finalAccuracy - initialAccuracy) / initialAccuracy) * 100;

      const totalRecords = datasets.reduce((sum, dataset) => sum + (dataset.record_count || 0), 0);

      const results = {
        accuracy_improvement: Math.round(accuracyImprovement * 100) / 100,
        processed_records: totalRecords,
        errors: 0,
        training_loss: lossHistory[lossHistory.length - 1],
        validation_loss: lossHistory[lossHistory.length - 1] * 1.1,
        final_accuracy: finalAccuracy,
        training_time: epochs * 3, // Simulated training time in minutes
        model_id: `model_${jobId.slice(0, 8)}`,
        loss_history: lossHistory,
        accuracy_history: accuracyHistory
      };

      // Complete the training job
      await this.completeTrainingJob(jobId, results);

    } catch (error) {
      throw new Error(`Training execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Utility method to add delays in simulation
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get training job statistics
   */
  async getTrainingStatistics(): Promise<{
    total_jobs: number;
    completed_jobs: number;
    failed_jobs: number;
    running_jobs: number;
    avg_training_time: number;
    avg_accuracy_improvement: number;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: jobs, error } = await supabase
        .from('training_jobs')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const total_jobs = jobs.length;
      const completed_jobs = jobs.filter(j => j.status === 'completed').length;
      const failed_jobs = jobs.filter(j => j.status === 'failed').length;
      const running_jobs = jobs.filter(j => j.status === 'running').length;

      const completedJobs = jobs.filter(j => j.status === 'completed' && j.results);
      const avg_training_time = completedJobs.length > 0 
        ? completedJobs.reduce((sum, job) => sum + (job.results?.training_time || 0), 0) / completedJobs.length
        : 0;

      const avg_accuracy_improvement = completedJobs.length > 0
        ? completedJobs.reduce((sum, job) => sum + (job.results?.accuracy_improvement || 0), 0) / completedJobs.length
        : 0;

      return {
        total_jobs,
        completed_jobs,
        failed_jobs,
        running_jobs,
        avg_training_time: Math.round(avg_training_time * 100) / 100,
        avg_accuracy_improvement: Math.round(avg_accuracy_improvement * 100) / 100
      };

    } catch (error) {
      console.error('Error getting training statistics:', error);
      throw error;
    }
  }
}

export const trainingJobService = TrainingJobService.getInstance();