import assert from 'node:assert/strict';
import {
  NPC_ANIMATION_STATES,
  buildNpcLayerStack,
  deserializeNpc,
  domMotionFor,
  generateModularNpc,
  identityFromSeed,
  identityOf,
  parseNpcVisualIdentity,
  resolveLayerFrames,
  resolveNpcAppearance,
  resolveNpcTag,
  serializeNpc,
  type ModularNpcDefinition,
  type NpcEra,
  type StudioRole,
} from '../src/features/sprites';
import * as data from '../src/features/sprites/npcAppearanceData';

console.log('Testing sprite factory (#78)...');

const ERAS: NpcEra[] = ['1960s', '1970s', '1980s', '1990s', '2000s', 'modern'];
const ROLES: StudioRole[] = ['engineer', 'producer', 'artist', 'manager', 'tech'];

// Fixture set: 6 eras x 5 roles x 2 seeds = 60 deterministic identities
const fixtures: ModularNpcDefinition[] = [];
for (const era of ERAS) for (const role of ROLES) for (const seed of [11, 4242]) fixtures.push(generateModularNpc(seed, { era, role }));
assert.ok(fixtures.length >= 25);

// 1. Deterministic output + same seed/version reproducibility
for (const npc of fixtures) {
  assert.deepEqual(generateModularNpc(npc.seed, { era: npc.era, role: npc.role }), npc);
  assert.deepEqual(resolveNpcAppearance(identityOf(npc)), npc);
}

// 2. Save/load identity stability (JSON round trip keeps identity AND rebuilds the same look)
for (const npc of fixtures) {
  const restored = deserializeNpc(serializeNpc(npc));
  assert.ok(restored, 'round-trips');
  assert.deepEqual(restored, npc);
  const fromIdentity = parseNpcVisualIdentity(JSON.parse(JSON.stringify(identityOf(npc))));
  assert.ok(fromIdentity);
  assert.deepEqual(resolveNpcAppearance(fromIdentity!, npc.name), npc);
}
assert.equal(deserializeNpc('not json'), null);
assert.equal(parseNpcVisualIdentity({ seed: 1, role: 'wizard', era: '1970s', appearanceVersion: 1 }), null);
assert.equal(parseNpcVisualIdentity({ seed: 1, role: 'tech', era: '1930s', appearanceVersion: 1 }), null);
// Legacy saves with no version read as version 1
assert.equal(parseNpcVisualIdentity({ seed: 5, role: 'tech', era: 'modern' })?.appearanceVersion, 1);

// 3. Versioning: an unknown newer version falls back to the newest known look instead of changing v1 or throwing
const v1 = resolveNpcAppearance({ seed: 77, role: 'artist', era: '1980s', appearanceVersion: 1 });
const future = resolveNpcAppearance({ seed: 77, role: 'artist', era: '1980s', appearanceVersion: 99 });
assert.equal(future.appearanceVersion, 1);
assert.deepEqual({ ...future }, { ...v1 });

