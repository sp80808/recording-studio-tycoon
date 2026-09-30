/**
 * Regression checks for the presentation/asset-pipeline hardening pass
 * (pixi-presentation-audit.md, GitHub issues #58 and #46).
 *
 * Static source checks — consistent with studio-ux-presentation.check.ts —
 * since these invariants are about code shape (ids matching, no second Pixi
 * app, depth bands assigned) rather than runtime pixel output.
 */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const webgl = readFileSync('src/components/WebGLCanvas.tsx', 'utf8');
const studioRoom = readFileSync('src/components/StudioRoom.tsx', 'utf8');
const indexPage = readFileSync('src/pages/Index.tsx', 'utf8');
const mainGameContent = readFileSync('src/components/MainGameContent.tsx', 'utf8');

console.log('pixi-presentation-hardening checks…');

/* ---- §5 hotspot alias drift ------------------------------------------- */
// The canonical id union lives in WebGLCanvas; StudioRoom's gamepad focus
// list and labels must only ever reference members of that exact union.
const hotspotUnionMatch = webgl.match(/export type StudioHotspotId = ([^;]+);/);
assert.ok(hotspotUnionMatch, 'StudioHotspotId union must be exported from WebGLCanvas');
const canonicalIds = Array.from(hotspotUnionMatch![1].matchAll(/'([a-zA-Z]+)'/g)).map((m) => m[1]);
assert.deepEqual(
  new Set(canonicalIds),
  new Set(['console', 'liveRoom', 'phone', 'clock', 'tv', 'shelf']),
  'StudioHotspotId union changed — update this test\'s expectations deliberately'
);

const staleAliases = ['liveroom', 'crt'];
const gamepadListMatch = studioRoom.match(/const STUDIO_HOTSPOTS: StudioHotspotId\[\] = \[([^\]]+)\];/);
assert.ok(gamepadListMatch, 'StudioRoom must define STUDIO_HOTSPOTS for gamepad focus');
for (const alias of staleAliases) {
  assert.ok(
    !gamepadListMatch![1].includes(`'${alias}'`),
    `STUDIO_HOTSPOTS must not use the stale alias '${alias}' — use the canonical StudioHotspotId spelling`
  );
}
for (const id of canonicalIds) {
  assert.ok(gamepadListMatch![1].includes(`'${id}'`), `STUDIO_HOTSPOTS must include canonical id '${id}'`);
}

const hotspotNamesMatch = studioRoom.match(/const HOTSPOT_NAMES: Record<StudioHotspotId, string> = \{([^}]+)\}/);
assert.ok(hotspotNamesMatch, 'StudioRoom must define HOTSPOT_NAMES');
for (const id of canonicalIds) {
  assert.match(hotspotNamesMatch![1], new RegExp(`\\b${id}:`), `HOTSPOT_NAMES must key by canonical id '${id}'`);
}

/* ---- §2/§7 depth bands -------------------------------------------------- */
assert.match(webgl, /const Z = \{ world: 0, depth: 100, fx: 3000 \} as const/, 'Shared Z depth-band namespace must stay a fixed, documented constant');
assert.match(webgl, /root\.sortableChildren = true/, 'Scene root must enable zIndex sorting');
// Tier furniture and staff must share one depth scale (Z.depth + iso-Y), not "furniture always behind" (the audit's bug).
assert.match(webgl, /upgrades\.zIndex = Z\.depth \+/, 'Tier-2 plant prop must be depth-sorted against staff');
assert.match(webgl, /lounge\.zIndex = Z\.depth \+/, 'Tier-3 lounge prop must be depth-sorted against staff');
assert.match(webgl, /roadCase\.zIndex = Z\.depth \+/, 'Tier-3 road-case prop must be depth-sorted separately from the lounge sofa');
assert.match(webgl, /pro\.zIndex = Z\.depth \+/, 'Tier-4 rig prop must be depth-sorted against staff');
assert.match(webgl, /fig\.zIndex = Z\.depth \+ spot\.y/, 'Staff figures must stay on the Z.depth + iso-Y depth scale');
assert.match(webgl, /lights\.container\.zIndex = Z\.fx/, 'Lighting must always render in the fx band, above furniture/staff');
assert.match(webgl, /bloomLayer\.zIndex = Z\.fx/, 'Bloom must always render in the fx band, on top of everything else');

/* ---- §7 world-anchored chore badges ------------------------------------ */
assert.match(webgl, /export type HotspotAnchors = Partial<Record<StudioHotspotId/, 'WebGLCanvas must export a HotspotAnchors type for DOM badge projection');
assert.match(webgl, /onHotspotAnchors\?: \(anchors: HotspotAnchors\) => void/, 'WebGLCanvas must accept an onHotspotAnchors callback prop');
assert.match(webgl, /hotspotHits: Partial<Record<StudioHotspotId, Container>>/, 'Scene refs must track hotspot hit containers to project their screen bounds');
assert.match(studioRoom, /onHotspotAnchors=\{setAnchors\}/, 'StudioRoom must wire onHotspotAnchors into local anchor state');
assert.match(studioRoom, /anchorStyle/, 'StudioRoom must position chore badges via an anchor-driven style helper, not fixed CSS corners alone');
// Performance contract (#46): anchors only update state when a hotspot's projected bounds actually move, not every frame.
assert.match(webgl, /const next: HotspotAnchors = \{\};/, 'Anchor projection must build a fresh anchors map to diff against the previous frame before calling back into React');

/* ---- §8 no second gameplay Pixi Application ---------------------------- */
for (const [name, src] of [
  ['Index.tsx', indexPage],
  ['MainGameContent.tsx', mainGameContent],
  ['StudioRoom.tsx', studioRoom],
] as const) {
  assert.ok(
    !src.includes('PixiProjectCardsBridge'),
    `${name} must not mount PixiProjectCardsBridge — it is a second continuous Pixi Application and violates GPU exclusivity during studio play`
  );
}

/* ---- §6/§9 resize/rebuild does not leak canvases or listeners ---------- */
assert.match(webgl, /app\.destroy\(true, \{ children: true \}\)/, 'Unmount must fully destroy the Pixi Application');
assert.match(webgl, /container\.innerHTML = ''/, 'Unmount must clear the container so no orphaned canvas remains');
assert.match(webgl, /detachInteractions\?\.\(\)/, 'Unmount must detach the pointer/wheel/gesture listeners it attached');
assert.match(webgl, /observer\.disconnect\(\)/, 'Unmount must disconnect the ResizeObserver');
// Exactly one ticker callback is registered at boot; rebuild() must never re-register another one.
const tickerAddCount = (webgl.match(/app\.ticker\.add\(/g) ?? []).length;
assert.equal(tickerAddCount, 1, 'Only one ticker callback may be registered — rebuild() must not add a second animation loop');

console.log('✓ pixi-presentation-hardening checks passed');
