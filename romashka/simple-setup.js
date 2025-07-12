#!/usr/bin/env node

/**
 * Simple Database Setup Test Script
 * This script tests environment loading with minimal dependencies
 */

console.log('🔧 ROMASHKA Simple Database Setup Test');
console.log('='.repeat(60));

// Check if DATABASE_URL is provided
if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL not found!');
    console.log('');
    console.log('🔧 Please run this script with:');
    console.log('   node --env-file=.env simple-setup.js');
    console.log('');
    console.log('📝 Or set DATABASE_URL manually:');
    console.log('   DATABASE_URL="your-connection-string" node simple-setup.js');
    console.log('');
    console.log('💡 Example DATABASE_URL:');
    console.log('   postgresql://postgres.abc123:[password]@aws-0-us-west-1.pooler.supabase.com:5432/postgres');
    process.exit(1);
}

console.log('✅ DATABASE_URL found!');
console.log('🔗 Connection string:', process.env.DATABASE_URL.substring(0, 50) + '...');
console.log('');
console.log('🎉 Environment loading is working!');
console.log('');
console.log('📝 Next steps:');
console.log('1. Update your .env file with real Supabase credentials');
console.log('2. Run the full setup: node --env-file=.env setup-database.js');
console.log('3. Load sample data in Supabase SQL Editor: \\i simple-sample-data-fixed.sql');
console.log('');
console.log('✅ Test complete!');