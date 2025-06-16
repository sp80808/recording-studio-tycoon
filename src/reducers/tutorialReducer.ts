import { TutorialState, TutorialContextAction, TutorialStep, Tutorial, TutorialProgress } from '@/types/tutorial';
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

export const allTutorials: { [key: string]: Tutorial } = {
  'eq-matching': eqMatchingTutorial,
  'waveform-sculpting': waveformSculptingTutorial,
  'microphone-placement': microphonePlacementTutorial,
  'first-session': { id: 'first-session', name: 'First Session', description: 'Learn the basics of your first recording session.', requiredLevel: 0, steps: firstSessionSteps },
  'analog-era': analogEraTutorial,
  'digital-era': digitalEraTutorial,
  'internet-era': internetEraTutorial,
  'modern-era': modernEraTutorial,
};

const eraProgression: Record<string, string> = {
  'analog-era': 'digital-era',
  'digital-era': 'internet-era',
  'internet-era': 'modern-era',
};

const initialState: TutorialState = {
  activeTutorialId: null,
  currentStep: null,
  completedSteps: new Set<string>(),
  completedTutorials: new Set<string>(),
  completedEras: new Set<string>(),
  preferences: {
    tutorialSpeed: 'normal',
    showHighlights: true,
    showTooltips: true,
    soundEnabled: true,
  },
  history: [],
};

function findTutorialStep(tutorialId: string, stepId: string): TutorialStep | null {
  const tutorial = allTutorials[tutorialId];
  if (!tutorial) return null;
  return tutorial.steps.find(step => step.id === stepId) || null;
}

function getNextEraTutorial(currentEra: string): string | null {
  return eraProgression[currentEra] || null;
}

function shouldShowEraTutorial(state: TutorialState, era: string): boolean {
  const tutorial = allTutorials[era];
  if (!tutorial) return false;
  
  const previousEra = Object.entries(eraProgression).find(([_, next]) => next === era)?.[0];
  if (previousEra && !state.completedEras.has(previousEra)) return false;
  
  if (state.completedEras.has(era)) return false;
  
  return true; 
}

