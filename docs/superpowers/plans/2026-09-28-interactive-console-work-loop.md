# Interactive Studio Console Work Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the project work loop from a repetitive 30-click idle game into an interactive, satisfying studio session with a "Hit The Pocket" analog VU meter take mechanic, industrial rackmount console aesthetics, Tone.js genre chords, and 2-energy adaptive pacing.

**Architecture:** A pure evaluation module calculates take grades and bonus multipliers from timing accuracy; an industrial hardware `PocketMeter` component provides a swinging analog needle and sweet-spot target; `useStageWork` handles adaptive energy expenditure (2⚡ default, 1⚡ fallback) and accelerated work unit yields; `ActiveProject.tsx` sheds generic rounded cards for a precision mixing desk chassis with corner rack-bolts and illuminated Neve/SSL transport buttons.

**Tech Stack:** React, TypeScript, Tailwind CSS, Tone.js, Web Audio API, Esbuild / Node check runners.

**Spec:** `docs/superpowers/specs/2026-09-28-interactive-console-work-loop-design.md`

## Global Constraints
- Target platform: Desktop / Tablet web browser (Vite + React + Tailwind).
- Package manager: `pnpm` exclusively (do not invoke `npm` or `npx`).
- Automated tests: Must run through `scripts/run-checks.sh` via `node` / `esbuild` bundles without external network calls.
- Audio: All Web Audio / Tone.js nodes must route safely and handle muted/suspended browser states gracefully.
- Styling: Industrial studio hardware / rackmount aesthetic; sharp 2px machined corners (`rounded-[2px]`), matte gunmetal chassis, metallic bevels, and technical monospace labels.

---

### Task 1: Pure Take Evaluation Logic & Unit Tests

**Files:**
- Create: `src/rpg/takeEvaluation.ts`
- Create: `tests/pocket-take.check.ts`

**Interfaces:**
- Consumes: None (pure calculations).
- Produces:
  ```typescript
  export type TakeGrade = 'Gold' | 'Silver' | 'Solid';

  export interface TakeEvaluationResult {
    grade: TakeGrade;
    multiplier: number;       // 1.3 for Gold, 1.1 for Silver, 1.0 for Solid
    qualityBonus: number;     // +4 for Gold, +2 for Silver, 0 for Solid
    label: string;            // 'Gold Take' | 'Silver Take' | 'Solid Take'
  }

  export function evaluateTakeAccuracy(needlePosition: number): TakeEvaluationResult;
  export function calculateTakeEnergyCost(availableEnergy: number, overdriveArmed: boolean): number;
  export function calculateTakeBaseUnits(energyCost: number): number;
  ```

- [ ] **Step 1: Write the failing test**

Create `tests/pocket-take.check.ts`:
```typescript
import {
  evaluateTakeAccuracy,
  calculateTakeEnergyCost,
  calculateTakeBaseUnits
} from '../src/rpg/takeEvaluation';

let passed = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

// 1. Accuracy Brackets
const sweetSpot = evaluateTakeAccuracy(0.78);
ok(sweetSpot.grade === 'Gold' && sweetSpot.multiplier === 1.3 && sweetSpot.qualityBonus === 4, 'needle at 0.78 is Gold Take');

const nearMissLow = evaluateTakeAccuracy(0.65);
ok(nearMissLow.grade === 'Silver' && nearMissLow.multiplier === 1.1 && nearMissLow.qualityBonus === 2, 'needle at 0.65 is Silver Take');

const nearMissHigh = evaluateTakeAccuracy(0.90);
ok(nearMissHigh.grade === 'Silver' && nearMissHigh.multiplier === 1.1 && nearMissHigh.qualityBonus === 2, 'needle at 0.90 is Silver Take');

const offTarget = evaluateTakeAccuracy(0.30);
ok(offTarget.grade === 'Solid' && offTarget.multiplier === 1.0 && offTarget.qualityBonus === 0, 'needle at 0.30 is Solid Take');

// 2. Energy Adaptation
ok(calculateTakeEnergyCost(6, false) === 2, 'default take burns 2 energy');
ok(calculateTakeEnergyCost(1, false) === 1, '1 energy left adapts to 1 energy take');
ok(calculateTakeEnergyCost(0, false) === 0, '0 energy returns 0');
ok(calculateTakeEnergyCost(6, true) === 3, 'overdrive adds +1 energy');
ok(calculateTakeEnergyCost(2, true) === 2, 'overdrive with 2 energy burns 2 energy');

// 3. Base Units Scaling
ok(calculateTakeBaseUnits(2) === 4, '2 energy produces 4 base units');
ok(calculateTakeBaseUnits(1) === 2, '1 energy produces 2 base units');
ok(calculateTakeBaseUnits(3) === 6, '3 energy (overdrive) produces 6 base units');

console.log(`pocket-take: all ${passed} checks passed`);
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
./node_modules/.bin/esbuild tests/pocket-take.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-pocket-take.cjs --alias:@=./src && node /tmp/rst-pocket-take.cjs
```
Expected: FAIL with module not found for `../src/rpg/takeEvaluation`.

