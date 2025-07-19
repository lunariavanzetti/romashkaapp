-- Website Scanner Database Tables
-- Run this script in your Supabase SQL editor to add the missing tables

-- Drop existing tables that might have schema conflicts
DROP TABLE IF EXISTS scan_job_logs CASCADE;
DROP TABLE IF EXISTS extracted_content CASCADE;
DROP TABLE IF EXISTS website_scan_jobs CASCADE;

-- Website Scan Jobs table (no foreign keys to avoid auth.users conflicts)
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

-- Create indexes for better performance
CREATE INDEX idx_website_scan_jobs_user_id ON website_scan_jobs(user_id);
CREATE INDEX idx_website_scan_jobs_status ON website_scan_jobs(status);
CREATE INDEX idx_extracted_content_scan_job_id ON extracted_content(scan_job_id);
CREATE INDEX idx_extracted_content_content_type ON extracted_content(content_type);
CREATE INDEX idx_scan_job_logs_scan_job_id ON scan_job_logs(scan_job_id);
CREATE INDEX idx_scan_job_logs_log_level ON scan_job_logs(log_level);

-- Enable RLS (Row Level Security)
ALTER TABLE website_scan_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_job_logs ENABLE ROW LEVEL SECURITY;

-- Simple RLS Policies (allow all for now, can be restricted later)
DROP POLICY IF EXISTS "Allow all operations on website_scan_jobs" ON website_scan_jobs;
CREATE POLICY "Allow all operations on website_scan_jobs" ON website_scan_jobs FOR ALL TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Allow all operations on extracted_content" ON extracted_content;
CREATE POLICY "Allow all operations on extracted_content" ON extracted_content FOR ALL TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Allow all operations on scan_job_logs" ON scan_job_logs;
CREATE POLICY "Allow all operations on scan_job_logs" ON scan_job_logs FOR ALL TO authenticated, anon USING (true);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;