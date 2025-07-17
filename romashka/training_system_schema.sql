-- Training System Database Schema
-- This creates all the required tables for the production-ready AI Training system

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS
ALTER DATABASE postgres SET row_security = on;

-- Training data table
CREATE TABLE IF NOT EXISTS training_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  content JSONB NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'error')),
  quality_score DECIMAL(3,2),
  category TEXT,
  record_count INTEGER DEFAULT 0,
  valid_records INTEGER DEFAULT 0,
  invalid_records INTEGER DEFAULT 0,
  categories TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training jobs table
CREATE TABLE IF NOT EXISTS training_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  openai_job_id TEXT,
  training_data_ids UUID[],
  model_config JSONB DEFAULT '{}',
  results JSONB DEFAULT '{}',
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  metric_value DECIMAL(10,4),
  measurement_date DATE DEFAULT CURRENT_DATE,
  training_job_id UUID REFERENCES training_jobs(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training sessions table (for tracking active training processes)
CREATE TABLE IF NOT EXISTS training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  training_job_id UUID REFERENCES training_jobs(id) ON DELETE CASCADE,
  session_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'error')),
  progress_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training file uploads table (for tracking file uploads separately)
CREATE TABLE IF NOT EXISTS training_file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  training_data_id UUID REFERENCES training_data(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  upload_status TEXT DEFAULT 'pending' CHECK (upload_status IN ('pending', 'uploading', 'completed', 'error')),
  upload_progress INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation quality ratings (for training data analysis)
CREATE TABLE IF NOT EXISTS conversation_quality_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_data JSONB NOT NULL,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  accuracy_score DECIMAL(3,2),
  relevance_score DECIMAL(3,2),
  helpfulness_score DECIMAL(3,2),
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training insights table (for AI-generated insights)
CREATE TABLE IF NOT EXISTS training_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
  insight_title TEXT NOT NULL,
  insight_description TEXT NOT NULL,
  confidence_score DECIMAL(3,2),
  supporting_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'applied', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  applied_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_training_data_user_id ON training_data(user_id);
CREATE INDEX IF NOT EXISTS idx_training_data_status ON training_data(status);
CREATE INDEX IF NOT EXISTS idx_training_data_created_at ON training_data(created_at);
CREATE INDEX IF NOT EXISTS idx_training_data_category ON training_data(category);

CREATE INDEX IF NOT EXISTS idx_training_jobs_user_id ON training_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_training_jobs_status ON training_jobs(status);
CREATE INDEX IF NOT EXISTS idx_training_jobs_created_at ON training_jobs(created_at);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_date ON performance_metrics(measurement_date);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_job_id ON performance_metrics(training_job_id);

CREATE INDEX IF NOT EXISTS idx_training_sessions_user_id ON training_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_job_id ON training_sessions(training_job_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_status ON training_sessions(status);

CREATE INDEX IF NOT EXISTS idx_training_file_uploads_user_id ON training_file_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_training_file_uploads_data_id ON training_file_uploads(training_data_id);
CREATE INDEX IF NOT EXISTS idx_training_file_uploads_status ON training_file_uploads(upload_status);

CREATE INDEX IF NOT EXISTS idx_conversation_quality_ratings_user_id ON conversation_quality_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_quality_ratings_category ON conversation_quality_ratings(category);
CREATE INDEX IF NOT EXISTS idx_conversation_quality_ratings_rating ON conversation_quality_ratings(quality_rating);

CREATE INDEX IF NOT EXISTS idx_training_insights_user_id ON training_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_training_insights_type ON training_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_training_insights_status ON training_insights(status);

-- Enable Row Level Security (RLS)
ALTER TABLE training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_quality_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_insights ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Training data policies
CREATE POLICY "Users can view their own training data" ON training_data
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own training data" ON training_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own training data" ON training_data
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own training data" ON training_data
  FOR DELETE USING (auth.uid() = user_id);

-- Training jobs policies
CREATE POLICY "Users can view their own training jobs" ON training_jobs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own training jobs" ON training_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own training jobs" ON training_jobs
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own training jobs" ON training_jobs
  FOR DELETE USING (auth.uid() = user_id);

-- Performance metrics policies
CREATE POLICY "Users can view their own performance metrics" ON performance_metrics
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own performance metrics" ON performance_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Training sessions policies
CREATE POLICY "Users can view their own training sessions" ON training_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own training sessions" ON training_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own training sessions" ON training_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Training file uploads policies
CREATE POLICY "Users can view their own file uploads" ON training_file_uploads
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own file uploads" ON training_file_uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own file uploads" ON training_file_uploads
  FOR UPDATE USING (auth.uid() = user_id);

-- Conversation quality ratings policies
CREATE POLICY "Users can view their own quality ratings" ON conversation_quality_ratings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own quality ratings" ON conversation_quality_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own quality ratings" ON conversation_quality_ratings
  FOR UPDATE USING (auth.uid() = user_id);

-- Training insights policies
CREATE POLICY "Users can view their own training insights" ON training_insights
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own training insights" ON training_insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own training insights" ON training_insights
  FOR UPDATE USING (auth.uid() = user_id);

-- Create storage bucket for training files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('training-files', 'training-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for training files
CREATE POLICY "Users can upload their own training files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'training-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own training files" ON storage.objects
  FOR SELECT USING (bucket_id = 'training-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own training files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'training-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own training files" ON storage.objects
  FOR DELETE USING (bucket_id = 'training-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create functions for common operations
CREATE OR REPLACE FUNCTION get_training_stats(user_uuid UUID)
RETURNS TABLE(
  total_datasets INTEGER,
  total_conversations INTEGER,
  average_accuracy DECIMAL(3,2),
  active_trainings INTEGER,
  last_training TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM training_data WHERE user_id = user_uuid) as total_datasets,
    (SELECT COALESCE(SUM(record_count), 0)::INTEGER FROM training_data WHERE user_id = user_uuid) as total_conversations,
    (SELECT COALESCE(AVG(quality_score), 0.0)::DECIMAL(3,2) FROM training_data WHERE user_id = user_uuid AND quality_score IS NOT NULL) as average_accuracy,
    (SELECT COUNT(*)::INTEGER FROM training_jobs WHERE user_id = user_uuid AND status IN ('pending', 'running')) as active_trainings,
    (SELECT MAX(completed_at) FROM training_jobs WHERE user_id = user_uuid AND status = 'completed') as last_training;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get training progress
CREATE OR REPLACE FUNCTION get_training_progress(job_uuid UUID)
RETURNS TABLE(
  job_id UUID,
  name TEXT,
  status TEXT,
  progress INTEGER,
  started_at TIMESTAMP WITH TIME ZONE,
  estimated_completion TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tj.id,
    tj.name,
    tj.status,
    tj.progress,
    tj.started_at,
    CASE 
      WHEN tj.progress > 0 AND tj.started_at IS NOT NULL THEN
        tj.started_at + (INTERVAL '1 minute' * (100 - tj.progress) * EXTRACT(EPOCH FROM (NOW() - tj.started_at)) / 60 / tj.progress)
      ELSE NULL
    END as estimated_completion
  FROM training_jobs tj
  WHERE tj.id = job_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_training_data_updated_at 
  BEFORE UPDATE ON training_data 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_jobs_updated_at 
  BEFORE UPDATE ON training_jobs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_sessions_updated_at 
  BEFORE UPDATE ON training_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_file_uploads_updated_at 
  BEFORE UPDATE ON training_file_uploads 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();