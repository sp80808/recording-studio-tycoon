
import React, { useEffect, useRef } from 'react';
import { GameNotification } from '@/types/game';
import './chip-fidelity.css';

const DEFAULT_TOAST_MS = 9000;
const MAX_VISIBLE_TOASTS = 3;

interface NotificationSystemProps {
  notifications: GameNotification[];
  removeNotification: (id: string) => void;
}

export const NotificationSystem: React.FC<NotificationSystemProps> = ({
  notifications,
  removeNotification
}) => {
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  // Schedule each notification once. Re-rendering after a burst must not reset
  // older timers and keep stale cards on screen indefinitely.
  useEffect(() => {
    const activeIds = new Set(notifications.map((notification) => notification.id));
    for (const [id, timer] of timersRef.current) {
      if (!activeIds.has(id)) {
        clearTimeout(timer);
        timersRef.current.delete(id);
      }
    }

    for (const notification of notifications) {
      if (timersRef.current.has(notification.id)) continue;
      const timer = setTimeout(() => {
        timersRef.current.delete(notification.id);
        removeNotification(notification.id);
      }, notification.duration ?? DEFAULT_TOAST_MS);
      timersRef.current.set(notification.id, timer);
    }

    return () => {
      // Timers remain owned by their notification ids across normal updates.
    };
  }, [notifications, removeNotification]);

  useEffect(() => () => {
    for (const timer of timersRef.current.values()) clearTimeout(timer);
    timersRef.current.clear();
  }, []);

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'rst-toast rst-toast-success';
      case 'warning': return 'rst-toast rst-toast-warning';
      case 'error': return 'rst-toast rst-toast-error';
      case 'historical': return 'rst-toast [border-left-color:var(--rst-story)_!important]';
      default: return 'rst-toast rst-toast-info';
    }
  };

  return (
    <div
      className="fixed bottom-4 left-4 z-50 flex max-h-[min(48vh,22rem)] w-[min(calc(100vw-2rem),24rem)] flex-col-reverse gap-2 overflow-hidden"
      role="region"
      aria-label="Game notifications"
      aria-live="polite"
    >
      {notifications.slice(-MAX_VISIBLE_TOASTS).map(notification => (
        <div
          key={notification.id}
          className={`cursor-pointer px-4 py-3 text-sm animate-rst-rise ${getNotificationColor(notification.type)}${notification.type === 'error' ? ' deny-shake' : ''}`}
          onClick={() => removeNotification(notification.id)}
        >
          <div className="leading-snug">{notification.message}</div>
          <div className="rst-muted mt-1 text-[10px] uppercase tracking-[0.18em]">Click to dismiss</div>
        </div>
      ))}
    </div>
  );
};
