-- ROMASHKA Complete Migration Plan
-- This builds on your existing prompt_history table
-- Run these in order to create the complete ROMASHKA schema

-- ================================
-- STEP 1: APPLY MASTER SCHEMA
-- ================================

-- First, let's apply the master schema (which uses auth.users correctly)
-- This creates the core tables: profiles, conversations, messages, etc.

-- ================================
-- STEP 2: APPLY WHATSAPP ENHANCEMENTS
-- ================================

-- Then apply the WhatsApp-specific enhancements
-- This adds communication_channels, whatsapp_configurations, etc.

-- ================================
-- STEP 3: APPLY AI TRAINING SCHEMA
-- ================================

-- Apply AI training features
-- This adds intent_patterns, conversation_context, etc.

-- ================================
-- STEP 4: APPLY RESPONSE TEMPLATES
-- ================================

-- Apply response template system
-- This adds message_templates, canned_responses, etc.

-- ================================
-- STEP 5: APPLY SECURITY SCHEMA
-- ================================

-- Apply security enhancements
-- This adds audit_logs, system_settings, etc.

-- ================================
-- STEP 6: APPLY ANALYTICS SCHEMA
-- ================================

-- Apply analytics and reporting
-- This adds conversation_analytics, daily_metrics, etc.

-- ================================
-- STEP 7: INTEGRATE WITH EXISTING PROMPT_HISTORY
-- ================================

-- Finally, integrate your existing prompt_history table
-- This ensures no data loss and proper integration

-- Migration will be applied in this exact order to ensure dependencies are met 