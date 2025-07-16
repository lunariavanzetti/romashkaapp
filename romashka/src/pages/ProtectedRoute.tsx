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
          
          // Add cache-busting to ensure fresh data
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

    // Only check onboarding status if user exists and we're not already loading
    if (user && !loading) {
      checkOnboardingStatus();
    }
  }, [user, loading]);

  // Handle navigation logic
  useEffect(() => {
    console.log('ProtectedRoute: Navigation logic check', { 
      loading, 
      user: !!user, 
      onboardingStatus, 
      currentPath: location.pathname 
    });
    
    // Don't do anything if still loading auth or onboarding status
    if (loading || onboardingStatus.loading) {
      return;
    }
    
    // No user - redirect to signin
    if (!user) {
      console.log('ProtectedRoute: No user found, redirecting to signin');
      // Store current path before redirecting
      if (location.pathname !== '/signin' && location.pathname !== '/signup') {
        console.log('🔄 ProtectedRoute storing path:', location.pathname);
        sessionStorage.setItem('protectedRoutePath', location.pathname);
      }
      navigate('/signin', { replace: true });
      return;
    }
    
    // User exists but hasn't completed onboarding
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
  }, [loading, user, onboardingStatus, navigate, location.pathname]);

  // Show loading state
  if (loading || onboardingStatus.loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-tech bg-circuit bg-cover bg-center">
      <div className="glass-card bg-glassDark/80 rounded-2xl shadow-glass p-8 flex flex-col items-center border border-white/20 backdrop-blur-glass">
        <Skeleton width={80} height={80} className="rounded-full animate-pulse" />
        <div className="mt-4 text-white font-heading text-lg animate-pulse">Checking authentication…</div>
      </div>
    </div>
  );
  
  // Don't render anything if no user (will be redirected)
  if (!user) return null;
  
  // Render children if user exists and onboarding is complete
  return <>{children}</>;
}