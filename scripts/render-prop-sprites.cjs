// Rasterises public/assets/props/*.svg to 2x PNGs (playwright + chromium).
// Usage: NODE_PATH=<dir with playwright> node scripts/render-prop-sprites.cjs
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'public', 'assets', 'props');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const p = await b.newPage({ deviceScaleFactor: 2 });
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.svg'))) {
    const svg = fs.readFileSync(path.join(dir, f), 'utf8');
    const m = svg.match(/width="(\d+)" height="(\d+)"/);
    await p.setViewportSize({ width: +m[1], height: +m[2] });
    await p.setContent(`<body style="margin:0;background:transparent">${svg}</body>`);
    await p.screenshot({ path: path.join(dir, f.replace('.svg', '.png')), omitBackground: true });
    console.log('rendered', f);
  }
  await b.close();
})();
