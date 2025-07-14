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
    filename?: string;
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
    language?: { code: string };
    components?: any[];
  };
  interactive?: {
    type: 'button' | 'list' | 'flow';
    header?: {
      type: 'text' | 'image' | 'video' | 'document';
      text?: string;
      image?: { link: string };
      video?: { link: string };
      document?: { link: string; filename: string };
    };
    body: {
      text: string;
    };
    footer?: {
      text: string;
    };
    action: {
      buttons?: Array<{
        type: 'reply';
        reply: {
          id: string;
          title: string;
        };
      }>;
      button?: string;
      sections?: Array<{
        title?: string;
        rows: Array<{
          id: string;
          title: string;
          description?: string;
        }>;
      }>;
    };
    selection?: any; // For incoming interactive message responses
  };
  location?: {
    longitude: number;
    latitude: number;
    name?: string;
    address?: string;
  };
  contacts?: Array<{
    addresses?: Array<{
      street?: string;
      city?: string;
      state?: string;
      zip?: string;
      country?: string;
      country_code?: string;
      type?: 'HOME' | 'WORK';
    }>;
    birthday?: string;
    emails?: Array<{
      email?: string;
      type?: 'HOME' | 'WORK';
    }>;
    name: {
      formatted_name: string;
      first_name?: string;
      last_name?: string;
      middle_name?: string;
      suffix?: string;
      prefix?: string;
    };
    org?: {
      company?: string;
      department?: string;
      title?: string;
    };
    phones?: Array<{
      phone?: string;
      type?: 'HOME' | 'WORK';
      wa_id?: string;
    }>;
    urls?: Array<{
      url?: string;
      type?: 'HOME' | 'WORK';
    }>;
  }>;
  reaction?: {
    messageId: string;
    emoji: string;
  };
  preview_url?: boolean;
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
  supportsInteractive?: boolean;
  supportsReactions?: boolean;
  supportsContacts?: boolean;
  supportsFlows?: boolean;
  supportsRichText?: boolean;
  supportsFiles?: boolean;
  supportsVoice?: boolean;
  supportsVideo?: boolean;
  supportsCarousel?: boolean;
  supportsScheduling?: boolean;
  supportsBroadcast?: boolean;
  supportsAnalytics?: boolean;
  supportsAutomation?: boolean;
  supportsAgentHandoff?: boolean;
  supportsCustomFields?: boolean;
  supportsTagging?: boolean;
  supportsTranslation?: boolean;
  supportsEncryption?: boolean;
  rateLimit?: {
    messages: number;
    period: string; // 'second', 'minute', 'hour', 'day'
  };
  messagingWindow?: {
    duration: number; // in hours
    type: 'session' | 'template_only' | 'unlimited';
  };
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
  id: string;
  phoneNumberId: string;
  accessToken: string;
  webhookSecret: string;
  businessAccountId: string;
  verifyToken?: string;
  apiVersion?: string;
  features?: {
    templates: boolean;
    interactive: boolean;
    reactions: boolean;
    businessProfile: boolean;
    analytics: boolean;
    automation: boolean;
  };
}

export interface WhatsAppMessage {
  messaging_product: string;
  to: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'template' | 'interactive' | 'location' | 'contacts' | 'reaction';
  text?: { body: string; preview_url?: boolean };
  image?: { link: string; caption?: string };
  video?: { link: string; caption?: string };
  audio?: { link: string };
  document?: { link: string; caption?: string; filename?: string };
  template?: {
    name: string;
    language: { code: string };
    components?: any[];
  };
  interactive?: {
    type: 'button' | 'list' | 'flow';
    header?: any;
    body: { text: string };
    footer?: { text: string };
    action: any;
  };
  location?: {
    longitude: number;
    latitude: number;
    name?: string;
    address?: string;
  };
  contacts?: any[];
  reaction?: {
    message_id: string;
    emoji: string;
  };
  recipient_type?: 'individual' | 'group';
}

export interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          context?: {
            from: string;
            id: string;
          };
          text?: {
            body: string;
          };
          image?: {
            caption?: string;
            mime_type: string;
            sha256: string;
            id: string;
          };
          video?: {
            caption?: string;
            filename?: string;
            mime_type: string;
            sha256: string;
            id: string;
          };
          audio?: {
            mime_type: string;
            sha256: string;
            id: string;
            voice?: boolean;
          };
          document?: {
            caption?: string;
            filename?: string;
            mime_type: string;
            sha256: string;
            id: string;
          };
          location?: {
            latitude: number;
            longitude: number;
            name?: string;
            address?: string;
          };
          contacts?: any[];
          interactive?: {
            type: string;
            button_reply?: {
              id: string;
              title: string;
            };
            list_reply?: {
              id: string;
              title: string;
              description?: string;
            };
          };
          reaction?: {
            message_id: string;
            emoji: string;
          };
          system?: {
            type: string;
            identity: string;
            customer: string;
          };
          button?: {
            text: string;
            payload: string;
          };
        }>;
        statuses?: Array<{
          id: string;
          status: 'sent' | 'delivered' | 'read' | 'failed';
          timestamp: string;
          recipient_id: string;
          conversation?: {
            id: string;
            expiration_timestamp?: string;
            origin?: {
              type: string;
            };
          };
          pricing?: {
            billable: boolean;
            pricing_model: string;
            category: string;
          };
          errors?: Array<{
            code: number;
            title: string;
            message: string;
            error_data?: {
              details: string;
            };
          }>;
        }>;
        errors?: Array<{
          code: number;
          title: string;
          message: string;
          error_data?: {
            details: string;
          };
        }>;
      };
      field: string;
    }>;
  }>;
}

