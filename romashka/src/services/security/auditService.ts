import { supabase } from '../../lib/supabase';
import type { 
  SecurityAuditLog, 
  SecuritySession,
  AuditFilter,
  SecurityContext,
  SecurityAction
} from '../../types/security';

export class AuditService {
  private currentSession: SecuritySession | null = null;
  private currentUser: any = null;

  // ================================
  // AUDIT LOGGING
  // ================================

  async logAction(
    eventType: SecurityAuditLog['event_type'],
    action: SecurityAuditLog['action'],
    resourceType?: string,
    resourceId?: string,
    oldValues?: any,
    newValues?: any,
    context?: any
  ) {
    try {
      const userContext = await this.getCurrentUserContext();
      
      const auditLog: Omit<SecurityAuditLog, 'id' | 'created_at'> = {
        event_type: eventType,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        old_values: oldValues,
        new_values: newValues,
        user_id: userContext.user?.id,
        ip_address: userContext.ip_address,
        user_agent: userContext.user_agent,
        session_id: userContext.session?.session_token,
        risk_score: this.calculateRiskScore(eventType, action, userContext),
        geolocation: userContext.geolocation,
        success: true,
        additional_context: context
      };

      const { data, error } = await supabase
        .from('security_audit_logs')
        .insert([auditLog])
        .select()
        .single();

      if (error) throw error;

      // Check if this action requires immediate attention
      await this.checkForAnomalies(data);

      return { data, error: null };
    } catch (error) {
      console.error('Error logging audit action:', error);
      
      // Log the failure
      await this.logFailure(eventType, action, error.message);
      
      return { data: null, error: error.message };
    }
  }

  async logFailure(
    eventType: SecurityAuditLog['event_type'],
    action: SecurityAuditLog['action'],
    failureReason: string,
    context?: any
  ) {
    try {
      const userContext = await this.getCurrentUserContext();
      
      const auditLog: Omit<SecurityAuditLog, 'id' | 'created_at'> = {
        event_type: eventType,
        action,
        user_id: userContext.user?.id,
        ip_address: userContext.ip_address,
        user_agent: userContext.user_agent,
        session_id: userContext.session?.session_token,
        risk_score: this.calculateRiskScore(eventType, action, userContext, true),
        geolocation: userContext.geolocation,
        success: false,
        failure_reason: failureReason,
        additional_context: context
      };

      await supabase
        .from('security_audit_logs')
        .insert([auditLog]);
    } catch (error) {
      console.error('Error logging audit failure:', error);
    }
  }

  // ================================
  // CONVERSATION AUDIT TRAILS
  // ================================

  async logConversationAction(
    conversationId: string,
    action: 'created' | 'updated' | 'deleted' | 'assigned' | 'transferred' | 'archived',
    details?: any
  ) {
    return await this.logAction(
      'data_modify',
      action,
      'conversation',
      conversationId,
      details?.oldValues,
      details?.newValues,
      { conversation_action: action, ...details }
    );
  }

  async logMessageAction(
    messageId: string,
    conversationId: string,
    action: 'sent' | 'received' | 'edited' | 'deleted' | 'flagged',
    content?: string,
    details?: any
  ) {
    return await this.logAction(
      'data_modify',
      action,
      'message',
      messageId,
      details?.oldValues,
      details?.newValues,
      { 
        conversation_id: conversationId,
        message_action: action,
        content_preview: content?.substring(0, 100),
        ...details 
      }
    );
  }

  async logKnowledgeAction(
    knowledgeId: string,
    action: 'created' | 'updated' | 'deleted' | 'accessed' | 'used',
    details?: any
  ) {
    return await this.logAction(
      'data_modify',
      action,
      'knowledge_item',
      knowledgeId,
      details?.oldValues,
      details?.newValues,
      { knowledge_action: action, ...details }
    );
  }

  // ================================
  // SYSTEM ACCESS LOGGING
  // ================================

