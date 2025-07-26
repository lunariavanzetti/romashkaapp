/**
 * Apply database migration for chat widget functionality
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Applying Chat Widget Database Migration\n');

  try {
    // Read the migration file
    const migrationSQL = readFileSync('./sql/complete_chat_schema_fix.sql', 'utf8');
    
    console.log('📄 Migration SQL loaded, applying...');
    
    // Split into individual statements (rough approach)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`🔧 Executing ${statements.length} SQL statements...\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.length < 10) continue; // Skip very short statements
      
      try {
        const { error } = await supabase.rpc('execute_sql', { sql: statement + ';' });
        
        if (error) {
          console.log(`❌ Statement ${i + 1} failed: ${error.message}`);
          console.log(`   SQL: ${statement.substring(0, 100)}...`);
          errorCount++;
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
          successCount++;
        }
      } catch (err) {
        console.log(`❌ Statement ${i + 1} error: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with some errors. Check the logs above.');
    }
    
    // Test the migration by trying to create a conversation
    console.log('\n🧪 Testing migration...');
    
    const testId = crypto.randomUUID();
    const { data: testConv, error: testError } = await supabase
      .from('conversations')
      .insert([{
        id: testId,
        workflow_id: 'default-workflow',
        status: 'active',
        metadata: { test: true }
      }])
      .select()
      .single();
      
    if (testError) {
      console.log('❌ Test conversation creation failed:', testError.message);
    } else {
      console.log('✅ Test conversation created successfully');
      
      // Clean up test data
      await supabase
        .from('conversations')
        .delete()
        .eq('id', testId);
      console.log('✅ Test data cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

applyMigration().catch(console.error);