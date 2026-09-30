#!/usr/bin/env bash
# Automated repo checks (bead itt). Fails loudly on the first failing check.
# Usage: pnpm test
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== tutorial and room purchases ==="
for check in first-session-guide studio-room-purchase toast-spam; do
  ./node_modules/.bin/esbuild "tests/$check.check.ts" --bundle --platform=node --format=cjs --outfile="/tmp/rst-$check.cjs" --alias:@=./src >/dev/null
  node "/tmp/rst-$check.cjs"
done

echo "=== daily challenges ==="
./node_modules/.bin/esbuild tests/reward-flights.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-reward-flights.cjs --alias:@=./src >/dev/null
node /tmp/rst-reward-flights.cjs
./node_modules/.bin/esbuild tests/daily-challenges.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-daily-challenges.cjs --alias:@=./src >/dev/null
node /tmp/rst-daily-challenges.cjs

echo "=== talents & atomicity ==="
./node_modules/.bin/esbuild tests/talents-atomicity.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-talents.cjs --alias:@=./src >/dev/null
node /tmp/rst-talents.cjs

echo "=== studio synergies ==="
./node_modules/.bin/esbuild tests/synergies.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-synergies.cjs --alias:@=./src >/dev/null
node /tmp/rst-synergies.cjs

echo "=== open source tools and assets ==="
for check in tools-assets audio-system confetti-juice minigames-audio user-interaction vu-meter pocket-take pocket-meter-pacing take-audio; do
  ./node_modules/.bin/esbuild "tests/$check.check.ts" --bundle --platform=node --format=cjs --outfile="/tmp/rst-$check.cjs" --alias:@=./src >/dev/null
  node "/tmp/rst-$check.cjs"
done

echo "=== gamepad service & controller suites ==="
for check in gamepad-service gamepad-glyph gamepad-navigation radial-wheel beat-pad-game tape-jog-game console-ride-game gamepad-suite; do
  ./node_modules/.bin/esbuild "tests/$check.check.ts" --bundle --platform=node --format=cjs --outfile="/tmp/rst-$check.cjs" --alias:@=./src >/dev/null
  node "/tmp/rst-$check.cjs"
done

echo "=== lore, character origins & narrative arcs ==="
./node_modules/.bin/esbuild tests/narrative-lore-arcs.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-narrative-lore-arcs.cjs --alias:@=./src >/dev/null
node /tmp/rst-narrative-lore-arcs.cjs

echo "=== splash & career hub loop ==="
./node_modules/.bin/esbuild tests/splash-career-hub.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-splash-career-hub.cjs --alias:@=./src >/dev/null
node /tmp/rst-splash-career-hub.cjs

echo "=== studio strip desktop gate (zel.6) ==="
if [ -f tests/studio-strip-desktop-gate.check.ts ]; then
  ./node_modules/.bin/esbuild tests/studio-strip-desktop-gate.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-studio-strip-desktop-gate.cjs --alias:@=./src >/dev/null
  node /tmp/rst-studio-strip-desktop-gate.cjs
fi

echo "=== studio chores, progression & crate unboxing suites ==="
for check in chore-engine chore-progression-coupling studio-duties-clipboard chore-hotspots crate-unboxing flight-case-reveal flight-case-connectors reward-animation-sprite-pipeline; do
  ./node_modules/.bin/esbuild "tests/$check.check.ts" --bundle --platform=node --format=cjs --outfile="/tmp/rst-$check.cjs" --alias:@=./src >/dev/null
  node "/tmp/rst-$check.cjs"
done

echo "=== branching deterministic storylines ==="
./node_modules/.bin/esbuild tests/branching-storylines.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-branching-storylines.cjs --alias:@=./src >/dev/null
node /tmp/rst-branching-storylines.cjs

echo "=== equipment slots / gear racks (8om) ==="
./node_modules/.bin/esbuild tests/equipment-slots.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-equipment-slots.cjs --alias:@=./src >/dev/null
node /tmp/rst-equipment-slots.cjs

echo "=== monetisation telemetry & experiments ==="
if [ -f tests/monetisation-telemetry.check.ts ]; then
  ./node_modules/.bin/esbuild tests/monetisation-telemetry.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-monetisation-telemetry.cjs --alias:@=./src >/dev/null
  node /tmp/rst-monetisation-telemetry.cjs
