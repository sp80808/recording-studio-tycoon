import assert from 'node:assert/strict';
import { availableEquipment, getAvailableEquipmentForYear } from '../src/data/eraEquipment';
import { missingArtFor } from '../src/data/equipmentArt';
import { ERA_TRAITS } from '../src/data/staffRecruitmentContent';
import { generateCandidates } from '../src/utils/staffRecruitment';

const additions = [
  ['rhodes_stage_piano', 1970],
  ['dbx_160_compressor', 1976],
  ['dx7_synth', 1983],
  ['adat_8track', 1992],
  ['small_diaphragm_pair', 2004],
] as const;

assert.deepEqual(missingArtFor(additions.map(([id]) => id)), [], 'new gear uses the shelf/shop art authority');
for (const [id, year] of additions) {
  const item = availableEquipment.find((candidate) => candidate.id === id);
  assert.ok(item, `${id} is in the live equipment catalogue`);
  assert.ok(getAvailableEquipmentForYear(year).some((candidate) => candidate.id === id), `${id} is purchasable in ${year}`);
  assert.ok(!getAvailableEquipmentForYear(year - 1).some((candidate) => candidate.id === id), `${id} stays era-gated`);
  assert.ok(item.price > 0 && item.condition === 100, `${id} has valid retail defaults`);
}

const expandedTraits = new Set([
  'gain-riding reflexes', 'echo-chamber patience', 'razor-edit confidence', 'headroom generous',
  'automation fearless', 'drum-machine pocket', 'ADAT clock wrangler', 'breakbeat archivist',
  'vocal-stack precise', 'recall-sheet disciplined', 'immersive-mix curious', 'version-control calm',
]);
assert.equal(Object.values(ERA_TRAITS).every((pool) => pool.length === 7), true, 'each era gains two trait choices');

const seen = new Set<string>();
for (const year of [1965, 1975, 1985, 1995, 2005, 2020]) {
  for (let batch = 0; batch < 24; batch += 1) {
    for (const candidate of generateCandidates({ count: 4, saveSeed: 73, day: 5, year, batchKey: `trait-proof-${batch}` })) {
      candidate.cv?.traits.forEach((trait) => seen.add(trait));
    }
  }
}
assert.deepEqual([...expandedTraits].filter((trait) => !seen.has(trait)), [], 'new traits reach generated recruitment CVs');

console.log('catalog-traits-expansion.check passed');
