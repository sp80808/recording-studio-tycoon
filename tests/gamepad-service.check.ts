import { detectControllerType, processStickAxes, mapStandardGamepadButtons } from '@/services/gamepadService';

let passed = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

// 1. Controller detection heuristics
ok(detectControllerType('Xbox 360 Controller (XInput STANDARD GAMEPAD)') === 'xbox', 'detects Xbox 360 controller');
ok(detectControllerType('Xbox Wireless Controller (045e)') === 'xbox', 'detects Xbox Wireless controller');
ok(detectControllerType('Sony Interactive Entertainment Wireless Controller (054c)') === 'playstation', 'detects DualShock / DualSense');
ok(detectControllerType('PS4 DualShock 4 Wireless Controller') === 'playstation', 'detects PS4 controller');
ok(detectControllerType('Nintendo Switch Pro Controller (057e)') === 'switch', 'detects Switch Pro');
ok(detectControllerType('Unknown USB Gamepad') === 'generic', 'detects generic pad');

// 2. Deadzone processing
const centered = processStickAxes(0.05, -0.08, 0.18);
ok(centered.x === 0 && centered.y === 0, 'deadzone eliminates micro-drift');

const deflected = processStickAxes(0.8, -0.6, 0.18);
ok(deflected.x > 0.7 && deflected.y < -0.5, 'preserves valid stick deflection');

// 3. Standard button mapping
const mockButtons = Array.from({ length: 17 }, (_, i) => ({ pressed: i === 0, value: i === 0 ? 1 : 0 }));
const mapped = mapStandardGamepadButtons(mockButtons as any);
ok(mapped.south === true && mapped.east === false, 'maps button 0 to south');

console.log(`gamepad-service: all ${passed} checks passed`);
