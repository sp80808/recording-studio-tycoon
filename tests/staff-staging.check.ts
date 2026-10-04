import assert from 'node:assert/strict';
import { staffDestination, stepStaffPosition, staffActivityCue, pickFloorStaff } from '../src/components/studio/staffStaging';
const stations = { home: { x: 0, y: 0 }, work: { x: 100, y: 50 }, rest: { x: -20, y: 10 } };
assert.equal(staffDestination('mixing', stations), stations.work);
assert.equal(staffDestination('break', stations), stations.rest);
assert.equal(staffDestination('waiting', stations), stations.home);
let position = stations.home;
for (let i = 0; i < 300; i++) position = stepStaffPosition(position, stations.work, 16, false);
assert.deepEqual(position, stations.work, 'arrives without overshoot');
assert.deepEqual(stepStaffPosition(stations.home, stations.work, 16, true), stations.work);
assert.deepEqual(stepStaffPosition(stations.home, stations.work, -16, false), stations.home);
assert.ok(Math.hypot(...Object.values(stepStaffPosition(stations.home, stations.work, 10000, false))) <= 4.21, 'hidden-tab delta bounded');
assert.equal(staffActivityCue('idle').text, '');
assert.equal(staffActivityCue('break').text, 'z');
console.log('staff staging destinations and motion passed');

const crew = [
  { id: 'rest-a', status: 'Resting' }, { id: 'idle-a', status: 'Idle' },
  { id: 'rest-b', status: 'Resting' }, { id: 'idle-b', status: 'Idle' },
  { id: 'worker', status: 'Working' }, { id: 'tour', status: 'On Tour' },
];
assert.equal(pickFloorStaff(crew)[0].id, 'worker', 'active worker survives four-person floor cap');
assert.ok(!pickFloorStaff(crew).some(member => member.id === 'tour'));
assert.equal(crew[0].id, 'rest-a', 'presentation ranking never mutates saved hire order');
