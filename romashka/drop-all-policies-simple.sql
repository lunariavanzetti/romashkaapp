-- Drop All RLS Policies - Simple & Safe Version
-- This removes all existing policies to prevent conflicts with complete-schema.sql

-- Drop ALL existing policies using the system catalog (most reliable approach)
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Get all existing policies in the public schema
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        -- Drop each policy
        BEGIN
            EXECUTE format('DROP POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
            RAISE NOTICE 'Dropped policy % on table %', r.policyname, r.tablename;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not drop policy % on table %: %', r.policyname, r.tablename, SQLERRM;
        END;
    END LOOP;
END $$;

-- Verification - show any remaining policies (should be empty)
SELECT 
  'Remaining Policies Check' as check_type,
  COUNT(*)::text || ' policies remaining' as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ ALL POLICIES CLEARED'
    ELSE '⚠ Some policies still exist'
  END as status
FROM pg_policies 
WHERE schemaname = 'public';

-- If any policies remain, show them
SELECT 
  'Remaining Policy Details' as check_type,
  tablename,
  policyname,
  'Still exists' as status
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Show current table count
SELECT 
  'Database Status' as check_type,
  COUNT(*)::text || ' tables exist' as count,
  '✓ READY FOR COMPLETE SCHEMA' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

SELECT 'All RLS policies cleared! Now run complete-schema.sql' as status;