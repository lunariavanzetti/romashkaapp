import { supabase } from '../../lib/supabase';
import {
  BehaviorTrigger,
  VisitorSession,
  PageView,
  TriggerEvent,
  BehaviorCondition,
  BehaviorAction,
  FormInteraction,
  CustomEvent
} from '../../types/behaviorTriggers';

export class BehaviorTrackingService {
  private static instance: BehaviorTrackingService;
  private currentSession: VisitorSession | null = null;
  private currentPageView: PageView | null = null;
  private triggers: BehaviorTrigger[] = [];
  private visitorId: string;
  private sessionId: string;
  private trackingEnabled: boolean = true;
  private exitIntentDetected: boolean = false;
  private inactivityTimer: NodeJS.Timeout | null = null;
  private scrollDepth: number = 0;
  private pageStartTime: number = Date.now();

  private constructor() {
    this.visitorId = this.getOrCreateVisitorId();
    this.sessionId = this.generateSessionId();
    this.initializeTracking();
  }

  static getInstance(): BehaviorTrackingService {
    if (!BehaviorTrackingService.instance) {
      BehaviorTrackingService.instance = new BehaviorTrackingService();
    }
    return BehaviorTrackingService.instance;
  }

  /**
   * Initialize behavior tracking
   */
  private async initializeTracking(): Promise<void> {
    try {
      await this.loadActiveTriggers();
      await this.startSession();
      this.setupEventListeners();
    } catch (error) {
      console.error('Error initializing behavior tracking:', error);
    }
  }

  /**
   * Load active triggers from database
   */
  private async loadActiveTriggers(): Promise<void> {
    try {
      const { data: triggers, error } = await supabase
        .from('behavior_triggers')
        .select('*')
        .eq('active', true)
        .order('priority', { ascending: false });

      if (error) {
        console.error('Error loading behavior triggers:', error);
        return;
      }

      this.triggers = triggers || [];
    } catch (error) {
      console.error('Error loading triggers:', error);
    }
  }

  /**
   * Start a new visitor session
   */
  private async startSession(): Promise<void> {
    try {
      const sessionData: Omit<VisitorSession, 'id' | 'created_at' | 'updated_at'> = {
        visitor_id: this.visitorId,
        user_id: this.getUserId(),
        session_start: new Date().toISOString(),
        page_views: [],
        events: [],
        user_agent: navigator.userAgent,
        ip_address: await this.getClientIP(),
        device_type: this.getDeviceType(),
        browser: this.getBrowser(),
        traffic_source: this.getTrafficSource(),
        referrer: document.referrer || undefined,
        utm_source: this.getURLParameter('utm_source'),
        utm_medium: this.getURLParameter('utm_medium'),
        utm_campaign: this.getURLParameter('utm_campaign'),
        is_returning: this.isReturningVisitor(),
        total_session_time: 0
      };

      const { data: session, error } = await supabase
        .from('visitor_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        return;
      }

      this.currentSession = session;
      this.trackPageView();
    } catch (error) {
      console.error('Error starting session:', error);
    }
  }

