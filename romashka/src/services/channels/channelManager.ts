import { BaseChannelService } from './baseChannelService';
import { WhatsAppService } from './whatsappService';
import type { 
  ChannelType, 
  MessageContent, 
  DeliveryStatus, 
  ChannelCapabilities,
  CustomerIdentity,
  ConversationContext,
  UnifiedConversation,
  ChannelConfig,
  RoutingRule
} from './types';

export class ChannelManager {
  private channels: Map<ChannelType, BaseChannelService> = new Map();
  private configs: Map<ChannelType, ChannelConfig> = new Map();

  async registerChannel(channelType: ChannelType, config: any): Promise<void> {
    try {
      let service: BaseChannelService;

      switch (channelType) {
        case 'whatsapp':
          service = new WhatsAppService(config);
          break;
        case 'messenger':
          // TODO: Implement MessengerService
          throw new Error('Messenger service not implemented yet');
        case 'instagram':
          // TODO: Implement InstagramService
          throw new Error('Instagram service not implemented yet');
        case 'email':
          // TODO: Implement EmailService
          throw new Error('Email service not implemented yet');
        case 'sms':
          // TODO: Implement SMSService
          throw new Error('SMS service not implemented yet');
        case 'website':
          // TODO: Implement WebsiteService
          throw new Error('Website service not implemented yet');
        default:
          throw new Error(`Unsupported channel type: ${channelType}`);
      }

      this.channels.set(channelType, service);
      this.configs.set(channelType, {
        id: config.id || '',
        name: config.name || channelType,
        type: channelType,
        status: 'active',
        configuration: config,
        message_limit_per_day: config.message_limit_per_day || 1000,
        messages_sent_today: 0
      });

      console.log(`Registered ${channelType} channel`);
    } catch (error) {
      console.error(`Failed to register ${channelType} channel:`, error);
      throw error;
    }
  }

  async sendMessage(
    conversationId: string, 
    content: MessageContent, 
    context?: ConversationContext
  ): Promise<string> {
    const channelType = context?.channelType || 'website';
    const service = this.channels.get(channelType);

    if (!service) {
      throw new Error(`Channel ${channelType} not registered`);
    }

    return await service.sendMessage(conversationId, content, context);
  }

  async handleIncomingMessage(channelType: ChannelType, payload: any): Promise<void> {
    const service = this.channels.get(channelType);

    if (!service) {
      throw new Error(`Channel ${channelType} not registered`);
    }

    await service.handleWebhook(payload);
  }

  async getChannelCapabilities(channelType: ChannelType): Promise<ChannelCapabilities> {
    const service = this.channels.get(channelType);

    if (!service) {
      throw new Error(`Channel ${channelType} not registered`);
    }

    return service.getCapabilities();
  }

  async switchChannel(
    conversationId: string, 
    newChannelType: ChannelType
  ): Promise<boolean> {
    try {
      const { supabase } = await import('../supabaseClient');
      if (!supabase) return false;

      const { data: conversation } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (!conversation) return false;

      // Update conversation with new channel
      await supabase
        .from('conversations')
        .update({ channel_type: newChannelType })
        .eq('id', conversationId);

      return true;
    } catch (error) {
      console.error('Failed to switch channel:', error);
      return false;
    }
  }

  async syncMessageStatus(messageId: string, status: string): Promise<void> {
    try {
      const { supabase } = await import('../supabaseClient');
      if (!supabase) return;

      await supabase
        .from('messages')
        .update({ delivery_status: status })
        .eq('id', messageId);
    } catch (error) {
      console.error('Failed to sync message status:', error);
    }
  }

