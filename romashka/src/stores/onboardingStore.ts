import { create } from 'zustand';
import { supabase } from '../services/supabaseClient';

export interface OnboardingAnswer {
  fullName?: string;
  department?: string;
  currentTools?: string[];
  businessModel?: string;
  industry?: string;
  conversationsVolume?: string;
  websiteVisitors?: string;
  websitePlatform?: string;
  supportAgents?: string;
  mainGoal?: string;
  interactionChannels?: string[];
}

interface OnboardingState {
  currentStep: number;
  answers: OnboardingAnswer;
  isLoading: boolean;
  error: string | null;
  showConfetti: boolean;
  showSuccess: boolean;
  updateAnswer: (field: keyof OnboardingAnswer, value: any) => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  submitOnboarding: () => Promise<void>;
  skipOnboarding: () => Promise<void>;
  resetOnboarding: () => void;
  setShowConfetti: (show: boolean) => void;
  setShowSuccess: (show: boolean) => void;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  currentStep: 0,
  answers: {},
  isLoading: false,
  error: null,
  showConfetti: false,
  showSuccess: false,

  updateAnswer: (field, value) => {
    set((state) => ({
      answers: {
        ...state.answers,
        [field]: value,
      },
    }));
  },

  nextStep: () => {
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, 10), // 11 steps total (0-10)
    }));
  },

  previousStep: () => {
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 0),
    }));
  },

  goToStep: (step) => {
    set({ currentStep: step });
  },

  submitOnboarding: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Auth error:', userError);
        throw new Error('Authentication error: ' + userError.message);
      }
      
      if (!user) {
        throw new Error('No authenticated user found');
      }

      console.log('Submitting onboarding data for user:', user.id);
      console.log('Onboarding answers:', get().answers);

      // First, check if the profile exists
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Profile check error:', profileError);
        throw new Error('Failed to check user profile: ' + profileError.message);
      }

      // If profile doesn't exist, create it first
      if (!existingProfile) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            full_name: get().answers.fullName,
            company_name: get().answers.businessModel,
            website_url: get().answers.websitePlatform,
            platform: get().answers.websitePlatform,
            monthly_conversations: get().answers.conversationsVolume,
            website_traffic: get().answers.websiteVisitors,
            team_size: get().answers.supportAgents,
            department: get().answers.department,
            current_tools: get().answers.currentTools,
            industry: get().answers.industry,
            main_goal: get().answers.mainGoal,
            business_model: get().answers.businessModel,
            onboarding_completed: true,
            onboarding_data: get().answers,
          });

        if (insertError) {
          console.error('Profile insert error:', insertError);
          throw new Error('Failed to create user profile: ' + insertError.message);
        }
      } else {
        // Update existing profile
        const { data, error } = await supabase
          .from('profiles')
          .update({
            full_name: get().answers.fullName,
            company_name: get().answers.businessModel,
            website_url: get().answers.websitePlatform,
            platform: get().answers.websitePlatform,
            monthly_conversations: get().answers.conversationsVolume,
            website_traffic: get().answers.websiteVisitors,
            team_size: get().answers.supportAgents,
            department: get().answers.department,
            current_tools: get().answers.currentTools,
            industry: get().answers.industry,
            main_goal: get().answers.mainGoal,
            business_model: get().answers.businessModel,
            onboarding_completed: true,
            onboarding_data: get().answers,
          })
          .eq('id', user.id)
          .select();

        console.log('Update result:', { data, error });

        if (error) {
          console.error('Database error:', error);
          throw new Error('Failed to update profile: ' + error.message);
        }
      }

      set({ isLoading: false, showConfetti: true, showSuccess: true });
      
      // Show confetti and success message for 3 seconds, then redirect
      setTimeout(() => {
        // Use window.location.href to force a complete reload and refresh auth state
        window.location.href = '/dashboard';
      }, 3000);
      
    } catch (error) {
      console.error('Onboarding submission error:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to save onboarding data' 
      });
    }
  },

  resetOnboarding: () => {
    set({
      currentStep: 0,
      answers: {},
      isLoading: false,
      error: null,
      showConfetti: false,
      showSuccess: false,
    });
  },

  setShowConfetti: (show) => {
    set({ showConfetti: show });
  },

  setShowSuccess: (show) => {
    set({ showSuccess: show });
  },

  skipOnboarding: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Auth error:', userError);
        throw new Error('Authentication error: ' + userError.message);
      }
      
      if (!user) {
        throw new Error('No authenticated user found');
      }

      console.log('Skipping onboarding for user:', user.id);

      // Mark onboarding as completed in the database without saving answers
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw new Error('Failed to update profile: ' + profileError.message);
      }

      set({ isLoading: false });
      
      // Redirect to dashboard with a small delay to ensure database is updated
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 100);
      
    } catch (error) {
      console.error('Onboarding skip error:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to skip onboarding' 
      });
    }
  },
})); 