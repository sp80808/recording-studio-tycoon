import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  MAX_STORY_CONTRACT_OFFERS,
  STORY_ACT_TERMS,
  buildStoryContract,
  hasStoryContract,
  withStoryContract,
} from '../src/narrative/storyContracts';
import { advanceStory } from '../src/narrative/storyProgression';
import { generateCampaignTree, getStorylineNode, initializeStorylineState } from '../src/narrative/branchingStorylineEngine';
import {
  STAKE_MIN_LEVEL,
  STAKE_ORDER,
  STAKE_TERMS,
  describeStake,
  isStakeUnlocked,
} from '../src/rpg/contractStakes';
import { generateProjectReview } from '../src/utils/projectReviewUtils';
import { initializeSkillsPlayer } from '../src/utils/skillUtils';
import type { GameState, PlayerData } from '../src/types/game';

const state = (over: Record<string, unknown> = {}): GameState =>
  initializeStorylineState({
    money: 4000,
    reputation: 20,
    currentDay: 6,
    currentEra: 'analog60s',
    selectedEra: 'analog60s',
    creativeCapital: 0,
    playerData: { playstyle: 'purist', originId: 'tape-purist', xp: 0, level: 2 },
    financials: { income: 0, expenses: 0, profit: 0, reports: [{ genre: 'Rock', overallQualityScore: 40 }] },
    studioRooms: [{ unlocked: true }],
    hiredStaff: [],
    availableProjects: [],
    activeProjects: [],
    activeProject: null,
    notifications: [],
    ...over,
  } as unknown as GameState);

describe('story contracts', () => {
  it('waits until the first session has been settled', () => {
    const fresh = state({ financials: { income: 0, expenses: 0, profit: 0, reports: [] } });
    assert.equal(withStoryContract(fresh), fresh);
  });

  it('offers exactly one pinned, locked-stake contract for the active node', () => {
    const next = withStoryContract(state());
    assert.equal(next.availableProjects.length, 1);
    const contract = next.availableProjects[0];
    assert.equal(contract.isStoryContract, true);
    assert.equal(contract.storyNodeId, 'act1_genesis');
    assert.equal(contract.stakeLocked, true);
    assert.equal(contract.stake, STORY_ACT_TERMS[1].stake);
    assert.ok(contract.rivalStudioId);
    assert.ok(contract.stages.length >= 2);
    assert.ok(contract.payoutBase > 0 && contract.repGainBase > 0);
    assert.equal(next.notifications.length, 1);
    assert.equal(hasStoryContract(next, 'act1_genesis'), true);
    // Pinned ahead of ordinary enquiries.
    const withOrdinary = withStoryContract(state({ availableProjects: [{ id: 'x', title: 'Ordinary' }] }));
    assert.equal(withOrdinary.availableProjects[0].isStoryContract, true);
    assert.equal(withOrdinary.availableProjects[1].id, 'x');
  });

  it('is idempotent and never duplicates an offered or active contract', () => {
    const once = withStoryContract(state());
    assert.equal(withStoryContract(once), once);
    const booked = {
      ...once,
      availableProjects: [],
      activeProject: once.availableProjects[0],
    } as GameState;
    assert.equal(withStoryContract(booked), booked);
  });

  it('re-offers a completed contract, but only up to the cap', () => {
    let s = state();
    for (let i = 0; i < MAX_STORY_CONTRACT_OFFERS; i++) {
      s = withStoryContract(s);
      assert.equal(s.availableProjects.filter((p) => p.isStoryContract).length, 1, `offer ${i + 1}`);
      s = { ...s, availableProjects: [] };
    }
    const capped = withStoryContract(s);
    assert.equal(capped.availableProjects.length, 0, 'no fourth offer');
  });

  it('holds off while a branch choice waits and after the campaign ends', () => {
    const s = state();
    const waiting = {
      ...s,
      storylineState: { ...s.storylineState!, storyFlags: { pending_branch_choice: 'dilemma_act1' } },
    } as GameState;
    assert.equal(withStoryContract(waiting), waiting);
    const done = { ...s, storylineState: { ...s.storylineState!, campaignCompleted: true } } as GameState;
    assert.equal(withStoryContract(done), done);
  });

  it('escalates stake and difficulty by act, and is deterministic', () => {
    const base = state();
    const tree = generateCampaignTree({ runSeed: base.storylineState!.runSeed, originId: 'tape-purist', selectedEra: 'analog60s', playstyle: 'purist' });
    const stakes = ([1, 2, 3] as const).map((act) => STORY_ACT_TERMS[act].stake);
    assert.deepEqual(stakes, ['safe', 'ambitious', 'moonshot']);
    for (const id of ['act1_genesis', 'act2_purist', 'act3_golden_legend']) {
      const node = getStorylineNode(tree, id)!;
      const a = buildStoryContract(base, node, 0);
      const b = buildStoryContract(base, node, 0);
      assert.deepEqual(a, b);
      assert.equal(a.difficulty, STORY_ACT_TERMS[node.act].difficulty);
      assert.equal(a.stake, STORY_ACT_TERMS[node.act].stake);
    }
  });

  it('uses era-native genres', () => {
    const modern = state({ currentEra: 'streaming2020s', selectedEra: 'streaming2020s', playerData: { playstyle: 'underground', originId: 'bedroom-beatmaker', xp: 0, level: 2 } });
    const contract = withStoryContract(modern).availableProjects[0];
    assert.ok(['Hip-Hop', 'Trap', 'Lo-fi', 'EDM', 'Indie Pop', 'TikTok Pop'].includes(contract.genre), contract.genre);
  });

  it('advanceStory chains evaluate → contract', () => {
    const next = advanceStory(state());
    assert.ok(next.storylineState);
    assert.equal(next.availableProjects.some((p) => p.isStoryContract), true);
  });

  it('settles the locked stake against the final rank', () => {
    const player = { skills: initializeSkillsPlayer(), level: 2, xp: 0 } as unknown as PlayerData;
    const s = withStoryContract(state());
    const contract = { ...s.availableProjects[0], stake: 'moonshot' as const };
    const report = generateProjectReview(contract, { type: 'player', id: 'player', name: 'You' }, 50, player, []);
    assert.ok(/moonshot gamble/.test(report.reviewSnippet), 'review mentions the moonshot gamble');
  });
});

