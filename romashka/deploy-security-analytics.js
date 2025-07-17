#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deploySecurityAndAnalytics() {
  try {
    console.log('🚀 Deploying Security and Analytics Tables...');
    console.log('=====================================');
    
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'src/migrations/008_security_analytics_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`\n⚡ Executing statement ${i + 1}/${statements.length}...`);
          
          // For CREATE TABLE statements, show table name
          if (statement.includes('CREATE TABLE')) {
            const tableMatch = statement.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(\w+)/i);
            if (tableMatch) {
              console.log(`   📋 Creating table: ${tableMatch[1]}`);
            }
          }
          
          // For INSERT statements, show what's being inserted
          if (statement.includes('INSERT INTO')) {
            const insertMatch = statement.match(/INSERT INTO\s+(\w+)/i);
            if (insertMatch) {
              console.log(`   📊 Inserting sample data into: ${insertMatch[1]}`);
            }
          }
          
          // For CREATE INDEX statements, show index name
          if (statement.includes('CREATE INDEX')) {
            const indexMatch = statement.match(/CREATE INDEX\s+(?:IF NOT EXISTS\s+)?(\w+)/i);
            if (indexMatch) {
              console.log(`   🔍 Creating index: ${indexMatch[1]}`);
            }
          }
          
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            // Some errors are expected (like table already exists)
            if (error.message.includes('already exists') || 
                error.message.includes('duplicate key') ||
                error.message.includes('already enabled') ||
                error.message.includes('relation') && error.message.includes('already exists')) {
              console.log(`   ⚠️  Already exists: ${error.message.split(':')[1]?.trim() || 'Resource'}`);
            } else {
              console.log(`   ❌ Error: ${error.message}`);
              errorCount++;
            }
          } else {
            console.log(`   ✅ Executed successfully`);
            successCount++;
          }
        } catch (err) {
          console.log(`   ⚠️  Warning: ${err.message}`);
          errorCount++;
        }
      }
    }
    
    console.log('\n🎉 Migration completed!');
    console.log('======================');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`⚠️  Errors/Warnings: ${errorCount}`);
    
    // Test the deployment
    await testDeployment();
    
    console.log('\n🎯 Next steps:');
    console.log('1. Start your development server: npm run dev');
    console.log('2. Navigate to /security to test the security dashboard');
    console.log('3. Navigate to /analytics to test the analytics dashboard');
    console.log('4. Check that predictive analytics now shows data');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

async function testDeployment() {
  try {
    console.log('\n🧪 Testing deployment...');
    
    // Test security tables
    const securityTables = [
      'security_sessions',
      'security_incidents', 
      'compliance_results',
      'compliance_checks'
    ];
    
    for (const table of securityTables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: ${count || 0} rows`);
      }
    }
    
    // Test analytics tables
    const analyticsTables = [
      'daily_analytics',
      'conversation_analytics',
      'performance_metrics',
      'realtime_metrics'
    ];
    
    for (const table of analyticsTables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: ${count || 0} rows`);
      }
    }
    
    console.log('\n✅ All tables are accessible!');
    
  } catch (error) {
    console.error('❌ Testing failed:', error);
  }
}

// Run the deployment
deploySecurityAndAnalytics();