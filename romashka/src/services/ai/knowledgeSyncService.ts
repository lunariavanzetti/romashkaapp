/**
 * Knowledge Synchronization Service
 * Automatically updates AI knowledge when integration data changes
 * Agent 93 - ROMASHKA Knowledge Intelligence System
 */

import { supabase } from '../supabaseClient';
import { knowledgeExtractor, KnowledgeGenerationOptions, KnowledgeGenerationResult } from './knowledgeExtractor';

export interface SyncConfiguration {
  userId: string;
  integrations: string[];
  syncFrequency: number; // minutes
  autoSync: boolean;
  conflictResolution: 'source_wins' | 'target_wins' | 'manual';
  batchSize: number;
  maxRetries: number;
}

export interface SyncStatus {
  id: string;
  user_id: string;
  integration: string;
  last_sync_at: Date;
  next_sync_at: Date;
  status: 'active' | 'paused' | 'error';
  sync_count: number;
  error_count: number;
  last_error?: string;
  configuration: SyncConfiguration;
}

export interface DataChangeEvent {
  id: string;
  integration: string;
  entity_type: string;
  entity_id: string;
  change_type: 'create' | 'update' | 'delete';
  old_data?: any;
  new_data?: any;
  detected_at: Date;
  processed: boolean;
}

export interface SyncJob {
  id: string;
  user_id: string;
  integration: string;
  job_type: 'full_sync' | 'incremental' | 'real_time';
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at?: Date;
  completed_at?: Date;
  records_processed: number;
  records_total: number;
  knowledge_generated: number;
  knowledge_updated: number;
  errors: string[];
  result?: KnowledgeGenerationResult;
}

export class KnowledgeSyncService {
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isProcessing: Map<string, boolean> = new Map();

  /**
   * Initialize sync service for a user
   */
  async initializeSync(userId: string, config: Partial<SyncConfiguration> = {}): Promise<SyncStatus[]> {
    const defaultConfig: SyncConfiguration = {
      userId,
      integrations: ['hubspot', 'shopify', 'salesforce'],
      syncFrequency: 60, // 1 hour
      autoSync: true,
      conflictResolution: 'source_wins',
      batchSize: 100,
      maxRetries: 3
    };

    const finalConfig = { ...defaultConfig, ...config };
    const syncStatuses: SyncStatus[] = [];

    // Create sync status for each integration
    for (const integration of finalConfig.integrations) {
      const status = await this.createOrUpdateSyncStatus(userId, integration, finalConfig);
      syncStatuses.push(status);

      // Start auto-sync if enabled
      if (finalConfig.autoSync) {
        await this.startAutoSync(status);
      }
    }

    return syncStatuses;
  }

  /**
   * Start automatic synchronization for an integration
   */
  async startAutoSync(syncStatus: SyncStatus): Promise<void> {
    const key = `${syncStatus.user_id}_${syncStatus.integration}`;
    
    // Clear existing interval if any
    const existingInterval = this.syncIntervals.get(key);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // Set up new interval
    const intervalMs = syncStatus.configuration.syncFrequency * 60 * 1000;
    const interval = setInterval(async () => {
      try {
        await this.performIncrementalSync(syncStatus.user_id, syncStatus.integration);
      } catch (error) {
        console.error(`Auto-sync error for ${syncStatus.integration}:`, error);
        await this.recordSyncError(syncStatus.id, error.message);
      }
    }, intervalMs);

    this.syncIntervals.set(key, interval);

    // Update status
    await this.updateSyncStatus(syncStatus.id, {
      status: 'active',
      next_sync_at: new Date(Date.now() + intervalMs)
    });
  }

  /**
   * Stop automatic synchronization
   */
  async stopAutoSync(userId: string, integration: string): Promise<void> {
    const key = `${userId}_${integration}`;
    const interval = this.syncIntervals.get(key);
    
    if (interval) {
      clearInterval(interval);
      this.syncIntervals.delete(key);
    }

    // Update status
    const syncStatus = await this.getSyncStatus(userId, integration);
    if (syncStatus) {
      await this.updateSyncStatus(syncStatus.id, {
        status: 'paused'
      });
    }
  }

