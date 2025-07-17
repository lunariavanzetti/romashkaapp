-- Test script to verify ambiguity fix works
-- Run this in Supabase SQL Editor after applying the migration

-- Step 1: Test the fixed create_conversation function
SELECT create_conversation('test1@example.com', 'website', 'Test message 1');

-- Step 2: Test with different channels
SELECT create_conversation('test2@example.com', 'whatsapp', 'Test message 2');
SELECT create_conversation('+1234567890', 'sms', 'Test message 3');

-- Step 3: Test duplicate conversation (should return existing ID)
SELECT create_conversation('test1@example.com', 'website', 'Another message');

-- Step 4: Verify conversations were created
SELECT 
    c.id,
    c.customer_id,
    c.customer_name,
    c.channel_type,
    c.status,
    c.last_message,
    c.created_at
FROM conversations c
ORDER BY c.created_at DESC
LIMIT 10;

-- Step 5: Verify customer profiles were created
SELECT 
    cp.id,
    cp.name,
    cp.email,
    cp.phone,
    cp.total_conversations,
    cp.created_at
FROM customer_profiles cp
ORDER BY cp.created_at DESC
LIMIT 10;

-- Step 6: Test the get_conversation_with_messages function
SELECT 
    conversation_data,
    messages_data
FROM get_conversation_with_messages(
    (SELECT id FROM conversations ORDER BY created_at DESC LIMIT 1)::UUID,
    10
);

-- Step 7: Check AI response queue
SELECT 
    id,
    conversation_id,
    status,
    priority,
    created_at,
    process_after
FROM ai_response_queue
ORDER BY created_at DESC
LIMIT 5;