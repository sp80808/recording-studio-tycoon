/**
 * Static checks for studio UX / love-room presentation (post-toast merge).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webgl = readFileSync('src/components/WebGLCanvas.tsx', 'utf8');
const decor = readFileSync('src/components/studio/studioDecor.ts', 'utf8');
const playCss = readFileSync('src/components/studio-play.css', 'utf8');
const guideCss = readFileSync('src/components/first-session-guide.css', 'utf8');
const indexPage = readFileSync('src/pages/Index.tsx', 'utf8');
const drawer = readFileSync('src/components/ContextDrawer.tsx', 'utf8');
const toastGate = readFileSync('src/lib/toastGate.ts', 'utf8');

console.log('studio-ux-presentation checks…');

// Toast gate must remain (do not revert toast-spam work)
assert.match(toastGate, /class ToastGate|export const toastGate/, 'toastGate must remain intact');

// Booth: an enclosed room (interior behind the glass, side wall, roof) — never a bare floating pane
const micIdx = decor.toLowerCase().indexOf('mic stand + pop filter + stool + music stand, deep in the booth');
const glassIdx = decor.indexOf('Glass front (y = y1)');
assert.ok(micIdx > 0 && glassIdx > micIdx, 'Mic must be authored before glass (interior is drawn behind the glass front)');
assert.match(decor, /Outer face of the right side wall/, 'Booth has side walls');
assert.match(decor, /Flat roof/, 'Booth is enclosed by a roof');
assert.match(decor, /Header beam/, 'Booth has a header beam');
assert.match(webgl, /buildLiveBooth\(\)/, 'Scene builds the enclosed live booth');
assert.match(webgl, /pixi-studio-canvas/, 'Studio canvas tagged for WebGL exclusivity');
assert.match(webgl, /Studio door/, 'Room has a studio door');
// Clock is drawn in the wall plane (real face + hands), not a skewed billboard ellipse
assert.match(webgl, /buildWallClock\(/, 'Clock is a wall-plane face');
assert.match(decor, /leftFace\(/, 'Clock geometry is projected onto the left wall plane');
assert.match(webgl, /half-tile/, 'Props use half-tile grid snap');

// HUD / splash
assert.match(playCss, /--studio-dock-clearance/, 'Dock clearance CSS variable');
assert.match(playCss, /studio-boot-gate/, 'Boot gate styles present');
assert.match(indexPage, /studio-boot-gate/, 'Index uses boot gate');
assert.match(indexPage, /Warming up the studio/, 'Boot gate friendly copy');

// Adaptive coach + session drawer
assert.match(guideCss, /max-width: 768px/, 'Coach has narrow breakpoint');
assert.match(guideCss, /take-calibration/, 'Coach hides during take calibration');
assert.match(drawer, /data-studio-drawer/, 'Session drawer marks chrome host');
assert.match(drawer, /min\(40vw,680px\)/, 'Session drawer docks beside the studio at a capped width');

console.log('✓ studio-ux-presentation checks passed');
