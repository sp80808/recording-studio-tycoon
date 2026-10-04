export type ControllerType = 'xbox' | 'playstation' | 'switch' | 'generic';

export type ControllerLayoutPreference = 'auto' | 'xbox' | 'playstation' | 'switch' | 'generic';

export type StandardButton =
  | 'south'
  | 'east'
  | 'west'
  | 'north'
  | 'lb'
  | 'rb'
  | 'lt'
  | 'rt'
  | 'select'
  | 'start'
  | 'ls'
  | 'rs'
  | 'dpadUp'
  | 'dpadDown'
  | 'dpadLeft'
  | 'dpadRight';

export interface GamepadStickState {
  x: number;
  y: number;
}

export interface GamepadSnapshot {
  isConnected: boolean;
  controllerType: ControllerType;
  buttons: Record<StandardButton, boolean>;
  justPressed: Record<StandardButton, boolean>;
  justReleased: Record<StandardButton, boolean>;
  leftStick: GamepadStickState;
  rightStick: GamepadStickState;
  triggers: { left: number; right: number };
}

export type HapticPattern =
  | 'tick'
  | 'detent'
  | 'goldSuccess'
  | 'solidSuccess'
  | 'offTime'
  | 'motorHum';

