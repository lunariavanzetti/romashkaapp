interface SMSOptions {
  to: string;
  message: string;
  from?: string;
  mediaUrl?: string[];
}

interface SMSResponse {
  sid: string;
  status: string;
  to: string;
  from: string;
  body: string;
  dateCreated: Date;
}

class SMSService {
  private initialized = false;
  private client: any;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      console.warn('Twilio credentials not found. SMS functionality will be disabled.');
      return;
    }

    try {
      // Import Twilio dynamically to avoid errors if not installed
      const twilio = require('twilio');
      this.client = twilio(accountSid, authToken);
      this.initialized = true;
    } catch (error) {
      console.warn('Twilio SDK not available. SMS functionality will be disabled.');
    }
  }

  async sendSMS(options: SMSOptions): Promise<SMSResponse> {
    if (!this.initialized) {
      throw new Error('SMS service not initialized. Please check your Twilio credentials.');
    }

    const {
      to,
      message,
      from = process.env.TWILIO_PHONE_NUMBER,
      mediaUrl
    } = options;

    if (!from) {
      throw new Error('No Twilio phone number configured.');
    }

    try {
      const messageOptions: any = {
        body: message,
        from,
        to: this.formatPhoneNumber(to)
      };

      if (mediaUrl && mediaUrl.length > 0) {
        messageOptions.mediaUrl = mediaUrl;
      }

      const result = await this.client.messages.create(messageOptions);

      console.log(`SMS sent successfully to ${to}. SID: ${result.sid}`);

      return {
        sid: result.sid,
        status: result.status,
        to: result.to,
        from: result.from,
        body: result.body,
        dateCreated: result.dateCreated
      };
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }

  async sendBulkSMS(messages: SMSOptions[]): Promise<SMSResponse[]> {
    if (!this.initialized) {
      throw new Error('SMS service not initialized. Please check your Twilio credentials.');
    }

    const results: SMSResponse[] = [];
    const errors: any[] = [];

    for (const messageOptions of messages) {
      try {
        const result = await this.sendSMS(messageOptions);
        results.push(result);
      } catch (error) {
        errors.push({ messageOptions, error });
      }
    }

    if (errors.length > 0) {
      console.warn(`${errors.length} SMS messages failed to send:`, errors);
    }

    console.log(`Bulk SMS completed. ${results.length} sent, ${errors.length} failed.`);
    return results;
  }

  // Pre-defined SMS templates for common workflow scenarios
  async sendEscalationSMS(to: string, customerName: string, issueType: string): Promise<SMSResponse> {
    const message = `🚨 ESCALATION: Customer ${customerName} needs immediate attention regarding ${issueType}. Please respond within 15 minutes. - ROMASHKA`;
    
    return this.sendSMS({
      to,
      message
    });
  }

  async sendCustomerNotificationSMS(
    to: string,
    notificationType: 'order_delay' | 'appointment_reminder' | 'follow_up',
    data: any
  ): Promise<SMSResponse> {
    let message: string;

    switch (notificationType) {
      case 'order_delay':
        message = `Hi ${data.customer_name}! Your order #${data.order_id} is delayed. New expected delivery: ${data.expected_delivery}. ${data.compensation ? `We've added a discount to your account as an apology.` : ''} - ROMASHKA`;
        break;

      case 'appointment_reminder':
        message = `Reminder: You have an appointment with ${data.agent_name} at ${data.appointment_time} on ${data.appointment_date}. Reply CONFIRM to confirm or RESCHEDULE to change. - ROMASHKA`;
        break;

      case 'follow_up':
        message = `Hi ${data.customer_name}! Following up on your recent inquiry about ${data.topic}. ${data.update_message} Need help? Reply to this message. - ROMASHKA`;
        break;

      default:
        throw new Error(`Unknown notification type: ${notificationType}`);
    }

    return this.sendSMS({
      to,
      message
    });
  }

  async sendVerificationCode(to: string, code: string): Promise<SMSResponse> {
    const message = `Your ROMASHKA verification code is: ${code}. This code expires in 10 minutes. Do not share this code with anyone.`;
    
    return this.sendSMS({
      to,
      message
    });
  }

  async sendWelcomeSMS(to: string, customerName: string): Promise<SMSResponse> {
    const message = `Welcome to ROMASHKA, ${customerName}! 🎉 We're excited to help you. Reply HELP for assistance or STOP to unsubscribe.`;
    
    return this.sendSMS({
      to,
      message
    });
  }

  // Utility methods
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present (assumes US)
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('+')) {
      return phoneNumber;
    }
    
    return `+${cleaned}`;
  }

  isValidPhoneNumber(phoneNumber: string): boolean {
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  }

  async getMessageStatus(messageSid: string): Promise<any> {
    if (!this.initialized) {
      throw new Error('SMS service not initialized.');
    }

    try {
      const message = await this.client.messages(messageSid).fetch();
      return {
        sid: message.sid,
        status: message.status,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
        dateCreated: message.dateCreated,
        dateUpdated: message.dateUpdated,
        dateSent: message.dateSent
      };
    } catch (error) {
      console.error('Error fetching message status:', error);
      throw error;
    }
  }

  // Method to handle incoming SMS webhooks (for two-way communication)
  handleIncomingSMS(webhookData: any): {
    from: string;
    to: string;
    body: string;
    messageSid: string;
  } {
    return {
      from: webhookData.From,
      to: webhookData.To,
      body: webhookData.Body,
      messageSid: webhookData.MessageSid
    };
  }

  // Auto-reply functionality
  async sendAutoReply(to: string, originalMessage: string): Promise<SMSResponse> {
    let replyMessage: string;

    const lowerMessage = originalMessage.toLowerCase();

    if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      replyMessage = "Thanks for reaching out! Our support team will respond shortly. For immediate help, visit romashka.com/help or call (555) 123-4567.";
    } else if (lowerMessage.includes('hours') || lowerMessage.includes('open')) {
      replyMessage = "Our support hours are Monday-Friday 9AM-6PM EST. For 24/7 help, visit our help center at romashka.com/help.";
    } else if (lowerMessage.includes('stop') || lowerMessage.includes('unsubscribe')) {
      replyMessage = "You've been unsubscribed from ROMASHKA SMS notifications. You can re-subscribe anytime in your account settings.";
    } else if (lowerMessage.includes('confirm')) {
      replyMessage = "Thank you for confirming! We've updated your appointment. You'll receive a reminder 24 hours before your scheduled time.";
    } else if (lowerMessage.includes('reschedule')) {
      replyMessage = "No problem! Please visit romashka.com/reschedule or call (555) 123-4567 to reschedule your appointment.";
    } else {
      replyMessage = "Thanks for your message! Our team will respond within 2 hours during business hours. For immediate help, visit romashka.com/help.";
    }

    return this.sendSMS({
      to,
      message: replyMessage
    });
  }

  // Analytics method
  async getSMSAnalytics(startDate: Date, endDate: Date): Promise<any> {
    if (!this.initialized) {
      throw new Error('SMS service not initialized.');
    }

    try {
      // This would use Twilio's usage API to get analytics
      console.log('SMS analytics requested for:', { startDate, endDate });
      
      // Placeholder implementation
      return {
        sent: 0,
        delivered: 0,
        failed: 0,
        undelivered: 0,
        cost: 0
      };
    } catch (error) {
      console.error('Error fetching SMS analytics:', error);
      throw error;
    }
  }
}

// Export singleton instance
const smsService = new SMSService();

// Export main functions for workflow engine
export const sendSMSNotification = (to: string, message: string, mediaUrl?: string[]) => 
  smsService.sendSMS({ to, message, mediaUrl });

export const sendBulkSMS = (messages: SMSOptions[]) => smsService.sendBulkSMS(messages);

export const sendEscalationSMS = (to: string, customerName: string, issueType: string) =>
  smsService.sendEscalationSMS(to, customerName, issueType);

export const sendCustomerNotificationSMS = (
  to: string, 
  notificationType: 'order_delay' | 'appointment_reminder' | 'follow_up', 
  data: any
) => smsService.sendCustomerNotificationSMS(to, notificationType, data);

export const sendVerificationCode = (to: string, code: string) =>
  smsService.sendVerificationCode(to, code);

export const sendWelcomeSMS = (to: string, customerName: string) =>
  smsService.sendWelcomeSMS(to, customerName);

export const handleIncomingSMS = (webhookData: any) => smsService.handleIncomingSMS(webhookData);

export const sendAutoReply = (to: string, originalMessage: string) =>
  smsService.sendAutoReply(to, originalMessage);

export default smsService;