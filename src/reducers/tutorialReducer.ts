import { TutorialState, TutorialContextAction, TutorialStep, Tutorial } from '@/types/tutorial';
import { eqMatchingTutorial } from '@/data/tutorials/eqMatchingTutorial';
import { waveformSculptingTutorial } from '@/data/tutorials/waveformSculptingTutorial';
import { microphonePlacementTutorial } from '@/data/tutorials/microphonePlacementTutorial';
import { firstSessionSteps } from '@/data/tutorials/firstSession';

// Map of all tutorials by ID
const allTutorials: { [key: string]: Tutorial } = {
  'eq-matching': eqMatchingTutorial,
  'waveform-sculpting': waveformSculptingTutorial,
  'microphone-placement': microphonePlacementTutorial,
  'first-session': { id: 'first-session', name: 'First Session', description: '', requiredLevel: 0, steps: firstSessionSteps },
};

const initialState: TutorialState = {
  currentStep: null,
  completedSteps: new Set<string>(),
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

export const tutorialReducer = (state: TutorialState, action: TutorialContextAction): TutorialState => {
  switch (action.type) {
    case 'SET_ACTIVE_TUTORIAL': {
      if (typeof action.payload !== 'string') {
        throw new Error('Invalid payload for SET_ACTIVE_TUTORIAL action');
      }
      return {
        ...state,
        activeTutorialId: action.payload,
        currentStep: null,
        completedSteps: new Set<string>(),
        history: [],
      };
    }
    case 'START_TUTORIAL': {
      if (typeof action.payload !== 'string') {
        throw new Error('Invalid payload for START_TUTORIAL action');
      }
      if (!state.activeTutorialId) {
        throw new Error('No active tutorial set. Use SET_ACTIVE_TUTORIAL first.');
      }
      const stepId = action.payload;
      const step = findTutorialStep(state.activeTutorialId, stepId);
      if (!step) {
        throw new Error(`Tutorial step ${stepId} not found in tutorial ${state.activeTutorialId}`);
      }
      return {
        ...state,
        currentStep: step,
        history: [...state.history, step],
      };
    }
    case 'COMPLETE_STEP': {
      if (typeof action.payload !== 'string') {
        throw new Error('Invalid payload for COMPLETE_STEP action');
      }
      if (!state.activeTutorialId) {
        throw new Error('No active tutorial set. Use SET_ACTIVE_TUTORIAL first.');
      }
      const stepId = action.payload;
      const completedSteps = new Set(state.completedSteps);
      completedSteps.add(stepId);
      // Find the next step based on the current step's nextSteps
      const currentStep = state.currentStep;
      let nextStep: TutorialStep | null = null;
      if (currentStep && currentStep.nextSteps && currentStep.nextSteps.length > 0) {
        // Find the first next step that hasn't been completed
        const nextStepId = currentStep.nextSteps.find(id => !completedSteps.has(id));
        if (nextStepId) {
          nextStep = findTutorialStep(state.activeTutorialId, nextStepId);
        }
      }
      return {
        ...state,
        currentStep: nextStep,
        completedSteps,
        history: nextStep ? [...state.history, nextStep] : state.history,
      };
    }
    case 'SKIP_TUTORIAL': {
      return {
        ...state,
        currentStep: null,
        history: [],
      };
    }
    case 'UPDATE_PREFERENCES': {
      if (!action.payload || typeof action.payload !== 'object') {
        throw new Error('Invalid payload for UPDATE_PREFERENCES action');
      }
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...action.payload,
        },
      };
    }
    default:
      return state;
  }
};

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
