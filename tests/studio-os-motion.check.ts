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

  // Floor dock / hotspots open single-purpose drawers — no in-drawer tab strip
  assert.doesNotMatch(contextDrawerCode, /role="tablist"/, 'ContextDrawer has no in-drawer tablist');
  assert.doesNotMatch(contextDrawerCode, /studio-drawer-tabs/, 'ContextDrawer has no drawer-tabs chrome');
  assert.match(contextDrawerCode, /key=\{panelKey\}/, 'ContextDrawer remounts MotionPanel per destination for open motion');
  assert.match(mainGameContentCode, /studio-command-dock/, 'Command dock remains the floor activity launcher');
});

test('Studio floor route consolidation - secondary panel tabs only', () => {
  const rightPanel = read('src/components/RightPanel.tsx');
  assert.match(rightPanel, /SECONDARY_TABS/, 'RightPanel keeps Skills/Recipes secondary tabs');
  assert.match(rightPanel, /aria-label="Skills and recipes"/, 'RightPanel secondary nav is labelled for Skills/Recipes');
  assert.doesNotMatch(rightPanel, /grid-cols-6/, 'RightPanel no longer mirrors the full dock as a 6-tab strip');
  assert.doesNotMatch(rightPanel, /Advance Day ❯/, 'Gear panel does not restate Advance Day (HUD + clock own it)');
  assert.doesNotMatch(rightPanel, /advanceDay/, 'RightPanel no longer takes advanceDay');
});

test('Studio OS V2 Motion (#75) - Enquiry Arrival & Peripheral Indication', () => {
  const studioRoomCode = read('src/components/StudioRoom.tsx');
  const projectListCode = read('src/components/ProjectList.tsx');
  const mainGameContentCode = read('src/components/MainGameContent.tsx');

  // Floating Enquiry/Go out/Promotion pills removed — diegetic door/phone/promo hotspots + dock remain
  assert.doesNotMatch(studioRoomCode, /Go out/, 'StudioRoom has no floating Go out pill');
  assert.doesNotMatch(studioRoomCode, />Enquiry</, 'StudioRoom has no floating Enquiry pill');
  assert.doesNotMatch(studioRoomCode, />Promotion</, 'StudioRoom has no floating Promotion pill');
  // #189: the phone opens a compact in-room offer card (StudioInspector); the drawer is the "Compare all enquiries" fallback.
  assert.doesNotMatch(studioRoomCode, /canonical === 'phone' && onBookings/, 'Phone hotspot no longer jumps to the bookings drawer');
  assert.match(fs.readFileSync(path.join(process.cwd(), 'src/components/StudioInspector.tsx'), 'utf8'), /Compare all enquiries/, 'Offer card links to the full enquiry list');
  assert.match(studioRoomCode, /canonical === 'console' \|\| canonical === 'liveRoom'/, 'Console and live room share the session work route');
  assert.match(studioRoomCode, /onConsoleFocus\(\)/, 'Live room / console open session via onConsoleFocus');
  assert.match(studioRoomCode, /setActiveInspector\(canonical\)/, 'Door/promotion hotspots still open StudioInspector');
  assert.doesNotMatch(
    studioRoomCode,
    /if \(id === 'console'\) \{ onConsoleFocus\(\); return; \}\s*if \(id === 'phone'/,
    'Live room is no longer routed past console-only session focus into the crew inspector',
  );

  const webglCode = read('src/components/WebGLCanvas.tsx');
  assert.match(webglCode, /onSelect\?\.\('liveRoom'\)/, 'Band character click fires liveRoom → session');

  // Command dock in MainGameContent must have unread count badge on bookings (peripheral indication)
  assert.match(mainGameContentCode, /id === 'bookings' && gameState\.availableProjects\.length > 0[\s\S]*?<MotionNumber value=\{gameState\.availableProjects\.length\} \/>/, 'Command dock has peripheral unread badge on bookings button');

  // Floor primary CTA stays for onboarding / session continue / collect release (floating Enquiry pill alone was removed)
  // Labels now come from the locale files (session_* keys), English text lives in en/common.json.
  const enStrings = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/locales/en/common.json'), 'utf8')) as Record<string, string>;
  assert.match(mainGameContentCode, /t\('session_book_first'\)/, 'Floor keeps Book-first-session primary CTA');
  assert.equal(enStrings.session_book_first, 'Book your first session');
  assert.match(mainGameContentCode, /t\('session_continue'\)/, 'Floor primary CTA covers Continue session');
  assert.equal(enStrings.session_continue, 'Continue session');
  assert.match(mainGameContentCode, /t\('session_collect_release'\)/, 'Floor primary CTA covers Collect release');
  assert.equal(enStrings.session_collect_release, 'Collect release');
  assert.match(mainGameContentCode, /studio-play-actions[\s\S]*?studio-primary-action[\s\S]*?studio-command-dock/, 'Floor primary CTA sits above the command dock');
  assert.match(mainGameContentCode, /studio-command-dock/, 'Command dock remains as secondary launcher');

  // ProjectList must use MotionReveal with stagger on enquiry cards
  assert.match(projectListCode, /<MotionReveal[\s\S]*?staggerIndex=\{index\}/, 'ProjectList animates enquiry cards with staggered MotionReveal');

  // Enquiry cards must use MotionNumber for fee, rep, duration
  assert.match(projectListCode, /<MotionNumber value=\{toLocalAmount\(project\.payoutBase, gameState\.cityId, gameState\.currentEra\)\} prefix=\{currencySymbol\(gameState\.cityId, gameState\.currentEra\)\} \/>/, 'ProjectList uses MotionNumber for fee');
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

  // Delegation commits immediately so closing the surface cannot leave a delayed reward.
  const delegateBody = activeProjectCode.slice(activeProjectCode.indexOf('const handleDelegateIntervention ='), activeProjectCode.indexOf('const handleSkipIntervention ='));
  assert.match(delegateBody, /claimVisibleOpportunity\(autoTriggeredMinigame\)/, 'Delegation claims the current visible opportunity');
  assert.match(delegateBody, /onMinigameReward\?\.\(/, 'Delegation commits through the existing reward authority');
  assert.doesNotMatch(delegateBody, /setTimeout/, 'Delegation never defers authoritative rewards');
  assert.match(delegateBody, /playSound\('reward'/, 'Delegation retains immediate tactile feedback');
});

test('Studio OS V2 Motion (#75) - Settlement & Milestone Gating', () => {
  const activeProjectCode = read('src/components/ActiveProject.tsx');
  const reviewModalCode = read('src/components/modals/ProjectReviewModal.tsx');
  const celebrationCode = read('src/components/ProjectCompletionCelebration.tsx');

  // ActiveProject milestone check: reserves full-screen celebration for Gold takes (Project carries no quality score; the old Platinum/score branches were dead)
  assert.match(activeProjectCode, /const isMilestone = presentation === 'panel' && verdict\.grade === 'Gold';/, 'Full-screen milestone celebration requires both deep panel presentation and a Gold take');
  assert.match(activeProjectCode, /if \(isMilestone\) \{[\s\S]*?setShowCelebration\(true\);[\s\S]*?\} else \{[\s\S]*?onProjectComplete\?\.([\s\S]*?)\}/, 'Routine projects bypass full-screen celebration directly to review');

  // Review modal uses MotionNumber for compact deltas
  assert.match(reviewModalCode, /<MotionNumber value=\{moneyValue\(report\.moneyGained\)\} prefix=\{moneySymbol\(\)\} \/>/, 'ProjectReviewModal uses MotionNumber for money');
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
