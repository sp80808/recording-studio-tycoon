/** #81 perf contract: CPU cost and update-rate budget for 1 / 6 / 20 gear (Node; no GPU). */
import assert from 'node:assert';
import {
  GEAR_ARCHETYPE_LIST, GEAR_FIDELITY, demoMeterLevel, toSpriteVisualState,
} from '@/features/gearStudio/gearVisualState';
import { reelAnimationSpeed, reelFrameAngles, REEL_FRAME_COUNT } from '@/features/gearStudio/gearReelMath';

const run = (n: number, hz: number, seconds: number) => {
  const ticks = hz * seconds;
  const t0 = performance.now();
  let sink = 0;
  for (let tick = 0; tick < ticks; tick++) {
    for (let g = 0; g < n; g++) {
      const lvl = demoMeterLevel({ seed: `g${g}`, timeMs: tick * (1000 / hz), base: 0.5 });
      sink += toSpriteVisualState(`g${g}`, GEAR_ARCHETYPE_LIST[g % 10], { powered: true, activity: lvl, condition: 80 }).warning ? 1 : 0;
    }
  }
  const ms = performance.now() - t0;
  return { n, hz, updatesPerSec: n * hz, msPerSimSecond: +(ms / seconds).toFixed(3), sink };
};

const results = [
  { label: '1 inspector (8 Hz)', ...run(1, GEAR_FIDELITY.inspector.updateHz, 60) },
  { label: '6 in-world (4 Hz)', ...run(6, GEAR_FIDELITY['living-studio'].updateHz, 60) },
  { label: '20 in-world (4 Hz)', ...run(20, GEAR_FIDELITY['living-studio'].updateHz, 60) },
];
for (const r of results) console.log(`${r.label}: ${r.updatesPerSec} updates/s, ${r.msPerSimSecond} ms CPU per simulated second`);
assert(results[2].msPerSimSecond < 5, '20 in-world indicators cost < 5 ms CPU per second');
assert(results[2].updatesPerSec <= 80, 'in-world update budget <= 80 updates/s');

// Minimal/reduced motion: zero updates and static reel.
assert(GEAR_FIDELITY.minimal.updateHz === 0);
const tape = toSpriteVisualState('t', 'tape-machine', { powered: true, activity: 0.5, condition: 90, transport: 'play' });
assert(reelAnimationSpeed(tape, false) > 0 && reelAnimationSpeed(tape, true) === 0, 'reel static under reduced motion');
assert(reelAnimationSpeed({ ...tape, powered: false }, false) === 0 && reelAnimationSpeed({ ...tape, transport: 'stopped' }, false) === 0, 'reel static when off/stopped');
assert(reelAnimationSpeed({ ...tape, transport: 'rewind' }, false) < 0, 'rewind spins backwards');
assert(reelFrameAngles().length === REEL_FRAME_COUNT, 'reel frame set size');
console.log('gear bench checks passed');

import fs from 'node:fs';
const canvas = fs.readFileSync('src/components/WebGLCanvas.tsx', 'utf8');
assert(canvas.includes('applyReelState') && canvas.includes('reel.gotoAndStop(0)'), 'Living Studio mounts parked AnimatedSprite reels');
assert(canvas.includes('r.update(ticker)') && !canvas.includes('Ticker.shared'), 'reels advance from the scene ticker (respects fps cap / hidden tab)');
console.log('living studio reel wiring checks passed');
