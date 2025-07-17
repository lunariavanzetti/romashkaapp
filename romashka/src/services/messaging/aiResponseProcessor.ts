import { supabase } from '../../lib/supabase';
import { aiService } from '../aiService';

export interface QueuedJob {
  job_id: string;
  conversation_id: string;
  message_id: string;
  user_message: string;
  conversation_context: any;
  customer_profile: any;
  priority: number;
}

export interface ProcessingResult {
  success: boolean;
  response?: string;
  confidence?: number;
  responseTime?: number;
  requiresHuman?: boolean;
  error?: string;
}

export class AIResponseProcessor {
  private isProcessing: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private readonly PROCESSING_INTERVAL = 500; // Check every 500ms
  private readonly MAX_RESPONSE_TIME = 5000; // 5 seconds max
  private readonly MAX_CONCURRENT_JOBS = 3; // Process up to 3 jobs concurrently
  private activeJobs: Set<string> = new Set();

  constructor() {
    this.startProcessing();
  }

  /**
   * Start the background processing loop
   */
  public startProcessing(): void {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    this.processingInterval = setInterval(() => {
      this.processQueue().catch(error => {
        console.error('Error processing AI response queue:', error);
      });
    }, this.PROCESSING_INTERVAL);

    console.log('AI Response Processor started');
  }

  /**
   * Stop the background processing loop
   */
  public stopProcessing(): void {
    if (!this.isProcessing) {
      return;
    }

    this.isProcessing = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    console.log('AI Response Processor stopped');
  }

  /**
   * Process the AI response queue
   */
  private async processQueue(): Promise<void> {
    if (!this.isProcessing || this.activeJobs.size >= this.MAX_CONCURRENT_JOBS) {
      return;
    }

    try {
      // Get next job from queue
      const job = await this.getNextJob();
      if (!job) {
        return; // No jobs available
      }

      // Process job concurrently
      this.processJob(job).catch(error => {
        console.error(`Error processing job ${job.job_id}:`, error);
        this.failJob(job.job_id, error.message);
      });

    } catch (error) {
      console.error('Error in processQueue:', error);
    }
  }

  /**
   * Get the next job from the queue
   */
  private async getNextJob(): Promise<QueuedJob | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_next_ai_response_job');

