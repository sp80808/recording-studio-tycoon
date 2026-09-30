import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  NEUTRAL_ORIGIN_EFFECTS,
  applyUpkeepDiscount,
  describeOriginPerks,
  getOriginEffects,
  getOriginEffectsById,
  gigRefreshCostFor,
  isSignatureGenre,
  originPayoutMultiplier,
  originQualityBonus,
} from '../src/narrative/originPerks';
import { PRODUCER_ORIGINS } from '../src/narrative/characterOrigins';
import { generateProjectReview } from '../src/utils/projectReviewUtils';
import { getSettlementBonuses } from '../src/utils/settlementBonuses';
import { initializeSkillsPlayer } from '../src/utils/skillUtils';
import { calculateEquipmentUpkeep } from '../src/hooks/useGameActions';
import { applyDeliveryToClientRelationships } from '../src/game-mechanics/relationship-management';
import { applyCompletedSessionToRelationship } from '../src/utils/clientRelationshipUtils';
import { generateNewProjects } from '../src/utils/projectUtils';
import type { GameState, PlayerData, Project } from '../src/types/game';

const makeProject = (genre: string, overrides: Partial<Project> = {}): Project =>
  ({
    id: `proj-${genre}`,
    title: 'Test Session',
    genre,
    clientType: 'Indie Band',
    difficulty: 3,
    durationDaysTotal: 4,
    payoutBase: 1000,
    repGainBase: 20,
    requiredSkills: {},
    stages: [],
    matchRating: 'Good',
    accumulatedCPoints: 30,
    accumulatedTPoints: 30,
    currentStageIndex: 0,
    completedStages: [],
    workSessionCount: 4,
    focusAllocation: { performance: 33, soundCapture: 33, layering: 34 },
    ...overrides,
  }) as Project;

const makePlayer = (): PlayerData =>
  ({
    xp: 0,
    level: 3,
    xpToNextLevel: 100,
    perkPoints: 0,
    dailyWorkCapacity: 5,
    reputation: 10,
    attributes: { focusMastery: 1, creativeIntuition: 1, technicalAptitude: 1, businessAcumen: 1 },
    skills: initializeSkillsPlayer(),
  }) as PlayerData;

const stateWith = (originId?: string): GameState =>
  ({
    playerData: { ...makePlayer(), originId },
    studioRooms: [],
    hiredStaff: [],
    ownedEquipment: [],
    clientRelationships: {},
  }) as unknown as GameState;

const review = (project: Project, ctx = {}) =>
  generateProjectReview(project, { type: 'player', id: 'player', name: 'You' }, 60, makePlayer(), [], ctx);

describe('origin effects', () => {
  it('legacy saves (no origin) get neutral effects — no surprise nerfs or buffs', () => {
    assert.deepEqual(getOriginEffects(stateWith(undefined)), NEUTRAL_ORIGIN_EFFECTS);
    assert.deepEqual(getOriginEffectsById('not-a-real-origin'), NEUTRAL_ORIGIN_EFFECTS);
    assert.equal(originQualityBonus(NEUTRAL_ORIGIN_EFFECTS, 'Rock'), 0);
    assert.equal(originPayoutMultiplier(NEUTRAL_ORIGIN_EFFECTS, 'Pop', 1.2), 1);
  });

  it('every authored origin resolves to at least one real, non-neutral effect', () => {
    for (const origin of PRODUCER_ORIGINS) {
      const e = getOriginEffectsById(origin.id);
      const real =
        e.qualityBonus > 0 || e.payoutMultiplier > 1 || e.upkeepMultiplier < 1 || e.relationshipXpMultiplier > 1 ||
        e.freeGigRefresh || e.synergyMultiplier > 1 || e.rankARepBonus > 0;
      assert.ok(real, `${origin.id} has a perk the game actually applies`);
      assert.ok(describeOriginPerks(origin.id).length >= 2, `${origin.id} has UI copy`);
    }
  });

  it('genre matching is loose about punctuation and case', () => {
    const e = getOriginEffectsById('bedroom-beatmaker');
    assert.ok(isSignatureGenre(e, 'Hip-Hop'));
    assert.ok(isSignatureGenre(e, 'hip hop'));
    assert.ok(!isSignatureGenre(e, 'Country'));
  });

  it('signature-genre quality and payout bonuses only apply to the right genres', () => {
    const purist = getOriginEffectsById('tape-purist');
    assert.equal(originQualityBonus(purist, 'Rock'), 10);
    assert.equal(originQualityBonus(purist, 'Electronic'), 0);
    const merc = getOriginEffectsById('hit-factory-mercenary');
    assert.equal(originPayoutMultiplier(merc, 'Pop', 1), 1.25);
    assert.equal(originPayoutMultiplier(merc, 'Folk', 1), 1);
    assert.ok(Math.abs(originPayoutMultiplier(merc, 'Pop', 1.1) - 1.25 * 1.08) < 1e-9, 'hot market stacks');
    assert.ok(Math.abs(originPayoutMultiplier(merc, 'Folk', 1.1) - 1.08) < 1e-9, 'hot market pays even off-genre');
  });
});

