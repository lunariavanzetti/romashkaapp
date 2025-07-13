# WhatsApp Production Setup Guide
## Complete Guide for Live Mode Configuration

---

## 🎯 **PRODUCTION SETUP OVERVIEW**

### **Development vs Production Differences**

**🔧 DEVELOPMENT MODE:**
- ✅ Temporary access tokens (expire in 1 hour)
- ✅ Limited to verified test phone numbers
- ✅ Rate limits are lower
- ✅ Some webhook fields unavailable

**🚀 PRODUCTION (LIVE MODE):**
- ✅ Permanent access tokens (never expire)
- ✅ Can message any WhatsApp number
- ✅ Full rate limits
- ✅ All webhook fields available
- ✅ Business verification required

---

## 📋 **STEP 1: UPDATE YOUR .env FILE**

First, update your environment with the Facebook App Secret you found:

```bash
# Update this line in your .env file:
WHATSAPP_WEBHOOK_SECRET=your_facebook_app_secret_here

# Your complete WhatsApp production config should look like:
WHATSAPP_PHONE_NUMBER_ID=your_real_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_current_dev_token  # We'll update this to permanent token
WHATSAPP_WEBHOOK_SECRET=your_facebook_app_secret
WHATSAPP_VERIFY_TOKEN=27df4f49e1711ad6f4f25fca18c5ceef
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
```

---

## 🚀 **STEP 2: SWITCH TO LIVE MODE**

