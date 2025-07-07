-- Romashka Database Schema Setup
-- Run this in your Supabase SQL Editor

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  company_name TEXT,
  website_url TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to existing profiles table (if it exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'onboarding_completed') THEN
    ALTER TABLE profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'onboarding_data') THEN
    ALTER TABLE profiles ADD COLUMN onboarding_data JSONB DEFAULT '{}';
  END IF;
END $$;

-- Create workflows table
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  nodes JSONB NOT NULL DEFAULT '[]',
  connections JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workflow executions table
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL,
  current_node_id TEXT,
  context JSONB DEFAULT '{}',
  status TEXT DEFAULT 'running',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations table with full schema for the Conversations component
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message TEXT,
  message_count INTEGER DEFAULT 0,
  agent_id UUID REFERENCES profiles(id),
  priority VARCHAR(20) DEFAULT 'medium',
  tags TEXT[],
  satisfaction_score DECIMAL(3,2),
  -- AI enhancements
  language VARCHAR(10) DEFAULT 'en',
  sentiment VARCHAR(20),
  intent VARCHAR(100),
  ai_confidence DECIMAL(3,2),
  business_context JSONB,
  -- Legacy workflow support
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE
);

-- Create messages table with full schema for the Conversations component
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL, -- 'user', 'ai', or 'agent'
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB,
  -- AI enhancements
  confidence_score DECIMAL(3,2),
  processing_time_ms INTEGER,
  intent_detected VARCHAR(100),
  knowledge_sources JSONB,
  tokens_used INTEGER
);

-- Create knowledge base table
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usage_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0
);

-- Create intent patterns table
CREATE TABLE IF NOT EXISTS intent_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_name VARCHAR(100) NOT NULL,
  language VARCHAR(10) NOT NULL,
  patterns TEXT[] NOT NULL,
  examples JSONB,
  confidence_threshold DECIMAL(3,2) DEFAULT 0.8,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversation context table
CREATE TABLE IF NOT EXISTS conversation_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) UNIQUE,
  context_data JSONB NOT NULL,
  last_intent VARCHAR(100),
  conversation_summary TEXT,
  key_entities JSONB,
  customer_preferences JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE intent_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_context ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create policies for workflows
CREATE POLICY "Users can view own workflows" ON workflows
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own workflows" ON workflows
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workflows" ON workflows
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own workflows" ON workflows
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for workflow executions
CREATE POLICY "Users can view own workflow executions" ON workflow_executions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workflows 
      WHERE workflows.id = workflow_executions.workflow_id 
      AND workflows.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own workflow executions" ON workflow_executions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workflows 
      WHERE workflows.id = workflow_executions.workflow_id 
      AND workflows.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own workflow executions" ON workflow_executions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workflows 
      WHERE workflows.id = workflow_executions.workflow_id 
      AND workflows.user_id = auth.uid()
    )
  );

-- Create policies for conversations (allow all authenticated users to view for demo)
CREATE POLICY "Allow authenticated users to view conversations" ON conversations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert conversations" ON conversations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update conversations" ON conversations
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Create policies for messages (allow all authenticated users to view for demo)
CREATE POLICY "Allow authenticated users to view messages" ON messages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert messages" ON messages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policies for knowledge base (allow all authenticated users to view)
CREATE POLICY "Allow authenticated users to view knowledge base" ON knowledge_base
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create policies for intent patterns (allow all authenticated users to view)
CREATE POLICY "Allow authenticated users to view intent patterns" ON intent_patterns
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create policies for conversation context (allow all authenticated users to view)
CREATE POLICY "Allow authenticated users to view conversation context" ON conversation_context
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert conversation context" ON conversation_context
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update conversation context" ON conversation_context
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, company_name, website_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'fullName',
    NEW.raw_user_meta_data->>'companyName',
    NEW.raw_user_meta_data->>'websiteUrl'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at
  BEFORE UPDATE ON workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_executions_updated_at
  BEFORE UPDATE ON workflow_executions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some default intent patterns for demo
INSERT INTO intent_patterns (intent_name, language, patterns, examples) VALUES
('pricing_inquiry', 'en', ARRAY['price', 'cost', 'how much', 'pricing', 'plan'], '{"examples": ["How much does it cost?", "What are your pricing plans?"]}'),
('product_info', 'en', ARRAY['product', 'feature', 'specification', 'what is', 'tell me about'], '{"examples": ["Tell me about your product", "What features do you have?"]}'),
('support_request', 'en', ARRAY['help', 'problem', 'issue', 'broken', 'not working'], '{"examples": ["I need help", "There is a problem"]}'),
('order_status', 'en', ARRAY['order', 'shipping', 'delivery', 'track', 'status'], '{"examples": ["Where is my order?", "Track my delivery"]}'),
('return_refund', 'en', ARRAY['return', 'refund', 'exchange', 'money back'], '{"examples": ["I want to return this", "Can I get a refund?"]}'),
('billing_question', 'en', ARRAY['bill', 'payment', 'invoice', 'charge'], '{"examples": ["I have a billing question", "Payment issue"]}'),
('general_inquiry', 'en', ARRAY['question', 'information', 'general'], '{"examples": ["I have a question", "General information"]}'),
('booking_appointment', 'en', ARRAY['schedule', 'appointment', 'meeting', 'demo'], '{"examples": ["I want to schedule", "Book an appointment"]}'),
('complaint', 'en', ARRAY['complaint', 'unhappy', 'dissatisfied', 'bad'], '{"examples": ["I am unhappy", "I have a complaint"]}'),
('compliment', 'en', ARRAY['great', 'amazing', 'love', 'excellent'], '{"examples": ["This is great", "I love your service"]}')
ON CONFLICT DO NOTHING; 