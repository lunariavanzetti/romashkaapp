#!/usr/bin/env node

/**
 * ROMASHKA Analytics & Security Test Script
 * 
 * This script tests the deployed security monitoring and analytics functionality
 * to ensure the 404 errors are resolved and features are working correctly.
 */

import { createClient } from '@supabase/supabase-js';
import { performance } from 'perf_hooks';

// Configuration
const CONFIG = {
  supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  verbose: process.argv.includes('--verbose'),
  skipSlow: process.argv.includes('--fast')
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

function recordTest(name, passed, details = '', duration = 0) {
  testResults.tests.push({
    name,
    passed,
    details,
    duration
  });
  
  if (passed) {
    testResults.passed++;
    success(`${name}: ${details} (${duration}ms)`);
  } else {
    testResults.failed++;
    error(`${name}: ${details} (${duration}ms)`);
  }
}

function recordSkip(name, reason) {
  testResults.skipped++;
  testResults.tests.push({
    name,
    passed: null,
    details: reason,
    duration: 0
  });
  warning(`${name}: SKIPPED - ${reason}`);
}

async function runTest(name, testFn, skipCondition = false) {
  if (skipCondition) {
    recordSkip(name, 'Test skipped due to conditions');
    return;
  }
  
  const startTime = performance.now();
  
  try {
    await testFn();
    const endTime = performance.now();
    recordTest(name, true, 'Passed', Math.round(endTime - startTime));
  } catch (err) {
    const endTime = performance.now();
    recordTest(name, false, err.message, Math.round(endTime - startTime));
  }
}

async function connectToDatabase() {
  log('🔌 Connecting to database...', 'cyan');
  
  if (!CONFIG.supabaseUrl || !CONFIG.supabaseKey) {
    throw new Error('Missing required environment variables');
  }
  
  const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);
  
  // Test connection
  const { error } = await supabase
    .from('profiles')
    .select('count')
    .limit(1);
  
  if (error) {
    throw new Error(`Database connection failed: ${error.message}`);
  }
  
  success('Database connection established');
  return supabase;
}

// ================================
// SECURITY TESTS
// ================================

async function testSecurityTables(supabase) {
  log('\n🔒 Testing Security Tables...', 'cyan');
  
  // Test security_sessions table
  await runTest('Security Sessions Table Access', async () => {
    const { data, error } = await supabase
      .from('security_sessions')
      .select('*')
      .limit(1);
    
    if (error) {
      throw new Error(`Table access failed: ${error.message}`);
    }
    
    return `Table accessible, found ${data?.length || 0} records`;
  });
  
  // Test security_incidents table
  await runTest('Security Incidents Table Access', async () => {
    const { data, error } = await supabase
      .from('security_incidents')
      .select('*')
      .limit(1);
    
    if (error) {
      throw new Error(`Table access failed: ${error.message}`);
    }
    
    return `Table accessible, found ${data?.length || 0} records`;
  });
  
  // Test compliance_results table
  await runTest('Compliance Results Table Access', async () => {
    const { data, error } = await supabase
      .from('compliance_results')
      .select('*')
      .limit(1);
    
    if (error) {
      throw new Error(`Table access failed: ${error.message}`);
    }
    
    return `Table accessible, found ${data?.length || 0} records`;
  });
  
  // Test compliance_checks table
  await runTest('Compliance Checks Table Access', async () => {
    const { data, error } = await supabase
      .from('compliance_checks')
      .select('*')
      .limit(1);
    
    if (error) {
      throw new Error(`Table access failed: ${error.message}`);
    }
    
    return `Table accessible, found ${data?.length || 0} records`;
  });
}

async function testSecurityFunctionality(supabase) {
  log('\n🛡️ Testing Security Functionality...', 'cyan');
  
  // Test security dashboard data availability
  await runTest('Security Dashboard Data', async () => {
    const [
      { count: sessions },
      { count: incidents },
      { count: results }
    ] = await Promise.all([
      supabase.from('security_sessions').select('*', { count: 'exact', head: true }),
      supabase.from('security_incidents').select('*', { count: 'exact', head: true }),
      supabase.from('compliance_results').select('*', { count: 'exact', head: true })
    ]);
    
    if (sessions === 0 && incidents === 0 && results === 0) {
      throw new Error('No security data available for dashboard');
    }
    
    return `Sessions: ${sessions}, Incidents: ${incidents}, Results: ${results}`;
  });
  
  // Test compliance status calculation
  await runTest('Compliance Status Calculation', async () => {
    const { data, error } = await supabase
      .from('compliance_results')
      .select('status, severity')
      .limit(10);
    
    if (error) {
      throw new Error(`Failed to fetch compliance data: ${error.message}`);
    }
    
    const statusCounts = data.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});
    
    return `Status distribution: ${JSON.stringify(statusCounts)}`;
  });
  
  // Test security metrics aggregation
  await runTest('Security Metrics Aggregation', async () => {
    const { data: sessions, error } = await supabase
      .from('security_sessions')
      .select('is_active, created_at')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    if (error) {
      throw new Error(`Failed to fetch session data: ${error.message}`);
    }
    
    const activeSessions = sessions.filter(s => s.is_active).length;
    const totalSessions = sessions.length;
    
    return `Active: ${activeSessions}, Total: ${totalSessions}`;
  });
}

