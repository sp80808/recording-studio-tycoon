import assert from 'node:assert/strict';
import type { Project, SessionIntervention } from '../src/types/game';
import { createNewGameState } from '../src/utils/newGameState';
import fs from 'node:fs';
import {
  PLAYBACK_HOLD_MS,
  artistPresenceAt,
  deriveDepartureBeat,
  deriveSessionBeat,
  isRoutineBeat,
} from '../src/session/sessionBeat';
import { CLIENT_ENTER_MS, CLIENT_EXIT_MS } from '../src/components/studio/clientDoorTransit';

const initial = createNewGameState({ cityId: 'london', selectedEra: 'classic_rock' });
const seed = initial.availableProjects[0];

const projectAt = (stageName: string, workUnitsCompleted = 0): Project => ({
  ...seed,
  id: 'first-paid-session',
  currentStageIndex: 0,
  awaitingReview: false,
  stages: [{
    stageName,
    focusAreas: ['performance'],
    workUnitsBase: 10,
    workUnitsCompleted,
    completed: false,
  }],
});

const interventionFor = (project: Project, stageIndex = project.currentStageIndex): SessionIntervention => ({
  id: 'intervention:first-paid-session:0:1',
  projectId: project.id,
  stageIndex,
  type: 'vocal',
  reason: 'Move the singer closer to the mic.',
  priority: 10,
  expiresAt: 1_000_000,
});

const fresh = projectAt('Digging');
assert.equal(deriveSessionBeat(fresh).beat, 'setup', 'fresh non-recording work starts with setup');
assert.equal(deriveSessionBeat(projectAt('Tracking')).beat, 'soundcheck', 'fresh tracking starts at soundcheck');

for (const stageName of ['Digging', 'Sampling', 'Sound Design']) {
  const beat = deriveSessionBeat(projectAt(stageName, 2));
  assert.equal(beat.beat, 'recording', `${stageName} reflects actual work instead of remaining in setup`);
  assert.equal(beat.primaryAction, 'lock');
  assert.equal(beat.primaryTarget, 'console');
}

const pendingProject = projectAt('Sampling', 2);
const pending = deriveSessionBeat(pendingProject, interventionFor(pendingProject));
assert.equal(pending.beat, 'decision');
assert.equal(pending.primaryAction, 'resolve');
assert.equal(pending.primaryTarget, 'mic');
assert.equal(pending.detail, 'Move the singer closer to the mic.');

const stale = deriveSessionBeat(pendingProject, interventionFor(pendingProject, 1));
assert.equal(stale.beat, 'recording', 'an intervention from another stage does not hijack the current beat');

const awaiting = { ...projectAt('Mastering', 10), awaitingReview: true };
assert.equal(deriveSessionBeat(awaiting).beat, 'wrap');
assert.equal(deriveSessionBeat({
  ...projectAt('Sound Design', 10),
  stages: [{ ...projectAt('Sound Design', 10).stages[0], completed: true }],
}).beat, 'wrap', 'fully completed work wraps even before awaitingReview migration catches up');

assert.equal(deriveSessionBeat(projectAt('Mixing', 3)).beat, 'playback');
assert.equal(deriveSessionBeat(projectAt('Mastering', 3)).beat, 'playback');

// ---- Presentation checkpoints (#196): arrival, playback-after-take, departure ----
const tracking = projectAt('Tracking', 2);
const arriving = deriveSessionBeat(fresh, null, { artistPresence: 'entering' });
assert.equal(arriving.beat, 'arrival', 'an artist walking in is an arrival beat');
assert.equal(arriving.primaryTarget, 'door');
assert.equal(arriving.primaryAction, undefined, 'arrival asks nothing of the player');
assert.equal(deriveSessionBeat(fresh, null, { artistPresence: 'present' }).beat, 'setup', 'present artist leaves the stage-derived beat alone');
assert.equal(deriveSessionBeat(fresh, null, {}).beat, deriveSessionBeat(fresh).beat, 'empty context equals project-only behaviour');