- [ ] **Step 3: Implement `src/rpg/takeEvaluation.ts`**

```typescript
export type TakeGrade = 'Gold' | 'Silver' | 'Solid';

export interface TakeEvaluationResult {
  grade: TakeGrade;
  multiplier: number;
  qualityBonus: number;
  label: string;
}

/**
 * Evaluates needle position (0.0 to 1.0) against "The Pocket" target zone.
 * - 0.70 to 0.85: Gold Take (In The Pocket)
 * - 0.50 to 0.69 or 0.86 to 0.95: Silver Take (Near Miss)
 * - Otherwise: Solid Take (Standard Take)
 */
export function evaluateTakeAccuracy(needlePosition: number): TakeEvaluationResult {
  const pos = Math.max(0, Math.min(1, needlePosition));

  if (pos >= 0.70 && pos <= 0.85) {
    return {
      grade: 'Gold',
      multiplier: 1.3,
      qualityBonus: 4,
      label: 'Gold Take'
    };
  }

  if ((pos >= 0.50 && pos < 0.70) || (pos > 0.85 && pos <= 0.95)) {
    return {
      grade: 'Silver',
      multiplier: 1.1,
      qualityBonus: 2,
      label: 'Silver Take'
    };
  }

  return {
    grade: 'Solid',
    multiplier: 1.0,
    qualityBonus: 0,
    label: 'Solid Take'
  };
}

/**
 * Calculates adaptive energy cost:
 * - Default: 2 energy
 * - If 1 energy remaining: 1 energy
 * - If overdrive armed: +1 energy if available
 */
export function calculateTakeEnergyCost(availableEnergy: number, overdriveArmed: boolean): number {
  if (availableEnergy <= 0) return 0;
  if (availableEnergy === 1) return 1;

  if (overdriveArmed) {
    return availableEnergy >= 3 ? 3 : availableEnergy;
  }

  return 2;
}

/**
 * Base work units before genre, staff, synergy, and grade multipliers.
 */
export function calculateTakeBaseUnits(energyCost: number): number {
  return energyCost * 2;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
./node_modules/.bin/esbuild tests/pocket-take.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-pocket-take.cjs --alias:@=./src && node /tmp/rst-pocket-take.cjs
```
Expected: PASS with all checks passing.

- [ ] **Step 5: Commit**

```bash
git add src/rpg/takeEvaluation.ts tests/pocket-take.check.ts
git commit -m "feat(rpg): implement take evaluation and pocket accuracy calculation"
```

---

### Task 2: Tone.js Genre Chord Audio Feedback in Audio System

**Files:**
- Modify: `src/utils/audioSystem.ts:900-957`

**Interfaces:**
- Consumes: `Tone.PolySynth`, `Tone.context`, `TakeGrade`.
- Produces:
  ```typescript
  export function playTakeChord(genre: string, grade: 'Gold' | 'Silver' | 'Solid'): void;
  ```

- [ ] **Step 1: Write unit test in `tests/take-audio.check.ts`**

Create `tests/take-audio.check.ts`:
```typescript
import { gameAudio } from '../src/utils/audioSystem';

let passed = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

ok(typeof gameAudio.playTakeChord === 'function', 'gameAudio has playTakeChord method');
// Safe invocation in headless node environment (should gracefully no-op without browser Web Audio)
try {
  gameAudio.playTakeChord('Rock', 'Gold');
  gameAudio.playTakeChord('Soul', 'Silver');
  gameAudio.playTakeChord('Electronic', 'Solid');
  ok(true, 'playTakeChord executed safely in headless environment');
} catch (e) {
  throw new Error(`playTakeChord threw error: ${e}`);
}

console.log(`take-audio: all ${passed} checks passed`);
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
./node_modules/.bin/esbuild tests/take-audio.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-take-audio.cjs --alias:@=./src && node /tmp/rst-take-audio.cjs
```
Expected: FAIL with `gameAudio.playTakeChord is not a function`.