  /**
   * Perform full synchronization for all integrations
   */
  async performFullSync(
    userId: string,
    options: Partial<KnowledgeGenerationOptions> = {}
  ): Promise<SyncJob[]> {
    const integrations = ['hubspot', 'shopify', 'salesforce'];
    const jobs: SyncJob[] = [];

    for (const integration of integrations) {
      const job = await this.createSyncJob(userId, integration, 'full_sync');
      jobs.push(job);

      // Process in background
      this.processSyncJob(job, options).catch(error => {
        console.error(`Full sync error for ${integration}:`, error);
      });
    }

    return jobs;
  }

  /**
   * Perform incremental synchronization
   */
  async performIncrementalSync(
    userId: string,
    integration: string,
    options: Partial<KnowledgeGenerationOptions> = {}
  ): Promise<SyncJob> {
    const job = await this.createSyncJob(userId, integration, 'incremental');
    
    // Process synchronously for incremental syncs
    await this.processSyncJob(job, options);
    
    return job;
  }

  /**
   * Process real-time data changes
   */
  async processDataChange(changeEvent: DataChangeEvent): Promise<void> {
    try {
      console.log(`Processing data change: ${changeEvent.change_type} ${changeEvent.entity_type} ${changeEvent.entity_id}`);

      const job = await this.createSyncJob(
        changeEvent.integration, // Assuming integration contains user info
        changeEvent.integration,
        'real_time'
      );

      await this.updateSyncJob(job.id, { status: 'running', started_at: new Date() });

      let result: KnowledgeGenerationResult;

      switch (changeEvent.change_type) {
        case 'create':
        case 'update':
          result = await this.processEntityUpdate(changeEvent);
          break;
        case 'delete':
          result = await this.processEntityDeletion(changeEvent);
          break;
        default:
          throw new Error(`Unknown change type: ${changeEvent.change_type}`);
      }

      await this.updateSyncJob(job.id, {
        status: 'completed',
        completed_at: new Date(),
        records_processed: 1,
        records_total: 1,
        knowledge_generated: result.generatedCount,
        knowledge_updated: result.updatedCount,
        result
      });

      // Mark change event as processed
      await this.markChangeEventProcessed(changeEvent.id);

    } catch (error) {
      console.error('Error processing data change:', error);
      await this.recordChangeProcessingError(changeEvent.id, error.message);
    }
  }

  /**
   * Detect data changes since last sync
   */
  async detectDataChanges(userId: string, integration: string): Promise<DataChangeEvent[]> {
    const syncStatus = await this.getSyncStatus(userId, integration);
    const lastSyncAt = syncStatus?.last_sync_at || new Date(0);

    const changes: DataChangeEvent[] = [];

    try {
      // Check for changes in different entity types based on integration
      switch (integration) {
        case 'hubspot':
          changes.push(...await this.detectHubSpotChanges(userId, lastSyncAt));
          break;
        case 'shopify':
          changes.push(...await this.detectShopifyChanges(userId, lastSyncAt));
          break;
        case 'salesforce':
          changes.push(...await this.detectSalesforceChanges(userId, lastSyncAt));
          break;
      }

      // Store detected changes
      for (const change of changes) {
        await this.storeDataChange(change);
      }

    } catch (error) {
      console.error(`Error detecting changes for ${integration}:`, error);
    }

    return changes;
  }

  /**
   * Detect HubSpot data changes
   */
  private async detectHubSpotChanges(userId: string, lastSyncAt: Date): Promise<DataChangeEvent[]> {
    const changes: DataChangeEvent[] = [];

    // Check contacts
    const { data: contacts } = await supabase
      .from('synced_contacts')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'hubspot')
      .gte('updated_at', lastSyncAt.toISOString());

    contacts?.forEach(contact => {
      changes.push({
        id: `hubspot_contact_${contact.external_id}_${Date.now()}`,
        integration: 'hubspot',
        entity_type: 'contact',
        entity_id: contact.external_id,
        change_type: 'update',
        new_data: contact,
        detected_at: new Date(),
        processed: false
      });
    });

