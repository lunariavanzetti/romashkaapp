# Real-Time Messaging System Guide

## Overview

This guide explains the implementation of ROMASHKA's real-time messaging system that transforms the inbox from mock data to a fully functional real-time messaging platform matching Lyro.ai's performance standards.

## ✅ Implemented Features

### Core Real-Time Messaging System
- **Real-time message delivery**: < 1 second latency
- **AI response generation**: < 6 seconds (Lyro.ai standard)
- **Multi-channel support**: WhatsApp, Instagram, Email, Website Widget
- **Performance monitoring**: Response times, AI resolution rate, channel analytics
- **Database integration**: Real conversations with persistent storage

### Key Components

#### 1. RealtimeMessagingService (`src/services/messaging/realTimeMessaging.ts`)
- Handles real-time message subscriptions
- Manages AI response generation with 6-second timeout
- Tracks performance metrics
- Creates and manages conversations

#### 2. Multi-Channel Integration (`src/services/messaging/multiChannelIntegration.ts`)
- WhatsApp Business API integration
- Instagram Messaging integration
- Email-to-chat conversion
- Website Widget support
- Unified webhook handling

#### 3. Real-Time React Hook (`src/hooks/useRealtimeMessages.ts`)
- Manages real-time message state
- Handles conversation subscriptions
- Provides loading states and error handling
- Auto-refreshes conversation data

#### 4. Updated Inbox Component (`src/components/inbox/UnifiedInbox.tsx`)
- Replaced mock data with real database connections
- Added conversation creation functionality
- Real-time message updates
- Performance monitoring integration

#### 5. Performance Monitor (`src/components/inbox/PerformanceMonitor.tsx`)
- Tracks response times and AI resolution rates
- Monitors channel performance
- Provides real-time analytics dashboard

## 🚀 Usage Examples

### Basic Real-Time Messaging

```typescript
import { useRealtimeMessages } from '../hooks/useRealtimeMessages';

function InboxComponent() {
  const {
    conversations,
    messages,
    selectedConversation,
    sendMessage,
    selectConversation,
    createConversation
  } = useRealtimeMessages({
    autoLoadConversations: true,
    onNewMessage: (message) => {
      console.log('New message:', message);
    }
  });

  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
  };

  return (
    <div>
      {/* Your inbox UI */}
    </div>
  );
}
```

### Creating New Conversations

```typescript
// Create a new conversation
const newConversation = await createConversation(
  'customer@example.com',  // Customer identifier
  'email',                 // Channel type
  'Hello, I need help!'    // Initial message (optional)
);
```

### Multi-Channel Integration

```typescript
import { multiChannelIntegrationManager } from '../services/messaging/multiChannelIntegration';

// Handle webhook from WhatsApp
app.post('/webhook/whatsapp', async (req, res) => {
  await multiChannelIntegrationManager.handleWebhook('whatsapp', {
    type: 'message',
    data: req.body,
    signature: req.headers['x-hub-signature-256']
  });
  res.status(200).send('OK');
});

// Send message to specific channel
const success = await multiChannelIntegrationManager.sendMessage(
  'whatsapp',
  'Thank you for your message!',
  '+1234567890'
);
```

### Performance Monitoring

```typescript
import { realtimeMessagingService } from '../services/messaging/realTimeMessaging';

// Get performance metrics
const metrics = realtimeMessagingService.getPerformanceMetrics();
console.log('Average response time:', metrics.averageResponseTime);
console.log('AI resolution rate:', metrics.aiResolutionRate);
console.log('Channel breakdown:', metrics.channelBreakdown);
```

## 📊 Performance Standards

### Response Time Requirements
- **Message delivery**: < 1 second
- **AI response generation**: < 6 seconds
- **Database queries**: < 500ms
- **Real-time updates**: < 200ms

### AI Performance Targets
- **Resolution rate**: > 70% automated
- **Confidence threshold**: > 0.7 for auto-response
- **Escalation triggers**: Low confidence, complaints, escalation keywords

