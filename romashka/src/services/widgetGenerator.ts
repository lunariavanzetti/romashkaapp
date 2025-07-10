import type { 
  WidgetConfig, 
  WidgetAnalytics, 
  WidgetInstallation, 
  WidgetTheme, 
  WidgetTemplate, 
  WidgetEmbedCode,
  WidgetCustomizationState
} from '../types/widget';
import { supabase } from './supabaseClient';

class WidgetGenerator {
  private readonly widgetCache = new Map<string, WidgetConfig>();
  private readonly themeCache = new Map<string, WidgetTheme>();
  private readonly analyticsCache = new Map<string, WidgetAnalytics>();

  async generateEmbedCode(config: WidgetConfig): Promise<WidgetEmbedCode> {
    try {
      const baseUrl = import.meta.env.VITE_WIDGET_CDN_URL || 'https://widget.romashka.ai';
      
      const javascript = `
(function(w,d,s,o,f,js,fjs){
  w.RomashkaWidget = w.RomashkaWidget || {};
  w.RomashkaWidget.config = ${JSON.stringify(config, null, 2)};
  
  if (d.getElementById(o)) return;
  
  js = d.createElement(s);
  fjs = d.getElementsByTagName(s)[0];
  js.id = o;
  js.src = '${baseUrl}/v1/widget.js';
  js.async = true;
  js.defer = true;
  
  js.onload = function() {
    w.RomashkaWidget.init(w.RomashkaWidget.config);
  };
  
  js.onerror = function() {
    console.error('Failed to load Romashka widget');
  };
  
  fjs.parentNode.insertBefore(js, fjs);
})(window, document, 'script', 'romashka-widget-js');
      `.trim();

      const html = `
<!-- Romashka Chat Widget -->
<div id="romashka-widget-container"></div>
<script>
${javascript}
</script>
<!-- End Romashka Chat Widget -->
      `.trim();

      const react = `
import { useEffect } from 'react';

const RomashkaWidget = () => {
  useEffect(() => {
    const config = ${JSON.stringify(config, null, 4)};
    
    const script = document.createElement('script');
    script.src = '${baseUrl}/v1/widget.js';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      if (window.RomashkaWidget) {
        window.RomashkaWidget.init(config);
      }
    };
    
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
      if (window.RomashkaWidget) {
        window.RomashkaWidget.destroy();
      }
    };
  }, []);
  
  return <div id="romashka-widget-container" />;
};

export default RomashkaWidget;
      `.trim();

      const vue = `
<template>
  <div id="romashka-widget-container"></div>
</template>

<script>
export default {
  name: 'RomashkaWidget',
  mounted() {
    this.loadWidget();
  },
  beforeUnmount() {
    this.destroyWidget();
  },
  methods: {
    loadWidget() {
      const config = ${JSON.stringify(config, null, 6)};
      
      const script = document.createElement('script');
      script.src = '${baseUrl}/v1/widget.js';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        if (window.RomashkaWidget) {
          window.RomashkaWidget.init(config);
        }
      };
      
      document.head.appendChild(script);
    },
    destroyWidget() {
      if (window.RomashkaWidget) {
        window.RomashkaWidget.destroy();
      }
    }
  }
}
</script>
      `.trim();

      const angular = `
import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-romashka-widget',
  template: '<div id="romashka-widget-container"></div>'
})
export class RomashkaWidgetComponent implements OnInit, OnDestroy {
  private config = ${JSON.stringify(config, null, 4)};
  
  ngOnInit() {
    this.loadWidget();
  }
  
  ngOnDestroy() {
    this.destroyWidget();
  }
  
  private loadWidget() {
    const script = document.createElement('script');
    script.src = '${baseUrl}/v1/widget.js';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      if ((window as any).RomashkaWidget) {
        (window as any).RomashkaWidget.init(this.config);
      }
    };
    
    document.head.appendChild(script);
  }
  
  private destroyWidget() {
    if ((window as any).RomashkaWidget) {
      (window as any).RomashkaWidget.destroy();
    }
  }
}
      `.trim();

      const wordpress = `
<?php
// Add this to your theme's functions.php file
function add_romashka_widget() {
    $config = json_encode(${JSON.stringify(config, null, 8)});
    ?>
    <script>
    (function(w,d,s,o,f,js,fjs){
      w.RomashkaWidget = w.RomashkaWidget || {};
      w.RomashkaWidget.config = <?php echo $config; ?>;
      
      if (d.getElementById(o)) return;
      
      js = d.createElement(s);
      fjs = d.getElementsByTagName(s)[0];
      js.id = o;
      js.src = '${baseUrl}/v1/widget.js';
      js.async = true;
      js.defer = true;
      
      js.onload = function() {
        w.RomashkaWidget.init(w.RomashkaWidget.config);
      };
      
      fjs.parentNode.insertBefore(js, fjs);
    })(window, document, 'script', 'romashka-widget-js');
    </script>
    <?php
}
add_action('wp_footer', 'add_romashka_widget');
?>
      `.trim();

      const shopify = `
<!-- Add this to your theme's theme.liquid file, before the closing </body> tag -->
<script>
(function(w,d,s,o,f,js,fjs){
  w.RomashkaWidget = w.RomashkaWidget || {};
  w.RomashkaWidget.config = ${JSON.stringify(config, null, 2)};
  
  if (d.getElementById(o)) return;
  
  js = d.createElement(s);
  fjs = d.getElementsByTagName(s)[0];
  js.id = o;
  js.src = '${baseUrl}/v1/widget.js';
  js.async = true;
  js.defer = true;
  
  js.onload = function() {
    w.RomashkaWidget.init(w.RomashkaWidget.config);
  };
  
  fjs.parentNode.insertBefore(js, fjs);
})(window, document, 'script', 'romashka-widget-js');
</script>
      `.trim();

      const squarespace = `
<!-- Add this to Settings > Advanced > Code Injection > Footer -->
<script>
(function(w,d,s,o,f,js,fjs){
  w.RomashkaWidget = w.RomashkaWidget || {};
  w.RomashkaWidget.config = ${JSON.stringify(config, null, 2)};
  
  if (d.getElementById(o)) return;
  
  js = d.createElement(s);
  fjs = d.getElementsByTagName(s)[0];
  js.id = o;
  js.src = '${baseUrl}/v1/widget.js';
  js.async = true;
  js.defer = true;
  
  js.onload = function() {
    w.RomashkaWidget.init(w.RomashkaWidget.config);
  };
  
  fjs.parentNode.insertBefore(js, fjs);
})(window, document, 'script', 'romashka-widget-js');
</script>
      `.trim();

      const wix = `
<!-- Add this via Wix Editor > Add > More > HTML Code -->
<script>
(function(w,d,s,o,f,js,fjs){
  w.RomashkaWidget = w.RomashkaWidget || {};
  w.RomashkaWidget.config = ${JSON.stringify(config, null, 2)};
  
  if (d.getElementById(o)) return;
  
  js = d.createElement(s);
  fjs = d.getElementsByTagName(s)[0];
  js.id = o;
  js.src = '${baseUrl}/v1/widget.js';
  js.async = true;
  js.defer = true;
  
  js.onload = function() {
    w.RomashkaWidget.init(w.RomashkaWidget.config);
  };
  
  fjs.parentNode.insertBefore(js, fjs);
})(window, document, 'script', 'romashka-widget-js');
</script>
      `.trim();

      const webflow = `
<!-- Add this to Project Settings > Custom Code > Footer Code -->
<script>
(function(w,d,s,o,f,js,fjs){
  w.RomashkaWidget = w.RomashkaWidget || {};
  w.RomashkaWidget.config = ${JSON.stringify(config, null, 2)};
  
  if (d.getElementById(o)) return;
  
  js = d.createElement(s);
  fjs = d.getElementsByTagName(s)[0];
  js.id = o;
  js.src = '${baseUrl}/v1/widget.js';
  js.async = true;
  js.defer = true;
  
  js.onload = function() {
    w.RomashkaWidget.init(w.RomashkaWidget.config);
  };
  
  fjs.parentNode.insertBefore(js, fjs);
})(window, document, 'script', 'romashka-widget-js');
</script>
      `.trim();

      return {
        javascript,
        html,
        react,
        vue,
        angular,
        wordpress,
        shopify,
        squarespace,
        wix,
        webflow
      };
    } catch (error) {
      console.error('Error generating embed code:', error);
      throw error;
    }
  }