for (const grade of ['Gold', 'Silver', 'Solid'] as const) {
  const listening = deriveSessionBeat(tracking, null, { takeJustLocked: grade });
  assert.equal(listening.beat, 'playback', `${grade} take opens a listen-back beat`);
  assert.equal(listening.primaryTarget, 'artist');
  assert.ok(listening.detail.length > 10);
}
assert.notEqual(
  deriveSessionBeat(tracking, null, { takeJustLocked: 'Gold' }).detail,
  deriveSessionBeat(tracking, null, { takeJustLocked: 'Solid' }).detail,
  'the room reacts differently to a Gold take than a Solid one',
);

// Priority: wrap > arrival > decision > playback > stage-derived.
const decisionProject = projectAt('Sampling', 2);
const decision = deriveSessionBeat(decisionProject, interventionFor(decisionProject), { takeJustLocked: 'Gold' });
assert.equal(decision.beat, 'decision', 'a pending decision outranks the listen-back beat');
assert.ok(decision.attentionReason, 'decisions carry an attention reason');
assert.equal(deriveSessionBeat(awaiting, null, { artistPresence: 'entering', takeJustLocked: 'Gold' }).beat, 'wrap', 'wrap outranks everything');
assert.equal(deriveSessionBeat(decisionProject, interventionFor(decisionProject), { artistPresence: 'entering' }).beat, 'arrival', 'arrival outranks a decision (the artist has not sat down yet)');

// Departure: the project is gone from state; the beat survives from the remembered client.
const leaving = deriveDepartureBeat({ id: 'p1', clientName: 'The Wild Tides', clientType: 'Independent' });
assert.equal(leaving.beat, 'departure');
assert.equal(leaving.primaryTarget, 'door');
assert.match(leaving.detail, /The Wild Tides/);

// Presence windows mirror the Pixi door transit.
const at = (start: number | null, end: number | null, now: number, reduceMotion = false) => artistPresenceAt({ sessionStartedAt: start, sessionEndedAt: end, now, reduceMotion });
assert.equal(at(1000, null, 1000 + CLIENT_ENTER_MS - 1), 'entering');
assert.equal(at(1000, null, 1000 + CLIENT_ENTER_MS), 'present');
assert.equal(at(1000, 5000, 5000 + CLIENT_EXIT_MS - 1), 'leaving');
assert.equal(at(1000, 5000, 5000 + CLIENT_EXIT_MS), 'offsite');
assert.equal(at(null, null, 123), 'offsite');
assert.equal(at(1000, null, 1001, true), 'present', 'reduced motion snaps in');
assert.equal(at(1000, 5000, 5001, true), 'offsite', 'reduced motion snaps out');
assert.ok(PLAYBACK_HOLD_MS >= 1500 && PLAYBACK_HOLD_MS <= 4000, 'listen-back is a beat, not a wait');

// Routine beats can be hidden once learned; moments that need the player cannot.
assert.equal(isRoutineBeat(deriveSessionBeat(fresh)), true);
assert.equal(isRoutineBeat(deriveSessionBeat(tracking)), true);
assert.equal(isRoutineBeat(decision), false);
assert.equal(isRoutineBeat(arriving), false);
assert.equal(isRoutineBeat(deriveSessionBeat(awaiting)), false);

// Reload reconstruction: the beat is a pure function of persisted state + wall clock, so a saved mid-session
// project always lands on a valid beat with no duplicated presentation state.
const reloaded = JSON.parse(JSON.stringify(tracking)) as Project;
assert.deepEqual(deriveSessionBeat(reloaded), deriveSessionBeat(tracking));

// Banner wiring: always mounted (so departure can play), flat design language, hides routine beats after onboarding.
const banner = fs.readFileSync('src/components/studio/SessionBeatBanner.tsx', 'utf8');
const main = fs.readFileSync('src/components/MainGameContent.tsx', 'utf8');
assert.match(main, /<SessionBeatBanner project=\{project \?\? null\}/);
assert.match(main, /showRoutine=\{/);
assert.ok(!/gradient|shadow-\[0_0_8px/.test(banner), 'banner is flat');
assert.ok(!/text-amber|border-amber/.test(banner), 'banner uses the palette tokens');

console.log('session beat check passed');
