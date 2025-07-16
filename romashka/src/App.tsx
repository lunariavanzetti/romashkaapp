// import React from 'react';
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider, Navigation } from './components/layout';
import { useAuthStore } from './stores/authStore';
import Landing from './pages/Landing';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import EmailVerification from './pages/EmailVerification';
import ForgotPassword from './pages/ForgotPassword';
import ProtectedRoute from './pages/ProtectedRoute';
import Dashboard from './pages/dashboard/index';
import QuickActionsPage from './pages/dashboard/QuickActionsPage';
import Conversations from './pages/dashboard/Conversations';
import { ChatWidget } from './components/chat';
import KnowledgeBasePage from './pages/knowledge/index';
import AnalyticsDashboard from './pages/analytics/index';
import Pricing from './pages/Pricing';
import Billing from './pages/Billing';
import Automation from './pages/Automation';
import Onboarding from './pages/Onboarding';
import Privacy from './pages/Privacy';
import { UrlScanner } from './pages/knowledge/UrlScanner';
import IntegrationsPage from './pages/integrations/index';
import SettingsPage from './pages/settings/index';
import ChannelsPage from './pages/channels/ChannelsPage';
import WhatsAppPage from './pages/channels/whatsapp/index';
import PlaygroundPage from './pages/playground/PlaygroundPage';
import TemplatesPage from './pages/templates/index';
import PersonalitySettings from './pages/settings/personality/PersonalitySettings';
import TrainingAnalyticsDashboard from './pages/ai-training/TrainingAnalyticsDashboard';
import SecurityDashboard from './pages/security/SecurityDashboard';
import RealTimeAnalytics from './pages/analytics/RealTimeAnalytics';
import ReportingDashboard from './pages/analytics/ReportingDashboard';
import PredictiveAnalyticsTab from './pages/analytics/PredictiveAnalyticsTab';
import Debug from './pages/Debug';

// Component to conditionally render Navigation
const AppContent = () => {
  const location = useLocation();
  const isDashboardRoute = location.pathname.startsWith('/dashboard') || location.pathname === '/analytics';
  
  // Debug logging (temporarily disabled)
  // console.log('🔍 ROUTE DEBUG:', { pathname: location.pathname, isDashboardRoute });
  
  return (
    <>
      {!isDashboardRoute && <Navigation />}
      <Routes>
        <Route path="/" element={<div className="pt-24"><Landing /></div>} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-email" element={<EmailVerification />} />
        <Route path="/privacy" element={<div className="pt-24"><Privacy /></div>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard/analytics" element={<ProtectedRoute><AnalyticsDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/conversations" element={<ProtectedRoute><Conversations /></ProtectedRoute>} />
        <Route path="/dashboard/actions" element={<ProtectedRoute><QuickActionsPage /></ProtectedRoute>} />
        <Route path="/knowledge" element={<div className="pt-24"><KnowledgeBasePage /></div>} />
        <Route path="/knowledge/scanner" element={<div className="pt-24"><UrlScanner onScanComplete={(result) => {
          console.log('Scan completed:', result);
          // Handle scan completion
        }} /></div>} />
        <Route path="/analytics" element={<div className="pt-24"><AnalyticsDashboard /></div>} />
        <Route path="/pricing" element={<div className="pt-24"><Pricing /></div>} />
        <Route path="/billing" element={<div className="pt-24"><Billing /></div>} />
        <Route path="/automation" element={<div className="pt-24"><ProtectedRoute><Automation /></ProtectedRoute></div>} />
        <Route path="/integrations" element={<div className="pt-24"><ProtectedRoute><IntegrationsPage /></ProtectedRoute></div>} />
        <Route path="/settings" element={<div className="pt-24"><ProtectedRoute><SettingsPage /></ProtectedRoute></div>} />
        <Route path="/channels" element={<div className="pt-24"><ProtectedRoute><ChannelsPage /></ProtectedRoute></div>} />
        <Route path="/channel" element={<div className="pt-24"><ProtectedRoute><ChannelsPage /></ProtectedRoute></div>} />
        <Route path="/channels/whatsapp" element={<div className="pt-24"><ProtectedRoute><WhatsAppPage /></ProtectedRoute></div>} />
        <Route path="/channels/instagram" element={<div className="pt-24"><ProtectedRoute><ChannelsPage /></ProtectedRoute></div>} />
        <Route path="/channels/email" element={<div className="pt-24"><ProtectedRoute><ChannelsPage /></ProtectedRoute></div>} />
        <Route path="/channels/widget" element={<div className="pt-24"><ProtectedRoute><ChannelsPage /></ProtectedRoute></div>} />
        <Route path="/playground" element={<div className="pt-24"><ProtectedRoute><div><h1>🎮 PLAYGROUND PAGE LOADED</h1><PlaygroundPage /></div></ProtectedRoute></div>} />
        <Route path="/templates" element={<div className="pt-24"><ProtectedRoute><TemplatesPage /></ProtectedRoute></div>} />
        <Route path="/personality" element={<div className="pt-24"><ProtectedRoute><div><h1>🎭 PERSONALITY PAGE LOADED</h1><PersonalitySettings /></div></ProtectedRoute></div>} />
        <Route path="/settings/personality" element={<div className="pt-24"><ProtectedRoute><PersonalitySettings /></ProtectedRoute></div>} />
        <Route path="/training" element={<div className="pt-24"><ProtectedRoute><div><h1>🎯 TRAINING PAGE LOADED</h1><p>This is just a simple placeholder component.</p><p>If you see this, the routing works!</p></div></ProtectedRoute></div>} />
        <Route path="/ai-training" element={<div className="pt-24"><ProtectedRoute><TrainingAnalyticsDashboard /></ProtectedRoute></div>} />
        <Route path="/security" element={<div className="pt-24"><ProtectedRoute><SecurityDashboard /></ProtectedRoute></div>} />
        <Route path="/analytics/real-time" element={<div className="pt-24"><ProtectedRoute><RealTimeAnalytics /></ProtectedRoute></div>} />
        <Route path="/analytics/reporting" element={<div className="pt-24"><ProtectedRoute><ReportingDashboard /></ProtectedRoute></div>} />
        <Route path="/analytics/predictive" element={<div className="pt-24"><ProtectedRoute><PredictiveAnalyticsTab /></ProtectedRoute></div>} />
        <Route path="/debug" element={<div className="pt-24"><Debug /></div>} />
        <Route path="/test-training" element={<div className="pt-24"><h1>🧪 TEST TRAINING PAGE - NO PROTECTION</h1></div>} />
        <Route path="/test-personality" element={<div className="pt-24"><h1>🧪 TEST PERSONALITY PAGE - NO PROTECTION</h1></div>} />
        <Route path="/onboarding" element={<div className="pt-24"><Onboarding /></div>} />
        <Route path="*" element={<div className="pt-24"><Landing /></div>} />
      </Routes>
      <ChatWidget />
    </>
  );
};

const App = () => {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    // Initialize auth to handle OAuth redirects
    initializeAuth();
  }, [initializeAuth]);

  return (
    <Router>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </Router>
  );
};

export default App;
