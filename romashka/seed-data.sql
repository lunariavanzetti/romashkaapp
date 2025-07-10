-- ROMASHKA Seed Data
-- Development and testing data for the platform
-- Version: 1.0.0

-- ================================
-- SYSTEM SETTINGS
-- ================================

INSERT INTO system_settings (setting_key, setting_value, description, is_public) VALUES
('platform_name', '"ROMASHKA"', 'Platform name', true),
('platform_version', '"1.0.0"', 'Current platform version', true),
('default_language', '"en"', 'Default system language', true),
('default_timezone', '"UTC"', 'Default system timezone', true),
('conversation_auto_close_time', '3600', 'Auto-close inactive conversations after seconds', false),
('agent_auto_away_time', '300', 'Set agents to away after seconds of inactivity', false),
('auto_assignment_algorithm', '"least_loaded"', 'Agent assignment algorithm: round_robin, least_loaded', false),
('sla_first_response_seconds', '60', 'First response SLA in seconds', false),
('sla_resolution_seconds', '1800', 'Resolution SLA in seconds', false),
('max_conversation_history', '100', 'Maximum conversation history per customer', false),
('ai_confidence_threshold', '0.8', 'Minimum AI confidence threshold', false),
('knowledge_base_enabled', 'true', 'Enable knowledge base functionality', false),
('canned_responses_enabled', 'true', 'Enable canned responses', false),
('file_upload_enabled', 'true', 'Enable file uploads', false),
('max_file_size_mb', '10', 'Maximum file size in MB', false),
('supported_file_types', '["image/jpeg", "image/png", "image/gif", "application/pdf", "text/plain"]', 'Supported file types', false),
('webhook_retry_attempts', '3', 'Number of webhook retry attempts', false),
('webhook_timeout_seconds', '30', 'Webhook timeout in seconds', false),
('daily_message_limit', '1000', 'Daily message limit per channel', false),
('satisfaction_survey_enabled', 'true', 'Enable satisfaction surveys', false),
('analytics_retention_days', '365', 'Analytics data retention in days', false),
('audit_log_retention_days', '90', 'Audit log retention in days', false),
('conversation_history_retention', '365', 'Conversation history retention in days', false),
('backup_retention_days', '30', 'Backup retention in days', false),
('maintenance_window', '{"start": "02:00", "end": "04:00", "timezone": "UTC"}', 'Maintenance window configuration', false),
('rate_limiting_enabled', 'true', 'Enable rate limiting', false),
('rate_limit_requests_per_minute', '100', 'Rate limit requests per minute', false),
('email_notifications_enabled', 'true', 'Enable email notifications', false),
('push_notifications_enabled', 'true', 'Enable push notifications', false),
('real_time_updates_enabled', 'true', 'Enable real-time updates', false),
('multi_language_enabled', 'true', 'Enable multi-language support', false),
('supported_languages', '["en", "es", "fr", "de", "it", "pt", "ru", "zh", "ja", "ko"]', 'Supported languages', true),
('default_working_hours', '{"monday": {"start": "09:00", "end": "17:00"}, "tuesday": {"start": "09:00", "end": "17:00"}, "wednesday": {"start": "09:00", "end": "17:00"}, "thursday": {"start": "09:00", "end": "17:00"}, "friday": {"start": "09:00", "end": "17:00"}}', 'Default working hours', false),
('customer_satisfaction_scale', '5', 'Customer satisfaction scale (1-5 or 1-10)', false),
('ai_handoff_threshold', '0.5', 'AI confidence threshold for handoff to human', false),
('max_concurrent_chats_per_agent', '5', 'Maximum concurrent chats per agent', false),
('widget_default_theme', '"modern"', 'Default widget theme', true),
('widget_position', '"bottom-right"', 'Default widget position', true),
('widget_colors', '{"primary": "#007bff", "secondary": "#6c757d", "success": "#28a745", "danger": "#dc3545"}', 'Widget color scheme', true),
('gdpr_compliance_enabled', 'true', 'Enable GDPR compliance features', false),
('data_encryption_enabled', 'true', 'Enable data encryption', false),
('two_factor_auth_enabled', 'false', 'Enable two-factor authentication', false),
('password_policy', '{"minLength": 8, "requireNumbers": true, "requireSymbols": true, "requireUppercase": true}', 'Password policy settings', false),
('session_timeout_minutes', '480', 'Session timeout in minutes', false),
('ip_whitelist_enabled', 'false', 'Enable IP whitelist', false),
('brute_force_protection_enabled', 'true', 'Enable brute force protection', false),
('api_versioning_enabled', 'true', 'Enable API versioning', false),
('webhook_security_enabled', 'true', 'Enable webhook security', false),
('cors_enabled', 'true', 'Enable CORS', false),
('allowed_origins', '["https://romashka.com", "https://app.romashka.com"]', 'Allowed CORS origins', false),
('database_health_check_enabled', 'true', 'Enable database health checks', false),
('monitoring_enabled', 'true', 'Enable system monitoring', false),
('error_tracking_enabled', 'true', 'Enable error tracking', false),
('performance_monitoring_enabled', 'true', 'Enable performance monitoring', false),
('last_maintenance_date', '""', 'Last maintenance date', false),
('system_status', '"operational"', 'Current system status', true),
('feature_flags', '{"newDashboard": true, "advancedAnalytics": true, "aiAssistant": true}', 'Feature flags', false)
ON CONFLICT (setting_key) DO NOTHING;

