import { supabase } from '../../lib/supabase';
import { aiService } from '../aiService';

export interface AIJob {
  id: string;
  conversation_id: string;
  message_id: string;
  user_message: string;
  conversation_context: any;
  customer_profile: any;
  priority: number;
}

export interface AIResponseResult {
  response: string;
  confidence: number;
  requiresHuman: boolean;
  processingTime: number;
  intent?: string;
  sentiment?: string;
  knowledgeUsed?: string[];
}

/**
 * AI Response Processor - Background service that processes AI response jobs
 * Uses our database functions to ensure <6 second response times
 */
export class AIResponseProcessor {
  private isProcessing: boolean = false;
  private maxConcurrentJobs: number = 3;
  private currentJobs: Set<string> = new Set();
  private processingInterval: number = 500; // Process every 500ms
  private maxResponseTime: number = 5000; // 5 second max response time
  private intervalId: NodeJS.Timeout | null = null;

  /**
   * Start the AI response processor
   */
  public start(): void {
    if (this.isProcessing) {
      console.log('AI Response Processor already running');
      return;
    }

    this.isProcessing = true;
    console.log('Starting AI Response Processor...');

    this.intervalId = setInterval(() => {
      this.processNextJobs();
    }, this.processingInterval);
  }

  /**
   * Stop the AI response processor
   */
  public stop(): void {
    if (!this.isProcessing) {
      return;
    }

    this.isProcessing = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('AI Response Processor stopped');
  }

  /**
   * Process next available AI response jobs
   */
  private async processNextJobs(): Promise<void> {
    if (this.currentJobs.size >= this.maxConcurrentJobs) {
      return;
    }

    try {
      // Get next available jobs using our database function
      const jobsToProcess = this.maxConcurrentJobs - this.currentJobs.size;
      
      for (let i = 0; i < jobsToProcess; i++) {
        const job = await this.getNextJob();
        if (job) {
          this.processJob(job);
        }
      }
    } catch (error) {
      console.error('Error processing AI response jobs:', error);
    }
  }

  /**
   * Get next AI response job using our database function
   */
  private async getNextJob(): Promise<AIJob | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_next_ai_response_job');

      if (error) {
        console.error('Error getting next AI job:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      const jobData = data[0];
      return {
        id: jobData.job_id,
        conversation_id: jobData.conversation_id,
        message_id: jobData.message_id,
        user_message: jobData.user_message,
        conversation_context: jobData.conversation_context,
        customer_profile: jobData.customer_profile,
        priority: jobData.priority
      };
    } catch (error) {
      console.error('Error fetching next AI job:', error);
      return null;
    }
  }

