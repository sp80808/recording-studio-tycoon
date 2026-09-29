import assert from 'node:assert';
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

console.log('flight-case-connectors: all checks passed');
