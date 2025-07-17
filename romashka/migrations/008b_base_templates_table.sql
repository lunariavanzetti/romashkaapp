-- Migration 008b: Base Templates Table
-- This creates the core templates table needed for migration 009

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create base templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'general',
    content TEXT NOT NULL,
    usage_count INTEGER DEFAULT 0,
    effectiveness_score DECIMAL(3,2) DEFAULT 0,
    language VARCHAR(10) DEFAULT 'en',
    tags TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create base template_categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS template_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(100),
    color VARCHAR(7), -- hex color code
    parent_id UUID REFERENCES template_categories(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_templates_name ON templates(name);
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_created_by ON templates(created_by);
CREATE INDEX IF NOT EXISTS idx_templates_is_active ON templates(is_active);
CREATE INDEX IF NOT EXISTS idx_templates_usage_count ON templates(usage_count);

-- Enable RLS
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own templates" ON templates FOR SELECT USING (
    created_by = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'agent'))
);
CREATE POLICY "Users can create templates" ON templates FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can update own templates" ON templates FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Users can delete own templates" ON templates FOR DELETE USING (created_by = auth.uid());

CREATE POLICY "Users can view template categories" ON template_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage template categories" ON template_categories FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for updated_at
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_template_categories_updated_at BEFORE UPDATE ON template_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO template_categories (name, description, icon, color, sort_order) VALUES
('Greetings', 'Welcome and greeting messages', 'hand-raised', '#22c55e', 1),
('Support', 'Customer support responses', 'life-buoy', '#3b82f6', 2),
('Sales', 'Sales and conversion messages', 'currency-dollar', '#f59e0b', 3),
('Follow-up', 'Follow-up and check-in messages', 'clock', '#8b5cf6', 4),
('Closing', 'Conversation closing messages', 'check-circle', '#10b981', 5),
('Technical', 'Technical support responses', 'cog', '#ef4444', 6),
('Billing', 'Billing and payment messages', 'credit-card', '#06b6d4', 7),
('General', 'General purpose templates', 'message-square', '#6b7280', 8)
ON CONFLICT (name) DO NOTHING;

-- Insert a few sample templates (only if admin user exists)
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    SELECT id INTO admin_user_id FROM profiles WHERE role = 'admin' LIMIT 1;
    
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO templates (name, description, category, content, created_by) VALUES
        (
            'Welcome Message',
            'Standard welcome message for new customers',
            'Greetings',
            'Hi there! 👋 Welcome to our support. How can I help you today?',
            admin_user_id
        ),
        (
            'Order Status Check',
            'Template for checking order status',
            'Support',
            'I''d be happy to help you check your order status. Could you please provide your order number?',
            admin_user_id
        ),
        (
            'Technical Issue',
            'Template for technical support',
            'Technical',
            'I understand you''re experiencing a technical issue. Let me help you resolve this. Could you please describe what''s happening?',
            admin_user_id
        ),
        (
            'Billing Question',
            'Template for billing inquiries',
            'Billing',
            'I''m here to help with your billing question. Could you please provide more details about your inquiry?',
            admin_user_id
        ),
        (
            'Closing Message',
            'Standard closing message',
            'Closing',
            'Is there anything else I can help you with today? Have a great day! 😊',
            admin_user_id
        )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;