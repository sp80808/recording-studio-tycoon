# Booking-to-settlement smoke (GH #8 P0 spine)

`booking-settlement.check.cjs` drives the real game in a browser, following the
established `tests/mixing-board.check.cjs` pattern (`async (page) => {...}`
with throwing asserts): splash → era → tutorial → booking → work sessions →
project review (quality + rewards) → settlement, then asserts zero console
errors (favicon 404s ignored).

## Run

Terminal 1 — dev server (from the repo root):

```bash
pnpm dev --port 5173 --strictPort
```

Terminal 2 — headless Chrome via the Playwright library:

```bash
NODE_PATH=/Users/user/.local/lib/node_modules node -e "const{chromium}=require('playwright');const fs=require('fs');(async()=>{const fn=eval(fs.readFileSync('tests/booking-settlement.check.cjs','utf8'));const b=await chromium.launch({headless:true,channel:'chrome'});const p=await b.newPage({viewport:{width:1440,height:900}});try{console.log(await fn(p))}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)})"
```

Notes:

- `channel:'chrome'` reuses the installed Google Chrome so no
  `playwright install` download is needed. If the stock Chromium bundle is
  installed, drop `channel:'chrome'`.
- The file also loads in the Playwright `browser_run_code` tool (filename),
  same as `tests/mixing-board.check.cjs`.
- Kill the dev server when done and confirm the port is free, e.g.
  `lsof -ti:5173 | xargs kill` then `lsof -ti:5173` (empty = free).

## What it asserts

1. Splash `Start New Game` → era modal → default era (`Modern Era`) starts.
2. Tutorial `Next` chain (up to 12) ending in `Start Playing` dismisses to the
   studio (`STUDIO FLOOR` + `Artist Enquiries`). `Skip Tutorial` is
   deliberately unused (it opens a `confirm()` no-op in automation).
3. Booking: tries the Pixi phone hotspot (`Take Gig` in the `Booking Line`
   inspector) first, falls back to the first enabled `Book Session` in the
   project list.
4. Work: clicks `Work on Project` (up to ~30 sessions) until
   `Project Complete:` appears; on empty energy it advances the day via
   `Rest & advance day` (or the management drawer `Advance Day`) and carries
   on. `Optional Studio Intervention` popups are skipped, never blocking.
5. Review shows `Overall Quality:`, `Rewards`, `Money:` and `Reputation:`;
   settling via `Awesome!` returns to an unblocked studio (an enabled
   `Book Session` is visible again).
6. No `error`-type console entries and no page errors for the whole run.

Timeouts are generous (first paint up to 90s for a cold Vite compile, review
animations up to 30s); there are no fixed sleeps — every wait polls for a
visible selector. Selectors prefer `getByRole`/`getByText`; the only
coordinate click is the best-effort canvas hotspot with an immediate
`ProjectList` fallback.
