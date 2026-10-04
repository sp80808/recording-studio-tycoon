// Take calibration browser check: the needle must actually sweep, an in-Pocket
// Space lock must score Gold, and the auto-lock fallback must resolve an idle
// take. Same pattern as tests/mobile-session.check.cjs (`async (page) => {...}`,
// throwing asserts); needs a dev/preview server + Playwright, e.g.:
//   RST_BASE_URL=http://127.0.0.1:8080 node -e "const {chromium}=require('playwright');const fs=require('fs');(async()=>{const b=await chromium.launch({channel:'chrome'});const p=await b.newPage();console.log(await eval(fs.readFileSync('tests/take-calibration.check.cjs','utf8'))(p));await b.close();})()"
async (page) => {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const errors = [];
  page.on('console', message => {
    if (message.type() === 'error' && !/favicon|speed-insights|Failed to load resource|<path> attribute d/i.test(message.text())) errors.push(message.text());
  });
  page.on('pageerror', error => errors.push(error.message));
  const base = (typeof process !== 'undefined' && process.env.RST_BASE_URL) || 'http://127.0.0.1:8080';

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });

  // New studio bootstrap (same walk as the mobile session smoke).
  await page.getByRole('button', { name: /New studio/ }).click();
  await page.getByRole('button', { name: /Choose an era/ }).click();
  await page.getByText('Modern Era', { exact: true }).click();
  await page.getByRole('button', { name: /Create your producer/ }).click();
  await page.getByRole('button', { name: /Choose a role/ }).click();
  await page.getByText('The Bedroom Beatmaker').first().click();
  await page.getByRole('button', { name: /Open the studio/ }).click();
  for (let i = 0; i < 12; i++) {
    const start = page.getByRole('button', { name: /Start Playing/ });
    if (await start.isVisible()) { await start.click(); break; }
    const next = page.getByRole('button', { name: /^Next/ });
    if (await next.isVisible()) await next.click(); else break;
  }
  const activities = page.getByRole('navigation', { name: 'Studio activities' });
  await activities.waitFor();
  await activities.getByRole('button', { name: 'Artist' }).click();
  const book = page.getByRole('button', { name: 'Book Session' }).first();
  await book.waitFor();
  await book.click();
  await page.getByTestId('mobile-session-body').waitFor();

  const armBtn = () => page.getByRole('button', { name: /Work on Project/ });
  const meter = page.getByRole('meter');
  const lock = page.getByRole('button', { name: /^Lock take/ });

  // --- Take 1: the needle must actually sweep the arc -------------------------
  if (await armBtn().isVisible().catch(() => false)) await armBtn().click();
  await lock.waitFor();
  await meter.waitFor();
  assert(await page.getByTestId('auto-lock-drain').isVisible(), 'auto-lock drain is visible while armed');
  // Keep sampling short: the safe fallback fires 3.2s after arming.
  const samples = [];
  for (let i = 0; i < 10; i++) {
    samples.push(Number(await meter.getAttribute('aria-valuenow')));
    await page.waitForTimeout(30);
  }
  const spread = Math.max(...samples) - Math.min(...samples);
  assert(spread > 25, `needle must sweep, not park (observed spread ${spread}, samples ${samples.join(',')})`);
  console.log(`take 1 sweep: spread ${spread} over ${samples.length} samples`);

  // --- Same take: plain Space (body focus) inside the Pocket must score Gold --
  await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
  await page.waitForFunction(
    () => document.querySelector('[role="meter"]')?.getAttribute('data-needle-state') === 'pocket',
    { timeout: 6000 },
  );
  await page.keyboard.press('Space');
  await page.getByText(/Gold Take/).first().waitFor({ timeout: 2500 });
  console.log('take 1 lock: in-pocket Space press scored Gold');

  // --- Take 2: never touch it; the auto-lock fallback must resolve the check --
  await lock.waitFor({ timeout: 3000 }); // the burst re-arms while energy remains
  // Needle starts the arc at 0.53 rising; at the 3.2s fallback it sits low on the
  // arc (pos(3.2) ≈ 0.13), a deterministic Solid Take.
  await page.getByText(/Solid Take! \+/).first().waitFor({ timeout: 4500 });
  console.log('take 2 fallback: idle check auto-locked into a result');

  assert(errors.length === 0, errors.slice(0, 5).join('\n'));
  return 'PASS: needle sweeps, pocket Space-lock is Gold, auto-lock fallback resolves';
}

