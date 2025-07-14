import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  PhoneIcon as Phone, 
  ChatBubbleLeftRightIcon as MessageSquare, 
  UsersIcon as Users, 
  ChartBarIcon as TrendingUp, 
  CogIcon as Settings, 
  ClockIcon as Clock, 
  ExclamationTriangleIcon as AlertCircle, 
  CheckCircleIcon as CheckCircle, 
  XCircleIcon as XCircle, 
  PlayIcon as Play, 
  PauseIcon as Pause 
} from '@heroicons/react/24/outline';

import WhatsAppOverview from './components/WhatsAppOverview';
import WhatsAppTemplates from './components/WhatsAppTemplates';
import WhatsAppAutomation from './components/WhatsAppAutomation';
import WhatsAppAnalytics from './components/WhatsAppAnalytics';
import WhatsAppSettings from './components/WhatsAppSettings';
import WhatsAppBusinessProfile from './components/WhatsAppBusinessProfile';
import WhatsAppConversations from './components/WhatsAppConversations';

interface WhatsAppChannelStatus {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'pending_setup' | 'error';
  phoneNumber: string;
  businessName: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  lastActivity: string;
  messagesSentToday: number;
  messagesLimit: number;
  features: {
    templates: boolean;
    interactive: boolean;
    automation: boolean;
    analytics: boolean;
  };
}

const WhatsAppManagement: React.FC = () => {
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [channels, setChannels] = useState<WhatsAppChannelStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadWhatsAppChannels();
  }, []);

  const loadWhatsAppChannels = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would fetch from the API
      const mockChannels: WhatsAppChannelStatus[] = [
        {
          id: '1',
          name: 'Main Business Line',
          status: 'active',
          phoneNumber: '+1234567890',
          businessName: 'ROMASHKA',
          verificationStatus: 'verified',
          lastActivity: '2 minutes ago',
          messagesSentToday: 47,
          messagesLimit: 1000,
          features: {
            templates: true,
            interactive: true,
            automation: true,
            analytics: true
          }
        },
        {
          id: '2',
          name: 'Support Line',
          status: 'pending_setup',
          phoneNumber: '+1234567891',
          businessName: 'ROMASHKA Support',
          verificationStatus: 'pending',
          lastActivity: 'Never',
          messagesSentToday: 0,
          messagesLimit: 500,
          features: {
            templates: false,
            interactive: false,
            automation: false,
            analytics: false
          }
        }
      ];

      setChannels(mockChannels);
      if (mockChannels.length > 0) {
        setSelectedChannel(mockChannels[0].id);
      }
    } catch (error) {
      console.error('Failed to load WhatsApp channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: WhatsAppChannelStatus['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800"><Pause className="w-3 h-3 mr-1" />Inactive</Badge>;
      case 'pending_setup':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending Setup</Badge>;
      case 'error':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getVerificationBadge = (status: WhatsAppChannelStatus['verificationStatus']) => {
    switch (status) {
      case 'verified':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const toggleChannelStatus = async (channelId: string) => {
    try {
      setChannels(prev => prev.map(channel => 
        channel.id === channelId 
          ? { ...channel, status: channel.status === 'active' ? 'inactive' : 'active' }
          : channel
      ));
      // In a real implementation, this would call the API
    } catch (error) {
      console.error('Failed to toggle channel status:', error);
    }
  };

  const currentChannel = channels.find(c => c.id === selectedChannel);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Phone className="w-8 h-8 mr-3 text-green-600" />
              WhatsApp Business
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your WhatsApp Business API integration, templates, and automation
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button size="sm">
              <MessageSquare className="w-4 h-4 mr-2" />
              New Channel
            </Button>
          </div>
        </div>
      </div>

      {/* Channel Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Phone className="w-5 h-5 mr-2" />
            WhatsApp Channels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {channels.map((channel) => (
              <div
                key={channel.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedChannel === channel.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedChannel(channel.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{channel.name}</h3>
                  <div className="flex space-x-1">
                    {getStatusBadge(channel.status)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleChannelStatus(channel.id);
                      }}
                    >
                      {channel.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Phone:</strong> {channel.phoneNumber}</p>
                  <p><strong>Business:</strong> {channel.businessName}</p>
                  <div className="flex items-center">
                    <strong className="mr-2">Verification:</strong>
                    {getVerificationBadge(channel.verificationStatus)}
                  </div>
                </div>

                <div className="mt-3 flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Last activity: {channel.lastActivity}
                  </span>
                  <div className="text-xs text-gray-500">
                    {channel.messagesSentToday}/{channel.messagesLimit} messages today
                  </div>
                </div>

                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(channel.messagesSentToday / channel.messagesLimit) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Channel Management Tabs */}
      {currentChannel && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="conversations">Conversations</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <WhatsAppOverview channel={currentChannel} />
          </TabsContent>

          <TabsContent value="conversations" className="mt-6">
            <WhatsAppConversations channelId={currentChannel.id} />
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <WhatsAppTemplates channelId={currentChannel.id} />
          </TabsContent>

          <TabsContent value="automation" className="mt-6">
            <WhatsAppAutomation channelId={currentChannel.id} />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <WhatsAppAnalytics channelId={currentChannel.id} />
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <WhatsAppBusinessProfile channelId={currentChannel.id} />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <WhatsAppSettings channelId={currentChannel.id} />
          </TabsContent>
        </Tabs>
      )}

      {/* No Channel Selected */}
      {!currentChannel && (
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No WhatsApp Channel Selected</h3>
            <p className="text-gray-600 mb-4">
              Select a WhatsApp channel to manage its settings, templates, and automation rules.
            </p>
            <Button>
              <MessageSquare className="w-4 h-4 mr-2" />
              Set Up New Channel
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WhatsAppManagement;