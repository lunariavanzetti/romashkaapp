#!/usr/bin/env node

// Script to create missing tables via Supabase client
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dbieawxwlbwakkuvaihh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiaWVhd3h3bGJ3YWtrdXZhaWhoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTE1MDkzMCwiZXhwIjoyMDY2NzI2OTMwfQ.YCO_lxeAsu21MVc5tVHmeIIlalGho_jPuKKOcybSZFQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
  console.log('🛠️ Creating missing tables...');
  
  // Define table creation SQL (safer individual statements)
  const statements = [
    // Personality configs table
    `CREATE TABLE IF NOT EXISTS personality_configs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT,
      name TEXT DEFAULT 'Default Configuration',
      description TEXT,
      traits JSONB DEFAULT '{"friendliness": 80, "professionalism": 90, "empathy": 85, "enthusiasm": 70, "helpfulness": 95}'::jsonb,
      tone TEXT DEFAULT 'friendly',
      style TEXT DEFAULT 'conversational',
      language TEXT DEFAULT 'en',
      response_length TEXT DEFAULT 'medium',
      personality TEXT DEFAULT 'You are a helpful, friendly AI assistant.',
      custom_instructions TEXT DEFAULT '',
      greeting TEXT DEFAULT 'Hello! How can I help you today?',
      fallback TEXT DEFAULT 'I apologize, but I need more information to help you.',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    )`,
    
    // A/B tests table
    `CREATE TABLE IF NOT EXISTS ab_tests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT,
      name TEXT NOT NULL,
      description TEXT,
      variant_a_config JSONB NOT NULL,
      variant_b_config JSONB NOT NULL,
      traffic_split NUMERIC DEFAULT 0.5,
      status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'completed', 'paused')),
      start_date TIMESTAMP WITH TIME ZONE,
      end_date TIMESTAMP WITH TIME ZONE,
      target_sample_size INTEGER DEFAULT 100,
      confidence_level NUMERIC DEFAULT 0.95,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    )`,
    
    // A/B test results table
    `CREATE TABLE IF NOT EXISTS ab_test_results (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      test_id UUID REFERENCES ab_tests(id) ON DELETE CASCADE,
      conversation_id TEXT,
      variant TEXT NOT NULL CHECK (variant IN ('A', 'B')),
      response_time_ms INTEGER,
      satisfaction_score NUMERIC CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
      escalated BOOLEAN DEFAULT false,
      converted BOOLEAN DEFAULT false,
      session_data JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    )`,
    
    // Website scans table  
    `CREATE TABLE IF NOT EXISTS website_scans (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT,
      urls TEXT[] NOT NULL,
      max_depth INTEGER DEFAULT 3,
      max_pages INTEGER DEFAULT 50,
      respect_robots BOOLEAN DEFAULT true,
      include_images BOOLEAN DEFAULT false,
      content_types TEXT[] DEFAULT '{}',
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
      progress INTEGER DEFAULT 0,
      total_pages INTEGER DEFAULT 0,
      extracted_content JSONB DEFAULT '{}'::jsonb,
      error_message TEXT,
      started_at TIMESTAMP WITH TIME ZONE,
      completed_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    )`
  ];
  
  // Enable RLS and policies
  const rlsStatements = [
    'ALTER TABLE personality_configs ENABLE ROW LEVEL SECURITY',
    'ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY', 
    'ALTER TABLE ab_test_results ENABLE ROW LEVEL SECURITY',
    'ALTER TABLE website_scans ENABLE ROW LEVEL SECURITY',
    
    'DROP POLICY IF EXISTS "Allow all operations on personality_configs" ON personality_configs',
    'CREATE POLICY "Allow all operations on personality_configs" ON personality_configs FOR ALL TO authenticated, anon USING (true)',
    
    'DROP POLICY IF EXISTS "Allow all operations on ab_tests" ON ab_tests',
    'CREATE POLICY "Allow all operations on ab_tests" ON ab_tests FOR ALL TO authenticated, anon USING (true)',
    
    'DROP POLICY IF EXISTS "Allow all operations on ab_test_results" ON ab_test_results', 
    'CREATE POLICY "Allow all operations on ab_test_results" ON ab_test_results FOR ALL TO authenticated, anon USING (true)',
    
    'DROP POLICY IF EXISTS "Allow all operations on website_scans" ON website_scans',
    'CREATE POLICY "Allow all operations on website_scans" ON website_scans FOR ALL TO authenticated, anon USING (true)'
  ];
  
  // Execute table creation
  for (const [index, statement] of statements.entries()) {
    try {
      console.log(`Creating table ${index + 1}/${statements.length}...`);
      const { error } = await supabase.rpc('exec', { sql: statement });
      if (error) {
        console.log(`❌ Table creation error: ${error.message}`);
      } else {
        console.log(`✅ Table ${index + 1} created successfully`);
      }
    } catch (err) {
      console.log(`❌ Table ${index + 1} error: ${err.message}`);
    }
  }
  
  // Execute RLS statements
  for (const [index, statement] of rlsStatements.entries()) {
    try {
      const { error } = await supabase.rpc('exec', { sql: statement });
      if (error) {
        console.log(`⚠️ RLS statement ${index + 1} error: ${error.message}`);
      } else {
        console.log(`✅ RLS statement ${index + 1} executed`);
      }
    } catch (err) {
      console.log(`⚠️ RLS statement ${index + 1} error: ${err.message}`);
    }
  }
  
  console.log('🏁 Table creation completed');
}

createTables().catch(console.error);