-- ================================
-- KNOWLEDGE CATEGORIES
-- ================================

INSERT INTO knowledge_categories (id, name, description, order_index, icon, color) VALUES
(gen_random_uuid(), 'Getting Started', 'Basic information for new users', 1, 'play-circle', '#007bff'),
(gen_random_uuid(), 'Account Management', 'User account and profile management', 2, 'user-circle', '#28a745'),
(gen_random_uuid(), 'Billing & Payments', 'Billing, subscription, and payment information', 3, 'credit-card', '#ffc107'),
(gen_random_uuid(), 'Technical Support', 'Technical issues and troubleshooting', 4, 'tools', '#dc3545'),
(gen_random_uuid(), 'Feature Guides', 'Detailed guides for platform features', 5, 'book-open', '#6f42c1'),
(gen_random_uuid(), 'Integrations', 'Third-party integrations and API documentation', 6, 'link', '#20c997'),
(gen_random_uuid(), 'Troubleshooting', 'Common issues and solutions', 7, 'exclamation-triangle', '#fd7e14'),
(gen_random_uuid(), 'FAQ', 'Frequently asked questions', 8, 'question-circle', '#6c757d'),
(gen_random_uuid(), 'Policies', 'Terms of service, privacy policy, and compliance', 9, 'shield-alt', '#495057'),
(gen_random_uuid(), 'Best Practices', 'Recommended practices and tips', 10, 'lightbulb', '#e83e8c');

-- ================================
-- SAMPLE KNOWLEDGE ITEMS
-- ================================

