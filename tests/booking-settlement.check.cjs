// Browser smoke for the real splash -> booking -> work -> review -> settlement loop.
// Run with RST_BASE_URL=http://127.0.0.1:5176 NODE_PATH=/Users/user/.local/lib/node_modules node ...
async (page) => {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const errors = [];
  page.on('console', message => {
    if (message.type() === 'error' && !/favicon|speed-insights|Failed to load resource/i.test(message.text())) errors.push(message.text());
  });
  page.on('pageerror', error => errors.push(error.message));
  const base = (typeof process !== 'undefined' && process.env.RST_BASE_URL) || (page.url().startsWith('http') ? page.url() : 'http://localhost:5173/');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /New studio/ }).click();
  await page.getByText('Modern Era', { exact: true }).click();
  await page.getByRole('button', { name: /Choose your producer/ }).click();
  await page.getByText('The Bedroom Beatmaker').first().click();
  await page.getByRole('button', { name: /Open the studio/ }).click();

  for (let i = 0; i < 12; i++) {
    const start = page.getByRole('button', { name: /Start Playing/ });
    if (await start.isVisible()) { await start.click(); break; }
    const next = page.getByRole('button', { name: /^Next/ });
    if (await next.isVisible()) await next.click();
    else break;
  }

  const activities = page.getByRole('navigation', { name: 'Studio activities' });
  await activities.waitFor();
  await page.locator('canvas').waitFor({ state: 'visible' });
  await page.setViewportSize({ width: 390, height: 844 });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile studio overflows horizontally');
  await page.setViewportSize({ width: 1440, height: 900 });

  await activities.getByRole('button', { name: 'Bookings' }).click();
  await page.getByText('Artist Enquiries').waitFor();
  await page.keyboard.press('Escape');
  await page.getByText('Artist Enquiries').first().waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  assert(!(await page.getByText('Artist Enquiries').first().isVisible()), 'Escape did not close bookings');
  await activities.getByRole('button', { name: 'Bookings' }).click();
  const book = page.getByRole('button', { name: 'Book Session' }).first();
  await book.waitFor();
  await book.click();
  await page.getByRole('heading', { name: 'At the console' }).waitFor();

  const reviewTitle = page.getByText(/Project Complete:/);
  for (let i = 0; i < 30; i++) {
    if (await reviewTitle.isVisible()) break;
    const deliver = page.getByRole('button', { name: /Deliver now/ });
    if (await deliver.isVisible()) { await deliver.click(); continue; }
    const release = page.getByRole('button', { name: 'View session review' });
    if (await release.isVisible()) { await release.click(); continue; }
    const skip = page.getByRole('button', { name: /Skip intervention|Skip/ }).first();
    if (await skip.isVisible()) { await skip.click(); continue; }
    const work = page.getByRole('button', { name: /Work on Project|RECORD TAKE|LOCK TAKE/i }).first();
    if (await work.isVisible() && await work.isEnabled()) {
      await work.click();
      continue;
    }
    const rest = page.getByRole('button', { name: /Rest & advance day/ }).first();
    if (await rest.isVisible()) { await rest.click(); continue; }
    await page.waitForTimeout(300);
  }
  await reviewTitle.waitFor({ state: 'visible', timeout: 30000 });
  const review = page.getByRole('dialog').filter({ hasText: /Project Complete:/ });
  await review.getByText(/Overall Quality:/).waitFor({ timeout: 30000 });
  await review.getByText('Rewards', { exact: true }).waitFor({ timeout: 15000 });
  assert(await review.getByText(/Money:/).isVisible(), 'Money reward missing');
  const moneyBefore = await page.locator('[data-reward-target="money"]').innerText();
  await page.keyboard.press('Space'); // fast-forward the review reveal
  const settle = review.getByRole('button', { name: /Awesome!/ });
  await settle.waitFor({ timeout: 30000 });
  await settle.click();
  await review.waitFor({ state: 'hidden', timeout: 20000 });
  await activities.waitFor({ state: 'visible', timeout: 10000 });
  await activities.getByRole('button', { name: 'Bookings' }).click();
  assert(await page.getByRole('button', { name: 'Book Session' }).first().isEnabled(), 'Cannot book after settlement');
  const moneyAfter = await page.locator('[data-reward-target="money"]').innerText();
  assert(moneyAfter !== moneyBefore, 'Money HUD did not update after settlement');
  assert(errors.length === 0, errors.slice(0, 5).join('\n'));
  return 'PASS: splash, mobile layout, floor menu, booking, work, release, review and settlement';
}
