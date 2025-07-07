export type ChannelType = 'website' | 'whatsapp' | 'instagram' | 'facebook' | 'twitter' | 'linkedin';

export interface Channel {
  id: string;
  type: ChannelType;
  name: string;
  unread: number;
  connected: boolean;
}

export interface ConversationThread {
  id: string;
  channelId: string;
  customerId: string;
  preview: string;
  unread: boolean;
  lastMessageAt: string;
}

export interface Message {
  id: string;
  threadId: string;
  sender: 'customer' | 'agent' | 'ai';
  content: string;
  mediaUrl?: string;
  timestamp: string;
  channel: ChannelType;
}

export interface CustomerInfo {
  id: string;
  name: string;
  avatarUrl?: string;
  email?: string;
  phone?: string;
  socialHandles?: Record<string, string>;
  history: ConversationThread[];
} 