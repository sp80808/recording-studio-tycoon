/**
 * Room customisation and producer cosmetics (#258, slice 1) - pure data + logic, no UI.
 *
 * Rules: cosmetics never carry gameplay power, there is no second currency, and unlocks remember WHY they exist
 * (provenance, shown to the player). Furnishings occupy authored anchors per premises tier; this is not a second room
 * model. Producer cosmetics are a derived overlay on the existing `ProducerAppearance`, never a replacement.
 * Unlocks derive from career milestones (#259 chronicle), so legacy saves backfill what they already earned.
 */
import type { GameState } from '@/types/game';
import type { ProducerAppearance, ProducerAccessory } from '@/features/sprites/producerAppearance';
import type { ClothesTop } from '@/features/sprites/spriteTypes';
import { deriveCareerMilestones } from '@/utils/careerChronicle';

export type FurnishingAnchorId =
  | 'wall-art' | 'rug' | 'lamp' | 'plant' | 'sofa' | 'shelf' | 'trophy-shelf'
  | 'poster' | 'desk-accessory' | 'console-ornament' | 'rack-side' | 'acoustic-panel';

/** Authored anchors per premises tier. Higher tiers expose more places to show things off. */
export const PREMISES_ANCHORS: Record<0 | 1 | 2 | 3, readonly FurnishingAnchorId[]> = {
  0: ['wall-art', 'rug', 'lamp', 'plant', 'desk-accessory'],
  1: ['wall-art', 'rug', 'lamp', 'plant', 'desk-accessory', 'sofa', 'shelf', 'trophy-shelf'],
  2: ['wall-art', 'rug', 'lamp', 'plant', 'desk-accessory', 'sofa', 'shelf', 'trophy-shelf', 'poster', 'console-ornament'],
  3: ['wall-art', 'rug', 'lamp', 'plant', 'desk-accessory', 'sofa', 'shelf', 'trophy-shelf', 'poster', 'console-ornament', 'rack-side', 'acoustic-panel'],
};

/** Free by default, or earned from a career milestone id (see deriveCareerMilestones). */
export type CosmeticUnlock = { kind: 'default' } | { kind: 'milestone'; milestoneId: string; hint: string };

export interface StudioFurnishingDefinition {
  id: string;
  name: string;
  compatibleAnchors: readonly FurnishingAnchorId[];
  unlock: CosmeticUnlock;
  tags?: readonly string[];
}

export const STUDIO_FURNISHINGS: readonly StudioFurnishingDefinition[] = [
  { id: 'brass-lamp', name: 'Brass desk lamp', compatibleAnchors: ['lamp'], unlock: { kind: 'default' } },
  { id: 'floor-fern', name: 'Floor fern', compatibleAnchors: ['plant'], unlock: { kind: 'default' } },
  { id: 'worn-rug', name: 'Worn kilim rug', compatibleAnchors: ['rug'], unlock: { kind: 'default' } },
  { id: 'corduroy-sofa', name: 'Corduroy sofa', compatibleAnchors: ['sofa'], unlock: { kind: 'default' } },
  { id: 'foam-panel-skin', name: 'Charcoal foam panels', compatibleAnchors: ['acoustic-panel'], unlock: { kind: 'default' } },
  { id: 'first-cheque-frame', name: 'Framed first cheque', compatibleAnchors: ['wall-art', 'shelf'], unlock: { kind: 'milestone', milestoneId: 'first-paid-session', hint: 'Get paid for a session' }, tags: ['money'] },
  { id: 'rebook-polaroid', name: 'Rebooking polaroid', compatibleAnchors: ['wall-art', 'poster', 'shelf'], unlock: { kind: 'milestone', milestoneId: 'first-repeat-client', hint: 'Have a client book again' }, tags: ['clients'] },
  { id: 'signed-tour-poster', name: 'Signed tour poster', compatibleAnchors: ['poster', 'wall-art'], unlock: { kind: 'milestone', milestoneId: 'first-loyal-client', hint: 'Earn a loyal client' }, tags: ['clients'] },
  { id: 'studio-plaque', name: 'Studio plaque', compatibleAnchors: ['wall-art', 'trophy-shelf'], unlock: { kind: 'milestone', milestoneId: 'first-premises-move', hint: 'Move into a new premises' }, tags: ['premises'] },
  { id: 'crew-mug', name: 'Crew mug', compatibleAnchors: ['desk-accessory', 'shelf'], unlock: { kind: 'milestone', milestoneId: 'first-staff-hire', hint: 'Hire your first crew member' }, tags: ['crew'] },
  { id: 'second-room-keys', name: 'Second room keys', compatibleAnchors: ['desk-accessory', 'console-ornament'], unlock: { kind: 'milestone', milestoneId: 'first-room-added', hint: 'Open a second room' }, tags: ['premises'] },
  { id: 'tape-reel-display', name: 'Tape reel wall display', compatibleAnchors: ['wall-art', 'rack-side'], unlock: { kind: 'milestone', milestoneId: 'first-story-choice', hint: 'Make a defining story choice' }, tags: ['story', 'analog'] },
  { id: 'gold-reference-disc', name: 'Gold reference disc', compatibleAnchors: ['trophy-shelf', 'shelf', 'console-ornament'], unlock: { kind: 'milestone', milestoneId: 'first-charting-release', hint: 'Chart a release' }, tags: ['chart'] },
  { id: 'bad-day-ticket', name: 'Torn session ticket', compatibleAnchors: ['desk-accessory', 'wall-art'], unlock: { kind: 'milestone', milestoneId: 'first-poor-session', hint: 'Survive a rough session' }, tags: ['humility'] },
];

