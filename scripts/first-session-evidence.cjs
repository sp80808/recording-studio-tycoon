#!/usr/bin/env node
// #198: run the first-session evidence fixture on desktop and phone.
//   pnpm build && pnpm exec vite preview --port 4173 &   then   node scripts/first-session-evidence.cjs
// Env: RST_BASE_URL, RST_ENFORCE_GATES=1, RST_RELOAD_CHECKPOINT=1, PLAYWRIGHT_CHROMIUM (browser path).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'tests', 'first-session-evidence.check.cjs'), 'utf8');
  const exe = process.env.PLAYWRIGHT_CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
  const browser = await chromium.launch(exe ? { executablePath: exe } : { channel: 'chrome' });
  let failed = false;
  try {
    for (const viewport of (process.env.RST_ONLY ? [process.env.RST_ONLY] : ['desktop', 'phone'])) {
      process.env.RST_VIEWPORT = viewport;
      const page = await browser.newPage();
      try { console.log(`--- ${viewport}\n${await eval(source)(page)}`); }
      catch (e) { failed = true; console.error(`--- ${viewport} FAILED\n${e.message}`); }
      await page.close();
    }
  } finally { await browser.close(); }
  process.exit(failed ? 1 : 0);
})();
