import type { NpcVisualIdentity } from '@/features/sprites/npcAppearance';
import type { GearInstanceFields, DailyClassifiedListing } from '@/features/usedGear/types';
import type { CreatorPieceIds } from '@/features/sprites/staffPortrait';
// Game type definitions
import { Chart, ArtistContact, MarketTrend } from './charts';
import { Client, RecordLabel } from '../game-mechanics/relationship-management';
import { StudioChoreState } from '../simulation/choreEngine';
import { EquipmentPlacement } from './equipmentSlots';

// Card visual states for PixiJS components
export type CardState = 'normal' | 'hover' | 'active' | 'completed';

// Historical eras the player can start a game in
export interface Era {
  id: string;
  name: string;
  displayName: string;
  startYear: number;
  description: string;
  funnyDescription: string;
  startingMoney: number;
  equipmentMultiplier: number;
  availableGenres: string[];
  marketTrends: string[];
  icon: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Legendary';
}

// New Skill interface
export interface Skill {
  xp: number;
  level: number;
  xpToNextLevel: number;
}

export interface PlayerAttributes {
  focusMastery: number;
  creativeIntuition: number;
  technicalAptitude: number;
  businessAcumen: number;
}

export interface PlayerData {
  name?: string;
  appearance?: NpcVisualIdentity;
  xp: number;
  level: number;
  xpToNextLevel: number;
  perkPoints: number;
  attributes: PlayerAttributes;
  dailyWorkCapacity: number;
  reputation: number;
  lastMinigameType?: string; // Track last completed minigame to prevent repetition
  /** Producer origin id from career start (storylines seed). Absent on legacy saves. */
  originId?: string;
  /** Playstyle focus from career start (storylines seed). Absent on legacy saves. */
  playstyle?: string;
  skills: { // NEW as per core_loop_plan.md
    songwriting: Skill;
    rhythm: Skill;
    tracking: Skill;
    mixing: Skill;
    mastering: Skill;
    tapeSplicing: Skill;
    vocalComping: Skill;
    soundDesign: Skill;
    sampleWarping: Skill;
    management: Skill;
  };
}

export interface StudioSkill {
  name: string;
  level: number;
  xp: number;
  xpToNext: number;
}

export interface ProjectStage {
  stageName: string;
  focusAreas: string[];
  workUnitsBase: number;
  workUnitsCompleted: number;
  completed: boolean;
}

export type ClientRelationshipTier =
  | 'Unknown'
  | 'Acquaintance'
  | 'Friendly'
  | 'Regular'
  | 'Loyal'
  | 'Advocate';

export interface ClientRelationship {
  clientId: string;
  clientName: string;
  primaryGenre: string;
  relationshipXp: number;
  tier: ClientRelationshipTier;
  sessionsCompleted: number;
  lastSessionDay: number;
  bestQualityScore: number;
  referralCount: number;
  /** Release history made here (#49). Absent on legacy saves. Career points only ever grow. */
  releases?: import('@/rpg/artistCareer').StudioRelease[];
  careerPoints?: number;
  careerTier?: import('@/rpg/artistCareer').ArtistCareerTier;
}

