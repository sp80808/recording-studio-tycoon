import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createNewGameState } from '../src/utils/newGameState';
import {
  resolveProducerFeatureUnlocks, nextFeatureReveal, acknowledgeFeatureReveal, recordTechniqueProgress,
  isFeatureUnlocked, FEATURE_ORDER,
} from '../src/rpg/featureUnlocks';
import { createExperiencedProgress } from '../src/rpg/featureUnlocks';
import { telemetry } from '../src/telemetry/sink';
import { trackCareerStarted, trackFeatureUnlocks, trackFeatureUsed } from '../src/telemetry/instrument';
import { summarizeTrace } from '../src/telemetry/analyze';
import { exportLiveTrace } from '../src/telemetry/trace';
import type { GameState } from '../src/types/game';

const fresh = (): GameState => createNewGameState({ saveSeed: 1 });
const withSessions = (s: GameState, n: number, level = 1): GameState => ({
  ...s,
  playerData: { ...s.playerData, level },
  financials: { ...s.financials, reports: Array.from({ length: n }, (_, i) => ({ projectId: `p${i}` }) as never) },
});

describe('progressive technique unlocks (#260)', () => {
  it('new career hides Overdrive, Combo and Streak Bank', () => {
    const r = resolveProducerFeatureUnlocks(fresh());
    for (const f of FEATURE_ORDER) { assert.equal(r[f].unlocked, false); assert.ok(r[f].requirement.length > 0); }
    assert.equal(nextFeatureReveal(fresh()), null);
  });

  it('Overdrive needs sessions/level AND a Silver/Gold take; deterministic', () => {
    const s = withSessions(fresh(), 2);
    assert.equal(isFeatureUnlocked(s, 'overdrive'), false);
    const g = recordTechniqueProgress(s, { grade: 'Silver' });
    assert.equal(isFeatureUnlocked(g, 'overdrive'), true);
    assert.deepEqual(resolveProducerFeatureUnlocks(g), resolveProducerFeatureUnlocks(JSON.parse(JSON.stringify(g))));
    assert.equal(isFeatureUnlocked(recordTechniqueProgress(s, { grade: 'Bronze' }), 'overdrive'), false);
  });

  it('Combo unlocks deterministically at 4 sessions (level alone never skips the prerequisite)', () => {
    const od = (s: GameState) => recordTechniqueProgress(s, { grade: 'Gold' });
    assert.equal(isFeatureUnlocked(od(withSessions(fresh(), 3)), 'combo'), false);
    assert.equal(isFeatureUnlocked(od(withSessions(fresh(), 4)), 'combo'), true);
    assert.equal(isFeatureUnlocked(od(withSessions(fresh(), 2, 3)), 'combo'), false);
  });

  it('Streak Bank cannot unlock before Combo and needs a x3 combo after it', () => {
    let s = recordTechniqueProgress(withSessions(fresh(), 2), { grade: 'Gold', combo: 5 });
    assert.equal(s.featureProgress!.bestCombo, 0, 'combo before unlock is not counted');
    assert.equal(isFeatureUnlocked(s, 'streak-bank'), false);
    s = withSessions(s, 4);
    assert.equal(isFeatureUnlocked(s, 'combo'), true);
    assert.equal(isFeatureUnlocked(s, 'streak-bank'), false);
    s = recordTechniqueProgress(s, { combo: 3 });
    assert.equal(isFeatureUnlocked(s, 'streak-bank'), true);
  });

  it('crossing several thresholds queues reveals one at a time', () => {
    let s = recordTechniqueProgress(withSessions(fresh(), 9), { grade: 'Gold', combo: 3 });
    s = recordTechniqueProgress(s, { combo: 3 });
    const order: string[] = [];
    for (let i = 0; i < 5; i++) {
      const f = nextFeatureReveal(s);
      if (!f) break;
      order.push(f);
      s = acknowledgeFeatureReveal(s, f);
    }
    assert.deepEqual(order, ['overdrive', 'combo', 'streak-bank']);
    assert.equal(nextFeatureReveal(s), null);
  });

  it('reload keeps the feature and the acknowledgement; chronicle gets an entry', () => {
    let s = recordTechniqueProgress(withSessions(fresh(), 2), { grade: 'Gold' });
    s = acknowledgeFeatureReveal(s, 'overdrive');
    const reloaded = JSON.parse(JSON.stringify(s)) as GameState;
    assert.equal(isFeatureUnlocked(reloaded, 'overdrive'), true);
    assert.equal(nextFeatureReveal(reloaded), null);
    if (s.storylineState) assert.ok(s.storylineState.chronicle?.some((c) => c.title.includes('Overdrive')));
  });

  it('legacy progressed save keeps every technique and shows no reveal', () => {
    const legacy = withSessions(fresh(), 1);
    delete (legacy as Partial<GameState>).featureProgress;
    const r = resolveProducerFeatureUnlocks(legacy);
    for (const f of FEATURE_ORDER) { assert.equal(r[f].unlocked, true); assert.equal(r[f].newlyUnlocked, false); }
    const after = recordTechniqueProgress(legacy, { combo: 1 });
    for (const f of FEATURE_ORDER) assert.equal(isFeatureUnlocked(after, f), true, 'materialised save still keeps it');
  });

  it('legacy save with zero progress is treated as a new career', () => {
    const legacy = fresh();
    delete (legacy as Partial<GameState>).featureProgress;
    assert.equal(isFeatureUnlocked(legacy, 'overdrive'), false);
  });

  it('console wiring: controls and shortcuts are gated on the resolver', () => {
    const src = readFileSync('src/components/ActiveProject.tsx', 'utf8');
    assert.match(src, /overdriveUnlocked && <div/);
    assert.match(src, /streakBankUnlocked && \(\s*<StreakBankControl/);
    assert.match(src, /if \(!gameState\.activeProject \|\| !overdriveUnlocked\) return;/);
    assert.match(src, /overdriveUnlocked && \(availableEnergy >= 2/);
    const work = readFileSync('src/hooks/useStageWork.tsx', 'utf8');
    assert.match(work, /isFeatureUnlocked\(gameState, 'overdrive'\)/);
    assert.match(work, /isFeatureUnlocked\(gameState, 'combo'\)/);
  });

  it('Experienced Producer start grandfathers every technique with no reveal, economy unchanged', () => {
    const std = fresh();
    const exp = createNewGameState({ saveSeed: 1, experiencedProducer: true });
    const r = resolveProducerFeatureUnlocks(exp);
    for (const f of FEATURE_ORDER) { assert.equal(r[f].unlocked, true); assert.equal(r[f].newlyUnlocked, false); }
    assert.equal(nextFeatureReveal(exp), null);
    assert.deepEqual(exp.featureProgress, createExperiencedProgress());
    assert.equal(exp.money, std.money);
    assert.equal(exp.premisesTier, std.premisesTier);
    // survives a later progress write and a reload
    const after = JSON.parse(JSON.stringify(recordTechniqueProgress(exp, { combo: 2 }))) as GameState;
    for (const f of FEATURE_ORDER) assert.equal(isFeatureUnlocked(after, f), true);
    for (const f of FEATURE_ORDER) assert.equal(isFeatureUnlocked(std, f), false, 'standard start stays gated');
  });

  it('career start screen exposes the option and Index passes it through', () => {
    assert.match(readFileSync('src/components/CareerStartScreen.tsx', 'utf8'), /data-testid="experienced-producer"/);
    assert.match(readFileSync('src/pages/Index.tsx', 'utf8'), /experiencedProducer: producer\?\.experienced === true/);
  });

  it('playtest metrics: unlock timing, one-at-a-time reveals and use within 2 sessions', () => {
    telemetry.startRun(1);
    trackCareerStarted(fresh(), false);
    const early = recordTechniqueProgress(withSessions(fresh(), 2), { grade: 'Gold' });
    trackFeatureUnlocks({ ...early, currentDay: 3 });
    trackFeatureUnlocks({ ...early, currentDay: 4 }); // idempotent
    trackFeatureUsed(5, 'overdrive');
    const later = recordTechniqueProgress(withSessions(early, 4), { grade: 'Gold' });
    trackFeatureUnlocks({ ...later, currentDay: 9 });
    const sum = summarizeTrace(exportLiveTrace(telemetry));
    assert.equal(sum.startOption, 'standard');
    assert.deepEqual(Object.keys(sum.featureUnlocks), ['overdrive', 'combo']);
    assert.equal(sum.featureUnlocks.overdrive.sessions, 2);
    assert.equal(sum.featureUnlocks.combo.sessions, 4);
    assert.equal(sum.featureUnlocks.overdrive.usedWithin2Sessions, true);
    assert.equal(sum.featureUnlocks.combo.usedWithin2Sessions, false);
    assert.equal(sum.maxUnlocksPerDay, 1);
    // experienced careers never emit unlock events
    telemetry.startRun(2);
    trackFeatureUnlocks(createNewGameState({ saveSeed: 2, experiencedProducer: true }));
    assert.deepEqual(summarizeTrace(exportLiveTrace(telemetry)).featureUnlocks, {});
  });
});