  async logLogin(success: boolean, method: string, details?: any) {
    const action = success ? 'login' : 'login_failed';
    const eventType = success ? 'login' : 'login';
    
    await this.logAction(
      eventType,
      action,
      'user',
      undefined,
      undefined,
      { method, ...details },
      { login_method: method, success }
    );

    if (success) {
      await this.startUserSession();
    }
  }

  async logLogout(reason?: string) {
    await this.logAction(
      'logout',
      'logout',
      'user',
      undefined,
      undefined,
      { logout_reason: reason },
      { logout_reason: reason }
    );

    await this.endUserSession(reason);
  }

  async logPermissionChange(
    targetUserId: string,
    oldPermissions: string[],
    newPermissions: string[],
    reason?: string
  ) {
    await this.logAction(
      'permission_change',
      'update',
      'user',
      targetUserId,
      { permissions: oldPermissions },
      { permissions: newPermissions },
      { permission_change_reason: reason }
    );
  }

  // ================================
  // SESSION MANAGEMENT
  // ================================

  async startUserSession() {
    try {
      const userContext = await this.getCurrentUserContext();
      
      if (!userContext.user) return;

      const sessionData: Omit<SecuritySession, 'id' | 'created_at'> = {
        user_id: userContext.user.id,
        session_token: this.generateSessionToken(),
        ip_address: userContext.ip_address,
        user_agent: userContext.user_agent,
        device_info: this.parseDeviceInfo(userContext.user_agent),
        geolocation: userContext.geolocation,
        is_active: true,
        last_activity: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      };

      const { data, error } = await supabase
        .from('security_sessions')
        .insert([sessionData])
        .select()
        .single();

      if (error) throw error;

      this.currentSession = data;
      return { data, error: null };
    } catch (error) {
      console.error('Error starting user session:', error);
      return { data: null, error: error.message };
    }
  }

  async updateSessionActivity() {
    if (!this.currentSession) return;

    try {
      const { data, error } = await supabase
        .from('security_sessions')
        .update({
          last_activity: new Date().toISOString(),
          geolocation: await this.getCurrentLocation()
        })
        .eq('id', this.currentSession.id)
        .select()
        .single();

      if (error) throw error;

      this.currentSession = data;
    } catch (error) {
      console.error('Error updating session activity:', error);
    }
  }

  async endUserSession(reason?: string) {
    if (!this.currentSession) return;

    try {
      await supabase
        .from('security_sessions')
        .update({
          is_active: false,
          invalidated_at: new Date().toISOString(),
          invalidation_reason: reason || 'logout'
        })
        .eq('id', this.currentSession.id);

      this.currentSession = null;
    } catch (error) {
      console.error('Error ending user session:', error);
    }
  }

  // ================================
  // AUDIT TRAIL RETRIEVAL
  // ================================