WITH categories AS (
  SELECT id, name FROM knowledge_categories
)
INSERT INTO knowledge_items (
  title, 
  content, 
  category_id, 
  source_type, 
  language, 
  status, 
  confidence_score,
  effectiveness_score,
  tags
) VALUES
-- Getting Started
(
  'How to Create Your First Conversation',
  'Welcome to ROMASHKA! Creating your first conversation is easy. Simply click the "New Conversation" button in the dashboard, enter your customer details, and start chatting. Our AI will assist you with intelligent suggestions and knowledge base recommendations.',
  (SELECT id FROM categories WHERE name = 'Getting Started'),
  'manual',
  'en',
  'active',
  0.9,
  0.8,
  ARRAY['setup', 'conversation', 'first-time', 'tutorial']
),
(
  'Setting Up Your Agent Profile',
  'Configure your agent profile by navigating to Settings > Profile. Add your name, profile picture, and set your availability hours. This information will be visible to customers during conversations.',
  (SELECT id FROM categories WHERE name = 'Getting Started'),
  'manual',
  'en',
  'active',
  0.8,
  0.7,
  ARRAY['profile', 'setup', 'agent', 'configuration']
),
-- Account Management
(
  'Updating Your Account Information',
  'To update your account information, go to Settings > Account. Here you can change your email, password, company information, and notification preferences. Changes are saved automatically.',
  (SELECT id FROM categories WHERE name = 'Account Management'),
  'manual',
  'en',
  'active',
  0.8,
  0.9,
  ARRAY['account', 'profile', 'settings', 'update']
),
(
  'Managing Team Members',
  'Add team members by going to Settings > Team. Click "Invite Member", enter their email, and select their role (Agent, Admin, or User). They will receive an invitation email to join your workspace.',
  (SELECT id FROM categories WHERE name = 'Account Management'),
  'manual',
  'en',
  'active',
  0.9,
  0.8,
  ARRAY['team', 'invite', 'members', 'roles']
),
-- Billing & Payments
(
  'Understanding Your Subscription',
  'ROMASHKA offers flexible subscription plans. Your current plan includes specific limits for conversations, agents, and storage. Upgrade at any time from Settings > Billing to access more features.',
  (SELECT id FROM categories WHERE name = 'Billing & Payments'),
  'manual',
  'en',
  'active',
  0.8,
  0.7,
  ARRAY['subscription', 'billing', 'plans', 'upgrade']
),
(
  'Managing Payment Methods',
  'Add or update payment methods in Settings > Billing > Payment Methods. We accept all major credit cards and PayPal. Your payment information is securely encrypted.',
  (SELECT id FROM categories WHERE name = 'Billing & Payments'),
  'manual',
  'en',
  'active',
  0.9,
  0.8,
  ARRAY['payment', 'billing', 'credit-card', 'paypal']
),
-- Technical Support
(
  'Troubleshooting Connection Issues',
  'If you experience connection issues: 1) Check your internet connection, 2) Clear browser cache, 3) Try a different browser, 4) Disable browser extensions, 5) Contact support if issues persist.',
  (SELECT id FROM categories WHERE name = 'Technical Support'),
  'manual',
  'en',
  'active',
  0.8,
  0.9,
  ARRAY['troubleshooting', 'connection', 'browser', 'support']
),
(
  'Widget Not Loading',
  'If the chat widget is not loading on your website: 1) Verify the embed code is correct, 2) Check for JavaScript errors, 3) Ensure CORS is properly configured, 4) Test in different browsers.',
  (SELECT id FROM categories WHERE name = 'Technical Support'),
  'manual',
  'en',
  'active',
  0.9,
  0.8,
  ARRAY['widget', 'loading', 'embed', 'javascript']
),
-- Feature Guides
(
  'Using Canned Responses',
  'Canned responses help you reply quickly to common questions. Create responses in Settings > Canned Responses. Use shortcuts like /greeting or /pricing during conversations for instant replies.',
  (SELECT id FROM categories WHERE name = 'Feature Guides'),
  'manual',
  'en',
  'active',
  0.9,
  0.9,
  ARRAY['canned-responses', 'shortcuts', 'efficiency', 'replies']
),
(
  'Setting Up Automated Workflows',
  'Automate repetitive tasks with workflows. Go to Settings > Workflows to create custom automation rules based on customer messages, intents, or keywords.',
  (SELECT id FROM categories WHERE name = 'Feature Guides'),
  'manual',
  'en',
  'active',
  0.8,
  0.7,
  ARRAY['workflows', 'automation', 'rules', 'efficiency']
),
-- Integrations
(
  'WhatsApp Business Integration',
  'Connect your WhatsApp Business account to handle customer conversations. Go to Settings > Integrations > WhatsApp and follow the setup wizard. You will need your WhatsApp Business API credentials.',
  (SELECT id FROM categories WHERE name = 'Integrations'),
  'manual',
  'en',
  'active',
  0.9,
  0.8,
  ARRAY['whatsapp', 'integration', 'business', 'api']
),
(
  'CRM Integration Setup',
  'Integrate with popular CRMs like Salesforce, HubSpot, or Zendesk. Go to Settings > Integrations, select your CRM, and follow the authentication process. Customer data will sync automatically.',
  (SELECT id FROM categories WHERE name = 'Integrations'),
  'manual',
  'en',
  'active',
  0.8,
  0.7,
  ARRAY['crm', 'integration', 'salesforce', 'hubspot', 'zendesk']
),
-- FAQ
(
  'What is ROMASHKA?',
  'ROMASHKA is a comprehensive customer support platform that combines AI-powered chatbots, live chat, and multi-channel communication to help businesses provide exceptional customer service.',
  (SELECT id FROM categories WHERE name = 'FAQ'),
  'manual',
  'en',
  'active',
  0.9,
  0.9,
  ARRAY['platform', 'description', 'features', 'overview']
),
(
  'How does AI assistance work?',
  'Our AI analyzes customer messages and provides intelligent suggestions, auto-responses, and knowledge base recommendations. It learns from your interactions to improve over time.',
  (SELECT id FROM categories WHERE name = 'FAQ'),
  'manual',
  'en',
  'active',
  0.8,
  0.8,
  ARRAY['ai', 'assistance', 'suggestions', 'learning']
);

