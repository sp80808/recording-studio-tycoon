import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import {
  createProvenanceManifest,
  framesForTag,
  normalizeAsepriteExport,
  packFrames,
  parseFrameFilename,
  resolveAnimation,
  validateAtlasReport,
  validatePixiAtlas,
  validateProvenance,
  type PixiTextureAtlasSchema,
} from '../src/features/sprites';
import { Texture, TextureSource } from 'pixi.js';
import { buildSpritesheet, createAtlasAnimation } from '../src/features/sprites/pipeline/pixiAtlasLoader';
import { createLayeredNpc } from '../src/features/sprites/pixiNpc';
import { generateModularNpc } from '../src/features/sprites';

console.log('Testing asset pipeline (#79)...');

const frame = (x: number, y = 0) => ({
  frame: { x, y, w: 32, h: 48 }, rotated: false, trimmed: false,
  spriteSourceSize: { x: 0, y: 0, w: 32, h: 48 }, sourceSize: { w: 32, h: 48 }, pivot: { x: 0.5, y: 1 },
});
const good = (): PixiTextureAtlasSchema => ({
  frames: { 'npc/a/idle/000': frame(0), 'npc/a/idle/001': frame(32), 'npc/a/work/000': frame(64) },
  animations: { idle: ['npc/a/idle/000', 'npc/a/idle/001'], work: ['npc/a/work/000'] },
  meta: { app: 't', version: '1', image: 'a.png', format: 'RGBA8888', size: { w: 128, h: 64 }, scale: '1' },
});
const codes = (a: PixiTextureAtlasSchema, o = {}) => validateAtlasReport(a, o).issues.filter((i) => i.severity === 'error').map((i) => i.code);

// Validator
assert.deepEqual(codes(good(), { kind: 'npc', enforceNaming: true }), []);
assert.equal(validatePixiAtlas(good()).valid, true);
let a = good(); a.frames['npc/a/idle/001'].frame.x = 120;
assert.deepEqual(codes(a), ['FRAME_OUT_OF_BOUNDS']);
a = good(); a.frames['npc/a/idle/000'].pivot = { x: 1.5, y: 1 };
assert.deepEqual(codes(a), ['PIVOT_INVALID']);
a = good(); delete a.animations!.idle; 
assert.deepEqual(codes(a, { kind: 'npc' }), ['TAG_REQUIRED_MISSING']);
a = good(); a.animations!.idle = ['npc/a/idle/000', 'nope'];
assert.deepEqual(codes(a), ['ANIMATION_BAD_REFERENCE']);
a = good(); a.animations!.work = [];
assert.deepEqual(codes(a), ['ANIMATION_EMPTY']);
a = good(); (a.meta as { format: string }).format = 'PNG8';
assert.deepEqual(codes(a), ['META_FORMAT_UNSUPPORTED']);
a = good(); a.meta.image = '';
assert.deepEqual(codes(a), ['META_IMAGE_MISSING']);
a = good(); a.frames['Bad Name'] = frame(96);
assert.deepEqual(codes(a, { enforceNaming: true }), ['FRAME_NAME_INVALID']);
a = good(); a.frames['npc/a/idle/001'].sourceSize = { w: 40, h: 48 };
assert.deepEqual(codes(a, { kind: 'npc' }), ['FRAME_NATIVE_SIZE']);
a = good(); a.frames['npc/a/idle/001'].frame = { x: 10, y: 0, w: 32, h: 48 };
assert.ok(validateAtlasReport(a).issues.some((i) => i.code === 'FRAME_OVERLAP' && i.severity === 'warning'));
assert.deepEqual(codes({ frames: {}, meta: good().meta }), ['FRAMES_EMPTY']);
// machine readable
const rep = validateAtlasReport(Object.assign(good(), { frames: {} }));
assert.ok(rep.issues.every((i) => i.code && i.path !== undefined && i.message));
assert.doesNotThrow(() => JSON.stringify(rep));

