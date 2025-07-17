import { supabase } from '../../lib/supabase';
import { realtimeMessagingService } from './realTimeMessaging';
import type { ChannelType } from '../channels/types';

export interface WebhookPayload {
  type: string;
  data: any;
  signature?: string;
  timestamp?: string;
}

export interface ChannelStatus {
  isConnected: boolean;
  lastActivity: Date;
  messageCount: number;
  errorCount: number;
}

export interface ChannelIntegration {
  channelType: ChannelType;
  receiveMessage(webhook: WebhookPayload): Promise<void>;
  sendMessage(message: string, recipient: string): Promise<boolean>;
  getChannelStatus(): Promise<ChannelStatus>;
  handleDeliveryReceipts(): Promise<void>;
}

export class WhatsAppIntegration implements ChannelIntegration {
  public channelType: ChannelType = 'whatsapp';
  private apiToken: string;
  private phoneNumberId: string;
  private webhookSecret: string;

  constructor() {
    this.apiToken = process.env.WHATSAPP_API_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.webhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET || '';
  }

  async receiveMessage(webhook: WebhookPayload): Promise<void> {
    try {
      // Verify webhook signature
      if (!this.verifyWebhookSignature(webhook)) {
        throw new Error('Invalid webhook signature');
      }

      const { data } = webhook;
      
      // Parse WhatsApp webhook format
      if (data.object === 'whatsapp_business_account') {
        const entry = data.entry[0];
        const changes = entry.changes[0];
        
        if (changes.field === 'messages') {
          const messages = changes.value.messages;
          
          for (const message of messages) {
            await this.processWhatsAppMessage(message, changes.value.metadata);
          }
        }

        // Handle message status updates
        if (changes.value.statuses) {
          for (const status of changes.value.statuses) {
            await this.handleDeliveryStatus(status);
          }
        }
      }
    } catch (error) {
      console.error('Error processing WhatsApp webhook:', error);
      throw error;
    }
  }

