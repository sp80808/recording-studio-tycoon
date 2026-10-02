import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createNewGameState } from '../src/utils/newGameState';
import { migrateAndInitializeGameState } from '../src/utils/gameStateUtils';
import { producerNpcFor, withProducerAppearance } from '../src/utils/producerCustomization';
import {
  DEFAULT_PRODUCER_APPEARANCE,
  PRODUCER_ACCESSORIES,
  PRODUCER_CLOTHES_COLOURS,
  PRODUCER_HAIR_SHAPES,
  buildProducerNpc,
  sanitizeProducerAppearance,
  type ProducerAppearance,
} from '../src/features/sprites/producerAppearance';
import { buildNpcLayerStack } from '../src/features/sprites/npcLayers';
import { generateModularNpc } from '../src/features/sprites/npcGenerator';
import { AVAILABLE_ERAS } from '../src/data/eras';

const era = AVAILABLE_ERAS.find((e) => e.id === 'golden_age')!;
const look: ProducerAppearance = { seed: 42, build: 'average', hair: 'long_wavy', hairColour: 'auburn', clothesColour: 'teal', accessory: 'flat_cap' };
const start = (extra: Record<string, unknown> = {}) =>
  createNewGameState({
    startingMoney: era.startingMoney, selectedEra: era.id, eraStartYear: era.startYear,
    currentYear: era.startYear, equipmentMultiplier: era.equipmentMultiplier,
    originId: 'tape-purist', saveSeed: 7, ...extra,
  } as never);