    // Check deals
    const { data: deals } = await supabase
      .from('synced_deals')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'hubspot')
      .gte('updated_at', lastSyncAt.toISOString());

    deals?.forEach(deal => {
      changes.push({
        id: `hubspot_deal_${deal.external_id}_${Date.now()}`,
        integration: 'hubspot',
        entity_type: 'deal',
        entity_id: deal.external_id,
        change_type: 'update',
        new_data: deal,
        detected_at: new Date(),
        processed: false
      });
    });

    return changes;
  }

  /**
   * Detect Shopify data changes
   */
  private async detectShopifyChanges(userId: string, lastSyncAt: Date): Promise<DataChangeEvent[]> {
    const changes: DataChangeEvent[] = [];

    // Check products
    const { data: products } = await supabase
      .from('synced_products')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'shopify')
      .gte('updated_at', lastSyncAt.toISOString());

    products?.forEach(product => {
      changes.push({
        id: `shopify_product_${product.external_id}_${Date.now()}`,
        integration: 'shopify',
        entity_type: 'product',
        entity_id: product.external_id,
        change_type: 'update',
        new_data: product,
        detected_at: new Date(),
        processed: false
      });
    });

    // Check orders
    const { data: orders } = await supabase
      .from('synced_orders')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'shopify')
      .gte('updated_at', lastSyncAt.toISOString());

    orders?.forEach(order => {
      changes.push({
        id: `shopify_order_${order.external_id}_${Date.now()}`,
        integration: 'shopify',
        entity_type: 'order',
        entity_id: order.external_id,
        change_type: 'update',
        new_data: order,
        detected_at: new Date(),
        processed: false
      });
    });

    return changes;
  }

  /**
   * Detect Salesforce data changes
   */
  private async detectSalesforceChanges(userId: string, lastSyncAt: Date): Promise<DataChangeEvent[]> {
    const changes: DataChangeEvent[] = [];

    // Check contacts
    const { data: contacts } = await supabase
      .from('synced_contacts')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'salesforce')
      .gte('updated_at', lastSyncAt.toISOString());

    contacts?.forEach(contact => {
      changes.push({
        id: `salesforce_contact_${contact.external_id}_${Date.now()}`,
        integration: 'salesforce',
        entity_type: 'contact',
        entity_id: contact.external_id,
        change_type: 'update',
        new_data: contact,
        detected_at: new Date(),
        processed: false
      });
    });

    // Check deals
    const { data: deals } = await supabase
      .from('synced_deals')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'salesforce')
      .gte('updated_at', lastSyncAt.toISOString());

    deals?.forEach(deal => {
      changes.push({
        id: `salesforce_deal_${deal.external_id}_${Date.now()}`,
        integration: 'salesforce',
        entity_type: 'deal',
        entity_id: deal.external_id,
        change_type: 'update',
        new_data: deal,
        detected_at: new Date(),
        processed: false
      });
    });

    return changes;
  }

  /**
   * Process entity update/creation
   */
  private async processEntityUpdate(changeEvent: DataChangeEvent): Promise<KnowledgeGenerationResult> {
    const { integration, entity_type, new_data } = changeEvent;

    // Extract user ID from the data
    const userId = new_data.user_id;

    let result: KnowledgeGenerationResult;

    switch (`${integration}_${entity_type}`) {
      case 'hubspot_contact':
        result = await knowledgeExtractor.generateHubSpotContactKnowledge(userId, {
          batchSize: 1,
          regenerateExisting: true
        });
        break;
      case 'shopify_product':
        result = await knowledgeExtractor.generateShopifyProductKnowledge(userId, {
          batchSize: 1,
          regenerateExisting: true
        });
        break;
      case 'salesforce_contact':
      case 'salesforce_deal':
        result = await knowledgeExtractor.generateSalesforceDealKnowledge(userId, {
          batchSize: 1,
          regenerateExisting: true
        });
        break;
      default:
        throw new Error(`Unsupported entity type: ${integration}_${entity_type}`);
    }

    return result;
  }

  /**
   * Process entity deletion
   */
  private async processEntityDeletion(changeEvent: DataChangeEvent): Promise<KnowledgeGenerationResult> {
    const { integration, entity_id } = changeEvent;

    // Delete related knowledge items
    const { data: deletedItems, error } = await supabase
      .from('knowledge_items')
      .delete()
      .eq('source_integration', integration)
      .eq('external_id', entity_id)
      .select('id');

    if (error) throw error;

    return {
      success: true,
      totalRecords: 1,
      processedCount: 1,
      generatedCount: 0,
      updatedCount: 0,
      skippedCount: deletedItems?.length || 0,
      errors: [],
      duration: 0,
      generatedKnowledge: []
    };
  }

  /**
   * Create or update sync status
   */
  private async createOrUpdateSyncStatus(
    userId: string,
    integration: string,
    config: SyncConfiguration
  ): Promise<SyncStatus> {
    const { data: existing } = await supabase
      .from('knowledge_sync_status')
      .select('*')
      .eq('user_id', userId)
      .eq('integration', integration)
      .single();

    const statusData = {
      user_id: userId,
      integration,
      last_sync_at: existing?.last_sync_at || new Date(0),
      next_sync_at: new Date(Date.now() + config.syncFrequency * 60 * 1000),
      status: 'active' as const,
      sync_count: existing?.sync_count || 0,
      error_count: existing?.error_count || 0,
      configuration: config
    };

    if (existing) {
      const { data, error } = await supabase
        .from('knowledge_sync_status')
        .update(statusData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('knowledge_sync_status')
        .insert(statusData)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  }

  /**
   * Get sync status
   */
  private async getSyncStatus(userId: string, integration: string): Promise<SyncStatus | null> {
    const { data, error } = await supabase
      .from('knowledge_sync_status')
      .select('*')
      .eq('user_id', userId)
      .eq('integration', integration)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Update sync status
   */
  private async updateSyncStatus(id: string, updates: Partial<SyncStatus>): Promise<void> {
    const { error } = await supabase
      .from('knowledge_sync_status')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Create sync job
   */
  private async createSyncJob(
    userId: string,
    integration: string,
    jobType: 'full_sync' | 'incremental' | 'real_time'
  ): Promise<SyncJob> {
    const jobData = {
      user_id: userId,
      integration,
      job_type: jobType,
      status: 'pending' as const,
      records_processed: 0,
      records_total: 0,
      knowledge_generated: 0,
      knowledge_updated: 0,
      errors: []
    };

    const { data, error } = await supabase
      .from('knowledge_sync_jobs')
      .insert(jobData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update sync job
   */
  private async updateSyncJob(id: string, updates: Partial<SyncJob>): Promise<void> {
    const { error } = await supabase
      .from('knowledge_sync_jobs')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Process sync job
   */
  private async processSyncJob(
    job: SyncJob,
    options: Partial<KnowledgeGenerationOptions> = {}
  ): Promise<void> {
    const key = `${job.user_id}_${job.integration}`;
    
    // Prevent concurrent processing
    if (this.isProcessing.get(key)) {
      console.log(`Sync already in progress for ${key}`);
      return;
    }

    this.isProcessing.set(key, true);

    try {
      await this.updateSyncJob(job.id, { status: 'running', started_at: new Date() });

      let result: KnowledgeGenerationResult;

      switch (job.integration) {
        case 'hubspot':
          result = await knowledgeExtractor.generateHubSpotContactKnowledge(job.user_id, options);
          break;
        case 'shopify':
          result = await knowledgeExtractor.generateShopifyProductKnowledge(job.user_id, options);
          break;
        case 'salesforce':
          result = await knowledgeExtractor.generateSalesforceDealKnowledge(job.user_id, options);
          break;
        default:
          throw new Error(`Unsupported integration: ${job.integration}`);
      }

      await this.updateSyncJob(job.id, {
        status: result.success ? 'completed' : 'failed',
        completed_at: new Date(),
        records_processed: result.processedCount,
        records_total: result.totalRecords,
        knowledge_generated: result.generatedCount,
        knowledge_updated: result.updatedCount,
        errors: result.errors,
        result
      });

      // Update sync status
      const syncStatus = await this.getSyncStatus(job.user_id, job.integration);
      if (syncStatus) {
        await this.updateSyncStatus(syncStatus.id, {
          last_sync_at: new Date(),
          next_sync_at: new Date(Date.now() + syncStatus.configuration.syncFrequency * 60 * 1000),
          sync_count: syncStatus.sync_count + 1,
          error_count: result.success ? syncStatus.error_count : syncStatus.error_count + 1
        });
      }

    } catch (error) {
      console.error(`Sync job error:`, error);
      await this.updateSyncJob(job.id, {
        status: 'failed',
        completed_at: new Date(),
        errors: [error.message]
      });
    } finally {
      this.isProcessing.set(key, false);
    }
  }

  /**
   * Store data change event
   */
  private async storeDataChange(change: DataChangeEvent): Promise<void> {
    const { error } = await supabase
      .from('knowledge_data_changes')
      .insert(change);

    if (error) throw error;
  }

  /**
   * Mark change event as processed
   */
  private async markChangeEventProcessed(changeId: string): Promise<void> {
    const { error } = await supabase
      .from('knowledge_data_changes')
      .update({ processed: true })
      .eq('id', changeId);

    if (error) throw error;
  }

  /**
   * Record sync error
   */
  private async recordSyncError(syncStatusId: string, errorMessage: string): Promise<void> {
    const { error } = await supabase
      .from('knowledge_sync_status')
      .update({
        last_error: errorMessage,
        error_count: supabase.rpc('increment', { row_id: syncStatusId, column_name: 'error_count' })
      })
      .eq('id', syncStatusId);

    if (error) console.error('Error recording sync error:', error);
  }

  /**
   * Record change processing error
   */
  private async recordChangeProcessingError(changeId: string, errorMessage: string): Promise<void> {
    const { error } = await supabase
      .from('knowledge_data_changes')
      .update({ 
        processed: true,
        error_message: errorMessage
      })
      .eq('id', changeId);

    if (error) console.error('Error recording change processing error:', error);
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(userId: string): Promise<{
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    totalKnowledgeGenerated: number;
    totalKnowledgeUpdated: number;
    lastSyncTimes: Record<string, Date>;
    errorRate: number;
  }> {
    const { data: jobs } = await supabase
      .from('knowledge_sync_jobs')
      .select('*')
      .eq('user_id', userId);

    const { data: statuses } = await supabase
      .from('knowledge_sync_status')
      .select('*')
      .eq('user_id', userId);

    const totalJobs = jobs?.length || 0;
    const completedJobs = jobs?.filter(j => j.status === 'completed').length || 0;
    const failedJobs = jobs?.filter(j => j.status === 'failed').length || 0;
    const totalKnowledgeGenerated = jobs?.reduce((sum, j) => sum + (j.knowledge_generated || 0), 0) || 0;
    const totalKnowledgeUpdated = jobs?.reduce((sum, j) => sum + (j.knowledge_updated || 0), 0) || 0;
    
    const lastSyncTimes: Record<string, Date> = {};
    statuses?.forEach(status => {
      lastSyncTimes[status.integration] = status.last_sync_at;
    });

    const errorRate = totalJobs > 0 ? failedJobs / totalJobs : 0;

    return {
      totalJobs,
      completedJobs,
      failedJobs,
      totalKnowledgeGenerated,
      totalKnowledgeUpdated,
      lastSyncTimes,
      errorRate
    };
  }

  /**
   * Cleanup old sync jobs and change events
   */
  async cleanup(olderThanDays: number = 30): Promise<{ jobsDeleted: number; changesDeleted: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const { data: deletedJobs } = await supabase
      .from('knowledge_sync_jobs')
      .delete()
      .lt('completed_at', cutoffDate.toISOString())
      .select('id');

    const { data: deletedChanges } = await supabase
      .from('knowledge_data_changes')
      .delete()
      .eq('processed', true)
      .lt('detected_at', cutoffDate.toISOString())
      .select('id');

    return {
      jobsDeleted: deletedJobs?.length || 0,
      changesDeleted: deletedChanges?.length || 0
    };
  }
}

export const knowledgeSyncService = new KnowledgeSyncService();
export default knowledgeSyncService;