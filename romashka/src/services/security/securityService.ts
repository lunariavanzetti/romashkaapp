import { supabase } from '../../lib/supabase';
import { auditService } from './auditService';
import type { 
  TwoFactorAuth, 
  ApiKey, 
  Role, 
  UserRole, 
  IPWhitelist, 
  GeographicRestriction,
  SecuritySettings,
  SecuritySession,
  SecurityConfiguration
} from '../../types/security';
import * as crypto from 'crypto';

export class SecurityService {
  // ================================
  // TWO-FACTOR AUTHENTICATION
  // ================================

  async enable2FA(userId: string, method: 'totp' | 'sms' | 'email', phoneNumber?: string) {
    try {
      const secret = this.generateTOTPSecret();
      const backupCodes = this.generateBackupCodes();

      const { data, error } = await supabase
        .from('two_factor_auth')
        .upsert({
          user_id: userId,
          enabled: true,
          secret,
          backup_codes: backupCodes,
          method,
          phone_number: phoneNumber,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      await auditService.logAction(
        'permission_change',
        'update',
        'user',
        userId,
        { two_factor_enabled: false },
        { two_factor_enabled: true, method },
        { security_action: 'enable_2fa' }
      );

      return { 
        data: {
          ...data,
          qr_code: method === 'totp' ? this.generateQRCode(secret) : null
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      return { data: null, error: error.message };
    }
  }

  async disable2FA(userId: string) {
    try {
      const { data, error } = await supabase
        .from('two_factor_auth')
        .update({
          enabled: false,
          secret: null,
          backup_codes: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      await auditService.logAction(
        'permission_change',
        'update',
        'user',
        userId,
        { two_factor_enabled: true },
        { two_factor_enabled: false },
        { security_action: 'disable_2fa' }
      );

      return { data, error: null };
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      return { data: null, error: error.message };
    }
  }

  async verify2FA(userId: string, code: string, isBackupCode: boolean = false) {
    try {
      const { data: twoFA, error } = await supabase
        .from('two_factor_auth')
        .select('*')
        .eq('user_id', userId)
        .eq('enabled', true)
        .single();

      if (error || !twoFA) {
        throw new Error('2FA not enabled for user');
      }

      let isValid = false;

      if (isBackupCode) {
        isValid = twoFA.backup_codes?.includes(code) || false;
        if (isValid) {
          // Remove used backup code
          const updatedCodes = twoFA.backup_codes?.filter(c => c !== code) || [];
          await supabase
            .from('two_factor_auth')
            .update({ backup_codes: updatedCodes })
            .eq('user_id', userId);
        }
      } else {
        isValid = this.verifyTOTP(twoFA.secret!, code);
      }

      if (isValid) {
        await supabase
          .from('two_factor_auth')
          .update({ last_used: new Date().toISOString() })
          .eq('user_id', userId);

        await auditService.logAction(
          'login',
          'verify_2fa',
          'user',
          userId,
          undefined,
          { verification_method: isBackupCode ? 'backup_code' : 'totp' },
          { security_action: 'verify_2fa' }
        );
      }

      return { valid: isValid, error: null };
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      return { valid: false, error: error.message };
    }
  }

  async get2FAStatus(userId: string) {
    try {
      const { data, error } = await supabase
        .from('two_factor_auth')
        .select('enabled, method, phone_number, last_used')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return { 
        data: data || { enabled: false, method: null, phone_number: null, last_used: null }, 
        error: null 
      };
    } catch (error) {
      console.error('Error getting 2FA status:', error);
      return { data: null, error: error.message };
    }
  }

  // ================================
  // API KEY MANAGEMENT
  // ================================

  async createApiKey(userId: string, name: string, permissions: string[], expiresAt?: string) {
    try {
      const apiKey = this.generateApiKey();
      const keyHash = this.hashApiKey(apiKey);
      const keyPreview = apiKey.substring(0, 8) + '...';

      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          user_id: userId,
          name,
          key_hash: keyHash,
          key_preview: keyPreview,
          permissions,
          expires_at: expiresAt
        })
        .select()
        .single();

      if (error) throw error;

      await auditService.logAction(
        'permission_change',
        'create',
        'api_key',
        data.id,
        undefined,
        { name, permissions, expires_at: expiresAt },
        { security_action: 'create_api_key' }
      );

      return { 
        data: { ...data, key: apiKey }, // Return actual key only once
        error: null 
      };
    } catch (error) {
      console.error('Error creating API key:', error);
      return { data: null, error: error.message };
    }
  }

  async validateApiKey(keyString: string) {
    try {
      const keyHash = this.hashApiKey(keyString);
      
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('key_hash', keyHash)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      // Check if key is expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        throw new Error('API key has expired');
      }

      // Update usage statistics
      await supabase
        .from('api_keys')
        .update({
          last_used: new Date().toISOString(),
          usage_count: data.usage_count + 1
        })
        .eq('id', data.id);

      return { data, error: null };
    } catch (error) {
      console.error('Error validating API key:', error);
      return { data: null, error: error.message };
    }
  }

  async revokeApiKey(keyId: string, userId: string) {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', keyId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      await auditService.logAction(
        'permission_change',
        'delete',
        'api_key',
        keyId,
        { is_active: true },
        { is_active: false },
        { security_action: 'revoke_api_key' }
      );

      return { data, error: null };
    } catch (error) {
      console.error('Error revoking API key:', error);
      return { data: null, error: error.message };
    }
  }

  async getUserApiKeys(userId: string) {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('id, name, key_preview, permissions, last_used, usage_count, expires_at, is_active, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error getting user API keys:', error);
      return { data: null, error: error.message };
    }
  }

