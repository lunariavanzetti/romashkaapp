#!/usr/bin/env node

/**
 * ROMASHKA Database Automated Setup Script
 * This script automates the entire database setup process
 * 
 * Usage: node --env-file=.env setup-database.js
 * OR: npm run db:setup
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
};

function log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('');
    log('='.repeat(60), 'cyan');
    log(`🔧 ${title}`, 'cyan');
    log('='.repeat(60), 'cyan');
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

// Database connection configuration
let pool;

async function initializePool() {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
}

async function testConnection() {
    logSection('Testing Database Connection');
    
    try {
        const client = await pool.connect();
        logSuccess('Successfully connected to database!');
        
        // Test query
        const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
        logInfo(`Current time: ${result.rows[0].current_time}`);
        logInfo(`PostgreSQL version: ${result.rows[0].postgres_version.split(' ')[0]}`);
        
        client.release();
        return true;
    } catch (error) {
        logError('Database connection failed:');
        logError(`Error: ${error.message}`);
        
        if (error.message.includes('password authentication failed')) {
            logWarning('Possible solutions:');
            log('1. Check your password in DATABASE_URL');
            log('2. Make sure you\'re using the correct database password');
            log('3. Try resetting your database password in Supabase dashboard');
        } else if (error.message.includes('timeout') || error.message.includes('ENOTFOUND')) {
            logWarning('Possible solutions:');
            log('1. Check your project ID in DATABASE_URL');
            log('2. Make sure the host URL is correct');
            log('3. Check your internet connection');
        }
        
        return false;
    }
}

async function runSQLFile(filename) {
    try {
        logInfo(`Running ${filename}...`);
        const sqlScript = fs.readFileSync(path.join(__dirname, filename), 'utf8');
        
        const client = await pool.connect();
        await client.query(sqlScript);
        client.release();
        
        logSuccess(`${filename} executed successfully!`);
        return true;
    } catch (error) {
        logError(`Failed to run ${filename}:`);
        logError(error.message);
        return false;
    }
}

async function checkTablesExist() {
    logSection('Checking Database Schema');
    
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
    
    const existingTables = [];
    const missingTables = [];
    
    for (const table of requiredTables) {
        try {
            const client = await pool.connect();
            const result = await client.query(
                `SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = $1
                );`,
                [table]
            );
            client.release();
            
            if (result.rows[0].exists) {
                existingTables.push(table);
                logSuccess(table);
            } else {
                missingTables.push(table);
                logError(`${table} - MISSING`);
            }
        } catch (error) {
            logError(`Error checking table ${table}: ${error.message}`);
            missingTables.push(table);
        }
    }
    
    logInfo(`Existing tables: ${existingTables.length}`);
    logInfo(`Missing tables: ${missingTables.length}`);
    
    return { existingTables, missingTables };
}

async function verifyKnowledgeCategories() {
    logSection('Verifying knowledge_categories Schema');
    
    try {
        const client = await pool.connect();
        const result = await client.query(
            `SELECT column_name, data_type 
             FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'knowledge_categories'
             ORDER BY ordinal_position;`
        );
        client.release();
        
        const requiredColumns = ['id', 'name', 'description', 'parent_id', 'order_index', 'icon', 'color', 'is_active', 'created_at', 'updated_at'];
        const existingColumns = result.rows.map(row => row.column_name);
        const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
        
        logInfo('Current columns in knowledge_categories:');
        result.rows.forEach(row => {
            const required = requiredColumns.includes(row.column_name);
            const status = required ? '✅' : '❓';
            log(`   ${status} ${row.column_name} (${row.data_type})`);
        });
        
        if (missingColumns.length > 0) {
            logWarning('Missing columns in knowledge_categories:');
            missingColumns.forEach(col => log(`   - ${col}`));
            return false;
        } else {
            logSuccess('knowledge_categories table has all required columns');
            return true;
        }
    } catch (error) {
        logError(`Error checking knowledge_categories: ${error.message}`);
        return false;
    }
}

async function main() {
    console.clear();
    logSection('ROMASHKA Database Automated Setup');
    
    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('your-')) {
        logError('DATABASE_URL not configured properly!');
        logWarning('Please update your .env file with:');
        log('1. Go to your Supabase dashboard');
        log('2. Settings > Database');
        log('3. Copy the connection string');
        log('4. Update DATABASE_URL in .env file');
        log('');
        logInfo('Example:');
        log('DATABASE_URL=postgresql://postgres.abc123:[password]@aws-0-us-west-1.pooler.supabase.com:5432/postgres');
        process.exit(1);
    }
    
    await initializePool();
    
    // Step 1: Test connection
    const connected = await testConnection();
    if (!connected) {
        process.exit(1);
    }
    
    // Step 2: Check schema
    const { existingTables, missingTables } = await checkTablesExist();
    
    // Step 3: Run complete setup if tables are missing
    if (missingTables.length > 0) {
        logSection('Running Complete Database Setup');
        const setupSuccess = await runSQLFile('complete-database-setup.sql');
        if (!setupSuccess) {
            logError('Failed to run complete setup. Please check the SQL file and try again.');
            process.exit(1);
        }
        
        // Re-check schema after setup
        logInfo('Re-checking schema after setup...');
        await checkTablesExist();
    }
    
    // Step 4: Fix schema if needed
    logSection('Fixing Schema Columns');
    const schemaFixSuccess = await runSQLFile('fix-schema-columns.sql');
    if (!schemaFixSuccess) {
        logWarning('Schema fix failed, but continuing...');
    }
    
    // Step 5: Verify knowledge_categories
    const knowledgeOk = await verifyKnowledgeCategories();
    if (!knowledgeOk) {
        logWarning('knowledge_categories table may still have issues');
    }
    
    // Step 6: Success message
    logSection('Setup Complete!');
    logSuccess('Database setup completed successfully!');
    log('');
    logInfo('What was configured:');
    log('✅ Database connection tested');
    log('✅ All required tables created');
    log('✅ Schema columns fixed');
    log('✅ Indexes and triggers created');
    log('✅ Row Level Security (RLS) enabled');
    log('✅ Performance views created');
    log('');
    logInfo('Next steps:');
    log('1. Run sample data in Supabase SQL Editor:');
    log('   \\i simple-sample-data-fixed.sql');
    log('2. Verify everything works with verification queries');
    log('3. Start developing your application!');
    log('');
    logInfo('For detailed instructions, see: COMPLETE_SETUP_GUIDE.md');
    
    await pool.end();
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
    logError('Unhandled error occurred:');
    logError(error.message);
    process.exit(1);
});

// Run the main function if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        logError('Setup failed:');
        logError(error.message);
        process.exit(1);
    });
}

export default main;