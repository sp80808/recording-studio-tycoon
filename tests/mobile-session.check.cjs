// #141 browser check: the phone session console is a zero-scroll single viewport.
// Same pattern as tests/booking-settlement.check.cjs (`async (page) => {...}`, throwing asserts).
//   RST_BASE_URL=http://127.0.0.1:5173 (dev server running), then drive through Playwright.
// Covers: 390x844, 430x932, 360x640, 844x390 (no vertical scroll / Arm + Lock reachable),
// one session identity, Book Session and Continue Session entry, and a full
// adjust focus -> Arm Take -> Lock Take -> result -> repeat loop. Desktop 1440x900 is asserted unchanged.
async (page) => {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const errors = [];
  page.on('console', message => {
    if (message.type() === 'error' && !/favicon|speed-insights|Failed to load resource|<path> attribute d/i.test(message.text())) errors.push(message.text());
  });
  page.on('pageerror', error => errors.push(error.message));
  const base = (typeof process !== 'undefined' && process.env.RST_BASE_URL) || 'http://127.0.0.1:5173';
  const shot = async (name) => {
    const dir = typeof process !== 'undefined' && process.env.RST_SHOT_DIR;
    if (dir) await page.screenshot({ path: `${dir}/${name}.png` });
  };

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /New studio/ }).click();
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

  // Book Session entry
  await activities.getByRole('button', { name: 'Artist' }).click();
  const book = page.getByRole('button', { name: 'Book Session' }).first();
  await book.waitFor();
  await book.click();
  const body = page.getByTestId('mobile-session-body');
  await body.waitFor();

  // Reward fly-to targets stay mounted and visible with the details popover closed.
  assert(await page.locator('#creativity-points[data-creativity-target]').isVisible(), 'creativity target not mounted');
  assert(await page.locator('#technical-points[data-technical-target]').isVisible(), 'technical target not mounted');

  // Nothing in the session sheet may scroll vertically, and the sheet must fit the viewport.
  const scrollAudit = () => page.evaluate(() => {
    const drawer = document.querySelector('[data-studio-drawer="session"]');
    const offenders = [];
    drawer.querySelectorAll('*').forEach(el => {
      const cs = getComputedStyle(el);
      if ((cs.overflowY === 'auto' || cs.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 1) {
        offenders.push(`${el.tagName}.${String(el.className).slice(0, 40)} ${el.scrollHeight}>${el.clientHeight}`);
      }
    });
    const dock = document.querySelector('.rst-transport-dock').getBoundingClientRect();
    const shell = drawer.querySelector('.studio-drawer-shell').getBoundingClientRect();
    return {
      offenders,
      pageScrolls: document.documentElement.scrollHeight > innerHeight + 1,
      dockBottom: dock.bottom,
      shellBottom: shell.bottom,
      innerHeight,
      scrollWidthOk: document.documentElement.scrollWidth <= innerWidth,
    };
  });
  const inViewport = async (locator, label) => {
    const box = await locator.boundingBox();
    assert(box, `${label} has no box`);
    const vp = page.viewportSize();
    assert(box.y >= 0 && box.y + box.height <= vp.height + 1 && box.x >= 0 && box.x + box.width <= vp.width + 1, `${label} outside viewport ${JSON.stringify(box)}`);
  };
  const armBtn = () => page.getByRole('button', { name: 'Work on Project' });

  const viewports = [[390, 844], [430, 932], [360, 640], [844, 390]];
  for (const [w, h] of viewports) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(250);
    const audit = await scrollAudit();
    assert(audit.offenders.length === 0, `${w}x${h}: scrollable regions ${audit.offenders.join(' | ')}`);
    assert(!audit.pageScrolls && audit.scrollWidthOk, `${w}x${h}: page scrolls`);
    assert(audit.dockBottom <= audit.innerHeight + 1, `${w}x${h}: transport dock below the fold`);
    await inViewport(armBtn(), `${w}x${h} Arm Take`);
    await inViewport(page.getByTestId('mobile-focus-mixer'), `${w}x${h} focus mixer`);
    // Single session identity: no OS kicker, no visible "At the console" heading.
    assert(!(await page.getByText('RECORDING STUDIO OS').isVisible()), `${w}x${h}: kicker still visible`);
    const headingBox = await page.getByRole('heading', { name: 'At the console' }).boundingBox();
    assert(!headingBox || headingBox.width <= 1, `${w}x${h}: "At the console" heading still visible`);
    assert(await page.locator('[data-studio-drawer="session"]').getByRole('tab').count() === 0, `${w}x${h}: duplicate drawer tab rail still present`);
    const mixer = await page.getByTestId('mobile-focus-mixer').boundingBox();
    assert(mixer.height <= (h < 500 ? 150 : 220), `${w}x${h}: mixer too tall (${Math.round(mixer.height)}px)`);
    await shot(`session-${w}x${h}`);
  }

  // Full loop at 390x844: adjust focus -> arm -> calibration swaps into the workspace -> lock -> result -> repeat.
  await page.setViewportSize({ width: 390, height: 844 });
  const channel = page.locator('[data-focus-channel="performance"]');
  const thumb = channel.getByRole('slider');
  const before = await thumb.getAttribute('aria-valuenow');
  await thumb.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  assert(await thumb.getAttribute('aria-valuenow') !== before, 'Focus slider is not editable on phone');
  for (const key of ['soundCapture', 'layering']) {
    assert(await page.locator(`[data-focus-channel="${key}"]`).getByRole('slider').isVisible(), `${key} channel missing`);
  }

  for (let take = 0; take < 2; take++) {
    const docHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    // The burst may already have re-armed itself; only press Work when it is still on offer.
    if (await armBtn().isVisible().catch(() => false)) await armBtn().click({ timeout: 3000 }).catch(() => {});
    const lock = page.getByRole('button', { name: /^Lock take/ });
    await lock.waitFor();
    assert(await page.getByTestId('mobile-focus-mixer').count() === 0, 'Mixer should be replaced while armed');
    assert(await page.getByTestId('mobile-session-workspace').getByRole('meter').isVisible(), 'PocketMeter not in the centre workspace');
    await inViewport(lock, 'Lock Take');
    const armedAudit = await scrollAudit();
    assert(armedAudit.offenders.length === 0 && !armedAudit.pageScrolls, 'Armed calibration extends the page');
    assert(await page.evaluate(() => document.documentElement.scrollHeight) === docHeight, 'Page height changed while armed');
    await shot(`armed-${take}`);
    await lock.click();
    // Takes chain automatically while energy remains (no dead Arm wait): keep locking until the burst ends.
    for (let guard = 0; guard < 12; guard++) {
      await Promise.race([armBtn().waitFor(), lock.waitFor()]).catch(() => {});
      if (await armBtn().isVisible().catch(() => false)) break;
      if (await lock.isVisible().catch(() => false)) await lock.click().catch(() => {});
    }
    await armBtn().waitFor();
    await page.getByTestId('mobile-focus-mixer').waitFor();
    const after = await scrollAudit();
    assert(after.offenders.length === 0 && !after.pageScrolls, 'Result view scrolls');
  }
  await shot('after-take');

  // Continue Session entry: close, then use the studio CTA.
  await page.keyboard.press('Escape');
  await page.getByTestId('mobile-session-body').waitFor({ state: 'hidden' });
  await page.getByRole('button', { name: /Continue session/ }).click();
  await page.getByTestId('mobile-session-body').waitFor();
  await inViewport(armBtn(), 'Arm Take after Continue Session');
  assert((await scrollAudit()).offenders.length === 0, 'Continue Session view scrolls');

  // Desktop is unchanged: legacy ActiveProject layout + full drawer chrome.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(300);
  assert(await page.locator('[data-session-layout="desktop"]').count() === 1, 'Desktop lost its layout');
  assert(await page.getByTestId('mobile-session-body').count() === 0, 'Mobile body leaked onto desktop');
  assert(await page.getByText('RECORDING STUDIO OS').isVisible(), 'Desktop kicker missing');
  assert(await page.getByText('Session Focus Allocation').isVisible(), 'Desktop focus module missing');
  await shot('desktop-1440x900');

  assert(errors.length === 0, errors.slice(0, 5).join('\n'));
  return 'PASS: phone session console is zero-scroll at 390x844, 430x932, 360x640, 844x390; desktop unchanged';
}
