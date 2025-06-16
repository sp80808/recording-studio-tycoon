// Game type definitions
import { Chart, ArtistContact, MarketTrend, MusicGenre } from './charts'; // MusicGenre is imported here
import { MinigameType } from './miniGame';
import {
  OriginalTrackProject,
  BandRelease,
  Band as BandTypeFromBands
} from './bands';
import { PerformanceHistoryEntry, PerformanceRating } from './performance';
import { Tour, TourStop, TourVenue } from './tours';
import { Client, RecordLabel, PREvent } from './relationships'; // Import Client, RecordLabel, and PREvent
import { Song } from './songs'; // Import Song type

export type { BandTypeFromBands as Band };
export type { Tour, TourStop, TourVenue };
export type { MinigameType };
export type { OriginalTrackProject };
export type { MusicGenre }; // Re-export MusicGenre

export interface PlayerAttributes {
  focusMastery: number;
  creativeIntuition: number;
  technicalAptitude: number;
  businessAcumen: number;
  creativity: number;
  technical: number;
  business: number;
  charisma: number;
  luck: number;
}

export interface PlayerData {
  name: string;
  level: number;
  experience: number;
  money: number;
  reputation: number;
  skills: {
    [key in StudioSkillType]: number; // This stores skill levels for the player
  };
  xp: number;
  xpToNextLevel: number;
  perkPoints: number;
  attributePoints?: number;
  attributes: PlayerAttributes;
  dailyWorkCapacity: number;
  lastMinigameType?: MinigameType;
}

export interface StudioSkillBonus {
  projectQuality?: number;
  workSpeed?: number;
  clientSatisfaction?: number;
  trainingEfficiency?: number;
  equipmentEfficiency?: number;
  moneyGain?: number;
}
export type StudioSkillType =
  | 'recording'
  | 'mixing'
  | 'mastering'
  | 'production'
  | 'marketing'
  | 'composition'
  | 'soundDesign'
  | 'sequencing';

export interface StudioSkill { // This is used for StaffMember.skills and GameState.studioSkills (which might be a list of all possible skills)
  name: StudioSkillType;
  level: number;
  experience: number;
  multiplier: number;
  xpToNextLevel?: number; // Added optional xpToNextLevel
}

export interface ProjectStage {
  stageName: string;
  focusAreas: string[];
  workUnitsBase: number;
  workUnitsCompleted: number;
  completed: boolean;
  workUnitsRequired?: number;
  id?: string;
  specialEvents?: StageEvent[];
  stageBonuses?: { creativity?: number; technical?: number };
  requiredSkills?: Record<string, number>;
  minigameTriggerId?: MinigameType;
  qualityMultiplier?: number;
  timeMultiplier?: number;
  minigameTriggers?: MinigameTrigger[];
}

export interface WorkUnit {
  type: 'creativity' | 'technical';
  value: number;
  source: 'player' | 'staff';
  sourceId?: string;
  timestamp: number;
}

export interface StageEvent {
  id: string;
  type: 'minigame' | 'choice' | 'technical_challenge' | 'creative_challenge' | 'client_request';
  triggerCondition: (stage: ProjectStage) => boolean;
  active: boolean;
  description: string;
  choices?: {
    text: string;
    effects: { type: 'quality' | 'efficiency' | 'money' | 'reputation' | 'xp'; value: number }[];
  }[];
}

export interface MinigameTrigger {
  id: string;
  type: MinigameType;
  difficulty?: number;
  rewards: {
    type: 'quality' | 'speed' | 'xp' | 'efficiency' | 'reputation';
    value: number;
  }[];
  triggerReason?: string;
  lastTriggered?: number;
}