- [ ] **Step 3: Implement `playTakeChord` in `src/utils/audioSystem.ts`**

Add method to `GameAudioSystem`:
```typescript
  playTakeChord(genre: string, grade: 'Gold' | 'Silver' | 'Solid') {
    if (typeof window === 'undefined') return;
    try {
      this.playTactileClick();
      // Genre chord voicings
      const chords: Record<string, string[]> = {
        Rock: ['E3', 'B3', 'E4', 'G4'],
        Pop: ['C4', 'E4', 'G4', 'B4'],
        Soul: ['F3', 'C4', 'Eb4', 'G4', 'Bb4'],
        'R&B': ['Eb3', 'Bb3', 'D4', 'F4', 'Ab4'],
        Electronic: ['A3', 'E4', 'G4', 'C5'],
        HipHop: ['G3', 'D4', 'F4', 'Bb4'],
        Jazz: ['D3', 'C4', 'F4', 'B4', 'E5']
      };

      const selectedNotes = chords[genre] || chords.Pop;
      const notesToPlay = grade === 'Gold'
        ? selectedNotes
        : grade === 'Silver'
        ? selectedNotes.slice(0, 3)
        : selectedNotes.slice(0, 2);

      // Play synthesized chord via Tone if available
      if (Tone && Tone.context && Tone.context.state === 'running') {
        const synth = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: genre === 'Electronic' ? 'sawtooth' : 'triangle' },
          envelope: { attack: 0.02, decay: 0.2, sustain: 0.2, release: 0.6 }
        }).toDestination();
        synth.volume.value = -12;
        synth.triggerAttackRelease(notesToPlay, grade === 'Gold' ? '4n' : '8n');
      }
    } catch {
      // Audio autoplay policy fallback
    }
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
./node_modules/.bin/esbuild tests/take-audio.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-take-audio.cjs --alias:@=./src && node /tmp/rst-take-audio.cjs
```
Expected: PASS with all checks passed.

- [ ] **Step 5: Commit**

```bash
git add src/utils/audioSystem.ts tests/take-audio.check.ts
git commit -m "feat(audio): add Tone.js genre chord synthesis for take results"
```

---

### Task 3: Backend Work Hook Adaptation & Bug Fixes in `useStageWork.tsx`

**Files:**
- Modify: `src/hooks/useStageWork.tsx:195-440`

**Interfaces:**
- Consumes: `TakeGrade`, `evaluateTakeAccuracy`, `calculateTakeEnergyCost`.
- Produces:
  ```typescript
  performDailyWork(options?: {
    energyCost?: number;
    takeGrade?: TakeGrade;
    takeMultiplier?: number;
    qualityBonus?: number;
  }): { finalProjectData?: Project; isComplete: boolean } | undefined;
  ```

- [ ] **Step 1: Inspect latent bug fixes and add tests**

In `useStageWork.tsx`:
Fix lines 324-325:
- Replace undefined `rawCreativity` with `workPoints.creativity`.
- Replace undefined `rawTechnical` with `workPoints.technical`.
- Replace undefined `updatedDiscovered` with `gameState.discoveredSynergies`.

- [ ] **Step 2: Support variable energy and take bonus multiplier**

In `performDailyWork`:
```typescript
    const energyCost = options?.energyCost ?? (project.overdriveArmed ? 2 : 1);
    const takeMultiplier = options?.takeMultiplier ?? 1.0;
    const qualityBonus = options?.qualityBonus ?? 0;

    // Check available energy against energyCost
    if (gameState.playerData.dailyWorkCapacity < energyCost) {
      toast({
        title: "⚡ Insufficient Energy",
        description: `This take requires ${energyCost} energy.`,
        variant: "destructive"
      });
      return;
    }
```
Update `workUnitsToAdd`:
```typescript
    const baseTakeUnits = Math.max(1, Math.floor(energyCost * 2));
    const workUnitsToAdd = Math.max(
      1,
      Math.floor((baseTakeUnits + stageEfficiencyBonus) * roomSpeedMultiplier * synergyBonuses.workUnitSpeedMultiplier * takeMultiplier)
    );
```
Deduct `energyCost` in `dailyWorkCapacity`:
```typescript
    dailyWorkCapacity: Math.max(0, prev.playerData.dailyWorkCapacity - energyCost)
```
Add `qualityBonus` to track points:
```typescript
    accumulatedCPoints: prev.activeProject!.accumulatedCPoints + creativityGain + qualityBonus,
    accumulatedTPoints: prev.activeProject!.accumulatedTPoints + technicalGain + qualityBonus,
```

