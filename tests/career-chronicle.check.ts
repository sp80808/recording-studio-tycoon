import assert from 'node:assert/strict';
import { createDefaultGameState } from '../src/utils/newGameState';
import { deriveKnownFor, deriveCareerMilestones, resolveCareerTarget, topGenres, strongestSkill } from '../src/utils/careerChronicle';
import type { GameState } from '../src/types/game';

const base = createDefaultGameState();

// Sparse / legacy state degrades gracefully.
const sparse = { ...base, financials: { ...base.financials, reports: [] }, clientRelationships: undefined, chartRun: undefined, hiredStaff: [] } as GameState;
assert.equal(deriveKnownFor(sparse).parts.length >= 1, true);
assert.deepEqual(deriveCareerMilestones({ ...sparse, premisesTier: 0, studioRooms: [], storylineState: undefined }), []);
const legacy = { ...sparse, financials: undefined } as unknown as GameState;
assert.doesNotThrow(() => deriveKnownFor(legacy));
assert.doesNotThrow(() => deriveCareerMilestones(legacy));

const rep = (title: string, genre: string, money: number, q: number) =>
  ({ projectId: title, projectTitle: title, overallQualityScore: q, moneyGained: money, reputationGained: 1, playerManagementXpGained: 0, skillBreakdown: [], reviewSnippet: '', assignedPerson: { type: 'player', id: 'p', name: 'P' }, genre }) as GameState['financials']['reports'][number];

const played: GameState = {
  ...base,
  playerData: { ...base.playerData, playstyle: 'purist', skills: { ...base.playerData.skills, mixing: { xp: 0, level: 4, xpToNextLevel: 100 } } },
  financials: { ...base.financials, reports: [rep('A', 'Rock', 0, 30), rep('B', 'Rock', 120, 70), rep('C', 'Pop', 90, 80)] },
  clientRelationships: {
    c1: { clientId: 'c1', clientName: 'Mira', primaryGenre: 'Rock', relationshipXp: 90, tier: 'Loyal', sessionsCompleted: 3, lastSessionDay: 5, bestQualityScore: 80, referralCount: 0 },
  },
  premisesTier: 1,
  hiredStaff: [],
  chartRun: undefined,
  storylineState: undefined,
  studioRooms: base.studioRooms.map((r, i) => ({ ...r, unlocked: i === 0 })),
};
const kf = deriveKnownFor(played);
assert.equal(kf.line, 'Known for: rock sessions · mixing (Lv 4) · 1 loyal client');
assert.deepEqual(deriveKnownFor(played), kf, 'deterministic');
assert.deepEqual(topGenres(played, 2), ['Rock', 'Pop']);
assert.equal(strongestSkill(played)?.key, 'mixing');

const ids = deriveCareerMilestones(played).map((m) => m.id);
assert.deepEqual(ids, ['first-paid-session', 'first-repeat-client', 'first-poor-session', 'first-premises-move', 'first-loyal-client']);
// Routine session volume never floods the list.
const many = { ...played, financials: { ...played.financials, reports: Array.from({ length: 200 }, (_, i) => rep(`S${i}`, 'Rock', 50, 70)) } };
assert.ok(deriveCareerMilestones(many).length <= 10);

// Career target is always present.
const target = resolveCareerTarget(played);
assert.ok(target.label.length > 0 && target.detail.length > 0);
assert.doesNotThrow(() => resolveCareerTarget({ ...base, storylineState: undefined }));
console.log('career chronicle derivations passed');
