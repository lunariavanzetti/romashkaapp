export interface WidgetConfig {
  projectId: string;
  widgetId: string;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  secondaryColor: string;
  welcomeMessage: string;
  avatarUrl?: string;
  language: string;
  showBranding: boolean;
  customization: {
    borderRadius: number;
    shadowSize: 'none' | 'small' | 'medium' | 'large';
    animation: 'none' | 'slide' | 'fade' | 'bounce';
    width: number;
    height: number;
    headerBackgroundColor: string;
    headerTextColor: string;
    messageBackgroundColor: string;
    messageTextColor: string;
    inputBackgroundColor: string;
    inputTextColor: string;
    buttonColor: string;
    buttonTextColor: string;
    fontFamily: string;
    fontSize: number;
    chatBubbleStyle: 'rounded' | 'square' | 'bubble';
    showTypingIndicator: boolean;
    showReadReceipts: boolean;
    enableSoundNotifications: boolean;
    enableVibrations: boolean;
    customCSS?: string;
  };
  behavior: {
    autoOpen: boolean;
    autoOpenDelay: number;
    showOnPages: string[];
    hideOnPages: string[];
    triggerElement?: string;
    closeOnEscape: boolean;
    showOfflineMessage: boolean;
    offlineMessage: string;
    workingHours: {
      enabled: boolean;
      timezone: string;
      schedule: Record<string, { start: string; end: string; enabled: boolean }>;
    };
    proactiveMessages: {
      enabled: boolean;
      delay: number;
      message: string;
      frequency: 'once' | 'daily' | 'session';
    };
    maxConversationLength: number;
    enableFileUploads: boolean;
    allowedFileTypes: string[];
    maxFileSize: number;
    enableEmojis: boolean;
    enableMarkdown: boolean;
    enableTypingIndicator: boolean;
    enableReadReceipts: boolean;
    enableSatisfactionRating: boolean;
    enableConversationTranscripts: boolean;
  };
  security: {
    allowedDomains: string[];
    enableSSLOnly: boolean;
    enableCORS: boolean;
    allowedOrigins: string[];
    enableContentSecurityPolicy: boolean;
    enableRateLimiting: boolean;
    maxRequestsPerMinute: number;
    enableSpamProtection: boolean;
    enableBotDetection: boolean;
  };
  analytics: {
    enableTracking: boolean;
    trackPageViews: boolean;
    trackUserInteractions: boolean;
    trackConversationMetrics: boolean;
    enableHeatmaps: boolean;
    customEvents: Array<{
      name: string;
      selector: string;
      event: string;
    }>;
  };
  integrations: {
    googleAnalytics?: {
      enabled: boolean;
      trackingId: string;
      trackConversations: boolean;
    };
    facebook?: {
      enabled: boolean;
      pixelId: string;
      trackConversions: boolean;
    };
    webhooks?: {
      enabled: boolean;
      endpoints: Array<{
        url: string;
        events: string[];
        headers: Record<string, string>;
      }>;
    };
    crm?: {
      enabled: boolean;
      provider: string;
      settings: Record<string, any>;
    };
  };
  compliance: {
    enableGDPR: boolean;
    cookieConsent: boolean;
    privacyPolicyUrl: string;
    termsOfServiceUrl: string;
    dataRetentionDays: number;
    enableDataExport: boolean;
    enableDataDeletion: boolean;
    enableConsentBanner: boolean;
    consentBannerText: string;
  };
}

export interface WidgetAnalytics {
  totalChats: number;
  avgResponseTime: number;
  userRatings: number[];
  installs: number;
  lastActive: string;
  pageViews: number;
  uniqueVisitors: number;
  conversationStarts: number;
  conversationCompletions: number;
  avgConversationLength: number;
  bounceRate: number;
  conversionRate: number;
  topPages: Array<{
    url: string;
    visits: number;
    conversions: number;
  }>;
  userGeography: Record<string, number>;
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  browserBreakdown: Record<string, number>;
  timeSeriesData: Array<{
    date: string;
    chats: number;
    visitors: number;
    satisfaction: number;
  }>;
  heatmapData: Array<{
    x: number;
    y: number;
    clicks: number;
    element: string;
  }>;
  conversionFunnel: Array<{
    stage: string;
    users: number;
    conversionRate: number;
  }>;
  errorLogs: Array<{
    timestamp: string;
    error: string;
    userAgent: string;
    url: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  performanceMetrics: {
    loadTime: number;
    renderTime: number;
    memoryUsage: number;
    scriptSize: number;
    apiResponseTime: number;
  };
}

export interface WidgetInstallation {
  id: string;
  widgetId: string;
  domain: string;
  verified: boolean;
  installDate: string;
  lastSeen: string;
  status: 'active' | 'inactive' | 'error';
  version: string;
  pageViews: number;
  uniqueVisitors: number;
  conversationsStarted: number;
  errors: Array<{
    timestamp: string;
    error: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  performance: {
    avgLoadTime: number;
    avgRenderTime: number;
    uptime: number;
    errorRate: number;
  };
}

export interface WidgetTheme {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  typography: {
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    fontWeight: number;
  };
  spacing: {
    padding: number;
    margin: number;
    borderRadius: number;
  };
  shadows: {
    small: string;
    medium: string;
    large: string;
  };
  animations: {
    duration: number;
    easing: string;
  };
  customCSS?: string;
  preview: string;
  category: 'business' | 'casual' | 'modern' | 'classic';
  isPremium: boolean;
}

export interface WidgetCustomizationState {
  config: WidgetConfig;
  preview: {
    isVisible: boolean;
    position: { x: number; y: number };
    size: { width: number; height: number };
    isMinimized: boolean;
    messages: Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp: string;
    }>;
  };
  unsavedChanges: boolean;
  validationErrors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  isGeneratingCode: boolean;
  generatedCode: string;
  installationGuide: {
    platform: string;
    instructions: string[];
    codeSnippets: Array<{
      language: string;
      code: string;
      description: string;
    }>;
  };
}

export interface WidgetTemplate {
  id: string;
  name: string;
  description: string;
  category: 'customer-support' | 'sales' | 'lead-generation' | 'feedback' | 'general';
  config: Partial<WidgetConfig>;
  previewImage: string;
  tags: string[];
  popularity: number;
  isNew: boolean;
  isPremium: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WidgetEmbedCode {
  javascript: string;
  html: string;
  react: string;
  vue: string;
  angular: string;
  wordpress: string;
  shopify: string;
  squarespace: string;
  wix: string;
  webflow: string;
} 