// Enterprise Integration Ecosystem Types
// This file defines all TypeScript interfaces for the integration system

export interface Integration {
  id: string;
  name: string;
  type: IntegrationType;
  provider: string;
  status: IntegrationStatus;
  configuration: Record<string, any>;
  credentials: Record<string, any>;
  sync_settings?: IntegrationSettings;
  last_sync_at?: string;
  sync_frequency: number;
  error_count: number;
  last_error?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type IntegrationType = 
  | 'crm' 
  | 'helpdesk' 
  | 'ecommerce' 
  | 'email_marketing' 
  | 'calendar' 
  | 'analytics';

export type IntegrationStatus = 
  | 'active' 
  | 'inactive' 
  | 'error' 
  | 'pending_setup';

export interface IntegrationSettings {
  syncDirection: 'inbound' | 'outbound' | 'bidirectional';
  syncFrequency: number; // seconds
  autoSync: boolean;
  conflictResolution: 'source_wins' | 'target_wins' | 'manual';
  batchSize: number;
}

export interface SyncJob {
  id: string;
  integration_id: string;
  job_type: 'full_sync' | 'incremental' | 'real_time';
  direction: 'inbound' | 'outbound' | 'bidirectional';
  status: 'pending' | 'running' | 'completed' | 'failed';
  records_processed: number;
  records_total: number;
  started_at?: string;
  completed_at?: string;
  error_details?: Record<string, any>;
  created_at: string;
}

export interface FieldMapping {
  id: string;
  integration_id: string;
  source_entity: string;
  target_entity: string;
  source_field: string;
  target_field: string;
  transformation_rule?: string;
  is_required: boolean;
  created_at: string;
}

export interface WebhookSubscription {
  id: string;
  integration_id: string;
  event_type: string;
  webhook_url: string;
  secret_key?: string;
  is_active: boolean;
  retry_count: number;
  timeout_seconds: number;
  last_triggered?: string;
  success_count: number;
  failure_count: number;
  created_at: string;
}

export interface CustomerSyncMapping {
  id: string;
  customer_profile_id: string;
  integration_id: string;
  external_id: string;
  external_entity_type: 'contact' | 'lead' | 'customer';
  last_synced_at: string;
  sync_status: 'synced' | 'pending' | 'error';
}

export interface WebhookLog {
  id: string;
  webhook_subscription_id: string;
  event_type: string;
  payload?: Record<string, any>;
  response_status?: number;
  response_body?: string;
  error_message?: string;
  processing_time_ms?: number;
  created_at: string;
}

export interface IntegrationAuditLog {
  id: string;
  integration_id: string;
  action: 'create' | 'update' | 'delete' | 'sync' | 'error';
  entity_type?: string;
  entity_id?: string;
  details?: Record<string, any>;
  created_at: string;
}

// CRM Integration Types
export interface Contact {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  company?: string;
  title?: string;
  lead_source?: string;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  title?: string;
  lead_source?: string;
  status?: string;
  score?: number;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  name: string;
  amount?: number;
  stage?: string;
  close_date?: string;
  contact_id?: string;
  lead_id?: string;
  probability?: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  subject: string;
  description?: string;
  due_date?: string;
  priority?: string;
  status?: string;
  contact_id?: string;
  deal_id?: string;
  created_at: string;
  updated_at: string;
}

// Help Desk Integration Types
export interface Ticket {
  id: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'pending' | 'resolved' | 'closed';
  assignee_id?: string;
  requester_id: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  author_id: string;
  body: string;
  is_public: boolean;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// E-commerce Integration Types
export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  total_amount: number;
  currency: string;
  status: string;
  items: OrderItem[];
  shipping_address?: Address;
  billing_address?: Address;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  sku?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  sku?: string;
  inventory_quantity?: number;
  status: 'active' | 'inactive' | 'draft';
  created_at: string;
  updated_at: string;
}

export interface Address {
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

// Calendar Integration Types
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  attendees?: string[];
  organizer_id: string;
  created_at: string;
  updated_at: string;
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
  available: boolean;
}

export interface AppointmentData {
  customer_id: string;
  agent_id: string;
  start_time: string;
  end_time: string;
  subject: string;
  description?: string;
  location?: string;
}

// Email Marketing Integration Types
export interface Subscriber {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  status: 'subscribed' | 'unsubscribed' | 'pending';
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent';
  list_id: string;
  scheduled_at?: string;
  sent_at?: string;
  created_at: string;
  updated_at: string;
}

// Integration Configuration Types
export interface IntegrationConfig {
  provider: string;
  credentials: Record<string, any>;
  settings: IntegrationSettings;
  fieldMappings: FieldMapping[];
  webhookConfig?: WebhookConfig;
}

export interface WebhookConfig {
  url: string;
  secret?: string;
  events: string[];
  retry_count?: number;
  timeout_seconds?: number;
}

export interface SyncResult {
  success: boolean;
  records_processed: number;
  records_total: number;
  errors?: string[];
  duration_ms: number;
  started_at: string;
  completed_at: string;
}

export interface IntegrationStatusInfo {
  id: string;
  status: IntegrationStatus;
  last_sync_at?: string;
  error_count: number;
  last_error?: string;
  sync_jobs_count: number;
  active_webhooks_count: number;
}

export interface DataConflict {
  id: string;
  entity_type: string;
  entity_id: string;
  source_value: any;
  target_value: any;
  field_name: string;
  conflict_type: 'field_mismatch' | 'duplicate' | 'validation_error';
  resolution?: 'source_wins' | 'target_wins' | 'manual';
}

export interface ConflictResolution {
  conflict_id: string;
  resolution: 'source_wins' | 'target_wins' | 'manual';
  resolved_value?: any;
  resolved_by: string;
  resolved_at: string;
}

// Provider-specific configuration types
export interface SalesforceConfig {
  instanceUrl: string;
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  securityToken: string;
}

export interface HubSpotConfig {
  apiKey: string;
  portalId: string;
  appId: string;
}

export interface ZendeskConfig {
  subdomain: string;
  email: string;
  apiToken: string;
}

export interface ShopifyConfig {
  shopDomain: string;
  accessToken: string;
  webhookSecret: string;
}

export interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  calendarId: string;
}

