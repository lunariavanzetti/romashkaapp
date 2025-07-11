-- Simple Sample Data Script for Supabase
-- This script works with whatever user is currently authenticated

-- ================================
-- APPROACH: Use current authenticated user
-- ================================

-- Check if user is authenticated
SELECT 
    CASE 
        WHEN auth.uid() IS NOT NULL THEN 'Authenticated user found: ' || auth.uid()::text
        ELSE 'ERROR: No authenticated user found. Please log in first.'
    END as auth_status;

-- Get current user info
SELECT 
    id,
    email,
    created_at
FROM auth.users 
WHERE id = auth.uid();

-- ================================
-- STEP 1: Create profile for current user
-- ================================

-- Insert/update profile for current user
INSERT INTO profiles (id, email, full_name, company_name, website_url, role, onboarding_completed) 
SELECT 
    auth.uid(),
    COALESCE(au.email, 'user@example.com'),
    COALESCE(au.raw_user_meta_data->>'full_name', 'Test User'),
    'Test Company',
    'https://example.com',
    'user',
    true
FROM auth.users au
WHERE au.id = auth.uid()
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    company_name = EXCLUDED.company_name,
    website_url = EXCLUDED.website_url,
    role = EXCLUDED.role,
    onboarding_completed = EXCLUDED.onboarding_completed;

-- ================================
-- STEP 2: Create customer profiles
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
-- STEP 3: Create user agents for current user
-- ================================

-- Generate unique agent IDs based on current user
INSERT INTO user_agents (id, user_id, agent_id, agent_name, agent_type, agent_description, is_active, is_primary, agent_config, capabilities) VALUES
(gen_random_uuid(), auth.uid(), 'agent-' || auth.uid()::text || '-001', 'My AI Assistant', 'ai_assistant', 'Primary AI assistant for customer support', true, true, '{"model": "gpt-4", "temperature": 0.7}', '{"chat", "knowledge_search", "task_automation"}'),
(gen_random_uuid(), auth.uid(), 'agent-' || auth.uid()::text || '-002', 'My Analytics Bot', 'analytics_bot', 'Specialized bot for analytics and reporting', true, false, '{"model": "gpt-4", "temperature": 0.3}', '{"analytics", "reporting", "data_visualization"}'),
(gen_random_uuid(), auth.uid(), 'agent-' || auth.uid()::text || '-003', 'My Knowledge Bot', 'knowledge_bot', 'Knowledge management and processing bot', true, false, '{"model": "gpt-4", "temperature": 0.5}', '{"knowledge_processing", "content_analysis", "data_extraction"}')
ON CONFLICT (agent_id) DO UPDATE SET
    agent_name = EXCLUDED.agent_name,
    agent_type = EXCLUDED.agent_type,
    agent_description = EXCLUDED.agent_description,
    is_active = EXCLUDED.is_active,
    is_primary = EXCLUDED.is_primary,
    agent_config = EXCLUDED.agent_config,
    capabilities = EXCLUDED.capabilities;

-- ================================
-- STEP 4: Create communication channels
-- ================================

INSERT INTO communication_channels (id, name, type, status, configuration, created_by) VALUES
(gen_random_uuid(), 'Website Chat', 'website', 'active', '{"widget_id": "widget-001", "theme": "light"}', auth.uid()),
(gen_random_uuid(), 'WhatsApp Business', 'whatsapp', 'active', '{"phone_number": "+1234567890", "business_id": "12345"}', auth.uid()),
(gen_random_uuid(), 'Email Support', 'email', 'active', '{"email": "support@example.com", "imap_server": "imap.example.com"}', auth.uid())
ON CONFLICT (id) DO NOTHING;

-- ================================
-- STEP 5: Create conversations
-- ================================

-- Create conversations with current user as agent
INSERT INTO conversations (id, customer_id, user_name, user_email, assigned_agent_id, status, priority, channel_type, language, sentiment, intent, ai_confidence) VALUES
(gen_random_uuid(), '650e8400-e29b-41d4-a716-446655440000', 'Alice Johnson', 'customer1@example.com', auth.uid(), 'active', 'high', 'website', 'en', 'neutral', 'support_inquiry', 0.85),
(gen_random_uuid(), '650e8400-e29b-41d4-a716-446655440001', 'Bob Wilson', 'customer2@example.com', auth.uid(), 'resolved', 'normal', 'whatsapp', 'en', 'positive', 'product_inquiry', 0.92),
(gen_random_uuid(), '650e8400-e29b-41d4-a716-446655440002', 'Carlos Rodriguez', 'customer3@example.com', auth.uid(), 'active', 'normal', 'email', 'es', 'neutral', 'billing_inquiry', 0.78)
ON CONFLICT (id) DO NOTHING;

