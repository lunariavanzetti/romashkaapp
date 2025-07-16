import { create } from 'zustand';
import type { User } from '../types/auth';
import { getSession, signIn, signUp, signOut, onAuthStateChange } from '../services/auth';
import { supabase } from '../services/supabaseClient';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  checkSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, meta?: Record<string, any>) => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  error: null,
  
  initializeAuth: async () => {
    console.log('Initializing auth...');
    // Check for OAuth redirect
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      console.log('Found existing session:', session.user);
      set({ user: session.user as User, loading: false });
    }
    
    // Listen for auth changes
    onAuthStateChange((user) => {
      console.log('Auth state changed:', user);
      set({ user, loading: false });
    });
  },
  
  checkSession: async () => {
    set({ loading: true, error: null });
    const { user, error } = await getSession();
    set({ user, loading: false, error: error || null });
  },
  
  login: async (email, password) => {
    set({ loading: true, error: null });
    const { user, error } = await signIn(email, password);
    set({ user, loading: false, error: error || null });
  },
  
  signup: async (email, password, meta) => {
    set({ loading: true, error: null });
    const { user, error } = await signUp(email, password, meta);
    set({ user, loading: false, error: error || null });
    
    // If signup successful, redirect to onboarding
    if (user && !error) {
      window.location.href = '/onboarding';
    }
  },
  
  logout: async () => {
    console.log('Starting logout process...');
    set({ loading: true, error: null });
    try {
      const result = await signOut();
      console.log('Sign out result:', result);
      if (result.error) {
        console.error('Sign out error:', result.error);
        set({ loading: false, error: result.error });
        return;
      }
      set({ user: null, loading: false, error: null });
      console.log('Redirecting to sign-in page...');
      // Redirect to sign-in page after logout
      window.location.href = '/signin';
    } catch (error) {
      console.error('Logout exception:', error);
      set({ loading: false, error: error instanceof Error ? error.message : 'Logout failed' });
    }
  },
})); 