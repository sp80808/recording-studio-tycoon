
import React, { useEffect } from 'react';
import { GameNotification } from '@/types/game';

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
      case 'success': return 'bg-green-600 border-green-500';
      case 'warning': return 'bg-yellow-600 border-yellow-500';
      case 'error': return 'bg-red-600 border-red-500';
      default: return 'bg-blue-600 border-blue-500';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`p-3 rounded-lg border text-white shadow-lg animate-fade-in ${getNotificationColor(notification.type)}`}
          onClick={() => removeNotification(notification.id)}
        >
          <div className="text-sm">{notification.message}</div>
          <div className="text-xs opacity-75 mt-1">Click to dismiss</div>
        </div>
      ))}
    </div>
  );
};
