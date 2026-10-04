// equipmentArt.ts
// Central art registry: every playable equipment item gets a sprite, fallback
// icon, CC0 source attribution, and CSS variants. This is the single source of
// truth — equipmentSprites.ts re-exports positions + sprites from here.
//
// Sourcing policy (see docs/ART_SOURCING_LOG.md):
// - Prefer CC0 (Kenney, OGA CC0 packs). No GPL / NC / ND assets bundled.
// - CC-BY assets are listed only where no CC0 equivalent exists, and are
//   flagged `needsReplacement: true` — never bundled without attribution.
// - Actual PNGs live under public/assets/items/. Until the download pipeline
//   lands, the game renders sprite if present, else fallback emoji + tint.
//   Nothing here breaks if a PNG is missing.

export interface ArtSourceRef {
  pack: string;
  url: string;
  license: 'CC0' | 'CC-BY' | 'original';
  author: string;
  notes?: string;
  needsReplacement?: boolean;
}

export interface EquipmentArtVariant {
  id: string;
  label: string;
  /** CSS filter applied over the base sprite (tint / wear / glow). */
  cssFilter: string;
  unlock: string;
}

export interface EquipmentArtEntry {
  equipmentId: string;
  category: string;
  /** Base sprite path relative to public/. */
  sprite: string;
  /** Alternate sprite files (same folder) — optional recolours/remixes. */
  spriteAlts: string[];
  fallbackIcon: string;
  /** Base tint for CSS fallback / glow. */
  tint: string;
  source: ArtSourceRef;
  variants: EquipmentArtVariant[];
  /** Whether condition wear (scratches/dust overlay) applies. */
  wearSupport: boolean;
  /** Whether flight-case stickers / emblems can be slotted onto this item. */
  emblemSlot: boolean;
}

export const ART_SOURCE_PACKS: ArtSourceRef[] = [
  {
    pack: 'Kenney Generic Items (160 items, instruments + tools)',
    url: 'https://opengameart.org/content/generic-items',
    license: 'CC0',
    author: 'Kenney (kenney.nl)',
    notes: 'Guitar, electric guitar, keyboard, drum, tambourine, violin. Base for all instrument sprites.',
  },
  {
    pack: 'OGA Misc and Tool Items',
    url: 'https://opengameart.org/content/misc-and-tool-items',
    license: 'CC0',
    author: 'OpenGameArt contributors',
    notes: 'Guitars, keyboards, misc studio tools. Alt silhouettes for instruments.',
  },
  {
    pack: 'OGA Hifi System (pixel art components)',
    url: 'https://opengameart.org/content/hifi-system',
    license: 'CC0',
    author: 'OpenGameArt contributor',
    notes: 'receiver.png, equalizer.png, tape-deck.png, turntable.png, speaker_closed.png. Base for outboard / monitor / interface / recorder sprites.',
  },
  {
    pack: 'OGA Instrument Pixel Art (CC0)',
    url: 'https://opengameart.org/content/instrument-pixel-art-cco',
    license: 'CC0',
    author: 'KaliYuga (OGA)',
    notes: 'Supplemental instrument icons. Alt variants for synths / drum machines.',
  },
  {
    pack: 'Kenney Game Icons (105 icons, black+white)',
    url: 'https://opengameart.org/content/game-icons',
    license: 'CC0',
    author: 'Kenney (kenney.nl)',
    notes: 'Audio, settings, star, trophy icons. Base for software / plugin sprites.',
  },
  {
    pack: 'Kenney Digital Audio (SFX pack)',
    url: 'https://kenney.nl/assets/digital-audio',
    license: 'CC0',
    author: 'Kenney (kenney.nl)',
    notes: 'Audio reference only — no sprites taken. Listed so audio + visual sources stay in one log.',
  },
  {
    pack: 'Kenney Furniture Kit + Roguelike Indoor pack',
    url: 'https://kenney.nl/assets/furniture-kit',
    license: 'CC0',
    author: 'Kenney (kenney.nl)',
    notes: 'Room dressing (desks, racks, shelves). NOT per-item art — used for studio background layers.',
  },
];

