import {
  getNextDockTab,
  getPreviousDockTab,
  DOCK_TABS,
  isSliderElement,
  getNextFocusableIndex,
  calculateSliderStep,
} from '@/contexts/GamepadNavContext';

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

// 3b. Opt-in adjusters (character creator carousels / swatch groups)
const mockAdjustEl = {
  getAttribute: () => null,
  hasAttribute: (attr: string) => attr === 'data-gamepad-adjust',
  tagName: 'DIV',
} as any;
ok(isSliderElement(mockAdjustEl) === true, 'data-gamepad-adjust elements receive left/right as adjustments');

// 4. Focus navigation wrap
ok(getNextFocusableIndex(0, 'next', 5) === 1, 'next advances index');
ok(getNextFocusableIndex(4, 'next', 5) === 0, 'next wraps from end to 0');
ok(getNextFocusableIndex(0, 'prev', 5) === 4, 'prev wraps from 0 to end');
ok(getNextFocusableIndex(-1, 'next', 5) === 0, 'unfocused targets first element');

console.log(`gamepad-navigation: all ${passed} checks passed`);
