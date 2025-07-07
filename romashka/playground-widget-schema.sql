-- Playground Sessions Table
CREATE TABLE IF NOT EXISTS playground_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  session_name VARCHAR(255),
  bot_configuration JSONB NOT NULL,
  test_conversations JSONB DEFAULT '[]',
  performance_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Widget Configurations Table
CREATE TABLE IF NOT EXISTS widget_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  widget_name VARCHAR(255),
  domain VARCHAR(255),
  configuration JSONB NOT NULL,
  embed_code TEXT,
  status VARCHAR(50) DEFAULT 'active',
  install_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
); 