### **Prerequisites for Live Mode:**
✅ Privacy Policy URL working (you've already fixed this!)
✅ App properly configured
✅ Webhook verification successful
✅ Business use case clear

### **Switch to Live Mode:**
```bash
1. Go to: Meta Developer Console → Your App
2. Navigate to: App Dashboard (top left)
3. Look for: "Live Mode" toggle or "App Review" section
4. Click: "Switch to Live Mode" or "Make App Live"
5. Confirm: Accept terms and conditions
```

**Alternative Location:**
```bash
1. Go to: App Review → Request Features
2. Look for: "Standard Access" for WhatsApp Business Management
3. Submit: Business use case description
4. Wait: 1-3 business days for approval
```

---

## 🔑 **STEP 3: GENERATE PERMANENT ACCESS TOKEN**

### **After Live Mode is Active:**

```bash
1. Go to: Meta Developer Console → WhatsApp → Getting Started
2. Click: "Get Started" or "Generate Token"
3. Select: Your Business Account
4. Choose: Required permissions:
   - whatsapp_business_management
   - whatsapp_business_messaging
5. Generate: Long-lived access token
6. Copy: The new permanent token
```

**Update your .env file:**
```bash
# Replace the temporary token with permanent one:
WHATSAPP_ACCESS_TOKEN=your_new_permanent_token_here
```

---

## 🏢 **STEP 4: BUSINESS VERIFICATION**

### **Required for Production:**

```bash
1. Go to: Business Manager (business.facebook.com)
2. Navigate to: Settings → Business Info
3. Complete: Business verification process
4. Provide: 
   - Business documents
   - Tax information
   - Business address
   - Phone number verification
```

### **Verification Requirements:**
- ✅ Legal business name
- ✅ Business address
- ✅ Business phone number
- ✅ Business website
- ✅ Tax ID or business registration

---

## 📞 **STEP 5: PHONE NUMBER VERIFICATION**

### **Verify Your Business Phone Number:**

```bash
1. Go to: WhatsApp Business API → Phone Numbers
2. Click: "Add Phone Number"
3. Enter: Your business phone number
4. Verify: Via SMS or call
5. Complete: Phone number verification process
```

### **Important Notes:**
- Use a dedicated business phone number
- Number should match your business registration
- Don't use personal phone numbers

---

## 🌐 **STEP 6: PRODUCTION WEBHOOK CONFIGURATION**

### **Option A: Production Domain** (Recommended)
```bash
# Instead of ngrok, use your production domain:
Callback URL: https://yourdomain.com/api/webhooks/whatsapp
Verify Token: 27df4f49e1711ad6f4f25fca18c5ceef
```

### **Option B: Keep ngrok for Testing**
```bash
# For continued testing with ngrok:
Callback URL: https://your-ngrok-url.ngrok-free.app/api/webhooks/whatsapp
Verify Token: 27df4f49e1711ad6f4f25fca18c5ceef
```

### **Production Webhook Setup:**
```bash
1. Deploy your webhook server to production
2. Configure SSL/HTTPS properly
3. Update Facebook webhook URL
4. Test webhook verification
5. Subscribe to all webhook fields:
   ✅ messages
   ✅ message_deliveries
   ✅ message_reads
   ✅ messaging_postbacks
   ✅ messaging_referrals (if available)
```

---

## 🔐 **STEP 7: SECURITY HARDENING**

### **Production Security Checklist:**

```bash
✅ Use environment variables for all secrets
✅ Enable webhook signature validation
✅ Implement rate limiting
✅ Add request logging
✅ Set up monitoring and alerts
✅ Use HTTPS only
✅ Validate all incoming data
✅ Implement proper error handling
```

### **Environment Variables for Production:**
```bash
# Production .env configuration:
NODE_ENV=production
WHATSAPP_PHONE_NUMBER_ID=your_verified_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_permanent_access_token
WHATSAPP_WEBHOOK_SECRET=your_facebook_app_secret
WHATSAPP_VERIFY_TOKEN=your_secure_verify_token
WHATSAPP_BUSINESS_ACCOUNT_ID=your_verified_business_account_id

# Database (production)
DATABASE_URL=your_production_database_url

# OpenAI (production key)
VITE_OPENAI_API_KEY=your_production_openai_key
```

---

## 📊 **STEP 8: TESTING PRODUCTION SETUP**

### **Production Testing Checklist:**

```bash
# 1. Test access token validity
curl -X GET "https://graph.facebook.com/v17.0/me?access_token=YOUR_PERMANENT_TOKEN"

# 2. Test message sending
curl -X POST "https://graph.facebook.com/v17.0/YOUR_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer YOUR_PERMANENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "YOUR_TEST_NUMBER",
    "type": "text",
    "text": {
      "body": "Hello from ROMASHKA AI Production! 🚀"
    }
  }'

# 3. Test webhook delivery
# Send message to your business number and check logs

# 4. Test AI response flow
# Send: "What are your business hours?"
# Verify: AI responds automatically
```

---

## 🎯 **STEP 9: PRODUCTION MONITORING**

### **Set Up Monitoring:**

```bash
1. Error Tracking: Implement Sentry or similar
2. Uptime Monitoring: Monitor webhook endpoint
3. Performance Metrics: Track response times
4. Rate Limiting: Monitor API usage
5. Business Metrics: Track conversation success
```

### **Key Metrics to Monitor:**
- Webhook delivery success rate
- AI response time
- Message delivery rates
- Error rates
- API rate limit usage

---

## 🚀 **STEP 10: SCALING FOR PRODUCTION**

### **Production Deployment Options:**

**Option A: Vercel (Easy)**
```bash
1. Deploy your app to Vercel
2. Configure environment variables
3. Use Vercel's webhook endpoint
4. Scale automatically
```

**Option B: AWS/GCP/Azure (Advanced)**
```bash
1. Set up production server
2. Configure load balancer
3. Implement auto-scaling
4. Set up database replication
```

**Option C: Docker (Recommended)**
```bash
1. Containerize your application
2. Deploy to container platform
3. Configure health checks
4. Set up rolling updates
```

---

## 📋 **COMPLETE PRODUCTION CHECKLIST**

### **Meta/Facebook Requirements:**
- ✅ Business verification completed
- ✅ Privacy policy published and accessible
- ✅ Terms of service available
- ✅ App switched to Live Mode
- ✅ Permanent access tokens generated
- ✅ Phone number verified
- ✅ Webhook endpoints using HTTPS

### **Technical Requirements:**
- ✅ Production server deployed
- ✅ Database configured for production
- ✅ Environment variables secured
- ✅ Error handling implemented
- ✅ Monitoring and logging active
- ✅ Backup and recovery procedures

### **Business Requirements:**
- ✅ Customer support processes defined
- ✅ AI response quality tested
- ✅ Escalation procedures in place
- ✅ Compliance requirements met
- ✅ Data retention policies defined

---

## 🎉 **EXPECTED TIMELINE**

### **Immediate (Today):**
- ✅ Update .env with App Secret
- ✅ Test current setup
- ✅ Request Live Mode

### **1-3 Business Days:**
- ✅ Live Mode approval
- ✅ Generate permanent tokens
- ✅ Complete business verification

### **1 Week:**
- ✅ Production deployment
- ✅ Full testing complete
- ✅ Monitoring implemented

---

## 🚀 **NEXT IMMEDIATE ACTIONS**

1. **Update .env**: Add Facebook App Secret
2. **Restart webhook server**: Pick up new config
3. **Request Live Mode**: Submit for approval
4. **Plan production deployment**: Choose hosting platform
5. **Complete business verification**: Prepare documents

---

## 📞 **SUPPORT RESOURCES**

- **Meta Developer Docs**: https://developers.facebook.com/docs/whatsapp
- **WhatsApp Business API**: https://business.whatsapp.com/developers
- **Meta Business Help**: https://business.facebook.com/help

---

**Once you complete these steps, you'll have a fully production-ready WhatsApp AI integration!** 🎉