const STOCK: EquipmentArtVariant = { id: 'stock', label: 'Stock', cssFilter: 'none', unlock: 'Owned' };
const ROADWORN: EquipmentArtVariant = {
  id: 'roadworn',
  label: 'Roadworn',
  cssFilter: 'sepia(0.35) contrast(0.95) brightness(0.92)',
  unlock: 'Condition < 60 or Yard-Sale find',
};
const STUDIO_BLACK: EquipmentArtVariant = {
  id: 'studio-black',
  label: 'Studio Black',
  cssFilter: 'brightness(0.55) saturate(1.4) hue-rotate(-10deg)',
  unlock: 'Studio Level 3',
};
const TUBE_GLOW: EquipmentArtVariant = {
  id: 'tube-glow',
  label: 'Tube Glow',
  cssFilter: 'saturate(1.6) brightness(1.1) drop-shadow(0 0 6px rgba(251,191,36,0.8))',
  unlock: 'Apply tube-stage mod',
};
const NEON_SKIN: EquipmentArtVariant = {
  id: 'neon-skin',
  label: 'Neon Skin',
  cssFilter: 'saturate(2) hue-rotate(140deg) brightness(1.05)',
  unlock: 'Collect 5 stickers (roadmap)',
};

function entry(
  equipmentId: string,
  category: string,
  sprite: string,
  fallbackIcon: string,
  tint: string,
  source: ArtSourceRef,
  spriteAlts: string[] = [],
  variants: EquipmentArtVariant[] = [STOCK, ROADWORN, STUDIO_BLACK],
): EquipmentArtEntry {
  return {
    equipmentId,
    category,
    sprite,
    spriteAlts,
    fallbackIcon,
    tint,
    source,
    variants,
    wearSupport: true,
    emblemSlot: category !== 'software',
  };
}

const [KENNEY_GENERIC, OGA_MISC_TOOL, OGA_HIFI, OGA_INSTR, KENNEY_ICONS] = [
  ART_SOURCE_PACKS[0],
  ART_SOURCE_PACKS[1],
  ART_SOURCE_PACKS[2],
  ART_SOURCE_PACKS[3],
  ART_SOURCE_PACKS[4],
];

/**
 * One entry per playable equipment id (equipment.ts + eraEquipment.ts union).
 * Sprite filenames are targets under public/assets/items/ — the loader falls
 * back to fallbackIcon when the file is absent, so adding a PNG is enough to
 * light up the item with zero code changes.
 */
