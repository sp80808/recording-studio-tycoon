/**
 * Pure new-game state factory (extracted from useGameState so it can be tested and reused).
 * Career-start choices — era and producer origin — are applied here: the origin sets the
 * starting attributes, playstyle and origin id that the campaign, rival and perks read.
 */
import type { GameState } from '@/types/game';
import type { ProducerBackgroundId } from '@/types/character';
import { parseNpcVisualIdentity } from '@/features/sprites/npcAppearance';
import { generateNewProjects, generateCandidates } from '@/utils/projectUtils';
import { generateSessionMusicians } from '@/utils/bandUtils';
import { ProgressionSystem } from '@/services/ProgressionSystem';
import { resolvePlayerLevelUps } from '@/utils/playerUtils';
import { initializeSkillsPlayer } from '@/utils/skillUtils';
import { createInitialKnowHow } from '@/rpg/studioKnowHow';
import { createDefaultStudioRooms } from '@/utils/studioRoomUtils';
import { visualEraId } from '@/utils/eraProgression';
import { createInitialChoreState } from '@/simulation/choreEngine';
import { initializeStorylineState } from '@/narrative/branchingStorylineEngine';
import { getProducerOrigin } from '@/narrative/characterOrigins';
import { createProducerCustomization } from '@/utils/producerCustomization';
import { isProducerOriginId, startingAttributesFor } from '@/narrative/originPerks';

export interface EraInitOptions {
  startingMoney: number;
  selectedEra: string;
  eraStartYear: number;
  currentYear: number;
  equipmentMultiplier: number;
  /** Producer origin picked at career start (perks, attributes, playstyle, rival). */
  originId?: ProducerBackgroundId;
  /** Producer name chosen at career start (#126). */
  producerName?: string;
  /** Hair / clothes colour / accessory picked at career start (#126); repaired if malformed. */
  producerAppearance?: unknown;
  /**
   * Legacy creator payload (name + layered sprite identity). Still honoured so
   * older callers and saves keep working; explicit producerName/Appearance win.
   */
  producer?: { name?: string; appearance?: unknown };
  /** Fixed run seed (tests / replays). Defaults to Date.now() for a fresh run. */
  saveSeed?: number | string;
}

