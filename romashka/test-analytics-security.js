#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAnalyticsAndSecurity() {
  console.log('🧪 Testing Analytics & Security Fix');
  console.log('==================================');
  
  let allTestsPassed = true;
  
  // Test 1: Security Tables
  console.log('\n1. Testing Security Tables...');
  const securityTables = [
    'security_sessions',
    'security_incidents',
    'compliance_checks',
    'compliance_results'
  ];
  
  for (const table of securityTables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
        allTestsPassed = false;
      } else {
        console.log(`   ✅ ${table}: ${count || 0} rows`);
      }
    } catch (err) {
      console.log(`   ❌ ${table}: ${err.message}`);
      allTestsPassed = false;
    }
  }
  
  // Test 2: Analytics Tables
  console.log('\n2. Testing Analytics Tables...');
  const analyticsTables = [
    'daily_analytics',
    'conversation_analytics',
    'performance_metrics',
    'realtime_metrics'
  ];
  
  for (const table of analyticsTables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
        allTestsPassed = false;
      } else {
        console.log(`   ✅ ${table}: ${count || 0} rows`);
      }
    } catch (err) {
      console.log(`   ❌ ${table}: ${err.message}`);
      allTestsPassed = false;
    }
  }
  
  // Test 3: Sample Data
  console.log('\n3. Testing Sample Data...');
  
  try {
    // Test daily analytics sample data
    const { data: dailyData, error: dailyError } = await supabase
      .from('daily_analytics')
      .select('*')
      .limit(5);
    
    if (dailyError) {
      console.log(`   ❌ Daily analytics sample data: ${dailyError.message}`);
      allTestsPassed = false;
    } else {
      console.log(`   ✅ Daily analytics sample data: ${dailyData?.length || 0} records`);
    }
    
    // Test compliance checks sample data
    const { data: complianceData, error: complianceError } = await supabase
      .from('compliance_checks')
      .select('*')
      .limit(5);
    
    if (complianceError) {
      console.log(`   ❌ Compliance checks sample data: ${complianceError.message}`);
      allTestsPassed = false;
    } else {
      console.log(`   ✅ Compliance checks sample data: ${complianceData?.length || 0} records`);
    }
    
  } catch (err) {
    console.log(`   ❌ Sample data test failed: ${err.message}`);
    allTestsPassed = false;
  }
  
  // Test 4: Data Queries
  console.log('\n4. Testing Data Queries...');
  
  try {
    // Test analytics query
    const { data: analyticsData, error: analyticsError } = await supabase
      .from('daily_analytics')
      .select('date, total_conversations, avg_customer_satisfaction')
      .order('date', { ascending: false })
      .limit(7);
    
    if (analyticsError) {
      console.log(`   ❌ Analytics query: ${analyticsError.message}`);
      allTestsPassed = false;
    } else {
      console.log(`   ✅ Analytics query: Retrieved ${analyticsData?.length || 0} days of data`);
      if (analyticsData && analyticsData.length > 0) {
        const avgSatisfaction = analyticsData.reduce((sum, day) => sum + (day.avg_customer_satisfaction || 0), 0) / analyticsData.length;
        console.log(`   📊 Average satisfaction: ${avgSatisfaction.toFixed(2)}/5.0`);
      }
    }
    
    // Test security query
    const { data: securityData, error: securityError } = await supabase
      .from('compliance_checks')
      .select('check_name, check_type, is_active')
      .eq('is_active', true);
    
    if (securityError) {
      console.log(`   ❌ Security query: ${securityError.message}`);
      allTestsPassed = false;
    } else {
      console.log(`   ✅ Security query: Retrieved ${securityData?.length || 0} active compliance checks`);
    }
    
  } catch (err) {
    console.log(`   ❌ Data queries test failed: ${err.message}`);
    allTestsPassed = false;
  }
  
  // Test Results
  console.log('\n' + '='.repeat(50));
  
  if (allTestsPassed) {
    console.log('✅ ALL TESTS PASSED!');
    console.log('🎉 Analytics & Security systems are working correctly!');
    console.log('\n📍 Next steps:');
    console.log('1. Start your development server: npm run dev');
    console.log('2. Navigate to /security - should load without errors');
    console.log('3. Navigate to /analytics - should show data and insights');
    console.log('4. Check real-time metrics are updating');
    console.log('5. Verify predictive analytics show forecasts');
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('🔧 Please check the deployment and try again');
    console.log('\n🛠️  Troubleshooting:');
    console.log('1. Ensure environment variables are set correctly');
    console.log('2. Run: node deploy-security-analytics.js');
    console.log('3. Check database connection and permissions');
    console.log('4. Review error messages above for specific issues');
  }
  
  console.log('\n📊 Test Summary:');
  console.log(`Status: ${allTestsPassed ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database: ${supabaseUrl}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
}

// Run the tests
testAnalyticsAndSecurity().catch(console.error);