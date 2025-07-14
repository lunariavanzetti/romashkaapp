-- AI Personality Configuration System Migration
-- This migration creates the necessary tables and functions for AI personality configuration

-- Create personality_configs table
CREATE TABLE IF NOT EXISTS personality_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bot_name TEXT NOT NULL DEFAULT 'ROMASHKA Assistant',
  avatar_url TEXT,
  personality_scores JSONB NOT NULL DEFAULT '{
    "formality": 50,
    "enthusiasm": 60,
    "technical_depth": 50,
    "empathy": 70
  }',
  primary_language TEXT NOT NULL DEFAULT 'en',
  tone_preset TEXT NOT NULL DEFAULT 'professional',
  industry_setting TEXT NOT NULL DEFAULT 'general',
  brand_voice_config JSONB NOT NULL DEFAULT '{
    "keywords": [],
    "avoid_phrases": [],
    "guidelines": "",
    "response_examples": []
  }',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT personality_configs_user_id_unique UNIQUE (user_id, is_active) DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT personality_scores_check CHECK (
    personality_scores ? 'formality' AND 
    personality_scores ? 'enthusiasm' AND 
    personality_scores ? 'technical_depth' AND 
    personality_scores ? 'empathy'
  ),
  CONSTRAINT tone_preset_check CHECK (
    tone_preset IN ('professional', 'friendly', 'casual', 'technical', 'supportive')
  ),
  CONSTRAINT language_check CHECK (
    primary_language IN ('en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko')
  )
);

-- Create personality_presets table for industry-specific configurations
CREATE TABLE IF NOT EXISTS personality_presets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  industry TEXT NOT NULL,
  description TEXT,
  personality_scores JSONB NOT NULL,
  tone_preset TEXT NOT NULL,
  brand_voice_config JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT personality_presets_industry_check CHECK (
    industry IN ('saas', 'ecommerce', 'healthcare', 'finance', 'education', 'real_estate', 'technology', 'general')
  )
);

