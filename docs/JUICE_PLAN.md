# Game Juice & Visual Effects Plan

**Scope:** add reactive visual effects ("juice") to Recording Studio Tycoon without changing engines.
**Status:** PLAN ONLY. No dependencies installed, no code written.
**Tracked as:** Beads epic `recording-studio-tycoon-yt7` (9 child tasks).
Integration target: branch `feature/polished-pre-overhaul` (per
`rst-orchestration-default-integration-target-is-branch-featu`), NOT main.

**RST is already:** React 19.3.0 + PixiJS 8.21.0 + @pixi/react 8.0.5 + Framer Motion 12.43.0 + canvas-confetti 1.9.4 + Tone.js 15.1.22 + zustand 5.0.15.

---

## 0. Verified installed versions

| Package | Installed | Fits RST? |
|---|---|---|
| pixi.js | 8.21.0 | yes (base) |
| @pixi/react | 8.0.5 | yes (base) |
| pixi-filters | **6.1.5** | **peerDeps `pixi.js >=8.0.0-0` — fits** |
| framer-motion | 12.43.0 | yes (already used) |
| react / react-dom | 19.3.0 | yes |
| canvas-confetti | 1.9.4 | yes (already wired: `src/utils/confettiJuice.ts`) |
| tone | 15.1.22 | yes (already wired) |
| zustand | 5.0.15 | yes |

**Not installed (all proposed additions are absent from node_modules):**
pixijs/layout, pixijs/ui, spd789562/pixi-v8-particle-emitter,
pixijs-userland/particle-emitter, rive-react, react-bits, game-icons,
glnoise, lygia, free-tex-packer.

---

## 1. What RST already has (do not duplicate)

RST is not starting from zero. Recent commits added a family of in-house shader
filters on Pixi's `Filter` base class in `src/lib/render/shaders/`:

- `godrayFilter.ts` — volumetric window light shafts driven by the studio clock
- `tubeGlowFilter.ts` — thermionic tube glow with audio-driven "breathing"
- `diegeticCrtFilter.ts` — CRT scanlines for in-world screens

So `pixi-filters` is **complementary**, not a replacement: it supplies the broad
municipal library (outline, glow, colour grading) while RST keeps its own
bespoke era-specific shaders.

Existing juice infrastructure:

- `src/utils/confettiJuice.ts` — milestone confetti (gold/platinum/top-grade)
- `docs/MICRO_INTERACTIONS.md` — press/hover/land/arrive/reward vocabulary,
  motion budgets by `data-reduced-motion` / `data-graphics`
- `docs/IMMERSION_AUDIT.md` — ranked immersion findings
- `docs/pixi-presentation-audit.md` — layer stack, renderers, GPU-owner invariant
- `docs/ux-visual-iterative-plan.md`, `docs/visual_studio_plan.md`
- `src/lib/motion/` — `feelMode.ts`, `qualification.ts`, `pixiGuard.ts`
- `assets-src/{gear,layer,npc}` — reproducible source for sprite atlases

---

## 2. Recommended order (first visual pass)

1. **Pixi Filters** — selection/hover outline, LED/gear glow, rarity tint,
   CRT/old-film for era styling, shockwave for unlocks. Already installed.
2. **Pixi Layout** — world-space HUDs, equipment overlays, interact prompts.
   Add (explicit @pixi/react + Tailwind support).
3. **Richer Framer Motion** — cash/XP count-ups, card drop-in, purchase pop.
   Uses what is installed; no new framework.
4. **Game Icons** — SVG vocabulary for perks/traits/stats/unlocks. Add (CC-BY).
5. **Pixi v8 particle prototype** — sparks, smoke, cash/XP bursts. Add experimentally.
6. **Rive character-state prototype** — NPC portrait state machine. Add experimentally.
7. **free-tex-packer** — atlas-build stage for `assets-src/{gear,layer,npc}`.

---

## 3. DOM vs canvas boundary

- **React DOM** (Radix/shadcn/Framer Motion): menus, modals, settings, career
  pages, inventory management, drawers.
- **Pixi canvas**: equipment controls, floating NPC state, session progress,
  tooltips attached to objects, interact prompts, minigame controls,
  world-space meters.

This directly targets the recurring "website with a game behind it" pain in
`docs/IMMERSION_AUDIT.md`.

---

## 4. Performance gating (mobile first)

- No gratuitous full-screen multi-pass shaders.
- No permanent particle storms.
- Quality tiers for bloom/lightmaps/ambient FX, driven by
  `src/lib/motion/feelMode.ts` (`data-graphics` = low/medium/high).
- Respect `data-reduced-motion="true"` everywhere.

---

## 5. Companion plan: diegetic interactions

A separate plan splits RST interaction into two families — **minigames**
(occasional 30–90 s focused challenges, already 29 types in `MinigameManager`)
and **diegetic micro-interactions** (2–20 s, performed directly on objects/NPCs
while the world stays visible). Full catalogue, migration rules, new tooling
(wavesurfer, Meyda, JZZ, Matter.js, Tweakpane, Pixi Devtools) and the reusable
`TactileFeedback` service: see
[`DIEGETIC_INTERACTIONS_PLAN.md`](./DIEGETIC_INTERACTIONS_PLAN.md).

Tracked as Beads epic `recording-studio-tycoon-1et`.

## 6. Licenses

- pixi-filters: MIT
- pixijs/layout, pixijs/ui: MIT
- spd789562/pixi-v8-particle-emitter: MIT
- game-icons/icons: CC-BY (requires attribution entry)
- rive-react: MIT
- react-bits: MIT + Commons Clause (OK inside a commercial product; NOT for
  redistribution of the components)
- lygia: MIT (reference only)
- free-tex-packer: MIT