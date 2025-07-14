import { BaseChannelService } from './baseChannelService';
import { WhatsAppService } from './whatsappService';
import { InstagramService } from './instagramService';
import { EmailService } from './emailService';
import { WidgetService } from './widgetService';
import type { 
  ChannelType, 
  MessageContent, 
  DeliveryStatus, 
  ChannelConfig,
  CustomerIdentity,
  ConversationContext,
  UnifiedConversation,
  ChannelAnalytics,
  RoutingRule,
  WhatsAppConfig,
  InstagramConfig,
  EmailConfig
} from './types';

export interface UnifiedChannelConfig {
  whatsapp?: WhatsAppConfig;
  instagram?: InstagramConfig;
  email?: EmailConfig;
  sendgridApiKey?: string;
  widget?: {
    enabled: boolean;
    projectId: string;
  };
}

export interface ChannelMetrics {
  totalMessages: number;
  averageResponseTime: number;
  satisfactionScore: number;
  activeConversations: number;
  messagesByChannel: Record<ChannelType, number>;
  responseTimesByChannel: Record<ChannelType, number>;
  conversionRatesByChannel: Record<ChannelType, number>;
}

export interface CrossChannelConversation {
  id: string;
  customerId: string;
  customerIdentity: CustomerIdentity;
  channels: Array<{
    type: ChannelType;
    service: BaseChannelService;
    conversationId: string;
    lastActivity: Date;
    messageCount: number;
    unreadCount: number;
    status: 'active' | 'paused' | 'closed';
  }>;
  primaryChannel: ChannelType;
  assignedAgentId?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  tags: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class UnifiedChannelManager {
  private channels: Map<ChannelType, BaseChannelService> = new Map();
  private conversations: Map<string, CrossChannelConversation> = new Map();
  private routingRules: RoutingRule[] = [];
  private customerProfiles: Map<string, CustomerIdentity> = new Map();
  private config: UnifiedChannelConfig;

  constructor(config: UnifiedChannelConfig) {
    this.config = config;
    this.initializeChannels();
  }

  private initializeChannels(): void {
    // Initialize WhatsApp
    if (this.config.whatsapp) {
      const whatsappService = new WhatsAppService(this.config.whatsapp);
      this.channels.set('whatsapp', whatsappService);
    }

    // Initialize Instagram
    if (this.config.instagram) {
      const instagramService = new InstagramService(this.config.instagram);
      this.channels.set('instagram', instagramService);
    }

    // Initialize Email
    if (this.config.email && this.config.sendgridApiKey) {
      const emailService = new EmailService(this.config.email, this.config.sendgridApiKey);
      this.channels.set('email', emailService);
    }

    // Initialize Widget
    if (this.config.widget?.enabled) {
      const widgetService = new WidgetService();
      this.channels.set('website', widgetService);
    }
  }

  // Channel Management
  async addChannel(type: ChannelType, service: BaseChannelService): Promise<void> {
    this.channels.set(type, service);
  }

  async removeChannel(type: ChannelType): Promise<void> {
    this.channels.delete(type);
  }

  getChannel(type: ChannelType): BaseChannelService | undefined {
    return this.channels.get(type);
  }

  getAllChannels(): Map<ChannelType, BaseChannelService> {
    return this.channels;
  }

  // Unified Messaging
  async sendMessage(
    conversationId: string,
    content: MessageContent,
    targetChannel?: ChannelType,
    context?: ConversationContext
  ): Promise<{ messageId: string; channel: ChannelType; success: boolean }[]> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const results: { messageId: string; channel: ChannelType; success: boolean }[] = [];

    // Determine target channels
    const targetChannels = targetChannel 
      ? [targetChannel] 
      : this.determineOptimalChannels(conversation, content);

    for (const channelType of targetChannels) {
      const channelInfo = conversation.channels.find(ch => ch.type === channelType);
      if (!channelInfo) continue;

      const service = this.channels.get(channelType);
      if (!service) continue;

      try {
        let messageId: string;
        
        // Handle different channel types
        if (channelType === 'website') {
          // For widget, use session ID
          messageId = await (service as WidgetService).sendMessage(
            channelInfo.conversationId,
            content,
            context
          );
        } else {
          // For other channels, use customer identifier
          const customerIdentifier = this.getCustomerIdentifier(
            conversation.customerIdentity,
            channelType
          );
          messageId = await service.sendMessage(customerIdentifier, content, context);
        }

        results.push({
          messageId,
          channel: channelType,
          success: true
        });

        // Update conversation metrics
        channelInfo.messageCount++;
        channelInfo.lastActivity = new Date();
        conversation.updatedAt = new Date();

      } catch (error) {
        console.error(`Failed to send message via ${channelType}:`, error);
        results.push({
          messageId: '',
          channel: channelType,
          success: false
        });
      }
    }

    return results;
  }

