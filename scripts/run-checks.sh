#!/usr/bin/env bash
# Automated repo checks (bead itt). Fails loudly on the first failing check.
# Usage: pnpm test
set -euo pipefail
CHECK_OUTPUT_DIR="${RST_CHECK_DIR:-/tmp}"
mkdir -p "$CHECK_OUTPUT_DIR"
cd "$(dirname "$0")/.."

echo "=== typecheck (tsc must stay at zero errors) ==="
./node_modules/.bin/tsc -p tsconfig.app.json --noEmit

echo "=== mobile onboarding regression (blank screen + creator touch) ==="
./node_modules/.bin/esbuild tests/mobile-onboarding-regression.check.tsx --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-mobile-onboarding.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-mobile-onboarding.cjs"

echo "=== mobile shell: display mode, safe area, notification lanes, era labels ==="
./node_modules/.bin/esbuild tests/mobile-shell.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-mobile-shell.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-mobile-shell.cjs"

echo "=== tutorial and room purchases ==="
for check in first-session-guide studio-room-purchase toast-spam pause-menu-keys; do
  ./node_modules/.bin/esbuild "tests/$check.check.ts" --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-$check.cjs" --alias:@=./src >/dev/null
  node "${CHECK_OUTPUT_DIR}/rst-$check.cjs"
done

echo "=== multi-project session view ==="
./node_modules/.bin/esbuild tests/multi-project-session-view.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-multi-project-session-view.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-multi-project-session-view.cjs"

echo "=== story presentation and living staff ==="
for check in story-presentation staff-staging world-attention studio-actors studio-object-feel; do
  ./node_modules/.bin/esbuild "tests/$check.check.ts" --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-$check.cjs" --alias:@=./src >/dev/null
  node "${CHECK_OUTPUT_DIR}/rst-$check.cjs"
done

echo "=== daily challenges ==="
./node_modules/.bin/esbuild tests/reward-flights.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-reward-flights.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-reward-flights.cjs"
./node_modules/.bin/esbuild tests/daily-challenges.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-daily-challenges.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-daily-challenges.cjs"

echo "=== talents & atomicity ==="
./node_modules/.bin/esbuild tests/talents-atomicity.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-talents.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-talents.cjs"

echo "=== flavour copy ==="
./node_modules/.bin/esbuild tests/flavour-copy.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-flavour-copy.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-flavour-copy.cjs"

echo "=== gear shop and expanded catalogue ==="
./node_modules/.bin/esbuild tests/gear-shop.check.tsx --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-gear-shop.cjs" --alias:@=./src --loader:.css=empty >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-gear-shop.cjs"
./node_modules/.bin/esbuild tests/catalog-traits-expansion.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-catalog-traits.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-catalog-traits.cjs"

echo "=== studio synergies ==="
./node_modules/.bin/esbuild tests/synergies.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-synergies.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-synergies.cjs"

echo "=== open source tools and assets ==="
for check in tools-assets audio-system confetti-juice minigames-audio user-interaction vu-meter pocket-take pocket-meter-pacing take-calibration take-audio; do
  ./node_modules/.bin/esbuild "tests/$check.check.ts" --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-$check.cjs" --alias:@=./src >/dev/null
  node "${CHECK_OUTPUT_DIR}/rst-$check.cjs"
done

echo "=== gamepad service & controller suites ==="
for check in gamepad-service gamepad-glyph gamepad-navigation spatial-navigation radial-wheel beat-pad-game tape-jog-game console-ride-game vocal-comp album-sequence fault-hunt minigame-debriefs chain-recall flight-case-packing session-scramble phase-check booking-calendar filler-jobs city-selection onboarding-steps city-sagas market-determinism house-style artist-career label-interest label-accounts service-quote settlement-ledger gameplay-telemetry market-demand industry-events balance-lab content-workbench freelancers staff-career recruitment-channels market-player-influence work-style-effect bus-merge gamepad-suite; do
  ./node_modules/.bin/esbuild "tests/$check.check.ts" --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-$check.cjs" --alias:@=./src >/dev/null
  node "${CHECK_OUTPUT_DIR}/rst-$check.cjs"
done

