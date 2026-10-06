// Browser check for the career-start character creator (#212/#215/#214).
// Same harness shape as tests/booking-settlement.check.cjs: an async (page) => string function.
// Run (see CLAUDE.md for the playwright wrapper), with RST_BASE_URL pointing at a dev or preview server:
//   RST_BASE_URL=http://127.0.0.1:4311 NODE_PATH=/opt/node-tools/node_modules node -e "const{chromium}=require('playwright');const fs=require('fs');(async()=>{const fn=eval(fs.readFileSync('tests/character-creator.browser.check.cjs','utf8'));const b=await chromium.launch({headless:true,executablePath:process.env.RST_CHROMIUM});const p=await b.newPage();try{console.log(await fn(p))}finally{await b.close()}})()"
async (page) => {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const base = (typeof process !== 'undefined' && process.env.RST_BASE_URL) || 'http://localhost:5173/';
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const shotDir = typeof process !== 'undefined' ? process.env.RST_SHOT_DIR : undefined;
  // A controllable standard-mapping pad: window.__pad is the connected pad (null = disconnected).
  await page.addInitScript(() => {
    window.__pad = null;
    navigator.getGamepads = () => [window.__pad];
  });
  const connectPad = () => page.evaluate(() => {
    window.__pad = { connected: true, id: 'Xbox 360 Controller (STANDARD GAMEPAD)', index: 0, mapping: 'standard', axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })) };
  });
  const disconnectPad = () => page.evaluate(() => { window.__pad = null; });
  const BTN = { south: 0, east: 1, west: 2, dpadUp: 12, dpadDown: 13, dpadLeft: 14, dpadRight: 15 };
  const press = async (name) => {
    await page.evaluate((i) => { window.__pad.buttons[i] = { pressed: true, touched: true, value: 1 }; }, BTN[name]);
    await page.waitForTimeout(110);
    await page.evaluate((i) => { window.__pad.buttons[i] = { pressed: false, touched: false, value: 0 }; }, BTN[name]);
    await page.waitForTimeout(110);
  };
  const focusInfo = () => page.evaluate(() => {
    const el = document.activeElement;
    return { field: el?.closest?.('[data-field]')?.getAttribute('data-field') ?? null, role: el?.getAttribute?.('role') ?? el?.tagName, inScope: !!el?.closest?.('[data-gamepad-scope]') };
  });

  const openCreator = async (width, height) => {
    await page.setViewportSize({ width, height });
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /New studio/ }).click();
    await page.getByRole('button', { name: /Choose an era/ }).click();
    await page.getByText('Modern Era', { exact: true }).click();
    await page.getByRole('button', { name: /Create your producer/ }).click();
    await page.getByTestId('producer-creator').waitFor();
  };

  // Everything the player can read vs. what the preview was given.
  const snapshot = () => page.evaluate(() => {
    const preview = document.querySelector('[data-testid=producer-preview]');
    const rows = [...document.querySelectorAll('[data-field]')].map((row) => ({
      field: row.getAttribute('data-field'),
      value: row.querySelector('[data-testid^=appearance-value-]')?.textContent?.trim(),
      checked: row.querySelector('[role=radio][aria-checked=true]')?.getAttribute('data-value') ?? null,
      disabled: row.hasAttribute('data-disabled'),
    }));
    return { appearance: JSON.parse(preview.getAttribute('data-appearance')), svg: preview.querySelector('svg').outerHTML, rows };
  });

  await openCreator(1440, 900);

  // One control surface per property: 6 prev/next pairs, 3 swatch groups, nothing around the preview.
  const counts = await page.evaluate(() => ({
    prev: document.querySelectorAll('button[aria-label^="Previous "]').length,
    next: document.querySelectorAll('button[aria-label^="Next "]').length,
    groups: document.querySelectorAll('[data-field]').length,
    swatchGroups: document.querySelectorAll('[role=radiogroup][data-field]').length,
    previewButtons: document.querySelectorAll('[data-testid=producer-preview] button').length,
  }));
  assert(counts.prev === 6 && counts.next === 6, `expected 6 prev/next pairs, got ${counts.prev}/${counts.next}`);
  assert(counts.groups === 9 && counts.swatchGroups === 3, `expected 9 rows (3 swatch), got ${counts.groups}/${counts.swatchGroups}`);
  assert(counts.previewButtons === 0, 'no controls inside the preview');

  // A choice click changes its value text, the stored appearance and the drawing together.
  const before = await snapshot();
  await page.getByRole('button', { name: 'Next Hair' }).click();
  const afterHair = await snapshot();
  assert(afterHair.appearance.hair !== before.appearance.hair, 'hair stored value changes');
  assert(afterHair.rows.find((r) => r.field === 'hair').value !== before.rows.find((r) => r.field === 'hair').value, 'hair label changes');
  assert(afterHair.svg !== before.svg, 'hair change redraws the preview');

  // Direct swatch selection.
  await page.getByRole('radio', { name: 'Neon pink' }).click();
  const afterColour = await snapshot();
  assert(afterColour.appearance.hairColour === 'neon_pink', 'swatch stores the hair colour');
  assert(afterColour.rows.find((r) => r.field === 'hairColour').value === 'Neon pink', 'swatch row shows its value as text');

  // Surprise me: every row text, checked swatch and the preview agree with the stored appearance, in the same render.
  const fieldValueLabels = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-field]')].map((row) => [
    row.getAttribute('data-field'), [...row.querySelectorAll('[role=radio]')].map((r) => [r.getAttribute('data-value'), r.getAttribute('aria-label')]),
  ])));
  let svgChanges = 0;
  let last = await snapshot();
  for (let i = 0; i < 6; i++) {
    await page.getByTestId('producer-randomise').click();
    const now = await snapshot();
    for (const row of now.rows) {
      if (row.disabled) { assert(row.field === 'hairColour' && now.appearance.hair === 'bald', `only hair colour on a bald producer may be disabled (${row.field})`); continue; }
      const stored = now.appearance[row.field];
      if (row.checked !== null) {
        assert(row.checked === stored, `${row.field}: checked swatch ${row.checked} != stored ${stored}`);
        const label = fieldValueLabels[row.field].find(([value]) => value === stored)[1];
        assert(row.value === label, `${row.field}: value text "${row.value}" != swatch name "${label}"`);
      } else {
        assert(row.value && !/_/.test(row.value), `${row.field}: value text "${row.value}" must be a readable name`);
      }
    }
    if (now.svg !== last.svg) svgChanges += 1;
    last = now;
  }
  assert(svgChanges >= 5, `Surprise me should redraw the preview each time (${svgChanges}/6)`);

  // Undo restores the previous look in one step.
  const preUndo = await snapshot();
  await page.getByTestId('producer-randomise').click();
  await page.getByRole('button', { name: /Undo last appearance change/ }).click();
  const postUndo = await snapshot();
  assert(JSON.stringify(postUndo.appearance) === JSON.stringify(preUndo.appearance), 'Undo restores the appearance');

  // No raw ids as visible text.
  const text = await page.getByTestId('producer-creator').innerText();
  assert(!/[a-z]+_[a-z]+/.test(text), `raw enum id leaked into the UI: ${text.match(/[a-z]+_[a-z]+/)?.[0]}`);

  // ---- Keyboard: short, logical traversal; arrows adjust the focused row ----
  await openCreator(1440, 900); // fresh default look (Surprise me above may have rolled a bald producer)
  const tabStops = await page.evaluate(() => [...document.querySelectorAll('[data-testid=producer-creator] *')].filter((el) => el.tabIndex >= 0 && !el.disabled && el.getBoundingClientRect().width > 0).map((el) => el.getAttribute('data-testid') || el.getAttribute('role') || el.tagName));
  assert(tabStops.length <= 12, `creator should have <= 12 tab stops (name, Surprise, 6 carousels, 3 swatch groups), got ${tabStops.length}: ${tabStops}`);
  await page.getByTestId('appearance-value-hair').focus();
  const hairBefore = (await snapshot()).appearance.hair;
  await page.keyboard.press('ArrowRight');
  const hairAfter = (await snapshot()).appearance.hair;
  assert(hairAfter !== hairBefore, 'ArrowRight on the focused carousel changes the value');
  await page.keyboard.press('ArrowLeft');
  assert((await snapshot()).appearance.hair === hairBefore, 'ArrowLeft steps back');
  await page.keyboard.press('Tab');
  assert((await focusInfo()).field === 'hairColour', 'Tab from Hair lands on the Hair colour swatches next');
  assert((await focusInfo()).role === 'radio', 'swatch group exposes its selected radio as the single stop');
  const colourBefore = (await snapshot()).appearance.hairColour;
  await page.keyboard.press('ArrowRight');
  assert((await snapshot()).appearance.hairColour !== colourBefore, 'ArrowRight moves the swatch selection');
  assert((await focusInfo()).role === 'radio' && (await focusInfo()).field === 'hairColour', 'focus follows the selected swatch');

  // ---- Controller: D-pad traversal, left/right adjust, X randomise, B back; focus stays in scope ----
  await connectPad();
  await page.waitForTimeout(150);
  await page.getByTestId('appearance-value-build').focus();
  const buildBefore = (await snapshot()).appearance.build;
  await press('dpadRight');
  assert((await snapshot()).appearance.build !== buildBefore, 'pad right adjusts the focused carousel');
  await press('dpadDown');
  assert((await focusInfo()).field === 'skinTone', `pad down moves to the next property, got ${(await focusInfo()).field}`);
  const skinBefore = (await snapshot()).appearance.skinTone;
  await press('dpadRight');
  assert((await snapshot()).appearance.skinTone !== skinBefore, 'pad right adjusts the focused swatch group');
  assert((await focusInfo()).field === 'skinTone', 'focus stays on the swatch row after adjusting');
  const visited = [];
  for (let i = 0; i < 12; i++) { await press('dpadDown'); const f = await focusInfo(); assert(f.inScope, 'controller focus never leaves the creator screen'); visited.push(f.field ?? f.role); }
  assert(visited.slice(0, 3).join() === 'hair,hairColour,shirt', `pad down visits one stop per property in order, got ${visited}`);
  const beforeX = JSON.stringify((await snapshot()).appearance);
  await press('west');
  assert(JSON.stringify((await snapshot()).appearance) !== beforeX, 'X triggers Surprise me');
  // Mid-screen disconnect: keyboard keeps working and nothing throws.
  await disconnectPad();
  await page.waitForTimeout(150);
  await page.getByTestId('appearance-value-shoes').focus();
  const shoesBefore = (await snapshot()).appearance.shoes;
  await page.keyboard.press('ArrowRight');
  assert((await snapshot()).appearance.shoes !== shoesBefore, 'keyboard still works after the pad disconnects');
  await connectPad();
  await page.waitForTimeout(150);
  await press('east');
  await page.getByRole('heading', { name: /When does your studio open/ }).waitFor({ timeout: 3000 });
  await disconnectPad();

  // ---- Responsive matrix ----
  const matrix = [[1440, 900], [1024, 768], [390, 844], [375, 667], [720, 450]];
  for (const [w, h] of matrix) {
    await openCreator(w, h);
    await page.waitForTimeout(400);
    const m = await page.evaluate(() => {
      const de = document.documentElement;
      const r = (sel) => document.querySelector(sel)?.getBoundingClientRect();
      const nested = [...document.querySelectorAll('*')].filter((el) => {
        const s = getComputedStyle(el);
        return (s.overflowY === 'auto' || s.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 1 && el !== document.body && el !== de;
      }).length;
      const small = [...document.querySelectorAll('[data-testid=producer-creator] button, [data-testid=producer-creator] [role=spinbutton], [data-testid=producer-creator] input')].filter((el) => { const b = el.getBoundingClientRect(); return b.width > 0 && (b.height < 36 || b.width < 36); }).map((el) => el.getAttribute('aria-label') || el.tagName);
      const cta = [...document.querySelectorAll('footer button')].pop().getBoundingClientRect();
      const svg = r('[data-testid=producer-preview] svg');
      return { hOverflow: de.scrollWidth > innerWidth, nested, small, cta: { top: cta.top, bottom: cta.bottom }, svg: { w: svg.width, h: svg.height, left: svg.left, right: svg.right, top: svg.top }, vh: innerHeight, vw: innerWidth };
    });
    const tag = `${w}x${h}`;
    assert(!m.hOverflow, `${tag}: horizontal overflow`);
    assert(m.nested === 0, `${tag}: nested scroll containers (${m.nested})`);
    assert(m.cta.top >= 0 && m.cta.bottom <= m.vh, `${tag}: CTA not fully in view`);
    assert(m.svg.left >= 0 && m.svg.right <= m.vw, `${tag}: preview clipped horizontally`);
    assert(m.svg.h >= (w >= 768 ? 360 : 220), `${tag}: preview too small (${m.svg.h}px)`);
    assert(m.small.length <= 0 || w >= 768, `${tag}: touch targets under 36px: ${m.small}`);
    if (shotDir) await page.screenshot({ path: `${shotDir}/creator-${tag}.png` });
    if (w < 768) {
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForTimeout(150);
      const end = await page.evaluate(() => {
        const preview = document.querySelector('[data-testid=producer-preview]').getBoundingClientRect();
        const last = document.querySelector('[data-field=accessory]').getBoundingClientRect();
        const cta = [...document.querySelectorAll('footer button')].pop().getBoundingClientRect();
        return { previewTop: preview.top, previewBottom: preview.bottom, lastBottom: last.bottom, ctaTop: cta.top };
      });
      assert(end.previewTop >= -1 && end.previewBottom > 100, `${tag}: preview should stay pinned while the list scrolls (${JSON.stringify(end)})`);
      assert(end.lastBottom <= end.ctaTop, `${tag}: last row hidden behind the footer`);
      if (shotDir) await page.screenshot({ path: `${shotDir}/creator-${tag}-scrolled.png` });
    }
    // The creator can be completed at this size.
    await page.getByRole('button', { name: /Choose a role/ }).click();
    await page.getByText('The Bedroom Beatmaker').first().waitFor({ timeout: 3000 });
  }

  // ---- Longest strings and reduced motion ----
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openCreator(390, 844);
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('.appearance-row-value')) el.textContent = 'Wiederherstellungsfähigkeitsbeschreibung extralang';
    for (const el of document.querySelectorAll('.appearance-row-label')) el.textContent = 'Bekleidungsfarbpalette';
  });
  const longOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  assert(!longOverflow, 'long localised strings must not cause horizontal overflow on a phone');
  const transition = await page.evaluate(() => getComputedStyle(document.querySelector('.appearance-step')).transitionDuration);
  assert(/^0s(, 0s)*$/.test(transition), `reduced motion removes control transitions (${transition})`);
  await page.emulateMedia({ reducedMotion: 'no-preference' });

  assert(errors.length === 0, `page errors: ${errors.join(' | ')}`);
  return 'character creator browser checks passed';
}
