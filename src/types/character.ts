import type { NpcVisualIdentity } from '@/features/sprites/npcAppearance';
import { PlayerAttributes, PlayerData } from './game';

export type ProducerBackgroundId =
  | 'bedroom-beatmaker'
  | 'tape-purist'
  | 'hit-factory-mercenary'
  | 'sonic-alchemist'
  | 'charismatic-svengali';

export type PlaystyleFocus =
  | 'purist'       // Chasing S-rank acoustic perfection, Golden Reels awards, vintage gear
  | 'hit-maker'    // Maximizing royalties, streaming trends, radio plays, rapid releases
  | 'underground'  // Cult followings, raw talent, rebellious genres, anti-corporate clout
  | 'sound-lab';   // Hardware circuit modding, custom DSP, synth discovery, tech synergy

export type VisualThemeId =
  | 'warm-analog'    // Amber glow, mahogany wood, vintage VU meters, vacuum tube warmth
  | 'neon-digital'   // Cyan/magenta LED, polished glass, digital peak meters
  | 'velvet-lounge'  // Deep purple & gold, executive leather, warm incandescent lights
  | 'modular-rack';  // Phosphor green, patch cables, oscilloscope waveforms, brushed steel

export interface ProducerOrigin {
  id: ProducerBackgroundId;
  name: string;
  tagline: string;
  lore: string;
  primaryPlaystyle: PlaystyleFocus;
  startingAttributeBonus: Partial<PlayerAttributes>;
  passivePerk: {
    name: string;
    description: string;
    qualityBonus?: number;
    payoutMultiplier?: number;
    xpMultiplier?: number;
    upkeepDiscount?: number;
    relationshipXpMultiplier?: number;
    /** Gig refreshes cost nothing (the cooldown still applies). */
    freeGigRefresh?: boolean;
    /** Multiplier on studio-synergy quality bonuses (1.25 = 25% stronger). */
    synergyMultiplier?: number;
    /** Extra payout multiplier when the session's genre market is hot (>= 1.05). */
    hotMarketPayoutBonus?: number;
    /** Extra reputation fraction on A-rank (80+) sessions, e.g. 0.15 = +15%. */
    rankARepBonus?: number;
    /** Returning-client fee premium (default game value 1.1). */
    repeatClientPremium?: number;
    /** Skills that receive `xpMultiplier` (defaults to none). */
    xpSkills?: string[];
    specialTrait: string;
  };
  startingGearSuggestion: string;
  signatureGenres: string[];
  preferredTheme: VisualThemeId;
}

export interface ProducerCustomization {
  name: string;
  moniker: string;
  backgroundId: ProducerBackgroundId;
  playstyle: PlaystyleFocus;
  visualTheme: VisualThemeId;
  signatureMotto: string;
  avatarIcon: string;
  unlockedThemes: VisualThemeId[];
  storyFlags: Record<string, boolean | number | string>;
}

export interface CareerProducer {
  name: string;
  appearance: NpcVisualIdentity;
}
