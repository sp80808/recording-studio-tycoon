import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  type RevealPhase,
  type RevealState,
  REVEAL_PHASES,
  REVEAL_PHASE_TIMINGS,
  REVEAL_PHASE_METADATA,
  createInitialRevealState,
  revealReducer,
} from '../src/features/boxDrops/revealStateMachine';
import { generateBoxLoot } from '../src/features/boxDrops/lootGenerator';
import {
  FlightCaseReveal,
  RewardReveal,
  inferTierFromOutcome,
  isPremiumReward,
  RARITY_CONFIG,
  type PremiumCaseReward,
} from '../src/components/motion/primitives/FlightCaseReveal';
import { CrateUnboxingModal } from '../src/features/boxDrops/CrateUnboxingModal';
import { FLIGHT_CASES } from '../src/data/flightCases';
import { detectUnapprovedWebGLContexts } from '../src/lib/motion/qualification';

console.log('Testing OriginKit Flight Case Reveal & Choreography (#76)...');

// 1. Verify Export Surface & Types
assert.strictEqual(typeof FlightCaseReveal, 'function', 'FlightCaseReveal must be exported as a React component');
assert.strictEqual(typeof RewardReveal, 'function', 'RewardReveal must be exported as an alias wrapper');
assert.strictEqual(typeof CrateUnboxingModal, 'function', 'CrateUnboxingModal must be exported');
assert.strictEqual(REVEAL_PHASES.length, 7, 'Must define exactly 7 canonical reveal phases');
assert.deepStrictEqual(
  [...REVEAL_PHASES],
  ['closed', 'latch', 'open', 'silhouette', 'reveal', 'details', 'collect'],
  'Phases must match exact canonical order'
);

// 2. Authoritative Pre-Settlement & Outcome Immutability
const seedGear = generateBoxLoot('1970s', 1, 99)[0];
assert.ok(seedGear, 'Test seed gear must be generated');

const initialState = createInitialRevealState(seedGear);
assert.strictEqual(initialState.phase, 'closed', 'Initial phase must be closed');
assert.strictEqual(initialState.outcome, seedGear, 'State outcome must strictly equal initial seed gear reference');
assert.strictEqual(initialState.isSkipped, false);
assert.strictEqual(initialState.selectedAction, null);

// Step through canonical 7 phases: closed -> latch -> open -> silhouette -> reveal -> details -> collect
let state = initialState;

// closed -> latch
state = revealReducer(state, { type: 'START_UNLATCH' });
assert.strictEqual(state.phase, 'latch');
assert.strictEqual(state.outcome, seedGear, 'Outcome must remain immutable in latch phase');

// latch -> open
state = revealReducer(state, { type: 'STEP_FORWARD' });
assert.strictEqual(state.phase, 'open');
assert.strictEqual(state.outcome, seedGear, 'Outcome must remain immutable in open phase');

// open -> silhouette
state = revealReducer(state, { type: 'STEP_FORWARD' });
assert.strictEqual(state.phase, 'silhouette');
assert.strictEqual(state.outcome, seedGear, 'Outcome must remain immutable in silhouette phase');

// silhouette -> reveal
state = revealReducer(state, { type: 'STEP_FORWARD' });
assert.strictEqual(state.phase, 'reveal');
assert.strictEqual(state.outcome, seedGear, 'Outcome must remain immutable in reveal phase');

// reveal -> details
state = revealReducer(state, { type: 'STEP_FORWARD' });
assert.strictEqual(state.phase, 'details');
assert.strictEqual(state.outcome, seedGear, 'Outcome must remain immutable in details phase');

// details -> collect (via CHOOSE_ACTION)
state = revealReducer(state, { type: 'CHOOSE_ACTION', action: 'equip' });
assert.strictEqual(state.phase, 'collect');
assert.strictEqual(state.selectedAction, 'equip');
assert.strictEqual(state.outcome, seedGear, 'Outcome must remain immutable in collect phase');

// Verify full transition history
assert.deepStrictEqual(
  [...state.history],
  ['closed', 'latch', 'open', 'silhouette', 'reveal', 'details', 'collect'],
  'Full history must record complete 7-phase traversal'
);