-- ================================
-- SAMPLE CANNED RESPONSES
-- ================================

INSERT INTO canned_responses (title, content, shortcut, category, language, tags, is_public) VALUES
-- Greetings
('Welcome Greeting', 'Hello! Welcome to ROMASHKA support. How can I help you today?', '/greeting', 'greetings', 'en', ARRAY['greeting', 'welcome', 'initial'], true),
('Good Morning', 'Good morning! Thank you for contacting us. How may I assist you?', '/morning', 'greetings', 'en', ARRAY['greeting', 'morning', 'polite'], true),
('Good Evening', 'Good evening! I hope you are having a great day. How can I help you?', '/evening', 'greetings', 'en', ARRAY['greeting', 'evening', 'polite'], true),

-- Common Questions
('Pricing Information', 'Our pricing starts at $29/month for the Basic plan, which includes up to 1,000 conversations and 2 agents. For detailed pricing, please visit our pricing page or schedule a demo.', '/pricing', 'information', 'en', ARRAY['pricing', 'plans', 'cost'], true),
('Feature Overview', 'ROMASHKA includes AI-powered chat, live agent support, multi-channel communication, analytics, integrations, and much more. Would you like me to show you any specific feature?', '/features', 'information', 'en', ARRAY['features', 'overview', 'capabilities'], true),
('Demo Request', 'I would be happy to schedule a personalized demo for you! Please provide your preferred date and time, and I will send you a calendar invite.', '/demo', 'sales', 'en', ARRAY['demo', 'schedule', 'sales'], true),

-- Support Responses
('Technical Issue', 'I understand you are experiencing a technical issue. Let me help you troubleshoot this. Can you please describe the problem in detail?', '/technical', 'support', 'en', ARRAY['technical', 'troubleshooting', 'support'], true),
('Account Help', 'I can help you with your account. What specific account-related question do you have? (login, billing, settings, etc.)', '/account', 'support', 'en', ARRAY['account', 'help', 'login', 'billing'], true),
('Integration Help', 'I can assist you with integrations. Which service are you trying to integrate with ROMASHKA? (WhatsApp, CRM, Email, etc.)', '/integration', 'support', 'en', ARRAY['integration', 'setup', 'help'], true),

-- Closing Responses
('Resolution Confirmation', 'Great! I am glad we could resolve your issue. Is there anything else I can help you with today?', '/resolved', 'closing', 'en', ARRAY['resolution', 'confirmation', 'closing'], true),
('Follow-up', 'Thank you for contacting ROMASHKA support. If you have any other questions, please do not hesitate to reach out. Have a great day!', '/followup', 'closing', 'en', ARRAY['followup', 'closing', 'thanks'], true),
('Escalation', 'I understand this requires additional assistance. Let me connect you with a specialist who can provide more detailed help.', '/escalate', 'escalation', 'en', ARRAY['escalation', 'specialist', 'advanced'], true),