  async createWidget(config: WidgetConfig): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('widget_configurations')
        .insert([
          {
            widget_name: config.widgetId,
            domain: config.security.allowedDomains[0] || '',
            configuration: config,
            status: 'active',
            install_verified: false
          }
        ])
        .select('id')
        .single();

      if (error) throw error;

      this.widgetCache.set(data.id, config);
      return data.id;
    } catch (error) {
      console.error('Error creating widget:', error);
      throw error;
    }
  }

  async updateWidget(widgetId: string, config: Partial<WidgetConfig>): Promise<void> {
    try {
      const { error } = await supabase
        .from('widget_configurations')
        .update({
          configuration: config,
          updated_at: new Date().toISOString()
        })
        .eq('id', widgetId);

      if (error) throw error;

      // Update cache
      const cached = this.widgetCache.get(widgetId);
      if (cached) {
        this.widgetCache.set(widgetId, { ...cached, ...config });
      }
    } catch (error) {
      console.error('Error updating widget:', error);
      throw error;
    }
  }

  async validateDomain(domain: string): Promise<boolean> {
    try {
      // Basic domain validation
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
      if (!domainRegex.test(domain)) {
        return false;
      }

      // Check if domain is reachable
      const response = await fetch(`https://${domain}`, {
        method: 'HEAD',
        mode: 'no-cors'
      });

      return true;
    } catch (error) {
      console.error('Error validating domain:', error);
      return false;
    }
  }

  async trackInstallation(widgetId: string, domain: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('widget_configurations')
        .update({
          install_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', widgetId);

      if (error) throw error;

      // Log installation event
      await supabase
        .from('audit_logs')
        .insert([
          {
            action: 'widget_installed',
            entity_type: 'widget_configurations',
            entity_id: widgetId,
            changes: { domain, verified: true }
          }
        ]);
    } catch (error) {
      console.error('Error tracking installation:', error);
      throw error;
    }
  }

  async getWidgetAnalytics(widgetId: string): Promise<WidgetAnalytics> {
    try {
      const cached = this.analyticsCache.get(widgetId);
      if (cached) {
        return cached;
      }

      // Simulate analytics data - in real implementation, this would query actual analytics tables
      const analytics: WidgetAnalytics = {
        totalChats: Math.floor(Math.random() * 1000) + 100,
        avgResponseTime: Math.floor(Math.random() * 2000) + 500,
        userRatings: [4.5, 4.2, 4.8, 4.1, 4.6],
        installs: Math.floor(Math.random() * 50) + 10,
        lastActive: new Date().toISOString(),
        pageViews: Math.floor(Math.random() * 10000) + 1000,
        uniqueVisitors: Math.floor(Math.random() * 5000) + 500,
        conversationStarts: Math.floor(Math.random() * 800) + 80,
        conversationCompletions: Math.floor(Math.random() * 600) + 60,
        avgConversationLength: Math.floor(Math.random() * 10) + 5,
        bounceRate: Math.floor(Math.random() * 30) + 20,
        conversionRate: Math.floor(Math.random() * 10) + 5,
        topPages: [
          { url: '/home', visits: 150, conversions: 12 },
          { url: '/products', visits: 120, conversions: 18 },
          { url: '/pricing', visits: 100, conversions: 25 }
        ],
        userGeography: {
          'United States': 45,
          'Canada': 15,
          'United Kingdom': 12,
          'Germany': 8,
          'Other': 20
        },
        deviceBreakdown: {
          desktop: 60,
          mobile: 35,
          tablet: 5
        },
        browserBreakdown: {
          'Chrome': 65,
          'Firefox': 20,
          'Safari': 10,
          'Edge': 5
        },
        timeSeriesData: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          chats: Math.floor(Math.random() * 50) + 10,
          visitors: Math.floor(Math.random() * 200) + 50,
          satisfaction: Math.random() * 2 + 3
        })),
        heatmapData: [
          { x: 100, y: 200, clicks: 45, element: 'chat-button' },
          { x: 150, y: 300, clicks: 32, element: 'close-button' },
          { x: 200, y: 250, clicks: 28, element: 'input-field' }
        ],
        conversionFunnel: [
          { stage: 'Visitor', users: 1000, conversionRate: 100 },
          { stage: 'Chat Started', users: 150, conversionRate: 15 },
          { stage: 'Engaged', users: 80, conversionRate: 8 },
          { stage: 'Converted', users: 25, conversionRate: 2.5 }
        ],
        errorLogs: [
          {
            timestamp: new Date().toISOString(),
            error: 'Failed to load widget configuration',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            url: 'https://example.com/products',
            severity: 'medium'
          }
        ],
        performanceMetrics: {
          loadTime: Math.floor(Math.random() * 2000) + 500,
          renderTime: Math.floor(Math.random() * 500) + 100,
          memoryUsage: Math.floor(Math.random() * 50) + 10,
          scriptSize: Math.floor(Math.random() * 100) + 50,
          apiResponseTime: Math.floor(Math.random() * 1000) + 200
        }
      };

      this.analyticsCache.set(widgetId, analytics);
      return analytics;
    } catch (error) {
      console.error('Error getting widget analytics:', error);
      throw error;
    }
  }

  async getWidgetInstallations(widgetId: string): Promise<WidgetInstallation[]> {
    try {
      const { data, error } = await supabase
        .from('widget_configurations')
        .select('*')
        .eq('id', widgetId);

      if (error) throw error;

      return data.map((installation: any) => ({
        id: installation.id,
        widgetId: installation.widget_name,
        domain: installation.domain,
        verified: installation.install_verified,
        installDate: installation.created_at,
        lastSeen: installation.updated_at,
        status: installation.status,
        version: '1.0.0',
        pageViews: Math.floor(Math.random() * 1000) + 100,
        uniqueVisitors: Math.floor(Math.random() * 500) + 50,
        conversationsStarted: Math.floor(Math.random() * 100) + 10,
        errors: [],
        performance: {
          avgLoadTime: Math.floor(Math.random() * 2000) + 500,
          avgRenderTime: Math.floor(Math.random() * 500) + 100,
          uptime: Math.floor(Math.random() * 5) + 95,
          errorRate: Math.floor(Math.random() * 5) + 1
        }
      }));
    } catch (error) {
      console.error('Error getting widget installations:', error);
      throw error;
    }
  }

  async getWidgetTemplates(): Promise<WidgetTemplate[]> {
    try {
      // Predefined templates
      const templates: WidgetTemplate[] = [
        {
          id: 'customer-support',
          name: 'Customer Support',
          description: 'Professional customer support chat widget',
          category: 'customer-support',
          config: {
            projectId: '',
            widgetId: '',
            position: 'bottom-right',
            theme: 'light',
            primaryColor: '#3B82F6',
            secondaryColor: '#10B981',
            welcomeMessage: 'Hi! How can I help you today?',
            language: 'en',
            showBranding: true,
            customization: {
              borderRadius: 12,
              shadowSize: 'medium',
              animation: 'slide',
              width: 350,
              height: 500,
              headerBackgroundColor: '#3B82F6',
              headerTextColor: '#FFFFFF',
              messageBackgroundColor: '#F3F4F6',
              messageTextColor: '#1F2937',
              inputBackgroundColor: '#FFFFFF',
              inputTextColor: '#1F2937',
              buttonColor: '#3B82F6',
              buttonTextColor: '#FFFFFF',
              fontFamily: 'Inter, sans-serif',
              fontSize: 14,
              chatBubbleStyle: 'rounded',
              showTypingIndicator: true,
              showReadReceipts: true,
              enableSoundNotifications: true,
              enableVibrations: false
            },
            behavior: {
              autoOpen: false,
              autoOpenDelay: 5000,
              showOnPages: [],
              hideOnPages: [],
              closeOnEscape: true,
              showOfflineMessage: true,
              offlineMessage: 'We\'re currently offline. Please leave a message.',
              workingHours: {
                enabled: true,
                timezone: 'UTC',
                schedule: {
                  monday: { start: '09:00', end: '17:00', enabled: true },
                  tuesday: { start: '09:00', end: '17:00', enabled: true },
                  wednesday: { start: '09:00', end: '17:00', enabled: true },
                  thursday: { start: '09:00', end: '17:00', enabled: true },
                  friday: { start: '09:00', end: '17:00', enabled: true },
                  saturday: { start: '10:00', end: '14:00', enabled: false },
                  sunday: { start: '10:00', end: '14:00', enabled: false }
                }
              },
              proactiveMessages: {
                enabled: true,
                delay: 30000,
                message: 'Need help? I\'m here to assist you!',
                frequency: 'once'
              },
              maxConversationLength: 100,
              enableFileUploads: true,
              allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
              maxFileSize: 10485760,
              enableEmojis: true,
              enableMarkdown: false,
              enableTypingIndicator: true,
              enableReadReceipts: true,
              enableSatisfactionRating: true,
              enableConversationTranscripts: true
            },
            security: {
              allowedDomains: [],
              enableSSLOnly: true,
              enableCORS: true,
              allowedOrigins: [],
              enableContentSecurityPolicy: true,
              enableRateLimiting: true,
              maxRequestsPerMinute: 60,
              enableSpamProtection: true,
              enableBotDetection: true
            },
            analytics: {
              enableTracking: true,
              trackPageViews: true,
              trackUserInteractions: true,
              trackConversationMetrics: true,
              enableHeatmaps: false,
              customEvents: []
            },
            integrations: {},
            compliance: {
              enableGDPR: true,
              cookieConsent: true,
              privacyPolicyUrl: '',
              termsOfServiceUrl: '',
              dataRetentionDays: 365,
              enableDataExport: true,
              enableDataDeletion: true,
              enableConsentBanner: true,
              consentBannerText: 'We use cookies to improve your experience.'
            }
          },
          previewImage: '/templates/customer-support.png',
          tags: ['professional', 'support', 'business'],
          popularity: 95,
          isNew: false,
          isPremium: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'sales-lead',
          name: 'Sales & Lead Generation',
          description: 'Optimized for capturing leads and driving sales',
          category: 'sales',
          config: {
            projectId: '',
            widgetId: '',
            position: 'bottom-right',
            theme: 'light',
            primaryColor: '#10B981',
            secondaryColor: '#F59E0B',
            welcomeMessage: 'Ready to grow your business? Let\'s talk!',
            language: 'en',
            showBranding: true,
            customization: {
              borderRadius: 16,
              shadowSize: 'large',
              animation: 'bounce',
              width: 380,
              height: 550,
              headerBackgroundColor: '#10B981',
              headerTextColor: '#FFFFFF',
              messageBackgroundColor: '#ECFDF5',
              messageTextColor: '#065F46',
              inputBackgroundColor: '#FFFFFF',
              inputTextColor: '#065F46',
              buttonColor: '#10B981',
              buttonTextColor: '#FFFFFF',
              fontFamily: 'Poppins, sans-serif',
              fontSize: 15,
              chatBubbleStyle: 'bubble',
              showTypingIndicator: true,
              showReadReceipts: true,
              enableSoundNotifications: true,
              enableVibrations: true
            },
            behavior: {
              autoOpen: true,
              autoOpenDelay: 10000,
              showOnPages: ['/pricing', '/features'],
              hideOnPages: ['/blog'],
              closeOnEscape: true,
              showOfflineMessage: true,
              offlineMessage: 'Leave your contact info and we\'ll reach out!',
              workingHours: {
                enabled: true,
                timezone: 'UTC',
                schedule: {
                  monday: { start: '08:00', end: '18:00', enabled: true },
                  tuesday: { start: '08:00', end: '18:00', enabled: true },
                  wednesday: { start: '08:00', end: '18:00', enabled: true },
                  thursday: { start: '08:00', end: '18:00', enabled: true },
                  friday: { start: '08:00', end: '18:00', enabled: true },
                  saturday: { start: '09:00', end: '15:00', enabled: true },
                  sunday: { start: '09:00', end: '15:00', enabled: false }
                }
              },
              proactiveMessages: {
                enabled: true,
                delay: 15000,
                message: 'Interested in our solutions? Get a free consultation!',
                frequency: 'daily'
              },
              maxConversationLength: 150,
              enableFileUploads: true,
              allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'pdf'],
              maxFileSize: 5242880,
              enableEmojis: true,
              enableMarkdown: false,
              enableTypingIndicator: true,
              enableReadReceipts: true,
              enableSatisfactionRating: true,
              enableConversationTranscripts: true
            },
            security: {
              allowedDomains: [],
              enableSSLOnly: true,
              enableCORS: true,
              allowedOrigins: [],
              enableContentSecurityPolicy: true,
              enableRateLimiting: true,
              maxRequestsPerMinute: 100,
              enableSpamProtection: true,
              enableBotDetection: true
            },
            analytics: {
              enableTracking: true,
              trackPageViews: true,
              trackUserInteractions: true,
              trackConversationMetrics: true,
              enableHeatmaps: true,
              customEvents: [
                { name: 'lead_captured', selector: '.lead-form', event: 'submit' },
                { name: 'demo_requested', selector: '.demo-button', event: 'click' }
              ]
            },
            integrations: {
              googleAnalytics: {
                enabled: true,
                trackingId: '',
                trackConversations: true
              },
              webhooks: {
                enabled: true,
                endpoints: [
                  {
                    url: '',
                    events: ['conversation_started', 'lead_captured'],
                    headers: { 'Content-Type': 'application/json' }
                  }
                ]
              }
            },
            compliance: {
              enableGDPR: true,
              cookieConsent: true,
              privacyPolicyUrl: '',
              termsOfServiceUrl: '',
              dataRetentionDays: 730,
              enableDataExport: true,
              enableDataDeletion: true,
              enableConsentBanner: true,
              consentBannerText: 'We use cookies to personalize your experience.'
            }
          },
          previewImage: '/templates/sales-lead.png',
          tags: ['sales', 'lead-generation', 'conversion'],
          popularity: 88,
          isNew: false,
          isPremium: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      return templates;
    } catch (error) {
      console.error('Error getting widget templates:', error);
      throw error;
    }
  }

  async getWidgetThemes(): Promise<WidgetTheme[]> {
    try {
      const themes: WidgetTheme[] = [
        {
          id: 'modern-light',
          name: 'Modern Light',
          description: 'Clean and modern light theme',
          colors: {
            primary: '#3B82F6',
            secondary: '#10B981',
            background: '#FFFFFF',
            text: '#1F2937',
            accent: '#F59E0B'
          },
          typography: {
            fontFamily: 'Inter, sans-serif',
            fontSize: 14,
            lineHeight: 1.5,
            fontWeight: 400
          },
          spacing: {
            padding: 16,
            margin: 8,
            borderRadius: 12
          },
          shadows: {
            small: '0 1px 3px rgba(0,0,0,0.1)',
            medium: '0 4px 6px rgba(0,0,0,0.1)',
            large: '0 10px 25px rgba(0,0,0,0.1)'
          },
          animations: {
            duration: 300,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
          },
          preview: '/themes/modern-light.png',
          category: 'modern',
          isPremium: false
        },
        {
          id: 'corporate-dark',
          name: 'Corporate Dark',
          description: 'Professional dark theme for corporate websites',
          colors: {
            primary: '#1F2937',
            secondary: '#374151',
            background: '#111827',
            text: '#F9FAFB',
            accent: '#3B82F6'
          },
          typography: {
            fontFamily: 'Roboto, sans-serif',
            fontSize: 14,
            lineHeight: 1.6,
            fontWeight: 400
          },
          spacing: {
            padding: 20,
            margin: 12,
            borderRadius: 8
          },
          shadows: {
            small: '0 1px 3px rgba(0,0,0,0.3)',
            medium: '0 4px 6px rgba(0,0,0,0.3)',
            large: '0 10px 25px rgba(0,0,0,0.3)'
          },
          animations: {
            duration: 250,
            easing: 'ease-in-out'
          },
          preview: '/themes/corporate-dark.png',
          category: 'business',
          isPremium: true
        }
      ];

      return themes;
    } catch (error) {
      console.error('Error getting widget themes:', error);
      throw error;
    }
  }

  async validateConfiguration(config: WidgetConfig): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validate required fields
    if (!config.projectId) errors.push('Project ID is required');
    if (!config.widgetId) errors.push('Widget ID is required');
    if (!config.primaryColor) errors.push('Primary color is required');
    if (!config.welcomeMessage) errors.push('Welcome message is required');

    // Validate colors
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!colorRegex.test(config.primaryColor)) errors.push('Invalid primary color format');
    if (!colorRegex.test(config.secondaryColor)) errors.push('Invalid secondary color format');

    // Validate domains
    if (config.security.allowedDomains.length === 0) {
      errors.push('At least one allowed domain is required');
    }

    // Validate working hours
    if (config.behavior.workingHours.enabled) {
      const schedule = config.behavior.workingHours.schedule;
      for (const [day, hours] of Object.entries(schedule)) {
        if (hours.enabled && (!hours.start || !hours.end)) {
          errors.push(`Working hours for ${day} are incomplete`);
        }
      }
    }

    // Validate file upload settings
    if (config.behavior.enableFileUploads) {
      if (config.behavior.maxFileSize > 10485760) {
        errors.push('Maximum file size cannot exceed 10MB');
      }
      if (config.behavior.allowedFileTypes.length === 0) {
        errors.push('At least one file type must be allowed');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async updateConfiguration(widgetId: string, config: Partial<WidgetConfig>): Promise<void> {
    try {
      const validation = await this.validateConfiguration(config as WidgetConfig);
      if (!validation.isValid) {
        throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
      }

      await this.updateWidget(widgetId, config);
    } catch (error) {
      console.error('Error updating configuration:', error);
      throw error;
    }
  }

  async monitorWidgetHealth(widgetId: string): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  }> {
    try {
      const analytics = await this.getWidgetAnalytics(widgetId);
      const installations = await this.getWidgetInstallations(widgetId);

      const issues: string[] = [];
      const recommendations: string[] = [];
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';

      // Check performance metrics
      if (analytics.performanceMetrics.loadTime > 3000) {
        issues.push('Slow loading time detected');
        recommendations.push('Consider optimizing widget assets');
        status = 'warning';
      }

      // Check error rate
      if (analytics.errorLogs.length > 10) {
        issues.push('High error rate detected');
        recommendations.push('Review error logs and fix common issues');
        status = 'critical';
      }

      // Check conversion rate
      if (analytics.conversionRate < 1) {
        issues.push('Low conversion rate');
        recommendations.push('Consider improving welcome message and proactive messaging');
        status = status === 'critical' ? 'critical' : 'warning';
      }

      // Check installations
      const activeInstallations = installations.filter(i => i.status === 'active');
      if (activeInstallations.length === 0) {
        issues.push('No active installations found');
        recommendations.push('Install widget on your websites');
        status = 'critical';
      }

      return { status, issues, recommendations };
    } catch (error) {
      console.error('Error monitoring widget health:', error);
      throw error;
    }
  }

  // Cache management
  clearCache(): void {
    this.widgetCache.clear();
    this.themeCache.clear();
    this.analyticsCache.clear();
  }

  private getCacheKey(widgetId: string, type: string): string {
    return `${widgetId}:${type}`;
  }
}

export default new WidgetGenerator(); 