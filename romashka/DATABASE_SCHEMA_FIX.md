# Database Schema Fix - customer_id Column Error

## Issue Description
The error `"ERROR: 42703: column "customer_id" does not exist"` occurs when:
1. Tables are created in wrong order (referencing tables created before referenced tables)
2. Existing table structure conflicts with new schema
3. Missing foreign key relationships

## Root Cause Analysis
The error happens because:
- `conversations` table references `customer_profiles(id)` via `customer_id` column
- `customer_channel_preferences` table references `customer_profiles(id)` via `customer_id` column
- If `customer_profiles` table doesn't exist or wasn't created first, the foreign key reference fails

## Solution

### Step 1: Run the Fix Script
Execute `fix-customer-id-error.sql` in your Supabase SQL Editor:

```sql
-- This script will:
-- 1. Create customer_profiles table if it doesn't exist
-- 2. Add customer_id column to conversations table if missing
-- 3. Create customer_channel_preferences table with correct references
-- 4. Add necessary indexes and RLS policies
-- 5. Insert sample data for testing
```

### Step 2: Alternative Manual Fix
If you prefer to fix manually, follow these steps:

1. **Check existing tables:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('customer_profiles', 'conversations', 'customer_channel_preferences');
```

2. **Create customer_profiles first:**
```sql
CREATE TABLE IF NOT EXISTS customer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  location VARCHAR(255),
  timezone VARCHAR(50) DEFAULT 'UTC',
  language VARCHAR(10) DEFAULT 'en',
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  total_conversations INTEGER DEFAULT 0,
  avg_satisfaction DECIMAL(3,2) DEFAULT 0,
  last_interaction TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

3. **Add customer_id to conversations table:**
```sql
-- Only run if customer_id column doesn't exist
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE;
```

4. **Create customer_channel_preferences:**
```sql
CREATE TABLE IF NOT EXISTS customer_channel_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE,
  channel_type VARCHAR(50) NOT NULL,
  is_preferred BOOLEAN DEFAULT false,
  opt_in BOOLEAN DEFAULT true,
  last_interaction TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, channel_type)
);
```

### Step 3: Verify the Fix
Run this query to confirm everything is working:

```sql
SELECT 
  'customer_profiles' as table_name,
  CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'customer_profiles'
UNION ALL
SELECT 
  'customer_id column in conversations' as table_name,
  CASE WHEN column_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'customer_id';
```

## Table Creation Order
To prevent similar issues, always create tables in this order:

1. **Core tables (no dependencies):**
   - `profiles` (auth.users reference)
   - `customer_profiles`
   - `knowledge_categories`

2. **Tables with single dependencies:**
   - `conversations` (depends on customer_profiles, profiles)
   - `messages` (depends on conversations, profiles)
   - `knowledge_items` (depends on knowledge_categories, profiles)

3. **Tables with multiple dependencies:**
   - `customer_channel_preferences` (depends on customer_profiles)
   - `conversation_notes` (depends on conversations, profiles)
   - `file_attachments` (depends on conversations, messages, profiles)

## Common Issues & Solutions

### Issue 1: "relation customer_profiles does not exist"
**Solution:** Run the customer_profiles table creation first:
```sql
CREATE TABLE IF NOT EXISTS customer_profiles (...);
```

### Issue 2: "column customer_id does not exist" in conversations
**Solution:** Add the column:
```sql
ALTER TABLE conversations ADD COLUMN customer_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE;
```

### Issue 3: RLS policies failing
**Solution:** Enable RLS and create policies:
```sql
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated access" ON customer_profiles FOR ALL USING (auth.role() = 'authenticated');
```

## Testing the Fix
After running the fix, test with:

```sql
-- Insert test customer
INSERT INTO customer_profiles (email, name) VALUES ('test@example.com', 'Test User');

-- Insert test conversation
INSERT INTO conversations (customer_id, user_name, user_email) 
SELECT id, 'Test User', 'test@example.com' FROM customer_profiles WHERE email = 'test@example.com';

-- Insert test preference
INSERT INTO customer_channel_preferences (customer_id, channel_type, is_preferred)
SELECT id, 'email', true FROM customer_profiles WHERE email = 'test@example.com';

-- Verify data
SELECT 
  cp.name as customer_name,
  c.id as conversation_id,
  ccp.channel_type,
  ccp.is_preferred
FROM customer_profiles cp
LEFT JOIN conversations c ON cp.id = c.customer_id
LEFT JOIN customer_channel_preferences ccp ON cp.id = ccp.customer_id
WHERE cp.email = 'test@example.com';
```

## Prevention
To avoid similar issues in the future:

1. **Always use IF NOT EXISTS** when creating tables
2. **Create parent tables before child tables** 
3. **Use proper foreign key constraints**
4. **Test schema changes in a staging environment first**
5. **Use migration scripts instead of manual SQL execution**

## Next Steps
After fixing the customer_id issue:
1. Run the complete schema: `complete-schema.sql`
2. Test all table relationships
3. Insert sample data for testing
4. Verify all foreign key constraints work correctly

## Files Modified
- `fix-customer-id-error.sql` - The main fix script
- `complete-schema.sql` - Updated with correct table order
- `DATABASE_SCHEMA_FIX.md` - This documentation