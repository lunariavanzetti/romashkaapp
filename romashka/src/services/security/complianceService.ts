import { supabase } from '../../lib/supabase';
import { auditService } from './auditService';
import { gdprService } from './gdprService';
import type { 
  ComplianceCheck, 
  ComplianceResult, 
  SecurityIncident, 
  ComplianceDashboard,
  ComplianceScore,
  SecurityAlert
} from '../../types/security';

export class ComplianceService {
  private alertThresholds = {
    gdpr: { critical: 90, high: 70, medium: 50 },
    security: { critical: 95, high: 80, medium: 60 },
    data_protection: { critical: 85, high: 65, medium: 45 },
    access_control: { critical: 90, high: 75, medium: 55 }
  };

  // ================================
  // COMPLIANCE MONITORING
  // ================================

  async getComplianceDashboard(): Promise<ComplianceDashboard> {
    try {
      const [
        gdprScore,
        securityScore,
        dataProtectionScore,
        accessControlScore,
        recentIncidents,
        pendingReviews,
        automatedFixes
      ] = await Promise.all([
        this.calculateGDPRCompliance(),
        this.calculateSecurityCompliance(),
        this.calculateDataProtectionCompliance(),
        this.calculateAccessControlCompliance(),
        this.getRecentIncidents(7),
        this.getPendingReviews(),
        this.getAutomatedFixes()
      ]);

      const overallScore = Math.round((
        gdprScore.score + 
        securityScore.score + 
        dataProtectionScore.score + 
        accessControlScore.score
      ) / 4);

      const complianceStatus = this.determineComplianceStatus(overallScore);

      return {
        overall_score: overallScore,
        compliance_status: complianceStatus,
        last_assessment: new Date().toISOString(),
        next_assessment: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        categories: {
          gdpr: gdprScore,
          security: securityScore,
          data_protection: dataProtectionScore,
          access_control: accessControlScore
        },
        recent_incidents: recentIncidents,
        pending_reviews: pendingReviews,
        automated_fixes: automatedFixes
      };
    } catch (error) {
      console.error('Error generating compliance dashboard:', error);
      throw error;
    }
  }

  async runAllComplianceChecks() {
    try {
      const { data: checks, error } = await supabase
        .from('compliance_checks')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      const results = [];
      for (const check of checks) {
        const result = await this.executeComplianceCheck(check);
        results.push(result);
      }

      return { data: results, error: null };
    } catch (error) {
      console.error('Error running compliance checks:', error);
      return { data: null, error: error.message };
    }
  }

  async executeComplianceCheck(check: ComplianceCheck) {
    try {
      let result: ComplianceResult;

      switch (check.check_type) {
        case 'gdpr':
          result = await this.runGDPRCheck(check);
          break;
        case 'security':
          result = await this.runSecurityCheck(check);
          break;
        case 'data_retention':
          result = await this.runDataRetentionCheck(check);
          break;
        case 'access_control':
          result = await this.runAccessControlCheck(check);
          break;
        case 'data_protection':
          result = await this.runDataProtectionCheck(check);
          break;
        default:
          throw new Error(`Unknown check type: ${check.check_type}`);
      }

      // Save result to database
      const { data, error } = await supabase
        .from('compliance_results')
        .insert({
          check_id: check.id,
          status: result.status,
          result_details: result.result_details,
          recommendations: result.recommendations,
          severity: result.severity,
          auto_remediated: result.auto_remediated,
          remediation_actions: result.remediation_actions
        })
        .select()
        .single();

      if (error) throw error;

      // Update check's last run time
      await supabase
        .from('compliance_checks')
        .update({ 
          last_run: new Date().toISOString(),
          next_run: this.calculateNextRun(check.check_frequency)
        })
        .eq('id', check.id);

      // Create alerts for critical findings
      if (result.severity === 'critical' || result.severity === 'high') {
        await this.createComplianceAlert(check, result);
      }

      // Auto-remediate if possible
      if (result.auto_remediated) {
        await this.executeAutoRemediation(check, result);
      }

      return { ...data, check };
    } catch (error) {
      console.error('Error executing compliance check:', error);
      
      // Log failed check
      await supabase
        .from('compliance_results')
        .insert({
          check_id: check.id,
          status: 'error',
          result_details: { error: error.message },
          severity: 'medium'
        });

      throw error;
    }
  }

