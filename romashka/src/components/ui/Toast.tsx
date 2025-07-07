import React, { useEffect } from 'react';
import { create } from 'zustand';
import clsx from 'clsx';

export type Toast = {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
};

export interface ToastStore {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  showToast: (toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })), 3000);
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export const Toasts: React.FC = () => {
  const { toasts, removeToast } = useToastStore();
  useEffect(() => {
    // Clean up on unmount
    return () => toasts.forEach((t) => removeToast(t.id));
  }, [removeToast, toasts]);
  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={clsx(
            'px-6 py-3 rounded-lg shadow-lg font-body text-base min-w-[200px] text-center',
            toast.type === 'success' && 'bg-primary-green text-dark',
            toast.type === 'error' && 'bg-primary-pink text-white',
            toast.type === 'info' && 'bg-primary-purple text-dark',
          )}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}; 