import { StudioSynergy } from '@/types/synergy';

export const STUDIO_SYNERGIES: StudioSynergy[] = [
  // ==========================================
  // ROOM & GEAR SYNERGIES
  // ==========================================
  {
    id: 'vocal_chain',
    name: 'Vocal Chain',
    category: 'room_gear',
    tagline: 'Vocal Suite + Pro Microphone + Vocal Producer',
    description: 'A tailored vocal booth matched with a precision microphone captures breath and vocal dynamics with stunning clarity.',
    hint: 'Isolate the singer in a dedicated booth with your best microphone.',
    icon: '🎙️',
    criteria: {
      roomTypes: ['vocal-suite'],
      requiredEquipmentCategories: ['microphone'],
      anyStaffRoles: ['Producer', 'Engineer'],
    },
    bonuses: {
      creativityMultiplier: 1.15,
      reviewQualityBonus: 4,
      staffXpMultiplier: 1.2,
    },
  },
  {
    id: 'live_band_setup',
    name: 'Live Band Setup',
    category: 'room_gear',
    tagline: 'Live Room + Instruments + Tracking Engineer',
    description: 'The natural resonance of the Live Room brings drum kits and guitars together for authentic ensemble energy.',
    hint: 'Give your players real room acoustics when tracking live instruments.',
    icon: '🥁',
    criteria: {
      roomTypes: ['live-room'],
      requiredEquipmentCategories: ['instrument'],
      requiredStaffRoles: ['Engineer'],
    },
    bonuses: {
      technicalMultiplier: 1.15,
      workUnitSpeedMultiplier: 1.1,
      reviewQualityBonus: 3,
    },
  },
  {
    id: 'mix_translation',
    name: 'Mix Translation',
    category: 'room_gear',
    tagline: 'Mix Suite + Studio Monitors + Lead Engineer',
    description: 'Calibrated acoustic control ensures frequencies balance reliably across car stereos, club sound systems, and headphones.',
    hint: 'Fine-tune your listening environment with serious monitors in a dedicated mixing space.',
    icon: '🔊',
    criteria: {
      roomTypes: ['mix-suite'],
      requiredEquipmentCategories: ['monitor'],
      requiredStaffRoles: ['Engineer'],
    },
    bonuses: {
      technicalMultiplier: 1.2,
      reviewQualityBonus: 5,
    },
  },
  {
    id: 'analog_front_end',
    name: 'Analog Front-End',
    category: 'room_gear',
    tagline: 'Microphone + Outboard Preamp + Audio Interface',
    description: 'Hardware preamps and analog outboard add punch and harmonic depth before digital conversion.',
    hint: 'Chain a microphone through outboard processing before hitting your interface.',
    icon: '🎛️',
    criteria: {
      requiredEquipmentCategories: ['microphone', 'outboard', 'interface'],
      chainSlots: ['microphone', 'preamp', 'recorderInterface'],
    },
    bonuses: {
      technicalMultiplier: 1.12,
      reviewQualityBonus: 3,
    },
  },
  {
    id: 'tape_warmth',
    name: 'Tape Saturation',
    category: 'room_gear',
    tagline: 'Hardware Tape Recorder + Tube Gear',
    description: 'Sweet magnetic saturation softens harsh transients and glues the low-end together with vintage authority.',
    hint: 'Roll physical magnetic tape to smooth out modern digital edges.',
    icon: '📼',
    criteria: {
      requiredEquipmentCategories: ['recorder'],
    },
    bonuses: {
      creativityMultiplier: 1.1,
      reviewQualityBonus: 3,
      staffXpMultiplier: 1.15,
    },
  },
  {
    id: 'console_command',
    name: 'Console Command',
    category: 'room_gear',
    tagline: 'Studio Console Mixer + Outboard EQ/Compressors',
    description: 'Tactile physical faders and tactile summing give the mixing engineer supreme expressive workflow speed.',
    hint: 'Center your control room around a hardware mixing desk with outboard gear.',
    icon: '🎚️',
    criteria: {
      requiredEquipmentCategories: ['mixer', 'outboard'],
      requiredStaffRoles: ['Engineer'],
    },
    bonuses: {
      technicalMultiplier: 1.15,
      workUnitSpeedMultiplier: 1.15,
    },
  },
  {
    id: 'digital_workstation',
    name: 'Digital Audio Workstation',
    category: 'room_gear',
    tagline: 'Audio Interface + Production Software',
    description: 'A responsive digital pipeline allows rapid non-destructive edits and unlimited track layering.',
    hint: 'Connect a high-speed audio interface directly to audio editing software.',
    icon: '💻',
    criteria: {
      requiredEquipmentCategories: ['interface', 'software'],
    },
    bonuses: {
      workUnitSpeedMultiplier: 1.12,
      creativityMultiplier: 1.08,
    },
  },

  // ==========================================
  // STAFF & CLIENT SYNERGIES
  // ==========================================
  {
    id: 'trusted_pair',
    name: 'Trusted Pair',
    category: 'staff_client',
    tagline: 'Loyal/Advocate Client + Familiar Studio Crew',
    description: 'A shorthand language developed over multiple successful sessions lets creative decisions flow effortlessly.',
    hint: 'Build lasting loyalty with recurring artists and keep them working with your crew.',
    icon: '🤝',
    criteria: {
      clientRelationshipTiers: ['Loyal', 'Advocate'],
      minStaffCount: 1,
    },
    bonuses: {
      creativityMultiplier: 1.15,
      workUnitSpeedMultiplier: 1.12,
      staffXpMultiplier: 1.25,
      reviewQualityBonus: 3,
    },
  },
  {
    id: 'producers_touch',
    name: 'Producer’s Touch',
    category: 'staff_client',
    tagline: 'Visionary Producer (Creativity 20+) Driving Pop/R&B',
    description: 'An imaginative producer who knows how to coax hit hooks and emotional vulnerability out of performers.',
    hint: 'Assign a producer with soaring creative vision to vocal-forward commercial genres.',
    icon: '✨',
    criteria: {
      requiredStaffRoles: ['Producer'],
      minStaffCreativity: 20,
      genres: ['Pop', 'R&B', 'Soul', 'Hip Hop'],
    },
    bonuses: {
      creativityMultiplier: 1.2,
      reviewQualityBonus: 4,
    },
  },
  {
    id: 'audiophile_precision',
    name: 'Audiophile Precision',
    category: 'staff_client',
    tagline: 'Master Engineer (Technical 25+) on High-Fidelity Music',
    description: 'Every microphone position and phase relationship is calculated down to the millimeter.',
    hint: 'Put a mathematically precise engineer in charge of acoustic and jazz sessions.',
    icon: '🔬',
    criteria: {
      requiredStaffRoles: ['Engineer'],
      minStaffTechnical: 25,
      genres: ['Jazz', 'Classical', 'Acoustic', 'Folk'],
    },
    bonuses: {
      technicalMultiplier: 1.2,
      reviewQualityBonus: 5,
    },
  },
  {
    id: 'hitmakers_circle',
    name: 'Hitmaker Team',
    category: 'staff_client',
    tagline: 'Producer & Engineer Collaboration on Commercial Project',
    description: 'Division of labor allows the producer to focus purely on the musical vibe while the engineer nails the sonic balance.',
    hint: 'Pair a dedicated producer and a dedicated engineer on the same session.',
    icon: '👥',
    criteria: {
      requiredStaffRoles: ['Producer', 'Engineer'],
      minStaffCount: 2,
    },
    bonuses: {
      creativityMultiplier: 1.12,
      technicalMultiplier: 1.12,
      workUnitSpeedMultiplier: 1.15,
      reviewQualityBonus: 4,
    },
  },
  {
    id: 'songwriters_spark',
    name: 'Songwriter’s Spark',
    category: 'staff_client',
    tagline: 'In-House Songwriter Collaborating on New Tracks',
    description: 'Fresh harmonic ideas, vocal counter-melodies, and lyrical polish lift an ordinary song into a potential classic.',
    hint: 'Bring a songwriter into the room during the tracking and production phases.',
    icon: '📝',
    criteria: {
      requiredStaffRoles: ['Songwriter'],
    },
    bonuses: {
      creativityMultiplier: 1.18,
      reviewQualityBonus: 3,
      staffXpMultiplier: 1.15,
    },
  },

  // ==========================================
  // GENRE & SETUP SYNERGIES
  // ==========================================
  {
    id: 'organic_groove',
    name: 'Organic Groove',
    category: 'genre_setup',
    tagline: 'Soul/Funk/R&B + Real Instruments + Live Space',
    description: 'The pocket is undeniable when acoustic instruments lock together in a treated acoustic environment.',
    hint: 'Record Soul or Funk players on real instruments in a spacious room.',
    icon: '🎷',
    criteria: {
      genres: ['Soul', 'R&B', 'Funk'],
      roomTypes: ['live-room', 'project-studio'],
      requiredEquipmentCategories: ['instrument'],
    },
    bonuses: {
      creativityMultiplier: 1.15,
      technicalMultiplier: 1.1,
      reviewQualityBonus: 4,
    },
  },
  {
    id: 'electronic_lab',
    name: 'Electronic Lab',
    category: 'genre_setup',
    tagline: 'Electronic/Dance + Synthesis Tools + Production Software',
    description: 'Cutting-edge synthesis and custom modulation routings create fresh, speaker-shaking sounds.',
    hint: 'Pair electronic and dance styles with synthesis gear and audio software.',
    icon: '⚡',
    criteria: {
      genres: ['Electronic', 'Dance', 'Synthpop', 'Techno'],
      requiredEquipmentCategories: ['software'],
    },
    bonuses: {
      creativityMultiplier: 1.18,
      workUnitSpeedMultiplier: 1.12,
    },
  },
  {
    id: 'rock_wall_of_sound',
    name: 'Wall of Sound',
    category: 'genre_setup',
    tagline: 'Rock/Metal + Live Room + Stacks of Instruments',
    description: 'Cranked amplifiers and heavy drum shells pushing air inside a reverberant room create sheer sonic power.',
    hint: 'Cut loose with loud rock guitars and drums in your largest room.',
    icon: '🎸',
    criteria: {
      genres: ['Rock', 'Metal', 'Hard Rock', 'Punk'],
      roomTypes: ['live-room'],
      requiredEquipmentCategories: ['instrument', 'microphone'],
    },
    bonuses: {
      technicalMultiplier: 1.15,
      creativityMultiplier: 1.1,
      reviewQualityBonus: 4,
    },
  },
  {
    id: 'acoustic_intimacy',
    name: 'Acoustic Intimacy',
    category: 'genre_setup',
    tagline: 'Folk/Acoustic + Vocal Suite + Sensitive Microphone',
    description: 'Every finger-pluck on wood and every vocal whisper is captured with zero room noise and total intimacy.',
    hint: 'Track acoustic fingerpicking and delicate vocals inside an isolated vocal booth.',
    icon: '🪕',
    criteria: {
      genres: ['Acoustic', 'Folk', 'Country'],
      roomTypes: ['vocal-suite'],
      requiredEquipmentCategories: ['microphone'],
    },
    bonuses: {
      creativityMultiplier: 1.12,
      reviewQualityBonus: 4,
    },
  },
  {
    id: 'hiphop_boom_bap',
    name: 'Beatmaker Forge',
    category: 'genre_setup',
    tagline: 'Hip Hop/Rap + Samplers/Software + Outboard Punch',
    description: 'Hard-hitting 808s and punchy boom-bap kicks that hit hard in the chest and cut clean through the mix.',
    hint: 'Produce hip-hop beats with software sampling and outboard compression.',
    icon: '🎧',
    criteria: {
      genres: ['Hip Hop', 'Rap', 'Trap'],
      requiredEquipmentCategories: ['software', 'outboard'],
    },
    bonuses: {
      creativityMultiplier: 1.15,
      technicalMultiplier: 1.1,
      reviewQualityBonus: 3,
    },
  },
  {
    id: 'indie_lofi_grit',
    name: 'Lo-Fi Aesthetic',
    category: 'genre_setup',
    tagline: 'Indie Rock/Lo-Fi + Vintage Hardware Recorder',
    description: 'Embracing imperfections, analog flutter, and characterful tape distortion gives the tracks distinctive charm.',
    hint: 'Track indie and lo-fi projects through vintage recording hardware.',
    icon: '📻',
    criteria: {
      genres: ['Indie Rock', 'Lo-Fi', 'Alternative'],
      requiredEquipmentCategories: ['recorder'],
    },
    bonuses: {
      creativityMultiplier: 1.2,
      reviewQualityBonus: 3,
    },
  },
  {
    id: 'pop_vocal_polish',
    name: 'Radio-Ready Polish',
    category: 'genre_setup',
    tagline: 'Pop + Vocal Suite + Digital Editing Software',
    description: 'Tight pitch perfection, layered stereo ad-libs, and pristine compression primed for top-40 streaming charts.',
    hint: 'Combine pop vocals in a dedicated booth with digital editing tools.',
    icon: '💎',
    criteria: {
      genres: ['Pop'],
      roomTypes: ['vocal-suite'],
      requiredEquipmentCategories: ['software', 'microphone'],
    },
    bonuses: {
      technicalMultiplier: 1.15,
      workUnitSpeedMultiplier: 1.15,
      reviewQualityBonus: 4,
    },
  },
  {
    id: 'jazz_club_ambience',
    name: 'Midnight Session',
    category: 'genre_setup',
    tagline: 'Jazz/Blues + Live Room + Full Microphone Array',
    description: 'Capturing dynamic acoustic bleed across instruments yields the natural presence of a live midnight club set.',
    hint: 'Track jazz and blues ensembles in a live space with quality microphones.',
    icon: '🎺',
    criteria: {
      genres: ['Jazz', 'Blues'],
      roomTypes: ['live-room'],
      requiredEquipmentCategories: ['microphone', 'instrument'],
    },
    bonuses: {
      creativityMultiplier: 1.15,
      reviewQualityBonus: 5,
      staffXpMultiplier: 1.25,
    },
  },
];
