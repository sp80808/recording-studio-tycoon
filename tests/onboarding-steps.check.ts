/** Onboarding order is Character → Location → Era → Role, with era-aware currency per city. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { currencyFor, formatMoney } from '../src/rpg/cities';

const src = fs.readFileSync('src/components/CareerStartScreen.tsx', 'utf8');
// Outcome tests for the setup flow live in career-setup.check.tsx (#204).
assert.doesNotMatch(src, /Change era/, 'no hardcoded "Change era" back label');

// Era select uses game era ids; they must resolve to the city's era currency.
assert.equal(currencyFor('london', 'classic_rock').perDollar, 0.36);
assert.equal(currencyFor('berlin', 'golden_age').code, 'DEM');
assert.equal(currencyFor('berlin', 'modern').code, 'EUR');
assert.equal(formatMoney(1000, 'tokyo', 'classic_rock'), '¥360,000');
assert.equal(formatMoney(1000, undefined, 'classic_rock'), '$1,000');

console.log('onboarding-steps: all checks passed');
