# Complete WhatsApp Webhook Setup Guide
## Step-by-Step Configuration & Testing

---

## 🎯 **PART 1: WEBHOOK CONFIGURATION**

### **Step 1: Available Webhook Fields**

**In Meta Developer Console → WhatsApp → Configuration → Webhooks:**

**ALWAYS SELECT (if available):**
```bash
✅ messages                # REQUIRED - Main message events
✅ message_deliveries      # Optional - Delivery status (if available)
✅ message_reads          # Optional - Read receipts (if available)  
✅ messaging_postbacks    # Optional - Button responses (if available)
```

**⚠️ IF SOME FIELDS ARE MISSING:**
- **Just select `messages`** - that's all you need!
- Missing fields are normal in development mode
- You'll get more fields when you switch to Live Mode

### **Step 2: Webhook URL Configuration**

**YOU NEED:**
1. **Callback URL**: Your public webhook endpoint
2. **Verify Token**: The secure token we generated

**OPTIONS:**

**Option A: Use ngrok (Recommended for testing)**
```bash
# Start your webhook server (already running)
npm run test:webhook

# In another terminal, start ngrok
ngrok http 3001

# Copy the ngrok URL (looks like: https://abc123.ngrok.io)
# Use in Facebook: https://abc123.ngrok.io/api/webhooks/whatsapp
```

**Option B: Use your domain (if available)**
```bash
# If you have a domain pointing to your server:
https://yourdomain.com/api/webhooks/whatsapp
```

---

## 🔧 **PART 2: WEBHOOK VERIFICATION PROCESS**

### **Step 1: Configure in Meta Developer Console**

```bash
1. Go to: Meta Developer Console → Your App → WhatsApp → Configuration
2. Click "Edit" next to Webhooks
3. Fill in:
   - Callback URL: https://your-ngrok-url.ngrok.io/api/webhooks/whatsapp
   - Verify Token: 42f57e77763ab553e12a915c3db29808
4. Click "Verify and Save"
```

### **Step 2: Facebook Sends Verification Request**

Facebook will immediately send a GET request like:
```bash
GET https://your-ngrok-url.ngrok.io/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=42f57e77763ab553e12a915c3db29808&hub.challenge=1234567890
```

### **Step 3: Your Server Responds**

Your webhook server (already running) will:
1. Check if `hub.verify_token` matches your token
2. Return the `hub.challenge` value
3. Facebook receives the challenge and marks webhook as verified

---

## 🧪 **PART 3: TESTING WEBHOOK VERIFICATION**

### **Test 1: Manual Verification Test**
```bash
# Test your webhook verification manually (replace with your ngrok URL)
curl "https://your-ngrok-url.ngrok.io/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=42f57e77763ab553e12a915c3db29808&hub.challenge=test123"

# Expected Response: test123
```

### **Test 2: Check Server Logs**
```bash
# Check your webhook server logs for verification success
# You should see: ✅ WhatsApp webhook verification successful!
```

### **Test 3: Facebook Webhook Status**
```bash
# In Meta Developer Console, you should see:
# ✅ Webhook Status: Active
# ✅ Callback URL: Verified
```

---

## 🚀 **PART 4: AFTER WEBHOOK VERIFICATION**

### **Step 1: Subscribe to Webhook Fields**

After verification succeeds:
```bash
1. In Meta Developer Console → WhatsApp → Configuration
2. Under "Webhook fields" section
3. Select available fields:
   ✅ messages (always select this)
   ✅ message_deliveries (if available)
   ✅ message_reads (if available)
   ✅ messaging_postbacks (if available)
4. Click "Save"
```

### **Step 2: Test Message Flow**

**Send a test message to your WhatsApp Business number:**
```bash
1. Send a WhatsApp message to your business phone number
2. Check webhook server logs
3. You should see incoming message data logged
```

### **Step 3: Test AI Response** (If configured)
```bash
1. Send: "Hello, what are your business hours?"
2. Your webhook server should:
   - Receive the message
   - Trigger AI response generation
   - Send automated reply back
```

---

## 🔍 **PART 5: COMPLETE TESTING CHECKLIST**

### **✅ Webhook Server Tests**
```bash
# 1. Server running
curl http://localhost:3001/health
# Expected: {"status": "OK", ...}

# 2. Webhook verification  
curl "https://your-ngrok-url.ngrok.io/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=42f57e77763ab553e12a915c3db29808&hub.challenge=test123"
# Expected: test123

# 3. Server logs show success
# Expected: ✅ WhatsApp webhook verification successful!
```

### **✅ Facebook Integration Tests**
```bash
# 1. Webhook status in Facebook
# Go to: Meta Developer Console → WhatsApp → Configuration
# Expected: ✅ Webhook Status: Active

# 2. Field subscriptions
# Expected: ✅ messages (and others if available)

# 3. Test webhook with real message
# Send WhatsApp message to your business number
# Check server logs for incoming webhook data
```

### **✅ End-to-End Flow Test**
```bash
# 1. Send message via WhatsApp
# 2. Server receives webhook
# 3. AI generates response (if configured)
# 4. Response sent back to user
# 5. User receives automated reply
```

---

## 🚨 **TROUBLESHOOTING**

### **Problem: "Some webhook fields not available"**
**Solution:** 
- This is normal in development mode
- Just select `messages` - that's sufficient
- More fields become available in Live Mode

### **Problem: "Webhook verification failed"**
**Solutions:**
1. Check verify token matches exactly: `42f57e77763ab553e12a915c3db29808`
2. Ensure ngrok is running and accessible
3. Check webhook server logs for errors
4. Verify callback URL format is correct

### **Problem: "Webhook verified but no messages received"**
**Solutions:**
1. Ensure `messages` field is subscribed
2. Send message to the correct business phone number
3. Check if you're in development mode (limited to test numbers)
4. Verify webhook server is still running

### **Problem: "ngrok URL changes"**
**Solution:**
- Free ngrok URLs change on restart
- Update Facebook webhook URL when ngrok restarts
- Consider ngrok paid plan for stable URLs

---

## 📋 **QUICK SETUP COMMANDS**

```bash
# 1. Start webhook server (if not running)
npm run test:webhook

# 2. Start ngrok (in new terminal)
ngrok http 3001

# 3. Copy ngrok URL and configure in Facebook

# 4. Test verification
curl "https://your-ngrok-url.ngrok.io/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=42f57e77763ab553e12a915c3db29808&hub.challenge=test123"

# 5. Check server health
curl http://localhost:3001/health
```

---

## 🎯 **SUCCESS INDICATORS**

### **You'll know it's working when:**
1. ✅ Facebook shows "Webhook Status: Active"
2. ✅ Verification test returns the challenge value
3. ✅ Server logs show successful verification
4. ✅ Real WhatsApp messages appear in server logs
5. ✅ (Optional) AI responses are sent back automatically

### **Next Steps After Success:**
1. Switch to Live Mode for production use
2. Get permanent access tokens
3. Configure production webhook URL (if not using ngrok)
4. Test with real customers
5. Monitor webhook logs for any issues

---

## 🚀 **YOU'RE READY!**

Once webhook verification succeeds, your WhatsApp integration is functional! The key is getting `messages` field working - everything else is optional enhancement.

**Missing fields like `message_deliveries` are NOT blockers - proceed with just `messages`!** 🎉