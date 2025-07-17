-- Test both fixed functions
-- Run this in Supabase SQL Editor after applying the fixes

-- Test 1: Test get_next_ai_response_job function
SELECT 'Testing get_next_ai_response_job function...' as test_step;
SELECT * FROM get_next_ai_response_job();

-- Test 2: Test get_realtime_messaging_metrics function  
SELECT 'Testing get_realtime_messaging_metrics function...' as test_step;
SELECT * FROM get_realtime_messaging_metrics();

-- Test 3: Test with different time window
SELECT 'Testing get_realtime_messaging_metrics with 30 minute window...' as test_step;
SELECT * FROM get_realtime_messaging_metrics(30);

-- Test 4: Create a test conversation to generate some data
SELECT 'Creating test conversation for function testing...' as test_step;
SELECT create_conversation('function-test-user@example.com', 'website', 'Test message for function verification') as test_conversation_id;

-- Test 5: Check if AI response jobs were created
SELECT 'Checking AI response queue after conversation creation...' as test_step;
SELECT 
    id,
    conversation_id,
    message_id,
    user_message,
    status,
    priority,
    created_at
FROM ai_response_queue
ORDER BY created_at DESC
LIMIT 5;

-- Test 6: Test get_next_ai_response_job again (should now have data)
SELECT 'Testing get_next_ai_response_job with real data...' as test_step;
SELECT * FROM get_next_ai_response_job();

-- Test 7: Test conversation performance metrics
SELECT 'Testing conversation performance metrics...' as test_step;
DO $$
DECLARE
    test_conversation_id UUID;
    result_record RECORD;
BEGIN
    SELECT id INTO test_conversation_id FROM conversations ORDER BY created_at DESC LIMIT 1;
    
    IF test_conversation_id IS NOT NULL THEN
        SELECT * INTO result_record FROM get_conversation_performance_metrics(test_conversation_id);
        RAISE NOTICE 'Conversation performance metrics test passed for conversation: %', test_conversation_id;
    ELSE
        RAISE NOTICE 'No conversations found to test performance metrics';
    END IF;
END $$;

-- Test 8: Test conversation with messages function
SELECT 'Testing get_conversation_with_messages function...' as test_step;
DO $$
DECLARE
    test_conversation_id UUID;
    result_record RECORD;
BEGIN
    SELECT id INTO test_conversation_id FROM conversations ORDER BY created_at DESC LIMIT 1;
    
    IF test_conversation_id IS NOT NULL THEN
        SELECT * INTO result_record FROM get_conversation_with_messages(test_conversation_id, 50);
        RAISE NOTICE 'Conversation with messages test passed for conversation: %', test_conversation_id;
    ELSE
        RAISE NOTICE 'No conversations found to test conversation retrieval';
    END IF;
END $$;

-- Test 9: Test cleanup functions
SELECT 'Testing cleanup functions...' as test_step;
SELECT cleanup_ai_response_queue(7) as cleaned_old_queue_entries;
SELECT cleanup_realtime_metrics(1) as cleaned_old_metrics;

-- Test 10: Final verification - all functions work
SELECT 'Final verification - testing all core functions...' as test_step;

-- This should all work without errors now:
SELECT COUNT(*) as total_conversations FROM conversations;
SELECT COUNT(*) as total_messages FROM messages;
SELECT COUNT(*) as total_customer_profiles FROM customer_profiles;
SELECT COUNT(*) as total_ai_response_queue FROM ai_response_queue;

-- Success message
SELECT 'ALL FUNCTIONS WORKING CORRECTLY!' as status,
       'Real-time messaging system is fully operational.' as message;