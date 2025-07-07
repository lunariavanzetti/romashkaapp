import type { 
  ChannelType, 
  MessageContent, 
  DeliveryStatus, 
  ChannelCapabilities,
  CustomerIdentity,
  ConversationContext 
} from './types';

export abstract class BaseChannelService {
  protected config: any;
  protected channelType: ChannelType;

  constructor(channelType: ChannelType, config: any) {
    this.channelType = channelType;
    this.config = config;
  }

  abstract getCapabilities(): ChannelCapabilities;
  
  abstract sendMessage(
    to: string, 
    content: MessageContent, 
    context?: ConversationContext
  ): Promise<string>;
  
  abstract handleWebhook(payload: any, headers?: any): Promise<void>;
  
  abstract validateWebhookSignature(payload: string, signature: string): Promise<boolean>;
  
  abstract getDeliveryStatus(messageId: string): Promise<DeliveryStatus>;
  
  abstract markMessageAsRead(messageId: string): Promise<boolean>;
  
  abstract setTypingIndicator(recipientId: string, action: 'typing_on' | 'typing_off'): Promise<void>;
  
  abstract getUserProfile(userId: string): Promise<CustomerIdentity>;
  
  abstract getMediaUrl(mediaId: string): Promise<string>;
  
  // Common utility methods
  protected async validateConfig(): Promise<boolean> {
    if (!this.config) {
      throw new Error(`Configuration is required for ${this.channelType} channel`);
    }
    return true;
  }
  
  protected async logWebhookEvent(eventType: string, payload: any): Promise<void> {
    try {
      const { supabase } = await import('../supabaseClient');
      if (!supabase) return;
      await supabase.from('webhook_events').insert({
        channel_id: this.config.id,
        event_type: eventType,
        payload: payload,
        processed: false
      });
    } catch (error) {
      console.error('Failed to log webhook event:', error);
    }
  }
  
  protected async updateDeliveryStatus(
    messageId: string, 
    status: DeliveryStatus['status'], 
    externalMessageId?: string
  ): Promise<void> {
    try {
      const { supabase } = await import('../supabaseClient');
      if (!supabase) return;
      await supabase.from('message_delivery_tracking').insert({
        message_id: messageId,
        channel_type: this.channelType,
        external_message_id: externalMessageId,
        delivery_status: status,
        delivery_timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to update delivery status:', error);
    }
  }
  
  protected async incrementMessageCount(): Promise<void> {
    try {
      const { supabase } = await import('../supabaseClient');
      if (!supabase) return;
      await supabase
        .from('communication_channels')
        .update({ 
          messages_sent_today: supabase.rpc('increment', { n: 1 }) 
        })
        .eq('id', this.config.id);
    } catch (error) {
      console.error('Failed to increment message count:', error);
    }
  }
  
  protected async checkRateLimit(): Promise<boolean> {
    try {
      const { supabase } = await import('../supabaseClient');
      if (!supabase) return false;
      const { data } = await supabase
        .from('communication_channels')
        .select('messages_sent_today, message_limit_per_day')
        .eq('id', this.config.id)
        .single();
      
      if (!data) return false;
      
      return data.messages_sent_today < data.message_limit_per_day;
    } catch (error) {
      console.error('Failed to check rate limit:', error);
      return false;
    }
  }
  
  protected async resetDailyCount(): Promise<void> {
    try {
      const { supabase } = await import('../supabaseClient');
      if (!supabase) return;
      const today = new Date().toISOString().split('T')[0];
      
      await supabase
        .from('communication_channels')
        .update({ 
          messages_sent_today: 0,
          last_reset_date: today
        })
        .eq('id', this.config.id)
        .lt('last_reset_date', today);
    } catch (error) {
      console.error('Failed to reset daily count:', error);
    }
  }
  
  protected async findOrCreateConversation(
    customerIdentity: CustomerIdentity,
    externalConversationId?: string
  ): Promise<string> {
    try {
      const { supabase } = await import('../supabaseClient');
      if (!supabase) throw new Error('Supabase client not available');
      
      // Try to find existing conversation
      let { data: conversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('channel_type', this.channelType)
        .or(`customer_phone.eq.${customerIdentity.phone},customer_social_id.eq.${customerIdentity.socialId}`)
        .single();
      
      if (!conversation) {
        // Create new conversation
        const { data: newConversation } = await supabase
          .from('conversations')
          .insert({
            channel_type: this.channelType,
            channel_id: this.config.id,
            external_conversation_id: externalConversationId,
            customer_phone: customerIdentity.phone,
            customer_social_id: customerIdentity.socialId,
            status: 'active'
          })
          .select('id')
          .single();
        
        if (!newConversation) throw new Error('Failed to create conversation');
        conversation = newConversation;
      }
      
      return conversation.id;
    } catch (error) {
      console.error('Failed to find or create conversation:', error);
      throw error;
    }
  }
  
  protected async saveMessage(
    conversationId: string,
    content: MessageContent,
    isFromCustomer: boolean,
    externalMessageId?: string
  ): Promise<string> {
    try {
      const { supabase } = await import('../supabaseClient');
      if (!supabase) throw new Error('Supabase client not available');
      
      const { data: message } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content: content.text || '',
          role: isFromCustomer ? 'user' : 'assistant',
          channel_type: this.channelType,
          external_message_id: externalMessageId,
          message_type: content.media ? content.media.type : 'text',
          media_url: content.media?.url,
          media_caption: content.media?.caption,
          delivery_status: isFromCustomer ? 'delivered' : 'sent'
        })
        .select('id')
        .single();
      
      if (!message) throw new Error('Failed to save message');
      return message.id;
    } catch (error) {
      console.error('Failed to save message:', error);
      throw error;
    }
  }
} 