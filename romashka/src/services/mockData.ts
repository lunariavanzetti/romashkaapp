// Mock data for demo mode when Supabase is not configured
export const mockConversations = [
  {
    id: '1',
    user_name: 'John Doe',
    user_email: 'john@example.com',
    status: 'active',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    last_message: 'Thank you for your help!',
    message_count: 5,
    satisfaction_score: 4.5,
    language: 'en',
    sentiment: 'positive',
    intent: 'customer_support',
    ai_confidence: 0.85
  },
  {
    id: '2',
    user_name: 'Jane Smith',
    user_email: 'jane@example.com',
    status: 'resolved',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    last_message: 'Issue resolved successfully',
    message_count: 8,
    satisfaction_score: 4.8,
    language: 'en',
    sentiment: 'positive',
    intent: 'technical_support',
    ai_confidence: 0.92
  },
  {
    id: '3',
    user_name: 'Bob Wilson',
    user_email: 'bob@example.com',
    status: 'active',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    last_message: 'Can you help me with this?',
    message_count: 3,
    satisfaction_score: null,
    language: 'en',
    sentiment: 'neutral',
    intent: 'general_inquiry',
    ai_confidence: 0.75
  }
];

export const mockMessages = [
  {
    id: '1',
    conversation_id: '1',
    sender_type: 'user',
    content: 'Hello, I need help with my account',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    confidence_score: 0.85,
    processing_time_ms: 1200
  },
  {
    id: '2',
    conversation_id: '1',
    sender_type: 'assistant',
    content: 'Hello! I\'d be happy to help you with your account. What specific issue are you experiencing?',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000 + 30 * 1000).toISOString(),
    confidence_score: 0.92,
    processing_time_ms: 800
  },
  {
    id: '3',
    conversation_id: '1',
    sender_type: 'user',
    content: 'I can\'t log in to my dashboard',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000 + 60 * 1000).toISOString(),
    confidence_score: 0.78,
    processing_time_ms: 1500
  },
  {
    id: '4',
    conversation_id: '1',
    sender_type: 'assistant',
    content: 'I understand you\'re having trouble logging in. Let me help you troubleshoot this. Have you tried resetting your password?',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000 + 90 * 1000).toISOString(),
    confidence_score: 0.88,
    processing_time_ms: 1100
  },
  {
    id: '5',
    conversation_id: '1',
    sender_type: 'user',
    content: 'Thank you for your help!',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000 + 120 * 1000).toISOString(),
    confidence_score: 0.95,
    processing_time_ms: 600
  }
];

export const mockAnalyticsData = {
  overview: {
    totalConversations: 156,
    activeConversations: 23,
    avgResponseTime: 2.4,
    satisfactionScore: 4.6,
    resolutionRate: 0.89
  },
  trends: [
    { date: '2024-01-01', conversations: 12, satisfaction: 4.5 },
    { date: '2024-01-02', conversations: 15, satisfaction: 4.6 },
    { date: '2024-01-03', conversations: 18, satisfaction: 4.7 },
    { date: '2024-01-04', conversations: 14, satisfaction: 4.4 },
    { date: '2024-01-05', conversations: 22, satisfaction: 4.8 },
    { date: '2024-01-06', conversations: 19, satisfaction: 4.6 },
    { date: '2024-01-07', conversations: 25, satisfaction: 4.9 }
  ],
  aiPerformance: {
    confidenceData: [
      { date: '2024-01-01', confidence_score: 0.85 },
      { date: '2024-01-02', confidence_score: 0.87 },
      { date: '2024-01-03', confidence_score: 0.89 },
      { date: '2024-01-04', confidence_score: 0.86 },
      { date: '2024-01-05', confidence_score: 0.91 },
      { date: '2024-01-06', confidence_score: 0.88 },
      { date: '2024-01-07', confidence_score: 0.93 }
    ],
    fallbackData: [
      { date: '2024-01-01', fallback: 3 },
      { date: '2024-01-02', fallback: 2 },
      { date: '2024-01-03', fallback: 1 },
      { date: '2024-01-04', fallback: 4 },
      { date: '2024-01-05', fallback: 1 },
      { date: '2024-01-06', fallback: 2 },
      { date: '2024-01-07', fallback: 0 }
    ]
  }
};

export const mockKnowledgeBase = [
  {
    id: '1',
    title: 'Account Setup Guide',
    content: 'Complete guide for setting up your account...',
    category: 'Getting Started',
    usage_count: 45,
    helpful_count: 42,
    not_helpful_count: 3
  },
  {
    id: '2',
    title: 'Password Reset Instructions',
    content: 'Step-by-step instructions for resetting your password...',
    category: 'Account Management',
    usage_count: 23,
    helpful_count: 21,
    not_helpful_count: 2
  },
  {
    id: '3',
    title: 'API Integration Guide',
    content: 'How to integrate our API into your application...',
    category: 'Technical',
    usage_count: 67,
    helpful_count: 65,
    not_helpful_count: 2
  }
]; 