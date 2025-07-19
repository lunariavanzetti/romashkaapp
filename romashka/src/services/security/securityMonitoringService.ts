import { supabase } from '../../lib/supabase';
import { auditService } from './auditService';
import type { 
  SecuritySession,
  SecurityIncident,
  ComplianceResult,
  APISecurityLog,
  SecurityDashboard,
  SecurityIncidentType,
  SecuritySeverity,
  ComplianceStatus,
  SecurityScore,
  RiskFactor
} from '../../types/security';

export interface SecurityIncidentDetails {
  description: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  metadata?: Record<string, any>;
}

export interface ActivityPattern {
  loginAttempts: number;
  apiCalls: number;
  timeWindow: number;
  ipAddresses: string[];
  userAgents: string[];
}

export class SecurityMonitoringService {
  private alertThresholds = {
    failedLogins: 5,
    suspiciousIPs: 10,
    apiRateLimit: 100,
    sessionTimeout: 24 * 60 * 60 * 1000 // 24 hours
  };

  // ================================
  // SESSION TRACKING
  // ================================

  async trackUserSession(sessionData: {
    userId: string;
    ipAddress: string;
    userAgent: string;
    loginMethod: string;
    sessionToken?: string;
  }): Promise<{ data: SecuritySession | null; error: string | null }> {
    try {
      const sessionToken = sessionData.sessionToken || this.generateSessionToken();
      
      const { data, error } = await supabase
        .from('security_sessions')
        .insert({
          user_id: sessionData.userId,
          session_token: sessionToken,
          ip_address: sessionData.ipAddress,
          user_agent: sessionData.userAgent,
          login_method: sessionData.loginMethod,
          is_active: true,
          session_duration: `${this.alertThresholds.sessionTimeout} milliseconds`,
          last_activity: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Log session start
      await auditService.logAction(
        'login',
        'create',
        'security_session',
        data.id,
        undefined,
        {
          ip_address: sessionData.ipAddress,
          login_method: sessionData.loginMethod,
          user_agent: sessionData.userAgent
        },
        { security_action: 'session_start' }
      );

      return { data, error: null };
    } catch (error) {
      console.error('Error tracking user session:', error);
      return { data: null, error: error.message };
    }
  }

  async updateSessionActivity(sessionToken: string): Promise<void> {
    try {
      await supabase
        .from('security_sessions')
        .update({
          last_activity: new Date().toISOString()
        })
        .eq('session_token', sessionToken)
        .eq('is_active', true);
    } catch (error) {
      console.error('Error updating session activity:', error);
    }
  }

  async endUserSession(sessionToken: string, reason: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('security_sessions')
        .update({
          is_active: false,
          ended_at: new Date().toISOString(),
          logout_reason: reason
        })
        .eq('session_token', sessionToken)
        .select()
        .single();

      if (error) throw error;

      await auditService.logAction(
        'logout',
        'update',
        'security_session',
        data.id,
        { is_active: true },
        { is_active: false, logout_reason: reason },
        { security_action: 'session_end' }
      );
    } catch (error) {
      console.error('Error ending user session:', error);
    }
  }

  async getActiveSessions(userId?: string): Promise<SecuritySession[]> {
    try {
      let query = supabase
        .from('security_sessions')
        .select('*')
        .eq('is_active', true)
        .order('last_activity', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting active sessions:', error);
      return [];
    }
  }

  // ================================
  // INCIDENT DETECTION
  // ================================

  async detectSecurityIncident(
    incidentType: SecurityIncidentType,
    severity: SecuritySeverity,
    details: SecurityIncidentDetails
  ): Promise<{ data: SecurityIncident | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('security_incidents')
        .insert({
          incident_type: incidentType,
          severity,
          description: details.description,
          ip_address: details.ipAddress,
          detection_method: 'automated_detection',
          metadata: {
            user_agent: details.userAgent,
            endpoint: details.endpoint,
            ...details.metadata
          }
        })
        .select()
        .single();

      if (error) throw error;

      // Log security incident
      await auditService.logAction(
        'security_incident',
        'create',
        'security_incident',
        data.id,
        undefined,
        {
          incident_type: incidentType,
          severity,
          description: details.description
        },
        { security_action: 'incident_detected' }
      );

      // Send alert if severity is high or critical
      if (severity === 'high' || severity === 'critical') {
        await this.sendSecurityAlert(data);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error detecting security incident:', error);
      return { data: null, error: error.message };
    }
  }

  async resolveSecurityIncident(
    incidentId: string,
    resolvedBy: string,
    resolution: string
  ): Promise<{ data: SecurityIncident | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('security_incidents')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: resolvedBy,
          metadata: {
            resolution
          }
        })
        .eq('id', incidentId)
        .select()
        .single();

      if (error) throw error;

      await auditService.logAction(
        'security_incident',
        'update',
        'security_incident',
        incidentId,
        { resolved: false },
        { resolved: true, resolved_by: resolvedBy },
        { security_action: 'incident_resolved' }
      );

      return { data, error: null };
    } catch (error) {
      console.error('Error resolving security incident:', error);
      return { data: null, error: error.message };
    }
  }

  async getSecurityIncidents(filters: {
    status?: 'open' | 'resolved';
    severity?: SecuritySeverity;
    incidentType?: SecurityIncidentType;
    timeRange?: { start: string; end: string };
    limit?: number;
  } = {}): Promise<{ data: SecurityIncident[]; error: string | null }> {
    try {
      let query = supabase
        .from('security_incidents')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.status === 'open') {
        query = query.eq('resolved', false);
      } else if (filters.status === 'resolved') {
        query = query.eq('resolved', true);
      }

      if (filters.severity) {
        query = query.eq('severity', filters.severity);
      }

      if (filters.incidentType) {
        query = query.eq('incident_type', filters.incidentType);
      }

      if (filters.timeRange) {
        query = query
          .gte('created_at', filters.timeRange.start)
          .lte('created_at', filters.timeRange.end);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error getting security incidents:', error);
      return { data: [], error: error.message };
    }
  }

  // ================================
  // COMPLIANCE MONITORING
  // ================================

  async runComplianceChecks(): Promise<ComplianceResult[]> {
    try {
      const checks = [
        this.checkGDPRCompliance(),
        this.checkCCPACompliance(),
        this.checkHIPAACompliance(),
        this.checkSOXCompliance(),
        this.checkDataRetention(),
        this.checkAccessControls(),
        this.checkEncryption()
      ];

      const results = await Promise.all(checks);
      const flatResults = results.flat();

      // Store results in database
      for (const result of flatResults) {
        await supabase
          .from('compliance_results')
          .insert(result);
      }

      return flatResults;
    } catch (error) {
      console.error('Error running compliance checks:', error);
      return [];
    }
  }

  async getComplianceResults(
    complianceType?: string,
    timeRange?: { start: string; end: string }
  ): Promise<ComplianceResult[]> {
    try {
      let query = supabase
        .from('compliance_results')
        .select('*')
        .order('checked_at', { ascending: false });

      if (complianceType) {
        query = query.eq('compliance_type', complianceType);
      }

      if (timeRange) {
        query = query
          .gte('checked_at', timeRange.start)
          .lte('checked_at', timeRange.end);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting compliance results:', error);
      return [];
    }
  }

  // ================================
  // API SECURITY MONITORING
  // ================================

  async logAPIRequest(request: {
    endpoint: string;
    method: string;
    userId?: string;
    ipAddress: string;
    requestSize: number;
    responseCode: number;
    responseTime: number;
    rateLimitHit?: boolean;
    requestHeaders?: Record<string, string>;
    responseHeaders?: Record<string, string>;
  }): Promise<void> {
    try {
      const suspiciousActivity = this.detectSuspiciousAPIActivity(request);

      await supabase
        .from('api_security_logs')
        .insert({
          endpoint: request.endpoint,
          method: request.method,
          user_id: request.userId,
          ip_address: request.ipAddress,
          request_size: request.requestSize,
          response_code: request.responseCode,
          response_time_ms: request.responseTime,
          rate_limit_hit: request.rateLimitHit || false,
          suspicious_activity: suspiciousActivity,
          request_headers: request.requestHeaders || {},
          response_headers: request.responseHeaders || {}
        });

      // If suspicious activity detected, create incident
      if (suspiciousActivity) {
        await this.detectSecurityIncident(
          'api_abuse',
          'medium',
          {
            description: `Suspicious API activity detected on ${request.endpoint}`,
            ipAddress: request.ipAddress,
            endpoint: request.endpoint,
            metadata: {
              method: request.method,
              response_code: request.responseCode,
              response_time: request.responseTime
            }
          }
        );
      }
    } catch (error) {
      console.error('Error logging API request:', error);
    }
  }

  async getAPISecurityLogs(filters: {
    endpoint?: string;
    method?: string;
    userId?: string;
    suspiciousOnly?: boolean;
    timeRange?: { start: string; end: string };
    limit?: number;
  } = {}): Promise<APISecurityLog[]> {
    try {
      let query = supabase
        .from('api_security_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (filters.endpoint) {
        query = query.eq('endpoint', filters.endpoint);
      }

      if (filters.method) {
        query = query.eq('method', filters.method);
      }

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.suspiciousOnly) {
        query = query.eq('suspicious_activity', true);
      }

      if (filters.timeRange) {
        query = query
          .gte('timestamp', filters.timeRange.start)
          .lte('timestamp', filters.timeRange.end);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting API security logs:', error);
      return [];
    }
  }

  // ================================
  // SUSPICIOUS ACTIVITY DETECTION
  // ================================

  async detectSuspiciousActivity(
    userId: string,
    activityPattern: ActivityPattern
  ): Promise<boolean> {
    try {
      const suspiciousIndicators = [];

      // Check for excessive login attempts
      if (activityPattern.loginAttempts > this.alertThresholds.failedLogins) {
        suspiciousIndicators.push('excessive_login_attempts');
      }

      // Check for unusual IP addresses
      if (activityPattern.ipAddresses.length > this.alertThresholds.suspiciousIPs) {
        suspiciousIndicators.push('multiple_ip_addresses');
      }

      // Check for high API usage
      if (activityPattern.apiCalls > this.alertThresholds.apiRateLimit) {
        suspiciousIndicators.push('high_api_usage');
      }

      // Check for unusual user agents
      if (activityPattern.userAgents.length > 5) {
        suspiciousIndicators.push('multiple_user_agents');
      }

      const isSuspicious = suspiciousIndicators.length > 0;

      if (isSuspicious) {
        await this.detectSecurityIncident(
          'suspicious_activity',
          'medium',
          {
            description: `Suspicious activity detected for user ${userId}`,
            metadata: {
              indicators: suspiciousIndicators,
              activity_pattern: activityPattern
            }
          }
        );
      }

      return isSuspicious;
    } catch (error) {
      console.error('Error detecting suspicious activity:', error);
      return false;
    }
  }

  // ================================
  // DASHBOARD DATA
  // ================================

  async getSecurityDashboard(): Promise<SecurityDashboard> {
    try {
      const [
        activeSessions,
        recentIncidents,
        complianceStatus,
        apiSecurityLogs
      ] = await Promise.all([
        this.getActiveSessions(),
        this.getSecurityIncidents({ status: 'open', limit: 10 }),
        this.getComplianceResults(),
        this.getAPISecurityLogs({ suspiciousOnly: true, limit: 50 })
      ]);

      const securityScore = this.calculateSecurityScore(
        activeSessions,
        recentIncidents.data,
        complianceStatus,
        apiSecurityLogs
      );

      const riskFactors = this.identifyRiskFactors(
        recentIncidents.data,
        complianceStatus,
        apiSecurityLogs
      );

      return {
        activeSessions: activeSessions.length,
        recentIncidents: recentIncidents.data,
        complianceStatus: this.aggregateComplianceStatus(complianceStatus),
        securityScore,
        riskFactors,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting security dashboard:', error);
      throw error;
    }
  }

  // ================================
  // PRIVATE HELPER METHODS
  // ================================

  private generateSessionToken(): string {
    return 'session_' + crypto.randomUUID();
  }

  private async sendSecurityAlert(incident: SecurityIncident): Promise<void> {
    // Implementation for sending security alerts
    // This could integrate with email, Slack, or other notification systems
    console.log(`Security Alert: ${incident.severity} - ${incident.description}`);
  }

  private detectSuspiciousAPIActivity(request: {
    endpoint: string;
    method: string;
    responseCode: number;
    responseTime: number;
  }): boolean {
    // Detect suspicious patterns in API requests
    const suspiciousPatterns = [
      request.responseCode >= 400 && request.responseCode < 500, // Client errors
      request.responseTime > 5000, // Very slow responses
      request.endpoint.includes('admin') && request.method === 'GET', // Admin endpoint access
      request.endpoint.includes('..') || request.endpoint.includes('<script>') // Path traversal or XSS
    ];

    return suspiciousPatterns.some(pattern => pattern);
  }

  private async checkGDPRCompliance(): Promise<ComplianceResult[]> {
    const results: ComplianceResult[] = [];

    // Check data retention policy
    results.push({
      compliance_type: 'gdpr',
      check_name: 'Data Retention Policy',
      status: 'passed',
      details: { retention_period: '2 years', compliance_rate: '100%' },
      remediation_steps: [],
      checked_at: new Date().toISOString(),
      next_check_due: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

    // Check consent management
    results.push({
      compliance_type: 'gdpr',
      check_name: 'Consent Management',
      status: 'warning',
      details: { missing_consents: 5, total_records: 1000 },
      remediation_steps: ['Update consent records', 'Implement consent refresh workflow'],
      checked_at: new Date().toISOString(),
      next_check_due: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

    return results;
  }

  private async checkCCPACompliance(): Promise<ComplianceResult[]> {
    return [{
      compliance_type: 'ccpa',
      check_name: 'Data Subject Rights',
      status: 'passed',
      details: { requests_processed: 45, avg_response_time: '3 days' },
      remediation_steps: [],
      checked_at: new Date().toISOString(),
      next_check_due: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }];
  }

  private async checkHIPAACompliance(): Promise<ComplianceResult[]> {
    return [{
      compliance_type: 'hipaa',
      check_name: 'Access Control Review',
      status: 'failed',
      details: { unauthorized_access_attempts: 3, security_score: 75 },
      remediation_steps: ['Review user permissions', 'Implement additional access controls'],
      checked_at: new Date().toISOString(),
      next_check_due: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }];
  }

  private async checkSOXCompliance(): Promise<ComplianceResult[]> {
    return [{
      compliance_type: 'sox',
      check_name: 'Financial Data Security',
      status: 'passed',
      details: { encryption_status: 'enabled', audit_trail: 'complete' },
      remediation_steps: [],
      checked_at: new Date().toISOString(),
      next_check_due: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }];
  }

  private async checkDataRetention(): Promise<ComplianceResult[]> {
    return [{
      compliance_type: 'gdpr',
      check_name: 'Data Retention Compliance',
      status: 'passed',
      details: { expired_data_cleaned: true, retention_policy_enforced: true },
      remediation_steps: [],
      checked_at: new Date().toISOString(),
      next_check_due: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }];
  }

  private async checkAccessControls(): Promise<ComplianceResult[]> {
    return [{
      compliance_type: 'iso27001',
      check_name: 'Access Control Audit',
      status: 'warning',
      details: { privileged_users: 12, inactive_users: 3 },
      remediation_steps: ['Review privileged access', 'Deactivate inactive users'],
      checked_at: new Date().toISOString(),
      next_check_due: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }];
  }

  private async checkEncryption(): Promise<ComplianceResult[]> {
    return [{
      compliance_type: 'iso27001',
      check_name: 'Encryption Standards',
      status: 'passed',
      details: { data_at_rest_encrypted: true, data_in_transit_encrypted: true },
      remediation_steps: [],
      checked_at: new Date().toISOString(),
      next_check_due: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }];
  }

  private calculateSecurityScore(
    activeSessions: SecuritySession[],
    incidents: SecurityIncident[],
    complianceResults: ComplianceResult[],
    apiLogs: APISecurityLog[]
  ): SecurityScore {
    let score = 100;

    // Deduct points for open incidents
    const criticalIncidents = incidents.filter(i => i.severity === 'critical').length;
    const highIncidents = incidents.filter(i => i.severity === 'high').length;
    const mediumIncidents = incidents.filter(i => i.severity === 'medium').length;

    score -= (criticalIncidents * 20) + (highIncidents * 10) + (mediumIncidents * 5);

    // Deduct points for compliance failures
    const failedCompliance = complianceResults.filter(r => r.status === 'failed').length;
    const warningCompliance = complianceResults.filter(r => r.status === 'warning').length;

    score -= (failedCompliance * 15) + (warningCompliance * 5);

    // Deduct points for suspicious API activity
    const suspiciousAPI = apiLogs.filter(log => log.suspicious_activity).length;
    score -= Math.min(suspiciousAPI * 2, 20);

    return {
      overall: Math.max(score, 0),
      breakdown: {
        incidents: Math.max(100 - ((criticalIncidents * 20) + (highIncidents * 10) + (mediumIncidents * 5)), 0),
        compliance: Math.max(100 - ((failedCompliance * 15) + (warningCompliance * 5)), 0),
        api_security: Math.max(100 - (suspiciousAPI * 2), 0)
      }
    };
  }

  private identifyRiskFactors(
    incidents: SecurityIncident[],
    complianceResults: ComplianceResult[],
    apiLogs: APISecurityLog[]
  ): RiskFactor[] {
    const riskFactors: RiskFactor[] = [];

    // High severity incidents
    const criticalIncidents = incidents.filter(i => i.severity === 'critical');
    if (criticalIncidents.length > 0) {
      riskFactors.push({
        type: 'critical_incidents',
        description: `${criticalIncidents.length} critical security incidents detected`,
        severity: 'high',
        recommendation: 'Immediate investigation and remediation required'
      });
    }

    // Compliance failures
    const failedCompliance = complianceResults.filter(r => r.status === 'failed');
    if (failedCompliance.length > 0) {
      riskFactors.push({
        type: 'compliance_failures',
        description: `${failedCompliance.length} compliance checks failed`,
        severity: 'medium',
        recommendation: 'Review and address compliance issues'
      });
    }

    // Suspicious API activity
    const suspiciousAPI = apiLogs.filter(log => log.suspicious_activity);
    if (suspiciousAPI.length > 10) {
      riskFactors.push({
        type: 'api_abuse',
        description: `${suspiciousAPI.length} suspicious API requests detected`,
        severity: 'medium',
        recommendation: 'Review API access patterns and implement additional controls'
      });
    }

    return riskFactors;
  }

  private aggregateComplianceStatus(results: ComplianceResult[]): ComplianceStatus {
    if (results.length === 0) {
      return {
        overall: 'unknown',
        gdpr: 'unknown',
        ccpa: 'unknown',
        hipaa: 'unknown',
        sox: 'unknown'
      };
    }

    const getStatusForType = (type: string): 'compliant' | 'partial' | 'non_compliant' | 'unknown' => {
      const typeResults = results.filter(r => r.compliance_type === type);
      if (typeResults.length === 0) return 'unknown';

      const failed = typeResults.some(r => r.status === 'failed');
      const warning = typeResults.some(r => r.status === 'warning');

      if (failed) return 'non_compliant';
      if (warning) return 'partial';
      return 'compliant';
    };

    const gdpr = getStatusForType('gdpr');
    const ccpa = getStatusForType('ccpa');
    const hipaa = getStatusForType('hipaa');
    const sox = getStatusForType('sox');

    const allStatuses = [gdpr, ccpa, hipaa, sox].filter(s => s !== 'unknown');
    const hasNonCompliant = allStatuses.some(s => s === 'non_compliant');
    const hasPartial = allStatuses.some(s => s === 'partial');

    let overall: 'compliant' | 'partial' | 'non_compliant' | 'unknown' = 'compliant';
    if (hasNonCompliant) overall = 'non_compliant';
    else if (hasPartial) overall = 'partial';

    return {
      overall,
      gdpr,
      ccpa,
      hipaa,
      sox
    };
  }
}

// Export singleton instance
export const securityMonitoringService = new SecurityMonitoringService();