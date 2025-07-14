import { BaseChannelService } from './baseChannelService';
import type { 
  ChannelType, 
  MessageContent, 
  DeliveryStatus, 
  ChannelCapabilities,
  CustomerIdentity,
  ConversationContext,
  InstagramConfig,
  InstagramMessage
} from './types';
import crypto from 'crypto';

export class InstagramService extends BaseChannelService {
  protected config: InstagramConfig;
  private apiUrl = 'https://graph.facebook.com/v18.0';

  constructor(config: InstagramConfig) {
    super('instagram', config);
    this.config = config;
  }

  getCapabilities(): ChannelCapabilities {
    return {
      supportsMedia: true,
      supportsQuickReplies: true,
      supportsTemplates: false,
      supportsTypingIndicator: true,
      supportsReadReceipts: true,
      maxMessageLength: 1000,
      supportedMediaTypes: ['image', 'video'],
      supportsButtons: false,
      supportsLocation: false
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
      let message: InstagramMessage;

      if (content.media) {
        message = {
          recipient_id: to,
          message: {
            attachment: {
              type: content.media.type,
              payload: { url: content.media.url }
            }
          }
        };
      } else if (content.text) {
        message = {
          recipient_id: to,
          message: {
            text: content.text
          }
        };
      } else {
        throw new Error('Invalid message content');
      }

      const response = await fetch(`${this.apiUrl}/${this.config.pageId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.accessToken}`
        },
        body: JSON.stringify(message)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Instagram API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const result = await response.json();
      const messageId = result.message_id;

      // Update delivery status
      await this.updateDeliveryStatus(messageId, 'sent');
      await this.incrementMessageCount();

      // Save message to database
      if (context) {
        await this.saveMessage(context.conversationId, content, false, messageId);
      }

      return messageId;
    } catch (error) {
      console.error('Instagram send message error:', error);
      throw error;
    }
  }

