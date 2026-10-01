import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ACHIEVEMENTS, countUnlocked, evaluateAchievements, getAchievement } from '../src/narrative/achievements';
import { advanceStory } from '../src/narrative/storyProgression';
import { initializeStorylineState } from '../src/narrative/branchingStorylineEngine';
import { getTrophyInput } from '../src/components/studio/studioDecorConfig';
import type { GameState } from '../src/types/game';

const base = (over: Record<string, unknown> = {}): GameState =>
  ({
    money: 500,
    reputation: 0,
    currentDay: 12,
    currentEra: 'analog60s',
    selectedEra: 'analog60s',
    financials: { income: 0, expenses: 0, profit: 0, reports: [] },
    studioRooms: [{ unlocked: true }],
    hiredStaff: [],
    ownedEquipment: [],
    notifications: [],
    playerData: { level: 1, xp: 0 },
    ...over,
  }) as unknown as GameState;

const reportsOf = (...qualities: number[]) => ({
  income: 0,
  expenses: 0,
  profit: 0,
  reports: qualities.map((q, i) => ({ projectId: `p${i}`, genre: 'Rock', overallQualityScore: q })),
});

describe('achievement catalog', () => {
  it('has unique ids, real copy and every category/tier represented', () => {
    assert.equal(new Set(ACHIEVEMENTS.map((a) => a.id)).size, ACHIEVEMENTS.length);
    for (const a of ACHIEVEMENTS) {
      assert.ok(a.title.length > 2 && a.description.length > 10, a.id);
      assert.ok(a.icon.length > 1, a.id);
    }
    for (const c of ['craft', 'business', 'studio', 'story']) assert.ok(ACHIEVEMENTS.some((a) => a.category === c), c);
    for (const t of ['bronze', 'silver', 'gold']) assert.ok(ACHIEVEMENTS.some((a) => a.tier === t), t);
    assert.ok(ACHIEVEMENTS.length >= 20);
  });

  it('a brand-new studio has earned nothing', () => {
    const { newlyUnlocked, state } = evaluateAchievements(base());
    assert.deepEqual(newlyUnlocked.map((a) => a.id), []);
    assert.equal(state.unlockedAchievements, undefined);
  });

  it('progress readouts are within bounds for every counted achievement', () => {
    const s = base({ money: 7000, reputation: 30, financials: reportsOf(60, 70, 40) });
    for (const a of ACHIEVEMENTS) {
      const p = a.progress?.(s);
      if (!p) continue;
      assert.ok(p.current >= 0 && p.current <= p.target, `${a.id}: ${p.current}/${p.target}`);
    }
  });
});

describe('unlocking', () => {
  it('stamps the day, adds a notification, and is idempotent', () => {
    const first = evaluateAchievements(base({ financials: reportsOf(85) }));
    const ids = first.newlyUnlocked.map((a) => a.id);
    for (const id of ['first_cut', 'solid_hands', 'golden_ears']) assert.ok(ids.includes(id), id);
    assert.ok(!ids.includes('perfect_pitch'));
    assert.equal(first.state.unlockedAchievements!.golden_ears, 12);
    assert.equal(first.state.notifications.length, ids.length);
    const again = evaluateAchievements(first.state);
    assert.equal(again.state, first.state, 'no change ⇒ same state object');
    assert.deepEqual(again.newlyUnlocked, []);
  });

  it('never revokes: dropping below a threshold keeps the trophy', () => {
    const rich = evaluateAchievements(base({ money: 6000 })).state;
    assert.ok('rainy_day_fund' in rich.unlockedAchievements!);
    const broke = evaluateAchievements({ ...rich, money: 0 }).state;
    assert.ok('rainy_day_fund' in broke.unlockedAchievements!);
  });

  it('hat-trick needs three consecutive B-ranks', () => {
    const a = evaluateAchievements(base({ financials: reportsOf(60, 40, 60, 70) })).state;
    assert.ok(!('hat_trick' in (a.unlockedAchievements ?? {})));
    const b = evaluateAchievements(base({ financials: reportsOf(40, 60, 70, 80) })).state;
    assert.ok('hat_trick' in b.unlockedAchievements!);
  });

  it('story achievements follow real flags and contracts', () => {
    const story = initializeStorylineState(base());
    const flagged = {
      ...story,
      financials: { ...reportsOf(70), reports: [{ projectId: 'story-act1_genesis-0', genre: 'Rock', overallQualityScore: 70 }] },
      storylineState: {
        ...story.storylineState!,
        resolvedSubplotIds: ['a', 'b', 'c'],
        storyFlags: { rewarded_act1_genesis: true, rewarded_act2_purist: true },
      },
    } as GameState;
    const ids = evaluateAchievements(flagged).newlyUnlocked.map((a) => a.id);
    for (const id of ['first_rival', 'crossroads', 'rivals_respect', 'storyteller']) assert.ok(ids.includes(id), id);
    assert.ok(!ids.includes('campaign_complete'));
  });

  it('era-hopper only fires after a real era transition', () => {
    assert.ok(!evaluateAchievements(base()).newlyUnlocked.some((a) => a.id === 'era_hopper'));
    assert.ok(evaluateAchievements(base({ currentEra: 'digital80s' })).newlyUnlocked.some((a) => a.id === 'era_hopper'));
    assert.ok(!evaluateAchievements(base({ currentEra: 'analog60s', selectedEra: 'classic_rock' })).newlyUnlocked.some((a) => a.id === 'era_hopper'));
  });

  it('is pure: frozen state in, no mutation', () => {
    const frozen = Object.freeze(base({ money: 20000, financials: reportsOf(95) }));
    assert.doesNotThrow(() => evaluateAchievements(frozen as GameState));
  });

  it('feeds the album-cover wall from settled reports and the story tick', () => {
    const ticked = advanceStory(initializeStorylineState(base({ money: 12000, financials: reportsOf(92) })));
    assert.ok(countUnlocked(ticked) >= 5);
    const wall = getTrophyInput(ticked);
    assert.equal(wall.covers.length, 1);
    assert.equal(wall.covers[0].projectId, 'p0');
    assert.equal(wall.covers[0].score, 92);
    assert.ok(getAchievement('perfect_pitch'));
  });
});
