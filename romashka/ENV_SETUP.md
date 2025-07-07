# Environment Variables Setup Guide

## Required Environment Variables

You need to create a `.env` file in the `romashka` directory with the following variables:

### Essential Variables (Required for basic functionality)

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OpenAI Configuration (for AI features)
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

### Multi-Channel Communication Variables

#### WhatsApp Business API
```env
VITE_WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id_here
VITE_WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token_here
VITE_WHATSAPP_WEBHOOK_SECRET=your_whatsapp_webhook_secret_here
```

#### Facebook Messenger
```env
VITE_FACEBOOK_PAGE_ACCESS_TOKEN=your_facebook_page_access_token_here
VITE_FACEBOOK_APP_SECRET=your_facebook_app_secret_here
VITE_FACEBOOK_VERIFY_TOKEN=your_facebook_verify_token_here
```

#### Twilio (for SMS)
```env
VITE_TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
VITE_TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
VITE_TWILIO_PHONE_NUMBER=your_twilio_phone_number_here
```

#### Email Configuration
```env
VITE_SMTP_HOST=your_smtp_host_here
VITE_SMTP_PORT=587
VITE_SMTP_USER=your_smtp_username_here
VITE_SMTP_PASS=your_smtp_password_here
VITE_SUPPORT_EMAIL=your_support_email_here
```

### Optional Variables

```env
# Paddle Configuration (for billing)
VITE_PADDLE_SELLER_ID=your_paddle_seller_id_here
VITE_PADDLE_ENV=sandbox

# Sentry (for error monitoring)
SENTRY_DSN=your_sentry_dsn_here

# Development
NODE_ENV=development
```

## How to Get These Values

### 1. Supabase Credentials
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the "Project URL" and "anon public" key

### 2. OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key (starts with `sk-`)

### 3. WhatsApp Business API
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a WhatsApp Business app
3. Get your Phone Number ID and Access Token
4. Set up webhook verification

### 4. Facebook Messenger
1. Create a Facebook app in Meta for Developers
2. Add Messenger product
3. Get Page Access Token and App Secret
4. Set up webhook verification

### 5. Twilio (for SMS)
1. Sign up at [Twilio](https://www.twilio.com/)
2. Get your Account SID and Auth Token
3. Purchase a phone number

### 6. Email Configuration
1. Use your email provider's SMTP settings
2. Common providers:
   - Gmail: smtp.gmail.com:587
   - Outlook: smtp-mail.outlook.com:587
   - Custom SMTP server

## Quick Start

For immediate testing, you only need:

```env
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

This will enable:
- ✅ Basic chat functionality
- ✅ AI responses
- ✅ Database operations
- ✅ Website chat widget

The multi-channel features will show as "pending setup" until you add the specific channel credentials.

## Verification

After creating your `.env` file:

1. Restart your development server
2. Check the browser console for any configuration errors
3. The app should connect to Supabase successfully
4. You should see "Supabase configured: true" in the console

## Troubleshooting

### "Supabase not configured" error
- Check that your `.env` file is in the `romashka` directory
- Verify the variable names start with `VITE_`
- Restart the development server after adding the file

### 404 errors
- Verify your Supabase URL and key are correct
- Check that the database schema was applied successfully
- Ensure RLS policies are working correctly

### Channel setup issues
- Each channel requires specific API credentials
- Webhook URLs need to be publicly accessible
- Some channels require business verification 