-- Test script to verify unique constraint fix works
-- Run this in Supabase SQL Editor after applying the updated migration

-- Step 1: Verify the unique constraint was added
SELECT 
    constraint_name,
    table_name,
    column_name,
    constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'customer_profiles' 
    AND tc.constraint_type = 'UNIQUE'
ORDER BY constraint_name;

-- Step 2: Test create_conversation with email (should work)
SELECT create_conversation('test-email@example.com', 'website', 'Hi, I need help with my account');

-- Step 3: Test create_conversation with phone (should work now)
SELECT create_conversation('+1234567890', 'sms', 'Hello, I have a question about billing');

-- Step 4: Test another phone number
SELECT create_conversation('+0987654321', 'whatsapp', 'I need assistance with my order');

-- Step 5: Test duplicate email (should return existing conversation ID)
SELECT create_conversation('test-email@example.com', 'website', 'Another message');

-- Step 6: Test duplicate phone (should return existing conversation ID)
SELECT create_conversation('+1234567890', 'sms', 'Another message');

-- Step 7: Verify conversations were created correctly
SELECT 
    c.id,
    c.customer_id,
    c.customer_name,
    c.channel_type,
    c.status,
    c.last_message,
    c.user_email,
    c.customer_phone,
    c.created_at
FROM conversations c
ORDER BY c.created_at DESC
LIMIT 10;

-- Step 8: Verify customer profiles were created correctly
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

-- Step 9: Test get_conversation_with_messages function
SELECT 
    conversation_data,
    messages_data
FROM get_conversation_with_messages(
    (SELECT id FROM conversations WHERE customer_phone = '+1234567890' LIMIT 1)::UUID,
    10
);

-- Step 10: Check AI response queue was populated
SELECT 
    id,
    conversation_id,
    status,
    priority,
    created_at
FROM ai_response_queue
ORDER BY created_at DESC
LIMIT 5;