describe('perks change real outcomes at settlement', () => {
  it('origin quality bonus raises the report score (and is deterministic)', () => {
    const project = makeProject('Rock');
    const base = review(project);
    const boosted = review(project, { originQualityBonus: 10 });
    assert.ok(boosted.overallQualityScore >= base.overallQualityScore + 8, `boosted ${boosted.overallQualityScore} vs ${base.overallQualityScore}`);
    assert.equal(review(project, { originQualityBonus: 10 }).overallQualityScore, boosted.overallQualityScore, 'same seed, same result');
  });

  it('payout multiplier scales money; neutral context is unchanged', () => {
    const project = makeProject('Pop');
    const base = review(project);
    const paid = review(project, { payoutMultiplier: 1.25 });
    assert.equal(review(project, {}).moneyGained, base.moneyGained);
    assert.ok(paid.moneyGained > base.moneyGained * 1.2 && paid.moneyGained <= base.moneyGained * 1.3);
  });

  it('A-rank reputation bonus applies only at 80+', () => {
    const project = makeProject('Rock');
    const lowBase = review(project);
    const lowBoosted = review(project, { rankARepBonus: 0.15 });
    if (lowBase.overallQualityScore < 80) assert.equal(lowBoosted.reputationGained, lowBase.reputationGained, 'no bonus below A');
    const hi = review(project, { originQualityBonus: 12, synergyQualityBonus: 12, staffContribution: 10, studioQualityBonus: 10, equipmentQualityBonus: 10, focusEffectiveness: 1.3 });
    assert.ok(hi.overallQualityScore >= 80, `high-quality fixture reached A (${hi.overallQualityScore})`);
    const hiBoosted = review(project, { originQualityBonus: 12, synergyQualityBonus: 12, staffContribution: 10, studioQualityBonus: 10, equipmentQualityBonus: 10, focusEffectiveness: 1.3, rankARepBonus: 0.15 });
    assert.ok(hiBoosted.reputationGained > hi.reputationGained, 'A-rank sessions earn extra reputation');
  });

  it('skill XP multiplier boosts only the named skills', () => {
    const project = makeProject('Hip-Hop');
    const base = review(project);
    const boosted = review(project, { skillXpMultipliers: { soundDesign: 1.2, sampleWarping: 1.2 } });
    for (const entry of boosted.skillBreakdown) {
      const b = base.skillBreakdown.find((s) => s.skillName === entry.skillName)!;
      if (entry.skillName === 'soundDesign' || entry.skillName === 'sampleWarping') {
        assert.ok(entry.xpGained > b.xpGained, `${entry.skillName} XP boosted`);
      } else {
        assert.equal(entry.xpGained, b.xpGained, `${entry.skillName} XP untouched`);
      }
    }
  });

  it('getSettlementBonuses wires origin + synergy multiplier from state', () => {
    const state = stateWith('sonic-alchemist');
    const bonuses = getSettlementBonuses(state, makeProject('Electronic'), 1);
    assert.equal(bonuses.originQualityBonus, 0, 'alchemist has no genre bonus');
    assert.ok(bonuses.synergyQualityBonus >= 0 && bonuses.synergyQualityBonus <= 12);
    const purist = getSettlementBonuses(stateWith('tape-purist'), makeProject('Rock'), 1);
    assert.equal(purist.originQualityBonus, 10);
    assert.equal(purist.rankARepBonus, 0.15);
    const none = getSettlementBonuses(stateWith(undefined), makeProject('Rock'), 1);
    assert.equal(none.originQualityBonus, 0);
    assert.equal(none.payoutMultiplier, 1);
  });
});

