# Narrative Cutscenes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a native React/Framer Motion cutscene director, dynamic studio ambient backgrounds, and complete the 3-act story arcs.

**Architecture:** A lightweight cutscene director orchestrates full-screen narrative modalities and outcome vignettes natively via React Portal. An ambient backdrop layer runs non-intrusive CSS/Canvas animations decoupled from the main game loop. The story arcs data layer is expanded to fulfill all 4 playstyle campaigns.

**Tech Stack:** React 19, Vite, Tailwind CSS, Framer Motion, TypeScript, Tone.js.

**Spec:** `docs/superpowers/specs/2026-09-28-narrative-cutscenes-and-ambient-system-design.md`

## Global Constraints

- **Non-blocking Flow**: Overlays must auto-dismiss or be instantly skippable (`Escape`/`Enter`/`Space`).
- **No Video Bloat**: Zero external engine dependencies (no Remotion, no Dora SSR).
- **Reduced Motion**: Respect `prefers-reduced-motion` for animations.
- **Audio Autoplay**: Safely handle blocked WebAudio.

---

### Task 1: Complete Story Arcs Data Layer

**Files:**
- Modify: `src/narrative/storyArcs.ts`
- Test: `tests/narrative-cutscenes.check.ts` (create)

**Interfaces:**
- Produces: `STORY_ARCS` array fully populated with all 12 chapters across the 4 playstyles (Purist, Hit-Maker, Underground, Sound-Lab).

- [ ] **Step 1: Write the failing check**

```typescript
import { test, expect } from 'vitest';
import { getStoryArcs } from '../src/narrative/storyArcs';

test('has all 4 playstyle story arcs with 3 chapters each', () => {
  const arcs = getStoryArcs();
  expect(arcs.length).toBe(4);
  const playstyles = arcs.map(a => a.playstyle);
  expect(playstyles).toContain('purist');
  expect(playstyles).toContain('hit-maker');
  expect(playstyles).toContain('underground');
  expect(playstyles).toContain('sound-lab');
  
  arcs.forEach(arc => {
    expect(arc.chapters.length).toBe(3);
    expect(arc.chapters[2].chapterNumber).toBe(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest tests/narrative-cutscenes.check.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

Modify `src/narrative/storyArcs.ts` to include Acts 1, 2, and 3 for the Underground and Sound-Lab arcs (using the structure defined in the design spec). Ensure `checkCompletion` and `reward` functions are properly stubbed for Act 3s.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest tests/narrative-cutscenes.check.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/narrative/storyArcs.ts tests/narrative-cutscenes.check.ts
git commit -m "feat(narrative): complete all 4 playstyle 3-act story arcs"
```

---

### Task 2: State Management - Cutscene Queue Hook

**Files:**
- Create: `src/hooks/useCutsceneQueue.ts`

**Interfaces:**
- Produces: `useCutsceneQueue()` returning `{ queue: CutsceneEvent[], enqueue: (evt) => void, dequeue: () => void, currentCutscene: CutsceneEvent | null }`.

- [ ] **Step 1: Write minimal implementation**

```typescript
import { create } from 'zustand';

export type CutsceneType = 'outcome_vignette' | 'story_cinematic';

export interface CutsceneEvent {
  id: string;
  type: CutsceneType;
  payload: any; // specific props for the cutscene
}

interface CutsceneStore {
  queue: CutsceneEvent[];
  enqueue: (event: CutsceneEvent) => void;
  dequeue: () => void;
}

export const useCutsceneQueue = create<CutsceneStore>((set) => ({
  queue: [],
  enqueue: (event) => set((state) => ({ queue: [...state.queue, event] })),
  dequeue: () => set((state) => ({ queue: state.queue.slice(1) })),
}));
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useCutsceneQueue.ts
git commit -m "feat(cutscene): implement cutscene queue state"
```

---

### Task 3: Ambient Backdrop Component

**Files:**
- Create: `src/components/cutscenes/StudioAmbientBackdrop.tsx`
- Create: `src/components/cutscenes/ambient.css`
- Modify: `src/components/StudioInspector.tsx`

**Interfaces:**
- Consumes: N/A
- Produces: `<StudioAmbientBackdrop eraId={era} />`

- [ ] **Step 1: Write CSS rules**

Create `src/components/cutscenes/ambient.css`:
```css
@media (prefers-reduced-motion: no-preference) {
  .animate-spin-slow {
    animation: spin 10s linear infinite;
  }
}
.ambient-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  overflow: hidden;
}
```

