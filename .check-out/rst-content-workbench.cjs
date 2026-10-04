var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

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

// src/features/usedGear/condition.ts
var maintenanceCategories = ["interface", "microphone", "mixer", "outboard"];
var isMaintainable = (item) => maintenanceCategories.includes(item.category);
var isGearAvailable = (item, day) => !item.maintenance && (!item.fault || day !== void 0 && day >= item.fault.readyDay);

// src/simulation/seededRandom.ts
var hashSeed = (value) => {
  const input = String(value);
  let hash = 2166136261;
  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};
var createSeededRandom = (seed) => {
  let state = hashSeed(seed);
  return () => {
    state += 1831565813;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
};

// src/narrative/eventDirector.ts
var EFFECT_LIMITS = { money: 5e3, reputation: 25, xp: 500, clientXp: 100, staffXp: 60, gearCondition: 15 };
var EMPTY = { memories: [], history: [], opportunitySeq: 0 };
var getDirector = (state) => state.storylineState?.director ?? EMPTY;
var memoryId = (scope, key, entityId) => `${scope}:${entityId ?? "-"}/${key}`;
var isLive = (m, day) => m.expiresDay === void 0 || m.expiresDay > day;
var hasMemory = (state, scope, key, entityId) => {
  const id2 = memoryId(scope, key, entityId);
  const day = state.currentDay;
  return getDirector(state).memories.some((m) => m.id === id2 && isLive(m, day));
};
var buildFacts = (state) => ({
  day: state.currentDay,
  era: state.currentEra || state.selectedEra || "",
  cityId: state.cityId,
  money: state.money ?? 0,
  reputation: state.reputation ?? 0,
  staffCount: state.hiredStaff?.length ?? 0,
  equipmentCount: state.ownedEquipment?.length ?? 0,
  clients: Object.values(state.clientRelationships ?? {}).sort((a, b) => a.clientId.localeCompare(b.clientId)),
  staff: (state.hiredStaff ?? []).map((m) => ({ id: m.id, name: m.name })),
  gear: (state.ownedEquipment ?? []).map((e) => ({
    id: e.id,
    name: e.name,
    condition: e.condition,
    faulted: Boolean(e.fault && state.currentDay < e.fault.readyDay),
    maintainable: isMaintainable(e)
  })),
  bands: (state.bands ?? []).map((b) => ({
    id: b.id,
    name: b.bandName,
    genre: b.genre,
    fame: b.fame ?? 0,
    notoriety: b.notoriety ?? 0,
    onTour: Boolean(b.tourStatus?.isOnTour),
    isPlayerCreated: Boolean(b.isPlayerCreated),
    releases: b.pastReleases?.length ?? 0,
    daysSinceShow: typeof b.lastShowDay === "number" ? state.currentDay - b.lastShowDay : void 0
  })),
  has: (scope, key, entityId) => hasMemory(state, scope, key, entityId),
  flag: (name) => Boolean(state.storylineState?.storyFlags?.[name])
});
var requiredMemoryHolds = (facts, key, subject) => key.startsWith("studio/") ? facts.has("studio", key.slice(7)) : subject ? facts.has(subject.scope, key, subject.id) : false;
var resolveEligibleEvents = (state, defs) => {
  const facts = buildFacts(state);
  const director = getDirector(state);
  const out = [];
  for (const def of defs) {
    const subject = def.pickSubject ? def.pickSubject(facts) : void 0;
    if (def.pickSubject && !subject) continue;
    if (!def.eligible(facts, subject)) continue;
    const mine = director.history.filter((h) => h.eventId === def.id && (!subject || h.subjectId === subject.id));
    if (def.maxOccurrences !== void 0 && mine.length >= def.maxOccurrences) continue;
    const lastAny = director.history.filter((h) => h.eventId === def.id).slice(-1)[0];
    if (lastAny && state.currentDay - lastAny.day < def.cooldownDays) continue;
    if (def.requiredMemories && !def.requiredMemories.every((k) => requiredMemoryHolds(facts, k, subject))) continue;
    if (def.blockedMemories && def.blockedMemories.some((k) => requiredMemoryHolds(facts, k, subject))) continue;
    let weight = def.baseWeight;
    for (const [k, mult] of Object.entries(def.memoryWeights ?? {})) {
      if (requiredMemoryHolds(facts, k, subject)) weight *= mult;
    }
    out.push({ def, subject, weight });
  }
  return out;
};

// src/narrative/narrativeEventPool.ts
var ERAS = ["analog60s", "digital80s", "internet2000s", "streaming2020s"];
var fromEra = (startIndex) => (facts) => ERAS.indexOf(facts.era) >= startIndex;
var hasBands = (facts) => facts.bands.length > 0;
var playerBand = (facts) => facts.bands.find((b) => b.isPlayerCreated);
var touringBand = (facts) => facts.bands.find((b) => b.onTour);
var bandSubject = (pick2) => (facts) => {
  const band = pick2(facts);
  return band ? { scope: "band", id: band.id, label: band.name } : void 0;
};
var opt = (o) => o;
var hasFinishedJobs = (facts) => facts.clients.some((c) => c.sessionsCompleted >= 1);
var NARRATIVE_EVENTS = [
  // ───────── Band ─────────
  {
    id: "garage_band_walkout",
    family: "band-life",
    baseWeight: 8,
    cooldownDays: 45,
    maxOccurrences: 2,
    pickSubject: bandSubject(playerBand),
    eligible: (facts) => hasBands(facts) && facts.staffCount > 0,
    narrativeKey: "band.walkout",
    kicker: "BAND // THE ROOM WENT QUIET",
    title: "A Walkout",
    context: (s) => `${s?.label ?? "One of your bands"} has had enough. Nobody said when, and nobody is answering the phone.`,
    options: [
      opt({ id: "walkout_mediate", label: "Pay for mediation", flavorText: "A neutral room, everyone present.", effects: [{ kind: "money", amount: -400 }, { kind: "reputation", amount: 1 }], memories: [{ key: "band-tension-eased", ttlDays: 120 }], outcome: "They sit down, say the quiet part, and stay a band \u2014 for now." }),
      opt({ id: "walkout_overtime", label: "Offer more studio hours", flavorText: "Nothing but time.", effects: [{ kind: "staffXp", amount: 25 }, { kind: "money", amount: -120 }], memories: [{ key: "band-overworked", ttlDays: 60 }], outcome: "They take the deal. They are quieter in the room than before." }),
      opt({ id: "walkout_let_go", label: "Let them walk", flavorText: "Some bands end.", effects: [{ kind: "reputation", amount: -4 }], memories: [{ key: "band-member-quit" }], outcome: "The last take belongs to whoever stayed." })
    ],
    delegable: true,
    defaultOptionId: "walkout_mediate"
  },
  {
    id: "viral_cover",
    family: "band-life",
    baseWeight: 10,
    cooldownDays: 60,
    maxOccurrences: 3,
    pickSubject: bandSubject((facts) => facts.bands.find((b) => b.isPlayerCreated && b.releases > 0)),
    eligible: (facts) => facts.bands.some((b) => b.isPlayerCreated && b.releases > 0),
    narrativeKey: "band.viral-cover",
    kicker: "BAND // SOMEONE COVERED YOU",
    title: "An Unsanctioned Cover",
    context: (s) => `Someone recorded ${s?.label ?? "one of your bands"} in a bedroom studio and it is spreading faster than anything you made.`,
    options: [
      opt({ id: "cover_take_credit", label: "Claim the credit publicly", flavorText: "Free reach.", effects: [{ kind: "reputation", amount: 6 }, { kind: "money", amount: 300 }], memories: [{ key: "band-cover-credit" }], outcome: "Your name rides it. So does the resentment." }),
      opt({ id: "cover_charge_fee", label: "Invoice the label", flavorText: "Paperwork as a weapon.", effects: [{ kind: "money", amount: 1100 }, { kind: "reputation", amount: -2 }], memories: [{ key: "band-cover-fee" }], outcome: "The money arrives. So does the story about you." })
    ]
  },
  {
    id: "tour_bus_breakdown",
    family: "band-life",
    baseWeight: 7,
    cooldownDays: 70,
    maxOccurrences: 3,
    pickSubject: bandSubject(touringBand),
    eligible: (facts) => facts.bands.some((b) => b.onTour),
    narrativeKey: "band.bus-breakdown",
    kicker: "BAND // STRANDED",
    title: "The Bus Is Not Moving",
    context: (s) => `${s?.label ?? "Your band"} is somewhere between towns with a broken bus and a promoter who does not appreciate excuses.`,
    options: [
      opt({ id: "bus_emergency_repair", label: "Pay the roadside bill", flavorText: "Get them to the next date.", effects: [{ kind: "money", amount: -700 }, { kind: "reputation", amount: 2 }], memories: [{ key: "tour-rescued" }], outcome: "They play the date. They tell the promoter who paid." }),
      opt({ id: "bus_cancel_dates", label: "Cancel the remaining dates", flavorText: "Cut the losses.", effects: [{ kind: "reputation", amount: -4 }], memories: [{ key: "tour-cancelled" }], outcome: "Three promoters remember. One of them is the one you need." })
    ]
  },
  {
    id: "reunion_rumor",
    family: "band-life",
    baseWeight: 5,
    cooldownDays: 90,
    maxOccurrences: 2,
    // Gated on bead c5b: the breakup slice has to write `band-broken-up` first.
    eligible: (facts) => hasFinishedJobs(facts) && facts.flag("band-broken-up"),
    narrativeKey: "band.reunion-rumor",
    kicker: "BAND // OLD NAMES IN A NEW STORY",
    title: "They Are Saying The Name Again",
    context: (s) => `Someone saw ${s?.label ?? "the old band"} at a show that was not billed as a reunion. The rumour has your studio on it.`,
    options: [
      opt({ id: "rumor_pursue", label: "Book the room and make it real", flavorText: "Law of the Reunion: every breakup is a future payday.", effects: [{ kind: "money", amount: -600 }, { kind: "reputation", amount: 5 }], memories: [{ key: "reunion-pursued" }], outcome: "You pay for a room they may never fill. They fill it." }),
      opt({ id: "rumor_ignore", label: "Let the rumour die", flavorText: "Some things stay finished.", effects: [{ kind: "reputation", amount: 1 }], memories: [{ key: "reunion-declined" }], outcome: "By next month nobody is asking." })
    ]
  },
  // ───────── Lore ─────────
  {
    id: "rival_diss_track",
    family: "lore-weave",
    baseWeight: 8,
    cooldownDays: 45,
    maxOccurrences: 3,
    eligible: fromEra(1),
    narrativeKey: "lore.rival-diss",
    kicker: "RIVAL // ON RECORD",
    title: "Somebody Answered",
    context: () => "A rival studio has put out a record with your name in the credits of the complaint. The trade press noticed before you did.",
    options: [
      opt({ id: "diss_ignore", label: "Say nothing at all", flavorText: "Let them age.", effects: [{ kind: "reputation", amount: -2 }], memories: [{ key: "rival-diss-ignored" }], outcome: "It is still being played on the radio in March." }),
      opt({ id: "diss_answer", label: "Answer on tape", flavorText: "Twelve inches of spine.", effects: [{ kind: "reputation", amount: 6 }, { kind: "money", amount: -250 }], memories: [{ key: "rival-diss-answered" }], outcome: "The trade press now has two records and one story." })
    ]
  },
  {
    id: "console_law_anecdote",
    family: "lore-weave",
    baseWeight: 9,
    cooldownDays: 60,
    maxOccurrences: 4,
    // Any era, but the room needs a history before it can have "the sentence everyone here lives by".
    eligible: (facts) => hasFinishedJobs(facts),
    narrativeKey: "lore.console-law",
    kicker: "CODEX // A LAW, RECALLED",
    title: "Somebody Wrote Your Law Down",
    context: () => "An old engineer drops by with the sentence everyone in this room has been living by, and an invoice-free favour to go with it.",
    options: [
      opt({ id: "law_coffee", label: "Buy the coffee and listen", flavorText: "Nothing beats a story for free.", effects: [{ kind: "xp", amount: 120 }, { kind: "reputation", amount: 1 }], memories: [{ key: "law-recalled" }], outcome: "You leave with a better way to explain the room." }),
      opt({ id: "law_spares", label: "Trade him the spare parts", flavorText: "Barter, not charity.", effects: [{ kind: "gearCondition", amount: 6 }, { kind: "money", amount: -60 }], memories: [{ key: "law-traded-spares" }], outcome: "He leaves with a drawer of valves. The rack runs cleaner." })
    ]
  },
  {
    id: "venue_anniversary",
    family: "lore-weave",
    baseWeight: 7,
    cooldownDays: 75,
    maxOccurrences: 3,
    // Historical weave: the Marquee Cellar era, or the stream festival era.
    eligible: (facts) => (facts.era === "analog60s" || facts.era === "streaming2020s") && hasFinishedJobs(facts),
    narrativeKey: "lore.venue-anniversary",
    kicker: "HISTORY // THE ROOM REMEMBERS",
    title: "An Anniversary Booking",
    context: () => "The venue your era is built on is celebrating, and the only studio they called is yours.",
    options: [
      opt({ id: "venue_take_slot", label: "Take the anniversary slot", flavorText: "The room will be full.", effects: [{ kind: "money", amount: 1500 }, { kind: "reputation", amount: 4 }], memories: [{ key: "venue-anniversary-played" }], outcome: "Everyone who ever queued on that street is in one room." }),
      opt({ id: "venue_send_rookie", label: "Send the newest engineer", flavorText: "Make it someone else\u2019s night.", effects: [{ kind: "staffXp", amount: 45 }, { kind: "money", amount: 500 }], memories: [{ key: "venue-rookie-sent" }], outcome: "They come back talking about it for a year." })
    ]
  },
  {
    id: "award_nomination",
    family: "lore-weave",
    baseWeight: 4,
    cooldownDays: 365,
    maxOccurrences: 2,
    pickSubject: (facts) => {
      const best = [...facts.clients].filter((c) => c.sessionsCompleted >= 3).sort((a, b) => b.relationshipXp - a.relationshipXp || a.clientId.localeCompare(b.clientId))[0];
      return best ? { scope: "client", id: best.clientId, label: best.clientName } : void 0;
    },
    eligible: (facts) => facts.reputation >= 45 && facts.clients.some((c) => c.sessionsCompleted >= 3),
    narrativeKey: "lore.award-nomination",
    kicker: "AWARDS // THE SHORTLIST",
    title: "You Have Been Nominated",
    context: (s) => `Your name is on the shortlist, and ${s?.label ?? "the client you built it with"} is the one who put it there.`,
    options: [
      opt({ id: "award_campaign", label: "Work the campaign", flavorText: "Spend money to be louder.", effects: [{ kind: "money", amount: -500 }, { kind: "reputation", amount: 8 }], memories: [{ key: "award-campaigned" }], outcome: "The trade notices you are playing the game. Then they vote." }),
      opt({ id: "award_thank_client", label: "Thank them instead", flavorText: "Credit where it is due.", effects: [{ kind: "reputation", amount: 3 }, { kind: "clientXp", amount: 30 }], memories: [{ key: "award-thanked-client" }], outcome: "The nomination goes nowhere. The relationship goes everywhere." })
    ],
    delegable: true,
    defaultOptionId: "award_thank_client"
  },
  // ───────── Studio ─────────
  {
    id: "tube_stash_find",
    family: "studio-trouble",
    baseWeight: 8,
    cooldownDays: 40,
    maxOccurrences: 4,
    // Historical weave: the tube era, or the plug-in era.
    eligible: (facts) => facts.equipmentCount > 0 && (facts.era === "analog60s" || facts.era === "streaming2020s"),
    narrativeKey: "studio.tube-stash",
    kicker: "STUDIO // THE BACK OF THE RACK",
    title: "A Stash Nobody Claimed",
    context: () => "Clearing out the back of the rack turned up a box that predates everyone currently working here.",
    options: [
      opt({ id: "stash_refurb", label: "Refurbish and keep it", flavorText: "Valves, cloth, patience.", effects: [{ kind: "gearCondition", amount: 8 }, { kind: "money", amount: -180 }], memories: [{ key: "stash-refurbished" }], outcome: "It goes back into the chain and sounds like itself again." }),
      opt({ id: "stash_sell", label: "Sell it on as found", flavorText: "Someone else\u2019s problem.", effects: [{ kind: "money", amount: 700 }, { kind: "gearCondition", amount: -3 }], memories: [{ key: "stash-sold" }], outcome: "It leaves the building before lunch." })
    ]
  },
  {
    id: "power_surge",
    family: "studio-trouble",
    baseWeight: 9,
    cooldownDays: 50,
    maxOccurrences: 4,
    eligible: (facts) => facts.equipmentCount > 0,
    narrativeKey: "studio.power-surge",
    kicker: "STUDIO // EVERYTHING AT ONCE",
    title: "The Mains Blew",
    context: () => "A surge came through the whole floor at once. Nothing is on fire. Several things are no longer working perfectly.",
    options: [
      opt({ id: "surge_engineer", label: "Call an engineer", flavorText: "Slow, proper, expensive.", effects: [{ kind: "money", amount: -550 }, { kind: "gearCondition", amount: 7 }], memories: [{ key: "surge-serviced" }], outcome: "Everything comes back better isolated than it left." }),
      opt({ id: "surge_ride_it", label: "Ride it out", flavorText: "It usually stops.", effects: [{ kind: "money", amount: 90 }, { kind: "gearCondition", amount: -9 }], memories: [{ key: "surge-ignored", ttlDays: 90 }], outcome: "The desk hums at a slightly different note now." })
    ],
    delegable: true,
    defaultOptionId: "surge_engineer"
  },
  {
    id: "intern_prodigy",
    family: "studio-trouble",
    baseWeight: 8,
    cooldownDays: 60,
    maxOccurrences: 3,
    eligible: (facts) => facts.staffCount > 0,
    narrativeKey: "studio.intern-prodigy",
    kicker: "STUDIO // SOMEONE IS LEARNING FAST",
    title: "The One You Least Expected",
    context: () => "The newest person on the roster has quietly stopped needing the session explained twice.",
    options: [
      opt({ id: "prodigy_own_session", label: "Give them their own session", flavorText: "Trust, early.", effects: [{ kind: "staffXp", amount: 50 }, { kind: "money", amount: 350 }], memories: [{ key: "prodigy-trusted" }], outcome: "They run the session. It holds." }),
      opt({ id: "prodigy_shadow", label: "Keep them shadowing", flavorText: "Nothing goes wrong.", effects: [{ kind: "staffXp", amount: 20 }, { kind: "reputation", amount: 1 }], memories: [{ key: "prodigy-shadowing" }], outcome: "They keep watching. They keep getting better." })
    ],
    delegable: true,
    defaultOptionId: "prodigy_shadow"
  },
  {
    id: "sync_brief_lands",
    family: "studio-trouble",
    baseWeight: 11,
    cooldownDays: 30,
    maxOccurrences: 4,
    // Historical weave: the download era (iTunes / social feeds).
    eligible: (facts) => facts.reputation >= 30 && facts.era === "internet2000s",
    narrativeKey: "studio.sync-brief",
    kicker: "STUDIO // A SYNC, UNSOLICITED",
    title: "A Brief With Your Name On It",
    context: () => "A picture and an advert want a needle drop, they heard your room, and they want it this week.",
    options: [
      opt({ id: "sync_take_it", label: "Take the session", flavorText: "Deadline money.", effects: [{ kind: "money", amount: 900 }, { kind: "reputation", amount: 3 }], memories: [{ key: "sync-landed" }], outcome: "It airs on schedule. Everyone asks who did the needle drop." }),
      opt({ id: "sync_decline", label: "Decline politely", flavorText: "The calendar is honest.", effects: [{ kind: "reputation", amount: 2 }, { kind: "money", amount: 0 }], memories: [{ key: "sync-declined" }], outcome: "They find someone else, and remember that you were busy." })
    ]
  }
];

// src/narrative/cityEvents.ts
var opt2 = (o) => o;
var CITY_EVENTS = [
  {
    id: "la_label_dropin",
    family: "city-local",
    baseWeight: 9,
    cooldownDays: 60,
    maxOccurrences: 3,
    eligible: (f) => f.cityId === "los-angeles" && f.reputation >= 15,
    narrativeKey: "city.la.label-dropin",
    kicker: "LOS ANGELES // A&R IN THE LOBBY",
    title: "An A&R Walks In Off Sunset",
    context: () => "A label scout was in the building for another room and heard your monitors through the wall. They have twenty minutes and a business card.",
    options: [
      opt2({ id: "la_play_reel", label: "Play them your best reel", flavorText: "Twenty minutes, no second take.", effects: [{ kind: "reputation", amount: 5 }, { kind: "money", amount: 200 }], outcome: "They leave a finder fee on the desk and a promise to call." }),
      opt2({ id: "la_hold_slot", label: "Keep the booking, offer a rain check", flavorText: "Clients first.", effects: [{ kind: "clientXp", amount: 12 }], outcome: "Your client notices. The scout writes down the studio name anyway." })
    ],
    delegable: true,
    defaultOptionId: "la_hold_slot"
  },
  {
    id: "nashville_songwriter_round",
    family: "city-local",
    baseWeight: 9,
    cooldownDays: 55,
    maxOccurrences: 3,
    eligible: (f) => f.cityId === "nashville",
    narrativeKey: "city.nashville.round",
    kicker: "NASHVILLE // WRITERS IN THE ROUND",
    title: "A Songwriters\u2019 Round Needs a Room",
    context: () => "Four writers want to demo a whole night of songs on a handshake and a tip jar. Whatever you charge, the songs will be good.",
    options: [
      opt2({ id: "nash_host", label: "Host the round at cost", flavorText: "Coffee, a few mics, no invoice.", effects: [{ kind: "money", amount: -120 }, { kind: "xp", amount: 40 }, { kind: "reputation", amount: 4 }], outcome: "By midnight there are three songs worth finishing and one you will hum for a week." }),
      opt2({ id: "nash_book_paid", label: "Book it as a paid half-day", flavorText: "Fair rate, fair songs.", effects: [{ kind: "money", amount: 260 }], outcome: "They pay on the spot and promise to bring friends." })
    ],
    delegable: true,
    defaultOptionId: "nash_book_paid"
  },
  {
    id: "london_pirate_radio",
    family: "city-local",
    baseWeight: 9,
    cooldownDays: 55,
    maxOccurrences: 3,
    eligible: (f) => f.cityId === "london",
    narrativeKey: "city.london.pirate-radio",
    kicker: "LONDON // THE AERIAL ON THE ROOF",
    title: "Pirate Radio Wants an Exclusive",
    context: () => "A pirate station on the twelfth floor next door wants to play your latest session before anyone else has heard it. Quietly, of course.",
    options: [
      opt2({ id: "lon_give_it", label: "Hand over the rough mix", flavorText: "Buzz is currency.", effects: [{ kind: "reputation", amount: 6 }, { kind: "clientXp", amount: -6 }], outcome: "The phones light up. Your client is flattered and a little annoyed." }),
      opt2({ id: "lon_ask_client", label: "Ask the client first", flavorText: "Permission, then volume.", effects: [{ kind: "clientXp", amount: 10 }, { kind: "reputation", amount: 2 }], outcome: "They say yes with a grin. A smaller splash, a bigger thank-you." })
    ],
    delegable: true,
    defaultOptionId: "lon_ask_client"
  },
  {
    id: "berlin_curfew_night",
    family: "city-local",
    baseWeight: 9,
    cooldownDays: 55,
    maxOccurrences: 3,
    eligible: (f) => f.cityId === "berlin",
    narrativeKey: "city.berlin.curfew",
    kicker: "BERLIN // THE NIGHT THAT DID NOT END",
    title: "The Club Next Door Never Closed",
    context: () => "The bass from the club next door has been leaking through your live room since midnight. A promoter pokes his head in: want to record the afterparty?",
    options: [
      opt2({ id: "ber_record_it", label: "Roll tape on the afterparty", flavorText: "Raw, loud, unrepeatable.", effects: [{ kind: "money", amount: 220 }, { kind: "gearCondition", amount: -4 }, { kind: "xp", amount: 30 }], outcome: "You get a hundred minutes of something nobody will ever be able to recreate." }),
      opt2({ id: "ber_soundproof", label: "Insist on a quiet night", flavorText: "Pay the promoter in good faith.", effects: [{ kind: "money", amount: -80 }, { kind: "clientXp", amount: 8 }], outcome: "The promoter respects it. The bass drops two floors down." })
    ],
    delegable: true,
    defaultOptionId: "ber_soundproof"
  },
  {
    id: "tokyo_city_pop_revival",
    family: "city-local",
    baseWeight: 9,
    cooldownDays: 55,
    maxOccurrences: 3,
    eligible: (f) => f.cityId === "tokyo",
    narrativeKey: "city.tokyo.city-pop",
    kicker: "TOKYO // THE VINYL BAR DOWNSTAIRS",
    title: "A Reissue Label Wants Your Room",
    context: () => "The owner of the vinyl bar downstairs is reissuing a forgotten record and wants it remastered through your gear. The tapes are in a shoebox.",
    options: [
      opt2({ id: "tok_remaster", label: "Take the remaster job", flavorText: "Patience, steady hands, no clipping.", effects: [{ kind: "money", amount: 240 }, { kind: "xp", amount: 35 }], outcome: "The tapes sing. The owner bows lower than you expected." }),
      opt2({ id: "tok_trade", label: "Trade it for a rare fader set", flavorText: "Gear for goodwill.", effects: [{ kind: "gearCondition", amount: 8 }, { kind: "reputation", amount: 3 }], outcome: "Your console feels newer than it has in a decade." })
    ],
    delegable: true,
    defaultOptionId: "tok_remaster"
  },
  {
    id: "rio_carnival_rehearsal",
    family: "city-local",
    baseWeight: 9,
    cooldownDays: 55,
    maxOccurrences: 3,
    eligible: (f) => f.cityId === "rio",
    narrativeKey: "city.rio.carnival",
    kicker: "RIO // A HUNDRED DRUMS AT THE DOOR",
    title: "A Samba School Brings the Whole Bateria",
    context: () => "A samba school wants to record its carnival rehearsal in your room. It does not fit. They intend to make it fit.",
    options: [
      opt2({ id: "rio_full_band", label: "Open every door and record it all", flavorText: "Mic the street, mic the stairs.", effects: [{ kind: "reputation", amount: 6 }, { kind: "money", amount: 120 }, { kind: "gearCondition", amount: -3 }], outcome: "It is the loudest and best thing you have ever put to tape." }),
      opt2({ id: "rio_small_group", label: "Take the percussion section only", flavorText: "Quality over crowd.", effects: [{ kind: "money", amount: 180 }, { kind: "xp", amount: 25 }], outcome: "Clean, tight, danceable, and the drums still shake the glass." })
    ],
    delegable: true,
    defaultOptionId: "rio_small_group"
  },
  {
    id: "detroit_house_band_call",
    family: "city-local",
    baseWeight: 9,
    cooldownDays: 55,
    maxOccurrences: 3,
    eligible: (f) => f.cityId === "detroit",
    narrativeKey: "city.detroit.house-band",
    kicker: "DETROIT // THE RHYTHM SECTION IS READY",
    title: "A House Band Has One Free Hour",
    context: () => "A rhythm section arrives between label dates with one hour, a finished arrangement and the tightest pocket in town.",
    options: [
      opt2({ id: "det_roll_tape", label: "Roll tape immediately", flavorText: "No rehearsal needed.", effects: [{ kind: "money", amount: -100 }, { kind: "xp", amount: 40 }, { kind: "reputation", amount: 4 }], outcome: "The first take locks so hard the second feels unnecessary." }),
      opt2({ id: "det_book_later", label: "Book a proper paid date", flavorText: "Give the session room to breathe.", effects: [{ kind: "money", amount: 220 }, { kind: "clientXp", amount: 6 }], outcome: "They leave a deposit and the arrangement on your piano." })
    ],
    delegable: true,
    defaultOptionId: "det_book_later"
  },
  {
    id: "lagos_generator_session",
    family: "city-local",
    baseWeight: 9,
    cooldownDays: 55,
    maxOccurrences: 3,
    eligible: (f) => f.cityId === "lagos",
    narrativeKey: "city.lagos.generator",
    kicker: "LAGOS // THE LIGHTS GO OUT",
    title: "The Generator Joins the Rhythm Section",
    context: () => "Power drops halfway through a live take. The backup generator catches, humming almost exactly in key, and the band never stops.",
    options: [
      opt2({ id: "lag_keep_rolling", label: "Keep rolling on backup power", flavorText: "The groove survived; follow it.", effects: [{ kind: "xp", amount: 40 }, { kind: "reputation", amount: 4 }, { kind: "gearCondition", amount: -3 }], outcome: "The generator hum becomes part of the breakdown." }),
      opt2({ id: "lag_reset", label: "Reset and protect the equipment", flavorText: "Clean power, fresh take.", effects: [{ kind: "money", amount: -100 }, { kind: "gearCondition", amount: 4 }], outcome: "The next take is safer, cleaner and nearly as alive." })
    ],
    delegable: true,
    defaultOptionId: "lag_reset"
  }
];
var local = (id2, city, key, kicker, title, context, a, b, defaultOptionId, gate = () => true) => ({
  id: id2,
  family: "city-local",
  baseWeight: 8,
  cooldownDays: 65,
  maxOccurrences: 2,
  eligible: (f) => f.cityId === city && gate(f),
  narrativeKey: `city.${key}`,
  kicker,
  title,
  context: () => context,
  options: [opt2(a), opt2(b)],
  delegable: true,
  defaultOptionId
});
var MORE_CITY_EVENTS = [
  local(
    "la_session_player_dropin",
    "los-angeles",
    "la.session-player",
    "LOS ANGELES // A FAMOUS HAND",
    "A Session Legend Needs a Room for an Hour",
    "A session guitarist who has played on half the records in your collection has an hour free and a cancelled booking across town.",
    { id: "la_sp_pay", label: "Pay their rate and record something", flavorText: "One take, one hour.", effects: [{ kind: "money", amount: -180 }, { kind: "xp", amount: 45 }, { kind: "reputation", amount: 3 }], outcome: "You get a take nobody else in town can play." },
    { id: "la_sp_trade", label: "Trade the hour for a favour", flavorText: "They owe you one.", effects: [{ kind: "clientXp", amount: 12 }, { kind: "reputation", amount: 2 }], outcome: "They shake your hand. The favour is noted in a very small book." },
    "la_sp_trade"
  ),
  local(
    "la_heatwave_blackout",
    "los-angeles",
    "la.heatwave",
    "LOS ANGELES // 41 DEGREES",
    "The Heatwave Takes the Power",
    "A brownout rolls across the valley. The air conditioning dies, the racks start to cook and a nervous client sits in the live room.",
    { id: "la_hw_generator", label: "Rent a generator", flavorText: "Loud, but safe.", effects: [{ kind: "money", amount: -260 }, { kind: "gearCondition", amount: 4 }], outcome: "Everything survives. The client buys lunch." },
    { id: "la_hw_shut", label: "Shut down and wait", flavorText: "Cool the room, rebook the day.", effects: [{ kind: "clientXp", amount: -6 }, { kind: "gearCondition", amount: 2 }], outcome: "Nothing breaks. Nothing gets recorded either." },
    "la_hw_generator"
  ),
  local(
    "nashville_demo_wall",
    "nashville",
    "nashville.demo-wall",
    "NASHVILLE // THE DEMO WALL",
    "A Wall of Cassettes Falls Off the Shelf",
    "Someone leans on the shelf and a decade of unlabelled demos hits the floor. One of the tapes has a song you recognise from the radio.",
    { id: "nash_dw_digitise", label: "Digitise the whole wall", flavorText: "A weekend of transfers.", effects: [{ kind: "xp", amount: 55 }, { kind: "reputation", amount: 3 }], outcome: "You find three songs worth recording again." },
    { id: "nash_dw_sell", label: "Sell the radio one to a publisher", flavorText: "Quick money.", effects: [{ kind: "money", amount: 300 }, { kind: "reputation", amount: -2 }], outcome: "The publisher is delighted. The writer is not." },
    "nash_dw_digitise"
  ),
  local(
    "nashville_open_mic",
    "nashville",
    "nashville.open-mic",
    "NASHVILLE // WEDNESDAY NIGHT",
    "The Open Mic Down the Street Wants a Mixer",
    "The bar around the corner has a famous open mic and a broken board. The owner needs a mixer by seven.",
    { id: "nash_om_volunteer", label: "Volunteer for the night", flavorText: "Fix the board, run the room.", effects: [{ kind: "reputation", amount: 4 }, { kind: "xp", amount: 30 }], outcome: "You meet three writers and one future client." },
    { id: "nash_om_invoice", label: "Send an invoice", flavorText: "Fair work, fair pay.", effects: [{ kind: "money", amount: 140 }], outcome: "The owner pays on the nail and offers you a free pint." },
    "nash_om_invoice"
  ),
  local(
    "london_tube_strike",
    "london",
    "london.tube-strike",
    "LONDON // NO TRAINS",
    "The Tube Strike Strands the Band",
    "Half your session is stuck on a platform in zone four. The other half is already in the live room, drinking tea.",
    { id: "lon_ts_rework", label: "Re-plan the day around who is here", flavorText: "Start with the rhythm section.", effects: [{ kind: "xp", amount: 35 }, { kind: "clientXp", amount: 6 }], outcome: "The day gets stranger and the record gets better." },
    { id: "lon_ts_cabs", label: "Send cabs for the rest", flavorText: "Pay for punctuality.", effects: [{ kind: "money", amount: -140 }, { kind: "clientXp", amount: 10 }], outcome: "Everyone arrives annoyed. The take that follows is excellent." },
    "lon_ts_rework"
  ),
  local(
    "london_music_press",
    "london",
    "london.press",
    "LONDON // NEXT WEEK'S COVER",
    "A Writer from the Music Press Wants a Studio Visit",
    "A weekly music paper wants five hundred words on your room. They also want a quote about your favourite microphone.",
    { id: "lon_mp_yes", label: "Give them the full tour", flavorText: "Honest, charming, slightly too long.", effects: [{ kind: "reputation", amount: 5 }], outcome: "The piece runs under a headline you did not choose." },
    { id: "lon_mp_polite", label: "Politely decline", flavorText: "Let the records talk.", effects: [{ kind: "clientXp", amount: 6 }], outcome: "Your clients like your discretion." },
    "lon_mp_yes"
  ),
  local(
    "berlin_techno_loan",
    "berlin",
    "berlin.loan",
    "BERLIN // A CABLE LOOM",
    "The Club Wants to Borrow Your Speakers",
    "A club three streets over has blown a stack and the headliner lands at midnight. They offer to rent your monitors for a night.",
    { id: "ber_tl_rent", label: "Rent them out", flavorText: "Make them a deal.", effects: [{ kind: "money", amount: 240 }, { kind: "gearCondition", amount: -5 }], outcome: "They come back hot, bass-dusted and perfectly fine." },
    { id: "ber_tl_decline", label: "Say no and keep the room quiet", flavorText: "Your clients come first.", effects: [{ kind: "clientXp", amount: 8 }], outcome: "The promoter respects that and finds a loan elsewhere." },
    "ber_tl_decline"
  ),
  local(
    "berlin_modular_swap",
    "berlin",
    "berlin.modular",
    "BERLIN // THE RACK IN THE CORNER",
    "A Modular Wizard Offers a Swap",
    "A local synth builder with silver rings and no sleep offers a patched-up voice module in exchange for a day of studio time.",
    { id: "ber_ms_swap", label: "Take the swap", flavorText: "Time for sound.", effects: [{ kind: "gearCondition", amount: 6 }, { kind: "xp", amount: 40 }], outcome: "Your studio has a new voice and a few new bruises on the patch bay." },
    { id: "ber_ms_cash", label: "Rent them the room for cash", flavorText: "Keep it simple.", effects: [{ kind: "money", amount: 210 }], outcome: "They bring their own cables and leave them behind." },
    "ber_ms_cash"
  ),
  local(
    "tokyo_karaoke_night",
    "tokyo",
    "tokyo.karaoke",
    "TOKYO // PRIVATE ROOM 7",
    "A Label Throws a Karaoke Night",
    "A label is looking for a backing-track engineer and has booked you a seat at a very long table.",
    { id: "tok_kn_sing", label: "Sing one song", flavorText: "Courage, not talent.", effects: [{ kind: "reputation", amount: 4 }, { kind: "clientXp", amount: 8 }], outcome: "You are terrible. They love you for it." },
    { id: "tok_kn_pitch", label: "Pitch the label instead", flavorText: "Be the professional in the room.", effects: [{ kind: "money", amount: 220 }], outcome: "You leave with a contract and a very strange haircut photo." },
    "tok_kn_pitch"
  ),
  local(
    "tokyo_earthquake_drill",
    "tokyo",
    "tokyo.drill",
    "TOKYO // 3.2 ON THE SCALE",
    "A Small Quake Shakes the Racks",
    "The racks sway and a rack-mount compressor slides a few millimetres off its ears. Nothing falls, but the whole room is thinking about it.",
    { id: "tok_ed_secure", label: "Strap down the racks", flavorText: "Prepare properly.", effects: [{ kind: "money", amount: -160 }, { kind: "gearCondition", amount: 5 }], outcome: "The racks are quiet and a lot more confident." },
    { id: "tok_ed_ignore", label: "Carry on recording", flavorText: "It was only a small one.", effects: [{ kind: "gearCondition", amount: -5 }, { kind: "xp", amount: 20 }], outcome: "You get a great take and a cracked hinge." },
    "tok_ed_secure"
  ),
  local(
    "rio_street_party",
    "rio",
    "rio.street-party",
    "RIO // A BLOCK PARTY AT THE DOOR",
    "The Street Party Wants Your Console",
    "A block party has set up speakers in the street. They would very much like to wheel your mixing desk out to the pavement.",
    { id: "rio_sp_lend", label: "Wheel it out", flavorText: "Mics in the street, desk on the kerb.", effects: [{ kind: "reputation", amount: 6 }, { kind: "gearCondition", amount: -6 }], outcome: "You record the best crowd you have ever heard. The desk smells of caipirinha." },
    { id: "rio_sp_mics", label: "Send two mics and an engineer", flavorText: "Compromise, with cables.", effects: [{ kind: "reputation", amount: 3 }, { kind: "money", amount: 120 }], outcome: "You get a hundred friends and a clean multitrack." },
    "rio_sp_mics"
  ),
  local(
    "rio_rainy_season",
    "rio",
    "rio.rain",
    "RIO // THE RAINY SEASON",
    "The Roof Starts Singing",
    "The tropical rain finds a hole in the live room roof and starts a rhythm of its own on the snare drum.",
    { id: "rio_rs_repair", label: "Patch the roof", flavorText: "Buckets first, tiles after.", effects: [{ kind: "money", amount: -200 }, { kind: "gearCondition", amount: 3 }], outcome: "Dry, tidy and a little sad." },
    { id: "rio_rs_record", label: "Record the rain as an instrument", flavorText: "Roll tape, close the window.", effects: [{ kind: "xp", amount: 50 }, { kind: "gearCondition", amount: -4 }], outcome: "It ends up on three records and a ringtone." },
    "rio_rs_repair"
  ),
  local(
    "detroit_ballroom_echo",
    "detroit",
    "detroit.ballroom",
    "DETROIT // THE BALLROOM FLOOR",
    "A Ballroom Offers You the Room After Midnight",
    "The old dance hall is empty after midnight, and its wooden floor turns every snare hit into a second drummer.",
    { id: "det_be_record", label: "Move the drums there tonight", flavorText: "One van, many stairs.", effects: [{ kind: "xp", amount: 45 }, { kind: "reputation", amount: 4 }, { kind: "money", amount: -100 }], outcome: "The room gives the chorus a backbeat you could not program." },
    { id: "det_be_sample", label: "Capture the room ambience", flavorText: "Bring the room back to the studio.", effects: [{ kind: "xp", amount: 25 }, { kind: "money", amount: 100 }], outcome: "The room recording is tidy. The caretaker says the real room sounds better." },
    "det_be_sample"
  ),
  local(
    "detroit_drum_machine",
    "detroit",
    "detroit.drum-machine",
    "DETROIT // A MACHINE FROM A BASEMENT",
    "A DJ Brings a Modified Drum Machine",
    "A local DJ has rewired an old rhythm box until the kick rattles the patch bay. They need a clean two-track master by dawn.",
    { id: "det_dm_master", label: "Master it loud and clean", flavorText: "Precision at club volume.", effects: [{ kind: "money", amount: 220 }, { kind: "xp", amount: 35 }], outcome: "At sunrise the loop still sounds like the future." },
    { id: "det_dm_trade", label: "Trade the fee for the modification notes", flavorText: "Learn the circuit.", effects: [{ kind: "gearCondition", amount: 6 }, { kind: "xp", amount: 25 }], outcome: "Your technician reads the notes twice and reaches for a soldering iron." },
    "det_dm_master"
  ),
  local(
    "lagos_horn_section",
    "lagos",
    "lagos.horns",
    "LAGOS // ELEVEN HORNS IN RECEPTION",
    "A Touring Horn Section Needs a Demo",
    "Eleven players arrive between shows with three arrangements and exactly enough cash for one hour.",
    { id: "lag_hs_full", label: "Mic the whole section live", flavorText: "Clear the room and count them in.", effects: [{ kind: "reputation", amount: 5 }, { kind: "xp", amount: 35 }, { kind: "gearCondition", amount: -2 }], outcome: "The air in the room moves before the meters do." },
    { id: "lag_hs_split", label: "Record them in smaller groups", flavorText: "Control the spill.", effects: [{ kind: "money", amount: 180 }, { kind: "xp", amount: 20 }], outcome: "Every note is clean, though the players miss shouting across the room." },
    "lag_hs_split"
  ),
  local(
    "lagos_radio_jingle",
    "lagos",
    "lagos.radio",
    "LAGOS // LIVE FROM THE RADIO HOUSE",
    "A Radio Host Needs a Theme by Evening",
    "A drive-time host wants a new theme before tonight\u2019s show: memorable in five seconds, unmistakably local in ten.",
    { id: "lag_rj_band", label: "Bring in a live rhythm section", flavorText: "Make five seconds feel enormous.", effects: [{ kind: "money", amount: -80 }, { kind: "reputation", amount: 5 }, { kind: "xp", amount: 25 }], outcome: "By the second broadcast, callers sing it before the host does." },
    { id: "lag_rj_keys", label: "Build it quickly on keys", flavorText: "Fast, bright, delivered.", effects: [{ kind: "money", amount: 220 }], outcome: "The station pays before airtime and asks for three more." },
    "lag_rj_keys"
  )
];

// src/narrative/citySagas.ts
var fx = (rows) => rows.map(([kind, amount]) => ({ kind, amount }));
var SAGAS = [
  { code: "la", city: "los-angeles", place: "LOS ANGELES", name: "The Reel in the Wall", beats: [
    ["A Tape Behind the Plaster", "Rewiring the control room, an electrician finds a reel of tape sealed in the wall with a date from decades ago.", ["Play it before anyone else hears", "You thread it up alone, after midnight.", [["xp", 40], ["reputation", 1]], "Faint, warm, unmistakable. Someone very good once played in this room."], ["Hand it to a restoration lab", "Do it properly and pay for it.", [["money", -120], ["reputation", 2]], "The lab calls it a find and promises a clean transfer."]],
    ["Whose Voice Is on the Reel?", "The transfer is back. A singer, a band that never released a thing, and a name scrawled on the box.", ["Track down the family", "Letters, phone calls, an afternoon in an archive.", [["xp", 30], ["reputation", 3]], "A granddaughter cries on the phone, then asks you to come to dinner."], ["Keep it quiet and keep the tape", "Some things are better left in the vault.", [["money", 150]], "The tape goes in a drawer. The drawer feels heavier."]],
    ["The Reel Gets Its Release", "Word has spread. A reissue label wants the tape and the story of the room that kept it.", ["Release it with the family", "Split the credit and the proceeds fairly.", [["reputation", 8], ["money", 200]], "The reissue sells out. Your name is in the liner notes, near theirs."], ["License it outright", "Take the cheque and thank them kindly.", [["money", 450], ["reputation", 2]], "It pays well. The family never quite writes back."]]
  ] },
  { code: "nashville", city: "nashville", place: "NASHVILLE", name: "The Unfinished Song", beats: [
    ["A Chorus Without Verses", "A weathered songwriter leaves a cassette on your desk: one perfect chorus, no verses, no name.", ["Write the verses yourself", "Sit with it until it talks.", [["xp", 40], ["reputation", 1]], "By morning you have three verses. None feel like yours."], ["Ask around town", "Somebody on Music Row will know.", [["reputation", 2], ["xp", 15]], "Four different people recognise it. All four give a different name."]],
    ["The Songwriter Comes Back", "They are in the lobby, older than the tape suggested, and slightly offended you changed a word.", ["Let them rewrite it in the room", "Give them the good mic and the afternoon.", [["xp", 30], ["reputation", 3]], "The new lyric is plainer and much, much better."], ["Defend your version", "It works. Why break it?", [["reputation", 1], ["money", 120]], "They leave unconvinced, but the demo gets airplay."]],
    ["A Cover from the Top of the Charts", "A chart-topping act wants to cut the song. The songwriter has one condition: your room.", ["Record it all in your room", "Take the session and the spotlight.", [["reputation", 8], ["money", 250]], "It goes to number one. The songwriter sends a handwritten card."], ["Step back and take a credit in the notes", "Smaller fee, bigger friend.", [["money", 80], ["reputation", 4], ["xp", 40]], "The credit is a single line. People in town read it twice."]]
  ] },
  { code: "london", city: "london", place: "LONDON", name: "Radio Silence", beats: [
    ["A Pirate Signal Reaches the Roof", "Your aerial picks up a pirate station playing nothing but demos, and the DJ keeps naming your street.", ["Climb up and trace the signal", "Cold fingers, good view.", [["xp", 35], ["reputation", 1]], "A cheap transmitter, a stolen car battery, and a note addressed to the studio."], ["Send them a mixtape", "If they like unknown music, send them some.", [["reputation", 2], ["money", -60]], "It is on air within the hour."]],
    ["The DJ Asks to Meet", "The voice behind the station turns up with a thermos, two crates of tapes and a problem with the regulator.", ["Hide the crates until the heat passes", "A favour, off the books.", [["reputation", 3], ["xp", 20]], "The crates rest under your tape shelf. Nobody knocks."], ["Offer a legal broadcast slot", "Take it above ground.", [["money", -100], ["reputation", 4]], "They hate the paperwork and love the signal."]],
    ["A Legal Licence and a Live Session", "The station goes legal. The first broadcast is a live session in your room.", ["Make it a weekly show", "Regular airtime, regular hustle.", [["reputation", 8], ["xp", 50]], "By week three the queue of bands reaches the stairs."], ["Do it once, do it brilliantly", "One hour, no repeats.", [["reputation", 5], ["money", 300]], "It trends for a day and is quoted for a year."]]
  ] },
  { code: "berlin", city: "berlin", place: "BERLIN", name: "The Bunker Tape", beats: [
    ["A Key to a Concrete Door", "A promoter hands you a key to a cold bunker and says the acoustics are unreal.", ["Bring a field recorder and go", "No schedule, no safety net.", [["xp", 40], ["reputation", 1]], "The reverb tail lasts eleven seconds. You clap and listen to it ring."], ["Send an assistant and stay in the studio", "Someone has to mind the desk.", [["xp", 15], ["money", 60]], "The recording comes back muddy but full of promise."]],
    ["The Bunker Wants a Residency", "The promoter wants a monthly night. The crowd shows up before the sound system does.", ["Rig the room with your own gear", "Heavy, expensive and worth it.", [["money", -180], ["reputation", 4], ["gearCondition", -4]], "The first night, you hear the room before the music starts."], ["Rent them a system and stay home", "Cleaner books, smaller story.", [["money", 150], ["reputation", 1]], "Cheques arrive on time. The night still sounds wonderful."]],
    ["The Bunker Album", "A live album from the bunker is being cut. Press want a cover and a story.", ["Own the story", "Put the studio name on the front.", [["reputation", 8], ["xp", 30]], "The review calls it the sound of a concrete cathedral."], ["Let the venue take the credit", "Quiet pride, solid fee.", [["money", 350], ["reputation", 3]], "You are in the credits. You are not on the cover."]]
  ] },
  { code: "tokyo", city: "tokyo", place: "TOKYO", name: "The Last Kissaten", beats: [
    ["A Jazz Cafe Is Closing", "A tiny cafe with a legendary record collection is closing at the end of the month. The owner says you can choose three.", ["Pick three and record the owner talking", "Preserve the voice as well as the vinyl.", [["xp", 40], ["reputation", 2]], "Ninety minutes of stories about every record on the wall."], ["Buy the collection outright", "Too much to lose to a stranger.", [["money", -200], ["reputation", 3]], "The shelves arrive in a van. The whole room smells of old paper."]],
    ["One Last Night of Music", "The owner asks for one live night with the regulars, and wants it recorded properly.", ["Record the night in full", "Dedicated mics and a full multitrack.", [["xp", 35], ["reputation", 4]], "Forty people, one piano, no applause until the last chord fades."], ["Keep it small and hands-off", "Let the night be a night.", [["reputation", 2], ["money", 100]], "You sit in the back with the owner and drink the last cup."]],
    ["The Records Get a Second Home", "A label wants to build a listening room around the collection. They want your studio involved.", ["Co-curate the room", "Share the shelves with the public.", [["reputation", 8], ["xp", 40]], "The new listening room opens with a queue around the block."], ["Sell the story, keep the vinyl", "A generous fee, a private shelf.", [["money", 400], ["reputation", 3]], "The story sells beautifully. The vinyl stays yours."]]
  ] },
  { code: "rio", city: "rio", place: "RIO", name: "The Carnival Rehearsal Tape", beats: [
    ["A Tape from Last Year", "A samba teacher brings a rehearsal tape from last year, ruined by a leaking roof, and asks if anything can be saved.", ["Bake the tape and try", "Eight hours in a low oven, fingers crossed.", [["xp", 40], ["reputation", 1]], "It plays for ninety seconds before it dies. They are the best ninety seconds you have heard."], ["Rebuild it from memory", "Re-record with the same players.", [["money", -90], ["reputation", 3]], "They remember every beat, and add a few new ones."]],
    ["The Drummers Want a Proper Album", "The whole school wants the rebuilt song on an album, in time for carnival.", ["Rush to finish before carnival", "Overtime and espresso.", [["money", -120], ["reputation", 4], ["xp", 30]], "You finish at dawn, the same hour the parade begins to form."], ["Take the season, release after", "Done right, if late.", [["reputation", 3], ["money", 100]], "They are impatient but proud, and the final mix is stunning."]],
    ["The Parade Plays Your Record", "The song opens the parade. Half the city hears it from a truck, a window and a bar.", ["Join the parade with the mixing desk", "Obviously.", [["reputation", 8], ["xp", 40], ["gearCondition", -3]], "You push a flight case through the crowd and no one is annoyed."], ["Watch from the roof with a thermos", "The best seat in the city.", [["reputation", 5], ["money", 250]], "You hear your own mix a block away and it holds up."]]
  ] },
  { code: "detroit", city: "detroit", place: "DETROIT", name: "The Arrangement Book", beats: [
    ["A Bandleader Leaves a Notebook", "A retired bandleader lends you a book of unfinished arrangements. One page has every part except the bass line.", ["Invite the old rhythm section", "Hear what the page cannot tell you.", [["money", -100], ["xp", 40]], "They argue about two bars, then play them perfectly."], ["Make a careful demo first", "Leave space for the missing part.", [["xp", 25], ["reputation", 1]], "The bandleader listens twice and taps the empty bars."]],
    ["The Missing Bass Player Calls", "The player who wrote the missing part has heard your demo. They want an afternoon in the room and their name on the record.", ["Give them the room and the credit", "Let the arrangement find its owner.", [["money", -120], ["reputation", 4]], "The line changes the whole song. You write their name in ink."], ["Pay for a written arrangement", "Clear credit, clear terms.", [["money", -60], ["xp", 30]], "The signed page arrives with three useful performance notes."]],
    ["A Neighbourhood Record Night", "The finished recording is ready. The local hall offers a listening night with the players in the front row.", ["Host it with the whole band", "A record belongs to the people in it.", [["reputation", 8], ["xp", 40]], "The room applauds the bass player before the final note."], ["Release it through a small label", "Keep the credits and share the proceeds.", [["money", 250], ["reputation", 4]], "The notebook returns with a new date and a thank-you on the cover."]]
  ] },
  { code: "lagos", city: "lagos", place: "LAGOS", name: "The Hotel Bandstand", beats: [
    ["A Hotel Band Needs a Quiet Morning", "A resident band asks to use the studio before their evening set. Their new song keeps growing longer on the bandstand.", ["Record the whole arrangement live", "Follow the band through every turn.", [["money", -90], ["xp", 40]], "The last chorus is twice as long and somehow feels shorter."], ["Start with a short rehearsal recording", "Find the shape before booking the session.", [["xp", 25], ["reputation", 1]], "The band circles two passages worth keeping."]],
    ["The Singer Brings Another Verse", "The rehearsal recording has travelled through the hotel staff. A singer arrives with a new verse and asks the band to try it.", ["Give everyone an afternoon together", "Let the new voice change the arrangement.", [["money", -120], ["reputation", 4]], "The horns answer the singer without a word from you."], ["Record a guide and send it to the band", "Keep the session small and clear.", [["xp", 30], ["reputation", 2]], "The players return a guide with a stronger ending."]],
    ["The Bandstand Hears the Master", "The hotel offers its bandstand for the first public play of the finished master. Everyone who helped wants to be there.", ["Make it a live release night", "Credit the room and every player.", [["reputation", 8], ["xp", 40]], "The audience sings the new verse before the band does."], ["Deliver copies with the session credits", "Let the record travel at its own pace.", [["money", 250], ["reputation", 4]], "The first copy goes behind the bar, with every name on the sleeve."]]
  ] }
];
var CITY_SAGA_EVENTS = SAGAS.flatMap(
  (s) => s.beats.map((beat, i) => {
    const [title, context, a, b] = beat;
    const n2 = i + 1;
    const key = `saga.${s.code}.${n2}`;
    const optionFor = (letter, o) => ({
      id: `saga_${s.code}_${n2}_${letter}`,
      label: o[0],
      flavorText: o[1],
      effects: fx(o[2]),
      memories: [{ scope: "studio", key, ttlDays: 400 }],
      outcome: o[3]
    });
    return {
      id: `saga_${s.code}_${n2}`,
      family: `city-saga-${s.code}`,
      baseWeight: 14,
      cooldownDays: 20 + i * 4,
      maxOccurrences: 1,
      eligible: (f) => f.cityId === s.city && (n2 > 1 || f.reputation >= 12),
      requiredMemories: n2 > 1 ? [`studio/saga.${s.code}.${n2 - 1}`] : void 0,
      narrativeKey: `city.${key}`,
      kicker: `${s.place} // ${s.name.toUpperCase()} (${n2}/3)`,
      title,
      context: () => context,
      options: [optionFor("a", a), optionFor("b", b)],
      delegable: true,
      defaultOptionId: `saga_${s.code}_${n2}_b`
    };
  })
);
var SAGA_CITY_BY_EVENT = Object.fromEntries(
  SAGAS.flatMap((s) => [1, 2, 3].map((n2) => [`saga_${s.code}_${n2}`, s.city]))
);

// src/narrative/recurringClient.ts
var fx2 = (rows) => rows.map(([kind, amount]) => ({ kind, amount }));
var TTL = 5e3;
var ERA_ORDER = ["analog60s", "digital80s", "internet2000s", "streaming2020s"];
var eraIdx = (era) => Math.max(0, ERA_ORDER.indexOf(era));
var BEATS = [
  {
    era: "analog60s",
    minRep: 15,
    title: "The Girl with the Borrowed Guitar",
    context: "A teenager called Wren Calloway turns up with a borrowed guitar and two songs she wrote on the bus. She says she is moving on to another city next month and wants something to take with her.",
    a: ["Give her a free afternoon", "Tape rolling, no invoice.", [["xp", 35], ["reputation", 2]], "Two songs in four takes. She leaves with an acetate and writes your address on her hand.", "wren.generous"],
    b: ["Book her at the cheap rate", "Fair is fair.", [["money", 60], ["xp", 15]], "She pays in coins and thanks you twice.", "wren.fair"]
  },
  {
    era: "digital80s",
    minRep: 0,
    title: "Wren Calloway, Now With Synthesisers",
    context: "Years on and a different city on the postmark, Wren walks in with a drum machine under one arm. She says she has been recording in rooms all over, and wants to make something that sounds nothing like where she started.",
    a: ["Let her take over the room for a week", "She wants to experiment, so let her.", [["xp", 40], ["reputation", 3], ["gearCondition", -3]], "Seven days, one record, a lot of fingerprints on the desk. It sounds like the future.", "wren.experiment"],
    b: ["Keep it to a tight three-day session", "Focused and billable.", [["money", 200], ["reputation", 2]], "Three days, four songs, a neat invoice and a happy artist.", "wren.focused"]
  },
  {
    era: "internet2000s",
    minRep: 0,
    title: "Wren Puts the Record Online",
    context: "Wren has self-released and the downloads are climbing. A label has noticed and wants the masters. She calls from yet another time zone to ask what you think.",
    a: ["Tell her to stay independent", "Keep the masters, keep the story.", [["reputation", 5], ["xp", 30]], "She turns the label down and credits your room in the thread. It trends for a weekend.", "wren.independent"],
    b: ["Help her negotiate a fair deal", "Read the contract with her.", [["money", 250], ["reputation", 3]], "You mark up the contract together. The final version is the first one she is proud to sign.", "wren.signed"]
  },
  {
    era: "streaming2020s",
    minRep: 0,
    title: "Wren Calloway, Last Chorus",
    context: "Wren is a veteran now, with a catalogue and a quiet tour bus. Her farewell album is the last thing on her list, and she wants to cut it in the room where the first acetate was made.",
    a: ["Close the studio for her and tell the story", "Let the room be part of the record.", [["reputation", 10], ["xp", 50], ["money", 150]], "The album opens with the sound of your door closing. The reviews quote it.", "wren.farewell"],
    b: ["Record it quietly and keep the credit small", "A small credit, a long friendship.", [["money", 400], ["reputation", 4]], "It is the best session of her career. Your name is in the notes, in small print, and she sends a card.", "wren.quiet"]
  }
];
var RECURRING_CLIENT_EVENTS = BEATS.map((beat, i) => {
  const n2 = i + 1;
  const key = `wren.${n2}`;
  const optionFor = (letter, o) => ({
    id: `wren_${n2}_${letter}`,
    label: o[0],
    flavorText: o[1],
    effects: fx2(o[2]),
    memories: [{ scope: "studio", key, ttlDays: TTL }, { scope: "studio", key: o[4], ttlDays: TTL }],
    outcome: o[3]
  });
  return {
    id: `wren_${n2}`,
    family: "recurring-client-wren",
    baseWeight: 14,
    cooldownDays: 30,
    maxOccurrences: 1,
    // Entry from any era: a beat opens in its own era or later, once the earlier beat is done or its era has passed.
    // A later beat's memory blocks the earlier ones, so the order only ever moves forward.
    eligible: (f) => eraIdx(f.era) >= eraIdx(beat.era) && f.reputation >= beat.minRep && (n2 === 1 || f.has("studio", `wren.${n2 - 1}`) || eraIdx(f.era) > eraIdx(BEATS[i - 1].era)),
    blockedMemories: BEATS.slice(i + 1).map((_, j) => `studio/wren.${n2 + 1 + j}`),
    narrativeKey: `client.wren.${n2}`,
    kicker: `WREN CALLOWAY // THE CLIENT WHO FOLLOWED (${n2}/4)`,
    title: beat.title,
    context: () => beat.context,
    options: [optionFor("a", beat.a), optionFor("b", beat.b)],
    delegable: true,
    defaultOptionId: `wren_${n2}_b`
  };
});

// src/narrative/gearUpkeep.ts
var TROUBLE_CONDITION = 40;
var troubled = (facts) => {
  const g = [...facts.gear].filter((x) => x.maintainable && ((x.condition ?? 100) < TROUBLE_CONDITION || x.faulted)).sort((a, b) => (a.condition ?? 100) - (b.condition ?? 100) || a.id.localeCompare(b.id))[0];
  return g ? { scope: "gear", id: g.id, label: g.name } : void 0;
};
var GEAR_UPKEEP_EVENTS = [
  {
    id: "gear_trouble",
    family: "gear-upkeep",
    baseWeight: 12,
    cooldownDays: 15,
    maxOccurrences: 1,
    pickSubject: troubled,
    eligible: () => true,
    narrativeKey: "gear.trouble",
    kicker: "THE RACK // SOMETHING IS OFF",
    title: "A Piece of Gear Is Sulking",
    context: (s) => `${s?.label ?? "A piece of gear"} has started crackling and cutting out. Nothing is broken for good, but it will keep getting in the way of sessions until someone deals with it.`,
    options: [
      { id: "gear_trouble_a", label: "Pay for a proper service now", flavorText: "Parts and a careful afternoon.", effects: [{ kind: "money", amount: -60 }, { kind: "gearCondition", amount: 12 }], memories: [{ key: "serviced-early", ttlDays: 120 }], outcome: "The contacts are cleaned and the pots reseated. It sounds like new." },
      { id: "gear_trouble_b", label: "Work around it for now", flavorText: "Plenty of life left, if you are careful.", effects: [], memories: [{ key: "run-rough", ttlDays: 60 }], outcome: "You tape a note to the front and book around it." }
    ],
    delegable: true,
    defaultOptionId: "gear_trouble_b"
  },
  {
    id: "gear_trouble_payoff",
    family: "gear-upkeep",
    baseWeight: 12,
    cooldownDays: 10,
    maxOccurrences: 1,
    requiredMemories: ["serviced-early"],
    pickSubject: (facts) => {
      const g = facts.gear.find((x) => facts.has("gear", "serviced-early", x.id));
      return g ? { scope: "gear", id: g.id, label: g.name } : void 0;
    },
    eligible: () => true,
    narrativeKey: "gear.payoff",
    kicker: "THE RACK // WORTH THE AFTERNOON",
    title: "It Has Never Sounded Better",
    context: (s) => `A visiting engineer plugs into ${s?.label ?? "the serviced piece"} and asks what you did to it. The service paid off, and word gets around.`,
    options: [
      { id: "gear_payoff_a", label: "Share the trick", flavorText: "Good gear talk is good business.", effects: [{ kind: "reputation", amount: 2 }, { kind: "xp", amount: 25 }], memories: [], outcome: "They write the settings on their hand and tell two friends." },
      { id: "gear_payoff_b", label: "Keep it to yourself", flavorText: "A studio secret.", effects: [{ kind: "xp", amount: 15 }], memories: [], outcome: "You smile and say it is all in the cables." }
    ],
    delegable: true,
    defaultOptionId: "gear_payoff_b"
  },
  {
    id: "gear_trouble_fallout",
    family: "gear-upkeep",
    baseWeight: 12,
    cooldownDays: 10,
    maxOccurrences: 1,
    requiredMemories: ["run-rough"],
    pickSubject: (facts) => {
      const g = facts.gear.find((x) => facts.has("gear", "run-rough", x.id) && x.maintainable && ((x.condition ?? 100) < TROUBLE_CONDITION + 10 || x.faulted));
      return g ? { scope: "gear", id: g.id, label: g.name } : void 0;
    },
    eligible: () => true,
    narrativeKey: "gear.fallout",
    kicker: "THE RACK // A CLIENT NOTICED",
    title: "The Crackle Made the Tape",
    context: (s) => `A client heard ${s?.label ?? "the tired piece"} cutting out on a playback and asked politely about it. It is still fixable, and they are not angry, just curious.`,
    options: [
      { id: "gear_fallout_a", label: "Own up and service it now", flavorText: "Be honest about it.", effects: [{ kind: "money", amount: -60 }, { kind: "gearCondition", amount: 12 }, { kind: "reputation", amount: 1 }], memories: [{ key: "serviced-early", ttlDays: 120 }], outcome: "They appreciate the honesty. It is fixed by the weekend." },
      { id: "gear_fallout_b", label: "Laugh it off", flavorText: "Every room has its character.", effects: [], memories: [], outcome: "They laugh too. You put a service on the list." }
    ],
    delegable: true,
    defaultOptionId: "gear_fallout_b"
  }
];

// src/narrative/directorEvents.ts
var HEALTHY = ["Friendly", "Regular", "Loyal", "Advocate"];
var ESTABLISHED = ["Regular", "Loyal", "Advocate"];
var clientWhere = (pred) => (facts) => {
  const c = [...facts.clients].filter(pred).sort((a, b) => b.sessionsCompleted - a.sessionsCompleted || a.clientId.localeCompare(b.clientId))[0];
  return c ? { scope: "client", id: c.clientId, label: c.clientName } : void 0;
};
var clientOf = (facts, s) => facts.clients.find((c) => c.clientId === s?.id);
var opt3 = (o) => o;
var DIRECTOR_EVENTS = [
  ...NARRATIVE_EVENTS,
  ...CITY_EVENTS,
  ...MORE_CITY_EVENTS,
  ...CITY_SAGA_EVENTS,
  ...RECURRING_CLIENT_EVENTS,
  ...GEAR_UPKEEP_EVENTS,
  // ───────── Recurring-client chain ─────────
  {
    id: "client_rush_request",
    family: "client-rush",
    baseWeight: 10,
    cooldownDays: 20,
    maxOccurrences: 1,
    pickSubject: clientWhere((c) => c.sessionsCompleted >= 2 && c.tier !== "Unknown"),
    eligible: () => true,
    narrativeKey: "client.rush.request",
    kicker: "CLIENT // A FAVOUR ASKED",
    title: "Can You Turn It Around Faster?",
    context: (s) => `${s?.label ?? "A regular client"} is back with a deadline that has moved up. They are asking whether you can deliver in half the usual time.`,
    options: [
      opt3({ id: "rush_accept", label: "Accept the rush job", flavorText: "Long nights, rush fee on the invoice.", effects: [{ kind: "money", amount: 600 }, { kind: "clientXp", amount: 5 }], memories: [{ key: "rush-accepted", ttlDays: 90 }], outcome: "You shake on it. The diary gets tight." }),
      opt3({ id: "rush_reduce", label: "Offer a smaller scope", flavorText: "Fewer tracks, done properly.", effects: [{ kind: "money", amount: 250 }, { kind: "clientXp", amount: 8 }], memories: [{ key: "rush-accepted", ttlDays: 90 }], outcome: "They grumble, then agree that less, done well, beats more, done badly." }),
      opt3({ id: "rush_decline", label: "Decline politely", flavorText: "Quality needs its time.", effects: [], memories: [{ key: "rush-declined", ttlDays: 90 }], outcome: "They understand. Mostly." })
    ],
    delegable: true,
    defaultOptionId: "rush_decline"
  },
  {
    id: "client_rush_payoff",
    family: "client-rush",
    baseWeight: 10,
    cooldownDays: 10,
    maxOccurrences: 1,
    requiredMemories: ["rush-accepted"],
    blockedMemories: ["rush-success", "rush-poor"],
    pickSubject: clientWhere((c) => c.sessionsCompleted >= 3 && c.bestQualityScore >= 75),
    eligible: () => true,
    narrativeKey: "client.rush.payoff",
    kicker: "CLIENT // IT PAID OFF",
    title: "The Rush Job Landed",
    context: (s) => `${s?.label ?? "Your client"} just heard how the rushed release went. They are delighted, and they want you to know it.`,
    options: [
      opt3({ id: "payoff_thanks", label: "Accept the thank-you", flavorText: "A handshake and a bottle.", effects: [{ kind: "clientXp", amount: 25 }, { kind: "reputation", amount: 4 }], memories: [{ key: "rush-success" }], outcome: "They tell people the studio delivers when it counts." }),
      opt3({ id: "payoff_discount", label: "Offer a discount on their next booking", flavorText: "Loyalty, repaid.", effects: [{ kind: "money", amount: -150 }, { kind: "clientXp", amount: 40 }], memories: [{ key: "rush-success" }], outcome: "They book the next session before leaving the room." })
    ],
    delegable: true,
    defaultOptionId: "payoff_thanks"
  },
  {
    id: "client_rush_fallout",
    family: "client-rush",
    baseWeight: 10,
    cooldownDays: 10,
    maxOccurrences: 1,
    requiredMemories: ["rush-accepted"],
    blockedMemories: ["rush-success", "rush-poor"],
    pickSubject: clientWhere((c) => c.sessionsCompleted >= 3 && c.bestQualityScore < 75),
    eligible: () => true,
    narrativeKey: "client.rush.fallout",
    kicker: "CLIENT // CORNERS WERE CUT",
    title: "The Rush Job Stumbled",
    context: (s) => `The rushed release for ${s?.label ?? "your client"} shows its seams. They are not angry, but they are being careful with you now.`,
    options: [
      opt3({ id: "fallout_rework", label: "Rework it on the house", flavorText: "Own the mistake.", effects: [{ kind: "money", amount: -300 }, { kind: "clientXp", amount: 10 }], memories: [{ key: "rush-poor", ttlDays: 40 }], outcome: "The reworked version is better. The trust comes back slowly." }),
      opt3({ id: "fallout_explain", label: "Explain the constraints and move on", flavorText: "You did warn them.", effects: [{ kind: "clientXp", amount: -10 }], memories: [{ key: "rush-poor", ttlDays: 40 }], outcome: "Fair, and cold. They book elsewhere for a while." })
    ],
    delegable: true,
    defaultOptionId: "fallout_rework"
  },
  {
    id: "client_rush_respected",
    family: "client-rush",
    baseWeight: 6,
    cooldownDays: 10,
    maxOccurrences: 1,
    requiredMemories: ["rush-declined"],
    blockedMemories: ["rush-respected"],
    pickSubject: clientWhere((c) => HEALTHY.includes(c.tier) && c.sessionsCompleted >= 3),
    eligible: () => true,
    narrativeKey: "client.rush.respected",
    kicker: "CLIENT // NO HARD FEELINGS",
    title: "They Understood",
    context: (s) => `${s?.label ?? "Your client"} did not hold the declined rush against you. They would like to make sure it stays that way.`,
    options: [
      opt3({ id: "respected_note", label: "Send a thank-you note", flavorText: "Small and sincere.", effects: [{ kind: "clientXp", amount: 10 }], memories: [{ key: "rush-respected" }], outcome: "The note goes up on their studio wall." }),
      opt3({ id: "respected_slot", label: "Offer a standing priority slot", flavorText: "So the next rush is easier.", effects: [{ kind: "money", amount: -100 }, { kind: "clientXp", amount: 20 }], memories: [{ key: "rush-respected" }], outcome: "You have a regular, and they know it." })
    ],
    delegable: true,
    defaultOptionId: "respected_note"
  },
  {
    id: "client_referral_ask",
    family: "client-referral",
    baseWeight: 12,
    cooldownDays: 30,
    maxOccurrences: 1,
    requiredMemories: ["rush-success"],
    blockedMemories: ["referral-made"],
    pickSubject: clientWhere((c) => ESTABLISHED.includes(c.tier) && c.sessionsCompleted >= 4),
    eligible: (facts, s) => (clientOf(facts, s)?.sessionsCompleted ?? 0) >= 4,
    narrativeKey: "client.referral.ask",
    kicker: "CLIENT // A NAME PASSED ON",
    title: "A Friend of a Friend",
    context: (s) => `${s?.label ?? "Your client"} has been singing your praises. They can introduce you to someone bigger, or put their name behind the studio in public.`,
    options: [
      opt3({ id: "referral_take", label: "Take the introduction", flavorText: "New faces, new money.", effects: [{ kind: "referral" }, { kind: "reputation", amount: 5 }], memories: [{ key: "referral-made" }], outcome: "A new name appears in the booking diary." }),
      opt3({ id: "referral_credit", label: "Ask for a public credit", flavorText: "Put the studio\u2019s name on the sleeve.", effects: [{ kind: "reputation", amount: 10 }, { kind: "xp", amount: 50 }], memories: [{ key: "referral-made" }, { scope: "studio", key: "prestige-credit" }], outcome: "The credit line is small, and it opens doors." })
    ]
  },
  // ───────── Studio, crew and gear ─────────
  {
    id: "studio_label_scout",
    family: "studio-industry",
    baseWeight: 8,
    cooldownDays: 60,
    maxOccurrences: 1,
    eligible: (f) => f.reputation >= 40,
    narrativeKey: "studio.scout.visit",
    kicker: "INDUSTRY // A QUIET VISIT",
    title: "A Label Scout Stops By",
    context: () => "A scout from a larger label is in the building \u201Cjust for the coffee\u201D. They are listening to everything.",
    options: [
      opt3({ id: "scout_tour", label: "Give them the full tour", flavorText: "Let the room make its case.", effects: [{ kind: "reputation", amount: 8 }], memories: [{ scope: "studio", key: "scout-toured" }], outcome: "The scout leaves with a notebook full of names, and yours is on the first page." }),
      opt3({ id: "scout_private", label: "Keep the sessions private", flavorText: "Your clients come first.", effects: [{ kind: "money", amount: 300 }], memories: [{ scope: "studio", key: "scout-declined" }], outcome: "Word gets round that the studio protects its artists." })
    ],
    delegable: true,
    defaultOptionId: "scout_private"
  },
  {
    id: "studio_press_inquiry",
    family: "studio-industry",
    baseWeight: 6,
    cooldownDays: 45,
    maxOccurrences: 2,
    memoryWeights: { "studio/prestige-credit": 2 },
    eligible: (f) => f.reputation >= 25,
    narrativeKey: "studio.press.inquiry",
    kicker: "INDUSTRY // A PHONE CALL",
    title: "The Press Wants a Word",
    context: () => "A trade journalist wants ten minutes about how the studio works. It could be flattering. It could be long.",
    options: [
      opt3({ id: "press_talk", label: "Give a proper interview", flavorText: "Open the doors, put the kettle on.", effects: [{ kind: "reputation", amount: 6 }, { kind: "money", amount: -100 }], outcome: "The piece runs with a good photograph of the console." }),
      opt3({ id: "press_statement", label: "Send a short statement", flavorText: "Ten words, on the record.", effects: [{ kind: "reputation", amount: 2 }], outcome: "A brief mention, and a brief silence." })
    ],
    delegable: true,
    defaultOptionId: "press_statement"
  },
  {
    id: "staff_artist_conflict",
    family: "crew",
    baseWeight: 7,
    cooldownDays: 30,
    maxOccurrences: 1,
    pickSubject: (f) => {
      const m = f.staff[0];
      return m ? { scope: "staff", id: m.id, label: m.name } : void 0;
    },
    eligible: (f) => f.staffCount >= 1 && f.day >= 15,
    narrativeKey: "staff.artist.conflict",
    kicker: "CREW // TWO STRONG OPINIONS",
    title: "An Argument in the Live Room",
    context: (s) => `${s?.label ?? "One of your crew"} and a visiting artist disagree loudly about a take. Both think they are right.`,
    options: [
      opt3({ id: "conflict_back_crew", label: "Back your crew member", flavorText: "You hired them for a reason.", effects: [{ kind: "reputation", amount: 2 }], memories: [{ key: "backed-by-boss" }], outcome: "The crew member stands a little taller. The artist sulks through lunch." }),
      opt3({ id: "conflict_mediate", label: "Step in and mediate", flavorText: "A cup of tea, a fresh take.", effects: [{ kind: "money", amount: -80 }, { kind: "reputation", amount: 3 }], memories: [{ key: "mediated-conflict" }], outcome: "Both walk out with a better take than either planned." })
    ]
  },
  {
    id: "gear_overheated",
    family: "gear",
    baseWeight: 7,
    cooldownDays: 30,
    maxOccurrences: 1,
    pickSubject: (f) => {
      const g = f.gear[0];
      return g ? { scope: "gear", id: g.id, label: g.name } : void 0;
    },
    eligible: (f) => f.equipmentCount >= 2 && f.day >= 20,
    narrativeKey: "gear.overheated",
    kicker: "GEAR // A BURNING SMELL",
    title: "It Ran Hot",
    context: (s) => `The ${s?.label ?? "desk"} has been running all week and something smells warm. It survived, but only just.`,
    options: [
      opt3({ id: "gear_service", label: "Pay for a proper service", flavorText: "Do it right.", effects: [{ kind: "money", amount: -350 }, { kind: "reputation", amount: 2 }], memories: [{ key: "serviced-after-heat" }], outcome: "The technician finds and fixes two other problems." }),
      opt3({ id: "gear_fan", label: "Put a fan on it and carry on", flavorText: "It has got this far.", effects: [{ kind: "money", amount: 60 }], memories: [{ key: "ran-hot-ignored", ttlDays: 60 }], outcome: "It works. For now." })
    ]
  }
];

// src/rpg/projectBrief.ts
var SERVICE_LABELS = {
  tracking: "Tracking",
  "vocal-production": "Vocal production",
  mix: "Mix",
  master: "Master",
  "full-production": "Full production"
};
var PRODUCTION_APPROACHES = [
  {
    id: "clean-commercial",
    label: "Clean & commercial",
    blurb: "Tight, radio-ready. Leans on capture and polish.",
    direction: "polished",
    focus: { performance: 25, soundCapture: 45, layering: 30 }
  },
  {
    id: "intimate-raw",
    label: "Intimate & raw",
    blurb: "Close, honest takes. Leans on the performance.",
    direction: "intimate",
    focus: { performance: 50, soundCapture: 30, layering: 20 }
  },
  {
    id: "experimental-layers",
    label: "Experimental layers",
    blurb: "Stacked textures. Rewards creative crews, punishes safe ones.",
    direction: "experimental",
    focus: { performance: 20, soundCapture: 25, layering: 55 }
  }
];
var SERVICE_ROOM = {
  tracking: "live-room",
  "vocal-production": "vocal-suite",
  mix: "mix-suite",
  master: "mix-suite",
  "full-production": "project-studio"
};
var SERVICE_ROLE = {
  tracking: "Engineer",
  "vocal-production": "Producer",
  mix: "Engineer",
  master: "Engineer",
  "full-production": "Producer"
};
var ROOM_NAMES = {
  "project-studio": "Project Studio",
  "vocal-suite": "Vocal Suite",
  "live-room": "Live Room",
  "mix-suite": "Mix Suite"
};
var GENRE_DIRECTIONS = {
  Rock: ["raw", "live", "heavy"],
  Pop: ["polished", "intimate", "experimental"],
  Electronic: ["polished", "experimental", "heavy"],
  "Hip-hop": ["heavy", "polished", "raw"],
  Acoustic: ["intimate", "raw", "live"],
  Jazz: ["live", "intimate", "raw"],
  Folk: ["intimate", "raw", "live"],
  Soul: ["intimate", "polished", "live"]
};
var DEFAULT_DIRECTIONS = ["raw", "polished", "intimate"];
var SERVICES = ["tracking", "vocal-production", "mix", "master", "full-production"];
var PRIORITIES = ["quality", "speed", "budget"];
var pick = (items, rng) => items[Math.floor(rng() * items.length) % items.length];
function deriveBrief(project) {
  const rng = createSeededRandom(`brief:${project.id}:${project.genre}`);
  return {
    serviceType: pick(SERVICES, rng),
    direction: pick(GENRE_DIRECTIONS[project.genre] ?? DEFAULT_DIRECTIONS, rng),
    priority: pick(PRIORITIES, rng),
    genre: project.genre
  };
}
var avg = (xs) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
var has = (c, ...cats) => cats.some((k) => c.gearCategories.has(k));
var FIT_RULES = [
  {
    id: "room-match",
    apply: (c) => {
      const want = SERVICE_ROOM[c.brief.serviceType];
      if (c.roomType === want && want !== "project-studio") return { delta: 14, reason: `${ROOM_NAMES[want]} matches the brief` };
      if (c.roomType === "project-studio") return { delta: 4, reason: "Project Studio handles most briefs" };
      return { delta: -10, reason: `This brief wants a ${ROOM_NAMES[want]}, not the ${c.roomName}` };
    }
  },
  {
    id: "intimate-vocal-chain",
    discovery: "Intimate Vocal Chain",
    apply: (c) => c.direction === "intimate" && ["vocal-production", "tracking"].includes(c.brief.serviceType) && c.roomType === "vocal-suite" && has(c, "microphone") ? { delta: 12, reason: "Close mic in the Vocal Suite suits an intimate take" } : null
  },
  {
    id: "live-room-energy",
    discovery: "Live Room Energy",
    apply: (c) => ["live", "raw", "heavy"].includes(c.direction) && c.roomType === "live-room" ? { delta: 12, reason: "The Live Room gives this direction real energy" } : null
  },
  {
    id: "electronic-stack",
    discovery: "Electronic Production Stack",
    apply: (c) => c.brief.genre === "Electronic" && ["polished", "experimental"].includes(c.direction) && has(c, "software", "interface") ? { delta: 10, reason: "Interface and software rig fit electronic production" } : null
  },
  {
    id: "trusted-mix-pair",
    discovery: "Trusted Mix Pair",
    apply: (c) => {
      if (!["mix", "master"].includes(c.brief.serviceType) || !c.clientId) return null;
      const s = c.staff.find((m) => (m.clientFamiliarity?.[c.clientId] ?? 0) >= 2);
      return s ? { delta: 12, reason: `${s.name} already knows this client's sound` } : null;
    }
  },
  {
    id: "genre-specialist",
    apply: (c) => {
      const s = c.staff.filter((m) => m.genreAffinity?.genre === c.brief.genre).sort((a, b) => (b.genreAffinity?.bonus ?? 0) - (a.genreAffinity?.bonus ?? 0))[0];
      return s?.genreAffinity ? { delta: Math.min(12, Math.round(s.genreAffinity.bonus / 3)), reason: `${s.name} specializes in ${c.brief.genre}` } : null;
    }
  },
  {
    id: "role-fit",
    apply: (c) => {
      const role = SERVICE_ROLE[c.brief.serviceType];
      const s = c.staff.find((m) => m.role === role);
      return s ? { delta: 8, reason: `${s.name} is a ${role.toLowerCase()} for ${SERVICE_LABELS[c.brief.serviceType].toLowerCase()}` } : null;
    }
  },
  {
    id: "polished-monitoring",
    apply: (c) => c.direction === "polished" && (c.roomType === "mix-suite" || has(c, "monitor")) ? { delta: 8, reason: "Good monitoring keeps a polished sound honest" } : null
  },
  {
    id: "heavy-punch",
    apply: (c) => c.direction === "heavy" && has(c, "outboard", "mixer") ? { delta: 8, reason: "Outboard and console give it the punch it needs" } : null
  },
  {
    id: "quick-turnaround",
    apply: (c) => c.brief.priority === "speed" && c.staff.length > 0 && avg(c.staff.map((m) => m.primaryStats.speed)) >= 30 ? { delta: 8, reason: "A quick crew suits the fast turnaround" } : null
  },
  {
    id: "lean-budget",
    apply: (c) => c.brief.priority === "budget" && c.staff.length <= 1 ? { delta: 6, reason: "A lean crew keeps the budget tight" } : null
  },
  {
    id: "quality-hands",
    apply: (c) => c.brief.priority === "quality" && c.staff.length > 0 && avg(c.staff.map((m) => m.primaryStats.technical)) >= 30 ? { delta: 8, reason: "Technical hands suit a quality-first brief" } : null
  },
  {
    id: "experimental-leap",
    apply: (c) => {
      if (c.direction !== "experimental") return null;
      return c.staff.length > 0 && avg(c.staff.map((m) => m.primaryStats.creativity)) >= 35 ? { delta: 10, reason: "A creative crew can carry an experimental leap" } : { delta: -6, reason: "An experimental brief needs a more creative crew" };
    }
  },
  {
    id: "house-recipe",
    apply: (c) => c.approachId === "house-recipe" ? { delta: 6, reason: `Your house recipe: the studio knows how to cut ${c.genre}` } : null
  },
  {
    id: "repeat-client",
    apply: (c) => c.clientSessions > 0 ? { delta: Math.min(10, c.clientSessions * 3), reason: "Repeat client: you already speak the same language" } : null
  }
];
var BRIEF_RULE_COUNT = FIT_RULES.length;

// src/content/registry.ts
var strip = (o) => JSON.parse(JSON.stringify(o));
var eventToContent = (e) => strip({
  id: e.id,
  family: e.family,
  baseWeight: e.baseWeight,
  cooldownDays: e.cooldownDays,
  maxOccurrences: e.maxOccurrences,
  requiredMemories: e.requiredMemories ? [...e.requiredMemories] : void 0,
  blockedMemories: e.blockedMemories ? [...e.blockedMemories] : void 0,
  memoryWeights: e.memoryWeights ? { ...e.memoryWeights } : void 0,
  narrativeKey: e.narrativeKey,
  kicker: e.kicker,
  title: e.title,
  options: e.options.map((o) => ({
    id: o.id,
    label: o.label,
    flavorText: o.flavorText,
    effects: [...o.effects],
    memories: o.memories ? [...o.memories] : void 0,
    outcome: o.outcome
  })),
  delegable: e.delegable,
  defaultOptionId: e.defaultOptionId,
  hasSubjectPicker: Boolean(e.pickSubject),
  hasEligibility: Boolean(e.eligible)
});
var briefTemplates = () => strip({
  services: SERVICES.map((service) => ({ service, room: SERVICE_ROOM[service], role: SERVICE_ROLE[service] })),
  priorities: [...PRIORITIES],
  genreDirections: GENRE_DIRECTIONS,
  defaultDirections: [...DEFAULT_DIRECTIONS],
  approaches: PRODUCTION_APPROACHES
});
var liveRegistry = () => ({
  synergies: strip([...STUDIO_SYNERGIES]),
  events: DIRECTOR_EVENTS.map(eventToContent),
  briefs: briefTemplates()
});

// node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/external.js
var external_exports = {};
__export(external_exports, {
  BRAND: () => BRAND,
  DIRTY: () => DIRTY,
  EMPTY_PATH: () => EMPTY_PATH,
  INVALID: () => INVALID,
  NEVER: () => NEVER,
  OK: () => OK,
  ParseStatus: () => ParseStatus,
  Schema: () => ZodType,
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBigInt: () => ZodBigInt,
  ZodBoolean: () => ZodBoolean,
  ZodBranded: () => ZodBranded,
  ZodCatch: () => ZodCatch,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodEffects: () => ZodEffects,
  ZodEnum: () => ZodEnum,
  ZodError: () => ZodError,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodFunction: () => ZodFunction,
  ZodIntersection: () => ZodIntersection,
  ZodIssueCode: () => ZodIssueCode,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNever: () => ZodNever,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodParsedType: () => ZodParsedType,
  ZodPipeline: () => ZodPipeline,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly,
  ZodRecord: () => ZodRecord,
  ZodSchema: () => ZodType,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodSymbol: () => ZodSymbol,
  ZodTransformer: () => ZodEffects,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  addIssueToContext: () => addIssueToContext,
  any: () => anyType,
  array: () => arrayType,
  bigint: () => bigIntType,
  boolean: () => booleanType,
  coerce: () => coerce,
  custom: () => custom,
  date: () => dateType,
  datetimeRegex: () => datetimeRegex,
  defaultErrorMap: () => en_default,
  discriminatedUnion: () => discriminatedUnionType,
  effect: () => effectsType,
  enum: () => enumType,
  function: () => functionType,
  getErrorMap: () => getErrorMap,
  getParsedType: () => getParsedType,
  instanceof: () => instanceOfType,
  intersection: () => intersectionType,
  isAborted: () => isAborted,
  isAsync: () => isAsync,
  isDirty: () => isDirty,
  isValid: () => isValid,
  late: () => late,
  lazy: () => lazyType,
  literal: () => literalType,
  makeIssue: () => makeIssue,
  map: () => mapType,
  nan: () => nanType,
  nativeEnum: () => nativeEnumType,
  never: () => neverType,
  null: () => nullType,
  nullable: () => nullableType,
  number: () => numberType,
  object: () => objectType,
  objectUtil: () => objectUtil,
  oboolean: () => oboolean,
  onumber: () => onumber,
  optional: () => optionalType,
  ostring: () => ostring,
  pipeline: () => pipelineType,
  preprocess: () => preprocessType,
  promise: () => promiseType,
  quotelessJson: () => quotelessJson,
  record: () => recordType,
  set: () => setType,
  setErrorMap: () => setErrorMap,
  strictObject: () => strictObjectType,
  string: () => stringType,
  symbol: () => symbolType,
  transformer: () => effectsType,
  tuple: () => tupleType,
  undefined: () => undefinedType,
  union: () => unionType,
  unknown: () => unknownType,
  util: () => util,
  void: () => voidType
});

// node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/util.js
var util;
(function(util2) {
  util2.assertEqual = (_) => {
  };
  function assertIs(_arg) {
  }
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error();
  }
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys = [];
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return void 0;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
      // second overwrites first
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};

// node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/ZodError.js
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var quotelessJson = (obj) => {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(/"([^"]+)":/g, "$1:");
};
var ZodError = class _ZodError extends Error {
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = (error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    };
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof _ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
};
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};