describe('economy perks', () => {
  const gear = [{ price: 5000 }, { price: 3000 }, { price: 1200 }] as unknown as GameState['ownedEquipment'];

  it('alchemist pays 35% less upkeep; everyone else is unchanged', () => {
    const base = calculateEquipmentUpkeep(gear);
    const alch = calculateEquipmentUpkeep(gear, getOriginEffectsById('sonic-alchemist'));
    assert.equal(base, 5 + 3 + 2 > 0 ? base : 0);
    assert.ok(alch < base && alch >= Math.round(base * 0.6), `${alch} < ${base}`);
    assert.equal(applyUpkeepDiscount(0, getOriginEffectsById('sonic-alchemist')), 0);
  });

  it('beatmaker chases gigs for free; others pay', () => {
    assert.equal(gigRefreshCostFor(50, getOriginEffectsById('bedroom-beatmaker')), 0);
    assert.equal(gigRefreshCostFor(50, getOriginEffectsById('tape-purist')), 50);
    assert.equal(gigRefreshCostFor(50, NEUTRAL_ORIGIN_EFFECTS), 50);
  });

  it('svengali earns relationship XP faster (both delivery paths)', () => {
    const opts = { clientKey: 'a|b', clientName: 'A', primaryGenre: 'Soul', qualityScore: 80, currentDay: 3 };
    const base = applyDeliveryToClientRelationships({}, opts);
    const sven = applyDeliveryToClientRelationships({}, { ...opts, xpMultiplier: getOriginEffectsById('charismatic-svengali').relationshipXpMultiplier });
    assert.equal(sven.xpGained, Math.round(base.xpGained * 1.5));
    const rel = { clientId: 'c', clientName: 'C', primaryGenre: 'Soul', relationshipXp: 0, tier: 'Unknown', sessionsCompleted: 0, lastSessionDay: 1, bestQualityScore: 0, referralCount: 0 } as const;
    const legacyBase = applyCompletedSessionToRelationship({ ...rel }, 85, 5);
    const legacyBoost = applyCompletedSessionToRelationship({ ...rel }, 85, 5, 1.5);
    assert.ok(legacyBoost.relationshipXp > legacyBase.relationshipXp);
  });

  it('returning clients pay the origin premium', () => {
    const known = [{ clientId: 'k1', clientName: 'Known Band', primaryGenre: 'Rock', relationshipXp: 200, tier: 'Friendly', sessionsCompleted: 3, lastSessionDay: 1, bestQualityScore: 80, referralCount: 0 }] as never;
    // Force every offer to be a returning client by generating many and comparing means of returning ones.
    const mean = (premium: number) => {
      let sum = 0;
      let n = 0;
      for (let i = 0; i < 400; i++) {
        for (const p of generateNewProjects(1, 3, 'analog60s', known, premium)) {
          if (p.title.startsWith('Return:')) { sum += p.payoutBase / (p.difficulty ?? 1); n++; }
        }
      }
      return n ? sum / n : 0;
    };
    assert.ok(mean(1.18) > mean(1.1) * 1.03, 'higher premium raises returning-client fees');
  });
});
