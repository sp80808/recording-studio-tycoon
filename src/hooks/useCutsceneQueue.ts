import { create } from 'zustand';

export type CutsceneType = 'outcome_vignette' | 'story_cinematic';

export interface CutsceneEvent {
  id: string;
  type: CutsceneType;
  payload: Record<string, any>;
}

interface CutsceneStore {
  queue: CutsceneEvent[];
  enqueue: (event: CutsceneEvent) => void;
  dequeue: () => void;
  clear: () => void;
}

export const useCutsceneQueue = create<CutsceneStore>((set) => ({
  queue: [],
  enqueue: (event) => set((state) => ({ queue: [...state.queue, event] })),
  dequeue: () => set((state) => ({ queue: state.queue.slice(1) })),
  clear: () => set({ queue: [] }),
}));
