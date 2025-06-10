import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTutorial } from '@/contexts/TutorialContext';
import { TutorialStepAction } from '@/types/tutorial';

interface TutorialOverlayProps {
  onComplete?: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onComplete }) => {
  const { state, nextStep, completeTutorial, hideTutorial } = useTutorial();
  const [isHighlightVisible, setIsHighlightVisible] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [actionCompleted, setActionCompleted] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  const currentStep = state.activeTutorial?.steps[state.currentStep];

  useEffect(() => {
    if (!currentStep) return;

    const targetElement = document.querySelector(currentStep.target);
    if (!targetElement) return;

    const highlight = highlightRef.current;
    const tooltip = tooltipRef.current;
    if (!highlight || !tooltip) return;

    const targetRect = targetElement.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    // Position highlight
    highlight.style.width = `${targetRect.width + 20}px`;
    highlight.style.height = `${targetRect.height + 20}px`;
    highlight.style.left = `${targetRect.left - 10}px`;
    highlight.style.top = `${targetRect.top - 10}px`;

    // Position tooltip based on position prop
    let tooltipLeft = targetRect.left;
    let tooltipTop = targetRect.top;

    switch (currentStep.position) {
      case 'top':
        tooltipLeft = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        tooltipTop = targetRect.top - tooltipRect.height - 20;
        break;
      case 'right':
        tooltipLeft = targetRect.right + 20;
        tooltipTop = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        break;
      case 'bottom':
        tooltipLeft = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        tooltipTop = targetRect.bottom + 20;
        break;
      case 'left':
        tooltipLeft = targetRect.left - tooltipRect.width - 20;
        tooltipTop = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        break;
      case 'center':
        tooltipLeft = (window.innerWidth - tooltipRect.width) / 2;
        tooltipTop = (window.innerHeight - tooltipRect.height) / 2;
        break;
    }

    tooltip.style.left = `${tooltipLeft}px`;
    tooltip.style.top = `${tooltipTop}px`;

    // Show elements with animation
    setIsHighlightVisible(true);
    setIsTooltipVisible(true);
    setActionCompleted(false);

    // Set up action validation if step is interactive
    if (currentStep.interactive && currentStep.action) {
      const actionElement = document.querySelector(currentStep.action.selector || '');
      if (actionElement) {
        const validateAction = (event: Event) => {
          if (currentStep.action?.validate && currentStep.action.validate()) {
            setActionCompleted(true);
            actionElement.removeEventListener('click', validateAction);
            actionElement.removeEventListener('change', validateAction);
            actionElement.removeEventListener('input', validateAction);
          }
        };

        actionElement.addEventListener('click', validateAction);
        actionElement.addEventListener('change', validateAction);
        actionElement.addEventListener('input', validateAction);

        return () => {
          actionElement.removeEventListener('click', validateAction);
          actionElement.removeEventListener('change', validateAction);
          actionElement.removeEventListener('input', validateAction);
        };
      }
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep) {
      if (state.currentStep === state.activeTutorial!.steps.length - 1) {
        completeTutorial();
      } else {
        nextStep();
      }
      if (onComplete) onComplete();
    }
  };

  const handleSkip = () => {
    hideTutorial();
    if (onComplete) onComplete();
  };

  if (!currentStep) return null;

  return (
    <div className="tutorial-overlay">
      <AnimatePresence>
        {isHighlightVisible && (
          <motion.div
            ref={highlightRef}
            className="tutorial-highlight"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isTooltipVisible && (
          <motion.div
            ref={tooltipRef}
            className="tutorial-tooltip"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <h3>{currentStep.title}</h3>
            <p>{currentStep.content}</p>
            {currentStep.actionHint && (
              <p className="action-hint">{currentStep.actionHint}</p>
            )}
            <div className="tutorial-controls">
              <button onClick={handleSkip}>Skip Tutorial</button>
              <button
                onClick={handleNext}
                disabled={currentStep.interactive && !actionCompleted}
              >
                {state.currentStep === state.activeTutorial!.steps.length - 1 ? 'Finish' : 'Next'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 