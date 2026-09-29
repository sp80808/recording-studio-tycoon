import { gradePadHit, calculateBeatPadScore } from '@/components/minigames/BeatPadGame';

let passed = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

ok(gradePadHit(1000, 1010).grade === 'Perfect', 'within 25ms is Perfect');
ok(gradePadHit(1000, 1045).grade === 'Great', 'within 60ms is Great');
ok(gradePadHit(1000, 1085).grade === 'Good', 'within 100ms is Good');
ok(gradePadHit(1000, 1200).grade === 'Miss', 'beyond 100ms is Miss');

const perfectScore = calculateBeatPadScore([200, 200, 200, 200, 200]);
ok(perfectScore === 1000, '5 perfects give 1000 points');

console.log(`beat-pad-game: all ${passed} checks passed`);
