# Design Specification: Randomized Gear Loot, Daily Classifieds & Workbench System

**Date:** 2026-09-29  
**Status:** Approved  
**Version:** 1.0  
**Target Milestone:** v0.5.0  

---

## 1. Executive Summary & Goals

This specification defines the architecture, data structures, procedural generation algorithms, workbench gameplay loop, and session couplings for:
1. **Procedural Vintage Gear Loot**: Authentic vintage audio hardware finds generated with audio-authentic tone mojo (positive traits), vintage quirks (flaws requiring repair/calibration), condition ratings, and rarity tiers.
2. **Daily Classifieds & Crate-Digging ("The Studio Recycler")**: A deterministic daily marketplace refreshed at midnight via seeded Mulberry32 RNG where players hunt for barn finds and pawn shop bargains at discounted prices.
3. **High-Stakes Session Loot Drops**: S-grade project completions and Moonshot contract wins trigger authentic client barter and studio salvage gear drops.
4. **Dual-Track Workbench Restoration**: A repair and modding station offering either instant cash/tech outsourcing OR hands-on calibration minigames (`GearMaintenanceGame`) that award Producer `technicalAptitude` XP and save studio funds.
5. **Console Laws & Narrative Couplings**: Grounded in Console Law #7 (*"Law of the Ground Loop"*) and related studio lore, unlocking custom synergies and rival studio interactions (Silas Vance, Roxy Riot).

---

## 2. System Architecture & Component Hierarchy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MAIN STUDIO APPLICATION                         │
├───────────────────────────────────┬────────────────────────────────────┤
│     Living Isometric Studio       │        Console Transport Dock      │
│  (PixiJS WebGLCanvas / Hotspots)  │   (PocketMeter / Lock Take Button) │
│   - Outboard Rack / Workbench     │                                    │
│   - Analog Phone / Classifieds    │  ┌──────────────────────────────┐  │
│   - Live Room / Mic Locker        │  │  Classifieds / Pawn Inspector│  │
│                                   │  │  - Daily 3-4 Vintage Finds   │  │
│                                   │  │  - Condition & Quirk Readout │  │
│                                   │  │  - Buy / Negotiate           │  │
│                                   │  └──────────────────────────────┘  │
└───────────────────────────────────┴────────────────────────────────────┘
                                    │
                         State / Engine Events
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        GEAR LOOT ENGINE                                │
│                  (src/services/gearLootEngine.ts)                      │
│  - Generates deterministic daily classified listings via Mulberry32   │
│  - Evaluates project S-rank / Moonshot loot drop tables                │
│  - Calculates quirk penalties & mojo trait bonuses during sessions     │
└────────────────────────────────────────────────────────────────────────┘
                                    │
            ┌───────────────────────┴───────────────────────┐
            ▼                                               ▼
┌───────────────────────────────┐               ┌───────────────────────────────┐
│     WORKBENCH REPAIR BENCH    │               │    SESSION WORK & SYNERGIES   │
│ (src/components/modals/       │               │ (takeEvaluation.ts /          │
│  WorkbenchModal.tsx)          │               │  useStageWork.tsx /           │
│ - Option A: Outsource ($/days)│               │  synergyCatalog.ts)           │
│ - Option B: Calibration Drill │               │ - 60Hz hum violates Law #7    │
│   (GearMaintenanceGame.tsx)   │               │ - Tone mojo boosts take score │
│   -> Awards Tech XP + clears  │               │ - Unlocks vintage synergies   │
│      target quirk             │               └───────────────────────────────┘
└───────────────────────────────┘
```

---

## 3. Data Models & State Contracts

### 3.1 Gear Loot Types (`src/types/gearLoot.ts`)

```typescript
export type GearRarity =
  | 'standard'        // Stock commercial equipment
  | 'roadworn'        // Used, battle-tested studio workhorse
  | 'studio-classic'  // Coveted vintage unit in good standing
  | 'rare-mod'        // Custom circuit mod or transformer upgrade
  | 'holy-grail';     // Museum-grade, irreplaceable analog relic

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
  speedPenalty?: number;          // e.g. -0.05 for scratchy pots
  qualityPenalty?: number;        // e.g. -0.08 for ground hum
  pocketMeterNarrowPercent?: number; // e.g. 10 for sticky fader
  variancePenalty?: number;       // e.g. 0.05 for leaky capacitors
  violatesConsoleLawId?: string;  // e.g. 'law-ground-loop'
}

