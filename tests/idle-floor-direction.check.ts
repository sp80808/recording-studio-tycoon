/**
 * Idle floor direction — priority picker + camera ease math.
 */
import assert from 'node:assert/strict';
import {
  IDLE_CAMERA_ZOOM,
  IDLE_HINT_DELAY_MS,
  DOOR_HINT_DELAY_MS,
  cameraPoseForFocus,
  cameraPoseNear,
  getIdleHintTarget,
  lerpCameraPose,
  pickIdleDirectionTarget,
  shouldShowDoorHint,
} from '../src/components/studio/idleFloorDirection';

console.log('idle-floor-direction checks…');

assert.equal(IDLE_HINT_DELAY_MS, 8_000);
assert.equal(DOOR_HINT_DELAY_MS, 12_000);
assert.ok(IDLE_CAMERA_ZOOM > 1 && IDLE_CAMERA_ZOOM < 1.35, 'idle zoom should be a gentle nudge');

// Too early
assert.equal(
  pickIdleDirectionTarget({
    idleMs: 1_000,
    floorFocused: true,
    enquiryWaiting: true,
    hasActiveProject: false,
    pendingChoreHotspot: 'console',
  }),
  null,
);

// Drawer open — stay quiet
assert.equal(
  pickIdleDirectionTarget({
    idleMs: 20_000,
    floorFocused: false,
    enquiryWaiting: true,
    hasActiveProject: false,
    pendingChoreHotspot: 'shelf',
  }),
  null,
);

// Enquiries beat chores
assert.equal(
  pickIdleDirectionTarget({
    idleMs: IDLE_HINT_DELAY_MS,
    floorFocused: true,
    enquiryWaiting: true,
    hasActiveProject: false,
    pendingChoreHotspot: 'shelf',
  }),
  'phone',
);

// Active session → console
assert.equal(
  pickIdleDirectionTarget({
    idleMs: IDLE_HINT_DELAY_MS,
    floorFocused: true,
    enquiryWaiting: true,
    hasActiveProject: true,
    pendingChoreHotspot: 'liveRoom',
  }),
  'console',
);

// Chores when nothing more urgent
assert.equal(
  pickIdleDirectionTarget({
    idleMs: IDLE_HINT_DELAY_MS,
    floorFocused: true,
    enquiryWaiting: false,
    hasActiveProject: false,
    pendingChoreHotspot: 'liveRoom',
  }),
  'liveRoom',
);

// Soft explore door only after the longer delay
assert.equal(
  pickIdleDirectionTarget({
    idleMs: IDLE_HINT_DELAY_MS,
    floorFocused: true,
    enquiryWaiting: false,
    hasActiveProject: false,
    pendingChoreHotspot: null,
  }),
  null,
);
assert.equal(
  pickIdleDirectionTarget({
    idleMs: DOOR_HINT_DELAY_MS,
    floorFocused: true,
    enquiryWaiting: false,
    hasActiveProject: false,
    pendingChoreHotspot: null,
  }),
  'door',
);

assert.equal(shouldShowDoorHint(DOOR_HINT_DELAY_MS - 1), false);
assert.equal(shouldShowDoorHint(DOOR_HINT_DELAY_MS), true);
assert.equal(getIdleHintTarget(true, IDLE_HINT_DELAY_MS), 'console');
assert.equal(getIdleHintTarget(false, IDLE_HINT_DELAY_MS), 'phone');

const focused = cameraPoseForFocus({
  focusLocal: { x: 40, y: -20 },
  basePosition: { x: 100, y: 80 },
  baseScale: 1,
  screen: { width: 800, height: 600 },
  targetZoom: IDLE_CAMERA_ZOOM,
  minZoom: 0.75,
  maxZoom: 2.6,
});
assert.equal(focused.zoom, IDLE_CAMERA_ZOOM);
assert.ok(Number.isFinite(focused.x) && Number.isFinite(focused.y));

const mid = lerpCameraPose({ x: 0, y: 0, zoom: 1 }, { x: 10, y: -10, zoom: 1.2 }, 0.5);
assert.equal(mid.x, 5);
assert.equal(mid.y, -5);
assert.ok(Math.abs(mid.zoom - 1.1) < 1e-9);
assert.equal(cameraPoseNear(mid, mid), true);
assert.equal(cameraPoseNear(mid, { x: 100, y: 100, zoom: 2 }), false);

console.log('✓ idle-floor-direction checks passed');
