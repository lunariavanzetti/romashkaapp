import { supabase } from '../../lib/supabase';
import type { 
  DataConsent, 
  DataSubjectRequest, 
  DataRetentionPolicy, 
  GDPRExportData,
  ConsentSettings,
  DataProcessingActivity 
} from '../../types/security';

export class GDPRService {
  // ================================
  // CONSENT MANAGEMENT
  // ================================

  async recordConsent(consent: Omit<DataConsent, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('data_consent')
        .insert([consent])
        .select()
        .single();

      if (error) throw error;

      // Log the consent recording
      await this.logGDPRAction('consent_recorded', {
        consent_id: data.id,
        consent_type: consent.consent_type,
        customer_id: consent.customer_id,
        user_id: consent.user_id
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error recording consent:', error);
      return { data: null, error: error.message };
    }
  }

  async withdrawConsent(consentId: string, reason?: string) {
    try {
      const { data, error } = await supabase
        .from('data_consent')
        .update({
          consent_given: false,
          withdrawal_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', consentId)
        .select()
        .single();

      if (error) throw error;

      // Log the consent withdrawal
      await this.logGDPRAction('consent_withdrawn', {
        consent_id: consentId,
        reason,
        withdrawn_at: new Date().toISOString()
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error withdrawing consent:', error);
      return { data: null, error: error.message };
    }
  }

  async getConsentHistory(customerId?: string, userId?: string) {
    try {
      let query = supabase
        .from('data_consent')
        .select('*')
        .order('created_at', { ascending: false });

      if (customerId) {
        query = query.eq('customer_id', customerId);
      }
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching consent history:', error);
      return { data: null, error: error.message };
    }
  }

  async validateConsent(customerId: string, consentType: string, purpose: string) {
    try {
      const { data, error } = await supabase
        .from('data_consent')
        .select('*')
        .eq('customer_id', customerId)
        .eq('consent_type', consentType)
        .eq('consent_given', true)
        .is('withdrawal_date', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      const consent = data[0];
      if (!consent) return false;

      // Check if consent has expired
      if (consent.expiry_date && new Date(consent.expiry_date) < new Date()) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating consent:', error);
      return false;
    }
  }

  async updateConsentSettings(customerId: string, settings: ConsentSettings) {
    try {
      const consentTypes = ['essential', 'functional', 'analytics', 'marketing'];
      const results = [];

      for (const type of consentTypes) {
        const consentGiven = settings[type as keyof ConsentSettings];
        
        if (typeof consentGiven === 'boolean') {
          const result = await this.recordConsent({
            customer_id: customerId,
            consent_type: type as any,
            consent_given: consentGiven,
            consent_method: 'explicit',
            purpose: `${type} data processing`,
            legal_basis: 'consent',
            ip_address: await this.getClientIP(),
            user_agent: navigator.userAgent,
            source_url: window.location.href
          });
          results.push(result);
        }
      }

      return { data: results, error: null };
    } catch (error) {
      console.error('Error updating consent settings:', error);
      return { data: null, error: error.message };
    }
  }

  // ================================
  // DATA SUBJECT REQUESTS
  // ================================

  async submitDataSubjectRequest(request: Omit<DataSubjectRequest, 'id' | 'created_at' | 'updated_at' | 'status'>) {
    try {
      const { data, error } = await supabase
        .from('data_subject_requests')
        .insert([{ ...request, status: 'pending' }])
        .select()
        .single();

      if (error) throw error;

      // Log the request submission
      await this.logGDPRAction('data_subject_request_submitted', {
        request_id: data.id,
        request_type: request.request_type,
        customer_email: request.customer_email
      });

      // Send notification to compliance team
      await this.notifyComplianceTeam('new_data_subject_request', data);

      return { data, error: null };
    } catch (error) {
      console.error('Error submitting data subject request:', error);
      return { data: null, error: error.message };
    }
  }

  async processDataSubjectRequest(requestId: string, processedBy: string, notes?: string) {
    try {
      const { data, error } = await supabase
        .from('data_subject_requests')
        .update({
          status: 'processing',
          processed_by: processedBy,
          processing_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;

      // Log the processing start
      await this.logGDPRAction('data_subject_request_processing', {
        request_id: requestId,
        processed_by: processedBy,
        processing_notes: notes
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error processing data subject request:', error);
      return { data: null, error: error.message };
    }
  }

  async completeDataSubjectRequest(requestId: string, processedBy: string, notes?: string) {
    try {
      const { data, error } = await supabase
        .from('data_subject_requests')
        .update({
          status: 'completed',
          processed_by: processedBy,
          processing_notes: notes,
          completion_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;

      // Log the completion
      await this.logGDPRAction('data_subject_request_completed', {
        request_id: requestId,
        processed_by: processedBy,
        completion_date: new Date().toISOString()
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error completing data subject request:', error);
      return { data: null, error: error.message };
    }
  }

  // ================================
  // RIGHT TO BE FORGOTTEN
  // ================================

  async processDataErasure(customerId: string, requestId: string, processedBy: string) {
    try {
      // Start transaction for data erasure
      const erasureSteps = [
        this.eraseCustomerMessages(customerId),
        this.eraseCustomerConversations(customerId),
        this.eraseCustomerProfile(customerId),
        this.eraseCustomerFiles(customerId),
        this.eraseCustomerAnalytics(customerId),
        this.updateConsentRecords(customerId, 'erased')
      ];

      // Execute all erasure steps
      const results = await Promise.allSettled(erasureSteps);
      
      // Check if all steps succeeded
      const failures = results.filter(result => result.status === 'rejected');
      
      if (failures.length > 0) {
        console.error('Some erasure steps failed:', failures);
        throw new Error('Data erasure partially failed');
      }

      // Log the erasure completion
      await this.logGDPRAction('data_erasure_completed', {
        customer_id: customerId,
        request_id: requestId,
        processed_by: processedBy,
        erasure_date: new Date().toISOString()
      });

      // Complete the data subject request
      await this.completeDataSubjectRequest(requestId, processedBy, 'Data erasure completed successfully');

      return { success: true, error: null };
    } catch (error) {
      console.error('Error processing data erasure:', error);
      return { success: false, error: error.message };
    }
  }

  private async eraseCustomerMessages(customerId: string) {
    const { error } = await supabase
      .from('messages')
      .delete()
      .in('conversation_id', 
        supabase.from('conversations').select('id').eq('customer_id', customerId)
      );
    
    if (error) throw error;
  }

  private async eraseCustomerConversations(customerId: string) {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('customer_id', customerId);
    
    if (error) throw error;
  }

  private async eraseCustomerProfile(customerId: string) {
    const { error } = await supabase
      .from('customer_profiles')
      .delete()
      .eq('id', customerId);
    
    if (error) throw error;
  }

  private async eraseCustomerFiles(customerId: string) {
    const { error } = await supabase
      .from('file_attachments')
      .delete()
      .in('conversation_id', 
        supabase.from('conversations').select('id').eq('customer_id', customerId)
      );
    
    if (error) throw error;
  }

  private async eraseCustomerAnalytics(customerId: string) {
    const { error } = await supabase
      .from('conversation_analytics')
      .delete()
      .eq('customer_id', customerId);
    
    if (error) throw error;
  }

  private async updateConsentRecords(customerId: string, status: string) {
    const { error } = await supabase
      .from('data_consent')
      .update({
        consent_given: false,
        withdrawal_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('customer_id', customerId);
    
    if (error) throw error;
  }

  // ================================
  // DATA PORTABILITY
  // ================================

  async exportCustomerData(customerId: string, format: 'json' | 'csv' | 'xml' = 'json'): Promise<GDPRExportData> {
    try {
      // Fetch all customer data
      const [
        profile,
        conversations,
        messages,
        consentRecords,
        files
      ] = await Promise.all([
        this.getCustomerProfile(customerId),
        this.getCustomerConversations(customerId),
        this.getCustomerMessages(customerId),
        this.getConsentHistory(customerId),
        this.getCustomerFiles(customerId)
      ]);

      const exportData: GDPRExportData = {
        personal_data: {
          profile: profile.data,
          conversations: conversations.data || [],
          messages: messages.data || [],
          consent_records: consentRecords.data || []
        },
        metadata: {
          export_date: new Date().toISOString(),
          export_format: format,
          data_controller: 'ROMASHKA Customer Support Platform'
        }
      };

      // Log the data export
      await this.logGDPRAction('data_exported', {
        customer_id: customerId,
        export_format: format,
        export_date: new Date().toISOString()
      });

      return exportData;
    } catch (error) {
      console.error('Error exporting customer data:', error);
      throw error;
    }
  }

  private async getCustomerProfile(customerId: string) {
    return await supabase
      .from('customer_profiles')
      .select('*')
      .eq('id', customerId)
      .single();
  }

  private async getCustomerConversations(customerId: string) {
    return await supabase
      .from('conversations')
      .select('*')
      .eq('customer_id', customerId);
  }

  private async getCustomerMessages(customerId: string) {
    return await supabase
      .from('messages')
      .select('*')
      .in('conversation_id', 
        supabase.from('conversations').select('id').eq('customer_id', customerId)
      );
  }

  private async getCustomerFiles(customerId: string) {
    return await supabase
      .from('file_attachments')
      .select('*')
      .in('conversation_id', 
        supabase.from('conversations').select('id').eq('customer_id', customerId)
      );
  }

  async generateDataExportReport(customerId: string, format: 'json' | 'csv' | 'xml' = 'json') {
    try {
      const exportData = await this.exportCustomerData(customerId, format);
      
      if (format === 'json') {
        return JSON.stringify(exportData, null, 2);
      } else if (format === 'csv') {
        return this.convertToCSV(exportData);
      } else if (format === 'xml') {
        return this.convertToXML(exportData);
      }
    } catch (error) {
      console.error('Error generating data export report:', error);
      throw error;
    }
  }

  // ================================
  // DATA RETENTION
  // ================================

  async getDataRetentionPolicies() {
    try {
      const { data, error } = await supabase
        .from('data_retention_policies')
        .select('*')
        .order('data_category');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching data retention policies:', error);
      return { data: null, error: error.message };
    }
  }

  async createRetentionPolicy(policy: Omit<DataRetentionPolicy, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('data_retention_policies')
        .insert([policy])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating retention policy:', error);
      return { data: null, error: error.message };
    }
  }

  async checkDataRetentionCompliance() {
    try {
      const { data: policies, error } = await supabase
        .from('data_retention_policies')
        .select('*');

      if (error) throw error;

      const complianceResults = [];

      for (const policy of policies) {
        const result = await this.checkCategoryRetention(policy);
        complianceResults.push(result);
      }

      return { data: complianceResults, error: null };
    } catch (error) {
      console.error('Error checking data retention compliance:', error);
      return { data: null, error: error.message };
    }
  }

  private async checkCategoryRetention(policy: DataRetentionPolicy) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retention_period);

    let count = 0;
    let tableName = '';

    switch (policy.data_category) {
      case 'conversation_messages':
        tableName = 'messages';
        break;
      case 'customer_data':
        tableName = 'customer_profiles';
        break;
      case 'audit_logs':
        tableName = 'security_audit_logs';
        break;
      case 'session_data':
        tableName = 'security_sessions';
        break;
      default:
        return {
          category: policy.data_category,
          compliant: true,
          expired_records: 0,
          auto_delete_enabled: policy.auto_delete
        };
    }

    const { data, error } = await supabase
      .from(tableName)
      .select('id', { count: 'exact', head: true })
      .lt('created_at', cutoffDate.toISOString());

    if (!error && data) {
      count = data.length;
    }

    return {
      category: policy.data_category,
      compliant: count === 0,
      expired_records: count,
      auto_delete_enabled: policy.auto_delete,
      cutoff_date: cutoffDate.toISOString()
    };
  }

  // ================================
  // PROCESSING ACTIVITIES
  // ================================

  async getProcessingActivities() {
    try {
      const { data, error } = await supabase
        .from('data_processing_activities')
        .select('*')
        .order('activity_name');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching processing activities:', error);
      return { data: null, error: error.message };
    }
  }

  async createProcessingActivity(activity: Omit<DataProcessingActivity, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('data_processing_activities')
        .insert([activity])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating processing activity:', error);
      return { data: null, error: error.message };
    }
  }

  // ================================
  // UTILITY METHODS
  // ================================

  private async logGDPRAction(action: string, details: any) {
    try {
      await supabase
        .from('security_audit_logs')
        .insert([{
          event_type: 'data_modify',
          action: action,
          resource_type: 'gdpr',
          new_values: details,
          ip_address: await this.getClientIP(),
          user_agent: navigator.userAgent,
          success: true,
          additional_context: { gdpr_action: action }
        }]);
    } catch (error) {
      console.error('Error logging GDPR action:', error);
    }
  }

  private async notifyComplianceTeam(type: string, data: any) {
    // Implementation for notifying compliance team
    // This could be email, Slack, or in-app notifications
    console.log(`Compliance notification: ${type}`, data);
  }

  private async getClientIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }

  private convertToCSV(data: GDPRExportData): string {
    // Simple CSV conversion - can be enhanced
    const csvLines = [];
    csvLines.push('Category,Type,Data');
    
    // Add profile data
    if (data.personal_data.profile) {
      csvLines.push(`Profile,Personal Data,"${JSON.stringify(data.personal_data.profile).replace(/"/g, '""')}"`);
    }
    
    // Add conversations
    data.personal_data.conversations.forEach((conv, index) => {
      csvLines.push(`Conversation ${index + 1},Conversation Data,"${JSON.stringify(conv).replace(/"/g, '""')}"`);
    });
    
    // Add messages
    data.personal_data.messages.forEach((msg, index) => {
      csvLines.push(`Message ${index + 1},Message Data,"${JSON.stringify(msg).replace(/"/g, '""')}"`);
    });
    
    return csvLines.join('\n');
  }

  private convertToXML(data: GDPRExportData): string {
    // Simple XML conversion - can be enhanced
    return `
<?xml version="1.0" encoding="UTF-8"?>
<gdpr_export>
  <metadata>
    <export_date>${data.metadata.export_date}</export_date>
    <export_format>${data.metadata.export_format}</export_format>
    <data_controller>${data.metadata.data_controller}</data_controller>
  </metadata>
  <personal_data>
    <profile>${JSON.stringify(data.personal_data.profile)}</profile>
    <conversations>${JSON.stringify(data.personal_data.conversations)}</conversations>
    <messages>${JSON.stringify(data.personal_data.messages)}</messages>
    <consent_records>${JSON.stringify(data.personal_data.consent_records)}</consent_records>
  </personal_data>
</gdpr_export>
    `.trim();
  }
}

export const gdprService = new GDPRService();