# Supabase Setup Guide

## 1. Set up your Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and anon key

## 2. Configure environment variables

Create a `.env` file in the `romashka` directory with:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 3. Run the database schema

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `setup-supabase.sql`
4. Click "Run" to execute the schema

## 4. Test the setup

After running the schema, the conversations page should work properly with:
- Sample conversation data
- Working chat interface
- Real-time updates
- Proper styling

## 5. Troubleshooting

If you still see 404 errors:
1. Check that your environment variables are correct
2. Verify the schema was executed successfully
3. Check the Supabase logs for any errors
4. Make sure Row Level Security policies are working correctly

## Schema Overview

The setup creates:
- `profiles` - User profiles with onboarding data
- `conversations` - Chat conversations with AI enhancements
- `messages` - Individual messages in conversations
- `workflows` - Automation workflows
- `knowledge_base` - AI knowledge base
- `intent_patterns` - AI intent recognition patterns
- `conversation_context` - AI conversation context

All tables have proper Row Level Security policies and real-time subscriptions enabled. 