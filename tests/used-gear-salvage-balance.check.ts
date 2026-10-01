import assert from 'node:assert/strict';
import { awardProjectCrate } from '@/features/usedGear/session';
import {
  generateCrateGear,
  generateDailyClassifieds,
  gearCatalogue,
  resaleValue,
} from '@/features/usedGear/generation';
import { getEraAdjustedPrice } from '@/data/eraEquipment';
import type { GameState, Project } from '@/types/game';

// 4oq audit: S-grade free salvage payouts vs the economy harness.
// awardProjectCrate gates on quality >= 90 and rolls a seeded 15% (40% moonshot)
// for a free standard crate. This check pins the gates, the rates, the
// structural resale bound (resale < catalogue price — factor caps at
// 0.2 + 95*0.004 = 0.58, x1.2 rarity = 0.696) and the paid bargain cap
// (discount <= $20/listing). Absolute distributions print for human review;
// no new economy policy is imposed here.

const baseState = (overrides: Record<string, unknown> = {}): GameState =>
  ({
    saveSeed: 7,
    money: 10000,
    currentDay: 2,
    currentYear: 2024,
    selectedEra: 'modern',
    currentEra: 'modern',
    eraStartYear: 2024,
    equipmentMultiplier: 1,
    pendingCrates: [],
    ...overrides,
  }) as unknown as GameState;

const baseProject = (overrides: Record<string, unknown> = {}): Project =>
  ({ id: 'session-1', stake: undefined, ...overrides }) as unknown as Project;

// 1. Gates: sub-S quality, missing project and non-finite quality never award.
assert.deepEqual(awardProjectCrate(baseState(), baseProject(), 89).pendingCrates ?? [], []);
assert.deepEqual(awardProjectCrate(baseState(), undefined, 95).pendingCrates ?? [], []);
assert.deepEqual(awardProjectCrate(baseState(), baseProject(), Number.NaN).pendingCrates ?? [], []);
console.log('PASS: salvage gates (quality>=90, project required, finite quality)');

// 2. Idempotency: the same project can never double-award.
{
  const first = awardProjectCrate(baseState(), baseProject({ id: 'dup-1' }), 100);
  const awarded = (first.pendingCrates ?? []).length;
  const second = awardProjectCrate(first, baseProject({ id: 'dup-1' }), 100);
  assert.equal((second.pendingCrates ?? []).length, awarded);
  if (awarded === 1) assert.equal(second.pendingCrates![0].id, 'crate:project:dup-1');
  console.log('PASS: salvage idempotency (duplicate settlement guard)');
}

// 3. Determinism: same seed + project id -> same outcome.
{
  const a = awardProjectCrate(baseState({ saveSeed: 99 }), baseProject({ id: 'det-1' }), 95);
  const b = awardProjectCrate(baseState({ saveSeed: 99 }), baseProject({ id: 'det-1' }), 95);
  assert.deepEqual(a.pendingCrates ?? [], b.pendingCrates ?? []);
  console.log('PASS: salvage determinism (seeded roll stable)');
}

// 4. Rates: safe ~15%, moonshot ~40% (wide binomial tolerance, N=3000).
{
  const N = 3000;
  let safe = 0;
  let moon = 0;
  for (let i = 0; i < N; i++) {
    if ((awardProjectCrate(baseState({ saveSeed: i }), baseProject({ id: `rate-safe-${i}` }), 95).pendingCrates ?? []).length) safe++;
    if ((awardProjectCrate(baseState({ saveSeed: i }), baseProject({ id: `rate-moon-${i}`, stake: 'moonshot' }), 95).pendingCrates ?? []).length) moon++;
  }
  const safeRate = safe / N;
  const moonRate = moon / N;
  console.log(`INFO: salvage drop rate safe=${safeRate.toFixed(3)} (target 0.15) moonshot=${moonRate.toFixed(3)} (target 0.40) N=${N}`);
  assert.ok(safeRate >= 0.1 && safeRate <= 0.2, `safe rate ${safeRate} outside [0.10, 0.20]`);
  assert.ok(moonRate >= 0.33 && moonRate <= 0.47, `moonshot rate ${moonRate} outside [0.33, 0.47]`);
  console.log('PASS: salvage rates bounded (safe~15%, moonshot~40%)');
}

// 5. Structural value bound: every free crate find resells below catalogue price.
// Mixers (e.g. the 150k SSL console) are excluded from the crate pool by the
// marketCategories filter in gearCatalogue, so the worst case stays in-class.
{
  const years = [1969, 1979, 1989, 1999, 2009, 2024];
  let globalMax = 0;
  let globalMeanSum = 0;
  let globalCount = 0;
  for (const year of years) {
    let yearMax = 0;
    let yearSum = 0;
    let yearCount = 0;
    for (let seed = 0; seed < 30; seed++) {
      const state = baseState({ saveSeed: seed, currentYear: year });
      const crate = {
        id: `crate:audit:${year}:${seed}`,
        era: 'modern',
        source: 's_grade_take',
        tier: 'standard',
        generatedDay: 2,
        generatedYear: year,
        generatedPriceMultiplier: 1,
      } as unknown as NonNullable<GameState['pendingCrates']>[number];
      const gear = generateCrateGear(state, crate);
      assert.ok(gear, `crate must materialize (year ${year}, seed ${seed})`);
      const resale = resaleValue(gear!);
      const cataloguePrice = getEraAdjustedPrice(
        gearCatalogue(year).find((t) => t.id === gear!.templateId)!,
        year,
        1,
      );
      assert.ok(resale >= 0, 'resale non-negative');
      assert.ok(resale < cataloguePrice, `resale ${resale} must stay below catalogue ${cataloguePrice} (${gear!.templateId})`);
      assert.ok(resale <= Math.floor(cataloguePrice * 0.7), `resale ${resale} exceeds 0.70 x catalogue ${cataloguePrice}`);
      yearMax = Math.max(yearMax, resale);
      yearSum += resale;
      yearCount++;
    }
    globalMax = Math.max(globalMax, yearMax);
    globalMeanSum += yearSum;
    globalCount += yearCount;
    console.log(`INFO: free salvage resale year=${year} max=${yearMax} mean=${Math.round(yearSum / yearCount)}`);
  }
  console.log(`INFO: free salvage resale global max=${globalMax} mean=${Math.round(globalMeanSum / globalCount)} (day-1 session fee anchor ~2341)`);
  console.log('PASS: free salvage resale structurally bounded (resale < catalogue, <=0.70x)');
}

// 6. Paid bargain cap: classifieds discount never exceeds $20 per listing; 3-5 listings/day.
{
  for (let seed = 0; seed < 50; seed++) {
    const listings = generateDailyClassifieds({ ...baseState({ saveSeed: seed }), currentDay: seed, currentYear: 2024 });
    assert.ok(listings.length >= 3 && listings.length <= 5, `listings ${listings.length} outside [3, 5]`);
    for (const listing of listings) {
      assert.ok(
        listing.askingPrice >= listing.estimatedValue - 20,
        `bargain discount exceeds $20 (ask ${listing.askingPrice}, est ${listing.estimatedValue})`,
      );
    }
  }
  console.log('PASS: paid classifieds capped (3-5 listings/day, discount <= $20/listing)');
}

console.log('used-gear-salvage-balance: all checks passed');
