#!/usr/bin/env node

/**
 * Database Connection Test and Schema Verification
 * This script connects to Supabase and verifies the database schema
 * 
 * Usage: node --env-file=.env database-connection-test.js
 * OR: npm run db:test
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function testConnection() {
    console.log('🔗 Testing database connection...');
    
    try {
        const client = await pool.connect();
        console.log('✅ Successfully connected to database!');
        
        // Test query
        const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
        console.log('📅 Current time:', result.rows[0].current_time);
        console.log('🐘 PostgreSQL version:', result.rows[0].postgres_version.split(' ')[0]);
        
        client.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:');
        console.error('Error:', error.message);
        
        if (error.message.includes('password authentication failed')) {
            console.log('\n💡 Possible solutions:');
            console.log('1. Check your password in DATABASE_URL');
            console.log('2. Make sure you\'re using the correct database password');
            console.log('3. Try resetting your database password in Supabase dashboard');
        } else if (error.message.includes('timeout') || error.message.includes('ENOTFOUND')) {
            console.log('\n💡 Possible solutions:');
            console.log('1. Check your project ID in DATABASE_URL');
            console.log('2. Make sure the host URL is correct');
            console.log('3. Check your internet connection');
        }
        
        return false;
    }
}

async function checkTableExists(tableName) {
    try {
        const client = await pool.connect();
        const result = await client.query(
            `SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = $1
            );`,
            [tableName]
        );
        client.release();
        return result.rows[0].exists;
    } catch (error) {
        console.error(`Error checking table ${tableName}:`, error.message);
        return false;
    }
}

async function getTableColumns(tableName) {
    try {
        const client = await pool.connect();
        const result = await client.query(
            `SELECT column_name, data_type, is_nullable, column_default
             FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = $1
             ORDER BY ordinal_position;`,
            [tableName]
        );
        client.release();
        return result.rows;
    } catch (error) {
        console.error(`Error getting columns for ${tableName}:`, error.message);
        return [];
    }
}

async function checkSchema() {
    console.log('\n📋 Checking database schema...');
    
    const requiredTables = [
        'profiles',
        'user_agents', 
        'agent_work_logs',
        'customer_profiles',
        'conversations',
        'messages',
        'knowledge_categories',
        'knowledge_items',
        'communication_channels',
        'agent_availability',
        'canned_responses'
    ];
    
    const missingTables = [];
    const existingTables = [];
    
    for (const table of requiredTables) {
        const exists = await checkTableExists(table);
        if (exists) {
            existingTables.push(table);
            console.log(`✅ ${table}`);
        } else {
            missingTables.push(table);
            console.log(`❌ ${table} - MISSING`);
        }
    }
    
    console.log(`\n📊 Schema Summary:`);
    console.log(`   ✅ Existing tables: ${existingTables.length}`);
    console.log(`   ❌ Missing tables: ${missingTables.length}`);
    
    return { existingTables, missingTables };
}

async function checkKnowledgeCategoriesSchema() {
    console.log('\n🔍 Checking knowledge_categories table structure...');
    
    const exists = await checkTableExists('knowledge_categories');
    if (!exists) {
        console.log('❌ knowledge_categories table does not exist');
        return false;
    }
    
    const columns = await getTableColumns('knowledge_categories');
    console.log('\n📋 Current columns in knowledge_categories:');
    
    const requiredColumns = ['id', 'name', 'description', 'parent_id', 'order_index', 'icon', 'color', 'is_active', 'created_at', 'updated_at'];
    const existingColumns = columns.map(col => col.column_name);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    columns.forEach(col => {
        const required = requiredColumns.includes(col.column_name);
        const status = required ? '✅' : '❓';
        console.log(`   ${status} ${col.column_name} (${col.data_type})`);
    });
    
    if (missingColumns.length > 0) {
        console.log('\n❌ Missing columns in knowledge_categories:');
        missingColumns.forEach(col => console.log(`   - ${col}`));
        return false;
    } else {
        console.log('\n✅ knowledge_categories table has all required columns');
        return true;
    }
}

async function fixKnowledgeCategoriesTable() {
    console.log('\n🔧 Fixing knowledge_categories table...');
    
    try {
        const client = await pool.connect();
        
        // Add missing columns if they don't exist
        const alterStatements = [
            'ALTER TABLE knowledge_categories ADD COLUMN IF NOT EXISTS icon VARCHAR(100);',
            'ALTER TABLE knowledge_categories ADD COLUMN IF NOT EXISTS color VARCHAR(20);',
            'ALTER TABLE knowledge_categories ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES knowledge_categories(id);',
            'ALTER TABLE knowledge_categories ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;',
            'ALTER TABLE knowledge_categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;',
            'ALTER TABLE knowledge_categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();',
            'ALTER TABLE knowledge_categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();'
        ];
        
        for (const statement of alterStatements) {
            try {
                await client.query(statement);
                console.log(`✅ Executed: ${statement.split(' ').slice(0, 6).join(' ')}...`);
            } catch (error) {
                // Ignore errors for columns that already exist
                if (!error.message.includes('already exists')) {
                    console.error(`❌ Error: ${error.message}`);
                }
            }
        }
        
        client.release();
        console.log('\n✅ knowledge_categories table fixed!');
        return true;
    } catch (error) {
        console.error('❌ Failed to fix knowledge_categories table:', error.message);
        return false;
    }
}

async function runCompleteSetup() {
    console.log('\n🚀 Running complete database setup...');
    
    try {
        // Read the complete setup script
        const setupScript = fs.readFileSync(path.join(__dirname, 'complete-database-setup.sql'), 'utf8');
        
        const client = await pool.connect();
        await client.query(setupScript);
        client.release();
        
        console.log('✅ Complete database setup executed successfully!');
        return true;
    } catch (error) {
        console.error('❌ Failed to run complete setup:', error.message);
        return false;
    }
}

async function main() {
    console.log('🔧 ROMASHKA Database Connection & Schema Verification');
    console.log('='.repeat(60));
    
    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('your-')) {
        console.log('❌ DATABASE_URL not configured properly!');
        console.log('\n📝 Please update your .env file with:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Settings > Database');
        console.log('3. Copy the connection string');
        console.log('4. Update DATABASE_URL in .env file');
        console.log('\nExample:');
        console.log('DATABASE_URL=postgresql://postgres.abc123:[password]@aws-0-us-west-1.pooler.supabase.com:5432/postgres');
        process.exit(1);
    }
    
    // Test connection
    const connected = await testConnection();
    if (!connected) {
        process.exit(1);
    }
    
    // Check schema
    const { existingTables, missingTables } = await checkSchema();
    
    if (missingTables.length > 0) {
        console.log('\n🔧 Missing tables detected. Running complete setup...');
        const setupSuccess = await runCompleteSetup();
        if (!setupSuccess) {
            process.exit(1);
        }
        
        // Re-check schema after setup
        await checkSchema();
    }
    
    // Check knowledge_categories specifically
    const knowledgeOk = await checkKnowledgeCategoriesSchema();
    if (!knowledgeOk) {
        console.log('\n🔧 Fixing knowledge_categories table...');
        await fixKnowledgeCategoriesTable();
        
        // Re-check
        await checkKnowledgeCategoriesSchema();
    }
    
    console.log('\n🎉 Database connection and schema verification complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Run: node database-connection-test.js  (this script)');
    console.log('2. If all tests pass, run the sample data script in Supabase SQL editor');
    console.log('3. Use: simple-sample-data-fixed.sql');
    
    await pool.end();
}

// Run the main function if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error('❌ Unexpected error:', error);
        process.exit(1);
    });
}

export { testConnection, checkSchema, checkKnowledgeCategoriesSchema, fixKnowledgeCategoriesTable };
export default main;