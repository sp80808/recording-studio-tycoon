/** Deterministic local album art — seeded palettes, stable hashes, safe no-DOM fallback. */
import assert from 'node:assert/strict';
import {
  hashSeed,
  seededRandom,
  paletteForGenre,
  albumArtCacheKey,
  renderAlbumArtSync,
  clearAlbumArtCache,
} from '../src/utils/albumArt';

console.log('Testing deterministic album art...');

// Hash stability: same project always seeds the same art.
assert.equal(hashSeed('Neon Skyline::Synthwave::Nova'), hashSeed('Neon Skyline::Synthwave::Nova'));
assert.notEqual(hashSeed('Neon Skyline::Synthwave::Nova'), hashSeed('Neon Skyline::Rock::Nova'));
assert.notEqual(hashSeed('Title A::Pop::X'), hashSeed('Title B::Pop::X'), 'title shifts the seed');

// Seeded RNG determinism.
const run = (seed: number): number[] => {
  const rng = seededRandom(seed);
  return [rng(), rng(), rng()];
};
assert.deepEqual(run(12345), run(12345));
assert.notDeepEqual(run(12345), run(54321));

// Genre palettes resolve to distinct patterns.
assert.equal(paletteForGenre('Rock').pattern, 'flame');
assert.equal(paletteForGenre('Techno').pattern, 'grid');
assert.equal(paletteForGenre('Hip-Hop').pattern, 'bars');
assert.equal(paletteForGenre('Jazz').pattern, 'rings');
assert.equal(paletteForGenre('Folk').pattern, 'waves');
assert.equal(paletteForGenre('Pop').pattern, 'radial');
assert.equal(paletteForGenre(undefined).pattern, 'radial', 'missing genre falls back');
assert.equal(paletteForGenre('Some Unknown Microgenre').pattern, 'radial', 'unknown genre falls back');

// Cache keys distinguish projects.
assert.notEqual(
  albumArtCacheKey({ title: 'A', genre: 'Rock' }),
  albumArtCacheKey({ title: 'B', genre: 'Rock' }),
);
assert.equal(
  albumArtCacheKey({ title: 'A', genre: 'Rock' }),
  albumArtCacheKey({ title: 'A', genre: 'Rock' }),
);

// No-DOM environment (node check runner): must return null, never throw.
clearAlbumArtCache();
assert.equal(
  renderAlbumArtSync({ title: 'No Canvas Here', genre: 'Rock', score: 95 }),
  null,
  'no canvas in node → null so callers use CSS fallback',
);
assert.equal(
  renderAlbumArtSync({ title: 'Low Score', genre: 'Pop', score: 40 }),
  null,
);

// Save seeding (bead u92): identical projects diverge per save.
assert.notEqual(
  albumArtCacheKey({ title: 'A', genre: 'Rock', saveSeed: 'save-1' }),
  albumArtCacheKey({ title: 'A', genre: 'Rock', saveSeed: 'save-2' }),
);
assert.equal(
  albumArtCacheKey({ title: 'A', genre: 'Rock', saveSeed: 'save-1' }),
  albumArtCacheKey({ title: 'A', genre: 'Rock', saveSeed: 'save-1' }),
);
assert.notEqual(hashSeed('A::Rock::::save-1'), hashSeed('A::Rock::::save-2'));
assert.equal(
  renderAlbumArtSync({ title: 'Seeded', genre: 'Rock', saveSeed: 'save-1' }),
  null,
  'seeded render stays null-safe without DOM',
);

console.log('album-art-local.check.ts: ok');
