-- Enhanced Knowledge Base Database Migration
-- This migration adds advanced features for knowledge base management

-- Create enhanced knowledge categories table with unlimited nesting
CREATE TABLE IF NOT EXISTS knowledge_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES knowledge_categories(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  color VARCHAR(7), -- Hex color code
  icon VARCHAR(50), -- Icon name
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create enhanced knowledge items table
CREATE TABLE IF NOT EXISTS knowledge_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  category_id UUID REFERENCES knowledge_categories(id),
  source_type VARCHAR(50) NOT NULL, -- 'url', 'file', 'manual', 'api'
  source_url TEXT,
  file_path TEXT,
  confidence_score DECIMAL(3,2) DEFAULT 0.8,
  usage_count INTEGER DEFAULT 0,
  effectiveness_score DECIMAL(3,2) DEFAULT 0.5,
  language VARCHAR(10) DEFAULT 'en',
  tags TEXT[], -- Array of tags
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'draft', 'archived', 'pending_review'
  version INTEGER DEFAULT 1,
  word_count INTEGER DEFAULT 0,
  metadata JSONB,
  search_vector TSVECTOR,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create knowledge versions table for version control
CREATE TABLE IF NOT EXISTS knowledge_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_item_id UUID REFERENCES knowledge_items(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  changes_description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create knowledge tags table for better tag management
CREATE TABLE IF NOT EXISTS knowledge_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7), -- Hex color code
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create knowledge item tags junction table
CREATE TABLE IF NOT EXISTS knowledge_item_tags (
  knowledge_item_id UUID REFERENCES knowledge_items(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES knowledge_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (knowledge_item_id, tag_id)
);

-- Create knowledge analytics table
CREATE TABLE IF NOT EXISTS knowledge_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_item_id UUID REFERENCES knowledge_items(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'view', 'search', 'helpful', 'not_helpful', 'edit', 'delete'
  user_id UUID REFERENCES users(id),
  session_id VARCHAR(255),
  user_query TEXT,
  relevance_score DECIMAL(3,2),
  response_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create knowledge relationships table for cross-references
CREATE TABLE IF NOT EXISTS knowledge_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_item_id UUID REFERENCES knowledge_items(id) ON DELETE CASCADE,
  child_item_id UUID REFERENCES knowledge_items(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) NOT NULL, -- 'related', 'depends_on', 'references', 'follows'
  strength DECIMAL(3,2) DEFAULT 0.5,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(parent_item_id, child_item_id, relationship_type)
);

-- Create knowledge quality scores table
CREATE TABLE IF NOT EXISTS knowledge_quality_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_item_id UUID REFERENCES knowledge_items(id) ON DELETE CASCADE,
  quality_type VARCHAR(50) NOT NULL, -- 'readability', 'completeness', 'accuracy', 'freshness'
  score DECIMAL(3,2) NOT NULL,
  calculated_at TIMESTAMP DEFAULT NOW(),
  algorithm_version VARCHAR(20),
  metadata JSONB
);

-- Create knowledge usage patterns table
CREATE TABLE IF NOT EXISTS knowledge_usage_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_item_id UUID REFERENCES knowledge_items(id) ON DELETE CASCADE,
  pattern_type VARCHAR(50) NOT NULL, -- 'seasonal', 'time_of_day', 'user_role', 'query_type'
  pattern_data JSONB NOT NULL,
  frequency INTEGER DEFAULT 1,
  last_occurrence TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create knowledge search history table
CREATE TABLE IF NOT EXISTS knowledge_search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  clicked_item_id UUID REFERENCES knowledge_items(id),
  search_type VARCHAR(50) DEFAULT 'full_text', -- 'full_text', 'tag', 'category', 'semantic'
  response_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create knowledge feedback table
CREATE TABLE IF NOT EXISTS knowledge_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_item_id UUID REFERENCES knowledge_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  feedback_type VARCHAR(50) NOT NULL, -- 'helpful', 'not_helpful', 'outdated', 'incorrect', 'incomplete'
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create knowledge auto-suggestions table
CREATE TABLE IF NOT EXISTS knowledge_auto_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_item_id UUID REFERENCES knowledge_items(id) ON DELETE CASCADE,
  suggestion_type VARCHAR(50) NOT NULL, -- 'related_content', 'tag', 'category', 'improvement'
  suggestion_text TEXT NOT NULL,
  confidence_score DECIMAL(3,2) DEFAULT 0.5,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_knowledge_categories_parent_id ON knowledge_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_categories_order_index ON knowledge_categories(order_index);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_category_id ON knowledge_items(category_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_status ON knowledge_items(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_created_at ON knowledge_items(created_at);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_updated_at ON knowledge_items(updated_at);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_search_vector ON knowledge_items USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_tags ON knowledge_items USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_knowledge_versions_item_id ON knowledge_versions(knowledge_item_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_analytics_item_id ON knowledge_analytics(knowledge_item_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_analytics_event_type ON knowledge_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_analytics_created_at ON knowledge_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_knowledge_relationships_parent_id ON knowledge_relationships(parent_item_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_relationships_child_id ON knowledge_relationships(child_item_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_search_history_user_id ON knowledge_search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_search_history_created_at ON knowledge_search_history(created_at);
CREATE INDEX IF NOT EXISTS idx_knowledge_feedback_item_id ON knowledge_feedback(knowledge_item_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_feedback_user_id ON knowledge_feedback(user_id);

-- Create full-text search trigger for knowledge items
CREATE OR REPLACE FUNCTION update_knowledge_search_vector() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
                      setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'B') ||
                      setweight(to_tsvector('english', COALESCE(NEW.summary, '')), 'C') ||
                      setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_knowledge_search_vector
  BEFORE INSERT OR UPDATE ON knowledge_items
  FOR EACH ROW EXECUTE FUNCTION update_knowledge_search_vector();

-- Create function to update word count
CREATE OR REPLACE FUNCTION update_knowledge_word_count() RETURNS TRIGGER AS $$
BEGIN
  NEW.word_count := array_length(string_to_array(NEW.content, ' '), 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_knowledge_word_count
  BEFORE INSERT OR UPDATE ON knowledge_items
  FOR EACH ROW EXECUTE FUNCTION update_knowledge_word_count();

-- Create function to track analytics
CREATE OR REPLACE FUNCTION track_knowledge_analytics(
  item_id UUID,
  event VARCHAR(50),
  user_id UUID DEFAULT NULL,
  query TEXT DEFAULT NULL,
  relevance DECIMAL(3,2) DEFAULT NULL,
  response_time INTEGER DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO knowledge_analytics (
    knowledge_item_id,
    event_type,
    user_id,
    user_query,
    relevance_score,
    response_time_ms
  ) VALUES (
    item_id,
    event,
    user_id,
    query,
    relevance,
    response_time
  );
  
  -- Update usage count
  UPDATE knowledge_items 
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE id = item_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate knowledge item effectiveness
CREATE OR REPLACE FUNCTION calculate_knowledge_effectiveness(item_id UUID) RETURNS DECIMAL(3,2) AS $$
DECLARE
  helpful_count INTEGER;
  not_helpful_count INTEGER;
  total_feedback INTEGER;
  usage_count INTEGER;
  effectiveness DECIMAL(3,2);
BEGIN
  -- Get feedback counts
  SELECT 
    COUNT(*) FILTER (WHERE feedback_type = 'helpful'),
    COUNT(*) FILTER (WHERE feedback_type = 'not_helpful'),
    COUNT(*)
  INTO helpful_count, not_helpful_count, total_feedback
  FROM knowledge_feedback
  WHERE knowledge_item_id = item_id;
  
  -- Get usage count
  SELECT ki.usage_count INTO usage_count
  FROM knowledge_items ki
  WHERE ki.id = item_id;
  
  -- Calculate effectiveness score
  IF total_feedback > 0 THEN
    effectiveness := (helpful_count::DECIMAL / total_feedback) * 0.7 + 
                    (LEAST(usage_count, 100)::DECIMAL / 100) * 0.3;
  ELSE
    effectiveness := (LEAST(usage_count, 100)::DECIMAL / 100) * 0.5;
  END IF;
  
  -- Update the knowledge item
  UPDATE knowledge_items 
  SET effectiveness_score = effectiveness,
      updated_at = NOW()
  WHERE id = item_id;
  
  RETURN effectiveness;
END;
$$ LANGUAGE plpgsql;

-- Create function to get knowledge hierarchy
CREATE OR REPLACE FUNCTION get_knowledge_category_hierarchy(category_id UUID DEFAULT NULL) 
RETURNS TABLE (
  id UUID,
  name VARCHAR(255),
  description TEXT,
  parent_id UUID,
  level INTEGER,
  path TEXT[]
) AS $$
WITH RECURSIVE category_tree AS (
  -- Base case: root categories or specific category
  SELECT 
    c.id,
    c.name,
    c.description,
    c.parent_id,
    0 as level,
    ARRAY[c.name] as path
  FROM knowledge_categories c
  WHERE (category_id IS NULL AND c.parent_id IS NULL) OR c.id = category_id
  
  UNION ALL
  
  -- Recursive case: child categories
  SELECT 
    c.id,
    c.name,
    c.description,
    c.parent_id,
    ct.level + 1,
    ct.path || c.name
  FROM knowledge_categories c
  JOIN category_tree ct ON c.parent_id = ct.id
)
SELECT * FROM category_tree
ORDER BY level, name;
$$ LANGUAGE sql;

-- Create function for semantic search (placeholder for future AI integration)
CREATE OR REPLACE FUNCTION semantic_search_knowledge(
  query TEXT,
  limit_count INTEGER DEFAULT 10,
  min_relevance DECIMAL(3,2) DEFAULT 0.3
) RETURNS TABLE (
  id UUID,
  title VARCHAR(500),
  content TEXT,
  relevance_score DECIMAL(3,2),
  category_name VARCHAR(255)
) AS $$
BEGIN
  -- For now, use full-text search with ranking
  RETURN QUERY
  SELECT 
    ki.id,
    ki.title,
    ki.content,
    ts_rank(ki.search_vector, plainto_tsquery('english', query))::DECIMAL(3,2) as relevance_score,
    kc.name as category_name
  FROM knowledge_items ki
  LEFT JOIN knowledge_categories kc ON ki.category_id = kc.id
  WHERE ki.search_vector @@ plainto_tsquery('english', query)
    AND ki.status = 'active'
    AND ts_rank(ki.search_vector, plainto_tsquery('english', query)) >= min_relevance
  ORDER BY relevance_score DESC, ki.updated_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get related knowledge items
CREATE OR REPLACE FUNCTION get_related_knowledge_items(
  item_id UUID,
  limit_count INTEGER DEFAULT 5
) RETURNS TABLE (
  id UUID,
  title VARCHAR(500),
  relevance_score DECIMAL(3,2),
  relationship_type VARCHAR(50)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ki.id,
    ki.title,
    kr.strength as relevance_score,
    kr.relationship_type
  FROM knowledge_relationships kr
  JOIN knowledge_items ki ON kr.child_item_id = ki.id
  WHERE kr.parent_item_id = item_id
    AND ki.status = 'active'
  
  UNION ALL
  
  SELECT 
    ki.id,
    ki.title,
    kr.strength as relevance_score,
    kr.relationship_type
  FROM knowledge_relationships kr
  JOIN knowledge_items ki ON kr.parent_item_id = ki.id
  WHERE kr.child_item_id = item_id
    AND ki.status = 'active'
  
  ORDER BY relevance_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create Row Level Security (RLS) policies
ALTER TABLE knowledge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_feedback ENABLE ROW LEVEL SECURITY;

-- RLS policies for knowledge categories
CREATE POLICY "Users can view all knowledge categories" ON knowledge_categories
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can manage their own knowledge categories" ON knowledge_categories
  FOR ALL USING (auth.uid() = created_by);

-- RLS policies for knowledge items
CREATE POLICY "Users can view active knowledge items" ON knowledge_items
  FOR SELECT USING (status = 'active' OR auth.uid() = created_by);

CREATE POLICY "Users can manage their own knowledge items" ON knowledge_items
  FOR ALL USING (auth.uid() = created_by);

-- RLS policies for knowledge versions
CREATE POLICY "Users can view versions of accessible knowledge items" ON knowledge_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM knowledge_items ki 
      WHERE ki.id = knowledge_versions.knowledge_item_id 
        AND (ki.status = 'active' OR auth.uid() = ki.created_by)
    )
  );

-- RLS policies for knowledge analytics
CREATE POLICY "Users can view analytics for their own items" ON knowledge_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM knowledge_items ki 
      WHERE ki.id = knowledge_analytics.knowledge_item_id 
        AND auth.uid() = ki.created_by
    )
  );

-- RLS policies for knowledge feedback
CREATE POLICY "Users can view and manage their own feedback" ON knowledge_feedback
  FOR ALL USING (auth.uid() = user_id);

-- Insert default categories
INSERT INTO knowledge_categories (name, description, order_index, color, icon) VALUES
  ('General', 'General knowledge and information', 0, '#3B82F6', 'book-open'),
  ('Product', 'Product information and features', 1, '#10B981', 'cube'),
  ('Pricing', 'Pricing plans and billing information', 2, '#F59E0B', 'currency-dollar'),
  ('Support', 'Support and troubleshooting guides', 3, '#EF4444', 'support'),
  ('FAQ', 'Frequently asked questions', 4, '#8B5CF6', 'question-mark-circle'),
  ('Policies', 'Terms of service and privacy policies', 5, '#6B7280', 'shield-check'),
  ('API', 'API documentation and guides', 6, '#EC4899', 'code');

-- Insert default tags
INSERT INTO knowledge_tags (name, description, color) VALUES
  ('beginner', 'Beginner-friendly content', '#22C55E'),
  ('advanced', 'Advanced topics', '#EF4444'),
  ('tutorial', 'Step-by-step tutorials', '#3B82F6'),
  ('troubleshooting', 'Problem-solving guides', '#F59E0B'),
  ('api', 'API-related content', '#EC4899'),
  ('integration', 'Integration guides', '#8B5CF6'),
  ('best-practices', 'Best practices and recommendations', '#10B981');

-- Create view for knowledge item statistics
CREATE OR REPLACE VIEW knowledge_item_stats AS
SELECT 
  ki.id,
  ki.title,
  ki.category_id,
  kc.name as category_name,
  ki.usage_count,
  ki.effectiveness_score,
  ki.word_count,
  ki.status,
  ki.created_at,
  ki.updated_at,
  COUNT(DISTINCT kf.id) as feedback_count,
  AVG(kf.rating) as average_rating,
  COUNT(DISTINCT ka.id) as analytics_events,
  COUNT(DISTINCT kr.id) as relationship_count
FROM knowledge_items ki
LEFT JOIN knowledge_categories kc ON ki.category_id = kc.id
LEFT JOIN knowledge_feedback kf ON ki.id = kf.knowledge_item_id
LEFT JOIN knowledge_analytics ka ON ki.id = ka.knowledge_item_id
LEFT JOIN knowledge_relationships kr ON ki.id = kr.parent_item_id OR ki.id = kr.child_item_id
GROUP BY ki.id, ki.title, ki.category_id, kc.name, ki.usage_count, 
         ki.effectiveness_score, ki.word_count, ki.status, ki.created_at, ki.updated_at;