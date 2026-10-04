// collectibles.ts
// Emblems, skins, stickers and level collectibles that sit ALONGSIDE the main
// equipment sprites (shelf trophies, case stickers, console faceplates).
//
// Status policy:
// - `status: 'shipped'`  → data + UI wiring exists today.
// - `status: 'roadmap'`  → data scaffold only; UI/3D wiring is deferred and
//   tracked in docs/ART_SOURCING_LOG.md + the beads roadmap issue.
// Sourcing policy: CC0 only for anything bundled. CC-BY packs are referenced
// for inspiration but flagged needsReplacement and never bundled unattributed.

import type { ArtSourceRef } from './equipmentArt';

export type CollectibleKind = 'emblem' | 'skin' | 'sticker' | 'level_trophy';
export type CollectibleStatus = 'shipped' | 'roadmap';

export interface CollectibleAcquisition {
  type: 'chore_streak' | 's_grade' | 'set_completion' | 'level_up' | 'auction' | 'dealer';
  detail: string;
}

export interface CollectibleDef {
  id: string;
  kind: CollectibleKind;
  name: string;
  description: string;
  icon: string;
  /** Sprite path under public/assets/collectibles/ (fallback = icon + CSS). */
  sprite: string;
  source: ArtSourceRef;
  acquisition: CollectibleAcquisition;
  status: CollectibleStatus;
  /** Which equipment/room this can be slotted onto (undefined = shelf display). */
  slot?: string;
}

const CC0_MEDALS_KENNEY: ArtSourceRef = {
  pack: 'Kenney Medals (9 medals × shaded/flat/shadow)',
  url: 'https://opengameart.org/content/medals-2',
  license: 'CC0',
  author: 'Kenney (kenney.nl)',
  notes: 'Designated source for level_trophy shelf medals. Shipped as CSS/SVG until PNG pipeline lands.',
};

const CC0_MEDALS_BUCH: ArtSourceRef = {
  pack: 'OGA Medals (bronze/silver/gold/platinum)',
  url: 'https://opengameart.org/content/medals-3',
  license: 'CC0',
  author: 'Buch (OGA)',
  notes: 'Credit appreciated, not required. Alt medal silhouettes for emblems.',
};

const CC0_AWARD_ICONS: ArtSourceRef = {
  pack: 'OGA CC0 Award Icons (32x32)',
  url: 'https://opengameart.org/content/cc0-award-icons',
  license: 'CC0',
  author: 'OGA community (7Soul1 + OCAL sources, scaled to 32x32)',
  notes: 'Trophy/cup/star icons for level collectibles.',
};

const CC0_GAME_ICONS: ArtSourceRef = {
  pack: 'Kenney Game Icons (105 icons)',
  url: 'https://opengameart.org/content/game-icons',
  license: 'CC0',
  author: 'Kenney (kenney.nl)',
  notes: 'Star, trophy, medal, audio icons → sticker + emblem base shapes.',
};

const CC0_CYBER_LOOT: ArtSourceRef = {
  pack: 'OGA Cyber Inventory Mega Pack (158 loot/UI icons, 4 neon styles)',
  url: 'https://opengameart.org/content/cyber-inventory-mega-pack-%E2%80%94-158-free-lootui-icons-4-neon-styles-%E2%80%94-cc0',
  license: 'CC0',
  author: 'Aura Design Assets (OGA)',
  notes: 'Neon sticker treatments (Cyber Core blue / Neon Pulse pink / Toxic Grid green). Roadmap skins.',
};

const IN_HOUSE: ArtSourceRef = {
  pack: 'In-house procedural (CSS/SVG)',
  url: '',
  license: 'original',
  author: 'RST team',
  notes: 'Procedural gradients + stencil text. Zero-dependency fallback rendered today.',
};

