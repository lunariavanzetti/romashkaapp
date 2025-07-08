-- ROMASHKA Development Seed Data
-- Comprehensive seed data for development and testing

-- ================================
-- SAMPLE CONVERSATIONS & MESSAGES
-- ================================

-- Sample conversations with realistic data
INSERT INTO conversations (id, user_name, user_email, status, created_at, last_message, message_count, satisfaction_score, language, sentiment, intent, ai_confidence, priority, channel_type, department) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'John Smith', 'john.smith@email.com', 'resolved', NOW() - INTERVAL '7 days', 'Thank you for your help!', 8, 4.5, 'en', 'positive', 'customer_support', 0.85, 'normal', 'website', 'support'),
('550e8400-e29b-41d4-a716-446655440002', 'Jane Doe', 'jane.doe@email.com', 'resolved', NOW() - INTERVAL '6 days', 'Issue resolved successfully', 12, 4.8, 'en', 'positive', 'technical_support', 0.92, 'high', 'email', 'technical'),
('550e8400-e29b-41d4-a716-446655440003', 'Bob Wilson', 'bob.wilson@email.com', 'active', NOW() - INTERVAL '2 hours', 'Can you help me with this?', 5, NULL, 'en', 'neutral', 'general_inquiry', 0.75, 'normal', 'whatsapp', 'general'),
('550e8400-e29b-41d4-a716-446655440004', 'Alice Brown', 'alice.brown@email.com', 'resolved', NOW() - INTERVAL '5 days', 'Perfect, thank you!', 6, 4.7, 'en', 'positive', 'billing', 0.88, 'normal', 'website', 'billing'),
('550e8400-e29b-41d4-a716-446655440005', 'Charlie Davis', 'charlie.davis@email.com', 'resolved', NOW() - INTERVAL '4 days', 'That worked!', 10, 4.6, 'en', 'positive', 'technical_support', 0.91, 'urgent', 'email', 'technical'),
('550e8400-e29b-41d4-a716-446655440006', 'Diana Evans', 'diana.evans@email.com', 'active', NOW() - INTERVAL '1 hour', 'I have a question', 3, NULL, 'en', 'neutral', 'general_inquiry', 0.78, 'normal', 'website', 'general'),
('550e8400-e29b-41d4-a716-446655440007', 'Frank Garcia', 'frank.garcia@email.com', 'resolved', NOW() - INTERVAL '3 days', 'Great service!', 7, 4.9, 'en', 'positive', 'customer_support', 0.94, 'normal', 'whatsapp', 'support'),
('550e8400-e29b-41d4-a716-446655440008', 'Grace Harris', 'grace.harris@email.com', 'resolved', NOW() - INTERVAL '2 days', 'All sorted now', 9, 4.4, 'en', 'positive', 'billing', 0.87, 'normal', 'website', 'billing'),
('550e8400-e29b-41d4-a716-446655440009', 'Henry Ivanov', 'henry.ivanov@email.com', 'active', NOW() - INTERVAL '30 minutes', 'Need assistance', 2, NULL, 'en', 'neutral', 'technical_support', 0.82, 'high', 'email', 'technical'),
('550e8400-e29b-41d4-a716-446655440010', 'Ivy Johnson', 'ivy.johnson@email.com', 'resolved', NOW() - INTERVAL '1 day', 'Thanks a lot!', 11, 4.6, 'en', 'positive', 'customer_support', 0.89, 'normal', 'website', 'support')
ON CONFLICT (id) DO NOTHING;

