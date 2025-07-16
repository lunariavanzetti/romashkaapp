import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Skeleton } from '../components/ui';
import { useAuthStore } from '../stores/authStore';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, checkSession } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  console.log('🛡️ ProtectedRoute - Current path:', location.pathname, 'User:', !!user, 'Loading:', loading);

  useEffect(() => {
    console.log('ProtectedRoute: Checking session...');
    checkSession();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    console.log('ProtectedRoute: Auth state changed', { loading, user: !!user });
    if (!loading && !user) {
      console.log('ProtectedRoute: No user found, redirecting to signin');
      navigate('/signin', { replace: true });
    }
  }, [loading, user, navigate]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-tech bg-circuit bg-cover bg-center">
      <div className="glass-card bg-glassDark/80 rounded-2xl shadow-glass p-8 flex flex-col items-center border border-white/20 backdrop-blur-glass">
        <Skeleton width={80} height={80} className="rounded-full animate-pulse" />
        <div className="mt-4 text-white font-heading text-lg animate-pulse">Checking authentication…</div>
      </div>
    </div>
  );
  if (!user) return null;
  return <>{children}</>;
} 