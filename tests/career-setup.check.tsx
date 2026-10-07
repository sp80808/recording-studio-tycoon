/**
 * Compact career setup (#204): outcome/invariant tests, not wizard-shape tests.
 * Two surfaces, every choice editable before Open Studio, quick start always valid, accessible radiogroups.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { AVAILABLE_ERAS } from '../src/data/eras';
import { CITIES, currencyFor, formatMoney } from '../src/rpg/cities';
import { PRODUCER_ORIGINS } from '../src/narrative/characterOrigins';
import { createSeededRandom } from '../src/simulation/seededRandom';
import { SETUP_SURFACES, defaultCareerSetup, isSetupValid, isSurfaceReady, openingBrief, quickStartSetup } from '../src/rpg/careerSetup';

// At most two primary surfaces.
assert.ok(SETUP_SURFACES.length <= 2, 'setup uses no more than two surfaces');

// Defaults are valid, so the player can open the studio with zero choices.
const d = defaultCareerSetup();
assert.ok(isSetupValid(d), 'default setup is valid');
assert.ok(isSurfaceReady('place', d) && isSurfaceReady('person', d));
assert.ok(!isSurfaceReady('person', { ...d, name: '   ' }), 'blank name blocks the person surface');
assert.ok(!isSetupValid({ ...d, eraId: 'nope' }), 'unknown era invalid');

// Quick start: every seed yields a valid setup, deterministic per seed, and it explores the space.
const seen = { city: new Set<string>(), era: new Set<string>(), origin: new Set<string>() };
for (let seed = 1; seed <= 200; seed++) {
  const q = quickStartSetup(createSeededRandom(seed));
  assert.ok(isSetupValid(q), `quick start seed ${seed} valid`);
  assert.ok(q.name.length <= 24);
  assert.deepEqual(q, quickStartSetup(createSeededRandom(seed)), 'same seed, same studio');
  seen.city.add(q.cityId);
  seen.era.add(q.eraId);
  seen.origin.add(q.originId);
}
assert.equal(seen.city.size, CITIES.length, 'quick start reaches every city');
assert.equal(seen.era.size, AVAILABLE_ERAS.length, 'quick start reaches every era');
assert.equal(seen.origin.size, PRODUCER_ORIGINS.length, 'quick start reaches every origin');

// City + era compare live: every combination yields a brief with the right currency/cash/headline.
for (const c of CITIES) {
  for (const e of AVAILABLE_ERAS) {
    const b = openingBrief(c.id, e.id);
    assert.ok(b, `${c.id}/${e.id} brief`);
    assert.equal(b.startingCash, formatMoney(e.startingMoney, c.id, e.id));
    assert.equal(b.currencyCode, currencyFor(c.id, e.id).code);
    assert.equal(b.accent, c.accent);
    assert.ok(b.headline.includes(String(e.startYear)) && b.headline.includes(c.name.toUpperCase()));
    assert.ok(b.challenge.length > 0, 'era challenge sentence');
  }
}
assert.equal(openingBrief('london', 'golden_age')?.headline, 'LONDON · 1980s');
assert.equal(openingBrief('los-angeles', 'modern')?.headline, 'LOS ANGELES · 2020s', 'modern era reads 2020s, never 2024s (#326)');
assert.equal(openingBrief('nowhere', 'modern'), null);

// Source guards: no numbered stepper / Next-Back wizard copy; accessibility semantics retained.
const src = fs.readFileSync('src/components/CareerStartScreen.tsx', 'utf8');
assert.doesNotMatch(src, /STEP_KEYS|Career setup progress|aria-current="step"/, 'numbered stepper is gone');
assert.equal((src.match(/role="radiogroup"/g) ?? []).length, 3, 'city, era and origin are radiogroups');
assert.match(src, /aria-checked=\{selected\}/);
assert.match(src, /ArrowRight/, 'arrow-key navigation');
assert.match(src, /data-testid="quick-start"/, 'visible quick start route');
assert.match(src, /Selected<\/span>/, 'selected state is also text, not colour only');
assert.match(src, /pb-28/, 'content clears the sticky CTA footer');
const splash = fs.readFileSync('src/components/SplashScreen.tsx', 'utf8');
assert.match(splash, /openingBrief\(/, 'move-in transition uses the chosen city/era identity');

console.log('career-setup: all checks passed');