describe('producer customization (#126)', () => {
  it('persists name, origin and appearance in new game state', () => {
    const state = start({ producerName: '  Quincy  ', producerAppearance: look });
    const c = state.producerCustomization!;
    assert.equal(c.moniker, 'Quincy');
    assert.equal(c.backgroundId, 'tape-purist');
    assert.deepEqual(c.appearance, look);
  });

  it('defaults safely when career start sent nothing, and repairs junk', () => {
    assert.deepEqual(start().producerCustomization!.appearance, DEFAULT_PRODUCER_APPEARANCE);
    const junk = sanitizeProducerAppearance({ seed: 'x', hair: 'mullet', hairColour: 3, clothesColour: null, accessory: 'jetpack' });
    assert.deepEqual(junk, DEFAULT_PRODUCER_APPEARANCE);
    assert.equal(sanitizeProducerAppearance({ ...look, accessory: 'nope' }).hair, 'long_wavy');
    // Pre-build saves omit build but still load (explicit default, not a reseed).
    assert.equal(sanitizeProducerAppearance({ ...look, build: undefined }).build, 'average');
    assert.equal(sanitizeProducerAppearance({ ...look, build: 'sumo' }).build, 'average');
  });

  it('applies the explicit physique without touching the seed-driven face', () => {
    for (const build of ['slim', 'average', 'stocky'] as const) {
      assert.equal(buildProducerNpc({ ...look, build }, 'P', 'golden_age').body.build, build);
    }
    const slim = buildProducerNpc({ ...look, build: 'slim' }, 'P', 'golden_age');
    const stocky = buildProducerNpc({ ...look, build: 'stocky' }, 'P', 'golden_age');
    assert.equal(slim.body.skinTone, stocky.body.skinTone);
    assert.notEqual(slim.body.build, stocky.body.build);
  });

  it('wires every picker value into the ModularNpcDefinition', () => {
    for (const hair of PRODUCER_HAIR_SHAPES) assert.equal(buildProducerNpc({ ...look, hair }, 'P', 'golden_age').hair.shape, hair);
    const colours = new Set(PRODUCER_CLOTHES_COLOURS.map((c) => buildProducerNpc({ ...look, clothesColour: c.id }, 'P').clothes.topPrimaryHex));
    assert.equal(colours.size, PRODUCER_CLOTHES_COLOURS.length, 'each clothes colour is distinct');
    const cap = buildProducerNpc(look, 'P');
    assert.equal(cap.details.headwear, 'flat_cap');
    assert.equal(cap.details.headphones, false);
    assert.equal(buildProducerNpc({ ...look, accessory: 'headphones' }, 'P').details.headphones, true);
    assert.equal(buildProducerNpc({ ...look, accessory: 'wayfarers' }, 'P').details.glasses, 'wayfarer');
    assert.equal(buildProducerNpc({ ...look, accessory: 'gold_chain' }, 'P').details.jewellery, 'gold_chain');
    for (const accessory of PRODUCER_ACCESSORIES) {
      const npc = buildProducerNpc({ ...look, accessory }, 'P');
      assert.equal(npc.role, 'producer');
      assert.ok(buildNpcLayerStack(npc).length > 5);
    }
    assert.ok(buildNpcLayerStack(cap).some((l) => l.slot === 'headwear'));
  });

  it('is deterministic and survives a JSON save round trip', () => {
    const state = start({ producerName: 'Quincy', producerAppearance: look });
    const a = producerNpcFor(state);
    const b = producerNpcFor(JSON.parse(JSON.stringify(state)));
    assert.deepEqual(a, b);
    assert.deepEqual(buildProducerNpc(look, 'Quincy', 'golden_age'), a);
  });

  it('migrates legacy saves (no customization) and keeps existing ones', () => {
    const legacy = JSON.parse(JSON.stringify(start()));
    delete legacy.producerCustomization;
    const migrated = migrateAndInitializeGameState(legacy);
    assert.equal(migrated.producerCustomization!.backgroundId, 'tape-purist');
    assert.ok(migrated.producerCustomization!.appearance);
    assert.deepEqual(migrateAndInitializeGameState(legacy).producerCustomization, migrated.producerCustomization, 'stable across loads');

    const custom = start({ producerName: 'Quincy', producerAppearance: look });
    assert.deepEqual(migrateAndInitializeGameState(custom).producerCustomization, custom.producerCustomization);

    const corrupt = { ...custom, producerCustomization: { ...custom.producerCustomization, appearance: { hair: 'zzz', clothesColour: 'plum' } } };
    const repaired = migrateAndInitializeGameState(corrupt as never).producerCustomization!.appearance!;
    assert.equal(repaired.hair, DEFAULT_PRODUCER_APPEARANCE.hair);
    assert.equal(repaired.clothesColour, 'plum');
  });

  it('updates immutably', () => {
    const state = start({ producerAppearance: look });
    const frozen = JSON.stringify(state);
    const next = withProducerAppearance(state, { ...look, hair: 'bald' });
    assert.equal(JSON.stringify(state), frozen);
    assert.equal(next.producerCustomization!.appearance!.hair, 'bald');
    assert.notEqual(next, state);
  });

  it('generated NPCs are unchanged (no headwear / headphones overrides)', () => {
    const npc = generateModularNpc(11, { role: 'engineer', era: '1980s' });
    assert.equal(npc.details.headwear, undefined);
    assert.equal(npc.details.headphones, undefined);
    assert.ok(buildNpcLayerStack(npc).some((l) => l.slot === 'headphones'));
  });

  it('every accessory maps to exactly one visible detail, and the new ones are wired', () => {
    const detail = (accessory: ProducerAppearance['accessory']) => {
      const d = buildProducerNpc({ ...look, accessory }, 'P', 'golden_age').details;
      return { headwear: d.headwear, glasses: d.glasses, jewellery: d.jewellery, headphones: d.headphones };
    };
    assert.equal(detail('bucket_hat').headwear, 'bucket_hat');
    assert.equal(detail('bandana').headwear, 'bandana');
    assert.equal(detail('headband').headwear, 'headband');
    assert.equal(detail('aviators').glasses, 'tinted_aviator');
    assert.equal(detail('horn_rims').glasses, 'horn_rim');
    assert.equal(detail('visor').glasses, 'cyber_visor');
    assert.equal(detail('hoops').jewellery, 'silver_hoops');
    assert.equal(detail('choker').jewellery, 'choker');
    assert.equal(detail('cassette_pendant').jewellery, 'cassette_pendant');
    assert.ok(PRODUCER_ACCESSORIES.length >= 16, 'accessory catalogue grew');
    // The original accessories keep their order at the front so saved picks and cycling are stable.
    assert.deepEqual(PRODUCER_ACCESSORIES.slice(0, 7), ['none', 'headphones', 'round_glasses', 'wayfarers', 'flat_cap', 'beanie', 'gold_chain']);
  });
});