-- Sample messages for conversations
INSERT INTO messages (conversation_id, sender_type, content, created_at, confidence_score, processing_time_ms, intent_detected, channel_type) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'user', 'Hello, I need help with my account', NOW() - INTERVAL '7 days', 0.85, 1200, 'account_support', 'website'),
('550e8400-e29b-41d4-a716-446655440001', 'ai', 'Hello! I''d be happy to help you with your account. What specific issue are you experiencing?', NOW() - INTERVAL '7 days' + INTERVAL '30 seconds', 0.92, 800, 'greeting', 'website'),
('550e8400-e29b-41d4-a716-446655440001', 'user', 'I can''t log in to my dashboard', NOW() - INTERVAL '7 days' + INTERVAL '60 seconds', 0.78, 1500, 'login_issue', 'website'),
('550e8400-e29b-41d4-a716-446655440001', 'ai', 'I understand you''re having trouble logging in. Let me help you troubleshoot this. Have you tried resetting your password?', NOW() - INTERVAL '7 days' + INTERVAL '90 seconds', 0.88, 1100, 'troubleshooting', 'website'),
('550e8400-e29b-41d4-a716-446655440001', 'user', 'Thank you for your help!', NOW() - INTERVAL '7 days' + INTERVAL '120 seconds', 0.95, 600, 'gratitude', 'website'),
('550e8400-e29b-41d4-a716-446655440002', 'user', 'Hi, I have a technical issue', NOW() - INTERVAL '6 days', 0.82, 1400, 'technical_issue', 'email'),
('550e8400-e29b-41d4-a716-446655440002', 'ai', 'Hello! I''m here to help with your technical issue. Could you please describe what you''re experiencing?', NOW() - INTERVAL '6 days' + INTERVAL '25 seconds', 0.89, 950, 'technical_support', 'email'),
('550e8400-e29b-41d4-a716-446655440003', 'user', 'Can you help me with this?', NOW() - INTERVAL '2 hours', 0.75, 1800, 'help_request', 'whatsapp'),
('550e8400-e29b-41d4-a716-446655440003', 'ai', 'Of course! I''d be happy to help. What can I assist you with today?', NOW() - INTERVAL '2 hours' + INTERVAL '20 seconds', 0.81, 1200, 'assistance', 'whatsapp'),
('550e8400-e29b-41d4-a716-446655440004', 'user', 'I have a billing question', NOW() - INTERVAL '5 days', 0.88, 1100, 'billing_inquiry', 'website'),
('550e8400-e29b-41d4-a716-446655440004', 'ai', 'I''d be happy to help with your billing question. What specific information do you need?', NOW() - INTERVAL '5 days' + INTERVAL '15 seconds', 0.91, 850, 'billing_support', 'website'),
('550e8400-e29b-41d4-a716-446655440005', 'user', 'API integration help needed', NOW() - INTERVAL '4 days', 0.91, 1300, 'api_support', 'email'),
('550e8400-e29b-41d4-a716-446655440005', 'ai', 'I can help you with API integration. What specific aspect do you need assistance with?', NOW() - INTERVAL '4 days' + INTERVAL '18 seconds', 0.94, 920, 'api_support', 'email')
ON CONFLICT DO NOTHING;

-- ================================
-- KNOWLEDGE BASE SEED DATA
-- ================================

-- Sample knowledge base items
INSERT INTO knowledge_items (id, title, content, category_id, source_type, confidence_score, usage_count, effectiveness_score, language, tags, status, created_by) VALUES
('550e8400-e29b-41d4-a716-446655440100', 'Getting Started with ROMASHKA', 'Welcome to ROMASHKA! This guide will help you get started with our customer support platform. First, set up your profile and configure your preferences. Then, explore the dashboard to familiarize yourself with the main features including conversations, knowledge base, and analytics.', '550e8400-e29b-41d4-a716-446655440001', 'manual', 0.95, 45, 0.89, 'en', '{"getting_started", "onboarding", "setup"}', 'active', NULL),
('550e8400-e29b-41d4-a716-446655440101', 'Password Reset Instructions', 'To reset your password: 1. Go to the login page 2. Click "Forgot Password" 3. Enter your email address 4. Check your email for reset instructions 5. Follow the link and create a new password 6. Your password must be at least 8 characters long and include numbers and special characters.', '550e8400-e29b-41d4-a716-446655440002', 'manual', 0.92, 23, 0.91, 'en', '{"password", "reset", "login", "security"}', 'active', NULL),
('550e8400-e29b-41d4-a716-446655440102', 'API Integration Guide', 'Our API allows you to integrate ROMASHKA with your existing systems. Authentication is handled via API keys. Base URL: https://api.romashka.com/v1. Key endpoints include: /conversations, /messages, /knowledge, /analytics. Rate limiting: 1000 requests per hour. All responses are in JSON format.', '550e8400-e29b-41d4-a716-446655440003', 'manual', 0.94, 67, 0.93, 'en', '{"api", "integration", "development", "technical"}', 'active', NULL),
('550e8400-e29b-41d4-a716-446655440103', 'Billing and Pricing FAQ', 'Common billing questions: Q: How am I charged? A: We charge monthly based on your plan and usage. Q: Can I upgrade/downgrade? A: Yes, anytime from your account settings. Q: What payment methods do you accept? A: Credit cards, PayPal, and bank transfers. Q: Is there a refund policy? A: Yes, 30-day money-back guarantee.', '550e8400-e29b-41d4-a716-446655440004', 'manual', 0.88, 34, 0.87, 'en', '{"billing", "pricing", "payment", "refund"}', 'active', NULL),
('550e8400-e29b-41d4-a716-446655440104', 'WhatsApp Integration Setup', 'To set up WhatsApp integration: 1. Go to Channels > WhatsApp 2. Click "Add WhatsApp Channel" 3. Enter your WhatsApp Business API credentials 4. Configure webhook URL 5. Test the connection 6. Set up message templates 7. Configure routing rules. Note: WhatsApp Business API account required.', '550e8400-e29b-41d4-a716-446655440005', 'manual', 0.90, 12, 0.85, 'en', '{"whatsapp", "integration", "channel", "messaging"}', 'active', NULL)
ON CONFLICT (id) DO NOTHING;

