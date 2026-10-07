import assert from 'node:assert/strict';
import {
  ATTENTION_MANUAL_GRACE_MS,
  CUE_SPECS,
  TAKE_PUNCH_MS,
  attentionFrame,
  createAttentionDirector,
  cuesForTransition,
  expireCue,
  isOffCentre,
  noteManualInput,
  noteTargetInteraction,
  pushCue,
  takePunchScale,
  type AttentionFrameInput,
} from '../src/components/studio/attentionDirector';
import { advanceClientTransit, createClientTransitState, doorOpenAmount, CLIENT_ENTER_MS } from '../src/components/studio/clientDoorTransit';

const idle = (now: number, extra: Partial<AttentionFrameInput> = {}): AttentionFrameInput => ({
  now,
  reduceMotion: false,
  floorFocused: true,
  targetOffCentre: true,
  ...extra,
});

// Priority + coalescing: one cue at a time, repeats refresh instead of stacking.
{
  let s = createAttentionDirector();
  s = pushCue(s, { target: 'phone', reason: 'enquiry' }, 1_000);
  const firstId = s.active?.id;
  s = pushCue(s, { target: 'phone', reason: 'enquiry' }, 2_000);
  assert.equal(s.active?.id, firstId, 'same target + reason coalesces');
  assert.equal(s.active?.startedAt, 2_000, 'coalesced cue refreshes its timer');
  s = pushCue(s, { target: 'shelf', reason: 'issue' }, 2_100);
  assert.equal(s.active?.reason, 'issue', 'high priority preempts normal');
  const before = s;
  s = pushCue(s, { target: 'door', reason: 'wrap' }, 2_200);
  assert.equal(s, before, 'low priority never preempts a live high cue');
  s = pushCue(s, { target: 'phone', reason: 'enquiry' }, 2_300);
  assert.equal(s.active?.reason, 'issue', 'normal never preempts a live high cue');
  s = expireCue(s, 2_100 + CUE_SPECS.issue.durationMs);
  assert.equal(s.active, null, 'cue expires on its own');
  s = pushCue(s, { target: 'door', reason: 'wrap' }, 20_000);
  assert.equal(s.active?.reason, 'wrap', 'low cue lands once nothing outranks it');
}

// Manual input yields the camera immediately; static highlight remains.
{
  let s = pushCue(createAttentionDirector(), { target: 'shelf', reason: 'issue' }, 10_000);
  assert.equal(attentionFrame(s, idle(10_100)).cameraTarget, 'shelf', 'high cue may frame an idle player');
  s = noteManualInput(s, 10_200);
  const f = attentionFrame(s, idle(10_300));
  assert.equal(f.cameraTarget, null, 'manual input cancels framing at once');
  assert.ok(f.highlight > 0, 'world-space ring stays after the camera yields');
  assert.equal(
    attentionFrame(s, idle(10_200 + ATTENTION_MANUAL_GRACE_MS + 50)).cameraTarget,
    null,
    'a yielded cue never grabs the camera back',
  );
  // A fresh cue after the grace period may frame again.
  s = pushCue(s, { target: 'console', reason: 'issue' }, 10_200 + ATTENTION_MANUAL_GRACE_MS + 100);
  assert.equal(attentionFrame(s, idle(10_200 + ATTENTION_MANUAL_GRACE_MS + 150)).cameraTarget, 'console');
  // But not inside the grace window.
  let g = noteManualInput(createAttentionDirector(), 50_000);
  g = pushCue(g, { target: 'phone', reason: 'enquiry' }, 50_500);
  assert.equal(attentionFrame(g, idle(50_600)).cameraTarget, null, 'grace period blocks new framing');
  assert.equal(attentionFrame(g, idle(50_000 + ATTENTION_MANUAL_GRACE_MS)).cameraTarget, 'phone');
}

// Interacting with the cause cancels the cue mid-animation; other taps do not.
{
  let s = pushCue(createAttentionDirector(), { target: 'phone', reason: 'enquiry' }, 0);
  assert.equal(noteTargetInteraction(s, 'console'), s, 'tapping something else leaves the cue');
  s = noteTargetInteraction(s, 'phone');
  assert.equal(s.active, null);
  assert.deepEqual(attentionFrame(s, idle(100)).cameraTarget, null);
}

// Normal cues frame only when the target is off-centre; low cues and takes never move the camera.
{
  const n = pushCue(createAttentionDirector(), { target: 'phone', reason: 'enquiry' }, 0);
  assert.equal(attentionFrame(n, idle(100, { targetOffCentre: false })).cameraTarget, null);
  assert.equal(attentionFrame(n, idle(100, { targetOffCentre: true })).cameraTarget, 'phone');
  assert.equal(attentionFrame(n, idle(100, { floorFocused: false })).cameraTarget, null, 'drawers own attention');
  const low = pushCue(createAttentionDirector(), { target: 'door', reason: 'wrap' }, 0);
  assert.equal(attentionFrame(low, idle(100)).cameraTarget, null);
  assert.ok(attentionFrame(low, idle(100)).highlight > 0);
  const take = pushCue(createAttentionDirector(), { target: 'liveRoom', reason: 'take', punch: 1 }, 0);
  assert.equal(attentionFrame(take, idle(100)).cameraTarget, null, 'Lock Take is a punch, never a pan');
}

