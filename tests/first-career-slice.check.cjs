// #153 release gate: first-career vertical slice on a phone, with the playtest metrics measured.
// Same pattern as tests/booking-settlement.check.cjs (`async (page) => {...}`, throwing asserts).
//   RST_BASE_URL=http://127.0.0.1:5173 (dev or preview server), then drive through Playwright.
// Walks a brand-new player: new studio -> first paid booking -> take loop -> review -> settlement
// -> money/rep/level visibly up -> second booking offered and started without any instruction ->
// reload and Continue. Returns the same numbers the external playtest records (see docs/PLAYTEST.md).
async (page) => {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const errors = [];
  page.on('console', message => {
    if (message.type() === 'error' && !/favicon|speed-insights|Failed to load resource|<path> attribute d/i.test(message.text())) errors.push(message.text());
  });
  page.on('pageerror', error => errors.push(error.message));
  const base = (typeof process !== 'undefined' && process.env.RST_BASE_URL) || 'http://127.0.0.1:5173';
  const t0 = Date.now();
  const marks = {};
  const mark = (name) => { marks[name] = Math.round((Date.now() - t0) / 1000); };
  const hud = () => page.evaluate(() => {
    const money = document.querySelector('[data-reward-target="money"]');
    return { money: money ? money.textContent.trim() : '', hud: (document.querySelector('header.studio-hud') || document.body).textContent.replace(/\s+/g, ' ').slice(0, 160) };
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
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
  mark('studioOpen');
  const before = await hud();
  assert(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)), 'Studio overflows horizontally on a phone');

  // First paid booking: the Artist route is one tap, and an enquiry can be booked from it.
  await activities.getByRole('button', { name: 'Artist' }).click();
  const book = page.getByRole('button', { name: 'Book Session' }).first();
  await book.waitFor();
  assert(await page.getByTestId('booking-cost-line').first().isVisible(), 'Enquiry shows no booking terms');
  await book.click();
  await page.getByTestId('mobile-session-body').waitFor();
  mark('firstBooking');

  // Take loop through to the review. Only press what is on screen, as a player would.
  const reviewTitle = page.getByText(/Project Complete:/);
  let takes = 0;
  for (let i = 0; i < 80; i++) {
    if (await reviewTitle.isVisible()) break;
    const deliver = page.getByRole('button', { name: /Deliver now/ });
    if (await deliver.isVisible()) { await deliver.click(); continue; }
    const release = page.getByRole('button', { name: 'View session review' });
    if (await release.isVisible()) { await release.click(); continue; }
    const skip = page.getByRole('button', { name: /Skip intervention|Skip/ }).first();
    if (await skip.isVisible()) { await skip.click(); continue; }
    const lock = page.getByRole('button', { name: /^Lock take/ });
    if (await lock.isVisible()) { await lock.click().catch(() => {}); takes++; continue; }
    const work = page.getByRole('button', { name: /Work on Project|RECORD TAKE/i }).first();
    if (await work.isVisible() && await work.isEnabled()) { await work.click().catch(() => {}); continue; }
    const rest = page.getByRole('button', { name: /Rest & advance day/ }).first();
    if (await rest.isVisible()) { await rest.click(); continue; }
    await page.waitForTimeout(300);
  }
  await reviewTitle.waitFor({ state: 'visible', timeout: 30000 });
  mark('firstSessionComplete');
  const review = page.getByRole('dialog').filter({ hasText: /Project Complete:/ });
  await review.getByRole('button', { name: /Skip/ }).waitFor({ timeout: 30000 });
  await page.keyboard.press('Space');
  await review.getByText(/Overall Quality:/).waitFor({ timeout: 30000 });
  assert(await review.getByText(/Money:/).isVisible(), 'Review shows no money reward');
  const settle = review.getByRole('button', { name: /Awesome!/ });
  await settle.waitFor({ timeout: 30000 });
  await settle.click();
  await review.waitFor({ state: 'hidden', timeout: 20000 });
  await activities.waitFor({ state: 'visible', timeout: 10000 });
  mark('settled');
  const after = await hud();
  assert(after.money !== before.money, `Money did not move after the first paid session (${before.money} -> ${after.money})`);

  // Second project: the board still offers work and the player can start it with one tap.
  await activities.getByRole('button', { name: 'Artist' }).click();
  const second = page.getByRole('button', { name: 'Book Session' }).first();
  await second.waitFor({ timeout: 10000 });
  assert(await second.isEnabled(), 'No second booking available after the first settles');
  await second.click();
  await page.getByTestId('mobile-session-body').waitFor();
  mark('secondBooking');

  // Leaving persists the career.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /Continue studio/ }).waitFor({ timeout: 15000 });
  assert(errors.length === 0, errors.slice(0, 5).join('\n'));
  return `PASS: first career slice. seconds=${JSON.stringify(marks)} takes=${takes} money ${before.money} -> ${after.money}`;
}
