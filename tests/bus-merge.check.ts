import {
  createBusMerge, move, canMove, finish, scoreBusMerge, mergeResult, mergeCost, BUS_DIFFICULTY, MILESTONES,
  type BusDir, type BusMergeState, type Track,
} from '@/minigames/busMerge';
let n = 0;
const ok = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); n++; console.log(`PASS: ${m}`); };
const t = (kind: Track['kind'], depth = 0): Track => ({ kind, depth });
const DIRS: BusDir[] = ['left', 'up', 'right', 'down'];
const count = (s: BusMergeState) => s.cells.filter(Boolean).length;
const blank = (seed = 'b'): BusMergeState => ({ ...createBusMerge(seed), cells: Array(16).fill(null), deck: [] });
const put = (s: BusMergeState, at: [number, Track][]): BusMergeState => {
  const cells = s.cells.slice(); at.forEach(([i, tr]) => { cells[i] = tr; }); return { ...s, cells };
};

// Determinism and setup
const a = createBusMerge('x', { difficulty: 2 }), b = createBusMerge('x', { difficulty: 2 });
ok(JSON.stringify(a) === JSON.stringify(b), 'same seed gives the same board');
ok(JSON.stringify(createBusMerge('y', { difficulty: 2 })) !== JSON.stringify(a), 'different seed gives a different board');
for (const d of [1, 2, 3] as const) {
  const s = createBusMerge(`d${d}`, { difficulty: d });
  ok(s.movesLeft === BUS_DIFFICULTY[d].moves && count(s) + s.deck.length === 9 + BUS_DIFFICULTY[d].extras + 1, `difficulty ${d} sets moves and tracks`);
}
ok(createBusMerge('h', { bonusHeadroom: 5 }).headroom === BUS_DIFFICULTY[1].headroom + 5, 'bonus headroom is added');

// Recipes
ok(mergeResult(t('kick'), t('snare'))?.kind === 'drum-bus', 'Kick + Snare = Drum Bus');
ok(mergeResult(t('snare'), t('kick'))?.kind === 'drum-bus', 'recipes are unordered');
ok(mergeResult(t('gtr-l'), t('gtr-r'))?.kind === 'guitar-bus', 'Guitar L + R = Guitar Bus');
ok(mergeResult(t('drums', 2), t('music', 2))?.kind === 'premix', 'DRUM + MUSIC = Pre-mix');
ok(mergeResult(t('premix', 3), t('vox', 1))?.kind === 'mix' && mergeResult(t('premix', 3), t('vox', 1))?.depth === 4, 'Pre-mix + VOX = MIX at depth 4');
ok(mergeResult(t('kick'), t('bass')) === null, 'incompatible tracks do not merge');
ok(mergeResult(t('sample'), t('sample')) === null && mergeResult(t('sample'), t('kick')) === null, 'the Hero Sample only merges with the mix');
ok(mergeResult(t('kick'), t('kick'))?.depth === 1, 'layering duplicates is legal but deeper');
ok(mergeCost(t('mix', 4), t('mix', 4), t('sample')) === 1, 'printing the sample is cheap');

// Sliding and merging
let s = put(blank(), [[0, t('kick')], [3, t('snare')]]);
let m = move(s, 'left');
ok(m.cells[0]?.kind === 'drum-bus' && count(m) === 1, 'slide left merges Kick and Snare');
ok(m.headroom === s.headroom - 1 && m.merges === 1 && m.built.includes('drum-bus'), 'merge spends headroom and logs a milestone');
ok(s.cells[0]?.kind === 'kick' && count(s) === 2, 'move is immutable');
ok(move(m, 'left') === m, 'a no-op slide returns the same state and costs no move');
s = put(blank(), [[0, t('kick')], [1, t('snare')], [2, t('kick')], [3, t('snare')]]);
m = move(s, 'left');
ok(m.cells[0]?.kind === 'drum-bus' && m.cells[1]?.kind === 'drum-bus' && !m.cells[2], 'each tile merges at most once per move');
s = put(blank(), [[0, t('kick')], [4, t('snare')]]);
ok(move(s, 'down').cells[12]?.kind === 'drum-bus', 'vertical slides merge too');

