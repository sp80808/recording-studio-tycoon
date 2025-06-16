import { TutorialState, TutorialContextAction, TutorialStep, Tutorial } from '@/types/tutorial';
import { eqMatchingTutorial } from '@/data/tutorials/eqMatchingTutorial';
import { waveformSculptingTutorial } from '@/data/tutorials/waveformSculptingTutorial';
import { microphonePlacementTutorial } from '@/data/tutorials/microphonePlacementTutorial';
import { firstSessionSteps } from '@/data/tutorials/firstSession';
import { 
  analogEraTutorial,
  digitalEraTutorial,
  internetEraTutorial,
  modernEraTutorial
} from '@/data/tutorials/eraTutorials';

// Map of all tutorials by ID
const allTutorials: { [key: string]: Tutorial } = {
  'eq-matching': eqMatchingTutorial,
  'waveform-sculpting': waveformSculptingTutorial,
  'microphone-placement': microphonePlacementTutorial,
  'first-session': { id: 'first-session', name: 'First Session', description: '', requiredLevel: 0, steps: firstSessionSteps },
  'analog-era': analogEraTutorial,
  'digital-era': digitalEraTutorial,
  'internet-era': internetEraTutorial,
  'modern-era': modernEraTutorial,
};

// Map of era progression
const eraProgression: Record<string, string> = {
  'analog-era': 'digital-era',
  'digital-era': 'internet-era',
  'internet-era': 'modern-era',
};

const initialState: TutorialState = {
  currentStep: null,
  completedSteps: new Set<string>(),
  completedEras: new Set<string>(),
  preferences: {
    tutorialSpeed: 'normal',
    showHighlights: true,
    showTooltips: true,
    soundEnabled: true,
  },
  history: [],
  activeTutorialId: null,
};

function findTutorialStep(tutorialId: string | null, stepId: string): TutorialStep | null {
  if (!tutorialId) return null;
  const tutorial = allTutorials[tutorialId];
  if (!tutorial) return null;
  const steps: TutorialStep[] = tutorial.steps as TutorialStep[];
  return steps.find((step: TutorialStep) => step.id === stepId) || null;
}

function getNextEraTutorial(currentEra: string): string | null {
  return eraProgression[currentEra] || null;
}

function shouldShowEraTutorial(state: TutorialState, era: string): boolean {
  const tutorial = allTutorials[era];
  if (!tutorial) return false;
  
  // Check if player has completed the previous era
  const previousEra = Object.entries(eraProgression).find(([_, next]) => next === era)?.[0];
  if (previousEra && !state.completedEras.has(previousEra)) return false;
  
  // Check if player has already completed this era's tutorial
  if (state.completedEras.has(era)) return false;
  
  // Check if player meets the level requirement
  return true; // Level check will be handled by the game state
}

export function tutorialReducer(state: TutorialState, action: TutorialContextAction): TutorialState {
  let tutorial: Tutorial | undefined;
  let currentTutorial: Tutorial | undefined;
  let currentStepIndex: number;
  let nextStep: TutorialStep | null;
  let completedSteps: Set<string>;
  let completedEras: Set<string>;
  let nextEra: string | null;

  switch (action.type) {
    case 'START_TUTORIAL':
      tutorial = allTutorials[action.payload.tutorialId];
      if (!tutorial) return state;
      
      return {
        ...state,
        activeTutorialId: action.payload.tutorialId,
        currentStep: tutorial.steps[0],
      };

    case 'COMPLETE_STEP':
      currentTutorial = allTutorials[state.activeTutorialId || ''];
      if (!currentTutorial) return state;

      currentStepIndex = currentTutorial.steps.findIndex(
        (step: TutorialStep) => step.id === state.currentStep?.id
      );

      if (currentStepIndex === -1) return state;

      nextStep = currentTutorial.steps[currentStepIndex + 1];
      completedSteps = new Set(state.completedSteps).add(state.currentStep?.id || '');

      // Check if this was the last step of an era tutorial
      if (currentStepIndex === currentTutorial.steps.length - 1 && state.activeTutorialId?.endsWith('-era')) {
        completedEras = new Set(state.completedEras).add(state.activeTutorialId);
        nextEra = getNextEraTutorial(state.activeTutorialId);
        
        return {
          ...state,
          completedSteps,
          completedEras,
          currentStep: nextStep || null,
          activeTutorialId: nextEra || null,
        };
      }

      return {
        ...state,
        completedSteps,
        currentStep: nextStep || null,
        activeTutorialId: nextStep ? state.activeTutorialId : null,
      };

    case 'SKIP_TUTORIAL':
      return {
        ...state,
        currentStep: null,
        activeTutorialId: null,
      };

    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...action.payload,
        },
      };

    case 'CHECK_ERA_PROGRESSION': {
      const { currentEra, playerLevel } = action.payload;
      nextEra = getNextEraTutorial(currentEra);
      
      if (nextEra && shouldShowEraTutorial(state, nextEra)) {
        const nextEraTutorial = allTutorials[nextEra];
        if (nextEraTutorial && playerLevel >= nextEraTutorial.requiredLevel) {
          return {
            ...state,
            activeTutorialId: nextEra,
            currentStep: nextEraTutorial.steps[0],
          };
        }
      }
      
      return state;
    }

    default:
      return state;
  }
}

// Helper function to validate tutorial step requirements
const validateStepRequirements = (step: TutorialStep, state: TutorialState): boolean => {
  if (!step.requirements) {
    return true;
  }
  
  const { completedSteps, gameState } = step.requirements;
  
  // Check if required steps are completed
  if (completedSteps) {
    const allCompleted = completedSteps.every(stepId => 
      state.completedSteps.has(stepId)
    );
    if (!allCompleted) {
      return false;
    }
  }
  
  // Check game state requirements
  if (gameState) {
    // This would be implemented based on your game state structure
    // For now, we'll return true as this should be customized
    return true;
  }
  
  return true;
};

// Helper function to calculate tutorial progress
export const calculateProgress = (state: TutorialState): number => {
  const totalSteps = state.history.length;
  if (totalSteps === 0) {
    return 0;
  }
  
  const completedCount = state.completedSteps.size;
  return (completedCount / totalSteps) * 100;
};

// Helper function to get tutorial metrics
export const getTutorialMetrics = (state: TutorialState) => {
  const totalSteps = state.history.length;
  const completedSteps = state.completedSteps.size;
  const skippedSteps = state.history
    .filter(step => !state.completedSteps.has(step.id))
    .map(step => step.id);
  
  return {
    stepsCompleted: completedSteps,
    completionRate: totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0,
    skippedSteps,
  };
};
