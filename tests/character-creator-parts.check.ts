import assert from 'node:assert/strict';
import { createNewGameState } from '../src/utils/newGameState';
import { AVAILABLE_ERAS } from '../src/data/eras';
import {
  applyPartPicks,
  cyclePart,
  creatorOptionsForEra,
  normalizePartPicks,
  parseNpcPartPicks,
} from '../src/features/sprites/characterCreatorParts';
import {
  identityFromSeed,
  parseNpcVisualIdentity,
  resolveNpcAppearance,
} from '../src/features/sprites/npcAppearance';

console.log('Testing granular character creator parts...');

const era = '1980s' as const;
const opts = creatorOptionsForEra(era);
assert.ok(opts.body.length >= 4, 'body catalog');
assert.ok(opts.hair.length >= 3, 'hair catalog');
assert.ok(opts.clothing.length >= 3, 'clothing catalog');
assert.ok(opts.accessories.length >= 2, 'accessories catalog');

const base = resolveNpcAppearance(identityFromSeed(15, { role: 'producer', era }));
const lookA = applyPartPicks(base, normalizePartPicks(era, { body: 0, hair: 0, clothing: 0, accessories: 0 }));
const lookB = applyPartPicks(base, normalizePartPicks(era, { body: 2, hair: 2, clothing: 1, accessories: 1 }));
assert.notDeepEqual(
  { body: lookA.body, hair: lookA.hair, clothes: lookA.clothes, details: lookA.details },
  { body: lookB.body, hair: lookB.hair, clothes: lookB.clothes, details: lookB.details },
);

const cycled = cyclePart(normalizePartPicks(era, { body: 0, hair: 0, clothing: 0, accessories: 0 }), 'hair', 1, era);
assert.equal(cycled.hair, 1);
assert.equal(cyclePart(cycled, 'hair', -1, era).hair, 0);

assert.equal(parseNpcPartPicks({ body: 1, hair: 2, clothing: 0, accessories: 0 })?.hair, 2);
assert.equal(parseNpcPartPicks({ body: 1, hair: 2 }), null);
assert.equal(parseNpcVisualIdentity({ seed: 3, role: 'producer', era, appearanceVersion: 1, parts: { body: 1 } }), null);

const appearance = identityFromSeed(21, {
  role: 'producer',
  era,
  parts: { body: 1, hair: 2, clothing: 1, accessories: 0 },
});
const resolved = resolveNpcAppearance(appearance, 'Echo');
assert.equal(resolved.name, 'Echo');
assert.equal(resolved.body.skinTone, opts.body[1].id);
assert.equal(resolved.hair.shape, opts.hair[2].id);
assert.equal(resolved.clothes.top, opts.clothing[1].id);
assert.equal(resolved.details.glasses, opts.accessories[0].id);

const classic = AVAILABLE_ERAS.find((e) => e.id === 'classic_rock')!;
const state = createNewGameState({
  selectedEra: classic.id,
  currentYear: classic.startYear,
  startingMoney: classic.startingMoney,
  originId: 'tape-purist',
  producer: { name: '  Echo  ', appearance },
  saveSeed: 7,
});
assert.equal(state.playerData.name, 'Echo');
assert.deepEqual(state.playerData.appearance, { ...appearance, role: 'producer' });
const loaded = JSON.parse(JSON.stringify(state));
assert.deepEqual(
  resolveNpcAppearance(loaded.playerData.appearance),
  resolveNpcAppearance(appearance),
);

assert.equal(
  createNewGameState({ producer: { name: ' ', appearance: { seed: NaN } as never } }).playerData.appearance,
  undefined,
);
assert.equal(createNewGameState().playerData.name, 'The Architect');

console.log('Character creator parts + save roundtrip passed');