  async getAuditLogs(filters: AuditFilter = {}, page: number = 1, pageSize: number = 50) {
    try {
      let query = supabase
        .from('security_audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.event_type) {
        query = query.eq('event_type', filters.event_type);
      }
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters.resource_type) {
        query = query.eq('resource_type', filters.resource_type);
      }
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      if (filters.ip_address) {
        query = query.eq('ip_address', filters.ip_address);
      }
      if (filters.success !== undefined) {
        query = query.eq('success', filters.success);
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }
      if (filters.risk_score_min) {
        query = query.gte('risk_score', filters.risk_score_min);
      }
      if (filters.risk_score_max) {
        query = query.lte('risk_score', filters.risk_score_max);
      }

      // Apply pagination
      const offset = (page - 1) * pageSize;
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data,
        error: null,
        pagination: {
          page,
          pageSize,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize)
        }
      };
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return { data: null, error: error.message, pagination: null };
    }
  }

  async getConversationAuditTrail(conversationId: string) {
    try {
      const { data, error } = await supabase
        .from('security_audit_logs')
        .select('*')
        .eq('resource_type', 'conversation')
        .eq('resource_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching conversation audit trail:', error);
      return { data: null, error: error.message };
    }
  }

  async getUserActivitySummary(userId: string, dateFrom?: string, dateTo?: string) {
    try {
      const filters: AuditFilter = { user_id: userId };
      if (dateFrom) filters.date_from = dateFrom;
      if (dateTo) filters.date_to = dateTo;

      const { data, error } = await this.getAuditLogs(filters, 1, 1000);

      if (error) throw error;

      const summary = {
        total_actions: data?.length || 0,
        login_attempts: data?.filter(log => log.event_type === 'login').length || 0,
        failed_logins: data?.filter(log => log.event_type === 'login' && !log.success).length || 0,
        data_modifications: data?.filter(log => log.event_type === 'data_modify').length || 0,
        data_deletions: data?.filter(log => log.action === 'delete').length || 0,
        high_risk_actions: data?.filter(log => log.risk_score > 70).length || 0,
        unique_ip_addresses: [...new Set(data?.map(log => log.ip_address).filter(Boolean))].length,
        active_sessions: await this.getActiveSessionsCount(userId),
        last_activity: data?.[0]?.created_at
      };

      return { data: summary, error: null };
    } catch (error) {
      console.error('Error fetching user activity summary:', error);
      return { data: null, error: error.message };
    }
  }

  // ================================
  // COMPLIANCE REPORTING
  // ================================

  async generateComplianceReport(dateFrom: string, dateTo: string) {
    try {
      const filters: AuditFilter = { date_from: dateFrom, date_to: dateTo };
      const { data, error } = await this.getAuditLogs(filters, 1, 10000);

      if (error) throw error;

      const report = {
        period: { from: dateFrom, to: dateTo },
        total_events: data?.length || 0,
        event_breakdown: this.generateEventBreakdown(data || []),
        user_activity: this.generateUserActivityReport(data || []),
        security_events: this.generateSecurityEventsReport(data || []),
        data_access: this.generateDataAccessReport(data || []),
        compliance_highlights: this.generateComplianceHighlights(data || [])
      };

      return { data: report, error: null };
    } catch (error) {
      console.error('Error generating compliance report:', error);
      return { data: null, error: error.message };
    }
  }

  async exportAuditLogs(filters: AuditFilter = {}, format: 'csv' | 'json' | 'xlsx' = 'csv') {
    try {
      const { data, error } = await this.getAuditLogs(filters, 1, 10000);

      if (error) throw error;

      switch (format) {
        case 'csv':
          return this.convertToCSV(data || []);
        case 'json':
          return JSON.stringify(data, null, 2);
        case 'xlsx':
          return this.convertToXLSX(data || []);
        default:
          throw new Error('Unsupported format');
      }
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      throw error;
    }
  }

  // ================================
  // ANOMALY DETECTION
  // ================================

  private async checkForAnomalies(auditLog: SecurityAuditLog) {
    try {
      const anomalies = [];

      // Check for unusual login patterns
      if (auditLog.event_type === 'login' && auditLog.success) {
        const isUnusualLocation = await this.checkUnusualLocation(auditLog.user_id!, auditLog.geolocation);
        if (isUnusualLocation) {
          anomalies.push('unusual_location');
        }

        const isUnusualTime = await this.checkUnusualTime(auditLog.user_id!, auditLog.created_at);
        if (isUnusualTime) {
          anomalies.push('unusual_time');
        }
      }

      // Check for high-risk actions
      if (auditLog.risk_score > 80) {
        anomalies.push('high_risk_action');
      }

      // Check for rapid successive failures
      if (!auditLog.success) {
        const recentFailures = await this.getRecentFailures(auditLog.user_id!, 5);
        if (recentFailures >= 3) {
          anomalies.push('multiple_failures');
        }
      }

      // Create security alerts for anomalies
      if (anomalies.length > 0) {
        await this.createSecurityAlert(auditLog, anomalies);
      }
    } catch (error) {
      console.error('Error checking for anomalies:', error);
    }
  }

  private async createSecurityAlert(auditLog: SecurityAuditLog, anomalies: string[]) {
    try {
      const alertData = {
        alert_type: 'unusual_activity',
        severity: this.determineSeverity(anomalies),
        message: `Unusual activity detected: ${anomalies.join(', ')}`,
        details: {
          audit_log_id: auditLog.id,
          anomalies,
          risk_score: auditLog.risk_score,
          event_type: auditLog.event_type,
          action: auditLog.action
        },
        user_id: auditLog.user_id,
        ip_address: auditLog.ip_address,
        status: 'open'
      };

      await supabase
        .from('security_alerts')
        .insert([alertData]);
    } catch (error) {
      console.error('Error creating security alert:', error);
    }
  }

  // ================================
  // UTILITY METHODS
  // ================================

  private calculateRiskScore(
    eventType: string,
    action: string,
    context: SecurityContext,
    isFailure: boolean = false
  ): number {
    let score = 0;

    // Base score by event type
    switch (eventType) {
      case 'login':
        score += isFailure ? 30 : 10;
        break;
      case 'logout':
        score += 5;
        break;
      case 'data_delete':
        score += 60;
        break;
      case 'data_modify':
        score += 20;
        break;
      case 'permission_change':
        score += 50;
        break;
      default:
        score += 10;
    }

    // Adjust for action severity
    if (action === 'delete') score += 30;
    if (action === 'export') score += 20;

    // Adjust for context
    if (context.geolocation?.country && context.geolocation.country !== 'US') {
      score += 15;
    }

    // Adjust for time of day (higher risk during off-hours)
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  private async getCurrentUserContext(): Promise<SecurityContext> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      return {
        user: user as any,
        session: this.currentSession!,
        permissions: await this.getUserPermissions(user?.id),
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent,
        geolocation: await this.getCurrentLocation()
      };
    } catch (error) {
      console.error('Error getting user context:', error);
      return {
        user: null,
        session: null,
        permissions: [],
        ip_address: 'unknown',
        user_agent: 'unknown',
        geolocation: undefined
      };
    }
  }

  private async getUserPermissions(userId?: string): Promise<string[]> {
    if (!userId) return [];

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role:roles(permissions)')
        .eq('user_id', userId);

      if (error) throw error;

      const permissions = data?.flatMap(item => item.role?.permissions || []) || [];
      return [...new Set(permissions)];
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return [];
    }
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }

  private async getCurrentLocation() {
    try {
      const ip = await this.getClientIP();
      const response = await fetch(`https://ipapi.co/${ip}/json/`);
      const data = await response.json();
      
      return {
        country: data.country_name,
        city: data.city,
        coordinates: [data.longitude, data.latitude] as [number, number]
      };
    } catch (error) {
      return undefined;
    }
  }

  private generateSessionToken(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private parseDeviceInfo(userAgent: string) {
    // Simple device detection - can be enhanced with a proper library
    const isDesktop = !/(tablet|mobile|phone|ipad|android)/i.test(userAgent);
    const browser = this.getBrowserFromUserAgent(userAgent);
    const os = this.getOSFromUserAgent(userAgent);

    return {
      device_type: isDesktop ? 'desktop' : 'mobile',
      browser,
      os
    };
  }

  private getBrowserFromUserAgent(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getOSFromUserAgent(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private async getActiveSessionsCount(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('security_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      return 0;
    }
  }

  private generateEventBreakdown(logs: SecurityAuditLog[]) {
    const breakdown: Record<string, number> = {};
    logs.forEach(log => {
      breakdown[log.event_type] = (breakdown[log.event_type] || 0) + 1;
    });
    return breakdown;
  }

  private generateUserActivityReport(logs: SecurityAuditLog[]) {
    const users: Record<string, number> = {};
    logs.forEach(log => {
      if (log.user_id) {
        users[log.user_id] = (users[log.user_id] || 0) + 1;
      }
    });
    return users;
  }

  private generateSecurityEventsReport(logs: SecurityAuditLog[]) {
    const securityEvents = logs.filter(log => 
      log.event_type === 'login' || 
      log.event_type === 'permission_change' || 
      !log.success
    );
    
    return {
      total: securityEvents.length,
      failed_logins: securityEvents.filter(log => log.event_type === 'login' && !log.success).length,
      permission_changes: securityEvents.filter(log => log.event_type === 'permission_change').length,
      high_risk: securityEvents.filter(log => log.risk_score > 70).length
    };
  }

  private generateDataAccessReport(logs: SecurityAuditLog[]) {
    const dataAccess = logs.filter(log => 
      log.event_type === 'data_access' || 
      log.event_type === 'data_modify' || 
      log.event_type === 'data_delete'
    );
    
    return {
      total: dataAccess.length,
      modifications: dataAccess.filter(log => log.event_type === 'data_modify').length,
      deletions: dataAccess.filter(log => log.event_type === 'data_delete').length,
      exports: dataAccess.filter(log => log.action === 'export').length
    };
  }

  private generateComplianceHighlights(logs: SecurityAuditLog[]) {
    return {
      gdpr_related: logs.filter(log => log.additional_context?.gdpr_action).length,
      security_incidents: logs.filter(log => log.risk_score > 80).length,
      data_retention_actions: logs.filter(log => log.additional_context?.retention_action).length,
      failed_access_attempts: logs.filter(log => !log.success).length
    };
  }

  private convertToCSV(logs: SecurityAuditLog[]): string {
    const headers = [
      'ID', 'Event Type', 'Action', 'Resource Type', 'Resource ID',
      'User ID', 'IP Address', 'Success', 'Risk Score', 'Created At'
    ];

    const csvContent = [
      headers.join(','),
      ...logs.map(log => [
        log.id,
        log.event_type,
        log.action,
        log.resource_type || '',
        log.resource_id || '',
        log.user_id || '',
        log.ip_address || '',
        log.success,
        log.risk_score,
        log.created_at
      ].join(','))
    ];

    return csvContent.join('\n');
  }

  private convertToXLSX(logs: SecurityAuditLog[]): string {
    // This would require a library like xlsx or exceljs
    // For now, return CSV format
    return this.convertToCSV(logs);
  }

  private async checkUnusualLocation(userId: string, location?: any): Promise<boolean> {
    // Check if user has logged in from this location before
    if (!location) return false;

    try {
      const { data, error } = await supabase
        .from('security_audit_logs')
        .select('geolocation')
        .eq('user_id', userId)
        .eq('event_type', 'login')
        .eq('success', true)
        .not('geolocation', 'is', null);

      if (error) throw error;

      const previousLocations = data?.map(log => log.geolocation?.country).filter(Boolean) || [];
      return !previousLocations.includes(location.country);
    } catch (error) {
      console.error('Error checking unusual location:', error);
      return false;
    }
  }

  private async checkUnusualTime(userId: string, timestamp: string): Promise<boolean> {
    const hour = new Date(timestamp).getHours();
    
    // Get user's typical login hours
    try {
      const { data, error } = await supabase
        .from('security_audit_logs')
        .select('created_at')
        .eq('user_id', userId)
        .eq('event_type', 'login')
        .eq('success', true)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const loginHours = data?.map(log => new Date(log.created_at).getHours()) || [];
      const averageHour = loginHours.reduce((a, b) => a + b, 0) / loginHours.length;
      
      return Math.abs(hour - averageHour) > 4;
    } catch (error) {
      console.error('Error checking unusual time:', error);
      return false;
    }
  }

  private async getRecentFailures(userId: string, minutes: number): Promise<number> {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000).toISOString();
    
    try {
      const { data, error } = await supabase
        .from('security_audit_logs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('success', false)
        .gte('created_at', cutoff);

      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.error('Error getting recent failures:', error);
      return 0;
    }
  }

  private determineSeverity(anomalies: string[]): 'low' | 'medium' | 'high' | 'critical' {
    if (anomalies.includes('multiple_failures')) return 'high';
    if (anomalies.includes('high_risk_action')) return 'high';
    if (anomalies.includes('unusual_location')) return 'medium';
    if (anomalies.includes('unusual_time')) return 'low';
    return 'medium';
  }
}

export const auditService = new AuditService();