import React, { createContext, useReducer } from 'react';
import { TutorialState, TutorialContextAction, TutorialContextType } from '@/types/tutorial';
import { tutorialReducer } from '@/reducers/tutorialReducer';

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

export const TutorialContext = createContext<TutorialContextType>({
  state: initialState,
  startTutorial: () => {},
  completeStep: () => {},
  skipTutorial: () => {},
  updatePreferences: () => {},
  checkEraProgression: () => {},
});

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(tutorialReducer, initialState);

  const startTutorial = (tutorialId: string) => {
    dispatch({ type: 'START_TUTORIAL', payload: { tutorialId } });
  };

  const completeStep = (stepId: string) => {
    dispatch({ type: 'COMPLETE_STEP', payload: stepId });
  };

  const skipTutorial = () => {
    dispatch({ type: 'SKIP_TUTORIAL' });
  };

  const updatePreferences = (preferences: Partial<TutorialState['preferences']>) => {
    dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
  };

  const checkEraProgression = (currentEra: string, playerLevel: number) => {
    dispatch({ type: 'CHECK_ERA_PROGRESSION', payload: { currentEra, playerLevel } });
  };

  return (
    <TutorialContext.Provider
      value={{
        state,
        startTutorial,
        completeStep,
        skipTutorial,
        updatePreferences,
        checkEraProgression,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
};
