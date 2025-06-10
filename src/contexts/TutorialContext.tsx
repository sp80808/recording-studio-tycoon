import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { TutorialState, TutorialContextAction, TutorialPreferences } from '@/types/tutorial';
import { tutorialReducer } from '@/reducers/tutorialReducer';

const initialState: TutorialState = {
  currentStep: null,
  completedSteps: new Set<string>(),
  preferences: {
    tutorialSpeed: 'normal',
    showHighlights: true,
    showTooltips: true,
    soundEnabled: true
  },
  history: []
};

interface TutorialContextValue {
  state: TutorialState;
  startTutorial: (stepId: string) => void;
  completeStep: (stepId: string) => void;
  skipTutorial: () => void;
  updatePreferences: (preferences: Partial<TutorialPreferences>) => void;
}

const TutorialContext = createContext<TutorialContextValue | undefined>(undefined);


export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(tutorialReducer, initialState);

  const startTutorial = useCallback((stepId: string) => {
    dispatch({ type: 'START_TUTORIAL', payload: stepId });
  }, []);

  const completeStep = useCallback((stepId: string) => {
    dispatch({ type: 'COMPLETE_STEP', payload: stepId });
  }, []);

  const skipTutorial = useCallback(() => {
    dispatch({ type: 'SKIP_TUTORIAL' });
  }, []);

  const updatePreferences = useCallback((preferences: Partial<TutorialPreferences>) => {
    dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
  }, []);

  const value = {
    state,
    startTutorial,
    completeStep,
    skipTutorial,
    updatePreferences,
  };

  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>;
};

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};
