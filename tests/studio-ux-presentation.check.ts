/**
 * Static checks for studio UX / love-room presentation (post-toast merge).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webgl = readFileSync('src/components/WebGLCanvas.tsx', 'utf8');
const playCss = readFileSync('src/components/studio-play.css', 'utf8');
const guideCss = readFileSync('src/components/first-session-guide.css', 'utf8');
const indexPage = readFileSync('src/pages/Index.tsx', 'utf8');
const drawer = readFileSync('src/components/ContextDrawer.tsx', 'utf8');
const toastGate = readFileSync('src/lib/toastGate.ts', 'utf8');

console.log('studio-ux-presentation checks…');

// Toast gate must remain (do not revert toast-spam work)
assert.match(toastGate, /class ToastGate|export const toastGate/, 'toastGate must remain intact');

// Booth: mic before glass
const micIdx = webgl.toLowerCase().indexOf('mic stand deep in the booth');
const glassIdx = webgl.indexOf('Isolation glass partition in FRONT of the mic');
assert.ok(micIdx > 0 && glassIdx > micIdx, 'Mic must be authored before glass');
assert.match(webgl, /pixi-studio-canvas/, 'Studio canvas tagged for WebGL exclusivity');
assert.match(webgl, /Studio door/, 'Room has a studio door');
assert.match(webgl, /clockWrap\.skew\.x/, 'Clock skewed to wall plane');
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
assert.match(drawer, /1400px/, 'Session drawer uses wide viewport width');

console.log('✓ studio-ux-presentation checks passed');
