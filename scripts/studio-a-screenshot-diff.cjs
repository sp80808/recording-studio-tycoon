#!/usr/bin/env node
// Studio A screenshot + hotspot diff harness (#309, follow-up to #248).
// Renders the real Pixi Studio A through tests/studio-scene.html at every premises tier and room tier, and
// probes a click grid to record which hotspot owns each point. Use it to prove a renderer refactor (such as
// moving Studio A onto the layout-profile path) is pixel- and hit-area-neutral:
//   node scripts/studio-a-screenshot-diff.cjs capture <dir>    # write PNGs + hotspots.json
//   node scripts/studio-a-screenshot-diff.cjs compare <dir>    # re-render and diff against <dir> (exit 1 on drift)
//   node scripts/studio-a-screenshot-diff.cjs selfcheck        # render twice and diff: proves the render is deterministic
// Needs Vite on 127.0.0.1:5173 (node_modules/.bin/vite --host 127.0.0.1 --port 5173) and Playwright (PLAYWRIGHT_MODULE or NODE_PATH, default /opt/node-tools).
// Chromium: CHROMIUM_PATH, else Playwright's own. PNG diffing runs inside the browser, so no image deps are needed.
const fs = require('fs');
const os = require('os');
const path = require('path');

const BASE = process.env.STUDIO_URL || 'http://127.0.0.1:5173';
const VIEW = { width: 1280, height: 800 };
const STEP = Number(process.env.PROBE_STEP || 32);
const TOLERANCE = Number(process.env.DIFF_TOLERANCE || 50); // max differing pixels per shot that still counts as a match (selfcheck noise is ~17px, delta 5)
const CONFIGS = [
  ...[1, 2, 3].map((p) => ({ name: `premises-${p}`, q: `premises=${p}&room=1` })),
  ...[2, 3, 4, 5].map((r) => ({ name: `room-${r}`, q: `premises=1&room=${r}` })),
  { name: 'session-active', q: 'premises=2&room=3&active=1&staff=3' },
];

const loadPlaywright = () => {
  for (const spec of [process.env.PLAYWRIGHT_MODULE, 'playwright', '/opt/node-tools/node_modules/playwright'].filter(Boolean)) {
    try { return require(spec); } catch { /* try next */ }
  }
  throw new Error('playwright not found: set PLAYWRIGHT_MODULE or NODE_PATH');
};

const launch = (chromium) => {
  const bundled = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const executablePath = process.env.CHROMIUM_PATH || (fs.existsSync(bundled) ? bundled : undefined);
  return chromium.launch({ headless: true, executablePath, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
};

// Everything animated is pinned: seeded Math.random, a frozen performance.now that only advances while a frame budget runs
// (the Pixi ticker uses it), so the scene is advanced by an exact frame count, and the wandering producer sprite is left out of the hotspot comparison.
const INIT = `(() => {
  let now = 1000; let budget = 0; const raf = window.requestAnimationFrame.bind(window);
  performance.now = () => now; Date.now = () => 1767268800000 + now;
  window.requestAnimationFrame = (cb) => raf(() => { if (budget > 0) { budget--; now += 1000 / 60; } cb(now); });
  window.__step = (frames) => { budget = frames; };
  window.__budget = () => budget;
  let s = 1234567; Math.random = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  window.__hits = []; window.__pt = null;
  document.addEventListener('pointerdown', (e) => { window.__pt = [e.clientX, e.clientY]; }, true);
  let last = null;
  Object.defineProperty(window, '__lastHotspot', { configurable: true, get: () => last, set: (v) => { last = v; if (v && window.__pt) window.__hits.push([v, window.__pt[0], window.__pt[1]]); } });
})();`;

async function renderAll(browser) {
  const out = {};
  for (const cfg of CONFIGS) {
    const page = await browser.newPage({ viewport: VIEW });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript(INIT);
    await page.goto(`${BASE}/tests/studio-scene.html?${cfg.q}`);
    await page.evaluate(() => window.__step(1e6));
    await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
    await page.evaluate(() => window.__step(240));
    await page.waitForFunction(() => window.__budget() === 0, null, { timeout: 60000 });
    const png = await page.screenshot();
    for (let y = STEP / 2; y < VIEW.height; y += STEP) {
      for (let x = STEP / 2; x < VIEW.width; x += STEP) await page.mouse.click(x, y);
    }
    const hits = await page.evaluate(() => window.__hits);
    const hotspots = {};
    for (const [id, x, y] of hits) if (id !== 'producer') (hotspots[id] ||= []).push(`${x},${y}`);
    if (errors.length) console.warn(`[${cfg.name}] page errors: ${errors.join(' | ')}`);
    out[cfg.name] = { png, hotspots };
    await page.close();
  }
  return out;
}

// Pixel diff executed in the browser: counts pixels where any RGB channel differs.
async function diffPng(browser, a, b) {
  const page = await browser.newPage();
  const res = await page.evaluate(async ([x, y]) => {
    const load = (b64) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = `data:image/png;base64,${b64}`; });
    const [ia, ib] = await Promise.all([load(x), load(y)]);
    if (ia.width !== ib.width || ia.height !== ib.height) return { size: false };
    const data = (img) => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0); return g.getImageData(0, 0, img.width, img.height).data; };
    const da = data(ia), db = data(ib);
    let diff = 0; let maxDelta = 0;
    for (let i = 0; i < da.length; i += 4) {
      const d = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2]));
      if (d > 0) { diff++; if (d > maxDelta) maxDelta = d; }
    }
    return { size: true, diff, maxDelta, total: da.length / 4 };
  }, [a.toString('base64'), b.toString('base64')]);
  await page.close();
  return res;
}

