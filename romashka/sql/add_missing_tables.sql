-- Add Missing Tables for Data Persistence
-- Run this SQL to fix template and personality data persistence

-- Response Templates table
CREATE TABLE IF NOT EXISTS response_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Personality Configurations table
CREATE TABLE IF NOT EXISTS personality_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- System Settings table (for brand customization)
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_response_templates_user_id ON response_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_response_templates_category ON response_templates(category);
CREATE INDEX IF NOT EXISTS idx_personality_configs_user_id ON personality_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_settings_user_id ON system_settings(user_id);

-- Enable RLS
ALTER TABLE response_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE personality_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for response_templates
DROP POLICY IF EXISTS "Users can manage their own templates" ON response_templates;
CREATE POLICY "Users can manage their own templates" ON response_templates
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for personality_configs
DROP POLICY IF EXISTS "Users can manage their own personality configs" ON personality_configs;
CREATE POLICY "Users can manage their own personality configs" ON personality_configs
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for system_settings
DROP POLICY IF EXISTS "Users can manage their own system settings" ON system_settings;
CREATE POLICY "Users can manage their own system settings" ON system_settings
    FOR ALL USING (auth.uid() = user_id);

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

-- Insert default personality config for existing users
INSERT INTO personality_configs (user_id, name)
SELECT 
    id,
    'Default Configuration'
FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 FROM personality_configs WHERE user_id = auth.users.id
)
ON CONFLICT DO NOTHING;

-- Insert default system settings for existing users
INSERT INTO system_settings (user_id, company_name)
SELECT 
    id,
    'My Company'
FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 FROM system_settings WHERE user_id = auth.users.id
)
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT ALL ON response_templates TO anon, authenticated;
GRANT ALL ON personality_configs TO anon, authenticated;
GRANT ALL ON system_settings TO anon, authenticated;