export interface Project {
  id: string;
  title: string;
  genre: string;
  clientType: string;
  clientId?: string;
  clientName?: string;
  difficulty: number;
  durationDaysTotal: number;
  payoutBase: number;
  repGainBase: number;
  requiredSkills: Record<string, number>;
  stages: ProjectStage[];
  matchRating: 'Poor' | 'Good' | 'Excellent';
  accumulatedCPoints: number;
  accumulatedTPoints: number;
  minigamePoints?: number; // accumulated 0-10 minigame quality bonus (undefined = 0, save-safe).
  currentStageIndex: number;
  completedStages: number[];
  lastWorkDay?: number; // Track when work was last performed
  workSessionCount: number; // Track how many work sessions have been completed (fractional for passive simulation)
  comboCount?: number; // ⚡ consecutive same-day work sessions (streak multiplier)
  overdriveArmed?: boolean; // 🔥 next session burns extra energy for bonus output
  awaitingReview?: boolean; // Work is complete but rewards have not yet been settled
  resolvedInterventionStageKeys?: string[]; // Persist one resolved/ignored intervention opportunity per stage
  gearNotes?: string[]; // Bounded, factual session gear ledger for review
  bookingRoomId?: string; // Physical studio suite reserved for this session
  associatedBandId?: string;
  /** Release id this enquiry follows up (#49). */
  followUpOf?: string;
  /** Booking gamble: safe default; ambitious/moonshot need rank bars (sd3.2). */
  stake?: import('@/rpg/contractStakes').ContractStake;
  /** Per-stage verdicts in stage order (sd3.2 work-loop wiring). */
  stageGrades?: import('@/rpg/stageGrades').StageGrade[];
  /** Sessions spent per stage index (par pacing + grade input). */
  stageSessionsTaken?: number[];
  /** Best minigame take this stage; null = skipped (caps project at A). */
  stageTake?: import('@/rpg/stageGrades').StageTake | null;
  /** Focus Flow aura streak + multiplier (sd3.2). */
  flowStreak?: number;
  flowMultiplier?: number;
  focusAllocation: FocusAllocation; // ADDED: Stores current focus settings for the project
  /** Creative brief (#48). Optional: old saves derive one on read via getProjectBrief. */
  brief?: import('@/rpg/projectBrief').ProjectBrief;
  /** Mid/late-game studio rider (hospitality + gear asks). Absent on early or ungated bookings. */
  rider?: import('@/rpg/studioRider').StudioRider;
  /** Vocal signal chain chosen at booking (#86). */
  signalChain?: import('@/rpg/signalChain').SignalChain;
  /** Open quality issues left by phase events (#87). Cleared by great takes or by polishing before delivery. */
  unresolvedIssues?: import('@/rpg/sessionIssues').UnresolvedIssue[];
  /** Production approach chosen at booking (#48). */
  approachId?: import('@/rpg/projectBrief').ProductionApproach['id'];
  progress?: number; // 0-100, completion percentage for animated cards
  cardState?: CardState; // Current visual state for PixiJS rendering
  textureAtlasKey?: string; // Reference to texture atlas for this project type
  /** Campaign node this featured gig belongs to (story contracts). Absent on ordinary enquiries. */
  storyNodeId?: string;
  /** True for authored story contracts: one per active campaign node, pinned to the top of Bookings. */
  isStoryContract?: boolean;
  /** Rival studio this contract is a showdown against (display + review flavour). */
  rivalStudioId?: string;
  /** Story contracts fix their stake; the booking UI must not let the player downgrade them. */
  stakeLocked?: boolean;
}

/** In-world CV shown in the Crew recruitment portal. Deterministic per candidate seed. */
export interface StaffCurriculumVitae {
  headline: string;
  summary: string;
  traits: string[];
  previousStudios: string[];
  notableCredits: string[];
  yearsExperience: number;
  education: string;
  lookingFor: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: 'Engineer' | 'Producer' | 'Songwriter';
  primaryStats: {
    creativity: number;
    technical: number;
    speed: number;
  };
  xpInRole: number;
  levelInRole: number;
  genreAffinity: { genre: string; bonus: number } | null;
  gearFamiliarity?: Record<string, number>; // Sessions using each piece of gear in a chain (#86, capped)
  equipmentFamiliarity?: Record<string, number>; // 0-5, grows through actual gear use
  clientFamiliarity?: Record<string, number>; // Completed sessions with recurring clients
  /** Discipline experience and seniority (#67). Absent on legacy saves; derived on read. */
  career?: import('@/rpg/staffCareer').StaffCareerState;
  energy: number;
  mood: number; // 0-100, affects work effectiveness
  salary: number;
  status: 'Idle' | 'Working' | 'Resting' | 'Training' | 'Researching' | 'On Tour';
  assignedProjectId: string | null;
  trainingEndDay?: number;
  trainingCourse?: string;
  researchingModId?: string | null;
  researchEndDay?: number;
  /** Deterministic modular portrait identity (create-a-character / npc-parts). */
  appearance?: NpcVisualIdentity;
  portraitSeed?: number;
  /** Optional creator piece IDs; see staffPortrait.ts integration notes. */
  pieceIds?: CreatorPieceIds;
  /** Clickable CV for the recruitment portal. */
  cv?: StaffCurriculumVitae;
  skills: { // UPDATED as per core_loop_plan.md
    songwriting: Skill;
    rhythm: Skill;
    tracking: Skill;
    mixing: Skill;
    mastering: Skill;
    tapeSplicing: Skill;
    vocalComping: Skill;
    soundDesign: Skill;
    sampleWarping: Skill;
  };
}

