import { useState, useEffect } from 'react';
import { useSettings } from '@/contexts/settings-context-types';
import type { Transition } from 'framer-motion';

export interface MotionCapabilities {
  /** True if user has OS reduced-motion active OR settings.reducedMotion is enabled */
  reducedMotion: boolean;
  /** Whether decorative ambient motion (floating blobs, pulsing highlights) is allowed */
  decorativeMotion: boolean;
  /** Whether particle celebrations (confetti, sparks) are allowed */
  particles: boolean;
  /** Whether GPU post-fx/shimmers (glow sweeps, CRT curvature) are allowed */
  heavyEffects: boolean;
  /** True if current browser tab/window is visible (stops RAF loops on background tabs) */
  isTabVisible: boolean;
  /** Current graphics preset level */
  graphicsPreset: 'low' | 'medium' | 'high' | 'ultra';
  /** Helper to sanitize Framer Motion transition config under reduced-motion */
  filterTransition: (transition: Transition) => Transition;
}

/**
 * Pure helper to sanitize Framer Motion transition config under reduced motion.
 */
export function getFilteredTransition<T extends Transition>(transition: T, reducedMotion: boolean): Transition {
  if (reducedMotion) {
    return { duration: 0 };
  }
  return transition;
}

/**
 * Pure evaluator for motion capabilities from inputs (useful outside React hook context and in test suites).
 */
export function resolveMotionCapabilities(params: {
  osReducedMotion?: boolean;
  settingReducedMotion?: boolean;
  graphicsPreset?: 'low' | 'medium' | 'high' | 'ultra';
  isTabVisible?: boolean;
  focusMode?: boolean;
}): MotionCapabilities {
  const reducedMotion = Boolean(params.osReducedMotion || params.settingReducedMotion);
  const isTabVisible = params.isTabVisible ?? true;
  const graphicsPreset = params.graphicsPreset ?? 'high';
  const isFocusMode = Boolean(params.focusMode);

  // Decorative motion is disabled when tab is hidden, in reduced motion, or in Focus mode
  const decorativeMotion = isTabVisible && !reducedMotion && !isFocusMode && graphicsPreset !== 'low';

  // Particles allowed only when not in reduced motion, not in low preset, and tab is visible
  const particles = isTabVisible && !reducedMotion && !isFocusMode && graphicsPreset !== 'low';

  // Heavy effects (multi-layer sweeps, blur backdrops, glow) require medium+ graphics and active tab
  const heavyEffects =
    isTabVisible &&
    !reducedMotion &&
    !isFocusMode &&
    (graphicsPreset === 'high' || graphicsPreset === 'ultra');

  const filterTransition = (transition: Transition): Transition => {
    return getFilteredTransition(transition, reducedMotion);
  };

  return {
    reducedMotion,
    decorativeMotion,
    particles,
    heavyEffects,
    isTabVisible,
    graphicsPreset,
    filterTransition,
  };
}

/**
 * Hook providing dynamic motion capabilities reacting to settings, system OS preferences,
 * and document visibility state.
 */
export function useMotionCapabilities(options?: { focusMode?: boolean }): MotionCapabilities {
  let settingsReducedMotion = false;
  let graphicsPreset: 'low' | 'medium' | 'high' | 'ultra' = 'high';

  try {
    const { settings } = useSettings();
    if (settings) {
      settingsReducedMotion = Boolean(settings.reducedMotion);
      graphicsPreset = settings.graphicsPreset ?? 'high';
    }
  } catch {
    // Fallback if rendered outside SettingsProvider
  }

  const [osReducedMotion, setOsReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const [isTabVisible, setIsTabVisible] = useState<boolean>(() => {
    if (typeof document === 'undefined') return true;
    return document.visibilityState === 'visible';
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setOsReducedMotion(e.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', onChange);
      return () => mediaQuery.removeEventListener('change', onChange);
    } else {
      // Compatibility for legacy browsers
      mediaQuery.addListener(onChange);
      return () => mediaQuery.removeListener(onChange);
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onVisibilityChange = () => {
      setIsTabVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  return resolveMotionCapabilities({
    osReducedMotion,
    settingReducedMotion: settingsReducedMotion,
    graphicsPreset,
    isTabVisible,
    focusMode: options?.focusMode,
  });
}
