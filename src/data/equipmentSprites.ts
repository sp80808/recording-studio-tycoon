// Equipment-to-sprite mapping for the visual studio scene.
// Maps equipment IDs to sprite filenames and (x, y) positions in the studio.
// Sprites resolve from equipmentArt.ts (single source of truth); positions are
// laid out per category row so new items slot in without overlap.
// Back-compat: existing imports of `equipmentSpriteMap` keep working.

import { getEquipmentSprite } from './equipmentArt';

export interface EquipmentSpriteMapping {
  sprite: string; // Filename of the sprite asset
  x: number; // X coordinate in the studio scene
  y: number; // Y coordinate in the studio scene
}

function pos(sprite: string, x: number, y: number): EquipmentSpriteMapping {
  return { sprite, x, y };
}

function art(id: string, x: number, y: number): EquipmentSpriteMapping {
  const full = getEquipmentSprite(id);
  // equipmentArt stores 'assets/items/xxx.png' — legacy map used bare filenames.
  const sprite = full.split('/').pop() ?? full;
  return pos(sprite, x, y);
}

// Map of equipment ID to sprite and position
export const equipmentSpriteMap: Record<string, EquipmentSpriteMapping> = {
  // Microphones (row y=220)
  basic_mic: art('basic_mic', 120, 220),
  basic_60s_mic: art('basic_60s_mic', 140, 220),
  dynamic_60s_mic: art('dynamic_60s_mic', 160, 220),
  shurely_serious_mic: art('shurely_serious_mic', 180, 220),
  condenser_mic: art('condenser_mic', 200, 220),
  dynamic_mic: art('dynamic_mic', 220, 220),
  neumann_u_wish: art('neumann_u_wish', 240, 220),
  ribbon_vintage_mic: art('ribbon_vintage_mic', 260, 220),
  telefunken_u47: art('telefunken_u47', 280, 220),
  neumann_u87: art('neumann_u87', 300, 220),
  podcast_setup: art('podcast_setup', 320, 220),
  sphere_mic_system: art('sphere_mic_system', 340, 220),

  // Outboard Gear (row y=260)
  telefunken_around: art('telefunken_around', 120, 260),
  api_the_wiser: art('api_the_wiser', 140, 260),
  fairychild_comp: art('fairychild_comp', 160, 260),
  compressor: art('compressor', 180, 260),
  ssl_console_strip: art('ssl_console_strip', 200, 260),
  urei_1176_compressor: art('urei_1176_compressor', 220, 260),
  mixing_board_60s: art('mixing_board_60s', 240, 260),
  fairchild_660: art('fairchild_660', 260, 260),
  fairchild_670_compressor: art('fairchild_670_compressor', 280, 260),
  emt_140_plate_reverb: art('emt_140_plate_reverb', 300, 260),
  lexicon_224_reverb_70s: art('lexicon_224_reverb_70s', 320, 260),
  digital_delay: art('digital_delay', 340, 260),
  mastering_chain_suite: art('mastering_chain_suite', 360, 260),
  ssl_4000_console: art('ssl_4000_console', 380, 260),

  // Instruments (rows y=300/330)
  moog_or_less: art('moog_or_less', 120, 300),
  moog_modular: art('moog_modular', 140, 300),
  synthesizer: art('synthesizer', 160, 300),
  midi_controller: art('midi_controller', 180, 300),
  modular_synth_rig: art('modular_synth_rig', 200, 300),
  fender_bender: art('fender_bender', 220, 300),
  fender_stratocaster: art('fender_stratocaster', 240, 300),
  les_paul: art('les_paul', 260, 300),
  guitar_amp: art('guitar_amp', 280, 300),
  vox_ac30: art('vox_ac30', 300, 300),
  drum_machine_808: art('drum_machine_808', 320, 300),
  sampler_mpc: art('sampler_mpc', 340, 300),
  tape_machine_4track: art('tape_machine_4track', 360, 300),

  // Software & plugins (row y=340)
  pro_tools_shed: art('pro_tools_shed', 120, 340),
  daw_protools: art('daw_protools', 140, 340),
  logic_pro_blem: art('logic_pro_blem', 160, 340),
  ableton_live_wire: art('ableton_live_wire', 180, 340),
  modern_daw: art('modern_daw', 200, 340),
  autotune_autobot: art('autotune_autobot', 220, 340),
  autotune_original: art('autotune_original', 240, 340),
  ai_assisted_daw: art('ai_assisted_daw', 260, 340),
  ai_mastering: art('ai_mastering', 280, 340),

  // Monitoring (row y=380)
  basic_monitors: art('basic_monitors', 120, 380),
  studio_monitors: art('studio_monitors', 140, 380),
  yamaha_ns_no_way: art('yamaha_ns_no_way', 160, 380),
  altec_604e: art('altec_604e', 180, 380),
  genelec_monitors: art('genelec_monitors', 200, 380),
  atc_scm_monitors: art('atc_scm_monitors', 220, 380),

  // Interfaces (row y=420)
  audio_interface: art('audio_interface', 120, 420),
  basic_interface: art('basic_interface', 140, 420),
  apogee_symphony_phony: art('apogee_symphony_phony', 160, 420),

  // Catalogue expansion
  pultec_eqp1a: art('pultec_eqp1a', 400, 260),
  neve_1073_preamp: art('neve_1073_preamp', 420, 260),
  avalon_vt737: art('avalon_vt737', 440, 260),
  hammond_b3: art('hammond_b3', 380, 300),
  ampeg_svt: art('ampeg_svt', 400, 300),
  roland_tr909: art('roland_tr909', 420, 300),
  akg_c414: art('akg_c414', 360, 220),
  shure_sm7_broadcast: art('shure_sm7_broadcast', 380, 220),
  yamaha_hs8: art('yamaha_hs8', 240, 380),
  melodyne_pitch_editor: art('melodyne_pitch_editor', 300, 340),
};

// Sprite filenames should match those in your assets directory (e.g., public/assets/ or similar)
// Adjust (x, y) positions for best visual layout in the studio scene
