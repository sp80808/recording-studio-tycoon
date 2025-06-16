import React, { createContext, useReducer, useCallback } from 'react';
import { TutorialState, TutorialContextAction, TutorialContextType, TutorialStep, Tutorial, TutorialPreferences } from '@/types/tutorial';
import { tutorialReducer, allTutorials } from '@/reducers/tutorialReducer'; // Import allTutorials

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

export const TutorialContext = createContext<TutorialContextType>({
  state: initialState,
  dispatch: () => undefined,
  startTutorial: () => console.warn('TutorialContext: startTutorial not implemented'),
  completeStep: () => console.warn('TutorialContext: completeStep not implemented'),
  skipTutorial: () => console.warn('TutorialContext: skipTutorial not implemented'),
  endTutorial: () => console.warn('TutorialContext: endTutorial not implemented'),
  updatePreferences: () => console.warn('TutorialContext: updatePreferences not implemented'),
  checkEraProgression: () => console.warn('TutorialContext: checkEraProgression not implemented'),
  isStepCompleted: () => false,
  getTutorialById: () => undefined,
});

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(tutorialReducer, initialState);

  const getTutorialById = useCallback((tutorialId: string): Tutorial | undefined => {
    return allTutorials[tutorialId]; // Access from the imported allTutorials map
  }, []);

  const startTutorial = useCallback((tutorialId: string) => {
    const tutorialData = getTutorialById(tutorialId);
    if (tutorialData) {
      dispatch({ type: 'START_TUTORIAL', payload: { tutorialId, steps: tutorialData.steps } });
    } else {
      console.error(`TutorialProvider: Tutorial with id ${tutorialId} not found.`);
    }
  }, [dispatch, getTutorialById]);

  const completeStep = useCallback((stepId: string) => {
    dispatch({ type: 'COMPLETE_STEP', payload: { stepId } });
  }, [dispatch]);

  const skipTutorial = useCallback(() => {
    dispatch({ type: 'SKIP_TUTORIAL' });
  }, [dispatch]);

  const endTutorial = useCallback(() => {
    dispatch({ type: 'END_TUTORIAL' });
  }, [dispatch]);

  const updatePreferences = useCallback((preferences: Partial<TutorialPreferences>) => {
    dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
  }, [dispatch]);

  const checkEraProgression = useCallback((currentEra: string, playerLevel: number) => {
    dispatch({ type: 'CHECK_ERA_PROGRESSION', payload: { currentEra, playerLevel } });
  }, [dispatch]);

  const isStepCompleted = useCallback((stepId: string): boolean => {
    return state.completedSteps.has(stepId);
  }, [state.completedSteps]);

  return (
    <TutorialContext.Provider
      value={{
        state,
        dispatch,
        startTutorial,
        completeStep,
        skipTutorial,
        endTutorial,
        updatePreferences,
        checkEraProgression,
        isStepCompleted,
        getTutorialById,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
};
