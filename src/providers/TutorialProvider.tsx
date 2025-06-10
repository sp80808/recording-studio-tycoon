import React, { createContext, useReducer } from 'react';
import { TutorialState, TutorialAction, TutorialContextType } from '@/types/tutorial';
import { tutorialReducer } from '@/reducers/tutorialReducer';

const initialState: TutorialState = {
  currentStep: null,
  completedSteps: new Set<string>(),
  preferences: {
    tutorialSpeed: 'normal',
    showHighlights: true,
    showTooltips: true,
    soundEnabled: true,
    language: 'en', // Added language
    theme: 'dark', // Added theme
  },
  history: [],
};

export const TutorialContext = createContext<TutorialContextType>({
  state: initialState,
  startTutorial: () => {},
  completeStep: () => {},
  skipTutorial: () => {},
  updatePreferences: () => {},
});

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(tutorialReducer, initialState);

  const startTutorial = (stepId: string) => {
    dispatch({ type: 'START_TUTORIAL', payload: stepId });
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

  return (
    <TutorialContext.Provider
      value={{
        state,
        startTutorial,
        completeStep,
        skipTutorial,
        updatePreferences,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
};
