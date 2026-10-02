/** Onboarding order is Character → Location → Era → Role, with era-aware currency per city. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { currencyFor, formatMoney } from '../src/rpg/cities';

const src = fs.readFileSync('src/components/CareerStartScreen.tsx', 'utf8');
assert.match(src, /STEP_KEYS = \['location', 'era', 'character', 'role'\]/, 'step order');
assert.match(src, /career_back_to_\$\{STEP_KEYS\[step - 1\]\}/, 'back button names the previous step');
assert.doesNotMatch(src, /Change era/, 'no hardcoded "Change era" back label');

// Era select uses game era ids; they must resolve to the city's era currency.
assert.equal(currencyFor('london', 'classic_rock').perDollar, 0.36);
assert.equal(currencyFor('berlin', 'golden_age').code, 'DEM');
assert.equal(currencyFor('berlin', 'modern').code, 'EUR');
assert.equal(formatMoney(1000, 'tokyo', 'classic_rock'), '¥360,000');
assert.equal(formatMoney(1000, undefined, 'classic_rock'), '$1,000');

for (const code of ['en', 'en-GB', 'pl', 'de']) {
  const d = JSON.parse(fs.readFileSync(`public/locales/${code}/common.json`, 'utf8'));
  for (const k of ['career_back_to_character', 'career_back_to_location', 'career_back_to_era', 'career_next_character', 'career_next_era', 'career_next_role']) assert.ok(d[k], `${code}.${k}`);
}
console.log('onboarding-steps: all checks passed');