export const COLLECTIBLES: CollectibleDef[] = [
  // ---- Emblems (studio badges — shelf + profile) ----
  {
    id: 'emblem_first_take',
    kind: 'emblem',
    name: 'First Take Emblem',
    description: 'Awarded for completing your first project. Pins to the studio shelf.',
    icon: '🎖️',
    sprite: 'assets/collectibles/emblem_first_take.png',
    source: CC0_MEDALS_KENNEY,
    acquisition: { type: 'level_up', detail: 'Complete 1 project' },
    status: 'shipped',
  },
  {
    id: 'emblem_gold_record',
    kind: 'emblem',
    name: 'Gold Record Emblem',
    description: 'An S-grade take earns this gold disc for the wall.',
    icon: '📀',
    sprite: 'assets/collectibles/emblem_gold_record.png',
    source: CC0_AWARD_ICONS,
    acquisition: { type: 's_grade', detail: 'Score an S-grade stage take' },
    status: 'shipped',
  },
  {
    id: 'emblem_genre_rock',
    kind: 'emblem',
    name: 'Rock Wing Emblem',
    description: 'Complete the Rock equipment set to forge this winged badge.',
    icon: '🎸',
    sprite: 'assets/collectibles/emblem_genre_rock.png',
    source: CC0_MEDALS_BUCH,
    acquisition: { type: 'set_completion', detail: 'Own 4+ Rock-bonus items' },
    status: 'roadmap',
  },
  {
    id: 'emblem_genre_electronic',
    kind: 'emblem',
    name: 'Circuit Emblem',
    description: 'Complete the Electronic set. Glows under neon skins.',
    icon: '🔌',
    sprite: 'assets/collectibles/emblem_genre_electronic.png',
    source: CC0_CYBER_LOOT,
    acquisition: { type: 'set_completion', detail: 'Own 4+ Electronic-bonus items' },
    status: 'roadmap',
  },
  // ---- Skins (console / mic / monitor faceplates) ----
  {
    id: 'skin_studio_black',
    kind: 'skin',
    name: 'Studio Black Faceplate',
    description: 'Matte-black recolour for any outboard or console. Applies via art variants today.',
    icon: '⬛',
    sprite: 'assets/collectibles/skin_studio_black.png',
    source: IN_HOUSE,
    acquisition: { type: 'level_up', detail: 'Reach Studio Level 3' },
    status: 'shipped',
    slot: 'outboard',
  },
  {
    id: 'skin_neon_pulse',
    kind: 'skin',
    name: 'Neon Pulse Skin',
    description: 'Hot-pink neon treatment for synths and drum machines. CSS variant ships; PNG pack on roadmap.',
    icon: '🌃',
    sprite: 'assets/collectibles/skin_neon_pulse.png',
    source: CC0_CYBER_LOOT,
    acquisition: { type: 's_grade', detail: 'Score 3 S-grade takes' },
    status: 'roadmap',
    slot: 'instrument',
  },
  {
    id: 'skin_tube_glow',
    kind: 'skin',
    name: 'Tube Glow Skin',
    description: 'Warm amber glow for tube-stage mics and preamps. Tied to tube mods.',
    icon: '💡',
    sprite: 'assets/collectibles/skin_tube_glow.png',
    source: IN_HOUSE,
    acquisition: { type: 'set_completion', detail: 'Research any tube mod' },
    status: 'shipped',
    slot: 'microphone',
  },
  // ---- Stickers (slotted onto flight cases + gear) ----
  {
    id: 'sticker_streak_3',
    kind: 'sticker',
    name: '"3-Day Streak" Sticker',
    description: 'Slaps onto your next flight case. Proof you cleaned the tape heads like an adult.',
    icon: '✨',
    sprite: 'assets/collectibles/sticker_streak_3.png',
    source: CC0_GAME_ICONS,
    acquisition: { type: 'chore_streak', detail: 'Complete a 3-day chore streak' },
    status: 'shipped',
    slot: 'flight_case',
  },
  {
    id: 'sticker_s_grade',
    kind: 'sticker',
    name: '"S-Grade" Foil Sticker',
    description: 'Holographic S sticker. Drops with S-grade takes.',
    icon: '🏅',
    sprite: 'assets/collectibles/sticker_s_grade.png',
    source: CC0_GAME_ICONS,
    acquisition: { type: 's_grade', detail: 'Score an S-grade stage take' },
    status: 'shipped',
    slot: 'flight_case',
  },
  {
    id: 'sticker_tour_30',
    kind: 'sticker',
    name: '"30-Day Tour" Crew Sticker',
    description: 'Crew-only sticker for 30-day streak vaults. Neon treatment.',
    icon: '🎫',
    sprite: 'assets/collectibles/sticker_tour_30.png',
    source: CC0_CYBER_LOOT,
    acquisition: { type: 'chore_streak', detail: 'Reach a 30-day chore streak' },
    status: 'roadmap',
    slot: 'flight_case',
  },
  // ---- Level trophies (shelf display per studio level) ----
  {
    id: 'trophy_bronze_console',
    kind: 'level_trophy',
    name: 'Bronze Console Trophy',
    description: 'Studio Level 2 shelf trophy. Bronze mini-console.',
    icon: '🥉',
    sprite: 'assets/collectibles/trophy_bronze_console.png',
    source: CC0_MEDALS_BUCH,
    acquisition: { type: 'level_up', detail: 'Reach Studio Level 2' },
    status: 'roadmap',
  },
  {
    id: 'trophy_gold_mic',
    kind: 'level_trophy',
    name: 'Gold Mic Trophy',
    description: 'Studio Level 5 shelf trophy. Gold condenser on a stand.',
    icon: '🥇',
    sprite: 'assets/collectibles/trophy_gold_mic.png',
    source: CC0_MEDALS_KENNEY,
    acquisition: { type: 'level_up', detail: 'Reach Studio Level 5' },
    status: 'roadmap',
  },
];