export const createDefaultGameState = (options?: Partial<EraInitOptions>): GameState => {
  const originId = isProducerOriginId(options?.originId) ? options!.originId : undefined;
  const legacyAppearance = parseNpcVisualIdentity(options?.producer?.appearance);
  const producerName =
    options?.producerName?.trim().slice(0, 24) ||
    options?.producer?.name?.trim().slice(0, 24) ||
    'The Architect';
  const baseAttributes = { focusMastery: 1, creativeIntuition: 1, technicalAptitude: 1, businessAcumen: 1 };
  return {
    money: options?.startingMoney || 3500,
    influence: 0, // Initialize Influence
    creativeCapital: 0, // Initialize Creative Capital
    activeMinigame: null, // No minigame active by default
    reputation: 10,
    currentDay: 2,
    currentYear: options?.currentYear || 1960, // Start in 1960s era
    currentEra: visualEraId(options?.selectedEra || 'analog60s'),
    selectedEra: options?.selectedEra || 'analog60s',
    eraStartYear: options?.eraStartYear || 1960,
    equipmentMultiplier: options?.equipmentMultiplier || 0.3, // Lower prices in 1960s
    producerCustomization: createProducerCustomization({
      name: producerName,
      originId,
      appearance: options?.producerAppearance,
    }),
    playerData: {
      name: producerName,
      ...(legacyAppearance ? { appearance: { ...legacyAppearance, role: 'producer' as const } } : {}),
      xp: 0,
      level: 1,
      xpToNextLevel: 100,
      perkPoints: 3,
      dailyWorkCapacity: 5,
      reputation: 10, // Add reputation to PlayerData
      attributes: originId ? startingAttributesFor(baseAttributes, originId) : baseAttributes,
      // Origin + playstyle feed the campaign seed, rival and perks. Legacy saves leave both unset.
      ...(originId ? { originId, playstyle: getProducerOrigin(originId).primaryPlaystyle } : {}),
      skills: initializeSkillsPlayer(), // Initialize player skills
    },
    studioSkills: {
      // This seems to be old/genre-specific skills, distinct from new player skills
      Rock: { name: 'Rock', level: 1, xp: 0, xpToNext: 20 },
      Pop: { name: 'Pop', level: 1, xp: 0, xpToNext: 20 },
      Electronic: { name: 'Electronic', level: 1, xp: 0, xpToNext: 20 },
      Hiphop: { name: 'Hip-hop', level: 1, xp: 0, xpToNext: 20 },
      Acoustic: { name: 'Acoustic', level: 1, xp: 0, xpToNext: 20 },
    },
    ownedUpgrades: [],
    ownedEquipment: [
      {
        id: 'basic_mic',
        name: 'Basic USB Mic',
        category: 'microphone',
        price: 0,
        description: 'Standard starter microphone',
        bonuses: { qualityBonus: 0 },
        icon: '🎤',
        condition: 100, // Add default condition for starting equipment
      },
      {
        id: 'basic_monitors',
        name: 'Basic Speakers',
        category: 'monitor',
        price: 0,
        description: 'Standard studio monitors',
        bonuses: { qualityBonus: 0 },
        icon: '🔊',
        condition: 100, // Add default condition for starting equipment
      },
    ],
    availableProjects: [],
    studioRooms: createDefaultStudioRooms(),
    discoveredSynergies: [],
    studioKnowHow: createInitialKnowHow(),
    premisesTier: 0,
    activeProject: null, // Keep for backward compatibility
    // Multi-project system
    activeProjects: [], // New multi-project array
    maxConcurrentProjects: 1, // Derived from the starter Studio A room
    hiredStaff: [],
    availableCandidates: [],
    lastSalaryDay: 0,
    notifications: [],
    bands: [],
    playerBands: [],
    availableSessionMusicians: [],
    activeOriginalTrack: null,
    chartsData: {
      charts: [],
      contactedArtists: [],
      marketTrends: [],
      discoveredArtists: [],
      lastChartUpdate: 0,
    },
    researchedMods: [],
    // Automation system
    automation: {
      enabled: false,
      mode: 'off',
      settings: {
        priorityMode: 'balanced',
        minStaffPerProject: 1,
        maxStaffPerProject: 3,
        workloadDistribution: 'adaptive',
        pauseOnIssues: true,
        notifyOnMilestones: true,
      },
      efficiency: {},
    },
    // Animation state tracking
    animations: {
      projects: {},
      staff: {},
      globalEffects: {
        studioActivity: 0,
        projectTransitions: {},
        automationPulse: false,
        lastGlobalUpdate: Date.now(),
      },
    },
    financials: {
      // Initialize financials
      income: 0,
      expenses: 0,
      profit: 0,
      reports: [],
    },
    dailyTracking: {
      // Daily challenge counters (bead ifx.3)
      day: 2,
      earnedToday: 0,
      minigamesPlayedToday: 0,
      maxComboToday: 0,
      projectsCompletedToday: 0,
      sessionsWorkedToday: 0,
      challengeDoneId: null,
    },
    choreState: createInitialChoreState(),
    pendingCrates: [],
  };
};

export const createNewGameState = (options?: Partial<EraInitOptions>): GameState => {
  let newGameState = createDefaultGameState(options);
  const currentEra = newGameState.currentEra;
  const initialProjects = generateNewProjects(3, 1, currentEra);
  const initialCandidates = generateCandidates(3);
  const initialSessionMusicians = generateSessionMusicians(5);

  // Set initial progression-based values
  newGameState = resolvePlayerLevelUps(newGameState);
  const maxConcurrentProjects = ProgressionSystem.getMaxConcurrentProjects(newGameState);

  // Branching storylines (bead 283.3): seed a deterministic campaign on new runs.
  // Per-run saveSeed keeps procedural rivals/text unique while remaining reproducible.
  newGameState = initializeStorylineState({
    ...newGameState,
    availableProjects: initialProjects,
    availableCandidates: initialCandidates,
    availableSessionMusicians: initialSessionMusicians,
    maxConcurrentProjects,
    saveSeed: newGameState.saveSeed ?? options?.saveSeed ?? Date.now(),
  });

  return newGameState;
};
