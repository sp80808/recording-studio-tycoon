import assert from 'node:assert/strict';
import {
  BARK_MS,
  arrivalBark,
  barkAlpha,
  cheerHop,
  hesitationSway,
  motionTempo,
  readableCue,
  readableStaffState,
  takeReaction,
} from '../src/components/studio/actorReadability';

const base = { status: 'Working', energy: 80, mood: 70, hasActiveProject: true, issueOpen: false };

// One readable state per person, in a fixed priority order.
assert.equal(readableStaffState(base), 'working');
assert.equal(readableStaffState({ ...base, issueOpen: true }), 'blocked', 'an open issue blocks the working crew');
assert.equal(readableStaffState({ ...base, issueOpen: true, energy: 10 }), 'tired', 'exhaustion reads before the issue');
assert.equal(readableStaffState({ ...base, status: 'Resting' }), 'tired');
assert.equal(readableStaffState({ ...base, mood: 12 }), 'frustrated');
assert.equal(readableStaffState({ ...base, status: 'Idle' }), 'waiting');
assert.equal(readableStaffState({ ...base, status: 'Idle', hasActiveProject: false }), 'ready');
assert.equal(readableStaffState({ ...base, status: 'On Tour', energy: 1 }), 'leaving');
assert.equal(readableStaffState({ ...base, status: 'Training', issueOpen: true }), 'working', 'only session crew are blocked by a session issue');
console.log('readable staff states ok');

// A single glyph per state, empty when the body says enough.
assert.equal(readableCue('blocked').text, '!');
assert.equal(readableCue('ready').text, '');
assert.equal(readableCue('leaving').text, '');
assert.ok(motionTempo('tired') < 1 && motionTempo('celebrating') > 1);

// Take reactions: one primary reaction each.
assert.deepEqual(takeReaction('Gold'), { crew: 'celebrating', artistHesitates: false });
assert.deepEqual(takeReaction('Silver'), { crew: 'inspired', artistHesitates: false });
assert.deepEqual(takeReaction('Solid'), { crew: null, artistHesitates: true });
assert.equal(cheerHop(0), 0);
assert.equal(cheerHop(600), 0, 'cheer settles back to the floor');
assert.ok(cheerHop(130) > 3);
assert.equal(hesitationSway(700), 0, 'hesitation settles back in place');
console.log('take reactions ok');

// Arrival barks are backed by the existing relationship and stable for a session.
const first = arrivalBark(undefined, 7);
assert.equal(arrivalBark(undefined, 7), first, 'same session says the same line');
assert.notEqual(arrivalBark({ sessionsCompleted: 1 }, 7), first, 'returning clients get a returning line');
assert.match(arrivalBark({ sessionsCompleted: 5 }, 2), /\S/);
const firstPool = new Set(Array.from({ length: 12 }, (_, i) => arrivalBark(undefined, i)));
assert.ok(firstPool.size >= 3, 'lines vary across sessions');
assert.equal(barkAlpha(-1), 0);
assert.equal(barkAlpha(BARK_MS), 0);
assert.equal(barkAlpha(1_000), 1);
console.log('arrival barks ok');