echo "=== gain staging minigame ==="
./node_modules/.bin/esbuild tests/gain-staging.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-gain-staging.cjs --alias:@=./src >/dev/null
node /tmp/rst-gain-staging.cjs

echo "=== recurring client saga ==="
./node_modules/.bin/esbuild tests/recurring-client.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-recurring-client.cjs --alias:@=./src >/dev/null
node /tmp/rst-recurring-client.cjs

echo "=== lore, character origins & narrative arcs ==="
./node_modules/.bin/esbuild tests/narrative-lore-arcs.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-narrative-lore-arcs.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-narrative-lore-arcs.cjs"

echo "=== splash & career hub loop ==="
./node_modules/.bin/esbuild tests/splash-career-hub.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-splash-career-hub.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-splash-career-hub.cjs"

echo "=== studio strip desktop gate (zel.6) ==="
if [ -f tests/studio-strip-desktop-gate.check.ts ]; then
  ./node_modules/.bin/esbuild tests/studio-strip-desktop-gate.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-studio-strip-desktop-gate.cjs" --alias:@=./src >/dev/null
  node "${CHECK_OUTPUT_DIR}/rst-studio-strip-desktop-gate.cjs"
fi

echo "=== studio chores, progression & crate unboxing suites ==="
for check in chart-reveal chart-run chore-engine chore-progression-coupling studio-duties-clipboard chore-hotspots crate-unboxing flight-case-economy flight-case-reveal flight-case-connectors flight-case-bench reward-animation-sprite-pipeline; do
  ./node_modules/.bin/esbuild "tests/$check.check.ts" --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-$check.cjs" --alias:@=./src >/dev/null
  node "${CHECK_OUTPUT_DIR}/rst-$check.cjs"
done

echo "=== branching deterministic storylines ==="
./node_modules/.bin/esbuild tests/branching-storylines.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-branching-storylines.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-branching-storylines.cjs"

echo "=== callback subplots (story remembers earlier choices) ==="
./node_modules/.bin/esbuild tests/callback-subplots.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-callback-subplots.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-callback-subplots.cjs"

echo "=== studio event director (#56) ==="
./node_modules/.bin/esbuild tests/event-director.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-event-director.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-event-director.cjs"

echo "=== end-of-day beat (immersion #8) ==="
./node_modules/.bin/esbuild tests/day-close.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-day-close.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-day-close.cjs"

echo "=== industry-history subplots ==="
./node_modules/.bin/esbuild tests/industry-subplots.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-industry-subplots.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-industry-subplots.cjs"

echo "=== story events, rival cast & truthful objectives ==="
./node_modules/.bin/esbuild tests/story-events.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-story-events.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-story-events.cjs"

echo "=== live shows ==="
./node_modules/.bin/esbuild tests/live-shows.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-live-shows.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-live-shows.cjs"

echo "=== artist contracts ==="
./node_modules/.bin/esbuild tests/artist-contracts.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-artist-contracts.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-artist-contracts.cjs"

echo "=== deterministic used gear, classifieds and maintenance ==="
./node_modules/.bin/esbuild tests/used-gear.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-used-gear.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-used-gear.cjs"

echo "=== equipment slots / gear racks (8om) ==="
./node_modules/.bin/esbuild tests/equipment-slots.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-equipment-slots.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-equipment-slots.cjs"

echo "=== monetisation telemetry & experiments ==="
if [ -f tests/monetisation-telemetry.check.ts ]; then
  ./node_modules/.bin/esbuild tests/monetisation-telemetry.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-monetisation-telemetry.cjs" --alias:@=./src >/dev/null
  node "${CHECK_OUTPUT_DIR}/rst-monetisation-telemetry.cjs"
fi

echo "=== monetisation save/reset/reversal hardening ==="
if [ -f tests/monetisation-hardening.check.ts ]; then
  ./node_modules/.bin/esbuild tests/monetisation-hardening.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-monetisation-hardening.cjs" --alias:@=./src >/dev/null
  node "${CHECK_OUTPUT_DIR}/rst-monetisation-hardening.cjs"
fi

echo "=== monetisation mock vertical-slice e2e ==="
if [ -f tests/monetisation-e2e.check.ts ]; then
  ./node_modules/.bin/esbuild tests/monetisation-e2e.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-monetisation-e2e.cjs" --alias:@=./src >/dev/null
  node "${CHECK_OUTPUT_DIR}/rst-monetisation-e2e.cjs"
