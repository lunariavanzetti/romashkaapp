-- Simple Sample Data Script for Supabase (Authentication-Safe Version)
-- This script handles authentication issues gracefully

-- ================================
-- STEP 1: Check Authentication Status
-- ================================

DO $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE NOTICE '⚠️  WARNING: You are not authenticated!';
        RAISE NOTICE '📋 To fix this:';
        RAISE NOTICE '   1. Go to Authentication > Users in Supabase dashboard';
        RAISE NOTICE '   2. Create a test user or use an existing one';
        RAISE NOTICE '   3. Run this script while logged in as that user';
        RAISE NOTICE '   4. Or use the ALTERNATIVE approach below...';
        RAISE NOTICE '';
        RAISE NOTICE '🔄 Proceeding with FALLBACK approach using first available user...';
    ELSE
        RAISE NOTICE '✅ Authenticated as user: %', auth.uid();
    END IF;
END $$;

-- ================================
-- STEP 2: Get or Create a User to Use
-- ================================

-- Create a function to get a valid user ID
CREATE OR REPLACE FUNCTION get_sample_user_id() 
RETURNS UUID AS $$
DECLARE
    sample_user_id UUID;
BEGIN
    -- Try to use authenticated user first
    IF auth.uid() IS NOT NULL THEN
        RETURN auth.uid();
    END IF;
    
    -- Fallback: use first existing user
    SELECT id INTO sample_user_id 
    FROM auth.users 
    LIMIT 1;
    
    IF sample_user_id IS NOT NULL THEN
        RAISE NOTICE '📝 Using existing user: %', sample_user_id;
        RETURN sample_user_id;
    END IF;
    
    -- Last resort: create a test user
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
    ) VALUES (
        gen_random_uuid(),
        'test-user@example.com',
        '$2a$10$M8jqP8QqF9YqGQqF9YqGQqF9YqGQqF9YqGQqF9YqGQqF9YqGQqF9Y',
        NOW(),
        NOW(),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "Test User"}',
        false,
        'authenticated'
    ) RETURNING id INTO sample_user_id;
    
    RAISE NOTICE '👤 Created test user: %', sample_user_id;
    RETURN sample_user_id;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- STEP 3: Create Profile for User
-- ================================

WITH user_info AS (
    SELECT 
        get_sample_user_id() as user_id,
        COALESCE(au.email, 'test-user@example.com') as email,
        COALESCE(au.raw_user_meta_data->>'full_name', 'Test User') as full_name
    FROM auth.users au
    WHERE au.id = get_sample_user_id()
    UNION ALL
    SELECT 
        get_sample_user_id() as user_id,
        'test-user@example.com' as email,
        'Test User' as full_name
    WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = get_sample_user_id())
    LIMIT 1
)
INSERT INTO profiles (id, email, full_name, company_name, website_url, role, onboarding_completed) 
SELECT 
    ui.user_id,
    ui.email,
    ui.full_name,
    'Test Company',
    'https://example.com',
    'user',
    true
FROM user_info ui
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    company_name = EXCLUDED.company_name,
    website_url = EXCLUDED.website_url,
    role = EXCLUDED.role,
    onboarding_completed = EXCLUDED.onboarding_completed;

-- ================================
-- STEP 4: Create Customer Profiles
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
-- STEP 5: Create User Agents
-- ================================

INSERT INTO user_agents (id, user_id, agent_id, agent_name, agent_type, agent_description, is_active, is_primary, agent_config, capabilities) VALUES
(gen_random_uuid(), get_sample_user_id(), 'agent-' || get_sample_user_id()::text || '-001', 'My AI Assistant', 'ai_assistant', 'Primary AI assistant for customer support', true, true, '{"model": "gpt-4", "temperature": 0.7}', '["chat", "knowledge_search", "task_automation"]'),
(gen_random_uuid(), get_sample_user_id(), 'agent-' || get_sample_user_id()::text || '-002', 'My Analytics Bot', 'analytics_bot', 'Specialized bot for analytics and reporting', true, false, '{"model": "gpt-4", "temperature": 0.3}', '["analytics", "reporting", "data_visualization"]'),
(gen_random_uuid(), get_sample_user_id(), 'agent-' || get_sample_user_id()::text || '-003', 'My Knowledge Bot', 'knowledge_bot', 'Knowledge management and processing bot', true, false, '{"model": "gpt-4", "temperature": 0.5}', '["knowledge_processing", "content_analysis", "data_extraction"]')
ON CONFLICT (agent_id) DO UPDATE SET
    agent_name = EXCLUDED.agent_name,
    agent_type = EXCLUDED.agent_type,
    agent_description = EXCLUDED.agent_description,
    is_active = EXCLUDED.is_active,
    is_primary = EXCLUDED.is_primary,
    agent_config = EXCLUDED.agent_config,
    capabilities = EXCLUDED.capabilities;

