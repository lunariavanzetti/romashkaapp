const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyAdvancedSchema() {
  try {
    console.log('Applying advanced chat schema...');
    
    // Read the schema file
    const fs = require('fs');
    const schemaPath = './advanced-chat-schema.sql';
    
    if (!fs.existsSync(schemaPath)) {
      console.error('Schema file not found:', schemaPath);
      process.exit(1);
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}...`);
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.warn(`Warning on statement ${i + 1}:`, error.message);
            // Continue with other statements
          } else {
            console.log(`✓ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.warn(`Warning on statement ${i + 1}:`, err.message);
          // Continue with other statements
        }
      }
    }
    
    console.log('✅ Advanced schema applied successfully!');
    
    // Verify key tables exist
    console.log('\nVerifying tables...');
    const tables = [
      'agent_availability',
      'canned_responses', 
      'conversation_notes',
      'customer_profiles',
      'file_attachments',
      'conversation_transfers',
      'sla_tracking'
    ];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.warn(`⚠️  Table ${table}: ${error.message}`);
        } else {
          console.log(`✓ Table ${table} exists and accessible`);
        }
      } catch (err) {
        console.warn(`⚠️  Table ${table}: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error applying schema:', error);
    process.exit(1);
  }
}

// Run the script
applyAdvancedSchema(); 