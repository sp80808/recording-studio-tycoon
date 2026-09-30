import type { Equipment } from '@/types/game';

export type GearRarity = 'standard' | 'roadworn' | 'studio-classic' | 'rare-mod' | 'holy-grail';
export interface GearTrait {
  id: string;
  name: string;
  description: string;
  qualityBonus: number;
}
export interface GearQuirk {
  id: string;
  name: string;
  description: string;
  severity: 'minor';
  qualityPenalty: number;
}
export interface GearMaintenance {
  id: string;
  kind: 'service' | 'repair';
  mode: 'outsource' | 'hands-on';
  status: 'calibrating' | 'scheduled';
  startedDay: number;
  readyDay: number;
  conditionAfter: number;
  costPaid: number;
  clearsQuirks: boolean;
}
/** Additive metadata on Equipment; legacy ids and placements remain valid. */
export interface GearInstanceFields {
  instanceId?: string;
  templateId?: string;
  rarity?: GearRarity;
  traits?: GearTrait[];
  quirks?: GearQuirk[];
  restorationState?: 'barn-find' | 'serviced' | 'hot-rodded';
  origin?: 'classifieds' | 'project_drop' | 'retail' | 'box_drop';
  resaleValueMultiplier?: number;
  provenanceSeed?: number;
  vintageYearEstimate?: number;
  sellerLore?: string;
  inspected?: boolean;
  usageSessions?: number;
  maintenance?: GearMaintenance | null;
  fault?: { family: 'contact-noise'; startedDay: number; readyDay: number; milestone: number } | null;
  lastServiceDay?: number;
}
export interface EquipmentInstance extends Equipment {
  instanceId: string;
  templateId: string;
  rarity: GearRarity;
  traits: GearTrait[];
  quirks: GearQuirk[];
  restorationState: 'barn-find' | 'serviced' | 'hot-rodded';
  origin: 'classifieds' | 'project_drop' | 'retail' | 'box_drop';
  resaleValueMultiplier: number;
  provenanceSeed: number;
}
export interface DailyClassifiedListing {
  id: string;
  equipment: EquipmentInstance;
  askingPrice: number;
  estimatedValue: number;
  retailComparisonPrice: number;
  location: string;
  sellerNotes: string;
  purchased: boolean;
}
