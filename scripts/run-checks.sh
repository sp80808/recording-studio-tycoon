#!/usr/bin/env bash
# Automated repo checks (bead itt). Fails loudly on the first failing check.
# Usage: pnpm test
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== daily challenges ==="
pnpm exec esbuild tests/daily-challenges.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-daily-challenges.cjs --alias:@=./src >/dev/null
node /tmp/rst-daily-challenges.cjs

echo "=== balance harness invariants (10 days, seed 7) ==="
pnpm exec esbuild src/dev/balance/run.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-balance.cjs --alias:@=./src >/dev/null
mkdir -p /tmp/rst-balance
node /tmp/rst-balance.cjs --days 10 --seed 7 --out /tmp/rst-balance > /tmp/rst-balance.log 2>&1
cat /tmp/rst-balance.log | grep -E "invariants|PASS|FAIL" | tail -n 8
if grep -q "FAIL" /tmp/rst-balance.log; then echo "Balance invariants FAILED"; exit 1; fi

echo "All automated checks passed."
