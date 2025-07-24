/**
 * Webhook Event Queue System
 * Redis-based queue for reliable webhook event processing
 */

import Redis from 'ioredis';
import { supabase } from '../supabaseClient';

export interface QueuedEvent {
  id: string;
  provider: string;
  event_type: string;
  payload: Record<string, any>;
  priority: 'high' | 'medium' | 'low';
  timestamp: string;
  retry_count?: number;
  max_retries?: number;
  delay_ms?: number;
}

export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  dead_letter: number;
}

export class WebhookEventQueue {
  private redis: Redis;
  private readonly QUEUE_PREFIX = 'webhook:queue';
  private readonly PROCESSING_PREFIX = 'webhook:processing';
  private readonly DEAD_LETTER_PREFIX = 'webhook:dead_letter';
  private readonly STATS_PREFIX = 'webhook:stats';
  private readonly DEFAULT_MAX_RETRIES = 3;
  private readonly DEFAULT_RETRY_DELAY = 5000; // 5 seconds
  private readonly PROCESSING_TIMEOUT = 300000; // 5 minutes

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });

    this.redis.on('error', (error) => {
      console.error('Redis connection error:', error);
    });

    this.redis.on('connect', () => {
      console.log('Connected to Redis for webhook queue');
    });

    // Start processing events
    this.startProcessing();
    
    // Start cleanup job for stuck events
    this.startCleanupJob();
  }

  /**
   * Add event to queue with priority
   */
  async enqueue(event: QueuedEvent): Promise<void> {
    try {
      const queueKey = this.getQueueKey(event.priority);
      const eventData = {
        ...event,
        retry_count: event.retry_count || 0,
        max_retries: event.max_retries || this.DEFAULT_MAX_RETRIES,
        enqueued_at: new Date().toISOString()
      };

      // Add to appropriate priority queue
      await this.redis.lpush(queueKey, JSON.stringify(eventData));

      // Update stats
      await this.incrementStat('pending');

      console.log(`Event ${event.id} queued with ${event.priority} priority`);
    } catch (error) {
      console.error('Error enqueueing event:', error);
      throw error;
    }
  }

  /**
   * Process events from queue
   */
  private async startProcessing(): Promise<void> {
    const processNextEvent = async () => {
      try {
        // Process high priority first, then medium, then low
        const priorities: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];
        
        for (const priority of priorities) {
          const event = await this.dequeue(priority);
          if (event) {
            await this.processEvent(event);
            break; // Process one event at a time
          }
        }
      } catch (error) {
        console.error('Error processing queue event:', error);
      }

      // Continue processing
      setTimeout(processNextEvent, 1000); // Check every second
    };

    processNextEvent();
  }

  /**
   * Dequeue event from priority queue
   */
  private async dequeue(priority: 'high' | 'medium' | 'low'): Promise<QueuedEvent | null> {
    try {
      const queueKey = this.getQueueKey(priority);
      const processingKey = this.getProcessingKey();

      // Move event from queue to processing
      const eventData = await this.redis.brpoplpush(queueKey, processingKey, 1);
      
      if (!eventData) return null;

      const event = JSON.parse(eventData) as QueuedEvent;
      
      // Set processing timeout
      await this.redis.expire(processingKey, this.PROCESSING_TIMEOUT / 1000);

      return event;
    } catch (error) {
      console.error('Error dequeuing event:', error);
      return null;
    }
  }

  /**
   * Process individual event
   */
  private async processEvent(event: QueuedEvent): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Update stats
      await this.decrementStat('pending');
      await this.incrementStat('processing');

      // Import WebhookManager to avoid circular dependency
      const { WebhookManager } = await import('./webhookManager');
      const webhookManager = new WebhookManager();

      // Process the event
      const result = await webhookManager.processWebhook(
        event.provider,
        event.event_type,
        event.payload,
        {}, // Headers not available in queued events
        'queue' // Source IP for queued events
      );

      if (result.success) {
        // Event processed successfully
        await this.markEventCompleted(event);
        await this.decrementStat('processing');
        await this.incrementStat('completed');
        
        console.log(`Event ${event.id} processed successfully in ${Date.now() - startTime}ms`);
      } else {
        throw new Error(`Processing failed: ${result.errors.join(', ')}`);
      }

    } catch (error) {
      console.error(`Error processing event ${event.id}:`, error);
      await this.handleEventError(event, error);
    }
  }

  /**
   * Handle event processing error with retry logic
   */
  private async handleEventError(event: QueuedEvent, error: any): Promise<void> {
    const retryCount = (event.retry_count || 0) + 1;
    const maxRetries = event.max_retries || this.DEFAULT_MAX_RETRIES;

    // Update stats
    await this.decrementStat('processing');

    if (retryCount <= maxRetries) {
      // Retry with exponential backoff
      const delay = this.calculateRetryDelay(retryCount);
      const retryEvent = {
        ...event,
        retry_count: retryCount
      };

      // Schedule retry
      setTimeout(async () => {
        await this.enqueue(retryEvent);
        console.log(`Event ${event.id} scheduled for retry ${retryCount}/${maxRetries} in ${delay}ms`);
      }, delay);

    } else {
      // Move to dead letter queue
      await this.moveToDeadLetterQueue(event, error);
      await this.incrementStat('failed');
      await this.incrementStat('dead_letter');
      
      console.error(`Event ${event.id} moved to dead letter queue after ${maxRetries} retries`);
    }
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(retryCount: number): number {
    const baseDelay = this.DEFAULT_RETRY_DELAY;
    return Math.min(baseDelay * Math.pow(2, retryCount - 1), 300000); // Max 5 minutes
  }

  /**
   * Move failed event to dead letter queue
   */
  private async moveToDeadLetterQueue(event: QueuedEvent, error: any): Promise<void> {
    const deadLetterKey = this.getDeadLetterKey();
    const deadLetterEvent = {
      ...event,
      failed_at: new Date().toISOString(),
      error_message: error instanceof Error ? error.message : 'Unknown error',
      error_stack: error instanceof Error ? error.stack : null
    };

    await this.redis.lpush(deadLetterKey, JSON.stringify(deadLetterEvent));
    
    // Also log to database
    await this.logDeadLetterEvent(deadLetterEvent);
  }

  /**
   * Mark event as completed and remove from processing
   */
  private async markEventCompleted(event: QueuedEvent): Promise<void> {
    const processingKey = this.getProcessingKey();
    await this.redis.lrem(processingKey, 1, JSON.stringify(event));
  }

  /**
   * Start cleanup job for stuck events
   */
  private startCleanupJob(): void {
    setInterval(async () => {
      try {
        await this.cleanupStuckEvents();
      } catch (error) {
        console.error('Error in cleanup job:', error);
      }
    }, 60000); // Run every minute
  }

  /**
   * Clean up events stuck in processing
   */
  private async cleanupStuckEvents(): Promise<void> {
    const processingKey = this.getProcessingKey();
    const stuckEvents = await this.redis.lrange(processingKey, 0, -1);

    for (const eventData of stuckEvents) {
      try {
        const event = JSON.parse(eventData) as QueuedEvent;
        const eventAge = Date.now() - new Date(event.timestamp).getTime();

        // If event is older than processing timeout, re-queue it
        if (eventAge > this.PROCESSING_TIMEOUT) {
          await this.redis.lrem(processingKey, 1, eventData);
          await this.handleEventError(event, new Error('Processing timeout'));
          console.log(`Cleaned up stuck event ${event.id}`);
        }
      } catch (error) {
        console.error('Error cleaning up stuck event:', error);
      }
    }
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<QueueStats> {
    const stats = await Promise.all([
      this.getStat('pending'),
      this.getStat('processing'),
      this.getStat('completed'),
      this.getStat('failed'),
      this.getStat('dead_letter')
    ]);

    return {
      pending: stats[0],
      processing: stats[1],
      completed: stats[2],
      failed: stats[3],
      dead_letter: stats[4]
    };
  }

  /**
   * Replay events from dead letter queue
   */
  async replayDeadLetterEvents(count?: number): Promise<number> {
    const deadLetterKey = this.getDeadLetterKey();
    const eventsToReplay = await this.redis.lrange(deadLetterKey, 0, count ? count - 1 : -1);
    
    let replayedCount = 0;
    
    for (const eventData of eventsToReplay) {
      try {
        const deadLetterEvent = JSON.parse(eventData);
        const originalEvent: QueuedEvent = {
          id: deadLetterEvent.id,
          provider: deadLetterEvent.provider,
          event_type: deadLetterEvent.event_type,
          payload: deadLetterEvent.payload,
          priority: deadLetterEvent.priority,
          timestamp: deadLetterEvent.timestamp,
          retry_count: 0 // Reset retry count
        };

        await this.enqueue(originalEvent);
        await this.redis.lrem(deadLetterKey, 1, eventData);
        await this.decrementStat('dead_letter');
        
        replayedCount++;
      } catch (error) {
        console.error('Error replaying dead letter event:', error);
      }
    }

    console.log(`Replayed ${replayedCount} events from dead letter queue`);
    return replayedCount;
  }

  /**
   * Clear all queues (for testing/maintenance)
   */
  async clearAllQueues(): Promise<void> {
    const keys = [
      this.getQueueKey('high'),
      this.getQueueKey('medium'),
      this.getQueueKey('low'),
      this.getProcessingKey(),
      this.getDeadLetterKey()
    ];

    await Promise.all(keys.map(key => this.redis.del(key)));
    
    // Reset stats
    await this.resetStats();
    
    console.log('All webhook queues cleared');
  }

  // Helper methods
  private getQueueKey(priority: string): string {
    return `${this.QUEUE_PREFIX}:${priority}`;
  }

  private getProcessingKey(): string {
    return `${this.PROCESSING_PREFIX}:${Date.now()}`;
  }

  private getDeadLetterKey(): string {
    return this.DEAD_LETTER_PREFIX;
  }

  private getStatKey(stat: string): string {
    return `${this.STATS_PREFIX}:${stat}`;
  }

  private async incrementStat(stat: string): Promise<void> {
    await this.redis.incr(this.getStatKey(stat));
  }

  private async decrementStat(stat: string): Promise<void> {
    await this.redis.decr(this.getStatKey(stat));
  }

  private async getStat(stat: string): Promise<number> {
    const value = await this.redis.get(this.getStatKey(stat));
    return parseInt(value || '0', 10);
  }

  private async resetStats(): Promise<void> {
    const statKeys = ['pending', 'processing', 'completed', 'failed', 'dead_letter'];
    await Promise.all(statKeys.map(stat => this.redis.del(this.getStatKey(stat))));
  }

  private async logDeadLetterEvent(event: any): Promise<void> {
    try {
      await supabase!
        .from('webhook_dead_letter')
        .insert({
          event_id: event.id,
          provider: event.provider,
          event_type: event.event_type,
          payload: event.payload,
          retry_count: event.retry_count,
          error_message: event.error_message,
          error_stack: event.error_stack,
          failed_at: event.failed_at,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging dead letter event:', error);
    }
  }
}