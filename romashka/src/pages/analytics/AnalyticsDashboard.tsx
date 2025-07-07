import React, { useState, useEffect, useCallback } from 'react';
import { realtimeAnalytics } from '../../services/analytics/realtimeAnalytics';
import { analyticsEngine } from '../../services/analytics/analyticsEngine';
import type { LiveMetrics, DashboardConfig, WidgetLayout, TimeRange } from '../../types/analytics';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { cn } from '../../utils/cn';

// Widget Components
import { KPICard } from '../../components/analytics/widgets/KPICard';
import { LineChart } from '../../components/analytics/widgets/LineChart';
import { BarChart } from '../../components/analytics/widgets/BarChart';
import { PieChart } from '../../components/analytics/widgets/PieChart';
import { GaugeChart } from '../../components/analytics/widgets/GaugeChart';
import { TableWidget } from '../../components/analytics/widgets/TableWidget';

interface AnalyticsDashboardProps {
  className?: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ className }) => {
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end: new Date(),
    label: 'Last 7 days'
  });
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['all']);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(['all']);

  // Default dashboard layout
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>({
    id: 'default',
    name: 'Analytics Dashboard',
    isDefault: true,
    layout: [
      {
        id: 'active-conversations',
        type: 'kpi',
        position: { x: 0, y: 0, w: 3, h: 2 },
        config: {
          title: 'Active Conversations',
          metric: 'activeConversations',
          trend: 'up',
          changePercent: 12.5
        }
      },
      {
        id: 'satisfaction-score',
        type: 'gauge',
        position: { x: 3, y: 0, w: 3, h: 2 },
        config: {
          title: 'Customer Satisfaction',
          metric: 'satisfactionScore',
          min: 0,
          max: 5,
          thresholds: [
            { value: 3, color: '#ef4444', label: 'Poor' },
            { value: 4, color: '#f59e0b', label: 'Good' },
            { value: 5, color: '#10b981', label: 'Excellent' }
          ]
        }
      },
      {
        id: 'ai-resolution-rate',
        type: 'kpi',
        position: { x: 6, y: 0, w: 3, h: 2 },
        config: {
          title: 'AI Resolution Rate',
          metric: 'aiResolutionRate',
          format: 'percentage',
          trend: 'up',
          changePercent: 8.2
        }
      },
      {
        id: 'response-time',
        type: 'kpi',
        position: { x: 9, y: 0, w: 3, h: 2 },
        config: {
          title: 'Avg Response Time',
          metric: 'avgResponseTime',
          format: 'seconds',
          trend: 'down',
          changePercent: -15.3
        }
      },
      {
        id: 'conversations-trend',
        type: 'line-chart',
        position: { x: 0, y: 2, w: 6, h: 4 },
        config: {
          title: 'Conversations Trend',
          metric: 'total_conversations',
          timeRange: '7d',
          showLegend: true
        }
      },
      {
        id: 'channel-activity',
        type: 'bar-chart',
        position: { x: 6, y: 2, w: 6, h: 4 },
        config: {
          title: 'Channel Activity',
          metric: 'volume',
          dimension: 'channel',
          showLegend: true
        }
      },
      {
        id: 'satisfaction-distribution',
        type: 'pie-chart',
        position: { x: 0, y: 6, w: 4, h: 4 },
        config: {
          title: 'Satisfaction Distribution',
          metric: 'satisfaction_score',
          dimension: 'rating',
          showLegend: true
        }
      },
      {
        id: 'agent-performance',
        type: 'table',
        position: { x: 4, y: 6, w: 8, h: 4 },
        config: {
          title: 'Agent Performance',
          columns: ['name', 'activeConversations', 'avgResponseTime', 'satisfactionScore'],
          sortBy: 'satisfactionScore',
          sortOrder: 'desc'
        }
      }
    ],
          filters: {
        timeRange: '7d',
        channels: ['all'],
        departments: ['all'],
        agents: ['all']
      },
    refreshInterval: 300,
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get initial live metrics
        const metrics = await realtimeAnalytics.getLiveMetrics();
        setLiveMetrics(metrics);

        // Subscribe to real-time updates
        const subscriptionId = await realtimeAnalytics.subscribeToMetrics((metrics) => {
          setLiveMetrics(metrics);
        });

        setLoading(false);

        // Cleanup subscription on unmount
        return () => {
          realtimeAnalytics.unsubscribeFromMetrics(subscriptionId);
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
        setLoading(false);
      }
    };

    initializeDashboard();
  }, []);

  const handleTimeRangeChange = useCallback((newTimeRange: TimeRange) => {
    setTimeRange(newTimeRange);
  }, []);

  const handleFilterChange = useCallback((filters: { channels?: string[]; departments?: string[] }) => {
    if (filters.channels) setSelectedChannels(filters.channels);
    if (filters.departments) setSelectedDepartments(filters.departments);
  }, []);

  const renderWidget = useCallback((widget: WidgetLayout) => {
    const { id, type, config } = widget;

    switch (type) {
      case 'kpi':
        return (
          <KPICard
            key={id}
            title={config.title}
            value={liveMetrics?.[config.metric as keyof LiveMetrics] || 0}
            trend={config.trend}
            changePercent={config.changePercent}
            format={config.format}
          />
        );
      case 'line-chart':
        return (
          <LineChart
            key={id}
            title={config.title}
            metric={config.metric}
            timeRange={timeRange}
            showLegend={config.showLegend}
          />
        );
      case 'bar-chart':
        return (
          <BarChart
            key={id}
            title={config.title}
            metric={config.metric}
            dimension={config.dimension}
            showLegend={config.showLegend}
          />
        );
      case 'pie-chart':
        return (
          <PieChart
            key={id}
            title={config.title}
            metric={config.metric}
            dimension={config.dimension}
            showLegend={config.showLegend}
          />
        );
               case 'gauge':
           return (
             <GaugeChart
               key={id}
               title={config.title}
               value={typeof liveMetrics?.[config.metric as keyof LiveMetrics] === 'number' 
                 ? liveMetrics[config.metric as keyof LiveMetrics] as number 
                 : 0}
               min={config.min}
               max={config.max}
               thresholds={config.thresholds}
             />
           );
      case 'table':
        return (
          <TableWidget
            key={id}
            title={config.title}
            columns={config.columns}
            sortBy={config.sortBy}
            sortOrder={config.sortOrder}
          />
        );
      default:
        return <div key={id}>Unknown widget type: {type}</div>;
    }
  }, [liveMetrics, timeRange]);

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center min-h-screen', className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('flex items-center justify-center min-h-screen', className)}>
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('p-6 space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Real-time insights into your customer service performance
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="default" className="flex items-center space-x-2 bg-green-100 text-green-800">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live</span>
          </Badge>
          <Button variant="outline">
            Export Report
          </Button>
          <Button variant="outline">
            Customize Dashboard
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center space-x-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time Range
            </label>
            <select 
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={timeRange.label}
              onChange={(e) => {
                const value = e.target.value;
                let newTimeRange: TimeRange;
                
                switch (value) {
                  case '1h':
                    newTimeRange = {
                      start: new Date(Date.now() - 60 * 60 * 1000),
                      end: new Date(),
                      label: 'Last Hour'
                    };
                    break;
                  case '24h':
                    newTimeRange = {
                      start: new Date(Date.now() - 24 * 60 * 60 * 1000),
                      end: new Date(),
                      label: 'Last 24 Hours'
                    };
                    break;
                  case '7d':
                    newTimeRange = {
                      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                      end: new Date(),
                      label: 'Last 7 Days'
                    };
                    break;
                  case '30d':
                    newTimeRange = {
                      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                      end: new Date(),
                      label: 'Last 30 Days'
                    };
                    break;
                  default:
                    newTimeRange = timeRange;
                }
                
                handleTimeRangeChange(newTimeRange);
              }}
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Channels
            </label>
            <select 
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={selectedChannels[0]}
              onChange={(e) => handleFilterChange({ channels: [e.target.value] })}
            >
              <option value="all">All Channels</option>
              <option value="website">Website</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Departments
            </label>
            <select 
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={selectedDepartments[0]}
              onChange={(e) => handleFilterChange({ departments: [e.target.value] })}
            >
              <option value="all">All Departments</option>
              <option value="support">Support</option>
              <option value="sales">Sales</option>
              <option value="billing">Billing</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-12 gap-4 auto-rows-min">
        {dashboardConfig.layout.map((widget) => (
          <div
            key={widget.id}
            className="col-span-12 md:col-span-6 lg:col-span-4 xl:col-span-3"
            style={{
              gridColumn: `span ${widget.position.w}`,
              gridRow: `span ${widget.position.h}`
            }}
          >
            {renderWidget(widget)}
          </div>
        ))}
      </div>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {liveMetrics?.lastUpdated.toLocaleTimeString()}
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 