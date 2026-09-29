import { detectControllerType } from '@/services/gamepadService';
import { getButtonLabel } from '@/components/ui/GamepadGlyph';
import { DOCK_TABS } from '@/contexts/GamepadNavContext';
import { RADIAL_SLICES } from '@/components/ui/RadialActionWheel';

let passed = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

ok(detectControllerType('Xbox') === 'xbox', 'Xbox detection');
ok(getButtonLabel('south', 'xbox') === 'A', 'Xbox A label');
ok(DOCK_TABS.length === 7, '7 dock tabs');
ok(RADIAL_SLICES.length === 8, '8 radial slices');

console.log(`gamepad-suite: all ${passed} integration checks passed`);
