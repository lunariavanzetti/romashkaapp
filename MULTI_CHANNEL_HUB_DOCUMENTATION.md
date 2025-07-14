# Multi-Channel Messaging Hub Documentation

## Overview

This documentation covers the comprehensive multi-channel messaging hub implementation for ROMASHKA that integrates Instagram DM, website widget embedding, email-to-chat conversion, and unified channel management.

## Features Implemented

### 1. Instagram DM Integration

**File:** `romashka/src/services/channels/instagramService.ts`

**Features:**
- Direct message processing and response
- Story mentions handling
- Post comments integration
- Webhook event processing
- Business profile management
- Auto-response system with AI integration

**Key Methods:**
- `sendMessage()` - Send messages to Instagram users
- `handleWebhook()` - Process incoming Instagram events
- `handleStoryMention()` - Process story mentions
- `handlePostComment()` - Process post comments
- `getBusinessProfile()` - Get Instagram business profile info

**Setup Requirements:**
- Instagram Business Account
- Facebook App with Instagram Basic Display API
- Access Token with required permissions
- Webhook endpoint configuration

### 2. Email-to-Chat Conversion

**File:** `romashka/src/services/channels/emailService.ts`

**Features:**
- SendGrid webhook integration
- Email parsing and content extraction
- Thread management and conversation continuity
- Auto-response templates
- Attachment handling
- Email template management

**Key Methods:**
- `handleInboundEmail()` - Process incoming emails
- `sendMessage()` - Send email responses
- `createEmailTemplate()` - Create email templates
- `sendTemplatedEmail()` - Send templated emails
- `cleanEmailText()` - Clean email content

**Setup Requirements:**
- SendGrid API Key
- Webhook configuration for inbound emails
- Email template setup
- SMTP/IMAP configuration

### 3. Website Widget System

**Files:**
- `romashka/src/services/channels/widgetService.ts`
- `romashka/src/components/widget/WidgetCustomizer.tsx`

**Features:**
- Customizable chat widget with visual editor
- Multiple installation methods (HTML, GTM, WordPress)
- Proactive messaging triggers
- Mobile optimization
- A/B testing capabilities
- Real-time communication
- Offline form capture
- Analytics and performance tracking

**Widget Configuration Options:**
- Position (bottom-right, bottom-left, top-right, top-left)
- Theme (light, dark, auto)
- Custom colors and branding
- Welcome messages and quick replies
- Behavior triggers (time, scroll, exit intent)
- Domain restrictions
- Custom fields

### 4. Unified Channel Management

**Files:**
- `romashka/src/services/channels/unifiedChannelManager.ts`
- `romashka/src/components/inbox/UnifiedInbox.tsx`
- `romashka/src/pages/channels/ChannelsPage.tsx`

**Features:**
- Single interface for all channels
- Cross-channel conversation continuity
- Customer identity unification
- Routing rules and escalation
- Channel performance analytics
- Unified messaging interface
- Channel status monitoring

## Installation and Setup

### 1. Dependencies

Ensure the following dependencies are installed:

```bash
npm install @sendgrid/mail date-fns
```

### 2. Environment Variables

Set up the following environment variables:

```env
# Instagram
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token
INSTAGRAM_APP_SECRET=your_instagram_app_secret
INSTAGRAM_PAGE_ID=your_instagram_page_id

# SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key
SUPPORT_EMAIL=support@yourdomain.com

# WhatsApp (existing)
WHATSAPP_ACCESS_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_WEBHOOK_SECRET=your_webhook_secret

# Database
DATABASE_URL=your_database_url
```

### 3. Channel Configuration

Initialize the unified channel manager:

```typescript
import { UnifiedChannelManager } from './services/channels/unifiedChannelManager';

const channelManager = new UnifiedChannelManager({
  whatsapp: {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    webhookSecret: process.env.WHATSAPP_WEBHOOK_SECRET,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID
  },
  instagram: {
    accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
    appSecret: process.env.INSTAGRAM_APP_SECRET,
    pageId: process.env.INSTAGRAM_PAGE_ID
  },
  email: {
    supportEmail: process.env.SUPPORT_EMAIL,
    smtpHost: 'smtp.sendgrid.net',
    smtpPort: 587,
    smtpUser: 'apikey',
    smtpPassword: process.env.SENDGRID_API_KEY,
    imapHost: 'imap.gmail.com',
    imapPort: 993
  },
  sendgridApiKey: process.env.SENDGRID_API_KEY,
  widget: {
    enabled: true,
    projectId: 'your-project-id'
  }
});
```

## Usage Examples

### 1. Sending Messages Across Channels

```typescript
// Send message to specific channel
await channelManager.sendMessage(
  'conversation-id',
  { text: 'Hello from ROMASHKA!' },
  'whatsapp'
);

// Send to optimal channel (based on routing rules)
await channelManager.sendMessage(
  'conversation-id',
  { text: 'How can I help you today?' }
);
```

### 2. Setting Up Widget

```typescript
import { WidgetCustomizer } from './components/widget/WidgetCustomizer';

<WidgetCustomizer
  projectId="your-project-id"
  onConfigChange={(config) => {
    // Handle configuration changes
    console.log('Widget config updated:', config);
  }}
  onEmbedCodeGenerated={(code) => {
    // Handle embed code generation
    console.log('Embed code:', code);
  }}
/>
```

### 3. Processing Webhooks

