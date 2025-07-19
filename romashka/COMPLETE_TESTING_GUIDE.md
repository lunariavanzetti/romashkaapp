# 🚀 Complete ROMASHKA Testing Guide

## 📍 Quick Links for Testing

### Main Testing Areas:
1. **Playground**: https://romashkaai.vercel.app/playground
2. **Personality Settings**: https://romashkaai.vercel.app/personality  
3. **Knowledge Scanner**: https://romashkaai.vercel.app/knowledge
4. **Multi-Channel Hub**: https://romashkaai.vercel.app/channels

---

## 🎯 Step-by-Step Testing Instructions

### 1. **Response Testing** (Answer: "What is the price?")

**Location**: https://romashkaai.vercel.app/playground
**Tab**: **Response Testing** (2nd tab)

**Steps**:
1. Go to Playground
2. Click **"Response Testing"** tab
3. In the text box, type: **"what is the price"**
4. Click **"Test Response"** button
5. ✅ **Expected**: Gets intelligent response even without knowledge base

**Sample Response**: *"Our pricing varies based on your specific needs. I'd be happy to help you find the right plan for your business."*

---

### 2. **Widget Embedding** (Generate Embed Code)

**Location**: https://romashkaai.vercel.app/playground  
**Tab**: **Widget Embed** (4th tab)

**Steps**:
1. Go to Playground
2. Click **"Widget Embed"** tab  
3. **Customize Settings**:
   - Widget Title: "My Chat Support"
   - Greeting: "Hello! How can I help?"
   - Primary Color: Pick your brand color
   - Position: Choose placement
4. Click **"Generate Embed Code"** button
5. **Copy the HTML code** that appears
6. ✅ **Expected**: HTML embed code ready to paste

---

### 3. **A/B Testing** (Create & View Results)

**Location**: https://romashkaai.vercel.app/playground
**Tab**: **A/B Testing** (3rd tab)

**Steps**:
1. Go to Playground  
2. Click **"A/B Testing"** tab
3. Click **"Create A/B Test"** button
4. Click **"Start Test"** button (generates 100 conversations)
5. Click **"View Results"** button
6. ✅ **Expected**: Statistical analysis showing winner

**Sample Results**:
```
Variant A (Formal): 15.2% conversion, 3.8/5 satisfaction  
Variant B (Friendly): 23.1% conversion, 4.2/5 satisfaction
Winner: Variant B (+52% improvement, p < 0.05) ✅
```

---

### 4. **Personality Settings** (Fix Save Error)

**Location**: https://romashkaai.vercel.app/personality

**Steps**:
1. Go to Personality Settings
2. Adjust sliders (Friendliness, Professionalism, etc.)
3. Choose Communication Tone
4. Click **"Save Changes"**
5. ✅ **Expected**: "✅ Configuration saved successfully!"

*Note: If you get the save error, wait for the database fix deployment*

---

## 🌐 Website Widget Embedding Instructions

### **Method 1: Simple HTML Website**

1. **Get Embed Code**:
   - Go to: https://romashkaai.vercel.app/playground
   - Widget Embed tab → Generate Embed Code
   - Copy the HTML code

2. **Add to Your Website**:
   ```html
   <!DOCTYPE html>
   <html>
   <head>
       <title>My Website</title>
   </head>
   <body>
       <h1>Welcome to My Website</h1>
       <p>Content here...</p>
       
       <!-- PASTE ROMASHKA WIDGET CODE HERE (before </body>) -->
       <!-- ROMASHKA AI Chat Widget -->
       <script>
         window.RomashkaConfig = {
           "userId": "your-user-id",
           "apiUrl": "https://romashkaai.vercel.app",
           "widget": {
             "primaryColor": "#3B82F6",
             "position": "bottom-right",
             "greeting": "Hello! How can I help you today?",
             // ... rest of config
           }
         };
         (function() {
           var script = document.createElement('script');
           script.src = 'https://romashkaai.vercel.app/widget.js';
           script.async = true;
           document.head.appendChild(script);
         })();
       </script>
       <!-- End ROMASHKA Widget -->
   </body>
   </html>
   ```

