// Tutorial Types
import { PerkUnlockCondition } from './studioPerks'; 

export type TutorialPosition = 'top' | 'right' | 'bottom' | 'left' | 'center';

export type TutorialStepAction = {
  type: 'click' | 'select' | 'slide' | 'drag' | 'custom';
  target?: string;
  data?: Record<string, unknown>;
  selector?: string;
  validate?: () => boolean;
};

export interface TutorialStepRequirements { 
  completedSteps?: string[];
  gameState?: Record<string, unknown>; 
}

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  target: string; 
  position: TutorialPosition;
  interactive: boolean; 
  action?: { 
    type: 'click' | 'select' | 'drag' | 'slide' | 'custom'; 
    selector?: string; 
    expectedValue?: unknown; 
  };
  actionHint?: string; 
  nextSteps: string[]; 
  requirements?: TutorialStepRequirements; 
  isSkippable?: boolean; 
  highlightTarget?: boolean; 
}

export interface Tutorial {
  id: string;
  name: string;
  description: string;
  requiredLevel?: number; 
  steps: TutorialStep[];
  entryConditions?: PerkUnlockCondition[]; 
  rewards?: { 
    xp?: number;
    money?: number;
    perkPoints?: number;
    unlocksFeature?: string; 
  };
}

export type TutorialProgress = {
  tutorialId: string;
  completedSteps: string[];
  currentStepId: string | null;
  isCompleted: boolean;
  lastUpdated: number;
  attempts?: number;
};

export interface TutorialPreferences { 
  tutorialSpeed: 'slow' | 'normal' | 'fast';
  showHighlights: boolean;
  showTooltips: boolean;
  soundEnabled: boolean;
  language?: string; 
  theme?: 'light' | 'dark' | 'system'; 
}

export interface TutorialState {
  activeTutorialId: string | null;
  currentStep: TutorialStep | null;
  completedSteps: Set<string>; 
  completedTutorials: Set<string>; 
  completedEras: Set<string>; // Added back
  preferences: TutorialPreferences;
  history: TutorialStep[]; 
}


export type TutorialContextAction =
  | { type: 'START_TUTORIAL'; payload: { tutorialId: string; steps: TutorialStep[] } } 
  | { type: 'COMPLETE_STEP'; payload: { stepId: string } }
  | { type: 'SKIP_TUTORIAL' }
  | { type: 'END_TUTORIAL' } 
  | { type: 'SET_CURRENT_STEP'; payload: { step: TutorialStep | null } }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<TutorialPreferences> }
  | { type: 'LOAD_PROGRESS'; payload: { progress: TutorialProgress[], preferences: TutorialPreferences }}
  | { type: 'CHECK_ERA_PROGRESSION'; payload: { currentEra: string; playerLevel: number } }; // Added back

export interface TutorialContextType {
  state: TutorialState;
  dispatch: React.Dispatch<TutorialContextAction>; 
  startTutorial: (tutorialId: string) => void; 
  completeStep: (stepId: string) => void;
  skipTutorial: () => void;
  endTutorial: () => void;
  updatePreferences: (preferences: Partial<TutorialPreferences>) => void;
  checkEraProgression: (currentEra: string, playerLevel: number) => void; // Added back
  isStepCompleted: (stepId: string) => boolean;
  getTutorialById: (tutorialId: string) => Tutorial | undefined; 
}

export interface TutorialMetrics {
  stepsCompleted: number;
  timeSpent: number; 
  skippedSteps: string[];
  completionRate: number; 
  averageTimePerStep: number; 
}

export interface TutorialAnalyticsStep {
  id: string;
  startTime: number;
  endTime?: number;
  attempts: number;
  completed: boolean;
}
export interface TutorialAnalyticsInteraction {
  type: string; 
  target?: string; 
  timestamp: number;
  data?: Record<string, unknown>;
}
export interface TutorialAnalyticsSession {
  tutorialId: string;
  startTime: number;
  endTime?: number;
  status: 'completed' | 'skipped' | 'abandoned';
  steps: TutorialAnalyticsStep[];
  interactions: TutorialAnalyticsInteraction[];
}


export interface TutorialStorage {
  completedTutorials: string[]; 
  preferences: TutorialPreferences;
  lastUpdated: number;
}

export interface TutorialValidation {
  isValid: boolean;
  errors: {
    field: string;
    message: string;
  }[];
  warnings: {
    field: string;
    message: string;
  }[];
}

export interface TutorialEvent {
  type: 'start' | 'step_complete' | 'tutorial_complete' | 'skip' | 'interaction' | 'error';
  tutorialId: string;
  stepId?: string;
  data?: Record<string, unknown>;
  timestamp: number;
}

export interface TutorialHook {
  isActive: boolean;
  isCompleted: boolean;
  currentTutorial: Tutorial | null;
  currentStep: TutorialStep | null;
  progress: TutorialProgress | null; 
  startTutorial: (tutorialId: string) => void;
  completeCurrentStep: () => void; 
  goToNextStep: (nextStepId?: string) => void; 
  skipTutorial: () => void;
  endTutorial: () => void;
  resetTutorial: (tutorialId: string) => void;
}
