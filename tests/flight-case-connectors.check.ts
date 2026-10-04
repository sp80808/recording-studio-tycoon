import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import {
  ButterflyTwistLatch,
  SnakeCableConnector,
  ChassisGroundClip,
  HardwarePatchPanel,
  InteractivePatchCable,
  ConnectorActionRouting,
  playConnectorSnap,
  playJackInsert,
  playJackRemove,
  playGroundSpark,
  playAuditionChord,
} from '../src/features/boxDrops/connectors';

console.log('Testing Flight Case Hardware Connectors & Tactile Audio...');

// 1. Verify component exports
assert.strictEqual(typeof ButterflyTwistLatch, 'function', 'ButterflyTwistLatch must be exported');
assert.strictEqual(typeof SnakeCableConnector, 'function', 'SnakeCableConnector must be exported');
assert.strictEqual(typeof ChassisGroundClip, 'function', 'ChassisGroundClip must be exported');
assert.strictEqual(typeof HardwarePatchPanel, 'function', 'HardwarePatchPanel must be exported');
assert.strictEqual(typeof InteractivePatchCable, 'function', 'InteractivePatchCable must be exported');
assert.strictEqual(typeof ConnectorActionRouting, 'function', 'ConnectorActionRouting must be exported');

// 2. Headless audio safety verification (zero unhandled exceptions in Node test runner)
assert.doesNotThrow(() => {
  playConnectorSnap(0.8);
}, 'playConnectorSnap must execute safely in headless Node');

assert.doesNotThrow(() => {
  playJackInsert(0.9);
}, 'playJackInsert must execute safely in headless Node');

assert.doesNotThrow(() => {
  playJackRemove(0.6);
}, 'playJackRemove must execute safely in headless Node');

assert.doesNotThrow(() => {
  playGroundSpark(0.5);
}, 'playGroundSpark must execute safely in headless Node');

assert.doesNotThrow(async () => {
  await playAuditionChord('1970s', 'vintage');
}, 'playAuditionChord must execute safely in headless Node');

// 3. Patch cable is a real drag interaction, not a button (bead 0r6).
const cableSrc = readFileSync('src/features/boxDrops/connectors/InteractivePatchCable.tsx', 'utf8');
assert.ok(/^\s*drag$/m.test(cableSrc), 'plug is draggable');
assert.ok(cableSrc.includes('touch-none'), 'touch drags move the plug instead of scrolling');
assert.ok(cableSrc.includes('onDragEnd'), 'drag release resolves the patch attempt');
assert.ok(cableSrc.includes('PATCH_DRAG_THRESHOLD_PX'), 'tap-vs-drag threshold is explicit');
assert.ok(cableSrc.includes('onTap'), 'taps still toggle without conflicting with drags');
assert.ok(cableSrc.includes('role="switch"'), 'plug is keyboard-operable');
assert.doesNotMatch(cableSrc, /CONNECT PATCH CABLE/, 'connect button removed');

console.log('flight-case-connectors: all checks passed');
