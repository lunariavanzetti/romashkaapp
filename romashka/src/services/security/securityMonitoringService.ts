import { supabase } from '../supabaseClient';
import type { 
  SecuritySession, 
  SecurityIncident, 
  ComplianceCheck,
  ComplianceResult,
  SecurityMetrics,
  SecurityDashboard,
  SecurityAlert,
  APISecurityLog
} from '../../types/security';

export class SecurityMonitoringService {
  private alertThresholds = {
    failedLogins: 5,
    sessionDuration: 24 * 60 * 60 * 1000, // 24 hours
    suspiciousActivity: 3,
    criticalIncidents: 1
  };

  // ================================
  // SESSION MANAGEMENT
  // ================================

  async trackUserSession(sessionData: {
    userId: string;
    sessionToken: string;
    ipAddress: string;
    userAgent: string;
    loginMethod?: string;
    deviceInfo?: any;
    geolocation?: any;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('security_sessions')
        .insert({
          user_id: sessionData.userId,
          session_token: sessionData.sessionToken,
          ip_address: sessionData.ipAddress,
          user_agent: sessionData.userAgent,
          login_method: sessionData.loginMethod || 'password',
          device_info: sessionData.deviceInfo || {},
          geolocation: sessionData.geolocation || {},
          is_active: true,
          last_activity: new Date().toISOString()
        });

      if (error) throw error;

      // Check for suspicious activity
      await this.checkSuspiciousSessionActivity(sessionData.userId, sessionData.ipAddress);
    } catch (error) {
      console.error('Error tracking user session:', error);
      throw error;
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
      console.error('Error fetching active sessions:', error);
      throw error;
    }
  }