// node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/locales/en.js
var errorMap = (issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "bigint")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
};
var en_default = errorMap;

// node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/errors.js
var overrideErrorMap = en_default;
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}

// node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/parseUtil.js
var makeIssue = (params) => {
  const { data, path, errorMaps, issueData } = params;
  const fullPath = [...path, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== void 0) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
};
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === en_default ? void 0 : en_default
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}
var ParseStatus = class _ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return _ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
};
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = (value) => ({ status: "dirty", value });
var OK = (value) => ({ status: "valid", value });
var isAborted = (x) => x.status === "aborted";
var isDirty = (x) => x.status === "dirty";
var isValid = (x) => x.status === "valid";
var isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;

// node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

// node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/types.js
var ParseInputLazyPath = class {
  constructor(parent, value, path, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
};
var handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
};
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  };
  return { errorMap: customMap, description };
}
var ZodType = class {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if (err?.message?.toLowerCase()?.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = (val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    };
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      });
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (data) => this["~validate"](data)
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
};
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
function isValidCidr(ip, version) {
  if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
var ZodString = class _ZodString extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      offset: options?.offset ?? false,
      local: options?.local ?? false,
      ...errorUtil.errToObj(options?.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      ...errorUtil.errToObj(options?.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options?.position,
      ...errorUtil.errToObj(options?.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
var ZodNumber = class _ZodNumber extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
};
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodBigInt = class _ZodBigInt extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
var ZodBoolean = class extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodDate = class _ZodDate extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new _ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
};
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: params?.coerce || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};
var ZodSymbol = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};
var ZodUndefined = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};
var ZodNull = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};
var ZodAny = class extends ZodType {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};
var ZodUnknown = class extends ZodType {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};
var ZodNever = class extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
};
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};
var ZodVoid = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};
var ZodArray = class _ZodArray extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : void 0,
          maximum: tooBig ? def.exactLength.value : void 0,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new _ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new _ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new _ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
