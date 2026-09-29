import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  motionTokens,
  motionDuration,
  motionSpring,
  motionEasing,
  motionTransition,
  resolveMotionCapabilities,
  getFilteredTransition,
  evaluateSpringSettle,
  MotionPanel,
  MotionButton,
  MotionReveal,
  MotionReward,
  MotionNumber
} from '../src/components/motion/primitives';

test('OriginKit Motion Primitives (#73) - Export Surface', () => {
  assert.equal(typeof MotionPanel, 'object', 'MotionPanel is a forwardRef React component');
  assert.equal(typeof MotionButton, 'object', 'MotionButton is a forwardRef React component');
  assert.equal(typeof MotionReveal, 'object', 'MotionReveal is a forwardRef React component');
  assert.equal(typeof MotionReward, 'object', 'MotionReward is a forwardRef React component');
  assert.equal(typeof MotionNumber, 'function', 'MotionNumber is a React component');
  assert.equal(typeof evaluateSpringSettle, 'function', 'evaluateSpringSettle solver is exported');
  assert.equal(typeof getFilteredTransition, 'function', 'getFilteredTransition helper is exported');
});

test('OriginKit Motion Tokens Integrity', () => {
  // Durations
  assert.equal(motionDuration.instant, 0);
  assert.equal(motionDuration.micro, 0.08);
  assert.equal(motionDuration.fast, 0.15);
  assert.equal(motionDuration.normal, 0.25);
  assert.equal(motionDuration.panel, 0.32);
  assert.equal(motionDuration.reveal, 0.45);
  assert.equal(motionDuration.cinematic, 0.75);

  // Springs
  assert.equal(motionSpring.drawer.stiffness, 280);
  assert.equal(motionSpring.drawer.damping, 30);
  assert.equal(motionSpring.press.stiffness, 480);
  assert.equal(motionSpring.press.damping, 26);
  assert.equal(motionSpring.reward.stiffness, 220);
  assert.equal(motionSpring.reward.damping, 18);

  // Easings
  assert.deepEqual(motionEasing.settle, [0.16, 1.0, 0.3, 1.0]);
  assert.deepEqual(motionEasing.hardware, [0.2, 0.8, 0.2, 1.0]);

  // Composite Transitions
  assert.deepEqual(motionTransition.drawer, motionSpring.drawer);
  assert.deepEqual(motionTransition.press, motionSpring.press);
  assert.deepEqual(motionTransition.reward, motionSpring.reward);
  assert.equal(motionTransition.instant.duration, 0);
});

test('Transition Filtering under Reduced Motion', () => {
  const normalTransition = getFilteredTransition(motionSpring.drawer, false);
  assert.deepEqual(normalTransition, motionSpring.drawer);

  const reducedTransition = getFilteredTransition(motionSpring.drawer, true);
  assert.deepEqual(reducedTransition, { duration: 0 });

  const customReduced = getFilteredTransition(motionSpring.reward, true);
  assert.deepEqual(customReduced, { duration: 0 });
});

