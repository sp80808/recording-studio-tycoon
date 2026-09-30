import { StudioRoomType, ClientRelationshipTier, EquipmentCategory } from './game';

export type SynergyCategory = 'room_gear' | 'staff_client' | 'genre_setup';

export interface SynergyCriteria {
  /** Room types that satisfy this synergy (at least one must match). If omitted, any room qualifies. */
  roomTypes?: StudioRoomType[];
  /** Equipment categories required in studio inventory (all specified categories must be present). */
  requiredEquipmentCategories?: EquipmentCategory[];
  /** When the project has a signal chain, these slots must be filled by the chosen gear (#86). Without a chain, the category check applies. */
  chainSlots?: ('microphone' | 'preamp' | 'dynamics' | 'recorderInterface')[];
  /** Specific equipment IDs required in studio inventory. */
  requiredEquipmentIds?: string[];
  /** Staff roles where at least one of the assigned staff must have one of these roles. */
  anyStaffRoles?: ('Engineer' | 'Producer' | 'Songwriter')[];
  /** Staff roles where ALL specified roles must be actively assigned (e.g. Producer AND Engineer). */
  requiredStaffRoles?: ('Engineer' | 'Producer' | 'Songwriter')[];
  /** Minimum number of assigned staff members. */
  minStaffCount?: number;
  /** Genre(s) of the project (at least one must match). */
  genres?: string[];
  /** Minimum client relationship tier required. */
  clientRelationshipTiers?: ClientRelationshipTier[];
  /** Minimum staff creativity stat on at least one assigned staff. */
  minStaffCreativity?: number;
  /** Minimum staff technical stat on at least one assigned staff. */
  minStaffTechnical?: number;
}

export interface SynergyBonuses {
  /** Multiplier for Creativity points generated during work sessions (e.g. 1.15 = +15%). */
  creativityMultiplier: number;
  /** Multiplier for Technical points generated during work sessions (e.g. 1.15 = +15%). */
  technicalMultiplier: number;
  /** Multiplier for Work Units speed (e.g. 1.10 = +10% faster stage progress). */
  workUnitSpeedMultiplier: number;
  /** Additive bonus to final Project Review quality score (e.g. +4 points). */
  reviewQualityBonus: number;
  /** Multiplier for Staff XP earned from the session (e.g. 1.25 = +25% XP). */
  staffXpMultiplier: number;
}

export interface StudioSynergy {
  id: string;
  name: string;
  category: SynergyCategory;
  tagline: string;
  description: string;
  /** Cryptic hint displayed in the Synergy Encyclopedia before discovery. */
  hint: string;
  icon: string;
  criteria: SynergyCriteria;
  bonuses: Partial<SynergyBonuses>;
}
