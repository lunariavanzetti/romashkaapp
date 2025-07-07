-- Enterprise Integration Ecosystem Database Schema
-- This schema supports integrations with CRM, help desk, e-commerce, and business tools

-- Create integrations table
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL, -- 'crm', 'helpdesk', 'ecommerce', 'email_marketing', 'calendar', 'analytics'
  provider VARCHAR(100) NOT NULL, -- 'salesforce', 'hubspot', 'zendesk', 'shopify', etc.
  status VARCHAR(50) DEFAULT 'inactive', -- 'active', 'inactive', 'error', 'pending_setup'
  configuration JSONB NOT NULL,
  credentials JSONB NOT NULL, -- Encrypted
  sync_settings JSONB,
  last_sync_at TIMESTAMP,
  sync_frequency INTEGER DEFAULT 3600, -- seconds
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create sync jobs table
CREATE TABLE sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  job_type VARCHAR(100) NOT NULL, -- 'full_sync', 'incremental', 'real_time'
  direction VARCHAR(20) NOT NULL, -- 'inbound', 'outbound', 'bidirectional'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  records_processed INTEGER DEFAULT 0,
  records_total INTEGER DEFAULT 0,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create field mappings table
CREATE TABLE field_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  source_entity VARCHAR(100) NOT NULL, -- 'conversation', 'customer', 'message'
  target_entity VARCHAR(100) NOT NULL, -- 'contact', 'deal', 'ticket'
  source_field VARCHAR(255) NOT NULL,
  target_field VARCHAR(255) NOT NULL,
  transformation_rule TEXT, -- JSON transformation logic
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create webhook subscriptions table
CREATE TABLE webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  webhook_url TEXT NOT NULL,
  secret_key VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  retry_count INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 30,
  last_triggered TIMESTAMP,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create customer sync mapping
CREATE TABLE customer_sync_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_profile_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  external_id VARCHAR(255) NOT NULL,
  external_entity_type VARCHAR(100) NOT NULL, -- 'contact', 'lead', 'customer'
  last_synced_at TIMESTAMP DEFAULT NOW(),
  sync_status VARCHAR(50) DEFAULT 'synced', -- 'synced', 'pending', 'error'
  UNIQUE(customer_profile_id, integration_id)
);

-- Create webhook logs table for debugging
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_subscription_id UUID REFERENCES webhook_subscriptions(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB,
  response_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create integration audit logs
CREATE TABLE integration_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'sync', 'error'
  entity_type VARCHAR(100), -- 'contact', 'deal', 'ticket', etc.
  entity_id VARCHAR(255),
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_sync_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for integrations
CREATE POLICY "Users can view their own integrations" ON integrations
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own integrations" ON integrations
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own integrations" ON integrations
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own integrations" ON integrations
  FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for sync_jobs
CREATE POLICY "Users can view sync jobs for their integrations" ON sync_jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM integrations 
      WHERE integrations.id = sync_jobs.integration_id 
      AND integrations.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert sync jobs for their integrations" ON sync_jobs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM integrations 
      WHERE integrations.id = sync_jobs.integration_id 
      AND integrations.created_by = auth.uid()
    )
  );

-- RLS Policies for field_mappings
CREATE POLICY "Users can view field mappings for their integrations" ON field_mappings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM integrations 
      WHERE integrations.id = field_mappings.integration_id 
      AND integrations.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can manage field mappings for their integrations" ON field_mappings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM integrations 
      WHERE integrations.id = field_mappings.integration_id 
      AND integrations.created_by = auth.uid()
    )
  );

-- RLS Policies for webhook_subscriptions
CREATE POLICY "Users can view webhooks for their integrations" ON webhook_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM integrations 
      WHERE integrations.id = webhook_subscriptions.integration_id 
      AND integrations.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can manage webhooks for their integrations" ON webhook_subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM integrations 
      WHERE integrations.id = webhook_subscriptions.integration_id 
      AND integrations.created_by = auth.uid()
    )
  );

-- RLS Policies for customer_sync_mapping
CREATE POLICY "Users can view customer sync mappings for their integrations" ON customer_sync_mapping
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM integrations 
      WHERE integrations.id = customer_sync_mapping.integration_id 
      AND integrations.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can manage customer sync mappings for their integrations" ON customer_sync_mapping
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM integrations 
      WHERE integrations.id = customer_sync_mapping.integration_id 
      AND integrations.created_by = auth.uid()
    )
  );

