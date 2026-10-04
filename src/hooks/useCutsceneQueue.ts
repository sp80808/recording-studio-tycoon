import { create } from 'zustand';

export type CutsceneType = 'outcome_vignette' | 'story_cinematic';

export interface CutsceneEvent {
  id: string;
  type: CutsceneType;
  payload: unknown;
}

interface CutsceneStore {
  queue: CutsceneEvent[];
  /** Ephemeral ownership shared by decisions and cinematics, including their outcomes. */
  presenter: string | null;
  acquirePresentation: (owner: string) => void;
  releasePresentation: (owner: string) => void;
  enqueue: (event: CutsceneEvent) => void;
  dequeue: () => void;
  clear: () => void;
}

export const useCutsceneQueue = create<CutsceneStore>((set) => ({
  queue: [],
  presenter: null,
  acquirePresentation: (owner) => set((state) => state.presenter === null ? { presenter: owner } : state),
  releasePresentation: (owner) => set((state) => state.presenter === owner ? { presenter: null } : state),
  enqueue: (event) => set((state) => ({ queue: [...state.queue, event] })),
  dequeue: () => set((state) => ({ queue: state.queue.slice(1) })),
  clear: () => set({ queue: [] }),
}));