-- ================================
-- CUSTOMER PROFILES SEED DATA
-- ================================

-- Sample customer profiles
INSERT INTO customer_profiles (id, email, name, phone, company, location, timezone, language, tags, custom_fields, total_conversations, avg_satisfaction, last_interaction) VALUES
('550e8400-e29b-41d4-a716-446655440200', 'john.smith@email.com', 'John Smith', '+1-555-0123', 'TechCorp Inc', 'New York, NY', 'America/New_York', 'en', '{"premium", "tech_savvy"}', '{"industry": "technology", "employees": "100-500", "plan": "enterprise"}', 3, 4.7, NOW() - INTERVAL '2 days'),
('550e8400-e29b-41d4-a716-446655440201', 'jane.doe@email.com', 'Jane Doe', '+1-555-0124', 'StartupCo', 'San Francisco, CA', 'America/Los_Angeles', 'en', '{"startup", "developer"}', '{"industry": "fintech", "employees": "10-50", "plan": "pro"}', 2, 4.9, NOW() - INTERVAL '1 day'),
('550e8400-e29b-41d4-a716-446655440202', 'bob.wilson@email.com', 'Bob Wilson', '+1-555-0125', 'Wilson Consulting', 'Chicago, IL', 'America/Chicago', 'en', '{"consultant", "enterprise"}', '{"industry": "consulting", "employees": "1-10", "plan": "basic"}', 1, 4.2, NOW() - INTERVAL '3 hours'),
('550e8400-e29b-41d4-a716-446655440203', 'alice.brown@email.com', 'Alice Brown', '+1-555-0126', 'Brown Industries', 'Austin, TX', 'America/Chicago', 'en', '{"manufacturing", "legacy"}', '{"industry": "manufacturing", "employees": "1000+", "plan": "enterprise"}', 4, 4.6, NOW() - INTERVAL '1 day'),
('550e8400-e29b-41d4-a716-446655440204', 'charlie.davis@email.com', 'Charlie Davis', '+1-555-0127', 'Davis Solutions', 'Seattle, WA', 'America/Los_Angeles', 'en', '{"saas", "growing"}', '{"industry": "software", "employees": "50-100", "plan": "pro"}', 2, 4.8, NOW() - INTERVAL '6 hours')
ON CONFLICT (id) DO NOTHING;

-- ================================
-- AGENT SEED DATA
-- ================================

-- Sample agent profiles (these would be created when users sign up)
INSERT INTO profiles (id, email, full_name, company_name, role, timezone, language, onboarding_completed, settings) VALUES
('550e8400-e29b-41d4-a716-446655440300', 'agent1@romashka.com', 'Sarah Johnson', 'ROMASHKA', 'agent', 'America/New_York', 'en', true, '{"notifications": true, "theme": "light"}'),
('550e8400-e29b-41d4-a716-446655440301', 'agent2@romashka.com', 'Mike Chen', 'ROMASHKA', 'agent', 'America/Los_Angeles', 'en', true, '{"notifications": true, "theme": "dark"}'),
('550e8400-e29b-41d4-a716-446655440302', 'admin@romashka.com', 'Admin User', 'ROMASHKA', 'admin', 'UTC', 'en', true, '{"notifications": true, "theme": "light"}')
ON CONFLICT (id) DO NOTHING;

