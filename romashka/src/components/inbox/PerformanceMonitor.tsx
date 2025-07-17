import React, { useState, useEffect } from 'react';
import { 
  ClockIcon, 
  ChatBubbleBottomCenterTextIcon, 
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { realtimeMessagingService } from '../../services/messaging/realTimeMessaging';
import { multiChannelIntegrationManager } from '../../services/messaging/multiChannelIntegration';
import type { ChannelType } from '../../services/channels/types';

interface PerformanceMetrics {
  averageResponseTime: number;
  aiResolutionRate: number;
  totalMessages: number;
  channelBreakdown: Record<string, number>;
}

interface ChannelMetrics {
  [key: string]: {
    isConnected: boolean;
    messageCount: number;
    errorCount: number;
    lastActivity: Date;
  };
}

const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    averageResponseTime: 0,
    aiResolutionRate: 0,
    totalMessages: 0,
    channelBreakdown: {}
  });
  const [channelMetrics, setChannelMetrics] = useState<ChannelMetrics>({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Load performance metrics
  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      
      // Get messaging performance metrics
      const messagingMetrics = realtimeMessagingService.getPerformanceMetrics();
      setMetrics(messagingMetrics);

      // Get channel statuses
      const channelStatuses = await multiChannelIntegrationManager.getAllChannelStatuses();
      setChannelMetrics(channelStatuses);

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading performance metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh metrics every 30 seconds
  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  // Format response time for display
  const formatResponseTime = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 10000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.round(ms / 1000)}s`;
  };

  // Get performance status color
  const getResponseTimeColor = (ms: number): string => {
    if (ms <= 3000) return 'text-green-600';
    if (ms <= 6000) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get AI resolution rate color
  const getAIResolutionColor = (rate: number): string => {
    if (rate >= 0.8) return 'text-green-600';
    if (rate >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const channelIcons: Record<ChannelType, any> = {
    whatsapp: ChatBubbleBottomCenterTextIcon,
    instagram: ChatBubbleBottomCenterTextIcon,
    email: ChatBubbleBottomCenterTextIcon,
    website: ChatBubbleBottomCenterTextIcon,
    sms: ChatBubbleBottomCenterTextIcon,
    messenger: ChatBubbleBottomCenterTextIcon
  };

  const channelColors: Record<ChannelType, string> = {
    whatsapp: 'bg-green-500',
    instagram: 'bg-pink-500',
    email: 'bg-blue-500',
    website: 'bg-purple-500',
    sms: 'bg-yellow-500',
    messenger: 'bg-indigo-500'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Performance Monitor</h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <button
            onClick={loadMetrics}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Main Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Average Response Time */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ClockIcon className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Avg Response Time</span>
            </div>
            <div className="flex items-center space-x-1">
              {metrics.averageResponseTime <= 6000 ? (
                <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
              )}
            </div>
          </div>
          <div className="mt-2">
            <span className={`text-2xl font-bold ${getResponseTimeColor(metrics.averageResponseTime)}`}>
              {formatResponseTime(metrics.averageResponseTime)}
            </span>
            <div className="text-xs text-gray-500 mt-1">
              Target: &lt;6s (Lyro.ai standard)
            </div>
          </div>
        </div>

        {/* AI Resolution Rate */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">AI Resolution Rate</span>
            </div>
            <div className="flex items-center space-x-1">
              {metrics.aiResolutionRate >= 0.7 ? (
                <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
              )}
            </div>
          </div>
          <div className="mt-2">
            <span className={`text-2xl font-bold ${getAIResolutionColor(metrics.aiResolutionRate)}`}>
              {(metrics.aiResolutionRate * 100).toFixed(1)}%
            </span>
            <div className="text-xs text-gray-500 mt-1">
              Target: &gt;70% automated resolution
            </div>
          </div>
        </div>

        {/* Total Messages */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ChatBubbleBottomCenterTextIcon className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Messages (24h)</span>
            </div>
            <ChartBarIcon className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-gray-900">
              {metrics.totalMessages}
            </span>
            <div className="text-xs text-gray-500 mt-1">
              All channels combined
            </div>
          </div>
        </div>
      </div>

      {/* Channel Performance */}
      <div className="mb-8">
        <h3 className="text-md font-semibold text-gray-900 mb-4">Channel Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(channelMetrics).map(([channelType, status]) => {
            const Icon = channelIcons[channelType as ChannelType];
            const colorClass = channelColors[channelType as ChannelType];
            
            return (
              <div key={channelType} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className={`w-8 h-8 rounded-full ${colorClass} flex items-center justify-center`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {channelType}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {status.isConnected ? (
                      <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    ) : (
                      <ExclamationCircleIcon className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-xs ${status.isConnected ? 'text-green-600' : 'text-red-600'}`}>
                      {status.isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Messages:</span>
                    <span className="font-medium">{status.messageCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Errors:</span>
                    <span className={`font-medium ${status.errorCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {status.errorCount}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Last Activity:</span>
                    <span className="font-medium text-gray-900">
                      {status.lastActivity.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Channel Message Breakdown */}
      <div>
        <h3 className="text-md font-semibold text-gray-900 mb-4">Message Distribution</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="space-y-3">
            {Object.entries(metrics.channelBreakdown).map(([channel, count]) => {
              const percentage = metrics.totalMessages > 0 ? (count / metrics.totalMessages) * 100 : 0;
              const colorClass = channelColors[channel as ChannelType];
              
              return (
                <div key={channel} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${colorClass}`}></div>
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {channel}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${colorClass}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {count}
                    </span>
                    <span className="text-sm text-gray-500 w-12 text-right">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Performance Indicators */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Performance Status</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${metrics.averageResponseTime <= 6000 ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-blue-800">
              Response Time: {metrics.averageResponseTime <= 6000 ? 'Excellent' : 'Needs Improvement'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${metrics.aiResolutionRate >= 0.7 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span className="text-blue-800">
              AI Resolution: {metrics.aiResolutionRate >= 0.7 ? 'Good' : 'Moderate'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${metrics.totalMessages > 0 ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="text-blue-800">
              Activity: {metrics.totalMessages > 0 ? 'Active' : 'Quiet'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;