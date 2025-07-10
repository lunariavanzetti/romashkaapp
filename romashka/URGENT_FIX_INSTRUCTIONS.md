# 🔧 URGENT FIX: customer_id Column Error

## ⚠️ Problem
You're seeing the error: `"ERROR: 42703: column "customer_id" does not exist"`

## ✅ Quick Fix (2 minutes)

### If you got "ON CONFLICT" or "ambiguous column" errors:
1. **Use the latest script:** `fix-customer-id-error-v3.sql`
2. **Use the updated verification:** `verify-schema-fix-v2.sql`
3. **If you need to start fresh:** Run `cleanup-before-fix.sql` first (⚠️ deletes data!)

### Step 1: Run the Fix Script
1. Open your Supabase SQL Editor
2. Copy and paste the entire contents of `fix-customer-id-error-v3.sql`
3. Click "Run" to execute the script

### Step 2: Verify the Fix
1. Copy and paste the contents of `verify-schema-fix-v2.sql` 
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

### Error: "there is no unique or exclusion constraint matching the ON CONFLICT specification"
**Solution:** Use `fix-customer-id-error-v3.sql` instead of the original script.

### Error: "column reference 'table_name' is ambiguous"
**Solution:** Use `verify-schema-fix-v2.sql` instead of the original verify script.

### Error: "column 'status' does not exist"
**Solution:** Run `pre-complete-schema-patch.sql` before running `complete-schema.sql`.

### Error: "relation auth.users does not exist"
This is a Supabase setup issue. Make sure you're running this in Supabase, not a regular PostgreSQL database.

### Error: "permission denied"
Make sure you're logged in as an admin user in Supabase.

### Error: "syntax error"
Copy the entire SQL file content carefully without any modifications.

### Error: "relation already exists"
If you need to start fresh, run `cleanup-before-fix.sql` first (⚠️ deletes data!)

## 📖 Files to Use

1. **`fix-customer-id-error-v3.sql`** - The main fix script (run this first) - LATEST VERSION
2. **`cleanup-before-fix.sql`** - Optional cleanup script (if you need to start fresh)
3. **`verify-schema-fix-v2.sql`** - Verification script (run this second) - UPDATED VERSION
4. **`pre-complete-schema-patch.sql`** - Patch script (run this third) - ADDS MISSING COLUMNS
5. **`DATABASE_SCHEMA_FIX.md`** - Detailed documentation
6. **`complete-schema.sql`** - Run this after the patch is complete

## 🔄 Next Steps After Fix
1. ✅ Run `fix-customer-id-error-v3.sql`
2. ✅ Run `verify-schema-fix-v2.sql`
3. ✅ Run `pre-complete-schema-patch.sql` (adds missing columns)
4. ✅ Run `complete-schema.sql` (full schema)
5. ✅ Test your application

## 📞 Still Need Help?
If you're still having issues after following these steps, please share:
1. The exact error message you're seeing
2. Which step is failing
3. The output from `verify-schema-fix.sql`

The fix should resolve the customer_id column error immediately. The scripts are designed to be safe and won't break existing data.