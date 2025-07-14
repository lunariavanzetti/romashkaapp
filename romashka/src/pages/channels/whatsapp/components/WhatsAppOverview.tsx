import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui';
import { Progress } from '@/components/ui/progress';
import { 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Clock, 
  Send, 
  Eye, 
  CheckCircle, 
  XCircle,
  Activity,
  AlertCircle,
  Phone,
  Settings,
  Zap
} from 'lucide-react';

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

interface OverviewStats {
  totalMessages: number;
  messagesDelivered: number;
  messagesRead: number;
  responseTime: number;
  activeConversations: number;
  newCustomers: number;
  automationTriggered: number;
  templatesSent: number;
}

interface RecentActivity {
  id: string;
  type: 'message_sent' | 'message_received' | 'automation_triggered' | 'template_sent' | 'customer_joined';
  description: string;
  timestamp: string;
  customer?: string;
  status?: 'success' | 'failed' | 'pending';
}

interface WhatsAppOverviewProps {
  channel: WhatsAppChannelStatus;
}

const WhatsAppOverview: React.FC<WhatsAppOverviewProps> = ({ channel }) => {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverviewData();
  }, [channel.id]);

  const loadOverviewData = async () => {
    try {
      setLoading(true);
      
      // Mock data - in real implementation, this would come from API
      const mockStats: OverviewStats = {
        totalMessages: 342,
        messagesDelivered: 338,
        messagesRead: 312,
        responseTime: 4.2,
        activeConversations: 23,
        newCustomers: 12,
        automationTriggered: 67,
        templatesSent: 45
      };

      const mockActivity: RecentActivity[] = [
        {
          id: '1',
          type: 'message_received',
          description: 'New message from customer',
          timestamp: '2 minutes ago',
          customer: '+1234567890',
          status: 'success'
        },
        {
          id: '2',
          type: 'automation_triggered',
          description: 'Welcome message sent to new customer',
          timestamp: '5 minutes ago',
          customer: '+1234567891',
          status: 'success'
        },
        {
          id: '3',
          type: 'template_sent',
          description: 'Order confirmation template sent',
          timestamp: '12 minutes ago',
          customer: '+1234567892',
          status: 'success'
        },
        {
          id: '4',
          type: 'customer_joined',
          description: 'New customer started conversation',
          timestamp: '18 minutes ago',
          customer: '+1234567893',
          status: 'success'
        },
        {
          id: '5',
          type: 'message_sent',
          description: 'Message delivery failed',
          timestamp: '25 minutes ago',
          customer: '+1234567894',
          status: 'failed'
        }
      ];

      setStats(mockStats);
      setRecentActivity(mockActivity);
    } catch (error) {
      console.error('Failed to load overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'message_sent':
        return <Send className="w-4 h-4 text-blue-600" />;
      case 'message_received':
        return <MessageSquare className="w-4 h-4 text-green-600" />;
      case 'automation_triggered':
        return <Zap className="w-4 h-4 text-yellow-600" />;
      case 'template_sent':
        return <Settings className="w-4 h-4 text-purple-600" />;
      case 'customer_joined':
        return <Users className="w-4 h-4 text-emerald-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusIndicator = (status: RecentActivity['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'failed':
        return <XCircle className="w-3 h-3 text-red-500" />;
      case 'pending':
        return <Clock className="w-3 h-3 text-yellow-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <AlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Data</h3>
          <p className="text-gray-600 mb-4">
            There was an issue loading the overview data for this channel.
          </p>
          <Button onClick={loadOverviewData}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const deliveryRate = ((stats.messagesDelivered / stats.totalMessages) * 100).toFixed(1);
  const readRate = ((stats.messagesRead / stats.totalMessages) * 100).toFixed(1);
  const usagePercentage = ((channel.messagesSentToday / channel.messagesLimit) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Messages</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalMessages}</p>
                <p className="text-xs text-gray-500">Today</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Conversations</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeConversations}</p>
                <p className="text-xs text-gray-500">Currently open</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-gray-900">{stats.responseTime}m</p>
                <p className="text-xs text-gray-500">Minutes</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New Customers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.newCustomers}</p>
                <p className="text-xs text-gray-500">Today</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Message Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-600">Delivery Rate</span>
                  <span className="text-sm font-semibold text-gray-900">{deliveryRate}%</span>
                </div>
                <Progress value={parseFloat(deliveryRate)} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-600">Read Rate</span>
                  <span className="text-sm font-semibold text-gray-900">{readRate}%</span>
                </div>
                <Progress value={parseFloat(readRate)} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-600">Daily Usage</span>
                  <span className="text-sm font-semibold text-gray-900">{usagePercentage}%</span>
                </div>
                <Progress value={parseFloat(usagePercentage)} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">
                  {channel.messagesSentToday} of {channel.messagesLimit} messages used
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              Automation Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Automation Triggered</span>
                <span className="text-2xl font-bold text-gray-900">{stats.automationTriggered}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Templates Sent</span>
                <span className="text-2xl font-bold text-gray-900">{stats.templatesSent}</span>
              </div>
              
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Automation Rate</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    {((stats.automationTriggered / stats.totalMessages) * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{activity.timestamp}</span>
                    {activity.customer && (
                      <>
                        <span>•</span>
                        <span>{activity.customer}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {getStatusIndicator(activity.status)}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              View All Activity
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Channel Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Phone className="w-5 h-5 mr-2" />
            Channel Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Phone Number</span>
                <span className="text-sm font-semibold text-gray-900">{channel.phoneNumber}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Business Name</span>
                <span className="text-sm font-semibold text-gray-900">{channel.businessName}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Status</span>
                <Badge variant={channel.status === 'active' ? 'default' : 'secondary'}>
                  {channel.status}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Verification</span>
                <Badge variant={channel.verificationStatus === 'verified' ? 'default' : 'outline'}>
                  {channel.verificationStatus}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Last Activity</span>
                <span className="text-sm font-semibold text-gray-900">{channel.lastActivity}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Features</span>
                <div className="flex space-x-1">
                  {channel.features.templates && <Badge variant="outline" className="text-xs">Templates</Badge>}
                  {channel.features.interactive && <Badge variant="outline" className="text-xs">Interactive</Badge>}
                  {channel.features.automation && <Badge variant="outline" className="text-xs">Automation</Badge>}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppOverview;