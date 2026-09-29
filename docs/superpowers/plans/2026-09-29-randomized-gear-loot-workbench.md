# Randomized Gear Loot, Daily Classifieds & Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement procedural vintage gear loot, deterministic daily classified crate-digging, S-rank project drops, dual-track workbench restoration, and console law session couplings.

**Architecture:** Extend existing `Equipment` with procedural `EquipmentInstance` affixes (traits & quirks). Use Mulberry32 seeded RNG for daily classified listings. Couple quirks (e.g. 60Hz hum) to Console Law #7 in `takeEvaluation.ts`. Connect `GearMaintenanceGame` to the workbench for hands-on calibration yielding `technicalAptitude` XP.

**Tech Stack:** TypeScript, React, Tailwind CSS, Mulberry32 seeded RNG, Tone.js, node:test assertions.

**Spec:** [`docs/superpowers/specs/2026-09-29-randomized-gear-loot-workbench-design.md`](file:///Volumes/Harry/DEV/Recording%20Studio%20Tycoon/RST%20v1.5/recording-studio-tycoon/docs/superpowers/specs/2026-09-29-randomized-gear-loot-workbench-design.md)

## Global Constraints

- Must maintain 100% backward compatibility with existing save states (`ownedEquipment` containing un-instanced items).
- All daily generation must use seeded Mulberry32 RNG so reloads do not reroll market stock.
- Zero external dependencies to install; leverage existing `Tone.js`, `Kenney` UI SFX, and `Lucide` icons.
- All check suites in `bash scripts/run-checks.sh` must remain 100% passing.

---

### Task 1: Gear Loot Types & GameState Contracts

**Files:**
- Create: `src/types/gearLoot.ts`
- Modify: `src/types/game.ts`
- Test: `tests/gear-loot-types.check.ts`

**Interfaces:**
- Produces: `GearRarity`, `GearTrait`, `GearQuirk`, `EquipmentInstance`, `DailyClassifiedListing`, `WorkbenchJob`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/gear-loot-types.check.ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { EquipmentInstance, GearTrait, GearQuirk, DailyClassifiedListing } from '../src/types/gearLoot';

describe('Gear Loot Data Types', () => {
  it('instantiates valid EquipmentInstance with traits and quirks', () => {
    const trait: GearTrait = {
      id: 'british-iron',
      name: 'British Iron Transformers',
      description: 'Heavy wound iron imparting thick midrange punch.',
      qualityBonus: 15,
      critChanceBonus: 2,
    };
    const quirk: GearQuirk = {
      id: '60hz-hum',
      name: 'Ground Loop Mains Hum',
      description: 'Audible 60Hz hum',
      severity: 'moderate',
      qualityPenalty: -8,
      violatesConsoleLawId: 'law-ground-loop',
    };
    const inst: EquipmentInstance = {
      id: 'vintage_preamp',
      instanceId: 'gear_inst_test_1',
      name: 'Vintage Console Strip',
      category: 'outboard',
      price: 1200,
      description: 'Classic analog preamp strip',
      bonuses: { qualityBonus: 10 },
      icon: '🎛️',
      condition: 45,
      rarity: 'studio-classic',
      traits: [trait],
      quirks: [quirk],
      restorationState: 'barn-find',
      origin: 'classifieds',
      resaleValueMultiplier: 0.75,
    };

    assert.strictEqual(inst.instanceId, 'gear_inst_test_1');
    assert.strictEqual(inst.traits.length, 1);
    assert.strictEqual(inst.quirks[0].violatesConsoleLawId, 'law-ground-loop');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx tests/gear-loot-types.check.ts`  
Expected: FAIL with "Cannot find module '../src/types/gearLoot'"

- [ ] **Step 3: Implement `src/types/gearLoot.ts` and modify `src/types/game.ts`**

Create `src/types/gearLoot.ts`:
```typescript
import { Equipment } from './game';

export type GearRarity =
  | 'standard'
  | 'roadworn'
  | 'studio-classic'
  | 'rare-mod'
  | 'holy-grail';

export interface GearTrait {
  id: string;
  name: string;
  description: string;
  genreBonus?: Record<string, number>;
  qualityBonus?: number;
  critChanceBonus?: number;
  pocketMeterToleranceBonus?: number;
  clientLoyaltyBonus?: number;
}

export interface GearQuirk {
  id: string;
  name: string;
  description: string;
  severity: 'minor' | 'moderate' | 'critical';
  speedPenalty?: number;
  qualityPenalty?: number;
  pocketMeterNarrowPercent?: number;
  variancePenalty?: number;
  violatesConsoleLawId?: string;
}

export interface EquipmentInstance extends Equipment {
  instanceId: string;
  rarity: GearRarity;
  traits: GearTrait[];
  quirks: GearQuirk[];
  restorationState: 'barn-find' | 'serviced' | 'hot-rodded';
  origin: 'classifieds' | 'project_drop' | 'retail';
  resaleValueMultiplier: number;
  vintageYearEstimate?: number;
  sellerLore?: string;
}

export interface DailyClassifiedListing {
  id: string;
  equipment: EquipmentInstance;
  askingPrice: number;
  retailComparisonPrice: number;
  location: string;
  sellerNotes: string;
  purchased: boolean;
}

export interface WorkbenchJob {
  instanceId: string;
  targetQuirkId: string;
  startedDay: number;
  daysRemaining: number;
  costPaid: number;
}
```

In `src/types/game.ts`, add:
```typescript
import { DailyClassifiedListing, WorkbenchJob } from './gearLoot';

// Inside GameState interface:
dailyClassifieds?: {
  day: number;
  listings: DailyClassifiedListing[];
};
activeWorkbenchJob?: WorkbenchJob | null;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx tests/gear-loot-types.check.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/gearLoot.ts src/types/game.ts tests/gear-loot-types.check.ts
git commit -m "feat(loot): add gear loot types and game state contracts"
```

---

### Task 2: Authored Mojo Traits, Vintage Quirks & Catalogs

**Files:**
- Create: `src/data/gearLoot/traitsAndQuirks.ts`
- Test: `tests/traits-and-quirks.check.ts`

**Interfaces:**
- Produces: `AUTHORED_TRAITS: GearTrait[]`, `AUTHORED_QUIRKS: GearQuirk[]`, `getTraitById(id)`, `getQuirkById(id)`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/traits-and-quirks.check.ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AUTHORED_TRAITS, AUTHORED_QUIRKS, getTraitById, getQuirkById } from '../src/data/gearLoot/traitsAndQuirks';

describe('Authored Traits & Quirks', () => {
  it('contains essential audio-authentic traits and quirks', () => {
    assert.ok(AUTHORED_TRAITS.length >= 6);
    assert.ok(AUTHORED_QUIRKS.length >= 5);

    const britishIron = getTraitById('british-iron');
    assert.ok(britishIron);
    assert.strictEqual(britishIron?.qualityBonus, 15);

    const hum = getQuirkById('60hz-hum');
    assert.ok(hum);
    assert.strictEqual(hum?.violatesConsoleLawId, 'law-ground-loop');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx tests/traits-and-quirks.check.ts`  
Expected: FAIL

- [ ] **Step 3: Implement `src/data/gearLoot/traitsAndQuirks.ts`**

Define `AUTHORED_TRAITS` (e.g. `british-iron`, `silky-air`, `germanium-fuzz`, `discrete-class-a`, `abbey-ghost`, `fat-transformers`) and `AUTHORED_QUIRKS` (e.g. `60hz-hum`, `scratchy-pots`, `leaky-caps`, `sticky-fader`, `noisy-tube`) with full helper functions.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx tests/traits-and-quirks.check.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/data/gearLoot/traitsAndQuirks.ts tests/traits-and-quirks.check.ts
git commit -m "feat(loot): author audio-authentic traits and vintage hardware quirks"
```

---

### Task 3: Procedural Gear Generation & Seeded Daily Classifieds Engine

**Files:**
- Create: `src/services/gearLootEngine.ts`
- Test: `tests/gear-loot-engine.check.ts`

**Interfaces:**
- Consumes: `seededRandom.ts`, `availableEquipment`, `AUTHORED_TRAITS`, `AUTHORED_QUIRKS`
- Produces: `generateDailyClassifieds(day: number, seed: number, currentYear: number): DailyClassifiedListing[]`, `rollProjectLootDrop(projectGrade: string, isMoonshot: boolean, seed: number, currentYear: number): EquipmentInstance | null`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/gear-loot-engine.check.ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateDailyClassifieds, rollProjectLootDrop } from '../src/services/gearLootEngine';

describe('Gear Loot Engine', () => {
  it('generates deterministic daily classified listings based on day and seed', () => {
    const list1 = generateDailyClassifieds(15, 12345, 1978);
    const list2 = generateDailyClassifieds(15, 12345, 1978);
    const listDifferentDay = generateDailyClassifieds(16, 12345, 1978);

    assert.strictEqual(list1.length, 3);
    assert.strictEqual(list1[0].equipment.instanceId, list2[0].equipment.instanceId);
    assert.strictEqual(list1[0].askingPrice, list2[0].askingPrice);
    assert.notStrictEqual(list1[0].equipment.instanceId, listDifferentDay[0].equipment.instanceId);
  });

  it('rolls project loot drop with correct probabilities and rarities', () => {
    // S grade moonshot should roll drops frequently
    let drops = 0;
    for (let s = 0; s < 100; s++) {
      const drop = rollProjectLootDrop('S', true, s * 7919, 1982);
      if (drop) drops++;
    }
    assert.ok(drops > 25 && drops < 55, `Expected 25-55 drops, got ${drops}`);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx tests/gear-loot-engine.check.ts`  
Expected: FAIL

- [ ] **Step 3: Implement `src/services/gearLootEngine.ts`**

Use `Mulberry32` from `src/simulation/seededRandom.ts` to procedurally construct `EquipmentInstance` objects with pricing formulas, condition, seller notes, and traits/quirks.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx tests/gear-loot-engine.check.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/gearLootEngine.ts tests/gear-loot-engine.check.ts
git commit -m "feat(loot): implement procedural gear generator and daily classifieds engine"
```

---

### Task 4: Take Evaluation Session Math & Console Law Couplings

**Files:**
- Modify: `src/rpg/takeEvaluation.ts`
- Modify: `src/hooks/useStageWork.tsx`
- Test: `tests/gear-take-evaluation.check.ts`

**Interfaces:**
- Consumes: `EquipmentInstance`, `calculateGearLootModifiers`
- Produces: Integrated take score adjustments, quirk penalties, and Console Law #7 logging

- [ ] **Step 1: Write the failing test**

```typescript
// tests/gear-take-evaluation.check.ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateGearLootModifiers } from '../src/rpg/takeEvaluation';
import type { EquipmentInstance } from '../src/types/gearLoot';

describe('Gear Session Modifiers & Console Law Couplings', () => {
  it('applies quirk penalties and detects Console Law #7 violations', () => {
    const hummingPreamp: EquipmentInstance = {
      id: 'preamp_1',
      instanceId: 'inst_1',
      name: 'Humming Tube Preamp',
      category: 'outboard',
      price: 500,
      description: '',
      bonuses: {},
      icon: '🎛️',
      condition: 30,
      rarity: 'roadworn',
      traits: [],
      quirks: [{
        id: '60hz-hum',
        name: 'Ground Loop Mains Hum',
        description: '',
        severity: 'critical',
        qualityPenalty: -8,
        violatesConsoleLawId: 'law-ground-loop',
      }],
      restorationState: 'barn-find',
      origin: 'classifieds',
      resaleValueMultiplier: 0.5,
    };

    const mods = calculateGearLootModifiers([hummingPreamp]);
    assert.strictEqual(mods.qualityBonus, -8);
    assert.ok(mods.activeViolations.includes('law-ground-loop'));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx tests/gear-take-evaluation.check.ts`  
Expected: FAIL

- [ ] **Step 3: Implement `calculateGearLootModifiers` in `src/rpg/takeEvaluation.ts`**

Export `calculateGearLootModifiers(equipment: Equipment[])` and wire into take evaluation logic.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx tests/gear-take-evaluation.check.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/rpg/takeEvaluation.ts tests/gear-take-evaluation.check.ts
git commit -m "feat(rpg): integrate gear loot traits and quirks into take evaluation"
```

---

### Task 5: Workbench Restoration & Minigame Wiring

**Files:**
- Create: `src/components/modals/WorkbenchModal.tsx`
- Modify: `src/components/minigames/GearMaintenanceGame.tsx`
- Test: `tests/workbench-restoration.check.ts`

**Interfaces:**
- Produces: Dual-track repair actions (outsource vs manual bench drill), XP grant dispatch, quirk removal

- [ ] **Step 1: Write the failing test**

```typescript
// tests/workbench-restoration.check.ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { serviceQuirkInstant, serviceQuirkMinigameOutcome } from '../src/services/workbenchService';
import type { EquipmentInstance } from '../src/types/gearLoot';

describe('Workbench Service Logic', () => {
  it('clears targeted quirk and restores condition on successful minigame completion', () => {
    const item: EquipmentInstance = {
      id: 'mic_1',
      instanceId: 'inst_mic_1',
      name: 'Scratchy Mic',
      category: 'microphone',
      price: 400,
      description: '',
      bonuses: {},
      icon: '🎤',
      condition: 40,
      rarity: 'roadworn',
      traits: [],
      quirks: [{
        id: 'scratchy-pots',
        name: 'Dirty Carbon Potentiometer',
        description: '',
        severity: 'minor',
        speedPenalty: -5,
      }],
      restorationState: 'barn-find',
      origin: 'classifieds',
      resaleValueMultiplier: 0.6,
    };

    const outcome = serviceQuirkMinigameOutcome(item, 'scratchy-pots', 95);
    assert.strictEqual(outcome.updatedItem.quirks.length, 0);
    assert.strictEqual(outcome.updatedItem.condition, 100);
    assert.ok(outcome.xpAwarded >= 50);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx tests/workbench-restoration.check.ts`  
Expected: FAIL

- [ ] **Step 3: Implement `src/services/workbenchService.ts` and `src/components/modals/WorkbenchModal.tsx`**

Implement business logic and UI modal allowing players to choose Outsource vs Manual Workbench Minigame.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx tests/workbench-restoration.check.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/workbenchService.ts src/components/modals/WorkbenchModal.tsx tests/workbench-restoration.check.ts
git commit -m "feat(workbench): implement dual-track repair and calibration workbench"
```

---

### Task 6: Daily Classifieds Modal & Studio Hotspot Wiring

**Files:**
- Create: `src/components/modals/ClassifiedsModal.tsx`
- Modify: `src/components/StudioInspector.tsx`
- Modify: `src/simulation/simulationClock.ts`

**Interfaces:**
- Produces: Visual classifieds paper aesthetic, buy actions, refresh on day advance

- [ ] **Step 1: Write integration check**
Verify `ClassifiedsModal` renders listings, shows seller notes, quirks in amber/red badges, and deducts money upon purchase while adding to `gameState.ownedEquipment`.

- [ ] **Step 2: Implement `ClassifiedsModal.tsx` and attach to Analog Phone / Lounge hotspot in `StudioInspector.tsx`**

- [ ] **Step 3: Wire daily refresh in `simulationClock.ts` when day advances**

- [ ] **Step 4: Verify with smoke test and component check**

- [ ] **Step 5: Commit**

```bash
git add src/components/modals/ClassifiedsModal.tsx src/components/StudioInspector.tsx src/simulation/simulationClock.ts
git commit -m "feat(ui): add classifieds crate-digging modal and studio hotspot wiring"
```

---

### Task 7: Full System Verification & Regression Suite

**Files:**
- Modify: `scripts/run-checks.sh`
- Test: All suites

- [ ] **Step 1: Add new test suites to `scripts/run-checks.sh`**
- [ ] **Step 2: Run `bash scripts/run-checks.sh` and ensure 100% pass rate**
- [ ] **Step 3: Run `pnpm run build` to verify type checking and Vite bundle**
- [ ] **Step 4: Commit**

```bash
git add scripts/run-checks.sh
git commit -m "chore: integrate gear loot and workbench checks into test runner"
```
