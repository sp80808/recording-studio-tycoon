import assert from 'node:assert';
import { generateBoxLoot, pickLootForEra } from '../src/features/boxDrops/lootGenerator';

console.log('Testing Crate Unboxing & Loot Generator...');

const loot1970 = generateBoxLoot('1970s', 1, 42);
assert.strictEqual(loot1970.length, 1);
assert(loot1970[0].name.length > 0);
assert(loot1970[0].condition >= 50 && loot1970[0].condition <= 100);
assert(['common', 'uncommon', 'rare', 'vintage', 'legendary'].includes(loot1970[0].rarity));

// Test multiple count
const lootBatch = generateBoxLoot('1980s', 3, 100);
assert.strictEqual(lootBatch.length, 3);
lootBatch.forEach(item => {
  assert(item.baseValue > 0);
  assert(item.era === '1980s');
});

console.log('crate-unboxing: all checks passed');
