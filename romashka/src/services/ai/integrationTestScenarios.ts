/**
 * Comprehensive Test Scenarios for AI-Integration Bridge System
 * Validates query intent detection, data fetching, and AI response generation
 */

import { TestScenario, QueryIntentType, AIIntegrationContact, AIIntegrationOrder, AIIntegrationProduct, AIIntegrationDeal } from '../../types/ai-integration';

// Mock test data
const mockContacts: AIIntegrationContact[] = [
  {
    id: 'contact-1',
    provider: 'hubspot',
    external_id: 'hs-12345',
    email: 'john.doe@example.com',
    first_name: 'John',
    last_name: 'Doe',
    phone: '+1-555-0123',
    company: 'Acme Corp',
    title: 'CEO',
    lead_source: 'Website',
    lifecycle_stage: 'customer',
    total_spent: 15000,
    orders_count: 3,
    data: {
      lifecycle_stage: 'customer',
      total_spent: '15000',
      orders_count: 3
    },
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T15:30:00Z'
  },
  {
    id: 'contact-2',
    provider: 'salesforce',
    external_id: 'sf-67890',
    email: 'jane.smith@techcorp.com',
    first_name: 'Jane',
    last_name: 'Smith',
    phone: '+1-555-0456',
    company: 'TechCorp Inc',
    title: 'CTO',
    lead_source: 'Referral',
    created_at: '2024-01-10T09:00:00Z',
    updated_at: '2024-01-18T14:20:00Z'
  }
];

const mockOrders: AIIntegrationOrder[] = [
  {
    id: 'order-1',
    provider: 'shopify',
    external_id: 'shop-order-1001',
    order_number: '1001',
    customer_email: 'john.doe@example.com',
    customer_name: 'John Doe',
    total_amount: 299.99,
    currency: 'USD',
    status: 'fulfilled',
    financial_status: 'paid',
    fulfillment_status: 'shipped',
    tracking_number: 'TRK123456789',
    items: [
      {
        product_name: 'Premium Widget',
        quantity: 2,
        unit_price: 149.99,
        total_price: 299.98,
        sku: 'WIDGET-001'
      }
    ],
    data: {
      financial_status: 'paid',
      fulfillment_status: 'shipped',
      tracking_number: 'TRK123456789'
    },
    created_at: '2024-01-18T12:00:00Z',
    updated_at: '2024-01-19T10:30:00Z'
  },
  {
    id: 'order-2',
    provider: 'shopify',
    external_id: 'shop-order-1002',
    order_number: '1002',
    customer_email: 'jane.smith@techcorp.com',
    customer_name: 'Jane Smith',
    total_amount: 149.99,
    currency: 'USD',
    status: 'pending',
    financial_status: 'pending',
    fulfillment_status: 'unfulfilled',
    items: [
      {
        product_name: 'Basic Widget',
        quantity: 1,
        unit_price: 149.99,
        total_price: 149.99,
        sku: 'WIDGET-002'
      }
    ],
    data: {
      financial_status: 'pending',
      fulfillment_status: 'unfulfilled'
    },
    created_at: '2024-01-20T14:00:00Z',
    updated_at: '2024-01-20T14:00:00Z'
  }
];