export interface WhatsAppBusinessProfile {
  about?: string;
  address?: string;
  description?: string;
  email?: string;
  profile_picture_url?: string;
  websites?: string[];
  vertical?: string;
  messaging_product?: string;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  language: string;
  category: 'utility' | 'marketing' | 'authentication';
  status: 'pending' | 'approved' | 'rejected';
  components: Array<{
    type: 'header' | 'body' | 'footer' | 'button';
    format?: 'text' | 'media' | 'location' | 'document';
    text?: string;
    example?: {
      header_text?: string[];
      body_text?: string[][];
    };
    buttons?: Array<{
      type: 'quick_reply' | 'url' | 'phone_number';
      text: string;
      url?: string;
      phone_number?: string;
    }>;
  }>;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppAutomationRule {
  id: string;
  name: string;
  type: 'welcome' | 'out_of_hours' | 'keyword_trigger' | 'escalation' | 'follow_up' | 'intent_based' | 'behavior_trigger';
  conditions: {
    keywords?: string[];
    businessHours?: boolean;
    customerType?: 'new' | 'returning' | 'vip' | 'lead' | 'customer';
    messageCount?: number;
    timeWithoutResponse?: number; // in seconds
    sentiment?: 'positive' | 'negative' | 'neutral';
    intent?: string;
    customerScore?: number;
    previousInteractions?: number;
    channelHistory?: string[];
    timeOfDay?: {
      start: string;
      end: string;
    };
    dayOfWeek?: number[];
    customFields?: Record<string, any>;
  };
  action: {
    type: 'send_message' | 'send_template' | 'assign_agent' | 'add_tag' | 'schedule_followup' | 'escalate' | 'webhook' | 'api_call' | 'transfer_channel';
    message?: string;
    templateName?: string;
    templateParams?: any[];
    agentId?: string;
    agentRole?: string;
    tags?: string[];
    delay?: number; // in seconds
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    webhookUrl?: string;
    apiEndpoint?: string;
    targetChannel?: ChannelType;
    customData?: Record<string, any>;
  };
  isActive: boolean;
  priority: number;
  cooldown?: number; // in seconds to prevent rapid triggering
  maxExecutions?: number; // per conversation
  validFrom?: string;
  validUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppAnalytics {
  channelId: string;
  date: string;
  messagesSent: number;
  messagesReceived: number;
  messagesDelivered: number;
  messagesRead: number;
  messagesFailed: number;
  uniqueCustomers: number;
  newConversations: number;
  avgResponseTimeSeconds: number;
  templateMessagesSent: number;
  interactiveMessagesSent: number;
  mediaMessagesSent: number;
  locationMessagesSent: number;
  contactMessagesSent: number;
  reactionsSent: number;
  costPerMessage: number;
  totalCost: number;
  conversationRate: number;
  customerSatisfactionScore?: number;
  automationTriggered: number;
  humanHandoffs: number;
  escalations: number;
  topIntents: Array<{
    intent: string;
    count: number;
  }>;
  topKeywords: Array<{
    keyword: string;
    count: number;
  }>;
  peakHours: Array<{
    hour: number;
    messageCount: number;
  }>;
  customerBehavior: {
    averageMessagesPerCustomer: number;
    averageSessionDuration: number;
    returnRate: number;
    engagementRate: number;
  };
}

export interface WhatsAppCustomerProfile {
  id: string;
  channelId: string;
  customerPhone: string;
  customerName?: string;
  profilePicture?: string;
  totalMessagesSent: number;
  totalMessagesReceived: number;
  averageResponseTimeSeconds: number;
  lastInteractionAt: string;
  firstInteractionAt: string;
  preferences: {
    language?: string;
    timezone?: string;
    communicationFrequency?: 'low' | 'normal' | 'high';
    preferredMessageTypes?: string[];
    optedOutFrom?: string[];
  };
  tags: string[];
  score: number;
  leadScore?: number;
  customerType: 'new' | 'returning' | 'vip' | 'lead' | 'customer';
  lifecycle: 'prospect' | 'lead' | 'customer' | 'advocate' | 'inactive';
  customFields: Record<string, any>;
  conversationHistory: {
    totalConversations: number;
    averageMessagesPerConversation: number;
    lastTopics: string[];
    commonIntents: string[];
    satisfactionRatings: number[];
  };
  integrationData?: {
    crmId?: string;
    marketingId?: string;
    supportTicketIds?: string[];
    orderIds?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppConversationContext {
  id: string;
  conversationId: string;
  externalConversationId?: string;
  customerPhone: string;
  customerName?: string;
  customerProfilePicture?: string;
  lastMessageFromBusinessTimestamp?: string;
  lastMessageFromCustomerTimestamp?: string;
  isWithin24hWindow: boolean;
  conversationState: 'active' | 'paused' | 'closed' | 'transferred';
  currentIntent?: string;
  lastDetectedSentiment?: 'positive' | 'negative' | 'neutral';
  conversationSummary?: string;
  keyEntities?: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
  activeWorkflow?: {
    id: string;
    name: string;
    currentStep: number;
    data: Record<string, any>;
  };
  assignedAgentId?: string;
  escalationLevel?: number;
  metadata: {
    source?: string;
    campaign?: string;
    referrer?: string;
    customerType?: string;
    lastMessageType?: string;
    lastMessageContent?: string;
    interactionCount?: number;
    responseTime?: number;
    customData?: Record<string, any>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppLeadScoring {
  id: string;
  conversationId: string;
  customerPhone: string;
  interactionScore: number;
  engagementScore: number;
  intentScore: number;
  behaviorScore: number;
  timeScore: number;
  totalScore: number;
  scoringFactors: {
    messageType: string;
    hasHighIntentKeywords: boolean;
    responseTime: number;
    messageLength: number;
    mediaShared: boolean;
    questionsAsked: number;
    personalInfoShared: boolean;
    urgencyIndicators: boolean;
    emotionalEngagement: boolean;
    sessionDuration: number;
    repeatInteractions: number;
    customFactors?: Record<string, any>;
  };
  lastCalculatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppBusinessHours {
  id: string;
  channelId: string;
  dayOfWeek: number; // 0=Sunday, 1=Monday, etc.
  startTime: string;
  endTime: string;
  isActive: boolean;
  timezone: string;
  breakTimes?: Array<{
    startTime: string;
    endTime: string;
    description?: string;
  }>;
  holidays?: Array<{
    date: string;
    description?: string;
  }>;
  specialHours?: Array<{
    date: string;
    startTime: string;
    endTime: string;
    description?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppMediaAttachment {
  id: string;
  messageId: string;
  mediaType: 'image' | 'video' | 'audio' | 'document' | 'location';
  mediaUrl?: string;
  externalMediaId?: string;
  caption?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  thumbnail?: string;
  duration?: number; // for audio/video
  dimensions?: {
    width: number;
    height: number;
  };
  metadata?: {
    originalName?: string;
    uploadedBy?: string;
    quality?: string;
    compressionRatio?: number;
    customData?: Record<string, any>;
  };
  createdAt: string;
}

export interface WhatsAppInteractiveResponse {
  id: string;
  messageId: string;
  conversationId: string;
  responseType: 'button' | 'list' | 'quick_reply';
  responsePayload: {
    type: string;
    data: any;
    originalMessage: any;
  };
  customerSelection?: {
    id: string;
    title: string;
    description?: string;
    payload?: any;
  };
  responseTime: number; // time taken to respond in seconds
  followUpRequired: boolean;
  createdAt: string;
}

export interface WhatsAppWebhookEvent {
  id: string;
  channelId: string;
  eventType: string;
  payload: any;
  processed: boolean;
  processingError?: string;
  processingTime?: number;
  retryCount?: number;
  nextRetryAt?: string;
  metadata?: {
    source?: string;
    userId?: string;
    sessionId?: string;
    version?: string;
    customData?: Record<string, any>;
  };
  createdAt: string;
  processedAt?: string;
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