import { createGainStaging, adjustGain, commitTake, STEP_DB, ROUNDS as G_ROUNDS } from '@/minigames/gainStaging';
import { createPhaseCheck, commitKit, toggleFlip, currentKit } from '@/minigames/phaseCheck';
import { createChainRecall, startInput, tapPad, giveUp } from '@/minigames/chainRecall';
import { debriefGainStaging, debriefEQMatch, debriefPhaseCheck, debriefChainRecall, renderDebrief } from '@/minigames/debriefs';

let n = 0;
const ok = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); n++; console.log(`PASS: ${m}`); };
const text = (l: ReturnType<typeof debriefEQMatch>) => renderDebrief(l).join(' | ');

// Gain staging: slam the preamp up every take -> a clip named by stage and dB.
let g = createGainStaging('deb', 2);
for (let r = 0; r < G_ROUNDS; r++) {
  for (let i = 0; i < 12; i++) { g = adjustGain(g, 0, STEP_DB); g = adjustGain(g, 1, STEP_DB); }
  g = commitTake(g);
}
const gl = debriefGainStaging(g);
ok(gl.length >= 1 && gl.length <= 2, 'gain debrief has one or two lines');
ok(gl[0].key === 'mg.debrief.gain.clipped' && /dB hot at the channel fader/.test(text(gl)), 'gain debrief names the clipping stage in dB');
ok(JSON.stringify(debriefGainStaging(g)) === JSON.stringify(gl), 'gain debrief is deterministic');
ok(debriefGainStaging(createGainStaging('none', 2)).length === 0, 'uncommitted session gives no gain debrief');
// Doing nothing leaves the preamp under the floor -> noise line.
let q = createGainStaging('quiet', 3);
for (let r = 0; r < G_ROUNDS; r++) q = commitTake(q);
ok(debriefGainStaging(q).some((l) => l.key === 'mg.debrief.gain.noisy'), 'a starved preamp is called out as noise floor');

// EQ match
const eq = debriefEQMatch([5, -3, 0, 6], [0, 0, 0, 0]);
ok(eq[0].key === 'mg.debrief.eq.too_little' && /top end ended 6 dB short/.test(text(eq)), 'EQ debrief names the worst band and direction');
ok(/low end was also 5 dB low/.test(text(eq)), 'EQ debrief mentions a second big miss');
ok(debriefEQMatch([5, -3, 0, 6], [5, -3, 0, 6]).length === 0, 'a perfect EQ match needs no debrief');
ok(debriefEQMatch([0, 0, 0, 0], [0, 4, 0, 0])[0].key === 'mg.debrief.eq.too_much', 'EQ debrief reports a boost as too much');

// Phase check: commit three kits untouched -> thin, naming mics.
let p = createPhaseCheck('deb', 2);
for (let r = 0; r < 3; r++) p = commitKit(p);
const pl = debriefPhaseCheck(p);
ok(pl[0].key === 'mg.debrief.phase.thin' && /out of polarity/.test(text(pl)) && /%/.test(text(pl)), 'phase debrief names mics and the sum');
// Flip-happy but correct kit.
let f = createPhaseCheck('flips', 2);
const bad = currentKit(f).channels.find((c) => c.invertedAtSource)!;
for (let i = 0; i < 6; i++) f = toggleFlip(f, bad.id); // even count: unchanged polarity
f = commitKit(f);
ok(debriefPhaseCheck(f).some((l) => l.key === 'mg.debrief.phase.flips'), 'wasted flips are called out');

// Chain recall
let c = startInput(createChainRecall('deb', 1));
const wrong = c.rack.find((r) => r.id !== c.sequence[0])!.id;
for (let i = 0; i < c.maxStrikes; i++) { c = tapPad(c, wrong); c = startInput(c); }
const cl = debriefChainRecall(c);
ok(c.phase === 'done' && cl[0].key === 'mg.debrief.chain.lost_first', 'chain loss at stage one is named');
let c2 = startInput(createChainRecall('deb2', 1));
c2 = tapPad(c2, c2.sequence[0]);
c2 = tapPad(c2, c2.sequence[1]);
c2 = startInput(c2);
c2 = giveUp(tapPad(c2, c2.sequence[0]));
ok(/stage 1|stage \d/.test(text(debriefChainRecall(c2))), 'chain debrief reports the stage where it broke');
ok(debriefChainRecall(startInput(createChainRecall('fresh', 1))).length === 0, 'a fresh chain has no debrief');

console.log(`${n} checks passed`);