var ZodObject = class _ZodObject extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") {
      } else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== void 0 ? {
        errorMap: (issue, ctx) => {
          const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(augmentation) {
    return new _ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    const merged = new _ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(index) {
    return new _ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key of util.objectKeys(mask)) {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
};
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
var ZodUnion = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = void 0;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
};
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = (type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [void 0];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [void 0, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
};
var ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create(discriminator, options, params) {
    const optionsMap = /* @__PURE__ */ new Map();
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        }
        optionsMap.set(value, type);
      }
    }
    return new _ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
};
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
var ZodIntersection = class extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    };
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
};
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};
var ZodTuple = class _ZodTuple extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new _ZodTuple({
      ...this._def,
      rest
    });
  }
};
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};
var ZodRecord = class _ZodRecord extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new _ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new _ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
};
var ZodMap = class extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = /* @__PURE__ */ new Map();
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
};
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};
var ZodSet = class _ZodSet extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = /* @__PURE__ */ new Set();
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new _ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new _ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};
var ZodFunction = class _ZodFunction extends ZodType {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me = this;
      return OK(async function(...args) {
        const error = new ZodError([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error.addIssue(makeReturnsIssue(result, e));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new _ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new _ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new _ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
};
var ZodLazy = class extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
};
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};
var ZodLiteral = class extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
};
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
var ZodEnum = class _ZodEnum extends ZodType {
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return _ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return _ZodEnum.create(this.options.filter((opt4) => !values.includes(opt4)), {
      ...this._def,
      ...newDef
    });
  }
};
ZodEnum.create = createZodEnum;
var ZodNativeEnum = class extends ZodType {
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
};
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};
var ZodPromise = class extends ZodType {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
};
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};
var ZodEffects = class extends ZodType {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = (acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      };
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
};
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
var ZodOptional = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(void 0);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};
var ZodNullable = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};
var ZodDefault = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
};
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};
var ZodCatch = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
};
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};
var ZodNaN = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
};
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
var BRAND = Symbol("zod_brand");
var ZodBranded = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
};
var ZodPipeline = class _ZodPipeline extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      };
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new _ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
};
var ZodReadonly = class extends ZodType {
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = (data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    };
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
function cleanParams(params, data) {
  const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p2 = typeof p === "string" ? { message: p } : p;
  return p2;
}
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      const r2 = check(data);
      if (r2 instanceof Promise) {
        return r2.then((r3) => {
          if (!r3) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r2) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
var late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = (cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params);
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var ostring = () => stringType().optional();
var onumber = () => numberType().optional();
var oboolean = () => booleanType().optional();
var coerce = {
  string: (arg) => ZodString.create({ ...arg, coerce: true }),
  number: (arg) => ZodNumber.create({ ...arg, coerce: true }),
  boolean: (arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  }),
  bigint: (arg) => ZodBigInt.create({ ...arg, coerce: true }),
  date: (arg) => ZodDate.create({ ...arg, coerce: true })
};
var NEVER = INVALID;

// src/content/schemas.ts
var ROOM_TYPES = ["project-studio", "vocal-suite", "live-room", "mix-suite"];
var EQUIPMENT_CATEGORIES = ["microphone", "monitor", "interface", "outboard", "instrument", "software", "recorder", "mixer"];
var CHAIN_SLOTS = ["microphone", "preamp", "dynamics", "recorderInterface"];
var STAFF_ROLES = ["Engineer", "Producer", "Songwriter"];
var CLIENT_TIERS = ["Unknown", "Acquaintance", "Friendly", "Regular", "Loyal", "Advocate"];
var SYNERGY_CATEGORIES = ["room_gear", "staff_client", "genre_setup"];
var MEMORY_SCOPES = ["studio", "client", "staff", "project", "gear", "band"];
var BRIEF_SERVICES = ["tracking", "vocal-production", "mix", "master", "full-production"];
var BRIEF_DIRECTIONS = ["raw", "polished", "intimate", "live", "heavy", "experimental"];
var BRIEF_PRIORITIES = ["quality", "speed", "budget"];
var id = external_exports.string().min(2).regex(/^[a-z0-9][a-z0-9_.-]*$/, "ids are lower-case letters, digits, _ . -");
var SynergySchema = external_exports.object({
  id,
  name: external_exports.string().min(2),
  category: external_exports.enum(SYNERGY_CATEGORIES),
  tagline: external_exports.string().min(2),
  description: external_exports.string().min(10),
  hint: external_exports.string().min(5),
  icon: external_exports.string().min(1),
  criteria: external_exports.object({
    roomTypes: external_exports.array(external_exports.enum(ROOM_TYPES)).optional(),
    requiredEquipmentCategories: external_exports.array(external_exports.enum(EQUIPMENT_CATEGORIES)).optional(),
    chainSlots: external_exports.array(external_exports.enum(CHAIN_SLOTS)).optional(),
    requiredEquipmentIds: external_exports.array(external_exports.string()).optional(),
    anyStaffRoles: external_exports.array(external_exports.enum(STAFF_ROLES)).optional(),
    requiredStaffRoles: external_exports.array(external_exports.enum(STAFF_ROLES)).optional(),
    minStaffCount: external_exports.number().int().min(1).max(10).optional(),
    genres: external_exports.array(external_exports.string().min(2)).optional(),
    clientRelationshipTiers: external_exports.array(external_exports.enum(CLIENT_TIERS)).optional(),
    minStaffCreativity: external_exports.number().min(1).max(100).optional(),
    minStaffTechnical: external_exports.number().min(1).max(100).optional()
  }).strict(),
  bonuses: external_exports.object({
    creativityMultiplier: external_exports.number().optional(),
    technicalMultiplier: external_exports.number().optional(),
    workUnitSpeedMultiplier: external_exports.number().optional(),
    reviewQualityBonus: external_exports.number().optional(),
    staffXpMultiplier: external_exports.number().optional()
  }).strict()
}).strict();
var EffectSchema = external_exports.discriminatedUnion("kind", [
  external_exports.object({ kind: external_exports.literal("money"), amount: external_exports.number() }),
  external_exports.object({ kind: external_exports.literal("reputation"), amount: external_exports.number() }),
  external_exports.object({ kind: external_exports.literal("xp"), amount: external_exports.number() }),
  external_exports.object({ kind: external_exports.literal("clientXp"), amount: external_exports.number() }),
  external_exports.object({ kind: external_exports.literal("staffXp"), amount: external_exports.number() }),
  external_exports.object({ kind: external_exports.literal("gearCondition"), amount: external_exports.number() }),
  external_exports.object({ kind: external_exports.literal("referral") })
]);
var EventOptionSchema = external_exports.object({
  id,
  label: external_exports.string().min(1),
  flavorText: external_exports.string().min(1),
  effects: external_exports.array(EffectSchema),
  memories: external_exports.array(external_exports.object({
    scope: external_exports.enum(MEMORY_SCOPES).optional(),
    key: external_exports.string().min(1),
    ttlDays: external_exports.number().int().positive().optional(),
    intensity: external_exports.number().optional()
  })).optional(),
  outcome: external_exports.string().min(1)
});
var EventSchema = external_exports.object({
  id,
  family: external_exports.string().min(2),
  baseWeight: external_exports.number().positive(),
  cooldownDays: external_exports.number().int().min(0),
  maxOccurrences: external_exports.number().int().positive().optional(),
  requiredMemories: external_exports.array(external_exports.string()).optional(),
  blockedMemories: external_exports.array(external_exports.string()).optional(),
  memoryWeights: external_exports.record(external_exports.number().positive()).optional(),
  narrativeKey: external_exports.string().regex(/^[a-z0-9_]+(\.[a-z0-9_-]+)+$/, "narrative keys are dotted lower-case paths"),
  kicker: external_exports.string().min(1),
  title: external_exports.string().min(1),
  options: external_exports.array(EventOptionSchema).min(1).max(4),
  delegable: external_exports.boolean().optional(),
  defaultOptionId: external_exports.string().optional(),
  /** Recorded, not editable: these parts are code. */
  hasSubjectPicker: external_exports.boolean(),
  hasEligibility: external_exports.boolean()
});
var BriefApproachSchema = external_exports.object({
  id,
  label: external_exports.string().min(2),
  blurb: external_exports.string().min(5),
  direction: external_exports.enum(BRIEF_DIRECTIONS),
  focus: external_exports.object({ performance: external_exports.number().min(0), soundCapture: external_exports.number().min(0), layering: external_exports.number().min(0) })
});
var BriefTemplateSchema = external_exports.object({
  /** One row per service the brief generator can ask for. */
  services: external_exports.array(external_exports.object({
    service: external_exports.enum(BRIEF_SERVICES),
    room: external_exports.enum(ROOM_TYPES),
    role: external_exports.enum(STAFF_ROLES)
  })),
  priorities: external_exports.array(external_exports.enum(BRIEF_PRIORITIES)),
  /** Directions a genre can ask for. */
  genreDirections: external_exports.record(external_exports.array(external_exports.enum(BRIEF_DIRECTIONS)).min(1)),
  defaultDirections: external_exports.array(external_exports.enum(BRIEF_DIRECTIONS)).min(1),
  approaches: external_exports.array(BriefApproachSchema)
});

// src/content/validate.ts
var SYNERGY_CAPS = { creativityMultiplier: 1.6, technicalMultiplier: 1.6, workUnitSpeedMultiplier: 1.5, reviewQualityBonus: 12, staffXpMultiplier: 1.8 };
var SYNERGY_SINGLE_SHARE = 0.6;
var fmt = (i) => `${i.path.join(".") || "(root)"}: ${i.message}`;
var dupes = (xs) => xs.filter((x, i) => xs.indexOf(x) !== i);
function validateRegistry(reg2, strings2) {
  const out = [];
  const add = (severity, family, id2, rule, message) => out.push({ severity, family, id: id2, rule, message });
  const synIds = reg2.synergies.map((s) => s.id);
  for (const d of new Set(dupes(synIds))) add("error", "synergies", d, "duplicate-id", "More than one synergy uses this id.");
  const seenCriteria = /* @__PURE__ */ new Map();
  for (const s of reg2.synergies) {
    const parsed = SynergySchema.safeParse(s);
    if (!parsed.success) for (const i of parsed.error.issues) add("error", "synergies", s.id, "schema", fmt(i));
    synergyRules(s, add);
    const key = JSON.stringify(Object.entries(s.criteria).sort(([a], [b2]) => a.localeCompare(b2)).map(([k, v]) => [k, Array.isArray(v) ? [...v].sort() : v]));
    const prior = seenCriteria.get(key);
    if (prior) add("warn", "synergies", s.id, "duplicate-conditions", `Same conditions as "${prior}", so both fire together.`);
    else seenCriteria.set(key, s.id);
  }
  const evIds = reg2.events.map((e) => e.id);
  for (const d of new Set(dupes(evIds))) add("error", "events", d, "duplicate-id", "More than one event uses this id.");
  for (const d of new Set(dupes(reg2.events.map((e) => e.narrativeKey)))) {
    add("error", "events", d, "duplicate-narrative-key", "More than one event uses this narrative key.");
  }
  const written = /* @__PURE__ */ new Set();
  for (const e of reg2.events) for (const o of e.options) for (const m of o.memories ?? []) written.add(m.key);
  for (const e of reg2.events) {
    const parsed = EventSchema.safeParse(e);
    if (!parsed.success) for (const i of parsed.error.issues) add("error", "events", e.id, "schema", fmt(i));
    eventRules(e, written, strings2, add);
  }
  const b = BriefTemplateSchema.safeParse(reg2.briefs);
  if (!b.success) for (const i of b.error.issues) add("error", "briefs", "brief-templates", "schema", fmt(i));
  briefRules(reg2, add);
  return out;
}
function synergyRules(s, add) {
  const c = s.criteria;
  const A = (sev, rule, msg) => add(sev, "synergies", s.id, rule, msg);
  const bonusEntries = Object.entries(s.bonuses ?? {}).filter(([, v]) => typeof v === "number");
  if (!bonusEntries.length) A("error", "no-bonus", "A synergy with no bonus does nothing.");
  for (const [k, v] of bonusEntries) {
    const cap = SYNERGY_CAPS[k];
    if (!cap) {
      A("error", "unknown-bonus", `Unknown bonus "${k}".`);
      continue;
    }
    const neutral = k === "reviewQualityBonus" ? 0 : 1;
    if (v > cap) A("error", "modifier-over-cap", `${k} ${v} is above the game cap ${cap}.`);
    else if (v < neutral) A("warn", "penalty", `${k} ${v} is a penalty; synergies are meant to be rewards.`);
    else if (v - neutral > (cap - neutral) * SYNERGY_SINGLE_SHARE) A("warn", "modifier-near-cap", `${k} ${v} uses over ${Math.round(SYNERGY_SINGLE_SHARE * 100)}% of the headroom to the cap ${cap}, so it stacks into the cap on its own.`);
  }
  const keys = Object.keys(c).filter((k) => c[k] !== void 0);
  if (!keys.length) A("warn", "matches-everything", "No conditions: this synergy fires on every session.");
  for (const [k, v] of Object.entries(c)) {
    if (Array.isArray(v) && dupes(v.map(String)).length) A("warn", "duplicate-entries", `${k} lists a value twice.`);
  }
  if (c.requiredStaffRoles && c.minStaffCount !== void 0 && c.requiredStaffRoles.length > c.minStaffCount) {
    A("error", "impossible", `Needs ${c.requiredStaffRoles.length} different roles but minStaffCount is ${c.minStaffCount}.`);
  }
  if (c.requiredStaffRoles && c.anyStaffRoles && !c.anyStaffRoles.some((r2) => c.requiredStaffRoles.includes(r2)) && c.requiredStaffRoles.length === 1) {
    A("warn", "redundant", "anyStaffRoles never matches the single required role.");
  }
  if (s.category === "room_gear" && !c.roomTypes && !c.requiredEquipmentCategories && !c.requiredEquipmentIds && !c.chainSlots) A("warn", "category-mismatch", "A room_gear synergy should test a room or gear.");
  if (s.category === "staff_client" && !c.anyStaffRoles && !c.requiredStaffRoles && !c.minStaffCount && !c.clientRelationshipTiers && !c.minStaffCreativity && !c.minStaffTechnical) A("warn", "category-mismatch", "A staff_client synergy should test staff or the client.");
  if (s.category === "genre_setup" && !c.genres) A("warn", "category-mismatch", "A genre_setup synergy should name genres.");
}
var memoryBase = (k) => k.startsWith("studio/") ? k.slice(7) : k;
function eventRules(e, written, strings2, add) {
  const A = (sev, rule, msg) => add(sev, "events", e.id, rule, msg);
  const optIds = e.options.map((o) => o.id);
  for (const d of new Set(dupes(optIds))) A("error", "duplicate-option", `Option id "${d}" appears twice.`);
  if (e.delegable && !e.defaultOptionId) A("error", "delegable-without-default", "A delegable event needs a defaultOptionId.");
  if (e.defaultOptionId && !optIds.includes(e.defaultOptionId)) A("error", "bad-default", `defaultOptionId "${e.defaultOptionId}" is not one of the options.`);
  if (e.cooldownDays === 0 && e.maxOccurrences === void 0) A("warn", "modal-no-cooldown", "A modal event with no cooldown and no occurrence limit can repeat every opportunity.");
  if (e.requiredMemories && e.blockedMemories && e.requiredMemories.some((k) => e.blockedMemories.includes(k))) A("error", "impossible", "A memory is both required and blocked, so the event can never fire.");
  for (const k of [...e.requiredMemories ?? [], ...e.blockedMemories ?? [], ...Object.keys(e.memoryWeights ?? {})]) {
    if (!written.has(memoryBase(k))) A("warn", "unwritten-memory", `Memory "${k}" is never written by any authored option, so only code can set it.`);
  }
  for (const o of e.options) {
    for (const fx3 of o.effects) {
      if (fx3.kind === "referral") continue;
      const limit = EFFECT_LIMITS[fx3.kind];
      if (Math.abs(fx3.amount) > limit) A("error", "effect-over-limit", `${o.id}: ${fx3.kind} ${fx3.amount} exceeds the safe range \xB1${limit} and would be clamped.`);
      else if (fx3.amount > limit * 0.5 && fx3.kind !== "gearCondition") A("warn", "effect-near-limit", `${o.id}: ${fx3.kind} +${fx3.amount} is above half the safe range (${limit}).`);
    }
  }
  if (e.baseWeight > 100) A("warn", "weight", `baseWeight ${e.baseWeight} will drown out other events.`);
  if (strings2) {
    const need = [`event.${e.id}.kicker`, `event.${e.id}.title`, `event.${e.id}.context`, ...e.options.flatMap((o) => ["label", "flavor", "outcome"].map((p) => `event.${e.id}.opt.${o.id}.${p}`))];
    const missing = need.filter((k) => !strings2[k]);
    if (missing.length) A("error", "missing-text", `Missing ${missing.length} English string${missing.length > 1 ? "s" : ""}, first: ${missing[0]}`);
  }
}
function briefRules(reg2, add) {
  const A = (sev, id2, rule, msg) => add(sev, "briefs", id2, rule, msg);
  const t = reg2.briefs;
  const covered = new Set(t.services.map((s) => s.service));
  for (const svc of BRIEF_SERVICES) if (!covered.has(svc)) A("error", svc, "no-room-path", `Service "${svc}" has no room/role mapping, so a brief asking for it cannot be booked.`);
  for (const d of new Set(dupes(t.services.map((s) => s.service)))) A("error", d, "duplicate-service", "Service is mapped twice.");
  for (const d of new Set(dupes(t.approaches.map((a) => a.id)))) A("error", d, "duplicate-id", "Approach id is used twice.");
  for (const a of t.approaches) {
    const sum = a.focus.performance + a.focus.soundCapture + a.focus.layering;
    if (sum !== 100) A("warn", a.id, "focus-sum", `Focus adds up to ${sum}, not 100.`);
  }
  const reachable = /* @__PURE__ */ new Set([...t.defaultDirections, ...Object.values(t.genreDirections).flat()]);
  for (const d of BRIEF_DIRECTIONS) if (!reachable.has(d)) A("warn", d, "unreachable-direction", `No genre can ask for the "${d}" direction.`);
  for (const [g, ds] of Object.entries(t.genreDirections)) if (dupes(ds).length) A("warn", g, "duplicate-entries", "A direction is listed twice.");
  const approachDirs = new Set(t.approaches.map((a) => a.direction));
  for (const d of reachable) if (!approachDirs.has(d)) A("warn", d, "no-approach", `No production approach leans toward "${d}".`);
}
var summarise = (issues) => ({
  errors: issues.filter((i) => i.severity === "error").length,
  warnings: issues.filter((i) => i.severity === "warn").length
});

// src/content/preview.ts
var SYNERGY_FIXTURES = [
  { name: "Bedroom start", room: "project-studio", categories: ["microphone", "interface"], equipmentIds: [], staffRoles: [], maxCreativity: 0, maxTechnical: 0, genre: "Pop", clientTier: "Unknown" },
  { name: "Vocal day", room: "vocal-suite", categories: ["microphone", "outboard", "interface"], equipmentIds: [], staffRoles: ["Producer", "Engineer"], maxCreativity: 55, maxTechnical: 60, genre: "Soul", clientTier: "Regular" },
  { name: "Live tracking", room: "live-room", categories: ["microphone", "instrument", "recorder"], equipmentIds: [], staffRoles: ["Engineer"], maxCreativity: 40, maxTechnical: 70, genre: "Rock", clientTier: "Friendly" },
  { name: "Flagship mix", room: "mix-suite", categories: ["monitor", "mixer", "outboard", "software"], equipmentIds: [], staffRoles: ["Engineer", "Producer", "Songwriter"], maxCreativity: 85, maxTechnical: 90, genre: "Electronic", clientTier: "Loyal" }
];
var list = (xs) => xs.join(", ");
function explainSynergy(s, f) {
  const c = s.criteria;
  const checks = [];
  const add = (label, pass, detail) => checks.push({ label, pass, detail });
  if (c.roomTypes?.length) add("Room", c.roomTypes.includes(f.room), `needs ${list(c.roomTypes)}, fixture has ${f.room}`);
  if (c.chainSlots?.length && f.chainSlots) add("Chain slots", c.chainSlots.every((x) => f.chainSlots.includes(x)), `needs ${list(c.chainSlots)}, chain has ${list(f.chainSlots) || "none"}`);
  else if (c.requiredEquipmentCategories?.length) add("Gear categories", c.requiredEquipmentCategories.every((x) => f.categories.includes(x)), `needs ${list(c.requiredEquipmentCategories)}, fixture has ${list(f.categories) || "none"}`);
  if (c.requiredEquipmentIds?.length) add("Specific gear", c.requiredEquipmentIds.every((x) => f.equipmentIds.includes(x)), `needs ${list(c.requiredEquipmentIds)}`);
  if (c.minStaffCount !== void 0) add("Staff count", f.staffRoles.length >= c.minStaffCount, `needs ${c.minStaffCount}, fixture has ${f.staffRoles.length}`);
  if (c.anyStaffRoles?.length) add("Any staff role", f.staffRoles.some((r2) => c.anyStaffRoles.includes(r2)), `needs one of ${list(c.anyStaffRoles)}, fixture has ${list(f.staffRoles) || "nobody"}`);
  if (c.requiredStaffRoles?.length) add("All staff roles", c.requiredStaffRoles.every((r2) => f.staffRoles.includes(r2)), `needs ${list(c.requiredStaffRoles)}, fixture has ${list(f.staffRoles) || "nobody"}`);
  if (c.genres?.length) add("Genre", c.genres.some((g) => g.trim().toLowerCase() === f.genre.trim().toLowerCase()), `needs one of ${list(c.genres)}, fixture is ${f.genre}`);
  if (c.clientRelationshipTiers?.length) add("Client tier", Boolean(f.clientTier && c.clientRelationshipTiers.includes(f.clientTier)), `needs ${list(c.clientRelationshipTiers)}, fixture client is ${f.clientTier ?? "none"}`);
  if (c.minStaffCreativity !== void 0) add("Creativity", f.maxCreativity >= c.minStaffCreativity, `needs ${c.minStaffCreativity}, best staff has ${f.maxCreativity}`);
  if (c.minStaffTechnical !== void 0) add("Technical", f.maxTechnical >= c.minStaffTechnical, `needs ${c.minStaffTechnical}, best staff has ${f.maxTechnical}`);
  return { matches: checks.every((k) => k.pass), checks };
}
var client = (over = {}) => ({
  clientId: "mara",
  clientName: "Mara Vale",
  primaryGenre: "Rock",
  relationshipXp: 100,
  tier: "Friendly",
  sessionsCompleted: 3,
  lastSessionDay: 20,
  bestQualityScore: 80,
  referralCount: 0,
  ...over
});
var baseState = (over) => ({
  currentDay: 30,
  currentEra: "analog60s",
  selectedEra: "analog60s",
  saveSeed: 777,
  money: 5e3,
  reputation: 60,
  hiredStaff: [],
  ownedEquipment: [],
  studioRooms: [],
  playerData: { xp: 0, level: 3 },
  clientRelationships: { mara: client() },
  storylineState: { runSeed: 1, activeCampaignNodeId: "x", campaignCompleted: false, branchHistory: [], activeSubplots: [], resolvedSubplotIds: [], storyFlags: {} },
  ...over
});
var EVENT_FIXTURES = [
  { name: "Day 5, nobody yet", state: baseState({ currentDay: 5, money: 800, reputation: 5, clientRelationships: {} }) },
  { name: "Day 30, one regular client", state: baseState({}) },
  { name: "Day 90, two staff, strong client", state: baseState({ currentDay: 90, money: 12e3, reputation: 70, hiredStaff: [{ id: "s1", name: "Sam" }, { id: "s2", name: "Ines" }], clientRelationships: { mara: client({ tier: "Loyal", sessionsCompleted: 8, bestQualityScore: 92 }) } }) }
];
function explainEvent(state, def) {
  const facts = buildFacts(state);
  const director = getDirector(state);
  const subject = def.pickSubject ? def.pickSubject(facts) : void 0;
  if (def.pickSubject && !subject) return { eligible: false, reason: "No client, staff member or gear in this fixture fits the event." };
  if (!def.eligible(facts, subject)) return { eligible: false, reason: "The eligibility rule says no for this fixture.", subject };
  const mine = director.history.filter((h) => h.eventId === def.id && (!subject || h.subjectId === subject.id));
  if (def.maxOccurrences !== void 0 && mine.length >= def.maxOccurrences) return { eligible: false, reason: `Already happened ${mine.length} time(s); the limit is ${def.maxOccurrences}.`, subject };
  const last = director.history.filter((h) => h.eventId === def.id).slice(-1)[0];
  if (last && state.currentDay - last.day < def.cooldownDays) return { eligible: false, reason: `Still cooling down (${def.cooldownDays - (state.currentDay - last.day)} day(s) left).`, subject };
  const holds = (k) => k.startsWith("studio/") ? facts.has("studio", k.slice(7)) : subject ? facts.has(subject.scope, k, subject.id) : false;
  const missing = (def.requiredMemories ?? []).filter((k) => !holds(k));
  if (missing.length) return { eligible: false, reason: `Needs the memory ${missing.map((k) => `"${k}"`).join(", ")}, which this fixture does not have.`, subject };
  const blocked = (def.blockedMemories ?? []).filter(holds);
  if (blocked.length) return { eligible: false, reason: `Blocked by the memory ${blocked.map((k) => `"${k}"`).join(", ")}.`, subject };
  let weight = def.baseWeight;
  for (const [k, m] of Object.entries(def.memoryWeights ?? {})) if (holds(k)) weight *= m;
  return { eligible: true, reason: subject ? `Eligible, about ${subject.label}.` : "Eligible.", subject, weight };
}
function explainBriefGenre(t, genre) {
  const directions = t.genreDirections[genre] ?? t.defaultDirections;
  return {
    genre,
    usesDefault: !t.genreDirections[genre],
    directions,
    services: t.services.map((s) => `${s.service} \u2192 ${s.room} (${s.role})`),
    samples: Array.from({ length: 5 }, (_, i) => deriveBrief({ id: `preview-${i}`, genre }))
  };
}

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
    Object.values(p.signalChain.slots).forEach((id2) => id2 && ids.add(id2));
  }
  return ids;
}
function validateChain(chain, state, exceptProjectId) {
  const busy = busyGearIds(state, exceptProjectId);
  const owned = new Map((state.ownedEquipment ?? []).map((e) => [e.id, e]));
  const broken = [];
  const filled = [];
  for (const slot of SIGNAL_SLOTS) {
    const id2 = chain.slots[slot];
    if (!id2) continue;
    const item = owned.get(id2);
    if (!item || !slotAccepts(slot, item) || busy.has(id2)) broken.push(slot);
    else filled.push(slot);
  }
  return { valid: broken.length === 0 && filled.length > 0, broken, filled };
}
function activeChainSlots(project, state) {
  if (!project.signalChain) return null;
  const v = validateChain(project.signalChain, state, project.id);
  return v.broken.length === 0 ? v.filled : [];
}