// Provenance
const base = {
  schemaVersion: 2 as const, assetId: 'npc-a', sourceType: 'aseprite' as const, author: 'x', license: 'In-house (CC0)',
  toolVersion: '1', pipelineSteps: ['a'], dimensions: { width: 1, height: 1 }, sourceDimensions: { width: 1, height: 1 },
  paletteId: 'p', palette: ['#000000'], frameTags: ['idle'], creationTimestamp: '2026-01-01T00:00:00.000Z', checksum: 'abc',
};
assert.equal(validateProvenance(base).valid, true);
assert.equal(validateProvenance(null).valid, false);
assert.equal(validateProvenance({ ...base, license: '' }).valid, false);
assert.equal(validateProvenance({ ...base, palette: [] }).valid, false);
assert.equal(validateProvenance({ ...base, sourceType: 'generative_ai_cleaned' }).valid, false, 'generated art needs generationSteps');
assert.equal(validateProvenance({ ...base, license: 'CC-BY 4.0' }).valid, false, 'external licence needs sourceUrl');
assert.equal(validateProvenance({ ...base, license: 'CC-BY 4.0', sourceUrl: 'https://example.org/x' }).valid, true);
// deterministic manifests
const pa = createProvenanceManifest({ ...base, creationTimestamp: '2026-01-01T00:00:00.000Z', checksum: undefined });
const pb = createProvenanceManifest({ ...base, creationTimestamp: '2026-01-01T00:00:00.000Z', checksum: undefined });
assert.deepEqual(pa, pb);

// Aseprite/Pixelorama intake (array + hash frames)
const ase = {
  frames: [0, 1, 2].map((i) => ({ frame: { x: i * 16, y: 0, w: 16, h: 16 }, sourceSize: { w: 16, h: 16 }, duration: 80 })),
  meta: { image: 's.png', size: { w: 48, h: 16 }, frameTags: [{ name: 'idle', from: 0, to: 1 }, { name: 'work', from: 2, to: 2 }], slices: [{ name: 'pivot', keys: [{ frame: 0, bounds: { x: 8, y: 15, w: 1, h: 1 }, pivot: { x: 8, y: 16 } }] }] },
};
const imp = normalizeAsepriteExport(ase, { kind: 'prop', id: 'lamp' });
assert.deepEqual(Object.keys(imp.atlas.frames), ['prop/lamp/idle/000', 'prop/lamp/idle/001', 'prop/lamp/work/000']);
assert.deepEqual(imp.atlas.frames['prop/lamp/idle/000'].pivot, { x: 0.5, y: 1 });
assert.equal(imp.durations['prop/lamp/work/000'], 80);
const hashForm = normalizeAsepriteExport({ ...ase, frames: Object.fromEntries(ase.frames.map((f, i) => [`f${i}`, f])) }, { kind: 'prop', id: 'lamp' });
assert.deepEqual(hashForm.atlas, imp.atlas);
assert.throws(() => normalizeAsepriteExport({ ...ase, meta: { ...ase.meta, frameTags: [] } }, { kind: 'prop', id: 'lamp' }), /frameTags/);
assert.throws(() => normalizeAsepriteExport({ ...ase, meta: { ...ase.meta, frameTags: [{ name: 'idle', from: 0, to: 9 }] } }, { kind: 'prop', id: 'lamp' }), /does not exist/);

// Frame packer (Blender-style loose frames): deterministic, valid
assert.deepEqual(parseFrameFilename('walk_003.png'), { tag: 'walk', index: 3 });
assert.equal(parseFrameFilename('weird.png'), null);
const loose = [{ tag: 'work', index: 1, w: 40, h: 40 }, { tag: 'idle', index: 0, w: 40, h: 40 }, { tag: 'work', index: 0, w: 40, h: 40 }];
const p1 = packFrames(loose, { kind: 'gear', id: 'desk', image: 'desk.png', maxWidth: 100 });
const p2 = packFrames([...loose].reverse(), { kind: 'gear', id: 'desk', image: 'desk.png', maxWidth: 100 });
assert.deepEqual(p1.atlas, p2.atlas, 'packing is order-independent and deterministic');
assert.deepEqual(codes(p1.atlas, { kind: 'gear', enforceNaming: true }), []);

