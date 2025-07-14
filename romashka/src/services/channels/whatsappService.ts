import { BaseChannelService } from './baseChannelService';
import type { 
  ChannelType, 
  MessageContent, 
  DeliveryStatus, 
  ChannelCapabilities,
  CustomerIdentity,
  ConversationContext,
  WhatsAppConfig,
  WhatsAppMessage
} from './types';
import crypto from 'crypto';

export interface WhatsAppInteractiveMessage {
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
}

export interface WhatsAppTemplateMessage {
  name: string;
  language: {
    code: string;
  };
  components?: Array<{
    type: 'header' | 'body' | 'footer' | 'button';
    parameters?: Array<{
      type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
      text?: string;
      currency?: {
        fallback_value: string;
        code: string;
        amount_1000: number;
      };
      date_time?: {
        fallback_value: string;
      };
      image?: { link: string };
      document?: { link: string; filename: string };
      video?: { link: string };
    }>;
  }>;
}

export interface WhatsAppLocationMessage {
  longitude: number;
  latitude: number;
  name?: string;
  address?: string;
}

export interface WhatsAppContactMessage {
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
}

export interface WhatsAppAutomationRule {
  id: string;
  name: string;
  type: 'welcome' | 'out_of_hours' | 'keyword_trigger' | 'escalation' | 'follow_up';
  conditions: {
    keywords?: string[];
    businessHours?: boolean;
    customerType?: string;
    messageCount?: number;
    timeWithoutResponse?: number;
    sentiment?: 'positive' | 'negative' | 'neutral';
  };
  action: {
    type: 'send_message' | 'assign_agent' | 'add_tag' | 'schedule_followup' | 'escalate';
    message?: string;
    templateName?: string;
    agentId?: string;
    tags?: string[];
    delay?: number;
  };
  isActive: boolean;
  priority: number;
}

export class WhatsAppService extends BaseChannelService {
  protected config: WhatsAppConfig;
  private apiUrl = 'https://graph.facebook.com/v18.0';
  private automationRules: WhatsAppAutomationRule[] = [];
  private businessHours: any = {};

  constructor(config: WhatsAppConfig) {
    super('whatsapp', config);
    this.config = config;
    this.loadAutomationRules();
    this.loadBusinessHours();
  }

  getCapabilities(): ChannelCapabilities {
    return {
      supportsMedia: true,
      supportsQuickReplies: true,
      supportsTemplates: true,
      supportsTypingIndicator: true,
      supportsReadReceipts: true,
      maxMessageLength: 4096,
      supportedMediaTypes: ['image', 'audio', 'video', 'document', 'location', 'contact'],
      supportsButtons: true,
      supportsLocation: true,
      supportsInteractive: true,
      supportsReactions: true
    };
  }

  // Enhanced message sending with all message types
  async sendMessage(
    to: string, 
    content: MessageContent, 
    context?: ConversationContext
  ): Promise<string> {
    await this.validateConfig();
    await this.checkRateLimit();

    try {
      let message: any = {
        messaging_product: 'whatsapp',
        to: to,
        recipient_type: 'individual'
      };

      // Handle different message types
      if (content.template) {
        message.type = 'template';
        message.template = this.buildTemplateMessage(content.template);
      } else if (content.interactive) {
        message.type = 'interactive';
        message.interactive = this.buildInteractiveMessage(content.interactive);
      } else if (content.location) {
        message.type = 'location';
        message.location = content.location;
      } else if (content.contacts) {
        message.type = 'contacts';
        message.contacts = content.contacts;
      } else if (content.media) {
        message.type = content.media.type;
        message[content.media.type] = {
          link: content.media.url,
          caption: content.media.caption,
          filename: content.media.filename
        };
      } else if (content.reaction) {
        message.type = 'reaction';
        message.reaction = {
          message_id: content.reaction.messageId,
          emoji: content.reaction.emoji
        };
      } else {
        message.type = 'text';
        message.text = { 
          body: this.formatTextMessage(content.text || ''),
          preview_url: content.preview_url || false
        };
      }

      // Set typing indicator
      await this.setTypingIndicator(to, 'typing_on');

      const response = await fetch(`${this.apiUrl}/${this.config.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      // Turn off typing indicator
      await this.setTypingIndicator(to, 'typing_off');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`WhatsApp API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      const messageId = result.messages?.[0]?.id;

      if (!messageId) {
        throw new Error('No message ID returned from WhatsApp API');
      }

      // Save message to database with enhanced tracking
      if (context) {
        await this.saveMessageWithMetadata(context.conversationId, content, false, messageId, {
          whatsappMessageId: messageId,
          messageType: message.type,
          businessInitiated: true,
          cost: this.calculateMessageCost(message.type, content),
          features: this.extractMessageFeatures(content)
        });
      }

      await this.incrementMessageCount();
      await this.updateDeliveryStatus(messageId, 'sent', messageId);
      await this.trackAnalytics('message_sent', { messageType: message.type, to });

      return messageId;
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error);
      await this.logError('send_message_error', error, { to, content });
      throw error;
    }
  }