- [ ] **Step 3: Run existing check runners**

Run:
```bash
bash scripts/run-checks.sh
```
Expected: All automated checks PASS.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useStageWork.tsx
git commit -m "fix(work-loop): resolve latent variable bugs and wire variable energy take progression"
```

---

### Task 4: Interactive Hardware Analog Gauge Component (`PocketMeter.tsx`)

**Files:**
- Create: `src/components/console/PocketMeter.tsx`

**Interfaces:**
- Consumes: `onLock: (accuracy: number) => void`, `isArmed: boolean`.
- Produces: `PocketMeter` component rendering a backlit meter with an oscillating needle and "The Pocket" target bracket.

- [ ] **Step 1: Implement `src/components/console/PocketMeter.tsx`**

```tsx
import React, { useEffect, useRef, useState } from 'react';

interface PocketMeterProps {
  isArmed: boolean;
  onLock: (needlePosition: number) => void;
  className?: string;
}

export const PocketMeter: React.FC<PocketMeterProps> = ({
  isArmed,
  onLock,
  className = ''
}) => {
  const [needlePos, setNeedlePos] = useState(0.2); // 0 to 1
  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const lockedRef = useRef(false);

  useEffect(() => {
    if (!isArmed) {
      setNeedlePos(0.2);
      lockedRef.current = false;
      return;
    }

    lockedRef.current = false;
    startTimeRef.current = performance.now();

    // Smooth sinusoidal needle swing across 0.1 to 0.95 with cycle of ~1.2s
    const tick = (now: number) => {
      if (lockedRef.current) return;
      const elapsed = (now - startTimeRef.current) / 1000;

      // Auto-lock fallback after 2.5s
      if (elapsed >= 2.5) {
        lockedRef.current = true;
        onLock(needlePos);
        return;
      }

      // Smooth oscillation: center at 0.55, amplitude 0.4
      const pos = 0.525 + 0.425 * Math.sin(elapsed * Math.PI * 1.8);
      setNeedlePos(pos);
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isArmed, onLock, needlePos]);

  // Convert needle 0-1 to needle rotation angle (-45deg to +45deg)
  const angle = -45 + needlePos * 90;
  const isInPocket = needlePos >= 0.70 && needlePos <= 0.85;

  return (
    <div className={`relative bg-slate-950 border border-slate-700/80 p-2 rounded-[2px] shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] overflow-hidden ${className}`}>
      {/* Rackmount hardware corner hex bolts */}
      <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-slate-700 border border-slate-600 shadow-inner flex items-center justify-center text-[7px] text-slate-400 font-mono">
        +
      </div>
      <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-slate-700 border border-slate-600 shadow-inner flex items-center justify-center text-[7px] text-slate-400 font-mono">
        +
      </div>

      {/* Meter Header Label */}
      <div className="flex justify-between items-center px-3 mb-1 text-[9px] font-mono tracking-widest text-slate-400">
        <span>TAKE CALIBRATION</span>
        <span className={isInPocket ? 'text-amber-400 font-bold animate-pulse' : 'text-slate-500'}>
          {isInPocket ? '⚡ IN THE POCKET' : 'RMS LEVEL'}
        </span>
        <span>+4 dBu</span>
      </div>

      {/* Analog Faceplate */}
      <div className="relative h-14 bg-gradient-to-b from-amber-950/20 via-slate-900 to-slate-950 border border-slate-800 rounded-[2px] overflow-hidden flex flex-col justify-between p-1.5">
        {/* Arc Track / Pocket Highlight */}
        <div className="relative w-full h-4 bg-slate-800/80 rounded-[1px] overflow-hidden flex">
          {/* 0% to 50%: Normal range (cyan/slate) */}
          <div className="w-[50%] h-full bg-slate-700/50" />
          {/* 50% to 70%: Warm zone (emerald) */}
          <div className="w-[20%] h-full bg-emerald-600/40 border-l border-emerald-500/30" />
          {/* 70% to 85%: The Pocket Sweet Spot (amber/gold glowing) */}
          <div className="w-[15%] h-full bg-amber-500/80 border-x border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] flex items-center justify-center">
            <span className="text-[7px] font-black text-slate-950 uppercase tracking-tighter">POCKET</span>
          </div>
          {/* 85% to 100%: Over-compression / Hot zone (red) */}
          <div className="w-[15%] h-full bg-red-600/40 border-l border-red-500/40" />
        </div>

        {/* Needle Marker Indicator */}
        <div className="relative w-full h-6 flex items-center">
          <div
            className="absolute top-0 bottom-0 w-1 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,1)] transition-all duration-75"
            style={{ left: `${needlePos * 100}%`, transform: 'translateX(-50%)' }}
          >
            <div className="w-2.5 h-2.5 -top-1 -left-0.75 absolute bg-red-500 rounded-full shadow-[0_0_6px_rgba(239,68,68,0.9)]" />
          </div>
        </div>

        {/* Silk-screened dB tick marks */}
        <div className="flex justify-between text-[8px] font-mono text-slate-500 px-1">
          <span>-20dB</span>
          <span>-10dB</span>
          <span>-3dB</span>
          <span className="text-amber-400 font-bold">0dB</span>
          <span className="text-red-400">+6dB</span>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/console/PocketMeter.tsx
git commit -m "feat(ui): add industrial rackmount PocketMeter analog take gauge"
```

---

### Task 5: Industrial Console Aesthetic & Transport Dock Overhaul in `ActiveProject.tsx`

**Files:**
- Modify: `src/components/ActiveProject.tsx`

**Interfaces:**
- Consumes: `PocketMeter`, `evaluateTakeAccuracy`, `calculateTakeEnergyCost`, `playTakeChord`, `useStageWork`.
- Produces: Updated `ActiveProject` with industrial rackmount console chassis, precision 2px corners, metallic corner rack-screws, and tactile `Record Take` / `Lock Take` dock.

- [ ] **Step 1: Replace generic rounded container with industrial chassis**

In `ActiveProject.tsx`:
- Replace outer `rounded-xl/2xl` with `rounded-[2px] border-slate-700/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_12px_40px_rgba(0,0,0,0.85)] bg-slate-950`.
- Add 4 corner rackmount Allen screws (`[+]`).
- Change inner card modules to sharp `rounded-[2px] border-slate-800 bg-slate-900/90`.

- [ ] **Step 2: Wire `Record Take` and `PocketMeter` state**

```tsx
  const [takeState, setTakeState] = useState<'idle' | 'tracking'>('idle');
  const [lastTakeGrade, setLastTakeGrade] = useState<{ grade: string; text: string } | null>(null);

  const availableEnergy = gameState.playerData.dailyWorkCapacity;
  const energyCost = calculateTakeEnergyCost(availableEnergy, overdriveArmed);

  const handleArmTake = () => {
    if (availableEnergy <= 0 || isProjectComplete) return;
    playSound('ui-click', 0.5);
    gameAudio.playGearSwitch();
    setTakeState('tracking');
  };

  const handleLockTake = (needlePosition: number) => {
    const verdict = evaluateTakeAccuracy(needlePosition);
    setTakeState('idle');

    // Trigger Tone.js chord synthesis + SFX
    gameAudio.playTakeChord(project.genre, verdict.grade);
    triggerScreenShake('light');

    // Execute work in useStageWork with take bonuses
    performDailyWork({
      energyCost,
      takeGrade: verdict.grade,
      takeMultiplier: verdict.multiplier,
      qualityBonus: verdict.qualityBonus
    });

    setLastTakeGrade({
      grade: verdict.grade,
      text: `${verdict.label}! +${verdict.qualityBonus} Quality (${Math.round((verdict.multiplier - 1) * 100)}% Boost)`
    });

    toast({
      title: verdict.grade === 'Gold' ? '🔥 IN THE POCKET! (Gold Take)' : verdict.grade === 'Silver' ? '✨ TIGHT TAKE! (Silver Take)' : '🎵 SOLID TAKE',
      description: `${verdict.label}: Advanced stage with ${energyCost} energy spent.`,
      className: verdict.grade === 'Gold' ? 'bg-amber-950 border-amber-500 text-amber-200' : 'bg-gray-800 border-gray-600 text-white',
      duration: 3000
    });
  };
```

- [ ] **Step 3: Update the Bottom Transport Dock JSX**

Replace the old single blue button with:
```tsx
        {/* Industrial Console Transport Dock */}
        <div className="shrink-0 pt-2.5 mt-2 border-t border-slate-800 bg-slate-950/95">
          {takeState === 'tracking' ? (
            <div className="space-y-2">
              <PocketMeter
                isArmed={true}
                onLock={handleLockTake}
              />
              <button
                onClick={() => handleLockTake(0.78)} // Instant lock button
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-black tracking-wider uppercase text-sm rounded-[2px] shadow-[0_0_15px_rgba(251,191,36,0.6)] border border-amber-300 transition-all flex items-center justify-center gap-2 animate-pulse"
              >
                <span>🎯</span>
                <span>LOCK TAKE IN THE POCKET!</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {lastTakeGrade && (
                <div className="px-2 py-1 text-center text-xs font-mono font-bold tracking-wide text-amber-300 bg-amber-950/60 border border-amber-500/40 rounded-[2px]">
                  {lastTakeGrade.text}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Button
                  onClick={toggleOverdrive}
                  disabled={availableEnergy < 2 || isProjectComplete}
                  variant="outline"
                  className={`h-9 text-xs font-mono font-bold uppercase rounded-[2px] flex-1 border transition-all ${
                    overdriveArmed
                      ? 'bg-orange-600 border-orange-400 text-white shadow-[0_0_10px_rgba(234,88,12,0.6)]'
                      : 'bg-slate-900 border-slate-700 text-orange-400 hover:bg-slate-800'
                  }`}
                >
                  {overdriveArmed ? '🔥 OVERDRIVE ENGAGED (+1⚡ · +75%)' : '🔥 ARM OVERDRIVE (+1⚡ · +75%)'}
                </Button>
              </div>

              <button
                onClick={handleArmTake}
                disabled={availableEnergy <= 0 || isProjectComplete}
                className={`w-full py-3.5 text-sm font-black uppercase tracking-wider rounded-[2px] border transition-all flex items-center justify-center gap-2 shadow-lg ${
                  isProjectComplete
                    ? 'bg-emerald-600 border-emerald-400 text-white'
                    : availableEnergy > 0
                    ? 'bg-red-600 hover:bg-red-500 border-red-400 text-white shadow-[0_0_12px_rgba(220,38,38,0.5)] active:scale-[0.99]'
                    : 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isProjectComplete ? (
                  '🎉 PROJECT READY FOR REVIEW!'
                ) : availableEnergy > 0 ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping mr-1" />
                    <span>🔴 RECORD TAKE ({energyCost}⚡ · {availableEnergy} LEFT)</span>
                  </>
                ) : (
                  '😴 STUDIO EXHAUSTED (ADVANCE DAY)'
                )}
              </button>
            </div>
          )}
        </div>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ActiveProject.tsx
git commit -m "feat(ui): overhaul ActiveProject with industrial console aesthetic and Record Take transport dock"
```

---

### Task 6: Automated Verification & Check Suite Integration

**Files:**
- Modify: `scripts/run-checks.sh:27-32`

- [ ] **Step 1: Add `pocket-take` and `take-audio` to `scripts/run-checks.sh`**

Update lines in `scripts/run-checks.sh`:
```bash
echo "=== open source tools and assets ==="
for check in tools-assets audio-system confetti-juice minigames-audio user-interaction vu-meter pocket-take take-audio; do
  ./node_modules/.bin/esbuild "tests/$check.check.ts" --bundle --platform=node --format=cjs --outfile="/tmp/rst-$check.cjs" --alias:@=./src >/dev/null
  node "/tmp/rst-$check.cjs"
done
```

- [ ] **Step 2: Run all repo checks**

Run:
```bash
bash scripts/run-checks.sh
```
Expected: All automated checks pass (first-session-guide, daily-challenges, talents, synergies, pocket-take, take-audio, balance invariants).

- [ ] **Step 3: Commit**

```bash
git add scripts/run-checks.sh
git commit -m "test: register pocket-take and take-audio checks in automated check runner"
```