-- ================================
-- STEP 6: Create messages
-- ================================

-- Get conversation IDs for message creation
WITH conversation_ids AS (
    SELECT id as conv_id, customer_id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
    FROM conversations 
    WHERE assigned_agent_id = auth.uid()
    LIMIT 3
)
INSERT INTO messages (id, conversation_id, sender_type, sender_id, content, message_type, confidence_score, processing_time_ms, intent_detected, tokens_used)
SELECT
    gen_random_uuid(),
    ci.conv_id,
    'user',
    null,
    CASE ci.rn
        WHEN 1 THEN 'Hi, I need help with my account settings'
        WHEN 2 THEN 'What are your pricing plans?'
        WHEN 3 THEN 'I have a billing question'
    END,
    'text',
    null,
    null,
    CASE ci.rn
        WHEN 1 THEN 'account_help'
        WHEN 2 THEN 'pricing_inquiry'
        WHEN 3 THEN 'billing_inquiry'
    END,
    null
FROM conversation_ids ci
ON CONFLICT (id) DO NOTHING;

-- Add AI responses
WITH conversation_ids AS (
    SELECT id as conv_id, customer_id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
    FROM conversations 
    WHERE assigned_agent_id = auth.uid()
    LIMIT 3
)
INSERT INTO messages (id, conversation_id, sender_type, sender_id, content, message_type, confidence_score, processing_time_ms, intent_detected, tokens_used)
SELECT
    gen_random_uuid(),
    ci.conv_id,
    'ai',
    auth.uid(),
    CASE ci.rn
        WHEN 1 THEN 'Hello! I''d be happy to help you with your account settings. What specific changes would you like to make?'
        WHEN 2 THEN 'We offer three main pricing tiers: Basic ($29/month), Professional ($79/month), and Enterprise ($199/month). Each plan includes different features and support levels.'
        WHEN 3 THEN 'I can help you with your billing question. Could you please provide more details about your specific concern?'
    END,
    'text',
    0.95,
    150,
    CASE ci.rn
        WHEN 1 THEN 'account_help'
        WHEN 2 THEN 'pricing_inquiry'
        WHEN 3 THEN 'billing_inquiry'
    END,
    45
FROM conversation_ids ci
ON CONFLICT (id) DO NOTHING;

-- ================================
-- STEP 7: Create knowledge categories
-- ================================

INSERT INTO knowledge_categories (id, name, description, icon, color, is_active) VALUES
(gen_random_uuid(), 'General Support', 'General customer support information', 'help-circle', 'blue', true),
(gen_random_uuid(), 'Billing & Pricing', 'Billing and pricing related information', 'credit-card', 'green', true),
(gen_random_uuid(), 'Technical Issues', 'Technical troubleshooting guides', 'settings', 'red', true),
(gen_random_uuid(), 'Product Features', 'Product features and how-to guides', 'star', 'purple', true)
ON CONFLICT (id) DO NOTHING;

-- ================================
-- STEP 8: Create knowledge items
-- ================================

WITH categories AS (
    SELECT id as cat_id, name, ROW_NUMBER() OVER (ORDER BY created_at) as rn
    FROM knowledge_categories
    WHERE is_active = true
    LIMIT 3
)
INSERT INTO knowledge_items (id, title, content, category_id, source_type, confidence_score, usage_count, effectiveness_score, language, tags, status, created_by)
SELECT
    gen_random_uuid(),
    CASE c.rn
        WHEN 1 THEN 'How to Reset Password'
        WHEN 2 THEN 'Billing Cycle Information'
        WHEN 3 THEN 'API Rate Limits'
    END,
    CASE c.rn
        WHEN 1 THEN 'To reset your password: 1. Go to login page 2. Click "Forgot Password" 3. Enter your email 4. Check your inbox for reset link'
        WHEN 2 THEN 'Your billing cycle starts on the date you first subscribed. Monthly plans renew every 30 days, annual plans renew every 365 days.'
        WHEN 3 THEN 'API rate limits are: Free tier: 100 requests/hour, Pro tier: 1000 requests/hour, Enterprise: 10000 requests/hour'
    END,
    c.cat_id,
    'manual',
    0.95,
    FLOOR(RANDOM() * 100) + 50,
    0.88,
    'en',
         CASE c.rn
         WHEN 1 THEN '{"password", "reset", "login"}'
         WHEN 2 THEN '{"billing", "cycle", "subscription"}'
         WHEN 3 THEN '{"api", "rate", "limits"}'
     END,
    'active',
    auth.uid()
