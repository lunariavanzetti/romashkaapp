-- OAuth Integrations Tables
-- For storing OAuth tokens and integration-specific data

-- OAuth Tokens table for securely storing access tokens
CREATE TABLE IF NOT EXISTS oauth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'shopify', 'salesforce', 'hubspot'
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_type VARCHAR(20) DEFAULT 'Bearer',
    expires_at TIMESTAMP WITH TIME ZONE,
    scope TEXT,
    store_identifier TEXT, -- shop domain for Shopify, instance URL for Salesforce, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shopify specific data
CREATE TABLE IF NOT EXISTS shopify_stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    oauth_token_id UUID REFERENCES oauth_tokens(id) ON DELETE CASCADE,
    shop_domain VARCHAR(255) NOT NULL,
    shop_name VARCHAR(255),
    email VARCHAR(255),
    currency VARCHAR(10),
    timezone VARCHAR(50),
    country_code VARCHAR(10),
    webhook_secret VARCHAR(255),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Salesforce specific data
CREATE TABLE IF NOT EXISTS salesforce_orgs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    oauth_token_id UUID REFERENCES oauth_tokens(id) ON DELETE CASCADE,
    instance_url VARCHAR(255) NOT NULL,
    org_id VARCHAR(50),
    org_name VARCHAR(255),
    org_type VARCHAR(50),
    api_version VARCHAR(10) DEFAULT 'v59.0',
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HubSpot specific data
CREATE TABLE IF NOT EXISTS hubspot_portals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    oauth_token_id UUID REFERENCES oauth_tokens(id) ON DELETE CASCADE,
    portal_id VARCHAR(50) NOT NULL,
    hub_domain VARCHAR(255),
    hub_id VARCHAR(50),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Synced data tables
CREATE TABLE IF NOT EXISTS synced_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    external_id VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    title VARCHAR(255),
    lead_source VARCHAR(255),
    data JSONB, -- Store full provider-specific data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, provider, external_id)
);

CREATE TABLE IF NOT EXISTS synced_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    external_id VARCHAR(255) NOT NULL,
    order_number VARCHAR(255),
    customer_email VARCHAR(255),
    total_amount DECIMAL(10,2),
    currency VARCHAR(10),
    status VARCHAR(50),
    items JSONB,
    data JSONB, -- Store full provider-specific data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, provider, external_id)
);

CREATE TABLE IF NOT EXISTS synced_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    external_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    currency VARCHAR(10),
    sku VARCHAR(255),
    inventory_quantity INTEGER,
    status VARCHAR(50),
    data JSONB, -- Store full provider-specific data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, provider, external_id)
);

CREATE TABLE IF NOT EXISTS synced_deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    external_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2),
    stage VARCHAR(255),
    close_date DATE,
    probability INTEGER,
    contact_id VARCHAR(255),
    data JSONB, -- Store full provider-specific data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, provider, external_id)
);

CREATE TABLE IF NOT EXISTS integration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL, -- 'oauth_connect', 'sync_contacts', 'webhook_received', etc.
    status VARCHAR(20) NOT NULL, -- 'success', 'error', 'pending'
    message TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_provider ON oauth_tokens(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_synced_contacts_user_provider ON synced_contacts(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_synced_orders_user_provider ON synced_orders(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_synced_products_user_provider ON synced_products(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_synced_deals_user_provider ON synced_deals(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_integration_logs_user_provider ON integration_logs(user_id, provider);

-- Row Level Security (RLS)
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopify_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE salesforce_orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hubspot_portals ENABLE ROW LEVEL SECURITY;
ALTER TABLE synced_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE synced_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE synced_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE synced_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only see their own data
CREATE POLICY "Users can manage their own oauth tokens" ON oauth_tokens
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own shopify stores" ON shopify_stores
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own salesforce orgs" ON salesforce_orgs
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own hubspot portals" ON hubspot_portals
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own synced contacts" ON synced_contacts
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own synced orders" ON synced_orders
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own synced products" ON synced_products
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own synced deals" ON synced_deals
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own integration logs" ON integration_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Triggers for updating updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_oauth_tokens_updated_at BEFORE UPDATE ON oauth_tokens 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopify_stores_updated_at BEFORE UPDATE ON shopify_stores 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_salesforce_orgs_updated_at BEFORE UPDATE ON salesforce_orgs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hubspot_portals_updated_at BEFORE UPDATE ON hubspot_portals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_synced_contacts_updated_at BEFORE UPDATE ON synced_contacts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_synced_orders_updated_at BEFORE UPDATE ON synced_orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_synced_products_updated_at BEFORE UPDATE ON synced_products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_synced_deals_updated_at BEFORE UPDATE ON synced_deals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();