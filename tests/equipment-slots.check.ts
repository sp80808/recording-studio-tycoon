import assert from 'node:assert/strict';
import type { Equipment, EquipmentCategory } from '@/types/game';
import {
  INVENTORY_SLOT_ID,
  OUTBOARD_RACK_SLOT_COUNT,
  buildDefaultPlacements,
  canSeatEquipment,
  generateDefaultRoomSlots,
  getEquipmentInSlot,
  getInventoryEquipment,
  getRoomEffectiveEquipment,
  placeEquipmentInSlot,
} from '@/types/equipmentSlots';
import { getRoomEquipment, resolveSessionEquipment, getEquipmentBonuses } from '@/utils/gameUtils';
import type { GameState } from '@/types/game';

const makeEquip = (
  id: string,
  category: EquipmentCategory,
  name = id
): Equipment =>
  ({
    id,
    name,
    category,
    price: 100,
    description: 'test',
    bonuses: {},
    icon: '🎛',
    condition: 100,
  }) as Equipment;

function it(label: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${label}`);
  } catch (err) {
    console.error(`  ✗ ${label}`);
    throw err;
  }
}

console.log('=== equipment slots / gear racks (8om) ===');

it('seeds owned gear into inventory placements', () => {
  const owned = [makeEquip('comp-1', 'outboard'), makeEquip('mic-1', 'microphone')];
  const placements = buildDefaultPlacements(owned);
  assert.equal(placements.length, 2);
  assert.ok(placements.every((p) => p.slotId === INVENTORY_SLOT_ID));
});

it('generates stable room chassis slots', () => {
  const slots = generateDefaultRoomSlots('studio-a');
  assert.equal(slots.filter((s) => s.slotType === 'rack_outboard').length, OUTBOARD_RACK_SLOT_COUNT);
  assert.equal(slots[0].id, 'studio-a:rack:1');
  assert.ok(slots.some((s) => s.id === 'studio-a:mic:1'));
  assert.ok(slots.some((s) => s.id === 'studio-a:desk:1'));
});

it('rejects incompatible categories and accepts matching ones', () => {
  const slots = generateDefaultRoomSlots('studio-a');
  const rack = slots.find((s) => s.slotType === 'rack_outboard')!;
  const mic = slots.find((s) => s.slotType === 'mic_locker')!;
  const compressor = makeEquip('la2a', 'outboard', 'LA-2A');
  const condenser = makeEquip('u87', 'microphone', 'U87');

  assert.equal(canSeatEquipment(compressor, rack).allowed, true);
  assert.equal(canSeatEquipment(condenser, rack).allowed, false);
  assert.equal(canSeatEquipment(condenser, mic).allowed, true);
  assert.equal(canSeatEquipment(compressor, mic).allowed, false);
});

it('places, swaps, and returns gear to inventory deterministically', () => {
  const a = makeEquip('eq-1', 'outboard');
  const b = makeEquip('comp-1', 'outboard');
  let placements = buildDefaultPlacements([a, b]);

  placements = placeEquipmentInSlot(placements, a.id, 'studio-a:rack:1');
  assert.equal(placements.find((p) => p.equipmentId === a.id)?.slotId, 'studio-a:rack:1');
  assert.equal(placements.find((p) => p.equipmentId === b.id)?.slotId, INVENTORY_SLOT_ID);

  placements = placeEquipmentInSlot(placements, b.id, 'studio-a:rack:1');
  assert.equal(placements.find((p) => p.equipmentId === b.id)?.slotId, 'studio-a:rack:1');
  assert.equal(placements.find((p) => p.equipmentId === a.id)?.slotId, INVENTORY_SLOT_ID);

  placements = placeEquipmentInSlot(placements, b.id, null);
  assert.equal(placements.find((p) => p.equipmentId === b.id)?.slotId, INVENTORY_SLOT_ID);
  assert.ok(placements.every((p) => p.slotId === INVENTORY_SLOT_ID));
});

it('resolves inventory tray and seated lookups', () => {
  const owned = [
    makeEquip('eq-1', 'outboard'),
    makeEquip('mic-1', 'microphone'),
    makeEquip('iface-1', 'interface'),
  ];
  const placements = [
    { equipmentId: 'eq-1', slotId: 'studio-a:rack:2' },
    { equipmentId: 'mic-1', slotId: INVENTORY_SLOT_ID },
    // iface-1 intentionally omitted → treated as inventory orphan
  ];

  const inventory = getInventoryEquipment(owned, placements);
  assert.deepEqual(
    inventory.map((e) => e.id).sort(),
    ['iface-1', 'mic-1']
  );
  assert.equal(getEquipmentInSlot(owned, placements, 'studio-a:rack:2')?.id, 'eq-1');
  assert.equal(getEquipmentInSlot(owned, placements, 'studio-a:rack:1'), undefined);
});

it('limits room-effective gear to seated placements', () => {
  const owned = [
    makeEquip('eq-1', 'outboard'),
    makeEquip('mic-1', 'microphone'),
    makeEquip('comp-2', 'outboard'),
  ];
  const slots = generateDefaultRoomSlots('studio-a');
  const placements = [
    { equipmentId: 'eq-1', slotId: 'studio-a:rack:1' },
    { equipmentId: 'mic-1', slotId: 'studio-a:mic:1' },
    { equipmentId: 'comp-2', slotId: INVENTORY_SLOT_ID },
  ];

  const effective = getRoomEffectiveEquipment(owned, placements, 'studio-a', slots);
  assert.deepEqual(effective.map((e) => e.id).sort(), ['eq-1', 'mic-1']);

  const viaHelper = getRoomEquipment(
    { ownedEquipment: owned, equipmentPlacements: placements } as GameState,
    'studio-a',
    slots
  );
  assert.deepEqual(viaHelper.map((e) => e.id).sort(), ['eq-1', 'mic-1']);

  // Legacy fallback: no placements ⇒ all owned gear available
  const legacy = getRoomEffectiveEquipment(owned, undefined, 'studio-a', slots);
  assert.equal(legacy.length, 3);
});

it('soft-cutover: inventory-only / legacy keep full owned gear for session bonuses', () => {
  const hot = makeEquip('hot-comp', 'outboard', 'Hot Comp');
  hot.bonuses = { qualityBonus: 20, genreBonus: { rock: 8 } };
  const cold = makeEquip('cold-mic', 'microphone', 'Cold Mic');
  cold.bonuses = { qualityBonus: 4 };
  const owned = [hot, cold];

  const legacyState = { ownedEquipment: owned } as GameState;
  assert.deepEqual(
    resolveSessionEquipment(legacyState, 'studio-a').map((e) => e.id).sort(),
    ['cold-mic', 'hot-comp']
  );
  assert.equal(getEquipmentBonuses(resolveSessionEquipment(legacyState, 'studio-a'), 'rock').quality, 24);

  const inventoryOnly = {
    ownedEquipment: owned,
    equipmentPlacements: buildDefaultPlacements(owned),
  } as GameState;
  const soft = resolveSessionEquipment(inventoryOnly, 'studio-a');
  assert.equal(soft.length, 2);
  assert.equal(getEquipmentBonuses(soft, 'rock').quality, 24);
  assert.equal(getEquipmentBonuses(soft, 'rock').genre, 8);
});

it('engaged seating: only gear seated in the booked room drives session bonuses', () => {
  const hot = makeEquip('hot-comp', 'outboard', 'Hot Comp');
  hot.bonuses = { qualityBonus: 20, genreBonus: { rock: 8 } };
  const spare = makeEquip('spare-eq', 'outboard', 'Spare EQ');
  spare.bonuses = { qualityBonus: 50 };
  const otherRoom = makeEquip('other-iface', 'interface', 'Other IF');
  otherRoom.bonuses = { qualityBonus: 30 };
  const owned = [hot, spare, otherRoom];

  const engaged = {
    ownedEquipment: owned,
    equipmentPlacements: [
      { equipmentId: 'hot-comp', slotId: 'studio-a:rack:1' },
      { equipmentId: 'spare-eq', slotId: INVENTORY_SLOT_ID },
      { equipmentId: 'other-iface', slotId: 'vocal-suite:desk:1' },
    ],
  } as GameState;

  const studioA = resolveSessionEquipment(engaged, 'studio-a');
  assert.deepEqual(studioA.map((e) => e.id), ['hot-comp']);
  const studioABonuses = getEquipmentBonuses(studioA, 'rock');
  assert.equal(studioABonuses.quality, 20);
  assert.equal(studioABonuses.genre, 8);

  // Different room only sees its own seated gear — spare inventory does not leak in
  const vocal = resolveSessionEquipment(engaged, 'vocal-suite');
  assert.deepEqual(vocal.map((e) => e.id), ['other-iface']);
  assert.equal(getEquipmentBonuses(vocal, 'rock').quality, 30);

  // Empty booked room while seating is engaged elsewhere ⇒ zero session gear (intentional)
  const emptyLive = resolveSessionEquipment(engaged, 'live-room');
  assert.equal(emptyLive.length, 0);
  assert.equal(getEquipmentBonuses(emptyLive, 'rock').quality, 0);
});

console.log('PASS: equipment slot placements, seating rules, and room resolution');
