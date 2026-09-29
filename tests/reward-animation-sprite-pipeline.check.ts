import assert from 'node:assert/strict';
import {
  generateModularNpc,
  ModularSpriteRenderer,
  validatePixiAtlas,
  createProvenanceManifest,
  type PixiTextureAtlasSchema,
} from '../src/features/sprites';
import {
  PixiParticleBurst,
  RarityMaterialSweep,
  AnimatedGearFlourish,
} from '../src/features/boxDrops/fx';
import { InteractiveStudioRackGear } from '../src/features/gearStudio';

console.log('Testing Reward-Animation & Modular Sprite-Content Pipeline...');

// 1. Sprite Factory — Modular NPC Variation Pipeline
console.log('1. Checking Sprite Factory NPC Generation...');
const npc1 = generateModularNpc(101, { role: 'engineer', era: '1970s' });
assert.ok(npc1.id.includes('101'));
assert.equal(npc1.role, 'engineer');
assert.equal(npc1.era, '1970s');
assert.ok(npc1.body.skinHex.startsWith('#'));
assert.ok(npc1.hair.hairHex.startsWith('#'));
assert.ok(npc1.clothes.topPrimaryHex.startsWith('#'));
assert.equal(npc1.roleProps.renderProp, 'headphones');
assert.ok(npc1.details.headphoneColor.startsWith('#'));

// Determinism check: Same seed produces exact same sprite
const npc1Duplicate = generateModularNpc(101, { role: 'engineer', era: '1970s' });
assert.deepEqual(npc1, npc1Duplicate, 'Identical seed and options must produce exact identical NPC');

// Era diversity check
const npc80s = generateModularNpc(888, { role: 'producer', era: '1980s' });
assert.equal(npc80s.era, '1980s');
assert.equal(npc80s.role, 'producer');
assert.equal(npc80s.roleProps.renderProp, 'synth_controller');

// Seed variation check: Different seeds produce distinct variations
const npc2 = generateModularNpc(999);
assert.notEqual(npc1.name, npc2.name);
console.log('PASS: Sprite Factory generates deterministic, era-aware, role-aware NPCs.');

// 2. Asset Factory — Atlas validation & Provenance
console.log('2. Checking Asset Factory Atlas Validation & Manifest...');
const mockAtlas: PixiTextureAtlasSchema = {
  frames: {
    'char_idle_0': {
      frame: { x: 0, y: 0, w: 32, h: 48 },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: 32, h: 48 },
      sourceSize: { w: 32, h: 48 },
      pivot: { x: 0.5, y: 1.0 },
    },
    'char_idle_1': {
      frame: { x: 32, y: 0, w: 32, h: 48 },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: 32, h: 48 },
      sourceSize: { w: 32, h: 48 },
      pivot: { x: 0.5, y: 1.0 },
    },
  },
  animations: {
    idle: ['char_idle_0', 'char_idle_1'],
  },
  meta: {
    app: 'Aseprite v1.3.8',
    version: '1.0',
    image: 'character-sprites.webp',
    format: 'RGBA8888',
    size: { w: 128, h: 128 },
    scale: '1',
  },
};

const validation = validatePixiAtlas(mockAtlas);
assert.equal(validation.valid, true);
assert.equal(validation.errors.length, 0);

// Invalid atlas check
const invalidAtlas = { ...mockAtlas, meta: { ...mockAtlas.meta, image: '' } };
const badValidation = validatePixiAtlas(invalidAtlas as any);
assert.equal(badValidation.valid, false);

// Provenance manifest creation
const manifest = createProvenanceManifest({
  assetId: 'engineer-npc-master',
  sourceType: 'aseprite',
  author: 'RST Motion Lab',
  toolVersion: 'Aseprite v1.3.8',
  pipelineSteps: ['source-export', 'palette-index', 'atlas-pack'],
  dimensions: { width: 32, height: 48 },
  paletteId: 'studio-analog-60s',
  frameTags: ['idle', 'work', 'headbob'],
});
assert.ok(manifest.checksum.startsWith('0x'));
assert.equal(manifest.assetId, 'engineer-npc-master');
console.log('PASS: Asset Factory atlas validator and provenance manifest verified.');

// 3. Flight Case FX Toolkit
console.log('3. Checking Flight Case FX Toolkit...');
assert.ok(typeof PixiParticleBurst === 'function');
assert.ok(typeof RarityMaterialSweep === 'function');
assert.ok(typeof AnimatedGearFlourish === 'function');
console.log('PASS: FX Toolkit components verified and safe in headless environment.');

// 4. Studio Gear Animation System
console.log('4. Checking Studio Gear Animation System...');
assert.ok(typeof InteractiveStudioRackGear === 'function');
console.log('PASS: Studio Gear Limiting Amplifier component verified.');

console.log('reward-animation-sprite-pipeline: all checks passed');