```typescript
// Set up webhook endpoints
app.post('/webhook/instagram', async (req, res) => {
  await channelManager.handleWebhook('instagram', req.body, req.headers);
  res.sendStatus(200);
});

app.post('/webhook/email', async (req, res) => {
  await channelManager.handleWebhook('email', req.body, req.headers);
  res.sendStatus(200);
});
```

### 4. Using Unified Inbox

```typescript
import { UnifiedInbox } from './components/inbox/UnifiedInbox';

<UnifiedInbox
  onConversationSelect={(conversation) => {
    console.log('Selected conversation:', conversation);
  }}
  onSendMessage={async (conversationId, content) => {
    await channelManager.sendMessage(conversationId, content);
  }}
/>
```

## Webhook Configuration

### Instagram Webhook
- **URL:** `https://yourdomain.com/webhook/instagram`
- **Events:** `messages`, `messaging_postbacks`, `messaging_deliveries`, `messaging_reads`
- **Verification:** App secret-based signature verification

### Email Webhook (SendGrid)
- **URL:** `https://yourdomain.com/webhook/email`
- **Events:** `inbound_email`, `delivered`, `opened`, `clicked`, `bounced`
- **Verification:** SendGrid signature verification

### Website Widget
- **Communication:** WebSocket or Server-Sent Events
- **Events:** `message`, `session_start`, `session_end`, `typing`, `page_view`

## API Endpoints

### Channel Management
- `GET /api/channels` - Get all channel statuses
- `POST /api/channels/:type/setup` - Configure channel
- `POST /api/channels/:type/test` - Test channel connection
- `GET /api/channels/:type/analytics` - Get channel analytics

### Conversations
- `GET /api/conversations` - Get all conversations
- `GET /api/conversations/:id` - Get specific conversation
- `POST /api/conversations/:id/message` - Send message
- `PUT /api/conversations/:id/merge` - Merge conversations

### Widget
- `GET /api/widget/:projectId/config` - Get widget configuration
- `POST /api/widget/:projectId/config` - Update widget configuration
- `GET /api/widget/:projectId/analytics` - Get widget analytics

## Analytics and Metrics

### Available Metrics
- Total messages across all channels
- Average response time per channel
- Customer satisfaction scores
- Active conversations count
- Message delivery and read rates
- Conversion rates by channel
- Channel performance comparison

### Analytics Dashboard
The system provides comprehensive analytics including:
- Real-time channel status
- Message volume trends
- Response time analysis
- Customer engagement metrics
- ROI tracking by channel

## Advanced Features

### 1. Proactive Messaging
Configure triggers for automated messages:
- Time-based triggers (after X seconds)
- Scroll-based triggers (after X% scrolled)
- Exit intent detection
- Page visit duration

### 2. Customer Identity Unification
Automatically merge customer profiles across channels:
- Phone number matching (WhatsApp, SMS)
- Email address matching
- Social media profile linking
- Custom field matching

### 3. Routing Rules
Set up intelligent message routing:
- Priority-based routing
- Agent availability routing
- Customer type routing
- Content type routing

### 4. A/B Testing
Test different configurations:
- Widget appearance variations
- Message templates
- Response strategies
- Channel preferences

## Troubleshooting

### Common Issues

1. **Webhook Verification Failed**
   - Check webhook secret configuration
   - Verify signature calculation
   - Ensure proper Content-Type headers

2. **Instagram API Rate Limits**
   - Implement rate limiting in your application
   - Use message queuing for high volume
   - Monitor API usage quotas

3. **Email Delivery Issues**
   - Verify SendGrid API key
   - Check domain authentication
   - Monitor bounce rates

4. **Widget Not Loading**
   - Check domain restrictions
   - Verify embed code implementation
   - Ensure CORS configuration

## Security Considerations

1. **API Key Management**
   - Store API keys securely
   - Rotate keys regularly
   - Use environment variables

2. **Webhook Security**
   - Implement signature verification
   - Use HTTPS for all endpoints
   - Validate payload structure

3. **Customer Data Protection**
   - Encrypt sensitive data
   - Implement data retention policies
   - Follow GDPR/CCPA compliance

## Performance Optimization

1. **Message Processing**
   - Use message queues for high volume
   - Implement retry mechanisms
   - Cache frequently accessed data

2. **Database Optimization**
   - Index conversation and message tables
   - Archive old conversations
   - Use read replicas for analytics

3. **Real-time Communication**
   - Use WebSocket connections efficiently
   - Implement connection pooling
   - Handle connection failures gracefully

## Testing

### Unit Tests
Run tests for individual channel services:
```bash
npm test src/services/channels/
```

### Integration Tests
Test webhook endpoints:
```bash
npm test src/tests/webhooks/
```

### Widget Testing
Test widget functionality:
```bash
npm test src/components/widget/
```

## Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] Webhook endpoints secured
- [ ] SSL certificates installed
- [ ] Database migrations applied
- [ ] API rate limits configured
- [ ] Monitoring alerts set up
- [ ] Backup procedures implemented

### Scaling Considerations
- Use load balancers for high availability
- Implement horizontal scaling for message processing
- Use CDN for widget assets
- Monitor resource usage and performance

## Support and Maintenance

### Monitoring
- Set up health checks for all channels
- Monitor webhook delivery rates
- Track message processing times
- Alert on error rates

### Updates
- Regular security updates
- API version compatibility
- Feature enhancements
- Bug fixes and improvements

## Conclusion

This multi-channel messaging hub provides a comprehensive solution for managing customer communications across Instagram, email, website widgets, and other channels. The unified interface ensures consistent customer experience while the advanced features enable sophisticated automation and analytics.

For additional support or feature requests, please refer to the development team or create an issue in the project repository.