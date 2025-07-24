/**
 * TypeScript interfaces for AI-Integration Bridge System
 * Defines all data structures for integration query service and AI enhancement
 */

// Re-export integration types from the main integrations file
export type { 
  Integration,
  IntegrationType,
  IntegrationStatus,
  Contact,
  Lead,
  Deal,
  Order,
  Product,
  User,
  SyncResult
} from './integrations';

// AI-specific integration data interfaces
export interface AIIntegrationContact {
  id: string;
  provider: 'shopify' | 'salesforce' | 'hubspot';
  external_id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  company?: string;
  title?: string;
  lead_source?: string;
  lifecycle_stage?: string;
  total_spent?: number;
  orders_count?: number;
  data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AIIntegrationOrder {
  id: string;
  provider: 'shopify' | 'salesforce' | 'hubspot';
  external_id: string;
  order_number?: string;
  customer_email?: string;
  customer_name?: string;
  total_amount?: number;
  currency?: string;
  status?: string;
  financial_status?: string;
  fulfillment_status?: string;
  tracking_number?: string;
  items?: AIOrderItem[];
  shipping_address?: AIAddress;
  billing_address?: AIAddress;
  data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AIOrderItem {
  id?: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  unit_price?: number;
  total_price?: number;
  sku?: string;
  variant_title?: string;
}

export interface AIAddress {
  first_name?: string;
  last_name?: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
  phone?: string;
}

export interface AIIntegrationProduct {
  id: string;
  provider: 'shopify' | 'salesforce' | 'hubspot';
  external_id: string;
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  sku?: string;
  inventory_quantity?: number;
  status?: string;
  product_type?: string;
  vendor?: string;
  tags?: string[];
  images?: string[];
  variants?: AIProductVariant[];
  data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AIProductVariant {
  id: string;
  title: string;
  price: number;
  sku?: string;
  inventory_quantity?: number;
  option1?: string;
  option2?: string;
  option3?: string;
}

export interface AIIntegrationDeal {
  id: string;
  provider: 'shopify' | 'salesforce' | 'hubspot';
  external_id: string;
  name: string;
  amount?: number;
  currency?: string;
  stage?: string;
  pipeline?: string;
  close_date?: string;
  probability?: number;
  deal_type?: string;
  lead_source?: string;
  contact_id?: string;
  contact_name?: string;
  contact_email?: string;
  company_name?: string;
  data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Query intent and context interfaces
export interface QueryIntent {
  type: QueryIntentType;
  confidence: number;
  keywords: string[];
  entities?: QueryEntities;
  context?: string;
}

export type QueryIntentType = 
  | 'order_status'
  | 'order_tracking' 
  | 'product_info'
  | 'product_availability'
  | 'pricing_info'
  | 'contact_info'
  | 'account_info'
  | 'deal_info'
  | 'deal_status'
  | 'payment_info'
  | 'shipping_info'
  | 'return_refund'
  | 'general';

export interface QueryEntities {
  order_number?: string;
  order_id?: string;
  email?: string;
  phone?: string;
  product_name?: string;
  product_sku?: string;
  deal_name?: string;
  deal_id?: string;
  contact_name?: string;
  company_name?: string;
  date_range?: {
    start?: string;
    end?: string;
  };
  amount_range?: {
    min?: number;
    max?: number;
  };
}

// Integration context for AI
export interface AIIntegrationContext {
  hasIntegrations: boolean;
  availableProviders: ('shopify' | 'salesforce' | 'hubspot')[];
  relevantData?: {
    contacts?: AIIntegrationContact[];
    orders?: AIIntegrationOrder[];
    products?: AIIntegrationProduct[];
    deals?: AIIntegrationDeal[];
  };
  queryIntent?: QueryIntent;
  summary?: string;
  confidence?: number;
  processingTime?: number;
  cacheHit?: boolean;
}

// Enhanced prompt interfaces
export interface EnhancedPromptRequest {
  userMessage: string;
  originalKnowledgeBase: string;
  integrationContext: AIIntegrationContext;
  agentTone?: string;
  businessType?: string;
  userId: string;
  conversationId?: string;
  messageHistory?: ChatMessageContext[];
}

export interface ChatMessageContext {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface EnhancedPromptResponse {
  enhancedSystemPrompt: string;
  enhancedUserPrompt: string;
  contextSummary: string;
  hasIntegrationData: boolean;
  dataSourcesUsed: string[];
  promptTokenCount?: number;
}

// AI response metadata
export interface AIResponseMetadata {
  agent_id: string;
  has_integration_data: boolean;
  confidence?: number;
  sources?: string[];
  integration_context?: string;
  query_intent?: QueryIntentType;
  providers_used?: string[];
  data_sources?: string[];
  processing_time_ms?: number;
  cache_hit?: boolean;
  fallback_response?: boolean;
  error?: boolean;
  error_details?: string;
}

// Cache interfaces
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
  userId: string;
  hitCount?: number;
}

export interface CacheStats {
  size: number;
  keys: string[];
  hitRate?: number;
  totalHits?: number;
  totalMisses?: number;
  oldestEntry?: string;
  newestEntry?: string;
}

// Integration query service interfaces
export interface IntegrationQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
  includeMetadata?: boolean;
  useCache?: boolean;
  timeout?: number;
}

export interface IntegrationQueryResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
  nextOffset?: number;
  fromCache: boolean;
  queryTime: number;
  sources: string[];
}

// Data formatting interfaces
export interface DataFormatter {
  formatForAI(data: any, queryType: QueryIntentType): string;
  formatForDisplay(data: any, queryType: QueryIntentType): string;
  sanitizeData(data: any, userId: string): any;
}

export interface FormattingOptions {
  maxItems?: number;
  includeDetails?: boolean;
  showProviderInfo?: boolean;
  showTimestamps?: boolean;
  showMetadata?: boolean;
  privacyLevel?: 'full' | 'partial' | 'minimal';
}

// Error handling interfaces
export interface IntegrationError {
  code: string;
  message: string;
  provider?: string;
  details?: Record<string, any>;
  timestamp: string;
  userId?: string;
  conversationId?: string;
}

export interface ErrorRecoveryStrategy {
  type: 'retry' | 'fallback' | 'skip' | 'escalate';
  maxRetries?: number;
  fallbackData?: any;
  escalationMessage?: string;
}

// Analytics and monitoring interfaces
export interface IntegrationAnalytics {
  queryCount: number;
  cacheHitRate: number;
  averageResponseTime: number;
  errorRate: number;
  popularIntents: Record<QueryIntentType, number>;
  providerUsage: Record<string, number>;
  userEngagement: {
    totalUsers: number;
    activeUsers: number;
    averageQueriesPerUser: number;
  };
}

export interface PerformanceMetrics {
  queryExecutionTime: number;
  dataFetchTime: number;
  promptEnhancementTime: number;
  aiResponseTime: number;
  totalProcessingTime: number;
  memoryUsage?: number;
  cacheOperations?: {
    hits: number;
    misses: number;
    writes: number;
  };
}

// Configuration interfaces
export interface AIIntegrationConfig {
  enabledProviders: ('shopify' | 'salesforce' | 'hubspot')[];
  cacheSettings: {
    ttl: number;
    maxSize: number;
    cleanupInterval: number;
  };
  querySettings: {
    timeout: number;
    maxRetries: number;
    batchSize: number;
  };
  aiSettings: {
    model: string;
    maxTokens: number;
    temperature: number;
    confidenceThreshold: number;
  };
  privacySettings: {
    enableDataFiltering: boolean;
    sensitiveFields: string[];
    retentionPeriod: number;
  };
}

// Webhook and real-time update interfaces
export interface IntegrationWebhookPayload {
  provider: string;
  event: string;
  data: Record<string, any>;
  timestamp: string;
  signature?: string;
}

export interface RealTimeUpdate {
  type: 'insert' | 'update' | 'delete';
  table: string;
  record: Record<string, any>;
  userId: string;
  timestamp: string;
}

// Testing and validation interfaces
export interface TestScenario {
  name: string;
  description: string;
  userMessage: string;
  expectedIntent: QueryIntentType;
  expectedEntities?: QueryEntities;
  mockData?: {
    contacts?: AIIntegrationContact[];
    orders?: AIIntegrationOrder[];
    products?: AIIntegrationProduct[];
    deals?: AIIntegrationDeal[];
  };
  expectedResponse?: {
    hasIntegrationData: boolean;
    confidence: number;
    containsKeywords: string[];
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score?: number;
}

// Export utility types
export type IntegrationProvider = 'shopify' | 'salesforce' | 'hubspot';
export type IntegrationDataType = 'contacts' | 'orders' | 'products' | 'deals';
export type CacheKeyType = 'user' | 'query' | 'data' | 'integration';

// Helper type for dynamic data access
export type IntegrationDataMap = {
  contacts: AIIntegrationContact;
  orders: AIIntegrationOrder;
  products: AIIntegrationProduct;
  deals: AIIntegrationDeal;
};

// Union types for all integration data
export type AnyIntegrationData = 
  | AIIntegrationContact 
  | AIIntegrationOrder 
  | AIIntegrationProduct 
  | AIIntegrationDeal;

export type IntegrationDataArray = {
  contacts?: AIIntegrationContact[];
  orders?: AIIntegrationOrder[];
  products?: AIIntegrationProduct[];
  deals?: AIIntegrationDeal[];
};