// 4. No invalid enum/palette values anywhere (values come from typed data tables)
const inPool = <T,>(pool: readonly data.Weighted<T>[], v: T) => pool.some((e) => (Array.isArray(e) ? e[0] : e) === v);
for (const npc of fixtures) {
  const { era } = npc;
  assert.ok(inPool(data.ERA_HAIR_SHAPES[era], npc.hair.shape), `${npc.id} hair shape`);
  assert.ok(inPool(data.ERA_HAIR_COLOURS[era], npc.hair.colour) , `${npc.id} hair colour`);
  assert.ok(inPool(data.ERA_TOPS[era], npc.clothes.top), `${npc.id} top`);
  assert.ok(inPool(data.ERA_LOWERS[era], npc.clothes.lower), `${npc.id} lower`);
  assert.ok(inPool(data.ERA_SHOES[era], npc.clothes.shoes), `${npc.id} shoes`);
  assert.ok(inPool(data.ERA_OUTERWEAR[era], npc.clothes.outerwear), `${npc.id} outerwear`);
  assert.ok(inPool(data.ERA_GLASSES[era], npc.details.glasses), `${npc.id} glasses`);
  assert.ok(inPool(data.ERA_JEWELLERY[era], npc.details.jewellery), `${npc.id} jewellery`);
  assert.equal(npc.hair.hairHex, data.HAIR_HEX[npc.hair.colour]);
  assert.equal(npc.body.skinHex, data.SKIN_PALETTES[npc.body.skinTone].base);
  assert.deepEqual(npc.roleProps, data.ROLE_PROPS[npc.role]);
  for (const hex of [npc.body.skinHex, npc.hair.hairHex, npc.clothes.topPrimaryHex, npc.clothes.lowerHex, npc.clothes.shoesHex, npc.details.headphoneColor]) assert.match(hex, /^#[0-9a-f]{6}$/i);
}
// Era pools contain only typed values (the old generator leaked 'bleached_blonde' as a hair shape)
const shapes = new Set(['afro', 'pompadour', 'dreads', 'bob', 'messy_curly', 'slicked', 'buzzcut', 'long_wavy', 'topknot', 'bald']);
for (const pool of Object.values(data.ERA_HAIR_SHAPES)) for (const e of pool) assert.ok(shapes.has(Array.isArray(e) ? e[0] : e));

// 5. Variety: repeated NPCs are uncommon across 400 seeds
const seen = new Set<string>();
for (let seed = 0; seed < 400; seed++) {
  const n = generateModularNpc(seed, { era: '1990s', role: 'engineer' });
  seen.add(JSON.stringify({ ...n, id: '', seed: 0, name: '' }));
}
assert.ok(seen.size > 380, `expected >380 distinct looks in 400, got ${seen.size}`);
// Era weighting: 1980s use vivid hair colours more than 1960s
const vivid = (era: NpcEra) => Array.from({ length: 300 }, (_, s) => generateModularNpc(s, { era, role: 'tech' })).filter((n) => ['neon_pink', 'electric_blue'].includes(n.hair.colour)).length;
assert.ok(vivid('1980s') > vivid('1960s'));
// Bare seeds pick a stable role/era
assert.deepEqual(identityFromSeed(9), identityFromSeed(9));

// 6. Source hygiene: deterministic generation uses no Math.random
import fs from 'node:fs';
for (const f of ['npcAppearance.ts', 'npcAppearanceData.ts', 'npcGenerator.ts', 'npcLayers.ts']) {
  assert.ok(!/Math\.random/.test(fs.readFileSync(`src/features/sprites/${f}`, 'utf8')), `${f} must not use Math.random`);
}

// 7. Animation-state contract
assert.deepEqual([...NPC_ANIMATION_STATES], ['idle', 'walk', 'waiting', 'working', 'recording', 'mixing', 'break', 'celebrate', 'leaving']);
assert.equal(resolveNpcTag('recording', ['idle', 'work', 'celebrate']), 'work');
assert.equal(resolveNpcTag('celebrate', ['idle']), 'idle');
assert.equal(resolveNpcTag('walk', ['walk', 'idle']), 'walk');
assert.equal(resolveNpcTag('idle', []), null);
for (const s of NPC_ANIMATION_STATES) assert.ok(['idle', 'working', 'headbob', 'celebrate'].includes(domMotionFor(s)));
assert.equal(domMotionFor('mixing'), 'working');

// 8. Layer stack + missing optional layer fallback
const npc = generateModularNpc(123, { era: '1970s', role: 'engineer' });
const layers = buildNpcLayerStack(npc);
assert.equal(layers[0].slot, 'shadow');
assert.equal(layers.filter((l) => l.slot === 'hair').length, npc.hair.shape === 'bald' ? 0 : 1);
const order = layers.map((l) => l.slot);
assert.ok(order.indexOf('body') < order.indexOf('top') && order.indexOf('top') < order.indexOf('hair'));
const allVariants = new Set(layers.map((l) => l.variant));
const partial = resolveLayerFrames(layers, (v) => allVariants.has(v) && !v.startsWith('glasses/') && !v.startsWith('prop/'));
assert.deepEqual(partial.missingRequired, []);
assert.ok(partial.drawable.every((l) => !l.variant.startsWith('glasses/')));
const broken = resolveLayerFrames(layers, (v) => !v.startsWith('hair/') && !v.startsWith('body/shadow') && v !== 'body/' + npc.body.build);
assert.ok(broken.missingRequired.includes(`body/${npc.body.build}`));

// 9. Layer-stack CPU cost for 3/6/12 NPCs (presentation-neutral; real draw benchmarks live in docs/SPRITE_FACTORY.md)
for (const count of [3, 6, 12]) {
  const t0 = performance.now();
  for (let i = 0; i < 2000; i++) for (let n = 0; n < count; n++) buildNpcLayerStack(fixtures[n]);
  const ms = (performance.now() - t0) / 2000;
  console.log(`  layer stack build, ${count} NPCs: ${ms.toFixed(4)} ms/frame`);
  assert.ok(ms < 5);
}

console.log('sprite-factory: all checks passed');
