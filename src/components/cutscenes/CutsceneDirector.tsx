import React from 'react';
import { useCutsceneQueue } from '../../hooks/useCutsceneQueue';
import { MinigameOutcomeCutscene } from './MinigameOutcomeCutscene';
import { CinematicStoryCutscene } from './CinematicStoryCutscene';

export function CutsceneDirector() {
  const { queue, dequeue } = useCutsceneQueue();
  if (queue.length === 0) return null;

  const current = queue[0];
  
  if (current.type === 'outcome_vignette') {
    return <MinigameOutcomeCutscene payload={current.payload} onComplete={dequeue} />;
  }

  if (current.type === 'story_cinematic') {
    return <CinematicStoryCutscene payload={current.payload} onComplete={dequeue} />;
  }
  
  return null;
}
