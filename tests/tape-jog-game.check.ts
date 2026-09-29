import { gradeTapeSplice, calculateScrubSpeed } from '@/components/minigames/TapeJogGame';

let passed = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

// Exact splice match
const perfect = gradeTapeSplice(40, 60, 40, 60);
ok(perfect.accuracy === 100 && perfect.points === 250, 'exact splice gives 100% and 250 pts');

// Near-miss splice
const near = gradeTapeSplice(38, 62, 40, 60);
ok(near.accuracy >= 90 && near.points >= 200, 'near splice gives high points');

// Stick scrub speed conversion
ok(calculateScrubSpeed(0.8) > calculateScrubSpeed(0.2), 'higher stick deflection yields faster scrub');
ok(calculateScrubSpeed(-0.8) < 0, 'negative deflection scrubs backward');

console.log(`tape-jog-game: all ${passed} checks passed`);
