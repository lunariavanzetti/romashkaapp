# End-to-End Testing Guide for ROMASHKA AI Platform
## Agent 10: Final Integration Testing & Production Deployment

**Prerequisites**: Real API credentials must be configured in .env file

---

## 🎯 **TESTING SEQUENCE**

### **Phase 1: Environment Validation** (2 minutes)
```bash
# 1. Validate all environment variables
npm run validate:env

# Expected Output:
# ✅ WHATSAPP_ACCESS_TOKEN - OK
# ✅ WHATSAPP_VERIFY_TOKEN - OK
# ✅ INSTAGRAM_ACCESS_TOKEN - OK
# ✅ VITE_OPENAI_API_KEY - OK
# ✅ DATABASE_URL - OK
```

### **Phase 2: Database Connection Test** (3 minutes)
```bash
# 2. Test database connection and schema
npm run db:test

# Expected Output:
# ✅ Successfully connected to database!
# ✅ 11/11 tables verified
# ✅ Schema validation passed
```

### **Phase 3: AI Service Test** (5 minutes)
```bash
# 3. Test OpenAI API integration
node -e "
import { OpenAIService } from './src/services/openaiService.js';
const service = new OpenAIService();
const context = {
  conversationId: 'test-123',
  messages: [],
  customerProfile: { name: 'Test User', email: 'test@example.com' },
  knowledgeBase: [],
  language: 'en',
  sentiment: 'neutral',
  intent: 'general_inquiry',
  confidence: 0.8,
  businessContext: { companyName: 'ROMASHKA' }
};
const response = await service.generateResponse('Hello, what are your business hours?', context);
console.log('AI Response:', response);
"

# Expected Output:
# AI Response: { 
#   message: 'Hello! Our business hours are...', 
#   confidence: 0.85, 
#   processingTime: 1500,
#   tokensUsed: 45
# }
```

### **Phase 4: Multi-Channel Testing** (10 minutes)
```bash
# 4. Start webhook test server
npm run test:webhook &

# 5. Test webhook health
curl http://localhost:3001/health

# Expected Output:
# {
#   "status": "OK",
#   "environment": {
#     "whatsapp": { "hasAccessToken": true, "hasVerifyToken": true },
#     "instagram": { "hasAccessToken": true, "hasVerifyToken": true }
#   }
# }

# 6. Test WhatsApp webhook verification
curl "http://localhost:3001/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=test123"

# Expected Output: test123
```

### **Phase 5: Frontend Integration Test** (5 minutes)
```bash
# 7. Start development server
npm run dev

# 8. Test frontend accessibility
curl -I http://localhost:5173

# Expected Output:
# HTTP/1.1 200 OK
# Content-Type: text/html
```

### **Phase 6: End-to-End Conversation Test** (10 minutes)
```bash
# 9. Test complete conversation flow
curl -X POST http://localhost:3001/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: sha256=SIGNATURE" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "BUSINESS_ACCOUNT_ID",
      "changes": [{
        "field": "messages",
        "value": {
          "messages": [{
            "from": "1234567890",
            "id": "wamid.test123",
            "timestamp": "1640995200",
            "text": {
              "body": "Hello, I need help with my account"
            },
            "type": "text"
          }],
          "contacts": [{
            "wa_id": "1234567890",
            "profile": {
              "name": "Test Customer"
            }
          }]
        }
      }]
    }]
  }'

# Expected: AI response should be generated and logged
```

---

## 🔍 **PERFORMANCE BENCHMARKS**

### **Target Performance Metrics**
- **AI Response Time**: < 3 seconds
- **Database Query Time**: < 100ms
- **Webhook Response Time**: < 500ms
- **Page Load Time**: < 2 seconds
- **Error Rate**: < 1%

### **Performance Testing Commands**
```bash
# Test AI response time
time node -e "
import { OpenAIService } from './src/services/openaiService.js';
const service = new OpenAIService();
const start = Date.now();
await service.generateResponse('Test message', mockContext);
console.log('Response time:', Date.now() - start, 'ms');
"

# Test database query time
time node -e "
import { supabase } from './src/services/supabaseClient.js';
const start = Date.now();
await supabase.from('conversations').select('*').limit(10);
console.log('Query time:', Date.now() - start, 'ms');
"

# Test webhook response time
time curl -X POST http://localhost:3001/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"object":"whatsapp_business_account","entry":[]}'
```

---

## 🚨 **CRITICAL TESTS**

### **1. Security Tests**
```bash
# Test webhook signature validation
curl -X POST http://localhost:3001/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: sha256=INVALID_SIGNATURE" \
  -d '{"test": "data"}'

# Expected: 403 Forbidden
```

### **2. Error Handling Tests**
```bash
# Test invalid OpenAI API key
VITE_OPENAI_API_KEY=invalid_key npm run dev

# Expected: Graceful error handling, fallback responses
```

### **3. Rate Limiting Tests**
```bash
# Test multiple rapid requests
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/webhooks/whatsapp \
    -H "Content-Type: application/json" \
    -d '{"object":"whatsapp_business_account","entry":[]}' &
done

# Expected: All requests handled without crashes
```

---

## 📊 **PRODUCTION READINESS CHECKLIST**

### **✅ Before Going Live**
- [ ] All environment variables configured with real values
- [ ] Database connection stable and all 11 tables operational
- [ ] OpenAI API responding within 3 seconds
- [ ] WhatsApp webhook verification working
- [ ] Instagram webhook verification working
- [ ] Frontend loads without errors
- [ ] AI responses are contextually appropriate
- [ ] Error handling working for all failure scenarios
- [ ] Security measures (signature validation) working
- [ ] Performance benchmarks met

### **🔧 Optional Enhancements**
- [ ] Redis caching for improved performance
- [ ] Monitoring and alerting system
- [ ] Rate limiting implementation
- [ ] API key rotation system
- [ ] Backup and recovery procedures
- [ ] Load testing for high traffic
- [ ] CDN setup for static assets

---

## 🎯 **PRODUCTION DEPLOYMENT STEPS**

### **1. Pre-Deployment**
```bash
# Build for production
npm run build

# Test production build
npm run preview

# Run final tests
npm run validate:env
npm run db:test
```

### **2. Deployment**
```bash
# Deploy to production environment
# (Commands depend on your hosting platform)

# Verify deployment
curl -I https://your-domain.com
curl https://your-domain.com/api/health
```

### **3. Post-Deployment**
```bash
# Monitor logs
tail -f /var/log/romashka/access.log

# Test production webhooks
curl "https://your-domain.com/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"
```

---

## 🏁 **SUCCESS CRITERIA**

### **9/10 Production Readiness Score**
- ✅ All integrations working with real credentials
- ✅ End-to-end conversation flow functional
- ✅ Performance benchmarks met
- ✅ Security measures validated
- ✅ Error handling robust

### **10/10 Production Readiness Score**
- ✅ Advanced monitoring implemented
- ✅ Rate limiting active
- ✅ Comprehensive logging
- ✅ Backup procedures tested
- ✅ Load testing completed

---

## 📞 **SUPPORT COMMANDS**

### **Troubleshooting**
```bash
# Check server logs
npm run logs

# Debug environment
npm run debug:env

# Test specific service
npm run test:ai
npm run test:whatsapp
npm run test:database
```

### **Quick Fixes**
```bash
# Restart services
npm run restart:all

# Reset database connection
npm run db:reset

# Clear cache
npm run cache:clear
```

---

**Agent 10**: Use this guide to complete the final 1.5 points needed to achieve 9/10 production readiness! 🚀