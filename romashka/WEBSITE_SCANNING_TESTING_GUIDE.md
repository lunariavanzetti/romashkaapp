# Website Scanning System - Integration Testing Guide

## 🧪 Testing Overview

This guide provides step-by-step instructions for testing the website URL scanning and knowledge extraction system with real websites.

## 📋 Prerequisites

1. **Database Setup Complete**: Ensure you've run the `website-scanning-schema.sql` in Supabase
2. **Frontend Running**: Start your React development server
3. **Authentication**: Make sure you're logged into the application

## 🎯 Test Scenarios

### Test Scenario 1: Basic E-commerce Website Scan

**Target Website**: A simple e-commerce site with pricing and FAQ pages

#### Step 1: Prepare Test URLs
```
https://example.com/pricing
https://example.com/faq
https://example.com/about
```

#### Step 2: Configure Scan Settings
- **Max Depth**: 2
- **Max Pages**: 10
- **Respect Robots.txt**: ✅ Enabled
- **Content Types**: All selected

#### Step 3: Execute Scan
1. Navigate to the URL Scanner interface
2. Enter the test URLs
3. Configure scan settings
4. Click "Start Scan"
5. Monitor progress in real-time

#### Step 4: Expected Results
- **Content Types Detected**: pricing, faq, about
- **Quality Scores**: 0.7-0.95
- **Knowledge Items Generated**: 3-5 items
- **Processing Time**: < 2 minutes

### Test Scenario 2: SaaS Company Website

**Target Website**: A SaaS company with detailed pricing and support pages

#### Test URLs
```
https://saas-example.com/pricing
https://saas-example.com/help
https://saas-example.com/contact
https://saas-example.com/about
```

#### Expected Content Types
- **pricing**: Detailed pricing plans with features
- **faq**: Help articles and support content
- **contact**: Contact information and support details
- **about**: Company information and team details

### Test Scenario 3: Blog/Content Website

**Target Website**: A blog or content-heavy website

#### Test URLs
```
https://blog-example.com/articles
https://blog-example.com/about
https://blog-example.com/contact
```

#### Expected Results
- **Content Types**: about, contact, general
- **Quality Scores**: 0.6-0.9 (depending on content structure)
- **Knowledge Items**: General information and contact details

## 🔍 Testing Checklist

### ✅ URL Validation Testing
- [ ] Valid URLs are accepted
- [ ] Invalid URLs show error messages
- [ ] URLs are normalized correctly
- [ ] Redirects are handled properly

### ✅ Scan Configuration Testing
- [ ] Max depth setting works correctly
- [ ] Max pages limit is respected
- [ ] Content type filters work
- [ ] Robots.txt compliance works

### ✅ Progress Tracking Testing
- [ ] Progress percentage updates in real-time
- [ ] Status changes correctly (pending → scanning → completed)
- [ ] Error handling works for failed scans
- [ ] Pause/resume functionality works

### ✅ Content Extraction Testing
- [ ] HTML content is extracted properly
- [ ] Metadata is captured (title, description, etc.)
- [ ] Headings are extracted and structured
- [ ] Links are discovered and tracked

### ✅ Content Classification Testing
- [ ] Pricing pages are correctly identified
- [ ] FAQ pages are properly categorized
- [ ] About pages are detected
- [ ] Contact pages are recognized
- [ ] General content is handled appropriately

### ✅ Quality Assessment Testing
- [ ] Quality scores are calculated (0.0-1.0)
- [ ] Word count is accurate
- [ ] Processing quality reflects content structure
- [ ] Low-quality content is flagged

### ✅ Knowledge Generation Testing
- [ ] Knowledge items are created from extracted content
- [ ] Categories are assigned correctly
- [ ] Confidence scores are reasonable
- [ ] Review workflow works properly

## 🐛 Common Issues and Solutions

### Issue 1: CORS Errors
**Symptoms**: Network errors when scanning external websites
**Solution**: The scanner runs server-side, so CORS shouldn't be an issue. If you see CORS errors, check your browser's network tab for actual API calls.

### Issue 2: Rate Limiting
**Symptoms**: Scans fail or timeout
**Solution**: 
- Reduce scan frequency
- Increase timeout settings
- Check if target website has rate limiting

### Issue 3: JavaScript-Heavy Sites
**Symptoms**: Empty or incomplete content extraction
**Solution**: 
- Current implementation handles basic HTML
- For JavaScript-heavy sites, consider implementing headless browser support
- Test with simpler, static websites first

### Issue 4: Large Content Pages
**Symptoms**: Timeouts or incomplete scans
**Solution**:
- Reduce max pages setting
- Increase timeout values
- Process in smaller batches

## 📊 Performance Testing

### Load Testing
1. **Small Scale**: 1-5 URLs, 10-20 pages
2. **Medium Scale**: 5-10 URLs, 20-50 pages
3. **Large Scale**: 10+ URLs, 50+ pages

