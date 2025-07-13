import { supabase } from './supabaseClient';

// Proactive Messaging Types
export interface ProactiveMessage {
  id: string;
  name: string;
  type: 'welcome' | 'abandoned_cart' | 'page_time' | 'exit_intent' | 'behavior_based' | 'scheduled';
  status: 'active' | 'paused' | 'draft';
  trigger: MessageTrigger;
  content: MessageContent;
  targeting: TargetingRules;
  schedule?: Schedule;
  performance: MessagePerformance;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageTrigger {
  type: 'time_on_page' | 'scroll_depth' | 'exit_intent' | 'inactivity' | 'page_visit' | 'user_action' | 'custom_event';
  conditions: TriggerCondition[];
  delay?: number; // in seconds
  maxOccurrences?: number;
  cooldownPeriod?: number; // in minutes
}

export interface TriggerCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'regex' | 'in' | 'not_in';
  value: string | number | string[];
  logicalOperator?: 'AND' | 'OR';
}

export interface MessageContent {
  title: string;
  message: string;
  avatar?: string;
  buttonText?: string;
  buttonAction?: 'start_chat' | 'redirect' | 'close' | 'custom';
  buttonUrl?: string;
  customCSS?: string;
  animation?: 'slide' | 'fade' | 'bounce' | 'shake';
  sound?: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface TargetingRules {
  geography?: {
    countries?: string[];
    regions?: string[];
    cities?: string[];
  };
  demographics?: {
    language?: string[];
    timezone?: string[];
  };
  behavior?: {
    newVisitor?: boolean;
    returningVisitor?: boolean;
    visitCount?: { min?: number; max?: number };
    sessionDuration?: { min?: number; max?: number };
    pageViews?: { min?: number; max?: number };
  };
  technical?: {
    devices?: ('desktop' | 'mobile' | 'tablet')[];
    browsers?: string[];
    operatingSystems?: string[];
    referrers?: string[];
  };
  custom?: {
    userSegments?: string[];
    customAttributes?: Record<string, any>;
  };
}

export interface Schedule {
  type: 'immediate' | 'scheduled' | 'recurring';
  startDate?: Date;
  endDate?: Date;
  timezone?: string;
  workingHours?: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string; // HH:MM format
    days: number[]; // 0-6 (Sunday-Saturday)
  };
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    specificDays?: number[];
  };
}

export interface MessagePerformance {
  impressions: number;
  clicks: number;
  conversions: number;
  dismissals: number;
  clickThroughRate: number;
  conversionRate: number;
  engagementScore: number;
  sentimentScore?: number;
  lastTriggered?: Date;
}

export interface CustomerBehavior {
  sessionId: string;
  userId?: string;
  anonymousId: string;
  pageUrl: string;
  referrer?: string;
  timeOnPage: number;
  scrollDepth: number;
  clickCount: number;
  formInteractions: number;
  exitIntent: boolean;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  operatingSystem: string;
  location: {
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
  };
  customEvents: CustomEvent[];
  timestamp: Date;
}

export interface CustomEvent {
  name: string;
  properties: Record<string, any>;
  timestamp: Date;
}

export interface EngagementMetrics {
  messageId: string;
  totalImpressions: number;
  uniqueImpressions: number;
  clickRate: number;
  conversionRate: number;
  averageEngagementTime: number;
  topPerformingVariants: string[];
  geographicPerformance: Record<string, number>;
  timeBasedPerformance: Record<string, number>;
  devicePerformance: Record<string, number>;
}

