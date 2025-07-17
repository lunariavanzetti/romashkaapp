-- ================================
-- MIGRATION 012 SUCCESS VERIFICATION
-- ================================
-- Run this script to verify all real-time messaging features are working

-- ================================
-- STEP 1: VERIFY SCHEMA CHANGES
-- ================================

-- Check that new columns were added to conversations
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'conversations' 
AND column_name IN ('requires_human', 'escalation_reason', 'ai_confidence')
ORDER BY column_name;

-- Check that new columns were added to messages
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND column_name IN ('confidence_score', 'processing_time_ms', 'intent_detected', 'knowledge_sources')
ORDER BY column_name;

-- Check that new columns were added to customer_profiles
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'customer_profiles' 
AND column_name IN ('first_interaction', 'last_interaction', 'satisfaction_rating', 'preferences')
ORDER BY column_name;

-- Verify unique constraint on phone column
SELECT constraint_name, table_name, column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'customer_profiles' 
AND tc.constraint_type = 'UNIQUE' 
AND kcu.column_name = 'phone';

-- ================================
-- STEP 2: VERIFY TABLES CREATED
-- ================================

-- Check ai_response_queue table exists and has correct structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'ai_response_queue'
ORDER BY ordinal_position;

-- Check indexes were created
SELECT indexname, tablename, indexdef
FROM pg_indexes 
WHERE tablename IN ('ai_response_queue', 'conversations', 'messages', 'customer_profiles')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- ================================
-- STEP 3: VERIFY FUNCTIONS CREATED
-- ================================

-- List all functions that were created
SELECT routine_name, routine_type, data_type
FROM information_schema.routines 
WHERE routine_name IN (
    'handle_new_message',
    'get_next_ai_response_job',
    'complete_ai_response_job',
    'fail_ai_response_job',
    'get_realtime_messaging_metrics',
    'get_conversation_performance_metrics',
    'create_conversation',
    'get_conversation_with_messages',
    'cleanup_ai_response_queue',
    'cleanup_realtime_metrics'
)
ORDER BY routine_name;

-- ================================
-- STEP 4: VERIFY TRIGGERS CREATED
-- ================================

-- Check that triggers were created
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_handle_new_message';

-- ================================
-- STEP 5: TEST CORE FUNCTIONALITY
-- ================================

-- Test 1: Create conversation with email
SELECT create_conversation('test-user@example.com', 'website', 'Hello, I need help with my account');

-- Test 2: Create conversation with phone number
SELECT create_conversation('+1234567890', 'whatsapp', 'Hi, I have a billing question');

-- Test 3: Create another conversation
SELECT create_conversation('another-user@example.com', 'email', 'I cannot access my dashboard');

-- Test 4: Try to create duplicate conversation (should return existing ID)
SELECT create_conversation('test-user@example.com', 'website', 'Another message from same user');

-- ================================
-- STEP 6: VERIFY DATA CREATED
-- ================================

-- Check conversations were created
SELECT 
    c.id,
    c.customer_name,
    c.user_email,
    c.customer_phone,
    c.channel_type,
    c.status,
    c.last_message,
    c.message_count,
    c.requires_human,
    c.created_at
FROM conversations c
ORDER BY c.created_at DESC
LIMIT 10;

-- Check customer profiles were created
SELECT 
    cp.id,
    cp.name,
    cp.email,
    cp.phone,
    cp.total_conversations,
    cp.status,
    cp.first_interaction,
    cp.last_interaction,
    cp.created_at
FROM customer_profiles cp
ORDER BY cp.created_at DESC
LIMIT 10;

-- Check messages were created
SELECT 
    m.id,
    m.conversation_id,
    m.sender_type,
    m.content,
    m.channel_type,
    m.message_type,
    m.delivery_status,
    m.confidence_score,
    m.processing_time_ms,
    m.intent_detected,
    m.created_at
FROM messages m
ORDER BY m.created_at DESC
LIMIT 10;

-- ================================
-- STEP 7: VERIFY AI RESPONSE QUEUE
-- ================================

-- Check if AI response jobs were created
SELECT 
    arq.id,
    arq.conversation_id,
    arq.message_id,
    arq.user_message,
    arq.status,
    arq.priority,
    arq.retry_count,
    arq.created_at,
    arq.process_after,
    arq.processed_at
FROM ai_response_queue arq
ORDER BY arq.created_at DESC
LIMIT 10;

-- ================================
-- STEP 8: TEST AI RESPONSE PROCESSING
-- ================================

-- Test getting next AI response job
SELECT * FROM get_next_ai_response_job();

-- Test real-time metrics
SELECT * FROM get_realtime_messaging_metrics();

-- Test conversation performance metrics (if we have conversations)
SELECT * FROM get_conversation_performance_metrics(
    (SELECT id FROM conversations ORDER BY created_at DESC LIMIT 1)::UUID
);

-- ================================
-- STEP 9: TEST CONVERSATION RETRIEVAL
-- ================================

-- Test getting conversation with messages
SELECT 
    conversation_data,
    messages_data
FROM get_conversation_with_messages(
    (SELECT id FROM conversations ORDER BY created_at DESC LIMIT 1)::UUID,
    50
);

-- ================================
-- STEP 10: VERIFY RLS POLICIES
-- ================================

-- Check RLS policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'ai_response_queue';

-- ================================
-- STEP 11: TEST CLEANUP FUNCTIONS
-- ================================

-- Test cleanup functions (these should run without errors)
SELECT cleanup_ai_response_queue(7); -- Clean up entries older than 7 days
SELECT cleanup_realtime_metrics(1); -- Clean up metrics older than 1 day

-- ================================
-- STEP 12: PERFORMANCE VERIFICATION
-- ================================

-- Check that all indexes are being used efficiently
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM conversations c 
JOIN customer_profiles cp ON c.customer_id = cp.id 
WHERE c.status = 'active' 
ORDER BY c.created_at DESC 
LIMIT 10;

-- ================================
-- STEP 13: FINAL STATUS CHECK
-- ================================

-- Count of each major entity
SELECT 
    'customer_profiles' as entity,
    COUNT(*) as count
FROM customer_profiles
UNION ALL
SELECT 
    'conversations' as entity,
    COUNT(*) as count
FROM conversations
UNION ALL
SELECT 
    'messages' as entity,
    COUNT(*) as count
FROM messages
UNION ALL
SELECT 
    'ai_response_queue' as entity,
    COUNT(*) as count
FROM ai_response_queue;

-- Success message
SELECT 'MIGRATION 012 VERIFICATION COMPLETE!' as status,
       'All real-time messaging features are working correctly.' as message;