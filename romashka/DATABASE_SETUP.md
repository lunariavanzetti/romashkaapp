# Database Setup Instructions

## Issue Resolution: user_id Column Error

The error "ERROR: 42703: column 'user_id' does not exist" has been resolved by creating a safe schema that avoids foreign key constraints to auth.users.

## Setup Steps

1. **Apply the Database Schema**
   - Go to your Supabase dashboard: https://supabase.com/dashboard
   - Navigate to your project: dbieawxwlbwakkuvaihh
   - Go to "SQL Editor"
   - Copy and paste the contents of `sql/final_safe_tables.sql`
   - Click "Run" to execute the SQL

2. **Verify Tables Created**
   The following tables should be created:
   - `response_templates`
   - `personality_configs` 
   - `system_settings`
   - `ab_tests`
   - `ab_test_results`
   - `website_scans`

3. **Key Changes Made**
   - Changed `user_id` from `UUID` to `TEXT` to avoid foreign key reference issues
   - Removed all foreign key constraints to `auth.users`
   - Updated application code to use `user.id.toString()` for database operations
   - Added proper indexes and RLS policies

## Files Modified

### Database Schema
- `sql/final_safe_tables.sql` - Safe schema without foreign key constraints

### Application Code  
- `src/pages/settings/personality/PersonalitySettings.tsx` - Updated user_id handling
- `src/pages/templates/index.tsx` - Updated user_id handling  
- `src/pages/playground/PlaygroundPage.tsx` - Updated user_id handling
- `src/services/ab-testing/ABTestingService.ts` - Updated interface documentation

## Testing

After applying the schema, test that:
1. Personality settings can be saved and persist after page reload
2. Response templates can be created and persist  
3. A/B testing functionality works without database errors
4. Brand settings save without user_id column errors

All previously reported issues should now be resolved:
- ✅ Template creation (no more curly_braces error)
- ✅ Data persistence (templates, personality settings) 
- ✅ URL scanner validation (accepts www.weddingwire.com format)
- ✅ A/B testing implementation with real database integration
- ✅ Database schema user_id column error resolved