  async getUnifiedConversations(): Promise<UnifiedConversation[]> {
    try {
      const { supabase } = await import('../supabaseClient');
      if (!supabase) return [];

      // Get conversations grouped by customer identity
      const { data: conversations } = await supabase
        .from('conversations')
        .select(`
          id,
          channel_type,
          customer_phone,
          customer_social_id,
          assigned_agent_id,
          priority,
          tags,
          updated_at,
          messages (
            id,
            created_at,
            role
          )
        `)
        .order('updated_at', { ascending: false });

      if (!conversations) return [];

      // Group conversations by customer identity
      const customerGroups = new Map<string, UnifiedConversation>();

      for (const conv of conversations) {
        const customerKey = conv.customer_phone || conv.customer_social_id || conv.id;
        
        if (!customerGroups.has(customerKey)) {
          customerGroups.set(customerKey, {
            id: customerKey,
            customerIdentity: {
              phone: conv.customer_phone,
              socialId: conv.customer_social_id,
              channels: []
            },
            channels: [],
            assignedAgentId: conv.assigned_agent_id,
            priority: conv.priority || 'normal',
            tags: conv.tags || [],
            lastActivity: new Date(conv.updated_at),
            totalMessages: conv.messages?.length || 0
          });
        }

        const unified = customerGroups.get(customerKey)!;
        unified.channels.push({
          type: conv.channel_type as ChannelType,
          conversationId: conv.id,
          lastMessage: new Date(conv.updated_at),
          unreadCount: conv.messages?.filter(m => m.role === 'user').length || 0
        });

        if (!unified.customerIdentity.channels.includes(conv.channel_type as ChannelType)) {
          unified.customerIdentity.channels.push(conv.channel_type as ChannelType);
        }
      }

      return Array.from(customerGroups.values());
    } catch (error) {
      console.error('Failed to get unified conversations:', error);
      return [];
    }
  }

  async getChannelAnalytics(channelType: ChannelType): Promise<any> {
    try {
      const { supabase } = await import('../supabaseClient');
      if (!supabase) return null;

      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('channel_type', channelType)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (!messages) return null;

      const totalMessages = messages.length;
      const sentMessages = messages.filter(m => m.role === 'assistant').length;
      const receivedMessages = messages.filter(m => m.role === 'user').length;
      const deliveredMessages = messages.filter(m => m.delivery_status === 'delivered').length;
      const readMessages = messages.filter(m => m.delivery_status === 'read').length;

      return {
        channelType,
        totalMessages,
        sentMessages,
        receivedMessages,
        deliveryRate: totalMessages > 0 ? (deliveredMessages / totalMessages) * 100 : 0,
        readRate: totalMessages > 0 ? (readMessages / totalMessages) * 100 : 0,
        avgResponseTime: this.calculateAverageResponseTime(messages)
      };
    } catch (error) {
      console.error('Failed to get channel analytics:', error);
      return null;
    }
  }

  async getRoutingRules(): Promise<RoutingRule[]> {
    try {
      const { supabase } = await import('../supabaseClient');
      if (!supabase) return [];

      const { data: rules } = await supabase
        .from('channel_routing_rules')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      return rules || [];
    } catch (error) {
      console.error('Failed to get routing rules:', error);
      return [];
    }
  }

  async determineOptimalChannel(customerIdentity: CustomerIdentity, message: string): Promise<ChannelType> {
    try {
      const rules = await this.getRoutingRules();
      
      // Check business hours
      const now = new Date();
      const isBusinessHours = now.getHours() >= 9 && now.getHours() < 17 && now.getDay() >= 1 && now.getDay() <= 5;
      
      // Check message urgency
      const urgentKeywords = ['urgent', 'emergency', 'help', 'broken', 'issue'];
      const isUrgent = urgentKeywords.some(keyword => message.toLowerCase().includes(keyword));

      for (const rule of rules) {
        const conditions = rule.conditions;
        
        // Check if rule conditions match
        if (conditions.businessHours !== undefined && conditions.businessHours !== isBusinessHours) continue;
        if (conditions.urgent !== undefined && conditions.urgent !== isUrgent) continue;
        if (conditions.customerType && customerIdentity.channels.includes(conditions.customerType)) continue;

        // Check if target channel is available
        if (this.channels.has(rule.targetChannelType)) {
          return rule.targetChannelType;
        }
      }

      // Default to customer's preferred channel or website
      return customerIdentity.channels[0] || 'website';
    } catch (error) {
      console.error('Failed to determine optimal channel:', error);
      return 'website';
    }
  }

  private calculateAverageResponseTime(messages: any[]): number {
    let totalTime = 0;
    let responseCount = 0;

    for (let i = 1; i < messages.length; i++) {
      const currentMessage = messages[i];
      const previousMessage = messages[i - 1];

      if (currentMessage.role === 'assistant' && previousMessage.role === 'user') {
        const responseTime = new Date(currentMessage.created_at).getTime() - new Date(previousMessage.created_at).getTime();
        totalTime += responseTime;
        responseCount++;
      }
    }

    return responseCount > 0 ? totalTime / responseCount : 0;
  }

  async getRegisteredChannels(): Promise<ChannelType[]> {
    return Array.from(this.channels.keys());
  }

  async isChannelAvailable(channelType: ChannelType): Promise<boolean> {
    return this.channels.has(channelType);
  }
} 