/**
 * @fileoverview Toast notification hook
 * @version 1.0.0
 * @author Recording Studio Tycoon Development Team
 * @created 2025-01-19
 * 
 * Hook for displaying toast notifications in the game.
 */

import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((options: ToastOptions | string) => {
    const toastData: Toast = typeof options === 'string' 
      ? {
          id: Math.random().toString(36).substr(2, 9),
          description: options,
          variant: 'default',
          duration: 3000
        }
      : {
          id: Math.random().toString(36).substr(2, 9),
          variant: 'default',
          duration: 3000,
          ...options
        };

    setToasts(prev => [...prev, toastData]);

    // Auto remove toast after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toastData.id));
    }, toastData.duration);

    return toastData;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return {
    toast,
    dismiss,
    toasts
  };
};
