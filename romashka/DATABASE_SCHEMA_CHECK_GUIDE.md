# Database Schema Check Guide

## Why Check Your Database Schema?

Before implementing enterprise features, I need to understand what tables actually exist in your live database vs what's in your migration files. This will help me:

1. **Avoid conflicts** - Not create tables that already exist
2. **Build on existing structure** - Use your current schema effectively  
3. **Ensure compatibility** - Make sure new features work with your setup
4. **Optimize implementation** - Focus on what's actually missing

## Quick Check Methods

### Method 1: Node.js Script (Recommended)

1. **Set up environment variables**:
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Edit .env with your actual Supabase credentials
   nano .env
   ```

2. **Get your Supabase credentials**:
   - Go to your Supabase project dashboard
   - Click "Settings" → "API"
   - Copy your "Project URL" and "Project API keys" (anon key)

3. **Update .env file**:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Run the schema check**:
   ```bash
   node check-database-schema.js
   ```

### Method 2: Direct SQL in Supabase (Alternative)

If you prefer to run SQL directly:

1. Go to your Supabase project dashboard
2. Navigate to "SQL Editor"
3. Copy and paste queries from `check_actual_schema.sql`
4. Run each section and share the results

## What The Check Will Show

The script will check for these enterprise feature tables:

### 🎯 AI Training System Tables
- `ai_training_data` - Training data and results
- `training_sessions` - Training session management
- `training_metrics_history` - Performance tracking
- `training_conversations` - Conversation analysis
- `training_files` - File upload management
- `knowledge_gaps` - Gap analysis
- `learning_insights` - AI learning insights

### 📝 Template System Tables  
- `templates` - Response templates
- `template_categories` - Template organization
- `template_variables` - Dynamic content
- `response_templates` - Response management
- `message_templates` - Message templates
- `ai_training_sessions` - Template training
- `training_samples` - Template samples

### 📡 Channel Management Tables
- `communication_channels` - Channel configuration
- `channels` - Channel management
- `channel_configs` - Channel settings
- `whatsapp_channels` - WhatsApp integration
- `whatsapp_message_templates` - WhatsApp templates
- `channel_analytics` - Channel performance

### 🔧 Core System Tables
- `profiles` - User profiles
- `customer_profiles` - Customer data
- `conversations` - Chat conversations
- `messages` - Message history
- `agents` - Agent management
- `user_agents` - User-agent relationships
- `knowledge_items` - Knowledge base
- `knowledge_categories` - Knowledge organization

## Expected Output

The script will show:
- ✅ **Existing tables** - What you already have
- ❌ **Missing tables** - What needs to be created
- 📊 **Table structures** - Column details for key tables
- 📈 **Summary** - Overall database status

## Sample Output

```
🏢 2. Enterprise feature tables status:

  Training System:
    ✓ ai_training_data
    ✗ training_sessions
    ✗ training_metrics_history
    
  Template System:
    ✓ templates
    ✓ template_categories
    ✗ template_variables
    
  Channel System:
    ✓ communication_channels
    ✓ channels
    ✗ channel_configs
```

## What Happens Next

Once I see your actual schema, I'll:

1. **Create missing tables** - Only what you actually need
2. **Use existing structure** - Build on what you have
3. **Avoid conflicts** - No duplicate or conflicting tables
4. **Optimize features** - Focus on gaps in your current setup

## Troubleshooting

### "Missing Supabase credentials"
- Check your `.env` file exists
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Make sure there are no extra spaces in the values

### "Cannot find package"
- Run `npm install` to install dependencies
- Try `npm install dotenv` if still having issues

### "Permission denied"
- Make sure your Supabase anon key has read permissions
- Check your RLS policies aren't blocking the queries

## Alternative: Manual Check

If the script doesn't work, you can manually run this SQL in Supabase:

```sql
-- Quick table check
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Then share the results with me and I'll proceed with the implementation!