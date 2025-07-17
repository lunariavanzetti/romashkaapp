#!/usr/bin/env node

/**
 * Quick Database Schema Check
 * This script will help us understand the current database structure
 */

import pg from 'pg';
import fs from 'fs';

const { Pool } = pg;

async function quickSchemaCheck() {
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL not found in environment');
        console.log('Please set DATABASE_URL or run: node --env-file=.env quick_schema_check.js');
        return;
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        const client = await pool.connect();
        console.log('✅ Connected to database successfully\n');

        // 1. List all tables
        console.log('📋 CURRENT TABLES:');
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        
        const tables = tablesResult.rows.map(row => row.table_name);
        console.log(tables.join(', '));
        console.log(`\nTotal tables: ${tables.length}\n`);

        // 2. Check key messaging tables
        const messagingTables = ['conversations', 'messages', 'customer_profiles', 'profiles'];
        
        for (const tableName of messagingTables) {
            if (tables.includes(tableName)) {
                console.log(`🔍 ${tableName.toUpperCase()} TABLE STRUCTURE:`);
                const columnsResult = await client.query(`
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns
                    WHERE table_name = $1 AND table_schema = 'public'
                    ORDER BY ordinal_position
                `, [tableName]);
                
                columnsResult.rows.forEach(col => {
                    console.log(`  - ${col.column_name} (${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''})`);
                });
                console.log();
            } else {
                console.log(`❌ ${tableName} table NOT FOUND\n`);
            }
        }

        // 3. Check if realtime_metrics table exists
        console.log('🔍 REALTIME_METRICS TABLE:');
        if (tables.includes('realtime_metrics')) {
            const metricsResult = await client.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'realtime_metrics' AND table_schema = 'public'
                ORDER BY ordinal_position
            `);
            
            metricsResult.rows.forEach(col => {
                console.log(`  - ${col.column_name} (${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''})`);
            });
        } else {
            console.log('❌ realtime_metrics table NOT FOUND');
        }

        // 4. Check for any missing columns in key tables
        console.log('\n🔍 CHECKING KEY COLUMNS:');
        
        // Check conversations table
        if (tables.includes('conversations')) {
            const convResult = await client.query(`
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'conversations' AND table_schema = 'public'
            `);
            const convColumns = convResult.rows.map(row => row.column_name);
            
            const requiredConvColumns = ['id', 'customer_id', 'assigned_agent_id', 'status', 'priority', 'channel_type', 'last_message', 'last_message_at', 'message_count'];
            const missingConvColumns = requiredConvColumns.filter(col => !convColumns.includes(col));
            
            if (missingConvColumns.length > 0) {
                console.log(`❌ Missing conversations columns: ${missingConvColumns.join(', ')}`);
            } else {
                console.log('✅ conversations table has all required columns');
            }
        }

        // Check messages table
        if (tables.includes('messages')) {
            const msgResult = await client.query(`
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'messages' AND table_schema = 'public'
            `);
            const msgColumns = msgResult.rows.map(row => row.column_name);
            
            const requiredMsgColumns = ['id', 'conversation_id', 'sender_type', 'content', 'channel_type', 'created_at', 'delivery_status'];
            const missingMsgColumns = requiredMsgColumns.filter(col => !msgColumns.includes(col));
            
            if (missingMsgColumns.length > 0) {
                console.log(`❌ Missing messages columns: ${missingMsgColumns.join(', ')}`);
            } else {
                console.log('✅ messages table has all required columns');
            }
        }

        client.release();
        console.log('\n📊 Schema check completed!');
        
    } catch (error) {
        console.error('❌ Error checking schema:', error.message);
    } finally {
        await pool.end();
    }
}

// Export the schema info to a file
async function exportSchemaInfo() {
    const schemaInfo = {
        timestamp: new Date().toISOString(),
        tables: [],
        issues: []
    };

    // Save to file for reference
    fs.writeFileSync('current_schema_info.json', JSON.stringify(schemaInfo, null, 2));
    console.log('💾 Schema info saved to current_schema_info.json');
}

// Run the check
quickSchemaCheck().catch(console.error);