import { Equipment, EquipmentCategory } from './game';

/**
 * Hardware form factors that equipment can physically seat into.
 * Presentation state (pixel coordinates) is NOT part of this type —
 * placement is purely slot-based so it survives save/load deterministically.
 */
export type EquipmentSlotType =
  | 'rack_outboard'    // 19" rack units (compressors, equalizers, reverbs, effects)
  | 'console_500'      // 500-series modular chassis/lunchbox slots
  | 'mic_locker'       // Room microphone stands / snake input channels
  | 'instrument_stand' // Studio instruments (guitars, synths, acoustic kits)
  | 'workstation_desk'; // Audio interfaces, studio monitors, MIDI controllers

export interface EquipmentSlot {
  /** Unique stable slot ID, e.g. "studio-a:rack:1" */
  id: string;
  /** Physical studio room containing this slot, or "inventory" */
  roomId: string;
  /** Hardware form factor of the slot */
  slotType: EquipmentSlotType;
  /** Allowed categories for equipment seated in this slot */
  acceptedCategories: EquipmentCategory[];
  /** Optional ID of seated equipment */
  equipmentId?: string;
  /** Human-readable slot designation, e.g. "Outboard Unit 1" */
  label: string;
  /** 1-based index in the parent chassis */
  index: number;
}

export interface EquipmentPlacement {
  /** Reference to Equipment.id */
  equipmentId: string;
  /** Reference to EquipmentSlot.id */
  slotId: string;
}

/**
 * Standard 6-slot outboard rack configuration authored per room.
 */
export const OUTBOARD_RACK_SLOT_COUNT = 6;

/**
 * Sentinel slot id used for equipment that has been removed from every room
 * and returned to the player's inventory. Keeping it as an explicit placement
 * entry means save/load is deterministic: an item's location is always
 * derivable from `equipmentPlacements` alone, with no DOM coordinates.
 */
export const INVENTORY_SLOT_ID = 'inventory';

/**
 * Build the default placement list for a fresh game state: every owned
 * equipment item starts in inventory. Room slots are left empty until the
 * player drags gear into them (bead 8om).
 */
export function buildDefaultPlacements(ownedEquipment: { id: string }[]): EquipmentPlacement[] {
  return ownedEquipment.map((item) => ({ equipmentId: item.id, slotId: INVENTORY_SLOT_ID }));
}

/**
 * Default slot layout for a single studio room. Slot IDs are stable and
 * deterministic so placements survive save/load without DOM coordinates.
 */
export function generateDefaultRoomSlots(roomId: string): EquipmentSlot[] {
  const slots: EquipmentSlot[] = [];

  // 6-slot 19" outboard rack (accepts outboard, mixer, interface)
  for (let i = 1; i <= OUTBOARD_RACK_SLOT_COUNT; i++) {
    slots.push({
      id: `${roomId}:rack:${i}`,
      roomId,
      slotType: 'rack_outboard',
      acceptedCategories: ['outboard', 'mixer', 'interface'],
      label: `Chassis Slot #${i}`,
      index: i,
    });
  }

  // 2 microphone input slots
  for (let i = 1; i <= 2; i++) {
    slots.push({
      id: `${roomId}:mic:${i}`,
      roomId,
      slotType: 'mic_locker',
      acceptedCategories: ['microphone'],
      label: `Mic Input #${i}`,
      index: i,
    });
  }

  // 1 monitoring / interface slot
  slots.push({
    id: `${roomId}:desk:1`,
    roomId,
    slotType: 'workstation_desk',
    acceptedCategories: ['monitor', 'interface', 'software'],
    label: 'Desk Station',
    index: 1,
  });

  return slots;
}

/**
 * Validates if an equipment item can physically seat into a target slot.
 */
export function canSeatEquipment(equipment: Equipment, slot: EquipmentSlot): { allowed: boolean; reason?: string } {
  if (!slot.acceptedCategories.includes(equipment.category)) {
    return {
      allowed: false,
      reason: `Slot ${slot.label} only accepts [${slot.acceptedCategories.join(', ')}], but ${equipment.name} is a ${equipment.category}.`,
    };
  }

  return { allowed: true };
}

/**
 * Resolves effective room equipment from placements.
 * Invariant: Equipment is only active in a room if seated in that room's slots,
 * or unplaced items in legacy fallback mode.
 */
export function getRoomEffectiveEquipment(
  ownedEquipment: Equipment[],
  placements: EquipmentPlacement[] | undefined,
  roomId: string,
  allSlots: EquipmentSlot[]
): Equipment[] {
  if (!placements || placements.length === 0) {
    // If no placements exist yet (legacy saves), owned gear is globally available
    return ownedEquipment;
  }

  const roomSlotIds = new Set(allSlots.filter((s) => s.roomId === roomId).map((s) => s.id));
  const activeEquipmentIds = new Set(
    placements.filter((p) => roomSlotIds.has(p.slotId)).map((p) => p.equipmentId)
  );

  return ownedEquipment.filter((item) => activeEquipmentIds.has(item.id));
}

/**
 * Pure state reducer to move equipment to a slot, handling swaps and removals.
 */
export function placeEquipmentInSlot(
  currentPlacements: EquipmentPlacement[],
  equipmentId: string,
  targetSlotId: string | null // null means return to inventory
): EquipmentPlacement[] {
  // Filter out any existing placement for this equipment
  const withoutCurrent = currentPlacements.filter((p) => p.equipmentId !== equipmentId);

  if (!targetSlotId) {
    // Returned to inventory
    return withoutCurrent;
  }

  // Check if target slot is occupied
  const existingInTarget = withoutCurrent.find((p) => p.slotId === targetSlotId);
  const currentPlacement = currentPlacements.find((p) => p.equipmentId === equipmentId);

  if (existingInTarget) {
    // Swap: if source had a slot, move existing item to source slot. Otherwise, displace to inventory.
    const withoutTarget = withoutCurrent.filter((p) => p.equipmentId !== existingInTarget.equipmentId);
    const newPlacements = [...withoutTarget, { equipmentId, slotId: targetSlotId }];

    if (currentPlacement) {
      newPlacements.push({ equipmentId: existingInTarget.equipmentId, slotId: currentPlacement.slotId });
    }
    return newPlacements;
  }

  return [...withoutCurrent, { equipmentId, slotId: targetSlotId }];
}