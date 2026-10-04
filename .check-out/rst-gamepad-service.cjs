// src/services/gamepadService.ts
var STANDARD_BUTTONS = [
  "south",
  "east",
  "west",
  "north",
  "lb",
  "rb",
  "lt",
  "rt",
  "select",
  "start",
  "ls",
  "rs",
  "dpadUp",
  "dpadDown",
  "dpadLeft",
  "dpadRight"
];
var BUTTON_INDEX_MAP = {
  south: 0,
  east: 1,
  west: 2,
  north: 3,
  lb: 4,
  rb: 5,
  lt: 6,
  rt: 7,
  select: 8,
  start: 9,
  ls: 10,
  rs: 11,
  dpadUp: 12,
  dpadDown: 13,
  dpadLeft: 14,
  dpadRight: 15
};
var detectControllerType = (id) => {
  const lower = (id || "").toLowerCase();
  if (lower.includes("045e") || lower.includes("xbox") || lower.includes("x-box") || lower.includes("xinput")) {
    return "xbox";
  }
  if (lower.includes("054c") || lower.includes("dualshock") || lower.includes("dualsense") || lower.includes("wireless controller") || lower.includes("playstation") || lower.includes("sony")) {
    return "playstation";
  }
  if (lower.includes("057e") || lower.includes("switch") || lower.includes("pro controller") || lower.includes("joy-con")) {
    return "switch";
  }
  return "generic";
};
var processStickAxes = (rawX, rawY, deadzone = 0.18) => {
  const x = Number.isFinite(rawX) ? rawX : 0;
  const y = Number.isFinite(rawY) ? rawY : 0;
  const mag = Math.hypot(x, y);
  if (mag <= deadzone) {
    return { x: 0, y: 0 };
  }
  const normMag = Math.min(1, (mag - deadzone) / (1 - deadzone));
  const scale = normMag / mag;
  return {
    x: Math.max(-1, Math.min(1, x * scale)),
    y: Math.max(-1, Math.min(1, y * scale))
  };
};
var mapStandardGamepadButtons = (rawButtons) => {
  const result = {};
  for (const btn of STANDARD_BUTTONS) {
    const idx = BUTTON_INDEX_MAP[btn];
    const b = rawButtons && rawButtons[idx];
    result[btn] = Boolean(b && (b.pressed || typeof b.value === "number" && b.value > 0.5));
  }
  return result;
};

// tests/gamepad-service.check.ts
var passed = 0;
var ok = (cond, msg) => {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};
ok(detectControllerType("Xbox 360 Controller (XInput STANDARD GAMEPAD)") === "xbox", "detects Xbox 360 controller");
ok(detectControllerType("Xbox Wireless Controller (045e)") === "xbox", "detects Xbox Wireless controller");
ok(detectControllerType("Sony Interactive Entertainment Wireless Controller (054c)") === "playstation", "detects DualShock / DualSense");
ok(detectControllerType("PS4 DualShock 4 Wireless Controller") === "playstation", "detects PS4 controller");
ok(detectControllerType("Nintendo Switch Pro Controller (057e)") === "switch", "detects Switch Pro");
ok(detectControllerType("Unknown USB Gamepad") === "generic", "detects generic pad");
var centered = processStickAxes(0.05, -0.08, 0.18);
ok(centered.x === 0 && centered.y === 0, "deadzone eliminates micro-drift");
var deflected = processStickAxes(0.8, -0.6, 0.18);
ok(deflected.x > 0.7 && deflected.y < -0.5, "preserves valid stick deflection");
var mockButtons = Array.from({ length: 17 }, (_, i) => ({ pressed: i === 0, value: i === 0 ? 1 : 0 }));
var mapped = mapStandardGamepadButtons(mockButtons);
ok(mapped.south === true && mapped.east === false, "maps button 0 to south");
console.log(`gamepad-service: all ${passed} checks passed`);