export function tutorialReducer(state: TutorialState, action: TutorialContextAction): TutorialState {
  switch (action.type) {
    case 'START_TUTORIAL': {
      const tutorial = allTutorials[action.payload.tutorialId];
      if (!tutorial || tutorial.steps.length === 0) return state;
      
      return {
        ...state,
        activeTutorialId: action.payload.tutorialId,
        currentStep: tutorial.steps[0],
        completedSteps: new Set<string>(), 
        history: [tutorial.steps[0]], 
      };
    }

    case 'COMPLETE_STEP': {
      if (!state.activeTutorialId || !state.currentStep) return state;
      const currentTutorial = allTutorials[state.activeTutorialId];
      if (!currentTutorial) return state;

      const completedSteps = new Set(state.completedSteps).add(state.currentStep.id);
      const currentStepIndex = currentTutorial.steps.findIndex(step => step.id === state.currentStep!.id);

      if (currentStepIndex === -1) return state;

      const nextStep = currentTutorial.steps[currentStepIndex + 1] || null;
      
      let newActiveTutorialId: string | null = state.activeTutorialId; // Ensure type
      let newCompletedTutorials = state.completedTutorials;
      let newCompletedEras = state.completedEras;

      if (!nextStep) { // Tutorial finished
        if (state.activeTutorialId) { 
            newCompletedTutorials = new Set(state.completedTutorials).add(state.activeTutorialId);
            if (typeof state.activeTutorialId === 'string' && state.activeTutorialId.endsWith('-era')) { 
              newCompletedEras = new Set(state.completedEras).add(state.activeTutorialId);
            }
        }
        newActiveTutorialId = null; 
      }
      
      return {
        ...state,
        completedSteps,
        completedTutorials: newCompletedTutorials,
        completedEras: newCompletedEras,
        currentStep: nextStep,
        activeTutorialId: newActiveTutorialId, // No explicit cast here
        history: nextStep ? [...state.history, nextStep] : state.history,
      };
    }

    case 'SKIP_TUTORIAL':
    case 'END_TUTORIAL': 
      return {
        ...state,
        currentStep: null,
        activeTutorialId: null,
      };
    
    case 'SET_CURRENT_STEP':
        return {
            ...state,
            currentStep: action.payload.step,
            history: action.payload.step ? [...state.history, action.payload.step] : state.history,
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
      const nextEra = getNextEraTutorial(currentEra);
      
      if (nextEra && shouldShowEraTutorial(state, nextEra)) {
        const nextEraTutorial = allTutorials[nextEra];
        if (nextEraTutorial && typeof nextEraTutorial.requiredLevel === 'number' && playerLevel >= nextEraTutorial.requiredLevel) {
          return {
            ...state,
            activeTutorialId: nextEra,
            currentStep: nextEraTutorial.steps[0],
            completedSteps: new Set<string>(),
            history: [nextEraTutorial.steps[0]],
          };
        }
      }
      return state;
    }
    
    case 'LOAD_PROGRESS': {
        const { progress, preferences } = action.payload;
        const loadedCompletedTutorials = new Set<string>();
        const loadedCompletedSteps = new Set<string>();
        const loadedHistory: TutorialStep[] = [];
        let loadedCurrentStep: TutorialStep | null = null;
        let loadedActiveTutorialId: string | null = null; // Initialize

        progress.forEach(p => {
            if (typeof p.tutorialId !== 'string') return;

            if (p.isCompleted) {
                loadedCompletedTutorials.add(p.tutorialId);
            }
            p.completedSteps.forEach(stepId => {
                loadedCompletedSteps.add(stepId);
                const step = findTutorialStep(p.tutorialId, stepId);
                if (step) loadedHistory.push(step);
            });
            if (p.currentStepId) {
                const step = findTutorialStep(p.tutorialId, p.currentStepId);
                if (step) {
                    loadedCurrentStep = step;
                    loadedActiveTutorialId = p.tutorialId; // Set active tutorial if current step exists
                }
            }
        });
        
        // If no current step was found from progress, but there's history, try to infer active tutorial
        if (!loadedCurrentStep && loadedHistory.length > 0) {
            const lastStepInHistory = loadedHistory[loadedHistory.length - 1];
            // Find which tutorial this last step belongs to
            for (const tutId in allTutorials) {
                if (allTutorials[tutId].steps.some(s => s.id === lastStepInHistory.id)) {
                    // Check if this tutorial is completed, if so, no active tutorial
                    if (!loadedCompletedTutorials.has(tutId)) {
                        loadedActiveTutorialId = tutId;
                    }
                    break;
                }
            }
        }


        return {
            ...initialState, 
            activeTutorialId: loadedActiveTutorialId, // Use inferred or null
            currentStep: loadedCurrentStep,
            completedTutorials: loadedCompletedTutorials,
            completedSteps: loadedCompletedSteps,
            history: loadedHistory,
            preferences: preferences || initialState.preferences,
        };
    }

    default:
      return state;
  }
}

// validateStepRequirements and other helper functions remain unchanged
// For brevity, they are omitted here but should be part of the final file.

const validateStepRequirements = (step: TutorialStep, state: TutorialState): boolean => {
  if (!step.requirements) return true;
  
  const { completedSteps, gameState: stepGameStateReq } = step.requirements;
  
  if (completedSteps) {
    if (!completedSteps.every(stepId => state.completedSteps.has(stepId))) {
      return false;
    }
  }
  
  // Placeholder for gameState requirement check
  if (stepGameStateReq) {
    // Example: check if gameState.playerData.level >= stepGameStateReq.playerLevel
    // This part needs actual implementation based on how gameState requirements are defined
    return true; 
  }
  
  return true;
};

export const calculateProgress = (state: TutorialState): number => {
  if (!state.activeTutorialId || !state.currentStep) return 0;
  const currentTutorial = allTutorials[state.activeTutorialId];
  if (!currentTutorial || currentTutorial.steps.length === 0) return 0;
  
  // Calculate completed steps specifically for the active tutorial
  const completedInCurrent = Array.from(state.completedSteps).filter(stepId => 
    currentTutorial.steps.some(s => s.id === stepId)
  ).length;
    
  return (completedInCurrent / currentTutorial.steps.length) * 100;
};

export const getTutorialMetrics = (state: TutorialState, tutorialId: string) => {
  const tutorial = allTutorials[tutorialId];
  if (!tutorial) return { stepsCompleted: 0, completionRate: 0, skippedSteps: [] };

  const stepsInTutorial = tutorial.steps.map(s => s.id);
  const completedStepsForThisTutorial = Array.from(state.completedSteps).filter(id => stepsInTutorial.includes(id));
  
  // Skipped steps logic would require knowing the intended path vs actual path
  // For now, returning an empty array for skippedSteps
  return {
    stepsCompleted: completedStepsForThisTutorial.length,
    completionRate: (completedStepsForThisTutorial.length / tutorial.steps.length) * 100,
    skippedSteps: [], 
  };
};