  async handleWebhook(payload: any, headers?: any): Promise<void> {
    try {
      await this.logWebhookEvent('instagram_webhook', payload);

      // Handle different webhook event types
      if (payload.object === 'instagram') {
        for (const entry of payload.entry) {
          // Handle messaging events
          if (entry.messaging) {
            for (const messagingEvent of entry.messaging) {
              if (messagingEvent.message) {
                await this.handleIncomingMessage(messagingEvent);
              } else if (messagingEvent.postback) {
                await this.handlePostback(messagingEvent);
              } else if (messagingEvent.delivery) {
                await this.handleDeliveryReceipt(messagingEvent);
              } else if (messagingEvent.read) {
                await this.handleReadReceipt(messagingEvent);
              }
            }
          }

          // Handle story mentions
          if (entry.changes) {
            for (const change of entry.changes) {
              if (change.field === 'story_insights') {
                await this.handleStoryMention(change.value);
              } else if (change.field === 'comments') {
                await this.handlePostComment(change.value);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Instagram webhook error:', error);
      throw error;
    }
  }

  async validateWebhookSignature(payload: string, signature: string): Promise<boolean> {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.config.appSecret)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(`sha256=${expectedSignature}`)
      );
    } catch (error) {
      console.error('Instagram webhook signature validation error:', error);
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
        throw new Error('Failed to fetch delivery status');
      }

      const result = await response.json();
      return {
        messageId,
        externalMessageId: result.id,
        status: 'sent', // Instagram doesn't provide detailed delivery status
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Instagram delivery status error:', error);
      return {
        messageId,
        status: 'failed',
        timestamp: new Date(),
        errorDetails: error
      };
    }
  }

  async markMessageAsRead(messageId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/${this.config.pageId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.accessToken}`
        },
        body: JSON.stringify({
          recipient_id: messageId,
          sender_action: 'mark_seen'
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Instagram mark as read error:', error);
      return false;
    }
  }

  async setTypingIndicator(recipientId: string, action: 'typing_on' | 'typing_off'): Promise<void> {
    try {
      await fetch(`${this.apiUrl}/${this.config.pageId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.accessToken}`
        },
        body: JSON.stringify({
          recipient_id: recipientId,
          sender_action: action
        })
      });
    } catch (error) {
      console.error('Instagram typing indicator error:', error);
    }
  }

  async getUserProfile(userId: string): Promise<CustomerIdentity> {
    try {
      const response = await fetch(`${this.apiUrl}/${userId}?fields=name,profile_pic`, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const profile = await response.json();
      return {
        socialId: userId,
        name: profile.name,
        channels: ['instagram']
      };
    } catch (error) {
      console.error('Instagram user profile error:', error);
      return {
        socialId: userId,
        channels: ['instagram']
      };
    }
  }

  async getMediaUrl(mediaId: string): Promise<string> {
    try {
      const response = await fetch(`${this.apiUrl}/${mediaId}?fields=media_url`, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch media URL');
      }

      const result = await response.json();
      return result.media_url;
    } catch (error) {
      console.error('Instagram media URL error:', error);
      throw error;
    }
  }

  private async handleIncomingMessage(messagingEvent: any): Promise<void> {
    try {
      const senderId = messagingEvent.sender.id;
      const message = messagingEvent.message;

      // Get user profile
      const userProfile = await this.getUserProfile(senderId);

      // Find or create conversation
      const conversationId = await this.findOrCreateConversation(userProfile, senderId);

      // Process message content
      let content: MessageContent = {};
      
      if (message.text) {
        content.text = message.text;
      } else if (message.attachments) {
        const attachment = message.attachments[0];
        content.media = {
          type: attachment.type,
          url: attachment.payload.url
        };
      }

      // Save incoming message
      await this.saveMessage(conversationId, content, true, message.mid);

      // Trigger AI response
      await this.triggerAIResponse(conversationId, content);
    } catch (error) {
      console.error('Instagram incoming message error:', error);
    }
  }

  private async handlePostback(messagingEvent: any): Promise<void> {
    try {
      const senderId = messagingEvent.sender.id;
      const postback = messagingEvent.postback;

      const userProfile = await this.getUserProfile(senderId);
      const conversationId = await this.findOrCreateConversation(userProfile, senderId);

      const content: MessageContent = {
        text: postback.title || postback.payload
      };

      await this.saveMessage(conversationId, content, true);
      await this.triggerAIResponse(conversationId, content);
    } catch (error) {
      console.error('Instagram postback error:', error);
    }
  }

  private async handleDeliveryReceipt(messagingEvent: any): Promise<void> {
    try {
      const delivery = messagingEvent.delivery;
      for (const messageId of delivery.mids) {
        await this.updateDeliveryStatus(messageId, 'delivered');
      }
    } catch (error) {
      console.error('Instagram delivery receipt error:', error);
    }
  }

  private async handleReadReceipt(messagingEvent: any): Promise<void> {
    try {
      const read = messagingEvent.read;
      // Update read status for messages up to watermark
      await this.updateDeliveryStatus(read.watermark, 'read');
    } catch (error) {
      console.error('Instagram read receipt error:', error);
    }
  }

  private async handleStoryMention(storyData: any): Promise<void> {
    try {
      const senderId = storyData.sender.id;
      const userProfile = await this.getUserProfile(senderId);
      const conversationId = await this.findOrCreateConversation(userProfile, senderId);

      const content: MessageContent = {
        text: `User mentioned you in their story: ${storyData.story_id}`,
        media: storyData.media ? {
          type: 'image',
          url: storyData.media.url
        } : undefined
      };

      await this.saveMessage(conversationId, content, true);
      await this.triggerAIResponse(conversationId, content);
    } catch (error) {
      console.error('Instagram story mention error:', error);
    }
  }

  private async handlePostComment(commentData: any): Promise<void> {
    try {
      const senderId = commentData.from.id;
      const userProfile = await this.getUserProfile(senderId);
      const conversationId = await this.findOrCreateConversation(userProfile, senderId);

      const content: MessageContent = {
        text: `Comment on post: ${commentData.message}`
      };

      await this.saveMessage(conversationId, content, true, commentData.id);
      await this.triggerAIResponse(conversationId, content);
    } catch (error) {
      console.error('Instagram post comment error:', error);
    }
  }

  private async triggerAIResponse(conversationId: string, content: MessageContent): Promise<void> {
    try {
      // Import AI service dynamically to avoid circular dependencies
      const { openaiService } = await import('../openaiService');
      
      const response = await openaiService.generateResponse(
        content.text || 'Media message',
        conversationId,
        'instagram'
      );

      if (response) {
        // Send AI response
        const customerIdentity = await this.getConversationCustomer(conversationId);
        if (customerIdentity?.socialId) {
          await this.sendMessage(customerIdentity.socialId, { text: response });
        }
      }
    } catch (error) {
      console.error('Instagram AI response error:', error);
    }
  }

  private async getConversationCustomer(conversationId: string): Promise<CustomerIdentity | null> {
    try {
      // This would query the database for conversation details
      // Implementation depends on your database structure
      return null;
    } catch (error) {
      console.error('Get conversation customer error:', error);
      return null;
    }
  }

  // Business profile management
  async getBusinessProfile(): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/${this.config.pageId}?fields=name,username,profile_picture_url,followers_count,biography`, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch business profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Instagram business profile error:', error);
      throw error;
    }
  }

  async updateBusinessProfile(updates: any): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/${this.config.pageId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.accessToken}`
        },
        body: JSON.stringify(updates)
      });

      return response.ok;
    } catch (error) {
      console.error('Instagram business profile update error:', error);
      return false;
    }
  }
}