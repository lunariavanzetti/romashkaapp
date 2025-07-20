/*
 * Agent Setup Service
 * Handles saving and loading agent setup configuration to/from the database
 */

import { supabase } from './supabaseClient';

export interface AgentSetupData {
  currentStep: number;
  businessType: string;
  agentName: string;
  agentTone: string;
  websiteUrl: string;
  knowledgeContent: string;
  setupCompleted: boolean;
  completedSteps: number[];
}

export interface AgentSetupProgress {
  id: string;
  profile_id: string;
  current_step: number;
  business_type: string;
  agent_name: string;
  agent_tone: string;
  website_url: string;
  knowledge_content: string;
  setup_completed: boolean;
  completed_steps: number[];
  created_at: string;
  updated_at: string;
}

class AgentSetupService {
  
  /**
   * Save or update agent setup progress
   */
  async saveProgress(data: Partial<AgentSetupData>): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        return { success: false, error: 'User not authenticated' };
      }

      const profileId = userData.user.id;

      // Check if a record already exists
      const { data: existingRecord, error: fetchError } = await supabase
        .from('agent_setup_progress')
        .select('*')
        .eq('profile_id', profileId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching existing setup progress:', fetchError);
        return { success: false, error: fetchError.message };
      }

      const setupData = {
        profile_id: profileId,
        current_step: data.currentStep,
        business_type: data.businessType,
        agent_name: data.agentName,
        agent_tone: data.agentTone,
        website_url: data.websiteUrl,
        knowledge_content: data.knowledgeContent,
        setup_completed: data.setupCompleted || false,
        completed_steps: data.completedSteps || []
      };

      let result;
      if (existingRecord) {
        // Update existing record
        result = await supabase
          .from('agent_setup_progress')
          .update(setupData)
          .eq('profile_id', profileId);
      } else {
        // Insert new record
        result = await supabase
          .from('agent_setup_progress')
          .insert(setupData);
      }

      if (result.error) {
        console.error('Error saving setup progress:', result.error);
        return { success: false, error: result.error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error saving setup progress:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Load agent setup progress
   */
  async loadProgress(): Promise<{ success: boolean; data?: AgentSetupData; error?: string }> {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        return { success: false, error: 'User not authenticated' };
      }

      const profileId = userData.user.id;

      const { data: setupProgress, error } = await supabase
        .from('agent_setup_progress')
        .select('*')
        .eq('profile_id', profileId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          // Return default values for new setup
          return {
            success: true,
            data: {
              currentStep: 1,
              businessType: '',
              agentName: '',
              agentTone: '',
              websiteUrl: '',
              knowledgeContent: '',
              setupCompleted: false,
              completedSteps: []
            }
          };
        }
        console.error('Error loading setup progress:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: {
          currentStep: setupProgress.current_step || 1,
          businessType: setupProgress.business_type || '',
          agentName: setupProgress.agent_name || '',
          agentTone: setupProgress.agent_tone || '',
          websiteUrl: setupProgress.website_url || '',
          knowledgeContent: setupProgress.knowledge_content || '',
          setupCompleted: setupProgress.setup_completed || false,
          completedSteps: setupProgress.completed_steps || []
        }
      };
    } catch (error) {
      console.error('Unexpected error loading setup progress:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Mark setup as completed
   */
  async markSetupCompleted(): Promise<{ success: boolean; error?: string }> {
    return this.saveProgress({ 
      setupCompleted: true,
      completedSteps: [1, 2, 3, 4, 5, 6, 7, 8]
    });
  }

  /**
   * Update current step
   */
  async updateCurrentStep(step: number): Promise<{ success: boolean; error?: string }> {
    return this.saveProgress({ currentStep: step });
  }

  /**
   * Add a completed step
   */
  async addCompletedStep(step: number): Promise<{ success: boolean; error?: string }> {
    const { success, data } = await this.loadProgress();
    if (!success || !data) {
      return { success: false, error: 'Failed to load current progress' };
    }

    const completedSteps = [...data.completedSteps];
    if (!completedSteps.includes(step)) {
      completedSteps.push(step);
    }

    return this.saveProgress({ completedSteps });
  }

  /**
   * Reset setup progress
   */
  async resetProgress(): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { error } = await supabase
        .from('agent_setup_progress')
        .delete()
        .eq('profile_id', userData.user.id);

      if (error) {
        console.error('Error resetting setup progress:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error resetting setup progress:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }
}

export const agentSetupService = new AgentSetupService();