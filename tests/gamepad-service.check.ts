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

// 4. Trigger normalization & actuation
import {
  normalizeTriggerValue,
  isTriggerEngaged,
  HAPTIC_PATTERNS,
  triggerHapticPattern,
} from '@/services/gamepadService';

ok(normalizeTriggerValue(0.75) === 0.75, 'preserves valid trigger value');
ok(normalizeTriggerValue(-0.2) === 0, 'clamps negative trigger value to 0');
ok(normalizeTriggerValue(1.5) === 1, 'clamps excess trigger value to 1');
ok(normalizeTriggerValue(undefined) === 0, 'handles undefined trigger as 0');
ok(normalizeTriggerValue(NaN) === 0, 'handles NaN trigger as 0');

ok(isTriggerEngaged(0.4) === true, 'trigger engaged at 0.4 threshold');
ok(isTriggerEngaged(0.39) === false, 'trigger not engaged below threshold');
ok(isTriggerEngaged(0.85, 0.8) === true, 'trigger full pull detected at custom threshold');

// 5. Haptic pattern registry
ok(HAPTIC_PATTERNS.tick.weak > 0 && HAPTIC_PATTERNS.tick.strong === 0, 'tick is high-freq weak only');
ok(HAPTIC_PATTERNS.goldSuccess.strong >= 0.9, 'gold success delivers powerful strong rumble');
ok(HAPTIC_PATTERNS.motorHum.duration <= 50, 'motor hum has short pulse duration');

// 6. triggerHapticPattern execution without crashing
triggerHapticPattern(0, 'goldSuccess');
ok(true, 'triggerHapticPattern completes safely without throwing');

console.log(`gamepad-service: all ${passed} checks passed`);

