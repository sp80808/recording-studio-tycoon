# Gameplay Tools, Assets, and Milestone Juice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Tone.js, canvas-confetti, and Kenney CC0 tactile UI audio to upgrade gameplay feel, milestone celebrations, and Web Audio foundations.

**Architecture:** Initialize Tone.js alongside native Web Audio in `audioSystem.ts` on user gesture. Ingest Kenney CC0 audio assets into `public/audio/ui-sfx/kenney/` and expose tactile sound triggers (`playTactileClick`, `playGearSwitch`). Integrate `canvas-confetti` visual particle bursts for high-tier song reviews and milestone record certifications.

**Tech Stack:** React 18/19, TypeScript, Vite 5, Tailwind CSS, pnpm, Tone.js, canvas-confetti, Kenney CC0 UI Audio.

**Spec:** `docs/superpowers/specs/2026-09-28-gameplay-tools-and-assets-design.md`

## Global Constraints
- Volume format is ExFAT; preserve `core.filemode = false` and run `clean-appledouble.py` as needed.
- Package manager is `pnpm` (run from active codebase: `RST v1.5/recording-studio-tycoon`).
- All existing tests in `bash scripts/run-checks.sh` must remain 100% passing.
- Audio playback must respect user volume preferences and browser user-gesture requirements.

---

### Task 1: Package Installation & Asset Ingestion

**Files:**
- Create: `public/audio/ui-sfx/kenney/` (asset directory)
- Modify: `package.json`
- Test: `tests/tools-assets.check.ts`

**Interfaces:**
- Consumes: `pnpm` package manager, GitHub / Kenney CC0 asset endpoints
- Produces: Installed `tone`, `canvas-confetti`, `@types/canvas-confetti`; downloaded `.wav` files in `public/audio/ui-sfx/kenney/`

- [ ] **Step 1: Write verification test for assets and dependencies**

Create `tests/tools-assets.check.ts`:
```typescript
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

const baseDir = path.resolve(__dirname, '..');
const pkgPath = path.join(baseDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

assert(pkg.dependencies['tone'], 'Expected tone to be in dependencies');
assert(pkg.dependencies['canvas-confetti'], 'Expected canvas-confetti to be in dependencies');

const kenneyDir = path.join(baseDir, 'public/audio/ui-sfx/kenney');
assert(fs.existsSync(kenneyDir), 'Expected public/audio/ui-sfx/kenney to exist');

const requiredFiles = ['click1.wav', 'click2.wav', 'switch1.wav', 'switch2.wav'];
for (const f of requiredFiles) {
  assert(fs.existsSync(path.join(kenneyDir, f)), `Missing expected Kenney asset: ${f}`);
}

console.log('PASS: tools and assets verified');
```

- [ ] **Step 2: Run verification test to confirm failure**

Run: `node --loader ts-node/esm tests/tools-assets.check.ts || pnpm tsx tests/tools-assets.check.ts || npx ts-node tests/tools-assets.check.ts`
Expected: Fails because packages are not yet installed and assets are not yet downloaded.

- [ ] **Step 3: Install dependencies and download assets**

Run:
```bash
pnpm add tone canvas-confetti
pnpm add -D @types/canvas-confetti
mkdir -p public/audio/ui-sfx/kenney
```
Fetch Kenney CC0 WAVs from verified raw GitHub repository (`Calinou/kenney-ui-audio`):
- `click1.wav`, `click2.wav`, `click3.wav`, `click4.wav`, `click5.wav`
- `switch1.wav`, `switch2.wav`, `switch3.wav`

- [ ] **Step 4: Run verification test to confirm pass**

Run: `npx tsx tests/tools-assets.check.ts`
Expected: PASS: tools and assets verified

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml public/audio/ui-sfx/kenney tests/tools-assets.check.ts
git commit -m "feat: install Tone.js, canvas-confetti, and Kenney tactile audio assets"
```

---

### Task 2: Tactile Audio Methods & Tone.js Context Harmonization

**Files:**
- Modify: `src/utils/audioSystem.ts`
- Test: `tests/audio-system.check.ts`

**Interfaces:**
- Consumes: `tone` package, ingested assets in `public/audio/ui-sfx/kenney/`
- Produces: `gameAudio.playTactileClick()`, `gameAudio.playGearSwitch()`, harmonized `Tone.start()` in `gameAudio.userGestureSignal()`

- [ ] **Step 1: Write test for audioSystem new methods**

Create `tests/audio-system.check.ts`:
```typescript
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const audioSystemPath = path.resolve(__dirname, '../src/utils/audioSystem.ts');
const content = fs.readFileSync(audioSystemPath, 'utf8');

assert(content.includes('playTactileClick'), 'audioSystem must export playTactileClick');
assert(content.includes('playGearSwitch'), 'audioSystem must export playGearSwitch');
assert(content.includes("from 'tone'") || content.includes('Tone.'), 'audioSystem must integrate Tone.js');

