import { supabase } from '../supabaseClient';
import type { 
  Integration, 
  IntegrationConfig, 
  IntegrationSettings, 
  SyncResult, 
  IntegrationStatusInfo,
  DataConflict,
  ConflictResolution,
  WebhookConfig
} from '../../types/integrations';

export interface IntegrationManager {
  createIntegration(config: IntegrationConfig): Promise<string>;
  testConnection(integrationId: string): Promise<boolean>;
  syncData(integrationId: string, syncType: 'full' | 'incremental'): Promise<SyncResult>;
  handleWebhook(integrationId: string, payload: any): Promise<void>;
  getIntegrationStatus(integrationId: string): Promise<IntegrationStatusInfo>;
  pauseIntegration(integrationId: string): Promise<void>;
  resumeIntegration(integrationId: string): Promise<void>;
  updateIntegration(integrationId: string, updates: Partial<Integration>): Promise<void>;
  deleteIntegration(integrationId: string): Promise<void>;
  getIntegrations(): Promise<Integration[]>;
  getIntegration(integrationId: string): Promise<Integration | null>;
  handleConflicts(conflicts: DataConflict[]): Promise<ConflictResolution[]>;
  scheduleSync(integrationId: string, frequency: number): Promise<void>;
}

export class IntegrationManagerService implements IntegrationManager {
  private syncJobs: Map<string, NodeJS.Timeout> = new Map();

  private checkSupabase(): void {
    if (!supabase) throw new Error('Supabase client not initialized');
  }

