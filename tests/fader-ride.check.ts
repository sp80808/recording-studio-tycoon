import {
  TOTAL_TICKS, TICK_MS, GAME_SECONDS, scoreRide, isRunComplete, secondsLeft, runProgress, outputLevel, inZone, trackLevelAt,
} from '@/minigames/faderRide';
let n = 0;
const ok = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); n++; console.log(`PASS: ${m}`); };

ok(TOTAL_TICKS * TICK_MS === GAME_SECONDS * 1000, 'run length matches the 30 second minigame timer');
ok(!isRunComplete(TOTAL_TICKS - 1) && isRunComplete(TOTAL_TICKS), 'run completes exactly at the last tick');
ok(secondsLeft(0) === GAME_SECONDS && secondsLeft(TOTAL_TICKS) === 0, 'countdown runs from 30 to 0');
ok(runProgress(TOTAL_TICKS / 2) === 0.5 && runProgress(TOTAL_TICKS * 3) === 1, 'progress is clamped 0..1');
ok(scoreRide(TOTAL_TICKS, TOTAL_TICKS, 80) === 1000, 'perfect clean run scores 1000');
ok(scoreRide(TOTAL_TICKS, TOTAL_TICKS, 99) === 1000, 'perfect clipped run is capped at 1000');
ok(scoreRide(100, TOTAL_TICKS, 99) === 500, 'half in zone with a clip scores 500');
ok(scoreRide(100, TOTAL_TICKS, 80) === 550, 'no-clip bonus adds 10%');
ok(scoreRide(20, 20, 50) <= 110, 'quitting after a lucky streak cannot score high');
ok(scoreRide(0, 0, 0) === 0, 'no ticks scores zero');
ok(inZone(outputLevel(50, 50)) && !inZone(outputLevel(90, 50)), 'fader at unity holds a mid track in the window');
ok(inZone(outputLevel(80, 30)), 'pulling the fader back tames a loud swell');
for (let i = 0; i < 400; i++) { const t = trackLevelAt(i, (i % 13) - 6); ok(t >= 15 && t <= 95, `track level in range at step ${i}`); if (i > 3) break; }
console.log(`fader-ride: ${n} checks passed`);
