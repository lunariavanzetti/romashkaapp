import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Wifi, 
  WifiOff,
  Zap,
  TrendingUp,
  TrendingDown,
  Pause,
  Play
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { integrationAnalyticsService } from '../../services/analytics/integrationAnalytics';

interface RealTimeMetrics {
  timestamp: string;
  active_integrations: number;
  api_calls_per_minute: number;
  success_rate: number;
  error_rate: number;
  avg_response_time: number;
  sync_jobs_running: number;
  alerts_count: number;
}

interface IntegrationStatus {
  provider: string;
  status: 'healthy' | 'warning' | 'error' | 'syncing';
  last_sync: string;
  next_sync: string;
  sync_progress?: number;
  error_message?: string;
  api_calls_today: number;
  rate_limit_remaining: number;
}

interface AlertItem {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  integration_provider?: string;
  acknowledged: boolean;
}

export default function RealTimeIntegrationMonitor() {
  const [metrics, setMetrics] = useState<RealTimeMetrics | null>(null);
  const [integrationStatuses, setIntegrationStatuses] = useState<IntegrationStatus[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        fetchRealTimeData();
      }, 5000); // Update every 5 seconds

      // Initial fetch
      fetchRealTimeData();

      return () => clearInterval(interval);
    }
  }, [isPaused]);

  const fetchRealTimeData = async () => {
    try {
      // Simulate real-time data fetching
      const mockMetrics: RealTimeMetrics = {
        timestamp: new Date().toISOString(),
        active_integrations: 3,
        api_calls_per_minute: Math.floor(Math.random() * 50) + 10,
        success_rate: 0.95 + Math.random() * 0.05,
        error_rate: Math.random() * 0.05,
        avg_response_time: Math.floor(Math.random() * 200) + 100,
        sync_jobs_running: Math.floor(Math.random() * 3),
        alerts_count: Math.floor(Math.random() * 5)
      };

      const mockStatuses: IntegrationStatus[] = [
        {
          provider: 'hubspot',
          status: Math.random() > 0.8 ? 'warning' : 'healthy',
          last_sync: new Date(Date.now() - Math.random() * 3600000).toISOString(),
          next_sync: new Date(Date.now() + Math.random() * 3600000).toISOString(),
          api_calls_today: Math.floor(Math.random() * 1000) + 100,
          rate_limit_remaining: Math.floor(Math.random() * 5000) + 1000
        },
        {
          provider: 'shopify',
          status: Math.random() > 0.9 ? 'error' : 'healthy',
          last_sync: new Date(Date.now() - Math.random() * 3600000).toISOString(),
          next_sync: new Date(Date.now() + Math.random() * 3600000).toISOString(),
          api_calls_today: Math.floor(Math.random() * 800) + 50,
          rate_limit_remaining: Math.floor(Math.random() * 2000) + 500
        },
        {
          provider: 'salesforce',
          status: Math.random() > 0.85 ? 'syncing' : 'healthy',
          last_sync: new Date(Date.now() - Math.random() * 3600000).toISOString(),
          next_sync: new Date(Date.now() + Math.random() * 3600000).toISOString(),
          sync_progress: Math.random() > 0.5 ? Math.floor(Math.random() * 100) : undefined,
          api_calls_today: Math.floor(Math.random() * 1500) + 200,
          rate_limit_remaining: Math.floor(Math.random() * 10000) + 2000
        }
      ];

      const mockAlerts: AlertItem[] = [
        {
          id: '1',
          type: 'warning',
          title: 'High API Usage',
          message: 'HubSpot API usage is approaching rate limit',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          integration_provider: 'hubspot',
          acknowledged: false
        },
        {
          id: '2',
          type: 'info',
          title: 'Sync Completed',
          message: 'Shopify product sync completed successfully',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          integration_provider: 'shopify',
          acknowledged: true
        }
      ];

      setMetrics(mockMetrics);
      setIntegrationStatuses(mockStatuses);
      setAlerts(mockAlerts);
      setLastUpdate(new Date());
      setIsConnected(true);
    } catch (error) {
      console.error('Error fetching real-time data:', error);
      setIsConnected(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-100 border-red-200';
      case 'syncing': return 'text-blue-600 bg-blue-100 border-blue-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'error': return <XCircle className="w-4 h-4" />;
      case 'syncing': return <Activity className="w-4 h-4 animate-spin" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const formatNextSync = (timestamp: string) => {
    const diff = new Date(timestamp).getTime() - Date.now();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `in ${hours}h`;
    if (minutes > 0) return `in ${minutes}m`;
    return 'Soon';
  };

  return (
    <div className="space-y-6">
      {/* Connection Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            {isConnected ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            <span className="font-medium">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <span className="text-sm text-gray-500">
            Last update: {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsPaused(!isPaused)}
        >
          {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
          {isPaused ? 'Resume' : 'Pause'}
        </Button>
      </div>

      {/* Real-time Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">API Calls/min</p>
                  <p className="text-2xl font-bold">{metrics.api_calls_per_minute}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Success Rate</p>
                  <p className="text-2xl font-bold text-green-600">
                    {(metrics.success_rate * 100).toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Avg Response</p>
                  <p className="text-2xl font-bold">{metrics.avg_response_time}ms</p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Active Syncs</p>
                  <p className="text-2xl font-bold">{metrics.sync_jobs_running}</p>
                </div>
                <Zap className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Integration Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {integrationStatuses.map((integration) => (
          <Card key={integration.provider}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg capitalize">{integration.provider}</CardTitle>
                <Badge className={`${getStatusColor(integration.status)} border`}>
                  {getStatusIcon(integration.status)}
                  {integration.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Last Sync:</span>
                <span>{formatTimeAgo(integration.last_sync)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Next Sync:</span>
                <span>{formatNextSync(integration.next_sync)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">API Calls Today:</span>
                <span>{integration.api_calls_today.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Rate Limit:</span>
                <span className={integration.rate_limit_remaining < 1000 ? 'text-red-500' : ''}>
                  {integration.rate_limit_remaining.toLocaleString()} remaining
                </span>
              </div>
              
              {integration.sync_progress !== undefined && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">Sync Progress:</span>
                    <span>{integration.sync_progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${integration.sync_progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {integration.error_message && (
                <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">
                  {integration.error_message}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Active Alerts ({alerts.filter(a => !a.acknowledged).length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No active alerts. All systems operating normally.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 border rounded-lg ${
                    alert.acknowledged 
                      ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60' 
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{alert.title}</h4>
                          {alert.integration_provider && (
                            <Badge variant="outline" className="text-xs">
                              {alert.integration_provider}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          {alert.message}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatTimeAgo(alert.timestamp)}
                        </p>
                      </div>
                    </div>
                    {!alert.acknowledged && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        Acknowledge
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}