FROM categories c
ON CONFLICT (id) DO NOTHING;

-- ================================
-- STEP 9: Create agent work logs
-- ================================

-- Get user's agent IDs
WITH user_agents_data AS (
    SELECT agent_id, agent_name, ROW_NUMBER() OVER (ORDER BY created_at) as rn
    FROM user_agents
    WHERE user_id = auth.uid()
    LIMIT 3
)
INSERT INTO agent_work_logs (id, agent_id, agent_name, user_id, task_type, task_description, input_data, output_data, status, started_at, completed_at, execution_time_ms, metadata)
SELECT
    gen_random_uuid(),
    ua.agent_id,
    ua.agent_name,
    auth.uid(),
    CASE ua.rn
        WHEN 1 THEN 'conversation'
        WHEN 2 THEN 'knowledge_processing'
        WHEN 3 THEN 'content_analysis'
    END,
    CASE ua.rn
        WHEN 1 THEN 'Handle customer inquiry about account settings'
        WHEN 2 THEN 'Process and analyze new knowledge base article'
        WHEN 3 THEN 'Analyze conversation sentiment and intent'
    END,
    CASE ua.rn
        WHEN 1 THEN '{"customer_id": "650e8400-e29b-41d4-a716-446655440000", "message": "Hi, I need help with my account settings"}'
        WHEN 2 THEN '{"article_title": "How to Reset Password", "content_length": 150}'
        WHEN 3 THEN '{"conversation_id": "test-001", "messages": ["Hi, I need help with my account settings"]}'
    END,
    CASE ua.rn
        WHEN 1 THEN '{"response": "Hello! I''d be happy to help you with your account settings.", "confidence": 0.95}'
        WHEN 2 THEN '{"tags_extracted": ["password", "reset", "login"], "confidence_score": 0.95}'
        WHEN 3 THEN '{"sentiment": "neutral", "intent": "account_help", "confidence": 0.85}'
    END,
    'completed',
    NOW() - INTERVAL '10 minutes',
    NOW() - INTERVAL '9 minutes',
    60000,
    '{"model_used": "gpt-4", "version": "1.0"}'
FROM user_agents_data ua
ON CONFLICT (id) DO NOTHING;

-- Add some additional work logs with different statuses
INSERT INTO agent_work_logs (id, agent_id, agent_name, user_id, task_type, task_description, input_data, output_data, status, started_at, completed_at, execution_time_ms, metadata)
SELECT
    gen_random_uuid(),
    ua.agent_id,
    ua.agent_name,
    auth.uid(),
    'automation',
    'Automatic follow-up task scheduling',
    '{"conversation_id": "test-002", "follow_up_type": "satisfaction_survey"}',
    '{"task_scheduled": true, "scheduled_time": "2024-01-16T10:00:00Z"}',
    'completed',
    NOW() - INTERVAL '5 minutes',
    NOW() - INTERVAL '4 minutes',
    60000,
    '{"automation_type": "follow_up_scheduling"}'
FROM user_agents ua
WHERE ua.user_id = auth.uid()
AND ua.is_primary = true
LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- Add an in-progress task
INSERT INTO agent_work_logs (id, agent_id, agent_name, user_id, task_type, task_description, input_data, output_data, status, started_at, metadata)
SELECT
    gen_random_uuid(),
    ua.agent_id,
    ua.agent_name,
    auth.uid(),
    'workflow_execution',
    'Execute lead qualification workflow',
    '{"customer_id": "650e8400-e29b-41d4-a716-446655440001", "conversation_context": "pricing_inquiry"}',
    '{}',
    'in_progress',
    NOW() - INTERVAL '2 minutes',
    '{"workflow_id": "wf-lead-qualification", "current_step": "scoring"}'
FROM user_agents ua
WHERE ua.user_id = auth.uid()
AND ua.agent_type = 'analytics_bot'
LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- Add a failed task
INSERT INTO agent_work_logs (id, agent_id, agent_name, user_id, task_type, task_description, input_data, output_data, status, started_at, completed_at, execution_time_ms, error_message, metadata)
SELECT
    gen_random_uuid(),
    ua.agent_id,
    ua.agent_name,
    auth.uid(),
    'knowledge_processing',
    'Failed to process corrupted document',
    '{"document_id": "doc-corrupted-001", "file_type": "pdf"}',
    '{}',
    'failed',
    NOW() - INTERVAL '30 minutes',
    NOW() - INTERVAL '29 minutes',
    60000,
    'Document format not supported',
    '{"error_type": "document_corruption", "retry_count": 3}'
FROM user_agents ua
WHERE ua.user_id = auth.uid()
AND ua.agent_type = 'knowledge_bot'
LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- ================================
-- STEP 10: Create canned responses
-- ================================

INSERT INTO canned_responses (title, content, shortcut, category, language, created_by, is_public, tags) VALUES
('Welcome Greeting', 'Hello! Welcome to our support chat. How can I help you today?', '/welcome', 'greetings', 'en', auth.uid(), true, '{"greeting", "welcome"}'),
('Pricing Information', 'You can find our current pricing plans on our website. Would you like me to walk you through the options?', '/pricing', 'sales', 'en', auth.uid(), true, '{"pricing", "sales"}'),
('Technical Support', 'I see you''re experiencing a technical issue. Let me help you troubleshoot this step by step.', '/tech', 'support', 'en', auth.uid(), true, '{"technical", "support"}'),
('Thank You', 'Thank you for contacting us! Is there anything else I can help you with?', '/thanks', 'general', 'en', auth.uid(), true, '{"thanks", "closing"}')
ON CONFLICT (title) DO UPDATE SET
    content = EXCLUDED.content,
    shortcut = EXCLUDED.shortcut,
    category = EXCLUDED.category,
    language = EXCLUDED.language,
    created_by = EXCLUDED.created_by,
    is_public = EXCLUDED.is_public,
    tags = EXCLUDED.tags;

-- ================================
-- STEP 11: Update statistics
-- ================================

-- Update conversation message counts
UPDATE conversations SET message_count = (
    SELECT COUNT(*) FROM messages WHERE conversation_id = conversations.id
) WHERE assigned_agent_id = auth.uid();

-- Update customer conversation counts
UPDATE customer_profiles SET total_conversations = (
    SELECT COUNT(*) FROM conversations WHERE customer_id = customer_profiles.id
);

-- ================================
-- STEP 12: Verification and Results
-- ================================

-- Show what was created
SELECT 'DATA CREATED SUCCESSFULLY' as section;

-- Show profile
SELECT 'Your Profile:' as info, * FROM profiles WHERE id = auth.uid();

-- Show agents
SELECT 'Your Agents:' as info, agent_id, agent_name, agent_type, is_active, is_primary FROM user_agents WHERE user_id = auth.uid();

-- Show work logs
SELECT 'Your Agent Work Logs:' as info, agent_name, task_type, status, execution_time_ms FROM agent_work_logs WHERE user_id = auth.uid() ORDER BY created_at DESC;

-- Show performance metrics
SELECT 'Your Agent Performance:' as info, * FROM agent_performance_metrics WHERE user_id = auth.uid();

-- Show record counts
SELECT 
    'Record Counts:' as info,
    (SELECT COUNT(*) FROM profiles WHERE id = auth.uid()) as profiles,
    (SELECT COUNT(*) FROM user_agents WHERE user_id = auth.uid()) as agents,
    (SELECT COUNT(*) FROM agent_work_logs WHERE user_id = auth.uid()) as work_logs,
    (SELECT COUNT(*) FROM conversations WHERE assigned_agent_id = auth.uid()) as conversations,
    (SELECT COUNT(*) FROM messages WHERE sender_id = auth.uid()) as messages,
    (SELECT COUNT(*) FROM customer_profiles) as customers,
    (SELECT COUNT(*) FROM knowledge_categories) as categories,
    (SELECT COUNT(*) FROM knowledge_items WHERE created_by = auth.uid()) as knowledge_items,
    (SELECT COUNT(*) FROM canned_responses WHERE created_by = auth.uid()) as canned_responses;

SELECT 'SIMPLE SAMPLE DATA LOADED SUCCESSFULLY!' as status;