      if (error) {
        console.error('Error getting next job:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      const job = data[0];
      return {
        job_id: job.job_id,
        conversation_id: job.conversation_id,
        message_id: job.message_id,
        user_message: job.user_message,
        conversation_context: job.conversation_context,
        customer_profile: job.customer_profile,
        priority: job.priority
      };
    } catch (error) {
      console.error('Error getting next job:', error);
      return null;
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: QueuedJob): Promise<void> {
    const startTime = Date.now();
    const jobId = job.job_id;

    // Add to active jobs
    this.activeJobs.add(jobId);

    try {
      // Process the AI response with timeout
      const result = await this.generateAIResponse(job);
      
      if (result.success) {
        // Complete the job
        await this.completeJob(
          jobId,
          result.response!,
          result.confidence!,
          result.responseTime!,
          result.requiresHuman!
        );
      } else {
        // Fail the job
        await this.failJob(jobId, result.error || 'Unknown error');
      }

    } catch (error) {
      console.error(`Error processing job ${jobId}:`, error);
      await this.failJob(jobId, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      // Remove from active jobs
      this.activeJobs.delete(jobId);
    }
  }

  /**
   * Generate AI response for a job
   */
  private async generateAIResponse(job: QueuedJob): Promise<ProcessingResult> {
    const startTime = Date.now();

    try {
      // Create timeout promise
      const timeoutPromise = new Promise<ProcessingResult>((_, reject) => {
        setTimeout(() => {
          reject(new Error('AI response timeout'));
        }, this.MAX_RESPONSE_TIME);
      });

      // Create AI response promise
      const aiPromise = this.callAIService(job);

      // Race against timeout
      const result = await Promise.race([aiPromise, timeoutPromise]);
      
      const responseTime = Date.now() - startTime;
      
      return {
        ...result,
        responseTime
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Return fallback response
      return {
        success: true,
        response: "I'm having trouble processing your request right now. Let me connect you with a human agent who can help you better.",
        confidence: 0.1,
        responseTime,
        requiresHuman: true
      };
    }
  }

  /**
   * Call the AI service to generate a response
   */
  private async callAIService(job: QueuedJob): Promise<ProcessingResult> {
    try {
      const context = job.conversation_context;
      const customerProfile = job.customer_profile;
      
      // Build conversation history from context
      const conversationHistory = context.recent_messages || [];
      
      // Generate AI response
      const aiResponse = await aiService.generateResponse({
        message: job.user_message,
        conversationHistory: conversationHistory.map((msg: any) => ({
          id: msg.id,
          conversation_id: job.conversation_id,
          sender_type: msg.sender_type,
          content: msg.content,
          created_at: msg.created_at
        })),
        context: {
          channel: context.channel_type || 'website',
          language: context.language || 'en',
          customerProfile: customerProfile || {},
          intent: context.intent,
          sentiment: context.sentiment,
          department: context.department,
          priority: context.priority
        }
      });

      // Determine if human handoff is needed
      const confidence = aiResponse.confidence || 0.8;
      const requiresHuman = this.shouldRequireHuman(job.user_message, aiResponse, confidence);

      return {
        success: true,
        response: aiResponse.response,
        confidence,
        requiresHuman
      };

    } catch (error) {
      console.error('AI service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AI service error'
      };
    }
  }

  /**
   * Determine if human handoff is required
   */
  private shouldRequireHuman(userMessage: string, aiResponse: any, confidence: number): boolean {
    // Low confidence threshold
    if (confidence < 0.6) {
      return true;
    }

    // Intent-based escalation
    if (aiResponse.intent === 'escalation' || aiResponse.intent === 'complaint') {
      return true;
    }

    // Keyword-based escalation
    const escalationKeywords = [
      'human', 'agent', 'person', 'speak to someone', 'talk to someone',
      'manager', 'supervisor', 'escalate', 'complaint', 'cancel', 'refund',
      'angry', 'frustrated', 'disappointed', 'unsatisfied'
    ];

    const messageWords = userMessage.toLowerCase().split(/\s+/);
    const hasEscalationKeyword = escalationKeywords.some(keyword => 
      messageWords.some(word => word.includes(keyword))
    );

    if (hasEscalationKeyword) {
      return true;
    }

    // Sentiment-based escalation
    if (aiResponse.sentiment === 'negative' && confidence < 0.8) {
      return true;
    }

    return false;
  }

  /**
   * Complete a job successfully
   */
  private async completeJob(
    jobId: string,
    response: string,
    confidence: number,
    responseTime: number,
    requiresHuman: boolean
  ): Promise<void> {
    try {
      const { error } = await supabase
        .rpc('complete_ai_response_job', {
          job_id: jobId,
          ai_response: response,
          confidence: confidence,
          response_time_ms: responseTime,
          requires_human: requiresHuman
        });

      if (error) {
        console.error('Error completing job:', error);
      }
    } catch (error) {
      console.error('Error completing job:', error);
    }
  }

  /**
   * Fail a job
   */
  private async failJob(jobId: string, errorMessage: string): Promise<void> {
    try {
      const { error } = await supabase
        .rpc('fail_ai_response_job', {
          job_id: jobId,
          error_message: errorMessage
        });

      if (error) {
        console.error('Error failing job:', error);
      }
    } catch (error) {
      console.error('Error failing job:', error);
    }
  }

  /**
   * Get processing statistics
   */
  public getStats(): {
    isProcessing: boolean;
    activeJobs: number;
    maxConcurrentJobs: number;
    processingInterval: number;
  } {
    return {
      isProcessing: this.isProcessing,
      activeJobs: this.activeJobs.size,
      maxConcurrentJobs: this.MAX_CONCURRENT_JOBS,
      processingInterval: this.PROCESSING_INTERVAL
    };
  }

  /**
   * Get queue metrics
   */
  public async getQueueMetrics(): Promise<{
    pendingJobs: number;
    processingJobs: number;
    completedJobs: number;
    failedJobs: number;
    avgResponseTime: number;
    successRate: number;
  }> {
    try {
      const { data: queueStats, error } = await supabase
        .from('ai_response_queue')
        .select('status, response_time_ms, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

      if (error) {
        console.error('Error getting queue metrics:', error);
        return {
          pendingJobs: 0,
          processingJobs: 0,
          completedJobs: 0,
          failedJobs: 0,
          avgResponseTime: 0,
          successRate: 0
        };
      }

      const stats = queueStats || [];
      const pendingJobs = stats.filter(s => s.status === 'pending').length;
      const processingJobs = stats.filter(s => s.status === 'processing').length;
      const completedJobs = stats.filter(s => s.status === 'completed').length;
      const failedJobs = stats.filter(s => s.status === 'failed').length;
      
      const completedWithTime = stats.filter(s => s.status === 'completed' && s.response_time_ms);
      const avgResponseTime = completedWithTime.length > 0 
        ? completedWithTime.reduce((sum, s) => sum + s.response_time_ms, 0) / completedWithTime.length
        : 0;
      
      const totalProcessed = completedJobs + failedJobs;
      const successRate = totalProcessed > 0 ? (completedJobs / totalProcessed) * 100 : 0;

      return {
        pendingJobs,
        processingJobs,
        completedJobs,
        failedJobs,
        avgResponseTime,
        successRate
      };
    } catch (error) {
      console.error('Error getting queue metrics:', error);
      return {
        pendingJobs: 0,
        processingJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        avgResponseTime: 0,
        successRate: 0
      };
    }
  }

  /**
   * Clear old completed jobs
   */
  public async cleanupOldJobs(): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('cleanup_ai_response_queue', { older_than_days: 7 });

      if (error) {
        console.error('Error cleaning up old jobs:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Error cleaning up old jobs:', error);
      return 0;
    }
  }

  /**
   * Dispose of the processor
   */
  public dispose(): void {
    this.stopProcessing();
    this.activeJobs.clear();
  }
}

// Export singleton instance
export const aiResponseProcessor = new AIResponseProcessor();

// Cleanup old jobs every hour
setInterval(() => {
  aiResponseProcessor.cleanupOldJobs().then(count => {
    if (count > 0) {
      console.log(`Cleaned up ${count} old AI response jobs`);
    }
  });
}, 60 * 60 * 1000); // 1 hour

// Export for manual control
export { aiResponseProcessor as default };