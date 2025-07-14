import { BaseChannelService } from './baseChannelService';
import type { 
  ChannelType, 
  MessageContent, 
  DeliveryStatus, 
  ChannelCapabilities,
  CustomerIdentity,
  ConversationContext,
  EmailConfig,
  EmailMessage
} from './types';
import sgMail from '@sendgrid/mail';
import crypto from 'crypto';

export class EmailService extends BaseChannelService {
  protected config: EmailConfig;
  private sendgridApiKey: string;

  constructor(config: EmailConfig, sendgridApiKey: string) {
    super('email', config);
    this.config = config;
    this.sendgridApiKey = sendgridApiKey;
    sgMail.setApiKey(this.sendgridApiKey);
  }

  getCapabilities(): ChannelCapabilities {
    return {
      supportsMedia: true,
      supportsQuickReplies: false,
      supportsTemplates: true,
      supportsTypingIndicator: false,
      supportsReadReceipts: true,
      maxMessageLength: 1000000, // Very large for email
      supportedMediaTypes: ['image', 'document', 'audio', 'video'],
      supportsButtons: true,
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
      let emailMessage: EmailMessage;
      const subject = this.generateSubject(content, context);
      const htmlContent = this.generateHtmlContent(content);
      const textContent = this.generateTextContent(content);

      emailMessage = {
        to,
        subject,
        htmlContent,
        textContent,
        replyTo: this.config.supportEmail
      };

      // Add attachments if media exists
      if (content.media) {
        emailMessage.attachments = [{
          filename: this.getFilenameFromUrl(content.media.url),
          content: await this.downloadAndEncodeMedia(content.media.url),
          contentType: this.getContentType(content.media.type)
        }];
      }

      const msg = {
        to: emailMessage.to,
        from: {
          email: this.config.supportEmail,
          name: 'ROMASHKA Support'
        },
        subject: emailMessage.subject,
        text: emailMessage.textContent,
        html: emailMessage.htmlContent,
        attachments: emailMessage.attachments || [],
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true }
        },
        customArgs: {
          conversationId: context?.conversationId || '',
          channelType: 'email'
        }
      };

      const response = await sgMail.send(msg);
      const messageId = response[0].headers['x-message-id'];

      // Update delivery status
      await this.updateDeliveryStatus(messageId, 'sent');
      await this.incrementMessageCount();

      // Save message to database
      if (context) {
        await this.saveMessage(context.conversationId, content, false, messageId);
      }