// Marketplace and UI Types
export interface IntegrationProvider {
  id: string;
  name: string;
  type: IntegrationType;
  description: string;
  logo_url: string;
  website_url: string;
  api_documentation_url: string;
  features: string[];
  pricing_tier: 'free' | 'basic' | 'premium' | 'enterprise';
  rating: number;
  review_count: number;
  is_popular: boolean;
  is_featured: boolean;
}

export interface IntegrationSetupStep {
  id: string;
  title: string;
  description: string;
  type: 'credentials' | 'configuration' | 'field_mapping' | 'webhook_setup' | 'testing';
  required: boolean;
  completed: boolean;
  fields?: SetupField[];
}

export interface SetupField {
  name: string;
  label: string;
  type: 'text' | 'password' | 'select' | 'checkbox' | 'url';
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: {
    pattern?: string;
    min_length?: number;
    max_length?: number;
  };
}

export interface IntegrationMetrics {
  integration_id: string;
  sync_success_rate: number;
  average_sync_duration: number;
  total_records_synced: number;
  error_rate: number;
  last_sync_status: 'success' | 'failed' | 'partial';
  webhook_success_rate: number;
  active_connections: number;
}

// API Response Types
export interface IntegrationListResponse {
  integrations: Integration[];
  total_count: number;
  page: number;
  page_size: number;
}

export interface SyncJobListResponse {
  sync_jobs: SyncJob[];
  total_count: number;
  page: number;
  page_size: number;
}

export interface WebhookLogListResponse {
  webhook_logs: WebhookLog[];
  total_count: number;
  page: number;
  page_size: number;
}

export interface IntegrationTestResponse {
  success: boolean;
  message: string;
  details?: Record<string, any>;
  connection_info?: {
    provider: string;
    api_version: string;
    rate_limits?: Record<string, any>;
  };
} 