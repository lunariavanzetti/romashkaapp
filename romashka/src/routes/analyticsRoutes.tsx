import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AnalyticsDashboard from '../pages/analytics/index';
import IntegrationAnalyticsDashboard from '../pages/analytics/IntegrationAnalyticsDashboard';
import RealTimeAnalyticsPage from '../pages/analytics/RealTimeAnalyticsPage';
import ReportingDashboard from '../pages/analytics/ReportingDashboard';
import PredictiveAnalyticsTab from '../pages/analytics/PredictiveAnalyticsTab';

export default function AnalyticsRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AnalyticsDashboard />} />
      <Route path="/integrations" element={<IntegrationAnalyticsDashboard />} />
      <Route path="/real-time" element={<RealTimeAnalyticsPage />} />
      <Route path="/reporting" element={<ReportingDashboard />} />
      <Route path="/predictive" element={<PredictiveAnalyticsTab />} />
    </Routes>
  );
}