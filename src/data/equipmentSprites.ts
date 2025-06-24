// Equipment-to-sprite mapping for the visual studio scene
// Maps equipment IDs to sprite filenames and (x, y) positions in the studio
// Update this file as new equipment or assets are added

export interface EquipmentSpriteMapping {
  sprite: string; // Filename of the sprite asset
  x: number;      // X coordinate in the studio scene
  y: number;      // Y coordinate in the studio scene
}

// Map of equipment ID to sprite and position
export const equipmentSpriteMap: Record<string, EquipmentSpriteMapping> = {
  // Microphones
  basic_mic: { sprite: 'item_microphone.png', x: 120, y: 220 },
  shurely_serious_mic: { sprite: 'item_microphone.png', x: 140, y: 220 },
  condenser_mic: { sprite: 'item_microphone.png', x: 160, y: 220 },
  dynamic_mic: { sprite: 'item_microphone.png', x: 180, y: 220 },
  neumann_u_wish: { sprite: 'item_microphone.png', x: 200, y: 220 },
  ribbon_vintage_mic: { sprite: 'item_microphone.png', x: 220, y: 220 },

  // Outboard Gear
  telefunken_around: { sprite: 'item_outboard.png', x: 120, y: 260 },
  api_the_wiser: { sprite: 'item_outboard.png', x: 140, y: 260 },
  fairychild_comp: { sprite: 'item_outboard.png', x: 160, y: 260 },
  compressor: { sprite: 'item_outboard.png', x: 180, y: 260 },
  ssl_console_strip: { sprite: 'item_outboard.png', x: 200, y: 260 },
  urei_1176_compressor: { sprite: 'item_outboard.png', x: 220, y: 260 },

  // Instruments
  moog_or_less: { sprite: 'item_keyboard.png', x: 120, y: 300 },
  fender_bender: { sprite: 'item_guitar.png', x: 140, y: 300 },
  synthesizer: { sprite: 'item_keyboard.png', x: 160, y: 300 },
  guitar_amp: { sprite: 'item_guitar_amp.png', x: 180, y: 300 },
  // Add more mappings as needed
};

// Sprite filenames should match those in your assets directory (e.g., public/assets/ or similar)
// Adjust (x, y) positions for best visual layout in the studio scene 