-- Sales Responses
('Trial Information', 'We offer a 14-day free trial with full access to all features. No credit card required! Would you like me to set up your trial account?', '/trial', 'sales', 'en', ARRAY['trial', 'free', 'signup'], true),
('Custom Plan', 'For enterprise needs, we offer custom plans with advanced features and dedicated support. Let me connect you with our sales team to discuss your requirements.', '/enterprise', 'sales', 'en', ARRAY['enterprise', 'custom', 'sales'], true),
('ROI Information', 'Our customers typically see a 40% reduction in support costs and 25% improvement in customer satisfaction within the first 3 months. Would you like to see specific case studies?', '/roi', 'sales', 'en', ARRAY['roi', 'benefits', 'case-study'], true),

-- Multilingual (Spanish)
('Saludo en Español', '¡Hola! Bienvenido al soporte de ROMASHKA. ¿Cómo puedo ayudarte hoy?', '/hola', 'greetings', 'es', ARRAY['saludo', 'bienvenida', 'español'], true),
('Información de Precios', 'Nuestros precios comienzan en $29/mes para el plan Básico. Para información detallada, visite nuestra página de precios o programe una demostración.', '/precios', 'information', 'es', ARRAY['precios', 'planes', 'costo'], true),

-- Multilingual (French)
('Salutation en Français', 'Bonjour! Bienvenue au support ROMASHKA. Comment puis-je vous aider aujourd''hui?', '/bonjour', 'greetings', 'fr', ARRAY['salutation', 'bienvenue', 'français'], true),
('Informations Tarifaires', 'Nos tarifs commencent à 29$/mois pour le plan de base. Pour des informations détaillées, visitez notre page de tarification ou planifiez une démo.', '/tarifs', 'information', 'fr', ARRAY['tarifs', 'plans', 'coût'], true);

-- ================================
-- SAMPLE COMMUNICATION CHANNELS
-- ================================

INSERT INTO communication_channels (name, type, status, configuration, message_limit_per_day) VALUES
('Website Chat', 'website', 'active', '{"theme": "modern", "position": "bottom-right", "colors": {"primary": "#007bff"}}', 10000),
('WhatsApp Business', 'whatsapp', 'inactive', '{"businessAccountId": "", "phoneNumber": "", "webhookUrl": ""}', 1000),
('Facebook Messenger', 'messenger', 'inactive', '{"pageId": "", "accessToken": "", "webhookUrl": ""}', 1000),
('Instagram Direct', 'instagram', 'inactive', '{"businessAccountId": "", "accessToken": "", "webhookUrl": ""}', 1000),
('Email Support', 'email', 'active', '{"smtpServer": "smtp.gmail.com", "port": 587, "username": "", "password": ""}', 5000),
('SMS Support', 'sms', 'inactive', '{"provider": "twilio", "accountSid": "", "authToken": "", "phoneNumber": ""}', 500);

-- ================================
-- SAMPLE MESSAGE TEMPLATES
-- ================================

INSERT INTO message_templates (name, language, category, template_content, channel_type, status) VALUES
('Welcome Message', 'en', 'utility', '{"text": "Welcome to {{company_name}}! We are here to help you.", "buttons": [{"text": "Get Started", "type": "quick_reply"}]}', 'whatsapp', 'approved'),
('Order Confirmation', 'en', 'utility', '{"text": "Your order #{{order_id}} has been confirmed. Total: ${{total_amount}}. Estimated delivery: {{delivery_date}}."}', 'whatsapp', 'approved'),
('Appointment Reminder', 'en', 'utility', '{"text": "Reminder: You have an appointment with {{agent_name}} tomorrow at {{appointment_time}}. Reply CONFIRM to confirm."}', 'sms', 'approved'),
('Password Reset', 'en', 'authentication', '{"text": "Your password reset code is: {{reset_code}}. This code expires in 10 minutes."}', 'sms', 'approved'),
('Shipping Update', 'en', 'utility', '{"text": "Your package has been shipped! Track it here: {{tracking_url}}"}', 'email', 'approved'),
('Feedback Request', 'en', 'marketing', '{"text": "How was your experience with us? Please rate us from 1-5 stars.", "buttons": [{"text": "⭐", "type": "quick_reply"}, {"text": "⭐⭐", "type": "quick_reply"}, {"text": "⭐⭐⭐", "type": "quick_reply"}, {"text": "⭐⭐⭐⭐", "type": "quick_reply"}, {"text": "⭐⭐⭐⭐⭐", "type": "quick_reply"}]}', 'whatsapp', 'approved');

