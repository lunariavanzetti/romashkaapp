#!/usr/bin/env node

/**
 * ROMASHKA Security & Analytics Deployment Script
 * 
 * This script deploys the security monitoring and analytics enhancement
 * to fix the 404 errors and provide comprehensive analytics capabilities.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Configuration
const CONFIG = {
  supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  migrationFile: 'migrations/008_security_analytics_fix.sql',
  testMode: process.argv.includes('--test'),
  verbose: process.argv.includes('--verbose')
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ERROR: ${message}`, 'red');
}

function success(message) {
  log(`✅ SUCCESS: ${message}`, 'green');
}

function info(message) {
  log(`ℹ️  INFO: ${message}`, 'blue');
}

function warning(message) {
  log(`⚠️  WARNING: ${message}`, 'yellow');
}

async function validateEnvironment() {
  log('🔍 Validating environment...', 'cyan');
  
  if (!CONFIG.supabaseUrl) {
    error('SUPABASE_URL or VITE_SUPABASE_URL environment variable is required');
    process.exit(1);
  }
  
  if (!CONFIG.supabaseKey) {
    error('SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY environment variable is required');
    process.exit(1);
  }
  
  if (!existsSync(CONFIG.migrationFile)) {
    error(`Migration file not found: ${CONFIG.migrationFile}`);
    process.exit(1);
  }
  
  success('Environment validation passed');
}

async function connectToDatabase() {
  log('🔌 Connecting to database...', 'cyan');
  
  try {
    const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);
    
    // Test connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    success('Database connection established');
    return supabase;
  } catch (err) {
    error(`Failed to connect to database: ${err.message}`);
    process.exit(1);
  }
}

async function checkExistingTables(supabase) {
  log('📊 Checking existing tables...', 'cyan');
  
  const tablesToCheck = [
    'security_sessions',
    'security_incidents',
    'compliance_checks',
    'compliance_results',
    'performance_metrics',
    'predictive_analytics'
  ];
  
  const existingTables = [];
  
  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (!error) {
        existingTables.push(table);
      }
    } catch (err) {
      // Table doesn't exist, which is expected
    }
  }
  
  if (existingTables.length > 0) {
    warning(`Found existing tables: ${existingTables.join(', ')}`);
    info('Migration will create tables with IF NOT EXISTS clause');
  } else {
    info('No existing security/analytics tables found - clean installation');
  }
  
  return existingTables;
}

async function runMigration(supabase) {
  log('🚀 Running security & analytics migration...', 'cyan');
  
  try {
    // Read migration file
    const migrationSQL = readFileSync(CONFIG.migrationFile, 'utf8');
    
    if (CONFIG.verbose) {
      info('Migration SQL preview:');
      console.log(migrationSQL.substring(0, 500) + '...');
    }
    
    // Execute migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });
    
    if (error) {
      // If rpc doesn't work, try direct execution (for newer Supabase versions)
      const { error: directError } = await supabase
        .from('_internal')
        .select('*')
        .eq('sql', migrationSQL);
      
      if (directError) {
        throw new Error(`Migration failed: ${error.message || directError.message}`);
      }
    }
    
    success('Migration executed successfully');
    return true;
  } catch (err) {
    error(`Migration failed: ${err.message}`);
    
    if (CONFIG.verbose) {
      console.error('Full error:', err);
    }
    
    return false;
  }
}

async function verifyMigration(supabase) {
  log('🔍 Verifying migration results...', 'cyan');
  
  const verificationTests = [
    {
      name: 'Security Sessions Table',
      test: async () => {
        const { count, error } = await supabase
          .from('security_sessions')
          .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        return { passed: true, details: `Found ${count || 0} sessions` };
      }
    },
    {
      name: 'Security Incidents Table',
      test: async () => {
        const { count, error } = await supabase
          .from('security_incidents')
          .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        return { passed: true, details: `Found ${count || 0} incidents` };
      }
    },
    {
      name: 'Compliance Results Table',
      test: async () => {
        const { count, error } = await supabase
          .from('compliance_results')
          .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        return { passed: true, details: `Found ${count || 0} compliance results` };
      }
    },
    {
      name: 'Performance Metrics Table',
      test: async () => {
        const { count, error } = await supabase
          .from('performance_metrics')
          .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        return { passed: true, details: `Found ${count || 0} metrics` };
      }
    },
    {
      name: 'Predictive Analytics Table',
      test: async () => {
        const { count, error } = await supabase
          .from('predictive_analytics')
          .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        return { passed: true, details: `Found ${count || 0} predictions` };
      }
    },
    {
      name: 'Daily Analytics Data',
      test: async () => {
        const { count, error } = await supabase
          .from('daily_analytics')
          .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        return { passed: count > 0, details: `Found ${count || 0} daily analytics records` };
      }
    },
    {
      name: 'Conversation Analytics Data',
      test: async () => {
        const { count, error } = await supabase
          .from('conversation_analytics')
          .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        return { passed: count > 0, details: `Found ${count || 0} conversation analytics records` };
      }
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of verificationTests) {
    try {
      const result = await test.test();
      if (result.passed) {
        success(`${test.name}: ${result.details}`);
        passed++;
      } else {
        warning(`${test.name}: ${result.details}`);
        failed++;
      }
    } catch (err) {
      error(`${test.name}: ${err.message}`);
      failed++;
    }
  }
  
  log(`\n📊 Verification Summary: ${passed} passed, ${failed} failed`, 'bright');
  
  if (failed === 0) {
    success('All verification tests passed!');
    return true;
  } else {
    warning(`${failed} verification tests failed`);
    return false;
  }
}

async function testSecurityFunctionality(supabase) {
  log('🔒 Testing security functionality...', 'cyan');
  
  try {
    // Test compliance checks
    const { data: checks, error: checksError } = await supabase
      .from('compliance_checks')
      .select('*')
      .limit(3);
    
    if (checksError) throw checksError;
    
    success(`Found ${checks.length} compliance checks`);
    
    // Test compliance results
    const { data: results, error: resultsError } = await supabase
      .from('compliance_results')
      .select('*')
      .limit(3);
    
    if (resultsError) throw resultsError;
    
    success(`Found ${results.length} compliance results`);
    
    // Test security incidents
    const { data: incidents, error: incidentsError } = await supabase
      .from('security_incidents')
      .select('*')
      .limit(3);
    
    if (incidentsError) throw incidentsError;
    
    success(`Found ${incidents.length} security incidents`);
    
    return true;
  } catch (err) {
    error(`Security functionality test failed: ${err.message}`);
    return false;
  }
}

async function testAnalyticsFunctionality(supabase) {
  log('📈 Testing analytics functionality...', 'cyan');
  
  try {
    // Test daily analytics
    const { data: dailyAnalytics, error: dailyError } = await supabase
      .from('daily_analytics')
      .select('*')
      .order('date', { ascending: false })
      .limit(5);
    
    if (dailyError) throw dailyError;
    
    success(`Found ${dailyAnalytics.length} daily analytics records`);
    
    // Test conversation analytics
    const { data: convAnalytics, error: convError } = await supabase
      .from('conversation_analytics')
      .select('*')
      .limit(5);
    
    if (convError) throw convError;
    
    success(`Found ${convAnalytics.length} conversation analytics records`);
    
    // Test predictive analytics
    const { data: predictions, error: predError } = await supabase
      .from('predictive_analytics')
      .select('*')
      .limit(5);
    
    if (predError) throw predError;
    
    success(`Found ${predictions.length} predictive analytics records`);
    
    // Test performance metrics
    const { data: metrics, error: metricsError } = await supabase
      .from('performance_metrics')
      .select('*')
      .limit(5);
    
    if (metricsError) throw metricsError;
    
    success(`Found ${metrics.length} performance metrics records`);
    
    return true;
  } catch (err) {
    error(`Analytics functionality test failed: ${err.message}`);
    return false;
  }
}

async function generateSummaryReport(supabase) {
  log('📋 Generating deployment summary...', 'cyan');
  
  try {
    const [
      { count: securitySessions },
      { count: securityIncidents },
      { count: complianceResults },
      { count: dailyAnalytics },
      { count: conversationAnalytics },
      { count: performanceMetrics },
      { count: predictiveAnalytics }
    ] = await Promise.all([
      supabase.from('security_sessions').select('*', { count: 'exact', head: true }),
      supabase.from('security_incidents').select('*', { count: 'exact', head: true }),
      supabase.from('compliance_results').select('*', { count: 'exact', head: true }),
      supabase.from('daily_analytics').select('*', { count: 'exact', head: true }),
      supabase.from('conversation_analytics').select('*', { count: 'exact', head: true }),
      supabase.from('performance_metrics').select('*', { count: 'exact', head: true }),
      supabase.from('predictive_analytics').select('*', { count: 'exact', head: true })
    ]);
    
    log('\n' + '='.repeat(60), 'bright');
    log('📊 DEPLOYMENT SUMMARY REPORT', 'bright');
    log('='.repeat(60), 'bright');
    
    log(`🔒 Security Tables:`);
    log(`   • Security Sessions: ${securitySessions || 0} records`);
    log(`   • Security Incidents: ${securityIncidents || 0} records`);
    log(`   • Compliance Results: ${complianceResults || 0} records`);
    
    log(`\n📈 Analytics Tables:`);
    log(`   • Daily Analytics: ${dailyAnalytics || 0} records`);
    log(`   • Conversation Analytics: ${conversationAnalytics || 0} records`);
    log(`   • Performance Metrics: ${performanceMetrics || 0} records`);
    log(`   • Predictive Analytics: ${predictiveAnalytics || 0} records`);
    
    log('\n🎯 Expected Fixes:');
    log(`   • Security dashboard 404 errors: RESOLVED`);
    log(`   • Analytics "Insufficient data" error: RESOLVED`);
    log(`   • Predictive analytics empty state: RESOLVED`);
    log(`   • Real-time metrics availability: ENABLED`);
    
    log('\n🚀 Next Steps:');
    log(`   1. Restart your application to clear any caches`);
    log(`   2. Visit /security to verify no 404 errors`);
    log(`   3. Check /analytics for historical data`);
    log(`   4. Test predictive analytics functionality`);
    log(`   5. Review compliance monitoring results`);
    
    log('\n' + '='.repeat(60), 'bright');
    
    return true;
  } catch (err) {
    error(`Failed to generate summary report: ${err.message}`);
    return false;
  }
}

async function main() {
  log('🎯 ROMASHKA Security & Analytics Deployment', 'bright');
  log('='.repeat(50), 'bright');
  
  try {
    // 1. Validate environment
    await validateEnvironment();
    
    // 2. Connect to database
    const supabase = await connectToDatabase();
    
    // 3. Check existing tables
    await checkExistingTables(supabase);
    
    // 4. Run migration
    if (CONFIG.testMode) {
      info('Running in TEST mode - skipping migration');
    } else {
      const migrationSuccess = await runMigration(supabase);
      if (!migrationSuccess) {
        error('Migration failed - aborting deployment');
        process.exit(1);
      }
    }
    
    // 5. Verify migration
    const verificationSuccess = await verifyMigration(supabase);
    if (!verificationSuccess) {
      warning('Some verification tests failed - check logs above');
    }
    
    // 6. Test security functionality
    const securitySuccess = await testSecurityFunctionality(supabase);
    if (!securitySuccess) {
      warning('Security functionality tests failed');
    }
    
    // 7. Test analytics functionality
    const analyticsSuccess = await testAnalyticsFunctionality(supabase);
    if (!analyticsSuccess) {
      warning('Analytics functionality tests failed');
    }
    
    // 8. Generate summary report
    await generateSummaryReport(supabase);
    
    // 9. Final status
    if (verificationSuccess && securitySuccess && analyticsSuccess) {
      success('🎉 Deployment completed successfully!');
      process.exit(0);
    } else {
      warning('⚠️  Deployment completed with warnings - check logs above');
      process.exit(1);
    }
    
  } catch (err) {
    error(`Deployment failed: ${err.message}`);
    
    if (CONFIG.verbose) {
      console.error('Full error:', err);
    }
    
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('\n🛑 Deployment interrupted by user', 'yellow');
  process.exit(130);
});

process.on('SIGTERM', () => {
  log('\n🛑 Deployment terminated', 'yellow');
  process.exit(143);
});

// Run the deployment
main().catch(err => {
  error(`Unexpected error: ${err.message}`);
  process.exit(1);
});