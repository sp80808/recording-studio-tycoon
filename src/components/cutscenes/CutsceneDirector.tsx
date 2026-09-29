import React, { useEffect, useRef } from 'react';
import { useCutsceneQueue } from '../../hooks/useCutsceneQueue';
import { MinigameOutcomeCutscene } from './MinigameOutcomeCutscene';
import { CinematicStoryCutscene } from './CinematicStoryCutscene';
import {
  RISING_STUDIO_CUTSCENE,
  RISING_STUDIO_MILESTONE_ID,
  shouldTriggerRisingStudioCutscene,
  type CareerCutsceneChoice,
} from './careerCutscenes';

const SAVE_KEY = 'recordingStudioTycoonSave';
const SEEN_KEY = `recordingStudioTycoon_cutscene_${RISING_STUDIO_MILESTONE_ID}`;
const CREED_KEY = 'recordingStudioTycoon_studioCreed';

export function CutsceneDirector() {
  const { queue, dequeue, enqueue } = useCutsceneQueue();
  const saveBeforeAutoSave = useRef<string | null>(null);

  useEffect(() => {
    const onAutoSave = () => {
      saveBeforeAutoSave.current = localStorage.getItem(SAVE_KEY);
      queueMicrotask(() => {
        const currentSave = localStorage.getItem(SAVE_KEY);
        if (!shouldTriggerRisingStudioCutscene(
          saveBeforeAutoSave.current,
          currentSave,
          localStorage.getItem(SEEN_KEY) === 'true',
        )) return;

        localStorage.setItem(SEEN_KEY, 'true');
        enqueue({
          id: RISING_STUDIO_MILESTONE_ID,
          type: 'story_cinematic',
          payload: RISING_STUDIO_CUTSCENE,
        });
      });
    };

    window.addEventListener('autoSave', onAutoSave);
    return () => window.removeEventListener('autoSave', onAutoSave);
  }, [enqueue]);

  if (queue.length === 0) return null;

  const current = queue[0];
  
  if (current.type === 'outcome_vignette') {
    return <MinigameOutcomeCutscene payload={current.payload} onComplete={dequeue} />;
  }

  if (current.type === 'story_cinematic') {
    const completeStory = (choice?: CareerCutsceneChoice) => {
      if (choice) localStorage.setItem(CREED_KEY, choice.id);
      dequeue();
    };
    return <CinematicStoryCutscene payload={current.payload} onComplete={completeStory} />;
  }
  
  return null;
}
