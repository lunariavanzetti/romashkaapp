-- Test script to verify duplicate cleanup and constraint addition
-- Run this in Supabase SQL Editor

-- STEP 1: Check for duplicate phone numbers BEFORE migration
SELECT 
    phone,
    COUNT(*) as duplicate_count,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record
FROM customer_profiles 
WHERE phone IS NOT NULL 
GROUP BY phone 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- STEP 2: See all records with duplicate phone numbers
SELECT 
    id,
    name,
    email,
    phone,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY phone ORDER BY created_at ASC) as row_num
FROM customer_profiles 
WHERE phone IN (
    SELECT phone 
    FROM customer_profiles 
    WHERE phone IS NOT NULL 
    GROUP BY phone 
    HAVING COUNT(*) > 1
)
ORDER BY phone, created_at;

-- STEP 3: Preview which records WOULD BE DELETED (simulation)
-- This shows what the cleanup will remove
SELECT 
    id,
    name,
    email,
    phone,
    created_at,
    'WOULD BE DELETED' as action
FROM customer_profiles 
WHERE id NOT IN (
    SELECT DISTINCT ON (phone) id 
    FROM customer_profiles 
    WHERE phone IS NOT NULL 
    ORDER BY phone, created_at ASC
) AND phone IS NOT NULL
ORDER BY phone, created_at;

-- STEP 4: Preview which records WOULD BE KEPT (simulation)
-- This shows what the cleanup will preserve
SELECT 
    id,
    name,
    email,
    phone,
    created_at,
    'WOULD BE KEPT' as action
FROM customer_profiles 
WHERE id IN (
    SELECT DISTINCT ON (phone) id 
    FROM customer_profiles 
    WHERE phone IS NOT NULL 
    ORDER BY phone, created_at ASC
) AND phone IS NOT NULL
ORDER BY phone, created_at;

-- STEP 5: Check if unique constraint already exists
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
    AND kcu.column_name = 'phone';

-- AFTER RUNNING THE MIGRATION, run these verification queries:

-- STEP 6: Verify no duplicates remain
SELECT 
    phone,
    COUNT(*) as count_should_be_1
FROM customer_profiles 
WHERE phone IS NOT NULL 
GROUP BY phone 
HAVING COUNT(*) > 1;

-- STEP 7: Verify constraint was created
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
    AND kcu.column_name = 'phone';

-- STEP 8: Test the create_conversation function works now
SELECT create_conversation('test-cleanup@example.com', 'website', 'Test after cleanup');
SELECT create_conversation('+9999999999', 'sms', 'Test phone after cleanup');

-- STEP 9: Verify conversations were created
SELECT 
    c.id,
    c.customer_name,
    c.channel_type,
    c.customer_phone,
    c.user_email,
    c.created_at
FROM conversations c
ORDER BY c.created_at DESC
LIMIT 5;