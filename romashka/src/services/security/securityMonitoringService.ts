import { supabase } from '../supabaseClient';
import { auditService } from './auditService';
import type { 
  SecuritySession, 
  SecurityIncident, 
  SecurityMetrics, 
  SecurityDashboard,
  SecurityIncidentType,
  SecuritySeverity,
  SecurityIncidentDetails,
  ComplianceStatus,
  ComplianceResult,
  RiskFactor,
  APISecurityLog,
  ActivityPattern 
} from '../../types/security';

export class SecurityMonitoringService {
  private static instance: SecurityMonitoringService;
  private sessionCheckInterval: NodeJS.Timeout | null = null;
  private metricsUpdateInterval: NodeJS.Timeout | null = null;

  public static getInstance(): SecurityMonitoringService {
    if (!SecurityMonitoringService.instance) {
      SecurityMonitoringService.instance = new SecurityMonitoringService();
    }
    return SecurityMonitoringService.instance;
  }

  constructor() {
    this.startSecurityMonitoring();
  }

  // ================================
  // SESSION TRACKING
  // ================================

  async trackUserSession(sessionData: {
    userId: string;
    ipAddress: string;
    userAgent: string;
    loginMethod: string;
  }): Promise<void> {
    try {
      const sessionToken = this.generateSessionToken();
      
      const { error } = await supabase
        .from('security_sessions')
        .insert([{
          user_id: sessionData.userId,
          session_token: sessionToken,
          ip_address: sessionData.ipAddress,
          user_agent: sessionData.userAgent,
          login_method: sessionData.loginMethod,
          is_active: true,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      // Log session start
      await auditService.logAction(
        'authentication',
        'login',
        'user_session',
        sessionData.userId,
        null,
        { session_token: sessionToken, login_method: sessionData.loginMethod },
        { ip_address: sessionData.ipAddress, user_agent: sessionData.userAgent }
      );

      // Check for suspicious activity
      await this.checkForSuspiciousSessionActivity(sessionData);

    } catch (error) {
      console.error('Error tracking user session:', error);
      throw error;
    }
  }

  async endUserSession(sessionToken: string, reason: string = 'logout'): Promise<void> {
    try {
      const { data: session, error: fetchError } = await supabase
        .from('security_sessions')
        .select('*')
        .eq('session_token', sessionToken)
        .single();

      if (fetchError) throw fetchError;

      const sessionDuration = new Date().getTime() - new Date(session.created_at).getTime();

      const { error } = await supabase
        .from('security_sessions')
        .update({
          is_active: false,
          ended_at: new Date().toISOString(),
          logout_reason: reason,
          session_duration: `${sessionDuration} milliseconds`
        })
        .eq('session_token', sessionToken);

      if (error) throw error;

      // Log session end
      await auditService.logAction(
        'authentication',
        'logout',
        'user_session',
        session.user_id,
        { is_active: true },
        { is_active: false, logout_reason: reason },
        { session_duration: sessionDuration }
      );

    } catch (error) {
      console.error('Error ending user session:', error);
      throw error;
    }
  }

  // ================================
  // INCIDENT DETECTION
  // ================================

  async detectSecurityIncident(
    incidentType: SecurityIncidentType,
    severity: SecuritySeverity,
    details: SecurityIncidentDetails
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('security_incidents')
        .insert([{
          incident_type: incidentType,
          severity,
          user_id: details.userId,
          ip_address: details.ipAddress,
          description: details.description,
          detection_method: details.detectionMethod || 'automated',
          metadata: details.metadata || {},
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      // Log security incident
      await auditService.logAction(
        'security_incident',
        'create',
        'security_incident',
        details.userId,
        null,
        { incident_type: incidentType, severity, description: details.description },
        { ip_address: details.ipAddress, detection_method: details.detectionMethod }
      );

      // Auto-respond to critical incidents
      if (severity === 'critical') {
        await this.handleCriticalIncident(incidentType, details);
      }

    } catch (error) {
      console.error('Error detecting security incident:', error);
      throw error;
    }
  }

  async detectSuspiciousActivity(
    userId: string,
    activityPattern: ActivityPattern
  ): Promise<boolean> {
    try {
      // Check for multiple failed login attempts
      if (activityPattern.type === 'failed_login') {
        const { data: recentFailures } = await supabase
          .from('security_incidents')
          .select('*')
          .eq('user_id', userId)
          .eq('incident_type', 'failed_login')
          .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString());

        if (recentFailures && recentFailures.length >= 5) {
          await this.detectSecurityIncident('suspicious_activity', 'high', {
            userId,
            description: `Multiple failed login attempts detected: ${recentFailures.length} attempts in 15 minutes`,
            detectionMethod: 'pattern_analysis',
            metadata: { pattern: activityPattern, failed_attempts: recentFailures.length }
          });
          return true;
        }
      }

      // Check for unusual access patterns
      if (activityPattern.type === 'unusual_access') {
        const { data: sessions } = await supabase
          .from('security_sessions')
          .select('*')
          .eq('user_id', userId)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        if (sessions && sessions.length > 0) {
          const uniqueIPs = new Set(sessions.map(s => s.ip_address));
          const uniqueUserAgents = new Set(sessions.map(s => s.user_agent));

          if (uniqueIPs.size > 5 || uniqueUserAgents.size > 3) {
            await this.detectSecurityIncident('suspicious_activity', 'medium', {
              userId,
              description: `Unusual access pattern: ${uniqueIPs.size} different IPs, ${uniqueUserAgents.size} different devices`,
              detectionMethod: 'behavioral_analysis',
              metadata: { unique_ips: uniqueIPs.size, unique_user_agents: uniqueUserAgents.size }
            });
            return true;
          }
        }
      }

      return false;

    } catch (error) {
      console.error('Error detecting suspicious activity:', error);
      return false;
    }
  }

  // ================================
  // API SECURITY MONITORING
  // ================================

  async logAPIRequest(request: APISecurityLog): Promise<void> {
    try {
      const { error } = await supabase
        .from('api_security_logs')
        .insert([{
          endpoint: request.endpoint,
          method: request.method,
          user_id: request.userId,
          ip_address: request.ipAddress,
          request_size: request.requestSize,
          response_code: request.responseCode,
          response_time_ms: request.responseTimeMs,
          rate_limit_hit: request.rateLimitHit || false,
          suspicious_activity: request.suspiciousActivity || false,
          timestamp: new Date().toISOString()
        }]);

      if (error) throw error;

      // Check for rate limiting violations
      if (request.rateLimitHit) {
        await this.detectSecurityIncident('api_abuse', 'medium', {
          userId: request.userId,
          ipAddress: request.ipAddress,
          description: `Rate limit exceeded for endpoint: ${request.endpoint}`,
          detectionMethod: 'rate_limiting',
          metadata: request
        });
      }

    } catch (error) {
      console.error('Error logging API request:', error);
      throw error;
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
        riskFactors,
        securityScore
      ] = await Promise.all([
        this.getActiveSessionsCount(),
        this.getRecentIncidents(),
        this.getComplianceStatus(),
        this.getRiskFactors(),
        this.calculateSecurityScore()
      ]);

      return {
        activeSessions,
        recentIncidents,
        complianceStatus,
        securityScore,
        riskFactors,
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error getting security dashboard:', error);
      throw error;
    }
  }

  async getSecurityMetrics(): Promise<SecurityMetrics> {
    try {
      const [
        totalLogins,
        failedLogins,
        activeSessions,
        securityIncidents,
        blockedIPs
      ] = await Promise.all([
        this.getTotalLogins(),
        this.getFailedLogins(),
        this.getActiveSessionsCount(),
        this.getSecurityIncidentsCount(),
        this.getBlockedIPsCount()
      ]);

      return {
        total_logins: totalLogins,
        failed_logins: failedLogins,
        active_sessions: activeSessions,
        blocked_ips: blockedIPs,
        security_incidents: securityIncidents,
        compliance_score: 85, // This would be calculated based on compliance results
        last_updated: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error getting security metrics:', error);
      throw error;
    }
  }

  // ================================
  // COMPLIANCE MONITORING
  // ================================

  async runComplianceChecks(): Promise<ComplianceResult[]> {
    try {
      const { data: checks, error } = await supabase
        .from('compliance_checks')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      const results: ComplianceResult[] = [];
      
      for (const check of checks) {
        const result = await this.executeComplianceCheck(check);
        results.push(result);
      }

      return results;

    } catch (error) {
      console.error('Error running compliance checks:', error);
      throw error;
    }
  }

  // ================================
  // PRIVATE METHODS
  // ================================

  private async startSecurityMonitoring(): Promise<void> {
    // Start session monitoring
    this.sessionCheckInterval = setInterval(async () => {
      await this.checkInactiveSessions();
    }, 5 * 60 * 1000); // Every 5 minutes

    // Start metrics update
    this.metricsUpdateInterval = setInterval(async () => {
      await this.updateSecurityMetrics();
    }, 30 * 1000); // Every 30 seconds
  }

  private async checkInactiveSessions(): Promise<void> {
    try {
      const timeoutMinutes = 30; // 30 minutes
      const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000);

      const { data: inactiveSessions, error } = await supabase
        .from('security_sessions')
        .select('*')
        .eq('is_active', true)
        .lt('created_at', cutoffTime.toISOString());

      if (error) throw error;

      if (inactiveSessions && inactiveSessions.length > 0) {
        for (const session of inactiveSessions) {
          await this.endUserSession(session.session_token, 'timeout');
        }
      }

    } catch (error) {
      console.error('Error checking inactive sessions:', error);
    }
  }

  private async updateSecurityMetrics(): Promise<void> {
    try {
      const metrics = await this.getSecurityMetrics();
      
      // Store metrics in performance_metrics table
      await supabase
        .from('performance_metrics')
        .insert([
          { metric_type: 'security_active_sessions', metric_value: metrics.active_sessions },
          { metric_type: 'security_incidents_today', metric_value: metrics.security_incidents },
          { metric_type: 'security_compliance_score', metric_value: metrics.compliance_score }
        ]);

    } catch (error) {
      console.error('Error updating security metrics:', error);
    }
  }

  private async checkForSuspiciousSessionActivity(sessionData: {
    userId: string;
    ipAddress: string;
    userAgent: string;
    loginMethod: string;
  }): Promise<void> {
    // Check for geolocation anomalies
    const { data: recentSessions } = await supabase
      .from('security_sessions')
      .select('*')
      .eq('user_id', sessionData.userId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentSessions && recentSessions.length > 0) {
      const recentIPs = recentSessions.map(s => s.ip_address);
      const hasNewIP = !recentIPs.includes(sessionData.ipAddress);

      if (hasNewIP) {
        await this.detectSecurityIncident('unusual_access', 'low', {
          userId: sessionData.userId,
          ipAddress: sessionData.ipAddress,
          description: `New IP address detected for user login: ${sessionData.ipAddress}`,
          detectionMethod: 'ip_analysis',
          metadata: { previous_ips: recentIPs, new_ip: sessionData.ipAddress }
        });
      }
    }
  }

  private async handleCriticalIncident(incidentType: SecurityIncidentType, details: SecurityIncidentDetails): Promise<void> {
    // Auto-remediation for critical incidents
    if (incidentType === 'data_breach') {
      // Lock user account
      if (details.userId) {
        await this.lockUserAccount(details.userId);
      }
      
      // Notify administrators
      await this.notifySecurityTeam(incidentType, details);
    }
  }

  private async lockUserAccount(userId: string): Promise<void> {
    try {
      // End all active sessions
      const { data: sessions } = await supabase
        .from('security_sessions')
        .select('session_token')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (sessions) {
        for (const session of sessions) {
          await this.endUserSession(session.session_token, 'security_lockout');
        }
      }

      // Log the account lock
      await auditService.logAction(
        'security_action',
        'lock_account',
        'user_account',
        userId,
        { status: 'active' },
        { status: 'locked', reason: 'security_incident' }
      );

    } catch (error) {
      console.error('Error locking user account:', error);
    }
  }

  private async notifySecurityTeam(incidentType: SecurityIncidentType, details: SecurityIncidentDetails): Promise<void> {
    // Implementation would send notifications to security team
    console.log(`🚨 CRITICAL SECURITY INCIDENT: ${incidentType}`, details);
  }

  private generateSessionToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) + 
           Date.now().toString(36);
  }

  private async getTotalLogins(): Promise<number> {
    const { count } = await supabase
      .from('security_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    return count || 0;
  }

  private async getFailedLogins(): Promise<number> {
    const { count } = await supabase
      .from('security_incidents')
      .select('*', { count: 'exact', head: true })
      .eq('incident_type', 'failed_login')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    return count || 0;
  }

  private async getActiveSessionsCount(): Promise<number> {
    const { count } = await supabase
      .from('security_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    return count || 0;
  }

  private async getSecurityIncidentsCount(): Promise<number> {
    const { count } = await supabase
      .from('security_incidents')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    return count || 0;
  }

  private async getBlockedIPsCount(): Promise<number> {
    // This would be implemented based on IP blocking system
    return 0;
  }

  private async getRecentIncidents(): Promise<SecurityIncident[]> {
    const { data, error } = await supabase
      .from('security_incidents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return data || [];
  }

  private async getComplianceStatus(): Promise<ComplianceStatus> {
    // This would be implemented based on compliance results
    return {
      gdpr: { score: 85, status: 'compliant' },
      ccpa: { score: 78, status: 'compliant' },
      dataRetention: { score: 92, status: 'compliant' },
      encryption: { score: 88, status: 'compliant' }
    };
  }

  private async getRiskFactors(): Promise<RiskFactor[]> {
    const [
      highSeverityIncidents,
      failedLogins,
      unusualAccess
    ] = await Promise.all([
      this.getHighSeverityIncidents(),
      this.getFailedLogins(),
      this.getUnusualAccessCount()
    ]);

    const riskFactors: RiskFactor[] = [];

    if (highSeverityIncidents > 0) {
      riskFactors.push({
        type: 'high_severity_incidents',
        level: 'high',
        description: `${highSeverityIncidents} high severity incidents in the last 24 hours`,
        recommendation: 'Review and investigate all high severity incidents'
      });
    }

    if (failedLogins > 10) {
      riskFactors.push({
        type: 'failed_logins',
        level: 'medium',
        description: `${failedLogins} failed login attempts in the last 24 hours`,
        recommendation: 'Monitor for brute force attacks'
      });
    }

    return riskFactors;
  }

  private async getHighSeverityIncidents(): Promise<number> {
    const { count } = await supabase
      .from('security_incidents')
      .select('*', { count: 'exact', head: true })
      .in('severity', ['high', 'critical'])
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    return count || 0;
  }

  private async getUnusualAccessCount(): Promise<number> {
    const { count } = await supabase
      .from('security_incidents')
      .select('*', { count: 'exact', head: true })
      .eq('incident_type', 'unusual_access')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    return count || 0;
  }

  private async calculateSecurityScore(): Promise<number> {
    const [
      totalIncidents,
      criticalIncidents,
      complianceScore
    ] = await Promise.all([
      this.getSecurityIncidentsCount(),
      this.getHighSeverityIncidents(),
      85 // Would be calculated from compliance results
    ]);

    let score = 100;
    
    // Deduct points for incidents
    score -= totalIncidents * 2;
    score -= criticalIncidents * 10;
    
    // Factor in compliance
    score = Math.min(score, complianceScore);
    
    return Math.max(0, score);
  }

  private async executeComplianceCheck(check: any): Promise<ComplianceResult> {
    // Implementation would depend on the specific check type
    return {
      id: check.id,
      check_name: check.check_name,
      status: 'passed',
      result_details: {},
      recommendations: [],
      severity: 'low',
      created_at: new Date().toISOString()
    };
  }

  // ================================
  // CLEANUP
  // ================================

  public stopMonitoring(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }
    if (this.metricsUpdateInterval) {
      clearInterval(this.metricsUpdateInterval);
    }
  }
}

export const securityMonitoringService = SecurityMonitoringService.getInstance();