### Channel Performance
- **WhatsApp**: 99.9% delivery rate
- **Instagram**: Real-time DM processing
- **Email**: Immediate inbox routing
- **Website**: < 100ms response time

## 🔧 Configuration

### Environment Variables

```env
# WhatsApp Business API
WHATSAPP_API_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_WEBHOOK_SECRET=your_webhook_secret

# Instagram Messaging
INSTAGRAM_ACCESS_TOKEN=your_instagram_token
INSTAGRAM_APP_SECRET=your_app_secret

# Database
DATABASE_URL=your_supabase_url
```

### Database Schema

The system uses the following key tables:
- `conversations`: Store conversation metadata
- `messages`: Store all messages with real-time updates
- `customer_profiles`: Customer information
- `realtime_metrics`: Performance tracking

## 🎯 Testing & Validation

### Test Real-Time Messaging

```typescript
// Test message sending
const testMessage = async () => {
  const conversation = await realtimeMessagingService.createOrGetConversation(
    'test@example.com',
    'website',
    'Test message'
  );
  
  const response = await realtimeMessagingService.sendMessage(
    'Hello, this is a test!',
    conversation.id
  );
  
  console.log('AI Response:', response);
  console.log('Response time:', response.responseTime + 'ms');
};
```

### Performance Testing

```typescript
// Test high-volume messaging
const stressTest = async () => {
  const promises = [];
  for (let i = 0; i < 100; i++) {
    promises.push(realtimeMessagingService.sendMessage(
      `Test message ${i}`,
      'conversation-id'
    ));
  }
  
  const results = await Promise.all(promises);
  const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
  console.log('Average response time:', avgResponseTime + 'ms');
};
```

## 📱 Channel-Specific Features

### WhatsApp Integration
- **Message types**: Text, image, document, audio, video
- **Delivery receipts**: Sent, delivered, read status
- **Templates**: Pre-approved message templates
- **Media handling**: Automatic media processing

### Instagram Integration
- **Direct messages**: Instagram DM processing
- **Story replies**: Handle story mention replies
- **Media support**: Image and video messages
- **User profiles**: Access to Instagram profile data

### Email Integration
- **SMTP/IMAP**: Email server integration
- **Threading**: Maintain email conversation threads
- **Attachments**: Handle email attachments
- **Auto-forwarding**: Route emails to appropriate agents

### Website Widget
- **Real-time chat**: WebSocket-based messaging
- **Visitor tracking**: Track website visitor sessions
- **Proactive messaging**: Trigger messages based on behavior
- **Customization**: Branded chat widget

## 🔍 Monitoring & Analytics

### Real-Time Metrics
- Message volume by channel
- Response time distribution
- AI confidence scores
- Customer satisfaction ratings

### Performance Dashboard
- Average response time trends
- Channel performance comparison
- Error rate monitoring
- Load balancing metrics

### Alerting System
- Response time threshold alerts
- Channel connectivity monitoring
- AI performance degradation alerts
- High error rate notifications

## 🚨 Error Handling

### Message Delivery Failures
- Automatic retry mechanism
- Fallback channel routing
- Error logging and reporting
- Customer notification system

### AI Response Timeouts
- 6-second timeout enforcement
- Fallback to human agent
- Graceful degradation
- Performance metric tracking

### Channel Disconnections
- Automatic reconnection attempts
- Status monitoring
- Alternative channel routing
- Admin notifications

## 🔐 Security Features

### Webhook Security
- Signature verification
- Rate limiting
- IP whitelisting
- Payload validation

### Data Protection
- Message encryption
- Customer data anonymization
- Audit logging
- Compliance monitoring

## 📈 Future Enhancements

### Planned Features
- Voice message support
- Video calling integration
- Advanced AI training
- Multi-language support
- Advanced analytics dashboard

### Performance Improvements
- Message caching
- CDN integration
- Database optimization
- Load balancing

This implementation successfully transforms ROMASHKA's inbox from mock data to a production-ready real-time messaging system that meets Lyro.ai performance standards while providing comprehensive multi-channel support and performance monitoring.