  /**
   * Track a page view
   */
  async trackPageView(url?: string): Promise<void> {
    if (!this.currentSession) return;

    try {
      const pageUrl = url || window.location.href;
      
      // End previous page view if exists
      if (this.currentPageView) {
        await this.endPageView();
      }

      const pageViewData: Omit<PageView, 'id'> = {
        session_id: this.currentSession.id,
        page_url: pageUrl,
        page_title: document.title,
        time_on_page: 0,
        scroll_depth: 0,
        exit_intent_detected: false,
        form_interactions: [],
        custom_events: [],
        timestamp: new Date().toISOString()
      };

      const { data: pageView, error } = await supabase
        .from('page_views')
        .insert(pageViewData)
        .select()
        .single();

      if (error) {
        console.error('Error tracking page view:', error);
        return;
      }

      this.currentPageView = pageView;
      this.pageStartTime = Date.now();
      this.scrollDepth = 0;
      this.exitIntentDetected = false;

      // Check triggers for this page
      await this.checkTriggersForPage(pageUrl);
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  }

  /**
   * End current page view
   */
  private async endPageView(): Promise<void> {
    if (!this.currentPageView) return;

    try {
      const timeOnPage = (Date.now() - this.pageStartTime) / 1000;

      const { error } = await supabase
        .from('page_views')
        .update({
          time_on_page: timeOnPage,
          scroll_depth: this.scrollDepth,
          exit_intent_detected: this.exitIntentDetected
        })
        .eq('id', this.currentPageView.id);

      if (error) {
        console.error('Error ending page view:', error);
      }
    } catch (error) {
      console.error('Error ending page view:', error);
    }
  }

  /**
   * Track form interaction
   */
  async trackFormInteraction(formId: string, fieldName: string, interactionType: string, value?: string): Promise<void> {
    if (!this.currentPageView) return;

    try {
      const interaction: FormInteraction = {
        form_id: formId,
        field_name: fieldName,
        interaction_type: interactionType as any,
        value,
        timestamp: new Date().toISOString()
      };

      // Add to current page view
      const updatedInteractions = [...this.currentPageView.form_interactions, interaction];

      const { error } = await supabase
        .from('page_views')
        .update({ form_interactions: updatedInteractions })
        .eq('id', this.currentPageView.id);

      if (error) {
        console.error('Error tracking form interaction:', error);
        return;
      }

      this.currentPageView.form_interactions = updatedInteractions;

      // Check for form abandonment triggers
      if (interactionType === 'abandon') {
        await this.checkFormAbandonmentTriggers(formId, updatedInteractions);
      }
    } catch (error) {
      console.error('Error tracking form interaction:', error);
    }
  }

  /**
   * Track custom event
   */
  async trackCustomEvent(eventName: string, eventData: Record<string, any>): Promise<void> {
    if (!this.currentPageView) return;

    try {
      const customEvent: CustomEvent = {
        event_name: eventName,
        event_data: eventData,
        timestamp: new Date().toISOString()
      };

      // Add to current page view
      const updatedEvents = [...this.currentPageView.custom_events, customEvent];

      const { error } = await supabase
        .from('page_views')
        .update({ custom_events: updatedEvents })
        .eq('id', this.currentPageView.id);

      if (error) {
        console.error('Error tracking custom event:', error);
        return;
      }

      this.currentPageView.custom_events = updatedEvents;

      // Check for custom event triggers
      await this.checkCustomEventTriggers(eventName, eventData);
    } catch (error) {
      console.error('Error tracking custom event:', error);
    }
  }

  /**
   * Check triggers for current page
   */
  private async checkTriggersForPage(pageUrl: string): Promise<void> {
    for (const trigger of this.triggers) {
      // Check if trigger applies to this page
      if (!this.doesTriggerApplyToPage(trigger, pageUrl)) {
        continue;
      }

      // Check if trigger applies to current visitor
      if (!this.doesTriggerApplyToVisitor(trigger)) {
        continue;
      }

      // Check conditions
      for (const condition of trigger.conditions) {
        await this.checkCondition(trigger, condition);
      }
    }
  }

  /**
   * Check if trigger applies to current page
   */
  private doesTriggerApplyToPage(trigger: BehaviorTrigger, pageUrl: string): boolean {
    const { targeting } = trigger;
    
    if (!targeting.pages) return true;

    // Check include patterns
    if (targeting.pages.include.length > 0) {
      const matches = targeting.pages.include.some(pattern => 
        this.matchesPattern(pageUrl, pattern)
      );
      if (!matches) return false;
    }

    // Check exclude patterns
    if (targeting.pages.exclude.length > 0) {
      const matches = targeting.pages.exclude.some(pattern => 
        this.matchesPattern(pageUrl, pattern)
      );
      if (matches) return false;
    }

    return true;
  }

  /**
   * Check if trigger applies to current visitor
   */
  private doesTriggerApplyToVisitor(trigger: BehaviorTrigger): boolean {
    const { targeting } = trigger;

    // Check device type
    if (targeting.devices && targeting.devices.length > 0) {
      if (!targeting.devices.includes(this.getDeviceType())) {
        return false;
      }
    }

    // Check visitor type
    if (targeting.visitor_type && targeting.visitor_type !== 'both') {
      const isReturning = this.isReturningVisitor();
      if (targeting.visitor_type === 'new' && isReturning) return false;
      if (targeting.visitor_type === 'returning' && !isReturning) return false;
    }

    // Check traffic source
    if (targeting.traffic_sources && targeting.traffic_sources.length > 0) {
      if (!targeting.traffic_sources.includes(this.getTrafficSource())) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check individual condition
   */
  private async checkCondition(trigger: BehaviorTrigger, condition: BehaviorCondition): Promise<void> {
    switch (condition.type) {
      case 'exit_intent':
        this.setupExitIntentDetection(trigger, condition);
        break;
      case 'time_on_page':
        this.setupTimeOnPageCheck(trigger, condition);
        break;
      case 'scroll_depth':
        this.setupScrollDepthCheck(trigger, condition);
        break;
      case 'inactivity':
        this.setupInactivityCheck(trigger, condition);
        break;
      case 'return_visitor':
        if (this.isReturningVisitor()) {
          await this.fireTrigger(trigger, [condition]);
        }
        break;
      default:
        console.warn('Unknown condition type:', condition.type);
    }
  }

  /**
   * Setup exit intent detection
   */
  private setupExitIntentDetection(trigger: BehaviorTrigger, condition: BehaviorCondition): void {
    if (this.getDeviceType() === 'mobile' && !condition.settings?.mobile_enabled) {
      return;
    }

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !this.exitIntentDetected) {
        this.exitIntentDetected = true;
        setTimeout(() => {
          this.fireTrigger(trigger, [condition]);
        }, condition.settings?.delay || 0);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
  }

  /**
   * Setup time on page check
   */
  private setupTimeOnPageCheck(trigger: BehaviorTrigger, condition: BehaviorCondition): void {
    const checkTime = condition.value * 1000; // Convert to milliseconds
    
    setTimeout(() => {
      const currentTime = (Date.now() - this.pageStartTime) / 1000;
      if (this.evaluateCondition(currentTime, condition.operator, condition.value)) {
        this.fireTrigger(trigger, [condition]);
      }
    }, checkTime);
  }

  /**
   * Setup scroll depth check
   */
  private setupScrollDepthCheck(trigger: BehaviorTrigger, condition: BehaviorCondition): void {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      this.scrollDepth = Math.round(((scrollTop + windowHeight) / documentHeight) * 100);
      
      if (this.evaluateCondition(this.scrollDepth, condition.operator, condition.value)) {
        this.fireTrigger(trigger, [condition]);
        window.removeEventListener('scroll', handleScroll);
      }
    };

    window.addEventListener('scroll', handleScroll);
  }

  /**
   * Setup inactivity check
   */
  private setupInactivityCheck(trigger: BehaviorTrigger, condition: BehaviorCondition): void {
    const resetInactivityTimer = () => {
      if (this.inactivityTimer) {
        clearTimeout(this.inactivityTimer);
      }
      
      this.inactivityTimer = setTimeout(() => {
        this.fireTrigger(trigger, [condition]);
      }, condition.value * 1000);
    };

    resetInactivityTimer();

    if (condition.settings?.reset_on_interaction) {
      ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
        document.addEventListener(event, resetInactivityTimer);
      });
    }
  }

