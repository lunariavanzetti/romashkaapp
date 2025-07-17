#!/usr/bin/env node

/**
 * Check current database schema
 * This script checks what tables actually exist in your live database
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

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

async function checkDatabaseSchema() {
    try {
        // Get Supabase credentials from environment
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            log('❌ Missing Supabase credentials in environment variables', 'red');
            log('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set', 'yellow');
            return;
        }

        log('🔍 Checking database schema...', 'cyan');
        
        // Create Supabase client
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. List all tables
        log('\n📋 1. All tables in database:', 'blue');
        const { data: tables, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .order('table_name');

        if (tablesError) {
            log(`❌ Error fetching tables: ${tablesError.message}`, 'red');
        } else {
            tables.forEach(table => {
                log(`  ✓ ${table.table_name}`, 'green');
            });
        }

        // 2. Check enterprise feature tables
        const enterpriseTables = [
            // Training tables
            'ai_training_data',
            'training_sessions', 
            'training_metrics_history',
            'training_conversations',
            'training_files',
            'knowledge_gaps',
            'learning_insights',
            
            // Template tables
            'templates',
            'template_categories',
            'template_variables',
            'response_templates',
            'message_templates',
            'ai_training_sessions',
            'training_samples',
            
            // Channel tables
            'communication_channels',
            'channels',
            'channel_configs',
            'whatsapp_channels',
            'whatsapp_message_templates',
            
            // Core tables
            'profiles',
            'customer_profiles',
            'conversations',
            'messages',
            'agents',
            'user_agents',
            'knowledge_items',
            'knowledge_categories'
        ];

        log('\n🏢 2. Enterprise feature tables status:', 'blue');
        
        const existingTables = tables ? tables.map(t => t.table_name) : [];
        
        const categorizedTables = {
            'Training System': ['ai_training_data', 'training_sessions', 'training_metrics_history', 'training_conversations', 'training_files', 'knowledge_gaps', 'learning_insights'],
            'Template System': ['templates', 'template_categories', 'template_variables', 'response_templates', 'message_templates', 'ai_training_sessions', 'training_samples'],
            'Channel System': ['communication_channels', 'channels', 'channel_configs', 'whatsapp_channels', 'whatsapp_message_templates'],
            'Core System': ['profiles', 'customer_profiles', 'conversations', 'messages', 'agents', 'user_agents', 'knowledge_items', 'knowledge_categories']
        };

        for (const [category, categoryTables] of Object.entries(categorizedTables)) {
            log(`\n  ${category}:`, 'magenta');
            categoryTables.forEach(tableName => {
                const exists = existingTables.includes(tableName);
                const status = exists ? '✓' : '✗';
                const color = exists ? 'green' : 'red';
                log(`    ${status} ${tableName}`, color);
            });
        }

        // 3. Check specific table structures if they exist
        const keyTables = ['templates', 'ai_training_data', 'training_sessions', 'conversations'];
        
        for (const tableName of keyTables) {
            if (existingTables.includes(tableName)) {
                log(`\n📊 3. Structure of ${tableName}:`, 'blue');
                
                // Query table structure
                const { data: columns, error: columnsError } = await supabase
                    .rpc('get_table_columns', { table_name: tableName });

                if (columnsError) {
                    log(`  ❌ Error getting columns: ${columnsError.message}`, 'red');
                } else {
                    log(`  Columns: ${columns ? columns.length : 0}`, 'yellow');
                }

                // Get row count
                const { count, error: countError } = await supabase
                    .from(tableName)
                    .select('*', { count: 'exact', head: true });

                if (countError) {
                    log(`  ❌ Error getting count: ${countError.message}`, 'red');
                } else {
                    log(`  Rows: ${count || 0}`, 'yellow');
                }
            }
        }

        // 4. Summary
        log('\n📈 4. Summary:', 'blue');
        const totalTables = existingTables.length;
        const enterpriseTablesExist = enterpriseTables.filter(t => existingTables.includes(t)).length;
        const missingTables = enterpriseTables.filter(t => !existingTables.includes(t));
        
        log(`  Total tables: ${totalTables}`, 'white');
        log(`  Enterprise tables found: ${enterpriseTablesExist}/${enterpriseTables.length}`, 'white');
        
        if (missingTables.length > 0) {
            log(`  Missing tables: ${missingTables.join(', ')}`, 'yellow');
        }

        // 5. Write results to file
        const results = {
            timestamp: new Date().toISOString(),
            totalTables,
            allTables: existingTables,
            enterpriseTablesStatus: enterpriseTables.map(t => ({
                name: t,
                exists: existingTables.includes(t)
            })),
            missingTables
        };

        fs.writeFileSync(
            path.join(process.cwd(), 'database-schema-check-results.json'), 
            JSON.stringify(results, null, 2)
        );

        log('\n💾 Results saved to database-schema-check-results.json', 'green');

    } catch (error) {
        log(`❌ Fatal error: ${error.message}`, 'red');
    }
}

// Run the check
checkDatabaseSchema();