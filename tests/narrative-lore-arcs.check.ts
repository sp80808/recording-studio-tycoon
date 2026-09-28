import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  CONSOLE_LAWS,
  RIVAL_STUDIOS,
  HISTORIC_STUDIOS,
  getConsoleLaws,
  getRivalStudio,
  getRivalsByPlaystyle,
} from '../src/narrative/studioLore';

import {
  PRODUCER_ORIGINS,
  getProducerOrigins,
  getProducerOrigin,
  applyOriginAttributes,
  PLAYSTYLE_CONFIGS,
} from '../src/narrative/characterOrigins';

import {
  NARRATIVE_DILEMMAS,
  getEligibleDilemmas,
  applyChoiceOutcome,
} from '../src/narrative/narrativeChoices';

import {
  STORY_ARCS,
  getStoryArcs,
  getStoryArcByPlaystyle,
  getStoryArcById,
} from '../src/narrative/storyArcs';

import {
  THEME_VISUAL_CONFIGS,
  getThemeVisualConfig,
  getRecommendedThemeForPlaystyle,
} from '../src/narrative/playstyleTheme';

import { GameState, PlayerAttributes } from '../src/types/game';

const makeMockGameState = (overrides: Partial<GameState> = {}): GameState => {
  return {
    money: 5000,
    influence: 10,
    creativeCapital: 20,
    currentEra: 'vintage-warmth',
    reputation: 25,
    currentDay: 10,
    currentYear: 1975,
    selectedEra: 'vintage-warmth',
    eraStartYear: 1970,
    equipmentMultiplier: 1.0,
    playerData: {
      xp: 200,
      level: 2,
      xpToNextLevel: 500,
      perkPoints: 1,
      attributes: {
        focusMastery: 2,
        creativeIntuition: 3,
        technicalAptitude: 2,
        businessAcumen: 1,
      },
      dailyWorkCapacity: 3,
      reputation: 25,
      skills: {} as any,
    },
    studioSkills: {},
    ownedUpgrades: [],
    ownedEquipment: [],
    availableProjects: [],
    financials: {
      dailyBreakdown: [],
      history: [],
      monthlyBreakdown: [],
      totalExpenses: 0,
      totalIncome: 0,
    },
    studioRooms: [],
    activeProjects: [],
    maxConcurrentProjects: 1,
    activeProject: null,
    hiredStaff: [],
    availableCandidates: [],
    lastSalaryDay: 0,
    notifications: [],
    bands: [],
    playerBands: [],
    availableSessionMusicians: [],
    activeOriginalTrack: null,
    ...overrides,
  };
};

describe('Studio Lore & Console Laws', () => {
  it('has at least 8 authored console laws with non-empty lore and principles', () => {
    const laws = getConsoleLaws();
    assert.ok(laws.length >= 8, 'Expected >= 8 console laws');
    laws.forEach((law) => {
      assert.ok(law.number > 0, `Law ${law.id} should have positive number`);
      assert.ok(law.title.length > 3, `Law ${law.id} title is too short`);
      assert.ok(law.quote.length > 5, `Law ${law.id} quote is too short`);
      assert.ok(law.lore.length > 10, `Law ${law.id} lore is too short`);
      assert.ok(law.gameplayPrinciple.length > 10, `Law ${law.id} gameplay principle is too short`);
    });
  });

  it('defines 4 rival studios covering all 4 core playstyles', () => {
    assert.strictEqual(RIVAL_STUDIOS.length, 4, 'Expected exactly 4 rival studios');
    const playstyles = new Set(RIVAL_STUDIOS.map((r) => r.primaryPlaystyle));
    assert.ok(playstyles.has('purist'));
    assert.ok(playstyles.has('hit-maker'));
    assert.ok(playstyles.has('underground'));
    assert.ok(playstyles.has('sound-lab'));

    const silas = getRivalStudio('black-wax-vault');
    assert.ok(silas);
    assert.strictEqual(silas?.headProducer, 'Silas Vance');

    const rivalsPurist = getRivalsByPlaystyle('purist');
    assert.strictEqual(rivalsPurist.length, 1);
    assert.strictEqual(rivalsPurist[0].id, 'black-wax-vault');
  });

  it('contains authored historic studios of lore', () => {
    assert.ok(HISTORIC_STUDIOS.length >= 3);
    const ditch = HISTORIC_STUDIOS.find((s) => s.id === 'the-ditch');
    assert.ok(ditch);
    assert.ok(ditch.acousticSecret.length > 0);
  });
});