-- Sample agent availability
INSERT INTO agent_availability (agent_id, is_online, status, max_concurrent_chats, current_chat_count, working_hours) VALUES
('550e8400-e29b-41d4-a716-446655440300', true, 'available', 8, 2, '{"monday": {"start": "09:00", "end": "17:00"}, "tuesday": {"start": "09:00", "end": "17:00"}, "wednesday": {"start": "09:00", "end": "17:00"}, "thursday": {"start": "09:00", "end": "17:00"}, "friday": {"start": "09:00", "end": "17:00"}}'),
('550e8400-e29b-41d4-a716-446655440301', true, 'available', 6, 1, '{"monday": {"start": "08:00", "end": "16:00"}, "tuesday": {"start": "08:00", "end": "16:00"}, "wednesday": {"start": "08:00", "end": "16:00"}, "thursday": {"start": "08:00", "end": "16:00"}, "friday": {"start": "08:00", "end": "16:00"}}'),
('550e8400-e29b-41d4-a716-446655440302', false, 'offline', 10, 0, '{"monday": {"start": "09:00", "end": "17:00"}, "tuesday": {"start": "09:00", "end": "17:00"}, "wednesday": {"start": "09:00", "end": "17:00"}, "thursday": {"start": "09:00", "end": "17:00"}, "friday": {"start": "09:00", "end": "17:00"}}')
ON CONFLICT (agent_id) DO NOTHING;

-- ================================
-- ANALYTICS SEED DATA
-- ================================

-- Sample daily metrics
INSERT INTO daily_metrics (date, channel_type, department, agent_id, total_conversations, ai_resolved_conversations, human_resolved_conversations, avg_first_response_time_seconds, avg_resolution_time_seconds, avg_satisfaction_score, ai_confidence_avg) VALUES
(CURRENT_DATE - INTERVAL '7 days', 'website', 'support', '550e8400-e29b-41d4-a716-446655440300', 15, 8, 7, 120, 1800, 4.5, 0.85),
(CURRENT_DATE - INTERVAL '7 days', 'email', 'technical', '550e8400-e29b-41d4-a716-446655440301', 12, 5, 7, 300, 2400, 4.2, 0.78),
(CURRENT_DATE - INTERVAL '6 days', 'whatsapp', 'general', '550e8400-e29b-41d4-a716-446655440300', 20, 12, 8, 90, 1200, 4.6, 0.88),
(CURRENT_DATE - INTERVAL '6 days', 'website', 'billing', '550e8400-e29b-41d4-a716-446655440301', 8, 3, 5, 180, 1500, 4.3, 0.82),
(CURRENT_DATE - INTERVAL '5 days', 'email', 'support', '550e8400-e29b-41d4-a716-446655440300', 18, 10, 8, 150, 1600, 4.4, 0.86),
(CURRENT_DATE - INTERVAL '5 days', 'website', 'technical', '550e8400-e29b-41d4-a716-446655440301', 14, 6, 8, 220, 2100, 4.1, 0.79),
(CURRENT_DATE - INTERVAL '4 days', 'whatsapp', 'support', '550e8400-e29b-41d4-a716-446655440300', 22, 14, 8, 85, 1100, 4.7, 0.90),
(CURRENT_DATE - INTERVAL '4 days', 'email', 'billing', '550e8400-e29b-41d4-a716-446655440301', 10, 4, 6, 200, 1400, 4.5, 0.83),
(CURRENT_DATE - INTERVAL '3 days', 'website', 'general', '550e8400-e29b-41d4-a716-446655440300', 16, 9, 7, 110, 1300, 4.6, 0.87),
(CURRENT_DATE - INTERVAL '3 days', 'email', 'technical', '550e8400-e29b-41d4-a716-446655440301', 13, 5, 8, 280, 2200, 4.0, 0.77),
(CURRENT_DATE - INTERVAL '2 days', 'whatsapp', 'support', '550e8400-e29b-41d4-a716-446655440300', 19, 11, 8, 95, 1250, 4.8, 0.91),
(CURRENT_DATE - INTERVAL '2 days', 'website', 'billing', '550e8400-e29b-41d4-a716-446655440301', 7, 2, 5, 160, 1350, 4.4, 0.84),
(CURRENT_DATE - INTERVAL '1 day', 'email', 'general', '550e8400-e29b-41d4-a716-446655440300', 21, 13, 8, 105, 1150, 4.9, 0.92),
(CURRENT_DATE - INTERVAL '1 day', 'website', 'technical', '550e8400-e29b-41d4-a716-446655440301', 11, 4, 7, 240, 1950, 4.2, 0.80),
(CURRENT_DATE, 'whatsapp', 'support', '550e8400-e29b-41d4-a716-446655440300', 5, 3, 2, 80, 900, 4.6, 0.89),
(CURRENT_DATE, 'website', 'general', '550e8400-e29b-41d4-a716-446655440301', 3, 1, 2, 130, 1100, 4.3, 0.81)
ON CONFLICT (date, channel_type, department, agent_id) DO NOTHING;