export type EquipmentCategory = 'microphone' | 'monitor' | 'interface' | 'outboard' | 'instrument' | 'software' | 'recorder' | 'mixer';

export interface Equipment extends GearInstanceFields {
  id: string;
  name: string;
  category: EquipmentCategory;
  price: number;
  description: string;
  bonuses: {
    genreBonus?: Record<string, number>;
    qualityBonus?: number;
    speedBonus?: number;
    creativityBonus?: number;
    technicalBonus?: number;
  };
  icon: string;
  skillRequirement?: {
    skill: string;
    level: number;
  };
  condition: number; // 0-100, where 100 is perfect condition
  appliedModId?: string | null; // ID of the currently applied mod
}

export interface EquipmentMod {
  id: string;
  name: string; 
  description: string;
  modifiesEquipmentId: string; 
  statChanges: Partial<Equipment['bonuses']>; 
  iconOverride?: string; 
  nameSuffix?: string; 
  researchRequirements: {
    engineerSkill: string; 
    engineerSkillLevel: number;
    researchTime: number; 
    cost: number;
  };
}

export type StudioRoomType =
  | 'project-studio'
  | 'vocal-suite'
  | 'live-room'
  | 'mix-suite';

export type StudioRoomStageKind =
  | 'tracking'
  | 'production'
  | 'mixing'
  | 'mastering'
  | 'general';

export interface StudioRoom {
  id: string;
  name: string;
  type: StudioRoomType;
  unlocked: boolean;
  level: number;
  purchaseCost: number;
  requiredPlayerLevel: number;
  supportedStageKinds: StudioRoomStageKind[];
  qualityBonus: number;
  speedBonus: number;
}

export interface TrainingCourse {
  id: string;
  name: string;
  description: string;
  cost: number;
  duration: number;
  effects: {
    statBoosts?: {
      creativity?: number;
      technical?: number;
      speed?: number;
    };
    skillXP?: {
      skill: string;
      amount: number;
    };
    specialEffects?: string[];
  };
  requiredLevel: number;
  /** Know-How cost + domain familiarity required to enrol (#66). */
  knowHow?: import('@/rpg/studioKnowHow').KnowHowGate;
  /** Domain that completing this course teaches. */
  domain?: import('@/rpg/studioKnowHow').KnowHowDomain;
}

import { Band, SessionMusician, OriginalTrackProject } from './bands';

export interface GameState {
  money: number;
  influence: number; // New resource: Influence
  creativeCapital: number; // New resource: Creative Capital
  currentEra: string; // Current Era ID
  reputation: number;
  currentDay: number;
  currentYear: number; // Current year in the game world
  selectedEra: string; // Era ID that was selected at game start
  eraStartYear: number; // Year when the current era started
  equipmentMultiplier: number; // Price multiplier for equipment in this era
  /** Stable run seed for deterministic systems (storylines, sim). Absent on legacy saves. */
  saveSeed?: number | string;
  /** Branching campaign + subplot tracker (bead 283.3). Absent on legacy saves. */
  storylineState?: import('@/narrative/branchingStorylineEngine').StorylineState;
  /** Producer name + sprite look chosen at career start (#126). Migrated onto legacy saves. */
  producerCustomization?: import('@/types/character').ProducerCustomization;
  playerData: PlayerData;
  studioSkills: Record<string, StudioSkill>;
  ownedUpgrades: string[];
  ownedEquipment: Equipment[];
  dailyClassifieds?: { day: number; listings: DailyClassifiedListing[] };
  /** Slot-based equipment placements (bead 8om). Absent on legacy saves. */
  equipmentPlacements?: EquipmentPlacement[];
  availableProjects: Project[];
  financials: Financials;
  /** Append-only money journal (issue #83). Absent on legacy saves; starts on first booking. */
  ledger?: import('@/economy/ledger').LedgerState;
  /** Optional: absent on old saves, treated as a fresh day. */
  dailyTracking?: DailyTracking;
  clientRelationships?: Record<string, ClientRelationship>;
  studioLevel?: number; // Studio tier level (1-5), drives visible studio room and console upgrades
  studioTier?: number; // Alias for studioLevel
  studioRooms: StudioRoom[]; // Physical bookable studio suites; drives concurrent capacity
  /** Studio Know-How progression (#66). Absent on legacy saves; migrated to an empty state. */
  studioKnowHow?: import('@/rpg/studioKnowHow').StudioKnowHow;
  /** Studio house style / expertise (#71). Absent on legacy saves; migrated to empty. */
  studioExpertise?: import('@/rpg/houseStyle').StudioExpertise;
  /** Studio premises tier (#70): 0 borrowed room, 1 project studio. Absent on legacy saves = 0. */
  premisesTier?: 0 | 1;
  chainTemplates?: import('@/rpg/signalChain').SignalChain[]; // Saved chain templates (#86)
  discoveredBriefCombos?: string[]; // Named brief/recipe combos discovered (#48)
  discoveredSynergies?: string[]; // IDs of discovered studio synergies (Kairosoft recipe codex)
  