      return messageId;
    } catch (error) {
      console.error('Email send error:', error);
      throw error;
    }
  }

  async handleWebhook(payload: any, headers?: any): Promise<void> {
    try {
      await this.logWebhookEvent('email_webhook', payload);

      // Handle different SendGrid event types
      if (Array.isArray(payload)) {
        for (const event of payload) {
          switch (event.event) {
            case 'inbound_email':
              await this.handleInboundEmail(event);
              break;
            case 'delivered':
              await this.handleDeliveryEvent(event);
              break;
            case 'opened':
              await this.handleOpenEvent(event);
              break;
            case 'clicked':
              await this.handleClickEvent(event);
              break;
            case 'bounce':
            case 'dropped':
              await this.handleFailureEvent(event);
              break;
            default:
              console.log('Unknown email event:', event.event);
          }
        }
      } else if (payload.event === 'inbound_email') {
        await this.handleInboundEmail(payload);
      }
    } catch (error) {
      console.error('Email webhook error:', error);
      throw error;
    }
  }

  async validateWebhookSignature(payload: string, signature: string): Promise<boolean> {
    try {
      // SendGrid uses different signature format
      const timestamp = signature.split(',')[0].split('=')[1];
      const expectedSignature = signature.split(',')[1].split('=')[1];
      
      const signingKey = this.sendgridApiKey; // Use appropriate webhook signing key
      const payload_with_timestamp = timestamp + '.' + payload;
      
      const computedSignature = crypto
        .createHmac('sha256', signingKey)
        .update(payload_with_timestamp)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(computedSignature)
      );
    } catch (error) {
      console.error('Email webhook signature validation error:', error);
      return false;
    }
  }

  async getDeliveryStatus(messageId: string): Promise<DeliveryStatus> {
    try {
      // SendGrid doesn't provide a direct API for message status
      // Status is typically handled through webhooks
      return {
        messageId,
        status: 'sent',
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Email delivery status error:', error);
      return {
        messageId,
        status: 'failed',
        timestamp: new Date(),
        errorDetails: error
      };
    }
  }

  async markMessageAsRead(messageId: string): Promise<boolean> {
    // Email doesn't have a direct "mark as read" mechanism
    // This would be handled through open tracking
    return true;
  }

  async setTypingIndicator(recipientId: string, action: 'typing_on' | 'typing_off'): Promise<void> {
    // Email doesn't support typing indicators
    return;
  }

  async getUserProfile(email: string): Promise<CustomerIdentity> {
    try {
      // Extract name from email or use database lookup
      const name = email.split('@')[0].replace(/[._]/g, ' ');
      
      return {
        email,
        name: this.capitalizeWords(name),
        channels: ['email']
      };
    } catch (error) {
      console.error('Email user profile error:', error);
      return {
        email,
        channels: ['email']
      };
    }
  }

  async getMediaUrl(mediaId: string): Promise<string> {
    // For email, media is typically sent as attachments
    // This would return the URL to download the attachment
    return `https://api.sendgrid.com/v3/mail/attachments/${mediaId}`;
  }

  private async handleInboundEmail(emailEvent: any): Promise<void> {
    try {
      const fromEmail = emailEvent.from;
      const subject = emailEvent.subject;
      const textContent = emailEvent.text;
      const htmlContent = emailEvent.html;
      const attachments = emailEvent.attachments || [];

      // Get user profile
      const userProfile = await this.getUserProfile(fromEmail);

      // Find or create conversation based on email thread
      const conversationId = await this.findOrCreateEmailConversation(
        userProfile, 
        subject, 
        emailEvent.message_id
      );

      // Process email content
      let content: MessageContent = {};
      
      if (textContent) {
        content.text = this.cleanEmailText(textContent);
      } else if (htmlContent) {
        content.text = this.extractTextFromHtml(htmlContent);
      }

      // Handle attachments
      if (attachments.length > 0) {
        content.media = {
          type: this.getMediaTypeFromAttachment(attachments[0]),
          url: await this.saveAttachment(attachments[0])
        };
      }

      // Save incoming email as message
      await this.saveMessage(conversationId, content, true, emailEvent.message_id);

      // Trigger AI response
      await this.triggerAIResponse(conversationId, content, userProfile);
    } catch (error) {
      console.error('Inbound email handling error:', error);
    }
  }

  private async handleDeliveryEvent(event: any): Promise<void> {
    try {
      const messageId = event.sg_message_id;
      await this.updateDeliveryStatus(messageId, 'delivered');
    } catch (error) {
      console.error('Email delivery event error:', error);
    }
  }

  private async handleOpenEvent(event: any): Promise<void> {
    try {
      const messageId = event.sg_message_id;
      await this.updateDeliveryStatus(messageId, 'read');
    } catch (error) {
      console.error('Email open event error:', error);
    }
  }

  private async handleClickEvent(event: any): Promise<void> {
    try {
      // Handle email link clicks for analytics
      console.log('Email clicked:', event.url);
    } catch (error) {
      console.error('Email click event error:', error);
    }
  }

  private async handleFailureEvent(event: any): Promise<void> {
    try {
      const messageId = event.sg_message_id;
      await this.updateDeliveryStatus(messageId, 'failed', undefined, event.reason);
    } catch (error) {
      console.error('Email failure event error:', error);
    }
  }

  private async findOrCreateEmailConversation(
    userProfile: CustomerIdentity,
    subject: string,
    messageId: string
  ): Promise<string> {
    try {
      // Check if this is a reply to an existing thread
      const threadId = this.extractThreadId(subject, messageId);
      
      if (threadId) {
        // Find existing conversation by thread ID
        const existingConversation = await this.findConversationByThreadId(threadId);
        if (existingConversation) {
          return existingConversation;
        }
      }

      // Create new conversation
      return await this.findOrCreateConversation(userProfile, messageId);
    } catch (error) {
      console.error('Email conversation creation error:', error);
      return await this.findOrCreateConversation(userProfile, messageId);
    }
  }

  private extractThreadId(subject: string, messageId: string): string | null {
    // Extract thread ID from subject line (Re: [THREAD-ID])
    const match = subject.match(/\[(\w+)\]/);
    return match ? match[1] : null;
  }

  private async findConversationByThreadId(threadId: string): Promise<string | null> {
    try {
      // This would query the database for existing conversation
      // Implementation depends on your database structure
      return null;
    } catch (error) {
      console.error('Find conversation by thread ID error:', error);
      return null;
    }
  }

  private generateSubject(content: MessageContent, context?: ConversationContext): string {
    if (context?.conversationId) {
      return `Re: Your Support Request [${context.conversationId}]`;
    }
    
    if (content.text) {
      const preview = content.text.substring(0, 50);
      return `ROMASHKA Support: ${preview}...`;
    }
    
    return 'ROMASHKA Support Response';
  }

  private generateHtmlContent(content: MessageContent): string {
    let html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8f9fa; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .button { display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>ROMASHKA AI Support</h1>
            </div>
            <div class="content">
    `;

    if (content.text) {
      html += `<p>${content.text.replace(/\n/g, '<br>')}</p>`;
    }

    if (content.buttons) {
      html += '<div style="margin: 20px 0;">';
      for (const button of content.buttons) {
        html += `<a href="${button.url}" class="button" style="margin-right: 10px;">${button.text}</a>`;
      }
      html += '</div>';
    }

    html += `
            </div>
            <div class="footer">
              <p>This is an automated response from ROMASHKA AI Support.</p>
              <p>Reply to this email to continue the conversation.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return html;
  }

  private generateTextContent(content: MessageContent): string {
    let text = '';
    
    if (content.text) {
      text += content.text + '\n\n';
    }

    if (content.buttons) {
      text += 'Quick Actions:\n';
      for (const button of content.buttons) {
        text += `- ${button.text}: ${button.url}\n`;
      }
      text += '\n';
    }

    text += '---\n';
    text += 'This is an automated response from ROMASHKA AI Support.\n';
    text += 'Reply to this email to continue the conversation.\n';

    return text;
  }

  private cleanEmailText(text: string): string {
    // Remove email signatures, quoted text, etc.
    const lines = text.split('\n');
    const cleanLines = [];
    
    for (const line of lines) {
      // Skip common email prefixes
      if (line.startsWith('>') || line.startsWith('On ') || line.includes('wrote:')) {
        break;
      }
      
      // Skip signature separators
      if (line.trim() === '--' || line.includes('Sent from')) {
        break;
      }
      
      cleanLines.push(line);
    }
    
    return cleanLines.join('\n').trim();
  }

  private extractTextFromHtml(html: string): string {
    // Basic HTML to text conversion
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .trim();
  }

  private getMediaTypeFromAttachment(attachment: any): 'image' | 'audio' | 'video' | 'document' {
    const contentType = attachment.content_type || '';
    
    if (contentType.startsWith('image/')) return 'image';
    if (contentType.startsWith('audio/')) return 'audio';
    if (contentType.startsWith('video/')) return 'video';
    return 'document';
  }

  private async saveAttachment(attachment: any): Promise<string> {
    try {
      // Save attachment to storage and return URL
      // This would typically upload to cloud storage
      return `https://storage.romashka.ai/attachments/${attachment.filename}`;
    } catch (error) {
      console.error('Save attachment error:', error);
      return '';
    }
  }

  private async downloadAndEncodeMedia(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      return Buffer.from(buffer).toString('base64');
    } catch (error) {
      console.error('Download media error:', error);
      return '';
    }
  }

  private getFilenameFromUrl(url: string): string {
    return url.split('/').pop() || 'attachment';
  }

  private getContentType(mediaType: string): string {
    const types = {
      'image': 'image/jpeg',
      'audio': 'audio/mpeg',
      'video': 'video/mp4',
      'document': 'application/pdf'
    };
    return types[mediaType] || 'application/octet-stream';
  }

  private capitalizeWords(str: string): string {
    return str.replace(/\b\w/g, char => char.toUpperCase());
  }

  private async triggerAIResponse(
    conversationId: string, 
    content: MessageContent, 
    userProfile: CustomerIdentity
  ): Promise<void> {
    try {
      // Import AI service dynamically to avoid circular dependencies
      const { openaiService } = await import('../openaiService');
      
      const response = await openaiService.generateResponse(
        content.text || 'Email received',
        conversationId,
        'email'
      );

      if (response && userProfile.email) {
        // Send AI response via email
        await this.sendMessage(userProfile.email, { text: response });
      }
    } catch (error) {
      console.error('Email AI response error:', error);
    }
  }

  // Template management for email
  async createEmailTemplate(name: string, subject: string, htmlContent: string): Promise<string> {
    try {
      const template = {
        name,
        generation: 'dynamic',
        subject,
        versions: [{
          template_name: name,
          subject,
          html_content: htmlContent,
          plain_content: this.extractTextFromHtml(htmlContent),
          active: 1
        }]
      };

      const response = await fetch('https://api.sendgrid.com/v3/templates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.sendgridApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(template)
      });

      if (!response.ok) {
        throw new Error('Failed to create email template');
      }

      const result = await response.json();
      return result.id;
    } catch (error) {
      console.error('Create email template error:', error);
      throw error;
    }
  }

  async sendTemplatedEmail(
    to: string, 
    templateId: string, 
    dynamicData: Record<string, any>
  ): Promise<string> {
    try {
      const msg = {
        to,
        from: {
          email: this.config.supportEmail,
          name: 'ROMASHKA Support'
        },
        template_id: templateId,
        dynamic_template_data: dynamicData
      };

      const response = await sgMail.send(msg);
      return response[0].headers['x-message-id'];
    } catch (error) {
      console.error('Send templated email error:', error);
      throw error;
    }
  }
}