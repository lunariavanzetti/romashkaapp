# ROMASHKA Platform - Complete Testing Guidelines

## 🧪 Comprehensive Feature Testing Guide

This document provides step-by-step instructions to test every feature implemented in the ROMASHKA AI-powered customer service platform.

---

## 📋 Pre-Testing Setup

### Database Setup
1. **Run SQL Queries** (REQUIRED):
   ```bash
   # Navigate to the project directory
   cd romashka
   
   # Run the chat widget schema (contains all necessary tables)
   # Execute this in your Supabase SQL editor or psql:
   ```
   Copy and execute the contents of `sql/chat_widget_schema.sql`

2. **Environment Variables** - Ensure these are set:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_OPENAI_API_KEY`

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

---

## 🎯 Feature Testing Checklist

### 1. Authentication & User Management
- [ ] **Sign Up**: Create new account with email/password
- [ ] **Email Verification**: Check email and verify account
- [ ] **Sign In**: Login with existing credentials
- [ ] **Password Reset**: Test forgot password flow
- [ ] **Profile Settings**: Update user profile information

### 2. Dashboard Navigation
- [ ] **Sidebar Navigation**: Click all menu items
- [ ] **Header Functionality**: Test user dropdown, notifications
- [ ] **Dashboard Layout**: Verify consistent layout across pages
- [ ] **Responsive Design**: Test on mobile/tablet sizes

### 3. AI Playground Testing
**Location**: `/playground`

#### Basic Functionality:
- [ ] **Configuration Panel**: Open and test all tabs
- [ ] **Model Selection**: Verify GPT-4o-mini is selected
- [ ] **Temperature Slider**: Adjust and test values (0-1)
- [ ] **Max Tokens**: Set different values (1-4000)
- [ ] **System Message**: Add custom instructions

#### Save/Load Features:
- [ ] **Save Configuration**: 
  1. Modify settings
  2. Click "Save Configuration"
  3. Verify success message appears
- [ ] **Export Configuration**:
  1. Click "Export"
  2. Verify JSON file downloads
- [ ] **Import Configuration**:
  1. Click "Import"
  2. Select previously exported file
  3. Verify settings are restored

#### Test Scenarios:
- [ ] **Run Test Scenarios**: Click "Run Test Scenarios"
- [ ] **Custom Test**: Create and run your own test
- [ ] **A/B Testing**:
  1. Navigate to A/B Testing tab
  2. Click "Create A/B Test"
  3. Configure test parameters
  4. Start test and verify functionality

### 4. Templates Management
**Location**: `/templates`

#### CRUD Operations:
- [ ] **Create Template**:
  1. Click "Create Template"
  2. Fill in all fields:
     - Template Name (required)
     - Description
     - Category selection
     - Template Content with variables (use {variable_name})
  3. Add tags
  4. Click "Create Template"
  5. Verify success message

- [ ] **View Template**:
  1. Click "View" on any template
  2. Verify all details display correctly
  3. Check variable detection

- [ ] **Edit Template**:
  1. Click "Edit" on any template
  2. Modify content
  3. Click "Update Template"
  4. Verify changes saved

- [ ] **Duplicate Template**:
  1. Click "Copy" on any template
  2. Verify copy is created with "(Copy)" suffix

- [ ] **Delete Template**:
  1. Click "Trash" icon
  2. Confirm deletion
  3. Verify template is removed

#### AI Features:
- [ ] **Optimize Template**: Click "Optimize" and verify effectiveness score improves
- [ ] **Search Templates**: Use search bar to filter templates
- [ ] **Filter by Category**: Test category dropdown filtering

### 5. Personality Configuration
**Location**: `/personality`

#### Personality Traits:
- [ ] **Trait Sliders**: Adjust all 5 personality traits:
  - Friendliness (0-100%)
  - Professionalism (0-100%)
  - Empathy (0-100%)
  - Enthusiasm (0-100%)
  - Helpfulness (0-100%)

#### Communication Settings:
- [ ] **Tone Selection**: Test all tone options:
  - Formal
  - Casual
  - Friendly
  - Professional
  - Warm

- [ ] **Response Style**: Test all style options:
  - Concise
  - Detailed
  - Conversational
  - Direct

- [ ] **Response Length**: Test radio button selection:
  - Short (1-2 sentences)
  - Medium (2-4 sentences)
  - Long (4+ sentences)

#### Custom Content:
- [ ] **Greeting Message**: Modify and save custom greeting
- [ ] **Fallback Message**: Modify and save fallback response
- [ ] **Personality Description**: Update core personality text
- [ ] **Custom Instructions**: Add specific AI instructions
- [ ] **Language Selection**: Test different language options

#### Testing & Saving:
- [ ] **Test Configuration**:
  1. Click "Test Configuration"
  2. Wait for loading to complete
  3. Verify test preview appears in sidebar
- [ ] **Save Changes**:
  1. Make any modifications
  2. Click "Save Changes"
  3. Verify success message

### 6. Knowledge Base & URL Scanner
**Location**: `/knowledge` and `/knowledge/scanner`

#### URL Scanner:
- [ ] **Single URL Scan**:
  1. Enter a valid URL (e.g., https://example.com)
  2. Set scan depth (1-3)
  3. Click "Start Scanning"
  4. Verify progress indicators
  5. Check scan results

- [ ] **Multiple URL Scan**:
  1. Enter multiple URLs (one per line)
  2. Start scanning
  3. Verify batch processing

- [ ] **URL Validation**:
  1. Try invalid URLs
  2. Verify error messages
  3. Test URL normalization (URLs without https://)

#### Knowledge Management:
- [ ] **View Extracted Content**: Check scanned content display
- [ ] **Export Knowledge**: Test export functionality
- [ ] **Search Knowledge**: Use search filters

### 7. Analytics Dashboard
**Location**: `/analytics`

#### Navigation Testing:
- [ ] **Main Dashboard**: Verify overview displays
- [ ] **Real-time Analytics**: Click and test `/analytics/real-time`
- [ ] **Reports**: Navigate to `/analytics/reporting`
- [ ] **Predictive Analytics**: Test `/analytics/predictive`

#### Dashboard Features:
- [ ] **Tab Navigation**: Test all tab switches
- [ ] **Time Range Selection**: Change time periods
- [ ] **Refresh Data**: Click refresh button
- [ ] **Export Reports**: Test export functionality

#### Advanced Analytics:
- [ ] **Sentiment Tracking**: View sentiment metrics
- [ ] **Customer Journey**: Analyze journey map
- [ ] **Predictive Insights**: Review AI recommendations

### 8. Settings & Configuration
**Location**: `/settings`

#### Profile Settings:
- [ ] **Profile Information**: Update user details
- [ ] **Branding Settings**: 
  1. Navigate to branding section
  2. Upload logo (test profile logo upload fix)
  3. Customize colors
  4. Save settings

#### System Settings:
- [ ] **Notifications**: Configure notification preferences
- [ ] **Security**: Review security settings
- [ ] **Integrations**: Test integration connections

### 9. Chat Widget Testing
**Location**: Available on all pages (bottom-right corner)

#### Basic Functionality:
- [ ] **Widget Toggle**: Click chat button to open/close
- [ ] **Welcome Message**: Verify initial greeting displays
- [ ] **User Guidance**: Check tips and suggestions shown

#### Conversation Testing:
- [ ] **Send Message**:
  1. Type a test message
  2. Press Enter or click Send
  3. Verify typing indicator appears
  4. Check AI response

- [ ] **Multiple Messages**: Send several messages to test conversation flow
- [ ] **Error Handling**: Test with network issues
- [ ] **File Attachments**:
  1. Click attachment button
  2. Select files
  3. Verify file display
  4. Send message with attachments

#### UI Features:
- [ ] **Minimize/Maximize**: Test window controls
- [ ] **Emoji Picker**: Add emojis to messages
- [ ] **Message History**: Verify conversation persistence
- [ ] **Real-time Updates**: Test message synchronization

### 10. Security Dashboard
**Location**: `/security`

- [ ] **Access Security Dashboard**: Verify no 404 errors
- [ ] **Security Metrics**: Check dashboard displays
- [ ] **Navigation**: Test all security-related features

### 11. Channels Configuration
**Location**: `/channels`

#### Channel Setup:
- [ ] **WhatsApp Setup**: Navigate to `/channels/whatsapp`
- [ ] **Instagram Setup**: Test Instagram channel
- [ ] **Email Setup**: Configure email channel
- [ ] **Widget Setup**: Test widget channel settings

#### Testing Features:
- [ ] **Test Buttons**: Click test buttons for each channel
- [ ] **Webhook Configuration**: Set up and test webhooks
- [ ] **Connection Status**: Verify channel connection indicators

### 12. Training & AI Features
**Location**: `/training` and `/ai-training`

- [ ] **Training Dashboard**: Access training analytics
- [ ] **AI Training**: Test AI training features
- [ ] **Performance Metrics**: Review training effectiveness

---

## 🐛 Bug Testing Scenarios

### Error Handling:
1. **Network Errors**: Disconnect internet and test features
2. **Invalid Data**: Enter malformed data in forms
3. **Empty States**: Test pages with no data
4. **Permission Errors**: Test unauthorized access

### Edge Cases:
1. **Large Files**: Upload large attachments in chat
2. **Long Messages**: Send very long chat messages
3. **Special Characters**: Use special characters in forms
4. **Multiple Browser Tabs**: Test concurrent usage

### Performance Testing:
1. **Page Load Times**: Measure initial load performance
2. **Chat Response Time**: Test AI response speed
3. **File Upload Speed**: Test attachment upload performance
4. **Database Queries**: Monitor query performance

---

## ✅ Testing Checklist Summary

### Critical Features (Must Work):
- [ ] User authentication flow
- [ ] Chat widget conversation
- [ ] Template creation and management
- [ ] Personality configuration
- [ ] URL scanning functionality
- [ ] Analytics navigation
- [ ] Profile logo upload

### Enhanced Features (Should Work):
- [ ] A/B testing interface
- [ ] Export/import functionality
- [ ] Real-time chat updates
- [ ] File attachments
- [ ] Advanced analytics
- [ ] Multi-channel setup

### Polish Features (Nice to Have):
- [ ] Emoji picker
- [ ] Responsive design
- [ ] Loading animations
- [ ] Error recovery
- [ ] Data export

---

## 🚨 Known Issues & Workarounds

1. **Database Schema**: Ensure all SQL queries are executed before testing
2. **OpenAI API**: Requires valid API key for AI features
3. **File Uploads**: May require Supabase storage configuration
4. **Real-time**: Requires Supabase real-time enabled

---

## 📞 Support & Troubleshooting

### Common Issues:
1. **Database Errors**: Run the SQL schema files
2. **Authentication Issues**: Check Supabase configuration
3. **API Errors**: Verify environment variables
4. **UI Issues**: Clear browser cache and cookies

### Testing Tips:
1. Test in incognito mode to avoid cache issues
2. Use browser developer tools to monitor network requests
3. Check browser console for JavaScript errors
4. Test on different browsers and devices

---

## 🎉 Testing Complete!

After completing all tests, you should have verified:
- ✅ All 9 original issues are resolved
- ✅ Enhanced functionality works correctly
- ✅ User experience is improved
- ✅ Error handling is robust
- ✅ Performance is acceptable

**Report any issues found during testing with:**
- Steps to reproduce
- Expected vs actual behavior
- Browser and device information
- Console error messages (if any)