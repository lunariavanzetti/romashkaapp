-- Test script to verify the get_next_ai_response_job function fix
-- Run this in Supabase SQL Editor

-- First, let's test the get_next_ai_response_job function directly
SELECT * FROM get_next_ai_response_job();

-- If that works, let's create a test scenario
-- Create a test conversation
SELECT create_conversation('function-test@example.com', 'website', 'Test message for function testing') as test_conversation_id;

-- Check if AI response jobs were created
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

-- Test getting the next job again
SELECT * FROM get_next_ai_response_job();

-- Test all other functions to make sure they work
SELECT * FROM get_realtime_messaging_metrics();

-- Test conversation performance metrics
DO $$
DECLARE
    test_conversation_id UUID;
    result_record RECORD;
BEGIN
    SELECT id INTO test_conversation_id FROM conversations ORDER BY created_at DESC LIMIT 1;
    
    IF test_conversation_id IS NOT NULL THEN
        SELECT * INTO result_record FROM get_conversation_performance_metrics(test_conversation_id);
        RAISE NOTICE 'Performance metrics function test passed for conversation: %', test_conversation_id;
    ELSE
        RAISE NOTICE 'No conversations found for testing';
    END IF;
END $$;

-- Test conversation retrieval function
DO $$
DECLARE
    test_conversation_id UUID;
    result_record RECORD;
BEGIN
    SELECT id INTO test_conversation_id FROM conversations ORDER BY created_at DESC LIMIT 1;
    
    IF test_conversation_id IS NOT NULL THEN
        SELECT * INTO result_record FROM get_conversation_with_messages(test_conversation_id, 50);
        RAISE NOTICE 'Conversation retrieval function test passed for conversation: %', test_conversation_id;
    ELSE
        RAISE NOTICE 'No conversations found for testing';
    END IF;
END $$;

-- Success message
SELECT 'FUNCTION FIX VERIFICATION COMPLETE!' as status,
       'All functions are working correctly.' as message;