  async sendMessage(message: string, recipient: string): Promise<boolean> {
    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: recipient,
          type: 'text',
          text: {
            body: message
          }
        })
      });

      if (!response.ok) {
        throw new Error(`WhatsApp API error: ${response.statusText}`);
      }

      const result = await response.json();
      return !!result.messages?.[0]?.id;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return false;
    }
  }

  async getChannelStatus(): Promise<ChannelStatus> {
    try {
      // Get recent message count from database
      const { data: messages, error } = await supabase
        .from('messages')
        .select('id, created_at')
        .eq('channel_type', 'whatsapp')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      return {
        isConnected: !!this.apiToken && !!this.phoneNumberId,
        lastActivity: messages.length > 0 ? new Date(messages[0].created_at) : new Date(),
        messageCount: messages.length,
        errorCount: 0 // TODO: Track errors
      };
    } catch (error) {
      console.error('Error getting WhatsApp status:', error);
      return {
        isConnected: false,
        lastActivity: new Date(),
        messageCount: 0,
        errorCount: 1
      };
    }
  }

  async handleDeliveryReceipts(): Promise<void> {
    // Handled in receiveMessage via webhook
  }

  private verifyWebhookSignature(webhook: WebhookPayload): boolean {
    if (!this.webhookSecret || !webhook.signature) return true; // Skip verification if not configured
    
    // TODO: Implement signature verification
    return true;
  }

  private async processWhatsAppMessage(message: any, metadata: any): Promise<void> {
    try {
      const customerPhone = message.from;
      const messageText = message.text?.body || '';
      const messageType = message.type;

      // Create or get conversation
      const conversation = await realtimeMessagingService.createOrGetConversation(
        customerPhone,
        'whatsapp',
        messageText
      );

      // Handle different message types
      let content = messageText;
      if (messageType === 'image') {
        content = `[Image: ${message.image?.caption || 'No caption'}]`;
      } else if (messageType === 'document') {
        content = `[Document: ${message.document?.filename || 'File'}]`;
      } else if (messageType === 'audio') {
        content = '[Audio message]';
      } else if (messageType === 'video') {
        content = '[Video message]';
      }

      // Store message
      await realtimeMessagingService.handleIncomingMessage({
        id: crypto.randomUUID(),
        conversation_id: conversation.id,
        sender_type: 'user',
        content,
        channel_type: 'whatsapp',
        external_message_id: message.id,
        metadata: {
          whatsapp_message_type: messageType,
          whatsapp_timestamp: message.timestamp,
          ...message
        },
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error processing WhatsApp message:', error);
      throw error;
    }
  }

  private async handleDeliveryStatus(status: any): Promise<void> {
    try {
      const { id, status: deliveryStatus, timestamp } = status;
      
      // Update message delivery status
      await supabase
        .from('messages')
        .update({
          delivery_status: deliveryStatus,
          metadata: supabase.raw('metadata || \'{"delivery_timestamp": "' + timestamp + '"}\'::jsonb')
        })
        .eq('external_message_id', id);
    } catch (error) {
      console.error('Error updating delivery status:', error);
    }
  }
}

export class InstagramIntegration implements ChannelIntegration {
  public channelType: ChannelType = 'instagram';
  private accessToken: string;
  private appSecret: string;

  constructor() {
    this.accessToken = process.env.INSTAGRAM_ACCESS_TOKEN || '';
    this.appSecret = process.env.INSTAGRAM_APP_SECRET || '';
  }

  async receiveMessage(webhook: WebhookPayload): Promise<void> {
    try {
      // Verify webhook signature
      if (!this.verifyWebhookSignature(webhook)) {
        throw new Error('Invalid webhook signature');
      }

      const { data } = webhook;

      // Parse Instagram webhook format
      if (data.object === 'instagram') {
        const entry = data.entry[0];
        const messaging = entry.messaging[0];

        if (messaging.message) {
          await this.processInstagramMessage(messaging);
        }
      }
    } catch (error) {
      console.error('Error processing Instagram webhook:', error);
      throw error;
    }
  }

  async sendMessage(message: string, recipient: string): Promise<boolean> {
    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/me/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: { id: recipient },
          message: { text: message }
        })
      });

      if (!response.ok) {
        throw new Error(`Instagram API error: ${response.statusText}`);
      }

      const result = await response.json();
      return !!result.message_id;
    } catch (error) {
      console.error('Error sending Instagram message:', error);
      return false;
    }
  }

  async getChannelStatus(): Promise<ChannelStatus> {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('id, created_at')
        .eq('channel_type', 'instagram')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      return {
        isConnected: !!this.accessToken,
        lastActivity: messages.length > 0 ? new Date(messages[0].created_at) : new Date(),
        messageCount: messages.length,
        errorCount: 0
      };
    } catch (error) {
      console.error('Error getting Instagram status:', error);
      return {
        isConnected: false,
        lastActivity: new Date(),
        messageCount: 0,
        errorCount: 1
      };
    }
  }

  async handleDeliveryReceipts(): Promise<void> {
    // Instagram doesn't provide delivery receipts for messages
  }

  private verifyWebhookSignature(webhook: WebhookPayload): boolean {
    if (!this.appSecret || !webhook.signature) return true;
    
    // TODO: Implement signature verification
    return true;
  }

  private async processInstagramMessage(messaging: any): Promise<void> {
    try {
      const senderId = messaging.sender.id;
      const messageText = messaging.message.text || '';

      // Create or get conversation
      const conversation = await realtimeMessagingService.createOrGetConversation(
        senderId,
        'instagram',
        messageText
      );

      // Store message
      await realtimeMessagingService.handleIncomingMessage({
        id: crypto.randomUUID(),
        conversation_id: conversation.id,
        sender_type: 'user',
        content: messageText,
        channel_type: 'instagram',
        external_message_id: messaging.message.mid,
        metadata: {
          instagram_sender_id: senderId,
          instagram_timestamp: messaging.timestamp,
          ...messaging
        },
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error processing Instagram message:', error);
      throw error;
    }
  }
}

export class EmailIntegration implements ChannelIntegration {
  public channelType: ChannelType = 'email';

  async receiveMessage(webhook: WebhookPayload): Promise<void> {
    try {
      // Parse email webhook (implementation depends on email service provider)
      const { data } = webhook;
      
      // Example for generic email webhook
      const { from, subject, body } = data;
      
      // Create or get conversation
      const conversation = await realtimeMessagingService.createOrGetConversation(
        from,
        'email',
        `${subject}: ${body}`
      );

      // Store message
      await realtimeMessagingService.handleIncomingMessage({
        id: crypto.randomUUID(),
        conversation_id: conversation.id,
        sender_type: 'user',
        content: body,
        channel_type: 'email',
        metadata: {
          email_subject: subject,
          email_from: from,
          ...data
        },
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error processing email webhook:', error);
      throw error;
    }
  }

  async sendMessage(message: string, recipient: string): Promise<boolean> {
    try {
      // TODO: Implement email sending using your email service
      // This could be SendGrid, AWS SES, etc.
      console.log('Sending email to:', recipient, 'Message:', message);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  async getChannelStatus(): Promise<ChannelStatus> {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('id, created_at')
        .eq('channel_type', 'email')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      return {
        isConnected: true, // Always connected for email
        lastActivity: messages.length > 0 ? new Date(messages[0].created_at) : new Date(),
        messageCount: messages.length,
        errorCount: 0
      };
    } catch (error) {
      console.error('Error getting email status:', error);
      return {
        isConnected: false,
        lastActivity: new Date(),
        messageCount: 0,
        errorCount: 1
      };
    }
  }

  async handleDeliveryReceipts(): Promise<void> {
    // Email delivery receipts would be handled by email service provider
  }
}

export class WidgetIntegration implements ChannelIntegration {
  public channelType: ChannelType = 'website';

  async receiveMessage(webhook: WebhookPayload): Promise<void> {
    try {
      // Widget messages come directly through the app, not via webhook
      // This method exists for consistency but might not be used
      const { data } = webhook;
      
      const conversation = await realtimeMessagingService.createOrGetConversation(
        data.customerId || data.sessionId,
        'website',
        data.message
      );

      await realtimeMessagingService.handleIncomingMessage({
        id: crypto.randomUUID(),
        conversation_id: conversation.id,
        sender_type: 'user',
        content: data.message,
        channel_type: 'website',
        metadata: {
          widget_session_id: data.sessionId,
          widget_page_url: data.pageUrl,
          ...data
        },
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error processing widget message:', error);
      throw error;
    }
  }

  async sendMessage(message: string, recipient: string): Promise<boolean> {
    try {
      // Widget messages are sent via real-time connection
      // The actual sending is handled by the frontend widget
      return true;
    } catch (error) {
      console.error('Error sending widget message:', error);
      return false;
    }
  }

  async getChannelStatus(): Promise<ChannelStatus> {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('id, created_at')
        .eq('channel_type', 'website')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      return {
        isConnected: true,
        lastActivity: messages.length > 0 ? new Date(messages[0].created_at) : new Date(),
        messageCount: messages.length,
        errorCount: 0
      };
    } catch (error) {
      console.error('Error getting widget status:', error);
      return {
        isConnected: false,
        lastActivity: new Date(),
        messageCount: 0,
        errorCount: 1
      };
    }
  }

  async handleDeliveryReceipts(): Promise<void> {
    // Widget messages don't require delivery receipts
  }
}

export class MultiChannelIntegrationManager {
  private integrations: Map<ChannelType, ChannelIntegration> = new Map();

  constructor() {
    // Initialize all channel integrations
    this.integrations.set('whatsapp', new WhatsAppIntegration());
    this.integrations.set('instagram', new InstagramIntegration());
    this.integrations.set('email', new EmailIntegration());
    this.integrations.set('website', new WidgetIntegration());
  }

  async handleWebhook(channelType: ChannelType, webhook: WebhookPayload): Promise<void> {
    const integration = this.integrations.get(channelType);
    if (!integration) {
      throw new Error(`No integration found for channel type: ${channelType}`);
    }

    await integration.receiveMessage(webhook);
  }

  async sendMessage(channelType: ChannelType, message: string, recipient: string): Promise<boolean> {
    const integration = this.integrations.get(channelType);
    if (!integration) {
      throw new Error(`No integration found for channel type: ${channelType}`);
    }

    return await integration.sendMessage(message, recipient);
  }

  async getChannelStatus(channelType: ChannelType): Promise<ChannelStatus> {
    const integration = this.integrations.get(channelType);
    if (!integration) {
      throw new Error(`No integration found for channel type: ${channelType}`);
    }

    return await integration.getChannelStatus();
  }

  async getAllChannelStatuses(): Promise<Record<ChannelType, ChannelStatus>> {
    const statuses: Record<string, ChannelStatus> = {};
    
    for (const [channelType, integration] of this.integrations.entries()) {
      try {
        statuses[channelType] = await integration.getChannelStatus();
      } catch (error) {
        console.error(`Error getting status for ${channelType}:`, error);
        statuses[channelType] = {
          isConnected: false,
          lastActivity: new Date(),
          messageCount: 0,
          errorCount: 1
        };
      }
    }

    return statuses as Record<ChannelType, ChannelStatus>;
  }

  getAvailableChannels(): ChannelType[] {
    return Array.from(this.integrations.keys());
  }
}

// Export singleton instance
export const multiChannelIntegrationManager = new MultiChannelIntegrationManager();