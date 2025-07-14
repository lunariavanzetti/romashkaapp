// Website Behavior Triggers Types
export interface BehaviorTrigger {
  id: string;
  user_id: string;
  name: string;
  description: string;
  trigger_type: 'exit_intent' | 'time_on_page' | 'scroll_depth' | 'page_visit_count' | 'return_visitor' | 'inactivity' | 'form_abandonment';
  conditions: BehaviorCondition[];
  actions: BehaviorAction[];
  active: boolean;
  priority: number;
  targeting: TargetingRules;
  analytics: TriggerAnalytics;
  created_at: string;
  updated_at: string;
}

export interface BehaviorCondition {
  id: string;
  type: 'exit_intent' | 'time_on_page' | 'scroll_depth' | 'page_visit_count' | 'return_visitor' | 'inactivity' | 'form_abandonment' | 'device_type' | 'traffic_source' | 'location' | 'custom_event';
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains' | 'in' | 'not_in';
  value: any;
  settings: Record<string, any>;
}

export interface BehaviorAction {
  id: string;
  type: 'show_widget' | 'show_popup' | 'start_chat' | 'send_notification' | 'redirect' | 'track_event' | 'send_email' | 'show_discount' | 'play_sound' | 'vibrate';
  config: ActionConfig;
  delay: number; // milliseconds
  priority: number;
}

export interface ActionConfig {
  // Widget/Popup actions
  widget_id?: string;
  content?: {
    title: string;
    message: string;
    button_text?: string;
    image_url?: string;
  };
  style?: {
    position: 'top-left' | 'top-center' | 'top-right' | 'center' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    animation: 'fade' | 'slide' | 'bounce' | 'shake' | 'pulse';
    theme: 'light' | 'dark' | 'branded';
    size: 'small' | 'medium' | 'large';
  };
  
  // Chat actions
  chat_message?: string;
  auto_open_chat?: boolean;
  
  // Notification actions
  notification?: {
    title: string;
    body: string;
    icon?: string;
    action_url?: string;
  };
  
  // Redirect actions
  redirect_url?: string;
  redirect_delay?: number;
  
  // Email actions
  email_template_id?: string;
  email_variables?: Record<string, any>;
  
  // Discount actions
  discount?: {
    type: 'percentage' | 'fixed' | 'free_shipping';
    value: number;
    code?: string;
    expiry_minutes?: number;
  };
  
  // Custom settings
  custom_data?: Record<string, any>;
}

export interface TargetingRules {
  pages?: {
    include: string[];
    exclude: string[];
  };
  devices?: ('desktop' | 'tablet' | 'mobile')[];
  browsers?: string[];
  countries?: string[];
  traffic_sources?: ('direct' | 'search' | 'social' | 'email' | 'referral' | 'paid')[];
  user_segments?: string[];
  time_restrictions?: {
    days_of_week: number[]; // 0-6, Sunday = 0
    hours: { start: string; end: string }; // HH:MM format
    timezone: string;
  };
  visitor_type?: ('new' | 'returning' | 'both');
  session_count?: {
    operator: 'equals' | 'greater_than' | 'less_than';
    value: number;
  };
}

export interface TriggerAnalytics {
  total_triggers: number;
  total_conversions: number;
  conversion_rate: number;
  avg_engagement_time: number;
  last_triggered: string | null;
  performance_by_page: Record<string, {
    triggers: number;
    conversions: number;
    conversion_rate: number;
  }>;
}

export interface TriggerEvent {
  id: string;
  trigger_id: string;
  visitor_id: string;
  session_id: string;
  page_url: string;
  user_agent: string;
  trigger_conditions: BehaviorCondition[];
  actions_executed: BehaviorAction[];
  converted: boolean;
  conversion_value?: number;
  metadata: Record<string, any>;
  created_at: string;
}

export interface VisitorSession {
  id: string;
  visitor_id: string;
  user_id: string;
  session_start: string;
  session_end?: string;
  page_views: PageView[];
  events: SessionEvent[];
  user_agent: string;
  ip_address: string;
  country?: string;
  city?: string;
  device_type: 'desktop' | 'tablet' | 'mobile';
  browser: string;
  traffic_source: 'direct' | 'search' | 'social' | 'email' | 'referral' | 'paid';
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  is_returning: boolean;
  total_session_time: number;
  created_at: string;
  updated_at: string;
}

export interface PageView {
  id: string;
  session_id: string;
  page_url: string;
  page_title: string;
  time_on_page: number;
  scroll_depth: number;
  exit_intent_detected: boolean;
  form_interactions: FormInteraction[];
  custom_events: CustomEvent[];
  timestamp: string;
}

export interface FormInteraction {
  form_id: string;
  field_name: string;
  interaction_type: 'focus' | 'blur' | 'input' | 'submit' | 'abandon';
  value?: string;
  timestamp: string;
}

export interface CustomEvent {
  event_name: string;
  event_data: Record<string, any>;
  timestamp: string;
}

export interface SessionEvent {
  id: string;
  event_type: 'trigger_fired' | 'action_executed' | 'conversion' | 'custom';
  event_data: Record<string, any>;
  timestamp: string;
}

