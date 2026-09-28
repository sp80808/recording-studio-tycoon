#!/usr/bin/env bash
# Automated repo checks (bead itt). Fails loudly on the first failing check.
# Usage: pnpm test
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== tutorial and room purchases ==="
for check in first-session-guide studio-room-purchase; do
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
for check in tools-assets audio-system confetti-juice minigames-audio user-interaction; do
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