  // Conversation Management
  async createConversation(
    customerIdentity: CustomerIdentity,
    initialChannel: ChannelType,
    initialMessage?: MessageContent
  ): Promise<CrossChannelConversation> {
    const conversationId = this.generateConversationId();
    const customerId = customerIdentity.id || this.generateCustomerId();

    const conversation: CrossChannelConversation = {
      id: conversationId,
      customerId,
      customerIdentity,
      channels: [{
        type: initialChannel,
        service: this.channels.get(initialChannel)!,
        conversationId: this.generateChannelConversationId(initialChannel),
        lastActivity: new Date(),
        messageCount: 0,
        unreadCount: 0,
        status: 'active'
      }],
      primaryChannel: initialChannel,
      priority: 'normal',
      tags: [],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.conversations.set(conversationId, conversation);
    this.customerProfiles.set(customerId, customerIdentity);

    // Send initial message if provided
    if (initialMessage) {
      await this.sendMessage(conversationId, initialMessage, initialChannel);
    }

    return conversation;
  }

  async addChannelToConversation(
    conversationId: string,
    channelType: ChannelType
  ): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Check if channel already exists
    const existingChannel = conversation.channels.find(ch => ch.type === channelType);
    if (existingChannel) {
      return;
    }

    const service = this.channels.get(channelType);
    if (!service) {
      throw new Error(`Channel ${channelType} not configured`);
    }

    conversation.channels.push({
      type: channelType,
      service,
      conversationId: this.generateChannelConversationId(channelType),
      lastActivity: new Date(),
      messageCount: 0,
      unreadCount: 0,
      status: 'active'
    });

    conversation.updatedAt = new Date();
    this.conversations.set(conversationId, conversation);
  }

  async mergeConversations(
    primaryConversationId: string,
    secondaryConversationId: string
  ): Promise<CrossChannelConversation> {
    const primaryConversation = this.conversations.get(primaryConversationId);
    const secondaryConversation = this.conversations.get(secondaryConversationId);

    if (!primaryConversation || !secondaryConversation) {
      throw new Error('One or both conversations not found');
    }

    // Merge channels
    for (const channel of secondaryConversation.channels) {
      const existingChannel = primaryConversation.channels.find(ch => ch.type === channel.type);
      if (!existingChannel) {
        primaryConversation.channels.push(channel);
      } else {
        // Merge metrics
        existingChannel.messageCount += channel.messageCount;
        existingChannel.unreadCount += channel.unreadCount;
        existingChannel.lastActivity = new Date(Math.max(
          existingChannel.lastActivity.getTime(),
          channel.lastActivity.getTime()
        ));
      }
    }

    // Merge tags and metadata
    primaryConversation.tags = [...new Set([...primaryConversation.tags, ...secondaryConversation.tags])];
    primaryConversation.metadata = { ...secondaryConversation.metadata, ...primaryConversation.metadata };
    primaryConversation.updatedAt = new Date();

    // Update customer identity with merged data
    const mergedIdentity = this.mergeCustomerIdentities(
      primaryConversation.customerIdentity,
      secondaryConversation.customerIdentity
    );
    primaryConversation.customerIdentity = mergedIdentity;
    this.customerProfiles.set(primaryConversation.customerId, mergedIdentity);

    // Remove secondary conversation
    this.conversations.delete(secondaryConversationId);

    return primaryConversation;
  }

  async getConversation(conversationId: string): Promise<CrossChannelConversation | null> {
    return this.conversations.get(conversationId) || null;
  }

  async getConversationsByCustomer(customerId: string): Promise<CrossChannelConversation[]> {
    return Array.from(this.conversations.values())
      .filter(conv => conv.customerId === customerId);
  }

  async getAllConversations(): Promise<CrossChannelConversation[]> {
    return Array.from(this.conversations.values());
  }

