import { buildCompSession, scoreComp, takeQuality, traitChips, COMP_LINES, COMP_TAKES } from '@/minigames/vocalComp';
import { getTriggeredMinigames } from '@/utils/minigameUtils';

let passed = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

const a = buildCompSession('seed-1');
const b = buildCompSession('seed-1');
const c = buildCompSession('seed-2');
ok(JSON.stringify(a) === JSON.stringify(b), 'same seed gives identical session');
ok(JSON.stringify(a) !== JSON.stringify(c), 'different seed gives a different session');
ok(a.lines.length === COMP_LINES && a.lines.every((l) => l.takes.length === COMP_TAKES), 'session has expected lines and takes');

// Optimal picks all from distinct best takes score high; worst picks score low.
const bestPicks = a.lines.map((l) => l.takes.map((t) => takeQuality(l.mood, t)).indexOf(Math.max(...l.takes.map((t) => takeQuality(l.mood, t)))));
const worstPicks = a.lines.map((l) => l.takes.map((t) => takeQuality(l.mood, t)).indexOf(Math.min(...l.takes.map((t) => takeQuality(l.mood, t)))));
const best = scoreComp(a, bestPicks);
const worst = scoreComp(a, worstPicks);
ok(best.total > worst.total, 'best picks outscore worst picks');
ok(best.total >= 850 && best.total <= 1000, 'best picks land in the top band');
ok(best.lineScores.every((s, i) => s === best.bestLineScores[i]), 'best picks match per-line best quality');

// Flow: same ratio quality, fewer switches scores higher.
const flat = buildCompSession('flat');
flat.lines.forEach((l) => l.takes.forEach((t) => { t.pitch = 70; t.timing = 70; t.feel = 70; t.flaw = null; }));
const smooth = scoreComp(flat, [0, 0, 0, 0, 0, 0]);
const hoppy = scoreComp(flat, [0, 1, 0, 1, 0, 1]);
ok(smooth.total > hoppy.total && hoppy.switches === 5, 'fewer hops between takes scores higher');
ok(smooth.total === 1000, 'perfect equal takes with no hops score 1000');

// Flaws hurt and are visible.
const flawed = { ...a.lines[0].takes[0], flaw: 'cough' as const };
const clean = { ...flawed, flaw: null };
ok(takeQuality('intimate', flawed) < takeQuality('intimate', clean), 'flaw lowers take quality');
ok(traitChips(flawed).some((chip) => chip.label === 'Tour-bus cough'), 'flaw shows as a chip');

// Score always within bounds, even with missing picks.
const partial = scoreComp(a, []);
ok(partial.total >= 0 && partial.total <= 1000, 'empty picks stay in bounds');

// Trigger wiring: a vocal stage offers the comp game.
const project: any = {
  genre: 'Pop', difficulty: 3, currentStageIndex: 0, workSessionCount: 0,
  stages: ['Vocal Takes', 'Production', 'Mixing', 'Mastering'].map((stageName) => ({ stageName, workUnitsBase: 10, workUnitsCompleted: 2 })),
};
const state: any = { ownedEquipment: [], playerData: { level: 6 } };
const triggers = getTriggeredMinigames(project, state, { performance: 50, soundCapture: 50, layering: 50 } as any);
ok(triggers.some((t) => t.minigameType === 'vocal-comp'), 'vocal stage can trigger vocal-comp');

console.log(`vocal-comp: all ${passed} checks passed`);