// ================================
// ANALYTICS TESTS
// ================================

async function testAnalyticsTables(supabase) {
  log('\n📊 Testing Analytics Tables...', 'cyan');
  
  // Test daily_analytics table
  await runTest('Daily Analytics Table Access', async () => {
    const { data, error } = await supabase
      .from('daily_analytics')
      .select('*')
      .limit(1);
    
    if (error) {
      throw new Error(`Table access failed: ${error.message}`);
    }
    
    return `Table accessible, found ${data?.length || 0} records`;
  });
  
  // Test conversation_analytics table
  await runTest('Conversation Analytics Table Access', async () => {
    const { data, error } = await supabase
      .from('conversation_analytics')
      .select('*')
      .limit(1);
    
    if (error) {
      throw new Error(`Table access failed: ${error.message}`);
    }
    
    return `Table accessible, found ${data?.length || 0} records`;
  });
  
  // Test performance_metrics table
  await runTest('Performance Metrics Table Access', async () => {
    const { data, error } = await supabase
      .from('performance_metrics')
      .select('*')
      .limit(1);
    
    if (error) {
      throw new Error(`Table access failed: ${error.message}`);
    }
    
    return `Table accessible, found ${data?.length || 0} records`;
  });
  
  // Test predictive_analytics table
  await runTest('Predictive Analytics Table Access', async () => {
    const { data, error } = await supabase
      .from('predictive_analytics')
      .select('*')
      .limit(1);
    
    if (error) {
      throw new Error(`Table access failed: ${error.message}`);
    }
    
    return `Table accessible, found ${data?.length || 0} records`;
  });
}

async function testAnalyticsFunctionality(supabase) {
  log('\n📈 Testing Analytics Functionality...', 'cyan');
  
  // Test historical data availability
  await runTest('Historical Analytics Data', async () => {
    const { data, error } = await supabase
      .from('daily_analytics')
      .select('*')
      .order('date', { ascending: false })
      .limit(30);
    
    if (error) {
      throw new Error(`Failed to fetch historical data: ${error.message}`);
    }
    
    if (data.length === 0) {
      throw new Error('No historical analytics data available');
    }
    
    return `Found ${data.length} days of historical data`;
  });
  
  // Test predictive analytics data
  await runTest('Predictive Analytics Data', async () => {
    const { data, error } = await supabase
      .from('predictive_analytics')
      .select('*')
      .gte('prediction_date', new Date().toISOString().split('T')[0])
      .limit(10);
    
    if (error) {
      throw new Error(`Failed to fetch predictive data: ${error.message}`);
    }
    
    if (data.length === 0) {
      throw new Error('No predictive analytics data available');
    }
    
    return `Found ${data.length} prediction records`;
  });
  
  // Test real-time metrics calculation
  await runTest('Real-time Metrics Calculation', async () => {
    const [
      { count: activeConversations },
      { data: recentAnalytics }
    ] = await Promise.all([
      supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('conversation_analytics').select('customer_satisfaction, ai_accuracy_score').not('customer_satisfaction', 'is', null).limit(10)
    ]);
    
    if (activeConversations === null) {
      throw new Error('Failed to calculate active conversations');
    }
    
    const avgSatisfaction = recentAnalytics.length > 0 ? 
      recentAnalytics.reduce((acc, item) => acc + (item.customer_satisfaction || 0), 0) / recentAnalytics.length : 0;
    
    return `Active conversations: ${activeConversations}, Avg satisfaction: ${avgSatisfaction.toFixed(2)}`;
  });
  
  // Test performance metrics aggregation
  await runTest('Performance Metrics Aggregation', async () => {
    const { data, error } = await supabase
      .from('performance_metrics')
      .select('metric_name, metric_value')
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(20);
    
    if (error) {
      throw new Error(`Failed to fetch performance metrics: ${error.message}`);
    }
    
    const metricTypes = [...new Set(data.map(m => m.metric_name))];
    
    return `Found ${data.length} metrics across ${metricTypes.length} types`;
  });
}

// ================================
// INTEGRATION TESTS
// ================================

