# Audit: Studio Strip & Compact Mode Breakdown

> **Bead Reference:** `recording-studio-tycoon-zel.6` | **Related PRs/Issues:** PR [#11](https://github.com/sp80808/recording-studio-tycoon/pull/11), Issue [#18](https://github.com/sp80808/recording-studio-tycoon/issues/18) (Tauri companion), Issue [#40](https://github.com/sp80808/recording-studio-tycoon/issues/40)  
> **Status:** Active Audit & Remediation Plan  
> **Date:** September 28, 2026  

---

## 1. Executive Summary

The "Studio Strip" (`StudioStrip.tsx`) was introduced in PR #11 as an initial UI prototype for an "idle desktop companion" mode (targeting future Tauri desktop integration per Issue #18). However, in the current web application runtime, clicking the **"Studio Strip"** button completely breaks core game functionality:

1. **Dead-End Loop:** Once in compact mode, the player **cannot work on the session** (`handleWork` / `performDailyWork` is absent).
2. **Cannot Advance Day:** The "Advance Day" button is missing; calendar time and daily energy cannot be refreshed.
3. **Viewport Blackout:** Hiding `GameHeader`, `CareerHub`, `StudioRoom`, `ProjectList`, and `RightPanel` leaves ~85% of the browser window as an empty, dark void with a disconnected 164px strip at the bottom.
4. **Enquiry Lockout:** Only `gameState.availableProjects[0]` is shown, with a confusing "Book $X" label (where $X is actually payout, not booking cost). If no project fits, booking fails silently via toast, and the player cannot view or select alternative leads.
5. **System Blindness:** `GameHeader` (money, rep, day, era, fullscreen, settings) and `NotificationSystem` are completely unmounted.

In its present state, entering Studio Strip essentially soft-locks active gameplay until the player clicks "Open Studio" to escape.

---

## 2. Technical Audit of Broken Points

### A. Dead-End Gameplay Loop (No Session Progression)
- **Code Reference:** [`src/components/StudioStrip.tsx`](../src/components/StudioStrip.tsx#L81-L125)
- **The Issue:**
  - When an `activeProject` is present, `StudioStrip` displays the project title, genre, and a progress bar (`Progress value={progress}`).
  - However, there are **no interaction controls** to perform work on the session (`handleWork`).
  - While `simulationClock.ts` has a 5-second interval timer calling `advanceSimulation`, passive work ticks generate only fractional progress (1/60th of a session per 5 seconds), which requires staff and energy.
  - The player cannot allocate focus, cannot intervene, cannot trigger overdrive, and cannot complete or review the project from the strip.

### B. Missing Day Advancement & Calendar Freezing
- **Code Reference:** [`src/pages/Index.tsx`](../src/pages/Index.tsx#L436-L470), [`src/components/MainGameContent.tsx`](../src/components/MainGameContent.tsx#L265-L278)
- **The Issue:**
  - In normal view, `advanceDay` is accessible via `CareerHub` (`onRest`) and `RightPanel` ("Advance Day ❯").
  - In `compactStudioMode`, both `CareerHub` and `RightPanel` are unmounted.
  - `StudioStrip` does not receive `advanceDay` as a prop.
  - Result: The player cannot advance the day to collect offline revenue, rest staff, refresh daily energy, or trigger calendar events while in the strip.

### C. 85% Empty Viewport Blackout
- **Code Reference:** [`src/components/MainGameContent.tsx`](../src/components/MainGameContent.tsx#L267)
  ```tsx
  if (!isMobile && compactStudioMode) {
    return (
      <div className="h-full flex items-end">
        <StudioStrip ... />
      </div>
    );
  }
  ```
- **The Issue:**
  - In a standard desktop browser, the window dimensions remain 100vw × 100vh.
  - Browsers do not allow arbitrary window resizing from webpage JavaScript.
  - Returning `<div className="h-full flex items-end">` creates a massive expanse of unused dark gradient background with floating background blobs.
  - To the player, this looks like a critical rendering crash where 90% of the UI disappeared.

### D. Fragile Single-Enquiry Booking
- **Code Reference:** [`src/components/StudioStrip.tsx`](../src/components/StudioStrip.tsx#L164-L172), [`src/components/MainGameContent.tsx`](../src/components/MainGameContent.tsx#L271-L274)
- **The Issue:**
  - `onBookNextEnquiry` hardcodes:
    ```tsx
    onBookNextEnquiry={() => {
      const nextEnquiry = gameState.availableProjects[0];
      if (nextEnquiry) startProject(nextEnquiry);
    }}
    ```
  - If `availableProjects[0]` requires an unavailable studio room (e.g. `room.unlocked === false`), `startProject` returns `false` and displays a destructive toast. The player has no way to view or book `availableProjects[1]` or `[2]`.
  - The button reads `Book $${nextEnquiry.payoutBase}`. In RST, payout is money the client pays *you*, not a booking fee. This misleadingly signals that the player is spending money to book.

### E. Total System Isolation
- **Code Reference:** [`src/pages/Index.tsx`](../src/pages/Index.tsx#L436-L507)
  - `{!compactStudioMode && (<GameHeader ... />)}` -> Money, Rep, Day, Era progress, Fullscreen, and Settings gear are completely hidden.
  - `{!compactStudioMode && (<NotificationSystem ... />)}` -> Toast/system notifications and milestones are suppressed.
  - `isOpen={showSettingsModal && !compactStudioMode}` -> Settings cannot be opened.
  - `isOpen={showTrainingModal && !compactStudioMode && !offlineSummary}` -> Training modal cannot open.

---

## 3. Root Cause: Premature Stub of Desktop-Only Feature

PR #11 explicitly stated:
> *"Not in this PR: passive/auto session resolution and real Tauri window placement—those remain spec-only."*

Because Tauri integration (Issue #18) was deferred, `compactStudioMode` was hooked up in the web frontend as an unconstrained toggle without:
1. Resizing the actual container window (impossible in a browser tab).
2. Providing a minimal viable interaction set (work button, advance day, energy meter, day display).
3. Handling multi-enquiry selection.

---

## 4. Remediation Options & Action Plan

### Option 1: Feature-Flag / Gate Behind Tauri Shell (Fastest & Cleanest)
- If `StudioStrip` is strictly intended for the multi-window desktop shell (Issue #18):
  - Hide the "Studio Strip" minimize button in browser mode or put it behind a feature flag (`features.desktopCompanion`).
  - Only mount `StudioStrip` when running inside a verified Tauri webview with native window resizing capabilities (`window.__TAURI__`).
  - **Pros:** Immediately stops players from entering a broken state in the web game; zero risk to core simulation.

### Option 2: Repair StudioStrip into a Playable Mini-Dashboard (Functional Solution)
- Upgrade `StudioStrip.tsx` to be fully playable in compact mode:
  1. **Add Primary Action Buttons:** Include a "Work Session" button (spending 1 energy) and an "Advance Day" button directly on the strip.
  2. **Add Vital HUD Metrics:** Show Current Day (`Day X`), Current Energy (`⚡ X/Y`), and Studio Tier alongside Cash and Rep.
  3. **Provide Lead Navigation:** Allow cycling through available enquiries (e.g. `◀ 1 of 3 ▶`) instead of hardcoding `[0]`.
  4. **Fix Viewport Aesthetics:** In browser mode, do not leave 85% empty space. Instead, render a clean ambient studio visual (e.g. dimmed isometric room or VU meters) above the strip, or dock the strip as a retractable drawer while keeping the main workspace accessible.

---

## 5. Actionable Bead Specification

### Bead: `recording-studio-tycoon-zel.6`
- **Title:** *Repair or overhaul Studio Strip compact mode: fix dead-end loop, missing actions & viewport blackout*
- **Priority:** `P1`
- **Parent:** `recording-studio-tycoon-zel`
- **Acceptance Criteria:**
  - [ ] Player can perform session work or trigger auto-ticks from within compact mode without getting soft-locked.
  - [ ] Player can advance the day from within compact mode.
  - [ ] Current day, energy, and era indicators are visible in compact mode.
  - [ ] Booking from compact mode allows cycling enquiries or gracefully handles room unavailability.
  - [ ] In standard browser runtime, compact mode either gracefully docks to the bottom with ambient backdrop or is gated behind a desktop-companion feature flag.
  - [ ] "Open Studio" (`onExpand`) cleanly restores full state without UI glitching.
