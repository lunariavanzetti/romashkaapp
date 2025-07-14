-- Response Templates System Database Migration
-- This migration creates all necessary tables for the advanced response templates system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Template Categories Table
CREATE TABLE IF NOT EXISTS template_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    color VARCHAR(7), -- hex color code
    parent_id UUID REFERENCES template_categories(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    permissions JSONB DEFAULT '{"can_create": true, "can_edit": true, "can_delete": true, "can_share": true}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Response Templates Table
CREATE TABLE IF NOT EXISTS response_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES template_categories(id) ON DELETE SET NULL,
    content JSONB NOT NULL, -- stores TemplateContent
    variables JSONB DEFAULT '[]', -- stores TemplateVariable[]
    conditions JSONB DEFAULT '[]', -- stores TemplateCondition[]
    media_attachments JSONB DEFAULT '[]', -- stores MediaAttachment[]
    usage_count INTEGER DEFAULT 0,
    effectiveness_score DECIMAL(3,2) DEFAULT 0.00,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_with UUID[] DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    parent_template_id UUID REFERENCES response_templates(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    language VARCHAR(10) DEFAULT 'en',
    ai_training_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Template Usage Tracking Table
CREATE TABLE IF NOT EXISTS template_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES response_templates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    variables_used JSONB DEFAULT '{}',
    effectiveness_score DECIMAL(3,2),
    customer_feedback JSONB,
    response_time INTEGER, -- milliseconds
    created_at TIMESTAMP DEFAULT NOW()
);

-- Template Analytics Table
CREATE TABLE IF NOT EXISTS template_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES response_templates(id) ON DELETE CASCADE,
    usage_stats JSONB DEFAULT '{}',
    performance_metrics JSONB DEFAULT '{}',
    optimization_suggestions JSONB DEFAULT '[]',
    a_b_test_results JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Template Variables Table (for reusable variables)
CREATE TABLE IF NOT EXISTS template_variables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    default_value TEXT,
    description TEXT,
    validation_rules JSONB DEFAULT '[]',
    source VARCHAR(50) DEFAULT 'manual',
    source_config JSONB,
    required BOOLEAN DEFAULT false,
    placeholder TEXT,
    options TEXT[], -- for select/multiselect types
    format VARCHAR(255), -- for date/number types
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- AI Training Sessions Table
CREATE TABLE IF NOT EXISTS ai_training_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'queued',
    data_sources TEXT[],
    parameters JSONB DEFAULT '{}',
    results JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT
);

-- Training Samples Table
CREATE TABLE IF NOT EXISTS training_samples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    template_id UUID REFERENCES response_templates(id) ON DELETE CASCADE,
    customer_response TEXT,
    outcome VARCHAR(20) NOT NULL,
    context JSONB NOT NULL,
    feedback_score DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Template Share Settings Table
CREATE TABLE IF NOT EXISTS template_share_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES response_templates(id) ON DELETE CASCADE,
    share_type VARCHAR(50) NOT NULL,
    shared_with UUID[],
    permissions JSONB DEFAULT '{}',
    expiry_date TIMESTAMP,
    password_protected BOOLEAN DEFAULT false,
    password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Template Collaboration Table
CREATE TABLE IF NOT EXISTS template_collaboration (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES response_templates(id) ON DELETE CASCADE,
    collaborators JSONB DEFAULT '[]',
    permissions JSONB DEFAULT '{}',
    activity_log JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Template Comments Table
CREATE TABLE IF NOT EXISTS template_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES response_templates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    position INTEGER DEFAULT 0,
    resolved BOOLEAN DEFAULT false,
    parent_comment_id UUID REFERENCES template_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Template Suggestions Table
CREATE TABLE IF NOT EXISTS template_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES response_templates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    proposed_changes JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'pending',
    feedback TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    reviewed_at TIMESTAMP
);

-- Template Libraries Table
CREATE TABLE IF NOT EXISTS template_libraries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_ids UUID[],
    category_ids UUID[],
    tags TEXT[],
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared BOOLEAN DEFAULT false,
    download_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- A/B Test Results Table
CREATE TABLE IF NOT EXISTS ab_test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id VARCHAR(255) NOT NULL,
    template_id UUID NOT NULL REFERENCES response_templates(id) ON DELETE CASCADE,
    variant_a JSONB NOT NULL,
    variant_b JSONB NOT NULL,
    winner VARCHAR(20),
    confidence_level DECIMAL(5,2),
    statistical_significance BOOLEAN DEFAULT false,
    test_duration INTEGER, -- days
    sample_size INTEGER,
    metrics_compared TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP
);

