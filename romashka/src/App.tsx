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

// Component to conditionally render Navigation
const AppContent = () => {
  const location = useLocation();
  const isDashboardRoute = location.pathname.startsWith('/dashboard') || location.pathname === '/analytics';
  
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
