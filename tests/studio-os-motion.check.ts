import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  motionTokens,
  motionDuration,
  motionSpring,
  resolveMotionCapabilities,
  getFilteredTransition,
  evaluateSpringSettle,
  MotionPanel,
  MotionButton,
  MotionReveal,
  MotionNumber,
} from '../src/components/motion/primitives';

import { ContextDrawer } from '../src/components/ContextDrawer';

const baseDir = process.cwd();
const read = (relPath: string) => fs.readFileSync(path.join(baseDir, relPath), 'utf8');

test('Studio OS V2 Motion (#75) - ContextDrawer Component & Primitives Export Surface', () => {
  assert.equal(typeof ContextDrawer, 'function', 'ContextDrawer is exported as a React FC');
  assert.equal(typeof MotionPanel, 'object', 'MotionPanel primitive is a forwardRef component');
  assert.equal(typeof MotionButton, 'object', 'MotionButton primitive is a forwardRef component');
  assert.equal(typeof MotionReveal, 'object', 'MotionReveal primitive is a forwardRef component');
  assert.equal(typeof MotionNumber, 'function', 'MotionNumber primitive is a component');
});

test('Studio OS V2 Motion (#75) - PixiJS Canvas Mount Invariant', () => {
  const mainGameContentCode = read('src/components/MainGameContent.tsx');
  const studioRoomCode = read('src/components/StudioRoom.tsx');
  const contextDrawerCode = read('src/components/ContextDrawer.tsx');

  // StudioRoom must mount WebGLCanvas
  assert.match(studioRoomCode, /<WebGLCanvas\s+state=\{sceneState\}/, 'StudioRoom mounts WebGLCanvas');

  // MainGameContent must mount StudioRoom unconditionally outside of ContextDrawer
  assert.match(mainGameContentCode, /<StudioRoom\s+gameState=\{gameState\}/, 'MainGameContent mounts StudioRoom unconditionally');
  assert.match(mainGameContentCode, /<ContextDrawer\s+isOpen=\{panel !== null\}/, 'MainGameContent renders ContextDrawer as slide-over overlay');

  // ContextDrawer must use MotionPanel with direction support (right or scale)
  assert.match(contextDrawerCode, /<MotionPanel[\s\S]*?direction=\{activeTab === 'session' \? 'scale' : 'right'\}/, 'ContextDrawer uses MotionPanel with direction right or scale');

  // ContextDrawer must support quick-switching tabs without closing/reopening the drawer
  assert.match(contextDrawerCode, /role="tablist"/, 'ContextDrawer has tablist for direct switcher');
  assert.match(contextDrawerCode, /activeTab === tab\.id/, 'ContextDrawer checks active tab without dismounting');
});

test('Studio OS V2 Motion (#75) - Enquiry Arrival & Peripheral Indication', () => {
  const studioRoomCode = read('src/components/StudioRoom.tsx');
  const projectListCode = read('src/components/ProjectList.tsx');
  const mainGameContentCode = read('src/components/MainGameContent.tsx');

  // StudioRoom must have peripheral unread enquiry indicator using MotionReveal and MotionNumber
  assert.match(studioRoomCode, /availableCount > 0[\s\S]*?<MotionReveal[\s\S]*?<MotionNumber value=\{availableCount\} \/>/, 'StudioRoom renders peripheral enquiry indicator with MotionReveal and MotionNumber');

  // Command dock in MainGameContent must have unread count badge on bookings
  assert.match(mainGameContentCode, /id === 'bookings' && gameState\.availableProjects\.length > 0[\s\S]*?<MotionNumber value=\{gameState\.availableProjects\.length\} \/>/, 'Command dock has peripheral unread badge on bookings button');

  // ProjectList must use MotionReveal with stagger on enquiry cards
  assert.match(projectListCode, /<MotionReveal[\s\S]*?staggerIndex=\{index\}/, 'ProjectList animates enquiry cards with staggered MotionReveal');

  // Enquiry cards must use MotionNumber for fee, rep, duration
  assert.match(projectListCode, /<MotionNumber value=\{project\.payoutBase\} prefix="\$" \/>/, 'ProjectList uses MotionNumber for fee');
  assert.match(projectListCode, /<MotionNumber value=\{project\.repGainBase\} prefix="\+" \/>/, 'ProjectList uses MotionNumber for rep');
  assert.match(projectListCode, /<MotionNumber value=\{project\.durationDaysTotal\} suffix="d" \/>/, 'ProjectList uses MotionNumber for duration');
});

