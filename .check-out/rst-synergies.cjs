// src/features/usedGear/condition.ts
var isGearAvailable = (item, day) => !item.maintenance && (!item.fault || day !== void 0 && day >= item.fault.readyDay);

// src/types/equipmentSlots.ts
var OUTBOARD_RACK_SLOT_COUNT = 6;
var INVENTORY_SLOT_ID = "inventory";
function generateDefaultRoomSlots(roomId) {
  const slots = [];
  for (let i = 1; i <= OUTBOARD_RACK_SLOT_COUNT; i++) {
    slots.push({
      id: `${roomId}:rack:${i}`,
      roomId,
      slotType: "rack_outboard",
      acceptedCategories: ["outboard", "mixer", "interface"],
      label: `Chassis Slot #${i}`,
      index: i
    });
  }
  for (let i = 1; i <= 2; i++) {
    slots.push({
      id: `${roomId}:mic:${i}`,
      roomId,
      slotType: "mic_locker",
      acceptedCategories: ["microphone"],
      label: `Mic Input #${i}`,
      index: i
    });
  }
  slots.push({
    id: `${roomId}:desk:1`,
    roomId,
    slotType: "workstation_desk",
    acceptedCategories: ["monitor", "interface", "software"],
    label: "Desk Station",
    index: 1
  });
  return slots;
}

// src/utils/gameUtils.ts
var getRoomEquipment = (gameState, roomId, roomSlots) => {
  const placements = gameState.equipmentPlacements;
  if (!placements || placements.length === 0) {
    return gameState.ownedEquipment;
  }
  const roomSlotIds = new Set(roomSlots.map((slot) => slot.id));
  const activeIds = new Set(
    placements.filter((placement) => roomSlotIds.has(placement.slotId)).map((placement) => placement.equipmentId)
  );
  return gameState.ownedEquipment.filter((item) => activeIds.has(item.id));
};
var resolveSessionEquipment = (gameState, roomId) => {
  const owned = (gameState.ownedEquipment || []).filter((item) => isGearAvailable(item, gameState.currentDay));
  const placements = gameState.equipmentPlacements;
  if (!placements || placements.length === 0) {
    return owned;
  }
  const hasAnyRoomSeat = placements.some((p) => p.slotId !== INVENTORY_SLOT_ID);
  if (!hasAnyRoomSeat) {
    return owned;
  }
  const resolvedRoomId = roomId || "studio-a";
  const roomSlots = generateDefaultRoomSlots(resolvedRoomId);
  return getRoomEquipment({ ...gameState, ownedEquipment: owned }, resolvedRoomId, roomSlots);
};

// src/rpg/signalChain.ts
var SIGNAL_SLOTS = ["microphone", "preamp", "dynamics", "recorderInterface"];
var DYNAMICS_IDS = /* @__PURE__ */ new Set(["fairychild_comp", "compressor", "urei_1176_compressor"]);
var PREAMP_IDS = /* @__PURE__ */ new Set(["ssl_console_strip", "api_the_wiser"]);
function slotAccepts(slot, item) {
  switch (slot) {
    case "microphone":
      return item.category === "microphone";
    case "preamp":
      return item.category === "mixer" || PREAMP_IDS.has(item.id);
    case "dynamics":
      return DYNAMICS_IDS.has(item.id);
    case "recorderInterface":
      return item.category === "interface" || item.category === "recorder";
  }
}
function busyGearIds(state, exceptProjectId) {
  const live = [...state.activeProjects ?? [], ...state.activeProject ? [state.activeProject] : []];
  const ids = /* @__PURE__ */ new Set();
  for (const p of live) {
    if (p.id === exceptProjectId || !p.signalChain) continue;
    Object.values(p.signalChain.slots).forEach((id) => id && ids.add(id));
  }
  return ids;
}
function validateChain(chain, state, exceptProjectId) {
  const busy = busyGearIds(state, exceptProjectId);
  const owned = new Map((state.ownedEquipment ?? []).map((e) => [e.id, e]));
  const broken = [];
  const filled = [];
  for (const slot of SIGNAL_SLOTS) {
    const id = chain.slots[slot];
    if (!id) continue;
    const item = owned.get(id);
    if (!item || !slotAccepts(slot, item) || busy.has(id)) broken.push(slot);
    else filled.push(slot);
  }
  return { valid: broken.length === 0 && filled.length > 0, broken, filled };
}
function activeChainSlots(project, state) {
  if (!project.signalChain) return null;
  const v = validateChain(project.signalChain, state, project.id);
  return v.broken.length === 0 ? v.filled : [];
}