### Performance Metrics
- **Scan Speed**: Pages per minute
- **Success Rate**: Percentage of successful extractions
- **Quality Distribution**: Distribution of quality scores
- **Memory Usage**: Monitor during large scans
- **CPU Usage**: Check for bottlenecks

## 🔧 Debugging Tools

### Database Queries for Testing

#### Check Scan Jobs
```sql
SELECT * FROM website_scan_jobs 
WHERE user_id = 'your-user-id' 
ORDER BY created_at DESC;
```

#### Check Extracted Content
```sql
SELECT ec.*, wsj.status 
FROM extracted_content ec
JOIN website_scan_jobs wsj ON ec.scan_job_id = wsj.id
WHERE wsj.user_id = 'your-user-id'
ORDER BY ec.created_at DESC;
```

#### Check Auto-Generated Knowledge
```sql
SELECT agk.*, ec.url, ec.content_type
FROM auto_generated_knowledge agk
JOIN extracted_content ec ON agk.extracted_content_id = ec.id
JOIN website_scan_jobs wsj ON ec.scan_job_id = wsj.id
WHERE wsj.user_id = 'your-user-id'
ORDER BY agk.created_at DESC;
```

#### Check Scan Logs
```sql
SELECT * FROM scan_job_logs 
WHERE scan_job_id IN (
  SELECT id FROM website_scan_jobs 
  WHERE user_id = 'your-user-id'
)
ORDER BY created_at DESC;
```

### Browser Developer Tools
1. **Network Tab**: Monitor API calls and responses
2. **Console**: Check for JavaScript errors
3. **Performance Tab**: Monitor scan performance
4. **Application Tab**: Check local storage and session data

## 🎯 Sample Test Cases

### Test Case 1: Simple Static Website
**URL**: https://example.com
**Expected**: Basic content extraction, general classification
**Success Criteria**: Content extracted, quality score > 0.5

### Test Case 2: E-commerce Pricing Page
**URL**: https://shopify.com/pricing
**Expected**: Pricing content, structured data extraction
**Success Criteria**: Pricing plans detected, quality score > 0.8

### Test Case 3: FAQ Page
**URL**: https://support.github.com
**Expected**: FAQ content, question-answer pairs
**Success Criteria**: FAQ items extracted, quality score > 0.7

### Test Case 4: Company About Page
**URL**: https://about.google
**Expected**: Company information, contact details
**Success Criteria**: About content extracted, quality score > 0.6

## 📈 Quality Assurance

### Content Quality Metrics
- **Completeness**: All important content extracted
- **Accuracy**: Content matches source
- **Structure**: Proper heading hierarchy
- **Metadata**: Title, description, keywords captured

### Performance Benchmarks
- **Scan Speed**: > 10 pages/minute
- **Success Rate**: > 90%
- **Quality Score**: Average > 0.7
- **Processing Time**: < 5 minutes for 50 pages

### Error Handling
- **Network Errors**: Graceful handling and retry
- **Invalid URLs**: Clear error messages
- **Rate Limiting**: Automatic backoff
- **Large Content**: Timeout handling

## 🚀 Production Readiness Checklist

### Security
- [ ] RLS policies working correctly
- [ ] User isolation verified
- [ ] Rate limiting implemented
- [ ] Error logging configured

### Performance
- [ ] Scan speed meets requirements
- [ ] Memory usage optimized
- [ ] Database queries efficient
- [ ] Background processing stable

### User Experience
- [ ] Progress tracking accurate
- [ ] Error messages clear
- [ ] UI responsive during scans
- [ ] Results display properly

### Data Quality
- [ ] Content extraction accurate
- [ ] Classification working
- [ ] Knowledge generation quality
- [ ] Review workflow functional

## 📝 Test Report Template

### Test Summary
- **Date**: [Date]
- **Tester**: [Name]
- **Test Environment**: [Development/Staging/Production]
- **Test Duration**: [Time]

### Test Results
- **Total Scans**: [Number]
- **Successful Scans**: [Number]
- **Failed Scans**: [Number]
- **Average Quality Score**: [Score]
- **Average Processing Time**: [Time]

### Issues Found
- [ ] Issue 1: [Description]
- [ ] Issue 2: [Description]
- [ ] Issue 3: [Description]

### Recommendations
- [ ] Recommendation 1: [Description]
- [ ] Recommendation 2: [Description]
- [ ] Recommendation 3: [Description]

## 🎉 Success Criteria

A successful test run should demonstrate:
1. ✅ URLs are validated and processed correctly
2. ✅ Content is extracted with good quality scores
3. ✅ Knowledge items are generated appropriately
4. ✅ Review workflow functions properly
5. ✅ Performance meets requirements
6. ✅ Error handling works as expected

## 🔄 Continuous Testing

### Automated Testing
- Set up automated tests for core functionality
- Monitor scan performance over time
- Track quality metrics and trends
- Alert on failures or performance degradation

### Manual Testing
- Regular testing with new websites
- User acceptance testing with real scenarios
- Performance testing with larger datasets
- Security testing and penetration testing

This testing guide ensures comprehensive validation of the website scanning system and helps identify any issues before production deployment. 