// Reduced Motion: complete non-camera equivalent (steady ring, no ripple, no pan, no punch).
{
  const s = pushCue(createAttentionDirector(), { target: 'shelf', reason: 'issue' }, 0);
  const f = attentionFrame(s, idle(1_000, { reduceMotion: true }));
  assert.equal(f.cameraTarget, null);
  assert.equal(f.ripple, null);
  assert.ok(f.highlight > 0.5, 'static highlight carries the cue');
  const take = pushCue(createAttentionDirector(), { target: 'liveRoom', reason: 'take', punch: 1 }, 0);
  assert.equal(attentionFrame(take, idle(TAKE_PUNCH_MS / 2, { reduceMotion: true })).punchScale, 1);
}

// Lock Take punch returns exactly to 1 and stays small.
{
  assert.equal(takePunchScale(0, 1), 1);
  assert.equal(takePunchScale(TAKE_PUNCH_MS, 1), 1);
  assert.equal(takePunchScale(TAKE_PUNCH_MS + 500, 1), 1, 'one cue cannot permanently alter the camera');
  let peak = 1;
  for (let ms = 0; ms <= TAKE_PUNCH_MS; ms += 8) peak = Math.max(peak, takePunchScale(ms, 1));
  assert.ok(peak > 1.01 && peak < 1.03, `punch is a micro emphasis (${peak})`);
  assert.ok(takePunchScale(120, 0.35) < takePunchScale(120, 1), 'Solid punches softer than Gold');
  const s = pushCue(createAttentionDirector(), { target: 'liveRoom', reason: 'take', punch: 1 }, 0);
  assert.ok(attentionFrame(s, idle(120)).punchScale > 1);
  assert.equal(attentionFrame(s, idle(TAKE_PUNCH_MS + 1)).punchScale, 1);
}

// Edges: cues fire on transitions only, so a save load (first snapshot) replays nothing.
{
  const calm = { enquiryWaiting: false, hasActiveProject: false, issueTarget: null };
  assert.deepEqual(cuesForTransition(calm, calm), []);
  assert.deepEqual(cuesForTransition(calm, { ...calm, enquiryWaiting: true }), [{ target: 'phone', reason: 'enquiry' }]);
  assert.deepEqual(
    cuesForTransition(calm, { ...calm, enquiryWaiting: true, hasActiveProject: true }).map((c) => c.reason),
    ['arrival'],
    'no phone cue while a session is live',
  );
  const live = { enquiryWaiting: false, hasActiveProject: true, issueTarget: null };
  assert.deepEqual(cuesForTransition(live, { ...live, issueTarget: 'shelf' }), [{ target: 'shelf', reason: 'issue' }]);
  assert.deepEqual(cuesForTransition({ ...live, issueTarget: 'shelf' }, { ...live, issueTarget: 'shelf' }), [], 'an open issue cues once');
  assert.deepEqual(cuesForTransition(live, calm), [{ target: 'door', reason: 'wrap' }]);
}

// Off-centre test is relative to the short screen side.
{
  const screen = { width: 400, height: 800 };
  assert.equal(isOffCentre({ x: 200, y: 400 }, screen), false);
  assert.equal(isOffCentre({ x: 260, y: 420 }, screen), false);
  assert.equal(isOffCentre({ x: 360, y: 400 }, screen), true);
}

// Door light: opens as the client walks in, shuts behind them, never shows at rest or under Reduced Motion.
{
  let t = createClientTransitState(false);
  assert.equal(doorOpenAmount(t), 0);
  t = advanceClientTransit(t, { sessionActive: true, dtMs: CLIENT_ENTER_MS * 0.3, reduceMotion: false });
  assert.equal(t.phase, 'entering');
  assert.ok(doorOpenAmount(t) > 0.95, 'door is open mid-walk');
  t = advanceClientTransit(t, { sessionActive: true, dtMs: CLIENT_ENTER_MS * 0.62, reduceMotion: false });
  assert.ok(doorOpenAmount(t) < 0.5, 'door eases shut as they reach the booth');
  t = advanceClientTransit(t, { sessionActive: true, dtMs: CLIENT_ENTER_MS, reduceMotion: false });
  assert.equal(doorOpenAmount(t), 0, 'closed once present');
  const snapped = advanceClientTransit(createClientTransitState(false), { sessionActive: true, dtMs: 16, reduceMotion: true });
  assert.equal(doorOpenAmount(snapped), 0, 'Reduced Motion snaps with the door shut');
  let out = advanceClientTransit(createClientTransitState(true), { sessionActive: false, dtMs: 16, reduceMotion: false });
  assert.ok(doorOpenAmount(out) < 0.1, 'exit starts at the booth with the door shut');
  out = advanceClientTransit(out, { sessionActive: false, dtMs: 1_100 * 0.8, reduceMotion: false });
  assert.ok(doorOpenAmount(out) > 0.9, 'door opens as they reach it');
}

console.log('world attention director passed');
