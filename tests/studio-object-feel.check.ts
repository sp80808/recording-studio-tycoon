import assert from 'node:assert/strict';
import {
  FEEL_MS,
  HOTSPOT_FEEL,
  RING_CYCLE_MS,
  feelKindFor,
  handsetLift,
  handsetRattle,
  objectFeelPose,
  phoneRingLevel,
  faderLevel,
  takePush,
  wooferPump,
  TAKE_PUSH_MS,
  type ObjectFeelKind,
} from '../src/components/studio/studioObjectFeel';

const kinds: ObjectFeelKind[] = ['press', 'wobble', 'rattle', 'flick', 'lift'];
const isRest = (p: ReturnType<typeof objectFeelPose>) => p.sx === 1 && p.sy === 1 && p.dy === 0 && p.rot === 0 && p.flash === 0;

// Every reaction starts and ends exactly at rest, stays small, and Reduced Motion never moves.
for (const kind of kinds) {
  assert.ok(isRest(objectFeelPose(kind, 0)), `${kind} rests before the tap`);
  assert.ok(isRest(objectFeelPose(kind, FEEL_MS[kind])), `${kind} returns to rest`);
  assert.ok(isRest(objectFeelPose(kind, FEEL_MS[kind] + 5_000)), `${kind} cannot leave the object moved`);
  let moved = false;
  for (let ms = 8; ms < FEEL_MS[kind]; ms += 8) {
    const p = objectFeelPose(kind, ms);
    assert.ok(Math.abs(p.sx - 1) < 0.06 && Math.abs(p.sy - 1) < 0.06, `${kind} scale stays a micro emphasis`);
    assert.ok(Math.abs(p.rot) < 0.08 && Math.abs(p.dy) < 2, `${kind} motion stays small`);
    if (!isRest(p)) moved = true;
    assert.ok(isRest(objectFeelPose(kind, ms, true)), `${kind} is still under Reduced Motion`);
  }
  assert.ok(moved, `${kind} visibly reacts`);
}

// Every studio hotspot has a reaction; unknown ids fall back to a press.
for (const id of ['console', 'liveRoom', 'phone', 'clock', 'tv', 'shelf', 'door']) assert.ok(HOTSPOT_FEEL[id], id);
assert.equal(feelKindFor('nope'), 'press');
assert.equal(feelKindFor('clock'), 'wobble', 'wall clock swings on its nail');
assert.ok(objectFeelPose('flick', 20).flash > 0.8, 'TV flick brightens at once');

// Handset lift: up to the ear, back on the cradle, nothing left over.
{
  assert.deepEqual(handsetLift(0), { lift: 0, tilt: 0 });
  assert.deepEqual(handsetLift(FEEL_MS.lift), { lift: 0, tilt: 0 });
  assert.ok(handsetLift(FEEL_MS.lift * 0.4).lift > 8, 'held up at the ear');
  assert.ok(handsetLift(FEEL_MS.lift * 0.4).tilt < 0, 'tilted towards the ear');
  assert.deepEqual(handsetLift(FEEL_MS.lift * 0.4, true), { lift: 0, tilt: 0 });
}

// Double-ring cadence: two bursts then a long pause, repeating.
{
  assert.ok(phoneRingLevel(200) > 0.9, 'first burst');
  assert.equal(phoneRingLevel(500), 0, 'short gap');
  assert.ok(phoneRingLevel(800) > 0.9, 'second burst');
  assert.equal(phoneRingLevel(2_000), 0, 'long pause');
  assert.equal(phoneRingLevel(200 + RING_CYCLE_MS), phoneRingLevel(200), 'repeats');
  let onMs = 0;
  for (let ms = 0; ms < RING_CYCLE_MS; ms += 5) if (phoneRingLevel(ms) > 0) onMs += 5;
  assert.ok(onMs > 700 && onMs < 850, `rings for ~0.8s per cycle (${onMs})`);
  assert.deepEqual(handsetRattle(200, 0), { dy: 0, rot: 0 }, 'silent phone does not rattle');
  assert.deepEqual(handsetRattle(210, 1, true), { dy: 0, rot: 0 }, 'Reduced Motion: no rattle');
  let lifted = false;
  for (let ms = 0; ms < 400; ms += 3) { const r = handsetRattle(ms, 1); assert.ok(r.dy <= 0 && r.dy > -2); if (r.dy < -1) lifted = true; }
  assert.ok(lifted, 'handset chatters off the cradle');
}

// Console faders: parked when idle, ride during a session, a strong take pushes them up briefly.
{
  for (let t = 0; t < 20; t += 0.7) assert.equal(faderLevel(0.4, 2, t, 1, 0, 0), 0.4, 'parked fader never moves');
  let lo = 1, hi = 0;
  for (let t = 0; t < 20; t += 0.1) { const v = faderLevel(0.4, 2, t, 1, 1, 0); lo = Math.min(lo, v); hi = Math.max(hi, v); }
  assert.ok(lo > 0.4 && hi < 0.75 && hi - lo > 0.05, `live fader rides up and moves (${lo}..${hi})`);
  assert.ok(faderLevel(0.95, 0, 0, 1, 1, 1) <= 0.96, 'never leaves its track');
  assert.equal(takePush(0, 'Gold'), 0);
  assert.equal(takePush(TAKE_PUSH_MS, 'Gold'), 0, 'push always settles');
  assert.ok(takePush(150, 'Gold') > takePush(150, 'Silver') && takePush(150, 'Silver') > 0);
  assert.equal(takePush(150, 'Solid'), 0, 'a flat take does not push');
}

// Monitor woofers: silent when nothing plays, thump on the beat while it does.
{
  assert.equal(wooferPump(1.23, 96, 1, false), 0);
  const onBeat = wooferPump(60 / 96 * 4, 96, 1, true);
  const offBeat = wooferPump(60 / 96 * 4.8, 96, 1, true);
  assert.ok(onBeat > 0.9 && offBeat < 0.1, `kick shape (${onBeat}, ${offBeat})`);
  assert.ok(wooferPump(0, 96, 0, true) < wooferPump(0, 96, 1, true), 'harder sessions pump harder');
}

console.log('studio object feel passed');