  /**
   * Check form abandonment triggers
   */
  private async checkFormAbandonmentTriggers(formId: string, interactions: FormInteraction[]): Promise<void> {
    const abandonmentTriggers = this.triggers.filter(t => 
      t.conditions.some(c => c.type === 'form_abandonment')
    );

    for (const trigger of abandonmentTriggers) {
      const condition = trigger.conditions.find(c => c.type === 'form_abandonment');
      if (!condition) continue;

      const filledFields = interactions.filter(i => i.interaction_type === 'input' && i.value).length;
      const minFieldsRequired = condition.settings?.min_fields_filled || 1;

      if (filledFields >= minFieldsRequired) {
        setTimeout(() => {
          this.fireTrigger(trigger, [condition]);
        }, (condition.settings?.abandon_time_threshold || 30) * 1000);
      }
    }
  }

  /**
   * Check custom event triggers
   */
  private async checkCustomEventTriggers(eventName: string, eventData: Record<string, any>): Promise<void> {
    const eventTriggers = this.triggers.filter(t => 
      t.conditions.some(c => c.type === 'custom_event' && c.value === eventName)
    );

    for (const trigger of eventTriggers) {
      const condition = trigger.conditions.find(c => c.type === 'custom_event' && c.value === eventName);
      if (!condition) continue;

      await this.fireTrigger(trigger, [condition]);
    }
  }

