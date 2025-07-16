import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Skeleton } from '../components/ui';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../services/supabaseClient';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, checkSession } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [onboardingStatus, setOnboardingStatus] = useState<{ completed: boolean; loading: boolean }>({ completed: false, loading: true });
  
  console.log('🛡️ ProtectedRoute - Current path:', location.pathname, 'User:', !!user, 'Loading:', loading);

  useEffect(() => {
    console.log('ProtectedRoute: Checking session...');
    checkSession();
    // eslint-disable-next-line
  }, []);

  // Check onboarding status when user is available
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (user) {
        try {
          console.log('🔍 Checking onboarding status for user:', user.id);
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .single();

          console.log('📊 Profile query result:', { profile, error });

          if (error) {
            console.error('Error checking onboarding status:', error);
            // If no profile exists, create one and mark as needing onboarding
            if (error.code === 'PGRST116') {
              console.log('📝 No profile found, user needs onboarding');
              setOnboardingStatus({ completed: false, loading: false });
            } else {
              setOnboardingStatus({ completed: false, loading: false });
            }
          } else {
            const completed = profile?.onboarding_completed === true;
            console.log('✅ Onboarding status:', completed);
            setOnboardingStatus({ 
              completed, 
              loading: false 
            });
          }
        } catch (error) {
          console.error('Error checking onboarding status:', error);
          setOnboardingStatus({ completed: false, loading: false });
        }
      } else {
        setOnboardingStatus({ completed: false, loading: false });
      }
    };

    checkOnboardingStatus();
  }, [user]);

  useEffect(() => {
    console.log('ProtectedRoute: Auth state changed', { 
      loading, 
      user: !!user, 
      onboardingStatus, 
      currentPath: location.pathname 
    });
    
    if (!loading && !user) {
      console.log('ProtectedRoute: No user found, redirecting to signin');
      // Store current path before redirecting
      if (location.pathname !== '/signin' && location.pathname !== '/signup') {
        console.log('🔄 ProtectedRoute storing path:', location.pathname);
        sessionStorage.setItem('protectedRoutePath', location.pathname);
      }
      navigate('/signin', { replace: true });
    } else if (!loading && user && !onboardingStatus.loading) {
      console.log('🎯 Decision point:', {
        userExists: !!user,
        onboardingCompleted: onboardingStatus.completed,
        currentPath: location.pathname,
        isOnboardingPage: location.pathname === '/onboarding'
      });
      
      // User is authenticated, check onboarding status
      if (!onboardingStatus.completed && location.pathname !== '/onboarding') {
        console.log('🎯 ProtectedRoute: User needs onboarding, redirecting...');
        // Store the intended path
        sessionStorage.setItem('protectedRoutePath', location.pathname);
        navigate('/onboarding', { replace: true });
        return;
      }
      
      // User is authenticated and onboarded, check if we need to redirect back
      const storedPath = sessionStorage.getItem('protectedRoutePath');
      if (storedPath && storedPath !== location.pathname && location.pathname === '/dashboard') {
        console.log('🎯 ProtectedRoute redirecting back to:', storedPath);
        sessionStorage.removeItem('protectedRoutePath');
        navigate(storedPath, { replace: true });
      }
    }
  }, [loading, user, onboardingStatus, navigate, location.pathname]);

  if (loading || onboardingStatus.loading) return (
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