fi

echo "=== i18n locales (en / en-GB / pl key parity) ==="
./node_modules/.bin/esbuild tests/i18n-locales.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-i18n-locales.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-i18n-locales.cjs"

echo "=== sprite factory & asset pipeline (#78, #79) ==="
for check in sprite-factory asset-pipeline; do
  ./node_modules/.bin/esbuild "tests/$check.check.ts" --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-$check.cjs" --alias:@=./src >/dev/null
  node "${CHECK_OUTPUT_DIR}/rst-$check.cjs"
done

echo "=== game engine back-end & graphics tech suites ==="
for check in game-event-bus engine-loop engine-settings graphics-postfx shaders-diegetic-crt shaders-godray shaders-tube-glow; do
  ./node_modules/.bin/esbuild "tests/$check.check.ts" --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-$check.cjs" --alias:@=./src >/dev/null
  node "${CHECK_OUTPUT_DIR}/rst-$check.cjs"
done

echo "=== streak bank (k6e.5 combo cash-out) ==="
./node_modules/.bin/esbuild tests/streak-bank.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-streak-bank.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-streak-bank.cjs"

echo "=== progressive technique unlocks (#260) ==="
./node_modules/.bin/esbuild tests/feature-unlocks.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-feature-unlocks.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-feature-unlocks.cjs"
./node_modules/.bin/esbuild tests/technique-tease.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-technique-tease.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-technique-tease.cjs"

echo "=== motion platform & originkit architecture (#72) ==="
./node_modules/.bin/esbuild tests/motion-platform.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-motion-platform.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-motion-platform.cjs"

echo "=== motion primitives, tokens & reduced-motion (#73) ==="
./node_modules/.bin/esbuild tests/motion-primitives.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-motion-primitives.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-motion-primitives.cjs"

echo "=== motion qualification & renderer audit (#74) ==="
./node_modules/.bin/esbuild tests/motion-qualification.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-motion-qualification.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-motion-qualification.cjs"

echo "=== studio os motion pass (#75) ==="
./node_modules/.bin/esbuild tests/studio-os-motion.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-studio-os-motion.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-studio-os-motion.cjs"
./node_modules/.bin/esbuild tests/studio-art.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-studio-art.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-studio-art.cjs"

echo "=== gear bench & reward FX policy (#81, #80) ==="
for check in gear-bench gear-reliability gear-upkeep reward-fx-policy; do
  ./node_modules/.bin/esbuild "tests/$check.check.ts" --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-$check.cjs" --alias:@=./src >/dev/null
  node "${CHECK_OUTPUT_DIR}/rst-$check.cjs"
done

echo "=== gear visual state (#81) ==="
./node_modules/.bin/esbuild tests/gear-visual-state.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-gear-visual-state.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-gear-visual-state.cjs"

echo "=== console tier gear animation (#81) ==="
./node_modules/.bin/esbuild tests/console-tier-gear.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-console-tier-gear.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-console-tier-gear.cjs"

echo "=== DEV overlays opt-in (hidden by default) ==="
./node_modules/.bin/esbuild tests/dev-overlays-opt-in.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-dev-overlays-opt-in.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-dev-overlays-opt-in.cjs"

echo "=== studio ux presentation (HUD + love-room) ==="
./node_modules/.bin/esbuild tests/studio-clock-progression.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-studio-clock-progression.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-studio-clock-progression.cjs"
./node_modules/.bin/esbuild tests/room-switcher.check.tsx --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-room-switcher.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-room-switcher.cjs"
./node_modules/.bin/esbuild tests/room-layouts.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-room-layouts.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-room-layouts.cjs"
./node_modules/.bin/esbuild tests/studio-a-layout.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-studio-a-layout.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-studio-a-layout.cjs"
./node_modules/.bin/esbuild tests/facility-map.check.tsx --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-facility-map.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-facility-map.cjs"
./node_modules/.bin/esbuild tests/window-view.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-window-view.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-window-view.cjs"
./node_modules/.bin/esbuild tests/floor-furnishings.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-floor-furnishings.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-floor-furnishings.cjs"
./node_modules/.bin/esbuild tests/studio-ux-presentation.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-studio-ux-presentation.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-studio-ux-presentation.cjs"

