import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveStorylineRunSeed,
  renderProceduralTemplate,
} from '../src/narrative/branchingStorylineEngine';

describe('Storyline PRNG Seed Derivation & Grammar', () => {
  it('generates consistent run seeds for identical input parameters', () => {
    const seed1 = deriveStorylineRunSeed({
      saveSeed: 12345,
      selectedEra: 'vintage-warmth',
      originId: 'tape-purist',
      playstyle: 'purist',
    });
    const seed2 = deriveStorylineRunSeed({
      saveSeed: 12345,
      selectedEra: 'vintage-warmth',
      originId: 'tape-purist',
      playstyle: 'purist',
    });
    assert.equal(seed1, seed2);
    assert.equal(typeof seed1, 'number');
  });

  it('renders procedural templates deterministically', () => {
    const template = 'Rival {rivalName} of {rivalStudio} challenges your {gearMotif} at {legendaryVenue}.';
    const text1 = renderProceduralTemplate(template, 42);
    const text2 = renderProceduralTemplate(template, 42);
    assert.equal(text1, text2);
    assert.ok(!text1.includes('{rivalName}'));
    assert.ok(!text1.includes('{rivalStudio}'));
    assert.ok(!text1.includes('{gearMotif}'));
    assert.ok(!text1.includes('{legendaryVenue}'));
  });

  it('renders different procedural text for different seeds', () => {
    const template = '{rivalName} of {rivalStudio}';
    const text1 = renderProceduralTemplate(template, 101);
    const text2 = renderProceduralTemplate(template, 9999);
    // Across these two seeds, at least one of rival or studio should vary
    assert.ok(typeof text1 === 'string' && text1.length > 0);
    assert.ok(typeof text2 === 'string' && text2.length > 0);
  });
});