export type ProducerCosmeticSlot = 'accessory' | 'shirt';

export interface ProducerCosmeticDefinition {
  id: string;
  name: string;
  slot: ProducerCosmeticSlot;
  /** Value written into the derived appearance for that slot. */
  accessory?: ProducerAccessory;
  shirt?: ClothesTop;
  unlock: CosmeticUnlock;
}

export const PRODUCER_COSMETICS: readonly ProducerCosmeticDefinition[] = [
  { id: 'session-cans', name: 'Session cans', slot: 'accessory', accessory: 'headphones', unlock: { kind: 'milestone', milestoneId: 'first-paid-session', hint: 'Get paid for a session' } },
  { id: 'regulars-flat-cap', name: "Regular's flat cap", slot: 'accessory', accessory: 'flat_cap', unlock: { kind: 'milestone', milestoneId: 'first-repeat-client', hint: 'Have a client book again' } },
  { id: 'loyalty-chain', name: 'Loyalty chain', slot: 'accessory', accessory: 'gold_chain', unlock: { kind: 'milestone', milestoneId: 'first-loyal-client', hint: 'Earn a loyal client' } },
  { id: 'movers-aviators', name: "Mover's aviators", slot: 'accessory', accessory: 'aviators', unlock: { kind: 'milestone', milestoneId: 'first-premises-move', hint: 'Move into a new premises' } },
  { id: 'tape-pendant', name: 'Tape pendant', slot: 'accessory', accessory: 'cassette_pendant', unlock: { kind: 'milestone', milestoneId: 'first-story-choice', hint: 'Make a defining story choice' } },
  { id: 'chart-leather', name: 'Chart-night leather jacket', slot: 'shirt', shirt: 'leather_jacket', unlock: { kind: 'milestone', milestoneId: 'first-charting-release', hint: 'Chart a release' } },
];

export interface StudioCustomizationState {
  /** anchor id -> furnishing id. */
  equippedByAnchor: Record<string, string>;
  /** Producer slot -> cosmetic id. */
  equippedProducer: Record<string, string>;
  /** Earned item ids (default items are always available and never listed). */
  unlockedItems: string[];
  /** Item id -> one-line reason it exists, captured at unlock time. */
  provenance: Record<string, string>;
}

const FURNISHING_BY_ID = new Map(STUDIO_FURNISHINGS.map((f) => [f.id, f]));
const COSMETIC_BY_ID = new Map(PRODUCER_COSMETICS.map((c) => [c.id, c]));
const allUnlockables = (): { id: string; unlock: CosmeticUnlock; label: string }[] => [
  ...STUDIO_FURNISHINGS.map((f) => ({ id: f.id, unlock: f.unlock, label: f.name })),
  ...PRODUCER_COSMETICS.map((c) => ({ id: c.id, unlock: c.unlock, label: c.name })),
];

export const createInitialCustomization = (): StudioCustomizationState => ({
  equippedByAnchor: {}, equippedProducer: {}, unlockedItems: [], provenance: {},
});

