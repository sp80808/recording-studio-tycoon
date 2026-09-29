/**
 * Recording Studio Tycoon — Central Motion Tokens
 * Semantic animation constants aligned with hardware tactile feel and #46 performance budget.
 */

export const motionDuration = {
  instant: 0,
  micro: 0.08,
  fast: 0.15,
  normal: 0.25,
  panel: 0.32,
  reveal: 0.45,
  cinematic: 0.75,
} as const;

export const motionSpring = {
  /** Snappy hardware push button or rotary detent click */
  press: { type: 'spring', stiffness: 480, damping: 26, mass: 0.7 } as const,
  /** Snappy UI card / tab switch */
  snappy: { type: 'spring', stiffness: 380, damping: 28, mass: 0.9 } as const,
  /** Contextual drawer slide-in / slide-out */
  drawer: { type: 'spring', stiffness: 280, damping: 30, mass: 1.0 } as const,
  /** Milestone celebration, crate unboxing card bounce */
  reward: { type: 'spring', stiffness: 220, damping: 18, mass: 1.0 } as const,
  /** Ambient gentle floating / focus indicator */
  gentle: { type: 'spring', stiffness: 160, damping: 22, mass: 1.1 } as const,
} as const;

export const motionEasing = {
  /** Crisp tactile mechanical response */
  hardware: [0.2, 0.8, 0.2, 1.0] as const,
  /** Natural organic deceleration without overshoot */
  settle: [0.16, 1.0, 0.3, 1.0] as const,
  /** Anticipatory wind-up before an action */
  anticipate: [0.36, 0, 0.66, -0.56] as const,
  /** Linear transition */
  linear: [0, 0, 1, 1] as const,
} as const;

export const motionTransition = {
  instant: { duration: motionDuration.instant } as const,
  press: motionSpring.press,
  drawer: motionSpring.drawer,
  reward: motionSpring.reward,
  snappy: motionSpring.snappy,
  gentle: motionSpring.gentle,
  reveal: { duration: motionDuration.reveal, ease: motionEasing.settle } as const,
  settle: { duration: motionDuration.normal, ease: motionEasing.settle } as const,
  hardware: { duration: motionDuration.fast, ease: motionEasing.hardware } as const,
} as const;

export const motionTokens = {
  duration: motionDuration,
  spring: motionSpring,
  easing: motionEasing,
  transition: motionTransition,
} as const;

export type MotionDuration = keyof typeof motionDuration;
export type MotionSpring = keyof typeof motionSpring;
export type MotionEasing = keyof typeof motionEasing;
export type MotionTransition = keyof typeof motionTransition;
