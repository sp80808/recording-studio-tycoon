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