export const COLLECTIBLES_BY_KIND: Record<CollectibleKind, CollectibleDef[]> = {
  emblem: COLLECTIBLES.filter((c) => c.kind === 'emblem'),
  skin: COLLECTIBLES.filter((c) => c.kind === 'skin'),
  sticker: COLLECTIBLES.filter((c) => c.kind === 'sticker'),
  level_trophy: COLLECTIBLES.filter((c) => c.kind === 'level_trophy'),
};

export function getCollectible(id: string): CollectibleDef | undefined {
  return COLLECTIBLES.find((c) => c.id === id);
}

/**
 * Later-roadmap log: 3D models, animated variants and skins UI are scaffolded
 * here but intentionally NOT wired to gameplay yet. Single place to track the
 * deferred work so future issues can reference it.
 */
export const COLLECTIBLES_ROADMAP = {
  deferred: [
    '3D model viewer for flight cases (OGA Sci-Fi Shipping Crate .glb + Crate-and-barrel .blend as base meshes)',
    'Sourcing 3D gear models: Kenney Furniture Kit / City Kit (CC0 .obj/.fbx/.glb) for studio room dressing',
    'Animated sprite variants (VU bounce, tube flicker, VU-meter glow) — needs artist pass or Higgsfield generation',
    'Skins UI: equip/unequip faceplates per equipment item (uses equipmentArt.variants data, needs modal)',
    'Sticker slotting UI on CrateUnboxingModal + EquipmentDetailModal',
    'Shelf display scene for emblems + level trophies (PixiJS layer)',
    'AI-generated filler art (Higgsfield) ONLY where no CC0 equivalent exists — must be flagged + licensed in-house',
  ],
  sourcingQueue: [
    'Download + trim Kenney Generic Items PNGs into public/assets/items/ (guitar, keyboard, drum)',
    'Download + trim OGA Hifi System PNGs into public/assets/items/ (receiver, equalizer, tape-deck, speakers)',
    'Download + trim Kenney Medals + OGA Award Icons into public/assets/collectibles/',
    'Evaluate Kenney Furniture Kit isometric renders for studio background layers',
  ],
} as const;
