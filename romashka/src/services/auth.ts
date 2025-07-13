import { supabase, isDemoMode } from './supabaseClient';
import { mockApi } from './mockApi';
import type { User } from '../types/auth';

// Get the current origin for OAuth redirects
const getOrigin = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Fallback for server-side rendering
  return 'http://localhost:5173';
};

// Production redirect URLs
const getRedirectUrl = (path: string = '/dashboard') => {
  const origin = getOrigin();
  return `${origin}${path}`;
};

export async function signIn(email: string, password: string) {
  if (isDemoMode) {
    return { user: { id: 'demo-user', email } as User, error: null };
  }
  
  if (!supabase) {
    return { user: null, error: 'Authentication service not configured. Please check your environment variables.' };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email: email.toLowerCase().trim(), 
      password 
    });
    
    if (error) {
      console.error('Sign in error:', error);
      return { user: null, error: error.message };
    }

    return { user: data?.user as User, error: null };
  } catch (error) {
    console.error('Sign in exception:', error);
    return { 
      user: null, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred during sign in' 
    };
  }
}

export async function signUp(email: string, password: string, meta?: Record<string, any>) {
  if (isDemoMode) {
    return { user: { id: 'demo-user', email } as User, error: null };
  }
  
  if (!supabase) {
    return { user: null, error: 'Authentication service not configured. Please check your environment variables.' };
  }

  try {
    const { data, error } = await supabase.auth.signUp({ 
      email: email.toLowerCase().trim(), 
      password,
      options: { 
        data: meta,
        emailRedirectTo: getRedirectUrl('/onboarding')
      }
    });
    
    if (error) {
      console.error('Sign up error:', error);
      return { user: null, error: error.message };
    }

    return { user: data?.user as User, error: null };
  } catch (error) {
    console.error('Sign up exception:', error);
    return { 
      user: null, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred during sign up' 
    };
  }
}

export async function signOut() {
  if (isDemoMode || !supabase) {
    return { error: null };
  }

  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Sign out error:', error);
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error('Sign out exception:', error);
    return { 
      error: error instanceof Error ? error.message : 'An unexpected error occurred during sign out' 
    };
  }
}

export async function getSession() {
  if (isDemoMode) {
    return { user: { id: 'demo-user', email: 'demo@example.com' } as User, error: null };
  }
  
  if (!supabase) {
    return { user: null, error: 'Authentication service not configured' };
  }

  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Get session error:', error);
      return { user: null, error: error.message };
    }

    return { user: data?.session?.user as User, error: null };
  } catch (error) {
    console.error('Get session exception:', error);
    return { 
      user: null, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred getting session' 
    };
  }
}

// Listen for auth state changes
export function onAuthStateChange(callback: (user: User | null) => void) {
  if (isDemoMode || !supabase) {
    // In demo mode, immediately call with demo user
    callback({ id: 'demo-user', email: 'demo@example.com' } as User);
    return { data: { subscription: { unsubscribe: () => {} } } };
  }

  try {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session?.user?.id);
      callback(session?.user as User || null);
    });

    return data;
  } catch (error) {
    console.error('Auth state change error:', error);
    callback(null);
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
}

export async function sendVerificationEmail(email: string) {
  if (isDemoMode || !supabase) {
    return { data: null, error: null };
  }

  try {
    const { data, error } = await supabase.auth.resend({ 
      type: 'signup', 
      email: email.toLowerCase().trim(),
      options: {
        emailRedirectTo: getRedirectUrl('/onboarding')
      }
    });
    
    if (error) {
      console.error('Resend verification error:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Resend verification exception:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred sending verification email' 
    };
  }
}

export async function signInWithGoogle() {
  if (isDemoMode) {
    return { error: null };
  }
  
  if (!supabase) {
    return { error: 'Authentication service not configured' };
  }
  
  console.log('Starting Google OAuth...');
  
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getRedirectUrl('/onboarding'),
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        }
      }
    });
    
    console.log('Google OAuth response:', { data, error });
    
    if (error) {
      console.error('Google OAuth error:', error);
      return { error: error.message };
    }
    
    return { error: null };
  } catch (error) {
    console.error('Google OAuth exception:', error);
    return { 
      error: error instanceof Error ? error.message : 'An unexpected error occurred with Google sign in' 
    };
  }
}

export async function signInWithGitHub() {
  if (isDemoMode) {
    return { error: null };
  }
  
  if (!supabase) {
    return { error: 'Authentication service not configured' };
  }
  
  console.log('Starting GitHub OAuth...');
  
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: getRedirectUrl('/onboarding')
      }
    });
    
    console.log('GitHub OAuth response:', { data, error });
    
    if (error) {
      console.error('GitHub OAuth error:', error);
      return { error: error.message };
    }
    
    return { error: null };
  } catch (error) {
    console.error('GitHub OAuth exception:', error);
    return { 
      error: error instanceof Error ? error.message : 'An unexpected error occurred with GitHub sign in' 
    };
  }
}

export async function resetPassword(email: string) {
  if (isDemoMode || !supabase) {
    return { error: null };
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.toLowerCase().trim(),
      {
        redirectTo: getRedirectUrl('/reset-password')
      }
    );
    
    if (error) {
      console.error('Reset password error:', error);
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error('Reset password exception:', error);
    return { 
      error: error instanceof Error ? error.message : 'An unexpected error occurred sending reset email' 
    };
  }
}

export async function updatePassword(password: string) {
  if (isDemoMode || !supabase) {
    return { error: null };
  }

  try {
    const { error } = await supabase.auth.updateUser({
      password: password
    });
    
    if (error) {
      console.error('Update password error:', error);
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error('Update password exception:', error);
    return { 
      error: error instanceof Error ? error.message : 'An unexpected error occurred updating password' 
    };
  }
}

export async function refreshSession() {
  if (isDemoMode || !supabase) {
    return { session: null, error: null };
  }

  try {
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Refresh session error:', error);
      return { session: null, error: error.message };
    }

    return { session: data?.session, error: null };
  } catch (error) {
    console.error('Refresh session exception:', error);
    return { 
      session: null, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred refreshing session' 
    };
  }
} 