  // Enhanced webhook handler with comprehensive message processing
  async handleWebhook(payload: any, headers?: any): Promise<void> {
    try {
      // Validate webhook signature
      if (headers && !await this.validateWebhookSignature(JSON.stringify(payload), headers['x-hub-signature-256'] || '')) {
        throw new Error('Invalid webhook signature');
      }

      await this.logWebhookEvent('webhook_received', payload);

      const entry = payload.entry?.[0];
      if (!entry) return;

      const changes = entry.changes?.[0];
      if (!changes || changes.value?.messaging_product !== 'whatsapp') return;

      const messages = changes.value?.messages || [];
      const statuses = changes.value?.statuses || [];

      // Process incoming messages
      for (const message of messages) {
        await this.processIncomingMessage(message);
      }

      // Process delivery status updates
      for (const status of statuses) {
        await this.processStatusUpdate(status);
      }

      await this.logWebhookEvent('webhook_processed', { 
        messagesProcessed: messages.length,
        statusesProcessed: statuses.length
      });
    } catch (error) {
      console.error('Failed to handle WhatsApp webhook:', error);
      await this.logWebhookEvent('webhook_error', { 
        error: error instanceof Error ? error.message : String(error),
        payload 
      });
      throw error;
    }
  }

  // Enhanced incoming message processing with automation
  private async processIncomingMessage(message: any): Promise<void> {
    try {
      const customerIdentity: CustomerIdentity = {
        socialId: message.from,
        phone: message.from,
        channels: ['whatsapp']
      };

      // Get or create customer profile
      const customerProfile = await this.getOrCreateCustomerProfile(customerIdentity);

      // Find or create conversation
      const conversationId = await this.findOrCreateConversation(
        customerIdentity,
        message.from
      );

      // Process message content based on type
      const content = await this.extractMessageContent(message);
      
      // Save message to database
      const messageId = await this.saveMessageWithMetadata(conversationId, content, true, message.id, {
        whatsappMessageId: message.id,
        messageType: message.type,
        businessInitiated: false,
        customerProfile,
        timestamp: new Date(message.timestamp * 1000)
      });

      // Mark WhatsApp message as read
      await this.markMessageAsRead(message.id);

      // Update conversation context and analytics
      await this.updateConversationContext(conversationId, message, content);
      await this.updateCustomerBehavior(customerProfile.phone, content);
      await this.trackAnalytics('message_received', { messageType: message.type, from: message.from });

      // Apply business automation rules
      await this.applyAutomationRules(conversationId, message, content, customerProfile);

      // Update lead scoring
      await this.updateLeadScoring(conversationId, message, content);

      // Trigger AI response if no automation rule matched
      if (await this.shouldTriggerAIResponse(conversationId, message, content)) {
        await this.triggerAIResponse(conversationId, content, customerProfile);
      }

    } catch (error) {
      console.error('Failed to process incoming message:', error);
      await this.logError('process_message_error', error, { message });
    }
  }

  // Business automation rules processing
  private async applyAutomationRules(
    conversationId: string, 
    message: any, 
    content: MessageContent, 
    customerProfile: any
  ): Promise<boolean> {
    try {
      const activeRules = this.automationRules.filter(rule => rule.isActive)
        .sort((a, b) => b.priority - a.priority);

      for (const rule of activeRules) {
        if (await this.evaluateRuleConditions(rule, message, content, customerProfile)) {
          await this.executeRuleAction(rule, conversationId, message, content, customerProfile);
          await this.trackRuleUsage(rule.id);
          return true; // Rule matched and executed
        }
      }

      return false; // No rule matched
    } catch (error) {
      console.error('Failed to apply automation rules:', error);
      return false;
    }
  }

  // Evaluate automation rule conditions
  private async evaluateRuleConditions(
    rule: WhatsAppAutomationRule,
    message: any,
    content: MessageContent,
    customerProfile: any
  ): Promise<boolean> {
    const conditions = rule.conditions;

    // Check business hours
    if (conditions.businessHours !== undefined) {
      const isBusinessHours = await this.isBusinessHours();
      if (conditions.businessHours !== isBusinessHours) {
        return false;
      }
    }

    // Check keywords
    if (conditions.keywords && conditions.keywords.length > 0) {
      const messageText = content.text?.toLowerCase() || '';
      const hasKeyword = conditions.keywords.some(keyword => 
        messageText.includes(keyword.toLowerCase())
      );
      if (!hasKeyword) {
        return false;
      }
    }

    // Check customer type
    if (conditions.customerType) {
      const customerType = customerProfile.metadata?.customerType || 'new';
      if (conditions.customerType !== customerType) {
        return false;
      }
    }

    // Check message count
    if (conditions.messageCount !== undefined) {
      const messageCount = await this.getConversationMessageCount(message.from);
      if (messageCount < conditions.messageCount) {
        return false;
      }
    }

    // Check time without response
    if (conditions.timeWithoutResponse !== undefined) {
      const lastBusinessMessageTime = await this.getLastBusinessMessageTime(message.from);
      const timeSinceLastMessage = Date.now() - lastBusinessMessageTime;
      if (timeSinceLastMessage < conditions.timeWithoutResponse * 1000) {
        return false;
      }
    }

    // Check sentiment
    if (conditions.sentiment) {
      const sentiment = await this.analyzeSentiment(content.text || '');
      if (sentiment !== conditions.sentiment) {
        return false;
      }
    }

    return true;
  }

