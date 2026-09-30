import { useEffect } from 'react';

export interface HotkeyBinding {
  /** `event.key` value ("1", "?", "b"). */
  key: string;
  label: string;
  description: string;
  run: () => void;
}

interface KeyLike {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
}

/** Pure: which binding (if any) a key press triggers. Modified presses never match. */
export const matchHotkey = <T extends { key: string }>(event: KeyLike, bindings: readonly T[]): T | undefined => {
  if (event.ctrlKey || event.metaKey || event.altKey) return undefined;
  return bindings.find((b) => b.key === event.key);
};

export const isTypingTarget = (target: EventTarget | null): boolean =>
  typeof HTMLElement !== 'undefined' &&
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

/** Any open modal (Radix dialog, cinematic, confirm) owns the keyboard. */
export const hasBlockingDialog = (): boolean =>
  typeof document !== 'undefined' && Boolean(document.querySelector('[role="dialog"][data-state="open"], [aria-modal="true"]'));

/**
 * Studio-wide keyboard shortcuts. Off while typing, while any modal is open, or when `enabled` is false
 * (e.g. during a keyboard-driven minigame).
 */
export const useStudioHotkeys = (bindings: readonly HotkeyBinding[], enabled: boolean): void => {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || isTypingTarget(e.target) || hasBlockingDialog()) return;
      const hit = matchHotkey(e, bindings);
      if (!hit) return;
      e.preventDefault();
      hit.run();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [bindings, enabled]);
};
