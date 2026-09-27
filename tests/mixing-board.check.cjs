// Run with the Playwright browser_run_code tool (filename), with Vite on port 5173.
// Tests the real component; no game-state fixtures or production debug routes.
async (page) => {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:5173/tests/mixing-board.html');
  await page.clock.install();
  // A target of 50 exercises channels that begin inside their target zone.
  await page.evaluate(() => { Math.random = () => 0.5; });
  await page.getByRole('button', { name: 'Start mixing' }).click();
  assert(await page.getByText('All channels balanced').count() === 1, 'Initial zone membership is wrong');
  assert(await page.locator('body').evaluate(el => el.scrollWidth <= innerWidth), 'Mobile horizontal overflow');
  const drums = page.getByRole('slider', { name: 'Drums' });
  await drums.focus();
  await drums.press('Home');
  assert(await drums.getAttribute('aria-valuetext') === '0, raise level', 'Keyboard Home must move the fader');
  for (let i = 0; i < 5; i++) await drums.press('PageUp');
  assert(await drums.inputValue() === '50', 'Keyboard PageUp must restore balance');
  // Exercise pointer interaction on the native fader.
  const bounds = await drums.boundingBox();
  await page.mouse.click(bounds.x + bounds.width - 8, bounds.y + bounds.height / 2);
  assert(Number(await drums.inputValue()) > 90, 'Pointer input did not reach the fader');
  await drums.press('Home');
  for (let i = 0; i < 5; i++) await drums.press('PageUp');
  await page.getByRole('button', { name: 'Print mix' }).click();
  assert(await page.getByRole('heading', { name: 'Perfect mix!' }).count() === 1, 'Perfect result missing');
  await page.clock.runFor(20000);
  assert(await page.locator('#rewards').getAttribute('data-count') === '0', 'Rewards must wait for collection');
  assert(await drums.isDisabled(), 'Result faders must be locked');
  await page.getByRole('button', { name: 'Collect rewards' }).dblclick();
  assert(await page.locator('#rewards').textContent() === '80', 'Perfect score economy changed');
  assert(await page.locator('#rewards').getAttribute('data-count') === '1', 'Duplicate reward delivery');
  await page.reload();
  await page.evaluate(() => { Math.random = () => 0; });
  await page.getByRole('button', { name: 'Start mixing' }).click();
  await page.clock.runFor(15100);
  assert(await page.getByRole('heading', { name: 'Mix captured' }).count() === 1, 'Timeout must show a result');
  await page.getByRole('button', { name: 'Collect rewards' }).click();
  assert(await page.locator('#rewards').textContent() === '0', 'Off-target score must be zero');
  await page.reload();
  await page.getByRole('button', { name: 'Start mixing' }).click();
  await page.getByRole('button', { name: 'Unmount', exact: true }).click();
  await page.clock.runFor(20000);
  assert(await page.locator('#rewards').getAttribute('data-count') === '0', 'Unmount delivered a late reward');
  return 'PASS: mobile layout, initial zones, keyboard + pointer, early finish, persistent result, one-shot rewards, timeout, unmount';
}