console.log('PASS: audioSystem interfaces verified');
```

- [ ] **Step 2: Run test to confirm failure**

Run: `npx tsx tests/audio-system.check.ts`
Expected: Fails because new methods and Tone integration are not yet implemented.

- [ ] **Step 3: Implement tactile audio and Tone.start() in audioSystem.ts**

Modify `src/utils/audioSystem.ts`:
- Import `* as Tone from 'tone'`
- Add Kenney sound mappings to `preloadAudioFiles()`:
  - `ui-tactile-click`: `/audio/ui-sfx/kenney/click1.wav`
  - `ui-gear-switch`: `/audio/ui-sfx/kenney/switch1.wav`
- Add public helper methods:
  - `playTactileClick(volume = 0.6)`
  - `playGearSwitch(volume = 0.7)`
- In `userGestureSignal()`:
  - Call `await Tone.start()` when browser permits audio.

- [ ] **Step 4: Run test to confirm pass**

Run: `npx tsx tests/audio-system.check.ts`
Expected: PASS: audioSystem interfaces verified

- [ ] **Step 5: Commit**

```bash
git add src/utils/audioSystem.ts tests/audio-system.check.ts
git commit -m "feat(audio): add tactile SFX methods and harmonize Tone.js audio context"
```

---

### Task 3: Milestone Celebration Juice (Canvas Confetti)

**Files:**
- Create: `src/utils/confettiJuice.ts`
- Modify: `src/components/modals/ProjectReviewModal.tsx`
- Modify: `src/components/ProjectCompletionCelebration.tsx`
- Test: `tests/confetti-juice.check.ts`

**Interfaces:**
- Consumes: `canvas-confetti`
- Produces: `triggerMilestoneCelebration(grade: string, certification?: string)`

- [ ] **Step 1: Write test for celebration helper**

Create `tests/confetti-juice.check.ts`:
```typescript
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const juicePath = path.resolve(__dirname, '../src/utils/confettiJuice.ts');
assert(fs.existsSync(juicePath), 'confettiJuice.ts must exist');

const content = fs.readFileSync(juicePath, 'utf8');
assert(content.includes('triggerMilestoneCelebration'), 'must export triggerMilestoneCelebration');
assert(content.includes('canvas-confetti'), 'must use canvas-confetti');

console.log('PASS: confetti juice verified');
```

- [ ] **Step 2: Run test to confirm failure**

Run: `npx tsx tests/confetti-juice.check.ts`
Expected: Fails because `src/utils/confettiJuice.ts` does not exist yet.

- [ ] **Step 3: Implement confettiJuice.ts and integrate into review & celebration modals**

Create `src/utils/confettiJuice.ts`:
- Safely check `typeof window !== 'undefined'`.
- Define confetti presets:
  - Gold/Platinum Record: Gold + yellow + amber star/particle fountain.
  - A/S Grade Hit: Vivid multi-color celebration burst.
- Export `triggerMilestoneCelebration(grade: string, certification?: string)`.

Update `src/components/modals/ProjectReviewModal.tsx`:
- Trigger `triggerMilestoneCelebration(review.overallGrade, review.commercialSuccess)` when the modal opens or review is revealed.

Update `src/components/ProjectCompletionCelebration.tsx`:
- Trigger celebration burst when celebration renders.

- [ ] **Step 4: Run test to confirm pass**

Run: `npx tsx tests/confetti-juice.check.ts`
Expected: PASS: confetti juice verified

- [ ] **Step 5: Commit**

```bash
git add src/utils/confettiJuice.ts src/components/modals/ProjectReviewModal.tsx src/components/ProjectCompletionCelebration.tsx tests/confetti-juice.check.ts
git commit -m "feat(ui): add milestone celebration confetti for hit songs and awards"
```

---

### Task 4: Tactile Feedback in Studio Inspector & Room Controls

**Files:**
- Modify: `src/components/StudioInspector.tsx`
- Modify: `src/components/RightPanel.tsx`

**Interfaces:**
- Consumes: `gameAudio.playTactileClick()`, `gameAudio.playGearSwitch()`
- Produces: Audible tactile feedback on room purchases, room upgrades, and equipment toggles

- [ ] **Step 1: Wire tactile clicks/switches to room purchase & inspector interactions**

In `src/components/StudioInspector.tsx`:
- Play `gameAudio.playTactileClick()` when switching tabs, inspecting equipment, or selecting racks.
- Play `gameAudio.playGearSwitch()` when toggling power or room maintenance.

In `src/components/RightPanel.tsx`:
- Trigger tactile sound when interacting with room action buttons.

- [ ] **Step 2: Commit**

```bash
git add src/components/StudioInspector.tsx src/components/RightPanel.tsx
git commit -m "feat(ui): attach tactile audio clicks and switches to studio equipment and rooms"
```

---

### Task 5: End-to-End Suite & Build Verification

**Files:**
- Modify: `scripts/run-checks.sh` (integrate new check scripts)

- [ ] **Step 1: Wire new check scripts into scripts/run-checks.sh**

Add execution of `tests/tools-assets.check.ts`, `tests/audio-system.check.ts`, and `tests/confetti-juice.check.ts` to `scripts/run-checks.sh`.

- [ ] **Step 2: Run automated check suite**

Run: `bash scripts/run-checks.sh`
Expected: All automated checks pass without regressions.

- [ ] **Step 3: Run production build check**

Run: `pnpm run build`
Expected: Vite build succeeds cleanly with 0 TypeScript/compilation errors.

- [ ] **Step 4: Final commit**

```bash
git add scripts/run-checks.sh
git commit -m "test: wire new tools and assets validation into test runner"
```
