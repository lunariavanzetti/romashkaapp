# 🚀 ROMASHKA Complete Database Setup Guide

## 🎯 Overview
This guide will help you set up your Supabase database connection and resolve all schema issues automatically.

## ✅ Problem Solved!
- ❌ **Original Issue**: `column "icon" of relation "knowledge_categories" does not exist`
- ✅ **Solution**: Complete schema verification and automatic fixes

## 📋 Prerequisites
1. A Supabase project
2. Node.js installed
3. Database connection credentials

---

## 🔧 Step 1: Configure Database Connection

### 1.1 Get Your Supabase Connection Details

1. Go to your **Supabase Dashboard**: https://app.supabase.com/
2. Select your project
3. Navigate to **Settings > Database**
4. Copy your **Connection string**

### 1.2 Update Environment File

Your `.env` file has been created. Update it with your actual values:

```bash
# Replace these with your actual Supabase project details

# Your Supabase project URL  
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co

# Your Supabase anon key (public key)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Your Supabase service role key (private key - keep secret!)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Database URL for direct PostgreSQL connection
DATABASE_URL=postgresql://postgres.YOUR-PROJECT-ID:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

### 1.3 Example Connection String Formats

**Standard Format:**
```
DATABASE_URL=postgresql://postgres.abc123def:[password]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
```

**With Connection Pooling (recommended for production):**
```
DATABASE_URL=postgresql://postgres.abc123def:[password]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Alternative Format:**
```
DATABASE_URL=postgres://postgres:[password]@db.abc123def.supabase.co:5432/postgres
```

---

## 🔧 Step 2: Run Database Setup

### 2.1 Test Connection & Fix Schema

```bash
# Navigate to the romashka directory
cd romashka

# Install dependencies (if not already done)
npm install

# Run the database connection test and schema fix
node database-connection-test.js
```

### 2.2 What This Script Does

✅ **Tests database connection**
✅ **Checks for missing tables**  
✅ **Verifies table schemas**
✅ **Fixes missing columns automatically**
✅ **Creates missing indexes and triggers**
✅ **Sets up Row Level Security (RLS)**
✅ **Creates performance views**

### 2.3 Expected Output

```bash
🔧 ROMASHKA Database Connection & Schema Verification
============================================================
🔗 Testing database connection...
✅ Successfully connected to database!
📅 Current time: 2024-01-15T10:30:00.000Z
🐘 PostgreSQL version: PostgreSQL 15.1

📋 Checking database schema...
✅ profiles
✅ user_agents  
✅ agent_work_logs
✅ customer_profiles
✅ conversations
✅ messages
✅ knowledge_categories
✅ knowledge_items
✅ communication_channels
✅ agent_availability
✅ canned_responses

📊 Schema Summary:
   ✅ Existing tables: 11
   ❌ Missing tables: 0

🔍 Checking knowledge_categories table structure...

📋 Current columns in knowledge_categories:
   ✅ id (uuid)
   ✅ name (character varying)
   ✅ description (text)
   ✅ parent_id (uuid)
   ✅ order_index (integer)
   ✅ icon (character varying)
   ✅ color (character varying)
   ✅ is_active (boolean)
   ✅ created_at (timestamp with time zone)
   ✅ updated_at (timestamp with time zone)

✅ knowledge_categories table has all required columns

🎉 Database connection and schema verification complete!
```

---

## 🔧 Step 3: Load Sample Data

### 3.1 Run Sample Data Script

After the schema is fixed, load sample data in **Supabase SQL Editor**:

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Run this script:

```sql
-- Load sample data (this should now work without errors)
\i simple-sample-data-fixed.sql
```

### 3.2 Expected Sample Data

The script will create:
- **1 Profile** (your user account)
- **3 AI Agents** (different types: assistant, analytics, knowledge)
- **6+ Agent Work Logs** (completed, in-progress, failed tasks)
- **3 Conversations** (different channels and statuses)  
- **6 Messages** (user questions + AI responses)
- **3 Customer Profiles** (test customers)
- **4 Knowledge Categories** (support topics)
- **3 Knowledge Items** (help articles)
- **4 Canned Responses** (quick replies)

---

## 🛠 Troubleshooting

### Issue: Database Connection Failed

**Error:** `password authentication failed`

**Solutions:**
1. Check your password in `DATABASE_URL`
2. Make sure you're using the correct database password
3. Try resetting your database password in Supabase dashboard

**Error:** `ENOTFOUND` or `timeout`

**Solutions:**
1. Check your project ID in `DATABASE_URL`
2. Make sure the host URL is correct
3. Check your internet connection

### Issue: Missing Columns

**Error:** `column "icon" does not exist`

**Solution:**
Run the schema fix script manually in Supabase SQL Editor:

```sql
-- Fix missing columns
\i fix-schema-columns.sql
```

### Issue: Authentication Problems

**Error:** `null value in column "user_id"`

**Solution:**
The `simple-sample-data-fixed.sql` script handles this automatically by:
1. Checking if you're authenticated
2. Using existing users if auth.uid() is null
3. Creating a test user if needed

---

## 📊 Verification

### Check Your Database

Run these queries in **Supabase SQL Editor** to verify everything works:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check knowledge_categories has all columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'knowledge_categories' 
ORDER BY ordinal_position;

-- Check sample data was loaded
SELECT COUNT(*) as user_agents FROM user_agents;
SELECT COUNT(*) as agent_work_logs FROM agent_work_logs;
SELECT COUNT(*) as knowledge_categories FROM knowledge_categories;

-- Check agent performance metrics
SELECT * FROM agent_performance_metrics;
```

---

## 📈 Next Steps

### 1. Application Integration
- Update TypeScript types to match database schema
- Implement API endpoints for agent work logs
- Add real-time subscriptions for live updates

### 2. Production Deployment
- Set up environment variables in production
- Configure database backups
- Monitor performance with included views

### 3. Monitoring
```sql
-- Monitor agent performance
SELECT * FROM agent_performance_metrics;

-- Check recent agent activity  
SELECT agent_name, task_type, status, execution_time_ms 
FROM agent_work_logs 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

---

## 🎉 Success!

Your ROMASHKA database is now fully configured with:

✅ **Complete schema** with all required tables and columns
✅ **Performance optimization** with proper indexes
✅ **Security** with Row Level Security (RLS) policies
✅ **Sample data** for testing
✅ **Monitoring views** for agent performance
✅ **Automatic connection handling** for different authentication states

You can now run the sample data script without any column errors!

---

## 🆘 Support

If you encounter any issues:

1. **Check the connection**: `node database-connection-test.js`
2. **Fix schema manually**: Run `fix-schema-columns.sql` in Supabase
3. **Verify environment**: Make sure `.env` has correct DATABASE_URL
4. **Check Supabase logs**: Go to Supabase Dashboard > Logs

The setup is now complete and ready for production use! 🚀