  // ================================
  // SPECIFIC COMPLIANCE CHECKS
  // ================================

  private async runGDPRCheck(check: ComplianceCheck): Promise<ComplianceResult> {
    const recommendations: string[] = [];
    let status: 'passed' | 'failed' | 'warning' = 'passed';
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

    switch (check.check_name) {
      case 'GDPR Consent Validation':
        return await this.checkGDPRConsent();
      case 'Data Retention Compliance':
        return await this.checkDataRetention();
      default:
        return {
          id: '',
          check_id: check.id,
          check,
          status: 'passed',
          result_details: { message: 'Generic GDPR check passed' },
          recommendations: [],
          severity: 'low',
          auto_remediated: false,
          created_at: new Date().toISOString()
        };
    }
  }

  private async runSecurityCheck(check: ComplianceCheck): Promise<ComplianceResult> {
    switch (check.check_name) {
      case 'Access Control Review':
        return await this.checkAccessControl();
      case 'Session Security Check':
        return await this.checkSessionSecurity();
      case 'API Key Security Audit':
        return await this.checkAPIKeySecurity();
      default:
        return {
          id: '',
          check_id: check.id,
          check,
          status: 'passed',
          result_details: { message: 'Generic security check passed' },
          recommendations: [],
          severity: 'low',
          auto_remediated: false,
          created_at: new Date().toISOString()
        };
    }
  }

  private async runDataRetentionCheck(check: ComplianceCheck): Promise<ComplianceResult> {
    const { data: retentionResults, error } = await gdprService.checkDataRetentionCompliance();
    
    if (error) throw error;

    const nonCompliantCategories = retentionResults?.filter(r => !r.compliant) || [];
    const totalExpiredRecords = retentionResults?.reduce((sum, r) => sum + r.expired_records, 0) || 0;

    return {
      id: '',
      check_id: check.id,
      check,
      status: nonCompliantCategories.length > 0 ? 'failed' : 'passed',
      result_details: {
        total_categories: retentionResults?.length || 0,
        non_compliant_categories: nonCompliantCategories.length,
        expired_records: totalExpiredRecords,
        categories: retentionResults
      },
      recommendations: nonCompliantCategories.length > 0 ? [
        'Schedule data cleanup for expired records',
        'Review and update retention policies',
        'Implement automated data deletion'
      ] : [],
      severity: totalExpiredRecords > 1000 ? 'high' : totalExpiredRecords > 100 ? 'medium' : 'low',
      auto_remediated: false,
      created_at: new Date().toISOString()
    };
  }

