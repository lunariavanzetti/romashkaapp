import { supabase, isDemoMode } from './supabaseClient';
import { mockApi } from './mockApi';
import type { User } from '../types/auth';

export async function signIn(email: string, password: string) {
  if (isDemoMode) {
    return { user: { id: 'demo-user', email } as User, error: null };
  }
  if (!supabase) {
    return { user: null, error: 'Supabase not configured' };
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { user: data?.user as User, error: error?.message };
}

export async function signUp(email: string, password: string, meta?: Record<string, any>) {
  if (isDemoMode) {
    return { user: { id: 'demo-user', email } as User, error: null };
  }
  if (!supabase) {
    return { user: null, error: 'Supabase not configured' };
  }
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: meta } });
  return { user: data?.user as User, error: error?.message };
}

export async function signOut() {
  if (isDemoMode || !supabase) {
    return;
  }
  await supabase.auth.signOut();
}

export async function getSession() {
  if (isDemoMode) {
    return mockApi.getCurrentUser();
  }
  if (!supabase) {
    return { user: null, error: 'Supabase not configured' };
  }
  const { data, error } = await supabase.auth.getSession();
  console.log('Current session:', data?.session);
  return { user: data?.session?.user as User, error: error?.message };
}

// Listen for auth state changes
export function onAuthStateChange(callback: (user: User | null) => void) {
  if (isDemoMode || !supabase) {
    // In demo mode, immediately call with demo user
    callback({ id: 'demo-user', email: 'demo@example.com' } as User);
    return { data: { subscription: null } };
  }
  return supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state change:', event, session?.user);
    callback(session?.user as User || null);
  });
}

export async function sendVerificationEmail(email: string) {
  if (isDemoMode || !supabase) {
    return { data: null, error: null };
  }
  // Supabase sends verification on sign up, but you can resend:
  return supabase.auth.resend({ type: 'signup', email });
}

export async function signInWithGoogle() {
  if (isDemoMode) {
    return { error: null };
  }
  if (!supabase) {
    return { error: 'Supabase not configured' };
  }
  
  console.log('Starting Google OAuth...');
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/onboarding`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });
    
    console.log('Google OAuth response:', { data, error });
    
    if (error) {
      console.error('Google OAuth error:', error);
      return { error: error.message };
    }
    
    return { error: null };
  } catch (err) {
    console.error('Google OAuth exception:', err);
    return { error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function signInWithGitHub() {
  if (isDemoMode) {
    return { error: null };
  }
  if (!supabase) {
    return { error: 'Supabase not configured' };
  }
  
  console.log('Starting GitHub OAuth...');
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });
    
    console.log('GitHub OAuth response:', { data, error });
    
    if (error) {
      console.error('GitHub OAuth error:', error);
      return { error: error.message };
    }
    
    return { error: null };
  } catch (err) {
    console.error('GitHub OAuth exception:', err);
    return { error: err instanceof Error ? err.message : 'Unknown error' };
  }
} 