  // Customer Identity Management
  async identifyCustomer(
    channelType: ChannelType,
    channelIdentifier: string
  ): Promise<CustomerIdentity | null> {
    const service = this.channels.get(channelType);
    if (!service) return null;

    try {
      const profile = await service.getUserProfile(channelIdentifier);
      
      // Check if customer exists in our system
      const existingCustomer = this.findCustomerByIdentifier(channelType, channelIdentifier);
      if (existingCustomer) {
        return this.mergeCustomerIdentities(existingCustomer, profile);
      }

      return profile;
    } catch (error) {
      console.error(`Failed to identify customer on ${channelType}:`, error);
      return null;
    }
  }

  private findCustomerByIdentifier(channelType: ChannelType, identifier: string): CustomerIdentity | null {
    for (const customer of this.customerProfiles.values()) {
      switch (channelType) {
        case 'whatsapp':
        case 'sms':
          if (customer.phone === identifier) return customer;
          break;
        case 'email':
          if (customer.email === identifier) return customer;
          break;
        case 'instagram':
        case 'website':
          if (customer.socialId === identifier) return customer;
          break;
      }
    }
    return null;
  }

  private mergeCustomerIdentities(
    primary: CustomerIdentity,
    secondary: CustomerIdentity
  ): CustomerIdentity {
    return {
      ...primary,
      email: primary.email || secondary.email,
      phone: primary.phone || secondary.phone,
      socialId: primary.socialId || secondary.socialId,
      name: primary.name || secondary.name,
      channels: [...new Set([...primary.channels, ...secondary.channels])]
    };
  }

  // Routing and Escalation
  async addRoutingRule(rule: RoutingRule): Promise<void> {
    this.routingRules.push(rule);
    this.routingRules.sort((a, b) => b.priority - a.priority);
  }

  async removeRoutingRule(ruleId: string): Promise<void> {
    this.routingRules = this.routingRules.filter(rule => rule.id !== ruleId);
  }

  private determineOptimalChannels(
    conversation: CrossChannelConversation,
    content: MessageContent
  ): ChannelType[] {
    // Apply routing rules
    for (const rule of this.routingRules) {
      if (this.evaluateRoutingConditions(rule.conditions, conversation, content)) {
        return [rule.targetChannelType];
      }
    }

    // Default to primary channel
    return [conversation.primaryChannel];
  }

  private evaluateRoutingConditions(
    conditions: Record<string, any>,
    conversation: CrossChannelConversation,
    content: MessageContent
  ): boolean {
    // Implement routing logic based on conditions
    // This is a simplified version
    if (conditions.priority && conversation.priority !== conditions.priority) {
      return false;
    }

    if (conditions.customerType && !conversation.tags.includes(conditions.customerType)) {
      return false;
    }

    if (conditions.contentType && content.media?.type !== conditions.contentType) {
      return false;
    }

    return true;
  }

  private getCustomerIdentifier(identity: CustomerIdentity, channel: ChannelType): string {
    switch (channel) {
      case 'whatsapp':
      case 'sms':
        return identity.phone || '';
      case 'email':
        return identity.email || '';
      case 'instagram':
        return identity.socialId || '';
      case 'website':
        return identity.id || '';
      default:
        return identity.id || '';
    }
  }

  // Analytics and Reporting
  async getChannelAnalytics(
    timeRange: { start: Date; end: Date },
    channelType?: ChannelType
  ): Promise<ChannelAnalytics[]> {
    const conversations = Array.from(this.conversations.values())
      .filter(conv => conv.createdAt >= timeRange.start && conv.createdAt <= timeRange.end);

    const analytics: ChannelAnalytics[] = [];

    for (const [type, service] of this.channels) {
      if (channelType && type !== channelType) continue;

      const channelConversations = conversations.filter(
        conv => conv.channels.some(ch => ch.type === type)
      );

      const totalMessages = channelConversations.reduce(
        (sum, conv) => sum + conv.channels.find(ch => ch.type === type)?.messageCount || 0,
        0
      );

      analytics.push({
        channelType: type,
        messageCount: totalMessages,
        responseTime: await this.calculateAverageResponseTime(type, timeRange),
        satisfactionScore: await this.calculateSatisfactionScore(type, timeRange),
        costPerMessage: await this.calculateCostPerMessage(type),
        deliveryRate: await this.calculateDeliveryRate(type, timeRange),
        readRate: await this.calculateReadRate(type, timeRange)
      });
    }

    return analytics;
  }

