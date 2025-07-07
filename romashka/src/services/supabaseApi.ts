import { supabase, isDemoMode } from './supabaseClient';
import { mockApi } from './mockApi';
import type {
  Profile,
  Project,
  KnowledgeBase,
  Conversation,
  Message,
  AnalyticsEvent,
} from '../types/supabase';

// --- Profiles ---
export const getProfile = async (id: string) => {
  if (isDemoMode) {
    return mockApi.getProfile(id);
  }
  return supabase?.from('profiles').select('*').eq('id', id).single() || { data: null, error: null };
};

export const updateProfile = async (id: string, data: Partial<Profile>) => {
  if (isDemoMode) {
    return { data: null, error: null };
  }
  return supabase?.from('profiles').update(data).eq('id', id) || { data: null, error: null };
};

// --- Projects ---
export const getProjects = async (owner_id: string) => {
  if (isDemoMode) {
    return { data: [], error: null };
  }
  return supabase?.from('projects').select('*').eq('owner_id', owner_id) || { data: null, error: null };
};

export const createProject = async (data: Partial<Project>) => {
  if (isDemoMode) {
    return { data: null, error: null };
  }
  return supabase?.from('projects').insert([data]) || { data: null, error: null };
};

export const updateProject = async (id: string, data: Partial<Project>) => {
  if (isDemoMode) {
    return { data: null, error: null };
  }
  return supabase?.from('projects').update(data).eq('id', id) || { data: null, error: null };
};

export const deleteProject = async (id: string) => {
  if (isDemoMode) {
    return { data: null, error: null };
  }
  return supabase?.from('projects').delete().eq('id', id) || { data: null, error: null };
};

// --- Knowledge Base ---
export const getKnowledgeBase = async (project_id: string) => {
  if (isDemoMode) {
    return mockApi.getKnowledgeBase();
  }
  return supabase?.from('knowledge_base').select('*').eq('project_id', project_id) || { data: null, error: null };
};

export const createKnowledgeBase = async (data: Partial<KnowledgeBase>) => {
  if (isDemoMode) {
    return { data: null, error: null };
  }
  return supabase?.from('knowledge_base').insert([data]) || { data: null, error: null };
};

export const updateKnowledgeBase = async (id: string, data: Partial<KnowledgeBase>) => {
  if (isDemoMode) {
    return { data: null, error: null };
  }
  return supabase?.from('knowledge_base').update(data).eq('id', id) || { data: null, error: null };
};

export const deleteKnowledgeBase = async (id: string) => {
  if (isDemoMode) {
    return { data: null, error: null };
  }
  return supabase?.from('knowledge_base').delete().eq('id', id) || { data: null, error: null };
};

// --- Conversations ---
export const getConversations = async (project_id: string) => {
  if (isDemoMode) {
    return mockApi.getConversations();
  }
  return supabase?.from('conversations').select('*').eq('project_id', project_id) || { data: null, error: null };
};

export const createConversation = async (data: Partial<Conversation>) => {
  if (isDemoMode) {
    return mockApi.createConversation(data);
  }
  return supabase?.from('conversations').insert([data]) || { data: null, error: null };
};

export const updateConversation = async (id: string, data: Partial<Conversation>) => {
  if (isDemoMode) {
    return { data: null, error: null };
  }
  return supabase?.from('conversations').update(data).eq('id', id) || { data: null, error: null };
};

export const deleteConversation = async (id: string) => {
  if (isDemoMode) {
    return { data: null, error: null };
  }
  return supabase?.from('conversations').delete().eq('id', id) || { data: null, error: null };
};

// --- Messages ---
export const getMessages = async (conversation_id: string) => {
  if (isDemoMode) {
    return mockApi.getMessages(conversation_id);
  }
  return supabase?.from('messages').select('*').eq('conversation_id', conversation_id) || { data: null, error: null };
};

export const createMessage = async (data: Partial<Message>) => {
  if (isDemoMode) {
    return mockApi.createMessage(data);
  }
  return supabase?.from('messages').insert([data]) || { data: null, error: null };
};

export const updateMessage = async (id: string, data: Partial<Message>) => {
  if (isDemoMode) {
    return { data: null, error: null };
  }
  return supabase?.from('messages').update(data).eq('id', id) || { data: null, error: null };
};

export const deleteMessage = async (id: string) => {
  if (isDemoMode) {
    return { data: null, error: null };
  }
  return supabase?.from('messages').delete().eq('id', id) || { data: null, error: null };
};

// --- Analytics Events ---
export const getAnalyticsEvents = async (project_id: string) => {
  if (isDemoMode) {
    return { data: [], error: null };
  }
  return supabase?.from('analytics_events').select('*').eq('project_id', project_id) || { data: null, error: null };
};

export const createAnalyticsEvent = async (data: Partial<AnalyticsEvent>) => {
  if (isDemoMode) {
    return { data: null, error: null };
  }
  return supabase?.from('analytics_events').insert([data]) || { data: null, error: null };
};

// --- Real-time subscriptions ---
export const subscribeToMessages = (conversation_id: string, callback: (payload: unknown) => void) => {
  if (isDemoMode || !supabase) {
    return { data: null, error: null };
  }
  return supabase.channel('messages')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation_id}` }, callback)
    .subscribe();
};

export const subscribeToConversations = (project_id: string, callback: (payload: unknown) => void) => {
  if (isDemoMode || !supabase) {
    return { data: null, error: null };
  }
  return supabase.channel('conversations')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `project_id=eq.${project_id}` }, callback)
    .subscribe();
}; 