  async invalidateSession(sessionToken: string, reason: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('security_sessions')
        .update({
          is_active: false,
          ended_at: new Date().toISOString(),
          logout_reason: reason,
          invalidated_at: new Date().toISOString(),
          invalidation_reason: reason
        })
        .eq('session_token', sessionToken);

      if (error) throw error;
    } catch (error) {
      console.error('Error invalidating session:', error);
      throw error;
    }
  }

  // ================================
  // INCIDENT MANAGEMENT
  // ================================

  async createSecurityIncident(incident: Omit<SecurityIncident, 'id' | 'created_at' | 'updated_at'>): Promise<SecurityIncident> {
    try {
      const { data, error } = await supabase
        .from('security_incidents')
        .insert({
          ...incident,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Send alerts for high/critical incidents
      if (incident.severity === 'high' || incident.severity === 'critical') {
        await this.sendSecurityAlert(data);
      }

      return data;
    } catch (error) {
      console.error('Error creating security incident:', error);
      throw error;
    }
  }

  async detectSecurityIncident(
    incidentType: SecurityIncident['incident_type'],
    severity: SecurityIncident['severity'],
    details: {
      title: string;
      description?: string;
      userId?: string;
      ipAddress?: string;
      affectedSystems?: string[];
      affectedUsers?: number;
    }
  ): Promise<void> {
    try {
      await this.createSecurityIncident({
        incident_type: incidentType,
        severity,
        status: 'open',
        title: details.title,
        description: details.description,
        user_id: details.userId,
        ip_address: details.ipAddress,
        affected_systems: details.affectedSystems || [],
        affected_users: details.affectedUsers || 0,
        detection_method: 'automatic',
        resolved: false,
        containment_actions: [],
        investigation_notes: '',
        lessons_learned: ''
      });
    } catch (error) {
      console.error('Error detecting security incident:', error);
      throw error;
    }
  }

  async getSecurityIncidents(filters: {
    severity?: string;
    status?: string;
    incidentType?: string;
    limit?: number;
  } = {}): Promise<SecurityIncident[]> {
    try {
      let query = supabase
        .from('security_incidents')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.severity) {
        query = query.eq('severity', filters.severity);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.incidentType) {
        query = query.eq('incident_type', filters.incidentType);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching security incidents:', error);
      throw error;
    }
  }

  async updateSecurityIncident(incidentId: string, updates: Partial<SecurityIncident>): Promise<SecurityIncident> {
    try {
      const { data, error } = await supabase
        .from('security_incidents')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', incidentId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error updating security incident:', error);
      throw error;
    }
  }

  // ================================
  // COMPLIANCE MONITORING
  // ================================

  async runComplianceCheck(checkId: string): Promise<ComplianceResult> {
    try {
      // Get the check details
      const { data: check, error: checkError } = await supabase
        .from('compliance_checks')
        .select('*')
        .eq('id', checkId)
        .single();

      if (checkError) throw checkError;

      // Run the appropriate check based on type
      let result: Omit<ComplianceResult, 'id' | 'created_at'>;

      switch (check.check_type) {
        case 'security':
          result = await this.runSecurityComplianceCheck(check);
          break;
        case 'gdpr':
          result = await this.runGDPRComplianceCheck(check);
          break;
        case 'data_retention':
          result = await this.runDataRetentionCheck(check);
          break;
        case 'access_control':
          result = await this.runAccessControlCheck(check);
          break;
        default:
          throw new Error(`Unknown compliance check type: ${check.check_type}`);
      }

      // Save the result
      const { data, error } = await supabase
        .from('compliance_results')
        .insert({
          ...result,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Update the check's last run time
      await supabase
        .from('compliance_checks')
        .update({
          last_run: new Date().toISOString(),
          next_run: this.calculateNextRun(check.check_frequency)
        })
        .eq('id', checkId);

      return data;
    } catch (error) {
      console.error('Error running compliance check:', error);
      throw error;
    }
  }

  async runAllComplianceChecks(): Promise<ComplianceResult[]> {
    try {
      const { data: checks, error } = await supabase
        .from('compliance_checks')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      const results: ComplianceResult[] = [];
      
      for (const check of checks || []) {
        try {
          const result = await this.runComplianceCheck(check.id);
          results.push(result);
        } catch (error) {
          console.error(`Error running compliance check ${check.check_name}:`, error);
        }
      }

      return results;
    } catch (error) {
      console.error('Error running all compliance checks:', error);
      throw error;
    }
  }

  async getComplianceResults(filters: {
    checkId?: string;
    status?: string;
    severity?: string;
    limit?: number;
  } = {}): Promise<ComplianceResult[]> {
    try {
      let query = supabase
        .from('compliance_results')
        .select(`
          *,
          check:compliance_checks(*)
        `)
        .order('created_at', { ascending: false });

      if (filters.checkId) {
        query = query.eq('check_id', filters.checkId);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.severity) {
        query = query.eq('severity', filters.severity);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching compliance results:', error);
      throw error;
    }
  }

  // ================================
  // SECURITY DASHBOARD
  // ================================

  async getSecurityDashboard(): Promise<SecurityDashboard> {
    try {
      const [
        activeSessions,
        recentIncidents,
        complianceResults,
        securityMetrics
      ] = await Promise.all([
        this.getActiveSessions(),
        this.getSecurityIncidents({ limit: 10 }),
        this.getComplianceResults({ limit: 5 }),
        this.getSecurityMetrics()
      ]);

      const overallScore = this.calculateSecurityScore(
        activeSessions,
        recentIncidents,
        complianceResults
      );

      return {
        activeSessions: activeSessions.length,
        recentIncidents: recentIncidents.slice(0, 5),
        complianceStatus: this.calculateComplianceStatus(complianceResults),
        securityScore: overallScore,
        riskFactors: this.identifyRiskFactors(recentIncidents, activeSessions),
        metrics: securityMetrics
      };
    } catch (error) {
      console.error('Error fetching security dashboard:', error);
      throw error;
    }
  }

  async getSecurityMetrics(): Promise<SecurityMetrics> {
    try {
      const [
        totalLogins,
        failedLogins,
        activeSessions,
        blockedIPs,
        securityIncidents
      ] = await Promise.all([
        this.getTotalLogins(),
        this.getFailedLogins(),
        this.getActiveSessionsCount(),
        this.getBlockedIPsCount(),
        this.getSecurityIncidentsCount()
      ]);

      return {
        total_logins: totalLogins,
        failed_logins: failedLogins,
        active_sessions: activeSessions,
        blocked_ips: blockedIPs,
        security_incidents: securityIncidents,
        compliance_score: await this.calculateComplianceScore(),
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching security metrics:', error);
      throw error;
    }
  }

  // ================================
  // API SECURITY MONITORING
  // ================================

  async logAPIRequest(request: Omit<APISecurityLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('api_security_logs')
        .insert({
          ...request,
          timestamp: new Date().toISOString()
        });

      if (error) throw error;

      // Check for suspicious activity
      await this.checkSuspiciousAPIActivity(request);
    } catch (error) {
      console.error('Error logging API request:', error);
      throw error;
    }
  }

  // ================================
  // PRIVATE HELPER METHODS
  // ================================

  private async checkSuspiciousSessionActivity(userId: string, ipAddress: string): Promise<void> {
    try {
      // Check for multiple logins from different locations
      const { data: recentSessions, error } = await supabase
        .from('security_sessions')
        .select('ip_address, geolocation')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const uniqueIPs = new Set(recentSessions?.map(s => s.ip_address) || []);
      
      if (uniqueIPs.size > 3) {
        await this.detectSecurityIncident(
          'suspicious_activity',
          'medium',
          {
            title: 'Multiple location logins detected',
            description: `User ${userId} logged in from ${uniqueIPs.size} different IP addresses in the last 24 hours`,
            userId,
            ipAddress,
            affectedUsers: 1
          }
        );
      }
    } catch (error) {
      console.error('Error checking suspicious session activity:', error);
    }
  }

  private async checkSuspiciousAPIActivity(request: Omit<APISecurityLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      // Check for rate limiting violations
      if (request.rate_limit_hit) {
        await this.detectSecurityIncident(
          'suspicious_activity',
          'low',
          {
            title: 'Rate limit exceeded',
            description: `API endpoint ${request.endpoint} exceeded rate limit for user ${request.user_id}`,
            userId: request.user_id,
            ipAddress: request.ip_address,
            affectedSystems: [request.endpoint || 'API']
          }
        );
      }

      // Check for high error rates
      if (request.response_code && request.response_code >= 400) {
        const recentErrors = await this.getRecentAPIErrors(request.user_id, request.ip_address);
        
        if (recentErrors > 10) {
          await this.detectSecurityIncident(
            'suspicious_activity',
            'medium',
            {
              title: 'High API error rate detected',
              description: `High number of API errors (${recentErrors}) from IP ${request.ip_address}`,
              userId: request.user_id,
              ipAddress: request.ip_address,
              affectedSystems: ['API']
            }
          );
        }
      }
    } catch (error) {
      console.error('Error checking suspicious API activity:', error);
    }
  }

  private async runSecurityComplianceCheck(check: ComplianceCheck): Promise<Omit<ComplianceResult, 'id' | 'created_at'>> {
    const issues: string[] = [];
    let score = 100;

    // Check for inactive sessions
    const { data: inactiveSessions } = await supabase
      .from('security_sessions')
      .select('*')
      .eq('is_active', true)
      .lt('last_activity', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (inactiveSessions && inactiveSessions.length > 0) {
      issues.push(`${inactiveSessions.length} inactive sessions detected`);
      score -= 20;
    }

    // Check for recent security incidents
    const { data: recentIncidents } = await supabase
      .from('security_incidents')
      .select('*')
      .eq('status', 'open')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (recentIncidents && recentIncidents.length > 0) {
      issues.push(`${recentIncidents.length} open security incidents`);
      score -= 30;
    }

    const status = score >= 80 ? 'passed' : score >= 60 ? 'warning' : 'failed';
    const severity = score >= 80 ? 'low' : score >= 60 ? 'medium' : 'high';

    return {
      check_id: check.id,
      status,
      result_details: {
        score,
        issues,
        inactive_sessions: inactiveSessions?.length || 0,
        open_incidents: recentIncidents?.length || 0
      },
      recommendations: issues.length > 0 ? [
        'Review and cleanup inactive sessions',
        'Resolve open security incidents',
        'Implement stronger security policies'
      ] : ['No action required'],
      severity,
      auto_remediated: false,
      remediation_actions: []
    };
  }

  private async runGDPRComplianceCheck(check: ComplianceCheck): Promise<Omit<ComplianceResult, 'id' | 'created_at'>> {
    // Simplified GDPR check - in real implementation, this would be more comprehensive
    const issues: string[] = [];
    let score = 100;

    // Check for customer data retention
    const { data: oldCustomers } = await supabase
      .from('customer_profiles')
      .select('*')
      .lt('last_interaction', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());

    if (oldCustomers && oldCustomers.length > 10) {
      issues.push(`${oldCustomers.length} customers with data older than 1 year`);
      score -= 30;
    }

    const status = score >= 80 ? 'passed' : score >= 60 ? 'warning' : 'failed';
    const severity = score >= 80 ? 'low' : score >= 60 ? 'medium' : 'high';

    return {
      check_id: check.id,
      status,
      result_details: {
        score,
        issues,
        old_customer_records: oldCustomers?.length || 0
      },
      recommendations: issues.length > 0 ? [
        'Review data retention policies',
        'Implement automated data cleanup',
        'Obtain consent for data processing'
      ] : ['GDPR compliance maintained'],
      severity,
      auto_remediated: false,
      remediation_actions: []
    };
  }

  private async runDataRetentionCheck(check: ComplianceCheck): Promise<Omit<ComplianceResult, 'id' | 'created_at'>> {
    // Data retention compliance check
    const issues: string[] = [];
    let score = 100;

    // Check for old conversation data
    const { data: oldConversations } = await supabase
      .from('conversations')
      .select('*')
      .lt('created_at', new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString());

    if (oldConversations && oldConversations.length > 100) {
      issues.push(`${oldConversations.length} conversations older than 2 years`);
      score -= 25;
    }

    const status = score >= 80 ? 'passed' : score >= 60 ? 'warning' : 'failed';
    const severity = score >= 80 ? 'low' : score >= 60 ? 'medium' : 'high';

    return {
      check_id: check.id,
      status,
      result_details: {
        score,
        issues,
        old_conversations: oldConversations?.length || 0
      },
      recommendations: issues.length > 0 ? [
        'Archive old conversation data',
        'Implement automated data retention policies',
        'Review data retention requirements'
      ] : ['Data retention policies compliant'],
      severity,
      auto_remediated: false,
      remediation_actions: []
    };
  }

  private async runAccessControlCheck(check: ComplianceCheck): Promise<Omit<ComplianceResult, 'id' | 'created_at'>> {
    // Access control compliance check
    const issues: string[] = [];
    let score = 100;

    // Check for users without proper roles
    const { data: usersWithoutRoles } = await supabase
      .from('profiles')
      .select('*')
      .is('role', null);

    if (usersWithoutRoles && usersWithoutRoles.length > 0) {
      issues.push(`${usersWithoutRoles.length} users without assigned roles`);
      score -= 40;
    }

    const status = score >= 80 ? 'passed' : score >= 60 ? 'warning' : 'failed';
    const severity = score >= 80 ? 'low' : score >= 60 ? 'medium' : 'high';

    return {
      check_id: check.id,
      status,
      result_details: {
        score,
        issues,
        users_without_roles: usersWithoutRoles?.length || 0
      },
      recommendations: issues.length > 0 ? [
        'Assign roles to all users',
        'Review access control policies',
        'Implement role-based access control'
      ] : ['Access control properly configured'],
      severity,
      auto_remediated: false,
      remediation_actions: []
    };
  }

  private calculateNextRun(frequency: string): string {
    const now = new Date();
    switch (frequency) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      case 'monthly':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    }
  }

  private calculateSecurityScore(
    activeSessions: SecuritySession[],
    recentIncidents: SecurityIncident[],
    complianceResults: ComplianceResult[]
  ): number {
    let score = 100;

    // Deduct for open high/critical incidents
    const criticalIncidents = recentIncidents.filter(i => i.severity === 'critical' && i.status === 'open');
    const highIncidents = recentIncidents.filter(i => i.severity === 'high' && i.status === 'open');
    
    score -= criticalIncidents.length * 30;
    score -= highIncidents.length * 15;

    // Deduct for failed compliance checks
    const failedChecks = complianceResults.filter(r => r.status === 'failed');
    score -= failedChecks.length * 20;

    // Deduct for long-running sessions
    const longSessions = activeSessions.filter(s => {
      const sessionAge = Date.now() - new Date(s.created_at).getTime();
      return sessionAge > 24 * 60 * 60 * 1000; // 24 hours
    });
    score -= longSessions.length * 5;

    return Math.max(0, Math.min(100, score));
  }

  private calculateComplianceStatus(complianceResults: ComplianceResult[]): any {
    const total = complianceResults.length;
    const passed = complianceResults.filter(r => r.status === 'passed').length;
    const failed = complianceResults.filter(r => r.status === 'failed').length;
    const warnings = complianceResults.filter(r => r.status === 'warning').length;

    return {
      total,
      passed,
      failed,
      warnings,
      overall_status: failed > 0 ? 'non_compliant' : warnings > 0 ? 'partial' : 'compliant',
      compliance_percentage: total > 0 ? Math.round((passed / total) * 100) : 100
    };
  }

  private identifyRiskFactors(
    incidents: SecurityIncident[],
    sessions: SecuritySession[]
  ): Array<{ factor: string; level: 'low' | 'medium' | 'high'; description: string }> {
    const riskFactors: Array<{ factor: string; level: 'low' | 'medium' | 'high'; description: string }> = [];

    // Check for open critical incidents
    const criticalIncidents = incidents.filter(i => i.severity === 'critical' && i.status === 'open');
    if (criticalIncidents.length > 0) {
      riskFactors.push({
        factor: 'Critical Security Incidents',
        level: 'high',
        description: `${criticalIncidents.length} critical security incidents are currently open`
      });
    }

    // Check for multiple suspicious activities
    const suspiciousActivities = incidents.filter(i => i.incident_type === 'suspicious_activity');
    if (suspiciousActivities.length > 5) {
      riskFactors.push({
        factor: 'Suspicious Activity Pattern',
        level: 'medium',
        description: `${suspiciousActivities.length} suspicious activities detected recently`
      });
    }

    // Check for long-running sessions
    const longSessions = sessions.filter(s => {
      const sessionAge = Date.now() - new Date(s.created_at).getTime();
      return sessionAge > 24 * 60 * 60 * 1000; // 24 hours
    });
    if (longSessions.length > 10) {
      riskFactors.push({
        factor: 'Long-running Sessions',
        level: 'low',
        description: `${longSessions.length} sessions have been active for over 24 hours`
      });
    }

    return riskFactors;
  }

  private async sendSecurityAlert(incident: SecurityIncident): Promise<void> {
    // In a real implementation, this would send notifications via email, Slack, etc.
    console.log('Security Alert:', {
      severity: incident.severity,
      title: incident.title,
      description: incident.description,
      timestamp: incident.created_at
    });
  }

  private async getTotalLogins(): Promise<number> {
    const { count, error } = await supabase
      .from('security_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;
    return count || 0;
  }

  private async getFailedLogins(): Promise<number> {
    const { count, error } = await supabase
      .from('security_incidents')
      .select('*', { count: 'exact', head: true })
      .eq('incident_type', 'failed_login')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;
    return count || 0;
  }

  private async getActiveSessionsCount(): Promise<number> {
    const { count, error } = await supabase
      .from('security_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (error) throw error;
    return count || 0;
  }

  private async getBlockedIPsCount(): Promise<number> {
    // In a real implementation, this would check a blocked IPs table
    return 0;
  }

  private async getSecurityIncidentsCount(): Promise<number> {
    const { count, error } = await supabase
      .from('security_incidents')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open');

    if (error) throw error;
    return count || 0;
  }

  private async calculateComplianceScore(): Promise<number> {
    const { data: results, error } = await supabase
      .from('compliance_results')
      .select('status')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    if (!results || results.length === 0) return 85; // Default score

    const passed = results.filter(r => r.status === 'passed').length;
    return Math.round((passed / results.length) * 100);
  }

  private async getRecentAPIErrors(userId?: string, ipAddress?: string): Promise<number> {
    let query = supabase
      .from('api_security_logs')
      .select('*', { count: 'exact', head: true })
      .gte('response_code', 400)
      .gte('timestamp', new Date(Date.now() - 60 * 60 * 1000).toISOString()); // Last hour

    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (ipAddress) {
      query = query.eq('ip_address', ipAddress);
    }

    const { count, error } = await query;

    if (error) throw error;
    return count || 0;
  }
}

// Export singleton instance
export const securityMonitoringService = new SecurityMonitoringService();