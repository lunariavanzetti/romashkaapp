import { mockConversations, mockMessages, mockAnalyticsData, mockKnowledgeBase } from './mockData';

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return url && key && url !== 'https://your-project.supabase.co' && key !== 'your-anon-key-here';
};

// Mock API responses that match Supabase structure
export const mockApi = {
  // Conversations
  getConversations: async () => {
    if (isSupabaseConfigured()) {
      return { data: null, error: null };
    }
    return { data: mockConversations, error: null };
  },

  createConversation: async (data: any) => {
    if (isSupabaseConfigured()) {
      return { data: null, error: null };
    }
    const newConversation = {
      id: Date.now().toString(),
      ...data,
      created_at: new Date().toISOString()
    };
    return { data: newConversation, error: null };
  },

  // Messages
  getMessages: async (conversationId: string) => {
    if (isSupabaseConfigured()) {
      return { data: null, error: null };
    }
    const messages = mockMessages.filter(msg => msg.conversation_id === conversationId);
    return { data: messages, error: null };
  },

  createMessage: async (data: any) => {
    if (isSupabaseConfigured()) {
      return { data: null, error: null };
    }
    const newMessage = {
      id: Date.now().toString(),
      ...data,
      created_at: new Date().toISOString()
    };
    return { data: newMessage, error: null };
  },

  // Analytics
  getAnalyticsData: async () => {
    if (isSupabaseConfigured()) {
      return { data: null, error: null };
    }
    return { data: mockAnalyticsData, error: null };
  },

  // Knowledge Base
  getKnowledgeBase: async () => {
    if (isSupabaseConfigured()) {
      return { data: null, error: null };
    }
    return { data: mockKnowledgeBase, error: null };
  },

  // Profiles
  getProfile: async (id: string) => {
    if (isSupabaseConfigured()) {
      return { data: null, error: null };
    }
    return {
      data: {
        id,
        full_name: 'Demo User',
        company_name: 'Demo Company',
        website_url: 'https://demo.com',
        avatar_url: null,
        created_at: new Date().toISOString()
      },
      error: null
    };
  },

  // Auth
  getCurrentUser: async () => {
    if (isSupabaseConfigured()) {
      return { data: { user: null }, error: null };
    }
    return {
      data: {
        user: {
          id: 'demo-user-id',
          email: 'demo@example.com',
          created_at: new Date().toISOString()
        }
      },
      error: null
    };
  }
}; 