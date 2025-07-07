// --- Supabase Table Types for ROMASHKA ---

export interface Profile {
  id: string; // uuid
  full_name: string | null;
  company_name: string | null;
  website_url: string | null;
  avatar_url: string | null;
  subscription_status: 'free' | 'pro' | 'enterprise' | string;
  created_at: string; // ISO timestamp
}

export interface Project {
  id: string; // uuid
  name: string;
  owner_id: string; // uuid (profiles.id)
  website_url: string | null;
  industry: string | null;
  settings: Record<string, unknown>;
  created_at: string;
}

export interface KnowledgeBase {
  id: string;
  project_id: string;
  title: string;
  content: string | null;
  source_type: 'url' | 'file' | 'manual' | string;
  source_url: string | null;
  status: 'active' | 'archived' | string;
  created_at: string;
}

export interface Conversation {
  id: string;
  project_id: string;
  visitor_id: string | null;
  channel: 'website' | 'whatsapp' | 'messenger' | string;
  status: 'active' | 'closed' | string;
  resolved_by: 'ai' | 'human' | null;
  started_at: string;
  ended_at: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'visitor' | 'ai' | 'agent' | string;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AnalyticsEvent {
  id: string;
  project_id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  created_at: string;
}

// --- Relationships ---
// Profile.id <-> Project.owner_id
// Project.id <-> KnowledgeBase.project_id, Conversation.project_id, AnalyticsEvent.project_id
// Conversation.id <-> Message.conversation_id 