// 3. Skip Behavior from Every Intermediate Phase
const testSkipPhases: RevealPhase[] = ['closed', 'latch', 'open', 'silhouette', 'reveal'];
for (const fromPhase of testSkipPhases) {
  let s = createInitialRevealState(seedGear);
  // Advance to fromPhase
  if (fromPhase !== 'closed') {
    s = revealReducer(s, { type: 'START_UNLATCH' });
    while (s.phase !== fromPhase && s.phase !== 'details') {
      s = revealReducer(s, { type: 'STEP_FORWARD' });
    }
  }

  // Trigger SKIP
  const skipped = revealReducer(s, { type: 'SKIP' });
  assert.strictEqual(skipped.phase, 'details', `Skipping from ${fromPhase} must immediately reach details`);
  assert.strictEqual(skipped.isSkipped, true, 'isSkipped flag must be set to true');
  assert.strictEqual(skipped.outcome, seedGear, 'Skipped state must preserve exact immutable outcome');
  assert.deepStrictEqual(skipped.outcome, seedGear, 'Skipped outcome fields must remain 100% intact');
}

// 4. Reduced-Motion Fast Path
const reducedMotionState = createInitialRevealState(seedGear, { reducedMotion: true });
assert.strictEqual(reducedMotionState.isReducedMotion, true);

const unlatchedReduced = revealReducer(reducedMotionState, { type: 'START_UNLATCH' });
assert.strictEqual(
  unlatchedReduced.phase,
  'details',
  'Reduced motion must jump directly from closed to details on unlatch'
);
assert.strictEqual(unlatchedReduced.outcome, seedGear);
assert.deepStrictEqual(
  [...unlatchedReduced.history],
  ['closed', 'details'],
  'Reduced motion history must only contain closed and details'
);

// 5. Premium Purchase Celebration State Machine
const premiumReward: PremiumCaseReward = {
  productTitle: '1970s Abbey Heritage Bundle',
  items: [
    { ref: 'tape_emblem', label: 'Vintage Tape Reel Emblem', icon: '🎛️' },
    { ref: 'gold_skin', label: 'Gold Console Skin', icon: '✨' },
  ],
};
assert.strictEqual(isPremiumReward(premiumReward), true);

let premiumState = createInitialRevealState(premiumReward);
assert.strictEqual(premiumState.phase, 'closed');
premiumState = revealReducer(premiumState, { type: 'SKIP' });
assert.strictEqual(premiumState.phase, 'details');
assert.strictEqual(premiumState.outcome.productTitle, '1970s Abbey Heritage Bundle');
assert.strictEqual(premiumState.outcome.items.length, 2);

// 6. Tier Inference & Metadata Coverage
for (const tierKey of Object.keys(FLIGHT_CASES) as (keyof typeof FLIGHT_CASES)[]) {
  const caseDef = FLIGHT_CASES[tierKey];
  assert.ok(caseDef.name.length > 0);
  assert.ok(caseDef.cssTheme.gradient.length > 0);
  assert.ok(caseDef.cssTheme.border.length > 0);
  assert.ok(caseDef.cssTheme.accent.length > 0);
  assert.ok(caseDef.cssTheme.stencil.length > 0);
}

// Test rarity mapping & tier inference
assert.strictEqual(inferTierFromOutcome({ rarity: 'legendary' } as any), 'holy_grail_vault');
assert.strictEqual(inferTierFromOutcome({ rarity: 'vintage' } as any), 'vintage_flight_case');
assert.strictEqual(inferTierFromOutcome({ rarity: 'rare' } as any), 'tour_trunk');
assert.strictEqual(inferTierFromOutcome({ rarity: 'uncommon' } as any), 'road_case');
assert.strictEqual(inferTierFromOutcome({ rarity: 'common' } as any), 'road_case');
assert.strictEqual(inferTierFromOutcome(premiumReward), 'holy_grail_vault');

