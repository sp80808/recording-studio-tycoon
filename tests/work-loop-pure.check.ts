/** Slice-2 pure verification: stage grades, contract stakes, focus flow. */
import { gradeStage, A_GRADE_CAP } from '../src/rpg/stageGrades';
import { settleStake } from '../src/rpg/contractStakes';
import { advanceFlow, initialFlow, isFlowing } from '../src/rpg/focusFlow';

let passed = 0;
const ok = (cond: boolean, msg: string): void => {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

// Stage grades
const gold = gradeStage({ sessionsTaken: 3, parSessions: 4, minigameTake: 'S', focusMatch: 0.8 });
ok(gold.grade === 'Gold' && gold.qualityCarry === 4 && !gold.capsProjectAtA, 'gold carries +4, no cap');
const skip = gradeStage({ sessionsTaken: 2, parSessions: 4, minigameTake: null, focusMatch: 1 });
ok(skip.grade === 'Bronze' && skip.capsProjectAtA, 'skipped take caps project at A');
const silver = gradeStage({ sessionsTaken: 3, parSessions: 4, minigameTake: 'B', focusMatch: 0.2 });
ok(silver.grade === 'Silver' && silver.qualityCarry === 2, 'on-par bronze take still silver');
const slow = gradeStage({ sessionsTaken: 9, parSessions: 4, minigameTake: 'C', focusMatch: 0.1 });
ok(slow.grade === 'Bronze', 'slow unfocused stage is bronze');
ok(A_GRADE_CAP === 89, 'A cap is 89');

// Stakes
ok(settleStake('safe', 'C').payoutMult === 1.0 && settleStake('safe', 'C').met, 'safe always pays');
const moon = settleStake('moonshot', 'S');
ok(moon.payoutMult === 2.5 && moon.met && moon.repDelta === 0, 'moonshot S pays 2.5x');
const moonFail = settleStake('moonshot', 'A');
ok(moonFail.payoutMult === 1.0 && moonFail.repDelta === -12 && !moonFail.met, 'missed moonshot stings -12 rep');
ok(settleStake('ambitious', 'S+').met, 'S+ clears ambitious bar');

// Flow
let f = initialFlow();
f = advanceFlow(f, true);
f = advanceFlow(f, true);
ok(f.multiplier === 1, 'warm-up sessions stay x1');
f = advanceFlow(f, true);
ok(f.multiplier === 2 && isFlowing(f), '3-match ignites FLOW x2');
f = advanceFlow(f, true);
ok(f.multiplier === 3, '4-match rises to x3');
f = advanceFlow(f, true);
ok(f.multiplier === 4, '5-match peaks at x4');
f = advanceFlow(f, true);
ok(f.multiplier === 4, 'flow caps at x4');
f = advanceFlow(f, false);
ok(f.multiplier === 1 && f.streak === 0, 'mismatch breaks flow');

console.log(`work-loop-pure: all ${passed} checks passed`);
