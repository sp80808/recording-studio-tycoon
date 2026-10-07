import { useEffect, useRef } from 'react';
import { GameNotification } from '@/types/game';
import { toast } from '@/hooks/use-toast';
import { useAppDisplayMode } from '@/hooks/useAppDisplayMode';

const DEFAULT_TOAST_MS = 9000;
/** Phone-width foreground cards last long enough to read a story line, but never linger over gameplay. */
const COMPACT_TOAST_MS = 5000;

interface NotificationSystemProps {
  notifications: GameNotification[];
  removeNotification: (id: string) => void;
}

/**
 * Bridge from game notifications to the one notification host (Sonner, lane chosen by
 * lib/notificationPlacement, #325). There is no second visible stack on any screen size, so two
 * hosts can never overlap each other or gameplay chrome.
 */
export const NotificationSystem = ({ notifications, removeNotification }: NotificationSystemProps) => {
  const forwardedRef = useRef(new Set<string>());
  const { compact } = useAppDisplayMode();

  useEffect(() => {
    for (const notification of notifications) {
      if (forwardedRef.current.has(notification.id)) continue;
      forwardedRef.current.add(notification.id);
      const requested = notification.duration ?? (compact ? COMPACT_TOAST_MS : DEFAULT_TOAST_MS);
      toast({
        title: notification.message,
        variant: notification.type === 'error' ? 'destructive' : undefined,
        duration: compact ? Math.min(requested, COMPACT_TOAST_MS) : requested,
      });
      removeNotification(notification.id);
    }
  }, [compact, notifications, removeNotification]);

  return null;
};