  async createIntegration(config: IntegrationConfig): Promise<string> {
    try {
      this.checkSupabase();
      
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase!
        .from('integrations')
        .insert({
          name: `${config.provider} Integration`,
          type: this.getIntegrationType(config.provider),
          provider: config.provider,
          status: 'pending_setup',
          configuration: config.settings,
          credentials: config.credentials,
          sync_settings: config.settings,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Set up field mappings if provided
      if (config.fieldMappings.length > 0) {
        await this.setupFieldMappings(data.id, config.fieldMappings);
      }

      // Set up webhooks if configured
      if (config.webhookConfig) {
        await this.setupWebhooks(data.id, config.webhookConfig);
      }

      return data.id;
    } catch (error) {
      console.error('Error creating integration:', error);
      throw error;
    }
  }

  async testConnection(integrationId: string): Promise<boolean> {
    try {
      const integration = await this.getIntegration(integrationId);
      if (!integration) throw new Error('Integration not found');

      // Test connection based on provider
      const isConnected = await this.testProviderConnection(integration);
      
      // Update integration status
      await this.updateIntegration(integrationId, {
        status: isConnected ? 'active' : 'error',
        error_count: isConnected ? 0 : integration.error_count + 1,
        last_error: isConnected ? undefined : 'Connection test failed'
      });

      return isConnected;
    } catch (error) {
      console.error('Error testing connection:', error);
      return false;
    }
  }

  async syncData(integrationId: string, syncType: 'full' | 'incremental'): Promise<SyncResult> {
    try {
      const integration = await this.getIntegration(integrationId);
      if (!integration) throw new Error('Integration not found');

      const startTime = Date.now();
      const syncJobId = await this.createSyncJob(integrationId, syncType);

      // Perform sync based on provider
      const syncResult = await this.performProviderSync(integration, syncType);

      // Update sync job
      await this.updateSyncJob(syncJobId, {
        status: syncResult.success ? 'completed' : 'failed',
        records_processed: syncResult.records_processed,
        records_total: syncResult.records_total,
        completed_at: new Date().toISOString(),
        error_details: syncResult.errors ? { errors: syncResult.errors } : undefined
      });

      // Update integration
      await this.updateIntegration(integrationId, {
        last_sync_at: new Date().toISOString(),
        error_count: syncResult.success ? 0 : integration.error_count + 1
      });

      return {
        ...syncResult,
        duration_ms: Date.now() - startTime,
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error syncing data:', error);
      return {
        success: false,
        records_processed: 0,
        records_total: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        duration_ms: 0,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      };
    }
  }

  async handleWebhook(integrationId: string, payload: any): Promise<void> {
    try {
      const integration = await this.getIntegration(integrationId);
      if (!integration) throw new Error('Integration not found');

      // Process webhook based on provider
      await this.processProviderWebhook(integration, payload);

      // Log webhook
      await this.logWebhook(integrationId, payload);
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw error;
    }
  }

  async getIntegrationStatus(integrationId: string): Promise<IntegrationStatusInfo> {
    try {
      const integration = await this.getIntegration(integrationId);
      if (!integration) throw new Error('Integration not found');

      this.checkSupabase();
      
      // Get sync jobs count
      const { count: syncJobsCount } = await supabase!
        .from('sync_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('integration_id', integrationId);

      // Get active webhooks count
      const { count: webhooksCount } = await supabase!
        .from('webhook_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('integration_id', integrationId)
        .eq('is_active', true);

      return {
        id: integrationId,
        status: integration.status,
        last_sync_at: integration.last_sync_at,
        error_count: integration.error_count,
        last_error: integration.last_error,
        sync_jobs_count: syncJobsCount || 0,
        active_webhooks_count: webhooksCount || 0
      };
    } catch (error) {
      console.error('Error getting integration status:', error);
      throw error;
    }
  }

  async pauseIntegration(integrationId: string): Promise<void> {
    try {
      await this.updateIntegration(integrationId, { status: 'inactive' });
      
      // Clear scheduled sync
      const timeout = this.syncJobs.get(integrationId);
      if (timeout) {
        clearTimeout(timeout);
        this.syncJobs.delete(integrationId);
      }
    } catch (error) {
      console.error('Error pausing integration:', error);
      throw error;
    }
  }

  async resumeIntegration(integrationId: string): Promise<void> {
    try {
      const integration = await this.getIntegration(integrationId);
      if (!integration) throw new Error('Integration not found');

      await this.updateIntegration(integrationId, { status: 'active' });
      
      // Resume scheduled sync if autoSync is enabled
      if (integration.sync_settings?.autoSync) {
        await this.scheduleSync(integrationId, integration.sync_frequency);
      }
    } catch (error) {
      console.error('Error resuming integration:', error);
      throw error;
    }
  }

  async updateIntegration(integrationId: string, updates: Partial<Integration>): Promise<void> {
    try {
      this.checkSupabase();
      
      const { error } = await supabase!
        .from('integrations')
        .update(updates)
        .eq('id', integrationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating integration:', error);
      throw error;
    }
  }

  async deleteIntegration(integrationId: string): Promise<void> {
    try {
      // Pause integration first
      await this.pauseIntegration(integrationId);

      this.checkSupabase();
      
      const { error } = await supabase!
        .from('integrations')
        .delete()
        .eq('id', integrationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting integration:', error);
      throw error;
    }
  }

  async getIntegrations(): Promise<Integration[]> {
    try {
      this.checkSupabase();
      
      const { data, error } = await supabase!
        .from('integrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting integrations:', error);
      throw error;
    }
  }

  async getIntegration(integrationId: string): Promise<Integration | null> {
    try {
      this.checkSupabase();
      const { data, error } = await supabase!
        .from('integrations')
        .select('*')
        .eq('id', integrationId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting integration:', error);
      return null;
    }
  }

  async handleConflicts(conflicts: DataConflict[]): Promise<ConflictResolution[]> {
    try {
      const resolutions: ConflictResolution[] = [];
      
      for (const conflict of conflicts) {
        // For now, use source_wins as default resolution
        // In a real implementation, this would involve user interaction
        const resolution: ConflictResolution = {
          conflict_id: conflict.id,
          resolution: 'source_wins',
          resolved_value: conflict.source_value,
          resolved_by: 'system',
          resolved_at: new Date().toISOString()
        };
        
        resolutions.push(resolution);
      }

      return resolutions;
    } catch (error) {
      console.error('Error handling conflicts:', error);
      throw error;
    }
  }

  async scheduleSync(integrationId: string, frequency: number): Promise<void> {
    try {
      // Clear existing sync job
      const existingTimeout = this.syncJobs.get(integrationId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Schedule new sync job
      const timeout = setTimeout(async () => {
        try {
          await this.syncData(integrationId, 'incremental');
          // Reschedule for next sync
          await this.scheduleSync(integrationId, frequency);
        } catch (error) {
          console.error('Error in scheduled sync:', error);
        }
      }, frequency * 1000);

      this.syncJobs.set(integrationId, timeout);
    } catch (error) {
      console.error('Error scheduling sync:', error);
      throw error;
    }
  }

  // Private helper methods
  private getIntegrationType(provider: string): Integration['type'] {
    const providerMap: Record<string, Integration['type']> = {
      'salesforce': 'crm',
      'hubspot': 'crm',
      'pipedrive': 'crm',
      'zendesk': 'helpdesk',
      'freshdesk': 'helpdesk',
      'intercom': 'helpdesk',
      'shopify': 'ecommerce',
      'woocommerce': 'ecommerce',
      'mailchimp': 'email_marketing',
      'google_calendar': 'calendar',
      'outlook_calendar': 'calendar'
    };

    return providerMap[provider] || 'crm';
  }

  private async setupFieldMappings(integrationId: string, fieldMappings: any[]): Promise<void> {
    try {
      this.checkSupabase();
      const { error } = await supabase!
        .from('field_mappings')
        .insert(
          fieldMappings.map(mapping => ({
            ...mapping,
            integration_id: integrationId
          }))
        );

      if (error) throw error;
    } catch (error) {
      console.error('Error setting up field mappings:', error);
      throw error;
    }
  }

  private async setupWebhooks(integrationId: string, webhookConfig: WebhookConfig): Promise<void> {
    try {
      this.checkSupabase();
      const { error } = await supabase!
        .from('webhook_subscriptions')
        .insert(
          webhookConfig.events.map(event => ({
            integration_id: integrationId,
            event_type: event,
            webhook_url: webhookConfig.url,
            secret_key: webhookConfig.secret,
            retry_count: webhookConfig.retry_count || 3,
            timeout_seconds: webhookConfig.timeout_seconds || 30
          }))
        );

      if (error) throw error;
    } catch (error) {
      console.error('Error setting up webhooks:', error);
      throw error;
    }
  }

  private async createSyncJob(integrationId: string, syncType: 'full' | 'incremental'): Promise<string> {
    try {
      this.checkSupabase();
      const { data, error } = await supabase!
        .from('sync_jobs')
        .insert({
          integration_id: integrationId,
          job_type: syncType === 'full' ? 'full_sync' : 'incremental',
          direction: 'bidirectional',
          status: 'running',
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating sync job:', error);
      throw error;
    }
  }

  private async updateSyncJob(jobId: string, updates: any): Promise<void> {
    try {
      this.checkSupabase();
      const { error } = await supabase!
        .from('sync_jobs')
        .update(updates)
        .eq('id', jobId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating sync job:', error);
      throw error;
    }
  }

  private async testProviderConnection(integration: Integration): Promise<boolean> {
    // This would be implemented based on the specific provider
    // For now, return true as a placeholder
    return true;
  }

  private async performProviderSync(integration: Integration, syncType: 'full' | 'incremental'): Promise<SyncResult> {
    // This would be implemented based on the specific provider
    // For now, return a mock result
    return {
      success: true,
      records_processed: 10,
      records_total: 10,
      errors: [],
      duration_ms: 1000,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString()
    };
  }

  private async processProviderWebhook(integration: Integration, payload: any): Promise<void> {
    // This would be implemented based on the specific provider
    console.log('Processing webhook for integration:', integration.id, payload);
  }

  private async logWebhook(integrationId: string, payload: any): Promise<void> {
    try {
      this.checkSupabase();
      const { error } = await supabase!
        .from('webhook_logs')
        .insert({
          integration_id: integrationId,
          event_type: 'webhook_received',
          payload,
          response_status: 200,
          processing_time_ms: 100
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging webhook:', error);
    }
  }
}

// Export singleton instance
export const integrationManager = new IntegrationManagerService(); 