// src/data/synergies.ts
var STUDIO_SYNERGIES = [
  // ==========================================
  // ROOM & GEAR SYNERGIES
  // ==========================================
  {
    id: "vocal_chain",
    name: "Vocal Chain",
    category: "room_gear",
    tagline: "Vocal Suite + Pro Microphone + Vocal Producer",
    description: "A tailored vocal booth matched with a precision microphone captures breath and vocal dynamics with stunning clarity.",
    hint: "Isolate the singer in a dedicated booth with your best microphone.",
    icon: "\u{1F399}\uFE0F",
    criteria: {
      roomTypes: ["vocal-suite"],
      requiredEquipmentCategories: ["microphone"],
      anyStaffRoles: ["Producer", "Engineer"]
    },
    bonuses: {
      creativityMultiplier: 1.15,
      reviewQualityBonus: 4,
      staffXpMultiplier: 1.2
    }
  },
  {
    id: "live_band_setup",
    name: "Live Band Setup",
    category: "room_gear",
    tagline: "Live Room + Instruments + Tracking Engineer",
    description: "The natural resonance of the Live Room brings drum kits and guitars together for authentic ensemble energy.",
    hint: "Give your players real room acoustics when tracking live instruments.",
    icon: "\u{1F941}",
    criteria: {
      roomTypes: ["live-room"],
      requiredEquipmentCategories: ["instrument"],
      requiredStaffRoles: ["Engineer"]
    },
    bonuses: {
      technicalMultiplier: 1.15,
      workUnitSpeedMultiplier: 1.1,
      reviewQualityBonus: 3
    }
  },
  {
    id: "mix_translation",
    name: "Mix Translation",
    category: "room_gear",
    tagline: "Mix Suite + Studio Monitors + Lead Engineer",
    description: "Calibrated acoustic control ensures frequencies balance reliably across car stereos, club sound systems, and headphones.",
    hint: "Fine-tune your listening environment with serious monitors in a dedicated mixing space.",
    icon: "\u{1F50A}",
    criteria: {
      roomTypes: ["mix-suite"],
      requiredEquipmentCategories: ["monitor"],
      requiredStaffRoles: ["Engineer"]
    },
    bonuses: {
      technicalMultiplier: 1.2,
      reviewQualityBonus: 5
    }
  },
  {
    id: "analog_front_end",
    name: "Analog Front-End",
    category: "room_gear",
    tagline: "Microphone + Outboard Preamp + Audio Interface",
    description: "Hardware preamps and analog outboard add punch and harmonic depth before digital conversion.",
    hint: "Chain a microphone through outboard processing before hitting your interface.",
    icon: "\u{1F39B}\uFE0F",
    criteria: {
      requiredEquipmentCategories: ["microphone", "outboard", "interface"],
      chainSlots: ["microphone", "preamp", "recorderInterface"]
    },
    bonuses: {
      technicalMultiplier: 1.12,
      reviewQualityBonus: 3
    }
  },
  {
    id: "tape_warmth",
    name: "Tape Saturation",
    category: "room_gear",
    tagline: "Hardware Tape Recorder + Tube Gear",
    description: "Sweet magnetic saturation softens harsh transients and glues the low-end together with vintage authority.",
    hint: "Roll physical magnetic tape to smooth out modern digital edges.",
    icon: "\u{1F4FC}",
    criteria: {
      requiredEquipmentCategories: ["recorder"]
    },
    bonuses: {
      creativityMultiplier: 1.1,
      reviewQualityBonus: 3,
      staffXpMultiplier: 1.15
    }
  },
  {
    id: "console_command",
    name: "Console Command",
    category: "room_gear",
    tagline: "Studio Console Mixer + Outboard EQ/Compressors",
    description: "Tactile physical faders and tactile summing give the mixing engineer supreme expressive workflow speed.",
    hint: "Center your control room around a hardware mixing desk with outboard gear.",
    icon: "\u{1F39A}\uFE0F",
    criteria: {
      requiredEquipmentCategories: ["mixer", "outboard"],
      requiredStaffRoles: ["Engineer"]
    },
    bonuses: {
      technicalMultiplier: 1.15,
      workUnitSpeedMultiplier: 1.15
    }
  },
  {
    id: "digital_workstation",
    name: "Digital Audio Workstation",
    category: "room_gear",
    tagline: "Audio Interface + Production Software",
    description: "A responsive digital pipeline allows rapid non-destructive edits and unlimited track layering.",
    hint: "Connect a high-speed audio interface directly to audio editing software.",
    icon: "\u{1F4BB}",
    criteria: {
      requiredEquipmentCategories: ["interface", "software"]
    },
    bonuses: {
      workUnitSpeedMultiplier: 1.12,
      creativityMultiplier: 1.08
    }
  },
  // ==========================================
  // STAFF & CLIENT SYNERGIES
  // ==========================================
  {
    id: "trusted_pair",
    name: "Trusted Pair",
    category: "staff_client",
    tagline: "Loyal/Advocate Client + Familiar Studio Crew",
    description: "A shorthand language developed over multiple successful sessions lets creative decisions flow effortlessly.",
    hint: "Build lasting loyalty with recurring artists and keep them working with your crew.",
    icon: "\u{1F91D}",
    criteria: {
      clientRelationshipTiers: ["Loyal", "Advocate"],
      minStaffCount: 1
    },
    bonuses: {
      creativityMultiplier: 1.15,
      workUnitSpeedMultiplier: 1.12,
      staffXpMultiplier: 1.25,
      reviewQualityBonus: 3
    }
  },
  {
    id: "producers_touch",
    name: "Producer\u2019s Touch",
    category: "staff_client",
    tagline: "Visionary Producer (Creativity 20+) Driving Pop/R&B",
    description: "An imaginative producer who knows how to coax hit hooks and emotional vulnerability out of performers.",
    hint: "Assign a producer with soaring creative vision to vocal-forward commercial genres.",
    icon: "\u2728",
    criteria: {
      requiredStaffRoles: ["Producer"],
      minStaffCreativity: 20,
      genres: ["Pop", "R&B", "Soul", "Hip Hop"]
    },
    bonuses: {
      creativityMultiplier: 1.2,
      reviewQualityBonus: 4
    }
  },
  {
    id: "audiophile_precision",
    name: "Audiophile Precision",
    category: "staff_client",
    tagline: "Master Engineer (Technical 25+) on High-Fidelity Music",
    description: "Every microphone position and phase relationship is calculated down to the millimeter.",
    hint: "Put a mathematically precise engineer in charge of acoustic and jazz sessions.",
    icon: "\u{1F52C}",
    criteria: {
      requiredStaffRoles: ["Engineer"],
      minStaffTechnical: 25,
      genres: ["Jazz", "Classical", "Acoustic", "Folk"]
    },
    bonuses: {
      technicalMultiplier: 1.2,
      reviewQualityBonus: 5
    }
  },
  {
    id: "hitmakers_circle",
    name: "Hitmaker Team",
    category: "staff_client",
    tagline: "Producer & Engineer Collaboration on Commercial Project",
    description: "Division of labor allows the producer to focus purely on the musical vibe while the engineer nails the sonic balance.",
    hint: "Pair a dedicated producer and a dedicated engineer on the same session.",
    icon: "\u{1F465}",
    criteria: {
      requiredStaffRoles: ["Producer", "Engineer"],
      minStaffCount: 2
    },
    bonuses: {
      creativityMultiplier: 1.12,
      technicalMultiplier: 1.12,
      workUnitSpeedMultiplier: 1.15,
      reviewQualityBonus: 4
    }
  },
  {
    id: "songwriters_spark",
    name: "Songwriter\u2019s Spark",
    category: "staff_client",
    tagline: "In-House Songwriter Collaborating on New Tracks",
    description: "Fresh harmonic ideas, vocal counter-melodies, and lyrical polish lift an ordinary song into a potential classic.",
    hint: "Bring a songwriter into the room during the tracking and production phases.",
    icon: "\u{1F4DD}",
    criteria: {
      requiredStaffRoles: ["Songwriter"]
    },
    bonuses: {
      creativityMultiplier: 1.18,
      reviewQualityBonus: 3,
      staffXpMultiplier: 1.15
    }
  },
  // ==========================================
  // GENRE & SETUP SYNERGIES
  // ==========================================
  {
    id: "organic_groove",
    name: "Organic Groove",
    category: "genre_setup",
    tagline: "Soul/Funk/R&B + Real Instruments + Live Space",
    description: "The pocket is undeniable when acoustic instruments lock together in a treated acoustic environment.",
    hint: "Record Soul or Funk players on real instruments in a spacious room.",
    icon: "\u{1F3B7}",
    criteria: {
      genres: ["Soul", "R&B", "Funk"],
      roomTypes: ["live-room", "project-studio"],
      requiredEquipmentCategories: ["instrument"]
    },
    bonuses: {
      creativityMultiplier: 1.15,
      technicalMultiplier: 1.1,
      reviewQualityBonus: 4
    }
  },
  {
    id: "electronic_lab",
    name: "Electronic Lab",
    category: "genre_setup",
    tagline: "Electronic/Dance + Synthesis Tools + Production Software",
    description: "Cutting-edge synthesis and custom modulation routings create fresh, speaker-shaking sounds.",
    hint: "Pair electronic and dance styles with synthesis gear and audio software.",
    icon: "\u26A1",
    criteria: {
      genres: ["Electronic", "Dance", "Synthpop", "Techno"],
      requiredEquipmentCategories: ["software"]
    },
    bonuses: {
      creativityMultiplier: 1.18,
      workUnitSpeedMultiplier: 1.12
    }
  },
  {
    id: "rock_wall_of_sound",
    name: "Wall of Sound",
    category: "genre_setup",
    tagline: "Rock/Metal + Live Room + Stacks of Instruments",
    description: "Cranked amplifiers and heavy drum shells pushing air inside a reverberant room create sheer sonic power.",
    hint: "Cut loose with loud rock guitars and drums in your largest room.",
    icon: "\u{1F3B8}",
    criteria: {
      genres: ["Rock", "Metal", "Hard Rock", "Punk"],
      roomTypes: ["live-room"],
      requiredEquipmentCategories: ["instrument", "microphone"]
    },
    bonuses: {
      technicalMultiplier: 1.15,
      creativityMultiplier: 1.1,
      reviewQualityBonus: 4
    }
  },
  {
    id: "acoustic_intimacy",
    name: "Acoustic Intimacy",
    category: "genre_setup",
    tagline: "Folk/Acoustic + Vocal Suite + Sensitive Microphone",
    description: "Every finger-pluck on wood and every vocal whisper is captured with zero room noise and total intimacy.",
    hint: "Track acoustic fingerpicking and delicate vocals inside an isolated vocal booth.",
    icon: "\u{1FA95}",
    criteria: {
      genres: ["Acoustic", "Folk", "Country"],
      roomTypes: ["vocal-suite"],
      requiredEquipmentCategories: ["microphone"]
    },
    bonuses: {
      creativityMultiplier: 1.12,
      reviewQualityBonus: 4
    }
  },
  {
    id: "hiphop_boom_bap",
    name: "Beatmaker Forge",
    category: "genre_setup",
    tagline: "Hip Hop/Rap + Samplers/Software + Outboard Punch",
    description: "Hard-hitting 808s and punchy boom-bap kicks that hit hard in the chest and cut clean through the mix.",
    hint: "Produce hip-hop beats with software sampling and outboard compression.",
    icon: "\u{1F3A7}",
    criteria: {
      genres: ["Hip Hop", "Rap", "Trap"],
      requiredEquipmentCategories: ["software", "outboard"]
    },
    bonuses: {
      creativityMultiplier: 1.15,
      technicalMultiplier: 1.1,
      reviewQualityBonus: 3
    }
  },
  {
    id: "indie_lofi_grit",
    name: "Lo-Fi Aesthetic",
    category: "genre_setup",
    tagline: "Indie Rock/Lo-Fi + Vintage Hardware Recorder",
    description: "Embracing imperfections, analog flutter, and characterful tape distortion gives the tracks distinctive charm.",
    hint: "Track indie and lo-fi projects through vintage recording hardware.",
    icon: "\u{1F4FB}",
    criteria: {
      genres: ["Indie Rock", "Lo-Fi", "Alternative"],
      requiredEquipmentCategories: ["recorder"]
    },
    bonuses: {
      creativityMultiplier: 1.2,
      reviewQualityBonus: 3
    }
  },
  {
    id: "pop_vocal_polish",
    name: "Radio-Ready Polish",
    category: "genre_setup",
    tagline: "Pop + Vocal Suite + Digital Editing Software",
    description: "Tight pitch perfection, layered stereo ad-libs, and pristine compression primed for top-40 streaming charts.",
    hint: "Combine pop vocals in a dedicated booth with digital editing tools.",
    icon: "\u{1F48E}",
    criteria: {
      genres: ["Pop"],
      roomTypes: ["vocal-suite"],
      requiredEquipmentCategories: ["software", "microphone"]
    },
    bonuses: {
      technicalMultiplier: 1.15,
      workUnitSpeedMultiplier: 1.15,
      reviewQualityBonus: 4
    }
  },
  {
    id: "jazz_club_ambience",
    name: "Midnight Session",
    category: "genre_setup",
    tagline: "Jazz/Blues + Live Room + Full Microphone Array",
    description: "Capturing dynamic acoustic bleed across instruments yields the natural presence of a live midnight club set.",
    hint: "Track jazz and blues ensembles in a live space with quality microphones.",
    icon: "\u{1F3BA}",
    criteria: {
      genres: ["Jazz", "Blues"],
      roomTypes: ["live-room"],
      requiredEquipmentCategories: ["microphone", "instrument"]
    },
    bonuses: {
      creativityMultiplier: 1.15,
      reviewQualityBonus: 5,
      staffXpMultiplier: 1.25
    }
  }
];

