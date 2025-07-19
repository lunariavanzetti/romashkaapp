-- Check the actual structure of the workflows table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'workflows'
ORDER BY ordinal_position;

-- Also check if the table exists and what columns it has
\d workflows