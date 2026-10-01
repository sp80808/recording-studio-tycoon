import assert from 'node:assert/strict';
import { generateCandidates, resolveMemberPortrait } from '../src/utils/staffRecruitment';
import {
  applyCreatorPieceIds,
  eraIdToNpcEra,
  pieceIdsFromAppearance,
  resolveStaffPortrait,
  staffPortraitSeed,
} from '../src/features/sprites/staffPortrait';
import { createNewGameState } from '../src/utils/newGameState';

const ctx = {
  count: 4,
  saveSeed: 4242,
  day: 12,
  era: 'classic_rock',
  year: 1968,
  batchKey: 'test-batch',
};

const a = generateCandidates(ctx);
const b = generateCandidates(ctx);
assert.equal(a.length, 4);
assert.deepEqual(
  a.map(c => ({ id: c.id, name: c.name, role: c.role, salary: c.salary, seed: c.portraitSeed, traits: c.cv?.traits })),
  b.map(c => ({ id: c.id, name: c.name, role: c.role, salary: c.salary, seed: c.portraitSeed, traits: c.cv?.traits })),
  'same seed/day/era/batch must reproduce candidates',
);

const other = generateCandidates({ ...ctx, batchKey: 'other-batch' });
assert.notDeepEqual(
  a.map(c => c.id),
  other.map(c => c.id),
  'different batch keys must diverge',
);

for (const candidate of a) {
  assert.ok(candidate.cv, `${candidate.name} needs a CV`);
  assert.ok(candidate.cv!.traits.length >= 2, 'CV traits');
  assert.ok(candidate.appearance, 'appearance identity');
  assert.ok(candidate.pieceIds?.hair?.startsWith('hair_'), 'piece ids from creator atlas stems');
  const portrait = resolveMemberPortrait(candidate);
  assert.equal(portrait.name, candidate.name);
  assert.equal(portrait.seed, candidate.portraitSeed);
  assert.equal(eraIdToNpcEra('classic_rock'), '1960s');
  assert.equal(portrait.era, '1960s');
}

const modern = generateCandidates({ ...ctx, era: 'modern', year: 2024, batchKey: 'modern' });
assert.notEqual(modern[0].name, a[0].name, 'era pools should shift names');
assert.equal(resolveMemberPortrait(modern[0]).era, 'modern');

const seed = staffPortraitSeed(7, 1, 'x', 0);
const base = resolveStaffPortrait({ seed, role: 'engineer', era: '1980s', name: 'Test Tech' });
const pieces = pieceIdsFromAppearance(base);
const overridden = applyCreatorPieceIds(base, { ...pieces, hair: 'hair_afro', face: 'face_stern' });
assert.equal(overridden.hair.shape, 'afro');
assert.equal(overridden.body.face, 'stern');

const started = createNewGameState({ selectedEra: 'golden_age', saveSeed: 99, currentYear: 1984 });
assert.equal(started.availableCandidates.length, 3);
assert.ok(started.availableCandidates.every(c => c.cv && c.appearance && c.pieceIds));
const again = createNewGameState({ selectedEra: 'golden_age', saveSeed: 99, currentYear: 1984 });
assert.deepEqual(
  started.availableCandidates.map(c => c.name),
  again.availableCandidates.map(c => c.name),
  'career start candidates must be saveSeed-stable',
);

console.log('crew-recruitment-portal.check passed');
