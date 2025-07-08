-- Migration 003: Agent Management & Advanced Chat Features
-- Creates tables for agent availability, canned responses, and chat management

-- Agent availability and status tracking
CREATE TABLE IF NOT EXISTS agent_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  is_online BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'available',
  max_concurrent_chats INTEGER DEFAULT 5,
  current_chat_count INTEGER DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  auto_away_time INTEGER DEFAULT 300,
  working_hours JSONB DEFAULT '{"monday": {"start": "09:00", "end": "17:00"}, "tuesday": {"start": "09:00", "end": "17:00"}, "wednesday": {"start": "09:00", "end": "17:00"}, "thursday": {"start": "09:00", "end": "17:00"}, "friday": {"start": "09:00", "end": "17:00"}}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Canned responses with categories
CREATE TABLE IF NOT EXISTS canned_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  shortcut VARCHAR(50),
  category VARCHAR(100) DEFAULT 'general',
  language VARCHAR(10) DEFAULT 'en',
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation notes and internal comments
CREATE TABLE IF NOT EXISTS conversation_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT true,
  note_type VARCHAR(50) DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File attachments and media storage
CREATE TABLE IF NOT EXISTS file_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  file_hash VARCHAR(64),
  uploaded_by UUID REFERENCES profiles(id),
  storage_provider VARCHAR(50) DEFAULT 'supabase',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation transfers
CREATE TABLE IF NOT EXISTS conversation_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  from_agent_id UUID REFERENCES profiles(id),
  to_agent_id UUID REFERENCES profiles(id),
  transfer_reason TEXT,
  transfer_type VARCHAR(50) DEFAULT 'manual',
  transfer_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'pending'
);

-- SLA tracking
CREATE TABLE IF NOT EXISTS sla_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sla_type VARCHAR(50) NOT NULL,
  target_time_seconds INTEGER NOT NULL,
  actual_time_seconds INTEGER,
  status VARCHAR(20) DEFAULT 'pending',
  breach_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE agent_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE canned_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_tracking ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Allow authenticated access" ON agent_availability
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON canned_responses
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON conversation_notes
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON file_attachments
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON conversation_transfers
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON sla_tracking
  FOR ALL USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_availability_agent_id ON agent_availability(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_availability_is_online ON agent_availability(is_online);
CREATE INDEX IF NOT EXISTS idx_canned_responses_category ON canned_responses(category);
CREATE INDEX IF NOT EXISTS idx_canned_responses_shortcut ON canned_responses(shortcut);
CREATE INDEX IF NOT EXISTS idx_canned_responses_language ON canned_responses(language);
CREATE INDEX IF NOT EXISTS idx_conversation_notes_conversation_id ON conversation_notes(conversation_id);
CREATE INDEX IF NOT EXISTS idx_file_attachments_conversation_id ON file_attachments(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_transfers_conversation_id ON conversation_transfers(conversation_id);

-- Triggers for updated_at
CREATE TRIGGER update_agent_availability_updated_at
  BEFORE UPDATE ON agent_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_canned_responses_updated_at
  BEFORE UPDATE ON canned_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversation_notes_updated_at
  BEFORE UPDATE ON conversation_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update conversation message count
CREATE OR REPLACE FUNCTION update_conversation_message_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET message_count = (
    SELECT COUNT(*) 
    FROM messages 
    WHERE conversation_id = NEW.conversation_id
  ),
  last_message = NEW.content,
  last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation on new message
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_message_count();

-- Function to update agent current chat count
CREATE OR REPLACE FUNCTION update_agent_chat_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the agent's current chat count
  UPDATE agent_availability 
  SET current_chat_count = (
    SELECT COUNT(*) 
    FROM conversations 
    WHERE assigned_agent_id = COALESCE(NEW.assigned_agent_id, OLD.assigned_agent_id)
    AND status = 'active'
  )
  WHERE agent_id = COALESCE(NEW.assigned_agent_id, OLD.assigned_agent_id);
  
  -- If this is an assignment change, update both agents
  IF (TG_OP = 'UPDATE' AND OLD.assigned_agent_id IS DISTINCT FROM NEW.assigned_agent_id) THEN
    -- Update old agent's count
    IF OLD.assigned_agent_id IS NOT NULL THEN
      UPDATE agent_availability 
      SET current_chat_count = (
        SELECT COUNT(*) 
        FROM conversations 
        WHERE assigned_agent_id = OLD.assigned_agent_id
        AND status = 'active'
      )
      WHERE agent_id = OLD.assigned_agent_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update agent chat count on conversation changes
CREATE TRIGGER update_agent_chat_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_agent_chat_count();

-- Function to update canned response usage count
CREATE OR REPLACE FUNCTION update_canned_response_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the message content matches any canned response shortcut
  UPDATE canned_responses 
  SET usage_count = usage_count + 1
  WHERE shortcut IS NOT NULL 
  AND NEW.content LIKE '%' || shortcut || '%';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update canned response usage
CREATE TRIGGER update_canned_response_usage_trigger
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_canned_response_usage();

-- Default canned responses
INSERT INTO canned_responses (title, content, shortcut, category, language) VALUES
('Welcome Greeting', 'Hello! Welcome to our support chat. How can I help you today?', '/welcome', 'Greetings', 'en'),
('Thank You', 'Thank you for contacting us! Is there anything else I can help you with?', '/thanks', 'General', 'en'),
('Please Wait', 'Thank you for your patience. Let me look into this for you.', '/wait', 'General', 'en'),
('Escalation', 'I understand your concern. Let me connect you with a specialist who can better assist you.', '/escalate', 'Support', 'en'),
('Pricing Info', 'You can find our current pricing plans on our website. Would you like me to walk you through the options?', '/pricing', 'Sales', 'en'),
('Technical Issue', 'I see you''re experiencing a technical issue. Let me help you troubleshoot this step by step.', '/tech', 'Support', 'en'),
('Account Help', 'I can help you with your account settings. What specifically would you like to modify?', '/account', 'Support', 'en'),
('Billing Question', 'I''d be happy to help with your billing question. Could you provide your account number?', '/billing', 'Billing', 'en'),
('Follow Up', 'I''ll follow up with you within 24 hours with more information.', '/followup', 'General', 'en'),
('Closing', 'Is there anything else I can help you with today? Have a great day!', '/close', 'General', 'en')
ON CONFLICT (title) DO NOTHING;

-- Default SLA rules (can be configured per customer later)
INSERT INTO sla_tracking (conversation_id, sla_type, target_time_seconds, status)
SELECT 
  id,
  'first_response',
  300, -- 5 minutes
  'pending'
FROM conversations 
WHERE NOT EXISTS (
  SELECT 1 FROM sla_tracking 
  WHERE conversation_id = conversations.id 
  AND sla_type = 'first_response'
);

-- Migration complete
SELECT 'Migration 003: Agent Management & Advanced Chat Features Complete' as status;