fi

echo "=== monetisation save/reset/reversal hardening ==="
if [ -f tests/monetisation-hardening.check.ts ]; then
  ./node_modules/.bin/esbuild tests/monetisation-hardening.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-monetisation-hardening.cjs --alias:@=./src >/dev/null
  node /tmp/rst-monetisation-hardening.cjs
fi

echo "=== monetisation mock vertical-slice e2e ==="
if [ -f tests/monetisation-e2e.check.ts ]; then
  ./node_modules/.bin/esbuild tests/monetisation-e2e.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-monetisation-e2e.cjs --alias:@=./src >/dev/null
  node /tmp/rst-monetisation-e2e.cjs
fi

echo "=== i18n locales (en / en-GB / pl key parity) ==="
./node_modules/.bin/esbuild tests/i18n-locales.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-i18n-locales.cjs --alias:@=./src >/dev/null
node /tmp/rst-i18n-locales.cjs

echo "=== game engine back-end & graphics tech suites ==="
for check in game-event-bus engine-loop engine-settings graphics-postfx; do
  ./node_modules/.bin/esbuild "tests/$check.check.ts" --bundle --platform=node --format=cjs --outfile="/tmp/rst-$check.cjs" --alias:@=./src >/dev/null
  node "/tmp/rst-$check.cjs"
done

echo "=== streak bank (k6e.5 combo cash-out) ==="
./node_modules/.bin/esbuild tests/streak-bank.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-streak-bank.cjs --alias:@=./src >/dev/null
node /tmp/rst-streak-bank.cjs

echo "=== motion platform & originkit architecture (#72) ==="
./node_modules/.bin/esbuild tests/motion-platform.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-motion-platform.cjs --alias:@=./src >/dev/null
node /tmp/rst-motion-platform.cjs

echo "=== motion primitives, tokens & reduced-motion (#73) ==="
./node_modules/.bin/esbuild tests/motion-primitives.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-motion-primitives.cjs --alias:@=./src >/dev/null
node /tmp/rst-motion-primitives.cjs

echo "=== motion qualification & renderer audit (#74) ==="
./node_modules/.bin/esbuild tests/motion-qualification.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-motion-qualification.cjs --alias:@=./src >/dev/null
node /tmp/rst-motion-qualification.cjs

echo "=== studio os motion pass (#75) ==="
./node_modules/.bin/esbuild tests/studio-os-motion.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-studio-os-motion.cjs --alias:@=./src >/dev/null
node /tmp/rst-studio-os-motion.cjs

echo "=== DEV overlays opt-in (hidden by default) ==="
./node_modules/.bin/esbuild tests/dev-overlays-opt-in.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-dev-overlays-opt-in.cjs --alias:@=./src >/dev/null
node /tmp/rst-dev-overlays-opt-in.cjs

echo "=== studio ux presentation (HUD + love-room) ==="
./node_modules/.bin/esbuild tests/studio-ux-presentation.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-studio-ux-presentation.cjs --alias:@=./src >/dev/null
node /tmp/rst-studio-ux-presentation.cjs

echo "=== progression motion: studio-tier upgrades and era transitions (#77) ==="
./node_modules/.bin/esbuild tests/progression-motion.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-progression-motion.cjs --alias:@=./src >/dev/null
node /tmp/rst-progression-motion.cjs

echo "=== producer origins, perks & career start ==="
for check in origin-perks career-start design-system; do
  ./node_modules/.bin/esbuild "tests/$check.check.ts" --bundle --platform=node --format=cjs --outfile="/tmp/rst-$check.cjs" --alias:@=./src >/dev/null
  node "/tmp/rst-$check.cjs"
done

echo "=== balance harness invariants (10 days, seed 7) ==="
./node_modules/.bin/esbuild src/dev/balance/run.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-balance.cjs --alias:@=./src >/dev/null
mkdir -p /tmp/rst-balance
node /tmp/rst-balance.cjs --days 10 --seed 7 --out /tmp/rst-balance > /tmp/rst-balance.log 2>&1
cat /tmp/rst-balance.log | grep -E "invariants|PASS|FAIL" | tail -n 8
if grep -q "FAIL" /tmp/rst-balance.log; then echo "Balance invariants FAILED"; exit 1; fi

echo "All automated checks passed."
