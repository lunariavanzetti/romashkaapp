-- Migration 010: Smart Knowledge Base Generator System
-- Adds tables and columns for integration-based knowledge generation

-- Add new columns to existing knowledge_items table for integration support
ALTER TABLE knowledge_items 
ADD COLUMN IF NOT EXISTS source_integration VARCHAR(50),
ADD COLUMN IF NOT EXISTS external_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS integration_metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS knowledge_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS template_used VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS not_helpful_count INTEGER DEFAULT 0;

-- Knowledge sync status table
CREATE TABLE IF NOT EXISTS knowledge_sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  integration VARCHAR(50) NOT NULL,
  last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT '1970-01-01'::timestamptz,
  next_sync_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'active',
  sync_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  configuration JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, integration)
);

-- Knowledge sync jobs table
CREATE TABLE IF NOT EXISTS knowledge_sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  integration VARCHAR(50) NOT NULL,
  job_type VARCHAR(20) NOT NULL CHECK (job_type IN ('full_sync', 'incremental', 'real_time')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  records_processed INTEGER DEFAULT 0,
  records_total INTEGER DEFAULT 0,
  knowledge_generated INTEGER DEFAULT 0,
  knowledge_updated INTEGER DEFAULT 0,
  errors TEXT[] DEFAULT '{}',
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge data changes table for tracking integration updates
CREATE TABLE IF NOT EXISTS knowledge_data_changes (
  id VARCHAR(255) PRIMARY KEY,
  integration VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('create', 'update', 'delete')),
  old_data JSONB,
  new_data JSONB,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge templates table for storing reusable templates
CREATE TABLE IF NOT EXISTS knowledge_templates (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  integration_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  question_patterns TEXT[] NOT NULL,
  answer_template TEXT NOT NULL,
  required_fields TEXT[] NOT NULL,
  optional_fields TEXT[] DEFAULT '{}',
  confidence_score DECIMAL(3,2) DEFAULT 0.8,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge generation logs table
CREATE TABLE IF NOT EXISTS knowledge_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  integration VARCHAR(50) NOT NULL,
  operation VARCHAR(50) NOT NULL,
  records_processed INTEGER DEFAULT 0,
  knowledge_generated INTEGER DEFAULT 0,
  knowledge_updated INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT false,
  errors TEXT[] DEFAULT '{}',
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contextual insights table for storing AI-generated insights
CREATE TABLE IF NOT EXISTS contextual_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  relevance_score DECIMAL(3,2) NOT NULL,
  source_integration VARCHAR(50) NOT NULL,
  actionable BOOLEAN DEFAULT false,
  acted_upon BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recommended actions table
CREATE TABLE IF NOT EXISTS recommended_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  suggested_response TEXT,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge usage tracking for better insights
CREATE TABLE IF NOT EXISTS knowledge_usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_item_id UUID REFERENCES knowledge_items(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_type VARCHAR(50) NOT NULL, -- 'retrieved', 'injected', 'used_in_response'
  context_data JSONB DEFAULT '{}',
  relevance_score DECIMAL(3,2),
  helpful BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all new tables
ALTER TABLE knowledge_sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_data_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contextual_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommended_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS policies for user data isolation
CREATE POLICY "Users can manage their own sync status" ON knowledge_sync_status
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own sync jobs" ON knowledge_sync_jobs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own data changes" ON knowledge_data_changes
  FOR SELECT USING (integration IN (
    SELECT DISTINCT provider FROM synced_contacts WHERE user_id = auth.uid()
    UNION
    SELECT DISTINCT provider FROM synced_products WHERE user_id = auth.uid()
    UNION
    SELECT DISTINCT provider FROM synced_deals WHERE user_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can view templates" ON knowledge_templates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their own templates" ON knowledge_templates
  FOR ALL USING (auth.uid() = created_by);

CREATE POLICY "Users can view their own generation logs" ON knowledge_generation_logs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own insights" ON contextual_insights
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own actions" ON recommended_actions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own usage tracking" ON knowledge_usage_tracking
  FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_knowledge_items_integration ON knowledge_items(source_integration);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_external_id ON knowledge_items(external_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_knowledge_type ON knowledge_items(knowledge_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_auto_generated ON knowledge_items(auto_generated);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_last_synced ON knowledge_items(last_synced_at);

CREATE INDEX IF NOT EXISTS idx_sync_status_user_integration ON knowledge_sync_status(user_id, integration);
CREATE INDEX IF NOT EXISTS idx_sync_status_next_sync ON knowledge_sync_status(next_sync_at);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_user_id ON knowledge_sync_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_status ON knowledge_sync_jobs(status);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_integration ON knowledge_sync_jobs(integration);

CREATE INDEX IF NOT EXISTS idx_data_changes_processed ON knowledge_data_changes(processed);
CREATE INDEX IF NOT EXISTS idx_data_changes_integration ON knowledge_data_changes(integration);
CREATE INDEX IF NOT EXISTS idx_data_changes_detected_at ON knowledge_data_changes(detected_at);

CREATE INDEX IF NOT EXISTS idx_templates_integration_type ON knowledge_templates(integration_type);
CREATE INDEX IF NOT EXISTS idx_templates_entity_type ON knowledge_templates(entity_type);
CREATE INDEX IF NOT EXISTS idx_templates_active ON knowledge_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_insights_conversation ON contextual_insights(conversation_id);
CREATE INDEX IF NOT EXISTS idx_insights_user_id ON contextual_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_type ON contextual_insights(insight_type);

CREATE INDEX IF NOT EXISTS idx_actions_conversation ON recommended_actions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_actions_user_id ON recommended_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_actions_priority ON recommended_actions(priority);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_knowledge_item ON knowledge_usage_tracking(knowledge_item_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_conversation ON knowledge_usage_tracking(conversation_id);

-- Triggers for updated_at columns
CREATE TRIGGER update_knowledge_sync_status_updated_at
  BEFORE UPDATE ON knowledge_sync_status
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_templates_updated_at
  BEFORE UPDATE ON knowledge_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update knowledge effectiveness scores
CREATE OR REPLACE FUNCTION update_knowledge_effectiveness_with_integration()
RETURNS TRIGGER AS $$
BEGIN
  -- Update effectiveness score based on helpful/not helpful feedback
  UPDATE knowledge_items 
  SET effectiveness_score = (
    CASE 
      WHEN (helpful_count + not_helpful_count) = 0 THEN 0.5
      ELSE helpful_count::DECIMAL / (helpful_count + not_helpful_count)
    END
  )
  WHERE id = NEW.knowledge_item_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update effectiveness on usage tracking
CREATE TRIGGER update_effectiveness_on_usage
  AFTER INSERT OR UPDATE ON knowledge_usage_tracking
  FOR EACH ROW 
  WHEN (NEW.helpful IS NOT NULL)
  EXECUTE FUNCTION update_knowledge_effectiveness_with_integration();

-- Function to cleanup old knowledge data
CREATE OR REPLACE FUNCTION cleanup_old_knowledge_data()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete old auto-generated knowledge items (older than 90 days)
  DELETE FROM knowledge_items 
  WHERE auto_generated = true 
    AND last_synced_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Delete old sync jobs (older than 30 days)
  DELETE FROM knowledge_sync_jobs 
  WHERE completed_at < NOW() - INTERVAL '30 days';
  
  -- Delete processed data changes (older than 7 days)
  DELETE FROM knowledge_data_changes 
  WHERE processed = true 
    AND detected_at < NOW() - INTERVAL '7 days';
  
  -- Delete old generation logs (older than 30 days)
  DELETE FROM knowledge_generation_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Insert default knowledge templates
INSERT INTO knowledge_templates (id, name, integration_type, entity_type, question_patterns, answer_template, required_fields, optional_fields, confidence_score) VALUES
-- HubSpot Contact Templates
('hubspot_contact_basic', 'HubSpot Contact Information', 'hubspot', 'contact', 
 ARRAY['Who is {first_name} {last_name}?', 'Tell me about {first_name} {last_name}', 'What do you know about {email}?'],
 '{first_name} {last_name} is {title} at {company}. You can reach them at {email}{phone_info}. {deal_info}{lead_source_info}',
 ARRAY['first_name', 'last_name', 'email'],
 ARRAY['company', 'title', 'phone', 'lead_source'],
 0.9),

('hubspot_contact_company', 'Company Contact List', 'hubspot', 'contact',
 ARRAY['Who works at {company}?', 'Contacts from {company}', 'Team at {company}'],
 'At {company}, we have the following contacts: {contact_list}. {additional_info}',
 ARRAY['company'],
 ARRAY['contact_count', 'primary_contact'],
 0.85),

-- Shopify Product Templates  
('shopify_product_basic', 'Shopify Product Information', 'shopify', 'product',
 ARRAY['Tell me about {name}', 'What is {name}?', 'How much does {name} cost?', 'Is {name} in stock?'],
 '{name} costs {price} and we currently have {inventory_quantity} units in stock. {description}{shipping_info}{warranty_info}',
 ARRAY['name', 'price'],
 ARRAY['inventory_quantity', 'description', 'sku', 'status'],
 0.95),

('shopify_product_category', 'Product Category Information', 'shopify', 'product',
 ARRAY['What products do we sell?', 'Show me our product catalog', 'Available products'],
 'We offer {product_count} products including: {product_list}. {bestseller_info}{stock_status}',
 ARRAY['product_count'],
 ARRAY['bestsellers', 'low_stock_items'],
 0.8),

-- Salesforce Deal Templates
('salesforce_deal_basic', 'Salesforce Deal Information', 'salesforce', 'deal',
 ARRAY['What is the status of {name}?', 'Tell me about {name} deal', 'How much is {name} worth?'],
 '{name} is worth {amount} and is currently in the {stage} stage{probability_info}{close_date_info}. {contact_info}',
 ARRAY['name', 'amount', 'stage'],
 ARRAY['probability', 'close_date', 'contact_id'],
 0.9)

ON CONFLICT (id) DO NOTHING;

-- Create function to get knowledge statistics
CREATE OR REPLACE FUNCTION get_knowledge_stats(p_user_id UUID)
RETURNS TABLE(
  total_knowledge BIGINT,
  auto_generated BIGINT,
  manual_created BIGINT,
  by_integration JSONB,
  by_type JSONB,
  effectiveness_avg DECIMAL,
  last_sync_times JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE auto_generated = true) as auto_gen,
      COUNT(*) FILTER (WHERE auto_generated = false) as manual,
      AVG(effectiveness_score) as avg_effectiveness
    FROM knowledge_items 
    WHERE created_by = p_user_id
  ),
  integration_stats AS (
    SELECT jsonb_object_agg(
      COALESCE(source_integration, 'manual'), 
      count
    ) as by_integration
    FROM (
      SELECT 
        COALESCE(source_integration, 'manual') as source_integration,
        COUNT(*) as count
      FROM knowledge_items 
      WHERE created_by = p_user_id
      GROUP BY COALESCE(source_integration, 'manual')
    ) t
  ),
  type_stats AS (
    SELECT jsonb_object_agg(
      COALESCE(knowledge_type, 'general'), 
      count
    ) as by_type
    FROM (
      SELECT 
        COALESCE(knowledge_type, 'general') as knowledge_type,
        COUNT(*) as count
      FROM knowledge_items 
      WHERE created_by = p_user_id
      GROUP BY COALESCE(knowledge_type, 'general')
    ) t
  ),
  sync_times AS (
    SELECT jsonb_object_agg(
      integration,
      last_sync_at
    ) as last_syncs
    FROM knowledge_sync_status
    WHERE user_id = p_user_id
  )
  SELECT 
    s.total,
    s.auto_gen,
    s.manual,
    COALESCE(i.by_integration, '{}'::jsonb),
    COALESCE(t.by_type, '{}'::jsonb),
    s.avg_effectiveness,
    COALESCE(st.last_syncs, '{}'::jsonb)
  FROM stats s
  CROSS JOIN integration_stats i
  CROSS JOIN type_stats t
  CROSS JOIN sync_times st;
END;
$$ LANGUAGE plpgsql;

-- Create function to track knowledge usage
CREATE OR REPLACE FUNCTION track_knowledge_usage(
  p_knowledge_item_id UUID,
  p_conversation_id UUID,
  p_user_id UUID,
  p_usage_type VARCHAR(50),
  p_context_data JSONB DEFAULT '{}',
  p_relevance_score DECIMAL DEFAULT NULL,
  p_helpful BOOLEAN DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO knowledge_usage_tracking (
    knowledge_item_id,
    conversation_id,
    user_id,
    usage_type,
    context_data,
    relevance_score,
    helpful
  ) VALUES (
    p_knowledge_item_id,
    p_conversation_id,
    p_user_id,
    p_usage_type,
    p_context_data,
    p_relevance_score,
    p_helpful
  );
  
  -- Update usage count on knowledge item
  UPDATE knowledge_items 
  SET usage_count = usage_count + 1,
      helpful_count = helpful_count + CASE WHEN p_helpful = true THEN 1 ELSE 0 END,
      not_helpful_count = not_helpful_count + CASE WHEN p_helpful = false THEN 1 ELSE 0 END
  WHERE id = p_knowledge_item_id;
END;
$$ LANGUAGE plpgsql;

-- Migration complete
SELECT 'Migration 010: Smart Knowledge Base Generator System Complete' as status;