import { BaseChannelService } from './baseChannelService';
import type { 
  ChannelType, 
  MessageContent, 
  DeliveryStatus, 
  ChannelCapabilities,
  CustomerIdentity,
  ConversationContext
} from './types';

export interface WidgetConfig {
  projectId: string;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  secondaryColor: string;
  title: string;
  subtitle: string;
  welcomeMessage: string;
  showBranding: boolean;
  autoOpen: boolean;
  zIndex: number;
  allowedDomains: string[];
  customFields: Array<{
    name: string;
    type: 'text' | 'email' | 'phone' | 'number';
    required: boolean;
  }>;
  proactiveTriggers: {
    timeDelay?: number;
    scrollPercentage?: number;
    exitIntent?: boolean;
  };
  offlineForm: {
    enabled: boolean;
    fields: string[];
    message: string;
  };
}

export interface WidgetMessage {
  sessionId: string;
  visitorId: string;
  content: MessageContent;
  timestamp: Date;
  visitorInfo: {
    userAgent: string;
    ip: string;
    referrer: string;
    url: string;
    customData?: Record<string, any>;
  };
}

export interface WidgetSession {
  id: string;
  projectId: string;
  visitorId: string;
  conversationId: string;
  isActive: boolean;
  startTime: Date;
  lastActivity: Date;
  pageViews: number;
  visitorInfo: {
    userAgent: string;
    ip: string;
    country?: string;
    city?: string;
    referrer: string;
    initialUrl: string;
    customData?: Record<string, any>;
  };
}

export class WidgetService extends BaseChannelService {
  private sessions: Map<string, WidgetSession> = new Map();
  private projectConfigs: Map<string, WidgetConfig> = new Map();

  constructor() {
    super('website', {});
  }

  getCapabilities(): ChannelCapabilities {
    return {
      supportsMedia: true,
      supportsQuickReplies: true,
      supportsTemplates: false,
      supportsTypingIndicator: true,
      supportsReadReceipts: true,
      maxMessageLength: 10000,
      supportedMediaTypes: ['image', 'document', 'audio', 'video'],
      supportsButtons: true,
      supportsLocation: false
    };
  }

  async sendMessage(
    sessionId: string, 
    content: MessageContent, 
    context?: ConversationContext
  ): Promise<string> {
    await this.validateConfig();
    await this.checkRateLimit();

    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error('Invalid session ID');
      }