echo "=== asset provenance manifest ==="
node scripts/verify-assets.mjs

echo "=== progression motion: studio-tier upgrades and era transitions (#77) ==="
./node_modules/.bin/esbuild tests/progression-motion.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-progression-motion.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-progression-motion.cjs"

echo "=== producer origins, perks & career start ==="
for check in origin-perks career-start design-system; do
  ./node_modules/.bin/esbuild "tests/$check.check.ts" --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-$check.cjs" --alias:@=./src >/dev/null
  node "${CHECK_OUTPUT_DIR}/rst-$check.cjs"
done

echo "=== producer customization -> modular sprite (#126) ==="
./node_modules/.bin/esbuild tests/producer-customization.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-producer-customization.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-producer-customization.cjs"
./node_modules/.bin/esbuild tests/producer-appearance-model.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-producer-appearance-model.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-producer-appearance-model.cjs"
./node_modules/.bin/esbuild tests/appearance-editor.check.tsx --bundle --platform=node --format=cjs --loader:.css=empty --outfile="${CHECK_OUTPUT_DIR}/rst-appearance-editor.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-appearance-editor.cjs"
./node_modules/.bin/esbuild tests/appearance-preview.check.tsx --bundle --platform=node --format=cjs --loader:.css=empty --outfile="${CHECK_OUTPUT_DIR}/rst-appearance-preview.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-appearance-preview.cjs"

echo "=== era-authentic gigs, story contracts & economy floors ==="
for check in project-era-starters project-brief session-issues signal-chain chain-patch-drag economy-income economy-ledger story-contracts achievements campaign-endings studio-hotkeys studio-know-how studio-premises premises-cue premises-affordance; do
  ./node_modules/.bin/esbuild "tests/$check.check.ts" --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-$check.cjs" --alias:@=./src >/dev/null
  node "${CHECK_OUTPUT_DIR}/rst-$check.cjs"
done

echo "=== explainable outcome forecast + 1,000-seed calibration (#55) ==="
./node_modules/.bin/esbuild tests/session-forecast.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-session-forecast.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-session-forecast.cjs"

echo "=== session rail (GH #41) ==="
./node_modules/.bin/esbuild tests/session-rail.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-session-rail.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-session-rail.cjs"

echo "=== ambient earning (#105) ==="
./node_modules/.bin/esbuild tests/ambient-income.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-ambient-income.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-ambient-income.cjs"

echo "=== studio seasons (#63) ==="
./node_modules/.bin/esbuild tests/studio-seasons.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-studio-seasons.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-studio-seasons.cjs"

echo "=== mobile session console zero-scroll guards (#141) ==="
./node_modules/.bin/esbuild tests/mobile-session.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-mobile-session.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-mobile-session.cjs"

echo "=== pixi GPU exclusivity guard ==="
./node_modules/.bin/esbuild tests/pixi-exclusivity.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-pixi-exclusivity.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-pixi-exclusivity.cjs"

echo "=== content validation (schemas, ids, references, caps) ==="
mkdir -p node_modules/.cache
pnpm run content:validate || exit 1

echo "=== balance harness invariants (10 days, seed 7) ==="
./node_modules/.bin/esbuild src/dev/balance/run.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-balance.cjs" --alias:@=./src >/dev/null
mkdir -p "${CHECK_OUTPUT_DIR}/rst-balance"
node "${CHECK_OUTPUT_DIR}/rst-balance.cjs" --days 10 --seed 7 --out "${CHECK_OUTPUT_DIR}/rst-balance" > "${CHECK_OUTPUT_DIR}/rst-balance.log" 2>&1
cat "${CHECK_OUTPUT_DIR}/rst-balance.log" | grep -E "invariants|PASS|FAIL" | tail -n 8
if grep -q "FAIL" "${CHECK_OUTPUT_DIR}/rst-balance.log"; then echo "Balance invariants FAILED"; exit 1; fi

