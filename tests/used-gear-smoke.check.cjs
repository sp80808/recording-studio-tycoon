// Real UI smoke, following booking-settlement.check.cjs. Run through Playwright's page.
async (page) => {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' && !/favicon|speed-insights/i.test(message.text())) errors.push(message.text()); });
  const base = process.env.RST_BASE_URL || 'http://127.0.0.1:5194';
  const activities = () => page.getByRole('navigation', { name: 'Studio activities' });
  const recycler = () => page.getByRole('region', { name: 'Studio Recycler' });
  const save = async () => {
    await page.evaluate(() => window.dispatchEvent(new Event('autoSave')));
    return page.evaluate(() => JSON.parse(localStorage.getItem('recordingStudioTycoonSave')).gameState);
  };
  const openGear = async () => {
    await activities().getByRole('button', { name: 'Room', exact: true }).click();
    await recycler().waitFor();
  };
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /New studio/ }).click();
  await page.getByText('Modern Era', { exact: true }).click();
  await page.getByRole('button', { name: /Start in/ }).click();
  for (let i = 0; i < 12; i++) {
    const start = page.getByRole('button', { name: /Start Playing/ });
    if (await start.isVisible()) { await start.click(); break; }
    const next = page.getByRole('button', { name: /^Next/ });
    if (await next.isVisible()) await next.click(); else break;
  }
  await activities().waitFor();
  const guide = page.getByRole('button', { name: 'Dismiss first session guide' });
  if (await guide.isVisible()) await guide.click();
  await openGear();
  const initial = await save();
  assert(initial.dailyClassifieds.listings.length >= 3, 'No initial classifieds');
  const listing = initial.dailyClassifieds.listings[0];
  assert(JSON.parse(decodeURIComponent(listing.equipment.id.slice('gear:'.length)))[0] === initial.saveSeed, 'Initial stock ignored run seed');
  await recycler().getByRole('article').first().getByRole('button', { name: 'Buy used gear' }).click();
  await recycler().getByRole('article').first().getByRole('button', { name: 'Purchased' }).waitFor();
  await recycler().getByLabel('Your gear').selectOption(listing.equipment.id);
  await recycler().getByRole('button', { name: 'Inspect', exact: true }).click();
  await recycler().getByRole('button', { name: 'Inspected', exact: true }).waitFor();
  let purchased = await save();
  assert(purchased.money === initial.money - listing.askingPrice, 'Purchase charged incorrectly');
  assert(purchased.ownedEquipment.some(item => item.id === listing.equipment.id && item.inspected), 'Inspect did not persist');
  // A rare excellent workhorse may need no service. Otherwise start one on the owned find.
  const service = recycler().getByRole('button', { name: /^service$/i });
  if (await service.isEnabled()) {
    await service.click();
    await recycler().getByText(/Unavailable: service completes on day/).waitFor();
    purchased = await save();
    assert(purchased.ownedEquipment.find(item => item.id === listing.equipment.id).maintenance, 'Service did not start');
  }
  const stockBeforeReload = JSON.stringify(purchased.dailyClassifieds);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /Resume studio|Continue/ }).first().click();
  await activities().waitFor();
  await openGear();
  const loaded = await save();
  assert(JSON.stringify(loaded.dailyClassifieds) === stockBeforeReload, 'Reload rerolled daily stock');
  assert(JSON.stringify(loaded.ownedEquipment.find(item => item.id === listing.equipment.id).maintenance) === JSON.stringify(purchased.ownedEquipment.find(item => item.id === listing.equipment.id).maintenance), 'Reload lost downtime');
  await page.getByRole('button', { name: 'Rest and advance day', exact: true }).click();
  const ready = await save();
  assert(!ready.ownedEquipment.find(item => item.id === listing.equipment.id).maintenance, 'Day advance failed to complete service');
  assert(ready.dailyClassifieds.day === ready.currentDay && ready.currentDay === purchased.currentDay + 1, 'Classified day transition failed');
  const conditionBeforeSession = ready.ownedEquipment.find(item => item.id === listing.equipment.id).condition;
  await page.keyboard.press('Escape');
  await activities().getByRole('button', { name: 'Artist', exact: true }).click();
  await page.getByRole('button', { name: 'Book Session' }).first().click();
  await page.getByRole('heading', { name: 'At the console' }).waitFor();
  const reviewTitle = page.getByText(/Project Complete:/);
  for (let i = 0; i < 50; i++) {
    if (await reviewTitle.isVisible()) break;
    const release = page.getByRole('button', { name: 'View session review' });
    if (await release.isVisible()) { await release.click(); continue; }
    const skip = page.getByRole('button', { name: /Skip intervention|Skip/ }).first();
    if (await skip.isVisible()) { await skip.click(); continue; }
    const work = page.getByRole('button', { name: /Work on Project|RECORD TAKE|LOCK TAKE/i }).first();
    if (await work.isVisible() && await work.isEnabled()) { await work.click(); continue; }
    const rest = page.getByRole('button', { name: 'Rest and advance day', exact: true });
    if (await rest.isVisible()) { await rest.click(); continue; }
    await page.waitForTimeout(300);
  }
  await reviewTitle.waitFor({ state: 'visible', timeout: 30000 });
  const review = page.getByRole('dialog').filter({ hasText: /Project Complete:/ });
  await review.getByText(/Overall Quality:/).waitFor({ timeout: 30000 });
  await review.getByRole('button', { name: /Awesome!/ }).click();
  await review.waitFor({ state: 'hidden', timeout: 20000 });
  const settled = await save();
  const used = settled.ownedEquipment.find(item => item.id === listing.equipment.id);
  assert(used.condition < conditionBeforeSession, 'Real session produced no wear');
  assert(settled.financials.reports.length === 1, 'Settlement did not record the session exactly once');
  assert(settled.financials.reports[0].reviewSnippet.includes('Used '), 'Review lacks gear facts');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /Resume studio|Continue/ }).first().click();
  await activities().waitFor();
  const final = await save();
  assert(final.ownedEquipment.find(item => item.id === listing.equipment.id).condition === used.condition, 'Reload changed worn condition');
  assert(final.financials.reports.length === 1, 'Reload duplicated settlement');
  assert(errors.length === 0, errors.slice(0, 8).join('\n'));
  return 'PASS: new studio → classifieds → buy → inspect/service → downtime reload → day advance → session wear → settle → reload';
}