export const EQUIPMENT_ART_MAP: Record<string, EquipmentArtEntry> = {
  // ---- Microphones (OGA Hifi turntable/mic stand + Kenney generic mic shapes) ----
  basic_mic: entry('basic_mic', 'microphone', 'assets/items/item_microphone.png', '🎤', '#94a3b8', OGA_HIFI, ['assets/items/item_microphone_alt_condenser.png']),
  basic_60s_mic: entry('basic_60s_mic', 'microphone', 'assets/items/item_microphone_ribbon.png', '🎤', '#d6a35c', OGA_HIFI, ['assets/items/item_microphone.png'], [STOCK, ROADWORN, TUBE_GLOW]),
  dynamic_60s_mic: entry('dynamic_60s_mic', 'microphone', 'assets/items/item_microphone.png', '🎤', '#a8a29e', OGA_HIFI),
  shurely_serious_mic: entry('shurely_serious_mic', 'microphone', 'assets/items/item_microphone.png', '🎤', '#78716c', OGA_HIFI),
  condenser_mic: entry('condenser_mic', 'microphone', 'assets/items/item_microphone_alt_condenser.png', '🎤', '#38bdf8', OGA_HIFI, ['assets/items/item_microphone.png'], [STOCK, ROADWORN, TUBE_GLOW]),
  dynamic_mic: entry('dynamic_mic', 'microphone', 'assets/items/item_microphone.png', '🎤', '#64748b', OGA_HIFI),
  neumann_u_wish: entry('neumann_u_wish', 'microphone', 'assets/items/item_microphone_alt_condenser.png', '🎤', '#e2e8f0', OGA_HIFI, ['assets/items/item_microphone_ribbon.png'], [STOCK, TUBE_GLOW, STUDIO_BLACK]),
  ribbon_vintage_mic: entry('ribbon_vintage_mic', 'microphone', 'assets/items/item_microphone_ribbon.png', '🎤', '#f59e0b', OGA_HIFI, [], [STOCK, ROADWORN, TUBE_GLOW]),
  telefunken_u47: entry('telefunken_u47', 'microphone', 'assets/items/item_microphone_alt_condenser.png', '🎤', '#fbbf24', OGA_HIFI, [], [STOCK, TUBE_GLOW, ROADWORN]),
  neumann_u87: entry('neumann_u87', 'microphone', 'assets/items/item_microphone_alt_condenser.png', '🎤', '#cbd5e1', OGA_HIFI, [], [STOCK, TUBE_GLOW, STUDIO_BLACK]),
  podcast_setup: entry('podcast_setup', 'microphone', 'assets/items/item_microphone_podcast.png', '🎙️', '#f472b6', KENNEY_ICONS, ['assets/items/item_microphone.png']),
  sphere_mic_system: entry('sphere_mic_system', 'microphone', 'assets/items/item_microphone_alt_condenser.png', '🎙️', '#22d3ee', OGA_HIFI, [], [STOCK, NEON_SKIN, STUDIO_BLACK]),
  small_diaphragm_pair: entry('small_diaphragm_pair', 'microphone', 'assets/items/item_microphone_alt_condenser.png', '🎤', '#a3e635', OGA_HIFI, ['assets/items/item_microphone.png']),

  // ---- Outboard / mixers / recorders (OGA Hifi receiver + equalizer + tape-deck) ----
  telefunken_around: entry('telefunken_around', 'outboard', 'assets/items/item_outboard.png', '⚙️', '#f59e0b', OGA_HIFI),
  api_the_wiser: entry('api_the_wiser', 'outboard', 'assets/items/item_outboard.png', '⚙️', '#38bdf8', OGA_HIFI),
  fairychild_comp: entry('fairychild_comp', 'outboard', 'assets/items/item_outboard.png', '⚙️', '#a855f7', OGA_HIFI),
  compressor: entry('compressor', 'outboard', 'assets/items/item_outboard.png', '⚙️', '#94a3b8', OGA_HIFI),
  ssl_console_strip: entry('ssl_console_strip', 'outboard', 'assets/items/item_console.png', '⚙️', '#22c55e', OGA_HIFI, ['assets/items/item_outboard.png']),
  urei_1176_compressor: entry('urei_1176_compressor', 'outboard', 'assets/items/item_outboard.png', '⚙️', '#0ea5e9', OGA_HIFI, ['assets/items/item_outboard_alt_blue.png']),
  mixing_board_60s: entry('mixing_board_60s', 'outboard', 'assets/items/item_console.png', '🎛️', '#d6a35c', OGA_HIFI),
  fairchild_660: entry('fairchild_660', 'outboard', 'assets/items/item_outboard.png', '⚙️', '#fbbf24', OGA_HIFI),
  fairchild_670_compressor: entry('fairchild_670_compressor', 'outboard', 'assets/items/item_outboard.png', '⚙️', '#f59e0b', OGA_HIFI),
  emt_140_plate_reverb: entry('emt_140_plate_reverb', 'outboard', 'assets/items/item_outboard_plate.png', '⚙️', '#a8a29e', OGA_HIFI, ['assets/items/item_outboard.png']),
  lexicon_224_reverb_70s: entry('lexicon_224_reverb_70s', 'outboard', 'assets/items/item_outboard.png', '⚙️', '#22d3ee', OGA_HIFI),
  digital_delay: entry('digital_delay', 'outboard', 'assets/items/item_outboard.png', '⚙️', '#06b6d4', OGA_HIFI),
  ssl_4000_console: entry('ssl_4000_console', 'mixer', 'assets/items/item_console_large.png', '🎚️', '#16a34a', OGA_HIFI, ['assets/items/item_console.png']),
  tape_machine_4track: entry('tape_machine_4track', 'instrument', 'assets/items/item_tape.png', '📼', '#d6a35c', OGA_HIFI, ['assets/items/item_outboard.png']),
  mastering_chain_suite: entry('mastering_chain_suite', 'outboard', 'assets/items/item_console.png', '🎚️', '#fbbf24', OGA_HIFI, [], [STOCK, STUDIO_BLACK, NEON_SKIN]),
  dbx_160_compressor: entry('dbx_160_compressor', 'outboard', 'assets/items/item_outboard.png', '⚙️', '#e7e5e4', OGA_HIFI),
  adat_8track: entry('adat_8track', 'recorder', 'assets/items/item_tape.png', '📼', '#64748b', OGA_HIFI, ['assets/items/item_outboard.png']),

  // ---- Instruments (Kenney Generic Items + OGA Misc Tool Items) ----
  moog_or_less: entry('moog_or_less', 'instrument', 'assets/items/item_keyboard.png', '🎹', '#a855f7', KENNEY_GENERIC, ['assets/items/item_keyboard_alt.png'], [STOCK, NEON_SKIN, STUDIO_BLACK]),
  moog_modular: entry('moog_modular', 'instrument', 'assets/items/item_keyboard_modular.png', '🎹', '#c084fc', KENNEY_GENERIC, ['assets/items/item_keyboard.png']),
  synthesizer: entry('synthesizer', 'instrument', 'assets/items/item_keyboard.png', '🎹', '#8b5cf6', KENNEY_GENERIC),
  midi_controller: entry('midi_controller', 'instrument', 'assets/items/item_keyboard.png', '🎹', '#64748b', KENNEY_GENERIC),
  modular_synth_rig: entry('modular_synth_rig', 'instrument', 'assets/items/item_keyboard_modular.png', '🎛️', '#e879f9', OGA_INSTR, ['assets/items/item_keyboard.png'], [STOCK, NEON_SKIN, TUBE_GLOW]),
  fender_bender: entry('fender_bender', 'instrument', 'assets/items/item_guitar.png', '🎸', '#f97316', KENNEY_GENERIC),
  fender_stratocaster: entry('fender_stratocaster', 'instrument', 'assets/items/item_guitar.png', '🎸', '#ef4444', KENNEY_GENERIC),
  les_paul: entry('les_paul', 'instrument', 'assets/items/item_guitar_alt_lespaul.png', '🎸', '#f59e0b', KENNEY_GENERIC, ['assets/items/item_guitar.png']),
  guitar_amp: entry('guitar_amp', 'instrument', 'assets/items/item_guitar_amp.png', '🎸', '#78716c', OGA_MISC_TOOL, ['assets/items/item_guitar.png']),
  vox_ac30: entry('vox_ac30', 'instrument', 'assets/items/item_guitar_amp.png', '🎸', '#292524', OGA_MISC_TOOL),
  drum_machine_808: entry('drum_machine_808', 'instrument', 'assets/items/item_drummachine.png', '🥁', '#f43f5e', KENNEY_GENERIC, ['assets/items/item_keyboard.png'], [STOCK, NEON_SKIN, ROADWORN]),
  sampler_mpc: entry('sampler_mpc', 'instrument', 'assets/items/item_drummachine.png', '🎛️', '#94a3b8', KENNEY_GENERIC),
  rhodes_stage_piano: entry('rhodes_stage_piano', 'instrument', 'assets/items/item_keyboard.png', '🎹', '#b45309', KENNEY_GENERIC, ['assets/items/item_keyboard_alt.png']),
  dx7_synth: entry('dx7_synth', 'instrument', 'assets/items/item_keyboard.png', '🎹', '#0ea5e9', KENNEY_GENERIC, ['assets/items/item_keyboard_alt.png']),

  // ---- Software & plugins (Kenney Game Icons, in-house faceplates) ----
  pro_tools_shed: entry('pro_tools_shed', 'software', 'assets/items/item_software_daw.png', '💻', '#38bdf8', KENNEY_ICONS),
  daw_protools: entry('daw_protools', 'software', 'assets/items/item_software_daw.png', '💻', '#0ea5e9', KENNEY_ICONS),
  logic_pro_blem: entry('logic_pro_blem', 'software', 'assets/items/item_software_daw.png', '💻', '#a3a3a3', KENNEY_ICONS),
  ableton_live_wire: entry('ableton_live_wire', 'software', 'assets/items/item_software_daw.png', '💻', '#fbbf24', KENNEY_ICONS),
  modern_daw: entry('modern_daw', 'software', 'assets/items/item_software_daw.png', '💻', '#22d3ee', KENNEY_ICONS),
  autotune_autobot: entry('autotune_autobot', 'software', 'assets/items/item_plugin.png', '💻', '#e879f9', KENNEY_ICONS),
  autotune_original: entry('autotune_original', 'software', 'assets/items/item_plugin.png', '🤖', '#c084fc', KENNEY_ICONS),
  ai_assisted_daw: entry('ai_assisted_daw', 'software', 'assets/items/item_software_ai.png', '🧠', '#a855f7', KENNEY_ICONS, ['assets/items/item_software_daw.png'], [STOCK, NEON_SKIN, STUDIO_BLACK]),
  ai_mastering: entry('ai_mastering', 'software', 'assets/items/item_software_ai.png', '🤖', '#818cf8', KENNEY_ICONS),

  // ---- Monitoring (OGA Hifi speaker_closed) ----
  basic_monitors: entry('basic_monitors', 'monitor', 'assets/items/item_monitor.png', '🔊', '#94a3b8', OGA_HIFI),
  studio_monitors: entry('studio_monitors', 'monitor', 'assets/items/item_monitor.png', '🔊', '#38bdf8', OGA_HIFI),
  yamaha_ns_no_way: entry('yamaha_ns_no_way', 'monitor', 'assets/items/item_monitor_ns10.png', '🔊', '#e2e8f0', OGA_HIFI, ['assets/items/item_monitor.png']),
  altec_604e: entry('altec_604e', 'monitor', 'assets/items/item_monitor.png', '🔊', '#d6a35c', OGA_HIFI),
  genelec_monitors: entry('genelec_monitors', 'monitor', 'assets/items/item_monitor.png', '🔊', '#a3a3a3', OGA_HIFI),
  atc_scm_monitors: entry('atc_scm_monitors', 'monitor', 'assets/items/item_monitor.png', '🔊', '#22c55e', OGA_HIFI, [], [STOCK, STUDIO_BLACK, ROADWORN]),

  // ---- Interfaces (OGA Hifi receiver / equalizer) ----
  audio_interface: entry('audio_interface', 'interface', 'assets/items/item_interface.png', '🔌', '#f97316', OGA_HIFI),
  basic_interface: entry('basic_interface', 'interface', 'assets/items/item_interface.png', '🔌', '#ef4444', OGA_HIFI),
  apogee_symphony_phony: entry('apogee_symphony_phony', 'interface', 'assets/items/item_interface.png', '🔌', '#22d3ee', OGA_HIFI, [], [STOCK, TUBE_GLOW, STUDIO_BLACK]),
};

export const EQUIPMENT_ART_LIST: EquipmentArtEntry[] = Object.values(EQUIPMENT_ART_MAP);

export function getEquipmentArt(equipmentId: string): EquipmentArtEntry | undefined {
  return EQUIPMENT_ART_MAP[equipmentId];
}

export function getEquipmentSprite(equipmentId: string, fallback = 'assets/items/item_generic.png'): string {
  return EQUIPMENT_ART_MAP[equipmentId]?.sprite ?? fallback;
}

/** Coverage helper for tests / docs: every id must resolve. */
export function missingArtFor(ids: string[]): string[] {
  return ids.filter((id) => !EQUIPMENT_ART_MAP[id]);
}
