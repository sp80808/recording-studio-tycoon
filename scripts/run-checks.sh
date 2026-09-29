echo "=== studio chores, progression & crate unboxing suites ==="
for check in chore-engine chore-progression-coupling studio-duties-clipboard chore-hotspots crate-unboxing flight-case-reveal flight-case-connectors reward-animation-sprite-pipeline; do
  ./node_modules/.bin/esbuild "tests/$check.check.ts" --bundle --platform=node --format=cjs --outfile="/tmp/rst-$check.cjs" --alias:@=./src >/dev/null
  node "/tmp/rst-$check.cjs"
done
