/**
 * Studio riders — gating + resolution path.
 */
import {
  STUDIO_RIDERS,
  RIDER_TEMPLATE_COUNT,
  RIDER_MIN_DIFFICULTY,
  RIDER_MIN_LEVEL,
  RIDER_MIN_REPUTATION,
  RIDER_WORK_MULT,
  RIDER_QUALITY_DELTA,
  canHaveRider,
  deriveRider,
  evaluateRider,
  candleTableDrinks,
  riderHasBeers,
  type StudioRider,
} from '../src/rpg/studioRider';
import type { Equipment } from '../src/types/game';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

let passed = 0;
const ok = (c: boolean, m: string) => {
  if (!c) throw new Error(`FAIL: ${m}`);
  passed++;
  console.log(`PASS: ${m}`);
};

ok(RIDER_TEMPLATE_COUNT >= 5, 'at least 5 authored riders');
ok(
  STUDIO_RIDERS.every((r) => r.items.length >= 2 && r.title && r.blurb),
  'each rider has title, blurb, and 2+ items',
);
ok(
  STUDIO_RIDERS.some((r) => r.items.some((i) => i.kind === 'beer')) &&
    STUDIO_RIDERS.some((r) => r.items.some((i) => i.kind === 'gear' && i.required)),
  'examples cover beers and required gear',
);

// --- Gating: early game stays clean ---
ok(
  !canHaveRider({ reputation: 0, playerLevel: 1, difficulty: 3 }),
  'early reputation/level + low difficulty: no rider',
);
ok(
  !canHaveRider({ reputation: 100, playerLevel: 10, difficulty: RIDER_MIN_DIFFICULTY - 1 }),
  'high rep but easy gig: no rider',
);
ok(
  !canHaveRider({ reputation: RIDER_MIN_REPUTATION - 1, playerLevel: RIDER_MIN_LEVEL - 1, difficulty: 8 }),
  'hard gig but pre-gate career: no rider',
);
ok(
  canHaveRider({ reputation: RIDER_MIN_REPUTATION, playerLevel: 1, difficulty: RIDER_MIN_DIFFICULTY }),
  'reputation gate alone unlocks riders',
);
ok(
  canHaveRider({ reputation: 0, playerLevel: RIDER_MIN_LEVEL, difficulty: RIDER_MIN_DIFFICULTY }),
  'level gate alone unlocks riders',
);

const early = deriveRider(
  { id: 'p-early', genre: 'Rock', difficulty: 3 },
  { reputation: 0, playerLevel: 1, eraId: 'analog60s' },
);
ok(early === undefined, 'deriveRider returns nothing for early-game enquiries');

const gatedCtx = { reputation: 40, playerLevel: 6, eraId: 'analog60s' as const };
const a = deriveRider({ id: 'p-rock-1', genre: 'Rock', difficulty: 7 }, gatedCtx);
const b = deriveRider({ id: 'p-rock-1', genre: 'Rock', difficulty: 7 }, gatedCtx);
ok(JSON.stringify(a) === JSON.stringify(b), 'deriveRider is deterministic for the same project');

// Force a known rider for resolution tests
const rockRider = STUDIO_RIDERS.find((r) => r.id === 'rider-rock-beers-outboard') as StudioRider;
ok(rockRider && riderHasBeers(rockRider), 'rock rider includes beers');

const gear = (category: Equipment['category'], condition = 100): Equipment => ({
  id: category,
  name: category,
  category,
  price: 0,
  description: '',
  bonuses: {},
  icon: '',
  condition,
});

const met = evaluateRider(rockRider, [gear('outboard')], { sessionLive: true, brewReady: true });
ok(met.met && met.missingRequired.length === 0, 'owned outboard meets required gear');
ok(met.workMultiplier === RIDER_WORK_MULT.met && met.qualityDelta === RIDER_QUALITY_DELTA.met, 'meeting rider grants small bonus');

const miss = evaluateRider(rockRider, [gear('microphone')], { sessionLive: true });
ok(!miss.met && miss.missingRequired.some((i) => i.gearCategory === 'outboard'), 'missing required gear is flagged');
ok(miss.workMultiplier === RIDER_WORK_MULT.miss && miss.qualityDelta === RIDER_QUALITY_DELTA.miss, 'missing gear soft-penalises');
ok(miss.warnings.length > 0, 'missing gear produces a warning string');

const worn = evaluateRider(rockRider, [gear('outboard', 10)], { sessionLive: true });
ok(!worn.met, 'worn-out gear below condition floor does not count');

const none = evaluateRider(undefined, [gear('outboard')]);
ok(none.workMultiplier === RIDER_WORK_MULT.none && none.qualityDelta === 0, 'no rider is a no-op');

// --- Candle table drinks coordinate brew coffee vs rider beers ---
ok(
  JSON.stringify(candleTableDrinks({ brewReady: true, riderBeers: false, sessionLive: true })) ===
    JSON.stringify({ coffee: true, beer: false }),
  'brew alone shows coffee, not beers',
);
ok(
  JSON.stringify(candleTableDrinks({ brewReady: false, riderBeers: true, sessionLive: true })) ===
    JSON.stringify({ coffee: false, beer: true }),
  'rider beers spawn only with a live session',
);
ok(
  JSON.stringify(candleTableDrinks({ brewReady: true, riderBeers: true, sessionLive: false })) ===
    JSON.stringify({ coffee: true, beer: false }),
  'beers stay off when no session is live',
);
ok(
  JSON.stringify(candleTableDrinks({ brewReady: true, riderBeers: true, sessionLive: true })) ===
    JSON.stringify({ coffee: true, beer: true }),
  'coffee and beers can coexist on the candle table',
);

// --- Wiring smoke ---
const root = resolve(process.cwd());
const projectList = readFileSync(resolve(root, 'src/components/ProjectList.tsx'), 'utf8');
const active = readFileSync(resolve(root, 'src/components/ActiveProject.tsx'), 'utf8');
const room = readFileSync(resolve(root, 'src/components/StudioRoom.tsx'), 'utf8');
const decor = readFileSync(resolve(root, 'src/components/studio/studioDecor.ts'), 'utf8');
const utils = readFileSync(resolve(root, 'src/utils/projectUtils.ts'), 'utf8');
ok(/RiderPanel/.test(projectList), 'booking card mounts RiderPanel');
ok(/RiderPanel/.test(active) && /mode="session"/.test(active), 'session prep shows rider');
ok(/riderBeers/.test(room), 'StudioRoom passes riderBeers into the floor');
ok(/buildCandleBeers/.test(decor), 'candle table has rider beer props');
ok(/deriveRider/.test(utils), 'project generation attaches riders');

console.log(`\n${passed} checks passed`);
