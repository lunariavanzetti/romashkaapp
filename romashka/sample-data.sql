-- Sample data for Romashka Analytics
-- Run this after the main schema setup

-- Insert sample conversations
INSERT INTO conversations (id, user_name, user_email, status, created_at, last_message, message_count, satisfaction_score, language, sentiment, intent, ai_confidence) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'John Doe', 'john@example.com', 'resolved', NOW() - INTERVAL '7 days', 'Thank you for your help!', 8, 4.5, 'en', 'positive', 'customer_support', 0.85),
('550e8400-e29b-41d4-a716-446655440002', 'Jane Smith', 'jane@example.com', 'resolved', NOW() - INTERVAL '6 days', 'Issue resolved successfully', 12, 4.8, 'en', 'positive', 'technical_support', 0.92),
('550e8400-e29b-41d4-a716-446655440003', 'Bob Wilson', 'bob@example.com', 'active', NOW() - INTERVAL '2 hours', 'Can you help me with this?', 5, NULL, 'en', 'neutral', 'general_inquiry', 0.75),
('550e8400-e29b-41d4-a716-446655440004', 'Alice Brown', 'alice@example.com', 'resolved', NOW() - INTERVAL '5 days', 'Perfect, thank you!', 6, 4.7, 'en', 'positive', 'billing', 0.88),
('550e8400-e29b-41d4-a716-446655440005', 'Charlie Davis', 'charlie@example.com', 'resolved', NOW() - INTERVAL '4 days', 'That worked!', 10, 4.6, 'en', 'positive', 'technical_support', 0.91),
('550e8400-e29b-41d4-a716-446655440006', 'Diana Evans', 'diana@example.com', 'active', NOW() - INTERVAL '1 hour', 'I have a question', 3, NULL, 'en', 'neutral', 'general_inquiry', 0.78),
('550e8400-e29b-41d4-a716-446655440007', 'Frank Garcia', 'frank@example.com', 'resolved', NOW() - INTERVAL '3 days', 'Great service!', 7, 4.9, 'en', 'positive', 'customer_support', 0.94),
('550e8400-e29b-41d4-a716-446655440008', 'Grace Harris', 'grace@example.com', 'resolved', NOW() - INTERVAL '2 days', 'All sorted now', 9, 4.4, 'en', 'positive', 'billing', 0.87),
('550e8400-e29b-41d4-a716-446655440009', 'Henry Ivanov', 'henry@example.com', 'active', NOW() - INTERVAL '30 minutes', 'Need assistance', 2, NULL, 'en', 'neutral', 'technical_support', 0.82),
('550e8400-e29b-41d4-a716-446655440010', 'Ivy Johnson', 'ivy@example.com', 'resolved', NOW() - INTERVAL '1 day', 'Thanks a lot!', 11, 4.6, 'en', 'positive', 'customer_support', 0.89);

-- Insert sample messages
INSERT INTO messages (conversation_id, sender_type, content, created_at, confidence_score, processing_time_ms) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'user', 'Hello, I need help with my account', NOW() - INTERVAL '7 days', 0.85, 1200),
('550e8400-e29b-41d4-a716-446655440001', 'ai', 'Hello! I''d be happy to help you with your account. What specific issue are you experiencing?', NOW() - INTERVAL '7 days' + INTERVAL '30 seconds', 0.92, 800),
('550e8400-e29b-41d4-a716-446655440001', 'user', 'I can''t log in to my dashboard', NOW() - INTERVAL '7 days' + INTERVAL '60 seconds', 0.78, 1500),
('550e8400-e29b-41d4-a716-446655440001', 'ai', 'I understand you''re having trouble logging in. Let me help you troubleshoot this. Have you tried resetting your password?', NOW() - INTERVAL '7 days' + INTERVAL '90 seconds', 0.88, 1100),
('550e8400-e29b-41d4-a716-446655440001', 'user', 'Thank you for your help!', NOW() - INTERVAL '7 days' + INTERVAL '120 seconds', 0.95, 600),
('550e8400-e29b-41d4-a716-446655440002', 'user', 'Hi, I have a technical issue', NOW() - INTERVAL '6 days', 0.82, 1400),
('550e8400-e29b-41d4-a716-446655440002', 'ai', 'Hello! I''m here to help with your technical issue. Could you please describe what you''re experiencing?', NOW() - INTERVAL '6 days' + INTERVAL '25 seconds', 0.89, 950),
('550e8400-e29b-41d4-a716-446655440003', 'user', 'Can you help me with this?', NOW() - INTERVAL '2 hours', 0.75, 1800),
('550e8400-e29b-41d4-a716-446655440003', 'ai', 'Of course! I''d be happy to help. What can I assist you with today?', NOW() - INTERVAL '2 hours' + INTERVAL '20 seconds', 0.81, 1200),
('550e8400-e29b-41d4-a716-446655440004', 'user', 'I have a billing question', NOW() - INTERVAL '5 days', 0.88, 1100),
('550e8400-e29b-41d4-a716-446655440004', 'ai', 'I''d be happy to help with your billing question. What specific information do you need?', NOW() - INTERVAL '5 days' + INTERVAL '15 seconds', 0.91, 850),
('550e8400-e29b-41d4-a716-446655440005', 'user', 'API integration help needed', NOW() - INTERVAL '4 days', 0.91, 1300),
('550e8400-e29b-41d4-a716-446655440005', 'ai', 'I can help you with API integration. What specific aspect do you need assistance with?', NOW() - INTERVAL '4 days' + INTERVAL '18 seconds', 0.94, 920);

-- Insert sample knowledge base
INSERT INTO knowledge_base (title, content, category, usage_count, helpful_count, not_helpful_count) VALUES
('Account Setup Guide', 'Complete guide for setting up your account including verification steps and initial configuration.', 'Getting Started', 45, 42, 3),
('Password Reset Instructions', 'Step-by-step instructions for resetting your password securely.', 'Account Management', 23, 21, 2),
('API Integration Guide', 'How to integrate our API into your application with code examples.', 'Technical', 67, 65, 2),
('Billing FAQ', 'Common billing questions and answers including payment methods and invoices.', 'Billing', 34, 32, 2),
('Troubleshooting Guide', 'Common issues and their solutions for technical problems.', 'Technical', 56, 54, 2);

-- Insert sample intent patterns
INSERT INTO intent_patterns (intent_name, language, patterns, examples) VALUES
('customer_support', 'en', ARRAY['help', 'support', 'issue', 'problem', 'trouble'], '{"examples": ["I need help", "Having an issue", "Need support"]}'),
('technical_support', 'en', ARRAY['technical', 'api', 'integration', 'error', 'bug'], '{"examples": ["API error", "Technical issue", "Integration problem"]}'),
('billing', 'en', ARRAY['billing', 'payment', 'invoice', 'charge', 'cost'], '{"examples": ["Billing question", "Payment issue", "Invoice problem"]}'),
('general_inquiry', 'en', ARRAY['question', 'inquiry', 'information', 'about'], '{"examples": ["I have a question", "Looking for information", "General inquiry"]}'); 