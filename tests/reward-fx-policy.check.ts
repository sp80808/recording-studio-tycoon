/** #80 reward FX policy: rarity budgets, family accents, seeded FX, bounded loops, cleanup. */
import assert from 'node:assert';
import fs from 'node:fs';
import {
  GEAR_FAMILY_ACCENTS, RARITY_FX_POLICY, REWARD_FX_MAX_MS, clampFxDuration, createFxRandom, resolveGearFamily,
} from '@/features/boxDrops/fx/rewardFx';

let n = 0;
const ok = (c: boolean, m: string) => { assert(c, `FAIL: ${m}`); n += 1; console.log(`PASS: ${m}`); };

ok(!RARITY_FX_POLICY.common.sweep && !RARITY_FX_POLICY.common.burst, 'common has no effects');
ok(RARITY_FX_POLICY.uncommon.sweep && !RARITY_FX_POLICY.uncommon.burst, 'uncommon sweep only');
ok(RARITY_FX_POLICY.rare.sweep && !!RARITY_FX_POLICY.rare.burst && !RARITY_FX_POLICY.rare.familyFlourish, 'rare sweep + small burst');
ok(RARITY_FX_POLICY.vintage.familyFlourish && RARITY_FX_POLICY.legendary.familyFlourish, 'vintage/legendary get family flourish');
ok(Object.values(RARITY_FX_POLICY).every((p) => !p.burst || p.burst.durationMs <= REWARD_FX_MAX_MS), 'burst durations bounded');
ok(RARITY_FX_POLICY.rare.burst!.count < RARITY_FX_POLICY.legendary.burst!.count, 'budget grows with rarity');
ok(clampFxDuration(99999) === REWARD_FX_MAX_MS && clampFxDuration(-5) === 0, 'duration clamp');

const a = createFxRandom(7, 'foam'); const b = createFxRandom(7, 'foam'); const c = createFxRandom(8, 'foam');
const sa = [a(), a(), a()]; const sb = [b(), b(), b()];
ok(sa.every((v, i) => v === sb[i]) && c() !== sa[0], 'FX seed reproduces and varies');

ok(resolveGearFamily({ name: 'Studer A80 Tape Machine' }) === 'tape-reel', 'name hint tape');
ok(resolveGearFamily({ name: 'Mystery Box', family: 'synth' }) === 'synth', 'explicit family wins');
ok(resolveGearFamily({ name: 'Unknown', rarity: 'vintage' }) === 'tube', 'vintage fallback tube');
ok(Object.values(GEAR_FAMILY_ACCENTS).every((f) => f.cycles >= 1 && f.cycles <= 4), 'flourish cycles bounded');

const read = (p: string) => fs.readFileSync(p, 'utf8');
const fx = 'src/features/boxDrops/fx/';
ok(!read(fx + 'RarityMaterialSweep.tsx').includes('Infinity'), 'sweep is one-shot');
ok(!read(fx + 'AnimatedGearFlourish.tsx').includes('Infinity'), 'flourish settles');
const burst = read(fx + 'PixiParticleBurst.tsx');
ok(!burst.includes('Math.random') && burst.includes('createFxRandom'), 'burst is seeded');
ok(burst.includes('visibilitychange') && burst.includes('removeEventListener') && burst.includes('cancelAnimationFrame') && burst.includes('if (done) return'), 'burst cancels on hidden/unmount with single completion');
console.log(`${n} reward FX checks passed`);
