import {
  getNextDockTab,
  getPreviousDockTab,
  DOCK_TABS,
  isSliderElement,
  getNextFocusableIndex,
  calculateSliderStep,
} from '@/contexts/GamepadNavContext';
import { getDirectionalTargetIndex, getStickDirection } from '@/utils/controllerNavigation';

let passed = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

// 1. Dock tab cycling
ok(DOCK_TABS.length === 7, 'has 7 primary dock tabs');
ok(getNextDockTab('bookings') === 'session', 'bookings next is session');
ok(getNextDockTab('career') === 'bookings', 'career wraps to bookings');
ok(getPreviousDockTab('bookings') === 'career', 'bookings prev wraps to career');
ok(getPreviousDockTab('session') === 'bookings', 'session prev is bookings');
ok(getNextDockTab('gear') === 'crew', 'gear next is crew');

// 2. Slider detection logic
const mockSliderEl = {
  getAttribute: (attr: string) => (attr === 'role' ? 'slider' : null),
  hasAttribute: (attr: string) => attr === 'data-radix-slider-thumb',
  tagName: 'SPAN',
} as any;
ok(isSliderElement(mockSliderEl) === true, 'identifies role=slider element');

const mockButtonEl = {
  getAttribute: (attr: string) => null,
  hasAttribute: (attr: string) => false,
  tagName: 'BUTTON',
} as any;
ok(isSliderElement(mockButtonEl) === false, 'button is not a slider');
ok(isSliderElement(null) === false, 'null is not a slider');

// 3. Slider step calculation
ok(calculateSliderStep(50, 'inc', 5, 0, 100) === 55, 'increments slider by step 5');
ok(calculateSliderStep(50, 'dec', 5, 0, 100) === 45, 'decrements slider by step 5');
ok(calculateSliderStep(98, 'inc', 5, 0, 100) === 100, 'clamps slider increment to max');
ok(calculateSliderStep(2, 'dec', 5, 0, 100) === 0, 'clamps slider decrement to min');

// 4. Focus navigation wrap
ok(getNextFocusableIndex(0, 'next', 5) === 1, 'next advances index');
ok(getNextFocusableIndex(4, 'next', 5) === 0, 'next wraps from end to 0');
ok(getNextFocusableIndex(0, 'prev', 5) === 4, 'prev wraps from 0 to end');
ok(getNextFocusableIndex(-1, 'next', 5) === 0, 'unfocused targets first element');

// 5. Analog direction + studio-floor spatial navigation
ok(getStickDirection(0.8, 0.1) === 'right', 'right stick intent is stable');
ok(getStickDirection(-0.1, -0.9) === 'up', 'up stick intent is stable');
ok(getStickDirection(0.2, 0.2) === null, 'small stick drift stays neutral');

const floorIds = ['console', 'phone', 'liveRoom', 'shelf'] as const;
const floorAnchors = {
  console: { x: 100, y: 100 },
  phone: { x: 260, y: 95 },
  liveRoom: { x: 110, y: 260 },
  shelf: { x: 280, y: 250 },
};
ok(getDirectionalTargetIndex(floorIds, floorAnchors, 0, 'right') === 1, 'floor right follows visible neighbour');
ok(getDirectionalTargetIndex(floorIds, floorAnchors, 0, 'down') === 2, 'floor down follows visible neighbour');
ok(getDirectionalTargetIndex(floorIds, {}, 0, 'left') === 3, 'missing anchors fall back safely');

console.log(`gamepad-navigation: all ${passed} checks passed`);
