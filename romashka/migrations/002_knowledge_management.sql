-- Migration 002: Knowledge Management Tables
-- Creates tables for knowledge base, categories, and intent patterns

-- Knowledge categories
CREATE TABLE IF NOT EXISTS knowledge_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES knowledge_categories(id),
  order_index INTEGER DEFAULT 0,
  icon VARCHAR(100),
  color VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge items
CREATE TABLE IF NOT EXISTS knowledge_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  category_id UUID REFERENCES knowledge_categories(id),
  source_type VARCHAR(50) NOT NULL,
  source_url TEXT,
  file_path TEXT,
  confidence_score DECIMAL(3,2) DEFAULT 0.8,
  usage_count INTEGER DEFAULT 0,
  effectiveness_score DECIMAL(3,2) DEFAULT 0.5,
  language VARCHAR(10) DEFAULT 'en',
  tags TEXT[] DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'active',
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge versions
CREATE TABLE IF NOT EXISTS knowledge_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_item_id UUID REFERENCES knowledge_items(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  changes_description TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge analytics
CREATE TABLE IF NOT EXISTS knowledge_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_item_id UUID REFERENCES knowledge_items(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  was_helpful BOOLEAN,
  feedback_text TEXT,
  usage_context VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Intent patterns
CREATE TABLE IF NOT EXISTS intent_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_name VARCHAR(100) NOT NULL,
  language VARCHAR(10) NOT NULL,
  patterns TEXT[] NOT NULL,
  examples JSONB,
  confidence_threshold DECIMAL(3,2) DEFAULT 0.8,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation context
CREATE TABLE IF NOT EXISTS conversation_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE UNIQUE,
  context_data JSONB NOT NULL,
  last_intent VARCHAR(100),
  conversation_summary TEXT,
  key_entities JSONB,
  customer_preferences JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE knowledge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE intent_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_context ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Allow authenticated access" ON knowledge_categories
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON knowledge_items
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON knowledge_versions
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON knowledge_analytics
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON intent_patterns
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON conversation_context
  FOR ALL USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_items_category_id ON knowledge_items(category_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_status ON knowledge_items(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_language ON knowledge_items(language);

-- Full-text search indexes
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE INDEX IF NOT EXISTS idx_knowledge_items_content_trgm ON knowledge_items USING gin(content gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_title_trgm ON knowledge_items USING gin(title gin_trgm_ops);

-- Triggers for updated_at
CREATE TRIGGER update_knowledge_categories_updated_at
  BEFORE UPDATE ON knowledge_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_items_updated_at
  BEFORE UPDATE ON knowledge_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intent_patterns_updated_at
  BEFORE UPDATE ON intent_patterns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update knowledge item effectiveness
CREATE OR REPLACE FUNCTION update_knowledge_effectiveness()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE knowledge_items 
  SET effectiveness_score = (
    SELECT CASE 
      WHEN COUNT(*) = 0 THEN 0.5
      ELSE (COUNT(*) FILTER (WHERE was_helpful = true)::DECIMAL / COUNT(*))
    END
    FROM knowledge_analytics 
    WHERE knowledge_item_id = NEW.knowledge_item_id
  )
  WHERE id = NEW.knowledge_item_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update effectiveness on feedback
CREATE TRIGGER update_knowledge_effectiveness_trigger
  AFTER INSERT OR UPDATE ON knowledge_analytics
  FOR EACH ROW EXECUTE FUNCTION update_knowledge_effectiveness();

-- Default knowledge categories
INSERT INTO knowledge_categories (id, name, description, order_index, icon, color) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Getting Started', 'Basic setup and initial configuration', 1, 'rocket', '#3B82F6'),
('550e8400-e29b-41d4-a716-446655440002', 'Account Management', 'Account settings and profile management', 2, 'user', '#10B981'),
('550e8400-e29b-41d4-a716-446655440003', 'Technical Support', 'Technical troubleshooting and API documentation', 3, 'code', '#8B5CF6'),
('550e8400-e29b-41d4-a716-446655440004', 'Billing & Pricing', 'Billing questions and pricing information', 4, 'credit-card', '#F59E0B'),
('550e8400-e29b-41d4-a716-446655440005', 'Integrations', 'Third-party integrations and API connections', 5, 'plug', '#EF4444')
ON CONFLICT (id) DO NOTHING;

-- Default intent patterns
INSERT INTO intent_patterns (intent_name, language, patterns, examples) VALUES
('pricing_inquiry', 'en', ARRAY['price', 'cost', 'how much', 'pricing', 'plan'], '{"examples": ["How much does it cost?", "What are your pricing plans?"]}'),
('product_info', 'en', ARRAY['product', 'feature', 'specification', 'what is', 'tell me about'], '{"examples": ["Tell me about your product", "What features do you have?"]}'),
('support_request', 'en', ARRAY['help', 'problem', 'issue', 'broken', 'not working'], '{"examples": ["I need help", "There is a problem"]}'),
('account_question', 'en', ARRAY['account', 'profile', 'settings', 'login', 'password'], '{"examples": ["Account settings", "Login problem"]}'),
('integration_help', 'en', ARRAY['integration', 'api', 'connect', 'setup', 'configure'], '{"examples": ["API integration", "Setup help"]}')
ON CONFLICT (intent_name, language) DO NOTHING;

-- Migration complete
SELECT 'Migration 002: Knowledge Management Tables Complete' as status;