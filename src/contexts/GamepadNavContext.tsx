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

export function isSliderElement(el: HTMLElement | null): boolean {
  if (!el) return false;
  return (
    el.getAttribute('role') === 'slider' ||
    el.hasAttribute('data-radix-slider-thumb') ||
    (el.tagName === 'INPUT' && (el as HTMLInputElement).type === 'range')
  );
}

export function calculateSliderStep(
  currentVal: number,
  direction: 'inc' | 'dec',
  step = 5,
  min = 0,
  max = 100
): number {
  const delta = direction === 'inc' ? step : -step;
  return Math.max(min, Math.min(max, currentVal + delta));
}

export function getNextFocusableIndex(
  currentIndex: number,
  direction: 'next' | 'prev',
  total: number
): number {
  if (total <= 0) return 0;
  if (currentIndex === -1) return 0;
  if (direction === 'next') {
    return (currentIndex + 1) % total;
  }
  return (currentIndex - 1 + total) % total;
}

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
  const prevStickRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastSliderHoldTimeRef = useRef<number>(0);

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

  // Global registered shortcuts or default menu activation (A, B, X, Y)
  useEffect(() => {
    if (!gamepad.isConnected) return;

    if (gamepad.justPressed.south) {
      if (shortcutsRef.current.has('south')) {
        shortcutsRef.current.get('south')?.();
      } else {
        const activeEl = document.activeElement as HTMLElement | null;
        if (
          activeEl &&
          (activeEl.tagName === 'BUTTON' ||
            activeEl.getAttribute('role') === 'button' ||
            activeEl.tagName === 'A' ||
            activeEl.getAttribute('role') === 'tab' ||
            activeEl.tagName === 'INPUT')
        ) {
          activeEl.click();
          gamepad.triggerHaptic(0.15, 0.25, 40);
        }
      }
    } else if (gamepad.justPressed.east) {
      if (shortcutsRef.current.has('east')) {
        shortcutsRef.current.get('east')?.();
      } else {
        // Fallback: look for close/return button in active dialog or panel
        const closeBtn = document.querySelector<HTMLElement>(
          '[role="dialog"] button[aria-label*="close" i], [role="dialog"] button[aria-label*="return" i], .studio-activity-panel button[aria-label*="close" i], .studio-activity-panel button[aria-label*="return" i]'
        );
        if (closeBtn) {
          closeBtn.click();
          gamepad.triggerHaptic(0.1, 0.2, 40);
        }
      }
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
    gamepad,
  ]);

  // Trigger and Right Stick scrolling for menus/dialogs
  useEffect(() => {
    if (!gamepad.isConnected) return;

    const scrollDown = gamepad.triggers.right;
    const scrollUp = gamepad.triggers.left;
    const rsY = Math.abs(gamepad.rightStick.y) > 0.18 ? gamepad.rightStick.y : 0;

    if (scrollDown > 0.15 || scrollUp > 0.15 || Math.abs(rsY) > 0) {
      const scrollDelta = (scrollDown - scrollUp) * 12 + rsY * 14;
      const scrollable = document.querySelector<HTMLElement>(
        '[role="dialog"] [class*="overflow-y-auto"], .studio-activity-panel [class*="overflow-y-auto"], [role="dialog"] [data-radix-scroll-area-viewport], .studio-panel-body, [role="dialog"], main, body'
      );
      if (scrollable) {
        scrollable.scrollTop += scrollDelta;
      }
    }
  }, [gamepad.isConnected, gamepad.triggers.left, gamepad.triggers.right, gamepad.rightStick.y]);

  // Spatial navigation via D-pad and Left Stick, with specialized slider controls
  useEffect(() => {
    if (!gamepad.isConnected) return;

    const stickThreshold = 0.45;
    const prev = prevStickRef.current;
    const stickLeftJust = gamepad.leftStick.x < -stickThreshold && prev.x >= -stickThreshold;
    const stickRightJust = gamepad.leftStick.x > stickThreshold && prev.x <= stickThreshold;
    const stickUpJust = gamepad.leftStick.y < -stickThreshold && prev.y >= -stickThreshold;
    const stickDownJust = gamepad.leftStick.y > stickThreshold && prev.y <= stickThreshold;
    prevStickRef.current = { x: gamepad.leftStick.x, y: gamepad.leftStick.y };

    const isUp = gamepad.justPressed.dpadUp || stickUpJust;
    const isDown = gamepad.justPressed.dpadDown || stickDownJust;
    const isLeft = gamepad.justPressed.dpadLeft || stickLeftJust;
    const isRight = gamepad.justPressed.dpadRight || stickRightJust;

    const activeEl = document.activeElement as HTMLElement | null;
    const onSlider = isSliderElement(activeEl);

    // 1. If currently on a slider, Left/Right tap adjusts the slider value
    if (onSlider && (isLeft || isRight)) {
      const key = isRight ? 'ArrowRight' : 'ArrowLeft';
      activeEl?.dispatchEvent(new KeyboardEvent('keydown', { key, code: key, bubbles: true, cancelable: true }));
      activeEl?.dispatchEvent(new KeyboardEvent('keyup', { key, code: key, bubbles: true, cancelable: true }));
      gamepad.triggerHaptic(0.08, 0.15, 25);
      return;
    }

    // 2. Continuous analog stick sliding when holding stick horizontally on a slider
    if (onSlider && Math.abs(gamepad.leftStick.x) > stickThreshold) {
      const now = performance.now();
      if (now - lastSliderHoldTimeRef.current > 85) {
        lastSliderHoldTimeRef.current = now;
        const key = gamepad.leftStick.x > 0 ? 'ArrowRight' : 'ArrowLeft';
        activeEl?.dispatchEvent(new KeyboardEvent('keydown', { key, code: key, bubbles: true, cancelable: true }));
        activeEl?.dispatchEvent(new KeyboardEvent('keyup', { key, code: key, bubbles: true, cancelable: true }));
        gamepad.triggerHaptic(0.05, 0.1, 20);
      }
      return;
    }

    // 3. Spatial navigation across menus and interactive elements
    if (isUp || isDown || isLeft || isRight) {
      const container = document.querySelector<HTMLElement>('[role="dialog"], .studio-activity-panel') || document.body;
      const focusables = Array.from(
        container.querySelectorAll<HTMLElement>(
          '[role="slider"], button:not([disabled]):not([aria-hidden="true"]), [role="button"]:not([aria-disabled="true"]):not([aria-hidden="true"]), [role="tab"]:not([aria-disabled="true"]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]:not([aria-hidden="true"])'
        )
      ).filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== 'hidden';
      });

      if (focusables.length === 0) return;

      const curIdx = activeEl ? focusables.indexOf(activeEl) : -1;
      const direction = (isDown || isRight) ? 'next' : 'prev';
      const targetIndex = getNextFocusableIndex(curIdx, direction, focusables.length);

      const targetEl = focusables[targetIndex];
      targetEl?.focus();
      targetEl?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      gamepad.triggerHaptic(0.1, 0.15, 30);
    }
  }, [
    gamepad.isConnected,
    gamepad.justPressed.dpadUp,
    gamepad.justPressed.dpadDown,
    gamepad.justPressed.dpadLeft,
    gamepad.justPressed.dpadRight,
    gamepad.leftStick.x,
    gamepad.leftStick.y,
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