-- ================================
-- STEP 6: Create Communication Channels
-- ================================

INSERT INTO communication_channels (id, name, type, status, configuration, created_by) VALUES
(gen_random_uuid(), 'Website Chat', 'website', 'active', '{"widget_id": "widget-001", "theme": "light"}', get_sample_user_id()),
(gen_random_uuid(), 'WhatsApp Business', 'whatsapp', 'active', '{"phone_number": "+1234567890", "business_id": "12345"}', get_sample_user_id()),
(gen_random_uuid(), 'Email Support', 'email', 'active', '{"email": "support@example.com", "imap_server": "imap.example.com"}', get_sample_user_id())
ON CONFLICT (id) DO NOTHING;

-- ================================
-- STEP 7: Create Conversations
-- ================================

INSERT INTO conversations (id, customer_id, user_name, user_email, assigned_agent_id, status, priority, channel_type, language, sentiment, intent, ai_confidence) VALUES
(gen_random_uuid(), '650e8400-e29b-41d4-a716-446655440000', 'Alice Johnson', 'customer1@example.com', get_sample_user_id(), 'active', 'high', 'website', 'en', 'neutral', 'support_inquiry', 0.85),
(gen_random_uuid(), '650e8400-e29b-41d4-a716-446655440001', 'Bob Wilson', 'customer2@example.com', get_sample_user_id(), 'resolved', 'normal', 'whatsapp', 'en', 'positive', 'product_inquiry', 0.92),
(gen_random_uuid(), '650e8400-e29b-41d4-a716-446655440002', 'Carlos Rodriguez', 'customer3@example.com', get_sample_user_id(), 'active', 'normal', 'email', 'es', 'neutral', 'billing_inquiry', 0.78)
ON CONFLICT (id) DO NOTHING;

-- ================================
-- STEP 8: Create Messages
-- ================================

WITH conversation_ids AS (
    SELECT id as conv_id, customer_id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
    FROM conversations 
    WHERE assigned_agent_id = get_sample_user_id()
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
    WHERE assigned_agent_id = get_sample_user_id()
    LIMIT 3
)
INSERT INTO messages (id, conversation_id, sender_type, sender_id, content, message_type, confidence_score, processing_time_ms, intent_detected, tokens_used)
SELECT
    gen_random_uuid(),
    ci.conv_id,
    'ai',
    get_sample_user_id(),
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
-- STEP 9: Create Knowledge Categories
-- ================================

INSERT INTO knowledge_categories (id, name, description, icon, color, is_active) VALUES
(gen_random_uuid(), 'General Support', 'General customer support information', 'help-circle', 'blue', true),
(gen_random_uuid(), 'Billing & Pricing', 'Billing and pricing related information', 'credit-card', 'green', true),
(gen_random_uuid(), 'Technical Issues', 'Technical troubleshooting guides', 'settings', 'red', true),
(gen_random_uuid(), 'Product Features', 'Product features and how-to guides', 'star', 'purple', true)
ON CONFLICT (id) DO NOTHING;

-- ================================
-- STEP 10: Create Knowledge Items
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
    get_sample_user_id()
FROM categories c
ON CONFLICT (id) DO NOTHING;

-- ================================
-- STEP 11: Create Agent Work Logs
-- ================================

WITH user_agents_data AS (
    SELECT agent_id, agent_name, ROW_NUMBER() OVER (ORDER BY created_at) as rn
    FROM user_agents
    WHERE user_id = get_sample_user_id()
    LIMIT 3
)
INSERT INTO agent_work_logs (id, agent_id, agent_name, user_id, task_type, task_description, input_data, output_data, status, started_at, completed_at, execution_time_ms, metadata)
SELECT
    gen_random_uuid(),
    ua.agent_id,
    ua.agent_name,
    get_sample_user_id(),
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

-- Add additional work logs with different statuses
INSERT INTO agent_work_logs (id, agent_id, agent_name, user_id, task_type, task_description, input_data, output_data, status, started_at, completed_at, execution_time_ms, metadata)
SELECT
    gen_random_uuid(),
    ua.agent_id,
    ua.agent_name,
    get_sample_user_id(),
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
WHERE ua.user_id = get_sample_user_id()
AND ua.is_primary = true
LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- Add an in-progress task
INSERT INTO agent_work_logs (id, agent_id, agent_name, user_id, task_type, task_description, input_data, output_data, status, started_at, metadata)
SELECT
    gen_random_uuid(),
    ua.agent_id,
    ua.agent_name,
    get_sample_user_id(),
    'workflow_execution',
    'Execute lead qualification workflow',
    '{"customer_id": "650e8400-e29b-41d4-a716-446655440001", "conversation_context": "pricing_inquiry"}',
    '{}',
    'in_progress',
    NOW() - INTERVAL '2 minutes',
    '{"workflow_id": "wf-lead-qualification", "current_step": "scoring"}'
