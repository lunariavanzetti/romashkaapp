-- Test script to verify fixed migration works
-- Run this step by step in Supabase SQL editor

-- Step 1: Test the fixed create_conversation function
SELECT create_conversation('john.doe@example.com', 'website', 'Hi, I need help with my account settings');

-- Step 2: Test creating multiple conversations
SELECT create_conversation('jane.smith@example.com', 'whatsapp', 'Hello, I have a question about billing');
SELECT create_conversation('mike.johnson@example.com', 'email', 'I cannot access my dashboard');

-- Step 3: Verify conversations were created
SELECT 
    c.id,
    c.customer_name,
    c.channel_type,
    c.status,
    c.last_message,
    c.created_at
FROM conversations c
ORDER BY c.created_at DESC
LIMIT 10;

-- Step 4: Test the get_conversation_with_messages function
SELECT * FROM get_conversation_with_messages(
    (SELECT id FROM conversations ORDER BY created_at DESC LIMIT 1)::UUID,
    50
);

-- Step 5: Verify customer profiles were created
SELECT 
    id,
    name,
    email,
    phone,
    total_conversations,
    created_at
FROM customer_profiles
ORDER BY created_at DESC;