const strRecord = (v: unknown): Record<string, string> => {
  const out: Record<string, string> = {};
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) if (typeof val === 'string') out[k] = val;
  }
  return out;
};

export const isItemUnlocked = (c: StudioCustomizationState, id: string): boolean => {
  const def = FURNISHING_BY_ID.get(id) ?? COSMETIC_BY_ID.get(id);
  if (!def) return false;
  return def.unlock.kind === 'default' || c.unlockedItems.includes(id);
};

/** Legacy saves get the empty default; corrupt blobs and unknown ids are repaired. */
export const migrateCustomization = (raw: unknown): StudioCustomizationState => {
  if (!raw || typeof raw !== 'object') return createInitialCustomization();
  const r = raw as Partial<Record<keyof StudioCustomizationState, unknown>>;
  const known = new Set(allUnlockables().filter((u) => u.unlock.kind === 'milestone').map((u) => u.id));
  const unlockedItems = Array.isArray(r.unlockedItems)
    ? [...new Set(r.unlockedItems.filter((x): x is string => typeof x === 'string' && known.has(x)))] : [];
  const provenance = strRecord(r.provenance);
  for (const k of Object.keys(provenance)) if (!known.has(k)) delete provenance[k];
  const next: StudioCustomizationState = { equippedByAnchor: {}, equippedProducer: {}, unlockedItems, provenance };
  const placed = new Set<string>(); // one physical item sits in one anchor
  for (const [anchor, id] of Object.entries(strRecord(r.equippedByAnchor))) {
    const def = FURNISHING_BY_ID.get(id);
    if (def && !placed.has(id) && isItemUnlocked(next, id) && (def.compatibleAnchors as readonly string[]).includes(anchor)) { next.equippedByAnchor[anchor] = id; placed.add(id); }
  }
  for (const [slot, id] of Object.entries(strRecord(r.equippedProducer))) {
    const def = COSMETIC_BY_ID.get(id);
    if (def && def.slot === slot && isItemUnlocked(next, id)) next.equippedProducer[slot] = id;
  }
  return next;
};

export const getCustomization = (state: Pick<GameState, 'studioCustomization'>): StudioCustomizationState =>
  state.studioCustomization ?? createInitialCustomization();

/**
 * Grant every item whose milestone has been reached. Idempotent and additive: existing provenance is never rewritten,
 * and nothing is ever revoked (a milestone that later stops deriving keeps its reward).
 */
export const syncCustomizationUnlocks = (state: GameState): StudioCustomizationState => {
  const cur = getCustomization(state);
  const milestones = new Map(deriveCareerMilestones(state).map((m) => [m.id, m]));
  const unlockedItems = [...cur.unlockedItems];
  const provenance = { ...cur.provenance };
  for (const u of allUnlockables()) {
    if (u.unlock.kind !== 'milestone' || unlockedItems.includes(u.id)) continue;
    const m = milestones.get(u.unlock.milestoneId);
    if (!m) continue;
    unlockedItems.push(u.id);
    provenance[u.id] = `${m.title}: ${m.detail}`;
  }
  if (unlockedItems.length === cur.unlockedItems.length) return cur;
  return { ...cur, unlockedItems, provenance };
};

export interface LockedItemInfo { id: string; name: string; hint: string }

/** Locked items with a spoiler-free source hint ("Get paid for a session"), never the narrative outcome. */
export const listLockedItems = (c: StudioCustomizationState): LockedItemInfo[] =>
  allUnlockables().filter((u) => !isItemUnlocked(c, u.id)).map((u) => ({ id: u.id, name: u.label, hint: u.unlock.kind === 'milestone' ? u.unlock.hint : '' }));

export const getProvenance = (c: StudioCustomizationState, id: string): string | null => c.provenance[id] ?? null;

export const getAnchorsForTier = (tier: number | undefined): readonly FurnishingAnchorId[] =>
  PREMISES_ANCHORS[(tier === 1 || tier === 2 || tier === 3 ? tier : 0)];

