import { useState, useEffect, useRef, useCallback } from 'react';
import { GamepadSnapshot, ControllerType, ControllerLayoutPreference, StandardButton } from '@/types/gamepad';
import {
  detectControllerType,
  processStickAxes,
  mapStandardGamepadButtons,
  createDefaultGamepadSnapshot,
  triggerGamepadHaptic,
  STANDARD_BUTTONS,
} from '@/services/gamepadService';

export interface UseGamepadOptions {
  preferredLayout?: ControllerLayoutPreference;
  deadzone?: number;
  hapticsEnabled?: boolean;
}

export interface UseGamepadResult extends GamepadSnapshot {
  lastInputType: 'gamepad' | 'keyboard_mouse';
  triggerHaptic: (weak?: number, strong?: number, durationMs?: number) => void;
}

export const useGamepad = (options: UseGamepadOptions = {}): UseGamepadResult => {
  const { preferredLayout = 'auto', deadzone = 0.18, hapticsEnabled = true } = options;

  const [snapshot, setSnapshot] = useState<GamepadSnapshot>(createDefaultGamepadSnapshot);
  const [lastInputType, setLastInputType] = useState<'gamepad' | 'keyboard_mouse'>('keyboard_mouse');

  const prevButtonsRef = useRef<Record<StandardButton, boolean>>(snapshot.buttons);
  const activePadIndexRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Switch to mouse/keyboard on mouse or key input
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onPointerActivity = () => {
      setLastInputType((prev) => (prev !== 'keyboard_mouse' ? 'keyboard_mouse' : prev));
    };

    window.addEventListener('mousemove', onPointerActivity, { passive: true });
    window.addEventListener('keydown', onPointerActivity, { passive: true });
    window.addEventListener('touchstart', onPointerActivity, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onPointerActivity);
      window.removeEventListener('keydown', onPointerActivity);
      window.removeEventListener('touchstart', onPointerActivity);
    };
  }, []);

  // Main polling loop
  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator.getGamepads !== 'function') return;

    const pollGamepad = () => {
      const gamepads = navigator.getGamepads();
      let pad: Gamepad | null = null;

      // Find the first connected gamepad
      for (let i = 0; i < gamepads.length; i++) {
        const candidate = gamepads[i];
        if (candidate && candidate.connected) {
          pad = candidate;
          activePadIndexRef.current = i;
          break;
        }
      }

      if (!pad) {
        setSnapshot((prev) => (prev.isConnected ? createDefaultGamepadSnapshot() : prev));
        animationFrameRef.current = requestAnimationFrame(pollGamepad);
        return;
      }

      const detectedType = detectControllerType(pad.id);
      const effectiveType: ControllerType =
        preferredLayout && preferredLayout !== 'auto' ? preferredLayout : detectedType;

      const currentButtons = mapStandardGamepadButtons(pad.buttons);
      const prevButtons = prevButtonsRef.current;

      const justPressed: Partial<Record<StandardButton, boolean>> = {};
      const justReleased: Partial<Record<StandardButton, boolean>> = {};
      let anyButtonPressed = false;

      for (const btn of STANDARD_BUTTONS) {
        const now = currentButtons[btn];
        const before = prevButtons[btn];
        justPressed[btn] = now && !before;
        justReleased[btn] = !now && before;
        if (now) anyButtonPressed = true;
      }

      // Read axes
      const leftStick = processStickAxes(pad.axes[0] ?? 0, pad.axes[1] ?? 0, deadzone);
      const rightStick = processStickAxes(pad.axes[2] ?? 0, pad.axes[3] ?? 0, deadzone);

      // Read triggers (buttons 6 & 7 or axes)
      const leftTrigger = pad.buttons[6]?.value ?? 0;
      const rightTrigger = pad.buttons[7]?.value ?? 0;

      const stickMoved =
        Math.hypot(leftStick.x, leftStick.y) > 0 || Math.hypot(rightStick.x, rightStick.y) > 0;

      if (anyButtonPressed || stickMoved) {
        setLastInputType('gamepad');
      }

      prevButtonsRef.current = currentButtons;

      setSnapshot({
        isConnected: true,
        controllerType: effectiveType,
        buttons: currentButtons,
        justPressed: justPressed as Record<StandardButton, boolean>,
        justReleased: justReleased as Record<StandardButton, boolean>,
        leftStick,
        rightStick,
        triggers: { left: leftTrigger, right: rightTrigger },
      });

      animationFrameRef.current = requestAnimationFrame(pollGamepad);
    };

    animationFrameRef.current = requestAnimationFrame(pollGamepad);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [preferredLayout, deadzone]);

  const triggerHaptic = useCallback(
    (weak = 0.4, strong = 0.6, durationMs = 120) => {
      if (!hapticsEnabled) return;
      triggerGamepadHaptic(activePadIndexRef.current, weak, strong, durationMs);
    },
    [hapticsEnabled]
  );

  return {
    ...snapshot,
    lastInputType,
    triggerHaptic,
  };
};