-- Create personality_analytics table for tracking usage and effectiveness
CREATE TABLE IF NOT EXISTS personality_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  personality_config_id UUID NOT NULL REFERENCES personality_configs(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL,
  effectiveness_score DECIMAL(3,2),
  customer_satisfaction DECIMAL(3,2),
  response_time_improvement DECIMAL(5,2),
  analytics_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT interaction_type_check CHECK (
    interaction_type IN ('response_generation', 'tone_adjustment', 'language_adaptation', 'brand_alignment')
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_personality_configs_user_id ON personality_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_personality_configs_active ON personality_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_personality_presets_industry ON personality_presets(industry);
CREATE INDEX IF NOT EXISTS idx_personality_analytics_user_id ON personality_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_personality_analytics_config_id ON personality_analytics(personality_config_id);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_personality_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating timestamps
CREATE TRIGGER personality_config_update_timestamp
  BEFORE UPDATE ON personality_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_personality_config_timestamp();

-- Insert default personality presets
INSERT INTO personality_presets (name, industry, description, personality_scores, tone_preset, brand_voice_config) VALUES
('Professional SaaS', 'saas', 'Professional, knowledgeable, and solution-focused for SaaS businesses', 
 '{"formality": 75, "enthusiasm": 60, "technical_depth": 80, "empathy": 65}', 
 'professional', 
 '{"keywords": ["solution", "feature", "integration", "platform"], "avoid_phrases": ["I don''t know", "maybe", "probably"], "guidelines": "Always provide clear, actionable solutions"}'),

('Friendly E-commerce', 'ecommerce', 'Warm, helpful, and sales-oriented for e-commerce businesses', 
 '{"formality": 45, "enthusiasm": 85, "technical_depth": 40, "empathy": 80}', 
 'friendly', 
 '{"keywords": ["amazing", "perfect", "love", "discover"], "avoid_phrases": ["expensive", "costly", "cheap"], "guidelines": "Focus on product benefits and customer satisfaction"}'),

('Empathetic Healthcare', 'healthcare', 'Compassionate, careful, and informative for healthcare providers', 
 '{"formality": 70, "enthusiasm": 50, "technical_depth": 70, "empathy": 95}', 
 'supportive', 
 '{"keywords": ["care", "support", "understanding", "health"], "avoid_phrases": ["quick fix", "guaranteed", "always"], "guidelines": "Prioritize patient comfort and accurate information"}'),

('Technical Finance', 'finance', 'Precise, trustworthy, and detail-oriented for financial services', 
 '{"formality": 90, "enthusiasm": 40, "technical_depth": 85, "empathy": 60}', 
 'technical', 
 '{"keywords": ["secure", "compliance", "regulation", "analysis"], "avoid_phrases": ["risky", "gamble", "uncertain"], "guidelines": "Emphasize security, compliance, and accurate financial information"}'),

('Supportive Education', 'education', 'Patient, encouraging, and educational for learning environments', 
 '{"formality": 60, "enthusiasm": 70, "technical_depth": 65, "empathy": 85}', 
 'supportive', 
 '{"keywords": ["learn", "grow", "understand", "progress"], "avoid_phrases": ["difficult", "complicated", "impossible"], "guidelines": "Encourage learning and provide clear explanations"}'),

('Dynamic Real Estate', 'real_estate', 'Enthusiastic, knowledgeable, and helpful for real estate professionals', 
 '{"formality": 55, "enthusiasm": 80, "technical_depth": 60, "empathy": 70}', 
 'friendly', 
 '{"keywords": ["opportunity", "investment", "home", "location"], "avoid_phrases": ["problem", "issues", "concerns"], "guidelines": "Focus on opportunities and positive aspects of properties"}'),

('Innovation Technology', 'technology', 'Forward-thinking, technical, and innovative for tech companies', 
 '{"formality": 65, "enthusiasm": 75, "technical_depth": 90, "empathy": 55}', 
 'technical', 
 '{"keywords": ["innovation", "cutting-edge", "advanced", "technology"], "avoid_phrases": ["outdated", "old", "basic"], "guidelines": "Emphasize technological advancement and innovation"}'),

('Balanced General', 'general', 'Well-balanced personality suitable for various industries', 
 '{"formality": 60, "enthusiasm": 65, "technical_depth": 60, "empathy": 70}', 
 'professional', 
 '{"keywords": ["help", "support", "solution", "service"], "avoid_phrases": ["problem", "issue", "difficult"], "guidelines": "Maintain professional yet approachable communication"}')
ON CONFLICT DO NOTHING;

-- Create storage bucket for personality avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('personality-avatars', 'personality-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for personality_configs
ALTER TABLE personality_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own personality configs"
  ON personality_configs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own personality configs"
  ON personality_configs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own personality configs"
  ON personality_configs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own personality configs"
  ON personality_configs FOR DELETE
  USING (auth.uid() = user_id);

-- Set up RLS policies for personality_analytics
ALTER TABLE personality_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own personality analytics"
  ON personality_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert personality analytics"
  ON personality_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Set up storage policies for personality avatars
CREATE POLICY "Users can upload their own personality avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'personality-avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own personality avatars"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'personality-avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own personality avatars"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'personality-avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own personality avatars"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'personality-avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow public access to personality avatars
CREATE POLICY "Personality avatars are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'personality-avatars');

-- Create helper function to get active personality config
CREATE OR REPLACE FUNCTION get_active_personality_config(user_uuid UUID)
RETURNS personality_configs AS $$
DECLARE
  config personality_configs;
BEGIN
  SELECT * INTO config
  FROM personality_configs
  WHERE user_id = user_uuid AND is_active = true
  LIMIT 1;
  
  -- If no config exists, create a default one
  IF NOT FOUND THEN
    INSERT INTO personality_configs (user_id, bot_name, personality_scores, primary_language, tone_preset, industry_setting)
    VALUES (user_uuid, 'ROMASHKA Assistant', 
            '{"formality": 50, "enthusiasm": 60, "technical_depth": 50, "empathy": 70}',
            'en', 'professional', 'general')
    RETURNING * INTO config;
  END IF;
  
  RETURN config;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE personality_configs IS 'AI personality configuration settings for each user';
COMMENT ON TABLE personality_presets IS 'Pre-defined personality configurations for different industries';
COMMENT ON TABLE personality_analytics IS 'Analytics data for personality configuration effectiveness';
COMMENT ON COLUMN personality_configs.personality_scores IS 'JSON object containing formality, enthusiasm, technical_depth, and empathy scores (0-100)';
COMMENT ON COLUMN personality_configs.brand_voice_config IS 'JSON object containing brand voice guidelines, keywords, and examples';
COMMENT ON FUNCTION get_active_personality_config(UUID) IS 'Helper function to get or create active personality configuration for a user';