// src/utils/synergyUtils.ts
function getProjectRoomType(project, gameState) {
  const roomId = project.bookingRoomId || "studio-a";
  const room = (gameState.studioRooms || []).find((r2) => r2.id === roomId);
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
      const hasAllIds = criteria.requiredEquipmentIds.every((id2) => ownedEquipmentIds.has(id2));
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

// src/content/diff.ts
var isObj = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
function structuredDiff(before, after, path = "") {
  if (JSON.stringify(before) === JSON.stringify(after)) return [];
  if (isObj(before) && isObj(after)) {
    const keys = [.../* @__PURE__ */ new Set([...Object.keys(before), ...Object.keys(after)])].sort();
    return keys.flatMap((k) => {
      const p = path ? `${path}.${k}` : k;
      if (!(k in after) || after[k] === void 0) return before[k] === void 0 ? [] : [{ path: p, kind: "removed", before: before[k] }];
      if (!(k in before) || before[k] === void 0) return [{ path: p, kind: "added", after: after[k] }];
      return structuredDiff(before[k], after[k], p);
    });
  }
  if (Array.isArray(before) && Array.isArray(after)) {
    const out = [];
    for (let i = 0; i < Math.max(before.length, after.length); i++) {
      const p = `${path}[${i}]`;
      if (i >= after.length) out.push({ path: p, kind: "removed", before: before[i] });
      else if (i >= before.length) out.push({ path: p, kind: "added", after: after[i] });
      else out.push(...structuredDiff(before[i], after[i], p));
    }
    return out;
  }
  return [{ path: path || "(root)", kind: "changed", before, after }];
}
var diffToText = (lines) => lines.map((l) => l.kind === "added" ? `+ ${l.path}: ${JSON.stringify(l.after)}` : l.kind === "removed" ? `- ${l.path}: ${JSON.stringify(l.before)}` : `~ ${l.path}: ${JSON.stringify(l.before)} \u2192 ${JSON.stringify(l.after)}`).join("\n");

// tests/content-workbench.check.ts
var import_node_fs = __toESM(require("node:fs"), 1);
var n = 0;
var ok = (c, m) => {
  if (!c) throw new Error(`FAIL: ${m}`);
  n++;
  console.log(`PASS: ${m}`);
};
var clone = (x) => JSON.parse(JSON.stringify(x));
var strings = JSON.parse(import_node_fs.default.readFileSync("public/locales/en/events.json", "utf8"));
var reg = liveRegistry();
var rules = (r2 = reg, s = strings) => validateRegistry(r2, s);
var has2 = (issues, rule, id2) => issues.some((i) => i.rule === rule && (!id2 || i.id === id2));
ok(summarise(rules()).errors === 0, "shipped content has no validation errors");
ok(reg.synergies.length >= 20 && reg.events.length >= 60, "registry sees every synergy and event");
ok(JSON.stringify(liveRegistry()) === JSON.stringify(reg), "the registry projection is stable");
var r = clone(reg);
r.synergies.push({ ...clone(r.synergies[0]) });
ok(has2(rules(r), "duplicate-id"), "duplicate synergy ids are an error");
ok(has2(rules(r), "duplicate-conditions"), "duplicate conditions are flagged");
r = clone(reg);
r.synergies[0].bonuses.creativityMultiplier = SYNERGY_CAPS.creativityMultiplier + 0.1;
ok(has2(rules(r), "modifier-over-cap", r.synergies[0].id), "a modifier over the cap is an error");
r = clone(reg);
r.synergies[0].bonuses = { staffXpMultiplier: 1.7 };
ok(has2(rules(r), "modifier-near-cap"), "a modifier using most of the headroom is a warning");
r = clone(reg);
r.synergies[0].bonuses = {};
ok(has2(rules(r), "no-bonus"), "a synergy with no bonus is an error");
r = clone(reg);
r.synergies[0].criteria = { requiredStaffRoles: ["Engineer", "Producer"], minStaffCount: 1 };
ok(has2(rules(r), "impossible"), "more required roles than staff is impossible");
r = clone(reg);
r.synergies[0].criteria = {};
ok(has2(rules(r), "matches-everything"), "no conditions is flagged");
r = clone(reg);
r.synergies[0].criteria.roomTypes = ["garage"];
ok(has2(rules(r), "schema"), "an unknown room type fails the schema");
r = clone(reg);
r.synergies[0].id = "Bad Id";
ok(has2(rules(r), "schema"), "a badly formed id fails the schema");
var ev = (i = 0) => reg.events[i].id;
r = clone(reg);
r.events.push(clone(r.events[0]));
ok(has2(rules(r), "duplicate-id") && has2(rules(r), "duplicate-narrative-key"), "duplicate event id and narrative key are errors");
r = clone(reg);
r.events[0].delegable = true;
r.events[0].defaultOptionId = void 0;
ok(has2(rules(r), "delegable-without-default", ev()), "delegable without a default option is an error");
r = clone(reg);
r.events[0].defaultOptionId = "nope";
ok(has2(rules(r), "bad-default", ev()), "a default that is not an option is an error");
r = clone(reg);
r.events[0].cooldownDays = 0;
r.events[0].maxOccurrences = void 0;
ok(has2(rules(r), "modal-no-cooldown", ev()), "a modal event with no cooldown and no limit is a warning");
r = clone(reg);
r.events[0].options[0].effects = [{ kind: "money", amount: 999999 }];
ok(has2(rules(r), "effect-over-limit", ev()), "a reward beyond the safe range is an error");
r = clone(reg);
r.events[0].requiredMemories = ["x-mem"];
r.events[0].blockedMemories = ["x-mem"];
ok(has2(rules(r), "impossible", ev()), "a memory both required and blocked is impossible");
r = clone(reg);
r.events[0].requiredMemories = ["memory-nobody-writes"];
ok(has2(rules(r), "unwritten-memory", ev()), "a memory no option writes is flagged");
ok(has2(rules(reg, { ...strings, [`event.${ev()}.title`]: "" }), "missing-text", ev()), "missing English text is an error");
r = clone(reg);
r.events[0].narrativeKey = "Bad Key";
ok(has2(rules(r), "schema"), "a malformed narrative key fails the schema");
r = clone(reg);
r.briefs.services = r.briefs.services.filter((s) => s.service !== "mix");
ok(has2(rules(r), "no-room-path"), "a service with no room path is an error");
r = clone(reg);
r.briefs.services[0].room = "garage";
ok(has2(rules(r), "schema"), "an unknown room in a brief fails the schema");
r = clone(reg);
r.briefs.approaches[0].focus = { performance: 10, soundCapture: 10, layering: 10 };
ok(has2(rules(r), "focus-sum"), "focus that does not add up is flagged");
var agree = 0;
var total = 0;
for (const fx3 of EVENT_FIXTURES) {
  const eng = new Set(resolveEligibleEvents(fx3.state, DIRECTOR_EVENTS).map((e) => e.def.id));
  for (const def of DIRECTOR_EVENTS) {
    const p = explainEvent(fx3.state, def);
    total++;
    if (p.eligible === eng.has(def.id)) agree++;
    if (!p.eligible && !p.reason) throw new Error("blocked event without a reason");
  }
}
ok(agree === total, `event preview agrees with the engine on ${total} event/fixture pairs`);
ok(EVENT_FIXTURES.some((fx3) => DIRECTOR_EVENTS.some((d) => explainEvent(fx3.state, d).eligible)), "at least one fixture makes events eligible");
var synAgree = (() => {
  let a = 0, t = 0;
  for (const f of SYNERGY_FIXTURES) {
    const staff = f.staffRoles.map((role, i) => ({ id: `st${i}`, name: role, role, assignedProjectId: "p1", primaryStats: { creativity: i === 0 ? f.maxCreativity : 0, technical: i === 0 ? f.maxTechnical : 0 } }));
    const state = {
      studioRooms: [{ id: "studio-a", type: f.room }],
      hiredStaff: staff,
      ownedEquipment: f.categories.map((category, i) => ({ id: `e${i}`, name: category, category, condition: 100 })),
      clientRelationships: { c1: { tier: f.clientTier } }
    };
    const project = { id: "p1", genre: f.genre, clientId: "c1", bookingRoomId: "studio-a" };
    let engine;
    try {
      engine = new Set(evaluateProjectSynergies(project, state).map((s) => s.id));
    } catch {
      return null;
    }
    for (const s of STUDIO_SYNERGIES) {
      t++;
      if (explainSynergy(s, f).matches === engine.has(s.id)) a++;
    }
  }
  return { a, t };
})();
if (synAgree) ok(synAgree.a === synAgree.t, `synergy preview agrees with the engine on ${synAgree.t} pairs`);
var vocal = explainSynergy(STUDIO_SYNERGIES[0], SYNERGY_FIXTURES[1]);
ok(vocal.matches && vocal.checks.length >= 3, "the vocal chain explains each condition it matched");
ok(!explainSynergy(STUDIO_SYNERGIES[0], SYNERGY_FIXTURES[0]).matches, "the vocal chain does not match the bedroom fixture");
var bp = explainBriefGenre(reg.briefs, "Rock");
ok(bp.directions.length > 0 && bp.samples.length === 5 && !bp.usesDefault, "brief preview lists directions and sample briefs");
ok(explainBriefGenre(reg.briefs, "Zydeco").usesDefault, "an unmapped genre falls back to the default directions");
ok(structuredDiff(reg.events[0], clone(reg.events[0])).length === 0, "an unchanged entry has an empty diff");
var d1 = structuredDiff({ a: 1, b: [1, 2], c: "x" }, { a: 2, b: [1], d: true });
ok(d1.length === 4 && d1.some((l) => l.kind === "changed" && l.path === "a") && d1.some((l) => l.kind === "removed" && l.path === "b[1]") && d1.some((l) => l.kind === "added" && l.path === "d") && d1.some((l) => l.kind === "removed" && l.path === "c"), "the diff reports changed, added and removed fields by path");
ok(diffToText(d1).split("\n").length === 4, "the diff prints one line per change");
console.log(`content workbench: ${n} checks passed`);
