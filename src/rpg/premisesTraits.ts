/**
 * Per-archetype property modifiers (#250). A chosen property stays inside its
 * internal capability band (`premisesTier`), so the tier presets keep driving
 * rooms, recruiting and unlocks. The archetype only bends the numbers that make
 * the property a different decision: deposit, rent and how many crew fit.
 * Pure data, no imports from the premises modules so both can use it.
 */
export type PremisesArchetype = 'project-room' | 'warehouse' | 'basement' | 'commercial' | 'existing-studio';

export interface ArchetypeModifiers {
  /** Tiers (capability bands) this archetype can occupy. */
  tiers: ReadonlyArray<1 | 2 | 3>;
  /** Multiplies the band's deposit. */
  depositMult: number;
  /** Multiplies the band's daily rent. */
  rentMult: number;
  /** Added to the band's physical staff cap. */
  staffCapDelta: number;
  /** One-line summary of the cost shape, shown on the property card. */
  terms: string;
}

export const ARCHETYPE_MODIFIERS: Record<PremisesArchetype, ArchetypeModifiers> = {
  'project-room': { tiers: [1], depositMult: 1.1, rentMult: 1, staffCapDelta: 0, terms: 'Fit-out adds to the deposit; rent is standard.' },
  basement: { tiers: [1], depositMult: 0.7, rentMult: 0.8, staffCapDelta: 1, terms: 'Cheap deposit and rent, a little more floor for the crew.' },
  commercial: { tiers: [2, 3], depositMult: 1, rentMult: 1.3, staffCapDelta: -1, terms: 'Premium address: rent runs 30% high and the footprint is tight.' },
  warehouse: { tiers: [2], depositMult: 0.8, rentMult: 0.7, staffCapDelta: 2, terms: 'Low rent and loads of floor, but you pay in comfort.' },
  'existing-studio': { tiers: [3], depositMult: 1.2, rentMult: 1, staffCapDelta: 0, terms: 'Pay a premium for what is already built.' },
};

export const isPremisesArchetype = (v: unknown): v is PremisesArchetype =>
  typeof v === 'string' && Object.prototype.hasOwnProperty.call(ARCHETYPE_MODIFIERS, v);

/** The modifiers that apply to this tier, or null when the archetype does not fit it (or is absent/corrupt). */
export const getArchetypeModifiers = (archetype: unknown, tier: number): ArchetypeModifiers | null => {
  if (!isPremisesArchetype(archetype)) return null;
  const m = ARCHETYPE_MODIFIERS[archetype];
  return (m.tiers as readonly number[]).includes(tier) ? m : null;
};
