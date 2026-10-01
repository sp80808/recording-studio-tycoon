import { createChainRecall, startInput, tapPad, requestReplay, giveUp, scoreChainRecall, MAX_REPLAYS, CHAIN_DIFFICULTY } from '@/minigames/chainRecall';
let n = 0;
const ok = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); n++; console.log(`PASS: ${m}`); };

const a = createChainRecall('x', 2), b = createChainRecall('x', 2);
ok(JSON.stringify(a) === JSON.stringify(b), 'same seed gives the same chain');
for (const d of [1, 2, 3] as const) {
  const s = createChainRecall(`d${d}`, d);
  ok(s.sequence.length === CHAIN_DIFFICULTY[d].length, `difficulty ${d} chain length`);
  ok(s.rack.length === CHAIN_DIFFICULTY[d].length + CHAIN_DIFFICULTY[d].decoys, `difficulty ${d} rack includes decoys`);
  ok(s.sequence.every((id) => s.rack.some((r) => r.id === id)), `difficulty ${d} rack contains the whole path`);
}
ok(tapPad(a, a.sequence[0]) === a, 'taps are ignored while the chain is flashing');

// Perfect run.
let s = createChainRecall('win', 1);
while (s.phase !== 'done') {
  s = startInput(s);
  for (let i = 0; i < s.shown; i++) s = tapPad(s, s.sequence[i]);
}
ok(s.won && s.roundsCleared === s.totalRounds, 'perfect play clears every round');
ok(scoreChainRecall(s).total === 1000, 'perfect play scores 1000');

// Wrong tap: strike and replay of the same stages, not an instant loss.
let w = startInput(createChainRecall('lose', 2));
const wrongId = w.rack.find((r) => r.id !== w.sequence[0])!.id;
w = tapPad(w, wrongId);
ok(w.strikes === 1 && w.phase === 'show' && w.shown === 3, 'a wrong tap costs a strike and re-shows the chain');
for (let i = 0; i < w.maxStrikes; i++) { w = startInput(w); w = tapPad(w, wrongId); }
ok(w.phase === 'done' && !w.won, 'running out of strikes ends the run');
ok(scoreChainRecall(w).total === 0, 'no rounds cleared scores zero');

// Replays are limited and cost score.
let r = startInput(createChainRecall('replay', 1));
for (let i = 0; i < MAX_REPLAYS + 2; i++) { r = requestReplay(r); r = startInput(r); }
ok(r.replays === MAX_REPLAYS, 'replays are capped');
let clean = createChainRecall('cost', 1), dirty = createChainRecall('cost', 1);
dirty = requestReplay(startInput(dirty));
for (const g of [0, 1]) {
  let s2 = g ? dirty : clean;
  while (s2.phase !== 'done') { s2 = startInput(s2); for (let i = 0; i < s2.shown; i++) s2 = tapPad(s2, s2.sequence[i]); }
  if (g) dirty = s2; else clean = s2;
}
ok(scoreChainRecall(dirty).total < scoreChainRecall(clean).total, 'using a replay lowers the score');
const gu = giveUp(startInput(createChainRecall('gu', 1)));
ok(gu.phase === 'done' && scoreChainRecall(gu).total >= 0, 'giving up ends the run safely');
ok(JSON.stringify(a) === JSON.stringify(createChainRecall('x', 2)), 'state is immutable across actions');
console.log(`chain-recall: all ${n} checks passed`);
