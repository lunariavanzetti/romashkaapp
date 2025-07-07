import { create } from 'zustand';
import type { Toast, ToastStore } from './Toast';

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  showToast: (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    set((state: ToastStore) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => set((state: ToastStore) => ({ toasts: state.toasts.filter((t: Toast) => t.id !== id) })), 3000);
  },
  removeToast: (id: string) => set((state: ToastStore) => ({ toasts: state.toasts.filter((t: Toast) => t.id !== id) })),
})); 