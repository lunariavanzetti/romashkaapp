-- Final Safe Tables SQL - Handles all schema conflicts
-- This script creates all necessary tables without problematic foreign key constraints

-- Drop existing tables that might have schema conflicts
DROP TABLE IF EXISTS scan_job_logs CASCADE;
DROP TABLE IF EXISTS extracted_content CASCADE;
DROP TABLE IF EXISTS website_scan_jobs CASCADE;
DROP TABLE IF EXISTS ab_test_results CASCADE;
DROP TABLE IF EXISTS ab_tests CASCADE;
DROP TABLE IF EXISTS response_templates CASCADE;
DROP TABLE IF EXISTS personality_configs CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS website_scans CASCADE;

-- Response Templates table (no foreign keys)
CREATE TABLE response_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT, -- Use TEXT instead of UUID to avoid reference issues
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'support',
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb,
    usage_count INTEGER DEFAULT 0,
    effectiveness_score NUMERIC DEFAULT 0,
    language TEXT DEFAULT 'en',
    tags TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Personality Configurations table (no foreign keys)
CREATE TABLE personality_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT, -- Use TEXT instead of UUID to avoid reference issues
    name TEXT DEFAULT 'Default Configuration',
    description TEXT,
    traits JSONB DEFAULT '{
        "friendliness": 80,
        "professionalism": 90,
        "empathy": 85,
        "enthusiasm": 70,
        "helpfulness": 95
    }'::jsonb,
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
);

-- System Settings table (no foreign keys)
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT, -- Use TEXT instead of UUID to avoid reference issues
    white_label_enabled BOOLEAN DEFAULT false,
    custom_domain TEXT,
    custom_logo_url TEXT,
    primary_color TEXT DEFAULT '#3B82F6',
    secondary_color TEXT DEFAULT '#8B5CF6',
    company_name TEXT,
    support_email TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure one settings record per user
    UNIQUE(user_id)
);

-- A/B Testing tables (no foreign keys to auth.users)
CREATE TABLE ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT, -- Use TEXT instead of UUID to avoid reference issues
    name TEXT NOT NULL,
    description TEXT,
    variant_a_config JSONB NOT NULL,
    variant_b_config JSONB NOT NULL,
    traffic_split NUMERIC DEFAULT 0.5, -- 0.5 = 50/50 split
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'completed', 'paused')),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    target_sample_size INTEGER DEFAULT 100,
    confidence_level NUMERIC DEFAULT 0.95,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- A/B Test Results table (only references ab_tests, not auth.users)
CREATE TABLE ab_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID REFERENCES ab_tests(id) ON DELETE CASCADE,
    conversation_id TEXT, -- Use TEXT instead of UUID
    variant TEXT NOT NULL CHECK (variant IN ('A', 'B')),
    response_time_ms INTEGER,
    satisfaction_score NUMERIC CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
    escalated BOOLEAN DEFAULT false,
    converted BOOLEAN DEFAULT false,
    session_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Website Scan Jobs table (no foreign keys)
CREATE TABLE website_scan_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT, -- Use TEXT instead of UUID to avoid reference issues
    urls TEXT[] NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scanning', 'completed', 'failed')),
    scan_settings JSONB DEFAULT '{}'::jsonb,
    pages_found INTEGER DEFAULT 0,
    pages_processed INTEGER DEFAULT 0,
    progress_percentage INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Extracted Content table (references website_scan_jobs)
CREATE TABLE extracted_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_job_id UUID REFERENCES website_scan_jobs(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    content TEXT,
    content_type TEXT,
    headings JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    word_count INTEGER DEFAULT 0,
    processing_quality NUMERIC DEFAULT 0,
    extracted_entities JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Scan Job Logs table (references website_scan_jobs)
CREATE TABLE scan_job_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_job_id UUID REFERENCES website_scan_jobs(id) ON DELETE CASCADE,
    log_level TEXT NOT NULL CHECK (log_level IN ('info', 'warning', 'error')),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Legacy Website Scans table (keep for compatibility)
CREATE TABLE website_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT, -- Use TEXT instead of UUID to avoid reference issues
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
);

