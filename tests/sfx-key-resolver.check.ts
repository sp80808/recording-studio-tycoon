/**
 * Lightweight guard: known playSound caller keys must never resolve to a
 * site-root fetch (no bare ids like /xp-tick). ChartsPanel /audio/... paths
 * and preload buffer names still work.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { __sfxResolverTest } from '../src/utils/audioSystem';

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8');
let passed = 0;
const ok = (c: boolean, m: string) => {
  assert.ok(c, `FAIL: ${m}`);
  passed += 1;
  console.log(`PASS: ${m}`);
};

const audio = read('src/utils/audioSystem.ts');
ok(/SOUND_ALIASES/.test(audio), 'SOUND_ALIASES map present');
ok(/resolveSoundSource/.test(audio), 'resolveSoundSource present');
ok(/PRELOAD_BUFFER_NAMES/.test(audio), 'PRELOAD_BUFFER_NAMES present');
ok(/Rejecting to prevent site-root 404/.test(audio), 'unknown keys rejected with site-root warning');
ok(/refusing site-root fetch/.test(audio), 'cache-miss refuses non-/audio/ fetch');

const { resolveSoundSource, SOUND_ALIASES, PRELOAD_BUFFER_NAMES } = __sfxResolverTest;

const callerKeys = [
  'xp-tick', 'score-tick', 'level_up_skill', 'review_start', 'score_total_tick',
  'purchase', 'text_complete', 'text_scroll', 'review_complete', 'button_click',
  'project-complete', 'ui-click', 'notification', 'notification.wav', 'start_minigame',
  'reward', 'success', 'slider.wav', 'close_modal.wav', 'error.wav',
  'ui sfx/purchase-complete.m4a', 'notice', 'buttonClick', 'proj-complete', 'error',
];

const isSafe = (resolved: string) =>
  resolved.startsWith('/audio/') ||
  resolved.startsWith('synth:') ||
  PRELOAD_BUFFER_NAMES.has(resolved);

for (const key of callerKeys) {
  const resolved = resolveSoundSource(key);
  ok(resolved !== null, `caller key "${key}" resolves`);
  ok(isSafe(resolved!), `caller key "${key}" → "${resolved}" never site-root`);
}

ok(
  resolveSoundSource('/audio/chart_clips/60s-Pop1.m4a') === '/audio/chart_clips/60s-Pop1.m4a',
  'ChartsPanel /audio/chart_clips/ path passes through',
);
ok(
  resolveSoundSource('/audio/ui-sfx/proj-complete.m4a') === '/audio/ui-sfx/proj-complete.m4a',
  '/audio/ui-sfx path passes through',
);

for (const name of ['ui-proj-complete', 'ui-tactile-click', 'ui-cash-register', 'kick']) {
  ok(resolveSoundSource(name) === name, `preload name "${name}" passes through`);
}

for (const bad of ['xp-tickk', 'totally-missing', 'score-tick.wav', 'button_click.mp3']) {
  ok(resolveSoundSource(bad) === null, `unknown key "${bad}" rejected (no site-root fetch)`);
}

for (const [k, v] of Object.entries(SOUND_ALIASES)) {
  ok(isSafe(v), `alias "${k}" → "${v}" is safe target`);
}

console.log(`sfx-key-resolver: ${passed} checks passed`);
