// Tutorial Types

export type TutorialPosition = 'top' | 'right' | 'bottom' | 'left' | 'center';

export type TutorialStepAction = {
  type: 'click' | 'select' | 'slide' | 'drag' | 'custom';
  target?: string;
  data?: Record<string, unknown>;
  selector?: string;
  validate?: () => boolean;
};

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  target: string;
  position: TutorialPosition;
  interactive: boolean;
  action: {
    type: 'click' | 'select' | 'drag' | 'slide';
    selector: string;
  };
  actionHint: string;
  nextSteps: string[];
}

export interface Tutorial {
  id: string;
  name: string;
  description: string;
  requiredLevel: number;
  steps: TutorialStep[];
}

export type TutorialProgress = {
  tutorialId: string;
  completedSteps: string[];
  lastStep: string;
  completed: boolean;
  lastUpdated: number;
};

export interface TutorialState {
  currentStep: TutorialStep | null;
  completedSteps: Set<string>;
  completedEras: Set<string>;
  preferences: {
    tutorialSpeed: 'slow' | 'normal' | 'fast';
    showHighlights: boolean;
    showTooltips: boolean;
    soundEnabled: boolean;
  };
  history: TutorialStep[];
  activeTutorialId: string | null;
}

export interface TutorialStepRequirements {
  completedSteps?: string[];
  gameState?: Record<string, unknown>;
}

export type TutorialContextAction =
  | { type: 'START_TUTORIAL'; payload: { tutorialId: string } }
  | { type: 'COMPLETE_STEP'; payload: string }
  | { type: 'SKIP_TUTORIAL' }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<TutorialPreferences> }
  | { type: 'CHECK_ERA_PROGRESSION'; payload: { currentEra: string; playerLevel: number } };

export interface TutorialContextType {
  state: TutorialState;
  startTutorial: (tutorialId: string) => void;
  completeStep: (stepId: string) => void;
  skipTutorial: () => void;
  updatePreferences: (preferences: Partial<TutorialPreferences>) => void;
  checkEraProgression: (currentEra: string, playerLevel: number) => void;
}

export interface TutorialMetrics {
  stepsCompleted: number;
  timeSpent: number;
  skippedSteps: string[];
  completionRate: number;
  averageTimePerStep: number;
}

export interface TutorialAnalytics {
  startTime: number;
  endTime?: number;
  steps: {
    id: string;
    startTime: number;
    endTime?: number;
    attempts: number;
    completed: boolean;
  }[];
  interactions: {
    type: string;
    timestamp: number;
    data?: Record<string, unknown>;
  }[];
}

export interface TutorialPreferences {
  tutorialSpeed: 'slow' | 'normal' | 'fast';
  showHighlights: boolean;
  showTooltips: boolean;
  soundEnabled: boolean;
  language: string;
  theme: 'light' | 'dark' | 'system';
}

export interface TutorialStorage {
  completedTutorials: string[];
  preferences: TutorialPreferences;
  analytics: TutorialAnalytics[];
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
  type: 'start' | 'complete' | 'skip' | 'interaction' | 'error';
  stepId?: string;
  data?: Record<string, unknown>;
  timestamp: number;
}

export interface TutorialHook {
  isActive: boolean;
  isCompleted: boolean;
  progress: TutorialProgress;
  metrics: TutorialMetrics;
  start: () => void;
  complete: () => void;
  skip: () => void;
  reset: () => void;
}