export interface Project {
  id: string;
  title: string;
  genre: string;
  subGenreId?: string;
  clientType: string;
  difficulty: number;
  durationDaysTotal: number;
  payoutBase: number;
  repGainBase: number;
  requiredSkills: Partial<Record<StudioSkillType, number>>;
  stages: ProjectStage[];
  matchRating: 'Poor' | 'Good' | 'Excellent';
  accumulatedCPoints: number;
  accumulatedTPoints: number;
  currentStageIndex: number;
  completedStages: number[];
  lastWorkDay?: number;
  workSessionCount: number;
  associatedBandId?: string;
  qualityScore?: number;
  efficiencyScore?: number;
  isCompleted?: boolean;
  endDate?: number;
  targetMood?: string;
  deadlineDay?: number;
  contractProviderId?: string;
  contractProviderType?: 'client' | 'recordLabel';
}

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  primaryStats: StaffStats;
  xpInRole: number;
  levelInRole: number;
  genreAffinity: GenreAffinity | null;
  status: 'Idle' | 'Working' | 'Resting' | 'Training' | 'On Tour';
  salary: number;
  contractEndDate: number;
  experience: number; // General experience, distinct from skill-specific XP
  skills?: Partial<Record<StudioSkillType, StudioSkill>>; // Staff skills are StudioSkill objects
  assignedProjectId?: string | null;
  mood?: number;
}

export type StaffRole = 'Engineer' | 'Producer' | 'Songwriter' | 'Mix Engineer' | 'Mastering Engineer' | 'Sound Designer';

export interface StaffStats {
  creativity: number;
  technical: number;
  speed: number;
}

export interface GenreAffinity {
  genre: string;
  bonus: number;
}

export type EquipmentCategory = 'microphone' | 'monitor' | 'interface' | 'outboard' | 'instrument' | 'software' | 'recorder' | 'mixer';

export interface Equipment {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  bonuses: {
    qualityBonus?: number;
    technicalBonus?: number;
    creativityBonus?: number;
    speedBonus?: number;
    genreBonus?: Record<string, number>;
  };
  icon: string;
  condition: number;
  skillRequirement?: {
    skill: StudioSkillType;
    level: number;
  };
  appliedModId?: string;
}

export interface EraAvailableEquipment extends Equipment {
  availableFrom: number;
  availableUntil?: number;
  eraDescription?: string;
  isVintage?: boolean;
  historicalPrice?: number;
}

export interface MinigameDataReward {
  [key: string]: { min: number; max: number } | number;
}

export interface Minigame {
  id: string;
  name: string;
  description: string;
  duration: number;
  cost: number;
  rewards: MinigameDataReward;
  type?: MinigameType;
}

export interface TrainingCourse {
  id: string;
  name: string;
  description: string;
  cost: number;
  duration: number;
  effects: {
    statBoosts?: Partial<StaffStats>;
    skillXP?: {
      skill: StudioSkillType;
      amount: number;
    };
    specialEffects?: string[];
  };
  requiredLevel: number;
}

export interface GameState {
  money: number;
  currentEra: string;
  reputation: number;
  currentDay: number;
  currentYear: number;
  selectedEra: string;
  eraStartYear: number;
  equipmentMultiplier: number;
  playerData: PlayerData;
  studioSkills: Record<StudioSkillType, StudioSkill>; // Represents all possible skills and their current state for the studio/player if player has them
  ownedUpgrades: string[];
  ownedEquipment: Equipment[];
  availableProjects: Project[];
  activeProject: Project | null;
  hiredStaff: StaffMember[];
  availableCandidates: StaffMember[];
  lastSalaryDay: number;
  notifications: GameNotification[];
  bands: BandTypeFromBands[];
  playerBands: BandTypeFromBands[];
  availableSessionMusicians: SessionMusician[];
  activeOriginalTrack: OriginalTrackProject | null;
  songs: Song[]; // Add songs array to GameState
  chartsData?: {
    charts: Chart[];
    contactedArtists: ArtistContact[];
    marketTrends: MarketTrend[];
    discoveredArtists: DiscoveredArtist[];
    lastChartUpdate: number;
  };
  focusAllocation: FocusAllocation;
  completedProjects?: Project[];
  levelUpDetails: LevelUpDetails | null;
  unlockedFeatures?: string[];
  availableTraining?: string[];
  availableExpansions: StudioExpansion[];
  marketTrends: {
    currentTrends: MarketTrend[];
    historicalTrends: MarketTrend[];
  };
  venues: TourVenue[];
  tours: Tour[];
  lastMinigameTriggers?: Partial<Record<MinigameType, number>>;
  aggregatedPerkModifiers?: AggregatedPerkModifiers;
  clients: Client[]; // Added for tiered contract generation
  recordLabels: RecordLabel[]; // Added for tiered contract generation
  activePREvents?: PREvent[]; // List of currently active PR events
}