  // Execute automation rule action
  private async executeRuleAction(
    rule: WhatsAppAutomationRule,
    conversationId: string,
    message: any,
    content: MessageContent,
    customerProfile: any
  ): Promise<void> {
    const action = rule.action;

    switch (action.type) {
      case 'send_message':
        if (action.message) {
          await this.sendMessage(message.from, { text: action.message });
        } else if (action.templateName) {
          await this.sendTemplateMessage(message.from, action.templateName, []);
        }
        break;

      case 'assign_agent':
        if (action.agentId) {
          await this.assignConversationToAgent(conversationId, action.agentId);
        }
        break;

      case 'add_tag':
        if (action.tags) {
          await this.addConversationTags(conversationId, action.tags);
        }
        break;

      case 'schedule_followup':
        if (action.delay && action.message) {
          await this.scheduleFollowUp(conversationId, action.message, action.delay);
        }
        break;

      case 'escalate':
        await this.escalateConversation(conversationId, rule.name);
        break;
    }
  }

  // Enhanced template message handling
  async sendTemplateMessage(
    to: string,
    templateName: string,
    parameters: any[],
    context?: ConversationContext
  ): Promise<string> {
    try {
      const template = await this.getApprovedTemplate(templateName);
      if (!template) {
        throw new Error(`Template '${templateName}' not found or not approved`);
      }

      const templateMessage: WhatsAppTemplateMessage = {
        name: templateName,
        language: { code: template.language },
        components: this.buildTemplateComponents(template, parameters)
      };

      const result = await this.sendMessage(to, { template: templateMessage }, context);
      await this.trackTemplateUsage(templateName);
      return result;
    } catch (error) {
      console.error('Failed to send template message:', error);
      throw error;
    }
  }

  // Interactive message handling
  async sendInteractiveMessage(
    to: string,
    interactive: WhatsAppInteractiveMessage,
    context?: ConversationContext
  ): Promise<string> {
    try {
      const result = await this.sendMessage(to, { interactive }, context);
      await this.trackInteractiveMessageSent(interactive.type);
      return result;
    } catch (error) {
      console.error('Failed to send interactive message:', error);
      throw error;
    }
  }

  // Location message handling
  async sendLocationMessage(
    to: string,
    location: WhatsAppLocationMessage,
    context?: ConversationContext
  ): Promise<string> {
    try {
      return await this.sendMessage(to, { location }, context);
    } catch (error) {
      console.error('Failed to send location message:', error);
      throw error;
    }
  }

  // Contact message handling
  async sendContactMessage(
    to: string,
    contacts: WhatsAppContactMessage[],
    context?: ConversationContext
  ): Promise<string> {
    try {
      return await this.sendMessage(to, { contacts }, context);
    } catch (error) {
      console.error('Failed to send contact message:', error);
      throw error;
    }
  }

  // Reaction handling
  async sendReaction(
    to: string,
    messageId: string,
    emoji: string,
    context?: ConversationContext
  ): Promise<string> {
    try {
      return await this.sendMessage(to, { 
        reaction: { messageId, emoji } 
      }, context);
    } catch (error) {
      console.error('Failed to send reaction:', error);
      throw error;
    }
  }

