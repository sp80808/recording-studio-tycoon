/** k6e.1 audio engine verification (source-assert: WebAudio can't init in node). */
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const baseDir = process.cwd();
const engine = fs.readFileSync(path.join(baseDir, 'src/utils/audioSystem.ts'), 'utf8');
const settings = fs.readFileSync(path.join(baseDir, 'src/contexts/SettingsContext.tsx'), 'utf8');

let passed = 0;
const ok = (cond: boolean, msg: string): void => {
  assert(cond, `FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

// 1. All synth voices route to sfxGain (mute-respecting); only the 3-line
// graph setup may reference masterGain connections.
const masterConnects = engine.match(/\.(masterGain|sfxGain|musicGain)\.connect\(/g) ?? [];
ok(masterConnects.length === 3, `graph setup is exactly 3 connects (got ${masterConnects.length})`);
const synthToSfx = (engine.match(/connect\(this\.sfxGain!?\)/g) ?? []).length;
ok(synthToSfx >= 16, `>=16 synth voices route to sfxGain (got ${synthToSfx})`);
ok(!/gainNode\.connect\(this\.masterGain/.test(engine), 'no synth voice bypasses mute via masterGain');
ok(!/noiseGain\.connect\(this\.masterGain/.test(engine), 'no noise voice bypasses mute via masterGain');

// 2. Throttle infrastructure + high-frequency guards
ok(engine.includes('private lastPlayed: Map<string, number>'), 'throttle timestamp map exists');
ok(engine.includes('shouldThrottle(key: string, ms: number)'), 'throttle gate exists');
for (const [key, ms] of [['slider', '60'], ['param', '60'], ['hover', '90'], ['error', '150']] as const) {
  ok(engine.includes(`shouldThrottle('${key}', ${ms})`), `throttle guard: ${key} @ ${ms}ms`);
}

// 3. New tactile voices
for (const m of ['playWorkTick', 'playComboUp', 'playRankReveal', 'private blip']) {
  ok(engine.includes(m), `tactile voice exists: ${m}`);
}
ok(engine.includes(`shouldThrottle('workTick', 90)`), 'workTick throttled @ 90ms');
ok(engine.includes(`shouldThrottle('comboUp', 120)`), 'comboUp throttled @ 120ms');
ok(engine.includes(`shouldThrottle('rankReveal', 500)`), 'rankReveal throttled @ 500ms');
for (const c of ["'event'", "'reviewReveal'", "'workTick'", "'comboUp'", "'rankS'", "'rankSPlus'"] as const) {
  ok(engine.includes(`case ${c}:`), `playUISound case ${c}`);
}

// 4. Mute propagation: single source of truth, undefined-safe
ok(settings.includes('gameAudio.updateSettings(audioPatch)'), 'SettingsContext pushes to gameAudio');
ok(settings.includes('masterVolume !== undefined'), 'undefined-safe patch (no volume clobbering)');
ok(settings.includes('gameAudio.updateSettings({ ...defaultSettings })'), 'reset propagates too');

console.log(`audio-engine: all ${passed} checks passed`);
