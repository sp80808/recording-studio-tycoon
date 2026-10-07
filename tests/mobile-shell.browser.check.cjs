// #324/#325/#326 browser evidence: real app, phone/tablet/desktop viewports, real tap geometry.
// Same pattern as tests/booking-settlement.check.cjs (`async (page) => {...}`, throwing asserts).
//   RST_BASE_URL=http://127.0.0.1:5173 (dev server running); RST_SHOT_DIR=<dir> keeps screenshots.
// A notch is simulated by overriding --rst-safe-top (the shared safe-area token) at 59px (Dynamic Island).
// Real-device iOS PWA behaviour (actual env() insets, standalone chrome) is NOT covered here.
async (page) => {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const env = (typeof process !== 'undefined' && process.env) || {};
  const base = env.RST_BASE_URL || 'http://127.0.0.1:5173';
  const browser = page.context().browser();
  const SAFE_TOP = 59;
  const results = [];

  const rectsOverlap = (a, b, pad = 0) => a && b && !(a.right <= b.left + pad || a.left >= b.right - pad || a.bottom <= b.top + pad || a.top >= b.bottom - pad);

  async function session(size, { touch = true, standalone = false, notch = SAFE_TOP } = {}) {
    const ctx = await browser.newContext({ viewport: size, hasTouch: touch, isMobile: touch, deviceScaleFactor: 2 });
    const p = await ctx.newPage();
    await p.addInitScript(({ notch, standalone }) => {
      const style = () => { const s = document.createElement('style'); s.textContent = `:root{--rst-safe-top:${notch}px !important}`; document.head.appendChild(s); };
      if (notch) document.addEventListener('DOMContentLoaded', style);
      if (standalone) {
        const real = window.matchMedia.bind(window);
        // Fake only the standalone query (a MediaQueryList's `matches` is read-only); everything else stays real.
        window.matchMedia = (q) => (/display-mode:\s*standalone/.test(q)
          ? { matches: true, media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false }
          : real(q));
      }
    }, { notch, standalone });
    await p.goto(base, { waitUntil: 'domcontentloaded' });
    await p.evaluate(() => localStorage.clear());
    await p.reload({ waitUntil: 'domcontentloaded' });
    return { ctx, p };
  }
  const shot = async (p, name) => { const dir = env.RST_SHOT_DIR; if (dir) await p.screenshot({ path: `${dir}/${name}.png` }); };
  const rect = (p, sel) => p.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; }, sel);
  // A 44x44 box centred on the control must hit the control itself (real tap area, including hit-slop).
  const tapBoxHits = (p, sel) => p.evaluate((s) => {
    const e = document.querySelector(s); if (!e) return false;
    const r = e.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    return [[-18, -18], [18, -18], [-18, 18], [18, 18], [0, 0]].every(([dx, dy]) => { const hit = document.elementFromPoint(cx + dx, cy + dy); return hit && (hit === e || e.contains(hit)); });
  }, sel);
  const toastRects = (p) => p.evaluate(() => [...document.querySelectorAll('[data-sonner-toast]')].filter((t) => t.getAttribute('data-visible') !== 'false' && t.getAttribute('data-removed') !== 'true' && t.getAttribute('data-mounted') === 'true').map((t) => { const r = t.getBoundingClientRect(); const tf = getComputedStyle(t).transform; return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, text: t.textContent.slice(0, 40), settled: tf === 'none' || /^matrix\(1, 0, 0, 1, 0, 0\)$/.test(tf) }; }));
  // Sonner animates cards in; measure only once their geometry has stopped moving (slow WebGL frames stretch the animation).
  const settledToastRects = async (p) => {
    let last = [];
    for (let i = 0; i < 40; i++) {
      last = await toastRects(p);
      if (last.every((t) => t.settled)) return last;
      await p.waitForTimeout(150);
    }
    return last;
  };
  const fire = (p, title, description, variant) => p.evaluate(async ([t, d, v]) => { const m = await import('/src/hooks/use-toast.ts'); m.toast({ title: t, description: d, variant: v }); }, [title, description, variant]);
  const protectedRects = async (p, sels) => { const out = []; for (const s of sels) { const r = await rect(p, s); if (r && r.width > 0) out.push({ s, r }); } return out; };
  const assertClear = async (p, label, sels) => {
    const toasts = await settledToastRects(p);
    assert(toasts.length <= 1, `${label}: ${toasts.length} foreground cards on a phone`);
    for (const { s, r } of await protectedRects(p, sels)) for (const t of toasts) assert(!rectsOverlap(t, r, 2), `${label}: toast "${t.text}" [${Math.round(t.left)},${Math.round(t.top)}-${Math.round(t.right)},${Math.round(t.bottom)}] covers ${s} [${Math.round(r.left)},${Math.round(r.top)}-${Math.round(r.right)},${Math.round(r.bottom)}]`);
    return toasts;
  };
  // Splash -> Quick start -> studio, unless the caller is already past career setup.
  async function enterStudio(p, fromSplash = true) {
    if (fromSplash) {
      await p.getByRole('button', { name: /New studio/ }).click();
      await p.getByTestId('quick-start').click();
    }
    for (let i = 0; i < 14; i++) {
      const start = p.getByRole('button', { name: /Start Playing/ });
      if (await start.isVisible()) { await start.click(); break; }
      if (await p.locator('[data-rst-studio="mounted"]').count()) break;
      const next = p.getByRole('button', { name: /^Next|Continue|Open the studio/ }).first();
      if (await next.isVisible()) await next.click().catch(() => {});
      await p.waitForTimeout(400);
    }
    await p.locator('[data-rst-studio="mounted"]').first().waitFor({ timeout: 20000 });
    await p.waitForTimeout(1200);
  }

  // ---- Phones ---------------------------------------------------------------------------------
  for (const [name, size] of [['390x844', { width: 390, height: 844 }], ['430x932', { width: 430, height: 932 }], ['360x640', { width: 360, height: 640 }]]) {
    const { ctx, p } = await session(size);
    // Career setup (#324 top clearance, #326 era label)
    await p.getByRole('button', { name: /New studio/ }).click();
    await p.getByTestId('era-picker').waitFor();
    const labels = (await p.getByTestId('era-picker').innerText()).replace(/\s+/g, ' ');
    assert(/1960s/.test(labels) && /1980s/.test(labels) && /2000s/.test(labels) && /2020s/.test(labels), `${name}: era picker shows 1960s/1980s/2000s/2020s, got "${labels}"`);
    assert(!/2024s|2026s/.test(labels), `${name}: era picker shows an arbitrary year + "s"`);
    await p.getByTestId('era-picker').getByRole('radio').last().click();
    assert(/· 2020s/.test(await p.getByTestId('opening-brief').innerText()), `${name}: opening brief reads "· 2020s"`);
    await p.evaluate(() => { window.scrollTo(0, 0); document.querySelectorAll('*').forEach((e) => { if (e.scrollTop) e.scrollTop = 0; }); });
    for (const sel of ['[data-testid="quick-start"]']) {
      const r = await rect(p, sel);
      assert(r.top >= SAFE_TOP + 10, `${name}: quick start begins ${r.top}px, needs >= safe+10 (${SAFE_TOP + 10})`);
      assert(r.height >= 44 && r.width >= 44, `${name}: quick start target ${r.width}x${r.height} < 44`);
      assert(await tapBoxHits(p, sel), `${name}: quick start tap area is obstructed`);
    }
    const back = await p.evaluate(() => { const b = document.querySelector('main header button'); const r = b.getBoundingClientRect(); return { top: r.top, h: r.height, w: r.width }; });
    assert(back.top >= SAFE_TOP + 10 && back.h >= 44, `${name}: Back target ${back.w}x${back.h} at ${back.top}`);
    await shot(p, `${name}-1-career`);

    await p.getByTestId('quick-start').click();
    await enterStudio(p, false);
    // HUD (#324)
    assert((await p.locator('[data-testid="hud-fullscreen"]').count()) === 0, `${name}: fullscreen button must be absent on phones`);
    const hud = await rect(p, '.studio-hud-stats');
    assert(hud.top >= SAFE_TOP + 10, `${name}: HUD starts at ${hud.top}, needs >= safe+10`);
    for (const h of await p.$$eval('.studio-hud-icon', (els) => els.map((e) => { const r = e.getBoundingClientRect(); return [r.width, r.height]; }))) assert(h[0] >= 44 && h[1] >= 44, `${name}: HUD icon ${h} < 44`);
    assert(await tapBoxHits(p, '.studio-hud-icon'), `${name}: HUD icon tap area obstructed`);
    await shot(p, `${name}-2-idle`);

    // Idle + notification (#325). Protected: HUD, chips, guide, CTA, dock.
    const idleProtected = ['.studio-hud-stats', '.studio-hud-controls', '.studio-play-status', '.studio-room-overlay-tl', '.studio-room-overlay-tr', '.first-session-guide', '.studio-primary-action', '.studio-command-dock'];
    await fire(p, 'Working: Clean Tape Heads', '+1 unit');
    await p.waitForTimeout(500);
    const t1 = await assertClear(p, `${name} idle`, idleProtected);
    assert(t1.length === 1, `${name}: expected the working card to be visible`);
    await shot(p, `${name}-3-idle-toast`);
    // Burst: still one foreground card, and the CTA stays tappable underneath.
    await fire(p, 'Story: A drummer mentions a basement', 'Behind his rehearsal rooms.');
    await fire(p, 'Achievement unlocked', 'First booking');
    await fire(p, 'Reputation +1');
    await p.waitForTimeout(500);
    await assertClear(p, `${name} burst`, idleProtected);
    assert(await tapBoxHits(p, '.studio-primary-action'), `${name}: Book a session tap area obstructed while notifications are up`);
    await shot(p, `${name}-4-burst`);

    // Drawer: routine feedback waits; errors surface without covering the close button.
    await p.getByRole('navigation', { name: 'Studio activities' }).getByRole('button', { name: 'Artist' }).click();
    await p.waitForTimeout(700);
    await fire(p, 'Reward earned', 'Daily bonus');
    await p.waitForTimeout(400);
    assert((await toastRects(p)).length === 0, `${name}: routine toast must wait while a drawer is open`);
    await fire(p, 'Could not book', 'Not enough energy', 'destructive');
    await p.waitForTimeout(500);
    const dr = await assertClear(p, `${name} drawer critical`, ['[role="dialog"] button[aria-label*="lose" i]']);
    assert(dr.length === 1, `${name}: error should still surface while a drawer is open`);
    await shot(p, `${name}-5-drawer`);

    // Session + take calibration
    await p.getByRole('button', { name: 'Book Session' }).first().click();
    await p.waitForTimeout(1200);
    await fire(p, 'Session Booked!', 'Deposit banked');
    await p.waitForTimeout(500);
    const sessionProtected = ['[data-rst-action-id="console:record"]', '[data-testid="mobile-session-body"] input[type=range]', '[role="dialog"] button[aria-label*="lose" i]'];
    await assertClear(p, `${name} session`, sessionProtected);
    await shot(p, `${name}-6-session`);
    const arm = p.locator('[data-rst-action-id="console:record"]').first();
    if (await arm.isVisible()) {
      await arm.click();
      await p.waitForTimeout(500);
      await fire(p, 'Achievement unlocked', 'Gold take');
      await p.waitForTimeout(500);
      assert((await toastRects(p)).length === 0, `${name}: nothing may float over the PocketMeter during take calibration`);
      await shot(p, `${name}-7-calibration`);
    }
    results.push(`${name} ok`); if (env.RST_TRACE) console.log('done', name);
    await ctx.close();
  }

  // ---- Short landscape phone ----------------------------------------------------------------
  {
    const { ctx, p } = await session({ width: 844, height: 390 }, { notch: 0 });
    await enterStudio(p);
    assert((await p.locator('[data-testid="hud-fullscreen"]').count()) === 0, 'landscape phone: fullscreen button must be absent');
    await fire(p, 'Working: Clean Tape Heads', '+1 unit');
    await p.waitForTimeout(500);
    await assertClear(p, 'landscape idle', ['.studio-hud-stats', '.studio-hud-controls', '.first-session-guide', '.studio-primary-action', '.studio-command-dock']);
    await shot(p, 'landscape-1-idle-toast');
    results.push('landscape ok'); if (env.RST_TRACE) console.log('done landscape');
    await ctx.close();
  }

  // ---- Tablet-ish + desktop + installed ---------------------------------------------------------
  {
    const { ctx, p } = await session({ width: 1440, height: 900 }, { touch: false, notch: 0 });
    await enterStudio(p);
    assert((await p.locator('[data-testid="hud-fullscreen"]').count()) === 1, 'desktop: fullscreen button must remain');
    assert((await p.locator('.rst-game-notifications').count()) === 0, 'desktop: no legacy notification stack beside Sonner (#325)');
    await shot(p, 'desktop-1-idle');
    results.push('desktop ok');
    await ctx.close();
  }
  {
    const { ctx, p } = await session({ width: 1440, height: 900 }, { touch: false, notch: 0, standalone: true });
    await enterStudio(p);
    assert((await p.locator('[data-testid="hud-fullscreen"]').count()) === 0, 'installed standalone: fullscreen button must be absent even on a wide window');
    results.push('standalone ok');
    await ctx.close();
  }
  {
    const { ctx, p } = await session({ width: 820, height: 1180 }, { touch: false, notch: 0 });
    await enterStudio(p);
    await fire(p, 'Working: Clean Tape Heads', '+1 unit');
    await p.waitForTimeout(400);
    assert((await toastRects(p)).length <= 2, 'tablet: at most the desktop capacity of 2');
    await shot(p, 'tablet-1-idle-toast');
    results.push('tablet ok');
    await ctx.close();
  }
  return `mobile-shell browser check passed: ${results.join(', ')}`;
}