describe('contract stake gating', () => {
  it('opens tiers by producer level', () => {
    assert.equal(isStakeUnlocked('safe', 1), true);
    assert.equal(isStakeUnlocked('ambitious', STAKE_MIN_LEVEL.ambitious - 1), false);
    assert.equal(isStakeUnlocked('ambitious', STAKE_MIN_LEVEL.ambitious), true);
    assert.equal(isStakeUnlocked('moonshot', STAKE_MIN_LEVEL.moonshot - 1), false);
    assert.ok(STAKE_ORDER.every((s, i, arr) => i === 0 || STAKE_MIN_LEVEL[s] > STAKE_MIN_LEVEL[arr[i - 1]]));
  });

  it('describes every stake truthfully from its terms', () => {
    assert.match(describeStake('safe'), /No gamble/);
    for (const stake of ['ambitious', 'moonshot'] as const) {
      const t = STAKE_TERMS[stake];
      const text = describeStake(stake);
      assert.ok(text.includes(`${t.needsRank}-rank`), text);
      assert.ok(text.includes(`×${t.payoutMult}`), text);
      assert.ok(text.includes(`${t.failRepHit} rep`), text);
    }
  });

  it('booking board wires the picker, locks story stakes and stays free of gradients', () => {
    const src = fs.readFileSync('src/components/ProjectList.tsx', 'utf8');
    assert.match(src, /StakePicker/);
    assert.match(src, /project\.stakeLocked/);
    assert.match(src, /startProject\(\{\s*\.\.\.project,\s*stake,/);
    assert.ok(!/bg-gradient|linear-gradient/.test(src), 'no gradients on the booking board');
    assert.ok(!/text-(blue|sky|cyan|indigo)-/.test(src), 'no blue text on the booking board');
  });
});