export interface AggregatedPerkModifiers {
  globalRecordingQualityModifier: number;
  globalMixingQualityModifier: number;
  globalMasteringQualityModifier: number;
  contractPayoutModifier: number;
  researchSpeedModifier: number;
  staffHappinessModifier: number;
  staffTrainingSpeedModifier: number;
  marketingEffectivenessModifier: number;
  projectAppealModifier: Record<MusicGenre | 'all', number>;
  candidateQualityBonus: number; // Explicitly a number, as it's initialized in defaultModifiers
  // Allow other dynamic string keys for future flexibility
  [key: string]: number | Record<string, number>;
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
  creativity: number;
  technical: number;
  business: number;
}

export interface ProjectReport {
  projectTitle: string;
  qualityScore: number;
  efficiencyScore: number; // Added for completeness, ensure it's calculated or defaulted
  finalScore: number; // Added for completeness
  payout: number;
  repGain: number;
  xpGain: number; // This should be player's XP gain (e.g. management XP or direct project XP if player worked)
  review: {
    qualityScore: number;
    payout: number;
    xpGain: number; // This is likely redundant if main xpGain is player's. Clarify purpose.
    creativityPoints?: number;
    technicalPoints?: number;
    // skillBreakdown and reviewSnippet are not typically part of this nested review object
  };
  isCriticalSuccess?: boolean;
  // skillBreakdown?: ProjectReportSkillEntry[]; // Add if it's part of the top-level report
  // reviewSnippet?: string; // Add if it's part of the top-level report
}

export interface DiscoveredArtist {
  id: string;
  name: string;
  priceRange?: {
    min: number;
    max: number;
  };
  demandLevel?: number;
  genre?: string;
  popularity?: number;
}

export interface UnlockedFeatureInfo {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category: 'Minigame' | 'Equipment' | 'Studio Upgrade' | 'Staff Tier' | 'Project Type' | 'Mechanic';
}

export interface PlayerAbilityChange {
  name: string;
  oldValue: string | number;
  newValue: string | number;
  unit?: string;
  description?: string;
}

export interface PlayerAttributeChange {
  name: keyof PlayerAttributes;
  oldValue: number;
  newValue: number;
}

export interface ProjectPerformanceSummary {
  projectId: string;
  projectTitle: string;
  genre: string;
  finalScore: number;
  qualityTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
}

export interface StaffProgressionHighlight {
  staffId: string;
  staffName: string;
  skillIncreased?: StudioSkillType;
  newSkillLevel?: number;
  newAbilityUnlocked?: string;
}

export interface LevelUpDetails {
  newPlayerLevel: number;
  unlockedFeatures: UnlockedFeatureInfo[];
  abilityChanges: PlayerAbilityChange[];
  attributeChanges: PlayerAttributeChange[];
  projectSummaries: ProjectPerformanceSummary[];
  staffHighlights: StaffProgressionHighlight[];
}

export interface MilestoneReward {
  level: number;
  unlockedFeatures?: string[];
  newEquipment?: string[];
  newTrainingCourses?: string[];
  attributePoints?: number;
  perkPoints?: number;
}

export type StudioSkillTemplates = Record<string, Omit<StudioSkill, 'level' | 'experience' | 'multiplier'>>;

export interface StudioExpansion {
  id: string;
  name: string;
  description: string;
  cost: number;
  requirements: {
    level: number;
    reputation: number;
  };
  benefits: {
    [key: string]: number;
  };
}

export interface SessionMusician {
  id: string;
  name: string;
  role: string;
  primaryStats: {
    creativity: number;
    technical: number;
  };
  experience: number;
  dailyRate: number;
}

export interface StageTemplate {
  stageName: string;
  focusAreas: string[];
  workUnitsBase: number;
  requiredSkills?: Partial<Record<StudioSkillType, number>>;
  stageBonuses?: { creativity?: number; technical?: number };
  minigameTriggerId?: MinigameType;
}

export interface ProjectTemplate {
  id: string;
  titlePattern: string;
  genre: string;
  clientType: string;
  difficulty: number;
  durationDaysTotal: number;
  payoutBase: number;
  repGainBase: number;
  era: string;
  stages: StageTemplate[];
}
