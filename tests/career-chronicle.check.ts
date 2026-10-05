import assert from 'node:assert/strict';
import { createDefaultGameState } from '../src/utils/newGameState';
import { deriveKnownFor, deriveCareerMilestones, resolveCareerTarget, topGenres, strongestSkill } from '../src/utils/careerChronicle';
import { deriveCareerCast, deriveSelectedCredits } from '../src/utils/careerChronicle';
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

// ---- Slice 2: chapters, pins, consequences ----
import { resolveChapterIndex, resolveCareerChapter, groupMilestonesByChapter, togglePinnedMoment, resolvePinnedMoments, deriveBranchConsequences } from '../src/utils/careerChronicle';
import { initializeStorylineState, getCampaignTreeForState } from '../src/narrative/branchingStorylineEngine';
{
  assert.equal(resolveCareerChapter(sparse).id, 'bedroom', 'sparse legacy save starts in the bedroom');
  assert.doesNotThrow(() => resolveChapterIndex(legacy));
  assert.doesNotThrow(() => groupMilestonesByChapter(legacy));
  assert.equal(resolveCareerChapter(played).id, 'real-studio', 'premises tier 1 outranks first clients');
  assert.equal(resolveChapterIndex({ ...played, premisesTier: 3 }), 6);
  const groups = groupMilestonesByChapter(played);
  assert.equal(groups[0].chapter.id, 'real-studio');
  assert.equal(groups[0].current, true);
  const flat = groups.flatMap((g) => g.milestones.map((m) => m.id)).sort();
  assert.deepEqual(flat, [...ids].sort(), 'every milestone lands in exactly one chapter');
  assert.deepEqual(groupMilestonesByChapter(played), groups, 'deterministic');

  let s = played;
  s = togglePinnedMoment(s, 'first-paid-session');
  assert.equal(played.pinnedMoments, undefined, 'immutable');
  assert.deepEqual(s.pinnedMoments, ['first-paid-session']);
  s = togglePinnedMoment(s, 'first-paid-session');
  assert.deepEqual(s.pinnedMoments, [], 'toggle unpins');
  for (const id of ['first-paid-session', 'first-repeat-client', 'first-poor-session', 'first-loyal-client']) s = togglePinnedMoment(s, id);
  assert.deepEqual(s.pinnedMoments, ['first-repeat-client', 'first-poor-session', 'first-loyal-client'], 'cap of 3 evicts oldest');
  assert.deepEqual(resolvePinnedMoments({ ...s, pinnedMoments: ['gone', 'first-loyal-client'] }).map((m) => m.id), ['first-loyal-client'], 'stale pins drop');

  assert.deepEqual(deriveBranchConsequences(played), []);
  const seeded = initializeStorylineState(played);
  const tree = getCampaignTreeForState(seeded);
  const withDilemma = tree.nodes.find((n) => n.branchDilemma)!;
  const opt = withDilemma.branchDilemma!.options[0];
  const withChoice: GameState = { ...seeded, storylineState: { ...seeded.storylineState!, branchHistory: [{ nodeId: withDilemma.id, chosenOptionId: opt.id, resolvedDay: 9, storyFlagGranted: opt.storyFlag }] } };
  const cons = deriveBranchConsequences(withChoice);
  assert.equal(cons.length, 1);
  assert.equal(cons[0].headline, `You chose: ${opt.label}`);
  assert.equal(cons[0].outcome, opt.consequences.narrativeOutcome);
}
{
  // #259 review: chart evidence must outlive the song leaving the chart.
  const charted: GameState = { ...base, chartRun: undefined, firstChart: { projectId: 'p1', title: 'Night Drive', chartName: 'Indie 40', peak: 7 } };
  assert.ok(resolveChapterIndex(charted) >= 4, 'chapter does not regress once the song exits');
  const pinned = resolvePinnedMoments({ ...charted, pinnedMoments: ['first-charting-release'] });
  assert.equal(pinned.length, 1);
  assert.match(pinned[0].detail, /Night Drive/);
  const later: GameState = { ...charted, chartRun: [{ projectId: 'p2', title: 'Other', chartName: 'Indie 40', quality: 50, position: 30, peak: 30, weeks: 1, lastUpdateDay: 1 }] };
  assert.match(resolvePinnedMoments({ ...later, pinnedMoments: ['first-charting-release'] })[0].detail, /Night Drive/, 'a later chart entry does not rewrite the pin');
}
console.log('career-chronicle slice 2 checks passed');
{
  // #259 slice 3: cast + selected credits.
  const mk = (id: string, name: string, tier: string, sessions: number, xp: number, refs = 0, releases: unknown[] = []) =>
    ({ clientId: id, clientName: name, primaryGenre: 'Rock', relationshipXp: xp, tier, sessionsCompleted: sessions, lastSessionDay: 1, bestQualityScore: 50, referralCount: refs, releases }) as never;
  const rel = (title: string, band: string, q: number, resolved = true) => ({ id: title, projectId: title, title, genre: 'Rock', qualityScore: q, releaseDay: 1, resolveDay: 2, outcomeBand: band, resolved });
  const state = {
    ...base,
    financials: { ...base.financials, reports: [rep('A', 'Rock', 50, 60), rep('B', 'Rock', 300, 90), rep('C', 'Pop', 10, 90)] },
    clientRelationships: {
      a: mk('a', 'Zed', 'Regular', 5, 10, 2),
      b: mk('b', 'Ann', 'Loyal', 3, 40, 0, [rel('Hit', 'breakthrough', 70), rel('Pending', 'prestige', 99, false)]),
      c: mk('c', 'Bo', 'Loyal', 3, 40),
    },
    hiredStaff: [{ ...(base.hiredStaff[0] ?? {}), id: 's1', name: 'Wes', role: 'Engineer', levelInRole: 3, xpInRole: 5 }, { id: 's2', name: 'Amy', role: 'Producer', levelInRole: 3, xpInRole: 9 }] as never,
    premisesTier: 1 as const,
  } as GameState;
  const cast = deriveCareerCast(state);
  const by = (id: string) => cast.find((c) => c.id === id);
  assert.equal(by('longest-client')?.name, 'Zed');
  assert.equal(by('loyal-artist')?.name, 'Ann', 'loyal tier only, tie on xp breaks by name');
  assert.equal(by('referrer')?.name, 'Zed');
  assert.equal(by('key-staff')?.name, 'Amy', 'higher xp wins at equal level');
  const credits = deriveSelectedCredits(state);
  const cr = (id: string) => credits.find((c) => c.id === id);
  assert.equal(cr('best-quality')?.title, 'B', 'earliest wins quality tie');
  assert.equal(cr('biggest-earner')?.title, 'B');
  assert.equal(cr('favourite-genre')?.title, 'Rock');
  assert.equal(cr('top-release')?.title, 'Hit', 'unresolved releases do not count');
  assert.ok(cr('premises'));
  assert.deepEqual(deriveCareerCast(state), cast, 'deterministic');
  const empty = { ...base, financials: { ...base.financials, reports: [] }, clientRelationships: undefined, hiredStaff: [], premisesTier: 0 as const } as GameState;
  assert.deepEqual(deriveCareerCast(empty), []);
  assert.deepEqual(deriveSelectedCredits(empty), []);
  assert.doesNotThrow(() => deriveSelectedCredits({ ...empty, financials: undefined } as unknown as GameState));
  console.log('career-chronicle slice 3 checks passed');
}