const sameHotspots = (a, b) => JSON.stringify(Object.keys(a).sort().map((k) => [k, a[k]])) === JSON.stringify(Object.keys(b).sort().map((k) => [k, b[k]]));

async function compare(browser, left, right, label) {
  let bad = 0;
  for (const cfg of CONFIGS) {
    const l = left[cfg.name], r = right[cfg.name];
    if (!l || !r) { console.log(`MISSING ${cfg.name}`); bad++; continue; }
    const d = await diffPng(browser, l.png, r.png);
    const hs = sameHotspots(l.hotspots, r.hotspots);
    const pixelOk = d.size && d.diff <= TOLERANCE;
    if (!pixelOk || !hs) bad++;
    const counts = Object.entries(l.hotspots).map(([k, v]) => `${k}:${v.length}`).join(' ');
    console.log(`${pixelOk && hs ? 'OK  ' : 'DIFF'} ${label} ${cfg.name}: ${d.size ? `${d.diff}/${d.total} px differ (max channel delta ${d.maxDelta})` : 'size mismatch'}; hotspot cells ${hs ? 'identical' : 'DIFFER'} [${counts}]`);
  }
  return bad;
}

async function main() {
  const [mode, dirArg] = process.argv.slice(2);
  if (!['capture', 'compare', 'selfcheck'].includes(mode)) { console.error('usage: studio-a-screenshot-diff.cjs capture|compare <dir> | selfcheck'); process.exit(2); }
  const { chromium } = loadPlaywright();
  const browser = await launch(chromium);
  try {
    if (mode === 'selfcheck') {
      const a = await renderAll(browser);
      const b = await renderAll(browser);
      process.exitCode = (await compare(browser, a, b, 'run1-vs-run2')) ? 1 : 0;
      return;
    }
    const dir = path.resolve(dirArg || path.join(os.tmpdir(), 'studio-a-diff'));
    if (mode === 'capture') {
      fs.mkdirSync(dir, { recursive: true });
      const cur = await renderAll(browser);
      const hs = {};
      for (const [name, v] of Object.entries(cur)) { fs.writeFileSync(path.join(dir, `${name}.png`), v.png); hs[name] = v.hotspots; }
      fs.writeFileSync(path.join(dir, 'hotspots.json'), JSON.stringify(hs));
      console.log(`captured ${Object.keys(cur).length} configs to ${dir}`);
      return;
    }
    const saved = JSON.parse(fs.readFileSync(path.join(dir, 'hotspots.json'), 'utf8'));
    const base = {};
    for (const cfg of CONFIGS) base[cfg.name] = { png: fs.readFileSync(path.join(dir, `${cfg.name}.png`)), hotspots: saved[cfg.name] };
    const cur = await renderAll(browser);
    process.exitCode = (await compare(browser, base, cur, 'baseline-vs-now')) ? 1 : 0;
  } finally {
    await browser.close();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