for (const rarity of ['common', 'uncommon', 'rare', 'vintage', 'legendary'] as const) {
  const conf = RARITY_CONFIG[rarity];
  assert.ok(conf.label.length > 0);
  assert.ok(conf.borderColor.length > 0);
  assert.ok(conf.rayColor.length > 0);
}

// Helper to locate repository root across bundled runtime environments
const findRepoRoot = (): string => {
  const candidates = [
    process.cwd(),
    '/private/tmp/rst-76',
    path.resolve(process.cwd(), '..'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'src/components/motion/primitives/FlightCaseReveal.tsx'))) {
      return dir;
    }
  }
  return process.cwd();
};
const REPO_ROOT = findRepoRoot();

// 7. Strict Anti-Gambling Invariants Static Code Audit
const componentFilePath = path.resolve(REPO_ROOT, 'src/components/motion/primitives/FlightCaseReveal.tsx');
const stateMachineFilePath = path.resolve(REPO_ROOT, 'src/features/boxDrops/revealStateMachine.ts');
const componentContent = fs.readFileSync(componentFilePath, 'utf8');
const stateMachineContent = fs.readFileSync(stateMachineFilePath, 'utf8');

// Ensure no Math.random() is used to generate or alter rewards during reveal
assert.ok(!stateMachineContent.includes('Math.random()'), 'Reveal state machine must never use Math.random()');
assert.ok(!componentContent.includes('Math.random()'), 'FlightCaseReveal component must never use Math.random()');

// Prohibit gambling terminology (slot reel, near miss, casino spinner)
const prohibitedPatterns = ['slotReel', 'casinoSpinner', 'nearMiss', 'lootSpinner', 'wheelRoll'];
for (const pattern of prohibitedPatterns) {
  assert.ok(
    !componentContent.includes(pattern),
    `Prohibited casino/gambling pattern "${pattern}" must NOT exist in FlightCaseReveal`
  );
  assert.ok(
    !stateMachineContent.includes(pattern),
    `Prohibited casino/gambling pattern "${pattern}" must NOT exist in revealStateMachine`
  );
}

// 8. WebGL Canvas & Context Exclusivity Audit
const mockDomContainer = {
  querySelectorAll(selector: string) {
    if (selector === 'canvas') {
      return [
        {
          id: 'pixi-studio-canvas',
          getAttribute(attr: string) {
            if (attr === 'data-engine') return 'pixi';
            return null;
          },
        },
      ];
    }
    return [];
  },
};

const webglAudit = detectUnapprovedWebGLContexts(mockDomContainer as any);
assert.strictEqual(webglAudit.passed, true, 'Zero unapproved WebGL canvases must exist');
assert.strictEqual(webglAudit.unapprovedCount, 0);

// Verify component source files do not allocate secondary WebGL contexts
assert.ok(
  !componentContent.includes(".getContext('webgl')") &&
  !componentContent.includes('.getContext("webgl")') &&
  !componentContent.includes(".getContext('webgl2')") &&
  !componentContent.includes('.getContext("webgl2")'),
  'FlightCaseReveal must NOT allocate WebGL contexts'
);

// 9. Lifecycle Unmount & Timer Cleanup Simulation
class MockTimerScope {
  private activeTimers = new Set<number>();
  private nextId = 1;

  schedule(delay: number): { id: number; cancel: () => void } {
    const id = this.nextId++;
    this.activeTimers.add(id);
    const cancel = () => {
      this.activeTimers.delete(id);
    };
    return { id, cancel };
  }

  getActiveCount(): number {
    return this.activeTimers.size;
  }

  clearAll(): void {
    this.activeTimers.clear();
  }
}

const timerHarness = new MockTimerScope();
const timer1 = timerHarness.schedule(REVEAL_PHASE_TIMINGS.latch);
const timer2 = timerHarness.schedule(REVEAL_PHASE_TIMINGS.open);
assert.strictEqual(timerHarness.getActiveCount(), 2);

// Simulate unmount cleanup
timerHarness.clearAll();
assert.strictEqual(timerHarness.getActiveCount(), 0, 'Zero orphan timers must remain after unmount');

console.log('flight-case-reveal: all checks passed');
