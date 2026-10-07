/** #256: UI SFX are one-shots; no loops, central dedupe, no fallback clicks, no click trains. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { OneShotGate, ONE_SHOT_COOLDOWN_MS, isKnownUISound, resolveLoop } from '../src/utils/oneShotPolicy';

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8');
let passed = 0;
const ok = (c: boolean, m: string) => { assert.ok(c, `FAIL: ${m}`); passed += 1; console.log(`PASS: ${m}`); };

ok(resolveLoop('sfx', true) === false, 'SFX can never loop, even when requested');
ok(resolveLoop('sfx', false) === false, 'SFX default is one-shot');
ok(resolveLoop('music', true) === true, 'music may still loop deliberately');
ok(resolveLoop('music', false) === false, 'music does not loop unless asked');

let t = 1000;
const gate = new OneShotGate(() => t);
ok(gate.admit('buttonClick'), 'first click plays');
t += 10;
ok(!gate.admit('buttonClick'), 'rapid duplicate inside cooldown is dropped');
ok(gate.admit('menuOpen'), 'a distinct semantic sound is not collapsed');
t += ONE_SHOT_COOLDOWN_MS;
ok(gate.admit('buttonClick'), 'same sound plays again after the cooldown');
let fired = 0;
for (let i = 0; i < 20; i += 1) { t += 1; if (gate.admit('rerender-click')) fired += 1; } // 20 replays in 20ms
ok(fired === 1, 're-render / effect replay burst yields a single audible one-shot');

ok(isKnownUISound('buttonClick') && isKnownUISound('menuOpen'), 'known semantic names are recognised');
ok(!isKnownUISound('buttonClik'), 'a typo is not a known sound');

const audio = read('src/utils/audioSystem.ts');
ok(/source\.loop = resolveLoop\(type, loop\)/.test(audio), 'engine routes loop through the SFX-no-loop policy');
ok(/oneShots\.admit\(`sfx:\$\{resolved\}`\)/.test(audio), 'playSound dedupes SFX centrally on resolved key');
ok(/oneShots\.admit\('synth:click'\)/.test(audio), 'synth playClick is throttled');
const dflt = audio.slice(audio.indexOf('default:', audio.indexOf('async playUISound')));
ok(!/playClick\(\)/.test(dflt.slice(0, 400)), 'unknown playUISound name does not fall back to a click');
const chord = audio.slice(audio.indexOf('async playTakeChord'), audio.indexOf('async playTakeChord') + 300);
ok(!/playTactileClick/.test(chord), 'playTakeChord no longer prepends a tactile click');

const ap = read('src/components/ActiveProject.tsx');
const arm = ap.slice(ap.indexOf('const handleArmTake'), ap.indexOf('const handleStandDown'));
ok(!/ui-click/.test(arm) && /playGearSwitch/.test(arm), 'arming a take plays exactly one cue (gear switch)');

const sb = read('src/components/StreakBankControl.tsx');
const tick = sb.slice(sb.indexOf('if (idx > tickIdxRef.current)'), sb.indexOf('if (idx > tickIdxRef.current)') + 300);
ok(!/playTactileClick/.test(tick) && /triggerHaptic/.test(tick), 'Streak Bank hold ticks haptics only, no click train');
console.log(`oneshot-sfx: ${passed} checks passed`);

{
  // #256 review: bounded memory and a backwards clock must not mute sounds.
  let t = 1000;
  const g = new OneShotGate(() => t);
  for (let i = 0; i < 500; i++) { g.admit(`k${i}`); t += 200; }
  assert.ok((g as unknown as { last: Map<string, unknown> }).last.size <= 66, 'expired keys are evicted');
  g.admit('x'); t -= 5000;
  assert.equal(g.admit('x'), true, 'a backwards clock admits');
  console.log('one-shot gate bounds check passed');
}