test('Capabilities Resolution - Reduced Motion & Graphics Presets', () => {
  // Default desktop profile
  const defaultCaps = resolveMotionCapabilities({});
  assert.equal(defaultCaps.reducedMotion, false);
  assert.equal(defaultCaps.decorativeMotion, true);
  assert.equal(defaultCaps.particles, true);
  assert.equal(defaultCaps.heavyEffects, true);
  assert.deepEqual(defaultCaps.filterTransition(motionSpring.press), motionSpring.press);

  // OS prefers-reduced-motion active
  const osReducedCaps = resolveMotionCapabilities({ osReducedMotion: true });
  assert.equal(osReducedCaps.reducedMotion, true);
  assert.equal(osReducedCaps.decorativeMotion, false);
  assert.equal(osReducedCaps.particles, false);
  assert.equal(osReducedCaps.heavyEffects, false);
  assert.deepEqual(osReducedCaps.filterTransition(motionSpring.reward), { duration: 0 });

  // In-game Settings reduced-motion toggle active
  const settingsReducedCaps = resolveMotionCapabilities({ settingReducedMotion: true });
  assert.equal(settingsReducedCaps.reducedMotion, true);
  assert.equal(settingsReducedCaps.decorativeMotion, false);
  assert.deepEqual(settingsReducedCaps.filterTransition(motionSpring.drawer), { duration: 0 });

  // Low graphics preset suppresses expensive visual layers
  const lowPresetCaps = resolveMotionCapabilities({ graphicsPreset: 'low' });
  assert.equal(lowPresetCaps.reducedMotion, false);
  assert.equal(lowPresetCaps.decorativeMotion, false);
  assert.equal(lowPresetCaps.particles, false);
  assert.equal(lowPresetCaps.heavyEffects, false);

  // Background tab visibility suppresses continuous animations
  const hiddenTabCaps = resolveMotionCapabilities({ isTabVisible: false });
  assert.equal(hiddenTabCaps.decorativeMotion, false);
  assert.equal(hiddenTabCaps.particles, false);
  assert.equal(hiddenTabCaps.heavyEffects, false);
});

test('MotionNumber Analytical Spring Solver (evaluateSpringSettle)', () => {
  // Instant identity check
  const start = evaluateSpringSettle(0, 100, 0);
  assert.equal(start.value, 0);
  assert.equal(start.isSettled, false);

  // Same value settles immediately
  const equalTarget = evaluateSpringSettle(50, 50, 0);
  assert.equal(equalTarget.value, 50);
  assert.equal(equalTarget.isSettled, true);

  // Mid-flight evaluation at 150ms
  const mid = evaluateSpringSettle(0, 100, 0.15, motionSpring.drawer.stiffness, motionSpring.drawer.damping);
  assert.ok(mid.value > 65 && mid.value < 90, `mid-flight value ${mid.value} in expected range`);
  assert.equal(mid.isSettled, false);

  // Settled check at 600ms
  const settled = evaluateSpringSettle(0, 100, 0.6, motionSpring.drawer.stiffness, motionSpring.drawer.damping);
  assert.equal(Math.round(settled.value), 100);
  assert.equal(settled.isSettled, true);
});

test('Static Inspection of Central Motion Architecture & Component Migrations', () => {
  const baseDir = process.cwd();
  const read = (relPath: string) => fs.readFileSync(path.join(baseDir, relPath), 'utf8');

  // 1. Central MotionConfig mounted in App.tsx
  const appSrc = read('src/App.tsx');
  assert.ok(appSrc.includes('MotionConfig'), 'App.tsx imports MotionConfig');
  assert.ok(appSrc.includes('reducedMotion="user"'), 'App.tsx mounts <MotionConfig reducedMotion="user">');

  // 2. StudioDutiesClipboard migration
  const dutiesSrc = read('src/components/chores/StudioDutiesClipboard.tsx');
  assert.ok(dutiesSrc.includes('<MotionPanel'), 'StudioDutiesClipboard renders <MotionPanel');
  assert.ok(dutiesSrc.includes('<MotionButton'), 'StudioDutiesClipboard renders <MotionButton');
  assert.ok(dutiesSrc.includes('<MotionReveal'), 'StudioDutiesClipboard renders <MotionReveal');
  assert.ok(dutiesSrc.includes('<MotionNumber'), 'StudioDutiesClipboard renders <MotionNumber');

  // 3. ProjectReviewModal migration
  const reviewSrc = read('src/components/modals/ProjectReviewModal.tsx');
  assert.ok(reviewSrc.includes('<MotionReward'), 'ProjectReviewModal renders <MotionReward');
  assert.ok(reviewSrc.includes('<MotionButton'), 'ProjectReviewModal renders <MotionButton');
  assert.ok(reviewSrc.includes('<MotionNumber'), 'ProjectReviewModal renders <MotionNumber');

  // 4. AnimatedCounter migration
  const counterSrc = read('src/components/AnimatedCounter.tsx');
  assert.ok(counterSrc.includes('MotionNumber'), 'AnimatedCounter delegates to central MotionNumber primitive');
});