echo "=== balance sweep (determinism, config overrides, runaway flags) ==="
./node_modules/.bin/esbuild tests/balance-sweep.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-balance-sweep.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-balance-sweep.cjs"
# Report-only: a small mid-game sweep; RUNAWAY lines are for humans, not a gate.
node "${CHECK_OUTPUT_DIR}/rst-balance.cjs" --sweep 20 --days 60 --scenario mid --seed 7 --out "${CHECK_OUTPUT_DIR}/rst-balance" | grep -E "RUNAWAY|runaway flags" || true

echo "=== feel layer ==="
./node_modules/.bin/esbuild tests/feel-mode.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-feel-mode.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-feel-mode.cjs"

./node_modules/.bin/esbuild tests/take-feedback.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-take-feedback.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-take-feedback.cjs"

echo "=== game icon set ==="
./node_modules/.bin/esbuild tests/game-icons.check.tsx --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-game-icons.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-game-icons.cjs"


./node_modules/.bin/esbuild tests/world-session-actions.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-world-session-actions.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-world-session-actions.cjs"

./node_modules/.bin/esbuild tests/console-chrome.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-console-chrome.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-console-chrome.cjs"

./node_modules/.bin/esbuild tests/intervention-checkpoint.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-intervention-checkpoint.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-intervention-checkpoint.cjs"
./node_modules/.bin/esbuild tests/advance-day-work.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-advance-day-work.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-advance-day-work.cjs"

./node_modules/.bin/esbuild tests/session-wrap.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-session-wrap.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-session-wrap.cjs"
./node_modules/.bin/esbuild tests/session-beat.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-session-beat.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-session-beat.cjs"

echo "=== one-shot UI SFX policy (#256) ==="
./node_modules/.bin/esbuild tests/oneshot-sfx.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-oneshot-sfx.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-oneshot-sfx.cjs"

echo "=== sfx key resolver (no site-root fetches) ==="
./node_modules/.bin/esbuild tests/sfx-key-resolver.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-sfx-key-resolver.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-sfx-key-resolver.cjs"

echo "=== project review recovery (#255) ==="
./node_modules/.bin/esbuild tests/project-review-recovery.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-project-review-recovery.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-project-review-recovery.cjs"

./node_modules/.bin/esbuild tests/career-chronicle.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-career-chronicle.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-career-chronicle.cjs"

echo "=== career story rewards (#259 slice 4) ==="
./node_modules/.bin/esbuild tests/career-rewards.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-career-rewards.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-career-rewards.cjs"

echo "=== compact career setup (#204) ==="
./node_modules/.bin/esbuild tests/career-setup.check.tsx --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-career-setup.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-career-setup.cjs"

echo "=== room and producer cosmetics (#258) ==="
./node_modules/.bin/esbuild tests/studio-customization.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-studio-customization.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-studio-customization.cjs"

./node_modules/.bin/esbuild tests/studio-customization-panel.check.tsx --bundle --platform=node --format=cjs --loader:.css=empty --outfile="${CHECK_OUTPUT_DIR}/rst-studio-customization-panel.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-studio-customization-panel.cjs"

echo "=== equipped furnishings and cosmetics render mapping (#258) ==="
./node_modules/.bin/esbuild tests/studio-customization-render.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-studio-customization-render.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-studio-customization-render.cjs"

echo "=== audio concept tags (#306) ==="
./node_modules/.bin/esbuild tests/audio-concepts.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-audio-concepts.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-audio-concepts.cjs"

echo "=== city room style (#291) ==="
./node_modules/.bin/esbuild tests/city-room-style.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-city-room-style.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-city-room-style.cjs"

echo "=== gear why hint (#306) ==="
./node_modules/.bin/esbuild tests/gear-why.check.ts --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-gear-why.cjs" --alias:@=./src >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-gear-why.cjs"

echo "=== shop effect lines + stake unlock hints ==="
./node_modules/.bin/esbuild tests/shop-effects-stake-hints.check.tsx --bundle --platform=node --format=cjs --outfile="${CHECK_OUTPUT_DIR}/rst-shop-effects-stake-hints.cjs" --alias:@=./src --loader:.css=empty >/dev/null
node "${CHECK_OUTPUT_DIR}/rst-shop-effects-stake-hints.cjs"

echo "All automated checks passed."
