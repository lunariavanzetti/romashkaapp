import { supabase } from '../supabaseClient';
import type { 
  SyncJob, 
  SyncResult, 
  DataConflict, 
  ConflictResolution,
  Integration,
  IntegrationStatusInfo,
  IntegrationSettings
} from '../../types/integrations';

export interface SyncConfig {
  integrationId: string;
  syncType: 'full' | 'incremental' | 'real_time';
  direction: 'inbound' | 'outbound' | 'bidirectional';
  entities?: string[];
  filters?: Record<string, any>;
  batchSize?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export interface SyncStats {
  totalRecords: number;
  processedRecords: number;
  successfulRecords: number;
  failedRecords: number;
  conflictedRecords: number;
  skippedRecords: number;
  processingTime: number;
  errors: string[];
}

export interface ConflictResolutionRule {
  entity: string;
  field: string;
  strategy: 'source_wins' | 'target_wins' | 'merge' | 'manual' | 'custom';
  customRule?: (sourceValue: any, targetValue: any) => any;
}

export class SyncManager {
  private static instance: SyncManager;
  private syncJobs: Map<string, number> = new Map();
  private activeSyncs: Map<string, Promise<SyncResult>> = new Map();
  private conflictResolutionRules: Map<string, ConflictResolutionRule[]> = new Map();

  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  // Schedule a sync job
  async scheduleSync(config: SyncConfig): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('sync_jobs')
        .insert({
          integration_id: config.integrationId,
          job_type: config.syncType,
          direction: config.direction,
          status: 'pending',
          records_total: 0,
          records_processed: 0,
        })
        .select()
        .single();

      if (error) throw error;

      // Execute sync immediately for real-time, or schedule for later
      if (config.syncType === 'real_time') {
        this.executeSync(data.id, config);
      } else {
        // Schedule for execution based on integration settings
        this.scheduleDelayedSync(data.id, config);
      }

