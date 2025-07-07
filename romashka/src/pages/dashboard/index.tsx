import React from 'react';
import { DashboardLayout } from '../../components/layout';
import QuickActions from './QuickActions';
import PerformanceMetrics from './PerformanceMetrics';
import LiveActivity from './LiveActivity';
import RecentConversations from './RecentConversations';

export default function Dashboard() {
  return (
    <DashboardLayout>
      <QuickActions />
      <PerformanceMetrics />
      <LiveActivity />
      <RecentConversations />
    </DashboardLayout>
  );
} 