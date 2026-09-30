import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createNewGameState } from '../src/utils/newGameState';
import { PRODUCER_ORIGINS } from '../src/narrative/characterOrigins';
import { getOriginEffects } from '../src/narrative/originPerks';
import { AVAILABLE_ERAS } from '../src/data/eras';

const era = AVAILABLE_ERAS.find((e) => e.id === 'golden_age')!;
const start = (originId?: string, saveSeed: number | string = 1234) =>
  createNewGameState({
    startingMoney: era.startingMoney,
    selectedEra: era.id,
    eraStartYear: era.startYear,
    currentYear: era.startYear,
    equipmentMultiplier: era.equipmentMultiplier,
    originId: originId as never,
    saveSeed,
  });

describe('career start: era + producer origin', () => {
  it('applies each origin: id, playstyle and starting attribute bonus', () => {
    for (const origin of PRODUCER_ORIGINS) {
      const state = start(origin.id);
      assert.equal(state.playerData.originId, origin.id);
      assert.equal(state.playerData.playstyle, origin.primaryPlaystyle);
      const bonus = origin.startingAttributeBonus;
      assert.equal(state.playerData.attributes.creativeIntuition, 1 + (bonus.creativeIntuition ?? 0));
      assert.equal(state.playerData.attributes.technicalAptitude, 1 + (bonus.technicalAptitude ?? 0));
      assert.equal(state.playerData.attributes.businessAcumen, 1 + (bonus.businessAcumen ?? 0));
      assert.equal(state.playerData.attributes.focusMastery, 1 + (bonus.focusMastery ?? 0));
      // and the perk is live for this save
      assert.equal(getOriginEffects(state).originId, origin.id);
    }
  });

  it('keeps the era choice: money, year and price multiplier', () => {
    const state = start('tape-purist');
    assert.equal(state.money, era.startingMoney);
    assert.equal(state.currentYear, era.startYear);
    assert.equal(state.selectedEra, 'golden_age');
    assert.equal(state.equipmentMultiplier, era.equipmentMultiplier);
  });

  it('ignores unknown origins and keeps the legacy defaults (no origin fields)', () => {
    for (const bad of [undefined, 'not-an-origin', '']) {
      const state = start(bad);
      assert.equal(state.playerData.originId, undefined);
      assert.equal(state.playerData.playstyle, undefined);
      assert.deepEqual(state.playerData.attributes, { focusMastery: 1, creativeIntuition: 1, technicalAptitude: 1, businessAcumen: 1 });
    }
  });

  it('is deterministic for the same seed and diverges across origins', () => {
    assert.equal(start('tape-purist', 99).storylineState!.runSeed, start('tape-purist', 99).storylineState!.runSeed);
    const seeds = new Set(PRODUCER_ORIGINS.map((o) => start(o.id, 99).storylineState!.runSeed));
    assert.equal(seeds.size, PRODUCER_ORIGINS.length, 'each origin yields its own campaign seed');
  });

  it('hydrates a campaign and an opening board of enquiries', () => {
    const state = start('bedroom-beatmaker');
    assert.ok(state.storylineState);
    assert.equal(state.storylineState!.activeCampaignNodeId, 'act1_genesis');
    assert.ok(state.availableProjects.length >= 3);
  });
});