-- ================================
-- COMMUNICATION CHANNELS SEED DATA
-- ================================

-- Sample communication channels
INSERT INTO communication_channels (id, name, type, status, configuration, webhook_url, created_by) VALUES
('550e8400-e29b-41d4-a716-446655440400', 'Website Chat', 'website', 'active', '{"theme": "light", "position": "bottom-right", "greeting": "Hello! How can I help you today?", "colors": {"primary": "#3B82F6", "secondary": "#10B981"}}', 'https://api.romashka.com/webhooks/website', '550e8400-e29b-41d4-a716-446655440302'),
('550e8400-e29b-41d4-a716-446655440401', 'Email Support', 'email', 'active', '{"email": "support@romashka.com", "auto_reply": true, "signature": "Best regards,\nROMASHKA Support Team"}', 'https://api.romashka.com/webhooks/email', '550e8400-e29b-41d4-a716-446655440302'),
('550e8400-e29b-41d4-a716-446655440402', 'WhatsApp Business', 'whatsapp', 'active', '{"phone_number": "+1-555-ROMASHKA", "business_name": "ROMASHKA Support", "welcome_message": "Welcome to ROMASHKA! How can we assist you today?"}', 'https://api.romashka.com/webhooks/whatsapp', '550e8400-e29b-41d4-a716-446655440302')
ON CONFLICT (id) DO NOTHING;

-- ================================
-- WORKFLOW SEED DATA
-- ================================