// src/utils/synergyUtils.ts
function getProjectRoomType(project, gameState) {
  const roomId = project.bookingRoomId || "studio-a";
  const room = (gameState.studioRooms || []).find((r) => r.id === roomId);
  return room ? room.type : "project-studio";
}
function evaluateProjectSynergies(project, gameState, catalog = STUDIO_SYNERGIES) {
  if (!project) return [];
  const projectRoomType = getProjectRoomType(project, gameState);
  const assignedStaff = (gameState.hiredStaff || []).filter(
    (s) => s.assignedProjectId === project.id
  );
  const sessionEquipment = resolveSessionEquipment(gameState, project.bookingRoomId);
  const ownedCategories = new Set(sessionEquipment.map((e) => e.category));
  const ownedEquipmentIds = new Set(
    sessionEquipment.flatMap((e) => [e.id, e.templateId ?? e.id])
  );
  const clientRel = project.clientId && gameState.clientRelationships ? gameState.clientRelationships[project.clientId] : void 0;
  const clientTier = clientRel?.tier;
  return catalog.filter((synergy) => {
    const { criteria } = synergy;
    if (criteria.roomTypes && criteria.roomTypes.length > 0) {
      if (!criteria.roomTypes.includes(projectRoomType)) {
        return false;
      }
    }
    const chainSlots = project.signalChain ? activeChainSlots(project, gameState) : null;
    if (criteria.chainSlots && chainSlots) {
      if (!criteria.chainSlots.every((slot) => chainSlots.includes(slot))) return false;
    }
    if (criteria.requiredEquipmentCategories && criteria.requiredEquipmentCategories.length > 0 && !(criteria.chainSlots && chainSlots)) {
      const hasAllCategories = criteria.requiredEquipmentCategories.every(
        (cat) => ownedCategories.has(cat)
      );
      if (!hasAllCategories) return false;
    }
    if (criteria.requiredEquipmentIds && criteria.requiredEquipmentIds.length > 0) {
      const hasAllIds = criteria.requiredEquipmentIds.every((id) => ownedEquipmentIds.has(id));
      if (!hasAllIds) return false;
    }
    if (criteria.minStaffCount !== void 0) {
      if (assignedStaff.length < criteria.minStaffCount) {
        return false;
      }
    }
    if (criteria.anyStaffRoles && criteria.anyStaffRoles.length > 0) {
      const hasAnyRole = assignedStaff.some((s) => criteria.anyStaffRoles.includes(s.role));
      if (!hasAnyRole) return false;
    }
    if (criteria.requiredStaffRoles && criteria.requiredStaffRoles.length > 0) {
      const staffRoles = new Set(assignedStaff.map((s) => s.role));
      const hasAllRoles = criteria.requiredStaffRoles.every((role) => staffRoles.has(role));
      if (!hasAllRoles) return false;
    }
    if (criteria.genres && criteria.genres.length > 0) {
      const projectGenreLower = (project.genre || "").trim().toLowerCase();
      const genreMatches = criteria.genres.some(
        (g) => g.trim().toLowerCase() === projectGenreLower
      );
      if (!genreMatches) return false;
    }
    if (criteria.clientRelationshipTiers && criteria.clientRelationshipTiers.length > 0) {
      if (!clientTier || !criteria.clientRelationshipTiers.includes(clientTier)) {
        return false;
      }
    }
    if (criteria.minStaffCreativity !== void 0) {
      const maxCreativity = assignedStaff.reduce(
        (max, s) => Math.max(max, s.primaryStats?.creativity || 0),
        0
      );
      if (maxCreativity < criteria.minStaffCreativity) return false;
    }
    if (criteria.minStaffTechnical !== void 0) {
      const maxTechnical = assignedStaff.reduce(
        (max, s) => Math.max(max, s.primaryStats?.technical || 0),
        0
      );
      if (maxTechnical < criteria.minStaffTechnical) return false;
    }
    return true;
  });
}
function calculateSynergyBonuses(synergies) {
  let creativityMultiplier = 1;
  let technicalMultiplier = 1;
  let workUnitSpeedMultiplier = 1;
  let reviewQualityBonus = 0;
  let staffXpMultiplier = 1;
  for (const s of synergies) {
    if (s.bonuses.creativityMultiplier) creativityMultiplier *= s.bonuses.creativityMultiplier;
    if (s.bonuses.technicalMultiplier) technicalMultiplier *= s.bonuses.technicalMultiplier;
    if (s.bonuses.workUnitSpeedMultiplier) workUnitSpeedMultiplier *= s.bonuses.workUnitSpeedMultiplier;
    if (s.bonuses.reviewQualityBonus) reviewQualityBonus += s.bonuses.reviewQualityBonus;
    if (s.bonuses.staffXpMultiplier) staffXpMultiplier *= s.bonuses.staffXpMultiplier;
  }
  return {
    // Upper bounds as designed in #45
    creativityMultiplier: Math.min(1.6, Number(creativityMultiplier.toFixed(2))),
    technicalMultiplier: Math.min(1.6, Number(technicalMultiplier.toFixed(2))),
    workUnitSpeedMultiplier: Math.min(1.5, Number(workUnitSpeedMultiplier.toFixed(2))),
    reviewQualityBonus: Math.min(12, Math.round(reviewQualityBonus)),
    staffXpMultiplier: Math.min(1.8, Number(staffXpMultiplier.toFixed(2)))
  };
}
function recordDiscoveredSynergies(currentDiscovered = [], activeSynergies) {
  const discoveredSet = new Set(currentDiscovered);
  const newlyDiscovered = [];
  for (const s of activeSynergies) {
    if (!discoveredSet.has(s.id)) {
      newlyDiscovered.push(s);
      discoveredSet.add(s.id);
    }
  }
  return {
    newlyDiscovered,
    updatedDiscovered: Array.from(discoveredSet)
  };
}

