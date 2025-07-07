export interface User {
  id: string;
  email: string;
  email_confirmed_at?: string;
  created_at?: string;
  [key: string]: any;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
} 