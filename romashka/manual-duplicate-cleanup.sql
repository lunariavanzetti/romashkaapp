-- Manual Duplicate Cleanup Script
-- Use this if you want to manually handle duplicate phone numbers
-- before running the main migration

-- ================================
-- STEP 1: ANALYZE DUPLICATES
-- ================================

-- Find all duplicate phone numbers
SELECT 
    phone,
    COUNT(*) as duplicate_count,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record,
    MIN(id) as oldest_id,
    MAX(id) as newest_id
FROM customer_profiles 
WHERE phone IS NOT NULL 
GROUP BY phone 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- See detailed info about each duplicate
SELECT 
    id,
    name,
    email,
    phone,
    total_conversations,
    created_at,
    last_interaction,
    status,
    ROW_NUMBER() OVER (PARTITION BY phone ORDER BY created_at ASC) as row_num,
    CASE 
        WHEN ROW_NUMBER() OVER (PARTITION BY phone ORDER BY created_at ASC) = 1 
        THEN 'KEEP (oldest)' 
        ELSE 'DELETE' 
    END as recommended_action
FROM customer_profiles 
WHERE phone IN (
    SELECT phone 
    FROM customer_profiles 
    WHERE phone IS NOT NULL 
    GROUP BY phone 
    HAVING COUNT(*) > 1
)
ORDER BY phone, created_at;

-- ================================
-- STEP 2: MANUAL CLEANUP OPTIONS
-- ================================

-- Option A: Delete duplicates automatically (keeps oldest record)
-- Uncomment the following block to run:

/*
DELETE FROM customer_profiles 
WHERE id NOT IN (
    SELECT DISTINCT ON (phone) id 
    FROM customer_profiles 
    WHERE phone IS NOT NULL 
    ORDER BY phone, created_at ASC
) AND phone IS NOT NULL;
*/

-- Option B: Delete specific duplicates by ID
-- Replace the IDs below with the actual IDs you want to delete
-- Example:
-- DELETE FROM customer_profiles WHERE id IN (
--     'uuid-of-duplicate-1',
--     'uuid-of-duplicate-2'
-- );

-- Option C: Merge duplicate records (advanced)
-- This is more complex and requires custom logic based on your data
-- Example approach:
/*
WITH merged_data AS (
    SELECT 
        phone,
        MIN(id) as keep_id,
        MAX(total_conversations) as max_conversations,
        MAX(last_interaction) as latest_interaction,
        MIN(created_at) as earliest_created
    FROM customer_profiles 
    WHERE phone IS NOT NULL 
    GROUP BY phone 
    HAVING COUNT(*) > 1
)
UPDATE customer_profiles 
SET 
    total_conversations = merged_data.max_conversations,
    last_interaction = merged_data.latest_interaction
FROM merged_data 
WHERE customer_profiles.id = merged_data.keep_id;

-- Then delete the duplicates
DELETE FROM customer_profiles 
WHERE id NOT IN (
    SELECT DISTINCT ON (phone) id 
    FROM customer_profiles 
    WHERE phone IS NOT NULL 
    ORDER BY phone, created_at ASC
) AND phone IS NOT NULL;
*/

-- ================================
-- STEP 3: VERIFY CLEANUP
-- ================================

-- Check if any duplicates remain
SELECT 
    phone,
    COUNT(*) as count_should_be_1
FROM customer_profiles 
WHERE phone IS NOT NULL 
GROUP BY phone 
HAVING COUNT(*) > 1;

-- ================================
-- STEP 4: ADD UNIQUE CONSTRAINT
-- ================================

-- After cleanup, add the unique constraint
ALTER TABLE customer_profiles ADD CONSTRAINT customer_profiles_phone_key UNIQUE (phone);

-- ================================
-- STEP 5: VERIFY CONSTRAINT
-- ================================

-- Verify the constraint was added
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

-- Test that duplicates are now prevented
-- This should work:
INSERT INTO customer_profiles (phone, name, email) 
VALUES ('+test123456', 'Test User', 'test@example.com');

-- This should fail with a unique constraint violation:
-- INSERT INTO customer_profiles (phone, name, email) 
-- VALUES ('+test123456', 'Another User', 'another@example.com');

-- Clean up test record
DELETE FROM customer_profiles WHERE phone = '+test123456';