export interface EquipmentInstance extends import('@/types/game').Equipment {
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
```

### 3.2 GameState Extension (`src/types/game.ts`)

```typescript
export interface GameState {
  // Existing state properties...
  ownedEquipment: Equipment[]; // Can contain legacy Equipment or EquipmentInstance
  dailyClassifieds?: {
    day: number;
    listings: DailyClassifiedListing[];
  };
  activeWorkbenchJob?: {
    instanceId: string;
    targetQuirkId: string;
    startedDay: number;
    daysRemaining: number;
    costPaid: number;
  } | null;
}
```

---

## 4. Authored Traits, Quirks & Lore Reference

### 4.1 Audio-Authentic Tone Mojo Traits

| Trait ID | Name | Effect | Best Aligned Genres | Lore Flavor |
| :--- | :--- | :--- | :--- | :--- |
| `british-iron` | British Iron Transformers | +15% Genre Quality, +2% Gold Take Crit | Rock, Blues, Punk | *"Heavy wound St. Ives iron imparting thick midrange punch."* |
| `silky-air` | Silky German Ribbon | +12% Clarity, +10% Client Loyalty | Acoustic, Vocal, Jazz | *"Ultra-thin corrugated foil with velvet smooth top-end air."* |
| `germanium-fuzz` | Germanium Grit | +15% Distortion Warmth, +Lo-Fi Mojo | Punk, Grunge, Indie | *"NOS military transistors on the edge of thermal runaway."* |
| `discrete-class-a` | Discrete Class-A Topology | +5% Base Quality Floor across all stages | Universal | *"Point-to-point hand wired with zero feedback loop."* |
| `abbey-ghost` | Vintage Studio Heritage | +25% Award Points, +15 Reputation Gain | Rock, Orchestral | *"Rumored to have tracked vocal harmonies in St John's Wood."* |

### 4.2 Vintage Hardware Quirks

| Quirk ID | Name | Gameplay Penalty | Associated Console Law | Repair Requirement |
| :--- | :--- | :--- | :--- | :--- |
| `60hz-hum` | Ground Loop Mains Hum | -8% Quality, audible 60Hz hum | Law #7 (*"Law of the Ground Loop"*) | Workbench Grounding Check |
| `scratchy-pots` | Dirty Carbon Potentiometer | -5% Stage Work Speed | Law #3 (*"Law of the Master Tape"*) | DeoxIT Contact Flush |
| `leaky-caps` | Leaky Electrolytic Caps | +/- 5% Random Take Quality Variance | Law #5 (*"Law of the 3 AM Fader"*) | Re-Cap Power Supply |
| `sticky-fader` | Binding Console Fader | -10% PocketMeter Sweet-Spot Width | Law #4 (*"Law of the First Take"*) | Fader Track Lube & Alignment |
| `noisy-tube` | Microphonic Preamp Tube | -10% Vocal/Acoustic Quality | Law #1 (*"Law of the Red Light"*) | Tube Roll & Bias Test |

---

## 5. Procedural Generation & Drop Tables

### 5.1 Deterministic Daily Classifieds
1. **Trigger:** `simulationClock.ts` advances day (`currentDay`).
2. **Seed Generation:** `seed = hashInt(saveGameSeed ^ (currentDay * 7919))`.
3. **Catalog Selection:** Pulls 3 to 4 base equipment templates from `availableEquipment` where `availableFrom <= currentYear`.
4. **Affix Roll:**
   - 60% chance of 1 quirk; 20% chance of 2 quirks.
   - 50% chance of 1 trait; 15% chance of 2 traits (higher for higher rarities).
5. **Pricing:** 
   $$\text{AskingPrice} = \text{BasePrice} \times \text{ConditionMulti} \times (1 - 0.15 \times \text{QuirkCount}) \times \text{RngVariance}(0.85, 1.15)$$

### 5.2 S-Grade Project Loot Drops
1. **Evaluation:** Project settlement in `useStageWork.tsx`.
2. **Probability:**
   - Standard Project with Final Grade S: 15% chance.
   - Moonshot Contract with Final Grade S: 40% chance.
3. **Drop Table Weightings:**
   - 50% `'roadworn'`
   - 35% `'studio-classic'`
   - 12% `'rare-mod'`
   - 3% `'holy-grail'`
4. **Fanfare:** Pop-up modal with particle burst, audio chord fanfare, and prompt: **"Send to Workbench"** or **"Rack in Studio"**.

---

## 6. Workbench Restoration & Calibration

### 6.1 Dual-Track Architecture

```
                       ┌─────────────────────────┐
                       │  GEAR REPAIR SELECTION  │
                       │  (Target Quirk Chosen)  │
                       └────────────┬────────────┘
                                    │
               ┌────────────────────┴────────────────────┐
               ▼                                         ▼
┌──────────────────────────────┐       ┌──────────────────────────────┐
│       OUTSOURCE REPAIR       │       │    HANDS-ON CALIBRATION      │
│  - Deducts $150-$600 fee     │       │  - Launches GearMaintenance  │
│  - Locks item for 1-2 days   │       │  - $0 bench fee              │
│  - Automatic quirk removal   │       │  - Real-time audio feedback  │
│  - 0 Player XP earned        │       │  - Score >= 70%: Quirk fixed │
└──────────────────────────────┘       │  - Score >= 90%: +Bonus Mojo │
                                       │  - Awards +35 to +60 Tech XP │
                                       └──────────────────────────────┘
```

### 6.2 Hands-On Minigame Integration (`GearMaintenanceGame.tsx`)
- Configured with test oscillator tone that fades out as dials lock into sweet-spot.
- High-grade completion (>=90%) triggers a 25% chance to roll a bonus positive trait: *"Hand-Biased Sweet Spot"* (+5% quality boost).
- Directly awards `technicalAptitude` XP via `unifiedXp.ts`.

---

## 7. Studio Synergies & Session Math

### 7.1 Take Evaluation Integration (`src/rpg/takeEvaluation.ts`)
```typescript
export function calculateGearLootModifiers(equipment: Equipment[]): {
  speedMultiplier: number;
  qualityBonus: number;
  critChanceBonus: number;
  toleranceBonus: number;
  activeViolations: string[];
} {
  let speedMultiplier = 1.0;
  let qualityBonus = 0;
  let critChanceBonus = 0;
  let toleranceBonus = 0;
  const activeViolations: string[] = [];

  for (const item of equipment) {
    const inst = item as EquipmentInstance;
    if (inst.quirks) {
      for (const quirk of inst.quirks) {
        if (quirk.speedPenalty) speedMultiplier += quirk.speedPenalty;
        if (quirk.qualityPenalty) qualityBonus += quirk.qualityPenalty;
        if (quirk.pocketMeterNarrowPercent) toleranceBonus -= quirk.pocketMeterNarrowPercent;
        if (quirk.violatesConsoleLawId) activeViolations.push(quirk.violatesConsoleLawId);
      }
    }
    if (inst.traits) {
      for (const trait of inst.traits) {
        if (trait.qualityBonus) qualityBonus += trait.qualityBonus;
        if (trait.critChanceBonus) critChanceBonus += trait.critChanceBonus;
        if (trait.pocketMeterToleranceBonus) toleranceBonus += trait.pocketMeterToleranceBonus;
      }
    }
  }

  return { speedMultiplier, qualityBonus, critChanceBonus, toleranceBonus, activeViolations };
}
```

### 7.2 Authored Synergies (`src/data/synergies/synergyCatalog.ts`)
- **"British Invasion Stack"**: British Iron Transformers + Celestion Loaded Cab + Tube Desk = +20% Rock/Blues tracking quality.
- **"Motown Direct Line"**: Restored Tube DI Box + Bass Guitar + Class-A Preamp = +25% Rhythm groove capture.

---

## 8. Narrative Dilemmas & Rival Studio Encounters

Discovering a `'holy-grail'` or rare vintage piece triggers a story dilemma via `CutsceneDirector.tsx`:
- **Silas Vance (Black Wax Vault)**:
  - *"Word travels fast. That 1968 German tape deck you dug up belongs in a real temple of tape. I'll wire $6,000 cash right now."*
  - **Choice A (Sell Out)**: +$6,000 Cash, -10 Reputation with Indie/Purist clients, gear removed.
  - **Choice B (Keep & Defend)**: +15 Purist Reputation, rivalry escalates, Silas challenges you in the next Golden Reel awards.
- **Roxy Riot (The Distortion Cellar)**:
  - Offers a direct swap for a rare prototype germanium fuzz box mod.

---

## 9. Verification & Testing Strategy

1. **Unit & Engine Checks (`tests/gear-loot-engine.check.ts`)**:
   - Verify deterministic Mulberry32 daily classified generation (same seed + day yields identical listings).
   - Test S-grade and Moonshot drop rates over 1,000 simulated project settlements.
   - Verify affix modifiers accurately apply speed, quality, and PocketMeter sweet-spot tolerances without mutation.
2. **Workbench Integration Checks (`tests/workbench-restoration.check.ts`)**:
   - Test idle outsource flow deducting funds and clearing quirks.
   - Test minigame pass/crit flow removing quirks, awarding XP, and rolling bonus traits.
3. **Save Compatibility Checks (`tests/save-compatibility.check.ts`)**:
   - Verify existing legacy saves load cleanly with standard `Equipment` items alongside new `EquipmentInstance` objects.
