#!/usr/bin/env bash
# #59: summarise an exported gameplay trace (JSON from `rstTelemetry.exportTrace()` in the browser console).
#   bash scripts/analyze-trace.sh path/to/trace.json
set -euo pipefail
trace="${1:?usage: analyze-trace.sh trace.json}"
tmp="$(mktemp -t rst-analyze-XXXXXX.cjs)"
cat > "$tmp.entry.ts" <<'TS'
import fs from 'node:fs';
import { summarizeTrace } from '../src/telemetry/analyze';
const trace = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
console.log(JSON.stringify(summarizeTrace(trace), null, 2));
TS
mkdir -p .tmp-analyze && cp "$tmp.entry.ts" .tmp-analyze/entry.ts
./node_modules/.bin/esbuild .tmp-analyze/entry.ts --bundle --platform=node --format=cjs --outfile="$tmp" --alias:@=./src >/dev/null
node "$tmp" "$trace"
rm -rf .tmp-analyze "$tmp" "$tmp.entry.ts"
