import { getButtonLabel, getButtonColor } from '@/components/ui/GamepadGlyph';

let passed = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

// 1. Button labels across controller types
ok(getButtonLabel('south', 'xbox') === 'A', 'Xbox south is A');
ok(getButtonLabel('east', 'xbox') === 'B', 'Xbox east is B');
ok(getButtonLabel('west', 'xbox') === 'X', 'Xbox west is X');
ok(getButtonLabel('north', 'xbox') === 'Y', 'Xbox north is Y');

ok(getButtonLabel('south', 'playstation') === '✕', 'PlayStation south is Cross');
ok(getButtonLabel('east', 'playstation') === '○', 'PlayStation east is Circle');
ok(getButtonLabel('west', 'playstation') === '□', 'PlayStation west is Square');
ok(getButtonLabel('north', 'playstation') === '△', 'PlayStation north is Triangle');

ok(getButtonLabel('south', 'switch') === 'B', 'Switch south is B');
ok(getButtonLabel('east', 'switch') === 'A', 'Switch east is A');
ok(getButtonLabel('west', 'switch') === 'Y', 'Switch west is Y');
ok(getButtonLabel('north', 'switch') === 'X', 'Switch north is X');

ok(getButtonLabel('south', 'generic') === 'S', 'Generic south is S');
ok(getButtonLabel('lb', 'xbox') === 'LB', 'Xbox bumper is LB');
ok(getButtonLabel('lb', 'playstation') === 'L1', 'PlayStation bumper is L1');
ok(getButtonLabel('lb', 'switch') === 'L', 'Switch bumper is L');

// 2. Button colors
ok(getButtonColor('south', 'xbox') === '#10b981', 'Xbox A is emerald green');
ok(getButtonColor('east', 'xbox') === '#ef4444', 'Xbox B is red');
ok(getButtonColor('south', 'playstation') === '#38bdf8', 'PlayStation Cross is sky blue');

console.log(`gamepad-glyph: all ${passed} checks passed`);
