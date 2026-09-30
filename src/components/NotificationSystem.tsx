
import React, { useEffect } from 'react';
import { GameNotification } from '@/types/game';
import './chip-fidelity.css';

interface NotificationSystemProps {
  notifications: GameNotification[];
  removeNotification: (id: string) => void;
}

export const NotificationSystem: React.FC<NotificationSystemProps> = ({
  notifications,
  removeNotification
}) => {
  useEffect(() => {
    notifications.forEach(notification => {
      if (notification.duration) {
        const timer = setTimeout(() => {
          removeNotification(notification.id);
        }, notification.duration);
        
        return () => clearTimeout(timer);
      }
    });
  }, [notifications, removeNotification]);

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
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map(notification => (
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
