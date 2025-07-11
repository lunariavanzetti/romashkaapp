-- Supabase-Compatible Sample Data Script
-- This script creates test data that works with Supabase's auth system

-- ================================
-- IMPORTANT NOTE
-- ================================
-- This script assumes you have already created some test users through Supabase Auth
-- If you haven't, you can either:
-- 1. Create users through the Supabase dashboard
-- 2. Use the auth.users table directly (see alternative approach below)

-- ================================
-- APPROACH 1: Use existing authenticated users
-- ================================

-- First, let's see what users exist in auth.users
SELECT 'Current auth.users:' as info;
SELECT id, email, created_at FROM auth.users LIMIT 5;

-- ================================
-- APPROACH 2: Insert sample users directly (for testing only)
-- ================================
-- NOTE: This approach bypasses Supabase Auth and should only be used for testing

-- Temporarily disable triggers to allow direct insertion
ALTER TABLE auth.users DISABLE TRIGGER ALL;

-- Insert sample users directly into auth.users (testing only)
INSERT INTO auth.users (
    id, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    created_at, 
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
) VALUES
(
    '550e8400-e29b-41d4-a716-446655440000',
    'john.doe@example.com',
    '$2a$10$M8jqP8QqF9YqGQqF9YqGQqF9YqGQqF9YqGQqF9YqGQqF9YqGQqF9Y', -- dummy hash
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "John Doe"}',
    false,
    'authenticated'
),
(
    '550e8400-e29b-41d4-a716-446655440001',
    'jane.smith@example.com',
    '$2a$10$M8jqP8QqF9YqGQqF9YqGQqF9YqGQqF9YqGQqF9YqGQqF9YqGQqF9Y', -- dummy hash
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Jane Smith"}',
    false,
    'authenticated'
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    'admin@romashka.com',
    '$2a$10$M8jqP8QqF9YqGQqF9YqGQqF9YqGQqF9YqGQqF9YqGQqF9YqGQqF9Y', -- dummy hash
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Admin User"}',
    false,
    'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- Re-enable triggers
ALTER TABLE auth.users ENABLE TRIGGER ALL;

-- ================================
-- STEP 1: Create Profiles
-- ================================

-- Now insert profiles that reference the auth.users
INSERT INTO profiles (id, email, full_name, company_name, website_url, role, onboarding_completed) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'john.doe@example.com', 'John Doe', 'Tech Solutions Inc', 'https://techsolutions.com', 'user', true),
('550e8400-e29b-41d4-a716-446655440001', 'jane.smith@example.com', 'Jane Smith', 'Marketing Agency', 'https://marketing.com', 'user', true),
('550e8400-e29b-41d4-a716-446655440002', 'admin@romashka.com', 'Admin User', 'Romashka', 'https://romashka.com', 'admin', true)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    company_name = EXCLUDED.company_name,
    website_url = EXCLUDED.website_url,
    role = EXCLUDED.role,
    onboarding_completed = EXCLUDED.onboarding_completed;

-- ================================
-- STEP 2: Create Customer Profiles
-- ================================

INSERT INTO customer_profiles (id, email, name, phone, company, location, language, tags, status) VALUES
('650e8400-e29b-41d4-a716-446655440000', 'customer1@example.com', 'Alice Johnson', '+1234567890', 'ABC Corp', 'New York, USA', 'en', '{"vip", "enterprise"}', 'active'),
('650e8400-e29b-41d4-a716-446655440001', 'customer2@example.com', 'Bob Wilson', '+1234567891', 'XYZ Ltd', 'London, UK', 'en', '{"standard"}', 'active'),
('650e8400-e29b-41d4-a716-446655440002', 'customer3@example.com', 'Carlos Rodriguez', '+1234567892', 'Global Trade', 'Madrid, Spain', 'es', '{"new", "potential"}', 'active')
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    company = EXCLUDED.company,
    location = EXCLUDED.location,
    language = EXCLUDED.language,
    tags = EXCLUDED.tags,
    status = EXCLUDED.status;

-- ================================
-- STEP 3: Create User Agents
-- ================================

