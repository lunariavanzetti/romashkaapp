// Script to apply database schema to Supabase
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read environment variables
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = envVars.VITE_SERVICE_ROLE_KEY;

console.log('🔧 Applying Database Schema to Supabase');
console.log('=======================================');

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, serviceRoleKey || supabaseAnonKey);

async function applySchema() {
  try {
    console.log('📋 Reading schema file...');
    const schemaPath = path.join(process.cwd(), 'setup-supabase.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('🔗 Connecting to Supabase...');
    
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`\n⚡ Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            // Some errors are expected (like table already exists)
            if (error.message.includes('already exists') || 
                error.message.includes('duplicate key') ||
                error.message.includes('already enabled')) {
              console.log(`⚠️  Statement ${i + 1}: ${error.message}`);
            } else {
              console.log(`❌ Statement ${i + 1} failed: ${error.message}`);
            }
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.log(`⚠️  Statement ${i + 1}: ${err.message}`);
        }
      }
    }
    
    console.log('\n🎉 Schema application completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Restart your development server');
    console.log('2. Check the conversations page - it should now work');
    console.log('3. If you still see errors, check the Supabase dashboard logs');
    
  } catch (error) {
    console.log('❌ Error applying schema:', error.message);
    console.log('\n💡 Manual Setup Instructions:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to the SQL Editor');
    console.log('3. Copy and paste the contents of setup-supabase.sql');
    console.log('4. Click "Run" to execute the schema');
  }
}

// Alternative: Use the REST API to execute SQL
async function applySchemaViaREST() {
  try {
    console.log('📋 Reading schema file...');
    const schemaPath = path.join(process.cwd(), 'setup-supabase.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('🔗 Applying schema via REST API...');
    
    // Use the REST API to execute the schema
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey || supabaseAnonKey}`,
        'apikey': serviceRoleKey || supabaseAnonKey
      },
      body: JSON.stringify({ sql: schema })
    });
    
    if (response.ok) {
      console.log('✅ Schema applied successfully!');
    } else {
      const error = await response.text();
      console.log('❌ Failed to apply schema:', error);
      throw new Error(error);
    }
    
  } catch (error) {
    console.log('❌ Error applying schema:', error.message);
    console.log('\n💡 Manual Setup Instructions:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to the SQL Editor');
    console.log('3. Copy and paste the contents of setup-supabase.sql');
    console.log('4. Click "Run" to execute the schema');
  }
}

// Try the REST API approach first, fallback to manual instructions
applySchemaViaREST().catch(() => {
  console.log('\n🔄 Trying alternative approach...');
  applySchema();
}); 