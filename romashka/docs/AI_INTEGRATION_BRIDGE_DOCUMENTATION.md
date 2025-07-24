# AI-Integration Bridge Service Documentation

## Overview

The AI-Integration Bridge Service is a comprehensive system that allows the ROMASHKA AI chat system to access real-time data from connected integrations (HubSpot, Shopify, Salesforce) during conversations. This enables the AI to provide specific, contextual responses based on actual customer data rather than generic knowledge base answers.

## Architecture

### Core Components

1. **Integration Query Service** (`src/services/ai/integrationQueryService.ts`)
   - Intelligent query routing and intent detection
   - Real-time data fetching with caching
   - Error handling and fallbacks

2. **Prompt Enhancement Service** (`src/services/ai/promptEnhancementService.ts`)
   - AI prompt enhancement with integration context
   - Data formatting for optimal AI consumption
   - Privacy-aware data filtering

3. **Enhanced useRealTimeChat Hook** (`src/hooks/useRealTimeChat.ts`)
   - Integration-aware chat functionality
   - Seamless AI response generation with context

4. **Type Definitions** (`src/types/ai-integration.ts`)
   - Comprehensive TypeScript interfaces
   - Type safety across all components

### Data Flow

```
User Message → Intent Detection → Data Fetching → Prompt Enhancement → AI Response
     ↓              ↓               ↓                ↓                  ↓
useRealTimeChat → QueryService → Supabase DB → PromptService → OpenAI API
```

## Key Features

### 🧠 Intelligent Query Routing
- Automatic intent detection from user messages
- Entity extraction (order numbers, emails, product names)
- Context-aware data fetching

### ⚡ Performance Optimization
- Intelligent caching with 5-minute TTL
- Query responses under 500ms
- Graceful degradation when integrations are offline

### 🔒 Security & Privacy
- Row-level security (RLS) enforcement
- Sensitive data filtering
- User-specific data access

### 🔄 Multi-Provider Support
- HubSpot (contacts, deals, CRM data)
- Shopify (orders, products, customers)
- Salesforce (leads, opportunities, accounts)

## Installation & Setup

### 1. Dependencies
The system uses existing dependencies:
- Supabase client for database access
- OpenAI API for AI responses
- React Query for caching (optional)

### 2. Environment Variables
Ensure these are configured:
```env
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup
The system uses existing integration tables:
- `oauth_tokens`
- `synced_contacts`
- `synced_orders`
- `synced_products`
- `synced_deals`

## Usage Examples

### Basic Integration in Chat Component

```typescript
import { useRealTimeChat } from '../hooks/useRealTimeChat';

function ChatComponent() {
  const { sendMessage, messages } = useRealTimeChat({
    conversationId: 'conv-123',
    userId: 'user-456',
    agentConfig: {
      name: 'AI Assistant',
      tone: 'helpful and professional',
      businessType: 'e-commerce',
      knowledgeBase: 'Your knowledge base content...'
    }
  });

  // The hook automatically handles integration context
  // No additional code needed - it's seamless!
  
  return (
    <div>
      {messages.map(message => (
        <div key={message.id}>{message.content}</div>
      ))}
    </div>
  );
}
```

### Direct Integration Query Service Usage

```typescript
import { integrationQueryService } from '../services/ai/integrationQueryService';

async function handleCustomQuery() {
  const context = await integrationQueryService.analyzeAndFetchContext(
    "What's the status of my order #1001?",
    userId,
    conversationId
  );

  console.log('Integration context:', context);
  // {
  //   hasIntegrations: true,
  //   availableProviders: ['shopify', 'hubspot'],
  //   relevantData: {
  //     orders: [{ order_number: '1001', status: 'shipped', ... }]
  //   },
  //   queryIntent: { type: 'order_status', confidence: 0.9 },
  //   summary: 'Order 1001: shipped, $299.99 USD'
  // }
}
```

### Custom Prompt Enhancement

```typescript
import { promptEnhancementService } from '../services/ai/promptEnhancementService';