-- Real-time Edits Table (for collaborative editing)
CREATE TABLE IF NOT EXISTS realtime_edits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES response_templates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    operation VARCHAR(20) NOT NULL,
    position INTEGER NOT NULL,
    content TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Template Performance Metrics Table
CREATE TABLE IF NOT EXISTS template_performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES response_templates(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(3,2) DEFAULT 0.00,
    customer_satisfaction DECIMAL(3,2) DEFAULT 0.00,
    response_time INTEGER DEFAULT 0,
    conversion_rate DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(template_id, date)
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_response_templates_user_id ON response_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_response_templates_category_id ON response_templates(category_id);
CREATE INDEX IF NOT EXISTS idx_response_templates_active ON response_templates(active);
CREATE INDEX IF NOT EXISTS idx_response_templates_created_at ON response_templates(created_at);
CREATE INDEX IF NOT EXISTS idx_response_templates_updated_at ON response_templates(updated_at);
CREATE INDEX IF NOT EXISTS idx_response_templates_effectiveness_score ON response_templates(effectiveness_score);
CREATE INDEX IF NOT EXISTS idx_response_templates_usage_count ON response_templates(usage_count);
CREATE INDEX IF NOT EXISTS idx_response_templates_language ON response_templates(language);

-- GIN indexes for JSONB and array columns
CREATE INDEX IF NOT EXISTS idx_response_templates_content_gin ON response_templates USING gin(content);
CREATE INDEX IF NOT EXISTS idx_response_templates_variables_gin ON response_templates USING gin(variables);
CREATE INDEX IF NOT EXISTS idx_response_templates_tags_gin ON response_templates USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_response_templates_shared_with_gin ON response_templates USING gin(shared_with);

-- Text search indexes
CREATE INDEX IF NOT EXISTS idx_response_templates_name_trgm ON response_templates USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_response_templates_description_trgm ON response_templates USING gin(description gin_trgm_ops);

-- Template usage indexes
CREATE INDEX IF NOT EXISTS idx_template_usage_template_id ON template_usage(template_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_user_id ON template_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_conversation_id ON template_usage(conversation_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_created_at ON template_usage(created_at);

-- Template analytics indexes
CREATE INDEX IF NOT EXISTS idx_template_analytics_template_id ON template_analytics(template_id);
CREATE INDEX IF NOT EXISTS idx_template_analytics_updated_at ON template_analytics(updated_at);

-- Template variables indexes
CREATE INDEX IF NOT EXISTS idx_template_variables_user_id ON template_variables(user_id);
CREATE INDEX IF NOT EXISTS idx_template_variables_name ON template_variables(name);
CREATE INDEX IF NOT EXISTS idx_template_variables_type ON template_variables(type);
CREATE INDEX IF NOT EXISTS idx_template_variables_source ON template_variables(source);

-- AI training sessions indexes
CREATE INDEX IF NOT EXISTS idx_ai_training_sessions_user_id ON ai_training_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_training_sessions_type ON ai_training_sessions(type);
CREATE INDEX IF NOT EXISTS idx_ai_training_sessions_status ON ai_training_sessions(status);
CREATE INDEX IF NOT EXISTS idx_ai_training_sessions_created_at ON ai_training_sessions(created_at);

-- Training samples indexes
CREATE INDEX IF NOT EXISTS idx_training_samples_conversation_id ON training_samples(conversation_id);
CREATE INDEX IF NOT EXISTS idx_training_samples_template_id ON training_samples(template_id);
CREATE INDEX IF NOT EXISTS idx_training_samples_outcome ON training_samples(outcome);
CREATE INDEX IF NOT EXISTS idx_training_samples_created_at ON training_samples(created_at);

-- Template collaboration indexes
CREATE INDEX IF NOT EXISTS idx_template_collaboration_template_id ON template_collaboration(template_id);
CREATE INDEX IF NOT EXISTS idx_template_comments_template_id ON template_comments(template_id);
CREATE INDEX IF NOT EXISTS idx_template_comments_user_id ON template_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_template_suggestions_template_id ON template_suggestions(template_id);
CREATE INDEX IF NOT EXISTS idx_template_suggestions_user_id ON template_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_template_suggestions_status ON template_suggestions(status);

-- Template performance metrics indexes
CREATE INDEX IF NOT EXISTS idx_template_performance_metrics_template_id ON template_performance_metrics(template_id);
CREATE INDEX IF NOT EXISTS idx_template_performance_metrics_date ON template_performance_metrics(date);

-- Functions for template management
CREATE OR REPLACE FUNCTION update_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating timestamps
CREATE TRIGGER update_response_templates_updated_at
    BEFORE UPDATE ON response_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_template_updated_at();

CREATE TRIGGER update_template_categories_updated_at
    BEFORE UPDATE ON template_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_template_updated_at();

CREATE TRIGGER update_template_variables_updated_at
    BEFORE UPDATE ON template_variables
    FOR EACH ROW
    EXECUTE FUNCTION update_template_updated_at();

CREATE TRIGGER update_template_analytics_updated_at
    BEFORE UPDATE ON template_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_template_updated_at();

CREATE TRIGGER update_template_collaboration_updated_at
    BEFORE UPDATE ON template_collaboration
    FOR EACH ROW
    EXECUTE FUNCTION update_template_updated_at();

CREATE TRIGGER update_template_comments_updated_at
    BEFORE UPDATE ON template_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_template_updated_at();

CREATE TRIGGER update_template_libraries_updated_at
    BEFORE UPDATE ON template_libraries
    FOR EACH ROW
    EXECUTE FUNCTION update_template_updated_at();

-- Function to increment template usage count
CREATE OR REPLACE FUNCTION increment_template_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE response_templates 
    SET usage_count = usage_count + 1
    WHERE id = NEW.template_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-increment usage count
CREATE TRIGGER increment_template_usage_count_trigger
    AFTER INSERT ON template_usage
    FOR EACH ROW
    EXECUTE FUNCTION increment_template_usage_count();

-- Function to calculate template effectiveness score
CREATE OR REPLACE FUNCTION calculate_template_effectiveness(template_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    avg_score DECIMAL;
    usage_count INTEGER;
    effectiveness DECIMAL;
BEGIN
    SELECT AVG(effectiveness_score), COUNT(*)
    INTO avg_score, usage_count
    FROM template_usage
    WHERE template_usage.template_id = calculate_template_effectiveness.template_id
    AND effectiveness_score IS NOT NULL;
    
    IF usage_count = 0 THEN
        RETURN 0.00;
    END IF;
    
    -- Weight the score based on usage count
    effectiveness = CASE
        WHEN usage_count < 5 THEN avg_score * 0.5
        WHEN usage_count < 20 THEN avg_score * 0.8
        ELSE avg_score
    END;
    
    RETURN ROUND(effectiveness, 2);
END;
$$ language 'plpgsql';

-- Function to update template effectiveness score
CREATE OR REPLACE FUNCTION update_template_effectiveness()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE response_templates 
    SET effectiveness_score = calculate_template_effectiveness(NEW.template_id)
    WHERE id = NEW.template_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update effectiveness score
CREATE TRIGGER update_template_effectiveness_trigger
    AFTER INSERT OR UPDATE ON template_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_template_effectiveness();

-- Function for full-text search on templates
CREATE OR REPLACE FUNCTION search_templates(
    search_query TEXT,
    user_id UUID,
    category_id UUID DEFAULT NULL,
    tags TEXT[] DEFAULT NULL,
    language VARCHAR(10) DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    description TEXT,
    category_id UUID,
    effectiveness_score DECIMAL(3,2),
    usage_count INTEGER,
    created_at TIMESTAMP,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rt.id,
        rt.name,
        rt.description,
        rt.category_id,
        rt.effectiveness_score,
        rt.usage_count,
        rt.created_at,
        ts_rank(
            to_tsvector('english', rt.name || ' ' || COALESCE(rt.description, '')),
            plainto_tsquery('english', search_query)
        ) as rank
    FROM response_templates rt
    WHERE rt.user_id = search_templates.user_id
    AND rt.active = true
    AND (
        search_query IS NULL OR
        to_tsvector('english', rt.name || ' ' || COALESCE(rt.description, '')) @@ plainto_tsquery('english', search_query)
    )
    AND (category_id IS NULL OR rt.category_id = search_templates.category_id)
    AND (tags IS NULL OR rt.tags && search_templates.tags)
    AND (language IS NULL OR rt.language = search_templates.language)
    ORDER BY rank DESC, rt.effectiveness_score DESC, rt.usage_count DESC
    LIMIT limit_count OFFSET offset_count;
END;
$$ language 'plpgsql';

-- Insert default template categories
INSERT INTO template_categories (name, description, icon, color, sort_order) VALUES
('Greetings', 'Welcome messages and initial contact templates', 'wave', '#4F46E5', 1),
('Information', 'Templates for providing information and answers', 'info', '#059669', 2),
('Troubleshooting', 'Problem-solving and technical support templates', 'wrench', '#DC2626', 3),
('Closing', 'Conversation closing and follow-up templates', 'check', '#7C3AED', 4),
('Sales', 'Sales and conversion-focused templates', 'currency', '#F59E0B', 5),
('Support', 'Customer support and service templates', 'support', '#0EA5E9', 6)
ON CONFLICT DO NOTHING;

-- Insert default template variables
INSERT INTO template_variables (user_id, name, type, description, source, placeholder) VALUES
((SELECT id FROM users LIMIT 1), 'customer_name', 'text', 'Customer''s name', 'customer_data', 'Enter customer name'),
((SELECT id FROM users LIMIT 1), 'company', 'text', 'Customer''s company', 'customer_data', 'Enter company name'),
((SELECT id FROM users LIMIT 1), 'order_number', 'text', 'Order or ticket number', 'conversation_context', 'Enter order number'),
((SELECT id FROM users LIMIT 1), 'current_date', 'date', 'Current date', 'system', 'Current date'),
((SELECT id FROM users LIMIT 1), 'agent_name', 'text', 'Agent''s name', 'system', 'Agent name'),
((SELECT id FROM users LIMIT 1), 'customer_email', 'email', 'Customer''s email address', 'customer_data', 'Enter email address')
ON CONFLICT DO NOTHING;

-- Row Level Security (RLS) policies
ALTER TABLE response_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_share_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_collaboration ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_libraries ENABLE ROW LEVEL SECURITY;

-- RLS policies for response_templates
CREATE POLICY "Users can view own templates" ON response_templates FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can view shared templates" ON response_templates FOR SELECT USING (auth.uid() = ANY(shared_with));
CREATE POLICY "Users can create templates" ON response_templates FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own templates" ON response_templates FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own templates" ON response_templates FOR DELETE USING (user_id = auth.uid());

-- RLS policies for template_categories
CREATE POLICY "Users can view all categories" ON template_categories FOR SELECT USING (true);
CREATE POLICY "Users can create categories" ON template_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update categories" ON template_categories FOR UPDATE USING (true);
CREATE POLICY "Users can delete categories" ON template_categories FOR DELETE USING (true);

-- RLS policies for template_usage
CREATE POLICY "Users can view own usage" ON template_usage FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create usage records" ON template_usage FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS policies for template_variables
CREATE POLICY "Users can view own variables" ON template_variables FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create variables" ON template_variables FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own variables" ON template_variables FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own variables" ON template_variables FOR DELETE USING (user_id = auth.uid());

-- RLS policies for ai_training_sessions
CREATE POLICY "Users can view own training sessions" ON ai_training_sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create training sessions" ON ai_training_sessions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own training sessions" ON ai_training_sessions FOR UPDATE USING (user_id = auth.uid());

-- RLS policies for template_collaboration
CREATE POLICY "Users can view collaboration for own templates" ON template_collaboration 
FOR SELECT USING (
    template_id IN (
        SELECT id FROM response_templates WHERE user_id = auth.uid()
    )
);
CREATE POLICY "Users can create collaboration" ON template_collaboration 
FOR INSERT WITH CHECK (
    template_id IN (
        SELECT id FROM response_templates WHERE user_id = auth.uid()
    )
);
CREATE POLICY "Users can update collaboration for own templates" ON template_collaboration 
FOR UPDATE USING (
    template_id IN (
        SELECT id FROM response_templates WHERE user_id = auth.uid()
    )
);

-- RLS policies for template_comments
CREATE POLICY "Users can view comments for accessible templates" ON template_comments 
FOR SELECT USING (
    template_id IN (
        SELECT id FROM response_templates 
        WHERE user_id = auth.uid() OR auth.uid() = ANY(shared_with)
    )
);
CREATE POLICY "Users can create comments" ON template_comments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own comments" ON template_comments FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own comments" ON template_comments FOR DELETE USING (user_id = auth.uid());

-- RLS policies for template_suggestions
CREATE POLICY "Users can view suggestions for accessible templates" ON template_suggestions 
FOR SELECT USING (
    template_id IN (
        SELECT id FROM response_templates 
        WHERE user_id = auth.uid() OR auth.uid() = ANY(shared_with)
    )
);
CREATE POLICY "Users can create suggestions" ON template_suggestions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own suggestions" ON template_suggestions FOR UPDATE USING (user_id = auth.uid());

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;