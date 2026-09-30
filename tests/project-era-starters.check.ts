import assert from 'node:assert';
import { generateNewProjects } from '@/utils/projectUtils';
import { ERA_DEFINITIONS } from '@/utils/eraProgression';
import { GIG_TEMPLATES, TIMELESS_WEIGHT, getEraGigPool, pickWeightedGig } from '@/data/gigTemplates';

let passed = 0;
const ok = (cond: boolean, msg: string) => {
  assert(cond, `FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

const timelessGenres = new Set(GIG_TEMPLATES.filter((t) => t.timeless).map((t) => t.genre));

for (const era of ERA_DEFINITIONS) {
  const starterPool = getEraGigPool(era.id, 'starter', era.availableGenres);
  const advancedPool = getEraGigPool(era.id, 'advanced', era.availableGenres);

  // Every genre the era advertises must have a starter *and* an advanced booking.
  for (const genre of era.availableGenres) {
    ok(
      starterPool.some((g) => g.template.genre === genre && g.weight === 1),
      `${era.id}: "${genre}" has a native starter gig`,
    );
  }
  const nativeAdvancedGenres = new Set(advancedPool.filter((g) => g.weight === 1).map((g) => g.template.genre));
  ok(nativeAdvancedGenres.size >= 2, `${era.id}: at least two genres have native advanced work (${[...nativeAdvancedGenres].join(', ')})`);

  // No other era's locked template may leak in at any weight.
  for (const { template } of [...starterPool, ...advancedPool]) {
    const locked = template.eras.length > 0 && !template.eras.includes(era.id);
    ok(!locked || template.timeless === true, `${era.id}: "${template.id}" belongs here (native or timeless)`);
  }

  // Off-trend staples only ever ride at the reduced weight.
  for (const g of [...starterPool, ...advancedPool]) {
    if (g.weight !== 1) ok(g.weight === TIMELESS_WEIGHT && timelessGenres.has(g.template.genre), `${era.id}: off-era "${g.template.id}" is a timeless staple at reduced weight`);
  }
}

// Starter bookings at level 1 are native or timeless — and never come from a different era's exclusive list.
for (const era of ERA_DEFINITIONS) {
  const allowed = new Set([...era.availableGenres, ...timelessGenres]);
  const projects = generateNewProjects(24, 1, era.id);
  ok(projects.length === 24, `${era.id}: generates the requested number of bookings`);
  ok(
    projects.every((p) => allowed.has(p.genre)),
    `${era.id}: bookings are era-appropriate (${[...new Set(projects.map((p) => p.genre))].join(', ')})`,
  );
}

// 1980 and 2000 no longer collapse into an endless run of "Electronic" demos.
for (const eraId of ['digital80s', 'internet2000s'] as const) {
  const genres = new Set(generateNewProjects(60, 1, eraId).map((p) => p.genre));
  ok(genres.size >= 3, `${eraId}: starter board shows genre variety (${[...genres].join(', ')})`);
}

// Origin genres stay reachable: Hip-Hop/Lo-fi/Trap for beatmakers, Rock/Jazz/Folk for purists.
ok(getEraGigPool('digital80s', 'starter', []).some((g) => g.template.genre === 'Hip-Hop'), 'Hip-Hop is bookable in the 80s');
ok(getEraGigPool('streaming2020s', 'starter', ['Trap']).some((g) => g.template.genre === 'Trap'), 'Trap is bookable in the 2020s');
ok(getEraGigPool('streaming2020s', 'starter', []).some((g) => g.template.genre === 'Rock'), 'Rock stays on the board in the 2020s as a timeless staple');

// The weighted pick is deterministic and respects weights at the extremes.
const pool = getEraGigPool('analog60s', 'starter', ERA_DEFINITIONS[0].availableGenres);
ok(pickWeightedGig(pool, 0) === pool[0].template, 'roll 0 picks the first entry');
ok(pickWeightedGig(pool, 0.999999) === pool[pool.length - 1].template, 'roll ~1 picks the last entry');
ok(pickWeightedGig(pool, 0.4) === pickWeightedGig(pool, 0.4), 'same roll → same template');

// Payout curve sanity: the catalog never reintroduces a 250-spike or a 60k jackpot.
ok(GIG_TEMPLATES.every((t) => t.basePayout >= 250 && t.basePayout <= 4000), 'template payouts stay inside the 250–4000 band');
ok(GIG_TEMPLATES.every((t) => t.tier === 'advanced' ? t.difficulty >= 4 : t.difficulty <= 4), 'starter gigs stay ≤ difficulty 4; advanced gigs start at 4');
ok(new Set(GIG_TEMPLATES.map((t) => t.id)).size === GIG_TEMPLATES.length, 'template ids are unique');

console.log(`project-era-starters: all ${passed} checks passed`);