- [ ] **Step 2: Write React Component**

Create `src/components/cutscenes/StudioAmbientBackdrop.tsx`:
```tsx
import React from 'react';
import './ambient.css';

interface Props { eraId?: string; }
export function StudioAmbientBackdrop({ eraId = 'analog' }: Props) {
  return (
    <div className="ambient-container" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 to-black/80" />
      {/* Tape Reels placeholder */}
      <div className="absolute top-10 right-10 flex gap-4 opacity-30">
        <div className="w-32 h-32 rounded-full border-4 border-gray-600 animate-spin-slow" />
        <div className="w-32 h-32 rounded-full border-4 border-gray-600 animate-spin-slow" />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Mount in StudioInspector**

Modify `src/components/StudioInspector.tsx` to include `<StudioAmbientBackdrop />` as the lowest z-index layer.

- [ ] **Step 4: Commit**

```bash
git add src/components/cutscenes src/components/StudioInspector.tsx
git commit -m "feat(cutscene): add dynamic studio ambient backdrop layer"
```

---

### Task 4: Post-Minigame Outcome Vignette

**Files:**
- Create: `src/components/cutscenes/MinigameOutcomeCutscene.tsx`
- Modify: `src/components/minigames/MinigameManager.tsx`

**Interfaces:**
- Consumes: `useCutsceneQueue`

- [ ] **Step 1: Write Minimal Component**

Create `src/components/cutscenes/MinigameOutcomeCutscene.tsx`:
```tsx
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function MinigameOutcomeCutscene({ payload, onComplete }: any) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    const onKey = (e: KeyboardEvent) => {
      if (['Escape', 'Enter', ' '].includes(e.key)) onComplete();
    };
    window.addEventListener('keydown', onKey);
    return () => { clearTimeout(timer); window.removeEventListener('keydown', onKey); };
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
      >
        <div className="bg-slate-900 border-2 border-yellow-500 rounded-xl p-8 text-center text-white pointer-events-auto shadow-2xl">
          <h2 className="text-3xl font-bold text-yellow-400 mb-2">Master Take!</h2>
          <p>Score: {payload.score} - S-Rank</p>
          <button onClick={onComplete} className="mt-4 bg-white/10 px-4 py-2 rounded">Continue</button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Trigger from MinigameManager**

Modify `src/components/minigames/MinigameManager.tsx` in `handleGameComplete`:
```typescript
import { useCutsceneQueue } from '../../hooks/useCutsceneQueue';
// Inside component:
const enqueue = useCutsceneQueue((s) => s.enqueue);

// In handleGameComplete, replace or augment toast:
if (score >= 850) {
  enqueue({ id: Date.now().toString(), type: 'outcome_vignette', payload: { score } });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/cutscenes/MinigameOutcomeCutscene.tsx src/components/minigames/MinigameManager.tsx
git commit -m "feat(cutscene): implement S-Rank post-minigame cinematic outcome"
```

---

### Task 5: Cutscene Director & Cinematic Story View

**Files:**
- Create: `src/components/cutscenes/CinematicStoryCutscene.tsx`
- Create: `src/components/cutscenes/CutsceneDirector.tsx`
- Modify: `src/App.tsx` (to mount Director)

**Interfaces:**
- Consumes: `useCutsceneQueue`

- [ ] **Step 1: Write Director Component**

Create `src/components/cutscenes/CutsceneDirector.tsx`:
```tsx
import React from 'react';
import { useCutsceneQueue } from '../../hooks/useCutsceneQueue';
import { MinigameOutcomeCutscene } from './MinigameOutcomeCutscene';

export function CutsceneDirector() {
  const { queue, dequeue } = useCutsceneQueue();
  if (queue.length === 0) return null;

  const current = queue[0];
  
  if (current.type === 'outcome_vignette') {
    return <MinigameOutcomeCutscene payload={current.payload} onComplete={dequeue} />;
  }
  
  // CinematicStoryCutscene placeholder
  return null;
}
```

- [ ] **Step 2: Mount Director**

Modify `src/App.tsx` to include `<CutsceneDirector />` near the top level.

- [ ] **Step 3: Commit**

```bash
git add src/components/cutscenes/CutsceneDirector.tsx src/components/cutscenes/CinematicStoryCutscene.tsx src/App.tsx
git commit -m "feat(cutscene): add global CutsceneDirector and route queued vignettes"
```
