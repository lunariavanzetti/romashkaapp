import React, { useState, useEffect } from 'react';
import { ChannelManager } from '../../services/channels/channelManager';
import type { ChannelType, ChannelConfig as ChannelConfigType } from '../../services/channels/types';
import { Button, Badge } from '../ui';
import { 
  Phone, 
  Mail, 
  Smartphone, 
  Instagram, 
  Facebook,
  Globe,
  Settings,
  TestTube,
  CheckCircle,
  XCircle,
  AlertCircle,
  Save,
  Trash2
} from 'lucide-react';

interface ChannelConfigProps {
  onConfigUpdate?: () => void;
}

const channelInfo: Record<ChannelType, {
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  setupSteps: string[];
  requiredFields: string[];
}> = {
  whatsapp: {
    name: 'WhatsApp Business',
    icon: Phone,
    description: 'Connect your WhatsApp Business account to receive and send messages',
    setupSteps: [
      'Create a WhatsApp Business app in Meta Developer Console',
      'Get your Phone Number ID and Access Token',
      'Configure webhook URL',
      'Set up message templates'
    ],
    requiredFields: ['phoneNumberId', 'accessToken', 'webhookSecret']
  },
  messenger: {
    name: 'Facebook Messenger',
    icon: Facebook,
    description: 'Integrate with Facebook Messenger for customer support',
    setupSteps: [
      'Create a Facebook app in Meta Developer Console',
      'Get your Page Access Token',
      'Configure webhook URL',
      'Set up page permissions'
    ],
    requiredFields: ['pageAccessToken', 'appSecret', 'verifyToken']
  },
  instagram: {
    name: 'Instagram Direct Messages',
    icon: Instagram,
    description: 'Handle Instagram Direct Messages for customer inquiries',
    setupSteps: [
      'Connect your Instagram Business account',
      'Get your Access Token',
      'Configure webhook URL',
      'Set up message permissions'
    ],
    requiredFields: ['accessToken', 'appSecret', 'pageId']
  },
  email: {
    name: 'Email Support',
    icon: Mail,
    description: 'Set up email support with SMTP/IMAP integration',
    setupSteps: [
      'Configure SMTP server settings',
      'Set up IMAP for incoming emails',
      'Configure support email address',
      'Set up email templates'
    ],
    requiredFields: ['smtpHost', 'smtpUser', 'smtpPassword', 'supportEmail']
  },
  sms: {
    name: 'SMS Support',
    icon: Smartphone,
    description: 'Enable SMS support using Twilio or other providers',
    setupSteps: [
      'Choose SMS provider (Twilio, MessageBird, etc.)',
      'Get API credentials',
      'Configure phone number',
      'Set up webhook for delivery status'
    ],
    requiredFields: ['provider', 'apiKey', 'apiSecret', 'phoneNumber']
  },
  website: {
    name: 'Website Chat',
    icon: Globe,
    description: 'Configure the website chat widget',
    setupSteps: [
      'Customize chat widget appearance',
      'Set up chat positioning',
      'Configure welcome messages',
      'Set up chat routing rules'
    ],
    requiredFields: ['theme', 'position']
  }
};