INSERT INTO user_agents (id, user_id, agent_id, agent_name, agent_type, agent_description, is_active, is_primary, agent_config, capabilities) VALUES
('750e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'agent-john-001', 'John''s AI Assistant', 'ai_assistant', 'Primary AI assistant for customer support', true, true, '{"model": "gpt-4", "temperature": 0.7}', '["chat", "knowledge_search", "task_automation"]'),
('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'agent-john-002', 'John''s Analytics Bot', 'analytics_bot', 'Specialized bot for analytics and reporting', true, false, '{"model": "gpt-4", "temperature": 0.3}', '["analytics", "reporting", "data_visualization"]'),
('750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'agent-jane-001', 'Jane''s Marketing Assistant', 'ai_assistant', 'Marketing-focused AI assistant', true, true, '{"model": "gpt-4", "temperature": 0.8}', '["marketing", "content_creation", "social_media"]'),
('750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'agent-admin-001', 'Admin Knowledge Bot', 'knowledge_bot', 'Knowledge management and processing bot', true, true, '{"model": "gpt-4", "temperature": 0.5}', '["knowledge_processing", "content_analysis", "data_extraction"]')
ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    agent_id = EXCLUDED.agent_id,
    agent_name = EXCLUDED.agent_name,
    agent_type = EXCLUDED.agent_type,
    agent_description = EXCLUDED.agent_description,
    is_active = EXCLUDED.is_active,
    is_primary = EXCLUDED.is_primary,
    agent_config = EXCLUDED.agent_config,
    capabilities = EXCLUDED.capabilities;

-- ================================
-- STEP 4: Create Communication Channels
-- ================================

INSERT INTO communication_channels (id, name, type, status, configuration, created_by) VALUES
('850e8400-e29b-41d4-a716-446655440000', 'Website Chat', 'website', 'active', '{"widget_id": "widget-001", "theme": "light"}', '550e8400-e29b-41d4-a716-446655440000'),
('850e8400-e29b-41d4-a716-446655440001', 'WhatsApp Business', 'whatsapp', 'active', '{"phone_number": "+1234567890", "business_id": "12345"}', '550e8400-e29b-41d4-a716-446655440001'),
('850e8400-e29b-41d4-a716-446655440002', 'Email Support', 'email', 'active', '{"email": "support@example.com", "imap_server": "imap.example.com"}', '550e8400-e29b-41d4-a716-446655440002')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    status = EXCLUDED.status,
    configuration = EXCLUDED.configuration,
    created_by = EXCLUDED.created_by;

-- ================================
-- STEP 5: Create Conversations
-- ================================

INSERT INTO conversations (id, customer_id, user_name, user_email, assigned_agent_id, status, priority, channel_type, channel_id, language, sentiment, intent, ai_confidence) VALUES
('950e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440000', 'Alice Johnson', 'customer1@example.com', '550e8400-e29b-41d4-a716-446655440000', 'active', 'high', 'website', '850e8400-e29b-41d4-a716-446655440000', 'en', 'neutral', 'support_inquiry', 0.85),
('950e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'Bob Wilson', 'customer2@example.com', '550e8400-e29b-41d4-a716-446655440001', 'resolved', 'normal', 'whatsapp', '850e8400-e29b-41d4-a716-446655440001', 'en', 'positive', 'product_inquiry', 0.92),
('950e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440002', 'Carlos Rodriguez', 'customer3@example.com', '550e8400-e29b-41d4-a716-446655440002', 'active', 'normal', 'email', '850e8400-e29b-41d4-a716-446655440002', 'es', 'neutral', 'billing_inquiry', 0.78)
ON CONFLICT (id) DO UPDATE SET
    customer_id = EXCLUDED.customer_id,
    user_name = EXCLUDED.user_name,
    user_email = EXCLUDED.user_email,
    assigned_agent_id = EXCLUDED.assigned_agent_id,
    status = EXCLUDED.status,
    priority = EXCLUDED.priority,
    channel_type = EXCLUDED.channel_type,
    channel_id = EXCLUDED.channel_id,
    language = EXCLUDED.language,
    sentiment = EXCLUDED.sentiment,
    intent = EXCLUDED.intent,
    ai_confidence = EXCLUDED.ai_confidence;

-- ================================
-- STEP 6: Create Messages
-- ================================

INSERT INTO messages (id, conversation_id, sender_type, sender_id, content, message_type, confidence_score, processing_time_ms, intent_detected, tokens_used) VALUES
('a50e8400-e29b-41d4-a716-446655440000', '950e8400-e29b-41d4-a716-446655440000', 'user', null, 'Hi, I need help with my account settings', 'text', null, null, 'account_help', null),
('a50e8400-e29b-41d4-a716-446655440001', '950e8400-e29b-41d4-a716-446655440000', 'ai', '550e8400-e29b-41d4-a716-446655440000', 'Hello! I''d be happy to help you with your account settings. What specific changes would you like to make?', 'text', 0.95, 150, 'account_help', 45),
('a50e8400-e29b-41d4-a716-446655440002', '950e8400-e29b-41d4-a716-446655440001', 'user', null, 'What are your pricing plans?', 'text', null, null, 'pricing_inquiry', null),
('a50e8400-e29b-41d4-a716-446655440003', '950e8400-e29b-41d4-a716-446655440001', 'ai', '550e8400-e29b-41d4-a716-446655440001', 'We offer three main pricing tiers: Basic ($29/month), Professional ($79/month), and Enterprise ($199/month). Each plan includes different features and support levels.', 'text', 0.98, 200, 'pricing_inquiry', 67)
ON CONFLICT (id) DO UPDATE SET
    conversation_id = EXCLUDED.conversation_id,
    sender_type = EXCLUDED.sender_type,
    sender_id = EXCLUDED.sender_id,
    content = EXCLUDED.content,
    message_type = EXCLUDED.message_type,
    confidence_score = EXCLUDED.confidence_score,
    processing_time_ms = EXCLUDED.processing_time_ms,
    intent_detected = EXCLUDED.intent_detected,
    tokens_used = EXCLUDED.tokens_used;

-- ================================
-- STEP 7: Create Knowledge Categories
-- ================================

INSERT INTO knowledge_categories (id, name, description, icon, color, is_active) VALUES
('b50e8400-e29b-41d4-a716-446655440000', 'General Support', 'General customer support information', 'help-circle', 'blue', true),
('b50e8400-e29b-41d4-a716-446655440001', 'Billing & Pricing', 'Billing and pricing related information', 'credit-card', 'green', true),
('b50e8400-e29b-41d4-a716-446655440002', 'Technical Issues', 'Technical troubleshooting guides', 'settings', 'red', true),
('b50e8400-e29b-41d4-a716-446655440003', 'Product Features', 'Product features and how-to guides', 'star', 'purple', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    is_active = EXCLUDED.is_active;

-- ================================
-- STEP 8: Create Knowledge Items
-- ================================

INSERT INTO knowledge_items (id, title, content, category_id, source_type, confidence_score, usage_count, effectiveness_score, language, tags, status, created_by) VALUES
('c50e8400-e29b-41d4-a716-446655440000', 'How to Reset Password', 'To reset your password: 1. Go to login page 2. Click "Forgot Password" 3. Enter your email 4. Check your inbox for reset link', 'b50e8400-e29b-41d4-a716-446655440000', 'manual', 0.95, 150, 0.92, 'en', '["password", "reset", "login"]', 'active', '550e8400-e29b-41d4-a716-446655440002'),
('c50e8400-e29b-41d4-a716-446655440001', 'Billing Cycle Information', 'Your billing cycle starts on the date you first subscribed. Monthly plans renew every 30 days, annual plans renew every 365 days.', 'b50e8400-e29b-41d4-a716-446655440001', 'manual', 0.88, 89, 0.85, 'en', '["billing", "cycle", "subscription"]', 'active', '550e8400-e29b-41d4-a716-446655440002'),
('c50e8400-e29b-41d4-a716-446655440002', 'API Rate Limits', 'API rate limits are: Free tier: 100 requests/hour, Pro tier: 1000 requests/hour, Enterprise: 10000 requests/hour', 'b50e8400-e29b-41d4-a716-446655440002', 'manual', 0.90, 67, 0.88, 'en', '["api", "rate", "limits"]', 'active', '550e8400-e29b-41d4-a716-446655440002')
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    category_id = EXCLUDED.category_id,
    source_type = EXCLUDED.source_type,
    confidence_score = EXCLUDED.confidence_score,
    usage_count = EXCLUDED.usage_count,
    effectiveness_score = EXCLUDED.effectiveness_score,
    language = EXCLUDED.language,
    tags = EXCLUDED.tags,
    status = EXCLUDED.status,
    created_by = EXCLUDED.created_by;

-- ================================
-- STEP 9: Create Agent Work Logs
-- ================================

INSERT INTO agent_work_logs (id, agent_id, agent_name, user_id, task_type, task_description, input_data, output_data, status, started_at, completed_at, execution_time_ms, metadata) VALUES
('d50e8400-e29b-41d4-a716-446655440000', 'agent-john-001', 'John''s AI Assistant', '550e8400-e29b-41d4-a716-446655440000', 'conversation', 'Handle customer inquiry about account settings', '{"customer_id": "650e8400-e29b-41d4-a716-446655440000", "message": "Hi, I need help with my account settings"}', '{"response": "Hello! I''d be happy to help you with your account settings. What specific changes would you like to make?", "confidence": 0.95}', 'completed', NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '9 minutes 30 seconds', 30000, '{"conversation_id": "950e8400-e29b-41d4-a716-446655440000", "model_used": "gpt-4"}'),

('d50e8400-e29b-41d4-a716-446655440001', 'agent-jane-001', 'Jane''s Marketing Assistant', '550e8400-e29b-41d4-a716-446655440001', 'conversation', 'Answer pricing inquiry from potential customer', '{"customer_id": "650e8400-e29b-41d4-a716-446655440001", "message": "What are your pricing plans?"}', '{"response": "We offer three main pricing tiers: Basic ($29/month), Professional ($79/month), and Enterprise ($199/month).", "confidence": 0.98}', 'completed', NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '4 minutes 40 seconds', 20000, '{"conversation_id": "950e8400-e29b-41d4-a716-446655440001", "model_used": "gpt-4"}'),

('d50e8400-e29b-41d4-a716-446655440002', 'agent-admin-001', 'Admin Knowledge Bot', '550e8400-e29b-41d4-a716-446655440002', 'knowledge_processing', 'Process and analyze new knowledge base article', '{"article_id": "c50e8400-e29b-41d4-a716-446655440000", "title": "How to Reset Password"}', '{"tags_extracted": ["password", "reset", "login"], "confidence_score": 0.95, "category_suggestion": "General Support"}', 'completed', NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '14 minutes 30 seconds', 30000, '{"processing_type": "nlp_analysis", "model_used": "gpt-4"}'),

('d50e8400-e29b-41d4-a716-446655440003', 'agent-john-002', 'John''s Analytics Bot', '550e8400-e29b-41d4-a716-446655440000', 'content_analysis', 'Analyze conversation sentiment and intent', '{"conversation_id": "950e8400-e29b-41d4-a716-446655440000", "messages": ["Hi, I need help with my account settings"]}', '{"sentiment": "neutral", "intent": "account_help", "confidence": 0.85, "priority": "high"}', 'completed', NOW() - INTERVAL '8 minutes', NOW() - INTERVAL '7 minutes 45 seconds', 15000, '{"analysis_type": "sentiment_intent", "model_used": "gpt-4"}'),

('d50e8400-e29b-41d4-a716-446655440004', 'agent-john-001', 'John''s AI Assistant', '550e8400-e29b-41d4-a716-446655440000', 'automation', 'Automatic follow-up task scheduling', '{"conversation_id": "950e8400-e29b-41d4-a716-446655440000", "follow_up_type": "satisfaction_survey"}', '{"task_scheduled": true, "scheduled_time": "2024-01-16T10:00:00Z", "task_id": "task-001"}', 'completed', NOW() - INTERVAL '3 minutes', NOW() - INTERVAL '2 minutes 50 seconds', 10000, '{"automation_type": "follow_up_scheduling", "workflow_id": "wf-001"}'),

('d50e8400-e29b-41d4-a716-446655440005', 'agent-jane-001', 'Jane''s Marketing Assistant', '550e8400-e29b-41d4-a716-446655440001', 'workflow_execution', 'Execute lead qualification workflow', '{"customer_id": "650e8400-e29b-41d4-a716-446655440001", "conversation_context": "pricing_inquiry"}', '{"lead_score": 85, "qualification_status": "qualified", "recommended_actions": ["send_pricing_sheet", "schedule_demo"]}', 'in_progress', NOW() - INTERVAL '2 minutes', null, null, '{"workflow_id": "wf-lead-qualification", "current_step": "scoring"}'),

('d50e8400-e29b-41d4-a716-446655440006', 'agent-admin-001', 'Admin Knowledge Bot', '550e8400-e29b-41d4-a716-446655440002', 'knowledge_processing', 'Failed to process corrupted document', '{"document_id": "doc-corrupted-001", "file_type": "pdf"}', '{}', 'failed', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '29 minutes', 60000, '{"error_type": "document_corruption", "retry_count": 3}')
ON CONFLICT (id) DO UPDATE SET
    agent_id = EXCLUDED.agent_id,
    agent_name = EXCLUDED.agent_name,
    user_id = EXCLUDED.user_id,
    task_type = EXCLUDED.task_type,
    task_description = EXCLUDED.task_description,
    input_data = EXCLUDED.input_data,
    output_data = EXCLUDED.output_data,
    status = EXCLUDED.status,
    started_at = EXCLUDED.started_at,
    completed_at = EXCLUDED.completed_at,
    execution_time_ms = EXCLUDED.execution_time_ms,
    metadata = EXCLUDED.metadata;

-- ================================
-- STEP 10: Create Agent Availability
-- ================================

INSERT INTO agent_availability (id, agent_id, is_online, status, max_concurrent_chats, current_chat_count, last_activity) VALUES
('e50e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', true, 'available', 10, 2, NOW() - INTERVAL '5 minutes'),
('e50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', true, 'available', 8, 1, NOW() - INTERVAL '3 minutes'),
('e50e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', false, 'offline', 5, 0, NOW() - INTERVAL '2 hours')
ON CONFLICT (id) DO UPDATE SET
    agent_id = EXCLUDED.agent_id,
    is_online = EXCLUDED.is_online,
    status = EXCLUDED.status,
    max_concurrent_chats = EXCLUDED.max_concurrent_chats,
    current_chat_count = EXCLUDED.current_chat_count,
    last_activity = EXCLUDED.last_activity;

-- ================================
-- STEP 11: Create Canned Responses
-- ================================

INSERT INTO canned_responses (title, content, shortcut, category, language, created_by, is_public, tags) VALUES
('Welcome Greeting', 'Hello! Welcome to our support chat. How can I help you today?', '/welcome', 'greetings', 'en', '550e8400-e29b-41d4-a716-446655440000', true, '["greeting", "welcome"]'),
('Pricing Information', 'You can find our current pricing plans on our website. Would you like me to walk you through the options?', '/pricing', 'sales', 'en', '550e8400-e29b-41d4-a716-446655440001', true, '["pricing", "sales"]'),
('Technical Support', 'I see you''re experiencing a technical issue. Let me help you troubleshoot this step by step.', '/tech', 'support', 'en', '550e8400-e29b-41d4-a716-446655440002', true, '["technical", "support"]'),
('Thank You', 'Thank you for contacting us! Is there anything else I can help you with?', '/thanks', 'general', 'en', '550e8400-e29b-41d4-a716-446655440000', true, '["thanks", "closing"]')
ON CONFLICT (title) DO UPDATE SET
    content = EXCLUDED.content,
    shortcut = EXCLUDED.shortcut,
    category = EXCLUDED.category,
    language = EXCLUDED.language,
    created_by = EXCLUDED.created_by,
    is_public = EXCLUDED.is_public,
    tags = EXCLUDED.tags;

-- ================================
-- STEP 12: Update Statistics
-- ================================

-- Update conversation message counts
UPDATE conversations SET message_count = (
    SELECT COUNT(*) FROM messages WHERE conversation_id = conversations.id
);

-- Update knowledge item usage counts (simulate some usage)
UPDATE knowledge_items SET usage_count = usage_count + FLOOR(RANDOM() * 50) + 10;

-- Update customer conversation counts
UPDATE customer_profiles SET total_conversations = (
    SELECT COUNT(*) FROM conversations WHERE customer_id = customer_profiles.id
);

-- ================================
-- STEP 13: Verification
-- ================================

-- Verify data was inserted correctly
SELECT 'DATA VERIFICATION' as section;

SELECT 
    'profiles' as table_name,
    COUNT(*) as record_count
FROM profiles
UNION ALL
SELECT 
    'user_agents' as table_name,
    COUNT(*) as record_count
FROM user_agents
UNION ALL
SELECT 
    'agent_work_logs' as table_name,
    COUNT(*) as record_count
FROM agent_work_logs
UNION ALL
SELECT 
    'conversations' as table_name,
    COUNT(*) as record_count
FROM conversations
UNION ALL
SELECT 
    'messages' as table_name,
    COUNT(*) as record_count
FROM messages;

-- Show agent performance metrics
SELECT 
    'AGENT PERFORMANCE METRICS' as section,
    agent_name,
    total_tasks,
    completed_tasks,
    success_rate,
    avg_execution_time_ms
FROM agent_performance_metrics
ORDER BY success_rate DESC;

-- Show current auth users
SELECT 'AUTH USERS VERIFICATION' as section;
SELECT id, email, created_at FROM auth.users;

SELECT 'SUPABASE-COMPATIBLE SAMPLE DATA LOADED SUCCESSFULLY!' as status;