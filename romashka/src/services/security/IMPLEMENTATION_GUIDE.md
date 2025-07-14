# Security & Compliance Implementation Guide

## Quick Setup

### 1. Database Schema Deployment
```sql
-- Run the security schema
psql -h your-db-host -U your-user -d your-db -f src/services/security/database-schema.sql
```

### 2. Environment Variables
Add to your `.env` file:
```env
# Security Configuration
SECURITY_ENCRYPTION_KEY=your-encryption-key-here
SECURITY_API_KEY_SECRET=your-api-key-secret
SECURITY_2FA_ISSUER=ROMASHKA
SECURITY_SESSION_TIMEOUT=86400000
SECURITY_RATE_LIMIT_ENABLED=true
SECURITY_IP_WHITELIST_ENABLED=false
SECURITY_GEO_RESTRICTIONS_ENABLED=false

# Compliance Configuration
COMPLIANCE_CHECK_FREQUENCY=daily
COMPLIANCE_RETENTION_ENABLED=true
COMPLIANCE_AUDIT_ENABLED=true
COMPLIANCE_GDPR_ENABLED=true
```

### 3. Service Integration
```typescript
// In your main app file
import { auditService } from './services/security/auditService';
import { securityService } from './services/security/securityService';
import { complianceService } from './services/security/complianceService';
import { gdprService } from './services/security/gdprService';

// Initialize services
await auditService.startUserSession();
await complianceService.runAllComplianceChecks();
```

### 4. Dashboard Integration
```typescript
// In your router
import SecurityDashboard from './pages/security/SecurityDashboard';

// Add route
<Route path="/security" component={SecurityDashboard} />
```

### 5. Widget Deployment
```typescript
// For customer websites
import ConsentManager from './components/compliance/ConsentManager';

// Add to website
<ConsentManager 
  customerId={customerId} 
  isWidget={true}
  onConsentChange={handleConsentChange}
/>
```

## Testing

### 1. Run Compliance Checks
```typescript
const { data, error } = await complianceService.runAllComplianceChecks();
console.log('Compliance results:', data);
```

### 2. Test GDPR Features
```typescript
// Test data export
const exportData = await gdprService.exportCustomerData(customerId);

// Test consent management
const consent = await gdprService.recordConsent({
  customer_id: customerId,
  consent_type: 'analytics',
  consent_given: true,
  consent_method: 'explicit',
  purpose: 'Analytics tracking',
  legal_basis: 'consent'
});
```

### 3. Test Security Features
```typescript
// Test 2FA
const result = await securityService.enable2FA(userId, 'totp');

// Test API key creation
const apiKey = await securityService.createApiKey(userId, 'Test Key', ['read']);
```

## Monitoring

### 1. Set up Compliance Monitoring
```typescript
// Schedule compliance checks
setInterval(async () => {
  await complianceService.runAllComplianceChecks();
}, 24 * 60 * 60 * 1000); // Daily
```

### 2. Monitor Security Events
```typescript
// Monitor failed logins
auditService.on('failed_login', (event) => {
  console.warn('Failed login attempt:', event);
});
```

## Support

For issues or questions:
1. Check the main documentation: `ENTERPRISE_SECURITY_COMPLIANCE_SUMMARY.md`
2. Review service implementations in `src/services/security/`
3. Check component implementations in `src/components/compliance/`
4. Review dashboard implementation in `src/pages/security/`

## Security Checklist

- [ ] Database schema deployed
- [ ] Environment variables configured
- [ ] Services integrated
- [ ] Dashboard accessible
- [ ] Widget deployed (if needed)
- [ ] Compliance checks running
- [ ] Audit logging active
- [ ] 2FA enabled for admin users
- [ ] GDPR features tested
- [ ] Security monitoring active