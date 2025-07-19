import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  CogIcon, 
  EyeIcon, 
  ChartBarIcon,
  BellIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { 
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon
} from '@heroicons/react/24/solid';
import { UnifiedChannelManager, type UnifiedChannelConfig } from '../../services/channels/unifiedChannelManager';
import WidgetCustomizer from '../../components/widget/WidgetCustomizer';
import UnifiedInbox from '../../components/inbox/UnifiedInbox';
import type { ChannelType, ChannelConfig, MessageContent } from '../../services/channels/types';

interface ChannelStatus {
  type: ChannelType;
  name: string;
  status: 'active' | 'inactive' | 'error' | 'setup_required';
  lastActivity: Date;
  messageCount: number;
  responseTime: number;
  errorMessage?: string;
}

interface WebhookInfo {
  url: string;
  status: 'active' | 'inactive' | 'error';
  lastTriggered?: Date;
  errorCount: number;
}

const ChannelsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'setup' | 'inbox' | 'analytics'>('overview');
  const [channels, setChannels] = useState<ChannelStatus[]>([]);
  const [webhooks, setWebhooks] = useState<Record<ChannelType, WebhookInfo>>({
    whatsapp: { url: '', status: 'inactive', errorCount: 0 },
    instagram: { url: '', status: 'inactive', errorCount: 0 },
    email: { url: '', status: 'inactive', errorCount: 0 },
    website: { url: '', status: 'inactive', errorCount: 0 },
    sms: { url: '', status: 'inactive', errorCount: 0 },
    messenger: { url: '', status: 'inactive', errorCount: 0 }
  });
  const [channelManager, setChannelManager] = useState<UnifiedChannelManager | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSetup, setShowSetup] = useState<ChannelType | null>(null);
  const [metrics, setMetrics] = useState<any>(null);

  // Channel configurations
  const [whatsappConfig, setWhatsappConfig] = useState({
    phoneNumberId: '',
    accessToken: '',
    webhookSecret: '',
    businessAccountId: ''
  });

  const [instagramConfig, setInstagramConfig] = useState({
    accessToken: '',
    appSecret: '',
    pageId: ''
  });

  const [emailConfig, setEmailConfig] = useState({
    sendgridApiKey: '',
    supportEmail: '',
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    imapHost: '',
    imapPort: 993
  });

  const [widgetConfig, setWidgetConfig] = useState({
    enabled: false,
    projectId: 'default-project'
  });

  const channelIcons = {
    whatsapp: DevicePhoneMobileIcon,
    instagram: ChatBubbleLeftRightIcon,
    email: EnvelopeIcon,
    website: GlobeAltIcon,
    sms: DevicePhoneMobileIcon,
    messenger: ChatBubbleLeftRightIcon
  };

  const channelColors = {
    whatsapp: 'bg-green-500',
    instagram: 'bg-pink-500',
    email: 'bg-blue-500',
    website: 'bg-purple-500',
    sms: 'bg-yellow-500',
    messenger: 'bg-indigo-500'
  };

  const statusColors = {
    active: 'text-green-600 bg-green-100',
    inactive: 'text-gray-600 bg-gray-100',
    error: 'text-red-600 bg-red-100',
    setup_required: 'text-yellow-600 bg-yellow-100'
  };

  useEffect(() => {
    loadChannelStatus();
    loadWebhookInfo();
    loadMetrics();
    loadStoredConfigurations();
  }, []);
  
  const loadStoredConfigurations = () => {
    try {
      const stored = localStorage.getItem('romashka-channel-configs');
      if (stored) {
        const configs = JSON.parse(stored);
        
        if (configs.whatsapp) {
          setWhatsappConfig(configs.whatsapp);
        }
        if (configs.instagram) {
          setInstagramConfig(configs.instagram);
        }
        if (configs.email) {
          setEmailConfig(configs.email);
        }
        if (configs.widget) {
          setWidgetConfig(configs.widget);
        }
      }
    } catch (error) {
      console.error('Error loading stored configurations:', error);
    }
  };

  const loadChannelStatus = async () => {
    setIsLoading(true);
    try {
      // Mock channel status data
      const mockChannels: ChannelStatus[] = [
        {
          type: 'whatsapp',
          name: 'WhatsApp Business',
          status: 'active',
          lastActivity: new Date(),
          messageCount: 1247,
          responseTime: 180
        },
        {
          type: 'instagram',
          name: 'Instagram DM',
          status: 'setup_required',
          lastActivity: new Date(),
          messageCount: 0,
          responseTime: 0
        },
        {
          type: 'email',
          name: 'Email Support',
          status: 'active',
          lastActivity: new Date(),
          messageCount: 456,
          responseTime: 3600
        },
        {
          type: 'website',
          name: 'Website Widget',
          status: 'inactive',
          lastActivity: new Date(),
          messageCount: 89,
          responseTime: 120
        }
      ];
      
      setChannels(mockChannels);
    } catch (error) {
      console.error('Error loading channel status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWebhookInfo = async () => {
    try {
      // Mock webhook data
      const mockWebhooks: Record<ChannelType, WebhookInfo> = {
        whatsapp: {
          url: 'https://api.romashka.ai/webhooks/whatsapp',
          status: 'active',
          lastTriggered: new Date(),
          errorCount: 0
        },
        instagram: {
          url: 'https://api.romashka.ai/webhooks/instagram',
          status: 'inactive',
          errorCount: 0
        },
        email: {
          url: 'https://api.romashka.ai/webhooks/email',
          status: 'active',
          lastTriggered: new Date(),
          errorCount: 0
        },
        website: {
          url: 'https://api.romashka.ai/webhooks/website',
          status: 'inactive',
          errorCount: 0
        },
        sms: {
          url: 'https://api.romashka.ai/webhooks/sms',
          status: 'inactive',
          errorCount: 0
        },
        messenger: {
          url: 'https://api.romashka.ai/webhooks/messenger',
          status: 'inactive',
          errorCount: 0
        }
      };
      
      setWebhooks(mockWebhooks);
    } catch (error) {
      console.error('Error loading webhook info:', error);
    }
  };

  const loadMetrics = async () => {
    try {
      // Mock metrics data
      const mockMetrics = {
        totalMessages: 1792,
        averageResponseTime: 240,
        satisfactionScore: 4.3,
        activeConversations: 23,
        messagesByChannel: {
          whatsapp: 1247,
          instagram: 0,
          email: 456,
          website: 89,
          sms: 0,
          messenger: 0
        },
        responseTimesByChannel: {
          whatsapp: 180,
          instagram: 0,
          email: 3600,
          website: 120,
          sms: 0,
          messenger: 0
        }
      };
      
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  const initializeChannelManager = async () => {
    setIsLoading(true);
    try {
      // Validate configurations
      const errors = [];
      
      if (whatsappConfig.accessToken && (!whatsappConfig.phoneNumberId || !whatsappConfig.webhookSecret)) {
        errors.push('WhatsApp: Missing Phone Number ID or Webhook Secret');
      }
      
      if (instagramConfig.accessToken && (!instagramConfig.appSecret || !instagramConfig.pageId)) {
        errors.push('Instagram: Missing App Secret or Page ID');
      }
      
      if (emailConfig.sendgridApiKey && !emailConfig.supportEmail) {
        errors.push('Email: Missing Support Email address');
      }
      
      if (errors.length > 0) {
        alert('❌ Configuration errors:\n\n' + errors.join('\n') + 
              '\n\nPlease fix these issues before saving.');
        return;
      }
      
      const config: UnifiedChannelConfig = {
        whatsapp: whatsappConfig.accessToken ? whatsappConfig : undefined,
        instagram: instagramConfig.accessToken ? instagramConfig : undefined,
        email: emailConfig.sendgridApiKey ? emailConfig : undefined,
        sendgridApiKey: emailConfig.sendgridApiKey,
        widget: widgetConfig.enabled ? widgetConfig : undefined
      };

      const manager = new UnifiedChannelManager(config);
      setChannelManager(manager);
      
      // Save configurations to localStorage for persistence
      localStorage.setItem('romashka-channel-configs', JSON.stringify({
        whatsapp: whatsappConfig,
        instagram: instagramConfig,
        email: emailConfig,
        widget: widgetConfig
      }));
      
      // Update channel statuses based on configuration
      setChannels(prev => prev.map(ch => {
        let status: 'active' | 'inactive' | 'error' | 'setup_required' = 'setup_required';
        
        switch (ch.type) {
          case 'whatsapp':
            status = whatsappConfig.accessToken ? 'active' : 'setup_required';
            break;
          case 'instagram':
            status = instagramConfig.accessToken ? 'active' : 'setup_required';
            break;
          case 'email':
            status = emailConfig.sendgridApiKey ? 'active' : 'setup_required';
            break;
          case 'website':
            status = widgetConfig.enabled ? 'active' : 'inactive';
            break;
          default:
            status = 'inactive';
        }
        
        return { ...ch, status };
      }));
      
      await loadWebhookInfo();
      
      alert('✅ Channel configuration saved successfully! You can now test your webhooks.');
      
    } catch (error) {
      console.error('Error initializing channel manager:', error);
      alert('❌ Failed to save configuration: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChannelSetup = async (channelType: ChannelType) => {
    setShowSetup(channelType);
    setActiveTab('setup');
    
    // Scroll to the relevant setup section
    setTimeout(() => {
      const setupSection = document.getElementById(`setup-${channelType}`);
      if (setupSection) {
        setupSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setupSection.style.backgroundColor = '#fef3c7'; // Highlight yellow
        setTimeout(() => {
          setupSection.style.backgroundColor = '';
        }, 2000);
      }
    }, 100);
  };

  const handleWebhookTest = async (channelType: ChannelType) => {
    setIsLoading(true);
    try {
      const webhook = webhooks[channelType];
      if (!webhook.url) {
        alert('❌ Webhook URL not configured for ' + channelType + '. Please set up the channel first.');
        return;
      }

      // Show testing in progress
      alert('🔄 Testing webhook for ' + channelType + '...');

      // Test webhook endpoint with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'User-Agent': 'ROMASHKA-Test-Agent/1.0'
          },
          body: JSON.stringify({ 
            test: true, 
            channel: channelType,
            timestamp: new Date().toISOString(),
            source: 'romashka-dashboard'
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          setWebhooks(prev => ({
            ...prev,
            [channelType]: {
              ...prev[channelType],
              status: 'active',
              lastTriggered: new Date(),
              errorCount: 0
            }
          }));
          
          // Update channel status
          setChannels(prev => prev.map(ch => 
            ch.type === channelType 
              ? { ...ch, status: 'active' as const }
              : ch
          ));
          
          alert('✅ Webhook test successful for ' + channelType + '! The endpoint is responding correctly.');
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timeout - webhook endpoint took too long to respond');
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('Webhook test failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setWebhooks(prev => ({
        ...prev,
        [channelType]: {
          ...prev[channelType],
          status: 'error',
          errorCount: prev[channelType].errorCount + 1
        }
      }));
      
      // Update channel status
      setChannels(prev => prev.map(ch => 
        ch.type === channelType 
          ? { ...ch, status: 'error' as const, errorMessage }
          : ch
      ));
      
      alert('❌ Webhook test failed for ' + channelType + ':\n\n' + errorMessage + 
            '\n\nPlease check your webhook configuration and ensure the endpoint is accessible.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (conversationId: string, content: MessageContent) => {
    if (!channelManager) return;

    try {
      await channelManager.sendMessage(conversationId, content);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Channel Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {channels.map(channel => {
          const Icon = channelIcons[channel.type];
          return (
            <div key={channel.type} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${channelColors[channel.type]} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[channel.status]}`}>
                  {channel.status.replace('_', ' ')}
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{channel.name}</h3>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Messages:</span>
                  <span className="font-medium">{channel.messageCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Response Time:</span>
                  <span className="font-medium">
                    {channel.responseTime > 0 ? `${channel.responseTime}s` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Last Activity:</span>
                  <span className="font-medium">
                    {channel.messageCount > 0 ? channel.lastActivity.toLocaleTimeString() : 'Never'}
                  </span>
                </div>
                {channel.errorMessage && (
                  <div className="text-red-600 text-xs mt-2 p-2 bg-red-50 rounded border border-red-200">
                    <strong>Error:</strong> {channel.errorMessage}
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => handleChannelSetup(channel.type)}
                  disabled={isLoading}
                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <CogIcon className="w-4 h-4 inline mr-1" />
                  {isLoading ? 'Loading...' : 'Setup'}
                </button>
                <button
                  onClick={() => handleWebhookTest(channel.type)}
                  disabled={isLoading || channel.status === 'setup_required'}
                  className="flex-1 px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  title={channel.status === 'setup_required' ? 'Complete setup first' : 'Test webhook connection'}
                >
                  {isLoading ? (
                    <ArrowPathIcon className="w-4 h-4 inline mr-1 animate-spin" />
                  ) : (
                    <>
                      {channel.status === 'active' ? (
                        <CheckCircleIcon className="w-4 h-4 inline mr-1" />
                      ) : channel.status === 'error' ? (
                        <ExclamationTriangleIcon className="w-4 h-4 inline mr-1" />
                      ) : (
                        <CogIcon className="w-4 h-4 inline mr-1" />
                      )}
                    </>
                  )}
                  {isLoading ? 'Testing...' : 'Test'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Webhook Status */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Webhook Status</h3>
        <div className="space-y-4">
          {Object.entries(webhooks).map(([channel, webhook]) => {
            const channelName = channel.charAt(0).toUpperCase() + channel.slice(1);
            return (
              <div key={channel} className="p-4 bg-gray-50 rounded-lg border transition-colors hover:bg-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full ${channelColors[channel as ChannelType]} flex items-center justify-center`}>
                      {React.createElement(channelIcons[channel as ChannelType], { className: "w-4 h-4 text-white" })}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{channelName}</h4>
                      <p className="text-sm text-gray-500 font-mono">
                        {webhook.url || (
                          <span className="text-yellow-600 font-normal">Not configured</span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      webhook.status === 'active' ? 'text-green-600 bg-green-100' :
                      webhook.status === 'error' ? 'text-red-600 bg-red-100' :
                      'text-gray-600 bg-gray-100'
                    }`}>
                      {webhook.status === 'active' ? '✅ Active' :
                       webhook.status === 'error' ? '❌ Error' :
                       '⏸️ Inactive'}
                    </span>
                    
                    <button
                      onClick={() => handleWebhookTest(channel as ChannelType)}
                      disabled={isLoading || !webhook.url}
                      className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      title={!webhook.url ? 'Configure webhook URL first' : 'Test webhook connection'}
                    >
                      {isLoading ? 'Testing...' : 'Test'}
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-4">
                    {webhook.lastTriggered && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Last triggered: {webhook.lastTriggered.toLocaleString()}
                      </span>
                    )}
                    
                    {webhook.errorCount > 0 && (
                      <span className="flex items-center gap-1 text-red-500">
                        <ExclamationTriangleIcon className="w-3 h-3" />
                        {webhook.errorCount} error{webhook.errorCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  
                  {webhook.url && (
                    <span className="text-green-600">
                      ✓ Configured
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setActiveTab('setup')}
            className="flex items-center justify-center p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add New Channel
          </button>
          
          <button
            onClick={() => setActiveTab('inbox')}
            className="flex items-center justify-center p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
            Open Inbox
          </button>
          
          <button
            onClick={() => setActiveTab('analytics')}
            className="flex items-center justify-center p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100"
          >
            <ChartBarIcon className="w-5 h-5 mr-2" />
            View Analytics
          </button>
        </div>
      </div>
    </div>
  );

  const renderSetup = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Channel Setup</h3>
        
        {/* WhatsApp Setup */}
        <div id="setup-whatsapp" className="mb-8 p-4 rounded-lg border transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-8 h-8 rounded-full ${channelColors.whatsapp} flex items-center justify-center`}>
              <DevicePhoneMobileIcon className="w-4 h-4 text-white" />
            </div>
            <h4 className="text-md font-medium text-gray-900">WhatsApp Business</h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              whatsappConfig.accessToken ? 'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100'
            }`}>
              {whatsappConfig.accessToken ? 'Configured' : 'Setup Required'}
            </span>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h5 className="text-sm font-medium text-blue-900 mb-2">Setup Instructions:</h5>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Create a WhatsApp Business Account on Meta for Developers</li>
              <li>Get your Phone Number ID from the WhatsApp API configuration</li>
              <li>Generate a permanent access token (not temporary)</li>
              <li>Set up webhook URL: <code className="bg-blue-100 px-1 rounded">https://api.romashka.ai/webhooks/whatsapp</code></li>
              <li>Configure webhook secret for security</li>
            </ol>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number ID</label>
              <input
                type="text"
                value={whatsappConfig.phoneNumberId}
                onChange={(e) => setWhatsappConfig(prev => ({ ...prev, phoneNumberId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter Phone Number ID"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Access Token</label>
              <input
                type="password"
                value={whatsappConfig.accessToken}
                onChange={(e) => setWhatsappConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter Access Token"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Webhook Secret</label>
              <input
                type="password"
                value={whatsappConfig.webhookSecret}
                onChange={(e) => setWhatsappConfig(prev => ({ ...prev, webhookSecret: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter Webhook Secret"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Account ID</label>
              <input
                type="text"
                value={whatsappConfig.businessAccountId}
                onChange={(e) => setWhatsappConfig(prev => ({ ...prev, businessAccountId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter Business Account ID"
              />
            </div>
          </div>
        </div>

        {/* Instagram Setup */}
        <div id="setup-instagram" className="mb-8 p-4 rounded-lg border transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-8 h-8 rounded-full ${channelColors.instagram} flex items-center justify-center`}>
              <ChatBubbleLeftRightIcon className="w-4 h-4 text-white" />
            </div>
            <h4 className="text-md font-medium text-gray-900">Instagram DM</h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              instagramConfig.accessToken ? 'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100'
            }`}>
              {instagramConfig.accessToken ? 'Configured' : 'Setup Required'}
            </span>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
            <h5 className="text-sm font-medium text-purple-900 mb-2">Setup Instructions:</h5>
            <ol className="text-sm text-purple-700 space-y-1 list-decimal list-inside">
              <li>Create a Facebook App and add Instagram Basic Display</li>
              <li>Connect your Instagram Business Account</li>
              <li>Generate a long-lived access token</li>
              <li>Configure webhook URL: <code className="bg-purple-100 px-1 rounded">https://api.romashka.ai/webhooks/instagram</code></li>
              <li>Subscribe to messaging webhooks</li>
            </ol>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Access Token</label>
              <input
                type="password"
                value={instagramConfig.accessToken}
                onChange={(e) => setInstagramConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter Access Token"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">App Secret</label>
              <input
                type="password"
                value={instagramConfig.appSecret}
                onChange={(e) => setInstagramConfig(prev => ({ ...prev, appSecret: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter App Secret"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Page ID</label>
              <input
                type="text"
                value={instagramConfig.pageId}
                onChange={(e) => setInstagramConfig(prev => ({ ...prev, pageId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter Page ID"
              />
            </div>
          </div>
        </div>

        {/* Email Setup */}
        <div id="setup-email" className="mb-8 p-4 rounded-lg border transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-8 h-8 rounded-full ${channelColors.email} flex items-center justify-center`}>
              <EnvelopeIcon className="w-4 h-4 text-white" />
            </div>
            <h4 className="text-md font-medium text-gray-900">Email Support</h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              emailConfig.sendgridApiKey ? 'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100'
            }`}>
              {emailConfig.sendgridApiKey ? 'Configured' : 'Setup Required'}
            </span>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h5 className="text-sm font-medium text-blue-900 mb-2">Setup Instructions:</h5>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Create a SendGrid account and verify your domain</li>
              <li>Generate an API key with full access permissions</li>
              <li>Configure your support email address for incoming messages</li>
              <li>Set up email parsing webhook: <code className="bg-blue-100 px-1 rounded">https://api.romashka.ai/webhooks/email</code></li>
              <li>Test email sending and receiving functionality</li>
            </ol>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SendGrid API Key</label>
              <input
                type="password"
                value={emailConfig.sendgridApiKey}
                onChange={(e) => setEmailConfig(prev => ({ ...prev, sendgridApiKey: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter SendGrid API Key"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Support Email</label>
              <input
                type="email"
                value={emailConfig.supportEmail}
                onChange={(e) => setEmailConfig(prev => ({ ...prev, supportEmail: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="support@example.com"
              />
            </div>
          </div>
        </div>

        {/* Widget Setup */}
        <div id="setup-website" className="mb-8 p-4 rounded-lg border transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-8 h-8 rounded-full ${channelColors.website} flex items-center justify-center`}>
              <GlobeAltIcon className="w-4 h-4 text-white" />
            </div>
            <h4 className="text-md font-medium text-gray-900">Website Widget</h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              widgetConfig.enabled ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'
            }`}>
              {widgetConfig.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <h5 className="text-sm font-medium text-green-900 mb-2">Setup Instructions:</h5>
            <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
              <li>Enable the website widget below</li>
              <li>Configure your project ID (or use default)</li>
              <li>Customize widget appearance and behavior</li>
              <li>Copy the embed code and add it to your website</li>
              <li>Test the widget functionality on your site</li>
            </ol>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="widget-enabled"
                checked={widgetConfig.enabled}
                onChange={(e) => setWidgetConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="widget-enabled" className="ml-2 text-sm text-gray-700">
                Enable Website Widget
              </label>
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Project ID</label>
              <input
                type="text"
                value={widgetConfig.projectId}
                onChange={(e) => setWidgetConfig(prev => ({ ...prev, projectId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter Project ID"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            💡 Configurations are automatically saved to your browser. Make sure to test webhooks after setup.
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setWhatsappConfig({ phoneNumberId: '', accessToken: '', webhookSecret: '', businessAccountId: '' });
                setInstagramConfig({ accessToken: '', appSecret: '', pageId: '' });
                setEmailConfig({ sendgridApiKey: '', supportEmail: '', smtpHost: '', smtpPort: 587, smtpUser: '', smtpPassword: '', imapHost: '', imapPort: 993 });
                setWidgetConfig({ enabled: false, projectId: 'default-project' });
                localStorage.removeItem('romashka-channel-configs');
                alert('✅ All configurations cleared!');
              }}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear All
            </button>
            <button
              onClick={initializeChannelManager}
              disabled={isLoading}
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </div>

      {/* Widget Customizer */}
      {widgetConfig.enabled && (
        <WidgetCustomizer
          projectId={widgetConfig.projectId}
          onConfigChange={(config) => console.log('Widget config changed:', config)}
          onEmbedCodeGenerated={(code) => console.log('Embed code generated:', code)}
        />
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Messages</h3>
            <p className="text-3xl font-bold text-gray-900">{metrics.totalMessages}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Avg Response Time</h3>
            <p className="text-3xl font-bold text-gray-900">{metrics.averageResponseTime}s</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Satisfaction Score</h3>
            <p className="text-3xl font-bold text-gray-900">{metrics.satisfactionScore}/5</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Active Conversations</h3>
            <p className="text-3xl font-bold text-gray-900">{metrics.activeConversations}</p>
          </div>
        </div>
      )}

      {/* Channel Performance */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Channel Performance</h3>
        <div className="space-y-4">
          {Object.entries(metrics?.messagesByChannel || {}).map(([channel, count]) => (
            <div key={channel} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full ${channelColors[channel as ChannelType]} flex items-center justify-center`}>
                  {React.createElement(channelIcons[channel as ChannelType], { className: "w-4 h-4 text-white" })}
                </div>
                <span className="font-medium text-gray-900 capitalize">{channel}</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Messages</p>
                  <p className="font-semibold text-gray-900">{count}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Response Time</p>
                  <p className="font-semibold text-gray-900">{metrics?.responseTimesByChannel?.[channel] || 0}s</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Multi-Channel Hub</h1>
        <p className="text-gray-600 mt-2">
          Manage all your communication channels in one place
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: EyeIcon },
            { id: 'setup', label: 'Setup', icon: CogIcon },
            { id: 'inbox', label: 'Inbox', icon: ChatBubbleLeftRightIcon },
            { id: 'analytics', label: 'Analytics', icon: ChartBarIcon }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-screen">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'setup' && renderSetup()}
        {activeTab === 'inbox' && (
          <UnifiedInbox
            onSendMessage={handleSendMessage}
          />
        )}
        {activeTab === 'analytics' && renderAnalytics()}
      </div>
    </div>
  );
};

export default ChannelsPage;