  async rotateApiKey(keyId: string, userId: string) {
    try {
      const newApiKey = this.generateApiKey();
      const newKeyHash = this.hashApiKey(newApiKey);
      const newKeyPreview = newApiKey.substring(0, 8) + '...';

      const { data, error } = await supabase
        .from('api_keys')
        .update({
          key_hash: newKeyHash,
          key_preview: newKeyPreview,
          updated_at: new Date().toISOString()
        })
        .eq('id', keyId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      await auditService.logAction(
        'permission_change',
        'update',
        'api_key',
        keyId,
        undefined,
        { rotated: true },
        { security_action: 'rotate_api_key' }
      );

      return { 
        data: { ...data, key: newApiKey }, 
        error: null 
      };
    } catch (error) {
      console.error('Error rotating API key:', error);
      return { data: null, error: error.message };
    }
  }

  // ================================
  // ROLE-BASED ACCESS CONTROL
  // ================================

  async createRole(name: string, description: string, permissions: string[]) {
    try {
      const { data, error } = await supabase
        .from('roles')
        .insert({
          name,
          description,
          permissions,
          is_system_role: false
        })
        .select()
        .single();

      if (error) throw error;

      await auditService.logAction(
        'permission_change',
        'create',
        'role',
        data.id,
        undefined,
        { name, description, permissions },
        { security_action: 'create_role' }
      );

      return { data, error: null };
    } catch (error) {
      console.error('Error creating role:', error);
      return { data: null, error: error.message };
    }
  }

  async updateRole(roleId: string, updates: Partial<Role>) {
    try {
      const { data: oldRole, error: fetchError } = await supabase
        .from('roles')
        .select('*')
        .eq('id', roleId)
        .single();

      if (fetchError) throw fetchError;

      const { data, error } = await supabase
        .from('roles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', roleId)
        .select()
        .single();

      if (error) throw error;

      await auditService.logAction(
        'permission_change',
        'update',
        'role',
        roleId,
        oldRole,
        updates,
        { security_action: 'update_role' }
      );

      return { data, error: null };
    } catch (error) {
      console.error('Error updating role:', error);
      return { data: null, error: error.message };
    }
  }

  async deleteRole(roleId: string) {
    try {
      // Check if role is in use
      const { data: assignments, error: checkError } = await supabase
        .from('user_roles')
        .select('id')
        .eq('role_id', roleId)
        .limit(1);

      if (checkError) throw checkError;

      if (assignments && assignments.length > 0) {
        throw new Error('Cannot delete role that is assigned to users');
      }

      const { data, error } = await supabase
        .from('roles')
        .delete()
        .eq('id', roleId)
        .eq('is_system_role', false)
        .select()
        .single();

      if (error) throw error;

      await auditService.logAction(
        'permission_change',
        'delete',
        'role',
        roleId,
        data,
        undefined,
        { security_action: 'delete_role' }
      );

      return { data, error: null };
    } catch (error) {
      console.error('Error deleting role:', error);
      return { data: null, error: error.message };
    }
  }

  async assignRoleToUser(userId: string, roleId: string, assignedBy: string, expiresAt?: string) {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role_id: roleId,
          assigned_by: assignedBy,
          expires_at: expiresAt
        })
        .select(`
          *,
          role:roles(*)
        `)
        .single();

