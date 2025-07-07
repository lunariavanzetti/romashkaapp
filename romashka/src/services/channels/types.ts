// Multi-Channel Communication System Types

export interface ChannelConfig {
  id: string;
  name: string;
  type: ChannelType;
  status: 'active' | 'inactive' | 'pending_setup';
  configuration: Record<string, any>;
  webhook_url?: string;
  webhook_secret?: string;
  api_credentials?: Record<string, any>;
  message_limit_per_day: number;
  messages_sent_today: number;
}

export type ChannelType = 'whatsapp' | 'messenger' | 'instagram' | 'email' | 'sms' | 'website';

export interface MessageContent {
  text?: string;
  media?: {
    type: 'image' | 'audio' | 'video' | 'document' | 'location';
    url: string;
    caption?: string;
  };
  quickReplies?: Array<{
    text: string;
    payload: string;
  }>;
  buttons?: Array<{
    text: string;
    url?: string;
    payload?: string;
  }>;
  template?: {
    name: string;
    parameters: any[];
  };
}

export interface ChannelCapabilities {
  supportsMedia: boolean;
  supportsQuickReplies: boolean;
  supportsTemplates: boolean;
  supportsTypingIndicator: boolean;
  supportsReadReceipts: boolean;
  maxMessageLength: number;
  supportedMediaTypes: string[];
  supportsButtons: boolean;
  supportsLocation: boolean;
}

export interface DeliveryStatus {
  messageId: string;
  externalMessageId?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: Date;
  errorDetails?: any;
}

export interface WebhookEvent {
  channelId: string;
  eventType: string;
  payload: any;
  timestamp: Date;
}

export interface CustomerIdentity {
  id?: string;
  email?: string;
  phone?: string;
  socialId?: string;
  name?: string;
  channels: ChannelType[];
}

export interface ConversationContext {
  conversationId: string;
  channelType: ChannelType;
  customerIdentity: CustomerIdentity;
  assignedAgentId?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  tags: string[];
}

export interface MessageTemplate {
  id: string;
  name: string;
  language: string;
  category: 'utility' | 'marketing' | 'authentication';
  templateContent: any;
  status: 'pending' | 'approved' | 'rejected';
  channelType: ChannelType;
  externalTemplateId?: string;
}

export interface RoutingRule {
  id: string;
  name: string;
  priority: number;
  conditions: Record<string, any>;
  targetChannelType: ChannelType;
  fallbackChannelType?: ChannelType;
  isActive: boolean;
}

// WhatsApp specific types
export interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  webhookSecret: string;
  businessAccountId: string;
}

export interface WhatsAppMessage {
  messaging_product: string;
  to: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'template';
  text?: { body: string };
  image?: { link: string; caption?: string };
  template?: {
    name: string;
    language: { code: string };
    components?: any[];
  };
}

// Messenger specific types
export interface MessengerConfig {
  pageAccessToken: string;
  appSecret: string;
  verifyToken: string;
  pageId: string;
}

export interface MessengerMessage {
  recipient: { id: string };
  message?: {
    text?: string;
    attachment?: {
      type: string;
      payload: { url?: string; template_type?: string };
    };
    quick_replies?: Array<{ content_type: string; title: string; payload: string }>;
  };
  sender_action?: 'typing_on' | 'typing_off' | 'mark_seen';
}

// Email specific types
export interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  imapHost: string;
  imapPort: number;
  supportEmail: string;
}

export interface EmailMessage {
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
}

// SMS specific types
export interface SMSConfig {
  provider: 'twilio' | 'messagebird' | 'vonage';
  apiKey: string;
  apiSecret: string;
  phoneNumber: string;
}

export interface SMSMessage {
  to: string;
  from: string;
  body: string;
  mediaUrl?: string[];
}

// Instagram specific types
export interface InstagramConfig {
  accessToken: string;
  appSecret: string;
  pageId: string;
}

export interface InstagramMessage {
  recipient_id: string;
  message?: {
    text?: string;
    attachment?: {
      type: string;
      payload: { url: string };
    };
  };
  sender_action?: 'typing_on' | 'typing_off' | 'mark_seen';
}

// Analytics types
export interface ChannelAnalytics {
  channelType: ChannelType;
  messageCount: number;
  responseTime: number;
  satisfactionScore: number;
  costPerMessage: number;
  deliveryRate: number;
  readRate: number;
}

export interface UnifiedConversation {
  id: string;
  customerIdentity: CustomerIdentity;
  channels: Array<{
    type: ChannelType;
    conversationId: string;
    lastMessage: Date;
    unreadCount: number;
  }>;
  assignedAgentId?: string;
  priority: string;
  tags: string[];
  lastActivity: Date;
  totalMessages: number;
} 