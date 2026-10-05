// Browser smoke for the room layout engine (#248). Needs Vite on 127.0.0.1:5173 and Playwright.
// Switches through Studio A and every extra room on one mounted WebGLCanvas and asserts:
//   - exactly one canvas/Pixi Application stays mounted, and it is the same element throughout,
//   - nothing throws while rooms swap (no leaked tickers or handlers blowing up),
//   - each room's signature hotspot is clickable and reports the expected id.
// Run: node -e "const{chromium}=require('playwright');const fs=require('fs');(async()=>{const fn=eval(fs.readFileSync('tests/room-layouts.check.cjs','utf8'));const b=await chromium.launch({headless:true});const p=await b.newPage({viewport:{width:1280,height:800}});try{console.log(await fn(p))}finally{await b.close()}})()"
async (page) => {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('http://127.0.0.1:5173/tests/studio-scene.html?premises=1');
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
  await page.evaluate(() => { window.__canvas = document.querySelector('canvas'); });
  const rooms = [
    { type: '', click: null },
    { type: 'vocal-suite', click: [645, 400], expect: 'liveRoom' },
    { type: 'live-room', click: [700, 420], expect: 'liveRoom' },
    { type: 'mix-suite', click: [670, 420], expect: 'console' },
    { type: 'project-studio', click: null },
  ];
  for (const room of rooms) {
    await page.evaluate((t) => window.__setRoom(t, true), room.type);
    await page.waitForTimeout(700);
    const state = await page.evaluate(() => ({ canvases: document.querySelectorAll('canvas').length, same: document.querySelector('canvas') === window.__canvas }));
    assert(state.canvases === 1, `room ${room.type || 'studio-a'}: ${state.canvases} canvases mounted`);
    assert(state.same, `room ${room.type || 'studio-a'}: the Pixi canvas was recreated on room switch`);
    if (room.click) {
      await page.evaluate(() => { window.__lastHotspot = null; });
      await page.mouse.click(room.click[0], room.click[1]);
      const hit = await page.evaluate(() => window.__lastHotspot);
      assert(hit === room.expect, `${room.type}: clicking its hotspot gave ${hit}, expected ${room.expect}`);
    }
  }
  const real = errors.filter((e) => !/AudioContext|GL Driver|GPU stall/.test(e));
  assert(real.length === 0, `console errors while switching rooms: ${real.join(' | ')}`);
  return 'room layouts smoke passed';
}