      return data.id;
    } catch (error) {
      console.error('Failed to schedule sync:', error);
      throw error;
    }
  }

  // Execute a sync job
  async executeSync(jobId: string, config: SyncConfig): Promise<SyncResult> {
    const existingSync = this.activeSyncs.get(jobId);
    if (existingSync) {
      return existingSync;
    }

    const syncPromise = this.performSync(jobId, config);
    this.activeSyncs.set(jobId, syncPromise);

    try {
      const result = await syncPromise;
      this.activeSyncs.delete(jobId);
      return result;
    } catch (error) {
      this.activeSyncs.delete(jobId);
      throw error;
    }
  }

  // Perform the actual sync operation
  private async performSync(jobId: string, config: SyncConfig): Promise<SyncResult> {
    const startTime = Date.now();
    const stats: SyncStats = {
      totalRecords: 0,
      processedRecords: 0,
      successfulRecords: 0,
      failedRecords: 0,
      conflictedRecords: 0,
      skippedRecords: 0,
      processingTime: 0,
      errors: []
    };

    try {
      // Update job status to running
      await this.updateSyncJobStatus(jobId, 'running', { started_at: new Date().toISOString() });

      // Get integration details
      const integration = await this.getIntegration(config.integrationId);
      if (!integration) {
        throw new Error('Integration not found');
      }

      // Get sync settings
      const syncSettings = integration.sync_settings || { batchSize: 100 };
      const batchSize = config.batchSize || syncSettings.batchSize || 100;

      // Perform sync based on direction
      if (config.direction === 'inbound' || config.direction === 'bidirectional') {
        const inboundResult = await this.performInboundSync(integration, config, batchSize);
        this.aggregateStats(stats, inboundResult);
      }

      if (config.direction === 'outbound' || config.direction === 'bidirectional') {
        const outboundResult = await this.performOutboundSync(integration, config, batchSize);
        this.aggregateStats(stats, outboundResult);
      }

      stats.processingTime = Date.now() - startTime;

      // Update job status to completed
      await this.updateSyncJobStatus(jobId, 'completed', {
        completed_at: new Date().toISOString(),
        records_processed: stats.processedRecords,
        records_total: stats.totalRecords
      });

      return {
        success: true,
        stats,
        conflicts: [], // Conflicts are handled during sync
        errors: stats.errors
      };

    } catch (error) {
      stats.processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await this.updateSyncJobStatus(jobId, 'failed', {
        error_details: { error: errorMessage, stats }
      });

      return {
        success: false,
        stats,
        conflicts: [],
        errors: [errorMessage, ...stats.errors]
      };
    }
  }

  // Perform inbound sync (from external system to ROMASHKA)
  private async performInboundSync(integration: Integration, config: SyncConfig, batchSize: number): Promise<SyncStats> {
    const stats: SyncStats = {
      totalRecords: 0,
      processedRecords: 0,
      successfulRecords: 0,
      failedRecords: 0,
      conflictedRecords: 0,
      skippedRecords: 0,
      processingTime: 0,
      errors: []
    };

    try {
      // Get provider service
      const providerService = await this.getProviderService(integration.provider);
      if (!providerService) {
        throw new Error(`Provider service not found: ${integration.provider}`);
      }

      // Get data from external system
      const externalData = await providerService.fetchData(integration.id, config.entities || []);
      stats.totalRecords = externalData.length;

      // Process data in batches
      for (let i = 0; i < externalData.length; i += batchSize) {
        const batch = externalData.slice(i, i + batchSize);
        
        for (const record of batch) {
          try {
            const result = await this.processInboundRecord(integration, record);
            if (result.success) {
              stats.successfulRecords++;
            } else if (result.conflict) {
              stats.conflictedRecords++;
              await this.handleConflict(integration.id, result.conflict);
            } else {
              stats.skippedRecords++;
            }
            stats.processedRecords++;
          } catch (error) {
            stats.failedRecords++;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            stats.errors.push(`Record ${record.id}: ${errorMessage}`);
          }
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      stats.errors.push(`Inbound sync failed: ${errorMessage}`);
    }

    return stats;
  }

  // Perform outbound sync (from ROMASHKA to external system)
  private async performOutboundSync(integration: Integration, config: SyncConfig, batchSize: number): Promise<SyncStats> {
    const stats: SyncStats = {
      totalRecords: 0,
      processedRecords: 0,
      successfulRecords: 0,
      failedRecords: 0,
      conflictedRecords: 0,
      skippedRecords: 0,
      processingTime: 0,
      errors: []
    };

    try {
      // Get provider service
      const providerService = await this.getProviderService(integration.provider);
      if (!providerService) {
        throw new Error(`Provider service not found: ${integration.provider}`);
      }

      // Get data from ROMASHKA
      const localData = await this.fetchLocalData(integration.id, config.entities || []);
      stats.totalRecords = localData.length;

      // Process data in batches
      for (let i = 0; i < localData.length; i += batchSize) {
        const batch = localData.slice(i, i + batchSize);
        
        for (const record of batch) {
          try {
            const result = await this.processOutboundRecord(integration, record);
            if (result.success) {
              stats.successfulRecords++;
            } else if (result.conflict) {
              stats.conflictedRecords++;
              await this.handleConflict(integration.id, result.conflict);
            } else {
              stats.skippedRecords++;
            }
            stats.processedRecords++;
          } catch (error) {
            stats.failedRecords++;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            stats.errors.push(`Record ${record.id}: ${errorMessage}`);
          }
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      stats.errors.push(`Outbound sync failed: ${errorMessage}`);
    }

    return stats;
  }

  // Process a single inbound record
  private async processInboundRecord(integration: Integration, record: any): Promise<{ success: boolean; conflict?: DataConflict }> {
    try {
      // Check if record already exists
      const existingRecord = await this.findExistingRecord(integration.id, record);
      
      if (existingRecord) {
        // Check for conflicts
        const conflicts = await this.detectConflicts(integration.id, existingRecord, record);
        
        if (conflicts.length > 0) {
          return {
            success: false,
            conflict: conflicts[0] // Return first conflict for now
          };
        }

        // Update existing record
        await this.updateLocalRecord(integration.id, existingRecord.id, record);
      } else {
        // Create new record
        await this.createLocalRecord(integration.id, record);
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to process inbound record:', error);
      return { success: false };
    }
  }

  // Process a single outbound record
  private async processOutboundRecord(integration: Integration, record: any): Promise<{ success: boolean; conflict?: DataConflict }> {
    try {
      // Get provider service
      const providerService = await this.getProviderService(integration.provider);
      if (!providerService) {
        throw new Error(`Provider service not found: ${integration.provider}`);
      }

      // Check if record exists in external system
      const externalRecord = await providerService.findRecord(integration.id, record);
      
      if (externalRecord) {
        // Check for conflicts
        const conflicts = await this.detectConflicts(integration.id, record, externalRecord);
        
        if (conflicts.length > 0) {
          return {
            success: false,
            conflict: conflicts[0]
          };
        }

        // Update external record
        await providerService.updateRecord(integration.id, externalRecord.id, record);
      } else {
        // Create new external record
        await providerService.createRecord(integration.id, record);
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to process outbound record:', error);
      return { success: false };
    }
  }

  // Detect conflicts between records
  private async detectConflicts(integrationId: string, localRecord: any, externalRecord: any): Promise<DataConflict[]> {
    const conflicts: DataConflict[] = [];

    // Get field mappings for comparison
    const fieldMappings = await this.getFieldMappings(integrationId);

    for (const mapping of fieldMappings) {
      const localValue = localRecord[mapping.source_field];
      const externalValue = externalRecord[mapping.target_field];

      if (localValue !== externalValue && localValue !== null && externalValue !== null) {
        conflicts.push({
          id: `${integrationId}-${mapping.source_field}`,
          integration_id: integrationId,
          entity_type: mapping.source_entity,
          entity_id: localRecord.id,
          field_name: mapping.source_field,
          local_value: localValue,
          external_value: externalValue,
          conflict_type: 'field_mismatch',
          status: 'pending',
          created_at: new Date().toISOString()
        });
      }
    }

    return conflicts;
  }

  // Handle conflict resolution
  private async handleConflict(integrationId: string, conflict: DataConflict): Promise<void> {
    // Get conflict resolution rules
    const rules = this.conflictResolutionRules.get(integrationId) || [];
    const rule = rules.find(r => r.entity === conflict.entity_type && r.field === conflict.field_name);

    if (rule) {
      let resolvedValue: any;

      switch (rule.strategy) {
        case 'source_wins':
          resolvedValue = conflict.local_value;
          break;
        case 'target_wins':
          resolvedValue = conflict.external_value;
          break;
        case 'merge':
          resolvedValue = this.mergeValues(conflict.local_value, conflict.external_value);
          break;
        case 'custom':
          resolvedValue = rule.customRule?.(conflict.local_value, conflict.external_value);
          break;
        default:
          // Store conflict for manual resolution
          await this.storeConflictForManualResolution(conflict);
          return;
      }

      // Apply resolution
      await this.applyConflictResolution(integrationId, conflict, resolvedValue);
    } else {
      // Store conflict for manual resolution
      await this.storeConflictForManualResolution(conflict);
    }
  }

  // Store conflict for manual resolution
  private async storeConflictForManualResolution(conflict: DataConflict): Promise<void> {
    const { error } = await supabase
      .from('data_conflicts')
      .insert(conflict);

    if (error) {
      console.error('Failed to store conflict:', error);
    }
  }

  // Apply conflict resolution
  private async applyConflictResolution(integrationId: string, conflict: DataConflict, resolvedValue: any): Promise<void> {
    try {
      // Update the record with resolved value
      await this.updateRecordWithResolvedValue(integrationId, conflict.entity_id, conflict.field_name, resolvedValue);

      // Mark conflict as resolved
      await supabase
        .from('data_conflicts')
        .update({
          status: 'resolved',
          resolved_value: resolvedValue,
          resolved_at: new Date().toISOString()
        })
        .eq('id', conflict.id);
    } catch (error) {
      console.error('Failed to apply conflict resolution:', error);
    }
  }

  // Get sync status for an integration
  async getSyncStatus(integrationId: string): Promise<IntegrationStatusInfo> {
    try {
      const { data: jobs, error } = await supabase
        .from('sync_jobs')
        .select('*')
        .eq('integration_id', integrationId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const lastJob = jobs[0];
      const runningJobs = jobs.filter(job => job.status === 'running');
      const failedJobs = jobs.filter(job => job.status === 'failed');

      return {
        integrationId,
        isRunning: runningJobs.length > 0,
        lastSyncAt: lastJob?.completed_at || lastJob?.started_at,
        lastSyncStatus: lastJob?.status || 'never',
        totalSyncs: jobs.length,
        failedSyncs: failedJobs.length,
        nextSyncAt: await this.getNextSyncTime(integrationId),
        recentJobs: jobs.slice(0, 5)
      };
    } catch (error) {
      console.error('Failed to get sync status:', error);
      throw error;
    }
  }

  // Pause sync for an integration
  async pauseSync(integrationId: string): Promise<void> {
    // Cancel any scheduled sync
    const timeout = this.syncJobs.get(integrationId);
    if (timeout) {
      clearTimeout(timeout);
      this.syncJobs.delete(integrationId);
    }

    // Update integration status
    await supabase
      .from('integrations')
      .update({ status: 'inactive' })
      .eq('id', integrationId);
  }

  // Resume sync for an integration
  async resumeSync(integrationId: string): Promise<void> {
    // Get integration
    const integration = await this.getIntegration(integrationId);
    if (!integration) return;

    // Update integration status
    await supabase
      .from('integrations')
      .update({ status: 'active' })
      .eq('id', integrationId);

    // Schedule next sync
    await this.scheduleNextSync(integrationId, integration.sync_settings);
  }

  // Retry failed sync job
  async retrySyncJob(jobId: string): Promise<SyncResult> {
    const { data: job, error } = await supabase
      .from('sync_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error || !job) {
      throw new Error('Sync job not found');
    }

    const config: SyncConfig = {
      integrationId: job.integration_id,
      syncType: job.job_type as any,
      direction: job.direction as any
    };

    return this.executeSync(jobId, config);
  }

  // Helper methods
  private async updateSyncJobStatus(jobId: string, status: string, updates: any = {}): Promise<void> {
    await supabase
      .from('sync_jobs')
      .update({ status, ...updates })
      .eq('id', jobId);
  }

  private async getIntegration(integrationId: string): Promise<Integration | null> {
    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', integrationId)
      .single();

    return error ? null : data;
  }

  private async getProviderService(provider: string): Promise<any> {
    // Dynamic import of provider service
    try {
      switch (provider) {
        case 'salesforce':
          const { SalesforceService } = await import('./crm/salesforceService');
          return new SalesforceService();
        case 'hubspot':
          const { HubSpotService } = await import('./crm/hubspotService');
          return new HubSpotService();
        case 'zendesk':
          const { ZendeskService } = await import('./helpdesk/zendeskService');
          return new ZendeskService();
        case 'shopify':
          const { ShopifyService } = await import('./ecommerce/shopifyService');
          return new ShopifyService();
        default:
          return null;
      }
    } catch (error) {
      console.error(`Failed to load provider service: ${provider}`, error);
      return null;
    }
  }

  private async getFieldMappings(integrationId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('field_mappings')
      .select('*')
      .eq('integration_id', integrationId);

    return error ? [] : data;
  }

  private async fetchLocalData(integrationId: string, entities: string[]): Promise<any[]> {
    // Implementation depends on the entities and local data structure
    // This is a placeholder
    return [];
  }

  private async findExistingRecord(integrationId: string, record: any): Promise<any> {
    // Implementation depends on the record structure and mapping
    // This is a placeholder
    return null;
  }

  private async createLocalRecord(integrationId: string, record: any): Promise<void> {
    // Implementation depends on the record structure and local schema
    // This is a placeholder
  }

  private async updateLocalRecord(integrationId: string, recordId: string, record: any): Promise<void> {
    // Implementation depends on the record structure and local schema
    // This is a placeholder
  }

  private async updateRecordWithResolvedValue(integrationId: string, recordId: string, fieldName: string, value: any): Promise<void> {
    // Implementation depends on the record structure and local schema
    // This is a placeholder
  }

  private mergeValues(localValue: any, externalValue: any): any {
    // Simple merge strategy - can be enhanced based on data types
    if (Array.isArray(localValue) && Array.isArray(externalValue)) {
      return [...new Set([...localValue, ...externalValue])];
    }
    if (typeof localValue === 'object' && typeof externalValue === 'object') {
      return { ...localValue, ...externalValue };
    }
    return externalValue; // Default to external value
  }

  private aggregateStats(target: SyncStats, source: SyncStats): void {
    target.totalRecords += source.totalRecords;
    target.processedRecords += source.processedRecords;
    target.successfulRecords += source.successfulRecords;
    target.failedRecords += source.failedRecords;
    target.conflictedRecords += source.conflictedRecords;
    target.skippedRecords += source.skippedRecords;
    target.errors.push(...source.errors);
  }

  private async scheduleDelayedSync(jobId: string, config: SyncConfig): Promise<void> {
    // Get integration sync frequency
    const integration = await this.getIntegration(config.integrationId);
    if (!integration) return;

    const frequency = integration.sync_frequency || 3600; // Default 1 hour
    const delay = frequency * 1000; // Convert to milliseconds

    const timeout = setTimeout(() => {
      this.executeSync(jobId, config);
    }, delay);

    this.syncJobs.set(config.integrationId, timeout);
  }

  private async scheduleNextSync(integrationId: string, syncSettings: any): Promise<void> {
    const frequency = syncSettings?.syncFrequency || 3600;
    const delay = frequency * 1000;

    const timeout = setTimeout(async () => {
      const config: SyncConfig = {
        integrationId,
        syncType: 'incremental',
        direction: syncSettings?.syncDirection || 'bidirectional'
      };

      await this.scheduleSync(config);
    }, delay);

    this.syncJobs.set(integrationId, timeout);
  }

  private async getNextSyncTime(integrationId: string): Promise<string | null> {
    const integration = await this.getIntegration(integrationId);
    if (!integration || integration.status !== 'active') return null;

    const frequency = integration.sync_frequency || 3600;
    const lastSync = integration.last_sync_at;
    
    if (lastSync) {
      const nextSync = new Date(lastSync);
      nextSync.setSeconds(nextSync.getSeconds() + frequency);
      return nextSync.toISOString();
    }

    return null;
  }

  // Set conflict resolution rules
  setConflictResolutionRules(integrationId: string, rules: ConflictResolutionRule[]): void {
    this.conflictResolutionRules.set(integrationId, rules);
  }

  // Get conflict resolution rules
  getConflictResolutionRules(integrationId: string): ConflictResolutionRule[] {
    return this.conflictResolutionRules.get(integrationId) || [];
  }
}

export const syncManager = SyncManager.getInstance();