# WhatsApp Live Mode Setup Guide
## Complete Configuration for ROMASHKA AI Platform

---

## 🎯 **YOUR CURRENT STATUS**
✅ You have successfully run most tests  
✅ You have real credentials configured  
✅ You have Privacy Policy at https://romashkaai.vercel.app/privacy  
❌ Need to switch to Live Mode  
❌ Need to configure webhooks  

---

## 📋 **STEP 1: Update Your .env File**

**Replace the placeholder values in your .env file with your REAL credentials:**

```bash
# WhatsApp Business API Configuration (Required for validation script)
WHATSAPP_PHONE_NUMBER_ID=YOUR_REAL_PHONE_NUMBER_ID
WHATSAPP_ACCESS_TOKEN=YOUR_REAL_ACCESS_TOKEN
WHATSAPP_WEBHOOK_SECRET=YOUR_GENERATED_SECRET
WHATSAPP_VERIFY_TOKEN=YOUR_GENERATED_VERIFY_TOKEN
WHATSAPP_BUSINESS_ACCOUNT_ID=YOUR_REAL_BUSINESS_ACCOUNT_ID
```

**Generate secure tokens:**
```bash
# Generate secure webhook secret (run this in terminal)
openssl rand -hex 32

# Generate secure verify token (run this in terminal)
openssl rand -hex 16
```

---

## 🔧 **STEP 2: Fix Privacy Policy URL Issue**

### **Problem**: Facebook says "Invalid Privacy Policy URL"
### **Solution**: URL format and accessibility issues

**1. Check URL Accessibility:**
```bash
# Test your privacy policy URL
curl -I https://romashkaai.vercel.app/privacy
```

**2. Common Issues & Fixes:**

**Issue A: URL not accessible from Facebook servers**
- Facebook needs to crawl your URL
- Ensure your Vercel deployment is public
- Check if there are any redirect issues

**Issue B: Wrong URL format in Facebook settings**
- Go to Facebook App Settings → Basic
- Privacy Policy URL should be: `https://romashkaai.vercel.app/privacy`
- NOT `https://romashkaai.vercel.app/privacy/` (no trailing slash)

**Issue C: Content not recognized as privacy policy**
- Ensure your privacy policy contains keywords like "privacy", "data", "information"
- Make sure it's properly formatted HTML

**3. Alternative Solution:**
If the issue persists, use a different privacy policy URL:
- Create a simple HTML file with privacy policy
- Host it on GitHub Pages or similar
- Use the new URL in Facebook settings

---

## 🚀 **STEP 3: Switch to Live Mode**

### **Important**: WhatsApp Access Token Behavior

**Development Mode:**
- Access token is temporary (expires in 1 hour)
- Limited to test phone numbers
- Can only send messages to verified numbers

**Live Mode:**
- Access token is permanent (never expires)
- Can send messages to any WhatsApp number
- Full production capabilities

### **Steps to Switch to Live Mode:**

**1. Fix Privacy Policy Issue First**
```bash
# Go to Meta Developer Console
# App Dashboard → Settings → Basic
# Update Privacy Policy URL to: https://romashkaai.vercel.app/privacy
# Save changes
```

**2. Complete App Review Requirements**
```bash
# Required for Live Mode:
✅ Privacy Policy URL (fix the URL format)
✅ Terms of Service URL (if required)
✅ App Description (clear description of what your app does)
✅ Category (Business)
✅ Data Use Checkboxes (check appropriate boxes)
```

**3. Request Live Mode**
```bash
# In Meta Developer Console:
# Go to App Dashboard → App Review → Request Feature
# Or toggle "Live Mode" if available
```

**4. WhatsApp Business API Specific Steps**
```bash
# Go to WhatsApp → Configuration
# Ensure all settings are correct
# Generate new permanent access token in Live Mode
```

---

## 🌐 **STEP 4: Setup Webhooks with ngrok**

### **1. Install and Start ngrok**
```bash
# Install ngrok (if not already installed)
npm install -g ngrok

# Start your webhook server
npm run test:webhook

# In another terminal, start ngrok
ngrok http 3001
```

### **2. Configure Webhook in Meta Developer Console**

**Navigate to:** WhatsApp → Configuration → Webhooks

**Webhook Settings:**
```bash
Callback URL: https://your-ngrok-url.ngrok.io/api/webhooks/whatsapp
Verify Token: YOUR_GENERATED_VERIFY_TOKEN
```

