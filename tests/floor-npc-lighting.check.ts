/**
 * Floor NPC + era lighting kit presentation checks (CHARACTERS + LIGHTING slice).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  animStateForStaffStatus,
  gameEraToNpcEra,
  hashSeed,
  motionForNpcState,
  resolveFloorNpcDefinition,
  staffRoleToStudioRole,
} from '../src/features/sprites/floorNpcs';
import { getEraDecor, getEraLightingKit } from '../src/components/studio/studioDecorConfig';
import { identityFromSeed } from '../src/features/sprites/npcAppearance';

console.log('floor-npc-lighting checks…');

// Deterministic floor looks
const a = resolveFloorNpcDefinition({ seed: 42, role: 'engineer' }, 'analog60s');
const b = resolveFloorNpcDefinition({ seed: 42, role: 'engineer' }, 'analog60s');
assert.deepEqual(a, b);
assert.equal(a.role, 'engineer');
assert.equal(gameEraToNpcEra('digital80s'), '1980s');
assert.equal(gameEraToNpcEra('streaming2020s'), 'modern');
assert.equal(staffRoleToStudioRole('Producer'), 'producer');
assert.equal(staffRoleToStudioRole('Songwriter'), 'artist');
assert.equal(hashSeed('same'), hashSeed('same'));
assert.notEqual(hashSeed('a'), hashSeed('b'));

// Identity path preferred over seed fallback
const id = identityFromSeed(99, { role: 'producer', era: '1980s' });
const fromId = resolveFloorNpcDefinition({ identity: id, seed: 1 }, 'analog60s');
assert.equal(fromId.role, 'producer');
assert.equal(fromId.era, '1980s');

// Animation contract — reduced motion freezes; working is livelier than idle
const idle = motionForNpcState('idle', false);
const work = motionForNpcState('mixing', false);
const frozen = motionForNpcState('celebrate', true);
assert.ok(work.bobHz > idle.bobHz);
assert.equal(frozen.bobAmp, 0);
assert.equal(animStateForStaffStatus('Working', true), 'mixing');
assert.equal(animStateForStaffStatus('Idle', false), 'idle');
assert.equal(animStateForStaffStatus('Resting', false), 'break');

// Era lighting kits are data-driven per visual era
for (const era of ['analog60s', 'digital80s', 'internet2000s', 'streaming2020s'] as const) {
  const kit = getEraLightingKit(era);
  const decor = getEraDecor(era);
  assert.equal(kit.eraId, decor.eraId);
  assert.ok(kit.moteCount > 0 && kit.moteCount <= 12, 'Motes stay sparse enough to read as dust');
  assert.ok(kit.moteBaseAlpha <= 0.32, 'Motes remain subordinate to the room');
  assert.ok(kit.shaftAirAlpha > 0 && kit.shaftFloorAlpha > 0);
  assert.ok(kit.neonFromTier >= 4 && kit.neonFromTier <= 5);
  assert.ok(kit.propGlowScale >= 1);
}

// Studio floor wires baked NPCs + lighting kits (no second WebGL)
const webgl = readFileSync('src/components/WebGLCanvas.tsx', 'utf8');
const decor = readFileSync('src/components/studio/studioDecor.ts', 'utf8');
const room = readFileSync('src/components/StudioRoom.tsx', 'utf8');
assert.match(webgl, /bakeLayeredNpc|createFloorNpcVisual/, 'WebGLCanvas builds floor NPC visuals');
assert.match(webgl, /loadNpcPartsAtlas/, 'WebGLCanvas loads npc-parts atlas');
assert.match(webgl, /applyFloorNpcMotion/, 'WebGLCanvas applies npcAnimation motion');
assert.match(webgl, /getEraLightingKit/, 'WebGLCanvas uses era lighting kits');
assert.match(webgl, /buildDecorLights\(\{ spec: decorSpec, kit:/, 'Decor lights receive kit + tier');
assert.match(webgl, /addChild\(lights\.floorContainer\)/, 'Floor spill has its own below-props layer');
assert.ok(
  webgl.indexOf('addChild(lights.floorContainer)') < webgl.indexOf('addChild(dressing.props)'),
  'Floor spill is inserted before physical props',
);
assert.doesNotMatch(webgl, /buildLightShaft/, 'Only the era lighting layer owns the window shaft');
assert.doesNotMatch(webgl, /First gold record frame/, 'No generic gold plaque floats above the window');
assert.match(webgl, /getWallClockTime|getDaynessFromClockMinutes/, 'Day/night follows the studio clock');
assert.match(decor, /tierNeon|neonFromTier/, 'Decor lights draw tier neon from kit');
assert.match(decor, /kit\.moteCount|kit\.shaftAirAlpha/, 'Decor lights consume kit alphas');
assert.match(decor, /ambient\?\.dayness|DecorLightsAmbient/, 'Decor lights accept clock dayness');
assert.match(decor, /Nested isometric footprints/, 'Window spill uses a layered floor falloff');
assert.match(decor, /floorContent\.mask = floorMask/, 'Floor illumination is clipped to the room diamond');
assert.match(decor, /practicalFloorG/, 'Practical base pools stay on the floor layer');
assert.match(decor, /motes\.slice\(0, Math\.ceil\(motes\.length \/ 3\)\)/, 'Reduced motion uses a sparse static mote field');
assert.match(room, /floorFigures/, 'StudioRoom passes floorFigures');
assert.match(room, /animStateForStaffStatus/, 'StudioRoom maps staff status → anim state');
assert.match(webgl, /pixi-studio-canvas/, 'Single living-studio canvas remains tagged');

console.log('✓ floor-npc-lighting checks passed');