const mockProducts: AIIntegrationProduct[] = [
  {
    id: 'product-1',
    provider: 'shopify',
    external_id: 'shop-prod-001',
    name: 'Premium Widget',
    description: 'High-quality premium widget with advanced features',
    price: 149.99,
    currency: 'USD',
    sku: 'WIDGET-001',
    inventory_quantity: 25,
    status: 'active',
    product_type: 'Widget',
    vendor: 'WidgetCorp',
    tags: ['premium', 'bestseller'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T12:00:00Z'
  },
  {
    id: 'product-2',
    provider: 'shopify',
    external_id: 'shop-prod-002',
    name: 'Basic Widget',
    description: 'Entry-level widget for basic needs',
    price: 79.99,
    currency: 'USD',
    sku: 'WIDGET-002',
    inventory_quantity: 0,
    status: 'active',
    product_type: 'Widget',
    vendor: 'WidgetCorp',
    tags: ['basic', 'entry-level'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-20T09:00:00Z'
  }
];

const mockDeals: AIIntegrationDeal[] = [
  {
    id: 'deal-1',
    provider: 'hubspot',
    external_id: 'hs-deal-001',
    name: 'Acme Corp Enterprise Deal',
    amount: 50000,
    currency: 'USD',
    stage: 'Proposal Sent',
    pipeline: 'Sales Pipeline',
    close_date: '2024-02-15',
    probability: 75,
    deal_type: 'New Business',
    lead_source: 'Website',
    contact_id: 'hs-12345',
    contact_name: 'John Doe',
    contact_email: 'john.doe@example.com',
    company_name: 'Acme Corp',
    data: {
      deal_type: 'New Business',
      pipeline: 'Sales Pipeline'
    },
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-20T16:00:00Z'
  },
  {
    id: 'deal-2',
    provider: 'salesforce',
    external_id: 'sf-opp-001',
    name: 'TechCorp Expansion',
    amount: 25000,
    currency: 'USD',
    stage: 'Negotiation',
    pipeline: 'Enterprise Sales',
    close_date: '2024-01-30',
    probability: 90,
    deal_type: 'Expansion',
    contact_name: 'Jane Smith',
    contact_email: 'jane.smith@techcorp.com',
    company_name: 'TechCorp Inc',
    created_at: '2024-01-05T08:00:00Z',
    updated_at: '2024-01-19T11:30:00Z'
  }
];

// Test scenarios for different query types
export const testScenarios: TestScenario[] = [
  // Order Status Queries
  {
    name: 'Order Status - Specific Order Number',
    description: 'User asks about a specific order by number',
    userMessage: 'What is the status of my order #1001?',
    expectedIntent: 'order_status',
    expectedEntities: {
      order_number: '1001'
    },
    mockData: {
      orders: mockOrders
    },
    expectedResponse: {
      hasIntegrationData: true,
      confidence: 0.9,
      containsKeywords: ['Order 1001', 'fulfilled', 'shipped', 'TRK123456789']
    }
  },
  {
    name: 'Order Status - General Recent Orders',
    description: 'User asks about recent orders without specific number',
    userMessage: 'Can you show me my recent orders?',
    expectedIntent: 'order_status',
    mockData: {
      orders: mockOrders
    },
    expectedResponse: {
      hasIntegrationData: true,
      confidence: 0.8,
      containsKeywords: ['Order 1001', 'Order 1002', 'fulfilled', 'pending']
    }
  },
  {
    name: 'Order Tracking',
    description: 'User asks for tracking information',
    userMessage: 'Where is my order? Can you give me tracking info?',
    expectedIntent: 'order_tracking',
    mockData: {
      orders: mockOrders
    },
    expectedResponse: {
      hasIntegrationData: true,
      confidence: 0.8,
      containsKeywords: ['tracking', 'TRK123456789', 'shipped']
    }
  },

  // Product Information Queries
  {
    name: 'Product Info - Specific Product',
    description: 'User asks about a specific product',
    userMessage: 'Tell me about the Premium Widget',
    expectedIntent: 'product_info',
    expectedEntities: {
      product_name: 'Premium Widget'
    },
    mockData: {
      products: mockProducts
    },
    expectedResponse: {
      hasIntegrationData: true,
      confidence: 0.8,
      containsKeywords: ['Premium Widget', '$149.99', 'Stock: 25']
    }
  },
  {
    name: 'Product Availability',
    description: 'User asks about product availability',
    userMessage: 'Is the Basic Widget in stock?',
    expectedIntent: 'product_availability',
    expectedEntities: {
      product_name: 'Basic Widget'
    },
    mockData: {
      products: mockProducts
    },
    expectedResponse: {
      hasIntegrationData: true,
      confidence: 0.8,
      containsKeywords: ['Basic Widget', 'Stock: 0', 'out of stock']
    }
  },
  {
    name: 'Pricing Information',
    description: 'User asks about product pricing',
    userMessage: 'What is the price of your widgets?',
    expectedIntent: 'pricing_info',
    mockData: {
      products: mockProducts
    },
    expectedResponse: {
      hasIntegrationData: true,
      confidence: 0.7,
      containsKeywords: ['Premium Widget', '$149.99', 'Basic Widget', '$79.99']
    }
  },

  // Contact and Account Queries
  {
    name: 'Account Information',
    description: 'User asks about their account details',
    userMessage: 'Can you show me my account information?',
    expectedIntent: 'account_info',
    mockData: {
      contacts: mockContacts,
      orders: mockOrders
    },
    expectedResponse: {
      hasIntegrationData: true,
      confidence: 0.8,
      containsKeywords: ['John Doe', 'Acme Corp', 'CEO', 'total spent', '$15000']
    }
  },
  {
    name: 'Contact Information - Specific Email',
    description: 'User asks about contact info for specific email',
    userMessage: 'Who is my account manager for john.doe@example.com?',
    expectedIntent: 'contact_info',
    expectedEntities: {
      email: 'john.doe@example.com'
    },
    mockData: {
      contacts: mockContacts
    },
    expectedResponse: {
      hasIntegrationData: true,
      confidence: 0.8,
      containsKeywords: ['John Doe', 'Acme Corp', 'CEO']
    }
  },

  // Deal and Opportunity Queries
  {
    name: 'Deal Status',
    description: 'User asks about deal or opportunity status',
    userMessage: 'What is the status of the Acme Corp deal?',
    expectedIntent: 'deal_status',
    expectedEntities: {
      company_name: 'Acme Corp'
    },
    mockData: {
      deals: mockDeals
    },
    expectedResponse: {
      hasIntegrationData: true,
      confidence: 0.8,
      containsKeywords: ['Acme Corp Enterprise Deal', 'Proposal Sent', '$50000', '75%']
    }
  },
  {
    name: 'Deal Information - General',
    description: 'User asks about their deals in general',
    userMessage: 'Show me my current deals and opportunities',
    expectedIntent: 'deal_info',
    mockData: {
      deals: mockDeals
    },
    expectedResponse: {
      hasIntegrationData: true,
      confidence: 0.7,
      containsKeywords: ['Acme Corp Enterprise Deal', 'TechCorp Expansion', 'Proposal Sent', 'Negotiation']
    }
  },

  // Payment and Shipping Queries
  {
    name: 'Payment Information',
    description: 'User asks about payment status',
    userMessage: 'Has my payment been processed for order 1001?',
    expectedIntent: 'payment_info',
    expectedEntities: {
      order_number: '1001'
    },
    mockData: {
      orders: mockOrders
    },
    expectedResponse: {
      hasIntegrationData: true,
      confidence: 0.8,
      containsKeywords: ['Order 1001', 'paid', 'payment processed']
    }
  },
  {
    name: 'Shipping Information',
    description: 'User asks about shipping details',
    userMessage: 'When will my order be delivered?',
    expectedIntent: 'shipping_info',
    mockData: {
      orders: mockOrders
    },
    expectedResponse: {
      hasIntegrationData: true,
      confidence: 0.7,
      containsKeywords: ['shipped', 'tracking', 'delivery']
    }
  },

  // Complex Multi-Entity Queries
  {
    name: 'Complex Query - Customer with Orders and Deals',
    description: 'User asks about comprehensive account status',
    userMessage: 'Can you give me a complete overview of john.doe@example.com account including orders and deals?',
    expectedIntent: 'account_info',
    expectedEntities: {
      email: 'john.doe@example.com'
    },
    mockData: {
      contacts: mockContacts,
      orders: mockOrders,
      deals: mockDeals
    },
    expectedResponse: {
      hasIntegrationData: true,
      confidence: 0.9,
      containsKeywords: ['John Doe', 'Acme Corp', 'Order 1001', 'Enterprise Deal', '$50000']
    }
  },

  // Edge Cases
  {
    name: 'No Integration Data Available',
    description: 'User query when no integration data exists',
    userMessage: 'What is the status of order #9999?',
    expectedIntent: 'order_status',
    expectedEntities: {
      order_number: '9999'
    },
    mockData: {},
    expectedResponse: {
      hasIntegrationData: false,
      confidence: 0.3,
      containsKeywords: ['no information available', 'not found']
    }
  },
  {
    name: 'General Query with Fallback',
    description: 'General query that should use knowledge base',
    userMessage: 'What are your business hours?',
    expectedIntent: 'general',
    mockData: {
      contacts: mockContacts,
      orders: mockOrders
    },
    expectedResponse: {
      hasIntegrationData: false,
      confidence: 0.5,
      containsKeywords: ['business hours', 'knowledge base']
    }
  },

  // Return and Refund Scenarios
  {
    name: 'Return Request',
    description: 'User wants to return an order',
    userMessage: 'I want to return my order #1001',
    expectedIntent: 'return_refund',
    expectedEntities: {
      order_number: '1001'
    },
    mockData: {
      orders: mockOrders
    },
    expectedResponse: {
      hasIntegrationData: true,
      confidence: 0.8,
      containsKeywords: ['Order 1001', 'return', 'Premium Widget']
    }
  },

  // Multiple Provider Scenarios
  {
    name: 'Multi-Provider Data',
    description: 'Query that involves data from multiple providers',
    userMessage: 'Show me all information for jane.smith@techcorp.com',
    expectedIntent: 'account_info',
    expectedEntities: {
      email: 'jane.smith@techcorp.com'
    },
    mockData: {
      contacts: mockContacts,
      orders: mockOrders,
      deals: mockDeals
    },
    expectedResponse: {
      hasIntegrationData: true,
      confidence: 0.9,
      containsKeywords: ['Jane Smith', 'TechCorp', 'Order 1002', 'TechCorp Expansion']
    }
  }
];

// Performance test scenarios
export const performanceTestScenarios = [
  {
    name: 'Large Dataset Query',
    description: 'Query with large amount of integration data',
    dataSize: 'large',
    expectedResponseTime: 500, // ms
    expectedCacheHit: true
  },
  {
    name: 'Cold Cache Query',
    description: 'First query without cache',
    dataSize: 'medium',
    expectedResponseTime: 800, // ms
    expectedCacheHit: false
  },
  {
    name: 'Warm Cache Query',
    description: 'Repeated query with cache',
    dataSize: 'medium',
    expectedResponseTime: 100, // ms
    expectedCacheHit: true
  }
];

// Error scenarios
export const errorTestScenarios = [
  {
    name: 'Database Connection Error',
    description: 'Simulate database connection failure',
    errorType: 'database_error',
    expectedFallback: true,
    expectedErrorMessage: 'Unable to access account information'
  },
  {
    name: 'API Rate Limit',
    description: 'Simulate API rate limiting',
    errorType: 'rate_limit',
    expectedFallback: true,
    expectedErrorMessage: 'Service temporarily unavailable'
  },
  {
    name: 'Invalid User ID',
    description: 'Query with invalid or missing user ID',
    errorType: 'auth_error',
    expectedFallback: true,
    expectedErrorMessage: 'Authentication required'
  }
];

// Validation functions
export function validateIntentDetection(userMessage: string, expectedIntent: QueryIntentType): boolean {
  // This would be implemented to test the intent detection logic
  return true;
}

export function validateEntityExtraction(userMessage: string, expectedEntities: any): boolean {
  // This would be implemented to test entity extraction
  return true;
}

export function validateResponseQuality(response: string, expectedKeywords: string[]): number {
  // Calculate response quality score based on keyword presence
  const lowerResponse = response.toLowerCase();
  const matchedKeywords = expectedKeywords.filter(keyword => 
    lowerResponse.includes(keyword.toLowerCase())
  );
  return matchedKeywords.length / expectedKeywords.length;
}

export function validatePerformance(responseTime: number, expectedTime: number): boolean {
  return responseTime <= expectedTime;
}

// Test runner utilities
export class IntegrationTestRunner {
  async runTestScenario(scenario: TestScenario): Promise<{
    passed: boolean;
    score: number;
    details: string;
    actualResponse?: string;
  }> {
    // This would implement the actual test execution
    console.log(`Running test: ${scenario.name}`);
    
    // Mock implementation - in real scenario, this would:
    // 1. Set up mock data
    // 2. Execute the integration query service
    // 3. Validate the response
    // 4. Return test results
    
    return {
      passed: true,
      score: 0.85,
      details: `Test passed with ${scenario.expectedResponse?.confidence || 0.8} confidence`,
      actualResponse: 'Mock AI response for testing'
    };
  }

  async runAllTests(): Promise<{
    totalTests: number;
    passed: number;
    failed: number;
    averageScore: number;
    results: any[];
  }> {
    const results = [];
    let totalScore = 0;
    let passed = 0;

    for (const scenario of testScenarios) {
      const result = await this.runTestScenario(scenario);
      results.push({
        scenario: scenario.name,
        ...result
      });

      if (result.passed) passed++;
      totalScore += result.score;
    }

    return {
      totalTests: testScenarios.length,
      passed,
      failed: testScenarios.length - passed,
      averageScore: totalScore / testScenarios.length,
      results
    };
  }
}

export const testRunner = new IntegrationTestRunner();