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

export class WhatsAppService extends BaseChannelService {
  protected config: WhatsAppConfig;
  private apiUrl = 'https://graph.facebook.com/v18.0';

  constructor(config: WhatsAppConfig) {
    super('whatsapp', config);
    this.config = config;
  }

  getCapabilities(): ChannelCapabilities {
    return {
      supportsMedia: true,
      supportsQuickReplies: false,
      supportsTemplates: true,
      supportsTypingIndicator: true,
      supportsReadReceipts: true,
      maxMessageLength: 4096,
      supportedMediaTypes: ['image', 'audio', 'video', 'document'],
      supportsButtons: true,
      supportsLocation: true
    };
  }

  async sendMessage(
    to: string, 
    content: MessageContent, 
    context?: ConversationContext
  ): Promise<string> {
    await this.validateConfig();
    await this.checkRateLimit();

    try {
      let message: WhatsAppMessage;

      if (content.template) {
        message = {
          messaging_product: 'whatsapp',
          to: to,
          type: 'template',
          template: {
            name: content.template.name,
            language: { code: 'en' },
            components: content.template.parameters.map((param, index) => ({
              type: 'text',
              text: { body: param }
            }))
          }
        };
      } else if (content.media) {
        message = {
          messaging_product: 'whatsapp',
          to: to,
          type: content.media.type as 'image' | 'audio' | 'video' | 'document',
          [content.media.type]: {
            link: content.media.url,
            caption: content.media.caption
          }
        };
      } else {
        message = {
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: { body: content.text || '' }
        };
      }

      const response = await fetch(`${this.apiUrl}/${this.config.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      if (!response.ok) {
        throw new Error(`WhatsApp API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const messageId = result.messages?.[0]?.id;

      if (!messageId) {
        throw new Error('No message ID returned from WhatsApp API');
      }

      // Save message to database
      if (context) {
        await this.saveMessage(context.conversationId, content, false, messageId);
      }

      await this.incrementMessageCount();
      await this.updateDeliveryStatus(messageId, 'sent', messageId);

      return messageId;
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error);
      throw error;
    }
  }

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

      // Handle incoming messages
      for (const message of messages) {
        await this.handleIncomingMessage(message);
      }

      // Handle delivery status updates
      for (const status of statuses) {
        await this.handleStatusUpdate(status);
      }

      await this.logWebhookEvent('webhook_processed', { processed: true });
    } catch (error) {
      console.error('Failed to handle WhatsApp webhook:', error);
      await this.logWebhookEvent('webhook_error', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

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
          type: 'reaction',
          reaction: {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            type: action
          }
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

  private async handleIncomingMessage(message: any): Promise<void> {
    try {
      const customerIdentity: CustomerIdentity = {
        socialId: message.from,
        phone: message.from,
        channels: ['whatsapp']
      };

      const conversationId = await this.findOrCreateConversation(
        customerIdentity,
        message.from
      );

      const content: MessageContent = {
        text: message.text?.body || '',
        media: message.image ? {
          type: 'image',
          url: message.image.id,
          caption: message.image.caption
        } : undefined
      };

      await this.saveMessage(conversationId, content, true, message.id);
      
      // Trigger AI response
      await this.triggerAIResponse(conversationId, content);
    } catch (error) {
      console.error('Failed to handle incoming message:', error);
    }
  }

  private async handleStatusUpdate(status: any): Promise<void> {
    try {
      await this.updateDeliveryStatus(
        status.id,
        this.mapWhatsAppStatus(status.status),
        status.id
      );
    } catch (error) {
      console.error('Failed to handle status update:', error);
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

  private async triggerAIResponse(conversationId: string, content: MessageContent): Promise<void> {
    try {
      // Import AI service and trigger response
      const { AIService } = await import('../aiService');
      const aiService = new AIService();
      const response = await aiService.generateResponse(content.text || '', [], 'en');
      
      if (response) {
        await this.sendMessage(
          conversationId, // This should be the customer's phone number
          { text: response },
          { 
            conversationId, 
            channelType: 'whatsapp', 
            customerIdentity: { channels: ['whatsapp'] }, 
            priority: 'normal', 
            tags: [] 
          }
        );
      }
    } catch (error) {
      console.error('Failed to trigger AI response:', error);
    }
  }
} 