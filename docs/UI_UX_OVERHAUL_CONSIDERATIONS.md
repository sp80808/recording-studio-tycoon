# UI/UX Overhaul Considerations: Viewport Resilience, Scrolling & Windowed Playability

> **Issue Reference:** [GitHub Issue #54](https://github.com/sp80808/recording-studio-tycoon/issues/54) | **Bead:** `recording-studio-tycoon-zel.5`  
> **Status:** Active Consideration for Studio OS V2 ([#41](https://github.com/sp80808/recording-studio-tycoon/issues/41)) & Immediate Layout Polish  
> **Last Updated:** September 28, 2026  

---

## 1. Executive Summary & Critical Bug Description

In desktop browser environments where the game is **not running in fullscreen mode** (e.g. standard windowed browsers with address bars, bookmarks, operating system dock/taskbar, or when the browser's Fullscreen API is blocked/unsupported), critical sections of the UI become unscrollable, cut off, or clipped behind `overflow-hidden` containers.

Most critically:
- The **middle project workspace** (`ActiveProject`) gets starved of vertical space by the fixed height requirements of the header, `CareerHub`, and `StudioRoom`.
- The bottom action dock containing the primary **"Work on Project"** and **"Arm Overdrive"** buttons is pushed off the bottom of the viewport or clipped by parent `overflow-hidden` containers.
- The **left sidebar** (`ProjectList`) and **right sidebar** (`RightPanel`) experience scroll truncation and nested scroll conflict issues.
- As a consequence, players cannot work on sessions, browse enquiries, or access management functions, rendering the game **completely unplayable** without full-screen expansion.

---

## 2. Anatomical Breakdown of Current Breakpoints

### A. Middle Column (Studio Room + Project View)
- **Component Stack:**
  - `GameHeader` (~52px)
  - `CareerHub` banner (~84px)
  - `StudioRoom` (Isometric PixiJS canvas):
    ```tsx
    // MainGameContent.tsx:350
    style={{ height: isMobile ? 'clamp(260px, 36vh, 340px)' : 'clamp(320px, 42vh, 500px)' }}
    ```
  - `ProgressiveProjectInterface` / `ActiveProject`:
    - Top project banner (`REC`, title, points summary): ~60px
    - Center scrollable body (production queue, interventions, progress bars, 3-channel mixing sliders): needs ~280px minimum
    - Pinned bottom action dock (`shrink-0` with "Work on Project" button): ~90px
- **The Geometry Failure:**
  - On a typical 1080p display (1920×1080) in fullscreen: Available height ≈ 1080px. Everything fits with room to spare.
  - On a typical laptop display (1366×768 or 1440×900) in windowed mode:
    - Browser chrome (tabs, URL bar, bookmarks bar) ≈ 120px
    - OS menu bar & dock/taskbar ≈ 70px
    - Net available viewport height ≈ 580px – 710px
  - Calculating overhead:
    - 52px (Header) + 84px (CareerHub) + 320px (min `StudioRoom` clamp) = **456px overhead** before the active session interface even begins.
  - Remaining vertical space for `ActiveProject`: **124px – 254px**.
  - Because `ActiveProject` requires ~150px just for its header and bottom dock, the center body has ~0px to scroll, and any minor overflow causes the bottom dock ("Work on Project") to be clipped out of the DOM view by parent `overflow-hidden` wrappers (`studio-panel`, `workPanelRef`, `ProgressiveProjectInterface`).

### B. Left Sidebar (`ProjectList` / Artist Enquiries)
- **Component Stack:**
  - `project-panel`: `h-full min-h-0 overflow-hidden p-2`
  - Header: `Artist Enquiries` + `Refresh` button (~60px)
  - Active Session preview card (when a project is running): ~140px
  - Enquiries list: `<div className="flex-1 overflow-y-auto space-y-3">`
- **Issue:**
  - When an active session is in progress, the active preview card consumes a large portion of the column.
  - In short viewports, the scrollable list of enquiries is squeezed down to <150px.
  - Absence of custom, visible game scrollbars makes it non-obvious that additional bookings are waiting below.
  - Card hover/scale effects get clipped at the right/bottom boundary due to `overflow-hidden`.

### C. Right Sidebar (`RightPanel` / Studio Management)
- **Component Stack:**
  - Tab navigation bar: 5 tabs (`Studio`, `Skills`, `Bands`, `Charts`, `Staff`) (~42px)
  - Content container: `<div className="flex-1 min-h-0 overflow-y-auto pr-1">`
  - Inside `studio` tab:
    - Advance Day banner (~60px)
    - `StudioProgressionPanel` (~120px)
    - `StudioRooms` panel with its own nested `max-h-48 overflow-y-auto` container (~192px)
    - Staff / equipment sections
- **Issue:**
  - Nested scroll container collision: wheel/trackpad events get captured by the inner rooms list rather than scrolling the main panel, preventing players from scrolling down to subsequent management cards.
  - The "Advance Day" button and critical controls can be scrolled out of view without clear pagination cues.

### D. Fullscreen API Fragility
- `useFullscreen('root')` delegates to standard browser `requestFullscreen()`.
- **Known failure modes:**
  - Denied by iframe permissions (`allow="fullscreen"` missing).
  - WebKit / Safari iOS limitations (standard elements cannot enter fullscreen on iPhone; iPad requires specific user activation policies).
  - User preference or multi-monitor setups where users intentionally run windowed browsers to multitask.
  - Browser security restrictions blocking automated fullscreen without an explicit trusted gesture.
- **Rule:** The game must never depend on fullscreen mode as a prerequisite for core playability.

---

## 3. Core Principles for Planned UI/UX Overhaul (Studio OS V2 / #41)

### Principle 1: Height-Adaptive Architecture
- Never rely solely on width breakpoints (`@media (min-width: ...)`).
- Introduce **height breakpoints** in Tailwind and CSS:
  - `@media (max-height: 800px)` (Standard windowed laptop)
  - `@media (max-height: 650px)` (Constrained window / split-screen)
- Under height constraints:
  - Reduce `StudioRoom` height or dynamically collapse it into a thin **Studio Strip / Status Ribbon** (similar to `StudioStrip.tsx`).
  - Condense `CareerHub` into an inline ticker or single-line HUD.

### Principle 2: Guaranteed Action Dock (Zero-Clip Primary Actions)
- The core interaction loop buttons:
  - **"Work on Project"** (Session work / advance stage)
  - **"Advance Day"** (Calendar tick & energy restore)
  - **"Book Session"** (Accept enquiry)
- These action buttons must **never** be pushed off-screen. They should either:
  - Be pinned in a dedicated, high-contrast, always-visible bottom HUD/dock, or
  - Allow the entire viewport to scroll naturally if internal panel scrolling fails.

### Principle 3: Single Scroll Context per Column (Eliminate Nested Scroll Trapping)
- Avoid nesting an `overflow-y-auto` container inside another `overflow-y-auto` container (e.g. rooms list inside right panel).
- Use accordion-style expanders or paginated card stacks rather than independent sub-scrollbars that trap wheel events.

### Principle 4: Game-Themed, Highly Visible Scrollbars & Overflow Cues
- Implement Kenney-style / retro studio audio console scrollbars:
  - Visible track and thumb styling (textured slider track with illuminated fader cap).
  - Subtle edge-fade masks (`mask-image: linear-gradient(to bottom, black 90%, transparent)`) or glowing arrow cues when more content exists below the fold.

### Principle 5: Progressive Studio Room Viewport Modes
- Provide 3 distinct viewport modes for `StudioRoom`:
  1. **Expanded Mode (Default for Fullscreen / Large Displays):** Full isometric room canvas with interactive animated stations.
  2. **Compact Ribbon Mode (Windowed / Low Height Displays):** A slim horizontal status bar (~80px) displaying room activity, current staff, and audio gear visuals.
  3. **Floating / Picture-in-Picture Mode:** Canvas minimized to an expandable mini-monitor.

---

## 4. Immediate Tactical Remediation Checklist

1. [ ] **Update `StudioRoom` Height Clamp:** Change minimum clamp in `MainGameContent.tsx` from `clamp(320px, 42vh, 500px)` to `clamp(180px, 28vh, 420px)` or introduce a `@media (max-height: 800px)` override.
2. [ ] **Fix `ActiveProject` Flex Sizing:** Ensure `workPanelRef` has `min-h-[220px]` and its inner scroll area has `overflow-y-auto` with proper scroll padding so the bottom action button remains visible.
3. [ ] **Add Custom Scrollbar Styles:** Define `.game-scrollbar` utility in `index.css` with high-contrast colors and fader styling.
4. [ ] **Decouple RightPanel Nested Scrolls:** Replace `max-h-48 overflow-y-auto` inside `RightPanel.tsx` studio rooms with an expandable or unified list.
5. [ ] **Verify Windowed Viewports:** Test across resolutions: `1366×768` (windowed: `1366×650`), `1440×900` (windowed: `1440×750`), and `1280×720`.
