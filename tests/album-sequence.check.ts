import { buildTracklist, scoreAlbum, type AlbumTrack } from '@/minigames/albumSequence';
let n = 0;
const ok = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); n++; console.log(`PASS: ${m}`); };

const a = buildTracklist('x'), b = buildTracklist('x');
ok(JSON.stringify(a) === JSON.stringify(b), 'same seed gives same tracklist');
ok(a.filter((t) => t.single).length === 1, 'exactly one single');

const mk = (energies: number[], singleAt: number): AlbumTrack[] =>
  energies.map((energy, id) => ({ id, title: `t${id}`, energy, single: id === singleAt }));
const good = mk([9, 8, 6, 5, 7, 4, 2], 1);
const bad = mk([2, 9, 1, 10, 2, 9, 9], 6);
const g = scoreAlbum(good), w = scoreAlbum(bad);
ok(g.total > w.total, 'sensible order outscores a zig-zag');
ok(g.total >= 800, 'sensible order scores well');
ok(w.tips.length > 0, 'bad order yields tips');
ok(scoreAlbum(mk([9, 8, 6, 5, 7, 4, 2], 1)).single === 250, 'single in slot 2 is ideal');
ok(scoreAlbum(mk([9, 8, 6, 5, 7, 4, 2], 6)).single < 250, 'single as closer is penalised');
const all = [0, 1, 2, 3, 4, 5, 6].every(() => { const s = scoreAlbum(buildTracklist(Math.random())); return s.total >= 0 && s.total <= 1000; });
ok(all, 'scores stay within 0..1000');
console.log(`album-sequence: all ${n} checks passed`);