// Resolver + missing-frame fallback
const atlas = good();
assert.deepEqual(framesForTag(atlas, 'idle'), ['npc/a/idle/000', 'npc/a/idle/001']);
assert.equal(resolveAnimation(atlas, 'work')?.fellBack, false);
const fb = resolveAnimation(atlas, 'celebrate', ['work', 'idle']);
assert.equal(fb?.tag, 'work'); assert.equal(fb?.fellBack, true);
assert.equal(resolveAnimation(atlas, 'celebrate', ['nothing']), null);
delete atlas.frames['npc/a/idle/000'];
assert.deepEqual(framesForTag(atlas, 'idle'), ['npc/a/idle/001'], 'missing frames are skipped, not thrown');

// Golden: committed sample assets build reproducibly and validate (no paid tools needed)
execFileSync(process.execPath, ['scripts/assets.cjs', 'validate'], { stdio: 'pipe' });
const golden = JSON.parse(fs.readFileSync('public/assets/atlases/npc/sample-engineer.json', 'utf8')) as PixiTextureAtlasSchema;
assert.deepEqual(Object.keys(golden.animations!).sort(), ['celebrate', 'idle', 'work']);
assert.deepEqual(golden.frames['npc/sample-engineer/idle/000'].pivot, { x: 0.5, y: 1 });
const before = fs.readFileSync('public/assets/atlases/gear/sample-monitor.png');
execFileSync(process.execPath, ['scripts/assets.cjs', 'build'], { stdio: 'pipe' });
assert.ok(before.equals(fs.readFileSync('public/assets/atlases/gear/sample-monitor.png')), 'rebuilding is byte-identical');
execFileSync(process.execPath, ['scripts/assets.cjs', 'validate'], { stdio: 'pipe' });

// Tampering is caught
const pjson = 'public/assets/atlases/npc/sample-engineer.provenance.json';
const original = fs.readFileSync(pjson, 'utf8');
try {
  fs.writeFileSync(pjson, JSON.stringify({ ...JSON.parse(original), license: '' }));
  assert.throws(() => execFileSync(process.execPath, ['scripts/assets.cjs', 'validate'], { stdio: 'pipe' }), /./);
} finally { fs.writeFileSync(pjson, original); }

// Pixi integration: load the built atlas, resolve a tag (with fallback), get a pivoted AnimatedSprite
(async () => {
  const built = JSON.parse(fs.readFileSync('public/assets/atlases/npc/sample-engineer.json', 'utf8')) as PixiTextureAtlasSchema;
  const texture = new Texture({ source: new TextureSource({ width: built.meta.size.w, height: built.meta.size.h }) });
  const loaded = await buildSpritesheet(built, texture);
  assert.equal(Object.keys(loaded.sheet.textures).length, 6);
  const sprite = createAtlasAnimation(loaded, 'recording', ['work', 'idle']);
  assert.ok(sprite, 'recording falls back to work');
  assert.equal(sprite!.totalFrames, 2);
  assert.deepEqual([sprite!.anchor.x, sprite!.anchor.y], [0.5, 1]);
  assert.equal(createAtlasAnimation(loaded, 'nope', ['also-nope']), null, 'nothing resolves -> caller draws its fallback');
  // Layered NPC: the in-house part atlas covers every required layer of every generated NPC
  const parts = JSON.parse(fs.readFileSync('public/assets/atlases/layer/npc-parts.json', 'utf8')) as PixiTextureAtlasSchema;
  const partsLoaded = await buildSpritesheet(parts, new Texture({ source: new TextureSource({ width: parts.meta.size.w, height: parts.meta.size.h }) }));
  for (let seed = 0; seed < 300; seed++) {
    const npc = generateModularNpc(seed);
    const layered = createLayeredNpc(partsLoaded, npc);
    assert.deepEqual(layered.missingRequired, [], `${npc.id} has art for every required layer`);
    assert.equal(layered.container.children.length, layered.spriteCount);
    assert.ok(layered.spriteCount >= 6);
  }
  console.log('asset-pipeline: all checks passed');
})().catch((e) => { console.error(e); process.exit(1); });
