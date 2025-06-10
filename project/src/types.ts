/**
 * Core type definitions for the Music Studio Tycoon game
 */

// Game state interfaces
export interface GameState {
  money: number;
  reputation: number;
  currentDay: number;
  completedProjects: number;
  playerData: PlayerData;
  studioSkills: Record<string, StudioSkill>;
  ownedUpgrades: string[];
  availableProjects: Project[];
  activeProject: Project | null;
  hiredStaff: StaffMember[];
  availableCandidates: StaffMember[];
  hiringUnlocked: boolean;
  lastSalaryDay: number;
}

// Player data and progression
export interface PlayerData {
  xp: number;
  level: number;
  xpToNextLevel: number;
  perkPoints: number;
  attributes: PlayerAttributes;
}

export interface PlayerAttributes {
  focusMastery: number;
  creativeIntuition: number;
  technicalAptitude: number;
  businessAcumen: number;
}

// Studio skills
export interface StudioSkill {
  name: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  color: string;
}

// Projects and stages
export type MatchRating = 'Poor' | 'Good' | 'Excellent';

// Define the names of focus areas
export type FocusAreaName = 'creativity' | 'technical_skill' | 'speed' | 'polish';

// Define the structure for storing focus area values
export interface FocusArea {
  name: FocusAreaName;
  value: number; // 0-100 representing slider position
  creativityWeight: number; // How much this area contributes to creative points
  technicalWeight: number; // How much this area contributes to technical points
  description: string; // Description of what this focus area represents
}

export interface Project {
  id: string;
  title: string;
  genre: string;
  clientType: string;
  difficulty: number;
  durationDaysTotal: number;
  payoutBase: number;
  repGainBase: number;
  requiredSkills: Record<string, number>;
  stages: ProjectStage[];
  matchRating: MatchRating;
  accumulatedCPoints: number;
  accumulatedTPoints: number;
  currentStageIndex: number;
  daysWorked: number;
  assignedStaff: string[];
  focusAreas: FocusArea[]; // Array of focus areas for this project
  status: 'available' | 'pending_customization' | 'in-progress' | 'completed' | 'failed';
}

export interface ProjectStage {
  stageName: string;
  focusAreas: FocusArea[];
  workUnitsRequired: number;
  workUnitsCompleted: number;
}

// Define new interfaces based on usage in completeProject
export interface FocusAreaOutcome {
  name: string;
  value: number;
  creativityPoints: number;
  technicalPoints: number;
  feedback: string;
}

export interface StageOutcome {
  stageName: string;
  workUnitsCompleted: number;
  workUnitsRequired: number;
  creativityPointsEarned: number;
  technicalPointsEarned: number;
  focusAreaOutcomes: FocusAreaOutcome[];
  feedback: string;
}

export interface StaffContributionDetail {
    staffId: string;
    staffName: string;
    role: StaffRole;
    pointsContributed: number;
    feedback: string;
}

// Staff system
export type StaffRole = 'Engineer' | 'Producer' | 'Songwriter' | 'Assistant';
export type StaffStatus = 'Idle' | 'Working' | 'Resting';

export interface StaffStats {
  creativity: number;
  technical: number;
  speed: number;
}

export interface GenreAffinity {
  genre: string;
  bonus: number;
}

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  primaryStats: StaffStats;
  skills: Record<string, number>;
  xpInRole: number;
  levelInRole: number;
  genreAffinity: GenreAffinity | null;
  energy: number;
  salary: number;
  status: StaffStatus;
  assignedProjectId: string | null;
}

// Upgrades
export interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  skillBonuses: Record<string, number>;
  effects: Record<string, number | string | boolean>;
  requirements?: {
    upgrades?: string[];
    reputation?: number;
    skills?: Record<string, number>;
  };
  unlockRequirement?: {
    playerLevel?: number;
    money?: number;
    reputation?: number;
  };
}

// Review data
export interface ProjectReview {
  projectId: string;
  projectTitle: string;
  genre: string;
  finalScore: number;
  rating: number;
  comments: string;
  payout: number;
  repGain: number;
  playerXp: number;
  skillXp: Record<string, number>;
  staffXp?: Record<string, number>;
  stageOutcomes: StageOutcome[];
  staffContributions: StaffContributionDetail[];
  clientSatisfactionFeedback: string;
}

// UI Events
export interface GameEvent {
  type: string;
  payload?: Record<string, unknown>;
}

// Animation helpers
export interface OrbConfig {
  type: 'creativity' | 'technical';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  size: number;
  duration: number;
}