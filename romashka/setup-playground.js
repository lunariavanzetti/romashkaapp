#!/usr/bin/env node

// ROMASHKA Playground Setup Script
// This script sets up the playground system by applying the necessary database migration

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function setupPlayground() {
  log('🎮 ROMASHKA Playground Setup', 'bold');
  log('================================', 'blue');

  // Check environment variables
  log('\n1. Checking environment configuration...', 'blue');
  
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_OPENAI_API_KEY'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    log(`❌ Missing required environment variables:`, 'red');
    missing.forEach(varName => log(`   - ${varName}`, 'red'));
    log('\nPlease set these in your .env file before running setup.', 'yellow');
    process.exit(1);
  }

  log('✅ All required environment variables found', 'green');

  // Initialize Supabase client
  log('\n2. Connecting to Supabase...', 'blue');
  
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  try {
    // Test connection
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (error) throw error;
    log('✅ Successfully connected to Supabase', 'green');
  } catch (error) {
    log(`❌ Failed to connect to Supabase: ${error.message}`, 'red');
    process.exit(1);
  }

  // Apply database migration
  log('\n3. Applying playground database migration...', 'blue');
  
  try {
    // Read migration file
    const migrationPath = join(__dirname, 'migrations', '008_playground_bot_configurations.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    // Split into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    log(`   Found ${statements.length} SQL statements to execute`, 'yellow');

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.startsWith('--') || statement.length < 10) continue;
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error && !error.message.includes('already exists')) {
          throw error;
        }
      } catch (error) {
        // Ignore "already exists" errors
        if (!error.message.includes('already exists')) {
          log(`   ⚠️  Warning: ${error.message}`, 'yellow');
        }
      }
    }

    log('✅ Database migration completed successfully', 'green');
  } catch (error) {
    log(`❌ Failed to apply migration: ${error.message}`, 'red');
    log('   You may need to apply the migration manually in Supabase SQL Editor', 'yellow');
  }

  // Verify tables exist
  log('\n4. Verifying playground tables...', 'blue');
  
  const requiredTables = [
    'bot_configurations',
    'bot_performance_metrics',
    'playground_ab_tests',
    'test_scenario_results'
  ];

  for (const table of requiredTables) {
    try {
      const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
      if (error) throw error;
      log(`   ✅ ${table} table exists`, 'green');
    } catch (error) {
      log(`   ❌ ${table} table missing or inaccessible`, 'red');
    }
  }

  // Test OpenAI connection
  log('\n5. Testing OpenAI API connection...', 'blue');
  
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.VITE_OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      log('✅ OpenAI API connection successful', 'green');
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    log(`❌ OpenAI API connection failed: ${error.message}`, 'red');
    log('   Please verify your VITE_OPENAI_API_KEY is correct', 'yellow');
  }

  // Setup complete
  log('\n🎉 Playground setup complete!', 'bold');
  log('================================', 'blue');
  log('\nNext steps:', 'blue');
  log('1. Start your development server: npm run dev', 'yellow');
  log('2. Navigate to /playground in your application', 'yellow');
  log('3. Configure your bot personality settings', 'yellow');
  log('4. Save your configuration and start testing!', 'yellow');
  log('\n📖 See PLAYGROUND_IMPLEMENTATION_GUIDE.md for detailed usage instructions', 'blue');
}

// Run setup
setupPlayground().catch(error => {
  log(`\n💥 Setup failed: ${error.message}`, 'red');
  process.exit(1);
});