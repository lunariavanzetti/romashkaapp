# 🔧 URGENT FIX: customer_id Column Error

## ⚠️ Problem
You're seeing the error: `"ERROR: 42703: column "customer_id" does not exist"`

## ✅ Quick Fix (2 minutes)

### Step 1: Run the Fix Script
1. Open your Supabase SQL Editor
2. Copy and paste the entire contents of `fix-customer-id-error.sql`
3. Click "Run" to execute the script

### Step 2: Verify the Fix
1. Copy and paste the contents of `verify-schema-fix.sql` 
2. Click "Run" to verify everything works
3. Look for ✓ symbols indicating success

## 📋 What the Fix Does
- Creates `customer_profiles` table if missing
- Adds `customer_id` column to `conversations` table
- Creates `customer_channel_preferences` table with proper foreign keys
- Adds necessary indexes for performance
- Sets up Row Level Security (RLS) policies
- Inserts test data to verify everything works

## 🎯 Expected Results
After running the fix, you should see:
```
✓ customer_profiles table EXISTS
✓ customer_id column in conversations EXISTS  
✓ customer_channel_preferences table EXISTS
✓ Foreign key constraints working
✓ Indexes created
✓ RLS policies active
✓ Test data insertion successful
```

## 🚨 If You Still Get Errors

### Error: "relation auth.users does not exist"
This is a Supabase setup issue. Make sure you're running this in Supabase, not a regular PostgreSQL database.

### Error: "permission denied"
Make sure you're logged in as an admin user in Supabase.

### Error: "syntax error"
Copy the entire SQL file content carefully without any modifications.

## 📖 Files to Use

1. **`fix-customer-id-error.sql`** - The main fix script (run this first)
2. **`verify-schema-fix.sql`** - Verification script (run this second)
3. **`DATABASE_SCHEMA_FIX.md`** - Detailed documentation
4. **`complete-schema.sql`** - Run this after the fix is complete

## 🔄 Next Steps After Fix
1. ✅ Run `fix-customer-id-error.sql`
2. ✅ Run `verify-schema-fix.sql`
3. ✅ Run `complete-schema.sql` (full schema)
4. ✅ Test your application

## 📞 Still Need Help?
If you're still having issues after following these steps, please share:
1. The exact error message you're seeing
2. Which step is failing
3. The output from `verify-schema-fix.sql`

The fix should resolve the customer_id column error immediately. The scripts are designed to be safe and won't break existing data.