describe('Character Origins & Playstyles', () => {
  it('defines 5 unique producer origins with perks and genre alignments', () => {
    const origins = getProducerOrigins();
    assert.strictEqual(origins.length, 5);

    const beatmaker = getProducerOrigin('bedroom-beatmaker');
    assert.strictEqual(beatmaker.name, 'The Bedroom Beatmaker');
    assert.strictEqual(beatmaker.primaryPlaystyle, 'underground');
    assert.ok(beatmaker.passivePerk.qualityBonus! > 0);

    const purist = getProducerOrigin('tape-purist');
    assert.strictEqual(purist.primaryPlaystyle, 'purist');
    assert.ok(purist.signatureGenres.includes('Rock'));
  });

  it('accurately applies origin starting attribute bonuses without mutation', () => {
    const base: PlayerAttributes = {
      focusMastery: 2,
      creativeIntuition: 2,
      technicalAptitude: 2,
      businessAcumen: 2,
    };

    const beatmakerAttrs = applyOriginAttributes(base, 'bedroom-beatmaker');
    assert.strictEqual(beatmakerAttrs.creativeIntuition, 5); // +3
    assert.strictEqual(beatmakerAttrs.focusMastery, 3); // +1
    assert.strictEqual(beatmakerAttrs.technicalAptitude, 2);
    // Verify base is not mutated
    assert.strictEqual(base.creativeIntuition, 2);

    const alchemistAttrs = applyOriginAttributes(base, 'sonic-alchemist');
    assert.strictEqual(alchemistAttrs.technicalAptitude, 4); // +2
    assert.strictEqual(alchemistAttrs.creativeIntuition, 4); // +2
  });

  it('validates playstyle configurations and weights', () => {
    assert.ok(PLAYSTYLE_CONFIGS.purist.preferredAwardsWeight > 1.0);
    assert.ok(PLAYSTYLE_CONFIGS['hit-maker'].marketTrendSensitivity > 1.0);
    assert.ok(PLAYSTYLE_CONFIGS.underground.reputationDecayResistance > 1.0);
    assert.ok(PLAYSTYLE_CONFIGS['sound-lab'].focusBonusDescription.length > 0);
  });
});

describe('Narrative Dilemmas & Choice Engine', () => {
  it('filters eligible dilemmas by currentDay and resolved status', () => {
    const earlyState = makeMockGameState({ currentDay: 2 });
    const eligibleEarly = getEligibleDilemmas(earlyState, []);
    assert.strictEqual(eligibleEarly.length, 0, 'No dilemmas should trigger before Day 3');

    const midState = makeMockGameState({ currentDay: 7 });
    const eligibleMid = getEligibleDilemmas(midState, []);
    assert.ok(eligibleMid.length >= 2, 'Expected at least 2 dilemmas eligible by Day 7');

    const filtered = getEligibleDilemmas(midState, ['the-leaked-master']);
    assert.ok(!filtered.some((d) => d.id === 'the-leaked-master'), 'Resolved dilemma should be excluded');
  });

  it('resolves dilemma choices with accurate money and reputation state changes', () => {
    const state = makeMockGameState({ money: 3000, reputation: 20 });
    const { updatedState, outcomeText, storyFlag } = applyChoiceOutcome(
      state,
      'the-leaked-master',
      'leak-rush-stream'
    );

    assert.strictEqual(updatedState.money, 5400); // 3000 + 2400
    assert.strictEqual(updatedState.reputation, 17); // 20 - 3
    assert.strictEqual(storyFlag, 'monetized_leak_wave');
    assert.ok(outcomeText.length > 10);
  });

  it('guards against negative money balance on penalties', () => {
    const poorState = makeMockGameState({ money: 500 });
    const { updatedState } = applyChoiceOutcome(
      poorState,
      'payola-radio-pitch',
      'payola-accept'
    );
    assert.strictEqual(updatedState.money, 0, 'Money should floor at 0 on large penalty');
  });
});

describe('Story Arcs & Campaigns', () => {
  it('defines 4 story arcs aligned to playstyles with 3 chapters each', () => {
    const arcs = getStoryArcs();
    assert.strictEqual(arcs.length, 4);

    arcs.forEach((arc) => {
      assert.strictEqual(arc.chapters.length, 3, `Arc ${arc.id} must have 3 chapters`);
      assert.strictEqual(arc.chapters[2].chapterNumber, 3, `Arc ${arc.id} chapter 3 must have chapterNumber 3`);
    });

    const puristArc = getStoryArcByPlaystyle('purist');
    assert.strictEqual(puristArc.id, 'arc-golden-tape');
    assert.strictEqual(puristArc.primaryRivalId, 'black-wax-vault');

    const hitArc = getStoryArcById('arc-hit-syndicate');
    assert.ok(hitArc);
    assert.strictEqual(hitArc?.playstyle, 'hit-maker');
  });

  it('evaluates chapter completion conditions accurately', () => {
    const hitArc = getStoryArcById('arc-hit-syndicate')!;
    const chapter1 = hitArc.chapters[0];

    const stateNotReady = makeMockGameState({ money: 8000, currentDay: 5 });
    assert.strictEqual(chapter1.checkCompletion(stateNotReady), false);

    const stateReady = makeMockGameState({ money: 12000, currentDay: 12 });
    assert.strictEqual(chapter1.checkCompletion(stateReady), true);
  });
});

describe('Visual Presentation Themes', () => {
  it('provides complete visual config for all 4 themes', () => {
    const themes = Object.keys(THEME_VISUAL_CONFIGS);
    assert.strictEqual(themes.length, 4);

    const warmAnalog = getThemeVisualConfig('warm-analog');
    assert.strictEqual(warmAnalog.meterStyle, 'analog-vu');
    assert.ok(warmAnalog.panelBorderClass.includes('border-amber'));

    const recommended = getRecommendedThemeForPlaystyle('sound-lab');
    assert.strictEqual(recommended, 'modular-rack');
  });
});