export const ChannelConfig: React.FC<ChannelConfigProps> = ({ onConfigUpdate }) => {
  const [channels, setChannels] = useState<ChannelConfigType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<ChannelType | null>(null);
  const [configForm, setConfigForm] = useState<Record<string, any>>({});
  const [testing, setTesting] = useState<Record<ChannelType, boolean>>({} as any);
  const [channelManager] = useState(() => new ChannelManager());

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      setLoading(true);
      const { supabase } = await import('../../services/supabaseClient');
      if (!supabase) return;

      const { data } = await supabase
        .from('communication_channels')
        .select('*')
        .order('name');

      setChannels(data || []);
    } catch (error) {
      console.error('Failed to load channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChannelSelect = (channelType: ChannelType) => {
    setSelectedChannel(channelType);
    const channel = channels.find(c => c.type === channelType);
    if (channel) {
      setConfigForm(channel.configuration || {});
    } else {
      setConfigForm({});
    }
  };

  const handleConfigChange = (field: string, value: any) => {
    setConfigForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveConfig = async () => {
    if (!selectedChannel) return;

    try {
      const { supabase } = await import('../../services/supabaseClient');
      if (!supabase) return;

      const channelData = {
        name: channelInfo[selectedChannel].name,
        type: selectedChannel,
        status: 'active',
        configuration: configForm,
        updated_at: new Date().toISOString()
      };

      const existingChannel = channels.find(c => c.type === selectedChannel);

      if (existingChannel) {
        await supabase
          .from('communication_channels')
          .update(channelData)
          .eq('id', existingChannel.id);
      } else {
        await supabase
          .from('communication_channels')
          .insert(channelData);
      }

      await loadChannels();
      onConfigUpdate?.();
    } catch (error) {
      console.error('Failed to save channel config:', error);
    }
  };

  const handleTestChannel = async (channelType: ChannelType) => {
    setTesting(prev => ({ ...prev, [channelType]: true }));

    try {
      // Simulate testing - in real implementation, this would test the actual channel
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // TODO: Implement actual channel testing
      console.log(`Testing ${channelType} channel...`);
    } catch (error) {
      console.error(`Failed to test ${channelType} channel:`, error);
    } finally {
      setTesting(prev => ({ ...prev, [channelType]: false }));
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    try {
      const { supabase } = await import('../../services/supabaseClient');
      if (!supabase) return;

      await supabase
        .from('communication_channels')
        .delete()
        .eq('id', channelId);

      await loadChannels();
      onConfigUpdate?.();
    } catch (error) {
      console.error('Failed to delete channel:', error);
    }
  };

  const getChannelStatus = (channel: ChannelConfigType) => {
    const info = channelInfo[channel.type];
    const requiredFields = info.requiredFields;
    const hasAllFields = requiredFields.every((field: string) => 
      channel.configuration && channel.configuration[field]
    );

    if (channel.status === 'active' && hasAllFields) {
      return { status: 'active', icon: CheckCircle, color: 'text-green-600' };
    } else if (channel.status === 'pending_setup') {
      return { status: 'pending', icon: AlertCircle, color: 'text-yellow-600' };
    } else {
      return { status: 'inactive', icon: XCircle, color: 'text-red-600' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Channel List */}
      <div className="w-1/3 border-r border-gray-200 p-4">
        <h2 className="text-lg font-semibold mb-4">Communication Channels</h2>
        
        <div className="space-y-2">
          {Object.entries(channelInfo).map(([type, info]) => {
            const Icon = info.icon;
            const channel = channels.find(c => c.type === type);
            const status = channel ? getChannelStatus(channel) : null;
            const StatusIcon = status?.icon || XCircle;

            return (
              <div
                key={type}
                onClick={() => handleChannelSelect(type as ChannelType)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedChannel === type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-gray-600" />
                    <div>
                      <h3 className="font-medium text-gray-900">{info.name}</h3>
                      <p className="text-sm text-gray-500">{info.description}</p>
                    </div>
                  </div>
                  {status && (
                    <StatusIcon className={`h-4 w-4 ${status.color}`} />
                  )}
                </div>
                
                {channel && (
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant={status?.status === 'active' ? 'default' : 'secondary'}>
                      {status?.status}
                    </Badge>
                                         <Button
                       variant="outline"
                       onClick={(e) => {
                         e.stopPropagation();
                         handleTestChannel(type as ChannelType);
                       }}
                       disabled={testing[type as ChannelType]}
                     >
                      <TestTube className="h-3 w-3 mr-1" />
                      {testing[type as ChannelType] ? 'Testing...' : 'Test'}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="flex-1 p-6">
        {selectedChannel ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {React.createElement(channelInfo[selectedChannel].icon, { className: 'h-6 w-6' })}
                <h2 className="text-xl font-semibold">{channelInfo[selectedChannel].name}</h2>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleTestChannel(selectedChannel)}
                  disabled={testing[selectedChannel]}
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  {testing[selectedChannel] ? 'Testing...' : 'Test Connection'}
                </Button>
                <Button onClick={handleSaveConfig}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Configuration
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Configuration Form */}
              <div>
                <h3 className="text-lg font-medium mb-4">Configuration</h3>
                <div className="space-y-4">
                  {channelInfo[selectedChannel].requiredFields.map(field => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.charAt(0).toUpperCase() + field.slice(1)}
                      </label>
                      <input
                        type={field.includes('password') || field.includes('secret') ? 'password' : 'text'}
                        value={configForm[field] || ''}
                        onChange={(e) => handleConfigChange(field, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={`Enter ${field}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Setup Instructions */}
              <div>
                <h3 className="text-lg font-medium mb-4">Setup Instructions</h3>
                <div className="space-y-3">
                  {channelInfo[selectedChannel].setupSteps.map((step, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <p className="text-sm text-gray-600">{step}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Webhook URL</h4>
                  <p className="text-sm text-blue-700 mb-2">
                    Use this URL for your webhook configuration:
                  </p>
                  <code className="block text-xs bg-blue-100 p-2 rounded">
                    {`https://your-domain.com/api/webhooks/${selectedChannel}`}
                  </code>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <Settings className="h-12 w-12 mb-4" />
            <p>Select a channel to configure</p>
          </div>
        )}
      </div>
    </div>
  );
}; 