**Subscribe to Webhook Fields:**
- ✅ messages
- ✅ message_deliveries  
- ✅ message_reads
- ✅ messaging_postbacks

### **3. Test Webhook Verification**
```bash
# Facebook will send a GET request to verify your webhook
# Your server should respond with the challenge parameter
# Check your webhook server logs for verification success
```

---

## 🧪 **STEP 5: Complete Testing Sequence**

### **1. Update .env with Real Values**
```bash
# Replace all placeholder values with real credentials
nano .env
```

### **2. Run Validation**
```bash
# This should now pass
npm run validate:env
```

### **3. Test Database Connection**
```bash
# Test database (update DATABASE_URL first)
npm run db:test
```

### **4. Test WhatsApp Setup**
```bash
# This should now work
npm run setup:whatsapp
```

### **5. Test Complete Flow**
```bash
# Start webhook server
npm run test:webhook &

# Start development server
npm run dev &

# Test webhook endpoint
curl "https://your-ngrok-url.ngrok.io/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=test123"
```

---

## 🔍 **STEP 6: Verify Live Mode Setup**

### **1. Check Access Token Type**
```bash
# Test if your access token is permanent
curl -X GET "https://graph.facebook.com/v17.0/me?access_token=YOUR_ACCESS_TOKEN"

# Live Mode tokens should not expire
```

### **2. Test Message Sending**
```bash
# Send test message to your phone number
curl -X POST "https://graph.facebook.com/v17.0/YOUR_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "YOUR_PHONE_NUMBER",
    "type": "text",
    "text": {
      "body": "Hello from ROMASHKA AI! 🚀"
    }
  }'
```

### **3. Monitor Webhook Logs**
```bash
# Check webhook server logs for incoming messages
tail -f webhook-logs/*.json
```

---

## 🚨 **TROUBLESHOOTING**

### **Privacy Policy URL Issues:**
```bash
# Test URL accessibility
curl -I https://romashkaai.vercel.app/privacy

# Common fixes:
1. Remove trailing slash from URL
2. Ensure HTTPS is working
3. Check for redirect issues
4. Verify content is actually a privacy policy
```

### **Live Mode Issues:**
```bash
# If Live Mode is not available:
1. Complete all required app information
2. Fix privacy policy URL
3. Wait for Facebook review (can take 24-48 hours)
4. Contact Facebook support if needed
```

### **Webhook Issues:**
```bash
# If webhook verification fails:
1. Check verify token matches exactly
2. Ensure ngrok is running and accessible
3. Check webhook server logs
4. Verify callback URL format
```

---

## 📊 **EXPECTED RESULTS**

### **After Completing This Guide:**
```bash
✅ npm run validate:env - All checks pass
✅ npm run db:test - Database connection working
✅ npm run setup:whatsapp - WhatsApp setup successful
✅ npm run test:webhook - Webhook server running
✅ WhatsApp Live Mode - Active with permanent token
✅ Privacy Policy URL - Accepted by Facebook
✅ Webhooks - Configured and receiving messages
```

### **Production Readiness Score:**
**Current**: 7.5/10  
**After Setup**: 9/10  
**Final Target**: 9/10 ✅

---

## 🎯 **QUICK ACTIONS FOR YOU**

### **Immediate Steps:**
1. **Fix .env file** - Replace placeholder values with real credentials
2. **Fix Privacy Policy URL** - Check format in Facebook settings
3. **Generate secure tokens** - Use openssl commands above
4. **Start ngrok** - Get public URL for webhook testing
5. **Configure webhooks** - Use ngrok URL in Meta Developer Console

### **Commands to Run:**
```bash
# 1. Update .env file (replace placeholder values)
# 2. Generate secure tokens
openssl rand -hex 32  # For webhook secret
openssl rand -hex 16  # For verify token

# 3. Start ngrok
ngrok http 3001

# 4. Test validation
npm run validate:env

# 5. Test WhatsApp setup
npm run setup:whatsapp
```

---

## 🏁 **FINAL NOTES**

**About Access Tokens:**
- Development tokens expire in 1 hour
- Live Mode tokens are permanent
- You'll get a new permanent token when switching to Live Mode

**About Privacy Policy:**
- Facebook is strict about privacy policy URLs
- The URL must be accessible and contain actual privacy policy content
- Try removing trailing slashes or using a different URL format

**Next Steps:**
Once you complete these steps, you'll have a fully functional WhatsApp integration ready for production! 🚀

---

**Need Help?** Check the troubleshooting section or contact Meta Developer Support if you encounter issues with Live Mode approval.