// #260 first-session browser check: Overdrive, Combo and Streak Bank are hidden at the start of a new career,
// then revealed one at a time, in order, as the career earns them; the Experienced Producer start has them all.
// Same pattern as tests/first-career-slice.check.cjs (`async (page) => {...}`, throwing asserts).
//   RST_BASE_URL=http://127.0.0.1:5173 (dev or preview server); driven by scripts/feature-unlocks-first-session.cjs
// Progress for the reveal order is injected into the local save (the unlock itself is derived from history, so a
// save with the right history is exactly what a player who earned it would have).
async (page) => {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' && !/favicon|speed-insights|Failed to load resource|<path> attribute d/i.test(m.text())) errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));
  const base = (typeof process !== 'undefined' && process.env.RST_BASE_URL) || 'http://127.0.0.1:5173';
  const SAVE = 'recordingStudioTycoonSave';
  await page.setViewportSize({ width: 1440, height: 900 });

  const overdriveButton = () => page.getByRole('button', { name: /Arm overdrive|Overdrive engaged/i });
  const streakBank = () => page.locator('[aria-label*="Streak Bank"]');
  const reveal = () => page.locator('[data-rst-feature-reveal]');

  const startCareer = async (experienced) => {
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /New studio/ }).click();
    await page.getByRole('button', { name: /Choose an era/ }).click();
    await page.getByText('Modern Era', { exact: true }).click();
    await page.getByRole('button', { name: /Create your producer/ }).click();
    await page.getByRole('button', { name: /Choose a role/ }).click();
    await page.getByText('The Bedroom Beatmaker').first().click();
    const box = page.getByTestId('experienced-producer');
    assert(await box.isVisible(), 'Experienced Producer option is not offered on the role step');
    assert(!(await box.isChecked()), 'Experienced Producer must be off by default');
    if (experienced) await box.check();
    await page.getByRole('button', { name: /Open the studio/ }).click();
    for (let i = 0; i < 12; i++) {
      const start = page.getByRole('button', { name: /Start Playing/ });
      if (await start.isVisible()) { await start.click(); break; }
      const next = page.getByRole('button', { name: /^Next/ });
      if (await next.isVisible()) await next.click(); else break;
    }
    await page.getByRole('navigation', { name: 'Studio activities' }).waitFor();
  };
  const bookFirstSession = async () => {
    await page.getByRole('navigation', { name: 'Studio activities' }).getByRole('button', { name: 'Artist' }).click();
    const book = page.getByRole('button', { name: 'Book Session' }).first();
    await book.waitFor();
    await book.click();
    await page.getByRole('button', { name: /Work on Project|RECORD TAKE|Arm take/i }).first().waitFor({ timeout: 15000 });
  };
  // The save is flushed when the page unloads, so reload first to capture the live session, then patch it.
  const editSave = async (patchSource) => { await page.reload({ waitUntil: 'domcontentloaded' }); return page.evaluate(([key, src]) => {
    const wrap = JSON.parse(localStorage.getItem(key));
    new Function('g', src)(wrap.gameState);
    localStorage.setItem(key, JSON.stringify(wrap));
  }, [SAVE, patchSource]); };
  const continueSession = async () => {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /Continue studio/ }).click();
    const resume = page.getByRole('button', { name: /Continue session/ });
    await resume.waitFor({ timeout: 20000 });
    await resume.click();
    await page.getByRole('button', { name: /Work on Project|RECORD TAKE|Arm take/i }).first().waitFor({ timeout: 20000 });
  };
  const gotIt = async (feature) => {
    const banner = page.locator(`[data-rst-feature-reveal="${feature}"]`);
    await banner.waitFor({ timeout: 10000 });
    assert((await reveal().count()) === 1, `More than one reveal on screen while revealing ${feature}`);
    await banner.getByRole('button', { name: /Got it/ }).click();
    await banner.waitFor({ state: 'hidden' });
  };
  const fakeReports = (n) => `g.financials.reports = Array.from({length:${n}},(_, i)=>({projectId:'p'+i}));`;

  // 1. New career, first paid session: no advanced controls, no reveal.
  await startCareer(false);
  await bookFirstSession();
  assert((await overdriveButton().count()) === 0, 'Overdrive is visible in the first paid session');
  assert((await streakBank().count()) === 0, 'Streak Bank is visible in the first paid session');
  assert((await reveal().count()) === 0, 'A feature reveal appeared in the first paid session');

  // 2. Same career after 2 settled sessions and a Silver take: Overdrive only, revealed once.
  await editSave(fakeReports(2) + "g.featureProgress = { bestCombo: 0, goodTake: true, seen: [] }; (g.activeProject || g.activeProjects[0]).comboCount = 2;");
  await continueSession();
  await gotIt('overdrive');
  assert((await overdriveButton().count()) === 1, 'Overdrive did not appear after its reveal');
  assert((await streakBank().count()) === 0, 'Streak Bank appeared before Combo was earned');
  assert((await reveal().count()) === 0, 'Combo was revealed together with Overdrive');

  // 3. Four sessions: Combo reveals next, Streak Bank still waits for a x3 combo.
  await editSave(fakeReports(4) + "g.featureProgress.seen = ['overdrive'];");
  await continueSession();
  await gotIt('combo');
  assert((await streakBank().count()) === 0, 'Streak Bank appeared before a x3 combo');

  // 4. A x3 combo after Combo: Streak Bank reveals last, and the control exists.
  await editSave("g.featureProgress.seen = ['overdrive','combo']; g.featureProgress.bestCombo = 3; (g.activeProject || g.activeProjects[0]).comboCount = 3;");
  await continueSession();
  await gotIt('streak-bank');
  assert((await streakBank().count()) >= 1, 'Streak Bank control missing after its reveal');
  await continueSession();
  assert((await reveal().count()) === 0, 'A reveal came back after being acknowledged and reloaded');
  assert((await overdriveButton().count()) === 1, 'Overdrive lost after reload');

  // 5. Experienced Producer: everything from the first session, nothing announced.
  await startCareer(true);
  await bookFirstSession();
  assert((await overdriveButton().count()) === 1, 'Experienced Producer start is missing Overdrive');
  assert((await reveal().count()) === 0, 'Experienced Producer start shows a reveal');
  await editSave("g.activeProject.comboCount = 2;");
  await continueSession();
  assert((await streakBank().count()) >= 1, 'Experienced Producer start is missing Streak Bank');

  assert(errors.length === 0, errors.slice(0, 5).join('\n'));
  return 'PASS: Overdrive/Combo/Streak Bank hidden at start, revealed in order one at a time, Experienced Producer start has all';
}
