import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useGamepad } from '@/hooks/useGamepad';
import { useSettings } from './settings-context-types';

export const DOCK_TABS = ['bookings', 'session', 'gear', 'crew', 'bands', 'charts', 'career'] as const;
export type DockTabId = typeof DOCK_TABS[number];

export const getNextDockTab = (current: DockTabId): DockTabId => {
  const idx = DOCK_TABS.indexOf(current);
  if (idx === -1) return DOCK_TABS[0];
  return DOCK_TABS[(idx + 1) % DOCK_TABS.length];
};

export const getPreviousDockTab = (current: DockTabId): DockTabId => {
  const idx = DOCK_TABS.indexOf(current);
  if (idx === -1) return DOCK_TABS[DOCK_TABS.length - 1];
  return DOCK_TABS[(idx - 1 + DOCK_TABS.length) % DOCK_TABS.length];
};

export interface GamepadNavContextValue {
  activeDockTab: DockTabId;
  setActiveDockTab: (tab: DockTabId) => void;
  cycleDockTab: (direction: 'next' | 'prev') => void;
  registerShortcut: (button: 'south' | 'east' | 'west' | 'north', handler: () => void) => () => void;
  isGamepadActive: boolean;
}

const GamepadNavContext = createContext<GamepadNavContextValue | undefined>(undefined);

export interface GamepadNavProviderProps {
  children: ReactNode;
  onTabChange?: (tab: DockTabId) => void;
}

export const GamepadNavProvider: React.FC<GamepadNavProviderProps> = ({ children, onTabChange }) => {
  const { settings } = useSettings();
  const gamepad = useGamepad({
    preferredLayout: settings?.controllerLayout,
    hapticsEnabled: settings?.gamepadHaptics,
  });

  const [activeDockTab, setActiveDockTabState] = useState<DockTabId>('session');
  const shortcutsRef = useRef<Map<'south' | 'east' | 'west' | 'north', () => void>>(new Map());

  const setActiveDockTab = useCallback((tab: DockTabId) => {
    setActiveDockTabState(tab);
    onTabChange?.(tab);
  }, [onTabChange]);

  const cycleDockTab = useCallback((direction: 'next' | 'prev') => {
    setActiveDockTabState((curr) => {
      const next = direction === 'next' ? getNextDockTab(curr) : getPreviousDockTab(curr);
      onTabChange?.(next);
      return next;
    });
    gamepad.triggerHaptic(0.2, 0.3, 60);
  }, [onTabChange, gamepad]);

  const registerShortcut = useCallback((button: 'south' | 'east' | 'west' | 'north', handler: () => void) => {
    shortcutsRef.current.set(button, handler);
    return () => {
      if (shortcutsRef.current.get(button) === handler) {
        shortcutsRef.current.delete(button);
      }
    };
  }, []);

  // Bumper tab cycling
  useEffect(() => {
    if (!gamepad.isConnected) return;
    if (gamepad.justPressed.lb) {
      cycleDockTab('prev');
    } else if (gamepad.justPressed.rb) {
      cycleDockTab('next');
    }
  }, [gamepad.isConnected, gamepad.justPressed.lb, gamepad.justPressed.rb, cycleDockTab]);

  // Global registered shortcuts (A, B, X, Y)
  useEffect(() => {
    if (!gamepad.isConnected) return;

    if (gamepad.justPressed.south && shortcutsRef.current.has('south')) {
      shortcutsRef.current.get('south')?.();
    } else if (gamepad.justPressed.east && shortcutsRef.current.has('east')) {
      shortcutsRef.current.get('east')?.();
    } else if (gamepad.justPressed.west && shortcutsRef.current.has('west')) {
      shortcutsRef.current.get('west')?.();
    } else if (gamepad.justPressed.north && shortcutsRef.current.has('north')) {
      shortcutsRef.current.get('north')?.();
    }
  }, [
    gamepad.isConnected,
    gamepad.justPressed.south,
    gamepad.justPressed.east,
    gamepad.justPressed.west,
    gamepad.justPressed.north,
  ]);

  // Trigger scrolling
  useEffect(() => {
    if (!gamepad.isConnected) return;

    const scrollDown = gamepad.triggers.right;
    const scrollUp = gamepad.triggers.left;

    if (scrollDown > 0.15 || scrollUp > 0.15) {
      const scrollable = document.querySelector<HTMLElement>(
        '[role="dialog"] [class*="overflow-y-auto"], .studio-activity-panel, main, body'
      );
      if (scrollable) {
        const delta = (scrollDown - scrollUp) * 12;
        scrollable.scrollTop += delta;
      }
    }
  }, [gamepad.isConnected, gamepad.triggers.left, gamepad.triggers.right]);

  // Spatial navigation via D-pad
  useEffect(() => {
    if (!gamepad.isConnected) return;

    const isUp = gamepad.justPressed.dpadUp;
    const isDown = gamepad.justPressed.dpadDown;
    const isLeft = gamepad.justPressed.dpadLeft;
    const isRight = gamepad.justPressed.dpadRight;

    if (isUp || isDown || isLeft || isRight) {
      const focusables = Array.from(
        document.querySelectorAll<HTMLElement>(
          'button:not([disabled]):not([aria-hidden="true"]), [role="button"], a[href], input:not([disabled]), [tabindex="0"]'
        )
      ).filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== 'hidden';
      });

      if (focusables.length === 0) return;

      const activeEl = document.activeElement as HTMLElement | null;
      let targetIndex = 0;

      if (activeEl && focusables.includes(activeEl)) {
        const curIdx = focusables.indexOf(activeEl);
        if (isDown || isRight) {
          targetIndex = (curIdx + 1) % focusables.length;
        } else {
          targetIndex = (curIdx - 1 + focusables.length) % focusables.length;
        }
      }

      focusables[targetIndex]?.focus();
      focusables[targetIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      gamepad.triggerHaptic(0.1, 0.2, 40);
    }
  }, [
    gamepad.isConnected,
    gamepad.justPressed.dpadUp,
    gamepad.justPressed.dpadDown,
    gamepad.justPressed.dpadLeft,
    gamepad.justPressed.dpadRight,
    gamepad,
  ]);

  return (
    <GamepadNavContext.Provider
      value={{
        activeDockTab,
        setActiveDockTab,
        cycleDockTab,
        registerShortcut,
        isGamepadActive: gamepad.lastInputType === 'gamepad',
      }}
    >
      {children}
    </GamepadNavContext.Provider>
  );
};

export const useGamepadNav = (): GamepadNavContextValue => {
  const ctx = useContext(GamepadNavContext);
  if (!ctx) {
    throw new Error('useGamepadNav must be used within GamepadNavProvider');
  }
  return ctx;
};
