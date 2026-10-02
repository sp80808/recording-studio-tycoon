// Browser smoke for the k6e.5 Streak Bank (combo cash-out) control.
// Reuses the booking-settlement pattern: dev server on :5173, then
// NODE_PATH=/Users/user/.local/lib/node_modules node -e "const{chromium}=require('playwright');const fs=require('fs');(async()=>{const fn=eval(fs.readFileSync('tests/streak-bank.check.cjs','utf8'));const b=await chromium.launch({headless:true,channel:'chrome'});const p=await b.newPage({viewport:{width:1440,height:900}});try{console.log(await fn(p))}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)})"
async (page) => {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const errors = [];
  page.on('console', message => {
    if (message.type() === 'error' && !/favicon|speed-insights/i.test(message.text())) errors.push(message.text());
  });
  page.on('pageerror', error => errors.push(error.message));
  const base = (typeof process !== 'undefined' && process.env.RST_BASE_URL) || 'http://localhost:5173/';
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });

  // Splash → era → tutorial → studio floor
  await page.getByRole('button', { name: /New studio/ }).click();
  await page.getByText('Modern Era', { exact: true }).click();
  await page.getByRole('button', { name: /Start in/ }).click();
  for (let i = 0; i < 12; i++) {
    const start = page.getByRole('button', { name: /Start Playing/ });
    if (await start.isVisible()) { await start.click(); break; }
    const next = page.getByRole('button', { name: /^Next/ });
    if (await next.isVisible()) await next.click(); else break;
  }
  const activities = page.getByRole('navigation', { name: 'Studio activities' });
  await activities.waitFor();
  await page.locator('canvas').waitFor({ state: 'visible' });

  // Book a session → at the console
  await activities.getByRole('button', { name: 'Artist' }).click();
  await page.getByText('Artist Enquiries').waitFor();
  const book = page.getByRole('button', { name: 'Book Session' }).first();
  await book.waitFor();
  await book.click();
  await page.getByRole('heading', { name: 'At the console' }).waitFor();

  const lockedPreview = page.getByText('STREAK BANK LOCKED');
  const armed = page.getByRole('button', { name: /Streak Bank: tap to bank/ });
  const reviewTitle = page.getByText(/Project Complete:/);
  let sawLocked = false;
  let sawArmed = false;

  // Drive takes: combo 2 → locked preview, combo 3 → armed bank (5 energy/day).
  for (let i = 0; i < 30; i++) {
    if (await armed.isVisible()) { sawArmed = true; break; }
    if (await reviewTitle.isVisible()) break;
    const release = page.getByRole('button', { name: 'View session review' });
    if (await release.isVisible()) { await release.click(); continue; }
    const skip = page.getByRole('button', { name: /Skip intervention|Skip/ }).first();
    if (await skip.isVisible()) { await skip.click(); continue; }
    if (await lockedPreview.isVisible()) sawLocked = true;
    const work = page.getByRole('button', { name: /Work on Project|RECORD TAKE|LOCK TAKE/i }).first();
    if (await work.isVisible() && await work.isEnabled()) { await work.click(); continue; }
    const rest = page.getByRole('button', { name: /Rest & advance day/ }).first();
    if (await rest.isVisible() && !sawLocked) { await rest.click(); continue; }
    await page.waitForTimeout(250);
  }
  assert(sawLocked, 'Locked preview (combo 2) never appeared');
  assert(sawArmed, 'Streak Bank never armed at combo 3+');

  const moneyBefore = await page.locator('[data-reward-target="money"]').innerText();
  const xpBefore = await page.locator('[data-reward-target="xp"]').innerText();

  // Hold through the full 1600ms sweep → STEADY HAND ×1.0 floor, streak spent.
  const box = await armed.boundingBox();
  assert(box, 'Armed bank has no bounding box');
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const hit = await page.evaluate(([x, y]) => {
    const el = document.elementFromPoint(x, y);
    return el ? `${el.tagName}|${String(el.className).slice(0, 90)}` : 'none';
  }, [cx, cy]);
  console.log('DEBUG hit-target:', hit);
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.waitForTimeout(450);
  const chargingVisible = await page.getByText(/SWEEP \d+%|RELEASE NOW/).isVisible();
  console.log('DEBUG charge started:', chargingVisible);
  if (!chargingVisible) throw new Error(`Charge never started — hit target was: ${hit}`);
  await page.waitForTimeout(1300);
  await page.mouse.up();
  console.log('DEBUG pointer released after full sweep');

  const chip = page.locator('[role="status"].chip-grain');
  await chip.waitFor({ timeout: 6000 });
  const chipText = await chip.innerText();
  assert(/STEADY HAND ×1\.0/.test(chipText), `Expected filled-floor chip, got: ${chipText}`);
  assert(/\+\d+ XP/.test(chipText), `Chip missing XP reward: ${chipText}`);
  assert(/\$\d+/.test(chipText), `Chip missing cash reward: ${chipText}`);

  // Payout lands in the HUD; spent streak hides the control again.
  await page.waitForTimeout(1200);
  const parseMoney = (s) => Number(((s.match(/[\d,.]+/) || ['0'])[0]).replace(/[^\d]/g, ''));
  const moneyAfter = await page.locator('[data-reward-target="money"]').innerText();
  const xpAfter = await page.locator('[data-reward-target="xp"]').innerText();
  assert(parseMoney(moneyAfter) > parseMoney(moneyBefore),
    `Money HUD did not grow: ${moneyBefore} → ${moneyAfter}`);
  assert(xpAfter !== xpBefore, `XP HUD did not change: ${xpBefore} → ${xpAfter}`);
  await armed.waitFor({ state: 'hidden', timeout: 6000 });
  assert(!(await lockedPreview.isVisible()), 'Spent streak should hide the bank (combo 0 < 2)');

  assert(errors.length === 0, errors.slice(0, 5).join('\n'));
  return 'PASS: streak bank locked→armed, STEADY HAND ×1.0 hold, payout credited, combo spent, zero console errors';
}
