import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createDefaultGameState } from '../src/utils/newGameState';
import { currentEarnedTitle, deriveEarnedTitles, deriveKeepsakes, MILESTONE_TITLES } from '../src/utils/careerRewards';
import { deriveCareerMilestones } from '../src/utils/careerChronicle';
import { PRODUCER_COSMETICS, STUDIO_FURNISHINGS, syncCustomizationUnlocks } from '../src/rpg/studioCustomization';
import type { GameState } from '../src/types/game';

const base = createDefaultGameState();
const sparse = { ...base, financials: { ...base.financials, reports: [] }, clientRelationships: undefined, chartRun: undefined, hiredStaff: [], storylineState: undefined } as GameState;

// Sparse and legacy saves earn nothing and never throw.
assert.deepEqual(deriveEarnedTitles({ ...sparse, premisesTier: 0, studioRooms: [] }), []);
assert.equal(currentEarnedTitle({ ...sparse, premisesTier: 0, studioRooms: [] }), null);
assert.deepEqual(deriveKeepsakes({ ...sparse, premisesTier: 0, studioRooms: [] }), []);
assert.doesNotThrow(() => deriveEarnedTitles({ ...sparse, financials: undefined } as unknown as GameState));

const rep = (title: string, money: number, q: number) =>
  ({ projectId: title, projectTitle: title, overallQualityScore: q, moneyGained: money, reputationGained: 1, playerManagementXpGained: 0, skillBreakdown: [], reviewSnippet: '', assignedPerson: { type: 'player', id: 'p', name: 'P' }, genre: 'Rock' }) as GameState['financials']['reports'][number];

const played: GameState = {
  ...sparse,
  financials: { ...base.financials, reports: [rep('Demo', 100, 70)] },
  clientRelationships: { c1: { clientId: 'c1', clientName: 'Mira', primaryGenre: 'Rock', relationshipXp: 90, tier: 'Loyal', sessionsCompleted: 3, lastSessionDay: 5, bestQualityScore: 80, referralCount: 0 } },
  premisesTier: 1,
  studioRooms: base.studioRooms.map((r, i) => ({ ...r, unlocked: i === 0 })),
};

// Titles follow milestone order; the latest is the current title.
const titles = deriveEarnedTitles(played);
assert.deepEqual(titles.map((t) => t.id), deriveCareerMilestones(played).map((m) => m.id));
assert.equal(currentEarnedTitle(played)?.id, 'first-loyal-client');
assert.equal(currentEarnedTitle(played)?.title, 'Keeper of Regulars');
assert.deepEqual(deriveEarnedTitles(played), titles, 'deterministic');

// Keepsakes: every milestone-gated item whose milestone is reached, with provenance, and none for unreached ones.
const kept = deriveKeepsakes(played);
const ids = kept.map((k) => k.itemId);
assert.ok(ids.includes('first-cheque-frame') && ids.includes('session-cans') && ids.includes('loyalty-chain'));
assert.ok(!ids.includes('gold-reference-disc'), 'charting reward stays locked');
assert.match(kept.find((k) => k.itemId === 'first-cheque-frame')!.provenance, /^First paid session: Demo/);
assert.equal(kept.find((k) => k.itemId === 'loyalty-chain')!.kind, 'cosmetic');

// Read-only use of the customisation data; recorded provenance wins.
const synced = { ...played, studioCustomization: syncCustomizationUnlocks(played) };
const frozen = JSON.stringify(synced.studioCustomization);
assert.deepEqual(deriveKeepsakes(synced), kept);
assert.equal(JSON.stringify(synced.studioCustomization), frozen);
const recorded = { ...synced, studioCustomization: { ...synced.studioCustomization!, provenance: { ...synced.studioCustomization!.provenance, 'first-cheque-frame': 'Custom note' } } };
assert.equal(deriveKeepsakes(recorded).find((k) => k.itemId === 'first-cheque-frame')!.provenance, 'Custom note');

// Every milestone that gates a cosmetic also has a title, so rewards and titles stay in step.
for (const item of [...STUDIO_FURNISHINGS, ...PRODUCER_COSMETICS]) {
  if (item.unlock.kind === 'milestone') assert.ok(MILESTONE_TITLES[item.unlock.milestoneId], `title for ${item.unlock.milestoneId}`);
}

// i18n: every title and label has a key in every locale.
for (const code of fs.readdirSync('public/locales')) {
  const d = JSON.parse(fs.readFileSync(`public/locales/${code}/common.json`, 'utf8')) as Record<string, string>;
  for (const id of Object.keys(MILESTONE_TITLES)) assert.ok(d[`career_title_${id}`], `${code} career_title_${id}`);
  for (const k of ['career_titles_kicker', 'career_title_current', 'career_title_earned_by', 'career_keepsake_furnishing', 'career_keepsake_cosmetic', 'career_titles_earlier']) assert.ok(d[k], `${code} ${k}`);
}
console.log('career rewards checks passed');
