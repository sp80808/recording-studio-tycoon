// Browser check for the career-start character creator (#212/#215/#214).
// Same harness shape as tests/booking-settlement.check.cjs: an async (page) => string function.
// Run (see CLAUDE.md for the playwright wrapper), with RST_BASE_URL pointing at a dev or preview server:
//   RST_BASE_URL=http://127.0.0.1:4311 NODE_PATH=/opt/node-tools/node_modules node -e "const{chromium}=require('playwright');const fs=require('fs');(async()=>{const fn=eval(fs.readFileSync('tests/character-creator.browser.check.cjs','utf8'));const b=await chromium.launch({headless:true,executablePath:process.env.RST_CHROMIUM});const p=await b.newPage();try{console.log(await fn(p))}finally{await b.close()}})()"
async (page) => {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const base = (typeof process !== 'undefined' && process.env.RST_BASE_URL) || 'http://localhost:5173/';
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

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

  assert(errors.length === 0, `page errors: ${errors.join(' | ')}`);
  return 'character creator browser checks passed';
}