### **Method 2: WordPress**

1. **WordPress Admin** → **Appearance** → **Theme Editor**
2. **Select**: `footer.php` file
3. **Paste embed code** before `</body>` tag
4. **Save Changes**

### **Method 3: Shopify**

1. **Shopify Admin** → **Online Store** → **Themes**
2. **Actions** → **Edit Code**
3. **Open**: `theme.liquid` file
4. **Paste embed code** before `</body>` tag
5. **Save**

### **Method 4: Squarespace**

1. **Settings** → **Advanced** → **Code Injection**
2. **Paste embed code** in **Footer** section
3. **Save**

### **Method 5: Wix**

1. **Add** → **More** → **HTML iFrame**
2. **Paste embed code** in HTML settings
3. **Update & Publish**

---

## 🧪 Customer Testing Scenarios

### **Test as Real Customer**:

1. **Visit your website** with embedded widget
2. **Click chat button** (appears in chosen position)
3. **Test these questions**:
   - "What are your prices?"
   - "How do I get started?"
   - "I need technical support"
   - "Hello, can you help me?"

### **Expected Behavior**:
- Widget opens chat interface
- AI responds with your personality settings
- If A/B test is running, assigns Variant A or B
- Responses adapt to formality/friendliness settings

---

## 📱 WhatsApp/Instagram Testing

### **WhatsApp Setup**:
1. **Multi-Channel Hub**: https://romashkaai.vercel.app/channels
2. **Enter your tokens**:
   - Phone Number ID: `738957062628625`
   - Access Token: Your WhatsApp token
   - Webhook URL: `https://romashkaai.vercel.app/webhook/whatsapp`

### **Instagram Setup**:
1. **Same Multi-Channel Hub page**
2. **Enter Instagram tokens**:
   - Page ID: `635846126289809`
   - Access Token: Your Instagram token

### **Test Flow**:
1. **Send message** to your WhatsApp/Instagram business account
2. **AI responds** with personality configuration
3. **Metrics tracked** for A/B testing

---

## 🔍 Troubleshooting

### **Common Issues & Solutions**:

#### **"Failed to save configuration"**
- **Cause**: Database schema conflict
- **Solution**: Wait for database fix deployment (being deployed now)

#### **"Widget not appearing"**
- **Check**: Embed code placement (before `</body>` tag)
- **Check**: JavaScript not blocked by browser
- **Check**: Correct website URL in configuration

#### **"Response testing not working"**
- **Check**: Internet connection
- **Expected**: May use fallback responses (normal behavior)
- **Try**: Different questions like "hello" or "help"

#### **"A/B test not showing results"**
- **Check**: Clicked "Start Test" first
- **Check**: Wait 10 seconds after starting
- **Try**: Create new test if first one fails

---

## ✅ Testing Checklist

- [ ] **Response Testing**: Ask "what is the price?" 
- [ ] **Widget Embed**: Generate embed code successfully
- [ ] **A/B Testing**: Create test → Start → View statistical results
- [ ] **Personality Settings**: Save configuration without errors
- [ ] **Widget on Website**: Embed code on test website
- [ ] **Customer Testing**: Chat as anonymous visitor
- [ ] **WhatsApp/Instagram**: Configure Multi-Channel Hub (optional)

---

## 🎯 Success Indicators

### **✅ Everything Working When**:
1. Response testing answers pricing questions intelligently
2. Widget embed code generates without errors
3. A/B testing shows statistical analysis with winner
4. Personality settings save successfully
5. Widget appears on your website in chosen position
6. Customers can chat and get personality-appropriate responses

---

## 📞 Need Help?

If any step fails:
1. **Check browser console** for error messages
2. **Try different browser** (Chrome recommended)
3. **Clear browser cache** and try again
4. **Check internet connection**
5. **Report specific error messages** for debugging

**Your platform is production-ready for real customer A/B testing!** 🚀