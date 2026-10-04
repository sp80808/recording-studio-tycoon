import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createNewGameState } from '../src/utils/newGameState';
import { migrateAndInitializeGameState } from '../src/utils/gameStateUtils';
import { producerNpcFor } from '../src/utils/producerCustomization';
import { createSeededRandom } from '../src/simulation/seededRandom';
import { AVAILABLE_ERAS } from '../src/data/eras';
import {
  DEFAULT_PRODUCER_APPEARANCE,
  PRODUCER_ACCESSORIES,
  PRODUCER_APPEARANCE_KEYS,
  PRODUCER_BUILDS,
  PRODUCER_CLOTHES_COLOURS,
  PRODUCER_HAIR_COLOURS,
  PRODUCER_HAIR_SHAPES,
  PRODUCER_PANTS,
  PRODUCER_SHIRTS,
  PRODUCER_SHOES,
  PRODUCER_SKIN_TONES,
  buildProducerNpc,
  randomiseProducerAppearance,
  sameProducerAppearance,
  sanitizeProducerAppearance,
} from '../src/features/sprites/producerAppearance';
import { FULL, INVALID, PARTIAL, PRE_EXPANDED } from './fixtures/producer-appearance-saves';

const era = AVAILABLE_ERAS.find((e) => e.id === 'golden_age')!;
const freshState = () => createNewGameState({
  startingMoney: era.startingMoney, selectedEra: era.id, eraStartYear: era.startYear,
  currentYear: era.startYear, equipmentMultiplier: era.equipmentMultiplier, originId: 'tape-purist', saveSeed: 7,
} as never);
/** A saved game whose appearance blob is exactly `appearance` (or absent). */
const saveWith = (appearance: unknown) => {
  const save = JSON.parse(JSON.stringify(freshState()));
  if (appearance === undefined) delete save.producerCustomization.appearance;
  else save.producerCustomization.appearance = appearance;
  return save;
};
const load = (appearance: unknown) => migrateAndInitializeGameState(saveWith(appearance)).producerCustomization!.appearance!;
const roundTrip = (state: unknown) => migrateAndInitializeGameState(JSON.parse(JSON.stringify(state)));
const FIXTURES = [PRE_EXPANDED, PARTIAL, FULL, INVALID, undefined];

describe('producer appearance save compatibility (#213)', () => {
  it('pre-expansion saves load, keep old picks and get deterministic defaults', () => {
    const a = load(PRE_EXPANDED);
    assert.equal(a.hair, 'afro');
    assert.equal(a.hairColour, 'silver_grey');
    assert.equal(a.clothesColour, 'plum');
    assert.equal(a.accessory, 'beanie');
    assert.equal(a.seed, 777);
    for (const key of ['skinTone', 'shirt', 'pants', 'shoes', 'build'] as const) assert.equal(a[key], DEFAULT_PRODUCER_APPEARANCE[key], key);
    assert.deepEqual(load(PRE_EXPANDED), a, 'defaults are deterministic');
  });

  it('partially populated saves keep what they have and default the rest', () => {
    const a = load(PARTIAL);
    assert.equal(a.skinTone, 'deep');
    assert.equal(a.shoes, 'creepers');
    assert.equal(a.shirt, DEFAULT_PRODUCER_APPEARANCE.shirt);
    assert.equal(a.build, DEFAULT_PRODUCER_APPEARANCE.build);
  });

  it('fully populated saves round-trip untouched', () => {
    assert.deepEqual(load(FULL), FULL);
  });

  it('invalid and unknown values are sanitised field by field', () => {
    assert.deepEqual(load(INVALID), DEFAULT_PRODUCER_APPEARANCE);
    assert.deepEqual(load({ ...FULL, hair: 'mullet', shoes: 42 }), { ...FULL, hair: DEFAULT_PRODUCER_APPEARANCE.hair, shoes: DEFAULT_PRODUCER_APPEARANCE.shoes });
    for (const junk of [null, 'str', 12, [], true]) {
      assert.deepEqual(sanitizeProducerAppearance(junk), DEFAULT_PRODUCER_APPEARANCE);
    }
  });

  it('a missing appearance object is repaired (seed derives from the save seed)', () => {
    const a = load(undefined);
    assert.deepEqual({ ...a, seed: 0 }, { ...DEFAULT_PRODUCER_APPEARANCE, seed: 0 });
    assert.deepEqual(load(undefined), a, 'stable across loads');
    const noCustomization = saveWith(FULL);
    delete noCustomization.producerCustomization;
    assert.ok(migrateAndInitializeGameState(noCustomization).producerCustomization!.appearance);
  });

  it('save -> load -> save is stable for every fixture', () => {
    for (const fixture of FIXTURES) {
      const once = roundTrip(saveWith(fixture));
      const twice = roundTrip(once);
      assert.deepEqual(twice.producerCustomization, once.producerCustomization);
      assert.equal(JSON.stringify(twice.producerCustomization), JSON.stringify(once.producerCustomization));
    }
  });

  it('invalid values can never reach sprite rendering', () => {
    const legalHex = /^#[0-9a-f]{6}$/i;
    for (const fixture of FIXTURES) {
      const npc = producerNpcFor(roundTrip(saveWith(fixture)));
      assert.ok(PRODUCER_HAIR_SHAPES.includes(npc.hair.shape));
      assert.ok(PRODUCER_HAIR_COLOURS.includes(npc.hair.colour));
      assert.ok(PRODUCER_SHIRTS.includes(npc.clothes.top as never));
      assert.ok(PRODUCER_PANTS.includes(npc.clothes.lower as never));
      assert.ok(PRODUCER_SHOES.includes(npc.clothes.shoes as never));
      assert.ok(PRODUCER_BUILDS.includes(npc.body.build));
      assert.ok(PRODUCER_SKIN_TONES.includes(npc.body.skinTone));
      for (const hex of [npc.body.skinHex, npc.hair.hairHex, npc.clothes.topPrimaryHex, npc.clothes.lowerHex, npc.clothes.shoesHex]) assert.match(hex, legalHex);
    }
  });
});