  // Multi-project system
  activeProjects: Project[]; // Replace single activeProject with array
  maxConcurrentProjects: number; // Based on studio level/size
  activeProject: Project | null; // Keep for backward compatibility during transition
  
  hiredStaff: StaffMember[];
  availableCandidates: StaffMember[];
  lastSalaryDay: number;
  /** Day the gig list was last refreshed from the phone (bead goj.3 cooldown). */
  lastGigRefreshDay?: number;
  notifications: GameNotification[];
  bands: Band[]; // All bands (AI and player-created)
  /** Player's own bands */
  playerBands: Band[];
  /** A&R roster of signed artists (artist contracts). Absent on legacy saves. */
  signedArtists?: import('@/simulation/artistContracts').SignedArtist[];
  /** Ambient active-play trickle counters (economy/ambientIncome). Absent on legacy saves. */
  ambientIncome?: import('@/economy/ambientIncome').AmbientIncomeState;
  /** Prospect ids the player negotiated with and walked away from. Absent on legacy saves. */
  passedProspects?: string[];
  availableSessionMusicians: SessionMusician[];
  activeOriginalTrack: OriginalTrackProject | null;
  // Charts system data
  chartsData?: {
    charts: Chart[];
    contactedArtists: ArtistContact[];
    marketTrends: MarketTrend[];
    discoveredArtists: Artist[]; // Artists found in charts
    lastChartUpdate: number; // Day when charts were last updated
  };
  /** Player songs currently on the weekly chart run (see utils/chartRun). */
  chartRun?: import('../utils/chartRun').ChartRunEntry[];
  /** Studio Seasons (#63): season clock, focus, delivery ledger and yearbook. Absent on legacy saves. */
  studioSeasons?: import('@/rpg/studioSeasons').StudioSeasonState;
  researchedMods: string[]; // Array of researched mod IDs
  clients?: Client[];
  recordLabels?: RecordLabel[];
  
  // Automation system
  automation?: {
    enabled: boolean;
    mode: AutomationMode;
    settings: AutomationSettings;
    efficiency: { [projectId: string]: number };
  };
  
  // Animation state tracking
  animations?: {
    projects: { [projectId: string]: ProjectAnimationState };
    staff: { [staffId: string]: StaffAnimationState };
    globalEffects: GlobalAnimationState;
  };
  activeMinigame: string | null;
  // Studio maintenance chores & pending loot crates
  choreState?: StudioChoreState;
  pendingCrates?: Array<{
    id: string;
    era: string;
    source: 'chore_streak' | 's_grade_take' | 'yard_sale' | 'shop_money' | 'shop_gems' | 'reward';
    /** Legacy 2-tier ids stay valid; the economy resolves them via legacyTierToFlightCase. */
    tier: 'standard' | 'vintage_flight_case' | 'cardboard_box' | 'road_case' | 'tour_trunk' | 'holy_grail_vault';
    generatedDay?: number;
    generatedYear?: number;
    generatedPriceMultiplier?: number;
  }>;
  /** Premium-feel soft currency (bead: flight cases + gems). Absent on legacy saves = 0. */
  gems?: number;
  /** Holding area for flight case finds the player stashed; claim via used-gear economy into ownedEquipment. */
  caseFinds?: Array<{
    id: string;
    name: string;
    era: string;
    rarity: string;
    condition: number;
    baseValue: number;
    /** Present when the find was already materialized upstream (box-drop path). */
    equipment?: import('@/features/usedGear/types').EquipmentInstance;
  }>;
  /** Unlocked achievements: id -> game day it was earned. Absent on legacy saves. */
  unlockedAchievements?: Record<string, number>;
  /** Set once the campaign epilogue has been shown, so it never replays. */
  endingSeen?: boolean;
}

