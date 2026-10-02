# Changelog

## Unreleased
- Fixed hotspot alias drift between the Pixi scene and StudioRoom's gamepad focus list (`liveroom`/`crt` → `liveRoom`/`tv`).
- Depth-banded the living studio scene (walls/floor/furniture/staff/lighting/FX) so staff no longer paint over shelf/console/tier furniture regardless of insertion order.
- Chore hotspot badges are now world-anchored to the Pixi camera (track pan/zoom) instead of fixed screen corners, with a phone-only override preserved for the dock-collision fix.
- Added a small optional sprite/texture dressing layer (`studioAssets.ts`) with graceful procedural fallback — the gear shelf can now light up with real sprites with zero code changes once art lands.
- Added the first slice of an asset provenance manifest + `pnpm assets:verify` (issue #58): tracks the Kenney UI pack and Kenney click/switch audio already committed to the repo.
- Wired 3 previously-unused, already-committed Kenney audio samples to distinct tactile cues (rack select, mechanical latch, phone/enquiry tone) and a fourth to a "duty complete" cue.
- Fixed `pnpm test` on a clean `pnpm install` (esbuild was an undeclared transitive dependency).

## 0.5.0
- Bus & Stem Merge minigame (2048-style routing puzzle): merge tracks into buses, stems and the mix within a move limit, watching headroom and bus depth.
- Warm flat design system (no gradient chrome, no blue text); restyled popups, drawer, HUD, toasts, news popup, minigame chrome.
- Rebuilt isometric studio: enclosed booth, wall clock, trophy wall from real releases, era props.
- Producer origins with real perks and a career-start flow.
- Era-authentic gig catalog for all four eras; contract stakes picker (level-gated).
- Campaign: lore rivals, truthful objectives, story contracts, act cinematics, endings.
- 13 era-gated story subplots with decision popups and a chronicle; 25 achievements and trophy case.
- Keyboard shortcuts (1–7 dock tabs, ? overlay).
