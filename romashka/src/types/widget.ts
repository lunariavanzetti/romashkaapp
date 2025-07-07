export interface WidgetConfig {
  projectId: string;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  welcomeMessage: string;
  avatarUrl?: string;
  language: string;
  showBranding: boolean;
}

export interface WidgetAnalytics {
  totalChats: number;
  avgResponseTime: number;
  userRatings: number[];
  installs: number;
  lastActive: string;
} 