export interface Artist {
  id: string;
  name: string;
  genre: string;
  popularity: number;
  demandLevel: number;
  priceRange: { min: number; max: number };
}

export interface GameNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'historical';
  timestamp: number;
  duration?: number;
  priority?: 'low' | 'medium' | 'high';
}

export interface FocusAllocation {
  performance: number;
  soundCapture: number;
  layering: number;
}

// Multi-project automation types
export type AutomationMode = 'off' | 'basic' | 'smart' | 'advanced';

export interface AutomationSettings {
  priorityMode: 'deadline' | 'profit' | 'reputation' | 'balanced';
  minStaffPerProject: number;
  maxStaffPerProject: number;
  workloadDistribution: 'even' | 'focus_one' | 'adaptive';
  pauseOnIssues: boolean;
  notifyOnMilestones: boolean;
}

export interface ProjectAnimationState {
  isActive: boolean;
  workIntensity: number; // 0-1, affects animation speed/intensity
  staffCount: number; // Number of staff working on this project
  progressPulse: boolean; // Whether to show progress bar pulse
  automationPulse?: boolean; // Whether the automation system is acting on this project
  lastUpdate: number; // Timestamp of last animation update
}

export interface StaffAnimationState {
  currentAction: 'idle' | 'working' | 'moving' | 'focused';
  workIntensity: number; // 0-1, affects animation speed
  assignedProjects: string[]; // Project IDs staff is working on
  focusTransition: boolean; // Whether staff is transitioning between projects
  lastActionChange: number; // Timestamp of last action change
}

export interface GlobalAnimationState {
  studioActivity: number; // 0-1, overall studio activity level
  projectTransitions: { [projectId: string]: boolean }; // Projects undergoing transitions
  automationPulse: boolean; // Whether to show automation system activity
  lastGlobalUpdate: number; // Timestamp of last global animation update
}

// New Project Report interfaces as per core_loop_plan.md
export interface ProjectReportSkillEntry {
  skillName: string;
  initialXp: number;
  xpGained: number;
  finalXp: number;
  initialLevel: number;
  finalLevel: number;
  xpToNextLevelBefore: number;
  xpToNextLevelAfter: number;
  levelUps: number; // Number of times this skill leveled up
  score: number; // 0-100, skill contribution to project quality
}

export interface ProjectReport {
  projectId: string;
  projectTitle: string;
  overallQualityScore: number; // 0-100, final calculated quality
  moneyGained: number;
  reputationGained: number;
  playerManagementXpGained: number; // If staff worked
  skillBreakdown: ProjectReportSkillEntry[];
  reviewSnippet: string; // e.g., "Groundbreaking sound design, but the rhythm section feels a little loose."
  assignedPerson: { // Details of who worked on it
    type: 'player' | 'staff';
    id: string;
    name: string;
  };
  genre?: string;
  /** Studio Know-How earned by resolving issues before delivery (#87, capped per project). */
  knowHowGained?: number;
}

export interface Financials {
  income: number;
  expenses: number;
  profit: number;
  reports: ProjectReport[];
}

/** Per-day activity counters powering the deterministic daily challenge. */
export interface DailyTracking {
  day: number;
  earnedToday: number;
  minigamesPlayedToday: number;
  maxComboToday: number;
  projectsCompletedToday: number;
  sessionsWorkedToday: number;
  challengeDoneId: string | null;
  /** Consecutive challenge-complete days (retention streak, never negative). */
  streakCount?: number;
  /** Game day the streak was last extended. */
  lastStreakDay?: number | null;
  /** Banked streak shields (max 1, earned at 7d, auto-consumed on a miss). */
  streakShield?: number;
}
