// Usage: node scripts/bench/npc-render-bench.cjs  (needs playwright + chromium; see docs/SPRITE_FACTORY.md)
const { createRequire } = require('node:module');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const root = path.join(__dirname, '..', '..');
const esbuild = createRequire(require.resolve('vite', { paths: [root] }))('esbuild');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rst-bench-'));
esbuild.buildSync({
  entryPoints: [path.join(root, 'scripts/bench/npc-render-bench.tsx')], bundle: true, outfile: path.join(dir, 'bench.js'), format: 'iife',
  loader: { '.png': 'dataurl' }, jsx: 'automatic', alias: { '@': path.join(root, 'src') }, define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env': '{}' }, logLevel: 'error', minify: true,
});
fs.writeFileSync(path.join(dir, 'index.html'), '<!doctype html><body style="margin:0"><div id="host"></div><script src="bench.js"></script></body>');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const WINDOW_MS = 4000;
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const rows = [];
  for (const count of [3, 6, 12]) for (const mode of ['pixi', 'dom']) {
    const page = await browser.newPage({ viewport: { width: 900, height: 500 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`file://${dir}/index.html#${mode}:${count}`);
    await page.waitForFunction('window.__ready === true', null, { timeout: 30000 });
    await page.waitForTimeout(1000);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Performance.enable');
    const snap = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
    await page.evaluate('window.__frames.length = 0');
    const a = await snap();
    await page.waitForTimeout(WINDOW_MS);
    const b = await snap();
    const frames = await page.evaluate('window.__frames.slice()');
    const sorted = [...frames].sort((x, y) => x - y);
    rows.push({
      mode, count,
      fps: +(frames.length / (WINDOW_MS / 1000)).toFixed(1),
      p95FrameMs: +sorted[Math.floor(sorted.length * 0.95)].toFixed(1),
      mainThreadBusyMsPerSec: +(((b.TaskDuration - a.TaskDuration) * 1000) / (WINDOW_MS / 1000)).toFixed(1),
      scriptMsPerSec: +(((b.ScriptDuration - a.ScriptDuration) * 1000) / (WINDOW_MS / 1000)).toFixed(1),
      errors: errors.length,
    });
    if (count === 6) await page.screenshot({ path: path.join(process.env.BENCH_SHOTS || dir, `npc-${mode}-${count}.png`) });
    await page.close();
  }
  await browser.close();
  console.table(rows);
  if (process.env.BENCH_JSON) fs.writeFileSync(process.env.BENCH_JSON, JSON.stringify(rows, null, 2) + '\n');
})().catch((e) => { console.error(e); process.exit(1); });