  /**
   * Process a single AI response job
   */
  private async processJob(job: AIJob): Promise<void> {
    this.currentJobs.add(job.id);
    const startTime = Date.now();

    try {
      // Generate AI response with timeout
      const aiResponse = await Promise.race([
        this.generateAIResponse(job),
        this.createTimeoutPromise(this.maxResponseTime)
      ]);

      const processingTime = Date.now() - startTime;

      // Complete the job using our database function
      await supabase.rpc('complete_ai_response_job', {
        job_id: job.id,
        ai_response: aiResponse.response,
        confidence_score: aiResponse.confidence,
        requires_human: aiResponse.requiresHuman,
        processing_time_ms: processingTime,
        intent_detected: aiResponse.intent,
        sentiment_detected: aiResponse.sentiment,
        knowledge_sources: aiResponse.knowledgeUsed
      });

      console.log(`AI job ${job.id} completed in ${processingTime}ms`);
    } catch (error) {
      console.error(`Error processing AI job ${job.id}:`, error);
      
      // Fail the job using our database function
      await supabase.rpc('fail_ai_response_job', {
        job_id: job.id,
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      this.currentJobs.delete(job.id);
    }
  }

  /**
   * Generate AI response for a job
   */
  private async generateAIResponse(job: AIJob): Promise<AIResponseResult> {
    const startTime = Date.now();

    try {
      // Extract context from job
      const context = job.conversation_context || {};
      const customerProfile = job.customer_profile || {};
      const recentMessages = context.recent_messages || [];

      // Build conversation history
      const conversationHistory = recentMessages.map((msg: any) => ({
        role: msg.sender_type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      // Add current message
      conversationHistory.push({
        role: 'user',
        content: job.user_message
      });

      // Build AI prompt with context
      const prompt = this.buildAIPrompt(
        job.user_message,
        conversationHistory,
        customerProfile,
        context
      );

      // Generate AI response using aiService
      const aiResponse = await aiService.generateResponse(prompt, {
        maxTokens: 150,
        temperature: 0.7,
        model: 'gpt-4o-mini'
      });

      // Analyze response quality
      const confidence = this.calculateConfidence(aiResponse, job.user_message);
      const requiresHuman = confidence < 0.6 || this.detectHumanRequired(job.user_message);
      const intent = this.detectIntent(job.user_message);
      const sentiment = this.detectSentiment(job.user_message);

      return {
        response: aiResponse,
        confidence,
        requiresHuman,
        processingTime: Date.now() - startTime,
        intent,
        sentiment,
        knowledgeUsed: [] // TODO: Implement knowledge base integration
      };
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Return fallback response
      return {
        response: "I'm having trouble processing your request right now. Let me connect you with a human agent who can help you better.",
        confidence: 0.3,
        requiresHuman: true,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Build AI prompt with context
   */
  private buildAIPrompt(
    userMessage: string,
    conversationHistory: any[],
    customerProfile: any,
    context: any
  ): string {
    const customerName = customerProfile.name || 'Customer';
    const channel = context.channel_type || 'website';
    const language = context.language || 'en';

    return `You are a helpful customer support assistant for ROMASHKA. 

Customer: ${customerName}
Channel: ${channel}
Language: ${language}

Conversation History:
${conversationHistory.slice(-5).map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Current Message: ${userMessage}

Please provide a helpful, professional response that:
1. Addresses the customer's specific question or concern
2. Is appropriate for the ${channel} channel
3. Maintains a friendly, professional tone
4. Provides actionable information when possible
5. Keeps the response concise and relevant

Response:`;
  }

  /**
   * Calculate AI response confidence
   */
  private calculateConfidence(response: string, userMessage: string): number {
    // Simple confidence calculation based on response characteristics
    let confidence = 0.8; // Base confidence

    // Reduce confidence for very short responses
    if (response.length < 20) confidence -= 0.2;

    // Reduce confidence for generic responses
    if (response.includes('I don\'t understand') || 
        response.includes('I\'m not sure') ||
        response.includes('I don\'t know')) {
      confidence -= 0.3;
    }

    // Increase confidence for specific, actionable responses
    if (response.includes('you can') || 
        response.includes('please') ||
        response.includes('follow these steps')) {
      confidence += 0.1;
    }

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Detect if human intervention is required
   */
  private detectHumanRequired(userMessage: string): boolean {
    const humanRequiredKeywords = [
      'speak to human',
      'talk to person',
      'human agent',
      'manager',
      'escalate',
      'complaint',
      'frustrated',
      'angry',
      'disappointed',
      'refund',
      'cancel',
      'delete account',
      'legal',
      'lawsuit'
    ];

    return humanRequiredKeywords.some(keyword => 
      userMessage.toLowerCase().includes(keyword)
    );
  }

  /**
   * Detect user intent
   */
  private detectIntent(userMessage: string): string {
    const message = userMessage.toLowerCase();

    if (message.includes('help') || message.includes('support')) return 'help_request';
    if (message.includes('price') || message.includes('cost') || message.includes('billing')) return 'pricing_inquiry';
    if (message.includes('how to') || message.includes('tutorial')) return 'how_to_question';
    if (message.includes('problem') || message.includes('issue') || message.includes('error')) return 'technical_issue';
    if (message.includes('cancel') || message.includes('refund')) return 'cancellation_request';
    if (message.includes('thank')) return 'gratitude';
    if (message.includes('hello') || message.includes('hi')) return 'greeting';

    return 'general_inquiry';
  }

  /**
   * Detect user sentiment
   */
  private detectSentiment(userMessage: string): string {
    const message = userMessage.toLowerCase();

    const negativeKeywords = ['angry', 'frustrated', 'disappointed', 'terrible', 'awful', 'hate', 'worst'];
    const positiveKeywords = ['great', 'excellent', 'amazing', 'love', 'perfect', 'wonderful', 'thank'];

    if (negativeKeywords.some(keyword => message.includes(keyword))) return 'negative';
    if (positiveKeywords.some(keyword => message.includes(keyword))) return 'positive';

    return 'neutral';
  }

  /**
   * Create timeout promise
   */
  private createTimeoutPromise(timeout: number): Promise<AIResponseResult> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`AI response timeout after ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * Get processor status
   */
  public getStatus(): {
    isProcessing: boolean;
    currentJobs: number;
    maxConcurrentJobs: number;
  } {
    return {
      isProcessing: this.isProcessing,
      currentJobs: this.currentJobs.size,
      maxConcurrentJobs: this.maxConcurrentJobs
    };
  }
}

// Export singleton instance
export const aiResponseProcessor = new AIResponseProcessor();

// Auto-start processor when module is loaded
if (typeof window !== 'undefined') {
  // Only start in browser environment
  aiResponseProcessor.start();
}