// tests/synergies.check.ts
var passed = 0;
var ok = (cond, msg) => {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};
var mockRooms = [
  {
    id: "studio-a",
    name: "Studio A",
    type: "project-studio",
    unlocked: true,
    level: 1,
    purchaseCost: 0,
    requiredPlayerLevel: 1,
    supportedStageKinds: ["general", "tracking", "production", "mixing", "mastering"],
    qualityBonus: 0,
    speedBonus: 0
  },
  {
    id: "vocal-suite",
    name: "Vocal Suite",
    type: "vocal-suite",
    unlocked: true,
    level: 1,
    purchaseCost: 1800,
    requiredPlayerLevel: 3,
    supportedStageKinds: ["tracking", "production"],
    qualityBonus: 4,
    speedBonus: 2
  },
  {
    id: "live-room",
    name: "Live Room",
    type: "live-room",
    unlocked: true,
    level: 1,
    purchaseCost: 5200,
    requiredPlayerLevel: 5,
    supportedStageKinds: ["tracking", "production"],
    qualityBonus: 6,
    speedBonus: 3
  }
];
function buildMockState(overrides = {}) {
  return {
    studioRooms: mockRooms,
    ownedEquipment: [],
    hiredStaff: [],
    clientRelationships: {},
    discoveredSynergies: [],
    ...overrides
  };
}
function buildMockProject(overrides = {}) {
  return {
    id: "proj-1",
    title: "Test Song",
    genre: "Pop",
    clientType: "Band",
    difficulty: 3,
    durationDaysTotal: 3,
    payoutBase: 500,
    repGainBase: 5,
    requiredSkills: {},
    stages: [],
    matchRating: "Good",
    accumulatedCPoints: 0,
    accumulatedTPoints: 0,
    currentStageIndex: 0,
    completedStages: [],
    workSessionCount: 0,
    focusAllocation: { performance: 33, soundCapture: 33, layering: 34 },
    ...overrides
  };
}
ok(STUDIO_SYNERGIES.length >= 20, `Catalog contains ${STUDIO_SYNERGIES.length} authored synergies (expected >= 20)`);
var pStudioA = buildMockProject({ bookingRoomId: "studio-a" });
var pVocal = buildMockProject({ bookingRoomId: "vocal-suite" });
var stateRooms = buildMockState();
ok(getProjectRoomType(pStudioA, stateRooms) === "project-studio", "Maps studio-a to project-studio");
ok(getProjectRoomType(pVocal, stateRooms) === "vocal-suite", "Maps vocal-suite to vocal-suite");
var emptySynergies = evaluateProjectSynergies(pStudioA, stateRooms);
ok(emptySynergies.length === 0, "No synergies when criteria not met");
var micEquip = {
  id: "u87_mic",
  name: "Condenser Mic",
  category: "microphone",
  price: 1e3,
  description: "Pro mic",
  bonuses: { qualityBonus: 5 },
  icon: "\u{1F3A4}",
  condition: 100
};
var producerStaff = {
  id: "staff-1",
  name: "Maya Producer",
  role: "Producer",
  assignedProjectId: "proj-vocal",
  primaryStats: { creativity: 25, technical: 15, speed: 10 },
  xpInRole: 0,
  levelInRole: 1,
  genreAffinity: null,
  skills: {},
  energy: 100,
  mood: 100,
  salary: 100,
  hireDate: 1,
  status: "Working"
};
var vocalProject = buildMockProject({
  id: "proj-vocal",
  bookingRoomId: "vocal-suite",
  genre: "Pop"
});
var vocalState = buildMockState({
  ownedEquipment: [micEquip],
  hiredStaff: [producerStaff]
});
var vocalActiveSynergies = evaluateProjectSynergies(vocalProject, vocalState);
ok(
  vocalActiveSynergies.some((s) => s.id === "vocal_chain"),
  "Vocal Chain activates with Vocal Suite + Microphone + Producer"
);
ok(
  vocalActiveSynergies.some((s) => s.id === "producers_touch"),
  "Producer\u2019s Touch activates with Pop + Producer with Creativity >= 20"
);
var studioAProject = buildMockProject({
  id: "proj-vocal",
  bookingRoomId: "studio-a",
  genre: "Pop"
});
var studioASynergies = evaluateProjectSynergies(studioAProject, vocalState);
ok(
  !studioASynergies.some((s) => s.id === "vocal_chain"),
  "Vocal Chain does NOT activate in Studio A (requires vocal-suite)"
);
var loyalClientProject = buildMockProject({
  id: "proj-loyal",
  clientId: "client-1"
});
var clientState = buildMockState({
  hiredStaff: [producerStaff],
  clientRelationships: {
    "client-1": {
      clientId: "client-1",
      clientName: "The Legends",
      primaryGenre: "Rock",
      relationshipXp: 500,
      tier: "Loyal",
      sessionsCompleted: 5,
      lastSessionDay: 10,
      bestQualityScore: 85,
      referralCount: 2
    }
  }
});
var loyalStaff = { ...producerStaff, assignedProjectId: "proj-loyal" };
clientState.hiredStaff = [loyalStaff];
var loyalSynergies = evaluateProjectSynergies(loyalClientProject, clientState);
ok(
  loyalSynergies.some((s) => s.id === "trusted_pair"),
  "Trusted Pair activates for Loyal client with assigned staff"
);
var multiSynergies = STUDIO_SYNERGIES.slice(0, 10);
var bonuses = calculateSynergyBonuses(multiSynergies);
ok(bonuses.creativityMultiplier <= 1.6, `Creativity multiplier bounded: ${bonuses.creativityMultiplier} <= 1.6`);
ok(bonuses.technicalMultiplier <= 1.6, `Technical multiplier bounded: ${bonuses.technicalMultiplier} <= 1.6`);
ok(bonuses.workUnitSpeedMultiplier <= 1.5, `Work speed multiplier bounded: ${bonuses.workUnitSpeedMultiplier} <= 1.5`);
ok(bonuses.reviewQualityBonus <= 12, `Quality bonus bounded: ${bonuses.reviewQualityBonus} <= 12`);
ok(bonuses.staffXpMultiplier <= 1.8, `Staff XP multiplier bounded: ${bonuses.staffXpMultiplier} <= 1.8`);
var firstBatch = [STUDIO_SYNERGIES[0], STUDIO_SYNERGIES[1]];
var res1 = recordDiscoveredSynergies([], firstBatch);
ok(res1.newlyDiscovered.length === 2, "Detects 2 brand new discoveries");
ok(res1.updatedDiscovered.length === 2, "Updates discovered list to 2 items");
var res2 = recordDiscoveredSynergies(res1.updatedDiscovered, firstBatch);
ok(res2.newlyDiscovered.length === 0, "No duplicate discoveries on repeated run");
ok(res2.updatedDiscovered.length === 2, "Discovered list unchanged");
var thirdBatch = [STUDIO_SYNERGIES[0], STUDIO_SYNERGIES[2]];
var res3 = recordDiscoveredSynergies(res2.updatedDiscovered, thirdBatch);
ok(res3.newlyDiscovered.length === 1 && res3.newlyDiscovered[0].id === STUDIO_SYNERGIES[2].id, "Detects only the 3rd synergy as new");
ok(res3.updatedDiscovered.length === 3, "Discovered set now contains 3 items");
console.log(`
All ${passed} Studio Synergy checks passed successfully!`);