  /**
   * Fire a trigger and execute its actions
   */
  private async fireTrigger(trigger: BehaviorTrigger, conditions: BehaviorCondition[]): Promise<void> {
    try {
      // Log trigger event
      const triggerEvent: Omit<TriggerEvent, 'id' | 'created_at'> = {
        trigger_id: trigger.id,
        visitor_id: this.visitorId,
        session_id: this.sessionId,
        page_url: window.location.href,
        user_agent: navigator.userAgent,
        trigger_conditions: conditions,
        actions_executed: [],
        converted: false,
        metadata: {
          scroll_depth: this.scrollDepth,
          time_on_page: (Date.now() - this.pageStartTime) / 1000,
          exit_intent_detected: this.exitIntentDetected
        }
      };

      const { data: event, error } = await supabase
        .from('trigger_events')
        .insert(triggerEvent)
        .select()
        .single();

      if (error) {
        console.error('Error logging trigger event:', error);
        return;
      }

      // Execute actions
      for (const action of trigger.actions) {
        try {
          await this.executeAction(action, event.id);
        } catch (error) {
          console.error('Error executing action:', error);
        }
      }

      // Update trigger analytics
      await this.updateTriggerAnalytics(trigger.id);
    } catch (error) {
      console.error('Error firing trigger:', error);
    }
  }