export const DEFAULT_TRIGGER_CONDITIONS: Record<string, BehaviorCondition> = {
  exit_intent: {
    id: 'exit_intent',
    type: 'exit_intent',
    operator: 'equals',
    value: true,
    settings: {
      sensitivity: 'medium', // low, medium, high
      delay: 1000,
      mobile_enabled: false
    }
  },
  time_on_page: {
    id: 'time_on_page',
    type: 'time_on_page',
    operator: 'greater_than',
    value: 30, // seconds
    settings: {}
  },
  scroll_depth: {
    id: 'scroll_depth',
    type: 'scroll_depth',
    operator: 'greater_than',
    value: 50, // percentage
    settings: {}
  },
  return_visitor: {
    id: 'return_visitor',
    type: 'return_visitor',
    operator: 'equals',
    value: true,
    settings: {
      min_previous_sessions: 1
    }
  },
  inactivity: {
    id: 'inactivity',
    type: 'inactivity',
    operator: 'greater_than',
    value: 60, // seconds
    settings: {
      reset_on_interaction: true
    }
  }
};

export const DEFAULT_TRIGGER_ACTIONS: Record<string, BehaviorAction> = {
  exit_intent_popup: {
    id: 'exit_intent_popup',
    type: 'show_popup',
    config: {
      content: {
        title: 'Wait! Don\'t leave yet',
        message: 'We\'re here to help! Chat with us before you go.',
        button_text: 'Start Chat'
      },
      style: {
        position: 'center',
        animation: 'fade',
        theme: 'branded',
        size: 'medium'
      }
    },
    delay: 0,
    priority: 1
  },
  engagement_chat: {
    id: 'engagement_chat',
    type: 'start_chat',
    config: {
      chat_message: 'Hi! I noticed you\'ve been browsing for a while. Is there anything I can help you with?',
      auto_open_chat: true
    },
    delay: 2000,
    priority: 1
  },
  discount_offer: {
    id: 'discount_offer',
    type: 'show_discount',
    config: {
      content: {
        title: 'Special Offer!',
        message: 'Get 20% off your first purchase',
        button_text: 'Claim Discount'
      },
      discount: {
        type: 'percentage',
        value: 20,
        code: 'WELCOME20',
        expiry_minutes: 60
      }
    },
    delay: 1000,
    priority: 2
  }
};

export const TRIGGER_TEMPLATES = [
  {
    id: 'exit_intent_engagement',
    name: 'Exit Intent Engagement',
    description: 'Show a popup when users are about to leave to re-engage them',
    trigger_type: 'exit_intent',
    conditions: [DEFAULT_TRIGGER_CONDITIONS.exit_intent],
    actions: [DEFAULT_TRIGGER_ACTIONS.exit_intent_popup]
  },
  {
    id: 'engaged_visitor_chat',
    name: 'Engaged Visitor Chat',
    description: 'Start a chat with visitors who spend significant time on your site',
    trigger_type: 'time_on_page',
    conditions: [
      { ...DEFAULT_TRIGGER_CONDITIONS.time_on_page, value: 60 },
      { ...DEFAULT_TRIGGER_CONDITIONS.scroll_depth, value: 30 }
    ],
    actions: [DEFAULT_TRIGGER_ACTIONS.engagement_chat]
  },
  {
    id: 'returning_visitor_welcome',
    name: 'Returning Visitor Welcome',
    description: 'Welcome back returning visitors with personalized messages',
    trigger_type: 'return_visitor',
    conditions: [DEFAULT_TRIGGER_CONDITIONS.return_visitor],
    actions: [
      {
        ...DEFAULT_TRIGGER_ACTIONS.engagement_chat,
        config: {
          chat_message: 'Welcome back! How can I help you today?',
          auto_open_chat: false
        }
      }
    ]
  },
  {
    id: 'inactive_user_nudge',
    name: 'Inactive User Nudge',
    description: 'Nudge users who have been inactive for too long',
    trigger_type: 'inactivity',
    conditions: [{ ...DEFAULT_TRIGGER_CONDITIONS.inactivity, value: 120 }],
    actions: [
      {
        id: 'nudge_notification',
        type: 'show_popup',
        config: {
          content: {
            title: 'Still there?',
            message: 'Need help finding what you\'re looking for?',
            button_text: 'Get Help'
          },
          style: {
            position: 'bottom-right',
            animation: 'slide',
            theme: 'light',
            size: 'small'
          }
        },
        delay: 0,
        priority: 1
      }
    ]
  },
  {
    id: 'form_abandonment_recovery',
    name: 'Form Abandonment Recovery',
    description: 'Re-engage users who start but don\'t complete forms',
    trigger_type: 'form_abandonment',
    conditions: [
      {
        id: 'form_abandon',
        type: 'form_abandonment',
        operator: 'equals',
        value: true,
        settings: {
          min_fields_filled: 2,
          abandon_time_threshold: 30 // seconds
        }
      }
    ],
    actions: [
      {
        id: 'form_help_offer',
        type: 'show_popup',
        config: {
          content: {
            title: 'Need help with the form?',
            message: 'I\'m here to assist if you have any questions!',
            button_text: 'Get Help'
          }
        },
        delay: 5000,
        priority: 1
      }
    ]
  }
];

export interface TriggerMetrics {
  total_visitors: number;
  triggered_visitors: number;
  trigger_rate: number;
  conversions: number;
  conversion_rate: number;
  revenue_generated: number;
  avg_engagement_time: number;
  top_triggering_pages: Array<{
    page: string;
    triggers: number;
    conversions: number;
  }>;
  performance_by_trigger: Array<{
    trigger_name: string;
    fires: number;
    conversions: number;
    conversion_rate: number;
  }>;
}