describe('buildProducerNpc determinism (#213)', () => {
  it('same sanitised input gives the same sprite definition', () => {
    const a = buildProducerNpc(FULL as never, 'Quincy', 'golden_age');
    assert.deepEqual(buildProducerNpc(JSON.parse(JSON.stringify(FULL)), 'Quincy', 'golden_age'), a);
    assert.deepEqual(buildProducerNpc(sanitizeProducerAppearance(FULL), 'Quincy', 'golden_age'), a);
  });

  it('raw and sanitised legacy input agree', () => {
    assert.deepEqual(
      buildProducerNpc(PARTIAL as never, 'P', 'golden_age'),
      buildProducerNpc(sanitizeProducerAppearance(PARTIAL), 'P', 'golden_age'),
    );
    assert.deepEqual(buildProducerNpc(INVALID as never, 'P'), buildProducerNpc(DEFAULT_PRODUCER_APPEARANCE, 'P'));
  });
});

describe('sameProducerAppearance (#213)', () => {
  it('missing legacy fields do not read as dirty against their defaults', () => {
    assert.ok(sameProducerAppearance(PRE_EXPANDED as never, { ...DEFAULT_PRODUCER_APPEARANCE, ...PRE_EXPANDED } as never));
    assert.ok(sameProducerAppearance(undefined, DEFAULT_PRODUCER_APPEARANCE));
    assert.ok(sameProducerAppearance(INVALID as never, DEFAULT_PRODUCER_APPEARANCE));
  });

  it('every editable field is covered by change detection', () => {
    const alternatives: Record<(typeof PRODUCER_APPEARANCE_KEYS)[number], unknown> = {
      seed: FULL.seed + 1, build: 'slim', skinTone: 'fair', hair: 'bald', hairColour: 'neon_pink', shirt: 'turtleneck',
      pants: 'joggers', shoes: 'loafers', clothesColour: 'ruby', accessory: 'bandana',
    };
    assert.deepEqual([...PRODUCER_APPEARANCE_KEYS].sort(), Object.keys(sanitizeProducerAppearance({})).sort(), 'key list matches the model');
    for (const key of PRODUCER_APPEARANCE_KEYS) {
      assert.notEqual(FULL[key as keyof typeof FULL], alternatives[key], `${key}: alternative differs`);
      assert.equal(sameProducerAppearance(FULL as never, { ...FULL, [key]: alternatives[key] } as never), false, key);
    }
    assert.ok(sameProducerAppearance(FULL as never, { ...FULL } as never));
  });
});

describe('randomiseProducerAppearance (#213)', () => {
  it('is deterministic under a seed and differs across seeds', () => {
    const a = randomiseProducerAppearance(createSeededRandom('surprise'));
    assert.deepEqual(randomiseProducerAppearance(createSeededRandom('surprise')), a);
    const variants = new Set(Array.from({ length: 20 }, (_, i) => JSON.stringify(randomiseProducerAppearance(createSeededRandom(`s${i}`)))));
    assert.ok(variants.size > 15);
  });

  it('always returns a complete, legal appearance that sanitising leaves untouched', () => {
    const ids = PRODUCER_CLOTHES_COLOURS.map((c) => c.id);
    for (let i = 0; i < 300; i++) {
      const a = randomiseProducerAppearance(createSeededRandom(i));
      assert.deepEqual(Object.keys(a).sort(), [...PRODUCER_APPEARANCE_KEYS].sort());
      assert.deepEqual(sanitizeProducerAppearance(a), a);
      assert.ok(PRODUCER_BUILDS.includes(a.build) && PRODUCER_ACCESSORIES.includes(a.accessory) && ids.includes(a.clothesColour));
      assert.ok(Number.isInteger(a.seed) && a.seed >= 0 && a.seed < 100000);
    }
  });

  it('can reach every allowed value of every field', () => {
    const seen: Record<string, Set<string>> = {};
    for (let i = 0; i < 2000; i++) {
      const a = randomiseProducerAppearance(createSeededRandom(`cover${i}`));
      for (const key of PRODUCER_APPEARANCE_KEYS) if (key !== 'seed') (seen[key] ??= new Set()).add(a[key] as string);
    }
    const expected = {
      build: PRODUCER_BUILDS, skinTone: PRODUCER_SKIN_TONES, hair: PRODUCER_HAIR_SHAPES, hairColour: PRODUCER_HAIR_COLOURS,
      shirt: PRODUCER_SHIRTS, pants: PRODUCER_PANTS, shoes: PRODUCER_SHOES, accessory: PRODUCER_ACCESSORIES,
      clothesColour: PRODUCER_CLOTHES_COLOURS.map((c) => c.id),
    };
    for (const [key, values] of Object.entries(expected)) assert.equal(seen[key].size, values.length, key);
  });
});