/** Equip a furnishing on an anchor. Deterministic; returns the input unchanged when the request is invalid. */
export const equipFurnishing = (c: StudioCustomizationState, anchors: readonly string[], anchorId: string, itemId: string): StudioCustomizationState => {
  const def = FURNISHING_BY_ID.get(itemId);
  if (!def || !anchors.includes(anchorId) || !(def.compatibleAnchors as readonly string[]).includes(anchorId) || !isItemUnlocked(c, itemId)) return c;
  const equippedByAnchor = { ...c.equippedByAnchor };
  // One physical item sits in one place.
  for (const [a, id] of Object.entries(equippedByAnchor)) if (id === itemId) delete equippedByAnchor[a];
  equippedByAnchor[anchorId] = itemId;
  return { ...c, equippedByAnchor };
};

export const unequipAnchor = (c: StudioCustomizationState, anchorId: string): StudioCustomizationState => {
  if (!(anchorId in c.equippedByAnchor)) return c;
  const equippedByAnchor = { ...c.equippedByAnchor };
  delete equippedByAnchor[anchorId];
  return { ...c, equippedByAnchor };
};

/**
 * Premises change: unlocked items are always preserved. An equipped item whose anchor no longer exists moves to the
 * first free compatible anchor (anchor order), otherwise returns to storage. Items on surviving anchors stay put.
 */
export const remapForAnchors = (c: StudioCustomizationState, anchors: readonly string[]): StudioCustomizationState => {
  const next: Record<string, string> = {};
  const displaced: string[] = [];
  for (const [a, id] of Object.entries(c.equippedByAnchor)) {
    if (anchors.includes(a)) next[a] = id;
    else displaced.push(id);
  }
  for (const id of displaced) {
    const def = FURNISHING_BY_ID.get(id);
    const slot = def && anchors.find((a) => !next[a] && (def.compatibleAnchors as readonly string[]).includes(a));
    if (slot) next[slot] = id;
  }
  const same = Object.keys(next).length === Object.keys(c.equippedByAnchor).length && Object.entries(next).every(([a, id]) => c.equippedByAnchor[a] === id);
  return same ? c : { ...c, equippedByAnchor: next };
};

export const equipProducerCosmetic = (c: StudioCustomizationState, itemId: string): StudioCustomizationState => {
  const def = COSMETIC_BY_ID.get(itemId);
  if (!def || !isItemUnlocked(c, itemId)) return c;
  return { ...c, equippedProducer: { ...c.equippedProducer, [def.slot]: itemId } };
};

export const unequipProducerSlot = (c: StudioCustomizationState, slot: ProducerCosmeticSlot): StudioCustomizationState => {
  if (!(slot in c.equippedProducer)) return c;
  const equippedProducer = { ...c.equippedProducer };
  delete equippedProducer[slot];
  return { ...c, equippedProducer };
};

/** Derived look: equipped cosmetics overlay the saved appearance, which is never mutated. Purely visual. */
export const applyProducerCosmetics = (appearance: ProducerAppearance, c: StudioCustomizationState): ProducerAppearance => {
  let out = appearance;
  for (const id of Object.values(c.equippedProducer)) {
    const def = COSMETIC_BY_ID.get(id);
    if (!def || !isItemUnlocked(c, id)) continue;
    out = { ...out, ...(def.accessory ? { accessory: def.accessory } : {}), ...(def.shirt ? { shirt: def.shirt } : {}) };
  }
  return out;
};

/** What a completed run hands to the next career: cosmetic ids and their stories only. No cash, reputation or stats. */
export interface MetaUnlockLedger { version: 1; items: { id: string; reason: string }[] }

export const exportMetaLedger = (c: StudioCustomizationState): MetaUnlockLedger => ({
  version: 1,
  items: c.unlockedItems.map((id) => ({ id, reason: c.provenance[id] ?? '' })),
});

const CARRIED_PREFIX = 'Carried over: ';

/** Seed a fresh career's customisation from a ledger. Nothing is equipped automatically. */
export const applyMetaLedger = (ledger: unknown): StudioCustomizationState => {
  const items = ledger && typeof ledger === 'object' && Array.isArray((ledger as MetaUnlockLedger).items) ? (ledger as MetaUnlockLedger).items : [];
  const valid = items.filter((i) => i && typeof i.id === 'string' && typeof i.reason === 'string');
  return migrateCustomization({
    unlockedItems: valid.map((i) => i.id),
    provenance: Object.fromEntries(valid.map((i) => [i.id, i.reason.startsWith(CARRIED_PREFIX) ? i.reason : `${CARRIED_PREFIX}${i.reason}`])),
  });
};
