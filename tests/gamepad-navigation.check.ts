import { getNextDockTab, getPreviousDockTab, DOCK_TABS, DockTabId } from '@/contexts/GamepadNavContext';

let passed = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

ok(DOCK_TABS.length === 7, 'has 7 primary dock tabs');
ok(getNextDockTab('bookings') === 'session', 'bookings next is session');
ok(getNextDockTab('career') === 'bookings', 'career wraps to bookings');
ok(getPreviousDockTab('bookings') === 'career', 'bookings prev wraps to career');
ok(getPreviousDockTab('session') === 'bookings', 'session prev is bookings');
ok(getNextDockTab('gear') === 'crew', 'gear next is crew');

console.log(`gamepad-navigation: all ${passed} checks passed`);
