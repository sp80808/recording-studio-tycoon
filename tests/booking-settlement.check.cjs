// Run with the Playwright browser_run_code tool (filename), with Vite on port 5173.
// CLI: start `pnpm dev --port 5173 --strictPort`, then run this file through a Playwright page:
//   NODE_PATH=/Users/user/.local/lib/node_modules node -e "const{chromium}=require('playwright');const fs=require('fs');(async()=>{const fn=eval(fs.readFileSync('tests/booking-settlement.check.cjs','utf8'));const b=await chromium.launch({headless:true,channel:'chrome'});const p=await b.newPage({viewport:{width:1440,height:900}});try{console.log(await fn(p))}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)})"
// Tests the real booking -> work -> review -> settlement spine (GH #8 P0); no game-state fixtures.
async (page) => {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (/favicon/i.test(text)) return;
    errors.push(text);
  });
  page.on('pageerror', (err) => errors.push(String((err && err.message) || err)));
  page.on('dialog', (d) => { d.dismiss().catch(() => {}); });

  const count = async (locator) => {
    try { return await locator.count(); } catch { return 0; }
  };

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Splash -> era selection (default era).
  const newGame = page.getByRole('button', { name: /Start New Game/ });
  await newGame.waitFor({ state: 'visible', timeout: 90000 });
  await newGame.click();
  await page.getByText(/Choose Your Musical Journey/).waitFor({ state: 'visible', timeout: 30000 });
  const eraCard = page.getByText('Modern Era').first();
  await eraCard.waitFor({ state: 'visible', timeout: 15000 });
  await eraCard.click();
  const startIn = page.getByRole('button', { name: /Start in/ });
  await startIn.waitFor({ state: 'visible', timeout: 15000 });
  await startIn.click();

  // Tutorial: Next chain ending in Start Playing (Skip is a confirm() no-op).
  for (let i = 0; i < 12; i++) {
    const startPlaying = page.getByRole('button', { name: /Start Playing/ });
    if ((await count(startPlaying)) > 0) {
      try {
        if (await startPlaying.first().isVisible()) { await startPlaying.first().click(); break; }
      } catch { /* re-render race; re-poll */ }
    }
    const next = page.getByRole('button', { name: /^Next/ });
    if ((await count(next)) > 0) {
      try {
        if (await next.first().isVisible()) { await next.first().click(); continue; }
      } catch { continue; }
    }
    break;
  }
  try {
    const again = page.getByRole('button', { name: /Start Playing/ }).first();
    await again.waitFor({ state: 'visible', timeout: 3000 });
    await again.click();
  } catch { /* tutorial already dismissed */ }

  // Studio home.
  await page.getByText(/STUDIO FLOOR/).first().waitFor({ state: 'visible', timeout: 30000 });
  assert((await count(page.getByText('Artist Enquiries'))) > 0, 'Studio did not show Artist Enquiries');

  // Start a project: phone inspector hotspot first, ProjectList fallback.
  let booked = false;
  try {
    const canvas = page.locator('canvas').first();
    await canvas.waitFor({ state: 'visible', timeout: 10000 });
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width * 0.18, box.y + box.height * 0.35);
      const takeGig = page.getByRole('button', { name: 'Take Gig' });
      try {
        await takeGig.first().waitFor({ state: 'visible', timeout: 3000 });
        const n = await takeGig.count();
        for (let i = 0; i < n; i++) {
          if (await takeGig.nth(i).isEnabled()) { await takeGig.nth(i).click(); booked = true; break; }
        }
      } catch { try { await page.keyboard.press('Escape'); } catch {} }
    }
  } catch { /* canvas hotspot unavailable; use the project list */ }
  if (!booked) {
    const book = page.getByRole('button', { name: 'Book Session' });
    await book.first().waitFor({ state: 'visible', timeout: 20000 });
    const n = await book.count();
    for (let i = 0; i < n; i++) {
      if (await book.nth(i).isEnabled()) { await book.nth(i).click(); booked = true; break; }
    }
    assert(booked, 'No enabled Book Session button found');
  }
  try {
    await page.getByRole('button', { name: /Work on Project/ }).first().waitFor({ state: 'visible', timeout: 20000 });
  } catch {
    await page.getByText(/Session in progress/).first().waitFor({ state: 'visible', timeout: 20000 });
  }

  const advanceDay = async () => {
    const rest = page.getByRole('button', { name: /Rest & advance day/ });
    if ((await count(rest)) > 0) {
      try { await rest.first().click({ timeout: 8000 }); } catch { /* fall through to drawer */ }
    } else {
      const manage = page.getByRole('button', { name: /Open management panel/ });
      if ((await count(manage)) > 0) {
        try { await manage.first().click({ timeout: 8000 }); } catch {}
      }
      const adv = page.getByRole('button', { name: /^Advance Day$/ });
      await adv.first().waitFor({ state: 'visible', timeout: 15000 });
      await adv.first().click();
    }
    try { await page.getByRole('button', { name: /Continue Building Your Legacy/ }).first().click({ timeout: 4000 }); } catch {}
    try { await page.keyboard.press('Escape'); } catch {}
  };

  // Work sessions until the review modal appears.
  const reviewTitle = page.getByText(/Project Complete:|Project Review/);
  let reviewed = false;
  for (let i = 0; i < 30; i++) {
    if ((await count(reviewTitle)) > 0) { reviewed = true; break; }
    if ((await count(page.getByText('Optional Studio Intervention'))) > 0) {
      try { await page.getByRole('button', { name: 'Skip' }).first().click({ timeout: 3000 }); } catch {}
    }
    const work = page.getByRole('button', { name: /Work on Project/ });
    if ((await count(work)) > 0) {
      try {
        if (await work.first().isEnabled()) await work.first().click();
        else { await advanceDay(); continue; }
      } catch { await advanceDay(); continue; }
    } else if ((await count(page.getByRole('button', { name: /No Energy Left/ }))) > 0) {
      await advanceDay();
      continue;
    }
    try {
      await reviewTitle.first().waitFor({ state: 'visible', timeout: 2500 });
      reviewed = true;
      break;
    } catch { /* not yet; keep working */ }
  }
  if (!reviewed) {
    await reviewTitle.first().waitFor({ state: 'visible', timeout: 30000 });
  }

  // Review shows quality + rewards; settle; back at studio unblocked.
  // Scope to the review dialog: the dashboard also contains "Rewards ..." copy.
  const review = page.getByRole('dialog').filter({ hasText: /Project Complete:/ });
  await review.getByText(/Overall Quality:/).waitFor({ state: 'visible', timeout: 30000 });
  await review.getByText('Rewards', { exact: true }).waitFor({ state: 'visible', timeout: 15000 });
  assert((await count(review.getByText(/Money:/))) > 0, 'Review missing money reward');
  assert((await count(review.getByText(/Reputation:/))) > 0, 'Review missing reputation reward');
  const settle = review.getByRole('button', { name: /Awesome!/ });
  await settle.waitFor({ state: 'visible', timeout: 30000 });
  await settle.click({ timeout: 60000 });
  try { await page.getByText(/Project Complete:/).first().waitFor({ state: 'hidden', timeout: 20000 }); } catch {}
  const bookAfter = page.getByRole('button', { name: 'Book Session' });
  await bookAfter.first().waitFor({ state: 'visible', timeout: 20000 });
  let open = false;
  const m = await bookAfter.count();
  for (let i = 0; i < m; i++) {
    if (await bookAfter.nth(i).isEnabled()) { open = true; break; }
  }
  assert(open, 'Studio still blocked after settlement (no enabled Book Session)');
  assert((await count(page.getByText(/STUDIO FLOOR/))) > 0, 'Not back at the studio after settlement');

  // Zero console errors (favicon 404s ignored).
  const realErrors = errors.filter((t) => !/favicon/i.test(t));
  assert(realErrors.length === 0, 'Console errors:\n' + realErrors.slice(0, 10).join('\n'));

  return 'PASS: splash -> tutorial -> booking -> work sessions -> review (quality + rewards) -> settlement, zero console errors';
}
