/**
 * Game-facing motion primitives wrapping OriginKit and Framer Motion.
 * Standardizes styling, reduced-motion behavior, and hardware tactile feedback.
 */
export { MotionPanel, type MotionPanelProps, type MotionPanelDirection } from './MotionPanel';
export { MotionButton, type MotionButtonProps } from './MotionButton';
export { MotionReveal, type MotionRevealProps, type MotionRevealDirection } from './MotionReveal';
export { MotionReward, type MotionRewardProps } from './MotionReward';
export { MotionNumber, type MotionNumberProps, evaluateSpringSettle } from './MotionNumber';
export { MagneticPress, type MagneticPressProps } from '../origin/MagneticPress';
export { TextScramble, type TextScrambleProps } from '../origin/TextScramble';
export * from '@/lib/motion/tokens';
export * from '@/lib/motion/capabilities';
