import { useContext, useCallback, useEffect, useRef } from 'react';
import { TutorialContext } from '@/providers/TutorialProvider';
import { TutorialStep, TutorialEvent, TutorialMetrics, TutorialPreferences } from '@/types/tutorial';
import { firstSessionSteps } from '@/data/tutorials/firstSession';

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  const analyticsRef = useRef<TutorialEvent[]>([]);
  const startTimeRef = useRef<number>(Date.now());

  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }

  const { state, startTutorial, completeStep, skipTutorial, updatePreferences } = context;

  // Track tutorial events
  const trackEvent = useCallback((event: TutorialEvent) => {
    analyticsRef.current.push(event);
  }, []);

  // Start a tutorial step
  const startStep = useCallback((stepId: string) => {
    const step = firstSessionSteps.find(s => s.id === stepId);
    if (!step) {
      throw new Error(`Tutorial step ${stepId} not found`);
    }

    startTutorial(stepId);
    trackEvent({
      type: 'start',
      stepId,
      timestamp: Date.now(),
    });
  }, [startTutorial, trackEvent]);

  // Complete a tutorial step
  const completeCurrentStep = useCallback(() => {
    if (!state.currentStep) return;

    const stepId = state.currentStep.id;
    completeStep(stepId);
    trackEvent({
      type: 'complete',
      stepId,
      timestamp: Date.now(),
    });
  }, [state.currentStep, completeStep, trackEvent]);

  // Skip the current tutorial
  const skipCurrentTutorial = useCallback(() => {
    skipTutorial();
    trackEvent({
      type: 'skip',
      timestamp: Date.now(),
    });
  }, [skipTutorial, trackEvent]);

  // Update tutorial preferences
  const updateTutorialPreferences = useCallback((preferences: Partial<TutorialPreferences>) => {
    updatePreferences(preferences);
  }, [updatePreferences]);

  // Get tutorial metrics
  const getMetrics = useCallback((): TutorialMetrics => {
    const now = Date.now();
    const timeSpent = now - startTimeRef.current;
    const completedSteps = state.completedSteps.size;
    const totalSteps = firstSessionSteps.length;
    const skippedSteps = firstSessionSteps
      .filter(step => !state.completedSteps.has(step.id))
      .map(step => step.id);

    return {
      stepsCompleted: completedSteps,
      timeSpent,
      skippedSteps,
      completionRate: totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0,
      averageTimePerStep: completedSteps > 0 ? timeSpent / completedSteps : 0,
    };
  }, [state.completedSteps]);

  // Check if a step is active
  const isStepActive = useCallback((stepId: string): boolean => {
    return state.currentStep?.id === stepId;
  }, [state.currentStep]);

  // Check if a step is completed
  const isStepCompleted = useCallback((stepId: string): boolean => {
    return state.completedSteps.has(stepId);
  }, [state.completedSteps]);

  // Get the current step
  const getCurrentStep = useCallback((): TutorialStep | null => {
    return state.currentStep;
  }, [state.currentStep]);

  // Get tutorial progress
  const getProgress = useCallback(() => {
    const totalSteps = firstSessionSteps.length;
    const completedSteps = state.completedSteps.size;
    return {
      total: totalSteps,
      current: completedSteps,
      percentage: totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0,
    };
  }, [state.completedSteps]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Save analytics data or perform cleanup
      const metrics = getMetrics();
      console.log('Tutorial Metrics:', metrics);
      console.log('Tutorial Events:', analyticsRef.current);
    };
  }, [getMetrics]);

  return {
    // State
    currentStep: state.currentStep,
    preferences: state.preferences,
    isActive: !!state.currentStep,
    
    // Actions
    startStep,
    completeCurrentStep,
    skipCurrentTutorial,
    updateTutorialPreferences,
    
    // Queries
    isStepActive,
    isStepCompleted,
    getCurrentStep,
    getProgress,
    getMetrics,
    
    // Analytics
    trackEvent,
  };
}; 