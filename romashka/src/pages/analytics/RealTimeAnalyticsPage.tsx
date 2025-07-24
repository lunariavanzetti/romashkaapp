import React from 'react';
import { Activity, Zap, Users, TrendingUp } from 'lucide-react';
import RealTimeIntegrationMonitor from '../../components/analytics/RealTimeIntegrationMonitor';

export default function RealTimeAnalyticsPage() {
  return (
    <div className="min-h-screen bg-bg-secondary dark:bg-bg-darker">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-primary-deep-blue dark:text-white mb-2">
            Real-Time Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Live monitoring of integration performance, AI queries, and system health
          </p>
        </div>

        {/* Real-time Integration Monitor */}
        <RealTimeIntegrationMonitor />
      </div>
    </div>
  );
}