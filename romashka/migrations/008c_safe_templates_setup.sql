-- Migration 008c: Safe Templates Setup
-- This safely creates templates table and related structures

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create base templates table if it doesn't exist (safe version)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'templates') THEN
        CREATE TABLE templates (
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
    END IF;
END $$;

-- Add missing columns to existing templates table if needed
DO $$
BEGIN
    -- Add usage_count if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'usage_count') THEN
        ALTER TABLE templates ADD COLUMN usage_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add effectiveness_score if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'effectiveness_score') THEN
        ALTER TABLE templates ADD COLUMN effectiveness_score DECIMAL(3,2) DEFAULT 0;
    END IF;
    
    -- Add language if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'language') THEN
        ALTER TABLE templates ADD COLUMN language VARCHAR(10) DEFAULT 'en';
    END IF;
    
    -- Add tags if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'tags') THEN
        ALTER TABLE templates ADD COLUMN tags TEXT[] DEFAULT '{}';
    END IF;
    
    -- Add is_active if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'is_active') THEN
        ALTER TABLE templates ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Create base template_categories table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'template_categories') THEN
        CREATE TABLE template_categories (
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
    END IF;
END $$;

-- Add indexes (safe creation)
CREATE INDEX IF NOT EXISTS idx_templates_name ON templates(name);
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_created_by ON templates(created_by);
CREATE INDEX IF NOT EXISTS idx_templates_is_active ON templates(is_active);
CREATE INDEX IF NOT EXISTS idx_templates_usage_count ON templates(usage_count);

-- Enable RLS (safe)
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_categories ENABLE ROW LEVEL SECURITY;

-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing policies if they exist and recreate them
DO $$
BEGIN
    -- Drop existing templates policies
    DROP POLICY IF EXISTS "Users can view own templates" ON templates;
    DROP POLICY IF EXISTS "Users can create templates" ON templates;
    DROP POLICY IF EXISTS "Users can update own templates" ON templates;
    DROP POLICY IF EXISTS "Users can delete own templates" ON templates;
    
    -- Recreate templates policies
    CREATE POLICY "Users can view own templates" ON templates FOR SELECT USING (
        created_by = auth.uid() OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'agent'))
    );
    CREATE POLICY "Users can create templates" ON templates FOR INSERT WITH CHECK (created_by = auth.uid());
    CREATE POLICY "Users can update own templates" ON templates FOR UPDATE USING (created_by = auth.uid());
    CREATE POLICY "Users can delete own templates" ON templates FOR DELETE USING (created_by = auth.uid());
END $$;

-- Template categories policies (safe)
DO $$
BEGIN
    -- Drop existing template_categories policies
    DROP POLICY IF EXISTS "Users can view template categories" ON template_categories;
    DROP POLICY IF EXISTS "Admins can manage template categories" ON template_categories;
    
    -- Recreate template_categories policies
    CREATE POLICY "Users can view template categories" ON template_categories FOR SELECT USING (true);
    CREATE POLICY "Admins can manage template categories" ON template_categories FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
END $$;

-- Add triggers (safe creation)
DROP TRIGGER IF EXISTS update_templates_updated_at ON templates;
DROP TRIGGER IF EXISTS update_template_categories_updated_at ON template_categories;

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_template_categories_updated_at BEFORE UPDATE ON template_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories (safe)
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

-- Insert sample templates (safe - only if admin exists and no templates exist)
DO $$
DECLARE
    admin_user_id UUID;
    template_count INTEGER;
BEGIN
    SELECT id INTO admin_user_id FROM profiles WHERE role = 'admin' LIMIT 1;
    SELECT COUNT(*) INTO template_count FROM templates;
    
    IF admin_user_id IS NOT NULL AND template_count = 0 THEN
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
        );
    END IF;
END $$;