FROM user_agents ua
WHERE ua.user_id = get_sample_user_id()
AND ua.agent_type = 'analytics_bot'
LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- Add a failed task
INSERT INTO agent_work_logs (id, agent_id, agent_name, user_id, task_type, task_description, input_data, output_data, status, started_at, completed_at, execution_time_ms, error_message, metadata)
SELECT
    gen_random_uuid(),
    ua.agent_id,
    ua.agent_name,
    get_sample_user_id(),
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
WHERE ua.user_id = get_sample_user_id()
AND ua.agent_type = 'knowledge_bot'
LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- ================================
-- STEP 12: Create Canned Responses
-- ================================

INSERT INTO canned_responses (title, content, shortcut, category, language, created_by, is_public, tags) VALUES
('Welcome Greeting', 'Hello! Welcome to our support chat. How can I help you today?', '/welcome', 'greetings', 'en', get_sample_user_id(), true, '{"greeting", "welcome"}'),
('Pricing Information', 'You can find our current pricing plans on our website. Would you like me to walk you through the options?', '/pricing', 'sales', 'en', get_sample_user_id(), true, '{"pricing", "sales"}'),
('Technical Support', 'I see you''re experiencing a technical issue. Let me help you troubleshoot this step by step.', '/tech', 'support', 'en', get_sample_user_id(), true, '{"technical", "support"}'),
('Thank You', 'Thank you for contacting us! Is there anything else I can help you with?', '/thanks', 'general', 'en', get_sample_user_id(), true, '{"thanks", "closing"}')
ON CONFLICT (title) DO UPDATE SET
    content = EXCLUDED.content,
    shortcut = EXCLUDED.shortcut,
    category = EXCLUDED.category,
    language = EXCLUDED.language,
    created_by = EXCLUDED.created_by,
    is_public = EXCLUDED.is_public,
    tags = EXCLUDED.tags;

-- ================================
-- STEP 13: Update Statistics
-- ================================

-- Update conversation message counts
UPDATE conversations SET message_count = (
    SELECT COUNT(*) FROM messages WHERE conversation_id = conversations.id
) WHERE assigned_agent_id = get_sample_user_id();

-- Update customer conversation counts
UPDATE customer_profiles SET total_conversations = (
    SELECT COUNT(*) FROM conversations WHERE customer_id = customer_profiles.id
);

-- ================================
-- STEP 14: Verification and Results
-- ================================

-- Show what was created
SELECT '🎉 DATA CREATED SUCCESSFULLY!' as section;

-- Show the user that was used
SELECT '👤 USER INFORMATION' as section, get_sample_user_id() as user_id, email, full_name 
FROM profiles WHERE id = get_sample_user_id();

-- Show agents
SELECT '🤖 YOUR AGENTS' as section, agent_id, agent_name, agent_type, is_active, is_primary 
FROM user_agents WHERE user_id = get_sample_user_id();

-- Show work logs
SELECT '📊 AGENT WORK LOGS' as section, agent_name, task_type, status, execution_time_ms 
FROM agent_work_logs WHERE user_id = get_sample_user_id() ORDER BY created_at DESC;

-- Show performance metrics
SELECT '📈 AGENT PERFORMANCE' as section, * 
FROM agent_performance_metrics WHERE user_id = get_sample_user_id();

-- Show record counts
SELECT 
    '📋 RECORD COUNTS' as section,
    (SELECT COUNT(*) FROM profiles WHERE id = get_sample_user_id()) as profiles,
    (SELECT COUNT(*) FROM user_agents WHERE user_id = get_sample_user_id()) as agents,
    (SELECT COUNT(*) FROM agent_work_logs WHERE user_id = get_sample_user_id()) as work_logs,
    (SELECT COUNT(*) FROM conversations WHERE assigned_agent_id = get_sample_user_id()) as conversations,
    (SELECT COUNT(*) FROM messages WHERE sender_id = get_sample_user_id()) as ai_messages,
    (SELECT COUNT(*) FROM customer_profiles) as customers,
    (SELECT COUNT(*) FROM knowledge_categories) as categories,
    (SELECT COUNT(*) FROM knowledge_items WHERE created_by = get_sample_user_id()) as knowledge_items,
    (SELECT COUNT(*) FROM canned_responses WHERE created_by = get_sample_user_id()) as canned_responses;

-- Clean up the helper function
DROP FUNCTION get_sample_user_id();

SELECT '✅ SAMPLE DATA LOADED SUCCESSFULLY!' as status;