// Take calibration browser check: the needle must actually sweep, an in-Pocket
// Space lock must score Gold, and the auto-lock fallback must resolve an idle
// take. Same pattern as tests/mobile-session.check.cjs (`async (page) => {...}`,
// throwing asserts); needs a dev/preview server + Playwright, e.g.:
//   RST_BASE_URL=http://127.0.0.1:8080 node -e "const {chromium}=require('playwright');const fs=require('fs');(async()=>{const b=await chromium.launch({channel:'chrome'});const p=await b.newPage();console.log(await eval(fs.readFileSync('tests/take-calibration.check.cjs','utf8'))(p));await b.close();})()"
async (page) => {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const errors = [];
  page.on('console', message => {
    if (message.type() === 'error' && !/favicon|speed-insights|Failed to load resource|<path> attribute d|Studio room failed to initialize/i.test(message.text())) errors.push(message.text());
  });
  page.on('pageerror', error => errors.push(error.message));
  const base = (typeof process !== 'undefined' && process.env.RST_BASE_URL) || 'http://127.0.0.1:8080';

  // This check measures the take meter against wall-clock time (the Pocket is ~100ms wide). The Pixi studio room
  // in software-GL headless Chromium drops the page to ~10fps, so the game locks on a stale frame and the check
  // becomes unreliable. Deny WebGL contexts (the room then fails to initialise, tolerated above).
  // Set RST_KEEP_GL=1 to run with the room rendered, e.g. on a GPU runner.
  if (!(typeof process !== 'undefined' && process.env.RST_KEEP_GL)) {
    await page.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...rest) { return /webgl/i.test(String(type)) ? null : getContext.call(this, type, ...rest); };
    });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });

  // New studio bootstrap (same walk as the mobile session smoke).
  await page.getByRole('button', { name: /New studio/ }).click();
  // Current onboarding (#204): one "Quick start" button opens the studio with a valid random setup.
  // Fall back to the older step-by-step wizard when that button is absent.
  const quick = page.getByRole('button', { name: /Quick start/i });
  if (await quick.count()) {
    await quick.first().click();
  } else {
    await page.getByRole('button', { name: /Choose an era/ }).click();
    await page.getByText('Modern Era', { exact: true }).click();
    await page.getByRole('button', { name: /Create your producer/ }).click();
    await page.getByRole('button', { name: /Choose a role/ }).click();
    await page.getByText('The Bedroom Beatmaker').first().click();
    await page.getByRole('button', { name: /Open the studio/ }).click();
  }
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
  // Take results ("Gold Take! +4 Quality ...") are on screen for only ~250ms, which a polling locator can
  // miss on a loaded runner. Record them in-page as they appear, in order, and assert on the record.
  await page.evaluate(() => {
    window.__takeResults = [];
    let last = '';
    new MutationObserver(() => {
      const hit = /\b(Gold|Silver|Solid) Take! \+\d+/.exec(document.body.textContent || '');
      const text = hit ? hit[0] : '';
      if (text && text !== last) window.__takeResults.push(hit[1]);
      last = text;
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  });
  // Keep sampling short: the safe fallback fires 3.2s after arming. Sampled in-page on animation frames
  // (~0.7s) so a loaded runner's Playwright latency cannot starve it.
  const samples = await page.evaluate(() => new Promise((resolve) => {
    const out = [];
    const end = performance.now() + 700;
    const tick = () => {
      out.push(Number(document.querySelector('[role="meter"]')?.getAttribute('aria-valuenow')));
      if (performance.now() < end) requestAnimationFrame(tick); else resolve(out);
    };
    tick();
  }));
  const spread = Math.max(...samples) - Math.min(...samples);
  assert(spread > 25, `needle must sweep, not park (observed spread ${spread}, samples ${samples.join(',')})`);
  console.log(`take 1 sweep: spread ${spread} over ${samples.length} samples`);

  // --- Plain Space (body focus) inside the Pocket must score Gold --------------
  // The Pocket is ~100ms wide per pass and the game locks on the needle position of the last painted frame, so
  // on a loaded (software-GL) runner running at a few fps a single press can legitimately land just outside it.
  // Allow up to 3 takes to land one Gold; the product claim is that an in-Pocket Space press can score Gold.
  // The press is fired from inside the page on the first frame the meter reports 'pocket' (a Playwright
  // poll-then-press round-trip is far slower than the window); the app's window keydown handler sees an
  // ordinary body-level Space.
  const pressInPocket = () => page.evaluate(() => new Promise((resolve, reject) => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    const deadline = performance.now() + 6000;
    const tick = () => {
      const m = document.querySelector('[role="meter"]');
      if (m?.getAttribute('data-needle-state') === 'pocket') {
        document.body.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true, cancelable: true }));
        resolve(m.getAttribute('aria-valuetext'));
      } else if (performance.now() > deadline) reject(new Error('needle never entered the Pocket'));
      else requestAnimationFrame(tick);
    };
    tick();
  }));
  const grades = [];
  let goldAt = -1;
  for (let attempt = 0; attempt < 3 && goldAt < 0; attempt++) {
    if (attempt > 0) await lock.waitFor({ timeout: 6000 }); // the burst re-arms while energy remains
    await pressInPocket();
    await page.waitForFunction((n) => window.__takeResults.length > n, grades.length, { timeout: 5000 });
    grades.push(await page.evaluate((i) => window.__takeResults[i], grades.length));
    if (grades[attempt] === 'Gold') goldAt = attempt;
  }
  assert(goldAt >= 0, `no in-Pocket Space press scored Gold in 3 takes (grades ${grades.join(',')})`);
  console.log(`take ${goldAt + 1} lock: in-Pocket Space press scored Gold (grades so far: ${grades.join(',')})`);

  // --- Next take: never touch it; the auto-lock fallback must resolve the check -
  // The needle sits low on the arc at 3.2s (pos ~0.46), a Solid Take, as long as frames are not badly stale.
  await lock.waitFor({ timeout: 6000 });
  await page.waitForFunction((n) => window.__takeResults.length > n, grades.length, { timeout: 8000 });
  const fallback = await page.evaluate((i) => window.__takeResults[i], grades.length);
  assert(fallback === 'Solid', `idle take must auto-lock into a Solid Take, got ${fallback}`);
  console.log('idle take: auto-lock fallback resolved into a Solid Take');

  assert(errors.length === 0, errors.slice(0, 5).join('\n'));
  return 'PASS: needle sweeps, pocket Space-lock is Gold, auto-lock fallback resolves';
}
