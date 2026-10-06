#!/usr/bin/env node
// #260: run the first-session unlock check in a real browser.
//   pnpm exec vite --port 5173 &   then   node scripts/feature-unlocks-first-session.cjs
// Env: RST_BASE_URL, PLAYWRIGHT_CHROMIUM (browser path).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'tests', 'feature-unlocks-first-session.check.cjs'), 'utf8');
  const exe = process.env.PLAYWRIGHT_CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
  const browser = await chromium.launch(exe ? { executablePath: exe } : { channel: 'chrome' });
  let failed = false;
  try {
    const page = await browser.newPage();
    console.log(await eval(source)(page));
  } catch (e) {
    failed = true;
    console.error(`FAILED: ${e.message}`);
  } finally { await browser.close(); }
  process.exit(failed ? 1 : 0);
})();