test('Studio OS V2 Motion (#75) - Action Feedback Timing Bounds (~150-250ms)', () => {
  const projectListCode = read('src/components/ProjectList.tsx');
  const studioInspectorCode = read('src/components/StudioInspector.tsx');
  const activeProjectCode = read('src/components/ActiveProject.tsx');

  // Enquiry booking in ProjectList: ~180ms
  const bookingMatch = projectListCode.match(/handleAcceptEnquiry[\s\S]*?setTimeout\([\s\S]*?,\s*(\d+)\)/);
  assert.ok(bookingMatch, 'handleAcceptEnquiry has timed tactile feedback');
  const bookingDelay = parseInt(bookingMatch[1], 10);
  assert.ok(bookingDelay >= 150 && bookingDelay <= 250, `Booking feedback delay (${bookingDelay}ms) is within 150-250ms`);

  // Enquiry decline in ProjectList: ~180ms
  const declineMatch = projectListCode.match(/handleDeclineEnquiry[\s\S]*?setTimeout\([\s\S]*?,\s*(\d+)\)/);
  assert.ok(declineMatch, 'handleDeclineEnquiry has timed tactile feedback');
  const declineDelay = parseInt(declineMatch[1], 10);
  assert.ok(declineDelay >= 150 && declineDelay <= 250, `Decline feedback delay (${declineDelay}ms) is within 150-250ms`);

  // Gig start in StudioInspector: ~180ms
  const gigMatch = studioInspectorCode.match(/handleTakeGig[\s\S]*?setTimeout\([\s\S]*?,\s*(\d+)\)/);
  assert.ok(gigMatch, 'handleTakeGig has timed tactile feedback');
  const gigDelay = parseInt(gigMatch[1], 10);
  assert.ok(gigDelay >= 150 && gigDelay <= 250, `Take gig delay (${gigDelay}ms) is within 150-250ms`);

  // Staff toggle in StudioInspector: ~180ms
  const staffMatch = studioInspectorCode.match(/handleToggleStaff[\s\S]*?setTimeout\([\s\S]*?,\s*(\d+)\)/);
  assert.ok(staffMatch, 'handleToggleStaff has timed tactile feedback');
  const staffDelay = parseInt(staffMatch[1], 10);
  assert.ok(staffDelay >= 150 && staffDelay <= 250, `Staff toggle delay (${staffDelay}ms) is within 150-250ms`);

  // Intervention delegation in ActiveProject: ~180ms
  const delegateMatch = activeProjectCode.match(/handleDelegateIntervention[\s\S]*?setTimeout\([\s\S]*?,\s*(\d+)\s*\);/);
  assert.ok(delegateMatch, 'handleDelegateIntervention has timed tactile feedback');
  const delegateDelay = parseInt(delegateMatch[1], 10);
  assert.ok(delegateDelay >= 150 && delegateDelay <= 250, `Delegate delay (${delegateDelay}ms) is within 150-250ms`);
});

test('Studio OS V2 Motion (#75) - Settlement & Milestone Gating', () => {
  const activeProjectCode = read('src/components/ActiveProject.tsx');
  const reviewModalCode = read('src/components/modals/ProjectReviewModal.tsx');
  const celebrationCode = read('src/components/ProjectCompletionCelebration.tsx');

  // ActiveProject milestone check: reserves full-screen celebration for Gold takes (Project carries no quality score; the old Platinum/score branches were dead)
  assert.match(activeProjectCode, /const isMilestone = verdict\.grade === 'Gold';/, 'Milestone check gates celebration on a Gold take');
  assert.match(activeProjectCode, /if \(isMilestone\) \{[\s\S]*?setShowCelebration\(true\);[\s\S]*?\} else \{[\s\S]*?onProjectComplete\?\.([\s\S]*?)\}/, 'Routine projects bypass full-screen celebration directly to review');

  // Review modal uses MotionNumber for compact deltas
  assert.match(reviewModalCode, /<MotionNumber value=\{report\.moneyGained\} prefix="\$" \/>/, 'ProjectReviewModal uses MotionNumber for money');
  assert.match(reviewModalCode, /<MotionNumber value=\{report\.reputationGained\} prefix="\+" \/>/, 'ProjectReviewModal uses MotionNumber for rep');

  // ProjectCompletionCelebration uses MotionPanel and MotionButton
  assert.match(celebrationCode, /<MotionPanel direction="scale"/, 'Celebration uses MotionPanel');
  assert.match(celebrationCode, /<MotionButton/, 'Celebration uses MotionButton');
});

test('Studio OS V2 Motion (#75) - No Infinite Bouncing or Pulsing in Studio OS Loop', () => {
  const studioRoomCode = read('src/components/StudioRoom.tsx');
  const activeProjectCode = read('src/components/ActiveProject.tsx');
  const contextDrawerCode = read('src/components/ContextDrawer.tsx');

  // StudioRoom must not contain animate-bounce or animate-pulse
  assert.doesNotMatch(studioRoomCode, /animate-bounce/, 'StudioRoom has no animate-bounce');
  assert.doesNotMatch(studioRoomCode, /animate-pulse/, 'StudioRoom has no animate-pulse');

  // ContextDrawer must not have continuous animation classes
  assert.doesNotMatch(contextDrawerCode, /animate-bounce|animate-pulse|animate-spin/, 'ContextDrawer has no infinite animations');

  // ActiveProject stage completion and gold streak must not have animate-bounce
  assert.doesNotMatch(activeProjectCode, /<div className="text-xl animate-bounce">🎉<\/div>/, 'Stage completion has no animate-bounce');
  assert.doesNotMatch(activeProjectCode, /GOLD STREAK!<\/span>[\s\S]*?animate-bounce/, 'Gold streak has no animate-bounce');
});

test('Studio OS V2 Motion (#75) - Reduced Motion Fallbacks', () => {
  const caps = resolveMotionCapabilities({
    osReducedMotion: true,
    graphicsPreset: 'high',
  });

  assert.equal(caps.reducedMotion, true, 'resolveMotionCapabilities sets reducedMotion when osReducedMotion is true');

  // getFilteredTransition under reduced motion must have duration 0
  const filtered = getFilteredTransition(
    { duration: 0.35 },
    caps.reducedMotion
  );
  assert.equal(filtered.duration, 0, 'Reduced-motion transition duration is 0');

  // Instant identity check for spring solver
  const start = evaluateSpringSettle(0, 100, 0);
  assert.equal(start.value, 0);
  assert.equal(start.isSettled, false);

  const equalTarget = evaluateSpringSettle(50, 50, 0);
  assert.equal(equalTarget.value, 50);
  assert.equal(equalTarget.isSettled, true);
});