function enhancePromptExample() {
  const enhanced = promptEnhancementService.enhancePromptWithIntegrations({
    userMessage: "What's my recent order status?",
    originalKnowledgeBase: "Standard policies...",
    integrationContext: context,
    agentTone: 'friendly',
    businessType: 'e-commerce',
    userId: 'user-123'
  });

  console.log('Enhanced system prompt:', enhanced.enhancedSystemPrompt);
  console.log('Enhanced user prompt:', enhanced.enhancedUserPrompt);
}
```

## Query Intent Types

The system detects the following intent types:

| Intent Type | Description | Example Queries |
|-------------|-------------|-----------------|
| `order_status` | Order status inquiries | "What's my order status?", "Order #1001 status?" |
| `order_tracking` | Tracking information | "Where is my order?", "Tracking info please" |
| `product_info` | Product details | "Tell me about Product X", "Product specifications" |
| `product_availability` | Stock/availability | "Is Product Y in stock?", "When will it be available?" |
| `pricing_info` | Pricing inquiries | "What's the price?", "How much does it cost?" |
| `contact_info` | Contact details | "My account manager?", "Who handles my account?" |
| `account_info` | Account overview | "My account info", "Account summary" |
| `deal_info` | Deal/opportunity status | "Deal status", "My opportunities" |
| `payment_info` | Payment status | "Payment processed?", "Billing status" |
| `shipping_info` | Shipping details | "Delivery date?", "Shipping status" |
| `return_refund` | Returns/refunds | "Return order", "Refund request" |
| `general` | Fallback for other queries | General questions |

## Entity Extraction

The system extracts entities from user messages:

```typescript
// Example extracted entities
{
  order_number: "1001",
  email: "customer@example.com",
  product_name: "Premium Widget",
  deal_name: "Enterprise Deal",
  date_range: { start: "2024-01-01", end: "2024-01-31" },
  amount_range: { min: 100, max: 1000 }
}
```

## Integration Data Types

### Orders
```typescript
interface AIIntegrationOrder {
  id: string;
  provider: 'shopify' | 'salesforce' | 'hubspot';
  order_number?: string;
  customer_email?: string;
  total_amount?: number;
  status?: string;
  financial_status?: string;
  fulfillment_status?: string;
  tracking_number?: string;
  items?: AIOrderItem[];
  // ... more fields
}
```

### Products
```typescript
interface AIIntegrationProduct {
  id: string;
  provider: 'shopify' | 'salesforce' | 'hubspot';
  name: string;
  price?: number;
  inventory_quantity?: number;
  status?: string;
  // ... more fields
}
```

### Contacts
```typescript
interface AIIntegrationContact {
  id: string;
  provider: 'shopify' | 'salesforce' | 'hubspot';
  email?: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  title?: string;
  total_spent?: number;
  // ... more fields
}
```

### Deals
```typescript
interface AIIntegrationDeal {
  id: string;
  provider: 'shopify' | 'salesforce' | 'hubspot';
  name: string;
  amount?: number;
  stage?: string;
  close_date?: string;
  probability?: number;
  // ... more fields
}
```

## Performance Characteristics

### Response Times
- **Query Analysis**: < 50ms
- **Data Fetching**: < 200ms (cached) / < 400ms (fresh)
- **Prompt Enhancement**: < 50ms
- **Total Processing**: < 500ms

### Caching Strategy
- **TTL**: 5 minutes for integration data
- **Cache Size**: Max 100 entries per service
- **Cleanup**: Automatic cleanup when cache exceeds size limit
- **Cache Keys**: User-specific and query-specific

### Error Handling
- **Timeout**: 500ms for database queries
- **Retries**: Automatic retry for transient failures
- **Fallback**: Graceful degradation to knowledge base only
- **Logging**: Comprehensive error logging and monitoring

## Testing

### Test Scenarios
The system includes comprehensive test scenarios in `integrationTestScenarios.ts`:

```typescript
import { testRunner } from '../services/ai/integrationTestScenarios';