  async getUnifiedMetrics(timeRange: { start: Date; end: Date }): Promise<ChannelMetrics> {
    const conversations = Array.from(this.conversations.values())
      .filter(conv => conv.createdAt >= timeRange.start && conv.createdAt <= timeRange.end);

    const totalMessages = conversations.reduce(
      (sum, conv) => sum + conv.channels.reduce((chSum, ch) => chSum + ch.messageCount, 0),
      0
    );

    const activeConversations = conversations.filter(
      conv => conv.channels.some(ch => ch.status === 'active')
    ).length;

    const messagesByChannel: Record<ChannelType, number> = {
      whatsapp: 0,
      instagram: 0,
      email: 0,
      website: 0,
      sms: 0,
      messenger: 0
    };

    const responseTimesByChannel: Record<ChannelType, number> = {
      whatsapp: 0,
      instagram: 0,
      email: 0,
      website: 0,
      sms: 0,
      messenger: 0
    };

    const conversionRatesByChannel: Record<ChannelType, number> = {
      whatsapp: 0,
      instagram: 0,
      email: 0,
      website: 0,
      sms: 0,
      messenger: 0
    };

    // Calculate per-channel metrics
    for (const conversation of conversations) {
      for (const channel of conversation.channels) {
        messagesByChannel[channel.type] += channel.messageCount;
      }
    }

    // Calculate response times and conversion rates
    for (const [type] of this.channels) {
      responseTimesByChannel[type] = await this.calculateAverageResponseTime(type, timeRange);
      conversionRatesByChannel[type] = await this.calculateConversionRate(type, timeRange);
    }

    return {
      totalMessages,
      averageResponseTime: await this.calculateOverallAverageResponseTime(timeRange),
      satisfactionScore: await this.calculateOverallSatisfactionScore(timeRange),
      activeConversations,
      messagesByChannel,
      responseTimesByChannel,
      conversionRatesByChannel
    };
  }

  // Webhook Handling
  async handleWebhook(channelType: ChannelType, payload: any, headers?: any): Promise<void> {
    const service = this.channels.get(channelType);
    if (!service) {
      throw new Error(`Channel ${channelType} not configured`);
    }

    try {
      await service.handleWebhook(payload, headers);
    } catch (error) {
      console.error(`Webhook handling failed for ${channelType}:`, error);
      throw error;
    }
  }

  // Utility Methods
  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCustomerId(): string {
    return `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateChannelConversationId(channelType: ChannelType): string {
    return `${channelType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Analytics Helper Methods
  private async calculateAverageResponseTime(
    channelType: ChannelType,
    timeRange: { start: Date; end: Date }
  ): Promise<number> {
    // Implementation depends on your message storage system
    // This is a placeholder
    return 300; // 5 minutes in seconds
  }

  private async calculateSatisfactionScore(
    channelType: ChannelType,
    timeRange: { start: Date; end: Date }
  ): Promise<number> {
    // Implementation depends on your satisfaction tracking system
    // This is a placeholder
    return 4.5; // out of 5
  }

  private async calculateCostPerMessage(channelType: ChannelType): Promise<number> {
    // Implementation depends on your cost tracking system
    // This is a placeholder
    const costs = {
      whatsapp: 0.05,
      instagram: 0.02,
      email: 0.01,
      website: 0.005,
      sms: 0.03,
      messenger: 0.02
    };
    return costs[channelType] || 0;
  }

  private async calculateDeliveryRate(
    channelType: ChannelType,
    timeRange: { start: Date; end: Date }
  ): Promise<number> {
    // Implementation depends on your delivery tracking system
    // This is a placeholder
    return 0.98; // 98% delivery rate
  }

  private async calculateReadRate(
    channelType: ChannelType,
    timeRange: { start: Date; end: Date }
  ): Promise<number> {
    // Implementation depends on your read tracking system
    // This is a placeholder
    return 0.85; // 85% read rate
  }

  private async calculateConversionRate(
    channelType: ChannelType,
    timeRange: { start: Date; end: Date }
  ): Promise<number> {
    // Implementation depends on your conversion tracking system
    // This is a placeholder
    return 0.15; // 15% conversion rate
  }

  private async calculateOverallAverageResponseTime(
    timeRange: { start: Date; end: Date }
  ): Promise<number> {
    // Implementation depends on your analytics system
    // This is a placeholder
    return 240; // 4 minutes in seconds
  }

  private async calculateOverallSatisfactionScore(
    timeRange: { start: Date; end: Date }
  ): Promise<number> {
    // Implementation depends on your analytics system
    // This is a placeholder
    return 4.3; // out of 5
  }
}