// Spawning, moves, outcomes
const fresh = createBusMerge('spawn');
const mv = DIRS.map((d) => move(fresh, d)).find((x) => x !== fresh && x.merges === 0)!;
ok(mv.movesLeft === fresh.movesLeft - 1 && mv.deck.length === fresh.deck.length - 1 && count(mv) === count(fresh) + 1, 'a move spawns the next track from the deck');
let low = put({ ...blank(), headroom: 0 }, [[0, t('kick')], [1, t('snare')]]);
low = move(low, 'left');
ok(low.finished && low.outcome === 'clipped', 'running out of headroom clips and ends the game');
ok(move(low, 'left') === low, 'finished boards ignore moves');
const last = put({ ...blank(), movesLeft: 1 }, [[0, t('kick')], [5, t('bass')]]);
ok(move(last, 'left').outcome === 'out-of-moves', 'spending the last move ends the game');
const cycle = ['kick', 'bass', 'overhead', 'sample'] as const;
const lock = { ...blank(), cells: Array.from({ length: 16 }, (_, i) => t(cycle[((i % 4) + 2 * Math.floor(i / 4)) % 4])) };
ok(!canMove(lock), 'a locked board has no legal move');

// Full clean build scores high; sloppy scores lower
let full = put(blank('full'), [[0, t('drums', 2)], [1, t('music', 2)], [2, t('vox', 1)]]);
full = move(full, 'left');
ok(full.cells[0]?.kind === 'premix', 'stems merge into the pre-mix');
full = move(full, 'left');
ok(full.cells[0]?.kind === 'mix' && full.cells[0]?.depth === 4 && full.built.includes('mix'), 'pre-mix + VOX makes the MIX at par depth');
const clean = scoreBusMerge(finish(full));
ok(clean.mixed && clean.excessDepth === 0, 'clean mix reaches par depth');
let printed = put(full, [[1, t('sample')]]);
printed = move(printed, 'left');
ok(printed.printed && scoreBusMerge(finish(printed)).total > clean.total, 'printing the Hero Sample raises the score');
const deep = scoreBusMerge(finish({ ...full, mixDepth: 6 }));
ok(deep.excessDepth === 2 && deep.total < clean.total, 'excess bus depth is penalised');
const none = scoreBusMerge(finish(blank()));
ok(none.total === 0 && !none.mixed, 'an empty bounce scores zero');
ok(scoreBusMerge({ ...full, outcome: 'clipped', finished: true }).total < clean.total, 'clipping forfeits the bonuses');
ok(MILESTONES.length === 8, 'eight milestones');

// Solvability: a 3-ply lookahead bot should finish the MIX on most easy seeds; scores stay in range.
const pairs = (s: BusMergeState) => {
  let p = 0;
  for (let i = 0; i < 16; i++) {
    const x = s.cells[i];
    if (!x) continue;
    const r = i % 4 < 3 ? s.cells[i + 1] : null;
    const d = i < 12 ? s.cells[i + 4] : null;
    if (r && mergeResult(x, r)) p++;
    if (d && mergeResult(x, d)) p++;
  }
  return p;
};
const heur = (s: BusMergeState) => s.built.length * 100 + s.merges * 10 + pairs(s) * 3 + s.cells.filter((c) => !c).length;
const best = (s: BusMergeState, depth: number): number => {
  if (depth === 0 || s.finished) return heur(s);
  let b = -1e9;
  for (const d of DIRS) { const nx = move(s, d); if (nx !== s) b = Math.max(b, best(nx, depth - 1)); }
  return b === -1e9 ? heur(s) : b;
};
const wins: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
const trials = 20;
for (const d of [1, 2, 3] as const) {
  for (let i = 0; i < trials; i++) {
    let g = createBusMerge(`bot${d}-${i}`, { difficulty: d });
    while (!g.finished) {
      let pick: BusMergeState | null = null;
      let top = -1e9;
      for (const dir of DIRS) {
        const nx = move(g, dir);
        if (nx === g) continue;
        const sc = best(nx, 3);
        if (sc > top) { top = sc; pick = nx; }
      }
      if (!pick) break;
      g = pick;
    }
    const sc = scoreBusMerge(finish(g)).total;
    if (sc < 0 || sc > 1000) throw new Error('score out of range');
    if (g.built.includes('mix')) wins[d]++;
  }
}
console.log('lookahead bot MIX rate', JSON.stringify(wins), 'of', trials);
ok(wins[1] / trials >= 0.5, 'easy boards are solvable');
ok(wins[2] / trials >= 0.4 && wins[3] / trials >= 0.3, 'harder boards are still winnable');
ok(true, 'scores stay within 0..1000');
console.log(`bus-merge: all ${n} checks passed`);