// Run all tests
const results = await testRunner.runAllTests();
console.log(`Passed: ${results.passed}/${results.totalTests}`);
console.log(`Average Score: ${results.averageScore.toFixed(2)}`);
```

### Example Test Cases
- Order status queries with specific order numbers
- Product availability checks
- Account information requests
- Multi-provider data queries
- Error scenarios and fallbacks

## Configuration

### Cache Configuration
```typescript
const cacheConfig = {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
  cleanupInterval: 60 * 1000 // 1 minute
};
```

### Query Configuration
```typescript
const queryConfig = {
  timeout: 500, // 500ms
  maxRetries: 2,
  batchSize: 10
};
```

### AI Configuration
```typescript
const aiConfig = {
  model: 'gpt-4o-mini',
  maxTokens: 800,
  temperature: 0.3,
  confidenceThreshold: 0.7
};
```

## Monitoring & Analytics

### Performance Metrics
- Query execution time
- Cache hit rates
- Error rates by provider
- Popular query intents
- User engagement metrics

### Logging
All operations are logged with structured data:
```typescript
console.log('🔍 Analyzing message for integration context:', userMessage);
console.log('🎯 Detected intent:', intent);
console.log('🚀 Using enhanced AI prompts with integration data');
console.log('📚 Using standard knowledge base response');
```

## Security Considerations

### Data Privacy
- Sensitive fields are automatically filtered
- User data is isolated using RLS
- No data is stored in AI service memory
- Integration tokens are securely managed

### Access Control
- User-specific data access only
- Provider-specific permissions
- Rate limiting on queries
- Audit logging for compliance

## Troubleshooting

### Common Issues

1. **No Integration Data Returned**
   - Check user has connected integrations
   - Verify OAuth tokens are valid
   - Check RLS policies are correct

2. **Slow Response Times**
   - Check database performance
   - Verify cache is working
   - Monitor network latency

3. **AI Responses Not Using Integration Data**
   - Check intent detection accuracy
   - Verify data formatting
   - Review prompt enhancement logic

### Debug Mode
Enable debug logging:
```typescript
// Set environment variable
VITE_DEBUG_AI_INTEGRATION=true

// Or programmatically
integrationQueryService.enableDebugMode();
```

## Future Enhancements

### Planned Features
- Real-time webhook integration
- Advanced ML-based intent detection
- Multi-language support
- Custom field mapping
- Bulk data operations
- Advanced analytics dashboard

### Extensibility
The system is designed for easy extension:
- Add new integration providers
- Custom intent types
- Additional data formatters
- Custom caching strategies

## API Reference

### IntegrationQueryService

#### `analyzeAndFetchContext(userMessage, userId, conversationId?)`
Main entry point for analyzing user messages and fetching relevant integration data.

**Parameters:**
- `userMessage` (string): The user's message
- `userId` (string): Authenticated user ID
- `conversationId` (string, optional): Current conversation ID

**Returns:** `Promise<AIIntegrationContext>`

#### `clearCache()`
Clears all cached data.

#### `getCacheStats()`
Returns cache statistics.

### PromptEnhancementService

#### `enhancePromptWithIntegrations(request)`
Enhances AI prompts with integration context.

**Parameters:**
- `request` (EnhancedPromptRequest): Enhancement request object

**Returns:** `EnhancedPromptResponse`

#### `formatDataForQueryType(data, queryType)`
Formats integration data for specific query types.

## Support

For issues, questions, or contributions:
1. Check the troubleshooting section
2. Review test scenarios for examples
3. Enable debug logging for detailed information
4. Create detailed issue reports with logs

## License

This AI-Integration Bridge Service is part of the ROMASHKA AI chat system and follows the same licensing terms.

---

*Last updated: January 2024*
*Version: 1.0.0*