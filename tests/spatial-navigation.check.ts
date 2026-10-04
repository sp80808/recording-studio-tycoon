import {
  computeSpatialScore,
  findNextSpatialFocus,
  SpatialDirection,
  SpatialPoint,
} from '@/utils/spatialNavigation';

let passed = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

// 1. Half-plane rejection
const origin: SpatialPoint = { x: 100, y: 100 };
ok(computeSpatialScore(origin, { x: 200, y: 100 }, 'right') !== null, 'right target is valid for right');
ok(computeSpatialScore(origin, { x: 50, y: 100 }, 'right') === null, 'left target rejected for right');
ok(computeSpatialScore(origin, { x: 100, y: 200 }, 'down') !== null, 'down target is valid for down');
ok(computeSpatialScore(origin, { x: 100, y: 50 }, 'down') === null, 'up target rejected for down');
ok(computeSpatialScore(origin, { x: 50, y: 100 }, 'left') !== null, 'left target is valid for left');
ok(computeSpatialScore(origin, { x: 100, y: 50 }, 'up') !== null, 'up target is valid for up');

// 2. Cone angle filtering (reject beyond ±50 degrees)
// 45 degrees: dx = 100, dy = 100 -> valid cone
ok(computeSpatialScore(origin, { x: 200, y: 200 }, 'right') !== null, '45 degree candidate accepted in right cone');
// 65 degrees: dx = 50, dy = 120 -> rejected
ok(computeSpatialScore(origin, { x: 150, y: 220 }, 'right') === null, 'wide angle candidate rejected outside cone');

// 3. Distance & Alignment scoring
const straightAhead = computeSpatialScore(origin, { x: 200, y: 100 }, 'right')!;
const diagonal = computeSpatialScore(origin, { x: 200, y: 150 }, 'right')!;
ok(straightAhead < diagonal, 'straight-ahead target has lower penalty score than diagonal target');

// 4. Mock DOM 2x2 Grid spatial navigation
const createMockEl = (x: number, y: number, w = 80, h = 40, id = '') => {
  return {
    id,
    tagName: 'BUTTON',
    getBoundingClientRect: () => ({
      left: x,
      top: y,
      right: x + w,
      bottom: y + h,
      width: w,
      height: h,
    }),
    getAttribute: (attr: string) => null,
    hasAttribute: (attr: string) => false,
  } as unknown as HTMLElement;
};

const btn00 = createMockEl(0, 0, 80, 40, 'b00');
const btn10 = createMockEl(120, 0, 80, 40, 'b10');
const btn01 = createMockEl(0, 80, 80, 40, 'b01');
const btn11 = createMockEl(120, 80, 80, 40, 'b11');

const allButtons = [btn00, btn10, btn01, btn11];
const mockContainer = {
  querySelectorAll: (selector: string) => allButtons,
} as unknown as HTMLElement;

// Navigating right from (0,0) -> (1,0)
const nextRight = findNextSpatialFocus(btn00, 'right', mockContainer);
ok(nextRight === btn10, 'moves right from (0,0) to (1,0)');

// Navigating down from (0,0) -> (0,1)
const nextDown = findNextSpatialFocus(btn00, 'down', mockContainer);
ok(nextDown === btn01, 'moves down from (0,0) to (0,1)');

// Navigating right from (0,1) -> (1,1)
const nextRight1 = findNextSpatialFocus(btn01, 'right', mockContainer);
ok(nextRight1 === btn11, 'moves right from (0,1) to (1,1)');

// Navigating up from (1,1) -> (1,0)
const nextUp = findNextSpatialFocus(btn11, 'up', mockContainer);
ok(nextUp === btn10, 'moves up from (1,1) to (1,0)');

// Navigating left from (1,0) -> (0,0)
const nextLeft = findNextSpatialFocus(btn10, 'left', mockContainer);
ok(nextLeft === btn00, 'moves left from (1,0) to (0,0)');

// Boundary: moving left from (0,0) should return null (no element left)
const noLeft = findNextSpatialFocus(btn00, 'left', mockContainer);
ok(noLeft === null, 'returns null when no candidate in direction');

console.log(`spatial-navigation: all ${passed} checks passed`);