-- ================================
-- SAMPLE INTENT PATTERNS
-- ================================

INSERT INTO intent_patterns (intent_name, language, patterns, examples, confidence_threshold) VALUES
('greeting', 'en', ARRAY['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'], '{"examples": ["Hello there", "Hi, how are you?", "Good morning", "Hey there!"]}', 0.8),
('pricing', 'en', ARRAY['price', 'cost', 'how much', 'pricing', 'plans', 'subscription'], '{"examples": ["How much does it cost?", "What are your prices?", "Tell me about your plans"]}', 0.8),
('support', 'en', ARRAY['help', 'support', 'problem', 'issue', 'bug', 'error'], '{"examples": ["I need help", "I have a problem", "There is an error", "Can you help me?"]}', 0.8),
('demo', 'en', ARRAY['demo', 'demonstration', 'show me', 'trial', 'test'], '{"examples": ["Can I get a demo?", "Show me how it works", "I want to try it"]}', 0.8),
('billing', 'en', ARRAY['billing', 'payment', 'invoice', 'subscription', 'charge'], '{"examples": ["I have a billing question", "My payment failed", "Where is my invoice?"]}', 0.8),
('goodbye', 'en', ARRAY['bye', 'goodbye', 'see you', 'thanks', 'thank you'], '{"examples": ["Goodbye", "Thanks for your help", "See you later"]}', 0.8),
('complaint', 'en', ARRAY['complaint', 'dissatisfied', 'unhappy', 'disappointed', 'angry'], '{"examples": ["I am not happy", "This is terrible", "I want to complain"]}', 0.7),
('compliment', 'en', ARRAY['great', 'excellent', 'amazing', 'love it', 'fantastic'], '{"examples": ["This is great!", "I love this product", "Excellent service"]}', 0.7);

-- ================================
-- SAMPLE DASHBOARD CONFIGURATIONS
-- ================================

INSERT INTO dashboard_configs (user_id, name, is_default, layout, filters, refresh_interval, is_public) VALUES
(
  '00000000-0000-0000-0000-000000000000'::uuid,
  'Default Dashboard',
  true,
  '{
    "widgets": [
      {"id": "conversations-today", "type": "metric", "position": {"x": 0, "y": 0, "w": 3, "h": 2}},
      {"id": "response-time", "type": "metric", "position": {"x": 3, "y": 0, "w": 3, "h": 2}},
      {"id": "satisfaction-score", "type": "metric", "position": {"x": 6, "y": 0, "w": 3, "h": 2}},
      {"id": "active-conversations", "type": "list", "position": {"x": 0, "y": 2, "w": 6, "h": 4}},
      {"id": "agent-performance", "type": "chart", "position": {"x": 6, "y": 2, "w": 6, "h": 4}},
      {"id": "channel-distribution", "type": "pie", "position": {"x": 0, "y": 6, "w": 4, "h": 3}},
      {"id": "hourly-volume", "type": "line", "position": {"x": 4, "y": 6, "w": 8, "h": 3}}
    ]
  }',
  '{"dateRange": "today", "channels": ["all"], "agents": ["all"]}',
  300,
  true
);

-- ================================
-- SAMPLE WORKFLOWS
-- ================================

INSERT INTO workflows (user_id, name, description, trigger_type, trigger_conditions, steps, nodes, connections, is_active) VALUES
(
  '00000000-0000-0000-0000-000000000000'::uuid,
  'Greeting Workflow',
  'Automatically greet new customers',
  'intent',
  '{"intent": "greeting", "confidence": 0.8}',
  '[{"id": "1", "type": "message", "config": {"text": "Hello! Welcome to our support. How can I help you today?"}}]',
  '[{"id": "1", "type": "message", "position": {"x": 100, "y": 100}}]',
  '[]',
  true
),
(
  '00000000-0000-0000-0000-000000000000'::uuid,
  'Escalation Workflow',
  'Escalate complex issues to human agents',
  'intent',
  '{"intent": "complaint", "confidence": 0.7}',
  '[{"id": "1", "type": "escalate", "config": {"department": "support", "priority": "high"}}]',
  '[{"id": "1", "type": "escalate", "position": {"x": 100, "y": 100}}]',
  '[]',
  true
);

