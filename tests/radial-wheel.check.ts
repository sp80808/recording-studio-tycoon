import { getRadialSliceFromStick, RADIAL_SLICES } from '@/components/ui/RadialActionWheel';

let passed = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

ok(RADIAL_SLICES.length === 8, '8 radial slice options');

// Stick pointing straight up (0, -1) -> North (Bookings)
const northSlice = getRadialSliceFromStick(0, -1);
ok(northSlice?.id === 'bookings', 'North slice is bookings');

// Stick pointing right (1, 0) -> East (Gear)
const eastSlice = getRadialSliceFromStick(1, 0);
ok(eastSlice?.id === 'gear', 'East slice is gear');

// Stick pointing down (0, 1) -> South (Crew)
const southSlice = getRadialSliceFromStick(0, 1);
ok(southSlice?.id === 'crew', 'South slice is crew');

// Stick pointing left (-1, 0) -> West (Career)
const westSlice = getRadialSliceFromStick(-1, 0);
ok(westSlice?.id === 'career', 'West slice is career');

// Neutral / center returns null
ok(getRadialSliceFromStick(0.05, 0.05) === null, 'neutral stick returns null');

console.log(`radial-wheel: all ${passed} checks passed`);