  /**
   * Execute trigger action
   */
  private async executeAction(action: BehaviorAction, eventId: string): Promise<void> {
    // Add delay if specified
    if (action.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, action.delay));
    }

    switch (action.type) {
      case 'show_popup':
        this.showPopup(action.config);
        break;
      case 'show_widget':
        this.showWidget(action.config);
        break;
      case 'start_chat':
        this.startChat(action.config);
        break;
      case 'send_notification':
        this.sendNotification(action.config);
        break;
      case 'track_event':
        this.trackCustomEvent('trigger_action', { action: action.type, config: action.config });
        break;
      default:
        console.warn('Unknown action type:', action.type);
    }

    // Log action execution
    await this.logActionExecution(eventId, action);
  }

  /**
   * Show popup
   */
  private showPopup(config: any): void {
    // This would integrate with your popup system
    console.log('Showing popup:', config);
    
    // Dispatch custom event for popup
    window.dispatchEvent(new CustomEvent('romashka:showPopup', {
      detail: config
    }));
  }

  /**
   * Show widget
   */
  private showWidget(config: any): void {
    // This would integrate with your widget system
    console.log('Showing widget:', config);
    
    // Dispatch custom event for widget
    window.dispatchEvent(new CustomEvent('romashka:showWidget', {
      detail: config
    }));
  }

  /**
   * Start chat
   */
  private startChat(config: any): void {
    // This would integrate with your chat system
    console.log('Starting chat:', config);
    
    // Dispatch custom event for chat
    window.dispatchEvent(new CustomEvent('romashka:startChat', {
      detail: config
    }));
  }

  /**
   * Send notification
   */
  private sendNotification(config: any): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(config.notification.title, {
        body: config.notification.body,
        icon: config.notification.icon
      });
    }
  }

  /**
   * Log action execution
   */
  private async logActionExecution(eventId: string, action: BehaviorAction): Promise<void> {
    try {
      const { error } = await supabase
        .from('trigger_events')
        .update({
          actions_executed: supabase.raw('actions_executed || ?', [action])
        })
        .eq('id', eventId);

      if (error) {
        console.error('Error logging action execution:', error);
      }
    } catch (error) {
      console.error('Error logging action execution:', error);
    }
  }

  /**
   * Update trigger analytics
   */
  private async updateTriggerAnalytics(triggerId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('update_trigger_analytics', {
        trigger_id: triggerId,
        page_url: window.location.href
      });

      if (error) {
        console.error('Error updating trigger analytics:', error);
      }
    } catch (error) {
      console.error('Error updating trigger analytics:', error);
    }
  }

  /**
   * Evaluate condition
   */
  private evaluateCondition(value: any, operator: string, targetValue: any): boolean {
    switch (operator) {
      case 'equals':
        return value === targetValue;
      case 'greater_than':
        return value > targetValue;
      case 'less_than':
        return value < targetValue;
      case 'contains':
        return String(value).includes(String(targetValue));
      case 'not_contains':
        return !String(value).includes(String(targetValue));
      case 'in':
        return Array.isArray(targetValue) && targetValue.includes(value);
      case 'not_in':
        return Array.isArray(targetValue) && !targetValue.includes(value);
      default:
        return false;
    }
  }

  /**
   * Check if pattern matches URL
   */
  private matchesPattern(url: string, pattern: string): boolean {
    // Simple pattern matching - could be enhanced with regex
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(url);
    }
    return url.includes(pattern);
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Page navigation
    window.addEventListener('popstate', () => {
      this.trackPageView();
    });

    // Session end
    window.addEventListener('beforeunload', () => {
      this.endSession();
    });

    // Form tracking
    document.addEventListener('focusin', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        const form = target.closest('form');
        if (form) {
          this.trackFormInteraction(form.id || 'unknown', target.getAttribute('name') || 'unknown', 'focus');
        }
      }
    });

    document.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        const form = target.closest('form');
        if (form) {
          this.trackFormInteraction(form.id || 'unknown', target.getAttribute('name') || 'unknown', 'input', target.value);
        }
      }
    });
  }

  /**
   * End current session
   */
  private async endSession(): Promise<void> {
    if (!this.currentSession) return;

    try {
      await this.endPageView();
      
      const sessionTime = (Date.now() - new Date(this.currentSession.session_start).getTime()) / 1000;
      
      const { error } = await supabase
        .from('visitor_sessions')
        .update({
          session_end: new Date().toISOString(),
          total_session_time: sessionTime
        })
        .eq('id', this.currentSession.id);

      if (error) {
        console.error('Error ending session:', error);
      }
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }

  /**
   * Utility methods
   */
  private getOrCreateVisitorId(): string {
    let visitorId = localStorage.getItem('romashka_visitor_id');
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem('romashka_visitor_id', visitorId);
    }
    return visitorId;
  }

  private generateSessionId(): string {
    return crypto.randomUUID();
  }

  private getUserId(): string {
    // Get from your auth system
    return 'anonymous'; // Placeholder
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  private getDeviceType(): 'desktop' | 'tablet' | 'mobile' {
    const userAgent = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return 'tablet';
    }
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
      return 'mobile';
    }
    return 'desktop';
  }

  private getBrowser(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getTrafficSource(): 'direct' | 'search' | 'social' | 'email' | 'referral' | 'paid' {
    const referrer = document.referrer;
    const utmSource = this.getURLParameter('utm_source');
    const utmMedium = this.getURLParameter('utm_medium');

    if (utmMedium === 'cpc' || utmMedium === 'ppc') return 'paid';
    if (utmMedium === 'email') return 'email';
    if (utmMedium === 'social') return 'social';
    if (utmSource) return 'referral';

    if (!referrer) return 'direct';
    
    if (referrer.includes('google.com') || referrer.includes('bing.com') || referrer.includes('yahoo.com')) {
      return 'search';
    }
    
    if (referrer.includes('facebook.com') || referrer.includes('twitter.com') || referrer.includes('linkedin.com')) {
      return 'social';
    }

    return 'referral';
  }

  private getURLParameter(name: string): string | undefined {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name) || undefined;
  }

  private isReturningVisitor(): boolean {
    return localStorage.getItem('romashka_returning_visitor') === 'true';
  }

  /**
   * Public API methods
   */
  public async trackConversion(eventId: string, value?: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('trigger_events')
        .update({
          converted: true,
          conversion_value: value
        })
        .eq('id', eventId);

      if (error) {
        console.error('Error tracking conversion:', error);
      }
    } catch (error) {
      console.error('Error tracking conversion:', error);
    }
  }

  public setTrackingEnabled(enabled: boolean): void {
    this.trackingEnabled = enabled;
  }

  public async refreshTriggers(): Promise<void> {
    await this.loadActiveTriggers();
  }
}

// Export singleton instance
export const behaviorTrackingService = BehaviorTrackingService.getInstance();