      const messageId = `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Send message to widget client via WebSocket or Server-Sent Events
      await this.sendToWidget(sessionId, {
        type: 'message',
        id: messageId,
        content,
        timestamp: new Date(),
        fromAgent: true
      });

      // Update delivery status
      await this.updateDeliveryStatus(messageId, 'sent');
      await this.incrementMessageCount();

      // Save message to database
      if (context) {
        await this.saveMessage(context.conversationId, content, false, messageId);
      }

      return messageId;
    } catch (error) {
      console.error('Widget send message error:', error);
      throw error;
    }
  }

  async handleWebhook(payload: any, headers?: any): Promise<void> {
    try {
      await this.logWebhookEvent('widget_webhook', payload);

      switch (payload.type) {
        case 'message':
          await this.handleIncomingMessage(payload);
          break;
        case 'session_start':
          await this.handleSessionStart(payload);
          break;
        case 'session_end':
          await this.handleSessionEnd(payload);
          break;
        case 'typing':
          await this.handleTypingIndicator(payload);
          break;
        case 'page_view':
          await this.handlePageView(payload);
          break;
        case 'custom_event':
          await this.handleCustomEvent(payload);
          break;
        default:
          console.log('Unknown widget event:', payload.type);
      }
    } catch (error) {
      console.error('Widget webhook error:', error);
      throw error;
    }
  }

  async validateWebhookSignature(payload: string, signature: string): Promise<boolean> {
    // Widget communication is typically handled via WebSocket or SSE
    // For HTTP webhooks, implement signature validation based on your security requirements
    return true;
  }

  async getDeliveryStatus(messageId: string): Promise<DeliveryStatus> {
    try {
      // For widget messages, we can track delivery status in real-time
      return {
        messageId,
        status: 'delivered', // Assume delivered if session is active
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Widget delivery status error:', error);
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
      // Send read receipt to widget client
      const sessionId = this.extractSessionFromMessageId(messageId);
      if (sessionId) {
        await this.sendToWidget(sessionId, {
          type: 'read_receipt',
          messageId,
          timestamp: new Date()
        });
      }
      return true;
    } catch (error) {
      console.error('Widget mark as read error:', error);
      return false;
    }
  }

  async setTypingIndicator(sessionId: string, action: 'typing_on' | 'typing_off'): Promise<void> {
    try {
      await this.sendToWidget(sessionId, {
        type: 'typing_indicator',
        action,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Widget typing indicator error:', error);
    }
  }

  async getUserProfile(sessionId: string): Promise<CustomerIdentity> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Try to identify user from session data or custom fields
      const customData = session.visitorInfo.customData || {};
      
      return {
        id: session.visitorId,
        email: customData.email,
        name: customData.name || `Visitor ${session.visitorId.substr(0, 8)}`,
        phone: customData.phone,
        channels: ['website']
      };
    } catch (error) {
      console.error('Widget user profile error:', error);
      return {
        id: sessionId,
        channels: ['website']
      };
    }
  }

  async getMediaUrl(mediaId: string): Promise<string> {
    // Widget media is typically handled via file upload endpoints
    return `https://api.romashka.ai/widget/media/${mediaId}`;
  }

  // Widget-specific methods
  async initializeWidget(projectId: string, config: WidgetConfig): Promise<void> {
    this.projectConfigs.set(projectId, config);
  }

  async createSession(projectId: string, visitorInfo: any): Promise<WidgetSession> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const visitorId = visitorInfo.visitorId || `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create user profile
    const userProfile = await this.getUserProfile(sessionId);
    
    // Create conversation
    const conversationId = await this.findOrCreateConversation(userProfile, sessionId);

    const session: WidgetSession = {
      id: sessionId,
      projectId,
      visitorId,
      conversationId,
      isActive: true,
      startTime: new Date(),
      lastActivity: new Date(),
      pageViews: 1,
      visitorInfo: {
        userAgent: visitorInfo.userAgent,
        ip: visitorInfo.ip,
        country: visitorInfo.country,
        city: visitorInfo.city,
        referrer: visitorInfo.referrer,
        initialUrl: visitorInfo.url,
        customData: visitorInfo.customData
      }
    };

    this.sessions.set(sessionId, session);

    // Send welcome message if configured
    const config = this.projectConfigs.get(projectId);
    if (config?.welcomeMessage) {
      setTimeout(() => {
        this.sendMessage(sessionId, { text: config.welcomeMessage });
      }, 1000);
    }

    return session;
  }

  async updateSession(sessionId: string, updates: Partial<WidgetSession>): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      Object.assign(session, updates);
      session.lastActivity = new Date();
      this.sessions.set(sessionId, session);
    }
  }

  async endSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      session.lastActivity = new Date();
      this.sessions.set(sessionId, session);
    }
  }

  async handleProactiveTriggers(sessionId: string, trigger: string, data: any): Promise<void> {
    const session = this.sessions.get(sessionId);
    const config = this.projectConfigs.get(session?.projectId || '');
    
    if (!session || !config) return;

    let shouldTrigger = false;
    let proactiveMessage = '';

    switch (trigger) {
      case 'time_delay':
        if (config.proactiveTriggers.timeDelay && data.timeSpent >= config.proactiveTriggers.timeDelay) {
          shouldTrigger = true;
          proactiveMessage = 'Hi! I notice you\'ve been browsing for a while. Need any help?';
        }
        break;
      
      case 'scroll_percentage':
        if (config.proactiveTriggers.scrollPercentage && data.scrollPercentage >= config.proactiveTriggers.scrollPercentage) {
          shouldTrigger = true;
          proactiveMessage = 'Found something interesting? Let me know if you have any questions!';
        }
        break;
      
      case 'exit_intent':
        if (config.proactiveTriggers.exitIntent) {
          shouldTrigger = true;
          proactiveMessage = 'Wait! Before you go, is there anything I can help you with?';
        }
        break;
    }

    if (shouldTrigger) {
      await this.sendMessage(sessionId, { text: proactiveMessage });
    }
  }

  async collectOfflineForm(sessionId: string, formData: Record<string, any>): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const config = this.projectConfigs.get(session.projectId);
    if (!config?.offlineForm.enabled) return;

    // Save offline form data
    const userProfile: CustomerIdentity = {
      id: session.visitorId,
      email: formData.email,
      name: formData.name,
      phone: formData.phone,
      channels: ['website']
    };

    const conversationId = await this.findOrCreateConversation(userProfile, sessionId);

    const message: MessageContent = {
      text: `Offline form submission:\n${Object.entries(formData)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n')}`
    };

    await this.saveMessage(conversationId, message, true);

    // Send auto-response
    await this.sendMessage(sessionId, {
      text: config.offlineForm.message || 'Thank you for your message! We\'ll get back to you soon.'
    });
  }

  async getWidgetAnalytics(projectId: string, timeRange: { start: Date; end: Date }): Promise<any> {
    const sessions = Array.from(this.sessions.values()).filter(
      session => session.projectId === projectId &&
      session.startTime >= timeRange.start &&
      session.startTime <= timeRange.end
    );

    return {
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => s.isActive).length,
      averageSessionDuration: sessions.reduce((acc, s) => {
        const duration = s.lastActivity.getTime() - s.startTime.getTime();
        return acc + duration;
      }, 0) / sessions.length,
      totalPageViews: sessions.reduce((acc, s) => acc + s.pageViews, 0),
      conversionRate: sessions.filter(s => s.conversationId).length / sessions.length,
      topReferrers: this.getTopReferrers(sessions),
      topCountries: this.getTopCountries(sessions)
    };
  }

  private async handleIncomingMessage(payload: WidgetMessage): Promise<void> {
    try {
      const session = this.sessions.get(payload.sessionId);
      if (!session) {
        console.error('Session not found:', payload.sessionId);
        return;
      }

      // Update session activity
      await this.updateSession(payload.sessionId, { lastActivity: new Date() });

      // Get user profile
      const userProfile = await this.getUserProfile(payload.sessionId);

      // Save incoming message
      await this.saveMessage(session.conversationId, payload.content, true);

      // Trigger AI response
      await this.triggerAIResponse(session.conversationId, payload.content, payload.sessionId);
    } catch (error) {
      console.error('Widget incoming message error:', error);
    }
  }

  private async handleSessionStart(payload: any): Promise<void> {
    try {
      await this.createSession(payload.projectId, payload.visitorInfo);
    } catch (error) {
      console.error('Widget session start error:', error);
    }
  }

  private async handleSessionEnd(payload: any): Promise<void> {
    try {
      await this.endSession(payload.sessionId);
    } catch (error) {
      console.error('Widget session end error:', error);
    }
  }

  private async handleTypingIndicator(payload: any): Promise<void> {
    try {
      // Forward typing indicator to agents
      console.log('Visitor typing:', payload.sessionId);
    } catch (error) {
      console.error('Widget typing indicator error:', error);
    }
  }

  private async handlePageView(payload: any): Promise<void> {
    try {
      const session = this.sessions.get(payload.sessionId);
      if (session) {
        session.pageViews++;
        session.lastActivity = new Date();
        this.sessions.set(payload.sessionId, session);
      }
    } catch (error) {
      console.error('Widget page view error:', error);
    }
  }

  private async handleCustomEvent(payload: any): Promise<void> {
    try {
      // Handle custom events from widget
      console.log('Custom widget event:', payload.eventName, payload.data);
    } catch (error) {
      console.error('Widget custom event error:', error);
    }
  }

  private async sendToWidget(sessionId: string, message: any): Promise<void> {
    // This would send message to widget client via WebSocket/SSE
    // Implementation depends on your real-time communication setup
    console.log('Sending to widget:', sessionId, message);
  }

  private extractSessionFromMessageId(messageId: string): string | null {
    // Extract session ID from message ID format
    const match = messageId.match(/widget_(\d+)_/);
    return match ? match[1] : null;
  }

  private async triggerAIResponse(conversationId: string, content: MessageContent, sessionId: string): Promise<void> {
    try {
      // Import AI service dynamically to avoid circular dependencies
      const { aiService } = await import('../aiService');
      const { supabase } = await import('../supabaseClient');
      
      // Get user from session for integration bridge
      let user = null;
      try {
        const { data: { user: sessionUser } } = await supabase.auth.getUser();
        user = sessionUser;
        console.log('[Widget Service] User found for integration bridge:', user?.id);
      } catch (error) {
        console.warn('[Widget Service] Could not get user for integration bridge:', error);
      }
      
      const response = await aiService.generateResponse(
        content.text || 'Widget interaction',
        [], // empty knowledge base for now
        'en',
        user // pass user for integration bridge
      );

      if (response) {
        await this.sendMessage(sessionId, { text: response });
      }
    } catch (error) {
      console.error('Widget AI response error:', error);
    }
  }

  private getTopReferrers(sessions: WidgetSession[]): Array<{ referrer: string; count: number }> {
    const referrers = sessions.reduce((acc, session) => {
      const referrer = session.visitorInfo.referrer || 'Direct';
      acc[referrer] = (acc[referrer] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(referrers)
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getTopCountries(sessions: WidgetSession[]): Array<{ country: string; count: number }> {
    const countries = sessions.reduce((acc, session) => {
      const country = session.visitorInfo.country || 'Unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(countries)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  // A/B Testing functionality
  async createABTest(projectId: string, testName: string, variations: any[]): Promise<string> {
    const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store A/B test configuration
    // Implementation depends on your storage system
    
    return testId;
  }

  async getABTestVariation(projectId: string, testId: string, visitorId: string): Promise<any> {
    // Return appropriate variation based on visitor ID hash
    const hash = this.hashString(visitorId);
    const variationIndex = hash % 2; // Simple 50/50 split
    
    // Return variation configuration
    return { variationIndex, config: {} };
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}