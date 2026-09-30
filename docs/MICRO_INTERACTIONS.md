# Micro-interactions and visual flair plan

Goal: every frequent player action answers back within ~100 ms with something small, tactile and consistent. Bigger moments (take complete, level-up, chart reveal) get a bigger payoff, never a different language.

## Rules

- One vocabulary: press (sink 1px + dim), hover (lift 1px + brass edge), land (ring pulse + number bump), arrive (rise + stagger), reward (pop, loot travel, burst).
- Budgets: `data-reduced-motion="true"` kills all motion; `data-graphics="low"` kills decorative loops and sheens; `medium` keeps press/land/arrive; `high`+ adds sheens and glows. Set on `<html>` from settings by `SettingsContext` (`src/lib/motion/feelMode.ts`).
- Durations: press 80-140 ms, hover 140 ms, arrive 420 ms with 50 ms stagger, land 600 ms. Only `transform`, `opacity`, `box-shadow`, `filter`: no layout properties.
- Reuse first: reward pop-ups (#99), chart reveal, gear reel and effect budgets (#100/#119), `SettleTicker`, `PressRipple`, `rst-enter`. New CSS lives in `src/styles/feel.css`.

## Placement map (ranked by frequency x impact)

| # | Action | Frequency | Feedback | Status |
|---|--------|-----------|----------|--------|
| 1 | Any button press (shadcn `Button`, `rst-btn`, chips, tabs) | constant | Sink + dim on press, lift on hover | Round 1 |
| 2 | Lock Take | every take | Transport press, meter, haptic | Exists |
| 3 | Money / XP / rep gain in HUD | every stage | Number roll, `SettleTicker` pulse, loot travel | Exists; Round 1 adds a brass ring on land |
| 4 | Drawer / modal open | many per session | Rise + stagger | Exists (`rst-enter`); Round 1 adds `feel-stagger` for long lists (cards, gear, crew) |
| 5 | Tab switch in drawer | many | Underline slide | Round 2 |
| 6 | Buy / hire / accept success | regular | Card pop + check tick (`feel-pop`) | Round 1 class, wired in Round 2 |
| 7 | Something needs attention (hotspot, duty chip, new booking) | regular | Slow ring pulse (`feel-attention`), off in low graphics | Round 1 class |
| 8 | Stage complete | per stage | Burst + shake | Exists |
| 9 | Take grade S/A | per take | Bigger callout + confetti | Exists |
| 10 | Level up, era change, chart reveal | rare | Full-screen payoff | Exists |
| 11 | Staff reactions on good takes | per take | Bob / emote above head | Round 3 |
| 12 | Denied action (not enough money/energy) | occasional | Shake + red flash | Exists (`deny-shake`) |
| 13 | Hover sheen on primary CTAs | constant | Slow light sweep, high graphics only | Round 1 |

## Rounds

1. Feel layer: motion mode attributes, `feel.css` (press/hover, sheen, stagger, pop, attention, land ring), `Button` press, HUD land ring, drawer lists staggered, tests.
2. Wire pop/check into purchases and hires, drawer tab underline slide, tooltips fade.
3. Staff emotes, hotspot hover glow in the Pixi room, transition between day advance states.

Out of scope: used-gear economy, audio changes (already tactile).