class ProactiveMessagingService {
  private activeMessages: Map<string, ProactiveMessage> = new Map();
  private behaviorTracker: Map<string, CustomerBehavior> = new Map();
  private messageQueue: Map<string, Set<string>> = new Map(); // sessionId -> messageIds
  private evaluationInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeService();
  }

  private async initializeService() {
    try {
      await this.loadActiveMessages();
      this.startBehaviorTracking();
      this.startMessageEvaluation();
    } catch (error) {
      console.error('Failed to initialize proactive messaging service:', error);
    }
  }

  private async loadActiveMessages() {
    try {
      if (!supabase) {
        console.warn('Supabase not configured, using mock data');
        return;
      }

      const { data, error } = await supabase
        .from('proactive_messages')
        .select('*')
        .eq('status', 'active');

      if (error) {
        console.error('Error loading proactive messages:', error);
        return;
      }

      if (data) {
        this.activeMessages.clear();
        data.forEach(message => {
          this.activeMessages.set(message.id, message);
        });
      }
    } catch (error) {
      console.error('Exception loading proactive messages:', error);
    }
  }

  private startBehaviorTracking() {
    // Track page visits
    window.addEventListener('load', this.trackPageVisit.bind(this));
    
    // Track scroll depth
    let maxScrollDepth = 0;
    window.addEventListener('scroll', () => {
      const scrollDepth = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );
      maxScrollDepth = Math.max(maxScrollDepth, scrollDepth);
      this.updateBehaviorData({ scrollDepth: maxScrollDepth });
    });

    // Track exit intent
    document.addEventListener('mouseleave', (e) => {
      if (e.clientY <= 0) {
        this.updateBehaviorData({ exitIntent: true });
      }
    });

    // Track clicks
    document.addEventListener('click', () => {
      this.updateBehaviorData({ clickCount: (this.getCurrentBehavior()?.clickCount || 0) + 1 });
    });

    // Track form interactions
    document.addEventListener('focus', (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        this.updateBehaviorData({ 
          formInteractions: (this.getCurrentBehavior()?.formInteractions || 0) + 1 
        });
      }
    }, true);

    // Track inactivity
    let inactivityTimer: NodeJS.Timeout;
    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        this.triggerInactivityEvent();
      }, 30000); // 30 seconds
    };

    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetInactivityTimer, true);
    });

    resetInactivityTimer();
  }

  private trackPageVisit() {
    const sessionId = this.getOrCreateSessionId();
    const behavior: CustomerBehavior = {
      sessionId,
      anonymousId: this.getOrCreateAnonymousId(),
      pageUrl: window.location.href,
      referrer: document.referrer,
      timeOnPage: 0,
      scrollDepth: 0,
      clickCount: 0,
      formInteractions: 0,
      exitIntent: false,
      deviceType: this.detectDeviceType(),
      browser: this.detectBrowser(),
      operatingSystem: this.detectOperatingSystem(),
      location: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      customEvents: [],
      timestamp: new Date()
    };

    this.behaviorTracker.set(sessionId, behavior);
    this.startTimeTracking(sessionId);
  }

  private startTimeTracking(sessionId: string) {
    const startTime = Date.now();
    setInterval(() => {
      const timeOnPage = Math.round((Date.now() - startTime) / 1000);
      this.updateBehaviorData({ timeOnPage });
    }, 1000);
  }

  private startMessageEvaluation() {
    this.evaluationInterval = setInterval(() => {
      this.evaluateAllMessages();
    }, 2000); // Check every 2 seconds
  }

  private evaluateAllMessages() {
    for (const [messageId, message] of this.activeMessages) {
      this.evaluateMessage(message);
    }
  }

  private evaluateMessage(message: ProactiveMessage) {
    const currentBehavior = this.getCurrentBehavior();
    if (!currentBehavior) return;

    const sessionId = currentBehavior.sessionId;
    const messageQueue = this.messageQueue.get(sessionId) || new Set();
    
    // Skip if message already shown to this session
    if (messageQueue.has(message.id)) return;

    // Check if message should be triggered
    if (this.shouldTriggerMessage(message, currentBehavior)) {
      this.triggerMessage(message, currentBehavior);
      messageQueue.add(message.id);
      this.messageQueue.set(sessionId, messageQueue);
    }
  }

  private shouldTriggerMessage(message: ProactiveMessage, behavior: CustomerBehavior): boolean {
    // Check schedule
    if (message.schedule && !this.isWithinSchedule(message.schedule)) {
      return false;
    }

    // Check targeting rules
    if (!this.matchesTargetingRules(message.targeting, behavior)) {
      return false;
    }

    // Check trigger conditions
    return this.evaluateTriggerConditions(message.trigger, behavior);
  }

  private isWithinSchedule(schedule: Schedule): boolean {
    const now = new Date();
    
    if (schedule.startDate && now < schedule.startDate) return false;
    if (schedule.endDate && now > schedule.endDate) return false;

    if (schedule.workingHours?.enabled) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = currentHour * 60 + currentMinute;
      
      const [startHour, startMinute] = schedule.workingHours.start.split(':').map(Number);
      const [endHour, endMinute] = schedule.workingHours.end.split(':').map(Number);
      
      const startTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;
      
      const currentDay = now.getDay();
      
      if (!schedule.workingHours.days.includes(currentDay)) return false;
      if (currentTime < startTime || currentTime > endTime) return false;
    }

    return true;
  }

  private matchesTargetingRules(targeting: TargetingRules, behavior: CustomerBehavior): boolean {
    // Check device type
    if (targeting.technical?.devices && 
        !targeting.technical.devices.includes(behavior.deviceType)) {
      return false;
    }

    // Check browser
    if (targeting.technical?.browsers && 
        !targeting.technical.browsers.includes(behavior.browser)) {
      return false;
    }

    // Check geography
    if (targeting.geography?.countries && behavior.location.country &&
        !targeting.geography.countries.includes(behavior.location.country)) {
      return false;
    }

    // Add more targeting rule checks as needed...

    return true;
  }

  private evaluateTriggerConditions(trigger: MessageTrigger, behavior: CustomerBehavior): boolean {
    return trigger.conditions.every(condition => {
      return this.evaluateCondition(condition, behavior);
    });
  }

  private evaluateCondition(condition: TriggerCondition, behavior: CustomerBehavior): boolean {
    const fieldValue = this.getFieldValue(condition.field, behavior);
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      case 'contains':
        return String(fieldValue).includes(String(condition.value));
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
      default:
        return false;
    }
  }

  private getFieldValue(field: string, behavior: CustomerBehavior): any {
    const fieldParts = field.split('.');
    let value: any = behavior;
    
    for (const part of fieldParts) {
      value = value?.[part];
    }
    
    return value;
  }

  private triggerMessage(message: ProactiveMessage, behavior: CustomerBehavior) {
    // Apply delay if specified
    setTimeout(() => {
      this.displayMessage(message, behavior);
      this.trackMessageImpression(message.id, behavior.sessionId);
    }, message.trigger.delay || 0);
  }

  private displayMessage(message: ProactiveMessage, behavior: CustomerBehavior) {
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = 'proactive-message';
    messageElement.innerHTML = this.generateMessageHTML(message);
    
    // Add to DOM
    document.body.appendChild(messageElement);
    
    // Add event listeners
    this.addMessageEventListeners(messageElement, message, behavior);
    
    // Apply animation
    this.applyAnimation(messageElement, message.content.animation || 'slide');
  }

  private generateMessageHTML(message: ProactiveMessage): string {
    return `
      <div class="proactive-message-container" style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        max-width: 320px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 24px rgba(0,0,0,0.15);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      ">
        <div class="proactive-message-header" style="
          padding: 16px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 12px;
        ">
          ${message.content.avatar ? `
            <img src="${message.content.avatar}" alt="Avatar" style="
              width: 32px;
              height: 32px;
              border-radius: 50%;
            ">
          ` : `
            <div style="
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background: linear-gradient(135deg, #38b2ac 0%, #2d9b96 100%);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
            ">R</div>
          `}
          <div style="flex: 1;">
            <h3 style="margin: 0; font-size: 14px; font-weight: 600; color: #1a365d;">
              ${message.content.title}
            </h3>
          </div>
          <button class="proactive-message-close" style="
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            color: #64748b;
            padding: 4px;
          ">×</button>
        </div>
        <div class="proactive-message-body" style="padding: 16px;">
          <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.5; color: #2d3748;">
            ${message.content.message}
          </p>
          ${message.content.buttonText ? `
            <button class="proactive-message-action" style="
              background: linear-gradient(135deg, #38b2ac 0%, #2d9b96 100%);
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s;
            ">
              ${message.content.buttonText}
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  private addMessageEventListeners(element: HTMLElement, message: ProactiveMessage, behavior: CustomerBehavior) {
    // Close button
    const closeBtn = element.querySelector('.proactive-message-close');
    closeBtn?.addEventListener('click', () => {
      this.dismissMessage(element, message.id, behavior.sessionId);
    });

    // Action button
    const actionBtn = element.querySelector('.proactive-message-action');
    actionBtn?.addEventListener('click', () => {
      this.handleMessageAction(message, behavior);
      this.trackMessageClick(message.id, behavior.sessionId);
    });

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (element.parentNode) {
        this.dismissMessage(element, message.id, behavior.sessionId);
      }
    }, 10000);
  }

  private applyAnimation(element: HTMLElement, animation: string) {
    const container = element.querySelector('.proactive-message-container') as HTMLElement;
    if (!container) return;

    switch (animation) {
      case 'slide':
        container.style.transform = 'translateX(100%)';
        container.style.transition = 'transform 0.3s ease-out';
        setTimeout(() => {
          container.style.transform = 'translateX(0)';
        }, 50);
        break;
      case 'fade':
        container.style.opacity = '0';
        container.style.transition = 'opacity 0.3s ease-out';
        setTimeout(() => {
          container.style.opacity = '1';
        }, 50);
        break;
      case 'bounce':
        container.style.transform = 'scale(0.8) translateY(20px)';
        container.style.transition = 'transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        setTimeout(() => {
          container.style.transform = 'scale(1) translateY(0)';
        }, 50);
        break;
    }
  }

  private handleMessageAction(message: ProactiveMessage, behavior: CustomerBehavior) {
    switch (message.content.buttonAction) {
      case 'start_chat':
        this.startChat();
        break;
      case 'redirect':
        if (message.content.buttonUrl) {
          window.open(message.content.buttonUrl, '_blank');
        }
        break;
      case 'custom':
        this.executeCustomAction(message.id, behavior);
        break;
    }
  }

  private startChat() {
    // Trigger chat widget opening
    const chatWidget = document.querySelector('.chat-widget-trigger');
    if (chatWidget instanceof HTMLElement) {
      chatWidget.click();
    }
  }

  private executeCustomAction(messageId: string, behavior: CustomerBehavior) {
    // Emit custom event for external handling
    window.dispatchEvent(new CustomEvent('proactiveMessageAction', {
      detail: { messageId, behavior }
    }));
  }

  private dismissMessage(element: HTMLElement, messageId: string, sessionId: string) {
    element.style.animation = 'slideOut 0.3s ease-in forwards';
    setTimeout(() => {
      element.remove();
    }, 300);
    
    this.trackMessageDismissal(messageId, sessionId);
  }

  private triggerInactivityEvent() {
    this.trackCustomEvent('inactivity', { duration: 30 });
  }

  // Public API methods
  public async createMessage(message: Omit<ProactiveMessage, 'id' | 'createdAt' | 'updatedAt' | 'performance'>): Promise<string> {
    const newMessage: ProactiveMessage = {
      ...message,
      id: crypto.randomUUID(),
      performance: {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        dismissals: 0,
        clickThroughRate: 0,
        conversionRate: 0,
        engagementScore: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to database
    if (supabase) {
      const { error } = await supabase
        .from('proactive_messages')
        .insert([newMessage]);
      
      if (error) {
        console.error('Error saving proactive message:', error);
        throw error;
      }
    }

    // Add to active messages if status is active
    if (message.status === 'active') {
      this.activeMessages.set(newMessage.id, newMessage);
    }

    return newMessage.id;
  }

  public async updateMessage(messageId: string, updates: Partial<ProactiveMessage>): Promise<void> {
    const existingMessage = this.activeMessages.get(messageId);
    if (!existingMessage) {
      throw new Error('Message not found');
    }

    const updatedMessage = {
      ...existingMessage,
      ...updates,
      updatedAt: new Date()
    };

    // Update in database
    if (supabase) {
      const { error } = await supabase
        .from('proactive_messages')
        .update(updatedMessage)
        .eq('id', messageId);
      
      if (error) {
        console.error('Error updating proactive message:', error);
        throw error;
      }
    }

    // Update in memory
    this.activeMessages.set(messageId, updatedMessage);
  }

  public async deleteMessage(messageId: string): Promise<void> {
    // Remove from database
    if (supabase) {
      const { error } = await supabase
        .from('proactive_messages')
        .delete()
        .eq('id', messageId);
      
      if (error) {
        console.error('Error deleting proactive message:', error);
        throw error;
      }
    }

    // Remove from memory
    this.activeMessages.delete(messageId);
  }

  public trackCustomEvent(eventName: string, properties: Record<string, any>): void {
    const behavior = this.getCurrentBehavior();
    if (behavior) {
      behavior.customEvents.push({
        name: eventName,
        properties,
        timestamp: new Date()
      });
    }
  }

  public async getMessagePerformance(messageId: string): Promise<MessagePerformance | null> {
    const message = this.activeMessages.get(messageId);
    return message?.performance || null;
  }

  public async getEngagementMetrics(messageId: string): Promise<EngagementMetrics | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('message_analytics')
      .select('*')
      .eq('message_id', messageId)
      .single();

    if (error) {
      console.error('Error fetching engagement metrics:', error);
      return null;
    }

    return data;
  }

  // Helper methods
  private getCurrentBehavior(): CustomerBehavior | null {
    const sessionId = this.getOrCreateSessionId();
    return this.behaviorTracker.get(sessionId) || null;
  }

  private updateBehaviorData(updates: Partial<CustomerBehavior>): void {
    const sessionId = this.getOrCreateSessionId();
    const currentBehavior = this.behaviorTracker.get(sessionId);
    
    if (currentBehavior) {
      Object.assign(currentBehavior, updates);
    }
  }

  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('proactive_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('proactive_session_id', sessionId);
    }
    return sessionId;
  }

  private getOrCreateAnonymousId(): string {
    let anonymousId = localStorage.getItem('proactive_anonymous_id');
    if (!anonymousId) {
      anonymousId = crypto.randomUUID();
      localStorage.setItem('proactive_anonymous_id', anonymousId);
    }
    return anonymousId;
  }

  private detectDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  private detectBrowser(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private detectOperatingSystem(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private trackMessageImpression(messageId: string, sessionId: string): void {
    this.trackMessageEvent(messageId, sessionId, 'impression');
  }

  private trackMessageClick(messageId: string, sessionId: string): void {
    this.trackMessageEvent(messageId, sessionId, 'click');
  }

  private trackMessageDismissal(messageId: string, sessionId: string): void {
    this.trackMessageEvent(messageId, sessionId, 'dismissal');
  }

  private async trackMessageEvent(messageId: string, sessionId: string, eventType: 'impression' | 'click' | 'dismissal'): Promise<void> {
    if (!supabase) return;

    try {
      await supabase
        .from('message_events')
        .insert([{
          message_id: messageId,
          session_id: sessionId,
          event_type: eventType,
          timestamp: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('Error tracking message event:', error);
    }
  }

  // Cleanup
  public destroy(): void {
    if (this.evaluationInterval) {
      clearInterval(this.evaluationInterval);
    }
    this.activeMessages.clear();
    this.behaviorTracker.clear();
    this.messageQueue.clear();
  }
}

// Create and export singleton instance
export const proactiveMessaging = new ProactiveMessagingService();
export default proactiveMessaging;