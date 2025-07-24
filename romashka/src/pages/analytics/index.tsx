import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Brain, 
  Activity, 
  FileText, 
  Zap 
} from 'lucide-react';
import { Button } from '../../components/ui';
import OverviewTab from './OverviewTab';
import ConversationsTab from './ConversationsTab';
import AIPerformanceTab from './AIPerformanceTab';

const tabLabels = ['Overview', 'Conversations', 'AI Performance'];

const analyticsRoutes = [
  {
    path: '/analytics',
    label: 'Main Dashboard',
    icon: BarChart3,
    description: 'Overview and key metrics'
  },
  {
    path: '/analytics/integrations',
    label: 'Integration Analytics',
    icon: TrendingUp,
    description: 'AI-integration performance and business impact'
  },
  {
    path: '/analytics/real-time',
    label: 'Real-time Analytics',
    icon: Activity,
    description: 'Live conversation and integration monitoring'
  },
  {
    path: '/analytics/reporting',
    label: 'Reports',
    icon: FileText,
    description: 'Detailed reports and exports'
  },
  {
    path: '/analytics/predictive',
    label: 'Predictive Analytics',
    icon: Zap,
    description: 'AI-powered insights and forecasts'
  }
];

export default function AnalyticsDashboard() {
  const [tab, setTab] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  
  return (
    <div className="min-h-screen bg-bg-secondary dark:bg-bg-darker">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-primary-deep-blue dark:text-white mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Monitor performance, track conversations, and analyze AI effectiveness
          </p>
        </div>
        
        {/* Analytics Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {analyticsRoutes.map((route) => {
            const Icon = route.icon;
            const isActive = location.pathname === route.path;
            return (
              <div
                key={route.path}
                onClick={() => navigate(route.path)}
                className={`glass-card p-4 rounded-xl border cursor-pointer transition-all hover:scale-105 ${
                  isActive 
                    ? 'border-primary-teal bg-primary-teal/10' 
                    : 'border-white/20 bg-white/80 dark:bg-gray-800/80 hover:border-primary-teal/50'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isActive ? 'bg-primary-teal text-white' : 'bg-gray-100 dark:bg-gray-700 text-primary-teal'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${
                      isActive ? 'text-primary-teal' : 'text-gray-900 dark:text-white'
                    }`}>
                      {route.label}
                    </h3>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {route.description}
                </p>
                {isActive && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-primary-teal font-medium">
                    <Activity className="w-3 h-3" />
                    Currently viewing
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Tab Navigation */}
        <div className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl mb-6 border border-white/20 backdrop-blur-glass">
          <div className="flex overflow-x-auto">
            {tabLabels.map((label, index) => (
              <button
                key={label}
                onClick={() => setTab(index)}
                className={`px-6 py-4 font-medium transition-all whitespace-nowrap ${
                  tab === index
                    ? 'text-primary-teal border-b-2 border-primary-teal bg-primary-teal/10'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Tab Content */}
        <div>
          {tab === 0 && <OverviewTab />}
          {tab === 1 && <ConversationsTab />}
          {tab === 2 && <AIPerformanceTab />}
        </div>
      </div>
    </div>
  );
} 