      if (error) throw error;

      await auditService.logAction(
        'permission_change',
        'create',
        'user_role',
        data.id,
        undefined,
        { user_id: userId, role_id: roleId, assigned_by: assignedBy },
        { security_action: 'assign_role' }
      );

      return { data, error: null };
    } catch (error) {
      console.error('Error assigning role to user:', error);
      return { data: null, error: error.message };
    }
  }

  async revokeRoleFromUser(userId: string, roleId: string) {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role_id', roleId)
        .select()
        .single();

      if (error) throw error;

      await auditService.logAction(
        'permission_change',
        'delete',
        'user_role',
        data.id,
        { user_id: userId, role_id: roleId },
        undefined,
        { security_action: 'revoke_role' }
      );

      return { data, error: null };
    } catch (error) {
      console.error('Error revoking role from user:', error);
      return { data: null, error: error.message };
    }
  }

  async getUserRoles(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          *,
          role:roles(*)
        `)
        .eq('user_id', userId)
        .order('assigned_at', { ascending: false });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error getting user roles:', error);
      return { data: null, error: error.message };
    }
  }

  async getUserPermissions(userId: string) {
    try {
      const { data: roles, error } = await this.getUserRoles(userId);
      if (error) throw error;

      const permissions = new Set<string>();
      
      roles?.forEach(userRole => {
        if (userRole.role) {
          userRole.role.permissions.forEach(permission => {
            permissions.add(permission);
          });
        }
      });

      return { data: Array.from(permissions), error: null };
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return { data: null, error: error.message };
    }
  }

  async hasPermission(userId: string, permission: string) {
    try {
      const { data: permissions, error } = await this.getUserPermissions(userId);
      if (error) throw error;

      return permissions?.includes(permission) || permissions?.includes('all') || false;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  // ================================
  // SESSION MANAGEMENT
  // ================================

  async invalidateUserSessions(userId: string, reason: string, excludeSessionId?: string) {
    try {
      let query = supabase
        .from('security_sessions')
        .update({
          is_active: false,
          invalidated_at: new Date().toISOString(),
          invalidation_reason: reason
        })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (excludeSessionId) {
        query = query.neq('id', excludeSessionId);
      }

      const { data, error } = await query.select();

      if (error) throw error;

      await auditService.logAction(
        'permission_change',
        'update',
        'user',
        userId,
        undefined,
        { sessions_invalidated: data?.length || 0, reason },
        { security_action: 'invalidate_sessions' }
      );

      return { data, error: null };
    } catch (error) {
      console.error('Error invalidating user sessions:', error);
      return { data: null, error: error.message };
    }
  }

  async getActiveSessions(userId: string) {
    try {
      const { data, error } = await supabase
        .from('security_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_activity', { ascending: false });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error getting active sessions:', error);
      return { data: null, error: error.message };
    }
  }

  async cleanupExpiredSessions() {
    try {
      const { data, error } = await supabase
        .from('security_sessions')
        .update({
          is_active: false,
          invalidated_at: new Date().toISOString(),
          invalidation_reason: 'expired'
        })
        .eq('is_active', true)
        .lt('expires_at', new Date().toISOString())
        .select();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
      return { data: null, error: error.message };
    }
  }

  // ================================
  // IP WHITELISTING
  // ================================

  async addIPToWhitelist(userId: string, ipAddress: string, description?: string) {
    try {
      const { data, error } = await supabase
        .from('ip_whitelist')
        .insert({
          user_id: userId,
          ip_address: ipAddress,
          description,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      await auditService.logAction(
        'permission_change',
        'create',
        'ip_whitelist',
        data.id,
        undefined,
        { ip_address: ipAddress, description },
        { security_action: 'add_ip_whitelist' }
      );

      return { data, error: null };
    } catch (error) {
      console.error('Error adding IP to whitelist:', error);
      return { data: null, error: error.message };
    }
  }

  async removeIPFromWhitelist(whitelistId: string, userId: string) {
    try {
      const { data, error } = await supabase
        .from('ip_whitelist')
        .delete()
        .eq('id', whitelistId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      await auditService.logAction(
        'permission_change',
        'delete',
        'ip_whitelist',
        whitelistId,
        data,
        undefined,
        { security_action: 'remove_ip_whitelist' }
      );

      return { data, error: null };
    } catch (error) {
      console.error('Error removing IP from whitelist:', error);
      return { data: null, error: error.message };
    }
  }

  async isIPWhitelisted(userId: string, ipAddress: string) {
    try {
      const { data, error } = await supabase
        .from('ip_whitelist')
        .select('*')
        .eq('user_id', userId)
        .eq('ip_address', ipAddress)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return !!data;
    } catch (error) {
      console.error('Error checking IP whitelist:', error);
      return false;
    }
  }

  // ================================
  // GEOGRAPHIC RESTRICTIONS
  // ================================

  async setGeographicRestrictions(userId: string, restrictionType: 'allow' | 'deny', countryCodes: string[], description?: string) {
    try {
      const { data, error } = await supabase
        .from('geographic_restrictions')
        .upsert({
          user_id: userId,
          restriction_type: restrictionType,
          country_codes: countryCodes,
          description,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      await auditService.logAction(
        'permission_change',
        'update',
        'geographic_restrictions',
        data.id,
        undefined,
        { restriction_type: restrictionType, country_codes: countryCodes },
        { security_action: 'set_geographic_restrictions' }
      );

      return { data, error: null };
    } catch (error) {
      console.error('Error setting geographic restrictions:', error);
      return { data: null, error: error.message };
    }
  }

  async checkGeographicRestrictions(userId: string, countryCode: string) {
    try {
      const { data, error } = await supabase
        .from('geographic_restrictions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return true; // No restrictions = allowed

      if (data.restriction_type === 'allow') {
        return data.country_codes.includes(countryCode);
      } else {
        return !data.country_codes.includes(countryCode);
      }
    } catch (error) {
      console.error('Error checking geographic restrictions:', error);
      return false;
    }
  }

  // ================================
  // SECURITY CONFIGURATION
  // ================================

  async getSecurityConfiguration(): Promise<SecurityConfiguration> {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('category', 'security')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      // Return default configuration if none exists
      const defaultConfig: SecurityConfiguration = {
        authentication: {
          require_2fa: false,
          session_timeout: 24 * 60 * 60 * 1000, // 24 hours
          max_failed_attempts: 5,
          lockout_duration: 15 * 60 * 1000 // 15 minutes
        },
        data_protection: {
          encryption_enabled: true,
          pii_masking_enabled: true,
          data_retention_enabled: true,
          backup_encryption: true
        },
        monitoring: {
          audit_logging: true,
          real_time_alerts: true,
          anomaly_detection: true,
          compliance_monitoring: true
        },
        access_control: {
          rbac_enabled: true,
          ip_whitelisting: false,
          geographic_restrictions: false,
          api_rate_limiting: true
        }
      };

      return data?.settings || defaultConfig;
    } catch (error) {
      console.error('Error getting security configuration:', error);
      throw error;
    }
  }

  async updateSecurityConfiguration(config: SecurityConfiguration) {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .upsert({
          category: 'security',
          key: 'configuration',
          value: JSON.stringify(config),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      await auditService.logAction(
        'permission_change',
        'update',
        'security_configuration',
        data.id,
        undefined,
        config,
        { security_action: 'update_security_config' }
      );

      return { data, error: null };
    } catch (error) {
      console.error('Error updating security configuration:', error);
      return { data: null, error: error.message };
    }
  }

  // ================================
  // UTILITY METHODS
  // ================================

  private generateTOTPSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }

  private generateBackupCodes(): string[] {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substr(2, 8).toUpperCase());
    }
    return codes;
  }

  private verifyTOTP(secret: string, token: string): boolean {
    // Simple TOTP verification - in production, use a proper library like 'speakeasy'
    const timeStep = Math.floor(Date.now() / 30000);
    const expected = this.generateTOTP(secret, timeStep);
    return token === expected;
  }

  private generateTOTP(secret: string, timeStep: number): string {
    // Simplified TOTP generation - use proper crypto library in production
    const hash = crypto.createHmac('sha1', secret);
    hash.update(timeStep.toString());
    const hex = hash.digest('hex');
    const code = parseInt(hex.slice(-6), 16) % 1000000;
    return code.toString().padStart(6, '0');
  }

  private generateQRCode(secret: string): string {
    // Generate QR code URL for TOTP setup
    return `otpauth://totp/ROMASHKA?secret=${secret}&issuer=ROMASHKA`;
  }

  private generateApiKey(): string {
    return 'rka_' + crypto.randomBytes(32).toString('hex');
  }

  private hashApiKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  // ================================
  // RATE LIMITING
  // ================================

  async checkRateLimit(identifier: string, limit: number, windowMs: number): Promise<boolean> {
    const key = `rate_limit:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      // This is a simplified implementation
      // In production, use Redis or similar for distributed rate limiting
      const { data, error } = await supabase
        .from('rate_limits')
        .select('*')
        .eq('identifier', identifier)
        .gte('created_at', new Date(windowStart).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length < limit) {
        // Log this request
        await supabase
          .from('rate_limits')
          .insert({
            identifier,
            created_at: new Date().toISOString()
          });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking rate limit:', error);
      return false;
    }
  }

  async enforceSecurityPolicies(userId: string, ipAddress: string, action: string) {
    try {
      const config = await this.getSecurityConfiguration();
      
      // Check IP whitelist if enabled
      if (config.access_control.ip_whitelisting) {
        const isWhitelisted = await this.isIPWhitelisted(userId, ipAddress);
        if (!isWhitelisted) {
          throw new Error('IP address not whitelisted');
        }
      }

      // Check geographic restrictions if enabled
      if (config.access_control.geographic_restrictions) {
        const countryCode = await this.getCountryFromIP(ipAddress);
        const isAllowed = await this.checkGeographicRestrictions(userId, countryCode);
        if (!isAllowed) {
          throw new Error('Geographic restrictions violated');
        }
      }

      // Check rate limiting for sensitive actions
      if (config.access_control.api_rate_limiting && ['login', 'api_call'].includes(action)) {
        const isWithinLimit = await this.checkRateLimit(
          `${userId}:${action}`,
          action === 'login' ? 10 : 100, // 10 logins or 100 API calls
          60 * 1000 // per minute
        );
        if (!isWithinLimit) {
          throw new Error('Rate limit exceeded');
        }
      }

      return true;
    } catch (error) {
      console.error('Security policy violation:', error);
      throw error;
    }
  }

  private async getCountryFromIP(ipAddress: string): Promise<string> {
    try {
      const response = await fetch(`https://ipapi.co/${ipAddress}/json/`);
      const data = await response.json();
      return data.country_code || 'US';
    } catch (error) {
      console.error('Error getting country from IP:', error);
      return 'US';
    }
  }
}

export const securityService = new SecurityService();