-- ================================
-- SAMPLE SCHEDULED REPORTS
-- ================================

INSERT INTO scheduled_reports (name, description, report_type, schedule_cron, recipients, filters, format, is_active) VALUES
('Daily Performance Report', 'Daily summary of conversations and agent performance', 'performance', '0 9 * * *', ARRAY['admin@romashka.com'], '{"dateRange": "yesterday", "includeMetrics": ["conversations", "responseTime", "satisfaction"]}', 'pdf', true),
('Weekly Analytics Report', 'Weekly analytics and trends', 'ai_analytics', '0 9 * * 1', ARRAY['admin@romashka.com', 'manager@romashka.com'], '{"dateRange": "lastWeek", "includeCharts": true}', 'excel', true),
('Monthly Customer Satisfaction', 'Monthly customer satisfaction analysis', 'satisfaction', '0 9 1 * *', ARRAY['admin@romashka.com'], '{"dateRange": "lastMonth", "includeComments": true}', 'pdf', true);

-- ================================
-- SAMPLE WIDGET CONFIGURATIONS
-- ================================

INSERT INTO widget_configurations (user_id, widget_name, domain, configuration, status, custom_css) VALUES
(
  '00000000-0000-0000-0000-000000000000'::uuid,
  'Main Website Widget',
  'example.com',
  '{
    "theme": "modern",
    "position": "bottom-right",
    "colors": {
      "primary": "#007bff",
      "secondary": "#6c757d",
      "background": "#ffffff"
    },
    "greeting": "Hi! How can we help you today?",
    "placeholder": "Type your message...",
    "showAgent": true,
    "showTyping": true,
    "soundEnabled": true,
    "minimizable": true,
    "startMinimized": false,
    "showBranding": true,
    "offlineMessage": "We are currently offline. Please leave a message.",
    "workingHours": {
      "enabled": true,
      "timezone": "UTC",
      "schedule": {
        "monday": {"start": "09:00", "end": "17:00"},
        "tuesday": {"start": "09:00", "end": "17:00"},
        "wednesday": {"start": "09:00", "end": "17:00"},
        "thursday": {"start": "09:00", "end": "17:00"},
        "friday": {"start": "09:00", "end": "17:00"}
      }
    }
  }',
  'active',
  '.romashka-widget { box-shadow: 0 4px 12px rgba(0,0,0,0.15); }'
);

-- ================================
-- SAMPLE PLAYGROUND SESSIONS
-- ================================

INSERT INTO playground_sessions (user_id, session_name, bot_configuration, test_conversations, performance_metrics) VALUES
(
  '00000000-0000-0000-0000-000000000000'::uuid,
  'Customer Support Bot Test',
  '{
    "name": "Support Bot",
    "personality": "friendly and helpful",
    "knowledgeBase": true,
    "handoffEnabled": true,
    "confidenceThreshold": 0.8,
    "responseStyle": "conversational",
    "supportedLanguages": ["en", "es"],
    "features": {
      "intentRecognition": true,
      "entityExtraction": true,
      "sentimentAnalysis": true,
      "contextAware": true
    }
  }',
  '[
    {
      "id": "test1",
      "messages": [
        {"role": "user", "content": "Hello, I need help with my account"},
        {"role": "assistant", "content": "Hello! I would be happy to help you with your account. What specific issue are you experiencing?"},
        {"role": "user", "content": "I cannot log in"},
        {"role": "assistant", "content": "I can help you with login issues. Have you tried resetting your password?"}
      ],
      "metrics": {"responseTime": 150, "confidence": 0.85, "satisfaction": 4}
    }
  ]',
  '{
    "averageResponseTime": 150,
    "averageConfidence": 0.85,
    "totalTests": 1,
    "successRate": 1.0,
    "lastUpdated": "2024-01-15T10:00:00Z"
  }'
);

-- Success message
SELECT 'ROMASHKA Seed Data inserted successfully!' as status,
       'System is ready for development and testing' as message;