-- RLS Policies for webhook_logs
CREATE POLICY "Users can view webhook logs for their integrations" ON webhook_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM webhook_subscriptions ws
      JOIN integrations i ON ws.integration_id = i.id
      WHERE ws.id = webhook_logs.webhook_subscription_id 
      AND i.created_by = auth.uid()
    )
  );

-- RLS Policies for integration_audit_logs
CREATE POLICY "Users can view audit logs for their integrations" ON integration_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM integrations 
      WHERE integrations.id = integration_audit_logs.integration_id 
      AND integrations.created_by = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_integrations_created_by ON integrations(created_by);
CREATE INDEX idx_integrations_type ON integrations(type);
CREATE INDEX idx_integrations_status ON integrations(status);
CREATE INDEX idx_sync_jobs_integration_id ON sync_jobs(integration_id);
CREATE INDEX idx_sync_jobs_status ON sync_jobs(status);
CREATE INDEX idx_field_mappings_integration_id ON field_mappings(integration_id);
CREATE INDEX idx_webhook_subscriptions_integration_id ON webhook_subscriptions(integration_id);
CREATE INDEX idx_customer_sync_mapping_customer_id ON customer_sync_mapping(customer_profile_id);
CREATE INDEX idx_customer_sync_mapping_integration_id ON customer_sync_mapping(integration_id);

-- Insert sample integrations for testing
INSERT INTO integrations (name, type, provider, status, configuration, credentials, sync_settings, created_by)
VALUES 
  ('Salesforce CRM', 'crm', 'salesforce', 'active', 
   '{"instanceUrl": "https://your-instance.salesforce.com", "apiVersion": "58.0"}',
   '{"clientId": "sample_client_id", "clientSecret": "encrypted_secret"}',
   '{"syncDirection": "bidirectional", "syncFrequency": 3600, "autoSync": true}',
   (SELECT id FROM profiles LIMIT 1)
  ),
  ('HubSpot CRM', 'crm', 'hubspot', 'active',
   '{"portalId": "123456", "appId": "sample_app_id"}',
   '{"apiKey": "sample_api_key"}',
   '{"syncDirection": "bidirectional", "syncFrequency": 1800, "autoSync": true}',
   (SELECT id FROM profiles LIMIT 1)
  ),
  ('Zendesk Support', 'helpdesk', 'zendesk', 'active',
   '{"subdomain": "yourcompany", "apiVersion": "v2"}',
   '{"email": "admin@yourcompany.com", "apiToken": "sample_token"}',
   '{"syncDirection": "bidirectional", "syncFrequency": 900, "autoSync": true}',
   (SELECT id FROM profiles LIMIT 1)
  ),
  ('Shopify Store', 'ecommerce', 'shopify', 'active',
   '{"shopDomain": "your-store.myshopify.com", "apiVersion": "2024-01"}',
   '{"accessToken": "sample_access_token", "webhookSecret": "sample_webhook_secret"}',
   '{"syncDirection": "inbound", "syncFrequency": 300, "autoSync": true}',
   (SELECT id FROM profiles LIMIT 1)
  )
ON CONFLICT DO NOTHING;

-- Insert sample field mappings
INSERT INTO field_mappings (integration_id, source_entity, target_entity, source_field, target_field, is_required)
SELECT 
  i.id,
  'customer',
  'contact',
  'email',
  'email',
  true
FROM integrations i 
WHERE i.provider = 'salesforce'
LIMIT 1;

INSERT INTO field_mappings (integration_id, source_entity, target_entity, source_field, target_field, is_required)
SELECT 
  i.id,
  'customer',
  'contact',
  'first_name',
  'firstname',
  true
FROM integrations i 
WHERE i.provider = 'salesforce'
LIMIT 1;

-- Insert sample webhook subscriptions
INSERT INTO webhook_subscriptions (integration_id, event_type, webhook_url, secret_key)
SELECT 
  i.id,
  'conversation.created',
  'https://your-webhook-endpoint.com/webhook',
  'sample_webhook_secret'
FROM integrations i 
WHERE i.provider = 'salesforce'
LIMIT 1;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for integrations table
CREATE TRIGGER update_integrations_updated_at 
    BEFORE UPDATE ON integrations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 