-- Sample workflows
INSERT INTO workflows (id, user_id, name, description, trigger_type, trigger_conditions, nodes, connections, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440500', '550e8400-e29b-41d4-a716-446655440302', 'Auto-Assignment Workflow', 'Automatically assign new conversations to available agents based on workload', 'conversation_created', '{"conditions": [{"field": "channel_type", "operator": "equals", "value": "website"}]}', '[{"id": "start", "type": "trigger", "data": {"label": "New Conversation"}}, {"id": "check_availability", "type": "condition", "data": {"label": "Check Agent Availability"}}, {"id": "assign_agent", "type": "action", "data": {"label": "Assign to Agent", "algorithm": "least_loaded"}}, {"id": "send_notification", "type": "action", "data": {"label": "Notify Agent"}}]', '[{"source": "start", "target": "check_availability"}, {"source": "check_availability", "target": "assign_agent"}, {"source": "assign_agent", "target": "send_notification"}]', true),
('550e8400-e29b-41d4-a716-446655440501', '550e8400-e29b-41d4-a716-446655440302', 'Escalation Workflow', 'Escalate conversations based on sentiment and complexity', 'message_received', '{"conditions": [{"field": "sentiment", "operator": "equals", "value": "negative"}, {"field": "ai_confidence", "operator": "less_than", "value": 0.7}]}', '[{"id": "start", "type": "trigger", "data": {"label": "Negative Sentiment Detected"}}, {"id": "escalate", "type": "action", "data": {"label": "Escalate to Human Agent"}}, {"id": "notify_supervisor", "type": "action", "data": {"label": "Notify Supervisor"}}]', '[{"source": "start", "target": "escalate"}, {"source": "escalate", "target": "notify_supervisor"}]', true)
ON CONFLICT (id) DO NOTHING;

-- ================================
-- PLAYGROUND & WIDGET SEED DATA
-- ================================

-- Sample playground sessions
INSERT INTO playground_sessions (id, user_id, session_name, bot_configuration, test_conversations, performance_metrics) VALUES
('550e8400-e29b-41d4-a716-446655440600', '550e8400-e29b-41d4-a716-446655440302', 'Default Bot Configuration', '{"personality": "helpful", "tone": "professional", "knowledge_base_enabled": true, "fallback_enabled": true, "confidence_threshold": 0.8, "max_response_length": 500}', '[{"id": "test_1", "messages": [{"role": "user", "content": "Hello"}, {"role": "assistant", "content": "Hello! How can I help you today?"}]}]', '{"avg_response_time": 1200, "confidence_avg": 0.85, "success_rate": 0.92}'),
('550e8400-e29b-41d4-a716-446655440601', '550e8400-e29b-41d4-a716-446655440302', 'Technical Support Bot', '{"personality": "technical", "tone": "professional", "knowledge_base_enabled": true, "fallback_enabled": true, "confidence_threshold": 0.9, "specialization": "technical_support"}', '[]', '{"avg_response_time": 1500, "confidence_avg": 0.89, "success_rate": 0.88}')
ON CONFLICT (id) DO NOTHING;

-- Sample widget configurations
INSERT INTO widget_configurations (id, user_id, widget_name, domain, configuration, status, embed_code) VALUES
('550e8400-e29b-41d4-a716-446655440700', '550e8400-e29b-41d4-a716-446655440302', 'Main Website Widget', 'romashka.com', '{"theme": "light", "position": "bottom-right", "greeting": "Hello! How can I help you today?", "colors": {"primary": "#3B82F6", "secondary": "#10B981"}, "features": {"file_upload": true, "emoji": true, "typing_indicator": true}}', 'active', '<script>/* Widget embed code */</script>'),
('550e8400-e29b-41d4-a716-446655440701', '550e8400-e29b-41d4-a716-446655440302', 'Documentation Widget', 'docs.romashka.com', '{"theme": "light", "position": "bottom-right", "greeting": "Need help with our documentation?", "colors": {"primary": "#8B5CF6", "secondary": "#10B981"}, "features": {"search": true, "quick_actions": true}}', 'active', '<script>/* Docs widget embed code */</script>')
ON CONFLICT (id) DO NOTHING;

-- ================================
-- REALTIME METRICS SEED DATA
-- ================================

-- Sample realtime metrics
INSERT INTO realtime_metrics (metric_name, metric_value, dimensions, expires_at) VALUES
('active_conversations', 12, '{"channel": "website"}', NOW() + INTERVAL '1 hour'),
('avg_response_time', 1250, '{"department": "support"}', NOW() + INTERVAL '1 hour'),
('agent_utilization', 0.75, '{"agent_id": "550e8400-e29b-41d4-a716-446655440300"}', NOW() + INTERVAL '1 hour'),
('satisfaction_score', 4.6, '{"period": "today"}', NOW() + INTERVAL '1 hour'),
('ai_confidence', 0.87, '{"model": "gpt-4"}', NOW() + INTERVAL '1 hour'),
('queue_size', 3, '{"department": "technical"}', NOW() + INTERVAL '1 hour'),
('handoff_rate', 0.15, '{"period": "today"}', NOW() + INTERVAL '1 hour'),
('resolution_rate', 0.92, '{"period": "today"}', NOW() + INTERVAL '1 hour')
ON CONFLICT DO NOTHING;

-- ================================
-- SAMPLE CONVERSATION NOTES
-- ================================

-- Sample conversation notes
INSERT INTO conversation_notes (conversation_id, agent_id, note, is_internal, note_type) VALUES
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440300', 'Customer was very patient and understanding. Account issue resolved by password reset.', true, 'resolution'),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440301', 'Technical issue required escalation to development team. Bug report filed.', true, 'escalation'),
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440300', 'Billing inquiry resolved. Customer upgraded to pro plan.', true, 'general'),
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440301', 'API integration completed successfully. Customer provided positive feedback.', true, 'resolution')
ON CONFLICT DO NOTHING;

-- ================================
-- SAMPLE CANNED RESPONSES
-- ================================

-- Additional canned responses
INSERT INTO canned_responses (title, content, shortcut, category, language, usage_count, is_public) VALUES
('Welcome to ROMASHKA', 'Welcome to ROMASHKA! I''m here to help you with any questions about our customer support platform. How can I assist you today?', '/welcome-romashka', 'Greetings', 'en', 15, true),
('API Documentation', 'You can find our comprehensive API documentation at https://docs.romashka.com/api. It includes authentication, endpoints, examples, and SDKs.', '/api-docs', 'Technical', 'en', 8, true),
('Trial Extension', 'I''d be happy to help extend your trial period. Let me connect you with our sales team to discuss your specific needs.', '/trial-extend', 'Sales', 'en', 3, true),
('Integration Support', 'Our integration team can help you set up connections with popular tools like Slack, Zendesk, and Salesforce. Would you like me to schedule a consultation?', '/integration-help', 'Technical', 'en', 12, true),
('Feedback Request', 'Thank you for using ROMASHKA! Your feedback is important to us. Would you mind taking a moment to rate your experience?', '/feedback', 'General', 'en', 20, true)
ON CONFLICT (title) DO NOTHING;

-- Seed data setup complete
SELECT 'ROMASHKA Development Seed Data Setup Complete!' as status;