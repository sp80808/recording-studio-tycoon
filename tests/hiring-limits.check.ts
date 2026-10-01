import assert from 'node:assert/strict';
import {
  getHiringLimits,
  hiringBlockMessage,
  reputationStaffCap,
  REPUTATION_PER_CREW_SEAT,
  REPUTATION_STAFF_CAP_BASE,
} from '../src/rpg/hiringLimits';

assert.equal(reputationStaffCap(0), REPUTATION_STAFF_CAP_BASE);
assert.equal(reputationStaffCap(REPUTATION_PER_CREW_SEAT - 1), REPUTATION_STAFF_CAP_BASE);
assert.equal(reputationStaffCap(REPUTATION_PER_CREW_SEAT), REPUTATION_STAFF_CAP_BASE + 1);
assert.equal(reputationStaffCap(REPUTATION_PER_CREW_SEAT * 2), REPUTATION_STAFF_CAP_BASE + 2);

const empty = getHiringLimits({ hiredStaff: [], reputation: 0 });
assert.equal(empty.spaceCap, 3, 'borrowed room defaults to 3');
assert.equal(empty.reputationCap, 2);
assert.equal(empty.effectiveCap, 2, 'reputation is tighter than space at 0 rep');
assert.equal(empty.canHire, true);
assert.equal(empty.blocker, null);

const filledByRep = getHiringLimits({
  hiredStaff: [{ id: 'a' }, { id: 'b' }] as never[],
  reputation: 0,
});
assert.equal(filledByRep.canHire, false);
assert.equal(filledByRep.blocker, 'reputation');
assert.match(hiringBlockMessage(filledByRep), /25/);

const biggerPremises = getHiringLimits({
  hiredStaff: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] as never[],
  reputation: 100,
  premisesTier: 1,
});
assert.equal(biggerPremises.spaceCap, 6);
assert.equal(biggerPremises.reputationCap, 2 + Math.floor(100 / REPUTATION_PER_CREW_SEAT));
assert.equal(biggerPremises.effectiveCap, Math.min(biggerPremises.spaceCap, biggerPremises.reputationCap));
assert.equal(biggerPremises.canHire, true);

const spaceBlocked = getHiringLimits({
  hiredStaff: [{ id: '1' }, { id: '2' }, { id: '3' }] as never[],
  reputation: 500,
  premisesTier: 0,
});
assert.equal(spaceBlocked.blocker, 'space');
assert.match(hiringBlockMessage(spaceBlocked), /borrowed room/i);

console.log('✓ hiring limits: space + reputation caps and messages passed');