-- Create indexes for better performance
CREATE INDEX idx_response_templates_user_id ON response_templates(user_id);
CREATE INDEX idx_response_templates_category ON response_templates(category);
CREATE INDEX idx_personality_configs_user_id ON personality_configs(user_id);
CREATE INDEX idx_system_settings_user_id ON system_settings(user_id);
CREATE INDEX idx_ab_tests_user_id ON ab_tests(user_id);
CREATE INDEX idx_ab_tests_status ON ab_tests(status);
CREATE INDEX idx_ab_test_results_test_id ON ab_test_results(test_id);
CREATE INDEX idx_ab_test_results_variant ON ab_test_results(variant);
CREATE INDEX idx_website_scan_jobs_user_id ON website_scan_jobs(user_id);
CREATE INDEX idx_website_scan_jobs_status ON website_scan_jobs(status);
CREATE INDEX idx_extracted_content_scan_job_id ON extracted_content(scan_job_id);
CREATE INDEX idx_extracted_content_content_type ON extracted_content(content_type);
CREATE INDEX idx_scan_job_logs_scan_job_id ON scan_job_logs(scan_job_id);
CREATE INDEX idx_scan_job_logs_log_level ON scan_job_logs(log_level);
CREATE INDEX idx_website_scans_user_id ON website_scans(user_id);
CREATE INDEX idx_website_scans_status ON website_scans(status);

-- Enable RLS (Row Level Security)
ALTER TABLE response_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE personality_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_scan_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_job_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_scans ENABLE ROW LEVEL SECURITY;

-- Simple RLS Policies (allow all for now, can be restricted later)
DROP POLICY IF EXISTS "Allow all operations on response_templates" ON response_templates;
CREATE POLICY "Allow all operations on response_templates" ON response_templates FOR ALL TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Allow all operations on personality_configs" ON personality_configs;
CREATE POLICY "Allow all operations on personality_configs" ON personality_configs FOR ALL TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Allow all operations on system_settings" ON system_settings;
CREATE POLICY "Allow all operations on system_settings" ON system_settings FOR ALL TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Allow all operations on ab_tests" ON ab_tests;
CREATE POLICY "Allow all operations on ab_tests" ON ab_tests FOR ALL TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Allow all operations on ab_test_results" ON ab_test_results;
CREATE POLICY "Allow all operations on ab_test_results" ON ab_test_results FOR ALL TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Allow all operations on website_scan_jobs" ON website_scan_jobs;
CREATE POLICY "Allow all operations on website_scan_jobs" ON website_scan_jobs FOR ALL TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Allow all operations on extracted_content" ON extracted_content;
CREATE POLICY "Allow all operations on extracted_content" ON extracted_content FOR ALL TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Allow all operations on scan_job_logs" ON scan_job_logs;
CREATE POLICY "Allow all operations on scan_job_logs" ON scan_job_logs FOR ALL TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Allow all operations on website_scans" ON website_scans;
CREATE POLICY "Allow all operations on website_scans" ON website_scans FOR ALL TO authenticated, anon USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_response_templates_updated_at ON response_templates;
CREATE TRIGGER update_response_templates_updated_at
    BEFORE UPDATE ON response_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_personality_configs_updated_at ON personality_configs;
CREATE TRIGGER update_personality_configs_updated_at
    BEFORE UPDATE ON personality_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ab_tests_updated_at ON ab_tests;
CREATE TRIGGER update_ab_tests_updated_at
    BEFORE UPDATE ON ab_tests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Insert sample A/B test data
INSERT INTO ab_tests (name, description, variant_a_config, variant_b_config, status) VALUES 
(
    'Personality Tone Test',
    'Test different personality configurations to optimize performance',
    '{"traits": {"friendliness": 60, "professionalism": 90}, "tone": "formal", "greeting": "How may I assist you today?"}',
    '{"traits": {"friendliness": 95, "professionalism": 70}, "tone": "friendly", "greeting": "Hey! I''d love to help you out 😊"}',
    'running'
) ON CONFLICT DO NOTHING;

-- Insert sample personality config
INSERT INTO personality_configs (name, description, user_id) VALUES 
(
    'Default Assistant',
    'Balanced personality configuration for general support',
    'demo-user'
) ON CONFLICT DO NOTHING;

-- Insert sample response template
INSERT INTO response_templates (name, content, category, user_id) VALUES 
(
    'Welcome Message',
    'Hello! Welcome to our support system. How can I help you today?',
    'greeting',
    'demo-user'
) ON CONFLICT DO NOTHING;