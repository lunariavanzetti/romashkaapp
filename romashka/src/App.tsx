// import React from 'react';
import React, { useEffect } from 'react';
import { aiResponseProcessor } from './services/ai/aiResponseProcessor';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider, Navigation, DashboardLayout } from './components/layout';
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
import TrainingDashboard from './pages/training/TrainingDashboard';
import SecurityDashboard from './pages/security/SecurityDashboard';
import RealTimeAnalytics from './pages/analytics/RealTimeAnalytics';
import ReportingDashboard from './pages/analytics/ReportingDashboard';
import PredictiveAnalyticsTab from './pages/analytics/PredictiveAnalyticsTab';
import Debug from './pages/Debug';
import DebugOnboarding from './pages/DebugOnboarding';

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
        <Route path="/knowledge" element={<ProtectedRoute><DashboardLayout><KnowledgeBasePage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/knowledge/scanner" element={<ProtectedRoute><DashboardLayout><UrlScanner onScanComplete={(result) => {
          console.log('Scan completed:', result);
          // Handle scan completion
        }} /></DashboardLayout></ProtectedRoute>} />
        <Route path="/analytics" element={<div className="pt-24"><AnalyticsDashboard /></div>} />
        <Route path="/pricing" element={<div className="pt-24"><Pricing /></div>} />
        <Route path="/billing" element={<ProtectedRoute><DashboardLayout><Billing /></DashboardLayout></ProtectedRoute>} />
        <Route path="/automation" element={<ProtectedRoute><DashboardLayout><Automation /></DashboardLayout></ProtectedRoute>} />
        <Route path="/integrations" element={<ProtectedRoute><DashboardLayout><IntegrationsPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><DashboardLayout><SettingsPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/channels" element={<ProtectedRoute><DashboardLayout><ChannelsPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/channel" element={<ProtectedRoute><DashboardLayout><ChannelsPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/channels/whatsapp" element={<ProtectedRoute><DashboardLayout><WhatsAppPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/channels/instagram" element={<ProtectedRoute><DashboardLayout><ChannelsPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/channels/email" element={<ProtectedRoute><DashboardLayout><ChannelsPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/channels/widget" element={<ProtectedRoute><DashboardLayout><ChannelsPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/playground" element={<ProtectedRoute><DashboardLayout><PlaygroundPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/templates" element={<ProtectedRoute><DashboardLayout><TemplatesPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/personality" element={<ProtectedRoute><DashboardLayout><PersonalitySettings /></DashboardLayout></ProtectedRoute>} />
        <Route path="/settings/personality" element={<ProtectedRoute><DashboardLayout><PersonalitySettings /></DashboardLayout></ProtectedRoute>} />
        <Route path="/training" element={<ProtectedRoute><DashboardLayout><TrainingDashboard /></DashboardLayout></ProtectedRoute>} />
        <Route path="/ai-training" element={<ProtectedRoute><DashboardLayout><TrainingAnalyticsDashboard /></DashboardLayout></ProtectedRoute>} />
        <Route path="/security" element={<ProtectedRoute><DashboardLayout><SecurityDashboard /></DashboardLayout></ProtectedRoute>} />
        <Route path="/analytics/real-time" element={<ProtectedRoute><DashboardLayout><RealTimeAnalytics /></DashboardLayout></ProtectedRoute>} />
        <Route path="/analytics/reporting" element={<ProtectedRoute><DashboardLayout><ReportingDashboard /></DashboardLayout></ProtectedRoute>} />
        <Route path="/analytics/predictive" element={<div className="pt-24"><ProtectedRoute><PredictiveAnalyticsTab /></ProtectedRoute></div>} />
        <Route path="/debug" element={<div className="pt-24"><Debug /></div>} />
        <Route path="/debug-onboarding" element={<div className="pt-24"><DebugOnboarding /></div>} />
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
    // Clean up any stored onboarding path (bug fix)
    const storedPath = sessionStorage.getItem('intendedPath');
    if (storedPath === '/onboarding') {
      console.log('🧡 Cleaning up stored onboarding path');
      sessionStorage.removeItem('intendedPath');
    }
    
    // Store the current path if it's not dashboard/signin/signup/onboarding
    const currentPath = window.location.pathname;
    if (currentPath !== '/dashboard' && currentPath !== '/signin' && currentPath !== '/signup' && currentPath !== '/' && currentPath !== '/onboarding') {
      console.log('🔄 Storing intended path:', currentPath);
      sessionStorage.setItem('intendedPath', currentPath);
    }
    
    // Initialize auth to handle OAuth redirects
    initializeAuth();
  }, [initializeAuth]);

  // Start AI response processor
  useEffect(() => {
    aiResponseProcessor.start();
    
    // Cleanup on unmount
    return () => {
      aiResponseProcessor.stop();
    };
  }, []);

  // Monitor processor status (optional)
  useEffect(() => {
    const interval = setInterval(() => {
      const status = aiResponseProcessor.getStatus();
      console.log('🤖 AI Processor Status:', status);
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <Router>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </Router>
  );
};

export default App;
