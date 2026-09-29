import { ControllerType, StandardButton, GamepadSnapshot } from '@/types/gamepad';

export const STANDARD_BUTTONS: StandardButton[] = [
  'south',
  'east',
  'west',
  'north',
  'lb',
  'rb',
  'lt',
  'rt',
  'select',
  'start',
  'ls',
  'rs',
  'dpadUp',
  'dpadDown',
  'dpadLeft',
  'dpadRight',
];

export const BUTTON_INDEX_MAP: Record<StandardButton, number> = {
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
  dpadRight: 15,
};

export const detectControllerType = (id: string): ControllerType => {
  const lower = (id || '').toLowerCase();
  if (lower.includes('045e') || lower.includes('xbox') || lower.includes('x-box') || lower.includes('xinput')) {
    return 'xbox';
  }
  if (
    lower.includes('054c') ||
    lower.includes('dualshock') ||
    lower.includes('dualsense') ||
    lower.includes('wireless controller') ||
    lower.includes('playstation') ||
    lower.includes('sony')
  ) {
    return 'playstation';
  }
  if (
    lower.includes('057e') ||
    lower.includes('switch') ||
    lower.includes('pro controller') ||
    lower.includes('joy-con')
  ) {
    return 'switch';
  }
  return 'generic';
};

export const processStickAxes = (
  rawX: number,
  rawY: number,
  deadzone = 0.18
): { x: number; y: number } => {
  const x = Number.isFinite(rawX) ? rawX : 0;
  const y = Number.isFinite(rawY) ? rawY : 0;
  const mag = Math.hypot(x, y);

  if (mag <= deadzone) {
    return { x: 0, y: 0 };
  }

  // Rescale smoothly from edge of deadzone to outer rim (1.0)
  const normMag = Math.min(1, (mag - deadzone) / (1 - deadzone));
  const scale = normMag / mag;
  return {
    x: Math.max(-1, Math.min(1, x * scale)),
    y: Math.max(-1, Math.min(1, y * scale)),
  };
};

export const mapStandardGamepadButtons = (
  rawButtons: readonly { pressed?: boolean; value?: number }[] | undefined
): Record<StandardButton, boolean> => {
  const result: Partial<Record<StandardButton, boolean>> = {};
  for (const btn of STANDARD_BUTTONS) {
    const idx = BUTTON_INDEX_MAP[btn];
    const b = rawButtons && rawButtons[idx];
    result[btn] = Boolean(b && (b.pressed || (typeof b.value === 'number' && b.value > 0.5)));
  }
  return result as Record<StandardButton, boolean>;
};

export const createDefaultButtons = (): Record<StandardButton, boolean> => {
  const result: Partial<Record<StandardButton, boolean>> = {};
  for (const btn of STANDARD_BUTTONS) {
    result[btn] = false;
  }
  return result as Record<StandardButton, boolean>;
};

export const createDefaultGamepadSnapshot = (): GamepadSnapshot => ({
  isConnected: false,
  controllerType: 'generic',
  buttons: createDefaultButtons(),
  justPressed: createDefaultButtons(),
  justReleased: createDefaultButtons(),
  leftStick: { x: 0, y: 0 },
  rightStick: { x: 0, y: 0 },
  triggers: { left: 0, right: 0 },
});

export const triggerGamepadHaptic = (
  gamepadIndex = 0,
  weakMagnitude = 0.4,
  strongMagnitude = 0.6,
  durationMs = 120
): void => {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') return;
    const gamepads = navigator.getGamepads();
    const pad = gamepads[gamepadIndex] || gamepads.find((g) => g !== null);
    if (!pad) return;

    const actuator = (pad as any).vibrationActuator;
    if (actuator && typeof actuator.playEffect === 'function') {
      actuator.playEffect('dual-rumble', {
        startDelay: 0,
        duration: Math.max(20, Math.min(1000, durationMs)),
        weakMagnitude: Math.max(0, Math.min(1, weakMagnitude)),
        strongMagnitude: Math.max(0, Math.min(1, strongMagnitude)),
      }).catch(() => {
        // Ignored if haptic is busy or unsupported
      });
    }
  } catch {
    // Fail silently in environments without haptic support
  }
};