  // Business profile management
  async updateBusinessProfile(profileData: {
    about?: string;
    address?: string;
    description?: string;
    email?: string;
    profile_picture_url?: string;
    websites?: string[];
    vertical?: string;
  }): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/${this.config.phoneNumberId}/whatsapp_business_profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to update business profile:', error);
      return false;
    }
  }

  // Get business profile
  async getBusinessProfile(): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/${this.config.phoneNumberId}/whatsapp_business_profile?fields=about,address,description,email,profile_picture_url,websites,vertical`, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get business profile: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get business profile:', error);
      throw error;
    }
  }

  // Enhanced analytics and monitoring
  async getAnalytics(startDate: Date, endDate: Date): Promise<any> {
    try {
      const { supabase } = await import('../supabaseClient');
      if (!supabase) throw new Error('Supabase client not available');

      const { data: analytics } = await supabase
        .from('whatsapp_analytics')
        .select('*')
        .eq('channel_id', this.config.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      return this.processAnalyticsData(analytics || []);
    } catch (error) {
      console.error('Failed to get analytics:', error);
      throw error;
    }
  }

  // Message cost calculation
  private calculateMessageCost(messageType: string, content: MessageContent): number {
    // WhatsApp Business API pricing (these are example rates)
    const rates = {
      text: 0.005,
      template: 0.015,
      interactive: 0.01,
      media: 0.01,
      location: 0.005,
      contact: 0.005,
      reaction: 0.002
    };

    return rates[messageType as keyof typeof rates] || 0.005;
  }

  // Enhanced text formatting with emoji and markdown support
  private formatTextMessage(text: string): string {
    // Convert markdown-style formatting to WhatsApp formatting
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '*$1*') // Bold
      .replace(/__(.*?)__/g, '_$1_') // Italic
      .replace(/~~(.*?)~~/g, '~$1~') // Strikethrough
      .replace(/```(.*?)```/g, '```$1```'); // Code

    return formatted;
  }

  // Load automation rules from database
  private async loadAutomationRules(): Promise<void> {
    try {
      const { supabase } = await import('../supabaseClient');
      if (!supabase) return;

      const { data: rules } = await supabase
        .from('whatsapp_automation_rules')
        .select('*')
        .eq('channel_id', this.config.id)
        .eq('is_active', true)
        .order('priority', { ascending: false });

      this.automationRules = rules || [];
    } catch (error) {
      console.error('Failed to load automation rules:', error);
    }
  }

  // Load business hours from database
  private async loadBusinessHours(): Promise<void> {
    try {
      const { supabase } = await import('../supabaseClient');
      if (!supabase) return;

      const { data: hours } = await supabase
        .from('whatsapp_business_hours')
        .select('*')
        .eq('channel_id', this.config.id)
        .eq('is_active', true);

      this.businessHours = (hours || []).reduce((acc, hour) => {
        acc[hour.day_of_week] = {
          start: hour.start_time,
          end: hour.end_time,
          timezone: hour.timezone
        };
        return acc;
      }, {});
    } catch (error) {
      console.error('Failed to load business hours:', error);
    }
  }

  // Check if current time is within business hours
  private async isBusinessHours(): Promise<boolean> {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentTime = now.toTimeString().slice(0, 8);

    const todayHours = this.businessHours[dayOfWeek];
    if (!todayHours) return false;

    return currentTime >= todayHours.start && currentTime <= todayHours.end;
  }

  // Track analytics events
  private async trackAnalytics(eventType: string, data: any): Promise<void> {
    try {
      const { supabase } = await import('../supabaseClient');
      if (!supabase) return;

      const today = new Date().toISOString().split('T')[0];

      // Update daily analytics
      await supabase.rpc('update_whatsapp_analytics', {
        p_channel_id: this.config.id,
        p_date: today,
        p_event_type: eventType,
        p_data: data
      });
    } catch (error) {
      console.error('Failed to track analytics:', error);
    }
  }

  // Enhanced error logging
  private async logError(errorType: string, error: any, context?: any): Promise<void> {
    try {
      const { supabase } = await import('../supabaseClient');
      if (!supabase) return;

      await supabase.from('webhook_events').insert({
        channel_id: this.config.id,
        event_type: errorType,
        payload: {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          context
        },
        processed: false
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  // Helper methods for database operations
  private async getOrCreateCustomerProfile(identity: CustomerIdentity): Promise<any> {
    try {
      const { supabase } = await import('../supabaseClient');
      if (!supabase) throw new Error('Supabase client not available');

      let { data: profile } = await supabase
        .from('whatsapp_customer_behavior')
        .select('*')
        .eq('channel_id', this.config.id)
        .eq('customer_phone', identity.phone)
        .single();

      if (!profile) {
        const { data: newProfile } = await supabase
          .from('whatsapp_customer_behavior')
          .insert({
            channel_id: this.config.id,
            customer_phone: identity.phone,
            total_messages_sent: 0,
            total_messages_received: 0,
            last_interaction_at: new Date().toISOString(),
            preferences: {},
            tags: [],
            score: 0
          })
          .select('*')
          .single();

        profile = newProfile;
      }

      return profile;
    } catch (error) {
      console.error('Failed to get/create customer profile:', error);
      throw error;
    }
  }

  private async saveMessageWithMetadata(
    conversationId: string,
    content: MessageContent,
    isFromCustomer: boolean,
    externalMessageId?: string,
    metadata?: any
  ): Promise<string> {
    try {
      const { supabase } = await import('../supabaseClient');
      if (!supabase) throw new Error('Supabase client not available');

      const { data: message } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content: content.text || JSON.stringify(content),
          role: isFromCustomer ? 'user' : 'assistant',
          channel_type: this.channelType,
          external_message_id: externalMessageId,
          message_type: this.getMessageType(content),
          media_url: content.media?.url,
          media_caption: content.media?.caption,
          delivery_status: isFromCustomer ? 'delivered' : 'sent',
          metadata: metadata || {}
        })
        .select('id')
        .single();

      if (!message) throw new Error('Failed to save message');

      // Save media attachments if present
      if (content.media) {
        await this.saveMediaAttachment(message.id, content.media);
      }

      // Save interactive responses if present
      if (content.interactive) {
        await this.saveInteractiveResponse(message.id, conversationId, content.interactive);
      }

      return message.id;
    } catch (error) {
      console.error('Failed to save message with metadata:', error);
      throw error;
    }
  }

  private getMessageType(content: MessageContent): string {
    if (content.template) return 'template';
    if (content.interactive) return 'interactive';
    if (content.location) return 'location';
    if (content.contacts) return 'contact';
    if (content.reaction) return 'reaction';
    if (content.media) return content.media.type;
    return 'text';
  }

  private async saveMediaAttachment(messageId: string, media: any): Promise<void> {
    try {
      const { supabase } = await import('../supabaseClient');
      if (!supabase) return;

      await supabase.from('whatsapp_media_attachments').insert({
        message_id: messageId,
        media_type: media.type,
        media_url: media.url,
        external_media_id: media.id,
        caption: media.caption,
        file_name: media.filename,
        file_size: media.file_size,
        mime_type: media.mime_type
      });
    } catch (error) {
      console.error('Failed to save media attachment:', error);
    }
  }

  private async saveInteractiveResponse(messageId: string, conversationId: string, interactive: any): Promise<void> {
    try {
      const { supabase } = await import('../supabaseClient');
      if (!supabase) return;

      await supabase.from('whatsapp_interactive_responses').insert({
        message_id: messageId,
        conversation_id: conversationId,
        response_type: interactive.type,
        response_payload: interactive,
        customer_selection: null
      });
    } catch (error) {
      console.error('Failed to save interactive response:', error);
    }
  }

  private async extractMessageContent(message: any): Promise<MessageContent> {
    const content: MessageContent = {};

    switch (message.type) {
      case 'text':
        content.text = message.text?.body || '';
        break;
      case 'image':
        content.media = {
          type: 'image',
          url: await this.getMediaUrl(message.image.id),
          caption: message.image.caption
        };
        break;
      case 'video':
        content.media = {
          type: 'video',
          url: await this.getMediaUrl(message.video.id),
          caption: message.video.caption
        };
        break;
      case 'audio':
        content.media = {
          type: 'audio',
          url: await this.getMediaUrl(message.audio.id)
        };
        break;
      case 'document':
        content.media = {
          type: 'document',
          url: await this.getMediaUrl(message.document.id),
          caption: message.document.caption,
          filename: message.document.filename
        };
        break;
      case 'location':
        content.location = {
          latitude: message.location.latitude,
          longitude: message.location.longitude,
          name: message.location.name,
          address: message.location.address
        };
        break;
      case 'contacts':
        content.contacts = message.contacts;
        break;
      case 'interactive':
        content.interactive = {
          type: message.interactive.type,
          selection: message.interactive.button_reply || message.interactive.list_reply
        };
        break;
      case 'reaction':
        content.reaction = {
          messageId: message.reaction.message_id,
          emoji: message.reaction.emoji
        };
        break;
      default:
        content.text = message.text?.body || '';
    }

    return content;
  }

  private buildTemplateMessage(template: any): WhatsAppTemplateMessage {
    return {
      name: template.name,
      language: template.language,
      components: template.components || []
    };
  }

  private buildInteractiveMessage(interactive: any): WhatsAppInteractiveMessage {
    return {
      type: interactive.type,
      header: interactive.header,
      body: interactive.body,
      footer: interactive.footer,
      action: interactive.action
    };
  }

  private buildTemplateComponents(template: any, parameters: any[]): any[] {
    // Build template components based on template structure and parameters
    return template.components || [];
  }

  private async getApprovedTemplate(templateName: string): Promise<any> {
    try {
      const { supabase } = await import('../supabaseClient');
      if (!supabase) return null;

      const { data: template } = await supabase
        .from('whatsapp_message_templates')
        .select('*')
        .eq('channel_id', this.config.id)
        .eq('name', templateName)
        .eq('status', 'approved')
        .single();

      return template;
    } catch (error) {
      console.error('Failed to get approved template:', error);
      return null;
    }
  }

  private async trackTemplateUsage(templateName: string): Promise<void> {
    try {
      const { supabase } = await import('../supabaseClient');
      if (!supabase) return;

      await supabase
        .from('whatsapp_message_templates')
        .update({ usage_count: supabase.sql`usage_count + 1` })
        .eq('channel_id', this.config.id)
        .eq('name', templateName);
    } catch (error) {
      console.error('Failed to track template usage:', error);
    }
  }

  private async trackInteractiveMessageSent(type: string): Promise<void> {
    await this.trackAnalytics('interactive_message_sent', { type });
  }

  private async trackRuleUsage(ruleId: string): Promise<void> {
    try {
      const { supabase } = await import('../supabaseClient');
      if (!supabase) return;

      await supabase
        .from('whatsapp_automation_rules')
        .update({ usage_count: supabase.sql`usage_count + 1` })
        .eq('id', ruleId);
    } catch (error) {
      console.error('Failed to track rule usage:', error);
    }
  }

  private async updateConversationContext(conversationId: string, message: any, content: MessageContent): Promise<void> {
    try {
      const { supabase } = await import('../supabaseClient');
      if (!supabase) return;

      await supabase
        .from('whatsapp_conversations')
        .upsert({
          conversation_id: conversationId,
          external_conversation_id: message.from,
          customer_phone: message.from,
          last_message_from_customer_timestamp: new Date().toISOString(),
          is_within_24h_window: true,
          conversation_state: 'active',
          metadata: {
            lastMessageType: message.type,
            lastMessageContent: content.text || '',
            customerName: message.profile?.name || ''
          }
        });
    } catch (error) {
      console.error('Failed to update conversation context:', error);
    }
  }

  private async updateCustomerBehavior(phone: string, content: MessageContent): Promise<void> {
    try {
      const { supabase } = await import('../supabaseClient');
      if (!supabase) return;

      await supabase
        .from('whatsapp_customer_behavior')
        .update({
          total_messages_received: supabase.sql`total_messages_received + 1`,
          last_interaction_at: new Date().toISOString()
        })
        .eq('channel_id', this.config.id)
        .eq('customer_phone', phone);
    } catch (error) {
      console.error('Failed to update customer behavior:', error);
    }
  }

  private async updateLeadScoring(conversationId: string, message: any, content: MessageContent): Promise<void> {
    try {
      const { supabase } = await import('../supabaseClient');
      if (!supabase) return;

      // Calculate scores based on message content and behavior
      const interactionScore = this.calculateInteractionScore(message, content);
      const engagementScore = this.calculateEngagementScore(message, content);
      const intentScore = await this.calculateIntentScore(content);

      const totalScore = interactionScore + engagementScore + intentScore;

      await supabase
        .from('whatsapp_lead_scoring')
        .upsert({
          conversation_id: conversationId,
          customer_phone: message.from,
          interaction_score: interactionScore,
          engagement_score: engagementScore,
          intent_score: intentScore,
          total_score: totalScore,
          scoring_factors: {
            messageType: message.type,
            hasKeywords: this.hasHighIntentKeywords(content.text || ''),
            responseTime: Date.now() - (message.timestamp * 1000),
            messageLength: content.text?.length || 0
          },
          last_calculated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to update lead scoring:', error);
    }
  }

  private calculateInteractionScore(message: any, content: MessageContent): number {
    let score = 10; // Base score for any interaction

    // Bonus for different message types
    switch (message.type) {
      case 'text':
        score += 5;
        break;
      case 'image':
      case 'video':
        score += 15;
        break;
      case 'audio':
        score += 20;
        break;
      case 'document':
        score += 25;
        break;
      case 'location':
        score += 30;
        break;
      case 'contact':
        score += 35;
        break;
      case 'interactive':
        score += 40;
        break;
    }

    // Bonus for message length (indicates engagement)
    const textLength = content.text?.length || 0;
    if (textLength > 50) score += 5;
    if (textLength > 100) score += 10;
    if (textLength > 200) score += 15;

    return Math.min(score, 100);
  }

  private calculateEngagementScore(message: any, content: MessageContent): number {
    let score = 0;

    // Check for questions (high engagement)
    if (content.text?.includes('?')) score += 20;

    // Check for emotional indicators
    const emotionalWords = ['love', 'hate', 'excited', 'frustrated', 'happy', 'sad', 'angry', 'pleased'];
    const hasEmotionalWords = emotionalWords.some(word => 
      content.text?.toLowerCase().includes(word)
    );
    if (hasEmotionalWords) score += 15;

    // Check for urgency indicators
    const urgencyWords = ['urgent', 'asap', 'immediately', 'quickly', 'now', 'emergency'];
    const hasUrgency = urgencyWords.some(word => 
      content.text?.toLowerCase().includes(word)
    );
    if (hasUrgency) score += 25;

    // Check for personal information sharing
    const personalIndicators = ['my name is', 'i am', 'i work', 'i live', 'my email', 'my phone'];
    const hasPersonalInfo = personalIndicators.some(phrase => 
      content.text?.toLowerCase().includes(phrase)
    );
    if (hasPersonalInfo) score += 30;

    return Math.min(score, 100);
  }

  private async calculateIntentScore(content: MessageContent): number {
    let score = 0;

    // High-intent keywords
    const buyingKeywords = ['buy', 'purchase', 'price', 'cost', 'how much', 'order', 'payment'];
    const supportKeywords = ['help', 'problem', 'issue', 'support', 'broken', 'not working'];
    const infoKeywords = ['information', 'details', 'features', 'specs', 'demo', 'trial'];

    const text = content.text?.toLowerCase() || '';

    if (buyingKeywords.some(keyword => text.includes(keyword))) score += 40;
    if (supportKeywords.some(keyword => text.includes(keyword))) score += 30;
    if (infoKeywords.some(keyword => text.includes(keyword))) score += 20;

    // Use existing intent detection system
    try {
      const { supabase } = await import('../supabaseClient');
      if (supabase) {
        const { data: intents } = await supabase
          .from('intent_patterns')
          .select('intent_name, confidence_threshold')
          .eq('language', 'en')
          .eq('is_active', true);

        for (const intent of intents || []) {
          // Simple keyword matching - in production, use more sophisticated NLP
          if (text.includes(intent.intent_name.replace('_', ' '))) {
            score += 25;
            break;
          }
        }
      }
    } catch (error) {
      console.error('Failed to calculate intent score:', error);
    }

    return Math.min(score, 100);
  }

  private hasHighIntentKeywords(text: string): boolean {
    const highIntentKeywords = ['buy', 'purchase', 'price', 'cost', 'order', 'payment', 'demo', 'trial'];
    return highIntentKeywords.some(keyword => text.toLowerCase().includes(keyword));
  }

  private async shouldTriggerAIResponse(conversationId: string, message: any, content: MessageContent): Promise<boolean> {
    // Check if automation rules already handled the message
    const automationHandled = await this.wasMessageHandledByAutomation(conversationId, message.id);
    if (automationHandled) return false;

    // Check if it's business hours and auto-response is enabled
    if (!await this.isBusinessHours()) {
      return await this.isOutOfHoursAutoResponseEnabled();
    }

    // Check if there's a human agent assigned
    const hasHumanAgent = await this.hasAssignedHumanAgent(conversationId);
    if (hasHumanAgent) return false;

    return true;
  }

  private async wasMessageHandledByAutomation(conversationId: string, messageId: string): Promise<boolean> {
    // Implementation depends on how you track automation rule execution
    return false;
  }

  private async isOutOfHoursAutoResponseEnabled(): Promise<boolean> {
    // Check configuration for out-of-hours auto-response
    return true;
  }

  private async hasAssignedHumanAgent(conversationId: string): Promise<boolean> {
    try {
      const { supabase } = await import('../supabaseClient');
      if (!supabase) return false;

      const { data: conversation } = await supabase
        .from('conversations')
        .select('agent_id')
        .eq('id', conversationId)
        .single();

      return conversation?.agent_id !== null;
    } catch (error) {
      console.error('Failed to check assigned agent:', error);
      return false;
    }
  }

  private async analyzeSentiment(text: string): Promise<'positive' | 'negative' | 'neutral'> {
    // Simple sentiment analysis - in production, use proper NLP service
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'perfect', 'wonderful'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'broken'];

    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private async getConversationMessageCount(phone: string): Promise<number> {
    try {
      const { supabase } = await import('../supabaseClient');
      if (!supabase) return 0;

      const { data: conversation } = await supabase
        .from('whatsapp_conversations')
        .select('conversation_id')
        .eq('customer_phone', phone)
        .single();

      if (!conversation) return 0;

      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact' })
        .eq('conversation_id', conversation.conversation_id);

      return count || 0;
    } catch (error) {
      console.error('Failed to get conversation message count:', error);
      return 0;
    }
  }

  private async getLastBusinessMessageTime(phone: string): Promise<number> {
    try {
      const { supabase } = await import('../supabaseClient');
      if (!supabase) return 0;

      const { data: conversation } = await supabase
        .from('whatsapp_conversations')
        .select('last_message_from_business_timestamp')
        .eq('customer_phone', phone)
        .single();

      if (!conversation?.last_message_from_business_timestamp) return 0;

      return new Date(conversation.last_message_from_business_timestamp).getTime();
    } catch (error) {
      console.error('Failed to get last business message time:', error);
      return 0;
    }
  }

  private async assignConversationToAgent(conversationId: string, agentId: string): Promise<void> {
    try {
      const { supabase } = await import('../supabaseClient');
      if (!supabase) return;

      await supabase
        .from('conversations')
        .update({ agent_id: agentId })
        .eq('id', conversationId);
    } catch (error) {
      console.error('Failed to assign conversation to agent:', error);
    }
  }

  private async addConversationTags(conversationId: string, tags: string[]): Promise<void> {
    try {
      const { supabase } = await import('../supabaseClient');
      if (!supabase) return;

      await supabase
        .from('conversations')
        .update({ tags: supabase.sql`tags || ${tags}` })
        .eq('id', conversationId);
    } catch (error) {
      console.error('Failed to add conversation tags:', error);
    }
  }

  private async scheduleFollowUp(conversationId: string, message: string, delay: number): Promise<void> {
    // Implementation for scheduling follow-up messages
    console.log(`Scheduling follow-up for conversation ${conversationId} with delay ${delay}ms`);
  }

  private async escalateConversation(conversationId: string, reason: string): Promise<void> {
    try {
      const { supabase } = await import('../supabaseClient');
      if (!supabase) return;

      await supabase
        .from('conversations')
        .update({ 
          priority: 'high',
          tags: supabase.sql`tags || ${['escalated']}`,
          metadata: supabase.sql`metadata || ${JSON.stringify({ escalated: true, reason })}`
        })
        .eq('id', conversationId);
    } catch (error) {
      console.error('Failed to escalate conversation:', error);
    }
  }

  private async processAnalyticsData(analyticsData: any[]): Promise<any> {
    // Process and aggregate analytics data
    const totalMessages = analyticsData.reduce((sum, day) => sum + day.messages_sent + day.messages_received, 0);
    const totalDelivered = analyticsData.reduce((sum, day) => sum + day.messages_delivered, 0);
    const totalRead = analyticsData.reduce((sum, day) => sum + day.messages_read, 0);
    const avgResponseTime = analyticsData.reduce((sum, day) => sum + day.avg_response_time_seconds, 0) / analyticsData.length;

    return {
      totalMessages,
      deliveryRate: totalMessages > 0 ? (totalDelivered / totalMessages) * 100 : 0,
      readRate: totalMessages > 0 ? (totalRead / totalMessages) * 100 : 0,
      avgResponseTime,
      dailyBreakdown: analyticsData
    };
  }

  private extractMessageFeatures(content: MessageContent): string[] {
    const features = [];
    
    if (content.text) features.push('text');
    if (content.media) features.push('media');
    if (content.interactive) features.push('interactive');
    if (content.template) features.push('template');
    if (content.location) features.push('location');
    if (content.contacts) features.push('contacts');
    if (content.reaction) features.push('reaction');

    return features;
  }

  // Enhanced AI response triggering with context
  private async triggerAIResponse(conversationId: string, content: MessageContent, customerProfile: any): Promise<void> {
    try {
      // Get conversation history for context
      const { supabase } = await import('../supabaseClient');
      if (!supabase) return;

      const { data: messages } = await supabase
        .from('messages')
        .select('content, role, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Import AI service and generate response
      const { AIService } = await import('../aiService');
      const aiService = new AIService();
      
      // Build context for AI
      const context = {
        conversationHistory: messages || [],
        customerProfile,
        currentMessage: content.text || '',
        channel: 'whatsapp',
        businessHours: await this.isBusinessHours(),
        customerPhone: customerProfile.customer_phone
      };

      const response = await aiService.generateResponse(content.text || '', messages || [], 'en', context);
      
      if (response) {
        // Check if response should be sent as template or regular message
        const shouldUseTemplate = await this.shouldUseTemplate(response, context);
        
        if (shouldUseTemplate) {
          const templateName = await this.selectBestTemplate(response, context);
          if (templateName) {
            await this.sendTemplateMessage(customerProfile.customer_phone, templateName, []);
          } else {
            await this.sendMessage(customerProfile.customer_phone, { text: response });
          }
        } else {
          await this.sendMessage(customerProfile.customer_phone, { text: response });
        }
      }
    } catch (error) {
      console.error('Failed to trigger AI response:', error);
    }
  }

  private async shouldUseTemplate(response: string, context: any): Promise<boolean> {
    // Logic to determine if a template should be used instead of regular message
    // This might depend on business rules, response content, or customer preferences
    return false;
  }

  private async selectBestTemplate(response: string, context: any): Promise<string | null> {
    // Logic to select the most appropriate template based on response and context
    return null;
  }

  // Status update processing
  private async processStatusUpdate(status: any): Promise<void> {
    try {
      await this.updateDeliveryStatus(
        status.id,
        this.mapWhatsAppStatus(status.status),
        status.id
      );

      // Track analytics for status updates
      await this.trackAnalytics('status_update', {
        status: status.status,
        messageId: status.id,
        timestamp: status.timestamp
      });
    } catch (error) {
      console.error('Failed to process status update:', error);
    }
  }

  // Existing methods from original implementation...
  async validateWebhookSignature(payload: string, signature: string): Promise<boolean> {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.config.webhookSecret)
        .update(payload)
        .digest('hex');

      return signature === `sha256=${expectedSignature}`;
    } catch (error) {
      console.error('Failed to validate webhook signature:', error);
      return false;
    }
  }

  async getDeliveryStatus(messageId: string): Promise<DeliveryStatus> {
    try {
      const response = await fetch(`${this.apiUrl}/${messageId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get delivery status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        messageId,
        externalMessageId: messageId,
        status: this.mapWhatsAppStatus(data.status),
        timestamp: new Date(),
        errorDetails: data.error
      };
    } catch (error) {
      console.error('Failed to get delivery status:', error);
      return {
        messageId,
        status: 'failed',
        timestamp: new Date(),
        errorDetails: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async markMessageAsRead(messageId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/${this.config.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to mark message as read:', error);
      return false;
    }
  }

  async setTypingIndicator(recipientId: string, action: 'typing_on' | 'typing_off'): Promise<void> {
    try {
      await fetch(`${this.apiUrl}/${this.config.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: recipientId,
          type: action === 'typing_on' ? 'typing_on' : 'typing_off'
        })
      });
    } catch (error) {
      console.error('Failed to set typing indicator:', error);
    }
  }

  async getUserProfile(userId: string): Promise<CustomerIdentity> {
    try {
      const response = await fetch(`${this.apiUrl}/${userId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get user profile: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        socialId: userId,
        phone: data.phone_number,
        name: data.name,
        channels: ['whatsapp']
      };
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return {
        socialId: userId,
        channels: ['whatsapp']
      };
    }
  }

  async getMediaUrl(mediaId: string): Promise<string> {
    try {
      const response = await fetch(`${this.apiUrl}/${mediaId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get media URL: ${response.status}`);
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Failed to get media URL:', error);
      throw error;
    }
  }

  private mapWhatsAppStatus(whatsappStatus: string): DeliveryStatus['status'] {
    switch (whatsappStatus) {
      case 'sent':
        return 'sent';
      case 'delivered':
        return 'delivered';
      case 'read':
        return 'read';
      case 'failed':
        return 'failed';
      default:
        return 'sent';
    }
  }
} 