import assert from 'node:assert/strict';
import { advanceInterventionCheckpoint, resolveIntervention, FIRST_SESSION_OFFER_MS, INTERVENTION_OFFER_MS } from '../src/session/interventionCheckpoint';
import { createNewGameState } from '../src/utils/newGameState';
import { GIG_TEMPLATES } from '../src/data/gigTemplates';
import type { Project } from '../src/types/game';

// #340/#347: exhaustive over templates x seeds x pacing, a first Easy session must be offered an
// intervention by the end of ~8 takes, deterministically, and never re-rolled for the same inputs.
const base = createNewGameState({ cityId: 'london', selectedEra: 'classic_rock' });
type Tpl = { genre: string; difficulty: number; baseStages: Array<{ stageName: string; focusAreas: string[]; workUnitsBase: number }> };
const templates = (GIG_TEMPLATES as unknown as Tpl[]).filter(t => t.difficulty <= 2);
assert.ok(templates.length > 5, 'have Easy templates to sweep');

const run = (id: string, level: number, t: Tpl, stageAt: (take: number) => number, step: number) => {
  let p = { ...base.availableProjects[0], id, genre: t.genre, difficulty: 1, currentStageIndex: 0, workSessionCount: 0,
    stages: t.baseStages.map(s => ({ ...s, workUnitsCompleted: 0, completed: false })), interventionCheckpoint: undefined, resolvedInterventionStageKeys: [],
    focusAllocation: { performance: 34, soundCapture: 33, layering: 33 } } as unknown as Project;
  let firstOfferTake = -1;
  for (let take = step; take <= 8 && firstOfferTake < 0; take += step) {
    const idx = Math.min(stageAt(take), p.stages.length - 1);
    p = { ...p, currentStageIndex: idx, workSessionCount: take,
      stages: p.stages.map((s, i) => ({ ...s, completed: i < idx, workUnitsCompleted: i === idx ? Math.floor(s.workUnitsBase * 0.3) : s.workUnitsCompleted })) };
    p = advanceInterventionCheckpoint(p, { ...base, playerData: { ...base.playerData, level } }, 1000);
    if (p.interventionCheckpoint?.pending) firstOfferTake = take;
  }
  return { p, firstOfferTake };
};

const paces: Array<[string, (k: number) => number, number]> = [
  ['single stage', () => 0, 1], ['stage per 2 takes', k => Math.floor((k - 1) / 2), 1], ['stage per take', k => k - 1, 1], ['skipping takes', () => 0, 2],
];
let n = 0;
for (const t of templates) for (let seed = 0; seed < 40; seed++) {
  const id = `proj-${seed}-${t.genre}`;
  for (const level of [1, 2, 3]) for (const [label, stageAt, step] of paces) {
    const a = run(id, level, t, stageAt, step), b = run(id, level, t, stageAt, step);
    assert.ok(a.firstOfferTake > 0, `Easy first session offers an intervention within 8 takes (${t.genre} ${t.baseStages[0].stageName} L${level} ${label} seed ${seed})`);
    assert.deepEqual(a.p.interventionCheckpoint, b.p.interventionCheckpoint, 'deterministic for same seed');
    assert.equal(advanceInterventionCheckpoint(a.p, { ...base, playerData: { ...base.playerData, level } }, 1000), a.p, 'pure: re-examining an offered bucket is a no-op');
    const offer = a.p.interventionCheckpoint!.pending!;
    if (a.firstOfferTake >= 3 && offer.expiresAt - 1000 === FIRST_SESSION_OFFER_MS) assert.ok(FIRST_SESSION_OFFER_MS > INTERVENTION_OFFER_MS, 'gentle first offer outlasts a normal one');
    assert.ok([FIRST_SESSION_OFFER_MS, INTERVENTION_OFFER_MS].includes(offer.expiresAt - 1000), 'offer expires on a known window');
    const done = resolveIntervention(a.p, a.p.interventionCheckpoint!.pending!.id);
    assert.equal(done.interventionCheckpoint?.pending, null);
    n++;
  }
}
console.log(`first-session Easy intervention guaranteed across ${n} template/seed/pace combinations`);
assert.ok(FIRST_SESSION_OFFER_MS > INTERVENTION_OFFER_MS);
