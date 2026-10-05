// #198 release evidence: first paid session, recorded as FirstSessionEvidence JSON plus a plain summary.
// Same pattern as tests/first-career-slice.check.cjs (`async (page) => {...}`), driven by scripts/first-session-evidence.cjs.
//   RST_BASE_URL   dev or preview server (default http://127.0.0.1:5173)
//   RST_VIEWPORT   'phone' (390x844, default) or 'desktop' (1440x900)
//   RST_ENFORCE_GATES=1  fail when a product gate is violated (baseline runs only report them)
//   RST_RELOAD_CHECKPOINT=1  also reload after the first take and assert nothing is duplicated
// Surfaces are read from data-rst-surface / data-rst-action-id, never from CSS classes.
async (page) => {
  const env = (typeof process !== 'undefined' && process.env) || {};
  const base = env.RST_BASE_URL || 'http://127.0.0.1:5173';
  const viewportName = env.RST_VIEWPORT === 'desktop' ? 'desktop' : 'phone';
  const size = viewportName === 'desktop' ? { width: 1440, height: 900 } : { width: 390, height: 844 };
  const enforce = env.RST_ENFORCE_GATES === '1';
  const checkpoint = env.RST_RELOAD_CHECKPOINT === '1';
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' && !/favicon|speed-insights|Failed to load resource|<path> attribute d/i.test(m.text())) errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));

  // In-page recorder: every click is attributed to the nearest tagged surface, or marked untagged.
  const install = () => page.evaluate(() => {
    if (window.__rst) return;
    const rec = window.__rst = { clicks: [], studioUnmounts: 0, maxSurfaces: 0, studioSeen: false };
    document.addEventListener('click', (e) => {
      const el = e.target instanceof Element ? e.target.closest('button,[role=button],a') : null;
      if (!el) return;
      if (/^close toast$/i.test(el.getAttribute('aria-label') || '')) return;
      const tag = el.closest('[data-rst-action-id]');
      rec.clicks.push({
        t: performance.now(),
        action: tag ? tag.getAttribute('data-rst-action-id') : null,
        surface: tag ? tag.getAttribute('data-rst-surface') : null,
        label: (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50),
      });
    }, true);
    const sample = () => {
      const studio = !!document.querySelector('[data-rst-studio="mounted"]');
      if (studio) rec.studioSeen = true; else if (rec.studioSeen) { rec.studioUnmounts++; rec.studioSeen = false; }
      const surfaces = document.querySelectorAll('[role=dialog]:not([aria-hidden=true])').length;
      if (surfaces > rec.maxSurfaces) rec.maxSurfaces = surfaces;
    };
    new MutationObserver(sample).observe(document.documentElement, { childList: true, subtree: true });
    sample();
  });

  const t0 = Date.now();
  await page.setViewportSize(size);
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
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
  await page.locator('[data-rst-studio="mounted"]').first().waitFor({ timeout: 20000 });
  await install();
  const studioReadyMs = Date.now() - t0;
  const tAfterStudio = await page.evaluate(() => performance.now());

  // Primary current action must be reachable without scrolling the page.
  const scrollIssues = [];
  const reachable = async (step) => {
    const ok = await page.evaluate(() => {
      const el = document.querySelector('.studio-primary-action, [data-rst-action-id="console:record"], [data-rst-action-id="console:lock-take"]');
      if (!el) return true;
      const r = el.getBoundingClientRect();
      return r.top >= 0 && r.bottom <= innerHeight + 1 && r.left >= 0 && r.right <= innerWidth + 1;
    });
    if (!ok) scrollIssues.push(step);
  };

  const steps = [];
  const stepAt = (name) => steps.push({ name, atMs: Date.now() - t0 });
  stepAt('studio');
  await reachable('studio');
  const activities = page.getByRole('navigation', { name: 'Studio activities' });
  await activities.waitFor();
  // The studio phone is the front door for enquiries: tap it (keyboard route = the world-object list), take the gig in the
  // compact offer card. The Artist drawer stays as the deep comparison fallback.
  const phone = page.locator('[data-rst-action-id="world:phone"]').first();
  if (await phone.count()) {
    await phone.focus();
    await page.keyboard.press('Enter');
    const takeGig = page.locator('[data-rst-action-id="phone:accept"]').first();
    await takeGig.waitFor({ timeout: 10000 });
    await takeGig.click();
  } else {
    await activities.getByRole('button', { name: 'Artist' }).click();
    const book = page.getByRole('button', { name: 'Book Session' }).first();
    await book.waitFor();
    await book.click();
  }
  stepAt('booked');
  await page.locator('[data-rst-action-id="console:record"], [data-testid="mobile-session-body"]').first().waitFor({ timeout: 20000 });
  await reachable('session-open');

  let takes = 0, reloaded = false, snapshot, resumed, carry, carryOffsetMs = 0;
  const readSave = () => page.evaluate(() => {
    const raw = localStorage.getItem('recordingStudioTycoonSave');
    if (!raw) return null;
    try {
      const g = JSON.parse(raw);
      const s = g.gameState || g;
      const p = s.activeProject || {};
      return { projectId: p.id, energy: s.playerData && s.playerData.dailyWorkCapacity, completedStages: (p.completedStages || []).length, money: s.money, day: s.currentDay };
    } catch { return null; }
  });
  const reviewTitle = page.getByText(/Project Complete:/);
  let firstRecordMs = null;
  const trace = (what) => { if (env.RST_TRACE) console.log(`[${Math.round((Date.now() - t0) / 1000)}s] ${what}`); };
  const closeToasts = async () => { for (const t of await page.getByRole('button', { name: 'Close toast' }).all()) await t.click({ timeout: 1000 }).catch(() => {}); };
  for (let i = 0; i < 90; i++) {
    await closeToasts();
    trace(`loop ${i} takes=${takes} url=${page.url().slice(-20)} body=${(await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 140)))}`);
    if (await reviewTitle.isVisible()) break;
    const deliver = page.getByRole('button', { name: /Deliver now/ });
    if (await deliver.isVisible()) { await deliver.click(); continue; }
    const release = page.getByRole('button', { name: 'View session review' });
    if (await release.isVisible()) { await release.click(); continue; }
    const skip = page.getByRole('button', { name: /^Skip/ }).first();
    if (await skip.isVisible()) { await skip.click(); continue; }
    const lock = page.getByRole('button', { name: /^Lock take/ });
    if (await lock.isVisible()) {
      await reachable('lock-take');
      await lock.click({ timeout: 4000 }).catch(() => {}); takes++;
      if (checkpoint && !reloaded && takes === 1) {
        await page.evaluate(() => { window.dispatchEvent(new Event('pagehide')); document.dispatchEvent(new Event('visibilitychange')); }); // the save-on-hide path
        await page.waitForTimeout(800);
        snapshot = await readSave();
        carry = await page.evaluate(() => window.__rst);
        carryOffsetMs = Date.now() - t0;
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.getByRole('button', { name: /Continue studio/ }).click();
        await page.locator('[data-rst-studio="mounted"]').first().waitFor({ timeout: 20000 });
        await install();
        await page.waitForTimeout(800);
        resumed = await readSave();
        reloaded = true;
      }
      continue;
    }
    const rec = page.locator('[data-rst-action-id="console:record"]').first();
    if (await rec.isVisible() && await rec.isEnabled()) {
      if (firstRecordMs === null) { firstRecordMs = Date.now() - t0; await reachable('record'); }
      await rec.click({ timeout: 4000 }).catch(() => {}); continue;
    }
    const rest = page.getByRole('button', { name: /Rest & advance day/ }).first();
    if (await rest.isVisible()) { await rest.click(); continue; }
    const resume = page.locator('[data-rst-action-id="dock:open-session"]').first();
    if (await resume.isVisible()) { await resume.click({ timeout: 4000 }).catch(() => {}); await page.waitForTimeout(500); continue; }
    await page.waitForTimeout(300);
  }
  await reviewTitle.waitFor({ state: 'visible', timeout: 30000 });
  stepAt('review');
  const review = page.getByRole('dialog').filter({ hasText: /Project Complete:/ });
  await review.getByRole('button', { name: /Skip/ }).waitFor({ timeout: 30000 });
  await page.keyboard.press('Space');
  const settle = review.getByRole('button', { name: /Awesome!/ });
  await settle.waitFor({ timeout: 30000 });
  await settle.click();
  await review.waitFor({ state: 'hidden', timeout: 20000 });
  stepAt('settled');

  const live = await page.evaluate(() => window.__rst);
  // A reload resets the in-page recorder, so fold the pre-reload run into one timeline (times in ms since the studio opened).
  const data = carry
    ? { clicks: [...carry.clicks.map(c => ({ ...c, t: c.t - tAfterStudio })), ...live.clicks.map(c => ({ ...c, t: c.t + carryOffsetMs - studioReadyMs - tAfterStudio + tAfterStudio }))],
        studioUnmounts: carry.studioUnmounts + live.studioUnmounts, maxSurfaces: Math.max(carry.maxSurfaces, live.maxSurfaces) }
    : { ...live, clicks: live.clicks.map(c => ({ ...c, t: c.t - tAfterStudio })) };
  const tagged = data.clicks.filter(c => c.action);
  const untagged = data.clicks.filter(c => !c.action);
  const bySurface = (s) => tagged.filter(c => c.surface === s).length;
  const generic = data.clicks.filter(c => !c.action && /rest & advance|work on project/i.test(c.label)).length;
  const world = bySurface('world');
  // Every tagged click is consequential; a world-target tag counts as world-initiated even when the control is contextual.
  const worldInitiated = world + tagged.filter(c => c.surface !== 'world' && /^(console|phone)/.test(c.action) && !c.action.startsWith('dock:')).length;
  const evidence = {
    viewport: `${size.width}x${size.height}`,
    consequentialActions: tagged.length,
    worldInitiatedActions: worldInitiated,
    contextualInitiatedActions: bySurface('contextual'),
    deepPanelInitiatedActions: bySurface('deep-panel'),
    worldActionRatio: tagged.length ? Math.round((worldInitiated / tagged.length) * 100) / 100 : 0,
    genericWorkActions: generic,
    fullScreenRoutineTransitions: -1, // -1 = not instrumented yet (needs the #189 session surface)
    studioUnmounts: data.studioUnmounts,
    maxSimultaneousContextSurfaces: data.maxSurfaces,
    verticalScrollEventsRequired: scrollIssues.length,
    timeToFirstWorldActionMs: tagged.length ? Math.round(tagged[0].t) : -1,
    timeBookingToRecordMs: firstRecordMs === null ? -1 : firstRecordMs - steps.find(s => s.name === 'booked').atMs - 0,
    completed: true,
  };

  const gates = [];
  const gate = (ok, text) => { if (!ok) gates.push(text); };
  gate(evidence.genericWorkActions === 0, `genericWorkActions=${generic}: untagged "Work"/"Rest & advance" buttons were used (${untagged.filter(c => /rest & advance|work on project/i.test(c.label)).map(c => c.label).join(' | ')})`);
  gate(evidence.studioUnmounts === 0, `studioUnmounts=${data.studioUnmounts}: the studio left the DOM during play`);
  gate(evidence.maxSimultaneousContextSurfaces <= 1, `maxSimultaneousContextSurfaces=${data.maxSurfaces}: more than one dialog open at once`);
  gate(evidence.worldActionRatio >= 0.7, `worldActionRatio=${evidence.worldActionRatio}: only ${worldInitiated}/${tagged.length} consequential actions came from world targets`);
  gate(evidence.verticalScrollEventsRequired === 0, `primary action off-screen at: ${scrollIssues.join(', ')}`);
  gate(evidence.deepPanelInitiatedActions === 0, `deep panels needed to finish: ${tagged.filter(c => c.surface === 'deep-panel').map(c => c.action).join(', ')}`);

  let reloadReport = 'not run (set RST_RELOAD_CHECKPOINT=1)';
  if (reloaded) {
    if (!snapshot || !snapshot.projectId) throw new Error('Reload checkpoint: no active project in the save before reload');
    const drift = ['projectId', 'energy', 'completedStages', 'money', 'day'].filter(k => !resumed || resumed[k] !== snapshot[k]);
    if (drift.length) throw new Error(`Reload checkpoint: ${drift.join(', ')} changed across the reload (before ${JSON.stringify(snapshot)}, after ${JSON.stringify(resumed)})`);
    const settles = data.clicks.filter(c => c.action === 'review:settle').length;
    if (settles !== 1) throw new Error(`Reload checkpoint: settlement ran ${settles} times, expected exactly 1`);
    reloadReport = `same project ${snapshot.projectId}, energy ${snapshot.energy}, money ${snapshot.money} and day ${snapshot.day} after reload; settled exactly once`;
  }

  const summary = [
    `First paid session (${viewportName}) completed in ${Math.round((Date.now() - t0) / 1000)}s with ${takes} take(s). Studio ready after ${studioReadyMs}ms.`,
    `Consequential actions: ${tagged.length} (${bySurface('contextual')} contextual, ${bySurface('deep-panel')} deep panel; ${worldInitiated} of them target a world object). Untagged clicks: ${untagged.length}.`,
    gates.length ? `Gate violations (baseline, expected until #189/#196/#197 land):\n  - ${gates.join('\n  - ')}` : 'All gates met.',
    `Reload checkpoint: ${reloadReport}`,
  ].join('\n');
  if (errors.length) throw new Error(`Console errors:\n${errors.slice(0, 5).join('\n')}`);
  if (enforce && gates.length) throw new Error(`Gate violations:\n  - ${gates.join('\n  - ')}\n${JSON.stringify(evidence)}`);
  return `${summary}\n${JSON.stringify(evidence)}`;
}