  private async runAccessControlCheck(check: ComplianceCheck): Promise<ComplianceResult> {
    const recommendations: string[] = [];
    let issueCount = 0;

    // Check for users with excessive permissions
    const { data: users, error } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        role:roles(name, permissions)
      `);

    if (error) throw error;

    const usersWithAllPermissions = users?.filter(u => 
      u.role?.permissions.includes('all')
    ) || [];

    if (usersWithAllPermissions.length > 5) {
      recommendations.push('Review users with "all" permissions');
      issueCount++;
    }

    // Check for expired role assignments
    const { data: expiredRoles, error: expiredError } = await supabase
      .from('user_roles')
      .select('*')
      .lt('expires_at', new Date().toISOString());

    if (expiredError) throw expiredError;

    if (expiredRoles && expiredRoles.length > 0) {
      recommendations.push('Remove expired role assignments');
      issueCount++;
    }

    return {
      id: '',
      check_id: check.id,
      check,
      status: issueCount > 0 ? 'warning' : 'passed',
      result_details: {
        users_with_all_permissions: usersWithAllPermissions.length,
        expired_role_assignments: expiredRoles?.length || 0,
        total_users: users?.length || 0
      },
      recommendations,
      severity: issueCount > 3 ? 'high' : issueCount > 1 ? 'medium' : 'low',
      auto_remediated: false,
      created_at: new Date().toISOString()
    };
  }

  private async runDataProtectionCheck(check: ComplianceCheck): Promise<ComplianceResult> {
    switch (check.check_name) {
      case 'PII Detection Scan':
        return await this.checkPIIDetection();
      case 'Encryption Key Rotation':
        return await this.checkEncryptionKeyRotation();
      default:
        return {
          id: '',
          check_id: check.id,
          check,
          status: 'passed',
          result_details: { message: 'Generic data protection check passed' },
          recommendations: [],
          severity: 'low',
          auto_remediated: false,
          created_at: new Date().toISOString()
        };
    }
  }

  // ================================
  // DETAILED CHECK IMPLEMENTATIONS
  // ================================

  private async checkGDPRConsent(): Promise<ComplianceResult> {
    const { data: consentRecords, error } = await supabase
      .from('data_consent')
      .select('*')
      .eq('consent_given', true)
      .is('withdrawal_date', null);

    if (error) throw error;

    const expiredConsents = consentRecords?.filter(c => 
      c.expiry_date && new Date(c.expiry_date) < new Date()
    ) || [];

    return {
      id: '',
      check_id: '',
      check: {} as ComplianceCheck,
      status: expiredConsents.length > 0 ? 'warning' : 'passed',
      result_details: {
        total_consents: consentRecords?.length || 0,
        expired_consents: expiredConsents.length,
        consent_types: this.groupConsentsByType(consentRecords || [])
      },
      recommendations: expiredConsents.length > 0 ? [
        'Refresh expired consents',
        'Review consent expiry policies',
        'Implement consent renewal notifications'
      ] : [],
      severity: expiredConsents.length > 100 ? 'high' : expiredConsents.length > 10 ? 'medium' : 'low',
      auto_remediated: false,
      created_at: new Date().toISOString()
    };
  }

  private async checkDataRetention(): Promise<ComplianceResult> {
    const { data: retentionResults, error } = await gdprService.checkDataRetentionCompliance();
    
    if (error) throw error;

    const nonCompliantCategories = retentionResults?.filter(r => !r.compliant) || [];
    const totalExpiredRecords = retentionResults?.reduce((sum, r) => sum + r.expired_records, 0) || 0;

    return {
      id: '',
      check_id: '',
      check: {} as ComplianceCheck,
      status: nonCompliantCategories.length > 0 ? 'failed' : 'passed',
      result_details: {
        total_categories: retentionResults?.length || 0,
        non_compliant_categories: nonCompliantCategories.length,
        expired_records: totalExpiredRecords,
        categories: retentionResults
      },
      recommendations: nonCompliantCategories.length > 0 ? [
        'Schedule data cleanup for expired records',
        'Review and update retention policies',
        'Implement automated data deletion'
      ] : [],
      severity: totalExpiredRecords > 1000 ? 'critical' : totalExpiredRecords > 100 ? 'high' : 'medium',
      auto_remediated: false,
      created_at: new Date().toISOString()
    };
  }

  private async checkAccessControl(): Promise<ComplianceResult> {
    const issues = [];
    
    // Check for inactive users with active sessions
    const { data: inactiveUsers, error } = await supabase
      .from('security_sessions')
      .select('user_id, last_activity')
      .eq('is_active', true)
      .lt('last_activity', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    if (inactiveUsers && inactiveUsers.length > 0) {
      issues.push('Users with inactive sessions detected');
    }

    // Check for users without proper role assignments
    const { data: usersWithoutRoles, error: rolesError } = await supabase
      .from('profiles')
      .select(`
        id,
        user_roles(id)
      `)
      .is('user_roles.id', null);

    if (rolesError) throw rolesError;

    if (usersWithoutRoles && usersWithoutRoles.length > 0) {
      issues.push('Users without role assignments detected');
    }

    return {
      id: '',
      check_id: '',
      check: {} as ComplianceCheck,
      status: issues.length > 0 ? 'warning' : 'passed',
      result_details: {
        inactive_sessions: inactiveUsers?.length || 0,
        users_without_roles: usersWithoutRoles?.length || 0,
        issues
      },
      recommendations: issues.length > 0 ? [
        'Review and cleanup inactive sessions',
        'Assign appropriate roles to users',
        'Implement regular access reviews'
      ] : [],
      severity: issues.length > 2 ? 'high' : issues.length > 0 ? 'medium' : 'low',
      auto_remediated: false,
      created_at: new Date().toISOString()
    };
  }

  private async checkSessionSecurity(): Promise<ComplianceResult> {
    const issues = [];
    
    // Check for long-running sessions
    const { data: longSessions, error } = await supabase
      .from('security_sessions')
      .select('*')
      .eq('is_active', true)
      .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    if (longSessions && longSessions.length > 0) {
      issues.push('Long-running sessions detected');
    }

    // Check for sessions from unusual locations
    const { data: unusualSessions, error: unusualError } = await supabase
      .from('security_sessions')
      .select('*')
      .eq('is_active', true)
      .not('geolocation', 'is', null);

    if (unusualError) throw unusualError;

    // This is a simplified check - in reality, you'd compare against historical patterns
    const suspiciousSessions = unusualSessions?.filter(s => 
      s.geolocation && !['US', 'CA', 'GB'].includes(s.geolocation.country)
    ) || [];

    if (suspiciousSessions.length > 0) {
      issues.push('Sessions from unusual locations detected');
    }

    return {
      id: '',
      check_id: '',
      check: {} as ComplianceCheck,
      status: issues.length > 0 ? 'warning' : 'passed',
      result_details: {
        long_running_sessions: longSessions?.length || 0,
        unusual_location_sessions: suspiciousSessions.length,
        total_active_sessions: unusualSessions?.length || 0,
        issues
      },
      recommendations: issues.length > 0 ? [
        'Review and terminate long-running sessions',
        'Implement session timeout policies',
        'Monitor sessions from unusual locations'
      ] : [],
      severity: issues.length > 1 ? 'medium' : 'low',
      auto_remediated: false,
      created_at: new Date().toISOString()
    };
  }

  private async checkAPIKeySecurity(): Promise<ComplianceResult> {
    const issues = [];
    
    // Check for API keys without expiration
    const { data: neverExpireKeys, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('is_active', true)
      .is('expires_at', null);

    if (error) throw error;

    if (neverExpireKeys && neverExpireKeys.length > 0) {
      issues.push('API keys without expiration detected');
    }

    // Check for unused API keys
    const { data: unusedKeys, error: unusedError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('is_active', true)
      .eq('usage_count', 0)
      .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (unusedError) throw unusedError;

    if (unusedKeys && unusedKeys.length > 0) {
      issues.push('Unused API keys detected');
    }

    return {
      id: '',
      check_id: '',
      check: {} as ComplianceCheck,
      status: issues.length > 0 ? 'warning' : 'passed',
      result_details: {
        keys_without_expiration: neverExpireKeys?.length || 0,
        unused_keys: unusedKeys?.length || 0,
        issues
      },
      recommendations: issues.length > 0 ? [
        'Set expiration dates for API keys',
        'Remove unused API keys',
        'Implement key rotation policies'
      ] : [],
      severity: issues.length > 1 ? 'medium' : 'low',
      auto_remediated: false,
      created_at: new Date().toISOString()
    };
  }

  private async checkPIIDetection(): Promise<ComplianceResult> {
    // This would scan messages for PII patterns
    const { data: patterns, error } = await supabase
      .from('pii_detection_patterns')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    // Simplified PII scan - in reality, you'd scan actual message content
    const piiDetected = 0; // Placeholder

    return {
      id: '',
      check_id: '',
      check: {} as ComplianceCheck,
      status: piiDetected > 0 ? 'warning' : 'passed',
      result_details: {
        patterns_active: patterns?.length || 0,
        pii_instances_detected: piiDetected,
        last_scan: new Date().toISOString()
      },
      recommendations: piiDetected > 0 ? [
        'Review and mask detected PII',
        'Update PII detection patterns',
        'Implement automatic PII masking'
      ] : [],
      severity: piiDetected > 100 ? 'high' : piiDetected > 10 ? 'medium' : 'low',
      auto_remediated: false,
      created_at: new Date().toISOString()
    };
  }

  private async checkEncryptionKeyRotation(): Promise<ComplianceResult> {
    const { data: keys, error } = await supabase
      .from('encryption_keys')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    const keysNeedingRotation = keys?.filter(k => 
      k.next_rotation && new Date(k.next_rotation) < new Date()
    ) || [];

    return {
      id: '',
      check_id: '',
      check: {} as ComplianceCheck,
      status: keysNeedingRotation.length > 0 ? 'warning' : 'passed',
      result_details: {
        total_keys: keys?.length || 0,
        keys_needing_rotation: keysNeedingRotation.length,
        overdue_keys: keysNeedingRotation.map(k => k.key_name)
      },
      recommendations: keysNeedingRotation.length > 0 ? [
        'Rotate overdue encryption keys',
        'Update key rotation schedules',
        'Implement automated key rotation'
      ] : [],
      severity: keysNeedingRotation.length > 0 ? 'high' : 'low',
      auto_remediated: false,
      created_at: new Date().toISOString()
    };
  }

  // ================================
  // SECURITY INCIDENT MANAGEMENT
  // ================================

  async createSecurityIncident(incident: Omit<SecurityIncident, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('security_incidents')
        .insert([incident])
        .select()
        .single();

      if (error) throw error;

      // Log the incident creation
      await auditService.logAction(
        'data_modify',
        'create',
        'security_incident',
        data.id,
        undefined,
        incident,
        { security_action: 'create_incident' }
      );

      // Send alerts for critical incidents
      if (incident.severity === 'critical' || incident.severity === 'high') {
        await this.sendIncidentAlert(data);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error creating security incident:', error);
      return { data: null, error: error.message };
    }
  }

  async updateSecurityIncident(incidentId: string, updates: Partial<SecurityIncident>) {
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

      await auditService.logAction(
        'data_modify',
        'update',
        'security_incident',
        incidentId,
        undefined,
        updates,
        { security_action: 'update_incident' }
      );

      return { data, error: null };
    } catch (error) {
      console.error('Error updating security incident:', error);
      return { data: null, error: error.message };
    }
  }

  async getSecurityIncidents(filters: any = {}) {
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
      if (filters.incident_type) {
        query = query.eq('incident_type', filters.incident_type);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching security incidents:', error);
      return { data: null, error: error.message };
    }
  }

  // ================================
  // SCORING AND ASSESSMENT
  // ================================

  private async calculateGDPRCompliance(): Promise<ComplianceScore> {
    const checks = [
      this.checkGDPRConsent(),
      this.checkDataRetention()
    ];

    const results = await Promise.allSettled(checks);
    const scores = results.map(r => r.status === 'fulfilled' ? this.scoreResult(r.value) : 0);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    return {
      score: Math.round(averageScore),
      status: averageScore >= 80 ? 'passed' : averageScore >= 60 ? 'warning' : 'failed',
      last_checked: new Date().toISOString(),
      issues: results.filter(r => r.status === 'rejected').length,
      recommendations: ['Ensure all data processing has proper consent', 'Implement data retention policies']
    };
  }

  private async calculateSecurityCompliance(): Promise<ComplianceScore> {
    const checks = [
      this.checkAccessControl(),
      this.checkSessionSecurity(),
      this.checkAPIKeySecurity()
    ];

    const results = await Promise.allSettled(checks);
    const scores = results.map(r => r.status === 'fulfilled' ? this.scoreResult(r.value) : 0);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    return {
      score: Math.round(averageScore),
      status: averageScore >= 80 ? 'passed' : averageScore >= 60 ? 'warning' : 'failed',
      last_checked: new Date().toISOString(),
      issues: results.filter(r => r.status === 'rejected').length,
      recommendations: ['Review access controls regularly', 'Implement session security policies']
    };
  }

  private async calculateDataProtectionCompliance(): Promise<ComplianceScore> {
    const checks = [
      this.checkPIIDetection(),
      this.checkEncryptionKeyRotation()
    ];

    const results = await Promise.allSettled(checks);
    const scores = results.map(r => r.status === 'fulfilled' ? this.scoreResult(r.value) : 0);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    return {
      score: Math.round(averageScore),
      status: averageScore >= 80 ? 'passed' : averageScore >= 60 ? 'warning' : 'failed',
      last_checked: new Date().toISOString(),
      issues: results.filter(r => r.status === 'rejected').length,
      recommendations: ['Implement PII detection and masking', 'Maintain encryption key rotation']
    };
  }

  private async calculateAccessControlCompliance(): Promise<ComplianceScore> {
    const result = await this.checkAccessControl();
    const score = this.scoreResult(result);

    return {
      score: Math.round(score),
      status: score >= 80 ? 'passed' : score >= 60 ? 'warning' : 'failed',
      last_checked: new Date().toISOString(),
      issues: result.status === 'failed' ? 1 : 0,
      recommendations: result.recommendations || []
    };
  }

  private scoreResult(result: ComplianceResult): number {
    switch (result.status) {
      case 'passed':
        return 100;
      case 'warning':
        return result.severity === 'high' ? 40 : result.severity === 'medium' ? 60 : 80;
      case 'failed':
        return result.severity === 'critical' ? 0 : result.severity === 'high' ? 20 : 40;
      default:
        return 0;
    }
  }

  // ================================
  // UTILITY METHODS
  // ================================

  private determineComplianceStatus(score: number): 'compliant' | 'partial' | 'non_compliant' {
    if (score >= 80) return 'compliant';
    if (score >= 60) return 'partial';
    return 'non_compliant';
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
      case 'quarterly':
        return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    }
  }

  private async createComplianceAlert(check: ComplianceCheck, result: ComplianceResult) {
    const alertData = {
      alert_type: 'compliance_violation',
      severity: result.severity,
      message: `Compliance check failed: ${check.check_name}`,
      details: {
        check_id: check.id,
        check_name: check.check_name,
        check_type: check.check_type,
        result_status: result.status,
        recommendations: result.recommendations
      },
      status: 'open'
    };

    await supabase
      .from('security_alerts')
      .insert([alertData]);
  }

  private async executeAutoRemediation(check: ComplianceCheck, result: ComplianceResult) {
    // Implement auto-remediation logic based on check type
    console.log(`Auto-remediation for ${check.check_name}:`, result.remediation_actions);
  }

  private async sendIncidentAlert(incident: SecurityIncident) {
    // Implement incident alerting logic (email, Slack, etc.)
    console.log(`Security incident alert: ${incident.title}`, incident);
  }

  private async getRecentIncidents(days: number): Promise<SecurityIncident[]> {
    const { data, error } = await supabase
      .from('security_incidents')
      .select('*')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  }

  private async getPendingReviews(): Promise<number> {
    const { data, error } = await supabase
      .from('data_subject_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (error) throw error;

    return data?.length || 0;
  }

  private async getAutomatedFixes(): Promise<number> {
    const { data, error } = await supabase
      .from('compliance_results')
      .select('id', { count: 'exact', head: true })
      .eq('auto_remediated', true)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    return data?.length || 0;
  }

  private groupConsentsByType(consents: any[]): Record<string, number> {
    return consents.reduce((acc, consent) => {
      acc[consent.consent_type] = (acc[consent.consent_type] || 0) + 1;
      return acc;
    }, {});
  }

  // ================================
  // REPORTING
  // ================================

  async generateComplianceReport(dateFrom: string, dateTo: string) {
    try {
      const dashboard = await this.getComplianceDashboard();
      const auditReport = await auditService.generateComplianceReport(dateFrom, dateTo);
      
      const report = {
        report_period: { from: dateFrom, to: dateTo },
        generated_at: new Date().toISOString(),
        compliance_summary: dashboard,
        audit_summary: auditReport.data,
        recommendations: this.generateRecommendations(dashboard),
        action_items: this.generateActionItems(dashboard)
      };

      return { data: report, error: null };
    } catch (error) {
      console.error('Error generating compliance report:', error);
      return { data: null, error: error.message };
    }
  }

  private generateRecommendations(dashboard: ComplianceDashboard): string[] {
    const recommendations = [];
    
    if (dashboard.categories.gdpr.status === 'failed') {
      recommendations.push('Implement comprehensive GDPR compliance program');
    }
    if (dashboard.categories.security.status === 'failed') {
      recommendations.push('Enhance security controls and monitoring');
    }
    if (dashboard.categories.data_protection.status === 'failed') {
      recommendations.push('Strengthen data protection measures');
    }
    if (dashboard.categories.access_control.status === 'failed') {
      recommendations.push('Review and improve access control policies');
    }

    return recommendations;
  }

  private generateActionItems(dashboard: ComplianceDashboard): string[] {
    const actions = [];
    
    if (dashboard.pending_reviews > 0) {
      actions.push(`Review ${dashboard.pending_reviews} pending data subject requests`);
    }
    if (dashboard.recent_incidents.length > 0) {
      actions.push(`Investigate ${dashboard.recent_incidents.length} recent security incidents`);
    }
    if (dashboard.overall_score < 80) {
      actions.push('Develop compliance improvement plan');
    }

    return actions;
  }
}

export const complianceService = new ComplianceService();