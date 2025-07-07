-- Website URL Scanning & Knowledge Extraction System Database Schema
-- This schema supports automatic website content extraction and knowledge generation

-- Create website scan jobs table
CREATE TABLE website_scan_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  project_id UUID,
  urls TEXT[] NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'scanning', 'processing', 'completed', 'failed'
  progress_percentage INTEGER DEFAULT 0,
  pages_found INTEGER DEFAULT 0,
  pages_processed INTEGER DEFAULT 0,
  scan_settings JSONB DEFAULT '{"maxDepth": 2, "respectRobots": true, "maxPages": 50}',
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create extracted content table
CREATE TABLE extracted_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_job_id UUID REFERENCES website_scan_jobs(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title VARCHAR(500),
  content TEXT NOT NULL,
  content_type VARCHAR(100), -- 'pricing', 'faq', 'about', 'product', 'policy', 'general'
  headings JSONB,
  metadata JSONB,
  word_count INTEGER,
  processing_quality DECIMAL(3,2),
  extracted_entities JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create auto-generated knowledge table (without foreign key to knowledge_items for now)
CREATE TABLE auto_generated_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_job_id UUID REFERENCES website_scan_jobs(id) ON DELETE CASCADE,
  extracted_content_id UUID REFERENCES extracted_content(id) ON DELETE CASCADE,
  knowledge_item_id UUID, -- Will be set when knowledge_items table exists
  auto_category VARCHAR(255),
  confidence_score DECIMAL(3,2),
  needs_review BOOLEAN DEFAULT true,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create scan job logs table for debugging
CREATE TABLE scan_job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_job_id UUID REFERENCES website_scan_jobs(id) ON DELETE CASCADE,
  log_level VARCHAR(20) NOT NULL, -- 'info', 'warning', 'error'
  message TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create content processing queue table
CREATE TABLE content_processing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extracted_content_id UUID REFERENCES extracted_content(id) ON DELETE CASCADE,
  processing_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  processing_attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  scheduled_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE website_scan_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_generated_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_job_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_processing_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for website_scan_jobs
CREATE POLICY "Users can view their own scan jobs" ON website_scan_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scan jobs" ON website_scan_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scan jobs" ON website_scan_jobs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scan jobs" ON website_scan_jobs
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for extracted_content
CREATE POLICY "Users can view content from their scan jobs" ON extracted_content
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM website_scan_jobs 
      WHERE website_scan_jobs.id = extracted_content.scan_job_id 
      AND website_scan_jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert content for their scan jobs" ON extracted_content
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM website_scan_jobs 
      WHERE website_scan_jobs.id = extracted_content.scan_job_id 
      AND website_scan_jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update content from their scan jobs" ON extracted_content
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM website_scan_jobs 
      WHERE website_scan_jobs.id = extracted_content.scan_job_id 
      AND website_scan_jobs.user_id = auth.uid()
    )
  );

-- RLS Policies for auto_generated_knowledge
CREATE POLICY "Users can view auto-generated knowledge from their scan jobs" ON auto_generated_knowledge
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM website_scan_jobs 
      WHERE website_scan_jobs.id = auto_generated_knowledge.scan_job_id 
      AND website_scan_jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage auto-generated knowledge from their scan jobs" ON auto_generated_knowledge
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM website_scan_jobs 
      WHERE website_scan_jobs.id = auto_generated_knowledge.scan_job_id 
      AND website_scan_jobs.user_id = auth.uid()
    )
  );

-- RLS Policies for scan_job_logs
CREATE POLICY "Users can view logs from their scan jobs" ON scan_job_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM website_scan_jobs 
      WHERE website_scan_jobs.id = scan_job_logs.scan_job_id 
      AND website_scan_jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert logs for their scan jobs" ON scan_job_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM website_scan_jobs 
      WHERE website_scan_jobs.id = scan_job_logs.scan_job_id 
      AND website_scan_jobs.user_id = auth.uid()
    )
  );

-- RLS Policies for content_processing_queue
CREATE POLICY "Users can view processing queue for their content" ON content_processing_queue
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM extracted_content ec
      JOIN website_scan_jobs wsj ON ec.scan_job_id = wsj.id
      WHERE ec.id = content_processing_queue.extracted_content_id 
      AND wsj.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage processing queue for their content" ON content_processing_queue
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM extracted_content ec
      JOIN website_scan_jobs wsj ON ec.scan_job_id = wsj.id
      WHERE ec.id = content_processing_queue.extracted_content_id 
      AND wsj.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_website_scan_jobs_user_id ON website_scan_jobs(user_id);
CREATE INDEX idx_website_scan_jobs_status ON website_scan_jobs(status);
CREATE INDEX idx_extracted_content_scan_job_id ON extracted_content(scan_job_id);
CREATE INDEX idx_extracted_content_content_type ON extracted_content(content_type);
CREATE INDEX idx_auto_generated_knowledge_scan_job_id ON auto_generated_knowledge(scan_job_id);
CREATE INDEX idx_auto_generated_knowledge_needs_review ON auto_generated_knowledge(needs_review);
CREATE INDEX idx_scan_job_logs_scan_job_id ON scan_job_logs(scan_job_id);
CREATE INDEX idx_content_processing_queue_status ON content_processing_queue(processing_status);

-- Create function to update scan job progress
CREATE OR REPLACE FUNCTION update_scan_job_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Update progress percentage based on pages processed vs pages found
    IF NEW.pages_found > 0 THEN
        NEW.progress_percentage = (NEW.pages_processed::DECIMAL / NEW.pages_found::DECIMAL * 100)::INTEGER;
    END IF;
    
    -- Update status based on progress
    IF NEW.progress_percentage = 100 THEN
        NEW.status = 'completed';
        NEW.completed_at = NOW();
    ELSIF NEW.progress_percentage > 0 THEN
        NEW.status = 'scanning';
        IF NEW.started_at IS NULL THEN
            NEW.started_at = NOW();
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for website_scan_jobs table
CREATE TRIGGER update_scan_job_progress_trigger 
    BEFORE UPDATE ON website_scan_jobs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_scan_job_progress();

-- Create function to calculate word count
CREATE OR REPLACE FUNCTION calculate_word_count(content TEXT)
RETURNS INTEGER AS $$
BEGIN
    RETURN array_length(regexp_split_to_array(trim(content), '\s+'), 1);
END;
$$ language 'plpgsql';

-- Create function to automatically calculate word count on content insert
CREATE OR REPLACE FUNCTION set_word_count()
RETURNS TRIGGER AS $$
BEGIN
    NEW.word_count = calculate_word_count(NEW.content);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for extracted_content table
CREATE TRIGGER set_word_count_trigger 
    BEFORE INSERT OR UPDATE ON extracted_content 
    FOR EACH ROW 
    EXECUTE FUNCTION set_word_count();

-- Note: Sample data has been removed to avoid dependencies on knowledge_items table
-- The knowledge_items table should be created first from supabase_schema.sql
-- Then you can add the foreign key constraint and sample data in a separate migration 