async function testDashboardIntegration(supabase) {
  log('\n🎯 Testing Dashboard Integration...', 'cyan');
  
  // Test security dashboard data structure
  await runTest('Security Dashboard Data Structure', async () => {
    const [
      { count: activeSessions },
      { data: recentIncidents },
      { data: complianceResults }
    ] = await Promise.all([
      supabase.from('security_sessions').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('security_incidents').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('compliance_results').select('*').order('created_at', { ascending: false }).limit(5)
    ]);
    
    // Simulate dashboard data structure
    const dashboardData = {
      activeSessions: activeSessions || 0,
      recentIncidents: recentIncidents || [],
      complianceStatus: {
        total: complianceResults?.length || 0,
        passed: complianceResults?.filter(r => r.status === 'passed').length || 0,
        failed: complianceResults?.filter(r => r.status === 'failed').length || 0
      }
    };
    
    return `Dashboard structure valid: ${JSON.stringify(dashboardData)}`;
  });
  
  // Test analytics dashboard data structure
  await runTest('Analytics Dashboard Data Structure', async () => {
    const [
      { data: dailyAnalytics },
      { data: convAnalytics },
      { data: predictions }
    ] = await Promise.all([
      supabase.from('daily_analytics').select('*').order('date', { ascending: false }).limit(7),
      supabase.from('conversation_analytics').select('*').limit(10),
      supabase.from('predictive_analytics').select('*').limit(5)
    ]);
    
    // Simulate analytics dashboard data structure
    const analyticsData = {
      historicalTrend: dailyAnalytics || [],
      conversationMetrics: convAnalytics || [],
      predictions: predictions || []
    };
    
    if (analyticsData.historicalTrend.length === 0) {
      throw new Error('No historical trend data available');
    }
    
    return `Analytics structure valid with ${analyticsData.historicalTrend.length} trend points`;
  });
}

// ================================
// PERFORMANCE TESTS
// ================================

async function testPerformance(supabase) {
  log('\n⚡ Testing Performance...', 'cyan');
  
  // Test query performance for security dashboard
  await runTest('Security Dashboard Query Performance', async () => {
    const startTime = performance.now();
    
    await Promise.all([
      supabase.from('security_sessions').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('security_incidents').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('compliance_results').select('*').order('created_at', { ascending: false }).limit(10)
    ]);
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (duration > 3000) {
      throw new Error(`Query too slow: ${duration}ms (should be < 3000ms)`);
    }
    
    return `Query completed in ${Math.round(duration)}ms`;
  }, CONFIG.skipSlow);
  
  // Test query performance for analytics dashboard
  await runTest('Analytics Dashboard Query Performance', async () => {
    const startTime = performance.now();
    
    await Promise.all([
      supabase.from('daily_analytics').select('*').order('date', { ascending: false }).limit(30),
      supabase.from('conversation_analytics').select('*').limit(100),
      supabase.from('predictive_analytics').select('*').limit(30)
    ]);
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (duration > 3000) {
      throw new Error(`Query too slow: ${duration}ms (should be < 3000ms)`);
    }
    
    return `Query completed in ${Math.round(duration)}ms`;
  }, CONFIG.skipSlow);
}

// ================================
// MAIN TEST RUNNER
// ================================

async function main() {
  log('🧪 ROMASHKA Analytics & Security Test Suite', 'bright');
  log('='.repeat(50), 'bright');
  
  try {
    // Connect to database
    const supabase = await connectToDatabase();
    
    // Run test suites
    await testSecurityTables(supabase);
    await testSecurityFunctionality(supabase);
    await testAnalyticsTables(supabase);
    await testAnalyticsFunctionality(supabase);
    await testDashboardIntegration(supabase);
    await testPerformance(supabase);
    
    // Generate test report
    log('\n' + '='.repeat(50), 'bright');
    log('📋 TEST RESULTS SUMMARY', 'bright');
    log('='.repeat(50), 'bright');
    
    log(`✅ Passed: ${testResults.passed}`, 'green');
    log(`❌ Failed: ${testResults.failed}`, 'red');
    log(`⚠️  Skipped: ${testResults.skipped}`, 'yellow');
    log(`📊 Total: ${testResults.tests.length}`, 'bright');
    
    const successRate = Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100);
    log(`📈 Success Rate: ${successRate}%`, successRate >= 90 ? 'green' : successRate >= 75 ? 'yellow' : 'red');
    
    if (CONFIG.verbose) {
      log('\n📝 Detailed Test Results:', 'cyan');
      testResults.tests.forEach(test => {
        const status = test.passed === true ? '✅' : test.passed === false ? '❌' : '⚠️';
        log(`${status} ${test.name}: ${test.details} (${test.duration}ms)`);
      });
    }
    
    // Final assessment
    log('\n🎯 Assessment:', 'bright');
    
    if (testResults.failed === 0) {
      success('All tests passed! Security and analytics functionality is working correctly.');
      log('✅ Security dashboard 404 errors should be resolved');
      log('✅ Analytics "Insufficient data" errors should be resolved');
      log('✅ Predictive analytics should display forecasts');
      log('✅ Real-time metrics should be available');
    } else {
      error(`${testResults.failed} tests failed. Please review the errors above.`);
    }
    
    // Exit with appropriate code
    process.exit(testResults.failed === 0 ? 0 : 1);
    
  } catch (err) {
    error(`Test suite failed: ${err.message}`);
    
    if (CONFIG.verbose) {
      console.error('Full error:', err);
    }
    
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('\n🛑 Tests interrupted by user', 'yellow');
  process.exit(130);
});

process.on('SIGTERM', () => {
  log('\n🛑 Tests terminated', 'yellow');
  process.exit(143);
});

// Run the tests
main().catch(err => {
  error(`Unexpected error: ${err.message}`);
  process.exit(1);
});